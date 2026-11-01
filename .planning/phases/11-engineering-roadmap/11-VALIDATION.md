---
phase: "11"
slug: "engineering-roadmap"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-01"
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 (next/jest, jsdom) + Playwright 1.64 (`chromium`, `firefox`, local `webkit`, `visual-*` in CI only) |
| **Config file** | `jest.config.js`, `jest.setup.js`, `playwright.config.ts` |
| **Quick run command** | `npm run lint && npm run type-check && npx jest <touched paths> --silent` (lint runs every guard and `data:check`) |
| **Full suite command** | `npm run lint && npm run type-check && npm test && npx playwright test --project=chromium --project=firefox` (`PW_PROD=1` for production parity, as CI runs) |
| **Ratchet** | `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` (tests are rewritten, never deleted; jest 942 / e2e 358 floor) |
| **Estimated runtime** | ~240 seconds full, ~25 seconds quick (Phase 9–10 figures; visual suite runs only in CI) |

---

## Sampling Rate

- **After every task commit:** Run the quick command above
- **After every plan wave:** `npx jest --silent && npx playwright test e2e/projects.spec.ts e2e/roadmap.spec.ts e2e/no-webgl.spec.ts e2e/shell.spec.ts --project=chromium`, then push `ci/11-NN` and dispatch the visuals where baselines change
- **Before `/gsd-verify-work`:** Full suite plus `npm run guard:tests` green, and the visual re-baseline accepted
- **Max feedback latency:** 240 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | REQ-{XX} | T-11-01 / — | {expected secure behavior or "N/A"} | unit | `{command}` | ✅ / ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Requirement-level command seeds live in `11-RESEARCH.md` §"Validation Architecture → Phase Requirements → Test Map"; the planner binds them to task IDs.*

---

## Wave 0 Requirements

- [ ] `lib/__tests__/{route-log,log-date,risk-scale,demo-terminal,trail-profile}.test.ts` — ROUTE-01, ENG-03, ENG-05, ENG-01
- [ ] `data/__tests__/{roadmap,trail-profiles}.test.ts` — ROUTE-03, ENG-01
- [ ] `components/projects/__tests__/{RoutePanel,CaseStudy,RiskScale,Metrics,DemoTerminal,TrailGradeMark}.test.tsx` — ENG-01 to ENG-05
- [ ] `components/roadmap/__tests__/{RouteLog,RouteLogFilters}.test.tsx` — ROUTE-01, ROUTE-02 (successors of `RoadmapTimeline.test.tsx` / `RoadmapFilters.test.tsx`)
- [ ] `e2e/roadmap.spec.ts` (new); `e2e/projects.spec.ts` and `e2e/no-webgl.spec.ts` rewritten — ENG-01, ENG-02, ENG-05, ROUTE-02
- [ ] `scripts/terrain/build-trails.mjs --check` wired into `data:check` — ENG-01 (D-05)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual baselines for `projects`, `clix-cli`, `clix-website`, `roadmap` | ENG-01 to ENG-05, ROUTE-01 | Baselines come only from the CI `workflow_dispatch` container; Tim commits PNGs | Push `ci/11-NN`, dispatch the visual workflow, download and compare; Tim commits the PNGs |
| Tim's content inputs (trail pair, demo commands, behaviour lines, claims audit, link verification, route-log data, `surveyedAt`, copy) | ENG-01 to ENG-04, ROUTE-03 | Facts only Tim can supply or approve (CONTEXT D-07, D-09 to D-12, D-16, D-17, D-20) | Human-action checkpoints; inputs land as quoted text in a SUMMARY before any consumer ships |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 240s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
