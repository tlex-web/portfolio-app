---
phase: 15-region-plate-data-model
plan: 09
subsystem: data
tags: [home, ascent, photos-build, jest, playwright, data-09, guard-03]

requires:
  - phase: 15-08
    provides: homeWaypointIds, homePhotos(), homeInput() and homeLowestDemM (1617)
provides:
  - photos:build no longer computes or emits a rail start; data/generated/photos.ts exports only photos
  - the rail start exists once, as homeLowestDemM over the Home list (D-08)
  - every Home-surface test and spec reads the Home list (homeWaypointIds / homePhotos / homeLowestDemM), not the global photo set
affects: [15-11, 15-16, phase-16-new-content]

actuals:
  tokens: 4800
  tasks: 2
  commits: 2
plan_head_before: 2e2541b5e42e404088a67b582328e701085afb5b
plan_head_after: 3fa25e6bde5e9567a60f578f8e36d8eccbf4c902

tech-stack:
  added: []
  patterns:
    - "Home-surface tests name the Home photo local `homeList` (never `photos`, never shadowing homePhotos) and filter it, so a grep for global reads stays meaningful"

key-files:
  created: []
  modified:
    - scripts/photos/build-photo-data.mjs
    - data/generated/photos.ts
    - data/__tests__/photos.test.ts
    - components/home/__tests__/rail.test.tsx
    - lib/__tests__/ascent-summit.test.ts
    - e2e/home-ascent.spec.ts
    - e2e/home-canvas.spec.ts
    - components/home/__tests__/hero.test.tsx
    - components/site/__tests__/SiteFooter.test.tsx
    - e2e/homepage.spec.ts
    - e2e/shell.spec.ts
    - lib/__tests__/ascent-waypoints.test.ts
    - lib/__tests__/poster-frame.test.ts

key-decisions:
  - "15-09: the generator's 'no photo has a DEM elevation' check was removed with the rail start; no other output needed it (PhotoFacts still validates each entry, and homeLowestDemM fails at module load if a Home photo is missing)"
  - "15-09: home-ascent.spec's card-order source (ascending) also moved to homePhotos(); it was a global read the plan's seven-site list missed"

patterns-established:
  - "No Home test or spec reads @/data/generated/photos for a count, filter or order; ascent-waypoints.test keeps one id lookup (photos.find by id), which a new photo cannot move"

requirements-completed: [DATA-09]

coverage:
  - id: D1
    description: "The generated rail start is gone: generator, generated module and every reader; git grep for the old name outside .planning finds nothing; photos:build --check and the G5 cases stay green"
    requirement: DATA-09
    verification:
      - kind: other
        ref: "git grep -n \"lowestDemM\" -- . ':!.planning' (exit 1, no match)"
        status: pass
      - kind: other
        ref: "npm run photos:build -- --check (photos:build: OK)"
        status: pass
      - kind: other
        ref: "npm run guard:selftest (232/232)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The rail-start test is rewritten in place to pin homeLowestDemM as the minimum DEM height of the four Home waypoints (1617)"
    requirement: DATA-09
    verification:
      - kind: unit
        ref: "data/__tests__/photos.test.ts#homeLowestDemM is the minimum DEM height of the Home waypoints (the altimeter rail start, D-08)"
        status: pass
      - kind: unit
        ref: "components/home/__tests__/rail.test.tsx, lib/__tests__/ascent-summit.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "The seven Home-surface sites (hero, SiteFooter, poster-frame, ascent-waypoints, home-ascent, homepage, shell) read the Home list; no global photos.length / photos.filter remains in them"
    requirement: DATA-09
    verification:
      - kind: other
        ref: "git grep -n -e \"[^.]photos\\.length\" -e \"[^.]photos\\.filter\" over the seven files (exit 1, no match)"
        status: pass
      - kind: unit
        ref: "npx jest hero.test SiteFooter.test ascent-waypoints.test poster-frame.test home.test (5 suites, 62 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Home behaves identically in two engines against a production build"
    requirement: DATA-09
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/home-ascent.spec.ts e2e/homepage.spec.ts e2e/shell.spec.ts e2e/home-canvas.spec.ts --project=chromium --project=firefox (230 passed, 0 flaky)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-11-14
status: complete
---

# Phase 15 Plan 09: Rail Start Over the Home List Summary

**The rail start now exists only as `homeLowestDemM` (1617), computed over the Home list. `photos:build` no longer emits a global one, its five readers and the rewritten rail-start test use `homeLowestDemM`, and the seven Home-surface tests and specs count and filter the Home list. Home's four e2e specs pass 230/230 in Chromium and Firefox on a production build.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-11-14T21:32:57Z
- **Completed:** 2026-11-14T21:40:42Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- `scripts/photos/build-photo-data.mjs` no longer computes or emits the rail start. The minimum, its "no DEM elevation" throw, the `export const` line and its JSDoc in the text template, the returned field and the log text are all gone, and the header comment says the rail start lives in `lib/ascent/waypoints.ts` (D-08). The regenerated `data/generated/photos.ts` drops 4 lines; its second header line is now `// Typed photo facts (DATA-02..04, DATA-06).`
- Readers moved to `homeLowestDemM` from `@/lib/ascent/waypoints`: `rail.test.tsx` (first rail label), `ascent-summit.test.ts` (Height gained, and its header comment), `e2e/home-ascent.spec.ts` (top readout) and `e2e/home-canvas.spec.ts` (the `top` stop's metres).
- `data/__tests__/photos.test.ts`: the rail-start test is rewritten in place (GUARD-03) as `homeLowestDemM is the minimum DEM height of the Home waypoints (the altimeter rail start, D-08)`. It maps the four `homeWaypointIds` to their DEM heights, asserts there are 4, then asserts `homeLowestDemM` equals their minimum and 1617.
- Home-surface sites (RESEARCH Pitfall 6): the trail-sign counts in `hero.test.tsx`, `e2e/home-ascent.spec.ts` and `e2e/homepage.spec.ts` use `homeWaypointIds.length`. `ascent-waypoints.test.ts` asserts `w.n === homeWaypointIds.length`. `SiteFooter.test.tsx`, `e2e/shell.spec.ts` and `poster-frame.test.ts` filter `homeList = homePhotos()`. Test names are unchanged.

## Task Commits

1. **Task 1: Remove the generated rail start end to end, from the generator through the generated module to its five readers** - `850144c` (feat)
2. **Task 2: Home-surface tests read the Home list, and Home's e2e runs in two engines** - `3fa25e6` (test)

**Plan metadata:** recorded in the docs commit that adds this SUMMARY

## Files Created/Modified
- `scripts/photos/build-photo-data.mjs` - rail start removed from the build, the text, the return value, the log and the header comment
- `data/generated/photos.ts` - regenerated; exports only `photos`
- `data/__tests__/photos.test.ts` - rail-start test rewritten over the Home list
- `components/home/__tests__/rail.test.tsx` - first label is `formatMetres(homeLowestDemM)`
- `lib/__tests__/ascent-summit.test.ts` - Height gained recomputed from `homeLowestDemM`
- `e2e/home-ascent.spec.ts` - top readout from `homeLowestDemM`; trail-sign count from `homeWaypointIds`; card order from `homePhotos()`
- `e2e/home-canvas.spec.ts` - the `top` stop's metres from `homeLowestDemM`
- `components/home/__tests__/hero.test.tsx` - trail-sign count from `homeWaypointIds`
- `components/site/__tests__/SiteFooter.test.tsx` - footer ticks expected from `homePhotos()`
- `e2e/homepage.spec.ts` - trail-sign count from `homeWaypointIds`
- `e2e/shell.spec.ts` - footer ticks expected from `homePhotos()`
- `lib/__tests__/ascent-waypoints.test.ts` - `n` equals `homeWaypointIds.length`
- `lib/__tests__/poster-frame.test.ts` - anchored pins are the Home photos (header comment says so)

## Decisions Made
- I dropped the generator's "no photo has a DEM elevation" check along with the minimum, because no other output used it. Each entry is still parsed with `PhotoFacts`, and `homeLowestDemM` throws at module load if a Home photo is missing (15-08).
- `ascent-waypoints.test.ts` keeps its `photos` import for one id lookup (`photos.find((p) => p.id === w.id)`). A lookup by id cannot be moved by an extra photo, so it is not a global read in the Pitfall 6 sense.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] home-ascent.spec card order read the global photo set**
- **Found during:** Task 2
- **Issue:** `e2e/home-ascent.spec.ts:29` built `ascending` (the card ids and slugs every card test checks) from `[...photos].sort(...)`. RESEARCH's seven-site list named only line 381 for this file. Once Phase 16 adds a photo, the spec would expect a fifth card, which is the Pitfall 6 failure this plan exists to prevent.
- **Fix:** `const homeList = homePhotos(); const ascending = [...homeList].sort(...)`. Same sort, same four ids today. The `@/data/generated/photos` import is gone from the spec.
- **Files modified:** e2e/home-ascent.spec.ts
- **Verification:** type-check exit 0; home-ascent spec passes in Chromium and Firefox
- **Committed in:** 3fa25e6 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** It closes the same gap the plan targets. No scope creep, no visible change.

## Issues Encountered
- `scripts/photos/build-photo-data.mjs` is CRLF in the working tree (LF in the index). The first scripted edit, typed inline through a heredoc, lost backslashes in the template literals, so its string match failed before anything was written. I made the generator edits with the Edit tool, and the test edits with a scratchpad script that normalises EOL.
- An untracked `.planning/phases/15-region-plate-data-model/15-DOM-VERIFY.md` appeared during execution. This plan did not create it, so it was left alone.

## Verification
- `git grep -n "lowestDemM" -- . ':!.planning'` exits 1 (no match).
- `npm run photos:build -- --check`: `photos:build: OK`. `npm run guard:selftest`: 232/232.
- `npx jest` on rail, photos and ascent-summit tests: 3 suites, 61 tests pass. On hero, SiteFooter, ascent-waypoints, poster-frame and home tests: 5 suites, 62 tests pass. Full `npx jest`: 110 suites, 1867 tests pass, the same count as after 15-08 (no test added or removed).
- Seven-file global-read grep (`[^.]photos\.length` / `[^.]photos\.filter`) exits 1.
- `git grep -n "homeLowestDemM" -- e2e`: 4 lines (two imports, two uses).
- `npm run type-check` exit 0. `npm run lint` exit 0 (`test-count: scan OK`).
- `PW_PROD=1 npx playwright test` on the four Home specs, Chromium and Firefox: 230 passed, 0 failed, 0 flaky. Afterwards port 3000 was free and `public/service-worker.js` was restored (`git diff --quiet HEAD -- public/service-worker.js` exit 0).

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness
- DATA-09 is complete. Phase 16 can add photos without moving any Home count, order, tick or metre value in tests.
- 15-16's full Jest run with `guard:tests` covers the GUARD-03 count. This plan rewrote tests in place and added or removed none.

## Self-Check: PASSED
- FOUND: scripts/photos/build-photo-data.mjs, data/generated/photos.ts, data/__tests__/photos.test.ts, e2e/home-ascent.spec.ts, components/site/__tests__/SiteFooter.test.tsx
- FOUND: 850144c, 3fa25e6 (both ancestors of HEAD)

---
*Phase: 15-region-plate-data-model*
*Completed: 2026-11-14*
