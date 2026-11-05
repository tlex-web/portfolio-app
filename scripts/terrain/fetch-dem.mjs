#!/usr/bin/env node

/**
 * Terrain source fetch (DATA-01, D-14): swisstopo STAC + COG window -> the
 * committed source raster.
 *
 * MANUAL AND NETWORKED. Never run it in prebuild, lint or CI (T-08-09): CI and
 * Vercel re-derive every terrain artifact offline from what this writes, with
 * `npm run terrain:build -- --check`.
 *
 * Steps:
 *   1. GET the swissALTIRegio STAC item and pick its single cloud-optimized
 *      GeoTIFF asset in EPSG:2056 (fail when there is not exactly one).
 *   2. Open the COG with geotiff `fromUrl` (HTTP range reads) and check it is
 *      a 10 m, PixelIsArea, single-band float raster.
 *   3. Turn EXTENT into an integer pixel window from the image origin and
 *      resolution (fail when it is not pixel-aligned or leaves the raster), read
 *      it with `readRasters({ window, samples: [0] })` and fail on any nodata.
 *   4. Metres -> Uint16Array in the chosen unit (decimetres: Math.round(m * 10);
 *      every value must fit 0..65535), encoded with sharp as a lossless 16-bit
 *      grey PNG and decoded back to prove the round trip.
 *   5. Write data/terrain/source/dem-10m.png and source.json (parsed with
 *      TerrainSource first), with the STAC fields, the edition and the sha256.
 *
 * Task 1 decisions (08-04-SUMMARY.md, Tim's reply "defaults"):
 *   extent LV95 [W 2616000, S 1088000, E 2627000, N 1099000] (11 x 11 km),
 *   decimetres (heightScale 0.1), edition = the STAC item datetime month.
 *
 * Usage: npm run terrain:fetch   (no flags)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromUrl } from 'geotiff';
import sharp from 'sharp';
import { TerrainSource } from '../../data/schemas/terrain.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE_DIR = path.join(ROOT, 'data', 'terrain', 'source');
const NAME = 'terrain:fetch';

const STAC_ITEM_URL =
  'https://data.geo.admin.ch/api/stac/v1/collections/ch.swisstopo.swissaltiregio/items/swissaltiregio';
/** D-14 extent, confirmed by Tim at 08-04 Task 1 ("defaults"). Costly to change. */
const EXTENT = { west: 2616000, south: 1088000, east: 2627000, north: 1099000 };
const CELL_M = 10;
/** Decimetres (Task 1 item 2): stored value = Math.round(m / HEIGHT_SCALE). */
const HEIGHT_SCALE = 0.1;
const FILE = 'dem-10m.png';
/** GeoTIFF GTRasterTypeGeoKey 1 = PixelIsArea: the origin is a pixel corner. */
const PIXEL_IS_AREA = 1;

function fail(msg) {
  throw new Error(msg);
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

/** Integer pixel window [x0, y0, x1, y1] of EXTENT in the image, or a failure. */
function pixelWindow(image) {
  const [ox, oy] = image.getOrigin();
  const [rx, ry] = image.getResolution();
  if (rx !== CELL_M || ry !== -CELL_M) fail(`COG resolution is ${rx} x ${ry}, expected 10 x -10`);
  const geoKeys = image.getGeoKeys();
  if (geoKeys.ProjectedCSTypeGeoKey !== 2056) fail('COG is not EPSG:2056');
  if (geoKeys.GTRasterTypeGeoKey !== PIXEL_IS_AREA) fail('COG is not PixelIsArea');
  const win = [
    (EXTENT.west - ox) / rx,
    (oy - EXTENT.north) / CELL_M,
    (EXTENT.east - ox) / rx,
    (oy - EXTENT.south) / CELL_M,
  ];
  if (!win.every(Number.isInteger)) fail(`extent is not pixel-aligned (window ${win.join(', ')})`);
  if (win[0] < 0 || win[1] < 0 || win[2] > image.getWidth() || win[3] > image.getHeight())
    fail('extent leaves the raster');
  return win;
}

async function main() {
  if (process.argv.length > 2) fail(`takes no arguments (got ${process.argv.slice(2).join(' ')})`);

  const item = await stacItem();
  const asset = pickCog(item);
  const props = item.properties ?? {};
  console.log(`${NAME}: STAC ${item.id} datetime ${props.datetime} -> ${asset.href}`);

  const tiff = await fromUrl(asset.href);
  const image = await tiff.getImage(0);
  if (image.getSamplesPerPixel() !== 1) fail('COG is not single-band');
  const window = pixelWindow(image);
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
  const source = TerrainSource.parse({
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
    extent: EXTENT,
    cellM: CELL_M,
    width,
    height,
    heightScale: HEIGHT_SCALE,
    file: FILE,
    sha256,
  });

  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.writeFileSync(path.join(SOURCE_DIR, FILE), png);
  fs.writeFileSync(
    path.join(SOURCE_DIR, 'source.json'),
    JSON.stringify(source, null, 2) + '\n',
    'utf8'
  );
  console.log(
    `${NAME}: wrote data/terrain/source/${FILE} (${width} x ${height}, ${png.length} bytes, ` +
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
