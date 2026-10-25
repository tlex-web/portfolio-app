import { CatmullRomCurve3, Vector3 } from 'three';
import type { Vec3 } from '@/lib/ascent/route';

/**
 * The camera route as curves (HOME-02, HOME-03; D-02; 09-RESEARCH Pattern 8).
 * Shared by CameraRig and the route-clearance e2e, so the test flies exactly
 * the curve the camera flies.
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

/** Builds the position and target curves through the key poses. */
export function buildRouteCurves(poses: { positions: readonly Vec3[]; targets: readonly Vec3[] }): RouteCurves {
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
