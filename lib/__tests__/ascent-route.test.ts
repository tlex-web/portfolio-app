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
 * - Summit framing (D-03; G-09-2, 09-20, Tim: "Compact plaque + measured 3D"):
 *   with the fitted summit key (lib/ascent/framing.ts fitCluster over
 *   summitClearRects and the modelled plaque column of summit-layout.ts) the
 *   look-back camera puts every waypoint pin box inside its chosen clear
 *   rectangle at phone, tablet and desktop stage sizes.
 * - Plateaus and legs: the curve parameter holds on every ±0.03 plateau and
 *   never runs backwards.
 * - Vestibular limit: the look direction turns by at most 45° per leg.
 * - Tilt-in and key track: relief and the narrow-stage view offset (framing.ts
 *   stageViewKeys and viewTrackAt) are 0 at p = 0 (poster parity) and complete
 *   by p_1; the summit key ramps in over the last leg only.
 */
import { PerspectiveCamera, Vector3 } from 'three';
import { terrain } from '@/data/generated/terrain';
import {
  NARROW_VIEW_OFFSET_X_SHARE,
  NARROW_VIEW_OFFSET_Y_SHARE,
  STAGE_FOV_DEG,
  SUMMIT_FRAME_MARGIN_PX,
  fitCluster,
  stageViewKeys,
  summitClearRects,
  viewTrackAt,
  type Box,
  type TangentBounds,
  type ViewKey,
} from '@/lib/ascent/framing';
import { posterFrame } from '@/lib/ascent/poster-frame';
import { PLATEAU } from '@/lib/ascent/progress';
import * as route from '@/lib/ascent/route';
import {
  CAMERA_FOV_DEG,
  ROUTE_PLATEAU,
  SUMMIT_HFOV_DEG,
  SUMMIT_WIDE_HFOV_DEG,
  VIEW_OFFSET_SHARE,
  VIEW_OFFSET_X_SHARE,
  curveParamAt,
  keyPoses,
  planViewPose,
  reliefAt,
  summitHfovDeg,
  summitVerticalFov,
  yawDeg,
  type Pose,
  type Vec3,
} from '@/lib/ascent/route';
import { summitColumnBox } from '@/lib/ascent/summit-layout';
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

/** The rail scrim's width from the md breakpoint (AscentHero w-56); 0 below it. */
const RAIL_ZONE_PX = 224;
/** The md breakpoint, as CameraRig's matchMedia('(min-width: 48rem)'); SIZES have no scrollbar gutter. */
const isNarrow = (w: number) => w < 768;
const DEG = Math.PI / 180;

/** The modelled plaque column (summit-layout.ts) for a w x h stage under the 64 px nav, as a Box. */
function plaqueAt(w: number, h: number): Box {
  const c = summitColumnBox(w, h + 64, 0);
  return { x0: c.x, y0: c.y, x1: c.x + c.width, y1: c.y + c.height };
}

/**
 * The summit camera with the fitted summit key applied, as CameraRig builds it:
 * tangent bounds of the anchors from the summit key pose, fitCluster over
 * summitClearRects of the modelled plaque, capped at the summit zoom.
 */
function fittedSummit(w: number, h: number) {
  const { positions, targets } = posesFor(w, h);
  const narrow = isNarrow(w);
  const camera = cameraAt(
    { position: positions[n + 1], target: targets[n + 1], up: { x: 0, y: 1, z: 0 } },
    w,
    h,
    CAMERA_FOV_DEG
  );
  const t = anchors.map((a) => {
    const c = vec(a).applyMatrix4(camera.matrixWorldInverse);
    return { tx: c.x / -c.z, ty: c.y / -c.z };
  });
  const bounds: TangentBounds = {
    a0: Math.min(...t.map((p) => p.tx)),
    a1: Math.max(...t.map((p) => p.tx)),
    b0: Math.min(...t.map((p) => p.ty)),
    b1: Math.max(...t.map((p) => p.ty)),
  };
  const plaque = plaqueAt(w, h);
  const rects = summitClearRects(
    { w, h },
    plaque,
    narrow ? 0 : RAIL_ZONE_PX,
    SUMMIT_FRAME_MARGIN_PX
  );
  const maxFocalPx = w / 2 / Math.tan((summitHfovDeg(narrow) * DEG) / 2);
  const fit = fitCluster({ bounds, stage: { w, h }, rects, maxFocalPx });
  camera.fov = fit.fovDeg;
  camera.setViewOffset(w, h, fit.offsetX, fit.offsetY, w, h);
  camera.updateProjectionMatrix();
  const key: ViewKey = { x: fit.offsetX, y: fit.offsetY, fov: fit.fovDeg };
  return { camera, fit, key, rects, plaque, narrow };
}

/** Each anchor's pin box (24 x 40 px above the projected anchor) and NDC depth through `camera`. */
function pinBoxesThrough(camera: PerspectiveCamera, w: number, h: number) {
  return anchors.map((a) => {
    const ndc = vec(a).project(camera);
    const x = ((ndc.x + 1) / 2) * w;
    const y = ((1 - ndc.y) / 2) * h;
    return { z: ndc.z, box: { x0: x - 12, y0: y - 40, x1: x + 12, y1: y } };
  });
}

const within = (inner: Box, outer: Box) =>
  inner.x0 >= outer.x0 - 1e-6 &&
  inner.y0 >= outer.y0 - 1e-6 &&
  inner.x1 <= outer.x1 + 1e-6 &&
  inner.y1 <= outer.y1 + 1e-6;

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
    'the fitted summit frame shows all four waypoints, each pin box inside its chosen clear rectangle, at %i x %i (modelled plaque)',
    (w, h) => {
      const { camera, fit, rects } = fittedSummit(w, h);
      expect(rects).toContainEqual(fit.rect);
      for (const { z, box } of pinBoxesThrough(camera, w, h)) {
        expect(z).toBeGreaterThan(-1); // in front of the camera, inside the frustum depth
        expect(z).toBeLessThan(1);
        expect(within(box, fit.rect)).toBe(true);
      }
    }
  );

  it('on a portrait md stage (768 x 960) the summit frame takes the rectangle above the compact column', () => {
    const { fit, plaque } = fittedSummit(768, 960);
    expect(fit.rect.y1).toBeLessThanOrEqual(plaque.y0 - SUMMIT_FRAME_MARGIN_PX);
    expect(fit.offsetY).toBeGreaterThan(0); // the optical centre moves up: a vertical offset
  });

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

  /** The view keys CameraRig builds for a w x h stage with the fitted summit key. */
  const keysFor = (w: number, h: number) => {
    const { key, narrow } = fittedSummit(w, h);
    return stageViewKeys({ n, narrow, stage: { w, h }, summit: key });
  };
  const trackAt = (keys: ViewKey[], p: number) => viewTrackAt(keys, curveParamAt(p, ARRIVALS));
  /** Progress values up to the start of the last leg's ramp (t <= n / (n + 1)). */
  const beforeLastLeg = Array.from(
    { length: 21 },
    (_, i) => (i / 20) * (ARRIVALS[n - 1] + ROUTE_PLATEAU)
  );

  it('the key track has no view offset at p = 0 and none on wide stages before the last leg', () => {
    const narrow = keysFor(375, 603);
    expect(trackAt(narrow, 0)).toMatchObject({ x: 0, y: 0 });
    const wide = keysFor(1440, 836);
    for (const p of beforeLastLeg) expect(trackAt(wide, p)).toMatchObject({ x: 0, y: 0 });
    expect(trackAt(narrow, ARRIVALS[0]).y).toBeGreaterThan(0);
  });

  it('the key track moves a narrow stage view right from p_1, never at p = 0 or on wide stages before the summit', () => {
    const narrow = keysFor(400, 603);
    expect(trackAt(narrow, 0).x).toBe(0);
    expect(trackAt(narrow, ARRIVALS[0]).x).toBeCloseTo(VIEW_OFFSET_X_SHARE * 400, 9);
    const wide = keysFor(1440, 836);
    for (const p of beforeLastLeg) expect(trackAt(wide, p).x).toBe(0);
  });

  it('summitVerticalFov keeps the horizontal FOV: equal at aspect 1, wider on portrait stages', () => {
    expect(summitVerticalFov(1, 60)).toBeCloseTo(60, 9);
    expect(summitVerticalFov(375 / 603, 60)).toBeGreaterThan(60);
    expect(summitVerticalFov(1440 / 836, 60)).toBeLessThan(60);
  });

  it('the key track holds CAMERA_FOV_DEG until the last leg and reaches the fitted summit FOV at t = 1', () => {
    for (const [w, h] of SIZES) {
      const keys = keysFor(w, h);
      for (const t of [0, 0.3, (n - 1) / (n + 1), n / (n + 1)]) {
        expect(viewTrackAt(keys, t).fov).toBeCloseTo(CAMERA_FOV_DEG, 12);
      }
      expect(viewTrackAt(keys, 1).fov).toBeCloseTo(fittedSummit(w, h).fit.fovDeg, 12);
    }
  });

  it('summitHfovDeg widens the summit frame on wide stages only', () => {
    expect(summitHfovDeg(true)).toBe(SUMMIT_HFOV_DEG);
    expect(summitHfovDeg(false)).toBe(SUMMIT_WIDE_HFOV_DEG);
    expect(SUMMIT_WIDE_HFOV_DEG).toBeGreaterThan(SUMMIT_HFOV_DEG);
  });

  it('the summit key holds no influence until the last leg and is reached at t = 1', () => {
    for (const [w, h] of SIZES) {
      const keys = keysFor(w, h);
      const other = [...keys.slice(0, -1), { x: 999, y: -999, fov: 120 }];
      for (const t of [0, 0.3, (n - 1) / (n + 1), n / (n + 1)]) {
        const a = viewTrackAt(keys, t);
        const b = viewTrackAt(other, t);
        expect(a.x).toBeCloseTo(b.x, 9);
        expect(a.y).toBeCloseTo(b.y, 9);
        expect(a.fov).toBeCloseTo(b.fov, 9);
      }
      const end = viewTrackAt(keys, 1);
      const { key } = fittedSummit(w, h);
      expect(end.x).toBeCloseTo(key.x, 9);
      expect(end.y).toBeCloseTo(key.y, 9);
      expect(end.fov).toBeCloseTo(key.fov, 9);
    }
  });

  it('on a wide stage the fitted summit frame puts every waypoint right of the full plaque and left of the rail zone, and narrows their spread', () => {
    const [w, h] = [1440, 836];
    const { positions, targets } = posesFor(w, h);
    const pose = { position: positions[n + 1], target: targets[n + 1], up: { x: 0, y: 1, z: 0 } };
    const before = cameraAt(pose, w, h, summitVerticalFov(w / h, SUMMIT_HFOV_DEG));
    const { camera: after, plaque } = fittedSummit(w, h);
    for (const { box } of pinBoxesThrough(after, w, h)) {
      expect(box.x0).toBeGreaterThanOrEqual(plaque.x1 + SUMMIT_FRAME_MARGIN_PX - 1e-6);
      expect(box.x1).toBeLessThanOrEqual(w - RAIL_ZONE_PX - SUMMIT_FRAME_MARGIN_PX + 1e-6);
    }
    const xs = (camera: PerspectiveCamera) => anchors.map((a) => vec(a).project(camera).x);
    const [b, a] = [xs(before), xs(after)];
    expect(Math.max(...a) - Math.min(...a)).toBeLessThan(Math.max(...b) - Math.min(...b));
  });

  it("framing.ts's copied FOV and narrow shares equal route.ts's", () => {
    expect(STAGE_FOV_DEG).toBe(CAMERA_FOV_DEG);
    expect(NARROW_VIEW_OFFSET_Y_SHARE).toBe(VIEW_OFFSET_SHARE);
    expect(NARROW_VIEW_OFFSET_X_SHARE).toBe(VIEW_OFFSET_X_SHARE);
  });

  it('route.ts keeps none of the share-based summit or view-offset helpers (the measured framing replaced them)', () => {
    const gone = [
      'summitViewOffsetXAt',
      'summitViewOffsetYAt',
      'SUMMIT_VIEW_OFFSET_X_SHARE',
      'SUMMIT_VIEW_OFFSET_Y_SHARE',
      'viewOffsetAt',
      'viewOffsetXAt',
      'fovAt',
    ];
    expect(Object.keys(route).filter((name) => gone.includes(name))).toEqual([]);
  });

  it('yawDeg has no yaw for a vertical direction', () => {
    expect(yawDeg({ x: 0, y: -1, z: 0 }, { x: 1, y: 0, z: 0 })).toBeNaN();
    expect(yawDeg({ x: 1, y: 0, z: 0 }, { x: 0, y: -3, z: 1 })).toBeCloseTo(90, 9);
  });
});
