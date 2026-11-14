---
phase: 15-region-plate-data-model
plan: 04
subsystem: data
tags: [terrain, zod, generator, plates, jest, guards]
status: complete

requires:
  - phase: 15-03
    provides: "npm run type-check covers the Jest config, so plates.test.ts is type-checked"
provides:
  - "data/terrain/plates.json: the plate registry (D-10), matterhorn only, prefix '' (D-11), full output set (D-12)"
  - "Plates / PlateEntry / PlateId registry schema, PlateSheet / PlatesMeta generated-module schema, PLATE_BUDGET in data/schemas/terrain.ts"
  - "build-terrain.mjs: --check and --root <dir>; one run parses the registry and loops every plate; the home plate writes terrain.ts and precache.json byte for byte"
  - "data/generated/plates.ts: every plate's 2D sheet keyed by id, byte-compared by --check"
  - "check-served-images.mjs reads plates.ts as a manifest"
  - "terrain.test.ts pins the nine D-15 names literally; plates.test.ts pins registry rules, plates/terrain agreement, flat URLs, the four asset roots and the per-plate budget"
affects: [15-05, 16, 18]

actuals:
  tokens: 12416
  tasks: 2
  commits: 3
plan_head_before: 28c9c213e31bd72d5702021dede4d5b944e85a60
plan_head_after: 0acbc66c80f5239723bdb0ab11d9c0784184b0ab

tech-stack:
  added: []
  patterns:
    - "Add-alongside generated module: terrain.ts stays the home plate's byte-identical module, plates.ts carries every plate; a Jest test pins the duplicated fields equal"
    - "Registry refines on the parent object with a path, plus a positive-control safeParse before each rejection row"
    - "Prefix-aware URL checks in a superRefine that builds the pattern from the sheet's own prefix (PlatePrefix admits only [a-z-], so it is literal)"

key-files:
  created:
    - data/terrain/plates.json
    - data/generated/plates.ts
    - data/__tests__/plates.test.ts
  modified:
    - data/schemas/terrain.ts
    - scripts/terrain/build-terrain.mjs
    - scripts/guards/check-served-images.mjs
    - data/__tests__/terrain.test.ts
    - scripts/README.md
    - .gitattributes

key-decisions:
  - "15-04: Plates also requires the home plate to declare every output (2 heightmaps, 3 contour LODs, 2 poster sizes), because terrain.ts records them all; without it a trimmed home entry fails later inside TerrainMeta with a less direct error"
  - "15-04: resolvePosters takes the recording module as an argument; the home plate passes terrain.ts, a non-home plate passes null (always encodes) until 15-05 adds committedPlates() and the prefix-aware lookups"
  - "15-04: the D-15 test compares the whole public/terrain/ listing as the plan says; Phase 16 must scope that readdir to unprefixed names once real plates add prefixed files"

patterns-established:
  - "Pattern: a byte-compared generated module gets a text eol=lf line in .gitattributes in the same plan that creates it"

requirements-completed: [DATA-11]

coverage:
  - id: D1
    description: "terrain:build reads data/terrain/plates.json and loops every plate in one run; Matterhorn rebuilds byte for byte and --check is green"
    requirement: DATA-11
    verification:
      - kind: other
        ref: "npm run terrain:build -- --check (terrain: OK)"
        status: pass
      - kind: other
        ref: "npm run terrain:build && git status --porcelain -- public/terrain data/generated (empty)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The nine D-15 Matterhorn names and hashes are pinned literally"
    requirement: DATA-11
    verification:
      - kind: unit
        ref: "data/__tests__/terrain.test.ts#D-15: Matterhorn names and hashes"
        status: pass
    human_judgment: false
  - id: D3
    description: "Plates schema rejects the DATA-11 adjacency and empty edges (asset-stem ids, duplicate ids, wrong prefixes, zero plates, no or two home plates, 2D plates with heightmaps or a map LOD, unsafe sources)"
    requirement: DATA-11
    verification:
      - kind: unit
        ref: "data/__tests__/plates.test.ts#plate registry (D-10, D-11, D-12)"
        status: pass
    human_judgment: false
  - id: D4
    description: "plates.ts parses with PlatesMeta, follows the registry order, and plates.matterhorn equals terrain.ts on every 2D field and URL"
    requirement: DATA-11
    verification:
      - kind: unit
        ref: "data/__tests__/plates.test.ts#plates.ts (the generated 2D sheets)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every terrain URL is flat and exists; next.config, the service worker, the proxy matcher and the served-images guard all cover a prefixed /terrain/ file; the guard reads plates.ts"
    requirement: DATA-11
    verification:
      - kind: unit
        ref: "data/__tests__/plates.test.ts#asset-root reconcile (F14)"
        status: pass
      - kind: other
        ref: "npm run guard:images (served-images: OK)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every committed plate serves and fetches within PLATE_BUDGET"
    requirement: DATA-11
    verification:
      - kind: unit
        ref: "data/__tests__/plates.test.ts#per-plate asset budget"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-11-14
---

# Phase 15 Plan 04: Plate Registry and plates.ts Summary

**The terrain build now reads a zod-validated plate registry (matterhorn only, prefix ''), loops every plate in one `--root`-capable run, writes a new `data/generated/plates.ts` beside a byte-identical `terrain.ts`, and Jest pins the D-15 names, the registry rules, the terrain/plates agreement, the asset roots and the per-plate budget.**

## Performance

- **Duration:** about 8 min of execution (after context reading)
- **Started:** 2026-11-14T20:37:00Z
- **Completed:** 2026-11-14T20:45:24Z
- **Tasks:** 2 (Task 1 tracer, Task 2 auto)
- **Files modified:** 10 (3 created, 7 modified, including the generated plates.ts)

## Accomplishments

- `data/terrain/plates.json` (D-10) with one plate: `matterhorn`, prefix `''` (D-11), source `data/terrain/source`, home, threeD, outputs `{ heightmaps: [512, 256], contours: [hero, map, strip], hillshade: [1100, 640] }` (D-12), `strip.centreN: 1091673`.
- `data/schemas/terrain.ts`: `PlateId` (slug, never an asset stem), `PlateEntry` (strict; `source` limited to `data/terrain/source` or `data/terrain/plates/<id>`), `Plates` (at least one plate, unique ids, exactly one home plate that is threeD with prefix `''` and declares every output, `<id>-` prefix for every other plate, 2D plates without heightmaps or a map LOD), `PlateSheet` / `PlatesMeta` (prefix-aware URL checks), `PLATE_BUDGET`. `TerrainMeta` and its poster regexes are unchanged.
- `scripts/terrain/build-terrain.mjs`: `parseArgs` ported (`--check`, `--root <dir>`, parsed before any ROOT-derived path); `loadRegistry()` + a per-plate `buildPlate()`; the home plate writes `terrain.ts` and `precache.json` exactly as before (D-14); `platesText()` writes `plates.ts` after a `PlatesMeta` parse; `--check` byte-compares `plates.ts` too.
- Write mode on the real tree: all nine D-15 files kept or rewritten with identical bytes; `git status` is empty for `public/terrain`, `terrain.ts` and `precache.json`.
- `check-served-images.mjs` lists `data/generated/plates.ts` in `MANIFESTS`.
- `terrain.test.ts` gains `D-15: Matterhorn names and hashes`; the new `plates.test.ts` has 42 tests (registry rejections with a positive control, sheet equality, flat URLs, asset-root reconcile, budget). Matterhorn serves 1,019,131 B (limit 1,048,576) and fetches 180,757 B (limit 250,000).

## Task Commits

1. **Task 1: Registry to builder to plates.ts to guard manifest, with the D-15 pin** - `3daeac9` (feat)
2. **Task 1 follow-up: keep plates.ts and plates.json LF** - `a3ea279` (fix, deviation 1)
3. **Task 2: plates.test.ts** - `0acbc66` (test)

Tracer gate: interactive run, `human_verify_mode` end-of-phase, automated-only verify. All four Task 1 verify commands were re-run and passed before Task 2 started, so there was no checkpoint.

## Files Created/Modified

- `data/terrain/plates.json` - the plate registry (D-10)
- `data/generated/plates.ts` - generated; every plate's 2D sheet keyed by id
- `data/__tests__/plates.test.ts` - registry, sheet, URL, asset-root and budget tests
- `data/schemas/terrain.ts` - Plates / PlateSheet / PlatesMeta schemas and PLATE_BUDGET
- `scripts/terrain/build-terrain.mjs` - `--root`, registry loop, plates.ts output and check
- `scripts/guards/check-served-images.mjs` - plates.ts manifest entry (and header list)
- `data/__tests__/terrain.test.ts` - the literal D-15 pin
- `scripts/README.md` - terrain:build row names the registry and plates.ts
- `.gitattributes` - `text eol=lf` for plates.ts and plates.json

## Decisions Made

- The home plate must declare its full output set (a `Plates` refine). `terrain.ts` records every output, so a trimmed home entry would otherwise fail later inside `TerrainMeta.parse` with a less direct error.
- `resolvePosters(plate, source, metres, committed, …)`: the home plate passes `committedMeta()` (terrain.ts). For now a non-home plate passes `null` and always encodes. As the plan specifies, 15-05 adds `committedPlates()` and makes `MANAGED`, `resolveHeightmap` and `inspectPoster` prefix-aware. New contour, heightmap and poster names already carry `plate.prefix`, which is `''` for Matterhorn.
- Like terrain.ts, plates.ts is not Prettier-formatted (it is `JSON.stringify` output and no lint step checks formatting).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] LF attribute for the byte-compared plates.ts**
- **Found during:** Task 1 commit (git warned it would convert plates.ts to CRLF)
- **Issue:** `terrain:build --check` byte-compares `data/generated/plates.ts`. Unlike `terrain.ts`, it had no `text eol=lf` line in `.gitattributes`, so a `core.autocrlf=true` checkout would make `--check` (and `npm run lint` / `data:check`) fail.
- **Fix:** added `data/terrain/plates.json text eol=lf` and `data/generated/plates.ts text eol=lf` beside the terrain lines.
- **Files modified:** `.gitattributes`
- **Verification:** `git check-attr eol` reports `lf` for both; `terrain:build -- --check` prints `terrain: OK`.
- **Committed in:** `a3ea279`

**2. [Rule 2 - Docs] scripts/README.md terrain:build row**
- **Found during:** Task 1
- **Issue:** the generator table said terrain:build reads only the DEM source and writes three outputs.
- **Fix:** the row now names the registry, per-plate sources and `plates.ts`.
- **Committed in:** `3daeac9`

---

**Total deviations:** 2 auto-fixed (both Rule 2)
**Impact on plan:** Both keep the new generated module in line with how terrain.ts is already handled. No scope creep.

## Issues Encountered

None. The first write-mode run reproduced every Matterhorn byte.

## Known Stubs

None. The non-home poster path (`committed = null`) is unreachable with the committed registry and is 15-05's scope as planned.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- 15-05 can add the fixture plate. It still needs: prefix-aware `MANAGED`, `resolveHeightmap` and `inspectPoster`, `committedPlates()` for non-home poster sets, the union sweep, and the builder-side budget check. The registry, `--root`, `plates.ts` and `PlateSheet` are ready.
- For Phase 16: the D-15 test compares the whole `public/terrain/` listing. Once real plates add prefixed files, scope that `readdirSync` to unprefixed names (the home plate).
- Verification: `terrain:build -- --check` OK, write mode leaves `public/terrain` and `data/generated` unchanged, 81/81 in plates + terrain tests, `guard:images` OK, `type-check` and full `lint` exit 0.

---
*Phase: 15-region-plate-data-model*
*Completed: 2026-11-14*

## Self-Check: PASSED

- FOUND: data/terrain/plates.json, data/generated/plates.ts, data/__tests__/plates.test.ts, data/schemas/terrain.ts, scripts/terrain/build-terrain.mjs
- FOUND commits: 3daeac9, a3ea279, 0acbc66 (all ancestors of HEAD)
