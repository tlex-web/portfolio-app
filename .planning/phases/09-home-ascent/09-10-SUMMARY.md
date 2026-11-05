---
phase: 09-home-ascent
plan: 10
subsystem: ui
tags: [three, react-three-fiber, catmull-rom, camera, webgl, pins, playwright, swiftshader, jest, tdd]

requires:
  - phase: 09-08
    provides: "TerrainMesh (onMetres, uRelief/uExaggeration uniforms), plan-view CameraRig, lib/terrain/heightmap meshHeightAtUv/uvToWorld, e2e/home-canvas.spec.ts"
  - phase: 09-06
    provides: "useAscent() progress spring, layout arrivals, syncPins(), PinMark/SummitMark, PLATEAU"
  - phase: 09-03
    provides: "buildWaypoints() order, labels and UVs"
provides:
  - "lib/ascent/route.ts (import-free): Vec3, Pose, UvWindow, PinAnchor; CAMERA_FOV_DEG, RELIEF_EXAGGERATION, SUMMIT_PULLBACK_M and the other named tuning constants; reliefAt, planViewPose, keyPoses, curveParamAt, summitVerticalFov, fovAt, viewOffsetAt, viewOffsetXAt, yawDeg"
  - "components/home/terrain/route-curve.ts: buildRouteCurves, poseAt, anchorAt, routeCurvesFor (shared by CameraRig and the clearance e2e)"
  - "components/home/terrain/PinLayer3D.tsx: data-pin-layer=\"3d\" DOM pin layer, syncPins() on mount"
  - "CameraRig flies the route from the one spring; drives uRelief, up, FOV, view offset and the 3D pin transforms"
  - "Pin anchors (k, label, approximate, u, v) cross from the Server AscentHero through TerrainStage as props"
  - "7 e2e tests in e2e/home-canvas.spec.ts (15 in the file), 30 unit tests (ascent-route 25, pin-layer-3d 5)"
affects: [09-11, 09-12, 09-13, 09-14]

actuals:
  tokens: 17824
  tasks: 3
  commits: 5
plan_head_before: eb03b67500641a4f053110a4f4a658a44628b5cc
plan_head_after: 5fb3245de34ace5ab06568a93d32fe27f601726d

tech-stack:
  added: []
  patterns:
    - "Route as data: pure key poses and curve parameter in lib (import-free, Jest-testable with three's CJS camera), curves built in the chunk; the e2e builds the same curves through routeCurvesFor"
    - "One tilt fraction (reliefAt) drives relief, the camera's up vector and the narrow-stage view offset, so all three are 0 at p = 0 (poster parity) and finish together at the start of waypoint 1's plateau"
    - "DOM pins projected in useFrame through a refs array; a shown mark clears its inline visibility (inherit) so the layer's invisible-until-3d class still governs it"
    - "A late-mounting pin layer calls syncPins() in a layout effect (useEffectEvent), so its lit state never depends on when it mounted"

key-files:
  created:
    - lib/ascent/route.ts
    - lib/__tests__/ascent-route.test.ts
    - components/home/terrain/route-curve.ts
    - components/home/terrain/PinLayer3D.tsx
    - components/home/__tests__/pin-layer-3d.test.tsx
  modified:
    - components/home/terrain/CameraRig.tsx
    - components/home/terrain/TerrainCanvas.tsx
    - components/home/terrain/TerrainMesh.tsx
    - components/home/TerrainStage.tsx
    - components/home/AscentHero.tsx
    - e2e/home-canvas.spec.ts

key-decisions:
  - "The stage cameras look back NE down each waypoint-summit line instead of facing the summit. Three of the plan's own checks force this: yaw changes by at most 45 degrees per leg, waypoint 2 stays visible at 412 px (only about 20 degrees of horizontal FOV there), and the summit frame looks back NE. Facing the summit would need a 170-degree turn at the top. The camera still climbs toward the summit (3.6 km out to 1.1 km, 3,053 m to 4,273 m), the yaw per leg is 4/8/16/18 degrees, and the tilt-in turns the map 56 degrees clockwise. Flagged for Tim at 09-12"
  - "CAMERA_GLIDE_DEG 26 and SUMMIT_LIFT_M 350 keep each stage's waypoint near the frame centre (NDC y -0.09 to 0.36) with at least 359 m of route clearance above the 512 mesh"
  - "Below 768 px the view offset is also horizontal (viewOffsetXAt, 20 % of the width), so the active waypoint sits at 30 % and its label fits to the right"
  - "curveParamAt eases each leg with smoothstep between plateau edges: the camera leaves and reaches every stage gently and holds still on the plateaus"
  - "Pin anchors come from the server as props, not from buildWaypoints in the lazy chunk: the photo data and image manifest stay out of the canvas chunk (+2,548 B transfer for this plan)"

patterns-established:
  - "Anything that must match the camera exactly in a test (curves, anchors) is built through route-curve.ts's routeCurvesFor/anchorAt, never re-derived"
  - "09-12 tunes only the named constants in lib/ascent/route.ts; ascent-route.test and the e2e clearance/summit checks guard the result"

requirements-completed: [HOME-02, HOME-03, HOME-05]

coverage:
  - id: D1
    description: "Plan-view parity of the route at p = 0: planViewPose frames the posterFrame UV window corner to corner (NDC +-1 within 1e-3) at 375 x 603, 768 x 960 and 1440 x 836; the canvas still fades in over the poster with a mean difference of 0.44 levels (limit 3)"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "lib/__tests__/ascent-route.test.ts#planViewPose (D-16 poster parity)"
        status: pass
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#canvas fades in over the poster at p = 0 @chromium-only"
        status: pass
    human_judgment: false
  - id: D2
    description: "Scrolling flies the camera up the terrain: curve parameter 0 at p = 0 and 1 at p = 1, never decreasing, holding k/(n+1) within +-0.03 of each arrival; yaw at most 45 degrees per leg (measured 4-18); relief and view offsets 0 at p = 0 and complete by p_1; the SwiftShader canvas is not blank, has contours and changes at the top, waypoint 2 and the summit (lumStd 19.3/12.3/26.1, contour share 0.046/0.010/0.020, frame differences 17.0 and 35.4 levels), with the readout at 1,617/1,668/4,478 m"
    requirement: HOME-03
    verification:
      - kind: unit
        ref: "lib/__tests__/ascent-route.test.ts#curveParamAt (plateaus and legs); tilt-in, FOV and view offset"
        status: pass
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#smoke at three ascent positions @chromium-only"
        status: pass
    human_judgment: false
  - id: D3
    description: "Summit look-back (D-03): camera 450 m SW of and 350 m above the summit, aimed at the waypoint centroid; all four anchors inside NDC +-0.9 at three sizes (narrow view offsets applied); all four 3D pins shown inside the stage at 1440 x 900 and 412 x 839, none lit"
    requirement: HOME-05
    verification:
      - kind: unit
        ref: "lib/__tests__/ascent-route.test.ts#the summit frame shows all four waypoints inside NDC +-0.9"
        status: pass
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#summit frame shows every waypoint (2 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "3D pins at their real positions and heights: one DOM layer of PinMarks with the poster labels, anchored at the mesh height x uRelief; at the reveal (p = 0) the poster and 3D layers swap in one style recalculation with all four 3D pins shown within 2 px of their poster pins; waypoint 2's 3D pin is lit with its label inside the stage at 412 px, also when the canvas reveals while the visitor is stationary"
    requirement: HOME-05
    verification:
      - kind: unit
        ref: "components/home/__tests__/pin-layer-3d.test.tsx (5 tests)"
        status: pass
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#pins hand over at the reveal; waypoint 2 lights its 3D pin; a canvas revealed while stationary lights its 3D pin"
        status: pass
    human_judgment: false
  - id: D5
    description: "The route stays at least 120 m above the decoded 512 mesh from p_1 to the summit (measured lowest clearance 372 m at 1440 x 836, 359 m at 375 x 603)"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#route clears the terrain @chromium-only"
        status: pass
    human_judgment: false
  - id: D6
    description: "How the flight feels and frames: the look-back-NE reading of D-02/D-03, the 56-degree map turn in the tilt-in, the tuning constants (exaggeration 1.0, pullback 450 m, lift 350 m, glide 26 degrees, mix 0.35, FOV 40 and the summit's 60-degree horizontal FOV, which is 99 degrees vertically on a 412 px phone), pins 1 and 2 behind the summit plaque at 1440 px, and the dark wedge at the bottom of the 1440 summit frame"
    verification: []
    human_judgment: true
    rationale: "Camera composition and motion comfort are taste calls the plan reserves for Tim's 09-12 render review; the tests prove the limits (yaw, clearance, framing), not the feel"

duration: 28min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 10: Camera route, summit look-back and 3D pins Summary

**Scrolling now flies the terrain camera: from the poster's plan view it tilts into perspective (relief easing up from 0) and climbs past one stage per photograph to a summit look-back over all four waypoints. Each stage camera sits on the summit side of its waypoint and looks back NE down the line through it, so the waypoint stays centred on any screen and the camera turns at most 18 degrees per leg. HTML pins, the same marks as the poster's, are projected each frame onto the rendered mesh, take over from the poster pins in the reveal frame, and light with the active stage, also when the canvas reveals while the visitor is stationary.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-10-25T01:44:24Z
- **Completed:** 2026-10-25T02:12:11Z
- **Tasks:** 3
- **Files modified:** 11 (5 created, 6 modified), plus deferred-items.md

## Accomplishments
- `lib/ascent/route.ts` is pure and import-free. It holds the plan-view pose, the n + 2 key poses, the plateau-holding curve parameter (eased between plateaus), the tilt fraction, the summit FOV, the narrow-stage view offsets and the yaw measure. Every numeric choice is a named constant with a one-line rationale, ready for the 09-12 review.
- `route-curve.ts` holds the centripetal Catmull-Rom position and target curves, plus `routeCurvesFor`/`anchorAt`, which CameraRig and the clearance e2e share.
- `CameraRig` takes `poseAt(curves, curveParamAt(p, arrivals))` from the one spring. The tilt fraction drives uRelief, the up vector (north to world up) and the narrow-stage view offset. The FOV widens to `summitVerticalFov(aspect, 60)` across the last leg. The D-06 epsilon invalidation is kept, at priority 0. The pins are placed after the pose update, hidden when behind the camera or more than 10 % off-stage, and flipped by the 240 px clear-edge rule.
- `PinLayer3D` is one aria-hidden layer, invisible until the stage reads `3d`, with no drei. Marks start hidden at the origin and the rig shows them by clearing their inline visibility. `syncPins()` runs in a layout effect.
- HOME-08 local signal (one production sample, mode `3d`): total script transfer is 443,722 B, which leaves 25,048 B of headroom (09-09: 27,600 B). The app chunk grew from 17,583 B to 20,131 B (+2,548 B). The three/R3F chunk is unchanged at 241,953 B, and there are no drei or three/examples imports.

## Task Commits

1. **Task 1 (tracer): spring -> curve parameter -> pose and relief**: `86529fc` (feat)
2. **Task 2 RED: route tests and failing pin-layer tests**: `bc9022e` (test)
3. **Task 2 GREEN: 3D pin layer and per-frame projection**: `67a23ac` (feat)
4. **Task 3 fix: narrow stages frame the waypoint left of centre; shared route builder**: `f25c38c` (fix)
5. **Task 3: SwiftShader smoke, hand-over, summit framing, clearance e2e**: `5fb3245` (test)

## Tracer gate
This was an interactive run (`_auto_chain_active` false), with `human_verify_mode` end-of-phase and an automated-only `<verify>`. After the commit I re-ran the verify: lint exit 0, type-check clean, and `home-canvas.spec.ts` 8/8 with the 09-08 parity test passing. I also checked screenshots at 1440 and 412 px (waypoint 2 and the summit) before expanding.

## TDD Gate Compliance
- **RED (`bc9022e`):** I ran `ascent-route.test.ts` and `pin-layer-3d.test.tsx` against a signature-only `PinLayer3D` stub that returns null, through a TAP Jest reporter in the session scratchpad. `check tdd-red-evidence` returned **RED_EVIDENCE_OK** (`target_test_failed`, format `tap`, no report errors): 29 tests, 24 passed and 5 failed. The target was `PinLayer3D (D-09, C3) > asks AscentController to re-apply the lit pin once its pins have mounted`.
  - **Semantic assessment:** the target ran and failed on `toHaveBeenCalledTimes(1)` because the stub never calls `syncPins`. There was no load, import or syntax fault. The 24 route tests passed in RED because the plan builds `route.ts` in the Task 1 tracer, so they are characterisation tests. A mutation probe (plateau 0, pullback bearing NE) failed 3 of 24 on their assertions, and I then restored `route.ts` with `git checkout`. One pin test passed vacuously over an empty refs array at first; I strengthened it to assert the count before recording the RED.
- **GREEN (`67a23ac`):** route, progress, boundary and pin-layer suites all pass, 74/74.
- **e2e guard check:** I removed the `syncPins()` call as a probe, and 'a canvas revealed while stationary lights its 3D pin' failed (pin 2 never lit). I then restored it.
- No REFACTOR commit. The `f25c38c` fix includes the shared-builder refactor and is a behaviour fix, so it is not a refactor.

## Files Created/Modified
- `lib/ascent/route.ts`: the route maths and constants.
- `lib/__tests__/ascent-route.test.ts`: 25 unit tests.
- `components/home/terrain/route-curve.ts`: curves, `poseAt`, `anchorAt`, `routeCurvesFor`.
- `components/home/terrain/PinLayer3D.tsx`: the 3D pin layer.
- `components/home/__tests__/pin-layer-3d.test.tsx`: 5 tests.
- `components/home/terrain/CameraRig.tsx`: the route camera, relief, offsets and pin projection.
- `components/home/terrain/TerrainCanvas.tsx`: holds the metres, shares the material ref, and renders PinLayer3D beside SafeCanvas.
- `components/home/terrain/TerrainMesh.tsx`: `shaderRef` prop, and bounds up to RELIEF_EXAGGERATION.
- `components/home/TerrainStage.tsx`, `components/home/AscentHero.tsx`: the `pins` prop from the server.
- `e2e/home-canvas.spec.ts`: 7 new tests (15 in the file).

## Decisions Made
See key-decisions. The route orientation is the one Tim should look at first. CONTEXT lists the camera curve and look-at targets as Claude's discretion, but the result reads D-02's "approach" and D-03's "turns back NE" differently from a summit-facing flight. The camera looks NE across the valley the whole way and rises toward the summit, so at the summit it settles rather than turns.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The active pin's label was clipped on phones**
- **Found during:** Task 3 (e2e 'waypoint 2 lights its 3D pin')
- **Issue:** The stage waypoint is on the view axis, so its pin is centred. On a 402 px stage a centred head leaves about 177 px on either side, and the labels run 184 to 250 px, so the flipped label started at x -2.7.
- **Fix:** `viewOffsetXAt` adds a horizontal view offset of 20 % of the width below 768 px, ramping with the tilt-in (0 at p = 0). The waypoint sits at 30 % of the width and its label fits to the right; it measured x 140.6-324.3 in a 402 px stage. The summit unit test applies both offsets.
- **Files modified:** lib/ascent/route.ts, components/home/terrain/CameraRig.tsx, lib/__tests__/ascent-route.test.ts
- **Committed in:** `f25c38c`

**2. [Rule 3 - Blocking] The 3D pins need labels and UVs in the lazy chunk**
- **Found during:** Task 1
- **Fix:** AscentHero (server) builds `PinAnchor[]` from `buildWaypoints()` and passes it through `TerrainStage` to `TerrainCanvas`. Importing `buildWaypoints` in the chunk would ship the photo data and image manifest. This touches two files outside the plan's list. The boundary test's rule (d) holds, because only a type import is added.
- **Committed in:** `86529fc`

**3. [Rule 3 - Blocking] The boundary test rejected `route-curve.ts` without the client directive**
- **Found during:** Task 2 verify (rule a: a `components/home` file importing three must be a client module)
- **Fix:** I added `'use client'`, which has no effect when the e2e imports the file in Node.
- **Committed in:** `67a23ac`

**4. [Rule 2 - Missing critical] Mesh bounds and the relief uniforms**
- **Found during:** Task 1
- **Fix:** TerrainMesh exposes its live material through a `shaderRef` prop (CameraRig drives uRelief/uExaggeration), and its bounding box scales by `max(1, RELIEF_EXAGGERATION)`. That is 09-08's "widen it if uExaggeration goes above 1" note, so a later tuning cannot cull the raised mesh. The file is outside the plan's list.
- **Committed in:** `86529fc`

### Interface and test adjustments
- `keyPoses` takes `{ anchors, summit, planView }`. The plan's `aspect` and `fovDeg` inputs were dropped because no pose depends on them: the FOV is applied by the rig through `summitVerticalFov`/`fovAt`. New exports: `Pose`, `UvWindow`, `PinAnchor`, `fovAt`, `viewOffsetXAt`, `ROUTE_PLATEAU` (asserted equal to `PLATEAU`) and the named constants.
- `reliefAt` (and so the up vector and offsets) completes at `p_1 - PLATEAU`, not exactly at p_1, so the camera is still on waypoint 1's plateau. `reliefAt(p_1) === 1` holds as specified.
- The `meshHeightAtUv` call that anchors pins and stops lives in `route-curve.ts`'s `anchorAt`, which CameraRig calls. The acceptance grep on CameraRig matches its documentation of the rule, and `elevation.m` appears 0 times.
- 'pins hand over at the reveal' arms the stage by idle (no scroll), so the swap happens at p = 0 and all four pins must show. With a 400 px wheel scroll the reveal fell mid tilt-in, where 2 of 4 pins are legitimately out of frame. I also added a check that each 3D pin sits within 2 px of its poster pin at the swap.

---

**Total deviations:** 4 auto-fixed (1 bug, 2 blocking, 1 missing critical), plus the interface notes above.
**Impact on plan:** all of these are inside the plan's intent. The route orientation is a design call within discretion and is flagged for 09-12.

## Issues Encountered
- A dev-server log line `The destination stream errored while writing data` appears when a test abandons a held heightmap request. It is harmless and every test passed.
- Visual findings for the 09-12 review are logged in deferred-items.md: at 1440 px pins 1 and 2 sit behind the summit plaque, and a small dark wedge appears at the bottom edge of the 1440 summit frame.

## Verification
- Jest: the full suite runs 45 suites and 620 tests, all passing. `guard:tests` counts jest 620 + e2e 175 = 795 (baseline 533), OK.
- `npm run lint`: exit 0. `npm run type-check`: no errors.
- Playwright Chromium: `home-canvas.spec.ts` passed 15/15 (twice). `home-ascent`, `home-modes`, `homepage` and `no-webgl` passed 52/52.
- Acceptance greps: `centripetal` 4 in route-curve. In CameraRig, `setViewOffset` 1, `curveParamAt` 3, `meshHeightAtUv` 4 and `elevation.m` 0. Route.ts has 0 `^import` lines. The drei `git grep` printed nothing (exit 1). `syncPins` 3 in PinLayer3D. The spec titles each appear once, and there is no `.skip`, `.only` or `.fixme`.
- HOME-08 local production sample: 443,722 B in mode `3d`. Afterwards I ran `git checkout -- public/service-worker.js`.
- Nothing was pushed, no workflow was dispatched, and no baseline PNG was touched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 09-11 (frame budget, context loss): CameraRig keeps the demand frameloop and priority 0. The pin layer unmounts with the canvas, so a downgrade brings the poster pins back in the same frame.
- 09-12: tune only the constants in `lib/ascent/route.ts`. The unit tests (yaw, framing, plateaus) and the e2e (clearance of at least 120 m, summit pins, label inside the stage) guard the result. Review the route orientation decision, the summit plaque overlap and the dark wedge.
- 09-13: re-measure HOME-08 in the container; the local headroom is 25,048 B.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*

## Self-Check: PASSED

All 5 created files exist. Commits 86529fc, bc9022e, 67a23ac, f25c38c and 5fb3245 are ancestors of HEAD (`git rev-list --count eb03b67..HEAD` = 5), and evaluation-scope resolves the plan commits on this branch.
