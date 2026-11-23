#!/usr/bin/env node

/**
 * Terrain source fetch (DATA-01, D-14; plates 16 D-09): swisstopo STAC + COG
 * window -> one plate's committed source raster.
 *
 * MANUAL AND NETWORKED. Never run it in prebuild, lint or CI (T-08-09): CI and
 * Vercel re-derive every terrain artifact offline from what this writes, with
 * `npm run terrain:build -- --check`.
 *
 * Arguments (checked before any network request, so a refusal writes nothing):
 *   --plate <id>      required. A PlateId. `matterhorn` is the home plate, whose
 *                     source Phase 15 D-15 pins: it also needs --force-home and
 *                     always uses the recorded D-14 extent, written to
 *                     data/terrain/source/. Any other id writes
 *                     data/terrain/plates/<id>/.
 *   --extent W,S,E,N  LV95 whole metres. Required for a new plate; a plate with
 *                     a source.json reuses its recorded extent (a given --extent
 *                     must equal it). Four integers on the 10 m grid, west < east,
 *                     south < north, square (RESEARCH Pitfall 10: the poster and
 *                     hero contours need square sources), at most 20,000 m a side.
 *   --force-home      allow refetching the Matterhorn source (could change the
 *                     D-15 hashes).
 *   --out <dir>       write the two files into <dir> instead (dry runs outside
 *                     the repository).
 *
 * Steps:
 *   1. GET the swissALTIRegio STAC item and pick its single cloud-optimized
 *      GeoTIFF asset in EPSG:2056 (fail when there is not exactly one).
 *   2. Open the COG with geotiff `fromUrl` (HTTP range reads) and check it is
 *      a 10 m, PixelIsArea, single-band float raster.
 *   3. Turn the plate's extent into an integer pixel window from the image origin and
 *      resolution (fail when it is not pixel-aligned or leaves the raster), read
 *      it with `readRasters({ window, samples: [0] })` and fail on any nodata.
 *   4. Metres -> Uint16Array in the chosen unit (decimetres: Math.round(m * 10);
 *      every value must fit 0..65535), encoded with sharp as a lossless 16-bit
 *      grey PNG and decoded back to prove the round trip.
 *   5. Write <target>/dem-10m.png and source.json (parsed with the
 *      swissALTIRegio TerrainSource variant first), with the STAC fields, the
 *      edition and the sha256.
 *
 * Task 1 decisions (08-04-SUMMARY.md, Tim's reply "defaults"):
 *   Matterhorn extent LV95 [W 2616000, S 1088000, E 2627000, N 1099000]
 *   (11 x 11 km), decimetres (heightScale 0.1), edition = the STAC item
 *   datetime month.
 *
 * Usage:
 *   npm run terrain:fetch -- --plate <id> --extent W,S,E,N [--out <dir>]   (a new plate)
 *   npm run terrain:fetch -- --plate <id> [--out <dir>]                    (refetch, recorded extent)
 *   npm run terrain:fetch -- --plate matterhorn --force-home              (refetch the home source)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromUrl } from 'geotiff';
import sharp from 'sharp';
import { PlateId, SwissAltiRegioSource, TerrainSource } from '../../data/schemas/terrain.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE_DIR = path.join(ROOT, 'data', 'terrain', 'source');
const PLATES_DIR = path.join(ROOT, 'data', 'terrain', 'plates');
const NAME = 'terrain:fetch';

const STAC_ITEM_URL =
  'https://data.geo.admin.ch/api/stac/v1/collections/ch.swisstopo.swissaltiregio/items/swissaltiregio';
/** The home plate: its source is data/terrain/source/, pinned by Phase 15 D-15. */
const HOME_PLATE = 'matterhorn';
/** D-14 extent, confirmed by Tim at 08-04 Task 1 ("defaults"). Costly to change. */
const HOME_EXTENT = { west: 2616000, south: 1088000, east: 2627000, north: 1099000 };
/** The largest plate side (16 plate budgets). */
const MAX_SIDE_M = 20000;
const CELL_M = 10;
/** Decimetres (Task 1 item 2): stored value = Math.round(m / HEIGHT_SCALE). */
const HEIGHT_SCALE = 0.1;
const FILE = 'dem-10m.png';
/** GeoTIFF GTRasterTypeGeoKey 1 = PixelIsArea: the origin is a pixel corner. */
const PIXEL_IS_AREA = 1;

function fail(msg) {
  throw new Error(msg);
}

const USAGE =
  'usage: terrain:fetch --plate <id> [--extent W,S,E,N] [--out <dir>], or --plate matterhorn --force-home';

/** `--plate`, `--extent`, `--force-home`, `--out`; anything else fails. */
function parseArgs(argv) {
  const opts = { plate: null, extent: null, out: null, forceHome: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--force-home') {
      opts.forceHome = true;
    } else if (arg === '--plate' || arg === '--extent' || arg === '--out') {
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

/**
 * The plate, its extent and the directory to write, from the arguments alone
 * (plus a recorded source.json): every refusal happens here, before the network.
 */
function resolveTarget(argv) {
  const opts = parseArgs(argv);
  if (opts.plate === null)
    fail(
      'needs --plate <id> (the Matterhorn source is pinned by Phase 15 D-15; use --plate matterhorn --force-home to refetch it)'
    );
  const parsed = PlateId.safeParse(opts.plate);
  if (!parsed.success) fail(`--plate ${opts.plate}: ${parsed.error.issues[0].message}`);
  const id = parsed.data;
  const given = opts.extent === null ? null : parseExtent(opts.extent);
  const out = opts.out === null ? null : path.resolve(opts.out);

  if (id === HOME_PLATE) {
    if (!opts.forceHome)
      fail(
        '--plate matterhorn needs --force-home (Phase 15 D-15 pins its source; a refetch could change the hashes)'
      );
    if (given && !sameExtent(given, HOME_EXTENT))
      fail(
        `--extent ${extentText(given)} differs from the recorded D-14 extent ${extentText(HOME_EXTENT)}`
      );
    return { id, extent: HOME_EXTENT, dir: out ?? SOURCE_DIR };
  }
  if (opts.forceHome) fail(`--force-home applies only to --plate ${HOME_PLATE}`);

  const record = path.join(PLATES_DIR, id, 'source.json');
  if (!fs.existsSync(record)) {
    if (!given) fail(`--plate ${id} is a new plate and needs --extent W,S,E,N`);
    return { id, extent: given, dir: out ?? path.join(PLATES_DIR, id) };
  }
  const recorded = TerrainSource.parse(JSON.parse(fs.readFileSync(record, 'utf8')));
  if (recorded.product !== 'swissALTIRegio')
    fail(`plate ${id} has a ${recorded.product} source; terrain:fetch fetches swissALTIRegio only`);
  const problem = extentProblem(recorded.extent);
  if (problem) fail(`plate ${id}: the recorded extent ${problem}`);
  if (given && !sameExtent(given, recorded.extent))
    fail(
      `--extent ${extentText(given)} differs from plate ${id}'s recorded extent ${extentText(recorded.extent)}`
    );
  return { id, extent: recorded.extent, dir: out ?? path.join(PLATES_DIR, id) };
}

/** `dir` relative to the repository when inside it, else absolute; forward slashes. */
function shown(dir) {
  const rel = path.relative(ROOT, dir);
  const inside = rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  return (inside ? rel : dir).split(path.sep).join('/');
}

async function stacItem() {
  const res = await fetch(STAC_ITEM_URL, { headers: { accept: 'application/geo+json' } });
  if (!res.ok) fail(`STAC item returned HTTP ${res.status}`);
  return res.json();
}

/** The single cloud-optimized GeoTIFF asset in EPSG:2056. */
function pickCog(item) {
  const cogs = Object.entries(item.assets ?? {}).filter(
    ([, a]) =>
      typeof a.type === 'string' &&
      a.type.includes('image/tiff') &&
      a.type.includes('profile=cloud-optimized') &&
      a['proj:epsg'] === 2056
  );
  if (cogs.length !== 1) fail(`expected exactly one EPSG:2056 COG asset, found ${cogs.length}`);
  const [key, asset] = cogs[0];
  if (typeof asset.href !== 'string' || !asset.href.startsWith('https://'))
    fail(`asset ${key} has no https href`);
  if (typeof asset['file:checksum'] !== 'string') fail(`asset ${key} has no file:checksum`);
  return asset;
}

/** Integer pixel window [x0, y0, x1, y1] of `extent` in the image, or a failure. */
function pixelWindow(image, extent) {
  const [ox, oy] = image.getOrigin();
  const [rx, ry] = image.getResolution();
  if (rx !== CELL_M || ry !== -CELL_M) fail(`COG resolution is ${rx} x ${ry}, expected 10 x -10`);
  const geoKeys = image.getGeoKeys();
  if (geoKeys.ProjectedCSTypeGeoKey !== 2056) fail('COG is not EPSG:2056');
  if (geoKeys.GTRasterTypeGeoKey !== PIXEL_IS_AREA) fail('COG is not PixelIsArea');
  const win = [
    (extent.west - ox) / rx,
    (oy - extent.north) / CELL_M,
    (extent.east - ox) / rx,
    (oy - extent.south) / CELL_M,
  ];
  if (!win.every(Number.isInteger)) fail(`extent is not pixel-aligned (window ${win.join(', ')})`);
  if (win[0] < 0 || win[1] < 0 || win[2] > image.getWidth() || win[3] > image.getHeight())
    fail('extent leaves the raster');
  return win;
}

async function main() {
  // Every argument error is thrown here, before the first request.
  const target = resolveTarget(process.argv.slice(2));
  console.log(
    `${NAME}: plate ${target.id}, extent ${extentText(target.extent)} -> ${shown(target.dir)}`
  );

  const item = await stacItem();
  const asset = pickCog(item);
  const props = item.properties ?? {};
  console.log(`${NAME}: STAC ${item.id} datetime ${props.datetime} -> ${asset.href}`);

  const tiff = await fromUrl(asset.href);
  const image = await tiff.getImage(0);
  if (image.getSamplesPerPixel() !== 1) fail('COG is not single-band');
  const window = pixelWindow(image, target.extent);
  const width = window[2] - window[0];
  const height = window[3] - window[1];
  const [band] = await image.readRasters({ window, samples: [0] });
  if (!band || band.length !== width * height)
    fail(`read ${band ? band.length : 0} values, expected ${width * height}`);

  const nodata = image.getGDALNoData();
  const u16 = new Uint16Array(width * height);
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < band.length; i++) {
    const m = band[i];
    if (!Number.isFinite(m) || (nodata !== null && m === nodata) || m < -100 || m > 6000)
      fail(`nodata or out-of-range height ${m} at pixel ${i % width}, ${Math.floor(i / width)}`);
    const v = Math.round(m / HEIGHT_SCALE);
    if (v < 0 || v > 65535)
      fail(`height ${m} m does not fit a 16-bit value at scale ${HEIGHT_SCALE}`);
    u16[i] = v;
    if (m < min) min = m;
    if (m > max) max = m;
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
  const source = SwissAltiRegioSource.parse({
    product: 'swissALTIRegio',
    stacItemUrl: STAC_ITEM_URL,
    cogUrl: asset.href,
    stacDatetime: props.datetime,
    stacUpdated: props.updated,
    checksum: asset['file:checksum'],
    edition: String(props.datetime).slice(0, 7),
    editionSource: 'stac:datetime',
    crs: 'EPSG:2056',
    heightSystem: 'LN02',
    extent: target.extent,
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
