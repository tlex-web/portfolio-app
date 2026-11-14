---
phase: 15-region-plate-data-model
plan: 07
subsystem: data
tags: [photo-pipeline, exif, photo-map, selftest]
status: complete

requires:
  - phase: 15-06
    provides: "data/photos/photo-map.json and the PhotoMap schema (with the duplicate-file superRefine) that photos:exif now reads"
provides:
  - "photos:exif --root <dir>: every read and write (originals, map, sidecar) follows the root; parseArgs ported from build-photo-data.mjs"
  - "photos:exif parses data/photos/photo-map.json with PhotoMap in both modes, CI included"
  - "idFor(file, map) replaces idFromFile: ids come only from the map; an unmapped original fails with 'add a record for <file> to data/photos/photo-map.json' (D-01)"
  - "selftest: tempExifRoot({ mapEdit }) on sharp-generated JPEGs and three photos:exif cases"
affects: [15-08, 15-11, 16]

actuals:
  tokens: 3833
  tasks: 2
  commits: 2
plan_head_before: 6088fed0f70cbbfba30acebf3b04440dfe5a700e
plan_head_after: c6353b5f17e457e8e0f99a2e868cf8419e169865

tech-stack:
  added: []
  patterns:
    - "Both photo scripts share the same --check / --root parseArgs shape, parsed before any ROOT-derived path"
    - "Map schema issues print one line each, prefixed with the map path, then a single '<map>: N schema violations' error"

key-files:
  created: []
  modified:
    - scripts/photos/extract-exif.mjs
    - scripts/guards/selftest.mjs

key-decisions:
  - "The photo map is loaded before the originals are listed in write mode and after the sidecar schema check in --check mode, so a bad map fails both modes, with or without originals"
  - "idFor is a linear lookup on the map's records by exact file name; the original's name is never parsed"
  - "The selftest's second original is IMG_0605.jpg, a name the old regex would have called img-0605, mapped to img-9002, so case 1 proves both a never-parseable name (DJI_0001.JPG) and a would-collide name take the map's id"
  - "The failing photos:exif cases also assert no sidecar was written"

patterns-established:
  - "Extraction fixtures are sharp-generated JPEGs in a temp root, built with top-level await; nothing from assets/photos-original/ is copied"

requirements-completed: [DATA-10]

coverage:
  - id: D1
    description: "photos:exif takes each original's id from data/photos/photo-map.json, and the real sidecar rewrites byte for byte"
    requirement: "DATA-10"
    verification:
      - kind: other
        ref: "npm run photos:exif then git status --porcelain -- data/photos/exif-sidecar.json is empty; npm run photos:exif -- --check (photos:exif: OK)"
        status: pass
      - kind: integration
        ref: "npm run guard:selftest#photos:exif: ids come from the photo map"
        status: pass
    human_judgment: false
  - id: D2
    description: "An unmapped original and two records naming one file both fail photos:exif and write no sidecar"
    requirement: "DATA-10"
    verification:
      - kind: integration
        ref: "npm run guard:selftest (232/232; three 'PASS photos:exif: ' cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Without originals (CI), photos:exif --check still parses the map and keeps the 'originals absent, schema OK, hash check skipped' path"
    requirement: "DATA-10"
    verification:
      - kind: other
        ref: "extract-exif.mjs --check --root <temp root with sidecar + map only> prints the skipped line and OK; with the map removed it exits 1 ('photo-map.json is missing')"
        status: pass
    human_judgment: false

duration: 6 min
completed: 2026-11-14
---

# Phase 15 Plan 07: Map-driven photos:exif ids Summary

**photos:exif now assigns each original's id by looking up its file name in data/photos/photo-map.json (idFor), gains --root, parses the map in both modes, and three selftest cases on sharp-generated JPEGs prove that a DJI-named original is mapped and that an unmapped or doubly mapped original fails.**

## Performance

- **Duration:** about 6 min
- **Started:** 2026-11-14T21:14:39Z
- **Completed:** 2026-11-14T21:20:04Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `extract-exif.mjs`: `parseArgs` (`--check`, `--root <dir>`) ported from `build-photo-data.mjs`; `ORIGINALS_DIR`, `SIDECAR_PATH` and the new `PHOTO_MAP_PATH` derive from the parsed root.
- `loadPhotoMap()` parses the map with `PhotoMap` in write mode and in `--check` (with or without originals); a duplicate file fails through the 15-06 superRefine.
- `idFromFile` (the `IMG_`/`R` regex) is gone; `idFor(file, map)` returns the key of the record whose `file` equals the original's name, else throws `add a record for <file> to data/photos/photo-map.json`.
- With the real originals present, `npm run photos:exif` rewrote `data/photos/exif-sidecar.json` byte for byte; `photos:exif -- --check` and `data:check` print OK.
- `selftest.mjs`: `tempExifRoot({ mapEdit })` and the cases `photos:exif: ids come from the photo map`, `... an original with no photo-map record fails`, `... two records naming one file fail`; all three roots join the cleanup list (no temp root leaked).

## Task Commits

1. **Task 1 (tracer): photos:exif reads the map end to end** - `3fb2450` (feat)
2. **Task 2: selftest proves map-driven ids** - `c6353b5` (test)

## Files Created/Modified

- `scripts/photos/extract-exif.mjs` - `--root`, the map parse, `idFor` in place of the file-name regex; header doc updated for the new id rule and flag
- `scripts/guards/selftest.mjs` - `tempExifRoot`, `exifSidecarIds`, `noExifSidecar` and the three `photos:exif` cases

## Decisions Made

See `key-decisions` in the frontmatter. In short: the map is parsed in both modes before ids are needed; the second fixture original is a would-collide `IMG_0605.jpg`, so case 1 covers both failure modes of a name-derived id.

## Deviations from Plan

None - plan executed exactly as written. (Small additions within the plan's scope: the second fixture original is named `IMG_0605.jpg` rather than an arbitrary name, and the two failing cases also check that no sidecar was written.)

## Issues Encountered

None. The working copy of `extract-exif.mjs` is CRLF (autocrlf), so a scripted multi-line replace did not match; it exited before writing anything and the edits were made with the Edit tool instead.

## Verification

- `npm run photos:exif -- --check`: `photos:exif: OK` (originals present, hash check ran)
- `grep -c "function idFromFile" scripts/photos/extract-exif.mjs`: 0; `'--root'`: 1; `photo-map.json`: 3
- `npm run photos:exif && test -z "$(git status --porcelain -- data/photos/exif-sidecar.json)"`: exit 0
- `npm run data:check`: exit 0 (terrain, photos:exif, photos:derive, photos:build, tokens, trails, clips all OK)
- `npm run guard:selftest`: `selftest: 232/232 cases passed`, 3 lines `PASS photos:exif: `
- `npm run lint`: exit 0 (ends with `test-count: scan OK`); `npm run type-check`: exit 0

## Next Phase Readiness

D-01's file-to-id map is in force on both photo scripts. Phase 16 can add DJI stills or a second camera's originals by adding map records; no name rule applies. Ready for 15-08.

## Self-Check: PASSED

- FOUND: scripts/photos/extract-exif.mjs, scripts/guards/selftest.mjs
- FOUND commits on this branch: 3fb2450, c6353b5
