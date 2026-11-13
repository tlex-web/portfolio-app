#!/usr/bin/env node

/**
 * Guard (GUARD-07): no CI job can escape the CI OK aggregate
 *
 * The main ruleset requires one check, `CI OK` (job `ci-ok` at the end of
 * .github/workflows/ci.yml). It is only as strong as its `needs` list: a job
 * that is not in it can fail without turning CI OK red, and a CI OK that an
 * `if:` can skip reports Success. This guard makes both structural.
 *
 * Checks (all paths relative to --root):
 *   1. .github/workflows/ci.yml exists
 *   2. ci.yml has exactly one job named CI OK; its id is `ci-ok` and its
 *      job-level `if:` is exactly `always()` (`${{ always() }}` is the same
 *      expression and is accepted)
 *   3. `ci-ok.needs` equals, as a set, every other job id under `jobs:`
 *      (order never matters; a missing or an extra id always fails)
 *   4. the ci-ok job runs jq with `-f scripts/ci/ci-ok.jq`, and that file exists
 *
 * Usage:
 *   node scripts/guards/check-ci-gate.mjs [--root <dir>]
 *   (Runs from `npm run lint` via `npm run guard:ci`)
 *
 * Exit code 1 on any failure (one line per failure), 0 with "ci-gate: OK".
 *
 * YAML is read line by line (no YAML library): comments are stripped, job ids
 * are the keys one level under `jobs:`, and `needs:` is read in flow
 * (`[a, b]`, also across lines), scalar (`needs: a`) and block-list form.
 */

import fs from 'fs';
import path from 'path';

const WORKFLOW_DIR = '.github/workflows';
const CI_FILE = `${WORKFLOW_DIR}/ci.yml`;
const CI_OK_ID = 'ci-ok';
const CI_OK_NAME = 'CI OK';
const CI_OK_JQ = 'scripts/ci/ci-ok.jq';

function parseArgs(argv) {
  const args = { root: process.cwd() };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') {
      const value = argv[i + 1];
      if (!value) {
        console.error('ci-gate: --root needs a directory');
        process.exit(1);
      }
      args.root = path.resolve(value);
      i++;
    } else {
      console.error(`ci-gate: unknown argument ${argv[i]}`);
      process.exit(1);
    }
  }
  return args;
}

const { root } = parseArgs(process.argv.slice(2));
const failures = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);

/** Reads a workflow as comment-stripped lines (line count preserved), or null. */
function readLines(rel) {
  let text;
  try {
    text = fs.readFileSync(path.join(root, rel), 'utf-8');
  } catch {
    return null;
  }
  return text.split(/\r?\n/).map(stripComment);
}

/**
 * Drops a YAML comment: a `#` at the start of the line or after whitespace,
 * outside a quoted scalar. A quote opens a scalar only at a value start (line
 * start, after whitespace, `[`, `{` or `,`), so `Tim's` stays plain text.
 */
function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const prev = i === 0 ? ' ' : line[i - 1];
    if (quote) {
      if (c === quote) quote = null;
    } else if ((c === '"' || c === "'") && /[\s[{,]/.test(prev)) {
      quote = c;
    } else if (c === '#' && /\s/.test(prev)) {
      return line.slice(0, i).trimEnd();
    }
  }
  return line;
}

const indentOf = (line) => line.length - line.trimStart().length;
const unquote = (value) => value.trim().replace(/^(['"])(.*)\1$/, '$2').trim();

/** `${{ always() }}` and `always()` are the same expression. */
function normalizeIf(value) {
  const bare = unquote(value);
  const m = /^\$\{\{\s*(.*?)\s*\}\}$/.exec(bare);
  return (m ? m[1] : bare).replace(/\s+/g, ' ');
}

/**
 * Returns [{ id, keyIndent, lines }] for every job under the top-level
 * `jobs:` key, or null when there is no `jobs:` key. `lines` are the job's
 * body lines; `keyIndent` is the indentation of its own keys.
 */
function readJobs(lines) {
  const start = lines.findIndex((l) => /^jobs:\s*$/.test(l));
  if (start === -1) return null;
  const jobs = [];
  let jobIndent = null;
  let current = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    const indent = indentOf(line);
    if (indent === 0) break; // next top-level key
    if (jobIndent === null) jobIndent = indent;
    if (indent < jobIndent) break;
    if (indent === jobIndent) {
      const m = /^\s*([A-Za-z0-9_-]+)\s*:/.exec(line);
      current = { id: m ? m[1] : line.trim(), keyIndent: null, lines: [] };
      jobs.push(current);
      continue;
    }
    if (current.keyIndent === null) current.keyIndent = indent;
    current.lines.push(line);
  }
  return jobs;
}

/** A job-level key: { value, index } of the line at the job's key indent, or null. */
function jobKey(job, key) {
  const re = new RegExp(`^\\s*${key}\\s*:\\s*(.*)$`);
  for (let i = 0; i < job.lines.length; i++) {
    const line = job.lines[i];
    if (indentOf(line) !== job.keyIndent) continue;
    const m = re.exec(line);
    if (m) return { value: m[1].trim(), index: i };
  }
  return null;
}

/** The job ids a job `needs`, in flow, scalar or block-list form. */
function readNeeds(job) {
  const entry = jobKey(job, 'needs');
  if (!entry) return [];
  let value = entry.value;
  if (value.startsWith('[')) {
    for (let i = entry.index + 1; !value.includes(']') && i < job.lines.length; i++) {
      value += ` ${job.lines[i].trim()}`;
    }
    const inner = value.slice(1, value.includes(']') ? value.indexOf(']') : undefined);
    return inner.split(',').map(unquote).filter(Boolean);
  }
  if (value !== '') return [unquote(value)];
  const ids = [];
  for (let i = entry.index + 1; i < job.lines.length; i++) {
    const line = job.lines[i];
    if (line.trim() === '') continue;
    if (indentOf(line) <= job.keyIndent) break;
    const m = /^\s*-\s*(.+)$/.exec(line);
    if (m) ids.push(unquote(m[1]));
  }
  return ids;
}

/** The shell text of every `run:` step (block scalars included). */
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
        if (indentOf(line) <= keyIndent) break;
        block.push(line.trim());
      }
      commands.push(block.join('\n'));
    } else {
      commands.push(unquote(value));
    }
  }
  return commands;
}

const jobName = (job) => {
  const entry = jobKey(job, 'name');
  return entry ? unquote(entry.value) : null;
};

// 1. ci.yml exists
const ciLines = readLines(CI_FILE);
if (ciLines === null) {
  fail(CI_FILE, 'cannot be read');
} else {
  const jobs = readJobs(ciLines);
  if (!jobs || jobs.length === 0) {
    fail(CI_FILE, 'has no jobs under a top-level "jobs:" key');
  } else {
    // 2. exactly one CI OK, id ci-ok, if: always()
    const named = jobs.filter((j) => (jobName(j) ?? '').includes(CI_OK_NAME));
    const ciOk = jobs.find((j) => j.id === CI_OK_ID);
    if (named.length === 0) fail(CI_FILE, `no job is named ${CI_OK_NAME}`);
    if (named.length > 1) {
      fail(CI_FILE, `${named.length} jobs are named ${CI_OK_NAME} (${named.map((j) => j.id).join(', ')}); exactly one may be`);
    }
    for (const j of named) {
      if (j.id !== CI_OK_ID) fail(CI_FILE, `the job named ${jobName(j)} has id ${j.id}, expected ${CI_OK_ID}`);
      else if (jobName(j) !== CI_OK_NAME) fail(CI_FILE, `${CI_OK_ID} is named "${jobName(j)}", expected exactly "${CI_OK_NAME}"`);
    }
    if (!ciOk) {
      fail(CI_FILE, `no job has id ${CI_OK_ID}`);
    } else {
      if (!named.includes(ciOk)) fail(CI_FILE, `${CI_OK_ID} is named ${JSON.stringify(jobName(ciOk))}, expected "${CI_OK_NAME}"`);
      const cond = jobKey(ciOk, 'if');
      // A job skipped by its `if:` reports Success, so anything but always()
      // could let CI OK pass without running; no `if:` at all means success().
      if (!cond) {
        fail(CI_FILE, `CI OK must use if: always() (${CI_OK_ID} has no job-level if:, which defaults to success())`);
      } else if (normalizeIf(cond.value) !== 'always()') {
        fail(CI_FILE, `CI OK must use if: always() (${CI_OK_ID} has if: ${cond.value})`);
      }

      // 3. needs = every other job id, as sets
      const needs = new Set(readNeeds(ciOk));
      const others = jobs.filter((j) => j !== ciOk).map((j) => j.id);
      for (const id of others) {
        if (!needs.has(id)) fail(CI_FILE, `ci-ok needs is missing ${id}`);
      }
      for (const id of needs) {
        if (!others.includes(id)) fail(CI_FILE, `ci-ok needs lists unknown job ${id}`);
      }

      // 4. the verdict comes from scripts/ci/ci-ok.jq
      const runsJq = extractRunCommands(ciOk.lines).some((cmd) =>
        cmd.split('\n').some((l) => /(^|[\s|;&(])jq\s(.*\s)?-f\s+['"]?scripts\/ci\/ci-ok\.jq['"]?(\s|$)/.test(l)),
      );
      if (!runsJq) fail(CI_FILE, `${CI_OK_ID} does not run jq with -f ${CI_OK_JQ}`);
      if (!fs.existsSync(path.join(root, CI_OK_JQ))) fail(CI_OK_JQ, 'does not exist');
    }
  }
}

if (failures.length > 0) {
  for (const f of failures) console.error(`ci-gate: FAIL ${f}`);
  console.error(`ci-gate: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('ci-gate: OK');
