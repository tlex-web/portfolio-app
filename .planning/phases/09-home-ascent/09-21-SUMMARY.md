---
phase: 09-home-ascent
plan: 21
subsystem: ui
tags: [home, ascent, camera, three, pins, labels, framing, playwright, jest, tdd]

requires:
  - phase: 09-home-ascent
    provides: "09-19 placePinLabel, railObstaclesAt, pinBoxes and StageGeometry (useAscent().geometry); 09-20 stageViewKeys with the wideStageOffsets hook, viewTrackAt, RouteCurves.poses, the matchMedia md switch and subscribeGeometry"
provides:
  - "lib/ascent/framing.ts: waypointTarget (natural, beside, above, below the card), WAYPOINT_FRAME_MARGIN_PX, WaypointPlacement"
  - "CameraRig: measured wide stage offsets (natural - target) on the 09-20 key track, recomputed per route build, stage size and geometry measurement"
  - "CameraRig: the lit 3D pin's label placed by placePinLabel every frame (data-label, --pin-label-dx); FLIP_PX and the 240 px edge rule removed"
  - "e2e 'md stages keep the lit 3D pin and its label clear of the card (G-09-3 a)' at nine sizes, classified measure-only"
affects: [09-22 (Tim's review of the placement table; visual baselines with the 3D canvas at md), UAT test 3 (3D extent)]

actuals:
  tokens: 7014
  tasks: 2
  commits: 2
plan_head_before: 376be280103520df1fd0422549fdb5971d95e994
plan_head_after: e8c85f8b54cda66b708f37b103eeae703eb93f23

tech-stack:
  added: []
  patterns:
    - "Measured framing per stage: project the waypoint with a scratch camera at its key pose (no offset), pick a clear target with a pure function, apply natural - target as that stage's view-offset key"
    - "Cache derived camera keys on the identity of their inputs (naturals memo, geometry object) so the frame loop never recomputes them"

key-files:
  created: []
  modified:
    - lib/ascent/framing.ts
    - components/home/terrain/CameraRig.tsx
    - e2e/home-canvas.spec.ts
    - lib/__tests__/frame-budget-policy.test.ts
    - lib/__tests__/framing.test.ts
    - .planning/phases/09-home-ascent/09-UI-SPEC.md

key-decisions:
  - "waypointTarget also rejects a candidate whose mark box touches a rail mark (the e2e truth requires the head clear of the ticks, line, readout and marker); the plan named only the stage, the card and the label"
  - "Overlap tests in waypointTarget ignore areas below 1e-6 px², so the beside mark exactly 8 px from the card is not rejected by float rounding"
  - "The planner expected 'above' at 768-900 px; measured, every md stage from 768 to 900 px (and 768 x 1024) puts the pin beside the card, because placePinLabel fits the label above, below or right between the rail tick rows. The candidate order is the plan's; only the outcome differs from the forecast"
  - "Unlit 3D marks keep their last data-label; only the lit mark is placed each frame (unlit labels are display: none)"

patterns-established:
  - "md stage framing contract: geometry (cards, labels, rail) + naturals at the key poses -> waypointTarget -> stageViewKeys({ wideStageOffsets }) -> viewTrackAt"

requirements-completed: [HOME-02, HOME-05]

coverage:
  - id: D1
    description: "At 768 x 900 every lit 3D pin's head and label are inside the stage and clear of the card, every rail tick row, the rail line, the readout and the marker (RED on the 09-20 rig: head 105 px into the card at every waypoint)"
    requirement: HOME-05
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#md stages keep the lit 3D pin and its label clear of the card (G-09-3 a) lights a clear 3D pin beside its card at 768 x 900"
        status: pass
    human_judgment: false
  - id: D2
    description: "The same clearance at 778, 820, 900, 1023 and 1024 x 900, 768 x 1024, 1280 x 900 and 1440 x 900; 1023 px and up keep the natural position, so 1280 and 1440 are unchanged"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#lights a clear 3D pin beside its card (9 rows, chromium)"
        status: pass
    human_judgment: false
  - id: D3
    description: "waypointTarget rules: natural, beside (natural height, clamped), above, below, natural when nothing fits or no card, 8 px card margin, 240 x 30 fallback label"
    verification:
      - kind: unit
        ref: "lib/__tests__/framing.test.ts#waypointTarget (9 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rest of the canvas spec (smoke, poster parity and hand-over, lit pins at 412 x 839, summit framing, resilience, budget) and the poster ascent spec still pass; the new test is measure-only"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "npx playwright test e2e/home-canvas.spec.ts --project=chromium (45 passed)"
        status: pass
      - kind: e2e
        ref: "npx playwright test e2e/home-ascent.spec.ts --project=chromium (49 passed)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/frame-budget-policy.test.ts (16 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The md compositions read well in live 3D: the lit pin just right of the card with its label above, below or right of it, and the view easing between stages"
    requirement: HOME-02
    verification: []
    human_judgment: true
    rationale: "The e2e proves geometry under SwiftShader; whether a pin 8 px from the card edge with a stacked label looks right, and how the per-stage offset change feels while scrolling, is Tim's 09-22 review"

duration: 12 min
completed: 2026-10-25
status: complete
---

# Phase 09 Plan 21: Measured md stage framing and shared 3D labels (G-09-3 a, 3D half) Summary

**On md stages the camera now puts the lit waypoint where it and its label are visible. `waypointTarget` in lib/ascent/framing.ts tries the natural position first, then beside, above and below the card. CameraRig applies natural - target as that stage's view offset on the 09-20 key track. The lit 3D label is placed with `placePinLabel`, the same rule the poster uses. At 768 x 900 the lit pin moved from 105 px inside the card to 8 px right of it, and the card covers no waypoint pin from 768 to 1440 px.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-10-25T17:46:04Z
- **Completed:** 2026-10-25T17:57:43Z
- **Tasks:** 2 of 2
- **Files modified:** 6

## Accomplishments

- `waypointTarget({ natural, card, label, obstacles, stage, margin = 8 })` returns `{ x, y, placement }`. It accepts a candidate when:
  - the mark box is 8 px inside the stage,
  - the mark is 8 px from the card,
  - the mark touches no rail mark,
  - `placePinLabel` finds a clear label for it (card as obstacle and cover).

  With no card, or when nothing fits, it returns natural. A missing label counts as 240 x 30. `framing.ts` is still import-free.
- CameraRig:
  - `stageNaturals` projects each anchor at relief 1 with a scratch camera at `poses.positions[k]` looking at `poses.targets[k]`: FOV 40, the stage aspect, up (0, 1, 0), no offset. It runs once per route build and stage size (useMemo).
  - `wideStageOffsets` turns those positions into natural - target. The rig caches the result on the identity of the naturals and of `geometry.current`, so it is recomputed only when a measurement replaces the geometry (T-09-32).
  - Narrow stages still pass nothing (D-20 shares). p = 0 is still the plan view (D-16).
  - `placePins` takes the geometry. For the lit mark it places the label (card plus `railObstaclesAt` for that waypoint, card as cover, stage as bounds) and writes `data-label` and `--pin-label-dx`.
  - `FLIP_PX` and the edge rule are gone. The header comment is updated.
- e2e: a new describe with nine rows. Each row centres every waypoint and waits for the readout and the lit 3D pin. It then reads the head, label, card and rail marks until two reads 10 frames apart agree, and asserts one lit pin, label visible, head and label inside the stage, and no intersection with the card or any rail mark. The new title is classified measure-only, in file order and in `PHONE_3D`.
- UI-SPEC: Ascent Mapping has a new "md stages (G-09-3 a, 09-21)" row. The Pins Label row now says the 3D labels use the same placement rule.

## Tracer row: 768 x 900 before and after

Before (the 09-20 rig at 376be28, with the new e2e):

```
Error: waypoint 1 at 768 x 900: head gap to the card	    Received:    -105
Error: waypoint 1 at 768 x 900: label gap to the card	    Received:    -242.53125
Error: waypoint 2 at 768 x 900: head gap to the card	    Received:    -105
Error: waypoint 2 at 768 x 900: label gap to the card	    Received:    -255.16561889648438
Error: waypoint 3 at 768 x 900: head gap to the card	    Received:    -105
Error: waypoint 3 at 768 x 900: label gap to the card	    Received:    -126.86563110351562
Error: waypoint 4 at 768 x 900: head gap to the card	    Received:    -105
Error: waypoint 4 at 768 x 900: label gap to the card	    Received:    -264.5625
  1 failed
```

After (`40c50f9`):

```
ok 2 ... › waypoint 2 lights its 3D pin @chromium-only (5.6s)
ok 3 ... › md stages keep the lit 3D pin and its label clear of the card (G-09-3 a) › lights a clear 3D pin beside its card at 768 x 900 @chromium-only (8.0s)
ok 1 ... › a canvas revealed while stationary lights its 3D pin @chromium-only (8.4s)
  3 passed (15.3s)
```

Tracer gate: this was an interactive run in `end-of-phase` mode with an automated-only verify. I re-ran both verify commands (3 passed; Jest 16 passed; 0 `error TS`) and then continued to Task 2.

## Placement table for Tim's 09-22 review (Chromium, SwiftShader, measure-only, each waypoint centred)

Placement is read against the card box: beside = mark 8 px right of the card, natural = the stage camera's own position. "Label" is the `placePinLabel` side.

| Size | Waypoint 1 | Waypoint 2 | Waypoint 3 | Waypoint 4 |
|------|------------|------------|------------|------------|
| 768 x 900 | beside, label above | beside, label right | beside, label below | beside, label right |
| 778 x 900 | beside, right | beside, right | beside, below | beside, right |
| 820 x 900 | beside, right | beside, right | beside, below | beside, right |
| 900 x 900 | beside, right | beside, right | beside, below | beside, right |
| 1023 x 900 | natural, right | natural, right | natural, right | natural, right |
| 1024 x 900 | natural, right | natural, right | natural, right | natural, right |
| 768 x 1024 | beside, above | beside, right | beside, below | beside, right |
| 1280 x 900 | natural, right | natural, right | natural, right | natural, right |
| 1440 x 900 | natural, right | natural, right | natural, right | natural, right |

The head x is 480 px (card right 472 + 8) on every beside row. At 1023 and 1024 px the natural head starts at 494.5 / 495 px, 22.5 px and 15 px right of the card, so the plan's "beside or natural" resolved to natural there. At 1280 and 1440 the head sits at 623 / 703 px, the centre of the stage, as before. No row needed "above" or "below". The planner's forecast of "above" at 768-900 px assumed the 62-94 px band was the only room. The label also fits above or below the head between the rail tick rows, so "beside" passes first.

## Task Commits

1. **Task 1: Measured md stage framing and 3D labels end-to-end (tracer)**: `40c50f9` (fix)
2. **Task 2: waypointTarget unit tests, the remaining rows, UI-SPEC**: `e8c85f8` (test)

**Plan metadata:** the docs commit that follows this SUMMARY

## TDD Gate Compliance

- **RED: unexpected GREEN, investigated.** The plan orders the tracer first, so Task 1 built `waypointTarget` before Task 2 wrote its unit tests. The 9 new tests passed on their first run (45/45). Against the pre-plan code (376be28) they cannot reach RED: `waypointTarget` is not exported there, so the run fails on import, which counts as INVALID_RED, not as a failed assertion. No `check tdd-red-evidence` record was produced, and none is claimed.
- **Mutation check instead.** I mutated framing.ts three times, ran the suite against each mutation, and restored the file after each run. `git diff` on framing.ts is empty.
  - Dropping the 'above' candidate: 2 failed.
  - Replacing the 240 x 30 fallback label with 1 x 1: 1 failed.
  - Dropping the 8 px card keep-out: at first 0 failed, because placePinLabel's cover rule was already rejecting a mark under the card. I added the test "keeps 8 px from the card: a natural mark 3 px right of it moves beside", and with it this mutation gave 1 failed.
- **GREEN:** no `feat(09-21)` commit, because the implementation is the Task 1 `fix(09-21)` commit `40c50f9`. The gate log has `test(09-21)` (`e8c85f8`) after it, not before.
- **REFACTOR:** none.
- **Semantic assessment:** each discriminating test failed on its own planned assertion under its mutation (a placement or coordinate `toEqual`). None failed on setup, import or fixtures.

## Files Created/Modified

- `lib/ascent/framing.ts`: header note; the md stage framing section (`WAYPOINT_FRAME_MARGIN_PX`, `WaypointPlacement`, `waypointTarget`).
- `components/home/terrain/CameraRig.tsx`: imports; header comment (md stages, 3D labels); `stageNaturals`, `wideStageOffsets`; `placePins` with geometry and placePinLabel; the cached wide offsets passed to `stageViewKeys`; FLIP_PX removed.
- `e2e/home-canvas.spec.ts`: the md describe (nine rows), `Lit3dBoxes`, `fmt`, `settledLit3dBoxes`, `placementOf`.
- `lib/__tests__/frame-budget-policy.test.ts`: the new title in `PHONE_3D` and in the ordered list.
- `lib/__tests__/framing.test.ts`: 9 waypointTarget tests with an `expectClear` contract check.
- `.planning/phases/09-home-ascent/09-UI-SPEC.md`: the Ascent Mapping row and the Pins Label sentence.

## Decisions Made

- The mark must also stay off the rail marks. This is Rule 2: the plan's own e2e truth needs the head clear of the ticks, the line, the readout and the marker.
- A 1e-6 px² overlap tolerance in waypointTarget, for float rounding at the exact 8 px edge.
- Unlit 3D marks are left alone, as the plan says. A stale `data-label` on an unlit mark is never visible, and the next frame after it lights re-places it.
- ui-ux-pro-max was loaded before the UI-SPEC edit. The rules applied:
  - breakpoint-consistency: the md switch is the same media query as the CSS.
  - content-priority: the lit pin and label come before keeping the centred composition at md.
  - spacing-scale: the 8 px clearances.
  - main-thread-budget and reduce-reflows: no DOM reads in the frame loop, and targets cached per measurement.
  - transform-performance: the pins still move by transform.
  - Touch-target rules do not apply, because the pins take no pointer events.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] waypointTarget also keeps the mark off the rail marks**
- **Found during:** Task 1
- **Issue:** The plan's acceptance test covered the stage, the card and the label only. A candidate whose head sits on a tick row would have passed, but the plan's e2e truth forbids it.
- **Fix:** A candidate whose mark box overlaps an obstacle is rejected.
- **Files modified:** lib/ascent/framing.ts
- **Committed in:** 40c50f9

**2. [Rule 1 - Bug] Float tolerance at the 8 px card edge**
- **Found during:** Task 1
- **Issue:** card right + 8 + 12 - 12 can land a hair inside the keep-out box, which would reject "beside" by rounding.
- **Fix:** Overlaps below 1e-6 px² count as apart (`EPS_PX2`).
- **Files modified:** lib/ascent/framing.ts
- **Committed in:** 40c50f9

**3. [Process] Task 2 has no RED commit**
- **Found during:** Task 2
- **Issue:** The plan builds the function in the tracer, before its tests exist.
- **Fix:** Documented above, with mutation evidence and one extra test for the 8 px keep-out.
- **Committed in:** e8c85f8

---

**Total deviations:** 3 (1 correctness, 1 bug, 1 process). **Impact:** No change to the plan's candidate order or interfaces. No scope creep.

## Issues Encountered

- `e2e/home-canvas.spec.ts` still fails Prettier only in the pre-existing `settledPinBoxes` evaluate call (already logged). Every line this plan added is Prettier-clean.
- `npm run build` was not run, so `public/service-worker.js` is untouched.

## Known Stubs

None.

## Visual baselines (for 09-22)

The Linux visual baselines were not re-captured (no push in this plan). Any baseline that shows the live 3D canvas at a waypoint from 768 to 1000 px changes: the lit pin moves to 8 px right of the card, and the terrain shifts with the view offset. Frames from 1023 px up, below 768 px, and the poster (static) frames should not move. That is not verified here.

## User Setup Required

None. No external service configuration required.

## Verification

- Task 1: `npx playwright test e2e/home-canvas.spec.ts --project=chromium -g "lights a clear 3D pin|waypoint 2 lights its 3D pin|a canvas revealed while stationary"`: 3 passed, twice. `npx jest lib/__tests__/frame-budget-policy.test.ts --silent`: 16 passed. `npm run type-check`: 0 errors.
- Task 2:
  - `npx jest lib/__tests__/framing.test.ts --silent`: 45 passed.
  - `npx playwright test e2e/home-canvas.spec.ts --project=chromium`: 45 passed, including 9 'lights a clear 3D pin' rows.
  - `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests`: 725 passed. Test count: jest 725 + e2e 241 = 966 against a baseline of 832, OK.
  - `npm run lint`: exit 0.
- Plan: `npx playwright test e2e/home-ascent.spec.ts --project=chromium`: 49 passed. The canvas spec is above. Lint and type-check are green.
- Acceptance greps:
  - CameraRig.tsx: `FLIP_PX` 0, `waypointTarget(` 1, `placePinLabel(` 1.
  - framing.ts: `^import` 0.
  - UI-SPEC: `G-09-3 a, 09-21` 2.

## Next Phase Readiness

- The 3D half of G-09-3 (a) is closed in code and tests. UAT test 3 can be re-checked live at md widths.
- 09-22: Tim reviews the placement table above, and the md 3D visual baselines get re-captured through the gh workflow. Tim commits the PNGs.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*

## Self-Check: PASSED

- FOUND: lib/ascent/framing.ts, components/home/terrain/CameraRig.tsx, this SUMMARY
- FOUND: 40c50f9, e8c85f8 (ancestors of HEAD; `git rev-list --count 376be28..HEAD` = 2 before this docs commit)
- Acceptance criteria re-run: all pass
