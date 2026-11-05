/**
 * D-05 trail profile maths (RESEARCH Pattern 4): the elevation-profile glyph
 * each project panel draws is one real marked trail (D-07), resampled at equal
 * arc-length stations, sampled on the committed DEM (08 D-17) and normalised to
 * 0..1. `scripts/terrain/build-trails.mjs` runs the first three steps at build
 * time; the route panels call `profilePath` on the generated points.
 *
 * Pure and import-free: keep it to erasable TypeScript and never add an import
 * (lib/terrain/dem-sample.ts rule), so the build script can type-strip it. Names
 * are the caller's concern: NFC-normalise them before they reach this module.
 */

type Point = readonly [number, number];
type ProfilePoint = { x: number; y: number };
type Box = { w: number; h: number; inset: number };

const DEFAULT_BOX: Box = { w: 320, h: 96, inset: 8 };

/** Rounds to 3 decimals (the generated module's precision). */
function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

/** SVG number: at most 2 decimals, no trailing zeros, never "-0". */
function fmt(v: number): string {
  const r = Math.round(v * 100) / 100;
  return String(r === 0 ? 0 : r);
}

/** Cumulative arc length at every vertex (first entry 0). */
function cumulative(pts: readonly Point[]): number[] {
  const out = [0];
  for (let i = 1; i < pts.length; i++) {
    out.push(out[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return out;
}

/**
 * Length of a polyline in its own units (LV95 metres for the trails).
 *
 * @throws RangeError for fewer than two vertices.
 */
export function polylineLength(pts: readonly Point[]): number {
  if (pts.length < 2) {
    throw new RangeError(`polylineLength: needs at least 2 vertices, got ${pts.length}`);
  }
  const cum = cumulative(pts);
  return cum[cum.length - 1];
}

/**
 * `n` stations at equal arc-length spacing along `pts`. The first and last
 * stations are copies of the first and last vertex; zero-length segments (a
 * repeated vertex) are skipped, so no station is emitted twice.
 *
 * @throws RangeError for n < 2, fewer than two vertices or a zero-length line.
 */
export function resampleByArcLength(pts: readonly Point[], n: number): [number, number][] {
  if (!Number.isInteger(n) || n < 2) {
    throw new RangeError(`resampleByArcLength: needs an integer n >= 2, got ${n}`);
  }
  if (pts.length < 2) {
    throw new RangeError(`resampleByArcLength: needs at least 2 vertices, got ${pts.length}`);
  }
  const cum = cumulative(pts);
  const total = cum[cum.length - 1];
  if (!(total > 0)) {
    throw new RangeError('resampleByArcLength: the polyline has zero length');
  }
  const out: [number, number][] = [[pts[0][0], pts[0][1]]];
  let j = 0;
  for (let i = 1; i < n - 1; i++) {
    const s = (total * i) / (n - 1);
    // Advance to the first segment with length that ends at or after s.
    while (j < pts.length - 2 && (cum[j + 1] < s || cum[j + 1] === cum[j])) j++;
    const segLen = cum[j + 1] - cum[j];
    const t = segLen > 0 ? (s - cum[j]) / segLen : 0;
    out.push([
      pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t,
      pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t,
    ]);
  }
  const last = pts[pts.length - 1];
  out.push([last[0], last[1]]);
  return out;
}

/**
 * Normalises a profile: x = distance share of the whole line, y = height share
 * of the height range, both in [0, 1] at 3 decimals.
 *
 * @throws RangeError for mismatched lengths, fewer than two stations, a zero
 * total distance, or equal heights everywhere (min equals max).
 */
export function normaliseProfile(
  dist: readonly number[],
  heights: readonly number[]
): ProfilePoint[] {
  if (dist.length !== heights.length) {
    throw new RangeError(
      `normaliseProfile: ${dist.length} distances but ${heights.length} heights`
    );
  }
  if (dist.length < 2) {
    throw new RangeError(`normaliseProfile: needs at least 2 stations, got ${dist.length}`);
  }
  const d0 = dist[0];
  const span = dist[dist.length - 1] - d0;
  if (!(span > 0)) {
    throw new RangeError('normaliseProfile: the total distance is zero');
  }
  let min = Infinity;
  let max = -Infinity;
  for (const h of heights) {
    if (h < min) min = h;
    if (h > max) max = h;
  }
  if (!(max > min)) {
    throw new RangeError('normaliseProfile: every height is equal (min equals max)');
  }
  return dist.map((d, i) => ({
    x: round3((d - d0) / span),
    y: round3((heights[i] - min) / (max - min)),
  }));
}

/**
 * SVG path strings for a normalised profile in a `w` x `h` box: x spans the
 * full width, y sits between `inset` (top, y = 1) and `h - inset` (bottom,
 * y = 0). `line` is the profile, `area` closes it down to the baseline, and
 * `baseline` is the y = 0 rule across the box.
 *
 * @throws RangeError for fewer than two points.
 */
export function profilePath(
  points: readonly ProfilePoint[],
  box: Box = DEFAULT_BOX
): { line: string; area: string; baseline: string } {
  if (points.length < 2) {
    throw new RangeError(`profilePath: needs at least 2 points, got ${points.length}`);
  }
  const { w, h, inset } = box;
  const base = h - inset;
  const px = (x: number) => x * w;
  const py = (y: number) => base - y * (h - 2 * inset);
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(px(p.x))} ${fmt(py(p.y))}`)
    .join('');
  const first = points[0];
  const last = points[points.length - 1];
  const area = `${line}L${fmt(px(last.x))} ${fmt(base)}L${fmt(px(first.x))} ${fmt(base)}Z`;
  const baseline = `M0 ${fmt(base)}L${fmt(w)} ${fmt(base)}`;
  return { line, area, baseline };
}
