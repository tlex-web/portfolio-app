/**
 * D-16 poster shading: Horn-method hillshade (RESEARCH Code Example 4), the
 * 0.75/0.25 blend and 8-bit conversion. Light from the NW (azimuth 315,
 * altitude 45) by default, swisstopo/Imhof convention.
 */
import { blendShades, hillshade, toGrey8 } from '@/lib/terrain/hillshade';

const W = 8;
const H = 8;
const CELL = 10;

/** A plane whose height changes by `dx` per column (east) and `dy` per row (south). */
const plane = (dx: number, dy: number) =>
  Float32Array.from({ length: W * H }, (_, i) => (i % W) * dx + Math.floor(i / W) * dy);

describe('hillshade', () => {
  test('a flat grid is uniform', () => {
    const s = hillshade(new Float32Array(W * H).fill(1234), W, H, CELL);
    expect(Math.max(...s) - Math.min(...s)).toBeLessThan(1e-9);
    expect(s[0]).toBeCloseTo(Math.cos(Math.PI / 4), 6);
  });

  test('a NW-facing slope (rising to the SE) is brighter than the mirrored SE-facing slope', () => {
    const nwFacing = hillshade(plane(5, 5), W, H, CELL);
    const seFacing = hillshade(plane(-5, -5), W, H, CELL);
    for (let i = 0; i < W * H; i++) expect(nwFacing[i]).toBeGreaterThan(seFacing[i]);
  });

  test('defaults are azimuth 315, altitude 45, z 1', () => {
    const h = plane(3, -2);
    expect(hillshade(h, W, H, CELL)).toEqual(hillshade(h, W, H, CELL, 315, 45, 1));
  });

  test('a west light favours the west-facing slope', () => {
    const westFacing = hillshade(plane(5, 0), W, H, CELL, 270, 45);
    const eastFacing = hillshade(plane(-5, 0), W, H, CELL, 270, 45);
    expect(westFacing[3 * W + 3]).toBeGreaterThan(eastFacing[3 * W + 3]);
  });

  test('output is in [0, 1] and has one value per cell', () => {
    const s = hillshade(plane(40, -25), W, H, CELL);
    expect(s).toHaveLength(W * H);
    for (const v of s) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  test('rejects a grid whose length is not W x H', () => {
    expect(() => hillshade(new Float32Array(10), W, H, CELL)).toThrow(RangeError);
  });
});

describe('blendShades', () => {
  test('weightA * a + (1 - weightA) * b', () => {
    const out = blendShades(Float32Array.of(1, 0, 0.5), Float32Array.of(0, 1, 0.5), 0.75);
    expect([...out]).toEqual([0.75, 0.25, 0.5]);
  });

  test('rejects inputs of different lengths', () => {
    expect(() => blendShades(new Float32Array(2), new Float32Array(3), 0.5)).toThrow(RangeError);
  });
});

describe('toGrey8', () => {
  test('clamps to [0, 255] and rounds', () => {
    expect([...toGrey8(Float32Array.of(-0.5, 0, 0.5, 1, 1.5, 0.2))]).toEqual([
      0, 0, 128, 255, 255, 51,
    ]);
  });

  test('returns a Uint8Array of the same length', () => {
    const out = toGrey8(new Float32Array(5));
    expect(out).toBeInstanceOf(Uint8Array);
    expect(out).toHaveLength(5);
  });
});
