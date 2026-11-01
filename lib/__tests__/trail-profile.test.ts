/**
 * D-05 trail profile maths (RESEARCH Pattern 4): arc length, equal arc-length
 * resampling, 0..1 normalisation at 3 decimals and the SVG path strings the
 * route panels draw. ENG-01 adjacency edge: equal heights throw instead of
 * dividing by zero, and a repeated vertex never yields a duplicate station.
 */
import {
  normaliseProfile,
  polylineLength,
  profilePath,
  resampleByArcLength,
} from '@/lib/trail-profile';

/** True when `v` has at most three decimals. */
function hasAtMost3Decimals(v: number): boolean {
  return Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6;
}

describe('polylineLength', () => {
  test('a 3-4-5 segment is 5 m long', () => {
    expect(polylineLength([
      [0, 0],
      [3, 4],
    ])).toBe(5);
  });

  test('sums every segment of a multi-vertex line', () => {
    expect(polylineLength([
      [0, 0],
      [3, 4],
      [3, 10],
    ])).toBe(11);
  });

  test('a single point throws a RangeError', () => {
    expect(() => polylineLength([[0, 0]])).toThrow(RangeError);
  });
});

describe('resampleByArcLength', () => {
  const LINE: [number, number][] = [
    [0, 0],
    [10, 0],
  ];

  test('a 10 m straight line to 5 stations lands every 2.5 m', () => {
    const out = resampleByArcLength(LINE, 5);
    expect(out.map(([e]) => e)).toEqual([0, 2.5, 5, 7.5, 10]);
    expect(out.every(([, n]) => n === 0)).toBe(true);
  });

  test('the first and last stations equal the first and last vertex exactly', () => {
    const line: [number, number][] = [
      [2617001.3, 1090002.7],
      [2617100.1, 1090050.9],
      [2617250.4, 1090300.2],
    ];
    const out = resampleByArcLength(line, 128);
    expect(out).toHaveLength(128);
    expect(out[0]).toEqual(line[0]);
    expect(out[127]).toEqual(line[2]);
  });

  test('a repeated vertex resamples without a duplicate station', () => {
    const line: [number, number][] = [
      [0, 0],
      [5, 0],
      [5, 0],
      [10, 0],
    ];
    const out = resampleByArcLength(line, 5);
    expect(out.map(([e]) => e)).toEqual([0, 2.5, 5, 7.5, 10]);
    const keys = out.map(([e, n]) => `${e},${n}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(out.flat().every(Number.isFinite)).toBe(true);
  });

  test('fewer than two stations throws a RangeError', () => {
    expect(() => resampleByArcLength(LINE, 1)).toThrow(RangeError);
  });
});

describe('normaliseProfile', () => {
  test('maps distance and height linearly onto 0..1', () => {
    expect(normaliseProfile([0, 50, 100], [2600, 2650, 2700])).toEqual([
      { x: 0, y: 0 },
      { x: 0.5, y: 0.5 },
      { x: 1, y: 1 },
    ]);
  });

  test('every value has at most 3 decimals', () => {
    const out = normaliseProfile([0, 1, 2, 3], [1000, 1001, 1002.5, 1003]);
    for (const { x, y } of out) {
      expect(hasAtMost3Decimals(x)).toBe(true);
      expect(hasAtMost3Decimals(y)).toBe(true);
    }
    expect(out[1].x).toBe(0.333);
  });

  test('equal heights throw a RangeError instead of dividing by zero', () => {
    expect(() => normaliseProfile([0, 50, 100], [2600, 2600, 2600])).toThrow(RangeError);
  });

  test('mismatched lengths throw a RangeError', () => {
    expect(() => normaliseProfile([0, 50, 100], [2600, 2700])).toThrow(RangeError);
  });
});

describe('profilePath', () => {
  const RISE = [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ];

  test('the line starts at the bottom left and ends at the top right of the default box', () => {
    const { line } = profilePath(RISE);
    expect(line.startsWith('M0 88')).toBe(true);
    expect(line.endsWith('320 8')).toBe(true);
  });

  test('the area follows the line and closes back along y 88', () => {
    const { line, area } = profilePath(RISE);
    expect(area.startsWith(line)).toBe(true);
    expect(area).toBe(`${line}L320 88L0 88Z`);
  });

  test('the baseline runs from x 0 to x 320 at y 88', () => {
    expect(profilePath(RISE).baseline).toBe('M0 88L320 88');
  });

  test('a custom box scales x to its width and y inside its inset', () => {
    const { line, baseline } = profilePath(RISE, { w: 100, h: 50, inset: 5 });
    expect(line).toBe('M0 45L100 5');
    expect(baseline).toBe('M0 45L100 45');
  });
});
