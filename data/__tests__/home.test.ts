/**
 * @jest-environment node
 */
/**
 * DATA-09 (15-CONTEXT D-06, D-07): the Home waypoint list is strict.
 *
 * homeWaypointIds must hold exactly four unique ids, today's four Matterhorn
 * waypoints, each a generated photo in region zermatt whose region sits on the
 * matterhorn plate. Home's layout (poster pins, plaque, label rules) is tuned
 * for four, and changing the ascent is out of scope for v2.1. tsc separately
 * rejects an id that is not a generated photo id (`satisfies readonly
 * PhotoId[]` in data/home.ts).
 *
 * The edges: a listed id with no photo is a RangeError naming it (empty), and
 * the list's own order never reaches the ascent, which buildWaypoints orders
 * by DEM height (ordering, D-06). Photos are looked up by id, never by index.
 */
import fs from 'node:fs';
import path from 'node:path';
import { photos } from '@/data/generated/photos';
import { homeWaypointIds } from '@/data/home';
import { Regions } from '@/data/schemas/region';
import { buildWaypoints, homeInput } from '@/lib/ascent/waypoints';

const regions = Regions.parse(
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/regions/regions.json'), 'utf8')),
);

const photo = (id: string) => {
  const p = photos.find((x) => x.id === id);
  if (!p) throw new Error(`data/generated/photos.ts has no photo ${id}`);
  return p;
};
const region = (id: string) => {
  const r = regions.regions.find((x) => x.id === id);
  if (!r) throw new Error(`data/regions/regions.json has no region ${id}`);
  return r;
};

describe('homeWaypointIds is strict (DATA-09, D-07)', () => {
  it('holds exactly four ids, all unique', () => {
    expect(homeWaypointIds).toHaveLength(4);
    expect(new Set(homeWaypointIds).size).toBe(4);
  });

  it("is, as a set, today's four Matterhorn waypoints", () => {
    expect(new Set(homeWaypointIds)).toEqual(new Set(['img-0605', 'img-0629', 'img-0662', 'r004-011']));
  });

  it.each([...homeWaypointIds])('%s is a generated photo in region zermatt', (id) => {
    expect(photo(id).region).toBe('zermatt');
  });

  it('puts every listed photo on the matterhorn plate through its region', () => {
    expect(region('zermatt').plate).toBe('matterhorn');
    for (const id of homeWaypointIds) expect(region(photo(id).region).plate).toBe('matterhorn');
  });

  // 16 D-04: Home's own altitude labels (cards, kicker, pins, plaque) have no
  // 'ground' wording, so an aerial photo must never reach the ascent.
  it('every Home waypoint is a ground photo (16 D-04)', () => {
    for (const id of homeWaypointIds) expect(photo(id).kind).toBe('ground');
    expect(buildWaypoints().every((w) => w.aerial === false)).toBe(true);
  });
});

describe('Home list edges (DATA-09, D-06)', () => {
  it('throws a RangeError naming a listed id that has no photo (empty edge)', () => {
    expect(() => homeInput(['img-0605', 'img-9999'])).toThrow(RangeError);
    expect(() => homeInput(['img-0605', 'img-9999'])).toThrow(/img-9999/);
  });

  it('orders the ascent by DEM height, never by the list order (ordering edge)', () => {
    const reversed = [...homeWaypointIds].reverse();
    expect(buildWaypoints(homeInput(reversed)).map((w) => w.id)).toEqual(
      buildWaypoints().map((w) => w.id),
    );
  });
});
