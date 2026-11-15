---
phase: 15-region-plate-data-model
verified: 2026-11-15T12:00:00Z
status: passed
score: 6/6 must-haves verified
covered_files:
  - ".planning/phases/15-region-plate-data-model/15-01-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-01-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-02-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-02-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-03-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-03-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-04-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-04-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-05-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-05-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-06-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-06-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-07-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-07-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-08-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-08-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-09-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-09-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-10-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-10-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-11-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-11-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-12-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-12-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-13-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-13-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-14-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-14-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-15-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-15-SUMMARY.md"
  - ".planning/phases/15-region-plate-data-model/15-16-PLAN.md"
  - ".planning/phases/15-region-plate-data-model/15-16-SUMMARY.md"
  - "__tests__/jest-globals.d.ts"
  - "data/generated/photos.ts"
  - "data/generated/plates.ts"
  - "data/home.ts"
  - "data/photos/photo-map.json"
  - "data/regions/regions.json"
  - "data/terrain/plates.json"
  - "lib/ascent/home-photos.ts"
  - "lib/ascent/waypoints.ts"
  - "lib/photos/routes.ts"
  - "scripts/guards/check-served-images.mjs"
  - "scripts/guards/selftest.mjs"
  - "scripts/photos/build-photo-data.mjs"
  - "scripts/photos/extract-exif.mjs"
  - "scripts/terrain/build-terrain.mjs"
  - "tsconfig.e2e.json"
  - "tsconfig.jest.json"
covered_digest: "v4:sha256:7c12d81ebcd7c4b5555c2ac973a01da587eb41269ff01ac0943d613bc492cdde"
behavior_unverified: 0
overrides_applied: 0
---

# Phase 15: Region & Plate Data Model Verification Report

**Phase Goal:** The data, the terrain build and the photo links are ready for many regions while the site looks and builds exactly as before: Home reads its own waypoint list, every photo has a region and a country, the terrain build handles many plates, and drone telemetry can be neither committed nor served.
**Verified:** 2026-11-15
**Status:** passed
**Re-verification:** No, initial verification

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP success criterion) | Status | Evidence |
|---|-----------------------------------|--------|----------|
| 1 | Home reads an explicit list of its four Matterhorn waypoints; adding a photo outside the list or in another region leaves ascent, 1,617 m rail start and footer ticks unchanged | VERIFIED | `data/home.ts` exports `homeWaypointIds` (img-0605, img-0629, img-0662, r004-011). `lib/ascent/home-photos.ts` `homePhotos()` filters the generated photos by that list and throws on an unknown id. `lib/ascent/waypoints.ts` `homeInput()` and `homeLowestDemM` read it. `components/site/SiteFooter.tsx` ticks and `TrailSigns.tsx` count read it too. `git grep` finds no other Home-surface import of the full generated photo set. `lib/__tests__/home-waypoints.test.tsx` mocks an extra photo (another region at 900 m, and an unlisted Zermatt photo at a tie height) and asserts the ids, order, 1,617 m, 4 footer ticks, trail sign and rail label are unchanged. I re-ran it with `data/__tests__/home.test.ts`: pass. |
| 2 | Every photo record names its region (Zermatt) and country in typed, committed data; CI fails when missing or stale | VERIFIED | `data/photos/photo-map.json` and `data/regions/regions.json` are committed, with strict Zod schemas in `data/schemas/region.ts` and `photo.ts` (closed country enum). `data/generated/photos.ts` has 4 of 4 photos with `region: zermatt` and `country: CH`. `npm run photos:build -- --check` and `photos:exif -- --check` are in `data:check`, which is in `npm run lint`. `ci.yml` runs `npm run lint` (line 115). Selftest cases pass for a missing map record, a missing sidecar entry, an unknown region, a region on an unknown plate, a lowercase country, and an unmapped original in `photos:exif`. |
| 3 | The terrain build reads a plate registry and builds every plate in one run; Matterhorn-only reproduces today's hashed files byte for byte; `--check` green; a fixture second plate gets its own prefixed files without touching Matterhorn | VERIFIED | `data/terrain/plates.json` registry, and `scripts/terrain/build-terrain.mjs` loops over it with `--root` and prefix-anchored lookups. `npm run terrain:build -- --check` prints `terrain: OK`. `git diff d29ea9a..HEAD -- public/terrain data/generated/terrain.ts data/generated/precache.json '*.png'` exits 0, so no Matterhorn byte changed. Selftest PASS: "a fixture 2D plate gets its own prefixed files and Matterhorn stays byte-equal", "--check sees a missing prefixed plate file", "removing a plate sweeps only its files", plus the two WR-01 dropped-hillshade-size cases. `plates.test.ts` and `terrain.test.ts` (D-15 pin) pass. |
| 4 | Served-asset guard fails on `.SRT`, `.LRF`, GPX, KML and on MP4s with GPS or telemetry tracks anywhere in repo or site, proven by selftest fixtures | VERIFIED | `scripts/guards/check-served-images.mjs` defines `TELEMETRY_EXT` (.srt .lrf .dat .lrv .thm .xmp .gpx .kml .kmz .nmea .igc .fit .tcx), matched case-insensitively over `git ls-files -co --exclude-standard` plus all of `public/` including ignored files. Selftest PASS for DJI `.SRT`, every sidecar type in any case (GeoJSON passes), untracked sidecar, ignored file under `public/`, force-added sidecar under originals, and no git work tree fails closed. MP4 track rule has fixtures for djmd, dbgi, gpmd, sbtl and text tracks. `guard:images` is in `lint`: `served-images: OK`. `.gitignore` also ignores the originals folders. |
| 5 | Zero visual-baseline changes, and every photo link comes from one URL helper (still `/photos/<slug>`) | VERIFIED | No PNG and nothing under `public/` changed since `d29ea9a` (git diff exit 0; 91 commits). `lib/photos/routes.ts` exports `photoHref` and `photoRouteSlugs`. `git grep "/photos/"` over app, components, lib and proxy.ts, excluding tests and routes.ts, returns nothing. `lib/__tests__/photo-routes.test.ts` has a source scan (D-18) and passes. CI run 43651737781 on `ci/15-16` (sha 0b06608) concluded success with Visual Regression success and no baseline update (checked with `gh run view`). |
| 6 | `npm run type-check` also type-checks Jest tests, e2e specs and Playwright configs with zero errors, without `@types/jest` unvetted | VERIFIED | `package.json` `type-check` is `tsc --noEmit && tsc -p tsconfig.jest.json && tsc -p tsconfig.e2e.json`. I ran it: exit 0. `tsconfig.jest.json` lists 114 test files, `tsconfig.e2e.json` lists 37 e2e files plus both Playwright configs. Globals come from `__tests__/jest-globals.d.ts` using `@jest/globals`. `@types/jest` is absent from `package.json`. A canary test guards the globals typing. The WR-03 fix aligned the tsconfig include with Jest's `testMatch`. |

**Score:** 6/6 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `data/home.ts` | Explicit four-id Home list | VERIFIED | Typed `satisfies readonly PhotoId[]`; strict test pins four unique ids in zermatt on the matterhorn plate. |
| `lib/ascent/home-photos.ts` | Membership filter | VERIFIED | Imported by `waypoints.ts` and `SiteFooter.tsx`. |
| `data/terrain/plates.json`, `data/generated/plates.ts`, `scripts/terrain/build-terrain.mjs` | Plate registry, generated sheet, N-plate builder | VERIFIED | Wired through `terrain:build` and `data:check`. |
| `data/photos/photo-map.json`, `data/regions/regions.json`, `data/schemas/region.ts` | Region and country records | VERIFIED | Consumed by `build-photo-data.mjs` and `extract-exif.mjs`. |
| `scripts/guards/check-served-images.mjs` | Telemetry rule | VERIFIED | Wired in `lint` and `selftest.mjs`. |
| `lib/photos/routes.ts` | One photo URL helper | VERIFIED | Used by Link hrefs, proxy, sitemap, saved-pages and metadata; scan test enforces it. |
| `tsconfig.jest.json`, `tsconfig.e2e.json`, `__tests__/jest-globals.d.ts` | Three-config type-check | VERIFIED | In `npm run type-check`; exit 0. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `data/home.ts` | buildWaypoints, footer ticks, TrailSigns, `homeLowestDemM` | `homePhotos(homeWaypointIds)` | WIRED | Confirmed by grep and by the isolated-registry test. |
| `photo-map.json` and `regions.json` | `data/generated/photos.ts` | `photos:build` | WIRED | `--check` OK; 4 of 4 records carry region and country. |
| `plates.json` | `plates.ts`, `terrain.ts`, `public/terrain` | `terrain:build` | WIRED | `--check` OK. |
| `lint` | `data:check`, `guard:images`, `guard:selftest`, `guard:tests:scan` | npm script | WIRED | The CI job runs `npm run lint` and `npm run type-check`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `SiteFooter` ticks | `homePhotos()` | `data/generated/photos.ts` filtered by `homeWaypointIds` | Yes (4 ticks) | FLOWING |
| `homeLowestDemM` | `buildWaypoints()[0].altitudeM` | Home list heights | Yes (1617, asserted in `photos.test.ts`) | FLOWING |
| Photo pages | `photoHref(slug)` | `editorial` slugs | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Three-config type-check | `npm run type-check` | exit 0 | PASS |
| Lint chain (eslint, guards, selftest, data:check, images, scan) | `npm run lint` | selftest 269/269, all `--check` OK, `test-count: scan OK` | PASS |
| Targeted Jest (photo-routes, home-waypoints, home, plates, terrain, photo-map) | `npx jest ...` | 6 suites, 140 tests pass | PASS |
| Full Jest (orchestrator run) | `npm test` | 113 suites, 1912 tests pass | PASS |
| No pixel or Matterhorn byte change | `git diff --exit-code d29ea9a..HEAD -- public/terrain data/generated/terrain.ts data/generated/precache.json '*.png'` | exit 0 | PASS |
| CI on the phase tip | `gh run view 43651737781` | success; Visual Regression success; CI OK success | PASS |

### Probe Execution

Step 7c: SKIPPED. The plans declare no `probe-*.sh` scripts, and none exist under `scripts/*/tests/`. The guard selftest covers that role and was run above.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| DATA-09 | 15-08, 15-09, 15-16 | Home reads an explicit waypoint list | SATISFIED | Truth 1 |
| DATA-10 | 15-06, 15-07, 15-10, 15-11, 15-15, 15-16 | Region and country on every photo, CI staleness check | SATISFIED | Truth 2 |
| DATA-11 | 15-04, 15-05, 15-11, 15-16 | N-plate terrain build, deterministic, Matterhorn byte-identical | SATISFIED | Truth 3 |
| DATA-15 | 15-12, 15-16 | Telemetry rejected anywhere in repo or site | SATISFIED | Truth 4 |
| GUARD-10 | 15-01, 15-02, 15-03, 15-13, 15-14, 15-16 | Tests, e2e and Playwright configs type-checked | SATISFIED | Truth 6 |

All five IDs appear in plan frontmatter and in REQUIREMENTS.md (marked Complete, Phase 15). No orphaned requirements: REQUIREMENTS.md maps no other ID to Phase 15.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (phase-modified non-planning files) | n/a | `TBD`, `FIXME`, `XXX` grep | None | No markers found. |

Review findings WR-01..03 are fixed (9d86b53, 6b08cfb, 27b8162). IN-01..08 are deferred to Phase 16 in `15-REVIEW-DISPOSITION.md`. These are info-level and none contradicts a success criterion. One example is IN-04: `jest-mock` is imported by `jest-globals.d.ts` through hoisting only.

### Human Verification Required

None blocking. Two notes:
- `15-DOM-VERIFY.md` is `could_not_look` (no browser selected), and that step is advisory. The "looks exactly as before" claim rests on Visual Regression passing with no baseline update on `ci/15-16`, the e2e run (657 in Chromium and Firefox, per 15-16-SUMMARY), and the empty PNG diff. I confirmed the CI result and the PNG diff myself. I did not re-run e2e or the build.
- The client JS budget (+1,190 B against 4,096 B) is a build measurement from 15-16-SUMMARY. I did not re-measure it, and it is not a ROADMAP success criterion.

### Gaps Summary

No gaps. All six ROADMAP success criteria are backed by committed code, passing guards and tests, and a green CI run on the phase tip. The deferred info findings are tracked for Phase 16.

---

_Verified: 2026-11-15_
_Verifier: Claude (gsd-verifier)_
