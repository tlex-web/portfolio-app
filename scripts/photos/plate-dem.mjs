/**
 * Plate DEM access shared by both photo stages (16 D-03, DATA-14).
 *
 * Stage 1 (extract-exif.mjs) samples a coarse photo's plate DEM at the true
 * position, in memory only; stage 2 (build-photo-data.mjs) computes every
 * photo's uv and a 4dp photo's height. Both reach the DEM through this module,
 * so there is one loader, one region-to-plate lookup and one projection
 * dispatch on the source's CRS.
 *
 *   loadPlateDem(root, sourceRel)    <sourceRel>/source.json + PNG, sha256 verified
 *   plateFor(record, regions, plates) the plate entry a photo-map record is sampled on
 *   toGrid(crs, { lat, lon })        WGS84 -> the plate's grid { e, n }
 *   fromGrid(crs, { e, n })          the plate's grid -> WGS84 { lat, lon }
 *   gridToUv(grid, extent)           grid -> terrain uv (u east, v south; CRS-agnostic)
 *   sampleAtGrid(dem, grid)          bilinear height at a grid point
 *
 * No function here prints or returns a position in an error message (D-12):
 * a caller that fails on a position names the photo and the plate, never the
 * coordinates.
 *
 * Projections (16 D-09): EPSG:2056 (LV95) keeps lib/geo.ts (within 0.56 m of
 * proj4 over the Ortler plate, RESEARCH); EPSG:3035 (LAEA Europe, BEV plates)
 * goes through proj4, a scripts-only devDependency (ESLint bans it elsewhere).
 * An LV95 formula on an EPSG:3035 plate is about 10 m off at Saalfelden, so
 * every transform dispatches on the source's crs and never falls back.
 *
 * Imports use explicit .ts extensions: Node 24 type-strips the schema and lib
 * modules (RESEARCH Pattern 1), like build-photo-data.mjs.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import proj4 from 'proj4';
import sharp from 'sharp';
import { TerrainSource } from '../../data/schemas/terrain.ts';
import { lv95ToUv, lv95ToWgs84, wgs84ToLv95 } from '../../lib/geo.ts';
import { sampleAtLv95 } from '../../lib/terrain/dem-sample.ts';

const REGIONS_REL = 'data/regions/regions.json';
const PLATES_REL = 'data/terrain/plates.json';

// EPSG:3035 ETRS89-extended / LAEA Europe (RESEARCH "proj4 for an EPSG:3035 plate").
proj4.defs(
  'EPSG:3035',
  '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs'
);

const noProjection = (crs) =>
  new Error(`no projection for ${crs}; add it to scripts/photos/plate-dem.mjs`);

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

/**
 * A plate's <source>/source.json + PNG under `root` -> { crs, extent, width,
 * height, metres }, sha256 verified (T-08-24). `sourceRel` is the plate's
 * `source` from plates.json.
 */
export async function loadPlateDem(root, sourceRel) {
  const source = TerrainSource.parse(
    JSON.parse(fs.readFileSync(path.join(root, sourceRel, 'source.json'), 'utf8'))
  );
  const png = fs.readFileSync(path.join(root, sourceRel, source.file));
  const actual = sha256(png);
  if (actual !== source.sha256) {
    throw new Error(
      `${sourceRel}/${source.file} sha256 ${actual.slice(0, 10)} != source.json ${source.sha256.slice(0, 10)}`
    );
  }
  const { data, info } = await sharp(png)
    .toColourspace('grey16')
    .raw({ depth: 'ushort' })
    .toBuffer({ resolveWithObject: true });
  if (info.width !== source.width || info.height !== source.height || info.channels !== 1) {
    throw new Error(`${sourceRel}/${source.file} is not ${source.width} x ${source.height} grey16`);
  }
  const u16 = new Uint16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
  const metres = Float64Array.from(u16, (v) => v * source.heightScale);
  return {
    crs: source.crs,
    extent: source.extent,
    width: source.width,
    height: source.height,
    metres,
  };
}

/**
 * The plate entry a photo-map record is sampled on: its region's plate (15 D-03,
 * D-04). `regions` and `plates` are the parsed registries. Throws, naming the
 * region (and plate), when either is missing.
 */
export function plateFor(record, regions, plates) {
  const region = regions.regions.find((r) => r.id === record.region);
  if (!region) throw new Error(`region ${record.region} is not in ${REGIONS_REL}`);
  const plate = plates.plates.find((p) => p.id === region.plate);
  if (!plate) throw new Error(`region ${region.id}: plate ${region.plate} is not in ${PLATES_REL}`);
  return plate;
}

/**
 * WGS84 -> the plate's grid coordinates { e, n } in metres, dispatched on the
 * plate source's CRS (an LV95 formula on another grid would be silently off).
 */
export function toGrid(crs, { lat, lon }) {
  if (crs === 'EPSG:2056') return wgs84ToLv95({ lat, lon });
  if (crs === 'EPSG:3035') {
    // proj4 takes and returns [x, y]: longitude first, then latitude.
    const [e, n] = proj4('EPSG:4326', 'EPSG:3035', [lon, lat]);
    return { e, n };
  }
  throw noProjection(crs);
}

/**
 * The plate's grid { e, n } -> WGS84 { lat, lon }, the inverse of toGrid on the
 * same CRS dispatch (16 D-09: the overview's plate outlines).
 */
export function fromGrid(crs, { e, n }) {
  if (crs === 'EPSG:2056') return lv95ToWgs84({ e, n });
  if (crs === 'EPSG:3035') {
    const [lon, lat] = proj4('EPSG:3035', 'EPSG:4326', [e, n]);
    return { lat, lon };
  }
  throw noProjection(crs);
}

/** Grid { e, n } -> terrain uv in `extent` (the lv95ToUv formula; it holds for any metric grid). */
export function gridToUv(grid, extent) {
  return lv95ToUv(grid, extent);
}

/** Bilinear height in metres at grid point `grid` of a loaded plate DEM (D-17). */
export function sampleAtGrid(dem, grid) {
  return sampleAtLv95(dem.metres, dem.width, dem.height, dem.extent, grid);
}
