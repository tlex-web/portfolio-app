import { lowestDemM } from '@/data/generated/photos';
import { terrain } from '@/data/generated/terrain';
import { buildWaypoints, type Waypoint } from '@/lib/ascent/waypoints';
import { lv95ToWgs84, wgs84ToLv95 } from '@/lib/geo';
import { formatKilometres, formatLatLon, formatYearRange } from '@/lib/home-format';
import { formatMetres } from '@/lib/photo-format';

/** One plaque stat: a dt label, a dd value and an optional second muted line. */
export type PlaqueStat = { label: string; value: string; note?: string };

/** What the summit plaque prints (09-UI-SPEC "Summit Section"). */
export type SummitPlaque = {
  kicker: string;
  title: string;
  height: string;
  stats: readonly PlaqueStat[];
};

/**
 * The summit plaque (HOME-06; D-03; 09-UI-SPEC "Summit Section" and
 * "Summit-plaque stats").
 *
 * UI-SPEC chose the four stats; every value is derived, never typed:
 * - Height gained: the official summit height minus the lowest photo's DEM
 *   height (the rail start), so the plaque states the climb the page made.
 * - Highest photograph: the waypoint with the largest altitude (an altitude
 *   tie keeps the earlier one in ascent order); its short place is the note,
 *   with ', approx.' when its position was placed by hand.
 * - Photographed: the span of capture years.
 * - Distance from {first waypoint's short place}: the straight LV95 distance
 *   from the lowest photo to the summit, in kilometres.
 *
 * The kicker is the same derived coordinate string as the hero, so the two
 * bookend the climb.
 *
 * @param waypoints the ascent in order; defaults to buildWaypoints() (the
 *   parameter exists for unit tests). buildWaypoints never returns an empty
 *   list, so the first waypoint always exists.
 */
export function summitPlaque(waypoints: readonly Waypoint[] = buildWaypoints()): SummitPlaque {
  const { summit } = terrain;
  const highest = waypoints.reduce((top, w) => (w.altitudeM > top.altitudeM ? w : top));
  const start = waypoints[0];
  const from = wgs84ToLv95(start.position);
  const distanceM = Math.hypot(from.e - summit.lv95.e, from.n - summit.lv95.n);

  return {
    kicker: formatLatLon(lv95ToWgs84(summit.lv95)),
    title: `${summit.name} summit`,
    height: formatMetres(summit.officialM),
    stats: [
      { label: 'Height gained', value: formatMetres(summit.officialM - lowestDemM) },
      {
        label: 'Highest photograph',
        value: formatMetres(highest.altitudeM),
        note: highest.approximate ? `${highest.shortPlace}, approx.` : highest.shortPlace,
      },
      { label: 'Photographed', value: formatYearRange(waypoints.map((w) => w.years)) },
      {
        label: `Distance from ${start.shortPlace}`,
        value: formatKilometres(distanceM),
        note: 'straight line',
      },
    ],
  };
}
