---
phase: 09-home-ascent
plan: 20
subsystem: ui
tags: [home, ascent, camera, three, summit, framing, playwright, jest, tdd]

requires:
  - phase: 09-home-ascent
    provides: "09-18 compact summit layout and summit-layout.ts (summitColumnBox); 09-19 framing.ts, StageGeometry and useAscent().geometry"
provides:
  - "lib/ascent/framing.ts: StageGeometry.plaque, TangentBounds, ViewKey, SUMMIT_FRAME_MARGIN_PX, summitClearRects, fitCluster, stageViewKeys, viewTrackAt (copied STAGE_FOV_DEG and NARROW_VIEW_OFFSET_X/Y_SHARE)"
  - "AscentController: the summit plaque column's box at the summit arrival in geometry.plaque, and subscribeGeometry(listener) on the ascent context"
  - "RouteCurves.poses (the key poses the curves run through)"
  - "CameraRig: narrow/wide from matchMedia('(min-width: 48rem)'); the summit key fitted to the measured plaque; view offset and FOV from one key track"
  - "route.ts without the seven share-based summit and view-offset helpers"
  - "e2e 'summit pins clear the plaque' at the eleven UAT sizes"
affects: [09-21 (3D pin labels on placePinLabel; wideStageOffsets is its hook), 09-22, UAT test 2, summit visual baselines]

actuals:
  tokens: 17174
  tasks: 3
  commits: 4
plan_head_before: 0e2601adbe88cd210f4ebf348b74a62f2d790f2e
plan_head_after: 8798b7130e0e70da8821e46bde2efd116c8ec2ca

tech-stack:
  added: []
  patterns:
    - "Closed-loop framing: measure the obstacle box with the layout, fit the projected cluster into a clear rectangle with a pinhole model, apply it as setViewOffset plus FOV"
    - "One key track for every per-stage projection knob (offset x, offset y, FOV), linear in the curve parameter, so plateaus hold and p = 0 stays at the plan view"
    - "Responsive switches in the canvas read the same media query as the CSS (matchMedia in a ref, change event invalidates), never the canvas width"

key-files:
  created: []
  modified:
    - lib/ascent/framing.ts
    - components/home/terrain/route-curve.ts
    - components/home/terrain/CameraRig.tsx
    - components/home/AscentController.tsx
    - lib/ascent/route.ts
    - lib/__tests__/framing.test.ts
    - lib/__tests__/ascent-route.test.ts
    - e2e/home-canvas.spec.ts
    - .planning/phases/09-home-ascent/09-UI-SPEC.md

key-decisions:
  - "Clear rectangles are inset 16 px from the stage edges as well as from the plaque and the rail zone, so a fitted pin box is always inside the stage"
  - "fitCluster floors F at 0.25 x maxFocalPx, so a degenerate rectangle cannot ask for a FOV near 180 degrees; with no rectangle it uses the whole stage"
  - "Before the first matchMedia read the rig falls back to the canvas width (one frame at most)"
  - "Task 2 is split into a RED test commit and a GREEN feat commit (the plan named one test commit) so the TDD gate has both"

patterns-established:
  - "Summit framing contract: geometry.plaque (stage px at the summit arrival) -> summitClearRects -> fitCluster -> stageViewKeys -> viewTrackAt(keys, t)"

requirements-completed: [HOME-02, HOME-05, HOME-06]

coverage:
  - id: D1
    description: "Every settled 3D pin at the summit is visible, inside the stage, left of the rail scrim and at least 8 px from the plaque column at the eleven UAT sizes (RED at 1024 x 768: pin 4 under the scrim)"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#summit pins clear the plaque (11 rows, chromium, all passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "On portrait md stages (768 x 1024, 820 x 1180) the summit frame uses the rectangle above the compact column, so every pin ends above the plaque (vertical offset)"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#summit pins clear the plaque at 768 x 1024 / 820 x 1180 (pin ends above the plaque)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/ascent-route.test.ts#on a portrait md stage (768 x 960) the summit frame takes the rectangle above the compact column"
        status: pass
    human_judgment: false
  - id: D3
    description: "fitCluster, summitClearRects, stageViewKeys, viewTrackAt rules; the key track ramps the narrow offsets exactly like reliefAt and the summit key only over the last leg"
    requirement: HOME-05
    verification:
      - kind: unit
        ref: "lib/__tests__/framing.test.ts (36 tests); lib/__tests__/ascent-route.test.ts (31 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Poster parity at p = 0, reveal hand-over, lit pins and the rest of the canvas spec unchanged; static summit and modes unchanged"
    requirement: HOME-06
    verification:
      - kind: e2e
        ref: "npx playwright test e2e/home-canvas.spec.ts --project=chromium (36 passed)"
        status: pass
      - kind: e2e
        ref: "npx playwright test e2e/home-ascent.spec.ts e2e/home-modes.spec.ts --project=chromium (77 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The summit frame reads well on a real phone and tablet: four pins above the compact plate, the fly-in over the last leg feels smooth"
    requirement: HOME-02
    verification: []
    human_judgment: true
    rationale: "The tests prove geometry under SwiftShader; whether the re-framed summit and the last-leg zoom look right is a visual judgement for UAT test 2 (3D half), and the summit visual baselines change"

duration: 17min
completed: 2026-10-25
status: complete
---

# Phase 09 Plan 20: Measured 3D summit framing (G-09-2, 3D half) Summary

**The summit camera now reads the measured plaque column. It takes the clear rectangle above or right of the column (16 px margin, rail zone excluded) that holds the four pins largest, caps the zoom at today's 60 / 75 degree summit FOV, and centres the pins there through `setViewOffset` and the FOV. View offset and FOV follow one key track (plan view, stages, summit). Narrow versus wide now follows `matchMedia('(min-width: 48rem)')`. At 1024 x 768, pin 4's right edge moved from 802.7 px (under the scrim, clear edge 790) to 557.4 px. All eleven UAT sizes pass.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-10-25T17:23:56Z
- **Completed:** 2026-10-25T17:41:21Z
- **Tasks:** 3 of 3
- **Files modified:** 9

## Accomplishments

- `framing.ts` (still import-free):
  - `summitClearRects` returns the clear rectangles above and right of the plaque. With no plaque it returns the whole stage less the rail zone. Empty rectangles are dropped.
  - `fitCluster` applies the plan's pinhole formulas, with a larger area breaking ties.
  - `stageViewKeys` builds n + 2 keys: the plan view at {0, 0, 40}, the narrow stages at 0.2 w / 0.2 h, the wide stages at their given offsets or 0, then the summit.
  - `viewTrackAt` interpolates linearly between keys and clamps t.
- AscentController measures `#summit [data-summit-plaque]` at the summit arrival in stage px (`geometry.plaque`). Every measurement calls the `subscribeGeometry` listeners.
- CameraRig:
  - It computes the cluster's tangent bounds once per route build, from a scratch camera at the summit key pose.
  - Each frame it does constant-size arithmetic over at most two rectangles and n + 2 keys (T-09-31). A geometry change only invalidates a frame.
  - `NARROW_STAGE_PX` is gone.
  - The plan-view branch is unchanged, and so is the 09-19 3D label rule. It moves to `placePinLabel` in 09-21.
- `route.ts` no longer exports `summitViewOffsetXAt`, `summitViewOffsetYAt`, `SUMMIT_VIEW_OFFSET_X_SHARE`, `SUMMIT_VIEW_OFFSET_Y_SHARE`, `viewOffsetAt`, `viewOffsetXAt` or `fovAt`. Their tests were rewritten for the key-track model, not deleted.
- UI-SPEC:
  - The Ascent Mapping turn-back line gains a sentence.
  - The Summit Section gains a row, "3D framing (G-09-2, measured, 09-20)".
  - The 09-18 forward note now points at that row.

## Tracer: 1024 x 768 before and after

Before (pre-change rig, new e2e checks):

```
[chromium] › e2e\home-canvas.spec.ts:640:11 › ... › summit pins clear the plaque › at 1024 x 768 @chromium-only
    Error: 3D pin 4 ends left of the rail scrim
    Expected: <= 791
    Received:    802.7000122070312
  1 failed
```

After (`3a8f228`): `6 passed` for `-g "summit"`. Pin 4 is at 533.4,238.9 with its right edge at 557.4 (the clear edge is 790.0), 310.1 px from the plaque. The tracer gate ran in interactive, end-of-phase mode with an automated-only verify. The re-run was green (6 passed, 0 `error TS`), and then the plan expanded.

## Eleven-size table (Chromium, SwiftShader, measure-only, #summit centred)

| Size | Rectangle | Smallest pin gap to the plaque | Rightmost pin edge / clear edge |
|---|---|---|---|
| 360 x 640 | above | 153.2 px (pin 3) | 256.0 / 350.0 |
| 375 x 667 | above | 165.4 | 266.4 / 365.0 |
| 375 x 553 | above | 108.4 | 266.4 / 365.0 |
| 390 x 844 | above | 252.7 | 276.9 / 380.0 |
| 412 x 839 | above | 248.3 | 292.2 / 402.0 |
| 768 x 1024 | above (all pins above the plaque top) | 326.7 | 391.4 / 534.0 |
| 778 x 1024 | above | 326.3 | 397.9 / 544.0 |
| 820 x 1180 | above (all pins above the plaque top) | 401.7 | 425.2 / 586.0 |
| 1024 x 768 | above | 182.9 | 557.4 / 790.0 |
| 1280 x 720 | right | 53.1 (pin 1) | 992.9 / 1046.0 |
| 1440 x 900 | right | 69.4 (pin 1) | 1136.6 / 1206.0 |

Before this plan, the 3D pins sat under the plaque or the scrim at 360 x 640, 375 x 667, 375 x 553, 768 x 1024, 778 x 1024, 820 x 1180 and 1024 x 768 (debug note, 14:25 and 14:35).

## Task Commits

1. **Task 1: Measured summit framing end-to-end (tracer)**: `3a8f228` (fix)
2. **Task 2: Framing unit tests; route.ts loses the share-based helpers (TDD)**: RED `3c806a1` (test), GREEN `bcdb0fe` (feat)
3. **Task 3: Eleven-size 3D summit table and UI-SPEC note**: `8798b71` (test)

**Plan metadata:** the docs commit that follows this SUMMARY

## TDD Gate Compliance

- **RED** (`3c806a1`):
  - The framing tests exercise Task 1's functions. All 17 new ones passed on first run, apart from one test defect: the zero-width cluster case used maxFocal 5000, so the 0.25 x maxFocal floor applied. The test was fixed to use 2000.
  - The RED target was the new ascent-route test `route.ts keeps none of the share-based summit or view-offset helpers (the measured framing replaced them)`.
  - The evidence came from a flat-TAP-13 Jest reporter in the session scratchpad. `check tdd-red-evidence` returned **RED_EVIDENCE_OK** (`target_test_failed`, format `tap`, no report errors). Of 67 tests, 66 passed and 1 failed.
  - **Semantic assessment:** the target executed and failed on its `toEqual([])` assertion, receiving the seven names route.ts still exported. There was no load, import, syntax or fixture fault, and no other test failed.
- **GREEN** (`bcdb0fe`): the seven exports and the private `summitShare` were removed. 67/67 pass.
- **REFACTOR:** none.
- **Jest totals:** 695 before the plan, 715 after (49 suites). The test-count guard reports jest 715 + e2e 232 = 947 against a baseline of 832, OK.

## Files Created/Modified

- `lib/ascent/framing.ts`: `plaque` in StageGeometry, and the summit framing section (types, constants, four functions).
- `components/home/AscentController.tsx`: `measurePlaque` and `subscribeGeometry` (a stable callback over a listener set). The doc comment is updated.
- `components/home/terrain/route-curve.ts`: `RouteCurves.poses`.
- `components/home/terrain/CameraRig.tsx`: `WIDE_MEDIA`, `summitTangentBounds`, the media and geometry effects, and the key-track frame code. The header comment is rewritten.
- `lib/ascent/route.ts`: the seven helpers are removed, and the comments on the kept constants and functions are updated.
- `lib/__tests__/framing.test.ts`: 17 new tests.
- `lib/__tests__/ascent-route.test.ts`: the seven share-based tests are rewritten as fitted-summit and key-track tests. Three are added: the copied shares, the removed exports, and the 768 x 960 above rectangle.
- `e2e/home-canvas.spec.ts`: `boxGap` and `PLAQUE_CLEARANCE_PX`. The clearance test now covers eleven rows with soft checks, per-pin and rectangle annotations, and the above assertion for portrait md. The unused `intersects` helper is removed.
- `.planning/phases/09-home-ascent/09-UI-SPEC.md`: the Ascent Mapping sentence and the Summit Section row.

## Decisions Made

- Each clear rectangle is inset 16 px from the stage edges as well, so "inside the stage" follows from the fit. The plan only named the plaque and the rail zone.
- `fitCluster` has a floor at 0.25 x maxFocalPx and falls back to the whole stage when no rectangle is left. Both are degenerate cases that none of the eleven sizes reaches.
- `wideStageOffsets` defaults to none. CameraRig passes nothing, which leaves a hook for 09-21.
- ui-ux-pro-max was loaded before the UI-SPEC note. The rules applied were breakpoint-consistency (the md query), content-priority and orientation-support (the pins stay in view above or beside the plaque in both orientations), and spacing-scale (16 px). The touch-target rules do not apply, because the pins take no pointer events.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - TDD gate] Task 2 split into RED and GREEN commits**
- **Found during:** Task 2
- **Issue:** the plan named one `test(09-20)` commit. The TDD gate needs a failing test commit before a `feat` commit. Task 1's functions already existed, so the RED target became the test that the seven exports are removed.
- **Fix:** `3c806a1` test (RED, classifier OK), then `bcdb0fe` feat (GREEN).
- **Committed in:** 3c806a1, bcdb0fe

**2. [Rule 1 - Lint] Removed the unused `intersects` helper in home-canvas.spec.ts**
- **Found during:** Task 1
- **Issue:** after the rewrite to `boxGap`, ESLint warned that `intersects` was unused.
- **Fix:** removed it.
- **Committed in:** 3a8f228

**Total deviations:** 2 (1 process, 1 lint)
**Impact on plan:** None on behaviour.

### Notes

- `e2e/home-canvas.spec.ts` already failed Prettier at HEAD, in the `settledPinBoxes` evaluate call. Only the lines this plan changed were formatted. `lib/__tests__/ascent-route.test.ts` is now Prettier-clean.

## Issues Encountered

- None blocking. Playwright's webServer started the dev server for every run.

## Verification

- Task 1: `npx playwright test e2e/home-canvas.spec.ts --project=chromium -g "summit"` 6 passed, twice. `npm run type-check` exit 0.
- Task 2: `npx jest lib/__tests__/framing.test.ts lib/__tests__/ascent-route.test.ts --silent` 67 passed. `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` 715 passed, guard OK.
- Task 3: `-g "summit"` 13 passed, including 11 'summit pins clear the plaque' rows. `npx jest lib/__tests__/frame-budget-policy.test.ts --silent` 15 passed. `npm run lint` exit 0 (pre-existing warnings only).
- Plan: `npx playwright test e2e/home-canvas.spec.ts --project=chromium` 36 passed. Jest 715/715 and the guard OK. Lint and type-check exit 0.
- Extra regression check: `npx playwright test e2e/home-ascent.spec.ts e2e/home-modes.spec.ts --project=chromium` 77 passed.
- Acceptance greps:
  - CameraRig.tsx: `(min-width: 48rem)` 2, `NARROW_STAGE_PX` 0, `fitCluster(` 1.
  - route.ts: the summit-offset and `fovAt` pattern 0.
  - `^import` in framing.ts 0 and in route.ts 0.
  - UI-SPEC: `measured, 09-20` 2.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- The 3D half of G-09-2 is closed in code and tests. UAT test 2 can be re-checked on a phone and a tablet in 3D.
- The summit visual baselines, where the 3D canvas shows, will change at every size whose frame moved. They need a re-baseline through the gh workflow, and Tim commits the PNGs.
- 09-21 can move the 3D labels onto `placePinLabel`. The geometry (including `plaque`), `subscribeGeometry` and the `wideStageOffsets` hook are ready.
- Ready for 09-21.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*

## Self-Check: PASSED

- Files exist: the nine modified files and this SUMMARY
- Commits on this branch: 3a8f228, 3c806a1, bcdb0fe, 8798b71 (`git rev-list --count 0e2601a..HEAD` = 4 before this docs commit)
- Acceptance criteria re-run: all pass
