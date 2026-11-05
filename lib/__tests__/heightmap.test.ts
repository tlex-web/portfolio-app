/**
 * Heightmap helpers of the Home terrain mesh (HOME-02; D-17; 09-RESEARCH
 * Pattern 6 and Pitfall 2). Pixel-centre registration: vertex i of N sits at
 * u = (i + 0.5) / N, u east, v south, world origin at the extent centre.
 * Synthetic arrays only: Jest cannot load fast-png (RESEARCH Pitfall 10).
 */
import {
  meshHeightAtUv,
  planeSize,
  toMetres,
  uvToWorld,
  validateHeightmap,
  vertexUv,
  type DecodedPngLike,
} from '@/lib/terrain/heightmap';

const png = (over: Partial<DecodedPngLike> = {}): DecodedPngLike => ({
  width: 4,
  height: 4,
  depth: 16,
  channels: 1,
  data: new Uint16Array(16),
  ...over,
});

describe('validateHeightmap (T-09-12)', () => {
  test('accepts a size x size, 16-bit, one-channel PNG', () => {
    expect(() => validateHeightmap(png(), 4)).not.toThrow();
  });

  test.each([
    ['a width of 3', { width: 3 }],
    ['a height of 3', { height: 3 }],
    ['a depth of 8', { depth: 8 }],
    ['two channels', { channels: 2 }],
    ['15 samples', { data: new Uint16Array(15) }],
  ])('throws on %s', (_name, over) => {
    expect(() => validateHeightmap(png(over), 4)).toThrow(/^heightmap: unexpected format/);
  });

  test('throws when the PNG is valid but not the requested grid size', () => {
    expect(() => validateHeightmap(png(), 8)).toThrow(/^heightmap: unexpected format/);
  });
});

describe('toMetres', () => {
  test('scales decimetre samples to metres', () => {
    expect(toMetres(Uint16Array.of(0, 16170, 44780), 0.1)).toEqual(Float32Array.of(0, 1617, 4478));
  });
});

describe('vertexUv (pixel-centre registration)', () => {
  test('the north-west vertex samples the first pixel centre, near the top of the texture', () => {
    expect(vertexUv(0, 0, 4)).toEqual([0.125, 0.875]);
  });

  test('the south-east vertex samples the last pixel centre', () => {
    expect(vertexUv(3, 3, 4)).toEqual([0.875, 0.125]);
  });
});

describe('uvToWorld and planeSize', () => {
  test('the extent centre is the world origin', () => {
    const { x, z } = uvToWorld(0.5, 0.5, 11000);
    expect(x).toBeCloseTo(0, 9);
    expect(z).toBeCloseTo(0, 9);
  });

  test('u runs east and v runs south: the south-west corner is (-W/2, +W/2)', () => {
    expect(uvToWorld(0, 1, 11000)).toEqual({ x: -5500, z: 5500 });
  });

  test('the plane spans the outermost pixel centres: W (N - 1) / N', () => {
    expect(planeSize(512, 11000)).toBe((11000 * 511) / 512);
  });

  test('the first and last vertex of the plane sit at the first and last pixel centre', () => {
    const n = 512;
    const half = planeSize(n, 11000) / 2;
    expect(uvToWorld(0.5 / n, 0.5 / n, 11000).x).toBeCloseTo(-half, 6);
    expect(uvToWorld((n - 0.5) / n, (n - 0.5) / n, 11000).z).toBeCloseTo(half, 6);
  });
});

describe('meshHeightAtUv (RESEARCH Pitfall 2: heights of the drawn surface)', () => {
  const grid = Float32Array.of(0, 10, 20, 30);

  test('between the four pixel centres of a 2 x 2 grid it returns their bilinear mean', () => {
    expect(meshHeightAtUv(grid, 2, 0.5, 0.5)).toBe(15);
  });

  test('at a pixel centre it returns that pixel exactly', () => {
    expect(meshHeightAtUv(grid, 2, 0.25, 0.25)).toBe(0);
    expect(meshHeightAtUv(grid, 2, 0.75, 0.25)).toBe(10);
    expect(meshHeightAtUv(grid, 2, 0.25, 0.75)).toBe(20);
    expect(meshHeightAtUv(grid, 2, 0.75, 0.75)).toBe(30);
  });
});
