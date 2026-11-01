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

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Requirement-level command seeds live in `11-RESEARCH.md` §"Validation Architecture → Phase Requirements → Test Map". The planner binds them to task IDs for 11-02 onward.*

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
