#!/usr/bin/env node

/**
 * Photo data stage 1 (D-10, DATA-02, DATA-06): originals -> committed EXIF sidecar
 *
 * Reads the gitignored originals in assets/photos-original/ (D-09: local only,
 * outside public/, never committed) and writes data/photos/exif-sidecar.json:
 * one entry per original, sorted by id, with the sha256 of the raw file bytes,
 * the camera facts and GPS rounded to 4 decimals (altitude to 1 decimal) AT
 * EXTRACTION, so a full-precision position is never written anywhere.
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
 *
 * File id rule: the name starts with IMG_dddd or Rddd-ddd; id is that prefix
 * lowercased with `_` -> `-` (IMG_0605-Enhanced (...).jpg -> img-0605). Any other
 * name fails the script.
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
import { ExifSidecar } from '../../data/schemas/photo.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORIGINALS_REL = 'assets/photos-original/';
const SIDECAR_REL = 'data/photos/exif-sidecar.json';
const ORIGINALS_DIR = path.join(ROOT, ORIGINALS_REL);
const SIDECAR_PATH = path.join(ROOT, SIDECAR_REL);
const NAME = 'photos:exif';

/** Sorted *.jpg names in the originals folder, or null when the folder is absent. */
function listOriginals() {
  if (!fs.existsSync(ORIGINALS_DIR)) return null;
  return fs
    .readdirSync(ORIGINALS_DIR)
    .filter((f) => /\.jpg$/i.test(f))
    .sort();
}

/** IMG_0605-Enhanced (...).jpg -> img-0605; R004-011-Edit (...).jpg -> r004-011. */
function idFromFile(file) {
  const m = /^(IMG_\d{4}|R\d{3}-\d{3})/.exec(file);
  if (!m)
    throw new Error(`cannot derive an id from "${file}" (expected IMG_dddd or Rddd-ddd prefix)`);
  return m[1].toLowerCase().replace('_', '-');
}

/** Trim trailing NUL and whitespace from an EXIF ASCII value; empty -> null. */
function str(v) {
  if (typeof v !== 'string') return null;
  const t = v.replace(/[\0\s]+$/u, '');
  return t === '' ? null : t;
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const int = (v) => (Number.isInteger(v) ? v : null);
const round4 = (v) => Math.round(v * 1e4) / 1e4;
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

function gpsOf(g) {
  if (!g) return null;
  const lat = dmsToDecimal(g.GPSLatitude, str(g.GPSLatitudeRef));
  const lon = dmsToDecimal(g.GPSLongitude, str(g.GPSLongitudeRef));
  const alt = num(g.GPSAltitude);
  // No position -> null, never a guessed one. A missing altitude is not guessed either.
  if (lat === null || lon === null || alt === null) return null;
  return {
    lat: round4(lat),
    lon: round4(lon),
    altM: round1(g.GPSAltitudeRef === 1 ? -alt : alt),
    utc: gpsUtc(g.GPSDateStamp, g.GPSTimeStamp),
  };
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

async function extractEntry(file) {
  const abs = path.join(ORIGINALS_DIR, file);
  const bytes = fs.readFileSync(abs);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const md = await sharp(bytes).metadata();
  const ex = md.exif ? exifReader(md.exif) : {};
  const img = ex.Image ?? {};
  const photo = ex.Photo ?? {};
  return {
    id: idFromFile(file),
    file,
    sha256,
    width: md.width,
    height: md.height,
    orientation: int(md.orientation),
    space: md.space,
    iccDescription: iccDescription(md.icc),
    make: str(img.Make),
    model: str(img.Model),
    lens: str(photo.LensModel),
    focalLengthMm: num(photo.FocalLength),
    fNumber: num(photo.FNumber),
    exposureTimeS: num(photo.ExposureTime),
    iso: int(photo.ISOSpeedRatings ?? photo.PhotographicSensitivity),
    dateTimeOriginal: naiveLocal(photo.DateTimeOriginal),
    offsetTimeOriginal: str(photo.OffsetTimeOriginal),
    gps: gpsOf(ex.GPSInfo),
  };
}

/** Extract every original, validate, and return { value, text }. Throws on a schema failure. */
async function buildSidecar(files) {
  const photos = [];
  for (const file of files) photos.push(await extractEntry(file));
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
  const files = listOriginals();
  if (!files || files.length === 0) {
    console.log(`${NAME}: no originals found in ${ORIGINALS_REL}`);
    process.exit(1);
  }
  const { value, text } = await buildSidecar(files);
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

  const files = listOriginals();
  if (!files || files.length === 0) {
    console.log(`${NAME}: originals absent, schema OK, hash check skipped`);
    console.log(`${NAME}: OK`);
    process.exit(0);
  }

  let fresh;
  try {
    fresh = await buildSidecar(files);
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

const args = process.argv.slice(2);
const unknown = args.filter((a) => a !== '--check');
if (unknown.length > 0) {
  console.log(`${NAME}: unknown argument(s) ${unknown.join(' ')}; the only flag is --check`);
  process.exit(1);
}

(args.includes('--check') ? check() : write()).catch((e) => {
  if (e && Array.isArray(e.issues)) {
    for (const l of formatIssues(e)) console.log(l);
    console.log(`${NAME}: ${e.issues.length} schema violations; nothing written`);
  } else {
    console.log(`${NAME}: ${e && e.message ? e.message : String(e)}`);
  }
  process.exit(1);
});
