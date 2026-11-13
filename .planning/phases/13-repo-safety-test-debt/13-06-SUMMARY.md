---
phase: 13-repo-safety-test-debt
plan: 06
subsystem: testing
tags: [review-ledger, triage, verify-07, type-check, jest, guard-10]

# Dependency graph
requires:
  - phase: 12-contact-edge-pages-cleanup-verification
    provides: the four archived v2.0 review-disposition ledgers (Phases 7, 9, 10, 12) with 44 rows at disposition open
provides:
  - 13-LEDGER-TRIAGE.md, the approved VERIFY-07 source of record (D-19), 44 rows with evidence, enum value, owner and Tim's decision
  - The measured 07 IN-08 basis (5482 errors in 103 files as-is, 69 in 21 with Jest globals declared)
  - GUARD-10 (Phase 15), a new requirement from the 07 IN-08 owner call
affects: [13-08, 13-09, 13-11, 13-13, 13-14, 13-18, 13-22, phase-14, phase-15, phase-17, phase-18]

# Actuals (#2632)
actuals:
  tokens: 10800    # chars/4 over the added lines of the four 13-06 commits (43,327 chars)
  tasks: 3
  commits: 19      # MEASURED: git rev-list --count plan_head_before..plan_head_after; 15 of these are 13-01/13-02 commits that landed on the branch during the Task 3 checkpoint; 13-06's own commits are 4
plan_head_before: 78ff21711f00c0fc03aaaef06ac4c1361684f36c
plan_head_after: 321e96f10e5b31a64ea8c6555dd82d7bc46fc202

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ledger triage table: one row per open finding, evidence checked against the tree, proposal mapped to the disposition enum, owner plan named, owner's decision in its own column"

key-files:
  created:
    - .planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md
  modified:
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md

key-decisions:
  - "Tim approved the 44-row ledger triage as proposed, with no overrides (2026-11-13)"
  - "07 WR-07 (SafeCanvas swallows errors): fix, owner 13-11 (log non-WebGL errors in componentDidCatch)"
  - "07 IN-08 (tests outside type-check): new requirement GUARD-10 in Phase 15; needs @types/jest (Tim vets it first) or @jest/globals imports"
  - "12 IN-08 (fieldless validation Retry): accept, since a real visitor cannot produce the fieldless case"
  - "No row moved into fix-now, so Unowned fix rows is none and 13-14 Task 3 has no catch-all rows from this triage"

patterns-established:
  - "Owner decisions are recorded verbatim with the date before any fix that depends on them starts (D-16)"

requirements-completed: [VERIFY-07]

coverage:
  - id: D1
    description: "13-LEDGER-TRIAGE.md lists all 44 open rows in ledger order with evidence, proposal, enum and owner, and Tim's approval is quoted verbatim with the date; every Tim cell reads approved"
    requirement: "VERIFY-07"
    verification:
      - kind: other
        ref: "13-06-PLAN Task 1 <automated> node check (prints 'triage rows: 44')"
        status: pass
      - kind: other
        ref: "scratchpad check-triage.cjs: 44 rows, 44 unique ids, 0 non-approved Tim cells, enum fixed 32 / deferred 9 / skipped 3, phases 07 23 / 09 6 / 10 10 / 12 5, Unowned fix rows none"
        status: pass
    human_judgment: false
  - id: D2
    description: "The 07 IN-08 owner call has a measured basis (two real tsc runs), and no temp tsconfig was left in the repo"
    requirement: "VERIFY-07"
    verification:
      - kind: other
        ref: "13-06-PLAN Task 2 <automated> node check (prints 'measured') and git status --porcelain -- tsconfig*.json (empty)"
        status: pass
    human_judgment: false
  - id: D3
    description: "GUARD-10 added to REQUIREMENTS.md (Repo Safety, traceability to Phase 15, coverage 39) and to Phase 15 in ROADMAP.md with success criterion 6"
    verification:
      - kind: other
        ref: "git grep -n GUARD-10 -- .planning/REQUIREMENTS.md .planning/ROADMAP.md (requirement line, traceability row, Phase 15 requirements, criterion 6)"
        status: pass
    human_judgment: false

# Metrics
duration: 36min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 06: Review-ledger triage (VERIFY-07) Summary

**All 44 open v2.0 review-ledger rows triaged against the current tree and approved by Tim: 10 already fixed, 22 fix-now rows assigned to 13-08/09/11/13/14, 9 handed to later phases or requirements (including the new GUARD-10 in Phase 15), 3 accepted with reasons**

## Performance

- **Duration:** 36 min wall clock (includes the Task 3 checkpoint wait, during which 13-01 and 13-02 ran)
- **Started:** 2026-11-13T09:59:26Z
- **Completed:** 2026-11-13T10:35:51Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- `13-LEDGER-TRIAGE.md` is the approved VERIFY-07 source of record (D-19): 44 rows numbered in ledger order (07 → 23, 09 → 6, 10 → 10, 12 → 5), each with evidence checked against HEAD `78ff217`, the proposal, the enum value, the owner and Tim's decision. Every "already fixed" row cites its commit.
- 07 IN-08 was measured, not guessed: 5482 errors in 103 files with the tests as they are (no Jest type declarations at all), 69 errors in 21 files once the Jest globals are declared. Both are over the 15-errors-in-5-files line, so the proposal and Tim's decision is a new requirement.
- Tim's reply is quoted verbatim and dated under `## Approval`. Approved totals: `fixed` 32 (10 already fixed, 22 fix now), `deferred` 9, `skipped` 3. Unowned fix rows: none.
- GUARD-10 now exists in REQUIREMENTS.md and in Phase 15 of the roadmap, so the 07 IN-08 ledger row has somewhere to point.

## Task Commits

1. **Task 1: Check all 44 rows against the tree and write the proposed table** - `7b861b4` (docs)
2. **Task 2: Measure 07 IN-08 (tests and e2e outside type-check)** - `41bb956` (docs)
3. **Task 3: Tim approves or overrides the triage table** - `c30e15f` (docs)
4. **Deviation: GUARD-10 added to REQUIREMENTS.md and ROADMAP.md** - `321e96f` (docs)

**Plan metadata:** the SUMMARY commit that follows `321e96f` (docs: complete plan)

## Files Created/Modified

- `.planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md` - the 44-row triage, owner calls, 07 IN-08 measurement, Unowned fix rows (none) and Tim's approval
- `.planning/REQUIREMENTS.md` - GUARD-10 in Repo Safety, traceability row to Phase 15, coverage 38 → 39, Phase 15 count 4 → 5
- `.planning/ROADMAP.md` - GUARD-10 in Phase 15's requirements and success criterion 6

## Decisions Made

Tim's reply, 2026-11-13: "approve — WR-07 fix, IN-08 GUARD-10, 12 IN-08 accept)"

- **approve:** all 41 non-owner-call rows stand as proposed, no overrides.
- **07 WR-07 (row 7): fix**, owner 13-11. 13-11 logs non-WebGL errors in `SafeCanvas.componentDidCatch` and must check that the new `console.error` does not fire on Home under the audit gate's console check.
- **07 IN-08 (row 14): GUARD-10**, Phase 15: "Tests, e2e specs and Playwright configs are type-checked by `npm run type-check` with zero errors." It needs Jest type declarations: `@types/jest` (a package install Tim vets first; his reply does not approve it) or `@jest/globals` imports. Phase 15's plan picks one.
- **12 IN-08 (row 40): accept**, because a real visitor cannot produce the fieldless `validation` answer.

## Deviations from Plan

### Orchestrator-authorized follow-through

**1. [Requirement follow-through] Added GUARD-10 to REQUIREMENTS.md and ROADMAP.md**
- **Found during:** Task 3 (Tim's 07 IN-08 call)
- **Issue:** Tim chose a new requirement for 07 IN-08. The ledger row points at GUARD-10, which did not exist in REQUIREMENTS.md or the roadmap. The plan only lists `13-LEDGER-TRIAGE.md` in `files_modified`.
- **Fix:** Added GUARD-10 in the Repo Safety (GUARD) section of REQUIREMENTS.md, a traceability row mapping it to Phase 15, and updated the coverage lines (38 → 39 total and mapped; Phase 15: 4 → 5). In ROADMAP.md, added GUARD-10 to Phase 15's requirements and one success criterion (6) citing the measurement and the declarations choice. Phase 15's goal and every other phase are unchanged. The orchestrator authorized this work and asked for its own commit.
- **Files modified:** .planning/REQUIREMENTS.md, .planning/ROADMAP.md
- **Verification:** `git grep -n GUARD-10` shows the requirement line, the traceability row, the Phase 15 requirements line and criterion 6; the traceability table has 39 rows.
- **Committed in:** `321e96f`

---

**Total deviations:** 1 (orchestrator-authorized requirement follow-through)
**Impact on plan:** Keeps the ledger's GUARD-10 pointer resolvable. No code changed, no package installed.

## Issues Encountered

- The plan commit ledger measures 19 commits from `plan_head_before`, but 15 of them belong to 13-01 and 13-02, which completed on this branch while Task 3 waited for Tim. 13-06's own commits are `7b861b4`, `41bb956`, `c30e15f`, `321e96f` (plus this SUMMARY commit). The `commits:` value is left as measured, with the breakdown in its comment.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The fix plans can start: 13-08 (07 IN-01, IN-03, IN-11, IN-17; 09 IN-03, IN-04, IN-07), 13-09 (10 IN-02, IN-06, IN-07, IN-09, IN-10), 13-11 (12 IN-09, IN-10 and 07 WR-07), 13-13 (07 WR-01, WR-02, WR-03, IN-06) and 13-14 (07 WR-04, IN-07, 12 IN-12). 13-14 Task 3 has no catch-all rows from this triage.
- 13-22 writes each row's final status back into the archived `*-REVIEW-DISPOSITION.md` files and points them at this triage.
- Phase 15 inherits GUARD-10, and with it the open choice between `@types/jest` (Tim vets the package) and `@jest/globals` imports.

## Self-Check: PASSED

- FOUND: .planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md
- FOUND: 7b861b4, 41bb956, c30e15f, 321e96f (all ancestors of HEAD)
- Plan Task 1 and Task 2 automated checks pass; no tsconfig file left in the repo
- Task 3 acceptance: reply quoted verbatim with the date, 44 of 44 Tim cells approved, Unowned fix rows reads none

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
