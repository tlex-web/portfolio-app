'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useAscent } from '@/components/home/AscentController';
import { terrain } from '@/data/generated/terrain';

/**
 * The render-gated lazy canvas (HOME-08, D-19; 09-RESEARCH Pattern 3;
 * 09-UI-SPEC "Canvas load").
 *
 * The canvas chunk (three, R3F, the mesh) is a `next/dynamic` import with SSR
 * off, declared here in a Client Component (it only works there). Then Next
 * never emits a preload for it, so the chunk request starts only when
 * <TerrainCanvas> first renders, and that happens only when the capability
 * gate says 'eligible' AND the stage is armed: by requestIdleCallback (timeout
 * 4000 ms; a 2000 ms setTimeout where it is missing) or the first passive
 * scroll, whichever comes first. Static devices never fetch it.
 *
 * No loading component, spinner or skeleton: the poster underneath is complete
 * and stays the visible terrain until the canvas reveals itself.
 *
 * The mesh size is fixed at arm time from the stage width: the 256² heightmap
 * below 768 px, else 512² (D-18: capable phones still get 3D).
 */

const TerrainCanvas = dynamic(() => import('./terrain/TerrainCanvas'), { ssr: false });

/** Stages narrower than this use the mobile mesh. */
const MOBILE_STAGE_PX = 768;

type GridSize = 256 | 512;

export default function TerrainStage() {
  const { mode, stageRef } = useAscent();
  const eligible = mode === 'eligible';
  const [gridSize, setGridSize] = useState<GridSize | null>(null);

  useEffect(() => {
    if (!eligible || gridSize !== null) return;
    const hasIdle = typeof window.requestIdleCallback === 'function';
    let idle = 0;
    const disarm = () => {
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      window.removeEventListener('scroll', arm);
    };
    // Whichever trigger fires first arms the stage and cancels the other.
    function arm() {
      disarm();
      const width = stageRef.current?.getBoundingClientRect().width ?? window.innerWidth;
      setGridSize(width < MOBILE_STAGE_PX ? terrain.grids.mobile : terrain.grids.desktop);
    }
    idle = hasIdle
      ? window.requestIdleCallback(arm, { timeout: 4000 })
      : window.setTimeout(arm, 2000);
    window.addEventListener('scroll', arm, { once: true, passive: true });
    return disarm;
  }, [eligible, gridSize, stageRef]);

  if (!eligible || gridSize === null) return null;
  return <TerrainCanvas gridSize={gridSize} />;
}
