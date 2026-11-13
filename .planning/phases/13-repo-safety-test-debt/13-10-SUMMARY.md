---
phase: 13-repo-safety-test-debt
plan: 10
subsystem: infra
tags: [github-actions, ci, pull_request_target, guards, skip-marker, relay, GUARD-08]

requires:
  - phase: 13-01
    provides: "CI OK job (ci-ok), check-ci-gate.mjs rules 1-7 and the empty CI_OK_ELSEWHERE_ALLOWED allow-list"
  - phase: 13-07
    provides: "ci.yml workflow_dispatch trigger (no inputs) and check-ci-gate.mjs rules 8-10"
provides:
  - ".github/workflows/ci-skip-relay.yml (CI skip relay): pull_request_target relay mirror for skip-marked same-repo PR heads (D-06 option A)"
  - "check-ci-gate.mjs rule 5 exception: job relay in ci-skip-relay.yml may carry CI OK only as a needs-based ${{ }} name expression"
  - "check-ci-gate.mjs rules 11-15: no checkout, no expression in a run block, no job-level if on the CI OK relay job, pull_request_target only, permissions {} with actions: write on the CI OK job as the only write scope"
  - "ci-gate fixtures bad-relay-{checkout,interpolation,if,trigger}; the good fixture carries the relay"
affects: [13-15 mid-phase PR (carries the relay to main), 13-16 main ruleset, 13-19 [ci skip] relay proof, 13-21 option B/C fallback]

actuals:
  tokens: 15476
  tasks: 2
  commits: 3
plan_head_before: d16d15b44745cdf80dcec78700530933646cc747
plan_head_after: a3829835d8428fa0162c655fe4d1253b06301fa6

tech-stack:
  added: []
  patterns:
    - "pull_request_target relay that never touches PR code: API reads only, event fields through env:, a dynamic job name instead of a job-level if:"
    - "Guard rules that read raw workflow lines where GitHub substitutes expressions (run blocks, shell comments included)"
    - "Bad fixtures that are the good file with exactly one violation, asserted by message plus an exact failure count"

key-files:
  created:
    - .github/workflows/ci-skip-relay.yml
    - scripts/guards/__selftest__/ci-gate/good/.github/workflows/ci-skip-relay.yml
    - scripts/guards/__selftest__/ci-gate/bad-relay-checkout/.github/workflows/ci-skip-relay.yml
    - scripts/guards/__selftest__/ci-gate/bad-relay-interpolation/.github/workflows/ci-skip-relay.yml
    - scripts/guards/__selftest__/ci-gate/bad-relay-if/.github/workflows/ci-skip-relay.yml
    - scripts/guards/__selftest__/ci-gate/bad-relay-trigger/.github/workflows/ci-skip-relay.yml
  modified:
    - scripts/guards/check-ci-gate.mjs
    - scripts/guards/selftest.mjs
    - scripts/README.md

key-decisions:
  - "13-10: the relay safety rules are numbered 11-15 (the plan's 10-14), because 13-07 already used 10 for the heavy-job set"
  - "13-10: the relay finds its dispatched run as the earliest workflow_dispatch run of ci.yml on the head ref created at or after the runner's pre-dispatch timestamp, fails red if that run's head_sha is not the PR head SHA, and after gh run watch --exit-status also requires the run conclusion to be success"
  - "13-10: guard rule 12 reads raw run-block lines, shell comments included, because GitHub substitutes ${{ }} before the shell runs"
  - "13-10: the relay job holds no checks: read; gh 2.103.3 treats a 403 on run annotations as missing permissions rather than an error (the string is in the binary), to be confirmed live in 13-19"

patterns-established:
  - "A pull_request_target workflow in this repo gets every event field through env:, quoted, and the ci-gate guard rejects any ${{ in its run blocks"
  - "A second CI OK may exist only as the relay's needs-based name expression; anything else outside ci.yml fails npm run lint"

requirements-completed: [GUARD-08]

coverage:
  - id: D1
    description: "ci-skip-relay.yml: pull_request_target on main (opened, synchronize, reopened), permissions {}, per-PR concurrency; detect (Skip-marker check, contents/actions read, 5 min) and relay (CI OK or CI skip relay by name expression, needs detect, no job-level if, actions: write and contents: read, 100 min)"
    requirement: GUARD-08
    verification:
      - kind: other
        ref: "js-yaml load of .github/workflows/ci-skip-relay.yml (on, permissions, jobs, names, needs, step if and env as specified)"
        status: pass
      - kind: other
        ref: "grep -c: pull_request_target 5, 'gh workflow run ci.yml' 1, 'permissions: {}' 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Relay shell behaviour: all five bracket markers (any case) and both skip-checks trailer spellings detected; no marker, a near miss or an existing pull_request CI run gives skipped=false; a failing runs API fails detect with no output; fork heads fail red without dispatching; same-repo heads dispatch on the head ref, mirror green and red, fail on a moved SHA, a cancelled run or no run within 5 minutes; a hostile ref stays data"
    requirement: GUARD-08
    verification:
      - kind: other
        ref: "scratchpad relay-sim/run.sh: both run blocks extracted verbatim, run against stub gh and sleep (29 of 30 checks pass; the 30th is a harness artifact, see Issues)"
        status: pass
    human_judgment: false
  - id: D3
    description: "check-ci-gate.mjs rule 5 exception: the relay passes; a literal name: CI OK in the relay and a name expression on a job without needs both fail"
    requirement: GUARD-08
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#ci-gate: the relay job with a literal name: CI OK fails / the relay name expression on a job without needs fails / good fixture passes"
        status: pass
    human_judgment: false
  - id: D4
    description: "check-ci-gate.mjs rules 11-15: bad-relay-checkout, bad-relay-interpolation, bad-relay-if and bad-relay-trigger each exit 1 with their message and exactly 2 failures; gh pr checkout, non-empty top-level permissions and contents: write each fail; the real repo prints ci-gate: OK"
    requirement: GUARD-08
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#ci-gate: relay ... (7 cases); selftest 138/138"
        status: pass
      - kind: other
        ref: "npm run lint (exit 0)"
        status: pass
      - kind: other
        ref: "scratchpad t2-probe.mjs (CRLF copy, expression in a shell comment, inline run expression, actions: write on detect, git clone, checks: write, workflow_dispatch trigger, flow-form on:)"
        status: pass
    human_judgment: false
  - id: D5
    description: "On GitHub, a [ci skip] same-repo PR head gets a final CI OK from the relay that the main ruleset counts on the head SHA (assumption A1)"
    requirement: GUARD-08
    verification: []
    human_judgment: true
    rationale: "Live GitHub behaviour is outside this plan by design (no pushes, no dispatches); the relay only exists for GitHub once on main, and 13-19 runs the [ci skip] proof. If the check is not counted, 13-21 applies option B or C."

duration: 9min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 10: Skip-marker Relay Summary

**`ci-skip-relay.yml` is a `pull_request_target` relay that never touches PR code. On a same-repo PR head whose commit carries a skip marker, and for which GitHub created no `pull_request` CI run, its job is named `CI OK`. It dispatches `ci.yml` on the head ref, waits for that run on the same SHA and exits with its conclusion. A marked fork head gets a red `CI OK`; an unmarked head gets a no-op job named `CI skip relay`. Five new `check-ci-gate.mjs` rules keep it that way.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-11-13T11:31:59Z
- **Completed:** 2026-11-13T11:41:09Z
- **Tasks:** 2 (1 tracer, 1 TDD)
- **Files modified:** 9 (6 created, 3 modified)

## Accomplishments

- **Relay workflow** (`CI skip relay`). Top-level `permissions: {}`, one trigger (`pull_request_target` on `main`, `opened`/`synchronize`/`reopened`), and a concurrency group per PR number with cancel-in-progress. The header says what it does, that it never checks out or runs PR code, that it runs from `main`'s copy, and why Vercel Deployment Checks only ever see `ci.yml`'s `CI OK` (Pitfall 8).
  - `detect` (`Skip-marker check`): reads the head commit message with `gh api`. It matches the five bracket markers case-insensitively with `grep -F`, and `skip-checks: true` or `skip-checks:true` on a line of its own. Only when a marker is present does it wait 45 s and count `pull_request` runs of the workflow named `CI` for the SHA. `skipped=true` means a marker and zero runs. The output line is written last, so a failure can never leave `skipped=true` behind.
  - `relay`: `needs: detect` and no job-level `if:`. Its name is `${{ needs.detect.outputs.skipped == 'true' && 'CI OK' || 'CI skip relay' }}`, with a 100-minute timeout and `actions: write`, `contents: read`.
    - Not skipped: one step prints that `ci.yml` reports `CI OK` itself.
    - Skipped: a fork head fails with `::error::` before any dispatch. Otherwise the job records the time, runs `gh workflow run ci.yml --repo "$REPO" --ref "$REF"`, and polls up to 5 minutes (30 × 10 s) for the first `workflow_dispatch` run of `ci.yml` on that ref created since then. It fails if that run's `head_sha` is not the PR head SHA. Then it runs `gh run watch "$id" --repo "$REPO" --exit-status --interval 60` and also requires the run's `conclusion` to be `success`.
  - Every event field (`head.sha`, `head.ref`, `head.repo.full_name`, `repository`) reaches the shell only through `env:`, quoted. API query parameters go through `gh api -X GET -f`, so the head ref is URL-encoded data.
- **Guard, rule 5:** `CI_OK_ELSEWHERE_ALLOWED` is `[{ file: 'ci-skip-relay.yml', job: 'relay' }]`. It is honoured only while the job's whole name is one `${{ }}` expression containing `CI OK` that reads `needs.`, on a job with `needs:`.
- **Guard, rules 11-15** (only when the relay file exists, independent of `ci.yml` failures):
  - 11: no checkout action, and no `git clone`/`checkout`/`switch`/`fetch`/`pull`/`worktree`, `gh pr checkout` or `gh repo clone` in a run block;
  - 12: no `${{` on any raw run-block line;
  - 13: no job-level `if:` on the job whose name can be `CI OK`;
  - 14: `pull_request_target` is the only trigger;
  - 15: top-level `permissions: {}`, and no write scope except `actions: write` on the `CI OK` job.
- **Selftest:** grew from 129 to 138 cases (2 in Task 1, 7 in Task 2). `npm run lint` exits 0.

### Confirmed `gh` flags (assumption A10, gh 2.103.3)

`gh run watch --help`:

```
USAGE
  gh run watch <run-id> [flags]
FLAGS
      --compact        Show only relevant/failed steps
      --exit-status    Exit with non-zero status if run fails
  -i, --interval int   Refresh interval in seconds (default 3)
INHERITED FLAGS
  -R, --repo [HOST/]OWNER/REPO   Select another repository using the [HOST/]OWNER/REPO format
```

`gh workflow run --help`: `-r, --ref string  Branch or tag name which contains the version of the workflow file you'd like to run`, and the inherited `-R, --repo`. The help text also says "The created workflow run URL will be returned if available". The relay does not rely on that, because the runner's `gh` version may differ, so it polls instead.

## Task Commits

1. **Task 1: Relay workflow with the guard's CI OK exception (tracer)**: `243448f` (feat)
2. **Task 2: Relay safety rules, each proven able to fail**: `e1fa306` (test, RED), then `a382983` (feat, GREEN)

**Plan metadata:** recorded by the docs commit that adds this file.

**Tracer feedback gate after Task 1.** Auto mode was off, `human_verify_mode` was the `end-of-phase` default, and the verify step was automated only. I re-ran it (`ci-gate: OK`, `parity: OK`, selftest 131/131) and moved on to Task 2 without a checkpoint.

## TDD Gate Compliance

| Task | RED | GREEN | REFACTOR |
|------|-----|-------|----------|
| 2 | `e1fa306`: the 7 new cases failed on their output assertions, and the 131 earlier cases passed. Four targets were classified by `gsd-tools check tdd-red-evidence` (TAP, RED_EVIDENCE_OK, `target_test_failed`): checkout, interpolation, job-level if, trigger. Each relay-only fixture already exited 1 for the missing `ci.yml`, so the assertion that failed was the rule's message and the exact `2 failure(s)` count. That is a real missing behaviour, not a load fault. The three temp-copy cases also failed on exit code (0 instead of 1). | `a382983`: 138/138 | none needed |

The evidence records are in `.git/gsd-red-13-10-*.json`, with the TAP report in `.git/gsd-red-13-10-tap.txt` (untracked by design).

## Files Created/Modified

- `.github/workflows/ci-skip-relay.yml`: the relay.
- `scripts/guards/check-ci-gate.mjs`:
  - rule 5 exception (`RELAY_FILE`, `RELAY_JOB`, `isNeedsNameExpression`);
  - rules 11-15 (`checkRelay`, `runBlocks`, `readRawLines`);
  - `readJobs` records each job's `start`/`end` line;
  - header doc updated.
- `scripts/guards/selftest.mjs`: `tempCiGateRoot(edit, file = 'ci.yml')`, 9 new cases and 5 temp roots, all cleaned up.
- `scripts/guards/__selftest__/ci-gate/good/.github/workflows/ci-skip-relay.yml`: a verbatim copy of the relay.
- `scripts/guards/__selftest__/ci-gate/bad-relay-{checkout,interpolation,if,trigger}/.github/workflows/ci-skip-relay.yml`: the good relay with one violation each (a diff against good shows only that change).
- `scripts/README.md`: the `unique name` row describes the relay exception, plus five relay rule rows.

## Decisions Made

- **Marker detection is broader than GitHub's.** The `skip-checks` trailer matches on any line, not only at the end. That is safe, because the decision that matters is "marker AND zero `pull_request` CI runs". A false marker costs a 45 s wait and nothing else.
- **Finding the dispatched run.** The relay picks the earliest `workflow_dispatch` run created at or after the runner's pre-dispatch timestamp (UTC, second precision; runners are NTP-synced). A clock that runs ahead could miss the run, which fails red after 5 minutes rather than passing. A run on another SHA always fails red, so the prohibition "a dispatched run on a different head SHA is never this head's result" holds.
- **`checks: read` is not granted.** The plan's truth limits the relay job to `actions: write` and `contents: read`. gh's `run watch` fetches annotations through the checks API. The gh 2.103.3 binary contains the `missing annotations permissions` error, which gh uses to skip annotations on a 403 instead of failing. Confirm live in 13-19.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Relay rules numbered 11-15, not 10-14**
- **Found during:** Task 2
- **Issue:** 13-07 already used rule 10 for the heavy-job set.
- **Fix:** Numbered 11-15 in the header doc. The README rows are named, not numbered.
- **Committed in:** `a382983`

**2. [Rule 2 - Missing critical] Rules 11 and 15 cover the other paths to the same harm**
- **Found during:** Task 2
- **Issue:** As planned, rule 11 caught only a checkout action, and rule 15 caught only the top-level `permissions: {}`. A `gh pr checkout` or `git clone` in a run block runs PR code just as well (T-13-22). A `contents: write` or `actions: write` on another job widens the token (T-13-25).
- **Fix:** Rule 11 also scans run blocks for git and gh checkout commands. Rule 15 fails any write scope other than `actions: write` on the `CI OK` job. Three temp-copy selftest cases cover them (gh pr checkout, top-level scope, `contents: write`). Scratchpad probes also covered `git clone`, `actions: write` on `detect` and `checks: write`.
- **Files modified:** `scripts/guards/check-ci-gate.mjs`, `scripts/guards/selftest.mjs`
- **Committed in:** `e1fa306` (RED), `a382983` (GREEN)

**3. [Rule 2 - Missing critical] Rule 12 reads raw lines**
- **Found during:** Task 2
- **Issue:** The guard's line reader strips `#` comments, but GitHub substitutes `${{ }}` inside a run block's shell comments too, so a comment would have hidden an injection.
- **Fix:** Rule 12 checks the raw lines of each run block. Probed: an expression inside a shell comment fails.
- **Committed in:** `a382983`

**4. [Rule 2 - Missing critical] The rule 5 exception proven able to fail, and the relay's conclusion re-checked**
- **Found during:** Task 1
- **Issue:** The exception had no failing case. Separately, `gh run watch --exit-status` documents only a non-zero exit for a failed run, so a run that ends in another non-success state could pass as green.
- **Fix:** Two temp-copy cases: a literal `name: CI OK` in the relay, and a name expression on a job without `needs`. The relay also reads the run's `conclusion` and fails unless it is `success` (simulated with watch exit 0 and `cancelled`).
- **Files modified:** `scripts/guards/selftest.mjs`, `.github/workflows/ci-skip-relay.yml`
- **Committed in:** `243448f`

**5. [Rule 2 - Missing critical] `scripts/README.md` kept in step**
- **Found during:** Tasks 1 and 2
- **Issue:** The README said `CI_OK_ELSEWHERE_ALLOWED` was empty and listed no relay rules, so it would have contradicted the code. It was not in `files_modified`.
- **Fix:** Updated the `unique name` row and added five relay rows.
- **Committed in:** `243448f`, `a382983`

---

**Total deviations:** 5 auto-fixed (1 blocking, 4 missing critical)
**Impact on plan:** Each one tightens the relay or its guard toward the plan's own threat register (T-13-22, T-13-23, T-13-25, T-13-27). Scope stays within the relay, the ci-gate guard, its selftest, fixtures and README section.

## Issues Encountered

- **Escapes lost in a JS template.** My first guard patch script wrote a template literal in a Bash heredoc, and JavaScript ate three escapes (`\$\{\{`, `\b`, `\${{`). I spotted it in the diff before any commit and repaired the lines from a script written with the Write tool. `ci-gate: OK` and the selftest confirmed the fix.
- **One harness artifact in the relay simulation.** The "dispatch rejected" scenario exited 1 as wanted, but its expected fragment was empty, and `grep -F ''` on empty output reports no match. This is a defect in the harness, not in the relay.
- **No network.** The simulation used a stub `gh` and `sleep` on a `/c/...` PATH. No real API call, push or dispatch happened in this plan.
- **`.gitignore`.** The uncommitted `.env*` change was left untouched and unstaged.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- **13-15 (mid-phase PR):** carries the relay to `main`. GitHub runs a `pull_request_target` workflow only from the default branch, so the relay does nothing before that merge (Pitfall 9).
- **13-19:** the `[ci skip]` proof PR should show the relay job named `CI OK` on the head SHA, a `workflow_dispatch` `CI` run on the head ref, and the relay mirroring its conclusion. It should also confirm three things:
  - the check counts for the ruleset (assumption A1);
  - `gh run watch` works without `checks: read`;
  - the 45 s wait is long enough for GitHub to create a `pull_request` run on an unmarked head.
- **13-21:** if A1 fails, switch to option B or C (D-06 amendment).
- **Branches cut before 13-07** lack `workflow_dispatch` in `ci.yml`. For them the relay's dispatch fails red until the branch is rebased.

## Self-Check: PASSED

- All 6 created files exist on disk. `npm run lint` read every one of them.
- Commits `243448f`, `e1fa306` and `a382983` are on this branch. `check evaluation-scope --plan 13-10 --commits-only` resolves them (status `resolved`).
- Acceptance criteria re-run:
  - `pull_request_target` count is 5 (>= 1);
  - `gh workflow run ci.yml` count is 1;
  - `permissions: {}` count is 1;
  - the `gh run watch` flags are quoted above;
  - each of the four bad fixtures exits 1 with its message;
  - the real repo prints `ci-gate: OK`.
- Plan verification: `npm run lint` exits 0, with the relay present and the selftest at 138/138.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
