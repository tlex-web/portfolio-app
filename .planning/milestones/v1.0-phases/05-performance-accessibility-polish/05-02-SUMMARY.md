---
phase: 05-performance-accessibility-polish
plan: 02
subsystem: ui
tags: [accessibility, reduced-motion, framer-motion, css, prefers-reduced-motion]

# Dependency graph
requires:
  - phase: 04-design-components
    provides: "Header/Footer components with Framer Motion animations and CSS glow/contour effects"
  - phase: 05-performance-accessibility-polish
    provides: "useReducedMotion hook (used in 05-01 PhotoCarousel3D)"
provides:
  - "Fully reduced-motion-gated Header with conditional entrance, hover, stagger, and layoutId animations"
  - "Fully reduced-motion-gated Footer with conditional entrance, stagger, hover, tap, and infinite heart pulse"
  - "Universal CSS reduced-motion block gating all transitions and animations site-wide"
affects: [05-performance-accessibility-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: ["prefersReducedMotion ternary gating for all Framer Motion animation props", "Universal CSS * selector with 0.01ms duration for transitionend compatibility"]

key-files:
  created: []
  modified:
    - components/Header.tsx
    - components/Footer.tsx
    - app/globals.css

key-decisions:
  - "Use 0.01ms instead of 0s for CSS transition/animation duration to preserve transitionend event compatibility"
  - "Keep layoutId prop on active tab indicator (Framer Motion handles instant transition with duration: 0)"
  - "Use empty object {} for heart animate prop when reduced motion (not undefined) to prevent Framer Motion fallback"

patterns-established:
  - "prefersReducedMotion ternary: initial={prefersReducedMotion ? false : {...}} for entrance animations"
  - "prefersReducedMotion ternary: whileHover/whileTap={prefersReducedMotion ? undefined : {...}} for interaction animations"
  - "prefersReducedMotion ternary: transition={prefersReducedMotion ? { duration: 0 } : {...}} for transition config"
  - "Universal CSS fallback as last rule in @media (prefers-reduced-motion: reduce) block"

requirements-completed: [PERF-02]

# Metrics
duration: 4min
completed: 2026-02-17
---

# Phase 5 Plan 2: Reduced Motion Gating for Header, Footer, and Global CSS Summary

**Conditional animation gating in Header/Footer via useReducedMotion hook plus universal CSS fallback with 0.01ms transition override for all site animations**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T12:14:25Z
- **Completed:** 2026-02-17T12:18:25Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Header entrance slide, nav stagger, hover scale, tap scale, and layoutId tab animation all disabled when reduced motion is enabled
- Footer entrance fade/slide, social icon stagger/scale, hover effects, and infinite heart pulse all disabled when reduced motion is enabled
- CSS animate-pulse, animate-spin, and animate-bounce utilities produce no motion when reduced motion is enabled
- All CSS transitions complete near-instantly (0.01ms) when reduced motion is enabled, preserving transitionend event compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Gate Header and Footer animations behind useReducedMotion** - `6137408` (feat)
2. **Task 2: Expand globals.css reduced-motion block with universal animation gating** - `d143b02` (fix)

## Files Created/Modified
- `components/Header.tsx` - Added useReducedMotion import and gated all 8 animation points (entrance, logo hover, nav stagger, layoutId, mobile button tap, mobile menu expand, mobile nav stagger)
- `components/Footer.tsx` - Added useReducedMotion import and gated all 9 animation points (brand entrance, social stagger/hover/tap, link sections, copyright text, links, made-with div, heart pulse)
- `app/globals.css` - Expanded @media (prefers-reduced-motion: reduce) block with Tailwind utility gates and universal * selector fallback

## Decisions Made
- Used 0.01ms instead of 0s for universal CSS transition/animation duration to avoid breaking JavaScript transitionend event listeners
- Kept layoutId="activeTab" prop on Header active indicator -- Framer Motion still works correctly with duration: 0 (instant position)
- Used empty object `{}` for heart pulse animate prop when reduced motion is active (not `undefined`) to ensure Framer Motion doesn't fall back to default behavior

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Build cache from a previous `.next` directory caused a stale type error (PhotoCarousel3D.tsx) during verification. Clearing `.next` resolved it. The CSS changes compiled correctly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Header and Footer are fully reduced-motion compliant
- Universal CSS fallback catches any CSS animations not covered by component-level gating
- Ready for 05-03 (remaining component reduced-motion gating) or phase verification

## Self-Check: PASSED

All created/modified files verified present. All commit hashes verified in git log.

---
*Phase: 05-performance-accessibility-polish*
*Completed: 2026-02-17*
