#!/usr/bin/env node

/**
 * Guard (GUARD-03): test-count ratchet
 *
 * The number of tests may only go up. Tests are counted with the runners'
 * own listings, never a regex:
 *   - Jest: `numTotalTests` from `jest --json` output
 *   - Playwright: `playwright test --list --reporter=json`, counted as the
 *     number of unique `file + title path` keys, so a spec that runs in N
 *     projects counts once
 *
 * Fails (exit 1, one line per failure) when:
 *   - jest + e2e < baseline total ("rewrite tests, never delete")
 *   - Jest reports any skipped (pending) or todo test
 *   - any source file under <root>/e2e/ or under a __tests__ directory in
 *     <root>/{app,components,lib,data} calls .only( / .skip( / .fixme(
 *
 * --update records the current counts as the new baseline, but only when
 * every check passes, so the baseline can never be lowered. If no baseline
 * file exists yet, --update creates it.
 *
 * Usage:
 *   node scripts/guards/test-count.mjs --jest jest-results.json
 *     [--list <playwright-list.json>] [--baseline <file>] [--root <dir>] [--update]
 *   (CI unit job: `npm run guard:tests` after `jest --json --outputFile=jest-results.json`)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DEFAULT_BASELINE = fileURLToPath(new URL('./test-count.baseline.json', import.meta.url));
const FOCUS_OR_SKIP = /\.(only|skip|fixme)\(/;
const SOURCE_FILE = /\.[cm]?[jt]sx?$/;
const UNIT_TEST_ROOTS = ['app', 'components', 'lib', 'data'];

function usage(message) {
  console.error(`test-count: ${message}`);
  console.error(
    'usage: test-count.mjs --jest <file> [--list <file>] [--baseline <file>] [--root <dir>] [--update]',
  );
  process.exit(1);
}

function parseArgs(argv) {
  const args = { jest: null, list: null, baseline: DEFAULT_BASELINE, root: process.cwd(), update: false };
  const valued = { '--jest': 'jest', '--list': 'list', '--baseline': 'baseline', '--root': 'root' };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--update') {
      args.update = true;
    } else if (valued[flag]) {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) usage(`${flag} needs a value`);
      args[valued[flag]] = path.resolve(value);
      i++;
    } else {
      usage(`unknown argument ${flag}`);
    }
  }
  if (!args.jest) usage('--jest <file> is required');
  return args;
}

function readJson(file, label) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    console.error(`test-count: cannot read ${label} ${file} (${err.message})`);
    process.exit(1);
  }
}

function loadPlaywrightList(args) {
  if (args.list) return readJson(args.list, 'Playwright list');
  try {
    const stdout = execSync('npx playwright test --list --reporter=json', {
      cwd: args.root,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(stdout);
  } catch (err) {
    const detail = (err.stderr || err.stdout || err.message || '').toString().trim().split('\n')[0];
    console.error(`test-count: \`playwright test --list\` failed: ${detail}`);
    process.exit(1);
  }
}

/** Unique `file::suite > ... > title` keys across every project in the list. */
function uniquePlaywrightTests(list) {
  const keys = new Set();
  (function walk(suite, titles) {
    for (const child of suite.suites ?? []) walk(child, [...titles, child.title]);
    for (const spec of suite.specs ?? []) {
      keys.add(`${spec.file}::${[...titles, spec.title].join(' > ')}`);
    }
  })(list, []);
  return keys.size;
}

function listSourceFiles(dir, inTestDir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listSourceFiles(full, inTestDir || entry.name === '__tests__', out);
    } else if (inTestDir && SOURCE_FILE.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function findFocusedOrSkipped(root) {
  const files = listSourceFiles(path.join(root, 'e2e'), true, []);
  for (const dir of UNIT_TEST_ROOTS) listSourceFiles(path.join(root, dir), false, files);
  const hits = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
    lines.forEach((line, i) => {
      const m = FOCUS_OR_SKIP.exec(line);
      if (m) {
        const rel = path.relative(root, file).split(path.sep).join('/');
        hits.push(`${rel}:${i + 1}: focused/skipped call ".${m[1]}(" (tests are rewritten, never skipped)`);
      }
    });
  }
  return hits;
}

const args = parseArgs(process.argv.slice(2));
const failures = [];

const jest = readJson(args.jest, 'Jest results');
if (typeof jest.numTotalTests !== 'number') {
  usage(`${args.jest} has no numeric numTotalTests (is it \`jest --json\` output?)`);
}
const list = loadPlaywrightList(args);
for (const err of list.errors ?? []) {
  failures.push(`Playwright could not load a spec: ${String(err.message ?? err).split('\n')[0]}`);
}

const now = { jest: jest.numTotalTests, e2e: uniquePlaywrightTests(list) };
now.total = now.jest + now.e2e;

const baseline = fs.existsSync(args.baseline) ? readJson(args.baseline, 'baseline') : null;
if (baseline && typeof baseline.total !== 'number') {
  usage(`${args.baseline} has no numeric total`);
}

console.log(
  `test-count: jest ${now.jest} + e2e ${now.e2e} = ${now.total} (baseline ${baseline ? baseline.total : 'none'})`,
);

if (!baseline && !args.update) {
  failures.push(`no baseline at ${args.baseline}; record one with --update`);
}
if (baseline && now.total < baseline.total) {
  failures.push(
    `test count ${now.total} is below the baseline ${baseline.total} (rewrite tests, never delete)`,
  );
}
if ((jest.numPendingTests ?? 0) > 0) {
  failures.push(`${jest.numPendingTests} skipped Jest test(s); tests are rewritten, never skipped`);
}
if ((jest.numTodoTests ?? 0) > 0) {
  failures.push(`${jest.numTodoTests} todo Jest test(s)`);
}
failures.push(...findFocusedOrSkipped(args.root));

if (failures.length > 0) {
  for (const f of failures) console.error(`test-count: FAIL ${f}`);
  if (args.update) console.error('test-count: baseline NOT updated');
  process.exit(1);
}

if (args.update) {
  let commit = null;
  try {
    commit = execSync('git rev-parse HEAD', { cwd: args.root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    commit = null;
  }
  const record = { ...now, recordedAt: new Date().toISOString().slice(0, 10), commit };
  fs.writeFileSync(args.baseline, JSON.stringify(record, null, 2) + '\n', 'utf-8');
  console.log(`test-count: baseline written to ${path.relative(process.cwd(), args.baseline) || args.baseline}`);
}
console.log('test-count: OK');
