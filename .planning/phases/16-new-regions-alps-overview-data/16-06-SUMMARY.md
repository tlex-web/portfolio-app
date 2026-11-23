---
phase: 16-new-regions-alps-overview-data
plan: 06
subsystem: photos-display
tags: [photos, formatting, view-model, precision, aerial, jest]

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-01 required precision ('4dp' | '3dp' | '2dp') and kind ('ground' | 'aerial') on every generated photo and position; 16-03 light-table pin in lib/photos/view-model.ts"
provides:
  - "formatCoordinates(position, decimals: 2 | 3 | 4 = 4) in lib/home-format.ts; fixedDecimals typed 2 | 3 | 4 with its half-up rule unchanged"
  - "formatAltitude({ m, approximate, aerial }) in lib/photo-format.ts (import-free): 'ground' + U+00A0 prefix for aerial, ' approx.' suffix when approximate"
  - "Required precision on the view-model's PositionInput (no fallback); the strip's Position row prints at DECIMALS[position.precision]"
  - "PhotoInput.kind and Waypoint.aerial in lib/ascent/waypoints.ts; order still height then id"
  - "StripSource.aerial (optional, absent = ground); altitudeLabel and the strip Altitude row read formatAltitude"
  - "Home guard: data/__tests__/home.test.ts fails if any Home waypoint photo is aerial"
affects: [16-07, 16-14, 16-17, 16-18, 17-routes-seo, 18-immersive-layout]

actuals:
  tokens: 6300
  tasks: 2
  commits: 2
plan_head_before: 4f6d0f7b7eaa120c9cbf1623c7d0f4e0523b8e0e
plan_head_after: b098fe01e88e60d8b7ffd4b773ef6f9a65ff523b

tech-stack:
  added: []
  patterns:
    - "Display precision comes from the stored position's precision through one map (DECIMALS in view-model.ts), never a default at the call site"
    - "Every view-model height goes through formatAltitude, so the ground and approx. wording cannot drift between the label, the strip and the hotspot callouts"

key-files:
  created: []
  modified:
    - lib/home-format.ts
    - lib/photo-format.ts
    - lib/photos/view-model.ts
    - lib/ascent/waypoints.ts
    - lib/__tests__/home-format.test.ts
    - lib/__tests__/photos-view-model.test.ts
    - lib/__tests__/ascent-waypoints.test.ts
    - components/photos/__tests__/strip.test.tsx
    - components/photos/__tests__/map.test.tsx
    - data/__tests__/home.test.ts

key-decisions:
  - "The strip's Altitude row says ' approx.' only for a coarse (3dp/2dp) position, whose height was itself rounded at extraction (D-03); the hand-placed 4dp film scan keeps its approximation on the Position line only, so its row stays '2,760 m' (D-25) while a coarse photo's row equals its altitude label"
  - "'ground' is joined to the height with U+00A0 (the formatters' no-wrap rule for a value's parts), so 'ground' never wraps away from its number"
  - "StripSource.aerial is optional (absent = ground) so the existing stripFields call sites compile unchanged; buildPhotoViews always passes the waypoint's aerial"
  - "waypointKickerParts and Home components keep their inline labels (planner decision); Home is held to ground photos by a test instead"

patterns-established:
  - "Synthetic coarse or aerial photos in tests: committed facts with kind, position (synthetic lat/lon, never a photo's own) and elevation replaced, passed through buildPhotoViews"

requirements-completed: [DATA-14]   # copied from the plan; REQUIREMENTS.md ticking is subject to the shared-ID gate (16-08, 16-14, 16-17, 16-18 also declare DATA-14)

coverage:
  - id: D1
    description: "A coordinate prints at its own precision (3 or 2 decimals, never padded to 4) with the half-up rule; the default prints today's 4dp strings"
    requirement: DATA-14
    verification:
      - kind: unit
        ref: "lib/__tests__/home-format.test.ts#formats a 3dp and a 2dp position at their own precision"
        status: pass
      - kind: unit
        ref: "lib/__tests__/home-format.test.ts#rounds half up at a half step for 3 and 2 decimals, like the 4dp rule (09 IN-04)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/home-format.test.ts#prints the waypoint position %o unchanged"
        status: pass
    human_judgment: false
  - id: D2
    description: "A synthetic 3dp approximate photo in the strip: the approximate sign, three decimals per half and the 100 m (approx.) note, through the existing markup"
    requirement: DATA-14
    verification:
      - kind: unit
        ref: "components/photos/__tests__/strip.test.tsx#prints a 3dp position with the approximate sign, three decimals per half and the 100 m note"
        status: pass
    human_judgment: false
  - id: D3
    description: "Aerial photos read as ground height in the altitude label and the strip Altitude row (with approx. when coarse) and sort by that height"
    requirement: DATA-14
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-view-model.test.ts#labels an aerial photo's height as ground"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photos-view-model.test.ts#labels a coarse aerial photo ground and approx. in the label and the strip Altitude row alike"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photos-view-model.test.ts#sorts an aerial photo by its ground height like any other photo"
        status: pass
      - kind: unit
        ref: "lib/__tests__/ascent-waypoints.test.ts#carries aerial from the photo's kind and sorts an aerial photo by its ground height (16 D-04)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A synthetic coarse photo's map dot renders dashed and its link name ends in approx."
    requirement: DATA-14
    verification:
      - kind: unit
        ref: "components/photos/__tests__/map.test.tsx#draws a synthetic coarse photo's dot dashed and names it approx. (16 D-01)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Home is guarded to ground photos"
    requirement: DATA-14
    verification:
      - kind: unit
        ref: "data/__tests__/home.test.ts#every Home waypoint is a ground photo (16 D-04)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The four current photos' strip rows, altitude labels and coordinates are byte-identical; no component file changed; client JS unchanged"
    requirement: DATA-14
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-view-model.test.ts#keeps every current photo's altitude label and Altitude row text (D-25)"
        status: pass
      - kind: unit
        ref: "npx jest (full suite: 114 suites, 1944 tests passed); the pre-existing strip expectations in photos-view-model.test.ts and strip.test.tsx pass without edits"
        status: pass
      - kind: other
        ref: "git diff --quiet HEAD -- components/home components/photos/MapSheet.tsx components/photos/ExifStrip.tsx (exit 0 before the Task 2 commit)"
        status: pass
      - kind: other
        ref: "rm -rf .next/static && npm run build, 15-01 byte-sum: 1,851,814 B in 24 files (budget 1,855,668 B)"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-11-23
status: complete
---

# Phase 16 Plan 06: Precision-Aware Coordinates and Ground Heights Summary

**Coordinates now print at their position's own precision (4, 3 or 2 decimals, never padded), and aerial photos read "ground 2,410 m" through one shared `formatAltitude`. Coarse positions still use the existing ≈ sign, radius note and dashed dot. The four current photos render byte-identically.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-11-23T01:36:03Z
- **Completed:** 2026-11-23T01:45:05Z
- **Tasks:** 2 (1 tracer, 1 auto)
- **Files modified:** 10

## Accomplishments

- `formatCoordinates(position, decimals = 4)`: 3 and 2 decimals use the same half-up rule as 4 (string exponent shift, 09 IN-04). The private `fourDecimals` helper is gone and `fixedDecimals` is typed `2 | 3 | 4`. `formatLatLon` keeps its signature.
- The view-model's `PositionInput` has a required `precision: '4dp' | '3dp' | '2dp'` with no fallback. `stripFields` passes `DECIMALS[position.precision]`. Type-check passed with no fixture edits, because every position that reaches it is spread from `data/generated/photos.ts`.
- `formatAltitude({ m, approximate, aerial })` lives in `lib/photo-format.ts`, which is still import-free. `altitudeLabel` (and so the map plates, grid, carousel, OG text, metadata and photo-ref hotspot callouts) and the strip's Altitude row now use it.
- `Waypoint.aerial` comes from `PhotoInput.kind`, and the order is still height then id. An aerial photo sorts by its ground height like any other photo.
- Home guard: `data/__tests__/home.test.ts` fails if a Home waypoint photo is aerial, or if `buildWaypoints()` returns one with `aerial: true`.
- Client JS: 1,851,814 B in 24 files, the same as after 16-05 and inside the 1,855,668 B budget.

## Task Commits

1. **Task 1 (tracer): a 3dp photo through the strip at its own precision.** `35474c1` (feat)
2. **Task 2: aerial heights read as ground, a coarse dot is dashed, Home stays ground-only.** `b098fe0` (feat)

The tracer gate re-ran its automated verify (end-of-phase mode, automated-only) and it passed before Task 2 started.

## Files Created/Modified

- `lib/home-format.ts`: `formatCoordinates` takes a decimals argument; `fixedDecimals` is typed 2 | 3 | 4.
- `lib/photo-format.ts`: `formatAltitude`.
- `lib/photos/view-model.ts`: required `PositionInput.precision`, the `DECIMALS` map, optional `StripSource.aerial`, and `formatAltitude` in `altitudeLabel` and the Altitude row.
- `lib/ascent/waypoints.ts`: `PhotoInput.kind`, `Waypoint.aerial`.
- `lib/__tests__/home-format.test.ts`: 3dp/2dp shape, padding and half-step cases, plus default === 4 for the four waypoint strings.
- `components/photos/__tests__/strip.test.tsx`: the synthetic 3dp strip case.
- `lib/__tests__/photos-view-model.test.ts`: the aerial 4dp, coarse aerial 2dp, aerial sort and current-text pin cases.
- `lib/__tests__/ascent-waypoints.test.ts`: the `synthetic()` fixture gains `kind` (ground by default), plus the aerial-flag and ordering case.
- `components/photos/__tests__/map.test.tsx`: the synthetic coarse dot is drawn dashed.
- `data/__tests__/home.test.ts`: every Home waypoint is a ground photo.

## Decisions Made

- **Altitude row approx. rule:** the strip's Altitude row carries " approx." only for a coarse (3dp/2dp) position, because that height was itself rounded to 10 m or 50 m at extraction (D-03). The plan asks for both a coarse aerial row that matches its altitude label and the film scan's row staying "2,760 m". Driving the row from `approximate` would have changed the film scan, so precision drives it.
- **'ground' + U+00A0:** this follows the formatters' rule that a value's parts never wrap apart.
- **`StripSource.aerial` optional:** existing `stripFields` callers compile unchanged. The only real producer (`buildPhotoViews`) always passes it.

## Deviations from Plan

### Test adjusted within the plan

**1. Task 1's new strip case updated in Task 2**
- **Found during:** Task 2
- **Issue:** Task 2's coarse Altitude row rule makes the synthetic 3dp photo's row read "1,617 m approx.". Task 1's new case had expected "1,617 m".
- **Fix:** updated that one expectation, which was this plan's own new test. No pre-existing expectation changed.
- **Files modified:** components/photos/__tests__/strip.test.tsx
- **Commit:** b098fe0

**Total deviations:** 0 auto-fixed rule deviations; 1 in-plan test adjustment. **Impact:** none on current output.

Acceptance note: no pre-existing expectation in `lib/__tests__/photos-view-model.test.ts` or `components/photos/__tests__/strip.test.tsx` was edited. The four current photos' strings pass unchanged.

## Verification

- Task 1 verify: `npx jest lib/__tests__/home-format.test.ts components/photos/__tests__/strip.test.tsx lib/__tests__/photos-view-model.test.ts`: 81 passed. `grep -cF "2 | 3 | 4" lib/home-format.ts` gives 2, and `grep -cF "precision: '4dp' | '3dp' | '2dp'" lib/photos/view-model.ts` gives 1.
- Task 2 verify: the five listed paths plus strip and home-format: 13 suites, 186 passed. `grep -c formatAltitude` gives 1 for photo-format.ts and 3 for view-model.ts. `npm run lint` exits 0, `npm run type-check` exits 0, and the components diff check exits 0.
- Full suite: 114 suites, 1944 tests passed.
- Build plus byte-sum: 1,851,814 B. `public/service-worker.js` was restored afterwards and no server was left running.

## Privacy

No real photo coordinate appears in a test, commit message or this summary. The new tests use synthetic literals (12.345 / 5.678, 12.34 / 5.67) and the WGS84 of the LV95 origin, a synthetic plate point.

## Known Stubs

None.

## Next Phase Readiness

Ready for 16-07 (same wave; its MapSheet rewiring is order-independent with this plan's map test) and for 16-08, which resumes at its Tim checkpoint. Phases 17 and 18 can read `formatAltitude` and the precision-aware strip directly.

## Self-Check: PASSED

- All 10 modified files exist on disk.
- Commits 35474c1 and b098fe0 are ancestors of HEAD; `check evaluation-scope --plan 16-06 --commits-only` resolves both.
