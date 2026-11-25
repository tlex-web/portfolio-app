import { formatMetres } from '@/lib/photo-format';

/**
 * The region altimeter rail's model (REGION-05; D-07; 18-UI-SPEC Contract 2
 * "Altimeter rail"). Pure: the server page builds the ticks and the head label
 * and hands them to the RegionRail island as plain props, so no registry or
 * generated data reaches the client chunk (T-18-29).
 *
 * P1 as drafted (Tim's 18-01 answer "Defaults (Recommended)"): a tick label is
 * the metres only ('2,585 m'); the caption carries 'approx.' and 'ground'. A
 * dashed tick means the photo's position is approximate, and the head label
 * reads 'Ground altitude' when every photo of the region is aerial.
 *
 * railCurrent is the island's decision from its two IntersectionObservers
 * (18-RESEARCH Pattern 6, extended for gaps and jumps), kept here so Jest pins
 * it and the island holds no rule of its own.
 */

/** The view fields the rail reads (structurally a PhotoView). */
export type RailView = { altitudeM: number; approximate: boolean; aerial: boolean };

/** One tick: its label and whether the photo's position is approximate (dashed). */
export type RailTick = { label: string; approximate: boolean };

/**
 * The most photos one region's rail takes: above it, on a 640 px tall
 * viewport, the evenly spaced ticks would come closer than 24 px (UI E6
 * overflow), so a 17th photo fails the build and forces a revision.
 */
export const RAIL_MAX_PHOTOS = 16;

/**
 * One tick per view, in sequence order (photo 1 first, drawn at the bottom).
 *
 * @throws RangeError when there are more than RAIL_MAX_PHOTOS views, naming the count.
 */
export function railTicks(views: readonly RailView[]): RailTick[] {
  if (views.length > RAIL_MAX_PHOTOS) {
    throw new RangeError(
      `railTicks: ${views.length} photos exceed the rail's ${RAIL_MAX_PHOTOS}; revise the rail spacing`
    );
  }
  return views.map((view) => ({
    label: formatMetres(view.altitudeM),
    approximate: view.approximate,
  }));
}

/** 'Ground altitude' when every view is aerial (the 17 aerial rule), else 'Altitude'. */
export function railHead(views: readonly RailView[]): 'Altitude' | 'Ground altitude' {
  return views.length > 0 && views.every((view) => view.aerial) ? 'Ground altitude' : 'Altitude';
}

/** What the two observers know about the N items, in sequence order. */
export type RailObservation = {
  /** Per item: its box contains the viewport's vertical centre line. */
  containing: readonly boolean[];
  /** Per item: its top has reached the centre line (it lies at least partly above it). */
  reached: readonly boolean[];
  /** The 1-based index currently marked. */
  previous: number;
};

/**
 * The 1-based index of the current photo.
 *
 * - The item whose box contains the centre line.
 * - Otherwise let k be the number of items whose top has reached the line:
 *   k = 0 gives 1 (the line is above the first figure), k = N gives N (below
 *   the last).
 * - Otherwise the line is in the gap between figures k and k + 1: the mark
 *   stays on `previous` when that is k or k + 1 (the side the visitor came
 *   from), else (a jump straight into the gap) it moves to k.
 */
export function railCurrent({ containing, reached, previous }: RailObservation): number {
  const n = containing.length;
  const hit = containing.indexOf(true);
  if (hit >= 0) return hit + 1;
  let k = 0;
  for (const r of reached) if (r) k++;
  if (k === 0) return 1;
  if (k >= n) return n;
  return previous === k || previous === k + 1 ? previous : k;
}
