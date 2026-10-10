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

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const fixtures = path.join(here, '__selftest__');
const PARITY = path.join(here, 'check-install-parity.mjs');
const TEST_COUNT = path.join(here, 'test-count.mjs');
const ESLINT = path.join(repoRoot, 'node_modules', 'eslint', 'bin', 'eslint.js');
const SAME_CLASSNAMES = path.join(here, 'same-classnames.mjs');
const tc = (...parts) => path.join(fixtures, 'test-count', ...parts);
const sc = (...parts) => path.join(fixtures, 'same-classnames', ...parts);
const tap = process.argv.includes('--tap');

/** Copies a fixture baseline into a fresh temp dir so --update cases never touch the fixture. */
function tempBaseline(fixtureName) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const file = path.join(dir, 'baseline.json');
  fs.copyFileSync(tc(fixtureName), file);
  return file;
}
let lowerUpdateBaseline = null;
let raiseUpdateBaseline = null;

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
];

let failed = 0;
if (tap) console.log(`TAP version 13\n1..${cases.length}`);
for (const [index, c] of cases.entries()) {
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
    console.log(output.replace(/\r\n/g, '\n').replace(/^/gm, '    | '));
  }
}

for (const file of [lowerUpdateBaseline, raiseUpdateBaseline]) {
  if (file) fs.rmSync(path.dirname(file), { recursive: true, force: true });
}

if (tap) {
  console.log(`# tests ${cases.length}\n# pass ${cases.length - failed}\n# fail ${failed}`);
} else {
  console.log(`selftest: ${cases.length - failed}/${cases.length} cases passed`);
}
process.exit(failed > 0 ? 1 : 0);
