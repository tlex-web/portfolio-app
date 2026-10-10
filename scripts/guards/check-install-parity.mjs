#!/usr/bin/env node

/**
 * Guard (GUARD-01): install parity between local, CI and Vercel
 *
 * Statically checks the committed config so that every install path uses a
 * lockfile-exact `npm ci` on Node 24, and that pinned tool versions agree
 * with package-lock.json. The live Vercel project setting is not queried;
 * `engines.node` in package.json overrides it.
 *
 * Checks (all paths relative to --root):
 *   1. vercel.json installCommand is exactly "npm ci"
 *   2. .node-version is "24" and package.json engines.node is "24.x"
 *   3. .github/workflows/*.yml: no literal `node-version:` key, every
 *      actions/setup-node use is paired with `node-version-file: .node-version`,
 *      and no run step invokes `npm install` / `npm i` (npx playwright install
 *      is allowed)
 *   4. every mcr.microsoft.com/playwright:vX.Y.Z-noble tag equals the lockfile
 *      version of @playwright/test
 *   5. scripts/guards/version-floors.json: each floored package's lockfile
 *      version is >= its floor, and no `forbiddenDirect` package is a direct
 *      dependency
 *
 * Usage:
 *   node scripts/guards/check-install-parity.mjs [--root <dir>]
 *   (Runs from `npm run lint` via `npm run guard:parity`)
 *
 * Exit code 1 on any failure (one line per failure), 0 with "parity: OK".
 */

import fs from 'fs';
import path from 'path';

const REQUIRED_NODE_MAJOR = '24';
const REQUIRED_ENGINES = '24.x';
const REQUIRED_INSTALL = 'npm ci';
const NODE_VERSION_FILE = '.node-version';

function parseArgs(argv) {
  const args = { root: process.cwd() };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') {
      const value = argv[i + 1];
      if (!value) {
        console.error('parity: --root needs a directory');
        process.exit(1);
      }
      args.root = path.resolve(value);
      i++;
    } else {
      console.error(`parity: unknown argument ${argv[i]}`);
      process.exit(1);
    }
  }
  return args;
}

const { root } = parseArgs(process.argv.slice(2));
const failures = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);

function readText(rel) {
  try {
    return fs.readFileSync(path.join(root, rel), 'utf-8');
  } catch {
    fail(rel, 'cannot be read');
    return null;
  }
}

function readJson(rel) {
  const text = readText(rel);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    fail(rel, `is not valid JSON (${err.message})`);
    return null;
  }
}

/** Numeric x.y.z compare; a prerelease/build suffix is ignored. */
function parseVersion(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(v).trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Returns the shell text of every `run:` step in a workflow, including
 * block scalars (`run: |` / `run: >`). Comment lines are dropped.
 */
function extractRunCommands(lines) {
  const commands = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(\s*)(?:-\s+)?run:\s*(.*)$/.exec(lines[i]);
    if (!m) continue;
    const keyIndent = m[1].length;
    const value = m[2].trim();
    if (/^[|>][+-]?\d*$/.test(value)) {
      const block = [];
      for (let j = i + 1; j < lines.length; j++) {
        const line = lines[j];
        if (line.trim() === '') continue;
        const indent = line.length - line.trimStart().length;
        if (indent <= keyIndent) break;
        block.push(line.trim());
      }
      commands.push(block.join('\n'));
    } else {
      commands.push(value.replace(/^(['"])(.*)\1$/, '$2'));
    }
  }
  return commands;
}

const NPM_INSTALL = /(^|[\s;&|(])npm\s+(install|i|add)(\s|$)/m;

// 1. Vercel install command
const vercel = readJson('vercel.json');
if (vercel && vercel.installCommand !== REQUIRED_INSTALL) {
  fail('vercel.json', `installCommand is ${JSON.stringify(vercel.installCommand)}, expected "${REQUIRED_INSTALL}"`);
}

// 2. Node version pins
const nodeVersion = readText(NODE_VERSION_FILE);
if (nodeVersion !== null && nodeVersion.trim() !== REQUIRED_NODE_MAJOR) {
  fail(NODE_VERSION_FILE, `contains "${nodeVersion.trim()}", expected "${REQUIRED_NODE_MAJOR}"`);
}
const pkg = readJson('package.json');
if (pkg && pkg.engines?.node !== REQUIRED_ENGINES) {
  fail('package.json', `engines.node is ${JSON.stringify(pkg.engines?.node)}, expected "${REQUIRED_ENGINES}"`);
}

// Lockfile (used by checks 4 and 5)
const lock = readJson('package-lock.json');
const lockVersion = (name) => lock?.packages?.[`node_modules/${name}`]?.version ?? null;

// 3 + 4. Workflows
const workflowDir = path.join('.github', 'workflows');
let workflowFiles = [];
try {
  workflowFiles = fs
    .readdirSync(path.join(root, workflowDir))
    .filter((f) => /\.ya?ml$/.test(f))
    .sort();
} catch {
  fail(workflowDir, 'cannot be read');
}
if (workflowFiles.length === 0 && failures.every((f) => !f.startsWith(workflowDir))) {
  fail(workflowDir, 'contains no workflow files');
}

// The Playwright container tag must match the exact lockfile entry
const playwrightLock = lock?.packages?.['node_modules/@playwright/test']?.version ?? null;
for (const file of workflowFiles) {
  const rel = path.join(workflowDir, file).split(path.sep).join('/');
  const text = readText(rel);
  if (text === null) continue;
  const lines = text.split(/\r?\n/).filter((line) => !/^\s*#/.test(line));

  let setupNodeUses = 0;
  let nodeVersionFileLines = 0;
  lines.forEach((line) => {
    if (/uses:\s*['"]?actions\/setup-node@/.test(line)) setupNodeUses++;
    const nv = /^\s*node-version:\s*(.*)$/.exec(line);
    if (nv) fail(rel, `literal "node-version: ${nv[1].trim()}" found; use "node-version-file: ${NODE_VERSION_FILE}"`);
    const nvf = /^\s*node-version-file:\s*['"]?([^'"\s]+)['"]?\s*$/.exec(line);
    if (nvf) {
      if (nvf[1] === NODE_VERSION_FILE) nodeVersionFileLines++;
      else fail(rel, `node-version-file points at "${nvf[1]}", expected "${NODE_VERSION_FILE}"`);
    }
  });
  if (setupNodeUses !== nodeVersionFileLines) {
    fail(rel, `${setupNodeUses} actions/setup-node use(s) but ${nodeVersionFileLines} "node-version-file: ${NODE_VERSION_FILE}" line(s)`);
  }

  for (const cmd of extractRunCommands(lines)) {
    for (const cmdLine of cmd.split('\n')) {
      if (NPM_INSTALL.test(cmdLine)) {
        fail(rel, `run step uses npm install instead of npm ci: ${cmdLine}`);
      }
    }
  }

  for (const m of lines.join('\n').matchAll(/mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-noble/g)) {
    if (!playwrightLock) {
      fail(rel, `Playwright image v${m[1]} but package-lock.json has no @playwright/test`);
    } else if (m[1] !== playwrightLock) {
      fail(rel, `Playwright image v${m[1]}-noble does not match lockfile @playwright/test ${playwrightLock}`);
    }
  }
}

// 5. Version floors and forbidden direct dependencies
const floorsRel = 'scripts/guards/version-floors.json';
const floorsFile = readJson(floorsRel);
if (floorsFile) {
  const { floors, forbiddenDirect } = floorsFile;
  if (!floors || typeof floors !== 'object' || Array.isArray(floors) || !Array.isArray(forbiddenDirect)) {
    fail(floorsRel, 'expected shape { "floors": { "<pkg>": "x.y.z" }, "forbiddenDirect": ["<pkg>"] }');
  } else {
    for (const [name, floor] of Object.entries(floors)) {
      const floorV = parseVersion(floor);
      if (!floorV) {
        fail(floorsRel, `floor for ${name} is not x.y.z: ${JSON.stringify(floor)}`);
        continue;
      }
      const actual = lockVersion(name);
      const actualV = actual && parseVersion(actual);
      if (!actualV) {
        fail('package-lock.json', `${name} is missing or has no x.y.z version (floor ${floor})`);
      } else if (compareVersions(actualV, floorV) < 0) {
        fail('package-lock.json', `${name} ${actual} is below the floor ${floor}`);
      }
    }
    const direct = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
    for (const name of forbiddenDirect) {
      if (Object.hasOwn(direct, name)) {
        fail('package.json', `${name} is a forbidden direct dependency`);
      }
    }
  }
}

if (failures.length > 0) {
  for (const f of failures) console.error(`parity: FAIL ${f}`);
  console.error(`parity: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('parity: OK');
