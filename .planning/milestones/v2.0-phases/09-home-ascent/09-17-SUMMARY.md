---
phase: 09-home-ascent
plan: 17
subsystem: ui
tags: [contrast, stacking-context, sticky, scrim, playwright, wcag, altimeter-rail]

requires:
  - phase: 09-home-ascent
    provides: "AltimeterRail (09-06), hero scrim at lg: (C6, 09-14), B7/B8 contrast backstops (09-07), the 09-16 e2e edits on home-ascent.spec.ts"
provides:
  - "[data-ascent-rail-layer]: a sticky, aria-hidden, pointer-events-none layer after the track in the AscentHero grid cell, holding AltimeterRail"
  - "[data-ascent-rail-scrim] as server JSX in the stage (AscentController flipPinLabels and CameraRig read it unchanged)"
  - "composedContrast(page, target) in e2e/home-modes.spec.ts: text colour composed through every overlay vs the transparent-text background"
  - "e2e 'N1: rail labels and readout over the hero, composed through every overlay': 768/1023/1280 x 900 at p = 0 and 0.05, Chromium and Firefox"
  - "UI-SPEC: three-layer z-order row, Page Structure tree and bullets, Altimeter Rail Element and Rail scrim rows, E8 composed backstop"
affects: [09-home-ascent verification, HOME-04, UAT test 4, visual baselines at 768 and 1024-1280 px]

actuals:
  tokens: 7980
  tasks: 2
  commits: 2
plan_head_before: 1f958af0087c79eb4ebf051cd6c9cad094bdbcb7
plan_head_after: fc544093dd218eff54e21f030e666ec41ba1f3ba

tech-stack:
  added: []
  patterns:
    - "A decorative overlay that must sit above a later sibling's scrim goes in its own sticky layer after that sibling in the same grid cell; z-index inside a sticky element cannot escape its stacking context"
    - "Composed contrast for text that may sit UNDER an overlay: per-pixel ratio between a fill shot (background set to the text colour) and a transparent-text shot of each line rect"

key-files:
  created: []
  modified:
    - components/home/AscentHero.tsx
    - components/home/AltimeterRail.tsx
    - components/home/__tests__/rail.test.tsx
    - e2e/home-ascent.spec.ts
    - e2e/home-modes.spec.ts
    - .planning/phases/09-home-ascent/09-UI-SPEC.md

key-decisions:
  - "Rail box in its own sticky aria-hidden layer after the track (Tim's option B); the rail scrim stays in the stage so flipPinLabels and CameraRig keep reading it there"
  - "composedContrast insets each Range line rect by 1 px on integer bounds, so no edge pixel blends with the surroundings in the fill shot"
  - "The N1 test collects every failing label and fails once with the full list, so a RED run reports all ratios"

patterns-established:
  - "composedContrast(page, target): use for any text an overlay might cover; worstContrastBehind stays for text painted above a scrim (B7)"

requirements-completed: [HOME-04]

coverage:
  - id: D1
    description: "Rail tick labels and readout read at least 4.5:1 composed at 768, 1023 and 1280 x 900, at p = 0 and p = 0.05, in Chromium and Firefox (RED 1.17-2.48 at 768 before)"
    requirement: HOME-04
    verification:
      - kind: e2e
        ref: "npx playwright test e2e/home-modes.spec.ts --project=chromium --project=firefox -g \"N1|B7|B8|axe\" (24 passed, 6 N1 per project)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Rail layer is aria-hidden, pointer-events none, follows the track, holds one rail; the stage holds one rail scrim; no live region or focusable descendant in either"
    requirement: HOME-04
    verification:
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#the rail is decorative and hidden below 768 px"
        status: pass
      - kind: unit
        ref: "components/home/__tests__/rail.test.tsx#is decorative: in the aria-hidden rail layer after the track, no live region, nothing focusable"
        status: pass
    human_judgment: false
  - id: D3
    description: "Existing HOME-04 behaviour unchanged: readout climbs, ticks evenly spaced, reduced-motion static profile, pin label flip and 3D camera (scrim readers), hero B7 and axe"
    requirement: HOME-04
    verification:
      - kind: e2e
        ref: "npx playwright test e2e/home-ascent.spec.ts e2e/home-modes.spec.ts --project=chromium --project=firefox (100 passed)"
        status: pass
      - kind: e2e
        ref: "npx playwright test e2e/home-ascent.spec.ts e2e/home-canvas.spec.ts --project=chromium (53 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rail looks right at 768-1023 px on a real tablet-width window (labels, readout plate and cyan marker as legible as at 1440)"
    requirement: HOME-04
    verification: []
    human_judgment: true
    rationale: "The tests measure contrast; whether the rail reads as intended over the hero (UAT test 4 N1) is a visual judgement, and the 768 visual baselines will change and need Tim's review"

duration: 8min
completed: 2026-10-25
status: complete
---

# Phase 09 Plan 17: Altimeter rail above the hero scrim (G-09-4 N1) Summary

**The altimeter rail box now lives in a sticky, aria-hidden, pointer-events-none layer after the content track, so the hero scrim no longer dims it: at 768 x 900, p = 0 the rail went from 1.17-2.48:1 (readout 1.30) to 7.65-8.71:1 (readout 14.99), proven by a new composed-contrast e2e that failed before the change.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-25T16:33:12Z
- **Completed:** 2026-10-25T16:41:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Root cause from the debug note fixed. The hero scrim belongs to the track, and the track paints above the sticky stage. A sticky element is its own stacking context, so no z-index on the rail inside the stage could lift it. The rail box is now a later sibling of the track in the same grid cell and paints above it. The rail scrim stays in the stage, where `flipPinLabels` (AscentController.tsx:148) and CameraRig.tsx:236 read it.
- New `composedContrast` helper. It takes two shots of each text line: one with the text transparent (the background), and one with the element's background set to its own text colour (the text colour as composed through any overlay). It returns the lowest per-pixel ratio between the two. B8's `worstContrastBehind` cannot do this, because it reads the raw computed colour and so cannot see an overlay above the text.
- N1 matrix: 768, 1023 and 1280 x 900, each at p = 0 and p = 0.05. That is 6 tests per project, green in Chromium and Firefox.
- UI-SPEC now describes the three layers. The new E8 backstop names the composed method, and the summit B8 row stays.

## Measured result (static mode, dev server)

RED (Task 1 step 1, before the layer change, Chromium, 768 x 900, p = 0). The test failed with:

| Target | Ratio |
|---|---|
| tick 0 `1,617 m` | 1.17 |
| tick 1 `1,668 m` | 1.31 |
| tick 2 `2,585 m` | 1.47 |
| tick 3 `2,760 m approx.` | 1.68 |
| tick 4 `4,478 m` | 2.48 |
| readout `1,617 m` | 1.30 |

GREEN (after; tick 0 / 1 / 2 / 3 / 4 / readout):

| Row | Chromium | Firefox |
|---|---|---|
| 768 x 900, p 0 | 8.71 / 8.64 / 8.49 / 7.65 / 7.91 / 14.99 | 8.64 / 8.62 / 8.49 / 7.49 / 7.86 / 15.02 |
| 768 x 900, p 0.05 | 6.83 / 8.71 / 8.64 / 8.07 / 8.32 / 14.99 | 6.69 / 8.71 / 8.62 / 8.01 / 8.24 / 15.02 |
| 1023 x 900, p 0 | 8.71 / 8.64 / 8.56 / 8.07 / 7.99 / 14.99 | 8.71 / 8.62 / 8.49 / 7.93 / 7.86 / 15.02 |
| 1023 x 900, p 0.05 | 7.12 / 8.76 / 8.63 / 8.40 / 8.32 / 14.99 | 7.02 / 8.71 / 8.62 / 8.26 / 8.24 / 15.02 |
| 1280 x 900, p 0 | 7.12 / 7.30 / 7.02 / 5.45 / 7.10 / 14.99 | 7.12 / 7.12 / 7.00 / 5.20 / 7.02 / 15.02 |
| 1280 x 900, p 0.05 | 7.12 / 7.30 / 7.02 / 5.45 / 7.10 / 14.99 | 7.12 / 7.12 / 7.00 / 5.20 / 7.02 / 15.02 |

The RED values match the debug sweep: 1.31 / 1.45 / 1.68 / 2.46, readout 1.29. The GREEN values match the "lift" prototype: 8.63 / 8.42 / 7.58 / 7.85, readout 14.99. The 1280 long label was 4.45:1 before the change and is now 5.20-5.45:1. The two 1280 rows are identical because the hero scrim's lg: gradient is transparent at the rail's x, and nothing else that scrolls now covers the rail.

## Task Commits

1. **Task 1: Rail layer end-to-end, proven by a failing composed-contrast check (tracer)**: `1da76cd` (fix)
2. **Task 2: Composed-contrast matrix and UI-SPEC amendments**: `fc54409` (test)

**Plan metadata:** the docs commit that follows this SUMMARY

Tracer gate: interactive run, `end-of-phase`, automated-only `<verify>`. Both verify commands were re-run green before expanding: 17 Playwright tests, and Jest 8/8.

## Files Created/Modified

- `components/home/AscentHero.tsx`: rail scrim div in the stage after TerrainStage; `[data-ascent-rail-layer]` after the track holding `<AltimeterRail>`; doc comment covers the three layers and why
- `components/home/AltimeterRail.tsx`: renders only the box (the fragment and the scrim are gone, so the box JSX is re-indented); doc comment names the layer and says the scrim stays in the stage
- `components/home/__tests__/rail.test.tsx`: 'is decorative' test rewritten for the layer (aria-hidden, sticky, after the track, not in the stage) and the scrim (in the aria-hidden stage, classes unchanged)
- `e2e/home-ascent.spec.ts`: containment assertion rewritten. Rail layer aria-hidden and holding one rail; one scrim in the stage; track before the layer (`DOCUMENT_POSITION_FOLLOWING`); no `[aria-live]` or focusable descendant in either the stage or the layer
- `e2e/home-modes.spec.ts`: `composedContrast`, `worstPairContrast`, the N1 describe with the six-row table and the p seek
- `.planning/phases/09-home-ascent/09-UI-SPEC.md`: z-order row, Page Structure tree, the grid and aria-hidden bullets, Altimeter Rail Element and Rail scrim rows, and the new E8 composed backstop (each tagged "(G-09-4 N1, Tim's option B, 09-17)", 6 tags)

## Decisions Made

- The rail scrim stays in the stage as plain server JSX with the same attribute and classes, as Tim's option B specifies. It still dims the stage under the rail. Now that the rail sits above the hero scrim, the labels also sit on the hero scrim, which is why 768 reads better than 1280.
- `composedContrast` insets each line rect by 1 px on integer bounds. With fractional clip coordinates, edge pixels in the fill shot would blend fill and surroundings, and that would report false lows.
- The N1 test does not stop at the first low label. It gathers every failing label and asserts once, so a failing run reports the whole rail, as the RED run above shows.
- I used the ui-ux-pro-max skill. Its "Scrim and modal legibility: measure the composed result" rule is the method this plan adds. No new z-index token was introduced (z-index-management).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Acceptance] Doc comment named the scrim attribute**
- **Found during:** Task 1 acceptance greps
- **Issue:** `grep -c "data-ascent-rail-scrim" components/home/AscentHero.tsx` printed 2, but the criterion expects 1. The new doc comment quoted the attribute name.
- **Fix:** The comment now says "the rail scrim (md and up)" without the attribute name.
- **Committed in:** 1da76cd

### Notes

- `grep -c "data-ascent-rail-layer" components/home/AscentHero.tsx` prints 2: the attribute and the doc comment's hook list. The criterion is "at least 1".
- `e2e/home-modes.spec.ts` was not Prettier-clean at HEAD, because it uses wide lines throughout. The new code follows that file style. The other five files are Prettier-clean.

**Total deviations:** 1 auto-fixed (acceptance wording)
**Impact on plan:** None on behaviour.

## Issues Encountered

- None blocking. The dev server I started for the e2e runs was stopped afterwards.

## Verification

- `npx playwright test e2e/home-modes.spec.ts e2e/home-ascent.spec.ts --project=chromium -g "N1|rail|B7|B8"`: 17 passed (Task 1)
- `npx jest components/home/__tests__/rail.test.tsx --silent`: 8 passed
- `npx playwright test e2e/home-modes.spec.ts --project=chromium --project=firefox -g "N1|B7|B8|axe"`: 24 passed, 6 N1 per project (Task 2)
- `npx playwright test e2e/home-ascent.spec.ts e2e/home-modes.spec.ts --project=chromium --project=firefox`: 100 passed
- `npx playwright test e2e/home-ascent.spec.ts e2e/home-canvas.spec.ts --project=chromium`: 53 passed (the 3D camera still reads the scrim)
- `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests`: OK, jest 653 + e2e 200 = 853 (baseline 832)
- `npm run lint && npm run type-check`: both exit 0
- Acceptance greps: `data-ascent-rail-layer` in AscentHero 2 (at least 1); scrim in AltimeterRail code lines 0; scrim in AscentHero 1; old `stage(page).locator('[data-ascent-rail]')` line 0; "Tim's option B, 09-17" in UI-SPEC 6 (at least 3)

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- G-09-4 N1 is closed in code and tests.
- The Home visual baselines at 768 px (start, and wherever the hero overlaps the rail) will change. So will any 1024-1440 baseline where the rail sits under the summit or hero scrim, because the rail now paints above both. They need a re-baseline via the gh workflow, and Tim commits the PNGs.
- UAT test 4 (N1) can be re-checked at 768-1023 px.
- Ready for 09-18.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*

## Self-Check: PASSED

- Files exist: all six modified files
- Commits on this branch: 1da76cd, fc54409 (`git rev-list --count 1f958af..HEAD` = 2 before this docs commit)
- Acceptance criteria re-run: all pass
