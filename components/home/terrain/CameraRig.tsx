'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useMotionValueEvent } from 'motion/react';
import { Vector3, type PerspectiveCamera, type ShaderMaterial } from 'three';
import { useAscent } from '@/components/home/AscentController';
import { terrain } from '@/data/generated/terrain';
import { posterFrame } from '@/lib/ascent/poster-frame';
import {
  CAMERA_FOV_DEG,
  RELIEF_EXAGGERATION,
  SUMMIT_HFOV_DEG,
  curveParamAt,
  fovAt,
  keyPoses,
  planViewPose,
  reliefAt,
  summitVerticalFov,
  viewOffsetAt,
  type PinAnchor,
  type Pose,
  type Vec3,
} from '@/lib/ascent/route';
import { meshHeightAtUv, uvToWorld } from '@/lib/terrain/heightmap';
import { buildRouteCurves, poseAt } from './route-curve';

/**
 * The terrain camera (HOME-02, HOME-03; D-02, D-03, D-06, D-16, D-20;
 * 09-RESEARCH Patterns 5 and 8; 09-UI-SPEC "Ascent Mapping").
 *
 * Each frame: p = progress.get() (the one damped value), t = curveParamAt(p,
 * arrivals), and the camera takes poseAt(curves, t): position on the route
 * curve, looking at the target curve. The curves run through lib/ascent/route
 * keyPoses: the poster's plan view at p = 0, one stage per waypoint and the
 * summit look-back. They are rebuilt when the stage size changes (the plan
 * view follows posterFrame) or the decoded metres arrive (anchors sit at the
 * mesh height, meshHeightAtUv, not the DEM value: Pitfall 2).
 *
 * The tilt-in (D-16) shares one fraction, reliefAt(p, p_1): uRelief eases from
 * 0 to 1 (with uExaggeration = RELIEF_EXAGGERATION), `up` turns from north
 * (0, 0, -1), which a straight-down view needs, to (0, 1, 0), and below 768 px
 * the view offset (D-20) ramps in. All three are 0 at p = 0, so the canvas
 * still equals the poster there, and complete at the start of waypoint 1's
 * plateau. The vertical FOV widens across the last leg to summitVerticalFov
 * (aspect, 60°), so the summit frame shows every waypoint on a phone too (D-03).
 *
 * Until the metres arrive (the canvas is still invisible) or the layout is
 * measured, the camera holds the plan view.
 *
 * Demand frameloop: every change of the progress spring invalidates a frame,
 * and useFrame (priority 0, never positive: a positive priority takes over
 * rendering) keeps invalidating while the progress moved since the last
 * applied frame by more than EPS (the D-06 rule), then stops.
 */

/** Progress change below which no further frame is needed (D-06). */
const EPS = 1e-4;
/** Stages narrower than this dock the card over the lower part (D-20) and get the view offset. */
const NARROW_STAGE_PX = 768;
const W = terrain.extent.widthM;

/** A ground point on the mesh at extent UV (u, v), at relief `relief` (exaggeration applied). */
function anchorAt(metres: Float32Array, n: number, u: number, v: number, relief: number): Vec3 {
  const { x, z } = uvToWorld(u, v, W);
  return { x, y: meshHeightAtUv(metres, n, u, v) * relief * RELIEF_EXAGGERATION, z };
}

// Scratch objects for the frame loop (one canvas per page).
const scratch = { position: new Vector3(), target: new Vector3() };
const up = new Vector3();

/** Puts `camera` in `pose` with the given vertical FOV and no view offset. */
function applyPose(camera: PerspectiveCamera, pose: Pose) {
  camera.position.set(pose.position.x, pose.position.y, pose.position.z);
  camera.up.set(pose.up.x, pose.up.y, pose.up.z);
  camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
  camera.fov = CAMERA_FOV_DEG;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

export default function CameraRig({
  pins,
  metres,
  gridSize,
  shaderRef,
}: {
  /** The waypoint anchors, in ascent order. */
  pins: readonly PinAnchor[];
  /** The decoded mesh heights (gridSize² values), or null before they arrive. */
  metres: Float32Array | null;
  gridSize: 256 | 512;
  /** The live terrain material, for uRelief and uExaggeration. */
  shaderRef: RefObject<ShaderMaterial | null>;
}) {
  const { progress, layout } = useAscent();
  const invalidate = useThree((s) => s.invalidate);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const applied = useRef(Number.NaN);

  const curves = useMemo(() => {
    if (!metres || !(width > 0 && height > 0)) return null;
    const planView = planViewPose(posterFrame(width, height), W, CAMERA_FOV_DEG);
    const anchors = pins.map((pin) => anchorAt(metres, gridSize, pin.u, pin.v, 1));
    const { u, v } = terrain.summit.uv;
    const summit = anchorAt(metres, gridSize, u, v, 1);
    return buildRouteCurves(keyPoses({ anchors, summit, planView }));
  }, [metres, gridSize, pins, width, height]);

  useEffect(() => invalidate(), [curves, invalidate]);
  useMotionValueEvent(progress, 'change', () => invalidate());

  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera;
    const { width: w, height: h } = state.size;
    if (!(w > 0 && h > 0)) return;
    const p = progress.get();
    const arrivals = layout.current?.arrivals;
    const material = shaderRef.current;

    if (!curves || !arrivals) {
      applyPose(camera, planViewPose(posterFrame(w, h), W, CAMERA_FOV_DEG));
      if (material) material.uniforms.uRelief.value = 0;
    } else {
      const first = arrivals[0];
      const t = curveParamAt(p, arrivals);
      const tilt = reliefAt(p, first);
      poseAt(curves, t, scratch);
      camera.position.copy(scratch.position);
      camera.up.copy(up.set(0, tilt, -(1 - tilt)).normalize());
      camera.lookAt(scratch.target);
      camera.fov = fovAt(t, pins.length, summitVerticalFov(w / h, SUMMIT_HFOV_DEG));
      if (w < NARROW_STAGE_PX) {
        camera.setViewOffset(w, h, 0, viewOffsetAt(p, first, true, h), w, h);
      } else {
        camera.clearViewOffset();
      }
      camera.updateProjectionMatrix();
      if (material) {
        material.uniforms.uRelief.value = tilt;
        material.uniforms.uExaggeration.value = RELIEF_EXAGGERATION;
      }
    }
    camera.updateMatrixWorld();

    const moved = !(Math.abs(p - applied.current) <= EPS);
    applied.current = p;
    if (moved) state.invalidate();
  });

  return null;
}
