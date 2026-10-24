/**
 * D-17 DEM sampling: the one sampler for heights and resampled grids
 * (RESEARCH Pitfall 2 and Code Example 3). Bilinear at pixel centres: pixel i
 * spans [i, i + 1) in pixel space and its centre is i + 0.5. Row 0 is north
 * (the DATA-01 UV convention). Resampling runs in this code, not in geotiff or
 * sharp, so CI can regenerate the committed grids deterministically.
 *
 * Import-free and erasable TypeScript (RESEARCH Pattern 1). `Bbox` and `Lv95`
 * are re-declared structurally instead of imported from lib/geo.ts.
 */

type Bbox = { west: number; south: number; east: number; north: number };
type Lv95 = { e: number; n: number };

/**
 * Bilinear sample of a row-major W x H grid at pixel-space (x, y). Exact at a
 * cell centre; clamps to the grid edge outside the outermost centres.
 *
 * @throws RangeError when `grid` does not hold W x H values.
 */
export function sampleBilinear(
  grid: ArrayLike<number>,
  W: number,
  H: number,
  x: number,
  y: number
): number {
  if (grid.length !== W * H) {
    throw new RangeError(`sampleBilinear: grid has ${grid.length} values, expected ${W} x ${H}`);
  }
  const fx = Math.min(W - 1, Math.max(0, x - 0.5));
  const fy = Math.min(H - 1, Math.max(0, y - 0.5));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(W - 1, x0 + 1);
  const y1 = Math.min(H - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const top = grid[y0 * W + x0] + (grid[y0 * W + x1] - grid[y0 * W + x0]) * tx;
  const bottom = grid[y1 * W + x0] + (grid[y1 * W + x1] - grid[y1 * W + x0]) * tx;
  return top + (bottom - top) * ty;
}

/**
 * Height at LV95 point `p` for a grid covering `extent` (row 0 = north). In
 * index space this is x = (e - west) / cell - 0.5, y = (north - n) / cell - 0.5.
 */
export function sampleAtLv95(
  grid: ArrayLike<number>,
  W: number,
  H: number,
  extent: Bbox,
  p: Lv95
): number {
  const cellX = (extent.east - extent.west) / W;
  const cellY = (extent.north - extent.south) / H;
  return sampleBilinear(grid, W, H, (p.e - extent.west) / cellX, (extent.north - p.n) / cellY);
}

/**
 * Resamples a W x H grid to outW x outH by sampling the input at each output
 * pixel centre, mapped to input index space as
 * ((ox + 0.5) * W / outW - 0.5, (oy + 0.5) * H / outH - 0.5).
 */
export function resampleBilinear(
  grid: ArrayLike<number>,
  W: number,
  H: number,
  outW: number,
  outH: number
): Float32Array {
  const out = new Float32Array(outW * outH);
  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      out[oy * outW + ox] = sampleBilinear(
        grid,
        W,
        H,
        ((ox + 0.5) * W) / outW,
        ((oy + 0.5) * H) / outH
      );
    }
  }
  return out;
}
