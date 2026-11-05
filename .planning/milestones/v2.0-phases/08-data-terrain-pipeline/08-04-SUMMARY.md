---
phase: 08-data-terrain-pipeline
plan: 04
subsystem: data
tags: [terrain, swisstopo, swissaltiregio, stac, cog, geotiff, d3-contour, simplify-js, sharp, grey16, heightmap, contours, zod]

# Dependency graph
requires:
  - phase: 08-data-terrain-pipeline (08-01)
    provides: "lib/geo.ts (lv95ToUv, round4, stripBbox), lib/terrain/contour-paths.ts (openRuns, runToPath, isIndexLevel, contourSvg), lib/terrain/dem-sample.ts (sampleAtLv95, resampleBilinear); ESLint ban keeping geotiff/d3-contour/simplify-js/sharp inside scripts/**/*.mjs"
  - phase: 08-data-terrain-pipeline (08-02)
    provides: "--check generator CLI shape, data:check wired into npm run lint, .gitattributes LF precedent"
provides:
  - "data/terrain/source/dem-10m.png + source.json: committed swissALTIRegio 10 m window of the D-14 extent (1100 x 1100, decimetres, sha256 + STAC provenance)"
  - "scripts/terrain/fetch-dem.mjs: manual networked STAC + COG window read (never in CI)"
  - "scripts/terrain/build-terrain.mjs: offline build of 5 content-hashed assets + data/generated/terrain.ts, with --check in npm run lint"
  - "public/terrain/: heightmap-512, heightmap-256 (16-bit grey PNG), contours-hero, contours-map, contours-strip (SVG)"
  - "data/generated/terrain.ts: client-safe terrain metadata (extent, dem edition, grids, LOD intervals, strip bbox, summit official + DEM height + UV, hashed URLs)"
  - "data/schemas/terrain.ts: TerrainSource, TerrainMeta (zod only)"
  - "data/__tests__/terrain.test.ts: 27 fs-only invariants"
affects: [08-06 hillshade poster, 08-08 photo DEM heights, 08-12 footer band and attribution, 08-13 visual review, phase 9 hero terrain, phase 10 photo map]

# Actuals (#2632)
actuals:
  tokens: 50520
  tasks: 3
  commits: 2
plan_head_before: 85395cea9f94b31918467c9274eeed532aeb3d6c
plan_head_after: a035160ebf2e2b82a78995525bcaf8f4cf0b3321

# Tech tracking
tech-stack:
  added:
    - "geotiff 3.0.5 (devDependency, exact pin)"
    - "d3-contour 4.0.2 (devDependency, exact pin)"
    - "simplify-js 1.2.4 (devDependency, exact pin)"
  patterns:
    - "Networked fetch writes a committed source raster once; every derived artifact is rebuilt offline from it, and lint re-derives them (CI never touches the network)"
    - "--check by artifact type: SVG and .ts byte-compared; PNG checked by name hash == sha256(bytes) AND decoded pixels == regenerated array; source raster by sha256 in source.json"
    - "Content-hashed names <name>.<10 hex>.<ext>; write mode deletes stale managed files and keeps a committed PNG whose hash and pixels already match"
    - "Contour runs re-split after half-pixel rounding, so rounding cannot create a border segment"

key-files:
  created:
    - scripts/terrain/fetch-dem.mjs
    - scripts/terrain/build-terrain.mjs
    - data/schemas/terrain.ts
    - data/terrain/source/dem-10m.png
    - data/terrain/source/source.json
    - data/generated/terrain.ts
    - public/terrain/heightmap-512.548be40405.png
    - public/terrain/heightmap-256.f792a8921f.png
    - public/terrain/contours-hero.2f3a04accc.svg
    - public/terrain/contours-map.f78bc9a25c.svg
    - public/terrain/contours-strip.e1af353f82.svg
    - data/__tests__/terrain.test.ts
  modified:
    - package.json
    - package-lock.json
    - .gitattributes

key-decisions:
  - "Task 1 sheet resolved by Tim's literal reply \"defaults\": extent LV95 [2616000, 1088000, 2627000, 1099000], decimetres (heightScale 0.1), edition 2026-05 from the STAC datetime, attribution Option A (verbatim 2025+ string, ships in 08-12), no © prefix, UI-SPEC defaults 3-7 accepted"
  - "Footer \"last surveyed\" is May 2026 (STAC item datetime 2026-05-28), not the illustrative \"June 2026\" in UI-SPEC default 7"
  - "The 10 m resolution is verified from the COG itself (resolution 10 x -10, PixelIsArea, EPSG:2056) because the STAC asset carries no gsd field; the extent maps to the integer window [23100, 30500, 24200, 31600]"
  - "Heightmaps are resampled in our code (resampleBilinear) and stored in the source unit; a committed heightmap whose hash and pixels match is kept, so cross-platform deflate differences never churn file names"
  - "terrain.ts keeps the full STAC timestamp in dem.stacDatetime beside dem.edition, so the footer and the provenance read one value"

patterns-established:
  - "Generated terrain output: '<name>: stale|missing|extra <path> (reason)' lines, then 'terrain: OK' or 'terrain: N stale'"
  - "Generated .ts module: two header comment lines + export const x = <JSON.stringify(meta, null, 2)> as const;, parsed with its zod schema before writing"

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "Tim's Task 1 reply quoted verbatim with the resolved values of items 1-6, recorded on disk before any DEM data was fetched or committed"
    requirement: DATA-01
    verification:
      - kind: other
        ref: "08-04-SUMMARY.md draft written before scripts/terrain/fetch-dem.mjs ran; '## Task 1' section below"
        status: pass
    human_judgment: false
  - id: D2
    description: "Committed swissALTIRegio source raster (1100 x 1100 native 10 m, lossless 16-bit grey decimetres) with source.json provenance (STAC item, COG URL, datetime, checksum, extent, grid, heightScale, edition, sha256)"
    requirement: DATA-01
    verification:
      - kind: other
        ref: "npm run terrain:fetch -> 'wrote data/terrain/source/dem-10m.png (1100 x 1100, 1423018 bytes, 1518.1..4477.0 m)'; lossless PNG round trip asserted before writing"
        status: pass
      - kind: other
        ref: "source.json sha256 tampered -> 'terrain: stale data/terrain/source/dem-10m.png (sha256 ...)', exit 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Offline terrain:build with --check wired into npm run lint (data:check); stale bytes, extra hashed files and source tampering all fail"
    requirement: DATA-01
    verification:
      - kind: other
        ref: "npm run lint -> exit 0, 'terrain: OK' and 'photos:exif: OK'"
        status: pass
      - kind: other
        ref: "one byte appended to contours-strip -> 'terrain: stale public/terrain/contours-strip.e1af353f82.svg (bytes differ from a fresh build)', exit 1; extra contours-old.<hash>.svg -> 'terrain: extra ...', exit 1"
        status: pass
      - kind: other
        ref: "heightmap-256 overwritten with the 512 bytes -> 'stale ... (sha256 of the bytes does not match the name)', exit 1; one pixel flipped under a valid hash -> 'stale ... (pixels differ from a fresh build)', exit 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "Five content-hashed assets (heightmap-512/256 grey16, contours-hero/map/strip) and a client-safe terrain.ts (1604 bytes) derived from one extent, with summit officialM 4478, demM 4473, UV (0.0954, 0.6661)"
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "data/__tests__/terrain.test.ts (27 tests)"
        status: pass
      - kind: other
        ref: "npx jest --silent -> 21 suites, 268 tests passed; npm run type-check exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "Contour line quality and look (density, index weight, no frame) as rendered in the footer band and hero fallback"
    requirement: DATA-01
    verification:
      - kind: other
        ref: "scratchpad renders of strip/hero/map: no frame; edge dark fraction strip top 0.055 / bottom 0.074 (crossings, not a line)"
        status: pass
    human_judgment: true
    rationale: "Only the executor viewed scratchpad renders; the visual judgement of the band in the real footer belongs to the 08-12/08-13 visual review and Tim's baselines"

# Metrics
duration: 10min
completed: 2026-10-24
status: complete
---

# Phase 8 Plan 04: swissALTIRegio Terrain Source, Heightmaps and Contour LODs Summary

**The swissALTIRegio 10 m window of the 11 x 11 km Zermatt-Matterhorn extent is committed as a lossless 16-bit decimetre PNG with STAC provenance, and an offline build turns it into two grey16 heightmaps, three border-free contour LODs and a 1.6 KB client-safe `terrain.ts`, all content-hashed and re-derived by `npm run lint`.**

## Task 1: Sheet decisions (checkpoint:decision, resolved)

Recorded before any DEM data was fetched or committed (a draft of this file with this section was written to disk first).

Tim's literal reply, verbatim:

> defaults

| # | Item | Resolved value |
|---|------|----------------|
| 1 | Extent (D-14) | LV95 [W 2616000, S 1088000, E 2627000, N 1099000], 11 x 11 km, 1100 x 1100 native 10 m cells, 21.48 m/px at 512. Summit UV (0.0953, 0.6661); strip bbox [2616000, 1090600, 2627000, 1092800] |
| 2 | Heightmap units | Decimetres, heightScale 0.1 (512: ~352 KB, 256: ~93 KB) |
| 3 | "Last surveyed" | STAC item datetime 2026-05-28 -> edition `2026-05`, footer "May 2026", recorded with the COG checksum |
| 4 | Attribution (D-15) | Option A: the full verbatim published string for the 2025+ swissALTIRegio versions, including the source's own typo "tétéchargées" and the stray "”". Recorded only; ships in 08-12 |
| 5 | "©" prefix | No prefix; the e2e asserts the `site.attribution.terrain` constant, not the 07 literal "© swisstopo" |
| 6 | UI-SPEC defaults 3-7 | All accepted: band aspects 5:1 / 8:1 / 12:1; waypoint ticks by easting on the neatline; index contour every 5th line at full token alpha, others 60%; strip interval 100 m; LV95 corner coordinates |

Findings recorded with the decision:
- **The "+500 m east" alternative moved Zermatt away from the NE corner, not towards it.** Shifting the box east moves the east edge further from the Zermatt photo spots (img-0605 at E 2623452 goes from 3.55 km to 4.05 km inside the east edge). Tim did not choose it.
- **"May 2026", not "June 2026".** UI-SPEC default 7 wrote "June 2026" as an illustration. The resolved edition is the STAC item datetime month, so the footer reads "May 2026". The June 2026 swissALTIRegio update added data only for BL, BS, BE and SO, none of which is in the extent.
- Attribution string (Option A) as transcribed in 08-RESEARCH "Attribution String (D-15)"; 08-12 re-copies it character for character from https://www.swisstopo.admin.ch/en/height-model-swissaltiregio before it ships in `site.attribution.terrain`:

  > Bundesamt für Landestopografie swisstopo; Tarquini S., I. Isola, M. Favalli, A. Battistini, G. Dotta (2023). TINITALY, a digital elevation model of Italy with a 10 meters cell size (Version 1.1). Istituto Nazionale di Geofisica e Vulcanologia (INGV). https://doi.org/10.13127/tinitaly/1.1; DGM Österreich, geoland.at; DGM1, Bayerische Vermessungsverwaltung – www.geodaten.bayern.de; DGM1, Baden-Württemberg: LGL, www.lgl-bw.de, dl-de/by-2-0”; RGEAlti, Institut National de l’information géographique et forestière, données originales tétéchargées sur https://geoservices.ign.fr/rgealti#telechargement5m, mise à jour du juillet 2023

## Performance

- **Duration:** about 10 min for Tasks 2 and 3 (this continuation); Task 1 was the decision checkpoint in the earlier agent
- **Started:** 2026-10-24T15:15:06Z
- **Completed:** 2026-10-24T15:24:44Z
- **Tasks:** 3 (Task 1 decision, Task 2 tracer, Task 3)
- **Files modified:** 15 (12 created, 3 modified)

## Accomplishments

- **Source raster with provenance.** `terrain:fetch` read the STAC item (HTTP 200, datetime 2026-05-28, updated 2026-06-01, `file:checksum` 1220E1CA…6527E5), picked the single EPSG:2056 COG, checked 10 m PixelIsArea, mapped the extent to the integer window [23100, 30500, 24200, 31600] and read 1,210,000 cells with no nodata (1518.1 to 4477.0 m). The values are stored as decimetres in a 1.42 MB grey16 PNG. The script decodes the PNG again and compares it with the source values before it writes anything.
- **Offline build, checked in lint.** `terrain:build` verifies the source sha256, then writes the five assets and `terrain.ts`. With `--check`, `npm run lint` (through `data:check`) re-derives everything without the network. Sizes match the research measurements: heightmap-512 352 KB, heightmap-256 94 KB, hero 45.6 KB, map 93.2 KB, strip 22.8 KB.
- **One extent.** The heightmaps and the hero/map LODs cover `source.extent`. The strip is the native-grid row window of `stripBbox(extent, 1091673)` = [2616000, 1090600, 2627000, 1092800], which is 1100 x 220 px (exactly 5:1). A test fails if any other bbox appears in `terrain`.
- **Summit (D-17).** officialM 4478 (permalink https://map.geo.admin.ch/?lang=en&E=2617049&N=1091673&zoom=10, HTTP 200), demM 4473 (bilinear on the native grid), UV (0.0954, 0.6661).
- **No frame (Pitfall 1).** Every run is re-split after half-pixel rounding. A test parses every `d` attribute and finds no segment along x = 0, x = W, y = 0 or y = H. Scratchpad renders show no frame line on any LOD.

## Task Commits

1. **Task 1: Sheet decisions**: no commit (checkpoint:decision; resolved by Tim's reply "defaults", recorded above)
2. **Task 2 (tracer): source raster, strip contours, terrain.ts, --check in lint**: `36ef1ec` (feat)
3. **Task 3: heightmaps, hero/map LODs, terrain invariants**: `a035160` (feat)

**Tracer gate:** interactive run, `human_verify_mode` end-of-phase, verify automated only. All three Task 2 `<verify>` commands passed, and the stale-detection proof ran after the commit (exit 1 naming the file, then OK after `git checkout -- public/terrain`). The plan therefore expanded to Task 3 with no checkpoint.

**Plan metadata:** recorded in the docs commit that follows this SUMMARY.

## Files Created/Modified

- `scripts/terrain/fetch-dem.mjs`: manual STAC + COG window read into the committed source (round-trip verified, schema-parsed)
- `scripts/terrain/build-terrain.mjs`: offline build of all terrain artifacts with `--check`
- `data/schemas/terrain.ts`: `Lv95Bbox`, `TerrainSource`, `TerrainAssetUrl`, `TerrainMeta` (zod only)
- `data/terrain/source/dem-10m.png`, `data/terrain/source/source.json`: the committed source and its provenance
- `data/generated/terrain.ts`: the generated `terrain` constant
- `public/terrain/*`: the five content-hashed assets
- `data/__tests__/terrain.test.ts`: 27 invariants
- `package.json` / `package-lock.json`: three exact-pinned devDependencies, `terrain:fetch`, `terrain:build`, `data:check` extended
- `.gitattributes`: LF for the byte-compared terrain text, `binary` for terrain PNGs

## Decisions Made

- The STAC asset has no `gsd`, so "10 m" is verified from the COG (resolution 10 x -10, PixelIsArea, EPSG:2056). Selection fails unless exactly one EPSG:2056 cloud-optimized GeoTIFF exists.
- Summit UV is (0.0954, 0.6661). The research quoted 0.0953 because it used the REFRAME-converted summit E 2617047.955; the D-17 constant E 2617049 gives 1049 / 11000 = 0.09536, which rounds to 0.0954. That is within the plan's 0.001 tolerance.
- In write mode a committed heightmap whose name hash matches its bytes and whose pixels match is kept rather than re-encoded, so a run on another platform cannot rename it through different deflate bytes.
- `dem.stacDatetime` holds the full STAC timestamp (`2026-05-28T00:00:00Z`) next to `edition`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `.gitattributes` rules for the terrain artifacts**
- **Found during:** Task 2
- **Issue:** `core.autocrlf=true` on this machine. Without a rule, a checkout would write `source.json`, `terrain.ts` and the SVGs with CRLF, and the byte comparison in `--check` would fail, which would also break the plan's own `git checkout -- public/terrain` restore step.
- **Fix:** `text eol=lf` for `data/terrain/source/source.json`, `data/generated/terrain.ts` and `public/terrain/*.svg`; `binary` for `data/terrain/source/*.png` and `public/terrain/*.png`.
- **Files modified:** `.gitattributes`
- **Verification:** `git ls-files --eol` shows `i/lf w/lf attr/text eol=lf` for the text files and `-text` for the PNG. The restore after the tamper proof printed `terrain: OK`.
- **Committed in:** `36ef1ec`

**2. [Rule 1 - Bug] Re-split runs after half-pixel rounding**
- **Found during:** Task 2
- **Issue:** `openRuns` drops border segments before simplification. Half-pixel rounding can then move an interior point to x = 0 or y = 0 (0.2 rounds to 0), which creates a stroked segment along the border, the frame Pitfall 1 forbids. Simplification can also join two border points.
- **Fix:** After simplify and rounding, consecutive duplicate points are dropped and the run goes through `openRuns` again. `Z` is kept only when neither pass dropped a segment.
- **Files modified:** `scripts/terrain/build-terrain.mjs`
- **Verification:** the border-segment test passes on all three LODs. Injecting `M3 4L0 5L0 9L2 9` into the hero SVG made it fail (2 failures: border and hash).
- **Committed in:** `36ef1ec`, `a035160`

**3. [Rule 2 - Missing critical] Fetch and build guards**
- **Found during:** Task 2
- **Issue:** The plan's fetch steps did not verify the georeferencing or the PNG round trip, and a mistyped flag would silently run write mode.
- **Fix:** fetch-dem asserts EPSG:2056, PixelIsArea, single band and a height range, and it decodes the PNG and compares it with the source values before writing. Both scripts reject unknown arguments.
- **Files modified:** `scripts/terrain/fetch-dem.mjs`, `scripts/terrain/build-terrain.mjs`
- **Committed in:** `36ef1ec`

**4. [Process] TerrainMeta grown per task**
- **Found during:** Tasks 2 and 3
- **Issue:** Task 2 ships only the strip, so a schema that required heightmap and hero/map URLs could not parse Task 2's `terrain.ts`.
- **Fix:** Task 2's `TerrainMeta` had `contours.strip` and `assets.contours.strip` only. Task 3 added `contours.hero`/`map`, `assets.heightmap` and the hero/map URLs, as the plan's Task 3 action describes.
- **Committed in:** `36ef1ec`, `a035160`

---

**Total deviations:** 4 (1 blocking, 1 bug, 1 missing critical, 1 process)
**Impact on plan:** These protect the byte-equality, no-frame and no-silent-overwrite contracts. No scope creep, and the interfaces match the plan's `<interfaces>` block.

## Issues Encountered

- `heightSystem: "LN02"` comes from the plan's interface block. swissALTIRegio is a cross-border product (TINITALY outside CH), and this run did not verify the height datum from the product docs. It affects no computed value.
- `actuals.tokens` (50,520) is chars/4 over the added lines and includes about 161 KB of generated single-line SVG path data. The hand-written code and tests alone come to about 10k tokens.
- `npm install` reported the same 10 pre-existing audit findings (1 low, 3 moderate, 6 high) as 08-02. They are out of scope and were left alone. `guard:parity` is OK.
- `npm run lint` shows 54 warnings, all in pre-existing v1 components (React compiler rules). None is in a file this plan touched.

## User Setup Required

None. `npm run terrain:fetch` is the only networked step. It is manual, and it has already run.

## Next Phase Readiness

- 08-06 can add the hillshade to `build-terrain.mjs` (`assets.hillshade`) from the same decoded metres grid. 08-08 can sample photo heights with `sampleAtLv95` on the native grid. 08-12 reads `terrain.assets.contours.strip`, `terrain.contours.strip.intervalM`, `terrain.extent` and `terrain.dem.edition` ("May 2026").
- DATA-01 is shared with later Phase 8 plans. The shared-ID gate keeps it pending until the last of them finishes.
- Service-worker precache and immutable `/terrain/*` headers are not wired yet (roadmap scope note; a later plan).

---
*Phase: 08-data-terrain-pipeline*
*Completed: 2026-10-24*

## Self-Check: PASSED

- FOUND: all 12 created key files on disk
- FOUND: commits 36ef1ec, a035160 (ancestors of HEAD)
- Plan verification: `npm run lint` exit 0 (prints `terrain: OK` and `photos:exif: OK`), `npm run type-check` exit 0, `npx jest --silent` 21 suites / 268 tests; `public/terrain/` holds exactly the five hashed managed files
- Acceptance re-run: pins grep 1/1/1, `terrain:build -- --check` grep 1, `terrain.ts` 1604 bytes (< 4096), source.json extent equals the Task 1 extent
