---
phase: 18-immersive-survey-layout
plan: 11
subsystem: ui
tags: [sheet-margin, attribution, licences, terrain-build, proj4, region-page, server-only]
status: complete

requires:
  - phase: 18-03
    provides: "SHORT_CREDIT, sourceHref, SOURCE_IDS (data/source-credits.ts); Tim's approved sheet titles and short credits; G1 for GLO-90"
  - phase: 18-10
    provides: "the facts-and-plate grid; PlateSheet's <figure> as the right column's only child"
provides:
  - "lib/sheet-margin.ts (server-only): SheetMarginModel, SHEET_TITLES, sheetMargin(plateId | 'overview')"
  - "components/terrain/SheetMargin.tsx: the compact figcaption (title · contours, Extent, Last surveyed, Source link, optional Summits)"
  - "Every region plate's figure carries its own margin as its figcaption"
  - "data/generated/plates.ts: extent.wgs84 (SW/NE, 6 decimals) on EPSG:3035 sheets, emitted by build-terrain.mjs; the LaeaSheet schema field"
  - "The overview's complete margin model for 18-23 to render"
affects: [18-14, 18-23, 18-29, REGION-06]

actuals:
  tokens: 9200     # chars/4 over git diff 1cb90f0..3f16b98 (36,823 chars, 10 files)
  tasks: 2
  commits: 3       # measured: git rev-list --count 1cb90f0..3f16b98; the metadata commit follows
plan_head_before: 1cb90f080534d85b58f8001a8be4b03f83b849b4
plan_head_after: 3f16b98ced91023678b1f3200e50ff031a257ec2

tech-stack:
  added: []
  patterns:
    - "A server-only model module builds plain-string props; the component takes props only, so no data module reaches a client chunk"
    - "Projections that need proj4 run at build time and land as numbers in generated data; app code reads the numbers"
    - "Nowrap units joined at ' · ' so a line only breaks between corners or summits"

key-files:
  created:
    - lib/sheet-margin.ts
    - lib/__tests__/sheet-margin.test.ts
    - components/terrain/SheetMargin.tsx
  modified:
    - components/photos/region/PlateSheet.tsx
    - "app/(site)/photos/regions/[region]/page.tsx"
    - scripts/terrain/build-terrain.mjs
    - data/schemas/terrain.ts
    - data/generated/plates.ts
    - data/__tests__/plates.test.ts
    - e2e/photos-region.spec.ts

key-decisions:
  - "18-11: the margin's Last surveyed prints a short month ('Sep 2025', 'May 2026') as D-18 and the UI-SPEC specify; formatMonthYear (full names) validates the edition and its first three letters are the abbreviation"
  - "18-11: the page builds the margin from region.plate and passes it to PlateSheet, which stays props-only (it receives the region id, not the plate id)"
  - "18-11: the Source link is next/link to /sources#anchor (hash scroll is supported); it is the margin's only link, so WCAG 2.5.8's spacing exception covers it without a 44 px row"
  - "18-11: G1 holds, so every margin's source is a link; the notice variant stays in the type and component for a future licence that needs its text at the map, guarded by a verbatim test"

requirements-completed: []  # REGION-06 stays Pending: the overview margin renders in 18-23, the region baselines come in 18-14, and 18-29 closes it (same as 18-03's note)

metrics:
  duration: "about 15 min (15:04Z to 15:19Z, 2026-11-25)"
  completed: 2026-11-25
---

# Phase 18 Plan 11: Sheet margins Summary

Every region plate now carries its own sheet margin as the figure's figcaption: title and contour interval, extent, edition and a linked short credit. The model is server-only. It covers the overview too, which 18-23 will render. Saalfelden's WGS84 corners come from the terrain build, so proj4 never enters app code. Matterhorn's generated files are byte-identical.

## Progress

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Zermatt plate margin end to end, with a working link to /sources#swissaltiregio (tracer) | Done | 627bca6 |
| 2 | Saalfelden WGS84 corners at build time, every plate and the overview in the model, the empty-field guard (tdd) | Done | 713a89f (RED), 3f16b98 (GREEN) |

## What each margin shows

| Sheet | Title line | Extent | Last surveyed | Source |
|-------|-----------|--------|---------------|--------|
| Zermatt (matterhorn) | `Zermatt – Matterhorn · contours every 100 m` | **Extent (LV95)** `SW 2’616’000, 1’088’000 · NE 2’627’000, 1’099’000` | `May 2026` | `swissALTIRegio, swisstopo` → `/sources#swissaltiregio` |
| Ortler | `Ortler · contours every 100 m` | **Extent** `SW 46.4604 N 10.4854 E · NE 46.5640 N 10.6479 E` (lv95ToWgs84) | `May 2026` | `swissALTIRegio, swisstopo` → `/sources#swissaltiregio` |
| Saalfelden | `Saalfelden · contours every 100 m` | **Extent** `SW 47.3878 N 12.7536 E · NE 47.4916 N 12.9183 E` (build corners) | `Sep 2025` | `ALS DTM, BEV, CC BY 4.0` → `/sources#bev-als-dtm` |
| Overview (model only; 18-23 renders it) | `The Alps · contours every 1,000 m` | **Extent** `SW 43° N 5° E · NE 49° N 17° E` | `2021` | `Copernicus DEM GLO-90` → `/sources#copernicus-glo-90` (G1) |

The overview also has a Summits row, west to east by `uv.u`: `Mont Blanc 4,806 m · Dufourspitze 4,634 m · Zugspitze 2,962 m · Grossglockner 3,798 m · Triglav 2,864 m`. Triglav's stored height is printed plainly (P6). The sheet titles and credits are Tim's approved strings from 18-03, verbatim; Matterhorn's title is read from `data/sheet.ts`, so it cannot drift from the footer's.

## Task 1 (627bca6, tracer)

- `lib/sheet-margin.ts`: `SheetMarginModel`, `SHEET_TITLES` and `sheetMargin(id)`. The Swiss sheet (its region's country is CH) keeps `Extent (LV95)` with `formatExtentLines`. Other LV95 sheets print WGS84 corners at 4 decimals through `formatCoordinates`. Lookups use own properties only, so `sheetMargin('toString')` throws a RangeError instead of crashing.
- `components/terrain/SheetMargin.tsx` follows Contract 7's HTML. It has a `data-sheet-margin` hook and a `className` prop. PlateSheet passes `px-4 sm:px-0` so the margin takes back the container gutters under the full-bleed sheet.
- PlateSheet renders the margin as the last child of its `<figure>`. The page builds it with `sheetMargin(region.plate)`.
- Interim state: in this commit only, Saalfelden's page passed no margin because its corners did not exist yet. Task 2 removed that guard and made the prop required.
- Tests: Jest pins the Matterhorn and Ortler strings literally. In e2e, the Zermatt margin shows the title, terms, extent, edition and link, and the link lands on /sources with the swissALTIRegio h2 in view.
- Tracer gate (interactive, `end-of-phase`, automated-only verify): the `<verify>` re-run passed end to end, so the plan expanded.
  - Jest 36/36 (sheet-margin + footer-format).
  - `PW_PROD=1` photos-region + sources on Chromium and Firefox: 183/183, 0 flaky.

## Task 2 (713a89f RED, 3f16b98 GREEN)

- `build-terrain.mjs`: `wgs84Corners(crs, extent)` uses the same `fromGrid` transform as the overview outlines (proj4 for EPSG:3035) and rounds to 6 decimals. Only an EPSG:3035 sheet gets `extent.wgs84`.
- `data/schemas/terrain.ts`: LaeaSheet's extent gains optional `wgs84: { sw, ne }`, refined so that sw lies south-west of ne.
- `npm run terrain:build`:
  - Changed only Saalfelden's record in `plates.ts` (+10 lines).
  - `git diff --exit-code data/generated/home-plate.ts` reported no change.
  - `terrain.ts`, `precache.json`, `overview.ts` and every served asset were unchanged.
  - `npm run data:check` exits 0.
- `sheetMargin`:
  - Saalfelden reads `extent.wgs84`.
  - `'overview'` reads `overview.projection` (whole degrees, or a RangeError), the four-digit year in `overview.source.release`, `formatMetres(contours.intervalM)` and the summits sorted by `uv.u`.
  - `SOURCE_OF_PRODUCT` gains `Copernicus DEM GLO-90`.
- PlateSheet's `margin` prop is now required. The page passes `sheetMargin(region.plate)` for every region.
- e2e:
  - The Ortler and Saalfelden margins: `Extent` with two `NN.NNNN` WGS84 corners, their editions, and their credits and anchors.
  - Every region at 375 px: no horizontal scroll, the margin text inside the 16 px gutters, and each corner unit on one line.

## TDD Gate Compliance

- RED (713a89f): `npx jest lib/__tests__/sheet-margin.test.ts data/__tests__/plates.test.ts` with the JUnit reporter: 16 of 89 failed.
  - Target: `plates.ts (the generated 2D sheets) › saalfelden's WGS84 corners are its LAEA SW and NE corners (proj4, 6 decimals)` failed on `toEqual` (received `undefined`).
  - `gsd check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`).
  - Semantic assessment: all 16 failures are the planned missing behaviour.
    - The two plates rows fail on their assertions.
    - The Saalfelden, overview and E9 rows fail on sheetMargin's own RangeError ("no WGS84 corners", "overview is not a plate") thrown inside each test.
    - The 73 passes are Task 1's rows and the existing plates suite.
  - A first RED attempt built the margins at describe time, so the whole sheet-margin file failed to load (a load failure, INVALID_RED). The rows were made lazy (`beforeEach` / built per test) before the recorded run.
  - The RED commit carries an expected type error: `extent.wgs84` was not in the schema yet. GREEN adds it, and type-check passes there.
- GREEN (3f16b98): sheet-margin + plates + terrain suites pass, 129/129.
- REFACTOR: none needed.

## Verification

- Jest: full suite, 128 suites and 2,596 tests passed. The plan's three suites: 129/129.
- `npm run data:check`: 0. `git diff --exit-code data/generated/home-plate.ts`: no change.
- `npm run type-check`: 0. `npm run lint` (eslint plus every guard and data:check): 0.
- `PW_PROD=1` e2e on Chromium and Firefox:
  - After Task 1, photos-region + sources: 183/183.
  - After Task 2, photos-region: 177/177.
  - No flaky or retried tests in either run. `public/service-worker.js` was restored after each run.
- `node scripts/ci/check-snapshot-commit.mjs --sha <sha> --none`: OK (0 changed) on 627bca6, 713a89f and 3f16b98. No PNG was touched.
- Acceptance greps:
  - `export function sheetMargin` in lib/sheet-margin.ts: 1.
  - `wgs84` in data/generated/plates.ts: 1.
  - `git grep -c "proj4" -- app components lib ':!lib/__tests__'` printed nothing and exited 1. A doc comment first named proj4 and was reworded.
- Baselined pages: the footer and /sources are untouched. SheetMargin is new and only region pages render it; the sources spec passed in the Task 1 run. Region pages are not in the visual suite until 18-14.
- The Firefox `/offline` flake (deferred-items.md) did not arise; the audit spec was not part of this plan's runs.

## Client JS (record-only; enforced at 18-25 and 18-29)

Measured after 3f16b98 with `rm -rf .next/static && npm run build`, then the byte sum of `.next/static/chunks/**/*.js`, then `git restore public/service-worker.js`:

- **1,861,681 B in 25 files**: unchanged against the running total of 1,861,681 B (0 B added), and still 5,840 B over the cap of 1,855,841 B.
- SheetMargin is a server component, and its next/link is already in the shared runtime.
- No chunk contains a margin string. The only "Last surveyed" hits are the footer SheetLegend's own term, which was already there. Searches for `47.387799`, `Copernicus DEM 2021 release`, `bev-als-dtm` and `Grossglockner` found nothing in any chunk, so neither the margin model nor the overview data leaks into the client.

## ui-ux-pro-max (project rule)

Invoked before the markup. Two focused `--domain ux` searches:

- **"inline link target size"**: WCAG 2.2 AA Target Size (Minimum) asks for 24 × 24 CSS px or an applicable exception, and 44 pt is native guidance, not web conformance. Applied: the Source link is the margin's only link, so the spacing exception holds without a 44 px row in the caption. This is recorded in the component's doc block.
- **"label wraps nowrap separator"**: Compact Label Overflow says to keep a compact label whole on one line and to wrap the collection, not the label. Applied: each corner and summit pair is a `whitespace-nowrap` unit, the row wraps between units, and the e2e checks this at 375.

Everything else follows Contract 7 with existing tokens only: mono `text-sm text-ink-muted`, `font-body` terms, `text-ink` values and `prose-link`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The named formatter gives 'September 2025', but the contract says 'Sep 2025'**
- **Found during:** Task 2 GREEN.
- **Issue:** The plan's action names `formatMonthYear(dem.edition)`, which prints full month names. The must-have (D-18), the behavior list and the UI-SPEC table all say `Sep 2025`.
- **Fix:** `editionMonth()` validates through `formatMonthYear` and keeps the month's first three letters. Matterhorn's `May 2026` is the same either way, and the footer legend is unchanged.
- **Files modified:** lib/sheet-margin.ts
- **Commit:** 3f16b98

**2. [Rule 3 - Blocking] The page builds the margin (the page file is not in files_modified)**
- **Found during:** Task 1.
- **Issue:** PlateSheet receives the region id (`zermatt`), not the plate id (`matterhorn`), and its contract is plain props.
- **Fix:** `app/(site)/photos/regions/[region]/page.tsx` calls `sheetMargin(region.plate)` and passes `margin` to PlateSheet. The key link `<SheetMargin margin=…>` lives in PlateSheet as planned.
- **Commits:** 627bca6, 3f16b98

**3. [Rule 3 - Blocking] Task 1 had to leave Saalfelden's plate without a margin**
- **Found during:** Task 1.
- **Issue:** Saalfelden's corners only exist after Task 2's build change. Rendering its margin in Task 1 would throw at build time.
- **Fix:** Task 1's commit gave Saalfelden no margin, through an optional prop and a one-line guard in the page. Task 2 removed both, so no intermediate code remains.
- **Commits:** 627bca6 (interim), 3f16b98 (removed)

**4. [Rule 1 - Bug] A doc comment named proj4 in app code and tripped the GUARD MUTATION grep**
- **Found during:** Task 2 acceptance.
- **Fix:** Reworded the comment. The grep now exits 1 with no output.
- **Commit:** 3f16b98

## Known Stubs

None. The `notice` branch of the Source row is unused under G1, by design: it is the D-17 fallback for a licence that needs its text at the map, and a test pins that any notice would be verbatim (16 D-21).

## Forward notes

- **18-23:** render `<SheetMargin margin={sheetMargin('overview')} />` as the overview figure's figcaption. The model already has the Summits row and the G1 link. Add the gutters class if the overview sheet is full-bleed.
- **18-14:** the plate figure is now taller by the margin (about 2–3 lines at 375). Region baselines will include it.

## Self-Check: PASSED

- FOUND: lib/sheet-margin.ts, lib/__tests__/sheet-margin.test.ts, components/terrain/SheetMargin.tsx
- FOUND: 627bca6, 713a89f, 3f16b98 (ancestors of HEAD)
