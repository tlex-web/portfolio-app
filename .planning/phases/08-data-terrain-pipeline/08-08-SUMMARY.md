---
phase: 08-data-terrain-pipeline
plan: 08
subsystem: photo-data
tags: [zod, exif, dem, sharp, node-type-stripping, jest, generated-data]

requires:
  - phase: 08-01
    provides: lib/geo.ts (wgs84ToLv95, lv95ToUv, round4) and lib/terrain/dem-sample.ts (sampleAtLv95)
  - phase: 08-02
    provides: committed EXIF sidecar (stage 1 of D-10) and the NaiveLocal / Coord4 / ExifSidecar schemas
  - phase: 08-04
    provides: data/terrain/source (native 10 m swissALTIRegio grey16 PNG + source.json with sha256) and data/generated/terrain.ts
  - phase: 08-07
    provides: image manifest and derivatives keyed by the same photo ids
provides:
  - data/photos/corrections.json (Gornerschlucht override, year-2019 film-scan capture, approximate Riffelsee pin)
  - Stage-2 schemas in data/schemas/photo.ts (Capture, Position, Elevation, Exposure, LocationOverride, Corrections, PhotoFacts)
  - scripts/photos/build-photo-data.mjs and npm script photos:build (--check inside data:check / lint)
  - data/generated/photos.ts exporting photos and lowestDemM (1617)
  - lib/photo-format.ts (seasonOf, yearTag, formatCaptureLabel, formatExposureTime, formatAperture, formatFocalLength, formatMetres)
  - HOME-04 / ROADMAP Phase 9 SC2 / PROJECT.md altimeter wording from 1,617 m
affects: [08-10 legacy bridge and copy review, 08-12 footer ticks, phase 9 altimeter rail and waypoints, phase 10 photo map and lightbox]

actuals:
  tokens: 11500
  tasks: 2
  commits: 4
plan_head_before: db7806ebc3f076923a468da8b0c7f1d59a76775d
plan_head_after: a3e6dea1b3805ea7569171d6f8721f8f768d7781

tech-stack:
  added: []
  patterns:
    - "Stage-2 generator: committed inputs only (sidecar, corrections, DEM source), parsed per entry with zod, written as `export const x = <JSON> as const;` with a byte-compare --check"
    - "Build-time-only Intl: the Europe/Zurich offset is resolved by Node ICU in the generator and stored, so shipped code needs no time-zone data"
    - "Pure display formatters with no locale APIs; U+00A0 between value and unit"

key-files:
  created:
    - data/photos/corrections.json
    - scripts/photos/build-photo-data.mjs
    - data/generated/photos.ts
    - lib/photo-format.ts
    - lib/__tests__/photo-format.test.ts
    - data/__tests__/photos.test.ts
  modified:
    - data/schemas/photo.ts
    - package.json
    - .gitattributes
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/PROJECT.md

key-decisions:
  - "img-0629's DEM height is 1,668 m, not RESEARCH's 1,674.9 m: RESEARCH measured at full-precision GPS, the plan's sampler runs at the committed 4-decimal coordinates; in the gorge the ~3 m rounding shift is worth 7 m. The defined sampler's value is kept and the test pins 1668 +/- 1"
  - "Offset resolution: the one of +01:00 / +02:00 whose instant formats back to the same Zurich wall time; a skipped or repeated wall time fails the build, then the GPS UTC cross-check (< 60 s) runs"
  - "Generator fails on a corrections id missing from the sidecar and on a film-scan without a year captureOverride (D-03 guard, not only a test)"
  - "U+00A0 separates every unit (m, mm, s), extending the UI-SPEC metres rule to all photo formatters"
  - "Meteorological seasons (Claude's discretion, D-08): the three Sep 2021 photos are autumn; Tim sees the tags at the 08-10 copy review"

patterns-established:
  - "photos:build output: 'photos:build: <problem>' lines, then 'photos:build: OK' or 'photos:build: stale' (exit 1)"
  - "TDD on a module with an import-free contract: RED commit carries signature-only interface stubs so tests fail on assertions, not on TypeErrors"

requirements-completed: [DATA-02, DATA-03, DATA-04, DATA-06]

coverage:
  - id: D1
    description: "Typed photo facts generated from the committed sidecar, corrections and DEM; photos:build --check in lint fails on any byte difference"
    requirement: DATA-02
    verification:
      - kind: other
        ref: "npm run photos:build -- --check (OK; mutated sidecar lens -> exit 1 'stale'; restored -> OK)"
        status: pass
      - kind: other
        ref: "npm run lint (photos:build: OK, 0 errors / 54 warnings)"
        status: pass
    human_judgment: false
  - id: D2
    description: "EXIF captures at Europe/Zurich +02:00, film scan year-only 2019 with no scan date, Gornerschlucht override, DEM heights, derived year/season tags"
    requirement: DATA-03
    verification:
      - kind: unit
        ref: "data/__tests__/photos.test.ts#captures (D-03, D-04)"
        status: pass
      - kind: unit
        ref: "data/__tests__/photos.test.ts#DEM heights (D-17)"
        status: pass
      - kind: unit
        ref: "data/__tests__/photos.test.ts#derived tags (D-08)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Film-scan Riffelsee pin is approximate with reason and radius; schema rejects an approximate position without both and a hand-placed exact one"
    requirement: DATA-04
    verification:
      - kind: unit
        ref: "data/__tests__/photos.test.ts#positions (DATA-04, D-02)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every lat/lon in photos.ts and corrections.json has at most 4 decimals; uv is round4 of lv95ToUv in the terrain extent"
    requirement: DATA-06
    verification:
      - kind: unit
        ref: "data/__tests__/photos.test.ts#coordinates (DATA-06, DATA-01)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Pure display formatters with no Intl / toLocale"
    verification:
      - kind: unit
        ref: "lib/__tests__/photo-format.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "Riffelsee pin position (45.9837 N, 7.7623 E, radius 100 m) and meteorological season tags are what Tim wants"
    verification: []
    human_judgment: true
    rationale: "Discretion values flagged in the plan; Tim confirms or moves the pin and may switch the season rule at the 08-10 copy review checkpoint"

duration: 8min
completed: 2026-10-24
status: complete
---

# Phase 8 Plan 08: Typed Photo Facts Summary

**Sidecar + Tim's corrections + the native 10 m DEM now generate zod-validated `data/generated/photos.ts` (EXIF captures at Europe/Zurich +02:00, year-only 2019 film scan, approximate Riffelsee pin, Gornerschlucht override, DEM heights, derived tags, `lowestDemM = 1617`) with a byte-compare `--check` in lint, plus pure Intl-free photo formatters.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-24T16:48:59Z
- **Completed:** 2026-10-24T16:57:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- `scripts/photos/build-photo-data.mjs` (stage 2 of D-10) reads only committed inputs, verifies the DEM source PNG's sha256 against source.json, resolves each EXIF wall time's Zurich offset with Node ICU at build time and cross-checks it against the GPS UTC stamp (drifts: 1.2 s, 0.4 s, 0 s), samples heights with the one DEM sampler and writes `photos.ts`. `npm run lint` now ends with `photos:build: OK`.
- Generated facts: img-0605 1,617 m, img-0629 1,668 m, img-0662 2,585 m, r004-011 2,760 m (hand-placed, approximate, radius 100 m). Three digital photos are tagged 2021 / autumn, the film scan 2019 / no season. The scan date 2020-02-12 appears nowhere.
- `lib/photo-format.ts`: `seasonOf`, `yearTag` and five display formatters, pure, with no locale APIs.
- Altimeter wording now starts at 1,617 m in REQUIREMENTS HOME-04 ("the lowest photo's DEM height"), ROADMAP Phase 9 SC2 and PROJECT.md.

## Task Commits

1. **Task 1 (tracer): corrections + sidecar + DEM -> generated photos.ts, --check in lint** - `e85c931` (feat)
2. **Task 2: formatters, photo-fact invariants, altimeter wording** (TDD)
   - RED `012521f` (test): both suites plus formatter interface stubs
   - GREEN `37d7073` (feat): formatters implemented
   - `a3e6dea` (docs): altimeter wording in REQUIREMENTS / ROADMAP / PROJECT

**Plan metadata:** recorded in the docs(08-08) completion commit.

## TDD Gate Compliance

- **RED** `012521f`: `npx jest lib/__tests__/photo-format.test.ts data/__tests__/photos.test.ts --silent` with the out-of-repo TAP reporter, exit 1, 63 tests / 54 pass / 9 fail. Target "formatCaptureLabel (D-03, D-04) > a second-precision capture reads day, English month, year and local hh:mm" failed on its `toBe` (Expected "6 September 2021, 10:48", Received "" from the interface stub). Classifier: `RED_EVIDENCE_OK` (record `.git/gsd-red/08-08-red.json`). Semantic assessment: the target and the other 8 failures are formatter assertions against the same stubs. There were no load, syntax or fixture faults. The 54 passes are `seasonOf`/`yearTag` (shipped in the tracer) and the photo-fact invariants, which pass against the Task 1 output by design.
- **GREEN** `37d7073`: 63/63 pass.
- **REFACTOR:** none needed.

## Files Created/Modified

- `data/photos/corrections.json` - Tim's reasoned overrides (schemaVersion 1)
- `data/schemas/photo.ts` - stage-2 schemas appended; header updated
- `lib/photo-format.ts` - tags and display formatters, zero imports
- `scripts/photos/build-photo-data.mjs` - stage-2 generator with `--check`
- `data/generated/photos.ts` - generated facts plus `lowestDemM`
- `package.json` - `photos:build` script; appended to `data:check`
- `.gitattributes` - `data/generated/photos.ts text eol=lf` (byte-compared under core.autocrlf=true)
- `lib/__tests__/photo-format.test.ts`, `data/__tests__/photos.test.ts` - 63 tests
- `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/PROJECT.md` - one scoped line each

## Decisions Made

See key-decisions in the frontmatter. The two that matter most downstream:
- The DEM sampler is the definition (RESEARCH Pitfall 2). img-0629 is 1,668 m at the committed 4-decimal coordinates, so 08-10's annotation copy must use 1,668 m, not RESEARCH's 1,674.9 m.
- `formatMetres` puts U+00A0 before the unit. The doc wording uses a plain space because it is prose, not rendered UI.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug in plan expectation] img-0629 height pinned at 1,668 m instead of ~1,675 m**
- **Found during:** Task 1 (height check against RESEARCH Pitfall 2)
- **Issue:** The plan's behaviour asked for "within 1 m of 1675" for img-0629. The specified sampler (bilinear at pixel centres of the native 10 m raster at the 4-decimal coordinates) gives 1,668.2 m. RESEARCH's table was measured at full-precision GPS. lib/__tests__/geo.test.ts shows the same source using 46.01502 / 7.74144 for img-0605, and RESEARCH's LV95 values sit ~3 m from the 4-dp ones. In the gorge the grid changes by up to ~30 m per cell, so 3 m moves the height by 7 m. Sampling RESEARCH's own LV95 point gives 1,674.3 m, which confirms the cause.
- **Fix:** I kept the defined sampler's output. The test pins 1668 +/- 1, and the test file header explains why. img-0605 (1617), img-0662 (2585) and r004-011 (2760, within 5 m of 2757) match the plan.
- **Files modified:** data/__tests__/photos.test.ts
- **Verification:** the DEM heights suite passes. A probe confirmed 1674.33 m at RESEARCH's LV95 point and 1668.21 m at the 4-dp point.
- **Committed in:** 012521f

**2. [Rule 2 - Missing critical] Generator guards for D-03 and unknown ids**
- **Found during:** Task 1
- **Issue:** The plan only described the happy path. If a film scan had no year override, the build would silently use the scan date as the capture. A typo in a corrections id would be silently ignored.
- **Fix:** The build now fails on a film-scan without `captureOverride`, on a corrections id missing from the sidecar, and on a Zurich wall time that is skipped or repeated at a DST change.
- **Files modified:** scripts/photos/build-photo-data.mjs
- **Committed in:** e85c931

**3. [TDD protocol] Task 2 split into test / feat / docs commits**
- The plan named a single `test(08-08)` commit. The TDD gate requires RED and then GREEN, so Task 2 shipped as RED (tests plus signature-only stubs), GREEN (formatters) and a separate docs commit for the wording.

---

**Total deviations:** 2 auto-fixed (1 plan-expectation bug, 1 missing critical) plus 1 commit-structure change required by TDD.
**Impact on plan:** No scope creep. The height change only affects the value 08-10 writes into copy.

## Issues Encountered

- Prettier reformatted `data/schemas/photo.ts`, the generator and `photos.test.ts` (formatting only, folded into the task commits).
- Discrepancy notes:
  - img-0662 is sampled at the sidecar's longitude 7.7103, not CONTEXT's 7.7104. The sidecar is correct (08-02). The height still matches RESEARCH (2,585 m).
  - The uv values differ from RESEARCH's table in the 4th decimal for the same full-precision reason (img-0605 0.6772 / 0.2742 vs 0.6775 / 0.2740).
  - The Riffelsee pin samples 2,760 m on the 10 m DEM, against the 2,756.6 m lake surface in swissALTI3D. That is within tolerance.
- Out of scope, not edited: PROJECT.md line 18 still says "photo waypoints placed by EXIF GPS/altitude", while D-17 uses DEM heights. Worth a wording pass when Phase 9 plans the waypoints.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- 08-10 (legacy bridge and copy review) can read `photos`, `formatCaptureLabel`, `formatMetres` and the exposure formatters. Tim confirms the Riffelsee pin and the meteorological season tags at that checkpoint.
- 08-12 (footer ticks) can read `position`, `uv` and `position.approximate` for the dashed Riffelsee tick.
- DATA-03 and DATA-04 are also declared by sibling plans that are still open, so `requirements.ready-ids` marks only DATA-02 and DATA-06 complete now.

## Self-Check: PASSED

- All 7 created files exist on disk.
- Commits e85c931, 012521f, 37d7073 and a3e6dea are ancestors of HEAD. `check evaluation-scope --plan 08-08` resolves them.
- Plan verification: `npm run lint` prints `photos:build: OK` (0 errors / 54 warnings, baseline unchanged). Full Jest: 25/25 suites and 355/355 tests (baseline 23 / 292). `npm run guard:tests` OK. `npm run type-check` clean.
- Acceptance: one `photos:build -- --check` in package.json, 0 imports in lib/photo-format.ts, the stale proof exits 1, 0 `Intl|toLocale` matches, 63 tests (at least 15) with no `.skip(` or `.only(`, and HOME-04 contains 1,617.

---
*Phase: 08-data-terrain-pipeline*
*Completed: 2026-10-24*
