---
phase: 12-contact-edge-pages-cleanup-verification
plan: 03
subsystem: api
tags: [nextjs, route-handler, zod, honeypot, rate-limit, csrf, logging, jest]

requires:
  - phase: 05 (v1.0)
    provides: validateOrigin CSRF check and Upstash feedbackRateLimit (unchanged here)
provides:
  - lib/contact/api-contract.ts (FEEDBACK_CODES, FeedbackCode, FeedbackResponse, FeedbackField, FieldIssue, FeedbackOutcome, FEEDBACK_LIMITS, HONEYPOT_FIELD, retryAfterSeconds)
  - POST /api/feedback answering every outcome with { code, retryAfterS?, fields? }
  - trail_note honeypot evaluated after the origin check and the rate limit
  - metadata-only [feedback] log line per submission
affects: [12-13 contact form, 12-06 zod bump, gsd-secure-phase]

actuals:
  tokens: 9059
  tasks: 2
  commits: 4
plan_head_before: 0839151fd20e0cb4663ce217716d67eb5b796b7d
plan_head_after: c3bc5e10744b83c386d3b85f27164e53de0d1d44

tech-stack:
  added: []
  patterns:
    - "Import-free client-safe contract module shared by a route handler and its form"
    - "Route-local logFeedback(outcome, ip): one metadata-only [feedback] line per submission"
    - "Console-spy afterEach that fails any test whose console output contains visitor text"

key-files:
  created:
    - lib/contact/api-contract.ts
    - lib/contact/__tests__/api-contract.test.ts
  modified:
    - app/api/feedback/route.ts
    - lib/email.ts
    - app/api/__tests__/feedback.test.ts

key-decisions:
  - "Field issue mapping: an empty, missing or wrong-type value is 'required'; otherwise too_small is 'too_short', too_big is 'too_long', anything else on a visible field is 'invalid_email'. The fields key is omitted when no visible field is invalid (non-object body, malformed JSON, over-long trail_note, wrong-type interestedInCollaboration)."
  - "The outer catch logs '[feedback]' with event, error name and timestamp only (no outcome, since server-error is not one of the six FeedbackOutcome values) and returns 500 { code: 'server-error' }."
  - "A body that fails zod with a filled honeypot still gets 400 'validation', because the locked order puts zod before the honeypot."

patterns-established:
  - "Contract module: lib/contact/api-contract.ts is the single source of codes, limits and the honeypot name for the route and the 12-13 form"

requirements-completed: [CONTACT-02, CONTACT-03]

coverage:
  - id: D1
    description: "Shared feedback contract module with codes, limits, honeypot name and retryAfterSeconds (max(1, ceil((reset-now)/1000)))"
    requirement: CONTACT-02
    verification:
      - kind: unit
        ref: "lib/contact/__tests__/api-contract.test.ts (8 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Locked check order (IP, validateOrigin, limiter, body, zod, honeypot, send); origin rejection and rate limiting win over a filled honeypot"
    requirement: CONTACT-03
    verification:
      - kind: unit
        ref: "app/api/__tests__/feedback.test.ts#runs validateOrigin, then the limiter, then the body parse"
        status: pass
      - kind: unit
        ref: "app/api/__tests__/feedback.test.ts#rejects a bad origin with a filled honeypot as 403 and never calls the limiter or reads the body"
        status: pass
      - kind: unit
        ref: "app/api/__tests__/feedback.test.ts#answers 429, not 200, when rate limited with a filled honeypot, without reading the body"
        status: pass
    human_judgment: false
  - id: D3
    description: "trail_note honeypot: absent or '' sends, 1-200 characters returns 200 ok without sending and logs 'honeypot', 201 characters returns 400"
    requirement: CONTACT-03
    verification:
      - kind: unit
        ref: "app/api/__tests__/feedback.test.ts#Honeypot (trail_note) (7 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Coded responses: 429 rate-limited with retryAfterS and Retry-After, 502 send-failed on a rejected send, 400 validation with an issue-code fields map, 500 server-error, success exactly { code: 'ok' }"
    requirement: CONTACT-02
    verification:
      - kind: unit
        ref: "app/api/__tests__/feedback.test.ts (Rate Limiting, Email Integration, Validation, Malformed bodies, Error Handling)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Metadata-only logs: one [feedback] line per submission with event, outcome, ip, timestamp; no visitor name, address or message in any console call or response body; lib/email.ts logs only the Resend error name"
    requirement: CONTACT-03
    verification:
      - kind: unit
        ref: "app/api/__tests__/feedback.test.ts afterEach VISITOR_TEXT check + Data Logging"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-11-02
status: complete
---

# Phase 12 Plan 03: Feedback API Contract Summary

**POST /api/feedback now answers with typed `{ code, retryAfterS?, fields? }` bodies from a shared import-free contract module. It drops `trail_note` honeypot entries with a quiet 200 after the unchanged origin check and Upstash limit, returns 502 `send-failed` instead of 200 when the email fails, and logs only outcome, IP and timestamp.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-11-02T16:44:41Z
- **Completed:** 2026-11-02T16:50:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `lib/contact/api-contract.ts`: `FEEDBACK_CODES` (ok, validation, origin-rejected, rate-limited, send-failed, server-error), the `FeedbackResponse` / `FeedbackField` / `FieldIssue` / `FeedbackOutcome` types, `FEEDBACK_LIMITS` (100 / 10 / 2000 / 200), `HONEYPOT_FIELD = 'trail_note'` and `retryAfterSeconds`. The module has no imports, so the 12-13 form can use it safely on the client.
- The route keeps IP extraction, `validateOrigin` and `feedbackRateLimit.limit` first and in that order. The body is parsed in its own try, zod `safeParse` maps failures to issue codes, the honeypot is checked after that, and the send comes last.
- A rejected `sendFeedbackEmail` (which covers a missing or dummy `RESEND_API_KEY`) now returns 502 `send-failed`. Before, it returned 200 `{ success: true }` (D-02).
- The block that logged name, email and message is deleted. `logFeedback` writes `console.info`/`console.warn('[feedback]', { event, outcome, ip, timestamp })`, and the Resend failure log prints only the error name (D-04).
- Test counts: route suite went from 17 to 48 Jest tests (40 `it`/`test` lines by the acceptance grep, which counts each `it.each` once). The contract suite is new with 8 tests. Full Jest run: 84 suites, 1369 tests, all passing.

## Task Commits

1. **Task 1: The shared feedback contract module**
   - RED `cd7aa42` (test): 8 tests, all 8 failing on assertions against a temporary uncommitted stub with wrong values
   - GREEN `7bcbf7c` (feat)
2. **Task 2: Coded errors, honeypot, metadata-only logs**
   - RED `6f91352` (test): 48 tests, all 48 failing on assertions (old `{ success }` / `{ error }` bodies, and the afterEach visitor-text check catching the old `Feedback received:` log)
   - GREEN `c3bc5e1` (feat)

No REFACTOR commits were needed.

## TDD Evidence

- **RED (Task 1):** `npx jest lib/contact/__tests__/api-contract.test.ts` first failed with "Cannot find module". That is a load failure, so it did not count as RED. I added a temporary uncommitted stub that exports the right names with wrong values (empty tuple, `{}`, `''`, a function returning 0). The run then gave "Tests: 8 failed, 8 total", each failing on its planned assertion (for example Expected "trail_note", Received ""). Semantic assessment: valid RED. The target tests executed and failed on the planned behaviour. The stub was replaced in the GREEN commit and was never committed.
- **RED (Task 2):** `npx jest app/api/__tests__/feedback.test.ts` gave "Tests: 48 failed, 48 total". The first failures were `toEqual({ code: 'ok' })` receiving `{ success: true }`, `fields` receiving `details`, and the PII afterEach catching `"Feedback received:" {"name":"John Doe",...}`. Semantic assessment: valid RED. Every failure is an assertion on the planned contract, with no load or syntax faults.
- Jest's default reporter is not one of the supported formats for `check tdd-red-evidence` (TAP / JUnit / go / swift / unittest), and `workflow.tdd_mode` is not enabled. So the evidence above is the observed command output plus a semantic assessment, not a classifier verdict.

## Files Created/Modified

- `lib/contact/api-contract.ts`: the contract shared by the route and the form
- `lib/contact/__tests__/api-contract.test.ts`: codes order, limits, honeypot name and Retry-After rounding cases
- `app/api/feedback/route.ts`: locked order, coded bodies, honeypot, `logFeedback`, 502/500 paths
- `lib/email.ts`: the Resend failure log prints only `error.name`
- `app/api/__tests__/feedback.test.ts`: all 17 original behaviours rewritten to the new contract, plus order, honeypot, 429/Retry-After, 502, 400 shapes, 500 and the no-visitor-text checks across all four console methods

## Decisions Made

- **Issue mapping:** empty, missing or wrong-type values map to `required`. Otherwise `too_small` maps to `too_short`, `too_big` to `too_long`, and anything else to `invalid_email` (on `email`, that is the only remaining failure). The `fields` key is left out when no visible field is invalid.
- **500 log:** `console.error('[feedback]', { event, error: <name>, timestamp })`. It carries no outcome because `server-error` is not a `FeedbackOutcome`, and the IP is out of scope in the outer catch.
- **Zod still runs before the honeypot.** A bot that fills invalid values gets a 400, not the quiet 200. This is what the locked order dictates.

## Deviations from Plan

None in behaviour. Two interpretation notes on acceptance criteria:

1. **Line-order criterion (Task 2).** `grep -n "HONEYPOT_FIELD"` also matches the import (line 8) and the module-level schema key (line 31). Both are required: the import because `key_links` mandates it, and the schema key because the plan's action specifies it. I read "first `HONEYPOT_FIELD` use" as the first runtime use in `POST`: `validateOrigin(request)` at line 85 < `feedbackRateLimit.limit` at 91 < `data[HONEYPOT_FIELD]` at 116. The ordering is also proven by tests, not just by line numbers. I reworded one JSDoc line so `grep -n "feedbackRateLimit.limit"` reports the code line rather than a comment.
2. **Plan input `message: 'short'`.** The response text legitimately contains `too_short`, so a raw substring check on `short` would always match. The test checks each submitted value in its JSON-quoted form (`"short"`, `"x"`, `""`). A second test uses distinctive visitor text with a raw substring check.

**Total deviations:** 0 auto-fixed.

## Issues Encountered

- The current `components/FeedbackForm.tsx` still reads `response.ok` and `data.error`. Successful sends still show success. Failures now fall back to its generic "Something went wrong" message, because bodies no longer carry `error`. The form is rewritten to read `code` in 12-13, so this is expected for now. `e2e/a11y-contact.spec.ts` mocks the route with a 500, so it is unaffected.

## Verification

- `npx jest app/api/__tests__/feedback.test.ts lib/contact --silent`: 2 suites, 56 tests passing
- `npm run lint`: exit 0. `npm run type-check` / `npx tsc --noEmit`: exit 0
- Full `npx jest`: 84 suites, 1369 tests passing
- Acceptance: `export function retryAfterSeconds` 1. Contract test lines 8 (needed at least 3). Route test lines 40 (needed at least 27). `Feedback received` 0. Contract import 1. Line order 85 < 91 < 116. No `.only(` / `.skip(` / `.fixme(`.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- 12-13 can import `FEEDBACK_CODES`, `FeedbackResponse`, `FEEDBACK_LIMITS` and `HONEYPOT_FIELD` from `@/lib/contact/api-contract`.
- zod stays at 4.4.3. The route uses `z.string().email()`, which 12-06's bump should re-check.

## Self-Check: PASSED

- All 5 key files exist on disk.
- Commits cd7aa42, 7bcbf7c, 6f91352 and c3bc5e1 are ancestors of HEAD. `check evaluation-scope --plan 12-03 --commits-only` resolved all 4.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-02*
