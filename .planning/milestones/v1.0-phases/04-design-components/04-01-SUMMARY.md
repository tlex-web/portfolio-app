---
phase: 04-design-components
plan: 01
subsystem: ui
tags: [css, framer-motion, animations, glow, hex-grid, reduced-motion]

# Dependency graph
requires:
  - phase: 03-design-foundation
    provides: "OKLCH design tokens (alpine, frost, ember, granite, snow) in globals.css @theme"
provides:
  - "EASING constants (geological, crystallize, tectonic, erosion) for Framer Motion transitions"
  - "DURATION constants (hover, enter, settle, fracture) for animation timing"
  - "TILT_CONFIG (maxRotation, perspective) for crystalline card interactions"
  - "useGlowIntensity hook writing --glow-intensity CSS variable from scroll position"
  - "Glow CSS utilities (ambient-glow, glow-frost, glow-ember) responsive to --glow-intensity"
  - "Hex grid layout CSS (hex-clip, hex-grid, hex-offset) with mobile fallback"
  - "Stratified depth shadows (stratum-1/2/3) for geological layering"
  - "Contour animation keyframes (contour-drift, contour-animate)"
  - "prefers-reduced-motion guards for all new animations"
affects: [04-02, 04-03, 04-04, 04-05, 04-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scroll-linked CSS variable via framer-motion useScroll + useTransform + useMotionValueEvent"
    - "Geological easing curves as typed readonly tuples for Framer Motion"
    - "CSS calc() with custom property multiplier for scroll-responsive effects"

key-files:
  created:
    - lib/animations.ts
    - lib/useGlowIntensity.ts
  modified:
    - app/globals.css

key-decisions:
  - "Glow intensity range [1.0, 0.15] over [0, 800px] scroll -- full glow near hero, muted in content"
  - "Static 0.3 glow intensity for reduced-motion users -- visible but not animated"
  - "Stratum shadows use alpine-950 OKLCH values for geological consistency with dark theme"

patterns-established:
  - "Import EASING/DURATION from lib/animations.ts for all Phase 4 Framer Motion transitions"
  - "Use --glow-intensity CSS variable (set by useGlowIntensity) in calc() for scroll-responsive glow"
  - "Apply stratum-1/2/3 classes for geological depth layering"

requirements-completed: [COMP-03, COMP-04]

# Metrics
duration: 2min
completed: 2026-02-17
---

# Phase 4 Plan 01: Design Infrastructure Summary

**Geological easing constants, scroll-linked glow hook, and crystalline CSS utilities (hex grid, stratified depth, ambient glow) as shared foundation for all Phase 4 components**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-17T10:55:51Z
- **Completed:** 2026-02-17T10:58:11Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created reusable animation constants (4 geological easing curves, 4 duration values, tilt config) typed for Framer Motion
- Built scroll-linked glow hook that writes --glow-intensity CSS variable, creating a gradient of 3D influence from hero into 2D content
- Added comprehensive crystalline CSS utilities: ambient glow, frost/ember glow variants, hex clip-path, hex grid layout, stratified geological depth shadows, contour animation
- All new animations gated by prefers-reduced-motion media query

## Task Commits

Each task was committed atomically:

1. **Task 1: Create geological easing constants and scroll-linked glow hook** - `dc314b4` (feat)
2. **Task 2: Add glow utilities, hex grid CSS, and stratified depth shadows** - `f4fba58` (feat)

## Files Created/Modified
- `lib/animations.ts` - EASING, DURATION, TILT_CONFIG constants for Framer Motion transitions
- `lib/useGlowIntensity.ts` - Scroll-linked hook writing --glow-intensity CSS variable with reduced-motion support
- `app/globals.css` - Crystalline CSS utilities: glow, hex grid, stratified depth, contour animation, reduced-motion guards

## Decisions Made
- Glow intensity maps scroll [0, 800px] to [1.0, 0.15] -- elements near the 3D hero glow brightly, intensity fades into pure 2D content
- Reduced-motion users get static --glow-intensity of 0.3 (visible but not animated)
- Stratum shadow colors use alpine-950 OKLCH (oklch(0.13 0.015 155)) for geological consistency with the dark theme palette

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 4 plans (02-06) can now import EASING/DURATION/TILT_CONFIG from lib/animations.ts
- useGlowIntensity hook ready for integration in layout or page components
- CSS utilities (glow-frost, hex-clip, hex-grid, stratum-*, contour-animate) available for component styling
- No blockers for subsequent plans

## Self-Check: PASSED

All files verified present. All commit hashes found in git log.

---
*Phase: 04-design-components*
*Completed: 2026-02-17*
