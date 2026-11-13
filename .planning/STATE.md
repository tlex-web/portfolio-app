---
gsd_state_version: "1.0"
milestone: v2.1
milestone_name: Survey Expansion
current_phase: 13
current_phase_name: Repo Safety & Test Debt
status: executing
stopped_at: Completed 13-17-PLAN.md
last_updated: "2026-11-13T16:59:37.374Z"
last_activity: 2026-11-13
last_activity_desc: Phase 13 execution started
state_head: e3ebfd42add2c26b65ff1303b7d339a24b98a055
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 22
  completed_plans: 17
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-11-12)

**Core value:** A portfolio that is visually memorable and distinctive (not another generic Tailwind site) while being stable and well-maintained under the hood.
**Current focus:** Phase 13 — Repo Safety & Test Debt

## Current Position

Phase: 13 (Repo Safety & Test Debt) — EXECUTING
Plan: 18 of 22
Status: Ready to execute
Last activity: 2026-11-13 — Phase 13 execution started

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
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 13 P01 | 11min | 3 tasks | 15 files |
| Phase 13 P02 | 7min | 3 tasks | 7 files |
| Phase 13 P06 | 36min | 3 tasks | 3 files |
| Phase 13 P03 | 4min | 2 tasks | 3 files |
| Phase 13 P04 | 3min | 2 tasks | 5 files |
| Phase 13 P07 | 11min | 3 tasks | 17 files |
| Phase 13 P08 | 11min | 3 tasks | 8 files |
| Phase 13 P09 | 11 min | 3 tasks | 10 files |
| Phase 13 P10 | 9 min | 2 tasks | 9 files |
| Phase 13 P11 | 13min | 2 tasks | 6 files |
| Phase 13 P12 | 6min | 2 tasks | 3 files |
| Phase 13 P13 | 9min | 2 tasks | 7 files |
| Phase 13 P14 | 14min | 3 tasks | 19 files |
| Phase 13 P05 | 3min | 2 tasks | 1 files |
| Phase 13 P15 | 45min | 3 tasks | 2 files |
| Phase 13 P16 | 1h50m | 3 tasks | 3 files |
| Phase 13 P17 | 15min | 3 tasks | 2 files |

## Accumulated Context

### Decisions

Key decisions are in the PROJECT.md Key Decisions table. The full per-plan log for v2.0 is in `.planning/milestones/v2.0-STATE.md`.
Recent decisions affecting current work:

- [Roadmap]: 7 phases (13-19) in strict order: repo safety → UI fixes → pixel-neutral data model → new content → routes and SEO → immersive layout → drone loops
- [Phase 15]: The data and plate refactor is pixel- and hash-neutral (every baseline unchanged, Matterhorn terrain hashes unchanged); new content waits for Phase 16
- [Phase 16]: Launch regions stay inside the swissALTIRegio footprint; Copernicus GLO-90 feeds only the overview; proj4 only if the measured `lib/geo.ts` error requires it
- [Phase 17]: Photo URLs stay `/photos/<slug>` with no redirects; the region path is fixed after the static-sibling intercept spike
- [Phase 18]: The Map/Grid/Carousel switch is retired; map collar, altimeter rail, sheet-index rectangles and 3-5 reference summits are in scope; credits go in each sheet margin plus a `/sources` page
- [Phase 13]: 13-01: CI OK verdict is scripts/ci/ci-ok.jq (jq -e over toJSON(needs)); only dependency-review may skip, and only outside pull_request; empty needs fails
- [Phase 13]: 13-01: check-ci-gate.mjs also fails on permissions: write-all and on any job without an explicit token scope, since either hands a job checks: write; CI_OK_ELSEWHERE_ALLOWED is empty until the 13-10 relay
- [Phase 13]: 13-02: the production limiter fails closed only when VERCEL_ENV === 'production' (D-12); unconfigured, Redis error and the library's success-on-timeout all refuse, and the route answers 503 server-error with no Retry-After
- [Phase 13]: 13-02: credentials are one complete pair, UPSTASH_REDIS_REST_* first then KV_REST_API_*, never mixed, empty counts as missing; LIMIT_TIMEOUT_MS = 3000; which pair production sets is still 13-05's input
- [Phase 13]: 13-06: Tim approved the 44-row ledger triage with no overrides (2026-11-13); fixed 32 (10 already, 22 fix now), deferred 9, skipped 3; Unowned fix rows none
- [Phase 13]: 13-06: 07 WR-07 is fixed in 13-11 (SafeCanvas logs non-WebGL errors in componentDidCatch); 13-11 checks the new console.error does not trip the audit gate on Home
- [Phase 13]: 13-06: 07 IN-08 becomes GUARD-10 in Phase 15 (tests, e2e specs and Playwright configs type-checked with zero errors; measured 5482 errors in 103 files, 69 in 21 with Jest globals); @types/jest still needs Tim's vetting, or use @jest/globals imports
- [Phase 13]: 13-06: 12 IN-08 accepted (a real visitor cannot produce the fieldless validation answer)
- [Phase 13]: 13-03: the audit gate reads app/sitemap.ts: ROUTES keeps one named representative per page template (photo = matterhorn-from-zermatt, throws if missing), AUDIT_SWEEP (every other sitemap path, sitemap order, no dedupe) runs once in Chromium at 1440 in one @chromium-only test; lib/__tests__/audit-routes.test.ts fails on a page template with no ROUTES entry
- [Phase 13]: 13-04: CLEAN-01 app-side removals are two commits for 13-15's per-commit check-snapshot-commit --none: 6ff759d (images block, SW /_next/image condition, vercel.com dns-prefetch) and d69b42c (cssDuration, cssEase, kebab, TILT_CONFIG and their 2 tests)
- [Phase 13]: 13-04: proxy.ts keeps _next/image in its matcher exclusion (scoped out, inert); with no next/image caller the loader runs on Next 16 defaults
- [Phase 13]: 13-07: docs-only fast path = changes job (one compare API call BASE...HEAD, main for workflow_dispatch; new and old names piped to scripts/ci/classify-changes.mjs, exact D-09 list, no *.md rule); no base, failed call, empty or 300+ files, or a line-break name = full CI; ci-ok.jq requires changes success and accepts heavy skips only on docs_only "true"
- [Phase 13]: 13-07: ci.yml has workflow_dispatch (no inputs); check-ci-gate.mjs rules 8-10 fail on a missing push/pull_request/workflow_dispatch trigger, any paths or paths-ignore in on:, and a docs-only job set that differs from the single IN(...) list in ci-ok.jq or lacks needs changes; a new heavy job needs all three edits in one commit
- [Phase 13]: 13-08: seven ledger rows fixed one commit each (07 IN-01/03/11/17, 09 IN-03/04/07); 09 IN-03 asserts the plaque height through summitColumnBox().height so summit-layout.ts is unchanged; 09 IN-04 fixes the shared fixedDecimals (exponent-shift rounding) and pins the four waypoint strings literally
- [Phase 13]: 13-09: 10 IN-09 split: the three lightbox-spec absence samples survive Phase 18 and now wait on a transition.finished settle count; the photos-sweep switchTo 600 ms wait covers the Map/Grid/Carousel switch and is handed to Phase 18
- [Phase 13]: 13-09: jest-dom's css.escape polyfill gives Jest a global CSS.escape, so tests that need the cssEscape fallback remove it for their duration
- [Phase 13]: 13-10: skip-marker relay (D-06 option A) is .github/workflows/ci-skip-relay.yml; it finds its dispatched run as the earliest workflow_dispatch run of ci.yml on the head ref since the dispatch, fails red on another head SHA, and requires conclusion success after gh run watch --exit-status
- [Phase 13]: 13-10: check-ci-gate relay rules are numbered 11-15 (13-07 took 10); rule 12 reads raw run-block lines, shell comments included; rule 15 allows no write scope but actions: write on the CI OK relay job
- [Phase 13]: 13-10: the relay job holds no checks: read (gh 2.103.3 skips annotations on a 403); 13-19 confirms gh run watch works live and that the relay check counts on the PR head SHA (A1)
- [Phase 13]: 13-11: 12 IN-09 storeCopy wraps clone() and waitUntil in try/catch (b0844b9, separate from 13-04's CLEAN-01 commit); 12 IN-10 name-too-long copy reads FEEDBACK_LIMITS.nameMax with identical output (30a837d)
- [Phase 13]: 13-11: 07 WR-07 SafeCanvas logs console.error('[SafeCanvas]', error) unless the message contains 'Error creating WebGL context' (both three.js messages; same text e2e webglFailure matches); Home audit chromium clean (ddd356c)
- [Phase 13]: 13-11: 07 IN-08 not changed, deferred to GUARD-10 (Phase 15) per the 13-LEDGER-TRIAGE.md Approval; no tsconfig.test.json, type-check unchanged
- [Phase 13]: 13-12: photo scripts take --root <dir>; G5 (4 cases) and G6 (whole-tree byte identity) spawn them from the guard selftest; G6 asserts the real undecodable-source message, not 'nothing written'
- [Phase 13]: 13-13 (07 WR-01): the contrast guard merges only top-level :root/@theme blocks; a token block nested in any at-rule (@media, @supports, @container, @layer) that declares a custom property fails the guard
- [Phase 13]: 13-13 (07 IN-06): the real-file contrast selftest asserts the OK line, table order and each pair against its own threshold (0.005 display tolerance), per the approved triage row; exact ratios stay in fixtures
- [Phase 13]: 13-13 (07 WR-02/WR-03): widened palette prefixes found no new real-tree hit and no wb count change (ratchet unmoved); the png rule lists files with git ls-files -co --exclude-standard
- [Phase 13]: 13-14 (12 IN-12, Tim option A): version floors are checked on every lockfile copy, per version line for list floors; fflate floor ["0.6.11", "0.8.3"] keeps the 12-06 pinned three-stdlib copy checked, and a copy on an unfloored line fails
- [Phase 13]: 13-14: same-classnames pairs renames and fails on zero compared (07 WR-04); check-snapshot-commit checks merge commits against their first parent with CLI flags unchanged (07 IN-07); catch-all: none
- [Phase 13]: 13-05: production has the complete UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN pair (REDIS_URL unused), System Environment Variables on, Deployment Checks offered on Hobby; keep-alive is ping-readonly via secrets UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (read-only token unverified); Pitfall 2 resolved for production, 13-15 unblocked on the pair
- [Phase 13]: 13-15: PR #143 opened on Tim's "Push and pr" (mapped to push-and-pr); CI OK success (app 15368) and all 13 check runs green on head 90758db; Visual Regression PASS with update mode none and check-snapshot-commit --none OK on 6ff759d and d69b42c; E2E baseline 28m31s for 13-20; no fix push
- [Phase 13]: 13-15: Security Audit warns on 25 dev-only npm audit advisories (3 low, 22 moderate; --omit=dev finds 0); the step is warn-only on main too; logged in deferred-items.md, not changed
- [Phase 13]: 13-16: PR #143 merged by Tim ("merged") as merge commit d48af99 (parents b81d6f2, 962e732); push run 43459507776 CI OK success (app 15368) at 16:39:08Z, before the ruleset (D-05)
- [Phase 13]: 13-16: Tim applied the main ruleset and deleted 10401314 ("applied, deployment checks on"); live ruleset 27216079 matches main-ruleset.json on every set field (no bypass, never, active, ~DEFAULT_BRANCH, merge only, 0 approvals, strict off, CI OK@15368); 10401314 returns 404
- [Phase 13]: 13-16: Deployment Checks on CI OK recorded from Tim's reply only (agent cannot read Vercel); d48af99 production deploy (16:09:27Z) predates the setting; live evidence = first production deploy after the next merge to main, owned by 13-22
- [Phase 13]: 13-17: production serves merge d48af99 (deployment 7770069186, success, predates Deployment Checks); first Upstash keep-alive run 43466849915 on main succeeded with PONG, so the repository secrets and the REST call work
- [Phase 13]: 13-17: Tim ran the live 429 probe himself (selection "I run it (tim-runs)"); run B with PROD_FORM_LIMIT=1 passed 5/5, proving a 429 with Retry-After > 0 and no 503; the request number and Retry-After value were not printed, the sixth-in-window position (loop post 2) is inferred
- [Phase 13]: 13-17: GUARD-09 stays Pending in REQUIREMENTS.md by the shared-ID gate (13-22 also declares it); the concurrency truth is a backstop (Upstash sliding-window atomicity), not tested live

### Pending Todos

None carried from v2.0.

### Blockers/Concerns

- [Phase 13] The production Upstash names are confirmed (13-05: the complete `UPSTASH_REDIS_REST_*` pair is set in Production). What's left for GUARD-09 is the live 429 proof: `PROD_FORM_LIMIT=1 npm run test:prod-form` shows it but locks the IP out for up to an hour (13-15/13-17).
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

Last session: 2026-11-13T16:59:37.341Z
Stopped at: Completed 13-17-PLAN.md
Resume file: None
