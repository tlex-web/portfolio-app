---
phase: 16-new-regions-alps-overview-data
plan: 14
subsystem: photos-data
tags: [photos, regions, saalfelden, zermatt, exif, derivatives, editorial, privacy, selftest, jest]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-01 per-photo precision and kind at extraction; 16-03 the D-15 light-table pin; 16-05/16-07 client splits; 16-08 Tim's per-photo values and approved copy; 16-09 proj4 EPSG:3035; 16-12 the saalfelden plate and plateSourceFiles()"
provides:
  - "Five new photos in the committed data: img-0680, img-0682, sam-20240910-143659 (zermatt, CH, 4dp, ground) and dji-20260919-162232, dji-20260919-163558 (saalfelden, AT, 3dp, aerial), each with a sidecar entry, photo facts, a manifest entry, nine metadata-free hashed derivatives and Tim's approved copy"
  - "Region schema: required country (closed list) and one to three sourced facts (RegionFact); regions.json holds saalfelden and zermatt with their approved facts"
  - "Selftest photo roots copy every registered plate source through plateSourceFiles(); fixture regions carry a country and a fact"
  - "photo-map.test pins Tim's 16-08 values for all five ids and that every record's country is its region's country"
affects: [16-16, 16-17, 16-18, 17-routes-seo, 18]

actuals:
  tokens: 8700     # chars/4 over the hand-edited and generated text diff (34,788 changed chars); the 45 binary derivatives are not counted
  tasks: 3
  commits: 2       # measured: git rev-list --count 8157aec..HEAD at SUMMARY write
plan_head_before: 8157aec143928b7b18f9fc08122a4b5bebe23dd0
plan_head_after: 2ff070e7a18681b0bd9b5ae5d898bc068e4c2446

tech-stack:
  added: []
  patterns:
    - "Tests that read the whole generated photo set follow the photo map (sorted keys, per-id pins), while order and layout cases read lightTableInput(), so a new region photo never breaks a light-table test"
    - "Region facts reuse the editorial Fact shape, duplicated in region.ts because schema files import only zod"

key-files:
  created:
    - public/images/photos/img-0680-*.{avif,webp,jpg} (9 files)
    - public/images/photos/img-0682-*.{avif,webp,jpg} (9 files)
    - public/images/photos/sam-20240910-143659-*.{avif,webp,jpg} (9 files)
    - public/images/photos/dji-20260919-162232-*.{avif,webp,jpg} (9 files)
    - public/images/photos/dji-20260919-163558-*.{avif,webp,jpg} (9 files)
  modified:
    - data/schemas/region.ts
    - data/regions/regions.json
    - data/photos/photo-map.json
    - data/photos/exif-sidecar.json
    - data/generated/photos.ts
    - data/generated/image-manifest.ts
    - data/photos/editorial.ts
    - scripts/guards/selftest.mjs
    - data/__tests__/photos.test.ts
    - data/__tests__/exif-sidecar.test.ts
    - data/__tests__/photo-map.test.ts
    - data/__tests__/editorial.test.ts
    - data/__tests__/image-manifest.test.ts
    - lib/__tests__/photos-view-model.test.ts
    - components/photos/__tests__/map.test.tsx
    - .planning/phases/16-new-regions-alps-overview-data/deferred-items.md

key-decisions:
  - "Tim's 16-08 values applied exactly: img-0680, img-0682, sam-20240910-143659 zermatt / CH / 4dp / ground; dji-20260919-162232 and dji-20260919-163558 saalfelden / AT / 3dp / aerial; no value defaulted or changed"
  - "Light-table order and layout tests read lightTableInput() (the four D-15 photos) instead of every generated photo, because the light table stays at four until Phase 18"
  - "Region facts are data on the strict region record (country plus one to three { text, source } facts, source https or 'Tim')"

requirements-completed: [DATA-13, DATA-14]   # copied from the plan; REQUIREMENTS.md ticking is subject to the shared-ID gate (16-16, 16-17, 16-18 also declare them)

coverage:
  - id: D1
    description: "D-02: each new record carries exactly Tim's 16-08 file, region, country, precision and kind"
    requirement: DATA-14
    verification:
      - kind: unit
        ref: "data/__tests__/photo-map.test.ts#D-02: every 16-08 photo's record is exactly Tim's recorded file, region, country, precision and kind"
        status: pass
    human_judgment: false
  - id: D2
    description: "DATA-13: the five photos are in the sidecar, photos.ts and the manifest with metadata-free hashed derivatives"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "npm run data:check (photos:exif/derive/build OK); npm run guard:images (served-images: OK)"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-04: both DJI stills are aerial with gps.altM null"
    requirement: DATA-14
    verification:
      - kind: other
        ref: "node -e (DJI entries with altM null) printed '2 true'"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-08 / D-13: regions.json holds saalfelden (AT, plate saalfelden) and zermatt (CH, plate matterhorn) with Tim's approved facts; ids sorted"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "data/__tests__/photo-map.test.ts#D-03, 16 D-08 / D-13: the registry holds saalfelden and zermatt, each with its country, plate and approved facts"
        status: pass
    human_judgment: false
  - id: D5
    description: "D-15: light table, slugs, sitemap, static params, proxy route set and catalog still at four; no new id or slug in a client chunk; client JS within budget"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-routes.test.ts, lib/__tests__/audit-routes.test.ts, lib/__tests__/region-series.test.ts, lib/__tests__/client-graph.test.ts (61 passed)"
        status: pass
      - kind: other
        ref: "grep of .next/static/chunks for the five new ids: 0 files; client JS 1,851,685 B in 24 files"
        status: pass
    human_judgment: false
  - id: D6
    description: "D-28 / D-27: the S20 and S25 originals set aside in assets/photos-original/not-in-series/"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "the move was denied by the auto-mode permission classifier; both files remain in incoming/ with no record (see Open item)"
        status: fail
    human_judgment: true

duration: 25min
completed: 2026-11-23
---

# Phase 16 Plan 14: Zermatt and Saalfelden Photo Ingest Summary

**The five non-Ortler photos are now committed data, with exactly the values Tim chose in 16-08. Three Zermatt photos sit on the Matterhorn plate at 4dp as ground photos. Two DJI stills sit on the new Saalfelden EPSG:3035 plate at 3dp as aerial photos, with the altitude null. Each has its sidecar entry, photo facts, nine metadata-free hashed derivatives and approved copy. The region registry gained `saalfelden`, and both regions now have a country and Tim's approved facts. The light table, every route set and the client JS are unchanged.**

## Performance

- **Duration:** about 25 min (2026-11-23T11:27:46Z to about 11:52Z)
- **Tasks:** 3 (1 tracer, 2 auto)
- **Files modified:** 16 text files plus 45 derivatives

## Accomplishments

- **Task 1 (tracer): img-0680 end to end.** The record, the original's move to the top level, the pipeline (one new sidecar entry, and the four existing entries were unchanged), nine derivatives and the approved copy. `home-photos.ts` and `home-waypoints.ts` were byte-unchanged. The tracer gate's verify passed end to end: `data:check`, `guard:images` and the named Jest set (26 suites, 495 tests).
- **Task 2:** `Region.country` and `Region.facts` (`RegionFact`), the `saalfelden` region, zermatt's `CH` and facts, the other four records and their originals, and the four editorial entries. In the selftest, `tempPhotoDataRoot` copies every registered plate source through `plateSourceFiles()`, and the two hard-coded `data/terrain/source/` inputs are gone. The three fixture regions get one shared country-and-fact pair.
- **Task 3:** the full gate is green. Every route set is still at four, no client chunk contains a new id or slug, and client JS is the same as in 16-07 and 16-12.

## Task Commits

1. **Task 1 (tracer): one Zermatt photo end to end.** `b9a74e6` (feat)
2. **Task 2: regions, Saalfelden stills, other Zermatt photos.** `2ff070e` (feat)
3. **Task 3: proof that nothing public moved.** No source change. Results are recorded below.

## Per-photo result (booleans only)

A scratch script outside the repo (`16-14-booleans.mjs` in the session scratchpad) checked each id. It printed ids and booleans only.

| id | precision / kind (Tim) | committed decimals within precision | altM null where coarse or aerial | inside plate |
|---|---|---|---|---|
| img-0680 | 4dp / ground | yes | n/a (4dp ground) | inside plate matterhorn: yes |
| img-0682 | 4dp / ground | yes | n/a (4dp ground) | inside plate matterhorn: yes |
| sam-20240910-143659 | 4dp / ground | yes | n/a (4dp ground) | inside plate matterhorn: yes |
| dji-20260919-162232 | 3dp / aerial | yes | yes | inside plate saalfelden: yes |
| dji-20260919-163558 | 3dp / aerial | yes | yes | inside plate saalfelden: yes |

"Inside plate" means both of these lie in [0, 1]: the generated uv, and the uv recomputed through `toGrid` (proj4 for EPSG:3035) and `gridToUv` on the plate source's extent. The coarse photos have `groundM`. No lat/lon with 5+ decimals appears in the sidecar or `photos.ts`. Kind, region and country in `photos.ts` equal the records.

## Task 1 stop condition: full-set tests rewritten in place

Written before the Task 1 commit, as the plan's stop condition requires: more than three of the nine named full-set tests needed a change once `img-0680` joined the generated photo set. Nothing was deleted or skipped (GUARD-03), and the test count only goes up (1,974 before this plan).

| Test file | Assertion that pinned exactly the four | Why the four were not its point | Change |
|---|---|---|---|
| `data/__tests__/photos.test.ts` | "holds the four photos sorted by id" (a literal four-id list) | the point is that the generated set is sorted by id and has one entry per record | "holds every photo-map record, sorted by id": the ids equal the sorted photo-map keys, and the four v2.0 ids stay in the set |
| `data/__tests__/photos.test.ts` | "every position coordinate passes Coord4" expected exactly 10 coordinates | the count is a vacuous-pass guard for the Coord4 check | the count follows the record count: every photo has a position, and there are `2 * photos + 2` coordinates (the film scan's correction pair) |
| `data/__tests__/exif-sidecar.test.ts` | "holds one entry per original, sorted by id" (a literal four-id list) | the point is one entry per original, sorted | the ids equal the sorted photo-map keys; the four v2.0 ids stay in it |
| `data/__tests__/exif-sidecar.test.ts` | "the four are distinct" (`size` 4) | the point is that every hash is distinct | renamed "every entry has its own": the distinct count equals the entry count, at least four |
| `data/__tests__/exif-sidecar.test.ts` | the DATA-06 rounding test expected exactly 6 lat/lon matches | the count is a vacuous-pass guard | it expects two matches per GPS entry, with at least the three digital v2.0 photos |
| `data/__tests__/editorial.test.ts` | "gives every photo a unique descriptive slug" (a literal four-slug list in id order) | the point is unique, approved slugs | the slugs are pinned per id; `img-0680` adds Tim's approved slug from 16-08 |
| `lib/__tests__/photos-view-model.test.ts` | "returns the Zermatt series in DEM order" equated the light table with the whole Zermatt series; "breaks a tie in DEM height by id" and "sorts an aerial photo by its ground height" built views from every generated photo and expected a four-id order | these cases are about the light table's order, not about the size of the Zermatt series | the fixture `committed` is now `lightTableInput()` (the four D-15 photos), `withPhoto` and the tie case patch `committed.photos`, and the series case checks that the light table is the Zermatt series' light-table photos in series order |

`data/__tests__/photo-map.test.ts` was not rewritten in Task 1. It gained one test, "every 16-08 photo's record is exactly Tim's recorded file, region, country, precision and kind", and the four-record D-02 loop is unchanged. The other four named tests (`photos-hotspots`, `ascent-waypoints`, `strip`, `hotspots`) passed unchanged. No failure showed a new photo reaching the light table, a photo route or a client path.

One test outside the nine also pinned the four: `data/__tests__/image-manifest.test.ts` "the eight full-resolution copies ... are gone" expected exactly 8 names (two per original). Its point is that no legacy full-resolution copy exists. It now expects two names per sidecar entry and at least eight, and its title says the eight v2.0 copies are still covered.

A second test outside the nine failed in the full suite: `components/photos/__tests__/map.test.tsx` "draws a synthetic coarse photo's dot dashed". It built views from every generated photo, and `layoutMapMarks` threw a RangeError because the compact map tier is a four-waypoint template. The map sheet renders only the light table (`photoViews`), so the fault was in the test's fixture and was not a D-15 defect. The case now patches `lightTableInput().photos`. Full Jest after Task 1: 115 suites and 1,975 tests passed (1,974 before, plus the new photo-map test).

### Task 2 rewrites (same rule)

- `photo-map.test.ts` "D-03: the registry holds only zermatt" became "the registry holds saalfelden and zermatt, each with its country, plate and approved facts". It pins both full region records verbatim.
- The `Regions` unsorted-ids fixture `saas` now copies zermatt's country and facts.
- A new test, "every record's country is its region's country", was added.
- The 16-08 pin now requires all five ids.
- `editorial.test.ts` gained the four further approved slugs.
- `photos.test.ts` "no photo carries the old hand-typed '2024' tag" failed because `sam-20240910-143659` really was taken in 2024. The old-tag check now covers the four v2.0 photos it was written for, and the test adds that every photo's year tag equals its capture year (D-08).

## Gate (Task 3)

| Check | Result |
|---|---|
| `npm run lint` (ESLint, guards, selftest 286/286, data:check, served-images, test scan) | exit 0 |
| `npm run type-check` | exit 0 |
| `npx jest` | 115 suites, 1,976 tests passed (1,974 before the plan; nothing deleted or skipped) |
| `npm run guard:tests:scan` | scan OK |
| `npm run guard:images` | served-images: OK |
| Selftest G5 control "an unmodified copy of the inputs passes", with saalfelden records in the map | 1 PASS line |
| Route sets (`photo-routes`, `audit-routes`, `region-series`, `client-graph`) | 61 passed; `photoRouteSlugs` still has length 4 |
| `.next/static/chunks` files containing any of the five new ids | 0 |
| `.next/static/chunks` files containing any of the five new slugs | 0 |
| `.next/server` paths containing a new slug | 0 |
| Client JS (`rm -rf .next/static`, `npm run build`, the 15-01 byte-sum, `git restore public/service-worker.js`) | **1,851,685 B in 24 files**: 113 B over the 16-01 base (1,851,572 B), 3,983 B under the cap (1,855,668 B), the same as in 16-07 and 16-12 |
| `home-photos.ts`, `home-waypoints.ts` | byte-unchanged |

## Decisions Made

- Tim's values were applied exactly as recorded in 16-08 (see the key decisions).
- Tests about light-table order and layout read `lightTableInput()`, so photos added before Phase 18 are data only and do not change those tests.
- Region facts use the editorial Fact shape (an https source or `'Tim'`), with one to three facts per region.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two tests outside the nine named full-set tests pinned the four**
- **Found during:** Task 1
- **Issue:** `image-manifest.test.ts` expected exactly 8 legacy names. `map.test.tsx` built a map sheet from every generated photo, which the four-slot compact tier rejects.
- **Fix:** both were rewritten in place as described above. Nothing was deleted or skipped.
- **Files modified:** data/__tests__/image-manifest.test.ts, components/photos/__tests__/map.test.tsx
- **Commit:** b9a74e6

**2. [Rule 3 - Blocking] The '2024' tag test pinned the four implicitly**
- **Found during:** Task 2
- **Issue:** a v2.0 regression check asserted that no photo has year tag 2024, but `sam-20240910-143659` was genuinely captured in 2024.
- **Fix:** the check is scoped to the four v2.0 photos, with an added assertion that every year tag is derived from the capture.
- **Files modified:** data/__tests__/photos.test.ts
- **Commit:** 2ff070e

**3. [Formatting] Prettier reflowed three pre-existing over-width lines in `photos-view-model.test.ts`.** This is whitespace only, in the same file as the planned rewrite. Unused imports (`editorial` in that file, `photos` in `map.test.tsx`) were removed after the rewrite to keep ESLint clean.

### Not done: the out-of-series originals were not moved (Tim action)

The plan moves `20210912_193833.jpg` and `20260916_125705.jpg` from `assets/photos-original/incoming/` to `assets/photos-original/not-in-series/`. The auto-mode permission classifier denied that move twice. The first attempt was combined with the in-series moves; the second was the `mkdir` plus `mv` on its own. The executor did not work around the denial. Both files are still in `incoming/` with no record. `photos:exif` reads only the top level, so neither is ingested and no committed output depends on where they sit. The acceptance check `ls assets/photos-original/not-in-series | wc -l` (2 or more) is not met. To finish it, Tim can move the two files himself (the folder is gitignored, so there is nothing to commit). The 2016 SM-G930F file stays in `incoming/` for 16-16, as planned.

**Total deviations:** 2 auto-fixed (Rule 3), 1 formatting note, 1 step not done because permission was denied.

## Issues Encountered

- `photos:build` stamps every capture with `Europe/Zurich`, so the two Austrian stills carry that zone label. The offsets match Europe/Vienna all year, so the time and offset are correct. Logged in `deferred-items.md` for Phase 17/18.

## Known Stubs

None. The five editorial entries have `annotations: []` by design (16-08: no summit elevation reference, Pitfall 8). The photos are data only until Phase 17/18 (D-15).

## Privacy

No position, altitude, uv or grid value of any photo appears in a commit message, this SUMMARY or any `.planning/` file. Precision and kind are reported by id only. The committed sidecar and photo facts hold the rounded positions at each photo's recorded precision, by design (D-12).

## D-25 scan

The scan ran with `d25-scan-1609.mjs` (the copy with the EPSG:3035 strings), over `.planning/` via `git grep --untracked`. It ran before the SUMMARY existed (baseline) and again after it was written, before the SUMMARY commit. The results are in the self-check below.

## Next Phase Readiness

16-16 can register the Ortler plate and ingest its photos. The selftest copies every plate source registered in plates.json, and the region schema is ready for a third region with its country and facts.

## Self-Check: PASSED

- The five modified sources exist. Each new id has 9 tracked derivatives in `public/images/photos/`.
- Commits b9a74e6 and 2ff070e are ancestors of HEAD.
- D-25 scan, run after this SUMMARY was written (`git grep --untracked` confirmed the scan can see this file):

| Check | Result |
|---|---|
| `16-14-SUMMARY.md` or any other 16-14 file named in any match | no |
| Set of matched `.planning/` files equal to the baseline run without this SUMMARY | yes |
| Any match overall | yes, pre-existing only (the reviewed v2.0 files, as in 16-08 to 16-13) |

The scan labels originals by folder, so the per-original lines moved with the four originals that went to the top level. The matched-file set is identical.
