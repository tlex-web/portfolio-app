---
phase: 16-new-regions-alps-overview-data
plan: 09
subsystem: data
tags: [proj4, epsg-3035, laea, lv95, eslint, selftest, supply-chain]
status: complete

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: "16-01 plate-dem.mjs with the toGrid crs dispatch and the D-25 scan procedure; 16-04 package.json and lockfile; 16-07 selftest.mjs"
provides:
  - "proj4 2.22.0 (exact devDependency) with wkt-parser held at 1.5.6 by a package.json overrides entry; mgrs 1.0.0 transitive"
  - "ESLint no-restricted-imports bans proj4 outside scripts/**/*.mjs (build-time only, like geotiff and sharp)"
  - "toGrid('EPSG:3035', { lat, lon }) through proj4; fromGrid(crs, { e, n }) for EPSG:2056 (lib/geo.ts lv95ToWgs84) and EPSG:3035 (proj4 inverse)"
  - "Selftest case 'geo: EPSG:3035 maps its centre to its false origin and round-trips the Saalfelden corners'"
  - "Selftest case 'geo: lib/geo.ts agrees with proj4 within 1 m over the Ortler plate' (measured 0.5652 m)"
affects: [16-11, 16-14, 16-16, 16-17, 16-18]

actuals:
  tokens: 1700
  tasks: 3
  commits: 2
plan_head_before: e7dd64699b9ea63fef870838fc5b00f3ae4fc2b2
plan_head_after: 5f034900201be9e95abb95bcd5f0fceab540d321

tech-stack:
  added: ["proj4 2.22.0 (devDependency, scripts only)", "wkt-parser 1.5.6 (transitive, pinned by overrides)", "mgrs 1.0.0 (transitive, pinned exactly by proj4)"]
  patterns:
    - "Every photo-grid transform goes through the crs dispatch in scripts/photos/plate-dem.mjs (toGrid / fromGrid); an unknown crs throws, never falls back to LV95"
    - "Selftest reaches plate-dem.mjs through a child node (plateGridBatch), the same way geoBatch reaches lib/geo.ts"

key-files:
  created:
    - .planning/phases/16-new-regions-alps-overview-data/16-09-SUMMARY.md
  modified:
    - package.json
    - package-lock.json
    - eslint.config.mjs
    - scripts/photos/plate-dem.mjs
    - scripts/guards/selftest.mjs

key-decisions:
  - "Package gate (Tim): 'verified (Recommended)'. Install exactly proj4@2.22.0 plus the wkt-parser 1.5.6 override with the bundled npm; asked ahead of dispatch, so no stop at Task 1"
  - "LV95 plates keep lib/geo.ts: measured 0.5652 m maximum against proj4's EPSG:2056 over the 13 x 13 Ortler grid (RESEARCH: 0.56 m), inside the 1 m selftest limit"
  - "The proj4 comparisons live in the guard selftest, not Jest (planner decision): the ESLint ban keeps proj4 in scripts/**/*.mjs"

patterns-established:
  - "A new projection is added in one place: a proj4.defs entry and a branch in both toGrid and fromGrid of plate-dem.mjs, pinned by a selftest case"

requirements-completed: [DATA-13]   # copied from the plan; REQUIREMENTS.md ticking is subject to the shared-ID gate (16-14, 16-17, 16-18 also declare DATA-13)

coverage:
  - id: D1
    description: "proj4 2.22.0 installed exact, wkt-parser overridden to 1.5.6, lockfile change bounded to proj4, wkt-parser and mgrs"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "npm ls wkt-parser (wkt-parser@1.5.6 overridden) and the plan's lockfile entry comparison (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "proj4 cannot be imported outside scripts/**/*.mjs"
    requirement: DATA-13
    verification:
      - kind: other
        ref: "npx eslint on a probe lib/ file importing proj4 reports no-restricted-imports (probe deleted)"
        status: pass
    human_judgment: false
  - id: D3
    description: "EPSG:3035 forward and inverse through the plate-dem dispatch, centre and Saalfelden corners pinned"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#geo: EPSG:3035 maps its centre to its false origin and round-trips the Saalfelden corners"
        status: pass
    human_judgment: false
  - id: D4
    description: "lib/geo.ts within 1 m of proj4 EPSG:2056 over the Ortler plate"
    requirement: DATA-13
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#geo: lib/geo.ts agrees with proj4 within 1 m over the Ortler plate"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-11-23
---

# Phase 16 Plan 09: proj4 for EPSG:3035 Summary

**proj4 2.22.0 (wkt-parser held at 1.5.6) now handles EPSG:3035 in both directions in the plate-dem crs dispatch. It is banned outside scripts/. LV95 stays on lib/geo.ts: the selftest measured 0.5652 m against proj4 over the Ortler plate.**

## Performance

- **Duration:** about 11 min
- **Started:** 2026-11-23T10:13:58Z
- **Completed:** 2026-11-23T10:25Z
- **Tasks:** 3 (Task 1 answered before dispatch, Tasks 2 and 3 executed)
- **Files modified:** 5

## Task 1: package legitimacy gate (answered)

Before dispatch, the orchestrator asked Tim the blocking-human checkpoint while 16-08 was running.

- **Question (verbatim):** "16-09 package check, asked early while 16-08 runs. Install proj4@2.22.0 (exact pin, devDependencies, scripts only) plus the override \"wkt-parser@^1.5.5\": \"1.5.6\", with the bundled npm? Registry checked today: proj4 2.22.0 was published 2026-08-31 from github.com/proj4js/proj4js with no preinstall/install/postinstall script. It pins mgrs 1.0.0 exactly (proj4js/mgrs). wkt-parser 1.5.6 was published 2026-07-23 (proj4js/wkt-parser). Without the override, the ^1.5.5 range would pull 1.9.0 (published 2026-11-12). proj4 latest is 2.23.0 (2026-11-12), which we skip."
- **Tim's reply (verbatim):** "verified (Recommended)"
- **Selected option text:** "Install exactly proj4@2.22.0 + the wkt-parser 1.5.6 override with the bundled npm when 16-09 runs; no stop at its Task 1."
- **Registry evidence the orchestrator checked:**
  - proj4@2.22.0: published 2026-08-31T07:27:26Z; repository git+https://github.com/proj4js/proj4js.git; dependencies {mgrs: "1.0.0", wkt-parser: "^1.5.5"}; no preinstall, install or postinstall script (only `prepare`, which npm does not run for registry installs).
  - wkt-parser@1.5.6: published 2026-07-23T13:34:05Z; repository proj4js/wkt-parser. The latest is 1.9.0 (2026-11-12); 1.6.0, 1.7.0 and 1.8.0 also came out after 2026-10-13.
  - mgrs@1.0.0: repository proj4js/mgrs. The latest is 2.2.0, but proj4 pins 1.0.0 exactly.
  - Weekly download counts were not re-checked.
- **Scope of the approval:** exactly proj4@2.22.0 (save-exact, devDependencies), the overrides entry, and mgrs 1.0.0. A `--dry-run` with the bundled npm 11.20.0 listed exactly `add wkt-parser 1.5.6`, `add mgrs 1.0.0` and `add proj4 2.22.0` before the real install. Nothing else resolved.

## Accomplishments

- `package.json`: `"proj4": "2.22.0"` in devDependencies; `"wkt-parser@^1.5.5": "1.5.6"` in overrides (after the fflate entries).
- `npm ls` shows `proj4@2.22.0` with `mgrs@1.0.0` and `wkt-parser@1.5.6 overridden`.
- `eslint.config.mjs`: `proj4` is in the build-time-only paths list with the generator-library message. A probe file under `lib/` that imported proj4 failed `no-restricted-imports`, and the probe was then deleted. `scripts/**/*.mjs` may still import it.
- `scripts/photos/plate-dem.mjs`: imports proj4, defines EPSG:3035 with the RESEARCH LAEA string, and gives `toGrid` an `EPSG:3035` branch (`[lon, lat]` order). It also adds `fromGrid(crs, { e, n })`: EPSG:2056 goes through `lv95ToWgs84` and EPSG:3035 through the proj4 inverse. Both functions throw the same `no projection for <crs>` error for any other CRS.
- `scripts/guards/selftest.mjs`: a `plateGridBatch` helper (a child node, like `geoBatch`), the plate constants `ORTLER_LV95` and `SAALFELDEN_LAEA`, and the two `geo:` cases. Selftest: 278/278.

## Measurements

| Check | Limit | Measured | RESEARCH |
|---|---|---|---|
| lib/geo.ts vs proj4 EPSG:2056, 13 x 13 grid over Ortler (W 2,832,000 S 1,150,000 E 2,844,000 N 1,162,000), max distance | 1 m | **0.5652 m** | 0.56 m |
| EPSG:3035 centre (lat 52, lon 10) to false origin (4,321,000 / 3,210,000) | 1 mm | 0 mm (exact) | - |
| EPSG:3035 fromGrid then toGrid at the Saalfelden corners, worst | 1 mm | under 0.3 mm (0.24 mm at the south-west corner) | - |

The EPSG:2056 definition used in the case is the EPSG registry / epsg.io string: somerc, Bessel, towgs84 674.374,15.056,405.346.

## Lockfile diff (full, recorded per the plan)

The plan's entry-wise comparison (HEAD lockfile vs working tree, run before the Task 2 commit) printed `lockfile: only proj4, wkt-parser, mgrs and the root devDependencies/overrides changed` and exited 0. `git diff --stat`: `package-lock.json | 40 +`, `package.json | 4 +-`. The lockfile diff, in full:

- root `packages[""].devDependencies`: `+ "proj4": "2.22.0"`
- `+ node_modules/mgrs`: version 1.0.0, resolved registry.npmjs.org/mgrs/-/mgrs-1.0.0.tgz, integrity sha512-awNbTOqCxK1DBGjalK3xqWIstBZgN6fxsMSiXLs9/spqWkF2pAhb2rrYCFSsr1/tT7PhcDGjZndG8SWYn0byYA==, dev, MIT
- `+ node_modules/proj4`: version 2.22.0, resolved registry.npmjs.org/proj4/-/proj4-2.22.0.tgz, integrity sha512-MVvH09QrYm3A235rcX39WDiCKanrBiblu28l0KYIn/B2DofmYhvP/LLS43kE66jNDfx/P1l/nah3JmsAq8UgbQ==, dev, MIT, dependencies {mgrs 1.0.0, wkt-parser ^1.5.5}, funding github.com/sponsors/ahocevar, optional peer geotiff `*` (already installed at 3.0.5)
- `+ node_modules/wkt-parser`: version 1.5.6, resolved registry.npmjs.org/wkt-parser/-/wkt-parser-1.5.6.tgz, integrity sha512-cqHU3lzGt/gt2OqIORP0uVy5yeOX43WABmgFkmJsmcqH3HhQo9PiJG6ftytwGKmpQUbegeX7+pQc2BuNCRfcrw==, dev, MIT, funding github.com/sponsors/ahocevar

No other entry changed, and there were no peer, dev or libc rewrites (bundled npm 11.20.0).

## Task Commits

1. **Task 1: package legitimacy gate.** Answered before dispatch; no commit.
2. **Task 2: EPSG:3035 end to end (tracer).** `36aa278` (feat). Tracer gate: auto mode is off, `human_verify_mode` is end-of-phase and `<verify>` is automated only, so the verify steps were re-run end to end (selftest PASS, `npm ls`, lockfile check exit 0, lint 0, type-check 0) before expanding. No checkpoint.
3. **Task 3: lib/geo.ts against proj4 over Ortler.** `5f03490` (test)

## D-25 scan

The scan followed the 16-01 Task 2 procedure. It ran from a scratchpad copy of 16-01's `d25-scan.mjs` that is never in the repository. The copy adds the EPSG:3035 string kinds through `toGrid('EPSG:3035', …)` of `scripts/photos/plate-dem.mjs`: easting and northing at 1 m and 10 m, each with and without thousands separators. It searched `.planning/` with `git grep --untracked -F -l`, so committed files, the working tree and this uncommitted SUMMARY were all covered. It prints booleans and file names only, never a value. A baseline ran before this SUMMARY existed. The scan was then re-run after the SUMMARY was written and before it was committed.

This is the first run with the EPSG:3035 kinds, so it also covers every planning file committed before proj4 arrived.

| Original | EPSG:3035 E 1 m | EPSG:3035 N 1 m | EPSG:3035 E 10 m | EPSG:3035 N 10 m | Other kinds (lat/lon 2-4dp, LV95 1/10 m, GPS altitude) |
|---|---|---|---|---|---|
| IMG_0605-Enhanced (2022_02_01 09_47_03 UTC).jpg | match: no | match: no | match: no | match: no | as 16-08 baseline (pre-existing, reviewed) |
| IMG_0629-Enhanced (2022_07_29 07_19_54 UTC).jpg | match: no | match: no | match: no | match: no | as 16-08 baseline (pre-existing, reviewed) |
| IMG_0662-Enhanced (2022_07_29 07_19_54 UTC).jpg | match: no | match: no | match: no | match: no | as 16-08 baseline (pre-existing, reviewed) |
| incoming/20240910_143659.jpg | match: no | match: no | match: no | match: no | as 16-08 baseline (pre-existing, reviewed) |
| incoming/20260916_125705.jpg | match: no | match: no | match: no | match: no | as 16-08 baseline (pre-existing, reviewed) |
| incoming/IMG_0682.jpg | match: no | match: no | match: no | match: no | as 16-08 baseline (pre-existing, reviewed) |
| incoming/_MG_0680.jpg | match: no | match: no | match: no | match: no | as 16-08 baseline (pre-existing, reviewed) |
| incoming/dji_fly_20260919_162232_0153_1789843115521_photo.jpg | match: no | match: no | match: no | match: no | as 16-08 baseline (pre-existing, reviewed) |
| incoming/dji_fly_20260919_163558_0163_1789843047771_photo.jpg | match: no | match: no | match: no | match: no | as 16-08 baseline (pre-existing, reviewed) |
| R004-011-Edit-Enhanced (2021_11_13 16_58_47 UTC).jpg | no GPS position | no GPS position | no GPS position | no GPS position | nothing to search |
| incoming/20160717_120906-Topaz-Sharpen-Strong-Denoise.jpg | no GPS position | no GPS position | no GPS position | no GPS position | nothing to search |
| incoming/20210912_193833.jpg | no GPS position | no GPS position | no GPS position | no GPS position | nothing to search |

| Check | Result |
|---|---|
| Any EPSG:3035 kind matched in any planning file | no |
| `16-09-SUMMARY.md` named in any match | no |
| Any other 16-09 file named in any match | no |
| Non-EPSG:3035 lines identical to the 16-08 baseline (before this SUMMARY) | yes |
| Output with this SUMMARY byte-identical to the 16-09 baseline without it | yes |
| Any match overall (`any match: yes`) | yes, pre-existing only (the reviewed v2.0 files, published 4dp values, 2dp anchor lines, whole-metre digit-run noise and the D-01 example, as in 16-01 and 16-08) |

## Decisions Made

- LV95 keeps `lib/geo.ts` on measured evidence: 0.5652 m maximum, under the 1 m limit.
- The plan's planner decision was applied: the proj4 checks are selftest cases, not a Jest test.

## Deviations from Plan

### Additions within the task

**1. A dry run before the real install**
- **Found during:** Task 2
- **Reason:** the approval covers exactly three packages and says to stop if anything else resolves. `npm install --dry-run` confirmed the resolution before anything was written.
- **Commit:** 36aa278 (no file effect)

**2. Shared helpers in the selftest**
- **Found during:** Task 2
- **Change:** `plateGridBatch` runs plate-dem.mjs in a child node. Importing it in-process would pull in `.ts` modules and print a module-type warning into every selftest run, which is the reason `geoBatch` exists. `gridDistance`, `ORTLER_LV95` and `SAALFELDEN_LAEA` are module-level constants shared by the two cases.
- **Commits:** 36aa278, 5f03490

**Total deviations:** 0 rule deviations and 2 small in-task additions. **Impact:** none on generated output; Phase 16 stays pixel-neutral.

## Verification

- `npm run guard:selftest`: `selftest: 278/278 cases passed`; `grep -c "^PASS geo: EPSG:3035"` = 1; `grep -c "^PASS geo: "` = 2
- `npm ls wkt-parser`: `wkt-parser@1.5.6 overridden` under `proj4@2.22.0`
- Lockfile entry comparison: exit 0
- `npm run lint`: exit 0 (after both tasks); `npm run type-check`: exit 0; `npm run guard:tests:scan`: exit 0
- `grep -cF '"proj4": "2.22.0"' package.json` = 1; `grep -c proj4 eslint.config.mjs` = 1 or more; `grep -c EPSG:3035 scripts/photos/plate-dem.mjs` = 1 or more

## Issues Encountered

- `npx prettier --check` flags `scripts/guards/selftest.mjs` and `eslint.config.mjs`. Both are pre-existing. The selftest file is not Prettier-formatted at HEAD (1,812 differing lines before this plan), and `eslint.config.mjs` fails only because of its CRLF working-copy line endings; its HEAD blob passes. The new code follows the selftest's existing long-line style. Neither file was reformatted (out of scope).
- `npm install` warns that `@parcel/watcher@2.6.0` has install scripts not covered by allowScripts. This is a pre-existing package and unrelated to proj4.

## Next Phase Readiness

- The photo build (stage 2) and the overview outlines can now call `toGrid` / `fromGrid` on `EPSG:3035` for the Saalfelden plate (16-11, 16-14, 16-16).
- The D-25 scan now has its EPSG:3035 kinds. Later plans should run the scratchpad copy `d25-scan-1609.mjs`, or add the same kinds to theirs.

## Self-Check: PASSED

- Files: 16-09-SUMMARY.md and scripts/photos/plate-dem.mjs found
- Commits: 36aa278 and 5f03490 are ancestors of HEAD
