---
phase: 13-repo-safety-test-debt
plan: 01
subsystem: infra
tags: [github-actions, ci, jq, guards, merge-gate, GUARD-07]

requires: []
provides:
  - "ci.yml job `ci-ok` named `CI OK` (if: always(), needs all seven CI jobs): the single check the main ruleset will require"
  - "scripts/ci/ci-ok.jq: the CI OK verdict over toJSON(needs) with --arg event"
  - "scripts/guards/check-ci-gate.mjs (`npm run guard:ci`, inside `npm run lint`): seven rules keeping CI OK complete, unconditional, unique and unforgeable"
  - "CI_OK_ELSEWHERE_ALLOWED: the empty { file, job } allow-list 13-10 extends with the skip-marker relay"
affects: [13-07 docs-only changes job and jq clause, 13-10 skip-marker relay, 13-15 mid-phase PR, 13-16 main ruleset, 13-19 red-PR proof]

actuals:
  tokens: 7948
  tasks: 3
  commits: 5
plan_head_before: 41bb956f498ae281d6f33d33e84cbf6a15ca5ead
plan_head_after: 05b8be3e02b14d79d31ef27634ecb3dea4d2ed31

tech-stack:
  added: []
  patterns:
    - "Aggregate required check: one if: always() job over toJSON(needs), with the verdict in a versioned jq file that the selftest exercises"
    - "Line-based workflow YAML reading in guards (comment-stripped, job ids one level under jobs:, needs in flow, scalar and block form), no YAML library"
    - "Guard rule exceptions as an explicit allow-list constant, empty until a later plan needs one"

key-files:
  created:
    - scripts/ci/ci-ok.jq
    - scripts/guards/check-ci-gate.mjs
    - scripts/guards/__selftest__/ci-gate/good/.github/workflows/ci.yml
    - scripts/guards/__selftest__/ci-gate/good/scripts/ci/ci-ok.jq
    - scripts/guards/__selftest__/ci-gate/bad-missing-need/.github/workflows/ci.yml
    - scripts/guards/__selftest__/ci-gate/bad-ci-ok-if/.github/workflows/ci.yml
    - scripts/guards/__selftest__/ci-gate/bad-duplicate-ci-ok/.github/workflows/ci.yml
    - scripts/guards/__selftest__/ci-gate/bad-duplicate-ci-ok/.github/workflows/other.yml
    - scripts/guards/__selftest__/ci-gate/bad-checks-write/.github/workflows/ci.yml
    - scripts/guards/__selftest__/ci-gate/bad-token-scope/.github/workflows/ci.yml
    - scripts/guards/__selftest__/ci-gate/bad-token-scope/.github/workflows/other.yml
  modified:
    - .github/workflows/ci.yml
    - scripts/guards/selftest.mjs
    - package.json
    - scripts/README.md

key-decisions:
  - "CI OK verdict lives in scripts/ci/ci-ok.jq (pure filter, jq -e): non-empty needs object, every result success, only dependency-review may skip and only outside pull_request"
  - "check-ci-gate.mjs accepts `${{ always() }}` as the same expression as `always()` for the ci-ok if: rule; anything else, or no if:, fails"
  - "check-ci-gate.mjs also bans permissions: write-all and requires every job to have an explicit token scope (top-level or job-level permissions), because either gap would hand a job checks: write"

patterns-established:
  - "Every new ci.yml job joins ci-ok.needs in the same commit; npm run lint fails otherwise"
  - "A guard rule is not done until a selftest case proves it can fail"

requirements-completed: [GUARD-07]

coverage:
  - id: D1
    description: "ci.yml ends with a CI OK job (id ci-ok, if: always(), needs all seven jobs, sparse checkout of scripts/ci, verdict via jq -e -f scripts/ci/ci-ok.jq)"
    requirement: GUARD-07
    verification:
      - kind: other
        ref: "node scripts/guards/check-ci-gate.mjs (ci-gate: OK)"
        status: pass
      - kind: other
        ref: "js-yaml load of .github/workflows/ci.yml: 8 jobs, ci-ok name/if/needs as specified"
        status: pass
      - kind: other
        ref: "npm run guard:parity (parity: OK after the ci.yml edit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "scripts/ci/ci-ok.jq verdict: passes on all-success and on dependency-review skipped outside PRs; fails on failure, cancelled, an unexpected skip and an empty needs object"
    requirement: GUARD-07
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#ci-ok.jq: (eight cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "check-ci-gate.mjs rules 1-7, each proven able to fail by a selftest case, and run from npm run lint"
    requirement: GUARD-07
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#ci-gate: (eight cases)"
        status: pass
      - kind: other
        ref: "npm run lint (exit 0, includes guard:ci and guard:selftest 103/103)"
        status: pass
    human_judgment: false
  - id: D4
    description: "CI OK behaves as required on GitHub (green on a passing PR, red and unmergeable on a failing one)"
    requirement: GUARD-07
    verification: []
    human_judgment: true
    rationale: "Live GitHub behaviour is outside this plan by design; 13-15 (mid-phase PR) and 13-19 (red PR) prove it. Nothing was pushed here."

duration: 11min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 01: CI OK Aggregate and ci-gate Guard Summary

**One `CI OK` job (`if: always()`, needs all seven CI jobs, verdict in `scripts/ci/ci-ok.jq`), plus a seven-rule `check-ci-gate.mjs` in `npm run lint`. The guard fails when a job escapes `needs`, when `CI OK` is made conditional, renamed or duplicated, or when any workflow could forge it through `checks: write`.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-11-13T10:07:59Z
- **Completed:** 2026-11-13T10:19:30Z
- **Tasks:** 3 (1 tracer, 2 TDD)
- **Files modified:** 15 (11 created, 4 modified)

## Accomplishments

- `ci.yml` has a last job, `ci-ok` / `CI OK`. It has `if: always()`, `needs` on all seven jobs, `timeout-minutes: 5` and job-level `contents: read`. It does a sparse checkout of `scripts/ci` and no setup-node. It logs the need results, then pipes `toJSON(needs)` into `jq -e --arg event "$EVENT" -f scripts/ci/ci-ok.jq`.
- `scripts/ci/ci-ok.jq` returns true only for a non-empty object where every result is `success`. The one exception: `dependency-review` may be `skipped` when the event is not `pull_request`. `failure`, `cancelled`, any other `skipped`, empty input and non-object input all fail.
- `scripts/guards/check-ci-gate.mjs` (`npm run guard:ci`, run in `lint` right after `guard:parity`) checks seven rules:
  1. `ci.yml` exists.
  2. Exactly one `CI OK`, with id `ci-ok` and `if: always()`.
  3. `ci-ok.needs` equals every other job id, compared as sets.
  4. The job runs `jq -f scripts/ci/ci-ok.jq` and that file exists.
  5. No other workflow has a job named `CI OK` (allow-list empty).
  6. No line grants `checks: write` or `write-all`.
  7. Every job's token scope is explicit.
- `selftest.mjs` gains 16 cases: eight `ci-ok.jq` cases and eight `ci-gate:` cases. Total: 103/103 pass. If `jq` is missing, every jq case fails with `jq could not run (ENOENT); install jq 1.6+ ...`. I proved this by hiding jq from PATH (exit 1).
- `scripts/README.md` documents the guard's rules in a table and lists `guard:ci` in the lint chain, in `package.json` order.

## Seeded-fault run (Task 1 acceptance)

Deleting `e2e-tests` from `ci-ok.needs` in `.github/workflows/ci.yml` (`sed`, then restored from a copy):

```
ci-gate: FAIL .github/workflows/ci.yml: ci-ok needs is missing e2e-tests
ci-gate: 1 failure(s)
seeded exit=1
ci-gate: OK
reverted exit=0
```

The fault was never committed. The Task 1 commit has the full `needs` list.

## Task Commits

1. **Task 1: End-to-end `CI OK` (tracer)**: `1bbb347` (feat)
2. **Task 2: Guard fixtures for the needs-set and CI OK shape rules**: `5172b5e` (test, RED) → `72b86ec` (feat, GREEN)
3. **Task 3: Unique `CI OK`, no `checks: write`, README**: `27bfbdd` (test, RED) → `05b8be3` (feat, GREEN)

**Plan metadata:** recorded by the docs commit that adds this file.

Tracer feedback gate after Task 1: auto mode was off, `human_verify_mode` was the `end-of-phase` default and the verify step was automated only. I re-ran it (`guard:ci` OK, selftest 95/95, `guard:parity` OK) and moved on to the expansion tasks without a checkpoint.

## TDD Gate Compliance

| Task | RED | GREEN | REFACTOR |
|------|-----|-------|----------|
| 2 | `5172b5e`: target `ci-gate: CI OK with if: success() fails` failed on `output lacks: CI OK must use if: always()` (classifier: RED_EVIDENCE_OK, `target_test_failed`). The two sibling cases already passed, because Task 1 had implemented the needs-set and `if:` rules. Only the required message wording was new behaviour. | `72b86ec`: 98/98 | none needed |
| 3 | `27bfbdd`: three targets failed on their output assertions (duplicate CI OK, `checks: write`, token scope), each RED_EVIDENCE_OK. All 98 earlier cases still passed, so there was no load or fixture fault. | `05b8be3`: 103/103 | none needed |

The evidence came from `node scripts/guards/selftest.mjs --tap` (TAP 13), classified by `gsd-tools check tdd-red-evidence`. The records are in `.git/gsd-red-13-01-*.json` (untracked by design).

## Files Created/Modified

- `.github/workflows/ci.yml`: new `ci-ok` job (the only required check), with a comment naming the guard.
- `scripts/ci/ci-ok.jq`: the CI OK verdict. Its header names D-01, each clause, and 13-07's coming docs-only clause.
- `scripts/guards/check-ci-gate.mjs`: the guard (rules 1-7, `--root`, `ci-gate:` output).
- `scripts/guards/selftest.mjs`: `CI_OK_JQ`, `CI_GATE`, `cig()`, `needsOf()`, `ciOkCase()`, `tempCiGateRoot()`, and 16 cases.
- `scripts/guards/__selftest__/ci-gate/*`: `good` (block-form `needs` out of job order, plus a copy of `ci-ok.jq`), `bad-missing-need` (flow form), `bad-ci-ok-if`, `bad-duplicate-ci-ok`, `bad-checks-write` and `bad-token-scope`.
- `package.json`: `guard:ci` script; `npm run guard:ci` in `lint` after `guard:parity`.
- `scripts/README.md`: `check-ci-gate.mjs` section with a rule table; the lint chain updated.

## Decisions Made

- The jq file is a pure filter with no `halt_error`, so `jq -e` returns 1 for a false verdict. A malformed input or a missing `--arg` gives jq's own error exit (2 or more), which also fails the job. The selftest expects exactly 1 for the false cases, so a jq crash cannot pass as a verdict.
- The guard accepts `${{ always() }}` as equal to `always()`. Every other `if:`, or no `if:` at all (which defaults to `success()`), fails with `CI OK must use if: always() (...)`.
- The ci-ok step logs `jq -c 'map_values(.result)'` before the verdict, so a red `CI OK` shows which need caused it.
- Rule 5 is `findCiOkOutsideCi(workflows, allowed)`, with `CI_OK_ELSEWHERE_ALLOWED = []` as `{ file, job }` pairs. 13-10 adds the relay there and nowhere else.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Banned `permissions: write-all` and implicit token scope alongside `checks: write`**
- **Found during:** Task 3
- **Issue:** Rule 6 as written matched only a literal `checks: write`. Two other paths give a job the same power and would get past it. One is `permissions: write-all`. The other is a workflow with no `permissions:` block, whose token falls back to the repository default, which may be read/write and so include `checks: write`. T-13-01 (spoofing a `CI OK` check run) mitigates exactly this, and 13-16's `integration_id` pin does not help, because a workflow's own `GITHUB_TOKEN` check runs come from the same GitHub Actions app.
- **Fix:** Rule 6 also fails on `permissions: write-all` (message contains `grants checks: write`). New rule 7: a job with no `permissions:` block, in a workflow without a top-level one, fails. Fixture `bad-token-scope` plus one selftest case. Both real workflows already declare top-level `contents: read`, so they pass unchanged.
- **Files modified:** `scripts/guards/check-ci-gate.mjs`, `scripts/guards/selftest.mjs`, `scripts/guards/__selftest__/ci-gate/bad-token-scope/.github/workflows/{ci,other}.yml`, `scripts/README.md`
- **Verification:** Fixture fails with both messages (exit 1); real repo `ci-gate: OK`.
- **Committed in:** `27bfbdd` (RED), `05b8be3` (GREEN)

**2. [Rule 2 - Missing critical] Failing cases for the rules no planned fixture exercised**
- **Found during:** Task 3
- **Issue:** The plan's truth "the guard selftest proves every guard rule can fail" was not covered for three rules: `ci.yml` missing, the one-`CI OK`/rename rule, and "ci-ok does not run `jq -f scripts/ci/ci-ok.jq`".
- **Fix:** Two new cases. One uses `--root` at the `ci-gate/` folder, which has no `.github`. The other uses a temp copy of `good/` with `ci-ok` renamed and the jq path changed. It is CRLF-safe, because Windows checkouts convert the fixtures, and it is cleaned up by the existing cleanup loop. The `bad-missing-need` case now also asserts `scripts/ci/ci-ok.jq: does not exist`. No new committed fixture.
- **Files modified:** `scripts/guards/selftest.mjs`
- **Verification:** 103/103; a CRLF copy of `good/` also passes the guard.
- **Committed in:** `05b8be3`

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both tighten the guard to match the plan's own threat model and truths. No scope beyond `check-ci-gate.mjs`, its selftest and its README entry.

## Issues Encountered

- `.gitignore` gained a `+.env*` line in the working tree during this run. None of my commands wrote it (my only in-place edit was the seeded-fault `sed` on ci.yml, restored from a copy). I left it unstaged and uncommitted for the orchestrator or Tim to judge.
- `jq` is not on the plain Git Bash PATH by name only. It is a WinGet install and resolves for Node's `spawnSync('jq')`, so the selftest runs locally. `ubuntu-latest` ships jq.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 13-07 adds the `changes` job. It must join `ci-ok.needs` (the guard enforces this), and the docs-only clause goes into `scripts/ci/ci-ok.jq`, with new `ciOkCase` selftest cases.
- 13-10 adds the relay as the single `CI_OK_ELSEWHERE_ALLOWED` entry. The relay workflow needs explicit `permissions` (rule 7) and must not grant `checks: write` (rule 6).
- 13-15 and 13-19 prove `CI OK` live. Nothing was pushed from this plan.

## Self-Check: PASSED

- All 11 created files exist on disk.
- Commits `1bbb347`, `5172b5e`, `72b86ec`, `27bfbdd` and `05b8be3` are ancestors of HEAD. `check evaluation-scope --plan 13-01 --commits-only` resolves them.
- Acceptance criteria re-run:
  - `name: CI OK` count is 1.
  - The `-f scripts/ci/ci-ok.jq` count is 1.
  - `guard:ci` is in `lint`.
  - Every fixture exits as specified, with the specified message.
  - `grep -c check-ci-gate scripts/README.md` is 2.
- `npm run lint` exits 0.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
