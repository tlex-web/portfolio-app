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
import { plates as plates2d } from '@/data/generated/plates';
import { Country, ExifSidecar, PhotoMap } from '@/data/schemas/photo';
import { lv95ToUv, round4, wgs84ToLv95 } from '@/lib/geo';
import { Regions } from '@/data/schemas/region';
import { Plates, PlatesMeta } from '@/data/schemas/terrain';

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

  test('D-03, 16 D-08 / D-13: the registry holds ortler, saalfelden and zermatt, each with its country, plate and approved facts', () => {
    // 16-14 rewrite in place (GUARD-03): the registry grew from zermatt alone to the
    // two regions Tim approved in 16-08; zermatt keeps plate matterhorn (D-14).
    // 16-17 adds ortler with the one fact Tim kept (16-17-SUMMARY, "Tim's reply").
    expect(regions.regions.map((r) => r.id)).toEqual(['ortler', 'saalfelden', 'zermatt']);
    expect(region('ortler')).toEqual({
      id: 'ortler',
      name: 'Ortler',
      country: 'IT',
      plate: 'ortler',
      facts: [
        {
          text: 'The Ortler is the highest mountain in South Tyrol and the main peak of the Ortler Alps.',
          source: 'https://en.wikipedia.org/wiki/Ortler',
        },
      ],
    });
    expect(region('zermatt')).toEqual({
      id: 'zermatt',
      name: 'Zermatt',
      country: 'CH',
      plate: 'matterhorn',
      facts: [
        {
          text: 'Zermatt lies at the head of the Matter Valley in the Swiss canton of Valais.',
          source: 'https://en.wikipedia.org/wiki/Zermatt',
        },
        {
          text: 'The town bans combustion-engine cars, apart from some emergency, municipal and permitted vehicles, and most visitors arrive by rack railway.',
          source: 'https://en.wikipedia.org/wiki/Zermatt',
        },
      ],
    });
    expect(region('saalfelden')).toEqual({
      id: 'saalfelden',
      name: 'Saalfelden',
      country: 'AT',
      plate: 'saalfelden',
      facts: [
        {
          text: 'Saalfelden am Steinernen Meer is a town in the Zell am See district of the Austrian state of Salzburg, in the historic Pinzgau region.',
          source: 'https://en.wikipedia.org/wiki/Saalfelden',
        },
        {
          text: "The Steinernes Meer, the karst plateau in the town's full name, is part of the Berchtesgaden Alps.",
          source: 'https://en.wikipedia.org/wiki/Steinernes_Meer',
        },
      ],
    });
  });

  test("16 D-08: every record's country is its region's country", () => {
    for (const id of Object.keys(photoMap.photos)) {
      expect(record(id).country).toBe(region(record(id).region).country);
    }
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

  // 15 IN-07: the schema already makes region ids unique, so these check what it cannot.
  test('every registry region holds at least one photo', () => {
    const held = new Set<string>(photos.map((p) => p.region));
    const empty = regions.regions.map((r) => r.id).filter((id) => !held.has(id));
    expect(empty).toEqual([]);
  });

  test('every photo on an EPSG:2056 plate has the uv of its position on that plate (EPSG:3035 plates are checked by photos:build and the guard selftest)', () => {
    // PlatesMeta is a union on crs (16 D-09), so the EPSG:2056 check below narrows extent to lv95.
    const sheets = PlatesMeta.parse(plates2d);
    let checked = 0;
    for (const p of photos) {
      if (!p.position) continue;
      const plateId = region(p.region).plate;
      const sheet = sheets[plateId];
      if (!sheet) throw new Error(`plates.ts has no sheet ${plateId} for ${p.id}`);
      if (sheet.crs !== 'EPSG:2056') continue;
      const uv = lv95ToUv(wgs84ToLv95(p.position), sheet.extent.lv95);
      expect({ id: p.id, uv: p.uv }).toEqual({
        id: p.id,
        uv: { u: round4(uv.u), v: round4(uv.v) },
      });
      checked += 1;
    }
    expect(checked).toBeGreaterThan(0);
  });

  test('D-02: all four current photos are zermatt / CH / 4dp / ground, read from their records', () => {
    for (const id of ['img-0605', 'img-0629', 'img-0662', 'r004-011']) {
      expect(record(id).region).toBe('zermatt');
      expect(record(id).country).toBe('CH');
      expect(record(id).precision).toBe('4dp');
      expect(record(id).kind).toBe('ground');
    }
  });

  /**
   * Tim's 16-08 decisions (16-08-SUMMARY "Decisions (Tim, verbatim)"), one row per
   * photo: file, region, country, precision and kind. 16 D-02 is one-way, so a
   * record that differs from his reply fails here (16-14).
   */
  const TIM_16_08: Record<
    string,
    { file: string; region: string; country: string; precision: string; kind: string }
  > = {
    'img-0680': {
      file: '_MG_0680.jpg',
      region: 'zermatt',
      country: 'CH',
      precision: '4dp',
      kind: 'ground',
    },
    'img-0682': {
      file: 'IMG_0682.jpg',
      region: 'zermatt',
      country: 'CH',
      precision: '4dp',
      kind: 'ground',
    },
    'sam-20240910-143659': {
      file: '20240910_143659.jpg',
      region: 'zermatt',
      country: 'CH',
      precision: '4dp',
      kind: 'ground',
    },
    'dji-20260919-162232': {
      file: 'dji_fly_20260919_162232_0153_1789843115521_photo.jpg',
      region: 'saalfelden',
      country: 'AT',
      precision: '3dp',
      kind: 'aerial',
    },
    'dji-20260919-163558': {
      file: 'dji_fly_20260919_163558_0163_1789843047771_photo.jpg',
      region: 'saalfelden',
      country: 'AT',
      precision: '3dp',
      kind: 'aerial',
    },
  };

  test("D-02: every 16-08 photo's record is exactly Tim's recorded file, region, country, precision and kind", () => {
    for (const id of Object.keys(TIM_16_08)) expect(record(id)).toEqual(TIM_16_08[id]);
  });

  /**
   * Tim's 16-17 decisions (16-17-SUMMARY "Tim's reply"): both Ortler photos at 3dp,
   * ground, IT, region ortler. 16 D-02 is one-way, so a differing record fails here.
   */
  const TIM_16_17: Record<
    string,
    { file: string; region: string; country: string; precision: string; kind: string }
  > = {
    'sam-20160717-120906': {
      file: '20160717_120906-Topaz-Sharpen-Strong-Denoise-2.jpg',
      region: 'ortler',
      country: 'IT',
      precision: '3dp',
      kind: 'ground',
    },
    'sam-20160717-124904': {
      file: '20160717_124904-Topaz-Sharpen-Auto-Denoise-2.jpg',
      region: 'ortler',
      country: 'IT',
      precision: '3dp',
      kind: 'ground',
    },
  };

  test("D-02: every 16-17 Ortler photo's record is exactly Tim's recorded file, region, country, precision and kind", () => {
    for (const id of Object.keys(TIM_16_17)) expect(record(id)).toEqual(TIM_16_17[id]);
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

  test('16 D-02: PhotoMap rejects a record without a precision (no default)', () => {
    const { precision, ...rest } = record('img-0605');
    expect(precision).toBe('4dp');
    const one = (entry: unknown) => ({ schemaVersion: 1, photos: { 'img-0605': entry } });
    expect(() => PhotoMap.parse(one(rest))).toThrow();
    expect(PhotoMap.safeParse(one({ ...rest, precision: '5dp' })).success).toBe(false);
  });

  test('16 D-04: PhotoMap rejects a record without a kind (no default)', () => {
    const { kind, ...rest } = record('img-0605');
    expect(kind).toBe('ground');
    const one = (entry: unknown) => ({ schemaVersion: 1, photos: { 'img-0605': entry } });
    expect(() => PhotoMap.parse(one(rest))).toThrow();
    expect(PhotoMap.safeParse(one({ ...rest, kind: 'drone' })).success).toBe(false);
  });

  test('Regions rejects unsorted ids', () => {
    const saas = { ...region('zermatt'), id: 'saas', name: 'Saas' };
    const zermatt = region('zermatt');
    expect(Regions.safeParse({ schemaVersion: 1, regions: [saas, zermatt] }).success).toBe(true);
    expect(Regions.safeParse({ schemaVersion: 1, regions: [zermatt, saas] }).success).toBe(false);
  });
});
