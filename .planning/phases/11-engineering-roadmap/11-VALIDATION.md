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
> Re-seeded 2026-11-01 for the box + coin-flip re-plan (CONTEXT D-22 to D-33). The CLI_X-era version is superseded.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 (next/jest, jsdom) + Playwright 1.64 (`chromium`, `firefox`; `visual-*` in CI only) + @axe-core/playwright 4.13.0 |
| **Config file** | `jest.config.js`, `jest.setup.js`, `playwright.config.ts` |
| **Quick run command** | `npm run lint && npm run type-check && npx jest <touched paths> --silent` (lint runs every guard, `data:check` and `guard:images`) |
| **Full suite command** | `npm run lint && npm run type-check && npx jest --silent && npx playwright test --project=chromium --project=firefox` (`PW_PROD=1` for production parity, as CI runs) |
| **Guards** | `npm run data:check`; `npm run guard:selftest && npm run guard:images`; `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` (tests are rewritten, never deleted; ratchet jest 973 + e2e 376 = 1349 after 11-01) |
| **Estimated runtime** | ~240 seconds full, ~25 seconds quick (Phase 9–11 figures; visual suite runs only in CI) |

---

## Sampling Rate

- **After every task commit:** Run the quick command above
- **After every plan wave:** `npx jest --silent && npx playwright test e2e/projects.spec.ts e2e/case-study.spec.ts e2e/roadmap.spec.ts e2e/no-webgl.spec.ts e2e/shell.spec.ts --project=chromium`, then push `ci/11-NN` and dispatch the visuals where baselines change
- **Before `/gsd-verify-work`:** Full suite (chromium + firefox, `PW_PROD=1`) plus `npm run guard:tests` green, and the visual re-baseline accepted
- **Max feedback latency:** 240 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | ENG-05 | — | N/A | unit + e2e | `npx jest lib/__tests__/demo-terminal.test.ts components/projects/__tests__/DemoTerminal.test.tsx --silent` | ✅ | ✅ green (11-01 complete) |
| 11-02-01 | 02 | 1 | ENG-03, ENG-04 | T-11-03 | per plan threat register | auto | inline check, see 11-02 Task 1 verify | created in task | ⬜ pending |
| 11-02-02 | 02 | 1 | ENG-03, ENG-04 | T-11-04 | per plan threat register | auto | inline check, see 11-02 Task 2 verify | created in task | ⬜ pending |
| 11-02-03 | 02 | 1 | ENG-03, ENG-04 | — | per plan threat register | manual (checkpoint) | checkpoint: Tim's quoted reply recorded in the SUMMARY | created in task | ⬜ pending |
| 11-03-01 | 03 | 2 | ENG-05 | T-11-06 | per plan threat register | unit/component (TDD) | inline check, see 11-03 Task 1 verify | created in task | ⬜ pending |
| 11-03-02 | 03 | 2 | ENG-05 | T-11-07 | per plan threat register | auto | `npx playwright test e2e/case-study.spec.ts e2e/no-webgl.spec.ts --project=chromium --project=firefox` | created in task | ⬜ pending |
| 11-04-01 | 04 | 1 | ENG-01 | T-11-08 | per plan threat register | unit/component (TDD) | `npx jest lib/__tests__/trail-profile.test.ts --silent` | created in task | ⬜ pending |
| 11-04-02 | 04 | 1 | ENG-01 | T-11-09 | per plan threat register | unit/component (TDD) | inline check, see 11-04 Task 2 verify | created in task | ⬜ pending |
| 11-05-01 | 05 | 1 | ROUTE-01, ROUTE-02, ROUTE-03 | T-11-10 | per plan threat register | unit/component (TDD) | `npx jest lib/__tests__/route-log.test.ts lib/__tests__/log-date.test.ts --silent && npm run type-check` | created in task | ⬜ pending |
| 11-05-02 | 05 | 1 | ROUTE-01, ROUTE-02, ROUTE-03 | T-11-10 | per plan threat register | unit/component (TDD) | inline check, see 11-05 Task 2 verify | created in task | ⬜ pending |
| 11-06-01 | 06 | 1 | ENG-01 | T-11-11 | per plan threat register | unit/component (TDD) | inline check, see 11-06 Task 1 verify | created in task | ⬜ pending |
| 11-06-02 | 06 | 1 | ENG-01 | T-11-12 | per plan threat register | auto | `npx playwright test e2e/projects.spec.ts e2e/design-system.spec.ts --project=chromium` | created in task | ⬜ pending |
| 11-07-01 | 07 | 3 | ENG-01, ENG-02, ENG-03, ENG-04, ENG-05 | T-11-13 | per plan threat register | tracer (unit + e2e) | `npx jest data/__tests__/projects.test.ts components/projects --silent && npm run lint && npm run type-check` | created in task | ⬜ pending |
| 11-07-02 | 07 | 3 | ENG-01, ENG-02, ENG-03, ENG-04, ENG-05 | T-11-14 | per plan threat register | unit/component (TDD) | `npx jest lib/__tests__/trail-grade.test.ts --silent && npm run type-check` | created in task | ⬜ pending |
| 11-07-03 | 07 | 3 | ENG-01, ENG-02, ENG-03, ENG-04, ENG-05 | T-11-15 | per plan threat register | auto | `npx jest components/site/__tests__/SiteChrome.test.tsx components/home --silent && npm run lint && npm run type-check` | created in task | ⬜ pending |
| 11-08-01 | 08 | 2 | ROUTE-01, ROUTE-02, ROUTE-03 | T-11-17 | per plan threat register | unit/component (TDD) | `npx jest data/__tests__/roadmap.test.ts --silent && npm run type-check` | created in task | ⬜ pending |
| 11-08-02 | 08 | 2 | ROUTE-01, ROUTE-02, ROUTE-03 | T-11-18 | per plan threat register | auto | `npm run lint && npm run type-check && npx jest components/roadmap data/__tests__/roadmap.test.ts --silent` | created in task | ⬜ pending |
| 11-09-01 | 09 | 2 | ENG-02 | T-11-19 | per plan threat register | unit/component (TDD) | `npm run guard:selftest && npm run guard:images` | created in task | ⬜ pending |
| 11-09-02 | 09 | 2 | ENG-02 | T-11-20 | per plan threat register | unit/component (TDD) | `npm run clip:derive -- --check && npx jest data/__tests__/media-manifest.test.ts --silent` | created in task | ⬜ pending |
| 11-09-03 | 09 | 2 | ENG-02 | T-11-21 | per plan threat register | unit/component (TDD) | inline check, see 11-09 Task 3 verify | created in task | ⬜ pending |
| 11-10-01 | 10 | 3 | ROUTE-02 | T-11-23 | per plan threat register | unit/component (TDD) | `npx jest components/roadmap/__tests__/RouteLogFilters.test.tsx --silent && npm run lint && npm run type-check` | created in task | ⬜ pending |
| 11-10-02 | 10 | 3 | ROUTE-02 | T-11-24 | per plan threat register | auto | `npx playwright test e2e/roadmap.spec.ts e2e/shell.spec.ts --project=chromium --project=firefox` | created in task | ⬜ pending |
| 11-11-01 | 11 | 4 | ENG-02 | T-11-25 | per plan threat register | unit/component (TDD) | inline check, see 11-11 Task 1 verify | created in task | ⬜ pending |
| 11-11-02 | 11 | 4 | ENG-02 | T-11-26 | per plan threat register | unit/component (TDD) | inline check, see 11-11 Task 2 verify | created in task | ⬜ pending |
| 11-12-01 | 12 | 4 | ENG-01, ENG-04 | T-11-27 | per plan threat register | unit/component (TDD) | `npm run guard:contrast && npm run guard:palette && npm run guard:selftest` | created in task | ⬜ pending |
| 11-12-02 | 12 | 4 | ENG-01, ENG-04 | T-11-28 | per plan threat register | unit/component (TDD) | inline check, see 11-12 Task 2 verify | created in task | ⬜ pending |
| 11-12-03 | 12 | 4 | ENG-01, ENG-04 | T-11-28 | per plan threat register | unit/component (TDD) | inline check, see 11-12 Task 3 verify | created in task | ⬜ pending |
| 11-13-01 | 13 | 5 | ENG-02, ENG-04, ROUTE-01 | T-11-29 | per plan threat register | unit/component (TDD) | inline check, see 11-13 Task 1 verify | created in task | ⬜ pending |
| 11-13-02 | 13 | 5 | ENG-02, ENG-04, ROUTE-01 | T-11-30 | per plan threat register | unit/component (TDD) | `npx jest components/projects data/__tests__/projects.test.ts --silent && npm run lint && npm run type-check` | created in task | ⬜ pending |
| 11-14-01 | 14 | 5 | ENG-02 | T-11-31 | per plan threat register | unit/component (TDD) | inline check, see 11-14 Task 1 verify | created in task | ⬜ pending |
| 11-14-02 | 14 | 5 | ENG-02 | T-11-32 | per plan threat register | auto | `npx playwright test e2e/case-study-page.spec.ts e2e/case-study.spec.ts --project=chromium --project=firefox` | created in task | ⬜ pending |
| 11-15-01 | 15 | 5 | ENG-02 | T-11-33 | per plan threat register | unit/component (TDD) | `npx jest components/projects/__tests__/DemoClip.test.tsx --silent && npm run lint && npm run type-check` | created in task | ⬜ pending |
| 11-15-02 | 15 | 5 | ENG-02 | — | per plan threat register | manual (checkpoint) | checkpoint: Tim's quoted reply recorded in the SUMMARY | created in task | ⬜ pending |
| 11-15-03 | 15 | 5 | ENG-02 | T-11-34 | per plan threat register | auto | `npm run clip:derive -- --check && npm run guard:images && npx jest data/__tests__/media-manifest.test.ts --silent` | created in task | ⬜ pending |
| 11-16-01 | 16 | 6 | ENG-02 | — | per plan threat register | manual (checkpoint) | checkpoint: Tim's quoted reply recorded in the SUMMARY | created in task | ⬜ pending |
| 11-16-02 | 16 | 6 | ENG-02 | T-11-36 | per plan threat register | auto | inline check, see 11-16 Task 2 verify | created in task | ⬜ pending |
| 11-17-01 | 17 | 7 | ENG-01, ENG-02, ENG-04, ENG-05, ROUTE-01, ROUTE-02, ROUTE-03 | T-11-37 | per plan threat register | auto | `git ls-remote origin refs/heads/ci/11-17` | created in task | ⬜ pending |
| 11-17-02 | 17 | 7 | ENG-01, ENG-02, ENG-04, ENG-05, ROUTE-01, ROUTE-02, ROUTE-03 | — | per plan threat register | manual (checkpoint) | checkpoint: Tim's quoted reply recorded in the SUMMARY | created in task | ⬜ pending |
| 11-17-03 | 17 | 7 | ENG-01, ENG-02, ENG-04, ENG-05, ROUTE-01, ROUTE-02, ROUTE-03 | T-11-39 | per plan threat register | auto | inline check, see 11-17 Task 3 verify | created in task | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Requirement-level command seeds live in `11-RESEARCH.md` §"Validation Architecture → Phase Requirements → Test Map"; the rows above bind them to the 11-02 to 11-17 tasks (plan-phase re-plan, 2026-11-01). Each TDD task creates its own test file before the implementation, so no task depends on a missing test.*

---

## Wave 0 Requirements

- [ ] `lib/__tests__/{route-log,log-date,trail-profile}.test.ts` — ROUTE-01, ENG-01
- [ ] `data/__tests__/{roadmap,trail-profiles,media-manifest}.test.ts` — ROUTE-03, ENG-01, D-27
- [ ] `components/projects/__tests__/{RoutePanel,RouteProfile,TrailGradeMark,CaseStudy,Metrics,DemoClip}.test.tsx` — ENG-01, ENG-02, ENG-04, D-27
- [ ] `components/roadmap/__tests__/{RouteLog,RouteLogFilters}.test.tsx` — ROUTE-01, ROUTE-02 (successors of `RoadmapTimeline.test.tsx` / `RoadmapFilters.test.tsx`)
- [ ] `e2e/roadmap.spec.ts` (new); `e2e/projects.spec.ts`, `e2e/case-study.spec.ts`, `e2e/shell.spec.ts`, `e2e/no-webgl.spec.ts` rewritten for box + coin-flip — ENG-01, ENG-02, ENG-05, ROUTE-02
- [ ] `scripts/guards/__selftest__/served-images/` MP4 fixtures + selftest cases; `scripts/guards/lib/mp4-boxes.mjs` — D-27
- [ ] `scripts/terrain/build-trails.mjs --check` and `scripts/media/build-clip.mjs --check` wired into `data:check` — ENG-01 (D-05), D-27

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual baselines for `projects`, `box`, `coin-flip`, `roadmap`, `home` (the `clix-cli` and `clix-website` folders leave) | ENG-01 to ENG-05, ROUTE-01, D-33 | Baselines come only from the CI `workflow_dispatch` container; Tim commits PNGs | Push `ci/11-NN`, dispatch the visual workflow, download and compare; Tim commits the PNGs and removes the `clix-*` folders |
| Tim's content inputs: claims audit, copy (incl. box terminal transcript, box Safety capture, Home About sentence), route-log rows and `surveyedAt`, packet §I UI defaults | ENG-02, ENG-04, ENG-05, ROUTE-03 | Facts and wording only Tim can approve (CONTEXT D-09, D-16, D-17, D-20, D-21, D-25, D-26, D-32, D-33) | Checkpoints; each input lands as quoted text in a SUMMARY before any consumer ships |
| coin-flip clip | D-27 | Needs Tim's device recording (human action) | Tim drops the file in the folder the plan names; Claude trims, encodes, strips metadata and extracts the poster. Without it, coin-flip ships with no Demo section |
| Glyph look, terminal and clip visual quality, copy tone | ENG-01, ENG-05 | Judgement | Visual review at the re-baseline |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 240s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
