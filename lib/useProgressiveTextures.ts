'use client';

import { useEffect, useRef, useState } from 'react';
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

/** An empty texture with the filter settings every carousel texture shares. */
function makeSlot(): THREE.Texture {
  const texture = new THREE.Texture();
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Indices by proximity: active, next, previous, then the rest in index order. */
function proximityOrder(active: number, length: number): number[] {
  const order = [active, (active + 1) % length, (active - 1 + length) % length];
  for (let i = 0; i < length; i++) {
    if (!order.includes(i)) order.push(i);
  }
  return order;
}

/**
 * Progressive texture loading hook for Three.js scenes.
 *
 * Each source names its two URLs (10-07: the carousel passes the manifest
 * 640 and 1024 WebP derivatives).
 *
 * Phase 1: every thumbnail loads in parallel. Once all have settled (a failed
 * one still counts, so nothing blocks), `textures` holds one texture per
 * source and `allThumbsLoaded` turns true. Before that `textures` is empty.
 * Phase 2: full-size images load one at a time by proximity to the active
 * index -- active, next, previous, then the rest. The order is re-read before
 * each load, so navigation re-prioritises without restarting the chain.
 *
 * Images are swapped into the same Texture objects (texture.image +
 * needsUpdate), so the scene's materials never remount.
 *
 * React Compiler rules (07-02, VERIFY-01): render reads only state. The
 * texture list lives in state, set from the loader callback; the latest
 * sources and active index reach the async chain through refs written in an
 * effect. One effect run per source list (keyed on `sourcesKey`, the joined
 * URLs; 12-31 IN-03) owns its loader, its textures and its `cancelled` flag:
 * its cleanup disposes everything it created, and any load that settles
 * afterwards is disposed and ignored. That makes unmount, a source-list change
 * (at any count) and the Strict Mode double run behave the same way.
 */
export function useProgressiveTextures(
  sources: readonly ProgressiveTextureSource[],
  activeIndex: number
): UseProgressiveTexturesResult {
  const count = sources.length;
  // The list's identity is its URLs, not the array (12-31 IN-03): a new array
  // holding the same URLs keeps its textures, and different URLs at the same
  // count start over.
  const sourcesKey = sources.map((s) => `${s.thumbSrc}\n${s.fullSrc}`).join('\n');
  const [textures, setTextures] = useState<THREE.Texture[]>([]);
  const [loadState, setLoadState] = useState<LoadState[]>(() => sources.map(() => 'loading'));
  const [allThumbsLoaded, setAllThumbsLoaded] = useState(false);

  // A different source list starts over. Adjusting state while rendering
  // (React's documented pattern) drops the old list in the same render, so a
  // consumer never sees textures the effect cleanup disposes.
  const [trackedKey, setTrackedKey] = useState(sourcesKey);
  if (trackedKey !== sourcesKey) {
    setTrackedKey(sourcesKey);
    setTextures([]);
    setAllThumbsLoaded(false);
    setLoadState(Array.from({ length: count }, (): LoadState => 'loading'));
  }

  // Latest props for the async loader chain, written after commit. Declared
  // before the loader effect so a new list is in place when it re-runs.
  const sourcesRef = useRef(sources);
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    sourcesRef.current = sources;
    activeIndexRef.current = activeIndex;
  }, [sources, activeIndex]);

  useEffect(() => {
    if (count === 0) return;

    const list = sourcesRef.current;
    const loader = new THREE.TextureLoader();
    const slots = list.map(() => makeSlot());
    let cancelled = false;
    let thumbsSettled = 0;

    async function loadFullSizes() {
      const settled = new Set<number>();
      while (!cancelled) {
        const next = proximityOrder(activeIndexRef.current, count).find((i) => !settled.has(i));
        if (next === undefined) return;

        await new Promise<void>((resolve) => {
          loader.load(
            list[next].fullSrc,
            (full) => {
              if (cancelled) {
                full.dispose();
                resolve();
                return;
              }
              swapImage(slots[next], full.image);
              // The loader's texture only carried the image.
              full.dispose();
              settled.add(next);
              setLoadState((prev) => {
                const state = [...prev];
                state[next] = 'full';
                return state;
              });
              resolve();
            },
            undefined,
            (error) => {
              if (!cancelled) console.warn(`Failed to load full-res ${list[next].fullSrc}:`, error);
              // Settled either way, so a missing file is not retried forever.
              settled.add(next);
              resolve();
            }
          );
        });
      }
    }

    function thumbSettled() {
      thumbsSettled += 1;
      if (thumbsSettled !== count) return;
      setTextures(slots);
      setAllThumbsLoaded(true);
      void loadFullSizes();
    }

    list.forEach((source, i) => {
      loader.load(
        source.thumbSrc,
        (thumb) => {
          if (cancelled) {
            thumb.dispose();
            return;
          }
          swapImage(slots[i], thumb.image);
          thumb.dispose();
          setLoadState((prev) => {
            // Never downgrade a slot that already has its full-size image.
            if (prev[i] !== 'loading') return prev;
            const state = [...prev];
            state[i] = 'thumb';
            return state;
          });
          thumbSettled();
        },
        undefined,
        (error) => {
          if (cancelled) return;
          console.warn(`Failed to load thumbnail ${source.thumbSrc}:`, error);
          thumbSettled();
        }
      );
    });

    return () => {
      cancelled = true;
      slots.forEach((texture) => texture.dispose());
    };
  }, [sourcesKey, count]);

  return { textures, loadState, allThumbsLoaded };
}
