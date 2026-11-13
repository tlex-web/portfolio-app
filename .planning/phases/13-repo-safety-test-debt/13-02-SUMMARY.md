---
phase: 13-repo-safety-test-debt
plan: 02
subsystem: api
tags: [upstash, ratelimit, redis, contact-form, fail-closed, jest, playwright]

requires:
  - phase: 12 (v2.0)
    provides: "/api/feedback contract (FEEDBACK_CODES, logFeedback, respond), SummitRegister outcomeOf mapping server-error to the send failure copy, the opt-in production probe"
provides:
  - "lib/rate-limit.ts: createRateLimiter(env), upstashCredentials(env), LIMIT_TIMEOUT_MS = 3000, type Unavailable, RateLimitResult.unavailable; feedbackRateLimit keeps its name"
  - "Production fail-closed limiter: unconfigured, Redis error and library timeout all refuse with one [rate-limit] refusal line"
  - "/api/feedback answers 503 server-error (no Retry-After) when the limiter is unavailable; FeedbackOutcome 'limiter-unavailable'"
  - "Production probe speaks fail-closed (503 = limiter unavailable) and its PROD_FORM_LIMIT loop posts honeypot bodies"
  - ".env.example documents both accepted Upstash name pairs"
affects: [13-05 production variable names, 13-15 mid-phase PR gate, 13-17 live 429 probe]

actuals:
  tokens: 15615   # chars/4 over the 7 changed files as they now stand; the realized diff alone is 7316
  tasks: 3
  commits: 6
plan_head_before: 34fdb49b69a3ff9908d4cd61b3a75f2d9c9e5382
plan_head_after: 583fc1545cf405924fe6f2052c237e8d08840500

tech-stack:
  added: []
  patterns:
    - "Env-injected factory: createRateLimiter(env = process.env) so tests pass explicit env objects instead of mutating process.env"
    - "Fail-closed wrapper around a third-party limiter: production refuses on missing config, rejection and the library's success-on-timeout"
    - "One complete credential pair or none: never the Redis client's per-variable env factory"

key-files:
  created:
    - lib/__tests__/rate-limit.test.ts
  modified:
    - lib/rate-limit.ts
    - app/api/feedback/route.ts
    - lib/contact/api-contract.ts
    - app/api/__tests__/feedback.test.ts
    - e2e/prod/contact-form.prod.ts
    - .env.example

key-decisions:
  - "13-02: the limiter refuses only when VERCEL_ENV === 'production' (D-12); previews rethrow a Redis error to the route's outer catch (500) and allow on timeout, exactly as before"
  - "13-02: credentials are one complete pair, UPSTASH_REDIS_REST_* first, then KV_REST_API_*; empty strings count as missing; a mixed pair is unconfigured. Which pair production actually sets is still 13-05's open input"
  - "13-02: LIMIT_TIMEOUT_MS = 3000 is passed as the Ratelimit timeout (the form aborts at 15 s); results pass through as success, limit, remaining, reset only"
  - "13-02: the PROD_FORM_LIMIT loop posts honeypot bodies (GUARD-09 wording); a shared honeypotBody() helper keeps the HONEYPOT_FIELD count at 2"

patterns-established:
  - "Refusal log: console.error('[rate-limit]', { event: 'rate-limit', outcome: 'refused', reason, timestamp }), no identifier or visitor data"

requirements-completed: [GUARD-09]

coverage:
  - id: D1
    description: "Production with no complete Upstash pair refuses every limit() call with unavailable 'unconfigured' and one refusal line; importing the module in that state does not throw"
    requirement: GUARD-09
    verification:
      - kind: unit
        ref: "lib/__tests__/rate-limit.test.ts#production with no credentials (D-11) > refuses with unavailable unconfigured and logs one [rate-limit] refusal"
        status: pass
      - kind: unit
        ref: "lib/__tests__/rate-limit.test.ts#module import (T-13-07) > does not throw with production env and no credentials"
        status: pass
    human_judgment: false
  - id: D2
    description: "Production refuses on a Redis error ('error') and on the library's timeout answer ('timeout'); previews rethrow the error and allow on timeout"
    requirement: GUARD-09
    verification:
      - kind: unit
        ref: "lib/__tests__/rate-limit.test.ts#production with credentials (D-11) > refuses with unavailable error / timeout"
        status: pass
      - kind: unit
        ref: "lib/__tests__/rate-limit.test.ts#preview with credentials (D-12)"
        status: pass
    human_judgment: false
  - id: D3
    description: "One complete credential pair: UPSTASH pair, else KV pair, UPSTASH wins when both are set; mixed and empty pairs are unconfigured; Ratelimit built with slidingWindow(5, '1 h'), prefix, analytics and timeout 3000"
    requirement: GUARD-09
    verification:
      - kind: unit
        ref: "lib/__tests__/rate-limit.test.ts#construction with credentials"
        status: pass
      - kind: unit
        ref: "lib/__tests__/rate-limit.test.ts#upstashCredentials"
        status: pass
    human_judgment: false
  - id: D4
    description: "/api/feedback answers 503 { code: 'server-error' } with no Retry-After and logs outcome limiter-unavailable; the 429 path and its Retry-After are unchanged"
    requirement: GUARD-09
    verification:
      - kind: unit
        ref: "app/api/__tests__/feedback.test.ts#Rate Limiting > answers 503 server-error with no Retry-After when the limiter is unavailable (GUARD-09, D-11)"
        status: pass
      - kind: unit
        ref: "app/api/__tests__/feedback.test.ts#Rate Limiting (existing 429 cases)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A refused submission shows the existing 'Couldn't send' copy with no UI change"
    requirement: GUARD-09
    verification:
      - kind: other
        ref: "git diff --stat -- components/contact/SummitRegister.tsx (empty); FEEDBACK_CODES still six members"
        status: pass
    human_judgment: true
    rationale: "Copy reuse is shown by the unchanged outcomeOf mapping, not by a test that renders the form against a 503; the plan marks this prohibition as judgment"
  - id: D6
    description: "The production probe speaks fail-closed and its limit loop posts honeypot bodies; .env.example lists both pairs"
    requirement: GUARD-09
    verification:
      - kind: other
        ref: "npx playwright test --config=playwright.prod.config.ts --list (4 tests; 6 with both flags) and the plan's limit-loop node check"
        status: pass
    human_judgment: true
    rationale: "The probe was listed, not run: it needs production and Tim's approval (13-17)"

duration: 7min
completed: 2026-11-13
status: complete
---

# Phase 13 Plan 02: Fail-closed production rate limiter Summary

**The contact form's Upstash limiter now refuses in production (VERCEL_ENV === 'production') when it is unconfigured, errors or times out, reading one complete UPSTASH_ or KV_ credential pair; the route answers 503 `server-error`, which the form already shows as "Couldn't send".**

## Performance

- **Duration:** 7 min
- **Started:** 2026-11-13T10:23:33Z
- **Completed:** 2026-11-13T10:30:37Z
- **Tasks:** 3
- **Files modified:** 7 (1 created, 6 modified)

## Accomplishments

- `lib/rate-limit.ts` is an env-injected factory. In production, missing credentials, a rejected `limit()` and the library's `{ success: true, reason: 'timeout' }` all become `{ success: false, limit: 0, remaining: 0, reset: 0, unavailable }`, each with one metadata-only `[rate-limit]` error line. It never throws at construction, so `next build` can import it.
- Credentials come from `upstashCredentials(env)`: the UPSTASH pair, else the KV pair, never mixed, with empty strings counted as missing. `Redis.fromEnv()` is gone (it falls back one variable at a time). `LIMIT_TIMEOUT_MS = 3000` is passed to `Ratelimit`.
- `/api/feedback` checks `unavailable` before `!success`, logs `limiter-unavailable` and answers 503 `{ code: 'server-error' }` with no `Retry-After`. `FEEDBACK_CODES` and `SummitRegister.tsx` are untouched.
- The production probe treats 503 as "limiter unavailable" (and 500 as a crash). Its `PROD_FORM_LIMIT` loop posts honeypot bodies and expects 200 `ok` until the 429. `.env.example` documents both pairs, the production refusal and where `VERCEL_ENV` comes from.

## Task Commits

1. **Task 1: Production with no credentials refuses end to end (tracer)**: `da02659` (test, RED), then `a977bed` (feat, GREEN)
2. **Task 2: Error, timeout and credential-pair paths**: `49a027d` (test, RED), then `04d705f` (feat, GREEN)
3. **Task 3: Probe wording, honeypot limit loop and .env.example**: `043dfcb` (chore)
4. **Lint fix (deviation 2)**: `583fc15` (fix)

**Plan metadata:** recorded in the docs commit that adds this file.

## TDD Gate Compliance

| Task | RED | GREEN | REFACTOR |
|------|-----|-------|----------|
| 1 | `da02659`: 3 targets failed on assertions, each RED_EVIDENCE_OK (`target_test_failed`). (a) The production no-credentials case: expected `{ success: false, …, unavailable: 'unconfigured' }`, got the allow-all `{ success: true, limit: 5, … }`. (b) The route case: expected 503, got 429. (c) The warning: expected `KV_REST_API_URL` in it, but it named only the UPSTASH pair. 56 other tests passed, so this was no load fault. | `a977bed`: 59/59 | none needed |
| 2 | `49a027d`: 9 targets failed. 3 were classified RED_EVIDENCE_OK: the production timeout (passed straight through as success), the production error (the mock rejection escaped `limit()`), and Redis built from the pair (constructor called 0 times, because `fromEnv` was used). The other 6 failures were the timeout constant (undefined), the KV pair, UPSTASH precedence, result pass-through, preview timeout shape and `upstashCredentials` (the export did not exist yet). Before the change, the mixed and empty pair cases, preview error propagation and the import case already passed. They pin behaviour that must not regress. | `04d705f`: 73/73 | none needed |

Evidence came from `npx jest … --reporters=<scratchpad TAP 13 reporter>` and was classified by `gsd-tools check tdd-red-evidence`. The records are `.git/gsd-red-13-02-t1-{0,1,2}.json` and `.git/gsd-red-13-02-t2-{0,1,2}.json` (untracked by design). Jest has no TAP or JUnit reporter installed, so a 40-line TAP reporter in the session scratchpad produced the report from the real run. The tracer gate re-ran Task 1's `<verify>` green (59/59) before Task 2 started.

## Files Created/Modified

- `lib/rate-limit.ts`: factory, credential pair, timeout, production refusal, header comment describing the rule and both pairs
- `lib/__tests__/rate-limit.test.ts` (new): 18 cases covering production, preview, pairs, construction and import
- `app/api/feedback/route.ts`: `unavailable` branch, 503 `server-error`
- `lib/contact/api-contract.ts`: `'limiter-unavailable'` outcome; the contract table's `server-error` row notes 503
- `app/api/__tests__/feedback.test.ts`: the 503 case (the VISITOR_TEXT afterEach covers its log privacy)
- `e2e/prod/contact-form.prod.ts`: fail-closed wording, `honeypotBody()` helper, honeypot limit loop, updated doc table
- `.env.example`: both pairs, production refusal, `VERCEL_ENV` source

## Decisions Made

- Fail-closed only when `VERCEL_ENV === 'production'` (D-12). Preview behaviour is unchanged: no credentials means allow plus one warning, a Redis error still reaches the route's outer catch as 500, and a timeout allows.
- The no-429 probe message also names Pitfall 3 (`VERCEL_ENV` not reaching the function), because with fail-closed an allow-everything production limiter can only mean the code does not see production.
- No production variable names are assumed. The code reads both pairs, and which one Vercel sets stays 13-05's input (Pitfall 2 gate in 13-15).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Exported the existing `createRateLimiter` in the Task 1 RED commit**
- **Found during:** Task 1 RED
- **Issue:** The new tests first failed with `createRateLimiter is not a function`, which is a missing-symbol fault rather than an assertion failure, and is not valid RED.
- **Fix:** Added only the `export` keyword to the unchanged function in the RED commit. The targets then failed on their planned assertions.
- **Files modified:** lib/rate-limit.ts
- **Verification:** RED_EVIDENCE_OK for all three Task 1 targets
- **Committed in:** `da02659`

**2. [Rule 1 - Bug] `npm run lint` failed on the import test's `require()`**
- **Found during:** plan-level verification
- **Issue:** `@typescript-eslint/no-require-imports` flagged the `require('@/lib/rate-limit')` inside `jest.isolateModules`.
- **Fix:** Added the repo's reasoned `eslint-disable-next-line` (the same pattern as `hero.test.tsx` and `lib/og/__tests__/routes.test.ts`).
- **Files modified:** lib/__tests__/rate-limit.test.ts
- **Verification:** `npm run lint` exit 0 (eslint plus all guards)
- **Committed in:** `583fc15`

**3. [Rule 1 - Acceptance] Reworded a doc comment that mentioned `Redis.fromEnv()`**
- **Found during:** Task 2 acceptance check (`grep -c fromEnv lib/rate-limit.ts` must be 0)
- **Fix:** The comment now says "the Redis client's env-based factory". Made before the GREEN commit.
- **Committed in:** `04d705f`

**4. [Note] One test swaps `process.env`**
- The import case (T-13-07) has to read `process.env`, so it uses `jest.replaceProperty(process, 'env', …)` and restores it in `finally`. Every other case passes an explicit env object, as the plan requires.

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 correctness), plus 1 note.
**Impact on plan:** None on scope. Each fix was needed for valid RED evidence or a green `npm run lint`.

## Issues Encountered

None. The uncommitted `.gitignore` change (`.env*`) was present throughout. It was never staged or touched.

## Verification

- `npx jest lib/__tests__/rate-limit.test.ts app/api/__tests__/feedback.test.ts`: 73/73
- `npm run lint`: exit 0 (eslint, parity, ci-gate, palette, contrast, identity, selftest, data:check, images)
- `npm run type-check`: exit 0
- `npm test`: 103 suites, 1723 tests, all passed. The test-count ratchet only fails below its baseline, so it needs no change.
- `npx playwright test --config=playwright.prod.config.ts --list`: 4 tests (6 with `PROD_FORM_LIMIT=1 PROD_FORM_SEND=1`). Nothing was run against production.
- Plan limit-loop node check: `limit loop: honeypot bodies, 503 handled`
- Acceptance greps: `limiter-unavailable` route 1 / contract 1; SummitRegister diff empty; `FEEDBACK_CODES` has 6 members; `fromEnv` 0; `KV_REST_API_URL` 4 in `lib/rate-limit.ts` and 1 in `.env.example`; `LIMIT_TIMEOUT_MS` 2; `503` 5 and `HONEYPOT_FIELD` 2 in the probe.

## User Setup Required

None from this plan. The production variable pair (13-05) and the live 429 probe (13-17) are already owned by later plans.

## Next Phase Readiness

- This code must not reach `main` until 13-05 records which pair production sets (Pitfall 2; the 13-15 gate). Otherwise every production contact POST answers 503.
- 13-17 runs `PROD_FORM_LIMIT=1 npm run test:prod-form`. The loop now sends honeypot bodies, and in a fresh window the 429 comes on the sixth request overall.

---
*Phase: 13-repo-safety-test-debt*
*Completed: 2026-11-13*

## Self-Check: PASSED

All 7 files exist. Commits `da02659`, `a977bed`, `49a027d`, `04d705f`, `043dfcb` and `583fc15` are ancestors of HEAD.
