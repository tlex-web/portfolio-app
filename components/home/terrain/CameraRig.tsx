'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useMotionValueEvent } from 'motion/react';
import type { PerspectiveCamera } from 'three';
import { useAscent } from '@/components/home/AscentController';
import { terrain } from '@/data/generated/terrain';
import { posterFrame } from '@/lib/ascent/poster-frame';
import { uvToWorld } from '@/lib/terrain/heightmap';

/**
 * The terrain camera (HOME-02, HOME-03; D-06, D-16; 09-RESEARCH Patterns 5 and
 * 8; 09-UI-SPEC "Poster frame function").
 *
 * The pose is the plan view of the poster: the camera looks straight down at
 * the centre of posterFrame(width, height), from the height at which the
 * vertical field of view spans exactly the poster's visible v range. The plane
 * is flat at p = 0 (uRelief 0), so this perspective view equals the poster's
 * orthographic one and the canvas fades in with no jump. `up` is set to
 * (0, 0, -1), north, before lookAt: a straight-down lookAt with the default up
 * is degenerate and rolls the view. 09-10 replaces the pose with the route.
 *
 * Demand frameloop: every change of the one progress spring invalidates a
 * frame, and useFrame (priority 0, never positive: a positive priority takes
 * over rendering) keeps invalidating while the progress moved since the last
 * applied frame by more than EPS (the D-06 rule), then stops.
 */

/** Progress change below which no further frame is needed (D-06). */
const EPS = 1e-4;
const W = terrain.extent.widthM;

/** Puts `camera` in the poster's plan view for a stage of `width` x `height` px. */
function planView(camera: PerspectiveCamera, width: number, height: number) {
  if (!(width > 0 && height > 0)) return;
  const frame = posterFrame(width, height);
  const centre = uvToWorld((frame.uMin + frame.uMax) / 2, (frame.vMin + frame.vMax) / 2, W);
  const vSpanM = (frame.vMax - frame.vMin) * W;
  const altitude = vSpanM / 2 / Math.tan((camera.fov * Math.PI) / 360);
  camera.position.set(centre.x, altitude, centre.z);
  camera.up.set(0, 0, -1);
  camera.lookAt(centre.x, 0, centre.z);
  camera.updateProjectionMatrix();
}

export default function CameraRig() {
  const { progress } = useAscent();
  const invalidate = useThree((s) => s.invalidate);
  const applied = useRef(Number.NaN);

  useMotionValueEvent(progress, 'change', () => invalidate());

  useFrame((state) => {
    const p = progress.get();
    planView(state.camera as PerspectiveCamera, state.size.width, state.size.height);
    const moved = !(Math.abs(p - applied.current) <= EPS);
    applied.current = p;
    if (moved) state.invalidate();
  });

  return null;
}
