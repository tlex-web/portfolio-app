---
phase: 16-new-regions-alps-overview-data
plan: 15
subsystem: data
tags: [terrain, overview, copernicus, glo-90, contours, d3-contour, proj4, budget, client-graph]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-13's committed GLO-90 grid, OverviewSource/OverviewConfig/OVERVIEW_BUDGET and Tim's 16-02 parameters; 16-09's fromGrid (EPSG:2056 and EPSG:3035); 16-10 IN-01's overview- exclusion in the D-15 test; 16-14's saalfelden region"
provides:
  - "terrain:build builds the Alps overview in the same run as every plate: public/terrain/overview-contours-alps.<hash>.svg (variant C) within OVERVIEW_BUDGET, kept by the sweep and compared by --check"
  - "data/generated/overview.ts (server-only, LF): contour URL and levels, projection and grid, one outline per region (four corners in overview UV), five reference summits, the verbatim GLO-90 notice and liability sentence"
  - "data/regions/regions.json is now a terrain build input: a region on an unregistered plate fails, and editing regions.json leaves --check stale until terrain:build runs"
  - "data/generated/overview.ts is in FORBIDDEN_IN_CLIENT_GRAPH and is a served-images manifest"
affects: [16-17, 16-18, 18]

actuals:
  tokens: 14500      # chars/4 over the realized diff (45,216 chars excluding the generated SVG) plus this SUMMARY
  tasks: 3
  commits: 3         # measured: git rev-list --count 516fcbb..HEAD at SUMMARY write
plan_head_before: 516fcbb586a053f7d3acb1f5d862edc5700374dc
plan_head_after: 9ea9e957b42a92bec1dea965703504f89c01e4c6

tech-stack:
  added: []
  patterns:
    - "A second, non-plate artifact joins the terrain build's expected-name union, so the stale-file sweep and --check cover it without a separate script"
    - "parseNamed: a JSON input parsed with a zod schema whose failure message names the file"
    - "Overview outlines stored as four projected corners, never a bounding box (grid convergence turns LAEA and eastern LV95 plates by about 2°)"

key-files:
  created:
    - data/generated/overview.ts
    - public/terrain/overview-contours-alps.3cdc771b90.svg
  modified:
    - scripts/terrain/build-terrain.mjs
    - data/__tests__/overview.test.ts
    - scripts/guards/selftest.mjs
    - lib/__tests__/client-graph.test.ts
    - scripts/guards/check-served-images.mjs
    - .gitattributes

key-decisions:
  - "No overview poster: overview.json records hillshade false (Tim, 16-02), and a config asking for one now fails the build instead of being ignored"
  - "Summits in overview.ts carry status beside name, country, officialM, officialRef and uv, so Phase 18 can mark Triglav as secondary"
  - "OVERVIEW_BUDGET is enforced twice: by the builder (write fails before anything is written, --check reports it) and by Jest with zlib"
  - "check-served-images lists overview.ts as a manifest: the server-only module is still where the served contour URL is recorded"

requirements-completed: [DATA-12]   # copied from the plan; REQUIREMENTS.md ticking follows the shared-ID gate (16-17 and 16-18 also declare DATA-12)

coverage:
  - id: D1
    description: "terrain:build writes the overview contours from the committed GLO-90 grid with variant C parameters, in the same run, swept and checked with the plates, within OVERVIEW_BUDGET"
    requirement: DATA-12
    verification:
      - kind: other
        ref: "npm run terrain:build -- --check"
        status: pass
      - kind: other
        ref: "npm run guard:selftest (PASS terrain: the overview builds in the same run and Matterhorn stays byte-equal)"
        status: pass
      - kind: unit
        ref: "data/__tests__/overview.test.ts#is within OVERVIEW_BUDGET: raw bytes and brotli quality 11 bytes (T-16-35)"
        status: pass
    human_judgment: false
  - id: D2
    description: "One outline per region in regions.json order (four projected plate corners) and the five reference summits in overview.json order, separate records"
    requirement: DATA-12
    verification:
      - kind: unit
        ref: "data/__tests__/overview.test.ts#the zermatt outline is the Matterhorn extent's corners projected, within one grid pixel"
        status: pass
      - kind: unit
        ref: "data/__tests__/overview.test.ts#holds the 3 to 5 summits of overview.json, in its order, with official data and UV"
        status: pass
      - kind: other
        ref: "npm run guard:selftest (two summits fail naming overview.json; an unregistered plate fails naming regions.json; one region writes one outline)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No overview hillshade (Tim's 16-02 choice), the served total within budget, the overview kept out of every client chunk"
    requirement: DATA-12
    verification:
      - kind: unit
        ref: "data/__tests__/overview.test.ts#builds no overview poster: Tim chose no hillshade in 16-02"
        status: pass
      - kind: unit
        ref: "lib/__tests__/client-graph.test.ts#the global-error client graph imports no forbidden data module"
        status: pass
      - kind: other
        ref: "grep -rl overview-contours-alps .next/static/chunks after rm -rf .next/static && npm run build: 0 files"
        status: pass
    human_judgment: false

duration: 17min
completed: 2026-11-23
---

# Phase 16 Plan 15: Alps overview build (contours, outlines, summits, notice) Summary

**`npm run terrain:build` now builds the Alps overview in the same run as every plate, from the committed GLO-90 grid. It writes `overview-contours-alps.3cdc771b90.svg` with Tim's variant C parameters: 53,880 B raw and 14,302 B brotli, against the spike's 53,906 B and 14,312 B and a budget of 120,000 B and 30,000 B. The server-only `data/generated/overview.ts` holds:**
- the contour URL and levels (1,000, 2,000 and 3,000 m);
- the projection and the grid;
- an outline for each of the two regions, as four projected plate corners;
- the five reference summits, with official data and UV;
- the verbatim WorldDEM™-90 notice and liability sentence.

**Matterhorn, Saalfelden, the four home modules and the client JS are byte-unchanged.**

## Performance

- **Duration:** about 17 min (2026-11-23T11:51:16Z to 12:08Z)
- **Tasks:** 3 of 3
- **Files:** 8 (2 created, 6 modified)

## Accomplishments

### `scripts/terrain/build-terrain.mjs`

- **`loadOverview()`:**
  - parses `data/terrain/overview/source.json` and `data/terrain/overview.json` through `parseNamed`, so a schema failure names the file;
  - verifies `dem.png` against the record's sha256. A mismatch is a `--check` line, and in write mode it is an error that says to re-run `terrain:fetch:overview`;
  - decodes the grey16 grid to metres;
  - refuses a config with a hillshade.
- **`overviewContours()`:**
  1. an edge-clamped 3 x 3 box blur;
  2. levels from `fromM` every `intervalM` up to the blurred maximum;
  3. d3-contour;
  4. drops rings whose bounding box is under 8 px in both width and height;
  5. runs the plates' own `ringPaths`, now with a tolerance parameter that defaults to 1, so every plate SVG is byte-identical; the overview uses 2 px;
  6. serialises with `contourSvg`.
- **Naming:** the file is named by the existing `hashedName` as `overview-contours-alps.<hash>.svg`.
- **`loadRegions()`:** parses `regions.json` and fails, naming it, when a region's plate is not in `plates.json`. This runs before any plate is built.
- **`overviewOutlines()`:** for each region in registry order, takes the plate's extent corners SW, SE, NE and NW. Each corner goes through `fromGrid(source.crs, …)` (lib/geo.ts for LV95, proj4 for EPSG:3035), then u = (lon − 5) / 12 and v = (49 − lat) / 6, rounded to 4 decimals. A corner outside [0, 1] fails, naming the region.
- **`overviewSummits()`:** the summits in `overview.json` order, as `{ name, country, officialM, status, officialRef, uv }`.
- **`write()`:**
  - loads the registry, regions and overview before building any plate;
  - checks the overview budget together with `PLATE_BUDGET` before anything is written;
  - writes the SVG, then `overview.ts` after `home-plate.ts`;
  - adds the overview name to the sweep's `keep` set.
- **`check()`:**
  - reports a stale `dem.png`;
  - compares the SVG byte for byte through `plateLines`, so it is reported as missing or stale by name;
  - adds the overview name to `expected`, so a leftover overview file is reported as extra;
  - checks the budget;
  - compares `overview.ts` through `moduleLine`.

### `data/generated/overview.ts`

- Starts with a header comment: it is SERVER-ONLY and must not be imported by a client component.
- Holds `source`, `projection`, `grid`, `contours` (parameters, levels, url), `hillshade: false`, `outlines`, `summits`, `notice` and `liability`.
- `.gitattributes` gives it `text eol=lf` (the 16-05 and 16-07 precedent). The SVG is already covered by `public/terrain/*.svg`.

### Measured

| Measure | Value |
|---|---|
| Contours raw | 53,880 B (spike variant C: 53,906 B; budget 120,000 B) |
| Contours brotli q11 | 14,302 B (spike: 14,312 B; budget 30,000 B) |
| Levels | 1,000, 2,000, 3,000 m (the blur keeps every cell under 4,000 m, as the spike found) |
| Served total (every file overview.ts references) | 53,880 B (budget 250,000 B); no poster |
| Outline spans on the 1,200 x 872 grid | Matterhorn about 14.3 x 14.5 px, Saalfelden about 16.6 x 16.3 px (spike: 14.25 x 14.43 and 16.48 x 16.29, the latter with its approximate inverse LAEA) |
| Client JS | 1,851,685 B in 24 files: unchanged from 16-14, 113 B over the 16-01 base (1,851,572 B), 3,983 B under the cap (1,855,668 B) |
| `.next/static/chunks` files containing `overview-contours-alps` | 0 (and 0 for `WorldDEM`, `Dufourspitze` and `outlines`) |
| `terrain:build` write run | about 1.5 s |

### Tests

- **`data/__tests__/overview.test.ts`:** 13 new tests, 32 in total.
  - The contour URL is the only `overview-contours-alps.*` file, and its name hash is the sha256 of its bytes.
  - Raw and brotli (zlib, quality 11) sizes are within `OVERVIEW_BUDGET`.
  - The recorded parameters equal `overview.json`, and the levels are `[1000, 2000, 3000]`. The projection, grid and source sha256 equal the record's.
  - The SVG has a 1200 x 872 viewBox and contains only `svg`, `g` and `path` elements.
  - The notice and liability sentence are verbatim.
  - `terrain.ts`, `precache.json`, `plates.ts` and `home-plate.ts` contain neither `overview` nor `WorldDEM`.
  - There is one outline per region, in registry order, with the region's plate. Every outline has four corners inside [0, 1], at 4 decimals.
  - The zermatt corners are within one grid pixel of the Matterhorn extent projected with `lv95ToWgs84`, and in SW, SE, NE, NW order.
  - Every outline spans 12 to 19 grid px.
  - The summits match `overview.json` in order and data, and each UV equals the formula.
  - Outlines and summits are separate records with disjoint keys. Dufourspitze and the zermatt outline are both present.
  - There is no `overview-hillshade-*` file, and `hillshade` is false.
  - The served total is within `servedMax`.
- **`scripts/guards/selftest.mjs`:** 4 new cases, 290 in total.
  - The overview inputs and `regions.json` are added to the temp root's copied inputs.
  - `terrain: the overview builds in the same run and Matterhorn stays byte-equal`: the overview outputs are deleted, the write rebuilds them, and `--check` prints `terrain: OK`. The listing and the bytes of every repo `public/terrain/` file, the four home modules and `overview.ts` are equal to the repo's.
  - An `overview.json` with two summits fails with `terrain: data/terrain/overview.json: summits: …` and writes nothing.
  - A region on an unregistered plate fails, naming `regions.json`.
  - A registry of one region writes one outline with four corners, and `--check` prints `terrain: OK`.
- **`lib/__tests__/client-graph.test.ts`:** `data/generated/overview.ts` joins `FORBIDDEN_IN_CLIENT_GRAPH`.

## Task Commits

1. **Task 1: overview contours end to end (tracer).** `2eac0dd` (feat). Tracer gate: auto mode is off, `human_verify_mode` is end-of-phase and `<verify>` is automated only. I re-ran it before Task 2: `terrain: OK`, the contour file exists, terrain.ts and precache.json are unchanged since 56d62af, and 116 Jest tests passed. No checkpoint was needed.
2. **Task 2: region outlines and reference summits.** `61d082c` (feat).
3. **Task 3: no poster, served total, client graph.** `9ea9e95` (test).

## Verification

- `npm run terrain:build -- --check` printed `terrain: OK` after every task.
- `npx jest data/__tests__/overview.test.ts data/__tests__/terrain.test.ts data/__tests__/plates.test.ts`: 116 passed. The D-15 test needed no edit, because 16-10 IN-01's `overview-` exclusion holds.
- `npx jest data/__tests__/overview.test.ts lib/__tests__/client-graph.test.ts`: 45 passed. The full Jest run had 115 suites and 1,989 tests passed.
- `npm run guard:selftest 2>&1 | grep -c "^PASS terrain: the overview builds"` printed 1; the selftest passed 290 of 290 cases.
- The `"region":` count in `overview.ts` is 2, and `grep -c outlines data/generated/overview.ts` printed 1.
- `npm run lint` exited 0 after Task 3. That covers eslint, every guard, the selftest, `data:check`, `guard:images` and `guard:tests:scan`.
- `npm run type-check` exited 0 after each task.
- From 516fcbb to HEAD, `git diff` shows no change to `terrain.ts`, `precache.json`, `plates.ts`, `home-plate.ts`, `photos.ts` or `home-photos.ts`. The only change under `public/` is the added overview SVG.
- The client JS measurement: `rm -rf .next/static`, `npm run build`, the 15-01 byte-sum, then `git restore public/service-worker.js`.

## D-25 scan

- **The gate scan:** I ran `d25-scan-1609.mjs` over `.planning/` after the three task commits, before this SUMMARY existed. Its output is byte-identical to 16-14's final run (`16-14-d25-run3.txt`), and no line names a 16-15 file.
- **An extra scan of this plan's code and data:**
  - I ran a copy of 16-13's restricted scan over the plan's files.
  - Every text file had 0 matches: build-terrain.mjs, overview.ts, overview.test.ts, selftest.mjs, client-graph.test.ts, check-served-images.mjs and .gitattributes.
  - The generated contour SVG did match: the GPS-altitude strings of three unpublished originals appear in it as substrings.
  - These matches are coincidental. The SVG holds only half-pixel path coordinates from 0 to 1,200 that were computed from the GLO-90 grid. Any three- or four-digit number in that range occurs as some coordinate. No photo value is an input to the overview build.
  - As a control, the same scan over the Matterhorn and Saalfelden contour SVGs (coordinates 0 to 512) gave 0 matches.
  - No value is recorded here.
- This plan reads no originals. Its committed numbers are public plate extents, summit positions from 16-02 and terrain-derived pixel coordinates.

## Decisions Made

See key-decisions. All parameters, the budget and the summits come from `overview.json` and `OVERVIEW_BUDGET` unchanged.

## Deviations from Plan

**1. [Rule 3 - Blocking] `check-served-images` needed `overview.ts` as a manifest**
- **Found during:** Task 3 (`npm run lint`)
- **Issue:** `guard:images` reported `public/terrain/overview-contours-alps.3cdc771b90.svg orphan`, because only image-manifest.ts, terrain.ts, media-manifest.ts and plates.ts were listed. Task 1's commit already contained the SVG, so `lint` was red from 2eac0dd until 9ea9e95. I ran only the plan's narrower verify steps after Tasks 1 and 2.
- **Fix:** `data/generated/overview.ts` is added to `MANIFESTS` with the `/terrain/` URL pattern, and the header comment is updated. A missing overview file is now also reported as `missing`.
- **Files modified:** scripts/guards/check-served-images.mjs
- **Commit:** 9ea9e95

**2. [Rule 3 - Blocking] `.gitattributes` gains `data/generated/overview.ts text eol=lf`**
- This follows the precedent for a byte-compared generated module (16-05, 16-07). Without it, a CRLF checkout would make `--check` report `overview.ts` as stale. `git ls-files --eol` shows `i/lf w/lf attr/text eol=lf`.
- **Commit:** 2eac0dd

**3. [Rule 2 - Correctness] Guards the plan implied but did not list**
- `loadOverview()` fails on `hillshade` other than false, so a later config change cannot be silently ignored. Building a poster would be new work for a new plan.
- The builder enforces `OVERVIEW_BUDGET` as well as the Jest test, in the same way as `PLATE_BUDGET`.
- Two extra selftest cases cover the DATA-12 "empty" edge (two summits fail, naming the file; an unregistered plate fails, naming regions.json) and the "one region" edge.
- Summits also carry `status` (16-13's secondary flag for Triglav).
- **Commits:** 2eac0dd, 61d082c

**4. [Note] `regions.json` became a terrain build input in Task 2, not Task 1**
- Task 1's `overview.ts` header already named `regions.json` as an input. From 61d082c on, editing `regions.json` leaves `terrain:build --check` stale until `terrain:build` runs. 16-18's README update should say so.

**Total deviations:** 2 Rule 3, 1 Rule 2 and 1 note. **Impact:** none on Tim's decisions or any served byte outside the overview.

## Issues Encountered

- None beyond deviation 1. `npm run build`'s postbuild rewrote `public/service-worker.js`, which was restored with `git restore` and not committed.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- **16-17** adds Ortler's region and plate. Re-running `npm run terrain:build` adds its outline to `overview.ts`. The contour file keeps its hash, because the grid and parameters do not change. An Ortler plate is LV95, so `fromGrid` uses lib/geo.ts.
- **16-18:**
  - The README should note that `regions.json` is a terrain build input.
  - The README should note that `overview.ts` is server-only.
  - The README should note that `OVERVIEW_BUDGET` is enforced by both the builder and Jest.
- **Phase 18** imports `overview` only from server code. Its URL, outlines, summits, notice and liability sentence are ready, and the corner order is SW, SE, NE, NW.

## Self-Check: PASSED

- FOUND: data/generated/overview.ts, public/terrain/overview-contours-alps.3cdc771b90.svg, scripts/terrain/build-terrain.mjs, data/__tests__/overview.test.ts, scripts/guards/selftest.mjs, lib/__tests__/client-graph.test.ts, scripts/guards/check-served-images.mjs, .gitattributes
- FOUND in HEAD's history: 2eac0dd, 61d082c, 9ea9e95
- Commits measured from the ledger base 516fcbb: 3
- D-25 re-run with this SUMMARY on disk: byte-identical to the baseline taken without it
