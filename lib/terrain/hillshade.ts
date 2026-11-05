/**
 * D-16 poster shading: Horn-method hillshade (RESEARCH Code Example 4). The
 * terrain script computes the shading numerically and encodes it with sharp;
 * this module is the pure part. Imhof/swisstopo convention: light from the NW
 * (azimuth 315 degrees), altitude 45 degrees.
 *
 * Grids are row-major with row 0 = north (the DATA-01 UV convention), so the
 * Horn kernel's first row is the northern neighbour row.
 *
 * Import-free and erasable TypeScript (RESEARCH Pattern 1).
 */

/**
 * Horn-method hillshade of height grid `h` (W x H, metres, cell size `cellM`),
 * with edge clamping. Returns one value per cell in [0, 1].
 *
 * @param azDeg light azimuth, degrees clockwise from north (default 315, NW)
 * @param altDeg light altitude above the horizon in degrees (default 45)
 * @param z vertical exaggeration (default 1)
 * @throws RangeError when `h` does not hold W x H values.
 */
export function hillshade(
  h: Float32Array,
  W: number,
  H: number,
  cellM: number,
  azDeg = 315,
  altDeg = 45,
  z = 1
): Float32Array {
  if (h.length !== W * H) {
    throw new RangeError(`hillshade: grid has ${h.length} values, expected ${W} x ${H}`);
  }
  const out = new Float32Array(W * H);
  const az = (((360 - azDeg + 90) % 360) * Math.PI) / 180;
  const zen = ((90 - altDeg) * Math.PI) / 180;
  const g = (x: number, y: number) =>
    h[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = g(x - 1, y - 1);
      const b = g(x, y - 1);
      const c = g(x + 1, y - 1);
      const d = g(x - 1, y);
      const f = g(x + 1, y);
      const gg = g(x - 1, y + 1);
      const hh = g(x, y + 1);
      const i = g(x + 1, y + 1);
      const dzdx = ((c + 2 * f + i - (a + 2 * d + gg)) / (8 * cellM)) * z;
      const dzdy = ((gg + 2 * hh + i - (a + 2 * b + c)) / (8 * cellM)) * z;
      const slope = Math.atan(Math.hypot(dzdx, dzdy));
      const aspect = Math.atan2(dzdy, -dzdx);
      out[y * W + x] = Math.max(
        0,
        Math.cos(zen) * Math.cos(slope) + Math.sin(zen) * Math.sin(slope) * Math.cos(az - aspect)
      );
    }
  }
  return out;
}

/**
 * Per-cell blend `weightA * a + (1 - weightA) * b` (the poster uses
 * 0.75 x (315, 45) + 0.25 x (270, 55)).
 *
 * @throws RangeError when the inputs differ in length.
 */
export function blendShades(a: Float32Array, b: Float32Array, weightA: number): Float32Array {
  if (a.length !== b.length) {
    throw new RangeError(`blendShades: lengths differ (${a.length} vs ${b.length})`);
  }
  const out = new Float32Array(a.length);
  for (let k = 0; k < a.length; k++) out[k] = weightA * a[k] + (1 - weightA) * b[k];
  return out;
}

/** Single-channel 8-bit grey: `round(clamp(v, 0, 1) * 255)`. */
export function toGrey8(shade: Float32Array): Uint8Array {
  const out = new Uint8Array(shade.length);
  for (let k = 0; k < shade.length; k++) {
    out[k] = Math.round(Math.min(1, Math.max(0, shade[k])) * 255);
  }
  return out;
}
