---
phase: 16-new-regions-alps-overview-data
plan: 13
subsystem: data
tags: [terrain, overview, copernicus, glo-90, fetch, retry, zod, notice]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-02's fixed overview parameters, budget and summits (16-OVERVIEW-SPIKE.md ## Decisions) and the verbatim GLO-90 notice; 16-11's bounded-retry fetcher shape and package.json scripts"
provides:
  - "data/schemas/overview.ts: OverviewSource, OverviewSummit, OverviewConfig, OVERVIEW_BUDGET, GLO90_NOTICE, GLO90_LIABILITY, OVERVIEW_SLOTS, glo90TileName (zod only)"
  - "terrain:fetch:overview (scripts/terrain/fetch-overview.mjs): manual GLO-90 fetch, sea only by tileList.txt membership, 5-attempt retry per listed tile"
  - "data/terrain/overview/dem.png + source.json: 1,200 x 872 grey16 grid in whole metres, plate carrée x cos 46.5° over 5-17° E by 43-49° N"
  - "data/terrain/overview.json: variant C contour parameters, no hillshade, five reference summits"
  - "data/__tests__/overview.test.ts: 19 tests on integrity, notice, slots, parameters, budget and summits"
affects: [16-15, 16-17, 16-18, 18]

actuals:
  tokens: 13000      # chars/4 over the realized text diff (41,285 B excluding dem.png) plus this SUMMARY
  tasks: 2
  commits: 2         # measured: git rev-list --count 241f874..HEAD at SUMMARY write
plan_head_before: 241f874dd17904a975d6d23d0e0a974577fba976
plan_head_after: 3dc617c0795bafe2a6d3c22087495a7d57dfb108

tech-stack:
  added: []
  patterns:
    - "Overview schemas in their own zod-only file, so nothing overview-related reaches a client module"
    - "Sea is decided by tileList.txt membership alone; a listed tile that fails after its retries stops the fetch and nothing is written"
    - "Verbatim licence text as zod literals: the record cannot carry an altered notice"

key-files:
  created:
    - data/schemas/overview.ts
    - scripts/terrain/fetch-overview.mjs
    - data/terrain/overview/dem.png
    - data/terrain/overview/source.json
    - data/terrain/overview.json
    - data/__tests__/overview.test.ts
  modified:
    - package.json

key-decisions:
  - "OverviewSummit.officialRef is nullable with a status confirmed | secondary (a confirmed summit must have an https officialRef, a secondary one has none), because Tim's 16-02 answer put Triglav in as secondary with no officialRef"
  - "Summit country is the country whose national service gave the height; the other border countries go in borders (Dufourspitze CH + IT, Mont Blanc FR + IT, Zugspitze DE + AT)"
  - "source.json records the release ('Copernicus DEM 2021 release', from the AWS Open Data registry) with its source URL and the sha256 of tileList.txt as fetched"
  - "A tile list under 20,000 names fails the fetch, so a truncated list can never turn land slots into sea"

requirements-completed: [DATA-12]   # copied from the plan; REQUIREMENTS.md ticking follows the shared-ID gate (16-15, 16-17, 16-18 also declare DATA-12)

coverage:
  - id: D1
    description: "Overview schemas, budget and verbatim GLO-90 notice literals; source.json and overview.json parse"
    requirement: DATA-12
    verification:
      - kind: other
        ref: "16-13-PLAN Task 1 automated verify (node import of data/schemas/overview.ts parses both files, prints 'overview: parsed')"
        status: pass
      - kind: unit
        ref: "data/__tests__/overview.test.ts#overview.json parses with OverviewConfig"
        status: pass
    human_judgment: false
  - id: D2
    description: "terrain:fetch:overview: 71 listed tiles read with a bounded retry, sea slot N43 E014 as 0 m, PixelIsPoint offset, bilinear to 1,200 x 872, grey16 PNG with a lossless round trip"
    requirement: DATA-12
    verification:
      - kind: other
        ref: "npm run terrain:fetch:overview (one run, 2026-11-23): OK, 71 tiles, 0 retries, 1,125,981 B PNG"
        status: pass
      - kind: unit
        ref: "data/__tests__/overview.test.ts#tiles and absent are disjoint and together cover all 72 slots (T-16-29)"
        status: pass
      - kind: unit
        ref: "data/__tests__/overview.test.ts#dem.png's sha256 equals the record's"
        status: pass
    human_judgment: false
  - id: D3
    description: "Notice and liability sentence verbatim, pinned against the spike note; paraphrase rejected"
    requirement: DATA-12
    verification:
      - kind: unit
        ref: "data/__tests__/overview.test.ts#both are the sentences the 16-02 spike note copied from the licence"
        status: pass
      - kind: unit
        ref: "data/__tests__/overview.test.ts#rejects a paraphrased notice or one without the ™"
        status: pass
    human_judgment: false
  - id: D4
    description: "Tim's variant C parameters, no hillshade, the three budget numbers and five summits exactly as 16-02 recorded"
    requirement: DATA-12
    verification:
      - kind: unit
        ref: "data/__tests__/overview.test.ts#holds Tim's 16-02 variant C parameters with no hillshade"
        status: pass
      - kind: unit
        ref: "data/__tests__/overview.test.ts#OVERVIEW_BUDGET is Tim's 16-02 budget"
        status: pass
      - kind: unit
        ref: "data/__tests__/overview.test.ts#records the five summits and heights Tim confirmed in 16-02"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-11-23
---

# Phase 16 Plan 13: Alps overview source (GLO-90 grid, notice, parameters) Summary

**The overview now has its committed source. `terrain:fetch:overview` read the 71 listed Copernicus GLO-90 tiles for 43-48° N by 5-16° E at overview level 2 in one run, with 0 retries. It filled the one sea slot (N43 E014) with 0 m and wrote a 1,200 x 872 grey16 PNG in whole metres (1,125,981 B, highest cell 4,692 m, matching the spike). The record holds the verbatim WorldDEM™-90 notice and liability sentence as zod literals. `overview.json` carries Tim's variant C parameters, no hillshade, and the five summits as 16-02 recorded them.**

## Performance

- **Duration:** about 8 min (2026-11-23T11:16:35Z to 11:24:41Z)
- **Tasks:** 2 of 2
- **Files:** 7 (6 created, 1 modified)

## Accomplishments

- **`data/schemas/overview.ts`** (zod only, erasable):
  - `GLO90_NOTICE` and `GLO90_LIABILITY` are byte-equal to the quoted sentences in 16-OVERVIEW-SPIKE.md, ™ included. This is checked against the note itself.
  - `OverviewSource` is strict and checks:
    - product, release and its source, the tile base and list URLs, and the tileList sha256;
    - sorted `tiles` and `absent` lists, refined to be disjoint and together cover all 72 slots;
    - `PixelIsPoint`, overview level 2, lon `[5, 17]` and lat `[43, 49]`;
    - the projection `{ kind: 'plate-carree', standardParallelDeg: 46.5 }` and the resampling literal;
    - width 1200, height 872, heightScale 1, `dem.png`, sha256, and the notice and liability as literals.
  - `OverviewSummit` has the closed Country list (a duplicate of photo.ts, pinned equal by a test), `borders`, lat and lon inside the window, an integer `officialM`, `status`, a nullable https `officialRef` and a `source` note.
  - `OverviewConfig` holds `schemaVersion: 1`, the contour parameters, `hillshade: false | {width, quality}`, and 3 to 5 summits with unique names.
  - `OVERVIEW_BUDGET = { contoursBrotliMax: 30_000, contoursRawMax: 120_000, servedMax: 250_000 }`.
- **`scripts/terrain/fetch-overview.mjs`** (`terrain:fetch:overview`):
  - Only `--out <dir>` is accepted. Any other argument fails offline with "nothing written".
  - It fetches tileList.txt with retry and refuses a list under 20,000 names.
  - It reads each listed tile's level-2 overview, 6 in parallel. Each tile read (open plus raster) runs inside a retry of 5 attempts with a 500 ms x attempt backoff. The final failure is `GLO-90 tile <name> failed after 5 attempts` and nothing is written.
  - It checks every tile for one band, a 1200 x 1200 full image, PixelIsPoint, an origin at (lon, lat + 1), a 300 x 300 level 2, and no NaN or values above 9,000 m.
  - It mosaics the tiles, clamping negative values to 0 m, then resamples bilinearly at each grid pixel centre with the 0.375 px PixelIsPoint offset (the spike's 0.125 px shift). It rounds to metres, proves the PNG round trip, hashes the PNG and parses the record before anything is written.
- **The run** (one networked run, into `data/terrain/overview/`):

| Measure | Value |
|---|---|
| tileList.txt | 26,475 names, sha256 starts `e5a5efe0`, the same list as the spike's |
| Present tiles | 71 of 72 |
| Absent (sea, 0 m) | `Copernicus_DSM_COG_30_N43_00_E014_00_DEM` |
| Retries | 0 |
| Read time | 9,653 ms for 71 tiles (10.4 s wall time) |
| PNG | 1,200 x 872, 1,125,981 B, lossless round trip, heights 0..4,692 m |

- **`data/terrain/overview.json`:**
  - Contour parameters: intervalM 1000, fromM 1000, indexEvery 5, blurPx 3, simplifyPx 2, ringFilterPx 8. `hillshade: false`.
  - Confirmed summits:
    - Dufourspitze, CH (border IT), 4,634 m, swisstopo
    - Mont Blanc, FR (border IT), 4,806 m, IGN map value
    - Grossglockner, AT, 3,798 m, BEV
    - Zugspitze, DE (border AT), 2,962 m, BKG GN250
  - Triglav (SI, 2,864 m) is `secondary`, with `officialRef: null`.
  - Positions and officialRefs are as in the spike's "Final summit records".
- **`data/__tests__/overview.test.ts`** (19 tests, `@jest-environment node`):
  - Integrity: source.json parses, the sha256 matches, and the IHDR reads 16-bit grey at 1200 x 872.
  - Slots: the 72-slot accounting, and negative controls for a slot that is both present and absent and for a missing slot.
  - Notice: its key phrases, equality with the spike note, and rejection of a notice without ™ or a shortened liability sentence.
  - Config: the parameters, the budget, the summit rules (Grossglockner spelled with `ss`, https refs), the exact five summits, and the Country list. Six summits, a duplicate name or a confirmed summit without a ref is rejected.

## Task Commits

1. **Task 1: overview source end to end (tracer).** `4013692` (feat). Tracer gate: auto mode is off, `human_verify_mode` is end-of-phase and `<verify>` is automated only. Before Task 2 I re-ran both verify steps: "overview: parsed", and the WorldDEM grep gave 2. No checkpoint was needed.
2. **Task 2: overview source and config tests.** `3dc617c` (test).

## Verification

- Task 1's `<verify>` printed `overview: parsed`, and `grep -c "WorldDEM" data/terrain/overview/source.json` printed 2.
- `grep -c "terrain:fetch:overview" package.json` printed 1, and `grep -c "OVERVIEW_BUDGET" data/schemas/overview.ts` printed 2.
- `npx jest data/__tests__/overview.test.ts`: 19 passed, 0 failed.
- `npm run lint` exited 0 after Task 1 and again after Task 2. This includes `data:check`, the selftest and `guard:tests:scan`.
- `npm run type-check` exited 0 after both tasks. `npm run guard:tests:scan` reported "scan OK", and `grep -c "WorldDEM" data/__tests__/overview.test.ts` printed 5.
- The committed `dem.png` blob hashes to the record's sha256.
- An unknown argument to the fetcher exited 1 with "nothing written" before any request.

## D-25 scan

- I ran the scratchpad scan `d25-scan-1609.mjs` (booleans and file names only) over `.planning/` after both task commits, before this SUMMARY existed. Its output was byte-identical to 16-12's final run (`16-12-d25-run2.txt`), and no line named a 16-13 file.
- A copy restricted to this plan's five new text files (schema, overview.json, source.json, fetcher, test) reported 145 "match: no" and 0 matches.
- This plan reads no originals and records no photo-derived value. The positions in `overview.json` are the public summit positions already committed in the 16-02 note. The heights in this SUMMARY are terrain values of the overview grid.

## Decisions Made

See key-decisions. Every parameter, budget number and summit height is taken from 16-02 unchanged.

## Deviations from Plan

**1. [Rule 1 - Plan vs Tim's decision] `officialRef` is nullable, with a `status` field**
- **Found during:** Task 1
- **Issue:** The plan describes `officialRef` as an https URL and has Task 2 test "each `officialRef` https". Tim's 16-02 answer ("Yes, marked secondary (Recommended)") adds Triglav with no officialRef until a national source confirms it.
- **Fix:** `officialRef` is an https URL or null. A refine ties null to `status: 'secondary'` and a URL to `'confirmed'`. The test checks that every non-null ref is https and that only the secondary summit has none.
- **Commits:** 4013692, 3dc617c

**2. [Rule 2 - Correctness] Fields and checks beyond the plan's list**
- **Found during:** Task 1
- **Change:**
  - `releaseSource` (the AWS registry URL the release text comes from) and `tileListSha256` record which list decided the sea slots.
  - A `resampling` literal is added.
  - `borders` keeps the spike's "CH (IT border)", "FR / IT" and "DE (AT border)" while `country` stays one value from the closed list.
  - `indexEvery: 5` records the spike's "index contour every 5th interval".
  - A tile list under 20,000 names fails, so a truncated read cannot become sea (T-16-29).
- **Commit:** 4013692

**3. [Note] The Country enum is duplicated, not imported**
- The schema files import only zod, and region.ts duplicates the plate slug for the same reason. The test pins the overview's list against `photo.ts`'s `Country`.

**4. [Note] The retry wraps the whole tile read**
- geotiff `fromUrl` plus `readRasters` run inside `withRetry`, so a failure anywhere in a tile's reads retries that tile. 16-11's custom client was needed for 4 GB BEV tiles. GLO-90 tiles are small, and S3 did not drop connections in the spike or in this run.

**Total deviations:** 1 Rule 1 and 1 Rule 2, plus 2 notes. **Impact:** none on Tim's decisions. The extra fields add provenance only.

## Issues Encountered

- `source.json` is `JSON.stringify` output and is not Prettier-clean: Prettier would inline the short arrays. Prettier is not part of lint or CI (only `npm run format`). I left it as written, so a refetch produces the same bytes. The plate `source.json` files happen to be Prettier-clean because their arrays hold objects.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- **16-15** can build the overview offline from `data/terrain/overview/dem.png` (metres, verified by sha256) and `overview.json`:
  1. 3 x 3 edge-clamped blur
  2. d3-contour at 1,000 m from 1,000 m
  3. simplify 2 px
  4. ring filter 8 px
  5. index every 5th
  6. `OVERVIEW_BUDGET` enforced in Jest
- Overview UV is u = (lon − 5) / 12, v = (49 − lat) / 6, with pixel centres at ((x + 0.5) / 1200, (y + 0.5) / 872).
- Plate corners via proj4 (EPSG:3035) remain 16-15's job, as the spike's Decisions say.

## Self-Check: PASSED

- FOUND: data/schemas/overview.ts, scripts/terrain/fetch-overview.mjs, data/terrain/overview/dem.png, data/terrain/overview/source.json, data/terrain/overview.json, data/__tests__/overview.test.ts
- FOUND in HEAD's history: 4013692, 3dc617c
- Commits measured from the ledger base 241f874: 2
- D-25 re-run with this SUMMARY on disk: byte-identical to the baseline taken without it
