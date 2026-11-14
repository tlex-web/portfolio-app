---
gsd_state_version: "1.0"
milestone: v2.1
milestone_name: Survey Expansion
current_phase: 15
current_phase_name: Region & Plate Data Model
status: planning
stopped_at: Phase 14 complete, ready to plan Phase 15
last_updated: "2026-11-14T16:04:31.121Z"
last_activity: 2026-11-14
last_activity_desc: Phase 14 complete, transitioned to Phase 15
state_head: e000dba9b042d4d892ff604581267702d2ce1e3f
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 30
  completed_plans: 30
  percent: 29
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-11-14)

**Core value:** A portfolio that is visually memorable and distinctive (not another generic Tailwind site) while being stable and well-maintained under the hood.
**Current focus:** Phase 15 — Region & Plate Data Model

## Current Position

Phase: 15 — Region & Plate Data Model
Plan: Not started
Status: Ready to plan
Last activity: 2026-11-14 — Phase 14 complete, transitioned to Phase 15

Progress: [███░░░░░░░] 29%

## Performance Metrics

**Velocity (v2.1):**
- Total plans completed: 30
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 13 | 22 | - | - |
| 14 | 8 | - | - |

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
| Phase 13 P18 | 6min | 2 tasks | 5 files |
| Phase 13 P19 | 55min | 3 tasks | 1 files |
| Phase 13 P20 | 2h40m | 3 tasks | 6 files |
| Phase 13 P21 | 4min | 3 tasks | 1 files |
| Phase 13 P22 | 10min | 3 tasks | 9 files |
| Phase 14 P01 | 10min | 2 tasks | 4 files |
| Phase 14 P02 | 9min | 3 tasks | 4 files |
| Phase 14 P03 | 12min | 2 tasks | 3 files |
| Phase 14 P04 | 7min | 2 tasks | 3 files |
| Phase 14 P05 | 15 min | 2 tasks | 5 files |
| Phase 14 P06 | 9 min | 2 tasks | 4 files |
| Phase 14 P07 | 12 min | 2 tasks | 4 files |
| Phase 14 P08 | 90min | 3 tasks | 13 files |

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
- [Phase 13]: 13-18: Tim replied "verified" to the @playwright/test 1.65.0 legitimacy checkpoint; Playwright 1.65.0 and container tag v1.65.0-noble landed together in the single five-file commit 5ab6d15 (parity guard OK, type-check, lint and jest green; chromium homepage smoke 7/7)
- [Phase 13]: 13-18: the lockfile was written with Node 26's bundled npm 11.20.0, not the shadowing global npm 11.6.1, whose install rewrote unrelated metadata (peer/dev flags, dropped libc arrays); the committed lockfile diff touches only the root spec and the three Playwright entries
- [Phase 13]: 13-18: DEPS-06 stays Pending in REQUIREMENTS.md by the shared-ID gate (13-20 and 13-22 also declare it and have no SUMMARY yet)
- [Phase 13]: 13-19: relay.decision a-confirmed (Tim's selection "a-confirmed (Recommended)"): the relay's CI OK check run 132061472478 sat on [ci skip] head c374806 (success, app 15368), was the only CI OK in the PR rollup (isRequired true) and PR #146 read CLEAN after ready; D-06 option A stands, so 13-21 records "not needed" (Tasks 2-3 skipped)
- [Phase 13]: 13-19: live main ruleset proven: red PR #144 (CI OK failure) read BLOCKED and its single gh pr merge --merge was refused by the base branch policy; docs-only PR #145 got docs_only=true, six heavy jobs skipped, CI OK success; all three proof PRs closed unmerged, branches deleted
- [Phase 13]: 13-19: untested path handed to 13-22: a [ci skip] head whose dispatched CI takes the full ~40-minute path has not been mirrored live (the proof run was docs-only, ~1.5 min); ci-skip-relay.yml timeout-minutes 100 and gh run watch --interval 60 budget for it; workflow unchanged
- [Phase 13]: 13-19: GUARD-07 and GUARD-08 stay Pending in REQUIREMENTS.md by the shared-ID gate (13-21 and 13-22 also declare them and have no SUMMARY yet)
- [Phase 13]: 13-20: Playwright 1.65 green on all three engines in CI (CI OK check run 132142890020 on cffcf99, E2E 37m24s); 7 Firefox cases crash on upstream Firefox 159 (Playwright #43967, Mozilla 2090055) and are excluded on Firefox only via the @firefox-43967 title tag and FIREFOX_INVERT (Tim's selections "A: Firefox-only fixme (Recommended)" then "A-tag (Recommended)", because GUARD-03 rejects .fixme(); guard untouched)
- [Phase 13]: 13-20: baseline run 43500162579 (update_mode changed) returned 48 PNGs all blob-identical; Tim replied "none" to Task 3, so no PNG commit; check-visual-run PASS on cffcf99, check-snapshot-commit --none OK on 5ab6d15, 3757994, cffcf99; #140 left open for Dependabot (approve-leave-140), closes with the phase PR; ci/13-pw165 left on origin for Tim to delete after the phase PR merges
- [Phase 13]: 13-20: hand-overs to 13-22: remove the @firefox-43967 tags and FIREFOX_INVERT after the Playwright release with the fixing Firefox roll (firefox --list 434 back to 441); optional local guard:tests step (npm run lint does not run GUARD-03)
- [Phase 13]: 13-21: D-06 fallback not needed: relay.decision a-confirmed copied from 13-19 (Tim's 13-19 selection "a-confirmed (Recommended)"); ci-skip-relay.yml, check-ci-gate.mjs and selftest.mjs unchanged, relay identical to origin/main d48af99
- [Phase 13]: 13-21: fallback.approval skip: Tim was not asked for 13-21; Tasks 2 and 3 (fallback PR, ci/13-proof-skip-2 re-proof) skipped by the plan's a-confirmed branch; nothing pushed; GUARD-08 stays Pending by the shared-ID gate (13-22 also declares it)
- [Phase 13]: 13-22: VERIFY-07 closed: all 44 ledger rows final in 13-LEDGER-TRIAGE.md (Final column) and in the four archived disposition files (fixed 32 with resolvable SHAs, deferred 9 with owners, skipped 3 with approved reasons); every final enum equals the approved Enum cell
- [Phase 13]: 13-22: hand-overs: ROADMAP scope notes under Phases 14 (07 WR-06/SHELL-07, 10 IN-01, Deployment Checks proof fallback), 15 (GUARD-10, guard:tests suggestion, scripts/README 47 pairs), 17 (10 IN-03, E2E duration trend), 18 (10 IN-04, IN-05, IN-08, IN-09 switchTo wait); deferred-items.md names owner and trigger for the Firefox tag removal, limit-probe output, relay long-mirror path, Deployment Checks proof, npm audit decision and ci/13-pw165; no new requirement
- [Phase 13]: 13-22: PROJECT.md Key Decisions: main ruleset 27216079, [ci skip] relay option A (a-confirmed), keep-alive monitor (60-day schedule pause, ~1 h Hobby logs), docs-only fast path; production gate recorded as Deployment Checks on CI OK (Tim, 2026-11-13) with the live proof pending the phase-close merge
- [Phase 13]: 13-UAT (2026-11-14, 3/3 pass): Deployment Checks proven live on phase-close merge aef25e2 (PR #147): Vercel "Waiting for checks to complete" from 23:28:02Z, CI OK success 23:55:05Z, deployment completed 23:55:07Z. Tim passed test 2 with #140 still open (main carries @playwright/test 1.65.0; Dependabot runs weekly, Monday 09:00) and test 3 before any code-changing [ci skip] head had run the long-mirror path
- [Phase 14]: 14-01: SHELL-07 fix 49b8fe1 (ledger row #6 write-back in 14-07): a plain tap on the panel link whose href strictly equals the pathname focuses Menu with preventScroll, then closes; default-prevented with no query (D-16), Next navigates with one (D-23). SHELL-08 75e9900: focus-visible:-outline-offset-4 on panel links, globals.css unchanged
- [Phase 14]: 14-01: the global scroll-margin-top makes a plain focus() of the sticky Menu button scroll the page (600 to 530 Chromium, 185.5 Firefox); the Escape handler still does it, logged in 14 deferred-items.md. Panel onFocus revealFocusedRow keeps a focused row inside the scrolling panel (Firefox did not scroll it at 375 x 320)
- [Phase 14]: 14-01: new visual test menu @375 current row focused declares menu/375-current-focus-visual-dark-linux.png, produced only by the 14-08 dispatch; CI compare reports it missing until then
- [Phase 14]: HOME-10: rail scrim takes the locked P3 stops at w-56 (reverses 12-07 D-24); B8 lowest 7.93:1 poster, 7.91:1 live, every label above the 5:1 aim (14-02)
- [Phase 14]: B8 live rows opt into budgetMeasureOnly, the home-canvas rule for tests that need 3d (14-02)
- [Phase 14]: HOME-09: fixed by 09-01, now guarded at 375 px in four modes and eight stops; no app change, no home/375 PNG (14-02)
- [Phase 14]: 14-03 (LBOX-08, D-08): root cause is the browser's same-document scroll restoration after every lightbox close (all closes are history traversals; scrollRestoration stays 'auto'), which ran after restoreFocus's microtask and undid scrollIntoView; block 'nearest' also clipped the ring's bottom 4 px
- [Phase 14]: 14-03: restoreFocus calls revealTrigger (window-only, instant, minimal scrollBy clearing --nav-h and the 4 px ring, oversized triggers top-aligned) once now and once in requestAnimationFrame while the mark keeps focus; history.scrollRestoration untouched; UI-SPEC P4 resolved to the restore code (no scroll-mb-4)
- [Phase 14]: 14-03: revealTrigger rounds its target outward to whole pixels (Chromium snapped 348.375 to 348, ring 0.375 px out); the :471 scroll-unchanged row now centres its tile because scrollIntoViewIfNeeded left its ring clipped in Chromium; 14-08 adds a second-frame reveal only if Linux WebKit needs it
- [Phase 14]: 14-04 D-12: one setLabels(on) path for the Hide labels button and H clears expandedId on hide; never an effect on the cross-tab labels store (fix d6873c8)
- [Phase 14]: 14-04 D-22: collapseCallout clears a hidden callout (no visible label or key row) and returns false, so zoom then close take the Escape; visible callouts stay first (fix 945d235, ledger 10 IN-01)
- [Phase 14]: 14-05: Contract 1 classes ship as written; desktop Chromium's thin scrollbar gutter wraps the 375 px command bar (299 px inner), so the one-row e2e check runs as a phone (isMobile in Chromium) and a desktop row asserts the wrap rule; one-token tightening options logged in deferred-items for Tim
- [Phase 14]: 14-05: A step or any dot press shows the target command complete and sets the sticky Pause through one show(target); ends are aria-disabled, focusable, and stepTo returns null so goTo never throws
- [Phase 14]: 14-06: The transcript summary sits between the terminal and the next focusable element, so two Jest Tab rows were rewritten in place to pass through it (GUARD-03).
- [Phase 14]: 14-06: The box reduced visual shot waits for the open transcript before settle(); declared re-baseline box/375-reduced, box/768-reduced, box/1440-reduced for 14-08.
- [Phase 14]: 14-05 follow-up: the terminal dot row is gap-1, not gap-2 (Tim's decision c, AskUserQuestion 2026-11-14, "c: dot row gap-1 (Recommended)"). Desktop Chromium's scrollbar gutter leaves 299 px inside the 375 px bar, and Previous, four dots and Next now need 292 px, so the bar is one 48 px row in Chromium and Firefox. 14-UI-SPEC Contract 1 amended; deferred-items entry resolved (61b390a).
- [Phase 14]: 14-07: ledger rows #6 (07 WR-06, SHELL-07 49b8fe1) and #30 (10 IN-01, D-12 d6873c8, D-22 945d235) written back as done in 13-LEDGER-TRIAGE.md and the archived 07 and 10 disposition tables; enums, Owner and Tim cells unchanged (WR-05 precedent); write-back d78c251
- [Phase 14]: 14-07: the wave-merge gate caught the photos-sweep E5 row still expecting the pre-D-22 Escape order; step 6 rewritten in place (accc7e5), no app change. Tip green: lint, type-check, Jest 1795 + guard:tests (2392 vs 2243), 592 e2e in Chromium (334) and Firefox (258)
- [Phase 14]: 14-07: declared PNG set for 14-08: menu/375-current-focus (new), home/{768,1440}-ascent-{start,waypoint-2,summit} plus home/{768,1440}-reduced if the band shows, box/{375,768,1440}-reduced; no home/375; check-snapshot-commit --allow menu --allow home --allow box
- [Phase 14]: 14-08: WebKit LBOX-08 passed on the first ci/14-08 push; the second-frame re-reveal contingency was not applied (LightboxDialog.tsx untouched)
- [Phase 14]: 14-08: re-baseline changed 11 PNGs and added 1 (menu/375-current-focus), all inside the declared menu/home/box set; Tim committed them (55160a4) and CI OK passed on it (run 43600436335)
- [Phase 14]: 14-08: no Deployment Checks proof recorded (D-20); ci/14-08 is throwaway and the phase branch is pushed later by /gsd-ship
- [Phase 14]: 14-UAT passed 2026-11-14 (Tim asked Claude to run it): the 12-UAT test 3 keyboard re-check, 20/20 in Edge and Firefox on next dev; VERIFICATION canonicalized human_needed → passed and the phase transitioned to 15

### Pending Todos

None carried from v2.0.

### Blockers/Concerns

- [Phase 13] Carried, not blocking: the relay's ~40-minute long-mirror wait has not been seen live (watch the first code-changing `[ci skip]` PR); Dependabot PR #140 should close on its next run; the `@firefox-43967` tags and `FIREFOX_INVERT` come out after the Playwright release with the fixing Firefox roll (owners in `13-repo-safety-test-debt/deferred-items.md`).
- [Phase 13] The UAT, verification and transition commits after `98f2186` are local on `gsd/phase-13-repo-safety-test-debt`, whose remote branch was deleted by the #147 merge. They reach `main` only through a new PR, which needs Tim's ask.
- [Phase 14] The phase branch `gsd/phase-14-ui-fixes-terminal-controls` has no upstream; its commits (plans, UAT, verification, transition) reach `main` only through `/gsd-ship 14`, which needs Tim's ask.
- [Phase 14] Open, Tim to decide: Escape from the open mobile menu scrolls the page up when scrolled down (`SiteNav.tsx` Escape handler lacks `preventScroll`; one-word fix plus a scroll assertion, see `14-ui-fixes-terminal-controls/deferred-items.md`). Six code-review findings are deferred to Phase 15 (`14-REVIEW-DISPOSITION.md`).
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

Last session: 2026-11-14T16:10:00Z
Stopped at: Phase 14 complete, ready to plan Phase 15
Resume file: None
