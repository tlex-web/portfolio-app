'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import type { ShaderMaterial } from 'three';
import SafeCanvas from '@/components/SafeCanvas';
import { tokens } from '@/data/generated/tokens';
import type { PinAnchor } from '@/lib/ascent/route';
import { downgradeAscent } from '@/lib/useAscentMode';
import CameraRig from './CameraRig';
import ContextLossGuard from './ContextLossGuard';
import PinLayer3D from './PinLayer3D';
import TerrainMesh from './TerrainMesh';

/**
 * The entry of the lazy canvas chunk (HOME-08, D-19; 09-UI-SPEC "Canvas",
 * "Canvas reveal"; 09-RESEARCH Pattern 5). Only TerrainStage imports it, with
 * next/dynamic and `ssr: false`, so three and R3F never reach the server graph
 * or the first-load bundle.
 *
 * The canvas renders through SafeCanvas (Phase 7 rule) with a demand frameloop
 * (a frame only when the camera spring moves), dpr [1, 1.5] (1 once the frame
 * budget stepped it down, see below), `resize.scroll`
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
 * session (until a full reload, lib/useAscentMode.ts): the canvas unmounts and
 * the poster stays (D-18, D-21). A lost
 * WebGL context does the same through ContextLossGuard (09-11), which ignores
 * the loss R3F inflicts on its own canvas when it unmounts.
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
 *
 * PinLayer3D (the 3D pins, D-09) is a DOM sibling of the canvas, not a scene
 * child: the rig projects the anchors and moves the marks through `pinsRef`.
 * It mounts and unmounts with the canvas, so a downgrade removes both and the
 * poster pins show again in the same frame.
 *
 * Pixel ratio (09-11, D-18): CameraRig's frame budget may drop the ratio to 1
 * (R3F setDpr). R3F re-applies the `dpr` prop on every Canvas render (a stage
 * resize, the metres arriving), which would restore 1.5, so the prop is state
 * here and the rig's onDprStepDown sets it to 1. The step-down lasts the
 * session: `dprSteppedDown` is module state, so a remount (reduced motion off
 * again) or a later visit to Home after client-side navigation starts at 1,
 * until a full reload (IN-05, Tim: "Keep sticky, document").
 */

/** The frame budget stepped the pixel ratio down once in this session (module state: until a full reload). */
let dprSteppedDown = false;

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
  const pinsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [dpr, setDpr] = useState<number | [number, number]>(() => (dprSteppedDown ? 1 : [1, 1.5]));
  const stepDown = useCallback(() => {
    dprSteppedDown = true;
    setDpr(1);
  }, []);
  return (
    <>
      <SafeCanvas
        data-grid-size={gridSize}
        onCanvasError={() => downgradeAscent('load-error')}
        frameloop="demand"
        camera={{ fov: 40, near: 10, far: 100000 }}
        onCreated={({ gl }) => gl.setClearColor(tokens.hex.night950)}
        dpr={dpr}
        resize={{ scroll: false }}
        flat
        gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
        aria-hidden
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        className="absolute inset-0 opacity-0 transition-opacity duration-(--duration-settle) ease-geological group-data-[ascent-mode=3d]/stage:opacity-100"
      >
        <ContextLossGuard />
        <TerrainMesh gridSize={gridSize} onMetres={setMetres} shaderRef={shaderRef} />
        <CameraRig
          pins={pins}
          metres={metres}
          gridSize={gridSize}
          shaderRef={shaderRef}
          pinsRef={pinsRef}
          onDprStepDown={stepDown}
        />
        {children}
      </SafeCanvas>
      <PinLayer3D pins={pins} pinsRef={pinsRef} />
    </>
  );
}
