---
phase: 11-engineering-roadmap
plan: 12
subsystem: ui
tags: [react, server-components, tailwind, svg, contrast-guard, sac-waymark, elevation-profile]

requires:
  - phase: 11-04
    provides: "data/generated/trail-profiles.ts (DEM endpoints, 128-point profiles) and lib/trail-profile.ts profilePath"
  - phase: 11-18
    provides: "lib/trail-grade.ts markerForGrade, TRAIL_GRADES, MARKER_NAMES"
  - phase: 11-06
    provides: "RoutePanel with the empty 3fr/2fr right column and the /projects mapper"
  - phase: 11-07
    provides: "Trailhead band, Project.route and Project.metrics in data/projects.ts"
provides:
  - "Trail paint primitives --trail-blaze, --trail-mountain, --trail-alpine and background-only utilities bg-trail-blaze/-mountain/-alpine"
  - "check-contrast: ink-inverse/ink text pair and ten TRAIL non-text pairs (47 pairs), selftest 81/81 with a new low-trail case"
  - "TrailGradeMark (Server): SAC waymark glyph + Mono grade + sr-only waymark name, data-marker hook"
  - "RouteProfile (Server): decorative stretched profile svg with the signpost caption from DEM endpoints"
  - "RoutePanel strip / releaseLine / figure props; /projects mapper wires metrics tiles, release line and RouteProfile"
  - "Trailhead renders the project's RouteProfile in its right column from 1024 px (figure prop removed)"
affects: [11-13, 11-16, 11-17 visual review, /projects, /projects/box, /projects/coin-flip]

actuals:
  tokens: 12500
  tasks: 3
  commits: 7
plan_head_before: 236ac76872c90dec3d87b6e0df2625e601ae4ea5
plan_head_after: e79c97e4d56d2d35f1999dcbc2b3014914b059df

tech-stack:
  added: []
  patterns:
    - "Trail paint as L1 :root primitives outside --color-*, painted only through @utility bg-trail-*; the contrast guard reads them by their --trail-* name"
    - "Badge baseline from text: inline-flex items-baseline with a self-center glyph, so a text-less glyph never sets the baseline"
    - "Caption units: nowrap spans, aria-hidden visual separators paired with sr-only spoken words"

key-files:
  created:
    - components/projects/TrailGradeMark.tsx
    - components/projects/RouteProfile.tsx
    - components/projects/__tests__/TrailGradeMark.test.tsx
    - components/projects/__tests__/RouteProfile.test.tsx
    - scripts/guards/__selftest__/contrast/low-trail.css
  modified:
    - app/globals.css
    - scripts/guards/check-contrast.mjs
    - scripts/guards/selftest.mjs
    - scripts/guards/__selftest__/contrast/at-threshold.css
    - scripts/guards/__selftest__/contrast/below-threshold.css
    - scripts/guards/__selftest__/contrast/low-ink.css
    - scripts/guards/__selftest__/contrast/missing-danger.css
    - scripts/guards/__selftest__/contrast/unknown-token.css
    - scripts/guards/__selftest__/contrast/var-cycle.css
    - components/projects/Trailhead.tsx
    - components/projects/RoutePanel.tsx
    - components/projects/__tests__/RoutePanel.test.tsx
    - app/(site)/projects/page.tsx
    - e2e/projects.spec.ts
    - e2e/case-study.spec.ts

key-decisions:
  - "11-12: all four §I answers are the defaults (default.5, .7, .9, N3), so no alternative was applied; --trail-yellow is untouched and Home's shots do not change"
  - "11-12: the coin-flip caption reads 'Zermatt 1,606 m → Zmutt 1,950 m · T1' because the generator ends at Zmutt 56 (Tim's D4 choice in 11-04); the UI-SPEC's 1,934 m was the earlier hamlet-centre estimate"
  - "11-12: the figcaption adds an sr-only ', ' before the grade so the accessible caption equals the UI-SPEC text 'Schwarzsee 2,587 m to Hörnlihütte 3,262 m, T4, white-blue-white waymark'"
  - "11-12: TrailGradeMark aligns on its grade text's baseline (items-baseline, glyph self-center); the first build put the middle dot above the badge"

patterns-established:
  - "Trail paint pattern: a new waymark colour is a :root --trail-* primitive, one @utility bg-trail-* and its pairs in check-contrast TRAIL, added in one commit"
  - "Responsive visibility is asserted in e2e by bounding boxes and toBeHidden, never by class assertions in unit tests"

requirements-completed: [ENG-01, ENG-04]

coverage:
  - id: D1
    description: "Trail paint primitives and background-only utilities, with the toggle text pair and ten trail non-text pairs measured by the contrast guard on every lint"
    requirement: ENG-01
    verification:
      - kind: other
        ref: "npm run guard:contrast -> contrast: OK (47 pairs); npm run guard:palette -> palette: OK"
        status: pass
      - kind: other
        ref: "npm run guard:selftest -> 81/81 (incl. 'a waymark bar below 3:1 on its white neighbour fails')"
        status: pass
    human_judgment: false
  - id: D2
    description: "TrailGradeMark draws every SAC grade's waymark with its grade text and accessible waymark name; T7 throws"
    requirement: ENG-01
    verification:
      - kind: unit
        ref: "components/projects/__tests__/TrailGradeMark.test.tsx (11 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "RouteProfile renders the real trail profile with the DEM signpost caption; unknown id renders nothing; trailhead shows it beside the h1 from 1024 px only"
    requirement: ENG-01
    verification:
      - kind: unit
        ref: "components/projects/__tests__/RouteProfile.test.tsx (7 tests)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#the {box,coin-flip} trailhead shows its route profile beside the title from 1024 px only (chromium + firefox, production build)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Route panels show the audited metric strip with its release line, the links row and the profile figure (right column from 1024 px, last in one column below)"
    requirement: ENG-04
    verification:
      - kind: unit
        ref: "components/projects/__tests__/RoutePanel.test.tsx (16 tests), components/projects/__tests__/projects-page.test.tsx"
        status: pass
      - kind: e2e
        ref: "e2e/projects.spec.ts (strip and release line, signpost caption, 1440 px figure right of title, 375 px one column; chromium + firefox, production build)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The trail glyphs, waymark badges and caption wrapping read well at 375 and 1440 px"
    verification: []
    human_judgment: true
    rationale: "Visual judgement reserved for Tim's 11-17 review; screenshots are in the 11-12 scratchpad folder"

duration: 13min
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 12: Trail Paint, Waymark Badge, Route Profile and Panel Strips Summary

**Each route panel now reads like a trail signpost: the audited metric strip with its release line, the links row, and the real swisstopo elevation profile with a DEM caption and its SAC waymark badge (white-blue-white T4 for box's Hörnliweg, yellow T1 for coin-flip's Zmutt path), repeated beside the trailhead title from 1024 px.**

## Performance

- **Duration:** about 13 min
- **Started:** 2026-11-01T21:59:35Z
- **Completed:** 2026-11-01T22:12:28Z
- **Tasks:** 3
- **Files modified:** 20 (5 created, 15 modified)

## Accomplishments

- `app/globals.css` adds the three trail primitives (`--trail-blaze: var(--firn-50)`, `--trail-mountain: oklch(0.6 0.2 27)`, `--trail-alpine: oklch(0.55 0.17 255)`) in `:root` outside `--color-*`, and three background-only utilities. No `text-trail` or `border-trail` utility exists.
- `check-contrast.mjs` measures the pressed-toggle text pair and the ten trail non-text pairs. The selftest expects 47 pairs, and every contrast fixture still fails or passes only on its own token. A new `low-trail` case proves that a weak bar fails.
- `TrailGradeMark` (Server, zero JS) draws the SAC vocabulary: a yellow rhombus for T1, white-red-white and white-blue-white bars for T2 to T5, and a dashed unpainted box for T6. The visible Mono grade and the sr-only waymark name always follow the glyph.
- `RouteProfile` (Server) is the only reader of the generated profiles. It draws three paths in a stretched decorative svg with non-scaling strokes. The caption comes from the DEM endpoints, and its units are nowrap.
- The `RoutePanel` strip is a `dl` of up to three label-over-value items. Values are Mono, tabular and final on first paint, with no count-up. The release line renders only with the strip. The figure sits in the right column, vertically centred, from 1024 px.

## Captions as rendered

| Project | On screen | Screen reader |
|---------|-----------|---------------|
| box (Hörnliweg No. 27) | `Schwarzsee 2,587 m → Hörnlihütte 3,262 m · [white-blue-white] T4` | "Schwarzsee 2,587 m to Hörnlihütte 3,262 m, T4, white-blue-white waymark" |
| coin-flip (Zmutt path No. 2) | `Zermatt 1,606 m → Zmutt 1,950 m · [yellow diamond] T1` | "Zermatt 1,606 m to Zmutt 1,950 m, T1, yellow waymark" |

The heights use U+00A0 before `m` (formatMetres) and come from `data/generated/trail-profiles.ts`. Zmutt reads 1,950 m, not the 1,934 m in the plan and the UI-SPEC, because 11-04 ends the route at Zmutt 56 (Tim's D4 choice).

## Contrast output for the new pairs

```
ink-inverse/ink 16.03 4.5 PASS
trail-mountain/trail-blaze 3.65 3 PASS
trail-alpine/trail-blaze 4.12 3 PASS
trail-mountain/surface 4.39 3 PASS
trail-mountain/surface-raised 4.11 3 PASS
trail-mountain/surface-overlay 3.78 3 PASS
trail-alpine/surface 3.89 3 PASS
trail-alpine/surface-raised 3.64 3 PASS
trail-alpine/surface-overlay 3.34 3 PASS
trail-blaze/surface-raised 15.02 3 PASS
trail-yellow/surface-raised 10.89 3 PASS
contrast: OK (47 pairs)
```

Every ratio matches the UI-SPEC [MEAS] table.

## §I answers applied

- default.5, default.7, default.9 and N3 are all defaults (11-02-SUMMARY), so no alternative was applied. The walkthrough link stays on the trailhead only. GitHub opens in the same tab. Softened metrics stay out of the strip.
- **For 11-17:** `--trail-yellow` is unchanged, so Home's shots do not change. The /projects and both case-study trailhead shots do change: the strip, the release line and the figure on /projects, and the figure in the trailhead right column at 1440 px. Screenshots for Tim's glyph review, all in `C:/Users/tim/AppData/Local/Temp/claude/C--Users-tim-MyDocuments-Programming-portfolio-app/ebfba413-5614-4b39-a7f0-e6f6989d984a/scratchpad/11-12/`: `projects-375.png`, `projects-1440.png`, `box-375.png`, `box-1440.png`, `coin-flip-375.png`, `coin-flip-1440.png` and `figure-{0,1}-{375,1440}.png`. They were taken after the baseline fix.

## Task Commits

1. **Task 1 RED: waymark badge tests** - `36d3781` (test)
2. **Task 1 GREEN: trail paint, contrast pairs, TrailGradeMark** - `278c225` (feat)
3. **Task 2 RED: route profile tests** - `1cdd023` (test)
4. **Task 2 GREEN: RouteProfile and the trailhead figure** - `2d838de` (feat)
5. **Task 3 RED: panel strip, release line and figure tests** - `6dd84b7` (test)
6. **Task 3 GREEN: panel strip, release line, figure, page mapper, e2e** - `2eb1076` (feat)
7. **Visual fix: badge baseline alignment** - `e79c97e` (fix)

## TDD Gate Compliance

- **RED 1:** `npx jest components/projects/__tests__/TrailGradeMark.test.tsx` ran 11 tests and all 11 failed. They failed on 'no waymark glyph rendered', and the T7 case got no throw. The first run without a module was a load failure (module not found), which does not count as RED. A `return null` stub was committed with the tests so that the suite loads and fails on its assertions.
- **RED 2:** `RouteProfile.test.tsx` ran 7 tests. The 5 positive targets failed with "Unable to find an accessible element with the role figure". The 2 negative cases (unknown id renders nothing, no route means no figure) passed under the null stub, as negative cases do.
- **RED 3:** `RoutePanel.test.tsx` ran 16 tests. The 4 new positive cases failed (`Expected length: 1, Received length: 0` for the `dl`, and the figure missing). The 2 new negative cases and the 10 existing ones passed.
- Semantic assessment: every target test ran, with no load, syntax or fixture fault, and each failed because the planned markup did not exist yet. The JSON classifier (`check tdd-red-evidence`) was not run. The plan is `type: execute`, and Jest's default report is not one of its supported formats (11-18 handled this the same way).
- Every GREEN `feat` commit follows its `test` commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] RED stubs so the suites fail on assertions, not on a missing module**
- **Found during:** Tasks 1 and 2
- **Issue:** Without the component modules the test suites failed to load. That is an invalid RED.
- **Fix:** A `return null` stub was committed in each RED commit and replaced in the matching GREEN commit.
- **Files modified:** components/projects/TrailGradeMark.tsx, components/projects/RouteProfile.tsx
- **Committed in:** 36d3781, 1cdd023

**2. [Rule 2 - Missing critical] A failing trail fixture for the contrast guard**
- **Found during:** Task 1
- **Issue:** The new code path, which reads `--trail-*` tokens by their own name, had no case that proves a weak bar fails.
- **Fix:** Added `__selftest__/contrast/low-trail.css` and a selftest case: `trail-mountain/trail-blaze 1.40 3 FAIL`, exactly 1 failure.
- **Committed in:** 278c225

**3. [Rule 1 - Bug] The waymark badge sat below the caption's middle dot**
- **Found during:** Task 3 screenshot check
- **Issue:** The text-less glyph was the first item of the `inline-flex` badge, so its bottom edge became the badge baseline. That pushed the glyph and the grade below the `·` (visible in the 1440 px box caption).
- **Fix:** The badge root is now `items-baseline` and each glyph is `self-center`, so the grade text sets the baseline.
- **Verification:** New screenshots, Jest (113 component tests) and e2e passed again.
- **Committed in:** e79c97e

**4. [Rule 2 - Test rules] Responsive and font checks moved to e2e**
- **Found during:** Tasks 2 and 3
- **Issue:** The plan's test rules allow only the waymark paint as a class assertion. "Hidden below 1024 px" and "each dd in Mono" can only be class checks in jsdom.
- **Fix:** The unit tests assert presence, text and DOM order. The trailhead's 1440 px visible and right-of-h1 behaviour and its 375 px hidden behaviour are asserted in a new `e2e/case-study.spec.ts` test (a file outside the plan's `files_modified`). The dd font family (JetBrains) and `tabular-nums` are asserted by computed style in `e2e/projects.spec.ts`.
- **Committed in:** 2eb1076

**5. [Rule 2 - Accessibility] sr-only ', ' before the grade in the caption**
- **Found during:** Task 2
- **Issue:** With only the aria-hidden ` · `, a screen reader would hear "3,262 mT4". The UI-SPEC's accessible text is "…3,262 m, T4, white-blue-white waymark".
- **Fix:** Added an sr-only `, ` inside the badge unit, next to the aria-hidden `· `.
- **Committed in:** 2d838de

---

**Total deviations:** 5 auto-fixed (1 blocking, 3 missing critical, 1 bug). **Impact:** no scope creep. Each fix serves the plan's own behaviour, its test rules or the UI-SPEC's accessible text.

## Verification

- `npm run lint` exit 0 (palette OK, contrast OK with 47 pairs, selftest 81/81, data:check trails OK, served-images OK). `npm run type-check` exit 0.
- `npx jest --silent`: 78 suites, 1224 tests passed.
- `PW_PROD=1 npx playwright test e2e/projects.spec.ts e2e/case-study.spec.ts --project=chromium --project=firefox`: 82 passed on the production build, both before and after the baseline fix. `public/service-worker.js` was restored after each build.
- Acceptance greps: there are 3 trail primitives and 3 trail utilities, and no text or border trail utility. The guard prints `ink-inverse/ink` and `trail-alpine/trail-blaze`. `non-scaling-stroke` appears 2 times. `RouteProfile` has 0 `use client`. Trailhead has 1 `<RouteProfile`, and the page has 1. RoutePanel has 1 `<dl` and 0 `useState|useEffect|requestAnimationFrame`. No client module imports `trail-profiles`.

## Issues Encountered

None beyond the deviations above.

## Requirements

ENG-01 and ENG-04 are both declared by sibling plans that have no SUMMARY yet (`requirements.ready-ids` returns ready: [], blocked: [ENG-01, ENG-04]). They were not marked complete here. The last declaring plan marks them.

## User Setup Required

None. No external service configuration is needed.

## Next Phase Readiness

- 11-13 can build on the RoutePanel `strip`, `releaseLine` and `figure` props, and on the ENG-04 ordering and adjacency they leave open.
- 11-17 visual review: re-baseline /projects and both case-study trailheads. Home is unchanged.
- 11-15 is still paused at its Task 2 checkpoint (Tim records the coin-flip clip or replies none). This plan did not touch its files.

## Self-Check: PASSED

- All 5 created files exist on disk; all 7 task commits (36d3781, 278c225, 1cdd023, 2d838de, 6dd84b7, 2eb1076, e79c97e) are ancestors of HEAD.
