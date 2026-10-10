#!/usr/bin/env node

/**
 * Guard self-test: proves every guard in scripts/guards/ can fail
 *
 * Each case spawns `node <guard> ...args` against a fixture under
 * scripts/guards/__selftest__/ and compares the exit code (and, where
 * given, required output fragments) with what the case expects. A guard
 * that cannot fail on a bad fixture is not a guard.
 *
 * Case shape: { name, guard, args, expectExit, expectOutput?, setup?, check? }
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
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, '__selftest__');
const PARITY = path.join(here, 'check-install-parity.mjs');

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
];

let failed = 0;
for (const c of cases) {
  const extraArgs = c.setup ? c.setup() ?? [] : [];
  const result = spawnSync(process.execPath, [c.guard, ...c.args, ...extraArgs], {
    encoding: 'utf-8',
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

  if (problems.length === 0) {
    console.log(`PASS ${c.name}`);
  } else {
    failed++;
    console.log(`FAIL ${c.name}`);
    for (const p of problems) console.log(`  - ${p}`);
    console.log(output.replace(/^/gm, '    | '));
  }
}

console.log(`selftest: ${cases.length - failed}/${cases.length} cases passed`);
process.exit(failed > 0 ? 1 : 0);
