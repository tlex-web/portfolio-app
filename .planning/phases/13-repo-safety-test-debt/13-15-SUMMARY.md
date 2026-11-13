---
phase: 13-repo-safety-test-debt
plan: 15
subsystem: infra
tags: [github, pull-request, ci-ok, visual-regression, zero-diff, d-05, guard-07, clean-01]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-01/13-07/13-10 CI OK gate, docs-only fast path and skip relay; 13-02 fail-closed limiter; 13-03 audit sweep; 13-04/13-07 CLEAN-01; 13-05 Tim's production facts and the keep-alive; 13-08/09/11/12/13/14 ledger fixes and G5/G6"
provides:
  - "PR #143 (https://github.com/tlex-web/portfolio-app/pull/143), gsd/phase-13-repo-safety-test-debt into main, open and not a draft, mergeable, with CI OK success on head 90758dbbbfd55dbfbc2c622052a3ed683f35e18b"
  - "Zero-pixel-diff proof against the 1.64.1 baselines: Visual Regression PASS with --update-snapshots=none (96 passed); check-snapshot-commit --none OK on both CLEAN-01 commits; no PNG in the branch diff against origin/main"
  - "E2E Tests duration baseline for 13-20: 28m31s on the head SHA after the 13-03 sweep (under the 45-minute line)"
affects: [13-16 (Tim merges with a merge commit, then the ruleset), 13-19 (live proofs on ci/13-*), 13-20 (E2E duration baseline)]

pr:
  number: 143
  url: https://github.com/tlex-web/portfolio-app/pull/143
  head_sha: 90758dbbbfd55dbfbc2c622052a3ed683f35e18b
  base: main
  approval:
    literal: "Push and pr"
    given: "Tim, in the conversation, 2026-11-13"
    mapped_option: push-and-pr
    mapping_by: "the orchestrator: plain push of the branch, open the PR, fast-forward fix pushes allowed"

actuals:
  tokens: 3900     # chars/4 over the files this plan changed: this SUMMARY (~14,600 chars) plus the deferred-items entry (~900 chars)
  tasks: 3
  commits: 0       # MEASURED: git rev-list --count 90758db..HEAD at SUMMARY write. No source change by design; the SUMMARY and STATE/ROADMAP docs commits follow
plan_head_before: 90758dbbbfd55dbfbc2c622052a3ed683f35e18b
plan_head_after: 90758dbbbfd55dbfbc2c622052a3ed683f35e18b

tech-stack:
  added: []
  patterns:
    - "Before waiting on a run, match its headBranch and headSha to the pushed commit. The CodeQL dynamic run reports headBranch refs/pull/143/head, but its SHA is the same"

key-files:
  created:
    - .planning/phases/13-repo-safety-test-debt/13-15-SUMMARY.md
  modified:
    - .planning/phases/13-repo-safety-test-debt/deferred-items.md

key-decisions:
  - "13-15: Tim's reply \"Push and pr\" (2026-11-13) was mapped by the orchestrator to push-and-pr. The branch was pushed plain with git push -u origin HEAD, and PR #143 was opened non-draft against main. No fix push was needed"
  - "13-15: CI OK concluded success (app 15368) on head 90758db, and so did all 13 check runs on that SHA. The E2E baseline for 13-20 is 28m31s, under the 45-minute line, so nothing is flagged"
  - "13-15: the Security Audit job passes while npm audit lists 25 dev-only advisories (3 low, 22 moderate). The step is warn-only (continue-on-error) on main as well, and npm audit --omit=dev finds 0. It is logged in deferred-items.md and not changed here"

patterns-established:
  - "Mid-phase PR evidence lists every check run on the head SHA by app id and checks that none is still in progress. CI OK alone is not the whole picture"

requirements-completed: [GUARD-07, GUARD-08, GUARD-09, CLEAN-01]

coverage:
  - id: D1
    description: "PR #143 is open against main. It was opened only after Tim's recorded approval (\"Push and pr\") and after 13-05 recorded the complete Upstash pair in Production with System Env Vars on (Pitfall 2)"
    requirement: GUARD-07
    verification:
      - kind: other
        ref: "gh pr view 143 --json state,isDraft,baseRefName,headRefOid: OPEN, false, main, 90758db"
        status: pass
    human_judgment: false
  - id: D2
    description: "On the PR head SHA, Classify changes and CI OK concluded success (app 15368). All 13 check runs completed, with none still pending"
    requirement: GUARD-07
    verification:
      - kind: other
        ref: "gh api repos/tlex-web/portfolio-app/commits/90758db.../check-runs (13 runs, all success; 0 not completed)"
        status: pass
      - kind: other
        ref: "gh pr checks 143 (exit 0, CI OK pass)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Zero-pixel-diff proof: Visual Regression passed with update mode none, and check-snapshot-commit --none passed on both CLEAN-01 commits (6ff759d, d69b42c)"
    requirement: CLEAN-01
    verification:
      - kind: automated_ui
        ref: "GITHUB_TOKEN=... node scripts/ci/check-visual-run.mjs --sha 90758db... --wait 30 (PASS job 131901288327)"
        status: pass
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha 6ff759d --none / --sha d69b42c --none (snapshot-commit: OK (0 changed), each)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The PR head commit message carries no skip marker, so the pull_request CI run exists. The relay is not on main yet"
    requirement: GUARD-08
    verification:
      - kind: other
        ref: "git log -1 --format=%B on 90758db (no marker); 13-14 catch-all check exit 0 (Task 1)"
        status: pass
    human_judgment: false

duration: 45min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 15: Mid-phase PR Summary

**PR #143 takes the Phase 13 CI gate and the verified work to `main` (D-05). The `pull_request` run of `ci.yml` on head `90758db` finished green with `CI OK` success. Visual Regression compared all 96 shots with `--update-snapshots=none` and found no diff, and both CLEAN-01 commits change zero PNGs. Tim merges in 13-16. The plan did not merge anything or change any setting.**

## Performance

- **Duration:** about 45 min of wall time, most of it the CI run. Task 1 ran from about 12:55Z to 12:58Z, before the checkpoint. Task 3 ran from 13:01:25Z to about 13:40Z.
- **Started:** about 2026-11-13T12:55Z
- **Completed:** 2026-11-13T13:40Z
- **Tasks:** 3 of 3 (Task 2 was Tim's decision)
- **Files modified:** 2 (planning docs only)

## Pull request

| Field | Value |
|-------|-------|
| PR | #143, https://github.com/tlex-web/portfolio-app/pull/143 |
| Title | Phase 13 (mid-phase): CI OK gate, skip relay, fail-closed limiter, keep-alive, audit sweep, G5/G6, ledger fixes, CLEAN-01 |
| Head | `gsd/phase-13-repo-safety-test-debt` at `90758dbbbfd55dbfbc2c622052a3ed683f35e18b`, 108 commits ahead of and 0 behind `origin/main` (`b81d6f2`) |
| Base | `main` |
| State | open, not a draft, `MERGEABLE` |
| Body | the scratch file Task 1 wrote, which the orchestrator reviewed: `C:/Users/tim/AppData/Local/Temp/claude/b700806455329315/423f2dbb-2df9-42ef-a459-a3a8b26d8d03/scratchpad/13-15-pr-body.md` |
| Push | `git push -u origin HEAD`, plain, creating the new remote branch and setting the upstream. No force push and no other branch |

**pr.approval:** Tim's literal reply, given in the conversation on 2026-11-13, was "Push and pr". The orchestrator mapped it to option `push-and-pr`: a plain push of the branch, open the PR, fast-forward fix pushes allowed. No fix push was needed.

## Task 1 results (pre-push gate, recorded by the first executor at 90758db)

- `npm run lint && npm run type-check && npm test` exited 0: selftest 157/157, and Jest ran 105 suites with 1757 tests.
- Pitfall 2 is resolved. 13-05-SUMMARY records the complete `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` pair in Production, with System Environment Variables on, so `VERCEL_ENV` reaches the runtime. This lists names only.
- The 13-14 catch-all check exited 0. None of the 108 branch commits carries a skip marker, the head commit included.
- Task 1 had nothing to commit. The PR title and body were written to scratch files outside the repo.

## CI on the head SHA

Workflow runs on `90758db`. Before waiting on each run, its `headSha` was checked against the push:

| Run | Workflow | Event | headBranch | headSha | Conclusion |
|-----|----------|-------|------------|---------|------------|
| 43430095783 | CI | pull_request | gsd/phase-13-repo-safety-test-debt | 90758db | success (13:01:38Z to 13:30:41Z) |
| 43430088895 | PR #143 (CodeQL) | dynamic | refs/pull/143/head | 90758db | success |

Check runs, from `gh api repos/tlex-web/portfolio-app/commits/90758dbbbfd55dbfbc2c622052a3ed683f35e18b/check-runs --jq '.check_runs[] | {name, conclusion, app: .app.id}'`. All 13 completed; a `select(.status != "completed")` count returned 0:

| Check run | Conclusion | App id |
|-----------|------------|--------|
| CI OK | success | 15368 |
| Classify changes | success | 15368 |
| Lint and Type Check | success | 15368 |
| Unit Tests | success | 15368 |
| E2E Tests | success | 15368 |
| Visual Regression | success | 15368 |
| Build Application | success | 15368 |
| Dependency Review | success | 15368 |
| Security Audit | success | 15368 |
| Analyze (actions) | success | 15368 |
| Analyze (javascript-typescript) | success | 15368 |
| CodeQL | success | 57789 |
| Vercel Preview Comments | success | 8329 |

`gh pr checks 143` exited 0. It also lists the `Vercel` commit status ("Deployment has completed"), which is a status rather than a check run.

**CI OK conclusion:** success, from GitHub Actions (app 15368), job 131915133026, 13:30:34Z to 13:30:41Z. Its `needs` list covers changes, lint-and-typecheck, unit-tests, e2e-tests, visual-regression, build, dependency-review and security-audit.

### Job durations (run 43430095783)

From `gh run view 43430095783 --json jobs --jq '.jobs[] | {name, startedAt, completedAt}'`:

| Job | Started | Completed | Duration |
|-----|---------|-----------|----------|
| Dependency Review | 13:01:41Z | 13:01:48Z | 7s |
| Classify changes | 13:01:41Z | 13:01:58Z | 17s |
| Security Audit | 13:02:01Z | 13:02:55Z | 54s |
| Unit Tests | 13:02:01Z | 13:03:43Z | 1m42s |
| Lint and Type Check | 13:02:01Z | 13:03:59Z | 1m58s |
| Build Application | 13:04:04Z | 13:05:35Z | 1m31s |
| Visual Regression | 13:02:01Z | 13:05:49Z | 3m48s |
| **E2E Tests** | 13:02:00Z | 13:30:31Z | **28m31s** |
| CI OK | 13:30:34Z | 13:30:41Z | 7s |

**E2E baseline for 13-20:** 28m31s on the head SHA after the 13-03 sweep. That is under the roughly 45-minute line in the CONTEXT discretion, so nothing is flagged for Tim. The whole run took 29m03s.

## Zero-pixel-diff proof

- `GITHUB_TOKEN=$(gh auth token) node scripts/ci/check-visual-run.mjs --sha 90758dbbbfd55dbfbc2c622052a3ed683f35e18b --wait 30` printed `PASS https://github.com/tlex-web/portfolio-app/actions/runs/43430095783/job/131901288327` and exited 0.
- The Visual Regression job log shows `npx playwright test --project=visual-dark --project=visual-light --update-snapshots=none` and `96 passed (2.1m)`.
- `node scripts/ci/check-snapshot-commit.mjs --sha 6ff759d --none` printed `snapshot-commit: OK (0 changed)` and exited 0. That commit is 13-04's "remove the dead image config, SW image-endpoint branch and vercel.com hint".
- `node scripts/ci/check-snapshot-commit.mjs --sha d69b42c --none` printed `snapshot-commit: OK (0 changed)` and exited 0. That commit is 13-04's "remove the test-only motion helpers and TILT_CONFIG".
- `git diff --name-status origin/main...HEAD -- '*.png'` is empty, so no PNG changes anywhere on the branch. That covers 7a198ef (13-07's commented-CI removal) and the ledger fixes. Nothing was re-baselined.

## Accomplishments

- The mid-phase PR is open with a green `CI OK`, so `CI OK` can reach `main` before the 13-16 ruleset requires it.
- There is a recorded zero-pixel-diff proof for CLEAN-01 and the ledger fixes against the 1.64.1 baselines.
- There is an E2E duration baseline for 13-20.

## Task Commits

1. **Task 1: Pre-push gate** made no commit (by design; the outputs are the scratch PR files).
2. **Task 2: Tim approves the push and the PR** was a checkpoint. Tim answered "Push and pr".
3. **Task 3: Push, open the PR, verify CI OK and the zero-pixel-diff proof** made no source commit. It pushed `90758db` and opened PR #143.

**Plan metadata:** recorded by the docs commit that adds this file, plus a separate STATE/ROADMAP commit. Both reach the PR branch only as plain fast-forward pushes.

## Files Created/Modified

- `.planning/phases/13-repo-safety-test-debt/13-15-SUMMARY.md`: this file.
- `.planning/phases/13-repo-safety-test-debt/deferred-items.md`: the npm audit observation below.

## Decisions Made

- No fix push was needed, because every job was green on the first run.
- The PR was opened as a normal PR, not a draft, because the plan does not ask for a draft.
- The Security Audit warning was logged, not fixed. It comes from dev dependencies only, the step is warn-only on `main` as well, and it is outside this plan's scope.

## Deviations from Plan

None. The plan was executed as written.

## Issues Encountered

- **Security Audit passes with a warning.** The `npm audit --audit-level=moderate` step exited 1 under `continue-on-error: true`. The next step printed `::warning::Security vulnerabilities found`, listing 25 vulnerabilities (3 low, 22 moderate), among them deepmerge GHSA-gcqx-w48m-w2h4 and glob GHSA-3g3m-2fjr-6pw4. Locally, `npm audit --omit=dev` finds 0. `origin/main`'s `ci.yml` has the same warn-only step, so this plan did not cause it. It is logged in `deferred-items.md` with two open decisions: whether to fix the dev advisories, and whether the audit should ever fail `CI OK`.
- The runner annotations also include the usual `ubuntu-latest` migration notice, and Build Application reports "No files were found with the provided path: .next/". Neither affected any job's conclusion.

## Known Stubs

None.

## User Setup Required

None from this plan. Tim's next act is the merge in 13-16, using a merge commit (D-03).

## Next Phase Readiness

- **13-16:** Tim merges PR #143 with a merge commit. Then `CI OK` must be confirmed on the merge commit on `main`, and the ruleset follows. The merge deploys production with the fail-closed limiter, starts the keep-alive schedule and activates the relay for later PRs.
- **13-19:** the `ci/13-*` live proofs need the relay on `main`, so they wait for the 13-16 merge.
- **13-20:** the E2E baseline is 28m31s.
- **Docs pushes after the PR opened do not take the fast path.** For a `pull_request` event, `Classify the diff` compares the PR base SHA (`main`) with the head, so it classifies the whole PR diff. A docs-only push to this PR therefore re-runs the full CI, about 29 minutes. That is correct by design: the gate judges what would merge. Pushes so far, all plain fast-forwards:
  - `77905fb` (STATE/ROADMAP/REQUIREMENTS): run 43435106776, full CI.
  - The commit that adds this correction: its run's CI OK result is verified in the executor's hand-back. Before merging in 13-16, confirm `CI OK` success on the PR's final head SHA (`gh pr checks 143`).

## Self-Check: PASSED

- `.planning/phases/13-repo-safety-test-debt/13-15-SUMMARY.md` exists (this file).
- PR #143 is `OPEN`, `isDraft: false`, base `main`, with head `90758db` matching `git rev-parse HEAD` at the time of writing.
- `gh pr checks 143` exited 0 with a `CI OK` pass line. The check-runs API shows `CI OK` success with app 15368 and `Classify changes` success. No check run is still in progress.
- `check-visual-run` printed PASS and exited 0. `check-snapshot-commit --none` returned OK for 6ff759d and d69b42c.
- `commits: 0` was measured from the ledger at `.git/gsd-plan-head-before-13-15`. The plan has no code changes, by design.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
