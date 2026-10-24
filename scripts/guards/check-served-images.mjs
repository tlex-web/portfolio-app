#!/usr/bin/env node

/**
 * Guard (DATA-05, PITFALLS 12): every tracked image is metadata-free, and every
 * served image is resized, pre-rotated, content-hashed and listed
 *
 * A photo original carries GPS in its EXIF (and Lightroom can write it into XMP),
 * and a full-resolution file is a copy of the original. This guard fails before
 * deploy when either could become fetchable again, including an original added
 * anywhere with `git add -f`, because the metadata rule covers the whole repo.
 *
 * Scope:
 *   repo mode (no --root):  git ls-files of *.jpg *.jpeg *.png *.webp *.avif *.gif
 *                           *.tif *.tiff *.heic *.svg (case-insensitive) anywhere in
 *                           the repo, minus scripts/guards/__selftest__/**; the
 *                           metadata-call rule reads tracked scripts/photos and
 *                           scripts/terrain sources
 *   fixture mode (--root):  recursive walk of <dir> (fixtures are not a git repo)
 *
 * Rules (each violation prints one line `<posix rel path> <rule>: <detail>`):
 *   - metadata:      a raster image carries EXIF, XMP or IPTC (sharp metadata(),
 *                    plus a byte scan for the Exif, XMP, IPTC and raw-profile
 *                    markers); an image sharp cannot read fails too. SVGs are
 *                    text-checked by svg-content instead
 *   - oversize:      a raster under public/ is above 2560 px on its long edge
 *                    (D-13; e2e/ screenshots are metadata-scanned but size-exempt)
 *   - orientation:   an image under public/ has an orientation tag (served
 *                    files must be rotated at build time)
 *   - hash-name:     a file in public/terrain/ or public/images/photos/ is not
 *                    named <name>.<10 hex>.<png|svg|avif|webp|jpg>, or the hex is
 *                    not the first 10 of sha256 over its bytes
 *   - orphan:        a file in those two directories that no generated manifest
 *                    lists (data/generated/image-manifest.ts, terrain.ts)
 *   - missing:       a manifest URL whose file is not in the scanned set (URLs
 *                    are read from quoted strings only, so a header comment that
 *                    names a directory is not an entry)
 *   - svg-content:   an SVG under public/ contains a script element, an on*=
 *                    event-handler attribute, an href or a foreignObject (these
 *                    SVGs are served same-origin without a CSP)
 *   - metadata-call: a script under scripts/photos/ or scripts/terrain/ calls a
 *                    sharp method that keeps or writes metadata (withMetadata,
 *                    keepMetadata, keepExif, withExif, withExifMerge, keepXmp,
 *                    withXmp)
 *
 * Usage:
 *   node scripts/guards/check-served-images.mjs [--root <dir>]
 *   (Runs from `npm run lint` via `npm run guard:images`)
 *
 * Exit code 1 on any violation; prints `served-images: OK` otherwise.
 */

import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const MAX_LONG_EDGE = 2560;
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tif', '.tiff', '.heic', '.svg']);
const PATHSPECS = [...IMAGE_EXT].map((ext) => `:(icase)*${ext}`);
const SELFTEST_PREFIX = 'scripts/guards/__selftest__/';
const HASHED_DIRS = ['public/terrain/', 'public/images/photos/'];
const HASH_NAME = /^[a-z0-9-]+\.([0-9a-f]{10})\.(png|svg|avif|webp|jpg)$/;
const SCRIPT_DIRS = ['scripts/photos/', 'scripts/terrain/'];
const SCRIPT_EXT = /\.(m|c)?[jt]s$/;
const MANIFESTS = [
  { file: 'data/generated/image-manifest.ts', regex: /(?<=['"])\/images\/photos\/[^'"]+(?=['"])/g },
  { file: 'data/generated/terrain.ts', regex: /(?<=['"])\/terrain\/[^'"]+(?=['"])/g },
];
const METADATA_CALL = /\.\s*(withMetadata|keepMetadata|keepExif|withExif|withExifMerge|keepXmp|withXmp)\s*\(/g;
const METADATA_MARKERS = [
  { label: 'Exif', bytes: Buffer.from('Exif\0\0', 'latin1') },
  { label: 'XMP packet', bytes: Buffer.from('<x:xmpmeta', 'latin1') },
  { label: 'XMP namespace', bytes: Buffer.from('http://ns.adobe.com/xap/1.0/', 'latin1') },
  { label: 'IPTC (Photoshop 3.0)', bytes: Buffer.from('Photoshop 3.0\0', 'latin1') },
  { label: 'raw profile', bytes: Buffer.from('Raw profile type', 'latin1') },
];
const SVG_RULES = [
  { label: 'script element', regex: /<script/i },
  { label: 'event-handler attribute', regex: /\son[a-z]+\s*=/i },
  { label: 'href', regex: /href\s*=/i },
  { label: 'foreignObject', regex: /<foreignObject/i },
];

function usage(message) {
  console.error(`served-images: ${message}`);
  console.error('usage: check-served-images.mjs [--root <dir>]');
  process.exit(1);
}

function parseArgs(argv) {
  let root = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== '--root') usage(`unknown argument ${argv[i]}`);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) usage('--root needs a value');
    root = value;
    i++;
  }
  return root === null ? { root: process.cwd(), fixture: false } : { root: path.resolve(root), fixture: true };
}

const toPosix = (p) => p.split(path.sep).join('/');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

/** Tracked paths (posix, relative to root) matching the pathspecs, via git ls-files -z. */
function gitLsFiles(root, pathspecs) {
  const out = execFileSync('git', ['ls-files', '-z', '--', ...pathspecs], { cwd: root, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
  return out.split('\0').filter(Boolean);
}

/** Image and script paths in scope, relative to root. Throws when git fails (never a silent pass). */
function collect(root, fixture) {
  if (fixture) {
    const all = walk(root).map((full) => toPosix(path.relative(root, full)));
    return {
      images: all.filter((rel) => IMAGE_EXT.has(path.extname(rel).toLowerCase())),
      scripts: all.filter((rel) => SCRIPT_DIRS.some((d) => rel.startsWith(d)) && SCRIPT_EXT.test(rel)),
    };
  }
  const inScope = (rel) => !rel.startsWith(SELFTEST_PREFIX) && fs.existsSync(path.join(root, rel));
  return {
    images: gitLsFiles(root, PATHSPECS).filter(inScope),
    scripts: gitLsFiles(root, SCRIPT_DIRS).filter((rel) => SCRIPT_EXT.test(rel) && inScope(rel)),
  };
}

const isSvg = (rel) => path.extname(rel).toLowerCase() === '.svg';
const underPublic = (rel) => rel.startsWith('public/');
const hashedDir = (rel) => HASHED_DIRS.find((d) => rel.startsWith(d) && !rel.slice(d.length).includes('/'));

/** Metadata, size and orientation rules for one raster file. */
async function checkRaster(rel, bytes, violations) {
  let md;
  try {
    md = await sharp(bytes).metadata();
  } catch (err) {
    violations.push(`${rel} metadata: unreadable by sharp (${err.message})`);
    return;
  }
  const found = [];
  if (md.exif?.length) found.push(`exif ${md.exif.length} B`);
  if (md.xmp?.length) found.push(`xmp ${md.xmp.length} B`);
  if (md.iptc?.length) found.push(`iptc ${md.iptc.length} B`);
  for (const { label, bytes: marker } of METADATA_MARKERS) {
    if (bytes.includes(marker)) found.push(`${label} marker in bytes`);
  }
  if (found.length) violations.push(`${rel} metadata: ${found.join(', ')}`);

  if (!underPublic(rel)) return;
  const longEdge = Math.max(md.width ?? 0, md.height ?? 0);
  if (longEdge > MAX_LONG_EDGE) violations.push(`${rel} oversize: ${md.width}x${md.height}, long edge above ${MAX_LONG_EDGE} px`);
  if (md.orientation !== undefined) violations.push(`${rel} orientation: tag ${md.orientation} (served files must be rotated at build time)`);
}

/** Script, event-handler, href and foreignObject rules for one SVG under public/. */
function checkSvg(rel, bytes, violations) {
  const text = bytes.toString('utf-8');
  for (const { label, regex } of SVG_RULES) {
    const m = text.match(regex);
    if (m) violations.push(`${rel} svg-content: ${label} (${JSON.stringify(m[0].trim())})`);
  }
}

/** Content-hash name rule for one file in a hashed directory. */
function checkHashName(rel, bytes, violations) {
  const name = path.posix.basename(rel);
  const m = name.match(HASH_NAME);
  if (!m) {
    violations.push(`${rel} hash-name: name is not <name>.<10 hex>.<png|svg|avif|webp|jpg>`);
    return;
  }
  const actual = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 10);
  if (m[1] !== actual) violations.push(`${rel} hash-name: name hash ${m[1]} but sha256 of the bytes starts ${actual}`);
}

/** URLs listed by the generated manifests, mapped to public/ paths with the manifest that lists them. */
function manifestEntries(root) {
  const listed = new Map();
  for (const { file, regex } of MANIFESTS) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    for (const url of fs.readFileSync(full, 'utf-8').match(regex) ?? []) {
      listed.set(`public${url}`, file);
    }
  }
  return listed;
}

function checkScript(rel, text, violations) {
  text.split(/\r?\n/).forEach((line, index) => {
    METADATA_CALL.lastIndex = 0;
    for (const m of line.matchAll(METADATA_CALL)) {
      violations.push(`${rel} metadata-call: line ${index + 1} calls .${m[1]}() (keeps or writes image metadata)`);
    }
  });
}

async function main() {
  const { root, fixture } = parseArgs(process.argv.slice(2));
  const violations = [];

  let scope;
  try {
    scope = collect(root, fixture);
  } catch (err) {
    console.log(`. scope: git ls-files failed (${err.message.split('\n')[0]})`);
    console.log('served-images: 1 violations');
    process.exit(1);
  }
  const images = [...scope.images].sort();
  const imageSet = new Set(images);

  for (const rel of images) {
    const bytes = fs.readFileSync(path.join(root, rel));
    if (isSvg(rel)) {
      if (underPublic(rel)) checkSvg(rel, bytes, violations);
    } else {
      await checkRaster(rel, bytes, violations);
    }
    if (hashedDir(rel)) checkHashName(rel, bytes, violations);
  }

  // Orphans and missing files: the two hashed directories versus the generated manifests
  const listed = manifestEntries(root);
  for (const rel of images) {
    if (hashedDir(rel) && !listed.has(rel)) violations.push(`${rel} orphan: not listed in ${MANIFESTS.map((m) => m.file).join(' or ')}`);
  }
  for (const [rel, file] of [...listed].sort(([a], [b]) => a.localeCompare(b))) {
    if (!imageSet.has(rel)) violations.push(`${rel} missing: listed in ${file} but not ${fixture ? 'present' : 'tracked'}`);
  }

  for (const rel of [...scope.scripts].sort()) {
    checkScript(rel, fs.readFileSync(path.join(root, rel), 'utf-8'), violations);
  }

  for (const v of violations) console.log(v);
  console.log(violations.length === 0 ? 'served-images: OK' : `served-images: ${violations.length} violations`);
  process.exit(violations.length === 0 ? 0 : 1);
}

main();
