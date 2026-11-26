---
phase: 18-immersive-survey-layout
plan: 23
subsystem: photos-overview
tags: [overview, map, container-queries, has-selector, webkit, region-01, region-06, e2e, guard-03]
status: complete

requires:
  - phase: 18-13
    provides: "lib/photos/overview-layout.ts: overviewCss, the S 312-1100 sweep, MARKER/REGION_PLATE/SUMMIT_TRIANGLE/OVERVIEW_GAP/OVERVIEW_INSET, summitKey, summitPlateSize"
  - phase: 18-11
    provides: "sheetMargin('overview') and the SheetMargin figcaption component"
  - phase: 18-22
    provides: "/photos overview header, RegionList (data-region-row, data-region-badge) and the lg grid with the empty left column"
provides:
  - "overviewSheetInput() in lib/regions.ts: regions west to east with number, short name, count and four outline corners; summits with stored heights (P6)"
  - "components/photos/overview/OverviewSheet.tsx (server): the Alps sheet with sheet-index rectangles, summit triangles and labels, numbered pointer-only markers with leaders and plates, and the overview sheet margin"
  - "/photos two-column overview from 1024 px inside a [data-overview] container that anchors the list-map :has() sync"
  - "overviewCss sync with one :has() per state (WebKit), and the marker-hover row bar made visible (opacity 1)"
  - "e2e rows: markers, order, margin, geometry at 375/768/1024/1440, tiers, sync, Tab, no-JS"
affects: [18-24, 18-25, 18-28, 18-29]

actuals:
  tokens: 13400    # chars/4 over git diff c87cff2..80b1e1d (53,692 chars incl. context)
  tasks: 2
  commits: 2       # measured: git rev-list --count c87cff2..80b1e1d; the metadata commit follows
plan_head_before: c87cff2ffecd6ef5c448d9caa611630430b72aec
plan_head_after: 80b1e1d4d8fe667857b01d377fea1b5b91466ed3

tech-stack:
  added: []
  patterns:
    - "An expensive pure server computation over static data (overviewCss's 789-width sweep) is memoized at module scope, once per server process, never per request; a Jest row pins the single call"
    - "A map sheet's edge is an inset outline on an exact-ratio size container ([container-type:size]), so cqw/cqh equal the layout's S and H"
    - "List-map sync with one :has() per state: :has(row:hover), :has(row:focus-visible), :has(marker:hover); never :is()/:where() inside :has()"

key-files:
  created:
    - components/photos/overview/OverviewSheet.tsx
    - components/photos/overview/__tests__/overview-sheet.test.tsx
  modified:
    - lib/regions.ts
    - lib/__tests__/regions.test.ts
    - lib/photos/overview-layout.ts
    - lib/__tests__/overview-layout.test.ts
    - app/(site)/photos/page.tsx
    - e2e/photos.spec.ts
    - e2e/keyboard.spec.ts

key-decisions:
  - "18-23: overviewCss is computed once per server process in OverviewSheet (module-level memo): per request it cost about 0.6 s on every /photos render and timed out parallel e2e navigations"
  - "18-23: the overview list-map sync uses one :has() per state (row hover, row focus-visible, marker hover), the 2325d0a WebKit pattern; the 18-14 deferred item is closed"
  - "18-23: the sheet edge is an inset outline (outline-1 -outline-offset-1 outline-line), not the UI-SPEC's border, so the size container is exactly S x S*872/1200 (18-13 note)"
  - "18-23: markers are next/link Links (tabIndex -1, aria-hidden) for the same soft navigation as the rows (18-22); no new client JS"

patterns-established:
  - "Overview geometry e2e: read every rendered box relative to the sheet, assert the 8 px gap and inset with a 0.1 px tolerance, the declared sizes within 1 px, and that each plate line fits on one line"

requirements-completed: [REGION-01, REGION-06]  # copied from the plan; REQUIREMENTS.md keeps both Pending under the shared-ID gate (requirements.ready-ids: blocked by sibling plans still open)

coverage:
  - id: D1
    description: "overviewSheetInput: every region west to east with a four-corner outline and its number; a missing or partial outline throws (UI E1/partial)"
    requirement: REGION-01
    verification:
      - kind: unit
        ref: "lib/__tests__/regions.test.ts#the overview sheet's input (18-23; REGION-01, UI E1/partial)"
        status: pass
    human_judgment: false
  - id: D2
    description: "OverviewSheet server markup: Map section, sr-only h2, figure with the sheet and the overview margin figcaption, three pointer-only markers 1..3, rectangles, summits, CSS computed once per process"
    requirement: REGION-01
    verification:
      - kind: unit
        ref: "components/photos/overview/__tests__/overview-sheet.test.tsx#OverviewSheet (18-23; REGION-01, REGION-06)"
        status: pass
      - kind: e2e
        ref: "e2e/photos.spec.ts#Overview sheet (REGION-01, REGION-06) › the sheet has one pointer-only marker per region, numbered 1..3 west to east, each linking to its region page"
        status: pass
    human_judgment: false
  - id: D3
    description: "Overview sheet margin: title, Extent, Last surveyed, the G1 GLO-90 credit linking to /sources#copernicus-glo-90, Summits west to east"
    requirement: REGION-06
    verification:
      - kind: e2e
        ref: "e2e/photos.spec.ts#Overview sheet › the sheet margin prints the overview's title, extent, edition, linked GLO-90 credit and summits west to east"
        status: pass
    human_judgment: false
  - id: D4
    description: "Geometry and tiers at 375/768/1024/1440: no overlap or gap under 8 px, every box 8 px inside, declared sizes, plate text fits; plates and summit labels only on the wide tier"
    requirement: REGION-01
    verification:
      - kind: e2e
        ref: "e2e/photos.spec.ts#Overview sheet › at {375,768,1024,1440} x 900 no marker, plate, summit label or triangle overlaps another or comes within 8 px, and every box is 8 px inside the sheet"
        status: pass
      - kind: unit
        ref: "lib/__tests__/overview-layout.test.ts (S 312-1100 sweep, 18-13)"
        status: pass
    human_judgment: false
  - id: D5
    description: "List-map sync (row hover/focus marks marker, rectangle, plate; marker hover marks the row), keyboard path never focuses a marker, no-JS navigation"
    requirement: REGION-01
    verification:
      - kind: e2e
        ref: "e2e/photos.spec.ts#Overview sheet › hovering the Ortler row … / hovering the Ortler marker … / keyboard focus on the Ortler row … / Tab from the top of /photos …"
        status: pass
      - kind: e2e
        ref: "e2e/photos.spec.ts#Overview sheet without JavaScript (REGION-01) › every marker, every region row and the Source link navigate"
        status: pass
    human_judgment: false
  - id: D6
    description: "Visual quality of the overview sheet at 375 and 1440 (contour legibility, plate and label rhythm) before 18-28 re-baselines photos/*"
    requirement: REGION-01
    verification: []
    human_judgment: true
    rationale: "No pixel baseline exists for the new sheet until 18-28; the look was checked by eye from local screenshots only"

duration: 28min
completed: 2026-11-26
---

# Phase 18 Plan 23: Alps overview sheet Summary

**/photos now shows the Alps overview sheet beside the region list. It is server-rendered: the 1,000 m contour mask, one sheet-index rectangle per region, five reference summits with labels, three numbered pointer-only markers (1 Zermatt, 2 Ortler, 3 Saalfelden) with leaders and plates placed by 18-13's overviewCss, and the overview's own sheet margin with the GLO-90 credit linked to /sources. The list-map sync is CSS `:has()`, written as one `:has()` per state for WebKit.**

## Performance

- **Duration:** about 28 min
- **Started:** 2026-11-26T15:00:25Z
- **Completed:** 2026-11-26T15:28Z
- **Tasks:** 2 of 2
- **Files modified:** 9 (2 created, 7 modified)

## Accomplishments

- **`overviewSheetInput()`** (lib/regions.ts, server). It builds the regions in `regionsWestToEast()` order, numbered 1..N exactly like `regionNumber`, each with its short name, a photo count from `countLabel` (equal to `regionCardFacts().count`) and its four outline corners. The summits keep their stored heights, Triglav's printed plainly (P6). A region with no outline, or one without exactly four corners, throws a RangeError naming the region, and so does zero regions. The build therefore fails before an empty or partial sheet can render (UI E1/empty, E1/partial).
- **`OverviewSheet`** (server, zero JS of its own). It renders `section[aria-labelledby=overview-map]` with the sr-only h2 `Map` and a `figure` holding:
  - **The sheet:** `aspect-[1200/872]`, `[container-type:size]`, `overflow-hidden`, `bg-surface`, edge drawn as an inset outline.
  - **Contours:** the overview SVG as the `ContourField` mask over `bg-contour`.
  - **Rectangles:** one aria-hidden SVG (`viewBox 0 0 1 1`, `preserveAspectRatio none`) with a `polygon[data-region-rect]` per outline: 1 px `stroke-ink-muted`, `vector-effect: non-scaling-stroke`, colour transition.
  - **Summits:** aria-hidden 12 px triangles and their label plates.
  - **Markers:** per region a `Link` with `tabIndex={-1}`, `aria-hidden`, `data-region-marker`. Each holds the 1 px leader SVG, the 24 px number circle (`bg-ink text-ink-inverse font-mono font-semibold`, 2 px surface ring, 44 px hit area) and the `w-36 h-12` plate (`ring-1 ring-inset ring-line-strong`, name and mono count).
  - **CSS:** `<style>{overviewCss(…)}</style>`.
  - **Figcaption:** `<SheetMargin margin={sheetMargin('overview')} className="px-4 sm:px-0" />`. Both key links now hold.
- **/photos layout (P7).** The content container is now `[data-overview]`. It holds the sheet section (column 1 from 1024 px, full-bleed below 640 px) and RegionList (column 2 from 1024 px, `mt-12 md:mt-16` above it below lg). The DOM order is the heading order: h2 Map, then h2 Regions.
- **WebKit `:has()` fix (closes the 18-14 deferred item).** `syncRules` emits `:has(row:hover)`, `:has(row:focus-visible)` and `:has(marker:hover)` with identical rules and no `:is()` inside `:has()`. The unit test pins the split and the `/:has\([^)]*:(?:is|where)\(/` guard.
- **Client JS:** 1,827,848 B in 21 files (`rm -rf .next/static && npm run build`, byte sum of `.next/static/chunks/**/*.js`). That is **+0 B** against 18-22 and still 27,993 B under the 1,855,841 cap. OverviewSheet is a server component, and its Links reuse the `next/link` chunk the rows already ship. Recorded in the scratchpad as `| 18-23 1,827,848`.

## ui-ux-pro-max (invoked before the markup)

Searches run, from `.claude/skills/ui-ux-pro-max/scripts/search.py`:
- `"map marker list sync hover" --domain ux`. Applied: hover feedback plus cursor-pointer on the markers. The cross-highlight is only extra feedback: every marker and row is a real link, so nothing depends on hover.
- `"pointer only marker aria hidden duplicate link" --domain ux`. Two results applied. "Overflow Hidden: test all content fits" became the e2e inset and plate-fit rows. "Color Only" is met by the row's accent bar plus fill (shape and fill, not colour alone). The ARIA-labels result does not apply: the markers duplicate named rows and are hidden on purpose, per the UI-SPEC.
- `"touch target size spacing" --domain ux`. Applied: a 44 px hit area on each marker (`before:-inset-2`), with marks and labels kept at least 8 px apart.
- `"container queries responsive" --stack html-tailwind`. Applied: the built-in container queries on a named size container. The tier switch is a container query on the sheet width S, not on the viewport.
- Quick Reference §1–§3 checked: heading order, markers out of the tab order, contrast pairs already in the guard, reduced motion (colour transitions only), CLS (the sheet box has a fixed ratio; design-system's /photos CLS row passes), and no horizontal scroll at 375 (photos-sweep).

## Task Commits

1. **Task 1 (tracer): end-to-end overview sheet** – `f2fc609` (feat)
2. **Task 2: geometry, tiers, sync, keyboard and no-JS rows** – `80b1e1d` (test)

The tracer gate ran in end-of-phase mode with automated verify. After the fix below, Jest (regions, overview-layout, client-graph) passed 129/129 and photos.spec passed 58/58 in Chromium and Firefox. Then Task 2 expanded on it.

## Geometry rows as successors (PHOTO-06 mapping, continued from 18-22)

18-22 retired the Map view's plate geometry rows onto region-list rows. This plan adds the sheet's own geometry rows, the retired map plates' rows on their new subject:

| Retired Map view row (10-08) | 18-22 successor | 18-23 sheet successor (photos.spec › Overview sheet (REGION-01, REGION-06)) |
|---|---|---|
| at {360,375,412,768,1024,1440} x 900 the plates keep their boxes, gaps and dots | each region row's thumbnail keeps its true ratio and the list has no horizontal overflow | at {375,768,1024,1440} x 900 no marker, plate, summit label or triangle overlaps another or comes within 8 px, and every box is 8 px inside the sheet (boxes, gaps, inset, declared sizes, tiers) |
| at {360,375,412,768,1024,1440} x 900 every plate's title and altitude fit inside the plate | no region row's text truncates | the same four rows: every region-plate and summit-label line fits its plate's text box on one line |
| opens on the map with four waypoint links in altitude order | opens on the overview with the three region rows west to east | the sheet has one pointer-only marker per region, numbered 1..3 west to east, each linking to its region page |
| a map plate opens the lightbox | a region row opens its region page | a marker opens its region page |

New rows with no predecessor:
- 'the sheet margin prints …'
- the two hover sync rows
- 'keyboard focus on the Ortler row …' (`@needs-tab-to-links`)
- 'Tab from the top of /photos … never focuses a marker …' (`@needs-tab-to-links`)
- 'Overview sheet without JavaScript › every marker, every region row and the Source link navigate'

**GUARD-03:** jest 2809 → 2819 (+10), e2e 843 → 855 (+12). `npm run guard:tests`: `jest 2819 + e2e 855 = 3674 (baseline 3024)`, OK. Nothing was deleted or skipped.

## Verification

- `npx jest lib/__tests__/regions.test.ts lib/__tests__/overview-layout.test.ts lib/__tests__/client-graph.test.ts`: 129 passed. `components/photos/overview`: 13 passed. Full Jest: **2,819 of 2,819** in 133 suites.
- Production e2e, Chromium and Firefox:
  - Task 2 verify set (photos, photos-sweep, keyboard, audit, design-system): **218 passed, 0 failed, 0 flaky**.
  - The other /photos-touching specs (photos-region, photos-lightbox, photos-stepping, no-webgl, seo, shell, not-found): **658 passed**.
- Local Windows WebKit (webkit-2388), photos.spec 'Overview sheet': 10 of 10 passed, including both hover-then-leave rows. The two `@needs-tab-to-links` rows are filtered there.
- `npm run type-check` and `npm run lint` (including guard:tests:scan) pass. `node scripts/ci/check-snapshot-commit.mjs --none`: OK (0 changed) after both commits. No PNG staged.
- Acceptance: `grep -c overviewCss components/photos/overview/OverviewSheet.tsx` = 5; `grep -c "tabIndex={-1}"` = 1.

## How the WebKit sync was handled and verified

- **Fix.** I applied the 2325d0a pattern in `syncRules`: each of the three active states has its own `:has()`. The Jest row checks each rule's exact selector list and declarations, and forbids `:is()` and `:where()` inside `:has()`.
- **Browser evidence.**
  - The hover-row and hover-marker e2e rows pass in Chromium, Firefox and local Windows WebKit. Each asserts the lit state and then the rest state after the pointer leaves, which is the 18-14 failure mode.
  - Caveat: a scratch WebKit probe did **not** reproduce the old bug on the overview. I rewrote the live stylesheet to the `:is()` form, both with and without the plain marker `:has(...:hover)` rules, and the marks still restyled on hover and on leave.
  - So on this page the e2e rows guard the behaviour, while the unit regex is what pins the form. CI Linux WebKit is the authority and has not run yet, because this plan pushes nothing.
  - I did not return to the orchestrator for CI. The pattern is the one CI already proved on the region plate (2325d0a), and the local evidence has no failure to explain. It is recorded as a CI watch item.

## Decisions Made

- **CSS memoized once per server process** (see Deviation 1).
- **Inset outline instead of the UI-SPEC's `border border-line`.** The look is the same 1 px line-token edge, and the container stays at the exact ratio (18-13's note; PlateSheet does the same). Jest asserts there is no border class.
- **Markers are `next/link` Links**, matching 18-22's rows: a soft navigation with no morph. The markup is identical server HTML (`<a href tabindex=-1 aria-hidden>`), with no new client JS.
- **Below lg the list sits `mt-12 md:mt-16` under the margin**, the UI-SPEC's section-break steps. The UI-SPEC gives no explicit value for this gap.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] overviewCss ran its 789-width sweep on every /photos request**
- **Found during:** Task 1 verify. With default workers, 5 to 10 photos.spec rows failed: soft navigations stayed on /photos, and some `page.goto` calls timed out. Every one of them passed alone.
- **Root cause:** /photos renders per request (the CSP nonce). `overviewCss` calls `overviewSegments`, which solves the layout for every integer S from 312 to 1100, about 0.6 s of CPU per render (`curl`: 0.60 to 0.71 s for /photos against 0.01 s for a region page). Under parallel e2e load, the single `next start` process saturated.
- **Fix:** a module-level memo in OverviewSheet (`overviewSheetCss`). The input is static generated data, so the result is the same for the life of the process. After the fix, the first request takes 0.44 s and later ones 0.008 s, and photos.spec passed 58/58.
- **Test:** `overview-sheet.test.tsx` renders the sheet six times and asserts `overviewCss` was called exactly once, with output byte-identical to a direct call.
- **Commit:** f2fc609

**2. [Rule 1 - Bug] Marker hover coloured an invisible row bar**
- **Found during:** Task 2, writing the marker-hover row.
- **Issue:** the sync's `::before` rule set the bar's position and accent colour, but RegionList draws the bar at rest with `before:opacity-0`. Hovering a marker therefore never showed the row's 2 px accent bar (UI-SPEC "Sync": "the same pair of states, mirrored").
- **Fix:** the rule now ends `;opacity:1`. The unit test pins it, and the e2e row asserts the bar's opacity `1` and accent colour, then `0` after leaving.
- **Files:** lib/photos/overview-layout.ts, lib/__tests__/overview-layout.test.ts
- **Commit:** 80b1e1d

**3. [Rule 3 - Blocking] keyboard.spec overview walk missed the margin's Source link**
- **Found during:** Task 2 verify ('Tab 8 should reach the region row Zermatt' in Chromium and Firefox).
- **Issue:** the overview margin's 'Copernicus DEM GLO-90' link (Contract 7, Tim's G1) is a real tab stop between the chrome and the rows. The 18-22 walk predates it.
- **Fix:** I added it as a stop (`marginSource`) and kept every other stop. The walk still proves no marker takes focus, because any extra stop fails it.
- **Files:** e2e/keyboard.spec.ts (outside files_modified; it is in Task 2's verify list). Only the planned lines were edited, because the file is not Prettier-formatted at HEAD (18-22 note).
- **Commit:** 80b1e1d

**4. [Scope] Files outside files_modified**
- These were edited for the orchestrator-directed `:has()` fix and Deviation 2: `lib/photos/overview-layout.ts` and `lib/__tests__/overview-layout.test.ts`.
- `components/photos/overview/__tests__/overview-sheet.test.tsx` is new. It holds the server-markup rows and the memo guard.

---

**Total deviations:** 3 auto-fixed (2 Rule 1, 1 Rule 3), plus the scope note.
**Impact on plan:** All three were needed for correctness, and there is no scope creep. Deviation 1 also removes a ~0.6 s server cost from every /photos request in production.

## Tags and flakes

- New `@needs-tab-to-links` rows (Windows and macOS WebKit never Tab to links; Linux WebKit in CI runs them):
  - 'keyboard focus on the Ortler row marks its marker and rectangle, and moving on clears them'
  - 'Tab from the top of /photos reaches the region rows and never focuses a marker or anything in the sheet'
- No `@no-win-webkit` added. None of the known local flakes (Firefox /offline axe, WinCairo crashes) came up. No assertion was weakened.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register:
- **T-18-47:** OverviewSheet is a server component, and the client-graph test passes with data/generated/overview.ts unreachable from client modules.
- **T-18-48:** region ids and summit keys still pass overviewCss's slug guard and cssEscape. The CSS-content row in overview-layout.test passes.

## Baselines for 18-28

- **photos/***: /photos changes again. The overview sheet and its margin now sit left of the list from 1024 px, and above it, full-bleed, below 640 px. Re-baseline once after 18-23, which covers 18-22's change too.
- **Contour mask:** the faint contours come from a CSS mask image, so the shot should wait for it, as noted in the forward notes. The markers and labels are server HTML.
- **No other baseline family changes:** the overview CSS is scoped to the sheet, and the RegionList markup is unchanged.
- **photos-grid/* and photos-carousel/*:** still entries for removal (18-22).

## Next Phase Readiness

- REGION-01's overview half is done: map, pins, list and sync. REGION-01 and REGION-06 stay Pending in REQUIREMENTS.md under the shared-ID gate until the sibling plans that declare them finish.
- 18-24/18-25 can delete MapSheet and label-layout's mapMarkCss. The overview uses neither.

## Self-Check: PASSED

- FOUND: components/photos/overview/OverviewSheet.tsx, components/photos/overview/__tests__/overview-sheet.test.tsx, lib/regions.ts, e2e/photos.spec.ts
- FOUND: f2fc609, 80b1e1d (ancestors of HEAD)
- Deferred item (18-14, overview :has()) marked Resolved in deferred-items.md

## Post-plan fix (Tim-approved, 2026-11-26)

Tim chose "Fix before 18-28 (Recommended)" while 18-27 ran. The fix ran after 18-27 and before 18-28. It is a fix, not a plan: the plan counter and ROADMAP progress are unchanged.

**What Tim saw:** at 1440 (S = 736), Zermatt's plate sat diagonally above-right of marker 1 and read as Ortler's label. At 375, marker 1 crowded the Dufourspitze triangle. The cause was 18-13's solver. It placed all markers first and the plates afterwards, so where right or left of a marker was illegal, the plate fell back to a diagonal. On c33c022 Ortler's plate was SE at S 589-889 and Saalfelden's was NE at 589-766. At S = 682, Zermatt's plate was 8.07 px from Ortler's marker and 11.31 px from its own.

**The rule now** (`lib/photos/overview-layout.ts`):
- **Joint choice:** on the wide tier a region is one search item. Its marker and plate are chosen together: plate right of the marker, then left, vertically centred, 8 px away. Markers (direction, leader step) and summit labels give way. Triangles never move, and no plate is shrunk.
- **Association invariant:** every other marker is at least `OVERVIEW_ASSOCIATION` = 16 px farther from a plate than its own marker (Euclidean box distance). This is a solver rule and a sweep row.
- **Complete search:** conflict-directed backjumping in priority order (regions west to east, then summit labels west to east). It finds the first legal layout, so a summit label goes unplaced only if no layout can place it. The 18-13 greedy pass (one-level backtracking, pending labels) remains as the fallback when no layout exists or the 200,000-check budget runs out. That never happens with the real data.
- **Fallback plates:** where no layout has every plate beside its marker, the search allows one fallback plate, then two (corner places, then centred above or below). The fewest plates leave their marker's side.
- **Compact tier:** a marker prefers a place whose 28 px badge keeps `COMPACT_SUMMIT_CLEARANCE` = 16 px from every summit triangle as drawn. This holds at every S from 312 to 559, so nothing is pinned. Marker 1 is N24 at 375 (it was N16), and Saalfelden's marker moved to NE8 at S 312-385.

**Sweep results (S 312-1100):** E or W everywhere except these widths, pinned in `DIAGONAL_REGION_PLATES`:
- **zermatt [560, 719]:** right of marker 1, the 144 px plate reaches Ortler's rectangle until S = 720. Left of it leaves the sheet. Lifting the plate above Ortler's rectangle needs a leader over 40 px. Every place below marker 1's rectangle takes the only free place of Mont Blanc's label (its E side is Zermatt's rectangle, W leaves the sheet until S = 740, and N/NE meet Dufourspitze's triangle). The exhaustive search proves that no layout with all five summit labels placed exists there. Without the association rule it still fails, so the side rule alone causes it.
- **ortler [560, 587]:** Ortler's plate has no side either.

Every fallback plate keeps the association invariant and sits on its marker's 8 px ring. `UNPLACED_SUMMIT_LABELS` stays empty. Every 18-13 row still passes: 8 px gaps, 8 px inset, rectangle outlines, leader versus triangle shape, leaders crossing no box.

**Viewports:** 375 → S 365 (compact), 768 → S 710 (Zermatt fallback), 1024 → S 598 (Zermatt fallback), 1440 → S 736 (all three beside their markers: Zermatt E, Ortler W, Saalfelden E).

**Alternative measured (not applied, a decision for Tim):** an extra leader step of 56 px (or 56 and 72) makes E/W feasible from S = 611. That covers the 768 viewport but not 1024 (S 598), and 560-610 still need the fallback.

**Segments:** 18 → 29. Each region item now changes with its marker and plate together, and the compact clearance moved some markers. No Jest or e2e row pins the count (only "more than one").

**Cost:** one sweep takes about 1.7 s locally (1.2 s on c33c022). Most of it is the side-only pass proving infeasibility at 588-719. `overviewCss` stays memoized once per server process (18-23). The OverviewSheet comment now gives the new figure.

**Tests:**
- **Jest:** 2798 → 2802. Four rows: plates E/W outside the pins, the exact `DIAGONAL_REGION_PLATES` pin, the association invariant, compact badge clearance. Plus constant pins and a `placed` check on every region.
- **e2e:** 855 → 857 (photos.spec "at 1024 / 1440 x 900 each region plate sits beside its own marker, nearer to it than to any other marker").
- **GUARD-03:** 2802 + 857 = 3659 against the 3024 floor.
- **Gates:** full Jest 129 suites green. `npm run lint` and `npm run type-check` exit 0. Prettier is clean on the touched files.
- **e2e runs:** prod build, 28/28 Overview sheet rows on Chromium and Firefox, 12/12 on local WebKit (the two `@needs-tab-to-links` rows skip as usual).
- **Snapshot guard:** `check-snapshot-commit --none` passes on every commit (0 PNGs).
- **Speed:** the compact-clearance row measures exact point-to-edge distance, which keeps the suite at about 18 s.

**Client JS:** 1,827,607 B, unchanged (21 files; the module is server-only).

**Screenshots (prod build, contour mask decoded):** scratchpad `ov-fix-375.png`, `ov-fix-768.png`, `ov-fix-1024.png`, `ov-fix-1440.png`.

**UI/UX searches (ui-ux-pro-max):**
- `"label proximity grouping" --domain ux` and the narrower retry `"whitespace group related items" --domain ux` returned no verified match.
- `"direct labeling map" --domain chart` returned "Geographic Data: label regions directly".
- `"touch spacing small screen" --domain ux` returned "Minimum 8px gap between touch targets".
- The guidance applied is the Quick Reference `whitespace-balance` (group related items by spacing) plus the UI-SPEC's own rule.

**Commits:**
- `da5bb29`: test(18-23), RED. Three rows failed on c33c022.
- `3ad297b`: fix(18-23).
- The docs commit follows.

**Baselines (18-28):** photos/* only. /photos now shows the fixed placement at every width, and no other page changed.
