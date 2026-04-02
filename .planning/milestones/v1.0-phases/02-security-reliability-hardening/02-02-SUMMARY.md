---
phase: 02-security-reliability-hardening
plan: 02
subsystem: api
tags: [csrf, rate-limiting, upstash, redis, security, feedback]

# Dependency graph
requires:
  - phase: 01-bugs-testing-foundation
    provides: feedback API route and test infrastructure
provides:
  - CSRF Origin header validation utility (lib/csrf.ts)
  - Upstash Redis-backed persistent rate limiter (lib/rate-limit.ts)
  - Hardened feedback POST endpoint with CSRF + rate limiting
affects: [02-security-reliability-hardening]

# Tech tracking
tech-stack:
  added: ["@upstash/ratelimit", "@upstash/redis"]
  patterns: ["Origin header CSRF validation", "Upstash sliding window rate limiting with dev fallback"]

key-files:
  created: ["lib/csrf.ts", "lib/rate-limit.ts"]
  modified: ["app/api/feedback/route.ts", "app/api/__tests__/feedback.test.ts", ".env.example", "package.json"]

key-decisions:
  - "Origin header validation for CSRF (same mechanism as Next.js Server Actions)"
  - "Lazy initialization pattern for rate limiter with graceful dev fallback"
  - "IP extraction uses first entry from x-forwarded-for chain for accurate client identification"

patterns-established:
  - "CSRF: Origin header comparison against Host header, absent Origin treated as same-origin"
  - "Rate limiting: Upstash Redis singleton with dev fallback mock that warns once"
  - "Security logging: structured warn logs with event type, IP, origin, and timestamp"

requirements-completed: [SEC-02, REL-01]

# Metrics
duration: 4min
completed: 2026-02-16
---

# Phase 2 Plan 2: CSRF + Persistent Rate Limiting Summary

**Origin header CSRF validation and Upstash Redis-backed sliding window rate limiter (5/hr) on feedback endpoint, replacing in-memory rate limiter**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-16T21:30:43Z
- **Completed:** 2026-02-16T21:35:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- CSRF protection via Origin header validation prevents cross-origin form submissions
- Persistent rate limiting via Upstash Redis survives serverless cold starts and redeployments
- Graceful development fallback when Upstash env vars are missing (no crashes, warning logged once)
- All 25 feedback tests pass with mocked CSRF and rate limit utilities
- Security rejections logged server-side with structured event data

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Upstash packages and create CSRF + rate limit utilities** - `6898163` (feat)
2. **Task 2: Integrate CSRF + rate limiting into feedback route and update tests** - `a5db73e` (feat)

## Files Created/Modified
- `lib/csrf.ts` - Origin header CSRF validation (exports validateOrigin)
- `lib/rate-limit.ts` - Upstash Redis-backed rate limiter with dev fallback (exports feedbackRateLimit)
- `app/api/feedback/route.ts` - Feedback POST handler with CSRF check and persistent rate limiting
- `app/api/__tests__/feedback.test.ts` - Updated tests with mocked CSRF/rate-limit, new CSRF and rate limit test cases
- `.env.example` - Documents UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
- `package.json` - Added @upstash/ratelimit and @upstash/redis dependencies

## Decisions Made
- Used Origin header validation for CSRF (same mechanism Next.js Server Actions use internally) -- simple, effective, no token management overhead
- Lazy initialization pattern for rate limiter: checks env vars at module load, creates Upstash instance or mock accordingly
- Extract first IP from comma-separated x-forwarded-for chain (standard proxy header convention) for accurate client identification behind load balancers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing uncommitted changes in `app/layout.tsx` cause TypeScript compilation errors (nonce property not recognized). These are unrelated to this plan's scope and were not touched. Logged as out-of-scope discovery.

## User Setup Required

**External services require manual configuration.** Upstash Redis is needed for persistent rate limiting in production:
- Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables
- Create a free Redis database at https://console.upstash.com or provision via Vercel Marketplace Upstash integration
- Without these env vars, rate limiting falls back to a permissive mock (development only)

## Next Phase Readiness
- CSRF and rate limiting are active on the feedback endpoint
- CSP (plan 01) and service worker (plan 03) can be implemented independently
- Upstash env vars must be configured in Vercel project settings before production deployment

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 02-security-reliability-hardening*
*Completed: 2026-02-16*
