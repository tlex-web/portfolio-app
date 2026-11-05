---
phase: 09-home-ascent
plan: 11
subsystem: ui
tags: [three, react-three-fiber, webgl, frame-budget, context-loss, intersection-observer, playwright, swiftshader, jest, tdd]

requires:
  - phase: 09-10
    provides: "CameraRig route flight and spring-change invalidation, PinLayer3D, e2e/home-canvas.spec.ts route tests"
  - phase: 09-08
    provides: "TerrainCanvas (SafeCanvas, dpr [1, 1.5]), TerrainMesh, reveal and fade"
  - phase: 09-07
    provides: "downgradeAscent(reason) (sticky), TerrainStage unmounts the canvas when the mode leaves 'eligible'"
provides:
  - "lib/ascent/frame-budget.ts (import-free): FrameBudgetVerdict, FRAME_BUDGET_DEFAULTS { minSamples 20, maxMedianMs 50, burstWindowMs 1000 }, createFrameBudget"
  - "components/home/terrain/ContextLossGuard.tsx: webglcontextlost -> downgradeAscent('context-lost'), with a disposing guard against R3F's own forceContextLoss"
  - "CameraRig: reveal burst feeding the frame budget, one DPR step-down (setDpr(1) + onDprStepDown) before downgradeAscent('frame-budget'), performance mark 'ascent-frame-budget' { medianMs, samples, verdict, dpr }"
  - "CameraRig: IntersectionObserver + visibilitychange pause; one catch-up invalidate when shown again; a burst cut by a pause restarts with a fresh budget"
  - "Test-only measure-only switch window.__ascentBudgetMeasureOnly (Tim's option A): verdict still marked, a decline acts on nothing"
  - "e2e/helpers/webgl.ts: countDraws, readDraws, budgetMeasureOnly"
  - "9 new e2e tests in e2e/home-canvas.spec.ts (23 in the file), 10 unit tests (frame-budget)"
affects: [09-12, 09-13, 09-14]

actuals:
  tokens: 21078    # chars/4 over the 8 files changed (84,312 chars)
  tasks: 3
  commits: 5
plan_head_before: b990765635a84cf285e6be11b5c15742cb00cba8
plan_head_after: aac0cd5823bce21f78fc89213f2866314cecc4c6

tech-stack:
  added: []
  patterns:
    - "Demand-aware frame budget: only continuous frames (the previous frame requested this one) are sampled, inside a forced reveal burst, so demand-mode idle time is never read as low FPS"
    - "Context-loss listener with a disposing ref set before the listener is removed, so R3F's own teardown never downgrades"
    - "Test-only switches are window.__camelCase properties set by a Playwright init script (the e2e convention of window.__draws/__workers/__modes), read once at decision time and typed through a local intersection type"
    - "A runtime fallback is proven by forcing the slow condition (frames held by a busy wait in requestAnimationFrame), never by skipping on a fast machine: the test-count guard forbids .skip("

key-files:
  created:
    - lib/ascent/frame-budget.ts
    - lib/__tests__/frame-budget.test.ts
    - components/home/terrain/ContextLossGuard.tsx
  modified:
    - components/home/terrain/CameraRig.tsx
    - components/home/terrain/TerrainCanvas.tsx
    - components/home/AscentController.tsx
    - e2e/helpers/webgl.ts
    - e2e/home-canvas.spec.ts

key-decisions:
  - "Rule-4 checkpoint, decided by Tim: \"A: measure-only flag (Recommended)\". A test-only init-script flag makes CameraRig record the frame-budget verdict without acting on it; only the six desktop-size tests that need '3d' opt in; one real-decline e2e runs at 1440 x 900 with no flag; real visitors are unaffected"
  - "The flag is window.__ascentBudgetMeasureOnly, which follows the e2e window.__draws convention (the product had no test hooks before). It is read once per verdict and only consulted on a decline"
  - "The real-decline e2e holds every frame to 60 ms instead of using test.skip when a machine holds the budget, because scripts/guards/test-count.mjs fails on any .skip( in e2e (\"tests are rewritten, never skipped\"). It declines on every machine and cannot pass vacuously"
  - "The demand-aware sampler replaces drei's PerformanceMonitor (correction C4): median sorted[length >> 1], 50 ms passes, under 20 frames in the first 1000 ms declines"
  - "TerrainCanvas keeps dpr in state, because R3F re-applies the dpr prop on every Canvas render and would undo setDpr(1)"

patterns-established:
  - "Desktop-size 3D e2e tests call budgetMeasureOnly(page) before goto; phone-size (256 mesh) tests keep the real budget and first assert it passed (expectBudgetOk)"
  - "The CI frame-budget line comes only from 'records the frame-budget verdict' (412 x 839 and 1440 x 900, no flag); the literal 'ascent frame budget:' appears once in the spec"

requirements-completed: [HOME-02, HOME-07]

coverage:
  - id: D1
    description: "A lost WebGL context (WEBGL_lose_context) turns Home static at once: no canvas, no 3D pin layer, poster pins visible, no error page, all four cards, #summit and About present, downgrade ['context-lost'], still static 5 s later after scrolling (no retry)"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#context loss falls back to the poster @chromium-only"
        status: pass
    human_judgment: false
  - id: D2
    description: "Demand-aware frame budget (pure): ok on the 21st continuous 16 ms frame, decline at 60 ms, idle gaps add no interval, under 20 frames in 1000 ms declines, median sorted[length >> 1], 50 ms passes and 51 ms declines"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "lib/__tests__/frame-budget.test.ts#createFrameBudget (D-18, C4)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A device too slow for the budget ends on the full static poster with no flag: every verdict 'decline' for a named reason, mode 'static', no canvas, no 3D pins, poster pins visible, downgrade ['frame-budget'], all cards, no page error (1440 x 900, frames held to 60 ms)"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#a slow device declines to the poster @chromium-only"
        status: pass
    human_judgment: false
  - id: D4
    description: "The canvas renders on demand and pauses: no draw in 1 s at rest, none in 1 s with the stage scrolled above the viewport, none while the tab is hidden across a whole leg of progress, and it draws again within 1 s of the tab showing"
    requirement: HOME-07
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#draws nothing at rest @chromium-only"
        status: pass
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#draws nothing off-screen @chromium-only"
        status: pass
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#pauses while the tab is hidden @chromium-only"
        status: pass
    human_judgment: false
  - id: D5
    description: "Reduced motion on then off remounts the canvas back to '3d' through ['eligible', '3d'], with exactly one canvas and no downgrade from the canvas's own context teardown"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#a remount returns to 3D @chromium-only"
        status: pass
    human_judgment: false
  - id: D6
    description: "Each frame-budget verdict is marked and printed as one CI line, at 412 x 839 and 1440 x 900 (local: ok at 17.1 ms over 20 samples; decline at 68.0 ms over 14 samples, dpr 1)"
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#records the frame-budget verdict at 412 x 839 / 1440 x 900 @chromium-only"
        status: pass
    human_judgment: false
  - id: D7
    description: "On real devices: the canvas fades in without a jump, scrolling stays smooth, the climb is comfortable, the summit shows all four pins, and an old or low-memory phone gets the full static poster"
    requirement: HOME-07
    verification: []
    human_judgment: true
    rationale: "Real GPU frame times and vestibular comfort cannot be emulated by SwiftShader; this is the plan's end-of-phase <human-check> (record devices and results in 09-UAT.md)"

duration: about 45 min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 11: Canvas Resilience Summary

**A lost WebGL context or a device that cannot hold a 50 ms median frame ends on the full static poster. A demand-aware frame budget first steps the DPR down to 1, the canvas draws only on change and pauses off-screen and in hidden tabs, and a test-only measure-only flag (Tim's option A) keeps the six desktop-size 3D tests in '3d' under SwiftShader.**

## Performance

- **Duration:** about 45 min, across two executor sessions. The start is the phase-start timestamp in STATE.md.
- **Started:** 2026-10-25T09:46:55Z
- **Completed:** 2026-10-25T10:30:00Z
- **Tasks:** 3 (plus the Rule-4 follow-up commit)
- **Files modified:** 8 (3 created, 5 modified)

## Accomplishments
- ContextLossGuard: a lost context makes Home static for the rest of the page view, with no retry and no error UI. R3F's own `forceContextLoss` on unmount never triggers it.
- `lib/ascent/frame-budget.ts` replaces drei's PerformanceMonitor (C4). CameraRig runs a reveal burst at least `DURATION.settle` long. The first decline steps to DPR 1 and measures again, and a second decline turns Home static. Every verdict leaves the `ascent-frame-budget` mark.
- Rendering pauses through an IntersectionObserver and `visibilitychange`, then catches up once when the canvas shows again. A draw counter proves nothing is drawn at rest, off-screen or in a hidden tab.
- Option A: `window.__ascentBudgetMeasureOnly` plus `budgetMeasureOnly(page)`. Six tests opt in, and the real decline path is proven at 1440 x 900 with no flag.

## Task Commits

1. **Task 1 (tracer): lost WebGL context falls back to the static poster**: `4b117dd` (feat)
2. **Task 2 RED: failing tests for the frame budget**: `12134ae` (test)
3. **Task 2 GREEN: demand-aware frame budget with one DPR step-down**: `3a44a96` (feat)
4. **Task 3: off-screen and hidden-tab pause; on-demand, remount and verdict e2e**: `09e8fef` (feat)
5. **Rule-4 decision (Tim's option A): measure-only frame-budget flag for desktop-size e2e**: `aac0cd5` (fix)

**Plan metadata:** see the docs(09-11) commits after this SUMMARY.

## Files Created/Modified
- `lib/ascent/frame-budget.ts`: pure sampler (`createFrameBudget`, `FRAME_BUDGET_DEFAULTS`, `FrameBudgetVerdict`)
- `lib/__tests__/frame-budget.test.ts`: 10 unit tests (the plan's behaviour cases)
- `components/home/terrain/ContextLossGuard.tsx`: guarded `webglcontextlost` listener
- `components/home/terrain/CameraRig.tsx`: reveal burst, DPR step-down, static fallback, pause gates, measure-only read
- `components/home/terrain/TerrainCanvas.tsx`: renders ContextLossGuard; dpr in state, pinned to 1 after the step-down
- `components/home/AscentController.tsx`: `revealed` resets when the mode leaves 'eligible'
- `e2e/helpers/webgl.ts`: `countDraws`, `readDraws`, `budgetMeasureOnly`
- `e2e/home-canvas.spec.ts`: 9 new tests, plus the six opt-ins and the `slowFrames` helper

## Decisions Made

**Rule-4 checkpoint, frame budget versus the desktop-size e2e.** The budget works as designed. Local Chromium SwiftShader at 1440 x 900 (the 512² mesh) runs median frames of 74–152 ms against `maxMedianMs` 50, so it declines and Home goes static. At 412 x 839 (256²) the medians are 18–31 ms. Six existing 09-08/09-10 tests need 3D at 1280 x 720 or 1440 x 900, and they failed after '3d' because the canvas was removed. Tim's literal selection was:

> "A: measure-only flag (Recommended)"

The option text he was shown: "Test-only init-script flag: CameraRig records the verdict but doesn't act on it. Only the 6 desktop tests opt in; add one real-decline e2e at 1440. Real visitors unaffected."

Applied in `aac0cd5`:
- **Product.** CameraRig reads `window.__ascentBudgetMeasureOnly === true` only when a verdict is 'decline'. When it is set, the mark is still recorded but there is no `setDpr`, no `onDprStepDown` and no `downgradeAscent`. When it is unset, behaviour is byte-for-byte what 3a44a96 committed. It is typed through `Window & { __ascentBudgetMeasureOnly?: boolean }`, with no `any`. The name follows the e2e `window.__draws` convention, since no product test hooks existed.
- **Opted in, and only these six:** 'canvas fades in over the poster at p = 0' (1440 x 900), 'no worker and no CSP violation', 'reveal keeps the layout', 'a late canvas reveals at the current progress', 'pins hand over at the reveal' (the last four at the default 1280 x 720), and 'summit frame shows every waypoint at 1440 x 900'. Every other test keeps the real budget, including both 'records the frame-budget verdict' tests.
- **Real decline:** 'a slow device declines to the poster' at 1440 x 900 with no flag. See deviation 8 for why it forces slow frames rather than skipping.

**Other decisions:** C4's demand-aware sampler in place of drei's monitor (gate row C4). `dpr` moved into TerrainCanvas state (deviation 1).

## Deviations from Plan

### Auto-fixed Issues (previous executor, tasks 1–3, copied as reported)

**1. [Rule 1] TerrainCanvas `dpr` moved into state.** R3F re-runs `configure()` on every Canvas render, which re-applies the `dpr` prop and would undo `setDpr(1)` on the next resize. The rig's `onDprStepDown` now pins the prop to 1, and a module flag keeps the step-down for the rest of the page view (3a44a96). The plan said to leave the prop as [1, 1.5].

**2. [Rule 1] AscentController `revealed` was never reset.** After reduced motion went on and off again, the stage read '3d' at once, so the remounted, undrawn canvas showed opaque over the poster. `revealed` now resets whenever the mode leaves 'eligible'. The remount e2e asserts the modes go ['eligible', '3d'], and it failed before the fix. This file is outside the plan's list (09e8fef).

**3. [Rule 2]** A burst interrupted by a hidden tab or an off-screen stage starts over with a fresh budget, so a backgrounded tab during the reveal isn't read as a slow device.

**4.** The verdict test runs twice, at 412x839 and at 1440x900, so 09-13 gets both CI lines. The literal `ascent frame budget:` appears once in the spec.

**5.** The draw tests run at 412x839 and first assert that the budget passed, since a declined device has no canvas and would otherwise pass them vacuously.

**6.** Off-screen test scroll: it puts About at the top, then nudges the stage's last 15 px out of the viewport, because `scrollIntoView` alone left them showing. This test is a backstop; the pause gate itself is proven by the hidden-tab test.

### Checkpoint decision and follow-up (this session)

**7. [Rule 4 - Architectural, decided by Tim] Measure-only frame-budget flag for the desktop-size e2e**
- **Found during:** Task 3 verification (home-canvas + home-modes with 1 worker gave 38 passed, 6 failed)
- **Issue:** The real 50 ms budget declines on local SwiftShader at the 512² mesh, so the six 09-08/09-10 tests that need '3d' at a desktop size lost their canvas
- **Fix:** Tim's option A, quoted above. A test-only init-script flag, six opt-ins and one real-decline e2e
- **Files modified:** components/home/terrain/CameraRig.tsx, e2e/helpers/webgl.ts, e2e/home-canvas.spec.ts
- **Verification:** 45/45 green with 1 worker. Probe: with the product ignoring the flag, 'fades in' and 'summit at 1440' fail. Probe: with measure-only applied to everyone, the real-decline test fails (Received '3d', expected 'static')
- **Committed in:** aac0cd5

**8. [Rule 3 - Blocking] The real-decline test forces slow frames instead of using `test.skip`**
- **Found during:** step 3 of the resume instructions (`npm run guard:tests`)
- **Issue:** The orchestrator suggested `test.skip(verdict === 'ok', reason)` for a machine that holds the budget at 1440. `scripts/guards/test-count.mjs` fails on any `.skip(` in e2e ("tests are rewritten, never skipped"), and the project guard takes precedence
- **Fix:** Before load, `slowFrames(page, 60)` busy-waits 60 ms before each `requestAnimationFrame` callback, so the device is too slow on every machine. The test asserts, in order: '3d' was reached; a final verdict (ok, or decline at DPR 1); every verdict is 'decline'; the final one is under `minSamples` or over `maxMedianMs`; mode 'static'; no canvas; no 3D pin layer; poster pins visible; downgrade `['frame-budget']`; no error page; all cards; no page error. The unslowed 1440 verdict (the CI reference) still comes from 'records the frame-budget verdict at 1440 x 900'
- **Files modified:** e2e/home-canvas.spec.ts
- **Verification:** 3/3 with `--repeat-each=3`; guard:tests OK
- **Committed in:** aac0cd5

---

**Total deviations:** 8 (2 Rule 1, 1 Rule 2, 1 Rule 3, 3 test-design notes, 1 Rule 4 decided by Tim)
**Impact on plan:** The product change for option A is one property read on the decline path. Real visitors behave exactly as Task 2 specified. No scope creep.

## TDD Gate Compliance

- **RED** (`12134ae`, test(09-11)): `check tdd-red-evidence` returned RED_EVIDENCE_OK (target_test_failed, TAP). The target was "createFrameBudget (D-18, C4) > passes on the 21st continuous 16 ms frame and is pending before it", which failed on toBe('ok') against the stub's 'pending'. 2 of 10 passed against the stub (defaults, empty state). Semantic assessment: the target ran and failed on the planned assertion, not on a load or syntax fault.
- **GREEN** (`3a44a96`, feat(09-11)): 10/10.
- **REFACTOR:** none needed.

## Mutation Probes

Each was restored afterwards:
- Disabling the downgrade in ContextLossGuard failed the context-loss e2e (previous executor).
- Removing the visibility gate failed "pauses while the tab is hidden" (32 vs 56 draws) (previous executor).
- With the product ignoring the measure-only flag, 'canvas fades in over the poster at p = 0' and 'summit frame shows every waypoint at 1440 x 900' failed (this session).
- With measure-only applied to everyone, 'a slow device declines to the poster' failed: mode '3d', expected 'static' (this session).

## Verification

- `npx playwright test e2e/home-canvas.spec.ts e2e/home-modes.spec.ts --project=chromium --workers=1`: **45 passed** (2.2 min), 0 skipped. It printed `ascent frame budget: median 17.1 ms, samples 20, verdict ok, dpr 1 (412 x 839)` and `ascent frame budget: median 68.0 ms, samples 14, verdict decline, dpr 1 (1440 x 900)`
- Jest 630/630 (46 suites); `npm run lint` exit 0; `npm run type-check` clean; `npm run guard:tests` OK (jest 630 + e2e 183 = 813, baseline 533)
- Acceptance greps: ContextLossGuard `webglcontextlost` 3; TerrainCanvas `ContextLossGuard` 3; frame-budget.ts imports 0; CameraRig `ascent-frame-budget` 2, `setDpr` 3, `IntersectionObserver` 4, `visibilitychange` 3; no PerformanceMonitor import or element (git grep exit 1); `ascent frame budget:` once in the spec; 23 tests listed in home-canvas.spec.ts (≥19)

## Issues Encountered
- The guard's ban on `.skip(` conflicted with the suggested skip-on-fast-machine design. It was resolved by making the decline deterministic (deviation 8).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **HOME-08 perf project and the frame budget.** The perf spec uses its own Pixel 7 contexts (412 x 839 CSS, DPR 2.625, so the canvas uses 1.5 and the 256 mesh), 4x CPU slowdown and a 1.6 Mbps / 150 ms network. A local probe with that exact profile against the dev server, 3 runs, went 'ok' every time: median **38.2, 45.1 and 43.3 ms** over 20 samples at DPR 1.5, mode '3d' at about 15.5 s, no downgrade. It does not decline locally, so the perf project is unchanged. **It is at risk on CI:** the headroom is only 5–12 ms, and a 4-vCPU runner's SwiftShader is likely slower than this machine. One more fact matters to 09-12 Task 3 and 09-13. The perf spec's `settledMode` returns on the first settled mode, and '3d' comes before the verdict (the burst starts at the reveal). So a later decline would still be recorded as mode '3d', with the canvas chunk already counted. The perf JSON's `mode` therefore cannot show a budget decline. If 09-13 needs '3d' to mean "stayed 3D", it should opt the perf contexts in with `context.addInitScript(() => { window.__ascentBudgetMeasureOnly = true })` (the same flag, typed as in e2e/helpers/webgl.ts), or log the `ascent-frame-budget` marks per run.
- **This settles the frame-budget half of 09-13 Task 3 early.** Tim chose option A at this plan's checkpoint, so automation keeps the real 50 ms budget, and only the desktop-size 3D tests opt into measure-only. 09-13 still decides the HOME-08 gate (total vs initial bytes, LCP). **09-14 Task 1 must apply option A, which is already in place, instead of its total-relax (`maxMedianMs: 66`) or total-webdriver (`shouldSampleFrameBudget`) variants.** The 09-13 and 09-14 plan files were not edited; the orchestrator surfaces this to Tim.
- **The CI frame-budget lines** still come from 'records the frame-budget verdict' at 412 x 839 and 1440 x 900, with no flag, so 09-13's CI log shows CI's real verdict at both sizes.
- **Pending end-of-phase human check** (D7): real devices (an iPhone, a mid-range Android, a laptop) for smoothness, comfort, the summit pins and the static fallback on an old phone.

## Self-Check: PASSED

- FOUND: lib/ascent/frame-budget.ts, lib/__tests__/frame-budget.test.ts, components/home/terrain/ContextLossGuard.tsx, components/home/terrain/CameraRig.tsx, components/home/terrain/TerrainCanvas.tsx, components/home/AscentController.tsx, e2e/helpers/webgl.ts, e2e/home-canvas.spec.ts
- FOUND commits on this branch: 4b117dd, 12134ae, 3a44a96, 09e8fef, aac0cd5 (`git rev-list --count b990765..HEAD` = 5)

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*
