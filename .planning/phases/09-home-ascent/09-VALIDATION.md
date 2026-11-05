---
phase: "9"
slug: "home-ascent"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
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
| 09-01-T1 | 09-01 | 1 | HOME-01, HOME-02 | T-09-01 | Copy and numbers render as text only | e2e | `npx playwright test e2e/homepage.spec.ts --project=chromium` | ✅ | ✅ green |
| 09-01-T2 | 09-01 | 1 | HOME-01, HOME-06 | T-09-01 | N/A | unit + component | `npx jest lib/__tests__/home-format.test.ts lib/__tests__/poster-frame.test.ts components/home/__tests__/hero.test.tsx --silent` | ✅ | ✅ green |
| 09-01-gate | 09-01 | 1 | all (C1-C8, D1-D15, E1) | — | Execution starts only with Tim's answers recorded | precondition (read-only) | 09-01 Task 1 precondition: no "Tim's answer" cell of the gate table reads pending (grep in 09-01-PLAN.md) | ✅ | ✅ green |
| 09-02-T1 | 09-02 | 2 | HOME-01 | T-09-23 | Compiler list only shrinks; ratchet tightened with --update | build + e2e | `npm run lint && npm run type-check && npm run build && npx playwright test e2e/homepage.spec.ts e2e/design-system.spec.ts --project=chromium` | ✅ | ✅ green |
| 09-02-T2 | 09-02 | 2 | HOME-01 | — | N/A | stale-reference check | `node -e` scan of hide-canvas.css and README.md (see 09-02 Task 2) | ✅ | ✅ green |
| 09-02-T3 | 09-02 | 2 | HOME-01 | T-09-24 | No three/R3F/client hook in the RSC graph | component + e2e (JS off) | `npx jest components/home/__tests__/boundary.test.ts --silent && npx playwright test e2e/homepage.spec.ts --project=chromium` | ✅ | ✅ green |
| 09-03-T1 | 09-03 | 2 | HOME-05 | T-09-03 | Card photos only from manifest derivatives | e2e | `npx playwright test e2e/home-ascent.spec.ts e2e/photos.spec.ts --project=chromium` | ✅ | ✅ green |
| 09-03-T2 | 09-03 | 2 | HOME-05 | T-09-04 | Numbers derived from data | unit + component | `npx jest lib/__tests__/ascent-waypoints.test.ts components/home/__tests__/waypoints.test.tsx components/__tests__/GalleryGrid.test.tsx --silent` | ✅ | ✅ green |
| 09-03-T3 | 09-03 | 2 | HOME-05 | T-09-03 | No legacy -large/-thumb URL on Home | e2e | `npx playwright test e2e/home-ascent.spec.ts --project=chromium` | ✅ | ✅ green |
| 09-04-T1/T2 | 09-04 | 2 | HOME-02 | T-09-05 | Generated shader tokens byte-checked | guard + unit | `npm run tokens:build -- --check && npx jest data/__tests__/tokens.test.ts --silent` | ✅ | ✅ green |
| 09-05-T1 | 09-05 | 3 | HOME-03, HOME-06 | T-09-06, T-09-07 | One global skip link; plaque derived | unit + e2e | `npx jest lib/__tests__/ascent-summit.test.ts --silent && npx playwright test e2e/shell.spec.ts --project=chromium` | ✅ | ✅ green |
| 09-05-T2 | 09-05 | 3 | HOME-06 | — | N/A | component | `npx jest components/home/__tests__/summit.test.tsx --silent` | ✅ | ✅ green |
| 09-05-T3 | 09-05 | 3 | HOME-03, HOME-06 | T-09-07 | Skip to the summit focuses #summit | e2e | `npx playwright test e2e/home-ascent.spec.ts e2e/shell.spec.ts --project=chromium` | ✅ | ✅ green |
| 09-06-T1 | 09-06 | 4 | HOME-03, HOME-04 | T-09-08 | No per-frame React render | unit | `npx jest lib/__tests__/ascent-progress.test.ts --silent` | ✅ | ✅ green |
| 09-06-T2 | 09-06 | 4 | HOME-04, HOME-05 | — | N/A | component | `npx jest components/home/__tests__/rail.test.tsx --silent` | ✅ | ✅ green |
| 09-06-T3 | 09-06 | 4 | HOME-03, HOME-04, HOME-05 | T-09-08 | Native scroll, no defaultPrevented wheel/touch | e2e | `npx playwright test e2e/home-ascent.spec.ts e2e/no-webgl.spec.ts --project=chromium` | ✅ | ✅ green |
| 09-07-T1 | 09-07 | 5 | HOME-02, HOME-08 | T-09-10, T-09-11 | Gate before any heavy request; chunk only via next/dynamic | unit + build | `npx jest lib/__tests__/ascent-capability.test.ts components/home/__tests__/boundary.test.ts --silent` | ✅ | ✅ green |
| 09-07-T2 | 09-07 | 5 | HOME-02 | T-09-09 | Probe context released; nothing transmitted | unit | `npx jest lib/__tests__/useAscentMode.test.tsx components/__tests__/SafeCanvas.test.tsx --silent` | ✅ | ✅ green |
| 09-07-T3 | 09-07 | 5 | HOME-02, HOME-07, HOME-08 | T-09-10 | Static modes fetch no heightmap and no three.js | e2e (both browsers) | `npx playwright test e2e/home-modes.spec.ts e2e/no-webgl.spec.ts --project=chromium --project=firefox` | ✅ | ✅ green |
| 09-08-T1 | 09-08 | 6 | HOME-02 | T-09-12, T-09-SC | Heightmap shape validated; fast-png exact pin | e2e smoke | `npm run guard:parity && npx playwright test e2e/home-canvas.spec.ts --project=chromium` | ✅ | ✅ green |
| 09-08-T2 | 09-08 | 6 | HOME-02 | T-09-13 | Abort-safe load, GPU disposal | unit | `npx jest lib/__tests__/heightmap.test.ts --silent` | ✅ | ✅ green |
| 09-08-T3 | 09-08 | 6 | HOME-02 | T-09-11 | No worker, no CSP violation | e2e smoke | `npx playwright test e2e/home-canvas.spec.ts --project=chromium` | ✅ | ✅ green |
| 09-09-T1 | 09-09 | 7 | HOME-08 (D-22) | T-09-14 | Deterministic static-capability shots | visual list | `npx playwright test --list --project=visual-dark` | ✅ | ✅ green |
| 09-09-T2 | 09-09 | 7 | HOME-08 | T-09-14 | Same profile; mode recorded; early byte signal against 468,770 B | perf (local production, one sample; CI 5-run via visual-baselines.yml suite=perf) | `PW_PROD=1 HOME08_RUNS=1 HOME08_OUT=test-results/home-perf-local.json npx playwright test --project=perf` (since 218840e it asserts the 09-13 total-keep gate: median total JS <= 468,770 B, median LCP <= 4,692 ms, every sample 3d) | ✅ | ✅ green |
| 09-10-T1/T3 | 09-10 | 7 | HOME-02, HOME-03, HOME-05 | — | N/A | e2e smoke | `npx playwright test e2e/home-canvas.spec.ts --project=chromium` | ✅ | ✅ green |
| 09-10-T2 | 09-10 | 7 | HOME-02, HOME-05 | T-09-15 | N/A | unit | `npx jest lib/__tests__/ascent-route.test.ts --silent` | ✅ | ✅ green |
| 09-11-T1 | 09-11 | 8 | HOME-02 | T-09-17 | Lost context -> static, no retry | e2e | `npx playwright test e2e/home-canvas.spec.ts --project=chromium -g "context loss"` | ✅ | ✅ green |
| 09-11-T2 | 09-11 | 8 | HOME-02 | T-09-16 | Frame budget -> DPR 1 -> static | unit | `npx jest lib/__tests__/frame-budget.test.ts --silent` | ✅ | ✅ green |
| 09-11-T3 | 09-11 | 8 | HOME-07 | T-09-16 | No draws at rest, off-screen or hidden | e2e (draw counter) | `npx playwright test e2e/home-canvas.spec.ts e2e/home-modes.spec.ts --project=chromium --workers=1` | ✅ | ✅ green |
| 09-12-T3 | 09-12 | 9 | HOME-01, HOME-02, HOME-08 | T-09-18 | Approval recorded verbatim; pre-CI byte check | lint + e2e + perf (local production, one sample) | `npm run lint && npx playwright test e2e/home-modes.spec.ts e2e/home-canvas.spec.ts --project=chromium && PW_PROD=1 HOME08_RUNS=1 HOME08_OUT=test-results/home-perf-local.json npx playwright test --project=perf` | ✅ | ✅ green |
| 09-13-T2 | 09-13 | 10 | HOME-08 | T-09-19, T-09-20 | Pushes only after Tim's go-ahead | CI | `node scripts/ci/check-visual-run.mjs --sha "$(git rev-parse HEAD)" --job "E2E Tests" --wait 30` | ✅ | ✅ green |
| 09-14-T1 | 09-14 | 11 | HOME-08 | — | N/A | unit | `npx jest lib/__tests__/frame-budget.test.ts lib/__tests__/frame-budget-policy.test.ts --silent && npx playwright test e2e/home-canvas.spec.ts --project=chromium -g "frame-budget verdict|slow device"` (B1 policy guard plus the real-budget verdict and decline tests) | ✅ | ✅ green |
| 09-14-T2 | 09-14 | 11 | HOME-01, HOME-02, HOME-05 | T-09-21 | Home re-baseline only, Tim commits | visual (CI container) | `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some --allow home --allow-deletions` | ✅ | ✅ green |
| 09-14-T3 | 09-14 | 11 | GUARD-03 (phase close) | T-09-22 | Ratchet only rises | guard | `node scripts/guards/test-count.mjs --jest jest-results.json` | ✅ | ✅ green |
| 09-15-T1 | 09-15 | 12 | HOME-07, HOME-02 | T-09-25, T-09-26 | G-09-5/WR-01: a burst interrupted by a hidden tab is dropped; a fresh burst follows the show; no gap-based restart; FRAME_BUDGET_DEFAULTS unchanged | e2e (both device scales) + unit policy | `npx playwright test e2e/home-canvas.spec.ts --project=chromium -g "hidden" && npx jest lib/__tests__/frame-budget-policy.test.ts lib/__tests__/frame-budget.test.ts --silent` | ✅ | ✅ green |
| 09-15-T2 | 09-15 | 12 | HOME-07, HOME-02 | T-09-25, T-09-26 | WR-02: context-loss and hidden-tab tests are measure-only, slow-device and verdict tests keep the real budget; IN-05 JSDoc | unit + e2e + lint | `npx jest lib/__tests__/frame-budget-policy.test.ts lib/__tests__/useAscentMode.test.tsx --silent && npx playwright test e2e/home-canvas.spec.ts --project=chromium -g "context loss\|slow device\|records the frame-budget" && npm run lint && npm run type-check` | ✅ | ✅ green |
| 09-16-T1 | 09-16 | 13 | HOME-05 | T-09-27 | Kicker breaks only between its parts; place tail glued; no leading '·'; text rendered escaped | e2e (375x667 mobile) + component | `npx playwright test e2e/home-ascent.spec.ts --project=chromium -g "line break" && npx jest components/home/__tests__/waypoints.test.tsx lib/__tests__/ascent-waypoints.test.ts --silent` | ✅ | ✅ green |
| 09-16-T2 | 09-16 | 13 | HOME-05 | T-09-27 | Strings unchanged (waypointKicker, placeDate); other widths and layouts, Firefox on CI | unit + e2e (chromium; firefox on CI) | `npx jest lib/__tests__/ascent-waypoints.test.ts components/home/__tests__/waypoints.test.tsx --silent && npx playwright test e2e/home-ascent.spec.ts --project=chromium --project=firefox -g "line break"` | ✅ | ✅ green |
| 09-17-T1 | 09-17 | 14 | HOME-04 | T-09-28 | Rail in its own aria-hidden, pointer-events-none layer; composed contrast at 768 x 900, p=0 | e2e + component | `npx playwright test e2e/home-modes.spec.ts e2e/home-ascent.spec.ts --project=chromium -g "N1\|rail\|B7\|B8" && npx jest components/home/__tests__/rail.test.tsx --silent` | ✅ | ✅ green |
| 09-17-T2 | 09-17 | 14 | HOME-04 | T-09-28 | Composed-contrast matrix 768/1023/1280 at p 0 and 0.05; B7/B8/axe unchanged | e2e (chromium; firefox on CI) | `npx playwright test e2e/home-modes.spec.ts --project=chromium --project=firefox -g "N1\|B7\|B8\|axe"` | ✅ | ✅ green |
| 09-18-T1 | 09-18 | 15 | HOME-06, HOME-05 | T-09-29 | Compact summit at 375x667; exactly one visible stats copy; heading outline unchanged | e2e | `npx playwright test e2e/home-ascent.spec.ts --project=chromium -g "Summit\|summit\|375 px\|heading outline"` | ✅ | ✅ green |
| 09-18-T2 | 09-18 | 15 | HOME-06 | T-09-29 | summit-layout thresholds equal the CSS media query; poster pins clear the modelled column at 11 sizes | unit (sweep) | `npx jest lib/__tests__/summit-layout.test.ts --silent` | ✅ | ✅ green |
| 09-18-T3 | 09-18 | 15 | HOME-06, HOME-05 | T-09-29 | Eleven-size poster sweep; compact stats group named by the summit h2; jsdom variant checks | e2e (chromium; firefox on CI) + component | `npx playwright test e2e/home-ascent.spec.ts --project=chromium --project=firefox -g "Summit\|summit" && npx jest components/home/__tests__/summit.test.tsx lib/__tests__/summit-layout.test.ts --silent && npm run lint && npm run type-check` | ✅ | ✅ green |
| 09-19-T1 | 09-19 | 16 | HOME-05 | T-09-30 | Card-aware poster label for waypoint 2 at 768x900; 3D pin lights | e2e | `npx playwright test e2e/home-ascent.spec.ts --project=chromium -g "Lit poster label\|poster pins sit at their UV" && npx playwright test e2e/home-canvas.spec.ts --project=chromium -g "waypoint 2 lights its 3D pin\|pins hand over"` | ✅ | ✅ green |
| 09-19-T2 | 09-19 | 16 | HOME-05 | T-09-30 | placePinLabel rules (right, left, above, below, 4 px margins, least-overlap, no label inside a cover); 3D layer above the scrim | unit + component | `npx jest lib/__tests__/framing.test.ts components/home/__tests__/rail.test.tsx components/home/__tests__/pin-layer-3d.test.tsx --silent` | ✅ | ✅ green |
| 09-19-T3 | 09-19 | 16 | HOME-05 | T-09-30 | Poster label sweep across md, desktop and phone sizes; ratchet guard | e2e (chromium; firefox on CI) + guard | `npx playwright test e2e/home-ascent.spec.ts --project=chromium --project=firefox -g "Lit poster label" && npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` | ✅ | ✅ green |
| 09-20-T1 | 09-20 | 17 | HOME-02, HOME-05, HOME-06 | T-09-31 | Measured summit framing: 3D pins visible, inside the stage, left of the rail scrim, 8 px off the plaque (1024x768) | e2e (measure-only) | `npx playwright test e2e/home-canvas.spec.ts --project=chromium -g "summit"` | ✅ | ✅ green |
| 09-20-T2 | 09-20 | 17 | HOME-02, HOME-06 | T-09-31 | fitCluster, summitClearRects, stageViewKeys, viewTrackAt; share-based helpers removed from route.ts (asserted absent) | unit | `npx jest lib/__tests__/framing.test.ts lib/__tests__/ascent-route.test.ts --silent` | ✅ | ✅ green |
| 09-20-T3 | 09-20 | 17 | HOME-02, HOME-05, HOME-06 | T-09-31 | Eleven-size 3D summit table; md switch uses matchMedia(min-width 48rem) (sizes 768 and 778 in the table) | e2e + unit + lint | `npx playwright test e2e/home-canvas.spec.ts --project=chromium -g "summit" && npx jest lib/__tests__/frame-budget-policy.test.ts --silent && npm run lint` | ✅ | ✅ green |
| 09-21-T1 | 09-21 | 18 | HOME-02, HOME-05 | T-09-32 | Measured md stage framing and 3D labels clear of card and rail at 768x900 for every waypoint | e2e (measure-only) + unit | `npx playwright test e2e/home-canvas.spec.ts --project=chromium -g "lights a clear 3D pin\|waypoint 2 lights its 3D pin\|a canvas revealed while stationary" && npx jest lib/__tests__/frame-budget-policy.test.ts --silent && npm run type-check` | ✅ | ✅ green |
| 09-21-T2 | 09-21 | 18 | HOME-02, HOME-05 | T-09-32 | waypointTarget (natural, beside, above, below, natural fallback, no card, 8 px margin); remaining md and desktop rows | unit + e2e + guard | `npx jest lib/__tests__/framing.test.ts --silent && npx playwright test e2e/home-canvas.spec.ts --project=chromium && npm run guard:tests` | ✅ | ✅ green |
| 09-22-T1 | 09-22 | 19 | HOME-02, HOME-04, HOME-05, HOME-06 | T-09-33 | No ci/09-22 push, dispatch or re-run before Tim's literal go-ahead (checkpoint:decision, human by design) | CI | `node scripts/ci/check-visual-run.mjs --sha 05a5e8c --job "E2E Tests"` (run 40232792001, attempts 1 and 2) | ✅ | ✅ green |
| 09-22-T2 | 09-22 | 19 | HOME-02, HOME-04, HOME-05, HOME-06 | T-09-34 | One Home re-baseline; only home/ PNGs change; Tim commits; CI green twice (checkpoint:human-action); hand-over test holds the heightmap with the service worker blocked (05a5e8c) | visual (CI container) | `node scripts/ci/check-snapshot-commit.mjs --sha e9ebee7 --some --allow home` | ✅ | ✅ green |
| 09-22-T3 | 09-22 | 19 | GUARD-03 (phase close) | T-09-35 | Ratchet only rises (jest 725, e2e 241, total 966, above 646/186/832) | guard | `npx jest --json --outputFile=jest-results.json --silent && node scripts/guards/test-count.mjs --jest jest-results.json` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No separate Wave 0 plan: each plan's tracer or TDD task writes its tests first (frameworks are installed).

- [x] `lib/__tests__/home-format.test.ts`, `poster-frame.test.ts` (09-01); `ascent-waypoints.test.ts` (09-03); `ascent-summit.test.ts` (09-05); `ascent-progress.test.ts` (09-06); `ascent-capability.test.ts`, `useAscentMode.test.tsx` (09-07); `heightmap.test.ts` (09-08); `ascent-route.test.ts` (09-10); `frame-budget.test.ts` (09-11)
- [x] `components/home/__tests__/hero.test.tsx` (09-01); `boundary.test.ts` (09-02); `waypoints.test.tsx` (09-03); `summit.test.tsx` (09-05); `rail.test.tsx` (09-06); SafeCanvas onCanvasError tests (09-07)
- [x] `data/__tests__/tokens.test.ts` + `scripts/tokens/build-tokens.mjs` with `--check` in data:check (09-04)
- [x] `e2e/helpers/webgl.ts`, `e2e/helpers/ascent.ts` (09-06, extended in 09-07 and 09-11)
- [x] `e2e/home-ascent.spec.ts` (09-03, 09-05, 09-06), `e2e/home-modes.spec.ts` (09-07), `e2e/home-canvas.spec.ts` (09-08, 09-10, 09-11); rewrites of `e2e/homepage.spec.ts` (09-01, 09-02), `e2e/no-webgl.spec.ts`, `e2e/shell.spec.ts`, `e2e/visual/routes.spec.ts`, `e2e/perf/home-baseline.spec.ts`
- [x] (n/a locally: Firefox ran on CI only, green on 284f433) Local: `npx playwright install firefox` (Playwright 1.64 needs firefox-1555), only if gate row E1 in 09-01 approves it; otherwise Firefox runs on CI only
- [x] Phase close (09-14, 02cfdd7: 533 -> 832): `node scripts/guards/test-count.mjs --jest jest-results.json --update` (09-14)
- [x] Gap closure (09-15 to 09-22) writes its tests in its own TDD or tracer tasks: `lib/__tests__/summit-layout.test.ts` (09-18), `lib/__tests__/framing.test.ts` (09-19, 09-20, 09-21); ratchet 832 -> 966 (09-22, 4c926e8)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pre-execution gate: C1-C8, Defaults 1-15, E1 | all (D-21 via D4, D-18 via C4, D-11 via D3) | Tim's decisions; nothing in the table is approved yet | The orchestrator records Tim's literal reply per row in the 09-01 gate table before /gsd-execute-phase 9; 09-01 Task 1, 09-07 Task 1 and 09-11 Task 2 preconditions stop execution on a pending row. **Done** (recorded in 09-01) |
| About and contact copy reads right | D-14 (HOME page copy) | Editorial judgement by Tim | 09-12 Task 1 checkpoint: Tim approves or rewrites; his reply is quoted. **Done:** "approve" (09-12-SUMMARY) |
| Terrain look (relief exaggeration, summit pull-back, relief opacity) | HOME-02 | Aesthetic choice | 09-12 Task 2: executor renders candidates (scratchpad) with measured contrast; Tim picks. **Done:** "defaults (Recommended)" |
| Real-device 3D quality and vestibular comfort | HOME-02, HOME-07 | GPU paths and comfort cannot be emulated | 09-11 human-check: iPhone, mid-range Android and a laptop on the ci/09-13 preview or LAN dev server; recorded in 09-UAT.md. **OPEN:** no 09-UAT.md yet; run in /gsd-verify-work 09 |
| ci/09-NN pushes and workflow dispatches | HOME-08 | Standing approval covers ci/07 and ci/08 only | 09-13 Task 1: Tim's literal go-ahead. **Done:** "approve" (ci/09-13 and ci/09-14) |
| Which number gates HOME-08; frame budget under automation | HOME-08 | Measurement definition and CI-only timing | 09-13 Task 3: Tim decides from the container numbers. **Done:** "total-keep (Recommended)" + "B1: extend option A (Recommended)"; the gate is now also asserted in e2e/perf/home-baseline.spec.ts (218840e) |
| Home baseline PNGs reviewed and committed | GUARD-02 (HOME-01, 02, 05 visuals) | Tim-only process rule | 09-14 Task 2: executor downloads and copies; Tim reviews, commits, pushes. **Done:** Tim's 284f433, CI green twice (run 40193992531 + rerun) |
| ci/09-22 push, visual dispatch and one re-run | HOME-02, HOME-04, HOME-05, HOME-06 | Pushes and dispatches need Tim's go-ahead per phase | 09-22 Task 1: Tim's literal reply recorded in 09-22-SUMMARY. **Done:** "Approve"; the second fast-forward push and re-run after the hand-over flake: "b" |
| Home re-baseline PNGs for the gap-closure layouts reviewed and committed | GUARD-02 (HOME-02, 04, 05, 06 visuals) | Tim-only process rule | 09-22 Task 2: executor downloads and copies changed home/ PNGs; Tim reviews, commits, pushes. **Done:** Tim's e9ebee7 ("pushed", no comment on the review checklist); CI green twice on 05a5e8c (run 40232792001 + rerun) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (checkpoint tasks 09-12-T1/T2, 09-13-T1/T3, 09-14-T2 are human decisions by design)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [ ] Feedback latency < 9s (not met by design: visual and perf suites run only in the CI container, max 240 s; quick Jest run ~10 s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-25 (validate-phase audit; HOME-08 gap filled by Tim's "Fix all gaps (Recommended)"). Re-audited 2026-10-25 after the gap closure (09-15 to 09-22): no gaps, nyquist_compliant stays true

## Validation Audit 2026-10-25

| Metric | Count |
|---|---|
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |

## Validation Audit 2026-10-25

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
