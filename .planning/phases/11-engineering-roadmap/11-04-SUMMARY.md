---
phase: 11-engineering-roadmap
plan: 04
subsystem: data
tags: [swisstopo, geo.admin.ch, wanderwege, dem, elevation-profile, zod, build-script]

requires:
  - phase: 08-data-terrain-pipeline
    provides: committed swissALTIRegio DEM (dem-10m.png + source.json), sampleAtLv95, build-terrain decode pattern
provides:
  - data/terrain/source/trails.json (official swissTLM3D Wanderwege geometry for Hörnliweg No. 27 and Zmutt path No. 2, with provenance and polylineSha256)
  - lib/trail-profile.ts (polylineLength, resampleByArcLength, normaliseProfile, profilePath)
  - data/schemas/trail.ts (TrailSpec, TrailsFile)
  - data/generated/trail-profiles.ts (trailProfiles, TrailId; RSC-only)
  - npm run trails:fetch (manual) / trails:build (offline, --check in data:check)
affects: [11-12 RouteProfile panels, 11-06, data:check, lint]

actuals:
  tokens: 28355
  tasks: 2
  commits: 5
plan_head_before: 5267f434eef673493f919873dbf4bd25a17af563
plan_head_after: 10d22d44d0d187fd74b727952f63e83b4b477dde

tech-stack:
  added: []
  patterns:
    - "Manual networked fetch -> committed source with per-item sha256 -> offline generator with byte-compare --check (same shape as Phase 8 terrain)"
    - "Trail routing: Dijkstra over swissTLM3D Wanderwege LineStrings, endpoints within 1 m merged into one node"

key-files:
  created:
    - scripts/terrain/fetch-trails.mjs
    - scripts/terrain/build-trails.mjs
    - data/schemas/trail.ts
    - data/terrain/source/trails.json
    - data/generated/trail-profiles.ts
    - lib/trail-profile.ts
    - lib/__tests__/trail-profile.test.ts
    - data/__tests__/trail-profiles.test.ts
  modified:
    - package.json
    - .gitattributes

key-decisions:
  - "Zmutt path No. 2 routes start Zermatt (Bahnhofplatz 1) -> via Zen Stecken (named in the listing's directions) -> end Zmutt 56 (the hamlet's western edge): 4,291 m vs official 4,300 m. Ending at the gazetteer's Zmutt point (hamlet centre) gives 3,614 m (-16 %), because the listing's 4.3 km track runs on through the hamlet."
  - "Hörnliweg No. 27 starts at the Schwarzsee lift station (where the listing's track starts): 4,316 m; the Hotel Schwarzsee start gives 4,220 m and leaves the track by 71 m."
  - "Profile captions for 11-12 (DEM, 08 D-17): Hörnliweg Schwarzsee 2,587 m -> Hörnlihütte 3,262 m; Zmutt path Zermatt 1,606 m -> Zmutt 1,950 m."
  - "trails.json is 2-space JSON with one [e, n] vertex per line (55 KB instead of 106 KB); trail-profiles.ts has one { x, y } point per line (9.5 KB)."

patterns-established:
  - "Trail source contract: TrailsFile (strict zod, NFC names, polylineSha256 = sha256(JSON.stringify(polyline)))"
  - "Generated RSC-only module guarded by a test that scans app/, components/, lib/ for 'use client' importers"

requirements-completed: [ENG-01]

coverage:
  - id: D1
    description: "Profile maths: polylineLength, resampleByArcLength, normaliseProfile (RangeError on equal heights), profilePath"
    requirement: ENG-01
    verification:
      - kind: unit
        ref: "lib/__tests__/trail-profile.test.ts (15 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Committed official trail geometry (both trails within 10 % of 4.3 km, inside the sheet, sha256 and NFC names verified)"
    requirement: ENG-01
    verification:
      - kind: other
        ref: "Task 1 verify command 2 (TrailsFile.parse + length/extent/sha/NFC check): hoernliweg-27 4316 m, zmutt-2 4291 m"
        status: pass
    human_judgment: false
  - id: D3
    description: "Generated DEM profiles with offline --check wired into data:check"
    requirement: ENG-01
    verification:
      - kind: unit
        ref: "data/__tests__/trail-profiles.test.ts (+ data/__tests__/terrain.test.ts), 55 tests"
        status: pass
      - kind: other
        ref: "npm run data:check -> trails: OK"
        status: pass
    human_judgment: false
  - id: D4
    description: "Zmutt end point choice (hamlet's western edge, Zmutt 56) represents the official Zmutt path No. 2 well enough for the coin-flip panel"
    verification: []
    human_judgment: true
    rationale: "Route-fidelity judgement: the listing names the end 'Zmutt (1,937 m)' but its 4.3 km track runs past the hamlet centre; whether the 1,950 m DEM end height reads right in the caption is Tim's call"

duration: 12min
completed: 2026-11-01
status: complete
---

# Phase 11 Plan 04: Trail Geometry and DEM Profiles Summary

**Official swisstopo Wanderwege geometry for Hörnliweg No. 27 (T4, 4,316 m) and Zmutt path No. 2 (T1, 4,291 m via Zen Stecken), committed with provenance and sha256, and turned into 128-point DEM elevation profiles by an offline generator whose `--check` now runs in `data:check`.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-11-01T18:28:29Z
- **Completed:** 2026-11-01T18:40:07Z
- **Tasks:** 2
- **Files modified:** 10 (8 created, 2 modified)

## Accomplishments

- `lib/trail-profile.ts`: pure, import-free profile maths. Equal heights throw a RangeError instead of dividing by zero, and a repeated vertex never produces a duplicate station (the ENG-01 adjacency edge).
- `data/terrain/source/trails.json`: both trails routed over the official `ch.swisstopo.swisstlm3d-wanderwege` network (SearchServer and identify only, as COVERAGE.md allows), rounded to 0.1 m, with feature ids, fetchedAt and polylineSha256.
- `data/generated/trail-profiles.ts`: 128 normalised points per trail, DEM start and end heights, and lengthM. It is RSC-only, and a test scans app/, components/ and lib/ for client importers.
- `npm run data:check` ends with `trails: OK`. A stale module or a tampered polyline makes it fail with exit 1 (both cases tested by hand).

## Trail record (for 11-12 and the content packet)

| Trail | Start -> end (named points) | Via | Routed | Official | DEM start -> end |
|-------|-----------------------------|-----|--------|----------|------------------|
| Hörnliweg No. 27 (T4) | Schwarzsee (lift station "Zermatt Schwarzsee") -> Hörnlihütte | none | 4,316 m (+0.4 %) | 4,300 m | 2,587 m -> 3,262 m |
| Zmutt path No. 2 (T1) | Zermatt (Bahnhofplatz 1, the station) -> Zmutt (Zmutt 56, the hamlet's western edge) | **Zen Stecken** (LV95 2623508.8 / 1096094.4), named in the listing's directions "Zermatt train station - Zen Stecken - Zmutt" | 4,291 m (-0.2 %) | 4,300 m | 1,606 m -> 1,950 m |

Exact fetch command (run once, on 2026-11-01, from the repo root):

```
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/terrain/fetch-trails.mjs
```

(`npm run trails:fetch` runs the same command.)

## Task Commits

1. **Task 1 RED:** `097321b` test(11-04): failing tests for profile maths
2. **Task 1 GREEN (maths):** `5dc14eb` feat(11-04): pure, import-free trail profile maths (D-05)
3. **Task 1 (geometry):** `82cb8a4` feat(11-04): official trail geometry for box and coin-flip, with provenance (D-05, D-07)
4. **Task 2 RED:** `4dfb44c` test(11-04): failing tests for generated trail profiles
5. **Task 2 GREEN:** `10d22d4` feat(11-04): DEM trail profiles generated offline with --check (D-05)

## Files Created/Modified

- `scripts/terrain/fetch-trails.mjs`: the manual, networked fetch (SearchServer, then Wanderwege identify with paging, then a graph and Dijkstra, a 10 % length gate and a parse before writing)
- `scripts/terrain/build-trails.mjs`: the offline generator. It checks the DEM sha256 and each polyline sha256, decodes grey16, and samples with `sampleAtLv95`. `--check` byte-compares the output.
- `data/schemas/trail.ts`: strict `TrailSpec` and `TrailsFile`, NFC-refined names
- `data/terrain/source/trails.json`: the committed geometry and provenance
- `data/generated/trail-profiles.ts`: `trailProfiles` and `TrailId`
- `lib/trail-profile.ts`: `polylineLength`, `resampleByArcLength`, `normaliseProfile`, `profilePath` (default box 320 x 96, inset 8)
- `lib/__tests__/trail-profile.test.ts`, `data/__tests__/trail-profiles.test.ts`: 15 + 17 tests
- `package.json`: adds `trails:fetch` and `trails:build`; `data:check` now runs `trails:build -- --check`
- `.gitattributes`: LF for trails.json and trail-profiles.ts

## Decisions Made

- **Zmutt end point.** The research assumed the shortest path leaves the official line and that via points would fix it. In fact the routed line through Zen Stecken matches the listing's track (within 22 m) up to the hamlet centre. The 4.3 km track then continues west through the hamlet and stops at a junction below its western edge. The gazetteer's "Zmutt" point (the hamlet centre) therefore routes only 3,614 m (-16 %). The end is the hamlet's western address, Zmutt 56, which routes 4,291 m. Over its last 170 m it follows the marked trail about 80 m beyond the track's final junction.
- **Hörnliweg start.** The lift station "Zermatt Schwarzsee" gives 4,316 m and stays within 44 m of the listing's track. The Hotel Schwarzsee start gives 4,220 m and leaves the track by up to 71 m.
- **DEM end height for Zmutt** is 1,950 m. The listing says "Zmutt (1,937 m)", which is the hamlet centre (the old packet's DEM value there was 1,934 m), and gives a highest point of 1,945 m. The western-edge end sits slightly higher.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The Zmutt route failed the 10 % gate with the planned end point**
- **Found during:** Task 1 (first fetch run)
- **Issue:** The planned route (station, then Zen Stecken, then the gazetteer "Zmutt" point) routed 3,614 m (-16 %), so the script refused to write. Adding via points could not help, because the shortest path already follows the official line. The route was too short at its end, not wrong in shape.
- **Fix:** The end resolves to the SearchServer address "Zmutt 56 3920 Zermatt" (the hamlet's western edge, where the listing's track ends). Zen Stecken stays as the single via point. The reasoning is recorded in the TRAIL_SPECS comment.
- **Files modified:** scripts/terrain/fetch-trails.mjs
- **Verification:** routed 4,291 m (-0.2 %); Task 1 verify command passes
- **Committed in:** 82cb8a4

**2. [Rule 2 - Missing critical] Line endings for the byte-compared files**
- **Found during:** Task 2
- **Issue:** This repo checks out with `core.autocrlf=true`. Without an `eol=lf` rule, a fresh Windows checkout of trail-profiles.ts would be CRLF and would fail the byte-for-byte `--check`. The same risk applied to the LF-written trails.json. `.gitattributes` was not in files_modified.
- **Fix:** Added `text eol=lf` entries for both files, mirroring the Phase 8 entries.
- **Files modified:** .gitattributes
- **Committed in:** 10d22d4

**3. [Rule 3 - Blocking/size] Compact vertex formatting in trails.json**
- **Found during:** Task 1
- **Issue:** Plain `JSON.stringify(file, null, 2)` puts every vertex over four lines (106 KB).
- **Fix:** The file is still 2-space JSON, but with one `[e, n]` per line (55 KB). The script asserts that the reformatted text parses back to identical data. Hashes are unaffected, because polylineSha256 is computed over `JSON.stringify(polyline)`, not the file text.
- **Committed in:** 82cb8a4

**4. [Process] Reference check against the listings' GPX tracks**
- To choose the end points from evidence, I downloaded the "GPS-track (GPX)" file linked from each zermatt.swiss listing (maptoolkit.net) once, into the session scratchpad. I compared each against the routed lines (max deviation: Hörnliweg 15/44 m, Zmutt 39 m up to the track end). These files are not committed and `fetch-trails.mjs` never fetches them. The committed geometry comes only from the two geo.admin.ch capabilities in COVERAGE.md.

**5. [Process] Extra GREEN commit in Task 1**
- The maths GREEN (`5dc14eb`) was committed on its own, before the geometry commit (`82cb8a4`). That keeps the RED, GREEN and data steps atomic. The plan's single Task 1 commit message is kept for the geometry commit.

---

**Total deviations:** 3 auto-fixed (1 bug, 1 missing critical, 1 size) plus 2 process notes
**Impact on plan:** No scope creep. The Zmutt end point is the only judgement call, and it is flagged for Tim in coverage D4.

## TDD Gate Compliance

- RED commits `097321b` and `4dfb44c` each come before their GREEN commits `5dc14eb` and `10d22d4`.
- Semantic assessment: in both RED runs the suite failed to load because the module under test did not exist yet (Jest "Cannot find module"). No assertions ran. Under the strict #3770 classifier that is a load failure, not assertion RED. `workflow.tdd_mode` is not enabled in .planning/config.json, so the gate is advisory. After GREEN, every planned behaviour runs as a named assertion (15 + 17 tests pass).

## Issues Encountered

- The Wanderwege identify `properties.hikingtype` came back null for every feature in the Zmutt envelope, but it was populated near the Hörnli. The route is therefore not filtered by trail category. The length gate and the comparison with the listing track cover that.

## Verification

- `npx jest lib/__tests__/trail-profile.test.ts`: 15 passed
- Task 1 verify command 2 printed `hoernliweg-27 4316 m` and `zmutt-2 4291 m` and exited 0
- `npm run trails:build -- --check`: `trails: OK`. `npx jest data/__tests__/trail-profiles.test.ts data/__tests__/terrain.test.ts`: 55 passed
- `npm run data:check`: terrain, photos:exif, photos:derive, photos:build, tokens and trails all OK
- `npx jest`: 67 suites, 1,005 tests passed. `npm run type-check`: exit 0. `npm run lint`: exit 0 (13 ESLint warnings, none in this plan's files)
- Acceptance: `grep -c "MANUAL AND NETWORKED"` returns 1; lib/trail-profile.ts has no import; `grep -c "trails:build -- --check" package.json` returns 1; the header line matches; `git diff --exit-code HEAD -- data/generated/terrain.ts` exits 0; only `trails:fetch` references fetch-trails

## User Setup Required

None. No external service configuration is required, and the fetch is never run in CI.

## Next Phase Readiness

- 11-12 can import `trailProfiles` from Server Components and draw them with `profilePath`. The captions are 2,587 -> 3,262 m (box) and 1,606 -> 1,950 m (coin-flip).
- Open for Tim: confirm the Zmutt end point (coverage D4). Ending at the hamlet centre instead is not possible under the 10 % rule unless the rule changes.
- A4 (attribution) is unchanged: if swisstopo's terms need a string beyond the existing footer credit, 11-12 adds it.

---
*Phase: 11-engineering-roadmap*
*Completed: 2026-11-01*

## Self-Check: PASSED

All 8 created files exist; commits 097321b, 5dc14eb, 82cb8a4, 4dfb44c and 10d22d4 are ancestors of HEAD.
