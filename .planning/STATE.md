---
gsd_state_version: "1.0"
milestone: v2.1
milestone_name: Survey Expansion
status: planning
last_updated: "2026-11-12T21:30:00.000Z"
last_activity: 2026-11-12
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-11-12)

**Core value:** A portfolio that is visually memorable and distinctive (not another generic Tailwind site) while being stable and well-maintained under the hood.
**Current focus:** Phase 13 — Repo Safety & Test Debt

## Current Position

Phase: 13 of 19 (Repo Safety & Test Debt)
Plan: Not started
Status: Ready to plan
Last activity: 2026-11-12 — v2.1 roadmap created (Phases 13-19, 38/38 requirements mapped)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity (v2.1):**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion. v2.0: 128 plans in 6 phases, about 70 hours of plan execution; the per-plan table is in `.planning/milestones/v2.0-STATE.md`.*

## Accumulated Context

### Decisions

Key decisions are in the PROJECT.md Key Decisions table. The full per-plan log for v2.0 is in `.planning/milestones/v2.0-STATE.md`.
Recent decisions affecting current work:

- [Roadmap]: 7 phases (13-19) in strict order: repo safety → UI fixes → pixel-neutral data model → new content → routes and SEO → immersive layout → drone loops
- [Phase 15]: The data and plate refactor is pixel- and hash-neutral (every baseline unchanged, Matterhorn terrain hashes unchanged); new content waits for Phase 16
- [Phase 16]: Launch regions stay inside the swissALTIRegio footprint; Copernicus GLO-90 feeds only the overview; proj4 only if the measured `lib/geo.ts` error requires it
- [Phase 17]: Photo URLs stay `/photos/<slug>` with no redirects; the region path is fixed after the static-sibling intercept spike
- [Phase 18]: The Map/Grid/Carousel switch is retired; map collar, altimeter rail, sheet-index rectangles and 3-5 reference summits are in scope; credits go in each sheet margin plus a `/sources` page

### Pending Todos

None carried from v2.0.

### Blockers/Concerns

- [Phase 13] The production Upstash variables are not confirmed, and `lib/rate-limit.ts` allows every request without them (GUARD-09). Seeing them set in Vercel settles the names; `PROD_FORM_LIMIT=1 npm run test:prod-form` proves the 429 but locks the IP out for up to an hour.
- [Phase 13] `main` has no branch protection or required checks, so a red PR can merge and Vercel deploys it; `[ci skip]` commits produce no checks (GUARD-07, GUARD-08). Tim applies the settings.
- [Phase 16] Needs Tim's inputs before planning can finish: the launch regions (inside the footprint, at least one in Italy or Austria), the new originals and the coarse-location choice per photo.
- [Phase 19] Needs a graded drone clip from Tim before any byte budget is fixed.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 261105-wlf | Verify unknown-slug miss path returns 404 on www.tlui.de | 2026-11-05 | none (no code change) | [261105-wlf-verify-unknown-slug-miss-path-returns-40](./quick/261105-wlf-verify-unknown-slug-miss-path-returns-40/) |
| 261105-wty | Switch canonical host to www.tlui.de (site.url, canFetchNeutral, seo/og/not-found specs) | 2026-11-05 | 2b92371 | [261105-wty-switch-canonical-host-to-www-tlui-de-sit](./quick/261105-wty-switch-canonical-host-to-www-tlui-de-sit/) |
| 261106-joo | Dependabot cleanup A+D: dependabot.yml, parity fixture manifests, one-shot flake tolerance, seven debug sessions closed | 2026-11-06 | 85d7248 | [261106-joo-dependabot-cleanup-a-d-dependabot-yml-fi](./quick/261106-joo-dependabot-cleanup-a-d-dependabot-yml-fi/) |
| 261106-mzc | E2E reliability: E2E in the Playwright image, focus trap skips hidden controls, nav menu ignores photo steps, case-study axe measures final colours | 2026-11-06 | 8239f91 | [261106-mzc-e2e-reliability-run-e2e-in-the-playwrigh](./quick/261106-mzc-e2e-reliability-run-e2e-in-the-playwrigh/) |
| 261106-qvn | Dependabot group C: next, resend, upstash, three, motion, Playwright 1.64.1, axe 4.14 with 14 names, Tailwind 4.3.4 with the note in Inter | 2026-11-06 | a5fa14a | [261106-qvn-dependabot-group-c-dependency-batches-ax](./quick/261106-qvn-dependabot-group-c-dependency-batches-ax/) |
| 261106-www | Drop the unused Google Analytics env placeholder and correct the codebase docs that name it | 2026-11-06 | 35ff92b | [261106-www-drop-the-unused-google-analytics-env-pla](./quick/261106-www-drop-the-unused-google-analytics-env-pla/) |

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| debug_sessions | 12-slug-script-data | resolved | 2026-11-05 | v2.0 |
| debug_sessions | e2e-test-ci-failures | resolved | 2026-11-05 | v2.0 |
| debug_sessions | eslint10-ci-failures | superseded | 2026-11-05 | v2.0 |
| debug_sessions | hero-scrim-over-rail | resolved | 2026-11-05 | v2.0 |
| debug_sessions | hidden-tab-burst-decline | resolved | 2026-11-05 | v2.0 |
| debug_sessions | summit-pins-under-plaque | resolved | 2026-11-05 | v2.0 |
| debug_sessions | waypoint2-label-and-kicker | resolved | 2026-11-05 | v2.0 |
| uat_gaps | 03/03-UAT.md (archived v1.0) | diagnosed | 2026-11-05 | v2.0 |
| verification_gaps | 04/04-VERIFICATION.md (archived v1.0) | human_needed | 2026-11-05 | v2.0 |
| verification_gaps | 05/05-VERIFICATION.md (archived v1.0) | human_needed | 2026-11-05 | v2.0 |
| deferred_items | 08/deferred-items.md: Home overflows horizontally at 375 px | acknowledged (now HOME-09, Phase 14) | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: Rail tick label "2,760 m approx." measures 4.81:1 at 768 px | acknowledged (now HOME-10, Phase 14) | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: R3F 9 logs the THREE.Clock deprecation warning on every canvas mount | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: Static poster at about 768-1090 px hides waypoint 3's pin label while it is active | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: S3, phone summit shots cut off pin 4 and the summit triangle | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: Reduced motion, full summit plaque covers the poster pins at 375 x 667 | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 12/deferred-items.md: Switch the canonical host to www.tlui.de once the domain is live | resolved | 2026-11-05 | v2.0 |
| deferred_items | 12/deferred-items.md: caniuse-lite is 7 months old in the production build | acknowledged | 2026-11-05 | v2.0 |

Acknowledging records the item; it doesn't fix it. Still open from this table: the `THREE.Clock` warning and the `caniuse-lite` refresh. The seven debug sessions were closed on 2026-11-06 and moved to `.planning/debug/resolved/`: the four Phase 9 ones were fixed by plans 09-15 to 09-21, `12-slug-script-data` by Phase 12 and 261105-wty, `e2e-test-ci-failures` by 241cbbf and 369130e, and `eslint10-ci-failures` is superseded, because 5deb55c took ESLint back to 9.x.

## Session Continuity

Last session: 2026-11-12
Stopped at: v2.1 roadmap created; awaiting Tim's approval, then `/gsd-plan-phase 13`
Resume file: None
