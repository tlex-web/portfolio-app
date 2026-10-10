#!/usr/bin/env node

/**
 * CI helper: reports the result of the CI "Visual Regression" job for a commit
 *
 * Reads the public GitHub REST API (no dependencies, Node 24 global fetch).
 * Used by the zero-diff gate in e2e/visual/README.md: after Tim pushes a
 * commit to a ci/07-NN branch, the executor runs this to learn whether the
 * pixel comparison passed.
 *
 * Usage:
 *   node scripts/ci/check-visual-run.mjs [--sha <sha>] [--job "Visual Regression"]
 *     [--workflow CI] [--wait <minutes>]
 *
 *   --sha       commit to check (default: git rev-parse HEAD)
 *   --job       job name inside the workflow run (default "Visual Regression")
 *   --workflow  workflow name (default "CI")
 *   --wait      minutes to keep polling (every 60 s) while the job is pending
 *               or missing (default 0: check once)
 *
 * Owner/repo come from `git remote get-url origin`. GITHUB_TOKEN, when set, is
 * sent as a bearer token (raises the 60 requests/hour anonymous limit).
 *
 * Output and exit code:
 *   PASS <job url>                  exit 0
 *   FAIL <conclusion> <job url>     exit 1
 *   PENDING <run url> | MISSING     exit 2 (after --wait minutes)
 *   ERROR <message>                 exit 2 (API or git failure; never a pass)
 */

import { execFileSync } from 'child_process';
import { pathToFileURL } from 'url';

const POLL_MS = 60_000;

/** Newest run of the named workflow (by created_at, then id), or null. */
export function pickRun(runs, workflow) {
  const matching = (runs ?? []).filter((r) => r && r.name === workflow);
  if (matching.length === 0) return null;
  return matching.reduce((newest, r) => {
    const a = Date.parse(newest.created_at ?? '') || 0;
    const b = Date.parse(r.created_at ?? '') || 0;
    if (b !== a) return b > a ? r : newest;
    return (r.id ?? 0) > (newest.id ?? 0) ? r : newest;
  });
}

/** The job with the exact name in a run's job list, or null. */
export function pickJob(jobs, job) {
  return (jobs ?? []).find((j) => j && j.name === job) ?? null;
}

/**
 * Pure outcome of a check.
 * @param runs  `workflow_runs` from GET /actions/runs?head_sha=<sha>
 * @param jobs  `jobs` of the newest run of `workflow` (ignored when there is none)
 * @returns 'pass' | 'fail' | 'pending' | 'missing'
 */
export function evaluate(runs, jobs, { workflow, job }) {
  const run = pickRun(runs, workflow);
  if (!run) return 'missing';
  const found = pickJob(jobs, job);
  if (!found) {
    // Jobs are created as the run starts; a finished run without the job never had it.
    return run.status === 'completed' ? 'missing' : 'pending';
  }
  if (found.status !== 'completed') return 'pending';
  return found.conclusion === 'success' ? 'pass' : 'fail';
}

function parseArgs(argv) {
  const args = { sha: null, job: 'Visual Regression', workflow: 'CI', wait: 0 };
  const valued = { '--sha': 'sha', '--job': 'job', '--workflow': 'workflow', '--wait': 'wait' };
  for (let i = 0; i < argv.length; i++) {
    const key = valued[argv[i]];
    const value = argv[i + 1];
    if (!key) usage(`unknown argument ${argv[i]}`);
    if (value === undefined || value.startsWith('--')) usage(`${argv[i]} needs a value`);
    args[key] = value;
    i++;
  }
  args.wait = Number(args.wait);
  if (!Number.isFinite(args.wait) || args.wait < 0) usage('--wait needs a number of minutes >= 0');
  return args;
}

function usage(message) {
  console.error(`check-visual-run: ${message}`);
  console.error('usage: check-visual-run.mjs [--sha <sha>] [--job <name>] [--workflow <name>] [--wait <minutes>]');
  process.exit(2);
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/** owner/repo from an https or ssh GitHub remote URL. */
export function parseRemote(url) {
  const m = /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(String(url).trim());
  return m ? { owner: m[1], repo: m[2] } : null;
}

async function getJson(url) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'portfolio-app-check-visual-run',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    const hint = remaining === '0' ? ' (rate limit reached; set GITHUB_TOKEN)' : '';
    throw new Error(`GET ${url} -> HTTP ${res.status}${hint}`);
  }
  return res.json();
}

async function check({ owner, repo, sha, workflow, job }) {
  const runsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs?head_sha=${encodeURIComponent(sha)}&per_page=50`;
  const runs = (await getJson(runsUrl)).workflow_runs ?? [];
  const run = pickRun(runs, workflow);
  const jobs = run ? ((await getJson(`${run.jobs_url}?per_page=100`)).jobs ?? []) : [];
  return { outcome: evaluate(runs, jobs, { workflow, job }), run, found: pickJob(jobs, job) };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let sha;
  let remote;
  try {
    sha = args.sha ?? git('rev-parse', 'HEAD');
    remote = parseRemote(git('remote', 'get-url', 'origin'));
  } catch (err) {
    console.log(`ERROR git: ${(err.stderr || err.message).toString().trim()}`);
    process.exit(2);
  }
  if (!remote) {
    console.log('ERROR origin is not a github.com remote');
    process.exit(2);
  }

  const deadline = Date.now() + args.wait * 60_000;
  for (;;) {
    let result = null;
    let error = null;
    try {
      result = await check({ ...remote, sha, workflow: args.workflow, job: args.job });
    } catch (err) {
      error = err.message;
    }
    if (result?.outcome === 'pass') {
      console.log(`PASS ${result.found.html_url}`);
      process.exit(0);
    }
    if (result?.outcome === 'fail') {
      console.log(`FAIL ${result.found.conclusion} ${result.found.html_url}`);
      process.exit(1);
    }
    if (Date.now() + POLL_MS > deadline) {
      if (error) console.log(`ERROR ${error}`);
      else if (result.outcome === 'pending') console.log(`PENDING ${result.run.html_url}`);
      else console.log(`MISSING no "${args.job}" job in a "${args.workflow}" run for ${sha}`);
      process.exit(2);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
