---
phase: "16"
slug: "new-regions-alps-overview-data"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-22"
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `16-RESEARCH.md` § Validation Architecture. The planner fills in task IDs; until then, rows are keyed by requirement.

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

**Pre-ingest red gate (RESEARCH Pitfall 1):** `npm run photos:exif -- --check`, and with it local `data:check` and `npm run lint`, is red now: the seven new originals in `assets/photos-original/` have no `photo-map.json` records. Plans that run before the precision checkpoint (D-02) must say how they keep their gates meaningful, either by moving the new originals aside or by scoping the check. Records must not be committed before that checkpoint.

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
| TBD | TBD | TBD | DATA-14 | TBD | A record with no `precision` (or `kind`) fails, naming the file and the fix | unit (schema) | `npx jest data/__tests__/photo-map.test.ts` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | DATA-14 | TBD | 3dp/2dp rounded before the write; no `altM` for coarse or aerial; ground height rounded to 10/50 m; DJI `Make` without `aerial` fails | guard selftest (synthetic JPEGs, `--root`) | `npm run guard:selftest` | ❌ W0 new cases | ⬜ pending |
| TBD | TBD | TBD | DATA-14 | — | Coarse position → `approximate` + reason + radius; coordinates printed at their own precision; the four current strings unchanged | unit | `npx jest lib/__tests__/photos-view-model.test.ts lib/__tests__/home-format.test.ts` | ✅ / ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DATA-14 | — | Dashed pin and "approx." label for a synthetic coarse photo | unit (render) | `npx jest components/home/__tests__ components/photos/__tests__` | ✅ | ⬜ pending |
| TBD | TBD | TBD | DATA-13 | TBD | Sidecar, derivatives and photo data fresh | generator checks | `npm run photos:exif -- --check && npm run photos:derive -- --check && npm run photos:build -- --check` | ✅ | ⬜ pending |
| TBD | TBD | TBD | DATA-13 | TBD | No metadata in served images | guard | `npm run guard:images` | ✅ | ⬜ pending |
| TBD | TBD | TBD | DATA-13 | — | Light table, routes, sitemap, catalog and audit set stay at the current four (D-15) | unit | `npx jest lib/__tests__/region-series.test.ts lib/__tests__/photo-routes.test.ts lib/__tests__/photos-view-model.test.ts lib/__tests__/audit-routes.test.ts lib/__tests__/saved-pages.test.ts` | ✅ rewrite in place | ⬜ pending |
| TBD | TBD | TBD | DATA-13 | — | Each region has ≥ 1 photo; each photo's uv inside its plate (IN-07) | unit | `npx jest data/__tests__/photo-map.test.ts` | ✅ | ⬜ pending |
| TBD | TBD | TBD | DATA-13 | — | New plates deterministic; Matterhorn hashes equal D-15; per-plate budgets | generator + unit | `npm run terrain:build -- --check && npx jest data/__tests__/plates.test.ts data/__tests__/terrain.test.ts` | ✅ | ⬜ pending |
| TBD | TBD | TBD | DATA-13 | — | Synthetic EPSG:3035 fixture plate builds with its prefix; Matterhorn bytes unchanged | guard selftest (`--root`) | `npm run guard:selftest` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DATA-13 | — | `lib/geo.ts` vs proj4 ≤ 1 m over the Ortler plate; proj4 EPSG:3035 round trip | unit | `npx jest lib/__tests__/geo-proj.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DATA-12 | — | Overview contours within the spike budget; 3–5 summits; one outline per plate; verbatim notice stored | unit | `npx jest data/__tests__/overview.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DATA-12 | — | Overview deterministic offline | generator | `npm run terrain:build -- --check` | ✅ extend | ⬜ pending |
| TBD | TBD | TBD | all | — | Client JS ≤ phase base + 4,096 B | build measurement | `npm run build` then sum `.next/static/chunks/**/*.js` (15-01 method); `git restore public/service-worker.js` | scripted | ⬜ pending |
| TBD | TBD | TBD | all | — | Type-check passes on all three configs | tooling | `npm run type-check` | ✅ | ⬜ pending |
| TBD | TBD | TBD | all | — | No focus/skip | guard | `npm run guard:tests:scan` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/__tests__/geo-proj.test.ts` — proj4 vs `lib/geo.ts` at the Ortler plate corners and summit (≤ 1 m), EPSG:3035 round trip
- [ ] `data/__tests__/overview.test.ts` — budget, summit count, outlines, notice text
- [ ] Guard selftest cases — synthetic EPSG:3035 fixture plate; synthetic coarse, aerial and DJI-make JPEG extraction cases (generated JPEGs only, Phase 15 D-23)
- [ ] Client-JS base measurement at phase start (15-01 method)
- [ ] Install `proj4@2.22.0` (exact) with a `wkt-parser` `overrides` pin, through the bundled npm (memory: global npm 11.6.1 rewrites lockfile metadata)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No photo coordinate in a committed planning file (D-12, D-25) | DATA-14 | The check needs the true positions, which exist only in the gitignored originals | Scratch script outside the repo: read each original's GPS → 2/3/4dp strings (WGS84, LV95, EPSG:3035) and GPS altitude → `git grep -F` over `.planning/`; print booleans only; never commit the script or its output. Known pre-existing match: the D-01 format example in 16-CONTEXT.md (copied into 16-RESEARCH.md) equals one current photo's 4dp latitude, which is already public in `data/generated/photos.ts`. It is not a new exposure |
| Per-photo precision and kind chosen before the first new sidecar commit (D-02) | DATA-14 | Tim's decision | `checkpoint:decision` in the plan, before the first commit that writes a new sidecar entry |
| BEV credit wording and height-system label (D-09) | DATA-13 | No preferred wording is published by BEV; the source declares EPSG:9274 | `checkpoint:decision` before the credit and the plate record are fixed |
| No visual change (D-25) | all | CI only | Push `ci/16-*`: Visual Regression passes without updates; `check-snapshot-commit --none` passes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
