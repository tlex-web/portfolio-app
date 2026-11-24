---
phase: 17-region-routes-seo-structured-data
plan: 11
subsystem: ui
tags: [offline, saved-pages, cache-storage, regions, nextjs, jest, playwright]

requires:
  - phase: 17-01
    provides: lib/regions.ts (regions, regionPhotoViews) and the 'Region' saved-pages label decision
  - phase: 17-05
    provides: publishedViews / publishedSlugs (every photo published)
  - phase: 17-16
    provides: the client-graph guard that keeps data/regions/regions.json out of client entries
provides:
  - "SavedPageSource.regions ({ id, name }[]) and the 'Region' row label in lib/saved-pages.ts"
  - "/offline builds its catalog on the server: nav, regions, every published photo by region, projects"
  - "Unit, island and e2e rows for a cached region page (trailing slash collapses, query, bare segment and unknown id drop)"
affects: [17-verification, offline, sitemap-order, client-js-budget]

actuals:
  tokens: 5800     # chars/4 over the realized diff (git diff aaa0c98..HEAD, 23,258 chars)
  tasks: 2
  commits: 3       # MEASURED: git rev-list --count aaa0c98..HEAD at SUMMARY write
plan_head_before: aaa0c98ea3f83e8da8af21407107d6a6a8ec8466
plan_head_after: 41f2691adfe833f22ef134e990a1a1313f948ab3

tech-stack:
  added: []
  patterns:
    - "Region names reach the client island only as catalog props built by the server page; lib/saved-pages.ts imports regionHref from lib/photos/routes, never lib/regions"
    - "The saved-pages catalog follows the sitemap's order: nav, regions in registry order, photos grouped by region (ascending height), projects"

key-files:
  created: []
  modified:
    - lib/saved-pages.ts
    - app/(site)/offline/page.tsx
    - lib/__tests__/saved-pages.test.ts
    - components/site/__tests__/SavedPages.test.tsx
    - e2e/offline.spec.ts

key-decisions:
  - "SavedPageSource.regions is required, not optional: every caller states its regions, and a catalog with regions [] stays valid (tested)"
  - "The offline catalog's photos are regions.flatMap(regionPhotoViews), the sitemap's order; the test pins that set to publishedSlugs so no published photo is missing"
  - "The seeded e2e test is rewritten in place to three rows (nav, region, photo) instead of a sibling test; the region page is seeded by its trailing-slash URL plus a query variant and an unknown region that must drop"

patterns-established:
  - "Saved-pages region rows: href regionHref(id), title the registry name, label 'Region', between nav and photo rows"

requirements-completed: [EDGE-03]

coverage:
  - id: D1
    description: "The /offline catalog lists nav, every region ('Region', regionHref path, registry name), every published photo by region ('Photograph'), then projects"
    requirement: EDGE-03
    verification:
      - kind: unit
        ref: "lib/__tests__/saved-pages.test.ts#savedPageCatalog (D-12, D-22)"
        status: pass
    human_judgment: false
  - id: D2
    description: "savedPageRows over region pages: trailing slash collapses, a query variant alone, /photos/regions and an unknown id make no row; empty cache gives no row; catalog order whatever the key order"
    requirement: EDGE-03
    verification:
      - kind: unit
        ref: "lib/__tests__/saved-pages.test.ts#savedPageRows over region pages (D-22, EDGE-03)"
        status: pass
    human_judgment: false
  - id: D3
    description: "lib/saved-pages.ts and the SavedPages island import no region data; region names reach the client only through the catalog prop, and no client chunk holds registry text"
    requirement: EDGE-03
    verification:
      - kind: unit
        ref: "lib/__tests__/saved-pages.test.ts#the saved-pages modules import no region data (D-22, D-06)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/client-graph.test.ts"
        status: pass
      - kind: other
        ref: "npm run build; grep -rl Steinernen .next/static/chunks (no match)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A visitor offline sees a cached region page in the SavedPages list, labelled 'Region', named from data, at 48 px, in nav, region, photo order with no raw URL"
    requirement: EDGE-03
    verification:
      - kind: unit
        ref: "components/site/__tests__/SavedPages.test.tsx#lists a cached region page between the nav and photo rows"
        status: pass
      - kind: e2e
        ref: "e2e/offline.spec.ts#seeded Cache Storage: exactly the three cached pages (chromium, firefox, PW_PROD)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Client JS stays within budget: 1,851,837 B (phase base 1,851,749 B, cap 1,855,781 B)"
    verification:
      - kind: other
        ref: "rm -rf .next/static && npm run build; sum of .next/static/chunks/*.js"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-11-24
status: complete
---

# Phase 17 Plan 11: Offline saved pages know the region pages Summary

**The /offline saved-pages catalog now lists every region page (registry name, 'Region' label, regionHref path) and every published photo page grouped by region, built on the server so the client island receives only titles and paths**

## Performance

- **Duration:** about 5 min of recorded wall time (2026-11-24T00:28:10Z to 00:33:14Z, after context loading)
- **Started:** 2026-11-24T00:28:10Z
- **Completed:** 2026-11-24T00:33:14Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `SavedPageSource.regions` and the `'Region'` label: region rows sit after the nav rows and before the photos, matching the sitemap's order (D-22).
- `/offline` passes `regions.map(({ id, name }) => ({ id, name }))` and `regions.flatMap((r) => regionPhotoViews(r.id))` from `lib/regions.ts`. The catalog now holds every published photo, not only the four light-table photos.
- Unit, island and e2e coverage for a cached region page. A cached `/photos/regions/<id>/` collapses into its row. A query variant alone, `/photos/regions` and an unknown id make no row. The rows keep catalog order.
- Client JS is 1,851,837 B, +88 B over the phase base of 1,851,749 B and under the 1,855,781 B cap. No client chunk holds registry text.

## Task Commits

1. **Task 1 RED: region rows and every published photo in the catalog (tests)** - `5b68e70` (test)
2. **Task 1 GREEN: region rows and every published photo in the offline catalog** - `47ad58f` (feat)
3. **Task 2: a cached region page in the SavedPages island and the offline e2e** - `41f2691` (test)

## Files Created/Modified

- `lib/saved-pages.ts` - `regions` in `SavedPageSource`, the `'Region'` label, region rows via `regionHref`, an updated header doc (order, labels, no region import)
- `app/(site)/offline/page.tsx` - catalog from `regions` and `regionPhotoViews`, computed on the server
- `lib/__tests__/saved-pages.test.ts` - rewritten to the D-22 behaviour list, plus a source guard that `lib/saved-pages.ts` and `SavedPages.tsx` import no region data
- `components/site/__tests__/SavedPages.test.tsx` - catalog built as the offline page builds it, plus a region-row case
- `e2e/offline.spec.ts` - the seeded cache adds the seeded photo's region page (trailing slash), a query variant and an unknown region; three rows expected

## Decisions Made

- `regions` is a required field of `SavedPageSource`, so every caller has to state its regions. The `regions: []` case is tested and stays valid.
- The catalog test pins the photo rows to `publishedSlugs` as a set, so the server-side source cannot drop a published photo.
- The existing seeded e2e test is rewritten to three rows. A sibling test would duplicate the seeding and the art-position check.

## TDD Gate Compliance

- **Task 1 RED (`5b68e70`):** `npx jest lib/__tests__/saved-pages.test.ts` exited 1, with 5 failed and 16 passed. The failures were the catalog order and title `toEqual`, `'Region'` rows of length 0 where 3 were expected, and three region `savedPageRows` cases returning `[]` where `{ href: '/photos/regions/ortler', title: 'Ortler', label: 'Region' }` was expected. Each is an assertion on the planned behaviour, with no syntax, collection or import fault. Evidence is in `.gsd/tdd-evidence/17-11/red-t1.txt` (git-ignored). Jest's default reporter is not a format the classifier supports, so this verdict comes from inspecting the failures, as in 17-07.
- **Task 1 GREEN (`47ad58f`):** saved-pages, client-graph and photo-routes passed 99/99. With the SavedPages suite added they passed 105/105, and `npm run type-check` exited 0.
- Task 2 is `type="auto"` (not TDD). Its island case and e2e row passed on their first run against the Task 1 implementation.

## Verification

- `npx jest lib/__tests__/saved-pages.test.ts components/site/__tests__/SavedPages.test.tsx lib/__tests__/client-graph.test.ts lib/__tests__/photo-routes.test.ts`: 4 suites, 106/106 passed
- `npm run type-check`: exit 0
- `PW_PROD=1 npx playwright test e2e/offline.spec.ts --project=chromium --project=firefox`: 12 passed, none flaky. `public/service-worker.js` was restored afterwards.
- `rm -rf .next/static && npm run build`: build exit 0, chunks total 1,851,837 B in 24 files (budget OK), `grep -rl Steinernen .next/static/chunks` found nothing, and `Saalfelden` is also absent from the chunks
- `node scripts/ci/check-snapshot-commit.mjs --none`: OK (0 changed) after each of the 3 commits
- Acceptance greps: `'Region'` appears 4 times in `lib/saved-pages.ts`, region-data imports in it number 0, `regionPhotoViews` appears 2 times in the offline page, and `/photos/regions/` appears 2 times in `e2e/offline.spec.ts`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The SavedPages test's catalog call failed type-check once `regions` became required**
- **Found during:** Task 1 (GREEN verify, `npm run type-check`)
- **Issue:** `components/site/__tests__/SavedPages.test.tsx` called `savedPageCatalog` without `regions` (TS2345).
- **Fix:** That test now builds its catalog exactly as `/offline` does, with region ids and names and every published photo. It finds the seeded photo in that list.
- **Files modified:** components/site/__tests__/SavedPages.test.tsx
- **Verification:** type-check exit 0, SavedPages suite green
- **Committed in:** `47ad58f` (Task 1 GREEN). Task 2 then added the region case to the same file.

**2. [Formatting] Reverted Prettier's reflow of unrelated lines in e2e/offline.spec.ts**
- **Found during:** Task 2
- **Issue:** Before this plan, `e2e/offline.spec.ts` was not formatted to the 100-column Prettier config. Running Prettier reflowed five lines unrelated to this plan.
- **Fix:** Those five lines are back to their original form, so the diff touches only the region rows.
- **Committed in:** `41f2691`

---

**Total deviations:** 2 (1 blocking auto-fix, 1 diff hygiene)
**Impact on plan:** No scope change.

## Issues Encountered

- The RED commit first went in before Prettier had formatted the new test. Prettier was then run and the commit amended (unpushed) to `5b68e70`.

## Known Stubs

None.

## Deferred / Noted

- `data/light-table.ts`'s header comment still says the sitemap, proxy route set and saved-pages catalog "stay at these four until Phase 18". That has been stale since 17-05 (routes) and is now stale for the saved-pages catalog too. It is outside this plan's files and left for the phase's doc sweep.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- Phase 17 success criterion 5 (the offline list includes region pages and the new photo pages) is met. The remaining Phase 17 plans are 17-10 and 17-12 to 17-15.

## Self-Check: PASSED

All five modified files exist. Commits 5b68e70, 47ad58f and 41f2691 are ancestors of HEAD. The TDD pair test(17-11) 5b68e70 then feat(17-11) 47ad58f is present. `git rev-list --count aaa0c98..HEAD` = 3.

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-24*
