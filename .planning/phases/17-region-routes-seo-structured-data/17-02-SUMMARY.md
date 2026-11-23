---
phase: 17-region-routes-seo-structured-data
plan: 02
subsystem: infra
tags: [github-actions, playwright, ci, e2e, audit]

requires: []
provides:
  - "E2E Tests as an engine matrix: one Playwright project per leg (chromium, firefox, webkit), fail-fast false, literal job name, per-leg playwright-report-<project> artifacts"
  - "Audit sweep timeout scaled by AUDIT_SWEEP.length (AUDIT_SWEEP_PAGE_MS = 30_000)"
affects: [17-10, 17-15, 18]

actuals:
  tokens: 1150
  tasks: 2
  commits: 2
plan_head_before: 3024ec506671bb151818a1ba3e306ee70641fbc1
plan_head_after: f0aeb69612312282036e5631962bd1824d7ec7fa

tech-stack:
  added: []
  patterns:
    - "Matrix values reach a run block only through env: (PW_PROJECT), never as an expression"
    - "Per-leg artifact names (name-${{ matrix.project }}) so matrix legs never collide"

key-files:
  created: []
  modified:
    - .github/workflows/ci.yml
    - e2e/audit.spec.ts

key-decisions:
  - "E2E Tests keeps job id e2e-tests and the literal name 'E2E Tests'; GitHub appends the matrix value, so checks read 'E2E Tests (chromium|firefox|webkit)'; needs.e2e-tests.result aggregates every leg, so ci-ok.jq is unchanged (D-25)"
  - "Sweep budget = 60 s setup + 30 s per AUDIT_SWEEP page, equal to the old 180 s for four pages"

patterns-established:
  - "Engine-matrix E2E: one Playwright project per CI leg, fail-fast off so one run shows every engine"

requirements-completed: [REGION-07]

coverage:
  - id: D1
    description: "CI E2E Tests job runs one leg per engine under the unchanged e2e-tests id, with literal name, fail-fast false, PW_PROJECT env and per-leg artifacts"
    requirement: REGION-07
    verification:
      - kind: other
        ref: "node -e js-yaml shape check of jobs['e2e-tests'] (plan Task 1 <automated>) -> 'e2e matrix: OK'"
        status: pass
      - kind: other
        ref: "npm run guard:ci -> ci-gate: OK"
        status: pass
      - kind: other
        ref: "npm run guard:selftest -> selftest: 293/293 cases passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "Audit sweep timeout scales with AUDIT_SWEEP.length; the sweep remains one test"
    requirement: REGION-07
    verification:
      - kind: other
        ref: "npx playwright test e2e/audit.spec.ts --project=chromium --list | grep -cF 'every sitemap page once in Chromium' -> 1"
        status: pass
      - kind: other
        ref: "npm run type-check; npm run lint (guard:tests:scan included) -> exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Per-leg E2E durations on a real CI run (the wall-clock drop D-25 is for)"
    verification: []
    human_judgment: true
    rationale: "Needs a pushed CI run; 17-15 owns the push and the duration record under D-27. Nothing is pushed from this plan."

duration: 5min
completed: 2026-11-23
status: complete
---

# Phase 17 Plan 02: E2E engine matrix and scaled audit sweep Summary

**The CI E2E Tests job now runs as a three-leg engine matrix (chromium, firefox, webkit) under the unchanged `e2e-tests` id and CI OK gate, and the audit sweep's timeout grows by 30 s per sitemap page from today's 180 s.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-11-23T22:00:19Z
- **Completed:** 2026-11-23T22:05:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `jobs.e2e-tests` gains `strategy: { fail-fast: false, matrix: { project: [chromium, firefox, webkit] } }`. The run step is `npx playwright test --project="$PW_PROJECT" --fail-on-flaky-tests` with `PW_PROJECT: ${{ matrix.project }}` in `env:`. The report uploads as `playwright-report-${{ matrix.project }}`. The job name stays literal, and `needs`, `if:`, `timeout-minutes: 60`, `permissions`, the container and all steps are unchanged. A new comment block explains D-25, fail-fast and the aggregate result.
- `e2e/audit.spec.ts`: there is a new top-level `AUDIT_SWEEP_PAGE_MS = 30_000` with a doc comment, and the sweep calls `test.setTimeout(60_000 + AUDIT_SWEEP.length * AUDIT_SWEEP_PAGE_MS)`. The describe's doc comment now says the region and new photo pages join through the sitemap. The per-template test keeps its own `test.setTimeout(180000)`.
- `scripts/ci/ci-ok.jq`, `check-ci-gate.mjs` and `visual-baselines.yml` are untouched. `guard:ci`, `guard:selftest` (293/293), `guard:parity` and the full `npm run lint` all pass.

## Task Commits

1. **Task 1: E2E Tests as an engine matrix** - `13ff26a` (ci)
2. **Task 2: Audit sweep timeout scales with AUDIT_SWEEP** - `f0aeb69` (test)

## Files Created/Modified

- `.github/workflows/ci.yml` - the e2e-tests job as an engine matrix, with PW_PROJECT env and per-leg artifacts
- `e2e/audit.spec.ts` - the AUDIT_SWEEP_PAGE_MS constant and the scaled sweep timeout

## Decisions Made

None beyond the plan. The constants and names follow the plan text exactly.

## Deviations from Plan

None. The plan ran as written.

Minor note: Task 1's commit uses the `ci(17-02)` type rather than `chore`. The repo already has 12 earlier `ci(...)` commits, so this matches its history.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None. No external service needs configuring.

## Next Phase Readiness

- The matrix is in place before 17-10 adds routes. 17-15 records each leg's duration on the phase CI run (D-25/D-27). Until then, no CI run has exercised the matrix.
- `playwright.config.ts` still has a comment on the webkit project that says "CI runs it with chromium and firefox". That file is outside this plan, so the comment was left as it is. Its claim (every engine runs under --fail-on-flaky-tests) still holds per leg.

## Self-Check: PASSED

- FOUND: .github/workflows/ci.yml (fail-fast: false x1, playwright-report- x1)
- FOUND: e2e/audit.spec.ts (AUDIT_SWEEP.length x2, AUDIT_SWEEP_PAGE_MS = 30_000 x1)
- FOUND: 13ff26a, f0aeb69 on HEAD; ci-ok.jq e2e-tests count 1; snapshot-commit --none OK after each commit

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-23*
