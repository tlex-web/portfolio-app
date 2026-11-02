---
phase: 12-contact-edge-pages-cleanup-verification
plan: 07
subsystem: ui
tags: [react, tailwind, a11y, playwright, jest, route-log, d-24]

requires:
  - phase: 12-01
    provides: "Resolved values: log.phase11 supplied, default.9 to default.12 supplied (defaults), copy.heads-sentence not supplied"
provides:
  - "EndBlock sign height from min-h-14 only (banned py-3 removed)"
  - "DemoTerminal body sized by the tallest entry through one [grid-area:1/1] cell"
  - "Metric Source links named 'Source for {label}' by aria-label (label in name)"
  - "Route log: Phase 11 completed 2026-11-02, Phase 12 in progress, surveyedAt 2026-11-02"
  - "RouteLog camp marker inside the relative camp h2, no pixel offsets, same box at 375/768/1440"
  - "09-UI-SPEC Hero scrim row amended to lg: as built (default.10)"
affects: [12-11 re-baseline round 1, 12-22 deferred-list copy, roadmap, projects]

actuals:
  tokens: 8800
  tasks: 3
  commits: 5
plan_head_before: 8fae4f88b16a1457b0591d4ef3cf9603e2076ad8
plan_head_after: 4840ac2

tech-stack:
  added: []
  patterns:
    - "Accessible names that extend visible text use aria-label beginning with the visible word, not sr-only suffixes"
    - "Decorative markers are positioned inside the element they annotate, from existing custom properties (calc(var(--axis-x) * -1) + translate), never pixel literals"

key-files:
  created: []
  modified:
    - components/projects/EndBlock.tsx
    - components/projects/DemoTerminal.tsx
    - components/projects/sections/Metrics.tsx
    - components/projects/__tests__/EndBlock.test.tsx
    - components/projects/__tests__/DemoTerminal.test.tsx
    - components/projects/__tests__/Metrics.test.tsx
    - e2e/case-study.spec.ts
    - data/roadmap.ts
    - data/__tests__/roadmap.test.ts
    - components/roadmap/RouteLog.tsx
    - components/roadmap/__tests__/RouteLog.test.tsx
    - e2e/roadmap.spec.ts
    - .planning/phases/09-home-ascent/09-UI-SPEC.md

key-decisions:
  - "Metric Source links use aria-label 'Source for {label}' instead of an sr-only suffix, so the name begins with the visible word and jsdom and browsers compute the same name"
  - "RouteLog camp marker: left calc(var(--axis-x) * -1) with -translate-x-1/2 centres it on the axis from inside the h2; --axis-x (45 px) already includes the p-6 padding and border, so no separate padding term is needed"
  - "copy.heads-sentence not supplied: coin-flip clip description unchanged, item pending Tim"
  - "Phase 9 dispositions follow Tim's quoted defaults (default.10, .11, .12): scrim spec amended to lg:, wedge closed as terrain, rail tick accepted; no code change"

patterns-established:
  - "Label in name via aria-label that starts with the visible text"
  - "Marker geometry from band custom properties, measured before and after at three widths"

requirements-completed: [VERIFY-02, VERIFY-04]

coverage:
  - id: D1
    description: "EndBlock plate has no py-3; the sign keeps min-h-14 and items-stretch"
    requirement: VERIFY-04
    verification:
      - kind: unit
        ref: "components/projects/__tests__/EndBlock.test.tsx#takes its height from min-h-14 (the 09 TrailSigns height), not from 12 px padding (12 D-24)"
        status: pass
    human_judgment: false
  - id: D2
    description: "DemoTerminal entries share one [grid-area:1/1] cell, inactive ones invisible and aria-hidden; body height constant while command 2 types at 375 px; no horizontal scroll at 375 px"
    requirement: VERIFY-04
    verification:
      - kind: unit
        ref: "components/projects/__tests__/DemoTerminal.test.tsx#DemoTerminal body height (12-UI-SPEC D-24, E13)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#the body height does not change while the first command types, at 375 px (E13)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#Demo (ENG-05) no horizontal scroll at 375 px"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each metric Source link is named 'Source for {label}' with visible text 'Source'"
    requirement: VERIFY-04
    verification:
      - kind: unit
        ref: "components/projects/__tests__/Metrics.test.tsx#names every source link \"Source for {label}\", beginning with its visible word (G-11-4, 12 D-24)"
        status: pass
      - kind: e2e
        ref: "e2e/case-study.spec.ts#box Metrics source links carry their tile name in the accessible name only, at 375, 768 and 1440 px (G-11-4, 12 D-24)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Route log records Phase 11 completed 2026-11-02, Phase 12 in progress, surveyedAt 2026-11-02; D-20 test passes"
    requirement: VERIFY-02
    verification:
      - kind: unit
        ref: "data/__tests__/roadmap.test.ts#surveyedAt (ROUTE-03 adjacency, D-20)"
        status: pass
      - kind: unit
        ref: "data/__tests__/roadmap.test.ts#v2.0 carries phases 7 to 12: 7-11 completed with dates, 12 in progress (12-01 log.phase11)"
        status: pass
      - kind: e2e
        ref: "e2e/roadmap.spec.ts#the v2.0 phase disclosure starts closed and shows the in-progress phase from the data (D-18)"
        status: pass
    human_judgment: false
  - id: D5
    description: "RouteLog camp marker inside the camp h2 with no pixel offsets, same bounding box before and after at 375, 768 and 1440 px"
    requirement: VERIFY-04
    verification:
      - kind: unit
        ref: "components/roadmap/__tests__/RouteLog.test.tsx#draws the axis, the camp marker and the row ticks out of the accessibility tree"
        status: pass
      - kind: other
        ref: "scratchpad marker.cjs Playwright measurement, before/after on production builds (table in this SUMMARY)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Phase 9 dispositions: hero scrim spec row amended to lg: (default.10); wedge closed (default.11); rail tick accepted (default.12)"
    requirement: VERIFY-02
    verification: []
    human_judgment: true
    rationale: "Documentation dispositions of Tim's choices; no automated test asserts spec wording. 12-22 copies them into the 09 deferred list."

duration: 17min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 07: D-24 Carry-over Visual Fixes (Round 1) Summary

**EndBlock loses its banned 12 px padding, metric Source links get `Source for {label}` names by aria-label, DemoTerminal uses the spec's single `[grid-area:1/1]` cell, the route log takes Tim's Phase 11 and 12 dates, and the RouteLog camp marker moves into its heading with no pixel offsets (0 px moved at three widths).**

## Performance

- **Duration:** about 17 min
- **Started:** 2026-11-02T18:29:04Z
- **Completed:** 2026-11-02T18:46Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- EndBlock (`components/projects/EndBlock.tsx`): `py-3` removed from the plate. The sign's `min-h-14 items-stretch` (already on the link) now sets the height alone. No banned 12 px padding remains.
- Metrics: each Source link carries `aria-label="Source for {label}"`. The visible text is still `Source`, so label-in-name holds (11-UI-REVIEW Pillar 1). The sr-only ` ({label})` suffix is gone.
- DemoTerminal: every entry and the typing command's reservation copy sit in `[grid-area:1/1]`. Inactive entries are `invisible` and `aria-hidden`, and the body has no fixed height. A new e2e test checks that the body height stays constant at 375 px while command 2 types.
- Route log (`data/roadmap.ts`), from 12-01 log.phase11: Phase 11 `completed`, `completedAt: '2026-11-02'`; Phase 12 `in-progress`; `surveyedAt = '2026-11-02'`. The header comment cites 12-01 and Tim's reply of 2026-11-02, and the D-20 test passes.
- RouteLog: the camp marker is now a child of the camp `h2`, which is made `relative`. It is positioned with `top-1/2 -translate-y-1/2 left-[calc(var(--axis-x)*-1)] -translate-x-1/2`, and `top-[39px] -left-[33px]` is removed.
- 09-UI-SPEC Hero scrim row: now reads `lg:` (as built), with a note citing 12-07 and the 6.84:1 measured at 768 px.

## Task Commits

1. **Task 1: Project fixes**: `52319a7` (test, RED), `e76308e` (fix, GREEN)
2. **Task 2: Route-log dates and RouteLog marker**: `6e287b5` (fix), plus `4840ac2` (test: roadmap e2e reads the in-progress phase from the data)
3. **Task 3: Phase 9 dispositions**: `52fbdb1` (docs)

**Plan metadata:** see the docs(12-07) completion commit.

## Files Created/Modified

- `components/projects/EndBlock.tsx`: plate without `py-3`; the JSDoc names the min-h-14 height source
- `components/projects/DemoTerminal.tsx`: `[grid-area:1/1]` on every body cell; layout JSDoc cites D-24 and E13; existing Prettier drift in the file fixed
- `components/projects/sections/Metrics.tsx`: aria-label `Source for {label}` on source links, sr-only suffix removed, JSDoc updated
- `components/projects/__tests__/{EndBlock,DemoTerminal,Metrics}.test.tsx`: tests for the height contract, the shared grid cell and the new link names
- `e2e/case-study.spec.ts`: Source names by aria-label at 375/768/1440 (rewrite of the G-11-4 suffix test); new demo body-height test (E13)
- `data/roadmap.ts`: Tim's log.phase11 values and the new header comment
- `data/__tests__/roadmap.test.ts`: the v2.0 phase-status test follows the new data
- `components/roadmap/RouteLog.tsx`, `components/roadmap/__tests__/RouteLog.test.tsx`: marker inside the h2; the test finds it as `#current-camp h2 > [data-camp-marker]`
- `e2e/roadmap.spec.ts`: the phase-disclosure test reads the in-progress phase from the data
- `.planning/phases/09-home-ascent/09-UI-SPEC.md`: Hero scrim row amended to `lg:`

## RouteLog marker: bounding box before and after

Production builds at `/roadmap` (viewport height 900, reduced motion, page coordinates in px). "Before" is the build of `e76308e`; "after" is the build of the Task 2 working tree, committed as `6e287b5`.

| Width | Before (x, y, w, h), parent | After (x, y, w, h), parent | Delta |
|-------|-----------------------------|----------------------------|-------|
| 375 | 16, 1054, 24, 2 (SECTION) | 16, 1054, 24, 2 (H2) | 0 |
| 768 | 24, 934, 24, 2 (SECTION) | 24, 934, 24, 2 (H2) | 0 |
| 1440 | 171, 836, 24, 2 (SECTION) | 171, 836, 24, 2 (H2) | 0 |

The camp band and h2 boxes are identical too. All three widths are within 0.5 px (exactly equal).

`grep -c "status: 'in-progress'" data/roadmap.ts`: before 2 (line 43 the v2.0 row, line 50 the **Phase 11** row); after 2 (line 44 the v2.0 row, line 52 the **Phase 12** row). The Phase 11 row is no longer counted.

## D-24 Phase 9 dispositions

| Item | Tim's choice (12-01 Resolved values) | Outcome |
|------|--------------------------------------|---------|
| #10 Hero scrim switches at `lg:` not 768 | default.10 supplied: "Default: Hero scrim: amend the 09 spec to `lg:`" | 09-UI-SPEC Hero row amended to `lg:` as built (the built `lg:` gradient stops: via 60%, to 90%). The note cites 12-07 and the 6.84:1 measured at 768 px (09-07 B7). Code unchanged |
| #11 Dark wedge in the 1440 summit frame | default.11 supplied: "Default: Summit dark wedge: close as terrain" | Closed as terrain: the peak's shadowed faces seen from above at the wide summit FOV, live canvas only (visual baselines hide canvases). No camera change |
| #12 Rail tick `2,760 m approx.` at 4.81:1 (768) | default.12 supplied: "Default: Rail tick 4.81:1: accept, B8 keeps the floor" | Accepted: passes AA (at least 4.5:1), and the B8 backstop keeps the 4.5 floor, so a regression fails CI. No scrim change |

12-22 copies these rows into `.planning/phases/09-home-ascent/deferred-items.md`. Home does not join round 1's expected diffs.

## HEADS sentence (default.9 / copy.heads-sentence)

default.9 picks the figcaption route (no poster change), but `copy.heads-sentence` is **not supplied** (12-01: Tim's reply "heads skip", no further reason given). The coin-flip clip description in `data/projects.ts` is unchanged and the poster is untouched. The item stays **pending Tim**.

## Round 1 expected diffs (for 12-11)

No visual spec was run locally; baselines come only from the CI container (12-11 is the Tim-gated round). Expected pixel effects:

- **box**: end-block plate (`py-3` removed). The sign is already 56 px from `min-h-14`, so a diff is likely to be zero or very small. Demo body: `[grid-area:1/1]` is equivalent to the former `col-start-1 row-start-1`, so zero is expected. Metrics: replacing a 1 x 1 sr-only span with an aria-label should give zero.
- **coin-flip**: end-block plate only (as for box).
- **roadmap**: the kicker date changes from 1 Nov to 2 Nov 2026 (surveyedAt), and the closed phase disclosure hides the phase rows. The marker measured 0 px moved.
- **Home**: no change (all three Phase 9 items kept their defaults).

Nothing falls outside round 1's list (box, coin-flip, roadmap).

## Decisions Made

- Source-link names use `aria-label` rather than an sr-only suffix. The UI-SPEC asks for `Source for {label}` starting with the visible word, and an aria-label gives the same name in jsdom and the browser, with no hidden text to keep at 1 x 1 px.
- The marker's horizontal offset is `calc(var(--axis-x) * -1)` plus `-translate-x-1/2`, measured from the h2 (the content edge). `--axis-x` (45 px) is the plate's `p-6` (24 px) plus its border (1 px) plus the 20 px surface offset, so the padding is already inside the custom property.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Data-pinned tests rewritten for Tim's route-log values**
- **Found during:** Task 2 verification
- **Issue:** `data/__tests__/roadmap.test.ts` ("11 in progress, 12 planned") and `e2e/roadmap.spec.ts` ("shows Phase 11 in progress") hard-coded the old phase statuses, so Task 2's verify failed after the data edit. Neither file is in the plan's file list.
- **Fix:** Rewrote both, without deleting them. The Jest test now expects phases 7 to 11 completed with dates, Phase 11 on 2026-11-02 and Phase 12 in progress. The e2e test reads the in-progress phase from the data and checks that the newest completed phase shows its date.
- **Files modified:** data/__tests__/roadmap.test.ts, e2e/roadmap.spec.ts
- **Verification:** `npx jest data/__tests__/roadmap.test.ts components/roadmap` passes (52/52); `npx playwright test e2e/roadmap.spec.ts --project=chromium` passes (26/26)
- **Committed in:** 6e287b5 (Jest), 4840ac2 (e2e)

**2. [Rule 3 - Blocking] Prettier drift in DemoTerminal.tsx**
- **Found during:** Task 1 commit
- **Issue:** The file already failed `prettier --check` at HEAD on three lines this plan did not write (the import list, Caret, setTimeout), which blocked a clean commit of the file.
- **Fix:** `prettier --write` on the file (formatting only).
- **Committed in:** e76308e

### Notes (not deviations)

- DemoTerminal already had the shared-cell layout since 11-01 (`col-start-1 row-start-1`, inactive `invisible`, no fixed height). This plan switched it to the spec's `[grid-area:1/1]` token and added tests. The remaining band in the box Demo while a short command shows is the tallest entry's reserved height, which the UI-SPEC prescribes ("as tall as the longest entry wraps at that width").
- The GREEN commit uses `fix(12-07)` as the plan specified, not `feat(...)`.

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both were needed for the plan's own verification to pass. No scope creep.

## TDD Gate Compliance

- **RED** `52319a7` `test(12-07)`: 5 target tests failed on the planned assertions: EndBlock `not.toHaveClass("py-3")`; Metrics `Unable to find ... link "Source for Label 1"` and `/^Source for /`; DemoTerminal (two tests) `toHaveClass("[grid-area:1/1]")`. 39 other tests in the three suites passed. **Semantic assessment:** each target ran and failed on its planned assertion, with no syntax, import or fixture faults. The machine classifier (`check tdd-red-evidence`) was not run: Jest's default reporter is not a supported format (TAP, JUnit and so on) and no such reporter is installed. This plan is `type: execute`, so the plan-level classifier gate does not apply.
- **GREEN** `e76308e` `fix(12-07)` (the plan's commit type): `npx jest components/projects` 168/168, lint 0 errors, type-check clean, case-study + demo-clip chromium e2e 47/47.
- **REFACTOR:** none.

## Verification

- `npm run lint`: exit 0 (9 existing warnings in AnimatedGradientMesh.tsx and useProgressiveTextures.ts, unrelated)
- `npm run type-check`: clean
- `npx jest --silent`: 86 suites, 1,409 tests passed
- `PW_PROD=1 npx playwright test e2e/case-study.spec.ts e2e/demo-clip.spec.ts e2e/projects.spec.ts e2e/roadmap.spec.ts e2e/home-ascent.spec.ts --project=chromium`: fresh build, 134 passed, 0 failed, 0 flaky
- Per task: Task 1 e2e 47 passed (PW_REUSE); Task 2 roadmap.spec on the dev server 26 passed; Task 3 home-ascent 49 passed (PW_REUSE)
- `git status --porcelain public/service-worker.js`: empty; port 3000 free

Acceptance criteria: `py-3` in EndBlock 0 (PASS); `[grid-area:1/1]` in DemoTerminal 3 (PASS, at least 1); `Source for` in Metrics 2 (PASS, at least 1); `top-[39px]` in RouteLog 0 (PASS); marker boxes recorded and equal (PASS); in-progress count no longer includes Phase 11 (PASS); `## D-24 Phase 9 dispositions` has three rows (PASS); `12-07` in 09-UI-SPEC 1 (PASS, baseline 0).

## Issues Encountered

None beyond the deviations above.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- box, coin-flip and roadmap carry the round-1 fixes and Tim's dates, ready for the 12-11 re-baseline run.
- Open for Tim: copy.heads-sentence (HEADS figcaption sentence), pending.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*

## Self-Check: PASSED

- FOUND commits: 52319a7, e76308e, 6e287b5, 52fbdb1, 4840ac2 (all ancestors of HEAD)
- FOUND files: every key-files.modified path exists
