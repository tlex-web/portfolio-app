/**
 * Runs the shell of a real workflow step under stub `gh` and `sleep` (selftest only)
 *
 * The skip-marker relay (.github/workflows/ci-skip-relay.yml) and the `changes`
 * job of ci.yml carry their logic in `run: |` blocks that no guard executes.
 * This module lifts a named step's block out of the real workflow file at test
 * time, runs it the way GitHub does (`bash --noprofile --norc -eo pipefail
 * <file>`) with the step's env set, and returns what the step did: exit status,
 * output, the lines it appended to GITHUB_OUTPUT and every `gh`/`sleep` call.
 *
 * The stub `gh` never reaches a network: it answers the API paths the blocks
 * use from canned bodies in STUB_* env vars and applies the caller's `--jq`
 * filter with the real jq, so the workflow's own jq expressions run. The stubs
 * are written at run time with LF endings (a committed shell file could check
 * out with CRLF) as functions that BASH_ENV sources. Everything lives in an
 * os.tmpdir() directory removed afterwards.
 *
 * Bash is never taken from PATH: on Windows that is C:\Windows\System32\bash.exe
 * (WSL), which exits 1 with no output. findBash() returns Git Bash from
 * `git --exec-path` or a fixed install path, /bin/bash elsewhere, and
 * requireBash() throws naming every path it tried, so a case that needs bash
 * fails loudly and never skips.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

let bashCache = null;

/** { path, tried }: the bash to run steps with (path is null when none works) and the paths tried. */
export function findBash() {
  if (bashCache) return bashCache;
  const tried = [];
  let candidates;
  if (process.platform === 'win32') {
    candidates = [];
    const exec = spawnSync('git', ['--exec-path'], { encoding: 'utf-8' });
    if (exec.status === 0 && exec.stdout.trim()) {
      // <git root>/<ucrt64|mingw64>/libexec/git-core: the git root is three levels up.
      candidates.push(path.join(exec.stdout.trim(), '..', '..', '..', 'bin', 'bash.exe'));
    }
    candidates.push('C:/Program Files/Git/bin/bash.exe');
  } else {
    candidates = ['/bin/bash'];
  }
  let found = null;
  for (const candidate of candidates) {
    const resolved = path.normalize(candidate);
    tried.push(resolved);
    if (!fs.existsSync(resolved)) continue;
    const probe = spawnSync(resolved, ['--noprofile', '--norc', '-c', 'echo bash-ok'], { encoding: 'utf-8' });
    if (probe.status === 0 && probe.stdout.trim() === 'bash-ok') {
      found = resolved;
      break;
    }
  }
  bashCache = { path: found, tried };
  return bashCache;
}

/** The bash path, or a throw that names every path tried (never a skip). */
export function requireBash() {
  const { path: bash, tried } = findBash();
  if (!bash) throw new Error(`no usable bash for the workflow-shell cases; tried: ${tried.join(', ')}`);
  return bash;
}

/**
 * The shell text of the `run: |` block of the step selected by `{ id }` or
 * `{ name }` in a workflow file: CR removed and dedented. Throws when the step
 * or its block is missing, so a renamed step cannot make a case pass vacuously.
 */
export function extractRunBlock(workflowFile, { id, name }) {
  const lines = fs.readFileSync(workflowFile, 'utf-8').replace(/\r/g, '').split('\n');
  const indentOf = (line) => line.length - line.trimStart().length;
  const wanted = id !== undefined ? `id: ${id}` : `name: ${name}`;
  const hits = lines.flatMap((line, i) => (/^\s*-\s+/.test(line) && line.replace(/^\s*-\s+/, '').trim() === wanted ? [i] : []));
  if (hits.length !== 1) throw new Error(`${path.basename(workflowFile)}: expected exactly one step "- ${wanted}", found ${hits.length}`);
  const start = hits[0];
  const dash = indentOf(lines[start]);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() !== '' && indentOf(lines[i]) <= dash) {
      end = i;
      break;
    }
  }
  const runAt = lines.findIndex((line, i) => i > start && i < end && /^\s*run:\s*\|\s*$/.test(line));
  if (runAt === -1) throw new Error(`${path.basename(workflowFile)}: step "${wanted}" has no run: | block`);
  const keyIndent = indentOf(lines[runAt]);
  const body = [];
  for (let i = runAt + 1; i < end; i++) {
    if (lines[i].trim() !== '' && indentOf(lines[i]) <= keyIndent) break;
    body.push(lines[i]);
  }
  const first = body.find((l) => l.trim() !== '');
  if (first === undefined) throw new Error(`${path.basename(workflowFile)}: step "${wanted}" has an empty run block`);
  const indent = indentOf(first);
  return `${body.map((l) => (l.trim() === '' ? '' : l.slice(indent))).join('\n').trimEnd()}\n`;
}

/**
 * The stubs are bash functions sourced through BASH_ENV, which a non-interactive
 * bash reads before the script (so the block itself runs unmodified). A function
 * wins over any PATH lookup (Git Bash puts /usr/bin, with its real sleep, ahead
 * of the inherited PATH) and costs a fork instead of a process start, which
 * matters on Windows. Each call is logged to $STUB_LOG, one line per call.
 */
const STUBS = `gh() {
  { printf 'gh'; for a in "$@"; do printf ' %s' "$a"; done; printf '\n'; } >> "$STUB_LOG"
  if [ "$1" = api ]; then
    shift
    local apipath="" jqf="" body=""
    while [ $# -gt 0 ]; do
      case "$1" in
        -X|-f) shift ;;
        --jq) jqf="$2"; shift ;;
        *) apipath="$1" ;;
      esac
      shift
    done
    case "$apipath" in
      repos/*/commits/*) body=$(command jq -n --arg m "$STUB_MSG" '{commit:{message:$m}}') ;;
      repos/*/actions/workflows/ci.yml/runs) body="{\\"workflow_runs\\": \${STUB_DISPATCH_RUNS:-[]}}" ;;
      repos/*/actions/runs/*) body="{\\"conclusion\\": \\"\${STUB_CONCLUSION:-success}\\"}" ;;
      repos/*/actions/runs)
        if [ "\${STUB_RUNS_FAIL:-}" = 1 ]; then echo "gh: HTTP 502" >&2; return 1; fi
        body="{\\"workflow_runs\\": \${STUB_RUNS:-[]}}" ;;
      repos/*/compare/*)
        if [ "\${STUB_COMPARE_FAIL:-}" = 1 ]; then echo "gh: HTTP 404" >&2; return 1; fi
        case "$apipath" in
          repos/*/compare/main...*) if [ -n "\${STUB_COMPARE_MAIN_FILE:-}" ]; then cat "$STUB_COMPARE_MAIN_FILE"; return $?; fi ;;
        esac
        cat "$STUB_COMPARE_FILE"; return $? ;;
      *) echo "stub gh: unknown api path $apipath" >&2; return 97 ;;
    esac
    if [ -n "$jqf" ]; then printf '%s' "$body" | command jq -r "$jqf"; else printf '%s\n' "$body"; fi
    return $?
  fi
  if [ "$1" = workflow ] && [ "$2" = run ]; then return "\${STUB_DISPATCH_EXIT:-0}"; fi
  if [ "$1" = run ] && [ "$2" = watch ]; then return "\${STUB_WATCH_EXIT:-0}"; fi
  echo "stub gh: unhandled call: $*" >&2
  return 97
}
sleep() { echo "sleep $*" >> "$STUB_LOG"; }
`;
/**
 * On Windows the real jq.exe writes CRLF, which a Linux runner's jq never does
 * and which would corrupt \`$(jq ...)\` values in the blocks, so a jq function
 * runs the real jq with --binary (win32 only; the real jq is otherwise untouched).
 */
const WIN32_JQ = 'jq() { command jq --binary "$@"; }\n';

/**
 * Runs `block` under the stub gh and sleep and returns
 * { status, stdout, stderr, output, calls, cwdFiles }:
 *   - env: the step's env (REPO, SHA, ...); STUB_* entries steer the stubs
 *   - compare: a value written as JSON to a file the stub serves for the compare API
 *   - compareMain: when given, served instead of `compare` for a compare against main
 *     (`compare/main...<head>`), so a case can give the branch and the push different diffs
 *   - cwd: where the block runs (default: the temp work dir, so a stray file lands there)
 *   - output: the text appended to GITHUB_OUTPUT; calls: one entry per gh/sleep call
 *   - cwdFiles: the names in the work dir afterwards (only when cwd is the work dir)
 */
export function runStep(block, { env = {}, compare, compareMain, cwd } = {}) {
  const bash = requireBash();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-selftest-shell-'));
  try {
    const posix = (p) => p.split(path.sep).join('/');
    const work = path.join(dir, 'work');
    const runnerTemp = path.join(dir, 'runner-temp');
    for (const d of [work, runnerTemp]) fs.mkdirSync(d);
    const bashEnv = path.join(dir, 'stubs.sh');
    fs.writeFileSync(bashEnv, `${process.platform === 'win32' ? WIN32_JQ : ''}${STUBS}`);
    const script = path.join(dir, 'step.sh');
    fs.writeFileSync(script, block);
    const log = path.join(dir, 'calls.log');
    const ghOutput = path.join(dir, 'github-output.txt');
    fs.writeFileSync(log, '');
    fs.writeFileSync(ghOutput, '');
    const stepEnv = { ...process.env };
    for (const key of Object.keys(stepEnv)) {
      if (/^(GITHUB_|RUNNER_|STUB_)/.test(key) || ['REPO', 'SHA', 'HEAD_REPO', 'REF', 'GH_TOKEN', 'EVENT', 'BASE', 'HEAD'].includes(key)) delete stepEnv[key];
    }
    Object.assign(stepEnv, env, {
      BASH_ENV: posix(bashEnv),
      STUB_LOG: posix(log),
      GITHUB_OUTPUT: posix(ghOutput),
      RUNNER_TEMP: posix(runnerTemp),
    });
    if (compare !== undefined) {
      const file = path.join(dir, 'compare-body.json');
      fs.writeFileSync(file, JSON.stringify(compare));
      stepEnv.STUB_COMPARE_FILE = posix(file);
    }
    if (compareMain !== undefined) {
      const file = path.join(dir, 'compare-main-body.json');
      fs.writeFileSync(file, JSON.stringify(compareMain));
      stepEnv.STUB_COMPARE_MAIN_FILE = posix(file);
    }
    const r = spawnSync(bash, ['--noprofile', '--norc', '-eo', 'pipefail', posix(script)], {
      cwd: cwd ?? work,
      env: stepEnv,
      encoding: 'utf-8',
      timeout: 60000,
    });
    if (r.error) throw new Error(`could not run ${bash}: ${r.error.message}`);
    return {
      status: r.status,
      stdout: r.stdout ?? '',
      stderr: r.stderr ?? '',
      output: fs.readFileSync(ghOutput, 'utf-8').replace(/\r/g, ''),
      calls: fs.readFileSync(log, 'utf-8').replace(/\r/g, '').split('\n').filter(Boolean),
      cwdFiles: cwd === undefined ? fs.readdirSync(work) : [],
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
