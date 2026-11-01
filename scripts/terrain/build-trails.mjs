#!/usr/bin/env node

/**
 * Trail profile build (ENG-01, D-05, D-07, 08 D-17): committed trail geometry +
 * committed DEM -> data/generated/trail-profiles.ts. OFFLINE: it reads only
 * data/terrain/source/ (trails.json is written once by
 * scripts/terrain/fetch-trails.mjs, the DEM by fetch-dem.mjs), so CI and Vercel
 * never touch the network (T-08-09).
 *
 * Pipeline (RESEARCH Pattern 4):
 *   source.json + dem-10m.png (sha256 verified against source.json, T-11-09)
 *     -> metres (grey16 decode exactly as build-terrain.mjs, x heightScale)
 *   trails.json (TrailsFile; each polylineSha256 verified, T-11-09)
 *     -> 128 stations at equal arc length (resampleByArcLength)
 *     -> DEM height at every station (sampleAtLv95, bilinear at pixel centres);
 *        a station outside the extent fails the build
 *     -> x = share of the length, y = share of the height range, 3 decimals
 *        (normaliseProfile)
 *     -> start/end heightM: rounded DEM samples at the first/last vertex
 *        (08 D-17: DEM heights, not brochure heights); lengthM: rounded
 *        polylineLength
 *     -> data/generated/trail-profiles.ts (no imports; Server Components only)
 *
 * Never writes data/generated/terrain.ts (its test caps it at 4 KB with no path data).
 *
 * Modes:
 *   (default)  write data/generated/trail-profiles.ts; refuses on any sha256 mismatch.
 *   --check    regenerate in memory and byte-compare; one line per problem, then
 *              `trails: OK` or `trails: N stale` (exit 1).
 *
 * Usage:
 *   npm run trails:build               (write)
 *   npm run trails:build -- --check    (part of npm run data:check / lint)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { sampleAtLv95 } from '../../lib/terrain/dem-sample.ts';
import { normaliseProfile, polylineLength, resampleByArcLength } from '../../lib/trail-profile.ts';
import { TerrainSource } from '../../data/schemas/terrain.ts';
import { TrailsFile } from '../../data/schemas/trail.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE_DIR = path.join(ROOT, 'data', 'terrain', 'source');
const OUT_REL = 'data/generated/trail-profiles.ts';
const OUT_PATH = path.join(ROOT, OUT_REL);
const NAME = 'trails';
/** Stations per profile: enough for a 320 px glyph, small enough for an RSC prop. */
const STATIONS = 128;

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

/** 16-bit grey PNG bytes -> Uint16Array, or null when the shape is not width x height x 1. */
async function decodeGrey16(png, width, height) {
  const { data, info } = await sharp(png)
    .toColourspace('grey16')
    .raw({ depth: 'ushort' })
    .toBuffer({ resolveWithObject: true });
  if (info.width !== width || info.height !== height || info.channels !== 1) return null;
  return new Uint16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
}

/** source.json + PNG (sha256 verified) -> metres, or a problem line. */
async function loadDem() {
  const source = TerrainSource.parse(
    JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'source.json'), 'utf8'))
  );
  const png = fs.readFileSync(path.join(SOURCE_DIR, source.file));
  const actual = sha256(png);
  if (actual !== source.sha256) {
    return {
      error: `stale data/terrain/source/${source.file} (sha256 ${actual.slice(0, 10)} != source.json ${source.sha256.slice(0, 10)})`,
    };
  }
  const u16 = await decodeGrey16(png, source.width, source.height);
  if (!u16) throw new Error(`source PNG is not ${source.width} x ${source.height} grey16`);
  return { source, metres: Float64Array.from(u16, (v) => v * source.heightScale) };
}

/** trails.json, plus one problem line per polyline whose sha256 does not match. */
function loadTrails() {
  const file = TrailsFile.parse(
    JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'trails.json'), 'utf8'))
  );
  const problems = [];
  for (const t of file.trails) {
    const actual = sha256(JSON.stringify(t.polyline));
    if (actual !== t.polylineSha256)
      problems.push(
        `stale data/terrain/source/trails.json ${t.id} polyline (sha256 ${actual.slice(0, 10)} != polylineSha256 ${t.polylineSha256.slice(0, 10)})`
      );
  }
  return { trails: file.trails, problems };
}

/** One trail -> its profile entry, or throws when a station leaves the DEM. */
function profileOf(trail, source, metres) {
  const { extent, width: W, height: H } = source;
  const height = ([e, n]) => {
    if (e < extent.west || e > extent.east || n < extent.south || n > extent.north)
      throw new Error(`${trail.id}: station ${e}, ${n} lies outside the DEM extent`);
    return sampleAtLv95(metres, W, H, extent, { e, n });
  };
  const L = polylineLength(trail.polyline);
  const stations = resampleByArcLength(trail.polyline, STATIONS);
  const dist = stations.map((_, i) => (L * i) / (STATIONS - 1));
  const points = normaliseProfile(dist, stations.map(height));
  const first = trail.polyline[0];
  const last = trail.polyline[trail.polyline.length - 1];
  return {
    id: trail.id,
    name: trail.name,
    number: trail.number,
    sacGrade: trail.sacGrade,
    start: { name: trail.start.name, heightM: Math.round(height(first)) },
    end: { name: trail.end.name, heightM: Math.round(height(last)) },
    lengthM: Math.round(L),
    points,
  };
}

/** The generated module text (one `{ x, y }` point per line). */
function moduleText(profiles) {
  const body = JSON.stringify(profiles, null, 2).replace(
    /\{\n\s+"x": (-?[\d.]+),\n\s+"y": (-?[\d.]+)\n\s+\}/g,
    '{ "x": $1, "y": $2 }'
  );
  return (
    '// AUTO-GENERATED by scripts/terrain/build-trails.mjs from data/terrain/source/trails.json. Do not edit.\n' +
    '// DEM elevation profiles of the box and coin-flip trails (D-05, D-07). Import only from\n' +
    '// Server Components: no client module may import this file.\n' +
    `export const trailProfiles = ${body} as const;\n` +
    '\n' +
    "export type TrailId = (typeof trailProfiles)[number]['id'];\n"
  );
}

async function write() {
  const dem = await loadDem();
  if (dem.error) throw new Error(dem.error);
  const { trails, problems } = loadTrails();
  if (problems.length > 0) throw new Error(problems.join('; '));
  const profiles = trails.map((t) => profileOf(t, dem.source, dem.metres));
  const text = moduleText(profiles);
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, text, 'utf8');
  for (const p of profiles)
    console.log(
      `${NAME}: ${p.id} ${p.lengthM} m, ${p.start.name} ${p.start.heightM} m -> ${p.end.name} ${p.end.heightM} m`
    );
  console.log(`${NAME}: wrote ${OUT_REL} (${Buffer.byteLength(text)} bytes)`);
  console.log(`${NAME}: OK`);
}

async function check() {
  const lines = [];
  const dem = await loadDem();
  if (dem.error) lines.push(`${NAME}: ${dem.error}`);
  const { trails, problems } = loadTrails();
  for (const p of problems) lines.push(`${NAME}: ${p}`);
  if (!dem.error) {
    let text = null;
    try {
      text = moduleText(trails.map((t) => profileOf(t, dem.source, dem.metres)));
    } catch (e) {
      lines.push(`${NAME}: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (text !== null) {
      if (!fs.existsSync(OUT_PATH)) lines.push(`${NAME}: missing ${OUT_REL}`);
      else if (fs.readFileSync(OUT_PATH, 'utf8') !== text)
        lines.push(`${NAME}: stale ${OUT_REL} (bytes differ from a fresh build)`);
    }
  }
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
