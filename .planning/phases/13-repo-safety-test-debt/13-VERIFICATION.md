---
phase: 13-repo-safety-test-debt
verified: 2026-11-13T23:30:00Z
status: human_needed
score: 5/6 must-haves verified
covered_files:
  - .github/workflows/ci-skip-relay.yml
  - .github/workflows/ci.yml
  - .github/workflows/upstash-keepalive.yml
  - .planning/phases/13-repo-safety-test-debt/13-01-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-01-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-02-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-02-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-03-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-03-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-04-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-04-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-05-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-05-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-06-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-06-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-07-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-07-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-08-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-08-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-09-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-09-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-10-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-10-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-11-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-11-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-12-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-12-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-13-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-13-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-14-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-14-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-15-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-15-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-16-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-16-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-17-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-17-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-18-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-18-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-19-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-19-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-20-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-20-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-21-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-21-SUMMARY.md
  - .planning/phases/13-repo-safety-test-debt/13-22-PLAN.md
  - .planning/phases/13-repo-safety-test-debt/13-22-SUMMARY.md
  - app/api/feedback/route.ts
  - e2e/audit.spec.ts
  - e2e/routes.ts
  - lib/rate-limit.ts
  - package.json
  - scripts/ci/ci-ok.jq
  - scripts/guards/check-ci-gate.mjs
  - scripts/guards/selftest.mjs
covered_digest: "v4:sha256:b1d9bc99562fa4d38ac1bcaaf56fc380a977e10fc3a220dd314b0b730a2cd5eb"
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "No unchecked commit reaches production (Vercel Deployment Checks hold a production deployment until that commit's CI OK is green)"
    test: "After the phase-close PR is merged to main, watch the Vercel production deployment of the merge commit (Vercel dashboard, or gh api repos/tlex-web/portfolio-app/deployments?environment=Production and its statuses)"
    expected: "The deployment is held (queued/pending on the check) until the merge commit's CI OK concludes success, and is promoted only after that (about 40 minutes after the merge). If it goes live before CI OK, the D-07 residual applies and goes back to Tim"
    why_human: "Deployment Checks is a Vercel setting with no API the agent can read; Tim's reply was 'applied, deployment checks on'. The only production deployment seen (d48af99, success 16:09:27Z) predates the setting, and its CI OK landed at 16:39:08Z, so it is not evidence. Presence of a configuration cannot show that a deployment actually waits"
human_verification:
  - test: "Deployment Checks live proof (GUARD-08 'nor reaches production unchecked'; accepted risk AR-13-06)"
    expected: "The production deployment of the phase-close merge commit is held until that commit's CI OK is success, then promoted. If it deploys before CI OK, report to Tim"
    why_human: "No API exposes the Vercel setting; only a merge to main after 13-16 can show it working. deferred-items.md and the ROADMAP Phase 14 note carry the fallback owner (first Phase 14 merge)"
  - test: "Phase-close merge consequences: after merging the phase PR, confirm Dependabot PR #140 closes and the relay/classifier fixes (WR-01, WR-02, WR-04) are live on main"
    expected: "#140 is closed by Dependabot once main carries @playwright/test 1.65.0; origin/main contains 1f8a5bc, aee0ad3, bc76d03, 4dfeee9, cb5983f. #140 is OPEN today (state read by GET), and local HEAD 72e2593 is not pushed (origin/main is d48af99)"
    why_human: "Both depend on a merge Tim performs; they cannot be checked before it"
  - test: "Relay long-mirror path (hand-over from 13-19)"
    expected: "On the first PR whose head carries [ci skip] and changes code, the relay's CI OK waits for the dispatched full CI run (about 40 minutes, within timeout-minutes: 100) and its conclusion matches the dispatched run"
    why_human: "Only the docs-only mirror (about 1.5 minutes, PR #146) has run live; the long path is covered by 13-VALIDATION selftest cases for the lookup logic, not by a live run. Tracked in deferred-items.md"
---

# Phase 13: Repo Safety & Test Debt Verification Report

**Phase Goal:** A red pull request can no longer reach `main` or production, the contact form's rate limiter is proven live, and the test nets cover every page and the photo build scripts before the v2.1 refactors land.
**Verified:** 2026-11-13T23:30:00Z
**Status:** human_needed
**Re-verification:** No, initial verification

Verified at local HEAD 72e2593 (branch `gsd/phase-13-repo-safety-test-debt`, not pushed). `origin/main` is d48af99 (the mid-phase PR #143 merge).

## Goal Achievement

Five of the six must-haves hold on codebase and read-only GitHub evidence. One part of success criterion 1, that no unchecked commit reaches production, rests on a Vercel setting the agent cannot read and that has not yet been seen working. That is a legitimate human-verification item, not a gap. There are no FAILED truths.

### Observable Truths

| # | Truth (ROADMAP success criterion) | Status | Evidence |
|---|---|---|---|
| 1a | A deliberately red PR cannot merge into `main`; one aggregate required check depends on every CI job; the ruleset is verified; a `[ci skip]` head or a path-filtered-only PR still gets a final result | VERIFIED | `ci.yml` job `ci-ok` (name `CI OK`, `if: always()`, `needs` = changes + all 7 gate jobs, `timeout-minutes: 5`) runs `jq -e -f scripts/ci/ci-ok.jq`. The jq fails on empty `needs`, a failed `changes`, any non-success, and allows a skip only for `dependency-review` off-PR or the six heavy jobs when `docs_only` is "true". Live ruleset 27216079 read by GET: `enforcement: active`, `bypass_actors: []`, rules `deletion`, `non_fast_forward`, `pull_request`, `required_status_checks` = `CI OK` from integration 15368; it is the only ruleset (inert 10401314 is gone). `ci.yml` triggers are push, pull_request and `workflow_dispatch`, no paths filter (`npm run guard:ci` prints `ci-gate: OK`; rules 8 and 9). Live proofs by GET: PR #144 (red test) CI OK FAILURE and CLOSED unmerged; PR #145 (docs-only) CI OK SUCCESS; PR #146 (`[ci skip]` head) a single counted CI OK SUCCESS from the `pull_request_target` relay (`ci-skip-relay.yml`, no checkout, `actions: write` only on the relay job). `guard:selftest` 216/216 passes, including ci-ok.jq, classifier, relay and shell-parser cases. |
| 1b | No unchecked commit reaches production | PRESENT_BEHAVIOR_UNVERIFIED | Direct pushes are blocked by the ruleset (PR required, no bypass), which covers the merge path. The production half is Vercel Deployment Checks, "applied, deployment checks on" per Tim (13-16). Not API-readable, and no production deployment has yet been seen waiting for `CI OK` (d48af99 deployed 16:09:27Z, before its `CI OK` at 16:39:08Z, and predates the setting). Accepted risk AR-13-06. See Human Verification item 1. |
| 2 | Tim confirmed the Upstash variables in Vercel production; the sixth rapid honeypot submission to the live form gets a 429; in production an unconfigured or unreachable limiter refuses submissions (unit-tested) | VERIFIED | `lib/rate-limit.ts`: `slidingWindow(5, '1 h')`; credentials read as one complete pair, `UPSTASH_REDIS_REST_*` else `KV_REST_API_*`; in production (`VERCEL_ENV === 'production'`) no credentials, a constructor failure, a Redis error or an `@upstash/ratelimit` timeout all return `refuse(...)` with `success: false, unavailable`. `app/api/feedback/route.ts` runs the limiter before the body parse and the honeypot, answers `unavailable` with 503 `server-error` and `!success` with 429 plus `Retry-After`. Jest at HEAD: `lib/__tests__/rate-limit.test.ts` and `app/api/__tests__/feedback.test.ts` pass (the 503 and the refusal cases are in them). Live: keep-alive run 43466849915 read by GET, `workflow_dispatch`, success ("Upstash answered PONG"); `upstash-keepalive.yml` is daily, outside `CI OK`, `permissions: {}`, secrets only through `env:`. The live 429 probe was run by Tim in his own terminal (13-17): 5/5 with the limit assertion `429` and `Retry-After > 0`; I cannot re-run it (it locks the probing IP out), so this rests on his transcribed run. The request index and the Retry-After value were not printed (logged in deferred-items.md; the 429 is inferred to be the sixth). |
| 3 | Playwright 1.65 and its container image tag land in one commit, re-baselined alone before any visual change; PR #140 is closed by it | VERIFIED (merge-dependent tail, see item 2) | Commit 5ab6d15 changes exactly `package.json`, `package-lock.json` (`@playwright/test`, `playwright`, `playwright-core` at 1.65.0), `ci.yml` (E2E and Visual Regression images), `visual-baselines.yml` (image and `PW_CONTAINER_TAG`), and `version-floors.json`. All four sites read `mcr.microsoft.com/playwright:v1.65.0-noble` at HEAD. The re-baseline changed nothing: baseline run 43500162579, 48 of 48 PNGs blob-identical; `git diff --stat 78ff217..HEAD -- '*.png'` prints nothing. CI run 43494117521 on `ci/13-pw165` (cffcf99) read by GET: every job success including Visual Regression, E2E and `CI OK`. Dependabot #140 is OPEN by GET and closes only when main has 1.65.0 (the phase-close merge). The 7 `@firefox-43967` Firefox exclusions are a deliberate, recorded decision, not a defect. |
| 4 | The production audit gate covers `/projects/coin-flip` and every photo slug, takes its routes from site data; G5 and G6 tests exist | VERIFIED | `e2e/routes.ts` derives `SITEMAP_PATHS` from `app/sitemap.ts` (nav, `photoSlugs`, `projects`), and `AUDIT_SWEEP` = every sitemap path not in `ROUTES`. `e2e/audit.spec.ts` runs `ROUTES` in three engines at three widths and the sweep once in Chromium at 1440; a new photo or region page joins through the sitemap with no edit. `lib/__tests__/audit-routes.test.ts` (passes at HEAD) asserts every sitemap path, `/projects/coin-flip`, every project and every photo slug is audited. G5 (4 cases) and G6 (1 case) are in `scripts/guards/selftest.mjs` (lines 2197-2265), spawn `photos:build --check --root <temp copy>` and `photos:derive --root <tmp>`, assert exit code and output text, and G6 asserts the tree byte-identical; `--root` is parsed in both scripts. I ran `npm run guard:selftest`: 216/216 passed. |
| 5 | Every open ledger row from Phases 7, 9, 10, 12 is fixed, accepted with a reason, or turned into a requirement; the CLEAN-01 items are gone with no visual diff | VERIFIED | `13-LEDGER-TRIAGE.md`: 44 rows, approved by Tim 2026-11-13, final totals fixed 32 / deferred 9 / skipped 3, Final column written back. No ledger file under `.planning/milestones/v2.0-phases` has an open row (the only two `disposition: open` text hits are a PLAN and a SUMMARY quoting the string). Spot-checks of "fixed" rows have matching selftest cases (07 WR-02 palette, WR-03 git-ignored PNG, WR-04 same-classnames moved/empty, IN-06, IN-07 merge commits; 07 WR-07 SafeCanvas now logs non-WebGL errors). Hand-overs have owners (GUARD-10 in REQUIREMENTS.md as Phase 15, SHELL-07 Phase 14). CLEAN-01: `git grep` finds no `TILT_CONFIG`, `cssDuration`, `cssEase`, `dns-prefetch` or `vercel.com`; `next.config.ts` has no `images` block; `public/service-worker.js` has no `/_next/image` branch (the `proxy.ts` matcher exclusion is a different, legitimate use); no commented step in any workflow. No PNG differs between 78ff217 and HEAD. |

**Score:** 5/6 truths verified (1 present, behavior-unverified; routed to human verification)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `.github/workflows/ci.yml` | `CI OK` aggregate, `changes` job, docs-only fast path, timeouts | VERIFIED | 368 lines, all 9 jobs carry `timeout-minutes`, no path filter |
| `scripts/ci/ci-ok.jq` | Verdict | VERIFIED | Substantive, wired via `jq -e -f`, selftested |
| `.github/workflows/ci-skip-relay.yml` | D-06 option A relay | VERIFIED | Live-proven on #146; guard rules 11-15 enforce its safety |
| `.github/workflows/upstash-keepalive.yml` | Daily PING | VERIFIED | Run 43466849915 success |
| `scripts/guards/check-ci-gate.mjs` | Gate guard in `npm run lint` | VERIFIED | `guard:ci` OK; in the `lint` chain |
| `lib/rate-limit.ts`, `app/api/feedback/route.ts` | Fail-closed limiter and 503 route | VERIFIED | Wired: route imports `feedbackRateLimit`, branches on `unavailable` |
| `e2e/routes.ts`, `e2e/audit.spec.ts`, `lib/__tests__/audit-routes.test.ts` | Sitemap-driven audit | VERIFIED | Wired and tested |
| `scripts/guards/selftest.mjs` G5/G6 cases | VERIFY-06 | VERIFIED | Run, 216/216 |
| `13-LEDGER-TRIAGE.md` plus archived disposition files | VERIFY-07 | VERIFIED | Totals match |
| `main-ruleset.json` and the live ruleset | GUARD-07 | VERIFIED | Live matches the file |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| ruleset 27216079 | `CI OK` check (app 15368) | `required_status_checks` | WIRED | Read by GET |
| `ci-ok` job | `ci-ok.jq` | `jq -e --arg event ... -f` | WIRED | `needs` list equals the guard's job list |
| `changes.docs_only` | six heavy jobs and `ci-ok.jq` | `if:` plus allow-list | WIRED | Guard fails on drift |
| skip-marker head | relay `CI OK` | `pull_request_target` then `gh workflow run ci.yml` | WIRED | Live on #146 |
| `feedbackRateLimit.limit` | route 503 / 429 | `unavailable` / `success` | WIRED | Route test passes |
| `app/sitemap.ts` | `AUDIT_SWEEP` | `e2e/routes.ts` import | WIRED | |
| `--root` flag | G5/G6 selftest | spawn args | WIRED | |
| Vercel Deployment Checks | production promotion | project setting | NOT VERIFIABLE | Human item 1 |

### Data-Flow Trace (Level 4)

Not applicable beyond the above: the phase renders no dynamic UI data. `AUDIT_SWEEP` flows from the real sitemap and the real photo list, not a literal.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Guard and workflow shell cases (incl. G5/G6, ci-ok.jq, relay lookup) | `npm run guard:selftest` | `selftest: 216/216 cases passed` | PASS |
| CI gate rules | `npm run guard:ci` | `ci-gate: OK` | PASS |
| Limiter, route and audit-coverage tests | `npx jest lib/__tests__/rate-limit.test.ts lib/__tests__/audit-routes.test.ts app/api` | 3 suites, 91 tests passed | PASS |
| Full lint and Jest at HEAD | not re-run by me | the orchestrator reports lint exit 0 and 105 suites / 1766 tests passed | not re-verified |

### Probe Execution

No `probe-*.sh` scripts declared or present: SKIPPED.

### Requirements Coverage

All eight IDs appear in plan frontmatter and in REQUIREMENTS.md (checked `[x]`, traceability "Complete"). No orphaned Phase 13 requirement.

| Requirement | Source Plans | Status | Evidence |
|---|---|---|---|
| GUARD-07 | 13-01, 13-15, 13-16, 13-19, 13-22 | SATISFIED | Truth 1a; live ruleset and red proof #144 |
| GUARD-08 | 13-05, 13-07, 13-10, 13-15, 13-16, 13-19, 13-21, 13-22 | SATISFIED for the check-never-pending half; NEEDS HUMAN for "nor reaches production unchecked" | Truth 1a verified, 1b human. REQUIREMENTS.md marks it Complete while the Deployment Checks live proof is still open, so the tick is ahead of the evidence |
| GUARD-09 | 13-02, 13-05, 13-15, 13-17, 13-22 | SATISFIED | Truth 2; the live 429 rests on Tim's run |
| DEPS-06 | 13-18, 13-20 | SATISFIED (the "closes #140" tail lands at merge) | Truth 3 |
| VERIFY-05 | 13-03 | SATISFIED | Truth 4 |
| VERIFY-06 | 13-12 | SATISFIED | Truth 4 |
| VERIFY-07 | 13-06, 13-08, 13-09, 13-11, 13-13, 13-14, 13-22 | SATISFIED | Truth 5 |
| CLEAN-01 | 13-04, 13-07, 13-15 | SATISFIED | Truth 5 |

### Anti-Patterns Found

Scanned the 94 non-planning, non-PNG files changed since 78ff217 for `TBD`, `FIXME` and `XXX`: the only hit is a string in a test's list of forbidden placeholder words (`e2e/roadmap.spec.ts:132`). No blockers.

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `e2e/perf/home-baseline.json` | 43 | `containerTag` still `v1.64.0-noble` | Info | Stale recorded metadata from an earlier perf baseline, not one of the four wired tag sites; `guard:parity` passes. Not a Phase 13 requirement |
| `deferred-items.md` | n/a | 25 dev-only npm audit advisories, audit step warn-only | Info | Pre-existing, owner Tim, production deps clean |

### Human Verification Required

#### 1. Deployment Checks live proof

**Test:** After Tim merges the phase-close PR, watch the production deployment of the merge commit.
**Expected:** It is held until that commit's `CI OK` is success, then promoted (about 40 minutes). If it deploys first, the D-07 residual applies.
**Why human:** The Vercel setting has no API the agent can read; accepted risk AR-13-06. Fallback owner: the first Phase 14 merge.

#### 2. Phase-close merge consequences

**Test:** After the merge, check #140 and that main carries the review fixes.
**Expected:** #140 closed by Dependabot; origin/main contains the WR-01..WR-05 fix commits. Until then the live classifier and relay on main are the pre-fix versions.
**Why human:** Depends on a merge only Tim performs.

#### 3. Relay long-mirror path

**Test:** First PR with a `[ci skip]` head that changes code.
**Expected:** The relay `CI OK` mirrors the dispatched full run (about 40 minutes, inside the 100-minute timeout) and matches its conclusion.
**Why human:** Only the docs-only mirror has run live.

### Gaps Summary

No gaps. Every must-have that can be checked from the repository and from read-only GitHub state holds: the required `CI OK` check and live ruleset, the docs-only fast path and skip relay with three live proofs, the fail-closed limiter with its route behavior and tests, the single Playwright 1.65 commit with a zero-diff re-baseline, the sitemap-driven audit sweep, the G5/G6 tests, the triaged ledger and the CLEAN-01 removals. The phase is `human_needed` rather than `passed` because the "nor reaches production unchecked" half of GUARD-08 depends on a Vercel Deployment Checks setting that is configured but not yet shown to hold a deployment, which cannot be proven before a merge to `main`. Two further items are merge-dependent tails (#140 closing, review fixes reaching main).

---

_Verified: 2026-11-13T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
