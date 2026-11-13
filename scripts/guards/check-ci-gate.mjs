#!/usr/bin/env node

/**
 * Guard (GUARD-07, GUARD-08): no CI job can escape the CI OK aggregate, and
 * no CI run can be skipped in a way that leaves CI OK pending or forged
 *
 * The main ruleset requires one check, `CI OK` (job `ci-ok` at the end of
 * .github/workflows/ci.yml). It is only as strong as its `needs` list: a job
 * that is not in it can fail without turning CI OK red, and a CI OK that an
 * `if:` can skip reports Success. This guard makes both structural. It also
 * keeps the docs-only fast path (D-08) inside the workflow: a workflow-level
 * path filter would skip the whole run and leave CI OK pending forever.
 *
 * Checks (all paths relative to --root):
 *   1. .github/workflows/ci.yml exists
 *   2. ci.yml has exactly one job named CI OK; its id is `ci-ok` and its
 *      job-level `if:` is exactly `always()` (`${{ always() }}` is the same
 *      expression and is accepted)
 *   3. `ci-ok.needs` equals, as a set, every other job id under `jobs:`
 *      (order never matters; a missing or an extra id always fails)
 *   4. the ci-ok job runs jq with `-f scripts/ci/ci-ok.jq`, and that file exists
 *   5. no workflow other than ci.yml has a job whose `name:` includes CI OK
 *      (a second CI OK that an `if:` skips would report Success). The one
 *      exception, CI_OK_ELSEWHERE_ALLOWED, is the skip-marker relay (D-06,
 *      job `relay` in ci-skip-relay.yml), and only while CI OK sits inside
 *      a single `${{ ... }}` name expression that reads `needs.`, on a
 *      job that has `needs:` (so the name is CI OK only when an earlier job
 *      said so; a literal `name: CI OK` there still fails)
 *   6. no workflow line grants `checks: write`, directly or through
 *      `permissions: write-all` (such a job could post a forged CI OK check run)
 *   7. every job's token scope is explicit: the workflow has a top-level
 *      `permissions:` block or the job has its own (the repository default
 *      token may include checks: write)
 *   8. ci.yml's `on:` block declares `push`, `pull_request` and
 *      `workflow_dispatch` (the skip-marker relay, D-06, dispatches ci.yml)
 *   9. no `paths:` or `paths-ignore:` key appears anywhere in ci.yml's `on:`
 *      block (D-08: a workflow skipped by its trigger filter never reports)
 *  10. the job ids whose `if:` reads `needs.changes.outputs.docs_only` equal,
 *      as a set, the quoted ids in the single `IN(...)` call of
 *      scripts/ci/ci-ok.jq, and each of those jobs lists `changes` in
 *      `needs` (a heavy job that skips on docs-only but is missing from the
 *      jq list would fail CI OK; one in the list without the condition
 *      would let the jq accept a skip nobody intended)
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
/**
 * Rule 5 exceptions as { file, job } (file name under .github/workflows): the
 * skip-marker relay (D-06 option A), whose job is named CI OK only on a PR head
 * GitHub skipped. Allowed only in the needs-based name-expression shape.
 */
const RELAY_FILE = 'ci-skip-relay.yml';
const RELAY_JOB = 'relay';
const CI_OK_ELSEWHERE_ALLOWED = [{ file: RELAY_FILE, job: RELAY_JOB }];
const CHECKS_WRITE = /(^|[\s{,])['"]?checks['"]?\s*:\s*['"]?write\b/;
const WRITE_ALL = /(^|[\s{,])['"]?permissions['"]?\s*:\s*['"]?write-all\b/;
/** Rule 8: the relay (D-06) dispatches ci.yml, so workflow_dispatch must stay. */
const REQUIRED_TRIGGERS = ['push', 'pull_request', 'workflow_dispatch'];
/** Rule 9: a `paths:` or `paths-ignore:` key anywhere in the `on:` block. */
const PATHS_FILTER = /(^|[\s{,])['"]?(paths|paths-ignore)['"]?\s*:/;
/** Rule 10: the classifier job and the output the heavy jobs' `if:` reads. */
const CHANGES_ID = 'changes';
const DOCS_ONLY_OUTPUT = 'needs.changes.outputs.docs_only';

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

/** The top-level `on:` key and its body as [{ line, index }] (key line first), or null. */
function readOnBlock(lines) {
  const start = lines.findIndex((l) => /^['"]?on['"]?\s*:/.test(l));
  if (start === -1) return null;
  const block = [{ line: lines[start], index: start }];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() !== '' && indentOf(line) === 0) break;
    block.push({ line, index: i });
  }
  return block;
}

/**
 * The event names an `on:` block declares: block-map keys one level down, or
 * the inline value as a scalar (`on: push`), a flow list (`[push, ...]`) or
 * the top-level keys of a flow map (`{ push: {...}, ... }`).
 */
function readTriggers(block) {
  const inline = block[0].line.replace(/^['"]?on['"]?\s*:\s*/, '').trim();
  if (inline === '') {
    const body = block.slice(1).filter(({ line }) => line.trim() !== '');
    if (body.length === 0) return [];
    const childIndent = indentOf(body[0].line);
    return body
      .filter(({ line }) => indentOf(line) === childIndent)
      .map(({ line }) => /^\s*['"]?([A-Za-z_]+)['"]?\s*:?/.exec(line)?.[1])
      .filter(Boolean);
  }
  const text = [inline, ...block.slice(1).map(({ line }) => line.trim())].join(' ');
  if (!text.startsWith('[') && !text.startsWith('{')) return [unquote(text)];
  // Flow forms: names at nesting depth 1, before a `:` (map) or a `,`/`]` (list).
  const names = [];
  let depth = 0;
  let token = '';
  let atKey = true;
  for (const c of text) {
    if (c === '[' || c === '{') {
      if (depth === 1 && atKey && token.trim()) names.push(unquote(token));
      depth++;
      token = '';
    } else if (c === ']' || c === '}') {
      if (depth === 1 && atKey && token.trim()) names.push(unquote(token));
      depth--;
      token = '';
    } else if (depth === 1 && c === ',') {
      if (atKey && token.trim()) names.push(unquote(token));
      token = '';
      atKey = true;
    } else if (depth === 1 && c === ':') {
      if (atKey && token.trim()) names.push(unquote(token));
      token = '';
      atKey = false;
    } else if (depth === 1) {
      token += c;
    }
  }
  return names;
}

/**
 * The quoted job ids inside the single IN(...) call of scripts/ci/ci-ok.jq
 * (comments stripped), [] when the file has no IN(...) call, or null when the
 * file cannot be read (rule 4 already reports that).
 */
function readJqHeavyList() {
  let text;
  try {
    text = fs.readFileSync(path.join(root, CI_OK_JQ), 'utf-8');
  } catch {
    return null;
  }
  const code = text
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, ''))
    .join('\n');
  const calls = [...code.matchAll(/\bIN\(([^)]*)\)/g)];
  if (calls.length > 1) {
    fail(CI_OK_JQ, `has ${calls.length} IN(...) calls; the heavy-job list must be exactly one`);
  }
  if (calls.length === 0) return [];
  return [...calls[0][1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
}

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

    // 10. the docs-only skip set equals the heavy-job list in ci-ok.jq
    const docsOnlyJobs = jobs.filter((j) => (jobKey(j, 'if')?.value ?? '').includes(DOCS_ONLY_OUTPUT));
    for (const j of docsOnlyJobs) {
      if (!readNeeds(j).includes(CHANGES_ID)) {
        fail(CI_FILE, `job ${j.id} has the docs-only condition but does not need ${CHANGES_ID}`);
      }
    }
    const heavy = readJqHeavyList();
    if (heavy !== null) {
      const skipSet = docsOnlyJobs.map((j) => j.id).sort();
      const jqSet = [...new Set(heavy)].sort();
      if (skipSet.join(',') !== jqSet.join(',')) {
        fail(
          CI_FILE,
          `docs-only skip set differs from ${CI_OK_JQ} (jobs with the ${DOCS_ONLY_OUTPUT} condition: ${skipSet.join(', ') || 'none'}; IN(...) list: ${jqSet.join(', ') || 'none'})`,
        );
      }
    }
  }

  // 8. push, pull_request and workflow_dispatch triggers
  // 9. no workflow-level paths or paths-ignore filter
  const on = readOnBlock(ciLines);
  if (!on) {
    fail(CI_FILE, 'has no top-level on: block');
  } else {
    const triggers = readTriggers(on);
    for (const t of REQUIRED_TRIGGERS) {
      if (!triggers.includes(t)) fail(CI_FILE, `ci.yml has no ${t} trigger`);
    }
    for (const { line, index } of on) {
      const m = PATHS_FILTER.exec(line);
      if (m) fail(CI_FILE, `workflow-level paths filter in ${CI_FILE} (line ${index + 1} declares ${m[2]}:)`);
    }
  }
}

/** Every workflow under .github/workflows as { file, rel, lines, jobs }. */
function readWorkflows() {
  let files = [];
  try {
    files = fs
      .readdirSync(path.join(root, WORKFLOW_DIR))
      .filter((f) => /\.ya?ml$/.test(f))
      .sort();
  } catch {
    return [];
  }
  return files.flatMap((file) => {
    const rel = `${WORKFLOW_DIR}/${file}`;
    const lines = readLines(rel);
    if (lines === null) {
      fail(rel, 'cannot be read');
      return [];
    }
    return [{ file, rel, lines, jobs: readJobs(lines) ?? [] }];
  });
}

/**
 * True when a job's name is one `${{ ... }}` expression that reads `needs.`
 * and the job has `needs:`: its CI OK then depends on an earlier job's output.
 */
function isNeedsNameExpression(job) {
  const name = jobName(job) ?? '';
  const m = /^\$\{\{(.*)\}\}$/.exec(name);
  if (!m || m[1].includes('}}') || m[1].includes('${{')) return false;
  return m[1].includes(CI_OK_NAME) && /\bneeds\./.test(m[1]) && readNeeds(job).length > 0;
}

/**
 * Jobs outside ci.yml whose name includes CI OK, except the `allowed` { file, job }
 * pairs in the needs-based name-expression shape. Returns [{ rel, job, shape }],
 * where `shape` is true for an allowed pair that broke the shape.
 */
function findCiOkOutsideCi(workflows, allowed) {
  const found = [];
  for (const { file, rel, jobs } of workflows) {
    if (file === 'ci.yml') continue;
    for (const job of jobs) {
      if (!(jobName(job) ?? '').includes(CI_OK_NAME)) continue;
      const isAllowed = allowed.some((a) => a.file === file && a.job === job.id);
      if (isAllowed && isNeedsNameExpression(job)) continue;
      found.push({ rel, job: job.id, shape: isAllowed });
    }
  }
  return found;
}

const workflows = readWorkflows();

// 5. CI OK is emitted by ci.yml only
for (const { rel, job, shape } of findCiOkOutsideCi(workflows, CI_OK_ELSEWHERE_ALLOWED)) {
  fail(
    rel,
    shape
      ? `a job named CI OK outside ci.yml: ${rel} (job ${job}); the relay may carry CI OK only inside one \${{ }} name expression that reads needs., on a job with needs:`
      : `a job named CI OK outside ci.yml: ${rel} (job ${job})`,
  );
}

for (const { rel, lines, jobs } of workflows) {
  // 6. no checks: write, directly or through write-all
  lines.forEach((line, i) => {
    if (CHECKS_WRITE.test(line)) fail(rel, `line ${i + 1} grants checks: write`);
    if (WRITE_ALL.test(line)) fail(rel, `line ${i + 1} grants checks: write (permissions: write-all)`);
  });

  // 7. an explicit token scope for every job
  if (!lines.some((l) => /^permissions\s*:/.test(l))) {
    for (const job of jobs) {
      if (!jobKey(job, 'permissions')) {
        fail(rel, `job ${job.id} has no permissions block and the workflow sets none (the default token may grant checks: write)`);
      }
    }
  }
}

if (failures.length > 0) {
  for (const f of failures) console.error(`ci-gate: FAIL ${f}`);
  console.error(`ci-gate: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('ci-gate: OK');
