---
phase: 17-region-routes-seo-structured-data
plan: 09
subsystem: infra
tags: [terrain, overview, gitattributes, selftest, jest, review-fixes]

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: the overview build, the plate strip check, the 16-bit plate and overview sources, homePhotos, and the 16-REVIEW findings IN-03, IN-05, IN-06 and IN-07
  - phase: 17-region-routes-seo-structured-data
    provides: 17-08's selftest state (298 cases)
provides:
  - "data/generated/overview.ts: every summit carries source and borders from data/terrain/overview.json"
  - "build-terrain: a strip-band containment check (STRIP_SNAP_M = 100) that fails, naming data/terrain/plates.json, before stripBbox could clamp"
  - "selftest case 'terrain: a strip band that would leave its plate extent fails (16 IN-06)' (299/299)"
  - ".gitattributes: binary for data/terrain/plates/**/*.png and data/terrain/overview/*.png; text eol=lf for their source.json files"
  - "homePhotos' RangeError names data/generated/home-photos.ts, npm run photos:build and data/home-waypoints.ts; lib/__tests__/home-photos.test.ts pins it"
affects: [17-15 review write-back, Phase 18 sources page, terrain build]

actuals:
  tokens: 74946
  tasks: 3
  commits: 4
plan_head_before: 7b037f11daec96084a497367501b95486045fa46
plan_head_after: 72e38e6a4c198f52d9d0b07c20db7f69e7835b29

tech-stack:
  added: []
  patterns:
    - "A build-time check that mirrors a library clamp's condition exactly, so the clamp is unreachable for committed data rather than silently corrective"
    - "Attribute-level EOL and binary rules for every sha256-verified terrain source, proven with git add --renormalize"

key-files:
  created:
    - lib/__tests__/home-photos.test.ts
  modified:
    - scripts/terrain/build-terrain.mjs
    - data/generated/overview.ts
    - data/__tests__/overview.test.ts
    - scripts/guards/selftest.mjs
    - .gitattributes
    - lib/ascent/home-photos.ts

key-decisions:
  - "16 IN-05 (0744dfe): overviewSummits copies source and borders (after officialRef, before uv). Only data/generated/overview.ts regenerated; the overview contour SVG and every plate asset are unchanged"
  - "16 IN-06 (909677f): the band check uses the same condition as stripBbox's clamp (south < extent.south or south + height > extent.north, south snapped to 100 m). The snap is a named STRIP_SNAP_M passed to stripBbox too, so both cannot drift apart. The existing centre check runs first and keeps its message"
  - "16 IN-07 (14dd850): four .gitattributes lines; git add --renormalize over data/terrain/plates and data/terrain/overview staged nothing"
  - "16 IN-03 (72e38e6): the message names data/home-waypoints.ts (the Home list photos:build reads) instead of data/home.ts (which re-exports it)"

patterns-established:
  - "One commit per review finding, its SHA recorded for the disposition write-back"

requirements-completed: [REGION-07]

coverage:
  - id: D1
    description: "16 IN-05: every overview summit carries its height source and borders, so Triglav keeps an attribution; only overview.ts regenerated"
    requirement: REGION-07
    verification:
      - kind: unit
        ref: "data/__tests__/overview.test.ts#every summit keeps overview.json's height source and borders; Triglav keeps an attribution (16 IN-05)"
        status: pass
      - kind: other
        ref: "git diff --name-only 7b037f1 HEAD -- data/generated public/terrain (only data/generated/overview.ts); npm run terrain:build -- --check (terrain: OK)"
        status: pass
    human_judgment: false
  - id: D2
    description: "16 IN-06: a strip band that would leave its plate extent fails the terrain build, naming data/terrain/plates.json"
    requirement: REGION-07
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#terrain: a strip band that would leave its plate extent fails (16 IN-06)"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#terrain: a strip centre outside its plate fails (unchanged)"
        status: pass
      - kind: other
        ref: "git diff --quiet 909677f^ 909677f -- data/generated public/terrain"
        status: pass
    human_judgment: false
  - id: D3
    description: "16 IN-07: the plate and overview 16-bit PNGs are binary and their source.json files LF by attribute"
    requirement: REGION-07
    verification:
      - kind: other
        ref: "git ls-files --eol -- data/terrain/plates data/terrain/overview | grep -cE 'attr/(-text|text eol=lf) ' (6)"
        status: pass
      - kind: other
        ref: "git add --renormalize data/terrain/plates data/terrain/overview (nothing staged)"
        status: pass
    human_judgment: false
  - id: D4
    description: "16 IN-03: homePhotos' error names data/generated/home-photos.ts and npm run photos:build"
    requirement: REGION-07
    verification:
      - kind: unit
        ref: "lib/__tests__/home-photos.test.ts#names the id, data/generated/home-photos.ts and npm run photos:build"
        status: pass
      - kind: other
        ref: "npm run lint (exit 0, selftest 299/299, data:check OK); npx tsc --noEmit (exit 0)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-11-24
status: complete
---

# Phase 17 Plan 09: Remaining Phase 16 review fixes (16 IN-05, IN-06, IN-07, IN-03) Summary

**Overview summits now carry their height source and borders into `overview.ts`, a strip band that would leave its plate extent fails the terrain build instead of being clamped, the plate and overview sources are binary/LF by attribute, and homePhotos' error points at `data/generated/home-photos.ts` and `npm run photos:build`. There are four commits, one per finding.**

## Performance

- **Duration:** about 10 min
- **Started:** 2026-11-24T00:15:55Z
- **Completed:** 2026-11-24T00:25:13Z
- **Tasks:** 3
- **Files modified:** 7 (1 created, 6 modified)

## Accomplishments

- **IN-05:** `overviewSummits` writes `source` and `borders` for each summit. Triglav (secondary, `officialRef: null`) keeps its attribution. `"borders"` appears 5 times and `"source"` 6 times in `overview.ts`. The regenerated module is the only changed file under `data/generated` and `public/terrain`. `terrain:build --check` is clean and OVERVIEW_BUDGET still holds (53,880 B raw, 14,302 B brotli, unchanged).
- **IN-06:** after the existing centre check, build-terrain computes the band the way stripBbox does. The height is extent width / 5, and the south edge is snapped to `STRIP_SNAP_M` = 100 m. The build throws `plate <id>: strip band <s>..<n> for centreN <c> leaves its extent (<south>..<north>); fix data/terrain/plates.json`. All three committed plates pass, and nothing regenerates.
- **IN-07:** `.gitattributes` now has `data/terrain/plates/**/*.png binary` and `data/terrain/overview/*.png binary`, plus `text eol=lf` for both source.json paths. `git ls-files --eol` shows the three PNGs as `attr/-text` and the three source.json files as `attr/text eol=lf`. A renormalize changed no content.
- **IN-03:** the RangeError now reads `homePhotos: Home waypoint <id> has no photo in data/generated/home-photos.ts; run npm run photos:build, or fix homeWaypointIds in data/home-waypoints.ts`. A new Jest file pins it.

## Task Commits

1. **Task 1: 16 IN-05, overview summits keep their height source and borders**: `0744dfe` (fix)
2. **Task 2: 16 IN-06, a strip band that would leave its extent fails the terrain build**: `909677f` (fix)
3. **Task 3a: 16 IN-07, binary and LF attributes for the plate and overview sources**: `14dd850` (fix)
4. **Task 3b: 16 IN-03, homePhotos' error names data/generated/home-photos.ts**: `72e38e6` (fix)

SHAs for 17-15's write-back to 16-REVIEW-DISPOSITION.md: **IN-05 `0744dfe`**, **IN-06 `909677f`**, **IN-07 `14dd850`**, **IN-03 `72e38e6`**.

## Files Created/Modified

- `scripts/terrain/build-terrain.mjs`: summit records gain `source` and `borders`. Adds `STRIP_SNAP_M` and the strip-band check; stripBbox receives the snap explicitly.
- `data/generated/overview.ts`: regenerated (16 lines added, summit fields only).
- `data/__tests__/overview.test.ts`: the IN-05 case (source and borders per summit, Triglav's source non-empty).
- `scripts/guards/selftest.mjs`: `terrainStripBandRoot` (2D fixture, centreN 1200040), the IN-06 case, and the cleanup list entry.
- `.gitattributes`: four lines for the plate and overview sources.
- `lib/ascent/home-photos.ts`: the corrected message.
- `lib/__tests__/home-photos.test.ts` (new): the IN-03 message test.

## Decisions Made

- The band check mirrors stripBbox's clamp condition exactly instead of making stripBbox throw. `lib/geo.ts` and its tests stay untouched, and the build-time check means the clamp can never fire for a committed plate.
- The selftest fixture centre is 1200040, not 1200050. At 1200050 the snapped band (`Math.round(11999.5)` = 12000) starts at 1200000, which is inside the extent. 1200040 snaps to 1199900, a real violation 40 m inside the south edge.
- `actuals.tokens` is chars/4 over the full content of the 7 changed files, the same scale as the plan's 65,000 estimate and 17-08's figure. chars/4 over the diff alone is 3,501.

## Deviations from Plan

None. The plan was executed as written.

## TDD Gate Compliance

All three tasks are `tdd="true"`, but each action says "Commit alone" and 17-15 needs one SHA per finding. So there are no separate `test(17-09)` RED commits; the same approach as 17-08. The cycle still ran in order for each finding:
- **IN-05:** **RED:** the new overview.test case failed with `Expected: "swisstopo SearchServer …" Received: undefined` on `s.source`. Semantic assessment: valid RED, an assertion failure on the planned behavior in the target test. **GREEN:** after the build change and `terrain:build`, 132/132 tests passed across overview, terrain and plates.
- **IN-06:** **RED:** the new selftest case failed with `expected exit 1, got 0` and the missing `strip band …` output, because the build silently clamped the band and wrote the fixture's assets. Semantic assessment: valid RED, it shows the exact defect. **GREEN:** after the check went in, 299/299 cases passed.
- **IN-03:** **RED:** the new test failed with `Expected substring: "data/generated/home-photos.ts"`, receiving the old `data/generated/photos.ts` message. Semantic assessment: valid RED. **GREEN:** after the message change, 45/45 tests passed across home-photos, SiteFooter, client-graph and home.
- **IN-07** is a config change with an attribute assertion (`git ls-files --eol`). It printed 6 after the change; no RED test applies.
- **REFACTOR:** none needed.

## Issues Encountered

None. Pre-existing prettier warnings in build-terrain.mjs, selftest.mjs and home-photos.ts are present at HEAD too (EOL and trailing comma). They are out of scope and untouched; prettier is not part of `npm run lint`.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is needed. No networked fetch was run; only offline `terrain:build`, `data:check`, the selftest and lint ran.

## Next Phase Readiness

- 17-15 can write back IN-03, IN-05, IN-06 and IN-07 with the SHAs above.
- Phase 18's sources page can read each summit's `source` and `borders` from `data/generated/overview.ts`.
- No PNGs were staged, and `check-snapshot-commit --none` passed after each commit (D-10).

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-24*

## Self-Check: PASSED

- FOUND: lib/__tests__/home-photos.test.ts, data/generated/overview.ts, .gitattributes
- FOUND: 0744dfe, 909677f, 14dd850, 72e38e6 (each an ancestor of HEAD)
- Acceptance: `"borders"` 5, `"source"` 6, `strip band` in build-terrain 2, PASS line 1, selftest 299/299, gitattributes PNG line 1, old message 0, `npm run photos:build` 1, eol attr count 6, generated diff = overview.ts only, lint exit 0, tsc exit 0
