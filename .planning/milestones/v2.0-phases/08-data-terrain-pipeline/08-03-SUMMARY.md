---
phase: 08-data-terrain-pipeline
plan: 03
subsystem: data
tags: [zod, typescript, jest, data-contract, cli-x, trail-grade]

requires:
  - phase: 07
    provides: "v1 ProjectHighlights component and the clix-cli / clix-website project pages (unchanged consumers)"
provides:
  - "data/schemas/project.ts: HighlightBlock union (metrics, risk-scale, pricing, list, stack), DemoCommandSchema (riskLevel + riskScore required), ProjectSchema discriminated on slug"
  - "lib/legacy-highlights.ts: toLegacyHighlights adapter, byte-identical to the HEAD highlights literal (temporary; Phase 11 deletes it)"
  - "lib/trail-grade.ts: RISK_BANDS (grade + marker per band), bandFor, isScoreInLevel (zero imports)"
  - "data/projects.ts: typed highlight tuples and Tim's real CLI_X riskScores on all four demo commands"
affects: [phase-11-case-studies, trail-grade-scale, 08-05-visual-ci-checkpoint]

actuals:
  tokens: 7594
  tasks: 3
  commits: 4
plan_head_before: d4b4f675bea7c922bdd70624aada187903c21c3f
plan_head_after: 8a805c43bd334881f229a467016ce9576b0680db

tech-stack:
  added: []
  patterns:
    - "Per-project zod discriminated union with fixed highlight-block tuples; tuple order is render order"
    - "Legacy adapter keeps an unchanged v1 component byte-identical, pinned by an order-sensitive HEAD fixture"
    - "Zero-import leaf module (lib/trail-grade.ts) for band logic shared by tests and future client components"

key-files:
  created:
    - data/schemas/project.ts
    - lib/legacy-highlights.ts
    - lib/trail-grade.ts
    - lib/__tests__/trail-grade.test.ts
    - data/__tests__/projects.test.ts
    - data/__tests__/fixtures/legacy-highlights.json
  modified:
    - data/projects.ts
    - data/types.ts
    - app/(site)/projects/[slug]/page.tsx

key-decisions:
  - "Band rule confirmed by Tim at the 08-03 checkpoint: low [0.0, 0.3), medium [0.3, 0.6), high [0.6, 0.8), critical [0.8, 1.0] (0.3 is medium, 1.0 is critical)"
  - "Trail-grade mapping confirmed by Tim: low T1 yellow, medium T2–T3 white-red-white, high T4–T5 white-blue-white, critical T6 unmarked"
  - "CLI_X riskScores are Tim's verbatim (0.05, 0.15, 0.29, 0.87); levels derived from the confirmed band rule because his reply gave scores only, so pkill -f chrome moves high -> critical"
  - "ClixWebsite carries demoCommands: z.never().optional() so the shared ProjectDetailClient type-checks while a website demoCommands array still fails to parse"

patterns-established:
  - "Facts reported by a human (scores) are pinned by a test that lists them verbatim next to the command they belong to"

requirements-completed: [DATA-07]

coverage:
  - id: D1
    description: "Project highlights typed per project (ProjectSchema discriminated union, block tuples) with the clix pages fed byte-identical legacy data"
    requirement: "DATA-07"
    verification:
      - kind: unit
        ref: "data/__tests__/projects.test.ts#toLegacyHighlights reproduces the HEAD highlights literal, key order included"
        status: pass
      - kind: unit
        ref: "data/__tests__/projects.test.ts#ProjectSchema"
        status: pass
      - kind: e2e
        ref: "npx playwright test e2e/projects.spec.ts --project=chromium (7 passed)"
        status: pass
      - kind: other
        ref: "node scripts/guards/same-classnames.mjs HEAD"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every CLI_X demo command carries a required riskLevel and Tim's real riskScore, inside its band"
    requirement: "DATA-07"
    verification:
      - kind: unit
        ref: "data/__tests__/projects.test.ts#CLI_X demo command risk (D-22)"
        status: pass
    human_judgment: false
  - id: D3
    description: "lib/trail-grade.ts: RISK_BANDS contiguous over [0, 1] with Tim's grades, bandFor boundary rule, isScoreInLevel"
    requirement: "DATA-07"
    verification:
      - kind: unit
        ref: "lib/__tests__/trail-grade.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "clix-cli terminal badge for 'kill all Chrome processes' now reads CRITICAL RISK instead of HIGH RISK"
    requirement: "DATA-07"
    verification: []
    human_judgment: true
    rationale: "Visible copy change on /projects/clix-cli; whether the visual baseline captures it, and whether the unchanged 'High-risk operation' explanation should be reworded, needs Tim at 08-05's visual/CI checkpoint"

duration: 19min
completed: 2026-10-24
status: complete
---

# Phase 08 Plan 03: Typed Project Highlights and CLI_X riskScores Summary

**Per-project zod schema with typed highlight-block tuples behind a byte-identical legacy adapter, plus `lib/trail-grade.ts` and Tim's real CLI_X riskScores (0.05, 0.15, 0.29, 0.87) required on every demo command.**

## Performance

- **Duration:** 19 min of executor time (checkpoint wait for Tim's reply not counted)
- **Started:** 2026-10-24T14:32:33Z
- **Completed:** 2026-10-24T14:52:23Z
- **Tasks:** 3 (Task 1 tracer, Task 2 human-action checkpoint, Task 3 auto/TDD)
- **Files modified:** 9

## Accomplishments

- `data/projects.ts` parses against `ProjectSchema`, a discriminated union on `slug` (`clix-cli`, `clix-website`), with each project's highlights a fixed tuple of typed blocks.
- `toLegacyHighlights` reproduces the HEAD highlights literal for both projects, key order included, so `components/ProjectHighlights.tsx` (untouched) renders the same output.
- `lib/trail-grade.ts` (zero imports) gives `RISK_BANDS` with Tim's confirmed grades and markers, `bandFor` with his confirmed boundary rule, and `isScoreInLevel`.
- All four CLI_X demo commands carry Tim's riskScore. `riskLevel` and `riskScore` are now required by both the schema and the `DemoCommand` type.

## Task 2 checkpoint: Tim's reply (verbatim)

    1. 0.05 2. 0.15 3. 0.29 4. 0.87 both ok

How to read it (this is what the checkpoint asked):
- Items 1–4 are the riskScores for the four demo commands in `data/projects.ts` order: (1) `find . -name "*.py" -size +1M -ls`, (2) `df -h`, (3) `tar -czf documents_backup_$(date +%Y%m%d).tar.gz ~/Documents/`, (4) `pkill -f chrome`.
- "both ok" confirms (a) the band boundaries low [0.0, 0.3), medium [0.3, 0.6), high [0.6, 0.8), critical [0.8, 1.0] (0.3 is medium, 1.0 is critical) and (b) the trail-grade mapping low = T1 yellow, medium = T2–T3 white-red-white, high = T4–T5 white-blue-white, critical = T6 unmarked.
- **Levels were derived, not reported.** Tim's reply gave scores only, not the risk level CLI_X printed. Each `riskLevel` is the band his confirmed rule puts the score in: 0.05 is low, 0.15 is low, 0.29 is low, 0.87 is critical.

| # | Command | riskScore (verbatim) | riskLevel (derived) | Before |
|---|---------|----------------------|---------------------|--------|
| 1 | `find . -name "*.py" -size +1M -ls` | 0.05 | low | low |
| 2 | `df -h` | 0.15 | low | low |
| 3 | `tar -czf documents_backup_$(date +%Y%m%d).tar.gz ~/Documents/` | 0.29 | low | low |
| 4 | `pkill -f chrome` | 0.87 | critical | high |

## Level changes vs. current site

- **`pkill -f chrome` ("kill all Chrome processes") changes from riskLevel `high` to `critical`.** On /projects/clix-cli the CLI_X terminal badge for this command changes from `HIGH RISK` to `CRITICAL RISK`. `components/HologramTerminalDemo.tsx` already maps `critical` to the same `text-danger border-danger` classes as `high`, and its warning box treats `critical` and `high` alike. So the badge colour and warning style stay the same; only the badge text changes (and gets slightly wider). No new UI styling was needed or added.
- This is an expected, visible change on the clix-cli page and is **not** a zero-visual-change violation for the highlights adapter, which stays byte-identical. Review it at 08-05's visual/CI checkpoint.
- **Copy to review at 08-05:** this command's `explanation` still reads "High-risk operation - requires explicit confirmation" and now sits next to a CRITICAL RISK badge. I left it unchanged because rewording site copy is Tim's call. Changing "High-risk" to "Critical-risk" would be a one-line data edit.
- The plan's own checks did not catch the badge change. same-classnames: OK, and `e2e/projects.spec.ts`: 7 passed. `e2e/visual/routes.spec.ts` snapshots `/projects/clix-cli`. Whether its baseline frame shows command 4's badge depends on where the terminal animation sits when the shot is taken. That was not run locally because baselines are produced in CI; 08-05 covers it.

## For Phase 11

- Tim did not supply the optional Medium and Critical demo examples (input, output, riskScore, warning, explanation). None were invented. `demoCommands` holds only the four existing commands. The CLI_X set now has no medium example; its one critical example is `pkill -f chrome`.
- The grade/marker mapping in `RISK_BANDS` is Tim-confirmed and ready for the trail-grade scale. The marker colour tokens are still Phase 11 work.

## Task Commits

1. **Task 1 (tracer), RED:** typed highlight blocks, HEAD fixture, failing tests - `afb400e` (test)
2. **Task 1 (tracer), GREEN:** data rewritten as typed block tuples, page fed by the legacy adapter - `63be08d` (refactor)
3. **Task 2:** checkpoint:human-action, resolved by Tim's reply above (no commit)
4. **Task 3, RED:** failing trail-grade and riskScore tests, plus the interface stub - `be0ea0b` (test)
5. **Task 3, GREEN:** riskScore on every CLI_X demo command (D-22) - `8a805c4` (feat)

## TDD Evidence

- **Task 1 RED:** `.git/gsd-red/08-03-red.json`, verdict RED_EVIDENCE_OK (recorded by the previous executor). Target: `ProjectSchema > both projects parse against ProjectSchema`. It failed with a ZodError ("expected tuple") because `data/projects.ts` still held the v1 Record literal.
- **Task 3 RED:** `.git/gsd-red/08-03-t3-red.json`, verdict RED_EVIDENCE_OK (TAP via the out-of-repo scratchpad reporter: 29 tests, 9 pass, 20 fail). Target: `CLI_X demo command risk (D-22) > clix-cli demo commands carry the riskScores Tim reported`.
  - **Semantic assessment:** the target ran and failed on its planned `toEqual`: every riskScore was undefined and `pkill -f chrome` was still high. That is the intended reason. The trail-grade tests failed on assertions against the interface stub.
  - Two tests passed in RED, as guards: the out-of-range `isScoreInLevel` test (the stub returns false), and "riskScore outside [0, 1]" (rejected at the time by strictObject as an unknown key). After GREEN both pass for the right reason.
  - There were no load, syntax or fixture failures.
- **Task 3 GREEN:** 29/29 in the two target suites.

## Verification

Task 1 (recorded by the previous executor):
- `projects.test.ts`: 7/7.
- `npm run lint`: exit 0 (0 errors, 54 pre-existing warnings, none in touched files).
- type-check: exit 0.
- Full jest: 19 suites / 219 tests.
- same-classnames HEAD: OK.
- `npx playwright test e2e/projects.spec.ts --project=chromium`: 7 passed.
- `toLegacyHighlights` output deep-equals the HEAD fixture (key order included) for both slugs.
- `components/ProjectHighlights.tsx`: untouched.

Task 3 (this run, before the GREEN commit):
- `npx jest lib/__tests__/trail-grade.test.ts data/__tests__/projects.test.ts --silent`: 2 suites, 29 passed.
- `npm run lint`: exit 0 (0 errors, 54 warnings, the same pre-existing count, none in touched files).
- `npm run type-check`: exit 0.
- `npx jest --silent`: 20 suites, 241 tests passed.
- `node scripts/guards/same-classnames.mjs HEAD`: OK.
- `npx playwright test e2e/projects.spec.ts --project=chromium`: 7 passed.

Task 3 acceptance:
- `grep -c "riskScore:" data/projects.ts` prints 4: PASS.
- Every riskScore literal (0.05, 0.15, 0.29, 0.87) appears verbatim in Tim's quoted reply above: PASS.
- `grep -cE "^\s*import " lib/trail-grade.ts` prints 0: PASS.
- `grep -c "riskLevel?" data/types.ts` prints 0: PASS.

Plan-level:
- `npx jest data lib --silent`: 9 suites, 152 passed.
- lint and type-check: green.
- projects e2e: green.

## Files Created/Modified

- `data/schemas/project.ts`: block schemas, HighlightBlock, DemoCommandSchema (riskLevel and riskScore required), per-project schemas, ProjectSchema.
- `lib/legacy-highlights.ts`: toLegacyHighlights adapter for the unchanged ProjectHighlights.
- `lib/trail-grade.ts`: RISK_BANDS, bandFor, isScoreInLevel.
- `data/projects.ts`: typed highlight tuples, riskScores, and pkill moved to critical.
- `data/types.ts`: `Project` and `DemoCommand` as `z.infer` types via `import type`.
- `app/(site)/projects/[slug]/page.tsx`: passes `toLegacyHighlights(project.highlights)`.
- `data/__tests__/projects.test.ts` and `lib/__tests__/trail-grade.test.ts`: schema, adapter, band and score tests.
- `data/__tests__/fixtures/legacy-highlights.json`: HEAD highlights literal per slug.

## Decisions Made

- Riskscores copied exactly as Tim wrote them. Levels derived from the confirmed band rule, since his reply gave no separate levels.
- Optional Phase 11 Medium/Critical examples were not supplied and were not invented.
- `bandFor` throws a `RangeError` for scores outside [0, 1] and for NaN. `isScoreInLevel` returns false for them instead of throwing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `demoCommands: z.never().optional()` on ClixWebsite**
- **Found during:** Task 1.
- **Issue:** The plan's interfaces block gave ClixWebsite no `demoCommands` key. On the inferred union, `project.demoCommands` in the shared `components/ProjectDetailClient.tsx` would then not type-check.
- **Fix:** Added `demoCommands: z.never().optional()`. A website object with a demoCommands array still fails to parse.
- **Files modified:** data/schemas/project.ts.
- **Verification:** the test "clix-website with demoCommands fails" passes, and type-check exits 0.
- **Committed in:** 63be08d.

**2. [Rule 3 - Blocking] Interface stub for `lib/trail-grade.ts` in the Task 3 RED commit**
- **Found during:** Task 3 RED.
- **Issue:** A test file that imports a module that does not exist fails at load. That would be INVALID_RED, not an assertion failure.
- **Fix:** The RED commit carried a typed stub (empty RISK_BANDS, a `bandFor` that throws, an `isScoreInLevel` that returns false). The GREEN commit replaced it.
- **Files modified:** lib/trail-grade.ts.
- **Verification:** the RED record classified RED_EVIDENCE_OK. GREEN: 29/29.
- **Committed in:** be0ea0b (stub), 8a805c4 (implementation).

---

**Total deviations:** 2 auto-fixed (2 blocking).
**Impact on plan:** Both were needed to keep the type contract and the TDD evidence valid. No scope creep.

## Issues Encountered

- Prettier reports pre-existing style issues in `data/projects.ts` and `data/schemas/project.ts`; their HEAD versions also fail `prettier --check`. Prettier is not enforced in CI. Only the new `lib/trail-grade.ts` was formatted.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Phase 11 can read the typed blocks and `lib/trail-grade.ts` directly. `lib/legacy-highlights.ts` is deleted there.
- 08-05 visual/CI checkpoint:
  - Confirm the `HIGH RISK` to `CRITICAL RISK` badge change on /projects/clix-cli, including whether any baseline frame captures it.
  - Decide whether command 4's "High-risk operation" explanation should be reworded.

## Self-Check: PASSED

- Files exist: data/schemas/project.ts, lib/legacy-highlights.ts, lib/trail-grade.ts, lib/__tests__/trail-grade.test.ts, data/__tests__/projects.test.ts, data/__tests__/fixtures/legacy-highlights.json.
- Commits on this branch: afb400e, 63be08d, be0ea0b and 8a805c4 (ledger d4b4f67..HEAD = 4).

---
*Phase: 08-data-terrain-pipeline*
*Completed: 2026-10-24*
