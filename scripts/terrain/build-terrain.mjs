#!/usr/bin/env node

/**
 * Terrain build (DATA-01, D-14, D-17): committed source raster -> content-hashed
 * public/terrain/ assets and data/generated/terrain.ts. OFFLINE: it reads only
 * data/terrain/source/ (written once by scripts/terrain/fetch-dem.mjs), so CI
 * and Vercel never touch the network (T-08-09).
 *
 * One coordinate contract (D-14): every artifact derives from the one extent in
 * source.json. The heightmaps and the hero/map LODs cover that extent exactly;
 * the strip bbox comes from `stripBbox(extent, summit northing)`, never from a
 * second constant.
 *
 * Pipeline:
 *   source PNG (16-bit grey, sha256 verified against source.json, T-08-10)
 *     -> metres (Float64Array, 1100 x 1100, row 0 = north)
 *     -> heightmap-512 / heightmap-256: resampleBilinear (our code, not sharp),
 *        stored in the source unit (decimetres, heightScale 0.1) as grey16 PNG
 *     -> contours-hero (512 grid, 100 m) and contours-map (512 grid, 50 m)
 *     -> contours-strip: native-grid row window through the summit (5:1), 100 m
 *     -> hillshade-1100 / hillshade-640 (D-16): Horn hillshade, two NW lights
 *        blended (lib/terrain/hillshade.ts), 8-bit grey, AVIF + WebP. 1100 is the
 *        native grid; 640 resamples the HEIGHTS first (resampleBilinear) and
 *        shades with the scaled cell size (never resize a float raster with sharp)
 *     -> summit DEM sample (bilinear at pixel centres on the native grid) and UV
 *     -> data/generated/terrain.ts (scalars and hashed URLs only)
 *     -> data/generated/precache.json (the strip URL; postbuild injects it into
 *        public/service-worker.js so /offline keeps its footer band)
 *
 * Contours: d3-contour rings -> open runs (no segment along the raster border,
 * RESEARCH Pitfall 1) -> simplify-js (1 px, high quality) -> half-pixel rounding
 * -> split again, because rounding can move a point onto the border -> contourSvg.
 * Every 5th interval is an index contour.
 *
 * File names are `<name>.<first 10 hex of sha256(bytes)>.<ext>`.
 *
 * Plates (DATA-11, D-10 to D-12): data/terrain/plates.json lists every plate, and
 * one run builds them all in registry order (a per-plate run would sweep the
 * other plates' files, F15). Each plate reads its own `<source>/source.json` and
 * DEM and builds the outputs its registry entry declares. The home plate keeps
 * today's unprefixed names (D-11) and alone writes data/generated/terrain.ts and
 * precache.json (D-14); data/generated/plates.ts carries every plate's 2D sheet,
 * and data/generated/home-plate.ts the home plate's sheet alone (the footer's
 * client-safe input, so a new plate never reaches a client chunk).
 * Every other plate's files are `<id>-<asset>.<hash>.<ext>`, flat in public/terrain/
 * (D-11); every lookup is anchored to the plate's own prefix, so one plate's file is
 * never another plate's candidate. A threeD: false plate builds only the contour
 * LODs and poster sizes it declares, never a heightmap or a map LOD (D-12). The
 * stale-file sweep and --check compare against the union of every plate's names.
 * A plate's source is one TerrainSource variant (16 D-09): swissALTIRegio on LV95
 * or BEV ALS DTM on LAEA Europe (EPSG:3035). Its sheet is the PlateSheet branch of
 * that source's crs (extent.lv95 / extent.laea, GRID_KEYS); a plate never mixes
 * two sources. The home plate's terrain.ts stays LV95-only (TerrainMeta).
 * Each plate is held to PLATE_BUDGET (data/schemas/terrain.ts): the bytes it
 * serves and one visit's fetch; a plate over budget fails write mode before
 * anything is written, and fails --check.
 *
 * Alps overview (DATA-12, 16 D-16 to D-21): the same run builds the overview from
 * the committed GLO-90 grid (data/terrain/overview/, sha256 verified) with Tim's
 * 16-02 parameters (data/terrain/overview.json): a box blur, levels from fromM
 * every intervalM, d3-contour, a ring filter, ringPaths at simplifyPx, then
 * public/terrain/overview-contours-alps.<hash>.svg within OVERVIEW_BUDGET.
 * data/generated/overview.ts (SERVER-ONLY) carries its URL, the projection and
 * grid, one outline per region of data/regions/regions.json (its plate's four
 * extent corners in overview UV, D-17), the reference summits (D-18) and the
 * verbatim GLO-90 notice and liability sentence (D-21). The build reads
 * regions.json, so editing it leaves --check stale until terrain:build runs
 * again. A region whose plate is not registered fails. Its names join the
 * expected-name union, so the sweep keeps them and --check names a missing or
 * extra overview file (RESEARCH Pitfall 4: a separate script's files would be
 * swept). Nothing overview-related reaches terrain.ts, precache.json, plates.ts or
 * home-plate.ts, which reach the client.
 *
 * --check by artifact type (RESEARCH Pattern 3):
 *   SVG, terrain.ts and  regenerated in memory and compared byte for byte.
 *   precache.json
 *   heightmap PNG        the name's hash must equal sha256 of the committed bytes,
 *                        and the decoded pixels must equal the regenerated array
 *                        (deflate bytes may differ across platforms, pixels may not).
 *   hillshade AVIF/WebP  lossy bytes are not reproducible across platforms
 *                        (RESEARCH A1), so never regenerated in --check: the name's
 *                        hash must equal sha256 of the bytes, width/height must
 *                        match, EXIF/XMP/IPTC/ICC must be absent, and the
 *                        sourceSha256 and shading parameters recorded in
 *                        terrain.ts must equal source.json and HILLSHADE.
 *   source raster        sha256 equals source.json.
 *   public/terrain/      missing or extra managed files (contours-*.svg,
 *                        heightmap-*.png, hillshade-*.avif/webp, with or without
 *                        a plate prefix) are reported.
 *   plate budget         each plate's served and fetch bytes within PLATE_BUDGET.
 *
 * Modes:
 *   (default)  write every artifact and delete stale managed files. A committed
 *              heightmap whose hash and pixels already match is kept as is, and
 *              so is a committed poster set that passes the --check rules.
 *   --check    one line per problem, then `terrain: OK` or `terrain: N stale` (exit 1).
 *   --root <dir>  read and write under <dir> instead of the repository (the
 *              guard selftest points it at a temp copy, D-13).
 *
 * Usage:
 *   npm run terrain:build               (write)
 *   npm run terrain:build -- --check    (part of npm run data:check / lint)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { contours } from 'd3-contour';
import simplify from 'simplify-js';
import sharp from 'sharp';
import { lv95ToUv, round4, stripBbox } from '../../lib/geo.ts';
import { contourSvg, isIndexLevel, openRuns, runToPath } from '../../lib/terrain/contour-paths.ts';
import { resampleBilinear, sampleAtLv95 } from '../../lib/terrain/dem-sample.ts';
import { blendShades, hillshade, toGrey8 } from '../../lib/terrain/hillshade.ts';
import { OVERVIEW_BUDGET, OverviewConfig, OverviewSource } from '../../data/schemas/overview.ts';
import { Regions } from '../../data/schemas/region.ts';
import {
  PLATE_BUDGET,
  Plates,
  PlatesMeta,
  TerrainMeta,
  TerrainSource,
} from '../../data/schemas/terrain.ts';
import { fromGrid } from '../photos/plate-dem.mjs';

const NAME = 'terrain';

/**
 * `--check` and `--root <dir>` (the build-photo-data.mjs pattern). The root
 * defaults to the repository above this script. Parsed before any ROOT-derived
 * path, so every read and write follows --root.
 */
function parseArgs(argv) {
  const args = {
    check: false,
    root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'),
  };
  const unknown = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--check') {
      args.check = true;
    } else if (argv[i] === '--root') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        console.log(`${NAME}: --root needs a directory`);
        process.exit(1);
      }
      args.root = path.resolve(value);
      i++;
    } else {
      unknown.push(argv[i]);
    }
  }
  if (unknown.length > 0) {
    console.log(
      `${NAME}: unknown argument(s) ${unknown.join(' ')}; the flags are --check and --root <dir>`
    );
    process.exit(1);
  }
  return args;
}

const ARGS = parseArgs(process.argv.slice(2));
const ROOT = ARGS.root;
/** The plate registry (D-10): every plate this script builds, in build order. */
const PLATES_REL = 'data/terrain/plates.json';
const PUBLIC_REL = 'public/terrain';
const PUBLIC_DIR = path.join(ROOT, PUBLIC_REL);
const META_REL = 'data/generated/terrain.ts';
const META_PATH = path.join(ROOT, META_REL);
/** Same-origin URLs the service worker precaches (postbuild injects them, SHELL-04). */
const PRECACHE_REL = 'data/generated/precache.json';
const PRECACHE_PATH = path.join(ROOT, PRECACHE_REL);
/** Every plate's 2D sheet (scalars and hashed URLs), keyed by plate id. */
const PLATES_META_REL = 'data/generated/plates.ts';
const PLATES_META_PATH = path.join(ROOT, PLATES_META_REL);
/** The home plate's 2D sheet alone: what the footer and the Home callers import. */
const HOME_PLATE_REL = 'data/generated/home-plate.ts';
const HOME_PLATE_PATH = path.join(ROOT, HOME_PLATE_REL);
/** The region registry: one overview outline per region, on its plate (16 D-17). */
const REGIONS_REL = 'data/regions/regions.json';
/** The overview's committed GLO-90 grid and its record (16-13, D-16). */
const OVERVIEW_SOURCE_REL = 'data/terrain/overview';
/** Tim's 16-02 overview parameters and reference summits (D-18, D-20). */
const OVERVIEW_CONFIG_REL = 'data/terrain/overview.json';
/** The overview module: server-only, never imported by a client component. */
const OVERVIEW_META_REL = 'data/generated/overview.ts';
const OVERVIEW_META_PATH = path.join(ROOT, OVERVIEW_META_REL);
/**
 * The overview contour file's stem in public/terrain/. `overview` is a reserved
 * asset stem (ASSET_STEMS in data/schemas/terrain.ts), so no plate owns it.
 */
const OVERVIEW_CONTOURS = 'overview-contours-alps';

/**
 * Files this script owns in public/terrain/, with or without a plate prefix
 * (<id>-, D-11); anything else there is left alone.
 */
const MANAGED =
  /^(?:[a-z]+(?:-[a-z]+)*-)?(contours-[a-z0-9-]+\.[^.]+\.svg|heightmap-[0-9]+\.[^.]+\.png|hillshade-[0-9]+\.[^.]+\.(avif|webp))$/;

/**
 * The sheet key a plate's grid boxes (extent, strip) are stored under, per source
 * crs (16 D-09, RESEARCH Pattern 3): LV95 sheets keep `lv95`, so Matterhorn's
 * sheet is unchanged; a BEV ALS DTM plate's LAEA boxes are `laea`. The source's
 * own crs picks the branch, so one plate never mixes two grids (D-09).
 */
const GRID_KEYS = { 'EPSG:2056': 'lv95', 'EPSG:3035': 'laea' };
function gridKey(crs) {
  const key = GRID_KEYS[crs];
  if (!key) throw new Error(`no sheet branch for ${crs}; add it to GRID_KEYS and PlateSheet`);
  return key;
}

/**
 * D-17: the official summit, beside the DEM-sampled height. A home-plate
 * constant (terrain.ts only); the registry's matterhorn strip.centreN equals
 * lv95.n, so the strip bbox is unchanged (pinned in data/__tests__/plates.test.ts).
 */
const SUMMIT = {
  name: 'Matterhorn',
  officialM: 4478,
  officialRef: 'https://map.geo.admin.ch/?lang=en&E=2617049&N=1091673&zoom=10',
  lv95: { e: 2617049, n: 1091673 },
};

/** Heightmap grid sizes (desktop, mobile). */
const GRIDS = { desktop: 512, mobile: 256 };
/** Contour LODs (RESEARCH "Measured LOD sizes"; UI-SPEC "Contour band"). */
const HERO = { intervalM: 100, indexEvery: 5 };
const MAP = { intervalM: 50, indexEvery: 5 };
const STRIP = { intervalM: 100, indexEvery: 5, ratio: 5 };
/** The strip band's south edge snaps to this many metres (stripBbox's snapM). */
const STRIP_SNAP_M = 100;

/**
 * D-16 hillshade poster (Imhof/swisstopo convention, NW light). These are the
 * tunable parameters for Tim's poster review: the two lights (azimuth, altitude,
 * blend weight), the tone curve (`grey = shade ^ gamma`, 1 = linear) and the
 * encoder quality. They are recorded in terrain.ts, so changing one here without
 * rebuilding the poster makes --check fail.
 */
const HILLSHADE = {
  lights: [
    { azimuthDeg: 315, altitudeDeg: 45, weight: 0.75 },
    { azimuthDeg: 270, altitudeDeg: 55, weight: 0.25 },
  ],
  gamma: 1,
  quality: { avif: 50, webp: 75 },
};
/** Poster sizes: the native 1100 grid (about 10 m/px) and 640 for small screens. */
const POSTER_SIZES = [1100, 640];
const POSTER_FORMATS = ['avif', 'webp'];
/** sharp metadata `format` (and AVIF `compression`) per poster extension. */
const POSTER_DECODED = { avif: { format: 'heif', compression: 'av1' }, webp: { format: 'webp' } };

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const hashedName = (base, ext, bytes) => `${base}.${sha256(bytes).slice(0, 10)}.${ext}`;

/** 16-bit grey PNG bytes -> Uint16Array, or null when the shape is not size x size x 1. */
async function decodeGrey16(png, width, height) {
  const { data, info } = await sharp(png)
    .toColourspace('grey16')
    .raw({ depth: 'ushort' })
    .toBuffer({ resolveWithObject: true });
  if (info.width !== width || info.height !== height || info.channels !== 1) return null;
  return new Uint16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
}

/** The plate registry, parsed (an invalid registry throws the schema issues). */
function loadRegistry() {
  return Plates.parse(JSON.parse(fs.readFileSync(path.join(ROOT, PLATES_REL), 'utf8')));
}

/** Read a plate's source.json + PNG, verify the sha256, decode to metres. */
async function loadSource(plate) {
  const dir = path.join(ROOT, plate.source);
  const raw = JSON.parse(fs.readFileSync(path.join(dir, 'source.json'), 'utf8'));
  const source = TerrainSource.parse(raw);
  const png = fs.readFileSync(path.join(dir, source.file));
  const actual = sha256(png);
  if (actual !== source.sha256) {
    return {
      source,
      error: `stale ${plate.source}/${source.file} (sha256 ${actual.slice(0, 10)} != source.json ${source.sha256.slice(0, 10)})`,
    };
  }
  const u16 = await decodeGrey16(png, source.width, source.height);
  if (!u16) throw new Error(`source PNG is not ${source.width} x ${source.height} grey16`);
  const metres = Float64Array.from(u16, (v) => v * source.heightScale);
  return { source, metres };
}

/** Levels every `intervalM` from the first multiple above the minimum to the maximum. */
function levelsFor(grid, intervalM) {
  let min = Infinity;
  let max = -Infinity;
  for (const v of grid) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const levels = [];
  for (let z = (Math.floor(min / intervalM) + 1) * intervalM; z <= max; z += intervalM)
    levels.push(z);
  return levels;
}

/**
 * Simplified, half-pixel-rounded open runs of one ring; no segment lies on the
 * border. `tolerancePx` is the simplify-js tolerance: 1 px for every plate, the
 * overview's simplifyPx for the overview.
 */
function ringPaths(ring, W, H, tolerancePx = 1) {
  const { runs, closed } = openRuns(ring, W, H);
  let d = '';
  for (const run of runs) {
    const pts = simplify(
      run.map(([x, y]) => ({ x, y })),
      tolerancePx,
      true
    ).map((p) => [Math.round(p.x * 2) / 2, Math.round(p.y * 2) / 2]);
    // Drop repeated points that rounding produced.
    const dedup = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
    if (dedup.length < 2) continue;
    // Rounding can put a point on the border; split again so no border segment is stroked.
    const again = openRuns(dedup, W, H);
    for (const r of again.runs) {
      d += runToPath(
        r.map(([x, y]) => ({ x, y })),
        closed && again.closed
      );
    }
  }
  return d;
}

/** Contour SVG text for a row-major W x H metres grid. */
function contourText(grid, W, H, { intervalM, indexEvery }) {
  const paths = [];
  for (const mp of contours().size([W, H]).thresholds(levelsFor(grid, intervalM))(grid)) {
    let d = '';
    for (const poly of mp.coordinates) for (const ring of poly) d += ringPaths(ring, W, H);
    if (d) paths.push({ d, index: isIndexLevel(mp.value, intervalM, indexEvery) });
  }
  return contourSvg({ width: W, height: H, paths });
}

/**
 * A JSON file under ROOT parsed with `schema`; any failure names the file, so an
 * overview.json with two summits fails as `data/terrain/overview.json: summits: …`.
 */
function parseNamed(schema, rel) {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch (e) {
    throw new Error(`cannot read ${rel}: ${e && e.message ? e.message : String(e)}`);
  }
  const r = schema.safeParse(raw);
  if (!r.success)
    throw new Error(
      `${rel}: ${r.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')}`
    );
  return r.data;
}

/**
 * The overview's record, parameters and grid (DATA-12, 16 D-16): source.json and
 * overview.json parsed, the PNG's sha256 verified, grey16 decoded to metres.
 * A sha256 mismatch is returned as `error` (like loadSource), so --check reports
 * it as a line. Tim chose no hillshade in 16-02; a config asking for one fails
 * rather than being ignored, because this builder builds no overview poster.
 */
async function loadOverview() {
  const source = parseNamed(OverviewSource, `${OVERVIEW_SOURCE_REL}/source.json`);
  const config = parseNamed(OverviewConfig, OVERVIEW_CONFIG_REL);
  if (config.hillshade !== false)
    throw new Error(
      `${OVERVIEW_CONFIG_REL} asks for an overview hillshade; 16-02 recorded none and this builder builds no overview poster`
    );
  const png = fs.readFileSync(path.join(ROOT, OVERVIEW_SOURCE_REL, source.file));
  const actual = sha256(png);
  if (actual !== source.sha256) {
    return {
      source,
      config,
      error: `stale ${OVERVIEW_SOURCE_REL}/${source.file} (sha256 ${actual.slice(0, 10)} != source.json ${source.sha256.slice(0, 10)})`,
    };
  }
  const u16 = await decodeGrey16(png, source.width, source.height);
  if (!u16)
    throw new Error(
      `${OVERVIEW_SOURCE_REL}/${source.file} is not ${source.width} x ${source.height} grey16`
    );
  const metres = Float64Array.from(u16, (v) => v * source.heightScale);
  return { source, config, metres };
}

/** An edge-clamped `size` x `size` box blur (size 0 or 1 returns the grid as is). */
function boxBlur(grid, W, H, size) {
  if (size <= 1) return grid;
  const r = (size - 1) / 2;
  const out = new Float64Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let sum = 0;
      for (let dy = -r; dy <= r; dy++) {
        const row = Math.min(H - 1, Math.max(0, y + dy)) * W;
        for (let dx = -r; dx <= r; dx++) sum += grid[row + Math.min(W - 1, Math.max(0, x + dx))];
      }
      out[y * W + x] = sum / (size * size);
    }
  }
  return out;
}

/** True when a ring's bounding box is under `px` in both width and height (the ring filter). */
function smallRing(ring, px) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of ring) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return x1 - x0 < px && y1 - y0 < px;
}

/**
 * The overview contours with Tim's 16-02 parameters (variant C): the blur, then
 * levels every intervalM from fromM up to the blurred maximum, d3-contour, rings
 * under ringFilterPx dropped, the plates' ringPaths at simplifyPx, contourSvg.
 * Returns the SVG text and the levels that drew a ring.
 */
function overviewContours(metres, W, H, c) {
  const grid = boxBlur(metres, W, H, c.blurPx);
  let max = -Infinity;
  for (const v of grid) if (v > max) max = v;
  const thresholds = [];
  for (let z = c.fromM; z <= max; z += c.intervalM) thresholds.push(z);
  const paths = [];
  const levels = [];
  for (const mp of contours().size([W, H]).thresholds(thresholds)(grid)) {
    let d = '';
    for (const poly of mp.coordinates)
      for (const ring of poly)
        if (!smallRing(ring, c.ringFilterPx)) d += ringPaths(ring, W, H, c.simplifyPx);
    if (!d) continue;
    paths.push({ d, index: isIndexLevel(mp.value, c.intervalM, c.indexEvery) });
    levels.push(mp.value);
  }
  return { text: contourSvg({ width: W, height: H, paths }), levels };
}

/** Raw and brotli (quality 11) bytes of a text, as the overview budget counts them. */
function overviewBytes(text) {
  const raw = Buffer.byteLength(text);
  const brotli = zlib.brotliCompressSync(Buffer.from(text, 'utf8'), {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;
  return { raw, brotli };
}

/**
 * The region registry, parsed, with every region's plate in the plate registry
 * (16 D-17: each region is drawn as its plate's outline, so a region whose plate
 * has no source fails the build, naming regions.json). Checked before any plate
 * is built.
 */
function loadRegions(plates) {
  const regions = parseNamed(Regions, REGIONS_REL);
  for (const r of regions.regions) {
    if (!plates.some((p) => p.id === r.plate))
      throw new Error(
        `${REGIONS_REL}: region ${r.id}: plate ${r.plate} is not in ${PLATES_REL}, so the overview has no extent to outline`
      );
  }
  return regions;
}

/**
 * A sheet's SW and NE corners in WGS84 at 6 decimals (18-11, D-19), through the
 * same fromGrid transform the overview outlines use (proj4 for EPSG:3035). The
 * sheet margin prints them at 4 decimals; app code never projects (proj4 is a
 * scripts-only dependency, 16-09). They are the sheet's corners, never a
 * photo's position (D-25).
 */
function wgs84Corners(crs, { west, south, east, north }) {
  const at = (e, n) => {
    const { lat, lon } = fromGrid(crs, { e, n });
    return { lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6 };
  };
  return { sw: at(west, south), ne: at(east, north) };
}

/**
 * WGS84 -> overview UV (16-02 Decisions): u = (lon − west) / (east − west),
 * v = (north − lat) / (north − south) over the source's window, rounded to 4
 * decimals. The cos 46.5° x scale is the grid's aspect, not a step here.
 */
function overviewUv(source, { lat, lon }) {
  const [west, east] = source.lon;
  const [south, north] = source.lat;
  return { u: round4((lon - west) / (east - west)), v: round4((north - lat) / (north - south)) };
}
const inUnitSquare = ({ u, v }) => u >= 0 && u <= 1 && v >= 0 && v <= 1;

/**
 * One outline per region, in regions.json order (D-17): its plate's extent corners
 * SW, SE, NE, NW, from the plate's own grid to WGS84 through fromGrid (lib/geo.ts
 * for EPSG:2056, proj4 for EPSG:3035), then to overview UV. Corners are stored as
 * four points, not a box: grid convergence turns an LAEA or eastern LV95 plate by
 * about 2° (16-02). A corner outside [0, 1] fails, naming the region.
 */
function overviewOutlines(source, regions, sources) {
  return regions.regions.map((r) => {
    const plate = sources.get(r.plate);
    const { west, south, east, north } = plate.extent;
    const corners = [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
    ].map(([e, n]) => overviewUv(source, fromGrid(plate.crs, { e, n })));
    if (!corners.every(inUnitSquare))
      throw new Error(
        `region ${r.id}: plate ${r.plate}'s extent leaves the overview window (${source.lon.join('-')}° E, ${source.lat.join('-')}° N)`
      );
    return { region: r.id, plate: r.plate, corners };
  });
}

/**
 * The reference summits in overview.json order (D-18), each with its official
 * height, status, officialRef, height source, borders and UV. The source travels
 * with every record (16 IN-05), so a secondary summit with no officialRef
 * (Triglav) still carries its attribution. Kept as their own records: a summit inside
 * or touching an outline (Dufourspitze beside the Matterhorn plate) merges with
 * nothing.
 */
function overviewSummits(source, config) {
  return config.summits.map((s) => {
    const uv = overviewUv(source, s);
    if (!inUnitSquare(uv))
      throw new Error(`${OVERVIEW_CONFIG_REL}: summit ${s.name} lies outside the overview window`);
    return {
      name: s.name,
      country: s.country,
      officialM: s.officialM,
      status: s.status,
      officialRef: s.officialRef,
      source: s.source,
      borders: s.borders,
      uv,
    };
  });
}

/**
 * The Alps overview in memory (DATA-12): the contour file and the overview.ts
 * text. Built in the same run as every plate, so its file is in the expected-name
 * union and the stale-file sweep keeps it (RESEARCH Pitfall 4). The sheet stays
 * the whole arc (D-16): nothing here crops it per region. `sources` maps each
 * plate id to its parsed source record (crs and extent).
 */
function buildOverview({ source, config, metres }, regions, sources) {
  const { width: W, height: H } = source;
  const { text, levels } = overviewContours(metres, W, H, config.contours);
  const name = hashedName(OVERVIEW_CONTOURS, 'svg', text);
  const meta = {
    source: { product: source.product, release: source.release, sha256: source.sha256 },
    projection: { ...source.projection, lon: source.lon, lat: source.lat },
    grid: { width: W, height: H },
    contours: { ...config.contours, levels, url: `/terrain/${name}` },
    hillshade: config.hillshade,
    outlines: overviewOutlines(source, regions, sources),
    summits: overviewSummits(source, config),
    notice: source.notice,
    liability: source.liability,
  };
  const metaText =
    '// AUTO-GENERATED by scripts/terrain/build-terrain.mjs from data/terrain/overview/, data/terrain/overview.json and data/regions/regions.json. Do not edit.\n' +
    '// SERVER-ONLY (DATA-12): the Alps overview. Never import this from a client component;\n' +
    '// lib/__tests__/client-graph.test.ts forbids it on the client graph.\n' +
    `export const overview = ${JSON.stringify(meta, null, 2)} as const;\n`;
  return { svg: { name, text }, metaText, bytes: overviewBytes(text) };
}

/** OVERVIEW_BUDGET for the overview contour file, as messages (empty when within it). */
function overviewBudgetProblems(ov) {
  const { raw, brotli } = ov.bytes;
  const fix = '(OVERVIEW_BUDGET in data/schemas/overview.ts); change data/terrain/overview.json';
  const out = [];
  if (raw > OVERVIEW_BUDGET.contoursRawMax)
    out.push(
      `overview contours are ${raw} B raw, over the ${OVERVIEW_BUDGET.contoursRawMax} B budget ${fix}`
    );
  if (brotli > OVERVIEW_BUDGET.contoursBrotliMax)
    out.push(
      `overview contours are ${brotli} B brotli, over the ${OVERVIEW_BUDGET.contoursBrotliMax} B budget ${fix}`
    );
  if (raw > OVERVIEW_BUDGET.servedMax)
    out.push(`overview serves ${raw} B, over the ${OVERVIEW_BUDGET.servedMax} B budget ${fix}`);
  return out;
}

/** Rows of the native grid covering `bbox` (full width). */
function rowWindow(metres, source, bbox) {
  const { extent, cellM, width } = source;
  const r0 = (extent.north - bbox.north) / cellM;
  const r1 = (extent.north - bbox.south) / cellM;
  if (!Number.isInteger(r0) || !Number.isInteger(r1))
    throw new Error('strip bbox is not row-aligned');
  if (bbox.west !== extent.west || bbox.east !== extent.east)
    throw new Error('strip must span the full extent width');
  return { grid: metres.subarray(r0 * width, r1 * width), W: width, H: r1 - r0 };
}

/** Metres -> the source unit (decimetres at heightScale 0.1) as a Uint16Array. */
function toUnit(grid, heightScale) {
  const k = Math.round(1 / heightScale);
  const out = new Uint16Array(grid.length);
  for (let i = 0; i < grid.length; i++) {
    const v = Math.round(grid[i] * k);
    if (v < 0 || v > 65535) throw new Error(`height ${grid[i]} m does not fit 16 bits`);
    out[i] = v;
  }
  return out;
}

async function encodeGrey16(u16, size) {
  // Pass the Uint16Array itself: a Buffer with raw depth 'ushort' corrupts silently (STACK.md §4).
  return sharp(u16, { raw: { width: size, height: size, channels: 1 } })
    .toColourspace('grey16')
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

/**
 * The heightmap for `size`: the committed file when its name hash matches its
 * bytes and its pixels equal `u16`, else a fresh encoding. `problems` lists each
 * committed candidate that failed, with the reason. Candidates are anchored to the
 * plate's own prefix (PlatePrefix admits only [a-z-], so it is literal here).
 */
async function resolveHeightmap(prefix, size, u16) {
  const base = `${prefix}heightmap-${size}`;
  const re = new RegExp(`^${base}\\.([0-9a-f]{10})\\.png$`);
  const problems = [];
  for (const f of managedFiles().filter((n) => re.test(n))) {
    const bytes = fs.readFileSync(path.join(PUBLIC_DIR, f));
    if (sha256(bytes).slice(0, 10) !== re.exec(f)[1]) {
      problems.push({ file: f, reason: 'sha256 of the bytes does not match the name' });
      continue;
    }
    const px = await decodeGrey16(bytes, size, size);
    if (!px || px.length !== u16.length || px.some((v, i) => v !== u16[i])) {
      problems.push({ file: f, reason: 'pixels differ from a fresh build' });
      continue;
    }
    return { name: f, committed: true, problems };
  }
  const bytes = await encodeGrey16(u16, size);
  return { name: hashedName(base, 'png', bytes), bytes, committed: false, problems };
}

/** 8-bit grey poster shading of a W x H metres grid with cell size `cellM`. */
function shadeGrey8(grid, W, H, cellM) {
  const h = Float32Array.from(grid);
  const [a, b] = HILLSHADE.lights;
  let shade = blendShades(
    hillshade(h, W, H, cellM, a.azimuthDeg, a.altitudeDeg),
    hillshade(h, W, H, cellM, b.azimuthDeg, b.altitudeDeg),
    a.weight
  );
  if (HILLSHADE.gamma !== 1) shade = shade.map((v) => Math.pow(Math.max(0, v), HILLSHADE.gamma));
  return toGrey8(shade);
}

/**
 * The poster raster at `size`: the native grid as is, any other size from
 * bilinear-resampled heights shaded with the scaled cell size.
 */
function posterGrey8(source, metres, size) {
  const { width: W, height: H, cellM } = source;
  if (W !== H) throw new Error('the poster needs a square source grid');
  if (size === W) return shadeGrey8(metres, W, H, cellM);
  return shadeGrey8(resampleBilinear(metres, W, H, size, size), size, size, (cellM * W) / size);
}

/** Encode a single-channel 8-bit raster. The default pipeline keeps no metadata (Pitfall 3). */
function encodePoster(grey8, size, format) {
  const img = sharp(Buffer.from(grey8.buffer, grey8.byteOffset, grey8.byteLength), {
    raw: { width: size, height: size, channels: 1 },
  });
  return format === 'avif'
    ? img.avif({ quality: HILLSHADE.quality.avif }).toBuffer()
    : img.webp({ quality: HILLSHADE.quality.webp }).toBuffer();
}

/**
 * Why the committed poster `file` fails the --check rules, or null when it
 * passes. The name is anchored to the plate's own prefix.
 */
async function inspectPoster(file, prefix, size, format) {
  const m = new RegExp(`^${prefix}hillshade-${size}\\.([0-9a-f]{10})\\.${format}$`).exec(file);
  if (!m) return `name is not ${prefix}hillshade-${size}.<hash>.${format}`;
  const p = path.join(PUBLIC_DIR, file);
  if (!fs.existsSync(p)) return 'missing';
  const bytes = fs.readFileSync(p);
  if (sha256(bytes).slice(0, 10) !== m[1]) return 'sha256 of the bytes does not match the name';
  let info;
  try {
    info = await sharp(bytes).metadata();
  } catch {
    return 'not a decodable image';
  }
  const want = POSTER_DECODED[format];
  if (info.format !== want.format || (want.compression && info.compression !== want.compression))
    return `decodes as ${info.format}${info.compression ? `/${info.compression}` : ''}, not ${format}`;
  if (info.width !== size || info.height !== size)
    return `${info.width} x ${info.height}, expected ${size} x ${size}`;
  const carried = ['exif', 'xmp', 'iptc', 'icc'].filter((k) => info[k]);
  if (carried.length > 0) return `carries ${carried.join(', ')} metadata`;
  return null;
}

/** The committed terrain.ts as data, or null when it is missing or unreadable. */
function committedMeta() {
  if (!fs.existsSync(META_PATH)) return null;
  const m = /export const terrain = ([\s\S]*) as const;\s*$/.exec(
    fs.readFileSync(META_PATH, 'utf8')
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/**
 * The committed plates.ts as data (every plate's sheet keyed by id), or null when
 * it is missing or unreadable. An anchored parse, like committedMeta().
 */
function committedPlates() {
  if (!fs.existsSync(PLATES_META_PATH)) return null;
  const m = /export const plates = ([\s\S]*) as const;\s*$/.exec(
    fs.readFileSync(PLATES_META_PATH, 'utf8')
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/**
 * A plate's recorded poster set and the shading parameters it was generated
 * with. The home plate's set is in terrain.ts, any other plate's is its sheet in
 * plates.ts. There is one global parameter set, recorded in terrain.ts.
 */
function recordedPosters(plate) {
  const meta = committedMeta();
  if (plate.home) return { rec: meta?.assets?.hillshade, params: meta?.hillshade, rel: META_REL };
  return {
    rec: committedPlates()?.[plate.id]?.assets?.hillshade,
    params: meta?.hillshade,
    rel: PLATES_META_REL,
  };
}

/**
 * Lossy posters are never compared with a regeneration. The committed set (the
 * URLs recordedPosters() finds for the plate) is kept when every file passes
 * inspectPoster and the record carries the current source sha256 and HILLSHADE;
 * `problems` lists each file that does not, with the reasons. With `encode`, a
 * failing set is replaced by a fresh encoding (`files`); without it (--check),
 * `urls` stays the recorded set (its declared sizes only) so the module
 * comparisons report only other drift.
 */
async function resolvePosters(plate, source, metres, { rec, params, rel }, { encode }) {
  const sizes = POSTER_SIZES.filter((s) => plate.outputs.hillshade.includes(s));
  const problems = [];
  if (!rec) {
    problems.push({
      file: `${plate.prefix}hillshade-*`,
      reason: plate.home ? `no assets.hillshade in ${rel}` : `no ${plate.id} poster set in ${rel}`,
    });
  } else {
    const sameSource = rec.sourceSha256 === source.sha256;
    const sameParams = JSON.stringify(params) === JSON.stringify(HILLSHADE);
    for (const format of POSTER_FORMATS) {
      for (const size of sizes) {
        const url = rec[format]?.[size];
        const file =
          typeof url === 'string'
            ? url.replace(/^\/terrain\//, '')
            : `${plate.prefix}hillshade-${size}.<hash>.${format}`;
        const reasons = [];
        const bad =
          typeof url === 'string'
            ? await inspectPoster(file, plate.prefix, size, format)
            : `not recorded in ${rel}`;
        if (bad) reasons.push(bad);
        if (!sameSource)
          reasons.push(
            `generated from source sha256 ${String(rec.sourceSha256).slice(0, 10)}, source.json has ${source.sha256.slice(0, 10)}`
          );
        if (!sameParams) reasons.push('HILLSHADE parameters changed since it was generated');
        if (reasons.length > 0) problems.push({ file, reason: reasons.join('; ') });
      }
    }
  }
  // Only the declared sizes are kept (15 WR-01): a size dropped from the plate's
  // outputs then leaves plates.ts stale and its files unreferenced, so --check
  // names them as extra and write mode sweeps them.
  const pick = (o) =>
    Object.fromEntries(sizes.filter((s) => typeof o?.[s] === 'string').map((s) => [s, o[s]]));
  const recorded = rec ? { avif: pick(rec.avif), webp: pick(rec.webp) } : null;
  if (problems.length === 0) return { urls: recorded, files: [], committed: true, problems };
  if (!encode) return { urls: recorded, files: [], committed: false, problems };
  const urls = { avif: {}, webp: {} };
  const files = [];
  for (const size of sizes) {
    const grey = posterGrey8(source, metres, size);
    for (const format of POSTER_FORMATS) {
      const bytes = await encodePoster(grey, size, format);
      const name = hashedName(`${plate.prefix}hillshade-${size}`, format, bytes);
      files.push({ name, bytes });
      urls[format][size] = `/terrain/${name}`;
    }
  }
  return { urls, files, committed: false, problems };
}

/**
 * One plate's artifacts and its 2D sheet, all in memory; the home plate also
 * yields the terrain.ts and precache.json texts. Every output is a pure function
 * of the plate's own raster, so the registry order changes no byte.
 */
async function buildPlate(plate, source, metres, { encode }) {
  const { extent, width: W, height: H } = source;
  const { prefix, outputs } = plate;
  const svgs = [];
  const pngs = [];

  // Heightmaps (declared sizes, in GRIDS order) and the 512 grid the hero/map LODs
  // are contoured on.
  const grid512 = Float64Array.from(resampleBilinear(metres, W, H, GRIDS.desktop, GRIDS.desktop));
  for (const size of [GRIDS.desktop, GRIDS.mobile]) {
    if (!(outputs.heightmaps ?? []).includes(size)) continue;
    const grid =
      size === GRIDS.desktop
        ? grid512
        : Float64Array.from(resampleBilinear(metres, W, H, size, size));
    pngs.push({
      size,
      ...(await resolveHeightmap(prefix, size, toUnit(grid, source.heightScale))),
    });
  }

  const lod = (base, text) => {
    const name = hashedName(`${prefix}${base}`, 'svg', text);
    svgs.push({ name, text });
    return `/terrain/${name}`;
  };
  const heroUrl = lod('contours-hero', contourText(grid512, GRIDS.desktop, GRIDS.desktop, HERO));
  const mapUrl = outputs.contours.includes('map')
    ? lod('contours-map', contourText(grid512, GRIDS.desktop, GRIDS.desktop, MAP))
    : null;
  // 16 D-22 IN-05: stripBbox clamps a centre outside the extent into it, which would
  // silently draw another band; a misplaced centre fails instead.
  const { centreN } = plate.strip;
  if (!(extent.south < centreN && centreN < extent.north))
    throw new Error(
      `plate ${plate.id}: strip.centreN ${centreN} is outside its extent (${extent.south}..${extent.north}); fix ${PLATES_REL}`
    );
  // 16 IN-06: a centre inside the extent but within half a band of its south or
  // north edge would still be shifted by stripBbox's clamp. Compute the band as
  // stripBbox does (extent width / ratio tall, south snapped) and fail when it
  // leaves the extent, so no committed plate ever reaches the clamp.
  const bandM = (extent.east - extent.west) / STRIP.ratio;
  const bandSouth = Math.round((centreN - bandM / 2) / STRIP_SNAP_M) * STRIP_SNAP_M;
  if (bandSouth < extent.south || bandSouth + bandM > extent.north)
    throw new Error(
      `plate ${plate.id}: strip band ${bandSouth}..${bandSouth + bandM} for centreN ${centreN} leaves its extent (${extent.south}..${extent.north}); fix ${PLATES_REL}`
    );
  const strip = stripBbox(extent, centreN, STRIP.ratio, STRIP_SNAP_M);
  const box = gridKey(source.crs);
  const sw = rowWindow(metres, source, strip);
  const stripUrl = lod('contours-strip', contourText(sw.grid, sw.W, sw.H, STRIP));
  const pngUrl = (size) => `/terrain/${pngs.find((p) => p.size === size).name}`;

  const posters = await resolvePosters(plate, source, metres, recordedPosters(plate), { encode });
  // --check with no recorded poster: the modules cannot be rebuilt, the problem says why.
  if (!posters.urls)
    return { svgs, pngs, posters, sheet: null, metaText: null, precacheText: null };

  const sheet = {
    id: plate.id,
    prefix,
    home: plate.home,
    threeD: plate.threeD,
    crs: source.crs,
    // The sheet branch of the source's crs: extent.lv95 / extent.laea (16 D-09).
    // An EPSG:3035 sheet also carries its WGS84 corners for the sheet margin (18-11,
    // D-19); an LV95 sheet converts through lib/geo.ts, so Matterhorn's is unchanged.
    extent: {
      [box]: extent,
      widthM: extent.east - extent.west,
      heightM: extent.north - extent.south,
      ...(source.crs === 'EPSG:3035' ? { wgs84: wgs84Corners(source.crs, extent) } : {}),
    },
    dem: { product: source.product, edition: source.edition, cellM: source.cellM },
    contours: {
      hero: HERO,
      ...(mapUrl ? { map: MAP } : {}),
      strip: { intervalM: STRIP.intervalM, indexEvery: STRIP.indexEvery, [box]: strip },
    },
    assets: {
      ...(pngs.length > 0
        ? { heightmap: Object.fromEntries(pngs.map((p) => [p.size, pngUrl(p.size)])) }
        : {}),
      contours: { hero: heroUrl, ...(mapUrl ? { map: mapUrl } : {}), strip: stripUrl },
      hillshade: { ...posters.urls, sourceSha256: source.sha256 },
    },
  };
  if (!plate.home) return { svgs, pngs, posters, sheet, metaText: null, precacheText: null };

  // The home plate's full module: SUMMIT and GRIDS are home-plate constants.
  const demM = Math.round(sampleAtLv95(metres, W, H, extent, SUMMIT.lv95));
  const uv = lv95ToUv(SUMMIT.lv95, extent);
  const meta = TerrainMeta.parse({
    crs: source.crs,
    extent: {
      lv95: extent,
      widthM: extent.east - extent.west,
      heightM: extent.north - extent.south,
    },
    dem: {
      product: source.product,
      edition: source.edition,
      stacDatetime: source.stacDatetime,
      heightScale: source.heightScale,
      cellM: source.cellM,
    },
    grids: GRIDS,
    contours: {
      hero: HERO,
      map: MAP,
      strip: { intervalM: STRIP.intervalM, indexEvery: STRIP.indexEvery, lv95: strip },
    },
    hillshade: HILLSHADE,
    summit: { ...SUMMIT, demM, uv: { u: round4(uv.u), v: round4(uv.v) } },
    assets: {
      heightmap: { 512: pngUrl(GRIDS.desktop), 256: pngUrl(GRIDS.mobile) },
      contours: { hero: heroUrl, map: mapUrl, strip: stripUrl },
      hillshade: { ...posters.urls, sourceSha256: source.sha256 },
    },
  });

  const metaText =
    '// AUTO-GENERATED by scripts/terrain/build-terrain.mjs from data/terrain/source/. Do not edit.\n' +
    '// Scalars and content-hashed URLs only: no imports, no path data (client-safe, T-08-12).\n' +
    `export const terrain = ${JSON.stringify(meta, null, 2)} as const;\n`;
  // Precached at install so /offline renders with its art on a first offline
  // visit (D-12): the footer strip keeps its band (UI-SPEC "Contour band"), the
  // hero LOD its edge-art sheet (EdgeArt, 12-30 C2).
  const precacheText = `${JSON.stringify(
    [meta.assets.contours.strip, meta.assets.contours.hero],
    null,
    2
  )}\n`;
  return { svgs, pngs, posters, sheet, metaText, precacheText };
}

/** Every plate's validated sheet keyed by id (registry order), or null when one is missing. */
function platesMeta(built) {
  if (built.some((b) => b.sheet === null)) return null;
  return PlatesMeta.parse(Object.fromEntries(built.map((b) => [b.plate.id, b.sheet])));
}

/** The plates.ts text for every plate's sheet (registry order), or null when one is missing. */
function platesText(built) {
  const meta = platesMeta(built);
  if (meta === null) return null;
  return (
    '// AUTO-GENERATED by scripts/terrain/build-terrain.mjs from data/terrain/plates.json. Do not edit.\n' +
    "// Every plate's 2D sheet: scalars and content-hashed URLs only (client-safe).\n" +
    `export const plates = ${JSON.stringify(meta, null, 2)} as const;\n`
  );
}

/**
 * The home-plate.ts text: the home plate's sheet alone, JSON-equal to its entry in
 * plates.ts, or null when a sheet is missing (plates.ts already reports that).
 */
function homePlateText(built) {
  const meta = platesMeta(built);
  if (meta === null) return null;
  return (
    '// AUTO-GENERATED by scripts/terrain/build-terrain.mjs from data/terrain/plates.json. Do not edit.\n' +
    "// The home plate's 2D sheet only (client-safe): the footer chunk imports this, never plates.ts.\n" +
    `export const homePlate = ${JSON.stringify(meta[homeOf(built).plate.id], null, 2)} as const;\n`
  );
}

/** File names of a poster URL set ({ avif: { 1100, 640 }, webp: { 1100, 640 } }). */
function posterFiles(urls) {
  if (!urls) return [];
  return POSTER_FORMATS.flatMap((format) =>
    POSTER_SIZES.map((size) => urls[format]?.[size]).filter((u) => typeof u === 'string')
  ).map((u) => u.replace(/^\/terrain\//, ''));
}

function managedFiles() {
  if (!fs.existsSync(PUBLIC_DIR)) return [];
  return fs
    .readdirSync(PUBLIC_DIR)
    .filter((f) => MANAGED.test(f))
    .sort();
}

/** Every plate of the registry built in memory, in registry order. */
async function buildPlates(plates, { encode }) {
  const built = [];
  for (const plate of plates) {
    const loaded = await loadSource(plate);
    if (loaded.error) throw new Error(`${loaded.error}; re-run npm run terrain:fetch`);
    built.push({
      plate,
      source: loaded.source,
      ...(await buildPlate(plate, loaded.source, loaded.metres, { encode })),
    });
  }
  return built;
}

/** Each built plate's parsed source record keyed by plate id (the overview outlines read crs and extent). */
const sourcesOf = (built) => new Map(built.map((b) => [b.plate.id, b.source]));

/** The home plate's build (Plates guarantees exactly one). */
const homeOf = (built) => built.find((b) => b.plate.home);

/** Every public/terrain/ file name one plate's build references. */
const namesOf = (b) => [
  ...b.svgs.map((a) => a.name),
  ...b.pngs.map((a) => a.name),
  ...posterFiles(b.posters.urls),
];

/**
 * The byte size of a file one plate's build references: from memory when this
 * run produced it, else from public/terrain/; null when it exists nowhere.
 */
function sizeLookup(b) {
  const sizes = new Map();
  for (const s of b.svgs) sizes.set(s.name, Buffer.byteLength(s.text));
  for (const p of b.pngs) if (p.bytes) sizes.set(p.name, p.bytes.length);
  for (const f of b.posters.files) sizes.set(f.name, f.bytes.length);
  return (name) => {
    if (sizes.has(name)) return sizes.get(name);
    const p = path.join(PUBLIC_DIR, name);
    return fs.existsSync(p) ? fs.statSync(p).size : null;
  };
}

/**
 * PLATE_BUDGET (research ARCHITECTURE §2.4) for one plate's build, as messages:
 * the sum of every file its sheet references against servedMax3D or servedMax2D,
 * and one visit's fetch (the AVIF poster, 1100 or else 640, + hero + strip)
 * against fetchMax. Skipped when a file is missing, which is reported elsewhere.
 */
function budgetProblems(b) {
  if (!b.sheet) return [];
  const size = sizeLookup(b);
  const served = namesOf(b).map(size);
  const { avif } = b.sheet.assets.hillshade;
  const poster = (avif[1100] ?? avif[640]).replace(/^\/terrain\//, '');
  const { hero, strip } = b.sheet.assets.contours;
  const fetched = [poster, hero, strip].map((u) => size(u.replace(/^\/terrain\//, '')));
  if ([...served, ...fetched].some((n) => n === null)) return [];
  const sum = (ns) => ns.reduce((a, n) => a + n, 0);
  const servedMax = b.plate.threeD ? PLATE_BUDGET.servedMax3D : PLATE_BUDGET.servedMax2D;
  const fix = '(PLATE_BUDGET in data/schemas/terrain.ts); shrink the plate extent or its outputs';
  const out = [];
  if (sum(served) > servedMax)
    out.push(`plate ${b.plate.id} serves ${sum(served)} B, over its ${servedMax} B budget ${fix}`);
  if (sum(fetched) > PLATE_BUDGET.fetchMax)
    out.push(
      `plate ${b.plate.id} fetches ${sum(fetched)} B per visit, over its ${PLATE_BUDGET.fetchMax} B budget ${fix}`
    );
  return out;
}

async function write() {
  // 16 D-22 IN-06: the recorded HILLSHADE parameters live in terrain.ts. An
  // unreadable terrain.ts would read as "parameters changed" and re-encode every
  // plate's lossy posters, so refuse before anything is built or written.
  if (fs.existsSync(META_PATH) && committedMeta() === null)
    throw new Error(`cannot read ${META_REL}; refusing to re-encode posters`);
  const { plates: registry } = loadRegistry();
  const regions = loadRegions(registry);
  const overviewLoaded = await loadOverview();
  if (overviewLoaded.error)
    throw new Error(`${overviewLoaded.error}; re-run npm run terrain:fetch:overview`);
  const built = await buildPlates(registry, { encode: true });
  const ov = buildOverview(overviewLoaded, regions, sourcesOf(built));
  // Every plate and the overview within budget before a single file is written.
  const over = [...built.flatMap(budgetProblems), ...overviewBudgetProblems(ov)];
  if (over.length > 0) {
    for (const m of over) console.log(`${NAME}: ${m}`);
    console.log(`${NAME}: ${over.length} over budget`);
    process.exit(1);
  }
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  for (const { svgs, pngs, posters } of built) {
    for (const s of svgs) {
      fs.writeFileSync(path.join(PUBLIC_DIR, s.name), s.text, 'utf8');
      console.log(`${NAME}: wrote ${PUBLIC_REL}/${s.name} (${Buffer.byteLength(s.text)} bytes)`);
    }
    for (const p of pngs) {
      if (p.committed) {
        console.log(`${NAME}: kept ${PUBLIC_REL}/${p.name} (hash and pixels match)`);
        continue;
      }
      fs.writeFileSync(path.join(PUBLIC_DIR, p.name), p.bytes);
      console.log(`${NAME}: wrote ${PUBLIC_REL}/${p.name} (${p.bytes.length} bytes)`);
    }
    for (const f of posters.files) {
      fs.writeFileSync(path.join(PUBLIC_DIR, f.name), f.bytes);
      console.log(`${NAME}: wrote ${PUBLIC_REL}/${f.name} (${f.bytes.length} bytes)`);
    }
    if (posters.committed)
      for (const f of posterFiles(posters.urls))
        console.log(`${NAME}: kept ${PUBLIC_REL}/${f} (poster checks pass)`);
  }
  fs.writeFileSync(path.join(PUBLIC_DIR, ov.svg.name), ov.svg.text, 'utf8');
  console.log(
    `${NAME}: wrote ${PUBLIC_REL}/${ov.svg.name} (${ov.bytes.raw} bytes, ${ov.bytes.brotli} brotli)`
  );
  // The overview's names join the plates' union, so the sweep keeps them (Pitfall 4).
  const keep = new Set([...built.flatMap(namesOf), ov.svg.name]);
  for (const f of managedFiles()) {
    if (!keep.has(f)) {
      fs.unlinkSync(path.join(PUBLIC_DIR, f));
      console.log(`${NAME}: removed stale ${PUBLIC_REL}/${f}`);
    }
  }
  const { metaText, precacheText } = homeOf(built);
  const plates = platesText(built);
  fs.mkdirSync(path.dirname(META_PATH), { recursive: true });
  fs.writeFileSync(META_PATH, metaText, 'utf8');
  console.log(`${NAME}: wrote ${META_REL} (${Buffer.byteLength(metaText)} bytes)`);
  fs.writeFileSync(PRECACHE_PATH, precacheText, 'utf8');
  console.log(`${NAME}: wrote ${PRECACHE_REL} (${Buffer.byteLength(precacheText)} bytes)`);
  fs.writeFileSync(PLATES_META_PATH, plates, 'utf8');
  console.log(`${NAME}: wrote ${PLATES_META_REL} (${Buffer.byteLength(plates)} bytes)`);
  const homePlate = homePlateText(built);
  fs.writeFileSync(HOME_PLATE_PATH, homePlate, 'utf8');
  console.log(`${NAME}: wrote ${HOME_PLATE_REL} (${Buffer.byteLength(homePlate)} bytes)`);
  fs.writeFileSync(OVERVIEW_META_PATH, ov.metaText, 'utf8');
  console.log(`${NAME}: wrote ${OVERVIEW_META_REL} (${Buffer.byteLength(ov.metaText)} bytes)`);
  console.log(`${NAME}: OK`);
}

/** One plate's problems: its recorded posters, contour SVGs and heightmaps. */
function plateLines({ svgs, pngs, posters }, lines, reported) {
  for (const bad of posters.problems) {
    lines.push(`${NAME}: stale ${PUBLIC_REL}/${bad.file} (${bad.reason})`);
    reported.add(bad.file);
  }
  for (const s of svgs) {
    const p = path.join(PUBLIC_DIR, s.name);
    if (!fs.existsSync(p)) lines.push(`${NAME}: missing ${PUBLIC_REL}/${s.name}`);
    else if (fs.readFileSync(p, 'utf8') !== s.text)
      lines.push(`${NAME}: stale ${PUBLIC_REL}/${s.name} (bytes differ from a fresh build)`);
  }
  for (const p of pngs) {
    for (const bad of p.problems) {
      lines.push(`${NAME}: stale ${PUBLIC_REL}/${bad.file} (${bad.reason})`);
      reported.add(bad.file);
    }
    if (!p.committed && p.problems.length === 0)
      lines.push(`${NAME}: missing ${PUBLIC_REL}/${p.name}`);
  }
}

/** A generated module compared byte for byte; null text means a problem already reported it. */
function moduleLine(rel, full, text, lines) {
  if (!fs.existsSync(full)) lines.push(`${NAME}: missing ${rel}`);
  else if (text !== null && fs.readFileSync(full, 'utf8') !== text)
    lines.push(`${NAME}: stale ${rel} (bytes differ from a fresh build)`);
}

async function check() {
  const lines = [];
  const { plates } = loadRegistry();
  const regions = loadRegions(plates);
  const loadedAll = [];
  for (const plate of plates) {
    const loaded = await loadSource(plate);
    loadedAll.push({ plate, ...loaded });
    if (!loaded.error) continue;
    lines.push(`${NAME}: ${loaded.error}`);
    // A plate's recorded posters name the source they were generated from; name
    // every one that source.json no longer vouches for.
    const { rec } = recordedPosters(plate);
    if (rec && rec.sourceSha256 !== loaded.source.sha256) {
      for (const f of posterFiles(rec))
        lines.push(
          `${NAME}: stale ${PUBLIC_REL}/${f} (generated from source sha256 ${String(rec.sourceSha256).slice(0, 10)}, source.json has ${loaded.source.sha256.slice(0, 10)})`
        );
    }
  }
  const overviewLoaded = await loadOverview();
  if (overviewLoaded.error) lines.push(`${NAME}: ${overviewLoaded.error}`);
  if (lines.length > 0) {
    for (const l of lines) console.log(l);
    console.log(`${NAME}: ${lines.length} stale`);
    process.exit(1);
  }
  const built = [];
  for (const { plate, source, metres } of loadedAll)
    built.push({ plate, source, ...(await buildPlate(plate, source, metres, { encode: false })) });
  const ov = buildOverview(overviewLoaded, regions, sourcesOf(built));

  // The overview's names are in the union, so a missing or extra overview file is named.
  const expected = new Set([...built.flatMap(namesOf), ov.svg.name]);
  const reported = new Set();
  for (const b of built) plateLines(b, lines, reported);
  plateLines({ svgs: [ov.svg], pngs: [], posters: { problems: [] } }, lines, reported);
  for (const b of built) for (const m of budgetProblems(b)) lines.push(`${NAME}: ${m}`);
  for (const m of overviewBudgetProblems(ov)) lines.push(`${NAME}: ${m}`);
  for (const f of managedFiles()) {
    if (!expected.has(f) && !reported.has(f)) lines.push(`${NAME}: extra ${PUBLIC_REL}/${f}`);
  }
  const { metaText, precacheText } = homeOf(built);
  moduleLine(META_REL, META_PATH, metaText, lines);
  // Without a recorded poster set terrain.ts cannot be rebuilt; reported above.
  if (precacheText !== null) moduleLine(PRECACHE_REL, PRECACHE_PATH, precacheText, lines);
  moduleLine(PLATES_META_REL, PLATES_META_PATH, platesText(built), lines);
  moduleLine(HOME_PLATE_REL, HOME_PLATE_PATH, homePlateText(built), lines);
  moduleLine(OVERVIEW_META_REL, OVERVIEW_META_PATH, ov.metaText, lines);

  for (const l of lines) console.log(l);
  console.log(lines.length === 0 ? `${NAME}: OK` : `${NAME}: ${lines.length} stale`);
  process.exit(lines.length === 0 ? 0 : 1);
}

(ARGS.check ? check() : write()).catch((e) => {
  if (e && Array.isArray(e.issues)) {
    for (const i of e.issues) console.log(`${NAME}: schema ${i.path.join('.')}: ${i.message}`);
    console.log(`${NAME}: ${e.issues.length} schema violations`);
  } else {
    console.log(`${NAME}: ${e && e.message ? e.message : String(e)}`);
  }
  process.exit(1);
});
