---
phase: 18-immersive-survey-layout
plan: 26
subsystem: photos-retirement
tags: [photo-06, d-27, light-table, pitfall-8, fixtures, guard-03, assumption-delta]
status: complete

requires:
  - phase: 18-15
    provides: "regionViewerSet: every viewer steps through its photo's region series"
  - phase: 18-25
    provides: "carousel family retired; client JS 1,827,784 B"
provides:
  - "photoBySlug over publishedViews only (D-27): the v2.0 four get their published views"
  - "Every Jest test outside map.test.tsx and photos-label-layout.test.ts names its photos explicitly (SLUGS/viewBySlug, regionPhotoViews, publishedViews by id)"
  - "Invariant rows in regions.test.ts: every published photo is in exactly one region series; every v2.0 slug resolves through photoBySlug to its published view"
affects: [18-27, 18-28, 18-29]

actuals:
  tokens: 10873    # chars/4 over git diff 9b1218e..2da9581 (43,491 chars incl. context)
  tasks: 2
  commits: 2       # measured: git rev-list --count 9b1218e..HEAD; the metadata commit follows
plan_head_before: 9b1218eed72ab4a0e0b51c717074aea0c5696c30
plan_head_after: 2da958150d674298fcbeaf4e8dd5536f7d4d52f8

tech-stack:
  added: []
  patterns:
    - "Retire a second photo series in two steps: point the lookup at the remaining model and make every test name its photos while the old exports still exist, then delete the exports"

key-files:
  created: []
  modified:
    - lib/photos/view-model.ts
    - lib/__tests__/photo-routes.test.ts
    - lib/__tests__/photos-view-model.test.ts
    - lib/__tests__/regions.test.ts
    - lib/__tests__/region-series.test.ts
    - lib/__tests__/proxy.test.ts
    - lib/__tests__/photos-hotspots.test.ts
    - lib/og/__tests__/template.test.tsx
    - data/__tests__/editorial.test.ts
    - components/photos/__tests__/hotspots.test.tsx
    - components/photos/__tests__/lightbox-dialog.test.tsx
    - components/photos/__tests__/strip.test.tsx

key-decisions:
  - "18-26: photoBySlug returns the published view for every slug (D-27); for the v2.0 four, k/n/prevSlug/nextSlug now span the 11 published photos, which no page, OG card or test reads"
  - "18-26: per-photo Jest rows over the light table keep their subject as the four v2.0 photos (Object.values(SLUGS).map(viewBySlug)) rather than widening to all 11 published photos"
  - "18-26: region-series.test's lightTableInput RangeError row is succeeded by regionPhotoViews' unknown-region RangeError row (the series lookup), not merged into the invariant row"

requirements-completed: []  # PHOTO-06 is also claimed by 18-27..18-29; REQUIREMENTS.md keeps it Pending (18-22 convention)

duration: 9min
completed: 2026-11-26
---

# Phase 18 Plan 26: photoBySlug on the Published Views and Explicit Jest Fixtures Summary

**`photoBySlug` now reads only the published views, so the four v2.0 pages, their metadata and OG cards share one photo model with every other photo. Every Jest test outside the two files 18-27 rewrites now names its photos (SLUGS/viewBySlug, `regionPhotoViews('zermatt')`, or a published view by id) while the light-table exports still exist.**

## Performance

- **Duration:** about 9 min (15:54:27Z to 16:03:04Z, plus the summary)
- **Started:** 2026-11-26T15:54:27Z
- **Completed:** 2026-11-26T16:03:04Z
- **Tasks:** 2
- **Files:** 12 modified

## Accomplishments

- Changed `photoBySlug` to `publishedViews.find(...)` and rewrote its doc block. `grep -c "photoViews.find" lib/photos/view-model.ts` prints 0.
- The full Jest run right after the change failed exactly two rows, the ones that asserted light-table views (n = 4, neighbours among the four). Both were rewritten. No other Jest test read a light-table field through `viewBySlug`.
- Added the assumption-delta invariant to `regions.test.ts` as a new describe: one row checks that every published photo is in exactly one region series, plus one row per v2.0 slug checking that it resolves through `photoBySlug` to its published view.
- Renamed the D-03 describe's local `photoSlugs` (built from editorial) to `editorialSlugs`. Its rows are otherwise unchanged.
- Migrated 9 Jest files to explicit fixtures. The acceptance grep (light-table names and bare `buildPhotoViews()` under lib/__tests__, lib/og, data/__tests__ and components, minus the two 18-27 rewrites and MapSheet.tsx) exits 1, meaning no match: 0 lines, down from 73 after Task 1 and 122 at plan start.
- og.spec and seo.spec passed on a fresh production build: 84 passed on Chromium + Firefox. The v2.0 cards' alt text and content are unchanged, and no query hash moved, so nothing was re-pinned.
- Home is untouched: `git diff --stat 769e1b8 -- lib/ascent components/home` prints nothing (DATA-09).

## photoBySlug behaviour change

| Slug | Before | After | Who reads it |
|---|---|---|---|
| the four v2.0 slugs | light-table view: n = 4, prevSlug/nextSlug among the four | published view: n = 11, prevSlug/nextSlug across the whole published order | photo page, intercepted lightbox, photoMetadata, OG image, e2e `viewBySlug`, e2e/routes.ts photo template |
| the other 7 published slugs | published view | published view (unchanged) | same |

The routes read only title, place, short place, altitude label, id, slug, years, aerial and capture month, and these are the same in every view of a photo. Stepping comes from `regionViewerSet(view.id)`, not from the view's own neighbours. A git grep for `.k`, `.n`, `.prevSlug` and `.nextSlug` in e2e and Jest found no consumer that reads them from `viewBySlug`.

## Migration mapping (GUARD-03: every rewritten row keeps one successor)

| # | File | Old row / fixture | Successor | Kind |
|---|---|---|---|---|
| 1 | photo-routes.test.ts | describe 'photoBySlug: light table first, then the published set (D-07)' | 'photoBySlug: the published set (D-27)' | renamed describe |
| 2 | photo-routes.test.ts | "returns each light-table photo's light-table view (k, n, prevSlug, nextSlug among the four)" | "returns each v2.0 photo's published view (n is the whole published set, not the four)" | row rewritten (region/published fact) |
| 3 | photo-routes.test.ts | "returns every other published photo's published view" | "returns every published photo's published view" | row rewritten |
| 4 | photo-routes.test.ts | 'returns undefined for an unknown or wrong-case slug' (`photoSlugs[0]`) | same title; `SLUGS.matterhornFromZermatt.toUpperCase()` | fixture explicit |
| 5 | photo-routes.test.ts | 'holds every light-table slug, so the four v2.0 URLs keep their pages' | 'holds every v2.0 slug, so the four v2.0 URLs keep their pages' (`Object.values(SLUGS)`) | row rewritten |
| 6 | photos-view-model.test.ts | 'looks up each light-table photo as its light-table view' | 'looks up each v2.0 photo as its published view (18 D-27)' | row rewritten |
| 7 | photos-view-model.test.ts | `committed = lightTableInput()` | explicit four-photo input (photos filtered by the v2.0 views' ids) | fixture explicit |
| 8 | photos-view-model.test.ts | 'returns the Zermatt series in DEM order, ties by id' (photoViews/photoSlugs) | same title; `buildPhotoViews(committed)` slugs = the v2.0 slugs in Zermatt series order = the literal four = Home's `buildWaypoints()` | fixture explicit |
| 9 | photos-view-model.test.ts | 'links each view to its neighbours, null at both ends (no wrap)' (the four) | "links each view of Zermatt's series to its neighbours, null at both ends (no wrap)" (`regionPhotoViews('zermatt')`) | row rewritten (region fact) |
| 10 | photos-view-model.test.ts | 'builds the stage from the 1024, 1600 and 2560 px hashed derivatives' | same; v20Views | fixture explicit |
| 11 | photos-view-model.test.ts | 'builds the tile from the 640, 1024 and 1600 px hashed derivatives' | same; v20Views | fixture explicit |
| 12 | photos-view-model.test.ts | 'carries the capture year and Tim Lui for every photo, never empty' | same; v20Views | fixture explicit |
| 13 | photos-view-model.test.ts | 'publishes every generated photo: ... every light-table slug among them' | '... every v2.0 slug among them' | row rewritten |
| 14 | photos-view-model.test.ts | 'img-0605: place and date, six EXIF units ...' (`viewOf(photoViews, 'img-0605')`) | same; `viewBySlug(SLUGS.matterhornFromZermatt)` | fixture explicit |
| 15 | photos-view-model.test.ts | 'r004-011: the film line instead of EXIF ...' | same; `viewBySlug(SLUGS.riffelseeReflection)` | fixture explicit |
| 16 | photos-view-model.test.ts | 'never prints filler in any strip field' | same; v20Views | fixture explicit |
| 17 | photos-view-model.test.ts | 'the light-table views carry the same country and line as their published views' | 'the region series views carry the same country and line as their published views' (every region's `regionPhotoViews`) | row rewritten (region fact) |
| 18 | photos-view-model.test.ts | "labels an aerial photo's height as ground" (`viewOf(photoViews, 'img-0605')`) | same; `viewBySlug(SLUGS.matterhornFromZermatt)` | fixture explicit |
| 19 | photos-view-model.test.ts | "keeps every current photo's altitude label and Altitude row text (D-25)" | same; v20Views | fixture explicit |
| 20 | region-series.test.ts | describe 'light-table membership (D-15, T-16-07)' | 'region series membership (18 D-27; 16 D-15, T-16-07)' | renamed describe |
| 21 | region-series.test.ts | 'keeps a Zermatt photo that is not in lightTableIds off the light table, and publishes it' | "puts a new Zermatt photo in Zermatt's series beside the v2.0 four, and publishes it" (injected img-9001 is in seriesInput and regionPhotoViews('zermatt'), the four stay, photoRouteSlugs/publishedSlugs admit it, photoBySlug finds it) | row rewritten (region fact) |
| 22 | region-series.test.ts | 'throws a RangeError naming a region with no photos' | unchanged (already seriesInput) | none |
| 23 | region-series.test.ts | 'throws a RangeError naming data/light-table.ts for a light-table id with no generated photo' | 'throws a RangeError naming a region id with no series (regionPhotoViews)' | row rewritten (RangeError subject moved to the series lookup) |
| 24 | region-series.test.ts | 'has every light-table photo in LIGHT_TABLE_REGION' | "has the four v2.0 slugs in Zermatt's series, each a region zermatt photo" | row rewritten (region fact) |
| 25 | proxy.test.ts | "passes /photos/${photoSlugs[0]} through without a rewrite" | `/photos/${SLUGS.matterhornFromZermatt}` | fixture explicit |
| 26 | proxy.test.ts | 'the neutral slug is no known slug in either section' (photoSlugs) | same; publishedSlugs (the full known photo set) | fixture explicit |
| 27 | photos-hotspots.test.ts | `viewOf` default photoViews | default publishedViews (ids named per row) | fixture explicit |
| 28 | photos-hotspots.test.ts | "img-0629's third fact ...; every Wikipedia fact is a 'Wikipedia' link" | same; v20Views | fixture explicit |
| 29 | photos-hotspots.test.ts | 'carries every committed annotation exactly once, in its own photo' | same; v20Views | fixture explicit |
| 30 | photos-hotspots.test.ts | 'never re-sorts the photos themselves' (photoViews vs bare buildPhotoViews()) | same; publishedViews vs `buildPhotoViews(committed)` | fixture explicit |
| 31 | lib/og template.test.tsx | 5 photo case sets (ogPhotoFit per photo, photo variant per photo, film scan, everyCard photos, title line count) over photoViews | same rows over v20Views (`Object.values(SLUGS).map(viewBySlug)`); case names unchanged | fixture explicit |
| 32 | data editorial.test.ts | `views = buildPhotoViews()` | `Object.values(SLUGS).map(viewBySlug)` | fixture explicit |
| 33 | data editorial.test.ts | 'has four views in altitude order' | "has the four v2.0 photos in Zermatt's series, in altitude order" | row rewritten (region fact) |
| 34 | data editorial.test.ts | 'never repeats the cut trivia ...' (`JSON.stringify(buildPhotoViews())`) | same; `JSON.stringify(publishedViews)` | fixture explicit |
| 35 | components hotspots.test.tsx | `viewOf` default photoViews | default publishedViews (ids named per row) | fixture explicit |
| 36 | components lightbox-dialog.test.tsx | 3 rows (Escape without CSS.escape, hidden callout, hiding labels): `photoViews.find(id === 'img-0662')`, `photos={photoViews}` | `viewBySlug(SLUGS.matterhornGlacierTrail)`, `photos={regionPhotoViews('zermatt')}` | fixture explicit |
| 37 | components strip.test.tsx | 6 row sets over photoViews, `viewOf` default photoViews | v20Views; `viewOf` default publishedViews | fixture explicit |
| - | components photo-viewer.test.tsx | (no light-table name left since 18-15/18-16) | no change needed | none |

### Invariant row (assumption delta, new)

| File | Describe | Rows |
|---|---|---|
| lib/__tests__/regions.test.ts | 'one photo model: the region series and the published views (18-26; D-27)' | 'puts every published photo in exactly one region series' (1) + '%s (a v2.0 photo) resolves through photoBySlug to its published view' (4) |

No old row was merged into the invariant row.

## GUARD-03 count gate

```
jest 2793 -> 2798, e2e 855 -> 855
```

`npm run guard:tests`: jest 2798 + e2e 855 = 3653 against the committed phase floor 3024, OK, with no focus, skip or fixme marker. The +5 are the new invariant rows. Full Jest passes (129 suites, 0 failures). Type-check and eslint on the touched files pass. `check-snapshot-commit --none` passes after both commits (0 PNGs).

## Client JS

1,827,784 B from the og/seo production build, the same as 18-25 and 28,057 B under the 1,855,841 B cap. It is recorded in the phase's client-JS tracker.

## Task Commits

1. **Task 1: photoBySlug on the published views, invariant rows, og/seo prod**: `d30d0a2` (feat)
2. **Task 2: explicit fixtures in every remaining Jest test**: `2da9581` (test)

## Decisions Made

- I kept per-photo rows on the four v2.0 photos (`v20Views`) and did not widen them to all 11 published photos. This keeps each test on the same subject. Widening would add cmap and copy checks for the Ortler and Saalfelden photos, which 18-26 does not scope.
- Two rows did widen, because their meaning required it: the proxy neutral-slug row now uses `publishedSlugs` (the full set of known photo slugs), and the editorial FORBIDDEN row now uses `publishedViews`. `JSON.stringify(editorial)` already covered all 11 photos' copy, so the view-model output check now covers all 11 too.

## Deviations from Plan

None that change scope. Two notes:
- `lib/og/__tests__/template.test.tsx` was already prettier-dirty at HEAD (three long lines). I did not reformat it, and my edits add no new prettier issue. Every other touched file passes `prettier --check --end-of-line auto`.
- `components/photos/__tests__/photo-viewer.test.tsx` is in files_modified but needed no change: it has no light-table name left since 18-15 and 18-16.

## Left for later plans

- 18-27: `e2e/not-found.spec.ts` (lines 2 and 153) still imports `photoSlugs`. It is outside this plan's Jest-only scope and must move to `SLUGS.matterhornFromZermatt` before the export goes. `buildPhotoViews`'s default input is still `lightTableInput()`. The `MapSheet.tsx:56` comment mentions "buildPhotoViews() order". `map.test.tsx` and `photos-label-layout.test.ts` are the two planned rewrites.
- `LIGHTBOX_CLOSE_EVENT` is unchanged: LightboxDialog still dispatches it with no listener, and `lightbox-dialog.test.tsx`'s dispatch assertion was left as is. Only that file's three photo fixtures moved. This is for 18-29 and Tim.

## Issues Encountered

None.

## User Setup Required

None.

## Self-Check: PASSED

- lib/photos/view-model.ts contains `publishedViews.find` in photoBySlug and 0 `photoViews.find`
- Commits d30d0a2 and 2da9581: FOUND in HEAD's history
- Acceptance grep for light-table names in Jest tests: exit 1 (no match)
