---
gsd_state_version: "1.0"
milestone: v2.0
milestone_name: Topographic Identity
current_phase: 07
current_phase_name: Foundation & Guardrails
status: executing
stopped_at: Completed 07-03-PLAN.md
last_updated: "2026-10-10T21:08:02.775Z"
last_activity: 2026-10-10
last_activity_desc: Phase 07 execution started
state_head: 4de94bc4e0ef36f164de4e5ef8ee84847ced0ecb
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 26
  completed_plans: 3
  percent: 12
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-10)

**Core value:** A portfolio that is visually memorable and distinctive (not another generic Tailwind site) while being stable and well-maintained under the hood.
**Current focus:** Phase 07 — Foundation & Guardrails

## Current Position

Phase: 07 (Foundation & Guardrails) — EXECUTING
Plan: 4 of 26
Status: Ready to execute
Last activity: 2026-10-10 — Phase 07 execution started

Progress: [█░░░░░░░░░] 12%

## Performance Metrics

**Velocity (v2.0):**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion. v1.0 history: 24 plans across Phases 1-6 (see MILESTONES.md).*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 07 P01 | 11 min | 3 tasks | 35 files |
| Phase 07 P02 | 6 min | 2 tasks | 16 files |
| Phase 07 P03 | 45 min | 3 tasks | 88 files |

## Accumulated Context

### Decisions

Decisions are logged in the PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: SEO-02 (OG images for photo and project pages) sits in Phase 12, because it spans Phases 10 and 11, which run in parallel
- [Phase 7]: Upgrades land in isolated commits, in order: motion 14.1, then Next 16.4 + React 19.3 + R3F 9.8.1 + drei 10.7.9, then Playwright 1.64, each with zero visual diff
- [Phase 7]: `dark:` removal is staged: neutralise, collapse to the dark value, remove, then enable the guard
- [Phase 8]: The DEM source is swissALTIRegio (10 m, cross-border), not swissALTI3D
- [Phase 10]: `/photos` opens on the Map view; deleted playground routes resolve to the designed 404 (no redirects)
- [Phase 07]: [07-01] Phase 7 work lives on branch gsd/phase-07-foundation-guardrails (main is protected for executors); Tim merges to main
- [Phase 07]: [07-01] Test-count ratchet baseline measured at jest 66 + e2e 25 = 91; raise only via --update at phase close
- [Phase 07]: [07-01] Upgrade plans raise scripts/guards/version-floors.json floors (and forbiddenDirect) in the same commit as the upgrade
- [Phase 07]: [07-02] jsx-a11y recommended rules run at error on all JSX/TSX; React Compiler rules warn only for LEGACY_COMPILER_FILES, which must shrink to zero by Phase 12
- [Phase 07]: [07-02] Zero-diff plans run node scripts/guards/same-classnames.mjs <ref> before committing (className literal parity)
- [Phase 07]: [07-02] Plan 07-04 removes the 3 temporary globalIgnores entries and TerminalDemo.tsx from LEGACY_COMPILER_FILES when it deletes those files
- [Phase 07]: [07-03] Visual baselines come only from the workflow_dispatch job in mcr.microsoft.com/playwright:v1.60.0-noble (contents: read, artifact only); Tim reviews and commits them by hand
- [Phase 07]: [07-03] Baseline-commit checks use per-slug --allow (e.g. --allow photos); --allow-all turns off the routes.spec.ts-snapshots/<slug>/ folder check
- [Phase 07]: [07-03] Unzip the visual-baselines artifact's contents directly into e2e/visual/routes.spec.ts-snapshots/; never keep the Windows 'Extract all' wrapper folder
- [Phase 07]: [07-03] The hero scroll-arrow pin in e2e/visual/hide-canvas.css must be removed when Phase 9 replaces the hero

### Pending Todos

- Legacy image variants (-thumb/-medium/-large) are still live in `data/landscapes.ts`. Delete them in Phase 12 (VERIFY-01), only after the Phase 8 manifest exists and Phase 10 has migrated the consumers.

### Blockers/Concerns

- [Phase 7] Local node_modules lag the lockfile (next 16.1.6 / framer-motion 12.35.1 vs 16.2.6 / 12.39.0). Run `npm ci` before capturing any baseline.
- [Phase 7] A Next.js security release is due 2026-10-14; DEPS-04 must include it.
- [Phase 7] Needs from Tim: real GitHub, LinkedIn, email and role line; display-face choice in the UI-SPEC.
- [Phase 8] Needs from Tim: waterfall name/location, photo copy corrections, the swissALTIRegio attribution string, an approximate position for the film-scan photo (R004-011), and where the originals should live.
- [Phase 11] Needs from Tim: CLI_X per-grade content and Medium/Critical demo commands with `riskScore`, metric sources, roadmap order and dates.

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-10T21:08:02.750Z
Stopped at: Completed 07-03-PLAN.md
Resume file: None
