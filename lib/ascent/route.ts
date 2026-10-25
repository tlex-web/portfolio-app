/**
 * The camera route of the Home ascent (HOME-02, HOME-03, HOME-05; D-01, D-02,
 * D-03, D-16, D-20; 09-RESEARCH Pattern 8; 09-UI-SPEC "Ascent Mapping").
 * Pure and import-free on purpose, like progress.ts and poster-frame.ts: the
 * camera rig in the lazy canvas chunk, the unit tests and the route-clearance
 * e2e all read these functions. Keep it to erasable TypeScript and never add
 * an import (three lives in components/home/terrain/route-curve.ts).
 *
 * World coordinates are the terrain mesh's: metres, origin at the extent
 * centre, x east, y up, z south (lib/terrain/heightmap.ts uvToWorld).
 *
 * The route has n + 2 key poses: the poster's plan view (p = 0), one stage per
 * waypoint and the summit look-back. The camera flies a centripetal
 * Catmull-Rom curve through the positions while it looks along a second curve
 * through the targets; curveParamAt maps the damped progress onto the curve
 * parameter, holding still on every ±PLATEAU plateau.
 *
 * Why the stages look back NE (a reading of D-02/D-03 forced by the other
 * limits): the summit frame looks NE at the waypoints (D-03), the camera may
 * turn at most 45° per leg (UI-SPEC motion sensitivity), and the active
 * waypoint must stay in view on a 412 px phone, where a 40° vertical FOV
 * leaves only about 20° horizontally. Facing the summit on the way up would
 * need a 170° turn at the top. So each stage camera sits on the summit side of
 * its waypoint, on the line from the summit through the waypoint, and looks
 * back down that line: the waypoint, its stage target and the camera are
 * aligned, so the waypoint is centred horizontally at every aspect, and the
 * look direction changes by only 4° to 17° per leg. The camera still climbs:
 * it starts 3.6 km out from the summit and closes in to 1.1 km before it
 * settles SW of and above the summit (D-02's rising path toward the summit).
 */

export type Vec3 = { x: number; y: number; z: number };

/** A camera pose: where it is, what it looks at, and which way is up. */
export type Pose = { position: Vec3; target: Vec3; up: Vec3 };

/** The visible UV window of the poster (a structural subset of poster-frame's PosterFrame). */
export type UvWindow = { uMin: number; uMax: number; vMin: number; vMax: number };

/**
 * One waypoint pin as the 3D layer needs it (serialisable, built on the server
 * from buildWaypoints): number, label (short place and DEM height), the dashed
 * approximate state and the extent UV of its ground point.
 */
export type PinAnchor = { k: number; label: string; approximate: boolean; u: number; v: number };

/** Vertical field of view of the route camera; also the poster plan view's. */
export const CAMERA_FOV_DEG = 40;

/** Height exaggeration of the relief (research default 1.0; Tim reviews 1.0 vs about 1.15 at 09-12). */
export const RELIEF_EXAGGERATION = 1;

/** How far SW of the summit the look-back camera settles, in metres (research range 300-600 m). */
export const SUMMIT_PULLBACK_M = 450;

/** Bearing (clockwise from north) of the summit pullback: SW, behind the summit as seen from Zermatt. */
export const SUMMIT_PULLBACK_BEARING_DEG = 225;

/** Height above the summit's mesh height of the look-back camera: clears the peak and looks over it. */
export const SUMMIT_LIFT_M = 350;

/** Horizontal FOV the summit frame must cover: the waypoints spread about 30° from the summit, so 60° leaves margin. */
export const SUMMIT_HFOV_DEG = 60;

/** Each stage's look target: mix(waypoint, summit, this), so the camera turns gently toward the waypoint (D-02). */
export const STAGE_TARGET_MIX = 0.35;

/** Horizontal distance from the summit of the first stage camera: far enough out to see Zermatt below. */
export const FIRST_STAGE_RADIUS_M = 3600;

/** Horizontal distance from the summit of the last stage camera: close in, before the summit pullback. */
export const LAST_STAGE_RADIUS_M = 1100;

/**
 * Glide slope of the stage cameras: each sits SUMMIT_LIFT_M above the summit
 * minus its radius x tan(this). 26° keeps each stage's waypoint near the frame
 * centre (NDC y -0.1 to 0.36 at the 40° FOV; a higher camera puts the far
 * waypoint above the near target and off the top of a phone) and is still
 * shallower than the Hörnli ridge (about 30°): stage cameras clear the 512²
 * mesh by 490 m or more.
 */
export const CAMERA_GLIDE_DEG = 26;

/** Below 768 px the optical centre moves up by this share of the stage height (D-20): targets sit above the docked card. */
export const VIEW_OFFSET_SHARE = 0.2;

/** Mirrors PLATEAU in lib/ascent/progress.ts (this module stays import-free; ascent-route.test asserts they match). */
export const ROUTE_PLATEAU = 0.03;

/** Boundary tolerance, as in progress.ts. */
const EPS = 1e-9;
const DEG = Math.PI / 180;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Hermite smoothstep of x between e0 and e1 (0 below, 1 above); a step when e1 <= e0. */
function smoothstep(e0: number, e1: number, x: number): number {
  if (!(e1 > e0)) return x < e1 ? 0 : 1;
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
});

/**
 * The tilt-in fraction at p (D-16): 0 at p = 0 (the plan view), easing to 1 at
 * the start of waypoint 1's plateau (p_1 - PLATEAU), so the camera holds still
 * on the plateau. Drives uRelief (0 to RELIEF_EXAGGERATION via the uniform), the
 * camera's up vector and the narrow-stage view offset. reliefAt(p_1) is 1.
 */
export function reliefAt(p: number, firstArrival: number): number {
  const end = firstArrival - ROUTE_PLATEAU;
  if (!(end > 0)) return p > 0 ? 1 : 0;
  return smoothstep(0, end, p);
}

/**
 * The poster's plan view as a pose (D-16; RESEARCH Pattern 8): straight down at
 * the centre of the visible UV window, from the height at which the vertical
 * FOV spans exactly its v range. `up` is north, (0, 0, -1): a straight-down
 * lookAt with the default up is degenerate. The ground is flat at p = 0, so
 * this perspective view equals the poster's orthographic one.
 */
export function planViewPose(frame: UvWindow, widthM: number, fovDeg: number): Pose {
  const x = ((frame.uMin + frame.uMax) / 2 - 0.5) * widthM;
  const z = ((frame.vMin + frame.vMax) / 2 - 0.5) * widthM;
  const vSpanM = (frame.vMax - frame.vMin) * widthM;
  const altitude = vSpanM / 2 / Math.tan((fovDeg * DEG) / 2);
  return {
    position: { x, y: altitude, z },
    target: { x, y: 0, z },
    up: { x: 0, y: 0, z: -1 },
  };
}

/** Horizontal unit vector from `from` to `to` (x, z); (0, 0) when they coincide. */
function horizontalDir(from: Vec3, to: Vec3): { x: number; z: number } {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const len = Math.hypot(dx, dz);
  return len > 0 ? { x: dx / len, z: dz / len } : { x: 0, z: 0 };
}

/**
 * The n + 2 key poses (positions and look targets): the plan view, one stage
 * per waypoint, and the summit look-back.
 *
 * - Stage k: the camera sits on the line from the summit through waypoint k,
 *   at a radius from the summit falling evenly from FIRST_STAGE_RADIUS_M to
 *   LAST_STAGE_RADIUS_M, at SUMMIT_LIFT_M above the summit less radius x
 *   tan(CAMERA_GLIDE_DEG); it looks at mix(waypoint_k, summit, STAGE_TARGET_MIX).
 * - Summit: SUMMIT_PULLBACK_M from the summit toward SUMMIT_PULLBACK_BEARING_DEG
 *   (SW), SUMMIT_LIFT_M above it, looking at the centroid of the waypoints (D-03).
 *
 * `anchors` are the waypoint ground points and `summit` the summit's, at relief
 * 1 with RELIEF_EXAGGERATION applied (mesh heights in the rig, Pitfall 2).
 *
 * @throws RangeError when there are no anchors.
 */
export function keyPoses({
  anchors,
  summit,
  planView,
}: {
  anchors: readonly Vec3[];
  summit: Vec3;
  planView: Pose;
}): { positions: Vec3[]; targets: Vec3[] } {
  const n = anchors.length;
  if (n === 0) throw new RangeError('keyPoses: need at least one waypoint anchor');
  const positions: Vec3[] = [planView.position];
  const targets: Vec3[] = [planView.target];
  const glide = Math.tan(CAMERA_GLIDE_DEG * DEG);

  anchors.forEach((anchor, i) => {
    const r = lerp(FIRST_STAGE_RADIUS_M, LAST_STAGE_RADIUS_M, n > 1 ? i / (n - 1) : 0);
    const out = horizontalDir(summit, anchor);
    positions.push({
      x: summit.x + out.x * r,
      y: summit.y + SUMMIT_LIFT_M - r * glide,
      z: summit.z + out.z * r,
    });
    targets.push(mix3(anchor, summit, STAGE_TARGET_MIX));
  });

  const b = SUMMIT_PULLBACK_BEARING_DEG * DEG;
  positions.push({
    x: summit.x + Math.sin(b) * SUMMIT_PULLBACK_M,
    y: summit.y + SUMMIT_LIFT_M,
    z: summit.z - Math.cos(b) * SUMMIT_PULLBACK_M,
  });
  const sum = anchors.reduce((acc, a) => ({ x: acc.x + a.x, y: acc.y + a.y, z: acc.z + a.z }), {
    x: 0,
    y: 0,
    z: 0,
  });
  targets.push({ x: sum.x / n, y: sum.y / n, z: sum.z / n });
  return { positions, targets };
}

/**
 * The curve parameter t in [0, 1] at progress p. The key poses sit at t = k /
 * (n + 1): the plan view at p = 0, stage k at its arrival p_k and the summit at
 * the summit arrival (1 in the measured layout). Within ±PLATEAU of an arrival
 * t holds exactly (the camera is still while a card is centred); between
 * plateau edges it eases in and out (smoothstep), so the camera leaves and
 * reaches each stage gently. Non-decreasing; 0 at p = 0, 1 at p = 1.
 *
 * `arrivals` are the n waypoint arrivals and then the summit's (progress.ts).
 *
 * @throws RangeError for fewer than two arrivals.
 */
export function curveParamAt(p: number, arrivals: readonly number[]): number {
  if (arrivals.length < 2) {
    throw new RangeError(
      `curveParamAt: need at least one waypoint and the summit, got ${arrivals.length} arrivals`
    );
  }
  const m = arrivals.length; // n + 1 segments
  if (p <= 0) return 0;
  if (p >= arrivals[m - 1] - ROUTE_PLATEAU - EPS) return 1;
  for (let k = 0; k < m; k += 1) {
    const from = k === 0 ? 0 : arrivals[k - 1] + ROUTE_PLATEAU;
    const to = arrivals[k] - ROUTE_PLATEAU;
    if (p <= from + EPS) return k / m;
    if (p < to - EPS) return (k + smoothstep(from, to, p)) / m;
  }
  return 1;
}

/**
 * The vertical FOV (degrees) whose horizontal FOV is `hfovDeg` at `aspect`
 * (width / height): 2 atan(tan(hfov / 2) / aspect). The summit frame uses it
 * so all four waypoints fit across a portrait phone too (D-03).
 */
export function summitVerticalFov(aspect: number, hfovDeg: number): number {
  return (2 * Math.atan(Math.tan((hfovDeg * DEG) / 2) / aspect)) / DEG;
}

/**
 * The camera's vertical FOV at curve parameter t: CAMERA_FOV_DEG until the
 * last leg starts (t = n / (n + 1)), then linear in t to `summitFovDeg` at the
 * summit, so it holds on every plateau.
 */
export function fovAt(t: number, n: number, summitFovDeg: number): number {
  const f = clamp01(t * (n + 1) - n);
  return lerp(CAMERA_FOV_DEG, summitFovDeg, f);
}

/**
 * The vertical view offset in px (D-20) for camera.setViewOffset: on a narrow
 * stage (below 768 px, where the card docks over the lower part) the optical
 * centre moves up by VIEW_OFFSET_SHARE of the stage height, ramping in with
 * the tilt-in, so it is 0 at p = 0 (poster parity). Always 0 on wide stages.
 */
export function viewOffsetAt(
  p: number,
  firstArrival: number,
  narrow: boolean,
  stageHeight: number
): number {
  if (!narrow) return 0;
  return reliefAt(p, firstArrival) * VIEW_OFFSET_SHARE * stageHeight;
}

/**
 * The yaw change in degrees (0 to 180) between two look directions, from their
 * horizontal components. NaN when either direction is vertical (the plan view
 * has no yaw).
 */
export function yawDeg(from: Vec3, to: Vec3): number {
  const a = Math.hypot(from.x, from.z);
  const b = Math.hypot(to.x, to.z);
  if (!(a > 0 && b > 0)) return Number.NaN;
  const cos = (from.x * to.x + from.z * to.z) / (a * b);
  return Math.acos(Math.max(-1, Math.min(1, cos))) / DEG;
}
