---
phase: "16"
slug: "new-regions-alps-overview-data"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-22"
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `16-RESEARCH.md` § Validation Architecture. Task IDs, plans and waves are filled from the 18 plans (plan revision 1, 2026-11-23). `status` and `nyquist_compliant` stay at their draft values until `/gsd-validate-phase` reconciles them after execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.5.2 (jsdom default, `@jest-environment node` per data test), Playwright 1.65.0, guard selftest (`npm run guard:selftest`) |
| **Config file** | `jest.config.js`, `playwright.config.ts`, `tsconfig.jest.json`, `tsconfig.e2e.json` |
| **Quick run command** | `npx jest <touched test paths>` + the generator `--check` the task touched |
| **Full suite command** | `npm run lint && npm run type-check && npm test` |
| **Estimated runtime** | ~60 s per-task loop (Jest paths + type-check + one `--check`); selftest ~35 s plus ~2 s per new fixture case; Jest full suite several minutes |

`npm run build`'s postbuild rewrites the tracked `public/service-worker.js`. Run `git restore public/service-worker.js` after every build, including the client-JS measurement build.

**Pre-ingest red gate (RESEARCH Pitfall 1):** `npm run photos:exif -- --check`, and with it local `data:check` and `npm run lint`, is red now: the seven new originals in `assets/photos-original/` have no `photo-map.json` records. Plans that run before the precision checkpoint (D-02) must say how they keep their gates meaningful, either by moving the new originals aside or by scoping the check. Records must not be committed before that checkpoint. The plans move them aside: 16-01 Task 1 (Step 1) stages every original without a record in the gitignored `assets/photos-original/incoming/`, and 16-14 and 16-17 move each one back only in the task that writes its record.

---

## Sampling Rate

- **After every task commit:** `npx jest <touched test paths>` + `npm run type-check` + the touched `--check` (`npm run photos:exif -- --check`, `npm run photos:derive -- --check`, `npm run photos:build -- --check`, `npm run terrain:build -- --check`)
- **After every plan wave:** `npm run lint` (includes `guard:selftest`, `data:check`, `guard:images`, `guard:tests:scan`) + `npm test`
- **Before `/gsd-verify-work`:** full suite green; a `ci/16-*` push with every CI job green, including Visual Regression with no update; `check-snapshot-commit --none` over the phase commits; Matterhorn hashes equal Phase 15 D-15's; client-JS measurement recorded against the phase base
- **Max feedback latency:** ~60 s for the per-task loop

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-T2 | 16-01 | 1 | DATA-14 | T-16-01 | A record with no `precision` (or `kind`) fails, naming the file and the fix | unit (schema) | `npx jest data/__tests__/photo-map.test.ts` | ✅ extend | ✅ green |
| 16-01-T1, 16-01-T2 | 16-01 | 1 | DATA-14 | T-16-01, T-16-02, T-16-03 | 3dp/2dp rounded before the write; no `altM` for coarse or aerial; ground height rounded to 10/50 m; DJI `Make` without `aerial` fails; no position in error text | guard selftest (synthetic JPEGs, `--root`; the seven `privacy:` cases) | `npm run guard:selftest` | ✅ 8 `privacy:` cases (16-01, 16-10) | ✅ green |
| 16-06-T1 | 16-06 | 3 | DATA-14 | T-16-12 | Coarse position → `approximate` + reason + radius; coordinates printed at their own precision; the four current strings unchanged | unit | `npx jest lib/__tests__/home-format.test.ts components/photos/__tests__/strip.test.tsx lib/__tests__/photos-view-model.test.ts` | ✅ extend | ✅ green |
| 16-06-T2 | 16-06 | 3 | DATA-14 | T-16-12 | Dashed dot for a synthetic coarse photo; aerial heights read as ground; every Home waypoint is a ground photo | unit (render) | `npx jest lib/__tests__/photos-view-model.test.ts lib/__tests__/ascent-waypoints.test.ts components/photos/__tests__/map.test.tsx data/__tests__/home.test.ts components/home` | ✅ extend | ✅ green |
| 16-14-T1, 16-14-T2, 16-17-T3 | 16-14, 16-17 | 8, 11 | DATA-13 | T-16-31, T-16-41 | Sidecar, derivatives and photo data fresh | generator checks | `npm run photos:exif -- --check && npm run photos:derive -- --check && npm run photos:build -- --check` | ✅ | ✅ green |
| 16-14-T1, 16-14-T2, 16-17-T3 | 16-14, 16-17 | 8, 11 | DATA-13 | T-16-33 | No metadata in served images | guard | `npm run guard:images` | ✅ | ✅ green |
| 16-03-T1, 16-03-T2, 16-14-T3 | 16-03, 16-14 | 2, 8 | DATA-13 | T-16-07, T-16-08, T-16-34 | Light table, routes, sitemap, catalog and audit set stay at the current four (D-15) | unit | `npx jest lib/__tests__/region-series.test.ts lib/__tests__/photo-routes.test.ts lib/__tests__/photos-view-model.test.ts lib/__tests__/audit-routes.test.ts lib/__tests__/saved-pages.test.ts` | ✅ rewrite in place | ✅ green |
| 16-04-T3 | 16-04 | 2 | DATA-13 | — | Each region has ≥ 1 photo; each EPSG:2056 photo's uv matches its plate (IN-07; EPSG:3035 photos are bounded by `photos:build` and the 16-10 selftest case) | unit | `npx jest data/__tests__/photo-map.test.ts` | ✅ | ✅ green |
| 16-05-T2, 16-07-T3, 16-15-T3 | 16-05, 16-07, 16-15 | 2, 3, 9 | DATA-13, DATA-12 | T-16-11, T-16-13, T-16-36 | The footer's client graph (from `app/global-error.tsx`) imports no full photo set, image manifest, plate registry or overview module | unit (source walk) | `npx jest lib/__tests__/client-graph.test.ts` | ✅ created (16-05; extended 16-07, 16-15) | ✅ green |
| 16-10-T2, 16-12-T1, 16-12-T2, 16-16-T2, 16-16-T3 | 16-10, 16-12, 16-16 | 5, 7, 10 | DATA-13 | T-16-20, T-16-27, T-16-40 | New plates deterministic; Matterhorn hashes equal D-15; per-plate budgets | generator + unit | `npm run terrain:build -- --check && npx jest data/__tests__/plates.test.ts data/__tests__/terrain.test.ts` | ✅ | ✅ green |
| 16-10-T1, 16-10-T3 | 16-10 | 5 | DATA-13 | T-16-20 | Synthetic EPSG:3035 fixture plate builds with its prefix; Matterhorn bytes unchanged; a photo on it gets uv and height through proj4 | guard selftest (`--root`) | `npm run guard:selftest` | ✅ `terrain:` EPSG:3035 fixture + `privacy:` proj4 photo case (16-10) | ✅ green |
| 16-09-T2, 16-09-T3 | 16-09 | 4 | DATA-13 | T-16-19 | `lib/geo.ts` vs proj4 ≤ 1 m over the Ortler plate; proj4 EPSG:3035 centre and round trip (the two `geo:` selftest cases: ESLint bans proj4 outside `scripts/**/*.mjs`, so no Jest test can import it) | guard selftest | `npm run guard:selftest` | ✅ 2 `geo:` cases (16-09) | ✅ green |
| 16-13-T2, 16-15-T1, 16-15-T2, 16-15-T3 | 16-13, 16-15 | 7, 9 | DATA-12 | T-16-30, T-16-35 | Overview contours within the spike budget; 3–5 summits; one outline per region; verbatim notice stored | unit | `npx jest data/__tests__/overview.test.ts` | ✅ created (16-13; extended 16-15) | ✅ green |
| 16-15-T1 | 16-15 | 9 | DATA-12 | T-16-37 | Overview deterministic offline and kept by the stale-file sweep | generator | `npm run terrain:build -- --check` | ✅ extend | ✅ green |
| 16-01-T1 (base); 16-05-T2, 16-07-T3, 16-12-T2, 16-14-T3, 16-15-T3, 16-16-T3, 16-17-T3, 16-18-T2 | all | 1–12 | all | T-16-11, T-16-13 | Client JS ≤ phase base + 4,096 B | build measurement | `npm run build` then sum `.next/static/chunks/**/*.js` (15-01 method); `git restore public/service-worker.js` | scripted | ✅ green |
| every task | all | 1–12 | all | — | Type-check passes on all three configs | tooling | `npm run type-check` | ✅ | ✅ green |
| every plan | all | 1–12 | all | — | No focus/skip | guard | `npm run guard:tests:scan` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

The plans create each of these inside the plan that first needs it, not in a separate wave 0:

- [x] proj4 vs `lib/geo.ts` over the Ortler plate (≤ 1 m) and the EPSG:3035 centre and round trip: the selftest cases `geo: lib/geo.ts agrees with proj4 within 1 m over the Ortler plate` and `geo: EPSG:3035 maps its centre to its false origin and round-trips the Saalfelden corners` (16-09 Tasks 2 and 3). Research proposed `lib/__tests__/geo-proj.test.ts`; the plans moved the check into the guard selftest because ESLint keeps proj4 to `scripts/**/*.mjs` (the 15-05 sharp-fixture precedent), and the selftest runs in `npm run lint`, so it still gates every commit
- [x] `data/__tests__/overview.test.ts` — source, notice and config (16-13 Task 2), then budget, outlines, summits and isolation (16-15)
- [x] Guard selftest cases — synthetic coarse, aerial and DJI-make JPEG extraction cases (16-01, generated JPEGs only, Phase 15 D-23); synthetic EPSG:3035 fixture plate and photo cases (16-10)
- [x] `lib/__tests__/client-graph.test.ts` — the global-error client-graph walk (16-05, extended by 16-07 and 16-15)
- [x] Client-JS base measurement at phase start (16-01 Task 1, Step 0, 15-01 method)
- [x] Install `proj4@2.22.0` (exact) with a `wkt-parser` `overrides` pin, through the bundled npm, after Tim's legitimacy checkpoint (16-09 Tasks 1 and 2; memory: global npm 11.6.1 rewrites lockfile metadata)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No photo coordinate in a committed planning file (D-12, D-25) | DATA-14 | The check needs the true positions, which exist only in the gitignored originals | The D-25 scan defined once in 16-01 Task 2 and run as the last step before the SUMMARY commit of every plan that reads originals or records Tim's replies (16-01, 16-02, 16-08, 16-09, 16-11, 16-14, 16-16, 16-17, 16-18): a scratch script outside the repo reads each original's GPS → 2/3/4dp strings (WGS84, LV95, and EPSG:3035 from 16-09 on, once `toGrid` has it) and GPS altitude → `git grep --untracked -F` over `.planning/`; print booleans only; never commit the script or its output. Known pre-existing match: the D-01 format example in 16-CONTEXT.md (copied into 16-RESEARCH.md) equals one current photo's 4dp latitude, which is already public in `data/generated/photos.ts`. It is not a new exposure |
| Per-photo precision and kind chosen before the first new sidecar commit (D-02) | DATA-14 | Tim's decision | `checkpoint:decision` before the first commit that writes a new sidecar entry: 16-08 Task 2 (the five non-Ortler photos) and 16-17 Task 2 (the Ortler photos) |
| BEV credit wording (D-09); height system recorded as decided (D-29) | DATA-13 | No preferred wording is published by BEV; the source declares EPSG:9274 | `checkpoint:decision` at 16-11 Task 2 before the credit is fixed; the record stores `heightSystem: 'EVRF2000-AT'` with `heightSystemEpsg: 'EPSG:9274'` (16-10 schema, 16-11 fetcher) |
| No visual change (D-25) | all | CI only | Push `ci/16-*`: Visual Regression passes without updates; `check-snapshot-commit --none` passes |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-11-23 (/gsd-validate-phase 16, State A audit: 0 gaps; every automated command re-run green on HEAD b8329f3)

## Validation Audit 2026-11-23

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Rows re-run green | 17 |
| Manual-only kept | 4 |

Evidence (re-run on HEAD `b8329f3`, 2026-11-23):
- **Jest:** the 16 map files plus `components/home`, 22 suites and 407 tests passed.
- **Selftest:** `guard:selftest` 290/290. It includes 8 `privacy:` cases, 2 `geo:` cases, the EPSG:3035 fixture plate and the overview cases.
- **Generator checks:** `photos:exif`, `photos:derive`, `photos:build` and `terrain:build` with `--check` all printed OK.
- **Guards and type-check:** `guard:images` (served-images) OK, `guard:tests:scan` OK, and `type-check` exited 0 on all three configs.
- **Client-JS row:** this row takes 16-18's measurement of 1,851,685 B (+113 B, cap 1,855,668 B). `git diff e96f266 HEAD` outside `.planning/` is empty, so no rebuild was needed.
- **Manual-only rows:** the D-25 scan ran in every listed plan, and the 16-18 final run matched run 1. The D-02, D-09 and D-29 decisions are recorded in 16-08, 16-11 and 16-17. The CI visual row is `ci/16-18` run 45188005124: Visual Regression PASS with no baseline update.
