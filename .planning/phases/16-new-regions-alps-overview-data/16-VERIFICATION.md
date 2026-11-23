---
phase: 16-new-regions-alps-overview-data
verified: 2026-11-23T20:00:00Z
status: passed
score: 4/4 must-haves verified
covered_files:
  - .planning/phases/16-new-regions-alps-overview-data/16-01-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-01-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-02-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-02-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-03-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-03-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-04-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-04-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-05-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-05-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-06-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-06-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-07-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-07-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-08-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-08-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-09-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-09-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-10-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-10-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-11-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-11-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-12-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-12-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-13-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-13-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-14-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-14-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-15-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-15-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-16-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-16-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-17-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-17-SUMMARY.md
  - .planning/phases/16-new-regions-alps-overview-data/16-18-PLAN.md
  - .planning/phases/16-new-regions-alps-overview-data/16-18-SUMMARY.md
  - data/generated/overview.ts
  - data/generated/photos.ts
  - data/schemas/overview.ts
  - data/schemas/photo.ts
  - data/terrain/overview.json
  - data/terrain/plates.json
  - lib/home-format.ts
  - lib/photos/view-model.ts
  - scripts/photos/extract-exif.mjs
  - scripts/terrain/build-terrain.mjs
covered_digest: "v4:sha256:7fd4e798a734c4e3bcf841e13ffb65b3234f08fd56dfb4f986799ffdae3c599e"
behavior_unverified: 0
overrides_applied: 0
---

# Phase 16: New Regions & Alps Overview Data Verification Report

**Phase Goal:** Tim's new photographs and regions, and an Alps-wide overview map, become committed, privacy-safe, build-time data, with every region plate and the overview built from their sources.
**Verified:** 2026-11-23
**Status:** passed
**Re-verification:** No, initial verification (HEAD 55a9234)

Privacy note: this report names records by id and field only. It quotes no photo coordinate, no projected easting or northing and no GPS altitude. I did not read any original's GPS.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A photo or clip can carry a coarser location than 4dp, set before any new original is ingested, and every place that shows a position marks it as coarse or approximate | VERIFIED | `data/schemas/photo.ts` makes `precision` (`4dp`/`3dp`/`2dp`) and `kind` (`ground`/`aerial`) required with no default. Refinements require `approximate: true` for any non-4dp position and reject finer decimals than the declared precision (lines 261-291). Extraction rounds at read time: in `data/photos/exif-sidecar.json` every lat/lon has no more decimals than its photo's declared precision. A coarse or aerial record has `gps.altM` null and `gps.utc` null, and carries a rounded DEM ground height with a `groundSourceSha256` pin. The generated `data/generated/photos.ts` has no lat/lon field with more than 4 decimals. All 11 positions are at or under their declared precision. The one display path for a position, `lib/photos/view-model.ts` (lines 252-282), prints coordinates at the position's own precision (`formatCoordinates(position, DECIMALS[...])`). It prefixes `≈` on an approximate position, appends a `±radius (approx.)` note, and labels the altitude row approximate for a coarse record and as ground height for an aerial one. Tests in the 115-suite Jest run cover it (2,008 passed). |
| 2 | More Zermatt photos and Ortler (IT) and Saalfelden (AT) are in committed photo data with EXIF facts, DEM heights and metadata-free hashed derivatives. The served-image guard and `data:check` pass, and each footprint check is recorded | VERIFIED | `data/photos/photo-map.json` has 11 photos: 7 Zermatt photos (the 4 v2.0 ones plus 3 new, per 16-14), 2 Ortler (`sam-20160717-120906`, `sam-20160717-124904`) and 2 Saalfelden aerial DJI stills (`dji-20260919-162232`, `dji-20260919-163558`). Each has a `camera`/`lens`/exposure `exif` block, `elevation` with `source: dem`, and 9 hashed derivative files tracked under `public/images/photos/` (11 ids x 9). `data/regions/regions.json` defines `ortler` (IT) and `saalfelden` (AT) with facts and sources. I re-ran `npm run data:check` (terrain, photos:exif, photos:derive, photos:build, tokens, trails, clips): all OK. `npm run guard:images`: `served-images: OK`, which enforces metadata-free and hashed names. The footprint checks are recorded as booleans-only in 16-16-SUMMARY.md (Ortler, 4dp/3dp/2dp with 1 km margin) and in the 16-12/16-14 summaries (Saalfelden). `photos:build -- --check` would fail if a photo lay outside its plate. |
| 3 | Each new region has its own plate from exactly one source (swissALTIRegio for Ortler, BEV ALS DTM for Saalfelden). `terrain:build --check` is deterministic. The Matterhorn plate's hashed files and Home are unchanged | VERIFIED | `data/terrain/plates.json` registers `matterhorn`, `ortler` and `saalfelden`. `data/terrain/plates/ortler/source.json` names product swissALTIRegio only (EPSG:2056, LN02, sha256 pin). `data/terrain/plates/saalfelden/source.json` names BEV ALS DTM only (EPSG:3035, DOI, CC BY 4.0 credit, sha256 pin). Each has contours (hero, strip) and hillshade (640, 1100 in AVIF and WebP) under `public/terrain/<prefix>*`. `npm run terrain:build -- --check` prints `terrain: OK`. `git diff 49a3562^..HEAD` over `public/terrain`, `data/terrain/source` and `data/generated/terrain.ts` shows additions only. There is no M or D entry, so every Matterhorn hashed file is byte-identical. Home: `home-photos.ts` and `home-plate.ts` are new footer-chunk modules and add no pixels. The Visual Regression gate passed on `ci/16-18` with no baseline update, and the six later fix commits touch only data, schema, script and test files (`git diff --stat e96f266..HEAD`), not rendered components. |
| 4 | A build-time Alps overview is built from Copernicus GLO-90 contours, with each region's plate extent as a rectangle and 3-5 labelled reference summits, within a spike-measured size budget | VERIFIED | `data/terrain/overview/source.json` pins Copernicus DEM GLO-90 (release, tile list sha256, tile list). `data/terrain/overview.json` holds 5 summits (Dufourspitze, Mont Blanc, Grossglockner, Zugspitze, Triglav), each with an official height and a status. Triglav is marked `secondary` honestly. `data/generated/overview.ts` is server-only and has 3 outlines (`ortler`, `saalfelden`, `zermatt`/`matterhorn`), each 4 corners, and a contour URL of `/terrain/overview-contours-alps.3cdc771b90.svg`. I measured the file at 53,880 B raw and 14,302 B brotli, against `OVERVIEW_BUDGET` of 120,000 raw, 30,000 brotli and 250,000 served. The budget came from Tim's 16-02 spike decision (`16-OVERVIEW-SPIKE.md`: variant C, measured 53,906 B raw / 14,312 B brotli). `data/__tests__/overview.test.ts` enforces the budget. `lib/__tests__/client-graph.test.ts` keeps the overview off the client graph and passes. |

**Score:** 4/4 truths verified (0 present-but-behavior-unverified).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `data/schemas/photo.ts` | Required precision and kind, coarse invariants | VERIFIED | Substantive, used by `build-photo-data.mjs` and the view-model |
| `data/generated/photos.ts` | 11 typed photos | VERIFIED | `photos:build -- --check` OK |
| `data/photos/exif-sidecar.json`, `photo-map.json` | Rounded GPS, region, country, precision, kind | VERIFIED | `photos:exif -- --check` OK |
| `data/regions/regions.json` | ortler, saalfelden facts | VERIFIED | Present with sources |
| `data/terrain/plates.json`, `plates/{ortler,saalfelden}/` | Registry and single-source DEMs | VERIFIED | One product each |
| `data/generated/plates.ts`, `public/terrain/*` | Hashed plate outputs | VERIFIED | Hash names pass `guard:images` |
| `data/terrain/overview*`, `data/generated/overview.ts`, overview SVG | Overview pipeline | VERIFIED | Within budget, server-only |
| `scripts/terrain/fetch-bev.mjs`, `fetch-overview.mjs`, `fetch-dem.mjs --plate` | Fetchers | VERIFIED | Present; selftest 293/293 |
| `proj4` and EPSG:3035 in the photo CRS dispatch | LAEA support | VERIFIED | Saalfelden DEM heights resolve and `photos:build --check` passes |
| `data/light-table.ts` | D-15 pin | VERIFIED | Used by `lib/photos/routes.ts` and the view-model |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| photo-map.json and sidecar | generated photos.ts | `build-photo-data.mjs` | WIRED (`--check` OK) |
| plates.json | generated plates.ts, public/terrain | `build-terrain.mjs` | WIRED (`--check` OK) |
| regions.json plate ids | overview outlines | `build-terrain.mjs` | WIRED (3 outlines match 3 plates) |
| overview.json | overview.ts and SVG | `build-terrain.mjs` | WIRED |
| photo.position precision | on-screen coordinate text | `view-model.ts` and `formatCoordinates` | WIRED (the only path that prints coordinates) |
| lightTableIds | photo routes, view-model | `data/light-table.ts` | WIRED, so new photos stay off v2.0 routes |
| overview.ts | client graph | `client-graph.test.ts` | Forbidden and tested |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| `photos.ts` `elevation` | DEM height per photo | Plate DEM (swissALTIRegio or BEV) | Yes, `source: dem` for all 11 | FLOWING |
| `overview.ts` contours | GLO-90 grid | committed `dem.png` with pinned sha256 | Yes, 53,880 B SVG | FLOWING |
| Coordinate display | `position` and `precision` | generated photos | Yes | FLOWING |

### Behavioral Spot-Checks and Re-runs

| Check | Command | Result | Status |
|-------|---------|--------|--------|
| Generator drift | `npm run data:check` | all 7 checks OK | PASS |
| Served-image guard | `npm run guard:images` | `served-images: OK` | PASS |
| Guard selftest | `npm run guard:selftest` | 293/293 | PASS |
| Types | `npm run type-check` (3 configs) | exit 0 | PASS |
| Jest, whole suite | `npx jest lib components/photos components/terrain app` (this pattern ran the whole suite) | 115 suites, 2,008 tests passed | PASS |
| Data and client-graph tests | `npx jest data/__tests__ lib/__tests__/client-graph.test.ts` | 18 suites, 397 tests passed | PASS |
| Overview size | node over the committed SVG | 53,880 B raw, 14,302 B brotli, within budget | PASS |
| Matterhorn bytes | `git diff --name-status 49a3562^..HEAD` over `public/terrain`, `data/terrain/source`, `terrain.ts` | additions only | PASS |

I did not run `npm run build`, `next start` or Playwright. The pixel claim rests on CI run 45188005124 (Visual Regression PASS at e96f266) plus my check that the later commits touch no rendering code.

### Probe Execution

No `probe-*.sh` is declared by the phase. Skipped.

### Requirements Coverage

Every requirement ID in the plans' frontmatter was cross-checked against REQUIREMENTS.md. All three IDs are claimed by at least one plan, and none is orphaned. REQUIREMENTS.md maps DATA-12, DATA-13 and DATA-14 to Phase 16 and no other IDs.

| Requirement | Source plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| DATA-12 | 16-02, 16-13, 16-15, 16-17, 16-18 | Build-time Alps overview from GLO-90 contours, region rectangles, 3-5 summits, measured budget | SATISFIED | Truth 4 |
| DATA-13 | 16-03 to 16-12, 16-14, 16-16, 16-17, 16-18 | New Zermatt photos, Ortler and Saalfelden with EXIF, DEM heights and hashed derivatives | SATISFIED | Truths 2 and 3 |
| DATA-14 | 16-01, 16-06, 16-08, 16-14, 16-17, 16-18 | Coarse location per photo or clip, flagged wherever shown | SATISFIED | Truth 1 |

### Anti-Patterns Found

I scanned the 76 non-planning, non-binary files the phase changed for `TBD`, `FIXME` and `XXX` without a follow-up reference. There were none.

- **Privacy, repo-wide.** I did not read GPS from any original. `assets/photos-original/` is gitignored and no file under `assets/` is tracked. Committed positions never exceed their declared precision. The 4 coarse or aerial records carry no GPS altitude or UTC. The 16-SECURITY.md closes 48 of 48 threats (`threats_open: 0`). The booleans-only D-25 scan is recorded in 16-18-SUMMARY.md and found nothing new in `.planning/`. As a separate check, I compared the committed 3/4dp photo values against the tracked planning files. The only overlap is one Zermatt latitude that equals an example number written in 16-CONTEXT, 16-RESEARCH and 16-REVIEW. That number already ships in the v2.0 data. It is not a leak of an original's position.
- **16-REVIEW.md.** The 6 warnings are fixed (WR-01 to WR-06, b754d73..61451dd). The 9 info items were deferred to Phase 17 by Tim (16-REVIEW-DISPOSITION.md). One of them is IN-01: `formatCoordinates` still defaults to 4 decimals if a future caller omits the precision. The only current caller passes the precision, so this is advisory.
- **Not a gap, by design (D-15/D-25).** The new photos, plates and overview are not rendered on any route. They arrive in Phase 17 and Phase 18.

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `lib/home-format.ts` `formatCoordinates` | default `decimals = 4` (IN-01) | Info | None today, deferred to Phase 17 |

### Human Verification Required

None. Phase 16 is data-only and pixel-neutral, with no browser-observable change. `16-DOM-VERIFY.md` records `outcome: could_not_look, reason: not_dispatched`, so no live-DOM step ran. For this "nothing visible changes" claim, the covering evidence is the Linux Visual Regression gate on `ci/16-18`, 341 passing E2E tests, and the Matterhorn files being byte-identical.

Residual risk, not blocking: the six WR fix commits (b754d73..61451dd) are local and unpushed, so CI has not seen them. I re-ran everything CI would check locally (Jest, type-check, selftest, `data:check`, `guard:images`) and all passed. The push will re-run CI.

### Gaps Summary

No gaps. All four ROADMAP success criteria hold in the codebase, the three requirement IDs are covered, and every generator `--check` and local gate I was allowed to re-run passes.

---

_Verified: 2026-11-23_
_Verifier: Claude (gsd-verifier)_
