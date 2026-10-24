/** D-17 DEM sampler (RED skeleton: signatures only, bodies land in the GREEN commit). */

type Bbox = { west: number; south: number; east: number; north: number };
type Lv95 = { e: number; n: number };

export function sampleBilinear(
  _grid: ArrayLike<number>,
  _W: number,
  _H: number,
  _x: number,
  _y: number
): number {
  return Number.NaN;
}

export function sampleAtLv95(
  _grid: ArrayLike<number>,
  _W: number,
  _H: number,
  _extent: Bbox,
  _p: Lv95
): number {
  return Number.NaN;
}

export function resampleBilinear(
  _grid: ArrayLike<number>,
  _W: number,
  _H: number,
  outW: number,
  outH: number
): Float32Array {
  return new Float32Array(outW * outH).fill(Number.NaN);
}
