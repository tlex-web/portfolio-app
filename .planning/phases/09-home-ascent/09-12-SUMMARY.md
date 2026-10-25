---
phase: 09-home-ascent
plan: 12
subsystem: ui
tags: [copy, d-14, camera, three, setViewOffset, summit, playwright, home-08, perf]

requires:
  - phase: 09-10
    provides: "lib/ascent/route.ts named constants, CameraRig view offsets, summit look-back, 'summit frame shows every waypoint' e2e"
  - phase: 09-11
    provides: "budgetMeasureOnly (Tim's option A) for desktop-size 3D e2e; final frame-budget code in the chunk"
  - phase: 09-09
    provides: "HOME-08 early signal (441,170 B total, 27,600 B headroom) and the trim lever"
provides:
  - "home.about.status 'approved' (Tim approved the drafted About and contact copy, D-14)"
  - "Terrain tuning confirmed at the research defaults: RELIEF_EXAGGERATION 1.0, SUMMIT_PULLBACK_M 450, --relief-opacity 0.32"
  - "Summit framing that keeps all four 3D pins clear of the summit plaque: SUMMIT_WIDE_HFOV_DEG 75, SUMMIT_VIEW_OFFSET_X_SHARE 0.095 (wide), SUMMIT_VIEW_OFFSET_Y_SHARE 0.08 (narrow); summitHfovDeg, summitViewOffsetXAt, summitViewOffsetYAt"
  - "e2e 'summit pins clear the plaque' at 1440 x 900, 1280 x 720 and 412 x 839; data-summit-plaque test hook"
  - "HOME-08 pre-CI byte check on the final chunk: 444,761 B total, 24,009 B headroom, mode 3d"
affects: [09-13, 09-14]

actuals:
  tokens: 4375
  tasks: 3
  commits: 2
plan_head_before: 9af935538f1bfeaae2953b6d788ea2fa53a90509
plan_head_after: fc24d57

tech-stack:
  added: []
  patterns:
    - "Layout-aware framing via the projection, not the pose: the summit FOV and view offsets ramp over the last leg (summitShare), so camera position, yaw and route clearance stay untouched"
    - "Occlusion e2e reads pin boxes only after two reads 10 frames apart agree (settledPinBoxes), so the damped spring has finished"

key-files:
  created:
    - .planning/phases/09-home-ascent/09-12-SUMMARY.md
  modified:
    - data/home.ts
    - lib/ascent/route.ts
    - components/home/terrain/CameraRig.tsx
    - components/home/SummitPlaque.tsx
    - lib/__tests__/ascent-route.test.ts
    - e2e/home-canvas.spec.ts
    - .planning/phases/09-home-ascent/deferred-items.md

key-decisions:
  - "D-14: Tim approved the drafted About and contact copy verbatim (\"approve\"); about.status is 'approved', text unchanged"
  - "Terrain tuning: Tim chose \"defaults (Recommended)\": exaggeration 1.0, summit pull-back 450 m, relief opacity 0.32; no constant or token changed"
  - "Summit plaque occlusion (Tim: \"Fix in 09-12 (Recommended)\"): fixed through the projection only. On wide stages the summit horizontal FOV is 75 degrees (was 60) and the optical centre moves left by 9.5 % of the width. On narrow stages the summit frame lifts by a further 8 % of the height. Both ramp in over the last leg"
  - "The 412 x 839 occlusion guard failed before any change (pin 3's stem tip, its ground point, 7 px into the card's top edge), so the fix includes the narrow-stage lift; this goes beyond 'desktop framing' and is flagged for Tim (SUMMIT_VIEW_OFFSET_Y_SHARE = 0 reverts it)"

patterns-established:
  - "Summit framing constants live in lib/ascent/route.ts beside the stage constants; ascent-route.test and the 'summit pins clear the plaque' e2e guard them"

requirements-completed: [HOME-01, HOME-02, HOME-08]

coverage:
  - id: D1
    description: "Home ships Tim's approved About and contact copy (about.status 'approved', body and contact unchanged)"
    requirement: HOME-01
    verification:
      - kind: other
        ref: "grep -c \"status: 'approved'\" data/home.ts -> 1"
        status: pass
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts (Summit, trail signs and About)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Terrain tuning at Tim's choice (defaults 1.0 / 450 m / 0.32); tokens OK; contrast, framing and clearance backstops pass"
    requirement: HOME-02
    verification:
      - kind: other
        ref: "npm run tokens:build -- --check -> tokens: OK"
        status: pass
      - kind: e2e
        ref: "e2e/home-modes.spec.ts + home-canvas.spec.ts + home-ascent.spec.ts --project=chromium (67/67)"
        status: pass
    human_judgment: false
  - id: D3
    description: "At the summit no 3D waypoint pin sits behind the summit plaque at 1440 x 900, 1280 x 720 or 412 x 839; the camera pose, yaw and route clearance are unchanged"
    requirement: HOME-02
    verification:
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#summit pins clear the plaque (3 tests; RED before fc24d57, GREEN after)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/ascent-route.test.ts (summit NDC with offsets; ramp and scoping; wide frame moves right and narrows)"
        status: pass
      - kind: e2e
        ref: "e2e/home-canvas.spec.ts#route clears the terrain; smoke at three ascent positions; pins hand over at the reveal"
        status: pass
    human_judgment: false
  - id: D4
    description: "How the re-framed summit looks: the wider desktop summit FOV shows more of the peak's dark faces at the bottom; the narrow frame sits 8 % higher"
    verification: []
    human_judgment: true
    rationale: "Composition is a taste call; the tests prove occlusion and limits, not the look. 09-14's re-baseline and visual review capture it"
  - id: D5
    description: "HOME-08 pre-CI check on the final chunk: total script transfer 444,761 B, under 468,770 B, mode 3d"
    requirement: HOME-08
    verification:
      - kind: other
        ref: "PW_PROD=1 HOME08_RUNS=1 HOME08_OUT=test-results/home-perf-local.json npx playwright test --project=perf + node byte check"
        status: pass
    human_judgment: false

duration: 17min
completed: 2026-10-25
status: complete
---

# Phase 9 Plan 12: Tim's copy and tuning decisions, summit plaque framing fix and HOME-08 pre-CI check Summary

**Tim approved the drafted About and contact copy and kept the research terrain defaults (1.0 / 450 m / 0.32). The summit look-back now keeps all four 3D waypoint pins clear of the summit plaque. On wide stages the summit frame widens to a 75° horizontal FOV and shifts right by 9.5 % of the width. On narrow stages it lifts by a further 8 % of the height. Both ramp in over the last leg only, and a new e2e proves the result at 1440, 1280 and 412 px. The final chunk's local HOME-08 sample is 444,761 B (24,009 B headroom) in mode `3d`.**

## Performance

- **Duration:** 17 min (this continuation, 2026-10-25T10:41:39Z to 10:58Z). The Task 1 and 2 evidence was prepared in a prior executor session.
- **Tasks:** 3 (two decisions with evidence, one apply-and-verify task, plus the scope addition)
- **Files modified:** 6 source and test files, plus deferred-items.md

## Tim's decisions (verbatim)

### Task 1: About and contact copy (D-14)
Question: "Task 1 (D-14): does Home ship the drafted About and contact copy?"
Tim's reply: **"approve"**. This selects option `approve` (Approve as drafted).

The approved text, as rendered at 1440 px:
> "I'm Tim Lui, a developer and photographer. I build software in Rust and TypeScript, including CLI_X, a command-line tool that turns plain language into safe shell commands. I photograph the mountains around Zermatt, and this site puts each photograph back on the terrain where I took it."
> "To work together or ask about a photograph, use the contact page. To see what I'm building next, read the roadmap."

### Task 2: Terrain tuning
Question: "Task 2: which terrain tuning ships (exaggeration / summit pull-back / relief opacity)?"
Tim's reply: **"defaults (Recommended)"**. This selects option `defaults`, which was described as "1.0 / 450 m / 0.32: true scale; all backstops already pass; no change."

Applied values:
- `RELIEF_EXAGGERATION`: 1 (unchanged)
- `SUMMIT_PULLBACK_M`: 450 (unchanged)
- `--relief-opacity`: 0.32 (unchanged), so `tokens.reliefOpacity` stays 0.32 and `tokens:build -- --check` prints `tokens: OK`

### Scope addition: summit plaque occlusion
Question: "The summit plaque covers 3D pins 1 and 2 at 1440 px (all four are clear at 412). What should happen?"
Tim's reply: **"Fix in 09-12 (Recommended)"**. The option was described as "Adjust the desktop summit framing (camera bearing or a pin-side offset) in this plan's Task 3, and add an occlusion check to the summit e2e, all before the 09-13 CI run and the 09-14 baselines."

## Evidence Tim reviewed (Tasks 1 and 2, scratchpad renders)

The renders are in the session scratchpad, `.../scratchpad/09-12/shots/`, 32 PNGs. The scratch script is `render.cjs`, and the contrast data is in `poster-contrast.json`.

- **Exaggeration 1.15:** steeper faces, and the waypoint-2 pins rose about 40 px.
- **Summit pull-back:** moving from 300 to 600 m moved the summit pins by 9 px or less. At 600 m a shoulder enters the bottom-left of the frame.
- **Worst B7 hero-text contrast** by relief opacity:

| Relief opacity | 375 px | 412 px | 768 px | 1440 px |
|---|---|---|---|---|
| 0.28 | 5.88 | 7.28 | 7.03 | 7.57 |
| 0.32 (shipped) | 5.88 | 7.10 | 6.84 | 7.39 |
| 0.36 | 5.88 | 6.87 | 6.65 | 7.21 |

## Accomplishments
- `data/home.ts`: `about.status` changed from `'draft'` to `'approved'`. The JSDoc now reads "About and contact copy decided by Tim at the 09-12 copy checkpoint; see 09-12-SUMMARY.md". The body and contact text are unchanged.
- The terrain tuning stays at the defaults, so `route.ts`, `globals.css` and `tokens.ts` were not touched for it.
- **Summit plaque fix** (`fc24d57`):
  - New named constants and functions in `lib/ascent/route.ts`.
  - `CameraRig` combines the stage and summit view offsets into one `setViewOffset` call and picks the summit HFOV per layout.
  - The 3D pins project through the same camera, so they follow automatically.
- HOME-08 pre-CI check: under the limit with 24,009 B to spare, in mode `3d`.

## Task Commits

1. **Task 3 (copy and tuning):** `ae50279` feat(09-12): apply Tim's About copy and terrain tuning (D-14)
2. **Scope addition (plaque occlusion):** `fc24d57` fix(09-12): summit look-back frames all four pins clear of the plaque at desktop widths

Tasks 1 and 2 were evidence-only decision checkpoints, so they have no commits.

## Files Created/Modified
- `data/home.ts`: approved status and JSDoc.
- `lib/ascent/route.ts`: adds `SUMMIT_WIDE_HFOV_DEG`, `SUMMIT_VIEW_OFFSET_X_SHARE`, `SUMMIT_VIEW_OFFSET_Y_SHARE`, `summitHfovDeg`, `summitViewOffsetXAt` and `summitViewOffsetYAt`. `fovAt` now shares `summitShare`.
- `components/home/terrain/CameraRig.tsx`: summit HFOV and the combined view offset.
- `components/home/SummitPlaque.tsx`: a `data-summit-plaque` attribute on the plaque column. This is a test hook only; the classes and layout are unchanged.
- `lib/__tests__/ascent-route.test.ts`: the summit NDC test now applies the new FOV and offsets. Three new tests (28 in the file).
- `e2e/home-canvas.spec.ts`: `intersects`, `settledPinBoxes` and the 'summit pins clear the plaque' describe block (3 tests; 26 in the file).
- `.planning/phases/09-home-ascent/deferred-items.md`: the plaque entry is resolved, the dark-wedge entry has a note, and a new entry covers the residual sizes.

## Decisions Made
See key-decisions. Why the fix uses the projection rather than a camera bearing:
- At the summit the waypoints spread over 0.78 NDC.
- The band between the plaque and the rail scrim is about 0.70 NDC at 1280 x 720, so no pure shift or rotation fits all four.
- A wider summit HFOV on wide stages (75°, spread 0.59) plus a shift of 0.19 NDC places them inside the band at 1280, 1440 and 1920.
- A view offset leaves the camera pose alone, so route clearance, the yaw limit and the look-back direction cannot change. The pins project through the same matrix, so the hand-over and placement stay exact.

## Deviations from Plan

### Scope addition approved by Tim

**1. [Rule 1 - Bug, Tim-approved scope] The summit plaque covered 3D pins at the summit**
- **Approval:** Tim replied "Fix in 09-12 (Recommended)" (quoted in full above).
- **Found during:** 09-10's visual check, then the 09-12 render review.
- **Issue:** with `#summit` centred, the plaque column (card and trail signs) covered pins 1 and 2 at 1280 x 720, 1440 x 900 and 1920 x 1080. Below 768 px the stem tips also reached into the docked card:
  - 412 x 839: pin 3, by 7 px.
  - 375 x 812: pins 1-3, by about 30 px.

  Tim's "all four are clear at 412" came from a centre-point check. The strict box guard that he asked for failed at 412 before any change.
- **Fix:**
  - Wide stages: `SUMMIT_WIDE_HFOV_DEG` 75 and `SUMMIT_VIEW_OFFSET_X_SHARE` 0.095.
  - Narrow stages: `SUMMIT_VIEW_OFFSET_Y_SHARE` 0.08.
  - Both ramp over the last leg only (`summitShare`, as the summit FOV already did).
  - The narrow-stage lift goes beyond the "desktop summit framing" wording of Tim's option. It was needed for the 412 guard to pass honestly, rather than loosening the check to pin heads only. Setting `SUMMIT_VIEW_OFFSET_Y_SHARE` to 0 reverts it, and the 412 assertion would then need to check heads only. **This is flagged for Tim.**
- **Measured after the fix** (summit centred; distances are clearance from the plaque column and the rail scrim):

| Size | Pins | Clearance |
|---|---|---|
| 1440 x 900 | x 679-1127 | 60 px right of the plaque (right edge 619), 79 px left of the scrim |
| 1280 x 720 | x 602-1002 | 63 px right of the plaque, 44 px left of the scrim |
| 1920 x 1080 | all four | clear |
| 412 x 839 | y 156-258 | about 55 px above the plaque top (313) |
| 375 x 812 | all four | clear |

- **TDD:**
  - RED: the new e2e failed at 1440 (pins 1 and 2), 1280 (pins 1 and 2) and 412 (pin 3).
  - GREEN: `home-canvas.spec.ts` passed 26/26.
- **Static poster:** clear of the plaque at 1280 px and up, so there is no desktop overlap to fix. Below 1280 its fixed plan-view pins sit under the docked or centred plaque (D-20 layout), as logged in deferred-items.
- **Renders:**
  - `C:/Users/tim/AppData/Local/Temp/claude/C--Users-tim-MyDocuments-Programming-portfolio-app/c2d6d5d0-1717-41ef-bc4e-ae1f1c6e35c7/scratchpad/09-12/summit-fixed-1440.png`
  - `C:/Users/tim/AppData/Local/Temp/claude/C--Users-tim-MyDocuments-Programming-portfolio-app/c2d6d5d0-1717-41ef-bc4e-ae1f1c6e35c7/scratchpad/09-12/summit-fixed-412.png`
  - `C:/Users/tim/AppData/Local/Temp/claude/C--Users-tim-MyDocuments-Programming-portfolio-app/c2d6d5d0-1717-41ef-bc4e-ae1f1c6e35c7/scratchpad/09-12/summit-fixed-1280.png`
- **Files modified:** lib/ascent/route.ts, components/home/terrain/CameraRig.tsx, components/home/SummitPlaque.tsx (test hook), lib/__tests__/ascent-route.test.ts, e2e/home-canvas.spec.ts
- **Committed in:** `fc24d57`

### Auto-fixed Issues

**2. [Rule 3 - Blocking] The plaque needed a stable selector for the occlusion assertion**
- **Fix:** added a `data-summit-plaque` attribute on the plaque column. Without it the test would rely on Tailwind class selectors. There is no visual or layout change.
- **Committed in:** `fc24d57`

---

**Total deviations:** 1 Tim-approved scope addition (which includes the narrow-stage lift flagged above) and 1 blocking test hook.
**Impact on plan:** the changes are confined to the projection and a test hook. There are no plaque layout changes and no new dependencies.

## Issues Encountered
- Some sizes still overlap where the plaque fills most of the stage. These are logged in deferred-items for a plaque layout decision by Tim.
  - Not regressions (identical with the new constants set to neutral):
    - 375 x 667: all 4 pins.
    - 820 x 1180 portrait: 3 pins.
  - Improved but not fully clear:
    - 768 x 1024: was 3 pins, now pin 3 only.
    - 1024 x 768: was 2 pins. Pin 1 now touches the plaque edge by 2 px, and pin 4 sits 13 px into the rail scrim.
- The wider desktop summit FOV brings the peak's dark faces and the summit marker further into the bottom of the frame: about 200 x 135 px near x 560-760 at 1440 x 900. This is noted on the dark-wedge deferred entry for 09-14.

## HOME-08 pre-CI check

Measured with every code change of the phase in place, as one local production sample (`PW_PROD=1 HOME08_RUNS=1`, the perf project's throttled Pixel 7 profile). The dev server (PID 30500) was stopped first, and `public/service-worker.js` was restored with `git checkout --` afterwards; `git status` shows it clean.

| Measurement | 09-09 early signal | 09-10 sample | 09-12 pre-CI (final chunk) |
|---|---|---|---|
| Initial JS transfer | 441,170 B | 443,722 B | 444,761 B |
| Total JS transfer | 441,170 B | 443,722 B | **444,761 B** |
| Lazy (total - initial) | 0 B | 0 B | 0 B |
| Headroom to 468,770 B | 27,600 B | 25,048 B | **24,009 B** |
| Mode | 3d | 3d | **3d** |

- **Byte check output:** `HOME-08 pre-CI check: initial 444761 total 444761 lazy 0 headroom 24009 mode 3d`. Exit 0, under the limit, so the trim lever was not needed.
- **LCP:** 3052 ms.
- **Load event:** loadEventStart 4865 ms. The lazy chunk still arms before load, so initial equals total, as 09-09 logged.
- **Canvas ready:** 6053 ms.
- **Chunks:**
  - three/R3F: unchanged at 241,953 B.
  - App canvas chunk: 21,156 B, up from 20,131 B at 09-10. That is +1,025 B across 09-11's resilience code and this plan's summit functions.
- **Mode:** the perf run stayed in `3d`. This sample fell on the right side of the thin frame-budget headroom that 09-11 warned about (median 38-45 ms against 50 ms). One sample does not remove that risk for 09-13's container runs.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- **09-13 (CI):** the local HOME-08 headroom is 24,009 B. The perf mode depends on the frame budget, which has thin headroom (09-11); one local sample read `3d`.
- **09-14 (Home re-baseline):** the re-baseline will capture the fixed summit framing (wide: pins right of the plaque with a wider FOV; narrow: pins 8 % higher). Review the darker peak mass at the bottom of the 1440 summit frame, and the residual overlap sizes in deferred-items, at the same time.
- **For Tim:**
  - Keep or drop the narrow-stage summit lift: `SUMMIT_VIEW_OFFSET_Y_SHARE`, one constant.
  - Decide whether short-phone and portrait-tablet plaque layouts need a design change.
- Nothing was pushed, no workflow was dispatched, no baseline PNG was touched, and nothing listens on :3000.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*
