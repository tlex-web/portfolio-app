/**
 * DATA-01 contour serialisation: the pure part of the terrain pipeline's
 * contour step (RESEARCH Code Example 2). scripts/terrain/* runs d3-contour and
 * simplify-js, then hands rings and paths to these functions.
 *
 * d3-contour returns closed polygons, and rings for regions that touch the
 * raster edge run along the border. Stroked, those segments draw a frame round
 * every asset (RESEARCH Pitfall 1), so rings are split into open runs here.
 *
 * Import-free and erasable TypeScript (RESEARCH Pattern 1), so a scripts/*.mjs
 * generator can import it under Node 24 type-stripping.
 */

/** A point in raster pixel space: [x east, y south], 0..W by 0..H. */
export type Pt = [number, number];

/** True when both endpoints of segment pq lie on the same raster border. */
export function onEdge(p: Pt, q: Pt, W: number, H: number): boolean {
  return (
    (p[0] === 0 && q[0] === 0) ||
    (p[0] === W && q[0] === W) ||
    (p[1] === 0 && q[1] === 0) ||
    (p[1] === H && q[1] === H)
  );
}

/**
 * Splits a ring into open runs, dropping every segment that lies along the
 * raster border. `closed` is true only when nothing was dropped, i.e. the ring
 * never runs along the border and may be drawn with `Z`.
 */
export function openRuns(ring: Pt[], W: number, H: number): { runs: Pt[][]; closed: boolean } {
  const runs: Pt[][] = [];
  let cur: Pt[] = [ring[0]];
  for (let i = 1; i < ring.length; i++) {
    if (onEdge(ring[i - 1], ring[i], W, H)) {
      if (cur.length > 1) runs.push(cur);
      cur = [ring[i]];
    } else {
      cur.push(ring[i]);
    }
  }
  if (cur.length > 1) runs.push(cur);
  return { runs, closed: runs.length === 1 && runs[0].length === ring.length };
}

/** Rounds to the nearest half pixel, so generated path text is small and deterministic. */
export function roundHalf(v: number): number {
  return Math.round(v * 2) / 2;
}

/** `M x yLx y…[Z]` with half-pixel coordinates; fewer than two points draw nothing. */
export function runToPath(points: { x: number; y: number }[], closed: boolean): string {
  if (points.length < 2) return '';
  // `${-0}` prints "0", so a coordinate rounded to negative zero stays "0".
  return (
    'M' + points.map((p) => `${roundHalf(p.x)} ${roundHalf(p.y)}`).join('L') + (closed ? 'Z' : '')
  );
}

/**
 * Index contour test (UI-SPEC: every 5th interval is an index contour). The
 * level is rounded first so float noise from the threshold list cannot flip it.
 */
export function isIndexLevel(levelM: number, intervalM: number, indexEvery: number): boolean {
  return Math.round(levelM) % (intervalM * indexEvery) === 0;
}

/** Path data this serialiser accepts: M, L and Z commands with plain decimal numbers. */
const PATH_DATA = /^[MLZ0-9. -]*$/;

/**
 * Serialises contour paths into the shipped SVG (UI-SPEC "Contour band" line
 * styling): strokes only, 1 px, `vector-effect="non-scaling-stroke"` on every
 * path (the property is not inherited, so a `<g>` attribute would not reach the
 * paths), index levels at full opacity and others at `stroke-opacity="0.6"`.
 * Emits only `svg`, `g` and `path` elements, with no whitespace between them
 * and a trailing newline, so output is byte-identical for the same input.
 *
 * @throws RangeError for a non-positive or non-finite canvas.
 * @throws TypeError for path data outside the M/L/Z grammar (T-08-02: nothing
 *   but numbers and those three commands can reach the attribute).
 */
export function contourSvg(o: {
  width: number;
  height: number;
  paths: { d: string; index: boolean }[];
}): string {
  if (!(Number.isFinite(o.width) && o.width > 0 && Number.isFinite(o.height) && o.height > 0)) {
    throw new RangeError(`contourSvg: invalid canvas ${o.width} x ${o.height}`);
  }
  let body = '';
  for (const p of o.paths) {
    if (!PATH_DATA.test(p.d)) {
      throw new TypeError('contourSvg: path data may only contain M, L, Z and numbers');
    }
    body += `<path d="${p.d}" vector-effect="non-scaling-stroke"${p.index ? '' : ' stroke-opacity="0.6"'}/>`;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${o.width} ${o.height}">` +
    '<g fill="none" stroke="#000" stroke-width="1">' +
    body +
    '</g></svg>\n'
  );
}
