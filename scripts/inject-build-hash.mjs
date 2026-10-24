#!/usr/bin/env node

/**
 * Post-build script: inject the Next.js BUILD_ID and the precache URLs into
 * the service worker.
 *
 * 1. Reads .next/BUILD_ID (created by `next build`) and replaces every
 *    __BUILD_HASH__ in public/service-worker.js, so cache names change on
 *    every deployment.
 * 2. Reads data/generated/precache.json (written by
 *    scripts/terrain/build-terrain.mjs) and replaces the exact token
 *    `/*__PRECACHE_URLS__*\/[]` with the JSON array, so the service worker
 *    precaches the content-hashed footer strip (SHELL-04: /offline keeps its
 *    band).
 *
 * The URLs end up inside executable service-worker code (T-08-17), so only a
 * JSON array of content-hashed same-origin /terrain/ paths is accepted, and it
 * is serialised with JSON.stringify.
 *
 * The committed service worker keeps both placeholders. A missing precache
 * token means the file was already injected by an earlier build: restore it
 * with `git checkout -- public/service-worker.js` and build again.
 *
 * Usage:
 *   node scripts/inject-build-hash.mjs
 *   (Runs automatically via npm postbuild)
 */

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const buildIdPath = path.join(root, '.next', 'BUILD_ID');
const swPath = path.join(root, 'public', 'service-worker.js');
const precachePath = path.join(root, 'data', 'generated', 'precache.json');

const PRECACHE_TOKEN = '/*__PRECACHE_URLS__*/[]';
/** A content-hashed terrain asset: /terrain/<name>.<10 hex>.<ext>. */
const PRECACHE_URL = /^\/terrain\/[a-z0-9-]+\.[0-9a-f]{10}\.(svg|png|avif|webp)$/;

// Read BUILD_ID
let buildId;
try {
  buildId = fs.readFileSync(buildIdPath, 'utf-8').trim();
} catch {
  console.error(
    'Could not read .next/BUILD_ID — has `next build` run first?'
  );
  process.exit(0);
}

// Read service worker template
let sw;
try {
  sw = fs.readFileSync(swPath, 'utf-8');
} catch {
  console.error('Could not read public/service-worker.js');
  process.exit(1);
}

// Read and validate the precache list
let urls;
try {
  urls = JSON.parse(fs.readFileSync(precachePath, 'utf-8'));
} catch (e) {
  console.error(
    `Could not read data/generated/precache.json (${e && e.message ? e.message : e}); run npm run terrain:build`
  );
  process.exit(1);
}
if (
  !Array.isArray(urls) ||
  !urls.every((u) => typeof u === 'string' && u.startsWith('/terrain/'))
) {
  console.error(
    'data/generated/precache.json must be a JSON array of strings starting with /terrain/'
  );
  process.exit(1);
}
const bad = urls.filter((u) => !PRECACHE_URL.test(u));
if (bad.length > 0) {
  console.error(
    `data/generated/precache.json has URLs that are not content-hashed /terrain/ assets: ${bad.join(', ')}`
  );
  process.exit(1);
}

if (!sw.includes(PRECACHE_TOKEN)) {
  console.error(
    `public/service-worker.js has no ${PRECACHE_TOKEN} placeholder (already injected by an earlier build?); restore it with git checkout -- public/service-worker.js`
  );
  process.exit(1);
}

// Replace the placeholders. A function replacement keeps `$` in the JSON literal.
const updated = sw
  .replaceAll('__BUILD_HASH__', buildId)
  .replace(PRECACHE_TOKEN, () => JSON.stringify(urls));

fs.writeFileSync(swPath, updated, 'utf-8');

console.log(`Injected build hash ${buildId} into service worker`);
console.log(`Injected ${urls.length} precache URL(s) into service worker`);
