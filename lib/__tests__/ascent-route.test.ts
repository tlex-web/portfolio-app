/**
 * @jest-environment node
 *
 * The Home camera route (HOME-02, HOME-05; D-02, D-03, D-16, D-20; 09-RESEARCH
 * Pattern 8; 09-UI-SPEC "Ascent Mapping"). Jest loads three through its
 * CommonJS build, so the projections below use the same PerspectiveCamera
 * maths as the canvas.
 *
 * - Plan-view parity (D-16): at p = 0 the camera frames exactly the poster's
 *   visible UV window, corner to corner.
 * - Summit framing (D-03): the look-back camera shows all four waypoints inside
 *   NDC ±0.9 at phone, tablet and desktop stage sizes.
 * - Plateaus and legs: the curve parameter holds on every ±0.03 plateau and
 *   never runs backwards.
 * - Vestibular limit: the look direction turns by at most 45° per leg.
 * - Tilt-in: relief and the narrow-stage view offset are 0 at p = 0 (poster
 *   parity) and complete by p_1.
 */
import { PerspectiveCamera, Vector3 } from 'three';
import { terrain } from '@/data/generated/terrain';
import { posterFrame } from '@/lib/ascent/poster-frame';
import { PLATEAU } from '@/lib/ascent/progress';
import {
  CAMERA_FOV_DEG,
  ROUTE_PLATEAU,
  SUMMIT_HFOV_DEG,
  curveParamAt,
  fovAt,
  keyPoses,
  planViewPose,
  reliefAt,
  summitVerticalFov,
  viewOffsetAt,
  yawDeg,
  type Pose,
  type Vec3,
} from '@/lib/ascent/route';
import { buildWaypoints } from '@/lib/ascent/waypoints';
import { uvToWorld } from '@/lib/terrain/heightmap';

const W = terrain.extent.widthM;
const SIZES = [
  [375, 603],
  [768, 960],
  [1440, 836],
] as const;
const ARRIVALS = [0.2, 0.4, 0.6, 0.8, 1];

const waypoints = buildWaypoints();
const n = waypoints.length;
/** Waypoint ground points at their DEM heights (the unit tests have no decoded mesh). */
const anchors: Vec3[] = waypoints.map((w) => ({ ...xz(w.uv.u, w.uv.v), y: w.altitudeM }));
const summit: Vec3 = { ...xz(terrain.summit.uv.u, terrain.summit.uv.v), y: terrain.summit.demM };

function xz(u: number, v: number) {
  const { x, z } = uvToWorld(u, v, W);
  return { x, z };
}

const vec = (p: Vec3) => new Vector3(p.x, p.y, p.z);
const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

function cameraAt(pose: Pose, w: number, h: number, fov: number): PerspectiveCamera {
  const camera = new PerspectiveCamera(fov, w / h, 10, 100000);
  camera.position.copy(vec(pose.position));
  camera.up.copy(vec(pose.up));
  camera.lookAt(vec(pose.target));
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  return camera;
}

function posesFor(w: number, h: number) {
  const planView = planViewPose(posterFrame(w, h), W, CAMERA_FOV_DEG);
  return { planView, ...keyPoses({ anchors, summit, planView }) };
}

describe('planViewPose (D-16 poster parity)', () => {
  it.each(SIZES)('frames the poster UV window corner to corner at %i x %i', (w, h) => {
    const frame = posterFrame(w, h);
    const camera = cameraAt(planViewPose(frame, W, CAMERA_FOV_DEG), w, h, CAMERA_FOV_DEG);
    const corners = [
      { u: frame.uMin, v: frame.vMin, ndc: [-1, 1] },
      { u: frame.uMax, v: frame.vMin, ndc: [1, 1] },
      { u: frame.uMin, v: frame.vMax, ndc: [-1, -1] },
      { u: frame.uMax, v: frame.vMax, ndc: [1, -1] },
    ];
    for (const corner of corners) {
      const { x, z } = uvToWorld(corner.u, corner.v, W);
      const ndc = new Vector3(x, 0, z).project(camera);
      expect(ndc.x).toBeCloseTo(corner.ndc[0], 3);
      expect(ndc.y).toBeCloseTo(corner.ndc[1], 3);
    }
  });

  it('looks straight down with north up', () => {
    const pose = planViewPose(posterFrame(1440, 836), W, CAMERA_FOV_DEG);
    expect(pose.target.x).toBe(pose.position.x);
    expect(pose.target.z).toBe(pose.position.z);
    expect(pose.target.y).toBe(0);
    expect(pose.up).toEqual({ x: 0, y: 0, z: -1 });
  });
});

describe('keyPoses (D-02, D-03)', () => {
  it('has n + 2 stops, starting at the plan view', () => {
    const { planView, positions, targets } = posesFor(1440, 836);
    expect(positions).toHaveLength(n + 2);
    expect(targets).toHaveLength(n + 2);
    expect(positions[0]).toEqual(planView.position);
    expect(targets[0]).toEqual(planView.target);
  });

  it('turns each stage gently toward its waypoint: target = mix(waypoint, summit, 0.35)', () => {
    const { targets } = posesFor(1440, 836);
    anchors.forEach((a, i) => {
      const t = targets[i + 1];
      expect(t.x).toBeCloseTo(a.x + (summit.x - a.x) * 0.35, 6);
      expect(t.y).toBeCloseTo(a.y + (summit.y - a.y) * 0.35, 6);
      expect(t.z).toBeCloseTo(a.z + (summit.z - a.z) * 0.35, 6);
    });
  });

  it('climbs toward the summit: each stage camera is higher and closer to it than the last', () => {
    const { positions } = posesFor(1440, 836);
    const stages = positions.slice(1, n + 1);
    const r = stages.map((p) => Math.hypot(p.x - summit.x, p.z - summit.z));
    for (let k = 1; k < n; k++) {
      expect(stages[k].y).toBeGreaterThan(stages[k - 1].y);
      expect(r[k]).toBeLessThan(r[k - 1]);
    }
  });

  it('settles the summit camera SUMMIT_PULLBACK_M SW of and above the summit, aimed at the waypoint centroid', () => {
    const { positions, targets } = posesFor(1440, 836);
    const cam = positions[n + 1];
    expect(Math.hypot(cam.x - summit.x, cam.z - summit.z)).toBeCloseTo(450, 6);
    expect(cam.x).toBeLessThan(summit.x); // west
    expect(cam.z).toBeGreaterThan(summit.z); // south
    expect(cam.y).toBeGreaterThan(summit.y);
    const centroid = anchors.reduce(
      (c, a) => ({ x: c.x + a.x / n, y: c.y + a.y / n, z: c.z + a.z / n }),
      {
        x: 0,
        y: 0,
        z: 0,
      }
    );
    expect(targets[n + 1].x).toBeCloseTo(centroid.x, 6);
    expect(targets[n + 1].y).toBeCloseTo(centroid.y, 6);
    expect(targets[n + 1].z).toBeCloseTo(centroid.z, 6);
  });

  it.each(SIZES)(
    'the summit frame shows all four waypoints inside NDC ±0.9 at %i x %i (view offset applied below 768 px)',
    (w, h) => {
      const { positions, targets } = posesFor(w, h);
      const fov = summitVerticalFov(w / h, SUMMIT_HFOV_DEG);
      const camera = cameraAt(
        { position: positions[n + 1], target: targets[n + 1], up: { x: 0, y: 1, z: 0 } },
        w,
        h,
        fov
      );
      if (w < 768) {
        camera.setViewOffset(w, h, 0, viewOffsetAt(1, ARRIVALS[0], true, h), w, h);
        camera.updateProjectionMatrix();
      }
      for (const a of anchors) {
        const ndc = vec(a).project(camera);
        expect(ndc.z).toBeGreaterThan(-1); // in front of the camera, inside the frustum depth
        expect(ndc.z).toBeLessThan(1);
        expect(Math.abs(ndc.x)).toBeLessThanOrEqual(0.9);
        expect(Math.abs(ndc.y)).toBeLessThanOrEqual(0.9);
      }
    }
  );

  it('turns the look direction by at most 45° per leg (motion sensitivity)', () => {
    const { positions, targets } = posesFor(1440, 836);
    const dirs = positions.map((p, i) => sub(targets[i], p));
    for (let k = 1; k <= n; k++) {
      expect(yawDeg(dirs[k], dirs[k + 1])).toBeLessThanOrEqual(45);
    }
  });

  it('throws without anchors', () => {
    const planView = planViewPose(posterFrame(1440, 836), W, CAMERA_FOV_DEG);
    expect(() => keyPoses({ anchors: [], summit, planView })).toThrow(RangeError);
  });
});

describe('curveParamAt (plateaus and legs)', () => {
  it('is 0 at p = 0 and 1 at p = 1', () => {
    expect(curveParamAt(0, ARRIVALS)).toBe(0);
    expect(curveParamAt(1, ARRIVALS)).toBe(1);
  });

  it('never decreases over [0, 1]', () => {
    let last = -Infinity;
    for (let i = 0; i <= 1000; i++) {
      const t = curveParamAt(i / 1000, ARRIVALS);
      expect(t).toBeGreaterThanOrEqual(last);
      last = t;
    }
  });

  it('holds k / (n + 1) within ±0.03 of each arrival', () => {
    ARRIVALS.forEach((pk, i) => {
      const k = i + 1;
      for (const p of [pk - 0.03, pk - 0.015, pk, pk + 0.015, Math.min(1, pk + 0.03)]) {
        expect(curveParamAt(p, ARRIVALS)).toBeCloseTo(k / (n + 1), 12);
      }
    });
  });

  it('moves between plateaus', () => {
    expect(curveParamAt(0.3, ARRIVALS)).toBeGreaterThan(1 / 5);
    expect(curveParamAt(0.3, ARRIVALS)).toBeLessThan(2 / 5);
    expect(curveParamAt(0.1, ARRIVALS)).toBeGreaterThan(0);
    expect(curveParamAt(0.1, ARRIVALS)).toBeLessThan(1 / 5);
  });

  it('throws for fewer than two arrivals', () => {
    expect(() => curveParamAt(0.5, [1])).toThrow(RangeError);
  });

  it('uses the same plateau as the progress mapping', () => {
    expect(ROUTE_PLATEAU).toBe(PLATEAU);
  });
});

describe('tilt-in, FOV and view offset (D-16, D-20)', () => {
  it('reliefAt runs 0 at p = 0 to 1 at p_1, never decreasing', () => {
    expect(reliefAt(0, 0.2)).toBe(0);
    expect(reliefAt(0.2, 0.2)).toBe(1);
    let last = -Infinity;
    for (let i = 0; i <= 200; i++) {
      const r = reliefAt((i / 200) * 0.2, 0.2);
      expect(r).toBeGreaterThanOrEqual(last);
      last = r;
    }
  });

  it('viewOffsetAt is 0 at p = 0 and always 0 on wide stages', () => {
    expect(viewOffsetAt(0, 0.2, true, 600)).toBe(0);
    for (let i = 0; i <= 20; i++) expect(viewOffsetAt(i / 20, 0.2, false, 600)).toBe(0);
    expect(viewOffsetAt(0.2, 0.2, true, 600)).toBeGreaterThan(0);
  });

  it('summitVerticalFov keeps the horizontal FOV: equal at aspect 1, wider on portrait stages', () => {
    expect(summitVerticalFov(1, 60)).toBeCloseTo(60, 9);
    expect(summitVerticalFov(375 / 603, 60)).toBeGreaterThan(60);
    expect(summitVerticalFov(1440 / 836, 60)).toBeLessThan(60);
  });

  it('fovAt holds CAMERA_FOV_DEG until the last leg and reaches the summit FOV at t = 1', () => {
    expect(fovAt(0, n, 80)).toBe(CAMERA_FOV_DEG);
    expect(fovAt(n / (n + 1), n, 80)).toBe(CAMERA_FOV_DEG);
    expect(fovAt(1, n, 80)).toBe(80);
  });

  it('yawDeg has no yaw for a vertical direction', () => {
    expect(yawDeg({ x: 0, y: -1, z: 0 }, { x: 1, y: 0, z: 0 })).toBeNaN();
    expect(yawDeg({ x: 1, y: 0, z: 0 }, { x: 0, y: -3, z: 1 })).toBeCloseTo(90, 9);
  });
});
