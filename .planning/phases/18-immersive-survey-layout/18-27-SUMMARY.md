---
phase: 18-immersive-survey-layout
plan: 27
subsystem: photos-retirement
tags: [photo-06, d-27, light-table, map-sheet, pitfall-8, guard-03, tdd, tracer]
status: complete

requires:
  - phase: 18-26
    provides: "photoBySlug over publishedViews; every Jest test outside map.test and photos-label-layout.test names its photos"
  - phase: 18-09
    provides: "PlateSheet + plate-layout sweep (successors P1-P7)"
  - phase: 18-10
    provides: "PlateKey + the :has() list-plate sync (successor P8)"
  - phase: 18-13
    provides: "overview-layout sweep (successors O1-O7)"
provides:
  - "components/photos/__tests__/plate-sheet.test.tsx: one row per retired map.test row, run for every registry region (33 rows)"
  - "lib/photos/label-layout.ts reduced to stack1D (hotspot-layout's only import)"
  - "buildPhotoViews(input) with a required input; no light-table export or data file remains (D-27)"
affects: [18-28, 18-29]

actuals:
  tokens: 19995    # chars/4 over git diff 2a1c001..d0bf727 (79,981 chars incl. context; mostly deletions)
  tasks: 2
  commits: 3       # measured: git rev-list --count 2a1c001..HEAD before the metadata commit
plan_head_before: 2a1c001fca5271cca7b1aec70b0f008bb806d012
plan_head_after: d0bf727301afbcb601c63ab89bf5dc922adaac5a

tech-stack:
  added: []
  patterns:
    - "A retirement tracer gets its RED from a module-surface pin (Object.keys of the module) when the successor tests describe code that already exists"

key-files:
  created:
    - components/photos/__tests__/plate-sheet.test.tsx
  modified:
    - lib/photos/label-layout.ts
    - lib/__tests__/photos-label-layout.test.ts
    - lib/photos/view-model.ts
    - lib/photos/routes.ts
    - e2e/not-found.spec.ts
    - e2e/visual/routes.spec.ts
    - e2e/service-worker.spec.ts
  deleted:
    - components/photos/MapSheet.tsx
    - components/photos/__tests__/map.test.tsx
    - data/light-table.ts

key-decisions:
  - "18-27: plate-sheet.test runs each map.test successor row for every registry region (describe.each over regionIds): 11 rows x 3 regions = 33 tests, none merged"
  - "18-27: stack1D now uses Math.max/Math.min directly; the branch trace (pickMax/pickMin) only served the retired CSS segments. Same values, and the lightbox chunk is 177 B smaller"
  - "18-27: the 23 declared rows are retired, not kept: none of their exports is imported by a new layout (plate-layout and overview-layout import nothing from label-layout)"

requirements-completed: []  # PHOTO-06 is also claimed by 18-28 and 18-29; REQUIREMENTS.md keeps it Pending (18-22 convention)

duration: 21min
completed: 2026-11-26
---

# Phase 18 Plan 27: MapSheet and the Light Table Retired Summary

**The v2.0 map sheet is gone. `MapSheet`, its 11-row test and the map half of `label-layout.ts` are deleted, and their behaviour now lives on as 33 plate-sheet rows plus the 18-09/18-10/18-13 plate and overview sweeps. The light table (`data/light-table.ts`, `lightTableIds`, `lightTableInput`, `LIGHT_TABLE_REGION`, `photoViews`, `photoSlugs`) is gone too, and `buildPhotoViews` now requires its input. Every surface reads either a region series or the published views.**

## Performance

- **Duration:** about 21 min of edits and gates (16:06Z to 16:27Z), plus about 15 min checking the Firefox /offline flake against the base tree
- **Started:** 2026-11-26T16:06:24Z
- **Completed:** 2026-11-26T16:27:12Z
- **Tasks:** 2 (3 commits: tracer RED test, tracer GREEN feat, Task 2 feat)
- **Files:** 1 created, 7 modified, 3 deleted

## Accomplishments

- Wrote `plate-sheet.test.tsx` first. It server-renders `PlateSheet` + `PlateKey` the way the region page builds them (`regionPlateSheet`, `sheetMargin(region.plate)`, key rows from `regionPhotoViews`). It has one successor row per map.test row, for each of the 3 regions. Nothing is mocked. The synthetic case only flips the `approximate` flag in the plain props, so no coordinate appears anywhere.
- Deleted `components/photos/MapSheet.tsx` and `map.test.tsx`. Before deleting, I ran `git grep` across app, components, lib, data, e2e (including helpers), scripts, proxy.ts, CSS and .github. MapSheet had no importer. Its own imports (SummitMark, homePlate, terrain, sheet, formatMetres, photoHref) all keep other importers.
- Reduced `lib/photos/label-layout.ts` to `stack1D`, the only symbol `hotspot-layout.ts` imports. `plate-layout.ts` and `overview-layout.ts` import nothing from it. `grep -c "export function mapMarkCss" lib/photos/label-layout.ts` = 0.
- `photos-label-layout.test.ts` keeps its 3 `stack1D` rows and adds the module-surface pin (`Object.keys` = `['stack1D']`). The 23 declared rows retire onto their successors (table below).
- `e2e/not-found.spec.ts` now requests `/photos/${SLUGS.matterhornFromZermatt}`. In `e2e/visual/routes.spec.ts`, the hero-contour settle wait no longer lists the dead `[data-map-mark]` selector. That is a selection change only: no ROUTES entry or PNG was touched.
- In `lib/photos/view-model.ts`, the light-table exports and the `lightTableIds` import are removed, and `buildPhotoViews(input: PhotoViewInput)` has no default, with its doc block updated (D-27). `data/light-table.ts` was removed with `git rm`.
- Final name grep: `git grep -n -E -e "\bphotoViews\b" -e "\bphotoSlugs\b" -e lightTableIds -e lightTableInput -e LIGHT_TABLE_REGION -e "buildPhotoViews\(\)" -- app components lib data e2e` exits 1 (no match).
- Home is untouched: `git diff --stat 769e1b8 -- data/home-waypoints.ts lib/ascent components/home` prints nothing (DATA-09).

## Mapping: map.test.tsx (11 rows, no allowance) to plate-sheet.test.tsx (18-27)

Each successor runs once per region (ortler, saalfelden, zermatt), under `describe.each(regionIds)` 'PlateSheet and PlateKey for %s (18-27; successor of map.test)'.

| # | Retired map.test row | Successor plate-sheet row (18-27) |
|---|---|---|
| 1 | renders a section named for the map with an ordered list of four links | renders the key as an ordered list 'Photographs on the map, lowest first' with one row per positioned photo |
| 2 | links each waypoint to its photo in the canonical order | links each key row and each plate badge to its figure (#photo-{slug}), the rows in sequence order |
| 3 | names each link '{title}, {altitude}', the film scan with 'approx.' | names each key row '{title} · {altitude}', an approximate photo's altitude ending in 'approx.' |
| 4 | shows the title and altitude on each plate | shows each photo's place in the sequence (1 = lowest) on its plate badge and its key badge |
| 5 | puts the dot and the leader inside the link, the leader hidden from assistive tech | gives every pin group its dot, its aria-hidden leader and its badge unit, one group per dot |
| 6 | draws the approximate dot hollow with a 2 px dashed ink border, the exact dots solid | draws an approximate photo's dot and badges hollow and dashed, an exact one's solid |
| 7 | draws a synthetic coarse photo's dot dashed and names it approx. (16 D-01) | follows a flipped approximate flag in the plain props: dot, plate badge and key badge (16 D-01) |
| 8 | draws the summit as an aria-hidden plate that is not a link | keeps every plate badge pointer-only (tabindex -1, aria-hidden), so nothing inside the sheet is focusable |
| 9 | emits the label positions as a style element with container queries | emits plateCss(pins, 'plate-{id}') as the sheet's style element |
| 10 | names the sheet container and lays the relief and contours under the marks | names the inline-size sheet container plate-{id} and lays the lazy relief and the contours under the pins |
| 11 | prints the margin line under the sheet | prints the plate's sheet margin as the figure's figcaption, after the sheet |

## Mapping: photos-label-layout.test.ts declared rows (R_jest 23) to earlier successors

At plan start, the measurement found 23 rows outside the `stack1D` describe, out of 26 in the file (the pinned value). Successor titles are the actual test titles. `${r.id}` rows run once per region.

| # | Retired row (describe) | Key | Successor (plan, file: actual title) |
|---|---|---|---|
| 1 | declares the UI-SPEC boxes, insets and sweep range (constants) | O1 | 18-13 overview-layout.test: 'declares the UI-SPEC boxes, gap, inset, tiers, ratio, leader steps and sweep range'; 'keeps at least 8 px between any two boxes'; 'keeps every box at least 8 px inside the sheet' |
| 2 | is written for exactly four photographs (a fifth forces a layout revision) (constants) | O4 | 18-13: 'was measured for exactly 3 regions and 5 reference summits'; 'fails with a message naming the sweep when a count changes' |
| 3 | keeps the tiers: compact up to 559 px, wide from 560 px (sweep) | O3 | 18-13: 'keeps the tiers: compact (markers only) up to 559 px, wide from 560 px'; 'hides every plate on the compact tier' |
| 4 | keeps at least 8 px between any two plates (sweep) | O5 | 18-13: 'allows two boxes exactly 8 px apart'; 'fails two boxes 7 px apart'; 'keeps at least 8 px between any two boxes' |
| 5 | puts no plate over a dot, the summit mark or the summit plate (sweep) | O1 | 18-13: 'keeps at least 8 px between any two boxes'; 'covers no sheet-index rectangle (its drawn outline) with a marker, a region plate or a summit label' |
| 6 | draws no leader across another plate (sweep) | P5 | 18-09 plate-layout.test: 'draws no leader across another badge' |
| 7 | keeps every plate and the summit plate at least 8 px inside the sheet (sweep) | P1 | 18-09: 'keeps every badge at least 8 px inside the sheet (UI E4/overflow)'; 'keeps at least 8 px between any two badges (none overlap)' |
| 8 | reads top to bottom, then left to right, in altitude order (sweep) | O2 | 18-13: 'numbers the markers 1..N west to east (regionsWestToEast)' |
| 9 | places each dot at u x S, v x S and keeps the input (altitude, then id) order (sweep) | P3 | 18-09: 'puts every dot exactly at its pin uv x S'; "gives Zermatt's img-0680 and img-0682 one dot and two badges side by side at every side"; 'numbers every region photo 1..N in the sequence order, with its stored uv and precision' |
| 10 | uses 144 x 68 compact plates in the four UI-SPEC slots (plate boxes) | O3 | 18-13: 'keeps the tiers: compact (markers only) up to 559 px, wide from 560 px' |
| 11 | uses 256 x 48 wide plates beside their dots (plate boxes) | O1 | 18-13: 'puts each region plate 8 px from its marker and each summit label 8 px from its triangle'; 'keeps every box at least 8 px inside the sheet' |
| 12 | puts the summit plate 8 px right of the triangle, centred on it (plate boxes) | O6 | 18-13: 'pins the summit labels with no legal place exactly in UNPLACED_SUMMIT_LABELS (A6)'; 'puts each region plate 8 px from its marker and each summit label 8 px from its triangle' |
| 13 | starts every leader on its own plate edge, 8 px or more from the corners, and ends it on the dot centre (plate boxes) | P1 | 18-09: 'centres an undisplaced unit on its dot; a displaced one has a leader from its centre to the exact dot' |
| 14 | shows the preview below a plate whose top is within 120 px of the sheet top, else above (plate boxes) | P8 | 18-10 plate-layout.test: 'emits the list-plate :has() sync selectors for every pin (Pattern 3, T-18-60)' |
| 15 | rejects any count but four on the compact tier, naming the four-waypoint template (mark counts) | O4 | 18-13: 'was measured for exactly 3 regions and 5 reference summits'; 'fails with a message naming the sweep when a count changes' |
| 16 | accepts any count on the wide tier (mark counts) | P6 | 18-09: 'was measured for exactly these pins per region (a change forces a re-sweep)'; 'gives every region at least one pin (...)' |
| 17 | covers the sweep with open ends and contiguous integer ranges (mapMarkSegments) | P2 | 18-09: '${r.id}: covers the sweep with open ends and contiguous integer ranges'; '${r.id}: emits the first segment unconditionally and one @container rule per later segment' |
| 18 | reproduces layoutMapMarks within 0.5 px at every side from 312 to 1100 px (mapMarkSegments) | O7 | 18-13: 'reproduces overviewLayout exactly at every width from 312 to 1100 px' (18-09: '${r.id}: reproduces plateLayout exactly at every side of the sweep') |
| 19 | has one @container rule per segment boundary on the map-sheet container (mapMarkCss) | P2 | 18-09: '${r.id}: emits the first segment unconditionally and one @container rule per later segment' |
| 20 | is built only from numbers, the four slugs and fixed selectors (T-10-18) (mapMarkCss) | P7 | 18-09: 'is built only from numbers, the slugs and fixed selectors'; 'throws a RangeError naming a slug outside the slug pattern' |
| 21 | places the plates with calc(<fraction> * 100cqw + <n>px) lengths (mapMarkCss) | O7 | 18-13: 'places with calc(<u> * 100cqw ± <px>px) and calc(<v> * 100cqh ± <px>px)' |
| 22 | cascades to the layout at every side from 312 to 1100 px, within 0.5 px (mapMarkCss) | O7 | 18-13: 'cascades to overviewLayout at every width from 312 to 1100 px, within 0.5 px' (18-09: '${r.id}: cascades to plateLayout at every side of the sweep, within 0.5 px') |
| 23 | refuses a slug that is not lowercase letters, digits and hyphens (mapMarkCss) | P7 | 18-09: 'throws a RangeError naming a slug outside the slug pattern'; 18-13: 'throws a RangeError for an id or a container name outside the slug pattern' |

Kept: the three `stack1D` rows ('centres, then pushes down to clear the previous item by the gap', 'pushes an overflowing stack up from the bottom', 'centres a single item on its anchor and keeps it inside the bounds'). Added: 'module surface (18-27; D-27)' › 'exports only stack1D: the v2.0 map sheet half (layoutMapMarks, mapMarkSegments, mapMarkCss) is retired'.

## GUARD-03 count gate

```
jest 2798 -> 2798 (allowance 23, floor 2775)
e2e 855 -> 855 (allowance 0, floor 855)
```

Arithmetic: 2798 - 11 (map.test) - 23 (declared rows) + 33 (plate-sheet) + 1 (module-surface pin) = 2798. `npm run guard:tests`: jest 2798 + e2e 855 = 3653 against the committed phase floor 3024, OK. `guard:tests:scan` reports no focus, skip or fixme marker. Full Jest: 129 suites, 2798 passed. `npm run lint` (eslint plus every guard) and `npm run type-check` (app, jest, e2e) both exit 0. `check-snapshot-commit --none` passes after all three commits (0 PNGs).

## TDD (Task 1, tracer)

- **RED** `eef8262` (test). The target 'exports only stack1D: the v2.0 map sheet half (...) is retired' failed on its `toEqual` assertion: 13 map-only exports were still beside `stack1D`. The classifier returned `RED_EVIDENCE_OK` (junit via the scratchpad reporter, 60 tests, 1 failed). Semantic check: the target ran and failed on the planned assertion, with no load, syntax or fixture fault. The 33 plate-sheet rows passed at RED. That is expected: they pin the existing PlateSheet/PlateKey markup as successors and are not the RED target. Evidence is in `.gsd/tdd-evidence/18-27/` (ignored).
- **GREEN** `19a14cc` (feat). MapSheet and map.test are deleted, label-layout is stack1D only, and the 23 rows are retired. The verify block passed: the five named suites (121 tests), full Jest with the ratchet, lint and type-check.
- **REFACTOR:** none as a separate commit. The trace-free `stack1D` went into GREEN.
- Tracer gate (interactive, end-of-phase): the automated `<verify>` passed again before Task 2.

## Production e2e (Chromium + Firefox, PW_PROD=1)

not-found, og, seo, photos-region, photos-lightbox and audit: **627 passed, 1 failed**. The failure was the known local-only Firefox `/offline` audit row (`frame.evaluate: Page crashed` inside AxeBuilder.analyze). It looked unusually persistent (0/6 on HEAD in two reruns), so I compared it against the base tree. I restored the five changed source files to 2a1c001 in the working tree only, rebuilt, and ran the row: first 4/4 passed, then a later `--repeat-each=6` on the same base sources failed 6/6, the same as HEAD's 6/6 in the next run. A run with only label-layout reverted, whose client chunks were identical to base, went 2 passed and 1 failed. The crash follows the machine's state, not this plan's code. /offline's HTML and chunks do not depend on any removed export. No assertion was weakened. The tree is back at HEAD and clean, and the last build is HEAD's.

## Client JS

**1,827,607 B** (21 files, `.next/static/chunks/**/*.js`), 177 B less than 18-26 and 28,234 B under the 1,855,841 B cap. Only one chunk differs from base: the lightbox/hotspot chunk, 48,009 to 47,832 B, because `stack1D` no longer carries `pickMax`/`pickMin`/trace. I recorded it in the phase tracker.

## Task Commits

1. **Task 1 RED: plate-sheet successors + module-surface pin**: `eef8262` (test)
2. **Task 1 GREEN: MapSheet and label-layout's map half retired**: `19a14cc` (feat)
3. **Task 2: light table removed from model, data and e2e**: `d0bf727` (feat)

## Decisions Made

- The successor rows run per region, not only for Zermatt. map.test covered the one sheet that existed, and each region now has its own plate, so each row checks all three.
- I simplified `stack1D` instead of keeping the trace machinery. Behaviour is unchanged: `stack1D`'s three rows and `photos-hotspots.test` pass, and the lightbox chunk is 177 B smaller.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - stale doc] `lib/photos/routes.ts` comment named "every light-table slug"**
- **Found during:** Task 2 (the light-table git grep)
- **Issue:** after the deletion the comment described a test subject that 18-26 had already renamed to the v2.0 slugs
- **Fix:** it now says "every v2.0 slug". The change is comment-only, so no bundle changed.
- **Files modified:** lib/photos/routes.ts (not in files_modified)
- **Commit:** d0bf727

**2. [Rule 1 - dead selector] `e2e/visual/routes.spec.ts` settle wait listed `[data-map-mark]`**
- **Found during:** Task 1 (the MapSheet importer grep)
- **Issue:** no page has rendered MapSheet's marks since 18-22, so the selector was dead
- **Fix:** the wait now lists only `[data-ascent-stage]`. The comment notes the retirement. The wait fires on exactly the same pages as before, so no pixels change.
- **Commit:** d0bf727

Notes, not deviations: `e2e/visual/routes.spec.ts` was already prettier-dirty at HEAD (lines 40 and 336, not mine). I did not reformat it, and my edit adds no new issue. Every other touched file passes `prettier --check --end-of-line auto`.

## Left for later plans

- **18-28:** this plan changes no baseline entry or family. The only change in routes.spec is the dead selector in the settle wait. The pending changes are still the ones from 18-22 and 18-23: re-baseline photos/*, and remove the photos-grid/* and photos-carousel/* entries and their PNGs.
- **18-29 ledger:** the D-27 light table is closed. Historical prose that still says "light table" (not identifiers): data/photos/editorial.ts:20, e2e/visual/routes.spec.ts:34, lib/__tests__/photos-view-model.test.ts:44, region-series.test.ts:3, regions.test.ts:318, lib/regions.ts:370. lib/photos/plate-layout.ts:559 cites "the mapMarkCss precedent", a function that no longer exists.
- **data/sheet.ts** stays: `sheet.title` is still read by SiteFooter, lib/og/template.tsx and lib/sheet-margin.ts. MapSheet was its fourth reader.
- `LIGHTBOX_CLOSE_EVENT` is unchanged (it still has no listener). It is outside this plan's files.

## Issues Encountered

The Firefox /offline axe crash, covered above. It is environmental and reproduces on base sources.

## User Setup Required

None.

## Self-Check: PASSED

- components/photos/__tests__/plate-sheet.test.tsx: FOUND
- components/photos/MapSheet.tsx, components/photos/__tests__/map.test.tsx, data/light-table.ts: absent (deleted)
- Commits eef8262, 19a14cc, d0bf727: FOUND in HEAD's history
- Light-table name grep over app, components, lib, data, e2e: exit 1 (no match)
