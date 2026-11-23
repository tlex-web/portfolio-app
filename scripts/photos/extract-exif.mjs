#!/usr/bin/env node

/**
 * Photo data stage 1 (D-10, DATA-02, DATA-06, DATA-14): originals -> committed EXIF sidecar
 *
 * Reads the gitignored originals in assets/photos-original/ (D-09: local only,
 * outside public/, never committed; only the top level, so files staged in
 * incoming/ are not read) and writes data/photos/exif-sidecar.json: one entry
 * per original, sorted by id, with the sha256 of the raw file bytes, the camera
 * facts and GPS rounded AT EXTRACTION to the level its photo-map record states,
 * so a finer position is never written or printed anywhere (16 D-01, D-12):
 *
 *   precision  every record states '4dp', '3dp' or '2dp' and a kind, 'ground' or
 *              'aerial', with no default (16 D-02); a record missing either fails
 *              naming the file. Latitude and longitude are rounded half-up with
 *              Math.round(v * 10^d) / 10^d, d = 4, 3 or 2.
 *   altM       the GPS altitude to 1 decimal for a 4dp ground photo; null for a
 *              coarse or an aerial record (16 D-03, D-04).
 *   groundM    coarse records only: the region's plate DEM sampled at the TRUE
 *              position in memory, rounded half-up to 10 m ('3dp') or 50 m
 *              ('2dp') (16 D-03). Read through scripts/photos/plate-dem.mjs from
 *              data/regions/regions.json, data/terrain/plates.json and the plate
 *              source; a true position off the plate fails. Beside it,
 *              groundSourceSha256: the sha256 of the plate source sampled, which
 *              photos:build compares with the plate's current source
 *              (16-REVIEW WR-02).
 *   DJI net    a still whose EXIF Make is DJI (any case) on a record that is not
 *              kind 'aerial' fails and nothing is written (16 D-04).
 * XMP is never read and no camera serial is extracted (16 D-04).
 *
 * Equality is defined on bytes: sha256 over the raw original; EXIF ASCII strings
 * trimmed of trailing NUL and whitespace; output is JSON.stringify(value, null, 2)
 * plus LF, so a re-run on the same originals is byte-identical.
 *
 * Modes:
 *   (default)  extract and write the sidecar. No originals -> exit 1, nothing written.
 *   --check    parse the committed sidecar with ExifSidecar (zod issue paths on
 *              failure). With originals present, re-hash and re-extract them in
 *              memory and compare bytes: one line per stale entry and per
 *              missing/extra original. Without originals (CI) the schema check
 *              alone runs and the hash check is reported as skipped.
 *   --root <dir>  read the originals, the photo map and the sidecar (and write
 *              the sidecar) under <dir> instead of the repository root (default
 *              unchanged). The guard selftest runs it on generated JPEGs.
 *
 * File id rule (15 D-01): an original's id is the key of the record in
 * data/photos/photo-map.json whose `file` is the original's name, never a
 * prefix of the name, so a DJI still or a second camera's IMG_0605 cannot
 * collide on a derived id. The map is parsed with PhotoMap in both modes (CI
 * included); an original with no record fails the script, and so do two
 * records naming one file (the schema refine).
 *
 * DateTimeOriginal: exif-reader returns the naive local wall time as a UTC Date
 * (RESEARCH Pitfall 4); it is formatted with UTC getters, with no offset.
 *
 * This script only reads images: it never calls a sharp output method.
 *
 * Usage:
 *   npm run photos:exif               (write)
 *   npm run photos:exif -- --check    (also `npm run data:check`, part of `npm run lint`)
 *
 * Exit code 1 on any failure; prints `photos:exif: OK` otherwise.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import exifReader from 'exif-reader';
import { ExifSidecar, PhotoMap } from '../../data/schemas/photo.ts';
import { Regions } from '../../data/schemas/region.ts';
import { Plates } from '../../data/schemas/terrain.ts';
import { gridToUv, loadPlateDem, plateFor, sampleAtGrid, toGrid } from './plate-dem.mjs';

const NAME = 'photos:exif';

/**
 * `--check` and `--root <dir>`. The root defaults to the repository above this
 * script; the guard selftest points it at a temp root of generated JPEGs.
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
const ORIGINALS_REL = 'assets/photos-original/';
const SIDECAR_REL = 'data/photos/exif-sidecar.json';
const PHOTO_MAP_REL = 'data/photos/photo-map.json';
const REGIONS_REL = 'data/regions/regions.json';
const PLATES_REL = 'data/terrain/plates.json';
const ORIGINALS_DIR = path.join(ROOT, ORIGINALS_REL);
const SIDECAR_PATH = path.join(ROOT, SIDECAR_REL);
const PHOTO_MAP_PATH = path.join(ROOT, PHOTO_MAP_REL);

/**
 * data/photos/photo-map.json parsed with PhotoMap (15 D-01). Schema issues are
 * printed one per line with the map's path; a duplicate file fails here through
 * the schema refine. Throws on any failure.
 */
function loadPhotoMap() {
  if (!fs.existsSync(PHOTO_MAP_PATH)) throw new Error(`${PHOTO_MAP_REL} is missing`);
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(PHOTO_MAP_PATH, 'utf8'));
  } catch (e) {
    throw new Error(`${PHOTO_MAP_REL} is not valid JSON (${e.message})`);
  }
  // 16 D-02: no default precision or kind. Named per file before the schema
  // runs, so the message says which original and what to add.
  const records = raw && typeof raw.photos === 'object' && raw.photos !== null ? raw.photos : {};
  for (const record of Object.values(records)) {
    if (!record || typeof record !== 'object') continue;
    if (!Object.hasOwn(record, 'precision')) {
      throw new Error(
        `add a precision ('4dp', '3dp' or '2dp') to the record for ${record.file} in ${PHOTO_MAP_REL}`
      );
    }
    if (!Object.hasOwn(record, 'kind')) {
      throw new Error(
        `add a kind ('ground' or 'aerial') to the record for ${record.file} in ${PHOTO_MAP_REL}`
      );
    }
  }
  const parsed = PhotoMap.safeParse(raw);
  if (!parsed.success) {
    for (const i of parsed.error.issues) {
      console.log(`${NAME}: ${PHOTO_MAP_REL} ${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`);
    }
    throw new Error(`${PHOTO_MAP_REL}: ${parsed.error.issues.length} schema violations`);
  }
  return parsed.data;
}

/**
 * Sorted *.jpg and *.jpeg names in the originals folder, or null when the folder
 * is absent. A `.jpeg` original is never skipped without a word (08 IN-05).
 */
function listOriginals() {
  if (!fs.existsSync(ORIGINALS_DIR)) return null;
  return fs
    .readdirSync(ORIGINALS_DIR)
    .filter((f) => /\.jpe?g$/i.test(f))
    .sort();
}

/**
 * The id and record of the photo-map record whose `file` is `file` (15 D-01).
 * The name is never parsed: an original with no record fails, whatever its name.
 */
function recordFor(file, map) {
  const hit = Object.entries(map.photos).find(([, entry]) => entry.file === file);
  if (!hit) throw new Error(`add a record for ${file} to ${PHOTO_MAP_REL}`);
  return { id: hit[0], record: hit[1] };
}

/**
 * Lazy plate DEM access for coarse records (16 D-03): the registries are read
 * and each plate is loaded at most once, and only when a coarse photo needs it.
 * `groundAt(record, file)` resolves to { sample, sha256 }: a (lat, lon) ->
 * metres sampler at the true position, and the sha256 of the plate source it
 * samples (recorded beside groundM, 16-REVIEW WR-02). Nothing here prints a
 * position (D-12): an off-plate true position fails naming the file and the
 * plate only.
 */
function plateGround() {
  let registries = null;
  const dems = new Map();
  const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  return async (record, file) => {
    registries ??= {
      regions: Regions.parse(readJson(REGIONS_REL)),
      plates: Plates.parse(readJson(PLATES_REL)),
    };
    const plate = plateFor(record, registries.regions, registries.plates);
    if (!dems.has(plate.id)) dems.set(plate.id, await loadPlateDem(ROOT, plate.source));
    const dem = dems.get(plate.id);
    const sample = (lat, lon) => {
      const grid = toGrid(dem.crs, { lat, lon });
      const uv = gridToUv(grid, dem.extent);
      if (uv.u < 0 || uv.u > 1 || uv.v < 0 || uv.v > 1) {
        throw new Error(
          `${file} lies outside plate ${plate.id}; curate it out of ${PHOTO_MAP_REL} or widen the plate`
        );
      }
      return sampleAtGrid(dem, grid);
    };
    return { sample, sha256: dem.sha256 };
  };
}
const groundAt = plateGround();

/** Trim trailing NUL and whitespace from an EXIF ASCII value; empty -> null. */
function str(v) {
  if (typeof v !== 'string') return null;
  const t = v.replace(/[\0\s]+$/u, '');
  return t === '' ? null : t;
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const int = (v) => (Number.isInteger(v) ? v : null);
/** Decimals per precision level (16 D-01). '4dp' is the v2.0 round4, bit for bit. */
const DECIMALS = { '4dp': 4, '3dp': 3, '2dp': 2 };
/** Ground-height rounding step for a coarse record, in metres (16 D-03). */
const HEIGHT_STEP = { '3dp': 10, '2dp': 50 };
const roundTo = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
const round1 = (v) => Math.round(v * 10) / 10;
const pad2 = (n) => String(n).padStart(2, '0');

/** Date (naive local time carried as UTC) -> YYYY-MM-DDTHH:MM:SS via UTC getters. */
function naiveLocal(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return (
    `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`
  );
}

/** [deg, min, sec] + 'N'|'S'|'E'|'W' -> signed decimal degrees, or null. */
function dmsToDecimal(dms, ref) {
  if (!Array.isArray(dms) || dms.length !== 3 || !dms.every((x) => Number.isFinite(x))) return null;
  const v = dms[0] + dms[1] / 60 + dms[2] / 3600;
  return ref === 'S' || ref === 'W' ? -v : v;
}

/** GPSDateStamp 'YYYY:MM:DD' + GPSTimeStamp [h, m, s] -> 'YYYY-MM-DDTHH:MM:SSZ' (fractional s kept), or null. */
function gpsUtc(dateStamp, timeStamp) {
  const date = str(dateStamp);
  if (!date || !/^\d{4}:\d{2}:\d{2}$/.test(date)) return null;
  if (
    !Array.isArray(timeStamp) ||
    timeStamp.length !== 3 ||
    !timeStamp.every((x) => Number.isFinite(x))
  )
    return null;
  const [h, m, s] = timeStamp;
  const whole = Math.floor(s);
  const frac = String(s).includes('.') ? String(s).slice(String(s).indexOf('.')) : '';
  return `${date.replaceAll(':', '-')}T${pad2(h)}:${pad2(m)}:${pad2(whole)}${frac}Z`;
}

/**
 * The sidecar GPS of one original, rounded to its record's precision (16 D-01).
 * `ground` is a lazy async (record, file) -> sampler; it runs only for a coarse
 * record, at the true position, in memory (16 D-03). The true position never
 * leaves this function: only the rounded values are returned.
 */
async function gpsOf(g, record, file, ground) {
  if (!g) return null;
  const lat = dmsToDecimal(g.GPSLatitude, str(g.GPSLatitudeRef));
  const lon = dmsToDecimal(g.GPSLongitude, str(g.GPSLongitudeRef));
  const alt = num(g.GPSAltitude);
  // No position -> null, never a guessed one. A missing altitude is not guessed
  // either: it is null, and the latitude and longitude are kept (08-REVIEW WR-02;
  // heights come from the DEM, D-17).
  if (lat === null || lon === null) return null;
  const d = DECIMALS[record.precision];
  const coarse = record.precision !== '4dp';
  // 16 D-03, D-04: a coarse or aerial photo keeps no GPS altitude.
  const keepAlt = !coarse && record.kind !== 'aerial' && alt !== null;
  const gps = {
    lat: roundTo(lat, d),
    lon: roundTo(lon, d),
    altM: keepAlt ? round1(g.GPSAltitudeRef === 1 ? -alt : alt) : null,
    utc: gpsUtc(g.GPSDateStamp, g.GPSTimeStamp),
  };
  if (coarse) {
    const step = HEIGHT_STEP[record.precision];
    const { sample, sha256 } = await ground(record, file);
    gps.groundM = Math.round(sample(lat, lon) / step) * step;
    // 16-REVIEW WR-02: which plate source the height came from, so stage 2 can
    // refuse it once that source changes. Reveals nothing about the position.
    gps.groundSourceSha256 = sha256;
  }
  return gps;
}

/** ICC profile description from the 'desc' tag (v2 'desc' or v4 'mluc'), or null. */
function iccDescription(icc) {
  if (!Buffer.isBuffer(icc) || icc.length < 132) return null;
  const count = icc.readUInt32BE(128);
  for (let i = 0; i < count; i++) {
    const at = 132 + i * 12;
    if (at + 12 > icc.length) return null;
    if (icc.toString('latin1', at, at + 4) !== 'desc') continue;
    const off = icc.readUInt32BE(at + 4);
    const type = icc.toString('latin1', off, off + 4);
    if (type === 'desc') {
      const n = icc.readUInt32BE(off + 8);
      return str(icc.toString('latin1', off + 12, off + 12 + n));
    }
    if (type === 'mluc') {
      const recLen = icc.readUInt32BE(off + 20);
      const strOff = icc.readUInt32BE(off + 24);
      const be = icc.subarray(off + strOff, off + strOff + recLen);
      const le = Buffer.from(be).swap16();
      return str(le.toString('utf16le'));
    }
    return null;
  }
  return null;
}

async function extractEntry(file, map) {
  const abs = path.join(ORIGINALS_DIR, file);
  const bytes = fs.readFileSync(abs);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const md = await sharp(bytes).metadata();
  const ex = md.exif ? exifReader(md.exif) : {};
  const img = ex.Image ?? {};
  const photo = ex.Photo ?? {};
  const { id, record } = recordFor(file, map);
  const make = str(img.Make);
  // 16 D-04 safety net: a drone still is aerial; its GPS altitude must not be kept.
  if (make !== null && make.trim().toLowerCase() === 'dji' && record.kind !== 'aerial') {
    throw new Error(`${file} is a DJI still; set "kind": "aerial" on its record in ${PHOTO_MAP_REL}`);
  }
  return {
    id,
    file,
    sha256,
    width: md.width,
    height: md.height,
    orientation: int(md.orientation),
    space: md.space,
    iccDescription: iccDescription(md.icc),
    make,
    model: str(img.Model),
    lens: str(photo.LensModel),
    focalLengthMm: num(photo.FocalLength),
    fNumber: num(photo.FNumber),
    exposureTimeS: num(photo.ExposureTime),
    iso: int(photo.ISOSpeedRatings ?? photo.PhotographicSensitivity),
    dateTimeOriginal: naiveLocal(photo.DateTimeOriginal),
    offsetTimeOriginal: str(photo.OffsetTimeOriginal),
    gps: await gpsOf(ex.GPSInfo, record, file, groundAt),
  };
}

/** Extract every original, validate, and return { value, text }. Throws on a schema failure. */
async function buildSidecar(files, map) {
  const photos = [];
  for (const file of files) photos.push(await extractEntry(file, map));
  photos.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const value = ExifSidecar.parse({ schemaVersion: 1, photos });
  return { value, text: JSON.stringify(value, null, 2) + '\n' };
}

function formatIssues(error) {
  return error.issues.map(
    (i) => `${NAME}: schema ${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`
  );
}

async function write() {
  const map = loadPhotoMap();
  const files = listOriginals();
  if (!files || files.length === 0) {
    console.log(`${NAME}: no originals found in ${ORIGINALS_REL}`);
    process.exit(1);
  }
  const { value, text } = await buildSidecar(files, map);
  fs.mkdirSync(path.dirname(SIDECAR_PATH), { recursive: true });
  fs.writeFileSync(SIDECAR_PATH, text, 'utf8');
  console.log(`${NAME}: wrote ${SIDECAR_REL} (${value.photos.length} photos)`);
  console.log(`${NAME}: OK`);
}

async function check() {
  const lines = [];
  if (!fs.existsSync(SIDECAR_PATH)) {
    console.log(`${NAME}: ${SIDECAR_REL} is missing; run npm run photos:exif`);
    process.exit(1);
  }
  const committedText = fs.readFileSync(SIDECAR_PATH, 'utf8');
  let committed;
  try {
    committed = JSON.parse(committedText);
  } catch (e) {
    console.log(`${NAME}: ${SIDECAR_REL} is not valid JSON (${e.message})`);
    process.exit(1);
  }
  const parsed = ExifSidecar.safeParse(committed);
  if (!parsed.success) {
    for (const l of formatIssues(parsed.error)) console.log(l);
    console.log(`${NAME}: ${parsed.error.issues.length} schema violations`);
    process.exit(1);
  }

  // Parsed with or without the originals, so CI checks the map too (15 D-01).
  const map = loadPhotoMap();

  const files = listOriginals();
  if (!files || files.length === 0) {
    console.log(`${NAME}: originals absent, schema OK, hash check skipped`);
    console.log(`${NAME}: OK`);
    process.exit(0);
  }

  let fresh;
  try {
    fresh = await buildSidecar(files, map);
  } catch (e) {
    if (e && Array.isArray(e.issues)) {
      for (const l of formatIssues(e)) console.log(`${l} (fresh extraction)`);
      console.log(`${NAME}: ${e.issues.length} stale`);
      process.exit(1);
    }
    throw e;
  }

  if (fresh.text !== committedText) {
    const old = new Map(parsed.data.photos.map((p) => [p.id, p]));
    const now = new Map(fresh.value.photos.map((p) => [p.id, p]));
    for (const [id, p] of now) {
      if (!old.has(id)) lines.push(`${NAME}: extra original ${p.file} (${id} not in the sidecar)`);
    }
    for (const [id, p] of old) {
      if (!now.has(id)) {
        lines.push(`${NAME}: missing original for ${id} (${p.file})`);
        continue;
      }
      const n = now.get(id);
      const field = Object.keys(n).find((k) => JSON.stringify(n[k]) !== JSON.stringify(p[k]));
      if (field) lines.push(`${NAME}: stale ${id} (${field})`);
    }
    // Same facts, different bytes (line endings, key order, hand formatting).
    if (lines.length === 0)
      lines.push(`${NAME}: stale ${SIDECAR_REL} (bytes differ from a fresh extraction)`);
  }

  for (const l of lines) console.log(l);
  console.log(lines.length === 0 ? `${NAME}: OK` : `${NAME}: ${lines.length} stale`);
  process.exit(lines.length === 0 ? 0 : 1);
}

(ARGS.check ? check() : write()).catch((e) => {
  if (e && Array.isArray(e.issues)) {
    for (const l of formatIssues(e)) console.log(l);
    console.log(`${NAME}: ${e.issues.length} schema violations; nothing written`);
  } else {
    console.log(`${NAME}: ${e && e.message ? e.message : String(e)}`);
  }
  process.exit(1);
});
