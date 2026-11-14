---
phase: 15-region-plate-data-model
plan: 11
subsystem: ui
tags: [contour-field, plates, footer, sheet-band, sheet-legend, view-model, region-series, zero-diff]

requires:
  - phase: 15-04
    provides: data/generated/plates.ts (matterhorn plate, contour URLs equal to terrain.ts)
  - phase: 15-06
    provides: photo.region in data/generated/photos.ts
  - phase: 15-08
    provides: the footer's ticks from homePhotos() (lib/ascent/home-photos.ts)
  - phase: 15-10
    provides: lib/photos/view-model.ts after the photoHref split; client JS 1,851,610 B
provides:
  - "ContourField({ plate, lod, className }) over plates.ts; exported PlateId and ContourLod<P> (LOD typed per plate)"
  - "SheetBand({ plate, ticks }) and SheetLegend({ plate, title }) server components, extracted from SiteFooter with byte-identical markup"
  - "LIGHT_TABLE_REGION ('zermatt') and seriesInput(region) in the view-model; buildPhotoViews defaults to the Zermatt series"
  - "region-series.test.ts: a photo in another region stays off the light table"
  - "Client JS measured at start (1,851,610 B) and end (1,851,125 B) against the 1,850,382 B phase base"
affects: [15-16, 16, 17, 18]

actuals:
  tokens: 7000
  tasks: 3
  commits: 3
plan_head_before: e437c9a438edae374da45ee48abb38ef3cdc4633
plan_head_after: 3d784039d05113960e8416d6ef119b68b080895e

tech-stack:
  added: []
  patterns:
    - "Generic per-plate props: index plates.ts through a mapped-type view (`{ [Q in PlateId]: ... Record<ContourLod<Q>, string> }`) so a generic plate keeps its own LOD keys without a cast"
    - "A markup-moving refactor is proven with a throwaway renderToStaticMarkup dump before and after (never committed), then cmp"
    - "A view-model default input is a named series (seriesInput(region)), never the raw generated photo list"

key-files:
  created:
    - components/terrain/SheetBand.tsx
    - components/terrain/SheetLegend.tsx
    - components/terrain/__tests__/ContourField.test.tsx
    - lib/__tests__/region-series.test.ts
  modified:
    - components/terrain/ContourField.tsx
    - components/home/PosterSheet.tsx
    - components/photos/MapSheet.tsx
    - components/site/EdgeArt.tsx
    - components/site/SiteFooter.tsx
    - components/site/__tests__/SiteFooter.test.tsx
    - lib/photos/view-model.ts
    - lib/__tests__/photos-view-model.test.ts

key-decisions:
  - "15-11: ContourField indexes plates.ts through a module-level mapped-type view (`sheets`) instead of a cast. Direct `plates[plate].assets.contours[lod]` does not type-check for a generic P (TS2536), because TS resolves plates[P] to the concrete one-plate type"
  - "15-11: SheetLegend reads extent, strip equidistance and DEM edition from plates[plate]. After Task 2 the error-boundary chunks carry plates.ts instead of terrain.ts (terrain stays only in the TerrainStage chunk), so the client total dropped by 485 B from the start total"
  - "15-11: the D-21 transition check loops over the sources entries under components/terrain/, so each new file name appears once in the test (the plan's grep expects exactly 2 lines)"

patterns-established:
  - "Phase 18 draws a region plate's sheet with <SheetBand plate=... ticks=...> and <SheetLegend plate=... title=...>; neither adds a wrapper or an @container"

requirements-completed: [DATA-11, DATA-10]

coverage:
  - id: D1
    description: "ContourField(plate, lod) reads plates[plate].assets.contours[lod]; for matterhorn every mask URL equals the terrain.ts string, at all four call sites"
    requirement: DATA-11
    verification:
      - kind: unit
        ref: "components/terrain/__tests__/ContourField.test.tsx#draws the matterhorn %s mask with the v2.0 URL string"
        status: pass
      - kind: unit
        ref: "components/terrain/__tests__/ContourField.test.tsx#types lod per plate (an LOD the plate does not ship is a compile error)"
        status: pass
      - kind: other
        ref: "git grep -n 'plate=\"matterhorn\"' -- components (4 call sites)"
        status: pass
    human_judgment: false
  - id: D2
    description: "SiteFooter composed from SheetBand (first child) and SheetLegend; renderToStaticMarkup(<SiteFooter />) byte-identical before and after; no wrapper and no new @container"
    requirement: DATA-11
    verification:
      - kind: other
        ref: "throwaway footer-markup.tmp.test.tsx dump, cmp footer-before.html footer-after.html (identical, 7,433 B, sha256 9e4fb8ea...)"
        status: pass
      - kind: unit
        ref: "components/site/__tests__/SiteFooter.test.tsx (all D-19, D-20, D-15/D-18 and focus rows)"
        status: pass
      - kind: other
        ref: "acceptance script: no non-comment @container in SheetBand.tsx or SheetLegend.tsx (prints 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The D-21 static-source test covers SheetBand.tsx and SheetLegend.tsx (no use client, motion, locale, state or transition)"
    requirement: DATA-11
    verification:
      - kind: unit
        ref: "components/site/__tests__/SiteFooter.test.tsx#%s has no client, motion, locale or animation code"
        status: pass
      - kind: unit
        ref: "components/site/__tests__/SiteFooter.test.tsx#puts no transition utility on band or legend elements (only the 07 link hover keeps one)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The light table is the Zermatt series: buildPhotoViews defaults to seriesInput('zermatt'); an injected other-region photo leaves ids and slugs unchanged; seriesInput of an unknown region throws a RangeError"
    requirement: DATA-10
    verification:
      - kind: unit
        ref: "lib/__tests__/region-series.test.ts#keeps a photo in another region off the light table"
        status: pass
      - kind: unit
        ref: "lib/__tests__/region-series.test.ts#throws a RangeError naming a region with no photos"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photos-view-model.test.ts#returns the Zermatt series in DEM order, ties by id (PHOTO-03)"
        status: pass
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/photos.spec.ts e2e/photos-sweep.spec.ts e2e/photos-carousel.spec.ts --project=chromium (62 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Client JS across .next/static/chunks at most 4,096 B above the 15-01 phase base (end total 1,851,125 B, +743 B)"
    verification:
      - kind: other
        ref: "rm -rf .next/static && npm run build; 15-01 node byte-sum script (start 1,851,610 B; end 1,851,125 B)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Zero pixel diff of the footer, PosterSheet, MapSheet and EdgeArt on Linux"
    verification:
      - kind: other
        ref: "footer markup byte-identical; ContourField URLs pinned by test"
        status: pass
    human_judgment: true
    rationale: "Local visual comparisons on Windows are not authoritative; the CI Visual Regression job at 15-16 is the pixel gate"

duration: 11min
completed: 2026-11-14
status: complete
---

# Phase 15 Plan 11: Plate Sheet and Region Series Groundwork Summary

**`ContourField` now takes a plate and a per-plate-typed LOD from `plates.ts`. The footer's sheet margin is split into `SheetBand` and `SheetLegend` server components with byte-identical footer markup. `/photos` reads the Zermatt series through `seriesInput('zermatt')`, so a photo in another region cannot land on the Matterhorn map. Client JS ends 743 B above the phase base.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-11-14T21:58:40Z
- **Completed:** 2026-11-14T22:10:01Z
- **Tasks:** 3
- **Files modified:** 12 (4 created, 8 modified)

## Client JS budget (`.next/static/chunks`, uncompressed)

Same procedure and script as 15-01 (`rm -rf .next/static && npm run build`, byte sum of every `.js`, then `git restore public/service-worker.js`).

| Point | Total | vs phase base | Files |
|-------|-------|---------------|-------|
| Phase base (15-01, `05d736a`) | 1,850,382 B | 0 | 24 |
| 15-11 start (`e437c9a`, after 15-06 to 15-10) | 1,851,610 B | +1,228 B | 24 |
| 15-11 end (after Task 2, `d3b5765`) | 1,851,125 B | +743 B | 24 |
| Phase cap | 1,854,478 B | +4,096 B | |

The end total is 485 B below the start total. The two global-error chunks and the error-boundary chunk now carry `plates.ts` instead of `terrain.ts`, because ContourField and SheetLegend both read plates and the footer no longer imports terrain. `terrain.ts` stays only in the TerrainStage chunk. No editorial copy is in any client chunk (`riffelsee-reflection`: no match). Task 3 only touches the server-only view-model; its build shows no editorial copy in the chunks either. 15-16 rechecks the bound at the phase tip, with 3,353 B of headroom left.

## Footer markup proof

`renderToStaticMarkup(<SiteFooter />)` was written to `footer-before.html` after Task 1 (before any Task 2 edit) and to `footer-after.html` after the extraction. The two files are byte-identical: `cmp` is silent, the diff is empty, both are 7,433 B with sha256 `9e4fb8eaf7ba8a27109f909a338a28e256618b1ca7a3f2c248e05c1fa1814601`. The throwaway test was deleted and never committed.

## Accomplishments

- `ContourField<P extends PlateId>({ plate, lod, className })` builds the mask from plates.ts. `PlateId = keyof typeof plates` and `ContourLod<P>` are exported. PosterSheet, MapSheet, EdgeArt and the footer band pass `plate="matterhorn"`, with `lod` and `className` unchanged.
- `SheetBand` renders today's band div and its ticks. `SheetLegend` returns a fragment with the title `p` and the whole `dl`, and its Source line text is unchanged. SiteFooter builds the ticks from `homePhotos()` (only photos with a position and a uv, in the same order) and still has exactly one `@container`.
- `seriesInput(region)` and `LIGHT_TABLE_REGION` are in the view-model. Only `buildPhotoViews`' default input changed, so `photoViews`, `photoSlugs`, `photoBySlug`, generateStaticParams and the sitemap follow.
- Full Jest: 113 suites and 1,910 tests (was 111 and 1,901). guard:selftest 232/232. type-check and lint pass. The light-table e2e specs in Chromium on a production build: 62 passed.

## Task Commits

1. **Task 1: ContourField(plate, lod) end to end** - `c367cc2` (feat)
2. **Task 2: Extract SheetBand and SheetLegend** - `d3b5765` (feat)
3. **Task 3: The light table becomes the Zermatt series** - `3d78403` (feat)

## Files Created/Modified

- `components/terrain/ContourField.tsx` - plate-typed contour mask over plates.ts
- `components/terrain/SheetBand.tsx` - the contour band with waypoint ticks (new)
- `components/terrain/SheetLegend.tsx` - the sheet legend for a plate (new)
- `components/terrain/__tests__/ContourField.test.tsx` - URL equality per LOD, plus the type test (new)
- `components/home/PosterSheet.tsx`, `components/photos/MapSheet.tsx`, `components/site/EdgeArt.tsx` - pass `plate="matterhorn"`
- `components/site/SiteFooter.tsx` - composed from SheetBand and SheetLegend
- `components/site/__tests__/SiteFooter.test.tsx` - D-21 sources include both new files
- `lib/photos/view-model.ts` - `LIGHT_TABLE_REGION`, `seriesInput`, Zermatt default
- `lib/__tests__/photos-view-model.test.ts` - order test rewritten in place
- `lib/__tests__/region-series.test.ts` - series isolation test (new)

## Decisions Made

- I used a mapped-type view instead of a cast for generic indexing, because direct indexing fails with TS2536 (see key-decisions).
- The ContourField test also has an `@ts-expect-error` row: `ContourLod<'matterhorn'>` rejects `'nope'`. This is a positive-plate type test. The negative 2D-plate test the planner noted is still Phase 16's to add, once a real 2D plate exists.
- SiteFooter.test's transition check iterates the `components/terrain/` entries of `sources` (asserting there are 3), so each new filename appears on exactly one line.

## Deviations from Plan

None. The plan was executed as written. The type-test row and the loop shape of the transition check are additions inside the planned files, made to meet the plan's own checks.

## Issues Encountered

- My first attempt at generic indexing failed type-check (TS2322, then TS2536). The mapped-type view fixed it with no runtime change.

## Threat Flags

None. T-15-15: plates.ts now reaches the error-boundary client chunks in place of terrain.ts. It holds the same kind of content (scalars, content-hashed public URLs, and the public swissALTIRegio hillshade `sourceSha256` that terrain.ts already shipped). T-15-16 is covered by region-series.test.ts, which fails when the old default is restored (checked by a temporary mutation).

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- Ready for 15-12. 15-16 rechecks the client JS bound (3,353 B headroom) and runs the CI Visual Regression gate, which is the pixel proof for this plan.
- Phase 16: add the negative type test (`lod="map"` on a 2D plate must not compile) once its first 2D plate exists.

---
*Phase: 15-region-plate-data-model*
*Completed: 2026-11-14*

## Self-Check: PASSED
