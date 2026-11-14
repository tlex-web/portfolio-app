---
phase: 15-region-plate-data-model
plan: 06
subsystem: data
tags: [zod, photo-pipeline, regions, plates, selftest, jest]

requires:
  - phase: 15-04
    provides: "data/terrain/plates.json and the Plates schema (the plate registry photos:build now reads)"
  - phase: 15-05
    provides: "N-plate terrain builder; matterhorn stays the home plate on data/terrain/source"
provides:
  - "data/photos/photo-map.json: one record per photo (file, region, country), the file -> id map and membership record (D-01, D-02)"
  - "data/regions/regions.json + data/schemas/region.ts (RegionId, Region, Regions): zermatt on plate matterhorn (D-03)"
  - "photo.ts: exported PhotoId, closed Country enum, PhotoMapEntry, PhotoMap; PhotoFacts gains region and country"
  - "photos:build: sidecar/map bijection, region and plate membership checks, per-plate DEM sampling cached by plate id (D-04)"
  - "data/generated/photos.ts carries region and country per photo (D-05)"
  - "Seven photos:build G5 selftest cases and data/__tests__/photo-map.test.ts; closed-sidecar test in exif-sidecar.test.ts"
affects: [15-07, 15-08, 15-09, 15-11, 16, 18]

actuals:
  tokens: 9641
  tasks: 2
  commits: 2
plan_head_before: 76ac105926084da855009498e84e29d2d0b77b88
plan_head_after: 840471067ee2fbcbf9198d92ad112ac8f657aa38

tech-stack:
  added: []
  patterns:
    - "Membership through committed registries: photo -> photoMap[id].region -> regions[region].plate -> plates[plate].source"
    - "Selftest fixture edits keep sorted order (addMapRecord / addRegion) and assert noSortRefine, so each case fails on the rule it names"

key-files:
  created:
    - data/schemas/region.ts
    - data/regions/regions.json
    - data/photos/photo-map.json
    - data/__tests__/photo-map.test.ts
  modified:
    - data/schemas/photo.ts
    - scripts/photos/build-photo-data.mjs
    - data/generated/photos.ts
    - scripts/guards/selftest.mjs
    - data/__tests__/exif-sidecar.test.ts

key-decisions:
  - "Country is a closed z.enum of the Alpine Convention states (AT, CH, DE, FR, IT, LI, MC, SI), copied verbatim from each photo-map record; never defaulted from the region or derived from coordinates (D-02)"
  - "The duplicate-file rule is a PhotoMap superRefine whose message names the file and both ids, so photos:build fails at parse time everywhere (CI included)"
  - "The off-extent error keeps its exact text and only appends '; plate <id>', so the existing WR-01 G5 expectation is unchanged"
  - "New G5 cases 1-6 run photos:build in write mode (a failing build writes nothing); only the moved-photo case uses --check, as the stale proof"
  - "lowestDemM stays exported in this plan; 15-08 and 15-09 move its readers and remove it (D-08)"

patterns-established:
  - "region.ts duplicates the plate-id slug regex instead of importing across schema files; existence is checked against plates.json by photos:build and the Jest test"

requirements-completed: [DATA-10]

coverage:
  - id: D1
    description: "Every generated photo carries region zermatt and country CH from committed, schema-checked photo-map and region data, sampled on its own plate"
    requirement: "DATA-10"
    verification:
      - kind: other
        ref: "npm run photos:build -- --check (photos:build: OK); grep -c '\"region\": \"zermatt\"' and '\"country\": \"CH\"' data/generated/photos.ts = 4 each"
        status: pass
      - kind: unit
        ref: "data/__tests__/photo-map.test.ts#D-05: each generated photo's region and country equal its record's"
        status: pass
    human_judgment: false
  - id: D2
    description: "photos:build (and so data:check / CI) fails on a missing record, an orphan record, two records naming one file, an unknown region, an unknown plate, a lowercase country and stale photos.ts"
    requirement: "DATA-10"
    verification:
      - kind: integration
        ref: "npm run guard:selftest (229/229; seven 'PASS photos:build: ' cases)"
        status: pass
      - kind: other
        ref: "npm run data:check / npm run lint"
        status: pass
    human_judgment: false
  - id: D3
    description: "Membership invariant and schema boundaries pinned in Jest: bijection with the sidecar, every photo in exactly one known region whose plate exists, closed Country enum, PhotoMap/Regions refines, closed sidecar schema (serial, xmp rejected)"
    requirement: "DATA-10"
    verification:
      - kind: unit
        ref: "npx jest data/__tests__/photo-map.test.ts data/__tests__/exif-sidecar.test.ts data/__tests__/photos.test.ts (78 passed)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-11-14
status: complete
---

# Phase 15 Plan 06: Photo map, region registry and per-plate photos:build Summary

**Every photo now names its region and country in a strict, committed photo-map.json; photos:build checks it against the sidecar and the region and plate registries, samples each photo's DEM height on its own region's plate, and writes region and country into photos.ts, with seven selftest cases and a Jest invariant making CI fail on missing, unknown, duplicate or stale data.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-11-14T21:01:11Z
- **Completed:** 2026-11-14T21:11:39Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- `data/photos/photo-map.json` (D-01, D-02) keyed `img-0605`, `img-0629`, `img-0662`, `r004-011`, each with its sidecar file name copied verbatim, `region: zermatt`, `country: CH`. `PhotoMap` is strict, needs at least one record, sorted keys and one record per file (the message names the file and both ids).
- `data/regions/regions.json` + `data/schemas/region.ts` (D-03): zod-only, strict, ids sorted and unique; only `zermatt` / `Zermatt` / `matterhorn`.
- `photos:build` (D-04, D-05): parses the map, regions and `plates.json` under `--root`; enforces the sidecar bijection (`add a record for <file> (<id>)…`, `…has <id>, but the sidecar has no entry…`, file mismatch names both); fails on an unknown region or plate; loads each plate's `<source>/source.json` + DEM once (sha256-checked) and samples each photo on its own plate. Elevations and uv are unchanged (img-0605 1617 m, img-0629 1668 m, img-0662 2585 m, r004-011 2760 m); `photos.ts` changes only by the header line and the two new fields per photo.
- G5 harness: `PHOTO_DATA_INPUTS` copies the three registries (Pitfall 5); `tempPhotoDataRoot` edits `photoMap`, `regions` and `plates`; seven new cases, all passing (selftest 222 -> 229).
- `photo-map.test.ts` (16 `safeParse`/parse assertions across 13 tests) and the closed-sidecar test (`serial`, `xmp` rejected, T-15-09).

## Task Commits

1. **Task 1: Photo map and region registry through photos:build into the generated data (tracer)** - `bd08c08` (feat)
2. **Task 2: G5 failure cases, photo-map.test.ts and the closed sidecar test** - `8404710` (test)

Tracer gate: `<verify>` is automated-only and `human_verify_mode` is the default end-of-phase, so it was re-run after Task 1 (photos:build --check OK, 4/4 region and country rows, selftest 222/222, data:check, type-check, photos.test.ts) before Task 2 began.

## Files Created/Modified

- `data/schemas/region.ts` - RegionId, Region, Regions (zod only)
- `data/regions/regions.json` - region registry, zermatt only
- `data/photos/photo-map.json` - file, region and country per photo
- `data/schemas/photo.ts` - exported PhotoId; Country, PhotoMapEntry, PhotoMap; PhotoFacts gains region and country
- `scripts/photos/build-photo-data.mjs` - PHOTO_MAP_REL / REGIONS_REL / PLATES_REL, `resolveMembership`, per-plate `loadDem(sourceRel)` cache
- `data/generated/photos.ts` - regenerated with region and country
- `scripts/guards/selftest.mjs` - inputs, edit callback, helpers (`mapRecord`, `regionEntry`, `addMapRecord`, `addRegion`, `noSortRefine`), seven cases, cleanup list
- `data/__tests__/photo-map.test.ts` - membership invariant and schema boundaries
- `data/__tests__/exif-sidecar.test.ts` - closed-schema test

## Decisions Made

See `key-decisions` in the frontmatter. The planner's flagged assumptions (country enum A1, no display names, PhotoId regex unchanged) were applied as written.

## Deviations from Plan

None that changed scope. Two small additions within the plan's intent:

- The seven G5 cases also carry `check: noSortRefine`, which fails a case whose output names a sorted-order refine. This mechanically enforces the acceptance criterion that cases (2) and (7) fail on their own rule, not on a sort refine, and applies it to all seven.
- `photo-map.test.ts` adds one boundary test beyond the list (a `file` containing a directory, and a record with an extra key, are rejected), pinning the `PhotoMapEntry` rules the plan specified.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** None.

## Issues Encountered

- `scripts/photos/build-photo-data.mjs` is CRLF in this Windows working tree (`core.autocrlf=true`), so the scripted edit normalised to LF, applied, and wrote CRLF back. Git stores LF; `photos:build --check` is unaffected.
- `npx prettier --check` warns on `scripts/guards/selftest.mjs`; the HEAD version was not Prettier-formatted either, so it is a pre-existing condition and was not reformatted. The CRLF-checked-out files pass Prettier with `--end-of-line crlf`.

## Verification

- `npm run photos:build -- --check`: `photos:build: OK`
- `npm run guard:selftest`: `selftest: 229/229 cases passed` (7 `PASS photos:build: ` lines)
- `npm run data:check`: every generator OK; `npm run lint` (eslint, guards, selftest, data:check, images, tests scan): exit 0
- `npm run type-check`: exit 0
- `npx jest data/__tests__/photo-map.test.ts data/__tests__/exif-sidecar.test.ts data/__tests__/photos.test.ts`: 3 suites, 78 tests passed

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 15-07 can make `photos:exif` assign ids from `photo-map.json` (file -> id) using the exported `PhotoMap` and `PhotoId`.
- 15-08 / 15-09 still need to move the `lowestDemM` readers to the Home list and remove the export (kept here per D-08).
- Phase 16 adds new photos and regions through these two files; widening `Country` is one line.

## Self-Check: PASSED

- FOUND: data/schemas/region.ts, data/regions/regions.json, data/photos/photo-map.json, data/__tests__/photo-map.test.ts
- FOUND: bd08c08, 8404710 (ancestors of HEAD)

---
*Phase: 15-region-plate-data-model*
*Completed: 2026-11-14*
