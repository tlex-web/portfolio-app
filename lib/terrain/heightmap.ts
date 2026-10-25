import { sampleBilinear } from '@/lib/terrain/dem-sample';

/**
 * Pure heightmap helpers for the Home terrain mesh (HOME-02; D-16, D-17, D-18;
 * 09-RESEARCH Pattern 6 and Pitfall 2). No three.js and no PNG decoder here:
 * the lazy canvas chunk (components/home/terrain/TerrainMesh.tsx) decodes the
 * PNG with fast-png and hands the result to these functions, so Jest can test
 * them with synthetic arrays (RESEARCH Pitfall 10: Jest cannot load fast-png).
 *
 * Registration is pixel-centre, like the hillshade, the hero contour SVG and
 * lib/terrain/dem-sample.ts: vertex (ix, iy) of an N x N grid sits at
 * u = (ix + 0.5) / N, v = (iy + 0.5) / N, with u running east and v running
 * south (row 0 = north), as in lib/geo.ts. World coordinates put the extent
 * centre at the origin: x = (u - 0.5) W east, z = (v - 0.5) W south.
 */

/** The fields of a decoded PNG these helpers read (fast-png's DecodedPng is structurally one). */
export type DecodedPngLike = {
  width: number;
  height: number;
  depth: number;
  channels: number;
  data: ArrayLike<number>;
};

/**
 * Accepts only a `size` x `size`, 16-bit, single-channel PNG with exactly
 * size² samples (T-09-12: a tampered or wrong asset never becomes geometry).
 *
 * @throws Error 'heightmap: unexpected format …' on any mismatch.
 */
export function validateHeightmap(png: DecodedPngLike, size: number): void {
  const ok =
    png.width === size &&
    png.height === size &&
    png.depth === 16 &&
    png.channels === 1 &&
    png.data.length === size * size;
  if (!ok) {
    throw new Error(
      `heightmap: unexpected format ${png.width}x${png.height}, depth ${png.depth}, ` +
        `${png.channels} channel(s), ${png.data.length} samples (expected ${size}x${size}, depth 16, 1 channel)`
    );
  }
}

/** Raw samples to metres: sample x heightScale (terrain.dem.heightScale, 0.1: decimetres). */
export function toMetres(data: ArrayLike<number>, heightScale: number): Float32Array {
  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] * heightScale;
  return out;
}

/**
 * Texture coordinates of vertex (ix, iy) in an N x N grid: pixel centres, with
 * the texture's v axis pointing north (flipY images), so row 0 sits near uv.y 1.
 */
export function vertexUv(ix: number, iy: number, n: number): [number, number] {
  return [(ix + 0.5) / n, 1 - (iy + 0.5) / n];
}

/** World position (metres, origin at the extent centre) of extent UV (u east, v south). */
export function uvToWorld(u: number, v: number, widthM: number): { x: number; z: number } {
  return { x: (u - 0.5) * widthM, z: (v - 0.5) * widthM };
}

/** Side of the plane through the outermost pixel centres: W (N - 1) / N. */
export function planeSize(n: number, widthM: number): number {
  return (widthM * (n - 1)) / n;
}

/**
 * Mesh height (metres, relief 1) at extent UV (u, v): bilinear between pixel
 * centres on the decoded grid, the same surface the GPU draws. Use this, not
 * the DEM value, wherever something must sit on the rendered terrain (Pitfall 2).
 */
export function meshHeightAtUv(metres: ArrayLike<number>, n: number, u: number, v: number): number {
  return sampleBilinear(metres, n, n, u * n, v * n);
}
