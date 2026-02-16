#!/usr/bin/env node

/**
 * Post-build script: Inject Next.js BUILD_ID into service worker
 *
 * Reads .next/BUILD_ID (created by `next build`) and replaces all
 * occurrences of __BUILD_HASH__ in public/service-worker.js with the
 * actual build ID. This ensures cache names change on every deployment.
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

// Replace placeholder with actual build hash
const updated = sw.replaceAll('__BUILD_HASH__', buildId);

fs.writeFileSync(swPath, updated, 'utf-8');

console.log(`Injected build hash ${buildId} into service worker`);
