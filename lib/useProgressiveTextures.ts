'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';

type LoadState = 'loading' | 'thumb' | 'full';

/** One texture's two URLs: a small image loaded first, then the larger one. */
export interface ProgressiveTextureSource {
  thumbSrc: string;
  fullSrc: string;
}

interface UseProgressiveTexturesResult {
  textures: THREE.Texture[];
  loadState: LoadState[];
  allThumbsLoaded: boolean;
}

/**
 * Gives `texture` a new image. The GPU copy is released first: under WebGL2
 * three.js allocates immutable storage at the first upload, so a larger image
 * written into the same storage fails ("glTexSubImage2D: Offset overflows
 * texture dimensions") and the thumbnail would stay. After dispose() the same
 * Texture object uploads afresh at its new size on the next render.
 */
function swapImage(texture: THREE.Texture, image: THREE.Texture['image']): void {
  texture.dispose();
  texture.image = image;
  texture.needsUpdate = true;
}

/**
 * Progressive texture loading hook for Three.js scenes.
 *
 * Each source names its two URLs (10-07: the carousel passes the manifest
 * 640 and 1024 WebP derivatives; the legacy carousel its thumbnail and src).
 *
 * Phase 1 (mount): Loads all thumbnail textures in parallel.
 * Phase 2 (activeIndex change): Loads full-resolution textures sequentially by
 * proximity -- active image first, then adjacent, then remaining.
 *
 * Uses in-place hot-swap (texture.image + needsUpdate) so the GPU texture
 * updates without remounting React components.
 */
export function useProgressiveTextures(
  sources: readonly ProgressiveTextureSource[],
  activeIndex: number
): UseProgressiveTexturesResult {
  const texturesRef = useRef<THREE.Texture[]>([]);
  const loaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());
  const [loadState, setLoadState] = useState<LoadState[]>(() =>
    sources.map(() => 'loading')
  );
  const [allThumbsLoaded, setAllThumbsLoaded] = useState(false);

  // Track which indices already have full-res loaded to avoid re-loading
  const fullLoadedRef = useRef<Set<number>>(new Set());

  // Track in-flight textures so they can be disposed on effect teardown
  const inFlightRef = useRef<Set<THREE.Texture>>(new Set());

  // Strict Mode safety: track whether the component instance is mounted.
  // Prevents the first unmount cleanup from disposing textures that the
  // re-mounted instance is already referencing.
  const mountedRef = useRef(false);

  // Track activeIndex via ref so Phase 2 effect can read the latest value
  // without re-triggering the entire sequential load chain.
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  // Track whether Phase 2 is currently running to avoid overlapping loads
  const phase2RunningRef = useRef(false);

  // Configure a texture with consistent filter settings
  const configureTexture = useCallback((texture: THREE.Texture) => {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
  }, []);

  // Phase 1: Load ALL thumbnail textures on mount
  useEffect(() => {
    mountedRef.current = true;
    const loader = loaderRef.current;
    let cancelled = false;
    let loadedCount = 0;

    // Pre-allocate texture slots with placeholder textures
    if (texturesRef.current.length !== sources.length) {
      // Dispose old placeholders before re-allocation to prevent orphaned GPU textures
      texturesRef.current.forEach(t => t.dispose());
      texturesRef.current = sources.map(() => {
        const t = new THREE.Texture();
        configureTexture(t);
        return t;
      });
    }

    sources.forEach((source, i) => {
      const thumbUrl = source.thumbSrc;
      loader.load(
        thumbUrl,
        (thumbTexture) => {
          // Track in-flight texture BEFORE cancelled check so cleanup can dispose it
          inFlightRef.current.add(thumbTexture);

          if (cancelled) {
            thumbTexture.dispose();
            inFlightRef.current.delete(thumbTexture);
            return;
          }

          configureTexture(thumbTexture);

          // Hot-swap the placeholder with actual thumbnail data
          const existing = texturesRef.current[i];
          if (existing) swapImage(existing, thumbTexture.image);

          // Dispose the intermediate texture -- .image data has been transferred
          thumbTexture.dispose();
          inFlightRef.current.delete(thumbTexture);

          loadedCount++;

          setLoadState((prev) => {
            const next = [...prev];
            // Only update if not already at a higher quality
            if (next[i] === 'loading') {
              next[i] = 'thumb';
            }
            return next;
          });

          if (loadedCount === sources.length) {
            setAllThumbsLoaded(true);
          }
        },
        undefined,
        (error) => {
          if (!cancelled) {
            console.warn(`Failed to load thumbnail ${source.thumbSrc}:`, error);
            // Still count as loaded so we don't block forever
            loadedCount++;
            if (loadedCount === sources.length) {
              setAllThumbsLoaded(true);
            }
          }
        }
      );
    });

    return () => {
      cancelled = true;
      // Only dispose in-flight textures, not the persistent ones in texturesRef.
      // Persistent textures are handled by the unmount cleanup below.
      inFlightRef.current.forEach(t => { t.dispose(); });
      inFlightRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources.length]);

  // Phase 2: Load full-resolution textures by proximity to active image.
  // Depends only on [allThumbsLoaded, sources.length] -- NOT activeIndex.
  // Reads activeIndexRef.current on each iteration so navigation does not
  // cancel/restart the sequential load; it just changes which indices are
  // prioritised next time a slot opens up.
  useEffect(() => {
    if (!allThumbsLoaded) return;

    const loader = loaderRef.current;
    const len = sources.length;
    if (len === 0) return;

    let cancelled = false;

    async function loadSequentially() {
      if (phase2RunningRef.current) return;
      phase2RunningRef.current = true;

      // Keep loading until all indices have full-res or cancelled
      while (!cancelled) {
        const currentActive = activeIndexRef.current;

        // Build priority list: active + adjacent first
        const priority = [
          currentActive,
          (currentActive + 1) % len,
          (currentActive - 1 + len) % len,
        ];

        // Then add remaining indices
        for (let i = 0; i < len; i++) {
          if (!priority.includes(i)) {
            priority.push(i);
          }
        }

        // Find next index that needs loading
        const nextIdx = priority.find(idx => !fullLoadedRef.current.has(idx));
        if (nextIdx === undefined) break; // All loaded

        await new Promise<void>((resolve) => {
          loader.load(
            sources[nextIdx].fullSrc,
            (fullTexture) => {
              // Track in-flight texture BEFORE cancelled check so cleanup can dispose it
              inFlightRef.current.add(fullTexture);

              if (cancelled) {
                fullTexture.dispose();
                inFlightRef.current.delete(fullTexture);
                resolve();
                return;
              }

              configureTexture(fullTexture);

              // Hot-swap: update existing texture's image data in-place
              const existing = texturesRef.current[nextIdx];
              if (existing) swapImage(existing, fullTexture.image);

              // Dispose the intermediate texture -- .image data has been transferred
              fullTexture.dispose();
              inFlightRef.current.delete(fullTexture);

              fullLoadedRef.current.add(nextIdx);

              setLoadState((prev) => {
                const next = [...prev];
                next[nextIdx] = 'full';
                return next;
              });

              resolve();
            },
            undefined,
            (error) => {
              if (!cancelled) {
                console.warn(
                  `Failed to load full-res ${sources[nextIdx].fullSrc}:`,
                  error
                );
              }
              // Mark as "loaded" to avoid infinite retry loop
              fullLoadedRef.current.add(nextIdx);
              resolve();
            }
          );
        });
      }

      phase2RunningRef.current = false;
    }

    loadSequentially();

    return () => {
      cancelled = true;
      inFlightRef.current.forEach(t => { t.dispose(); });
      inFlightRef.current.clear();
      phase2RunningRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allThumbsLoaded, sources.length]);

  // Cleanup: dispose all textures on unmount
  useEffect(() => {
    return () => {
      // Strict Mode guard: only dispose textures if we are still the mounted
      // instance. React 18 Strict Mode unmounts the first instance AFTER the
      // second has mounted, so mountedRef will have been set to true by the
      // re-mount's Phase 1 effect before this cleanup runs. We use a
      // microtask to check whether a new mount has already claimed ownership.
      const texturesToDispose = [...texturesRef.current];
      const currentInFlight = [...inFlightRef.current];

      // Defer disposal to let Strict Mode re-mount claim ownership first
      queueMicrotask(() => {
        // If mountedRef is still true, a new mount took over -- do NOT dispose
        if (mountedRef.current) return;

        texturesToDispose.forEach((texture) => {
          texture.dispose();
        });
        currentInFlight.forEach((t) => {
          t.dispose();
        });
      });

      // Signal that this instance is unmounting
      mountedRef.current = false;
      texturesRef.current = [];
      fullLoadedRef.current.clear();
      inFlightRef.current.clear();
    };
  }, []);

  return {
    textures: texturesRef.current,
    loadState,
    allThumbsLoaded,
  };
}
