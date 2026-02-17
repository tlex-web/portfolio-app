'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Side-effect hook that manages hex grid row offset logic.
 *
 * On mount and resize, calculates items per row from the container width
 * and the `--hex-size` CSS variable (fallback 340px). Adds the `hex-offset`
 * class to children in even rows (0-indexed) for honeycomb stagger.
 *
 * On mobile (container width < 768px), removes all `hex-offset` classes
 * (single column, no stagger).
 */
export function useHexGrid(
  containerRef: RefObject<HTMLElement | null>,
  itemCount: number
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || itemCount === 0) return;

    function updateOffsets() {
      const el = containerRef.current;
      if (!el) return;

      const containerWidth = el.clientWidth;
      const children = Array.from(el.children) as HTMLElement[];

      // Mobile: single column, no stagger
      if (containerWidth < 768) {
        children.forEach((child) => child.classList.remove('hex-offset'));
        return;
      }

      // Read --hex-size from CSS (fallback 340px)
      const hexSizeRaw = getComputedStyle(el).getPropertyValue('--hex-size').trim();
      const hexSize = hexSizeRaw ? parseFloat(hexSizeRaw) || 340 : 340;

      // Read --hex-gap for accurate items-per-row calculation
      const hexGapRaw = getComputedStyle(el).getPropertyValue('--hex-gap').trim();
      const hexGap = hexGapRaw ? parseFloat(hexGapRaw) || 12 : 12;

      // Account for the padding on the hex-grid container
      const availableWidth = containerWidth;
      const itemsPerRow = Math.max(1, Math.floor((availableWidth + hexGap) / (hexSize + hexGap)));

      children.forEach((child, index) => {
        const row = Math.floor(index / itemsPerRow);
        if (row % 2 === 1) {
          child.classList.add('hex-offset');
        } else {
          child.classList.remove('hex-offset');
        }
      });
    }

    updateOffsets();

    const observer = new ResizeObserver(() => {
      updateOffsets();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      // Clean up classes on unmount
      const el = containerRef.current;
      if (el) {
        Array.from(el.children).forEach((child) =>
          child.classList.remove('hex-offset')
        );
      }
    };
  }, [containerRef, itemCount]);
}
