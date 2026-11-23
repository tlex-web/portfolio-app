---
phase: 16-new-regions-alps-overview-data
plan: 05
subsystem: data
tags: [photos, client-bundle, footer, global-error, selftest, jest]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-01 build-photo-data.mjs, tempPrivacyRoot and the seven privacy: selftest cases; the phase-base client JS (1,851,572 B)"
provides:
  - "data/home-waypoints.ts: homeWaypointIds (moved verbatim, type-only import), re-exported by data/home.ts"
  - "data/generated/home-photos.ts: homePhotoFacts, the Home waypoints' facts only, written and --checked by photos:build"
  - "homePhotos() reads homePhotoFacts; the footer chunk no longer imports data/generated/photos.ts"
  - "lib/__tests__/client-graph.test.ts: FORBIDDEN_IN_CLIENT_GRAPH and the global-error client-graph walk"
affects: [16-07, 16-10, 16-11, 16-12, 16-18]

actuals:
  tokens: 6512
  tasks: 2
  commits: 2
plan_head_before: 9799bb760f7edde0f6b0870987e3e7fcf74a6713
plan_head_after: 9eaf98a4a6db50cb1afb33d0013fb64d164eb4b3

tech-stack:
  added: []
  patterns:
    - "photos:build loads a .ts input under --root with a dynamic import of pathToFileURL(<root>/<rel>).href (Node type stripping erases the type-only import)"
    - "Client-graph walk: static value imports from a Client Component entry, @/ and relative resolution, type-only imports skipped, an unresolvable local import fails the walk"

key-files:
  created:
    - data/home-waypoints.ts
    - data/generated/home-photos.ts
    - lib/__tests__/client-graph.test.ts
  modified:
    - data/home.ts
    - lib/ascent/home-photos.ts
    - scripts/photos/build-photo-data.mjs
    - scripts/guards/selftest.mjs
    - .gitattributes

key-decisions:
  - "The Home list moved to the type-strippable data/home-waypoints.ts (the planned primary option); the JSON fallback was not needed, Node 26 loads the module directly"
  - "photos:build reads the Home list under --root; privacy roots write an empty list (export const homeWaypointIds = [];) and G5 roots copy the real one, so no selftest case body changed and no skip switch exists"
  - "--check compares data/generated/photos.ts before data/generated/home-photos.ts, so a change that alters both reports photos.ts (the G5 moved-photo case keeps its message)"

patterns-established:
  - "A generated module per client consumer: when a client chunk needs a slice of generated data, photos:build writes that slice as its own checked output instead of the client filtering the full set"

requirements-completed: [DATA-13]

coverage:
  - id: D1
    description: "photos:build reads data/home-waypoints.ts under --root and writes/checks data/generated/home-photos.ts with exactly the Home ids' facts in generated order"
    requirement: DATA-13
    verification:
      - kind: command
        ref: "npm run photos:build -- --check (photos:build: OK)"
        status: pass
      - kind: command
        ref: "scratchpad home-edge.mjs on temp copies: missing list fails naming the file and writes nothing; unknown id fails naming it; stale home-photos.ts fails naming the file"
        status: pass
    human_judgment: false
  - id: D2
    description: "homePhotos() returns the same four records in the same order and the SiteFooter static markup is byte-identical (DATA-09)"
    requirement: DATA-13
    verification:
      - kind: command
        ref: "renderToStaticMarkup(<SiteFooter />) and JSON of homePhotos() before and after: cmp identical (sha256 prefix 9e4fb8eaf7ba8a27 both)"
        status: pass
      - kind: test
        ref: "components/site/__tests__/SiteFooter.test.tsx, data/__tests__/home.test.ts, lib/__tests__/poster-frame.test.ts, lib/__tests__/ascent-waypoints.test.ts (55/55)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Selftest: G5 roots copy the Home list and output, privacy roots carry an empty Home list; every case passes"
    requirement: DATA-13
    verification:
      - kind: command
        ref: "npm run guard:selftest (selftest: 276/276 cases passed; 7 PASS privacy: lines; 0 FAIL)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The global-error client graph reaches the footer and Home module and no forbidden data module"
    requirement: DATA-13
    verification:
      - kind: test
        ref: "lib/__tests__/client-graph.test.ts#the global-error client graph imports no forbidden data module (13/13 tests); fails with the full chain against the pre-plan home-photos.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "Client JS within the phase base + 4,096 B"
    requirement: DATA-13
    verification:
      - kind: command
        ref: "rm -rf .next/static && npm run build, 15-01 byte-sum: 1,851,814 B in 24 files (budget 1,855,668 B)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-11-23
---

# Phase 16 Plan 05: Home-only photo module for the footer Summary

**photos:build now writes a Home-only `homePhotoFacts` module from `data/home-waypoints.ts` (read under `--root`). `homePhotos()` reads it, so the footer's global-error client chunk no longer imports the full photo set. A client-graph test pins that.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-11-23T01:20:39Z
- **Completed:** 2026-11-23T01:29:20Z
- **Tasks:** 2
- **Files modified:** 8 (3 created, 5 modified)

## Accomplishments

- `homeWaypointIds` moved verbatim (JSDoc included) to `data/home-waypoints.ts`, whose only import is `import type { PhotoId }`. `data/home.ts` re-exports it, so every importer still works.
- `build-photo-data.mjs` gains `HOME_WAYPOINTS_REL` and loads the list with `await import(pathToFileURL(path.join(ROOT, HOME_WAYPOINTS_REL)).href)`. The Home step runs after every photo is built and validated. It fails on `home waypoint <id> has no photo; fix homeWaypointIds in data/home-waypoints.ts` and on a root with no list (`cannot read data/home-waypoints.ts; every photos:build root needs a Home list`; nothing is written). Write mode writes both outputs; `--check` compares both and names the stale one. The header's Inputs, Outputs and `--root` notes are updated.
- `lib/ascent/home-photos.ts` imports `homePhotoFacts` from `@/data/generated/home-photos`. The signature, RangeError text and generated order are unchanged, and `HomePhoto` is now the Home module's record type.
- Selftest: `PHOTO_DATA_INPUTS` gains `data/home-waypoints.ts` and `data/generated/home-photos.ts`. `tempPrivacyRoot` writes `export const homeWaypointIds = [];` before it returns. No case body changed.
- `lib/__tests__/client-graph.test.ts`: a BFS from `app/global-error.tsx` over static value imports, plus `FORBIDDEN_IN_CLIENT_GRAPH` (photos.ts, image-manifest.ts). The forbidden test names the chain. A non-vacuity test checks that the walk reaches SiteChrome, SiteFooter, `lib/ascent/home-photos.ts` and `data/generated/home-photos.ts`. Eleven parser cases cover each import form, including type-only and commented-out imports.

## Footer markup

`renderToStaticMarkup(<SiteFooter />)` was saved before any edit and again after Task 1 (7,433 bytes each), through a throwaway Jest file that was deleted afterwards. The two outputs are **byte-identical** (`cmp` equal; both sha256 values start `9e4fb8eaf7ba8a27`). The JSON of `homePhotos()` is byte-identical too: the same four records in the same order.

## Client JS

- Procedure: `rm -rf .next/static && npm run build`, then the 15-01 byte-sum script, then `git restore public/service-worker.js`.
- **Total: 1,851,814 bytes in 24 files.** That is 242 B over the 16-01 phase base (1,851,572) and 3,854 B under the budget (1,855,668). The repo holds only the four Home photos today, so the photo slice shipped is the same size as before. The saving shows up once new photos land, because they no longer reach the footer chunk.

## Task Commits

1. **Task 1 (tracer): Home photo facts end to end:** `e45365a` (feat)
2. **Task 2: client-graph test and the bundle measurement:** `9eaf98a` (test)

## Decisions Made

- Primary option used: the type-strippable `data/home-waypoints.ts`. Node 26 loads it directly, so the JSON fallback was not needed.
- `--check` compares photos.ts first, so the G5 moved-photo case still reports `data/generated/photos.ts differs from a fresh build`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] `.gitattributes` entry for the new generated output**
- **Found during:** Task 1
- **Issue:** `photos:build --check` compares `data/generated/home-photos.ts` byte for byte. This checkout uses `core.autocrlf=true`, and every other checked output (photos.ts, plates.ts, terrain.ts and so on) carries `text eol=lf`. Without the entry, a fresh Windows checkout would get CRLF and fail the check.
- **Fix:** Added `data/generated/home-photos.ts text eol=lf` beside the photos.ts entry.
- **Files modified:** .gitattributes
- **Commit:** e45365a

**2. [Placement] Explanatory comment outside the moved JSDoc**
- The plan says to move the JSDoc verbatim, so the note on why the list has its own module is a file-top line comment in `data/home-waypoints.ts`, not an edit to the JSDoc.

**Total deviations:** 1 auto-fixed (Rule 2), 1 placement note. **Impact:** none on behaviour; the extra attribute line keeps `data:check` stable across checkouts.

## Verification

- `npm run photos:build -- --check`: `photos:build: OK`
- `grep -c "from '@/data/generated/photos'" lib/ascent/home-photos.ts`: 0
- Home/footer Jest set: 4 suites, 55/55 passed
- `npm run guard:selftest`: `selftest: 276/276 cases passed`, 7 `PASS privacy:` lines, 0 `FAIL`
- `npx jest lib/__tests__/client-graph.test.ts`: 13/13 passed. Against the pre-plan `home-photos.ts`, 2 tests fail, and the failure names `app/global-error.tsx -> components/site/SiteChrome.tsx -> components/site/SiteFooter.tsx -> lib/ascent/home-photos.ts -> data/generated/photos.ts`
- `image-manifest.ts` is not reachable from global-error today, so no stop was needed
- Full Jest: 114 suites, 1,933/1,933 passed
- `npm run lint` (eslint, every guard, the selftest and data:check): exit 0
- `npm run type-check`: exit 0
- Acceptance greps: homePhotoFacts in home-photos.ts 1, home-waypoints in build-photo-data.mjs 4, home-waypoints in selftest.mjs 2, pathToFileURL in build-photo-data.mjs 2, FORBIDDEN_IN_CLIENT_GRAPH in client-graph.test.ts 3

## Issues Encountered

None.

## Next Phase Readiness

Ready for 16-07, which does the same for plates. New photos (16-10 onward) now stay out of the footer chunk, and the client-graph test fails if one leaks back.

## Self-Check: PASSED

- FOUND: data/home-waypoints.ts, data/generated/home-photos.ts, lib/__tests__/client-graph.test.ts
- FOUND: e45365a, 9eaf98a (both ancestors of HEAD)
