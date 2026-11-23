---
phase: 17-region-routes-seo-structured-data
plan: 04
subsystem: data
tags: [photos, exif, time-zone, zod, intl, photos-build, selftest]

# Dependency graph
requires:
  - phase: 16-new-regions-alps-overview-data
    provides: the photo-map record's explicit country, the Saalfelden (AT) and Ortler (IT) photos, the Home list loaded under --root
provides:
  - ZONE_BY_COUNTRY (closed Country -> IANA zone map) and the TimeZone enum in data/schemas/photo.ts
  - PhotoFacts refine: a second-precision capture's timeZone equals ZONE_BY_COUNTRY[country]
  - photos:build wall time and offset per zone (wallTime(ms, zone), zoneOffset, buildCapture(entry, fix, zone))
  - regenerated photos.ts with Europe/Vienna (Saalfelden) and Europe/Rome (Ortler) captures
  - loadHomeWaypointIds names the real import error (16 IN-04 fix, commit fed9a67)
affects: [17-15, structured-data, dateCreated, photo pages]

# Actuals (#2632)
actuals:
  tokens: 6350     # chars/4 over the realized diff (25,400 chars, df68202..fed9a67)
  tasks: 2
  commits: 4       # MEASURED: git rev-list --count df68202..fed9a67
plan_head_before: df68202e4ccbb46bb5d9f6ceefaf7223bddaee3d
plan_head_after: fed9a673253d6f0f39e65bebf1118d324dc465c1

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Closed country-to-zone map in the zod-only schema, imported by the build script (Node type-strips it)"
    - "Error texts interpolate the derived zone, so the CH branch stays byte-identical"

key-files:
  created: []
  modified:
    - data/schemas/photo.ts
    - scripts/photos/build-photo-data.mjs
    - data/generated/photos.ts
    - data/__tests__/photos.test.ts
    - scripts/README.md
    - scripts/guards/selftest.mjs

key-decisions:
  - "D-26 mechanism: a country-to-zone map keyed by the photo-map record's country (RESEARCH Pattern 10), covering all eight Country values; a field on the region was rejected because the photo already carries its country"
  - "The zone-equals-country rule lives as a PhotoFacts refine with path ['capture', 'timeZone'], so the generated data and the schema both hold it"
  - "16 IN-04 fix is its own commit, fed9a67, for the 17-15 16-REVIEW-DISPOSITION write-back"

patterns-established:
  - "One Intl.DateTimeFormat per zone, built on first use, in build-time scripts"

requirements-completed: [PHOTO-05]

coverage:
  - id: D1
    description: "Every EXIF capture carries its photo's country zone: the two Saalfelden stills Europe/Vienna, the two Ortler photos Europe/Rome, all at +02:00; the six CH captures keep Europe/Zurich"
    requirement: PHOTO-05
    verification:
      - kind: unit
        ref: "data/__tests__/photos.test.ts#17 D-26: each EXIF capture's time zone is its photo's country zone"
        status: pass
      - kind: other
        ref: "grep -c timeZone lines in data/generated/photos.ts: Zurich 6, Rome 2, Vienna 2"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every Swiss output is byte-identical: photos:build changed only four timeZone lines, home-photos.ts untouched, data:check clean"
    requirement: PHOTO-05
    verification:
      - kind: other
        ref: "git diff -U0 df68202 -- data/generated: only data/generated/photos.ts, only four timeZone lines"
        status: pass
      - kind: other
        ref: "git diff --quiet 0ac8575^ 0ac8575 -- data/generated/home-photos.ts"
        status: pass
      - kind: other
        ref: "npm run data:check"
        status: pass
    human_judgment: false
  - id: D3
    description: "The schema refuses a capture whose zone is not its country's, and every zone in the map is a valid IANA zone in Node ICU"
    requirement: PHOTO-05
    verification:
      - kind: unit
        ref: "data/__tests__/photos.test.ts#PhotoFacts refuses a capture whose zone is not its country's, naming timeZone"
        status: pass
      - kind: unit
        ref: "data/__tests__/photos.test.ts#the %s zone is a valid IANA zone in Node ICU (RESEARCH A4)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The CH offset error text is unchanged and a new G5 case proves an Ortler offset is checked against Europe/Rome"
    requirement: PHOTO-05
    verification:
      - kind: integration
        ref: "npm run guard:selftest#G5 photos:build --check: an Ortler (IT) photo's EXIF offset is checked against Europe/Rome (D-26)"
        status: pass
      - kind: integration
        ref: "npm run guard:selftest#G5 photos:build --check: an EXIF offset +01:00 on a September Zurich capture fails (WR-03)"
        status: pass
    human_judgment: false
  - id: D5
    description: "photos:build names the real cause when data/home-waypoints.ts cannot be imported (16 IN-04)"
    verification:
      - kind: integration
        ref: "npm run guard:selftest#photos:build: an unreadable data/home-waypoints.ts names its cause (16 IN-04)"
        status: pass
    human_judgment: false

# Metrics
duration: 10min
completed: 2026-11-23
status: complete
---

# Phase 17 Plan 04: Per-Country Capture Zones and the IN-04 Home-List Error Summary

**The Saalfelden stills now read Europe/Vienna and the Ortler photos Europe/Rome, through a closed `ZONE_BY_COUNTRY` map in the zod schema that `photos:build` imports. A PhotoFacts refine enforces the label. Every Swiss output stayed byte-identical. `photos:build` now names the real import error when the Home list fails to load.**

## Performance

- **Duration:** about 10 min
- **Started:** 2026-11-23T22:29:04Z
- **Completed:** 2026-11-23T22:39:35Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `data/schemas/photo.ts`: `ZONE_BY_COUNTRY` covers all eight Country values (AT Vienna, CH Zurich, DE Berlin, FR Paris, IT Rome, LI Vaduz, MC Monaco, SI Ljubljana). `TimeZone` is a z.enum of those zones. Capture's `timeZone` field now uses `TimeZone`, and PhotoFacts refuses a capture whose zone differs from its country's zone (path `capture.timeZone`). The file still imports only zod and still uses only erasable TypeScript.
- `scripts/photos/build-photo-data.mjs`: `TIME_ZONE` is gone. There is now one formatter per zone, plus `wallTime(ms, zone)`, `zoneOffset(id, local, gpsUtc, zone)` and `buildCapture(entry, fix, zone)`, with the caller passing `ZONE_BY_COUNTRY[record.country]`. Both error texts interpolate the zone, so the CH text the selftest expects is byte-identical.
- `data/generated/photos.ts` was regenerated. Only four `timeZone` lines changed (two Vienna, two Rome). `home-photos.ts` and every CH block are untouched, and `data:check` is clean.
- Selftest gained two cases: `G5 photos:build --check: an Ortler (IT) photo's EXIF offset is checked against Europe/Rome (D-26)` and `photos:build: an unreadable data/home-waypoints.ts names its cause (16 IN-04)`. The selftest now passes 295/295.
- `scripts/README.md`: the photos:build failure list now says the recorded offset must equal the offset derived in the photo's country zone.

## Task Commits

1. **Task 1: Per-country capture zones (D-26), TDD**
   - RED `5b67aca` (test): 13 new photos.test rows fail
   - GREEN `0ac8575` (feat): schema map, enum and refine; build per zone; regenerated photos.ts; G5 Rome case; README
   - REFACTOR `ad5d514` (refactor): removed the RED-only casts and applied prettier; renamed the IT fixture local to `ortler`
2. **Task 2: loadHomeWaypointIds names the real import error (16 IN-04)**: `fed9a67` (fix). **This is the 16 IN-04 fix commit for the 17-15 write-back** (`git cat-file -e fed9a67` exits 0).

**Plan metadata:** recorded in the docs commit that adds this SUMMARY.

## TDD Gate Compliance

- **RED (5b67aca):** `npx jest data/__tests__/photos.test.ts` exited 1 with 13 failed and 49 passed. Each failure was an assertion on the planned behaviour:
  - the eight zone rows got `"undefined"` where they expected `"string"`
  - the map-keys row got one key where it expected ten
  - the Vienna and Rome rows received `Europe/Zurich`
  - the every-capture row got `undefined` where it expected a zone
  - the refine row got `success: true` where it expected `false`
  
  There were no load, import, syntax or type errors: next/jest uses SWC, so the missing export was simply `undefined`. The CH regression row passed, as intended. The Jest default reporter is not one of the `tdd-red-evidence` classifier formats (TAP, JUnit, go, swift, unittest), so the classifier was not run. The judgement that the RED is valid comes from reading the output, recorded here.
- **GREEN (0ac8575):** 107 tests pass across the photos, photo-map and exif-sidecar suites.
- **REFACTOR (ad5d514):** tests still pass (62/62 in photos.test).

## Files Created/Modified

- `data/schemas/photo.ts`: ZONE_BY_COUNTRY, TimeZone, Capture.timeZone and the country-zone refine; doc lines updated
- `scripts/photos/build-photo-data.mjs`: per-zone wall time and offset, zone in the error texts, the IN-04 catch; header doc updated
- `data/generated/photos.ts`: four timeZone lines (regenerated)
- `data/__tests__/photos.test.ts`: the D-26 describe block (map keys, IANA validity, CH, AT and IT rows, every-capture rule, refine)
- `scripts/guards/selftest.mjs`: the G5 Rome case and the IN-04 case, plus their temp roots in the cleanup list
- `scripts/README.md`: line 43 offset sentence

## Decisions Made

- I chose the country-to-zone map in the schema (RESEARCH Pattern 10), not a field on the region, because the photo record already carries its country. The `satisfies Record<Country, string>` check means a Country added later without a zone fails type-check.
- The refine sits on PhotoFacts rather than Capture, because Capture does not know the country. Nothing calls `.omit()`, `.pick()` or `.extend()` on PhotoFacts (checked with git grep), so making it a refined object is safe.

## Deviations from Plan

None. The plan was executed as written. The REFACTOR commit is the optional TDD step and contains formatting and the casts only.

## Issues Encountered

- Line endings in the working copy are mixed (CRLF in build-photo-data.mjs, LF elsewhere). Scripted edits normalized to LF before matching, and git's autocrlf stores LF, so the diffs contain no line-ending noise.

## Verification Results

- `npx jest data/__tests__/photos.test.ts data/__tests__/photo-map.test.ts data/__tests__/exif-sidecar.test.ts`: 107/107 pass
- `npx jest data lib scripts`: 75 suites, 1495 tests pass
- Diff check on `data/generated` (only photos.ts, only timeZone lines): exit 0
- `npm run guard:selftest`: 295/295. The Ortler case printed 1 PASS line and the IN-04 case printed 1 PASS line.
- `npm run data:check`: every stage OK, nothing stale
- `npm run lint`: exit 0
- `tsc --noEmit` and `tsc -p tsconfig.jest.json`: clean
- Acceptance greps: Zurich 6, Rome 2, Vienna 2, `zurichOffset` 0, CH error text 1, `catch {` 0, `e?.message ?? e` 1
- `node scripts/ci/check-snapshot-commit.mjs --none`: OK after every commit

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 17-15 can cite `fed9a67` as the 16 IN-04 fix in the 16-REVIEW-DISPOSITION write-back.
- Any future `dateCreated` or zone-aware JSON-LD can read `capture.timeZone` directly. It now names the photo's own country zone.

## Self-Check: PASSED

- All six modified files exist on disk.
- Commits 5b67aca, 0ac8575, ad5d514 and fed9a67 are ancestors of HEAD.

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-23*
