---
phase: "15"
slug: "region-plate-data-model"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-14"
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `15-RESEARCH.md` § Validation Architecture. Task IDs are filled in by the planner; rows are keyed by requirement until then.

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
| TBD | TBD | TBD | GUARD-10 | — | N/A | tooling | `npm run type-check` (three configs, zero errors) | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GUARD-10 | — | N/A | tooling | `npx tsc -p tsconfig.e2e.json --listFilesOnly \| grep -c "/e2e/"` (≥ 36) | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GUARD-10 | — | globals typed, not `any` (canary `@ts-expect-error`) | unit (type) | `npx tsc -p tsconfig.jest.json` (TS2578 if the canary goes unused) | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GUARD-10 / D-27 | — | N/A | guard selftest | `npm run guard:selftest` (new test-count `--scan-only` cases); `npm run guard:tests:scan` | ❌ new cases | ⬜ pending |
| TBD | TBD | TBD | DATA-09 | — | N/A | unit | `npx jest lib/__tests__/home-waypoints.test.tsx` (extra photo leaves ascent, 1,617 m, footer ticks, trail sign unchanged) | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | DATA-09 | — | N/A | unit | `npx jest data/__tests__/home.test.ts` (D-07 strict list) | ❌ | ⬜ pending |
| TBD | TBD | TBD | DATA-09 | — | N/A | e2e | `PW_PROD=1 npx playwright test e2e/home-ascent.spec.ts e2e/shell.spec.ts --project=chromium --project=firefox --reporter=line` | ✅ (edit consumers) | ⬜ pending |
| TBD | TBD | TBD | DATA-10 | — | strict Zod parse, closed country enum (V5) | unit + generator | `npx jest data/__tests__/photo-map.test.ts` ; `npm run photos:build -- --check` | ❌ / ✅ | ⬜ pending |
| TBD | TBD | TBD | DATA-10 | — | N/A | guard selftest (G5) | `npm run guard:selftest` (stale/missing map or region fails) | ❌ new G5 cases | ⬜ pending |
| TBD | TBD | TBD | DATA-10 | — | N/A | guard selftest | `npm run guard:selftest` (`extract-exif --root`: unmapped original / duplicate file fails) | ❌ | ⬜ pending |
| TBD | TBD | TBD | DATA-10 | — | sidecar schema closed (rejects serial / XMP keys) | unit | `npx jest data/__tests__/exif-sidecar.test.ts` | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | DATA-11 | — | N/A | unit | `npx jest data/__tests__/terrain.test.ts` (D-15 names pinned literally) | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | DATA-11 | — | N/A | generator | `npm run terrain:build -- --check` | ✅ | ⬜ pending |
| TBD | TBD | TBD | DATA-11 | — | flat prefixed names only under `public/terrain/` (V12) | guard selftest | `npm run guard:selftest` (fixture plate: own prefixed 2D files, Matterhorn byte-equal, union sweep) | ❌ | ⬜ pending |
| TBD | TBD | TBD | DATA-11 | — | N/A | unit | `npx jest data/__tests__/plates.test.ts` (plates ↔ terrain agree; asset-root lists reconcile; per-plate budget) | ❌ | ⬜ pending |
| TBD | TBD | TBD | DATA-15 | — | GPS/telemetry never committed or served (V8) | guard selftest | `npm run guard:selftest` ; `npm run guard:images` (13 extensions, any case, repo + full `public/` walk, originals allowed) | ❌ new fixtures | ⬜ pending |
| TBD | TBD | TBD | DATA-15 | — | telemetry track inside MP4 rejected (V8) | guard selftest | `npm run guard:selftest` (djmd / dbgi / gpmd / subtitle track fixtures) | ❌ new fixtures | ⬜ pending |
| TBD | TBD | TBD | SC-5 | — | N/A | unit | `npx jest lib/__tests__/photo-routes.test.ts` (one helper; scan finds no hand-built path) | ❌ | ⬜ pending |
| TBD | TBD | TBD | SC-5 / D-32 | — | N/A | CI | push `ci/15-*` → Visual Regression green, no update; `node scripts/ci/check-snapshot-commit.mjs --sha <each phase commit> --none` (or `git diff --name-only d29ea9a...HEAD -- '*.png'` empty) | ✅ | ⬜ pending |
| TBD | TBD | TBD | D-28 14 IN-06 | — | N/A | e2e | `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox --reporter=line -g "LBOX-08"` | ✅ (add row) | ⬜ pending |
| TBD | TBD | TBD | D-28 14 IN-05 | — | N/A | e2e | `PW_PROD=1 npx playwright test e2e/case-study.spec.ts --project=chromium --project=firefox --reporter=line -g "ENG-06"` | ✅ | ⬜ pending |
| TBD | TBD | TBD | D-28 13 IN-02/03 | — | no `${{` in relay action `with:` inputs (V14) | guard selftest | `npm run guard:selftest` (`npm run guard:ci` on the real workflows stays OK) | ❌ new cases | ⬜ pending |
| TBD | TBD | TBD | All | — | N/A | generator | `npm run data:check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tsconfig.jest.json`, `tsconfig.e2e.json`, the Jest-globals d.ts (with canary), the `jest.config.js` `'\\.d\\.ts$'` ignore, and the `type-check` script — GUARD-10
- [ ] `--scan-only` in `scripts/guards/test-count.mjs` + `guard:tests:scan` in `lint` + selftest cases — D-27
- [ ] `build-terrain.mjs --root` and `extract-exif.mjs --root` — prerequisites for the fixture cases (DATA-10, DATA-11)
- [ ] `PHOTO_DATA_INPUTS` in `scripts/guards/selftest.mjs` extended with `photo-map.json`, `regions.json`, `plates.json` — keeps the G5 control case green

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| D-01 "an original has no record" / "two records name one file" against the real originals | DATA-10 | The originals (`assets/photos-original/`) are gitignored, so CI can't see them; the `--root` fixture cases cover the logic | Run `npm run photos:build` locally with the originals present; it must pass, and must fail after temporarily renaming one original |
| Zero visual diff | SC-5 / D-32 | Baselines come only from the CI Visual Regression job | Push `ci/15-*` (standing approval D-31); Visual Regression must pass with no update. On any diff: stop and ask Tim (no baseline dispatch is covered) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60 s (per-task loop)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
