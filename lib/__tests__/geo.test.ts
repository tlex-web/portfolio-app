/**
 * DATA-01 coordinate contract: WGS84 <-> LV95 against three swisstopo REFRAME
 * oracles (RESEARCH Code Example 1), the terrain UV convention (u east, v south)
 * and the summit-centred 5:1 footer strip (UI-SPEC "Contour band").
 */
import { lv95ToUv, lv95ToWgs84, round4, stripBbox, uvToLv95, wgs84ToLv95 } from '@/lib/geo';
import type { Bbox, Lv95 } from '@/lib/geo';

/** The D-14 extent: 11 x 11 km round the Matterhorn. */
const EXTENT: Bbox = { west: 2616000, south: 1088000, east: 2627000, north: 1099000 };

/** Recorded from geodesy.geo.admin.ch/reframe/wgs84tolv95. */
const ORACLES: [string, { lat: number; lon: number }, Lv95][] = [
  ['Matterhorn summit', { lat: 45.9763, lon: 7.6586 }, { e: 2617047.955, n: 1091660.413 }],
  [
    'Riffelsee label',
    { lat: 45.983375549316406, lon: 7.762086868286133 },
    { e: 2625065.748, n: 1092474.685 },
  ],
  ['img-0605', { lat: 46.01502, lon: 7.74144 }, { e: 2623452.121, n: 1095986.121 }],
];

const distM = (a: Lv95, b: Lv95) => Math.hypot(a.e - b.e, a.n - b.n);

describe('wgs84ToLv95', () => {
  test.each(ORACLES)('%s is within 1 m of the REFRAME oracle', (_name, wgs, lv95) => {
    expect(distM(wgs84ToLv95(wgs), lv95)).toBeLessThan(1);
  });
});

describe('lv95ToWgs84', () => {
  test.each(ORACLES)('%s round-trips through WGS84 within 1 m', (_name, _wgs, lv95) => {
    expect(distM(wgs84ToLv95(lv95ToWgs84(lv95)), lv95)).toBeLessThan(1);
  });
});

describe('terrain UV (u east, v south)', () => {
  test('the summit maps to (0.0953, 0.6661) in the default extent', () => {
    const { u, v } = lv95ToUv({ e: 2617049, n: 1091673 }, EXTENT);
    expect(Math.abs(u - 0.0953)).toBeLessThan(0.001);
    expect(Math.abs(v - 0.6661)).toBeLessThan(0.001);
  });

  test('north-west corner is (0, 0) and south-east corner is (1, 1)', () => {
    expect(lv95ToUv({ e: EXTENT.west, n: EXTENT.north }, EXTENT)).toEqual({ u: 0, v: 0 });
    expect(lv95ToUv({ e: EXTENT.east, n: EXTENT.south }, EXTENT)).toEqual({ u: 1, v: 1 });
  });

  test.each([
    { e: 2617049, n: 1091673 },
    { e: 2623452, n: 1095986 },
    { e: 2621053, n: 1093279 },
    { e: 2625066, n: 1092475 },
  ])('uvToLv95 inverts lv95ToUv exactly for E $e N $n', (p) => {
    expect(uvToLv95(lv95ToUv(p, EXTENT), EXTENT)).toEqual(p);
  });
});

describe('round4', () => {
  test('rounds to 4 decimals (DATA-06 location privacy)', () => {
    expect(round4(46.01502)).toBe(46.015);
    expect(round4(7.74144)).toBe(7.7414);
    expect(round4(46.015)).toBe(46.015);
    expect(round4(7.76208687)).toBe(7.7621);
  });
});

describe('stripBbox (5:1, summit-centred, snapped to 100 m)', () => {
  test('default extent and summit northing give the UI-SPEC strip', () => {
    expect(stripBbox(EXTENT, 1091673)).toEqual({
      west: 2616000,
      south: 1090600,
      east: 2627000,
      north: 1092800,
    });
  });

  test('a summit 500 m from the north edge shifts the strip inside the extent', () => {
    const b = stripBbox(EXTENT, EXTENT.north - 500);
    expect(b.north).toBe(EXTENT.north);
    expect(b.north - b.south).toBe((EXTENT.east - EXTENT.west) / 5);
    expect(b.west).toBe(EXTENT.west);
    expect(b.east).toBe(EXTENT.east);
  });

  test('a summit 500 m from the south edge shifts the strip inside the extent', () => {
    const b = stripBbox(EXTENT, EXTENT.south + 500);
    expect(b.south).toBe(EXTENT.south);
    expect(b.north - b.south).toBe((EXTENT.east - EXTENT.west) / 5);
  });

  test('ratio and snap are parameters', () => {
    expect(stripBbox(EXTENT, 1091673, 10, 50)).toEqual({
      west: 2616000,
      south: 1091100,
      east: 2627000,
      north: 1092200,
    });
  });

  test('an extent too short for the strip throws instead of returning a bbox outside it', () => {
    expect(() => stripBbox({ ...EXTENT, south: 1098000 }, 1098500)).toThrow(RangeError);
  });
});
