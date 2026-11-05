/**
 * The summit plaque (HOME-06; D-03; 09-UI-SPEC "Summit Section" and
 * "Summit-plaque stats"): the UI-SPEC chose the four stats, and every value is
 * recomputed here from the committed data (terrain.summit, lowestDemM, the
 * waypoints and lib/geo.ts) through the tested formatters. The literals are
 * the strings the UI-SPEC fixes for today's data; the synthetic cases prove
 * the values follow the data instead of being typed (assumption-delta
 * invariant, T-09-06).
 */
import { summitPlaque } from '@/lib/ascent/summit';
import { buildWaypoints, type Waypoint } from '@/lib/ascent/waypoints';
import { terrain } from '@/data/generated/terrain';
import { lowestDemM } from '@/data/generated/photos';
import { lv95ToWgs84, wgs84ToLv95 } from '@/lib/geo';
import { formatKilometres, formatLatLon, formatYearRange } from '@/lib/home-format';
import { formatMetres } from '@/lib/photo-format';

/** The formatters keep units and hemisphere letters on their number with U+00A0. */
const NBSP = ' ';

describe('summitPlaque on the committed data (HOME-06, D-03)', () => {
  const plaque = summitPlaque();

  it('prints the four UI-SPEC stats in order', () => {
    expect(plaque.stats).toEqual([
      { label: 'Height gained', value: `2,861${NBSP}m` },
      { label: 'Highest photograph', value: `2,760${NBSP}m`, note: 'Riffelsee, approx.' },
      { label: 'Photographed', value: '2019–2021' },
      { label: 'Distance from Zermatt', value: `7.7${NBSP}km`, note: 'straight line' },
    ]);
  });

  it('uses the hero kicker, the summit name and the official height', () => {
    expect(plaque.kicker).toBe(formatLatLon(lv95ToWgs84(terrain.summit.lv95)));
    expect(plaque.title).toBe('Matterhorn summit');
    expect(plaque.title).toBe(`${terrain.summit.name} summit`);
    expect(plaque.height).toBe(`4,478${NBSP}m`);
    expect(plaque.height).toBe(formatMetres(terrain.summit.officialM));
  });

  it('recomputes every stat from the data', () => {
    const waypoints = buildWaypoints();
    const highest = waypoints.reduce((a, b) => (b.altitudeM > a.altitudeM ? b : a));
    const start = wgs84ToLv95(waypoints[0].position);
    const metres = Math.hypot(start.e - terrain.summit.lv95.e, start.n - terrain.summit.lv95.n);

    expect(plaque.stats.map((s) => s.value)).toEqual([
      formatMetres(terrain.summit.officialM - lowestDemM),
      formatMetres(highest.altitudeM),
      formatYearRange(waypoints.map((w) => w.years)),
      formatKilometres(metres),
    ]);
    expect(plaque.stats[3].label).toBe(`Distance from ${waypoints[0].shortPlace}`);
  });

  it('never shows the unsourced legacy claims', () => {
    const text = JSON.stringify(plaque);
    for (const claim of ['850+', 'Tests Passing', 'Roadmap Complete']) {
      expect(text).not.toContain(claim);
    }
  });
});

describe('summitPlaque on synthetic waypoints (derived, never typed)', () => {
  const base = buildWaypoints();
  const at = (i: number, patch: Partial<Waypoint>): Waypoint => ({ ...base[i], ...patch });

  it('drops "approx." when the highest photograph is exact', () => {
    const waypoints = [
      at(0, {}),
      at(1, { altitudeM: 3100, approximate: false, shortPlace: 'Hörnli' }),
      at(3, {}),
    ];
    const highest = summitPlaque(waypoints).stats[1];

    expect(highest).toEqual({ label: 'Highest photograph', value: `3,100${NBSP}m`, note: 'Hörnli' });
  });

  it('picks the earlier waypoint on an altitude tie', () => {
    const waypoints = [
      at(0, {}),
      at(1, { altitudeM: 2900, approximate: false, shortPlace: 'First' }),
      at(2, { altitudeM: 2900, approximate: true, shortPlace: 'Second' }),
    ];

    expect(summitPlaque(waypoints).stats[1].note).toBe('First');
  });

  it('prints a single capture year once', () => {
    const waypoints = base.map((w) => ({ ...w, years: 2020 }));

    expect(summitPlaque(waypoints).stats[2]).toEqual({ label: 'Photographed', value: '2020' });
  });

  it('measures the distance from the first waypoint and names its place', () => {
    const summit = lv95ToWgs84(terrain.summit.lv95);
    const waypoints = [at(0, { shortPlace: 'Summit itself', position: summit })];
    const distance = summitPlaque(waypoints).stats[3];

    expect(distance.label).toBe('Distance from Summit itself');
    expect(distance.value).toBe(`0.0${NBSP}km`);
    expect(distance.note).toBe('straight line');
  });
});
