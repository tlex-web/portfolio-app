# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** A portfolio that is visually memorable and distinctive while being stable and well-maintained under the hood.
**Current focus:** Phase 3 - Design Foundation

## Current Position

Phase: 3 of 5 (Design Foundation)
Plan: 0 of ? in current phase
Status: Planning needed
Last activity: 2026-02-17 — Phase 2 gap closure plan 06 complete (CSP style-src/connect-src fixes)

Progress: [####......] 40%

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 3.4min
- Total execution time: 0.51 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3 | 16min | 5.3min |
| 02 | 3+3gc | 15min | 2.5min |

**Recent Trend:**
- Last 5 plans: 02-01 (4min), 02-03 (4min), 02-04 (1min), 02-05 (1min), 02-06 (1min)
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
- [02-04]: style-src 'unsafe-inline' required because CSP nonces cannot apply to style attributes, only style elements
- [02-04]: connect-src allowlists specific drei HDRI CDN domain, not a wildcard
- [02-06]: Remove nonce from style-src per CSP Level 2 spec (nonce causes unsafe-inline to be ignored)
- [02-06]: connect-src uses raw.githubusercontent.com for drei CDN assets (corrects raw.githack.com from 02-04)
- [02-05]: Keep production-only guard for SW registration per user decision (standard practice)
- [02-05]: Remove load event wrapper -- root cause of SW not registering in hydrated Next.js apps

### Pending Todos

- Clean up old image variants (-thumb/-medium/-large) after component references are updated

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-17
Stopped at: Phase 3 context gathered
Resume file: .planning/phases/03-design-foundation/03-CONTEXT.md
