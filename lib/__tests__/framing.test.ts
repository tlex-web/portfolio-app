/**
 * G-09-3 (a), 09-19 (D-07, D-09 and its 2026-10-25 amendment;
 * .planning/debug/waypoint2-label-and-kicker.md part a): the pin label
 * placement rules in lib/ascent/framing.ts, on plain boxes.
 *
 * The reference pin has its anchor (stem foot) at (100, 100) on a 400 x 400
 * stage: mark x 88-112, y 60-100; head y 60-84 (centre 100, 72). A 50 x 20
 * label sits at x 120-170, y 62-82 on the right, x 30-80 on the left, y 36-56
 * above and y 104-124 below; above and below try dx -13 (centred), 0 (head
 * left) and -26 (head right).
 */
import {
  LABEL_MARGIN_PX,
  NARROW_VIEW_OFFSET_X_SHARE,
  NARROW_VIEW_OFFSET_Y_SHARE,
  PIN_HEAD_PX,
  STAGE_FOV_DEG,
  SUMMIT_FRAME_MARGIN_PX,
  fitCluster,
  pinBoxes,
  placePinLabel,
  railObstaclesAt,
  stageViewKeys,
  summitClearRects,
  viewTrackAt,
  type Box,
  type RailGeometry,
  type TangentBounds,
} from '@/lib/ascent/framing';
import { curveParamAt, reliefAt } from '@/lib/ascent/route';

const BOUNDS: Box = { x0: 0, y0: 0, x1: 400, y1: 400 };
const ANCHOR = { x: 100, y: 100 };
const LABEL = { w: 50, h: 20 };
/** Blocks the right label (x 120-170, y 62-82) and nothing above or below. */
const RIGHT_BLOCK: Box = { x0: 130, y0: 60, x1: 200, y1: 84 };
/** Blocks the left label (x 30-80, y 62-82) and nothing above or below. */
const LEFT_BLOCK: Box = { x0: 0, y0: 60, x1: 75, y1: 84 };
/** Blocks every label above the mark (y 36-56). */
const ABOVE_BLOCK: Box = { x0: 0, y0: 0, x1: 400, y1: 50 };

const place = (obstacles: Box[], covers: Box[] = [], anchor = ANCHOR, label = LABEL) =>
  placePinLabel({ anchor, label, obstacles, covers, bounds: BOUNDS });

describe('pinBoxes', () => {
  it('puts the 24 x 40 mark above the anchor and the 24 px head at its top', () => {
    expect(pinBoxes(100, 100)).toEqual({
      mark: { x0: 88, y0: 60, x1: 112, y1: 100 },
      head: { x0: 88, y0: 60, x1: 112, y1: 84 },
    });
  });
});

describe('placePinLabel', () => {
  it('places the label right of the head when that is clear', () => {
    expect(place([])).toEqual({ side: 'right', dx: PIN_HEAD_PX + 8, clear: true });
  });

  it('places it left of the head when an obstacle sits on the right', () => {
    expect(place([RIGHT_BLOCK])).toEqual({ side: 'left', dx: -8 - LABEL.w, clear: true });
  });

  it('keeps the 4 px stage margin: a right label past the edge goes left', () => {
    expect(place([], [], { x: 360, y: 100 }).side).toBe('left');
  });

  it('goes above, centred on the head, when both sides are blocked', () => {
    expect(place([RIGHT_BLOCK, LEFT_BLOCK])).toEqual({ side: 'above', dx: -13, clear: true });
  });

  it('aligns an above label to the head left when centred is blocked', () => {
    const centredOnly: Box = { x0: 60, y0: 36, x1: 80, y1: 56 };
    expect(place([RIGHT_BLOCK, LEFT_BLOCK, centredOnly])).toEqual({
      side: 'above',
      dx: 0,
      clear: true,
    });
  });

  it('aligns an above label to the head right when centred and head left are blocked', () => {
    const rightOfHead: Box = { x0: 120, y0: 36, x1: 140, y1: 56 };
    expect(place([RIGHT_BLOCK, LEFT_BLOCK, rightOfHead])).toEqual({
      side: 'above',
      dx: PIN_HEAD_PX - LABEL.w,
      clear: true,
    });
  });

  it('goes below, centred, when both sides and every above placement are blocked', () => {
    expect(place([RIGHT_BLOCK, LEFT_BLOCK, ABOVE_BLOCK])).toEqual({
      side: 'below',
      dx: -13,
      clear: true,
    });
  });

  it('aligns a below label to the head left, then to the head right', () => {
    const sides = [RIGHT_BLOCK, LEFT_BLOCK, ABOVE_BLOCK];
    expect(place([...sides, { x0: 60, y0: 104, x1: 80, y1: 124 }])).toEqual({
      side: 'below',
      dx: 0,
      clear: true,
    });
    expect(place([...sides, { x0: 120, y0: 104, x1: 140, y1: 124 }])).toEqual({
      side: 'below',
      dx: PIN_HEAD_PX - LABEL.w,
      clear: true,
    });
  });

  it('clamps an above or below label into the bounds', () => {
    // Mark x 8-32: centred (dx -13) would start at x -5; clamped to the 4 px margin, dx -4.
    // Its right label (x 40-90) is blocked; its left label would leave the stage.
    const result = place([{ x0: 36, y0: 60, x1: 100, y1: 84 }], [], { x: 20, y: 100 });
    expect(result).toEqual({ side: 'above', dx: LABEL_MARGIN_PX - 8, clear: true });
  });

  it('keeps 4 px from obstacles: 3 px away blocks, 5 px away does not', () => {
    // The right label ends at x 170.
    expect(place([{ x0: 173, y0: 60, x1: 200, y1: 84 }]).side).toBe('left');
    expect(place([{ x0: 175, y0: 60, x1: 200, y1: 84 }]).side).toBe('right');
  });

  it('shows no label when the head centre lies inside a cover', () => {
    const cover: Box = { x0: 50, y0: 50, x1: 150, y1: 90 };
    expect(place([cover], [cover])).toEqual({ side: 'none', dx: 0, clear: false });
  });

  it('still labels a head that only overlaps a cover at its edge', () => {
    // Head x 88-112, centre x 100: the cover starts at x 108.
    const cover: Box = { x0: 108, y0: 0, x1: 200, y1: 200 };
    const result = place([cover], [cover]);
    expect(result.side).not.toBe('none');
    expect(result).toEqual({ side: 'left', dx: -8 - LABEL.w, clear: true });
  });

  it('falls back to the least-overlap candidate, with clear false, when nothing is clear', () => {
    // Everything down to y 98 (inflated 102) is blocked; below (y 104-124) meets the
    // second obstacle only from y 106 (inflated), 18 of its 20 rows.
    const top: Box = { x0: 0, y0: 0, x1: 400, y1: 98 };
    const bottom: Box = { x0: 0, y0: 110, x1: 400, y1: 400 };
    expect(place([top, bottom])).toEqual({ side: 'below', dx: -13, clear: false });
    // Full overlap everywhere: candidate order breaks the tie.
    expect(place([BOUNDS])).toEqual({ side: 'right', dx: PIN_HEAD_PX + 8, clear: false });
  });

  it('slides an above or below label along the head when no alignment is clear', () => {
    // Waypoint 4 at 768 x 900 (measured in 09-19): head x 628-652, inside the rail box
    // column. Centred crosses the rail line, head-left leaves the stage, head-right
    // meets the card; slid so its right edge is 4 px from the line, it fits below.
    const card: Box = { x0: 24, y0: 135, x1: 472, y1: 717 };
    const rail: RailGeometry = {
      ticks: [
        { x0: 643, y0: 778, x1: 726, y1: 798 },
        { x0: 643, y0: 593, x1: 726, y1: 613 },
        { x0: 643, y0: 408, x1: 726, y1: 428 },
        { x0: 576, y0: 223, x1: 726, y1: 243 },
        { x0: 643, y0: 38, x1: 726, y1: 58 },
      ],
      line: { x0: 725, y0: 48, x1: 726, y1: 788 },
      readout: { w: 85, h: 34 },
      railRight: 726,
      tickCentres: [788, 603, 418, 233, 48],
    };
    const result = placePinLabel({
      anchor: { x: 640, y: 493 },
      label: { w: 194.5, h: 30 },
      obstacles: [card, ...railObstaclesAt(rail, 4)],
      covers: [card],
      bounds: { x0: 0, y0: 0, x1: 758, y1: 836 },
    });
    expect(result.side).toBe('below');
    expect(result.clear).toBe(true);
    // Label right edge at the inflated line (721): 628 + dx + 194.5 = 721.
    expect(result.dx).toBeCloseTo(721 - 194.5 - 628, 6);
  });

  it("gives 'below' with dx 0 for waypoint 2 at 768 x 900 (stage 758 x 836)", () => {
    // .planning/debug/waypoint2-label-and-kicker.md Evidence 15:30 and 15:55: card x 24-472,
    // rail box x 566-726 (top-12 / bottom-12), five evenly spaced tick rows ending at x 726,
    // '2,760 m approx.' at y 223-243; pin 2 head x 487-511, y 248-272; label 184 x 30.
    const rail: RailGeometry = {
      ticks: [
        { x0: 650, y0: 778, x1: 726, y1: 798 },
        { x0: 650, y0: 593, x1: 726, y1: 613 },
        { x0: 650, y0: 408, x1: 726, y1: 428 },
        { x0: 576, y0: 223, x1: 726, y1: 243 },
        { x0: 650, y0: 38, x1: 726, y1: 58 },
      ],
      line: { x0: 725, y0: 48, x1: 726, y1: 788 },
      readout: { w: 90, h: 34 },
      railRight: 726,
      tickCentres: [788, 603, 418, 233, 48],
    };
    const card: Box = { x0: 24, y0: 180, x1: 472, y1: 656 };
    const result = placePinLabel({
      anchor: { x: 499, y: 288 },
      label: { w: 184, h: 30 },
      obstacles: [card, ...railObstaclesAt(rail, 2)],
      covers: [card],
      bounds: { x0: 0, y0: 0, x1: 758, y1: 836 },
    });
    expect(result).toEqual({ side: 'below', dx: 0, clear: true });
  });
});

describe('railObstaclesAt', () => {
  const tick0: Box = { x0: 200, y0: 190, x1: 300, y1: 210 };
  const tick1: Box = { x0: 200, y0: 90, x1: 300, y1: 110 };
  const line: Box = { x0: 299, y0: 50, x1: 300, y1: 250 };
  const rail: RailGeometry = {
    ticks: [tick0, tick1],
    line,
    readout: { w: 80, h: 30 },
    railRight: 300,
    tickCentres: [200, 100],
  };

  it('centres the readout and the marker on tick k - 1 at waypoint k', () => {
    expect(railObstaclesAt(rail, 2)).toEqual([
      tick0,
      tick1,
      line,
      { x0: 196, y0: 85, x1: 276, y1: 115 },
      { x0: 288, y0: 99, x1: 312, y1: 101 },
    ]);
    expect(railObstaclesAt(rail, 1).slice(3)).toEqual([
      { x0: 196, y0: 185, x1: 276, y1: 215 },
      { x0: 288, y0: 199, x1: 312, y1: 201 },
    ]);
  });

  it('has no readout or marker when the readout size is unknown', () => {
    expect(railObstaclesAt({ ...rail, readout: null }, 2)).toEqual([tick0, tick1, line]);
  });

  it('is empty for an empty rail (below 768 px)', () => {
    const empty: RailGeometry = {
      ticks: [],
      line: null,
      readout: null,
      railRight: null,
      tickCentres: [],
    };
    expect(railObstaclesAt(empty, 1)).toEqual([]);
  });
});

/*
 * G-09-2 (3D half), 09-20 (Tim: "Compact plaque + measured 3D"; D-03, D-16,
 * D-20): the measured summit framing on plain numbers. Pinhole model: an
 * anchor with tangents (tx, ty) shows at (w / 2 + F tx - offsetX,
 * h / 2 - F ty - offsetY); its pin box spans 12 px either side and 40 px above.
 */

/** The pin boxes' bounding box for a fit, from the pinhole model. */
function clusterBox(
  bounds: TangentBounds,
  stage: { w: number; h: number },
  fit: { fovDeg: number; offsetX: number; offsetY: number }
): Box {
  const F = stage.h / (2 * Math.tan((fit.fovDeg * Math.PI) / 360));
  const px = (tx: number) => stage.w / 2 + F * tx - fit.offsetX;
  const py = (ty: number) => stage.h / 2 - F * ty - fit.offsetY;
  return {
    x0: px(bounds.a0) - 12,
    y0: py(bounds.b1) - 40,
    x1: px(bounds.a1) + 12,
    y1: py(bounds.b0),
  };
}

const focalOf = (fovDeg: number, h: number) => h / (2 * Math.tan((fovDeg * Math.PI) / 360));

describe('fitCluster', () => {
  const STAGE = { w: 400, h: 400 };
  const BOUNDS: TangentBounds = { a0: -0.1, a1: 0.1, b0: -0.05, b1: 0.05 };
  const WHOLE: Box = { x0: 0, y0: 0, x1: 400, y1: 400 };

  it('caps F at maxFocalPx when the rectangle is wider than needed', () => {
    const fit = fitCluster({ bounds: BOUNDS, stage: STAGE, rects: [WHOLE], maxFocalPx: 500 });
    expect(focalOf(fit.fovDeg, STAGE.h)).toBeCloseTo(500, 9);
    expect(fit.rect).toEqual(WHOLE);
  });

  it('lowers F so the pin boxes fit a narrow rectangle exactly', () => {
    const rect: Box = { x0: 200, y0: 0, x1: 324, y1: 400 };
    const fit = fitCluster({ bounds: BOUNDS, stage: STAGE, rects: [rect], maxFocalPx: 1000 });
    expect(focalOf(fit.fovDeg, STAGE.h)).toBeCloseTo((124 - 24) / 0.2, 9);
    const box = clusterBox(BOUNDS, STAGE, fit);
    expect(box.x0).toBeCloseTo(rect.x0, 9);
    expect(box.x1).toBeCloseTo(rect.x1, 9);
  });

  it('centres the pin boxes on the rectangle centre (asymmetric cluster)', () => {
    const bounds: TangentBounds = { a0: 0.05, a1: 0.25, b0: -0.2, b1: -0.1 };
    const rect: Box = { x0: 40, y0: 30, x1: 260, y1: 330 };
    const fit = fitCluster({ bounds, stage: STAGE, rects: [rect], maxFocalPx: 600 });
    const box = clusterBox(bounds, STAGE, fit);
    expect((box.x0 + box.x1) / 2).toBeCloseTo(150, 9);
    expect((box.y0 + box.y1) / 2).toBeCloseTo(180, 9);
  });

  it('returns fovDeg = 2 atan(h / 2F)', () => {
    const fit = fitCluster({ bounds: BOUNDS, stage: STAGE, rects: [WHOLE], maxFocalPx: 500 });
    expect(fit.fovDeg).toBeCloseTo((2 * Math.atan(400 / 1000) * 180) / Math.PI, 9);
  });

  it('of two rectangles takes the one that allows the larger F, in either order', () => {
    const small: Box = { x0: 0, y0: 0, x1: 100, y1: 100 };
    const large: Box = { x0: 100, y0: 0, x1: 400, y1: 400 };
    for (const rects of [
      [small, large],
      [large, small],
    ]) {
      const fit = fitCluster({ bounds: BOUNDS, stage: STAGE, rects, maxFocalPx: 10000 });
      expect(fit.rect).toEqual(large);
    }
  });

  it('breaks an F tie (both capped) with the larger area', () => {
    const a: Box = { x0: 0, y0: 0, x1: 300, y1: 300 };
    const b: Box = { x0: 0, y0: 0, x1: 400, y1: 400 };
    const fit = fitCluster({ bounds: BOUNDS, stage: STAGE, rects: [a, b], maxFocalPx: 100 });
    expect(fit.rect).toEqual(b);
  });

  it('a zero-width cluster is constrained only by height and the cap', () => {
    const bounds: TangentBounds = { a0: 0.05, a1: 0.05, b0: -0.1, b1: 0.1 };
    const thin: Box = { x0: 100, y0: 0, x1: 130, y1: 240 };
    const fit = fitCluster({ bounds, stage: STAGE, rects: [thin], maxFocalPx: 2000 });
    expect(focalOf(fit.fovDeg, STAGE.h)).toBeCloseTo((240 - 40) / 0.2, 9);
    const capped = fitCluster({ bounds, stage: STAGE, rects: [thin], maxFocalPx: 300 });
    expect(focalOf(capped.fovDeg, STAGE.h)).toBeCloseTo(300, 9);
  });
});

describe('summitClearRects', () => {
  const M = SUMMIT_FRAME_MARGIN_PX;

  it('a bottom-docked compact plaque on a phone leaves only the rectangle above it', () => {
    const plaque: Box = { x0: 16, y0: 417, x1: 336, y1: 587 };
    expect(summitClearRects({ w: 365, h: 603 }, plaque, 0)).toEqual([
      { x0: M, y0: M, x1: 365 - M, y1: 417 - M },
    ]);
  });

  it('a left-centred full plaque gives a short rectangle above and the band right of it, clear of the rail zone', () => {
    const plaque: Box = { x0: 32, y0: 179, x1: 480, y1: 657 };
    expect(summitClearRects({ w: 1270, h: 836 }, plaque, 224)).toEqual([
      { x0: M, y0: M, x1: 1270 - 224 - M, y1: 179 - M },
      { x0: 480 + M, y0: M, x1: 1270 - 224 - M, y1: 836 - M },
    ]);
  });

  it('without a plaque is the stage less the rail zone and the margin', () => {
    expect(summitClearRects({ w: 1014, h: 704 }, null, 224, 10)).toEqual([
      { x0: 10, y0: 10, x1: 1014 - 224 - 10, y1: 704 - 10 },
    ]);
  });

  it('drops empty rectangles', () => {
    const cover: Box = { x0: 0, y0: 0, x1: 400, y1: 400 };
    expect(summitClearRects({ w: 400, h: 400 }, cover, 0)).toEqual([]);
  });
});

describe('stageViewKeys', () => {
  const SUMMIT = { x: -30, y: 55, fov: 70 };

  it('narrow stages move the optical centre 0.2 w right and 0.2 h up, at the stage FOV, until the summit key', () => {
    const keys = stageViewKeys({ n: 4, narrow: true, stage: { w: 400, h: 600 }, summit: SUMMIT });
    expect(keys).toHaveLength(6);
    expect(keys[0]).toEqual({ x: 0, y: 0, fov: STAGE_FOV_DEG });
    for (const key of keys.slice(1, 5)) {
      expect(key.x).toBeCloseTo(NARROW_VIEW_OFFSET_X_SHARE * 400, 12);
      expect(key.y).toBeCloseTo(NARROW_VIEW_OFFSET_Y_SHARE * 600, 12);
      expect(key.fov).toBe(STAGE_FOV_DEG);
    }
    expect(keys[5]).toEqual(SUMMIT);
  });

  it('wide stages take the given offsets, or none', () => {
    const given = stageViewKeys({
      n: 2,
      narrow: false,
      stage: { w: 1440, h: 836 },
      summit: SUMMIT,
      wideStageOffsets: [{ x: 12, y: -8 }],
    });
    expect(given.slice(1, 3)).toEqual([
      { x: 12, y: -8, fov: STAGE_FOV_DEG },
      { x: 0, y: 0, fov: STAGE_FOV_DEG },
    ]);
    const none = stageViewKeys({ n: 2, narrow: false, stage: { w: 1440, h: 836 }, summit: SUMMIT });
    expect(none).toEqual([
      { x: 0, y: 0, fov: STAGE_FOV_DEG },
      { x: 0, y: 0, fov: STAGE_FOV_DEG },
      { x: 0, y: 0, fov: STAGE_FOV_DEG },
      SUMMIT,
    ]);
  });
});

describe('viewTrackAt', () => {
  const KEYS = [
    { x: 0, y: 0, fov: 40 },
    { x: 10, y: 20, fov: 40 },
    { x: 10, y: 20, fov: 80 },
  ];

  it('is key 0 at t = 0 and the last key at t = 1', () => {
    expect(viewTrackAt(KEYS, 0)).toEqual(KEYS[0]);
    expect(viewTrackAt(KEYS, 1)).toEqual(KEYS[2]);
  });

  it('is linear inside a segment', () => {
    expect(viewTrackAt(KEYS, 0.25)).toEqual({ x: 5, y: 10, fov: 40 });
    expect(viewTrackAt(KEYS, 0.75)).toEqual({ x: 10, y: 20, fov: 60 });
  });

  it('clamps outside [0, 1]', () => {
    expect(viewTrackAt(KEYS, -1)).toEqual(KEYS[0]);
    expect(viewTrackAt(KEYS, 2)).toEqual(KEYS[2]);
  });

  it('ramps the narrow offsets in exactly like reliefAt over the first segment (D-16, D-20)', () => {
    const arrivals = [0.2, 0.4, 0.6, 0.8, 1];
    const [w, h] = [402, 775];
    const keys = stageViewKeys({
      n: 4,
      narrow: true,
      stage: { w, h },
      summit: { x: 0, y: 0, fov: 60 },
    });
    expect(viewTrackAt(keys, curveParamAt(0, arrivals))).toEqual({
      x: 0,
      y: 0,
      fov: STAGE_FOV_DEG,
    });
    for (let i = 0; i <= 40; i++) {
      const p = (i / 40) * arrivals[0];
      const key = viewTrackAt(keys, curveParamAt(p, arrivals));
      const r = reliefAt(p, arrivals[0]);
      expect(key.x).toBeCloseTo(r * NARROW_VIEW_OFFSET_X_SHARE * w, 9);
      expect(key.y).toBeCloseTo(r * NARROW_VIEW_OFFSET_Y_SHARE * h, 9);
      expect(key.fov).toBeCloseTo(STAGE_FOV_DEG, 9);
    }
    // The stage plateau has the full D-20 offsets.
    const plateau = viewTrackAt(keys, curveParamAt(arrivals[1], arrivals));
    expect(plateau.x).toBeCloseTo(NARROW_VIEW_OFFSET_X_SHARE * w, 9);
    expect(plateau.y).toBeCloseTo(NARROW_VIEW_OFFSET_Y_SHARE * h, 9);
  });
});
