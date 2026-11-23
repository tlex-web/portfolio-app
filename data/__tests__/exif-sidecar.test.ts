/**
 * DATA-02, DATA-06 (D-03, D-04, D-10): invariants of the committed EXIF sidecar.
 *
 * data/photos/exif-sidecar.json is stage 1 of the photo pipeline, written by
 * scripts/photos/extract-exif.mjs from the gitignored originals. These tests pin
 * it to the EXIF facts Tim confirmed (D-04 capture times, camera and lens), to
 * the film scan's scan-date trap (D-03) and to the 4-decimal GPS rule (DATA-06),
 * and they pin the schema boundaries that keep a bad value out of a commit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Coord4, ExifSidecar, ExifSidecarEntry, NaiveLocal } from '@/data/schemas/photo';

const raw = fs.readFileSync(path.join(process.cwd(), 'data/photos/exif-sidecar.json'), 'utf8');
const sidecar = JSON.parse(raw) as ExifSidecar;
const byId = new Map(sidecar.photos.map((p) => [p.id, p]));
const photo = (id: string) => {
  const p = byId.get(id);
  if (!p) throw new Error(`sidecar has no entry ${id}`);
  return p;
};
const DIGITAL = ['img-0605', 'img-0629', 'img-0662'];

describe('exif sidecar: schema and shape', () => {
  test('the committed sidecar parses with ExifSidecar', () => {
    expect(() => ExifSidecar.parse(sidecar)).not.toThrow();
  });

  test('holds one entry per original, sorted by id', () => {
    // 16-14 rewrite in place (GUARD-03): one entry per photo-map record, so the
    // expected ids follow the map; the four v2.0 photos stay in it.
    const photoMap = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data/photos/photo-map.json'), 'utf8')
    ) as { photos: Record<string, unknown> };
    const ids = sidecar.photos.map((p) => p.id);
    expect(ids).toEqual(Object.keys(photoMap.photos).sort());
    expect(ids).toEqual(expect.arrayContaining(['img-0605', 'img-0629', 'img-0662', 'r004-011']));
  });

  test('every sha256 is 64 lowercase hex characters and every entry has its own', () => {
    const hashes = sidecar.photos.map((p) => p.sha256);
    for (const h of hashes) expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(hashes.length).toBeGreaterThanOrEqual(4);
    expect(new Set(hashes).size).toBe(hashes.length);
  });
});

describe('exif sidecar: D-04 capture facts', () => {
  test.each([
    ['img-0605', '2021-09-06T10:48:46'],
    ['img-0629', '2021-09-06T11:22:57'],
    ['img-0662', '2021-09-07T10:58:25'],
  ])('%s dateTimeOriginal is the naive local %s', (id, local) => {
    expect(photo(id).dateTimeOriginal).toBe(local);
  });

  test.each(DIGITAL)('%s is a Canon EOS 6D Mark II with the EF24-105mm f/4L IS II USM', (id) => {
    expect(photo(id).model).toBe('Canon EOS 6D Mark II');
    expect(photo(id).lens).toBe('EF24-105mm f/4L IS II USM');
  });
});

describe('exif sidecar: D-03 film scan', () => {
  test('r004-011 has no GPS (null, not a guessed position)', () => {
    expect(photo('r004-011').gps).toBeNull();
  });

  test('r004-011 dateTimeOriginal is the 2020-02-12 scan date, kept raw', () => {
    expect(photo('r004-011').dateTimeOriginal?.startsWith('2020-02-12T15:38')).toBe(true);
  });
});

describe('exif sidecar: DATA-06 rounding', () => {
  test('no lat or lon in the raw JSON text has more than 4 decimals', () => {
    // Guard against a vacuous pass: the pattern must see every GPS entry's coordinates,
    // at least the three digital v2.0 photos' (16-14: the count follows the entries).
    const withGps = sidecar.photos.filter((p) => p.gps !== null).length;
    expect(withGps).toBeGreaterThanOrEqual(3);
    expect(raw.match(/"(lat|lon)": -?\d+(\.\d+)?/g)).toHaveLength(2 * withGps);
    expect(raw).not.toMatch(/"(lat|lon)": -?\d+\.\d{5,}/);
  });

  test.each(DIGITAL)('%s parsed lat and lon pass Coord4', (id) => {
    const gps = photo(id).gps;
    expect(gps).not.toBeNull();
    expect(Coord4.safeParse(gps?.lat).success).toBe(true);
    expect(Coord4.safeParse(gps?.lon).success).toBe(true);
  });
});

describe('exif sidecar with the photo map: 16 D-03, D-04 (16-REVIEW WR-01)', () => {
  type MapRecord = { precision: '4dp' | '3dp' | '2dp'; kind: 'ground' | 'aerial' };
  const records = (
    JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data/photos/photo-map.json'), 'utf8')
    ) as { photos: Record<string, MapRecord> }
  ).photos;
  const recordOf = (id: string) => {
    const r = records[id];
    if (!r) throw new Error(`photo map has no record ${id}`);
    return r;
  };

  test('the walk is not vacuous: the map holds a coarse, an aerial and a DJI photo', () => {
    const entries = sidecar.photos.filter((p) => p.gps !== null);
    expect(entries.some((p) => recordOf(p.id).precision !== '4dp')).toBe(true);
    expect(entries.some((p) => recordOf(p.id).kind === 'aerial')).toBe(true);
    expect(sidecar.photos.some((p) => p.make?.trim().toLowerCase() === 'dji')).toBe(true);
  });

  test('a coarse or aerial photo keeps no GPS altitude', () => {
    // Ids only in the failure output, never the altitude (D-12).
    const offenders = sidecar.photos
      .filter((p) => p.gps !== null && p.gps.altM !== null)
      .filter((p) => recordOf(p.id).precision !== '4dp' || recordOf(p.id).kind === 'aerial')
      .map((p) => p.id);
    expect(offenders).toEqual([]);
  });

  test("a coarse photo's groundM names its region plate's current source (16-REVIEW WR-02)", () => {
    const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), 'utf8'));
    const { regions } = read('data/regions/regions.json') as {
      regions: { id: string; plate: string }[];
    };
    const { plates } = read('data/terrain/plates.json') as {
      plates: { id: string; source: string }[];
    };
    const plateSha = (region: string) => {
      const plateId = regions.find((r) => r.id === region)?.plate;
      const source = plates.find((p) => p.id === plateId)?.source;
      if (!source) throw new Error(`region ${region} has no registered plate`);
      return (read(`${source.replace(/\/+$/, '')}/source.json`) as { sha256: string }).sha256;
    };
    const mapRegions = (
      JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'data/photos/photo-map.json'), 'utf8')
      ) as { photos: Record<string, { region: string }> }
    ).photos;
    const coarse = sidecar.photos.filter(
      (p) => p.gps !== null && recordOf(p.id).precision !== '4dp'
    );
    expect(coarse.length).toBeGreaterThan(0);
    const stale = coarse
      .filter((p) => p.gps?.groundSourceSha256 !== plateSha(mapRegions[p.id].region))
      .map((p) => p.id);
    expect(stale).toEqual([]);
  });

  test("every DJI still is kind 'aerial'", () => {
    const offenders = sidecar.photos
      .filter((p) => p.make?.trim().toLowerCase() === 'dji' && recordOf(p.id).kind !== 'aerial')
      .map((p) => p.id);
    expect(offenders).toEqual([]);
  });
});

describe('photo schema boundaries', () => {
  test.each([46.015, 7.7414])('Coord4 accepts %s (at most 4 decimals)', (v) => {
    expect(Coord4.safeParse(v).success).toBe(true);
  });

  test('Coord4 rejects 46.01502 (5 decimals)', () => {
    expect(Coord4.safeParse(46.01502).success).toBe(false);
  });

  test("NaiveLocal accepts '2021-09-06T10:48:46' and rejects a trailing Z", () => {
    expect(NaiveLocal.safeParse('2021-09-06T10:48:46').success).toBe(true);
    expect(NaiveLocal.safeParse('2021-09-06T10:48:46Z').success).toBe(false);
  });

  test('ExifSidecarEntry rejects an entry with an extra key (strictObject)', () => {
    const entry = photo('img-0605');
    expect(ExifSidecarEntry.safeParse(entry).success).toBe(true);
    expect(ExifSidecarEntry.safeParse({ ...entry, city: 'Zermatt' }).success).toBe(false);
  });

  test('the sidecar schema stays closed to camera serials and XMP (PITFALLS "Drone material", T-15-09)', () => {
    const entry = photo('img-0605');
    expect(ExifSidecarEntry.safeParse(entry).success).toBe(true);
    expect(ExifSidecarEntry.safeParse({ ...entry, serial: 'x' }).success).toBe(false);
    expect(
      ExifSidecarEntry.safeParse({ ...entry, xmp: { GPSLatitude: 46.0, FlightYawDegree: 12 } })
        .success
    ).toBe(false);
  });

  test('ExifSidecar rejects duplicate or unsorted ids', () => {
    const [a, b] = sidecar.photos;
    expect(ExifSidecar.safeParse({ schemaVersion: 1, photos: [b, a] }).success).toBe(false);
    expect(ExifSidecar.safeParse({ schemaVersion: 1, photos: [a, a] }).success).toBe(false);
  });
});
