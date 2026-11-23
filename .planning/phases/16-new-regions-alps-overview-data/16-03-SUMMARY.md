---
phase: 16-new-regions-alps-overview-data
plan: 03
subsystem: data
tags: [photos, routes, light-table, proxy, sitemap, jest]

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-01 precision/kind photo schema and lint staging"
provides:
  - "data/light-table.ts: lightTableIds, the explicit four-photo v2.0 light-table list (D-15)"
  - "lightTableInput(ids) in lib/photos/view-model.ts as buildPhotoViews' default input"
  - "photoRouteSlugs pinned to the light-table list's editorial slugs (still pure-annotated)"
affects: [16-14, 16-17, 17-routes-seo, 18-immersive-layout]

actuals:
  tokens: 3218
  tasks: 2
  commits: 2
plan_head_before: 4f3443c7d6d24bbd3eb1b2b2b0e04b57ec323dcb
plan_head_after: 6e312fd14314679696cb3a43ac720cfa38ed2ecd

tech-stack:
  added: []
  patterns:
    - "Explicit membership list (as const satisfies readonly PhotoId[], type import only) plus a filter helper that throws a RangeError naming the fix file, mirroring data/home.ts + homePhotos"

key-files:
  created:
    - data/light-table.ts
  modified:
    - lib/photos/view-model.ts
    - lib/photos/routes.ts
    - lib/__tests__/region-series.test.ts
    - lib/__tests__/photo-routes.test.ts

key-decisions:
  - "Light-table membership is the explicit lightTableIds list, not the Zermatt region; LIGHT_TABLE_REGION stays as a tested check and seriesInput(region) stays unchanged for Phases 17 and 18"

patterns-established:
  - "Route sets (static params, sitemap, proxy, saved-pages catalog, audit sweep) derive only from photoViews/photoSlugs/photoRouteSlugs, which now read lightTableIds"

requirements-completed: [DATA-13]

coverage:
  - id: D1
    description: "lightTableIds pins buildPhotoViews' default input, photoSlugs and photoRouteSlugs to the four v2.0 photos; an extra Zermatt photo reaches only seriesInput"
    requirement: "DATA-13"
    verification:
      - kind: unit
        ref: "lib/__tests__/region-series.test.ts#keeps a Zermatt photo that is not in lightTableIds off the light table and the route set"
        status: pass
      - kind: unit
        ref: "lib/__tests__/region-series.test.ts#throws a RangeError naming data/light-table.ts for a light-table id with no generated photo"
        status: pass
      - kind: unit
        ref: "lib/__tests__/region-series.test.ts#has every light-table photo in LIGHT_TABLE_REGION"
        status: pass
    human_judgment: false
  - id: D2
    description: "photoRouteSlugs is the light-table list's editorial slugs, in order, four entries, still pure-annotated; every route-set consumer stays at the four with no app, proxy or component change"
    requirement: "DATA-13"
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts#is the light-table list: the editorial slugs of lightTableIds, in order, four of them (D-15)"
        status: pass
      - kind: unit
        ref: "npx jest lib/__tests__/photo-routes.test.ts lib/__tests__/audit-routes.test.ts lib/__tests__/saved-pages.test.ts lib/__tests__/proxy.test.ts components/site/__tests__/SavedPages.test.tsx (120 passed)"
        status: pass
      - kind: other
        ref: "git diff --quiet 4f3443c -- app proxy.ts components (exit 0)"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-11-23
status: complete
---

# Phase 16 Plan 03: Light-Table Pin Summary

**`lightTableIds` in `data/light-table.ts` now fixes the /photos light table, the photo pages and their static params, the sitemap, the proxy route set and the saved-pages catalog at the four v2.0 photos. New photos from 16-14 and 16-17 stay data only, and no rendered output changes.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-11-23T01:07:18Z
- **Completed:** 2026-11-23T01:10:59Z
- **Tasks:** 2
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- `data/light-table.ts` exports `lightTableIds` (img-0605, img-0629, img-0662, r004-011) as `as const satisfies readonly PhotoId[]`. Its only import is a type import, so client chunks that import `photoHref` stay light.
- `lightTableInput(ids = lightTableIds)` in the view-model filters the generated photos by the list and keeps generated order. It throws a RangeError naming `data/light-table.ts` for an id with no generated photo, and it replaces `seriesInput(LIGHT_TABLE_REGION)` as `buildPhotoViews`' default input.
- `photoRouteSlugs` is `/* @__PURE__ */ lightTableIds.map((id) => editorial[id].slug)`, so `proxy.ts` admits exactly the four photo slugs.
- The region-series test was rewritten in place (no test removed): an injected img-9001 in region `zermatt` stays off `buildPhotoViews`, `photoSlugs` and `photoRouteSlugs` but is in `seriesInput('zermatt')`. Two tests were added: the RangeError case, and a check that every light-table photo is in `LIGHT_TABLE_REGION`.
- The photo-routes contract now pins `photoRouteSlugs` to the editorial slugs of `lightTableIds`, in order, four entries.

## Task Commits

1. **Task 1: lightTableIds through buildPhotoViews' default input and photoRouteSlugs** - `537e409` (feat)
2. **Task 2: Every route-set consumer stays at the four, pin in the photo-routes contract** - `6e312fd` (test)

## Files Created/Modified

- `data/light-table.ts` - the explicit v2.0 light-table id list (D-15)
- `lib/photos/view-model.ts` - `lightTableInput()` as the default input; the `LIGHT_TABLE_REGION` JSDoc now describes it as a check, not the filter
- `lib/photos/routes.ts` - `photoRouteSlugs` from `lightTableIds`, pure annotation kept
- `lib/__tests__/region-series.test.ts` - rewritten in place for the list-based membership, plus 2 new tests
- `lib/__tests__/photo-routes.test.ts` - one new pin test

## Verification

- Task 1: `npx jest region-series photo-routes photos-view-model`: 3 suites, 60 tests passed. `grep -c lightTableIds` gives routes.ts 3 and view-model.ts 7. The light-table module has a type import only (0 value imports). The pure-annotation grep matches 1. `npm run type-check` exits 0.
- Task 2: `npx jest photo-routes audit-routes saved-pages proxy SavedPages`: 5 suites, 120 tests passed. `npm run lint` (eslint plus every guard, data:check, guard:images and guard:tests:scan) exits 0. `git diff --quiet HEAD -- app proxy.ts components` exits 0.
- Consumer audit: the sitemap and `generateStaticParams` read `photoSlugs`, the offline page's `savedPageCatalog` reads `photoViews`, `proxy.ts` reads `photoRouteSlugs`, and the audit-routes sweep reads `photoSlugs`. No consumer builds slugs any other way (searched with `git grep` for `generateStaticParams`, `Object.values/keys(editorial` and `seriesInput(` across app, components, lib, proxy.ts and scripts).
- Visual baselines: none were run. The rendered photo set is the same four photos in the same buildWaypoints order, and every existing view-model, photo-routes, audit-routes and saved-pages test passes unchanged.

## Decisions Made

- `LIGHT_TABLE_REGION` and `seriesInput` stay, as the planner decided: the constant is now a tested check, and `seriesInput` is left for Phases 17 and 18.

## Deviations from Plan

None. The plan ran as written. Prettier reflowed the `buildPhotoViews` signature and two long lines in the rewritten region-series test; these are formatting changes only, made inside the task commit.

## Issues Encountered

None.

## User Setup Required

None. No external service needs configuring.

## Next Phase Readiness

- 16-14 and 16-17 can add photos to the generated module in any region, including Zermatt, without adding a page, sitemap entry, proxy route or catalog entry. The region-series and photo-routes tests prove this.
- Phase 17 (PHOTO-05) widens the route sets by changing the source behind `photoRouteSlugs`/`photoSlugs`, not their consumers.

## Self-Check: PASSED

- FOUND: data/light-table.ts, lib/photos/view-model.ts, lib/photos/routes.ts, lib/__tests__/region-series.test.ts, lib/__tests__/photo-routes.test.ts
- FOUND: 537e409, 6e312fd (ancestors of HEAD)

---
*Phase: 16-new-regions-alps-overview-data*
*Completed: 2026-11-23*
