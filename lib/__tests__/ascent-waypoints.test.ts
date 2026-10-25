/**
 * The waypoint list (HOME-05; D-01, D-07, D-10; 09-UI-SPEC "Page Structure"
 * and "Waypoint Cards"): one ordering by DEM height for the cards, pins and
 * rail, card fields derived from the photo facts, the editorial copy and the
 * content-hashed image manifest, and a hard failure on zero or orphan
 * waypoints. Expected strings come from the data and the tested formatters;
 * the only literals are the card copy the UI-SPEC fixes.
 */
import {
  buildWaypoints,
  waypointKicker,
  waypointKickerParts,
  type WaypointInput,
} from '@/lib/ascent/waypoints';
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { editorial } from '@/data/photos/editorial';
import { formatMetres } from '@/lib/photo-format';

/** formatMetres keeps the unit on its number with U+00A0. */
const NBSP = ' ';

describe('buildWaypoints on the committed data (HOME-05, D-01)', () => {
  const waypoints = buildWaypoints();

  it('orders the photos by DEM height ascending, k = 1..n of n', () => {
    expect(waypoints.map((w) => w.id)).toEqual(['img-0605', 'img-0629', 'img-0662', 'r004-011']);
    expect(waypoints.map((w) => w.k)).toEqual([1, 2, 3, 4]);
    expect(waypoints.every((w) => w.n === photos.length)).toBe(true);
  });

  it('takes each altitude from the generated photo facts', () => {
    expect(waypoints.map((w) => w.altitudeM)).toEqual([1617, 1668, 2585, 2760]);
    for (const w of waypoints) {
      const photo = photos.find((p) => p.id === w.id)!;
      expect(w.altitudeM).toBe(photo.elevation.m);
    }
  });

  it('marks only the hand-placed film scan as approximate', () => {
    expect(waypoints.filter((w) => w.approximate).map((w) => w.id)).toEqual(['r004-011']);
  });

  it('prints the place and date line from editorial location and capture (D-10)', () => {
    expect(waypoints.map((w) => w.placeDate)).toEqual([
      'Zermatt, Switzerland · Sep 2021',
      'Gornerschlucht, Zermatt · Sep 2021',
      'Matterhorn Glacier Trail, Zermatt · Sep 2021',
      'Riffelsee, Zermatt · 2019',
    ]);
  });

  it('prints the kicker with "approx." only for an approximate position', () => {
    expect(waypoints.map(waypointKicker)).toEqual([
      `1,617${NBSP}m · Waypoint 1 of 4`,
      `1,668${NBSP}m · Waypoint 2 of 4`,
      `2,585${NBSP}m · Waypoint 3 of 4`,
      `2,760${NBSP}m approx. · Waypoint 4 of 4`,
    ]);
    for (const w of waypoints) expect(waypointKicker(w)).toContain(formatMetres(w.altitudeM));
  });

  it('splits the kicker into its two unbreakable parts (G-09-3 b, D-20)', () => {
    expect(waypoints.map(waypointKickerParts)).toEqual([
      [`1,617${NBSP}m ·`, 'Waypoint 1 of 4'],
      [`1,668${NBSP}m ·`, 'Waypoint 2 of 4'],
      [`2,585${NBSP}m ·`, 'Waypoint 3 of 4'],
      [`2,760${NBSP}m approx. ·`, 'Waypoint 4 of 4'],
    ]);
  });

  it('joins the kicker parts with one space into the kicker, for every waypoint', () => {
    for (const w of waypoints) expect(waypointKickerParts(w).join(' ')).toBe(waypointKicker(w));
  });

  it('builds the place and date line from the place and the capture month (G-09-4 N2)', () => {
    expect(waypoints.map((w) => w.captureMonth)).toEqual(['Sep 2021', 'Sep 2021', 'Sep 2021', '2019']);
    for (const w of waypoints) expect(w.placeDate).toBe(`${w.place} · ${w.captureMonth}`);
  });

  it('copies slug, title, alt and story verbatim from the editorial copy', () => {
    for (const w of waypoints) {
      const copy = editorial[w.id as keyof typeof editorial];
      expect([w.slug, w.title, w.alt, w.story, w.place]).toEqual([
        copy.slug,
        copy.title,
        copy.alt,
        copy.story,
        copy.location,
      ]);
    }
  });

  it('builds the card image from the 640 and 1024 manifest variants (D-07, T-09-03)', () => {
    const [first] = waypoints;
    const [v640, v1024] = imageManifest['img-0605'].variants;
    expect(first.image.srcSetWebp).toBe(`${v640.webp} 640w, ${v1024.webp} 1024w`);
    expect(first.image.srcSetAvif).toBe(`${v640.avif} 640w, ${v1024.avif} 1024w`);
    expect(first.image.src).toBe(v640.webp);
    expect([first.image.width, first.image.height]).toEqual([v640.width, v640.height]);
  });

  it('never uses a -large or -thumb file', () => {
    for (const w of waypoints) {
      const urls = [w.image.src, w.image.srcSetAvif, w.image.srcSetWebp].join(' ');
      expect(urls).not.toMatch(/-large|-thumb/);
      expect(urls).toMatch(/^\/images\/photos\//);
    }
  });
});

/** A minimal valid input with the given photo ids and elevations. */
function synthetic(entries: ReadonlyArray<readonly [id: string, m: number]>): WaypointInput {
  const variants = [640, 1024].map((edge) => ({
    longEdge: edge,
    width: edge,
    height: Math.round((edge * 2) / 3),
    avif: `/images/photos/x-${edge}.0123456789.avif`,
    webp: `/images/photos/x-${edge}.0123456789.webp`,
  }));
  return {
    photos: entries.map(([id, m]) => ({
      id,
      capture: { precision: 'year', year: 2020 },
      position: { lat: 46, lon: 7.7, approximate: false },
      uv: { u: 0.5, v: 0.5 },
      elevation: { m },
      locationOverride: null,
    })),
    editorial: Object.fromEntries(
      entries.map(([id]) => [
        id,
        { slug: `${id}-slug`, title: `Title ${id}`, alt: 'Alt', location: 'Place, Region', story: 'Story' },
      ]),
    ),
    imageManifest: Object.fromEntries(entries.map(([id]) => [id, { variants }])),
  };
}

describe('buildWaypoints on synthetic data (D-01 generalised)', () => {
  it('breaks an elevation tie by id ascending', () => {
    const ids = buildWaypoints(synthetic([['b', 2000], ['a', 2000], ['c', 1000]])).map((w) => w.id);
    expect(ids).toEqual(['c', 'a', 'b']);
  });

  it('prints "Waypoint 1 of 1" for a single photo', () => {
    const [only] = buildWaypoints(synthetic([['solo', 1500]]));
    expect(waypointKicker(only)).toBe(`1,500${NBSP}m · Waypoint 1 of 1`);
    expect(waypointKickerParts(only)).toEqual([`1,500${NBSP}m ·`, 'Waypoint 1 of 1']);
    expect(waypointKickerParts(only).join(' ')).toBe(waypointKicker(only));
    expect(only.placeDate).toBe(`${only.place} · ${only.captureMonth}`);
  });

  it('throws on an empty photo set', () => {
    expect(() => buildWaypoints(synthetic([]))).toThrow(RangeError);
  });

  it('throws, naming the photo, when its editorial entry is missing', () => {
    const input = synthetic([['orphan', 1500]]);
    expect(() => buildWaypoints({ ...input, editorial: {} })).toThrow(new RangeError('buildWaypoints: photo orphan has no editorial entry'));
  });

  it('throws, naming the photo, when its manifest entry has no 640 variant', () => {
    const input = synthetic([['small', 1500]]);
    const only1024 = { small: { variants: input.imageManifest.small!.variants.filter((v) => v.longEdge !== 640) } };
    expect(() => buildWaypoints({ ...input, imageManifest: only1024 })).toThrow(/photo small .*640/);
  });

  it('throws, naming the photo, when its uv is null', () => {
    const input = synthetic([['nouv', 1500]]);
    const photosNoUv = input.photos.map((p) => ({ ...p, uv: null }));
    expect(() => buildWaypoints({ ...input, photos: photosNoUv })).toThrow(/photo nouv has no uv/);
  });

  it('throws, naming the photo, when its uv lies outside [0, 1]', () => {
    const input = synthetic([['wide', 1500]]);
    const photosWide = input.photos.map((p) => ({ ...p, uv: { u: 1.2, v: 0.5 } }));
    expect(() => buildWaypoints({ ...input, photos: photosWide })).toThrow(RangeError);
    expect(() => buildWaypoints({ ...input, photos: photosWide })).toThrow(/photo wide/);
  });

  it('throws, naming the photo, when its position or elevation is null', () => {
    const input = synthetic([['bare', 1500]]);
    const noPosition = input.photos.map((p) => ({ ...p, position: null }));
    const noElevation = input.photos.map((p) => ({ ...p, elevation: null }));
    expect(() => buildWaypoints({ ...input, photos: noPosition })).toThrow(/photo bare has no position/);
    expect(() => buildWaypoints({ ...input, photos: noElevation })).toThrow(/photo bare has no elevation/);
  });
});
