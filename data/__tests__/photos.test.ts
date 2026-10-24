/**
 * DATA-02, DATA-03, DATA-04, DATA-06 (D-01..D-04, D-08, D-17): invariants of the
 * generated photo facts.
 *
 * data/generated/photos.ts is stage 2 of the photo pipeline, rebuilt by
 * scripts/photos/build-photo-data.mjs from the committed sidecar, Tim's
 * corrections and the DEM source (its --check runs in `npm run lint`). These
 * tests pin the output to every CONTEXT decision: EXIF capture times with the
 * Europe/Zurich offset, the film scan's year-only capture and approximate
 * Riffelsee pin, the Gornerschlucht override, DEM heights, derived tags and the
 * 4-decimal coordinate rule.
 *
 * DEM heights come from the one sampler (bilinear at pixel centres of the native
 * 10 m raster) at the committed 4-decimal coordinates. RESEARCH Pitfall 2's
 * 1,674.9 m for img-0629 was measured at full-precision GPS; in the gorge a
 * ~3 m rounding shift gives 1,668 m, which is the defined value.
 */
import fs from 'node:fs';
import path from 'node:path';
import { lowestDemM, photos } from '@/data/generated/photos';
import { terrain } from '@/data/generated/terrain';
import { Capture, Coord4, PhotoFacts, Position } from '@/data/schemas/photo';
import { lv95ToUv, round4, wgs84ToLv95 } from '@/lib/geo';

const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
const photosText = read('data/generated/photos.ts');
const correctionsText = read('data/photos/corrections.json');
const corrections = JSON.parse(correctionsText) as {
  photos: Record<string, { position?: { lat: number; lon: number } }>;
};

type Fact = (typeof photos)[number];
const byId = new Map<string, Fact>(photos.map((p) => [p.id, p]));
const photo = (id: string): Fact => {
  const p = byId.get(id);
  if (!p) throw new Error(`photos.ts has no entry ${id}`);
  return p;
};
const DIGITAL = ['img-0605', 'img-0629', 'img-0662'];

describe('photo facts: schema and order', () => {
  test('every entry parses with PhotoFacts', () => {
    for (const p of photos) expect(() => PhotoFacts.parse(p)).not.toThrow();
  });

  test('holds the four photos sorted by id', () => {
    expect(photos.map((p) => p.id)).toEqual(['img-0605', 'img-0629', 'img-0662', 'r004-011']);
  });
});

describe('captures (D-03, D-04)', () => {
  test.each([
    ['img-0605', '2021-09-06T10:48:46'],
    ['img-0629', '2021-09-06T11:22:57'],
    ['img-0662', '2021-09-07T10:58:25'],
  ])('%s is the EXIF wall time %s in Europe/Zurich at +02:00', (id, local) => {
    expect(photo(id).capture).toEqual({
      precision: 'second',
      local,
      timeZone: 'Europe/Zurich',
      offset: '+02:00',
      source: 'exif',
    });
  });

  test('the film scan is a year-only 2019 capture from Tim', () => {
    expect(photo('r004-011').capture).toEqual({ precision: 'year', year: 2019, source: 'Tim' });
  });

  test("the film scan's 2020-02-12 scan date appears nowhere in photos.ts", () => {
    expect(photosText).not.toMatch(/2020-02-12/);
  });

  test('a year-only capture cannot carry a month or a day', () => {
    expect(Capture.safeParse({ precision: 'year', year: 2019, source: 'Tim' }).success).toBe(true);
    expect(
      Capture.safeParse({ precision: 'year', year: 2019, month: 5, source: 'Tim' }).success
    ).toBe(false);
    expect(
      Capture.safeParse({ precision: 'year', year: 2019, day: 1, source: 'Tim' }).success
    ).toBe(false);
  });
});

describe('positions (DATA-04, D-02)', () => {
  test('the film scan is hand-placed on the Riffelsee north shore, approximate with reason and radius', () => {
    const pos = photo('r004-011').position;
    expect(pos).toMatchObject({
      lat: 45.9837,
      lon: 7.7623,
      source: 'hand-placed',
      approximate: true,
      radiusM: 100,
    });
    expect(pos?.reason).toEqual(expect.stringContaining('Riffelsee'));
  });

  test.each(DIGITAL)('%s has its EXIF position, not approximate', (id) => {
    expect(photo(id).position).toMatchObject({ source: 'exif', approximate: false });
  });

  test('Position rejects an approximate position without a reason or a radius', () => {
    const base = { lat: 45.9837, lon: 7.7623, source: 'hand-placed', approximate: true };
    expect(Position.safeParse({ ...base, reason: 'x', radiusM: 100 }).success).toBe(true);
    expect(Position.safeParse({ ...base, radiusM: 100 }).success).toBe(false);
    expect(Position.safeParse({ ...base, reason: 'x' }).success).toBe(false);
  });

  test('Position rejects a hand-placed position that claims to be exact', () => {
    expect(
      Position.safeParse({
        lat: 45.9837,
        lon: 7.7623,
        source: 'hand-placed',
        approximate: false,
        reason: 'x',
        radiusM: 100,
      }).success
    ).toBe(false);
  });
});

describe('location overrides (D-01, D-02)', () => {
  test('the waterfall is the Gornerschlucht, confirmed by Tim', () => {
    expect(photo('img-0629').locationOverride).toEqual({
      name: 'Gornerschlucht',
      reason: 'EXIF GPS + confirmed by Tim',
      source: 'Tim',
    });
  });

  test('the film scan is the Riffelsee', () => {
    expect(photo('r004-011').locationOverride?.name).toBe('Riffelsee');
  });

  test('the other two digital photos carry no override', () => {
    expect(photo('img-0605').locationOverride).toBeNull();
    expect(photo('img-0662').locationOverride).toBeNull();
  });
});

describe('DEM heights (D-17)', () => {
  test.each([
    ['img-0605', 1617, 1],
    ['img-0629', 1668, 1],
    ['img-0662', 2585, 1],
    ['r004-011', 2757, 5],
  ])('%s is within the tolerance of %i m', (id, metres, tolerance) => {
    const e = photo(id).elevation;
    expect(e?.source).toBe('dem');
    expect(Number.isInteger(e?.m)).toBe(true);
    expect(Math.abs((e?.m ?? NaN) - metres)).toBeLessThanOrEqual(tolerance);
  });

  test('lowestDemM is the minimum photo DEM height (the altimeter rail start)', () => {
    const heights = photos.map((p) => p.elevation?.m ?? Infinity);
    expect(lowestDemM).toBe(Math.min(...heights));
    expect(lowestDemM).toBe(1617);
  });
});

describe('exposure', () => {
  test.each(DIGITAL)('%s carries the six camera facts', (id) => {
    expect(photo(id).exif).toMatchObject({
      camera: 'Canon EOS 6D Mark II',
      lens: 'EF24-105mm f/4L IS II USM',
    });
  });

  test('the film scan has no camera facts', () => {
    expect(photo('r004-011').exif).toBeNull();
    expect(photo('r004-011').medium).toBe('film-scan');
  });
});

describe('derived tags (D-08)', () => {
  test.each(DIGITAL)('%s is tagged 2021 and autumn', (id) => {
    expect(photo(id).tags).toEqual({ year: '2021', season: 'autumn' });
  });

  test('the film scan is tagged 2019 with no season', () => {
    expect(photo('r004-011').tags).toEqual({ year: '2019', season: null });
  });

  test("no photo carries the old hand-typed '2024' tag", () => {
    for (const p of photos) expect(p.tags.year).not.toBe('2024');
  });
});

describe('coordinates (DATA-06, DATA-01)', () => {
  test('no latitude or longitude in photos.ts or corrections.json has 5+ decimals', () => {
    for (const text of [photosText, correctionsText]) {
      expect(text).not.toMatch(/"(lat|lon)": -?\d+\.\d{5,}/);
    }
  });

  test('every position coordinate passes Coord4', () => {
    const coords = [
      ...photos.flatMap((p) => (p.position ? [p.position.lat, p.position.lon] : [])),
      ...Object.values(corrections.photos).flatMap((c) =>
        c.position ? [c.position.lat, c.position.lon] : []
      ),
    ];
    expect(coords.length).toBe(10);
    for (const c of coords) expect(Coord4.safeParse(c).success).toBe(true);
  });

  test('Coord4 rejects a 5-decimal coordinate', () => {
    expect(Coord4.safeParse(46.01502).success).toBe(false);
  });

  test.each(['img-0605', 'img-0629', 'img-0662', 'r004-011'])(
    '%s uv is round4 of its LV95 position in the terrain extent',
    (id) => {
      const p = photo(id);
      if (!p.position) throw new Error(`${id} has no position`);
      const uv = lv95ToUv(wgs84ToLv95(p.position), terrain.extent.lv95);
      expect(p.uv).toEqual({ u: round4(uv.u), v: round4(uv.v) });
    }
  );
});
