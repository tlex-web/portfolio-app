---
phase: 15-region-plate-data-model
plan: 05
subsystem: data
tags: [terrain, plates, generator, guards, selftest, budget]
status: complete

requires:
  - phase: 15-04
    provides: "plate registry, plates.ts, PLATE_BUDGET, --root in build-terrain.mjs"
provides:
  - "build-terrain.mjs: MANAGED accepts an optional plate prefix, so the union sweep and --check see prefixed files (D-10, F15, Pitfall 4)"
  - "resolveHeightmap and inspectPoster anchored to each plate's prefix; prefixed heightmap names (D-11)"
  - "committedPlates() + recordedPosters(): a non-home plate keeps its recorded poster set from plates.ts; shading parameters stay global in terrain.ts"
  - "Per-plate PLATE_BUDGET check (served and fetch) in write mode, before any write, and in --check"
  - "selftest: tempTerrainRoot({ fixture, fixtureFirst }) with a synthetic 100 x 100 2D fixture plate and three terrain cases"
affects: [16, 18]

actuals:
  tokens: 4639
  tasks: 2
  commits: 2
plan_head_before: bb7b3d0687147a892b4388bbe4e7f083e769538f
plan_head_after: bf72d86dc49690707b8def15f62d9794b054fc70

tech-stack:
  added: []
  patterns:
    - "Fixture plate in the guard selftest: an async temp-root builder at module top level (setup hooks are synchronous), setup runs the write pass, the case spawn runs the pass under test"
    - "Selftest check(output): a check hook gets the spawn output when an expected fragment is only known at runtime (a content-hashed file name)"

key-files:
  created: []
  modified:
    - scripts/terrain/build-terrain.mjs
    - scripts/guards/selftest.mjs

key-decisions:
  - "15-05: a non-home plate's poster set is read from plates.ts, but the shading parameters it is compared against are terrain.ts's recorded hillshade (one global parameter set)"
  - "15-05: the budget is checked in memory before write mode writes anything (an over-budget plate leaves the tree untouched) and as a stale line in --check; the fetch uses the 1100 AVIF, or 640 when a plate has no 1100, matching plates.test.ts"
  - "15-05: the selftest runner now passes the spawn output to check(), so case (b) can require the exact hashed file name in the --check output"

patterns-established:
  - "Pattern: every public/terrain/ lookup builds its regex from the plate's prefix (PlatePrefix admits only [a-z-], so it is literal)"

requirements-completed: [DATA-11]

coverage:
  - id: D1
    description: "A fixture 2D plate listed before matterhorn gets exactly six prefixed files (hero and strip contours, hillshade 1100/640 in AVIF and WebP), no heightmap or map LOD; the nine Matterhorn files, terrain.ts and precache.json stay byte-equal; plates.ts lists both plates; --check is OK"
    requirement: DATA-11
    verification:
      - kind: other
        ref: "scripts/guards/selftest.mjs#terrain: a fixture 2D plate gets its own prefixed files and Matterhorn stays byte-equal"
        status: pass
    human_judgment: false
  - id: D2
    description: "--check names a deleted prefixed plate file"
    requirement: DATA-11
    verification:
      - kind: other
        ref: "scripts/guards/selftest.mjs#terrain: --check sees a missing prefixed plate file"
        status: pass
    human_judgment: false
  - id: D3
    description: "Removing a plate from the registry sweeps exactly its prefixed files; Matterhorn, terrain.ts, precache.json and plates.ts stay byte-equal"
    requirement: DATA-11
    verification:
      - kind: other
        ref: "scripts/guards/selftest.mjs#terrain: removing a plate sweeps only its files"
        status: pass
    human_judgment: false
  - id: D4
    description: "The real tree is unchanged: terrain:build --check is OK and a write run leaves public/terrain and data/generated clean"
    requirement: DATA-11
    verification:
      - kind: other
        ref: "npm run terrain:build -- --check (terrain: OK)"
        status: pass
      - kind: other
        ref: "npm run terrain:build && git status --porcelain -- public/terrain data/generated (empty)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The builder fails a plate over PLATE_BUDGET (served or fetch) with a message naming the plate, its bytes and the budget"
    requirement: DATA-11
    verification:
      - kind: other
        ref: "manual mutation: servedMax3D 1_000 and fetchMax 2_000 made write mode exit 1 before writing and --check report 2 stale; schema restored"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-11-14
---

# Phase 15 Plan 05: N-Plate Terrain Builder and Fixture Plate Summary

**The terrain build now handles N plates: prefixed files are swept and checked against the union of every plate's names, lookups are anchored to each plate's prefix, a non-home plate's posters come from plates.ts, and each plate is held to PLATE_BUDGET. A synthetic 2D fixture plate in the guard selftest gets its own six prefixed files while every Matterhorn byte stays the same, in either registry order.**

## Performance

- **Duration:** about 9 min (20:49:35Z to 20:58:36Z)
- **Tasks:** 2 (Task 1 tracer, Task 2 auto)
- **Files modified:** 2

## Accomplishments

- `MANAGED` now matches `^(?:[a-z]+(?:-[a-z]+)*-)?(contours-…|heightmap-…|hillshade-…)$`. Write mode already swept against `built.flatMap(namesOf)` (the union over plates), so a removed plate's prefixed files are now deleted, and `--check` reports them as `extra` or `missing` (Pitfall 4).
- `resolveHeightmap(prefix, size, u16)` and `inspectPoster(file, prefix, size, format)` build their regexes from the plate's prefix, and new heightmap names carry the prefix. A `fixture-heightmap-*` or `fixture-hillshade-*` file is never a Matterhorn candidate, and the reverse holds too.
- `committedPlates()` parses `export const plates = … as const;` from plates.ts. `recordedPosters(plate)` returns the home plate's set from terrain.ts, or another plate's set from plates.ts, and in both cases the parameters from terrain.ts's `hillshade`. On a second write run the fixture's posters are kept, not re-encoded. A source-sha mismatch in `--check` now names any plate's recorded posters, not only the home plate's.
- `budgetProblems()`: served = every file in the plate's build (in-memory sizes for files this run produced, on-disk sizes for the rest), checked against `servedMax3D` / `servedMax2D`. Fetch = the AVIF poster (1100, else 640) + hero + strip, checked against `fetchMax`. Write mode exits 1 before writing anything. `--check` adds a stale line. Matterhorn: 1,019,131 B served and 180,757 B fetch, the same as 15-04.
- `selftest.mjs`: `fixtureDem()` (a cosine hill, 1,500 to about 2,500 m, in decimetres, built by sharp from a `Uint16Array`), `tempTerrainRoot({ fixture, fixtureFirst })`, `terrainWrite`, `terrainBytesEqual`, `fixturePlateProblems`, and three cases. The selftest went from 219 to 222 cases, all passing.

## Task Commits

1. **Task 1: prefix-aware sweep and lookups, committedPlates(), fixture-plate case** - `cf720f5` (feat)
2. **Task 2: per-plate PLATE_BUDGET, --check and sweep cases** - `bf72d86` (feat)

Tracer gate: auto mode off, `human_verify_mode` end-of-phase, and the verify step is automated only. All three Task 1 verify commands were re-run and passed (`PASS terrain: a fixture 2D plate` x1, `terrain: OK`, clean tree after a write run) before Task 2 started, so no checkpoint was needed.

## Files Created/Modified

- `scripts/terrain/build-terrain.mjs`: prefix-aware `MANAGED`, anchored lookups, `committedPlates()`, `recordedPosters()`, `sizeLookup()`, `budgetProblems()`, header docs
- `scripts/guards/selftest.mjs`: the fixture-plate helpers, three `terrain:` cases, three temp roots in the cleanup list, `check(output)` in the runner and the header

## Decisions Made

- There is one global shading parameter set. A non-home plate's recorded posters are compared with terrain.ts's `hillshade` (as the plan says); plates.ts sheets do not record parameters.
- Each fixture root is built at module top level with `await`, like `photoDeriveRoot`, because case `setup` hooks are synchronous. The case's `setup` runs the write pass. The case's own spawn runs the pass under test: `--check` for (a) and (b), write for (c).
- Case (b) needs the exact hashed file name in the output, so the runner now calls `c.check(output)`. Existing checks ignore the argument.

## Deviations from Plan

None in scope. The plan was executed as written. The one shared-code change, `check(output)` in the selftest runner, is the smallest way to let case (b) assert the exact file name from the plan. It does not change the behaviour of any existing case.

## Verification

- `npm run guard:selftest`: 222/222. The three `PASS terrain:` lines are present (grep count 3).
- `npm run terrain:build -- --check`: `terrain: OK`. After a write run, `git status --porcelain -- public/terrain data/generated` is empty.
- `git ls-files -co --exclude-standard -- data/terrain/plates`: empty, so no fixture data was committed or left behind.
- `npm run type-check` exit 0. `npm run lint` exit 0 (eslint, every guard, the selftest, data:check, guard:images, the tests scan).
- Jest `plates.test.ts` + `terrain.test.ts`: 81/81.
- Budget mutation (manual, reverted): with `servedMax3D` set to 1_000 and `fetchMax` to 2_000, write mode printed both messages and `terrain: 2 over budget` and wrote nothing. `--check` printed both and `terrain: 2 stale`. After the schema was restored with `git checkout`, its LF line endings were put back, so the working tree matches its pre-test state.
- Concurrency truth (backstop, no test): write mode writes the assets first and the three modules last, and every name is content-hashed. An interrupted run therefore leaves either new assets that the old modules do not reference (`extra`) or modules that do not match (`stale`). Re-running restores the committed bytes.

## Issues Encountered

- About 28 old `guard-selftest-*` directories are in the OS temp dir. They hold photo-data and parity roots from earlier selftest runs. None holds a terrain fixture, and all three new terrain roots are in the cleanup list. This predates this plan and is out of scope.

## Known Stubs

None.

## Threat Flags

None. The sweep still deletes only `MANAGED` names inside `public/terrain/` that are not in the union of expected names (T-15-33, proved by case (c)). The budget mitigates T-15-06 in the builder.

## User Setup Required

None.

## Next Phase Readiness

- Phase 16 can add real 2D plates to `data/terrain/plates.json` with a `data/terrain/plates/<id>/` source. The builder, `--check`, the sweep and the budget handle them without further changes.
- As 15-04 noted: once real prefixed files are committed, scope the D-15 `readdirSync` in `terrain.test.ts` to unprefixed names. The selftest's `matterhornFiles()` reads the repo listing in the same way and will need the same filter.

---
*Phase: 15-region-plate-data-model*
*Completed: 2026-11-14*

## Self-Check: PASSED

- FOUND: scripts/terrain/build-terrain.mjs, scripts/guards/selftest.mjs
- FOUND commits: cf720f5, bf72d86 (both ancestors of HEAD)
