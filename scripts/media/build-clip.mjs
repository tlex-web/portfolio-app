#!/usr/bin/env node

/**
 * Clip derive (D-27): a screen recording -> one hashed, metadata-free H.264 MP4,
 * a WebP poster and data/generated/media-manifest.ts
 *
 * The coin-flip case study shows a 5-10 s clip of the real toss. The recording
 * lives in the gitignored assets/clips-original/ (a device recording carries its
 * creation time, location and device tags), the clip is generated here, on Tim's
 * machine, with ffmpeg, and committed. CI only checks it, without ffmpeg and
 * without the original.
 *
 * Per clip in data/media/clips.json (ClipsSidecar, data/schemas/media-manifest.ts):
 *   - the MP4: H.264 High, yuv420p, 512 px wide (height from the aspect ratio,
 *     rounded to even), no audio, subtitle or data streams, +faststart, global
 *     and stream metadata, chapters and SEI encoder info stripped, bitexact;
 *   - the poster: the frame at `posterAt` of the *encoded* clip (same size and
 *     colours), through sharp `.webp({ quality: 82 })`, whose default output
 *     keeps no metadata. Never call a metadata-retaining sharp method here.
 * ffmpeg runs only through execFileSync with an argument array: no shell.
 *
 * File names: public/media/<id>.<first 10 hex of sha256(bytes)>.mp4 and
 * public/media/<id>-poster.<first 10 hex of sha256(bytes)>.webp. Encoders are
 * not byte-stable across machines, so the committed bytes are authoritative and
 * the hash is checked against them.
 *
 * The manifest is a pure function of the clip files and the sidecar. Write mode
 * builds it from the encoded buffers in memory; --check rebuilds it from the
 * files on disk. Both go through the same assembly (assembleManifest), and both
 * validate the MP4 with the served-asset guard's box walker
 * (scripts/guards/lib/mp4-boxes.mjs): verify the artifact, not the flags.
 *
 * Modes:
 *   (default)  needs ffmpeg and the originals (assets/clips-original/<id>.*, one
 *              file per clip, sha256 equal to the sidecar's sourceSha256). Encodes
 *              every clip to a temp file, validates (walker, 1.5 MiB budget,
 *              5-10 s from mvhd, one video track, poster), then writes the files
 *              and the manifest and deletes stale files in public/media/ last.
 *              Any failure before the write exits 1 with nothing written.
 *              With no clips it only writes the empty manifest (no ffmpeg).
 *   --check    needs neither (CI). Fails on a missing or duplicate file, a name
 *              hash that does not match the bytes, a size over budget, a duration
 *              outside 5-10 s or away from the sidecar's, an audio track or any
 *              other walker violation, a poster that is not a clean WebP of the
 *              clip's size, a file in public/media/ no clip owns, or a manifest
 *              whose text differs from a rebuild from disk and the sidecar.
 *   --root <dir>  run against another checkout (tests use throwaway roots).
 *
 * Usage:
 *   npm run clip:derive               (write; local only)
 *   npm run clip:derive -- --check    (also `npm run data:check`, part of `npm run lint`)
 *
 * Exit code 1 on any failure; prints `clips: OK` otherwise.
 */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { checkMp4, mp4Info } from '../guards/lib/mp4-boxes.mjs';
import {
  CLIP_IDS,
  ClipsSidecar,
  MAX_CLIP_BYTES,
  MAX_CLIP_SECONDS,
  MediaManifest,
  MIN_CLIP_SECONDS,
} from '../../data/schemas/media-manifest.ts';

const NAME = 'clips';
const ORIGINALS_REL = 'assets/clips-original/';
const SIDECAR_REL = 'data/media/clips.json';
const OUT_REL = 'public/media/';
const MANIFEST_REL = 'data/generated/media-manifest.ts';
const URL_PREFIX = '/media/';

/** Output width in px: 2x the 256 px CSS frame (RESEARCH B). */
const WIDTH = 512;
const POSTER_QUALITY = 82;
/** How far the encoded duration may drift from the sidecar's (frame rounding). */
const DURATION_TOLERANCE_S = 0.1;

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const hashed = (stem, ext, bytes) => `${stem}.${sha256(bytes).slice(0, 10)}.${ext}`;
const KINDS = {
  mp4: { stem: (id) => id, ext: 'mp4' },
  webp: { stem: (id) => `${id}-poster`, ext: 'webp' },
};

function usage(message) {
  console.log(`${NAME}: ${message}`);
  console.log('usage: build-clip.mjs [--check] [--root <dir>]');
  process.exit(1);
}

function parseArgs(argv) {
  let check = false;
  let root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--check') check = true;
    else if (argv[i] === '--root') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) usage('--root needs a value');
      root = path.resolve(value);
      i++;
    } else usage(`unknown argument ${argv[i]}`);
  }
  return { check, root };
}

const { check: CHECK, root: ROOT } = parseArgs(process.argv.slice(2));
const OUT_DIR = path.join(ROOT, OUT_REL);
const MANIFEST_PATH = path.join(ROOT, MANIFEST_REL);

/** The committed sidecar, parsed. Throws with the zod issues when it is invalid. */
function loadSidecar() {
  const p = path.join(ROOT, SIDECAR_REL);
  if (!fs.existsSync(p)) throw new Error(`${SIDECAR_REL} is missing`);
  return ClipsSidecar.parse(JSON.parse(fs.readFileSync(p, 'utf8')));
}

/** Sorted file names in public/media/ (empty when the folder is absent). */
function outFiles() {
  if (!fs.existsSync(OUT_DIR)) return [];
  return fs
    .readdirSync(OUT_DIR, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .sort();
}

/** The generated module for a manifest object (no import: erasable TS a client can load). */
function render(manifest) {
  const ids = CLIP_IDS.map((id) => `'${id}'`).join(' | ');
  return (
    '// AUTO-GENERATED by scripts/media/build-clip.mjs from data/media/clips.json and public/media/. Do not edit.\n' +
    `// Content-hashed, metadata-free clips and posters (D-27): one silent H.264 MP4 per clip, at most ${MAX_CLIP_BYTES} bytes.\n` +
    '\n' +
    'export interface MediaClipEntry {\n' +
    '  src: string;\n' +
    "  type: 'video/mp4';\n" +
    '  width: number;\n' +
    '  height: number;\n' +
    '  durationS: number;\n' +
    '  bytes: number;\n' +
    '  poster: { src: string; width: number; height: number };\n' +
    '}\n' +
    '\n' +
    `export const mediaManifest: Partial<Record<${ids}, MediaClipEntry>> = ${JSON.stringify(manifest, null, 2)};\n`
  );
}

/** Walker, budget, track, size and duration facts of one clip, or null after pushing problems. */
function inspectClip(clip, file, problems) {
  const where = `${clip.id}: ${OUT_REL}${file.name}`;
  const before = problems.length;
  for (const v of checkMp4(file.bytes, { maxBytes: MAX_CLIP_BYTES })) problems.push(`${where} ${v}`);
  const info = mp4Info(file.bytes);
  if (info.width === null || info.height === null) problems.push(`${where} has no video track size`);
  if (info.durationS === null) {
    problems.push(`${where} has no mvhd duration`);
  } else {
    const d = info.durationS;
    if (d < MIN_CLIP_SECONDS || d > MAX_CLIP_SECONDS)
      problems.push(`${where} runs ${d.toFixed(3)} s, outside ${MIN_CLIP_SECONDS}-${MAX_CLIP_SECONDS} s`);
    else if (Math.abs(d - clip.duration) > DURATION_TOLERANCE_S)
      problems.push(`${where} runs ${d.toFixed(3)} s but ${SIDECAR_REL} says ${clip.duration} s (stale; run npm run clip:derive)`);
  }
  if (problems.length > before) return null;
  return { width: info.width, height: info.height, durationS: Math.round(info.durationS * 1000) / 1000 };
}

/** Format, metadata and size facts of one poster, or null after pushing problems. */
async function inspectPoster(clip, file, video, problems) {
  const where = `${clip.id}: ${OUT_REL}${file.name}`;
  let md;
  try {
    md = await sharp(file.bytes).metadata();
  } catch {
    problems.push(`${where} is not a decodable image`);
    return null;
  }
  const before = problems.length;
  if (md.format !== 'webp') problems.push(`${where} decodes as ${md.format}, not webp`);
  const carried = ['exif', 'xmp', 'iptc', 'icc'].filter((k) => md[k]);
  if (md.orientation !== undefined) carried.push('orientation');
  if (carried.length > 0) problems.push(`${where} carries ${carried.join(', ')} metadata`);
  if (video && (md.width !== video.width || md.height !== video.height))
    problems.push(`${where} is ${md.width} x ${md.height}, the clip is ${video.width} x ${video.height}`);
  if (problems.length > before) return null;
  return { width: md.width, height: md.height };
}

/**
 * Assemble and validate the manifest. `lookup(clip, kind)` resolves one file to
 * `{ name, bytes }`, or pushes a problem and returns null. Returns
 * { value, text } only when no problem was pushed.
 */
async function assembleManifest(sidecar, lookup, problems) {
  const before = problems.length;
  const manifest = {};
  for (const clip of sidecar.clips) {
    const mp4 = lookup(clip, 'mp4');
    const webp = lookup(clip, 'webp');
    for (const f of [mp4, webp].filter(Boolean)) {
      const m = /\.([0-9a-f]{10})\.[a-z0-9]+$/.exec(f.name);
      if (!m || sha256(f.bytes).slice(0, 10) !== m[1])
        problems.push(`${clip.id}: ${OUT_REL}${f.name} sha256 of the bytes does not match the name`);
    }
    const video = mp4 ? inspectClip(clip, mp4, problems) : null;
    const poster = webp ? await inspectPoster(clip, webp, video, problems) : null;
    if (!mp4 || !webp || !video || !poster) continue;
    manifest[clip.id] = {
      src: `${URL_PREFIX}${mp4.name}`,
      type: 'video/mp4',
      width: video.width,
      height: video.height,
      durationS: video.durationS,
      bytes: mp4.bytes.length,
      poster: { src: `${URL_PREFIX}${webp.name}`, width: poster.width, height: poster.height },
    };
  }
  if (problems.length > before) return null;
  const parsed = MediaManifest.safeParse(manifest);
  if (!parsed.success) {
    for (const i of parsed.error.issues)
      problems.push(`schema ${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`);
    return null;
  }
  return { value: manifest, text: render(manifest) };
}

/** ffmpeg arguments for one clip (RESEARCH "Encode and poster"; flags verified on ffmpeg 9.0.1). */
function encodeArgs(clip, original, out) {
  const vf = [`scale=${WIDTH}:-2:flags=lanczos`, 'format=yuv420p'];
  if (clip.fps) vf.push(`fps=${clip.fps}`);
  return [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', String(clip.start), '-t', String(clip.duration), '-i', original,
    '-map', '0:v:0', '-an', '-sn', '-dn',
    '-map_metadata', '-1', '-map_chapters', '-1',
    '-vf', vf.join(','),
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', String(clip.crf),
    '-bsf:v', 'filter_units=remove_types=6',
    '-movflags', '+faststart', '-fflags', '+bitexact', '-flags:v', '+bitexact',
    '-metadata:s:v:0', 'encoder=',
    out,
  ];
}

/** The one original for a clip: assets/clips-original/<id>.<ext>. */
function findOriginal(clip) {
  const dir = path.join(ROOT, ORIGINALS_REL);
  const found = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => path.parse(f).name === clip.id)
    : [];
  if (found.length === 0)
    throw new Error(`no original ${ORIGINALS_REL}${clip.id}.* (recordings are local only, D-27)`);
  if (found.length > 1) throw new Error(`several originals for ${clip.id}: ${found.join(', ')}`);
  return path.join(dir, found[0]);
}

async function write() {
  const sidecar = loadSidecar();
  const encoded = new Map(); // clip id -> { mp4, webp } as { name, bytes }

  if (sidecar.clips.length > 0) {
    try {
      execFileSync('ffmpeg', ['-hide_banner', '-version'], { stdio: 'ignore' });
    } catch {
      throw new Error('ffmpeg is not on PATH; write mode runs on Tim\'s machine only (CI runs --check)');
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clip-derive-'));
    try {
      for (const clip of sidecar.clips) {
        const original = findOriginal(clip);
        if (sha256(fs.readFileSync(original)) !== clip.sourceSha256)
          throw new Error(
            `${path.relative(ROOT, original).split(path.sep).join('/')} does not match the sidecar sourceSha256; update ${SIDECAR_REL} first`
          );
        const tmpMp4 = path.join(tmp, `${clip.id}.mp4`);
        execFileSync('ffmpeg', encodeArgs(clip, original, tmpMp4), { stdio: ['ignore', 'ignore', 'inherit'] });
        const mp4 = fs.readFileSync(tmpMp4);
        const png = execFileSync(
          'ffmpeg',
          ['-hide_banner', '-loglevel', 'error', '-ss', String(clip.posterAt), '-i', tmpMp4,
            '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-'],
          { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 * 1024 * 1024 }
        );
        const poster = await sharp(png).webp({ quality: POSTER_QUALITY }).toBuffer();
        encoded.set(clip.id, {
          mp4: { name: hashed(KINDS.mp4.stem(clip.id), KINDS.mp4.ext, mp4), bytes: mp4 },
          webp: { name: hashed(KINDS.webp.stem(clip.id), KINDS.webp.ext, poster), bytes: poster },
        });
        console.log(`${NAME}: encoded ${clip.id} (${mp4.length} B MP4, ${poster.length} B poster)`);
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }

  // Validate from the buffers; nothing is on disk yet.
  const problems = [];
  const built = await assembleManifest(sidecar, (clip, kind) => encoded.get(clip.id)?.[kind] ?? null, problems);
  if (!built) {
    for (const l of problems) console.log(`${NAME}: ${l}`);
    console.log(`${NAME}: ${problems.length} problems; nothing written`);
    process.exit(1);
  }

  const keep = new Set();
  for (const files of encoded.values()) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const f of [files.mp4, files.webp]) {
      fs.writeFileSync(path.join(OUT_DIR, f.name), f.bytes);
      keep.add(f.name);
    }
  }
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, built.text, 'utf8');

  // Stale files go last, once the new set and its manifest are in place.
  for (const f of outFiles()) {
    if (keep.has(f)) continue;
    fs.unlinkSync(path.join(OUT_DIR, f));
    console.log(`${NAME}: removed stale ${OUT_REL}${f}`);
  }
  console.log(`${NAME}: wrote ${keep.size} files to ${OUT_REL} and ${MANIFEST_REL}`);
  console.log(`${NAME}: OK`);
}

async function check() {
  const problems = [];
  const sidecar = loadSidecar();
  const files = outFiles();
  const owned = new Set();

  const lookup = (clip, kind) => {
    const { stem, ext } = KINDS[kind];
    const pattern = new RegExp(`^${stem(clip.id)}\\.[0-9a-f]{10}\\.${ext}$`);
    const matches = files.filter((f) => pattern.test(f));
    matches.forEach((f) => owned.add(f));
    if (matches.length === 0) {
      problems.push(`${clip.id}: ${OUT_REL}${stem(clip.id)}.<hash>.${ext} is missing; run npm run clip:derive`);
      return null;
    }
    if (matches.length > 1) {
      problems.push(`${clip.id}: several ${ext} files (${matches.join(', ')}); run npm run clip:derive`);
      return null;
    }
    return { name: matches[0], bytes: fs.readFileSync(path.join(OUT_DIR, matches[0])) };
  };

  const built = await assembleManifest(sidecar, lookup, problems);
  for (const f of files)
    if (!owned.has(f)) problems.push(`orphan ${OUT_REL}${f} (no clip in ${SIDECAR_REL} owns it)`);

  if (!fs.existsSync(MANIFEST_PATH)) {
    problems.push(`${MANIFEST_REL} is missing; run npm run clip:derive`);
  } else if (built && built.text !== fs.readFileSync(MANIFEST_PATH, 'utf8')) {
    problems.push(`stale ${MANIFEST_REL} (bytes differ from a rebuild from disk and the sidecar)`);
  }

  for (const l of problems) console.log(`${NAME}: ${l}`);
  console.log(problems.length === 0 ? `${NAME}: OK` : `${NAME}: ${problems.length} problems`);
  process.exit(problems.length === 0 ? 0 : 1);
}

(CHECK ? check() : write()).catch((e) => {
  if (e && Array.isArray(e.issues)) {
    for (const i of e.issues)
      console.log(`${NAME}: schema ${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`);
    console.log(`${NAME}: ${e.issues.length} schema violations; nothing written`);
  } else {
    console.log(`${NAME}: ${e && e.message ? e.message : String(e)}`);
  }
  process.exit(1);
});
