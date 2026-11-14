---
phase: "15"
slug: "region-plate-data-model"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-14"
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `15-RESEARCH.md` § Validation Architecture. Task IDs filled in by the planner (2026-11-14): 16 plans, one per wave (revised after plan-check: GUARD-10 split into 15-01 to 15-03, DATA-11 into 15-04/15-05, DATA-10 into 15-06/15-07, DATA-09 into 15-08/15-09; the later plans renumbered 15-10 to 15-16).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.5.2 (jsdom, next/jest SWC), Playwright 1.65.0, guard selftest (`node scripts/guards/selftest.mjs`) |
| **Config file** | `jest.config.js`, `playwright.config.ts`; new `tsconfig.jest.json` / `tsconfig.e2e.json` (Wave 0) |
| **Quick run command** | `npx jest <touched test paths>` |
| **Full suite command** | `npm run lint && npm run type-check && npm test` |
| **Estimated runtime** | ~34 s selftest (+1.5–2 s per new fixture-plate case); Jest full suite several minutes; PW_PROD e2e adds a prod build |

`PW_PROD=1` without `PW_REUSE=1` runs `npm run build && npm run start` (playwright.config.ts:175-178). Its postbuild rewrites tracked `public/service-worker.js` — run `git restore public/service-worker.js` afterwards. For repeated runs: `npm run build`, `npm run start &`, then `PW_PROD=1 PW_REUSE=1 …`, and stop the orphan `next start` afterwards.

---

## Sampling Rate

- **After every task commit:** `npx jest <touched test paths>` + `npm run type-check` (once GUARD-10 lands) + the generator `--check` the task touched (`npm run photos:build -- --check`, `npm run terrain:build -- --check`)
- **After every plan wave:** `npm run lint` (includes `guard:selftest`, `data:check`, `guard:images`, and after D-27 `guard:tests:scan`) + `npm test`
- **Before `/gsd-verify-work`:** full suite green; a `ci/15-*` push with every CI job green including Visual Regression (no update); `check-snapshot-commit --none` over the phase commits; D-15 pin test green
- **Max feedback latency:** ~60 s for the per-task loop (Jest paths + type-check + one `--check`)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-T1, 15-03-T3 | 15-01, 15-03 | 1, 3 | GUARD-10 | T-15-02 | N/A | tooling | `npm run type-check` (three configs, zero errors) | ✅ | ✅ green |
| 15-01-T1 | 15-01 | 1 | GUARD-10 | T-15-02 | N/A | tooling | `npx tsc -p tsconfig.e2e.json --listFilesOnly \| grep -c "/e2e/"` (≥ 36) | ✅ | ✅ green |
| 15-01-T1 | 15-01 | 1 | GUARD-10 | T-15-02 | globals typed, not `any` (canary `@ts-expect-error`) | unit (type) | `npx tsc -p tsconfig.jest.json` (TS2578 if the canary goes unused) | ✅ | ✅ green |
| 15-01-T2, 15-02-T1, 15-02-T2, 15-03-T2 | 15-01 to 15-03 | 1 to 3 | GUARD-10 | T-15-32, T-15-04 | N/A | unit (type) | `npx tsc -p tsconfig.jest.json 2>&1 \| grep -c "error TS"` (99 → 49 → 38 → 9 → 4 → 0) | ✅ | ✅ green |
| 15-03-T1 | 15-03 | 3 | GUARD-10 / D-27 | T-15-03 | N/A | guard selftest | `npm run guard:selftest` (new test-count `--scan-only` cases, incl. the `.fixme(` fixture case added by the Nyquist audit, eb22455); `npm run guard:tests:scan` | ✅ | ✅ green |
| 15-01-T1, 15-11-T1, 15-11-T2, 15-16-T2 | 15-01, 15-11, 15-16 | 1, 11, 16 | SC-5 / D-32 (client JS budget) | T-15-15 | N/A | build measurement | fresh `npm run build`, sum of `.next/static/chunks/**/*.js` bytes; 15-01 records the phase base, 15-11 and 15-16 must be at most 4,096 B above it | ✅ | ✅ green |
| 15-04-T1 | 15-04 | 4 | DATA-11 | — | N/A | unit | `npx jest data/__tests__/terrain.test.ts` (D-15 names pinned literally) | ✅ | ✅ green |
| 15-04-T1, 15-05-T1 | 15-04, 15-05 | 4, 5 | DATA-11 | — | N/A | generator | `npm run terrain:build -- --check`; write mode leaves `public/terrain/` and `data/generated/` unchanged | ✅ | ✅ green |
| 15-04-T2 | 15-04 | 4 | DATA-11 | T-15-05, T-15-06 | N/A | unit | `npx jest data/__tests__/plates.test.ts` (registry refines; plates ↔ terrain agree; asset-root lists reconcile; per-plate budget) | ✅ | ✅ green |
| 15-05-T1, 15-05-T2 | 15-05 | 5 | DATA-11 | T-15-33 | flat prefixed names only under `public/terrain/` (V12) | guard selftest | `npm run guard:selftest` (fixture plate: own prefixed 2D files, Matterhorn byte-equal; `--check` sees a missing prefixed file; removing a plate sweeps only its files) | ✅ | ✅ green |
| 15-06-T1, 15-06-T2 | 15-06 | 6 | DATA-10 | T-15-08 | strict Zod parse, closed country enum (V5) | unit + generator | `npx jest data/__tests__/photo-map.test.ts` ; `npm run photos:build -- --check` | ✅ | ✅ green |
| 15-06-T2 | 15-06 | 6 | DATA-10 | T-15-08 | N/A | guard selftest (G5) | `npm run guard:selftest` (stale/missing/duplicate map or region fails, each on its own rule) | ✅ | ✅ green |
| 15-06-T2 | 15-06 | 6 | DATA-10 | T-15-09 | sidecar schema closed (rejects serial / XMP keys) | unit | `npx jest data/__tests__/exif-sidecar.test.ts` | ✅ | ✅ green |
| 15-07-T1, 15-07-T2 | 15-07 | 7 | DATA-10 | T-15-10, T-15-34 | N/A | generator + guard selftest | `npm run photos:exif -- --check`; `npm run guard:selftest` (`extract-exif --root`: DJI-named original mapped; unmapped original / duplicate file fails) | ✅ | ✅ green |
| 15-08-T1 | 15-08 | 8 | DATA-09 | T-15-11 | N/A | unit | `npx jest lib/__tests__/home-waypoints.test.tsx` (extra photo leaves ascent, 1,617 m, footer ticks, trail sign unchanged) | ✅ | ✅ green |
| 15-08-T2 | 15-08 | 8 | DATA-09 | T-15-11 | N/A | unit | `npx jest data/__tests__/home.test.ts` (D-07 strict list) | ✅ | ✅ green |
| 15-09-T1 | 15-09 | 9 | DATA-09 | T-15-35 | N/A | repo grep + generator | `git grep -n "lowestDemM" -- . ':!.planning'; test $? -eq 1`; `npm run photos:build -- --check` | ✅ | ✅ green |
| 15-09-T2 | 15-09 | 9 | DATA-09 | T-15-35 | N/A | e2e | `PW_PROD=1 npx playwright test e2e/home-ascent.spec.ts e2e/homepage.spec.ts e2e/shell.spec.ts e2e/home-canvas.spec.ts --project=chromium --project=firefox --reporter=line` | ✅ | ✅ green |
| 15-10-T1, 15-10-T3 | 15-10 | 10 | SC-5 | T-15-13, T-15-14 | N/A | unit | `npx jest lib/__tests__/photo-routes.test.ts` (one helper; scan finds no hand-built path) | ✅ | ✅ green |
| 15-11-T1, 15-11-T2 | 15-11 | 11 | DATA-11 / SC-5 | T-15-15 | N/A | unit | `npx jest components/terrain/__tests__/ContourField.test.tsx components/site/__tests__/SiteFooter.test.tsx` (mask URLs unchanged; D-21 static-source rules cover SheetBand and SheetLegend); footer markup byte-identical before and after | ✅ | ✅ green |
| 15-11-T3 | 15-11 | 11 | DATA-10 | T-15-16 | N/A | unit + e2e | `npx jest lib/__tests__/region-series.test.ts lib/__tests__/photos-view-model.test.ts`; `PW_PROD=1 npx playwright test e2e/photos.spec.ts e2e/photos-sweep.spec.ts e2e/photos-carousel.spec.ts --project=chromium --reporter=line` | ✅ | ✅ green |
| 15-12-T1, 15-12-T2 | 15-12 | 12 | DATA-15 | T-15-17, T-15-19, T-15-20 | GPS/telemetry never committed or served (V8) | guard selftest | `npm run guard:selftest` ; `npm run guard:images` (13 extensions, any case, repo + full `public/` walk, originals allowed) | ✅ | ✅ green |
| 15-12-T3 | 15-12 | 12 | DATA-15 | T-15-18 | telemetry track inside MP4 rejected (V8) | guard selftest | `npm run guard:selftest` (djmd / dbgi / gpmd / subtitle / text track clips spliced from `good-mp4` at run time, plus a determinism case; no MP4 committed) | ✅ | ✅ green |
| 15-13-T1, 15-13-T2 | 15-13 | 13 | D-28 13 IN-02/03 | T-15-21, T-15-22 | no `${{` in relay action `with:` inputs (V14) | guard selftest | `npm run guard:selftest` (`npm run guard:ci` on the real workflows stays OK) | ✅ | ✅ green |
| 15-14-T3 | 15-14 | 14 | D-28 14 IN-06 | — | N/A | e2e | `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox --reporter=line -g "LBOX-08"` | ✅ | ✅ green |
| 15-14-T3 | 15-14 | 14 | D-28 14 IN-05 | — | N/A | e2e | `PW_PROD=1 npx playwright test e2e/case-study.spec.ts --project=chromium --project=firefox --reporter=line -g "ENG-06"` | ✅ | ✅ green |
| 15-15-T1, 15-15-T2, 15-15-T3 | 15-15 | 15 | DATA-10 (groundwork) | T-15-26, T-15-27 | N/A | unit + e2e | `npx jest lib/__tests__/photos-view-model.test.ts lib/og/__tests__/template.test.tsx lib/__tests__/saved-pages.test.ts components/site/__tests__/SavedPages.test.tsx components/photos/__tests__/map.test.tsx`; the photo e2e specs (carousel and lightbox in Chromium and Firefox) | ✅ | ✅ green |
| 15-16-T2, 15-16-T3 | 15-16 | 16 | SC-5 / D-32 | T-15-30 | N/A | CI | push `ci/15-16` → Visual Regression green, no update; `node scripts/ci/check-snapshot-commit.mjs --sha <each phase commit> --none`; `git diff --exit-code --name-only d29ea9a..HEAD -- '*.png'` exits 0 | ✅ | ✅ green |
| 15-16-T2 (and every plan touching a generator) | 15-16 | 16 | All | — | N/A | generator | `npm run data:check` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tsconfig.jest.json`, `tsconfig.e2e.json`, the Jest-globals d.ts (with canary), the `jest.config.js` `'\\.d\\.ts$'` ignore, and the `type-check` script — GUARD-10
- [x] `--scan-only` in `scripts/guards/test-count.mjs` + `guard:tests:scan` in `lint` + selftest cases — D-27
- [x] `build-terrain.mjs --root` and `extract-exif.mjs --root` — prerequisites for the fixture cases (DATA-10, DATA-11)
- [x] `PHOTO_DATA_INPUTS` in `scripts/guards/selftest.mjs` extended with `photo-map.json`, `regions.json`, `plates.json` — keeps the G5 control case green

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| D-01 "an original has no record" / "two records name one file" against the real originals | DATA-10 | The originals (`assets/photos-original/`) are gitignored, so CI can't see them; the `--root` fixture cases cover the logic | Run `npm run photos:build` locally with the originals present; it must pass, and must fail after temporarily renaming one original |
| Zero visual diff | SC-5 / D-32 | Baselines come only from the CI Visual Regression job | Push `ci/15-*` (standing approval D-31); Visual Regression must pass with no update. On any diff: stop and ask Tim (no baseline dispatch is covered) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60 s (per-task loop)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-11-15 (validate-phase: all 30 map rows green at HEAD; 1 gap, the `.fixme(` selftest case, filled in eb22455)

## Validation Audit 2026-11-14

| Metric | Count |
|---|---|
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |
