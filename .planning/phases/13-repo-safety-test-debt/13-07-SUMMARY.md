---
phase: 13-repo-safety-test-debt
plan: 07
subsystem: infra
tags: [github-actions, ci, jq, guards, docs-only, workflow_dispatch, GUARD-08, CLEAN-01]

requires:
  - phase: 13-01
    provides: "CI OK job (ci-ok), scripts/ci/ci-ok.jq verdict, check-ci-gate.mjs rules 1-7 and the ci-gate selftest fixtures"
provides:
  - "scripts/ci/classify-changes.mjs: DOCS_ONLY_FILES, isDocsOnlyPath(), classify(paths, { truncated }) and a stdin CLI printing docs_only= and reason="
  - "ci.yml job `changes` (Classify changes, output docs_only); the six heavy jobs need it and skip only on docs_only 'true'"
  - "scripts/ci/ci-ok.jq: changes must succeed; heavy skips accepted only on docs_only \"true\" (one IN(...) list)"
  - "ci.yml workflow_dispatch trigger (no inputs) for the 13-10 relay"
  - "check-ci-gate.mjs rules 8-10: required triggers, no workflow-level paths/paths-ignore, docs-only skip set equals the jq IN list and each such job needs changes"
  - "CLEAN-01: the two commented optimize-images blocks are gone from ci.yml"
affects: [13-10 skip-marker relay (dispatches ci.yml), 13-15 mid-phase PR, 13-16 main ruleset, 13-19 docs-only and red-PR proofs]

actuals:
  tokens: 11752
  tasks: 3
  commits: 5
plan_head_before: 26f33a0f9949dce96fc9bb41a4ff57c6a71c57d8
plan_head_after: 7a198ef6a26d603f02938ba8f5d45ad24e11817f

tech-stack:
  added: []
  patterns:
    - "Docs-only fast path inside the workflow: a cheap classifier job, job-level if: on heavy jobs, and an aggregate jq verdict that accepts only the intended skips"
    - "Fail-closed classification: an exact path allow-list, no extension rule, renamed-from names included; empty, truncated, unreadable or unbased diffs run everything"
    - "Guard rule that ties two files together: the jobs carrying a condition in ci.yml must equal a list in ci-ok.jq"

key-files:
  created:
    - scripts/ci/classify-changes.mjs
    - scripts/guards/__selftest__/ci-gate/bad-paths-filter/.github/workflows/ci.yml
    - scripts/guards/__selftest__/ci-gate/bad-no-dispatch/.github/workflows/ci.yml
    - scripts/guards/__selftest__/ci-gate/bad-heavy-mismatch/.github/workflows/ci.yml
    - scripts/guards/__selftest__/ci-gate/bad-heavy-mismatch/scripts/ci/ci-ok.jq
  modified:
    - .github/workflows/ci.yml
    - scripts/ci/ci-ok.jq
    - scripts/guards/check-ci-gate.mjs
    - scripts/guards/selftest.mjs
    - scripts/guards/__selftest__/ci-gate/good/.github/workflows/ci.yml
    - scripts/guards/__selftest__/ci-gate/good/scripts/ci/ci-ok.jq
    - scripts/guards/__selftest__/ci-gate/{bad-checks-write,bad-ci-ok-if,bad-duplicate-ci-ok,bad-missing-need,bad-token-scope}/.github/workflows/ci.yml
    - scripts/README.md

key-decisions:
  - "13-07: the changes job reads the diff from one `gh api repos/$REPO/compare/$BASE...$HEAD` call (BASE = PR base SHA or github.event.before, `main` for workflow_dispatch; HEAD = PR head SHA or github.sha); new and old names go to classify-changes.mjs on stdin; no base, an all-zero base or a failed call writes docs_only=false and exits 0 (full CI); 300 or more files passes --truncated"
  - "13-07: a file name containing a line break is replaced by a marker that is never docs-only, so a crafted name cannot split into two docs-only lines"
  - "13-07: a classifier or jq crash fails the changes job (set -euo pipefail), which skips the heavy jobs and fails CI OK through the required changes success; red, never a silent pass"
  - "13-07: the ci-gate rules are numbered 8-10 (the plan's 7-9), because 13-01 already used 7 for the token-scope rule"
  - "13-07: rule 10 also fails a job carrying the docs-only condition without needing changes, and a jq IN id whose job lacks the condition (both directions of the set comparison)"

patterns-established:
  - "A new heavy ci.yml job joins ci-ok.needs, gets `needs: [changes]` plus `if: needs.changes.outputs.docs_only != 'true'`, and joins the IN(...) list in scripts/ci/ci-ok.jq in the same commit; npm run lint fails otherwise"
  - "Docs-only paths are an exact list; widening it is a D-09 change, never an extension rule"

requirements-completed: [GUARD-08, CLEAN-01]

coverage:
  - id: D1
    description: "classify-changes.mjs: .planning/ plus the five D-09 files are docs-only; fixture READMEs, docs/README.md, .planningX/, a bare .planning, an empty list, a truncated list and a rename out of lib/ are not; the CLI reads stdin (CRLF too), honours --truncated and rejects other arguments"
    requirement: GUARD-08
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#classify: (8 cases) and classify CLI: (5 cases)"
        status: pass
      - kind: other
        ref: "printf '.planning/a.md\\nREADME.md\\n' | node scripts/ci/classify-changes.mjs (docs_only=true, exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "ci-ok.jq: changes must be present and succeed; heavy skips pass only with docs_only \"true\"; e2e failure, changes failure, docs_only false with a skip, a missing changes entry and dependency-review skipped on a PR all fail; the eight 13-01 cases still hold with changes added"
    requirement: GUARD-08
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#ci-ok.jq: (15 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "ci.yml changes job and heavy-job conditions: the classify step's shell, run locally against a fake gh, gives docs_only=true for docs-only and dispatch (compare main...HEAD), false for a rename out of lib/, a line-break name, a code path, 300 files, an empty or missing files list, a failed call, an empty and an all-zero base"
    requirement: GUARD-08
    verification:
      - kind: other
        ref: "scratchpad simulation of jobs.changes.steps[classify].run with a stub gh (12 scenarios)"
        status: pass
      - kind: other
        ref: "node scripts/guards/check-ci-gate.mjs (ci-gate: OK) and js-yaml load of ci.yml"
        status: pass
    human_judgment: false
  - id: D4
    description: "check-ci-gate.mjs rules 8-10 and ci.yml workflow_dispatch: bad-paths-filter, a paths-ignore temp copy, bad-no-dispatch, bad-heavy-mismatch, an unconditioned jq id and a docs-only job without changes all exit 1 with their messages; the good fixture and the real repo pass"
    requirement: GUARD-08
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#ci-gate: (14 cases)"
        status: pass
      - kind: other
        ref: "scratchpad probe of flow-list, flow-map, scalar and quoted-key on: forms (6 forms, expected verdicts)"
        status: pass
    human_judgment: false
  - id: D5
    description: "CLEAN-01: the commented optimize-images steps are gone from ci.yml and the whole lint chain is green"
    requirement: CLEAN-01
    verification:
      - kind: other
        ref: "! git grep -n optimize-images -- .github (no output)"
        status: pass
      - kind: other
        ref: "npm run lint (exit 0, selftest 129/129)"
        status: pass
    human_judgment: false
  - id: D6
    description: "On GitHub, a docs-only PR skips the six heavy jobs and still gets a green CI OK, and ci.yml can be dispatched"
    requirement: GUARD-08
    verification: []
    human_judgment: true
    rationale: "Live GitHub behaviour is outside this plan by design (no pushes, no dispatches); 13-19 runs the docs-only proof PR and 13-10/13-19 the dispatch."

duration: 11min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 07: Docs-only Fast Path and Dispatch Trigger Summary

**A `changes` job classifies the PR diff with an exact D-09 allow-list (`scripts/ci/classify-changes.mjs`). A docs-only diff skips the six heavy jobs, and `ci-ok.jq` still gives a final `CI OK`, but only when `changes` succeeded and said so. `ci.yml` can now be dispatched for the relay, and three new `check-ci-gate.mjs` rules fail on a missing trigger, any workflow-level path filter, or a heavy-job list that drifts from the jq.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-11-13T10:48:57Z
- **Completed:** 2026-11-13T11:00:11Z
- **Tasks:** 3 (1 tracer TDD, 1 TDD, 1 auto)
- **Files modified:** 17 (5 created, 12 modified)

## Accomplishments

- **Classifier.** `scripts/ci/classify-changes.mjs` (Node builtins, ESM) exports `DOCS_ONLY_FILES`, `isDocsOnlyPath()` and `classify()`. A path is docs-only when it starts with `.planning/` or exactly equals one of the five D-09 files. There is no `*.md` rule. The classifier returns false, with a reason, for an empty list, a truncated list, or any other path. Its CLI reads newline-separated paths from stdin, CRLF included, and prints `docs_only=` and `reason=`.
- **`changes` job.** `Classify changes` uses a sparse checkout of `scripts/ci`, setup-node from `.node-version` with no cache, and `contents: read`. It makes one compare API call and pipes `filename` plus `previous_filename` into the classifier. Event fields reach the shell only through `env:`.
  - No base, an all-zero base, or a failed call: `docs_only=false` and exit 0, so the full CI runs.
  - 300 or more files: `--truncated`.
  - A file name with a line break becomes a marker that is never docs-only.
- **Heavy jobs.** `lint-and-typecheck`, `unit-tests`, `e2e-tests`, `visual-regression` and `security-audit` now have `needs: [changes]`. `build` has `needs: [changes, lint-and-typecheck, unit-tests]`. All six carry `if: needs.changes.outputs.docs_only != 'true'`. `dependency-review` is unchanged. `changes` joins `ci-ok.needs`.
- **jq verdict.** `scripts/ci/ci-ok.jq` returns false for a non-object, an empty object, or a missing or non-success `changes`. A heavy job may be `skipped` only when `changes` succeeded with `docs_only` `"true"`. The six heavy ids sit in one `IN(...)` call.
- **Trigger and guard rules.** `ci.yml` gains `workflow_dispatch:` with no inputs. `check-ci-gate.mjs` adds three rules:
  - rule 8: `on:` declares `push`, `pull_request` and `workflow_dispatch`, in block, flow-list, flow-map or scalar form;
  - rule 9: no `paths:` or `paths-ignore:` key anywhere in the `on:` block;
  - rule 10: the jobs whose `if:` reads `needs.changes.outputs.docs_only` equal the jq `IN(...)` ids, compared both ways, and each of them needs `changes`.
- **CLEAN-01.** `package.json` has no `optimize-images` script (its only image script is `guard:images`), so both commented blocks pointed at nothing. They are deleted, and `npm run lint` exits 0.
- **Selftest.** It goes from 103 to 129 cases, all passing.

## Task Commits

1. **Task 1: Docs-only classification end to end (tracer)**: `d4c3f37` (test, RED), then `f653989` (feat, GREEN)
2. **Task 2: workflow_dispatch, path-filter ban and heavy-set rules**: `46f54b5` (test, RED), then `0691202` (feat, GREEN)
3. **Task 3: Remove the commented image-optimisation steps (CLEAN-01)**: `7a198ef` (chore)

**Plan metadata:** recorded by the docs commit that adds this file.

**Tracer feedback gate after Task 1.** Auto mode was off, `human_verify_mode` was the `end-of-phase` default and the verify step was automated only. I re-ran it (selftest 123/123, CLI `docs_only=true`, `ci-gate: OK`, `parity: OK`) and went on to the expansion tasks without a checkpoint.

## TDD Gate Compliance

| Task | RED | GREEN | REFACTOR |
|------|-----|-------|----------|
| 1 | `d4c3f37`: 10 new cases failed on their assertions; all 113 others passed. Two targets were checked by `gsd-tools check tdd-red-evidence` (TAP, RED_EVIDENCE_OK, `target_test_failed`). `classify: .planning notes plus README.md are docs-only` got `false` from the export-only stub. `ci-ok.jq: docs-only pull_request with the six heavy jobs skipped passes` got jq exit 1, because the old verdict had no docs-only clause. The stub module exists only so the selftest can load. Without it the import would crash the whole run, which is a load failure, not RED. | `f653989`: 123/123 | none needed |
| 2 | `46f54b5`: six new ci-gate cases failed on their messages or exit codes; all 123 others passed. Three targets were checked: no dispatch, heavy mismatch and paths filter, each RED_EVIDENCE_OK. Before the change, `bad-heavy-mismatch` gave `ci-gate: OK`, and `bad-no-dispatch` and `bad-paths-filter` failed only on the missing jq file. | `0691202`: 129/129 | none needed |

The evidence records are in `.git/gsd-red-13-07-*.json` (untracked by design).

## Files Created/Modified

- `scripts/ci/classify-changes.mjs`: the docs-only classifier and CLI.
- `.github/workflows/ci.yml`:
  - the `changes` job;
  - the six heavy-job `needs` and `if:` lines;
  - `changes` in `ci-ok.needs`;
  - `workflow_dispatch`;
  - the two commented blocks removed.
- `scripts/ci/ci-ok.jq`: the required `changes` success and the docs-only clause, with a header naming the guard rule that ties it to `ci.yml`.
- `scripts/guards/check-ci-gate.mjs`:
  - rules 8 to 10;
  - new helpers `readOnBlock`, `readTriggers` and `readJqHeavyList`;
  - an updated header doc.
- `scripts/guards/selftest.mjs`:
  - `HEAVY_JOBS`, the new `needsOf(overrides, docsOnly)` and `allHeavy()`;
  - `classifyCase()` and `CLASSIFY`;
  - 26 new cases and three new temp roots, which the cleanup loop removes.
- `scripts/guards/__selftest__/ci-gate/good/`: a `changes` job, `build` as the one heavy job, `workflow_dispatch`, and a jq copy whose `IN` list is `build`.
- `scripts/guards/__selftest__/ci-gate/bad-{paths-filter,no-dispatch,heavy-mismatch}/`: new fixtures.
- `scripts/guards/__selftest__/ci-gate/bad-{checks-write,ci-ok-if,duplicate-ci-ok,missing-need,token-scope}/.github/workflows/ci.yml`: each gains `workflow_dispatch:` (see Deviations).
- `scripts/README.md`: the `check-ci-gate.mjs` section describes the fast path and gains three rule rows.

## Decisions Made

- **Range.** The compare call is three-dot (`BASE...HEAD`), so a `workflow_dispatch` run with `BASE=main` compares against the merge-base with `main` (D-08). A push compares `github.event.before` with the pushed head.
- **Classifier failure.** A crashed classifier fails the `changes` job. GitHub then skips the heavy jobs, because their `if:` has no status function, and `CI OK` fails on the required `changes` success. The result is red, not a silent pass.
- **Trust boundary.** `classify-changes.mjs` and `ci-ok.jq` run from the PR's own checkout. This adds no new trust boundary: on `pull_request` the PR's own `ci.yml` already defines its CI. The guard and the ruleset (13-16) are what keep `main` honest.
- **Rule numbering.** The new rules are 8 to 10, not the plan's 7 to 9, because 13-01's deviation took rule 7 for token scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The five older bad ci-gate fixtures gained `workflow_dispatch:`**
- **Found during:** Task 2
- **Issue:** Rule 8 would add a second failure, `no workflow_dispatch trigger`, to every older bad `ci.yml` fixture. `bad-checks-write` asserts `ci-gate: 2 failure(s)`, so it would break. More generally, each bad fixture should fail on its own rule only.
- **Fix:** Each of the five gained one `workflow_dispatch:` line. The `bad-checks-write` assertion moved from line 19 to line 20.
- **Files modified:** `scripts/guards/__selftest__/ci-gate/{bad-checks-write,bad-ci-ok-if,bad-duplicate-ci-ok,bad-missing-need,bad-token-scope}/.github/workflows/ci.yml`, `scripts/guards/selftest.mjs`
- **Verification:** 129/129, and each older case still shows its own message.
- **Committed in:** `46f54b5`

**2. [Rule 2 - Missing critical] Both directions of the heavy-set rule, plus a paths-ignore case**
- **Found during:** Task 2
- **Issue:** The planned fixtures prove only one direction: a conditioned job missing from the jq list. Two other faults had no case. One is a jq id whose job lacks the condition, which lets the jq accept a skip nobody configured. The other is a docs-only job that does not need `changes`. `paths-ignore` was also untested.
- **Fix:** Three temp-copy cases built from `good/`, CRLF-safe and cleaned up afterwards.
- **Files modified:** `scripts/guards/selftest.mjs`
- **Committed in:** `46f54b5` (RED), `0691202` (GREEN)

**3. [Rule 2 - Missing critical] File names with line breaks**
- **Found during:** Task 1
- **Issue:** The planned pipeline is newline-separated. A crafted name such as `README.md\n.planning/x` would split into two docs-only lines.
- **Fix:** In the `changes` step, jq replaces any name containing `\r` or `\n` with `:line-break-in-file-name:`, which is never docs-only. This mitigates T-13-16.
- **Files modified:** `.github/workflows/ci.yml`
- **Verification:** Local step simulation, case `newline`, gives `docs_only=false`.
- **Committed in:** `f653989`

**4. [Rule 2 - Missing critical] scripts/README.md kept in step with the guard**
- **Found during:** Task 2
- **Issue:** The `check-ci-gate.mjs` section described only rules 1 to 7 and an old `CI OK` verdict, so it would contradict the code.
- **Fix:** I added the fast-path paragraph and the three rule rows.
- **Files modified:** `scripts/README.md`
- **Committed in:** `0691202`

---

**Total deviations:** 4 auto-fixed (1 blocking, 3 missing critical)
**Impact on plan:** All four keep the guard and the classifier fail-closed, as the threat model requires. Scope stays within `ci.yml`, `scripts/ci`, the ci-gate guard, its fixtures and its README section.

## Issues Encountered

- **Fake gh on PATH.** My first local simulation of the `changes` step put the stub `gh` on `PATH` as `C:/...`. The colon split it, so the real `gh` answered one read-only `GET repos/o/r/compare/abc...def` with a 404. Nothing was written, and the rerun used `/c/...` paths. No push and no dispatch happened in this plan.
- **Backslashes in a heredoc.** A Bash heredoc halved the backslashes in three selftest regex lines. I repaired them with a script file and re-normalised `selftest.mjs` to CRLF before the RED commit.
- **`.gitignore`.** The uncommitted change was left untouched and unstaged, as instructed.

## Known Stubs

None. The RED commit's export-only `classify-changes.mjs` stub was replaced in the GREEN commit `f653989`.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- **13-10 (relay):** can dispatch `ci.yml` (`workflow_dispatch`, no inputs). Its `CI_OK_ELSEWHERE_ALLOWED` entry and explicit permissions are still required by rules 5 to 7.
- **13-15 / 13-19:** the docs-only proof PR should show `Classify changes` with `docs_only=true`, the six heavy jobs skipped, `Dependency Review` run, and a green `CI OK`. A PR that also touches any other path must run everything.
- **Untested assumption (RESEARCH A7):** the 300-file compare limit is treated as truncation. A live diff that size has not been tried.

## Self-Check: PASSED

- All 5 created files exist on disk.
- Commits `d4c3f37`, `f653989`, `46f54b5`, `0691202` and `7a198ef` are ancestors of HEAD, and `check evaluation-scope --plan 13-07 --commits-only` resolves all five.
- Acceptance criteria re-run:
  - `docs_only != 'true'` count is 6.
  - `name: Classify changes` count is 1.
  - `workflow_dispatch:` count is 1 (it was 0 at the base).
  - Every bad fixture exits 1 with its message, and `good` exits 0.
  - The negative `git grep optimize-images` prints nothing.
  - `npm run lint` exits 0.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
