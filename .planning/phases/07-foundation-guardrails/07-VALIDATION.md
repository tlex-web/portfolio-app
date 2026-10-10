---
phase: "7"
slug: "foundation-guardrails"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-10"
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `07-RESEARCH.md` § Validation Architecture. Task IDs are filled in once plans exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.4.2 + jsdom via `next/jest` (unit); `@playwright/test` 1.60.0 → 1.64.0 (e2e + visual); ESLint 9.39.4 flat config + Node `.mjs` guard scripts (static) |
| **Config file** | `jest.config.js`, `jest.setup.js`, `playwright.config.ts` (visual projects added in Wave 0), `eslint.config.mjs` (rewritten in Wave 0) |
| **Quick run command** | `npm run lint && npm run type-check && npx jest --silent` |
| **Full suite command** | `npm run lint && npm run type-check && npm test && npm run build && npx playwright test --project=chromium --project=firefox` plus the visual job (`npx playwright test --project=visual-dark --project=visual-light`, CI container only) |
| **Estimated runtime** | ~60 seconds quick; visual job runs in CI |

---

## Sampling Rate

- **After every task commit:** Run the quick command. Every zero-diff commit also needs a green visual job on push before the next build step starts.
- **After every plan wave:** Run the full suite command and the visual job.
- **Before `/gsd-verify-work`:** Full suite green, `test-count.baseline.json` raised to the new total, `palette-ratchet.json` committed, HOME-08 baseline JSON committed.
- **Max feedback latency:** 60 seconds (quick command); the visual job is CI-bound.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | — | — | GUARD-01 | — | `npm ci` everywhere (lockfile integrity) | static guard | `node scripts/guards/check-install-parity.mjs && npm ls --depth=0` | ❌ W0 | ⬜ pending |
| TBD | — | — | GUARD-02 | — | Baseline job has `contents: read`, artifact upload only | visual e2e | `npx playwright test --project=visual-dark --project=visual-light` | ❌ W0 | ⬜ pending |
| TBD | — | — | GUARD-03 | — | N/A | static guard + self-test | `npx jest --json --outputFile=jest-results.json && node scripts/guards/test-count.mjs --jest jest-results.json` | ❌ W0 | ⬜ pending |
| TBD | — | — | GUARD-04 | — | N/A | static guard + self-test | `node scripts/guards/check-palette.mjs` | ❌ W0 | ⬜ pending |
| TBD | — | — | GUARD-05 | — | N/A | static guard + self-test | `node scripts/guards/check-contrast.mjs` | ❌ W0 | ⬜ pending |
| TBD | — | — | GUARD-06 | — | N/A | lint + stdin probe | `npm run lint` and an `eslint --stdin` jsx-a11y probe (expect exit 1) | ❌ W0 | ⬜ pending |
| TBD | — | — | DEPS-03 | — | Exact versions, registry integrity | static + visual | `npm ls motion-dom` (one entry) + no `framer-motion` imports + visual job | ❌ W0 | ⬜ pending |
| TBD | — | — | DEPS-04 | — | Patched Next version asserted | static + visual + build | `check-install-parity.mjs` version asserts + `npm run build` + visual job | ❌ W0 | ⬜ pending |
| TBD | — | — | DEPS-05 | — | Container tag matches lockfile | static | `check-install-parity.mjs` | ❌ W0 | ⬜ pending |
| TBD | — | — | DSGN-05 | — | N/A | visual + static | visual-light vs dark PNGs + palette guard `dark:`=0 | ❌ W0 | ⬜ pending |
| TBD | — | — | DSGN-06 | — | N/A | static | contrast guard token classification + palette guard v1-name ban | ❌ W0 | ⬜ pending |
| TBD | — | — | DSGN-07 | — | N/A | e2e computed style | `npx playwright test e2e/design-system.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| TBD | — | — | DSGN-08 | — | N/A | unit + e2e | `npx jest lib/__tests__/motion-tokens.test.ts` + reduced-motion shell check | ❌ W0 | ⬜ pending |
| TBD | — | — | DSGN-09 | — | N/A | e2e computed style | `design-system.spec.ts` scrollbar gutter + no-shift-on-modal | ❌ W0 | ⬜ pending |
| TBD | — | — | DSGN-10 | — | N/A | static + unit | palette guard emoji/Phosphor rules + rewritten `RoadmapFilters.test` / `RoadmapTimeline.test` | ⚠ rewrite | ⬜ pending |
| TBD | — | — | SHELL-01 | — | N/A | e2e | `npx playwright test e2e/shell.spec.ts --project=chromium` | ❌ W0 | ⬜ pending |
| TBD | — | — | SHELL-02 | — | N/A | e2e (375 px) | `shell.spec.ts` mobile describe | ❌ W0 | ⬜ pending |
| TBD | — | — | SHELL-03 | — | No placeholder or invented contact identity | static + e2e + tsc | forbidden-strings guard + `shell.spec.ts` footer hrefs + `npm run type-check` | ❌ W0 | ⬜ pending |
| TBD | — | — | SHELL-05 | — | N/A | e2e + static | `shell.spec.ts` 404-in-shell + no links grep | ❌ W0 | ⬜ pending |
| TBD | — | — | SHELL-06 | — | N/A | e2e axe | `npx playwright test e2e/a11y-contact.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/guards/{test-count,check-palette,check-contrast,check-install-parity}.mjs` + baseline/ratchet JSON + `__selftest__/` fixtures
- [ ] `eslint.config.mjs` rewrite + `eslint-plugin-jsx-a11y` as a direct devDependency
- [ ] `playwright.config.ts` visual projects; `e2e/visual/routes.spec.ts`, `e2e/visual/hide-canvas.css`
- [ ] `.github/workflows/visual-baselines.yml`; `ci.yml` visual job, Node 24, ratchet step, preflight
- [ ] `lib/__tests__/motion-tokens.test.ts` (step 7a)
- [ ] `e2e/design-system.spec.ts` (step 7); `e2e/shell.spec.ts`, `e2e/a11y-contact.spec.ts`, `components/__tests__/global-error.test.tsx` (step 9)
- [ ] `e2e/perf/home-baseline.spec.ts` (step 10)
- [ ] `package.json` `lint` script chains the guards (palette + contrast enabled in step 8; self-tests from step 1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Intentional re-baseline PNGs are correct | GUARD-02, DSGN-05..10, SHELL-05 | Only a human can judge an intended visual change | Download the CI baseline artifact for steps 3, 6 (if needed), 7b–7e, 8 and 9; review diffs; sign off per commit |
| Recency-flagged packages are the official ones | DEPS-03, DEPS-04, DEPS-05 | Supply-chain judgement | Before steps 4, 5 and 6, confirm publisher and version on npm |
| Real `site.email` and `site.links.linkedin` | SHELL-03 | Values only Tim can supply | Provide both before build step 9 executes |
| Keyboard-only shell smoke pass in Firefox and WebKit | SHELL-01, SHELL-02 | Cheap local smoke ahead of VERIFY-03 (Phase 12) | Tab through nav, skip link, mobile menu on each route |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
