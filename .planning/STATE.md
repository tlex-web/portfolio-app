# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** A portfolio that is visually memorable and distinctive while being stable and well-maintained under the hood.
**Current focus:** Phase 4 complete - Design Components (ready for Phase 5)

## Current Position

Phase: 4 of 5 (Design Components)
Plan: 6 of 6 in current phase (complete)
Status: Phase Complete
Last activity: 2026-02-17 — Phase 4 complete (all 6 plans, visual verification approved)

Progress: [#########.] 90%

## Performance Metrics

**Velocity:**
- Total plans completed: 17
- Average duration: 3.1min
- Total execution time: 0.89 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3 | 16min | 5.3min |
| 02 | 3+3gc | 15min | 2.5min |
| 03 | 2 | 5min | 2.5min |
| 04 | 6 | 25min | 4.2min |

**Recent Trend:**
- Last 5 plans: 04-02 (7min), 04-03 (7min), 04-04 (3min), 04-05 (4min), 04-06 (2min)
- Trend: variable (design component complexity varies)

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
- [03-01]: OKLCH color space for perceptual uniformity across the custom palette
- [03-01]: Dark-only site -- removed :root/dark media query blocks, no dark: variants needed
- [03-01]: Deleted tailwind.config.ts -- Tailwind v4 uses CSS-first @theme, v3 config was empty
- [03-01]: @theme inline for font tokens (runtime CSS vars from next/font) vs @theme for literal color values
- [03-01]: Font variables on html not body -- required for Tailwind @theme resolution at :root level
- [03-02]: granite-400 OKLCH lightness increased from 0.55 to 0.60 to meet 4.5:1 caption contrast threshold
- [03-02]: colorjs.io used alongside wcag-contrast for accurate OKLCH-to-sRGB conversion
- [04-01]: Glow intensity range [1.0, 0.15] over [0, 800px] scroll -- full glow near hero, muted in content
- [04-01]: Static 0.3 glow intensity for reduced-motion users -- visible but not animated
- [04-01]: Stratum shadows use alpine-950 OKLCH for geological consistency with dark theme
- [04-03]: Two-layer card structure separates glow/tilt (outer) from content (inner hex-clip) to avoid clipping glow effects
- [04-03]: Projects page converted to client component for useHexGrid hook integration
- [Phase 04]: Spread operator [...EASING.geological] to satisfy Framer Motion Easing type (readonly tuple to mutable) — readonly [number, number, number, number] from animations.ts is incompatible with Framer Motion's mutable Easing type
- [04-04]: Module-level effectIdCounter for unique AnimatePresence keys across rapid clicks
- [04-04]: GeologicalButton replaces ParticleButton for production CTAs; ParticleButton retained (@deprecated) for demo pages
- [04-05]: Removed bg-clip-text gradient patterns on headings in favor of direct text-frost-400 (simpler, consistent with token system)
- [04-05]: Footer stratum-3 (deepest layer) to visually ground page bottom as geological bedrock
- [04-05]: Header active nav uses glow-frost class for frost highlight consistent with GlassmorphismNav
- [04-06]: ProjectCard hex clip-path moved to background layer so card content is not clipped

### Pending Todos

- Clean up old image variants (-thumb/-medium/-large) after component references are updated

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-17
Stopped at: Completed 04-06-PLAN.md (Phase 4 complete)
Resume file: .planning/phases/04-design-components/04-06-SUMMARY.md
