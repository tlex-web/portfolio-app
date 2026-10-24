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
 *     -> summit DEM sample (bilinear at pixel centres on the native grid) and UV
 *     -> data/generated/terrain.ts (scalars and hashed URLs only)
 *
 * Contours: d3-contour rings -> open runs (no segment along the raster border,
 * RESEARCH Pitfall 1) -> simplify-js (1 px, high quality) -> half-pixel rounding
 * -> split again, because rounding can move a point onto the border -> contourSvg.
 * Every 5th interval is an index contour.
 *
 * File names are `<name>.<first 10 hex of sha256(bytes)>.<ext>`.
 *
 * --check by artifact type (RESEARCH Pattern 3):
 *   SVG and terrain.ts   regenerated in memory and compared byte for byte.
 *   heightmap PNG        the name's hash must equal sha256 of the committed bytes,
 *                        and the decoded pixels must equal the regenerated array
 *                        (deflate bytes may differ across platforms, pixels may not).
 *   source raster        sha256 equals source.json.
 *   public/terrain/      missing or extra managed files (contours-*.svg,
 *                        heightmap-*.png) are reported.
 *
 * Modes:
 *   (default)  write every artifact and delete stale managed files. A committed
 *              heightmap whose hash and pixels already match is kept as is.
 *   --check    one line per problem, then `terrain: OK` or `terrain: N stale` (exit 1).
 *
 * Usage:
 *   npm run terrain:build               (write)
 *   npm run terrain:build -- --check    (part of npm run data:check / lint)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contours } from 'd3-contour';
import simplify from 'simplify-js';
import sharp from 'sharp';
import { lv95ToUv, round4, stripBbox } from '../../lib/geo.ts';
import { contourSvg, isIndexLevel, openRuns, runToPath } from '../../lib/terrain/contour-paths.ts';
import { resampleBilinear, sampleAtLv95 } from '../../lib/terrain/dem-sample.ts';
import { TerrainMeta, TerrainSource } from '../../data/schemas/terrain.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE_DIR = path.join(ROOT, 'data', 'terrain', 'source');
const PUBLIC_REL = 'public/terrain';
const PUBLIC_DIR = path.join(ROOT, PUBLIC_REL);
const META_REL = 'data/generated/terrain.ts';
const META_PATH = path.join(ROOT, META_REL);
const NAME = 'terrain';

/** Files this script owns in public/terrain/; anything else there is left alone. */
const MANAGED = /^(contours-[a-z0-9-]+\.[^.]+\.svg|heightmap-[0-9]+\.[^.]+\.png)$/;

/** D-17: the official summit, beside the DEM-sampled height. */
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

/** Read source.json + PNG, verify the sha256, decode to metres. */
async function loadSource() {
  const raw = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'source.json'), 'utf8'));
  const source = TerrainSource.parse(raw);
  const png = fs.readFileSync(path.join(SOURCE_DIR, source.file));
  const actual = sha256(png);
  if (actual !== source.sha256) {
    return {
      source,
      error: `stale data/terrain/source/${source.file} (sha256 ${actual.slice(0, 10)} != source.json ${source.sha256.slice(0, 10)})`,
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

/** Simplified, half-pixel-rounded open runs of one ring; no segment lies on the border. */
function ringPaths(ring, W, H) {
  const { runs, closed } = openRuns(ring, W, H);
  let d = '';
  for (const run of runs) {
    const pts = simplify(
      run.map(([x, y]) => ({ x, y })),
      1,
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
 * committed candidate that failed, with the reason.
 */
async function resolveHeightmap(size, u16) {
  const base = `heightmap-${size}`;
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

/** Every artifact plus the terrain.ts text, all in memory. */
async function buildAll(source, metres) {
  const { extent, width: W, height: H } = source;
  const svgs = [];
  const pngs = [];

  // Heightmaps and the 512 grid the hero/map LODs are contoured on.
  const grid512 = Float64Array.from(resampleBilinear(metres, W, H, GRIDS.desktop, GRIDS.desktop));
  const grid256 = Float64Array.from(resampleBilinear(metres, W, H, GRIDS.mobile, GRIDS.mobile));
  for (const [size, grid] of [
    [GRIDS.desktop, grid512],
    [GRIDS.mobile, grid256],
  ]) {
    pngs.push({ size, ...(await resolveHeightmap(size, toUnit(grid, source.heightScale))) });
  }

  const lod = (base, text) => {
    const name = hashedName(base, 'svg', text);
    svgs.push({ name, text });
    return `/terrain/${name}`;
  };
  const heroUrl = lod('contours-hero', contourText(grid512, GRIDS.desktop, GRIDS.desktop, HERO));
  const mapUrl = lod('contours-map', contourText(grid512, GRIDS.desktop, GRIDS.desktop, MAP));
  const strip = stripBbox(extent, SUMMIT.lv95.n, STRIP.ratio);
  const sw = rowWindow(metres, source, strip);
  const stripUrl = lod('contours-strip', contourText(sw.grid, sw.W, sw.H, STRIP));

  const demM = Math.round(sampleAtLv95(metres, W, H, extent, SUMMIT.lv95));
  const uv = lv95ToUv(SUMMIT.lv95, extent);
  const pngUrl = (size) => `/terrain/${pngs.find((p) => p.size === size).name}`;

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
    summit: { ...SUMMIT, demM, uv: { u: round4(uv.u), v: round4(uv.v) } },
    assets: {
      heightmap: { 512: pngUrl(GRIDS.desktop), 256: pngUrl(GRIDS.mobile) },
      contours: { hero: heroUrl, map: mapUrl, strip: stripUrl },
    },
  });

  const metaText =
    '// AUTO-GENERATED by scripts/terrain/build-terrain.mjs from data/terrain/source/. Do not edit.\n' +
    '// Scalars and content-hashed URLs only: no imports, no path data (client-safe, T-08-12).\n' +
    `export const terrain = ${JSON.stringify(meta, null, 2)} as const;\n`;
  return { svgs, pngs, metaText };
}

function managedFiles() {
  if (!fs.existsSync(PUBLIC_DIR)) return [];
  return fs
    .readdirSync(PUBLIC_DIR)
    .filter((f) => MANAGED.test(f))
    .sort();
}

async function write() {
  const loaded = await loadSource();
  if (loaded.error) throw new Error(`${loaded.error}; re-run npm run terrain:fetch`);
  const { svgs, pngs, metaText } = await buildAll(loaded.source, loaded.metres);
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
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
  const keep = new Set([...svgs, ...pngs].map((a) => a.name));
  for (const f of managedFiles()) {
    if (!keep.has(f)) {
      fs.unlinkSync(path.join(PUBLIC_DIR, f));
      console.log(`${NAME}: removed stale ${PUBLIC_REL}/${f}`);
    }
  }
  fs.mkdirSync(path.dirname(META_PATH), { recursive: true });
  fs.writeFileSync(META_PATH, metaText, 'utf8');
  console.log(`${NAME}: wrote ${META_REL} (${Buffer.byteLength(metaText)} bytes)`);
  console.log(`${NAME}: OK`);
}

async function check() {
  const lines = [];
  const loaded = await loadSource();
  if (loaded.error) {
    console.log(`${NAME}: ${loaded.error}`);
    console.log(`${NAME}: 1 stale`);
    process.exit(1);
  }
  const { svgs, pngs, metaText } = await buildAll(loaded.source, loaded.metres);
  const expected = new Set([...svgs, ...pngs].map((a) => a.name));
  const reported = new Set();
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
  for (const f of managedFiles()) {
    if (!expected.has(f) && !reported.has(f)) lines.push(`${NAME}: extra ${PUBLIC_REL}/${f}`);
  }
  if (!fs.existsSync(META_PATH)) lines.push(`${NAME}: missing ${META_REL}`);
  else if (fs.readFileSync(META_PATH, 'utf8') !== metaText)
    lines.push(`${NAME}: stale ${META_REL} (bytes differ from a fresh build)`);

  for (const l of lines) console.log(l);
  console.log(lines.length === 0 ? `${NAME}: OK` : `${NAME}: ${lines.length} stale`);
  process.exit(lines.length === 0 ? 0 : 1);
}

const args = process.argv.slice(2);
const unknown = args.filter((a) => a !== '--check');
if (unknown.length > 0) {
  console.log(`${NAME}: unknown argument(s) ${unknown.join(' ')}; the only flag is --check`);
  process.exit(1);
}

(args.includes('--check') ? check() : write()).catch((e) => {
  if (e && Array.isArray(e.issues)) {
    for (const i of e.issues) console.log(`${NAME}: schema ${i.path.join('.')}: ${i.message}`);
    console.log(`${NAME}: ${e.issues.length} schema violations`);
  } else {
    console.log(`${NAME}: ${e && e.message ? e.message : String(e)}`);
  }
  process.exit(1);
});
