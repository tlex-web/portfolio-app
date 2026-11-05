---
gsd_state_version: "1.0"
milestone: v2.0
status: Awaiting next milestone
stopped_at: Milestone v2.0 archived
last_updated: "2026-11-05T22:59:35.426Z"
last_activity: 2026-11-05
last_activity_desc: Milestone v2.0 completed and archived
state_head: 2b923714ef3fe1f3a3cb1606fa366e08e1933b11
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
Last activity: 2026-11-05 - Completed quick task 261105-wty: Switch canonical host to www.tlui.de (site.url, canFetchNeutral, seo/og/not-found specs); live retest pending deploy

Progress: [██████████] 100% of v2.0

## Performance Metrics

**v2.0:** 128 plans in 6 phases, about 70 hours of plan execution. The per-plan table is in `.planning/milestones/v2.0-STATE.md`.

## Accumulated Context

### Decisions

Key decisions are in the PROJECT.md Key Decisions table. The full per-plan log for v2.0 is in `.planning/milestones/v2.0-STATE.md`.

### Pending Todos

None carried from v2.0.

### Blockers/Concerns

- [v2.0 close, 2026-11-05] A real send from the contact form has not been tested on production, and the production Resend and Upstash variables are not confirmed. `lib/email.ts` throws without `RESEND_API_KEY`; `lib/rate-limit.ts` allows every request without the Upstash variables.
- [v2.0 audit, 2026-11-05] `main` has no branch protection or required checks, so a red PR can merge and Vercel deploys it. Dependabot PRs #110 and #111 are red today and should not be merged. Commits marked `[ci skip]` produce no checks, which matters once checks are required.
- [v2.0 close, 2026-11-05] CI run 42105427622 on `559bd72` shows `cancelled`: E2E hung in `npx playwright install --with-deps` and ran no tests. The same source passed in run 42104591800 on `082cfb8`. To clear the status: `gh run rerun 42105427622 --failed`.
- [quick 261105-wty, 2026-11-05] The canonical host switch is committed on `chore/canonical-host-www`, stacked on PR #112, but not pushed or deployed. Production keeps the vercel.app canonicals, and 404s on www keep the typed slug in their flight data (T-12-03), until it reaches main. Then run the retest in the Phase 12 deferred row: `/photos/nope` must be 404, well under 5 s, with no `nope` in its body. Why www gets the plain rewrite today stays unconfirmed until that passes.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 261105-wlf | Verify unknown-slug miss path returns 404 on www.tlui.de | 2026-11-05 | none (no code change) | [261105-wlf-verify-unknown-slug-miss-path-returns-40](./quick/261105-wlf-verify-unknown-slug-miss-path-returns-40/) |
| 261105-wty | Switch canonical host to www.tlui.de (site.url, canFetchNeutral, seo/og/not-found specs) | 2026-11-05 | 2b92371 | [261105-wty-switch-canonical-host-to-www-tlui-de-sit](./quick/261105-wty-switch-canonical-host-to-www-tlui-de-sit/) |

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| debug_sessions | 12-slug-script-data | awaiting_human_verify | 2026-11-05 | v2.0 |
| debug_sessions | e2e-test-ci-failures | awaiting_human_verify | 2026-11-05 | v2.0 |
| debug_sessions | eslint10-ci-failures | awaiting_human_verify | 2026-11-05 | v2.0 |
| debug_sessions | hero-scrim-over-rail | diagnosed | 2026-11-05 | v2.0 |
| debug_sessions | hidden-tab-burst-decline | diagnosed | 2026-11-05 | v2.0 |
| debug_sessions | summit-pins-under-plaque | diagnosed | 2026-11-05 | v2.0 |
| debug_sessions | waypoint2-label-and-kicker | diagnosed | 2026-11-05 | v2.0 |
| uat_gaps | 03/03-UAT.md (archived v1.0) | diagnosed | 2026-11-05 | v2.0 |
| verification_gaps | 04/04-VERIFICATION.md (archived v1.0) | human_needed | 2026-11-05 | v2.0 |
| verification_gaps | 05/05-VERIFICATION.md (archived v1.0) | human_needed | 2026-11-05 | v2.0 |
| deferred_items | 08/deferred-items.md: Home overflows horizontally at 375 px | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: Rail tick label "2,760 m approx." measures 4.81:1 at 768 px | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: R3F 9 logs the THREE.Clock deprecation warning on every canvas mount | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: Static poster at about 768-1090 px hides waypoint 3's pin label while it is active | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: S3, phone summit shots cut off pin 4 and the summit triangle | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 09/deferred-items.md: Reduced motion, full summit plaque covers the poster pins at 375 x 667 | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 12/deferred-items.md: Switch the canonical host to www.tlui.de once the domain is live | acknowledged | 2026-11-05 | v2.0 |
| deferred_items | 12/deferred-items.md: caniuse-lite is 7 months old in the production build | acknowledged | 2026-11-05 | v2.0 |

Acknowledging records the item; it doesn't fix it. Still open from this table: the `THREE.Clock` warning, the canonical host switch and the `caniuse-lite` refresh. The four Phase 9 debug sessions were fixed by plans 09-15 to 09-21 but their files were never closed.

## Session Continuity

Last session: 2026-11-05
Stopped at: Milestone v2.0 archived
Resume file: None
