---
phase: 06-integration-wiring-fixes
plan: 01
subsystem: infra
tags: [middleware, csp, upstash, ratelimit, service-worker, postbuild]

# Dependency graph
requires:
  - phase: 02-security-hardening
    provides: CSP middleware, rate limiting, service worker caching
provides:
  - Working CSP middleware via Next.js file convention (middleware.ts)
  - Installed @upstash/ratelimit and @upstash/redis runtime dependencies
  - Build-hash injection pipeline wired into postbuild lifecycle
affects: [deployment, security, caching]

# Tech tracking
tech-stack:
  added: ["@upstash/ratelimit@2.0.8", "@upstash/redis@1.36.4"]
  patterns: [postbuild-script-chaining]

key-files:
  created: []
  modified:
    - middleware.ts
    - package.json
    - package-lock.json
    - public/service-worker.js
    - app/layout.tsx
    - next.config.ts

key-decisions:
  - "No new decisions -- followed plan as specified, all changes are wiring fixes for existing Phase 2 code"

patterns-established:
  - "Postbuild chaining: inject-build-hash.mjs runs before verify-contrast.mjs in npm postbuild"

requirements-completed: [SEC-01, REL-01, REL-02]

# Metrics
duration: 2min
completed: 2026-03-12
---

# Phase 6 Plan 1: Integration Wiring Fixes Summary

**Fixed three cross-phase wiring breaks: CSP middleware filename convention, missing Upstash runtime packages, and build-hash injection pipeline**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T23:34:15Z
- **Completed:** 2026-03-11T23:35:46Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Renamed proxy.ts to middleware.ts so Next.js executes CSP middleware automatically via file convention
- Installed @upstash/ratelimit and @upstash/redis as production dependencies for rate limiting
- Wired inject-build-hash.mjs into postbuild script and restored __BUILD_HASH__ placeholder in service-worker.js
- Removed stale raw.githack.com from CSP connect-src (corrected in Phase 2 decision 02-06)
- Updated proxy.ts comment references in layout.tsx and next.config.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename proxy.ts to middleware.ts and update references** - `d727118` (fix)
2. **Task 2: Install Upstash packages, wire postbuild script, restore SW placeholder** - `7d4a82f` (fix)

## Files Created/Modified
- `middleware.ts` - CSP middleware (renamed from proxy.ts, function renamed to middleware)
- `package.json` - Added Upstash deps, updated postbuild script chain
- `package-lock.json` - Lock file updated with Upstash packages
- `public/service-worker.js` - Restored __BUILD_HASH__ placeholder for build injection
- `app/layout.tsx` - Updated comment reference from proxy.ts to middleware.ts
- `next.config.ts` - Updated comment reference from proxy.ts to middleware.ts

## Decisions Made
None - followed plan as specified. All changes are wiring fixes for existing Phase 2 code.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three wiring breaks from v1.0 milestone audit are resolved
- CSP middleware will execute on every matching request via Next.js file convention
- Rate limiting packages available for runtime import (requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars for production)
- Build-hash injection will run automatically on each `npm run build`

---
*Phase: 06-integration-wiring-fixes*
*Completed: 2026-03-12*
