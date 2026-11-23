---
phase: 16-new-regions-alps-overview-data
plan: 10
subsystem: data
tags: [terrain, plates, zod, epsg-3035, laea, bev, selftest, privacy]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-07 build-terrain.mjs (plates.ts, home-plate.ts); 16-09 toGrid/fromGrid for EPSG:3035 through proj4 and the plateGridBatch selftest helper"
provides:
  - "TerrainSource as z.discriminatedUnion('product', [SwissAltiRegioSource, BevAlsDtmSource]); GridBbox alias of the integer box"
  - "PlateSheet as z.discriminatedUnion('crs', [Lv95Sheet (extent.lv95), LaeaSheet (extent.laea, dem.product 'BEV ALS DTM')]) with one shared sheetRules function"
  - "'overview' reserved in ASSET_STEMS"
  - "build-terrain.mjs: GRID_KEYS picks the sheet branch of the source's crs; IN-05 strip-centre guard; IN-06 refusal on an unreadable terrain.ts"
  - "D-15 test (IN-01) scoped to unprefixed managed names (plate prefixes and overview- excluded), reading the builder's MANAGED pattern"
  - "Selftest cases: EPSG:3035 fixture plate, strip centre outside, unreadable terrain.ts, photo on an EPSG:3035 plate"
affects: [16-11, 16-12, 16-14, 16-15, 16-16, 16-18]

actuals:
  tokens: 7200
  tasks: 3
  commits: 3
plan_head_before: 6f657d4967d6cc3240dd4e88e2be8645aa496b03
plan_head_after: fd368cd7930875617451d9017c5ec413b502605e

tech-stack:
  added: []
  patterns:
    - "A plate source is one TerrainSource variant; its crs picks the PlateSheet branch (GRID_KEYS in build-terrain.mjs), so a plate never mixes two sources or grids"
    - "Cross-field sheet rules live in one sheetRules function applied to both crs branches through superRefine"
    - "A Jest test that must agree with a script's regex reads it from the script text (the plates.test.ts HASH_NAME pattern)"

key-files:
  created:
    - .planning/phases/16-new-regions-alps-overview-data/16-10-SUMMARY.md
  modified:
    - data/schemas/terrain.ts
    - scripts/terrain/build-terrain.mjs
    - scripts/guards/selftest.mjs
    - data/__tests__/terrain.test.ts
    - data/__tests__/plates.test.ts

key-decisions:
  - "TerrainSource and PlateSheet are promoted to discriminated unions (product, crs); swissALTIRegio / EPSG:2056 is one variant of each, field for field and key order unchanged, so Matterhorn's source.json, plates.ts and home-plate.ts are byte-identical"
  - "Zod 4.6.7 accepts refined and superRefined objects as discriminatedUnion members, so the extent refine stays on each source variant and the sheet rules on each sheet branch (no move to the union)"
  - "IN-01's D-15 test reads MANAGED from build-terrain.mjs rather than copying it, so the managed-name filter cannot drift from the sweep"
  - "The EPSG:3035 privacy ramp follows the plan's formula (1,000 m + 1 m per 4 m east); its pixel centres fall on half decimetres, so the stored DEM sits a constant 0.05 m above the formula and the case asserts against the stored value"

requirements-completed: [DATA-13]   # copied from the plan; REQUIREMENTS.md ticking is subject to the shared-ID gate (16-14, 16-17, 16-18 also declare DATA-13)

coverage:
  - id: D1
    description: "TerrainSource union with the BEV ALS DTM / EPSG:3035 variant (EVRF2000-AT, EPSG:9274, tiles, DOI, credit, CC BY 4.0); Matterhorn's source.json parses unchanged"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#terrain: an EPSG:3035 fixture plate gets its own prefixed files and a laea sheet"
        status: pass
      - kind: unit
        ref: "data/__tests__/terrain.test.ts (TerrainSource.parse of the committed source.json)"
        status: pass
    human_judgment: false
  - id: D2
    description: "PlateSheet union on crs; an EPSG:3035 plate gets six prefixed files and a laea sheet while every Matterhorn file, terrain.ts, precache.json and home-plate.ts stay byte-equal"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#terrain: an EPSG:3035 fixture plate gets its own prefixed files and a laea sheet"
        status: pass
      - kind: other
        ref: "npm run terrain:build && git status --porcelain -- public/terrain data/generated data/terrain (empty)"
        status: pass
    human_judgment: false
  - id: D3
    description: "IN-01: the D-15 test survives prefixed plate files and the reserved overview- files"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "data/__tests__/terrain.test.ts#D-15: Matterhorn names and hashes (also run with a scratch overview-contours-alps file present: pass, file removed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "IN-05: a strip centre outside its plate fails naming the plate and data/terrain/plates.json"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#terrain: a strip centre outside its plate fails"
        status: pass
    human_judgment: false
  - id: D5
    description: "IN-06: write mode refuses to re-encode posters when terrain.ts exists but cannot be read"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#terrain: an unreadable terrain.ts refuses to re-encode posters"
        status: pass
    human_judgment: false
  - id: D6
    description: "A photo on an EPSG:3035 plate gets its uv and height through proj4 in both photo stages"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#privacy: a photo on an EPSG:3035 plate gets its uv and height through proj4"
        status: pass
    human_judgment: false
  - id: D7
    description: "The per-sheet budget covers every registry plate whatever its crs"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "data/__tests__/plates.test.ts#the budget covers every registry plate, whatever its crs"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-11-23
---

# Phase 16 Plan 10: A second source and grid for plates (BEV ALS DTM, EPSG:3035) Summary

**The plate model now takes a BEV ALS DTM source on LAEA Europe beside swissALTIRegio on LV95. `TerrainSource` is a union on `product` and `PlateSheet` a union on `crs`, and the builder emits the sheet branch of each plate's own source. A synthetic EPSG:3035 plate builds into its six prefixed files and a `laea` sheet while Matterhorn stays byte-identical. A synthetic photo on such a plate gets its uv and height through proj4 in both photo stages. IN-01, IN-05 and IN-06 landed before the first real second plate.**

## Performance

- **Duration:** about 15 min
- **Started:** 2026-11-23T10:29:13Z
- **Completed:** 2026-11-23T10:44Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- `data/schemas/terrain.ts`
  - `SwissAltiRegioSource` is today's object, field for field.
  - `BevAlsDtmSource` has these fields: `product: 'BEV ALS DTM'`, `tiles` (https url, contentLength, lastModified; at least one), `doi`, https `metadataUrl`, `edition`, `editionSource`, `crs: 'EPSG:3035'`, `heightSystem: 'EVRF2000-AT'`, `heightSystemEpsg: 'EPSG:9274'`, the fixed `resampling` note, `credit`, `licence: 'CC BY 4.0'` and https `licenceUrl`. It also has the same extent, cellM, width, height, heightScale, file and sha256 contract, including the width x cellM refine through one shared `gridMatchesExtent`.
  - `TerrainSource = z.discriminatedUnion('product', …)`, and `GridBbox` is exported as an alias of the integer box.
  - `PlateSheet = z.discriminatedUnion('crs', [Lv95Sheet, LaeaSheet])`. Both branches share `SheetAssets` and the `sheetRules` superRefine. The LAEA branch carries `extent.laea`, `contours.strip.laea` and `dem.product: 'BEV ALS DTM'`.
  - `'overview'` is in `ASSET_STEMS`, and the message names it.
- `scripts/terrain/build-terrain.mjs`
  - `GRID_KEYS` / `gridKey(crs)` picks the extent and strip key from the plate source's crs. An unknown crs throws.
  - IN-05: a `strip.centreN` that is not strictly inside the extent throws `plate <id>: strip.centreN <n> is outside its extent (<south>..<north>); fix data/terrain/plates.json`. This runs before `stripBbox`, which would clamp the centre.
  - IN-06: write mode throws `cannot read data/generated/terrain.ts; refusing to re-encode posters` before anything is built when terrain.ts exists but `committedMeta()` is null.
  - The header documents the second source.
- `data/__tests__/terrain.test.ts` (IN-01): the D-15 describe now has two tests.
  - The first checks that the listing contains every D15 name and that its unprefixed managed names equal D15 exactly. MANAGED is read from build-terrain.mjs. Non-home plate prefixes come from plates.json, and `OVERVIEW_PREFIX = 'overview-'` is excluded, with a comment naming 16-15 and `ASSET_STEMS`.
  - The second keeps the exact `terrain.assets` basename equality.
  - The literal D15 list and its nine hashes are unchanged.
- `data/__tests__/plates.test.ts`: one assertion that the budget sheet list length equals the registry plate count.
- `scripts/guards/selftest.mjs`
  - New helpers:
    - `plateFileRes(prefix)`, which also defines `FIXTURE_FILES`
    - `LAEA_FIXTURE_PLATE` and `bevFixtureSource()`
    - the `bevFixture` and `fixtureCentreN` options on `tempTerrainRoot`
    - `terrainSheet()`
    - `plateDemBatch()`, which calls plate-dem.mjs with spread arguments, such as `gridToUv`
    - the LAEA ramp DEM and the `laeaPlate` option on `tempPrivacyRoot`, which keeps the empty Home list
    - `privacyWritten()`, split out of `privacyRun` so one run can read a second id
  - Four new cases (listed under Verification).

## Task Commits

1. **Task 1: an EPSG:3035 plate end to end (tracer).** `95c5d77` (feat). Tracer gate: auto mode is off, `human_verify_mode` is end-of-phase and `<verify>` is automated only. The three verify steps were re-run end to end before expanding: the selftest case passed, the real build left the tree clean, and Jest passed 81/81. No checkpoint was needed.
2. **Task 2: IN-01, IN-05, IN-06.** `6ac809e` (fix)
3. **Task 3: an EPSG:3035 photo through both stages; budget over both branches.** `fd368cd` (test)

### SHAs for 16-18's write-back to 15-REVIEW-DISPOSITION.md

| Finding | Fix | Commit |
|---|---|---|
| IN-01 | D-15 test scoped to unprefixed managed names (plate prefixes and `overview-` excluded); literal list and `terrain.assets` check kept | `6ac809e` |
| IN-05 | `buildPlate` throws on a strip centre not strictly inside its extent, naming the plate and `data/terrain/plates.json` | `6ac809e` |
| IN-06 | write mode refuses to re-encode posters when `data/generated/terrain.ts` exists but cannot be read | `6ac809e` |

## Verification

- `npm run guard:selftest` reported `selftest: 278/278 cases passed` at the start of the plan (16-09) and `selftest: 282/282 cases passed` at the end, 4 more. These are the new cases:
  - `PASS terrain: an EPSG:3035 fixture plate gets its own prefixed files and a laea sheet` (grep count 1)
  - `PASS terrain: a strip centre outside its plate fails` and `PASS terrain: an unreadable terrain.ts refuses to re-encode posters` (grep count 2). Both also assert that the fixture tree is unchanged.
  - `PASS privacy: a photo on an EPSG:3035 plate gets its uv and height through proj4` (grep count 1)
- `npm run terrain:build` followed by `git status --porcelain -- public/terrain data/generated data/terrain` was empty after every task. `npm run terrain:build -- --check` printed `terrain: OK`.
- `npx jest data/__tests__/plates.test.ts data/__tests__/terrain.test.ts`: 83/83 passed.
- I wrote a scratch `public/terrain/overview-contours-alps.0000000000.svg` and ran `jest -t "D-15"`. It exited 0, the file was removed, and `public/terrain` was clean afterwards.
  - Mutation probes, each file removed afterwards: a scratch `stray-contours-hero.*.svg` (an unknown prefix) and a scratch `contours-hero.*.svg` (an extra unprefixed name) each made the D-15 test fail, as intended.
- `npm run lint`: exit 0. `npm run type-check`: exit 0. Prettier is clean on terrain.ts, build-terrain.mjs, terrain.test.ts and plates.test.ts.
- Acceptance greps on `data/schemas/terrain.ts`: `BEV ALS DTM` 5, `EVRF2000-AT` 1, `EPSG:9274` 1, `'overview'` 1. On `build-terrain.mjs`: `outside its extent` 1 and `refusing to re-encode posters` 1. On `terrain.test.ts`: `overview-` 3 and `'contours-hero.2f3a04accc.svg'` 1. `git ls-files -co --exclude-standard -- data/terrain/plates` is empty, so no fixture data is in the real tree.
- Pixel-neutral: no file under `app/`, `components/`, `lib/` or `hooks/` imports `data/schemas/terrain`, so the client bundle is unchanged (it stays at 1,851,685 B against the 1,855,668 B cap, as 16-07 left it). The Matterhorn generated files and public/terrain are byte-identical.

## D-25 scan

The scan ran from the scratchpad copy `d25-scan-1609.mjs`, which includes the EPSG:3035 kinds and prints booleans and file names only.

- **Baseline:** run after the three task commits and before this SUMMARY existed. Its output was byte-identical to 16-09's final run.
- **Re-run:** after this SUMMARY was written and before it was committed. The result is recorded in the Self-Check below.

The new selftest values are synthetic fixtures only: the plan's synthetic EPSG:3035 extents and grid points inside them. No real photo position, altitude or grid value appears in any committed file or in this SUMMARY.

## Decisions Made

- Promote, not add alongside, for the source and the sheet (the plan's assumption-delta decision). `data/generated/terrain.ts` (TerrainMeta) stays LV95-only, which is accepted debt until a third CRS arrives.
- Zod 4's `discriminatedUnion` takes refined members, so no refine moved to the union. Matterhorn's error paths are unchanged.
- The D-15 test reads MANAGED from the builder instead of keeping a copy.
- The EPSG:3035 privacy ramp uses the plan's formula as written. The 0.05 m storage offset is a named constant, and the case checks for rounding-boundary clearance on the stored height.

## Deviations from Plan

### Additions within the tasks

**1. `GRID_KEYS` throws on an unknown crs**
- **Found during:** Task 1
- **Change:** `gridKey(crs)` throws `no sheet branch for <crs>` instead of falling back to `lv95`, matching plate-dem.mjs's `no projection for <crs>` rule.
- **Commit:** 95c5d77

**2. Shared helpers in the selftest**
- **Found during:** Tasks 1 to 3
- **Change:**
  - `FIXTURE_FILES` is now `plateFileRes('fixture-')`, so the LAEA plate reuses `fixturePlateProblems` through a `{ plate, files }` option. The existing fixture case is unchanged in behaviour.
  - `privacyRun` keeps its return shape and reads its files through the new `privacyWritten`.
  - `plateDemBatch` calls plate-dem.mjs's `gridToUv` with its two arguments.
- **Commits:** 95c5d77, 6ac809e, fd368cd

**3. More assertions in the EPSG:3035 photo case**
- **Found during:** Task 3
- **Change:** beyond the plan's checks, the case also checks:
  - the 3dp photo's uv
  - the absence of a 4dp groundM
  - the 3dp sidecar altM (null)
  - that no output line holds the 3dp true position at 5 decimals

**Total deviations:** 0 rule deviations and 3 small in-task additions. **Impact:** none on generated output; Phase 16 stays pixel-neutral.

## Issues Encountered

- `data/__tests__/terrain.test.ts` had mixed CRLF/LF in the working copy (the index is LF). The edit normalised it to LF, which matches the index, so no line-ending noise was committed.
- `scripts/terrain/build-trails.mjs`, `fetch-trails.mjs` and `fetch-dem.mjs` still parse Matterhorn's source with the `TerrainSource` union. They only ever read `data/terrain/source/` (swissALTIRegio), so the union parses it unchanged. Narrowing them to `SwissAltiRegioSource` would be a small hardening, but they are outside this plan's files, so I left them for a later plan.

## Next Phase Readiness

- 16-11 can write the BEV credit wording into `BevAlsDtmSource.credit`. The field accepts any non-empty string.
- 16-12 can fetch the real Saalfelden plate into `data/terrain/plates/<id>/` with a BEV-variant source.json. The builder, the sheet union, both photo stages and the D-15 test are ready for it.
- 16-15's `overview-*` files are excluded from the D-15 unprefixed check, and `overview` cannot be a plate id.

## Self-Check: PASSED

- Files: 16-10-SUMMARY.md and the five modified files were found.
- Commits: 95c5d77, 6ac809e and fd368cd are ancestors of HEAD.
- D-25 re-run with this SUMMARY on disk: the output was byte-identical to the baseline taken without it, and no line named a 16-10 file.
