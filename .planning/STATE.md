---
gsd_state_version: "1.0"
milestone: v2.0
milestone_name: Topographic Identity
current_phase: 07
current_phase_name: Foundation & Guardrails
status: executing
stopped_at: Completed 07-08-PLAN.md
last_updated: "2026-10-22T16:10:33.988Z"
last_activity: 2026-10-22
last_activity_desc: Phase 07 execution started
state_head: 23a56900bbe6f168f6bf9ae08d838f532f11ef30
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 26
  completed_plans: 8
  percent: 31
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-10)

**Core value:** A portfolio that is visually memorable and distinctive (not another generic Tailwind site) while being stable and well-maintained under the hood.
**Current focus:** Phase 07 — Foundation & Guardrails

## Current Position

Phase: 07 (Foundation & Guardrails) — EXECUTING
Plan: 9 of 26
Status: Ready to execute
Last activity: 2026-10-22 — Phase 07 execution started

Progress: [███░░░░░░░] 31%

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
| Phase 07 P04 | 2h 38m | 3 tasks | 21 files |
| Phase 07 P05 | 43 min | 3 tasks | 30 files |
| Phase 07 P06 | 10h 24m | 3 tasks | 20 files |
| Phase 07 P07 | 26 min | 3 tasks | 3 files |
| Phase 07 P08 | 3h 42m | 3 tasks | 11 files |

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
- [Phase 07]: [07-04] Re-baselines should use gh: gh workflow run visual-baselines.yml --ref ci/07-NN -f suite=visual -f update_mode=changed, then gh run download <id> -n visual-baselines -D e2e/visual/routes.spec.ts-snapshots (the browser dialog defaults to main)
- [Phase 07]: [07-04] The visual-baselines artifact carries the whole snapshot folder, so stray subfolders come back; review git status against the expected list on every re-baseline
- [Phase 07]: [07-04] GUARD-02 complete (CI Visual Regression gate live); SHELL-05 stays Pending until 07-23 ships the shell 404
- [Phase 07]: [07-05] Zero-diff exception policy: a diff that is a verified upstream bug fix, matching the code's intent, may be re-baselined with Tim's explicit approval and a documented reason (verify with check-snapshot-commit.mjs --some --allow <slug>, never --allow-all)
- [Phase 07]: [07-05] motion 14.1.0 replaces framer-motion; import from motion/react only (ESLint no-restricted-imports block, extended by 07-13); 6 home scroll-50 baselines re-baselined under the exception policy (motion 13.4.7 ViewTimeline offset fix)
- [Phase 07]: [07-05] DEPS-03 complete
- [Phase 07]: [07-06] Platform set landed on next 16.4.0 (no patched 16.4.x published yet, 5b not folded); DEPS-04 was completed by 07-07 (Next 16.4.2 security release, fdeb9fe)
- [Phase 07]: [07-06] R3F canvases render only through components/SafeCanvas.tsx (error boundary + inert canvas fallback; ESLint bans importing Canvas from @react-three/fiber), because R3F >= 9.8 rethrows WebGL-creation errors through React; scene errors now leave a blank canvas (Tim accepted)
- [Phase 07]: [07-06] 6 offline reduced-motion baselines re-baselined under the zero-diff exception policy (Option C): old baselines encoded a Next 16.2.6 SWC JSX-whitespace bug; app/offline/page.tsx now uses an explicit {' '} after </strong>
- [Phase 07]: [07-07] DEPS-04 complete: next + eslint-config-next 16.4.2, react/react-dom 19.3.1, sharp 0.35.5 (devDependency) in zero-diff commit fdeb9fe, beyond the advisory's next@16.4.1 on Tim's approval ("approve all, including later versions not specifically named"); CI run 39775685353 all green
- [Phase 07]: [07-07] version-floors.json gains a sharp floor (0.35.5, advisory minimum for CVE-2026-96889); advisory-named transitive packages get their own floor even as devDependencies
- [Phase 07]: [07-08] DEPS-05 complete: @playwright/test 1.64.0 (Chromium 156) + both workflow containers on v1.64.0-noble + floor 1.64.0 in one commit (fdd2652); 6 contact/*-reduced baselines re-baselined (Tim's option A) for the Chromium 156 textarea resize-grabber glyph (36 px in an 8x8 box), no layout/content change; CI run 39809853089 all green
- [Phase 07]: [07-08] GUARD-01 stays Pending although 07-08 is its last declaring plan: the Vercel build-log check (Node 24.x + npm ci, 07-USER-SETUP.md) from 07-01 is unconfirmed; flip it to Complete once Tim confirms

### Pending Todos

- Legacy image variants (-thumb/-medium/-large) are still live in `data/landscapes.ts`. Delete them in Phase 12 (VERIFY-01), only after the Phase 8 manifest exists and Phase 10 has migrated the consumers.

### Blockers/Concerns

- [Phase 7] Needs from Tim: real GitHub, LinkedIn, email and role line; display-face choice in the UI-SPEC.
- [Phase 8] Needs from Tim: waterfall name/location, photo copy corrections, the swissALTIRegio attribution string, an approximate position for the film-scan photo (R004-011), and where the originals should live.
- [Phase 11] Needs from Tim: CLI_X per-grade content and Medium/Critical demo commands with `riskScore`, metric sources, roadmap order and dates.
- [Phase 7] Required status checks (Visual Regression, Lint and Type Check, Unit Tests) on main are not set yet; until Tim sets them a red visual job does not block merges (07-USER-SETUP.md)
- [Phase 7] main (Vercel production) lacks the Next 16.4.2 / sharp 0.35.5 security patch until Tim merges gsd/phase-07-foundation-guardrails; GitHub reported 84 Dependabot alerts on the default branch (9 critical). Merge recommended soon.

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-10-22T16:10:33.951Z
Stopped at: Completed 07-08-PLAN.md
Resume file: None
