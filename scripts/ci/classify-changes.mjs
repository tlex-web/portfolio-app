#!/usr/bin/env node

/**
 * Docs-only classifier for the `changes` job in .github/workflows/ci.yml
 * (GUARD-08, D-08, D-09)
 *
 * A diff is docs-only when every changed path is under `.planning/` or is one
 * of the exact files in DOCS_ONLY_FILES. Then the six heavy CI jobs skip and
 * scripts/ci/ci-ok.jq accepts those skips. Anything it cannot be sure of runs
 * the full CI:
 *   - an empty list (nothing to classify, or the diff could not be read);
 *   - a truncated list (the compare API returns at most 300 files);
 *   - any path outside the list. There is no extension rule: the READMEs
 *     under scripts/guards/__selftest__/ are guard fixtures, so code.
 * The caller passes the old name of every renamed file as well, so a move
 * from lib/ into .planning/ still counts as a code change.
 *
 * Usage (CLI):
 *   <newline-separated paths> | node scripts/ci/classify-changes.mjs [--truncated]
 *   Prints `docs_only=<true|false>` and `reason=<text>`; exit 0. An unknown
 *   argument exits 1. Paths are only compared as strings, never evaluated.
 */

import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

/** The D-09 files outside .planning/ that count as docs (exact repo-relative paths). */
export const DOCS_ONLY_FILES = ['README.md', 'AGENTS.md', 'scripts/README.md', 'e2e/visual/README.md', '.github/copilot-instructions.md'];

const PLANNING_PREFIX = '.planning/';

/** True for a `.planning/` path or an exact DOCS_ONLY_FILES entry; false for everything else. */
export function isDocsOnlyPath(p) {
  if (typeof p !== 'string') return false;
  return (p.startsWith(PLANNING_PREFIX) && p.length > PLANNING_PREFIX.length) || DOCS_ONLY_FILES.includes(p);
}

/**
 * Classifies a list of changed paths (new and old names).
 * Returns { docsOnly, reason }; docsOnly is true only when the list is
 * complete, non-empty and every path is docs-only.
 */
export function classify(paths, { truncated = false } = {}) {
  if (!Array.isArray(paths) || paths.length === 0) {
    return { docsOnly: false, reason: 'no changed paths to classify; running the full CI' };
  }
  if (truncated) {
    return { docsOnly: false, reason: `the file list is truncated (${paths.length} paths); running the full CI` };
  }
  const code = paths.find((p) => !isDocsOnlyPath(p));
  if (code !== undefined) {
    return { docsOnly: false, reason: `${JSON.stringify(code)} is not a docs-only path; running the full CI` };
  }
  return { docsOnly: true, reason: `all ${paths.length} changed paths are docs-only; skipping the heavy jobs` };
}

function main(argv) {
  let truncated = false;
  for (const arg of argv) {
    if (arg === '--truncated') {
      truncated = true;
    } else {
      console.error(`classify-changes: unknown argument ${arg}`);
      process.exit(1);
    }
  }
  const input = fs.readFileSync(0, 'utf-8');
  const paths = input.split(/\r?\n/).filter((line) => line !== '');
  const { docsOnly, reason } = classify(paths, { truncated });
  console.log(`docs_only=${docsOnly}`);
  console.log(`reason=${reason.replace(/[\r\n]+/g, ' ')}`);
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) main(process.argv.slice(2));
