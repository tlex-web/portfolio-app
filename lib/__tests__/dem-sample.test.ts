/**
 * D-17 DEM sampling (RESEARCH Pitfall 2: one sampler, bilinear at pixel
 * centres). Pixel i spans [i, i + 1) and its centre is i + 0.5; row 0 is north.
 */
import { resampleBilinear, sampleAtLv95, sampleBilinear } from '@/lib/terrain/dem-sample';

/** 4 x 4 grid with value = row * 4 + column. */
const GRID = Float32Array.from({ length: 16 }, (_, i) => i);

describe('sampleBilinear', () => {
  test('returns the exact cell value at every cell centre', () => {
    const grid = Float32Array.from({ length: 16 }, (_, i) => 1000 + i * 37.3);
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        expect(sampleBilinear(grid, 4, 4, i + 0.5, j + 0.5)).toBe(grid[j * 4 + i]);
      }
    }
  });

  test('halfway between two horizontal centres returns their mean', () => {
    expect(sampleBilinear(GRID, 4, 4, 2, 0.5)).toBe((GRID[1] + GRID[2]) / 2);
  });

  test('halfway between two vertical centres returns their mean', () => {
    expect(sampleBilinear(GRID, 4, 4, 0.5, 2)).toBe((GRID[4] + GRID[8]) / 2);
  });

  test('the point shared by four centres returns their mean', () => {
    expect(sampleBilinear(GRID, 4, 4, 1, 1)).toBe((0 + 1 + 4 + 5) / 4);
  });

  test('clamps to the grid edge outside the outermost centres', () => {
    expect(sampleBilinear(GRID, 4, 4, 0, 0)).toBe(GRID[0]);
    expect(sampleBilinear(GRID, 4, 4, 4, 4)).toBe(GRID[15]);
    expect(sampleBilinear(GRID, 4, 4, -10, 0.5)).toBe(GRID[0]);
    expect(sampleBilinear(GRID, 4, 4, 99, 3.5)).toBe(GRID[15]);
  });

  test('accepts a plain number array', () => {
    expect(sampleBilinear([1, 2, 3, 4], 2, 2, 0.5, 0.5)).toBe(1);
  });

  test('rejects a grid whose length is not W x H', () => {
    expect(() => sampleBilinear([1, 2, 3], 2, 2, 0.5, 0.5)).toThrow(RangeError);
  });
});

describe('sampleAtLv95', () => {
  // 40 x 40 m extent, 10 m cells: centre of pixel (i, j) is (west + 10i + 5, north - 10j - 5).
  const EXTENT = { west: 2616000, south: 1088000, east: 2616040, north: 1088040 };

  test('returns the cell value at the LV95 position of a cell centre', () => {
    expect(sampleAtLv95(GRID, 4, 4, EXTENT, { e: 2616015, n: 1088015 })).toBe(GRID[2 * 4 + 1]);
  });

  test('the north-west corner reads row 0, the south-east corner the last row', () => {
    expect(sampleAtLv95(GRID, 4, 4, EXTENT, { e: EXTENT.west, n: EXTENT.north })).toBe(GRID[0]);
    expect(sampleAtLv95(GRID, 4, 4, EXTENT, { e: EXTENT.east, n: EXTENT.south })).toBe(GRID[15]);
  });

  test('interpolates between centres in metres', () => {
    // Midway between the centres of (0, 0) and (1, 0).
    expect(sampleAtLv95(GRID, 4, 4, EXTENT, { e: 2616010, n: 1088035 })).toBe(0.5);
  });
});

describe('resampleBilinear', () => {
  test('4 x 4 -> 2 x 2 samples input at the output pixel centres', () => {
    // Output centre (0.5, 0.5) maps to input pixel space (1, 1): the mean of cells 0, 1, 4, 5.
    expect([...resampleBilinear(GRID, 4, 4, 2, 2)]).toEqual([2.5, 4.5, 10.5, 12.5]);
  });

  test('same size is the identity', () => {
    expect([...resampleBilinear(GRID, 4, 4, 4, 4)]).toEqual([...GRID]);
  });

  test('is deterministic', () => {
    const grid = Float32Array.from({ length: 64 }, (_, i) => Math.sin(i) * 1000 + 3000);
    expect(resampleBilinear(grid, 8, 8, 5, 3)).toEqual(resampleBilinear(grid, 8, 8, 5, 3));
  });

  test('returns a Float32Array of outW x outH', () => {
    const out = resampleBilinear(GRID, 4, 4, 3, 5);
    expect(out).toBeInstanceOf(Float32Array);
    expect(out).toHaveLength(15);
  });
});
