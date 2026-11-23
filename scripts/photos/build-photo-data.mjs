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
 *   data/home-waypoints.ts          homeWaypointIds, the Home list (DATA-09), loaded
 *                                   with a dynamic import under the root (16-05)
 *
 * Per sidecar entry:
 *   region,    the photo-map record's, copied verbatim (15 D-02, D-05): the country
 *   country    is never defaulted from the region or derived from coordinates.
 *   medium     corrections, else 'digital'. A film scan must carry a year
 *              captureOverride, because its EXIF date is the scan date (D-03).
 *   capture    the year override, else the EXIF naive local time with timeZone
 *              ZONE_BY_COUNTRY[country], the photo's country zone (17 D-26:
 *              Europe/Zurich for CH), and the offset Node's ICU gives for that
 *              wall time in that zone
 *              (build-time Intl only; shipped code never uses it). When the
 *              sidecar has a GPS UTC time, |(local - utc) - offset| must be under
 *              60 s, or the build fails (D-04, RESEARCH Pitfall 4). When the
 *              camera recorded an OffsetTimeOriginal, it must equal that offset,
 *              or the build fails (08-REVIEW WR-03).
 *   kind       the photo-map record's ('ground' or 'aerial', 16 D-04), verbatim.
 *              A coarse or aerial record whose sidecar entry keeps a GPS altitude
 *              fails, and so does a DJI still on a record that is not 'aerial'
 *              (16 D-03, D-04): the stage 1 rules, re-checked where CI runs.
 *   position   corrections (hand-placed only, WR-08), else the sidecar GPS as
 *              exif, else null (DATA-04). Every position carries its record's
 *              precision (16 D-01): a '4dp' EXIF position is not approximate; a
 *              '3dp' or '2dp' one is approximate with a reason naming the
 *              rounding and radiusM 100 or 1000 (DATA-14). A sidecar or
 *              corrections position with more decimals than that fails.
 *   elevation  '4dp' (and hand-placed): bilinear at pixel centres of the native
 *              source raster at the position, rounded to whole metres (D-17,
 *              Pitfall 2). A coarse EXIF photo: the sidecar's gps.groundM,
 *              sampled at the true spot in stage 1 (16 D-03); missing fails, and
 *              so does a groundM on a '4dp' photo, or one whose
 *              gps.groundSourceSha256 is not the sha256 of the plate source
 *              loaded now (a refetched or moved plate, or a changed region;
 *              16-REVIEW WR-02).
 *   uv         round4 of gridToUv(toGrid(source.crs, position)) in the extent of
 *              the photo's region's plate (DATA-01, DATA-06, 15 D-04), through
 *              scripts/photos/plate-dem.mjs. A position whose raw uv is outside
 *              [0, 1] fails the build before a (clamped) DEM height is sampled
 *              (08-REVIEW WR-01); the message names no position and no uv.
 *   exif       null for a film scan, else the six sidecar exposure fields.
 *   tags       year and meteorological season from the capture (D-08).
 * Every entry is parsed with PhotoFacts. The altimeter rail start is not emitted
 * here: it is computed over the Home list in lib/ascent/waypoints.ts (15 D-08).
 *
 * Outputs (each two header comment lines, then the export; LF endings, trailing newline):
 *   data/generated/photos.ts       `export const photos = <JSON, 2 spaces> as const;`
 *   data/generated/home-photos.ts  `export const homePhotoFacts = <JSON, 2 spaces> as const;`:
 *                                  only the Home waypoints' facts, in generated order
 *                                  (16-05). The footer renders in the client-rendered
 *                                  app/global-error.tsx, so this is all of the photo
 *                                  data that reaches its chunk. Built after every
 *                                  photo's facts are validated, so an earlier failure
 *                                  is still the one reported; a Home id with no fact
 *                                  fails the build.
 *
 * Modes:
 *   (default)  write both outputs.
 *   --check    rebuild both texts in memory and compare bytes with the committed
 *              files, naming a stale one; `photos:build: OK` or `photos:build: stale` (exit 1).
 *   --root <dir>  read the inputs (the Home list included) and the outputs under
 *              <dir> instead of the repository root (default unchanged). A root
 *              without data/home-waypoints.ts fails; no root skips the Home output.
 *              The guard selftest runs `--check --root <temp copy>` for the G5 cases
 *              (VERIFY-06), and its privacy roots carry an empty Home list.
 *
 * Usage:
 *   npm run photos:build
 *   npm run photos:build -- --check   (also `npm run data:check`, part of `npm run lint`)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  Corrections,
  ExifSidecar,
  PhotoFacts,
  PhotoMap,
  ZONE_BY_COUNTRY,
} from '../../data/schemas/photo.ts';
import { Regions } from '../../data/schemas/region.ts';
import { Plates } from '../../data/schemas/terrain.ts';
import { round4 } from '../../lib/geo.ts';
import { seasonOf, yearTag } from '../../lib/photo-format.ts';
import { gridToUv, loadPlateDem, plateFor, sampleAtGrid, toGrid } from './plate-dem.mjs';

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
const HOME_WAYPOINTS_REL = 'data/home-waypoints.ts';
const OUT_REL = 'data/generated/photos.ts';
const OUT_PATH = path.join(ROOT, OUT_REL);
const HOME_OUT_REL = 'data/generated/home-photos.ts';
const HOME_OUT_PATH = path.join(ROOT, HOME_OUT_REL);
const MAX_GPS_DRIFT_S = 60;

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

/** Decimals per precision level (16 D-01). */
const DECIMALS = { '4dp': 4, '3dp': 3, '2dp': 2 };
/**
 * A coarse EXIF position is approximate (DATA-14): the radius bounds the
 * rounding cell (a 3dp cell at 46 N is 111 x 77 m, a 2dp cell 1.1 x 0.77 km).
 */
const COARSE = {
  '3dp': { reason: 'Position rounded to about 100 m (3 decimals) for privacy', radiusM: 100 },
  '2dp': { reason: 'Position rounded to about 1 km (2 decimals) for privacy', radiusM: 1000 },
};
/** True when `v` has more decimals than `d` (the Coord4 tolerance, at d decimals). */
const finerThan = (v, d) => Math.abs(v * 10 ** d - Math.round(v * 10 ** d)) >= 1e-6;

/** One wall-time formatter per zone, built on first use (Node ICU, build time only). */
const wallFormats = new Map();
function wallFormat(zone) {
  let f = wallFormats.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    wallFormats.set(zone, f);
  }
  return f;
}
/** Wall time of instant `ms` in `zone` as 'YYYY-MM-DDTHH:MM:SS'. */
function wallTime(ms, zone) {
  const p = Object.fromEntries(
    wallFormat(zone).formatToParts(new Date(ms)).map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

/** Naive local time read as if it were UTC, in ms. */
const naiveMs = (local) => Date.parse(`${local}Z`);

/**
 * The offset in `zone` (the photo's country zone, 17 D-26) of a naive local wall
 * time: the one candidate whose instant formats back to the same wall time. Every
 * zone in ZONE_BY_COUNTRY is CET/CEST, so +01:00 and +02:00 are the candidates.
 * A repeated (fall-back) wall time has two candidates; the GPS UTC time, when
 * present, keeps the one within MAX_GPS_DRIFT_S of it (08 IN-03). A skipped
 * (spring-forward) wall time, or a repeated one with no GPS time, fails.
 */
function zoneOffset(id, local, gpsUtc, zone) {
  let candidates = [
    { offset: '+01:00', s: 3600 },
    { offset: '+02:00', s: 7200 },
  ].filter((c) => wallTime(naiveMs(local) - c.s * 1000, zone) === local);
  if (candidates.length === 2 && gpsUtc) {
    const deltaS = (naiveMs(local) - Date.parse(gpsUtc)) / 1000;
    candidates = candidates.filter((c) => Math.abs(deltaS - c.s) < MAX_GPS_DRIFT_S);
  }
  if (candidates.length !== 1) {
    throw new Error(
      `${id}: ${local} is not a unique ${zone} wall time (${candidates.length} offsets)`
    );
  }
  return candidates[0];
}

function buildCapture(entry, fix, zone) {
  if (fix?.captureOverride) {
    const { precision, year, source } = fix.captureOverride;
    return { precision, year, source };
  }
  if (!entry.dateTimeOriginal)
    throw new Error(`${entry.id}: no DateTimeOriginal and no captureOverride`);
  const local = entry.dateTimeOriginal;
  const { offset, s } = zoneOffset(entry.id, local, entry.gps?.utc, zone);
  // WR-03: a camera-recorded offset must agree with the one derived in the photo's zone.
  if (entry.offsetTimeOriginal != null && entry.offsetTimeOriginal !== offset) {
    throw new Error(
      `${entry.id}: EXIF OffsetTimeOriginal ${entry.offsetTimeOriginal} is not the ${zone} offset ${offset}`
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
  return { precision: 'second', local, timeZone: zone, offset, source: 'exif' };
}

/**
 * The photo's position, tagged with its record's precision (16 D-01, D-02), in
 * canonical key order, so the output never depends on the order in
 * corrections.json. A position with more decimals than its precision fails
 * (a correction can never undo a coarse choice); the message names the photo,
 * never the coordinates (D-12).
 */
function buildPosition(entry, fix, record) {
  const precision = record.precision;
  const d = DECIMALS[precision];
  const checked = (lat, lon) => {
    if (finerThan(lat, d) || finerThan(lon, d)) {
      throw new Error(
        `${entry.id}: position has more decimals than its precision ${precision}; round it or change the precision in ${PHOTO_MAP_REL}`
      );
    }
  };
  const p = fix?.position;
  if (p) {
    // WR-08: a typed-in position is never an exact EXIF fix (the schema rejects it too).
    if (p.source !== 'hand-placed') {
      throw new Error(
        `${entry.id}: ${CORRECTIONS_REL} position has source '${p.source}'; a correction is 'hand-placed' (DATA-04)`
      );
    }
    checked(p.lat, p.lon);
    return {
      lat: p.lat,
      lon: p.lon,
      precision,
      source: p.source,
      approximate: p.approximate,
      ...(p.reason !== undefined ? { reason: p.reason } : {}),
      ...(p.radiusM !== undefined ? { radiusM: p.radiusM } : {}),
    };
  }
  if (entry.gps) {
    checked(entry.gps.lat, entry.gps.lon);
    const base = { lat: entry.gps.lat, lon: entry.gps.lon, precision, source: 'exif' };
    if (precision === '4dp') return { ...base, approximate: false };
    return { ...base, approximate: true, ...COARSE[precision] };
  }
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
  const plateIds = new Set(plates.plates.map((p) => p.id));
  for (const region of regions.regions) {
    if (!plateIds.has(region.plate)) {
      throw new Error(`region ${region.id}: plate ${region.plate} is not in ${PLATES_REL}`);
    }
  }
  const membership = new Map();
  for (const entry of sidecar.photos) {
    const record = records[entry.id];
    let plate;
    try {
      plate = plateFor(record, regions, plates);
    } catch (e) {
      throw new Error(`${entry.id}: ${e.message}`);
    }
    membership.set(entry.id, { record, plate });
  }
  return membership;
}

/**
 * homeWaypointIds from <root>/data/home-waypoints.ts (DATA-09). A dynamic import
 * through a file URL, not a static import beside the script, so the Home list
 * follows --root like every other input and a Windows path loads.
 */
async function loadHomeWaypointIds() {
  const file = path.join(ROOT, HOME_WAYPOINTS_REL);
  let ids;
  try {
    ({ homeWaypointIds: ids } = await import(pathToFileURL(file).href));
  } catch {
    throw new Error(`cannot read ${HOME_WAYPOINTS_REL}; every photos:build root needs a Home list`);
  }
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
    throw new Error(`${HOME_WAYPOINTS_REL} must export homeWaypointIds, an array of photo ids`);
  }
  return ids;
}

/**
 * The Home waypoints' facts, in generated order (16-05). Runs after every photo
 * is built and validated; a listed id with no fact fails.
 */
function homeFacts(photos, homeIds) {
  for (const id of homeIds) {
    if (!photos.some((p) => p.id === id)) {
      throw new Error(`home waypoint ${id} has no photo; fix homeWaypointIds in ${HOME_WAYPOINTS_REL}`);
    }
  }
  return photos.filter((p) => homeIds.includes(p.id));
}

/**
 * Sidecar + corrections + photo map + regions + plates (and each plate's DEM) ->
 * { photos, text }, then the Home list -> { home, homeText }. Throws on any violation.
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
    if (!dems.has(plate.id)) dems.set(plate.id, await loadPlateDem(ROOT, plate.source));
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
    const capture = buildCapture(entry, fix, ZONE_BY_COUNTRY[record.country]);
    const coarse = record.precision !== '4dp';
    // 16 D-03, D-04 (16-REVIEW WR-01): stage 1 enforces these with the originals
    // present; stage 2 holds the sidecar entry and the record together, so CI
    // catches a hand-merged sidecar or a record changed after extraction. The
    // messages name the photo and the rule, never the value.
    if ((coarse || record.kind === 'aerial') && entry.gps && entry.gps.altM !== null) {
      throw new Error(
        `${entry.id}: a ${record.precision} ${record.kind} photo carries gps.altM; run npm run photos:exif with its original (16 D-03, D-04)`
      );
    }
    if (
      entry.make !== null &&
      entry.make.trim().toLowerCase() === 'dji' &&
      record.kind !== 'aerial'
    ) {
      throw new Error(
        `${entry.id}: a DJI still must be kind 'aerial' in ${PHOTO_MAP_REL} (16 D-04)`
      );
    }
    const position = buildPosition(entry, fix, record);
    const groundM = entry.gps?.groundM;
    // 16 D-03: a coarse photo's height was sampled at its true spot in stage 1; a
    // 4dp photo is sampled here, so it must not carry one.
    if (!coarse && groundM !== undefined) {
      throw new Error(
        `${entry.id}: a 4dp photo carries gps.groundM; run npm run photos:exif with its original`
      );
    }
    let uv = null;
    let elevation = null;
    if (position) {
      const grid = toGrid(dem.crs, position);
      const raw = gridToUv(grid, dem.extent);
      // WR-01: off the sheet there is no pin to place and only a clamped edge height to sample.
      // No uv or position in the message: CI logs are public (16 D-12).
      if (raw.u < 0 || raw.u > 1 || raw.v < 0 || raw.v > 1) {
        throw new Error(`${entry.id}: position lies outside the DEM extent; plate ${plate.id}`);
      }
      uv = { u: round4(raw.u), v: round4(raw.v) };
      if (coarse && position.source === 'exif') {
        if (groundM === undefined) {
          throw new Error(
            `${entry.id}: a ${record.precision} photo needs gps.groundM; run npm run photos:exif with its original`
          );
        }
        // 16-REVIEW WR-02: the height is only as fresh as the plate source it was
        // sampled on. A refetched or moved plate, or a new region, changes the sha256.
        if (entry.gps.groundSourceSha256 !== dem.sha256) {
          throw new Error(
            `${entry.id}: gps.groundM was sampled on another source than plate ${plate.id}'s; run npm run photos:exif with its original`
          );
        }
        elevation = { source: 'dem', m: groundM };
      } else {
        elevation = { source: 'dem', m: Math.round(sampleAtGrid(dem, grid)) };
      }
    }
    return PhotoFacts.parse({
      id: entry.id,
      region: record.region,
      country: record.country,
      kind: record.kind,
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

  const home = homeFacts(photos, await loadHomeWaypointIds());
  const homeText =
    `// AUTO-GENERATED by scripts/photos/build-photo-data.mjs from ${HOME_WAYPOINTS_REL} and the facts of ${OUT_REL}. Do not edit.\n` +
    `// The Home waypoints' photo facts only, the footer's client-safe input (DATA-09).\n` +
    `export const homePhotoFacts = ${JSON.stringify(home, null, 2)} as const;\n`;
  return { photos, text, home, homeText };
}

function formatIssues(error) {
  return error.issues.map(
    (i) => `${NAME}: schema ${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`
  );
}

async function write() {
  const { photos, text, home, homeText } = await build();
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, text, 'utf8');
  fs.writeFileSync(HOME_OUT_PATH, homeText, 'utf8');
  for (const p of photos) {
    console.log(
      `${NAME}: ${p.id} ${p.elevation ? `${p.elevation.m} m` : 'no position'} ${p.tags.year} ${p.tags.season ?? '-'}`
    );
  }
  console.log(`${NAME}: wrote ${OUT_REL} (${photos.length} photos)`);
  console.log(`${NAME}: wrote ${HOME_OUT_REL} (${home.length} Home photos)`);
  console.log(`${NAME}: OK`);
}

async function check() {
  const { text, homeText } = await build();
  for (const [rel, file, expected] of [
    [OUT_REL, OUT_PATH, text],
    [HOME_OUT_REL, HOME_OUT_PATH, homeText],
  ]) {
    if (!fs.existsSync(file)) {
      console.log(`${NAME}: ${rel} is missing; run npm run photos:build`);
      console.log(`${NAME}: stale`);
      process.exit(1);
    }
    if (fs.readFileSync(file, 'utf8') !== expected) {
      console.log(`${NAME}: ${rel} differs from a fresh build; run npm run photos:build`);
      console.log(`${NAME}: stale`);
      process.exit(1);
    }
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
