/** D-16 hillshade (RED skeleton: signatures only, bodies land in the GREEN commit). */

export function hillshade(
  _h: Float32Array,
  W: number,
  H: number,
  _cellM: number,
  _azDeg = 315,
  _altDeg = 45,
  _z = 1
): Float32Array {
  return new Float32Array(W * H).fill(Number.NaN);
}

export function blendShades(a: Float32Array, _b: Float32Array, _weightA: number): Float32Array {
  return new Float32Array(a.length).fill(Number.NaN);
}

export function toGrey8(shade: Float32Array): Uint8Array {
  return new Uint8Array(shade.length);
}
