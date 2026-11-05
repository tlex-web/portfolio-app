---
phase: "7"
slug: "foundation-guardrails"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-10"
validated: "2026-10-24"
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `07-RESEARCH.md` § Validation Architecture. Audited by `/gsd-validate-phase 07` on 2026-10-24 after all 26 plans were summarized.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.4.2 + jsdom via `next/jest` (unit); `@playwright/test` 1.64.0 (e2e, visual, perf) with `@axe-core/playwright` 4.13.0; ESLint 9.39.4 flat config with `eslint-plugin-jsx-a11y` 6.10.2 + Node `.mjs` guard scripts (static, `colorjs.io` 0.7.1 for contrast) |
| **Config file** | `jest.config.js`, `jest.setup.js`, `playwright.config.ts` (chromium, firefox, visual-dark, visual-light, perf projects), `eslint.config.mjs` |
| **Quick run command** | `npm run lint && npm run type-check && npx jest --silent` (`lint` chains `guard:parity`, `guard:palette`, `guard:contrast`, `guard:identity`, `guard:selftest`) |
| **Full suite command** | `npm run lint && npm run type-check && npm test && npm run build && npx playwright test --project=chromium --project=firefox` plus the visual job (`npx playwright test --project=visual-dark --project=visual-light`, CI container only) |
| **Estimated runtime** | 20 seconds quick (measured 2026-10-24); e2e and visual run in CI |

---

## Sampling Rate

- **After every task commit:** Run the quick command. Every zero-diff commit also needs a green visual job on push before the next build step starts.
- **After every plan wave:** Run the full suite command and the visual job.
- **Before `/gsd-verify-work`:** Full suite green, `test-count.baseline.json` raised to the new total, `palette-ratchet.json` committed, HOME-08 baseline JSON committed.
- **Max feedback latency:** 60 seconds (quick command); the visual job is CI-bound.

---

## Per-Task Verification Map

Evidence for every ✅ row: the quick command green locally on 2026-10-24 at `1cfffe7` (lint + 5 guards, guard self-test 55/55, type-check, Jest 13 suites / 107 tests, test-count 206 = baseline 206), and CI run 40045453857 on `ci/07-26` at `4969072` green for Visual Regression, Unit Tests, E2E Tests, Lint and Type Check, Security Audit and Build Application. Re-audited after gap-closure plan 07-27: CI run 40086883766 on `ci/07-27` at `460b3a4` green for the same six jobs (E2E 122 passed, 0 flaky; Visual Regression 72 passed, 0 PNGs changed), and `npm run build` + Jest 13 suites / 107 tests green locally at `a801639`.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-T1, 07-08-T2 | 07-01, 07-08 | 1, 8 | GUARD-01 | T-07-01, T-07-14 | `npm ci` everywhere (lockfile integrity), CI on Node 24 | static guard | `node scripts/guards/check-install-parity.mjs && npm ls --depth=0` (Vercel part: manual-only below) | ✅ | ✅ green |
| 07-03-T1, 07-03-T2, 07-04-T1 | 07-03, 07-04 | 3, 4 | GUARD-02 | T-07-05, T-07-06, T-07-07, T-07-08 | Baseline job has `contents: read`, artifact upload only | visual e2e | `npx playwright test --project=visual-dark --project=visual-light` (CI container, `retries: 0`, service workers blocked) | ✅ | ✅ green |
| 07-01-T2, 07-26-T3 | 07-01, 07-26 | 1, 26 | GUARD-03 | — | N/A | static guard + self-test | `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` | ✅ | ✅ green |
| 07-16-T1 … 07-19-T1, 07-20-T1 | 07-16 … 07-20 | 16–20 | GUARD-04 | T-07-22 … T-07-26 | N/A | static guard + self-test | `npm run guard:palette` (rules `dark`, `stock`, `wb` ratchet) + `node scripts/guards/selftest.mjs` | ✅ | ✅ green |
| 07-20-T2 | 07-20 | 20 | GUARD-05 | T-07-27 | N/A | static guard + self-test | `npm run guard:contrast` (reads `app/globals.css`) | ✅ | ✅ green |
| 07-02-T1, 07-02-T2 | 07-02 | 2 | GUARD-06 | T-07-04 | N/A | lint + self-test probe | `npm run lint`; `selftest.mjs` jsx-a11y probe expects exit 1 with a `jsx-a11y/` rule id | ✅ | ✅ green |
| 07-05-T2 | 07-05 | 5 | DEPS-03 | T-07-10 | Exact versions, registry integrity | static + visual | `npm ls motion-dom` (one entry); ESLint `no-restricted-imports` bans `framer-motion`; parity `forbiddenDirect`; visual job at 0/50/100 % scroll | ✅ | ✅ green |
| 07-06-T2, 07-07-T2 | 07-06, 07-07 | 6, 7 | DEPS-04 | T-07-11, T-07-12, T-07-13 | Patched Next version asserted | static + visual + build | `check-install-parity.mjs` against `version-floors.json` (next 16.4.2, react 19.3.1, fiber 9.8.1, drei 10.7.9) + `npm run build` + visual job | ✅ | ✅ green |
| 07-08-T2 | 07-08 | 8 | DEPS-05 | T-07-14 | Container tag matches lockfile | static | `check-install-parity.mjs` (every `playwright:vX.Y.Z-noble` tag equals the lockfile `@playwright/test`) | ✅ | ✅ green |
| 07-14-T1, 07-15-T1, 07-15-T2, 07-20-T1 | 07-14, 07-15, 07-20 | 14, 15, 20 | DSGN-05 | T-07-20, T-07-21, T-07-26 | N/A | visual + static | visual-light vs visual-dark PNGs; palette guard `dark` + `variant` rules = 0; `color-scheme: dark` asserted in `design-system.spec.ts` | ✅ | ✅ green |
| 07-09-T1, 07-10-T1, 07-16-T1 … 07-19-T1 | 07-09, 07-10, 07-16 … 07-19 | 9, 10, 16–19 | DSGN-06 | T-07-15, T-07-16, T-07-22 … T-07-25 | N/A | static | contrast guard token classification + palette guard `stock` rule = 0 and `v1names` ban in shell files | ✅ | ✅ green |
| 07-11-T1 | 07-11 | 11 | DSGN-07 | T-07-17 | N/A | e2e computed style | `npx playwright test e2e/design-system.spec.ts --project=chromium` (Schibsted h1, Inter body, JetBrains Mono tabular figures) | ✅ | ✅ green |
| 07-09-T1, 07-22-T3 | 07-09, 07-22 | 9, 22 | DSGN-08 | T-07-15, T-07-30 | N/A | unit + e2e | `npx jest lib/__tests__/motion-tokens.test.ts` (CSS/JS parity) + `shell.spec.ts` "Shell reduced motion" | ✅ | ✅ green |
| 07-12-T1 | 07-12 | 12 | DSGN-09 | T-07-18 | N/A | e2e computed style | `design-system.spec.ts` stable gutter, thin width, scroll lock keeps the header box | ✅ | ✅ green |
| 07-13-T1, 07-25-T2 | 07-13, 07-25 | 13, 25 | DSGN-10 | T-07-19, T-07-32 | N/A | static + unit | palette guard `emoji` rule (in lint since 07-25); one icon dependency (`@phosphor-icons/react`); rewritten `RoadmapFilters.test` / `RoadmapTimeline.test` | ✅ | ✅ green |
| 07-21-T2, 07-22-T3, 07-23-T1, 07-27-T1, 07-27-T2 | 07-21, 07-22, 07-23, 07-27 | 21–23, 27 | SHELL-01 | T-07-28, T-07-30, T-07-31, T-07-36, T-07-37 | N/A | unit + e2e | `npx jest components/site/__tests__/SiteChrome.test.tsx` + `npx playwright test e2e/shell.spec.ts` "Shell landmarks" and "Shell 404" (chromium + firefox), including `skipLinks(page)` `toHaveCount(1)` on 7 routes + 5 404 paths (07-27: red on 5f403af, green on 460b3a4) | ✅ | ✅ green |
| 07-21-T3, 07-22-T3 | 07-21, 07-22 | 21, 22 | SHELL-02 | T-07-29, T-07-30 | N/A | unit + e2e (375 px) | `npx jest components/site/__tests__/SiteNav.test.tsx` + `shell.spec.ts` "Shell mobile menu" (44/48 px targets, Escape, route change) | ✅ | ✅ green |
| 07-21-T2, 07-25-T1 | 07-21, 07-25 | 21, 25 | SHELL-03 | T-07-28, T-07-29, T-07-32 | No placeholder or invented contact identity | static + unit + e2e + tsc | `npm run guard:identity` + `SiteChrome.test.tsx` footer (role line, links) + `homepage.spec.ts` title + `npm run type-check` | ✅ | ✅ green |
| 07-04-T2, 07-23-T1 | 07-04, 07-23 | 4, 23 | SHELL-05 | T-07-08, T-07-09, T-07-31 | N/A | e2e + static | `shell.spec.ts` "Shell 404" (HTTP 404, no redirect, designed body) + no-links grep over `app components data lib` | ✅ | ✅ green |
| 07-24-T1 | 07-24 | 24 | SHELL-06 | T-07-33 | N/A | e2e axe | `npx playwright test e2e/a11y-contact.spec.ts` (dark-OS, light-OS, no mesh) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Checkpoint tasks (`checkpoint:human-action` / `human-verify` / `human-input`) carry no `<automated>` block by design: each one gates on the CI visual job or on Tim's answer. No more than 2 consecutive tasks lack an `<automated>` block anywhere in the phase.

---

## Wave 0 Requirements

- [x] `scripts/guards/{test-count,check-palette,check-contrast,check-install-parity}.mjs` + baseline/ratchet JSON + `__selftest__/` fixtures (plus `check-identity.mjs`, `same-classnames.mjs`, `version-floors.json`)
- [x] `eslint.config.mjs` rewrite + `eslint-plugin-jsx-a11y` as a direct devDependency
- [x] `playwright.config.ts` visual projects; `e2e/visual/routes.spec.ts`, `e2e/visual/hide-canvas.css`
- [x] `.github/workflows/visual-baselines.yml`; `ci.yml` visual job, Node 24, ratchet step, preflight
- [x] `lib/__tests__/motion-tokens.test.ts` (step 7a)
- [x] `e2e/design-system.spec.ts` (step 7); `e2e/shell.spec.ts`, `e2e/a11y-contact.spec.ts`, `components/__tests__/global-error.test.tsx` (step 9)
- [x] `e2e/perf/home-baseline.spec.ts` (step 10)
- [x] `package.json` `lint` script chains the guards (palette + contrast enabled in step 8; self-tests from step 1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Status |
|----------|-------------|------------|-------------------|--------|
| Intentional re-baseline PNGs are correct | GUARD-02, DSGN-05..10, SHELL-05 | Only a human can judge an intended visual change | Download the CI baseline artifact for steps 3, 6 (if needed), 7b–7e, 8 and 9; review diffs; sign off per commit | Done at each plan's re-baseline checkpoint (Tim commits the PNGs) |
| Recency-flagged packages are the official ones | DEPS-03, DEPS-04, DEPS-05 | Supply-chain judgement | Before steps 4, 5 and 6, confirm publisher and version on npm | Done: 07-05 … 07-08 Task 1 blocking-human checkpoints, each approved by Tim (recorded in the SUMMARYs) |
| Real `site.email` and `site.links.linkedin` | SHELL-03 | Values only Tim can supply | Provide both before build step 9 executes | Done: supplied at 07-21 Task 1; now enforced by `guard:identity` |
| Keyboard-only shell smoke pass in Firefox and WebKit | SHELL-01, SHELL-02 | Cheap local smoke ahead of VERIFY-03 (Phase 12) | Tab through nav, skip link, mobile menu on each route | Pending (Tim); `shell.spec.ts` already covers Chromium + Firefox automatically |
| Vercel installs with Node 24.x and `npm ci` | GUARD-01 | Vercel project settings live outside the repo | In Vercel → Project Settings, confirm Node.js Version 24.x and Install Command `npm ci` (or the default with the lockfile) | Pending (Tim), carried from 07-08 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-10-24 (`/gsd-validate-phase 07`), re-audited the same day after 07-27 (0 gaps); two manual-only items above remain with Tim

## Validation Audit 2026-10-24

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
