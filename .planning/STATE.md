# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** A portfolio that is visually memorable and distinctive while being stable and well-maintained under the hood.
**Current focus:** Phase 2 - Security & Reliability Hardening

## Current Position

Phase: 2 of 5 (Security & Reliability Hardening)
Plan: 3 of 3 in current phase
Status: Phase Complete
Last activity: 2026-02-16 — Completed 02-03 (service worker cache invalidation)

Progress: [######....] 60%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 4.7min
- Total execution time: 0.47 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3 | 16min | 5.3min |
| 02 | 3 | 12min | 4.0min |

**Recent Trend:**
- Last 5 plans: 01-02 (5min), 01-03 (1min), 02-02 (4min), 02-01 (4min), 02-03 (4min)
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Bugs and stability first (Phases 1-2), then visual identity (Phases 3-5)
- [Roadmap]: Design tokens before components -- Phase 3 must complete before Phase 4
- [01-02]: AVIF quality 50 comparable to JPEG 82 due to superior compression
- [01-02]: New suffix naming (-sm/-md/-lg) avoids collision with old variants
- [01-02]: Old variant files left in place; cleanup deferred to future phase
- [Phase 01]: HighlightValue defined in data/types.ts to avoid circular deps between data and component layers
- [Phase 01]: Conditional rendering pattern over dynamic Component variable to maintain type safety
- [01-03]: Destructure all known Next.js Image-specific props in mock rather than just the reported one
- [02-02]: Origin header CSRF validation (same mechanism as Next.js Server Actions)
- [02-02]: Lazy initialization for rate limiter with graceful dev fallback (no crashes without Upstash)
- [02-02]: First IP from x-forwarded-for chain for accurate client identification
- [02-01]: Analytics/SpeedInsights rely on strict-dynamic trust propagation (no nonce prop in v1.6.1/v1.3.1)
- [02-01]: Nonce read in root layout forces dynamic rendering for all routes (required for CSP nonces)
- [02-03]: Cache invalidation by BUILD_HASH suffix matching -- simpler and more reliable than prefix-based filtering
- [02-03]: Template-in-place pattern -- inject script modifies public/service-worker.js directly since Vercel deploys from public/

### Pending Todos

- Clean up old image variants (-thumb/-medium/-large) after component references are updated

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-16
Stopped at: Completed 02-03-PLAN.md (Phase 2 complete)
Resume file: .planning/phases/02-security-reliability-hardening/02-03-SUMMARY.md
