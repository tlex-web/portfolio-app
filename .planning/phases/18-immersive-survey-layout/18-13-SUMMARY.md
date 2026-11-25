---
phase: 18-immersive-survey-layout
plan: 13
subsystem: ui
tags: [overview, label-layout, container-queries, has-selector, sweep, regions]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: data/generated/overview.ts (grid 1200 x 872, outlines, summits with uv and officialM)
  - phase: 18-immersive-survey-layout
    provides: "18-01 P6/P7 defaults; 18-02 regionsWestToEast (D-01 order)"
provides:
  - "lib/photos/overview-layout.ts (pure; imports only css-escape): MARKER, REGION_PLATE, SUMMIT_TRIANGLE, OVERVIEW_GAP, OVERVIEW_INSET, OVERVIEW_COMPACT_MAX_S, OVERVIEW_SWEEP_MIN_S/MAX_S, OVERVIEW_RATIO, LEADER_STEPS, UNPLACED_SUMMIT_LABELS (empty)"
  - "boxesMeet, summitPlateSize, summitKey, overviewLayout(input, S), overviewSegments(input), overviewCss(input, containerName)"
  - "types OverviewInput, OverviewRegionMark, OverviewSummitMark, OverviewPlacement, OverviewSegment, OverviewLength"
  - "lib/__tests__/overview-layout.test.ts: the S 312-1100 sweep on the real data, the count guards and the CSS cascade rows"
affects: [18-23]

actuals:
  tokens: 16000    # chars/4 over the two files this plan created (64,054 chars); this SUMMARY adds about 3,000
  tasks: 1         # Task 1 done; Tasks 2-3 not needed (every label placed)
  commits: 2       # measured: git rev-list --count 9928d49..760fd3a (the metadata commit adds one more)
plan_head_before: 9928d49e1eea3a575401d8d03daf129712a74538
plan_head_after: 760fd3a66d9664a12a83372c8ffb09c7b3ee3013

tech-stack:
  added: []
  patterns:
    - "Layout computed symbolically: every coordinate is f x S + px (x) or f x H + px (y), so segments are exact, not fitted"
    - "Candidate search with a fixed priority and one-level backtracking over any earlier item, nearest first"
    - "Leaders checked against the drawn summit triangle; labels checked against the drawn outline polygon (SAT)"

key-files:
  created:
    - lib/photos/overview-layout.ts
    - lib/__tests__/overview-layout.test.ts
  modified: []

key-decisions:
  - "18-13: every summit label is placed at every S 312-1100, so UNPLACED_SUMMIT_LABELS is empty and Task 2 (Tim's fallback decision) and Task 3 were not needed"
  - "18-13: y positions use 100cqh, so the overview sheet must be a size container ([container-type:size], as 18-23 plans); the CSS hooks are data-region-marker/-dot/-leader/-plate/-rect/-row/-badge, data-summit-mark/-plate (summitKey) and a data-overview ancestor for the :has() sync"
  - "18-13: added rule beyond the plan: no marker, region plate or summit label may cover a sheet-index rectangle's drawn outline"

patterns-established:
  - "overviewCss emits the summit plate's width and height from summitPlateSize, so the rendered box equals the declared constant by construction"

requirements-completed: []  # REGION-01 stays Pending: this is the layout half; 18-23 renders the overview

duration: 12min
completed: 2026-11-25
---

# Phase 18 Plan 13: Overview label layout Summary

**A pure candidate-search layout places the three numbered markers, their 144 x 48 plates and all five summit labels at every sheet width from 312 to 1100 px with no overlap. It emits 18 exact container-query segments plus the list-map `:has()` sync, and no summit label needed Tim's fallback.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-11-24T23:57:01Z
- **Completed:** 2026-11-25T00:08Z
- **Tasks:** 1 of 3 run (Tasks 2 and 3 were conditional and not needed)
- **Files modified:** 2 (both new)

## Accomplishments

- `overviewLayout(input, S)` places, for each region, a 28 px marker in 8 directions around its rectangle at a leader of 8, 16, 24 or 40 px (N8 first). On the wide tier it adds a 144 x 48 plate around the marker and a label around each summit triangle (right, left, below, above, then the diagonals), each 8 px away.
- **All-placed sweep result (Task 2's precondition):** at every integer S from 312 to 1100 every summit label has a legal place. `UNPLACED_SUMMIT_LABELS` is `[]`, and the equality row confirms the sweep finds no unplaced label. This includes Grossglockner at 589-660, where research's greedy model had failed.
- The sweep rows all pass with the real data:
  - no two boxes (markers, plates, summit labels, triangles) closer than 8 px;
  - every box at least 8 px inside the sheet;
  - no leader crosses a box;
  - no label covers a rectangle;
  - markers numbered 1 Zermatt, 2 Ortler, 3 Saalfelden;
  - the compact tier (S up to 559) has markers only.
- **Segment count: 18** (4 compact, 14 wide). The CSS is 10.7 kB in 110 lines. The tests check that the cascade reproduces the layout within 0.5 px at every S.
- Guards: the sweep was measured for 3 regions and 5 summits, and a different count fails with a message naming the S 312-1100 sweep. Input is checked for:
  - ids matching the slug pattern;
  - numbers 1..N in input order;
  - regions in west-to-east order;
  - plate names of 10 characters or fewer and counts of 15 or fewer.

## Task Commits

1. **Task 1 RED:** `ff63800` test(18-13): add the failing S 312-1100 overview layout sweep
2. **Task 1 GREEN:** `760fd3a` feat(18-13): place the overview markers, plates and summit labels by candidate search
3. **Task 2:** not needed (every label placed). The all-placed sweep result is above. Tim was not asked, and no decision is recorded.
4. **Task 3:** skipped (its precondition is Task 2 recording a decision)

## TDD Gate Compliance

- RED `ff63800` comes before GREEN `760fd3a`. The RED commit also carried a skeleton `overview-layout.ts` with the constants and types only, and functions returning empty values. That makes the failures assertion failures instead of an import error.
- RED evidence: `RED_EVIDENCE_OK` (`target_test_failed`) from `gsd-tools check tdd-red-evidence`. The record is at `.gsd/tdd-evidence/18-13/red-t1.json` (ignored). The project has no JUnit reporter and no dependency may be added, so a small scratchpad Jest reporter wrote JUnit XML from Jest's own results.
- Semantic assessment: 13 of 29 failed, all on planned assertions: no segments, no layout, a wrong summit plate size, missing guards, missing CSS and sync selectors. 16 passed: the constants rows, the count guards, and rows that loop over the skeleton's empty layout and so pass vacuously. The target "covers the sweep with open ends and contiguous integer ranges" failed on `toBeGreaterThan(1)` with 0 segments.
- The tracer gate (end-of-phase, automated verify) re-ran after GREEN. Jest overview-layout passed 29/29, type-check passed, and the full Jest suite passed 2,432/2,432 in 121 suites.

## Decisions Made

- **Backtracking is one level, but over any earlier item, nearest first.** The plan says to retry the previous item's next candidate. Retrying only the immediately previous item can never free a summit label that is blocked by a region plate placed five items earlier. Here, when an item has no legal candidate, one earlier item moves to another legal candidate. The search accepts this only if every placed item stays legal and the blocked item then fits.
- **Symbolic linear layout.** Positions are built as `{ f, px }` per axis, so segments are exact and `overviewSegments` reproduces `overviewLayout` to 1e-6. There is no endpoint fitting as in label-layout.
- **CSS contract for 18-23:**
  - Positioned in the sheet: `[data-region-marker=id]` (the 28 x 28 link box), `[data-summit-mark=key]` and `[data-summit-plate=key]`. The summit plate's `width` and `height` are emitted too.
  - Positioned relative to the marker: its `[data-region-leader]` and `[data-region-plate]`. The leader box runs from the marker centre to the rectangle edge, top-left to bottom-right unless `scale(-1, 1)`. An orthogonal leader has width or height 0, so draw it as a 1 px line.
  - The compact tier hides plates with `@container <name> not (min-width: 560px)`.
  - The sync rules use the `[data-overview]` ancestor, `[data-region-row]`, `[data-region-badge]`, `[data-region-dot]` and `[data-region-rect]`. They set the accent dot, the accent rectangle stroke, the plate ring through `--tw-ring-color`, and the row fill, its `::before` 2 px accent bar and an accent badge.
- `summitKey(name)` slugs the summit names (`mont-blanc`) for selectors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Labels may not cover a sheet-index rectangle**
- **Found during:** Task 1
- **Issue:** the plan's box rules do not include the rectangles, so a plate or summit label could hide the very outline a marker points at.
- **Fix:** added a rule and a sweep row: no marker, region plate or summit label overlaps a rectangle's drawn outline. The check uses a separating-axis test against the four rotated corners, not the bounding box. Against the bounding box, Grossglockner's label clipped the Saalfelden box corner by 0.025 px at S 749-761, a spot where the drawn outline is clear.
- **Files modified:** lib/photos/overview-layout.ts, lib/__tests__/overview-layout.test.ts
- **Commit:** 760fd3a

**2. [Rule 1 - Bug] Leaders checked against the drawn summit triangle, not its box**
- **Found during:** Task 1
- **Issue:** at S 312-323, Dufourspitze's 12 px triangle box overlaps the Zermatt rectangle (data-fixed), so every leader end point on that rectangle lies inside the triangle's box. A box-based leader rule therefore made the Zermatt marker unplaceable, even though the leader never touches the drawn triangle (apex top-centre, base at the bottom, as PinMark draws it).
- **Fix:** the leader rule tests the triangle shape (Cyrus-Beck clip in the module; an independent sampled polygon test in the sweep). The 8 px gap rule still treats triangles as 12 px boxes.
- **Files modified:** lib/photos/overview-layout.ts, lib/__tests__/overview-layout.test.ts
- **Commit:** 760fd3a

---

**Total deviations:** 2 auto-fixed (1 Rule 2, 1 Rule 1), plus the backtracking reading under Decisions Made.
**Impact on plan:** one rule is stricter (rectangles) and one is more exact (leader vs triangle shape). All of the plan's rules hold at every S.

## Issues Encountered

- **Note for 18-23 (regression risk at e2e widths):** the layout assumes the container's content box is exactly S x S·872/1200. A 1 px `border` on an `aspect-[1200/872]` border-box makes the content height about 0.55 px less than that. cqh positions follow the real height, so a vertical gap the sweep measured at exactly 8 px can render about 0.3 px short. 18-23's in-browser 8 px assertion could then fail at some width. Two fixes: draw the sheet edge with `ring-1` or `outline` so it takes no layout space, or keep the content box at the exact ratio.

## Known Stubs

None.

## Threat Flags

None. T-18-30 is mitigated as planned: ids, summit keys and the container name must match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, anything else throws a RangeError, and every selector value goes through cssEscape. A Jest row checks that the CSS contains only numbers, the ids, the keys and fixed selectors.

## Next Phase Readiness

- 18-23 can render `<style>{overviewCss(overviewSheetInput(), name)}</style>` with the hooks above. It has no recorded exception to honour, because `UNPLACED_SUMMIT_LABELS` is empty.

## Self-Check: PASSED

- FOUND: lib/photos/overview-layout.ts
- FOUND: lib/__tests__/overview-layout.test.ts
- FOUND: ff63800 (ancestor of HEAD)
- FOUND: 760fd3a (ancestor of HEAD)
