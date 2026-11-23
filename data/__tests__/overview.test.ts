/**
 * @jest-environment node
 */
/**
 * DATA-12 (16 D-16, D-18, D-20, D-21): the Alps overview's committed source and
 * parameters, pinned before the overview build (16-15) is written.
 *
 * data/terrain/overview/{dem.png, source.json} come from one manual run of
 * `npm run terrain:fetch:overview` (Copernicus DEM GLO-90). data/terrain/overview.json
 * holds Tim's 16-02 parameters and summits. These tests pin the source's
 * integrity (sha256, PNG header), the verbatim GLO-90 notice, the 72-slot tile
 * accounting (sea only by tileList.txt membership, T-16-29), and the parameters,
 * budget and summits exactly as 16-02 recorded them.
 *
 * 16-15 adds the built overview: data/generated/overview.ts (server-only) and
 * public/terrain/overview-contours-alps.<hash>.svg, written by terrain:build in
 * the same run as every plate. Its budget is counted here with zlib (raw bytes
 * and brotli at quality 11), against OVERVIEW_BUDGET.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { overview } from '@/data/generated/overview';
import {
  GLO90_LIABILITY,
  GLO90_NOTICE,
  OVERVIEW_BUDGET,
  OVERVIEW_SLOTS,
  OverviewConfig,
  OverviewSource,
  type OverviewSummit,
} from '@/data/schemas/overview';
import { Country } from '@/data/schemas/photo';
import { Regions } from '@/data/schemas/region';
import { Plates, TerrainSource } from '@/data/schemas/terrain';
import { lv95ToWgs84 } from '@/lib/geo';

const ROOT = process.cwd();
const DIR = 'data/terrain/overview';
const readText = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const rawSource = JSON.parse(readText(`${DIR}/source.json`));
const source = OverviewSource.parse(rawSource);
const rawConfig = JSON.parse(readText('data/terrain/overview.json'));
const config = OverviewConfig.parse(rawConfig);
const png = fs.readFileSync(path.join(ROOT, DIR, source.file));

/** A deep copy to mutate for the negative controls. */
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

describe('overview source (D-16)', () => {
  it('source.json parses with OverviewSource', () => {
    expect(OverviewSource.safeParse(rawSource).success).toBe(true);
    expect(source.product).toBe('Copernicus DEM GLO-90');
    expect(source.rasterType).toBe('PixelIsPoint');
    expect(source.overviewLevel).toBe(2);
    expect(source.heightScale).toBe(1);
  });

  it("dem.png's sha256 equals the record's", () => {
    expect(crypto.createHash('sha256').update(png).digest('hex')).toBe(source.sha256);
  });

  it("dem.png is a 16-bit greyscale PNG of the record's width and height", () => {
    // PNG signature, then the IHDR chunk: width, height, bit depth, colour type.
    expect(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
    expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(source.width);
    expect(png.readUInt32BE(20)).toBe(source.height);
    expect(png[24]).toBe(16);
    expect(png[25]).toBe(0);
  });

  it('is the 16-02 grid: 1,200 x 872 plate carrée x cos 46.5° over 5-17° E by 43-49° N', () => {
    expect(source.width).toBe(1200);
    expect(source.height).toBe(Math.round((1200 * 6) / (12 * Math.cos((46.5 * Math.PI) / 180))));
    expect(source.height).toBe(872);
    expect(source.projection).toEqual({ kind: 'plate-carree', standardParallelDeg: 46.5 });
    expect(source.lon).toEqual([5, 17]);
    expect(source.lat).toEqual([43, 49]);
  });

  it('tiles and absent are disjoint and together cover all 72 slots (T-16-29)', () => {
    expect(OVERVIEW_SLOTS).toHaveLength(72);
    const present = new Set(source.tiles);
    expect(source.absent.filter((n) => present.has(n))).toEqual([]);
    expect([...source.tiles, ...source.absent].sort()).toEqual([...OVERVIEW_SLOTS].sort());
    // The run of 2026-11-23: 71 listed, the Adriatic slot N43 E014 is sea.
    expect(source.tiles).toHaveLength(71);
    expect(source.absent).toEqual(['Copernicus_DSM_COG_30_N43_00_E014_00_DEM']);
  });

  it('rejects a slot that is both present and absent, or a missing slot', () => {
    const both = clone(rawSource);
    both.absent = [...both.absent, both.tiles[0]].sort();
    expect(OverviewSource.safeParse(both).success).toBe(false);
    const missing = clone(rawSource);
    missing.tiles = missing.tiles.slice(1);
    expect(OverviewSource.safeParse(missing).success).toBe(false);
  });
});

describe('GLO-90 notice (D-21)', () => {
  it('the record carries the notice and liability sentence verbatim', () => {
    expect(source.notice).toBe(GLO90_NOTICE);
    expect(source.liability).toBe(GLO90_LIABILITY);
  });

  it('the notice names WorldDEM™-90 and both rights holders', () => {
    expect(GLO90_NOTICE).toContain('WorldDEM™-90');
    expect(GLO90_NOTICE).toContain('© DLR e.V. 2010-2014');
    expect(GLO90_NOTICE).toContain('Airbus Defence and Space GmbH 2014-2018');
    expect(GLO90_NOTICE).toMatch(/^produced using Copernicus WorldDEM™-90 /);
  });

  it('the liability sentence names the Copernicus programme', () => {
    expect(GLO90_LIABILITY).toContain('Copernicus programme');
    expect(GLO90_LIABILITY).toContain('do not incur any liability');
    expect(GLO90_LIABILITY).toContain('WorldDEM™-90');
  });

  it('both are the sentences the 16-02 spike note copied from the licence', () => {
    const spike = readText(
      '.planning/phases/16-new-regions-alps-overview-data/16-OVERVIEW-SPIKE.md'
    );
    expect(spike).toContain(`> "${GLO90_NOTICE}"`);
    expect(spike).toContain(`> "${GLO90_LIABILITY}"`);
  });

  it('rejects a paraphrased notice or one without the ™', () => {
    const plain = clone(rawSource);
    plain.notice = GLO90_NOTICE.replace('WorldDEM™-90', 'WorldDEM-90');
    expect(OverviewSource.safeParse(plain).success).toBe(false);
    const short = clone(rawSource);
    short.liability = GLO90_LIABILITY.replace(' by law or by delegation', '');
    expect(OverviewSource.safeParse(short).success).toBe(false);
  });
});

describe('overview config (D-18, D-20)', () => {
  it('overview.json parses with OverviewConfig', () => {
    expect(OverviewConfig.safeParse(rawConfig).success).toBe(true);
  });

  it("holds Tim's 16-02 variant C parameters with no hillshade", () => {
    expect(config.contours).toEqual({
      intervalM: 1000,
      fromM: 1000,
      indexEvery: 5,
      blurPx: 3,
      simplifyPx: 2,
      ringFilterPx: 8,
    });
    expect(config.hillshade).toBe(false);
  });

  it("OVERVIEW_BUDGET is Tim's 16-02 budget", () => {
    expect(OVERVIEW_BUDGET).toEqual({
      contoursBrotliMax: 30_000,
      contoursRawMax: 120_000,
      servedMax: 250_000,
    });
  });

  it('has 3 to 5 summits with unique names, Grossglockner spelled with ss', () => {
    const names = config.summits.map((s) => s.name);
    expect(names.length).toBeGreaterThanOrEqual(3);
    expect(names.length).toBeLessThanOrEqual(5);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain('Grossglockner');
    expect(names.join()).not.toContain('ß');
  });

  it('every officialRef is https; only the secondary summit has none', () => {
    for (const s of config.summits) {
      if (s.officialRef === null) {
        expect(s.status).toBe('secondary');
      } else {
        expect(new URL(s.officialRef).protocol).toBe('https:');
        expect(s.status).toBe('confirmed');
      }
    }
  });

  it('records the five summits and heights Tim confirmed in 16-02', () => {
    const byName = (n: string): OverviewSummit => {
      const s = config.summits.find((x) => x.name === n);
      if (!s) throw new Error(`overview.json has no summit ${n}`);
      return s;
    };
    expect(config.summits.map((s) => [s.name, s.country, s.officialM, s.status])).toEqual([
      ['Dufourspitze', 'CH', 4634, 'confirmed'],
      ['Mont Blanc', 'FR', 4806, 'confirmed'],
      ['Grossglockner', 'AT', 3798, 'confirmed'],
      ['Zugspitze', 'DE', 2962, 'confirmed'],
      ['Triglav', 'SI', 2864, 'secondary'],
    ]);
    expect(byName('Mont Blanc').officialRef).toContain('geoportail.gouv.fr');
    expect(byName('Triglav').officialRef).toBeNull();
  });

  it("summit countries come from photo.ts's closed Country list", () => {
    for (const s of config.summits) {
      expect(Country.options).toContain(s.country);
      for (const b of s.borders) expect(Country.options).toContain(b);
    }
    const bad = clone(rawConfig);
    bad.summits[0].country = 'XX';
    expect(OverviewConfig.safeParse(bad).success).toBe(false);
  });

  it('rejects six summits, a duplicate name, or a confirmed summit without officialRef', () => {
    const six = clone(rawConfig);
    six.summits.push({ ...six.summits[0], name: 'Extra' });
    expect(OverviewConfig.safeParse(six).success).toBe(false);
    const dup = clone(rawConfig);
    dup.summits[1].name = dup.summits[0].name;
    expect(OverviewConfig.safeParse(dup).success).toBe(false);
    const noRef = clone(rawConfig);
    noRef.summits[0].officialRef = null;
    expect(OverviewConfig.safeParse(noRef).success).toBe(false);
  });
});

/** The overview's served files in public/terrain/, by name. */
const terrainListing = () => fs.readdirSync(path.join(ROOT, 'public/terrain')).sort();
const servedFile = (url: string) => fs.readFileSync(path.join(ROOT, 'public', url));

describe('overview build (16-15, DATA-12)', () => {
  const contours = servedFile(overview.contours.url);

  it('the contour URL is the one overview-contours-alps file, named by its own sha256', () => {
    const name = path.posix.basename(overview.contours.url);
    expect(overview.contours.url).toBe(`/terrain/${name}`);
    expect(terrainListing().filter((f) => f.startsWith('overview-contours-alps.'))).toEqual([name]);
    const hash = crypto.createHash('sha256').update(contours).digest('hex').slice(0, 10);
    expect(name).toBe(`overview-contours-alps.${hash}.svg`);
  });

  it("is within OVERVIEW_BUDGET: raw bytes and brotli quality 11 bytes (T-16-35)", () => {
    const brotli = zlib.brotliCompressSync(contours, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length;
    expect(contours.length).toBeLessThanOrEqual(OVERVIEW_BUDGET.contoursRawMax);
    expect(brotli).toBeLessThanOrEqual(OVERVIEW_BUDGET.contoursBrotliMax);
  });

  it("records Tim's 16-02 parameters, the projection and the grid from the committed source", () => {
    const { levels, url, ...params } = overview.contours;
    expect(params).toEqual(config.contours);
    expect(url).toMatch(/^\/terrain\/overview-contours-alps\.[0-9a-f]{10}\.svg$/);
    // The 3 x 3 blur keeps the highest massifs under 4,000 m: three levels, as the spike measured.
    expect(levels).toEqual([1000, 2000, 3000]);
    expect(overview.projection).toEqual({ ...source.projection, lon: source.lon, lat: source.lat });
    expect(overview.grid).toEqual({ width: source.width, height: source.height });
    expect(overview.source.sha256).toBe(source.sha256);
  });

  it('the contour SVG draws the whole 1,200 x 872 grid with strokes only', () => {
    const text = contours.toString('utf8');
    expect(text.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 872">')).toBe(true);
    expect(text).not.toMatch(/<(?!\/?(?:svg|g|path)\b)/);
  });

  it('carries the GLO-90 notice and liability sentence verbatim from the record (D-21)', () => {
    expect(overview.notice).toBe(source.notice);
    expect(overview.notice).toBe(GLO90_NOTICE);
    expect(overview.liability).toBe(source.liability);
    expect(overview.liability).toBe(GLO90_LIABILITY);
  });

  it('adds nothing to the client-safe terrain modules (Phase 15 D-15)', () => {
    for (const rel of [
      'data/generated/terrain.ts',
      'data/generated/precache.json',
      'data/generated/plates.ts',
      'data/generated/home-plate.ts',
    ]) {
      const text = readText(rel);
      expect(text).not.toContain('overview');
      expect(text).not.toContain('WorldDEM');
    }
  });
});

describe('overview outlines and summits (16-15, D-17, D-18)', () => {
  const regions = Regions.parse(JSON.parse(readText('data/regions/regions.json')));
  const plates = Plates.parse(JSON.parse(readText('data/terrain/plates.json')));
  const inUnit = ({ u, v }: { u: number; v: number }) => u >= 0 && u <= 1 && v >= 0 && v <= 1;
  const has4dp = (x: number) => Math.round(x * 1e4) / 1e4 === x;
  /** The 16-02 projection: u = (lon − 5) / 12, v = (49 − lat) / 6 over the source window. */
  const toUv = ({ lat, lon }: { lat: number; lon: number }) => ({
    u: (lon - source.lon[0]) / (source.lon[1] - source.lon[0]),
    v: (source.lat[1] - lat) / (source.lat[1] - source.lat[0]),
  });

  it("holds one outline per region, in regions.json order, with the region's plate", () => {
    expect(overview.outlines.map((o) => [o.region, o.plate])).toEqual(
      regions.regions.map((r) => [r.id, r.plate])
    );
    for (const o of overview.outlines) {
      expect(plates.plates.map((p) => p.id)).toContain(o.plate);
      expect(o.corners).toHaveLength(4);
      for (const c of o.corners) {
        expect(inUnit(c)).toBe(true);
        expect(has4dp(c.u) && has4dp(c.v)).toBe(true);
      }
    }
  });

  it("the zermatt outline is the Matterhorn extent's corners projected, within one grid pixel", () => {
    const home = plates.plates.find((p) => p.home);
    if (!home) throw new Error('plates.json has no home plate');
    const record = TerrainSource.parse(JSON.parse(readText(`${home.source}/source.json`)));
    expect(record.crs).toBe('EPSG:2056');
    const { west, south, east, north } = record.extent;
    const expected = [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
    ].map(([e, n]) => toUv(lv95ToWgs84({ e, n })));
    const zermatt = overview.outlines.find((o) => o.region === 'zermatt');
    if (!zermatt) throw new Error('overview.ts has no zermatt outline');
    expect(zermatt.plate).toBe(home.id);
    zermatt.corners.forEach((c, i) => {
      expect(Math.abs(c.u - expected[i].u)).toBeLessThanOrEqual(1 / source.width);
      expect(Math.abs(c.v - expected[i].v)).toBeLessThanOrEqual(1 / source.height);
    });
    // SW, SE, NE, NW: south below north (v grows southward), west left of east.
    const [sw, se, ne, nw] = zermatt.corners;
    expect(sw.v).toBeGreaterThan(nw.v);
    expect(se.u).toBeGreaterThan(sw.u);
    expect(ne.v).toBeLessThan(se.v);
  });

  it('every outline spans a plate-sized quadrilateral, about 14 to 17 grid px (16-02 measured)', () => {
    for (const o of overview.outlines) {
      const us = o.corners.map((c) => c.u * source.width);
      const vs = o.corners.map((c) => c.v * source.height);
      for (const span of [Math.max(...us) - Math.min(...us), Math.max(...vs) - Math.min(...vs)]) {
        expect(span).toBeGreaterThan(12);
        expect(span).toBeLessThan(19);
      }
    }
  });

  it('holds the 3 to 5 summits of overview.json, in its order, with official data and UV', () => {
    expect(overview.summits.length).toBeGreaterThanOrEqual(3);
    expect(overview.summits.length).toBeLessThanOrEqual(5);
    expect(new Set(overview.summits.map((s) => s.name)).size).toBe(overview.summits.length);
    expect(overview.summits.map((s) => [s.name, s.country, s.officialM, s.status, s.officialRef])).toEqual(
      config.summits.map((s) => [s.name, s.country, s.officialM, s.status, s.officialRef])
    );
    overview.summits.forEach((s, i) => {
      expect(inUnit(s.uv)).toBe(true);
      const want = toUv(config.summits[i]);
      expect(s.uv.u).toBeCloseTo(want.u, 4);
      expect(s.uv.v).toBeCloseTo(want.v, 4);
    });
  });

  it('outlines and summits stay separate records: a summit beside an outline removes neither', () => {
    expect(overview.outlines).toHaveLength(regions.regions.length);
    expect(overview.summits).toHaveLength(config.summits.length);
    const outlineKeys = new Set(Object.keys(overview.outlines[0]));
    for (const s of overview.summits) for (const k of Object.keys(s)) expect(outlineKeys.has(k)).toBe(false);
    // Dufourspitze sits beside the Matterhorn plate (16-02: the dots touch at 375 px); both are kept.
    const zermatt = overview.outlines.find((o) => o.region === 'zermatt');
    const dufour = overview.summits.find((s) => s.name === 'Dufourspitze');
    expect(zermatt && dufour).toBeTruthy();
  });
});

describe('overview hillshade and served total (16-15, D-19, D-20)', () => {
  it("builds no overview poster: Tim chose no hillshade in 16-02", () => {
    expect(config.hillshade).toBe(false);
    expect(overview.hillshade).toBe(false);
    expect(terrainListing().filter((f) => f.startsWith('overview-hillshade-'))).toEqual([]);
    expect(readText('data/generated/overview.ts')).not.toContain('hillshade-');
  });

  it("every file overview.ts references is served within OVERVIEW_BUDGET's served cap (T-16-35)", () => {
    const urls = [...readText('data/generated/overview.ts').matchAll(/"(\/terrain\/[^"]+)"/g)].map((m) => m[1]);
    expect(urls).toEqual([overview.contours.url]);
    const served = urls.reduce((sum, url) => sum + servedFile(url).length, 0);
    expect(served).toBeLessThanOrEqual(OVERVIEW_BUDGET.servedMax);
  });
});
