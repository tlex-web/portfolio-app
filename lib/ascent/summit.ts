import { buildWaypoints, type Waypoint } from '@/lib/ascent/waypoints';

/** One plaque stat: a dt label, a dd value and an optional second muted line. */
export type PlaqueStat = { label: string; value: string; note?: string };

/** RED stub: signature only (09-05 Task 1). */
export function summitPlaque(waypoints: readonly Waypoint[] = buildWaypoints()): {
  kicker: string;
  title: string;
  height: string;
  stats: readonly PlaqueStat[];
} {
  void waypoints;
  return { kicker: '', title: '', height: '', stats: [] };
}
