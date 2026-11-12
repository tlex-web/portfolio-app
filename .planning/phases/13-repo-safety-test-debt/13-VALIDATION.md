---
phase: "13"
slug: "repo-safety-test-debt"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-12"
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `13-RESEARCH.md` § Validation Architecture. Task IDs are filled in once the plans exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest ^30.5.2 (jsdom default; `@jest-environment node` per file), Playwright 1.64.1 → 1.65.0, Node guard selftest harness (`scripts/guards/selftest.mjs`) |
| **Config file** | `jest.config.js`, `playwright.config.ts`, `playwright.prod.config.ts`, `scripts/guards/selftest.mjs` |
| **Quick run command** | `npx jest lib/__tests__/rate-limit.test.ts app/api/__tests__/feedback.test.ts` ; `npm run guard:selftest` |
| **Full suite command** | `npm run lint && npm run type-check && npm test` (local); `CI OK` on the PR is authoritative (three-engine E2E and Visual) |
| **Estimated runtime** | ~60 seconds quick, a few minutes full local; ~40 minutes for CI |

`next/jest` does not load `.env.local` in the test environment, so limiter tests pass an explicit env object.

---

## Sampling Rate

- **After every task commit:** the quick commands for the touched area, plus `npm run guard:selftest` for any guard or script change
- **After every plan wave:** `npm run lint && npm run type-check && npm test`
- **Before `/gsd-verify-work`:** a green `CI OK` on the phase PR, the three D-10 proofs recorded, `gh api` ruleset verification, and Tim's 429 probe
- **Max feedback latency:** 120 seconds locally (CI excluded)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | GUARD-07 | — | `ci-ok` needs every job; no workflow-level `paths:`; `CI OK` name unique except the D-06 relay on marked heads | guard + selftest | `node scripts/guards/check-ci-gate.mjs && npm run guard:selftest` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GUARD-08 | — | `CI OK` jq expression accepts only intended skips | unit (jq fixtures in the `check-ci-gate` selftest) | `npm run guard:selftest` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GUARD-08 | — | The relay never checks out PR code; fork heads with a marker go red | guard (static check of `ci-skip-relay.yml`) | `node scripts/guards/check-ci-gate.mjs` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GUARD-09 | — | Production refuses on unconfigured, error and timeout (`reason: "timeout"`); preview and dev allow; both name pairs; no mixed pair; no throw at module load | unit | `npx jest lib/__tests__/rate-limit.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GUARD-09 | — | Route returns 503 `server-error` on `unavailable` and logs metadata only | unit | `npx jest app/api/__tests__/feedback.test.ts` | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | DEPS-06 | — | All four container tag sites equal the lockfile version | guard + CI | `npm run guard:parity` | ✅ | ⬜ pending |
| TBD | TBD | TBD | VERIFY-05 | — | Every `app/(site)/**/page.tsx` template has a `ROUTES` representative | unit | `npx jest <template-coverage test>` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | VERIFY-05 | — | Sweep covers every sitemap path | e2e | `PW_PROD=1 npx playwright test e2e/audit.spec.ts --project=chromium` | ✅ (extend) | ⬜ pending |
| TBD | TBD | TBD | VERIFY-06 | — | G5: wrong offset, GPS drift or off-plate fails the build. G6: an invalid source keeps existing derivatives and exits 1 | selftest (spawn, `--root`) | `npm run guard:selftest` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | VERIFY-07 | — | Every ledger row has a final disposition | doc check | `git grep -n "\| open \|" -- .planning/milestones/v2.0-phases/` returns no Phase 7, 9, 10 or 12 rows | ✅ | ⬜ pending |
| TBD | TBD | TBD | CLEAN-01 | — | Removal targets gone | grep | `git grep -n "TILT_CONFIG\|cssDuration\|cssEase\|dns-prefetch\|_next/image" -- lib app public .github next.config.ts` returns nothing | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/__tests__/rate-limit.test.ts` (`@jest-environment node`; mock `@upstash/ratelimit` and `@upstash/redis`) — GUARD-09
- [ ] `scripts/guards/check-ci-gate.mjs` + `scripts/guards/__selftest__/ci-gate/{good,bad-*}/` + `guard:ci` in the `lint` chain — GUARD-07/08
- [ ] `--root` flags in `build-photo-data.mjs` and `build-derivatives.mjs`, then G5/G6 cases in `selftest.mjs` — VERIFY-06
- [ ] Template-coverage unit test (every `app/(site)/**/page.tsx` maps to a `ROUTES` entry) — VERIFY-05

No framework install needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `main` ruleset live, no bypass | GUARD-07 | Repository setting Tim applies (D-04) | `gh api repos/tlex-web/portfolio-app/rules/branches/main`, then diff the ruleset GET against `main-ruleset.json` |
| A red PR cannot merge | GUARD-07 | Live GitHub proof (D-10) | Draft PR → ready just before the attempt → `gh pr merge --merge` is refused (never `--admin`); record `mergeStateStatus` |
| A `[ci skip]` head gets a final `CI OK` from the relay; a docs-only PR takes the fast path | GUARD-08 | Live GitHub proof (D-10, settles whether the relay check attaches to the head SHA) | `gh pr checks <n>`; `gh api repos/…/commits/<sha>/check-runs --jq '.check_runs[]|{name,conclusion}'` |
| Production waits on `CI OK` (or the residual is recorded) | GUARD-08 | Vercel dashboard setting (D-07) | Tim confirms Deployment Checks on Hobby; else a PROJECT.md Key Decisions row |
| The sixth rapid submission gets a 429 in production | GUARD-09 | Live probe locks the probing IP out for up to an hour | `PROD_FORM_LIMIT=1 npm run test:prod-form` (Tim runs or approves) |
| Playwright 1.65 re-baseline lands alone | DEPS-06 | Tim commits the PNGs | `node scripts/ci/check-visual-run.mjs --sha <HEAD> --wait 30`; `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some …` |
| No pixel change from CLEAN-01 | CLEAN-01 | CI visual run | `check-visual-run.mjs` + `check-snapshot-commit.mjs --none` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
