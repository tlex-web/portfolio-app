# Phase 4: Design Components - Research

**Researched:** 2026-02-17
**Domain:** CSS visual identity, crystalline UI components, scroll-linked glow effects, geological micro-interactions
**Confidence:** MEDIUM-HIGH

## Summary

Phase 4 transforms the existing portfolio components into a cohesive crystalline/geological visual identity. The codebase already has Phase 3 design tokens (OKLCH colors in `@theme`, JetBrains Mono + Inter fonts, text-shadow glow tokens) but zero components actually consume them -- all 16 components with color classes still use default Tailwind gray/cyan/dark: variants. This phase simultaneously migrates components to the design token system AND reshapes them into the distinctive crystalline aesthetic.

The technical approach uses Framer Motion 12.34.0 (already installed) for scroll-linked animations and micro-interactions, CSS `clip-path: polygon()` for hexagonal card shapes, CSS custom properties for scroll-responsive glow intensity, and inline SVG for the navigation topographic contour pattern. No new dependencies are required -- the existing stack (Framer Motion, Tailwind v4, React 19) provides everything needed.

The highest-risk area is the hexagonal grid layout on responsive screens. CSS hexagonal grids require careful math for row offset staggering and do not degrade as gracefully as rectangular grids. The recommended approach uses flexbox with negative margins and `clip-path` rather than CSS Grid, falling back to a single-column crystalline layout on mobile.

**Primary recommendation:** Build from the design tokens outward -- first migrate colors/fonts in each component, then add the crystalline shapes, then layer on animations and glow. This order ensures each component is always in a working state.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Navigation pattern**: Keep top bar position, organic glass morphing with flowing topographic contour lines or aurora effects, progressive reveal on scroll (transparent over 3D hero, intensifying as user scrolls), mobile full-screen overlay with large touch targets, frost glow on active/hover states
- **Card & tile style**: Hexagonal/crystalline shape language with faceted edges, keep current information density (title, description, status badge, tech pills, feature count, version), combined tilt/parallax + facet reveal hover interaction, hex-tiled mosaic layout, responsive single-column on mobile with crystalline shapes preserved
- **Micro-interactions**: Geological/mineral nature theme (crystal formation, stone erosion, tectonic shifts), weighty easing curves (300-500ms, custom cubic-bezier), subtle and refined prominence, replace ParticleButton sparkle/explosion with geological effects (crystal fracture, mineral dust, tectonic ripple), respect prefers-reduced-motion
- **Glow & accent system**: Primary frost (cyan/teal) glow, ember sparingly, always-on ambient glow on key elements intensifying on hover, glow intensity responds to proximity to 3D scene via scroll position, stratified geological depth shadows

### Claude's Discretion
- Exact contour line / aurora pattern for nav background
- Hex tile sizing and responsive breakpoint behavior
- Specific cubic-bezier values for geological easing
- Crystal fracture animation implementation details
- How ambient glow intensity maps to scroll position
- Stratified shadow values and layer offsets
- How existing ParticleButton effects get reworked vs replaced

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.34.0 | Scroll-linked animations, tilt/parallax hover, geological easing, AnimatePresence | Already used throughout codebase; useScroll + useTransform for scroll-glow bridge; GPU-accelerated opacity/transform |
| tailwindcss | 4.1.18 | Utility classes consuming @theme design tokens, responsive breakpoints | CSS-first v4 with @theme already configured; OKLCH tokens already defined |
| react | 19.2.4 | Component framework | Already installed |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| three.js | 0.182.0 | 3D mountain terrain with cyan wireframes (existing) | Reference only -- the 3D scene provides the frost color context for the 2D glow bridge |
| @react-three/fiber | 9.5.0 | React Three.js renderer (existing) | Hero3DMountain already renders the 3D scene; no changes needed to 3D components |

### No New Dependencies Needed
| Problem | Solution Without New Dep |
|---------|------------------------|
| Hexagonal shapes | CSS `clip-path: polygon()` -- pure CSS, no library |
| Topographic contour pattern | Inline SVG with CSS animation -- no generator library |
| Tilt/parallax hover | Framer Motion `onMouseMove` + `useMotionValue` + `useTransform` -- already installed |
| Scroll-responsive glow | Framer Motion `useScroll` + `useTransform` writing CSS custom property -- already installed |
| Geological easing | Framer Motion `transition.ease` accepts `[number, number, number, number]` cubic-bezier -- already installed |

## Architecture Patterns

### Component Modification Strategy

The phase modifies EXISTING components rather than creating new ones. Key files:

```
components/
  Header.tsx            -- NOT MODIFIED (used on projects page, will be replaced by GlassmorphismNav usage)
  GlassmorphismNav.tsx  -- MAJOR REWORK: organic glass morphing, contour lines, scroll-linked opacity, frost glow
  ProjectCard.tsx       -- MAJOR REWORK: crystalline clip-path, tilt/parallax hover, hex shape, token migration
  ParticleButton.tsx    -- MAJOR REWORK: replace sparkle/explosion with geological effects
  Hero3DMountain.tsx    -- MINOR: add scroll position provider for glow bridge
  Footer.tsx            -- MODERATE: token migration, stratified depth styling
app/
  globals.css           -- ADD: hex grid utilities, glow utilities, geological easing custom properties
  page.tsx              -- MODERATE: token migration, hex grid layout for stats, scroll context
  projects/page.tsx     -- MODERATE: hex mosaic grid layout, token migration
```

### Pattern 1: Scroll-Linked Glow Bridge

**What:** CSS custom property driven by Framer Motion `useScroll` that controls glow intensity across the page. Elements near the 3D hero glow brighter; effect fades as user scrolls into pure 2D content.

**When to use:** Any element that should participate in the 2D-3D glow bridge.

**Implementation approach:**
```typescript
// In a layout-level component or context provider
const { scrollY } = useScroll();
const glowIntensity = useTransform(scrollY, [0, 800], [1.0, 0.15]);

// Write to CSS custom property on the container
useMotionValueEvent(glowIntensity, 'change', (latest) => {
  document.documentElement.style.setProperty('--glow-intensity', String(latest));
});
```

```css
/* In globals.css -- glow utility consuming the scroll-driven variable */
.glow-frost {
  box-shadow:
    0 0 calc(8px * var(--glow-intensity, 0.5)) var(--color-frost-glow),
    0 0 calc(20px * var(--glow-intensity, 0.5)) var(--color-frost-glow);
  transition: box-shadow 0.3s ease;
}

.glow-frost:hover {
  box-shadow:
    0 0 calc(12px * var(--glow-intensity, 0.5)) var(--color-frost-glow),
    0 0 calc(30px * var(--glow-intensity, 0.5)) var(--color-frost-glow);
}
```

**Confidence:** HIGH -- `useScroll`, `useTransform`, and `useMotionValueEvent` are documented APIs in Framer Motion 11+. The project already uses `useScroll` in Hero3DMountain.tsx, Hero3DSection.tsx, and MountainTerrain3D.tsx.

### Pattern 2: Hexagonal Card with Clip-Path

**What:** CSS `clip-path: polygon()` creates the hexagonal shape. The card preserves all existing content but wraps it in a crystalline shell.

**When to use:** ProjectCard and stat cards on the homepage.

**Implementation approach:**
```css
/* Flat-top hexagon */
.hex-card {
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  /* OR pointy-top hexagon: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%) */
}
```

**Important limitation:** `clip-path` clips ALL content including borders, shadows, and overflow. Glow effects (box-shadow) will NOT be visible on a clipped element. The solution is a two-layer approach:

```tsx
{/* Outer container: handles glow, shadows, hover scale */}
<div className="glow-frost hex-glow-shape">
  {/* Inner content: clipped to hex shape */}
  <div className="hex-card bg-alpine-800 p-6">
    {/* Card content here */}
  </div>
</div>
```

Where `hex-glow-shape` uses `clip-path` on its `::after` pseudo-element for the glow, or uses a matching SVG `filter` for the glow outline.

**Confidence:** HIGH for clip-path shapes. MEDIUM for glow-on-clipped-shape (requires the two-layer technique or drop-shadow filter workaround).

### Pattern 3: Tilt/Parallax Hover Effect

**What:** Card tilts toward cursor position on hover, creating 3D perspective. Frost glow catches on crystalline edges during tilt.

**When to use:** ProjectCard hover interaction.

**Implementation approach:**
```typescript
const cardRef = useRef<HTMLDivElement>(null);
const rotateX = useMotionValue(0);
const rotateY = useMotionValue(0);

function handleMouseMove(e: React.MouseEvent) {
  if (!cardRef.current) return;
  const rect = cardRef.current.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  // Max rotation ~12 degrees, divided for subtlety
  rotateX.set((e.clientY - centerY) / rect.height * -12);
  rotateY.set((e.clientX - centerX) / rect.width * 12);
}

function handleMouseLeave() {
  // Geological easing: slow settle back to rest
  animate(rotateX, 0, { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] });
  animate(rotateY, 0, { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] });
}

// In JSX:
<motion.div
  ref={cardRef}
  style={{
    rotateX, rotateY,
    transformPerspective: 600,
    transformStyle: 'preserve-3d',
  }}
  onMouseMove={handleMouseMove}
  onMouseLeave={handleMouseLeave}
>
```

**Confidence:** HIGH -- This exact pattern is documented and widely used with Framer Motion. The codebase already uses `useMotionValue` patterns in existing components.

### Pattern 4: Geological Easing Curves

**What:** Custom cubic-bezier values that feel heavy, deliberate, geological. Slow start, heavy settle.

**Recommended values (Claude's Discretion):**

```typescript
// Define as reusable constants
const EASING = {
  // Stone shifting into place: slow start, decisive arrival
  geological: [0.22, 0.61, 0.36, 1.0] as const,
  // Crystal formation: builds slowly, snaps into structure
  crystallize: [0.16, 0.85, 0.45, 1.0] as const,
  // Tectonic: very slow start, powerful finish
  tectonic: [0.33, 0.0, 0.2, 1.0] as const,
  // Erosion reveal: gradual, patient, revealing
  erosion: [0.4, 0.0, 0.2, 1.0] as const,
} as const;

// Usage in Framer Motion transitions:
transition={{ duration: 0.4, ease: EASING.geological }}
```

**Duration ranges:**
- Hover state changes: 300-400ms
- Page enter animations: 400-500ms
- Tilt settle back to rest: 450-550ms
- Crystal fracture on click: 300ms
- Scroll-linked (continuous): no duration, driven by scroll position

**Confidence:** MEDIUM -- these values are crafted based on cubic-bezier theory (heavy = high y1 or low x1 values for slow start, high y2 for strong deceleration). Will need visual tuning during implementation.

### Pattern 5: Navigation Contour Line Background

**What:** Inline SVG topographic contour lines rendered as a nav background, with subtle CSS animation and scroll-linked opacity.

**Recommended approach (Claude's Discretion):**

```tsx
// SVG contour lines as a component, positioned absolutely behind nav content
function ContourBackground({ opacity }: { opacity: number }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 80"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      <path
        d="M0,40 Q100,20 200,40 T400,40"
        fill="none"
        stroke="var(--color-frost-500)"
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />
      {/* Multiple paths with varying curves and opacities */}
    </svg>
  );
}
```

Subtle animation: CSS `@keyframes` shifting the SVG paths via `transform: translateX()` at very slow speed (20-30s cycle). Respects prefers-reduced-motion by not animating.

**Confidence:** MEDIUM -- SVG contour generation requires hand-crafting or using a generator tool. The visual quality depends on the specific paths chosen. The generator at topography.blixthalka.com can produce base SVGs to adapt.

### Anti-Patterns to Avoid

- **Animating box-shadow directly:** Causes repaints every frame. Use the pseudo-element opacity technique (pre-render shadow on `::after`, animate its opacity).
- **Heavy SVG filters in backdrop-filter:** SVG filters with `backdrop-filter` have poor cross-browser support (Safari/Firefox) and cause frame drops on mobile. Use simple `backdrop-filter: blur()` with CSS-only glow effects.
- **Using `sibling-index()` or `corner-shape` for hex grid:** These are Chrome-only (2025). The codebase needs cross-browser support. Use `clip-path: polygon()` which works in all modern browsers.
- **Putting content inside clip-path without padding:** Hexagonal clip-paths cut corners. Content near edges will be clipped. Always add generous padding (at least 15-20% of the hex width on sides).
- **Removing dark: variants before verifying:** Phase 3 established dark-only site, but many components still have `dark:` classes (163 occurrences across 16 files). These are harmless but should be cleaned up as part of token migration, not removed in a separate pass.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll position tracking | Custom scroll event listener + state | Framer Motion `useScroll()` + `useTransform()` | GPU-accelerated, handles RAF scheduling, avoids layout thrashing |
| Motion value interpolation | Manual `Math.lerp` with requestAnimationFrame | Framer Motion `useTransform(source, inputRange, outputRange)` | Handles edge cases, type-safe, composable |
| Reduced motion detection | `window.matchMedia` + useState/useEffect | Existing `useReducedMotion()` hook in `lib/useReducedMotion.ts` | Already exists in codebase, tested, handles listener cleanup |
| Card tilt calculation | Raw mousemove + setState every frame | Framer Motion `useMotionValue` + `animate()` | MotionValues bypass React re-renders, 60fps without state churn |
| Hex grid math | Custom positioning calculations | Flexbox + negative margins + clip-path | CSS handles reflow, responsive, no JS layout calculation needed |

**Key insight:** Framer Motion 12 is already installed and provides GPU-accelerated scroll-linked animations, motion values that bypass React state, and spring/tween transitions with custom easing. Every animation in this phase should use Framer Motion, not raw CSS animations or manual RAF loops.

## Common Pitfalls

### Pitfall 1: Clip-Path Eats Box-Shadow and Border

**What goes wrong:** Applying `clip-path` to a card element makes `box-shadow` and `border` invisible (they render outside the clip region).
**Why it happens:** `clip-path` clips the entire rendering of the element, including shadows and borders.
**How to avoid:** Two-layer technique: outer wrapper has the glow/shadow, inner element has the clip-path. OR use `filter: drop-shadow()` instead of `box-shadow` (drop-shadow respects clip-path shape).
**Warning signs:** Glow disappears when you add `clip-path` to the card.

### Pitfall 2: Hex Grid Row Offset on Odd Rows

**What goes wrong:** Hexagonal honeycomb layout requires every other row to be offset by half a hex width. Without this, hexagons stack in a boring rectangular grid.
**Why it happens:** CSS Grid and Flexbox don't natively support row-staggered layouts.
**How to avoid:** Use flexbox with `margin-left: calc(var(--hex-width) / 2)` on even-child items via `:nth-child()` selectors. Calculate the number of items per row using container width.
**Warning signs:** Hexagons look like a standard grid with funny shapes rather than a honeycomb.

### Pitfall 3: Mobile Hex Grid Breaks

**What goes wrong:** Hexagonal grid that works on desktop becomes unusable on mobile -- items overlap, gaps are wrong, or content is clipped.
**Why it happens:** Hex grid math assumes a known number of columns. Mobile viewports may only fit 1-2 items per row, and the stagger offset logic breaks.
**How to avoid:** At mobile breakpoints (< 768px), switch to a single-column layout with crystalline card shapes preserved (clip-path stays, but no hex mosaic). The hex mosaic is a desktop/tablet feature.
**Warning signs:** Cards overlapping or disappearing on mobile viewport.

### Pitfall 4: Scroll-Linked Glow Causes Layout Thrashing

**What goes wrong:** Updating a CSS custom property on every scroll event triggers style recalculation across the entire page.
**Why it happens:** Setting `--glow-intensity` on `document.documentElement` invalidates computed styles for every element that uses it.
**How to avoid:** Set the CSS variable on the closest common ancestor (e.g., a `#main-content` container), not on `:root`. Use `requestAnimationFrame` debouncing or Framer Motion's built-in scroll throttling.
**Warning signs:** Scroll feels janky, FPS drops below 60, DevTools shows "Recalculate Style" on every frame.

### Pitfall 5: 163 Stale dark: Variants

**What goes wrong:** The site is dark-only (Phase 3 decision), but 163 `dark:` variant classes exist across 16 component files. These classes are technically harmless but create confusion about the design system.
**Why it happens:** Phase 3 established dark-only mode in `@layer base` but deferred component migration to Phase 4.
**How to avoid:** As each component is restyled, replace ALL color classes with design token utilities. Remove `dark:` variants, `bg-white`, `text-gray-*`, `bg-gray-*`, etc. The new classes should use `bg-alpine-*`, `text-snow-*`, `text-frost-*`, `border-frost-*`, etc.
**Warning signs:** Component still has `dark:bg-gray-800` or `text-gray-700` after restyling.

### Pitfall 6: ParticleButton Effects Depend on requestAnimationFrame Loop

**What goes wrong:** The existing ParticleButton uses a manual RAF loop with `setParticles` state updates every frame, causing React re-renders.
**Why it happens:** Original implementation predates the use of Framer Motion for particle effects.
**How to avoid:** When replacing with geological effects, use Framer Motion's `AnimatePresence` and `motion.div` with keyframe animations rather than manual RAF + state. This matches the existing codebase pattern used elsewhere and lets Framer Motion handle the animation scheduling.
**Warning signs:** Jank or dropped frames during button click effects.

## Code Examples

### Example 1: Token Migration Pattern

Before (current ProjectCard):
```tsx
className="p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl
  border-2 border-gray-200 dark:border-gray-700
  hover:border-cyan-500 dark:hover:border-cyan-500
  shadow-lg hover:shadow-2xl"
```

After (with design tokens):
```tsx
className="p-8 bg-alpine-800/80 backdrop-blur-sm
  border border-alpine-700 hover:border-frost-500
  shadow-lg hover:shadow-2xl"
```

**Pattern:** Replace `bg-white` / `dark:bg-gray-800` with single `bg-alpine-*`. Replace `text-gray-*` / `dark:text-gray-*` with `text-snow-*` or `text-granite-*`. Replace `text-cyan-*` / `dark:text-cyan-*` with `text-frost-*`. Remove ALL `dark:` prefixes.

### Example 2: Performant Ambient Glow

```css
/* In globals.css */
.ambient-glow {
  position: relative;
}

.ambient-glow::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  box-shadow:
    0 0 calc(8px * var(--glow-intensity, 0.5)) var(--color-frost-glow),
    0 0 calc(20px * var(--glow-intensity, 0.5)) var(--color-frost-glow);
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.ambient-glow:hover::after {
  opacity: 1;
}
```

**Source:** Pseudo-element glow technique from Tobias Ahlin's box-shadow performance guide, adapted with scroll-driven CSS custom property.

### Example 3: Hexagonal Grid with Flexbox

```css
/* In globals.css */
.hex-grid {
  --hex-size: 320px;
  --hex-gap: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: var(--hex-gap);
  padding: 0 calc(var(--hex-size) / 4);
}

.hex-grid > * {
  width: var(--hex-size);
  aspect-ratio: 1 / 1.1547; /* cos(30deg) for regular hexagon proportions */
  flex-shrink: 0;
}

/* Offset every other row */
.hex-grid > *:nth-child(odd of :nth-child(n+4)) {
  /* Fallback: use JavaScript to add .hex-offset class to items in even rows */
}

/* Responsive: single column on mobile */
@media (max-width: 767px) {
  .hex-grid {
    --hex-size: 100%;
    padding: 0;
    flex-direction: column;
    align-items: center;
  }
  .hex-grid > * {
    width: min(100%, 400px);
    aspect-ratio: auto; /* Restore natural height on mobile */
  }
}
```

**Note:** The `:nth-child(odd of :nth-child(n+4))` selector has limited support. The recommended approach is a JavaScript helper that assigns a `.hex-offset` class to items in even rows, or a CSS-only approach using `margin-left` on every Nth item based on items-per-row.

### Example 4: Stratified Geological Depth Shadows

```css
/* Layered shadows that feel like geological strata */
.stratum-1 {
  box-shadow:
    0 1px 2px oklch(0.13 0.015 155 / 0.4),
    0 4px 8px oklch(0.13 0.015 155 / 0.2);
}

.stratum-2 {
  box-shadow:
    0 2px 4px oklch(0.13 0.015 155 / 0.4),
    0 8px 16px oklch(0.13 0.015 155 / 0.2),
    0 16px 32px oklch(0.13 0.015 155 / 0.1);
}

.stratum-3 {
  box-shadow:
    0 4px 8px oklch(0.13 0.015 155 / 0.4),
    0 12px 24px oklch(0.13 0.015 155 / 0.2),
    0 24px 48px oklch(0.13 0.015 155 / 0.15),
    0 48px 96px oklch(0.13 0.015 155 / 0.08);
}
```

**Design rationale:** Each stratum adds more shadow layers with increasing blur and offset, simulating the way rock layers create depth through gradual parallax. Uses alpine-950 OKLCH values for shadow color to maintain the green-tinted dark theme.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.ts` JS config | `@theme` CSS-first config | Tailwind v4 (Jan 2025) | Colors/tokens defined in globals.css -- already done in Phase 3 |
| `dark:` media query variants | Dark-only site, no variants needed | Phase 3 decision | Remove 163 `dark:` occurrences during component restyling |
| Manual `requestAnimationFrame` particles | Framer Motion `AnimatePresence` + `motion.div` | Framer Motion 10+ | ParticleButton rework should use Framer Motion, not manual RAF |
| `border-radius` hexagons (hacks) | `clip-path: polygon()` hexagons | Baseline 2023+ | Cross-browser support confirmed for modern targets |
| JavaScript scroll listeners + state | Framer Motion `useScroll` + `useTransform` GPU-accelerated | Framer Motion 11+ | Scroll-linked glow should use hardware-accelerated path |
| rgb/hex color values | OKLCH color space | Phase 3, Tailwind v4 | All new color values use OKLCH from @theme tokens |

**Deprecated/outdated in this codebase:**
- `dark:` variants on all components -- remove during restyling (dark-only site)
- `bg-white`, `text-gray-*`, `bg-gray-*` defaults -- replace with alpine/snow/granite tokens
- `from-cyan-500 to-blue-600` gradients -- replace with `from-frost-500 to-frost-600` or similar
- Manual RAF animation loop in ParticleButton -- replace with Framer Motion

## Accessibility Considerations

### prefers-reduced-motion (CRITICAL)

The codebase has an established pattern: `useReducedMotion()` hook in `lib/useReducedMotion.ts`, used in 12 files. ALL new micro-interactions MUST follow this pattern:

```typescript
const prefersReducedMotion = useReducedMotion();

// For Framer Motion animations:
animate={prefersReducedMotion ? {} : { rotateX: 5 }}

// For conditional rendering of particle effects:
if (prefersReducedMotion) return null;

// For CSS: use media query
@media (prefers-reduced-motion: reduce) {
  .contour-animate { animation: none; }
  .ambient-glow::after { transition: none; }
}
```

**WCAG 2.3.3 compliance:** Non-essential motion triggered by interaction must be disablable. All hover tilt, crystal fracture, and geological easing animations are non-essential and MUST be gated by the reduced motion check.

### Focus Visibility on Hex Cards

Hexagonal clip-paths will clip standard focus outlines. Custom focus styles needed:

```css
.hex-card:focus-visible {
  /* Use drop-shadow instead of outline (outline is clipped) */
  filter: drop-shadow(0 0 3px var(--color-frost-500));
}
```

### Mobile Touch Targets

Full-screen mobile nav overlay must maintain 44x44px minimum touch targets (existing pattern in GlassmorphismNav with `min-h-[44px]` and `min-w-[44px]`).

## Open Questions

1. **Hex Grid Row Offset: CSS-only or JS-assisted?**
   - What we know: Pure CSS hex grid row offset using `:nth-child()` requires knowing items-per-row, which changes with viewport width. Modern CSS has `sibling-index()` and `mod()` but these are Chrome-only.
   - What's unclear: Whether a clean CSS-only solution exists that works cross-browser at all breakpoints.
   - Recommendation: Use a small JS utility (e.g., `useHexGridLayout()` hook) that calculates items-per-row from container width and assigns `.hex-offset` class to items in even rows. This is more robust than CSS-only approaches and adds negligible overhead.

2. **ParticleButton: Rework or Replace?**
   - What we know: Existing ParticleButton has 6 effect types (explosion, magnetic, sparkle, confetti, ripple, trail). Only 2 instances are used in production (Hero3DMountain.tsx with `trail` and `sparkle`).
   - What's unclear: Whether to modify the existing component to add geological effects as new effect types, or replace it entirely with a new GeologicalButton component.
   - Recommendation: Replace entirely. The existing ParticleButton's manual RAF loop and colorful particle palette are fundamentally different from the geological aesthetic. A new component with a clean Framer Motion implementation is less risky than retrofitting.

3. **Contour Lines: Static SVG or Procedural?**
   - What we know: Hand-crafted SVG paths give full control but are static. Procedural generation (noise functions) creates organic variation but adds complexity.
   - What's unclear: How many contour paths are needed for a convincing topographic effect at navigation scale.
   - Recommendation: Start with 5-8 hand-crafted SVG paths with varying opacity and subtle CSS translateX animation. If the effect looks too static, procedural generation can be added later. Keep it simple for v1.

## Performance Considerations

### GPU-Accelerated Properties
Framer Motion 12 hardware-accelerates: `opacity`, `transform`, `clipPath`, `filter`, `background-color`. The glow bridge should use `opacity` on pseudo-elements (not animating `box-shadow` directly).

### Clip-Path Compositing
`clip-path: polygon()` is composited on the GPU in modern browsers. It should not cause repaint issues. However, animating clip-path values (e.g., morphing hexagon vertices) IS expensive -- avoid this.

### Scroll Event Frequency
`useScroll` internally uses `requestAnimationFrame` scheduling and optionally the browser's `ScrollTimeline` API for hardware acceleration. The `useTransform` chain stays on the animation thread. Setting a CSS custom property via `useMotionValueEvent` does touch the main thread but is a single style write per frame -- acceptable.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `app/globals.css` -- Phase 3 design tokens (@theme, @theme inline, @layer base)
- Codebase analysis: `components/ParticleButton.tsx` -- existing particle effect architecture
- Codebase analysis: `components/GlassmorphismNav.tsx` -- current nav implementation
- Codebase analysis: `components/ProjectCard.tsx` -- current card implementation
- Codebase analysis: `lib/useReducedMotion.ts` -- established accessibility pattern
- [Framer Motion useScroll documentation](https://motion.dev/docs/react-use-scroll) -- scroll-linked animation API
- [Framer Motion transitions documentation](https://motion.dev/docs/react-transitions) -- custom easing, cubic-bezier arrays
- [Tobias Ahlin: How to animate box-shadow performantly](https://tobiasahlin.com/blog/how-to-animate-box-shadow/) -- pseudo-element glow technique
- [CSS-Tricks: Responsive Hexagon Grid Using Modern CSS](https://css-tricks.com/responsive-hexagon-grid-using-modern-css/) -- hex grid layout with clip-path and flexbox

### Secondary (MEDIUM confidence)
- [Tiltable cards from scratch in React](https://stackrant.com/posts/tiltable-cards) -- rotateX/rotateY calculation pattern, perspective values
- [Topography SVG Generator](https://topography.blixthalka.com/) -- tool for generating base contour line SVGs
- [W3C WCAG 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) -- prefers-reduced-motion compliance requirements
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) -- media query reference

### Tertiary (LOW confidence)
- Cubic-bezier geological easing values -- custom-crafted, need visual tuning during implementation
- Stratified shadow values -- designed from first principles, need visual validation
- Hex grid item count per row -- depends on final hex-size variable, needs responsive testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, APIs verified against docs and existing codebase usage
- Architecture patterns: HIGH -- scroll-linked glow, tilt/parallax, clip-path hexagons are well-documented techniques
- Token migration: HIGH -- straightforward class replacement, tokens already defined
- Hex grid layout: MEDIUM -- responsive hex grids are inherently tricky, row-offset logic needs testing
- Geological easing: MEDIUM -- cubic-bezier values are custom, need visual tuning
- Contour line SVG: MEDIUM -- visual quality depends on hand-crafted paths
- Pitfalls: HIGH -- identified from codebase analysis and known CSS/animation gotchas

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable -- no dependency changes expected)
