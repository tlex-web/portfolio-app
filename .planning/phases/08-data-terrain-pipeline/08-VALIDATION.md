---
phase: "08"
slug: "data-terrain-pipeline"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
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

Seeded from `08-RESEARCH.md` § Validation Architecture. Task IDs are filled in once plans exist.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | A | DATA-01 | — | N/A | unit | `npx jest lib/__tests__/geo.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | A | DATA-01 | — | N/A | unit | `npx jest lib/__tests__/contour-paths.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | B | DATA-01 | — | Generated SVG contains no script/handlers/href | guard | `node scripts/terrain/build-terrain.mjs --check` | ❌ W0 | ⬜ pending |
| TBD | TBD | B | DATA-01 | — | N/A | unit | `npx jest data/__tests__/terrain.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | C | DATA-02 | — | N/A | guard | `node scripts/photos/build-photo-data.mjs --check` | ❌ W0 | ⬜ pending |
| TBD | TBD | C | DATA-02, DATA-03, DATA-06 | — | GPS ≤ 4 decimals in generated data | unit | `npx jest data/__tests__/photos.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | C | DATA-04 | — | N/A | unit + component | `npx jest components/site/__tests__/SiteFooter.test.tsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | B | DATA-05 | — | No tracked image carries EXIF/XMP/IPTC; served ≤ 2560 px | guard + selftest | `node scripts/guards/check-served-images.mjs && npm run guard:selftest` | ❌ W0 | ⬜ pending |
| TBD | TBD | B | DATA-05 | — | Full-res URLs 404; `/terrain/*` immutable Cache-Control | e2e (prod) | `PW_PROD=1 npx playwright test e2e/data-privacy.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| TBD | TBD | C | DATA-07 | — | N/A | unit | `npx jest data/__tests__/projects.test.ts lib/__tests__/trail-grade.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | B | DATA-08 | — | N/A | unit | `npx jest data/__tests__/image-manifest.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | A | SHELL-04 | — | N/A | unit | `npx jest lib/__tests__/footer-format.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | D | SHELL-04 | — | N/A | e2e | `npx playwright test e2e/shell.spec.ts --project=chromium` | ✅ extend | ⬜ pending |
| TBD | TBD | D | SHELL-04 | — | N/A | visual (CI container) | `gh workflow run visual-baselines.yml --ref ci/08-NN -f suite=visual -f update_mode=changed` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/__tests__/geo.test.ts`, `contour-paths.test.ts`, `hillshade.test.ts`, `trail-grade.test.ts`, `footer-format.test.ts`, `photo-format.test.ts`
- [ ] `data/__tests__/photos.test.ts`, `projects.test.ts`, `terrain.test.ts`, `image-manifest.test.ts`
- [ ] `components/site/__tests__/SiteFooter.test.tsx` (new; `SiteChrome.test.tsx` stays unchanged)
- [ ] `scripts/guards/__selftest__/served-images/` fixtures: JPEG with EXIF GPS, XMP-only, oversize file, bad hash name
- [ ] `e2e/data-privacy.spec.ts` (404 for old full-res URLs, Cache-Control on `/terrain`)
- [ ] npm scripts: `terrain:fetch`, `terrain:build`, `photos:exif`, `photos:build`, `photos:derive`, `data:check` (wired into `lint`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Photo copy, slugs, tags and the Riffelsee pin read correctly | DATA-03 | Editorial judgement by Tim | Checkpoint: Tim reviews the generated `photos.ts` copy diff and approves |
| riskScores and band boundaries | DATA-07 | Values come from Tim | Checkpoint: Tim supplies scores; unit test then enforces band membership |
| Attribution option (A full / B Swiss+Italian) | SHELL-04 | Licensing choice | Checkpoint: Tim confirms; constant is then asserted by e2e |
| Full-res stays unreachable on the preview deploy | DATA-05 | Needs a Vercel preview URL | Request each old full-res URL on the preview; expect 404 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
