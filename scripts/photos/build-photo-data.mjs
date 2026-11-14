#!/usr/bin/env node

/**
 * Photo data stage 2 (D-10, DATA-02, DATA-03, DATA-04, DATA-06, D-17, DATA-10):
 * committed sidecar + corrections + photo map + regions + plates -> data/generated/photos.ts
 *
 * Inputs (all committed, so CI can rebuild the output without the originals):
 *   data/photos/exif-sidecar.json   stage 1 EXIF facts, GPS already at 4 decimals
 *   data/photos/corrections.json    Tim's reasoned overrides (D-01, D-02, D-03)
 *   data/photos/photo-map.json      one record per photo: file, region, country
 *                                   (15 D-01, D-02); a bijection with the sidecar
 *   data/regions/regions.json       the region registry: each region's plate (15 D-03)
 *   data/terrain/plates.json        the plate registry: each plate's source directory
 *   <plate.source>/                 source.json + the native 10 m grey16 PNG of the
 *                                   photo's own plate, whose sha256 is verified
 *                                   against source.json (one load per plate, 15 D-04)
 *
 * Per sidecar entry:
 *   region,    the photo-map record's, copied verbatim (15 D-02, D-05): the country
 *   country    is never defaulted from the region or derived from coordinates.
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
 *   uv         round4 of lv95ToUv in the extent of the photo's region's plate
 *              (DATA-01, DATA-06, 15 D-04). A position whose raw uv is outside
 *              [0, 1] fails the build before a (clamped) DEM height is sampled
 *              (08-REVIEW WR-01).
 *   exif       null for a film scan, else the six sidecar exposure fields.
 *   tags       year and meteorological season from the capture (D-08).
 * Every entry is parsed with PhotoFacts. The altimeter rail start is not emitted
 * here: it is computed over the Home list in lib/ascent/waypoints.ts (15 D-08).
 *
 * Output: two header comment lines and `export const photos = <JSON, 2 spaces> as const;`,
 * LF endings, trailing newline.
 *
 * Modes:
 *   (default)  write data/generated/photos.ts.
 *   --check    rebuild the text in memory and compare bytes with the committed
 *              file; `photos:build: OK` or `photos:build: stale` (exit 1).
 *   --root <dir>  read the inputs and the output under <dir> instead of the
 *              repository root (default unchanged). The guard selftest runs
 *              `--check --root <temp copy>` for the G5 cases (VERIFY-06).
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
import { Corrections, ExifSidecar, PhotoFacts, PhotoMap } from '../../data/schemas/photo.ts';
import { Regions } from '../../data/schemas/region.ts';
import { Plates, TerrainSource } from '../../data/schemas/terrain.ts';
import { lv95ToUv, round4, wgs84ToLv95 } from '../../lib/geo.ts';
import { sampleAtLv95 } from '../../lib/terrain/dem-sample.ts';
import { seasonOf, yearTag } from '../../lib/photo-format.ts';

const NAME = 'photos:build';

/**
 * `--check` and `--root <dir>`. The root defaults to the repository above this
 * script; the guard selftest points it at a temp copy of the inputs (VERIFY-06).
 * Parsed before any ROOT-derived path, so every read and write follows --root.
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
const SIDECAR_REL = 'data/photos/exif-sidecar.json';
const CORRECTIONS_REL = 'data/photos/corrections.json';
const PHOTO_MAP_REL = 'data/photos/photo-map.json';
const REGIONS_REL = 'data/regions/regions.json';
const PLATES_REL = 'data/terrain/plates.json';
const OUT_REL = 'data/generated/photos.ts';
const OUT_PATH = path.join(ROOT, OUT_REL);
const TIME_ZONE = 'Europe/Zurich';
const MAX_GPS_DRIFT_S = 60;

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

/**
 * A plate's <source>/source.json + PNG -> { extent, width, height, metres },
 * sha256 verified (T-08-24). `sourceRel` is the plate's `source` from plates.json.
 */
async function loadDem(sourceRel) {
  const source = TerrainSource.parse(readJson(`${sourceRel}/source.json`));
  const png = fs.readFileSync(path.join(ROOT, sourceRel, source.file));
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
 * instant formats back to the same wall time. A repeated (fall-back) wall time
 * has two candidates; the GPS UTC time, when present, keeps the one within
 * MAX_GPS_DRIFT_S of it (08 IN-03). A skipped (spring-forward) wall time, or a
 * repeated one with no GPS time, fails.
 */
function zurichOffset(id, local, gpsUtc) {
  let candidates = [
    { offset: '+01:00', s: 3600 },
    { offset: '+02:00', s: 7200 },
  ].filter((c) => wallTime(naiveMs(local) - c.s * 1000) === local);
  if (candidates.length === 2 && gpsUtc) {
    const deltaS = (naiveMs(local) - Date.parse(gpsUtc)) / 1000;
    candidates = candidates.filter((c) => Math.abs(deltaS - c.s) < MAX_GPS_DRIFT_S);
  }
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
  const { offset, s } = zurichOffset(entry.id, local, entry.gps?.utc);
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

/**
 * The photo map as a bijection with the sidecar (15 D-01), every record's region in
 * the registry and every region's plate in the plate registry. Returns each
 * photo's record and the plate entry it is sampled on, keyed by photo id.
 */
function resolveMembership(sidecar, photoMap, regions, plates) {
  const records = photoMap.photos;
  const sidecarIds = new Set(sidecar.photos.map((p) => p.id));
  for (const entry of sidecar.photos) {
    if (!Object.hasOwn(records, entry.id)) {
      throw new Error(`add a record for ${entry.file} (${entry.id}) to ${PHOTO_MAP_REL}`);
    }
  }
  for (const id of Object.keys(records)) {
    if (!sidecarIds.has(id)) {
      throw new Error(
        `${PHOTO_MAP_REL} has ${id}, but the sidecar has no entry; run photos:exif or remove the record`
      );
    }
  }
  for (const entry of sidecar.photos) {
    const file = records[entry.id].file;
    if (file !== entry.file) {
      throw new Error(
        `${entry.id}: ${PHOTO_MAP_REL} names file '${file}', but ${SIDECAR_REL} names '${entry.file}'`
      );
    }
  }
  const regionById = new Map(regions.regions.map((r) => [r.id, r]));
  const plateById = new Map(plates.plates.map((p) => [p.id, p]));
  for (const region of regions.regions) {
    if (!plateById.has(region.plate)) {
      throw new Error(`region ${region.id}: plate ${region.plate} is not in ${PLATES_REL}`);
    }
  }
  const membership = new Map();
  for (const entry of sidecar.photos) {
    const record = records[entry.id];
    const region = regionById.get(record.region);
    if (!region) {
      throw new Error(`${entry.id}: region ${record.region} is not in ${REGIONS_REL}`);
    }
    membership.set(entry.id, { record, plate: plateById.get(region.plate) });
  }
  return membership;
}

/**
 * Sidecar + corrections + photo map + regions + plates (and each plate's DEM) ->
 * { photos, text }. Throws on any violation.
 */
async function build() {
  const sidecar = ExifSidecar.parse(readJson(SIDECAR_REL));
  const corrections = Corrections.parse(readJson(CORRECTIONS_REL));
  const photoMap = PhotoMap.parse(readJson(PHOTO_MAP_REL));
  const regions = Regions.parse(readJson(REGIONS_REL));
  const plates = Plates.parse(readJson(PLATES_REL));
  const ids = new Set(sidecar.photos.map((p) => p.id));
  for (const id of Object.keys(corrections.photos)) {
    if (!ids.has(id)) throw new Error(`${CORRECTIONS_REL}: ${id} is not in ${SIDECAR_REL}`);
  }
  const membership = resolveMembership(sidecar, photoMap, regions, plates);
  // One DEM load per plate (15 D-04): each photo is sampled on its own region's plate.
  const dems = new Map();
  for (const { plate } of membership.values()) {
    if (!dems.has(plate.id)) dems.set(plate.id, await loadDem(plate.source));
  }

  const photos = sidecar.photos.map((entry) => {
    const fix = corrections.photos[entry.id];
    const { record, plate } = membership.get(entry.id);
    const dem = dems.get(plate.id);
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
          `${entry.id}: position lies outside the DEM extent (uv ${raw.u.toFixed(3)}, ${raw.v.toFixed(3)}); plate ${plate.id}`
        );
      }
      uv = { u: round4(raw.u), v: round4(raw.v) };
      const m = sampleAtLv95(dem.metres, dem.width, dem.height, dem.extent, lv95);
      elevation = { source: 'dem', m: Math.round(m) };
    }
    return PhotoFacts.parse({
      id: entry.id,
      region: record.region,
      country: record.country,
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

  const text =
    `// AUTO-GENERATED by scripts/photos/build-photo-data.mjs from ${SIDECAR_REL}, ${CORRECTIONS_REL}, ${PHOTO_MAP_REL}, ${REGIONS_REL}, ${PLATES_REL} and each plate's source/. Do not edit.\n` +
    `// Typed photo facts (DATA-02..04, DATA-06).\n` +
    `export const photos = ${JSON.stringify(photos, null, 2)} as const;\n`;
  return { photos, text };
}

function formatIssues(error) {
  return error.issues.map(
    (i) => `${NAME}: schema ${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`
  );
}

async function write() {
  const { photos, text } = await build();
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, text, 'utf8');
  for (const p of photos) {
    console.log(
      `${NAME}: ${p.id} ${p.elevation ? `${p.elevation.m} m` : 'no position'} ${p.tags.year} ${p.tags.season ?? '-'}`
    );
  }
  console.log(`${NAME}: wrote ${OUT_REL} (${photos.length} photos)`);
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

(ARGS.check ? check() : write()).catch((e) => {
  if (e && Array.isArray(e.issues)) {
    for (const l of formatIssues(e)) console.log(l);
    console.log(`${NAME}: ${e.issues.length} schema violations`);
  } else {
    console.log(`${NAME}: ${e && e.message ? e.message : String(e)}`);
  }
  console.log(ARGS.check ? `${NAME}: stale` : `${NAME}: nothing written`);
  process.exit(1);
});
