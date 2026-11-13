---
phase: "13"
slug: "repo-safety-test-debt"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-12"
validated: "2026-11-13"
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `13-RESEARCH.md` § Validation Architecture. Task IDs filled and statuses set by `/gsd-validate-phase 13` on 2026-11-13, after all 22 plans completed.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest ^30.5.2 (jsdom default; `@jest-environment node` per file), Playwright 1.65.0 (1.64.1 until 13-18), Node guard selftest harness (`scripts/guards/selftest.mjs`, 201 cases), with `scripts/guards/lib/workflow-shell.mjs` running real workflow `run:` blocks under stub `gh`/`sleep` |
| **Config file** | `jest.config.js`, `playwright.config.ts`, `playwright.prod.config.ts`, `scripts/guards/selftest.mjs` |
| **Quick run command** | `npx jest lib/__tests__/rate-limit.test.ts app/api/__tests__/feedback.test.ts` ; `npm run guard:selftest` |
| **Full suite command** | `npm run lint && npm run type-check && npm test` (local); `CI OK` on the PR is authoritative (three-engine E2E and Visual) |
| **Estimated runtime** | selftest ~34 s, lint ~47 s, jest ~15 s on the Windows dev box; ~40 minutes for CI |

`next/jest` does not load `.env.local` in the test environment, so limiter tests pass an explicit env object.

The `workflow-shell` selftest cases need bash and never skip. On Windows they use Git Bash, found through `git --exec-path`. They never use the WSL `bash` that is first on the PATH. Elsewhere they use `/bin/bash`. If neither is found they fail and name the paths they tried. `GUARD_SELFTEST_WORKFLOW_DIR` points them at a mutated copy of the workflows, so you can watch a case go red.

---

## Sampling Rate

- **After every task commit:** the quick commands for the touched area, plus `npm run guard:selftest` for any guard, script or workflow change
- **After every plan wave:** `npm run lint && npm run type-check && npm test`
- **Before `/gsd-verify-work`:** a green `CI OK` on the phase PR, the three D-10 proofs recorded, `gh api` ruleset verification, and Tim's 429 probe
- **Max feedback latency:** 120 seconds locally (CI excluded)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-T1..T3 | 13-01 | 1 | GUARD-07 | T-13-01, T-13-02, T-13-03 | `ci-ok` needs every job, runs `if: always()`, `CI OK` name unique except the D-06 relay on marked heads, no `checks: write`, explicit token scopes (rules 1-7) | guard + selftest | `node scripts/guards/check-ci-gate.mjs && npm run guard:selftest` | ✅ | ✅ green |
| 13-01-T1, 13-07-T1 | 13-01, 13-07 | 1, 2 | GUARD-08 | T-13-03, T-13-16 | `CI OK` jq verdict accepts only intended skips (15 `ci-ok.jq:` cases) | unit (jq fixtures) | `npm run guard:selftest` | ✅ | ✅ green |
| 13-07-T1 | 13-07 | 2 | GUARD-08 | T-13-16 | Docs-only classifier: exact allow-list; empty, truncated and renamed-from-code diffs run full CI (13 `classify:` / `classify CLI:` cases) | unit + CLI | `npm run guard:selftest` | ✅ | ✅ green |
| 13-07-T1 (G2) | 13-07 | 2 | GUARD-08 | T-13-16, T-13-17 | The real `changes` "Classify the diff" block. workflow_dispatch compares `main...HEAD`. An empty or all-zero base and a failed compare give `docs_only=false` with exit 0. 300+ files pass `--truncated`. Renames and file names with a line break count as code. A body with no `files` key gives false (10 `workflow-shell changes:` cases, `5cdec94`) | integration (real run block, stub gh, real jq and classifier) | `npm run guard:selftest` | ✅ | ✅ green |
| 13-07-T2 | 13-07 | 2 | GUARD-08 | T-13-18 | `workflow_dispatch` required; no workflow-level `paths:`/`paths-ignore:`; docs-only job set equals the jq `IN(...)` list and each needs `changes` (rules 8-10) | guard + selftest | `node scripts/guards/check-ci-gate.mjs && npm run guard:selftest` | ✅ | ✅ green |
| 13-10-T1..T2 | 13-10 | 3 | GUARD-08 | T-13-22, T-13-23, T-13-25, T-13-26 | The relay never checks out PR code. It has no `${{` in a run block, no job-level `if:` on the job that can be CI OK, `pull_request_target` as its only trigger, and `permissions: {}` with `actions: write` as its only write scope (rules 11-15) | guard (static check of `ci-skip-relay.yml`) | `node scripts/guards/check-ci-gate.mjs && npm run guard:selftest` | ✅ | ✅ green |
| 13-10-T1 (G1) | 13-10 | 3 | GUARD-08 | T-13-23, T-13-24, T-13-26, T-13-27 | The real relay `detect` and dispatch blocks. Five bracket markers (any case) and the `skip-checks` trailer are detected. Near misses and a head that already has a pull_request CI run get no relay. A runs-API failure writes no output. **A fork head with a marker goes red without dispatching.** The dispatch passes exact args. Success, failure and cancelled are mirrored. A moved SHA, or no run within 30 polls, goes red. A hostile ref stays data (20 `workflow-shell detect:` / `relay:` cases, `952c3a6`) | integration (real run blocks, stub gh/sleep, Git Bash or `/bin/bash`) | `npm run guard:selftest` | ✅ | ✅ green |
| 13-07-T2, 13-10-T2 (G3) | 13-07, 13-10 | 2, 3 | GUARD-07, GUARD-08 | T-13-18, T-13-22, T-13-23, T-13-25 | Guard parser edge cases. ci.yml `on:` in flow-list, flow-map, scalar and quoted-key form, plus CRLF copies. Relay: `${{` in a shell comment, `git clone`, `actions: write` on `detect`, an extra `workflow_dispatch` trigger, flow-form `on:` (14 `ci-gate:` cases, `95ef833`) | selftest (temp fixture roots) | `npm run guard:selftest` | ✅ | ✅ green |
| 13-02-T1..T2 | 13-02 | 1 | GUARD-09 | T-13-04, T-13-05, T-13-07, T-13-08 | Production refuses on unconfigured, error and timeout (`reason: "timeout"`); preview and dev allow; both name pairs; no mixed pair; no throw at module load (18 tests) | unit | `npx jest lib/__tests__/rate-limit.test.ts` | ✅ | ✅ green |
| 13-02-T1..T2 | 13-02 | 1 | GUARD-09 | T-13-06 | Route returns 503 `server-error` with no Retry-After on `unavailable` and logs metadata only | unit | `npx jest app/api/__tests__/feedback.test.ts` | ✅ | ✅ green |
| 13-02-T3 | 13-02 | 1 | GUARD-09 | — | Production probe: the `PROD_FORM_LIMIT` loop posts honeypot bodies and names a 503 as limiter unavailable | static check + list | 13-02 Task 3 inline `node -e` check; `npx playwright test --config=playwright.prod.config.ts --list` | ✅ | ✅ green |
| 13-05-T2 | 13-05 | 1 | GUARD-09, GUARD-08 | T-13-12 | Keep-alive: schedule and dispatch only, no `pull_request`, no `CI OK`, no `checks: write`, explicit scopes | guard (rules 5-7 on every workflow) + inline check | `node scripts/guards/check-ci-gate.mjs`; 13-05 Task 2 inline `node -e` check | ✅ | ✅ green |
| 13-18-T2 | 13-18 | 9 | DEPS-06 | T-13-44 | All four container tag sites equal the lockfile version (1.65.0) | guard + CI | `npm run guard:parity` | ✅ | ✅ green |
| 13-03-T2 | 13-03 | 1 | VERIFY-05 | T-13-10 | Every `app/(site)/**/page.tsx` template has a `ROUTES` representative; every sitemap path (coin-flip and every photo slug) is audited once (9 tests) | unit | `npx jest lib/__tests__/audit-routes.test.ts` | ✅ | ✅ green |
| 13-03-T1 | 13-03 | 1 | VERIFY-05 | T-13-09 | The sweep audits every sitemap path in Chromium | e2e | `PW_PROD=1 npx playwright test e2e/audit.spec.ts --project=chromium -g "every sitemap page"` (green in CI run 43494117521 on `cffcf99`, with no code change since) | ✅ | ✅ green |
| 13-12-T1..T2 | 13-12 | 4 | VERIFY-06 | T-13-31 | G5: wrong offset, GPS drift or off-plate fails the build (4 cases). G6: an invalid source keeps existing derivatives and exits 1 (1 case) | selftest (spawn, `--root`) | `npm run guard:selftest` | ✅ | ✅ green |
| 13-06-T1, 13-22-T2 | 13-06, 13-22 | 1, 12 | VERIFY-07 | T-13-15, T-13-51 | Every ledger row has a final disposition (44/44: fixed 32, deferred 9, skipped 3) | doc check | `git grep -n -E "disposition: open\|\| open \|" -- .planning/milestones/v2.0-phases/` returns no Phase 7, 9, 10 or 12 rows | ✅ | ✅ green |
| 13-08, 13-09, 13-11, 13-13, 13-14 | several | 2-6 | VERIFY-07 | T-13-19, T-13-20, T-13-28, T-13-32, T-13-33, T-13-34 | Each fixed row has a test. Jest: `home-format`, `lightbox-dialog`, `hotspots`, `css-escape`, `service-worker-media`, `SummitRegister`, `SafeCanvas`. Selftest: contrast, palette, parity, same-classnames, snapshot-commit. E2E: shell, home-ascent, homepage, photos-lightbox | unit + selftest + e2e | `npm test && npm run guard:selftest` (e2e in CI) | ✅ | ✅ green |
| 13-04-T1..T2, 13-07-T3 | 13-04, 13-07 | 1, 2 | CLEAN-01 | T-13-11 | Removal targets gone; SW image path keyed on `request.destination` | grep + unit | `git grep -n -E "TILT_CONFIG\|cssDuration\|cssEase\|dns-prefetch\|_next/image" -- lib app public .github next.config.ts` and `git grep -n optimize-images -- .github` return nothing; `npx jest lib/__tests__/service-worker-media.test.ts lib/__tests__/motion-tokens.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

The human checkpoint tasks are listed under Manual-Only. They are 13-05-T1, 13-06-T3, 13-15-T2, 13-16-T2..T3, 13-17-T2, 13-18-T1, 13-19-T3, 13-20-T1/T3 and 13-21-T2. The live-proof tasks are 13-15-T3, 13-16, 13-17, 13-19 and 13-20-T2.

---

## Wave 0 Requirements

- [x] `lib/__tests__/rate-limit.test.ts` (`@jest-environment node`; mock `@upstash/ratelimit` and `@upstash/redis`) — GUARD-09
- [x] `scripts/guards/check-ci-gate.mjs` + `scripts/guards/__selftest__/ci-gate/{good,bad-*}/` + `guard:ci` in the `lint` chain — GUARD-07/08
- [x] `--root` flags in `build-photo-data.mjs` and `build-derivatives.mjs`, then G5/G6 cases in `selftest.mjs` — VERIFY-06
- [x] Template-coverage unit test (every `app/(site)/**/page.tsx` maps to a `ROUTES` entry) — VERIFY-05

No framework install needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Evidence |
|----------|-------------|------------|-------------------|----------|
| `main` ruleset live, no bypass | GUARD-07 | Repository setting Tim applies (D-04) | `gh api repos/tlex-web/portfolio-app/rules/branches/main`, then diff the ruleset GET against `main-ruleset.json` | 13-16: ruleset 27216079 matches `main-ruleset.json`; 10401314 returns 404 |
| A red PR cannot merge | GUARD-07 | Live GitHub proof (D-10) | Draft PR → ready just before the attempt → `gh pr merge --merge` is refused (never `--admin`); record `mergeStateStatus` | 13-19: PR #144 BLOCKED, merge refused |
| A `[ci skip]` head gets a final `CI OK` from the relay; a docs-only PR takes the fast path | GUARD-08 | Live GitHub proof (D-10, settles whether the relay check attaches to the head SHA) | `gh pr checks <n>`; `gh api repos/…/commits/<sha>/check-runs --jq '.check_runs[]\|{name,conclusion}'` | 13-19: PR #146 relay CI OK success, required; PR #145 docs_only=true, CLEAN. The full ~40-minute mirror has not been run live (handed over by 13-19). The G1 cases cover its shell logic |
| Production waits on `CI OK` (or the residual is recorded) | GUARD-08 | Vercel dashboard setting (D-07) | Tim confirms Deployment Checks on Hobby; else a PROJECT.md Key Decisions row | 13-16: Tim's reply "applied, deployment checks on". The live proof is due at the phase-close merge (13-22) |
| The sixth rapid submission gets a 429 in production | GUARD-09 | Live probe locks the probing IP out for up to an hour | `PROD_FORM_LIMIT=1 npm run test:prod-form` (Tim runs or approves) | 13-17: Tim ran it; 429 with Retry-After > 0 |
| Playwright 1.65 re-baseline lands alone | DEPS-06 | Tim commits the PNGs | `node scripts/ci/check-visual-run.mjs --sha <HEAD> --wait 30`; `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some …` | 13-20: 48/48 PNGs blob-identical, Tim's "none", no PNG commit. #140 closes with the phase PR |
| No pixel change from CLEAN-01 | CLEAN-01 | CI visual run | `check-visual-run.mjs` + `check-snapshot-commit.mjs --none` | 13-15: Visual Regression PASS; `--none` OK on both CLEAN-01 commits |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (human checkpoints and live proofs are in Manual-Only)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-11-13 by `/gsd-validate-phase 13`. The audit found 3 PARTIAL gaps: the relay shell (G1), the `changes` step shell (G2) and the guard parser edge cases (G3). Each had been verified only by uncommitted scratchpad harnesses. The gap gate was settled by Tim's AskUserQuestion selection, as relayed by the orchestrator: "Fix all gaps (Recommended)". gsd-nyquist-auditor filled all three with 44 committed selftest cases: `952c3a6` (G1, 20), `5cdec94` (G2, 10) and `95ef833` (G3, 14). Each gap was proven able to fail against a mutated temp copy. None was escalated, and no implementation file changed. This file previously claimed that check-ci-gate verifies "fork heads go red". It does not. That behaviour is now covered by the G1 case "a fork head exits 1 with the fork error and never calls gh".

## Validation Audit 2026-11-13

| Metric | Count |
|---|---|
| Gaps found | 3 |
| Resolved | 3 |
| Escalated | 0 |
