'use client';

import { useRef, useState, type ReactNode } from 'react';
import type { ShaderMaterial } from 'three';
import SafeCanvas from '@/components/SafeCanvas';
import { tokens } from '@/data/generated/tokens';
import type { PinAnchor } from '@/lib/ascent/route';
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
 * CameraRig (the route: the plan view of the poster at p = 0, then up the
 * terrain to the summit look-back, 09-10). The decoded metres from TerrainMesh
 * are held here and handed to the rig with the waypoint anchors, so the route
 * and the anchors sit on the mesh; the live material reaches the rig through
 * a shared ref for the relief uniforms. The camera's near and far planes
 * bracket the plan-view altitudes (about 8 to 22 km) and the oblique route.
 * The clear colour is the stage ground, night-950, from the generated tokens.
 */
export default function TerrainCanvas({
  gridSize,
  pins,
  children,
}: {
  gridSize: 256 | 512;
  /** The waypoint anchors (number, label, approximate, UV), in ascent order. */
  pins: readonly PinAnchor[];
  children?: ReactNode;
}) {
  const [metres, setMetres] = useState<Float32Array | null>(null);
  const shaderRef = useRef<ShaderMaterial | null>(null);
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
      <TerrainMesh gridSize={gridSize} onMetres={setMetres} shaderRef={shaderRef} />
      <CameraRig pins={pins} metres={metres} gridSize={gridSize} shaderRef={shaderRef} />
      {children}
    </SafeCanvas>
  );
}
