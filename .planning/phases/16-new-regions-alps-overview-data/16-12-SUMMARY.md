---
phase: 16-new-regions-alps-overview-data
plan: 12
subsystem: data
tags: [terrain, plates, bev, epsg-3035, saalfelden, selftest, budget]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-11 terrain:fetch:bev (one BEV ALS DTM tile, bounded retry, Tim's credit); 16-10 the EPSG:3035 plate model, the laea sheet and the per-sheet budget test"
provides:
  - "data/terrain/plates/saalfelden/: the committed BEV ALS DTM source (dem-10m.png + sha256-pinned source.json, EPSG:3035, EVRF2000-AT / EPSG:9274, edition 2025-09)"
  - "plates.json saalfelden entry; six saalfelden-* files in public/terrain; an EPSG:3035 sheet in plates.ts"
  - "selftest plateSourceFiles(): every terrain root copies the source of every plate the repository registers; fixture cases expect the registry ids plus their own fixture"
  - "plates.test: 'the saalfelden sheet is a 12 km EPSG:3035 BEV plate'"
affects: [16-14, 16-16, 18]

actuals:
  tokens: 2950     # chars/4 over the hand-written text diff (selftest, tests, plates.json, plates.ts); the six generated assets and the PNG are not counted
  tasks: 2
  commits: 2
plan_head_before: 4a8a61795ed189ca33fed4f5e006c4d17216d0bc
plan_head_after: b4e765515324b831042d09f18547b5c50310c1b4

tech-stack:
  added: []
  patterns:
    - "Selftest temp roots derive the plate sources from the repository's plates.json (plateSourceFiles()), so a newly registered plate needs no selftest edit"
    - "Tests that read plates.ts narrow per crs through PlatesMeta.parse, not a Record cast that assumes lv95"

key-files:
  created:
    - data/terrain/plates/saalfelden/dem-10m.png
    - data/terrain/plates/saalfelden/source.json
    - public/terrain/saalfelden-contours-hero.f64fae21cc.svg
    - public/terrain/saalfelden-contours-strip.aef86e0d3c.svg
    - public/terrain/saalfelden-hillshade-1100.e330d140f5.avif
    - public/terrain/saalfelden-hillshade-1100.c6c9b7134a.webp
    - public/terrain/saalfelden-hillshade-640.4b8382dc18.avif
    - public/terrain/saalfelden-hillshade-640.efcaf47c79.webp
  modified:
    - data/terrain/plates.json
    - data/generated/plates.ts
    - scripts/guards/selftest.mjs
    - data/__tests__/plates.test.ts
    - data/__tests__/photo-map.test.ts

key-decisions:
  - "strip.centreN 2,707,000 is the extent's centre northing (planner decision, IN-05), until Phase 18 designs the region strip"
  - "plates.test's registry test now pins matterhorn first and the only home plate, not a one-plate id list, so 16-16's ortler entry does not break it"
  - "photo-map.test reads plates.ts through PlatesMeta.parse so the EPSG:2056 check narrows extent to lv95; the old Record<{ extent: { lv95 } }> cast stopped type-checking once a laea sheet existed"

requirements-completed: [DATA-13]   # copied from the plan; REQUIREMENTS.md ticking is subject to the shared-ID gate (16-14, 16-17, 16-18 also declare DATA-13)

coverage:
  - id: D1
    description: "D-28 / D-29: a hole-free BEV ALS DTM source over W 4,529,000 S 2,701,000 E 4,541,000 N 2,713,000, 1200 x 1200 at 10 m, one tile, EVRF2000-AT / EPSG:9274, edition 2025-09, Tim's credit, PNG at most 2,000,000 B"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "npm run terrain:fetch:bev -- --plate saalfelden --extent 4529000,2701000,4541000,2713000 (OK, 0 retries); grep EVRF2000-AT / EPSG:9274 in source.json (1 each); wc -c dem-10m.png = 1,477,634"
        status: pass
    human_judgment: false
  - id: D2
    description: "D-11 / D-10: the registry entry builds six saalfelden-* files flat in public/terrain and an EPSG:3035 sheet, within PLATE_BUDGET; Matterhorn and Home byte-unchanged"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "npm run terrain:build -- --check (terrain: OK); git diff --quiet 56d62af -- terrain.ts precache.json data/terrain/source (exit 0); git status public/terrain lists only saalfelden-* files"
        status: pass
      - kind: unit
        ref: "data/__tests__/plates.test.ts#saalfelden serves and fetches within its budget"
        status: pass
    human_judgment: false
  - id: D3
    description: "The saalfelden sheet's facts are pinned by a test"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "data/__tests__/plates.test.ts#the saalfelden sheet is a 12 km EPSG:3035 BEV plate"
        status: pass
    human_judgment: false
  - id: D4
    description: "Selftest terrain roots follow the registry; every terrain case passes with saalfelden registered"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs (286/286 before and after the registry entry; the three named terrain fixture cases PASS)"
        status: pass
    human_judgment: false
  - id: D5
    description: "No client chunk carries the saalfelden sheet; client JS within the 16-01 base + 4,096 B"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "rm -rf .next/static && npm run build; 15-01 byte sum 1,851,685 B in 24 files; grep -rl saalfelden .next/static/chunks = 0 files"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-11-23
---

# Phase 16 Plan 12: Saalfelden plate from BEV ALS DTM Summary

**Saalfelden is the first real second plate. Its BEV ALS DTM source sits in `data/terrain/plates/saalfelden/`: a 1200 × 1200 grey16 PNG at 10 m on EPSG:3035, pinned by sha256, in EVRF2000-AT / EPSG:9274, edition 2025-09, with Tim's credit. Its registry entry builds six `saalfelden-*` files and a laea sheet in `plates.ts`. The plate serves 360,907 B and fetches 139,535 B per visit. Matterhorn, `terrain.ts`, `precache.json` and `home-plate.ts` are byte-unchanged, and no client chunk contains the sheet.**

## Performance

- **Duration:** about 10 min
- **Started:** 2026-11-23T11:04:54Z
- **Completed:** 2026-11-23T11:14Z
- **Tasks:** 2
- **Files modified:** 13 (8 created, 5 modified)

## Accomplishments

- **Selftest terrain roots follow the registry (`scripts/guards/selftest.mjs`)**
  - Added `plateSourceFiles()` as a function declaration just above `PHOTO_DATA_INPUTS`, so 16-14's `tempPhotoDataRoot` can call it. It reads the repository's `data/terrain/plates.json` and returns `<source>/source.json` and `<source>/<file>` for each plate, as forward-slash repo-relative paths.
  - Removed the two `data/terrain/source/` entries from `TERRAIN_INPUTS`. `tempTerrainRoot` now copies `TERRAIN_INPUTS`, then `plateSourceFiles()`, then the public/terrain files. The JSDoc of `TERRAIN_INPUTS` says that the plate sources follow plates.json.
  - Added `repoPlateIds()`. `fixturePlateProblems` now expects the repository's plate ids plus the fixture plate that root registered, sorted. The 2D fixture case and 16-10's `fixture-laea` case both use it. `fixture-laea` compares no other id list.
  - `TERRAIN_HOME_MODULES`, `matterhornFiles()`, the D-15 hashes and every byte-equality set are unchanged.
- **The fetch (D-28)**
  - Ran `npm run terrain:fetch:bev -- --plate saalfelden --extent 4529000,2701000,4541000,2713000` once. It finished OK with 0 retries.
  - The PNG and `source.json` are byte-identical to 16-11's scratchpad dry run.
- **The registry entry** was added after matterhorn, exactly as the plan specified (`strip.centreN` 2,707,000). `terrain:build` wrote the six files and the sheet. The Matterhorn files and the three home modules were rewritten byte-identically.
- **Tests**
  - `plates.test.ts`: new test `the saalfelden sheet is a 12 km EPSG:3035 BEV plate`. It checks:
    - id, prefix, `home: false` and `threeD: false`
    - crs `EPSG:3035`
    - `extent.laea` equals the D-28 box, with no lv95
    - `widthM` and `heightM` of 12,000
    - dem `{ BEV ALS DTM, 2025-09, 10 }`
    - no heightmap; contours `hero` and `strip` only, with no map LOD
    - the strip carries laea
    - the registry source is `data/terrain/plates/saalfelden`
  - The existing per-sheet budget `test.each` now also covers saalfelden.

## The Saalfelden plate

| Measure | Value |
|---|---|
| Tile | `ALS_DTM_CRS3035RES50000mN2700000E4500000.tif`, 4,449,243,099 B, Last-Modified `Wed, 02 Sep 2026 20:24:32 GMT` |
| Retries | 0 (overview 3, scale 8.0002 m, window 1500 × 1500, read in 1,254 ms) |
| Source PNG | 1200 × 1200 grey16, **1,477,634 B** (cap 2,000,000 B); sha256 `67d390edede5…` |
| Height range | **676.1..2501.1 m** (plate terrain minimum and maximum, EVRF2000-AT) |
| Served | **360,907 B** (cap 550,000 B for a 2D plate): hero SVG 42,749, strip SVG 12,227, hillshade 1100 AVIF 84,559 / WebP 133,794, hillshade 640 AVIF 33,434 / WebP 54,144 |
| Fetched per visit | **139,535 B** (cap 250,000 B): AVIF 1100 poster + hero + strip |
| RESEARCH estimate | 361,692 B served and 139,580 B fetched; the real numbers are 785 B and 45 B lower |

The strip window in the sheet is N 2,705,800..2,708,200 around `centreN` 2,707,000, across the full plate width.

## Task Commits

1. **Task 1: Saalfelden's plate end to end (tracer).** `99c16a6` (feat).
   - Tracer gate: auto mode is off, `human_verify_mode` is end-of-phase and `<verify>` is automated only. After the commit I re-ran `terrain:build -- --check` (terrain: OK) and the `git diff --quiet 56d62af` check (exit 0) before Task 2. No checkpoint was needed.
2. **Task 2: Pin the Saalfelden sheet in a test and keep it out of client chunks.** `b4e7655` (test).

## Verification

- **Selftest:** `npm run guard:selftest` reported `selftest: 286/286 cases passed` **before** the registry entry (after the `plateSourceFiles()` change). It reported **`selftest: 286/286 cases passed` after** it, with each terrain root holding the saalfelden source.
  - The acceptance grep for the three named fixture cases printed 3.
- **Terrain build:** `npm run terrain:build -- --check` printed `terrain: OK` and exited 0.
- **Plan verify 2:** `test $(ls public/terrain | grep -c '^saalfelden-') -ge 6 && git diff --quiet 56d62af -- data/generated/terrain.ts data/generated/precache.json data/terrain/source` exited 0. `git diff --quiet HEAD~2 -- data/generated/home-plate.ts` also held, because the build rewrote home-plate.ts byte-identically.
- **Plan verify 3:** `git status --porcelain -- public/terrain` held only `saalfelden-` lines before the Task 1 commit.
- **Acceptance greps:**
  - `"heightSystem": "EVRF2000-AT"`: 1
  - `"heightSystemEpsg": "EPSG:9274"`: 1
  - `plateSourceFiles` in selftest.mjs: 3
- **Blob check:** the committed blob of `dem-10m.png` hashes to the sha256 in `source.json`.
- **Jest:** `npx jest data/__tests__/plates.test.ts data/__tests__/terrain.test.ts`: 91/91 passed. With `photo-map.test.ts` added: 107/107. The full suite: 114 suites, 1,955 tests, all passed.
- **Client JS:** **1,851,685 B in 24 files**. The 16-01 base is 1,851,572 B (+113 B) and the cap is 1,855,668 B. This is unchanged from the 16-07 measurement.
  - Procedure: `rm -rf .next/static && npm run build`, the 15-01 byte sum, then `git restore public/service-worker.js`.
  - `grep -rl saalfelden .next/static/chunks | wc -l` printed 0.
- **Lint and types:** `npm run lint` exited 0, including `data:check` and the selftest at 286/286. `npm run type-check` exited 0. Prettier is clean on both test files.
- **Data checks:** `npm run data:check` passed after Task 1: terrain, photos:exif, photos:derive, photos:build, tokens, trails and clips were all OK.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] plates.test's registry test pinned a one-plate list**
- **Found during:** Task 2 (first jest run)
- **Issue:** `expect(registry.plates.map((p) => p.id)).toEqual(['matterhorn'])` failed once saalfelden was registered.
- **Fix:** the test now asserts that matterhorn is first and is the only `home: true` plate. Its name already said "lists matterhorn as the home plate". This also keeps 16-16's ortler entry from breaking it.
- **Files modified:** data/__tests__/plates.test.ts
- **Commit:** b4e7655

**2. [Rule 3 - Blocking] photo-map.test no longer type-checked**
- **Found during:** Task 2 (`tsc -p tsconfig.jest.json`)
- **Issue:** `plates2d as Record<string, { crs: string; extent: { lv95: Bbox } }>` raised TS2352 once `plates.ts` held a laea sheet without `lv95`.
- **Fix:** the test now uses `PlatesMeta.parse(plates2d)`. The existing `crs !== 'EPSG:2056'` skip narrows the union to the lv95 sheet. The unused `Bbox` import was dropped. The behaviour is unchanged.
- **Files modified:** data/__tests__/photo-map.test.ts
- **Commit:** b4e7655

Both breakages came from the Task 1 registry entry and were fixed in Task 2, so jest is not green at `99c16a6` alone. The selftest, `data:check` and `terrain:build --check` were green there.

## D-25 scan

- I ran the scratchpad scan `d25-scan-1609.mjs` (booleans and file names only) after both task commits and before this SUMMARY existed. Its output was byte-identical to 16-11's final run, and no line named a 16-12 file or saalfelden.
- This plan reads no originals and records no photo-derived value. The extent in this SUMMARY is the D-28 plate extent. The heights are the plate's terrain minimum and maximum.
- The saalfelden region is not added to regions.json, per the plan's prohibition; it lands with its first photo in 16-14.

## Decisions Made

- **strip.centreN:** 2,707,000, the extent's centre northing (planner decision, IN-05).
- **Registry test:** pins the home plate and its position, not the full id list.
- **photo-map.test:** reads the sheets through `PlatesMeta` instead of a cast that assumes lv95.

## Issues Encountered

None beyond the two test fixes above. The fetch succeeded on its first attempt.

## Next Phase Readiness

- **16-14:** can register the saalfelden region and sample Saalfelden photos on this plate. `plateSourceFiles()` is in place for `tempPhotoDataRoot`.
- **16-16:** ortler's registry entry needs no selftest edit. Its plates.test edit can model the saalfelden test.

## Self-Check: PASSED

- `data/terrain/plates/saalfelden/dem-10m.png`, `source.json`, the six `saalfelden-*` files and this SUMMARY exist.
- Commits `99c16a6` and `b4e7655` are ancestors of HEAD.
- The D-25 scan, re-run after this SUMMARY was written and before it was committed, is byte-identical to the baseline run.
