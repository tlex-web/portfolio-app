---
phase: 16-new-regions-alps-overview-data
plan: 07
subsystem: terrain
tags: [terrain, client-bundle, footer, global-error, selftest, jest]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-05 lib/__tests__/client-graph.test.ts (FORBIDDEN_IN_CLIENT_GRAPH, the global-error walk) and the selftest terrain roots; 16-01 phase-base client JS (1,851,572 B)"
provides:
  - "data/generated/home-plate.ts: homePlate, the home plate's 2D sheet only, written and --checked by terrain:build"
  - "ContourField is data-free: props { sheet, lod, className }, exported ContourSheet and ContourLod<S>"
  - "SheetBand (BandSheet) and SheetLegend take a `sheet` prop; every caller passes homePlate"
  - "client-graph test forbids data/generated/plates.ts in the global-error client graph"
affects: [16-10, 16-11, 16-12, 16-18, 18]

estimate:
  tokens: 65000
actuals:
  tokens: 6366
  tasks: 3
  commits: 3
plan_head_before: d925421c73d9c250309810108a4a331d9ed4558d
plan_head_after: e846336

tech-stack:
  added: []
  patterns:
    - "Sheet as a prop: terrain components take the plate's sheet from the caller and import no generated data; a structural type (ContourSheet, BandSheet, typeof homePlate) keeps per-sheet LOD checking"
    - "A generated module per client consumer (16-05 pattern applied to plates): terrain:build writes the home sheet alone beside plates.ts and --checks both"

key-files:
  created:
    - data/generated/home-plate.ts
  modified:
    - scripts/terrain/build-terrain.mjs
    - scripts/guards/selftest.mjs
    - .gitattributes
    - components/terrain/SheetLegend.tsx
    - components/terrain/ContourField.tsx
    - components/terrain/SheetBand.tsx
    - components/site/SiteFooter.tsx
    - components/home/PosterSheet.tsx
    - components/photos/MapSheet.tsx
    - components/site/EdgeArt.tsx
    - components/terrain/__tests__/ContourField.test.tsx
    - lib/__tests__/client-graph.test.ts

key-decisions:
  - "homePlateText reads the home entry from the same PlatesMeta.parse output as plates.ts (shared platesMeta helper), so the two modules cannot drift; --check compares plates.ts first, then home-plate.ts"
  - "home-plate.ts joins TERRAIN_HOME_MODULES in the selftest, so every fixture-plate case also proves a second plate leaves the home sheet byte-equal"
  - "SheetBand types its prop as BandSheet (a sheet with a strip LOD) rather than a generic, so ContourField's lod=\"strip\" stays checked without a type parameter on the band"

patterns-established:
  - "Terrain components never import plates.ts; a caller chooses the sheet (homePlate on the client, a plates.ts entry on the server in Phase 18)"

requirements-completed: [DATA-13]

coverage:
  - id: D1
    description: "terrain:build writes data/generated/home-plate.ts (JSON equal to the plates.ts home entry) and --check names it when stale; every other generated file and public/terrain is byte-unchanged"
    requirement: DATA-13
    verification:
      - kind: command
        ref: "npm run terrain:build -- --check (terrain: OK)"
        status: pass
      - kind: command
        ref: "git diff --quiet 56d62af -- public/terrain data/generated/terrain.ts data/generated/precache.json data/generated/plates.ts (exit 0)"
        status: pass
      - kind: command
        ref: "scratchpad home-equal.mjs: plates.matterhorn JSON === homePlate JSON (true)"
        status: pass
      - kind: command
        ref: "npm run guard:selftest (selftest: 276/276 cases passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "ContourField, SheetBand and SheetLegend take the sheet as a prop and import no generated data at runtime; no component imports plates.ts; a 2D sheet still rejects lod=\"map\""
    requirement: DATA-13
    verification:
      - kind: command
        ref: "git grep -l \"from '@/data/generated/plates'\" -- components (empty)"
        status: pass
      - kind: test
        ref: "components/terrain/__tests__/ContourField.test.tsx (5/5, incl. the @ts-expect-error bogus LOD)"
        status: pass
      - kind: command
        ref: "throwaway tsc -p tsconfig.jest.json probe: a { hero, strip } sheet with lod=\"map\" is TS2322, lod=\"strip\" compiles"
        status: pass
      - kind: command
        ref: "npm run type-check (exit 0 after each of the three commits)"
        status: pass
    human_judgment: false
  - id: D3
    description: "SiteFooter, PosterSheet, MapSheet and EdgeArt static markup byte-identical before and after (DATA-09)"
    requirement: DATA-13
    verification:
      - kind: command
        ref: "renderToStaticMarkup before / after Task 1 / after Task 2: cmp identical for all four (sha256 prefixes 9e4fb8eaf7ba8a27, d93dd53c1a9dc875, aa2e607f16c4118c, 212060f7dde18d98)"
        status: pass
      - kind: test
        ref: "npx jest components/terrain components/home components/photos components/site (22 suites, 214/214)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The global-error client graph forbids data/generated/plates.ts and still reaches the footer, home-photos and the home sheet"
    requirement: DATA-13
    verification:
      - kind: test
        ref: "lib/__tests__/client-graph.test.ts (13/13); fails with the full chain when SheetLegend imports plates.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "Client JS within the 16-01 phase base + 4,096 B"
    requirement: DATA-13
    verification:
      - kind: command
        ref: "rm -rf .next/static && npm run build, 15-01 byte-sum: 1,851,685 B in 24 files (budget 1,855,668 B)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-11-23
---

# Phase 16 Plan 07: Home sheet module and sheet-prop terrain components Summary

**terrain:build now writes `data/generated/home-plate.ts` (the home plate's sheet alone), and ContourField, SheetBand and SheetLegend take the sheet as a prop. No component imports the plate registry any more, and a client-graph test fails if `plates.ts` reaches the footer chunk again. All markup and every Matterhorn terrain byte are unchanged.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-11-23T10:01:47Z
- **Completed:** 2026-11-23T10:11:22Z
- **Tasks:** 3
- **Files:** 13 (1 created, 12 modified)

## Accomplishments

- `build-terrain.mjs` gains `HOME_PLATE_REL`, a shared `platesMeta(built)` (the `PlatesMeta.parse` output both modules use) and `homePlateText(built)`. The new module has the same header style and holds `export const homePlate = <home entry, 2 spaces> as const;`. Write mode writes it after plates.ts (1,675 bytes). `--check` compares it after plates.ts with the usual message: `terrain: stale data/generated/home-plate.ts (bytes differ from a fresh build)`.
- Selftest: `TERRAIN_INPUTS` copies `home-plate.ts` into every terrain root. `TERRAIN_HOME_MODULES` now holds it too, so the fixture-plate, remove-plate and dropped-size cases all prove that a second plate leaves the home sheet byte-equal. No case body changed.
- `SheetLegend` takes `sheet` (the type `typeof homePlate`, through `import type`, which compiles away). It no longer imports `plates.ts` or `PlateId`.
- `ContourField` is data-free. Its props are `{ sheet, lod, className }`, with the structural `ContourSheet` and `ContourLod<S> = keyof S['assets']['contours'] & string`. The mask URL is `sheet.assets.contours[lod]`.
- `SheetBand` takes `sheet: BandSheet` (any sheet that ships a strip LOD) and passes it on with `lod="strip"`. SiteFooter passes `sheet={homePlate}` to the band and the legend. PosterSheet, MapSheet and EdgeArt pass `sheet={homePlate}`, each with one new import.
- `ContourField.test.tsx` now uses the sheet prop. Its LOD list is typed `ContourLod<typeof homePlate>`, and the `@ts-expect-error` deliberate-wrong-input check is still there.
- `client-graph.test.ts`: `data/generated/plates.ts` is now in `FORBIDDEN_IN_CLIENT_GRAPH`. The non-vacuity test also requires `components/terrain/ContourField.tsx` and `data/generated/home-plate.ts`.

## Static markup

The four components were rendered with `renderToStaticMarkup` through a throwaway Jest file (deleted before the Task 3 commit; never committed), using the props their existing tests pass (`<SiteFooter />`, `<PosterSheet />`, `<MapSheet photos={photoViews} />`, `<EdgeArt />`). Each was saved before any edit, after Task 1 and after Task 2. All three snapshots are **byte-identical** (`cmp` equal):

| Component | Bytes | sha256 prefix |
|-----------|-------|---------------|
| SiteFooter | 7,433 | 9e4fb8eaf7ba8a27 (same as 16-05 recorded) |
| PosterSheet | 7,250 | d93dd53c1a9dc875 |
| MapSheet | 17,563 | aa2e607f16c4118c |
| EdgeArt | 932 | 212060f7dde18d98 |

## Client JS

- Procedure: `rm -rf .next/static && npm run build`, the 15-01 byte-sum script, then `git restore public/service-worker.js`.
- **Total: 1,851,685 bytes in 24 files.** That is 113 B over the 16-01 base (1,851,572), 129 B under the 16-05 measurement (1,851,814) and 3,983 B under the budget (1,855,668). With one plate in the registry, the shipped sheet is nearly the same size as before. The saving shows once 16-10 onward add plates, because they no longer reach the footer chunk.

## Task Commits

1. **Task 1 (tracer): the home sheet end to end:** `f8b0ba3` (feat)
2. **Task 2: data-free ContourField, SheetBand and the callers in one commit:** `c6b48e6` (refactor)
3. **Task 3: client-graph guard and the bundle measurement:** `e846336` (test)

Each commit passed `npm run type-check`. Task 1 left SheetBand and ContourField unchanged, and Task 2 changed all seven compile-coupled files together.

## Decisions Made

- `homePlateText` and `platesText` share one `platesMeta(built)`, so the home module is the parsed plates.ts entry by construction.
- `home-plate.ts` is a home module in the selftest (`TERRAIN_HOME_MODULES`). That adds a byte-equal assertion to the existing fixture cases at no cost.
- `SheetBand` takes a concrete `BandSheet` structural type instead of a generic. `lod="strip"` is still checked, and the band's signature stays simple.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] `.gitattributes` entry for the new checked module**
- **Found during:** Task 1
- **Issue:** `terrain:build --check` compares `data/generated/home-plate.ts` byte for byte. This checkout uses `core.autocrlf=true`, and plates.ts, terrain.ts and precache.json all carry `text eol=lf`. Without the entry, a fresh Windows checkout would get CRLF and fail `data:check`. This is the same fix 16-05 made for home-photos.ts.
- **Fix:** Added `data/generated/home-plate.ts text eol=lf` after the plates.ts line.
- **Files modified:** .gitattributes
- **Commit:** f8b0ba3

**2. [Rule 2 - Coverage] Non-vacuity assertions for the new path**
- **Found during:** Task 3
- **Issue:** The forbidden-module test passes vacuously if the walk stops reaching the terrain components.
- **Fix:** The reach test now also requires `components/terrain/ContourField.tsx` and `data/generated/home-plate.ts`. As a negative check, a temporary `plates.ts` import in SheetLegend made the test fail, naming `app/global-error.tsx -> components/site/SiteChrome.tsx -> components/site/SiteFooter.tsx -> components/terrain/SheetLegend.tsx -> data/generated/plates.ts`. The file was then restored with `git checkout --`.
- **Files modified:** lib/__tests__/client-graph.test.ts
- **Commit:** e846336

**Total deviations:** 2 auto-fixed (Rule 2). **Impact:** none on behaviour. One attribute line keeps `data:check` stable across checkouts, and two assertions keep the guard from passing vacuously.

## Verification

- `npm run terrain:build -- --check`: `terrain: OK`
- `git diff --quiet 56d62af -- public/terrain data/generated/terrain.ts data/generated/precache.json data/generated/plates.ts`: exit 0
- `grep -c "generated/home-plate" scripts/terrain/build-terrain.mjs`: 2
- `grep -c "from '@/data/generated/plates'"` in SheetLegend.tsx and in ContourField.tsx: 0 and 0. `git grep -l` over components/ is empty.
- `grep -cF "data/generated/plates.ts" lib/__tests__/client-graph.test.ts`: 2
- `npx jest components/site/__tests__/SiteFooter.test.tsx components/terrain`: 22/22. Task 2 set: 22 suites, 214/214. `npx jest lib/__tests__/client-graph.test.ts components/site`: 9 suites, 87/87.
- Full Jest: 114 suites, 1,945/1,945 passed
- `npm run guard:selftest`: `selftest: 276/276 cases passed`
- `npm run guard:tests:scan`: `test-count: scan OK`
- `npm run lint` (eslint, every guard, the selftest and data:check): exit 0
- `npm run type-check`: exit 0 (after each task commit)

## Issues Encountered

None.

## Next Phase Readiness

16-10 onward can add plates to `data/terrain/plates.json` without growing the footer chunk. Phase 18's region pages can pass a `plates.ts` sheet to the same components on the server.

## Self-Check: PASSED

- FOUND: data/generated/home-plate.ts
- FOUND: f8b0ba3, c6b48e6, e846336 (all ancestors of HEAD)
