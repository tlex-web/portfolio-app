/**
 * @jest-environment node
 */
/**
 * DATA-11 (D-10 to D-15): the plate registry, the generated plates.ts module and
 * the files it points at.
 *
 * data/terrain/plates.json lists every plate the terrain build owns;
 * scripts/terrain/build-terrain.mjs writes every plate's 2D sheet to
 * data/generated/plates.ts beside the untouched terrain.ts (the home plate's
 * full module). These tests pin the registry rules, the home plate's sheet
 * against terrain.ts (no drift), the flat URL shape, the four asset-root lists
 * that must keep covering /terrain/ (F14) and each plate's asset budget.
 */
import fs from 'node:fs';
import path from 'node:path';
import { plates } from '@/data/generated/plates';
import { terrain } from '@/data/generated/terrain';
import {
  PLATE_BUDGET,
  type PlateEntry,
  Plates,
  type PlateSheet,
  PlatesMeta,
} from '@/data/schemas/terrain';

const ROOT = process.cwd();
const readText = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const registry = Plates.parse(JSON.parse(readText('data/terrain/plates.json')));
const entry = (id: string): PlateEntry => {
  const p = registry.plates.find((x) => x.id === id);
  if (!p) throw new Error(`plates.json has no plate ${id}`);
  return p;
};

/** Every URL a sheet references (heightmaps, contour LODs, posters). */
const sheetUrls = (s: PlateSheet): string[] =>
  [
    ...Object.values(s.assets.heightmap ?? {}),
    ...Object.values(s.assets.contours),
    ...Object.values(s.assets.hillshade.avif),
    ...Object.values(s.assets.hillshade.webp),
  ].filter((u): u is string => typeof u === 'string');

const terrainUrls: string[] = [
  ...Object.values(terrain.assets.heightmap),
  ...Object.values(terrain.assets.contours),
  ...Object.values(terrain.assets.hillshade.avif),
  ...Object.values(terrain.assets.hillshade.webp),
];

/** A valid 2D plate (the 15-05 fixture shape), the positive control for every mutation below. */
const fixture: PlateEntry = {
  id: 'fixture',
  prefix: 'fixture-',
  source: 'data/terrain/plates/fixture',
  home: false,
  threeD: false,
  outputs: { contours: ['hero', 'strip'], hillshade: [1100, 640] },
  strip: { centreN: 1200500 },
};
const home = entry('matterhorn');
const withPlates = (...ps: unknown[]) => ({ schemaVersion: 1, plates: ps });
const fixtureWith = (patch: Record<string, unknown>) => ({ ...fixture, ...patch });

describe('plate registry (D-10, D-11, D-12)', () => {
  test('the committed registry parses with Plates and lists matterhorn as the home plate', () => {
    // Matterhorn stays first and the only home plate as regional plates join (16-12 saalfelden).
    expect(registry.plates[0]?.id).toBe('matterhorn');
    expect(registry.plates.filter((p) => p.home).map((p) => p.id)).toEqual(['matterhorn']);
    expect(home).toMatchObject({ prefix: '', home: true, threeD: true });
    expect(home.outputs).toEqual({
      heightmaps: [512, 256],
      contours: ['hero', 'map', 'strip'],
      hillshade: [1100, 640],
    });
  });

  test('positive control: the home plate plus a valid 2D plate parses', () => {
    expect(Plates.safeParse(withPlates(home, fixture)).success).toBe(true);
  });

  test.each<[string, unknown]>([
    ['zero plates', withPlates()],
    ['no home plate', withPlates(fixture)],
    ['a duplicate id', withPlates(home, fixture, fixture)],
    [
      'an id of heightmap',
      withPlates(
        home,
        fixtureWith({
          id: 'heightmap',
          prefix: 'heightmap-',
          source: 'data/terrain/plates/heightmap',
        })
      ),
    ],
    ['an id of contours', withPlates(home, fixtureWith({ id: 'contours', prefix: 'contours-' }))],
    [
      'an id of hillshade',
      withPlates(home, fixtureWith({ id: 'hillshade', prefix: 'hillshade-' })),
    ],
    [
      'two home plates',
      withPlates(home, { ...home, id: 'zermatt', source: 'data/terrain/plates/zermatt' }),
    ],
    ['a home plate with prefix matterhorn-', withPlates({ ...home, prefix: 'matterhorn-' })],
    ['a 2D home plate', withPlates({ ...home, threeD: false })],
    [
      'a home plate without the map LOD',
      withPlates({ ...home, outputs: { ...home.outputs, contours: ['hero', 'strip'] } }),
    ],
    [
      "a non-home plate whose prefix is not '<id>-'",
      withPlates(home, fixtureWith({ prefix: 'other-' })),
    ],
    ["a non-home plate with prefix ''", withPlates(home, fixtureWith({ prefix: '' }))],
    [
      'a 2D plate with heightmaps',
      withPlates(home, fixtureWith({ outputs: { ...fixture.outputs, heightmaps: [256] } })),
    ],
    [
      'a 2D plate with a map contour',
      withPlates(
        home,
        fixtureWith({ outputs: { ...fixture.outputs, contours: ['hero', 'map', 'strip'] } })
      ),
    ],
    [
      'a plate without the strip contour',
      withPlates(home, fixtureWith({ outputs: { ...fixture.outputs, contours: ['hero'] } })),
    ],
    [
      'a source containing ..',
      withPlates(home, fixtureWith({ source: 'data/terrain/plates/../source' })),
    ],
    ['an absolute source', withPlates(home, fixtureWith({ source: '/etc/terrain' }))],
    ['an unknown field', withPlates(home, fixtureWith({ extra: true }))],
  ])('rejects %s', (_label, registryJson) => {
    expect(Plates.safeParse(registryJson).success).toBe(false);
  });
});

describe('plates.ts (the generated 2D sheets)', () => {
  test('parses with PlatesMeta and holds exactly the registry ids in registry order', () => {
    expect(PlatesMeta.safeParse(plates).success).toBe(true);
    expect(Object.keys(plates)).toEqual(registry.plates.map((p) => p.id));
  });

  test('a sheet whose URL carries another plate prefix fails PlateSheet', () => {
    const m = plates.matterhorn;
    const bad = {
      matterhorn: {
        ...m,
        assets: {
          ...m.assets,
          contours: { ...m.assets.contours, hero: '/terrain/fixture-contours-hero.0123456789.svg' },
        },
      },
    };
    expect(PlatesMeta.safeParse(bad).success).toBe(false);
  });

  test('plates.matterhorn equals terrain on every 2D field and URL (no drift)', () => {
    const m = plates.matterhorn;
    expect(m).toMatchObject({ id: 'matterhorn', prefix: '', home: true, threeD: true });
    expect(m.crs).toBe(terrain.crs);
    expect(m.extent).toEqual(terrain.extent);
    expect(m.dem).toEqual({
      product: terrain.dem.product,
      edition: terrain.dem.edition,
      cellM: terrain.dem.cellM,
    });
    expect(m.contours).toEqual(terrain.contours);
    expect(m.contours.strip.lv95).toEqual(terrain.contours.strip.lv95);
    expect(m.assets.heightmap).toEqual(terrain.assets.heightmap);
    expect(m.assets.contours).toEqual(terrain.assets.contours);
    expect(m.assets.hillshade).toEqual(terrain.assets.hillshade);
  });

  test("the registry's matterhorn strip.centreN is terrain's summit northing", () => {
    expect(entry('matterhorn').strip.centreN).toBe(terrain.summit.lv95.n);
  });

  // 16 D-09, D-28: Saalfelden is a 12 km BEV ALS DTM plate on LAEA Europe, 2D only.
  test('the saalfelden sheet is a 12 km EPSG:3035 BEV plate', () => {
    const s = plates.saalfelden;
    expect(s).toMatchObject({
      id: 'saalfelden',
      prefix: 'saalfelden-',
      home: false,
      threeD: false,
    });
    expect(s.crs).toBe('EPSG:3035');
    expect(s.extent.laea).toEqual({ west: 4529000, south: 2701000, east: 4541000, north: 2713000 });
    expect(Object.hasOwn(s.extent, 'lv95')).toBe(false);
    expect(s.extent.widthM).toBe(12000);
    expect(s.extent.heightM).toBe(12000);
    expect(s.dem).toEqual({ product: 'BEV ALS DTM', edition: '2025-09', cellM: 10 });
    expect(Object.hasOwn(s.assets, 'heightmap')).toBe(false);
    expect(Object.keys(s.assets.contours).sort()).toEqual(['hero', 'strip']);
    expect(Object.hasOwn(s.contours, 'map')).toBe(false);
    expect(Object.hasOwn(s.contours.strip, 'laea')).toBe(true);
    expect(entry('saalfelden').source).toBe('data/terrain/plates/saalfelden');
  });

  // 16 D-07, D-27: Ortler is a swissALTIRegio plate on LV95, 2D only. The summit-centred
  // default moved 2 km east on the 1 km grid so it holds both of Tim's Ortler photos (16-16).
  test('the ortler sheet is a compact EPSG:2056 swissALTIRegio plate', () => {
    const s = plates.ortler;
    expect(s).toMatchObject({ id: 'ortler', prefix: 'ortler-', home: false, threeD: false });
    expect(s.crs).toBe('EPSG:2056');
    const box = { west: 2834000, south: 1150000, east: 2846000, north: 1162000 };
    expect(s.extent.lv95).toEqual(box);
    expect(Object.hasOwn(s.extent, 'laea')).toBe(false);
    expect(s.extent.widthM).toBe(s.extent.heightM);
    expect(s.extent.widthM).toBe(box.east - box.west);
    expect(s.extent.widthM).toBeLessThanOrEqual(20000);
    expect(s.dem).toEqual({ product: 'swissALTIRegio', edition: '2026-05', cellM: 10 });
    expect(Object.hasOwn(s.assets, 'heightmap')).toBe(false);
    expect(Object.keys(s.assets.contours).sort()).toEqual(['hero', 'strip']);
    expect(Object.hasOwn(s.contours, 'map')).toBe(false);
    expect(Object.hasOwn(s.contours.strip, 'lv95')).toBe(true);
    expect(entry('ortler').source).toBe('data/terrain/plates/ortler');
    expect(entry('ortler').strip.centreN).toBe((box.south + box.north) / 2);
  });

  test('plates.ts has no import and no path data', () => {
    const text = readText('data/generated/plates.ts');
    expect(text).not.toMatch(/^\s*import /m);
    expect(text).not.toContain('d="');
  });
});

describe('flat hashed URLs (F14)', () => {
  const sheets = Object.values(PlatesMeta.parse(plates));
  const all = [...new Set([...terrainUrls, ...sheets.flatMap(sheetUrls)])].sort();

  test('terrain.ts and plates.ts reference at least the nine D-15 files', () => {
    expect(all.length).toBeGreaterThanOrEqual(9);
  });

  test.each(all)('%s is flat under /terrain/ and exists in public/terrain/', (url) => {
    expect(url).toMatch(/^\/terrain\/[a-z0-9-]+\.[0-9a-f]{10}\.(svg|png|avif|webp)$/);
    expect(fs.existsSync(path.join(ROOT, 'public', url))).toBe(true);
  });
});

describe('asset-root reconcile (F14): every list keeps covering a prefixed /terrain/ file', () => {
  const prefixedName = 'fixture-contours-hero.0123456789.svg';

  test('next.config.ts sends cache headers for /terrain/:path*', () => {
    expect(readText('next.config.ts')).toMatch(/source:\s*'\/terrain\/:path\*'/);
  });

  test('the service worker serves /terrain/ cache-first', () => {
    expect(readText('public/service-worker.js')).toMatch(
      /url\.pathname\.startsWith\('\/terrain\/'\)/
    );
  });

  test("proxy.ts's matcher skips terrain/ (and so every prefixed plate file)", () => {
    const m = /source:\s*'(\/\(\(\?![^']*\)\.\*\))'/.exec(readText('proxy.ts'));
    expect(m).not.toBeNull();
    const matcher = new RegExp(`^${m![1]}$`);
    expect(matcher.test(`/terrain/${prefixedName}`)).toBe(false);
    expect(matcher.test('/terrain/contours-hero.2f3a04accc.svg')).toBe(false);
    expect(matcher.test('/photos')).toBe(true);
  });

  const guard = readText('scripts/guards/check-served-images.mjs');

  test("the served-images guard's HASHED_DIRS holds public/terrain/", () => {
    const m = /const HASHED_DIRS = \[([^\]]*)\];/.exec(guard);
    expect(m).not.toBeNull();
    const dirs = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
    expect(dirs).toContain('public/terrain/');
  });

  test("the guard's HASH_NAME accepts a prefixed plate file and today's names", () => {
    const m = /const HASH_NAME = \/(.+)\/;$/m.exec(guard);
    expect(m).not.toBeNull();
    const hashName = new RegExp(m![1]);
    expect(hashName.test(prefixedName)).toBe(true);
    expect(hashName.test('hillshade-1100.ba22a91f95.avif')).toBe(true);
  });

  test('the guard reads plates.ts as a manifest', () => {
    expect(guard).toContain("file: 'data/generated/plates.ts'");
  });
});

describe('per-plate asset budget (PLATE_BUDGET, research §2.4)', () => {
  const bytes = (url: string) => fs.statSync(path.join(ROOT, 'public', url)).size;
  const sheets = Object.entries(PlatesMeta.parse(plates));

  // 16 D-09: PlateSheet is a union on crs; the budget sees every plate's sheet,
  // LV95 (EPSG:2056) and LAEA (EPSG:3035) alike.
  test('the budget covers every registry plate, whatever its crs', () => {
    expect(sheets).toHaveLength(registry.plates.length);
  });

  test.each(sheets)('%s serves and fetches within its budget', (_id, sheet) => {
    const served = sheetUrls(sheet).reduce((sum, u) => sum + bytes(u), 0);
    const servedMax = sheet.threeD ? PLATE_BUDGET.servedMax3D : PLATE_BUDGET.servedMax2D;
    expect(served).toBeLessThanOrEqual(servedMax);

    const poster = sheet.assets.hillshade.avif[1100] ?? sheet.assets.hillshade.avif[640];
    if (poster === undefined) throw new Error(`${sheet.id} has no AVIF poster`);
    const fetched =
      bytes(poster) + bytes(sheet.assets.contours.hero) + bytes(sheet.assets.contours.strip);
    expect(fetched).toBeLessThanOrEqual(PLATE_BUDGET.fetchMax);
  });
});
