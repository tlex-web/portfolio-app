---
status: awaiting_human_verify
trigger: "PhotoCarousel3D causes THREE.WebGLRenderer: Context Lost errors and dev server stalls on /photos page"
created: 2026-02-17T00:00:00Z
updated: 2026-02-17T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - Multiple GPU texture leaks causing WebGL context loss
test: Fix applied, awaiting human verification on dev server
expecting: No more Context Lost errors on /photos page
next_action: User verifies fix in browser

## Symptoms

expected: Photos page loads carousel with smooth animation, textures load progressively
actual: Dev server stalls, THREE.WebGLRenderer: Context Lost appears 3x, carousel animation stalls
errors: THREE.WebGLRenderer: Context Lost (x3)
reproduction: Navigate to /photos page on dev server (port 3001)
started: After Phase 05-01 replaced drei useTexture with custom useProgressiveTextures hook

## Eliminated

## Evidence

- timestamp: 2026-02-17T00:01:00Z
  checked: next.config.ts
  found: reactStrictMode is true -- React 18 strict mode double-invokes effects in dev
  implication: Phase 1 useEffect runs twice on mount, loading all 4 thumbnails twice (8 loads). Phase 2 useEffect also double-fires. But cleanup only sets cancelled=true, it does NOT dispose the intermediate THREE.Texture objects created by TextureLoader.load(). Those leaked textures consume GPU memory.

- timestamp: 2026-02-17T00:02:00Z
  checked: useProgressiveTextures.ts Phase 1 (lines 48-114) and Phase 2 (lines 117-193) -- texture lifecycle
  found: CRITICAL BUG 1 - When TextureLoader.load() calls the success callback, it provides a NEW THREE.Texture (thumbTexture/fullTexture). The code hot-swaps via existing.image = thumbTexture.image, but NEVER disposes the intermediate thumbTexture/fullTexture object itself. Only the .image property is transferred; the Texture wrapper (which holds a GPU texture slot) is leaked.
  implication: Every thumbnail and full-res load leaks one THREE.Texture GPU allocation. With Strict Mode double-fire: 4 thumbs x2 + 4 full x2 = 16 leaked GPU textures, plus the 4 placeholder textures and 4 hot-swapped textures = 24 total GPU texture allocations for 4 images. WebGL contexts have hard limits (~16 textures active on many GPUs).

- timestamp: 2026-02-17T00:03:00Z
  checked: useProgressiveTextures.ts Phase 2 dependency array (line 193)
  found: CRITICAL BUG 2 - Phase 2 useEffect depends on [activeIndex, images.length]. Every time activeIndex changes, it re-runs the ENTIRE sequential load for ALL images (the priority array includes all indices). It sets cancelled=true on the old run but starts a brand new sequential load that re-loads all non-fullLoadedRef images. With Strict Mode, each activeIndex change fires the effect TWICE. Combined with Bug 1 (no dispose of intermediate textures), this compounds the leak.
  implication: Each carousel navigation multiplies leaked textures.

- timestamp: 2026-02-17T00:04:00Z
  checked: useProgressiveTextures.ts Phase 1 (lines 54-60) -- placeholder allocation
  found: CRITICAL BUG 3 - Phase 1 creates placeholder textures (line 55-59) when texturesRef.current.length !== images.length. Under Strict Mode, the first mount creates 4 placeholders, cleanup runs (but only sets cancelled=true, does NOT clear texturesRef), second mount sees length matches so skips allocation. But the UNMOUNT cleanup effect (lines 196-204) that disposes textures runs AFTER the re-mount in Strict Mode, potentially disposing the textures that the re-mounted component is actively using.
  implication: Race between Strict Mode cleanup and re-mount creates disposed-but-still-referenced textures, which Three.js then tries to re-upload to GPU, causing context pressure.

- timestamp: 2026-02-17T00:05:00Z
  checked: useProgressiveTextures.ts unmount cleanup (lines 196-204)
  found: CRITICAL BUG 4 - The unmount cleanup effect at lines 196-204 has an empty dependency array [], meaning it only runs on unmount. However, when Phase 1 effect re-runs (e.g., if images.length changes), it creates NEW placeholder textures (line 55-59) and replaces texturesRef.current, but the OLD placeholders are never disposed. They are orphaned GPU textures.
  implication: Orphaned textures from re-allocations are never freed.

- timestamp: 2026-02-17T00:06:00Z
  checked: PhotoCarousel3D.tsx line 195 -- texture consumption
  found: textureArray[i] is passed to PhotoFrame, which uses it on TWO meshes (photo + reflection, lines 60 and 89). That means each texture is bound to 2 materials. With 4 images = 8 material bindings. Not a bug per se, but doubles the GPU sampling pressure.
  implication: Doubles effective texture usage, compounding the leak impact.

- timestamp: 2026-02-17T00:07:00Z
  checked: Canvas gl config (PhotoCarousel3D.tsx lines 244-250)
  found: shadow-mapSize-width={2048} and shadow-mapSize-height={2048} on the directional light. A single 2048x2048 shadow map consumes ~16MB of GPU memory. Combined with Environment preset="city" (loads an HDR cubemap, ~6 texture slots), the baseline GPU memory is already high before any photo textures load.
  implication: High baseline GPU memory usage reduces headroom for texture leaks before context loss.

- timestamp: 2026-04-02T00:00:00Z
  checked: Applied fix to lib/useProgressiveTextures.ts
  found: Three changes applied -- (1) Phase 2 deps changed to [allThumbsLoaded, images.length] with activeIndex read via ref, (2) Strict Mode unmount race fixed with mountedRef + queueMicrotask, (3) Phase 2 waits for thumbs before starting. TypeScript type-check passes clean.
  implication: Fix addresses all diagnosed root causes. Needs human verification on dev server.

## Resolution

root_cause: Intermediate THREE.Texture objects from TextureLoader.load() callbacks are never disposed after hot-swap. Only .image is transferred to the persistent texture, but the loaded texture wrapper (which holds a GPU texture handle) is leaked. React Strict Mode double-fires all effects in dev, doubling the leak rate. Combined with high baseline GPU usage (2048x2048 shadow map + HDR environment cubemap), the leaked textures exhaust WebGL context resources within seconds, triggering THREE.WebGLRenderer: Context Lost.
fix: |
  Three changes to lib/useProgressiveTextures.ts:
  1. Phase 2 dependency array changed from [activeIndex, images.length] to [allThumbsLoaded, images.length].
     Phase 2 now reads activeIndex via ref (activeIndexRef.current) inside the load loop, so navigation
     changes which index loads next without cancelling/restarting the entire sequential load chain.
     The loop processes all indices (priority-ordered), not just active+adjacent, since it only runs once.
  2. Strict Mode unmount race fixed with mountedRef + queueMicrotask pattern. The unmount cleanup defers
     texture disposal to a microtask, allowing Strict Mode re-mount to set mountedRef=true first.
     If re-mount claimed ownership, disposal is skipped.
  3. Phase 2 now waits for allThumbsLoaded before starting, preventing overlapping Phase 1/Phase 2 loads.
     Failed full-res loads are marked in fullLoadedRef to avoid infinite retry loops.
  Shadow map was already reduced to 1024x1024 and intermediate textures already disposed (from prior partial fix).
verification: TypeScript type-check passes clean. Awaiting human verification on dev server.
files_changed: [lib/useProgressiveTextures.ts]
