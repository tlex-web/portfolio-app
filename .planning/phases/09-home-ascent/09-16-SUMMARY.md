---
phase: 09-home-ascent
plan: 16
subsystem: ui
tags: [typography, line-breaking, whitespace-nowrap, tailwind, playwright, getClientRects]

requires:
  - phase: 09-home-ascent
    provides: "WaypointCard docked/full layouts (09-05, 09-14) and the waypoint data (buildWaypoints, waypointKicker)"
provides:
  - "waypointKickerParts(w): the kicker as ['{altitude} ·', 'Waypoint k of n']; waypointKicker(w) is the parts joined by one space"
  - "Waypoint.captureMonth; placeDate built from it (same strings as 2e77999)"
  - "WaypointCard kicker as two nowrap spans; place line as place text + nowrap tail (data-place-sep hidden docked, data-place-date block docked, both inline from md and in reduced motion)"
  - "e2e 'Card line breaks (G-09-3 b, G-09-4 N2)': structural client-rect checks for every waypoint, 375 x 667 phone (Chromium) + 5 desktop rows (Chromium and Firefox)"
  - "UI-SPEC content rows 1 and 4 and E6 long-text state the break points"
affects: [09-home-ascent verification, HOME-05, UAT tests 3 and 4, visual baselines at 375 px]

actuals:
  tokens: 6760
  tasks: 2
  commits: 2
plan_head_before: 12e01df4afc27c1d30e3900897b108df01c73976
plan_head_after: d4ed0b353d88e534bd91b7bc2ffa1b706dafdd99

tech-stack:
  added: []
  patterns:
    - "Explicit break points instead of width tuning: nowrap segments for text that must not split, and a nowrap tail glued (no whitespace in JSX) to the preceding word"
    - "Line-break e2e: count distinct line tops of non-empty client rects; a block's text lines via a Range over its text node"

key-files:
  created: []
  modified:
    - lib/ascent/waypoints.ts
    - components/home/WaypointCard.tsx
    - components/home/__tests__/waypoints.test.tsx
    - lib/__tests__/ascent-waypoints.test.ts
    - e2e/home-ascent.spec.ts
    - .planning/phases/09-home-ascent/09-UI-SPEC.md

key-decisions:
  - "The kicker separator '·' belongs to the altitude part ('1,668 m ·'), so a kicker wrap leaves the dot at the end of line 1, never at the start of line 2"
  - "The place tail follows the place text with no whitespace: the only soft-wrap opportunity before the tail would be inside the nowrap span, so ' · date' can never start a line"
  - "Docked panel drops the separator (display none) and puts the date on its own line; textContent still equals placeDate, so screen readers and the existing e2e read the same string"
  - "Overflow is asserted against each part's paragraph content edge (stricter than the section edge the plan named)"

patterns-established:
  - "cardBreaks(page, k) + expectDocked/expectFull: reusable structural line-break assertions for card text"

requirements-completed: [HOME-05]

coverage:
  - id: D1
    description: "Docked card at 375 x 667 on a phone (mobile emulation): each kicker part on one line, date on one line, no '·' in the place line, nothing past the column, for all four waypoints"
    requirement: HOME-05
    verification:
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#docked kicker and place line break cleanly at 375 x 667 on a phone @chromium-only"
        status: pass
    human_judgment: false
  - id: D2
    description: "Docked rows 375 x 900, 360 x 780, 412 x 915 and full-card rows 768 x 900 and 375 x 900 reduced motion, in Chromium and Firefox"
    requirement: HOME-05
    verification:
      - kind: e2e
        ref: "npx playwright test e2e/home-ascent.spec.ts --project=chromium --project=firefox -g \"line break\" (11 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "waypointKickerParts, captureMonth and placeDate strings; kicker and placeDate unchanged; card classes for the parts, tail, separator and date"
    requirement: HOME-05
    verification:
      - kind: unit
        ref: "lib/__tests__/ascent-waypoints.test.ts#splits the kicker into its two unbreakable parts (G-09-3 b, D-20)"
        status: pass
      - kind: unit
        ref: "components/home/__tests__/waypoints.test.tsx#WaypointCard break points (G-09-3 b, G-09-4 N2; D-10, D-20)"
        status: pass
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#cards read in ascending altitude with their data"
        status: pass
    human_judgment: false
  - id: D4
    description: "The new breaks look right on a real phone (Safari/iOS and Android Chrome), e.g. '1,668 m ·' / 'Waypoint 2 of 4' and the date on its own line"
    requirement: HOME-05
    verification: []
    human_judgment: true
    rationale: "Automated rows run Chromium mobile emulation and desktop Firefox; real-device rendering (UAT tests 3 and 4) is a visual judgement the debug note lists as a blind spot"

duration: 7min
completed: 2026-10-25
status: complete
---

# Phase 09 Plan 16: Card kicker and place-line break points (G-09-3 b, G-09-4 N2) Summary

**The waypoint card kicker now renders as two nowrap parts ('1,668 m ·' / 'Waypoint 2 of 4') and the place line as the place text glued to a nowrap ' · date' tail (separator hidden, date on its own line in the docked panel), so no phone width can orphan '4' or start a line with '·'; strings and textContent are unchanged.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-10-25T16:22:31Z
- **Completed:** 2026-10-25T16:29:43Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Root cause from the debug note fixed at the source. The kicker and place line were plain-space strings in a 184-199 px column, and the greedy line breaker broke at whichever space sat at the edge. That position moved with the gutter and the glyph advance. They now have explicit break points, so column width no longer decides where they break.
- `waypointKickerParts(w)` and `Waypoint.captureMonth` are in the data layer. `waypointKicker` and `placeDate` return the same strings, so the existing e2e 'cards read in ascending altitude with their data' passes unchanged.
- Line breaks now have structural e2e checks for every waypoint. Before this, only the visual baselines caught the defect, and only as pixels.
- The UI-SPEC rows state the rule.

## Measured result (dev server, Chromium)

| Layout | Kicker | Place line |
|---|---|---|
| Docked 375 x 667 phone | `1,617 m ·` / `Waypoint 1 of 4` (all four, column 199 px) | `Zermatt, Switzerland` / `Sep 2021`; `Riffelsee, Zermatt` / `2019` |
| Full 768 x 900 | one line | `… · Sep 2021` inline after the last word |
| Full 375 x 900 reduced motion | one line | `Gornerschlucht,` / `Zermatt · Sep 2021` (tail 59 px from the left, glued to 'Zermatt') |

RED before the markup change: the tracer row failed with `card has no [data-kicker-part="altitude"]`. It passed after.

## Task Commits

1. **Task 1: Break points end-to-end (tracer)**: `d307211` (fix)
2. **Task 2: Unit tests, other widths and layouts, UI-SPEC rows**: `d4ed0b3` (test)

**Plan metadata:** the docs commit that follows this SUMMARY

## Files Created/Modified

- `lib/ascent/waypoints.ts`: `captureMonth` field, `waypointKickerParts`, `waypointKicker` as the parts joined by one space
- `components/home/WaypointCard.tsx`: kicker spans (`data-kicker-part`), place tail (`data-place-tail`, `data-place-sep`, `data-place-date`), JSDoc on the break rule
- `components/home/__tests__/waypoints.test.tsx`: DOM-order test uses a whole-textContent paragraph matcher; new break-point class tests
- `lib/__tests__/ascent-waypoints.test.ts`: kicker parts, parts-join, placeDate from captureMonth, single-photo case
- `e2e/home-ascent.spec.ts`: `cardBreaks`, `expectDocked`, `expectFull`, the tracer row and the 5-row `BREAK_ROWS` table
- `.planning/phases/09-home-ascent/09-UI-SPEC.md`: content rows 1 and 4, E6 long-text

## Decisions Made

- The '·' belongs to the altitude part. A wrapped kicker reads `1,668 m ·` / `Waypoint 2 of 4`, which matches the plan's success criterion.
- The place tail follows the place text with no whitespace. Any soft-wrap opportunity before the separator sits inside the nowrap span, so in the full card ' · date' stays glued to the last word.
- The helper counts lines as distinct tops of non-empty client rects. Chromium returns one rect per inline child on the same line, plus zero-width fragments around the docked block date, so a raw rect count would be wrong. The date's lines are counted from a Range over its text node, because a block element returns one box however many lines it has.
- The ui-ux-pro-max skill was loaded. Its 'Compact Label Overflow' guidance (keep short labels whole with nowrap, wrap the collection rather than the label) matches the approach.

## Deviations from Plan

**1. [Rule 1 - Bug] Font load string built from longhands**
- **Found during:** Task 1 (first green run)
- **Issue:** `document.fonts.load(getComputedStyle(el).font)` threw `Could not resolve '' as a font`. Chromium returns an empty computed `font` shorthand here.
- **Fix:** The helper builds the string from `fontStyle fontWeight fontSize fontFamily`.
- **Files modified:** e2e/home-ascent.spec.ts
- **Committed in:** d307211

**2. [Scope note] Overflow measured against the paragraph content edge**
- The plan names the section's right edge. The helper uses each part's paragraph right edge minus its padding, which is stricter: a part that overflowed into the card padding would fail.

---

**Total deviations:** 1 auto-fixed (Rule 1) and 1 stricter assertion
**Impact on plan:** None on behaviour. Tests are at least as strict as planned.

## Issues Encountered

- `prettier --write` on `lib/ascent/waypoints.ts` reformatted unrelated lines. That drift already exists at HEAD in waypoints.ts, WaypointCard.tsx and both unit test files, as 09-15 noted. Those lines were restored by hand. Only this plan's lines were formatted (the e2e spec is fully Prettier-clean), and the new unit-test lines follow the files' existing wide-line style. `npm run lint` exits 0.
- The dev server started for the e2e runs was stopped afterwards.

## Verification

- `npx playwright test e2e/home-ascent.spec.ts --project=chromium --project=firefox`: 49 passed
- `-g "line break"`: 11 passed (6 Chromium, 5 Firefox)
- `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests`: OK, jest 653 + e2e 194 = 847 (baseline 832)
- `npm run lint && npm run type-check`: both exit 0
- Acceptance greps: `data-kicker-part` 2, `data-place-tail` 1, `export function waypointKickerParts` 1, `G-09-3 b / G-09-4 N2` in UI-SPEC 3, `waypointKickerParts` in the unit test 5

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- G-09-3 (b) and G-09-4 N2 are closed in code and tests. The 375 px visual baselines (e.g. `375-ascent-waypoint-2-visual-dark-linux.png`) will change, because the kicker and place line now wrap differently. They need a re-baseline via the gh workflow, and Tim commits the PNGs.
- UAT tests 3 and 4 can be re-run on a real phone.
- G-09-3 (a), the 768 px pin label under the card, is not in this plan.
- Ready for 09-17.

---
*Phase: 09-home-ascent*
*Completed: 2026-10-25*

## Self-Check: PASSED

- Files exist: all six modified files
- Commits on this branch: d307211, d4ed0b3 (`git rev-list --count 12e01df..HEAD` = 2 before this docs commit)
- Acceptance criteria re-run: all pass
