/**
 * @jest-environment node
 */
/**
 * DATA-10 (15 D-01 to D-05): the photo map, the region registry and the
 * membership they give every photo.
 *
 * data/photos/photo-map.json is the source-file -> id map and the membership
 * record (one record per photo: file, region, country); data/regions/regions.json
 * names each region's plate. photos:build enforces the same rules in CI; these
 * tests pin them for every photo, so a future "all photos are Zermatt" shortcut
 * or a defaulted country fails red (15-06 assumption-delta invariant).
 */
import fs from 'node:fs';
import path from 'node:path';
import { photos } from '@/data/generated/photos';
import { Country, ExifSidecar, PhotoMap } from '@/data/schemas/photo';
import { Regions } from '@/data/schemas/region';
import { Plates } from '@/data/schemas/terrain';

const readJson = (rel: string): unknown =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), 'utf8'));

const photoMap = PhotoMap.parse(readJson('data/photos/photo-map.json'));
const regions = Regions.parse(readJson('data/regions/regions.json'));
const plates = Plates.parse(readJson('data/terrain/plates.json'));
const sidecar = ExifSidecar.parse(readJson('data/photos/exif-sidecar.json'));

const record = (id: string) => {
  const r = photoMap.photos[id];
  if (!r) throw new Error(`photo-map.json has no record ${id}`);
  return r;
};
const sidecarEntry = (id: string) => {
  const e = sidecar.photos.find((p) => p.id === id);
  if (!e) throw new Error(`the sidecar has no entry ${id}`);
  return e;
};
const region = (id: string) => {
  const r = regions.regions.find((x) => x.id === id);
  if (!r) throw new Error(`regions.json has no region ${id}`);
  return r;
};
const generated = (id: string) => {
  const p = photos.find((x) => x.id === id);
  if (!p) throw new Error(`photos.ts has no entry ${id}`);
  return p;
};

describe('photo map and region registry: committed data', () => {
  test('the committed map parses with PhotoMap and the registry with Regions', () => {
    expect(PhotoMap.safeParse(readJson('data/photos/photo-map.json')).success).toBe(true);
    expect(Regions.safeParse(readJson('data/regions/regions.json')).success).toBe(true);
  });

  test('D-03: the registry holds only zermatt, named Zermatt, on plate matterhorn', () => {
    expect(regions.regions.map((r) => r.id)).toEqual(['zermatt']);
    expect(region('zermatt')).toEqual({ id: 'zermatt', name: 'Zermatt', plate: 'matterhorn' });
  });

  test("D-01: the map's ids equal the sidecar's and each record's file is the sidecar entry's", () => {
    expect(Object.keys(photoMap.photos)).toEqual(sidecar.photos.map((p) => p.id));
    for (const id of Object.keys(photoMap.photos)) {
      expect(record(id).file).toBe(sidecarEntry(id).file);
    }
  });

  test("every record's region is in the registry and every region's plate is in plates.json", () => {
    const plateIds = new Set(plates.plates.map((p) => p.id));
    for (const id of Object.keys(photoMap.photos)) region(record(id).region);
    for (const r of regions.regions) expect(plateIds.has(r.plate)).toBe(true);
  });

  test('every photo is in exactly one known region', () => {
    for (const p of photos) {
      const holders = regions.regions.filter((r) => r.id === record(p.id).region);
      expect(holders).toHaveLength(1);
    }
  });

  test('D-02: all four current photos are zermatt / CH, read from their records', () => {
    for (const id of ['img-0605', 'img-0629', 'img-0662', 'r004-011']) {
      expect(record(id).region).toBe('zermatt');
      expect(record(id).country).toBe('CH');
    }
  });

  test("D-05: each generated photo's region and country equal its record's", () => {
    expect(photos.map((p) => p.id)).toEqual(Object.keys(photoMap.photos));
    for (const id of Object.keys(photoMap.photos)) {
      expect(generated(id).region).toBe(record(id).region);
      expect(generated(id).country).toBe(record(id).country);
    }
  });
});

describe('photo map and region registry: schema boundaries', () => {
  test('D-02: Country is a closed enum (rejects ch, CHE and XX; accepts CH, IT and AT)', () => {
    expect(Country.safeParse('ch').success).toBe(false);
    expect(Country.safeParse('CHE').success).toBe(false);
    expect(Country.safeParse('XX').success).toBe(false);
    expect(Country.safeParse('CH').success).toBe(true);
    expect(Country.safeParse('IT').success).toBe(true);
    expect(Country.safeParse('AT').success).toBe(true);
  });

  test('PhotoMap rejects an empty map', () => {
    expect(PhotoMap.safeParse({ schemaVersion: 1, photos: {} }).success).toBe(false);
  });

  test('PhotoMap rejects unsorted keys', () => {
    const unsorted = {
      'img-0629': record('img-0629'),
      'img-0605': record('img-0605'),
    };
    expect(PhotoMap.safeParse({ schemaVersion: 1, photos: unsorted }).success).toBe(false);
  });

  test('PhotoMap rejects two records naming one file, with a message naming both ids', () => {
    const result = PhotoMap.safeParse({
      schemaVersion: 1,
      photos: {
        'img-0605': record('img-0605'),
        'img-0629': { ...record('img-0629'), file: record('img-0605').file },
      },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message).join('\n')).toContain(
      'is named by both img-0605 and img-0629; one original has one record'
    );
  });

  test('PhotoMap rejects a file with a directory and a record with an extra key', () => {
    const base = record('img-0605');
    const one = (entry: unknown) => ({ schemaVersion: 1, photos: { 'img-0605': entry } });
    expect(PhotoMap.safeParse(one(base)).success).toBe(true);
    expect(PhotoMap.safeParse(one({ ...base, file: `photos/${base.file}` })).success).toBe(false);
    expect(PhotoMap.safeParse(one({ ...base, lat: 46.0 })).success).toBe(false);
  });

  test('Regions rejects unsorted ids', () => {
    const saas = { id: 'saas', name: 'Saas', plate: 'matterhorn' };
    const zermatt = region('zermatt');
    expect(Regions.safeParse({ schemaVersion: 1, regions: [saas, zermatt] }).success).toBe(true);
    expect(Regions.safeParse({ schemaVersion: 1, regions: [zermatt, saas] }).success).toBe(false);
  });
});
