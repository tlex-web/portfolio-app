---
phase: 02-security-reliability-hardening
plan: 03
subsystem: infra
tags: [service-worker, caching, offline, build-pipeline]

# Dependency graph
requires:
  - phase: 01-bug-fixes-and-cleanup
    provides: optimized images and build scripts foundation
provides:
  - Build-hash-based service worker cache invalidation
  - Per-asset-type caching strategies (cache-first, stale-while-revalidate, network-only)
  - Automatic postbuild hash injection pipeline
  - Silent background service worker updates
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Template placeholder pattern: __BUILD_HASH__ in service-worker.js replaced by postbuild script"
    - "npm lifecycle hooks: prebuild (optimize-images) -> build (next build) -> postbuild (inject-build-hash)"
    - "Per-asset caching strategy: cacheFirst for fingerprinted assets, staleWhileRevalidate for HTML, networkFirst for dynamic, network-only for API"

key-files:
  created:
    - scripts/inject-build-hash.mjs
  modified:
    - public/service-worker.js
    - package.json
    - components/ServiceWorkerRegistration.tsx

key-decisions:
  - "Cache invalidation by BUILD_HASH suffix matching -- simpler and more reliable than prefix-based filtering"
  - "Template-in-place pattern -- inject script modifies public/service-worker.js directly since Vercel deploys from public/"

patterns-established:
  - "Postbuild pipeline: npm postbuild hook runs inject-build-hash.mjs after next build"
  - "Service worker template pattern: __BUILD_HASH__ placeholder replaced at build time"

requirements-completed: [REL-02]

# Metrics
duration: 4min
completed: 2026-02-16
---

# Phase 2 Plan 3: Service Worker Cache Invalidation Summary

**Build-hash-based service worker with per-asset caching strategies and automatic postbuild hash injection**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-16T21:38:08Z
- **Completed:** 2026-02-16T21:42:18Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Replaced hardcoded v1 cache version with __BUILD_HASH__ placeholder that is automatically injected from .next/BUILD_ID during postbuild
- Implemented per-asset caching strategies: cache-first for fingerprinted static assets (JS, CSS, fonts, images), stale-while-revalidate for HTML pages, network-only for API routes, network-first for everything else
- Old caches are deleted during service worker activation by BUILD_HASH suffix matching
- Service worker updates silently in the background with no user prompt -- controllerchange and updatefound listeners handle lifecycle
- Full build pipeline: prebuild (optimize-images) -> build (next build) -> postbuild (inject-build-hash)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite service worker with build hash placeholder and proper caching strategies** - `dc754c4` (feat)
2. **Task 2: Add postbuild script and update ServiceWorkerRegistration lifecycle** - `b0e9fa5` (feat)

**Plan metadata:** `2d618e1` (docs: complete plan)

## Files Created/Modified
- `public/service-worker.js` - Service worker template with __BUILD_HASH__ placeholder and per-asset caching strategy helpers (cacheFirst, staleWhileRevalidate, networkFirst)
- `scripts/inject-build-hash.mjs` - Postbuild script that reads .next/BUILD_ID and replaces __BUILD_HASH__ in service-worker.js
- `package.json` - Added postbuild npm script for automatic hash injection
- `components/ServiceWorkerRegistration.tsx` - Silent update lifecycle with controllerchange and updatefound listeners, removed console output

## Decisions Made
- Cache invalidation uses BUILD_HASH suffix matching (filter caches that do NOT end with current hash) rather than prefix-based filtering -- simpler logic, deletes all old caches regardless of naming pattern
- Template-in-place pattern: inject script writes directly to public/service-worker.js because Vercel deploys from public/. The git-tracked file always has the __BUILD_HASH__ placeholder; only the deployed build has the real hash.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 2 is complete -- all three plans (CSP nonces, CSRF/rate limiting, service worker cache invalidation) are done
- Security and reliability hardening provides a solid foundation for visual identity work in Phase 3

## Self-Check: PASSED

- All 4 files verified present on disk
- Commits dc754c4 and b0e9fa5 verified in git log

---
*Phase: 02-security-reliability-hardening*
*Completed: 2026-02-16*
