'use client';

import { useEffect, type RefObject } from 'react';
import {
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from 'framer-motion';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * Scroll-linked glow intensity hook.
 *
 * Writes a `--glow-intensity` CSS custom property (range 0.15 to 1.0) based on
 * the window scroll position. Elements near the top of the page (close to the 3D
 * hero scene) glow brighter; the intensity fades as the user scrolls into pure 2D
 * content sections.
 *
 * When `prefers-reduced-motion` is active, glow is set to a static muted value (0.3).
 *
 * @param containerRef - Optional ref to the element that receives the CSS variable.
 *   Defaults to `document.documentElement` when omitted.
 * @returns The `glowIntensity` motion value for direct consumption by components.
 */
export function useGlowIntensity(
  containerRef?: RefObject<HTMLElement | null>
): MotionValue<number> {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const glowIntensity = useTransform(scrollY, [0, 800], [1.0, 0.15]);

  useMotionValueEvent(glowIntensity, 'change', (latest) => {
    if (prefersReducedMotion) return;
    const target = containerRef?.current ?? document.documentElement;
    target.style.setProperty('--glow-intensity', String(latest));
  });

  // Handle reduced motion: set static value
  useEffect(() => {
    if (prefersReducedMotion) {
      const target = containerRef?.current ?? document.documentElement;
      target.style.setProperty('--glow-intensity', '0.3');
    }
  }, [prefersReducedMotion, containerRef]);

  // Cleanup: reset CSS variable on unmount
  useEffect(() => {
    return () => {
      const target = containerRef?.current ?? document.documentElement;
      target.style.removeProperty('--glow-intensity');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return glowIntensity;
}
