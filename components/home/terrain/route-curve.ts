'use client';

import { CatmullRomCurve3, Vector3 } from 'three';
import { terrain } from '@/data/generated/terrain';
import { posterFrame } from '@/lib/ascent/poster-frame';
import {
  CAMERA_FOV_DEG,
  RELIEF_EXAGGERATION,
  keyPoses,
  planViewPose,
  type Vec3,
} from '@/lib/ascent/route';
import { meshHeightAtUv, uvToWorld } from '@/lib/terrain/heightmap';

/**
 * The camera route as curves (HOME-02, HOME-03; D-02; 09-RESEARCH Pattern 8).
 * Shared by CameraRig and the route-clearance e2e (routeCurvesFor), so the
 * test flies exactly the curve the camera flies.
 *
 * Positions and look targets each run along a centripetal Catmull-Rom curve
 * through the key poses of lib/ascent/route.ts (keyPoses): centripetal never
 * forms cusps or self-intersections between unevenly spaced stops, and the
 * plan view is much further from stage 1 than the stages are from each other.
 * CatmullRomCurve3.getPoint takes the curve parameter directly (not arc
 * length), so key pose k sits exactly at t = k / (n + 1), as curveParamAt
 * assumes.
 */

export type RouteCurves = { position: CatmullRomCurve3; target: CatmullRomCurve3 };

const toVector = (p: Vec3) => new Vector3(p.x, p.y, p.z);
const W = terrain.extent.widthM;

/**
 * A ground point on the n x n mesh at extent UV (u, v), at relief `relief`
 * with RELIEF_EXAGGERATION applied: the rendered surface (meshHeightAtUv on
 * the decoded metres), not the DEM height (Pitfall 2, correction C5).
 */
export function anchorAt(
  metres: ArrayLike<number>,
  n: number,
  u: number,
  v: number,
  relief: number
): Vec3 {
  const { x, z } = uvToWorld(u, v, W);
  return { x, y: meshHeightAtUv(metres, n, u, v) * relief * RELIEF_EXAGGERATION, z };
}

/**
 * The route curves for a `width` x `height` px stage: the plan view of
 * posterFrame(width, height), then keyPoses over the waypoint anchors and the
 * summit, all at relief 1 on the decoded mesh.
 */
export function routeCurvesFor({
  width,
  height,
  anchors,
  metres,
  gridSize,
}: {
  width: number;
  height: number;
  /** Waypoint UVs, in ascent order. */
  anchors: readonly { u: number; v: number }[];
  metres: ArrayLike<number>;
  gridSize: number;
}): RouteCurves {
  const planView = planViewPose(posterFrame(width, height), W, CAMERA_FOV_DEG);
  const ground = anchors.map((a) => anchorAt(metres, gridSize, a.u, a.v, 1));
  const { u, v } = terrain.summit.uv;
  const summit = anchorAt(metres, gridSize, u, v, 1);
  return buildRouteCurves(keyPoses({ anchors: ground, summit, planView }));
}

/** Builds the position and target curves through the key poses. */
export function buildRouteCurves(poses: {
  positions: readonly Vec3[];
  targets: readonly Vec3[];
}): RouteCurves {
  return {
    position: new CatmullRomCurve3(poses.positions.map(toVector), false, 'centripetal'),
    target: new CatmullRomCurve3(poses.targets.map(toVector), false, 'centripetal'),
  };
}

/**
 * The camera position and look target at curve parameter t (0 to 1). Pass
 * `out` to reuse vectors in a frame loop instead of allocating.
 */
export function poseAt(
  curves: RouteCurves,
  t: number,
  out: { position: Vector3; target: Vector3 } = { position: new Vector3(), target: new Vector3() }
): { position: Vector3; target: Vector3 } {
  curves.position.getPoint(t, out.position);
  curves.target.getPoint(t, out.target);
  return out;
}
