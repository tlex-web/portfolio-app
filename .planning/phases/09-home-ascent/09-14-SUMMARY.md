---
phase: 09-home-ascent
plan: 14
subsystem: testing
tags: [ci, visual-regression, playwright, frame-budget, home-08, test-count, gh]

# Dependency graph
requires:
  - phase: 09-home-ascent (09-13)
    provides: "Tim's HOME-08 gate (total-keep) and frame-budget policy (B1); the HOME-08 CI measurement (LCP 3,112 ms, totalJsTransferBytes 444,761 B)"
  - phase: 09-home-ascent (09-11)
    provides: "budgetMeasureOnly flag (option A) on the desktop-size 3D e2e"
provides:
  - "B1 frame-budget policy: the ten 412 x 839 3D e2e and the HOME-08 perf contexts opt into budgetMeasureOnly; the verdict and forced-decline tests keep the real 50 ms budget"
  - "Jest policy guard lib/__tests__/frame-budget-policy.test.ts (13 tests) that classifies every home-canvas test as measure-only or real budget"
  - "Tim's Home re-baseline commit 284f433 (3 modified reduced, 9 added ascent-{start,waypoint-2,summit}, 9 deleted scroll-*)"
  - "CI green on 284f433 twice (run 40193992531, attempts 1 and 2)"
  - "Test-count ratchet at Phase 9 close: jest 646, e2e 186, total 832"
affects: [09-gap-plan, phase-10-photos, phase-12-docs]

# Actuals (#2632)
actuals:
  tokens: 9500     # chars/4 over the non-PNG diff fb96a4d..HEAD (20,452), deferred-items (2,321) and this SUMMARY (~15,000)
  tasks: 3
  commits: 4       # git rev-list --count fb96a4d..02cfdd7, measured before this SUMMARY's own commit
plan_head_before: fb96a4d3673bca684f6302009a8ff752fe794f2d
plan_head_after: 02cfdd790277d7296668ae0882403cea0b50282e

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A Jest guard reads the e2e spec source and classifies each test as measure-only or real budget, so a new 3D e2e cannot silently skip the policy"
    - "expect3dAfterVerdict: wait up to 10 s for a frame-budget verdict mark, then assert data-ascent-mode is still '3d'"
    - "Perf contexts set window.__ascentBudgetMeasureOnly with context.addInitScript before newPage()"

key-files:
  created:
    - lib/__tests__/frame-budget-policy.test.ts
    - e2e/visual/routes.spec.ts-snapshots/home/{375,768,1440}-ascent-{start,waypoint-2,summit}-visual-dark-linux.png (Tim)
  modified:
    - e2e/home-canvas.spec.ts
    - e2e/perf/home-baseline.spec.ts
    - e2e/helpers/webgl.ts
    - components/home/terrain/CameraRig.tsx (comments only)
    - e2e/visual/routes.spec.ts-snapshots/home/{375,768,1440}-reduced-visual-dark-linux.png (Tim)
    - scripts/guards/test-count.baseline.json
    - .planning/phases/09-home-ascent/deferred-items.md

key-decisions:
  - "Frame budget under automation is B1 (Tim, 09-13): budgetMeasureOnly on the ten 412 x 839 3D tests and the perf contexts; both 'records the frame-budget verdict' tests and 'a slow device declines to the poster' keep the real budget; FRAME_BUDGET_DEFAULTS.maxMedianMs stays 50; visitors unchanged"
  - "HOME-08 is MET under Tim's total-keep gate: totalJsTransferBytes 444,761 <= 468,770 B and LCP 3,112 <= 4,692 ms (09-13 CI measurement)"
  - "Home baselines committed as-is (Tim: \"Add to the gap plan (Recommended)\"); the 768 waypoint-2 label and the 375 kicker orphan join the plaque overlaps in the gap plan after 09-14"
  - "'context loss falls back to the poster' at 412 keeps the real budget: it was not in Tim's list of 10 and passed on CI"

patterns-established:
  - "Phase-close ratchet: test-count.mjs --update on the commit Tim's baselines land on"

requirements-completed: [HOME-01, HOME-02, HOME-05, HOME-08]

coverage:
  - id: D1
    description: "B1 frame-budget policy applied to the phone-size 3D e2e and the perf contexts, real budget kept on the verdict and forced-decline tests"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "lib/__tests__/frame-budget-policy.test.ts (13/13)"
        status: pass
      - kind: e2e
        ref: "npx playwright test e2e/home-canvas.spec.ts e2e/home-modes.spec.ts e2e/home-ascent.spec.ts --project=chromium --workers=1 (67/67)"
        status: pass
      - kind: e2e
        ref: "https://github.com/tlex-web/portfolio-app/actions/runs/40193992531 E2E Tests (attempts 1 and 2)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Tim's Home re-baseline commit touches only home/ (3 M, 9 A, 9 D) and CI is green and deterministic on it"
    requirement: HOME-01
    verification:
      - kind: other
        ref: "node scripts/ci/check-snapshot-commit.mjs --sha 284f433 --some --allow home --allow-deletions (snapshot-commit: OK (21 changed))"
        status: pass
      - kind: automated_ui
        ref: "check-visual-run.mjs --sha 284f433: job 121170798004 (attempt 1) and job 121172378589 (attempt 2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The committed Home baselines show the specified poster, pins, cards, rail and plaque at 375, 768 and 1440"
    requirement: HOME-05
    verification: []
    human_judgment: true
    rationale: "Tim committed the baselines with the reply \"pushed\" and sent the 768 label and 375 kicker to the gap plan; the faint 768 rail readout under the hero scrim and pin 4's dashed approx ring got no explicit answer, so the visual match to 09-UI-SPEC is not confirmed"
  - id: D4
    description: "HOME-08 verdict recorded under Tim's total-keep gate: met"
    requirement: HOME-08
    verification:
      - kind: other
        ref: "09-13 HOME-08 perf suite in mcr.microsoft.com/playwright:v1.64.0-noble (totalJsTransferBytes 444,761 B, LCP median 3,112 ms)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Test-count ratchet raised at Phase 9 close to jest 646 / e2e 186 / total 832"
    verification:
      - kind: other
        ref: "node scripts/guards/test-count.mjs --jest jest-results.json --update; node -e baseline check (ratchet 646 186 832)"
        status: pass
    human_judgment: false

# Metrics
duration: 40min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 14: Frame-Budget Policy, Home Re-baseline and Phase-Close Ratchet Summary

**Tim's B1 frame-budget policy is applied: the ten phone-size 3D e2e tests and the HOME-08 perf contexts measure the budget without declining, and a Jest guard enforces which tests opt in. Tim's Home re-baseline (284f433) passes CI twice. HOME-08 is met under his total-keep gate (444,761 B and 3,112 ms, against 468,770 B and 4,692 ms). The test-count ratchet rises from 533 to 832.**

## Performance

- **Duration:** about 40 min of executor time (two sessions around Tim's PNG commit)
- **Started:** 2026-10-25T12:15:09Z
- **Completed:** 2026-10-25T12:55:00Z
- **Tasks:** 3 (Task 2 is Tim's checkpoint)
- **Files modified:** 7 non-PNG files and 21 PNGs (Tim's commit)

## Accomplishments

- Applied B1. Phone-size 3D e2e no longer fails on SwiftShader's noisy frame budget, and the tests that are about the budget still run it for real.
- Tim reviewed and committed the Home baselines himself. CI is green on that commit (Visual, E2E, Unit, Lint and Type Check, Build, Security), and every job passes again on the one rerun.
- Recorded HOME-08 as met, using the 09-13 container numbers and Tim's gate.
- Locked the phase's tests into the ratchet: 646 Jest and 186 Playwright tests, 832 in total.

## Task Commits

1. **Task 1 (RED): failing guard for the B1 policy.** `a45d2c0` (test)
2. **Task 1 (GREEN): frame-budget policy per Tim's 09-13 decision (B1, D-18).** `db58194` (fix)
3. **Task 2 (Tim): re-baseline Home for the ascent.** `284f433` (test, Tim's commit; PNGs only)
4. **Task 3: raise the test-count ratchet at Phase 9 close.** `02cfdd7` (chore)

**Plan metadata:** this SUMMARY's docs commit, then the state and roadmap commit.

## Task 1: B1 Frame-Budget Policy

**Policy changes:**

- The ten 412 x 839 3D tests call `budgetMeasureOnly(page)`. Both summit tables (summit frame and plaque clearance) opt in on every row, so the conditional `measureOnly` field is gone.
- `expectBudgetOk` is replaced by `expect3dAfterVerdict`. It waits up to 10 s for a verdict mark, then asserts `data-ascent-mode` is `'3d'`. A page without a canvas cannot pass.
- The perf contexts run `context.addInitScript(...__ascentBudgetMeasureOnly = true)` before `newPage()`. A "3d" perf mode now means the stage stayed 3D, which resolves the 09-13 perf caveat.
- Both "records the frame-budget verdict" tests (412 x 839 and 1440 x 900) and "a slow device declines to the poster" keep the real budget. `FRAME_BUDGET_DEFAULTS.maxMedianMs` stays 50. `CameraRig.tsx` changed in comments only, so visitors see no change.

**RED (a45d2c0):** the Jest policy guard ran 11 failed and 2 passed out of 13. All 11 failures were on the planned assertions (flag false; perf flag absent). The 2 passes are the real-budget invariants, which already held. The first draft of the guard counted a conditional opt-in; it was tightened before the RED commit. This was a manual semantic check, because the tdd-red-evidence classifier has no adapter for Jest output.

**GREEN (db58194):**

| Check | Result |
|-------|--------|
| frame-budget-policy guard | 13/13 |
| Home e2e (home-canvas, home-modes, home-ascent; chromium, 1 worker) | 67/67 |
| Jest | 646 passed |
| lint plus guards, type-check | clean |
| guard:tests | 646 + 186 = 832 OK |

## HOME-08 Verdict (total-keep gate)

The measurement comes from 09-13, in mcr.microsoft.com/playwright:v1.64.0-noble with the Phase 7 profile. Tim chose the total-keep gate, and B1 changes nothing that is fetched.

| Measurement | Phase 7 baseline | Phase 9 CI median | Verdict |
|-------------|------------------|-------------------|---------|
| LCP | 4,692 ms | 3,112 ms | **PASS (gate)** |
| totalJsTransferBytes (after canvas ready) | 468,770 B | 444,761 B (24,009 B headroom) | **PASS (gate)** |
| initialJsTransferBytes | (vs 468,770 B) | 180,578 B | information |
| legacy jsTransferBytes (load + 3 s) | 468,770 B | 444,761 B | information |

**HOME-08 is MET.**

## Task 2: Home Re-baseline and CI

**CI runs:**

| Step | Run | Result |
|------|-----|--------|
| Push of db58194 to the new ci/09-14 (`ls-remote` was empty first) | [40192860600](https://github.com/tlex-web/portfolio-app/actions/runs/40192860600) | Lint, Unit, Build, Security and E2E succeeded. Visual failed 24 / passed 48, all on `home @{375,768,1440} reduced` and `home ascent {start,waypoint-2,summit} @{375,768,1440}` (expected) |
| Visual dispatch (suite=visual, update_mode=changed) | [40193370705](https://github.com/tlex-web/portfolio-app/actions/runs/40193370705) | success. 45 PNGs: 3 modified, 9 new, 33 identical; nothing changed outside home/ |
| CI on Tim's commit 284f433 (headBranch ci/09-14, headSha 284f433 verified), attempt 1 | [40193992531](https://github.com/tlex-web/portfolio-app/actions/runs/40193992531) | all green: Visual Regression (job 121170798004), E2E Tests (job 121170798129), Unit, Lint and Type Check, Build, Security; Dependency Review skipped (push event) |
| The one approved `gh run rerun 40193992531`, attempt 2 | [40193992531 attempt 2](https://github.com/tlex-web/portfolio-app/actions/runs/40193992531) | all green again: Visual Regression (job 121172378589), E2E Tests (job 121172378633), Unit, Lint and Type Check, Build, Security. **Deterministic.** |

**Verification of Tim's commit (re-run by this executor):**

- HEAD was 284f433, its parent is db58194, and the reflog shows it committed on top of db58194.
- `git ls-remote origin refs/heads/ci/09-14` printed 284f433.
- The commit touches only `e2e/visual/routes.spec.ts-snapshots/home/`: 3 M (reduced), 9 A (ascent-*), 9 D (scroll-*).
- `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some --allow home --allow-deletions` printed `snapshot-commit: OK (21 changed)` and exited 0.
- `check-visual-run.mjs --sha 284f433 --wait 30` passed for attempt 1 and for the rerun, and `--job "E2E Tests"` passed.

## Tim's Replies

**Task 2 resume.** Tim ran the add, rm, commit and push himself, then replied:

> **"pushed"**

He gave no further review notes and reported nothing "unexpected". This is recorded as his re-baseline confirmation.

**Review question.** The question was "At 768 px the waypoint-2 pin label hides behind the card (and at 375 the kicker orphans the "4"). How should these be handled?" Tim replied:

> **"Add to the gap plan (Recommended)"**

The option read: "Bundle with the plaque overlaps in the gap plan after 09-14; one more Home re-baseline covers all of them. Commit these baselines now as-is." Both items are now open entries in deferred-items.md, with this reply quoted.

## Unconfirmed Review Items

The review checklist asked Tim to confirm two things were intended. He gave no explicit answer, so they are **unconfirmed, not approved**:

- **ascent-start at 768:** the rail readout is faint under the hero scrim. This relates to the open deferred item on the hero scrim breakpoint (horizontal gradient at `lg:`, not 768 px).
- **Pin 4's dashed "approx." ring.**

The verifier or UAT should ask about both again.

## Task 3: Test-Count Ratchet

| | jest | e2e | total |
|-|------|-----|-------|
| Phase 9 start (88191d0, 2026-10-24) | 416 | 117 | 533 |
| Phase 9 close (284f433, 2026-10-25) | 646 | 186 | 832 |

- Ran `npx jest --json --outputFile=jest-results.json --silent`: 646 total, 646 passed, 0 pending, 0 todo.
- `node scripts/guards/test-count.mjs --jest jest-results.json` then reported `jest 646 + e2e 186 = 832 (baseline 533)` OK.
- `--update` wrote the new baseline, and the plan's node check printed `ratchet 646 186 832`.
- `jest-results.json` is gitignored (`/jest-results.json` in .gitignore), so it was not committed.

## Files Created/Modified

- `lib/__tests__/frame-budget-policy.test.ts` - Jest guard. It classifies each home-canvas test as measure-only or real budget and checks the perf contexts.
- `e2e/home-canvas.spec.ts` - the ten 412 x 839 3D tests opt in; the summit tables opt in on every row; `expect3dAfterVerdict`.
- `e2e/perf/home-baseline.spec.ts` - the perf contexts set `__ascentBudgetMeasureOnly` before the first page.
- `e2e/helpers/webgl.ts` - the `expect3dAfterVerdict` helper replaces `expectBudgetOk`.
- `components/home/terrain/CameraRig.tsx` - comments only.
- `e2e/visual/routes.spec.ts-snapshots/home/*` - Tim's commit.
- `scripts/guards/test-count.baseline.json` - the Phase 9 close ratchet.
- `.planning/phases/09-home-ascent/deferred-items.md` - two gap-plan entries (768 waypoint-2 label, 375 kicker orphan).

## Decisions Made

- B1 frame-budget policy and the HOME-08 total-keep verdict (Tim, 09-13), as above.
- The Home baselines were committed as-is. The 768 label and the 375 kicker go to the gap plan (Tim, 09-14).
- "context loss falls back to the poster" at 412 keeps the real budget. It was not in Tim's list of 10, and it passed on CI. In theory it is racy; if it ever flakes, it fits B1's rationale for opting in.

## Deviations from Plan

**1. [Tim's decision, B1] Task 1 implemented in the e2e layer instead of lib/ascent/frame-budget.ts**
- **Found during:** Task 1.
- **Issue:** The plan's branches were total-relax (`maxMedianMs: 66`) and total-webdriver (`shouldSampleFrameBudget`). In 09-13, Tim chose total-keep for HOME-08 and B1 for the frame budget, and B1 supersedes both code branches (09-13-SUMMARY).
- **Fix:** B1 extends the 09-11 measure-only flag in the e2e and perf specs. A Jest policy guard stands in for the plan's unit test, and product code is untouched apart from comments.
- **Files modified:** e2e/home-canvas.spec.ts, e2e/perf/home-baseline.spec.ts, e2e/helpers/webgl.ts, components/home/terrain/CameraRig.tsx (comments) and lib/__tests__/frame-budget-policy.test.ts. All are outside the plan's `files_modified`.
- **Verification:** the policy guard passes 13/13, the Home e2e pass 67/67, and CI E2E is green on attempts 1 and 2.
- **Committed in:** a45d2c0 (RED), db58194 (GREEN).

**2. [Rule 3 - Blocking] check-visual-run took `--sha 284f433` instead of `$(git rev-parse HEAD)` for the E2E and rerun checks**
- **Found during:** Task 2 step 5.
- **Issue:** The ratchet commit 02cfdd7 landed locally while CI ran, so HEAD no longer named Tim's commit.
- **Fix:** passed Tim's SHA explicitly. Same run, same jobs.
- **Committed in:** n/a (verification only).

---

**Total deviations:** 2 (1 superseded by Tim's decision, 1 blocking adjustment to a verification command)
**Impact on plan:** no scope creep. Product behaviour for visitors is unchanged.

## Issues Encountered

None. The push run's Visual failures were the expected pre-baseline home/* diffs.

## Known Stubs

None.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

All 14 Phase 9 plans have summaries. Phase 9 is ready for verification, with a gap plan already agreed with Tim (`/gsd-plan-phase 09 --gaps`). Its scope:

- **Summit plaque overlaps:** 3D pins behind the summit plaque at 375 x 667 (all four), 768 x 1024 (pin 3), 820 x 1180 (pins 1-3) and 1024 x 768 (pin 1 touches the plaque; pin 4 is under the rail scrim). The static poster's fixed pins sit under the plaque below 1280 px: 3 at 375, 2 at 412, and 1 each at 768 and 1024. Tim: "Gap plan after 09-14".
- **768 waypoint-2 pin label:** hidden behind the card in the static poster at 768 x 900; only a sliver shows at the card's right edge.
- **375 kicker orphan:** the "4" sits alone on the docked kicker's second line.
- **Re-baseline:** all three items need one more Home re-baseline from the CI container, which Tim commits as before.

These remain open alongside them: the unconfirmed 768 rail readout and pin-4 approx ring, the hero scrim breakpoint, the 2,760 m tick contrast at 768, and the summit wedge at 1440.

ci/09-14 stays at 284f433. The ratchet commit 02cfdd7 and this plan's docs commits are local on gsd/phase-09-home-ascent and have not been pushed.

## Self-Check: PASSED

- FOUND: lib/__tests__/frame-budget-policy.test.ts, scripts/guards/test-count.baseline.json (total 832), .planning/phases/09-home-ascent/deferred-items.md (two new entries)
- FOUND: a45d2c0, db58194, 284f433, 02cfdd7, all ancestors of HEAD
- check-snapshot-commit exit 0. CI 40193992531 is green on attempt 1 and attempt 2.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*
