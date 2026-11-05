/**
 * HOME-03, HOME-04 (D-01, D-05, D-06; 09-UI-SPEC "Ascent Mapping" and
 * "Altimeter Rail"): the pure ascent mapping behind the one damped progress
 * value. Scroll offset -> progress p over the measured layout; p -> rail
 * altitude, rail position, lit pin and the large-jump snap rule.
 *
 * The constants generalise from n = 4 (pin window 1 / (2(n + 1)), summit view
 * from (p_n + 1) / 2); the nominal four-photo values 0.1 and 0.9 are asserted
 * here so the UI-SPEC table stays true.
 */
import {
  PLATEAU,
  activePin,
  altitudeAt,
  arrivalsFromBlocks,
  mapProgress,
  pinWindow,
  railFraction,
  shouldSnap,
  snapThreshold,
  type AscentLayout,
} from '@/lib/ascent/progress';

/** Nominal arrivals for four waypoints and the summit, each block one stage high. */
const ARRIVALS = [0.2, 0.4, 0.6, 0.8, 1] as const;
const HEIGHTS = [1617, 1668, 2585, 2760, 4478] as const;

describe('arrivalsFromBlocks (measured arrival points)', () => {
  it('gives 0.2, 0.4, 0.6, 0.8 and 1 for the nominal layout', () => {
    const blocks = [1, 2, 3, 4, 5].map((offset) => ({ offset, height: 1 }));
    const arrivals = arrivalsFromBlocks(blocks, 1, 5);
    expect(arrivals).toHaveLength(5);
    arrivals.forEach((a, i) => expect(a).toBeCloseTo(ARRIVALS[i], 12));
  });

  it('follows a taller hero block and keeps the summit at 1', () => {
    const blocks = [1.3, 2.3, 3.3, 4.3, 5.3].map((offset) => ({ offset, height: 1 }));
    const arrivals = arrivalsFromBlocks(blocks, 1, 5.3);
    [1.3, 2.3, 3.3, 4.3, 5.3].forEach((o, i) => expect(arrivals[i]).toBeCloseTo(o / 5.3, 12));
    expect(arrivals[4]).toBe(1);
  });

  it('clamps arrivals into [0, 1]', () => {
    expect(
      arrivalsFromBlocks(
        [
          { offset: -5, height: 1 },
          { offset: 50, height: 1 },
        ],
        1,
        5
      )
    ).toEqual([0, 1]);
  });

  it('throws a RangeError on a non-positive distance', () => {
    expect(() => arrivalsFromBlocks([{ offset: 1, height: 1 }], 1, 0)).toThrow(RangeError);
    expect(() => arrivalsFromBlocks([{ offset: 1, height: 1 }], 1, -2)).toThrow(RangeError);
  });
});

describe('mapProgress (page scroll -> p)', () => {
  const layout: AscentLayout = { start: 400, distance: 1000, arrivals: ARRIVALS };

  it('is 0 before the sticky phase, linear inside it and 1 after it', () => {
    expect(mapProgress(layout.start - 10, layout)).toBe(0);
    expect(mapProgress(layout.start + layout.distance / 2, layout)).toBe(0.5);
    expect(mapProgress(layout.start + layout.distance + 10, layout)).toBe(1);
  });

  it('throws a RangeError on a non-positive distance', () => {
    expect(() => mapProgress(0, { ...layout, distance: 0 })).toThrow(RangeError);
  });
});

describe('altitudeAt (rail readout, D-01)', () => {
  it.each([
    [0, 1617],
    [0.2, 1617],
    [0.23, 1617],
    [0.3, 1642.5],
    [0.4, 1668],
    [0.37, 1668],
    [0.6, 2585],
    [0.8, 2760],
    [0.97, 4478],
    [1, 4478],
  ])('p = %p -> %p m', (p, m) => {
    expect(altitudeAt(p, ARRIVALS, HEIGHTS)).toBeCloseTo(m, 9);
  });

  it('holds the first waypoint height through the tilt-in', () => {
    for (const p of [0, 0.05, 0.1, 0.17]) expect(altitudeAt(p, ARRIVALS, HEIGHTS)).toBe(1617);
  });

  it('includes the plateau edge p_k +/- PLATEAU despite floating-point sums', () => {
    expect(PLATEAU).toBe(0.03);
    expect(altitudeAt(0.4 - PLATEAU, ARRIVALS, HEIGHTS)).toBe(1668);
    expect(altitudeAt(0.4 + PLATEAU, ARRIVALS, HEIGHTS)).toBe(1668);
  });

  it('is continuous at the plateau edges and monotonic up the legs', () => {
    let last = -Infinity;
    for (let i = 0; i <= 1000; i += 1) {
      const m = altitudeAt(i / 1000, ARRIVALS, HEIGHTS);
      expect(m).toBeGreaterThanOrEqual(last);
      if (i > 0) expect(m - last).toBeLessThan(200);
      last = m;
    }
  });

  it('throws a RangeError when arrivals and heights differ in length', () => {
    expect(() => altitudeAt(0.5, ARRIVALS, [1, 2, 3])).toThrow(RangeError);
  });
});

describe('railFraction (evenly spaced route profile, D-01)', () => {
  it.each([
    [0, 0],
    [0.2, 0],
    [0.4, 0.25],
    [0.5, 0.375],
    [0.8, 0.75],
    [1, 1],
  ])('p = %p -> %p', (p, f) => {
    expect(railFraction(p, ARRIVALS)).toBeCloseTo(f, 9);
  });

  it('sits exactly on tick k / n inside each plateau', () => {
    expect(railFraction(0.6 - PLATEAU, ARRIVALS)).toBe(0.5);
    expect(railFraction(0.6 + PLATEAU, ARRIVALS)).toBe(0.5);
  });
});

describe('activePin (lit pin, D-09)', () => {
  it('uses a window of 1 / (2(n + 1)): 0.1 for four photos', () => {
    expect(pinWindow(4)).toBe(0.1);
  });

  it.each([
    [0.2, 1],
    [0.4, 2],
    [0.12, 1],
    [0.1, null],
    [0.3, null],
    [0.85, 4],
    [0.9, null],
    [1, null],
  ])('p = %p -> %p', (p, k) => {
    expect(activePin(p, ARRIVALS)).toBe(k);
  });

  it('gives a tie to the lower k and otherwise picks the nearer arrival', () => {
    const touching = [0.2, 0.3, 0.6, 0.8, 1];
    expect(activePin(0.25, touching)).toBe(1);
    expect(activePin(0.26, touching)).toBe(2);
  });
});

describe('shouldSnap (large jumps, D-06)', () => {
  it('uses a threshold of one leg, 1 / (n + 1)', () => {
    expect(snapThreshold(4)).toBe(0.2);
  });

  it('animates a jump of exactly one leg and snaps anything larger', () => {
    expect(shouldSnap(0, 0.2, 4)).toBe(false);
    expect(shouldSnap(0.3, 0.1, 4)).toBe(false);
    expect(shouldSnap(0, 0.21, 4)).toBe(true);
    expect(shouldSnap(1, 0.2, 4)).toBe(true);
  });
});
