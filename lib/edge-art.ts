/**
 * The marked-trail geometry for the edge art (EDGE-01, D-09; 12-UI-SPEC
 * "EdgeArt").
 *
 * Every edge page (404, error, global-error, offline) shows one picture: a
 * contour sheet with a dashed "marked trail" and an accent "you are here" dot
 * clearly off it. The coordinates are viewBox units of the hero contour asset
 * (0 to 512, square). Everything stays inside EDGE_SAFE_BOX so the rounded
 * sheet border never clips the trail or the dot, and the dot sits at least 56
 * units from every trail segment (lib/__tests__/edge-art.test.ts), about 37 px
 * at 375 and 49 px at 448.
 *
 * The trail is a switchback: in from the lower left, a long traverse, a climb,
 * and a turn back west across the upper sheet. The dot is east of the climb.
 *
 * Pure and import-free: a committed constant, never derived from the request,
 * so no visitor input can reach the art.
 */

/** A point in the 512 x 512 viewBox. */
export type EdgePoint = { readonly x: number; readonly y: number };

/** The square every trail point and the dot must lie in (inclusive). */
export const EDGE_SAFE_BOX = { min: 48, max: 464 } as const;

/** The marked trail, in drawing order. */
export const EDGE_TRAIL: readonly EdgePoint[] = [
  { x: 64, y: 432 },
  { x: 176, y: 400 },
  { x: 208, y: 336 },
  { x: 320, y: 304 },
  { x: 336, y: 192 },
  { x: 240, y: 152 },
  { x: 128, y: 112 },
];

/** "You are here": off the trail, east of the climb. */
export const EDGE_DOT: EdgePoint = { x: 400, y: 256 };

/** Euclidean distance from p to the closed segment a-b (to a itself when a and b coincide). */
export function distanceToSegment(p: EdgePoint, a: EdgePoint, b: EdgePoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** An SVG path `d` for a polyline: 'M x y' then ' L x y' per remaining point. */
export function trailPath(points: readonly EdgePoint[]): string {
  return points.map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
}
