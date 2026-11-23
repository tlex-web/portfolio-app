#!/usr/bin/env node

/**
 * Alps overview fetch (16 D-16, D-21): the Copernicus DEM GLO-90 tiles for
 * 43-48° N by 5-16° E -> the overview's committed source grid.
 *
 * MANUAL AND NETWORKED. Never run it in prebuild, lint or CI (T-08-09): CI and
 * Vercel re-derive every overview artifact offline from what this writes. GLO-90
 * feeds only the overview, never a local plate (REQUIREMENTS Out of Scope).
 *
 * Arguments (checked before any network request, so a refusal writes nothing):
 *   --out <dir>   write the two files into <dir> instead of
 *                 data/terrain/overview/ (dry runs outside the repository).
 *
 * Steps:
 *   1. Fetch tileList.txt from the public bucket. A slot is sea only when its
 *      name is absent from that list (T-16-29): a listed tile that fails is a
 *      network failure, never sea.
 *   2. For each of the 72 slots (latitudes 43-48, longitudes 5-16), read a listed
 *      tile's COG overview level 2 (300 px per degree) with geotiff range reads,
 *      inside a bounded retry (5 attempts, 500 ms x attempt). The final failure
 *      names the tile and nothing is written. An absent slot is filled with 0 m.
 *   3. Check each tile: GTRasterTypeGeoKey 2 (PixelIsPoint), origin on the whole
 *      degree (lon, lat + 1), 1200 x 1200 full size, single band, no NaN.
 *   4. Mosaic the tiles (3,600 x 1,800), clamping negative heights to 0 m.
 *   5. Resample bilinearly at every grid pixel centre to the 16-02 projection:
 *      plate carrée over 5-17° E by 43-49° N with x scaled by cos 46.5°,
 *      1,200 x 872 px. PixelIsPoint: a full-resolution pixel k has its centre at
 *      origin + k / 1200°, and a level-2 pixel j averages full pixels 4j..4j+3,
 *      so its centre lies at origin + (j + 0.375) / 300° (the 0.125 px offset the
 *      spike measured).
 *   6. Store whole metres (heightScale 1) in a grey16 PNG, prove the lossless
 *      round trip, hash it, parse the record with OverviewSource (the notice and
 *      liability sentence are the schema's verbatim constants, D-21) and only
 *      then write <dir>/dem.png and source.json.
 *
 * Usage:
 *   npm run terrain:fetch:overview [-- --out <dir>]
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromUrl } from 'geotiff';
import sharp from 'sharp';
import {
  GLO90_LIABILITY,
  GLO90_NOTICE,
  OVERVIEW_LAT_TILES,
  OVERVIEW_LON_TILES,
  OverviewSource,
  glo90TileName,
} from '../../data/schemas/overview.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = path.join(ROOT, 'data', 'terrain', 'overview');
const NAME = 'terrain:fetch:overview';

const BUCKET = 'https://copernicus-dem-90m.s3.amazonaws.com/';
const TILE_LIST_URL = `${BUCKET}tileList.txt`;
/** What the AWS Open Data registry says the bucket serves. */
const RELEASE = 'Copernicus DEM 2021 release';
const RELEASE_SOURCE =
  'https://github.com/awslabs/open-data-registry/blob/main/datasets/copernicus-dem.yaml';
const RESAMPLING =
  'bilinear at grid pixel centres from the level-2 mosaic, PixelIsPoint offset applied, negatives and sea clamped to 0 m';

/** COG overview level 2: 1200 px tiles -> 300 px, 300 px per degree. */
const OVERVIEW_LEVEL = 2;
const FULL_PX = 1200;
const TILE_PX = 300;
/** GeoTIFF GTRasterTypeGeoKey 2 = PixelIsPoint: the origin is a pixel centre. */
const PIXEL_IS_POINT = 2;
/** A level-2 pixel j's centre, in mosaic pixel units, is j + 0.375 past the origin (step 5). */
const POINT_OFFSET = (FULL_PX / TILE_PX - 1) / 2 / (FULL_PX / TILE_PX);

/** The 16-02 window and grid. */
const WEST = 5;
const NORTH = 49;
const SPAN_LON = 12;
const SPAN_LAT = 6;
const STANDARD_PARALLEL_DEG = 46.5;
const WIDTH = 1200;
const HEIGHT = Math.round(
  (WIDTH * SPAN_LAT) / (SPAN_LON * Math.cos((STANDARD_PARALLEL_DEG * Math.PI) / 180))
);
const FILE = 'dem.png';

/** Bounded retry (RESEARCH Pattern 6's shape): attempts, and the backoff per attempt number. */
const ATTEMPTS = 5;
const BACKOFF_MS = 500;
/** Tiles read at once. */
const PARALLEL = 6;
/** No Alpine height reaches this; a value above it is a corrupt read. */
const MAX_M = 9000;

function fail(msg) {
  throw new Error(msg);
}

const USAGE = 'usage: terrain:fetch:overview [--out <dir>]';

/** `--out`; anything else fails. */
function parseArgs(argv) {
  let out = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--out') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) fail(`--out needs a value (${USAGE})`);
      if (out !== null) fail('--out given twice');
      out = value;
      i++;
    } else {
      fail(`unknown argument ${arg} (${USAGE})`);
    }
  }
  return { dir: out === null ? OUT_DIR : path.resolve(out) };
}

/** `dir` relative to the repository when inside it, else absolute; forward slashes. */
function shown(dir) {
  const rel = path.relative(ROOT, dir);
  const inside = rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  return (inside ? rel : dir).split(path.sep).join('/');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** An error's message with its cause (undici reports `fetch failed` and puts the socket error in `cause`). */
const reasonOf = (e) => {
  const msg = e && e.message ? e.message : String(e);
  return e && e.cause && e.cause.message ? `${msg} (${e.cause.message})` : msg;
};

/** Retries across the whole run, for the report. */
let retries = 0;

/**
 * `attempt()` up to ATTEMPTS times, waiting BACKOFF_MS x the attempt number in
 * between. A failure marked `final` (a tile that answers but is not the shape
 * this fetcher expects) is not retried. The last failure names `what`.
 */
async function withRetry(what, attempt) {
  for (let n = 1; ; n++) {
    try {
      return await attempt();
    } catch (e) {
      if (e && e.final) throw e;
      if (n >= ATTEMPTS) fail(`${what} failed after ${ATTEMPTS} attempts: ${reasonOf(e)}`);
      retries++;
      await sleep(BACKOFF_MS * n);
    }
  }
}

/** A failure that a retry cannot fix. */
function finalError(msg) {
  const e = new Error(msg);
  e.final = true;
  return e;
}

/** tileList.txt as text and the set of names it lists. */
async function fetchTileList() {
  const text = await withRetry('tileList.txt', async () => {
    const res = await fetch(TILE_LIST_URL);
    if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
    if (!res.ok) throw finalError(`tileList.txt returned HTTP ${res.status}`);
    return res.text();
  });
  const names = new Set(
    text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
  // The full list has tens of thousands of names; a short one is a truncated read, not a sea.
  if (names.size < 20000) fail(`tileList.txt lists only ${names.size} names (truncated?)`);
  return { text, names };
}

/** One listed tile's level-2 overview as metres, after the shape checks of step 3. */
async function readTile(slot) {
  const url = `${BUCKET}${slot.name}/${slot.name}.tif`;
  return withRetry(`GLO-90 tile ${slot.name}`, async () => {
    const tiff = await fromUrl(url);
    const full = await tiff.getImage(0);
    if (full.getSamplesPerPixel() !== 1) throw finalError(`${slot.name} is not single-band`);
    if (full.getWidth() !== FULL_PX || full.getHeight() !== FULL_PX)
      throw finalError(
        `${slot.name} is ${full.getWidth()} x ${full.getHeight()}, expected ${FULL_PX} x ${FULL_PX}`
      );
    if (full.getGeoKeys().GTRasterTypeGeoKey !== PIXEL_IS_POINT)
      throw finalError(`${slot.name} is not PixelIsPoint`);
    const [ox, oy] = full.getOrigin();
    if (ox !== slot.lon || oy !== slot.lat + 1)
      throw finalError(
        `${slot.name} origin is ${ox}, ${oy}, expected ${slot.lon}, ${slot.lat + 1}`
      );
    if ((await tiff.getImageCount()) <= OVERVIEW_LEVEL)
      throw finalError(`${slot.name} has no overview level ${OVERVIEW_LEVEL}`);
    const ov = await tiff.getImage(OVERVIEW_LEVEL);
    if (ov.getWidth() !== TILE_PX || ov.getHeight() !== TILE_PX)
      throw finalError(`${slot.name} overview ${OVERVIEW_LEVEL} is not ${TILE_PX} x ${TILE_PX}`);
    const [band] = await ov.readRasters({ samples: [0] });
    if (!band || band.length !== TILE_PX * TILE_PX)
      throw new Error(`${slot.name}: read ${band ? band.length : 0} values`);
    for (let i = 0; i < band.length; i++) {
      if (!Number.isFinite(band[i]) || band[i] > MAX_M)
        throw finalError(`${slot.name}: implausible height ${band[i]} at overview pixel ${i}`);
    }
    return band;
  });
}

async function main() {
  // Every argument error is thrown here, before the first request.
  const { dir } = parseArgs(process.argv.slice(2));
  console.log(`${NAME}: GLO-90 level ${OVERVIEW_LEVEL} -> ${shown(dir)}`);

  const started = Date.now();
  const list = await fetchTileList();
  const tileListSha256 = crypto.createHash('sha256').update(list.text).digest('hex');

  const slots = [];
  for (const lat of OVERVIEW_LAT_TILES)
    for (const lon of OVERVIEW_LON_TILES) slots.push({ lat, lon, name: glo90TileName(lat, lon) });
  const present = slots.filter((s) => list.names.has(s.name));
  const absent = slots.filter((s) => !list.names.has(s.name));
  console.log(
    `${NAME}: tileList.txt ${list.names.size} names; ${present.length} of ${slots.length} slots listed, ` +
      `absent (sea, 0 m): ${absent.map((s) => s.name).join(', ') || 'none'}`
  );

  // Mosaic 3,600 x 1,800 (300 px per degree); absent slots stay 0 m.
  const MW = SPAN_LON * TILE_PX;
  const MH = SPAN_LAT * TILE_PX;
  const mosaic = new Float32Array(MW * MH);
  let next = 0;
  async function worker() {
    while (next < present.length) {
      const slot = present[next++];
      const band = await readTile(slot);
      const ox = (slot.lon - WEST) * TILE_PX;
      const oy = (NORTH - (slot.lat + 1)) * TILE_PX;
      for (let y = 0; y < TILE_PX; y++)
        for (let x = 0; x < TILE_PX; x++) {
          const m = band[y * TILE_PX + x];
          mosaic[(oy + y) * MW + ox + x] = m > 0 ? m : 0; // negatives clamp to 0 m
        }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  const readMs = Date.now() - started;

  // Bilinear sample of the mosaic at (lon, lat), PixelIsPoint offset applied (step 5).
  const g = (x, y) => mosaic[y * MW + x];
  function sample(lon, lat) {
    const fx = Math.min(MW - 1, Math.max(0, (lon - WEST) * TILE_PX - POINT_OFFSET));
    const fy = Math.min(MH - 1, Math.max(0, (NORTH - lat) * TILE_PX - POINT_OFFSET));
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(MW - 1, x0 + 1);
    const y1 = Math.min(MH - 1, y0 + 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const top = g(x0, y0) + (g(x1, y0) - g(x0, y0)) * tx;
    const bottom = g(x0, y1) + (g(x1, y1) - g(x0, y1)) * tx;
    return top + (bottom - top) * ty;
  }

  const u16 = new Uint16Array(WIDTH * HEIGHT);
  let max = 0;
  for (let y = 0; y < HEIGHT; y++) {
    const lat = NORTH - ((y + 0.5) * SPAN_LAT) / HEIGHT;
    for (let x = 0; x < WIDTH; x++) {
      const lon = WEST + ((x + 0.5) * SPAN_LON) / WIDTH;
      const value = Math.max(0, Math.round(sample(lon, lat)));
      if (value > 65535) fail(`height ${value} m does not fit a 16-bit value`);
      u16[y * WIDTH + x] = value;
      if (value > max) max = value;
    }
  }

  // Pass the Uint16Array itself: a Buffer with raw depth 'ushort' corrupts silently (STACK.md §4).
  const png = await sharp(u16, { raw: { width: WIDTH, height: HEIGHT, channels: 1 } })
    .toColourspace('grey16')
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  // Lossless round trip, or nothing is written.
  const back = await sharp(png).toColourspace('grey16').raw({ depth: 'ushort' }).toBuffer({
    resolveWithObject: true,
  });
  if (back.info.width !== WIDTH || back.info.height !== HEIGHT || back.info.channels !== 1)
    fail('PNG round trip changed the raster shape');
  const decoded = new Uint16Array(
    back.data.buffer.slice(back.data.byteOffset, back.data.byteOffset + back.data.length)
  );
  for (let i = 0; i < u16.length; i++) {
    if (decoded[i] !== u16[i]) fail(`PNG round trip differs at pixel ${i}`);
  }

  const sha256 = crypto.createHash('sha256').update(png).digest('hex');
  const source = OverviewSource.parse({
    product: 'Copernicus DEM GLO-90',
    release: RELEASE,
    releaseSource: RELEASE_SOURCE,
    tileBaseUrl: BUCKET,
    tileListUrl: TILE_LIST_URL,
    tileListSha256,
    tiles: present.map((s) => s.name).sort(),
    absent: absent.map((s) => s.name).sort(),
    rasterType: 'PixelIsPoint',
    overviewLevel: OVERVIEW_LEVEL,
    lon: [WEST, WEST + SPAN_LON],
    lat: [NORTH - SPAN_LAT, NORTH],
    projection: { kind: 'plate-carree', standardParallelDeg: STANDARD_PARALLEL_DEG },
    resampling: RESAMPLING,
    width: WIDTH,
    height: HEIGHT,
    heightScale: 1,
    file: FILE,
    sha256,
    notice: GLO90_NOTICE,
    liability: GLO90_LIABILITY,
  });

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, FILE), png);
  fs.writeFileSync(path.join(dir, 'source.json'), JSON.stringify(source, null, 2) + '\n', 'utf8');
  console.log(
    `${NAME}: read ${present.length} tiles in ${readMs} ms, ` +
      `${retries} ${retries === 1 ? 'retry' : 'retries'}`
  );
  console.log(
    `${NAME}: wrote ${shown(dir)}/${FILE} (${WIDTH} x ${HEIGHT}, ${png.length} bytes, ` +
      `0..${max} m) and source.json`
  );
  console.log(`${NAME}: OK`);
}

main().catch((e) => {
  if (e && Array.isArray(e.issues)) {
    for (const i of e.issues) console.log(`${NAME}: schema ${i.path.join('.')}: ${i.message}`);
  } else {
    console.log(`${NAME}: ${e && e.message ? e.message : String(e)}`);
  }
  console.log(`${NAME}: nothing written`);
  process.exit(1);
});
