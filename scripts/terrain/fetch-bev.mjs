#!/usr/bin/env node

/**
 * BEV ALS DTM plate fetch (16 D-09, D-28, D-29): one BEV tile's COG window ->
 * a plate's committed source raster on LAEA Europe (EPSG:3035).
 *
 * MANUAL AND NETWORKED. Never run it in prebuild, lint or CI (T-08-09): CI and
 * Vercel re-derive every terrain artifact offline from what this writes, with
 * `npm run terrain:build -- --check`. The selftest only exercises its argument
 * refusals, which all happen before the first request.
 *
 * Arguments (checked before any network request, so a refusal writes nothing):
 *   --plate <id>      required. A PlateId other than the swissALTIRegio home
 *                     plate; writes data/terrain/plates/<id>/.
 *   --extent W,S,E,N  EPSG:3035 whole metres. Required for a new plate; a plate
 *                     with a source.json reuses its recorded extent (a given
 *                     --extent must equal it). Four integers on the 10 m grid,
 *                     west < east, south < north, square (RESEARCH Pitfall 10),
 *                     at most 20,000 m a side, and inside ONE 50 km BEV tile:
 *                     there is no multi-tile path (D-28's plate is one tile), so
 *                     a window that needs more fails naming the tiles.
 *   --out <dir>       write the two files into <dir> instead (dry runs outside
 *                     the repository).
 *
 * Steps:
 *   1. HEAD the tile `ALS_DTM_CRS3035RES50000mN<northing>E<easting>.tif` under
 *      the 2025 edition folder (BEV_EDITION_DIR) and record its URL,
 *      Content-Length and Last-Modified.
 *   2. Open the COG through geotiff's `fromCustomClient` with a client whose
 *      every range request is retried (5 attempts, 500 ms x attempt): BEV's
 *      server drops sockets under geotiff's many small ranges (RESEARCH
 *      Pitfall 3). The final failure names the tile and nothing is written.
 *   3. Image 0 (1 m, PixelIsArea, EPSG:3035) gives the origin and size; image 3,
 *      an overview without its own geotransform, is read with the scale taken
 *      from the full image (full width / overview width, about 8 m). A scale
 *      outside 7..9 m, or not square, fails before the read: the record's
 *      resampling text says "about 8 m".
 *   4. Fail on any value at or below -9000 (nodata) or outside -100..6000 m:
 *      there is no nodata path (D-28), the window must be hole-free.
 *   5. Sample every 10 m cell centre bilinearly, store decimetres in a grey16
 *      PNG, prove the lossless round trip, hash it, parse the record with
 *      BevAlsDtmSource (its TerrainSource variant, as fetch-dem parses its
 *      own) and only then write <target>/dem-10m.png and source.json.
 *
 * Record facts (16-RESEARCH § Data sources, D-29): crs EPSG:3035, height system
 * EVRF2000-AT with its code EPSG:9274 (what BEV's record declares), edition
 * 2025-09 from the Stichtag 15.09.2025 (a creation date, never a survey date),
 * the DOI and the geonetwork record. The credit is Tim's wording (16-11 Task 2,
 * "Full line with DOI"), copied verbatim; licence CC BY 4.0.
 *
 * Usage:
 *   npm run terrain:fetch:bev -- --plate <id> --extent W,S,E,N [--out <dir>]   (a new plate)
 *   npm run terrain:fetch:bev -- --plate <id> [--out <dir>]                    (refetch, recorded extent)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BaseClient, BaseResponse, fromCustomClient } from 'geotiff';
import sharp from 'sharp';
import { BevAlsDtmSource, PlateId, TerrainSource } from '../../data/schemas/terrain.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PLATES_DIR = path.join(ROOT, 'data', 'terrain', 'plates');
const NAME = 'terrain:fetch:bev';

/** The 2025 edition folder (Stichtag 15.09.2025, published 2026-05-19). */
const BEV_EDITION_DIR = '20250915';
const BEV_BASE_URL = `https://data.bev.gv.at/download/ALS/DTM/${BEV_EDITION_DIR}/`;
/** BEV's tile grid: 50 km squares named by their south-west corner. */
const TILE_M = 50000;
const DOI = '10.48677/1d2d42c2-10dc-4be6-9917-8784d1cfe37c';
/** The geonetwork record the DOI resolves to (checked 2026-11-23). */
const METADATA_URL =
  'https://data.bev.gv.at/geonetwork/srv/metadata/1d2d42c2-10dc-4be6-9917-8784d1cfe37c';
/** BEV's Stichtag 15.09.2025 as YYYY-MM: an edition (creation) date, not a survey date. */
const EDITION = '2025-09';
const EDITION_SOURCE = `${METADATA_URL} (Stichtag 15.09.2025, a creation date)`;
const HEIGHT_SYSTEM = 'EVRF2000-AT';
const HEIGHT_SYSTEM_EPSG = 'EPSG:9274';
/** Tim's credit (16-11 Task 2, option "research-line"), verbatim. */
const CREDIT =
  'Terrain: ALS DTM, © BEV – Bundesamt für Eich- und Vermessungswesen, CC BY 4.0, modified (doi:10.48677/1d2d42c2-10dc-4be6-9917-8784d1cfe37c)';
const LICENCE = 'CC BY 4.0';
const LICENCE_URL = 'https://creativecommons.org/licenses/by/4.0/';
const RESAMPLING = 'bilinear from overview level 3 (about 8 m) to 10 m cell centres';
/** Overview level read (about 8 m; the full 1 m image would be hundreds of MB of ranges). */
const OVERVIEW_LEVEL = 3;
/**
 * The overview scale RESAMPLING's "about 8 m" allows, in metres (16-REVIEW WR-05):
 * finer than the 10 m output cell, and failing on a 4 m or 16 m level.
 */
const OVERVIEW_MIN_M = 7;
const OVERVIEW_MAX_M = 9;
/** The swissALTIRegio home plate: terrain:fetch owns it. */
const HOME_PLATE = 'matterhorn';
const MAX_SIDE_M = 20000;
const CELL_M = 10;
/** Decimetres: stored value = Math.round(m / HEIGHT_SCALE). */
const HEIGHT_SCALE = 0.1;
const FILE = 'dem-10m.png';
/** GeoTIFF GTRasterTypeGeoKey 1 = PixelIsArea: the origin is a pixel corner. */
const PIXEL_IS_AREA = 1;
/** BEV's nodata is -9999; anything at or below this is nodata (D-28: none allowed). */
const NODATA_AT_OR_BELOW = -9000;
const MIN_M = -100;
const MAX_M = 6000;
/** Bounded retry (RESEARCH Pitfall 3): attempts, and the backoff per attempt number. */
const ATTEMPTS = 5;
const BACKOFF_MS = 500;

function fail(msg) {
  throw new Error(msg);
}

const USAGE = 'usage: terrain:fetch:bev --plate <id> [--extent W,S,E,N] [--out <dir>]';

/** `--plate`, `--extent`, `--out`; anything else fails. */
function parseArgs(argv) {
  const opts = { plate: null, extent: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--plate' || arg === '--extent' || arg === '--out') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) fail(`${arg} needs a value (${USAGE})`);
      const key = arg.slice(2);
      if (opts[key] !== null) fail(`${arg} given twice`);
      opts[key] = value;
      i++;
    } else {
      fail(`unknown argument ${arg} (${USAGE})`);
    }
  }
  return opts;
}

/** Null when `e` is a square plate extent on the 10 m grid, at most MAX_SIDE_M a side; else the rule it breaks. */
function extentProblem(e) {
  if (!(e.west < e.east && e.south < e.north)) return 'needs west < east and south < north';
  const w = e.east - e.west;
  const h = e.north - e.south;
  if (w !== h) return `must be square (got ${w} x ${h} m; RESEARCH Pitfall 10)`;
  if (w > MAX_SIDE_M) return `side ${w} m is over the ${MAX_SIDE_M} m limit`;
  if ([e.west, e.south, e.east, e.north].some((v) => v % CELL_M !== 0))
    return `edges must lie on the ${CELL_M} m grid (whole ${CELL_M} m cells)`;
  return null;
}

/** `W,S,E,N` as four integers, checked by extentProblem. */
function parseExtent(text) {
  const parts = text.split(',');
  if (parts.length !== 4 || !parts.every((p) => /^-?\d+$/.test(p)))
    fail(`--extent must be four integers W,S,E,N (got ${text})`);
  const [west, south, east, north] = parts.map(Number);
  const extent = { west, south, east, north };
  const problem = extentProblem(extent);
  if (problem) fail(`--extent ${problem}`);
  return extent;
}

const sameExtent = (a, b) =>
  a.west === b.west && a.south === b.south && a.east === b.east && a.north === b.north;
const extentText = (e) => `${e.west},${e.south},${e.east},${e.north}`;
const tileName = (e, n) => `ALS_DTM_CRS3035RES50000mN${n}E${e}.tif`;

/** Every BEV tile the extent touches (a tile covers [corner, corner + 50 km] on both axes). */
function tilesFor(extent) {
  const names = [];
  for (let n = Math.floor(extent.south / TILE_M); n < Math.ceil(extent.north / TILE_M); n++)
    for (let e = Math.floor(extent.west / TILE_M); e < Math.ceil(extent.east / TILE_M); e++)
      names.push({
        name: tileName(e * TILE_M, n * TILE_M),
        easting: e * TILE_M,
        northing: n * TILE_M,
      });
  return names;
}

/**
 * The plate, its extent, its one tile and the directory to write, from the
 * arguments alone (plus a recorded source.json): every refusal happens here,
 * before the network.
 */
function resolveTarget(argv) {
  const opts = parseArgs(argv);
  if (opts.plate === null) fail(`needs --plate <id> (${USAGE})`);
  const parsed = PlateId.safeParse(opts.plate);
  if (!parsed.success) fail(`--plate ${opts.plate}: ${parsed.error.issues[0].message}`);
  const id = parsed.data;
  if (id === HOME_PLATE)
    fail(
      `--plate ${HOME_PLATE} is the swissALTIRegio home plate; terrain:fetch:bev fetches BEV plates only`
    );
  const given = opts.extent === null ? null : parseExtent(opts.extent);
  const out = opts.out === null ? null : path.resolve(opts.out);

  let extent = given;
  const record = path.join(PLATES_DIR, id, 'source.json');
  if (fs.existsSync(record)) {
    const recorded = TerrainSource.parse(JSON.parse(fs.readFileSync(record, 'utf8')));
    if (recorded.product !== 'BEV ALS DTM')
      fail(
        `plate ${id} has a ${recorded.product} source; terrain:fetch:bev fetches BEV ALS DTM only`
      );
    const problem = extentProblem(recorded.extent);
    if (problem) fail(`plate ${id}: the recorded extent ${problem}`);
    if (given && !sameExtent(given, recorded.extent))
      fail(
        `--extent ${extentText(given)} differs from plate ${id}'s recorded extent ${extentText(recorded.extent)}`
      );
    extent = recorded.extent;
  } else if (!given) {
    fail(`--plate ${id} is a new plate and needs --extent W,S,E,N`);
  }

  const tiles = tilesFor(extent);
  if (tiles.length !== 1)
    fail(
      `extent ${extentText(extent)} needs ${tiles.length} BEV tiles (${tiles.map((t) => t.name).join(', ')}); ` +
        'terrain:fetch:bev reads one tile (D-28: no multi-tile path)'
    );
  return { id, extent, tile: tiles[0], dir: out ?? path.join(PLATES_DIR, id) };
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
 * between. A thrown network error or an HTTP 5xx is retried; any other HTTP
 * status is final. The last failure names the tile.
 */
async function withRetry(tile, attempt) {
  for (let n = 1; ; n++) {
    try {
      return await attempt();
    } catch (e) {
      if (e && e.final) throw e;
      if (n >= ATTEMPTS) fail(`BEV tile ${tile} failed after ${ATTEMPTS} attempts: ${reasonOf(e)}`);
      retries++;
      await sleep(BACKOFF_MS * n);
    }
  }
}

/** A failure that a retry cannot fix (a 4xx status, a missing header, an ignored range). */
function finalError(msg) {
  const e = new Error(msg);
  e.final = true;
  return e;
}

/** A response whose body was read inside the retry, so a socket dropped mid-body is retried too. */
class ReadResponse extends BaseResponse {
  constructor(status, headers, data) {
    super();
    this._status = status;
    this._headers = headers;
    this._data = data;
  }
  get status() {
    return this._status;
  }
  getHeader(name) {
    return this._headers.get(name) || undefined;
  }
  async getData() {
    return this._data;
  }
}

/** geotiff's client for one tile: every range request goes through withRetry (no global fetch patch). */
class RetryClient extends BaseClient {
  constructor(url, tile) {
    super(url);
    this.tile = tile;
  }
  async request({ headers, signal } = {}) {
    return withRetry(this.tile, async () => {
      const res = await fetch(this.url, { headers, signal });
      if (res.status >= 500) {
        await res.body?.cancel();
        throw new Error(`HTTP ${res.status}`);
      }
      if (!res.ok) {
        await res.body?.cancel();
        throw finalError(`BEV tile ${this.tile} returned HTTP ${res.status}`);
      }
      // A 200 to a range request is the whole 4+ GB tile: never read it.
      if (headers && headers.Range && res.status !== 206) {
        await res.body?.cancel();
        throw finalError(`BEV tile ${this.tile} ignored a byte range (HTTP ${res.status})`);
      }
      const data = await res.arrayBuffer();
      return new ReadResponse(res.status, res.headers, data);
    });
  }
}

/** The tile's URL, Content-Length and Last-Modified, as the server reports them. */
async function headTile(tile) {
  const url = BEV_BASE_URL + tile.name;
  return withRetry(tile.name, async () => {
    const res = await fetch(url, { method: 'HEAD' });
    if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
    if (!res.ok) throw finalError(`BEV tile ${tile.name} returned HTTP ${res.status}`);
    const contentLength = Number(res.headers.get('content-length'));
    const lastModified = res.headers.get('last-modified');
    if (!Number.isInteger(contentLength) || contentLength <= 0)
      throw finalError(`BEV tile ${tile.name} has no Content-Length`);
    if (!lastModified) throw finalError(`BEV tile ${tile.name} has no Last-Modified`);
    if (res.headers.get('accept-ranges') !== 'bytes')
      throw finalError(`BEV tile ${tile.name} does not accept byte ranges`);
    return { url, contentLength, lastModified };
  });
}

/**
 * The overview pixel window that holds every 10 m cell centre's four bilinear
 * neighbours, and the continuous overview pixel coordinate of each centre.
 */
function overviewWindow(extent, full, ov) {
  const [ox, oy] = full.getOrigin();
  const sx = full.getWidth() / ov.getWidth();
  const sy = full.getHeight() / ov.getHeight();
  // An overview pixel i covers full pixels [i * s, (i + 1) * s): its centre is at ox + (i + 0.5) * s.
  const u = (x) => (x - ox) / sx - 0.5;
  const v = (y) => (oy - y) / sy - 0.5;
  const u0 = u(extent.west + CELL_M / 2);
  const u1 = u(extent.east - CELL_M / 2);
  const v0 = v(extent.north - CELL_M / 2);
  const v1 = v(extent.south + CELL_M / 2);
  const win = [Math.floor(u0), Math.floor(v0), Math.floor(u1) + 2, Math.floor(v1) + 2];
  if (win[0] < 0 || win[1] < 0 || win[2] > ov.getWidth() || win[3] > ov.getHeight())
    fail(`extent ${extentText(extent)} is too close to the tile edge for bilinear sampling`);
  return { win, sx, sy, u, v };
}

async function main() {
  // Every argument error is thrown here, before the first request.
  const target = resolveTarget(process.argv.slice(2));
  const { extent, tile } = target;
  console.log(
    `${NAME}: plate ${target.id}, extent ${extentText(extent)}, tile ${tile.name} -> ${shown(target.dir)}`
  );

  const head = await headTile(tile);
  console.log(
    `${NAME}: ${head.url} (${head.contentLength} bytes, Last-Modified ${head.lastModified})`
  );

  const started = Date.now();
  const tiff = await fromCustomClient(new RetryClient(head.url, tile.name));
  const full = await tiff.getImage(0);
  if (full.getSamplesPerPixel() !== 1) fail('COG is not single-band');
  const [rx, ry] = full.getResolution();
  if (rx !== 1 || ry !== -1) fail(`COG resolution is ${rx} x ${ry}, expected 1 x -1`);
  const geoKeys = full.getGeoKeys();
  if (geoKeys.ProjectedCSTypeGeoKey !== 3035) fail('COG is not EPSG:3035');
  if (geoKeys.GTRasterTypeGeoKey !== PIXEL_IS_AREA) fail('COG is not PixelIsArea');
  const [ox, oy] = full.getOrigin();
  if (
    extent.west < ox ||
    extent.east > ox + full.getWidth() ||
    extent.north > oy ||
    extent.south < oy - full.getHeight()
  )
    fail(`extent ${extentText(extent)} leaves tile ${tile.name}`);
  if ((await tiff.getImageCount()) <= OVERVIEW_LEVEL)
    fail(`COG has no overview level ${OVERVIEW_LEVEL}`);
  const ov = await tiff.getImage(OVERVIEW_LEVEL);

  const width = (extent.east - extent.west) / CELL_M;
  const height = (extent.north - extent.south) / CELL_M;
  const { win, sx, sy, u, v } = overviewWindow(extent, full, ov);
  // 16-REVIEW WR-05: RESAMPLING (a schema literal) says "about 8 m". Refuse a
  // re-tiled pyramid before reading, so the record never misstates the heights.
  // The 2025 tiles read 8.0002 m (16-11); 0.01 m allows a one-pixel-off size.
  if (!(sx >= OVERVIEW_MIN_M && sx <= OVERVIEW_MAX_M && Math.abs(sx - sy) < 0.01))
    fail(
      `overview level ${OVERVIEW_LEVEL} is ${sx.toFixed(2)} x ${sy.toFixed(2)} m, not about 8 m ` +
        `(${OVERVIEW_MIN_M}..${OVERVIEW_MAX_M} m, square); update OVERVIEW_LEVEL, RESAMPLING and the schema literal`
    );
  const [band] = await ov.readRasters({ window: win, samples: [0] });
  const winW = win[2] - win[0];
  const winH = win[3] - win[1];
  if (!band || band.length !== winW * winH)
    fail(`read ${band ? band.length : 0} values, expected ${winW * winH}`);
  const readMs = Date.now() - started;

  // D-28: no nodata path. Any nodata or implausible height in the window fails the fetch.
  for (let i = 0; i < band.length; i++) {
    const m = band[i];
    if (!Number.isFinite(m) || m <= NODATA_AT_OR_BELOW || m < MIN_M || m > MAX_M)
      fail(
        `nodata or out-of-range height ${m} at overview window pixel ${i % winW}, ${Math.floor(i / winW)}`
      );
  }

  // Bilinear sample of every 10 m cell centre (E + 5 + 10 i, N - 5 - 10 j).
  const at = (c, r) => band[r * winW + c];
  const u16 = new Uint16Array(width * height);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < height; j++) {
    const fy = v(extent.north - CELL_M / 2 - j * CELL_M) - win[1];
    const r = Math.floor(fy);
    const ty = fy - r;
    for (let i = 0; i < width; i++) {
      const fx = u(extent.west + CELL_M / 2 + i * CELL_M) - win[0];
      const c = Math.floor(fx);
      const tx = fx - c;
      const m =
        (1 - tx) * (1 - ty) * at(c, r) +
        tx * (1 - ty) * at(c + 1, r) +
        (1 - tx) * ty * at(c, r + 1) +
        tx * ty * at(c + 1, r + 1);
      const value = Math.round(m / HEIGHT_SCALE);
      if (!(value >= 0 && value <= 65535))
        fail(`height ${m} m does not fit a 16-bit value at scale ${HEIGHT_SCALE}`);
      u16[j * width + i] = value;
      if (m < min) min = m;
      if (m > max) max = m;
    }
  }

  // Pass the Uint16Array itself: a Buffer with raw depth 'ushort' corrupts silently (STACK.md §4).
  const png = await sharp(u16, { raw: { width, height, channels: 1 } })
    .toColourspace('grey16')
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  // Lossless round trip, or nothing is written.
  const back = await sharp(png).toColourspace('grey16').raw({ depth: 'ushort' }).toBuffer({
    resolveWithObject: true,
  });
  if (back.info.width !== width || back.info.height !== height || back.info.channels !== 1)
    fail('PNG round trip changed the raster shape');
  const decoded = new Uint16Array(
    back.data.buffer.slice(back.data.byteOffset, back.data.byteOffset + back.data.length)
  );
  for (let i = 0; i < u16.length; i++) {
    if (decoded[i] !== u16[i]) fail(`PNG round trip differs at pixel ${i}`);
  }

  const sha256 = crypto.createHash('sha256').update(png).digest('hex');
  const source = BevAlsDtmSource.parse({
    product: 'BEV ALS DTM',
    tiles: [head],
    doi: DOI,
    metadataUrl: METADATA_URL,
    edition: EDITION,
    editionSource: EDITION_SOURCE,
    crs: 'EPSG:3035',
    heightSystem: HEIGHT_SYSTEM,
    heightSystemEpsg: HEIGHT_SYSTEM_EPSG,
    resampling: RESAMPLING,
    credit: CREDIT,
    licence: LICENCE,
    licenceUrl: LICENCE_URL,
    extent,
    cellM: CELL_M,
    width,
    height,
    heightScale: HEIGHT_SCALE,
    file: FILE,
    sha256,
  });

  fs.mkdirSync(target.dir, { recursive: true });
  fs.writeFileSync(path.join(target.dir, FILE), png);
  fs.writeFileSync(
    path.join(target.dir, 'source.json'),
    JSON.stringify(source, null, 2) + '\n',
    'utf8'
  );
  console.log(
    `${NAME}: read overview ${OVERVIEW_LEVEL} (scale ${sx.toFixed(4)} m) window ${winW} x ${winH} in ${readMs} ms, ` +
      `${retries} ${retries === 1 ? 'retry' : 'retries'}`
  );
  console.log(
    `${NAME}: wrote ${shown(target.dir)}/${FILE} (${width} x ${height}, ${png.length} bytes, ` +
      `${min.toFixed(1)}..${max.toFixed(1)} m) and source.json (edition ${source.edition})`
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
