---
phase: 02-security-reliability-hardening
plan: 01
subsystem: security
tags: [csp, nonce, proxy, content-security-policy, next.js-16]

# Dependency graph
requires:
  - phase: 01-bug-fixes-stability
    provides: stable codebase with working layout and next.config.ts
provides:
  - nonce-based CSP via proxy.ts removing unsafe-inline from script-src and style-src
  - dynamic rendering for all pages (required for nonce injection)
  - proxy.ts infrastructure for future middleware-layer security
affects: [02-02, 02-03, service-worker-cache]

# Tech tracking
tech-stack:
  added: []
  patterns: [proxy.ts nonce-based CSP, strict-dynamic trust propagation, async root layout for headers access]

key-files:
  created: [proxy.ts]
  modified: [next.config.ts, app/layout.tsx]

key-decisions:
  - "Analytics/SpeedInsights do not accept nonce prop in v1.6.1/v1.3.1 -- rely on strict-dynamic trust propagation instead"
  - "Nonce read in layout.tsx forces dynamic rendering for all routes, which is required for CSP nonces to work"
  - "Removed Google Fonts preconnect links since fonts are self-hosted and preconnects would violate tight CSP"

patterns-established:
  - "proxy.ts for per-request header injection: generate nonce, set on request and response headers"
  - "Async root layout with headers() call for dynamic rendering and server-side header access"

requirements-completed: [SEC-01]

# Metrics
duration: 4min
completed: 2026-02-16
---

# Phase 2 Plan 1: Nonce-Based CSP Summary

**Nonce-based Content Security Policy via proxy.ts replacing static unsafe-inline CSP, with strict-dynamic trust propagation for Vercel Analytics**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-16T21:30:51Z
- **Completed:** 2026-02-16T21:35:22Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created proxy.ts with per-request nonce generation and strict CSP directives (no unsafe-inline in script-src or style-src)
- Removed static CSP from next.config.ts, moved security headers outside production-only condition
- Made root layout async to read nonce and force dynamic rendering for all pages
- Switched Analytics import from /react to /next subpath (designed for App Router server components)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create proxy.ts with nonce-based CSP** - `202dbd1` (feat)
2. **Task 2: Wire nonce into layout.tsx for Analytics components** - `074706c` (feat)

## Files Created/Modified
- `proxy.ts` - Per-request CSP nonce generation and header injection via Next.js 16 proxy convention
- `next.config.ts` - Removed CSP header block, moved remaining security headers outside production-only condition
- `app/layout.tsx` - Async root layout reading x-nonce header, Analytics switched to /next subpath, Google Fonts preconnects removed

## Decisions Made
- Analytics/SpeedInsights v1.6.1/v1.3.1 do not expose a nonce prop -- relied on strict-dynamic CSP trust propagation instead of passing nonce explicitly. The /next subpath components are server components integrated into the framework pipeline; scripts they load inherit trust from the nonce-whitelisted parent bundle.
- Kept nonce variable read in layout.tsx even though it is not passed to JSX -- the `await headers()` call is what forces dynamic rendering, which is required for Next.js to auto-inject nonces into framework scripts.
- Removed Google Fonts preconnect links because fonts are self-hosted per user decision, and external preconnects would trigger CSP violations under the tight connect-src 'self' policy.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed nonce prop from Analytics and SpeedInsights components**
- **Found during:** Task 2 (Wire nonce into layout.tsx)
- **Issue:** Plan specified passing `nonce={nonce}` to Analytics and SpeedInsights, but @vercel/analytics@1.6.1 and @vercel/speed-insights@1.3.1 do not accept a nonce prop in their /next subpath type definitions. TypeScript compilation failed with TS2322.
- **Fix:** Removed nonce prop from both components. The strict-dynamic CSP directive propagates trust from nonce-whitelisted framework scripts to dynamically loaded analytics scripts, so explicit nonce passing is unnecessary.
- **Files modified:** app/layout.tsx
- **Verification:** `npx tsc --noEmit` passes, `npm run build` succeeds
- **Committed in:** 074706c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix was necessary for type correctness. No functional impact -- strict-dynamic handles analytics script trust propagation without explicit nonce props.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CSP nonce infrastructure in proxy.ts is ready for production
- All pages are dynamically rendered (forced by headers() call in root layout)
- Remaining plans in phase 2 (CSRF, rate limiting, service worker) can proceed independently
- Test CSP in production preview deployment to verify Vercel Analytics data still appears in dashboard

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 02-security-reliability-hardening*
*Completed: 2026-02-16*
