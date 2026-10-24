---
phase: "08"
slug: "data-terrain-pipeline"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-24"
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 (next/jest, jsdom) + Playwright 1.64 + node guard scripts with `scripts/guards/selftest.mjs` |
| **Config file** | `jest.config.js`, `playwright.config.ts`, `scripts/guards/selftest.mjs` |
| **Quick run command** | `npx jest lib data components/site --silent` |
| **Full suite command** | `npm run lint && npm run type-check && npm test && npx playwright test --project=chromium` |
| **Estimated runtime** | ~120 seconds (quick run ~20 seconds) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest lib data components/site --silent` plus the relevant `--check` script
- **After every plan wave:** Run `npm run lint && npm run type-check && npm test`
- **Before `/gsd-verify-work`:** Full suite must be green, plus a CI run green on the phase branch (Visual Regression, Lint and Type Check, Unit Tests, E2E); test-count ratchet ≥ 206 and rising
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

Seeded from `08-RESEARCH.md` § Validation Architecture; statuses audited by validate-phase on 2026-10-24 after all 13 plans completed.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-T1 | 08-01 | 1 | DATA-01 | — | N/A | unit | `npx jest lib/__tests__/geo.test.ts` | ✅ | ✅ green |
| 08-01-T2 | 08-01 | 1 | DATA-01 | T-08-02 | Serializer emits only svg/g/path | unit | `npx jest lib/__tests__/contour-paths.test.ts lib/__tests__/hillshade.test.ts lib/__tests__/dem-sample.test.ts` | ✅ | ✅ green |
| 08-01-T3 | 08-01 | 1 | DATA-01 | T-08-01 | Generator libs banned outside scripts/ | guard + selftest | `node scripts/guards/selftest.mjs` | ✅ | ✅ green |
| 08-02-T1/T2 | 08-02 | 1 | DATA-02, DATA-06 | T-08-04 | GPS ≤ 4 decimals in the sidecar | guard + unit | `npm run photos:exif -- --check && npx jest data/__tests__/exif-sidecar.test.ts` | ✅ | ✅ green |
| 08-03-T1/T3 | 08-03 | 1 | DATA-07 | T-08-07 | riskScore required, from Tim | unit | `npx jest data/__tests__/projects.test.ts lib/__tests__/trail-grade.test.ts` | ✅ | ✅ green |
| 08-04-T2/T3 | 08-04 | 2 | DATA-01 | T-08-11 | Generated SVG contains no script/handlers/href | guard | `npm run terrain:build -- --check` | ✅ | ✅ green |
| 08-04-T3 | 08-04 | 2 | DATA-01 | T-08-12 | terrain.ts client-safe | unit | `npx jest data/__tests__/terrain.test.ts` | ✅ | ✅ green |
| 08-05-T3 | 08-05 | 2 | DSGN-06 | T-08-13 | Codemod is pixel-neutral | visual (CI) | `node scripts/ci/check-visual-run.mjs --sha "$(git rev-parse HEAD)" --wait 30` | ✅ | ✅ green |
| 08-06-T1 | 08-06 | 3 | SHELL-04, DATA-01 | T-08-15 | Immutable only for hashed /terrain/ | unit + build | `npx jest data/__tests__/precache.test.ts` | ✅ | ✅ green |
| 08-07-T1/T2 | 08-07 | 3 | DATA-05, DATA-08 | T-08-18 | Derivatives metadata-free, ≤ 2560 px | guard + unit | `npm run photos:derive -- --check && npx jest data/__tests__/image-manifest.test.ts` | ✅ | ✅ green |
| 08-08-T1 | 08-08 | 4 | DATA-02 | T-08-24 | Stale photo data fails CI | guard | `npm run photos:build -- --check` | ✅ | ✅ green |
| 08-08-T2 | 08-08 | 4 | DATA-02, DATA-03, DATA-04, DATA-06 | T-08-22 | GPS ≤ 4 decimals in generated data | unit | `npx jest data/__tests__/photos.test.ts lib/__tests__/photo-format.test.ts` | ✅ | ✅ green |
| 08-09-T1/T2 | 08-09 | 5 | DATA-05 | T-08-25 | No tracked image carries EXIF/XMP/IPTC; served ≤ 2560 px | guard + selftest | `node scripts/guards/check-served-images.mjs && npm run guard:selftest` | ✅ | ✅ green |
| 08-09-T2 | 08-09 | 5 | DATA-05 | T-08-27 | Full-res URLs 404; `/terrain/*` immutable Cache-Control | e2e (prod) | `PW_PROD=1 npx playwright test e2e/data-privacy.spec.ts --project=chromium` | ✅ | ✅ green |
| 08-10-T1/T2 | 08-10 | 6 | DATA-03, DATA-08 | T-08-30 | Sourced facts; no image literals in the bridge | unit + component | `npx jest data/__tests__/editorial.test.ts components/__tests__/ImageDetailModal.test.tsx` | ✅ | ✅ green |
| 08-11-T2 | 08-11 | 7 | DATA-03 | T-08-32 | photos/* re-baseline only | visual (CI) | `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some --allow photos` | ✅ | ✅ green |
| 08-12-T1 | 08-12 | 8 | DATA-04, SHELL-04 | — | Dashed tick from position.approximate | component | `npx jest components/site/__tests__/SiteFooter.test.tsx` | ✅ | ✅ green |
| 08-12-T2 | 08-12 | 8 | SHELL-04 | T-08-34 | Attribution constant required | unit | `npx jest lib/__tests__/footer-format.test.ts` | ✅ | ✅ green |
| 08-12-T3 | 08-12 | 8 | SHELL-04 | — | N/A | e2e | `npx playwright test e2e/shell.spec.ts --project=chromium` | ✅ | ✅ green |
| 08-13-T1 | 08-13 | 9 | SHELL-04 | T-08-37 | Footer re-baseline only, deterministic | visual (CI container) | `gh workflow run visual-baselines.yml --ref ci/08-13 -f suite=visual -f update_mode=changed` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `lib/__tests__/geo.test.ts`, `contour-paths.test.ts`, `hillshade.test.ts`, `trail-grade.test.ts`, `footer-format.test.ts`, `photo-format.test.ts`
- [x] `data/__tests__/photos.test.ts`, `projects.test.ts`, `terrain.test.ts`, `image-manifest.test.ts`
- [x] `components/site/__tests__/SiteFooter.test.tsx` (new; `SiteChrome.test.tsx` stays unchanged)
- [x] `scripts/guards/__selftest__/served-images/` fixtures: JPEG with EXIF GPS, XMP-only, oversize file, bad hash name
- [x] `e2e/data-privacy.spec.ts` (404 for old full-res URLs, Cache-Control on `/terrain`)
- [x] npm scripts: `terrain:fetch`, `terrain:build`, `photos:exif`, `photos:build`, `photos:derive`, `data:check` (wired into `lint`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Photo copy, slugs, tags and the Riffelsee pin read correctly | DATA-03 | Editorial judgement by Tim | Checkpoint: Tim reviews the generated `photos.ts` copy diff and approves |
| riskScores and band boundaries | DATA-07 | Values come from Tim | Checkpoint: Tim supplies scores; unit test then enforces band membership |
| Attribution option (A full / B Swiss+Italian) | SHELL-04 | Licensing choice | Checkpoint: Tim confirms; constant is then asserted by e2e |
| Full-res stays unreachable on the preview deploy | DATA-05 | Needs a Vercel preview URL | Request each old full-res URL on the preview; expect 404 |
| Footer band reads as 1 px strokes in Firefox | SHELL-04 | Cross-browser rendering judgement | Local prod build in Firefox; compare contour stroke weight with Chromium (08-13 Task 1 step 6) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-24 (validate-phase audit: 20/20 rows COVERED, 0 gaps)

## Validation Audit 2026-10-24

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
