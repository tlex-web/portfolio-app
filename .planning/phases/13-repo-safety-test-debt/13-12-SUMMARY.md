---
phase: 13-repo-safety-test-debt
plan: 12
subsystem: testing
tags: [guard-selftest, photo-pipeline, characterization, sharp, cli-flags]

requires:
  - phase: 13-repo-safety-test-debt
    provides: "13-10 guard selftest state this plan extends"
provides:
  - "--root <dir> flag on scripts/photos/build-photo-data.mjs and scripts/photos/build-derivatives.mjs (default root unchanged)"
  - "G5: four spawned photos:build --check cases (control, WR-03 offset, D-04 GPS drift, WR-01 off-plate)"
  - "G6: one spawned photos:derive write-mode case with whole-tree byte-identity check (WR-05)"
  - "selftest case field nodeArgs (node flags before the guard path)"
affects: [15-pixel-neutral-data-model, photo-scripts-refactor]

actuals:
  tokens: 4600
  tasks: 2
  commits: 2
plan_head_before: 9216c2a71d78760e87db0fcae0782883c349fc0b
plan_head_after: a4d97436e420ad70feda72cf4152ca026e0a7b3c

tech-stack:
  added: []
  patterns:
    - "Script characterization through --root plus a spawned selftest case against a temp root"
    - "Generated fixtures via top-level await before the synchronous case table"

key-files:
  created: []
  modified:
    - scripts/photos/build-photo-data.mjs
    - scripts/photos/build-derivatives.mjs
    - scripts/guards/selftest.mjs

key-decisions:
  - "G6 asserts the message the script actually prints for an undecodable source ('unsupported image format', after 'encoded img-0001 (9 files)'), not 'nothing written': the derive script prints that string only on its problems/schema paths, and the plan forbids changing its output"
  - "G6 checks the whole temp tree (every pre-existing file byte-identical, no new file anywhere), which covers public/images/photos/ and the manifest"
  - "--root rejects a missing value or a value starting with -- ('--root needs a directory'), the same shape as check-install-parity.mjs"

patterns-established:
  - "tempPhotoDataRoot(edit): copies the five photo data inputs to a temp root and applies a JSON edit that must change something"
  - "snapshotTree / treeUnchanged: byte-identity check of a fixture tree after a spawned write-mode run"

requirements-completed: [VERIFY-06]

coverage:
  - id: D1
    description: "--root <dir> on both photo scripts, parsed before any ROOT-derived path; --bogus names both flags; default behaviour unchanged"
    requirement: VERIFY-06
    verification:
      - kind: other
        ref: "node scripts/photos/build-photo-data.mjs --bogus (exit 1, names --check and --root <dir>)"
        status: pass
      - kind: other
        ref: "node scripts/photos/build-derivatives.mjs --bogus (exit 1, names --check and --root <dir>)"
        status: pass
      - kind: integration
        ref: "npm run data:check (photos:derive OK, photos:build OK)"
        status: pass
    human_judgment: false
  - id: D2
    description: "G5: photos:build --check against a temp copy passes unmodified and fails on the WR-03 offset, the D-04 GPS drift and the WR-01 off-plate position"
    requirement: VERIFY-06
    verification:
      - kind: integration
        ref: "scripts/guards/selftest.mjs#G5 (4 cases, npm run guard:selftest 143/143)"
        status: pass
    human_judgment: false
  - id: D3
    description: "G6: photos:derive write mode with a valid then an undecodable source exits 1 and leaves the temp tree byte-identical with no new file"
    requirement: VERIFY-06
    verification:
      - kind: integration
        ref: "scripts/guards/selftest.mjs#G6 photos:derive (npm run guard:selftest 143/143)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every G5 fail case and the G6 case seen red on a seeded fault, then reverted"
    requirement: VERIFY-06
    verification:
      - kind: other
        ref: "seeded faults WR-03, D-04, WR-01, unlink-first, write-as-encoded (table in SUMMARY)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 12: Photo script characterization (G5, G6) Summary

**`--root <dir>` on both photo scripts, plus spawned selftest cases: four G5 cases prove the WR-03 offset, D-04 GPS drift and WR-01 off-plate guards fail `photos:build --check`, and a G6 case proves `photos:derive` validates before writing or unlinking. All five were seen red on a seeded fault.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-11-13T11:56:31Z
- **Completed:** 2026-11-13T12:02:10Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `build-photo-data.mjs` and `build-derivatives.mjs` now parse `--check` and `--root <dir>` before any ROOT-derived constant. Without `--root`, both behave as before: `npm run data:check` passes and `git status` shows no change under `public/images/photos/`, `data/generated/` or `data/photos/`.
- G5 (four cases) spawns `photos:build --check --root <temp copy>` with the `MODULE_TYPELESS_PACKAGE_JSON` flag the npm scripts pass:
  - the unmodified copy exits 0 with `photos:build: OK`;
  - with img-0605 `offsetTimeOriginal` set to `+01:00` it exits 1 with `img-0605: EXIF OffsetTimeOriginal +01:00 is not the Europe/Zurich offset +02:00`;
  - with img-0605 `gps.utc` shifted one hour it exits 1 with `not +02:00 within 60 s (D-04)`;
  - with r004-011's hand-placed position moved to Sion it exits 1 with `r004-011: position lies outside the DEM extent`.
- G6 (one case) generates a temp tree with top-level `await`. The tree holds a 32 x 24 sRGB JPEG for img-0001, undecodable bytes for img-0002 (each sidecar sha256 is real), a stale derivative and an existing manifest. `photos:derive --root <tmp>` in write mode exits 1 after `encoded img-0001 (9 files)`, and every pre-existing file is byte-identical with no new file anywhere in the tree.
- The fixtures are generated and nothing new was committed. The G5 copies of the real sidecar live only in OS temp and are removed by the cleanup loop; 0 `guard-selftest-*` dirs remained after each run.

## Seeded faults (each reverted; the file was restored from a backup and checked with `cmp`)

| Fault seeded in the script | Case | Observed |
|---|---|---|
| WR-03 offset comparison deleted (`build-photo-data.mjs`) | G5 WR-03 | exit 0 instead of 1; output lacks the offset message and `stale`. 139/140 |
| D-04 GPS drift block deleted | G5 D-04 | exit 0 instead of 1; output `photos:build: OK`. 142/143 |
| WR-01 off-plate throw deleted | G5 WR-01 | exit stayed 1 (the PhotoFacts schema backstop, `uv.u: Too small`), but the case went red because the output lacks `position lies outside the DEM extent`. 142/143 |
| Stale-file unlink loop moved before the encode loop (`build-derivatives.mjs`) | G6 | exit 1, but red: `public/images/photos/img-0001-640.0123456789.webp was deleted`. 142/143 |
| Each derivative written as it is encoded | G6 | exit 1, but red: nine `img-0001-*` files new under `public/images/photos/`. 142/143 |

## Task Commits

1. **Task 1: G5 end to end, --root in the data build and the offset case** - `a61bdd2` (test)
2. **Task 2: Remaining G5 cases and G6** - `a4d9743` (test)

## Files Created/Modified

- `scripts/photos/build-photo-data.mjs`: `parseArgs` with `--check` and `--root <dir>` above ROOT; usage doc
- `scripts/photos/build-derivatives.mjs`: the same `parseArgs` above ROOT; NAME moved up; usage doc
- `scripts/guards/selftest.mjs`: `nodeArgs` case field; `PHOTO_DATA`, `PHOTO_DERIVE`, `tempPhotoDataRoot`, `tempDeriveRoot`, `snapshotTree`/`treeUnchanged`; five cases (`G5 …` x4, `G6 …`); five temp roots added to the cleanup list

## Decisions Made

- G6 asserts the actual output for an undecodable source (see Deviations).
- G6 compares the whole temp tree, not only `public/images/photos/`, so a stray manifest write or a sidecar rewrite is caught too.
- A `--root` with no value, or with a value starting with `--`, exits 1 with `--root needs a directory`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Plan defect] G6 expected output `nothing written` does not apply to an undecodable source**
- **Found during:** Task 2
- **Issue:** The plan's must-have expects `photos:derive` to exit 1 with `nothing written`. For a source sharp cannot decode, `assertSrgb` throws, and the top-level catch prints only the error (`photos:derive: Input buffer contains unsupported image format`). `nothing written` is printed only when encoded-buffer problems or manifest schema issues are found. The plan's prohibition forbids changing what the script prints.
- **Fix:** The G6 case asserts `photos:derive: encoded img-0001 (9 files)` (the valid photo was encoded first, so a write-as-encoded or unlink-early regression has something to show) and `unsupported image format`, plus exit 1 and the byte-identity check. The behavioural intent (validate before write before unlink) is fully covered, as the two seeded G6 faults show.
- **Files modified:** scripts/guards/selftest.mjs
- **Verification:** G6 passes on the real script and goes red on both seeded faults
- **Committed in:** a4d9743

**2. [Rule 3 - Blocking] Selftest runner could not pass node flags**
- **Found during:** Task 1
- **Issue:** The runner spawned `node <guard> …` only, but the plan requires the `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` flag before the script.
- **Fix:** Added an optional `nodeArgs` case field, documented in the case-shape header. Existing cases are unaffected (`[]` default).
- **Files modified:** scripts/guards/selftest.mjs
- **Committed in:** a61bdd2

---

**Total deviations:** 2 auto-fixed (1 plan defect, 1 blocking)
**Impact on plan:** No scope creep; the script behaviour for the real repository is unchanged.

## Issues Encountered

- The first seeded-fault run missed two anchors, because the checkout has CRLF line endings, and the first unlink-first seed hit a TDZ error (`outputs` used before its declaration) instead of simulating the fault. The seed helper (scratchpad only) was fixed to normalise EOLs and to insert the moved loop after the `outputs` declaration. The table above records only the valid runs.

## Verification

- `npm run guard:selftest`: 143/143, five cases named `G5 …` (4) / `G6 …` (1), no FAIL
- `npm run photos:build -- --check`: `photos:build: OK`
- `npm run data:check`: exit 0 (terrain, photos:exif, photos:derive, photos:build, tokens, trails, clips all OK)
- `npm run lint`: exit 0
- `git status --porcelain -- public/images/photos data/generated data/photos`: empty

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Phase 15's photo-script rewrite must keep `--root`, `--check` and the printed messages the G5/G6 cases assert, or update the cases on purpose.

## Self-Check: PASSED

- FOUND scripts/photos/build-photo-data.mjs, scripts/photos/build-derivatives.mjs, scripts/guards/selftest.mjs
- FOUND commits a61bdd2, a4d9743 (ancestors of HEAD)

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*
