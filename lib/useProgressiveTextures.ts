'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { LandscapeImage } from '@/data/types';

type LoadState = 'loading' | 'thumb' | 'full';

interface UseProgressiveTexturesResult {
  textures: THREE.Texture[];
  loadState: LoadState[];
  allThumbsLoaded: boolean;
}

/**
 * Progressive texture loading hook for Three.js scenes.
 *
 * Phase 1 (mount): Loads all thumbnail textures in parallel (~13-29KB each).
 * Phase 2 (activeIndex change): Loads full-resolution textures sequentially by
 * proximity -- active image first, then adjacent, then remaining.
 *
 * Uses in-place hot-swap (texture.image + needsUpdate) so the GPU texture
 * updates without remounting React components.
 */
export function useProgressiveTextures(
  images: LandscapeImage[],
  activeIndex: number
): UseProgressiveTexturesResult {
  const texturesRef = useRef<THREE.Texture[]>([]);
  const loaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());
  const [loadState, setLoadState] = useState<LoadState[]>(() =>
    images.map(() => 'loading')
  );
  const [allThumbsLoaded, setAllThumbsLoaded] = useState(false);

  // Track which indices already have full-res loaded to avoid re-loading
  const fullLoadedRef = useRef<Set<number>>(new Set());

  // Configure a texture with consistent filter settings
  const configureTexture = useCallback((texture: THREE.Texture) => {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
  }, []);

  // Phase 1: Load ALL thumbnail textures on mount
  useEffect(() => {
    const loader = loaderRef.current;
    let cancelled = false;
    let loadedCount = 0;

    // Pre-allocate texture slots with placeholder textures
    if (texturesRef.current.length !== images.length) {
      texturesRef.current = images.map(() => {
        const t = new THREE.Texture();
        configureTexture(t);
        return t;
      });
    }

    images.forEach((img, i) => {
      const thumbUrl = img.thumbnailSrc || img.src;
      loader.load(
        thumbUrl,
        (thumbTexture) => {
          if (cancelled) {
            thumbTexture.dispose();
            return;
          }

          configureTexture(thumbTexture);

          // Hot-swap the placeholder with actual thumbnail data
          const existing = texturesRef.current[i];
          if (existing) {
            existing.image = thumbTexture.image;
            existing.needsUpdate = true;
          }

          loadedCount++;

          setLoadState((prev) => {
            const next = [...prev];
            // Only update if not already at a higher quality
            if (next[i] === 'loading') {
              next[i] = 'thumb';
            }
            return next;
          });

          if (loadedCount === images.length) {
            setAllThumbsLoaded(true);
          }
        },
        undefined,
        (error) => {
          if (!cancelled) {
            console.warn(`Failed to load thumbnail for ${img.id}:`, error);
            // Still count as loaded so we don't block forever
            loadedCount++;
            if (loadedCount === images.length) {
              setAllThumbsLoaded(true);
            }
          }
        }
      );
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  // Phase 2: Load full-resolution textures by proximity to active image
  useEffect(() => {
    const loader = loaderRef.current;
    const len = images.length;
    if (len === 0) return;

    // Build priority order: active, active+1, active-1, then remaining
    const priority = [
      activeIndex,
      (activeIndex + 1) % len,
      (activeIndex - 1 + len) % len,
      ...Array.from({ length: len }, (_, i) => i).filter(
        (i) =>
          i !== activeIndex &&
          i !== (activeIndex + 1) % len &&
          i !== (activeIndex - 1 + len) % len
      ),
    ];

    let cancelled = false;

    async function loadSequentially() {
      for (const idx of priority) {
        if (cancelled) break;
        // Skip if already loaded at full resolution
        if (fullLoadedRef.current.has(idx)) continue;

        await new Promise<void>((resolve) => {
          loader.load(
            images[idx].src,
            (fullTexture) => {
              if (cancelled) {
                fullTexture.dispose();
                resolve();
                return;
              }

              configureTexture(fullTexture);

              // Hot-swap: update existing texture's image data in-place
              const existing = texturesRef.current[idx];
              if (existing) {
                existing.image = fullTexture.image;
                existing.needsUpdate = true;
              }

              fullLoadedRef.current.add(idx);

              setLoadState((prev) => {
                const next = [...prev];
                next[idx] = 'full';
                return next;
              });

              resolve();
            },
            undefined,
            (error) => {
              if (!cancelled) {
                console.warn(
                  `Failed to load full-res for ${images[idx].id}:`,
                  error
                );
              }
              resolve();
            }
          );
        });
      }
    }

    loadSequentially();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, images.length]);

  // Cleanup: dispose all textures on unmount
  useEffect(() => {
    return () => {
      texturesRef.current.forEach((texture) => {
        texture.dispose();
      });
      texturesRef.current = [];
      fullLoadedRef.current.clear();
    };
  }, []);

  return {
    textures: texturesRef.current,
    loadState,
    allThumbsLoaded,
  };
}
