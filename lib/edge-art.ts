/** RED skeleton (12-12 Task 1): exports only; the geometry lands in the GREEN commit. */
export type EdgePoint = { x: number; y: number };
export const EDGE_SAFE_BOX = { min: 0, max: 0 };
export const EDGE_TRAIL: readonly EdgePoint[] = [];
export const EDGE_DOT: EdgePoint = { x: -1, y: -1 };
export function distanceToSegment(_p: EdgePoint, _a: EdgePoint, _b: EdgePoint): number {
  return Number.NaN;
}
export function trailPath(_points: readonly EdgePoint[]): string {
  return '';
}
