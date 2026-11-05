---
phase: 08-data-terrain-pipeline
plan: 01
subsystem: data
tags: [geo, lv95, swisstopo, terrain, contours, hillshade, dem, eslint, node-type-stripping, jest]

# Dependency graph
requires:
  - phase: 07-foundation-guardrails
    provides: ESLint no-restricted-imports block (framer-motion, SafeCanvas, phosphor), guard selftest harness, Node 24 toolchain
provides:
  - lib/geo.ts coordinate contract (WGS84 <-> LV95 <-> terrain UV, u east / v south, round4, stripBbox)
  - lib/terrain/contour-paths.ts (openRuns border-frame fix, half-pixel rounding, deterministic script-free contourSvg)
  - lib/terrain/hillshade.ts (Horn hillshade, blendShades, toGrey8)
  - lib/terrain/dem-sample.ts (one pixel-centre bilinear sampler, sampleAtLv95, resampleBilinear)
  - ESLint ban on d3-contour, geotiff, simplify-js, exif-reader and sharp outside scripts/**/*.mjs
affects: [08-04 terrain build script, 08-06, 08-08 photo data, 08-12 footer ticks, phase 9 hero terrain, phase 10 photo map]

# Actuals (#2632)
actuals:
  tokens: 9589
  tasks: 3
  commits: 5
plan_head_before: 39836df6196b9f79f4c8242e5180d4b12ff4fca1
plan_head_after: b7975e56766e7522eb29fc7615961ef15592f55a

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure core in import-free erasable lib/*.ts, loaded from scripts/*.mjs via Node 24 type-stripping (node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON)"
    - "One UV convention: u = (e - west) / width east, v = (north - n) / height south; row 0 = north, no flip"
    - "One DEM sampler: bilinear at pixel centres (pixel i spans [i, i+1), centre i + 0.5), edge-clamped"
    - "Shared BANNED_PATHS / BANNED_PATTERNS constants for every no-restricted-imports block (flat config replaces options)"

key-files:
  created:
    - lib/geo.ts
    - lib/terrain/contour-paths.ts
    - lib/terrain/hillshade.ts
    - lib/terrain/dem-sample.ts
    - lib/__tests__/geo.test.ts
    - lib/__tests__/contour-paths.test.ts
    - lib/__tests__/hillshade.test.ts
    - lib/__tests__/dem-sample.test.ts
  modified:
    - eslint.config.mjs
    - scripts/guards/selftest.mjs

key-decisions:
  - "contourSvg accepts only M/L/Z path data with plain numbers and a finite positive canvas (TypeError/RangeError otherwise), so nothing but numbers can reach the SVG attribute (T-08-02 hardening)"
  - "The scripts/**/*.mjs ESLint block and the global block share BANNED_PATHS / BANNED_PATTERNS constants, so the restated framer-motion, Canvas and phosphor bans cannot drift; the five generator entries are written out literally in the global block"
  - "stripBbox throws RangeError when the extent is shorter than the strip, instead of returning a bbox outside the extent"
  - "sampleAtLv95 uses per-axis cell sizes ((east - west) / W, (north - south) / H); identical to the plan's single cell size on square grids"

patterns-established:
  - "TDD RED for pure modules: commit the tests with a signature-only skeleton so RED fails on assertions, never on a missing module"
  - "RED evidence for Jest: a scratchpad flat-TAP reporter (--reporters=<path>) feeds gsd check tdd-red-evidence; no package install"

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "lib/geo.ts coordinate contract within 1 m of three swisstopo REFRAME oracles, exact UV inverse, round4, 5:1 summit-centred stripBbox with edge shift, loadable from a Node .mjs import"
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "lib/__tests__/geo.test.ts (18 tests)"
        status: pass
      - kind: other
        ref: "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --input-type=module -e \"import { wgs84ToLv95 } from './lib/geo.ts' ...\" -> geo ok 2617048 1091661"
        status: pass
    human_judgment: false
  - id: D2
    description: "Pure terrain cores: open contour runs with no border frame, half-pixel rounding, byte-identical script-free contourSvg, Horn hillshade (NW-facing brighter), pixel-centre bilinear sampler and resampler, all import-free"
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "lib/__tests__/contour-paths.test.ts, lib/__tests__/hillshade.test.ts, lib/__tests__/dem-sample.test.ts (66 tests)"
        status: pass
      - kind: other
        ref: "node --input-type=module smoke import of all three modules -> terrain cores ok"
        status: pass
    human_judgment: false
  - id: D3
    description: "ESLint fails d3-contour/geotiff/simplify-js/exif-reader/sharp imports outside scripts/**/*.mjs and keeps the framer-motion, Canvas and phosphor bans inside scripts/"
    requirement: DATA-01
    verification:
      - kind: other
        ref: "node scripts/guards/selftest.mjs -> selftest: 59/59 cases passed (4 new generator import ban cases)"
        status: pass
      - kind: other
        ref: "npm run lint && npm run type-check && npx jest --silent -> exit 0, 191/191 tests"
        status: pass
    human_judgment: false

# Metrics
duration: 9min
completed: 2026-10-24
status: complete
---

# Phase 8 Plan 01: Coordinate Contract, Terrain Cores and Generator Import Ban Summary

**WGS84/LV95/terrain-UV contract (swisstopo formulas, within 1 m of REFRAME), import-free contour/hillshade/DEM-sampler cores that load under Node 24 type-stripping, and an ESLint ban that keeps d3-contour, geotiff, simplify-js, exif-reader and sharp inside scripts/**/*.mjs**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-24T14:09:07Z
- **Completed:** 2026-10-24T14:18:20Z
- **Tasks:** 3
- **Files modified:** 10 (8 created, 2 modified)

## Accomplishments

- `lib/geo.ts`: `wgs84ToLv95` / `lv95ToWgs84` (swisstopo approximate formulas, no proj4), `lv95ToUv` / `uvToLv95` (u east, v south; summit at (0.0953, 0.6661)), `round4`, `stripBbox` (default extent gives `[2616000, 1090600, 2627000, 1092800]`). The tracer slice is proven in Jest and from a Node `.mjs` import (`geo ok 2617048 1091661`).
- `lib/terrain/contour-paths.ts`: `openRuns` drops every segment lying along one raster border, so d3-contour rings no longer draw a frame round the asset (Pitfall 1). `contourSvg` emits `<svg><g>` plus one `<path vector-effect="non-scaling-stroke">` per level, with `stroke-opacity="0.6"` on non-index levels and a trailing newline. Output is byte-identical for the same input.
- `lib/terrain/hillshade.ts` (Horn, edge-clamped, 315/45 default; NW-facing slopes are brighter) and `lib/terrain/dem-sample.ts` (exact at cell centres, mean halfway, edge clamp; `resampleBilinear` samples at output pixel centres).
- ESLint: the five generator libraries fail in `app/`, `components/`, `lib/` and `data/`. They pass in `scripts/**/*.mjs`, where framer-motion, a bare Canvas and the phosphor root/csr imports still fail. Selftest went from 55 to 59 cases.

## Task Commits

1. **Task 1 (tracer): lib/geo.ts coordinate contract**: `9e48138` (test, RED) and `60545a6` (feat, GREEN)
2. **Task 2: pure terrain cores**: `6630c0b` (test, RED) and `b061022` (feat, GREEN)
3. **Task 3: ESLint generator-library ban**: `b7975e5` (chore)

**Plan metadata:** recorded in the docs commit that follows this SUMMARY.

## TDD Evidence

- **Task 1 RED (`9e48138`):** 18/18 tests failed against a signature-only skeleton. The classifier returned `RED_EVIDENCE_OK` (target `wgs84ToLv95 > Matterhorn summit is within 1 m of the REFRAME oracle`). Semantic assessment: every failure is the planned assertion (`Expected: < 1, Received: NaN`; `round4` returned the unrounded 46.01502; `stripBbox` did not throw), with no load, syntax or fixture fault. **GREEN (`60545a6`):** 18/18 pass.
- **Task 2 RED (`6630c0b`):** 52 of 66 failed; the classifier returned `RED_EVIDENCE_OK` (target `openRuns (Pitfall 1: no frame round the asset) > a ring along x = 0 yields runs with no border segment`, `Expected: false, Received: true`). Semantic assessment: all positive behaviours failed on their assertions and no suite failed to load. The 14 skeleton passes are negative or structural cases (`false` expectations, length and type checks, absence checks on an empty string) that turn meaningful once the real code exists. **GREEN (`b061022`):** 66/66 pass.
- **REFACTOR:** none needed.
- Evidence came from a flat-TAP Jest reporter kept in the session scratchpad (`--reporters=<path>`). Jest has no supported report format built in, and package installs are excluded. Records are under `.git/gsd-red/` (untracked by construction).

## Files Created/Modified

- `lib/geo.ts`: WGS84 <-> LV95 <-> UV contract, `round4`, `stripBbox`
- `lib/terrain/contour-paths.ts`: `onEdge`, `openRuns`, `roundHalf`, `runToPath`, `isIndexLevel`, `contourSvg`
- `lib/terrain/hillshade.ts`: `hillshade`, `blendShades`, `toGrey8`
- `lib/terrain/dem-sample.ts`: `sampleBilinear`, `sampleAtLv95`, `resampleBilinear`
- `lib/__tests__/{geo,contour-paths,hillshade,dem-sample}.test.ts`: 84 new Jest tests (107 -> 191)
- `eslint.config.mjs`: `BANNED_PATHS` / `BANNED_PATTERNS` constants, five generator entries in the global block, new `scripts/**/*.mjs` block
- `scripts/guards/selftest.mjs`: four `generator import ban:` ESLint stdin cases

## Decisions Made

- `contourSvg` validates its input: path data must match `/^[MLZ0-9. -]*$/` and the canvas must be finite and positive. This turns the T-08-02 "numeric input only" assumption into an enforced contract.
- The ESLint scripts block reuses shared constants instead of a second literal copy of the old bans. The rule content is the same, and the copies cannot drift apart.
- `stripBbox` throws `RangeError` if the strip cannot fit the extent.
- `sampleAtLv95` computes the cell size per axis. On the square 512²/256² grids this equals the plan's `(east - west) / W`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] contourSvg input validation (T-08-02)**
- **Found during:** Task 2
- **Issue:** `contourSvg` takes `d` as a string. A quote or markup in it would break out of the attribute, and the "numeric input" mitigation was only an assumption.
- **Fix:** Path data outside M/L/Z plus numbers throws `TypeError`; a non-finite or non-positive canvas throws `RangeError`.
- **Files modified:** lib/terrain/contour-paths.ts, lib/__tests__/contour-paths.test.ts
- **Verification:** 6 rejection tests pass; the Node smoke (`d: 'M0 0L1 1'`) still passes
- **Committed in:** 6630c0b (tests), b061022 (code)

**2. [Rule 2 - Missing Critical] Shape checks on the other cores**
- **Found during:** Tasks 1 and 2
- **Issue:** A grid whose length is not W x H, blend inputs of different lengths, or an extent shorter than the strip would silently produce wrong numbers.
- **Fix:** `hillshade`, `sampleBilinear` and `blendShades` throw `RangeError` on a length mismatch; `stripBbox` throws when the strip does not fit.
- **Files modified:** lib/geo.ts, lib/terrain/hillshade.ts, lib/terrain/dem-sample.ts (+ tests)
- **Verification:** dedicated tests pass
- **Committed in:** 9e48138/60545a6, 6630c0b/b061022

**3. [Process] RED commits include signature-only skeletons**
- **Found during:** Tasks 1 and 2
- **Issue:** Tests that import a missing module fail at load time, which the RED contract counts as INVALID_RED.
- **Fix:** Each `test(08-01)` commit carries a skeleton with the final signatures and placeholder bodies (NaN, empty string). The `feat(08-01)` commit replaces the bodies.
- **Committed in:** 9e48138, 6630c0b

**4. [Process] ESLint scripts block uses shared constants**
- **Found during:** Task 3
- **Issue:** The plan asked to repeat the old bans verbatim in the scripts block. A second literal copy would drift the next time a ban is added.
- **Fix:** Both blocks reference `BANNED_PATHS` / `BANNED_PATTERNS`. The five generator entries stay literal in the global block, and the acceptance grep still counts 5.
- **Verification:** selftest 59/59; manual stdin probes (Canvas, phosphor root and csr inside scripts/ fail; generators in app/, data/ and components/ fail)
- **Committed in:** b7975e5

---

**Total deviations:** 4 (2 Rule 2 auto-fixes, 2 process adjustments)
**Impact on plan:** These harden the cores and the lint config without changing the planned interfaces or scope. The interface signatures match the plan's `<interfaces>` block exactly.

## Issues Encountered

- One draft test case was wrong before RED: `isIndexLevel(4499.9999, 100, 5)` is `true`, because the level is rounded on purpose to absorb float noise. The case was corrected before the RED run.
- The first RED run showed that the Pitfall 1 tests passed against the skeleton, because the test helper reused the module's own `onEdge`. The helper now checks border segments independently, so a broken `onEdge` cannot hide a frame.
- Prettier is not enforced in CI and the repo is not fully formatted. Only the new and touched files were formatted (`.prettierrc`, printWidth 100). `scripts/guards/selftest.mjs` already differed from Prettier before this plan and was left as is.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 08-04 can import `lib/geo.ts`, `lib/terrain/contour-paths.ts`, `lib/terrain/hillshade.ts` and `lib/terrain/dem-sample.ts` from `scripts/terrain/*.mjs` with explicit `.ts` extensions under `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON`. It may import d3-contour, geotiff, simplify-js, exif-reader and sharp only there.
- DATA-01 stays Pending in REQUIREMENTS.md. Later Phase 8 plans also declare it, so the shared-ID gate (`requirements.ready-ids`) reports it as blocked until the last of them finishes.
- Test-count note: Jest rose from 107 to 191. The ratchet baseline (206 total) is raised only at phase close.
- Open from the plan: RESEARCH A2 (`vector-effect` inside a CSS mask in Firefox/WebKit) is still for the 08-13 visual review.

---
*Phase: 08-data-terrain-pipeline*
*Completed: 2026-10-24*

## Self-Check: PASSED

- FOUND: all 10 key files (8 created, 2 modified)
- FOUND: commits 9e48138, 60545a6, 6630c0b, b061022, b7975e5 (ancestors of HEAD)
- Plan verification: `npx jest lib --silent` 102/102 (6 suites); `npm run lint` exit 0 (selftest 59/59); `npm run type-check` exit 0; full Jest 191/191; Node type-strip smoke imports pass for all four modules
