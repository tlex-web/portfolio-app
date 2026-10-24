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
    expect(sidecar.photos.map((p) => p.id)).toEqual([
      'img-0605',
      'img-0629',
      'img-0662',
      'r004-011',
    ]);
  });

  test('every sha256 is 64 lowercase hex characters and the four are distinct', () => {
    const hashes = sidecar.photos.map((p) => p.sha256);
    for (const h of hashes) expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(new Set(hashes).size).toBe(4);
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
    // Guard against a vacuous pass: the pattern must see the three digital photos' coordinates.
    expect(raw.match(/"(lat|lon)": -?\d+(\.\d+)?/g)).toHaveLength(6);
    expect(raw).not.toMatch(/"(lat|lon)": -?\d+\.\d{5,}/);
  });

  test.each(DIGITAL)('%s parsed lat and lon pass Coord4', (id) => {
    const gps = photo(id).gps;
    expect(gps).not.toBeNull();
    expect(Coord4.safeParse(gps?.lat).success).toBe(true);
    expect(Coord4.safeParse(gps?.lon).success).toBe(true);
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

  test('ExifSidecar rejects duplicate or unsorted ids', () => {
    const [a, b] = sidecar.photos;
    expect(ExifSidecar.safeParse({ schemaVersion: 1, photos: [b, a] }).success).toBe(false);
    expect(ExifSidecar.safeParse({ schemaVersion: 1, photos: [a, a] }).success).toBe(false);
  });
});
