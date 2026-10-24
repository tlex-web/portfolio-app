---
phase: "9"
slug: "home-ascent"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-24"
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 (next/jest, jsdom) + Playwright 1.64 (`chromium`, `firefox`, `visual-dark`, `visual-light`, `perf`) + node guard scripts (`npm run lint` runs eslint, parity, palette, contrast, identity, selftest, data:check incl. `tokens:build -- --check`, served images) |
| **Config file** | `jest.config.js`, `playwright.config.ts` (SCREENSHOT threshold 0.01), `scripts/guards/*` |
| **Quick run command** | `npx jest lib/__tests__ components/home data/__tests__/tokens.test.ts --silent` |
| **Full suite command** | `npm run lint && npm run type-check && npm test && npx playwright test --project=chromium --project=firefox` (set `PW_PROD=1` for production-server parity) |
| **Estimated runtime** | ~240 seconds full (quick run ~25 seconds) |

---

## Sampling Rate

- **After every task commit:** the quick Jest run plus `npm run lint && npm run type-check`; e2e tasks run their own spec with `--project=chromium`
- **After every plan wave:** the full suite command (local Firefox needs `npx playwright install firefox` once)
- **Before `/gsd-verify-work`:** CI green on Tim's 09-14 baseline commit twice (Visual Regression, E2E, Unit with the ratchet, Lint and Type Check), the HOME-08 perf artifact judged under Tim's 09-13 gate, ratchet above 533
- **Max feedback latency:** 240 seconds (visual and perf suites run only in the CI container)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-T1 | 09-01 | 1 | HOME-01, HOME-02 | T-09-01 | Copy and numbers render as text only | e2e | `npx playwright test e2e/homepage.spec.ts --project=chromium` | ✅ rewrite | ⬜ pending |
| 09-01-T2 | 09-01 | 1 | HOME-01, HOME-06 | T-09-01 | N/A | unit + component | `npx jest lib/__tests__/home-format.test.ts lib/__tests__/poster-frame.test.ts components/home/__tests__/hero.test.tsx --silent` | ❌ W0 | ⬜ pending |
| 09-01-gate | 09-01 | 1 | all (C1-C8, D1-D15, E1) | — | Execution starts only with Tim's answers recorded | precondition (read-only) | 09-01 Task 1 precondition: no "Tim's answer" cell of the gate table reads pending (grep in 09-01-PLAN.md) | ✅ | ⬜ pending |
| 09-02-T1 | 09-02 | 2 | HOME-01 | T-09-23 | Compiler list only shrinks; ratchet tightened with --update | build + e2e | `npm run lint && npm run type-check && npm run build && npx playwright test e2e/homepage.spec.ts e2e/design-system.spec.ts --project=chromium` | ✅ | ⬜ pending |
| 09-02-T2 | 09-02 | 2 | HOME-01 | — | N/A | stale-reference check | `node -e` scan of hide-canvas.css and README.md (see 09-02 Task 2) | ✅ | ⬜ pending |
| 09-02-T3 | 09-02 | 2 | HOME-01 | T-09-24 | No three/R3F/client hook in the RSC graph | component + e2e (JS off) | `npx jest components/home/__tests__/boundary.test.ts --silent && npx playwright test e2e/homepage.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| 09-03-T1 | 09-03 | 2 | HOME-05 | T-09-03 | Card photos only from manifest derivatives | e2e | `npx playwright test e2e/home-ascent.spec.ts e2e/photos.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| 09-03-T2 | 09-03 | 2 | HOME-05 | T-09-04 | Numbers derived from data | unit + component | `npx jest lib/__tests__/ascent-waypoints.test.ts components/home/__tests__/waypoints.test.tsx components/__tests__/GalleryGrid.test.tsx --silent` | ❌ W0 | ⬜ pending |
| 09-03-T3 | 09-03 | 2 | HOME-05 | T-09-03 | No legacy -large/-thumb URL on Home | e2e | `npx playwright test e2e/home-ascent.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| 09-04-T1/T2 | 09-04 | 2 | HOME-02 | T-09-05 | Generated shader tokens byte-checked | guard + unit | `npm run tokens:build -- --check && npx jest data/__tests__/tokens.test.ts --silent` | ❌ W0 | ⬜ pending |
| 09-05-T1 | 09-05 | 3 | HOME-03, HOME-06 | T-09-06, T-09-07 | One global skip link; plaque derived | unit + e2e | `npx jest lib/__tests__/ascent-summit.test.ts --silent && npx playwright test e2e/shell.spec.ts --project=chromium` | ❌ W0 / ✅ rewrite | ⬜ pending |
| 09-05-T2 | 09-05 | 3 | HOME-06 | — | N/A | component | `npx jest components/home/__tests__/summit.test.tsx --silent` | ❌ W0 | ⬜ pending |
| 09-05-T3 | 09-05 | 3 | HOME-03, HOME-06 | T-09-07 | Skip to the summit focuses #summit | e2e | `npx playwright test e2e/home-ascent.spec.ts e2e/shell.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| 09-06-T1 | 09-06 | 4 | HOME-03, HOME-04 | T-09-08 | No per-frame React render | unit | `npx jest lib/__tests__/ascent-progress.test.ts --silent` | ❌ W0 | ⬜ pending |
| 09-06-T2 | 09-06 | 4 | HOME-04, HOME-05 | — | N/A | component | `npx jest components/home/__tests__/rail.test.tsx --silent` | ❌ W0 | ⬜ pending |
| 09-06-T3 | 09-06 | 4 | HOME-03, HOME-04, HOME-05 | T-09-08 | Native scroll, no defaultPrevented wheel/touch | e2e | `npx playwright test e2e/home-ascent.spec.ts e2e/no-webgl.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| 09-07-T1 | 09-07 | 5 | HOME-02, HOME-08 | T-09-10, T-09-11 | Gate before any heavy request; chunk only via next/dynamic | unit + build | `npx jest lib/__tests__/ascent-capability.test.ts components/home/__tests__/boundary.test.ts --silent` | ❌ W0 | ⬜ pending |
| 09-07-T2 | 09-07 | 5 | HOME-02 | T-09-09 | Probe context released; nothing transmitted | unit | `npx jest lib/__tests__/useAscentMode.test.tsx components/__tests__/SafeCanvas.test.tsx --silent` | ❌ W0 / ✅ extend | ⬜ pending |
| 09-07-T3 | 09-07 | 5 | HOME-02, HOME-07, HOME-08 | T-09-10 | Static modes fetch no heightmap and no three.js | e2e (both browsers) | `npx playwright test e2e/home-modes.spec.ts e2e/no-webgl.spec.ts --project=chromium --project=firefox` | ❌ W0 / ✅ rewrite | ⬜ pending |
| 09-08-T1 | 09-08 | 6 | HOME-02 | T-09-12, T-09-SC | Heightmap shape validated; fast-png exact pin | e2e smoke | `npm run guard:parity && npx playwright test e2e/home-canvas.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| 09-08-T2 | 09-08 | 6 | HOME-02 | T-09-13 | Abort-safe load, GPU disposal | unit | `npx jest lib/__tests__/heightmap.test.ts --silent` | ❌ W0 | ⬜ pending |
| 09-08-T3 | 09-08 | 6 | HOME-02 | T-09-11 | No worker, no CSP violation | e2e smoke | `npx playwright test e2e/home-canvas.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| 09-09-T1 | 09-09 | 7 | HOME-08 (D-22) | T-09-14 | Deterministic static-capability shots | visual list | `npx playwright test --list --project=visual-dark` | ✅ rewrite | ⬜ pending |
| 09-09-T2 | 09-09 | 7 | HOME-08 | T-09-14 | Same profile; mode recorded; early byte signal against 468,770 B | perf (local production, one sample) | `PW_PROD=1 HOME08_RUNS=1 HOME08_OUT=test-results/home-perf-local.json npx playwright test --project=perf` | ✅ extend | ⬜ pending |
| 09-10-T1/T3 | 09-10 | 7 | HOME-02, HOME-03, HOME-05 | — | N/A | e2e smoke | `npx playwright test e2e/home-canvas.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| 09-10-T2 | 09-10 | 7 | HOME-02, HOME-05 | T-09-15 | N/A | unit | `npx jest lib/__tests__/ascent-route.test.ts --silent` | ❌ W0 | ⬜ pending |
| 09-11-T1 | 09-11 | 8 | HOME-02 | T-09-17 | Lost context -> static, no retry | e2e | `npx playwright test e2e/home-canvas.spec.ts --project=chromium -g "context loss"` | ❌ W0 | ⬜ pending |
| 09-11-T2 | 09-11 | 8 | HOME-02 | T-09-16 | Frame budget -> DPR 1 -> static | unit | `npx jest lib/__tests__/frame-budget.test.ts --silent` | ❌ W0 | ⬜ pending |
| 09-11-T3 | 09-11 | 8 | HOME-07 | T-09-16 | No draws at rest, off-screen or hidden | e2e (draw counter) | `npx playwright test e2e/home-canvas.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| 09-12-T3 | 09-12 | 9 | HOME-01, HOME-02, HOME-08 | T-09-18 | Approval recorded verbatim; pre-CI byte check | lint + e2e + perf (local production, one sample) | `npm run lint && npx playwright test e2e/home-modes.spec.ts e2e/home-canvas.spec.ts --project=chromium && PW_PROD=1 HOME08_RUNS=1 HOME08_OUT=test-results/home-perf-local.json npx playwright test --project=perf` | ✅ | ⬜ pending |
| 09-13-T2 | 09-13 | 10 | HOME-08 | T-09-19, T-09-20 | Pushes only after Tim's go-ahead | CI | `node scripts/ci/check-visual-run.mjs --sha "$(git rev-parse HEAD)" --job "E2E Tests" --wait 30` | ✅ | ⬜ pending |
| 09-14-T1 | 09-14 | 11 | HOME-08 | — | N/A | unit | `npx jest lib/__tests__/frame-budget.test.ts --silent` | ✅ | ⬜ pending |
| 09-14-T2 | 09-14 | 11 | HOME-01, HOME-02, HOME-05 | T-09-21 | Home re-baseline only, Tim commits | visual (CI container) | `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some --allow home --allow-deletions` | ✅ | ⬜ pending |
| 09-14-T3 | 09-14 | 11 | GUARD-03 (phase close) | T-09-22 | Ratchet only rises | guard | `node scripts/guards/test-count.mjs --jest jest-results.json` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No separate Wave 0 plan: each plan's tracer or TDD task writes its tests first (frameworks are installed).

- [ ] `lib/__tests__/home-format.test.ts`, `poster-frame.test.ts` (09-01); `ascent-waypoints.test.ts` (09-03); `ascent-summit.test.ts` (09-05); `ascent-progress.test.ts` (09-06); `ascent-capability.test.ts`, `useAscentMode.test.tsx` (09-07); `heightmap.test.ts` (09-08); `ascent-route.test.ts` (09-10); `frame-budget.test.ts` (09-11)
- [ ] `components/home/__tests__/hero.test.tsx` (09-01); `boundary.test.ts` (09-02); `waypoints.test.tsx` (09-03); `summit.test.tsx` (09-05); `rail.test.tsx` (09-06); SafeCanvas onCanvasError tests (09-07)
- [ ] `data/__tests__/tokens.test.ts` + `scripts/tokens/build-tokens.mjs` with `--check` in data:check (09-04)
- [ ] `e2e/helpers/webgl.ts`, `e2e/helpers/ascent.ts` (09-06, extended in 09-07 and 09-11)
- [ ] `e2e/home-ascent.spec.ts` (09-03, 09-05, 09-06), `e2e/home-modes.spec.ts` (09-07), `e2e/home-canvas.spec.ts` (09-08, 09-10, 09-11); rewrites of `e2e/homepage.spec.ts` (09-01, 09-02), `e2e/no-webgl.spec.ts`, `e2e/shell.spec.ts`, `e2e/visual/routes.spec.ts`, `e2e/perf/home-baseline.spec.ts`
- [ ] Local: `npx playwright install firefox` (Playwright 1.64 needs firefox-1555), only if gate row E1 in 09-01 approves it; otherwise Firefox runs on CI only
- [ ] Phase close: `node scripts/guards/test-count.mjs --jest jest-results.json --update` (09-14)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pre-execution gate: C1-C8, Defaults 1-15, E1 | all (D-21 via D4, D-18 via C4, D-11 via D3) | Tim's decisions; nothing in the table is approved yet | The orchestrator records Tim's literal reply per row in the 09-01 gate table before /gsd-execute-phase 9; 09-01 Task 1, 09-07 Task 1 and 09-11 Task 2 preconditions stop execution on a pending row |
| About and contact copy reads right | D-14 (HOME page copy) | Editorial judgement by Tim | 09-12 Task 1 checkpoint: Tim approves or rewrites; his reply is quoted |
| Terrain look (relief exaggeration, summit pull-back, relief opacity) | HOME-02 | Aesthetic choice | 09-12 Task 2: executor renders candidates (scratchpad) with measured contrast; Tim picks |
| Real-device 3D quality and vestibular comfort | HOME-02, HOME-07 | GPU paths and comfort cannot be emulated | 09-11 human-check: iPhone, mid-range Android and a laptop on the ci/09-13 preview or LAN dev server; recorded in 09-UAT.md |
| ci/09-NN pushes and workflow dispatches | HOME-08 | Standing approval covers ci/07 and ci/08 only | 09-13 Task 1: Tim's literal go-ahead |
| Which number gates HOME-08; frame budget under automation | HOME-08 | Measurement definition and CI-only timing | 09-13 Task 3: Tim decides from the container numbers |
| Home baseline PNGs reviewed and committed | GUARD-02 (HOME-01, 02, 05 visuals) | Tim-only process rule | 09-14 Task 2: executor downloads and copies; Tim reviews, commits, pushes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 9s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** {pending / approved YYYY-MM-DD}
