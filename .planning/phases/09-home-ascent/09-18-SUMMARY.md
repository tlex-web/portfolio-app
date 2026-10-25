---
phase: 09-home-ascent
plan: 18
subsystem: ui
tags: [summit-plaque, responsive-layout, tailwind-custom-variant, poster-pins, playwright, jest, geometry-sweep]

requires:
  - phase: 09-home-ascent
    provides: "posterFrame (09-01), SummitPlaque and TrailSigns (09-05), poster pins (09-06), the 09-17 AscentHero layers"
provides:
  - "@custom-variant summit-full / summit-compact in app/globals.css (SUMMIT_FULL_MEDIA: landscape, 68.75rem <= width < 121.5rem)"
  - "lib/ascent/summit-layout.ts: SUMMIT_FULL_MIN_REM, SUMMIT_FULL_MAX_REM, SUMMIT_FULL_MEDIA, summitLayoutAt, summitColumnBox"
  - "Compact summit: 320 px bottom-docked column with a one-line plate (h2 + height) and the trail signs; no block scrim"
  - "SummitStats (exported from SummitPlaque.tsx) and SummitDetails ([data-summit-details], a group named by the summit h2) after the ascent grid"
  - "e2e 'Summit plaque clears the poster pins (G-09-2, static)': eleven sizes, Chromium and Firefox, plus reduced-motion and group-name tests"
  - "UI-SPEC Summit Section: Block, Skip target, Plaque, Summit details (compact only), Signs, E9 overflow"
affects: [09-20 measured 3D framing, HOME-06, HOME-05, UAT test 2, visual baselines at the summit]

actuals:
  tokens: 9314
  tasks: 3
  commits: 4
plan_head_before: 974b6d422f79a1cfd481056575eedf9b30b9cb42
plan_head_after: 37995865be79417d88caa9d88c6c17e6ccfc0f17

tech-stack:
  added: []
  patterns:
    - "Layout thresholds live in an import-free TS module; a Jest guard reads app/globals.css and fails if the @custom-variant media conditions drift from it"
    - "Two mutually exclusive block-form custom variants (X and `not all and X`), so no utility ordering issue arises between them"
    - "Content that cannot fit over a fixed frame moves after the frame as a role=group named by the section's h2, instead of a disclosure"

key-files:
  created:
    - lib/ascent/summit-layout.ts
    - lib/__tests__/summit-layout.test.ts
    - components/home/SummitDetails.tsx
  modified:
    - app/globals.css
    - components/home/SummitPlaque.tsx
    - components/home/AscentHero.tsx
    - e2e/home-ascent.spec.ts
    - components/home/__tests__/summit.test.tsx
    - .planning/phases/09-home-ascent/09-UI-SPEC.md

key-decisions:
  - "Full plaque only on landscape viewports from 1100 px to below 1944 px (SUMMIT_FULL_MEDIA); compact everywhere else, always paired with motion-safe so reduced motion keeps the full plaque"
  - "The stats move after the ascent in [data-summit-details] (a group named by the summit h2, no heading), not into a disclosure, so HOME-06 stats are never hidden by default"
  - "The block scrim is removed: every summit text sits on a solid plate, and the scrim dimmed the pins"
  - "The clearance e2e uses expect.soft and annotations, so a failing run reports every pin's gap"

patterns-established:
  - "summitLayoutAt(viewportW, viewportH) predicts the CSS layout in e2e tables, so rows do not hard-code which layout a size gets"

requirements-completed: [HOME-06, HOME-05]

coverage:
  - id: D1
    description: "No poster pin box meets the summit plaque column inflated by 8 px at the eleven UAT sizes (360x640 to 1440x900), static mode, in Chromium and Firefox (RED at 375x667: all four pins under the plaque)"
    requirement: HOME-05
    verification:
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#Summit plaque clears the poster pins (G-09-2, static) (11 rows per project, 22 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Compact layout: compact plate (h2 and height on one row) and signs over the frame, '#summit dl' hidden; kicker and four stats visible in [data-summit-details], a group named by the summit h2. Full layout and reduced motion keep the full plaque with [data-summit-details] hidden"
    requirement: HOME-06
    verification:
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#compact/full summit clears every poster pin at {size}; reduced motion keeps the full plaque with its stats at 375 x 667; the compact stats are a group named by the summit h2 at 375 x 667"
        status: pass
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#plaque shows the derived summit stats (1280 x 720, unchanged)"
        status: pass
      - kind: unit
        ref: "components/home/__tests__/summit.test.tsx#SummitDetails (HOME-06; G-09-2, 09-18)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Jest sweep: posterFrame pins keep at least 4 px from the modelled column at 12,092 phone, tablet and desktop sizes, gutters 0 and 10 px; globals.css variants equal SUMMIT_FULL_MEDIA"
    requirement: HOME-05
    verification:
      - kind: unit
        ref: "lib/__tests__/summit-layout.test.ts (18 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Heading outline unchanged (no h3), summit still one stage tall, skip target and readout arrival unchanged; 3D summit tests unaffected"
    requirement: HOME-06
    verification:
      - kind: e2e
        ref: "npx playwright test e2e/home-ascent.spec.ts e2e/home-modes.spec.ts --project=chromium --project=firefox (126 passed)"
        status: pass
      - kind: e2e
        ref: "npx playwright test e2e/home-canvas.spec.ts --project=chromium -g summit (5 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The compact summit reads as a summit plaque on a real phone and tablet (one-line plate, signs, stats after the frame), and the four pins read clearly above it"
    requirement: HOME-06
    verification: []
    human_judgment: true
    rationale: "Tests measure geometry and visibility; whether the compact plate and the relocated stats feel right is a visual judgement for UAT test 2, and the summit visual baselines change"

duration: 14min
completed: 2026-10-25
status: complete
---

# Phase 09 Plan 18: Compact summit plaque (G-09-2, static half) Summary

**Where the full plaque cannot sit beside the fixed poster pins, the summit now docks a 320 px column at the bottom (a one-line "Matterhorn summit / 4,478 m" plate and the trail signs) and moves the kicker and four stats into a plate after the ascent. At 375 x 667 the four pins went from 15-120 px under the plaque to 68-259 px clear. The thresholds live in `lib/ascent/summit-layout.ts`. A 12,092-size Jest sweep and a CSS guard tie that module to `posterFrame` and `app/globals.css`.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-10-25T16:44:36Z
- **Completed:** 2026-10-25T16:59:03Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Two block-form custom variants, `summit-full` (`@media (orientation: landscape) and (68.75rem <= width < 121.5rem)`) and `summit-compact` (`not all and` the same condition). They are mutually exclusive.
- SummitPlaque collapses under `summit-compact:motion-safe`: the column becomes `max-w-80`, the plate becomes `px-4 py-2`, the kicker and dl are hidden, the h2 and height share one baseline row at 16 px, and the signs move up to `mt-2`. The block scrim is gone.
- New `SummitDetails`: a `role="group"` labelled by `summit-title`, rendered after the ascent grid and outside the track. It holds the kicker and `SummitStats`. It is hidden in the full layout and under reduced motion, so only one stats copy is ever exposed (T-09-29).
- `summit-layout.ts` (import-free) holds the constants, `summitLayoutAt` and `summitColumnBox`. Its sweep covers 12,092 sizes and passes. On a 1-2 px grid the worst gaps are: phone compact 14.5 px (430 x 553), tablet full 8.3 px (1100 x 600), desktop full 4.4 px (1942 x 1440, the reason for the 1944 px bound). Compact landscape and desktop cases stay at 64 px or more.
- UI-SPEC Summit Section amended: 5 tags, plus the 09-20 note.

## Measured result (static mode, dev server)

**Tracer RED** (Task 1 step 5, before the component change, Chromium, 375 x 667):

```
Error: pin 1 gap to the plaque column   Received: -104.96875
Error: pin 2 gap to the plaque column   Received: -117.15625
Error: pin 3 gap to the plaque column   Received: -120.453125
Error: pin 4 gap to the plaque column   Received: -15.484375
Error: expect(locator).toBeHidden() failed   Received: visible   ('#summit dl')
1 failed
```

**Tracer GREEN** (after): `10 passed` for `-g "Summit|summit|375 px|heading outline"`, and again on the tracer gate re-run.

**Eleven-size table** (pin gap to the plaque column in px, pins 1 / 2 / 3 / 4; all must be at least 8):

| Size | Layout | Chromium | Firefox |
|---|---|---|---|
| 360 x 640 | compact | 239.1 / 198.9 / 97.8 / 57.2 | 239.6 / 199.4 / 98.3 / 57.7 |
| 375 x 667 | compact | 258.7 / 216.6 / 110.8 / 68.3 | 259.2 / 217.1 / 111.3 / 68.8 |
| 375 x 553 | compact | 175.9 / 141.8 / 56.0 / 21.5 | 176.4 / 142.3 / 56.5 / 22.0 |
| 390 x 844 | compact | 387.1 / 332.7 / 195.8 / 140.9 | 387.6 / 333.2 / 196.3 / 141.4 |
| 412 x 839 | compact | 383.5 / 329.4 / 193.4 / 138.8 | 384.0 / 329.9 / 193.9 / 139.3 |
| 768 x 1024 | compact | 517.8 / 450.8 / 282.3 / 307.3 | 518.3 / 451.3 / 282.8 / 313.7 |
| 778 x 1024 | compact | 517.8 / 450.8 / 282.3 / 313.7 | 518.3 / 451.3 / 282.8 / 320.1 |
| 820 x 1180 | compact | 631.0 / 553.1 / 357.3 / 369.5 | 631.5 / 553.6 / 357.8 / 375.9 |
| 1024 x 768 | compact | 402.0 / 331.2 / 153.2 / 473.2 | 404.7 / 333.3 / 153.5 / 481.4 |
| 1280 x 720 | full | 309.0 / 283.4 / 31.9 / 497.5 | 310.8 / 285.0 / 31.5 / 500.8 |
| 1440 x 900 | full | 337.4 / 308.5 / 25.4 / 549.6 | 339.2 / 310.1 / 25.0 / 552.8 |

The model is conservative. At 375 x 553 it predicts 14.5 px for pin 4, and the browser measures 21.5 px, because the real compact column is a few px shorter than the modelled 170.

**Reduced motion at 375 x 667** (#summit centred; recorded, not gated: reduced motion is the stacked layout with no fixed summit frame):

| Pin | Chromium box (x, y, 24 x 40) | Gap to plaque column | Firefox box | Gap |
|---|---|---|---|---|
| 1 | 244.0, 188.5 | -105.0 px | 250.4, 178.4 | -108.6 px |
| 2 | 231.8, 230.6 | -117.2 px | 238.3, 220.5 | -120.8 px |
| 3 | 112.5, 336.5 | -120.5 px | 118.9, 326.3 | -126.9 px |
| 4 | 333.5, 378.9 | -15.5 px | 339.9, 368.8 | -19.1 px |

Under reduced motion the full plaque still covers the poster pins when the summit is centred (the same overlap as before this plan). That is in line with the plan, which keeps the full plaque at natural height there. It is flagged below for Tim.

## Task Commits

1. **Task 1: Compact summit at 375 x 667 end-to-end (tracer)**: `d4fc6c7` (fix)
2. **Task 2: summit-layout module and the geometry sweep (TDD)**: RED `63c438f` (test), GREEN `dd7c5aa` (feat)
3. **Task 3: Eleven-size sweep, compact semantics, jsdom checks, UI-SPEC**: `3799586` (test)

**Plan metadata:** the docs commit that follows this SUMMARY

Tracer gate: interactive run (`_auto_chain_active` false), `end-of-phase`, automated-only `<verify>`. The verify was re-run green after the commit (10 passed), and then the plan expanded.

## TDD Gate Compliance

- **RED** (`63c438f`): `lib/__tests__/summit-layout.test.ts` with a signature-only `summit-layout.ts` stub (NaN constants and box, empty media, constant `'compact'`). The run used a flat-TAP-13 Jest reporter in the session scratchpad, as in 09-01 through 09-14. `check tdd-red-evidence` returned **RED_EVIDENCE_OK** (`target_test_failed`, format `tap`, no report errors): 18 tests, 9 pass, 9 fail. The target was `lib/__tests__/summit-layout.test.ts > poster pins clear the modelled summit column (12092 sizes) > keeps every poster pin at least 4 px from the column at 12092 sizes, gutters 0 and 10 px`.
  - **Semantic assessment:** the target executed and failed on its `toEqual([])` assertion, with 48,368 failure lines (`pin k gap NaN`), because the stub column is NaN. There was no load, import, syntax or fixture fault. The 9 tests that passed in RED expect `'compact'`, which the stub's constant return happens to satisfy. They guard against regressions but cannot drive the implementation.
- **GREEN** (`dd7c5aa`): 18/18 pass, and the sweep is clean at 12,092 sizes.
- **REFACTOR:** none.

## Files Created/Modified

- `lib/ascent/summit-layout.ts`: thresholds, `SUMMIT_FULL_MEDIA`, `summitLayoutAt` and `summitColumnBox`. Import-free.
- `lib/__tests__/summit-layout.test.ts`: layout cases, the globals.css guard, column-box checks against the debug measurements (right edges 539 and 619), and the 12,092-size sweep.
- `components/home/SummitDetails.tsx`: the compact layout's kicker and stats after the ascent.
- `components/home/SummitPlaque.tsx`: exported `SummitStats`, compact-plate classes, no scrim, and an updated doc comment.
- `components/home/AscentHero.tsx`: renders `<SummitDetails />` after the grid, inside AscentController. The doc comment is updated.
- `app/globals.css`: the two custom variants, with a comment that names G-09-2, 09-18 and the module.
- `e2e/home-ascent.spec.ts`: `summitBoxes` and `boxGap` helpers, the clearance describe (eleven rows, reduced motion, group name), and the 375 px overflow dd check now reads `[data-summit-details]`.
- `components/home/__tests__/summit.test.tsx`: tests for the compact classes and the absence of gradients, plus the SummitDetails order, group and visibility tests.
- `.planning/phases/09-home-ascent/09-UI-SPEC.md`: Summit Section rows, the E9 overflow row, and the 09-20 note.

## Decisions Made

- I followed the planner's "relocate the stats" form. Under `summit-compact:motion-safe` the h2 keeps `id="summit-title"` and only its margin and size change. The heading outline stays as it was.
- The square viewport counts as compact (CSS orientation is portrait when width equals height), and a test pins this.
- `summitColumnBox` narrows the compact column to the content box on narrow phones (318 px at 360), as the browser does.
- ui-ux-pro-max was loaded before the UI work. The rules applied were content-priority (fold secondary content below the frame and keep it visible), heading-hierarchy (no new heading), reduced-motion (keep the full plaque) and orientation-support (landscape tablets below 1100 px get the compact layout).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Test diagnostics] Soft assertions and gap annotations in the clearance e2e**
- **Found during:** Task 1 (RED run)
- **Issue:** a hard `expect` stopped at pin 1, so a failing run did not report the other pins' gaps.
- **Fix:** each pin uses `expect.soft` and adds an annotation with its gap. The reduced-motion test records its four values this way, as Task 3 requires.
- **Files modified:** e2e/home-ascent.spec.ts
- **Committed in:** d4fc6c7, 3799586

**Total deviations:** 1 (test diagnostics only)
**Impact on plan:** None on behaviour.

### Notes

- `app/globals.css` and `components/home/__tests__/summit.test.tsx` already failed Prettier at HEAD (whole-file line endings, and the file's own trailing-comma style). Only the lines this plan changed were formatted to match. The other files pass Prettier.

## Issues Encountered

- None blocking. Playwright's webServer started the dev server for the runs.

## Verification

- Task 1: `npx playwright test e2e/home-ascent.spec.ts --project=chromium -g "Summit|summit|375 px|heading outline"`: 10 passed (twice); `npm run lint && npm run type-check`: exit 0
- Task 2: `npx jest lib/__tests__/summit-layout.test.ts --silent`: 18 passed
- Task 3: `npx playwright test e2e/home-ascent.spec.ts --project=chromium --project=firefox -g "Summit|summit"`: 42 passed (11 clearance rows per project); `npx jest components/home/__tests__/summit.test.tsx lib/__tests__/summit-layout.test.ts --silent`: 30 passed; `-g "heading outline"`: exit 0
- Plan: `npx playwright test e2e/home-ascent.spec.ts e2e/home-modes.spec.ts --project=chromium --project=firefox`: 126 passed
- Plan: `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests`: Jest 674/674 (48 suites); test-count OK, jest 674 + e2e 213 = 887 (baseline 832)
- Extra regression check: `npx playwright test e2e/home-canvas.spec.ts --project=chromium -g summit`: 5 passed (the 3D summit tests still clear the smaller plaque)
- Acceptance greps: `@custom-variant summit-compact` 1, `@custom-variant summit-full` 1, `bg-linear-to-t` in SummitPlaque 0, `data-summit-details` in SummitDetails 1, `<SummitDetails` in AscentHero 1, `^import` in summit-layout.ts 0, sweep size count 12,092 (in the test name), "Compact plaque + measured 3D, 09-18" in UI-SPEC 5

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- The static half of G-09-2 is closed in code and tests. 09-20 still owes the 3D half (measured framing).
- **For Tim:** under reduced motion the full plaque still covers the poster pins when the summit is centred at 375 x 667 (gaps -15 to -121 px). The plan records this without gating it, because reduced motion has no fixed summit frame. If it matters, a follow-up could apply the compact layout under reduced motion as well.
- Summit visual baselines will change at every compact size (phones, tablets and 1024 x 768), and wherever the old scrim showed below 768 px. They need a re-baseline through the gh workflow, and Tim commits the PNGs.
- UAT test 2 (static half) can be re-checked on a phone and a tablet.
- Ready for 09-19.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*

## Self-Check: PASSED

- Files exist: lib/ascent/summit-layout.ts, lib/__tests__/summit-layout.test.ts, components/home/SummitDetails.tsx and the six modified files
- Commits on this branch: d4fc6c7, 63c438f, dd7c5aa, 3799586 (`git rev-list --count 974b6d4..HEAD` = 4 before this docs commit)
- Acceptance criteria re-run: all pass
