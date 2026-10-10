#!/usr/bin/env node

/**
 * CI helper: checks which snapshot PNGs a commit changed (GUARD-02)
 *
 * Used by the re-baseline protocol in e2e/visual/README.md to prove that a
 * baseline commit changed exactly the expected set of PNGs, and only Linux
 * ones.
 *
 * Usage:
 *   node scripts/ci/check-snapshot-commit.mjs [--sha <rev>] [--allow <subdir>]...
 *     [--allow-all] [--allow-deletions] [--none] [--some]
 *
 *   --sha <rev>        commit to inspect (default HEAD)
 *   --allow <subdir>   PNGs may change under e2e/visual/routes.spec.ts-snapshots/<subdir>/
 *                      (repeatable, e.g. --allow photos)
 *   --allow-all        PNGs may change anywhere under e2e/
 *   --allow-deletions  PNGs may be deleted
 *   --none             no PNG may be added or modified (zero-diff commit)
 *   --some             at least one PNG must be added or modified
 *
 * Rules (each violation prints one line):
 *   - every added or modified .png under e2e/ ends in -linux.png
 *   - --none: no PNG is added or modified; --some: at least one is
 *   - an added or modified PNG outside the allowed subdirectories fails
 *     unless --allow-all
 *   - a deleted PNG fails unless --allow-deletions
 * Renames are reported as a deletion plus an addition (git --no-renames).
 *
 * Exit: 0 with "snapshot-commit: OK (<n> changed)", 1 on any violation,
 * 2 when git fails or the arguments are invalid (never a silent pass).
 */

import { execFileSync } from 'child_process';
import { pathToFileURL } from 'url';

export const SNAPSHOT_ROOT = 'e2e/visual/routes.spec.ts-snapshots/';

/** Parses `git show --name-status` output into { status, path } entries. */
export function parseNameStatus(text) {
  const entries = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [code, ...paths] = line.split('\t');
    const status = code.charAt(0);
    if ((status === 'R' || status === 'C') && paths.length === 2) {
      if (status === 'R') entries.push({ status: 'D', path: paths[0] });
      entries.push({ status: 'A', path: paths[1] });
    } else if (paths.length >= 1) {
      entries.push({ status, path: paths[paths.length - 1] });
    }
  }
  return entries;
}

/**
 * Pure rule check.
 * @param entries [{ status: 'A' | 'M' | 'D' | ..., path }] (forward slashes, repo-relative)
 * @param opts { allow?: string[], allowAll?, allowDeletions?, none?, some? }
 * @returns { ok, changed, violations: string[] }
 */
export function evaluateSnapshotChanges(entries, opts = {}) {
  const allow = (opts.allow ?? []).map((d) => d.replace(/^\/+|\/+$/g, ''));
  const pngs = (entries ?? []).filter((e) => e.path.startsWith('e2e/') && e.path.toLowerCase().endsWith('.png'));
  const written = pngs.filter((e) => e.status !== 'D');
  const deleted = pngs.filter((e) => e.status === 'D');
  const violations = [];

  for (const e of written) {
    if (!e.path.endsWith('-linux.png')) {
      violations.push(`${e.path}: only -linux.png baselines may be committed`);
    }
    if (opts.none) {
      violations.push(`${e.path}: ${e.status === 'A' ? 'added' : 'modified'} in a commit that must not change PNGs (--none)`);
    } else if (!opts.allowAll && !allow.some((d) => e.path.startsWith(`${SNAPSHOT_ROOT}${d}/`))) {
      const where = allow.length ? `--allow ${allow.join(', ')}` : 'no --allow given';
      violations.push(`${e.path}: outside the allowed snapshot directories (${where})`);
    }
  }
  if (opts.some && written.length === 0) {
    violations.push('no PNG was added or modified, but --some requires at least one');
  }
  if (!opts.allowDeletions) {
    for (const e of deleted) violations.push(`${e.path}: deleted (pass --allow-deletions if intended)`);
  }
  return { ok: violations.length === 0, changed: pngs.length, violations };
}

function parseArgs(argv) {
  const opts = { sha: 'HEAD', allow: [], allowAll: false, allowDeletions: false, none: false, some: false };
  const flags = { '--allow-all': 'allowAll', '--allow-deletions': 'allowDeletions', '--none': 'none', '--some': 'some' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (flags[arg]) {
      opts[flags[arg]] = true;
    } else if (arg === '--sha' || arg === '--allow') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) fatal(`${arg} needs a value`);
      if (arg === '--sha') opts.sha = value;
      else opts.allow.push(value);
      i++;
    } else {
      fatal(`unknown argument ${arg}`);
    }
  }
  if (opts.none && opts.some) fatal('--none and --some contradict each other');
  return opts;
}

function fatal(message) {
  console.error(`snapshot-commit: ${message}`);
  process.exit(2);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  let output;
  try {
    output = execFileSync('git', ['show', '--no-renames', '--name-status', '--format=', opts.sha, '--', 'e2e'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    fatal(`git show ${opts.sha} failed: ${(err.stderr || err.message).toString().trim()}`);
  }
  const result = evaluateSnapshotChanges(parseNameStatus(output), opts);
  if (result.ok) {
    console.log(`snapshot-commit: OK (${result.changed} changed)`);
    process.exit(0);
  }
  for (const v of result.violations) console.log(`snapshot-commit: FAIL ${v}`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
