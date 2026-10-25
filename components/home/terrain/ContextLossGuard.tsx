'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { downgradeAscent } from '@/lib/useAscentMode';

/**
 * Lost WebGL context -> the static poster for the rest of the page view
 * (HOME-02; D-18, D-21; 09-RESEARCH Pattern 9, Pitfall 5; 09-UI-SPEC "Modes").
 *
 * Rendered inside the R3F tree, so it sees the canvas's own renderer. A
 * `webglcontextlost` event on `gl.domElement` (the GPU reset the context, the
 * browser reclaimed it under memory pressure, a driver crash) calls
 * downgradeAscent('context-lost'): the stage reads 'static', TerrainStage
 * unmounts the canvas at once (no fade), and the poster with its pins is the
 * terrain again. No retry and no error UI: `webglcontextrestored` is ignored by
 * design, and three already calls preventDefault() in its own listener.
 *
 * The teardown guard: R3F's unmount calls gl.forceContextLoss(), which fires
 * the same event. R3F runs the effect cleanups of its tree before it disposes
 * the renderer, so the cleanup sets `disposing` first and then removes the
 * listener; a loss the canvas inflicts on itself (React StrictMode's
 * mount-unmount-mount, reduced motion turned on, leaving the page) never marks
 * a capable device static.
 */
export default function ContextLossGuard() {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    let disposing = false;
    const onLost = () => {
      if (!disposing) downgradeAscent('context-lost');
    };
    canvas.addEventListener('webglcontextlost', onLost);
    return () => {
      disposing = true;
      canvas.removeEventListener('webglcontextlost', onLost);
    };
  }, [gl]);

  return null;
}
