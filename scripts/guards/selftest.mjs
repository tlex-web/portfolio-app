#!/usr/bin/env node

/**
 * Guard self-test: proves every guard in scripts/guards/ can fail
 *
 * Each case spawns `node <guard> ...args` against a fixture under
 * scripts/guards/__selftest__/ and compares the exit code (and, where
 * given, required output fragments) with what the case expects. A guard
 * that cannot fail on a bad fixture is not a guard.
 *
 * Case shape: { name, guard, args, expectExit, expectOutput?, input?, cwd?, setup?, check? }
 *   or { name, fn } for pure helpers (fn returns an error string or null; no spawn)
 *   - input: optional, piped to the guard's stdin
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
import { evaluate, pickRun } from '../ci/check-visual-run.mjs';
import { evaluateSnapshotChanges } from '../ci/check-snapshot-commit.mjs';

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
const con = (name) => path.join(fixtures, 'contrast', name);
const idf = (name) => path.join(fixtures, 'identity', name);
const tc = (...parts) => path.join(fixtures, 'test-count', ...parts);
const pal = (...parts) => path.join(fixtures, 'palette', ...parts);
const sc = (...parts) => path.join(fixtures, 'same-classnames', ...parts);
const tap = process.argv.includes('--tap');

// check-visual-run.mjs: CI API responses captured as fixtures (no network here)
const vr = (name) => JSON.parse(fs.readFileSync(path.join(fixtures, 'visual-run', name), 'utf-8'));
const VISUAL_JOB = { workflow: 'CI', job: 'Visual Regression' };
const runs = vr('runs.json').workflow_runs;
const runsCompleted = runs.map((r) => (r.id === 102 ? { ...r, status: 'completed', conclusion: 'success' } : r));
/** Returns null when `actual` equals `expected`, else an error string. */
const expectEqual = (label, actual, expected) =>
  actual === expected ? null : `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;

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

const cases = [
  {
    name: 'parity: good fixture passes',
    guard: PARITY,
    args: ['--root', path.join(fixtures, 'parity', 'good')],
    expectExit: 0,
    expectOutput: ['parity: OK'],
  },
  {
    name: 'parity: bad fixture fails (npm install, node-version 20, container tag drift)',
    guard: PARITY,
    args: ['--root', path.join(fixtures, 'parity', 'bad')],
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
    name: 'palette: the same emoji in an unimported legacy components/Footer.tsx passes',
    guard: PALETTE,
    args: ['--root', pal('emoji-legacy-dead')],
    expectExit: 0,
    expectOutput: ['palette: OK'],
  },
  {
    name: 'palette: importing the legacy Footer voids its emoji exemption and fails',
    guard: PALETTE,
    args: ['--root', pal('bad-emoji-legacy-imported')],
    expectExit: 1,
    expectOutput: ['app/page.tsx:2 emoji imported legacy file components/Footer.tsx', 'components/Footer.tsx:3 emoji ❤'],
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
    name: 'identity: real record, derived author, in-word Portfolio and an unimported legacy Footer with placeholders pass',
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
    expectOutput: ['components/ContactCard.tsx:3 forbidden contact@example.com'],
  },
  {
    name: 'identity: the split P + ortfolio wordmark fails',
    guard: IDENTITY,
    args: ['--root', idf('bad-wordmark')],
    expectExit: 1,
    expectOutput: ['components/Brand.tsx:6 forbidden split wordmark'],
  },
  {
    name: 'identity: a package.json author that drifts from data/site.ts fails',
    guard: IDENTITY,
    args: ['--root', idf('bad-author')],
    expectExit: 1,
    expectOutput: ['package.json: author', 'expected "Tim Lui (https://github.com/tlex-web)"'],
  },
  {
    name: 'identity: a bare https://linkedin.com in data/site.ts fails',
    guard: IDENTITY,
    args: ['--root', idf('bad-linkedin')],
    expectExit: 1,
    expectOutput: ['data/site.ts:8 forbidden bare LinkedIn root href', 'links.linkedin "https://linkedin.com" is not a full'],
  },
  {
    name: 'identity: an example.com email in data/site.ts fails the shape check',
    guard: IDENTITY,
    args: ['--root', idf('bad-email')],
    expectExit: 1,
    expectOutput: ['data/site.ts: email "hello@example.com" is not a real address'],
  },
  {
    name: 'identity: importing a legacy v1 file (alias or relative) voids its exemption and fails',
    guard: IDENTITY,
    args: ['--root', idf('bad-dead-import')],
    expectExit: 1,
    expectOutput: [
      'app/page.tsx:2 legacy file is imported again: components/Header.tsx',
      'components/Shell.tsx:2 legacy file is imported again: components/Footer.tsx',
      'components/Header.tsx:6 forbidden split wordmark',
    ],
  },
  {
    name: 'contrast: the real app/globals.css passes all 28 UI-SPEC pairs in table order',
    guard: CONTRAST,
    args: ['--css', path.join(repoRoot, 'app', 'globals.css')],
    expectExit: 0,
    expectOutput: ['ink/surface 16.03 4.5 PASS', 'danger/surface-raised 6.74 4.5 PASS', 'line-strong/surface-overlay 4.17 3 PASS', 'contrast: OK (28 pairs)'],
  },
  {
    name: 'contrast: a pair exactly at 4.5:1 passes (inclusive raw-float threshold)',
    guard: CONTRAST,
    args: ['--css', con('at-threshold.css')],
    expectExit: 0,
    expectOutput: ['ink-muted/surface 4.50 4.5 PASS', 'ink-muted/surface-overlay 4.50 4.5 PASS', 'contrast: OK (28 pairs)'],
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
  const result = spawnSync(process.execPath, [c.guard, ...c.args, ...extraArgs], {
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

for (const file of [lowerUpdateBaseline, raiseUpdateBaseline, raisePaletteRatchet, lowerPaletteRatchet]) {
  if (file) fs.rmSync(path.dirname(file), { recursive: true, force: true });
}

if (tap) {
  console.log(`# tests ${cases.length}\n# pass ${cases.length - failed}\n# fail ${failed}`);
} else {
  console.log(`selftest: ${cases.length - failed}/${cases.length} cases passed`);
}
process.exit(failed > 0 ? 1 : 0);
