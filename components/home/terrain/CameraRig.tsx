'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useMotionValueEvent } from 'motion/react';
import { Vector3, type PerspectiveCamera, type ShaderMaterial } from 'three';
import { useAscent } from '@/components/home/AscentController';
import { terrain } from '@/data/generated/terrain';
import { DURATION } from '@/lib/animations';
import { createFrameBudget, type FrameBudgetVerdict } from '@/lib/ascent/frame-budget';
import { posterFrame } from '@/lib/ascent/poster-frame';
import {
  CAMERA_FOV_DEG,
  RELIEF_EXAGGERATION,
  SUMMIT_HFOV_DEG,
  curveParamAt,
  fovAt,
  planViewPose,
  reliefAt,
  summitVerticalFov,
  viewOffsetAt,
  viewOffsetXAt,
  type PinAnchor,
  type Pose,
} from '@/lib/ascent/route';
import { downgradeAscent } from '@/lib/useAscentMode';
import { anchorAt, poseAt, routeCurvesFor } from './route-curve';

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
 * the view offset ramps in: up, so targets sit above the docked card (D-20),
 * and right, so the stage's waypoint sits at 30 % of the width with room for
 * its label on the right. All three are 0 at p = 0, so the canvas
 * still equals the poster there, and complete at the start of waypoint 1's
 * plateau. The vertical FOV widens across the last leg to summitVerticalFov
 * (aspect, 60°), so the summit frame shows every waypoint on a phone too (D-03).
 *
 * Until the metres arrive (the canvas is still invisible) or the layout is
 * measured, the camera holds the plan view.
 *
 * 3D pins (D-09, corrections C3 and C5): after the pose update, each anchor
 * (uvToWorld, meshHeightAtUv x uRelief x RELIEF_EXAGGERATION: the rendered
 * surface, not the DEM height) is projected through the camera and its
 * PinLayer3D mark is moved with a transform. A mark is hidden while its point
 * is behind the camera or beyond the depth range (NDC z outside (-1, 1)) or
 * more than 10 % outside the stage. A waypoint label flips to the left of its
 * head within 240 px of the clear stage edge (the stage's right edge, or the
 * rail scrim's left edge from 768 px), the rule AscentController applies to
 * the poster pins. Lighting stays with AscentController.
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
 */

/** Progress change below which no further frame is needed (D-06). */
const EPS = 1e-4;
/** Stages narrower than this dock the card over the lower part (D-20) and get the view offset. */
const NARROW_STAGE_PX = 768;
/** A pin head this close to the clear stage edge shows its label on the left (as AscentController). */
const FLIP_PX = 240;
/** A pin whose anchor is further outside the stage than this share of its size is hidden. */
const OFFSTAGE_SHARE = 0.1;
const W = terrain.extent.widthM;
/** The shortest reveal burst: the canvas fade (DURATION.settle), in ms. */
const BURST_MIN_MS = DURATION.settle * 1000;

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
 * Moves each 3D pin mark (waypoints, then the summit) to its projected anchor
 * on a w x h stage at relief `relief`, or hides it. `edge` is the clear stage
 * edge for the label flip.
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
  edge: number
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
    if (i < pins.length) mark.toggleAttribute('data-flip', edge - x < FLIP_PX);
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
  const { progress, layout, stageRef, revealed } = useAscent();
  const invalidate = useThree((s) => s.invalidate);
  const setDpr = useThree((s) => s.setDpr);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const applied = useRef(Number.NaN);
  /** Width of the rail scrim (0 below 768 px, where the rail is hidden), measured per stage size. */
  const railZone = useRef(0);
  /** True when the last frame asked for another one (state.invalidate in useFrame). */
  const requested = useRef(false);
  /** The running reveal-burst budget, or null when no burst runs. */
  const budget = useRef<ReturnType<typeof createFrameBudget> | null>(null);
  /** When the current burst's first frame ran (performance.now()), or -1 before it. */
  const burstStart = useRef(-1);
  /** The burst has started for this canvas (it runs once, plus one re-measure at pixel ratio 1). */
  const measured = useRef(false);

  useEffect(() => {
    const scrim = stageRef.current?.querySelector<HTMLElement>('[data-ascent-rail-scrim]');
    railZone.current = scrim?.offsetWidth ?? 0;
    invalidate();
  }, [width, height, stageRef, invalidate]);

  const curves = useMemo(() => {
    if (!metres || !(width > 0 && height > 0)) return null;
    return routeCurvesFor({ width, height, anchors: pins, metres, gridSize });
  }, [metres, gridSize, pins, width, height]);

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
  useMotionValueEvent(progress, 'change', () => invalidate());

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
      camera.fov = fovAt(t, pins.length, summitVerticalFov(w / h, SUMMIT_HFOV_DEG));
      if (w < NARROW_STAGE_PX) {
        const x = viewOffsetXAt(p, first, true, w);
        camera.setViewOffset(w, h, x, viewOffsetAt(p, first, true, h), w, h);
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
    if (metres) {
      placePins(camera, pinsRef.current, pins, metres, gridSize, tilt, w, h, w - railZone.current);
    }

    const continuous = requested.current;
    requested.current = false;
    let burst = false;
    const running = budget.current;
    if (running) {
      const now = performance.now();
      if (burstStart.current < 0) burstStart.current = now;
      const verdict = running.sample(now, continuous);
      const dpr = state.viewport.dpr;
      if (verdict !== 'pending') {
        markBudget(verdict, running, dpr);
        budget.current = null;
        if (verdict === 'decline' && dpr > 1) {
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
    if (moved || burst) {
      requested.current = true;
      state.invalidate();
    }
  });

  return null;
}
