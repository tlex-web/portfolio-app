'use client';

import type { ReactNode } from 'react';
import SafeCanvas from '@/components/SafeCanvas';

/**
 * The entry of the lazy canvas chunk (HOME-08, D-19; 09-UI-SPEC "Canvas",
 * "Canvas reveal"; 09-RESEARCH Pattern 5). Only TerrainStage imports it, with
 * next/dynamic and `ssr: false`, so three and R3F never reach the server graph
 * or the first-load bundle.
 *
 * The canvas renders through SafeCanvas (Phase 7 rule) with a demand frameloop
 * (a frame only when the camera spring moves), dpr [1, 1.5], `resize.scroll`
 * off (R3F would otherwise re-measure on every page scroll), a flat opaque
 * context and no pointer events, so native scroll is never intercepted.
 *
 * It starts at opacity 0 and stays there while the stage reads 'eligible': the
 * poster underneath is the visible terrain (the D-19 "3D not ready yet" state).
 * The terrain mesh (children, 09-08) calls useAscent().markRevealed() after its
 * first drawn frame; the stage then reads '3d' and the canvas fades in over
 * --duration-settle with ease-geological. The canvas exists only when motion is
 * allowed, so the fade needs no reduced-motion variant.
 *
 * `inset: 0` and `position: absolute` are inline because R3F writes
 * `position: relative` inline on its wrapper, which beats the class.
 */
export default function TerrainCanvas({
  gridSize,
  children,
}: {
  gridSize: 256 | 512;
  children?: ReactNode;
}) {
  return (
    <SafeCanvas
      data-grid-size={gridSize}
      frameloop="demand"
      dpr={[1, 1.5]}
      resize={{ scroll: false }}
      flat
      gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
      aria-hidden
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      className="absolute inset-0 opacity-0 transition-opacity duration-(--duration-settle) ease-geological group-data-[ascent-mode=3d]/stage:opacity-100"
    >
      {children}
    </SafeCanvas>
  );
}
