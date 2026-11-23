---
phase: 16-new-regions-alps-overview-data
plan: 16
subsystem: data
tags: [terrain, plates, swissaltiregio, epsg-2056, ortler, footprint, privacy]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-11 terrain:fetch --plate/--extent/--out; 16-12 plateSourceFiles() in the selftest and the saalfelden sheet test as a model; 16-15 the overview build (overview.ts byte-identical) and the guard's plates.ts manifest read"
provides:
  - "data/terrain/plates/ortler/: the committed swissALTIRegio source (dem-10m.png + sha256-pinned source.json, EPSG:2056, LN02, edition 2026-05)"
  - "plates.json ortler entry (2D, hero + strip, hillshade 1100/640, strip.centreN 1,156,000); six ortler-* files in public/terrain; an EPSG:2056 sheet in plates.ts"
  - "plates.test: 'the ortler sheet is a compact EPSG:2056 swissALTIRegio plate'"
affects: [16-17, 16-18, 18]

actuals:
  tokens: 970      # chars/4 over the hand-written and generated text diff (plates.json, plates.ts, plates.test.ts, source.json); the PNG and the six served assets are not counted
  tasks: 2         # Tasks 2 and 3 in this run; Task 1 was Tim's checkpoint
  commits: 2
plan_head_before: 5f74fa386bd85f423d444f5689e1577b7046a9a7
plan_head_after: 00676be0d8842fb6f9f77c0d104f38ab13564d89

tech-stack:
  added: []
  patterns:
    - "Footprint extent search: start at the default plate side, move on the 1 km grid, grow only when the side cannot hold every file at 4dp, 3dp and 2dp with 1 km margin; prefer a square that still holds the region's public anchor, then the least shift from the default"

key-files:
  created:
    - data/terrain/plates/ortler/dem-10m.png
    - data/terrain/plates/ortler/source.json
    - public/terrain/ortler-contours-hero.126ad63294.svg
    - public/terrain/ortler-contours-strip.6f4fcf30ca.svg
    - public/terrain/ortler-hillshade-1100.1718df8edc.avif
    - public/terrain/ortler-hillshade-1100.6eba7241a2.webp
    - public/terrain/ortler-hillshade-640.6d0f445c9e.avif
    - public/terrain/ortler-hillshade-640.4b688084d8.webp
  modified:
    - data/terrain/plates.json
    - data/generated/plates.ts
    - data/__tests__/plates.test.ts

key-decisions:
  - "Ortler extent W 2,834,000 S 1,150,000 E 2,846,000 N 1,162,000 (12 km): the summit-centred default moved 2 km east on the 1 km grid, because one of Tim's two files is outside the default; the moved square holds both files at every precision with 1 km margin and still holds the Ortler summit"
  - "'Smallest square' read with D-10 and D-27: the search starts at the default 12 km side (D-27 'the extent moves'; D-10 'about 10-20 km'), not at the smallest side the photos alone would allow; 12 km fit, so no growth was needed"
  - "strip.centreN 1,156,000, the extent's centre northing (planner decision, IN-05)"

requirements-completed: [DATA-13]   # copied from the plan; REQUIREMENTS.md ticking is subject to the shared-ID gate (16-17, 16-18 also declare DATA-13)

coverage:
  - id: D1
    description: "D-27 / D-12: Tim copied GPS-tagged Ortler exports into incoming/; a booleans-only footprint check fixed the extent"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "scratchpad 16-16-footprint.mjs (booleans, make, model and the chosen extent only); both files have GPS and fit the chosen extent at 4dp, 3dp and 2dp with 1 km margin"
        status: pass
    human_judgment: true
  - id: D2
    description: "D-07 / D-11 / D-10: the plate comes from swissALTIRegio through terrain:fetch --plate ortler; terrain:build writes six ortler-* files and an EPSG:2056 sheet within PLATE_BUDGET; source PNG at most 2,000,000 B"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "npm run terrain:fetch -- --plate ortler --extent 2834000,1150000,2846000,1162000 (OK); wc -c dem-10m.png = 1,564,044; npm run terrain:build -- --check (terrain: OK)"
        status: pass
      - kind: unit
        ref: "data/__tests__/plates.test.ts#ortler serves and fetches within its budget"
        status: pass
    human_judgment: false
  - id: D3
    description: "Matterhorn, Home, terrain.ts, precache.json and overview.ts byte-unchanged"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "git diff --quiet HEAD -- data/generated/terrain.ts data/generated/precache.json data/generated/home-plate.ts data/generated/overview.ts data/terrain/source (exit 0, before and after the Task 2 commit)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The ortler sheet's facts are pinned by a test"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "data/__tests__/plates.test.ts#the ortler sheet is a compact EPSG:2056 swissALTIRegio plate"
        status: pass
    human_judgment: false
  - id: D5
    description: "No client chunk carries the ortler sheet; client JS within the 16-01 base + 4,096 B"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "rm -rf .next/static && npm run build; 15-01 byte sum 1,851,685 B in 24 files; grep -rl '\"ortler\"\\|ortler-contours' .next/static/chunks = 0 files"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-11-23
---

# Phase 16 Plan 16: Ortler plate from swissALTIRegio Summary

**Ortler now has its own swissALTIRegio plate in `data/terrain/plates/ortler/`: a 1200 × 1200 grey16 PNG at 10 m on LV95, LN02, edition 2026-05, pinned by sha256. One of Tim's two GPS-tagged Ortler exports lay outside the summit-centred default, so a booleans-only footprint check moved the 12 km square 2 km east on the 1 km grid. The moved square holds both files at every precision with 1 km margin and still holds the summit. The registry entry builds six `ortler-*` files and an EPSG:2056 sheet. The plate serves 320,211 B and fetches 140,118 B per visit. Matterhorn, Home, `terrain.ts`, `precache.json` and `overview.ts` are byte-unchanged, and no client chunk contains the sheet.**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-11-23T13:11:07Z (this continuation, after Task 1)
- **Completed:** 2026-11-23T13:20Z
- **Tasks:** 2 executed here (Task 1 was Tim's checkpoint)
- **Files modified:** 11 (8 created, 3 modified)

## Task 1: Tim's reply (checkpoint:human-action)

- **Tim's literal reply:** "copied" (he gave no file names).
- The orchestrator then listed `assets/photos-original/incoming/`, printing only booleans, make and model. It held exactly two files, which are treated as the Ortler files Tim named:
  - `20160717_120906-Topaz-Sharpen-Strong-Denoise-2.jpg`
  - `20160717_124904-Topaz-Sharpen-Auto-Denoise-2.jpg`
- The no-GPS `20160717_120906-Topaz-Sharpen-Strong-Denoise.jpg` that the plan's objective named is gone. Tim replaced it with the `-2` re-export, which carries a GPS position.
- Tim also moved the S20 and S25 originals himself. `20210912_193833.jpg` and `20260916_125705.jpg` are now in `assets/photos-original/not-in-series/`, as the orchestrator verified. This closes the STATE.md todo from 16-14.

## Footprint check (booleans only)

The check ran from a scratchpad script (`16-16-footprint.mjs`), outside the repository. It read each file's EXIF in memory and projected the position with `lib/geo.ts`. It printed only the fields below and the chosen extent. No position, altitude or grid value of a photo was printed, written or committed.

| File | Make / Model | GPS | GPS altitude | Make is DJI | Inside default 4dp / 3dp / 2dp | Inside chosen 4dp / 3dp / 2dp |
|---|---|---|---|---|---|---|
| `20160717_120906-Topaz-Sharpen-Strong-Denoise-2.jpg` | samsung SM-G930F | yes | no | no | yes / yes / yes | yes / yes / yes |
| `20160717_124904-Topaz-Sharpen-Auto-Denoise-2.jpg` | samsung SM-G930F | yes | no | no | no / no / no | yes / yes / yes |

- "Inside" means inside the plate with at least 1 km margin on every side.
- **Default:** W 2,832,000 S 1,150,000 E 2,844,000 N 1,162,000 (research, centred on the summit). It does not hold the second file.
- **Search:** the 1 km grid, starting at the default 12 km side and growing to at most 20 km only if needed. Among squares of the same size it prefers one that holds the Ortler summit (a public anchor, not a photo), then the smallest shift from the default.
- **Chosen extent:** **W 2,834,000 S 1,150,000 E 2,846,000 N 1,162,000** (12 × 12 km). It holds the Ortler summit with 1 km margin: yes.
- **Files without GPS:** none among the Ortler files.
- **Note for 16-17:** neither file has a GPS altitude, so its height has to come from the plate DEM.

## The Ortler plate

| Measure | Value |
|---|---|
| Fetch | `npm run terrain:fetch -- --plate ortler --extent 2834000,1150000,2846000,1162000`: OK. The STAC item `swissaltiregio` (datetime 2026-05-28) gives COG `swissaltiregio_2056_5728.tif` |
| Dry run | The same command with `--out` into the scratchpad ran first (no nodata). The repo PNG is byte-identical to it |
| Source PNG | 1200 × 1200 grey16, **1,564,044 B** (cap 2,000,000 B); sha256 `ece77fb2b768…`. The committed blob hashes to it |
| Height range | 1351.6..3890.8 m (the plate terrain minimum and maximum, LN02) |
| Served | **320,211 B** (cap 550,000 B for a 2D plate): hero SVG 52,114 and strip SVG 23,909; hillshade 1100 AVIF 64,095 and WebP 100,716; hillshade 640 AVIF 29,935 and WebP 49,442 |
| Fetched per visit | **140,118 B** (cap 250,000 B): the AVIF 1100 poster, the hero and the strip |
| RESEARCH estimate (default extent) | 326,774 B served and 141,438 B fetched |

The strip window in the sheet is N 1,154,800..1,157,200 around `centreN` 1,156,000, across the full plate width.

## Accomplishments

- **Task 2 (tracer):** the footprint check, the fetch, and the registry entry, placed between matterhorn and saalfelden exactly as the plan gives it with `strip.centreN` 1,156,000. Then `terrain:build` and `terrain:build -- --check`.
  - The build rewrote Matterhorn, saalfelden, the overview and the four home and generated modules byte-identically. It added only the six `ortler-*` files and the sheet.
  - `scripts/guards/selftest.mjs` and `check-served-images.mjs` needed no edit. The selftest copies the ortler source through `plateSourceFiles()`, and the guard reads the new URLs from `plates.ts`.
- **Task 3:** a new test in `plates.test.ts`, `the ortler sheet is a compact EPSG:2056 swissALTIRegio plate`. It checks:
  - id, prefix, `home: false` and `threeD: false`
  - crs `EPSG:2056`, and `extent.lv95` equals the chosen box, with no laea
  - a square of 12,000 m, at most 20,000 m
  - dem `{ swissALTIRegio, 2026-05, 10 }`
  - no heightmap; contours `hero` and `strip` only, with no map LOD
  - the strip carries lv95
  - the registry source and `strip.centreN` at the extent's centre

  The existing per-sheet budget `test.each` now also covers ortler.

## Task Commits

1. **Task 2: The Ortler plate end to end (tracer).** `3fb2862` (feat).
   - Tracer gate: auto mode is off, `human_verify_mode` is end-of-phase, and `<verify>` is automated only. After the commit I re-ran `terrain:build -- --check` (terrain: OK) and the six-file `git diff --quiet` check against `HEAD~1` (exit 0). No checkpoint was needed.
   - Lint was green on the staged tree before this commit, so no red range was left.
2. **Task 3: Pin the Ortler sheet and keep it out of client chunks.** `00676be` (test).

## Verification

- **Terrain build:** `npm run terrain:build -- --check` printed `terrain: OK`, both before and after the Task 2 commit.
- **Plan verify 2:** `test "$(ls public/terrain | grep -c '^ortler-')" -ge 6 && git diff --quiet HEAD -- data/generated/terrain.ts data/generated/precache.json data/generated/home-plate.ts data/generated/overview.ts data/terrain/source` exited 0.
- **Acceptance:**
  - `grep -c '"crs": "EPSG:2056"' data/terrain/plates/ortler/source.json` printed 1.
  - `wc -c dem-10m.png` gave 1,564,044, under the 2,000,000 B cap.
- **Jest:**
  - `npx jest data/__tests__/plates.test.ts data/__tests__/terrain.test.ts data/__tests__/overview.test.ts`: 131/131 passed.
  - With `photo-map.test.ts` added, before the new test: 148/148 passed.
  - The full suite: 115 suites, 1,997 tests, all passed.
- **Client JS:** **1,851,685 B in 24 files**, unchanged from 16-15. The 16-01 base is 1,851,572 B (+113 B), and the cap is 1,855,668 B.
  - Procedure: `rm -rf .next/static && npm run build`, the 15-01 byte sum, then `git restore public/service-worker.js`.
  - `grep -rl '"ortler"\|ortler-contours' .next/static/chunks | wc -l` printed 0.
- **Lint and types:**
  - `npm run lint` exited 0 at both commits, with selftest 290/290 and `served-images: OK`.
  - `npm run type-check` exited 0.
  - Prettier is clean on `plates.test.ts`.

## Deviations from Plan

### Interpretation (documented, not a code change)

**1. [Rule 1 - Ambiguity] "the smallest square of at most 20 km" read together with D-10 and D-27**
- **Found during:** Task 2 (the footprint search)
- **Issue:** read literally, "smallest" would allow a plate a few km across, built around just two photos. D-10 sets new plates at about 10 to 20 km, near the Matterhorn's 11 km. D-27 says the default plate "moves on the plate grid".
- **Resolution:** the search starts at the default 12 km side and grows only if needed. 12 km fit, so the plate keeps the research size, budget and summit framing, moved 2 km east.
- **Files modified:** none (scratchpad script only).

### Issues Encountered

- **Scratch script bug (scratchpad only, nothing committed).** The first footprint run reported every file outside every square.
  - **Cause:** `lib/geo.ts` returns `{ e, n }`, but the script read `{ E, N }`. Every comparison ran on `undefined` and came out false.
  - **Fix:** the script now maps the fields and throws on any non-finite value. The fixed run gave the results above.
  - Nothing was fetched or written on the wrong result: the fetch ran only after the fixed run.

**Total deviations:** one interpretation, recorded. **Impact:** none on scope. Without the bug fix, a false "no square fits" stop would have been reported to Tim.

## D-25 scan

- **Runs:**
  - The baseline ran before any edit.
  - The final run was made after both task commits, with this SUMMARY in the working tree and before the SUMMARY commit.
  - Both used the scratchpad scan `d25-scan-1609.mjs`, which prints booleans and file names only.
- **Coverage:** 13 originals. This is the first scan that covers Tim's two new Ortler files, and the first after the S20 and S25 files moved to `not-in-series/`.
- **Results:**
  - Both new Ortler files: no match anywhere in `.planning/` at lat or lon 2dp, 3dp or 4dp, LV95 E/N at 1 m or 10 m, or EPSG:3035 E/N at 1 m or 10 m. Both report "GPS altitude: none in EXIF".
  - Every other line equals 16-15's final run, apart from the S20 and S25 path prefix (`incoming/` became `not-in-series/`). No existing `.planning/` file gained a match.
  - No line names a 16-16 file.
- **The final run equals the baseline.** The only numbers this SUMMARY records are the two plate extents, the strip window and the plate's terrain heights. All of them are plate-grid or terrain values, not photo values.

## Decisions Made

- **Ortler extent:** W 2,834,000 S 1,150,000 E 2,846,000 N 1,162,000. It is the default moved 2 km east on the 1 km grid, decided on booleans alone.
- **strip.centreN:** 1,156,000, the extent's centre northing (planner decision, IN-05).
- **No region yet:** the ortler region is not added to `regions.json`, per the plan's prohibition. It lands with its first photo in 16-17.

## Next Phase Readiness

- **16-17:** can register the ortler region and run the D-02 precision checkpoint for both files. Both fit the plate at 4dp, 3dp and 2dp, so any precision Tim chooses passes D-04. Neither has a GPS altitude, so heights come from the plate DEM.
- **Phase 18:** the ortler sheet is in `plates.ts` with the shipped swissALTIRegio credit path, like matterhorn's.

## Self-Check: PASSED

- `data/terrain/plates/ortler/dem-10m.png`, `source.json`, the six `ortler-*` files and this SUMMARY exist.
- Commits `3fb2862` and `00676be` are ancestors of HEAD.
- The D-25 scan, re-run with this SUMMARY in the working tree and before it was committed, equals the baseline.
