---
phase: 17-region-routes-seo-structured-data
plan: 08
subsystem: infra
tags: [terrain, fetchers, geotiff, retry, selftest, refactor]

requires:
  - phase: 16-new-regions-alps-overview-data
    provides: fetch-bev, fetch-dem and fetch-overview, and the 16-REVIEW findings IN-02, IN-08 and IN-09
provides:
  - "scripts/terrain/plate-args.mjs: MAX_SIDE_M, CELL_M, parseArgs(argv, spec), extentProblem, parseExtent, sameExtent, extentText, shown(root, dir)"
  - "scripts/terrain/fetch-retry.mjs: reasonOf, finalError, withRetry(label, attempt, { attempts, backoffMs, onRetry, failText })"
  - "fetch-bev: a single value rule, !Number.isFinite(m) || m < 0 || m > MAX_M"
  - "fetch-overview: OVERVIEW_FLOOR_M = -500, below which readTile fails"
  - "selftest fn cases: fetch: plate-args, fetch: parseArgs, fetch: fetch-retry"
affects: [17-15 review write-back, terrain fetchers]

actuals:
  tokens: 66671
  tasks: 2
  commits: 3
plan_head_before: 5ff62dc087a605760b6670593ba4cccfad5a299d
plan_head_after: 1d15fd8240c0284608de49016f9dd908a570dd12

tech-stack:
  added: []
  patterns:
    - "Shared fetcher helpers in scripts/terrain/*.mjs are side-effect free. Failures throw an Error that the caller prints after its own name"
    - "A caller-specific retry counter goes through withRetry's onRetry, never module state"

key-files:
  created:
    - scripts/terrain/plate-args.mjs
    - scripts/terrain/fetch-retry.mjs
  modified:
    - scripts/terrain/fetch-bev.mjs
    - scripts/terrain/fetch-dem.mjs
    - scripts/terrain/fetch-overview.mjs
    - scripts/guards/selftest.mjs

key-decisions:
  - "16 IN-02 (93c5588): the BEV window check is one rule, m < 0 or m > 6000 is nodata or out of range. NODATA_AT_OR_BELOW and MIN_M are gone"
  - "16 IN-09 (a050c7e): the GLO-90 mosaic fails below OVERVIEW_FLOOR_M = -500 m. Only values from -500 m up to 0 m clamp to 0 m. RESAMPLING stays unchanged because it is written into source.json"
  - "16 IN-08 (1d15fd8): one parseArgs(argv, { values, flags, usage }) serves all three fetchers. withRetry takes attempts and backoffMs explicitly, and each caller keeps its own ATTEMPTS/BACKOFF_MS constants"

patterns-established:
  - "Refusal-text parity for a refactor of a manual script: diff its offline refusals before and after, without touching the network"

requirements-completed: [REGION-07]

coverage:
  - id: D1
    description: "16 IN-02: fetch-bev rejects a window value with one rule and keeps its nodata-or-out-of-range message"
    requirement: REGION-07
    verification:
      - kind: other
        ref: "node --check scripts/terrain/fetch-bev.mjs; grep -c NODATA_AT_OR_BELOW (0); grep -cw MIN_M (0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "16 IN-09: fetch-overview fails below OVERVIEW_FLOOR_M = -500 and clamps only -500..0 m to 0 m"
    requirement: REGION-07
    verification:
      - kind: other
        ref: "node --check scripts/terrain/fetch-overview.mjs; grep -c OVERVIEW_FLOOR_M (4)"
        status: pass
    human_judgment: false
  - id: D3
    description: "16 IN-08: the plate argument, extent and retry helpers exist once, and the fetchers refuse exactly as before"
    requirement: REGION-07
    verification:
      - kind: unit
        ref: "scripts/guards/selftest.mjs#fetch: plate-args rejects a non-square, an oversized and an off-grid extent"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#fetch: fetch-retry retries a network error and stops on a final error"
        status: pass
      - kind: unit
        ref: "scripts/guards/selftest.mjs#fetch: parseArgs refuses a missing value, a repeated option and an unknown argument with the caller's usage"
        status: pass
      - kind: unit
        ref: "npm run guard:selftest (298/298, the 4 existing fetch refusal cases included)"
        status: pass
      - kind: other
        ref: "git grep for a function definition of parseArgs, extentProblem, parseExtent, withRetry, finalError or shown in the three fetchers (0 files)"
        status: pass
      - kind: other
        ref: "npm run lint"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-11-24
status: complete
---

# Phase 17 Plan 08: Terrain fetcher review fixes (16 IN-02, IN-09, IN-08) Summary

**fetch-bev now uses one 0..6000 m value rule, fetch-overview fails a GLO-90 tile below -500 m instead of turning it into sea, and the three fetchers share `plate-args.mjs` and `fetch-retry.mjs`. All 25 offline refusals print byte-identical text.**

## Performance

- **Duration:** about 14 min
- **Started:** 2026-11-23T23:28:05Z
- **Completed:** 2026-11-23T23:42Z
- **Tasks:** 2
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- **IN-02 (fetch-bev):** the window check is now `!Number.isFinite(m) || m < 0 || m > MAX_M`, with the existing `nodata or out-of-range height …` message. `NODATA_AT_OR_BELOW` (-9000) and `MIN_M` (-100) are gone. A one-line comment says the BEV DTM never goes below 0 m in Austria, so a negative value (-9999 included) is nodata. The header's step 4 now says the same.
- **IN-09 (fetch-overview):** added `OVERVIEW_FLOOR_M = -500` with a doc comment. readTile now fails `implausible height` below the floor, the same way it already failed above `MAX_M`. The mosaic clamp comment says only values from the floor up to 0 m (sea and coast) clamp to 0 m. The header's steps 3 and 4 match.
- **IN-08 (shared modules):** `plate-args.mjs` holds `MAX_SIDE_M`, `CELL_M`, `parseArgs(argv, { values, flags, usage })`, `extentProblem`, `parseExtent`, `sameExtent`, `extentText` and `shown(root, dir)`. `fetch-retry.mjs` holds `reasonOf`, `finalError` and `withRetry(label, attempt, { attempts, backoffMs, onRetry, failText })`. fetch-bev, fetch-dem and fetch-overview import them and define none of them. fetch-bev counts its retries through `onRetry` and keeps "BEV tile … failed after 5 attempts: …" through its label. fetch-overview keeps its own label and its `--out`-only usage.
- **Selftest:** 3 new fn cases, so 298/298 pass (295 before). The 4 existing `fetch:` refusal cases pass unchanged.

## Task Commits

1. **Task 1a: 16 IN-02, one value rule in the BEV fetcher**: `93c5588` (fix)
2. **Task 1b: 16 IN-09, a lower sanity bound for the GLO-90 mosaic**: `a050c7e` (fix)
3. **Task 2: 16 IN-08, shared plate argument and retry modules**: `1d15fd8` (refactor)

SHAs for 17-15's write-back to 16-REVIEW-DISPOSITION.md: **IN-02 `93c5588`**, **IN-09 `a050c7e`**, **IN-08 `1d15fd8`**.

## Files Created/Modified

- `scripts/terrain/plate-args.mjs` (new): the shared plate argument and extent rules.
- `scripts/terrain/fetch-retry.mjs` (new): the shared bounded retry.
- `scripts/terrain/fetch-bev.mjs`: the single value rule. Imports both modules; `retryTile` wraps withRetry with the tile label and the retry counter.
- `scripts/terrain/fetch-dem.mjs`: imports plate-args (`--force-home` is a `flags` entry).
- `scripts/terrain/fetch-overview.mjs`: `OVERVIEW_FLOOR_M`. Imports both modules; `resolveDir` maps `--out` to the output directory.
- `scripts/guards/selftest.mjs`: imports both modules statically and adds the 3 fn cases after the existing fetch refusal cases.

## Decisions Made

- `withRetry` requires `attempts` and `backoffMs` and throws a TypeError on bad values. There is no hidden default; each fetcher passes its own constants, which happen to match (5, 500 ms).
- `failText` is an optional override. Both callers use the default `<label> failed after <attempts> attempts: <reason>`, which is their existing text.
- The GLO-90 `RESAMPLING` string ("negatives and sea clamped to 0 m") is unchanged. It is written into the committed `source.json`, and it is still true for the -500..0 m range.
- The plan asked for exactly 2 `^PASS fetch: (plate-args|fetch-retry) ` lines. The extra parseArgs case is therefore named `fetch: parseArgs …`, so it falls outside that count. It still counts toward the `name: 'fetch: ` total (6 single-quoted names plus 1 double-quoted).

## Deviations from Plan

### Auto-added

**1. [Rule 2 - Missing coverage] A third fn case for the shared parseArgs**
- **Found during:** Task 2
- **Issue:** None of the existing spawn cases reaches parseArgs' "needs a value", "given twice" or "unknown argument" messages, and that function was the riskiest part of the merge (three callers, one with a flag).
- **Fix:** Added `fetch: parseArgs refuses a missing value, a repeated option and an unknown argument with the caller's usage`. Separately, 25 offline refusals across the three fetchers were diffed before and after the refactor and came out byte-identical. Every one exits during argument parsing; the comparison script is in the session scratchpad and is not committed.
- **Files modified:** scripts/guards/selftest.mjs
- **Committed in:** 1d15fd8

---

**Total deviations:** 1 auto-added (Rule 2)
**Impact on plan:** Coverage only; no scope change.

## TDD Gate Compliance

Task 2 is `tdd="true"`, but its action says "Commit this alone ('refactor(17-08): 16 IN-08 …')", and 17-15 needs one SHA per finding. So there is no separate `test(17-08)` RED commit. The cycle still ran in order:
- **RED:** the 3 fn cases and their static imports went in first. `node scripts/guards/selftest.mjs` exited 1 with `ERR_MODULE_NOT_FOUND` for `scripts/terrain/plate-args.mjs`. **Semantic assessment:** this is a load failure, not an assertion failure. Under tdd.md's classifier it is INVALID_RED. An assertion-level RED was not possible without stub modules, because the target modules did not exist yet.
- **GREEN:** the modules were created and the fetchers rewired. Selftest passed 298/298.
- **REFACTOR:** only prettier formatting on fetch-overview.mjs and fetch-retry.mjs, before the single commit.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is needed. No networked fetch was run (T-08-09).

## Next Phase Readiness

- 17-15 can write back IN-02, IN-08 and IN-09 with the SHAs above.
- Pre-existing prettier warnings in build-terrain.mjs, build-trails.mjs and fetch-trails.mjs are out of scope and untouched; prettier is not part of `npm run lint`.

---
*Phase: 17-region-routes-seo-structured-data*
*Completed: 2026-11-24*

## Self-Check: PASSED

- FOUND: scripts/terrain/plate-args.mjs, scripts/terrain/fetch-retry.mjs
- FOUND: 93c5588, a050c7e, 1d15fd8 (each an ancestor of HEAD)
- Acceptance: NODATA_AT_OR_BELOW 0, MIN_M 0, OVERVIEW_FLOOR_M 4, PASS count 2, duplicate definitions 0, `name: 'fetch: ` 6, snapshot-commit --none OK after each commit, lint exit 0
