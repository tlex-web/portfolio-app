'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useMotionValueEvent } from 'motion/react';
import { PerspectiveCamera, Vector3, type ShaderMaterial } from 'three';
import { useAscent } from '@/components/home/AscentController';
import { terrain } from '@/data/generated/terrain';
import { DURATION } from '@/lib/animations';
import {
  SUMMIT_FRAME_MARGIN_PX,
  fitCluster,
  placePinLabel,
  railObstaclesAt,
  stageViewKeys,
  summitClearRects,
  viewTrackAt,
  waypointTarget,
  type StageGeometry,
  type TangentBounds,
} from '@/lib/ascent/framing';
import { createFrameBudget, type FrameBudgetVerdict } from '@/lib/ascent/frame-budget';
import { posterFrame } from '@/lib/ascent/poster-frame';
import {
  CAMERA_FOV_DEG,
  RELIEF_EXAGGERATION,
  curveParamAt,
  planViewPose,
  reliefAt,
  summitHfovDeg,
  type PinAnchor,
  type Pose,
} from '@/lib/ascent/route';
import { downgradeAscent } from '@/lib/useAscentMode';
import { anchorAt, poseAt, routeCurvesFor, type RouteCurves } from './route-curve';

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
 * 0 to 1 (with uExaggeration = RELIEF_EXAGGERATION) and `up` turns from north
 * (0, 0, -1), which a straight-down view needs, to (0, 1, 0). Both are 0 at
 * p = 0, so the canvas still equals the poster there, and complete at the
 * start of waypoint 1's plateau.
 *
 * View offset and FOV follow one key track (lib/ascent/framing.ts
 * stageViewKeys and viewTrackAt, linear in the curve parameter between keys):
 * the plan view has no offset and the plan-view FOV; on a narrow stage (below
 * the md breakpoint) every stage key moves the optical centre up 0.2 x the
 * height, so targets sit above the docked card (D-20), and right 0.2 x the
 * width, so the stage's waypoint has room for its label on the right. The
 * first segment of the track is the tilt-in, so the offsets ramp in with it.
 *
 * Measured md stages (G-09-3 a, 09-21; D-07, D-09): on a wide stage each
 * stage camera would put its waypoint on the view axis, under the 448 px card
 * up to about 980 px. So once per route build, stage size and geometry
 * measurement (not per frame) the rig projects each waypoint anchor with a
 * scratch camera at its stage key pose (no view offset) and asks
 * waypointTarget where the lit pin should sit: at that natural position when
 * it and its label already clear the card and the rail, else beside, above or
 * below the card. natural - target is the stage key's view offset, so the
 * view moves between stages on the same track and snaps only where the
 * progress spring snaps (D-06).
 * Narrow versus wide follows matchMedia('(min-width: 48rem)'), the CSS md
 * breakpoint's width source: the canvas is 10 px narrower than the viewport
 * (scrollbar-gutter), so a canvas-width switch disagreed with the layout at
 * 768 to 777 px (G-09-2, 09-20).
 *
 * Measured summit framing (G-09-2, 09-20; Tim: "Compact plaque + measured
 * 3D"; D-03): once per route build the waypoint anchors are taken into the
 * summit camera's space (their tangent bounds). Each frame the summit key is
 * fitCluster over summitClearRects: the clear rectangles above and right of
 * the measured plaque column (AscentController geometry.plaque), 16 px inside
 * the stage and clear of the rail zone. The rig takes the rectangle that holds
 * the cluster largest, never zooms past the summit's 60 degree (narrow) or 75
 * degree (wide) horizontal FOV, and centres the pin boxes in it. The summit
 * key ramps in over the last leg. A geometry measurement invalidates a frame
 * (subscribeGeometry); nothing reads layout in the frame loop.
 *
 * Until the metres arrive (the canvas is still invisible) or the layout is
 * measured, the camera holds the plan view.
 *
 * 3D pins (D-09, corrections C3 and C5): after the pose update, each anchor
 * (uvToWorld, meshHeightAtUv x uRelief x RELIEF_EXAGGERATION: the rendered
 * surface, not the DEM height) is projected through the camera and its
 * PinLayer3D mark is moved with a transform. A mark is hidden while its point
 * is behind the camera or beyond the depth range (NDC z outside (-1, 1)) or
 * more than 10 % outside the stage. The lit pin's label uses the poster's
 * placement rule (placePinLabel, 09-19 and 09-21): its card and the rail marks
 * at its plateau are the obstacles, the card the cover, the stage the bounds;
 * the rig writes data-label and --pin-label-dx on that one mark each frame and
 * leaves the unlit marks alone (their labels are not shown). Lighting stays
 * with AscentController.
 *
 * Demand frameloop: every change of the progress spring invalidates a frame,
 * and useFrame (priority 0, never positive: a positive priority takes over
 * rendering) keeps invalidating while the progress moved since the last
 * applied frame by more than EPS (the D-06 rule), then stops.
 *
 * Frame budget (D-18, correction C4; 09-RESEARCH Pattern 10): drei's
 * PerformanceMonitor reads demand-mode idle time as low FPS, so the rig
 * measures the reveal itself. Once the stage is revealed and the route is
 * built, it invalidates every frame (the reveal burst, at least
 * DURATION.settle and until a verdict) and feeds each frame to
 * lib/ascent/frame-budget, `continuous` when the previous frame asked for this
 * one. 'ok' ends the burst. The first 'decline' at a pixel ratio above 1 drops
 * it to 1 (setDpr, and onDprStepDown so TerrainCanvas keeps 1 across
 * re-renders) and measures a fresh burst; a decline at 1 turns Home static
 * (downgradeAscent('frame-budget')). Every verdict leaves the performance mark
 * 'ascent-frame-budget' with { medianMs, samples, verdict, dpr }.
 *
 * Off-screen and hidden-tab pause (HOME-07; 09-RESEARCH Pattern 5): an
 * IntersectionObserver on the stage and a `visibilitychange` listener keep two
 * flags. Progress changes, the D-06 follow-up frames and the reveal burst
 * invalidate only while the stage is on screen and the tab visible, so nothing
 * is drawn behind About or in a background tab. When both are true again the
 * rig invalidates once, so the camera catches up with the progress. A burst
 * cut short by a pause is dropped when the flag changes (a background tab runs
 * no frame, so it cannot wait for useFrame) and starts over with a fresh budget
 * when the canvas shows again: an interrupted burst would read the pause as
 * slow frames (G-09-5, 09-REVIEW WR-01).
 */

/** Progress change below which no further frame is needed (D-06). */
const EPS = 1e-4;
/** The CSS md breakpoint: below it the card docks over the lower part (D-20) and the stages get the view offset. */
const WIDE_MEDIA = '(min-width: 48rem)';
/** A pin whose anchor is further outside the stage than this share of its size is hidden. */
const OFFSTAGE_SHARE = 0.1;
const W = terrain.extent.widthM;
/** The shortest reveal burst: the canvas fade (DURATION.settle), in ms. */
const BURST_MIN_MS = DURATION.settle * 1000;

/**
 * Test-only measure-only switch (Tim's 09-11 option A, extended to phones and
 * the HOME-08 perf run by his 09-13 B1). A Playwright init script
 * (e2e/helpers/webgl.ts budgetMeasureOnly) sets it for the e2e tests that need
 * '3d' under SwiftShader: the burst still runs and every verdict is
 * still marked, but a decline neither steps the pixel ratio down nor turns
 * Home static. Unset for every visitor, so this is one property read per
 * verdict and the budget acts exactly as described above.
 */
type BudgetTestHook = { __ascentBudgetMeasureOnly?: boolean };
const budgetMeasureOnly = () =>
  (window as Window & BudgetTestHook).__ascentBudgetMeasureOnly === true;

/** Records a frame-budget verdict as a local performance mark (nothing leaves the page). */
function markBudget(
  verdict: FrameBudgetVerdict,
  budget: ReturnType<typeof createFrameBudget>,
  dpr: number
) {
  try {
    performance.mark('ascent-frame-budget', {
      detail: { medianMs: budget.medianMs(), samples: budget.samples(), verdict, dpr },
    });
  } catch {
    // performance.mark with options is unavailable: the verdict still applies.
  }
}

// Scratch objects for the frame loop (one canvas per page).
const scratch = { position: new Vector3(), target: new Vector3() };
const up = new Vector3();
const point = new Vector3();

/**
 * The tangent bounds of the waypoint anchors (at relief 1) as the summit key
 * pose sees them: a camera at poses.positions[n + 1] looking at
 * poses.targets[n + 1] with up (0, 1, 0); each anchor in camera space gives
 * tx = X / -Z and ty = Y / -Z. Anchors behind the camera are skipped. Null
 * when no anchor is in front of it.
 */
function summitTangentBounds(
  curves: RouteCurves,
  pins: readonly PinAnchor[],
  metres: Float32Array,
  gridSize: number
): TangentBounds | null {
  const { positions, targets } = curves.poses;
  const at = positions[positions.length - 1];
  const look = targets[targets.length - 1];
  const cam = new PerspectiveCamera();
  cam.position.set(at.x, at.y, at.z);
  cam.up.set(0, 1, 0);
  cam.lookAt(look.x, look.y, look.z);
  cam.updateMatrixWorld();
  const toCamera = cam.matrixWorldInverse;
  let bounds: TangentBounds | null = null;
  const p = new Vector3();
  for (const { u, v } of pins) {
    const a = anchorAt(metres, gridSize, u, v, 1);
    p.set(a.x, a.y, a.z).applyMatrix4(toCamera);
    if (!(p.z < 0)) continue;
    const tx = p.x / -p.z;
    const ty = p.y / -p.z;
    bounds = bounds
      ? {
          a0: Math.min(bounds.a0, tx),
          a1: Math.max(bounds.a1, tx),
          b0: Math.min(bounds.b0, ty),
          b1: Math.max(bounds.b1, ty),
        }
      : { a0: tx, a1: tx, b0: ty, b1: ty };
  }
  return bounds;
}

/**
 * Each waypoint anchor's natural position on a w x h stage (G-09-3 a, 09-21):
 * projected (at relief 1) by a camera at its stage key pose (poses.positions[k]
 * looking at poses.targets[k], up (0, 1, 0), FOV CAMERA_FOV_DEG, the stage
 * aspect, no view offset). Null for an anchor behind that camera.
 */
function stageNaturals(
  curves: RouteCurves,
  pins: readonly PinAnchor[],
  metres: Float32Array,
  gridSize: number,
  w: number,
  h: number
): ({ x: number; y: number } | null)[] {
  const { positions, targets } = curves.poses;
  const cam = new PerspectiveCamera(CAMERA_FOV_DEG, w / h);
  const p = new Vector3();
  return pins.map(({ u, v }, i) => {
    const at = positions[i + 1];
    const look = targets[i + 1];
    if (!at || !look) return null;
    cam.position.set(at.x, at.y, at.z);
    cam.up.set(0, 1, 0);
    cam.lookAt(look.x, look.y, look.z);
    cam.updateMatrixWorld();
    const a = anchorAt(metres, gridSize, u, v, 1);
    p.set(a.x, a.y, a.z).applyMatrix4(cam.matrixWorldInverse);
    if (!(p.z < 0)) return null;
    p.set(a.x, a.y, a.z).project(cam);
    return { x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h };
  });
}

/**
 * The wide stages' view offsets (G-09-3 a, 09-21): for each waypoint,
 * natural - waypointTarget (its card, its label size and the rail marks at its
 * plateau, on the w x h stage). No offset without geometry or for an anchor
 * behind its stage camera.
 */
function wideStageOffsets(
  naturals: readonly ({ x: number; y: number } | null)[],
  pins: readonly PinAnchor[],
  geometry: StageGeometry | null,
  w: number,
  h: number
): { x: number; y: number }[] {
  return pins.map(({ k }, i) => {
    const natural = naturals[i];
    if (!natural || !geometry) return { x: 0, y: 0 };
    const target = waypointTarget({
      natural,
      card: geometry.cards[k - 1] ?? null,
      label: geometry.labels[k - 1] ?? null,
      obstacles: railObstaclesAt(geometry.rail, k),
      stage: { w, h },
    });
    return { x: natural.x - target.x, y: natural.y - target.y };
  });
}

/**
 * Moves each 3D pin mark (waypoints, then the summit) to its projected anchor
 * on a w x h stage at relief `relief`, or hides it. The lit waypoint mark
 * (data-active) gets its label placed by placePinLabel from `geometry` (its
 * card and the rail marks at its plateau): data-label and --pin-label-dx. The
 * unlit marks keep whatever they had; their labels are not shown.
 */
function placePins(
  camera: PerspectiveCamera,
  marks: readonly (HTMLDivElement | null)[],
  pins: readonly PinAnchor[],
  metres: Float32Array,
  gridSize: number,
  relief: number,
  w: number,
  h: number,
  geometry: StageGeometry | null
) {
  for (let i = 0; i <= pins.length; i++) {
    const mark = marks[i];
    if (!mark) continue;
    const { u, v } = i < pins.length ? pins[i] : terrain.summit.uv;
    const a = anchorAt(metres, gridSize, u, v, relief);
    point.set(a.x, a.y, a.z).project(camera);
    const x = ((point.x + 1) / 2) * w;
    const y = ((1 - point.y) / 2) * h;
    const shown =
      point.z > -1 &&
      point.z < 1 &&
      x >= -OFFSTAGE_SHARE * w &&
      x <= (1 + OFFSTAGE_SHARE) * w &&
      y >= -OFFSTAGE_SHARE * h &&
      y <= (1 + OFFSTAGE_SHARE) * h;
    // '' inherits the layer's visibility (invisible until '3d'); 'visible' would override it.
    mark.style.visibility = shown ? '' : 'hidden';
    if (!shown) continue;
    mark.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    if (i < pins.length && geometry && mark.hasAttribute('data-active')) {
      const k = pins[i].k;
      const label = geometry.labels[k - 1];
      if (!label) continue;
      const card = geometry.cards[k - 1];
      const cards = card ? [card] : [];
      const { side, dx } = placePinLabel({
        anchor: { x, y },
        label,
        obstacles: [...cards, ...railObstaclesAt(geometry.rail, k)],
        covers: cards,
        bounds: { x0: 0, y0: 0, x1: w, y1: h },
      });
      mark.dataset.label = side;
      mark.style.setProperty('--pin-label-dx', `${dx}px`);
    }
  }
}

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
  pinsRef,
  onDprStepDown,
}: {
  /** The waypoint anchors, in ascent order. */
  pins: readonly PinAnchor[];
  /** The decoded mesh heights (gridSize² values), or null before they arrive. */
  metres: Float32Array | null;
  gridSize: 256 | 512;
  /** The live terrain material, for uRelief and uExaggeration. */
  shaderRef: RefObject<ShaderMaterial | null>;
  /** The PinLayer3D marks: waypoints in ascent order, then the summit. */
  pinsRef: RefObject<(HTMLDivElement | null)[]>;
  /** Called when the frame budget drops the pixel ratio to 1, so the canvas keeps it there. */
  onDprStepDown?: () => void;
}) {
  const { progress, layout, stageRef, revealed, geometry, subscribeGeometry } = useAscent();
  const invalidate = useThree((s) => s.invalidate);
  const setDpr = useThree((s) => s.setDpr);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const applied = useRef(Number.NaN);
  /** Width of the rail scrim (0 below 768 px, where the rail is hidden), measured per stage size. */
  const railZone = useRef(0);
  /** matchMedia(WIDE_MEDIA).matches, or null before the first read. */
  const wide = useRef<boolean | null>(null);
  /** True when the last frame asked for another one (state.invalidate in useFrame). */
  const requested = useRef(false);
  /** The running reveal-burst budget, or null when no burst runs. */
  const budget = useRef<ReturnType<typeof createFrameBudget> | null>(null);
  /** When the current burst's first frame ran (performance.now()), or -1 before it. */
  const burstStart = useRef(-1);
  /** The burst has started for this canvas (it runs once, plus one re-measure at pixel ratio 1). */
  const measured = useRef(false);
  /** A burst was cut short by a pause and starts over when the canvas shows again. */
  const burstPaused = useRef(false);
  /** The stage intersects the viewport (IntersectionObserver). */
  const onScreen = useRef(true);
  /** The tab is visible (document.visibilityState). */
  const visible = useRef(true);

  useEffect(() => {
    const scrim = stageRef.current?.querySelector<HTMLElement>('[data-ascent-rail-scrim]');
    railZone.current = scrim?.offsetWidth ?? 0;
    invalidate();
  }, [width, height, stageRef, invalidate]);

  // Narrow versus wide on the CSS md breakpoint's width source (G-09-2, 09-20).
  useEffect(() => {
    const query = window.matchMedia(WIDE_MEDIA);
    const read = () => {
      wide.current = query.matches;
      invalidate();
    };
    read();
    query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, [invalidate]);

  // A new layout measurement (the plaque box) re-frames the summit.
  useEffect(() => subscribeGeometry(() => invalidate()), [subscribeGeometry, invalidate]);

  const curves = useMemo(() => {
    if (!metres || !(width > 0 && height > 0)) return null;
    return routeCurvesFor({ width, height, anchors: pins, metres, gridSize });
  }, [metres, gridSize, pins, width, height]);

  /** The waypoint cluster's tangent bounds from the summit key pose, once per route build. */
  const summitBounds = useMemo(
    () => (curves && metres ? summitTangentBounds(curves, pins, metres, gridSize) : null),
    [curves, pins, metres, gridSize]
  );

  /** Each waypoint's natural position at its stage key pose, once per route build and stage size. */
  const naturals = useMemo(
    () =>
      curves && metres && width > 0 && height > 0
        ? stageNaturals(curves, pins, metres, gridSize, width, height)
        : null,
    [curves, pins, metres, gridSize, width, height]
  );
  /** The wide stage offsets for the current naturals and geometry measurement (recomputed when either changes). */
  const stageOffsets = useRef<{
    naturals: ReturnType<typeof stageNaturals>;
    geometry: StageGeometry | null;
    offsets: { x: number; y: number }[];
  } | null>(null);

  useEffect(() => invalidate(), [curves, invalidate]);

  // The reveal burst: once per canvas, when the mesh is on screen and the route is built.
  const ready = revealed && curves !== null;
  useEffect(() => {
    if (!ready || measured.current) return;
    measured.current = true;
    budget.current = createFrameBudget();
    burstStart.current = -1;
    invalidate();
  }, [ready, invalidate]);
  useMotionValueEvent(progress, 'change', () => {
    if (onScreen.current && visible.current) invalidate();
  });

  // Pause while the stage is off-screen or the tab is hidden (HOME-07).
  useEffect(() => {
    const shown = () => onScreen.current && visible.current;
    /** Applies a flag change: drop a running burst on the way out, catch up (and restart it) on the way back. */
    const update = (change: () => void) => {
      const was = shown();
      change();
      if (was && !shown()) {
        // No frame runs while the tab is hidden (rAF is suspended), so the burst is
        // dropped here, not in useFrame: the frame after the show would otherwise
        // feed the stale budget and read the pause as slow frames (G-09-5, WR-01).
        if (budget.current) {
          budget.current = null;
          burstStart.current = -1;
          burstPaused.current = true;
        }
        return;
      }
      if (was || !shown()) return;
      if (burstPaused.current) {
        burstPaused.current = false;
        budget.current = createFrameBudget();
        burstStart.current = -1;
      }
      invalidate();
    };
    const readVisibility = () => {
      visible.current = document.visibilityState !== 'hidden';
    };
    const onVisibility = () => update(readVisibility);
    update(readVisibility);
    document.addEventListener('visibilitychange', onVisibility);
    const stage = stageRef.current;
    const observer =
      stage && typeof IntersectionObserver === 'function'
        ? new IntersectionObserver((entries) => {
            const entry = entries[entries.length - 1];
            if (entry) update(() => (onScreen.current = entry.isIntersecting));
          })
        : null;
    if (stage) observer?.observe(stage);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  }, [stageRef, invalidate]);

  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera;
    const { width: w, height: h } = state.size;
    if (!(w > 0 && h > 0)) return;
    const p = progress.get();
    const arrivals = layout.current?.arrivals;
    const material = shaderRef.current;

    let tilt = 0;
    if (!curves || !arrivals) {
      applyPose(camera, planViewPose(posterFrame(w, h), W, CAMERA_FOV_DEG));
      if (material) material.uniforms.uRelief.value = 0;
    } else {
      const first = arrivals[0];
      const t = curveParamAt(p, arrivals);
      tilt = reliefAt(p, first);
      poseAt(curves, t, scratch);
      camera.position.copy(scratch.position);
      camera.up.copy(up.set(0, tilt, -(1 - tilt)).normalize());
      camera.lookAt(scratch.target);
      // Before the first media read, fall back to the canvas width.
      const narrow = !(wide.current ?? w >= 768);
      const stage = { w, h };
      const maxFocalPx = w / 2 / Math.tan((summitHfovDeg(narrow) * Math.PI) / 360);
      const fit = fitCluster({
        bounds: summitBounds ?? { a0: 0, a1: 0, b0: 0, b1: 0 },
        stage,
        rects: summitClearRects(
          stage,
          geometry.current?.plaque ?? null,
          railZone.current,
          SUMMIT_FRAME_MARGIN_PX
        ),
        maxFocalPx,
      });
      // Wide stages: the measured offsets, recomputed only for a new route build,
      // stage size or geometry measurement (G-09-3 a, 09-21; T-09-32).
      let wideOffsets: { x: number; y: number }[] | undefined;
      if (!narrow && naturals) {
        const g = geometry.current ?? null;
        const cached = stageOffsets.current;
        if (!cached || cached.naturals !== naturals || cached.geometry !== g) {
          stageOffsets.current = {
            naturals,
            geometry: g,
            offsets: wideStageOffsets(naturals, pins, g, w, h),
          };
        }
        wideOffsets = stageOffsets.current!.offsets;
      }
      const keys = stageViewKeys({
        n: pins.length,
        narrow,
        stage,
        summit: { x: fit.offsetX, y: fit.offsetY, fov: fit.fovDeg },
        wideStageOffsets: wideOffsets,
      });
      const { x, y, fov } = viewTrackAt(keys, t);
      camera.fov = fov;
      if (x !== 0 || y !== 0) camera.setViewOffset(w, h, x, y, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      if (material) {
        material.uniforms.uRelief.value = tilt;
        material.uniforms.uExaggeration.value = RELIEF_EXAGGERATION;
      }
    }
    camera.updateMatrixWorld();
    if (metres) {
      placePins(camera, pinsRef.current, pins, metres, gridSize, tilt, w, h, geometry.current);
    }

    const continuous = requested.current;
    requested.current = false;
    const shown = onScreen.current && visible.current;
    let burst = false;
    const running = budget.current;
    if (running && !shown) {
      // Fallback for a frame that runs while not shown (off-screen): update() drops
      // the burst on the flag change; drop the samples and measure again once shown.
      budget.current = null;
      burstStart.current = -1;
      burstPaused.current = true;
    } else if (running) {
      const now = performance.now();
      if (burstStart.current < 0) burstStart.current = now;
      const verdict = running.sample(now, continuous);
      const dpr = state.viewport.dpr;
      if (verdict !== 'pending') {
        markBudget(verdict, running, dpr);
        budget.current = null;
        if (verdict === 'decline' && budgetMeasureOnly()) {
          // Measure-only (e2e): the verdict is recorded, nothing acts on it.
        } else if (verdict === 'decline' && dpr > 1) {
          // One step down before the static fallback: measure again at pixel ratio 1.
          setDpr(1);
          onDprStepDown?.();
          budget.current = createFrameBudget();
          burstStart.current = -1;
        } else if (verdict === 'decline') {
          downgradeAscent('frame-budget');
        }
      }
      burst = budget.current !== null || now - burstStart.current < BURST_MIN_MS;
    } else if (burstStart.current >= 0) {
      burst = performance.now() - burstStart.current < BURST_MIN_MS;
    }

    const moved = !(Math.abs(p - applied.current) <= EPS);
    applied.current = p;
    if (shown && (moved || burst)) {
      requested.current = true;
      state.invalidate();
    }
  });

  return null;
}
