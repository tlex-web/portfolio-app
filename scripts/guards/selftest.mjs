#!/usr/bin/env node

/**
 * Guard self-test: proves every guard in scripts/guards/ can fail
 *
 * Each case spawns `node <guard> ...args` against a fixture under
 * scripts/guards/__selftest__/ and compares the exit code (and, where
 * given, required output fragments) with what the case expects. A guard
 * that cannot fail on a bad fixture is not a guard.
 *
 * Case shape: { name, guard, args, expectExit, expectOutput?, input?, cwd?, nodeArgs?, setup?, check? }
 *   or { name, fn } for pure helpers (fn returns an error string or null; no spawn)
 *   - input: optional, piped to the guard's stdin
 *   - nodeArgs: optional, node flags placed before the guard path
 *   - cwd: optional, working directory of the spawn (defaults to this process's cwd)
 *   - setup(): optional, runs before the spawn and may return extra args
 *   - check(): optional, runs after the spawn; returns an error string or null
 *
 * Usage:
 *   node scripts/guards/selftest.mjs
 *   (Runs from `npm run lint` via `npm run guard:selftest`)
 *
 * Exit code 1 if any case's result differs from its expectation.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import sharp from 'sharp';
import { evaluate, pickRun } from '../ci/check-visual-run.mjs';
import { evaluateSnapshotChanges } from '../ci/check-snapshot-commit.mjs';
import { DOCS_ONLY_FILES, classify } from '../ci/classify-changes.mjs';
import { checkMp4 } from './lib/mp4-boxes.mjs';
import { LEGACY_DEAD_FILES, assertNoImporters, isLegacyDeadFile } from './lib/legacy-dead-files.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const fixtures = path.join(here, '__selftest__');
const PARITY = path.join(here, 'check-install-parity.mjs');
const TEST_COUNT = path.join(here, 'test-count.mjs');
const ESLINT = path.join(repoRoot, 'node_modules', 'eslint', 'bin', 'eslint.js');
const SAME_CLASSNAMES = path.join(here, 'same-classnames.mjs');
const SNAPSHOT_COMMIT = path.join(repoRoot, 'scripts', 'ci', 'check-snapshot-commit.mjs');
const PALETTE = path.join(here, 'check-palette.mjs');
const CONTRAST = path.join(here, 'check-contrast.mjs');
const IDENTITY = path.join(here, 'check-identity.mjs');
const SERVED = path.join(here, 'check-served-images.mjs');
const CI_GATE = path.join(here, 'check-ci-gate.mjs');
const cig = (name) => path.join(fixtures, 'ci-gate', name);
const con = (name) => path.join(fixtures, 'contrast', name);
const idf = (name) => path.join(fixtures, 'identity', name);
const si = (name) => path.join(fixtures, 'served-images', name);
/** The clean 0.2 s fixture clip (see served-images/good-mp4/README.md). */
const goodMp4 = () => fs.readFileSync(path.join(si('good-mp4'), 'public', 'media', 'coin-flip-toss.d423c62633.mp4'));
const tc = (...parts) => path.join(fixtures, 'test-count', ...parts);
const pal = (...parts) => path.join(fixtures, 'palette', ...parts);
const sc = (...parts) => path.join(fixtures, 'same-classnames', ...parts);
const tap = process.argv.includes('--tap');

// scripts/ci/ci-ok.jq: the CI OK verdict over toJSON(needs) (GUARD-07, GUARD-08)
const CI_OK_JQ = path.join(repoRoot, 'scripts', 'ci', 'ci-ok.jq');
const CI_JOBS = ['lint-and-typecheck', 'unit-tests', 'e2e-tests', 'visual-regression', 'build', 'dependency-review', 'security-audit'];
/** The jobs a docs-only diff skips (D-08); dependency-review is not one of them. */
const HEAVY_JOBS = CI_JOBS.filter((id) => id !== 'dependency-review');
/**
 * A `needs` object for ci.yml: the `changes` job (result "success", output
 * docs_only `docsOnly`; null gives it no outputs, as a failed job has) plus
 * the seven jobs, every result "success" unless overridden. An override
 * `changes: null` leaves the `changes` entry out.
 */
const needsOf = (overrides = {}, docsOnly = 'false') => {
  const needs = {};
  if (overrides.changes !== null) {
    needs.changes = { result: overrides.changes ?? 'success', outputs: docsOnly === null ? {} : { docs_only: docsOnly } };
  }
  for (const id of CI_JOBS) needs[id] = { result: overrides[id] ?? 'success', outputs: {} };
  return needs;
};
/** Every heavy job with the same result, for spreading into needsOf overrides. */
const allHeavy = (result) => Object.fromEntries(HEAVY_JOBS.map((id) => [id, result]));
/** Runs `jq -e --arg event <event> -f ci-ok.jq` on `needs`; null when the exit status is `expectExit`. */
function ciOkCase(event, needs, expectExit) {
  const r = spawnSync('jq', ['-e', '--arg', 'event', event, '-f', CI_OK_JQ], {
    encoding: 'utf-8',
    input: JSON.stringify(needs),
  });
  if (r.error) return `jq could not run (${r.error.code ?? r.error.message}); install jq 1.6+ for the CI OK cases`;
  if (r.status === expectExit) return null;
  return `jq exited ${r.status}, expected ${expectExit} (stdout ${JSON.stringify(r.stdout.trim())}, stderr ${JSON.stringify(r.stderr.trim())})`;
}

// check-visual-run.mjs: CI API responses captured as fixtures (no network here)
const vr = (name) => JSON.parse(fs.readFileSync(path.join(fixtures, 'visual-run', name), 'utf-8'));
const VISUAL_JOB = { workflow: 'CI', job: 'Visual Regression' };
const runs = vr('runs.json').workflow_runs;
const runsCompleted = runs.map((r) => (r.id === 102 ? { ...r, status: 'completed', conclusion: 'success' } : r));
/** Returns null when `actual` equals `expected`, else an error string. */
const expectEqual = (label, actual, expected) =>
  actual === expected ? null : `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;

// check-contrast.mjs on a real stylesheet (07 IN-06): the table order and each pair
// against its own threshold, never pinned ratios, so retuning a token that still
// passes cannot break lint. Exact ratios stay in the fixture cases.
const CONTRAST_SURFACES = ['surface', 'surface-raised', 'surface-overlay'];
const contrastPairs = (fgs, bgs) => fgs.flatMap((fg) => bgs.map((bg) => `${fg}/${bg}`));
/** The GUARD-05 pair labels in table order (07-, 08-, 10- and 11-UI-SPEC "Color"). */
const CONTRAST_ORDER = [
  ...contrastPairs(['ink', 'ink-muted'], [...CONTRAST_SURFACES, 'gallery']),
  ...contrastPairs(['accent', 'danger', 'caution', 'success'], CONTRAST_SURFACES),
  ...contrastPairs(['ink-inverse'], ['accent', 'accent-hover']),
  ...contrastPairs(['focus', 'line-strong'], CONTRAST_SURFACES),
  ...contrastPairs(['ink-inverse'], ['accent-strong']),
  ...contrastPairs(['accent-strong'], CONTRAST_SURFACES),
  ...contrastPairs(['accent'], ['gallery']),
  ...contrastPairs(['gallery'], ['ink']),
  ...contrastPairs(['focus', 'line-strong'], ['gallery']),
  ...contrastPairs(['ink-inverse'], ['ink']),
  ...contrastPairs(['trail-mountain', 'trail-alpine'], ['trail-blaze']),
  ...contrastPairs(['trail-mountain', 'trail-alpine'], CONTRAST_SURFACES),
  ...contrastPairs(['trail-blaze', 'trail-yellow'], ['surface-raised']),
];
// The table prints ratios to 2 dp; the guard compares raw floats, so a pair that
// passes at 4.4996 prints 4.50. Half a display step absorbs that rounding.
const CONTRAST_TOLERANCE = 0.005;
/** Runs the contrast guard on `css`; returns null when it passes every pair in table order, else an error string. */
function contrastTableCheck(css) {
  const result = spawnSync(process.execPath, [CONTRAST, '--css', css], { encoding: 'utf-8' });
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`.replace(/\r\n/g, '\n');
  const problems = [];
  if (result.status !== 0) problems.push(`expected exit 0, got ${result.status}`);
  if (!out.includes(`contrast: OK (${CONTRAST_ORDER.length} pairs)`)) problems.push(`output lacks: contrast: OK (${CONTRAST_ORDER.length} pairs)`);
  const rows = [...out.matchAll(/^(\S+\/\S+) (\S+) (\S+) (PASS|FAIL)$/gm)].map(([, label, ratio, min, verdict]) => ({ label, ratio: Number(ratio), min: Number(min), verdict }));
  const order = rows.map((r) => r.label).join(', ');
  if (order !== CONTRAST_ORDER.join(', ')) problems.push(`table order differs: got ${order}`);
  for (const r of rows) {
    if (r.verdict !== 'PASS' || !(r.ratio >= r.min - CONTRAST_TOLERANCE)) problems.push(`${r.label} ${r.ratio} is below ${r.min}:1 (${r.verdict})`);
  }
  return problems.length === 0 ? null : problems.join('; ');
}

// scripts/ci/classify-changes.mjs: the docs-only verdict of the `changes` job (D-08, D-09)
const CLASSIFY = path.join(repoRoot, 'scripts', 'ci', 'classify-changes.mjs');
/** classify(paths, opts).docsOnly must equal `expected` and come with a non-empty reason. */
function classifyCase(paths, opts, expected) {
  const result = classify(paths, opts);
  const label = `classify(${JSON.stringify(paths)}${opts ? `, ${JSON.stringify(opts)}` : ''})`;
  if (typeof result?.reason !== 'string' || result.reason === '') return `${label} gave no reason: ${JSON.stringify(result)}`;
  return expectEqual(`${label}.docsOnly`, result.docsOnly, expected);
}

// check-snapshot-commit.mjs: in-memory `git show --name-status` entries
const SNAP = 'e2e/visual/routes.spec.ts-snapshots';
const snap = (status, rel) => ({ status, path: `${SNAP}/${rel}` });
/** Runs the rule check and compares ok plus the required violation fragments. */
function snapshotCase(entries, opts, expectOk, fragments = []) {
  const result = evaluateSnapshotChanges(entries, opts);
  const problems = [];
  if (result.ok !== expectOk) problems.push(`expected ok=${expectOk}, got ok=${result.ok}`);
  for (const fragment of fragments) {
    if (!result.violations.some((v) => v.includes(fragment))) problems.push(`no violation mentions: ${fragment}`);
  }
  return problems.length ? `${problems.join('; ')} (violations: ${JSON.stringify(result.violations)})` : null;
}

/** Copies a fixture baseline into a fresh temp dir so --update cases never touch the fixture. */
function tempBaseline(fixtureName) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const file = path.join(dir, 'baseline.json');
  fs.copyFileSync(tc(fixtureName), file);
  return file;
}
let lowerUpdateBaseline = null;
let raiseUpdateBaseline = null;

/** Copies a palette fixture ratchet into a fresh temp dir so --update cases never touch the fixture. */
function tempRatchet(fixtureName) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const file = path.join(dir, 'palette-ratchet.json');
  fs.copyFileSync(pal(fixtureName, 'palette-ratchet.json'), file);
  return file;
}
let raisePaletteRatchet = null;
let lowerPaletteRatchet = null;

/**
 * Copies the bad-png-untracked fixture (only an e2e/.gitkeep is committed) into a
 * fresh temp git work tree, with the repo's visual-baseline ignore rule and a
 * git-ignored local Playwright PNG, as a local visual run leaves them (07 WR-03).
 * `stray` adds an untracked PNG that no rule ignores. Nothing is committed in the
 * temp repo, so both PNGs are untracked. Nested one level down so the cleanup
 * loop's path.dirname removes the mkdtemp directory.
 */
function tempPngRoot({ stray }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  fs.cpSync(pal('bad-png-untracked'), root, { recursive: true });
  const init = spawnSync('git', ['init', '-q'], { cwd: root, encoding: 'utf-8' });
  if (init.status !== 0) throw new Error(`selftest: git init failed in ${root}: ${init.stderr}`);
  fs.writeFileSync(path.join(root, '.gitignore'), 'e2e/**/*-win32.png\n');
  fs.mkdirSync(path.join(root, 'e2e', 'visual'), { recursive: true });
  fs.writeFileSync(path.join(root, 'e2e', 'visual', 'home-visual-dark-win32.png'), '');
  if (stray) fs.writeFileSync(path.join(root, 'e2e', 'stray.png'), '');
  return root;
}
let pngIgnoredRoot = null;
let pngStrayRoot = null;

/**
 * Copies a parity fixture into a fresh temp dir and restores its real manifest
 * names. The fixtures are stored under other names because GitHub's dependency
 * graph scans every manifest in the repository, and the guard reads the real
 * names through --root. Nested one level down so the cleanup loop's
 * path.dirname removes the mkdtemp directory.
 */
function tempParityRoot(fixtureName) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  fs.cpSync(path.join(fixtures, 'parity', fixtureName), root, { recursive: true });
  fs.renameSync(path.join(root, 'package.fixture.json'), path.join(root, 'package.json'));
  fs.renameSync(path.join(root, 'package-lock.fixture.json'), path.join(root, 'package-lock.json'));
  return root;
}
let parityGoodRoot = null;
let parityBadRoot = null;
let parityNestedFloorRoot = null;
let parityUnflooredLineRoot = null;

/**
 * Copies the ci-gate good fixture into a fresh temp dir and rewrites one of its
 * workflows (ci.yml unless `file` names another) with `edit(text)`. Nested one
 * level down so the cleanup loop's path.dirname removes the mkdtemp directory.
 */
function tempCiGateRoot(edit, file = 'ci.yml') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  fs.cpSync(cig('good'), root, { recursive: true });
  const workflow = path.join(root, '.github', 'workflows', file);
  const before = fs.readFileSync(workflow, 'utf-8');
  const after = edit(before);
  if (after === before) throw new Error('tempCiGateRoot: the edit changed nothing');
  fs.writeFileSync(workflow, after);
  return root;
}
let ciGateRenamedRoot = null;
let ciGateRelayLiteralRoot = null;
let ciGateRelayNoNeedsRoot = null;
let ciGateRelayPrCheckoutRoot = null;
let ciGateRelayTopPermsRoot = null;
let ciGateRelayWriteScopeRoot = null;
let ciGateNoChangesNeedRoot = null;
let ciGateUnconditionedRoot = null;
let ciGatePathsIgnoreRoot = null;

// scripts/photos/: characterization of the photo scripts through --root (VERIFY-06, 10-VALIDATION G5/G6)
const PHOTO_DATA = path.join(repoRoot, 'scripts', 'photos', 'build-photo-data.mjs');
/** The flag the npm photo scripts pass: the .ts schema imports otherwise warn on stderr. */
const PHOTO_NODE_ARGS = ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON'];
/** Every input build-photo-data.mjs reads (sidecar, corrections, DEM source) and the output --check compares. */
const PHOTO_DATA_INPUTS = [
  'data/photos/exif-sidecar.json',
  'data/photos/corrections.json',
  'data/terrain/source/source.json',
  'data/terrain/source/dem-10m.png',
  'data/generated/photos.ts',
];
/**
 * Copies the photo data build's inputs into a fresh temp root. `edit`, when
 * given, receives the parsed { sidecar, corrections } JSON and mutates it in
 * place; the result is written back and must differ from the original. Nested
 * one level down so the cleanup loop's path.dirname removes the mkdtemp directory.
 */
function tempPhotoDataRoot(edit) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  for (const rel of PHOTO_DATA_INPUTS) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, rel), path.join(root, rel));
  }
  if (edit) {
    const files = { sidecar: PHOTO_DATA_INPUTS[0], corrections: PHOTO_DATA_INPUTS[1] };
    const before = Object.fromEntries(Object.entries(files).map(([k, rel]) => [k, fs.readFileSync(path.join(root, rel), 'utf-8')]));
    const data = Object.fromEntries(Object.entries(before).map(([k, text]) => [k, JSON.parse(text)]));
    edit(data);
    let changed = false;
    for (const [k, rel] of Object.entries(files)) {
      const after = `${JSON.stringify(data[k], null, 2)}\n`;
      if (JSON.stringify(JSON.parse(before[k])) !== JSON.stringify(data[k])) changed = true;
      fs.writeFileSync(path.join(root, rel), after);
    }
    if (!changed) throw new Error('tempPhotoDataRoot: the edit changed nothing');
  }
  return root;
}
/** The sidecar entry `id`, or a throw (a fixture edit must never miss silently). */
const sidecarEntry = (sidecar, id) => {
  const entry = sidecar.photos.find((p) => p.id === id);
  if (!entry) throw new Error(`selftest: ${id} is not in the sidecar`);
  return entry;
};
let photoDataControlRoot = null;
let photoDataOffsetRoot = null;
let photoDataGpsRoot = null;
let photoDataOffPlateRoot = null;

/**
 * Runs git in a temp fixture repo with a fixed identity (no global config needed)
 * and throws on failure, so a broken fixture never reads as a guard result.
 */
const GIT_FIXTURE_CONFIG = ['-c', 'user.name=selftest', '-c', 'user.email=selftest@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false'];
function gitIn(root, ...args) {
  const r = spawnSync('git', [...GIT_FIXTURE_CONFIG, ...args], { cwd: root, encoding: 'utf-8' });
  if (r.status !== 0) throw new Error(`selftest: git ${args.join(' ')} failed in ${root}: ${r.stderr}`);
  return r.stdout;
}
/** Writes { rel: text } into root, creating directories. */
function putFiles(root, files) {
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
}

/**
 * 07 WR-04 fixture: a temp git repo with app/card.tsx committed, then `edit(root)`
 * applied to the work tree (same-classnames compares HEAD with the work tree).
 * Nested one level down so the cleanup loop's path.dirname removes the mkdtemp
 * directory.
 */
const CARD_TSX = [
  'export function Card({ title }: { title: string }) {',
  '  return (',
  '    <section className="flex flex-col gap-4 p-6">',
  '      <h2 className="text-xl font-semibold">{title}</h2>',
  '      <p className={`text-sm ${title ? "text-ink" : "text-dim"}`}>Body copy for the card.</p>',
  '      <footer className="mt-auto border-t pt-4">Footer</footer>',
  '    </section>',
  '  );',
  '}',
  '',
].join('\n');
function tempClassnamesRepo(edit) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  fs.mkdirSync(root);
  gitIn(root, 'init', '-q');
  putFiles(root, { 'app/card.tsx': CARD_TSX });
  gitIn(root, 'add', '-A');
  gitIn(root, 'commit', '-q', '-m', 'base');
  edit(root);
  return root;
}
const classnamesMovedRoot = tempClassnamesRepo((root) => {
  fs.mkdirSync(path.join(root, 'app', '(site)'));
  gitIn(root, 'mv', 'app/card.tsx', 'app/(site)/card.tsx');
});
const classnamesMovedChangedRoot = tempClassnamesRepo((root) => {
  fs.mkdirSync(path.join(root, 'app', '(site)'));
  gitIn(root, 'mv', 'app/card.tsx', 'app/(site)/card.tsx');
  putFiles(root, { 'app/(site)/card.tsx': CARD_TSX.replace('gap-4 p-6', 'gap-4 p-8') });
});
const classnamesUnchangedRoot = tempClassnamesRepo(() => {});

// 07 IN-07: the git-reading layer of check-snapshot-commit, read through the module
// namespace so a missing export fails its case instead of the whole selftest load.
const snapshotCommitModule = await import('../ci/check-snapshot-commit.mjs');

/**
 * 07 IN-07 fixture: a temp git repo with two --no-ff merge commits.
 * - tag merge-png: the merged branch added a Linux PNG under contact/.
 * - tag merge-text: the merged branch changed only e2e/visual/routes.spec.ts,
 *   while the first-parent branch added a PNG under photos/ before the merge.
 *   Diffed against the first parent the merge changes no PNG; diffed against
 *   the second parent it would show the photos/ PNG.
 * Nested one level down so the cleanup loop's path.dirname removes the mkdtemp
 * directory.
 */
function tempMergeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  fs.mkdirSync(root);
  gitIn(root, 'init', '-q', '-b', 'main');
  const commit = (files, message) => {
    putFiles(root, files);
    gitIn(root, 'add', '-A');
    gitIn(root, 'commit', '-q', '-m', message);
  };
  commit({ 'e2e/visual/README.md': 'baselines\n', 'e2e/visual/routes.spec.ts': 'export {};\n' }, 'base');
  gitIn(root, 'checkout', '-q', '-b', 'side-png');
  commit({ [`${SNAP}/contact/375-reduced-visual-dark-linux.png`]: 'png-bytes\n' }, 'side: contact baseline');
  gitIn(root, 'checkout', '-q', 'main');
  commit({ 'notes.txt': 'main moves on\n' }, 'main: notes');
  gitIn(root, 'merge', '-q', '--no-ff', '-m', 'merge side-png', 'side-png');
  gitIn(root, 'tag', 'merge-png');
  gitIn(root, 'checkout', '-q', '-b', 'side-text');
  commit({ 'e2e/visual/routes.spec.ts': 'export const routes = [];\n' }, 'side: spec text');
  gitIn(root, 'checkout', '-q', 'main');
  commit({ [`${SNAP}/photos/375-reduced-visual-dark-linux.png`]: 'png-bytes\n' }, 'main: photos baseline');
  gitIn(root, 'merge', '-q', '--no-ff', '-m', 'merge side-text', 'side-text');
  gitIn(root, 'tag', 'merge-text');
  return root;
}
const snapshotMergeRoot = tempMergeRepo();

const PHOTO_DERIVE = path.join(repoRoot, 'scripts', 'photos', 'build-derivatives.mjs');
/** Every file under `root`, as a posix relative path -> its bytes. */
function snapshotTree(root) {
  const files = new Map();
  const walk = (dir) => {
    for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, d.name);
      if (d.isDirectory()) walk(abs);
      else files.set(path.relative(root, abs).split(path.sep).join('/'), fs.readFileSync(abs));
    }
  };
  walk(root);
  return files;
}
/** Null when `root` holds exactly the files in `before`, byte for byte; else what changed. */
function treeUnchanged(root, before) {
  const after = snapshotTree(root);
  const problems = [];
  for (const [rel, bytes] of before) {
    if (!after.has(rel)) problems.push(`${rel} was deleted`);
    else if (!after.get(rel).equals(bytes)) problems.push(`${rel} changed`);
  }
  for (const rel of after.keys()) if (!before.has(rel)) problems.push(`${rel} is new`);
  return problems.length ? `fixture tree changed: ${problems.join(', ')}` : null;
}
/**
 * G6 fixture (generated, no camera data): a temp root with two originals in
 * assets/photos-original/ (img-0001 a 32 x 24 sRGB JPEG, img-0002 bytes sharp
 * cannot decode), a sidecar listing both in ascending order with each file's
 * real sha256, one stale derivative in public/images/photos/ and an existing
 * data/generated/image-manifest.ts. The valid photo comes first, so a script
 * that writes as it encodes, or unlinks stale files before validating, changes
 * the tree. Built with top-level await because case setup hooks are synchronous.
 */
async function tempDeriveRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  const valid = await sharp({ create: { width: 32, height: 24, channels: 3, background: { r: 90, g: 120, b: 150 } } })
    .jpeg()
    .toBuffer();
  const originals = { 'img-0001': valid, 'img-0002': Buffer.from('selftest: these bytes are not an image\n') };
  const put = (rel, bytes) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), bytes);
  };
  const photos = Object.entries(originals).map(([id, bytes]) => {
    put(`assets/photos-original/${id}.jpg`, bytes);
    return {
      id,
      file: `${id}.jpg`,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      width: 32,
      height: 24,
      orientation: null,
      space: 'srgb',
      iccDescription: null,
      make: null,
      model: null,
      lens: null,
      focalLengthMm: null,
      fNumber: null,
      exposureTimeS: null,
      iso: null,
      dateTimeOriginal: null,
      offsetTimeOriginal: null,
      gps: null,
    };
  });
  put('data/photos/exif-sidecar.json', `${JSON.stringify({ schemaVersion: 1, photos }, null, 2)}\n`);
  put('public/images/photos/img-0001-640.0123456789.webp', await sharp(valid).webp().toBuffer());
  put('data/generated/image-manifest.ts', '// selftest: the committed manifest before the run\nexport const imageManifest = {} as const;\n');
  return root;
}
const photoDeriveRoot = await tempDeriveRoot();
const photoDeriveBefore = snapshotTree(photoDeriveRoot);

const cases = [
  {
    name: 'parity: good fixture passes',
    guard: PARITY,
    args: [],
    setup: () => {
      parityGoodRoot = tempParityRoot('good');
      return ['--root', parityGoodRoot];
    },
    expectExit: 0,
    expectOutput: ['parity: OK'],
  },
  {
    name: 'parity: bad fixture fails (npm install, node-version 20, container tag drift)',
    guard: PARITY,
    args: [],
    setup: () => {
      parityBadRoot = tempParityRoot('bad');
      return ['--root', parityBadRoot];
    },
    expectExit: 1,
    expectOutput: [
      'vercel.json: installCommand is "npm install"',
      '.node-version: contains "20"',
      'engines.node is "20.x"',
      `literal "node-version: '20'"`,
      'run step uses npm install instead of npm ci: npm install',
      'run step uses npm install instead of npm ci: npm i sharp',
      'Playwright image v1.58.0-noble does not match lockfile @playwright/test 1.60.0',
      'next 16.2.6 is below the floor 16.3.0',
      'framer-motion is a forbidden direct dependency',
    ],
  },
  {
    // 12 IN-12: the hoisted copies meet their floors, the nested copies do not
    name: 'parity: nested-floor fixture fails on nested lockfile copies below their floor (12 IN-12)',
    guard: PARITY,
    args: [],
    setup: () => {
      parityNestedFloorRoot = tempParityRoot('nested-floor');
      return ['--root', parityNestedFloorRoot];
    },
    expectExit: 1,
    expectOutput: [
      'next 16.1.4 at node_modules/eslint-config-next/node_modules/next is below the floor 16.2.0',
      'fflate 0.6.10 at node_modules/three-stdlib/node_modules/fflate is below the floor 0.6.11',
      'parity: 2 failure(s)',
    ],
  },
  {
    // 12 IN-12 (option A, per-line floors): a copy on a line with no floor fails,
    // lower or higher; the 0.6.11 and 0.8.3 copies meet their own lines' floors
    name: 'parity: unfloored-line fixture fails on lockfile copies whose version line has no floor (12 IN-12)',
    guard: PARITY,
    args: [],
    setup: () => {
      parityUnflooredLineRoot = tempParityRoot('unfloored-line');
      return ['--root', parityUnflooredLineRoot];
    },
    expectExit: 1,
    expectOutput: [
      'fflate 0.7.4 at node_modules/unzip-lite/node_modules/fflate has no floor for version line 0.7 (floors 0.6.11, 0.8.3)',
      'fflate 1.0.0 at node_modules/zip-next/node_modules/fflate has no floor for version line 1 (floors 0.6.11, 0.8.3)',
      'parity: 2 failure(s)',
    ],
  },
  {
    name: 'test-count: total equal to the baseline passes',
    guard: TEST_COUNT,
    args: ['--jest', tc('jest-66.json'), '--list', tc('list-25.json'), '--baseline', tc('baseline-91.json'), '--root', tc('clean')],
    expectExit: 0,
    expectOutput: ['test-count: jest 66 + e2e 25 = 91 (baseline 91)'],
  },
  {
    name: 'test-count: total one below the baseline fails',
    guard: TEST_COUNT,
    args: ['--jest', tc('jest-65.json'), '--list', tc('list-25.json'), '--baseline', tc('baseline-91.json'), '--root', tc('clean')],
    expectExit: 1,
    expectOutput: ['test-count: jest 65 + e2e 25 = 90 (baseline 91)', 'rewrite tests, never delete'],
  },
  {
    name: 'test-count: a spec listed under two projects counts once',
    guard: TEST_COUNT,
    args: ['--jest', tc('jest-66.json'), '--list', tc('list-25-two-projects.json'), '--baseline', tc('baseline-91.json'), '--root', tc('clean')],
    expectExit: 0,
    expectOutput: ['test-count: jest 66 + e2e 25 = 91 (baseline 91)'],
  },
  {
    name: 'test-count: a skipped Jest test fails',
    guard: TEST_COUNT,
    args: ['--jest', tc('jest-pending.json'), '--list', tc('list-25.json'), '--baseline', tc('baseline-91.json'), '--root', tc('clean')],
    expectExit: 1,
    expectOutput: ['1 skipped Jest test'],
  },
  {
    name: 'test-count: a test.only( call under e2e/ fails',
    guard: TEST_COUNT,
    args: ['--jest', tc('jest-66.json'), '--list', tc('list-25.json'), '--baseline', tc('baseline-91.json'), '--root', tc('focused')],
    expectExit: 1,
    expectOutput: ['focused/skipped call', 'x.ts:2'],
  },
  {
    name: 'test-count: --update with a lower total fails and leaves the baseline unchanged',
    guard: TEST_COUNT,
    args: ['--jest', tc('jest-65.json'), '--list', tc('list-25.json'), '--root', tc('clean'), '--update'],
    setup: () => {
      lowerUpdateBaseline = tempBaseline('baseline-91.json');
      return ['--baseline', lowerUpdateBaseline];
    },
    expectExit: 1,
    expectOutput: ['rewrite tests, never delete'],
    check: () =>
      fs.readFileSync(lowerUpdateBaseline, 'utf-8') === fs.readFileSync(tc('baseline-91.json'), 'utf-8')
        ? null
        : 'baseline copy was modified by a refused --update',
  },
  {
    name: 'test-count: --update with a higher total raises the baseline',
    guard: TEST_COUNT,
    args: ['--jest', tc('jest-66.json'), '--list', tc('list-25.json'), '--root', tc('clean'), '--update'],
    setup: () => {
      raiseUpdateBaseline = tempBaseline('baseline-90.json');
      return ['--baseline', raiseUpdateBaseline];
    },
    expectExit: 0,
    expectOutput: ['test-count: jest 66 + e2e 25 = 91 (baseline 90)'],
    check: () => {
      const written = JSON.parse(fs.readFileSync(raiseUpdateBaseline, 'utf-8'));
      return written.jest === 66 && written.e2e === 25 && written.total === 91 && typeof written.recordedAt === 'string'
        ? null
        : `baseline not raised: ${JSON.stringify(written)}`;
    },
  },
  {
    // GUARD-06: a jsx-a11y violation must fail lint (exit 1 with a jsx-a11y rule id).
    // ESLint exits 2 on a config or parse fault, so exit 1 plus the rule prefix proves the rule fired.
    name: 'a11y probe',
    guard: ESLINT,
    args: ['--stdin', '--stdin-filename', 'probe.tsx'],
    input: 'export const X = () => <div onClick={() => {}} />;\n',
    cwd: repoRoot,
    expectExit: 1,
    expectOutput: ['jsx-a11y/'],
  },
  {
    // A bare R3F <Canvas> has no error boundary: without WebGL it replaces the route (R3F >= 9.8).
    name: 'bare R3F Canvas import probe',
    guard: ESLINT,
    args: ['--stdin', '--stdin-filename', 'probe.tsx'],
    input: "import { Canvas } from '@react-three/fiber';\nexport const X = Canvas;\n",
    cwd: repoRoot,
    expectExit: 1,
    expectOutput: ['no-restricted-imports', 'SafeCanvas'],
  },
  {
    // DATA-01: generator libraries are build-time only and never reach shipped code.
    name: 'generator import ban: d3-contour in components/ fails',
    guard: ESLINT,
    args: ['--stdin', '--stdin-filename', 'components/probe.tsx'],
    input: "import { contours } from 'd3-contour';\nexport const X = contours;\n",
    cwd: repoRoot,
    expectExit: 1,
    expectOutput: ['no-restricted-imports', 'Build-time only'],
  },
  {
    name: 'generator import ban: d3-contour in scripts/**/*.mjs passes',
    guard: ESLINT,
    args: ['--stdin', '--stdin-filename', 'scripts/terrain/probe.mjs'],
    input: "import { contours } from 'd3-contour';\nexport const X = contours;\n",
    cwd: repoRoot,
    expectExit: 0,
  },
  {
    name: 'generator import ban: sharp in lib/ fails',
    guard: ESLINT,
    args: ['--stdin', '--stdin-filename', 'lib/probe.ts'],
    input: "import sharp from 'sharp';\nexport const X = sharp;\n",
    cwd: repoRoot,
    expectExit: 1,
    expectOutput: ['no-restricted-imports', 'Build-time only'],
  },
  {
    // The scripts/**/*.mjs override must restate the old bans (flat config replaces options).
    name: 'generator import ban: framer-motion in scripts/**/*.mjs still fails',
    guard: ESLINT,
    args: ['--stdin', '--stdin-filename', 'scripts/terrain/probe.mjs'],
    input: "import { motion } from 'framer-motion';\nexport const X = motion;\n",
    cwd: repoRoot,
    expectExit: 1,
    expectOutput: ['no-restricted-imports', 'motion/react'],
  },
  {
    name: 'same-classnames: entity escape, <a> to <Link> and a JSX comment are neutral',
    guard: SAME_CLASSNAMES,
    args: ['--files', sc('before.tsx.txt'), sc('after-neutral.tsx.txt')],
    expectExit: 0,
    expectOutput: ['same-classnames: OK'],
  },
  {
    name: 'same-classnames: a changed className literal fails',
    guard: SAME_CLASSNAMES,
    args: ['--files', sc('before.tsx.txt'), sc('after-changed.tsx.txt')],
    expectExit: 1,
    expectOutput: ['className literals differ', '- "flex gap-4 p-2"', '+ "flex gap-4 p-3"'],
  },
  {
    // 07 WR-04: a move used to show as D + A and was skipped, so nothing was compared
    name: 'same-classnames: a moved file with identical classNames is compared and passes (07 WR-04)',
    guard: SAME_CLASSNAMES,
    args: ['HEAD'],
    cwd: classnamesMovedRoot,
    expectExit: 0,
    expectOutput: ['same-classnames: OK (1 file(s) compared'],
  },
  {
    name: 'same-classnames: a moved file whose classNames changed fails (07 WR-04)',
    guard: SAME_CLASSNAMES,
    args: ['HEAD'],
    cwd: classnamesMovedChangedRoot,
    expectExit: 1,
    expectOutput: ['className literals differ: app/card.tsx -> app/(site)/card.tsx', '- "flex flex-col gap-4 p-6"', '+ "flex flex-col gap-4 p-8"'],
  },
  {
    name: 'same-classnames: a run that compared zero files fails (07 WR-04)',
    guard: SAME_CLASSNAMES,
    args: ['HEAD'],
    cwd: classnamesUnchangedRoot,
    expectExit: 1,
    expectOutput: ['same-classnames: compared 0 files'],
  },
  {
    name: 'visual-run: the newest run of the named workflow is chosen',
    fn: () => expectEqual('pickRun id', pickRun(runs, 'CI')?.id, 102),
  },
  {
    name: 'visual-run: a successful Visual Regression job is pass',
    fn: () => expectEqual('outcome', evaluate(runs, vr('jobs-pass.json').jobs, VISUAL_JOB), 'pass'),
  },
  {
    name: 'visual-run: a failed Visual Regression job is fail',
    fn: () => expectEqual('outcome', evaluate(runs, vr('jobs-fail.json').jobs, VISUAL_JOB), 'fail'),
  },
  {
    name: 'visual-run: an in-progress job, or a running run without the job yet, is pending',
    fn: () =>
      expectEqual('in-progress job', evaluate(runs, vr('jobs-pending.json').jobs, VISUAL_JOB), 'pending') ??
      expectEqual('running run, no job yet', evaluate(runs, vr('jobs-no-visual.json').jobs, VISUAL_JOB), 'pending'),
  },
  {
    name: 'visual-run: no CI run, or a finished run without the job, is missing',
    fn: () =>
      expectEqual('no CI run', evaluate(vr('runs-no-ci.json').workflow_runs, [], VISUAL_JOB), 'missing') ??
      expectEqual('finished run, no job', evaluate(runsCompleted, vr('jobs-no-visual.json').jobs, VISUAL_JOB), 'missing'),
  },
  {
    name: 'snapshot-commit: linux PNGs inside an allowed subdirectory pass',
    fn: () =>
      snapshotCase(
        [
          snap('M', 'photos/375-reduced-visual-dark-linux.png'),
          snap('A', 'photos/768-reduced-visual-light-linux.png'),
          { status: 'M', path: 'e2e/visual/routes.spec.ts' },
        ],
        { allow: ['photos'] },
        true,
      ),
  },
  {
    name: 'snapshot-commit: a non-linux PNG fails even with --allow-all',
    fn: () => snapshotCase([snap('A', 'home/1440-reduced-visual-dark-win32.png')], { allowAll: true }, false, ['only -linux.png']),
  },
  {
    name: 'snapshot-commit: --none fails on any added or modified PNG',
    fn: () =>
      snapshotCase([snap('M', 'home/375-reduced-visual-dark-linux.png')], { none: true }, false, ['must not change PNGs']) ??
      snapshotCase([{ status: 'M', path: 'e2e/visual/routes.spec.ts' }], { none: true }, true),
  },
  {
    name: 'snapshot-commit: --some fails when no PNG changed',
    fn: () => snapshotCase([{ status: 'M', path: 'e2e/visual/README.md' }], { some: true, allowAll: true }, false, ['--some requires']),
  },
  {
    name: 'snapshot-commit: a PNG outside the allow-list fails unless --allow-all',
    fn: () =>
      snapshotCase([snap('M', 'contact/375-reduced-visual-dark-linux.png')], { allow: ['photos'] }, false, ['outside the allowed']) ??
      snapshotCase([snap('M', 'contact/375-reduced-visual-dark-linux.png')], { allowAll: true }, true),
  },
  {
    name: 'snapshot-commit: a deleted PNG fails unless --allow-deletions',
    fn: () =>
      snapshotCase([snap('D', 'photos/375-reduced-visual-light-linux.png')], { allowAll: true }, false, ['deleted']) ??
      snapshotCase([snap('D', 'photos/375-reduced-visual-light-linux.png')], { allowAll: true, allowDeletions: true }, true),
  },
  {
    name: 'snapshot-commit: a git failure exits 2, never a silent pass',
    guard: SNAPSHOT_COMMIT,
    args: ['--sha', 'no-such-rev-for-selftest', '--allow-all'],
    cwd: repoRoot,
    expectExit: 2,
    expectOutput: ['git show no-such-rev-for-selftest failed'],
  },
  {
    // 07 IN-07: a merge is read against its first parent, a single-parent or root commit with git show
    name: 'snapshot-commit: a merge commit is diffed against its first parent (07 IN-07)',
    fn: () => {
      const { snapshotDiffArgs } = snapshotCommitModule;
      if (typeof snapshotDiffArgs !== 'function') return 'check-snapshot-commit exports no snapshotDiffArgs(sha, parents)';
      const show = (sha) => ['show', '--no-renames', '--name-status', '--format=', sha, '--', 'e2e'];
      const same = (label, actual, expected) => expectEqual(label, JSON.stringify(actual), JSON.stringify(expected));
      return (
        same('merge', snapshotDiffArgs('m1', ['p1', 'p2']), ['diff', '--no-renames', '--name-status', 'p1', 'm1', '--', 'e2e']) ??
        same('single parent', snapshotDiffArgs('c1', ['p1']), show('c1')) ??
        same('root commit', snapshotDiffArgs('r1', []), show('r1'))
      );
    },
  },
  {
    name: 'snapshot-commit: a merge commit that brings in a PNG outside the allow-list fails (07 IN-07)',
    guard: SNAPSHOT_COMMIT,
    args: ['--sha', 'merge-png', '--allow', 'photos'],
    cwd: snapshotMergeRoot,
    expectExit: 1,
    expectOutput: [`${SNAP}/contact/375-reduced-visual-dark-linux.png: outside the allowed snapshot directories (--allow photos)`],
  },
  {
    name: 'snapshot-commit: a merge commit with no PNG change against its first parent passes --none (07 IN-07)',
    guard: SNAPSHOT_COMMIT,
    args: ['--sha', 'merge-text', '--none'],
    cwd: snapshotMergeRoot,
    expectExit: 0,
    expectOutput: ['snapshot-commit: OK (0 changed)'],
  },
  {
    name: 'palette: semantic utilities, (c), the prompt glyph and a white utility at its ratchet pass',
    guard: PALETTE,
    args: ['--root', pal('good')],
    expectExit: 0,
    expectOutput: ['palette: OK'],
  },
  {
    name: 'palette: a dark: variant utility fails',
    guard: PALETTE,
    args: ['--root', pal('bad-dark')],
    expectExit: 1,
    expectOutput: ['app/page.tsx:3 dark dark:'],
  },
  {
    name: 'palette: a stock palette class inside an object map fails',
    guard: PALETTE,
    args: ['--root', pal('bad-stock')],
    expectExit: 1,
    expectOutput: ['app/badges.tsx:4 stock hover:text-red-500/80'],
  },
  {
    name: 'palette: directional borders, ring offsets and shadow-colour classes fail the stock and wb rules (07 WR-02)',
    guard: PALETTE,
    args: ['--root', pal('bad-directional')],
    expectExit: 1,
    expectOutput: [
      'app/page.tsx:7 stock border-t-red-500',
      'app/page.tsx:7 stock hover:border-x-cyan-400',
      'app/page.tsx:8 stock ring-offset-red-500',
      'app/page.tsx:8 stock inset-ring-blue-500',
      'app/page.tsx:9 stock drop-shadow-red-500',
      'app/page.tsx:9 stock inset-shadow-red-500',
      'app/page.tsx:9 stock text-shadow-red-500',
      'app/page.tsx:10 wb border-l-white/10',
      'app/page.tsx:10 wb ring-offset-white',
      'app/page.tsx:10 wb drop-shadow-black',
      'app/page.tsx wb 3 white/black utilities above the ratchet of 0',
      'palette: 11 violations',
    ],
  },
  {
    name: 'palette: one white/black utility above the ratchet fails',
    guard: PALETTE,
    args: ['--root', pal('bad-wb')],
    expectExit: 1,
    expectOutput: ['app/page.tsx wb 2 white/black utilities above the ratchet of 1', 'app/page.tsx:6 wb hover:bg-white/10'],
  },
  {
    name: 'palette: a white/black count below the ratchet fails until --update records it',
    guard: PALETTE,
    args: ['--root', pal('wb-tighten')],
    expectExit: 1,
    expectOutput: ['app/page.tsx wb 1 white/black utilities below the ratchet of 2', 'ratchet can tighten'],
  },
  {
    name: 'palette: a non-linux PNG under e2e/ fails',
    guard: PALETTE,
    args: ['--root', pal('bad-png')],
    expectExit: 1,
    expectOutput: ['e2e/x-win32.png:0 png'],
  },
  {
    name: 'palette: a git-ignored local -win32.png under e2e/ passes, so lint survives a local visual run (07 WR-03)',
    guard: PALETTE,
    args: [],
    setup: () => {
      pngIgnoredRoot = tempPngRoot({ stray: false });
      return ['--root', pngIgnoredRoot];
    },
    expectExit: 0,
    expectOutput: ['palette: OK'],
  },
  {
    name: 'palette: an untracked PNG under e2e/ that no rule ignores still fails beside an ignored one (07 WR-03)',
    guard: PALETTE,
    args: [],
    setup: () => {
      pngStrayRoot = tempPngRoot({ stray: true });
      return ['--root', pngStrayRoot];
    },
    expectExit: 1,
    expectOutput: ['e2e/stray.png:0 png', 'palette: 1 violations'],
  },
  {
    name: 'palette: an emoji in a data map fails',
    guard: PALETTE,
    args: ['--root', pal('bad-emoji')],
    expectExit: 1,
    expectOutput: ['data/tags.ts:3 emoji'],
  },
  {
    name: 'palette: --skip emoji turns the emoji rule off',
    guard: PALETTE,
    args: ['--root', pal('bad-emoji'), '--skip', 'emoji'],
    expectExit: 0,
    expectOutput: ['palette: OK'],
  },
  {
    name: 'palette: an emoji in a non-legacy component fails',
    guard: PALETTE,
    args: ['--root', pal('bad-emoji-component')],
    expectExit: 1,
    expectOutput: ['components/Badge.tsx:3 emoji ❤'],
  },
  {
    name: 'palette: the same emoji in an unimported components/Footer.tsx fails (no dead-file exemption)',
    guard: PALETTE,
    args: ['--root', pal('bad-emoji-former-dead')],
    expectExit: 1,
    expectOutput: ['components/Footer.tsx:3 emoji ❤', 'palette: 1 violations'],
  },
  {
    name: 'palette: an imported components/Footer.tsx fails on its emoji alone, with no importer line',
    guard: PALETTE,
    args: ['--root', pal('bad-emoji-former-dead-imported')],
    expectExit: 1,
    expectOutput: ['components/Footer.tsx:3 emoji ❤', 'palette: 1 violations'],
  },
  {
    name: 'palette: @custom-variant dark and a stock class in CSS @apply fail',
    guard: PALETTE,
    args: ['--root', pal('bad-variant')],
    expectExit: 1,
    expectOutput: ['app/globals.css:3 variant @custom-variant dark', 'app/globals.css:6 stock text-amber-400'],
  },
  {
    name: 'palette: a v1 alias name in a new shell file fails',
    guard: PALETTE,
    args: ['--root', pal('bad-v1names')],
    expectExit: 1,
    expectOutput: ['components/site/SiteNav.tsx:3 v1names frost-4'],
  },
  {
    name: 'palette: a v1 alias name in a live (non-shell) component fails',
    guard: PALETTE,
    args: ['--root', pal('bad-v1names-live')],
    expectExit: 1,
    expectOutput: ['components/Card.tsx:1 v1names frost-500'],
  },
  {
    name: 'palette: a v1 alias name in an unimported components/Header.tsx fails (no dead-file exemption)',
    guard: PALETTE,
    args: ['--root', pal('bad-v1names-former-dead')],
    expectExit: 1,
    expectOutput: ['components/Header.tsx:3 v1names snow-50', 'palette: 1 violations'],
  },
  {
    name: 'palette: a --color-<v1>-NNN alias definition line in app/globals.css fails (no alias exemption)',
    guard: PALETTE,
    args: ['--root', pal('bad-v1names-alias-defs')],
    expectExit: 1,
    expectOutput: [
      'app/globals.css:3 v1names alpine-950',
      'app/globals.css:4 v1names frost-600',
      'app/globals.css:5 v1names rust-400',
      'palette: 3 violations',
    ],
  },
  {
    name: 'palette: --update refuses a raise and leaves the ratchet unchanged',
    guard: PALETTE,
    args: ['--root', pal('bad-wb'), '--update'],
    setup: () => {
      raisePaletteRatchet = tempRatchet('bad-wb');
      return ['--ratchet', raisePaletteRatchet];
    },
    expectExit: 1,
    expectOutput: ['--update refused'],
    check: () =>
      fs.readFileSync(raisePaletteRatchet, 'utf-8') === fs.readFileSync(pal('bad-wb', 'palette-ratchet.json'), 'utf-8')
        ? null
        : 'ratchet copy was modified by a refused --update',
  },
  {
    name: 'palette: --update records a lower count',
    guard: PALETTE,
    args: ['--root', pal('wb-tighten'), '--update'],
    setup: () => {
      lowerPaletteRatchet = tempRatchet('wb-tighten');
      return ['--ratchet', lowerPaletteRatchet];
    },
    expectExit: 0,
    expectOutput: ['palette: ratchet written', 'palette: OK'],
    check: () => {
      const written = JSON.parse(fs.readFileSync(lowerPaletteRatchet, 'utf-8'));
      return written['app/page.tsx'] === 1 && Object.keys(written).length === 1
        ? null
        : `ratchet not lowered: ${JSON.stringify(written)}`;
    },
  },
  {
    name: 'identity: real record, derived author, in-word Portfolio and a record-driven components/Footer.tsx pass',
    guard: IDENTITY,
    args: ['--root', idf('good')],
    expectExit: 0,
    expectOutput: ['identity: OK'],
  },
  {
    name: 'identity: contact@example.com in a live component fails',
    guard: IDENTITY,
    args: ['--root', idf('bad-placeholder')],
    expectExit: 1,
    expectOutput: ['components/ContactCard.tsx:3 forbidden contact@example.com', 'identity: 1 violations'],
  },
  {
    name: 'identity: the split P + ortfolio wordmark fails',
    guard: IDENTITY,
    args: ['--root', idf('bad-wordmark')],
    expectExit: 1,
    expectOutput: ['components/Brand.tsx:6 forbidden split wordmark', 'identity: 1 violations'],
  },
  {
    name: 'identity: a package.json author that drifts from data/site.ts fails',
    guard: IDENTITY,
    args: ['--root', idf('bad-author')],
    expectExit: 1,
    expectOutput: ['package.json: author', 'expected "Tim Lui (https://github.com/tlex-web)"', 'identity: 1 violations'],
  },
  {
    name: 'identity: a bare https://linkedin.com in data/site.ts fails',
    guard: IDENTITY,
    args: ['--root', idf('bad-linkedin')],
    expectExit: 1,
    // Line 9: the fixture's url line (D-13, 12-25) sits above links.linkedin.
    expectOutput: [
      'data/site.ts:9 forbidden bare LinkedIn root href',
      'links.linkedin "https://linkedin.com" is not a full',
      'identity: 2 violations',
    ],
  },
  {
    name: 'identity: an example.com email in data/site.ts fails the shape check',
    guard: IDENTITY,
    args: ['--root', idf('bad-email')],
    expectExit: 1,
    expectOutput: ['data/site.ts: email "hello@example.com" is not a real address', 'identity: 1 violations'],
  },
  {
    name: 'identity: an http, trailing-slash example.com base url in data/site.ts fails the url rule (D-13)',
    guard: IDENTITY,
    args: ['--root', idf('bad-url')],
    expectExit: 1,
    expectOutput: ['data/site.ts: url "http://example.com/" is not an https origin', 'identity: 1 violations'],
  },
  {
    name: 'identity: v1 placeholders in components/Header.tsx and Footer.tsx fail like any file; their importers add nothing',
    guard: IDENTITY,
    args: ['--root', idf('bad-former-dead-files')],
    expectExit: 1,
    expectOutput: [
      'components/Footer.tsx:3 forbidden My Portfolio',
      'components/Header.tsx:6 forbidden split wordmark',
      'identity: 2 violations',
    ],
  },
  {
    name: 'legacy-dead-files: the list stays empty and the repository has no dead-file importer (VERIFY-01)',
    fn: () =>
      LEGACY_DEAD_FILES.length !== 0
        ? `LEGACY_DEAD_FILES must stay empty, got ${JSON.stringify(LEGACY_DEAD_FILES)}`
        : isLegacyDeadFile('components/Header.tsx') || assertNoImporters(repoRoot).length !== 0
          ? 'an empty list must exempt no file and report no importer'
          : null,
  },
  {
    name: 'served-images: a listed hashed WebP and strip SVG, both manifests and a clean derivative script pass',
    guard: SERVED,
    args: ['--root', si('good')],
    expectExit: 0,
    expectOutput: ['served-images: OK'],
  },
  {
    name: 'served-images: a JPEG with an EXIF GPS IFD fails the metadata rule',
    guard: SERVED,
    args: ['--root', si('bad-exif-gps')],
    expectExit: 1,
    expectOutput: ['public/images/a.jpg metadata: exif'],
  },
  {
    name: 'served-images: a JPEG with XMP but no EXIF fails the metadata rule',
    guard: SERVED,
    args: ['--root', si('bad-xmp-only')],
    expectExit: 1,
    expectOutput: ['public/images/x.jpg metadata: xmp'],
  },
  {
    name: 'served-images: a public/ WebP 2600 px wide fails the size rule',
    guard: SERVED,
    args: ['--root', si('bad-oversize')],
    expectExit: 1,
    expectOutput: ['public/images/big.webp oversize: 2600x1'],
  },
  {
    name: 'served-images: a public/ JPEG with orientation 6 fails the orientation rule',
    guard: SERVED,
    args: ['--root', si('bad-orientation')],
    expectExit: 1,
    expectOutput: ['public/images/o.jpg orientation: tag 6'],
  },
  {
    name: 'served-images: a raw camera file under public fails as unreadable',
    guard: SERVED,
    args: ['--root', si('bad-raw')],
    expectExit: 1,
    expectOutput: ['public/images/x.dng metadata: unreadable by sharp'],
  },
  {
    name: 'served-images: a terrain file whose name hash does not match its bytes fails',
    guard: SERVED,
    args: ['--root', si('bad-hash-name')],
    expectExit: 1,
    expectOutput: ['public/terrain/contours-strip.0000000000.svg hash-name: name hash 0000000000'],
  },
  {
    name: 'served-images: a correctly hashed SVG with a script element fails',
    guard: SERVED,
    args: ['--root', si('bad-svg-script')],
    expectExit: 1,
    expectOutput: ['svg-content: script element'],
  },
  {
    name: 'served-images: a hashed photo no manifest lists fails as an orphan',
    guard: SERVED,
    args: ['--root', si('bad-orphan')],
    expectExit: 1,
    expectOutput: ['public/images/photos/y-640.7a4b0211a0.webp orphan:'],
  },
  {
    name: 'served-images: a manifest URL with no file behind it fails as missing',
    guard: SERVED,
    args: ['--root', si('bad-missing')],
    expectExit: 1,
    expectOutput: ['public/images/photos/z-640.0123456789.webp missing: listed in data/generated/image-manifest.ts'],
  },
  {
    name: 'served-images: a scripts/photos call to withMetadata() fails',
    guard: SERVED,
    args: ['--root', si('bad-metadata-call')],
    expectExit: 1,
    expectOutput: ['scripts/photos/x.mjs metadata-call: line 2 calls .withMetadata()'],
  },
  {
    name: 'served-images: a clean faststart MP4 and its WebP poster, hashed and listed in the media manifest, pass',
    guard: SERVED,
    args: ['--root', si('good-mp4')],
    expectExit: 0,
    expectOutput: ['served-images: OK'],
  },
  {
    name: 'served-images: an MP4 with a planted creation_time and location fails the video rule',
    guard: SERVED,
    args: ['--root', si('bad-mp4-metadata')],
    expectExit: 1,
    expectOutput: [
      'public/media/coin-flip-toss.59f6287d49.mp4 video: mvhd timestamps not zero',
      'public/media/coin-flip-toss.59f6287d49.mp4 video: forbidden box loci',
      'public/media/coin-flip-toss.59f6287d49.mp4 video: metadata items in ilst',
    ],
  },
  {
    name: 'served-images: an MP4 with an AAC audio track fails the video rule',
    guard: SERVED,
    args: ['--root', si('bad-mp4-audio')],
    expectExit: 1,
    expectOutput: ['public/media/coin-flip-toss.4c95121c6a.mp4 video: tracks: vide,soun'],
  },
  {
    name: 'served-images: an MP4 without +faststart (mdat before moov) fails the video rule',
    guard: SERVED,
    args: ['--root', si('bad-mp4-order')],
    expectExit: 1,
    expectOutput: ['public/media/coin-flip-toss.08507707c1.mp4 video: moov must precede mdat'],
  },
  {
    name: 'served-images: an MP4 with a top-level uuid box fails the video rule',
    guard: SERVED,
    args: ['--root', si('bad-mp4-uuid')],
    expectExit: 1,
    expectOutput: ['public/media/coin-flip-toss.fe7f168ef1.mp4 video: forbidden box uuid'],
  },
  {
    name: 'served-images: an MP4 with an XMP packet in a udta XMP_ box fails the video and metadata rules',
    guard: SERVED,
    args: ['--root', si('bad-mp4-xmp')],
    expectExit: 1,
    expectOutput: [
      'public/media/coin-flip-toss.41c2fd1ba3.mp4 video: forbidden box XMP_',
      'public/media/coin-flip-toss.41c2fd1ba3.mp4 metadata: XMP packet marker in bytes, XMP namespace marker in bytes',
    ],
  },
  {
    name: 'served-images: a WebM under public/media fails as a non-MP4 video',
    guard: SERVED,
    args: ['--root', si('bad-video-format')],
    expectExit: 1,
    expectOutput: ['public/media/coin-flip-toss.eebff415df.webm video-format: only MP4 is served'],
  },
  {
    name: 'mp4-boxes: checkMp4 finds no violation in the clean fixture clip',
    fn: () => expectEqual('violations', checkMp4(goodMp4()).join('; '), ''),
  },
  {
    name: 'mp4-boxes: checkMp4 with a 100-byte budget reports the size',
    fn: () => expectEqual('violations', checkMp4(goodMp4(), { maxBytes: 100 }).join('; '), `size ${goodMp4().length} B over 100 B`),
  },
  {
    name: 'mp4-boxes: checkMp4 reports only the forbidden uuid box in the bad-mp4-uuid clip',
    fn: () => expectEqual('violations', checkMp4(fs.readFileSync(path.join(si('bad-mp4-uuid'), 'public', 'media', 'coin-flip-toss.fe7f168ef1.mp4'))).join('; '), 'forbidden box uuid'),
  },
  {
    name: 'mp4-boxes: checkMp4 reports only the forbidden XMP_ box in the bad-mp4-xmp clip',
    fn: () => expectEqual('violations', checkMp4(fs.readFileSync(path.join(si('bad-mp4-xmp'), 'public', 'media', 'coin-flip-toss.41c2fd1ba3.mp4'))).join('; '), 'forbidden box XMP_'),
  },
  {
    name: 'contrast: the real app/globals.css passes all 47 pairs (28 UI-SPEC + 4 accent-strong + 4 gallery + 1 toggle + 10 trail) in table order, each against its own threshold (07 IN-06)',
    fn: () => contrastTableCheck(path.join(repoRoot, 'app', 'globals.css')),
  },
  {
    name: 'contrast: the table check accepts other passing ratios (at-threshold.css), so retuning a passing token cannot fail it (07 IN-06)',
    fn: () => contrastTableCheck(con('at-threshold.css')),
  },
  {
    name: 'contrast: the table check fails when a pair drops below its threshold (low-ink.css) (07 IN-06)',
    fn: () => {
      const error = contrastTableCheck(con('low-ink.css'));
      return error?.includes('ink/surface 3 is below 4.5:1 (FAIL)') ? null : `expected the ink/surface pair to fail the check, got: ${error}`;
    },
  },
  {
    name: 'contrast: a pair exactly at 4.5:1 passes (inclusive raw-float threshold)',
    guard: CONTRAST,
    args: ['--css', con('at-threshold.css')],
    expectExit: 0,
    expectOutput: ['ink-muted/surface 4.50 4.5 PASS', 'ink-muted/surface-overlay 4.50 4.5 PASS', 'contrast: OK (47 pairs)'],
  },
  {
    name: 'contrast: a pair 0.01 below 4.5:1 fails',
    guard: CONTRAST,
    args: ['--css', con('below-threshold.css')],
    expectExit: 1,
    expectOutput: ['ink-muted/surface 4.49 4.5 FAIL'],
  },
  {
    name: 'contrast: --color-ink resolving to 3:1 on surface fails',
    guard: CONTRAST,
    args: ['--css', con('low-ink.css')],
    expectExit: 1,
    expectOutput: ['ink/surface 3.00 4.5 FAIL', 'contrast: 1 failures'],
  },
  {
    name: 'contrast: a waymark bar below 3:1 on its white neighbour fails (trail paint read from :root)',
    guard: CONTRAST,
    args: ['--css', con('low-trail.css')],
    expectExit: 1,
    expectOutput: ['trail-mountain/trail-blaze 1.40 3 FAIL', 'trail-alpine/trail-blaze 4.20 3 PASS', 'contrast: 1 failures'],
  },
  {
    name: 'contrast: an unknown --color-foo token fails',
    guard: CONTRAST,
    args: ['--css', con('unknown-token.css')],
    expectExit: 1,
    expectOutput: ['unknown token --color-foo'],
  },
  {
    name: 'contrast: a missing --color-danger fails its pairs',
    guard: CONTRAST,
    args: ['--css', con('missing-danger.css')],
    expectExit: 1,
    expectOutput: ['missing token for pair danger/surface', 'missing token for pair danger/surface-overlay'],
  },
  {
    name: 'contrast: a file with no :root or @theme block fails',
    guard: CONTRAST,
    args: ['--css', con('empty.css')],
    expectExit: 1,
    expectOutput: ['no :root or @theme block'],
  },
  {
    name: 'contrast: a var() cycle fails instead of recursing',
    guard: CONTRAST,
    args: ['--css', con('var-cycle.css')],
    expectExit: 1,
    expectOutput: ['var() cycle'],
  },
  {
    name: 'contrast: a :root nested in @media cannot mask a failing base token, and is reported (07 WR-01)',
    guard: CONTRAST,
    args: ['--css', con('media-override.css')],
    expectExit: 1,
    expectOutput: [
      'ink/surface 3.00 4.5 FAIL',
      ':root inside @media (prefers-color-scheme: light) declares --dim',
      'contrast: 2 failures',
    ],
  },
  {
    name: 'ci-ok.jq: push, all success, dependency-review skipped passes',
    fn: () => ciOkCase('push', needsOf({ 'dependency-review': 'skipped' }), 0),
  },
  {
    name: 'ci-ok.jq: pull_request, all seven success passes',
    fn: () => ciOkCase('pull_request', needsOf(), 0),
  },
  {
    name: 'ci-ok.jq: pull_request with dependency-review skipped fails',
    fn: () => ciOkCase('pull_request', needsOf({ 'dependency-review': 'skipped' }), 1),
  },
  {
    name: 'ci-ok.jq: workflow_dispatch with dependency-review skipped passes',
    fn: () => ciOkCase('workflow_dispatch', needsOf({ 'dependency-review': 'skipped' }), 0),
  },
  {
    name: 'ci-ok.jq: e2e-tests failure fails',
    fn: () => ciOkCase('push', needsOf({ 'dependency-review': 'skipped', 'e2e-tests': 'failure' }), 1),
  },
  {
    name: 'ci-ok.jq: unit-tests cancelled fails (a cancelled re-run never reports green)',
    fn: () => ciOkCase('pull_request', needsOf({ 'unit-tests': 'cancelled' }), 1),
  },
  {
    name: 'ci-ok.jq: build skipped on push fails (only dependency-review may skip)',
    fn: () => ciOkCase('push', needsOf({ 'dependency-review': 'skipped', build: 'skipped' }), 1),
  },
  {
    name: 'ci-ok.jq: an empty needs object fails',
    fn: () => ciOkCase('push', {}, 1),
  },
  {
    name: 'ci-ok.jq: needs without changes fails even when every other job succeeded',
    fn: () => ciOkCase('pull_request', needsOf({ changes: null }), 1),
  },
  {
    name: 'ci-ok.jq: docs-only pull_request with the six heavy jobs skipped passes',
    fn: () => ciOkCase('pull_request', needsOf(allHeavy('skipped'), 'true'), 0),
  },
  {
    name: 'ci-ok.jq: docs-only push with the heavy jobs and dependency-review skipped passes',
    fn: () => ciOkCase('push', needsOf({ ...allHeavy('skipped'), 'dependency-review': 'skipped' }, 'true'), 0),
  },
  {
    name: 'ci-ok.jq: docs-only with e2e-tests failure fails',
    fn: () => ciOkCase('pull_request', needsOf({ ...allHeavy('skipped'), 'e2e-tests': 'failure' }, 'true'), 1),
  },
  {
    name: 'ci-ok.jq: changes failure with the heavy jobs skipped fails',
    fn: () => ciOkCase('pull_request', needsOf({ ...allHeavy('skipped'), changes: 'failure' }, null), 1),
  },
  {
    name: 'ci-ok.jq: docs_only "false" with e2e-tests skipped fails',
    fn: () => ciOkCase('pull_request', needsOf({ 'e2e-tests': 'skipped' }, 'false'), 1),
  },
  {
    name: 'ci-ok.jq: docs-only does not excuse dependency-review skipped on a pull_request',
    fn: () => ciOkCase('pull_request', needsOf({ ...allHeavy('skipped'), 'dependency-review': 'skipped' }, 'true'), 1),
  },
  {
    name: 'classify: .planning notes plus README.md are docs-only',
    fn: () => classifyCase(['.planning/x.md', 'README.md'], undefined, true),
  },
  {
    name: 'classify: every D-09 file and a nested .planning path are docs-only',
    fn: () =>
      expectEqual('DOCS_ONLY_FILES', JSON.stringify(DOCS_ONLY_FILES), JSON.stringify(['README.md', 'AGENTS.md', 'scripts/README.md', 'e2e/visual/README.md', '.github/copilot-instructions.md'])) ??
      classifyCase([...DOCS_ONLY_FILES, '.planning/phases/13-x/13-07-PLAN.md'], undefined, true),
  },
  {
    name: 'classify: a guard selftest fixture README is code (no *.md rule)',
    fn: () => classifyCase(['scripts/guards/__selftest__/served-images/a/README.md'], undefined, false),
  },
  {
    name: 'classify: docs/README.md is code (exact list, not a file name)',
    fn: () => classifyCase(['docs/README.md'], undefined, false),
  },
  {
    name: 'classify: .planningX/ and a bare .planning file are not .planning/',
    fn: () => classifyCase(['.planningX/a.md'], undefined, false) ?? classifyCase(['.planning'], undefined, false),
  },
  {
    name: 'classify: an empty diff cannot be classified (full CI)',
    fn: () => classifyCase([], undefined, false),
  },
  {
    name: 'classify: a truncated file list cannot be classified (full CI)',
    fn: () => classifyCase(['README.md'], { truncated: true }, false),
  },
  {
    name: 'classify: a rename from lib/ into .planning/ is code (the old name counts)',
    fn: () => classifyCase(['lib/x.ts', '.planning/x.ts'], undefined, false),
  },
  {
    name: 'classify CLI: docs-only paths on stdin print docs_only=true',
    guard: CLASSIFY,
    args: [],
    input: '.planning/a.md\nREADME.md\n',
    expectExit: 0,
    expectOutput: ['docs_only=true', 'reason='],
  },
  {
    name: 'classify CLI: CRLF line endings are read as plain lines',
    guard: CLASSIFY,
    args: [],
    input: '.planning/a.md\r\nAGENTS.md\r\n',
    expectExit: 0,
    expectOutput: ['docs_only=true'],
  },
  {
    name: 'classify CLI: --truncated prints docs_only=false',
    guard: CLASSIFY,
    args: ['--truncated'],
    input: 'README.md\n',
    expectExit: 0,
    expectOutput: ['docs_only=false', 'reason='],
  },
  {
    name: 'classify CLI: empty stdin prints docs_only=false',
    guard: CLASSIFY,
    args: [],
    input: '',
    expectExit: 0,
    expectOutput: ['docs_only=false'],
  },
  {
    name: 'classify CLI: an unknown argument exits 1',
    guard: CLASSIFY,
    args: ['--docs'],
    input: 'README.md\n',
    expectExit: 1,
    expectOutput: ['unknown argument --docs'],
  },
  {
    name: 'ci-gate: good fixture passes (needs in block form, out of job order; changes, one heavy job, dispatch; the skip-marker relay)',
    guard: CI_GATE,
    args: ['--root', cig('good')],
    expectExit: 0,
    expectOutput: ['ci-gate: OK'],
  },
  {
    name: 'ci-gate: a job missing from ci-ok needs fails (flow form)',
    guard: CI_GATE,
    args: ['--root', cig('bad-missing-need')],
    expectExit: 1,
    expectOutput: ['ci-ok needs is missing build', 'scripts/ci/ci-ok.jq: does not exist'],
  },
  {
    name: 'ci-gate: a root without .github/workflows/ci.yml fails',
    guard: CI_GATE,
    args: ['--root', path.join(fixtures, 'ci-gate')],
    expectExit: 1,
    expectOutput: ['.github/workflows/ci.yml: cannot be read'],
  },
  {
    name: 'ci-gate: ci-ok renamed and not running ci-ok.jq fails',
    guard: CI_GATE,
    args: [],
    setup: () => {
      ciGateRenamedRoot = tempCiGateRoot((text) =>
        text.replace(/^ {4}name: CI OK(?=\r?$)/m,'    name: All green').replace('-f scripts/ci/ci-ok.jq', '-f scripts/ci/other.jq'),
      );
      return ['--root', ciGateRenamedRoot];
    },
    expectExit: 1,
    expectOutput: ['no job is named CI OK', 'ci-ok is named "All green", expected "CI OK"', 'ci-ok does not run jq with -f scripts/ci/ci-ok.jq'],
  },
  {
    name: 'ci-gate: CI OK with if: success() fails',
    guard: CI_GATE,
    args: ['--root', cig('bad-ci-ok-if')],
    expectExit: 1,
    expectOutput: ['CI OK must use if: always()'],
  },
  {
    name: 'ci-gate: a second workflow with a job named CI OK fails',
    guard: CI_GATE,
    args: ['--root', cig('bad-duplicate-ci-ok')],
    expectExit: 1,
    expectOutput: ['a job named CI OK outside ci.yml: .github/workflows/other.yml (job shadow)'],
  },
  {
    name: 'ci-gate: the relay job with a literal name: CI OK fails',
    guard: CI_GATE,
    args: [],
    setup: () => {
      ciGateRelayLiteralRoot = tempCiGateRoot(
        (text) => text.replace(/^ {4}name: \$\{\{ needs\.detect\.outputs\.skipped == 'true' && 'CI OK' \|\| 'CI skip relay' \}\}(?=\r?$)/m, '    name: CI OK'),
        'ci-skip-relay.yml',
      );
      return ['--root', ciGateRelayLiteralRoot];
    },
    expectExit: 1,
    expectOutput: [
      'a job named CI OK outside ci.yml: .github/workflows/ci-skip-relay.yml (job relay); the relay may carry CI OK only inside one ${{ }} name expression',
      'ci-gate: 1 failure(s)',
    ],
  },
  {
    name: 'ci-gate: the relay name expression on a job without needs fails',
    guard: CI_GATE,
    args: [],
    setup: () => {
      ciGateRelayNoNeedsRoot = tempCiGateRoot((text) => text.replace(/^ {4}needs: detect\r?\n/m, ''), 'ci-skip-relay.yml');
      return ['--root', ciGateRelayNoNeedsRoot];
    },
    expectExit: 1,
    expectOutput: ['a job named CI OK outside ci.yml: .github/workflows/ci-skip-relay.yml (job relay); the relay may carry CI OK only'],
  },
  {
    name: 'ci-gate: relay with a checkout step fails',
    guard: CI_GATE,
    args: ['--root', cig('bad-relay-checkout')],
    expectExit: 1,
    expectOutput: ['ci-skip-relay.yml: relay checks out code', 'ci-gate: 2 failure(s)'],
  },
  {
    name: 'ci-gate: relay running gh pr checkout fails',
    guard: CI_GATE,
    args: [],
    setup: () => {
      ciGateRelayPrCheckoutRoot = tempCiGateRoot(
        (text) => text.replace(/^( {10})since=\$\(date/m, '$1gh pr checkout "$REF"\n$1since=$(date'),
        'ci-skip-relay.yml',
      );
      return ['--root', ciGateRelayPrCheckoutRoot];
    },
    expectExit: 1,
    expectOutput: ['ci-skip-relay.yml: relay checks out code', 'ci-gate: 1 failure(s)'],
  },
  {
    name: 'ci-gate: relay with an expression inside a run block fails',
    guard: CI_GATE,
    args: ['--root', cig('bad-relay-interpolation')],
    expectExit: 1,
    expectOutput: ['ci-skip-relay.yml: expression inside a run block', 'ci-gate: 2 failure(s)'],
  },
  {
    name: 'ci-gate: relay with a job-level if on its CI OK job fails',
    guard: CI_GATE,
    args: ['--root', cig('bad-relay-if')],
    expectExit: 1,
    expectOutput: ['ci-skip-relay.yml: job-level if on the CI OK relay job', 'ci-gate: 2 failure(s)'],
  },
  {
    name: 'ci-gate: relay also triggering on pull_request fails',
    guard: CI_GATE,
    args: ['--root', cig('bad-relay-trigger')],
    expectExit: 1,
    expectOutput: ['ci-skip-relay.yml: relay may trigger only on pull_request_target', 'ci-gate: 2 failure(s)'],
  },
  {
    name: 'ci-gate: relay without top-level permissions: {} fails',
    guard: CI_GATE,
    args: [],
    setup: () => {
      ciGateRelayTopPermsRoot = tempCiGateRoot(
        (text) => text.replace(/^permissions: \{\}(\r?\n)/m, 'permissions:$1  contents: read$1'),
        'ci-skip-relay.yml',
      );
      return ['--root', ciGateRelayTopPermsRoot];
    },
    expectExit: 1,
    expectOutput: ['ci-skip-relay.yml: relay must set top-level permissions: {}', 'ci-gate: 1 failure(s)'],
  },
  {
    name: 'ci-gate: relay granting a write scope other than actions: write fails',
    guard: CI_GATE,
    args: [],
    setup: () => {
      ciGateRelayWriteScopeRoot = tempCiGateRoot(
        (text) => text.replace(/^( {6}actions: write\r?\n {6})contents: read/m, '$1contents: write'),
        'ci-skip-relay.yml',
      );
      return ['--root', ciGateRelayWriteScopeRoot];
    },
    expectExit: 1,
    expectOutput: ['ci-skip-relay.yml: line', 'relay grants contents: write', 'ci-gate: 1 failure(s)'],
  },
  {
    name: 'ci-gate: a job granting checks: write fails (the comment saying so does not)',
    guard: CI_GATE,
    args: ['--root', cig('bad-checks-write')],
    expectExit: 1,
    expectOutput: ['ci.yml: line 20 grants checks: write', 'ci-gate: 2 failure(s)'],
  },
  {
    name: 'ci-gate: a paths filter under pull_request fails',
    guard: CI_GATE,
    args: ['--root', cig('bad-paths-filter')],
    expectExit: 1,
    expectOutput: ['workflow-level paths filter in .github/workflows/ci.yml'],
  },
  {
    name: 'ci-gate: a paths-ignore filter under push fails',
    guard: CI_GATE,
    args: [],
    setup: () => {
      ciGatePathsIgnoreRoot = tempCiGateRoot((text) => text.replace(/^ {2}push:(\r?\n)/m, "  push:$1    paths-ignore:$1      - '.planning/**'$1"));
      return ['--root', ciGatePathsIgnoreRoot];
    },
    expectExit: 1,
    expectOutput: ['workflow-level paths filter in .github/workflows/ci.yml', 'paths-ignore'],
  },
  {
    name: 'ci-gate: ci.yml without workflow_dispatch fails',
    guard: CI_GATE,
    args: ['--root', cig('bad-no-dispatch')],
    expectExit: 1,
    expectOutput: ['ci.yml has no workflow_dispatch trigger'],
  },
  {
    name: 'ci-gate: a docs-only job missing from the ci-ok.jq heavy list fails',
    guard: CI_GATE,
    args: ['--root', cig('bad-heavy-mismatch')],
    expectExit: 1,
    expectOutput: ['docs-only skip set differs from scripts/ci/ci-ok.jq', 'unit-tests'],
  },
  {
    name: 'ci-gate: a ci-ok.jq heavy id whose job lacks the docs-only condition fails',
    guard: CI_GATE,
    args: [],
    setup: () => {
      ciGateUnconditionedRoot = tempCiGateRoot((text) => text.replace(/^ {4}if: needs\.changes\.outputs\.docs_only != 'true'\r?\n/m, ''));
      return ['--root', ciGateUnconditionedRoot];
    },
    expectExit: 1,
    expectOutput: ['docs-only skip set differs from scripts/ci/ci-ok.jq'],
  },
  {
    name: 'ci-gate: a docs-only job that does not need changes fails',
    guard: CI_GATE,
    args: [],
    setup: () => {
      ciGateNoChangesNeedRoot = tempCiGateRoot((text) => text.replace(/^ {4}needs: \[changes\]\r?\n/m, ''));
      return ['--root', ciGateNoChangesNeedRoot];
    },
    expectExit: 1,
    expectOutput: ['job build has the docs-only condition but does not need changes'],
  },
  {
    name: 'ci-gate: write-all and a job on the default token scope fail',
    guard: CI_GATE,
    args: ['--root', cig('bad-token-scope')],
    expectExit: 1,
    expectOutput: [
      'other.yml: line 20 grants checks: write (permissions: write-all)',
      'other.yml: job inherits has no permissions block and the workflow sets none',
    ],
  },
  {
    name: 'G5 photos:build --check: an unmodified copy of the inputs passes',
    guard: PHOTO_DATA,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--check'],
    setup: () => {
      photoDataControlRoot = tempPhotoDataRoot();
      return ['--root', photoDataControlRoot];
    },
    expectExit: 0,
    expectOutput: ['photos:build: OK'],
  },
  {
    name: 'G5 photos:build --check: an EXIF offset +01:00 on a September Zurich capture fails (WR-03)',
    guard: PHOTO_DATA,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--check'],
    setup: () => {
      photoDataOffsetRoot = tempPhotoDataRoot(({ sidecar }) => {
        const entry = sidecarEntry(sidecar, 'img-0605');
        if (!entry.dateTimeOriginal?.startsWith('2021-09-')) throw new Error('selftest: img-0605 is no longer a September capture');
        entry.offsetTimeOriginal = '+01:00';
      });
      return ['--root', photoDataOffsetRoot];
    },
    expectExit: 1,
    expectOutput: ['img-0605: EXIF OffsetTimeOriginal +01:00 is not the Europe/Zurich offset +02:00', 'photos:build: stale'],
  },
  {
    name: 'G5 photos:build --check: a GPS UTC time one hour off the capture time fails (D-04)',
    guard: PHOTO_DATA,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--check'],
    setup: () => {
      photoDataGpsRoot = tempPhotoDataRoot(({ sidecar }) => {
        const gps = sidecarEntry(sidecar, 'img-0605').gps;
        if (!gps?.utc) throw new Error('selftest: img-0605 has no GPS UTC time');
        gps.utc = new Date(Date.parse(gps.utc) + 3600 * 1000).toISOString();
      });
      return ['--root', photoDataGpsRoot];
    },
    expectExit: 1,
    expectOutput: ['img-0605: local 2021-09-06T10:48:46 minus GPS UTC', 'not +02:00 within 60 s (D-04)', 'photos:build: stale'],
  },
  {
    name: 'G5 photos:build --check: a hand-placed position off the plate fails (WR-01)',
    guard: PHOTO_DATA,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--check'],
    setup: () => {
      photoDataOffPlateRoot = tempPhotoDataRoot(({ corrections }) => {
        const position = corrections.photos['r004-011']?.position;
        if (position?.source !== 'hand-placed') throw new Error('selftest: r004-011 has no hand-placed position');
        // Sion, about 40 km west of the Zermatt plate.
        position.lat = 46.2333;
        position.lon = 7.36;
      });
      return ['--root', photoDataOffPlateRoot];
    },
    expectExit: 1,
    expectOutput: ['r004-011: position lies outside the DEM extent', 'photos:build: stale'],
  },
  {
    name: 'G6 photos:derive: an undecodable source after a valid one exits 1 and leaves every file in place (WR-05)',
    guard: PHOTO_DERIVE,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--root', photoDeriveRoot],
    expectExit: 1,
    expectOutput: ['photos:derive: encoded img-0001 (9 files)', 'unsupported image format'],
    check: () => treeUnchanged(photoDeriveRoot, photoDeriveBefore),
  },
];

let failed = 0;
if (tap) console.log(`TAP version 13\n1..${cases.length}`);
for (const [index, c] of cases.entries()) {
  if (c.fn) {
    let error;
    try {
      error = c.fn();
    } catch (err) {
      error = `threw: ${err.message}`;
    }
    report(index, c, error ? [error] : [], '');
    continue;
  }
  const extraArgs = c.setup ? c.setup() ?? [] : [];
  const result = spawnSync(process.execPath, [...(c.nodeArgs ?? []), c.guard, ...c.args, ...extraArgs], {
    encoding: 'utf-8',
    input: c.input,
    cwd: c.cwd,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const problems = [];
  if (result.error) problems.push(`spawn error: ${result.error.message}`);
  if (result.status !== c.expectExit) {
    problems.push(`expected exit ${c.expectExit}, got ${result.status}`);
  }
  for (const fragment of c.expectOutput ?? []) {
    if (!output.includes(fragment)) problems.push(`output lacks: ${fragment}`);
  }
  const checkError = c.check ? c.check() : null;
  if (checkError) problems.push(checkError);
  report(index, c, problems, output);
}

function report(index, c, problems, output) {
  if (problems.length > 0) failed++;
  if (tap) {
    // TAP 13 report (for tooling that consumes a standard test format)
    console.log(`${problems.length === 0 ? 'ok' : 'not ok'} ${index + 1} - ${c.name}`);
    if (problems.length > 0) {
      console.log('  ---');
      console.log(`  message: ${JSON.stringify(problems.join('; '))}`);
      console.log('  ...');
    }
  } else if (problems.length === 0) {
    console.log(`PASS ${c.name}`);
  } else {
    console.log(`FAIL ${c.name}`);
    for (const p of problems) console.log(`  - ${p}`);
    if (output) console.log(output.replace(/\r\n/g, '\n').replace(/^/gm, '    | '));
  }
}

for (const file of [lowerUpdateBaseline, raiseUpdateBaseline, raisePaletteRatchet, lowerPaletteRatchet, pngIgnoredRoot, pngStrayRoot, classnamesMovedRoot, classnamesMovedChangedRoot, classnamesUnchangedRoot, snapshotMergeRoot, parityGoodRoot, parityBadRoot, parityNestedFloorRoot, parityUnflooredLineRoot, ciGateRenamedRoot, ciGateRelayLiteralRoot, ciGateRelayNoNeedsRoot, ciGateRelayPrCheckoutRoot, ciGateRelayTopPermsRoot, ciGateRelayWriteScopeRoot, ciGateNoChangesNeedRoot, ciGateUnconditionedRoot, ciGatePathsIgnoreRoot, photoDataControlRoot, photoDataOffsetRoot, photoDataGpsRoot, photoDataOffPlateRoot, photoDeriveRoot]) {
  if (file) fs.rmSync(path.dirname(file), { recursive: true, force: true });
}

if (tap) {
  console.log(`# tests ${cases.length}\n# pass ${cases.length - failed}\n# fail ${failed}`);
} else {
  console.log(`selftest: ${cases.length - failed}/${cases.length} cases passed`);
}
process.exit(failed > 0 ? 1 : 0);
