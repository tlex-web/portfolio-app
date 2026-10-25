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
  PIN_HEAD_PX,
  pinBoxes,
  placePinLabel,
  railObstaclesAt,
  type Box,
  type RailGeometry,
} from '@/lib/ascent/framing';

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
