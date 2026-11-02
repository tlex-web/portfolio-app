---
phase: "11"
slug: "engineering-roadmap"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: true) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
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
| **Guards** | `npm run data:check`; `npm run guard:selftest && npm run guard:images`; `npx jest --json --outputFile=jest-results.json --silent && npm run guard:tests` (tests are rewritten, never deleted; ratchet jest 1289 + e2e 460 = 1749 (b9ec33f)) |
| **Estimated runtime** | ~240 seconds full, ~25 seconds quick (Phase 9–11 figures; visual suite runs only in CI) |

---

## Sampling Rate

- **After every task commit:** Run the quick command above
- **After every plan wave:** `npx jest --silent && npx playwright test e2e/projects.spec.ts e2e/case-study.spec.ts e2e/case-study-page.spec.ts e2e/demo-clip.spec.ts e2e/roadmap.spec.ts e2e/no-webgl.spec.ts e2e/shell.spec.ts --project=chromium`, then push `ci/11-NN` and dispatch the visuals where baselines change
- **Before `/gsd-verify-work`:** Full suite (chromium + firefox, `PW_PROD=1`) plus `npm run guard:tests` green, and the visual re-baseline accepted
- **Max feedback latency:** 240 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-02 | 01 | 1 | ENG-05 | — | N/A | lint + type + e2e | `npm run lint && npm run type-check && npx playwright test e2e/no-webgl.spec.ts e2e/case-study.spec.ts --project=chromium` | ✅ | ✅ green |
| 11-01-01 | 01 | 1 | ENG-05 | — | N/A | unit | `npx jest lib/__tests__/demo-terminal.test.ts components/projects/__tests__/DemoTerminal.test.tsx --silent` | ✅ | ✅ green (11-01 complete) |
| 11-02-01 | 02 | 1 | ENG-03 (dropped, D-24), ENG-04 | T-11-03 | per plan threat register | auto | inline check, see 11-02 Task 1 verify | ✅ | ✅ green |
| 11-02-02 | 02 | 1 | ENG-03 (dropped, D-24), ENG-04 | T-11-04 | per plan threat register | auto | inline check, see 11-02 Task 2 verify | ✅ | ✅ green |
| 11-02-03 | 02 | 1 | ENG-03 (dropped, D-24), ENG-04 | — | per plan threat register | manual (checkpoint) | checkpoint: Tim's quoted reply recorded in the SUMMARY | ✅ | ✅ green (Tim checkpoint, quoted in SUMMARY) |
| 11-03-01 | 03 | 2 | ENG-05 | T-11-06 | per plan threat register | unit/component (TDD) | `npx jest lib/__tests__/demo-terminal.test.ts components/projects/__tests__/DemoTerminal.test.tsx --silent` | ✅ | ✅ green |
| 11-03-02 | 03 | 2 | ENG-05 | T-11-07 | per plan threat register | auto | `npx playwright test e2e/case-study.spec.ts e2e/no-webgl.spec.ts --project=chromium --project=firefox` | ✅ | ✅ green |
| 11-04-01 | 04 | 1 | ENG-01 | T-11-08 | per plan threat register | unit/component (TDD) | `npx jest lib/__tests__/trail-profile.test.ts --silent` | ✅ | ✅ green |
| 11-04-02 | 04 | 1 | ENG-01 | T-11-09 | per plan threat register | unit/component (TDD) | `npm run trails:build -- --check && npx jest data/__tests__/trail-profiles.test.ts data/__tests__/terrain.test.ts --silent` (offline guarantee: only `trails:fetch` references fetch-trails.mjs, e328587) | ✅ | ✅ green |
| 11-05-01 | 05 | 1 | ROUTE-01, ROUTE-02, ROUTE-03 | T-11-10 | per plan threat register | unit/component (TDD) | `npx jest lib/__tests__/route-log.test.ts lib/__tests__/log-date.test.ts --silent && npm run type-check` | ✅ | ✅ green |
| 11-05-02 | 05 | 1 | ROUTE-01, ROUTE-02, ROUTE-03 | T-11-10 | per plan threat register | unit/component (TDD) | `npx jest components/roadmap/__tests__/RouteLog.test.tsx lib/__tests__/route-log.test.ts --silent` | ✅ | ✅ green |
| 11-06-01 | 06 | 1 | ENG-01 | T-11-11 | per plan threat register | unit/component (TDD) | `npx jest components/projects/__tests__/RoutePanel.test.tsx components/projects/__tests__/projects-page.test.tsx --silent` | ✅ | ✅ green |
| 11-06-02 | 06 | 1 | ENG-01 | T-11-12 | per plan threat register | auto | `npx playwright test e2e/projects.spec.ts e2e/design-system.spec.ts --project=chromium` | ✅ | ✅ green |
| 11-07-01 | 07 | 3 | ENG-01, ENG-02, ENG-03 (dropped, D-24), ENG-04, ENG-05 | T-11-13 | per plan threat register | tracer (unit + e2e) | `npx jest data/__tests__/projects.test.ts components/projects --silent && npm run lint && npm run type-check && npx playwright test e2e/case-study.spec.ts e2e/no-webgl.spec.ts e2e/shell.spec.ts e2e/projects.spec.ts --project=chromium` | ✅ | ✅ green |
| 11-08-01 | 08 | 2 | ROUTE-01, ROUTE-02, ROUTE-03 | T-11-17 | per plan threat register | unit/component (TDD) | `npx jest data/__tests__/roadmap.test.ts --silent && npm run type-check` | ✅ | ✅ green |
| 11-08-02 | 08 | 2 | ROUTE-01, ROUTE-02, ROUTE-03 | T-11-18 | per plan threat register | auto | `npm run lint && npm run type-check && npx jest components/roadmap data/__tests__/roadmap.test.ts --silent && npx playwright test e2e/roadmap.spec.ts e2e/shell.spec.ts --project=chromium` | ✅ | ✅ green |
| 11-09-01 | 09 | 2 | ENG-02 | T-11-19 | per plan threat register | unit/component (TDD) | `npm run guard:selftest && npm run guard:images` | ✅ | ✅ green |
| 11-09-02 | 09 | 2 | ENG-02 | T-11-20 | per plan threat register | unit/component (TDD) | `npm run clip:derive -- --check && npx jest data/__tests__/media-manifest.test.ts --silent` | ✅ | ✅ green |
| 11-09-03 | 09 | 2 | ENG-02 | T-11-21 | per plan threat register | unit/component (TDD) | `npx jest lib/__tests__/service-worker-media.test.ts data/__tests__/precache.test.ts --silent` (D-27 delivery config: media/ proxy skip, immutable header, clips-original gitignored, e328587) | ✅ | ✅ green |
| 11-10-01 | 10 | 3 | ROUTE-02 | T-11-23 | per plan threat register | unit/component (TDD) | `npx jest components/roadmap/__tests__/RouteLogFilters.test.tsx --silent && npm run lint && npm run type-check` | ✅ | ✅ green |
| 11-10-02 | 10 | 3 | ROUTE-02 | T-11-24 | per plan threat register | auto | `npx playwright test e2e/roadmap.spec.ts e2e/shell.spec.ts --project=chromium --project=firefox` | ✅ | ✅ green |
| 11-11-01 | 11 | 4 | ENG-02 | T-11-25 | per plan threat register | unit/component (TDD) | `npx jest components/projects/__tests__/CaseStudy.test.tsx components/projects/__tests__/sections.test.tsx --silent` | ✅ | ✅ green |
| 11-11-02 | 11 | 4 | ENG-02 | T-11-26 | per plan threat register | unit/component (TDD) | `npx jest components/projects/__tests__/CaseStudy.test.tsx components/projects/__tests__/sections.test.tsx --silent && npx playwright test e2e/case-study.spec.ts --project=chromium` | ✅ | ✅ green |
| 11-12-01 | 12 | 5 | ENG-01, ENG-04 | T-11-27 | per plan threat register | unit/component (TDD) | `npm run guard:contrast && npm run guard:palette && npm run guard:selftest && npx jest components/projects/__tests__/TrailGradeMark.test.tsx --silent` | ✅ | ✅ green |
| 11-12-02 | 12 | 5 | ENG-01, ENG-04 | T-11-28 | per plan threat register | unit/component (TDD) | `npx jest components/projects/__tests__/RouteProfile.test.tsx data/__tests__/trail-profiles.test.ts --silent` | ✅ | ✅ green |
| 11-12-03 | 12 | 5 | ENG-01, ENG-04 | T-11-28 | per plan threat register | unit/component (TDD) | `npx jest components/projects/__tests__/RoutePanel.test.tsx components/projects/__tests__/projects-page.test.tsx --silent && npx playwright test e2e/projects.spec.ts --project=chromium` | ✅ | ✅ green |
| 11-13-01 | 13 | 5 | ENG-02, ENG-04, ROUTE-01 | T-11-29 | per plan threat register | unit/component (TDD) | `npx jest components/projects/__tests__/Metrics.test.tsx --silent` (tile values Mono + tabular-nums, e328587) | ✅ | ✅ green |
| 11-13-02 | 13 | 5 | ENG-02, ENG-04, ROUTE-01 | T-11-30 | per plan threat register | unit/component (TDD) | `npx jest components/projects data/__tests__/projects.test.ts --silent && npm run lint && npm run type-check && npx playwright test e2e/case-study.spec.ts e2e/roadmap.spec.ts --project=chromium` | ✅ | ✅ green |
| 11-14-01 | 14 | 6 | ENG-02 | T-11-31 | per plan threat register | unit/component (TDD) | `npx jest components/projects/__tests__/RouteIndex.test.tsx components/projects/__tests__/EndBlock.test.tsx --silent` (incl. RouteIndex "marks nothing current after a sweep to the end jumps back to the top" and case-study-page.spec "the index marks nothing current after a sweep", 2fadace, 56c11bf) | ✅ | ✅ green |
| 11-14-02 | 14 | 6 | ENG-02 | T-11-32 | per plan threat register | auto | `npx playwright test e2e/case-study-page.spec.ts e2e/case-study.spec.ts --project=chromium --project=firefox` | ✅ | ✅ green |
| 11-15-01 | 15 | 5 | ENG-02 | T-11-33 | per plan threat register | unit/component (TDD) | `npx jest components/projects/__tests__/DemoClip.test.tsx --silent && npm run lint && npm run type-check && PW_PROD=1 npx playwright test e2e/demo-clip.spec.ts --project=chromium` | ✅ | ✅ green |
| 11-15-02 | 15 | 5 | ENG-02 | — | per plan threat register | manual (checkpoint) | checkpoint: Tim's quoted reply recorded in the SUMMARY | ✅ | ✅ green (Tim checkpoint, quoted in SUMMARY) |
| 11-15-03 | 15 | 5 | ENG-02 | T-11-34 | per plan threat register | auto | `npm run clip:derive -- --check && npm run guard:images && npx jest data/__tests__/media-manifest.test.ts --silent` | ✅ | ✅ green |
| 11-16-01 | 16 | 7 | ENG-02 | — | per plan threat register | manual (checkpoint) | checkpoint: Tim's quoted reply recorded in the SUMMARY | ✅ | ✅ green (Tim checkpoint, quoted in SUMMARY) |
| 11-16-02 | 16 | 7 | ENG-02 | T-11-36 | per plan threat register | auto | `npx jest components/projects data/__tests__/media-manifest.test.ts --silent && npm run clip:derive -- --check && npm run guard:images && PW_PROD=1 npx playwright test e2e/demo-clip.spec.ts e2e/case-study-page.spec.ts --project=chromium` (clip minimum 4 s, Tim-approved 55a7448; E18 load-failure e2e, e328587) | ✅ | ✅ green |
| 11-17-01 | 17 | 8 | ENG-01, ENG-02, ENG-04, ENG-05, ROUTE-01, ROUTE-02, ROUTE-03 | T-11-37 | per plan threat register | auto | `git ls-remote origin refs/heads/ci/11-17` | ✅ | ✅ green |
| 11-17-02 | 17 | 8 | ENG-01, ENG-02, ENG-04, ENG-05, ROUTE-01, ROUTE-02, ROUTE-03 | — | per plan threat register | manual (checkpoint) | checkpoint: Tim's quoted reply recorded in the SUMMARY | ✅ | ✅ green (Tim checkpoint, quoted in SUMMARY) |
| 11-17-03 | 17 | 8 | ENG-01, ENG-02, ENG-04, ENG-05, ROUTE-01, ROUTE-02, ROUTE-03 | T-11-39 | per plan threat register | auto | `node scripts/ci/check-snapshot-commit.mjs && npm run guard:tests` | ✅ | ✅ green |
| 11-18-01 | 18 | 4 | ENG-01, ENG-02, ENG-03 (dropped, D-24) | — | per plan threat register | unit/component (TDD) | `npx jest lib/__tests__/trail-grade.test.ts --silent && npm run type-check` | ✅ | ✅ green |
| 11-18-02 | 18 | 4 | ENG-01, ENG-02, ENG-03 (dropped, D-24) | T-11-40, T-11-41 | per plan threat register | auto (unit + e2e) | `npx jest components/site/__tests__/SiteChrome.test.tsx components/home --silent && npm run lint && npm run type-check && npx playwright test e2e/home-ascent.spec.ts e2e/homepage.spec.ts --project=chromium` | ✅ | ✅ green |

*Notes: Jest 1289/1289 at 63e212e; e2e and visual green in CI run 41367381672 attempts 1 and 2 on e511d7a. Clip minimum is 4 s (Tim-approved, 55a7448; media-manifest.test "accepts 4 and 10 seconds and rejects 3.9 or 10.1 seconds"); media-manifest tests renamed in 1b807ed.*

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Requirement-level command seeds live in `11-RESEARCH.md` §"Validation Architecture → Phase Requirements → Test Map"; the rows above bind them to the 11-02 to 11-18 tasks (11-18 holds the former 11-07 Tasks 2 and 3, split off at plan-check revision 1) (plan-phase re-plan, 2026-11-01). Each TDD task creates its own test file before the implementation, so no task depends on a missing test.*

---

## Wave 0 Requirements

- [x] `lib/__tests__/{route-log,log-date,trail-profile}.test.ts` — ROUTE-01, ENG-01
- [x] `data/__tests__/{roadmap,trail-profiles,media-manifest}.test.ts` — ROUTE-03, ENG-01, D-27
- [x] `components/projects/__tests__/{RoutePanel,RouteProfile,TrailGradeMark,CaseStudy,Metrics,DemoClip}.test.tsx` — ENG-01, ENG-02, ENG-04, D-27
- [x] `components/roadmap/__tests__/{RouteLog,RouteLogFilters}.test.tsx` — ROUTE-01, ROUTE-02 (successors of `RoadmapTimeline.test.tsx` / `RoadmapFilters.test.tsx`)
- [x] `e2e/roadmap.spec.ts` (new); `e2e/projects.spec.ts`, `e2e/case-study.spec.ts`, `e2e/shell.spec.ts`, `e2e/no-webgl.spec.ts` rewritten for box + coin-flip — ENG-01, ENG-02, ENG-05, ROUTE-02
- [x] Created during execution: `components/projects/__tests__/{sections,RouteIndex,EndBlock,projects-page}.test.tsx`, `lib/__tests__/{trail-grade,service-worker-media}.test.ts`, `e2e/case-study-page.spec.ts`, `e2e/demo-clip.spec.ts`
- [x] `scripts/guards/__selftest__/served-images/` MP4 fixtures + selftest cases; `scripts/guards/lib/mp4-boxes.mjs` — D-27
- [x] `scripts/terrain/build-trails.mjs --check` and `scripts/media/build-clip.mjs --check` wired into `data:check` — ENG-01 (D-05), D-27

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual baselines for `projects`, `box`, `coin-flip`, `roadmap`, `home` (the `clix-*` folders are removed: done) | ENG-01 to ENG-05, ROUTE-01, D-33 | Baselines come only from the CI `workflow_dispatch` container; done in e511d7a, Visual green twice (run 41367381672) | Push `ci/11-NN`, dispatch the visual workflow, download and compare; Tim commits the PNGs and removes the `clix-*` folders |
| Tim's content inputs: claims audit, copy (incl. box terminal transcript, box Safety capture, Home About sentence), route-log rows and `surveyedAt`, packet §I UI defaults | ENG-02, ENG-04, ENG-05, ROUTE-03 | Facts and wording only Tim can approve (CONTEXT D-09, D-16, D-17, D-20, D-21, D-25, D-26, D-32, D-33) | Checkpoints; each input lands as quoted text in a SUMMARY before any consumer ships |
| coin-flip clip | D-27 | Device recording was Tim's (done: 4.42 s clip approved in 11-16, shipped with a Demo section) | Real H.264 playback stays manual: Playwright Chromium has no H.264 |
| Glyph look, terminal and clip visual quality, copy tone | ENG-01, ENG-05 | Judgement | Visual review at the re-baseline |
| Tim checkpoints 11-02-03, 11-15-02, 11-16-01, 11-17-02; claims audit and copy approval | ENG-02 to ENG-05 | Human approval | Quoted replies in SUMMARYs |
| D-34 v2.0-tag box build for captures | ENG-05 | Needs the tagged build | Build box at the v2.0 tag |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 240s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-11-02 (4 gaps filled, 0 escalated)

## Validation Audit 2026-11-02

| Metric | Count |
|---|---|
| Gaps found | 4 |
| Resolved | 4 |
| Escalated | 0 |
