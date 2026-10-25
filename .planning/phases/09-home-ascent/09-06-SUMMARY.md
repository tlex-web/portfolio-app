---
phase: 09-home-ascent
plan: 06
subsystem: ui
tags: [nextjs, motion, useScroll, useSpring, scroll-linked, altimeter, pins, a11y, focus, jest, playwright]

requires:
  - phase: 09-01
    provides: "AscentHero stage/track grid with data-ascent-stage / data-ascent-track, PosterSheet sheet box, posterFrame()"
  - phase: 09-02
    provides: "components/home boundary test (client directive and import rules)"
  - phase: 09-03
    provides: "buildWaypoints() and the li#waypoint-{slug}[data-ascent-block=waypoint][data-k] stage blocks"
  - phase: 09-05
    provides: "section#summit[data-ascent-block=summit] as the last track block"
  - phase: 08
    provides: "lowestDemM, terrain.summit.officialM / uv, photo uv and position.approximate, formatMetres"
provides:
  - "lib/ascent/progress.ts: PLATEAU, AscentLayout, arrivalsFromBlocks, mapProgress, altitudeAt, railFraction, activePin, pinWindow, snapThreshold, shouldSnap (import-free)"
  - "components/home/AscentController.tsx: data-ascent-root provider; useAscent() -> { progress, layout, n, heights, rootRef, syncPins }"
  - "components/home/AltimeterRail.tsx: data-ascent-rail, data-rail-tick, data-tick-label, data-ascent-cursor, data-ascent-marker, data-ascent-readout"
  - "components/home/PinMark.tsx: PinMark (data-pin, data-u, data-active, data-flip, data-pin-head/-stem/-label) and SummitMark (data-summit-mark)"
  - "PosterSheet: data-sheet-box and data-pin-layer=\"poster\" (hidden under data-ascent-mode=3d)"
  - "e2e/helpers/webgl.ts (disableWebGL, webglFailure, expectNoErrorPage, nextFrames) and e2e/helpers/ascent.ts (scrollBlockToCentre, readout)"
  - "e2e/home-ascent.spec.ts describe 'Ascent progress (HOME-03, HOME-04, HOME-05)' (7 tests)"
affects: [09-07, 09-08, 09-10, 09-14]

actuals:
  tokens: 16100
  tasks: 3
  commits: 5
plan_head_before: bd16add88b9e6dbd2c553bfddb0ae04c54005d77
plan_head_after: 44d0caa5735d44ea786c94ce515253f55ba784f1

tech-stack:
  added: []
  patterns:
    - "One page useScroll() (no target) -> pure mapProgress over a ResizeObserver-measured layout -> one hand-driven useSpring (set, or jump past one leg); every consumer subscribes with useMotionValueEvent and writes refs/DOM, never React state"
    - "Mount-only effects call useEffectEvent handlers (React 19.3) instead of suppressing react-hooks/exhaustive-deps"
    - "Externally driven visual state as data attributes (data-active, data-flip) on server-rendered marks, styled with group-data-[…]/pin variants"

key-files:
  created:
    - lib/ascent/progress.ts
    - lib/__tests__/ascent-progress.test.ts
    - components/home/AscentController.tsx
    - components/home/AltimeterRail.tsx
    - components/home/PinMark.tsx
    - components/home/__tests__/rail.test.tsx
    - e2e/helpers/webgl.ts
    - e2e/helpers/ascent.ts
  modified:
    - components/home/AscentHero.tsx
    - components/home/PosterSheet.tsx
    - e2e/no-webgl.spec.ts
    - e2e/home-ascent.spec.ts

key-decisions:
  - "Altitude and rail position interpolate between plateau edges (p_k + 0.03 to p_k+1 - 0.03), not over the whole leg: same midpoint (0.3 -> 1,642.5 m) and no jump at a plateau edge"
  - "The label flip measures 240 px from the clear stage edge: the stage's right edge minus the rail scrim's width wherever the rail shows (768 px and up), so an active label never runs under the rail (the spec'd stage-edge rule left the Riffelsee label under the rail at 1440 px)"
  - "The summit view starts at (p_n + p_summit) / 2, which equals the UI-SPEC's (p_n + 1) / 2 because the summit arrival is always 1 in the measured layout"
  - "PinMark takes an optional u (data-u) so the controller can apply the posterFrame flip rule without shipping waypoint data to the client"
  - "RED for both TDD tasks used signature-only stubs and a flat-TAP Jest reporter in the session scratchpad; both returned RED_EVIDENCE_OK"

patterns-established:
  - "Any later pin layer (the 3D pins in 09-10) renders PinMark under data-ascent-root and calls useAscent().syncPins() on mount"
  - "Progress e2e tests call disableWebGL and seek positions with scrollBlockToCentre, never innerHeight x percent"

requirements-completed: [HOME-03, HOME-04, HOME-05]

coverage:
  - id: D1
    description: "Pure ascent mapping: measured arrivals (0.2..1 nominal, taller hero), mapProgress clamps, altitudeAt holds 1,617 m through the tilt-in and each height within +/-0.03, linear and continuous between plateaus, 4,478 m at the summit; railFraction k / n; activePin window 0.1, nearer arrival, lower k on a tie, none from 0.9; shouldSnap only past one leg; RangeErrors on bad input"
    requirement: HOME-04
    verification:
      - kind: unit
        ref: "lib/__tests__/ascent-progress.test.ts (39 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Rail readout follows the one damped value: 1,617 m at the top, 1,668 m with waypoint 2 centred, 4,478 m at the summit; five tick labels 1,617 / 1,668 / 2,585 / 2,760 approx. / 4,478 m evenly spaced within 1 px"
    requirement: HOME-04
    verification:
      - kind: unit
        ref: "components/home/__tests__/rail.test.tsx#AltimeterRail labels the n + 1 ticks bottom to top"
        status: pass
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#the readout climbs from the first waypoint to the summit; the rail ticks are evenly spaced"
        status: pass
    human_judgment: false
  - id: D3
    description: "Rail is decorative: inside the aria-hidden stage, pointer-events none, no focusable descendant, no aria-live; hidden at 375 px and visible at 1440 px; under reduced motion ticks only (marker and readout hidden)"
    requirement: HOME-04
    verification:
      - kind: unit
        ref: "components/home/__tests__/rail.test.tsx#is decorative"
        status: pass
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#the rail is decorative and hidden below 768 px; reduced motion shows a static rail and lights no pin"
        status: pass
    human_judgment: false
  - id: D4
    description: "Poster pins: four PinMarks in ascent order at left u x 100% / top v x 100% (anchor within 1 px in Chromium), labels 'Zermatt · 1,617 m' ... 'Riffelsee · 2,760 m approx.', dashed head and stem for the approximate one, one summit mark at terrain.summit.uv; pin 2 lit with its visible label when waypoint 2 is centred, none lit at the summit or under reduced motion"
    requirement: HOME-05
    verification:
      - kind: unit
        ref: "components/home/__tests__/rail.test.tsx#PinMark (D-09); Poster pins (HOME-05, D-09)"
        status: pass
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#poster pins sit at their UV and light with the active stage"
        status: pass
    human_judgment: false
  - id: D5
    description: "Native scroll (HOME-03): a 600 px wheel moves scrollY by 600 +/- 2, no wheel/touchstart/touchmove preventDefault, scroll-snap-type none on html, body and the track, html scroll-behavior auto"
    requirement: HOME-03
    verification:
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#native scroll: no wheel or touch interception, no snapping"
        status: pass
    human_judgment: false
  - id: D6
    description: "Focus contract (D-08): tabbing to 'View photo: Waterfall in the Gornerschlucht' centres its block and the readout shows 1,668 m"
    requirement: HOME-03
    verification:
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#keyboard focus on a card brings its stage to the centre"
        status: pass
    human_judgment: false
  - id: D7
    description: "Feel and look of the damped rail (about 250 ms settle, snap on long jumps), pin and label styling, and the pin/rail overlap at 768 px (the Riffelsee head itself sits inside the rail zone there)"
    verification: []
    human_judgment: true
    rationale: "Motion feel and visual composition are judgement calls; baselined in 09-14 (UI-SPEC E7/E8 backstops)"

duration: 17min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 06: Ascent progress, altimeter rail and poster pins Summary

**Page scroll now drives one damped progress value: Motion's page `useScroll()` maps through the pure `lib/ascent/progress.ts` over a ResizeObserver-measured layout into one `useSpring` (DURATION.panel, no bounce), which jumps instead of animating past one leg. A decorative altimeter rail reads that value: its marker moves by transform and its readout climbs from 1,617 m to 4,478 m, holding each waypoint's DEM height while its card is centred. Four server-rendered poster pins sit at their real UV positions. The active stage's pin lights up with its label, flipped clear of the rail. Keyboard focus on a card scrolls its stage to the centre.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-10-25T00:33:02Z
- **Completed:** 2026-10-25T00:50:36Z
- **Tasks:** 3
- **Files modified:** 12 (8 created, 4 modified)

## Accomplishments
- `lib/ascent/progress.ts` is the single mapping every consumer reads, now and later (the rail, the pins, and the 09-08/09-10 camera). It covers measured arrivals, the tilt-in hold, ±0.03 plateaus with linear legs between their edges, the evenly spaced rail profile, the lit-pin window, and the one-leg snap rule. Every boundary is compared with a 1e-9 tolerance, so `0.4 - 0.03` still lands inside the plateau.
- `AscentController` wraps the Server grid and receives only serialisable props: the waypoint count and the n + 1 heights. It measures the track, the stage's sticky top and the waypoint and summit blocks on mount, on resize and through a track ResizeObserver. It adds no wheel or touch listener and never uses `useScroll({ target })` (STATE 07-21).
- `AltimeterRail` server-renders the five ticks; the Riffelsee tick is dashed. The marker and readout update from `useMotionValueEvent` through refs (no React state per frame), and they are hidden below 768 px and under reduced motion.
- `PinMark` is server-safe (no directive, no hooks). Its lit and flip states are `data-active` and `data-flip` attributes that the controller sets on every `[data-pin]` under the root. `syncPins()` re-applies the current pin for a layer that mounts later (the 3D pins in 09-10).
- Measured in Chromium at 1440 x 900, with waypoint 2 centred: block scroll offsets 828, 1664, 2500, 3336 and 4172 px give readouts of 1,617, 1,668, 2,585, 2,760 and 4,478 m, with the marker at 0, -185, -370, -555 and -740 px (rail box 740 px). With the clear-edge flip rule, every active label clears the rail scrim at 1440 px (it starts at stage x 1206).

## Task Commits

1. **Task 1 RED: failing tests for the ascent progress mapping**: `00e5317` (test)
2. **Task 1 (tracer): one damped progress value drives the altimeter rail**: `eb95f58` (feat)
3. **Task 2 RED: failing tests for poster pins, the summit mark and rail ticks**: `2e7be06` (test)
4. **Task 2: poster pins, label flip, focus contract**: `1bc4693` (feat)
5. **Task 3: shared e2e helpers and the progress e2e**: `44d0caa` (test)

## TDD Gate Compliance

- **RED 1** (`00e5317`): `lib/__tests__/ascent-progress.test.ts` ran against a signature-only `progress.ts` stub, through a flat-TAP Jest reporter in the session scratchpad. `check tdd-red-evidence` returned **RED_EVIDENCE_OK** (`target_test_failed`, format `tap`, no report errors): 39 tests, 1 pass, 38 fail. The target was `… > activePin (lit pin, D-09) > gives a tie to the lower k and otherwise picks the nearer arrival`.
  - **Semantic assessment:** the target ran and failed on its `toBe(1)` assertion, because the stub returned -1. There was no load, import or syntax fault. The one test that passed in RED (monotonic and continuous altitude) is satisfied by the stub's constant -1, so it guards against regressions but cannot drive the implementation.
- **GREEN 1** (`eb95f58`): 39/39 pass.
- **RED 2** (`2e7be06`): `components/home/__tests__/rail.test.tsx` ran with a null-returning `PinMark` stub. **RED_EVIDENCE_OK** (`target_test_failed`, `tap`): 8 tests, 2 pass, 6 fail. The target was `… > Poster pins (HOME-05, D-09) > places one pin per waypoint, in ascent order, at its UV in the sheet box`.
  - **Semantic assessment:** the target failed on `expect(layer).not.toBeNull()` because no poster pin layer existed yet. The two AltimeterRail tests passed in RED because Task 1 had already built the rail, as the plan orders, so they act as characterisation tests.
- **GREEN 2** (`1bc4693`): 8/8 pass.
- No REFACTOR commits were needed.

## Files Created/Modified
- `lib/ascent/progress.ts`: pure, import-free ascent mapping.
- `lib/__tests__/ascent-progress.test.ts`: 39 unit tests covering the nominal UI-SPEC table and its boundaries.
- `components/home/AscentController.tsx`: the client provider. It owns the scroll → spring path, layout measurement, the lit pin and `syncPins`, the label flip and the focus contract.
- `components/home/AltimeterRail.tsx`: the decorative rail (scrim, line, SSR ticks, spring-driven marker and readout).
- `components/home/PinMark.tsx`: the pin and summit marks shared by the poster and 3D layers.
- `components/home/PosterSheet.tsx`: adds `data-sheet-box` and the poster pin layer.
- `components/home/AscentHero.tsx`: wraps the grid in AscentController, mounts the rail in the stage, and derives heights and tick labels from buildWaypoints() and terrain.summit.
- `components/home/__tests__/rail.test.tsx`: 8 component tests for the pins and the rail.
- `e2e/helpers/webgl.ts`, `e2e/helpers/ascent.ts`: shared helpers. `e2e/no-webgl.spec.ts` now imports them; its four tests are unchanged.
- `e2e/home-ascent.spec.ts`: the 7-test `Ascent progress` describe (19 tests in the file).

## Decisions Made
- **Interpolation runs between plateau edges.** The UI-SPEC's "linear between plateaus" is read literally, so the readout never jumps at the edge of a plateau. The nominal midpoints are the same as with whole-leg interpolation.
- **The label flip measures from the clear stage edge** (see Deviations).
- **`data-u` on poster pins.** The flip needs each anchor's u. Passing it as an attribute keeps `buildWaypoints` and the photo data out of the client bundle.
- **useEffectEvent instead of eslint-disable.** Both mount-only effects (the controller's measurement, the rail's box size) call `useEffectEvent` handlers, so the React Compiler and exhaustive-deps rules pass with no suppression comments.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The 240 px flip rule left active labels under the rail**
- **Found during:** Task 2 (browser probe of pin positions)
- **Issue:** Measured from the stage's right edge, the Riffelsee head sat 249 px from the edge at 1440 px, so it did not flip. Its label (stage x 1201 to 1400) then ran under the rail scrim and ticks (from x 1206). Gornerschlucht did the same at 768 px. The UI-SPEC row says the rule keeps labels inside the stage, but it does not account for the rail.
- **Fix:** the edge is now the stage width minus the rail scrim's measured width, which is 0 below 768 px where the rail is hidden. The 240 px threshold is unchanged.
- **Files modified:** components/home/AscentController.tsx
- **Verification:** a Chromium probe at 1440 x 900 with each waypoint centred put the active labels at stage x 819–948, 960–1143, 676–916 and 966–1161, all left of the rail (1206).
- **Committed in:** `1bc4693`
- **Flag for Tim:** this refines a UI-SPEC rule (the E7 overflow row). At 768 px the Riffelsee head itself sits inside the rail zone (head x 663, rail from x 534), so no flip rule can clear it there. That is left for the 09-14 visual review.

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** A small correctness fix to label placement. No scope creep.

## Issues Encountered
- `e2e/no-webgl.spec.ts` "home keeps its content" fails because it waits for a WebGL error that `/` can no longer produce. Home has had no canvas since 09-01: the pre-plan commit `bd16add` matches "Canvas" or "three" only in comments. This is pre-existing (RESEARCH Pitfall 1). It is logged in deferred-items.md for 09-07, which rewrites the test, and left unchanged as the plan requires. The other three tests in that spec pass.
- Under 16-worker dev-server runs, two tests timed out once each during first compiles ("every View photo link…" and no-webgl "project detail keeps its content"). Both passed on the immediate rerun.

## Verification
- Jest: progress (39), rail (8), hero, boundary and the rest of components/home all pass; the full suite runs 40 suites with 550 tests passing. `guard:tests`: jest 550 + e2e 138 = 688 (baseline 533), OK.
- `npm run lint` exit 0 (0 errors; the 24 warnings are all in pre-existing legacy files; palette and contrast OK). `npm run type-check`: no errors.
- Playwright chromium: home-ascent (19/19) and homepage pass. shell passes too, so the focus contract does not disturb the skip-link and Tab loops. no-webgl: 3/4, with the pre-existing home test failing as described above.
- Acceptance greps: `visualDuration: DURATION.panel` 1, `useScroll({` 0, `data-ascent-readout` 1, `data-pin-layer="poster"` 1, `scrollIntoView` 1, `focus-visible` 2, `syncPins` 5, `useState|useEffect` in PinMark 0, `from './helpers/webgl'` 1, `async function disableWebGL` in no-webgl 0, `Ascent progress (HOME-03, HOME-04, HOME-05)` 1, `--list` 19 tests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 09-07 (capability gate) and 09-08 (camera) can read `useAscent().progress` and `layout`; the camera follows the same spring. 09-10's 3D pins render `PinMark` under `data-ascent-root` and call `syncPins()` on mount.
- 09-07 must rewrite no-webgl's "home keeps its content" (see deferred-items.md).
- For 09-14: baseline the rail and pins with `disableWebGL` plus `scrollBlockToCentre`, and review the pin/rail overlap at 768 px.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*
