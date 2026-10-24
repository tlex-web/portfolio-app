/**
 * DATA-01, D-14, D-17: invariants of the generated terrain module and its
 * content-hashed assets.
 *
 * data/generated/terrain.ts and public/terrain/* are written by
 * scripts/terrain/build-terrain.mjs from the committed source raster. These
 * tests read the committed files with fs only (sharp is ESLint-banned outside
 * scripts/), and pin the one-extent contract, the hash-in-name rule, the PNG
 * format, the SVG safety and no-frame rules, the LOD intervals, the summit and
 * the D-16 hillshade poster (dimensions and metadata are checked by
 * `terrain:build --check`, which decodes with sharp).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { terrain } from '@/data/generated/terrain';
import { TerrainMeta, TerrainSource } from '@/data/schemas/terrain';
import { lv95ToUv, round4, stripBbox } from '@/lib/geo';

const ROOT = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel));
const metaText = read('data/generated/terrain.ts').toString('utf8');
const source = TerrainSource.parse(JSON.parse(read('data/terrain/source/source.json').toString()));
const sha256 = (b: Buffer) => crypto.createHash('sha256').update(b).digest('hex');

const posterUrls: string[] = [
  ...Object.values(terrain.assets.hillshade.avif),
  ...Object.values(terrain.assets.hillshade.webp),
];
const urls: string[] = [
  ...Object.values(terrain.assets.heightmap),
  ...Object.values(terrain.assets.contours),
  ...posterUrls,
];
const lods = ['hero', 'map', 'strip'] as const;
const svgOf = (lod: (typeof lods)[number]) =>
  read(`public${terrain.assets.contours[lod]}`).toString('utf8');
const viewBox = (svg: string) => {
  const m = /viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/.exec(svg);
  if (!m) throw new Error('svg has no viewBox');
  return { W: Number(m[1]), H: Number(m[2]) };
};

/** Each subpath of an M/L/Z path as its points, plus whether it closes with Z. */
function subpaths(d: string): { pts: [number, number][]; closed: boolean }[] {
  const out: { pts: [number, number][]; closed: boolean }[] = [];
  for (const m of d.matchAll(/M([^MZ]*)(Z?)/g)) {
    const pts = m[1].split('L').map((p) => p.trim().split(' ').map(Number) as [number, number]);
    out.push({ pts, closed: m[2] === 'Z' });
  }
  return out;
}

describe('terrain module (T-08-12)', () => {
  test('terrain parses with TerrainMeta', () => {
    expect(() => TerrainMeta.parse(terrain)).not.toThrow();
  });

  test('terrain.ts has no import, no path data and is under 4096 bytes', () => {
    expect(metaText).not.toMatch(/^\s*import /m);
    expect(metaText).not.toContain('d="');
    expect(Buffer.byteLength(metaText)).toBeLessThan(4096);
  });

  test('dem.edition is YYYY-MM and equals source.json', () => {
    expect(terrain.dem.edition).toMatch(/^\d{4}-\d{2}$/);
    expect(terrain.dem.edition).toBe(source.edition);
    expect(terrain.dem.heightScale).toBe(source.heightScale);
  });

  test('LOD intervals: hero 100 m, map 50 m, strip 100 m, index every 5th', () => {
    expect(terrain.contours.hero).toEqual({ intervalM: 100, indexEvery: 5 });
    expect(terrain.contours.map).toEqual({ intervalM: 50, indexEvery: 5 });
    expect(terrain.contours.strip.intervalM).toBe(100);
    expect(terrain.contours.strip.indexEvery).toBe(5);
  });
});

describe('hashed assets', () => {
  test.each(urls)('%s exists and its 10-hex part is the sha256 of its bytes', (url) => {
    const m = /\.([0-9a-f]{10})\.(svg|png|avif|webp)$/.exec(url);
    expect(m).not.toBeNull();
    const bytes = read(`public${url}`);
    expect(sha256(bytes).slice(0, 10)).toBe(m![1]);
  });

  test.each([
    [512, terrain.assets.heightmap[512]],
    [256, terrain.assets.heightmap[256]],
  ])('heightmap %i is a %i-square 16-bit greyscale PNG', (size, url) => {
    const png = read(`public${url}`);
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.toString('latin1', 12, 16)).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(size);
    expect(png.readUInt32BE(20)).toBe(size);
    expect(png[24]).toBe(16); // bit depth
    expect(png[25]).toBe(0); // colour type: greyscale
  });
});

describe('hillshade poster (D-16)', () => {
  test('four distinct URLs: 1100 and 640, AVIF and WebP, each under its own key', () => {
    expect(new Set(posterUrls).size).toBe(4);
    for (const ext of ['avif', 'webp'] as const) {
      for (const size of [1100, 640] as const) {
        const url = terrain.assets.hillshade[ext][size];
        expect(url).toMatch(new RegExp(`^/terrain/hillshade-${size}\\.[0-9a-f]{10}\\.${ext}$`));
        expect(fs.existsSync(path.join(ROOT, 'public', url))).toBe(true);
      }
    }
  });

  test.each(Object.values(terrain.assets.hillshade.avif))('%s is an AVIF file', (url) => {
    const b = read(`public${url}`);
    expect(b.toString('latin1', 4, 8)).toBe('ftyp');
    expect(b.toString('latin1', 8, 12)).toBe('avif');
  });

  test.each(Object.values(terrain.assets.hillshade.webp))('%s is a WebP file', (url) => {
    const b = read(`public${url}`);
    expect(b.toString('latin1', 0, 4)).toBe('RIFF');
    expect(b.toString('latin1', 8, 12)).toBe('WEBP');
  });

  test('sourceSha256 equals the committed source.json sha256', () => {
    expect(terrain.assets.hillshade.sourceSha256).toBe(source.sha256);
  });

  test('NW light: 0.75 x (315, 45) + 0.25 x (270, 55)', () => {
    expect(terrain.hillshade.lights).toEqual([
      { azimuthDeg: 315, altitudeDeg: 45, weight: 0.75 },
      { azimuthDeg: 270, altitudeDeg: 55, weight: 0.25 },
    ]);
  });
});

describe('contour SVGs (T-08-11, RESEARCH Pitfall 1)', () => {
  test.each(['hero', 'map'] as const)('%s viewBox is 0 0 512 512', (lod) => {
    expect(viewBox(svgOf(lod))).toEqual({ W: 512, H: 512 });
  });

  test('strip viewBox width is 5 x its height', () => {
    const { W, H } = viewBox(svgOf('strip'));
    expect(W).toBe(5 * H);
  });

  test.each(lods)('%s has no script, href or on…= attribute', (lod) => {
    const svg = svgOf(lod);
    expect(svg).not.toMatch(/<script/i);
    expect(svg).not.toMatch(/href/i);
    expect(svg).not.toMatch(/\son[a-z]+\s*=/i);
  });

  test.each(lods)('%s strokes no segment along the raster border', (lod) => {
    const svg = svgOf(lod);
    const { W, H } = viewBox(svg);
    const ds = [...svg.matchAll(/ d="([^"]*)"/g)].map((m) => m[1]);
    expect(ds.length).toBeGreaterThan(0);
    const along = (p: [number, number], q: [number, number]) =>
      (p[0] === 0 && q[0] === 0) ||
      (p[0] === W && q[0] === W) ||
      (p[1] === 0 && q[1] === 0) ||
      (p[1] === H && q[1] === H);
    const offenders: string[] = [];
    for (const d of ds) {
      for (const { pts, closed } of subpaths(d)) {
        const segs = pts.slice(1).map((q, i) => [pts[i], q] as const);
        if (closed) segs.push([pts[pts.length - 1], pts[0]]);
        for (const [p, q] of segs) if (along(p, q)) offenders.push(`${p} -> ${q}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('summit (D-17)', () => {
  test('uv equals round4(lv95ToUv(summit, extent))', () => {
    const uv = lv95ToUv(terrain.summit.lv95, terrain.extent.lv95);
    expect(terrain.summit.uv).toEqual({ u: round4(uv.u), v: round4(uv.v) });
  });

  test('demM is between 4400 and the official 4478 m', () => {
    expect(terrain.summit.officialM).toBe(4478);
    expect(terrain.summit.demM).toBeGreaterThanOrEqual(4400);
    expect(terrain.summit.demM).toBeLessThanOrEqual(4478);
  });

  test('for the default extent the summit sits at UV (0.0953, 0.6661) within 0.001', () => {
    expect(terrain.extent.lv95).toEqual({
      west: 2616000,
      south: 1088000,
      east: 2627000,
      north: 1099000,
    });
    expect(Math.abs(terrain.summit.uv.u - 0.0953)).toBeLessThanOrEqual(0.001);
    expect(Math.abs(terrain.summit.uv.v - 0.6661)).toBeLessThanOrEqual(0.001);
  });
});

describe('one extent (D-14, assumption-delta invariant)', () => {
  test('terrain.extent equals the committed source extent and grid', () => {
    expect(terrain.extent.lv95).toEqual(source.extent);
    expect(terrain.extent.widthM).toBe(source.width * source.cellM);
    expect(terrain.extent.heightM).toBe(source.height * source.cellM);
  });

  test('the strip bbox is stripBbox(extent, summit northing) and spans the extent width', () => {
    const x = terrain.extent.lv95;
    const s = terrain.contours.strip.lv95;
    expect(s).toEqual(stripBbox(x, terrain.summit.lv95.n));
    expect(s.east - s.west).toBe(terrain.extent.widthM);
    expect(s.south).toBeGreaterThanOrEqual(x.south);
    expect(s.north).toBeLessThanOrEqual(x.north);
    expect(terrain.summit.lv95.n).toBeGreaterThan(s.south);
    expect(terrain.summit.lv95.n).toBeLessThan(s.north);
  });

  test('no LOD or heightmap carries an extent of its own', () => {
    const boxes: string[] = [];
    const walk = (v: unknown, at: string) => {
      if (v && typeof v === 'object') {
        if (['west', 'south', 'east', 'north'].some((k) => k in v)) boxes.push(at);
        for (const [k, c] of Object.entries(v)) walk(c, `${at}.${k}`);
      }
    };
    walk(terrain, 'terrain');
    expect(boxes.sort()).toEqual(['terrain.contours.strip.lv95', 'terrain.extent.lv95']);
  });

  test('the strip SVG is the native-grid row window of the strip bbox', () => {
    const s = terrain.contours.strip.lv95;
    expect(viewBox(svgOf('strip'))).toEqual({
      W: (s.east - s.west) / terrain.dem.cellM,
      H: (s.north - s.south) / terrain.dem.cellM,
    });
  });
});
