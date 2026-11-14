---
phase: 15-region-plate-data-model
plan: 08
subsystem: data
tags: [home, ascent, waypoints, jest, isolateModules, data-09]

requires:
  - phase: 15-06
    provides: region and country on every generated photo; regions.json with zermatt -> matterhorn
  - phase: 15-07
    provides: map-driven photo ids (photo scripts settled)
provides:
  - homeWaypointIds in data/home.ts (four ids, slug comments, typed against PhotoId)
  - lib/ascent/home-photos.ts homePhotos(), the client-light Home membership filter
  - homeInput() as buildWaypoints' default input, and homeLowestDemM (1617) in lib/ascent/waypoints.ts
  - SiteFooter ticks, TrailSigns count and summit Height gained read the Home list
  - success-criterion-1 test (lib/__tests__/home-waypoints.test.tsx) and D-07 strict-list test (data/__tests__/home.test.ts)
affects: [15-09, phase-16-new-content, phase-18-immersive-layout]

actuals:
  tokens: 4800
  tasks: 2
  commits: 2
plan_head_before: f0e765668cbb65059c9da684605c73cdd27ffcbc
plan_head_after: 6a0ed823cc0c25b9022f2572f7cf4f198b16f44b

tech-stack:
  added: []
  patterns:
    - "Home membership lives in one place (homePhotos); buildWaypoints filters nothing, only its default input changed"
    - "Injected-data component tests: jest.isolateModulesAsync + jest.doMock of the generated module, components rendered with react-dom/server from the same isolated registry"

key-files:
  created:
    - lib/ascent/home-photos.ts
    - lib/__tests__/home-waypoints.test.tsx
    - data/__tests__/home.test.ts
  modified:
    - data/home.ts
    - lib/ascent/waypoints.ts
    - lib/ascent/summit.ts
    - components/site/SiteFooter.tsx
    - components/home/TrailSigns.tsx

key-decisions:
  - "15-08: the success-criterion-1 test renders SiteFooter, TrailSigns and AscentHero with react-dom/server from the isolated registry (the hero.test.tsx precedent), not RTL render, so the components and React share one module copy"
  - "15-08: homePhotos throws on a missing listed id before filtering; homeLowestDemM is buildWaypoints()[0].altitudeM at module load, so a missing Home photo fails tests and the build (T-15-12 accepted)"

patterns-established:
  - "Home list: data/home.ts homeWaypointIds -> lib/ascent/home-photos.ts homePhotos -> homeInput/buildWaypoints and the footer"

requirements-completed: [DATA-09]

coverage:
  - id: D1
    description: "Home reads an explicit four-id list (homeWaypointIds); buildWaypoints defaults to homeInput() and still orders by DEM height"
    requirement: DATA-09
    verification:
      - kind: unit
        ref: "data/__tests__/home.test.ts#homeWaypointIds is strict (DATA-09, D-07)"
        status: pass
      - kind: unit
        ref: "data/__tests__/home.test.ts#orders the ascent by DEM height, never by the list order (ordering edge)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/ascent-waypoints.test.ts (synthetic-input tests unchanged)"
        status: pass
    human_judgment: false
  - id: D2
    description: "An extra photo in another region, or an unlisted Zermatt photo at 1,617 m, leaves ascent ids and order, homeLowestDemM 1617, 4 footer ticks, the 4 waypoints trail sign and the first rail label unchanged"
    requirement: DATA-09
    verification:
      - kind: unit
        ref: "lib/__tests__/home-waypoints.test.tsx#leaves Home unchanged after adding a photo in another region, lower than every waypoint"
        status: pass
      - kind: unit
        ref: "lib/__tests__/home-waypoints.test.tsx#leaves Home unchanged after adding an unlisted Zermatt photo at exactly the lowest waypoint height"
        status: pass
    human_judgment: false
  - id: D3
    description: "The footer imports homePhotos from a module that pulls in neither editorial copy nor the image manifest"
    requirement: DATA-09
    verification:
      - kind: other
        ref: "grep acceptance: SiteFooter imports @/lib/ascent/home-photos; home-photos.ts imports no editorial, image-manifest or waypoints module"
        status: pass
    human_judgment: false
  - id: D4
    description: "Pixel-neutral: footer tick markup, trail sign and Height gained render identically to before"
    requirement: DATA-09
    verification:
      - kind: unit
        ref: "components/site/__tests__/SiteFooter.test.tsx, components/home/__tests__/hero.test.tsx, components/home/__tests__/rail.test.tsx, lib/__tests__/ascent-summit.test.ts (full Jest 1858/1858 before Task 2)"
        status: pass
    human_judgment: true
    rationale: "Visual baselines and the Home e2e specs were not run in this plan; 15-09 runs the Home e2e and the phase's visual check confirms pixel neutrality"

duration: 7min
completed: 2026-11-14
status: complete
---

# Phase 15 Plan 08: Home Waypoint List Summary

**Home reads an explicit four-id list (`homeWaypointIds`) through a client-light `homePhotos()` filter: it is `buildWaypoints`' default input, the source of `homeLowestDemM` = 1617, the footer ticks and the trail sign count. An injected-photo Jest test proves that a photo added in another region, or an unlisted Zermatt photo, changes none of them.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-11-14T21:23:02Z
- **Completed:** 2026-11-14T21:30:15Z
- **Tasks:** 2
- **Files modified:** 8 (3 created, 5 modified)

## Accomplishments
- `data/home.ts` exports `homeWaypointIds` (img-0605, img-0629, img-0662, r004-011, each with its slug comment), typed `as const satisfies readonly PhotoId[]`, so tsc rejects an unknown id (D-06, D-07).
- New `lib/ascent/home-photos.ts`: `homePhotos(ids = homeWaypointIds)` returns the generated photos on the list, in generated order, and throws a `RangeError` naming a missing id. It imports only the generated photos and `data/home`, so the `global-error` client chunk that renders the footer gains no editorial copy and no image manifest.
- `lib/ascent/waypoints.ts`: `homeInput(ids)` builds `{ photos: homePhotos(ids), editorial, imageManifest }` and is the new default of `buildWaypoints`, which still filters nothing (the synthetic-id tests pass unchanged). `homeLowestDemM = buildWaypoints()[0].altitudeM` (1617) sits at the end of the module (D-08).
- Consumers (D-09): `summitPlaque`'s Height gained reads `homeLowestDemM`; `SiteFooter` maps `homePhotos()` with identical tick markup; `TrailSigns` counts `homeWaypointIds.length` (still "4 waypoints"). The cards, poster pins, 3D pins and rail ticks already go through `buildWaypoints()`.
- Success criterion 1 is proven by `lib/__tests__/home-waypoints.test.tsx`: two `jest.isolateModulesAsync` variants append `img-9001`, first in region `elsewhere` at 900 m, then in `zermatt`, unlisted, at exactly 1,617 m. Each asserts the same ascent ids and order, `homeLowestDemM` 1617, 4 `[data-tick]`, the "4 waypoints" sign and the first rail label `formatMetres(1617)`. A control test checks the real data. A mutation check (letting `homePhotos` admit `img-9001`) failed both variants, so the test is not vacuous.
- `data/__tests__/home.test.ts` pins D-07: exactly four unique ids, equal as a set to the four waypoints, each a photo in region `zermatt`, and zermatt on plate `matterhorn`. It also covers the empty edge (`homeInput(['img-0605', 'img-9999'])` throws a RangeError naming img-9999) and the ordering edge (a reversed list gives the same ascent order).

## Task Commits

1. **Task 1: Home list to homePhotos and buildWaypoints to footer ticks, trail sign and Height gained, with the success-criterion-1 test** - `48943cd` (feat)
2. **Task 2: The D-07 strict-list test, with the empty and ordering edges** - `6a0ed82` (test)

**Plan metadata:** recorded in the docs commit that adds this SUMMARY

## Files Created/Modified
- `data/home.ts` - adds `homeWaypointIds`
- `lib/ascent/home-photos.ts` - new; `homePhotos()`, the Home membership filter
- `lib/ascent/waypoints.ts` - `homeInput()`, the `buildWaypoints` default changed to it, and `homeLowestDemM`
- `lib/ascent/summit.ts` - Height gained reads `homeLowestDemM`
- `components/site/SiteFooter.tsx` - ticks map `homePhotos()`; generated-photos import dropped
- `components/home/TrailSigns.tsx` - count reads `homeWaypointIds.length`; generated-photos import dropped
- `lib/__tests__/home-waypoints.test.tsx` - new; success-criterion-1 test
- `data/__tests__/home.test.ts` - new; D-07 strict-list test

## Decisions Made
- The injected-photo test renders the components with `react-dom/server` and `react` imported from the same isolated registry as the mocked data (the existing `hero.test.tsx` isolateModules precedent), not RTL's `render`. RTL's top-level copy would render components that hold a second React copy. Assertions read the static markup in a detached host: `[data-tick]` count, sign text and aria-label, and `[data-ascent-rail] [data-rail-tick] [data-tick-label]`.
- `homePhotos` checks every listed id exists before filtering, so a typo throws a named RangeError instead of returning three photos.

## Deviations from Plan

None. The plan was executed as written. One note: the plan's wording is `render(<SiteFooter />)` and `render(<TrailSigns />)`; the test uses static rendering from the isolated registry instead (see Decisions). It asserts the same things.

## Issues Encountered
- The first test draft used `it.each`, which gave one `isolateModules` call and failed the "2 or more, one per variant" acceptance grep. I split it into two explicit tests, one per variant, sharing an `expectHomeUnchanged` helper.

## Verification
- `npx jest lib/__tests__/home-waypoints.test.tsx lib/__tests__/ascent-waypoints.test.ts lib/__tests__/ascent-summit.test.ts components/site/__tests__/SiteFooter.test.tsx components/home/__tests__/hero.test.tsx`: 5 suites, 54 tests pass.
- `npx jest data/__tests__/home.test.ts lib/__tests__/home-waypoints.test.tsx`: 2 suites, 12 tests pass.
- Full `npx jest` after Task 1: 109 suites, 1858 tests pass.
- `npm run type-check` exit 0 and `npm run lint` exit 0 (test-count scan OK) after each task.
- Acceptance greps: TrailSigns and SiteFooter import nothing from `@/data/generated/photos` (0 matches each). SiteFooter imports `@/lib/ascent/home-photos` (1 match). `home-photos.ts` imports no editorial, image-manifest or waypoints module (exit 0). summit.ts has 3 `homeLowestDemM` matches. The test has 2 `isolateModules` matches. data/home.ts has 1 `homeWaypointIds` match.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness
- 15-09 can remove the generated `lowestDemM` (still exported by `data/generated/photos.ts`). It then moves its remaining readers (rail.test, photos.test, ascent-summit.test, e2e home-ascent and home-canvas) to `homeLowestDemM`, and moves the tests that read the global photo set for Home surfaces (hero.test, SiteFooter.test, ascent-waypoints `n === photos.length`, poster-frame) to the Home list.
- The phase-wide client-chunk budget (15-11, 15-16) covers the footer's new import of `data/home.ts`, whose only runtime import is `data/site`, which the footer already loaded.

## Self-Check: PASSED
- FOUND: data/home.ts, lib/ascent/home-photos.ts, lib/ascent/waypoints.ts, lib/__tests__/home-waypoints.test.tsx, data/__tests__/home.test.ts
- FOUND: 48943cd, 6a0ed82 (both ancestors of HEAD)

---
*Phase: 15-region-plate-data-model*
*Completed: 2026-11-14*
