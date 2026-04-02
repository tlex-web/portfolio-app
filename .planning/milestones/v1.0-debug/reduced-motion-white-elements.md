---
status: awaiting_human_verify
trigger: "Enabling 'Prefer reduced motion' causes navbar, footer, and other elements to appear white with no contrast"
created: 2026-02-17T00:00:00Z
updated: 2026-02-17T00:05:00Z
---

## Current Focus

hypothesis: TWO interacting root causes -- (1) useReducedMotion hydration race leaves elements at initial opacity:0 states, (2) the universal CSS block is overly broad and interferes with Tailwind's CSS transition-based visual state changes
test: Remove universal CSS block and verify elements render correctly with reduced motion
expecting: Elements should appear fully visible because Framer Motion WAAPI animations are NOT affected by CSS animation-duration
next_action: Return diagnosis with fix direction

## Symptoms

expected: With reduced motion enabled, site elements should appear fully visible with all colors/backgrounds intact, just without motion animations
actual: Navbar, footer, and other elements appear white with no contrast between them -- everything blends together
errors: No error messages -- purely visual rendering issue
reproduction: Enable "Prefer reduced motion" in OS accessibility settings, load the portfolio site
started: After Phase 05-02 added universal CSS reduced-motion block in globals.css

## Eliminated

- hypothesis: CSS animation-duration 0.01ms !important directly kills Framer Motion WAAPI animations
  evidence: Framer Motion v12.34.0 uses Web Animations API (element.animate()). WAAPI operates independently from CSS animation properties. CSS animation-duration only affects CSS @keyframes animations, not WAAPI. Verified in framer-motion source (startWaapiAnimation function, line 2398).
  timestamp: 2026-02-17T00:04:00Z

- hypothesis: Framer Motion internally respects prefers-reduced-motion and blocks animations
  evidence: Default MotionConfigContext has reducedMotion:"never" (line 9888 in framer-motion.dev.js). When reducedMotionConfig is "never", shouldReduceMotion is forced to false (line 5984). Framer Motion ignores OS reduced-motion preference by default.
  timestamp: 2026-02-17T00:04:30Z

- hypothesis: Background colors are not rendering due to CSS custom property issues
  evidence: Body background-color uses var(--color-alpine-900) which is defined as #07100a in the compiled CSS. This is a static property with no animation dependency. All Tailwind color utilities compile to standard CSS properties.
  timestamp: 2026-02-17T00:04:45Z

## Evidence

- timestamp: 2026-02-17T00:01:00Z
  checked: globals.css lines 369-377 -- the universal reduced-motion CSS block
  found: |
    The block applies to *, *::before, *::after with !important:
    - transition-duration: 0.01ms !important
    - animation-duration: 0.01ms !important
    - animation-iteration-count: 1 !important
  implication: This affects EVERY element on the page including those with Tailwind transition utilities

- timestamp: 2026-02-17T00:02:00Z
  checked: Header.tsx and Footer.tsx Framer Motion usage with reduced motion
  found: |
    Components use initial={prefersReducedMotion ? false : { opacity: 0, y: -100 }} pattern.
    When prefersReducedMotion is true, initial=false means "skip initial state, start at animate values."
    The animate prop still specifies targets like { opacity: 1, y: 0 }.
    The transition is { duration: 0 } when reduced motion is on.
  implication: The Framer Motion gating looks correct in isolation

- timestamp: 2026-02-17T00:03:00Z
  checked: useReducedMotion hook (lib/useReducedMotion.ts)
  found: |
    Hook starts with useState(false) -- initially returns false on first render.
    On mount (useEffect), reads matchMedia and updates to true.
    This creates a TWO-RENDER sequence:
    Render 1: prefersReducedMotion=false -> initial={opacity:0} applied
    Render 2: prefersReducedMotion=true -> initial=false (too late, already set)
  implication: Elements render with opacity:0 on first paint, then FM re-animates on second render

- timestamp: 2026-02-17T00:04:00Z
  checked: Framer Motion v12.34.0 internals (WAAPI usage)
  found: |
    FM uses element.animate() (WAAPI) for hardware-accelerated properties like opacity.
    When duration:0 in transition prop, FM skips WAAPI and uses frame.update() to set
    value directly via motionValue.set() -> element.style[name] = value.
    CSS animation-duration !important does NOT affect WAAPI animations.
  implication: WAAPI animations should work correctly regardless of CSS overrides

- timestamp: 2026-02-17T00:04:15Z
  checked: page.tsx (home page) -- motion elements WITHOUT useReducedMotion
  found: |
    ALL motion.div elements use initial={{ opacity: 0, y: 20 }} without reduced motion guard.
    Uses whileInView for scroll-triggered animations.
    Child elements often have transition-all Tailwind class alongside FM animations.
    Example: line 44 has both initial={{opacity:0,scale:0.8}} AND "transition-all duration-300"
  implication: Home page motion elements always start invisible regardless of reduced motion setting

- timestamp: 2026-02-17T00:04:30Z
  checked: Tailwind v4 compiled CSS for transition utilities
  found: |
    transition-all sets transition-property: all with var-based duration.
    The !important override makes transition-duration: 0.01ms for all elements.
    This kills ALL CSS transitions -- hover effects, state changes, color fades.
    transition-colors explicitly transitions color, background-color, border-color,
    outline-color, text-decoration-color, fill, stroke, and gradient vars.
  implication: All Tailwind-based CSS transitions are effectively disabled

- timestamp: 2026-02-17T00:04:45Z
  checked: Framer Motion animation skip path (duration:0)
  found: |
    When transition.duration is 0, FM sets shouldSkip=true (line 3233).
    With shouldSkip=true, FM calls frame.update() with the final value.
    frame.update() schedules the update for the next animation frame.
    This means the value is NOT applied synchronously -- it waits for the next frame.
  implication: Between first render (opacity:0) and frame.update callback (opacity:1), there is at least one frame where elements are invisible

## Resolution

root_cause: |
  Two interacting issues create the "white/no contrast" appearance:

  1. HYDRATION RACE in useReducedMotion hook (lib/useReducedMotion.ts):
     The hook initializes with useState(false). On the first render, ALL Framer Motion
     components receive prefersReducedMotion=false, so they render with their
     invisible initial states (opacity:0, y:-100, scale:0, etc.). After useEffect
     fires, prefersReducedMotion becomes true, triggering a re-render with
     initial=false and transition={duration:0}. But Framer Motion's duration:0
     path uses frame.update() which schedules the final value for the NEXT frame.
     This creates at minimum a one-frame flash of invisible content.

  2. OVERLY BROAD CSS GUARD (globals.css lines 370-376):
     The universal * selector with !important kills ALL CSS transitions including
     non-motion visual transitions (color changes, opacity state changes, hover
     effects). While this doesn't directly cause the "white" appearance, it
     removes visual feedback and makes the transition-based state changes instant
     in ways that compound with the Framer Motion timing issue. The transition-all
     class on many elements means ALL property changes are affected.

  The combination creates a scenario where:
  - Elements start invisible (FM initial states)
  - The re-render to fix this is delayed by at least one frame
  - CSS transitions that could provide visual fallbacks are killed
  - The user sees a flash of white (browser default bg) or transparent elements
  - Elements that use whileInView in page.tsx have NO reduced-motion guard at all,
    so they always start at opacity:0 regardless

fix: |
    1. Rewrote useReducedMotion hook to use useSyncExternalStore instead of
       useState+useEffect. This reads the media query synchronously on the
       client, eliminating the two-render hydration race where elements
       flashed at opacity:0 before the reduced-motion value was available.

    2. Removed the transition-property !important override from the universal
       CSS reduced-motion block in globals.css. The block now only overrides
       animation-duration and animation-iteration-count (killing CSS keyframe
       animations). Tailwind CSS transitions for hover effects, state changes,
       and visual feedback are no longer forcibly restricted.
  verification: |
    - All 5 useReducedMotion unit tests pass
    - Next.js production build succeeds with no errors
    - Awaiting manual verification: enable reduced motion in OS, load site,
      confirm navbar/footer/elements render with correct colors and contrast
  files_changed:
    - lib/useReducedMotion.ts
    - lib/__tests__/useReducedMotion.test.tsx
    - app/globals.css
