---
phase: 09-home-ascent
plan: 07
subsystem: ui
tags: [nextjs, next-dynamic, lazy-loading, webgl2, capability-gate, useSyncExternalStore, r3f, safecanvas, reduced-motion, save-data, playwright, axe, contrast]

requires:
  - phase: 09-06
    provides: "AscentController (useAscent, data-ascent-root), AltimeterRail, poster PinMarks hidden under data-ascent-mode=3d, e2e/helpers/webgl.ts and e2e/helpers/ascent.ts"
  - phase: 09-02
    provides: "components/home boundary test (three/R3F only under components/home/terrain/)"
  - phase: 07
    provides: "components/SafeCanvas.tsx (the one R3F Canvas wrapper)"
provides:
  - "lib/ascent/capability.ts: AscentSignals, AscentMode, decideAscentMode (import-free)"
  - "lib/useAscentMode.ts: useAscentMode() ('pending' server snapshot), downgradeAscent(reason) (sticky, performance mark 'ascent-downgrade'), resetAscentModeForTests()"
  - "AscentController context: mode, revealed, markRevealed(), stageRef; named export AscentStageFrame (data-ascent-mode = pending | static-reduced | static | eligible | 3d)"
  - "components/home/TerrainStage.tsx: render-gated next/dynamic ssr:false canvas, armed by requestIdleCallback (4 s) or the first scroll"
  - "components/home/terrain/TerrainCanvas.tsx: lazy chunk entry, SafeCanvas with the 09-UI-SPEC canvas props, data-grid-size, children slot for the 09-08 mesh"
  - "SafeCanvas onCanvasError (CanvasErrorBoundary onError via componentDidCatch)"
  - "e2e/helpers/webgl.ts: spoofSaveData, spoofDeviceMemory"
  - "e2e/home-modes.spec.ts (21 tests) and the rewritten no-webgl 'home keeps its content'"
affects: [09-08, 09-10, 09-11, 09-13, 09-14]

actuals:
  tokens: 13500
  tasks: 3
  commits: 5
plan_head_before: 9c9e4cf0adc4bfabdcd55800da0e70e7beb1a838
plan_head_after: 326417745e89caceb80fbd088a22eef47041cd70

tech-stack:
  added: []
  patterns:
    - "Capability store: cheap signals decide first (pure decideAscentMode with WebGL assumed), and only a device that passes them gets the one WebGL2 probe; the probe context is released at once"
    - "Lazy heavy chunk = next/dynamic ssr:false declared in a Client Component and rendered only behind a state gate (eligible AND armed); no loading component"
    - "Stage state as one data attribute on the client stage frame (AscentStageFrame), styled by group-data-[ascent-mode=…]/stage variants in server children"
    - "Composed contrast measured on rendered pixels: text made transparent, each Range line rect screenshotted, decoded through a 2D canvas, text colour resolved through the same canvas (OKLCH-safe)"

key-files:
  created:
    - lib/ascent/capability.ts
    - lib/__tests__/ascent-capability.test.ts
    - lib/useAscentMode.ts
    - lib/__tests__/useAscentMode.test.tsx
    - components/home/TerrainStage.tsx
    - components/home/terrain/TerrainCanvas.tsx
    - e2e/home-modes.spec.ts
  modified:
    - components/home/AscentController.tsx
    - components/home/AscentHero.tsx
    - components/SafeCanvas.tsx
    - components/__tests__/SafeCanvas.test.tsx
    - e2e/helpers/webgl.ts
    - e2e/no-webgl.spec.ts

key-decisions:
  - "useAscentMode decides on the cheap signals (reduced motion, Save-Data, deviceMemory) before probing WebGL2, so Save-Data and low-memory visitors are never probed (T-09-09) and the decision logic stays in the pure function"
  - "TerrainCanvas puts position: absolute and inset: 0 inline as well as in the class, because R3F writes position: relative inline on its wrapper, which beats the class (verified in a browser: computed position absolute, 1430 x 836 at 1440 px)"
  - "TerrainStage arms once: whichever trigger fires first cancels the other, so a later scroll cannot re-pick the mesh size"
  - "B7/B8 sample the text's own line boxes (Range client rects), not the element's block box: a block <p> is wider than its text, and the one sub-4.5 reading (3.62:1 at 768 px) was a contour index line beside the kicker, where no glyph is drawn"
  - "B8 hides the altimeter cursor while sampling: the opaque readout box covers the label of the tick it sits on, so it is not the background that label is read against"

patterns-established:
  - "09-08's terrain mesh renders as TerrainCanvas children and calls useAscent().markRevealed() after its first drawn frame; the stage then reads '3d' and the canvas fades in over --duration-settle"
  - "09-11's frame-budget sampler and context-loss listener call downgradeAscent('frame-budget' | 'context-lost'); the stage drops to 'static' and TerrainStage unmounts the canvas"
  - "Static-path e2e: spoofSaveData / spoofDeviceMemory / disableWebGL, then assert no /terrain/heightmap- request and no loaded script containing THREE.WebGLRenderer"

requirements-completed: [HOME-02, HOME-07, HOME-08]

coverage:
  - id: D1
    description: "decideAscentMode: reduced motion wins over every other signal; Save-Data, deviceMemory 2, no WebGL2 and MAX_TEXTURE_SIZE 1024 give static; deviceMemory 4, MAX_TEXTURE_SIZE 2048 and undefined saveData/deviceMemory pass"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "lib/__tests__/ascent-capability.test.ts (11 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "useAscentMode: 'pending' in server HTML (renderToString and the live dev page), eligible on a capable client, live reduced-motion change, one WebGL2 probe across renders with loseContext, Save-Data static without probing, deviceMemory 2 static, sticky downgrade with one performance mark"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "lib/__tests__/useAscentMode.test.tsx (9 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "SafeCanvas onCanvasError: called once with the error from componentDidCatch, inert canvas renders, never forwarded to R3F's Canvas, unchanged without the prop; TerrainCanvas downgrades to static on load error"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "components/__tests__/SafeCanvas.test.tsx (7 tests: 3 existing unchanged + 4 new)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Static triggers (no WebGL2, Save-Data, deviceMemory 2): stage 'static', poster visible, no canvas after a scroll and 5 s, no heightmap request, no loaded script containing THREE.WebGLRenderer, every card, trail signs, plaque and About, no alert or 'not supported' text"
    requirement: HOME-08
    verification:
      - kind: e2e
        ref: "e2e/home-modes.spec.ts#static triggers keep the full Home and download nothing heavy (chromium + firefox)"
        status: pass
      - kind: e2e
        ref: "e2e/no-webgl.spec.ts#home keeps its content (chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Capable Chromium (SwiftShader): stage 'eligible' after hydration, no canvas before arming, one canvas (pointer-events none, 512 grid at 1440 px, 256 at 375 px) within 6 s of the first scroll; the loaded scripts then include THREE.WebGLRenderer (positive control)"
    requirement: HOME-08
    verification:
      - kind: e2e
        ref: "e2e/home-modes.spec.ts#a capable device loads the canvas after the first scroll @chromium-only"
        status: pass
    human_judgment: false
  - id: D6
    description: "Reduced motion: 'static-reduced', no canvas after a scroll and 5 s, marker hidden, cards stacked (gap >= 40 px), document.getAnimations() empty; turning reduce on mid-visit unmounts the canvas"
    requirement: HOME-07
    verification:
      - kind: e2e
        ref: "e2e/home-modes.spec.ts#reduced motion is the compact final state with no canvas; turning reduced motion on mid-visit removes the canvas @chromium-only"
        status: pass
    human_judgment: false
  - id: D7
    description: "No sideways scroll at 375 x 812 in static, static-reduced and eligible modes (top, waypoint 2 centred, summit centred); layout-shift sum below 0.1 from load through arming (eligible and static)"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-modes.spec.ts#nothing scrolls sideways at 375 px; no layout shift from load through arming @chromium-only"
        status: pass
    human_judgment: false
  - id: D8
    description: "B5: in all five setups (capable, no WebGL2, Save-Data, deviceMemory 2, reduced motion) both cue fragments resolve and 'Skip to the summit' focuses #summit"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-modes.spec.ts#B5: the cue links work in every mode (chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D9
    description: "B7/B8 composed contrast on rendered pixels: hero kicker, h1, role, thesis and both cue links >= 5.88:1 at 375, 768 and 1440 px; rail tick labels >= 4.81:1 at 768 and 1440 px with the summit centred; axe color-contrast clean on /"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-modes.spec.ts#B7: hero text over the relief keeps 4.5:1; B8: rail tick labels keep 4.5:1 at the summit (chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D10
    description: "The canvas reveal itself (opacity 0 -> 1 over --duration-settle, poster pins hiding in the same frame) and the look of the static modes"
    verification: []
    human_judgment: true
    rationale: "Nothing draws yet: the stage stays 'eligible' with the canvas at opacity 0 until 09-08's mesh calls markRevealed(). The fade and the static modes' look are judged visually in 09-14"

duration: 14min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 07: Capability gate and render-gated lazy canvas Summary

**Home now decides per device between the 3D ascent and the static poster. A pure `decideAscentMode` runs over signals read once on the client: reduced motion, Save-Data, `deviceMemory`, and a released WebGL2 probe with `failIfMajorPerformanceCaveat` and `MAX_TEXTURE_SIZE`. The verdict goes onto the stage as `data-ascent-mode` (`pending` in server HTML, so hydration never mismatches). Only an eligible device renders the `next/dynamic` `ssr: false` canvas chunk, and only once `requestIdleCallback` or the first scroll arms the stage. The chunk mounts a SafeCanvas at opacity 0. Static visitors never fetch three.js or a heightmap, and a failing canvas turns Home static for the rest of the page view.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-10-25T00:54:20Z
- **Completed:** 2026-10-25T01:08:30Z
- **Tasks:** 3
- **Files modified:** 13 (7 created, 6 modified)

## Accomplishments
- `lib/ascent/capability.ts` holds the whole D-18 rule as one import-free function. `lib/useAscentMode.ts` wraps it in a `useSyncExternalStore` store. Reduced motion is read live, so its `change` event unmounts the canvas mid-visit. Save-Data and `deviceMemory` are read once. The WebGL2 probe runs at most once per page view, and only on a device that passed the cheap signals. The renderer string is never read.
- `AscentStageFrame` (client) now renders the stage div with the classes and attributes moved out of the Server `AscentHero`. It writes `revealed && mode === 'eligible' ? '3d' : mode`, so 09-08 only has to call `markRevealed()`. Geometry is untouched: only the `motion-reduce:` CSS compacts the layout (gate row D4).
- `TerrainStage` declares the dynamic import at module scope with no `loading` option. It renders nothing unless the mode is `eligible` and the stage is armed. Arming fires once, takes the mesh size from the stage width (256 below 768 px, else 512) and cancels the other trigger.
- `TerrainCanvas` (the chunk entry) renders SafeCanvas with `frameloop="demand"`, `dpr={[1, 1.5]}`, `resize={{ scroll: false }}`, `flat`, an opaque high-performance antialiased context, `aria-hidden` and no pointer events. It stays at opacity 0 until the stage reads `3d`. Browser-verified at 1440 px: `pending` in server HTML, `eligible` after hydration, no canvas before arming, then a canvas at `position: absolute`, 1430 x 836, opacity 0, `pointer-events: none`, `data-grid-size="512"`, and native scroll unchanged (wheel 300 -> scrollY 300).
- SafeCanvas gained `onCanvasError`, which `CanvasErrorBoundary` calls from `componentDidCatch`. TerrainCanvas wires it to `downgradeAscent('load-error')`.
- `e2e/home-modes.spec.ts` covers the static, reduced and eligible modes (21 tests), and the old no-webgl hang is gone (resolved in deferred-items.md).

## Task Commits

1. **Task 1 RED: failing tests for the capability decision**: `02ba953` (test)
2. **Task 1 (tracer): capability gate and render-gated lazy canvas chunk**: `9e32672` (feat)
3. **Task 2 RED: failing SafeCanvas onCanvasError tests and the useAscentMode store tests**: `48fc408` (test)
4. **Task 2: SafeCanvas onCanvasError and the sticky static downgrade**: `542bef5` (feat)
5. **Task 3: Home modes e2e, static triggers, reduced motion, composed contrast**: `3264177` (test)

## TDD Gate Compliance

- **RED 1** (`02ba953`): `lib/__tests__/ascent-capability.test.ts` ran against a signature-only `capability.ts` stub that returns `'static'`, through the flat-TAP Jest reporter in the session scratchpad. `check tdd-red-evidence` returned **RED_EVIDENCE_OK** (`target_test_failed`, format `tap`): 11 tests, 4 pass, 7 fail. The target was `… > returns static-reduced under reduced motion even when every other signal passes`.
  - **Semantic assessment:** the target executed and failed on its `toBe('static-reduced')` assertion (received `'static'`). There was no load, import or syntax fault. The four tests that passed in RED expect `'static'`, which the constant stub happens to satisfy. They guard against regressions but cannot drive the implementation.
- **GREEN 1** (`9e32672`): 11/11 pass.
- **RED 2** (`48fc408`): SafeCanvas and useAscentMode suites, 16 tests, 14 pass, 2 fail. **RED_EVIDENCE_OK** (`target_test_failed`, `tap`). The target was `… > onCanvasError (D-18: a failed canvas turns Home static) > is called once with the error when the canvas throws, and the inert canvas renders`.
  - **Semantic assessment:** the target failed on `toHaveBeenCalledTimes(1)` (0 calls), because SafeCanvas had no `onCanvasError` path. "is not forwarded to the R3F Canvas" failed for the right reason too: the prop reached the mocked Canvas. The nine useAscentMode tests passed in RED because the plan orders the store's build in Task 1, so they act as characterisation tests of that store. "is not called while the canvas renders" and "without the prop…" pass by design (they pin unchanged behaviour).
- **GREEN 2** (`542bef5`): 21/21 across SafeCanvas, useAscentMode and useReducedMotion.
- No REFACTOR commits were needed.

## Files Created/Modified
- `lib/ascent/capability.ts`: the pure capability decision.
- `lib/__tests__/ascent-capability.test.ts`: 11 unit tests (every threshold and both undefined signals).
- `lib/useAscentMode.ts`: the client store, the sticky downgrade and the test reset.
- `lib/__tests__/useAscentMode.test.tsx`: 9 store tests (server snapshot, probe once, live reduce, downgrade).
- `components/home/AscentController.tsx`: `mode`, `revealed`, `markRevealed` and `stageRef` in the context, plus the `AscentStageFrame` export.
- `components/home/AscentHero.tsx`: the stage through `AscentStageFrame`, with PosterSheet, TerrainStage and AltimeterRail in that paint order.
- `components/home/TerrainStage.tsx`: the render-gated lazy loader.
- `components/home/terrain/TerrainCanvas.tsx`: the chunk entry.
- `components/SafeCanvas.tsx`, `components/__tests__/SafeCanvas.test.tsx`: `onCanvasError` plus 4 tests (the 3 existing tests are unchanged; the mock now records its props).
- `e2e/helpers/webgl.ts`: `spoofSaveData`, `spoofDeviceMemory`.
- `e2e/no-webgl.spec.ts`: "home keeps its content" rewritten to assert static mode. The other three tests are untouched.
- `e2e/home-modes.spec.ts`: the modes spec.

## Decisions Made
- **Probe only when needed.** `getSnapshot` first calls `decideAscentMode` with WebGL assumed present. A Save-Data, low-memory or reduced-motion visitor is never probed, and the thresholds still live in one pure function.
- **Inline absolute positioning on the canvas wrapper** (see Deviations): the class alone loses to R3F's inline `position: relative`.
- **Contrast is sampled on line boxes** (see Deviations).
- **The readout is hidden during B8.** Its opaque box covers the active tick's label, so the label is never read against it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The canvas class could not position the R3F wrapper**
- **Found during:** Task 1
- **Issue:** The plan's TerrainCanvas puts `absolute inset-0` in `className` and only `pointerEvents: 'none'` in `style`. R3F's Canvas writes `position: relative; width: 100%; height: 100%` inline on its wrapper (react-three-fiber.esm.js:160-168), and inline styles beat the class, so the canvas would sit in flow instead of over the poster.
- **Fix:** `style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}`. The class keeps `absolute inset-0` for the inert fallback and for readability.
- **Files modified:** components/home/terrain/TerrainCanvas.tsx
- **Verification:** the browser probe read computed `position: absolute`, a 1430 x 836 box filling the stage, and `pointer-events: none`.
- **Committed in:** `9e32672`

**2. [Rule 1 - Bug] B7 sampled pixels beside the text, not behind it**
- **Found during:** Task 3 (first Chromium run: the kicker read 3.62:1 at 768 px)
- **Issue:** The kicker is a block `<p>` 576 px wide, but its text (a coordinate string) is about 180 px wide. A diagnostic run showed only 8 of 11,520 pixels below 4.5, and the worst sat at x = 476: a contour index line where no glyph is drawn. With the block box, B7 measured pixels the text is never read against.
- **Fix:** `worstContrastBehind` screenshots each rendered line of the element's content (`Range.getClientRects()`) and takes the minimum. Measured worst cases are now: kicker 7.09 / 6.84 / 7.83, role 5.88 / 7.30 / 7.65, and every other hero element 7.39 or higher (375 / 768 / 1440 px). Each value is recorded as a test annotation.
- **Files modified:** e2e/home-modes.spec.ts
- **Verification:** B7 and B8 pass in Chromium and Firefox. The measured values are real ratios, not a trivially large result.
- **Committed in:** `3264177`
- **Flag for Tim:** this narrows the literal B7 wording ("behind each hero text element's bounding box") to the text's line boxes. Separately, the hero scrim changes to its horizontal gradient at `lg:`, not at 768 px as the UI-SPEC says. Both are logged in deferred-items.md for the 09-14 review. HeroBlock is not in this plan's files.

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both are correctness fixes. Neither changes scope or touches a file outside the plan.

## Issues Encountered
- The first Firefox run reported "Executable doesn't exist" (firefox-1555). Gate row E1 approved the local install, so `npx playwright install firefox` downloaded Firefox 157 (playwright v1555). No manifest or lockfile changed (`git status` checked), and the rerun passed 21/21.
- The RED evidence records were written inside the project for the classifier (`.gsd-red/`), then moved to the session scratchpad. Nothing was committed from there.

## Known Stubs
- `components/home/terrain/TerrainCanvas.tsx`: the canvas renders no scene yet. This is intentional and plan-stated: 09-08 adds the terrain mesh as `children` and calls `markRevealed()` after its first drawn frame. Until then, an eligible device keeps the canvas at opacity 0 over the complete poster (the D-19 "3D not ready yet" state), so the page goal is met.

## Verification
- Jest: capability (11), useAscentMode (9), SafeCanvas (7), useReducedMotion (5) and boundary all pass. The full suite runs 42 suites with 574 tests passing. `guard:tests`: jest 574 + e2e 160 = 734 (baseline 533), OK.
- `npm run lint`: exit 0 (0 errors; the 24 warnings are all in pre-existing legacy files). `npm run type-check`: no errors. `npm run build`: exit 0, then `git checkout -- public/service-worker.js`.
- Playwright chromium: home-modes, no-webgl and home-ascent all pass (45/45). Firefox: home-modes and no-webgl pass (21/21; the 5 `@chromium-only` tests are filtered out by the project's `grepInvert`).
- Acceptance greps: `ssr: false` 1 and `loading:` 0 in TerrainStage; `frameloop="demand"` 1 and `scroll: false` 1 in TerrainCanvas; `AscentStageFrame` 4 in AscentHero; `data-ascent-mode` 3 in AscentController; `componentDidCatch` 1 in SafeCanvas; no `webglFailure` line between 'home keeps its content' and 'contact keeps the form'; `THREE.WebGLRenderer` 3 and `color-contrast` 2 in home-modes; no `.skip`, `.only` or `.fixme`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 09-08: render the terrain mesh as `TerrainCanvas` children, read `gridSize` (256 or 512) for the heightmap, and call `useAscent().markRevealed()` after the first drawn frame. `stageRef` is in the context for sizing and the off-screen observer.
- 09-11: call `downgradeAscent('frame-budget')` and `downgradeAscent('context-lost')`. Both are sticky, and the canvas unmounts at once.
- 09-14: review the hero scrim breakpoint and the 4.81:1 Riffelsee rail label at 768 px (deferred-items.md), and recheck B8 once a live canvas sits behind the rail.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*

## Self-Check: PASSED

All 7 created files exist. Commits 02ba953, 9e32672, 48fc408, 542bef5 and 3264177 are ancestors of HEAD, and evaluation-scope resolves the 09-07 plan commits on this branch.
