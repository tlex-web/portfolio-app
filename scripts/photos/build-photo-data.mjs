#!/usr/bin/env node

/**
 * Photo data stage 2 (D-10, DATA-02, DATA-03, DATA-04, DATA-06, D-17):
 * committed sidecar + corrections + DEM source -> data/generated/photos.ts
 *
 * Inputs (all committed, so CI can rebuild the output without the originals):
 *   data/photos/exif-sidecar.json   stage 1 EXIF facts, GPS already at 4 decimals
 *   data/photos/corrections.json    Tim's reasoned overrides (D-01, D-02, D-03)
 *   data/terrain/source/            source.json + the native 10 m grey16 PNG,
 *                                   whose sha256 is verified against source.json
 *
 * Per sidecar entry:
 *   medium     corrections, else 'digital'. A film scan must carry a year
 *              captureOverride, because its EXIF date is the scan date (D-03).
 *   capture    the year override, else the EXIF naive local time with timeZone
 *              Europe/Zurich and the offset Node's ICU gives for that wall time
 *              (build-time Intl only; shipped code never uses it). When the
 *              sidecar has a GPS UTC time, |(local - utc) - offset| must be under
 *              60 s, or the build fails (D-04, RESEARCH Pitfall 4). When the
 *              camera recorded an OffsetTimeOriginal, it must equal that offset,
 *              or the build fails (08-REVIEW WR-03).
 *   position   corrections (hand-placed only, WR-08), else the sidecar GPS as
 *              exif / not approximate, else null (DATA-04).
 *   elevation  bilinear at pixel centres of the native source raster at the
 *              4-decimal coordinates, rounded to whole metres (D-17, Pitfall 2).
 *   uv         round4 of lv95ToUv in the source extent (DATA-01, DATA-06). A
 *              position whose raw uv is outside [0, 1] fails the build before a
 *              (clamped) DEM height is sampled (08-REVIEW WR-01).
 *   exif       null for a film scan, else the six sidecar exposure fields.
 *   tags       year and meteorological season from the capture (D-08).
 * Every entry is parsed with PhotoFacts; `lowestDemM` is the minimum elevation,
 * the altimeter rail's start (D-17).
 *
 * Output: two header comment lines, `export const photos = <JSON, 2 spaces> as const;`
 * and `export const lowestDemM = N;`, LF endings, trailing newline.
 *
 * Modes:
 *   (default)  write data/generated/photos.ts.
 *   --check    rebuild the text in memory and compare bytes with the committed
 *              file; `photos:build: OK` or `photos:build: stale` (exit 1).
 *
 * Usage:
 *   npm run photos:build
 *   npm run photos:build -- --check   (also `npm run data:check`, part of `npm run lint`)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { Corrections, ExifSidecar, PhotoFacts } from '../../data/schemas/photo.ts';
import { TerrainSource } from '../../data/schemas/terrain.ts';
import { lv95ToUv, round4, wgs84ToLv95 } from '../../lib/geo.ts';
import { sampleAtLv95 } from '../../lib/terrain/dem-sample.ts';
import { seasonOf, yearTag } from '../../lib/photo-format.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SIDECAR_REL = 'data/photos/exif-sidecar.json';
const CORRECTIONS_REL = 'data/photos/corrections.json';
const SOURCE_REL = 'data/terrain/source';
const OUT_REL = 'data/generated/photos.ts';
const OUT_PATH = path.join(ROOT, OUT_REL);
const NAME = 'photos:build';
const TIME_ZONE = 'Europe/Zurich';
const MAX_GPS_DRIFT_S = 60;

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

/** source.json + PNG -> { extent, width, height, metres }, sha256 verified (T-08-24). */
async function loadDem() {
  const source = TerrainSource.parse(readJson(`${SOURCE_REL}/source.json`));
  const png = fs.readFileSync(path.join(ROOT, SOURCE_REL, source.file));
  const actual = sha256(png);
  if (actual !== source.sha256) {
    throw new Error(
      `${SOURCE_REL}/${source.file} sha256 ${actual.slice(0, 10)} != source.json ${source.sha256.slice(0, 10)}`
    );
  }
  const { data, info } = await sharp(png)
    .toColourspace('grey16')
    .raw({ depth: 'ushort' })
    .toBuffer({ resolveWithObject: true });
  if (info.width !== source.width || info.height !== source.height || info.channels !== 1) {
    throw new Error(`source PNG is not ${source.width} x ${source.height} grey16`);
  }
  const u16 = new Uint16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
  const metres = Float64Array.from(u16, (v) => v * source.heightScale);
  return { extent: source.extent, width: source.width, height: source.height, metres };
}

/** Wall time of instant `ms` in TIME_ZONE as 'YYYY-MM-DDTHH:MM:SS' (Node ICU, build time only). */
const wallFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
function wallTime(ms) {
  const p = Object.fromEntries(
    wallFormat.formatToParts(new Date(ms)).map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

/** Naive local time read as if it were UTC, in ms. */
const naiveMs = (local) => Date.parse(`${local}Z`);

/**
 * The Europe/Zurich offset of a naive local wall time: the one candidate whose
 * instant formats back to the same wall time. A skipped (spring-forward) or
 * repeated (fall-back) wall time has zero or two candidates and fails.
 */
function zurichOffset(id, local) {
  const candidates = [
    { offset: '+01:00', s: 3600 },
    { offset: '+02:00', s: 7200 },
  ].filter((c) => wallTime(naiveMs(local) - c.s * 1000) === local);
  if (candidates.length !== 1) {
    throw new Error(
      `${id}: ${local} is not a unique ${TIME_ZONE} wall time (${candidates.length} offsets)`
    );
  }
  return candidates[0];
}

function buildCapture(entry, fix) {
  if (fix?.captureOverride) {
    const { precision, year, source } = fix.captureOverride;
    return { precision, year, source };
  }
  if (!entry.dateTimeOriginal)
    throw new Error(`${entry.id}: no DateTimeOriginal and no captureOverride`);
  const local = entry.dateTimeOriginal;
  const { offset, s } = zurichOffset(entry.id, local);
  // WR-03: a camera-recorded offset must agree with the derived Zurich one.
  if (entry.offsetTimeOriginal != null && entry.offsetTimeOriginal !== offset) {
    throw new Error(
      `${entry.id}: EXIF OffsetTimeOriginal ${entry.offsetTimeOriginal} is not the Europe/Zurich offset ${offset}`
    );
  }
  if (entry.gps?.utc) {
    const deltaS = (naiveMs(local) - Date.parse(entry.gps.utc)) / 1000;
    if (!(Math.abs(deltaS - s) < MAX_GPS_DRIFT_S)) {
      throw new Error(
        `${entry.id}: local ${local} minus GPS UTC ${entry.gps.utc} is ${deltaS} s, not ${offset} within ${MAX_GPS_DRIFT_S} s (D-04)`
      );
    }
  }
  return { precision: 'second', local, timeZone: TIME_ZONE, offset, source: 'exif' };
}

/** Canonical key order, so the output never depends on the order in corrections.json. */
function buildPosition(entry, fix) {
  const p = fix?.position;
  if (p) {
    // WR-08: a typed-in position is never an exact EXIF fix (the schema rejects it too).
    if (p.source !== 'hand-placed') {
      throw new Error(
        `${entry.id}: ${CORRECTIONS_REL} position has source '${p.source}'; a correction is 'hand-placed' (DATA-04)`
      );
    }
    return {
      lat: p.lat,
      lon: p.lon,
      source: p.source,
      approximate: p.approximate,
      ...(p.reason !== undefined ? { reason: p.reason } : {}),
      ...(p.radiusM !== undefined ? { radiusM: p.radiusM } : {}),
    };
  }
  if (entry.gps)
    return { lat: entry.gps.lat, lon: entry.gps.lon, source: 'exif', approximate: false };
  return null;
}

function buildExposure(entry) {
  return {
    camera: entry.model,
    lens: entry.lens,
    focalLengthMm: entry.focalLengthMm,
    fNumber: entry.fNumber,
    exposureTimeS: entry.exposureTimeS,
    iso: entry.iso,
  };
}

/** Sidecar + corrections + DEM -> { photos, lowestDemM, text }. Throws on any violation. */
async function build() {
  const sidecar = ExifSidecar.parse(readJson(SIDECAR_REL));
  const corrections = Corrections.parse(readJson(CORRECTIONS_REL));
  const ids = new Set(sidecar.photos.map((p) => p.id));
  for (const id of Object.keys(corrections.photos)) {
    if (!ids.has(id)) throw new Error(`${CORRECTIONS_REL}: ${id} is not in ${SIDECAR_REL}`);
  }
  const dem = await loadDem();

  const photos = sidecar.photos.map((entry) => {
    const fix = corrections.photos[entry.id];
    const medium = fix?.medium ?? 'digital';
    if (medium === 'film-scan' && !fix?.captureOverride) {
      throw new Error(
        `${entry.id}: a film scan needs a year captureOverride (its EXIF date is the scan date, D-03)`
      );
    }
    const capture = buildCapture(entry, fix);
    const position = buildPosition(entry, fix);
    let uv = null;
    let elevation = null;
    if (position) {
      const lv95 = wgs84ToLv95(position);
      const raw = lv95ToUv(lv95, dem.extent);
      // WR-01: off the sheet there is no pin to place and only a clamped edge height to sample.
      if (raw.u < 0 || raw.u > 1 || raw.v < 0 || raw.v > 1) {
        throw new Error(
          `${entry.id}: position lies outside the DEM extent (uv ${raw.u.toFixed(3)}, ${raw.v.toFixed(3)})`
        );
      }
      uv = { u: round4(raw.u), v: round4(raw.v) };
      const m = sampleAtLv95(dem.metres, dem.width, dem.height, dem.extent, lv95);
      elevation = { source: 'dem', m: Math.round(m) };
    }
    return PhotoFacts.parse({
      id: entry.id,
      medium,
      capture,
      position,
      uv,
      elevation,
      exif: medium === 'film-scan' ? null : buildExposure(entry),
      tags: {
        year: yearTag(capture),
        season: capture.precision === 'second' ? seasonOf(Number(capture.local.slice(5, 7))) : null,
      },
      locationOverride: fix?.locationOverride ?? null,
    });
  });
  photos.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const heights = photos.filter((p) => p.elevation).map((p) => p.elevation.m);
  if (heights.length === 0)
    throw new Error('no photo has a DEM elevation; lowestDemM is undefined');
  const lowestDemM = Math.min(...heights);

  const text =
    `// AUTO-GENERATED by scripts/photos/build-photo-data.mjs from ${SIDECAR_REL}, ${CORRECTIONS_REL} and ${SOURCE_REL}/. Do not edit.\n` +
    `// Typed photo facts (DATA-02..04, DATA-06); lowestDemM is the altimeter rail start (D-17).\n` +
    `export const photos = ${JSON.stringify(photos, null, 2)} as const;\n` +
    `\n` +
    `/** The lowest photo DEM height in whole metres: the altimeter rail start (D-17). */\n` +
    `export const lowestDemM = ${lowestDemM};\n`;
  return { photos, lowestDemM, text };
}

function formatIssues(error) {
  return error.issues.map(
    (i) => `${NAME}: schema ${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`
  );
}

async function write() {
  const { photos, lowestDemM, text } = await build();
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, text, 'utf8');
  for (const p of photos) {
    console.log(
      `${NAME}: ${p.id} ${p.elevation ? `${p.elevation.m} m` : 'no position'} ${p.tags.year} ${p.tags.season ?? '-'}`
    );
  }
  console.log(`${NAME}: wrote ${OUT_REL} (${photos.length} photos, lowestDemM ${lowestDemM})`);
  console.log(`${NAME}: OK`);
}

async function check() {
  const { text } = await build();
  if (!fs.existsSync(OUT_PATH)) {
    console.log(`${NAME}: ${OUT_REL} is missing; run npm run photos:build`);
    console.log(`${NAME}: stale`);
    process.exit(1);
  }
  if (fs.readFileSync(OUT_PATH, 'utf8') !== text) {
    console.log(`${NAME}: ${OUT_REL} differs from a fresh build; run npm run photos:build`);
    console.log(`${NAME}: stale`);
    process.exit(1);
  }
  console.log(`${NAME}: OK`);
}

const args = process.argv.slice(2);
const unknown = args.filter((a) => a !== '--check');
if (unknown.length > 0) {
  console.log(`${NAME}: unknown argument(s) ${unknown.join(' ')}; the only flag is --check`);
  process.exit(1);
}

(args.includes('--check') ? check() : write()).catch((e) => {
  if (e && Array.isArray(e.issues)) {
    for (const l of formatIssues(e)) console.log(l);
    console.log(`${NAME}: ${e.issues.length} schema violations`);
  } else {
    console.log(`${NAME}: ${e && e.message ? e.message : String(e)}`);
  }
  console.log(args.includes('--check') ? `${NAME}: stale` : `${NAME}: nothing written`);
  process.exit(1);
});
