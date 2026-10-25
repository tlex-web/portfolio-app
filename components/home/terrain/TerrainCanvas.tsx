'use client';

import type { ReactNode } from 'react';
import SafeCanvas from '@/components/SafeCanvas';
import { tokens } from '@/data/generated/tokens';
import { downgradeAscent } from '@/lib/useAscentMode';
import CameraRig from './CameraRig';
import TerrainMesh from './TerrainMesh';

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
 * TerrainMesh (09-08) calls useAscent().markRevealed() after its first drawn
 * frame; the stage then reads '3d' and the canvas fades in over
 * --duration-settle with ease-geological. The canvas exists only when motion is
 * allowed, so the fade needs no reduced-motion variant.
 *
 * A canvas that throws (no context after all, a failed mesh load) is caught by
 * SafeCanvas, whose onCanvasError downgrades Home to static for the rest of the
 * page view: the canvas unmounts and the poster stays (D-18, D-21).
 *
 * `inset: 0` and `position: absolute` are inline because R3F writes
 * `position: relative` inline on its wrapper, which beats the class.
 *
 * The scene: TerrainMesh (the heightmap mesh with the poster-parity shader) and
 * CameraRig (the plan view of the poster at p = 0). The camera's near and far
 * planes bracket the plan-view altitudes (about 8 to 22 km) and the later
 * oblique route. The clear colour is the stage ground, night-950, from the
 * generated tokens; `children` stays open for the 3D pins (09-10).
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
      onCanvasError={() => downgradeAscent('load-error')}
      frameloop="demand"
      camera={{ fov: 40, near: 10, far: 100000 }}
      onCreated={({ gl }) => gl.setClearColor(tokens.hex.night950)}
      dpr={[1, 1.5]}
      resize={{ scroll: false }}
      flat
      gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
      aria-hidden
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      className="absolute inset-0 opacity-0 transition-opacity duration-(--duration-settle) ease-geological group-data-[ascent-mode=3d]/stage:opacity-100"
    >
      <TerrainMesh gridSize={gridSize} />
      <CameraRig />
      {children}
    </SafeCanvas>
  );
}
