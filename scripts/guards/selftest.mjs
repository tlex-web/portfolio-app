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
 *   or { name, fn } for pure helpers (fn returns, or resolves to, an error string or null; no spawn)
 *   - input: optional, piped to the guard's stdin
 *   - nodeArgs: optional, node flags placed before the guard path
 *   - cwd: optional, working directory of the spawn (defaults to this process's cwd)
 *   - setup(): optional, runs before the spawn and may return extra args
 *   - check(output): optional, runs after the spawn with its combined stdout+stderr; returns an error string or null
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
import { fileURLToPath, pathToFileURL } from 'url';
import crypto from 'crypto';
import { createRequire } from 'module';
import proj4 from 'proj4';
import sharp from 'sharp';
import { evaluate, pickRun } from '../ci/check-visual-run.mjs';
import { evaluateSnapshotChanges, snapshotDiffArgs } from '../ci/check-snapshot-commit.mjs';
import { DOCS_ONLY_FILES, classify } from '../ci/classify-changes.mjs';
import { boxes, checkMp4 } from './lib/mp4-boxes.mjs';
import { extractRunBlock, runStep } from './lib/workflow-shell.mjs';
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
/*
 * Telemetry-track MP4 fixtures (generated, synthetic; DATA-15, D-23): each clip
 * is the committed good-mp4 clip with one extra `trak` spliced into its `moov`
 * after the video track, built in memory by a Node `Buffer.concat` (no ffmpeg).
 * The extra track is trak{tkhd, mdia{mdhd, hdlr(<handler>), minf{nmhd,
 * stbl{stsd{<entry>}}}}} with zero timestamps and zero-filled payloads: no camera
 * data, no GPS, no device tags, never a real drone or camera file. A clip is a
 * pure function of the committed clip's bytes, so every run builds the same
 * bytes (a determinism case pins them). Write spliced clips only into temp
 * roots; never write one into scripts/guards/__selftest__/ or commit one,
 * because a real telemetry track carries take-off GPS that git history cannot
 * forget. The walker reads only the hdlr handler; the stsd entry (djmd, dbgi,
 * gpmd, tx3g) mirrors what a DJI or GoPro file holds. Stale stco offsets after
 * the splice do not matter to the walker.
 */
const box = (type, ...payload) => {
  const body = Buffer.concat(payload);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + body.length);
  header.write(type, 4, 'latin1');
  return Buffer.concat([header, body]);
};
/** A FullBox version byte and 24-bit flags. */
const full = (version, flags = 0) => Buffer.from([version, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255]);
const zeros = (n) => Buffer.alloc(n);
/** One non-video track: `handler` in its hdlr (meta, sbtl, text) and one `entry` sample description. */
function trak(handler, entry) {
  const tkhd = box('tkhd', full(0, 3), zeros(80));
  const mdhd = box('mdhd', full(0), zeros(20));
  const hdlr = box('hdlr', full(0), zeros(4), Buffer.from(handler, 'latin1'), zeros(12), Buffer.from('\0'));
  const stsd = box('stsd', full(0), Buffer.from([0, 0, 0, 1]), box(entry, zeros(8)));
  return box('trak', tkhd, box('mdia', mdhd, hdlr, box('minf', box('nmhd', full(0)), box('stbl', stsd))));
}
/** `buf` with track `t` inserted after its first trak and its moov size grown to match. */
function withTrack(buf, t) {
  const all = boxes(buf);
  const moov = all.find((b) => b.type === 'moov');
  const first = all.find((b) => b.type === 'trak');
  const at = first.offset + first.size;
  const out = Buffer.concat([buf.subarray(0, at), t, buf.subarray(at)]);
  out.writeUInt32BE(moov.size + t.length, moov.offset);
  return out;
}
/** The five D-23 telemetry-track kinds: clip name, hdlr handler, stsd entry. */
const TELEMETRY_TRACKS = [
  { name: 'DJI_0001.MP4', handler: 'meta', entry: 'djmd', kind: 'DJI djmd telemetry' },
  { name: 'DJI_0002.MP4', handler: 'meta', entry: 'dbgi', kind: 'DJI dbgi debug' },
  { name: 'GX010001.MP4', handler: 'meta', entry: 'gpmd', kind: 'GoPro gpmd telemetry' },
  { name: 'DJI_0003.MP4', handler: 'sbtl', entry: 'tx3g', kind: 'subtitle (sbtl)' },
  { name: 'DJI_0004.MP4', handler: 'text', entry: 'tx3g', kind: 'text' },
];
const TRACK_MESSAGE = (handler) => `tracks: vide,${handler} (need exactly one video track: no audio, telemetry or subtitle track)`;
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

// app/globals.css vs DOCS_ONLY_FILES (13 WR-02): a diff of only those files skips build and visual
// regression, so none may be a Tailwind source. The scan is Tailwind's own, set up the way
// @tailwindcss/postcss sets it up (its automatic root, **/* at the directory next build runs in,
// plus the stylesheet's compiled @source entries), with the plugin's own node and oxide packages.
const GLOBALS_CSS = path.join(repoRoot, 'app', 'globals.css');
const tailwindRequire = createRequire(createRequire(import.meta.url).resolve('@tailwindcss/postcss'));
/** The repo-relative files Tailwind's scanner reads for `css`, compiled as app/globals.css. */
async function tailwindSourceFiles(css) {
  const { compile } = tailwindRequire('@tailwindcss/node');
  const { Scanner } = tailwindRequire('@tailwindcss/oxide');
  const compiler = await compile(css, { base: path.dirname(GLOBALS_CSS), onDependency: () => {} });
  const root =
    compiler.root === 'none' ? [] : compiler.root === null ? [{ base: repoRoot, pattern: '**/*', negated: false }] : [{ ...compiler.root, negated: false }];
  const scanner = new Scanner({ sources: [...root, ...compiler.sources] });
  scanner.scan();
  return scanner.files.map((f) => path.relative(repoRoot, f).split(path.sep).join('/'));
}
/** The DOCS_ONLY_FILES entries Tailwind reads for `css`, or an error string when the scan reads no app/ source at all. */
async function docsOnlyTailwindSources(css) {
  const files = await tailwindSourceFiles(css);
  if (!files.includes('app/layout.tsx')) return { error: `the scan read ${files.length} files but not app/layout.tsx, so it proves nothing` };
  return { scanned: DOCS_ONLY_FILES.filter((f) => files.includes(f)) };
}

// Workflow shell: the run blocks of the real workflows, run under stub gh/sleep (GUARD-08, 13-VALIDATION G1/G2).
// GUARD_SELFTEST_WORKFLOW_DIR points the cases at a mutated copy of the two workflows, to prove they can fail.
const WORKFLOW_DIR = process.env.GUARD_SELFTEST_WORKFLOW_DIR ?? path.join(repoRoot, '.github', 'workflows');
const RELAY_YML = path.join(WORKFLOW_DIR, 'ci-skip-relay.yml');
const CI_YML = path.join(WORKFLOW_DIR, 'ci.yml');
const detectBlock = () => extractRunBlock(RELAY_YML, { id: 'detect' });
const relayBlock = () => extractRunBlock(RELAY_YML, { name: 'Dispatch ci.yml and mirror its conclusion' });
const classifyBlock = () => extractRunBlock(CI_YML, { name: 'Classify the diff' });
const REPO_SLUG = 'octo/site';
const HEAD_SHA = '1234567890abcdef1234567890abcdef12345678';
const BASE_SHA = 'abcdef1234567890abcdef1234567890abcdef12';
const tail = (r) => `(exit ${r.status}; stdout ${JSON.stringify(r.stdout.trim())}; stderr ${JSON.stringify(r.stderr.trim())}; calls ${JSON.stringify(r.calls)})`;
/** `${problemsOf(problems)} ${tail(r)}` when there are problems, else null. */
const withTail = (problems, r) => (problems.length === 0 ? null : `${problems.join('; ')} ${tail(r)}`);

/** The detect step on a head commit `msg`; null when GITHUB_OUTPUT gets exactly skipped=<expected>. */
function detectCase(msg, expected, { runs = '[]' } = {}) {
  const r = runStep(detectBlock(), { env: { GH_TOKEN: 'dummy', REPO: REPO_SLUG, SHA: HEAD_SHA, STUB_MSG: msg, STUB_RUNS: runs } });
  const problems = [];
  if (r.status !== 0) problems.push(`expected exit 0, got ${r.status}`);
  if (r.output !== `skipped=${expected}\n`) problems.push(`GITHUB_OUTPUT is ${JSON.stringify(r.output)}, expected skipped=${expected}`);
  if (!r.calls.some((c) => c.startsWith(`gh api -X GET repos/${REPO_SLUG}/actions/runs `) && c.includes(`head_sha=${HEAD_SHA}`) && c.includes('event=pull_request'))) {
    problems.push('the runs API was not queried for this SHA and event pull_request');
  }
  return withTail(problems, r);
}
/** The detect step on a head without a usable marker: skipped=false and no wait, no runs query. */
function detectNoMarkerCase(msg) {
  const r = runStep(detectBlock(), { env: { GH_TOKEN: 'dummy', REPO: REPO_SLUG, SHA: HEAD_SHA, STUB_MSG: msg, STUB_RUNS: '[]' } });
  const problems = [];
  if (r.status !== 0) problems.push(`expected exit 0, got ${r.status}`);
  if (r.output !== 'skipped=false\n') problems.push(`GITHUB_OUTPUT is ${JSON.stringify(r.output)}, expected skipped=false`);
  if (r.calls.some((c) => c.startsWith('sleep') || c.includes('/actions/runs'))) problems.push('the step waited or queried runs for a message with no marker');
  const error = withTail(problems, r);
  return error && `message ${JSON.stringify(msg)}: ${error}`;
}
/** First non-null result of fn over each item (stops at the first problem). */
const firstProblem = (items, fn) => {
  for (const item of items) {
    const error = fn(item);
    if (error) return error;
  }
  return null;
};

const RELAY_RUN = { id: 4242, head_sha: HEAD_SHA, created_at: '2999-01-01T00:00:00Z' };
const relayEnv = (over = {}) => ({
  GH_TOKEN: 'dummy',
  REPO: REPO_SLUG,
  HEAD_REPO: REPO_SLUG,
  REF: 'feature/ship-note',
  SHA: HEAD_SHA,
  STUB_DISPATCH_RUNS: JSON.stringify([RELAY_RUN]),
  ...over,
});
const runRelay = (over) => runStep(relayBlock(), { env: relayEnv(over) });
const dispatchCalls = (r) => r.calls.filter((c) => c.startsWith('gh workflow run'));
const pollCalls = (r) => r.calls.filter((c) => c.includes('/actions/workflows/ci.yml/runs'));
/** A fixed runner clock for the lookup cases (13 WR-04): 2030-01-01T00:00:10Z as epoch seconds. */
const RELAY_NOW = Date.UTC(2030, 0, 1, 0, 0, 10) / 1000;
/** GitHub's created_at for an instant `offset` seconds from RELAY_NOW (second resolution, as the API gives it). */
const stampAt = (offset) => new Date((RELAY_NOW + offset) * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
/** The relay under RELAY_NOW with these dispatched runs; null when it mirrors run `id` and its poll filter holds no SHA. */
function relayMirrors(runs, id) {
  const r = runRelay({ STUB_NOW: String(RELAY_NOW), STUB_DISPATCH_RUNS: JSON.stringify(runs), STUB_CONCLUSION: 'success' });
  const problems = [];
  if (r.status !== 0) problems.push(`expected exit 0, got ${r.status}`);
  if (!r.calls.includes(`gh run watch ${id} --repo ${REPO_SLUG} --exit-status --interval 60`)) problems.push(`run ${id} was not watched`);
  if (!r.stdout.includes(`Mirroring CI run ${id} on ${HEAD_SHA}`)) problems.push(`no mirroring line for run ${id}`);
  if (pollCalls(r).some((c) => c.includes(HEAD_SHA))) problems.push('the head SHA was interpolated into the poll (jq must read it from env)');
  return withTail(problems, r);
}

/**
 * The classify step with a canned compare body (and, when given, a separate one for a
 * compare against main); null when it exits 0 with GITHUB_OUTPUT exactly docs_only=<expected>.
 */
function changesCase(compare, expected, { env = {}, calls, compareMain } = {}) {
  const r = runStep(classifyBlock(), {
    cwd: repoRoot,
    compare,
    compareMain,
    env: { GH_TOKEN: 'dummy', REPO: REPO_SLUG, EVENT: 'pull_request', BASE: BASE_SHA, HEAD: HEAD_SHA, ...env },
  });
  const problems = [];
  if (r.status !== 0) problems.push(`expected exit 0, got ${r.status}`);
  if (r.output !== `docs_only=${expected}\n`) problems.push(`GITHUB_OUTPUT is ${JSON.stringify(r.output)}, expected docs_only=${expected}`);
  if (calls && JSON.stringify(r.calls) !== JSON.stringify(calls)) problems.push(`gh calls ${JSON.stringify(r.calls)}, expected ${JSON.stringify(calls)}`);
  return withTail(problems, r);
}
const filesOf = (...names) => ({ files: names.map((filename) => (typeof filename === 'string' ? { filename } : filename)) });
const manyDocs = (n) => filesOf(...Array.from({ length: n }, (_, i) => `.planning/phases/note-${i}.md`));

const WORKFLOW_SHELL_CASES = [
  // detect (G1)
  ...[
    ['[skip ci]', 'Ship note [skip ci]'],
    ['[ci skip]', 'Ship note [ci skip]'],
    ['[no ci]', 'Ship note [no ci]'],
    ['[skip actions]', 'Ship note [skip actions]'],
    ['[actions skip]', 'Ship note [actions skip]'],
  ].map(([marker, msg]) => ({
    name: `workflow-shell detect: ${marker} with no pull_request CI run gives skipped=true`,
    fn: () => detectCase(msg, 'true'),
  })),
  {
    name: 'workflow-shell detect: a marker in another letter case, or in the body, still gives skipped=true',
    fn: () => firstProblem(['Ship note [SKIP CI]', 'subject\n\nbody text [Actions Skip] more'], (msg) => detectCase(msg, 'true')),
  },
  {
    name: 'workflow-shell detect: the skip-checks: true and skip-checks:true trailers give skipped=true, CRLF and letter case included',
    fn: () =>
      firstProblem(['Ship note\n\nskip-checks: true', 'Ship note\n\nskip-checks:true', 'Ship note\r\n\r\nSkip-Checks: TRUE\r\n'], (msg) => detectCase(msg, 'true')),
  },
  {
    name: 'workflow-shell detect: no marker gives skipped=false without waiting or querying runs',
    fn: () => firstProblem(['Ship note', 'fix: skip the CI step\n\nbody mentions skipping CI'], detectNoMarkerCase),
  },
  {
    name: 'workflow-shell detect: near misses (skip ci unbracketed, [skip-ci], [skipci], inline or false skip-checks) give skipped=false',
    fn: () =>
      firstProblem(
        ['Ship note skip ci', 'Ship note [skip-ci]', 'Ship note [ skip ci ]', 'note: skip-checks: true', 'skip-checks: true please', 'skip-checks: false'],
        detectNoMarkerCase,
      ),
  },
  {
    name: 'workflow-shell detect: a marker with a pull_request CI run already on the SHA gives skipped=false',
    fn: () => detectCase('Ship note [skip ci]', 'false', { runs: '[{"name":"CI","id":7}]' }),
  },
  {
    name: 'workflow-shell detect: a run of another workflow does not count, so the marker still gives skipped=true',
    fn: () => detectCase('Ship note [skip ci]', 'true', { runs: '[{"name":"CodeQL","id":8}]' }),
  },
  {
    name: 'workflow-shell detect: a failing runs API fails the step and writes no skipped= line',
    fn: () => {
      const r = runStep(detectBlock(), { env: { GH_TOKEN: 'dummy', REPO: REPO_SLUG, SHA: HEAD_SHA, STUB_MSG: 'Ship note [skip ci]', STUB_RUNS_FAIL: '1' } });
      const problems = [];
      if (r.status === 0) problems.push('expected a non-zero exit');
      if (r.output.includes('skipped=')) problems.push(`GITHUB_OUTPUT holds ${JSON.stringify(r.output)}`);
      if (!r.calls.some((c) => c.includes('/actions/runs '))) problems.push('the runs API was never called');
      return withTail(problems, r);
    },
  },
  // relay (G1)
  {
    name: 'workflow-shell relay: a fork head exits 1 with the fork error and never calls gh',
    fn: () => {
      const r = runRelay({ HEAD_REPO: 'mallory/site' });
      const problems = [];
      if (r.status !== 1) problems.push(`expected exit 1, got ${r.status}`);
      if (!r.stdout.includes('::error::This fork PR head carries a CI skip marker')) problems.push('no fork ::error:: message');
      if (r.calls.length !== 0) problems.push(`gh or sleep was called: ${JSON.stringify(r.calls)}`);
      return withTail(problems, r);
    },
  },
  {
    name: 'workflow-shell relay: a same-repo head dispatches ci.yml on its ref with these exact arguments and mirrors a success',
    fn: () => {
      const r = runRelay({ STUB_CONCLUSION: 'success' });
      const problems = [];
      if (r.status !== 0) problems.push(`expected exit 0, got ${r.status}`);
      if (JSON.stringify(dispatchCalls(r)) !== JSON.stringify([`gh workflow run ci.yml --repo ${REPO_SLUG} --ref feature/ship-note`])) problems.push(`dispatch calls: ${JSON.stringify(dispatchCalls(r))}`);
      if (!r.calls.includes(`gh run watch 4242 --repo ${REPO_SLUG} --exit-status --interval 60`)) problems.push('the dispatched run was not watched');
      if (!r.calls.includes(`gh api repos/${REPO_SLUG}/actions/runs/4242 --jq .conclusion`)) problems.push('the conclusion was not read');
      if (!r.stdout.includes(`Mirroring CI run 4242 on ${HEAD_SHA}`)) problems.push('no mirroring line');
      return withTail(problems, r);
    },
  },
  {
    name: 'workflow-shell relay: a failed CI run exits 1, whether gh run watch or the conclusion check catches it',
    fn: () =>
      firstProblem(['0', '1'], (watch) => {
        const r = runRelay({ STUB_CONCLUSION: 'failure', STUB_WATCH_EXIT: watch });
        return r.status === 1 ? null : `watch exit ${watch}: expected exit 1, got ${r.status} ${tail(r)}`;
      }),
  },
  {
    name: 'workflow-shell relay: a cancelled CI run exits 1 with the concluded message, even when gh run watch exits 0',
    fn: () =>
      firstProblem(['0', '1'], (watch) => {
        const r = runRelay({ STUB_CONCLUSION: 'cancelled', STUB_WATCH_EXIT: watch });
        const problems = [];
        if (r.status !== 1) problems.push(`expected exit 1, got ${r.status}`);
        if (watch === '0' && !r.stdout.includes('concluded cancelled')) problems.push('no "concluded cancelled" message');
        const error = withTail(problems, r);
        return error && `watch exit ${watch}: ${error}`;
      }),
  },
  {
    name: 'workflow-shell relay: only a dispatched run on another SHA (the branch moved) exits 1 after 30 polls and is not watched',
    fn: () => {
      const r = runRelay({ STUB_DISPATCH_RUNS: JSON.stringify([{ ...RELAY_RUN, head_sha: 'f'.repeat(40) }]) });
      const problems = [];
      if (r.status !== 1) problems.push(`expected exit 1, got ${r.status}`);
      if (!r.stdout.includes(`::error::The dispatched CI run 4242 tested ${'f'.repeat(40)}, not this PR head ${HEAD_SHA} (the branch moved).`)) problems.push('no branch-moved message');
      if (pollCalls(r).length !== 30) problems.push(`${pollCalls(r).length} polls, expected 30 (this SHA's run may still appear)`);
      if (r.calls.some((c) => c.startsWith('gh run watch'))) problems.push('the wrong run was watched');
      return withTail(problems, r);
    },
  },
  {
    name: 'workflow-shell relay: a run GitHub stamps 1 s, or up to 10 s, before the runner clock (clock skew) is still mirrored (13 WR-04)',
    fn: () => firstProblem([-1, -10], (offset) => relayMirrors([{ ...RELAY_RUN, created_at: stampAt(offset) }], 4242)),
  },
  {
    name: 'workflow-shell relay: a run stamped at or after the runner clock (runner behind GitHub) is mirrored',
    fn: () => firstProblem([0, 5], (offset) => relayMirrors([{ ...RELAY_RUN, created_at: stampAt(offset) }], 4242)),
  },
  {
    name: 'workflow-shell relay: a run stamped 11 s before the runner clock is outside the window, so it exits 1 after 30 polls',
    fn: () => {
      const r = runRelay({ STUB_NOW: String(RELAY_NOW), STUB_DISPATCH_RUNS: JSON.stringify([{ ...RELAY_RUN, created_at: stampAt(-11) }]) });
      const problems = [];
      if (r.status !== 1) problems.push(`expected exit 1, got ${r.status}`);
      if (!r.stdout.includes('::error::The dispatched CI run did not appear within 5 minutes.')) problems.push('no 5-minute message');
      if (pollCalls(r).length !== 30) problems.push(`${pollCalls(r).length} polls, expected 30`);
      if (r.calls.some((c) => c.startsWith('gh run watch'))) problems.push('a run was watched');
      return withTail(problems, r);
    },
  },
  {
    name: "workflow-shell relay: a run on another SHA in the window never hides this SHA's run, in either order (13 WR-04)",
    fn: () =>
      firstProblem(
        [
          [{ id: 4241, head_sha: 'f'.repeat(40), created_at: stampAt(1) }, { ...RELAY_RUN, created_at: stampAt(3) }],
          [{ ...RELAY_RUN, created_at: stampAt(1) }, { id: 4241, head_sha: 'f'.repeat(40), created_at: stampAt(3) }],
        ],
        (runs) => relayMirrors(runs, 4242),
      ),
  },
  {
    name: 'workflow-shell relay: of two runs on this SHA in the window, the newest is mirrored',
    fn: () => relayMirrors([{ ...RELAY_RUN, id: 4241, created_at: stampAt(1) }, { ...RELAY_RUN, created_at: stampAt(3) }], 4242),
  },
  {
    name: 'workflow-shell relay: no dispatched run within 30 polls exits 1 with the 5-minute message',
    fn: () => {
      const r = runRelay({ STUB_DISPATCH_RUNS: '[]' });
      const polls = r.calls.filter((c) => c.includes('/actions/workflows/ci.yml/runs')).length;
      const sleeps = r.calls.filter((c) => c === 'sleep 10').length;
      const problems = [];
      if (r.status !== 1) problems.push(`expected exit 1, got ${r.status}`);
      if (!r.stdout.includes('::error::The dispatched CI run did not appear within 5 minutes.')) problems.push('no 5-minute message');
      if (polls !== 30 || sleeps !== 30) problems.push(`${polls} polls and ${sleeps} sleeps, expected 30 and 30`);
      if (r.calls.some((c) => c.startsWith('gh run watch'))) problems.push('a run was watched');
      return withTail(problems, r);
    },
  },
  {
    name: 'workflow-shell relay: a run created before the dispatch is ignored, so it exits 1 after 30 polls',
    fn: () => {
      const r = runRelay({ STUB_DISPATCH_RUNS: JSON.stringify([{ ...RELAY_RUN, created_at: '2000-01-01T00:00:00Z' }]) });
      return r.status === 1 && r.stdout.includes('did not appear within 5 minutes') ? null : `expected the stale run to be ignored ${tail(r)}`;
    },
  },
  {
    name: 'workflow-shell relay: a hostile head ref reaches gh only as one literal argument and creates no file',
    fn: () =>
      firstProblem(['x"; touch PWNED; echo "', '$(touch PWNED)', '`touch PWNED`'], (ref) => {
        const r = runRelay({ REF: ref, STUB_CONCLUSION: 'success' });
        const problems = [];
        if (r.status !== 0) problems.push(`expected exit 0, got ${r.status}`);
        if (r.cwdFiles.includes('PWNED')) problems.push('PWNED was created: the ref was executed');
        if (JSON.stringify(dispatchCalls(r)) !== JSON.stringify([`gh workflow run ci.yml --repo ${REPO_SLUG} --ref ${ref}`])) problems.push(`dispatch calls: ${JSON.stringify(dispatchCalls(r))}`);
        if (!r.calls.some((c) => c.includes(`branch=${ref} `))) problems.push('the poll did not carry the ref as one literal field');
        const error = withTail(problems, r);
        return error && `ref ${JSON.stringify(ref)}: ${error}`;
      }),
  },
  // changes / Classify the diff (G2)
  {
    name: 'workflow-shell changes: workflow_dispatch compares main...HEAD whatever BASE the event carried',
    fn: () =>
      changesCase(filesOf('README.md'), 'true', { env: { EVENT: 'workflow_dispatch', BASE: '' }, calls: [`gh api repos/${REPO_SLUG}/compare/main...${HEAD_SHA}`] }) ??
      changesCase(filesOf('README.md'), 'true', { env: { EVENT: 'workflow_dispatch', BASE: BASE_SHA }, calls: [`gh api repos/${REPO_SLUG}/compare/main...${HEAD_SHA}`] }) ??
      changesCase(filesOf('README.md'), 'true', { calls: [`gh api repos/${REPO_SLUG}/compare/${BASE_SHA}...${HEAD_SHA}`] }),
  },
  {
    name: 'workflow-shell changes: a push to a branch other than main compares main...HEAD, not the previous tip (13 WR-01)',
    fn: () =>
      firstProblem(['refs/heads/ci/13-proof-docs', 'refs/heads/develop', 'refs/heads/feature/main'], (ref) => {
        const error = changesCase(filesOf('README.md'), 'true', {
          env: { EVENT: 'push', REF: ref, BASE: BASE_SHA },
          calls: [`gh api repos/${REPO_SLUG}/compare/main...${HEAD_SHA}`],
        });
        return error && `ref ${ref}: ${error}`;
      }),
  },
  {
    name: 'workflow-shell changes: a docs-only push on top of an untested code push to a ci/ branch runs the full CI (13 WR-01)',
    fn: () =>
      changesCase(filesOf('README.md'), 'false', {
        env: { EVENT: 'push', REF: 'refs/heads/ci/13-proof-docs', BASE: BASE_SHA },
        compareMain: filesOf('lib/site.ts', 'README.md'),
      }),
  },
  {
    name: 'workflow-shell changes: a push to main still compares the previous tip with HEAD',
    fn: () =>
      changesCase(filesOf('README.md'), 'true', {
        env: { EVENT: 'push', REF: 'refs/heads/main', BASE: BASE_SHA },
        compareMain: filesOf('lib/site.ts'),
        calls: [`gh api repos/${REPO_SLUG}/compare/${BASE_SHA}...${HEAD_SHA}`],
      }),
  },
  {
    name: 'workflow-shell changes: a new-branch push (all-zero or empty before) still runs the full CI with no gh call',
    fn: () =>
      changesCase(filesOf('README.md'), 'false', { env: { EVENT: 'push', REF: 'refs/heads/ci/13-new', BASE: '0'.repeat(40) }, calls: [] }) ??
      changesCase(filesOf('README.md'), 'false', { env: { EVENT: 'push', REF: 'refs/heads/ci/13-new', BASE: '' }, calls: [] }),
  },
  {
    name: 'workflow-shell changes: an empty BASE gives docs_only=false, exit 0 and no gh call',
    fn: () => changesCase(filesOf('README.md'), 'false', { env: { BASE: '' }, calls: [] }),
  },
  {
    name: 'workflow-shell changes: an all-zero BASE (a new branch) gives docs_only=false, exit 0 and no gh call',
    fn: () => changesCase(filesOf('README.md'), 'false', { env: { BASE: '0'.repeat(40) }, calls: [] }),
  },
  {
    name: 'workflow-shell changes: a failing compare call gives docs_only=false, exit 0 and the ::warning:: line',
    fn: () => {
      const r = runStep(classifyBlock(), { cwd: repoRoot, env: { GH_TOKEN: 'dummy', REPO: REPO_SLUG, EVENT: 'pull_request', BASE: BASE_SHA, HEAD: HEAD_SHA, STUB_COMPARE_FAIL: '1' } });
      const problems = [];
      if (r.status !== 0) problems.push(`expected exit 0, got ${r.status}`);
      if (r.output !== 'docs_only=false\n') problems.push(`GITHUB_OUTPUT is ${JSON.stringify(r.output)}`);
      if (!r.stdout.includes(`::warning::The compare call for ${BASE_SHA}...${HEAD_SHA} failed; running the full CI.`)) problems.push('no ::warning:: line');
      return withTail(problems, r);
    },
  },
  {
    name: 'workflow-shell changes: only docs files give docs_only=true',
    fn: () => changesCase(filesOf('.planning/phases/13-x/13-01-PLAN.md', 'README.md', 'scripts/README.md', 'AGENTS.md'), 'true'),
  },
  {
    name: 'workflow-shell changes: a code file among docs files gives docs_only=false',
    fn: () => changesCase(filesOf('README.md', 'lib/site.ts'), 'false') ?? changesCase(filesOf('docs/README.md'), 'false'),
  },
  {
    name: 'workflow-shell changes: 300 files pass --truncated and give docs_only=false, while 299 docs files stay docs-only',
    fn: () => changesCase(manyDocs(300), 'false') ?? changesCase(manyDocs(299), 'true'),
  },
  {
    name: 'workflow-shell changes: a rename from lib/ into .planning/ gives docs_only=false (the old name counts)',
    fn: () =>
      changesCase(filesOf({ filename: '.planning/notes/x.ts', previous_filename: 'lib/x.ts', status: 'renamed' }), 'false') ??
      changesCase(filesOf({ filename: '.planning/notes/y.md', previous_filename: '.planning/old/y.md', status: 'renamed' }), 'true'),
  },
  {
    name: 'workflow-shell changes: a file name containing a line break gives docs_only=false',
    fn: () => changesCase(filesOf('.planning/a\nb.md'), 'false') ?? changesCase(filesOf('.planning/a\rb.md'), 'false') ?? changesCase(filesOf('.planning/ab.md'), 'true'),
  },
  {
    name: 'workflow-shell changes: a compare body with no files key gives docs_only=false',
    fn: () => changesCase({ status: 'identical' }, 'false'),
  },
];

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

// check-ci-gate.mjs parser edge cases (GUARD-07, GUARD-08, 13-VALIDATION G3): flow, scalar and quoted
// `on:` forms, CRLF workflows, the relay rules 11, 12, 14 and 15 on shapes the fixtures do not hold, and
// rule 16 (a timeout-minutes on every job; 13 WR-05).
const ciGateTempRoots = [];
/** The top-level `on:` block of a workflow, up to the `permissions:` key that follows it. */
const ON_BLOCK = /^on:\r?\n(?:[ \t].*\r?\n|\r?\n)*?(?=permissions:)/m;
/** A temp copy of the good fixture whose ci.yml `on:` block is replaced by `replacement`. */
const tempOnForm = (replacement, file = 'ci.yml') => {
  const root = tempCiGateRoot((text) => text.replace(ON_BLOCK, () => replacement), file);
  ciGateTempRoots.push(root);
  return root;
};
/** A temp copy of the good fixture with `edit` applied to ci-skip-relay.yml. */
const tempRelayEdit = (edit) => {
  const root = tempCiGateRoot(edit, 'ci-skip-relay.yml');
  ciGateTempRoots.push(root);
  return root;
};
/** A temp copy of the good fixture with `edit` applied to ci.yml. */
const tempCiEdit = (edit) => {
  const root = tempCiGateRoot(edit);
  ciGateTempRoots.push(root);
  return root;
};
/** A temp copy of the good fixture plus one extra workflow `.github/workflows/<file>` holding `text`. */
const tempExtraWorkflow = (file, text) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  fs.cpSync(cig('good'), root, { recursive: true });
  fs.writeFileSync(path.join(root, '.github', 'workflows', file), text);
  ciGateTempRoots.push(root);
  return root;
};
/** A workflow with one job, scoped and timed, whose name is `name` under the key `key` (rules 5 and 18). */
const namedJobWorkflow = (name, key = 'name') =>
  `name: Other\n\non:\n  push:\n\njobs:\n  shadow:\n    ${key}: ${name}\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    permissions:\n      contents: read\n    steps:\n      - run: echo hi\n`;
/** The good fixture's build-job `timeout-minutes: 5` line (group 1: the job's lines before it; group 2: the line ending). */
const BUILD_TIMEOUT = /^( {2}build:\r?\n(?: {4}.*\r?\n)*?) {4}timeout-minutes: 5(\r?\n)/m;
/**
 * A temp copy of the good fixture with every workflow and scripts/ci/ci-ok.jq
 * rewritten to CRLF line endings (a checkout with core.autocrlf=true), after
 * `edit(text)` is applied to ci.yml when given.
 */
function tempCrlfRoot(edit) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  fs.cpSync(cig('good'), root, { recursive: true });
  const files = [
    ...fs.readdirSync(path.join(root, '.github', 'workflows')).map((f) => path.join(root, '.github', 'workflows', f)),
    path.join(root, 'scripts', 'ci', 'ci-ok.jq'),
  ];
  for (const file of files) {
    let text = fs.readFileSync(file, 'utf-8').replace(/\r\n/g, '\n');
    if (edit && path.basename(file) === 'ci.yml') {
      const after = edit(text);
      if (after === text) throw new Error('tempCrlfRoot: the edit changed nothing');
      text = after;
    }
    fs.writeFileSync(file, text.replace(/\n/g, '\r\n'));
  }
  ciGateTempRoots.push(root);
  return root;
}
const ALL_THREE_FLOW = 'on: [push, pull_request, workflow_dispatch]\n\n';
const RELAY_ON_TARGET = 'on:\n  pull_request_target:\n    branches: [main]\n\n';
/** The relay job's `steps:` line (group 1), just before its first step. */
const RELAY_STEPS = /^( {4}steps:\r?\n)(?= {6}- name: Nothing to relay)/m;
/** A relay action step (rule 17) whose `with:` input `script:` is `script`. */
const relayActionStep = (script) =>
  `      - name: Comment on the PR\n        uses: actions/github-script@v7\n        with:\n          script: ${script}\n`;
const ciGateCase = (name, makeRoot, expectExit, expectOutput) => ({
  name: `ci-gate: ${name}`,
  guard: CI_GATE,
  args: [],
  setup: () => ['--root', makeRoot()],
  expectExit,
  expectOutput,
});

const CI_GATE_PARSER_CASES = [
  ciGateCase('a ci.yml job without timeout-minutes fails rule 16 (13 WR-05)', () => tempCiEdit((text) => text.replace(BUILD_TIMEOUT, '$1')), 1, [
    "ci.yml: job build has no timeout-minutes (it would run to GitHub's 360-minute default",
    'ci-gate: 1 failure(s)',
  ]),
  ciGateCase('a relay job without timeout-minutes fails rule 16 (13 WR-05)', () => tempRelayEdit((text) => text.replace(/^ {4}timeout-minutes: 100\r?\n/m, '')), 1, [
    'ci-skip-relay.yml: job relay has no timeout-minutes',
    'ci-gate: 1 failure(s)',
  ]),
  ciGateCase('a ci.yml timeout-minutes of 0 fails rule 16', () => tempCiEdit((text) => text.replace(BUILD_TIMEOUT, '$1    timeout-minutes: 0$2')), 1, [
    'ci.yml: job build has timeout-minutes: 0; expected a positive whole number of minutes',
    'ci-gate: 1 failure(s)',
  ]),
  ciGateCase("a quoted timeout-minutes: '15' passes rule 16", () => tempCiEdit((text) => text.replace(BUILD_TIMEOUT, "$1    timeout-minutes: '15'$2")), 0, ['ci-gate: OK']),
  ciGateCase('ci.yml on: in flow-list form with all three triggers passes', () => tempOnForm(ALL_THREE_FLOW), 0, ['ci-gate: OK']),
  ciGateCase('ci.yml on: in flow-list form without workflow_dispatch fails rule 8', () => tempOnForm('on: [push, pull_request]\n\n'), 1, [
    'ci.yml has no workflow_dispatch trigger',
    'ci-gate: 1 failure(s)',
  ]),
  ciGateCase(
    'ci.yml on: in flow-map form carrying a paths: filter fails rule 9',
    () => tempOnForm('on: { push: {}, pull_request: { paths: [app] }, workflow_dispatch: {} }\n\n'),
    1,
    ['workflow-level paths filter in .github/workflows/ci.yml', 'declares paths:'],
  ),
  ciGateCase('ci.yml on: in flow-map form with all three triggers and no filter passes', () => tempOnForm('on: { push: {}, pull_request: {}, workflow_dispatch: {} }\n\n'), 0, ['ci-gate: OK']),
  ciGateCase('ci.yml scalar on: push fails rule 8 for the two missing triggers', () => tempOnForm('on: push\n\n'), 1, [
    'ci.yml has no pull_request trigger',
    'ci.yml has no workflow_dispatch trigger',
    'ci-gate: 2 failure(s)',
  ]),
  ciGateCase('ci.yml with a quoted "on": key is read like on: and passes with all three triggers', () => tempOnForm('"on":\n  push:\n  pull_request:\n  workflow_dispatch:\n\n'), 0, ['ci-gate: OK']),
  ciGateCase('ci.yml with a quoted "on": key and no workflow_dispatch still fails rule 8', () => tempOnForm('"on":\n  push:\n  pull_request:\n\n'), 1, ['ci.yml has no workflow_dispatch trigger']),
  ciGateCase('a CRLF copy of the good fixture still passes', () => tempCrlfRoot(), 0, ['ci-gate: OK']),
  ciGateCase(
    'a CRLF copy without workflow_dispatch still fails',
    () => tempCrlfRoot((text) => text.replace(/^ {2}workflow_dispatch:\n/m, '')),
    1,
    ['ci.yml has no workflow_dispatch trigger'],
  ),
  ciGateCase(
    'relay with ${{ }} inside a shell comment of a run block fails rule 12',
    () => tempRelayEdit((text) => text.replace(/^( {10})now=\$\(date/m, '$1# the actor is ${{ github.actor }}\n$1now=$(date')),
    1,
    ['ci-skip-relay.yml: expression inside a run block', 'ci-gate: 1 failure(s)'],
  ),
  ciGateCase(
    'relay running git clone in a run block fails rule 11',
    () => tempRelayEdit((text) => text.replace(/^( {10})now=\$\(date/m, '$1git clone "https://github.com/$HEAD_REPO.git" pr\n$1now=$(date')),
    1,
    ['ci-skip-relay.yml: relay checks out code', 'git clone', 'ci-gate: 1 failure(s)'],
  ),
  ciGateCase(
    'relay with actions: write on the detect job fails rule 15',
    () => tempRelayEdit((text) => text.replace(/^( {6})actions: read$/m, '$1actions: write')),
    1,
    ['relay grants actions: write in job detect', 'ci-gate: 1 failure(s)'],
  ),
  ciGateCase(
    'relay with an extra workflow_dispatch: trigger fails rule 14',
    () => tempRelayEdit((text) => text.replace(ON_BLOCK, () => `${RELAY_ON_TARGET.trimEnd()}\n  workflow_dispatch:\n\n`)),
    1,
    ['relay may trigger only on pull_request_target (on: declares pull_request_target, workflow_dispatch)'],
  ),
  ciGateCase(
    'relay with a flow-form on: [pull_request_target, push] fails rule 14',
    () => tempRelayEdit((text) => text.replace(ON_BLOCK, () => 'on: [pull_request_target, push]\n\n')),
    1,
    ['relay may trigger only on pull_request_target (on: declares pull_request_target, push)'],
  ),
  ciGateCase(
    'rule 17: a relay action step with an expression in with: fails (13 IN-02)',
    () => tempRelayEdit((text) => text.replace(RELAY_STEPS, `$1${relayActionStep('${{ github.event.pull_request.title }}')}`)),
    1,
    ['ci-skip-relay.yml: expression in an action input (line 111: script)', 'never through with:', 'ci-gate: 1 failure(s)'],
  ),
  ciGateCase(
    'rule 17: a relay action step with literal with: values passes',
    () => tempRelayEdit((text) => text.replace(RELAY_STEPS, `$1${relayActionStep("console.log('ok')")}`)),
    0,
    ['ci-gate: OK'],
  ),
  ciGateCase(
    'a relay with: block scalar holding ${{ on a "#" line fails rule 17 (raw lines)',
    () => tempRelayEdit((text) => text.replace(RELAY_STEPS, `$1${relayActionStep('|\n            # ${{ github.event.pull_request.title }}\n            core.info(1)')}`)),
    1,
    ['ci-skip-relay.yml: expression in an action input (line 112: script)', 'ci-gate: 1 failure(s)'],
  ),
  ciGateCase(
    'rule 18: an expression job name in another workflow fails (13 IN-03)',
    () => tempExtraWorkflow('other.yml', namedJobWorkflow("${{ format('CI {0}', 'OK') }}")),
    1,
    [
      "other.yml: expression job name outside ci.yml: .github/workflows/other.yml (job shadow); only the relay's needs-based CI OK name expression is allowed",
      'ci-gate: 1 failure(s)',
    ],
  ),
  ciGateCase("rule 18: the relay's needs-based name expression passes", () => cig('good'), 0, ['ci-gate: OK']),
  ciGateCase(
    'a literal job name in another workflow passes rule 18',
    () => tempExtraWorkflow('other.yml', namedJobWorkflow('Format check')),
    0,
    ['ci-gate: OK'],
  ),
  // 15 WR-02: the name is read whole, so a block scalar, a continued scalar or a quoted key cannot hide it.
  ciGateCase(
    'rule 18: a folded block-scalar job name (name: >-) with the expression on the next line fails (15 WR-02)',
    () => tempExtraWorkflow('other.yml', namedJobWorkflow(">-\n      ${{ format('CI {0}', 'OK') }}")),
    1,
    [
      "other.yml: expression job name outside ci.yml: .github/workflows/other.yml (job shadow); only the relay's needs-based CI OK name expression is allowed",
      'ci-gate: 1 failure(s)',
    ],
  ),
  ciGateCase(
    'rule 18: a literal block-scalar job name (name: |) with the expression on the next line fails (15 WR-02)',
    () => tempExtraWorkflow('other.yml', namedJobWorkflow("|\n      ${{ format('CI {0}', 'OK') }}")),
    1,
    ['other.yml: expression job name outside ci.yml: .github/workflows/other.yml (job shadow)', 'ci-gate: 1 failure(s)'],
  ),
  ciGateCase(
    'rule 18: a block-scalar job name whose expression sits after a "#" fails (raw lines, 15 WR-02)',
    () => tempExtraWorkflow('other.yml', namedJobWorkflow("|\n      # ${{ format('CI {0}', 'OK') }}")),
    1,
    ['other.yml: expression job name outside ci.yml: .github/workflows/other.yml (job shadow)', 'ci-gate: 1 failure(s)'],
  ),
  ciGateCase(
    'rule 18: a quoted "name": key holding an expression fails (15 WR-02)',
    () => tempExtraWorkflow('other.yml', namedJobWorkflow("${{ format('CI {0}', 'OK') }}", '"name"')),
    1,
    ['other.yml: expression job name outside ci.yml: .github/workflows/other.yml (job shadow)', 'ci-gate: 1 failure(s)'],
  ),
  ciGateCase(
    'rule 5: a block-scalar job name (name: >-) of CI OK in another workflow fails (15 WR-02)',
    () => tempExtraWorkflow('other.yml', namedJobWorkflow('>-\n      CI OK')),
    1,
    ['other.yml: a job named CI OK outside ci.yml: .github/workflows/other.yml (job shadow)', 'ci-gate: 1 failure(s)'],
  ),
  ciGateCase(
    'rule 5: a plain job name continued over lines (CI / OK) in another workflow fails (15 WR-02)',
    () => tempExtraWorkflow('other.yml', namedJobWorkflow('CI\n      OK')),
    1,
    ['other.yml: a job named CI OK outside ci.yml: .github/workflows/other.yml (job shadow)', 'ci-gate: 1 failure(s)'],
  ),
  ciGateCase(
    "rule 5: a quoted 'name': key of CI OK in another workflow fails (15 WR-02)",
    () => tempExtraWorkflow('other.yml', namedJobWorkflow('CI OK', "'name'")),
    1,
    ['other.yml: a job named CI OK outside ci.yml: .github/workflows/other.yml (job shadow)', 'ci-gate: 1 failure(s)'],
  ),
  ciGateCase(
    'a literal block-scalar job name (name: >-) in another workflow passes rules 5 and 18 (15 WR-02)',
    () => tempExtraWorkflow('other.yml', namedJobWorkflow('>-\n      Format check')),
    0,
    ['ci-gate: OK'],
  ),
  ciGateCase(
    'a literal job name under a quoted "name": key passes rules 5 and 18 (15 WR-02)',
    () => tempExtraWorkflow('other.yml', namedJobWorkflow('Format check', '"name"')),
    0,
    ['ci-gate: OK'],
  ),
];

// scripts/photos/: characterization of the photo scripts through --root (VERIFY-06, 10-VALIDATION G5/G6)
const PHOTO_DATA = path.join(repoRoot, 'scripts', 'photos', 'build-photo-data.mjs');
/** The flag the npm photo scripts pass: the .ts schema imports otherwise warn on stderr. */
const PHOTO_NODE_ARGS = ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON'];
/**
 * Every input build-photo-data.mjs reads (sidecar, corrections, photo map, region
 * and plate registries, DEM source, the Home list) and the outputs --check compares.
 * The three registries joined in 15-06; without them the control case fails
 * (15-RESEARCH Pitfall 5). The Home list and the Home output joined in 16-05: a
 * copy holds the real Home list and its four real photos, so the Home-id check passes.
 */
const PHOTO_DATA_INPUTS = [
  'data/photos/exif-sidecar.json',
  'data/photos/corrections.json',
  'data/photos/photo-map.json',
  'data/regions/regions.json',
  'data/terrain/plates.json',
  'data/terrain/source/source.json',
  'data/terrain/source/dem-10m.png',
  'data/home-waypoints.ts',
  'data/generated/photos.ts',
  'data/generated/home-photos.ts',
];
/**
 * Copies the photo data build's inputs into a fresh temp root. `edit`, when
 * given, receives the parsed { sidecar, corrections, photoMap, regions, plates }
 * JSON and mutates it in place; the result is written back and must differ from
 * the original. Nested one level down so the cleanup loop's path.dirname removes
 * the mkdtemp directory.
 */
function tempPhotoDataRoot(edit) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  for (const rel of PHOTO_DATA_INPUTS) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, rel), path.join(root, rel));
  }
  if (edit) {
    const files = {
      sidecar: 'data/photos/exif-sidecar.json',
      corrections: 'data/photos/corrections.json',
      photoMap: 'data/photos/photo-map.json',
      regions: 'data/regions/regions.json',
      plates: 'data/terrain/plates.json',
    };
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
/** The photo-map record `id`, or a throw (a fixture edit must never miss silently). */
const mapRecord = (photoMap, id) => {
  const record = photoMap.photos[id];
  if (!record) throw new Error(`selftest: ${id} is not in the photo map`);
  return record;
};
/** The region `id` in the registry copy, or a throw. */
const regionEntry = (regions, id) => {
  const region = regions.regions.find((r) => r.id === id);
  if (!region) throw new Error(`selftest: region ${id} is not in the registry`);
  return region;
};
/**
 * Adds a photo-map record and rebuilds `photos` sorted by key, so the schema's
 * sorted-keys refine never fires and the case fails on the rule it names.
 */
function addMapRecord(photoMap, id, record) {
  if (photoMap.photos[id]) throw new Error(`selftest: ${id} is already in the photo map`);
  const entries = [...Object.entries(photoMap.photos), [id, record]];
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  photoMap.photos = Object.fromEntries(entries);
}
/** Inserts a region at its sorted position, for the same reason. */
function addRegion(regions, region) {
  if (regions.regions.some((r) => r.id === region.id)) throw new Error(`selftest: region ${region.id} already exists`);
  regions.regions.push(region);
  regions.regions.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
/** Fails a case whose output names a sort refine: the edit broke the order, not the rule it tests. */
const noSortRefine = (output) =>
  /sorted ascending/.test(output) ? 'the output names a sorted-order refine; the fixture edit broke the order' : null;
let photoDataControlRoot = null;
let photoDataOffsetRoot = null;
let photoDataGpsRoot = null;
let photoDataOffPlateRoot = null;
let photoMapMissingRoot = null;
let photoMapOrphanRoot = null;
let photoMapDuplicateRoot = null;
let photoMapUnknownRegionRoot = null;
let photoMapUnknownPlateRoot = null;
let photoMapCountryRoot = null;
let photoMapMovedRoot = null;

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
 * DATA-15 sidecar fixtures (generated, no real data): a fresh temp root holding
 * each named file as a few bytes of placeholder text. Generated at run time,
 * never committed, because the D-22 .gitignore block would ignore a committed
 * .srt, .xmp or .dat fixture and a real sidecar would carry take-off GPS.
 * Nested one level down so the cleanup loop's path.dirname removes the mkdtemp
 * directory.
 */
const telemetryTempRoots = [];
function tempTelemetryRoot(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  fs.mkdirSync(root);
  putFiles(root, Object.fromEntries(files.map((rel) => [rel, 'selftest placeholder, no telemetry\n'])));
  telemetryTempRoots.push(root);
  return root;
}
/**
 * A fresh temp root with one spliced telemetry-track clip at clips/<name>
 * (outside public/ and any hashed directory, so only the video rule fires).
 * Nested one level down like tempTelemetryRoot.
 */
function tempMp4TrackRoot(name, handler, entry) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  fs.mkdirSync(path.join(root, 'clips'), { recursive: true });
  fs.writeFileSync(path.join(root, 'clips', name), withTrack(goodMp4(), trak(handler, entry)));
  telemetryTempRoots.push(root);
  return root;
}
/**
 * D-21 repo-mode fixture: a temp git work tree (nothing committed) with the
 * given `.gitignore` lines and placeholder files, plus `git add -f` of each
 * `forceAdd` path, as a force-added sidecar would be staged. The guard then runs
 * with no --root and this root as its cwd. Nested one level down like
 * tempTelemetryRoot.
 */
function tempTelemetryRepo({ files, ignore = [], forceAdd = [] }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  fs.mkdirSync(root);
  telemetryTempRoots.push(root);
  gitIn(root, 'init', '-q');
  putFiles(root, { '.gitignore': ignore.map((line) => `${line}\n`).join('') });
  putFiles(root, Object.fromEntries(files.map((rel) => [rel, 'selftest placeholder, no telemetry\n'])));
  for (const rel of forceAdd) gitIn(root, 'add', '-f', '--', rel);
  return root;
}
const telemetryUntrackedRepo = tempTelemetryRepo({ files: ['DJI_0001.SRT'] });
const telemetryPublicRepo = tempTelemetryRepo({ files: ['public/flight.gpx'], ignore: ['public/flight.gpx'] });
const telemetryOriginalRepo = tempTelemetryRepo({ files: ['assets/photos-original/IMG_0001.xmp'], ignore: ['assets/photos-original/'] });
const telemetryForcedRepo = tempTelemetryRepo({
  files: ['assets/photos-original/route.KML'],
  ignore: ['assets/photos-original/'],
  forceAdd: ['assets/photos-original/route.KML'],
});
/**
 * A fresh temp directory with no `git init`, for the "never a silent pass" case.
 * `insideWorkTree` records whether git still finds a work tree there (a temp dir
 * under some checkout), which would make the case prove nothing; the case
 * reports it instead of passing.
 */
function tempNoGitDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  fs.mkdirSync(root);
  telemetryTempRoots.push(root);
  const r = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root, encoding: 'utf-8' });
  return { root, insideWorkTree: r.status === 0 };
}
const telemetryNoGit = tempNoGitDir();
/** The 13 D-20 types in mixed case (DATA-15), plus a GeoJSON file that must pass. */
const TELEMETRY_FILES = ['DJI_0001.SRT', 'DJI_0001.LRF', 'FLY001.DAT', 'GL010001.LRV', 'GOPR0001.THM', 'IMG_0001.xmp', 'track.GPX', 'route.Kml', 'route.kmz', 'log.NMEA', 'flight.igc', 'ride.FIT', 'run.tcx'];

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

// 15-07 (DATA-10, D-01): photos:exif takes each original's id from the photo map.
const PHOTO_EXIF = path.join(repoRoot, 'scripts', 'photos', 'extract-exif.mjs');
const EXIF_SIDECAR_REL = 'data/photos/exif-sidecar.json';
/**
 * Extraction fixture (generated, no camera data): a temp root with two sharp
 * JPEGs in assets/photos-original/ (no EXIF, no GPS, no serial; nothing is copied
 * from the real originals) and a data/photos/photo-map.json mapping both, keys
 * sorted. DJI_0001.JPG is a name the old IMG_/R regex could never parse, and
 * IMG_0605.jpg is a second camera's file the regex would have called img-0605;
 * the map gives them img-9001 and img-9002. `mapEdit(map)` mutates the map
 * before it is written. No sidecar exists until a run writes one. Built with
 * top-level await because case setup hooks are synchronous; nested one level
 * down so the cleanup loop's path.dirname removes the mkdtemp directory.
 */
async function tempExifRoot({ mapEdit } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  const put = (rel, bytes) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), bytes);
  };
  const jpeg = (r) => sharp({ create: { width: 16, height: 12, channels: 3, background: { r, g: 110, b: 140 } } }).jpeg().toBuffer();
  put('assets/photos-original/DJI_0001.JPG', await jpeg(60));
  put('assets/photos-original/IMG_0605.jpg', await jpeg(180));
  const map = {
    schemaVersion: 1,
    photos: {
      'img-9001': { file: 'DJI_0001.JPG', region: 'zermatt', country: 'CH', precision: '4dp', kind: 'ground' },
      'img-9002': { file: 'IMG_0605.jpg', region: 'zermatt', country: 'CH', precision: '4dp', kind: 'ground' },
    },
  };
  if (mapEdit) mapEdit(map);
  put('data/photos/photo-map.json', `${JSON.stringify(map, null, 2)}\n`);
  return root;
}
const exifMappedRoot = await tempExifRoot();
const exifUnmappedRoot = await tempExifRoot({ mapEdit: (map) => delete map.photos['img-9002'] });
const exifDuplicateRoot = await tempExifRoot({
  mapEdit: (map) => {
    map.photos['img-9002'].file = 'DJI_0001.JPG';
  },
});
/** Null when each named file's sidecar entry carries the expected id; else what is wrong. */
function exifSidecarIds(root, expected) {
  const abs = path.join(root, EXIF_SIDECAR_REL);
  if (!fs.existsSync(abs)) return `${EXIF_SIDECAR_REL} was not written`;
  const { photos } = JSON.parse(fs.readFileSync(abs, 'utf-8'));
  const problems = [];
  for (const [file, id] of Object.entries(expected)) {
    const entry = photos.find((p) => p.file === file);
    if (!entry) problems.push(`no sidecar entry for ${file}`);
    else if (entry.id !== id) problems.push(`${file} has id ${entry.id}, expected ${id}`);
  }
  return problems.length ? problems.join('; ') : null;
}
/** A failed extraction writes no sidecar. */
const noExifSidecar = (root) => () =>
  fs.existsSync(path.join(root, EXIF_SIDECAR_REL)) ? `${EXIF_SIDECAR_REL} was written by a failing run` : null;

// 16-01 (DATA-14, D-01 to D-04): location privacy through both photo stages on
// generated JPEGs with hand-assembled EXIF GPS (15 D-23: generated data only).
const GEO_URL = pathToFileURL(path.join(repoRoot, 'lib', 'geo.ts')).href;
/**
 * `fn` of lib/geo.ts applied to each of `args`, in a child node with the photo
 * scripts' flag (importing a .ts module here would print a module-type warning
 * into every selftest run). The arguments go through stdin (a long batch would
 * overflow the Windows command line). JSON round-trips a double exactly.
 */
function geoBatch(fn, args) {
  const code = `const m = await import(${JSON.stringify(GEO_URL)}); let s = ''; for await (const c of process.stdin) s += c; process.stdout.write(JSON.stringify(JSON.parse(s).map((a) => m[${JSON.stringify(fn)}](a))));`;
  const r = spawnSync(process.execPath, [...PHOTO_NODE_ARGS, '--input-type=module', '-e', code], { encoding: 'utf-8', input: JSON.stringify(args) });
  if (r.status !== 0) throw new Error(`selftest: lib/geo.ts ${fn} failed: ${r.error?.message ?? r.stderr}`);
  return JSON.parse(r.stdout);
}
const geo = (fn, arg) => geoBatch(fn, [arg])[0];

// 16-09 (D-09): the plate grid dispatch in scripts/photos/plate-dem.mjs, which
// imports lib/geo.ts (EPSG:2056) and proj4 (EPSG:3035).
const PLATE_DEM_URL = pathToFileURL(path.join(repoRoot, 'scripts', 'photos', 'plate-dem.mjs')).href;
/** `fn` ('toGrid' or 'fromGrid') of plate-dem.mjs on `crs` for each of `args`, in a child node like geoBatch. */
function plateGridBatch(fn, crs, args) {
  const code = `const m = await import(${JSON.stringify(PLATE_DEM_URL)}); let s = ''; for await (const c of process.stdin) s += c; process.stdout.write(JSON.stringify(JSON.parse(s).map((a) => m[${JSON.stringify(fn)}](${JSON.stringify(crs)}, a))));`;
  const r = spawnSync(process.execPath, [...PHOTO_NODE_ARGS, '--input-type=module', '-e', code], { encoding: 'utf-8', input: JSON.stringify(args) });
  if (r.status !== 0) throw new Error(`selftest: plate-dem.mjs ${fn} ${crs} failed: ${r.error?.message ?? r.stderr}`);
  return JSON.parse(r.stdout);
}
/** `fn` of plate-dem.mjs applied to each argument list of `argLists` (spread), in a child node like geoBatch. */
function plateDemBatch(fn, argLists) {
  const code = `const m = await import(${JSON.stringify(PLATE_DEM_URL)}); let s = ''; for await (const c of process.stdin) s += c; process.stdout.write(JSON.stringify(JSON.parse(s).map((a) => m[${JSON.stringify(fn)}](...a))));`;
  const r = spawnSync(process.execPath, [...PHOTO_NODE_ARGS, '--input-type=module', '-e', code], { encoding: 'utf-8', input: JSON.stringify(argLists) });
  if (r.status !== 0) throw new Error(`selftest: plate-dem.mjs ${fn} failed: ${r.error?.message ?? r.stderr}`);
  return JSON.parse(r.stdout);
}
/** Euclidean distance in metres between two grid points { e, n }. */
const gridDistance = (a, b) => Math.hypot(a.e - b.e, a.n - b.n);
/** The Ortler default plate, LV95 (EPSG:2056). */
const ORTLER_LV95 = { west: 2832000, south: 1150000, east: 2844000, north: 1162000 };
/** The Saalfelden default plate (RESEARCH Option A), EPSG:3035. */
const SAALFELDEN_LAEA = { west: 4529000, south: 2701000, east: 4541000, north: 2713000 };
/** Half-up rounding to `d` decimals, the extraction contract (16 D-01). */
const roundDp = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
/** Half-up rounding to a multiple of `step` metres (16 D-03). */
const roundStep = (v, step) => Math.round(v / step) * step;
/** The privacy fixture plate's LV95 extent: 400 x 400 cells of 10 m. */
const PRIVACY_EXTENT = { west: 2600000, south: 1200000, east: 2604000, north: 1204000 };
/**
 * The fixture DEM's height in metres at easting `e`: a linear ramp rising 1 m per
 * 5 m east. Its value at every pixel centre (e = west + 10 x + 5) is a whole
 * number of decimetres (10,010 + 20 x), so the grey16 PNG stores it exactly and
 * a bilinear sample between the outermost centres equals this formula.
 */
const rampM = (e) => 1000 + (e - PRIVACY_EXTENT.west) / 5;
const insideExtent = ({ e, n }, x = PRIVACY_EXTENT) => e >= x.west && e <= x.east && n >= x.south && n <= x.north;
/** Throws when `v` lies within 0.01 m of a rounding boundary of `step` (a fixture choice must be unambiguous). */
function clearOfBoundary(v, step, what) {
  const r = ((v % step) + step) % step;
  if (Math.abs(r - step / 2) < 0.01) throw new Error(`selftest: ${what} lies on a ${step} m rounding boundary; pick another point`);
}
/**
 * Unsigned decimal degrees -> EXIF degrees, minutes and seconds (seconds in
 * millionths), plus the value extract-exif.mjs decodes from them, computed with
 * the same expression, so the "true" position a case asserts against is the
 * extraction's own input bit for bit.
 */
function toDms(v) {
  const a = Math.abs(v);
  let deg = Math.floor(a);
  let min = Math.floor((a - deg) * 60);
  let secM = Math.round(((a - deg) * 60 - min) * 60 * 1e6);
  if (secM >= 60e6) {
    secM -= 60e6;
    min += 1;
  }
  if (min >= 60) {
    min -= 60;
    deg += 1;
  }
  const decoded = deg / 1 + min / 1 / 60 + secM / 1000000 / 3600;
  return { rationals: [[deg, 1], [min, 1], [secM, 1000000]], decoded: v < 0 ? -decoded : decoded };
}
/**
 * A 16 x 12 sharp JPEG with a hand-assembled EXIF APP1 segment spliced after SOI:
 * little-endian TIFF, IFD0 with Make (when given) and a GPSInfo pointer (when
 * `lat` is given), and a GPS IFD with LatitudeRef/Latitude/LongitudeRef/Longitude
 * as rational degrees-minutes-seconds and AltitudeRef/Altitude (when `altM` is
 * given). Resolves to { bytes, lat, lon }, the decoded true position.
 */
async function gpsJpeg({ make = null, lat = null, lon = null, altM = null } = {}) {
  const base = await sharp({ create: { width: 16, height: 12, channels: 3, background: { r: 90, g: 120, b: 150 } } }).jpeg().toBuffer();
  const ifd0 = [];
  const gpsEntries = [];
  let decoded = { lat: null, lon: null };
  if (make !== null) ifd0.push({ tag: 0x010f, type: 2, data: Buffer.from(`${make}\0`, 'latin1') });
  if (lat !== null) {
    const la = toDms(lat);
    const lo = toDms(lon);
    decoded = { lat: la.decoded, lon: lo.decoded };
    const rational = (pairs) => {
      const b = Buffer.alloc(pairs.length * 8);
      pairs.forEach(([num, den], i) => {
        b.writeUInt32LE(num, i * 8);
        b.writeUInt32LE(den, i * 8 + 4);
      });
      return b;
    };
    gpsEntries.push({ tag: 0x0001, type: 2, data: Buffer.from(lat < 0 ? 'S\0' : 'N\0', 'latin1') });
    gpsEntries.push({ tag: 0x0002, type: 5, count: 3, data: rational(la.rationals) });
    gpsEntries.push({ tag: 0x0003, type: 2, data: Buffer.from(lon < 0 ? 'W\0' : 'E\0', 'latin1') });
    gpsEntries.push({ tag: 0x0004, type: 5, count: 3, data: rational(lo.rationals) });
    if (altM !== null) {
      gpsEntries.push({ tag: 0x0005, type: 1, data: Buffer.from([altM < 0 ? 1 : 0]) });
      gpsEntries.push({ tag: 0x0006, type: 5, count: 1, data: rational([[Math.round(Math.abs(altM) * 10), 10]]) });
    }
    ifd0.push({ tag: 0x8825, type: 4, gpsPointer: true });
  }
  // Lay out IFD0, then its out-of-line values, then the GPS IFD and its values.
  const ifdSize = (n) => 2 + n * 12 + 4;
  const chunks = [];
  let at = 8;
  const place = (bytes) => {
    const offset = at;
    chunks.push(bytes);
    at += bytes.length + (bytes.length % 2);
    if (bytes.length % 2) chunks.push(Buffer.alloc(1));
    return offset;
  };
  const writeIfd = (entries) => {
    const ifd = Buffer.alloc(ifdSize(entries.length));
    const ifdOffset = place(ifd);
    ifd.writeUInt16LE(entries.length, 0);
    entries.forEach((entry, i) => {
      const p = 2 + i * 12;
      ifd.writeUInt16LE(entry.tag, p);
      ifd.writeUInt16LE(entry.type, p + 2);
      if (entry.gpsPointer) {
        ifd.writeUInt32LE(1, p + 4);
        entry.patch = (value) => ifd.writeUInt32LE(value, p + 8);
        return;
      }
      ifd.writeUInt32LE(entry.count ?? entry.data.length, p + 4);
      if (entry.data.length <= 4) entry.data.copy(ifd, p + 8);
      else ifd.writeUInt32LE(place(entry.data), p + 8);
    });
    ifd.writeUInt32LE(0, 2 + entries.length * 12);
    return ifdOffset;
  };
  writeIfd(ifd0);
  if (gpsEntries.length) {
    const gpsOffset = writeIfd(gpsEntries);
    ifd0.find((e) => e.gpsPointer).patch(gpsOffset);
  }
  const header = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]);
  const tiff = Buffer.concat([header, ...chunks]);
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const app1 = Buffer.alloc(4);
  app1.writeUInt16BE(0xffe1, 0);
  app1.writeUInt16BE(payload.length + 2, 2);
  return { bytes: Buffer.concat([base.subarray(0, 2), app1, payload, base.subarray(2)]), ...decoded };
}
/** The privacy fixture plate (2D, like the terrain fixture) and its region. */
const PRIVACY_PLATE = {
  id: 'fixture',
  prefix: 'fixture-',
  source: 'data/terrain/plates/fixture',
  home: false,
  threeD: false,
  outputs: { contours: ['hero', 'strip'], hillshade: [1100, 640] },
  strip: { centreN: 1202000 },
};
/** The 400 x 400 grey16 ramp DEM in decimetres (see rampM), built from a Uint16Array. */
async function privacyDem() {
  const n = 400;
  const u16 = new Uint16Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) u16[y * n + x] = Math.round(rampM(PRIVACY_EXTENT.west + 10 * x + 5) * 10);
  }
  // Pass the Uint16Array itself: a Buffer with raw depth 'ushort' corrupts silently (build-terrain.mjs encodeGrey16).
  return sharp(u16, { raw: { width: n, height: n, channels: 1 } }).toColourspace('grey16').png().toBuffer();
}
/** The privacy fixture's EPSG:3035 plate extent (16 D-09): 400 x 400 cells of 10 m, synthetic. */
const PRIVACY_LAEA_EXTENT = { west: 4000000, south: 2000000, east: 4004000, north: 2004000 };
/** The LAEA ramp: 1,000 m plus 1 m per 4 m east of the plate's west edge. */
const laeaRampM = (e) => 1000 + (e - PRIVACY_LAEA_EXTENT.west) / 4;
/**
 * At every pixel centre (e = west + 10 x + 5) the ramp ends in half a decimetre
 * (10,012.5 + 25 x dm), which the grey16 PNG stores rounded half-up, so the stored
 * DEM is this constant above laeaRampM everywhere. A constant offset keeps the
 * bilinear sample between centres exactly linear.
 */
const LAEA_RAMP_STORED_M = 0.05;
/** The height the plate DEM holds (and a bilinear sample returns) at easting `e`. */
const laeaDemM = (e) => laeaRampM(e) + LAEA_RAMP_STORED_M;
/** The privacy fixture's EPSG:3035 plate (2D) and its region. */
const PRIVACY_LAEA_PLATE = {
  id: 'fixture-laea',
  prefix: 'fixture-laea-',
  source: 'data/terrain/plates/fixture-laea',
  home: false,
  threeD: false,
  outputs: { contours: ['hero', 'strip'], hillshade: [1100, 640] },
  strip: { centreN: 2002000 },
};
/** The 400 x 400 grey16 LAEA ramp DEM in decimetres (laeaRampM, stored half-up). */
async function privacyLaeaDem() {
  const n = 400;
  const u16 = new Uint16Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) u16[y * n + x] = Math.round(laeaRampM(PRIVACY_LAEA_EXTENT.west + 10 * x + 5) * 10);
  }
  // Pass the Uint16Array itself: a Buffer with raw depth 'ushort' corrupts silently (build-terrain.mjs encodeGrey16).
  return sharp(u16, { raw: { width: n, height: n, channels: 1 } }).toColourspace('grey16').png().toBuffer();
}
const privacyTempRoots = [];
/**
 * A temp root for both photo stages: the real region and plate registries and
 * the Matterhorn source (the plate registry needs its home plate), plus a region
 * `fixture` on the plate `fixture` with the ramp DEM; the synthetic originals;
 * a photo map of only the synthetic records; and corrections giving each
 * synthetic id a film-scan medium and a year capture (so no camera EXIF is
 * needed), merged with `corrections[id]`. `records` maps an id to its photo-map
 * record plus `bytes`, the original. With `laeaPlate`, also a region
 * `fixture-laea` on the BEV-variant EPSG:3035 plate `fixture-laea` with the LAEA
 * ramp DEM (16 D-09); the Home list stays empty either way. Nested one level down
 * so the cleanup loop's path.dirname removes the mkdtemp directory.
 */
async function tempPrivacyRoot({ records, corrections = {}, laeaPlate = false }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  privacyTempRoots.push(root);
  const put = (rel, bytes) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), bytes);
  };
  const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
  for (const rel of ['data/terrain/source/source.json', 'data/terrain/source/dem-10m.png']) put(rel, fs.readFileSync(path.join(repoRoot, rel)));
  const regions = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/regions/regions.json'), 'utf-8'));
  addRegion(regions, { id: 'fixture', name: 'Fixture', plate: 'fixture' });
  if (laeaPlate) addRegion(regions, { id: 'fixture-laea', name: 'Fixture LAEA', plate: PRIVACY_LAEA_PLATE.id });
  put('data/regions/regions.json', json(regions));
  const plates = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/terrain/plates.json'), 'utf-8'));
  plates.plates.push(PRIVACY_PLATE);
  if (laeaPlate) plates.plates.push(PRIVACY_LAEA_PLATE);
  put('data/terrain/plates.json', json(plates));
  if (laeaPlate) {
    const laeaPng = await privacyLaeaDem();
    put(`${PRIVACY_LAEA_PLATE.source}/dem-10m.png`, laeaPng);
    put(`${PRIVACY_LAEA_PLATE.source}/source.json`, json(bevFixtureSource({ extent: PRIVACY_LAEA_EXTENT, width: 400, height: 400, png: laeaPng })));
  }
  const png = await privacyDem();
  put(`${PRIVACY_PLATE.source}/dem-10m.png`, png);
  put(`${PRIVACY_PLATE.source}/source.json`, json({
    product: 'swissALTIRegio',
    stacItemUrl: 'https://example.invalid/fixture/stac-item',
    cogUrl: 'https://example.invalid/fixture/dem.tif',
    stacDatetime: '2026-05-28T00:00:00Z',
    stacUpdated: '2026-05-28T00:00:00Z',
    checksum: `1220${'0'.repeat(64)}`,
    edition: '2026-05',
    editionSource: 'stac:datetime',
    crs: 'EPSG:2056',
    heightSystem: 'LN02',
    extent: PRIVACY_EXTENT,
    cellM: 10,
    width: 400,
    height: 400,
    heightScale: 0.1,
    file: 'dem-10m.png',
    sha256: crypto.createHash('sha256').update(png).digest('hex'),
  }));
  const ids = Object.keys(records).sort();
  const map = { schemaVersion: 1, photos: {} };
  const fixes = { schemaVersion: 1, photos: {} };
  for (const id of ids) {
    const { bytes, ...record } = records[id];
    put(`assets/photos-original/${record.file}`, bytes);
    map.photos[id] = record;
    fixes.photos[id] = {
      medium: 'film-scan',
      captureOverride: { precision: 'year', year: 2020, source: 'Tim', reason: 'selftest: a generated JPEG has no camera date' },
      ...(corrections[id] ?? {}),
    };
  }
  put('data/photos/photo-map.json', json(map));
  put('data/photos/corrections.json', json(fixes));
  // 16-05: photos:build reads the Home list under --root. This photo map holds only
  // synthetic records, so no Home waypoint: an empty list (overwriting any copy)
  // keeps the Home-id check in place and writes an empty homePhotoFacts.
  put('data/home-waypoints.ts', 'export const homeWaypointIds = [];\n');
  return root;
}
/**
 * Runs photos:exif, then (when it passed) photos:build, in write mode on `root`.
 * Returns both results, their combined output, and the written sidecar entry and
 * generated fact of `id` (null when absent).
 */
function privacyRun(root, id) {
  const run = (script) => spawnSync(process.execPath, [...PHOTO_NODE_ARGS, script, '--root', root], { encoding: 'utf-8' });
  const exif = run(PHOTO_EXIF);
  const build = exif.status === 0 ? run(PHOTO_DATA) : null;
  const text = (r) => (r ? `${r.stdout ?? ''}${r.stderr ?? ''}` : '');
  return { exif, build, output: `${text(exif)}${text(build)}`, ...privacyWritten(root, id) };
}
/** The sidecar entry and generated fact of `id` written in `root` (null when absent). */
function privacyWritten(root, id) {
  const sidecarPath = path.join(root, EXIF_SIDECAR_REL);
  const entry = fs.existsSync(sidecarPath) ? JSON.parse(fs.readFileSync(sidecarPath, 'utf-8')).photos.find((p) => p.id === id) ?? null : null;
  const factsPath = path.join(root, 'data/generated/photos.ts');
  let fact = null;
  if (fs.existsSync(factsPath)) {
    const m = /export const photos = ([\s\S]*) as const;\s*$/.exec(fs.readFileSync(factsPath, 'utf-8'));
    fact = m ? JSON.parse(m[1]).find((p) => p.id === id) ?? null : null;
  }
  return { entry, fact };
}
/** Null when every [label, actual, expected] pair is equal (Object.is); else the first difference. */
function firstDifference(pairs) {
  for (const [label, actual, expected] of pairs) {
    if (!Object.is(actual, expected)) return `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`;
  }
  return null;
}
/** A run that must pass both stages; null when it did, else the tail of its output. */
const bothPassed = ({ exif, build, output }) =>
  exif.status === 0 && build?.status === 0 ? null : `a stage failed (exif ${exif.status}, build ${build?.status ?? 'not run'}): ${output.trim().split('\n').slice(-3).join(' | ')}`;
/** The true position's fixed-decimal strings that must never appear in any output (D-12). */
const leaks = (output, values) => values.filter((s) => output.includes(s));
/**
 * The coarse-photo case shared by the 3dp tracer and the 2dp case: one synthetic
 * photo at LV95 `point` through both stages; asserts the sidecar is rounded before
 * the write with no GPS altitude and the true-spot ramp height rounded to `step`,
 * and the generated position is approximate and precision-tagged.
 */
async function coarseCase({ id, point, precision, d, step, radiusM, reasonPart }) {
  const truth = geo('lv95ToWgs84', point);
  const file = `${id.toUpperCase()}.jpg`;
  const jpeg = await gpsJpeg({ make: 'SELFTEST', lat: truth.lat, lon: truth.lon, altM: 1234.5 });
  const trueGrid = geo('wgs84ToLv95', { lat: jpeg.lat, lon: jpeg.lon });
  const ground = rampM(trueGrid.e);
  clearOfBoundary(ground, step, 'the true-spot ramp height');
  const rounded = { lat: roundDp(jpeg.lat, d), lon: roundDp(jpeg.lon, d) };
  if (!insideExtent(geo('wgs84ToLv95', rounded))) throw new Error('selftest: the rounded position leaves the fixture plate; pick another point');
  const root = await tempPrivacyRoot({ records: { [id]: { file, region: 'fixture', country: 'CH', precision, kind: 'ground', bytes: jpeg.bytes } } });
  const result = privacyRun(root, id);
  const failed = bothPassed(result);
  if (failed) return failed;
  const { entry, fact, output } = result;
  if (!entry?.gps || !fact?.position) return 'no sidecar GPS or no generated position was written';
  const leaked = leaks(output, [jpeg.lat.toFixed(5), jpeg.lon.toFixed(5)]);
  if (leaked.length) return `an output line holds the true position at 5 decimals (${leaked.length} strings)`;
  return firstDifference([
    ['sidecar lat', entry.gps.lat, rounded.lat],
    ['sidecar lon', entry.gps.lon, rounded.lon],
    ['sidecar altM', entry.gps.altM, null],
    ['sidecar groundM', entry.gps.groundM, roundStep(ground, step)],
    ['position.approximate', fact.position.approximate, true],
    ['position.radiusM', fact.position.radiusM, radiusM],
    ['position.precision', fact.position.precision, precision],
    ['position.reason names the rounding', fact.position.reason?.includes(reasonPart), true],
    ['elevation.m', fact.elevation?.m, entry.gps.groundM],
  ]);
}

// scripts/terrain/: the plate registry through --root (DATA-11, 15-05 D-13)
const TERRAIN_BUILD = path.join(repoRoot, 'scripts', 'terrain', 'build-terrain.mjs');
const TERRAIN_PUBLIC = 'public/terrain';
/** Every file a terrain build reads or compares, besides public/terrain/ (copied whole). */
const TERRAIN_INPUTS = [
  'data/terrain/source/source.json',
  'data/terrain/source/dem-10m.png',
  'data/terrain/plates.json',
  'data/generated/terrain.ts',
  'data/generated/precache.json',
  'data/generated/plates.ts',
  'data/generated/home-plate.ts',
];
/** The modules a fixture plate must leave byte-equal (D-14, D-15): the home sheet module too (16-07). */
const TERRAIN_HOME_MODULES = ['data/generated/terrain.ts', 'data/generated/precache.json', 'data/generated/home-plate.ts'];
/** The synthetic second plate (D-13): a 2D plate with the declared output set (D-12). */
const FIXTURE_PLATE = {
  id: 'fixture',
  prefix: 'fixture-',
  source: 'data/terrain/plates/fixture',
  home: false,
  threeD: false,
  outputs: { contours: ['hero', 'strip'], hillshade: [1100, 640] },
  strip: { centreN: 1200500 },
};
/** The six files a 2D fixture plate with `prefix` builds, flat in public/terrain/ (D-11). */
const plateFileRes = (prefix) => [
  new RegExp(`^${prefix}contours-hero\\.[0-9a-f]{10}\\.svg$`),
  new RegExp(`^${prefix}contours-strip\\.[0-9a-f]{10}\\.svg$`),
  new RegExp(`^${prefix}hillshade-1100\\.[0-9a-f]{10}\\.avif$`),
  new RegExp(`^${prefix}hillshade-1100\\.[0-9a-f]{10}\\.webp$`),
  new RegExp(`^${prefix}hillshade-640\\.[0-9a-f]{10}\\.avif$`),
  new RegExp(`^${prefix}hillshade-640\\.[0-9a-f]{10}\\.webp$`),
];
const FIXTURE_FILES = plateFileRes(FIXTURE_PLATE.prefix);
/**
 * The synthetic BEV ALS DTM plate (16 D-09): a 2D plate on LAEA Europe
 * (EPSG:3035) over a synthetic extent, built from its own BEV-variant source.
 */
const LAEA_FIXTURE_PLATE = {
  id: 'fixture-laea',
  prefix: 'fixture-laea-',
  source: 'data/terrain/plates/fixture-laea',
  home: false,
  threeD: false,
  outputs: { contours: ['hero', 'strip'], hillshade: [1100, 640] },
  strip: { centreN: 2000500 },
};
const LAEA_FIXTURE_FILES = plateFileRes(LAEA_FIXTURE_PLATE.prefix);
/** The terrain fixture's synthetic EPSG:3035 extent: 100 x 100 cells of 10 m. */
const LAEA_FIXTURE_EXTENT = { west: 4000000, south: 2000000, east: 4001000, north: 2001000 };
/**
 * A BEV-variant source.json for a synthetic EPSG:3035 window: example.invalid
 * URLs, a selftest credit and the PNG's real sha256 (no real BEV record).
 */
function bevFixtureSource({ extent, width, height, png }) {
  return {
    product: 'BEV ALS DTM',
    tiles: [{ url: 'https://example.invalid/fixture-laea/tile.tif', contentLength: 1024, lastModified: 'Mon, 15 Sep 2025 00:00:00 GMT' }],
    doi: '10.0000/selftest-fixture',
    metadataUrl: 'https://example.invalid/fixture-laea/metadata',
    edition: '2025-09',
    editionSource: 'https://example.invalid/fixture-laea/metadata',
    crs: 'EPSG:3035',
    heightSystem: 'EVRF2000-AT',
    heightSystemEpsg: 'EPSG:9274',
    resampling: 'bilinear from overview level 3 (about 8 m) to 10 m cell centres',
    credit: 'selftest fixture',
    licence: 'CC BY 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    extent,
    cellM: 10,
    width,
    height,
    heightScale: 0.1,
    file: 'dem-10m.png',
    sha256: crypto.createHash('sha256').update(png).digest('hex'),
  };
}
/**
 * The fixture DEM: 100 x 100 grey16 PNG bytes, a cosine hill from 1,500 m at the
 * corners to about 2,500 m at the centre, stored in decimetres (heightScale 0.1),
 * so 100 m contours exist. Synthetic, so no network and no real region data.
 */
async function fixtureDem() {
  const n = 100;
  const u16 = new Uint16Array(n * n);
  const rMax = Math.hypot(49.5, 49.5);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const r = Math.hypot(x - 49.5, y - 49.5) / rMax;
      u16[y * n + x] = Math.round((1500 + 1000 * (0.5 + 0.5 * Math.cos(Math.PI * r))) * 10);
    }
  }
  // Pass the Uint16Array itself: a Buffer with raw depth 'ushort' corrupts silently (build-terrain.mjs encodeGrey16).
  return sharp(u16, { raw: { width: n, height: n, channels: 1 } }).toColourspace('grey16').png().toBuffer();
}
/**
 * Copies the terrain build's inputs and every public/terrain/ file into a fresh
 * temp root. With `fixture`, writes the synthetic plate (its DEM and source.json
 * under data/terrain/plates/fixture/) and lists it in the copy's registry, before
 * matterhorn when `fixtureFirst` (registry order must change no Matterhorn byte).
 * With `bevFixture`, also writes the EPSG:3035 plate LAEA_FIXTURE_PLATE (the same
 * hill DEM, a BEV-variant source.json) and lists it last. `fixtureCentreN`
 * overrides the 2D fixture's strip.centreN (the IN-05 case).
 * Async because sharp makes the DEM; nested one level down so the cleanup loop's
 * path.dirname removes the mkdtemp directory.
 */
async function tempTerrainRoot({ fixture = false, fixtureFirst = false, bevFixture = false, fixtureCentreN = null } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  const put = (rel, bytes) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), bytes);
  };
  const terrainFiles = fs
    .readdirSync(path.join(repoRoot, TERRAIN_PUBLIC), { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => `${TERRAIN_PUBLIC}/${d.name}`);
  for (const rel of [...TERRAIN_INPUTS, ...terrainFiles]) put(rel, fs.readFileSync(path.join(repoRoot, rel)));
  if (fixture) {
    const png = await fixtureDem();
    put(`${FIXTURE_PLATE.source}/dem-10m.png`, png);
    const source = {
      product: 'swissALTIRegio',
      stacItemUrl: 'https://example.invalid/fixture/stac-item',
      cogUrl: 'https://example.invalid/fixture/dem.tif',
      stacDatetime: '2026-05-28T00:00:00Z',
      stacUpdated: '2026-05-28T00:00:00Z',
      checksum: `1220${'0'.repeat(64)}`,
      edition: '2026-05',
      editionSource: 'stac:datetime',
      crs: 'EPSG:2056',
      heightSystem: 'LN02',
      extent: { west: 2600000, south: 1200000, east: 2601000, north: 1201000 },
      cellM: 10,
      width: 100,
      height: 100,
      heightScale: 0.1,
      file: 'dem-10m.png',
      sha256: crypto.createHash('sha256').update(png).digest('hex'),
    };
    put(`${FIXTURE_PLATE.source}/source.json`, `${JSON.stringify(source, null, 2)}\n`);
    const plate = fixtureCentreN === null ? FIXTURE_PLATE : { ...FIXTURE_PLATE, strip: { centreN: fixtureCentreN } };
    const registry = JSON.parse(fs.readFileSync(path.join(root, 'data/terrain/plates.json'), 'utf-8'));
    registry.plates = fixtureFirst ? [plate, ...registry.plates] : [...registry.plates, plate];
    put('data/terrain/plates.json', `${JSON.stringify(registry, null, 2)}\n`);
  }
  if (bevFixture) {
    const png = await fixtureDem();
    put(`${LAEA_FIXTURE_PLATE.source}/dem-10m.png`, png);
    const source = bevFixtureSource({ extent: LAEA_FIXTURE_EXTENT, width: 100, height: 100, png });
    put(`${LAEA_FIXTURE_PLATE.source}/source.json`, `${JSON.stringify(source, null, 2)}\n`);
    const registry = JSON.parse(fs.readFileSync(path.join(root, 'data/terrain/plates.json'), 'utf-8'));
    registry.plates.push(LAEA_FIXTURE_PLATE);
    put('data/terrain/plates.json', `${JSON.stringify(registry, null, 2)}\n`);
  }
  return root;
}
/** Runs the terrain build in write mode on `root`; null on success, else why it failed. */
function terrainWrite(root) {
  const r = spawnSync(process.execPath, [...PHOTO_NODE_ARGS, TERRAIN_BUILD, '--root', root], { encoding: 'utf-8' });
  if (r.status === 0) return null;
  return `terrain:build (write) on the fixture root exited ${r.status}: ${`${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-5).join(' | ')}`;
}
/** The file names in `root`'s public/terrain/. */
const terrainListing = (root) => fs.readdirSync(path.join(root, TERRAIN_PUBLIC)).sort();
/** Each repo file in `rels` that differs in `root`, by name; null when all are byte-equal. */
function terrainBytesEqual(root, rels) {
  const differ = rels.filter((rel) => {
    const p = path.join(root, rel);
    return !fs.existsSync(p) || !fs.readFileSync(p).equals(fs.readFileSync(path.join(repoRoot, rel)));
  });
  return differ.length ? `not byte-equal to the repo: ${differ.join(', ')}` : null;
}
/** The plate ids of `root`'s generated plates.ts, in file order. */
function terrainPlateIds(root) {
  const text = fs.readFileSync(path.join(root, 'data/generated/plates.ts'), 'utf-8');
  const m = /export const plates = ([\s\S]*) as const;\s*$/.exec(text);
  return m ? Object.keys(JSON.parse(m[1])) : [];
}
/** The Matterhorn files the repo serves today (the nine D-15 names). */
const matterhornFiles = () => terrainListing(repoRoot).map((f) => `${TERRAIN_PUBLIC}/${f}`);
/**
 * The fixture case's assertions after a write run: Matterhorn files and the home
 * modules byte-equal, exactly the six prefixed files new, plates.ts lists both.
 */
function fixturePlateProblems(root, writeError, { plate = FIXTURE_PLATE, files = FIXTURE_FILES } = {}) {
  if (writeError) return writeError;
  const problems = [];
  const same = terrainBytesEqual(root, [...matterhornFiles(), ...TERRAIN_HOME_MODULES]);
  if (same) problems.push(same);
  const repoNames = new Set(terrainListing(repoRoot));
  const added = terrainListing(root).filter((f) => !repoNames.has(f));
  const unmatched = added.filter((f) => !files.some((re) => re.test(f)));
  if (unmatched.length) problems.push(`unexpected new files: ${unmatched.join(', ')}`);
  for (const re of files) {
    const n = added.filter((f) => re.test(f)).length;
    if (n !== 1) problems.push(`${n} files match ${re.source}, expected 1`);
  }
  if (added.some((f) => f.startsWith(`${plate.prefix}heightmap-`) || f.startsWith(`${plate.prefix}contours-map-`)))
    problems.push('a 2D plate got a heightmap or a map LOD (D-12)');
  const ids = terrainPlateIds(root);
  if (JSON.stringify([...ids].sort()) !== JSON.stringify([plate.id, 'matterhorn'].sort()))
    problems.push(`plates.ts lists ${ids.join(', ') || 'nothing'}, expected ${plate.id} and matterhorn`);
  return problems.length ? problems.join('; ') : null;
}
const terrainFixtureRoot = await tempTerrainRoot({ fixture: true, fixtureFirst: true });
let terrainFixtureWrite = null;
/** 16 D-09: a BEV ALS DTM plate on EPSG:3035 builds through the same builder. */
const terrainLaeaRoot = await tempTerrainRoot({ bevFixture: true });
let terrainLaeaWrite = null;
/** The `id` sheet of `root`'s generated plates.ts, or null. */
function terrainSheet(root, id) {
  const m = /export const plates = ([\s\S]*) as const;\s*$/.exec(fs.readFileSync(path.join(root, 'data/generated/plates.ts'), 'utf-8'));
  return m ? JSON.parse(m[1])[id] ?? null : null;
}
/** 16 D-22 IN-05: the 2D fixture's strip centre 1 km south of its extent. */
const terrainStripRoot = await tempTerrainRoot({ fixture: true, fixtureCentreN: 1199000 });
let terrainStripBefore = null;
/** 16 D-22 IN-06: a root whose terrain.ts is cut in half (unreadable to committedMeta). */
const terrainUnreadableRoot = await tempTerrainRoot();
{
  const meta = path.join(terrainUnreadableRoot, 'data/generated/terrain.ts');
  const text = fs.readFileSync(meta, 'utf-8');
  fs.writeFileSync(meta, text.slice(0, Math.floor(text.length / 2)));
}
let terrainUnreadableBefore = null;
/** Pitfall 4: a deleted prefixed file must be named by --check. */
const terrainMissingRoot = await tempTerrainRoot({ fixture: true });
let terrainMissingWrite = null;
let terrainMissingFile = null;
/** F15 / T-15-33: dropping a plate from the registry sweeps exactly its files. */
const terrainRemoveRoot = await tempTerrainRoot({ fixture: true });
let terrainRemoveWrite = null;
let terrainRemoveBuilt = 0;
/** 15 WR-01: a hillshade size dropped from a plate's outputs is named by --check and swept by a write. */
const FIXTURE_1100 = /^fixture-hillshade-1100\.[0-9a-f]{10}\.(avif|webp)$/;
/**
 * Builds the fixture plate in write mode, then drops 1100 from its declared
 * hillshade sizes in `root`'s registry. Returns the write error (or null) and
 * the 1100 file names that write produced.
 */
function terrainDropSize(root) {
  const writeError = terrainWrite(root);
  const dropped = terrainListing(root).filter((f) => FIXTURE_1100.test(f));
  const rel = path.join(root, 'data/terrain/plates.json');
  const registry = JSON.parse(fs.readFileSync(rel, 'utf-8'));
  for (const p of registry.plates) if (p.id === FIXTURE_PLATE.id) p.outputs.hillshade = [640];
  fs.writeFileSync(rel, `${JSON.stringify(registry, null, 2)}\n`);
  return { writeError, dropped };
}
const terrainDropCheckRoot = await tempTerrainRoot({ fixture: true });
let terrainDropCheck = { writeError: null, dropped: [] };
const terrainDropWriteRoot = await tempTerrainRoot({ fixture: true });
let terrainDropWrite = { writeError: null, dropped: [] };

// tsconfig.jest.json type-checks every file Jest runs (GUARD-10, 15 WR-03): probe files in a temp copy of the configs.
const TSC = createRequire(import.meta.url).resolve('typescript/bin/tsc');
/** The jest.config.js testMatch the probes model; changing it means updating tsconfig.jest.json's include too. */
const JEST_TEST_MATCH = "testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],";
/** TypeScript files that testMatch runs, inside and outside __tests__/ (e2e/ is in testPathIgnorePatterns). */
const JEST_RUN_PROBES = [
  'lib/__tests__/probe.ts',
  'components/__tests__/probe.tsx',
  'lib/probe.test.ts',
  'components/probe.test.tsx',
  'lib/probe.spec.ts',
  'components/probe.spec.tsx',
];
/** Files no Jest run reaches, which tsconfig.jest.json must leave to their own configs. */
const JEST_SKIP_PROBES = ['e2e/probe.spec.ts', 'scripts/guards/__selftest__/probe.test.ts'];
/** A plain source file: the base tsconfig.json checks it, tsconfig.jest.json does not. */
const SOURCE_PROBE = 'lib/probe.ts';
/** The files `tsc -p <config> --listFilesOnly` lists under `root`, as root-relative paths. */
function tscListFiles(root, config) {
  const r = spawnSync(process.execPath, [TSC, '-p', path.join(root, config), '--listFilesOnly'], { encoding: 'utf-8' });
  if (r.status !== 0) throw new Error(`tsc -p ${config} --listFilesOnly exited ${r.status}: ${`${r.stdout}${r.stderr}`.trim()}`);
  const marker = '/root/';
  return new Set(
    r.stdout
      .split(/\r?\n/)
      .map((f) => f.trim().replace(/\\/g, '/'))
      .filter((f) => f.includes(marker))
      .map((f) => f.slice(f.lastIndexOf(marker) + marker.length)),
  );
}
function jestTypeCheckCoverage() {
  const jestConfig = fs.readFileSync(path.join(repoRoot, 'jest.config.js'), 'utf-8');
  if (!jestConfig.includes(JEST_TEST_MATCH))
    return `jest.config.js no longer holds ${JEST_TEST_MATCH}; align tsconfig.jest.json's include and these probes with the new testMatch`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-'));
  const root = path.join(dir, 'root');
  try {
    putFiles(root, {
      'tsconfig.json': fs.readFileSync(path.join(repoRoot, 'tsconfig.json'), 'utf-8'),
      'tsconfig.jest.json': fs.readFileSync(path.join(repoRoot, 'tsconfig.jest.json'), 'utf-8'),
      ...Object.fromEntries([...JEST_RUN_PROBES, ...JEST_SKIP_PROBES, SOURCE_PROBE].map((rel) => [rel, 'export {};\n'])),
    });
    const jestFiles = tscListFiles(root, 'tsconfig.jest.json');
    const baseFiles = tscListFiles(root, 'tsconfig.json');
    const problems = [];
    for (const rel of JEST_RUN_PROBES) {
      if (!jestFiles.has(rel)) problems.push(`tsconfig.jest.json does not type-check ${rel}, which Jest runs`);
      if (baseFiles.has(rel)) problems.push(`tsconfig.json also checks ${rel}, without the Jest globals`);
    }
    for (const rel of JEST_SKIP_PROBES) if (jestFiles.has(rel)) problems.push(`tsconfig.jest.json reaches ${rel}, which Jest does not run`);
    if (!baseFiles.has(SOURCE_PROBE) || jestFiles.has(SOURCE_PROBE)) problems.push(`${SOURCE_PROBE} should be checked by tsconfig.json only`);
    return problems.length ? problems.join('; ') : null;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

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
    name: 'test-count: --scan-only fails on a focused call under e2e/',
    guard: TEST_COUNT,
    args: ['--scan-only', '--root', tc('focused')],
    expectExit: 1,
    expectOutput: ['focused/skipped call', 'x.ts:2'],
  },
  {
    name: 'test-count: --scan-only fails on a .fixme( call under e2e/',
    guard: TEST_COUNT,
    args: ['--scan-only', '--root', tc('fixme')],
    expectExit: 1,
    expectOutput: ['focused/skipped call', 'y.ts:2', '.fixme('],
  },
  {
    name: 'test-count: --scan-only passes a clean tree',
    guard: TEST_COUNT,
    args: ['--scan-only', '--root', tc('clean')],
    expectExit: 0,
    expectOutput: ['test-count: scan OK'],
  },
  {
    name: 'test-count: --scan-only rejects --jest',
    guard: TEST_COUNT,
    args: ['--scan-only', '--jest', tc('jest-66.json')],
    expectExit: 1,
    expectOutput: ['--scan-only takes only --root'],
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
    name: 'served-images: telemetry: a DJI .SRT sidecar fails',
    guard: SERVED,
    args: [],
    setup: () => ['--root', tempTelemetryRoot(['clips/DJI_0001.SRT'])],
    expectExit: 1,
    expectOutput: ['clips/DJI_0001.SRT telemetry:', 'served-images: 1 violations'],
  },
  {
    name: 'served-images: telemetry: every sidecar and track type fails in any case, GeoJSON passes',
    guard: SERVED,
    args: [],
    setup: () => ['--root', tempTelemetryRoot([...TELEMETRY_FILES, 'map.geojson'])],
    expectExit: 1,
    expectOutput: [...TELEMETRY_FILES.map((rel) => `${rel} telemetry:`), `served-images: ${TELEMETRY_FILES.length} violations`],
    check: (output) => (output.includes('map.geojson') ? 'the output names map.geojson, which must stay allowed (D-20)' : null),
  },
  {
    name: 'served-images: telemetry: an untracked unignored sidecar fails',
    guard: SERVED,
    args: [],
    cwd: telemetryUntrackedRepo,
    expectExit: 1,
    expectOutput: ['DJI_0001.SRT telemetry:', 'served-images: 1 violations'],
  },
  {
    name: 'served-images: telemetry: an ignored file under public/ fails',
    guard: SERVED,
    args: [],
    cwd: telemetryPublicRepo,
    expectExit: 1,
    expectOutput: ['public/flight.gpx telemetry:', 'served-images: 1 violations'],
  },
  {
    name: "served-images: telemetry: an ignored untracked original's sidecar passes",
    guard: SERVED,
    args: [],
    cwd: telemetryOriginalRepo,
    expectExit: 0,
    expectOutput: ['served-images: OK'],
  },
  {
    name: 'served-images: telemetry: a force-added sidecar under the originals folder fails',
    guard: SERVED,
    args: [],
    cwd: telemetryForcedRepo,
    expectExit: 1,
    expectOutput: ['assets/photos-original/route.KML telemetry:', 'served-images: 1 violations'],
  },
  {
    name: 'served-images: telemetry: outside a git work tree the scan fails, never a silent pass',
    guard: SERVED,
    args: [],
    cwd: telemetryNoGit.root,
    expectExit: 1,
    expectOutput: ['scope: git ls-files failed', 'served-images: 1 violations'],
    check: () => (telemetryNoGit.insideWorkTree ? `git finds a work tree at ${telemetryNoGit.root}, so this case proves nothing` : null),
  },
  ...TELEMETRY_TRACKS.map(({ name, handler, entry, kind }) => ({
    name: `served-images: an MP4 with a ${kind} track fails the video rule`,
    guard: SERVED,
    args: [],
    setup: () => ['--root', tempMp4TrackRoot(name, handler, entry)],
    expectExit: 1,
    expectOutput: [`clips/${name} video: tracks: vide,${handler}`, 'served-images: 1 violations'],
  })),
  ...TELEMETRY_TRACKS.map(({ handler, entry, kind }) => ({
    name: `mp4-boxes: checkMp4 reports only the track rule for a spliced ${kind} track (${handler}/${entry})`,
    fn: () => expectEqual('violations', checkMp4(withTrack(goodMp4(), trak(handler, entry))).join('; '), TRACK_MESSAGE(handler)),
  })),
  {
    name: 'mp4-boxes: the spliced telemetry clips are deterministic',
    fn: () => {
      const good = goodMp4();
      for (const { handler, entry, kind } of TELEMETRY_TRACKS) {
        const t = trak(handler, entry);
        const a = withTrack(goodMp4(), trak(handler, entry));
        const b = withTrack(goodMp4(), trak(handler, entry));
        if (Buffer.compare(a, b) !== 0) return `${kind}: two builds differ`;
        if (a.length !== good.length + t.length) return `${kind}: ${a.length} B, expected ${good.length} + ${t.length} B`;
        if (a.length !== 1348) return `${kind}: ${a.length} B, expected 1,348 B (15-RESEARCH measurement)`;
      }
      return null;
    },
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
    name: 'tailwind-sources: no DOCS_ONLY_FILES entry is a Tailwind source of app/globals.css (13 WR-02)',
    fn: async () => {
      const { error, scanned } = await docsOnlyTailwindSources(fs.readFileSync(GLOBALS_CSS, 'utf-8'));
      if (error) return error;
      return scanned.length === 0 ? null : `Tailwind scans ${scanned.join(', ')}; add @source not "../<file>" to app/globals.css`;
    },
  },
  {
    name: 'tailwind-sources: the same scan reports README.md and AGENTS.md once their @source not lines are removed',
    fn: async () => {
      const css = fs.readFileSync(GLOBALS_CSS, 'utf-8');
      const stripped = DOCS_ONLY_FILES.reduce((text, f) => text.split(`@source not "../${f}";`).join(''), css);
      if (stripped === css) return 'app/globals.css has no @source not line for any DOCS_ONLY_FILES entry';
      const { error, scanned } = await docsOnlyTailwindSources(stripped);
      if (error) return error;
      return ['README.md', 'AGENTS.md'].every((f) => scanned.includes(f)) ? null : `expected README.md and AGENTS.md among the scanned docs files, got ${JSON.stringify(scanned)}`;
    },
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
        (text) => text.replace(/^( {10})now=\$\(date/m, '$1gh pr checkout "$REF"\n$1now=$(date'),
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
    expectOutput: ['r004-011: position lies outside the DEM extent; plate matterhorn', 'photos:build: stale'],
    // 16 D-12: the message names the photo and the plate, never a uv or a position.
    check: (output) => (/uv|46\.2333|7\.36/.test(output) ? 'the off-plate message prints a uv or the position' : null),
  },
  // 15-06 (DATA-10, D-01 to D-05): the photo map and the region registry. Write mode
  // (no --check) except the stale case: a failing build writes nothing.
  {
    name: 'photos:build: a sidecar photo with no photo-map record fails',
    guard: PHOTO_DATA,
    nodeArgs: PHOTO_NODE_ARGS,
    args: [],
    setup: () => {
      photoMapMissingRoot = tempPhotoDataRoot(({ photoMap }) => {
        mapRecord(photoMap, 'img-0629');
        delete photoMap.photos['img-0629'];
      });
      return ['--root', photoMapMissingRoot];
    },
    expectExit: 1,
    expectOutput: ['photos:build: add a record for IMG_0629', '(img-0629) to data/photos/photo-map.json', 'photos:build: nothing written'],
    check: noSortRefine,
  },
  {
    name: 'photos:build: a photo-map record with no sidecar entry fails',
    guard: PHOTO_DATA,
    nodeArgs: PHOTO_NODE_ARGS,
    args: [],
    setup: () => {
      photoMapOrphanRoot = tempPhotoDataRoot(({ photoMap }) => {
        // Sorted between img-0662 and r004-011.
        addMapRecord(photoMap, 'img-9999', { file: 'IMG_9999.jpg', region: 'zermatt', country: 'CH', precision: '4dp', kind: 'ground' });
      });
      return ['--root', photoMapOrphanRoot];
    },
    expectExit: 1,
    expectOutput: ['data/photos/photo-map.json has img-9999, but the sidecar has no entry', 'photos:build: nothing written'],
    check: noSortRefine,
  },
  {
    name: 'photos:build: two records naming one file fail',
    guard: PHOTO_DATA,
    nodeArgs: PHOTO_NODE_ARGS,
    args: [],
    setup: () => {
      photoMapDuplicateRoot = tempPhotoDataRoot(({ photoMap }) => {
        mapRecord(photoMap, 'img-0629').file = mapRecord(photoMap, 'img-0605').file;
      });
      return ['--root', photoMapDuplicateRoot];
    },
    expectExit: 1,
    expectOutput: ['is named by both img-0605 and img-0629; one original has one record', 'photos:build: nothing written'],
    check: noSortRefine,
  },
  {
    name: 'photos:build: an unknown region fails',
    guard: PHOTO_DATA,
    nodeArgs: PHOTO_NODE_ARGS,
    args: [],
    setup: () => {
      photoMapUnknownRegionRoot = tempPhotoDataRoot(({ photoMap }) => {
        mapRecord(photoMap, 'img-0662').region = 'saas';
      });
      return ['--root', photoMapUnknownRegionRoot];
    },
    expectExit: 1,
    expectOutput: ['img-0662: region saas is not in data/regions/regions.json', 'photos:build: nothing written'],
    check: noSortRefine,
  },
  {
    name: 'photos:build: a region on an unknown plate fails',
    guard: PHOTO_DATA,
    nodeArgs: PHOTO_NODE_ARGS,
    args: [],
    setup: () => {
      photoMapUnknownPlateRoot = tempPhotoDataRoot(({ regions }) => {
        regionEntry(regions, 'zermatt').plate = 'monte-rosa';
      });
      return ['--root', photoMapUnknownPlateRoot];
    },
    expectExit: 1,
    expectOutput: ['region zermatt: plate monte-rosa is not in data/terrain/plates.json', 'photos:build: nothing written'],
    check: noSortRefine,
  },
  {
    name: 'photos:build: a lowercase country fails the closed enum',
    guard: PHOTO_DATA,
    nodeArgs: PHOTO_NODE_ARGS,
    args: [],
    setup: () => {
      photoMapCountryRoot = tempPhotoDataRoot(({ photoMap }) => {
        mapRecord(photoMap, 'img-0605').country = 'ch';
      });
      return ['--root', photoMapCountryRoot];
    },
    expectExit: 1,
    expectOutput: ['photos:build: schema photos.img-0605.country:', 'photos:build: 1 schema violations', 'photos:build: nothing written'],
    check: noSortRefine,
  },
  {
    name: 'photos:build: a moved photo makes photos.ts stale',
    guard: PHOTO_DATA,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--check'],
    setup: () => {
      photoMapMovedRoot = tempPhotoDataRoot(({ photoMap, regions }) => {
        // Sorted before zermatt; same plate, so only the region in photos.ts changes.
        addRegion(regions, { id: 'saas', name: 'Saas', plate: 'matterhorn' });
        mapRecord(photoMap, 'img-0662').region = 'saas';
      });
      return ['--root', photoMapMovedRoot];
    },
    expectExit: 1,
    expectOutput: ['photos:build: data/generated/photos.ts differs from a fresh build', 'photos:build: stale'],
    check: noSortRefine,
  },
  // 15-07 (DATA-10, D-01): extraction ids come from the photo map, never the file name.
  // Write mode on generated JPEGs (tempExifRoot); a failing run writes no sidecar.
  {
    name: 'photos:exif: ids come from the photo map',
    guard: PHOTO_EXIF,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--root', exifMappedRoot],
    expectExit: 0,
    expectOutput: ['photos:exif: wrote data/photos/exif-sidecar.json (2 photos)', 'photos:exif: OK'],
    check: () => exifSidecarIds(exifMappedRoot, { 'DJI_0001.JPG': 'img-9001', 'IMG_0605.jpg': 'img-9002' }),
  },
  {
    name: 'photos:exif: an original with no photo-map record fails',
    guard: PHOTO_EXIF,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--root', exifUnmappedRoot],
    expectExit: 1,
    expectOutput: ['photos:exif: add a record for IMG_0605.jpg to data/photos/photo-map.json'],
    check: noExifSidecar(exifUnmappedRoot),
  },
  {
    name: 'photos:exif: two records naming one file fail',
    guard: PHOTO_EXIF,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--root', exifDuplicateRoot],
    expectExit: 1,
    expectOutput: ['DJI_0001.JPG is named by both img-9001 and img-9002; one original has one record', 'photos:exif: data/photos/photo-map.json: 1 schema violations'],
    check: noExifSidecar(exifDuplicateRoot),
  },
  // 16-01 (DATA-14, D-01 to D-04): location privacy through both stages on generated
  // JPEGs with EXIF GPS (gpsJpeg, tempPrivacyRoot). Every true position is computed
  // here, inside the synthetic fixture plate; no real photo data is read.
  {
    name: 'privacy: a 3dp photo is rounded before the write, gets a 10 m ground height and an approximate position',
    fn: () =>
      coarseCase({
        id: 'img-9101',
        point: { e: 2601234.567, n: 1201789.123 },
        precision: '3dp',
        d: 3,
        step: 10,
        radiusM: 100,
        reasonPart: 'about 100 m',
      }),
  },
  {
    name: 'privacy: a 2dp photo gets a 50 m ground height and a 1 km radius',
    fn: () =>
      coarseCase({
        id: 'img-9102',
        point: { e: 2602345.678, n: 1202123.456 },
        precision: '2dp',
        d: 2,
        step: 50,
        radiusM: 1000,
        reasonPart: 'about 1 km',
      }),
  },
  {
    name: 'privacy: an aerial DJI still keeps no GPS altitude',
    fn: async () => {
      const id = 'img-9103';
      const truth = geo('lv95ToWgs84', { e: 2601567.891, n: 1202456.789 });
      const jpeg = await gpsJpeg({ make: 'DJI', lat: truth.lat, lon: truth.lon, altM: 2500.3 });
      const rounded = { lat: roundDp(jpeg.lat, 4), lon: roundDp(jpeg.lon, 4) };
      const height = rampM(geo('wgs84ToLv95', rounded).e);
      clearOfBoundary(height, 1, 'the ramp height at the 4dp position');
      const root = await tempPrivacyRoot({
        records: { [id]: { file: 'DJI_0153.JPG', region: 'fixture', country: 'CH', precision: '4dp', kind: 'aerial', bytes: jpeg.bytes } },
      });
      const result = privacyRun(root, id);
      const failed = bothPassed(result);
      if (failed) return failed;
      const { entry, fact, output } = result;
      if (!entry?.gps || !fact?.position) return 'no sidecar GPS or no generated position was written';
      if (Object.hasOwn(entry.gps, 'groundM')) return 'a 4dp aerial photo got a groundM';
      if (output.includes('2500')) return 'an output line holds the GPS altitude';
      return firstDifference([
        ['sidecar make', entry.make, 'DJI'],
        ['sidecar altM', entry.gps.altM, null],
        ['sidecar lat', entry.gps.lat, rounded.lat],
        ['sidecar lon', entry.gps.lon, rounded.lon],
        ['elevation.m', fact.elevation?.m, Math.round(height)],
        ['kind', fact.kind, 'aerial'],
        ['position.approximate', fact.position.approximate, false],
        ['position.precision', fact.position.precision, '4dp'],
      ]);
    },
  },
  {
    name: 'privacy: a DJI still not marked aerial fails and writes nothing',
    fn: async () => {
      const id = 'img-9104';
      const truth = geo('lv95ToWgs84', { e: 2601500, n: 1202500 });
      const jpeg = await gpsJpeg({ make: 'dji', lat: truth.lat, lon: truth.lon, altM: 2400 });
      const file = 'DJI_0163.JPG';
      const root = await tempPrivacyRoot({
        records: { [id]: { file, region: 'fixture', country: 'CH', precision: '4dp', kind: 'ground', bytes: jpeg.bytes } },
      });
      const { exif, build, output } = privacyRun(root, id);
      if (exif.status !== 1 || build !== null) return `photos:exif exited ${exif.status}, expected 1`;
      if (!output.includes(`${file} is a DJI still`) || !output.includes('"kind": "aerial"')) return `the message lacks the file or the fix: ${output.trim()}`;
      return noExifSidecar(root)();
    },
  },
  {
    name: 'privacy: a record without a precision fails naming the file',
    fn: async () => {
      const id = 'img-9105';
      const truth = geo('lv95ToWgs84', { e: 2601500, n: 1202500 });
      const jpeg = await gpsJpeg({ make: 'SELFTEST', lat: truth.lat, lon: truth.lon });
      const file = 'IMG_9105.jpg';
      const root = await tempPrivacyRoot({ records: { [id]: { file, region: 'fixture', country: 'CH', kind: 'ground', bytes: jpeg.bytes } } });
      const { exif, output } = privacyRun(root, id);
      if (exif.status !== 1) return `photos:exif exited ${exif.status}, expected 1`;
      if (!output.includes(`add a precision ('4dp', '3dp' or '2dp') to the record for ${file} in data/photos/photo-map.json`)) {
        return `the message lacks the fix or the file: ${output.trim()}`;
      }
      return noExifSidecar(root)();
    },
  },
  {
    name: 'privacy: a coarse photo rounded off its plate fails without printing its position',
    fn: async () => {
      // Scan points 20 to 500 m inside each edge for a true spot on the plate whose
      // 2-decimal rounding lands off it; assert the choice before running.
      const x = PRIVACY_EXTENT;
      const candidates = [];
      for (let t = 1; t < 16; t++) {
        const along = t * 250;
        for (let dist = 20; dist <= 500; dist += 20) {
          candidates.push({ e: x.west + dist, n: x.south + along }, { e: x.east - dist, n: x.south + along });
          candidates.push({ e: x.west + along, n: x.south + dist }, { e: x.west + along, n: x.north - dist });
        }
      }
      const raws = geoBatch('lv95ToWgs84', candidates);
      // The position extraction decodes from the EXIF rationals gpsJpeg writes for each raw value.
      const truths = raws.map(({ lat, lon }) => ({ lat: toDms(lat).decoded, lon: toDms(lon).decoded }));
      const roundeds = truths.map(({ lat, lon }) => ({ lat: roundDp(lat, 2), lon: roundDp(lon, 2) }));
      const trueGrids = geoBatch('wgs84ToLv95', truths);
      const roundedGrids = geoBatch('wgs84ToLv95', roundeds);
      const inner = { west: x.west + 10, south: x.south + 10, east: x.east - 10, north: x.north - 10 };
      const pick = candidates.findIndex((_, i) => insideExtent(trueGrids[i], inner) && !insideExtent(roundedGrids[i]));
      if (pick < 0) throw new Error('selftest: no candidate rounds off the fixture plate');
      const truth = truths[pick];
      const rounded = roundeds[pick];
      const id = 'img-9106';
      const jpeg = await gpsJpeg({ make: 'SELFTEST', lat: raws[pick].lat, lon: raws[pick].lon, altM: 1500 });
      if (jpeg.lat !== truth.lat || jpeg.lon !== truth.lon) throw new Error('selftest: the encoded position differs from the scanned one');
      const root = await tempPrivacyRoot({
        records: { [id]: { file: 'IMG_9106.jpg', region: 'fixture', country: 'CH', precision: '2dp', kind: 'ground', bytes: jpeg.bytes } },
      });
      const { exif, build, output } = privacyRun(root, id);
      if (exif.status !== 0) return `photos:exif exited ${exif.status}; the true spot is on the plate: ${output.trim()}`;
      if (build?.status !== 1) return `photos:build exited ${build?.status}, expected 1`;
      if (!output.includes('img-9106: position lies outside the DEM extent; plate fixture')) return `the message lacks the off-plate fix: ${output.trim()}`;
      const strings = [truth.lat.toFixed(5), truth.lon.toFixed(5), truth.lat.toFixed(4), truth.lon.toFixed(4), rounded.lat.toFixed(2), rounded.lon.toFixed(2)];
      const leaked = leaks(output, strings);
      return leaked.length ? `the output holds the true or the rounded position (${leaked.length} strings)` : null;
    },
  },
  {
    name: 'privacy: a hand-placed position finer than its precision fails',
    fn: async () => {
      const id = 'img-9107';
      const centre = geo('lv95ToWgs84', { e: 2602111, n: 1202222 });
      const placed = { lat: roundDp(centre.lat, 4), lon: roundDp(centre.lon, 4) };
      if (roundDp(placed.lat, 3) === placed.lat && roundDp(placed.lon, 3) === placed.lon) throw new Error('selftest: the hand-placed position has only 3 decimals; pick another point');
      const jpeg = await gpsJpeg({ make: 'SELFTEST' });
      const root = await tempPrivacyRoot({
        records: { [id]: { file: 'R900-001.jpg', region: 'fixture', country: 'CH', precision: '3dp', kind: 'ground', bytes: jpeg.bytes } },
        corrections: { [id]: { position: { ...placed, source: 'hand-placed', approximate: true, reason: 'selftest: placed by hand', radiusM: 100 } } },
      });
      const { exif, build, output } = privacyRun(root, id);
      if (exif.status !== 0) return `photos:exif exited ${exif.status}: ${output.trim()}`;
      if (build?.status !== 1) return `photos:build exited ${build?.status}, expected 1`;
      if (!output.includes('img-9107: position has more decimals than its precision 3dp')) return `the message lacks the precision rule: ${output.trim()}`;
      const leaked = leaks(output, [String(placed.lat), String(placed.lon)]);
      return leaked.length ? 'the output holds the hand-placed position' : null;
    },
  },
  {
    name: 'privacy: a photo on an EPSG:3035 plate gets its uv and height through proj4',
    fn: async () => {
      // Two synthetic photos inside the LAEA plate, placed through fromGrid('EPSG:3035'):
      // a 4dp one (stage 2 projects and samples the rounded position) and a 3dp one
      // (stage 1 samples the true spot; stage 2 projects the rounded position).
      const x = PRIVACY_LAEA_EXTENT;
      const [fine, coarse] = plateGridBatch('fromGrid', 'EPSG:3035', [
        { e: 4001234.567, n: 2001789.123 },
        { e: 4002345.678, n: 2002123.456 },
      ]);
      const fineJpeg = await gpsJpeg({ make: 'SELFTEST', lat: fine.lat, lon: fine.lon });
      const coarseJpeg = await gpsJpeg({ make: 'SELFTEST', lat: coarse.lat, lon: coarse.lon, altM: 1500 });
      const fineRounded = { lat: roundDp(fineJpeg.lat, 4), lon: roundDp(fineJpeg.lon, 4) };
      const coarseRounded = { lat: roundDp(coarseJpeg.lat, 3), lon: roundDp(coarseJpeg.lon, 3) };
      const [fineGrid, coarseTrueGrid, coarseGrid] = plateGridBatch('toGrid', 'EPSG:3035', [
        fineRounded,
        { lat: coarseJpeg.lat, lon: coarseJpeg.lon },
        coarseRounded,
      ]);
      for (const g of [fineGrid, coarseTrueGrid, coarseGrid]) {
        if (!insideExtent(g, { west: x.west + 10, south: x.south + 10, east: x.east - 10, north: x.north - 10 })) throw new Error('selftest: a fixture position leaves the LAEA plate; pick another point');
      }
      const fineHeight = laeaDemM(fineGrid.e);
      clearOfBoundary(fineHeight, 1, 'the LAEA ramp height at the 4dp position');
      const coarseGround = laeaDemM(coarseTrueGrid.e);
      clearOfBoundary(coarseGround, 10, 'the LAEA ramp height at the 3dp true spot');
      const [fineUv, coarseUv] = plateDemBatch('gridToUv', [
        [fineGrid, x],
        [coarseGrid, x],
      ]).map(({ u, v }) => ({ u: roundDp(u, 4), v: roundDp(v, 4) }));
      const root = await tempPrivacyRoot({
        laeaPlate: true,
        records: {
          'img-9108': { file: 'IMG_9108.jpg', region: 'fixture-laea', country: 'AT', precision: '4dp', kind: 'ground', bytes: fineJpeg.bytes },
          'img-9109': { file: 'IMG_9109.jpg', region: 'fixture-laea', country: 'AT', precision: '3dp', kind: 'ground', bytes: coarseJpeg.bytes },
        },
      });
      const result = privacyRun(root, 'img-9108');
      const failed = bothPassed(result);
      if (failed) return failed;
      const { entry: fineEntry, fact: fineFact } = result;
      const { entry: coarseEntry, fact: coarseFact } = privacyWritten(root, 'img-9109');
      if (!fineEntry?.gps || !fineFact?.uv || !coarseEntry?.gps || !coarseFact?.uv) return 'no sidecar GPS or no generated uv was written';
      const leaked = leaks(result.output, [coarseJpeg.lat.toFixed(5), coarseJpeg.lon.toFixed(5)]);
      if (leaked.length) return `an output line holds the 3dp true position at 5 decimals (${leaked.length} strings)`;
      return firstDifference([
        ['4dp sidecar lat', fineEntry.gps.lat, fineRounded.lat],
        ['4dp sidecar lon', fineEntry.gps.lon, fineRounded.lon],
        ['4dp groundM absent', Object.hasOwn(fineEntry.gps, 'groundM'), false],
        ['4dp uv.u', fineFact.uv.u, fineUv.u],
        ['4dp uv.v', fineFact.uv.v, fineUv.v],
        ['4dp elevation.m', fineFact.elevation?.m, Math.round(fineHeight)],
        ['4dp country', fineFact.country, 'AT'],
        ['3dp sidecar lat', coarseEntry.gps.lat, coarseRounded.lat],
        ['3dp sidecar lon', coarseEntry.gps.lon, coarseRounded.lon],
        ['3dp sidecar altM', coarseEntry.gps.altM, null],
        ['3dp sidecar groundM', coarseEntry.gps.groundM, roundStep(coarseGround, 10)],
        ['3dp uv.u', coarseFact.uv.u, coarseUv.u],
        ['3dp uv.v', coarseFact.uv.v, coarseUv.v],
        ['3dp elevation.m', coarseFact.elevation?.m, coarseEntry.gps.groundM],
        ['3dp position.approximate', coarseFact.position?.approximate, true],
      ]);
    },
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
  {
    // D-13: the fixture is listed before matterhorn, so a byte-equal Matterhorn also proves registry order changes no output.
    name: 'terrain: a fixture 2D plate gets its own prefixed files and Matterhorn stays byte-equal',
    guard: TERRAIN_BUILD,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--check'],
    setup: () => {
      terrainFixtureWrite = terrainWrite(terrainFixtureRoot);
      return ['--root', terrainFixtureRoot];
    },
    expectExit: 0,
    expectOutput: ['terrain: OK'],
    check: () => fixturePlateProblems(terrainFixtureRoot, terrainFixtureWrite),
  },
  {
    // 16 D-09: the --check run after the write must print terrain: OK on the same root.
    name: 'terrain: an EPSG:3035 fixture plate gets its own prefixed files and a laea sheet',
    guard: TERRAIN_BUILD,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--check'],
    setup: () => {
      terrainLaeaWrite = terrainWrite(terrainLaeaRoot);
      return ['--root', terrainLaeaRoot];
    },
    expectExit: 0,
    expectOutput: ['terrain: OK'],
    check: () => {
      const problems = fixturePlateProblems(terrainLaeaRoot, terrainLaeaWrite, { plate: LAEA_FIXTURE_PLATE, files: LAEA_FIXTURE_FILES });
      if (problems) return problems;
      const sheet = terrainSheet(terrainLaeaRoot, LAEA_FIXTURE_PLATE.id);
      if (!sheet) return 'plates.ts has no fixture-laea sheet';
      return firstDifference([
        ['sheet crs', sheet.crs, 'EPSG:3035'],
        ['sheet dem.product', sheet.dem?.product, 'BEV ALS DTM'],
        ['sheet extent.laea', JSON.stringify(sheet.extent?.laea), JSON.stringify(LAEA_FIXTURE_EXTENT)],
        ['sheet extent has no lv95', Object.hasOwn(sheet.extent ?? {}, 'lv95'), false],
        ['sheet strip has laea', Object.hasOwn(sheet.contours?.strip ?? {}, 'laea'), true],
        ['sheet strip has no lv95', Object.hasOwn(sheet.contours?.strip ?? {}, 'lv95'), false],
      ]);
    },
  },
  {
    name: 'terrain: a strip centre outside its plate fails',
    guard: TERRAIN_BUILD,
    nodeArgs: PHOTO_NODE_ARGS,
    args: [],
    setup: () => {
      terrainStripBefore = snapshotTree(terrainStripRoot);
      return ['--root', terrainStripRoot];
    },
    expectExit: 1,
    expectOutput: ['terrain: plate fixture: strip.centreN 1199000 is outside its extent (1200000..1201000); fix data/terrain/plates.json'],
    check: () => treeUnchanged(terrainStripRoot, terrainStripBefore),
  },
  {
    name: 'terrain: an unreadable terrain.ts refuses to re-encode posters',
    guard: TERRAIN_BUILD,
    nodeArgs: PHOTO_NODE_ARGS,
    args: [],
    setup: () => {
      terrainUnreadableBefore = snapshotTree(terrainUnreadableRoot);
      return ['--root', terrainUnreadableRoot];
    },
    expectExit: 1,
    expectOutput: ['terrain: cannot read data/generated/terrain.ts; refusing to re-encode posters'],
    check: (output) => (output.includes('wrote ') ? 'the run wrote a file' : treeUnchanged(terrainUnreadableRoot, terrainUnreadableBefore)),
  },
  {
    name: 'terrain: --check sees a missing prefixed plate file',
    guard: TERRAIN_BUILD,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--check'],
    setup: () => {
      terrainMissingWrite = terrainWrite(terrainMissingRoot);
      terrainMissingFile = terrainListing(terrainMissingRoot).find((f) => /^fixture-hillshade-640\.[0-9a-f]{10}\.webp$/.test(f)) ?? null;
      if (terrainMissingFile) fs.unlinkSync(path.join(terrainMissingRoot, TERRAIN_PUBLIC, terrainMissingFile));
      return ['--root', terrainMissingRoot];
    },
    expectExit: 1,
    expectOutput: ['terrain: 1 stale'],
    check: (output) => {
      if (terrainMissingWrite) return terrainMissingWrite;
      if (!terrainMissingFile) return 'the write run built no fixture-hillshade-640.<hash>.webp to delete';
      return output.includes(`${TERRAIN_PUBLIC}/${terrainMissingFile} (missing)`) ? null : `output does not name ${terrainMissingFile} as missing`;
    },
  },
  {
    name: 'terrain: removing a plate sweeps only its files',
    guard: TERRAIN_BUILD,
    nodeArgs: PHOTO_NODE_ARGS,
    args: [],
    setup: () => {
      terrainRemoveWrite = terrainWrite(terrainRemoveRoot);
      terrainRemoveBuilt = terrainListing(terrainRemoveRoot).filter((f) => f.startsWith('fixture-')).length;
      const rel = path.join(terrainRemoveRoot, 'data/terrain/plates.json');
      const registry = JSON.parse(fs.readFileSync(rel, 'utf-8'));
      registry.plates = registry.plates.filter((p) => p.id !== FIXTURE_PLATE.id);
      fs.writeFileSync(rel, `${JSON.stringify(registry, null, 2)}\n`);
      return ['--root', terrainRemoveRoot];
    },
    expectExit: 0,
    expectOutput: ['terrain: removed stale public/terrain/fixture-', 'terrain: OK'],
    check: () => {
      if (terrainRemoveWrite) return terrainRemoveWrite;
      if (terrainRemoveBuilt !== FIXTURE_FILES.length) return `the first write built ${terrainRemoveBuilt} fixture files, expected ${FIXTURE_FILES.length}`;
      const left = terrainListing(terrainRemoveRoot).filter((f) => f.startsWith('fixture-'));
      if (left.length) return `fixture files survived the sweep: ${left.join(', ')}`;
      if (JSON.stringify(terrainListing(terrainRemoveRoot)) !== JSON.stringify(terrainListing(repoRoot)))
        return `public/terrain/ lists ${terrainListing(terrainRemoveRoot).join(', ')}, not the repo's files`;
      return terrainBytesEqual(terrainRemoveRoot, [...matterhornFiles(), ...TERRAIN_HOME_MODULES, 'data/generated/plates.ts']);
    },
  },
  {
    name: 'terrain: --check names the files of a hillshade size dropped from a plate (15 WR-01)',
    guard: TERRAIN_BUILD,
    nodeArgs: PHOTO_NODE_ARGS,
    args: ['--check'],
    setup: () => {
      terrainDropCheck = terrainDropSize(terrainDropCheckRoot);
      return ['--root', terrainDropCheckRoot];
    },
    expectExit: 1,
    expectOutput: ['terrain: stale data/generated/plates.ts (bytes differ from a fresh build)', 'terrain: 3 stale'],
    check: (output) => {
      const { writeError, dropped } = terrainDropCheck;
      if (writeError) return writeError;
      if (dropped.length !== 2) return `the first write built ${dropped.length} fixture-hillshade-1100 files, expected 2`;
      const unnamed = dropped.filter((f) => !output.includes(`terrain: extra ${TERRAIN_PUBLIC}/${f}`));
      return unnamed.length ? `output does not name ${unnamed.join(', ')} as extra` : null;
    },
  },
  {
    name: 'terrain: a write sweeps a dropped hillshade size, plates.ts stops naming it, Matterhorn stays byte-equal (15 WR-01)',
    guard: TERRAIN_BUILD,
    nodeArgs: PHOTO_NODE_ARGS,
    args: [],
    setup: () => {
      terrainDropWrite = terrainDropSize(terrainDropWriteRoot);
      return ['--root', terrainDropWriteRoot];
    },
    expectExit: 0,
    expectOutput: ['terrain: removed stale public/terrain/fixture-hillshade-1100.', 'terrain: OK'],
    check: () => {
      const { writeError, dropped } = terrainDropWrite;
      if (writeError) return writeError;
      if (dropped.length !== 2) return `the first write built ${dropped.length} fixture-hillshade-1100 files, expected 2`;
      const left = terrainListing(terrainDropWriteRoot).filter((f) => FIXTURE_1100.test(f));
      if (left.length) return `dropped-size files survived the sweep: ${left.join(', ')}`;
      const kept = terrainListing(terrainDropWriteRoot).filter((f) => f.startsWith('fixture-'));
      if (kept.length !== FIXTURE_FILES.length - 2) return `${kept.length} fixture files left, expected ${FIXTURE_FILES.length - 2}: ${kept.join(', ')}`;
      const plates = fs.readFileSync(path.join(terrainDropWriteRoot, 'data/generated/plates.ts'), 'utf-8');
      if (plates.includes('fixture-hillshade-1100')) return 'plates.ts still references a fixture-hillshade-1100 poster';
      const same = terrainBytesEqual(terrainDropWriteRoot, [...matterhornFiles(), ...TERRAIN_HOME_MODULES]);
      if (same) return same;
      const r = spawnSync(process.execPath, [...PHOTO_NODE_ARGS, TERRAIN_BUILD, '--check', '--root', terrainDropWriteRoot], { encoding: 'utf-8' });
      return r.status === 0 ? null : `--check after the sweep exited ${r.status}: ${`${r.stdout ?? ''}${r.stderr ?? ''}`.trim()}`;
    },
  },
  {
    name: 'geo: lib/geo.ts agrees with proj4 within 1 m over the Ortler plate',
    fn: () => {
      // EPSG:2056 CH1903+ / LV95 as published in the EPSG registry (epsg.io/2056.proj4).
      const lv95 =
        '+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs +type=crs';
      const x = ORTLER_LV95;
      const points = [];
      for (let i = 0; i <= 12; i++) {
        for (let j = 0; j <= 12; j++) {
          points.push({ e: x.west + ((x.east - x.west) * i) / 12, n: x.south + ((x.north - x.south) * j) / 12 });
        }
      }
      // proj4 takes and returns [x, y]: easting/northing in, longitude/latitude out.
      const wgs = points.map(({ e, n }) => {
        const [lon, lat] = proj4(lv95, 'EPSG:4326', [e, n]);
        return { lat, lon };
      });
      const back = geoBatch('wgs84ToLv95', wgs);
      const worst = Math.max(...points.map((pt, i) => gridDistance(pt, back[i])));
      return worst <= 1 ? null : `lib/geo.ts is up to ${worst.toFixed(3)} m from proj4 over the Ortler plate (limit 1 m)`;
    },
  },
  {
    name: 'geo: EPSG:3035 maps its centre to its false origin and round-trips the Saalfelden corners',
    fn: () => {
      // lat_0 52, lon_0 10 is the LAEA projection centre; x_0 / y_0 its false origin.
      const [centre] = plateGridBatch('toGrid', 'EPSG:3035', [{ lat: 52, lon: 10 }]);
      const off = gridDistance(centre, { e: 4321000, n: 3210000 });
      if (!(off <= 0.001)) return `the centre maps ${off.toFixed(4)} m from the false origin (limit 0.001 m)`;
      const x = SAALFELDEN_LAEA;
      const corners = [
        { e: x.west, n: x.south },
        { e: x.east, n: x.south },
        { e: x.east, n: x.north },
        { e: x.west, n: x.north },
      ];
      const back = plateGridBatch('toGrid', 'EPSG:3035', plateGridBatch('fromGrid', 'EPSG:3035', corners));
      const worst = Math.max(...corners.map((c, i) => gridDistance(c, back[i])));
      return worst <= 0.001 ? null : `a Saalfelden corner round-trips ${worst.toFixed(4)} m off (limit 0.001 m)`;
    },
  },
  {
    name: "type-check: tsconfig.jest.json covers every file Jest's testMatch runs, outside __tests__/ too (15 WR-03)",
    fn: jestTypeCheckCoverage,
  },
  ...WORKFLOW_SHELL_CASES,
  ...CI_GATE_PARSER_CASES,
];

let failed = 0;
if (tap) console.log(`TAP version 13\n1..${cases.length}`);
for (const [index, c] of cases.entries()) {
  if (c.fn) {
    let error;
    try {
      // A case may be async (the Tailwind scan cases); a sync one is unchanged by await.
      error = await c.fn();
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
  const checkError = c.check ? c.check(output) : null;
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

for (const file of [lowerUpdateBaseline, raiseUpdateBaseline, raisePaletteRatchet, lowerPaletteRatchet, pngIgnoredRoot, pngStrayRoot, classnamesMovedRoot, classnamesMovedChangedRoot, classnamesUnchangedRoot, snapshotMergeRoot, parityGoodRoot, parityBadRoot, parityNestedFloorRoot, parityUnflooredLineRoot, ciGateRenamedRoot, ciGateRelayLiteralRoot, ciGateRelayNoNeedsRoot, ciGateRelayPrCheckoutRoot, ciGateRelayTopPermsRoot, ciGateRelayWriteScopeRoot, ciGateNoChangesNeedRoot, ciGateUnconditionedRoot, ciGatePathsIgnoreRoot, photoDataControlRoot, photoDataOffsetRoot, photoDataGpsRoot, photoDataOffPlateRoot, photoMapMissingRoot, photoMapOrphanRoot, photoMapDuplicateRoot, photoMapUnknownRegionRoot, photoMapUnknownPlateRoot, photoMapCountryRoot, photoMapMovedRoot, photoDeriveRoot, exifMappedRoot, exifUnmappedRoot, exifDuplicateRoot, terrainFixtureRoot, terrainLaeaRoot, terrainStripRoot, terrainUnreadableRoot, terrainMissingRoot, terrainRemoveRoot, terrainDropCheckRoot, terrainDropWriteRoot, ...ciGateTempRoots, ...telemetryTempRoots, ...privacyTempRoots]) {
  if (file) fs.rmSync(path.dirname(file), { recursive: true, force: true });
}

if (tap) {
  console.log(`# tests ${cases.length}\n# pass ${cases.length - failed}\n# fail ${failed}`);
} else {
  console.log(`selftest: ${cases.length - failed}/${cases.length} cases passed`);
}
process.exit(failed > 0 ? 1 : 0);
