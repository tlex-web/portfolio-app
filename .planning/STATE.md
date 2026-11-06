---
gsd_state_version: "1.0"
milestone: v2.0
status: Awaiting next milestone
stopped_at: Milestone v2.0 archived
last_updated: "2026-11-06T13:43:26.471Z"
last_activity: 2026-11-05
last_activity_desc: Milestone v2.0 completed and archived
state_head: 85d7248456b1ba1ba64d20ffaffc6d72fb477f7c
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 128
  completed_plans: 128
  percent: 100
milestone_name: Topographic Identity
current_phase: 12
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-11-05)

**Core value:** A portfolio that is visually memorable and distinctive (not another generic Tailwind site) while being stable and well-maintained under the hood.
**Current focus:** Planning the next milestone

## Current Position

Phase: none. v2.0 is archived, and the next milestone starts at Phase 13.
Status: Awaiting next milestone
Last activity: 2026-11-06 - Completed quick task 261106-qvn: Dependabot group C (dependency batches, axe 4.14 names, Tailwind 4.3.4)

Progress: [██████████] 100% of v2.0

## Performance Metrics

**v2.0:** 128 plans in 6 phases, about 70 hours of plan execution. The per-plan table is in `.planning/milestones/v2.0-STATE.md`.

## Accumulated Context

### Decisions

Key decisions are in the PROJECT.md Key Decisions table. The full per-plan log for v2.0 is in `.planning/milestones/v2.0-STATE.md`.

### Pending Todos

None carried from v2.0.

### Blockers/Concerns

- [v2.0 close, 2026-11-05] The production Upstash variables are not confirmed, and `lib/rate-limit.ts` allows every request without them. Seeing them set in Vercel settles it, or `PROD_FORM_LIMIT=1 npm run test:prod-form`, which locks the IP out for up to an hour. A real send was confirmed on 2026-11-06: Tim sent the live form and received the email.
- [v2.0 audit, 2026-11-05] `main` has no branch protection or required checks, so a red PR can merge and Vercel deploys it. Commits marked `[ci skip]` produce no checks, which matters once checks are required.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 261105-wlf | Verify unknown-slug miss path returns 404 on www.tlui.de | 2026-11-05 | none (no code change) | [261105-wlf-verify-unknown-slug-miss-path-returns-40](./quick/261105-wlf-verify-unknown-slug-miss-path-returns-40/) |
| 261105-wty | Switch canonical host to www.tlui.de (site.url, canFetchNeutral, seo/og/not-found specs) | 2026-11-05 | 2b92371 | [261105-wty-switch-canonical-host-to-www-tlui-de-sit](./quick/261105-wty-switch-canonical-host-to-www-tlui-de-sit/) |
| 261106-joo | Dependabot cleanup A+D: dependabot.yml, parity fixture manifests, one-shot flake tolerance, seven debug sessions closed | 2026-11-06 | 85d7248 | [261106-joo-dependabot-cleanup-a-d-dependabot-yml-fi](./quick/261106-joo-dependabot-cleanup-a-d-dependabot-yml-fi/) |
| 261106-mzc | E2E reliability: E2E in the Playwright image, focus trap skips hidden controls, nav menu ignores photo steps, case-study axe measures final colours | 2026-11-06 | 8239f91 | [261106-mzc-e2e-reliability-run-e2e-in-the-playwrigh](./quick/261106-mzc-e2e-reliability-run-e2e-in-the-playwrigh/) |
| 261106-qvn | Dependabot group C: next, resend, upstash, three, motion, Playwright 1.64.1, axe 4.14 with 14 names, Tailwind 4.3.4 with the note in Inter | 2026-11-06 | a5fa14a | [261106-qvn-dependabot-group-c-dependency-batches-ax](./quick/261106-qvn-dependabot-group-c-dependency-batches-ax/) |

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
| deferred_items | 08/deferred-items.md: Home overflows horizontally at 375 px | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: Rail tick label "2,760 m approx." measures 4.81:1 at 768 px | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: R3F 9 logs the THREE.Clock deprecation warning on every canvas mount | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: Static poster at about 768-1090 px hides waypoint 3's pin label while it is active | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: S3, phone summit shots cut off pin 4 and the summit triangle | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: Reduced motion, full summit plaque covers the poster pins at 375 x 667 | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 12/deferred-items.md: Switch the canonical host to www.tlui.de once the domain is live | resolved | 2026-11-05 | v2.0 |
| deferred_items | 12/deferred-items.md: caniuse-lite is 7 months old in the production build | acknowledged | 2026-11-05 | v2.0 |

Acknowledging records the item; it doesn't fix it. Still open from this table: the `THREE.Clock` warning and the `caniuse-lite` refresh. The seven debug sessions were closed on 2026-11-06 and moved to `.planning/debug/resolved/`: the four Phase 9 ones were fixed by plans 09-15 to 09-21, `12-slug-script-data` by Phase 12 and 261105-wty, `e2e-test-ci-failures` by 241cbbf and 369130e, and `eslint10-ci-failures` is superseded, because 5deb55c took ESLint back to 9.x.

## Session Continuity

Last session: 2026-11-05
Stopped at: Milestone v2.0 archived
Resume file: None
