# Phase 5: Performance & Accessibility Polish - Research

**Researched:** 2026-02-17
**Domain:** Three.js progressive texture loading, reduced-motion accessibility, Framer Motion/React Three Fiber performance
**Confidence:** HIGH

## Summary

Phase 5 addresses two requirements: progressive texture loading in the PhotoCarousel3D component (PERF-01) and consistent `useReducedMotion` application across all animated components (PERF-02). Both are well-scoped modifications to an existing codebase with established patterns.

**PERF-01 (Progressive Textures):** The current PhotoCarousel3D loads ALL 4 textures simultaneously via `useTexture(images.map(img => img.src))`, blocking the entire carousel until all large images (270KB-1MB each) finish loading. The fix requires a two-phase loading strategy: load thumbnail textures first (13-29KB each, already available in the data model as `thumbnailSrc`) to show immediate content, then progressively swap in full-resolution textures for the visible image and its neighbors. The `LandscapeImage` type already has `thumbnailSrc` defined and populated in `data/landscapes.ts`. Three.js `Texture.needsUpdate = true` enables hot-swapping a texture's image data without remounting components. The current `useTexture` hook from drei blocks on Suspense, so the progressive approach requires switching to Three.js `TextureLoader` directly with manual loading orchestration.

**PERF-02 (Reduced Motion):** An audit reveals 14 animated components are missing `useReducedMotion` integration. The codebase already has a working `useReducedMotion()` hook in `lib/useReducedMotion.ts` and 12 components use it correctly, establishing a clear pattern. The missing components use Framer Motion `motion.*` elements with `initial`/`animate` props, `whileHover`/`whileTap` gestures, and CSS animations (`animate-pulse`). The fix is methodical: add the hook to each component and gate animations behind the preference check. Additionally, Tailwind CSS `animate-pulse` classes appear in 5 locations and should be gated with a `prefers-reduced-motion: reduce` CSS rule.

**Primary recommendation:** Split into two plans -- one for progressive texture loading (isolated to PhotoCarousel3D), one for the reduced-motion audit (touches 14+ components across the codebase plus globals.css).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-01 | PhotoCarousel3D loads textures progressively -- visible images plus adjacent loaded first, remaining lazy loaded with low-res placeholders | Progressive loading architecture pattern (two-phase TextureLoader), thumbnail images already exist (13-29KB), hot-swap via `texture.needsUpdate`, adjacency-aware loading queue |
| PERF-02 | `useReducedMotion` applied consistently across all animated components, disabling micro-interactions and 3D animations for users who prefer reduced motion | Full audit of 14 missing components identified, existing hook pattern established in 12 components, CSS `prefers-reduced-motion` rule expansion needed, `animate-pulse` gating required |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | 0.182.0 | `TextureLoader` for manual progressive loading, `Texture.needsUpdate` for hot-swap | Already installed; `useTexture` from drei doesn't support progressive loading, so direct TextureLoader is needed |
| @react-three/fiber | 9.5.0 | Canvas, useFrame, useThree for 3D scene | Already used in PhotoCarousel3D |
| @react-three/drei | 10.7.7 | `Html`, `Environment` helpers (keep existing usage) | Already used; `useTexture` will be replaced for the carousel but remains valid elsewhere |
| framer-motion | 12.34.0 | `motion.*` animation elements to be gated behind reduced-motion checks | Already used in all 14 affected components |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-spring/three | 10.0.3 | Spring animations in PhotoFrame component | Already used for scale/posZ/opacity springs in carousel -- must also gate behind reduced motion |

### No New Dependencies Needed
| Problem | Solution Without New Dep |
|---------|------------------------|
| Progressive texture loading | THREE.TextureLoader + manual load orchestration + useRef for texture state |
| Reduced motion detection | Existing `useReducedMotion()` hook in `lib/useReducedMotion.ts` |
| CSS animation gating | `@media (prefers-reduced-motion: reduce)` in globals.css |
| Texture hot-swap | `texture.image = newImage; texture.needsUpdate = true;` (Three.js built-in) |

## Architecture Patterns

### Pattern 1: Progressive Texture Loading (PhotoCarousel3D)

**What:** Load low-resolution thumbnail textures immediately, then progressively replace with full-resolution textures based on proximity to the active image.

**When to use:** PhotoCarousel3D component where all 4 landscape images currently block on load.

**Current problem (line 124 of PhotoCarousel3D.tsx):**
```typescript
// BLOCKS until ALL textures loaded -- entire carousel invisible during load
const textures = useTexture(images.map(img => img.src));
```

**Recommended architecture:**

```
Phase 1: Initial Load (fast -- 13-29KB per texture)
  Load ALL thumbnail textures via TextureLoader
  Render carousel immediately with thumbnail textures
  Show loading indicator overlay

Phase 2: Progressive Enhancement (background)
  Determine priority: active image, then adjacent (+1, -1), then rest
  Load full-res textures one at a time via TextureLoader
  Hot-swap each texture as it loads: texture.image = fullImg; texture.needsUpdate = true;
  No component remount needed -- Three.js updates the GPU texture in-place
```

**Implementation approach:**
```typescript
// Custom hook: useProgressiveTextures
function useProgressiveTextures(images: LandscapeImage[], activeIndex: number) {
  // Refs to hold Three.js Texture objects (stable across renders)
  const texturesRef = useRef<THREE.Texture[]>([]);
  const [loadState, setLoadState] = useState<('thumb' | 'full')[]>([]);
  const loaderRef = useRef(new THREE.TextureLoader());

  // Phase 1: Load all thumbnails on mount
  useEffect(() => {
    const loader = loaderRef.current;
    const textures: THREE.Texture[] = [];

    images.forEach((img, i) => {
      const thumbUrl = img.thumbnailSrc || img.src;
      loader.load(thumbUrl, (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        textures[i] = texture;
        texturesRef.current = [...textures];
        setLoadState(prev => {
          const next = [...prev];
          next[i] = 'thumb';
          return next;
        });
      });
    });
  }, [images]);

  // Phase 2: Load full-res based on proximity to active
  useEffect(() => {
    const loader = loaderRef.current;
    const len = images.length;
    // Priority order: active, active+1, active-1, then rest
    const priority = [
      activeIndex,
      (activeIndex + 1) % len,
      (activeIndex - 1 + len) % len,
      ...images.map((_, i) => i).filter(i =>
        i !== activeIndex &&
        i !== (activeIndex + 1) % len &&
        i !== (activeIndex - 1 + len) % len
      ),
    ];

    let cancelled = false;

    async function loadSequentially() {
      for (const idx of priority) {
        if (cancelled) break;
        if (loadState[idx] === 'full') continue;

        await new Promise<void>((resolve) => {
          loader.load(images[idx].src, (fullTexture) => {
            if (cancelled) return resolve();
            fullTexture.minFilter = THREE.LinearFilter;
            fullTexture.generateMipmaps = false;
            // Hot-swap: update existing texture's image data
            const existing = texturesRef.current[idx];
            if (existing) {
              existing.image = fullTexture.image;
              existing.needsUpdate = true;
            }
            setLoadState(prev => {
              const next = [...prev];
              next[idx] = 'full';
              return next;
            });
            resolve();
          });
        });
      }
    }

    loadSequentially();
    return () => { cancelled = true; };
  }, [activeIndex, images, loadState]);

  return { textures: texturesRef.current, loadState };
}
```

**Confidence:** HIGH -- Three.js TextureLoader and `needsUpdate` are core Three.js APIs. The pattern of loading low-res first and hot-swapping is well-documented (see Sources). The thumbnailSrc data already exists in `data/landscapes.ts`.

### Pattern 2: Component-Level Reduced Motion Gating

**What:** Each animated component checks `useReducedMotion()` and conditionally disables or simplifies all animations.

**When to use:** Every component that uses Framer Motion `motion.*` elements, `useFrame`, `useSpring`, or CSS animations.

**Established pattern (from existing codebase):**
```typescript
// Source: components/ProjectCard.tsx (already implemented correctly)
const prefersReducedMotion = useReducedMotion();

// For Framer Motion animate props -- skip initial animation
<motion.div
  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  // ...
>

// For whileHover/whileTap gestures -- disable
<motion.div
  whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
  whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
>

// For useFrame loops -- skip animation updates
useFrame((state) => {
  if (prefersReducedMotion) return;
  // ... animation logic
});

// For useSpring -- use immediate mode (no animation)
const { scale } = useSpring({
  scale: isActive ? 1.5 : 1,
  config: prefersReducedMotion ? { duration: 0 } : config.gentle,
  immediate: prefersReducedMotion,
});
```

**Confidence:** HIGH -- This exact pattern is already used in 12 components in the codebase.

### Pattern 3: CSS Animation Gating

**What:** Tailwind's `animate-pulse` and any CSS `@keyframes` animations must be disabled for reduced-motion users via CSS media query.

**Implementation:**
```css
/* In globals.css -- extend existing reduced motion block */
@media (prefers-reduced-motion: reduce) {
  /* Existing Phase 4 guards */
  .contour-animate {
    animation: none;
  }
  .ambient-glow::after {
    transition: none;
  }
  .glow-frost,
  .glow-ember {
    transition: none;
  }

  /* Phase 5 additions: Tailwind animation utilities */
  .animate-pulse {
    animation: none;
  }
  .animate-spin {
    animation: none;
  }
  .animate-bounce {
    animation: none;
  }

  /* Disable all transitions for reduced motion */
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

**Note:** The universal `*` selector approach is aggressive but recommended by WCAG. Using `0.01ms` instead of `0s` avoids breaking JS that depends on `transitionend` events.

**Confidence:** HIGH -- Standard WCAG 2.3.3 pattern, widely used across production sites.

### Pattern 4: 3D Scene Reduced Motion (PhotoCarousel3D + MountainTerrain3D)

**What:** When reduced motion is enabled, stop the `useFrame` animation loops and `useSpring` transitions in 3D components. The scene renders statically but remains interactive (click to navigate still works).

**Current behavior:** PhotoCarousel3D already passes `prefersReducedMotion` to `<Carousel>` and skips the smooth rotation lerp in `useFrame`. However, `PhotoFrame`'s floating animation (`Math.sin(time * 0.4)`) is NOT gated.

**Fix needed in PhotoFrame:**
```typescript
// In PhotoFrame component, the floating animation is ungated:
useFrame((state) => {
  if (!groupRef.current) return;
  // ADD: if (prefersReducedMotion) return;
  const time = state.clock.getElapsedTime();
  const floatAmount = isActive ? 0.12 : 0.04;
  groupRef.current.position.y = position[1] + Math.sin(time * 0.4 + index * 0.5) * floatAmount;
});
```

Also need to gate the `useSpring` animations in PhotoFrame:
```typescript
const { scale, posZ, opacity } = useSpring({
  scale: isActive ? 1.5 : 1,
  posZ: isActive ? 2 : 0,
  opacity: isActive ? 1 : 0.7,
  config: prefersReducedMotion ? { duration: 0 } : config.gentle,
  immediate: prefersReducedMotion,
});
```

And consider setting `frameloop="demand"` on the Canvas when reduced motion is enabled, so the GPU only renders when state changes (not 60fps continuous).

**Confidence:** HIGH -- `frameloop="demand"` is documented in react-three-fiber. `useSpring` `immediate` prop is documented in react-spring.

### Anti-Patterns to Avoid

- **Using MotionConfig `reducedMotion="user"` as the only solution:** MotionConfig only affects Framer Motion's `animate` prop -- it does NOT affect `useFrame`, `useSpring`, CSS animations, or Tailwind utility classes. The codebase needs per-component `useReducedMotion()` checks because animations span multiple libraries.
- **Setting `animate={false}` for reduced motion:** This prevents the element from ever reaching its target state. Instead, set `initial={false}` to skip the entrance animation while still applying the target values immediately.
- **Removing animations entirely:** Reduced motion should simplify, not eliminate. Opacity fades are generally acceptable. The goal is to remove transform-based motion (x/y movement, scale, rotation), not all visual feedback.
- **Loading all textures then hiding the carousel:** The Suspense fallback currently shows nothing (`fallback={null}`). Loading thumbnails first means the carousel renders quickly with blurry-but-present content, which is better UX than a loading spinner or blank space.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reduced motion detection | `window.matchMedia` + manual state | Existing `useReducedMotion()` in `lib/useReducedMotion.ts` | Already exists, tested, handles listener cleanup |
| Texture loading progress tracking | Custom fetch + blob + createObjectURL | THREE.TextureLoader callbacks (onLoad, onProgress, onError) | TextureLoader handles CORS, caching, WebGL upload |
| Spring animation disabling | Manual lerp with duration: 0 | `useSpring({ immediate: prefersReducedMotion })` | react-spring built-in; skips animation cleanly |
| CSS animation disabling | Per-class overrides | Universal `prefers-reduced-motion` media query | One rule covers all current and future animations |

**Key insight:** The codebase already has the reduced-motion hook and pattern established. This phase is about applying the pattern consistently, not inventing new approaches.

## Common Pitfalls

### Pitfall 1: useTexture Suspense Blocks Entire Carousel

**What goes wrong:** `useTexture(urls)` from drei triggers React Suspense, hiding the entire carousel until ALL textures load.
**Why it happens:** `useTexture` internally uses `useLoader`, which throws a promise during loading. Suspense catches it and shows the fallback.
**How to avoid:** Replace `useTexture` with direct `THREE.TextureLoader` for the progressive loading flow. Use `useRef` to hold texture objects and manual state for load tracking. The carousel renders immediately with whatever textures are available.
**Warning signs:** Carousel shows `fallback={null}` (blank space) for 2-5 seconds while all large textures load.

### Pitfall 2: Texture Hot-Swap Without needsUpdate

**What goes wrong:** You replace `texture.image` with a new Image, but the 3D scene still shows the old (thumbnail) texture.
**Why it happens:** Three.js caches the GPU texture. It does not check if `.image` changed unless you set `.needsUpdate = true`.
**How to avoid:** Always set `texture.needsUpdate = true` after replacing the image data.
**Warning signs:** Thumbnails never get replaced with full-res even though network shows images loaded.

### Pitfall 3: Memory Leak from TextureLoader

**What goes wrong:** Loading new textures without disposing old ones causes GPU memory to grow.
**Why it happens:** Three.js textures stay in GPU memory until explicitly `.dispose()`d.
**How to avoid:** Call `texture.dispose()` in the useEffect cleanup function when the component unmounts. For hot-swap (replacing thumb with full), the old texture data is overwritten in-place, so no separate dispose is needed.
**Warning signs:** GPU memory grows on page navigation, browser tab crashes on mobile.

### Pitfall 4: Missing Reduced Motion in Entrance Animations

**What goes wrong:** Components animate in (slide from left, fade up) even when reduced motion is enabled. Users with vestibular disorders experience motion sickness.
**Why it happens:** `motion.div` with `initial={{ x: -50 }}` and `animate={{ x: 0 }}` plays a transform animation. Setting `initial={false}` skips it.
**How to avoid:** For entrance animations, use `initial={prefersReducedMotion ? false : { ... }}`. This makes the element start in its final position.
**Warning signs:** Enable "Prefer reduced motion" in OS settings, reload page -- if elements slide/scale/rotate in, the gating is missing.

### Pitfall 5: whileHover Still Fires With Reduced Motion

**What goes wrong:** Framer Motion's `whileHover={{ scale: 1.1 }}` still scales the element on hover even with reduced motion enabled.
**Why it happens:** `whileHover` is not affected by `MotionConfig reducedMotion`. It must be explicitly gated.
**How to avoid:** `whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}`. Passing `undefined` disables the gesture.
**Warning signs:** Hovering over buttons/cards causes scale/rotation animation with reduced motion on.

### Pitfall 6: Footer Heart Animation Loops Infinitely

**What goes wrong:** The Footer's heart emoji has `animate={{ scale: [1, 1.2, 1] }}` with `repeat: Infinity`. This continuous animation persists even with reduced motion.
**Why it happens:** The Footer component does not import or check `useReducedMotion`.
**How to avoid:** Gate the animation: `animate={prefersReducedMotion ? {} : { scale: [1, 1.2, 1] }}`.
**Warning signs:** Heart pulsing in footer with reduced motion enabled.

## Code Examples

### Example 1: Progressive Texture Hook Usage in Carousel

```typescript
// Source: Adapted from Three.js TextureLoader API + progressive loading gist
// In Carousel component, replacing useTexture:

function Carousel({ images, onImageClick, prefersReducedMotion }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { textures, loadState, allThumbsLoaded } = useProgressiveTextures(images, activeIndex);

  // Don't render PhotoFrames until at least thumbnails are ready
  if (!allThumbsLoaded) {
    return (
      <Html center>
        <div className="text-snow-200 animate-pulse">Loading gallery...</div>
      </Html>
    );
  }

  return (
    <group ref={groupRef}>
      {images.map((image, i) => (
        <PhotoFrame
          key={image.id}
          image={image}
          texture={textures[i]}
          isFullRes={loadState[i] === 'full'}
          // ... other props
        />
      ))}
    </group>
  );
}
```

### Example 2: Reduced Motion Gating for Entrance Animations

```typescript
// Source: Established pattern in components/ProjectCard.tsx, components/GlassmorphismNav.tsx
// Apply to: Header.tsx, Footer.tsx, RoadmapTimeline.tsx, etc.

import { useReducedMotion } from '@/lib/useReducedMotion';

export default function Header() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.header
      // Skip entrance animation; render in final position
      initial={prefersReducedMotion ? false : { y: -100 }}
      animate={{ y: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: DURATION.enter, ease: [...EASING.geological] }
      }
    >
      {/* ... */}
      <motion.div
        // Disable hover scale
        whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      >
        {/* Logo */}
      </motion.div>

      {/* Nav items: skip stagger delay */}
      {navigation.map((item, index) => (
        <motion.div
          key={item.name}
          initial={prefersReducedMotion ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { delay: index * 0.1, ease: [...EASING.crystallize] }
          }
        >
          {/* ... */}
        </motion.div>
      ))}
    </motion.header>
  );
}
```

### Example 3: 3D Animation Gating with useSpring + useFrame

```typescript
// Source: @react-spring/three API + existing PhotoCarousel3D pattern
// Apply to: PhotoFrame component within PhotoCarousel3D

function PhotoFrame({ image, texture, position, rotation, isActive, onClick, index, prefersReducedMotion }: PhotoFrameProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Gate spring animations
  const { scale, posZ, opacity } = useSpring({
    scale: isActive ? 1.5 : 1,
    posZ: isActive ? 2 : 0,
    opacity: isActive ? 1 : 0.7,
    config: prefersReducedMotion ? { duration: 0 } : config.gentle,
    immediate: prefersReducedMotion,
  });

  // Gate floating animation
  useFrame((state) => {
    if (!groupRef.current || prefersReducedMotion) return;
    const time = state.clock.getElapsedTime();
    const floatAmount = isActive ? 0.12 : 0.04;
    groupRef.current.position.y = position[1] + Math.sin(time * 0.4 + index * 0.5) * floatAmount;
  });

  // ... rest of component
}
```

### Example 4: Canvas frameloop Optimization for Reduced Motion

```typescript
// Source: react-three-fiber docs on frameloop prop
// In PhotoCarousel3D main component:

<Canvas
  camera={{ position: [0, 2, 12], fov: 50 }}
  frameloop={prefersReducedMotion ? 'demand' : 'always'}
  // ... other props
>
```

**`frameloop="demand"`** only renders when state changes (e.g., user clicks a photo). This saves significant GPU/CPU when animations are disabled.

## Full Reduced-Motion Audit

### Components Already Gated (12 -- no changes needed)
| Component | Animations Gated |
|-----------|-----------------|
| `ProjectCard.tsx` | Tilt hover, entrance animation |
| `GlassmorphismNav.tsx` | Scroll-linked opacity, stagger, mobile menu |
| `GeologicalButton.tsx` | Crystal fracture, mineral dust, tilt |
| `ContourBackground.tsx` | SVG drift animation |
| `Hero3DMountain.tsx` | 3D scene visibility |
| `Hero3DSection.tsx` | Parallax scroll, entrance animation |
| `MountainTerrain3D.tsx` | Wireframe rotation, wave animation |
| `PhotoCarousel3D.tsx` | Carousel rotation (but NOT PhotoFrame float -- see below) |
| `ParticleButton.tsx` | Particle effects (@deprecated) |
| `HologramTerminal.tsx` | Scan line, typing animation |
| `DualParticleSystem.tsx` | Particle rendering |
| `AnimatedGradientMesh.tsx` | Gradient animation |

### Components Missing Reduced Motion (14 -- must fix)
| Component | Animation Types | Impact |
|-----------|----------------|--------|
| `Header.tsx` | Entrance slide (y: -100), nav stagger, whileHover scale, whileTap, layoutId tab | HIGH -- visible on every page |
| `Footer.tsx` | Entrance fade/slide, social icon stagger + scale, whileHover, infinite heart pulse | HIGH -- visible on every page |
| `ProjectHighlights.tsx` | Entrance fade/slide with stagger | MEDIUM -- project detail page |
| `RoadmapTimeline.tsx` | Entrance slide (x: -50) with stagger, progress bar width animation | MEDIUM -- roadmap page |
| `RoadmapFilters.tsx` | Framer Motion usage (minor) | LOW -- filter buttons |
| `RoadmapProgress.tsx` | Framer Motion entrance animations | LOW -- progress stats |
| `FeatureShowcase.tsx` | Entrance fade, whileHover scale + layoutId | MEDIUM -- project detail page |
| `TechStackDisplay.tsx` | Entrance scale, whileHover scale + y shift | MEDIUM -- project detail page |
| `TerminalDemo.tsx` | Typing animation (setInterval-based), AnimatePresence | MEDIUM -- project demo |
| `ZoomableImage.tsx` | Pan/zoom with useMotionValue + useTransform | LOW -- functional, not decorative |
| `ImageDetailModal.tsx` | Modal entrance via AnimatePresence | LOW -- user-triggered |
| `InteractiveHotspot.tsx` | Tooltip entrance via AnimatePresence | LOW -- user-triggered |
| `HologramTerminalDemo.tsx` | Typing animation, entrance fade | MEDIUM -- project demo |
| `ShaderTransition.tsx` | Shader dissolve (useFrame-based) | LOW -- texture transition effect |

### CSS Animations Needing Gating
| Class | Location | Fix |
|-------|----------|-----|
| `animate-pulse` | ProgressiveImage, PhotosPageClient, ProjectDetailClient, HologramTerminal, HologramTerminalDemo | Add to `@media (prefers-reduced-motion: reduce)` in globals.css |

### Sub-component Gating Gap in PhotoCarousel3D
| Issue | Location | Fix |
|-------|----------|-----|
| PhotoFrame floating animation (`Math.sin`) not gated | PhotoCarousel3D.tsx line 34-39 | Pass `prefersReducedMotion` prop to PhotoFrame, gate useFrame |
| PhotoFrame useSpring not gated | PhotoCarousel3D.tsx line 26-30 | Add `immediate: prefersReducedMotion` to useSpring |
| Canvas frameloop always running | PhotoCarousel3D.tsx line 251 | Use `frameloop={prefersReducedMotion ? 'demand' : 'always'}` |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useTexture` blocking all textures | Manual TextureLoader with progressive swap | Pattern available since Three.js r100+ | Carousel shows content in <1s instead of 3-5s |
| Per-component `@media` queries | Universal `* { transition-duration: 0.01ms }` in reduced-motion block | WCAG 2.3.3 best practice | One CSS rule catches all current and future CSS animations |
| `MotionConfig reducedMotion="user"` as sole solution | Per-component `useReducedMotion()` + MotionConfig as safety net | Framer Motion v10+ | Multi-library codebase (framer-motion + react-spring + three.js) needs per-component gating |
| `frameloop="always"` regardless | `frameloop="demand"` when reduced motion | react-three-fiber v8+ | Saves GPU cycles for static 3D scenes |

**Deprecated/outdated:**
- Relying solely on `MotionConfig` for reduced motion: Does not cover react-spring, Three.js useFrame, or CSS animations
- Using `useTexture` for all textures when progressive loading is needed: Blocks on Suspense, loads everything or nothing

## Open Questions

1. **Should the TerminalDemo typing animation be disabled or slowed?**
   - What we know: TerminalDemo uses `setInterval` to type characters one by one. This is a content-revealing animation, not decorative motion.
   - What's unclear: Whether character-by-character typing constitutes "motion" under WCAG 2.3.3. The typing does not involve spatial movement.
   - Recommendation: Show the full text immediately (skip typing animation) when reduced motion is enabled. This respects the spirit of the preference while keeping content accessible. The text content is what matters, not the typewriter effect.

2. **Should ZoomableImage pan/zoom be gated?**
   - What we know: ZoomableImage uses `useMotionValue` for pan and zoom, which are user-initiated interactions (click to zoom, drag to pan).
   - What's unclear: WCAG 2.3.3 specifically says "Motion triggered by interaction can be disabled." But zoom/pan is core functionality, not decoration.
   - Recommendation: Do NOT gate zoom/pan in ZoomableImage. These are functional interactions the user initiates and controls. Disabling them would reduce functionality. However, ensure the zoom transition uses `duration: 0` when reduced motion is on (instant zoom, no animated scale).

3. **Texture size optimization: should thumbnails be even smaller for 3D?**
   - What we know: Current thumbnails are 400x267px (13-29KB). For a 3D plane geometry of `args={[4, 3]}` in a carousel at distance, even 400px might be more than needed for the initial placeholder.
   - What's unclear: Whether creating a dedicated tiny (e.g., 100x67px) placeholder would noticeably speed up initial load.
   - Recommendation: Use existing thumbnails as-is. At 13-29KB they already load in <100ms on broadband. Creating a new image pipeline variant adds complexity for minimal gain.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- `components/PhotoCarousel3D.tsx`: Current texture loading pattern (useTexture blocking), existing reduced-motion prop pass-through, useFrame/useSpring usage
- **Codebase analysis** -- `lib/useReducedMotion.ts`: Existing hook implementation with matchMedia listener
- **Codebase analysis** -- `data/landscapes.ts`: 4 images with `thumbnailSrc` defined, pointing to existing thumbnail files
- **Codebase analysis** -- 14 components identified as missing `useReducedMotion` (Header, Footer, ProjectHighlights, RoadmapTimeline, RoadmapFilters, RoadmapProgress, FeatureShowcase, TechStackDisplay, TerminalDemo, ZoomableImage, ImageDetailModal, InteractiveHotspot, HologramTerminalDemo, ShaderTransition)
- **Codebase analysis** -- `app/globals.css` lines 348-360: Existing `prefers-reduced-motion` CSS block
- **[R3F Loading Assets](https://aaronclaes.be/blogs/react-three-fiber/loading-assets)** -- useLoader caching, Suspense patterns, preloading strategies, useDeferredValue for texture switching
- **[R3F Loading Textures](https://r3f.docs.pmnd.rs/tutorials/loading-textures)** -- useTexture API, Suspense behavior, preload methods
- **Image file sizes** -- Thumbnails: 13-29KB (400x267px), Large: 270KB-1MB (2400x1600px), Small: 24-59KB (640x427px)

### Secondary (MEDIUM confidence)
- **[Progressive Texture Loader Gist](https://gist.github.com/knee-cola/37875bc4359609b96c9f329cd2a68fa1)** -- Pattern for sequential quality loading with `texture.needsUpdate`
- **[Framer Motion Accessibility](https://motion.dev/docs/react-accessibility)** -- MotionConfig reducedMotion prop, limitations
- **[R3F Discussion #2356](https://github.com/pmndrs/react-three-fiber/discussions/2356)** -- useTexture Suspense blocking behavior, useTransition workaround
- **[WCAG 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)** -- What constitutes motion that must be disableable

### Tertiary (LOW confidence)
- None -- all findings verified against codebase analysis or official documentation

## Metadata

**Confidence breakdown:**
- Progressive texture loading: HIGH -- Three.js TextureLoader API is stable, thumbnail images exist, pattern is straightforward
- Reduced motion audit: HIGH -- 14 missing components identified by automated scan, fix pattern established in 12 existing components
- CSS animation gating: HIGH -- Standard WCAG pattern, existing `prefers-reduced-motion` block in globals.css to extend
- 3D scene optimization: HIGH -- `frameloop="demand"` is documented r3f feature, `useSpring immediate` is documented react-spring feature

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable -- no fast-moving APIs involved)
