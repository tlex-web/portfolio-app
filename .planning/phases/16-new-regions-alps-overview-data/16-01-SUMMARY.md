---
phase: 16-new-regions-alps-overview-data
plan: 01
subsystem: data
tags: [photos, exif, privacy, zod, sharp, dem, selftest]

requires:
  - phase: 15-region-plate-data-model
    provides: photo map, region and plate registries, per-plate DEM loading in photos:build, tempExifRoot and the terrain fixture plate pattern
provides:
  - "Phase-base client JS total (1,851,572 bytes, 24 files at 7a12661) for the Phase 16 client-chunk budget (base + 4,096 = 1,855,668 bytes)"
  - "Required precision ('4dp' | '3dp' | '2dp') and kind ('ground' | 'aerial') on every photo-map record; the four current records are 4dp / ground"
  - "Extraction-time rounding at the record's level, a rounded true-spot gps.groundM for coarse records, no GPS altitude for coarse or aerial records, and the DJI safety net"
  - "Precision-tagged positions and kind in data/generated/photos.ts; coarse EXIF positions approximate with radius 100 m / 1 km"
  - "scripts/photos/plate-dem.mjs: loadPlateDem, plateFor, toGrid, gridToUv, sampleAtGrid shared by both photo stages"
  - "selftest: gpsJpeg, tempPrivacyRoot, geoBatch and the seven privacy: cases"
  - "The D-25 coordinate scan procedure (scratchpad script, booleans only) that later plans rerun"
  - "Local convention: unrecorded originals live in the gitignored assets/photos-original/incoming/"
affects: [16-02, 16-08, 16-09, 16-11, 16-14, 16-16, 16-17, 16-18]

actuals:
  tokens: 17700
  tasks: 2
  commits: 2
plan_head_before: 7a1266176b0575bba8553b16350ac54e703784b9
plan_head_after: 2657f77def082a6c69cac38071f26812ada0797a

tech-stack:
  added: []
  patterns:
    - "Both photo stages reach a plate DEM only through scripts/photos/plate-dem.mjs; projection dispatches on source.crs"
    - "Privacy cases run the real stage scripts with --root on generated JPEGs whose EXIF GPS is hand-assembled; the true position is the extraction's own decoded input"
    - "Selftest calls lib/geo.ts in a child node (geoBatch, arguments on stdin) so the selftest process prints no module-type warning"

key-files:
  created:
    - scripts/photos/plate-dem.mjs
  modified:
    - data/schemas/photo.ts
    - data/photos/photo-map.json
    - scripts/photos/extract-exif.mjs
    - scripts/photos/build-photo-data.mjs
    - scripts/guards/selftest.mjs
    - data/generated/photos.ts
    - data/__tests__/photos.test.ts
    - data/__tests__/photo-map.test.ts

key-decisions:
  - "Fixture DEM ramp rises 1 m per 5 m east (not per 4 m): pixel-centre heights are then whole decimetres, so the grey16 PNG stores them exactly and bilinear samples equal the formula"
  - "A coarse photo positioned by a hand-placed correction is sampled at that public position in stage 2; gps.groundM is required only for a coarse EXIF position"
  - "D-25 gate: v2.0 planning files hold finer-than-published positions of the three published digital photos; the plan halts for Tim's call on history (no history rewrite attempted)"

patterns-established:
  - "D-25 scan: a scratchpad script reads originals in memory, git greps .planning/ (committed + working tree) and prints only per-file, per-kind booleans"
  - "Unrecorded originals are staged in assets/photos-original/incoming/ until their record exists; listOriginals reads only the top level"

requirements-completed: []

coverage:
  - id: D1
    description: "Phase-base client JS recorded before any Phase 16 edit"
    requirement: DATA-14
    verification:
      - kind: other
        ref: "rm -rf .next/static && npm run build, then the 15-01 byte-sum one-liner (see Phase-base client JS)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Required precision and kind on every photo-map record, no default; missing either fails photos:exif naming the file"
    requirement: DATA-14
    verification:
      - kind: unit
        ref: "data/__tests__/photo-map.test.ts#16 D-02: PhotoMap rejects a record without a precision (no default)"
        status: pass
      - kind: unit
        ref: "data/__tests__/photo-map.test.ts#16 D-04: PhotoMap rejects a record without a kind (no default)"
        status: pass
      - kind: integration
        ref: "scripts/guards/selftest.mjs#privacy: a record without a precision fails naming the file"
        status: pass
    human_judgment: false
  - id: D3
    description: "3dp / 2dp photos rounded before the write with a 10 m / 50 m true-spot ground height, no GPS altitude, and an approximate precision-tagged position"
    requirement: DATA-14
    verification:
      - kind: integration
        ref: "scripts/guards/selftest.mjs#privacy: a 3dp photo is rounded before the write, gets a 10 m ground height and an approximate position"
        status: pass
      - kind: integration
        ref: "scripts/guards/selftest.mjs#privacy: a 2dp photo gets a 50 m ground height and a 1 km radius"
        status: pass
    human_judgment: false
  - id: D4
    description: "Aerial photos keep no GPS altitude; a DJI still not marked aerial fails and writes nothing"
    requirement: DATA-14
    verification:
      - kind: integration
        ref: "scripts/guards/selftest.mjs#privacy: an aerial DJI still keeps no GPS altitude"
        status: pass
      - kind: integration
        ref: "scripts/guards/selftest.mjs#privacy: a DJI still not marked aerial fails and writes nothing"
        status: pass
    human_judgment: false
  - id: D5
    description: "Off-plate coarse photo and over-precise hand-placed position fail with messages that print no position or uv"
    requirement: DATA-14
    verification:
      - kind: integration
        ref: "scripts/guards/selftest.mjs#privacy: a coarse photo rounded off its plate fails without printing its position"
        status: pass
      - kind: integration
        ref: "scripts/guards/selftest.mjs#privacy: a hand-placed position finer than its precision fails"
        status: pass
    human_judgment: false
  - id: D6
    description: "Current data unchanged except the two new fields: sidecar and corrections byte-identical to 56d62af, photos.ts gains only 8 added precision/kind lines"
    requirement: DATA-14
    verification:
      - kind: other
        ref: "git diff --quiet 56d62af -- data/photos/exif-sidecar.json data/photos/corrections.json; the photos.ts added-lines-only check"
        status: pass
      - kind: unit
        ref: "data/__tests__/photos.test.ts#16 D-02, D-04: every position's precision and every fact's kind equal its photo-map record's"
        status: pass
    human_judgment: false
  - id: D7
    description: "D-25 coordinate scan run before the SUMMARY commit; matches in committed v2.0 planning files need Tim's decision"
    requirement: DATA-14
    verification:
      - kind: manual_procedural
        ref: "scratchpad d25-scan.mjs over .planning/ (see D-25 scan)"
        status: fail
    human_judgment: true
    rationale: "The scan found finer-than-published positions of the three published photos in committed v2.0 planning files; whether to rewrite history is Tim's call (plan reporting rule)"

duration: 23min
completed: 2026-11-23
status: halted
---

# Phase 16 Plan 01: Location Privacy Rules Summary

**Per-photo location precision ('4dp' / '3dp' / '2dp') and kind ('ground' / 'aerial') enforced at extraction: rounding before the sidecar write, a rounded true-spot DEM height for coarse photos, no GPS altitude for coarse or aerial photos, a DJI safety net, and approximate precision-tagged positions in the generated facts, all pinned by seven generated-JPEG selftest cases. Halted at the D-25 gate: committed v2.0 planning files hold finer-than-published positions of the three published photos.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-11-23T00:15:52Z
- **Completed:** 2026-11-23T00:39:03Z
- **Tasks:** 2 of 2 (the D-25 reporting rule then stops the plan)
- **Files modified:** 9

## Phase-base client JS

Measured before any Phase 16 edit and before Step 1, at HEAD `7a1266176b0575bba8553b16350ac54e703784b9`:

- **Total: 1,851,572 bytes in 24 `.js` files under `.next/static/chunks/`**
- Procedure: `rm -rf .next/static && npm run build`, then the script below from the repo root, then `git restore public/service-worker.js`.

```bash
node -e "const fs=require('fs'),p=require('path');let t=0,n=0;(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=p.join(d,e.name);if(e.isDirectory())w(f);else if(f.endsWith('.js')){t+=fs.statSync(f).size;n++}}})('.next/static/chunks');console.log(t+' bytes in '+n+' files')"
```

Every later Phase 16 budget check is at most 1,855,668 bytes (base + 4,096).

## Pre-ingest gate (Step 1)

Moved unopened from the top level of `assets/photos-original/` into the gitignored `assets/photos-original/incoming/` (no record, sidecar entry or derivative created):

- `20160717_120906-Topaz-Sharpen-Strong-Denoise.jpg`
- `20210912_193833.jpg`
- `20240910_143659.jpg`
- `20260916_125705.jpg`
- `IMG_0682.jpg`
- `_MG_0680.jpg`
- `dji_fly_20260919_162232_0153_1789843115521_photo.jpg`
- `dji_fly_20260919_163558_0163_1789843047771_photo.jpg`

`npm run photos:exif -- --check` then printed `photos:exif: OK` on the four recorded originals. `git ls-files -co --exclude-standard -- assets/photos-original` is empty.

## Accomplishments

- `data/schemas/photo.ts`: `Precision` and `PhotoKind` enums; required `precision` and `kind` on `PhotoMapEntry`; optional integer `gps.groundM`; required `Position.precision` (after `lon`); required `PhotoFacts.kind` (after `country`). `Position` and `CorrectionPosition` are both built from one unrefined field object and two named refine predicates; `CorrectionPosition` has no `precision` and stays strict, so a corrections position carrying one fails.
- `scripts/photos/plate-dem.mjs` (new): the DEM loader moved out of stage 2 (sha256 check and messages unchanged), `plateFor`, `toGrid` (EPSG:2056 only; any other CRS throws naming the module), `gridToUv`, `sampleAtGrid`.
- `extract-exif.mjs`: names the file when a record lacks `precision` or `kind`; rounds latitude and longitude with `Math.round(v * 10 ** d) / 10 ** d`; `altM` null for coarse or aerial records; coarse records sample their plate DEM at the true position in memory (lazy, one load per plate) and write `groundM` rounded to 10 m or 50 m; a true position off the plate fails naming the file and plate; a still whose Make lower-cases to `dji` on a non-aerial record fails and nothing is written. No message prints a position, uv or altitude.
- `build-photo-data.mjs`: positions carry their record's precision (`lat, lon, precision, source, approximate, …`); 3dp / 2dp EXIF positions are approximate with the "about 100 m" / "about 1 km" reason and radius 100 / 1000; a sidecar or corrections position finer than its precision fails; coarse EXIF photos take `gps.groundM` as their elevation (missing fails, and a 4dp photo carrying one fails); `kind` is copied after `country`; the off-extent message no longer prints the uv.
- The four current photos: sidecar byte-identical; `data/generated/photos.ts` gains exactly 8 added lines (4 `kind`, 4 `precision`) and no removed line relative to 56d62af; `data/photos/corrections.json` byte-identical.
- Selftest: 269 -> 276 cases, all passing (`selftest: 276/276 cases passed`), including the seven `privacy:` cases. Mutation checks during execution: making 3dp keep 4 decimals fails the tracer; keeping an aerial altitude and disabling the DJI net fail the two DJI cases.
- `npm run lint`, `npm run data:check`, `npm run type-check`, `npm run guard:tests:scan` and the full Jest suite (113 suites, 1,916 tests) pass.

## Task Commits

1. **Task 1: A 3dp photo end to end (tracer)** - `2deaa6c` (feat). Tracer feedback gate: auto mode off, `end-of-phase` verify mode, automated-only `<verify>`; re-ran end to end and passed, then expanded.
2. **Task 2: The 2dp, aerial, DJI, missing-precision, off-plate and hand-placed cases, and the schema tests** - `2657f77` (test)

**Plan metadata:** this SUMMARY commit (docs)

## Files Created/Modified

- `scripts/photos/plate-dem.mjs` - shared plate DEM loader, region-to-plate lookup and CRS dispatch
- `data/schemas/photo.ts` - Precision, PhotoKind, required record fields, gps.groundM, Position.precision, CorrectionPosition without precision, PhotoFacts.kind
- `data/photos/photo-map.json` - the four records gain `"precision": "4dp"` and `"kind": "ground"`
- `scripts/photos/extract-exif.mjs` - rounding at the record's level, groundM, altitude drop, DJI net, missing-field messages
- `scripts/photos/build-photo-data.mjs` - precision-tagged and approximate coarse positions, finer-than-precision guard, groundM elevation, kind, uv-free off-extent message
- `data/generated/photos.ts` - regenerated (added precision and kind lines only)
- `scripts/guards/selftest.mjs` - gpsJpeg, tempPrivacyRoot, geoBatch, seven privacy cases; tempExifRoot and img-9999 records gain the two fields; the G5 off-plate expectation names the plate and asserts no uv is printed
- `data/__tests__/photos.test.ts` - the two `Position rejects …` cases gain `precision: '4dp'` in place; new precision/corrections case; precision and kind equal the record's
- `data/__tests__/photo-map.test.ts` - missing precision / kind cases; D-02 test reads 4dp / ground

## Decisions Made

- Fixture ramp slope 1 m per 5 m (see Deviations 1).
- A coarse photo with a hand-placed correction is sampled in stage 2 at the hand-placed (public, precision-checked) position; `gps.groundM` is required only for a coarse EXIF position.
- The plan halts at the D-25 gate for Tim (see D-25 scan); no planning file was edited and no history was rewritten.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixture DEM ramp formula**
- **Found during:** Task 1 (Step 6, tempPrivacyRoot)
- **Issue:** The plan's ramp, height = 1,000 + (E - 2,600,000) / 4, gives pixel-centre heights ending in half a decimetre, which a grey16 decimetre PNG cannot store, so bilinear samples would not equal the formula.
- **Fix:** height = 1,000 + (E - 2,600,000) / 5; every pixel centre is a whole number of decimetres and samples are exact between the outermost centres.
- **Files modified:** scripts/guards/selftest.mjs
- **Verification:** the 3dp, 2dp and aerial cases compare the written heights with the formula and pass.
- **Committed in:** 2deaa6c

**2. [Rule 3 - Blocking] lib/geo.ts called through a child node, arguments on stdin**
- **Found during:** Task 1 and Task 2
- **Issue:** Importing `lib/geo.ts` into the selftest process prints a MODULE_TYPELESS_PACKAGE_JSON warning on every run; the off-plate scan's 1,500-candidate batch then overflowed the Windows command line when passed inline.
- **Fix:** `geoBatch(fn, args)` spawns node with the photo scripts' flag and reads its arguments from stdin.
- **Files modified:** scripts/guards/selftest.mjs
- **Verification:** all seven privacy cases pass; no warning in the selftest output.
- **Committed in:** 2deaa6c, 2657f77

**3. [Rule 2 - Missing critical] The existing G5 off-plate case now asserts no uv or position is printed**
- **Found during:** Task 1 (Step 5)
- **Issue:** The rewritten expectation alone would not catch a uv creeping back into the message (T-16-03).
- **Fix:** a `check` that fails when the output holds `uv` or the case's own test position.
- **Files modified:** scripts/guards/selftest.mjs
- **Committed in:** 2deaa6c

---

**Total deviations:** 3 auto-fixed (1 bug, 1 blocking, 1 missing critical)
**Impact on plan:** fixture and harness details only; every privacy rule is implemented as specified.

## Issues Encountered

- The D-25 scan stops the plan (next section). Everything else passed first time after the fixes above.

## D-25 scan

Run after this SUMMARY was written and before it was committed, by a scratchpad script (never in the repository) over `.planning/` with `git grep --untracked -F -l` (committed files and the working tree, including this SUMMARY). Originals scanned: 12 (top level and `incoming/`; `not-in-series/` does not exist yet). String kinds per original: latitude and longitude at 2, 3 and 4 decimals (fixed and trailing-zero-trimmed); LV95 E and N at 1 m and 10 m via `wgs84ToLv95`, each with no separator and with comma, apostrophe, right single quote, space and narrow no-break space separators; GPS altitude at 0.1 m and whole metres. EPSG:3035 E/N at 1 m and 10 m: **not available yet** for every original (`toGrid` has no EPSG:3035 before 16-09). This SUMMARY matched nothing.

| Original | match: yes (kinds) | match: no (kinds) |
|---|---|---|
| `IMG_0605-Enhanced (2022_02_01 09_47_03 UTC).jpg` | lat/lon 2dp, 3dp, 4dp; LV95 E/N 1 m; LV95 E/N 10 m; altitude 0.1 m and 1 m | none |
| `IMG_0629-Enhanced (2022_07_29 07_19_54 UTC).jpg` | lat 2dp, 3dp, 4dp; lon 2dp, 4dp; LV95 E/N 1 m; LV95 E 10 m; altitude 0.1 m and 1 m | lon 3dp; LV95 N 10 m |
| `IMG_0662-Enhanced (2022_07_29 07_19_54 UTC).jpg` | lat 2dp, 4dp; lon 2dp, 3dp, 4dp; LV95 E 1 m; altitude 0.1 m and 1 m | lat 3dp; LV95 N 1 m; LV95 E/N 10 m |
| `R004-011-Edit-Enhanced (2021_11_13 16_58_47 UTC).jpg` | no GPS position (nothing to search) | - |
| `incoming/20160717_120906-Topaz-Sharpen-Strong-Denoise.jpg` | no GPS position (nothing to search) | - |
| `incoming/20210912_193833.jpg` | no GPS position (nothing to search) | - |
| `incoming/20240910_143659.jpg` | lat 2dp (reviewed anchor) | all other kinds |
| `incoming/20260916_125705.jpg` | lon 2dp, altitude 1 m (both reviewed coincidental) | all other kinds |
| `incoming/IMG_0682.jpg` | lat 2dp, lon 2dp (reviewed anchors) | all other kinds |
| `incoming/_MG_0680.jpg` | lat 2dp, lon 2dp (reviewed anchors); altitude 1 m (reviewed coincidental) | all other kinds |
| `incoming/dji_fly_20260919_162232_0153_1789843115521_photo.jpg` | altitude 1 m (reviewed coincidental) | all other kinds |
| `incoming/dji_fly_20260919_163558_0163_1789843047771_photo.jpg` | altitude 1 m (reviewed coincidental) | all other kinds |

**Review of the eight incoming originals (unpublished):** no 3-decimal, 4-decimal, LV95 or 0.1 m altitude string of any incoming original appears in any planning file. Their 2-decimal matches sit on lines whose subject is the Matterhorn summit (the v2.0 hero kicker and the reference-point list), the Zermatt region longitude in the Phase 16 overview text, and the published 4-decimal positions of the current digital photos, which begin with the same two decimals (a Zermatt-area cell, no new information). The `20260916_125705.jpg` longitude match is a software version number in `.planning/research/PITFALLS.md`. Every whole-metre altitude match is a digit run inside a commit hash, a CI run id, a byte or test count, or the published Riffelsee pin coordinate.

**Pre-existing, known:** the D-01 format example in `16-CONTEXT.md` and `16-RESEARCH.md` equals `IMG_0605`'s published 3- and 4-decimal latitude.

**Pre-existing, published-equal:** the 4-decimal positions of the three digital photos are public in `data/generated/photos.ts`, and their 0.1 m GPS altitudes are public in the committed `data/photos/exif-sidecar.json`. Many v2.0 planning files quote them; the 10 m LV95 match in `.planning/research/STACK.md` is converted from the shipped 4-decimal position and rounded to 10 m.

**Stops the plan (committed files, finer than published; Tim's call):** these already committed v2.0 planning files hold positions of the published digital photos finer than the 4-decimal published value (5-decimal latitude/longitude strings, or LV95 eastings/northings at 1 m):

- `.planning/milestones/v2.0-phases/08-data-terrain-pipeline/08-01-PLAN.md` (IMG_0605: 5-decimal lat/lon, LV95 1 m)
- `.planning/milestones/v2.0-phases/08-data-terrain-pipeline/08-01-SUMMARY.md` (IMG_0605: 5-decimal lat)
- `.planning/milestones/v2.0-phases/08-data-terrain-pipeline/08-02-PLAN.md` (IMG_0605: 5-decimal lat)
- `.planning/milestones/v2.0-phases/08-data-terrain-pipeline/08-02-SUMMARY.md` (IMG_0605: 5-decimal lat)
- `.planning/milestones/v2.0-phases/08-data-terrain-pipeline/08-04-SUMMARY.md` (IMG_0605: LV95 E 1 m)
- `.planning/milestones/v2.0-phases/08-data-terrain-pipeline/08-08-SUMMARY.md` (IMG_0605: 5-decimal lat/lon)
- `.planning/milestones/v2.0-phases/08-data-terrain-pipeline/08-RESEARCH.md` (IMG_0605: 5-decimal lat/lon, LV95 1 m; IMG_0629 and IMG_0662: LV95 1 m / 10 m)
- `.planning/milestones/v2.0-research/STACK.md` (all three: 5-decimal lat/lon; IMG_0605 and IMG_0629: LV95 1 m)

(The 5-decimal check is a supplementary pass beyond the plan's string kinds, run to separate finer-than-published values from published-equal ones.) Nothing in a file this plan wrote matched, so nothing was removed. No planning file was edited and no history was rewritten.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Blocked on Tim: decide whether the eight v2.0 planning files above stay in history as they are (the photos are published at 4 decimals in the same repository) or need a history rewrite. When he decides, set `status: complete` here; 16-02 onward depend on this plan.
- Ready for 16-02 once unblocked: the privacy rules, the plate-dem module, the incoming/ staging convention and the D-25 scan procedure are in place. New originals stay in `assets/photos-original/incoming/` until their record (with Tim's per-photo precision, 16-08) exists.

## Self-Check: PASSED

- FOUND: scripts/photos/plate-dem.mjs, this SUMMARY
- FOUND: 2deaa6c, 2657f77 (both ancestors of HEAD; evaluation-scope resolves both for 16-01)
- Acceptance criteria rerun: all pass (Precision in the schema, 4 x `"precision": "4dp"`, the new photos.test.ts case, plate-dem in both stages, no tracked or unignored original, 8 files in incoming/, the phase-base total, type-check, 276/276 selftest with 7 privacy cases, guard:tests:scan)
- Plan status `halted` only because of the D-25 reporting rule above

---
*Phase: 16-new-regions-alps-overview-data*
*Completed: 2026-11-23*
