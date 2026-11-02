---
phase: "12"
slug: "contact-edge-pages-cleanup-verification"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-02"
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.4 (next/jest, jsdom; `@jest-environment node` for API routes) + Playwright 1.64 (`chromium`, `firefox`, and `webkit` once added in Wave 0; `visual-*` in CI only) + @axe-core/playwright |
| **Config file** | `jest.config.js`, `jest.setup.js`, `playwright.config.ts` |
| **Quick run command** | `npm run lint && npm run type-check && npx jest <touched paths> --silent` (lint runs every guard, `data:check` and `photos:derive --check`) |
| **Full suite command** | `npm run lint && npm run type-check && npm test && PW_PROD=1 npx playwright test --project=chromium --project=firefox --project=webkit` |
| **Guards** | `npm run data:check`; `npm run guard:selftest && npm run guard:images`; `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` (tests are rewritten, never deleted; test-count ratchet ≥ 1749 at phase start) |
| **Estimated runtime** | ~25 seconds quick; ~300 seconds full with three browser projects (visual suite runs only in CI) |

---

## Sampling Rate

- **After every task commit:** the touched Jest files plus the one relevant spec on chromium (`PW_PROD=1` for service-worker, 404 and OG-image work)
- **After every plan wave:** `npm run lint && npm run type-check && npm test`, then that wave's e2e set on chromium + firefox (+ webkit once the D-17 CSP condition lands)
- **Before `/gsd-verify-work`:** full suite green on all three projects, CI green on a `ci/12-NN` push, the visual round's expected-diff list matched, test count ≥ 1749
- **Max feedback latency:** 300 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Requirement-level command seeds live in `12-RESEARCH.md` §"Validation Architecture → Phase Requirements → Test Map". The planner binds them to task IDs.*

---

## Wave 0 Requirements

- [ ] Spike: `proxy.ts` rewrite of unknown photo/project slugs → server-rendered 404 (research assumption A1), with an `e2e/shell.spec.ts` server-HTML case (h1, one `<main>`, status 404, no JS) — EDGE-01
- [ ] `playwright.config.ts`: `serviceWorkers: 'block'` on the functional projects; `webkit` project with `grepInvert`; `--fail-on-flaky-tests` — VERIFY-03, EDGE-02
- [ ] `e2e/routes.ts` extracted from `e2e/shell.spec.ts` (shared route list for SEO, audit and keyboard specs) — SEO-01, VERIFY-02, VERIFY-04
- [ ] `lib/__tests__/service-worker-navigation.test.ts` — EDGE-02
- [ ] `data/__tests__/asset-exists.test.ts` (every `/images/`, `/terrain/`, `/media/` path in `data/**` and generated manifests exists under `public/`), landed **before** `public/images/optimized/` is deleted — VERIFY-01
- [ ] Proxy CSP unit test (both header variants; `'unsafe-eval'` dev-only; D-17 loopback condition) — VERIFY-01, VERIFY-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual baselines for contact, 404/error/offline and every route touched by the v1-alias and colour-reset removal | CONTACT-01, EDGE-01, VERIFY-01 | Baselines come only from the CI `workflow_dispatch` container; Tim commits PNGs | Push `ci/12-NN`, dispatch the visual workflow, download and compare against the expected-diff list; Tim commits the PNGs |
| Contact-page coordinates and copy | CONTACT-01 | Fact only Tim can confirm (ROADMAP "Inputs from Tim", CONTEXT D-01) | Checkpoint; Tim's literal reply quoted in the SUMMARY before the value ships |
| Shared-link previews look right (OG image legibility, crop) | SEO-02 | Judgement | Open each OG PNG at 1200×630 at the visual review |
| Keyboard-only pass feels right beyond the scripted flows | VERIFY-02 | Judgement on focus order and visibility | Manual tab-through of nav, map, lightbox and contact form during UAT |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
