---
phase: 16-new-regions-alps-overview-data
fixed_at: 2026-11-23T18:42:20Z
review_path: .planning/phases/16-new-regions-alps-overview-data/16-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 16: Code Review Fix Report

**Fixed at:** 2026-11-23T18:42:20Z
**Source review:** .planning/phases/16-new-regions-alps-overview-data/16-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (WR-01 to WR-06; Tim chose all six on 2026-11-23, so WR-06 is in scope even though it is a necessity finding)
- Fixed: 6
- Skipped: 0 in scope. IN-01 to IN-09 are out of scope and listed under Skipped Issues as deferred.

## Fixed Issues

### WR-01: D-03/D-04 sidecar rules are not checked anywhere CI runs

**Files modified:** `scripts/photos/build-photo-data.mjs`, `scripts/guards/selftest.mjs`, `data/__tests__/exif-sidecar.test.ts`
**Commit:** b754d73
**Applied fix:** Stage 2 already holds each sidecar entry and its record, so it now applies two rules in the per-entry loop:
- It fails on a coarse or aerial record whose entry keeps `gps.altM`.
- It fails on a DJI still (EXIF Make `dji`, any case) whose record is not `kind: 'aerial'`.

The messages give the photo id and the rule, never a value. Two new G5 selftest cases cover the rules. One flips a 4dp ground record to aerial and also checks that the GPS altitude is not printed. The other flips a DJI record to ground. A committed-data Jest block walks the sidecar with the photo map and asserts both rules, plus a check that a coarse, an aerial and a DJI photo exist, so the walk can't pass on an empty set.

### WR-02: A coarse photo's `groundM` goes stale silently when its plate changes

**Files modified:** `data/schemas/photo.ts`, `scripts/photos/plate-dem.mjs`, `scripts/photos/extract-exif.mjs`, `scripts/photos/build-photo-data.mjs`, `scripts/README.md`, `data/photos/exif-sidecar.json`, `scripts/guards/selftest.mjs`, `data/__tests__/exif-sidecar.test.ts`
**Commit:** 9fa0b78
**Applied fix:**
- **Load:** `loadPlateDem` now returns the verified `sha256` of the source.
- **Extract:** `photos:exif` writes `gps.groundSourceSha256` beside a coarse photo's `groundM`.
- **Schema:** the `Gps` schema accepts the field only together with `groundM` (refine).
- **Build:** `photos:build` fails when the field is not the sha256 of the plate source it loads now. That covers a refetch, a moved extent and a changed region.
- **Regeneration:** the sidecar was rebuilt with `npm run photos:exif` from the local originals. A comparison by id showed that only the four coarse entries changed, each gaining the field: two on the Ortler plate and two on Saalfelden. No other field changed, and `data/generated/photos.ts` stayed byte-identical (`photos:build -- --check` OK).
- **Tests:** a G5 selftest case gives a coarse entry the Saalfelden source's hash. The privacy `coarseCase` asserts the field equals the fixture plate's sha256. A Jest check confirms every coarse entry names its region plate's current source.
- **Docs:** the README paragraph and table cell are updated.

### WR-03: `Position` documents coarse invariants it does not enforce

**Files modified:** `data/schemas/photo.ts`, `data/__tests__/photos.test.ts`
**Commit:** 04a5236
**Applied fix:** `Position` has two new refines:
- A `3dp` or `2dp` position must be `approximate`.
- `lat` and `lon` can't have more decimals than the position's precision allows. This uses the same 1e-6 tolerance as `Coord4`.

The helpers stay erasable TypeScript, as the file header requires. New schema tests use synthetic coordinates only.

### WR-04: The client-graph guard covers only `global-error`, but `overview.ts` claims it covers the whole client graph

**Files modified:** `lib/__tests__/client-graph.test.ts`
**Commit:** 62745f8
**Applied fix:** A second walk now starts at every file under `app/`, `components/` and `lib/` whose first statement is `'use client'`. It forbids `SERVER_ONLY_MODULES` (`data/generated/overview.ts`) on all of them. The test also checks that the walk is not empty: it needs more than 20 entries, `global-error` among them, and must reach the footer. The existing global-error walk and its four-module list are unchanged.
- **Why not `import 'server-only'`:** that would need the package (the brief says install nothing) and would break the Jest imports of `overview.ts`.
- **Header left alone:** the generated `overview.ts` header ("forbids it on the client graph") is now what the test enforces, so no generated file or terrain build was touched.
- **Probe:** a throwaway `'use client'` file importing the overview made the new test fail, naming the import chain. The probe was then deleted.

### WR-05: The BEV fetcher records "about 8 m" provenance without checking the overview scale

**Files modified:** `scripts/terrain/fetch-bev.mjs`
**Commit:** 2396b59
**Applied fix:** Before `readRasters`, the fetcher now fails unless the overview scale is between 7 and 9 m and square (`OVERVIEW_MIN_M`/`OVERVIEW_MAX_M`). The message names `OVERVIEW_LEVEL`, `RESAMPLING` and the schema literal to update. The squareness tolerance is 0.01 m, not the review's 1e-9, so a tile that is one pixel off square doesn't trip it. The real 2025 tiles read 8.0002 m (16-11 and 16-12 summaries), which is inside the bound. The fetcher needs the network and is never run in CI, so this path was checked only with `node -c`, ESLint and an offline argument refusal.

### WR-06: Impossible-state guard — the product check after `TerrainSource.parse` in fetch-bev

**Files modified:** `scripts/terrain/fetch-bev.mjs`
**Commit:** 61451dd
**Applied fix:** The record is now parsed with `BevAlsDtmSource.parse`, as fetch-dem parses `SwissAltiRegioSource`. The `source.product !== 'BEV ALS DTM'` check that could never fire is deleted, and the header step 5 wording is updated. `TerrainSource` is still used to read an existing plate's recorded source.

## Skipped Issues

### IN-01: Coarse coordinates can still be padded through `formatCoordinates`' default

**File:** `lib/home-format.ts:75-78`
**Reason:** deferred to Phase 17 (Tim, 2026-11-23)
**Original issue:** `formatCoordinates(position)` still defaults `decimals` to 4, so a caller that skips `DECIMALS[position.precision]` would pad a coarse coordinate.

### IN-02: Impossible-state guard — the redundant nodata comparisons in the BEV value check

**File:** `scripts/terrain/fetch-bev.mjs:97-100, 393, 418`
**Reason:** deferred to Phase 17 (Tim, 2026-11-23)
**Original issue:** `m <= NODATA_AT_OR_BELOW` is subsumed by `m < MIN_M`, and heights from -100 to 0 m fail later at the 16-bit check with a less specific message.

### IN-03: `homePhotos` names the wrong generated file in its error

**File:** `lib/ascent/home-photos.ts:32`
**Reason:** deferred to Phase 17 (Tim, 2026-11-23)
**Original issue:** The RangeError names `data/generated/photos.ts`, but the function reads `data/generated/home-photos.ts`.

### IN-04: `loadHomeWaypointIds` hides the real import error

**File:** `scripts/photos/build-photo-data.mjs:337-345`
**Reason:** deferred to Phase 17 (Tim, 2026-11-23)
**Original issue:** The bare `catch {}` replaces every failure with one message, so the real error is lost.

### IN-05: Overview summits drop the height source D-18 asks each record to carry

**File:** `scripts/terrain/build-terrain.mjs:526-540`
**Reason:** deferred to Phase 17 (Tim, 2026-11-23)
**Original issue:** `overviewSummits` drops `source` and `borders`, so a summit with `officialRef: null` has no height attribution in `overview.ts`.

### IN-06: IN-05's strip fix still clamps a centre near the edge

**File:** `scripts/terrain/build-terrain.mjs:851-857`
**Reason:** deferred to Phase 17 (Tim, 2026-11-23)
**Original issue:** `stripBbox` still silently shifts a band whose centre is within half a band height of the extent's edge.

### IN-07: The new 16-bit sources rely on git's binary autodetection

**File:** `.gitattributes:16-17`
**Reason:** deferred to Phase 17 (Tim, 2026-11-23)
**Original issue:** The plate and overview 16-bit PNGs and their `source.json` files have no explicit `binary` / `eol=lf` rules.

### IN-08: The two plate fetchers duplicate their argument and extent code

**File:** `scripts/terrain/fetch-bev.mjs:109-156, 218-223`
**Reason:** deferred to Phase 17 (Tim, 2026-11-23)
**Original issue:** fetch-bev and fetch-dem duplicate the argument and extent helpers; fetch-bev and fetch-overview duplicate the retry helpers.

### IN-09: The GLO-90 mosaic clamps every negative value to 0 m with no lower sanity bound

**File:** `scripts/terrain/fetch-overview.mjs:209-211, 250`
**Reason:** deferred to Phase 17 (Tim, 2026-11-23)
**Original issue:** Any negative value, including a void sentinel, becomes 0 m with no lower bound.

## Verification

**Where:** every edit, commit and gate ran in the main checkout on `gsd/phase-16-new-regions-alps-overview-data`, not in an isolated worktree. `workflow.use_worktrees` is unset, but a worktree couldn't serve this run: `photos:exif` (WR-02) needs the gitignored originals, and the gates need `node_modules`. Both exist only in the main checkout. The numbers below are reproducible from that tree.

**Results after all six commits:**

| Gate | Result |
|------|--------|
| `npm run lint` | exit 0. ESLint clean; parity, ci-gate, palette, contrast (47 pairs) and identity OK; guard:selftest 293/293 (was 290, plus 3 new G5 cases); data:check OK (terrain, photos:exif with the originals present, photos:derive, photos:build, tokens, trails, clips); served-images OK; test-count scan OK |
| `npm run type-check` | exit 0 on all three configs |
| `npx jest` | 115 suites, 2008/2008 passed (was 1998; 10 new tests) |

**Per fix:** `node -c` on every edited `.mjs` file, ESLint on the edited files, and targeted Jest suites before each commit. `photos:build -- --check`, `photos:exif -- --check` and `photos:derive -- --check` all passed after the sidecar was regenerated.

**Pixel neutrality:** no served image, no `public/terrain` file, no Matterhorn file (`data/generated/terrain.ts`, `precache.json`, `data/terrain/source`) and no e2e PNG changed. No `npm run build` was run. The only data file changed is `data/photos/exif-sidecar.json`, and its only change is the new `groundSourceSha256` on the four coarse entries.

**Privacy:** no coordinate, easting or northing, or GPS altitude was printed, committed or written here. The sidecar was compared by id and field name, with values masked. The new messages give only the photo id, plate id and field. New test fixtures use synthetic coordinates.

---

_Fixed: 2026-11-23T18:42:20Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
