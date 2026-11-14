---
phase: 15-region-plate-data-model
plan: 13
subsystem: infra
tags: [ci-gate, guards, github-actions, pull_request_target, selftest, safecanvas]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "check-ci-gate.mjs rules 1-16, the skip-marker relay, 13-REVIEW IN-01..03"
  - phase: 15-region-plate-data-model
    provides: "15-12 selftest at 250/250 and the shared scripts/README.md"
provides:
  - "ci-gate rule 17: no ${{ in a with: value of any non-checkout uses: step or reusable-workflow job in the relay (findExpressionInputs)"
  - "ci-gate rule 18: no ${{ in a job name: outside ci.yml except the relay's needs-based CI OK shape (findExpressionNamesOutsideCi)"
  - "selftest helpers tempExtraWorkflow, namedJobWorkflow, relayActionStep, RELAY_STEPS"
  - "an honest SafeCanvas 07 WR-07 comment"
affects: [ci-skip-relay.yml edits, check-ci-gate.mjs, guard selftest, SafeCanvas]

actuals:
  tokens: 3630
  tasks: 3
  commits: 3
plan_head_before: 9fa3c86bc3db9f53bf7516cc85dad828f683add1
plan_head_after: 61ea7ed37a72efba1dff27e025f986686fc9e151

tech-stack:
  added: []
  patterns:
    - "Relay value scans read structure from comment-stripped lines and values from raw lines, so a '#' inside a block scalar never hides an expression (rule 12 and now rule 17)"

key-files:
  created: []
  modified:
    - scripts/guards/check-ci-gate.mjs
    - scripts/guards/selftest.mjs
    - scripts/README.md
    - components/SafeCanvas.tsx

key-decisions:
  - "Rule 17 also covers a job-level uses: (reusable workflow) with: block, not only step uses:, since its inputs are substituted the same way"
  - "Rule 18 follows the plan literally (skip only the allowed pair in the isNeedsNameExpression shape), so the relay-without-needs selftest case now reports both rule 5 and rule 18; that case asserts no failure count, so it stays green"

patterns-established:
  - "keyLine(line): a mapping key with its own column after a '- ' list marker, for step-scoped YAML scans"

requirements-completed: [GUARD-10]

coverage:
  - id: D1
    description: "Rule 17: an expression in a relay action input fails the gate; literal inputs pass; real workflows stay green and unedited"
    requirement: GUARD-10
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#ci-gate: rule 17: a relay action step with an expression in with: fails (13 IN-02)"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#ci-gate: rule 17: a relay action step with literal with: values passes"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#ci-gate: a relay with: block scalar holding ${{ on a \"#\" line fails rule 17 (raw lines)"
        status: pass
      - kind: other
        ref: "npm run guard:ci (ci-gate: OK on the real .github/workflows)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Rule 18: an expression job name outside ci.yml fails unless it is the relay's needs-based CI OK expression"
    requirement: GUARD-10
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#ci-gate: rule 18: an expression job name in another workflow fails (13 IN-03)"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#ci-gate: rule 18: the relay's needs-based name expression passes"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#ci-gate: a literal job name in another workflow passes rule 18"
        status: pass
    human_judgment: false
  - id: D3
    description: "SafeCanvas comment no longer claims the no-WebGL fallback is silent; log, filter and onError unchanged"
    requirement: GUARD-10
    verification:
      - kind: unit
        ref: "components/__tests__/SafeCanvas.test.tsx (10/10)"
        status: pass
      - kind: other
        ref: "git show 61ea7ed: only components/SafeCanvas.tsx, only // lines changed"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-11-14
status: complete
---

# Phase 15 Plan 13: ci-gate Rules 17-18 and the SafeCanvas Comment Summary

**ci-gate rule 17 fails a `${{` in any relay action `with:` input (block scalars included), rule 18 fails an expression job name outside `ci.yml` unless it is the relay's needs-based `CI OK` shape, and the SafeCanvas comment now says Next still logs the no-WebGL error**

## Performance

- **Duration:** about 8 min of execution (timed from the ledger start)
- **Started:** 2026-11-14T22:25:11Z
- **Completed:** 2026-11-14T22:32:52Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- 13 IN-02 closed: `findExpressionInputs(lines, raw)` in `check-ci-gate.mjs` finds the mapping that holds each non-checkout `uses:` (a step, or a reusable-workflow job), then its `with:` block. It fails `expression in an action input (line <n>: <key>); a pull_request_target relay passes event fields through env:, never through with:` on any raw line with `${{`. It also catches an inline flow `with: { ... }` and a `with:` written before `uses:`.
- 13 IN-03 closed: `findExpressionNamesOutsideCi(workflows, CI_OK_ELSEWHERE_ALLOWED)` fails `expression job name outside ci.yml: <rel> (job <id>); only the relay's needs-based CI OK name expression is allowed`. `isNeedsNameExpression` is reused as the allowed shape.
- Selftest went from 250 to 256 cases: two `rule 17:` rows, two `rule 18:` rows, a block-scalar rule 17 row and a literal-name rule 18 control row. Two `rule 17:` and two `rule 18:` names keep the plan's `grep -c` checks at exactly 2.
- 13 IN-01 closed: comment-only change in `SafeCanvas.tsx`. The `isWebGLUnavailable` condition, `console.error('[SafeCanvas]', error)` and `onError` are byte-identical.

## Task Commits

1. **Task 1: rule 17 (tracer)** - `de025fa` (feat)
2. **Task 2: rule 18** - `40a4e9e` (feat)
3. **Task 3: SafeCanvas comment** - `61ea7ed` (docs)

Tracer gate: auto mode off, `human_verify_mode` end-of-phase, automated-only verify. The verify was re-run after the Task 1 commit (guard:ci OK, selftest 253/253) before expanding.

## Files Created/Modified
- `scripts/guards/check-ci-gate.mjs`: header rules 17 and 18; `keyLine`, `findExpressionInputs`, `findExpressionNamesOutsideCi`; the rule 17 call inside `checkRelay` and the rule 18 loop after rule 5
- `scripts/guards/selftest.mjs`: `RELAY_STEPS`, `relayActionStep`, `tempExtraWorkflow`, `namedJobWorkflow`; six new `ciGateCase` rows in `CI_GATE_PARSER_CASES`
- `scripts/README.md`: rule-table rows "relay: no expression in `with:`" (13 IN-02) and "expression names" (13 IN-03)
- `components/SafeCanvas.tsx`: the 07 WR-07 comment

## Verification
- `npm run guard:ci`: `ci-gate: OK` on the real workflows; `git diff --quiet HEAD -- .github/workflows` exits 0
- `npm run guard:selftest`: 256/256; `^PASS ci-gate: rule 17` = 2, `^PASS ci-gate: rule 18` = 2
- `grep -c "^ \*  17\. "` = 1, `grep -c "^ \*  18\. "` = 1, `13 IN-02` = 1 and `13 IN-03` = 1 in the README
- `npx jest components/__tests__/SafeCanvas.test.tsx`: 10/10; `stays silent` = 0; the WR-07 log grep = 1
- Task 3 commit touches only `components/SafeCanvas.tsx`, and only `//` lines changed
- `npm run lint` and `npm run type-check` exit 0
- Ad-hoc scratch roots (not committed) also confirmed: flow-form `with: { script: "${{ ... }}" }` fails, `with:` before `uses:` with an expression only in `env:` passes, and a reusable-workflow job's `with:` expression fails

## Decisions Made
- Rule 17 also covers a job-level `uses:`, because a reusable workflow's `with:` inputs are substituted before it runs too.
- Rule 18 follows the plan literally. The existing "relay name expression on a job without needs" case now reports rule 5 and rule 18 for the same job. That case asserts no failure count, so it stays green.

## Deviations from Plan

### Additions beyond the plan
**1. [Rule 2 - Missing Critical] Two extra selftest rows**
- **Found during:** Tasks 1 and 2
- **Issue:** the plan's rows did not prove the raw-line reading ("a value continued over lines") or a non-relay literal-name control.
- **Fix:** added `a relay with: block scalar holding ${{ on a "#" line fails rule 17 (raw lines)` and `a literal job name in another workflow passes rule 18`. Neither name starts with `rule 17:` or `rule 18:`, so the plan's `grep -c` checks stay at 2.
- **Committed in:** `de025fa`, `40a4e9e`

**Total deviations:** 1 (test-coverage addition). **Impact:** no scope creep. No existing rule was weakened and no workflow was edited.

## Issues Encountered
- `npx prettier --check` flags both guard files, but the HEAD versions fail it too: a pre-existing style state that lint does not enforce. Left alone.

## Known Stubs
None.

## User Setup Required
None. No external service configuration required.

## Next Phase Readiness
- Ready for 15-14. The 13-REVIEW-DISPOSITION write-back for IN-01..03 is not in this plan's files. It belongs to whichever plan records the D-28 dispositions.

---
*Phase: 15-region-plate-data-model*
*Completed: 2026-11-14*

## Self-Check: PASSED
