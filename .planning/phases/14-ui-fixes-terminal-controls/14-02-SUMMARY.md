---
phase: 14-ui-fixes-terminal-controls
plan: 02
subsystem: ui
tags: [tailwind, scrim, contrast, wcag, playwright, webgl, overflow]

requires:
  - phase: 14-ui-fixes-terminal-controls
    provides: 14-01 (wave 1; depends_on chain, shared :3000 server)
provides:
  - Deeper rail scrim stops at the same 224 px width (HOME-10; D-13, UI-SPEC Contract 3 P3 default)
  - B8 rewritten as a 12-row matrix (4 geometry, 4 poster, 4 live) with every contrast value annotated (D-14, D-15)
  - Shared e2e helpers waitForRevealed and waitForCameraSettled in e2e/helpers/ascent.ts
  - Home 375 px sideways guard in four modes at eight stops (HOME-09; D-18)
affects: [14-08 baseline dispatch, CameraRig rail zone, home-canvas.spec]

actuals:
  tokens: 4500
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Contrast rows collect failures per stop and assert an empty list at the end, so one run reports every low label"
    - "Live-canvas e2e rows call budgetMeasureOnly so a SwiftShader frame-budget decline cannot swap the canvas for the poster mid-run"
    - "No-JavaScript e2e rows reach scroll stops with locator.scrollIntoViewIfNeeded() (protocol-level), not page scripts"

key-files:
  created: []
  modified:
    - components/home/AscentHero.tsx
    - e2e/home-modes.spec.ts
    - e2e/helpers/ascent.ts
    - e2e/home-canvas.spec.ts

key-decisions:
  - "HOME-10: the scrim takes the locked P3 stops (from-surface/90 from-0% via-surface/85 via-85% to-transparent to-100%) at w-56; this reverses 12-07 D-24, which had accepted the 09 stops (alpha about 0.38 behind '2,760 m approx.', 4.81:1 at 768 px)"
  - "B8 lowest values (Chromium): poster 7.93:1 (768 px), live canvas 7.91:1 (1440 px); every label clears the 5:1 aim on both surfaces, so the P3 alternative (via-90%) is not needed"
  - "The B8 live rows opt into budgetMeasureOnly (the home-canvas.spec rule for tests that need '3d')"
  - "HOME-09: fixed by 09-01, now guarded; no app change and no home/375-* PNG"

patterns-established:
  - "Geometric contrast gate: label extent from Range client rects of the drawn text, compared with the scrim's dense stop (<=, a label on the boundary counts as inside)"

requirements-completed: [HOME-09, HOME-10]

coverage:
  - id: D1
    description: "Rail scrim has the locked stops at the same 224 px width; every label's left edge sits inside the 85 % dense stop at 768/1023/1280/1440 px"
    requirement: HOME-10
    verification:
      - kind: e2e
        ref: "e2e/home-modes.spec.ts#B8: scrim geometry at {768,1023,1280,1440} px, every label inside the dense stop [chromium, firefox]"
        status: pass
      - kind: unit
        ref: "components/home/__tests__/rail.test.tsx (scrim keeps pointer-events-none, hidden, md:block, w-56)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every tick label >= 4.5:1 (and >= 5:1 aim) on the poster and the live canvas at four widths, every waypoint stop and the summit"
    requirement: HOME-10
    verification:
      - kind: e2e
        ref: "e2e/home-modes.spec.ts#B8: poster at {width} x {height}, every waypoint stop and the summit [chromium, firefox]"
        status: pass
      - kind: e2e
        ref: "e2e/home-modes.spec.ts#B8: live canvas at {width} x {height}, every waypoint stop and the summit @chromium-only"
        status: pass
    human_judgment: false
  - id: D3
    description: "Home at 375 px never scrolls sideways at the hero, waypoints 1-4, the summit, About and the footer in static, reduced-motion, live 3D and no-JavaScript modes"
    requirement: HOME-09
    verification:
      - kind: e2e
        ref: "e2e/home-modes.spec.ts#nothing scrolls sideways at 375 px (4 Chromium, 3 Firefox)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Re-baselined Home PNGs for the darker rail band"
    requirement: HOME-10
    verification: []
    human_judgment: true
    rationale: "The PNGs only come from the 14-08 CI dispatch; Tim reviews and commits them"

duration: 9min
completed: 2026-11-14
status: complete
plan_head_before: f160c1933a5361b059d73340aa14a9860ad03353
plan_head_after: ff7eb8ad440410bf148a5d52c2d19ee1b8e970dd
---

# Phase 14 Plan 02: Rail scrim contrast and Home 375 px guard Summary

**The altimeter rail scrim now holds alpha 0.85 past the longest tick label at the same 224 px width, so every label measures at least 7.91:1 over the poster and the live canvas at four md+ widths. A 12-row B8 matrix proves it, and Home's 375 px sideways guard now covers four modes at eight stops.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-11-14T11:13:39Z
- **Completed:** 2026-11-14T11:21:49Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- **HOME-10 (D-13):** the `data-ascent-rail-scrim` class string is the UI-SPEC Contract 3 "After (locked)" string. The element, its position, `w-56` and `hidden md:block` are unchanged, so `CameraRig` still reads 224 px. The JSDoc records the reason.
- **Why D-13 reverses 12-07 D-24:** the 09 stops (`via-surface/60 via-70%`) left alpha about 0.38 behind the left edge of '2,760 m approx.' (182 px from the right edge). That label measured 4.81:1 at 768 px, and 12-07 accepted it as passing AA. The new dense stop holds 0.85 to 190.4 px, which is the smallest 5-step alpha that clears 5:1 even over pure white.
- **B8 rewritten in place** ("B8: rail tick labels keep 4.5:1 at every stop"). It has 12 tests where HEAD had 2: 4 geometry rows, 4 poster rows (all engines) and 4 live-canvas rows (`@chromium-only`). Each row first asserts the label count, `waypoints.length + 1` = 5.
- **Geometry (Chromium and Firefox, every width):** `scrim.offsetWidth === 224`. '2,760 m approx.' reaches 182.0 px of the 190.4 px dense stop, and the other labels reach 114.8 px. That leaves 8.4 px of margin, as the spec predicted.
- **Shared helpers:** `waitForRevealed`, moved verbatim from `home-canvas.spec.ts`, and `waitForCameraSettled`, which generalises the `settledPinBoxes` two-reads-agree loop to every 3D pin. `home-canvas.spec.ts` now imports `waitForRevealed`; `settledPinBoxes` stays where it is.
- **HOME-09: fixed by 09-01, now guarded.** The 375 px describe is rewritten in place. Static, static-reduced, eligible (`@chromium-only`) and a nested no-JavaScript describe each visit the hero, waypoints 1-4, `#summit`, `section[aria-labelledby="about-title"]` and `footer`. Every stop asserts its count first. Nothing overflows in any mode, and no app file outside `AscentHero.tsx` changed.

## B8 lowest value per surface and width (Chromium)

| Surface | 768 px | 1023 px | 1280 px | 1440 px |
|---------|--------|---------|---------|---------|
| Poster (WebGL off) | 7.93 (wp 1, '2,760 m approx.') | 8.07 (wp 1, '2,760 m approx.') | 8.07 (wp 1, '2,760 m approx.') | 8.10 (wp 1, '4,478 m') |
| Live canvas | 7.93 (wp 1, '2,760 m approx.') | 8.00 (wp 4, '2,585 m') | 8.01 (wp 2, '2,760 m approx.') | 7.91 (wp 2, '2,760 m approx.') |

Firefox poster at 768 px: lowest 7.85 ('2,760 m approx.'). **Below the 5:1 aim:** none. Every label on both surfaces clears 5:1, so there is nothing to put to Tim about the P3 alternative (`via-90%` at the same `w-56`).

## Sweeps outside Home (D-18)

The 375 px rows in `e2e/case-study.spec.ts`, `e2e/case-study-page.spec.ts` and `e2e/photos-sweep.spec.ts` all pass in Chromium (18/18). Covered: /projects/box, /projects/coin-flip, the photo map, grid, carousel stepper, lightbox and four photo pages. Nothing overflows, so there are no new items for Tim.

## Declared PNG set for 14-08 (one cause: the rail scrim)

- `home/768-ascent-{start,waypoint-2,summit}`
- `home/1440-ascent-{start,waypoint-2,summit}`
- `home/768-reduced` and `home/1440-reduced`, if the darker band shows in them
- No `home/375-*` PNG changes: the scrim is md+ only, and HOME-09 changes no pixel.

## Task Commits

1. **Task 1: Rail scrim slice (new stops, geometric gate, 768 px poster row)** - `43edaf0` (fix). Tracer gate: the `<verify>` re-run passed in Chromium and Firefox before the expansion tasks started.
2. **Task 2: Complete the B8 matrix** - `7b53a46` (test)
3. **Task 3: 375 px guard in every mode at every stop** - `ff7eb8a` (test)

## Files Created/Modified

- `components/home/AscentHero.tsx`: scrim stop classes and the HOME-10 / D-13 JSDoc sentences
- `e2e/home-modes.spec.ts`: the B8 describe (geometry, poster and live rows) and the 375 px describe with its no-JavaScript nest
- `e2e/helpers/ascent.ts`: `waitForRevealed` and `waitForCameraSettled`
- `e2e/home-canvas.spec.ts`: the file-local `waitForRevealed` is removed and the shared helper imported. No test changed.

## Decisions Made

- Contrast values are collected per stop and asserted at the end of each row (the N1 pattern) on the poster as well as the live canvas, so a regression reports every low label in one run.
- `waitForCameraSettled` throws when the page has no 3D pins, so a stage that never reached 3D cannot pass as "settled".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The B8 live rows opt into `budgetMeasureOnly`**
- **Found during:** Task 2
- **Issue:** the plan's live-row recipe does not call `budgetMeasureOnly`. Local and CI SwiftShader measure the 50 ms frame budget as noise, and a decline swaps the canvas for the poster, so `waitForRevealed` would time out or a row would sample the poster. The project rule in `home-canvas.spec.ts` and `lib/__tests__/frame-budget-policy.test.ts` is that every test needing '3d' opts in.
- **Fix:** `await budgetMeasureOnly(page)` at the start of each live row, plus a final assertion that the stage is still '3d', so a row cannot pass on the poster.
- **Files modified:** e2e/home-modes.spec.ts
- **Commit:** 7b53a46

**2. [Rule 1 - Bug] The JSDoc must not mention the width class**
- **Found during:** Task 1, acceptance check
- **Issue:** a first draft of the comment named the width class, so `grep -cF "w-56"` printed 2 against the expected 1.
- **Fix:** the comment says "224 px" instead.
- **Commit:** 43edaf0

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug). **Impact:** none on scope. The 4.5 gate, the locked stops and the scrim width are as planned.

## Issues Encountered

- Each `PW_PROD` build injects a hash into `public/service-worker.js`. I restored it with `git checkout` after every run, and it is never committed.
- `npm run guard:tests` needs `jest-results.json`, which CI's Unit Tests job writes, so it did not run locally. The e2e count only rose: B8 went from 2 to 12 and sideways from 3 to 4.

## Verification

- `PW_PROD=1 npx playwright test e2e/home-modes.spec.ts e2e/home-canvas.spec.ts --project=chromium --project=firefox`: 114 passed
- `npx jest components/home/__tests__/rail.test.tsx`: 10 passed. `lib/__tests__/frame-budget-policy.test.ts`: 16 passed
- `npm run lint` and `npm run type-check`: green
- Acceptance greps: the locked stop string 1, `via-surface/60` 0, `w-56` 1, `HOME-10` 1; both helper exports 1 each; the file-local `waitForRevealed` 0; `javaScriptEnabled: false` 1; `about-title` 1. `--list -g "B8"` gives 12 tests, including 1023 titles; `--list -g "sideways"` gives 4. `git diff --name-only c3a06b3 -- app/ components/home/` lists only `components/home/AscentHero.tsx`.
- WebKit runs the poster, geometry and 375 px rows in CI (14-08).

## Next Phase Readiness

- Ready for 14-03. No server is left on :3000.

## Self-Check: PASSED

- Commits 43edaf0, 7b53a46 and ff7eb8a are ancestors of HEAD, and all four modified files exist.
