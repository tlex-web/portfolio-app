/**
 * Terrain data contracts (DATA-01, D-14, D-17).
 *
 * - `TerrainSource` is the shape of data/terrain/source/source.json: the
 *   provenance and grid contract of the committed swissALTIRegio window that
 *   `scripts/terrain/fetch-dem.mjs` writes once, by hand, from the network.
 * - `TerrainMeta` is the shape of data/generated/terrain.ts, the client-safe
 *   module `scripts/terrain/build-terrain.mjs` derives offline from that source.
 *
 * One extent (D-14): every grid size, contour LOD and the strip bbox in
 * `TerrainMeta` is derived from `source.extent`; nothing carries a second one.
 *
 * Imports only 'zod' on purpose (RESEARCH Pattern 1): Node 24 type-strips this
 * file when a scripts/*.mjs generator imports it, and Node cannot resolve `@/`
 * or extension-less relative imports. Keep it to erasable TypeScript.
 */
import { z } from 'zod';

/** An LV95 (EPSG:2056) box in whole metres, west < east and south < north. */
export const Lv95Bbox = z
  .strictObject({
    west: z.number().int(),
    south: z.number().int(),
    east: z.number().int(),
    north: z.number().int(),
  })
  .refine((b) => b.west < b.east && b.south < b.north, 'west < east and south < north');
export type Lv95Bbox = z.infer<typeof Lv95Bbox>;

/** An ISO 8601 UTC timestamp as STAC gives it (`Z`, optional fraction). */
const IsoUtc = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/, 'ISO 8601 UTC timestamp');

/** `YYYY-MM`: the DEM edition the footer shows as "last surveyed". */
const Edition = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'edition YYYY-MM');

/** Heightmap units: decimetres (0.1, the Task 1 default) or metres (1). */
const HeightScale = z.union([z.literal(0.1), z.literal(1)]);

const Sha256 = z.string().regex(/^[0-9a-f]{64}$/, 'lowercase sha256 hex');

export const TerrainSource = z
  .strictObject({
    product: z.literal('swissALTIRegio'),
    stacItemUrl: z.url({ protocol: /^https$/ }),
    cogUrl: z.url({ protocol: /^https$/ }),
    stacDatetime: IsoUtc,
    stacUpdated: IsoUtc,
    /** The STAC asset's `file:checksum` (multihash hex) of the whole COG. */
    checksum: z.string().regex(/^[0-9A-Fa-f]+$/, 'multihash hex'),
    edition: Edition,
    /** `stac:datetime`, or the swisstopo update URL the edition was read from. */
    editionSource: z.string().min(1),
    crs: z.literal('EPSG:2056'),
    heightSystem: z.literal('LN02'),
    extent: Lv95Bbox,
    cellM: z.number().int().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    heightScale: HeightScale,
    file: z.literal('dem-10m.png'),
    /** sha256 of the committed PNG bytes; build-terrain verifies it on every run (T-08-10). */
    sha256: Sha256,
  })
  .refine(
    (s) =>
      s.width * s.cellM === s.extent.east - s.extent.west &&
      s.height * s.cellM === s.extent.north - s.extent.south,
    'width/height times cellM must equal the extent (one coordinate contract, D-14)'
  );
export type TerrainSource = z.infer<typeof TerrainSource>;

/** A content-hashed terrain asset URL: `/terrain/<name>.<10 hex>.<svg|png|avif|webp>`. */
export const TerrainAssetUrl = z
  .string()
  .regex(
    /^\/terrain\/[a-z0-9-]+\.[0-9a-f]{10}\.(svg|png|avif|webp)$/,
    'hashed /terrain/ asset URL'
  );

/** Content-hashed hillshade poster URLs, one schema per format. */
const PosterAvif = z
  .string()
  .regex(/^\/terrain\/hillshade-(1100|640)\.[0-9a-f]{10}\.avif$/, 'hashed hillshade AVIF URL');
const PosterWebp = z
  .string()
  .regex(/^\/terrain\/hillshade-(1100|640)\.[0-9a-f]{10}\.webp$/, 'hashed hillshade WebP URL');

/** One hillshade light: azimuth clockwise from north, altitude above the horizon. */
const Light = z.strictObject({
  azimuthDeg: z.number().min(0).lt(360),
  altitudeDeg: z.number().gt(0).max(90),
  weight: z.number().gt(0).max(1),
});

/**
 * D-16 poster shading parameters. Recorded in terrain.ts so `--check` notices
 * when the script's parameters change but the committed poster was not rebuilt.
 */
const Hillshade = z
  .strictObject({
    /** Imhof/swisstopo NW light, blended: lights[0] weight + lights[1] weight = 1. */
    lights: z.tuple([Light, Light]),
    /** Tone curve `grey = shade ^ gamma` before 8-bit quantisation (1 = linear). */
    gamma: z.number().positive(),
    quality: z.strictObject({
      avif: z.number().int().min(1).max(100),
      webp: z.number().int().min(1).max(100),
    }),
  })
  .refine(
    (h) => Math.abs(h.lights[0].weight + h.lights[1].weight - 1) < 1e-9,
    'light weights must sum to 1'
  );

const Lod = z.strictObject({
  intervalM: z.number().int().positive(),
  indexEvery: z.number().int().positive(),
});

export const TerrainMeta = z.strictObject({
  crs: z.literal('EPSG:2056'),
  extent: z.strictObject({
    lv95: Lv95Bbox,
    widthM: z.number().int().positive(),
    heightM: z.number().int().positive(),
  }),
  dem: z.strictObject({
    product: z.literal('swissALTIRegio'),
    edition: Edition,
    stacDatetime: IsoUtc,
    heightScale: HeightScale,
    cellM: z.number().int().positive(),
  }),
  grids: z.strictObject({ desktop: z.literal(512), mobile: z.literal(256) }),
  contours: z.strictObject({
    hero: Lod,
    map: Lod,
    strip: Lod.extend({ lv95: Lv95Bbox }),
  }),
  hillshade: Hillshade,
  summit: z.strictObject({
    name: z.literal('Matterhorn'),
    /** Official summit height (D-17); a 10 m DEM rounds the peak off. */
    officialM: z.literal(4478),
    officialRef: z.url({ protocol: /^https$/ }),
    /** Bilinear sample of the native 10 m source at the summit, whole metres. */
    demM: z.number().int(),
    lv95: z.strictObject({ e: z.number().int(), n: z.number().int() }),
    uv: z.strictObject({ u: z.number().min(0).max(1), v: z.number().min(0).max(1) }),
  }),
  assets: z.strictObject({
    /** 16-bit grey PNG in the source unit (dem.heightScale), keyed by grid size. */
    heightmap: z.strictObject({ 512: TerrainAssetUrl, 256: TerrainAssetUrl }),
    contours: z.strictObject({
      hero: TerrainAssetUrl,
      map: TerrainAssetUrl,
      strip: TerrainAssetUrl,
    }),
    /**
     * D-16 greyscale hillshade poster at the native 1100 grid and 640, AVIF and
     * WebP. Lossy bytes are not reproducible across platforms, so `--check`
     * verifies hash-in-name, dimensions, no metadata, and `sourceSha256` (the
     * source.json sha256 the poster was generated from).
     */
    hillshade: z
      .strictObject({
        avif: z.strictObject({ 1100: PosterAvif, 640: PosterAvif }),
        webp: z.strictObject({ 1100: PosterWebp, 640: PosterWebp }),
        sourceSha256: Sha256,
      })
      .refine(
        (h) =>
          ([1100, 640] as const).every(
            (s) =>
              h.avif[s].startsWith(`/terrain/hillshade-${s}.`) &&
              h.webp[s].startsWith(`/terrain/hillshade-${s}.`)
          ),
        'each size key points at the poster of that size'
      ),
  }),
});
export type TerrainMeta = z.infer<typeof TerrainMeta>;

/*
 * Plate registry (DATA-11, D-10 to D-12) and the generated plates.ts module.
 *
 * - `Plates` is the shape of data/terrain/plates.json: every plate the terrain
 *   build owns, in build order. One builder run loops them all (F15).
 * - `PlatesMeta` is the shape of data/generated/plates.ts: every plate's 2D
 *   sheet, keyed by plate id. data/generated/terrain.ts stays the home plate's
 *   full module (TerrainMeta above), byte for byte (D-15).
 *
 * File names are flat in public/terrain/ (F14): the home plate keeps today's
 * unprefixed names (prefix '', D-11), every other plate is named
 * `<id>-<asset>.<hash>.<ext>`.
 */

/** Asset stems a plate id may not equal, so `<id>-<asset>` never reads as another asset. */
const ASSET_STEMS: readonly string[] = ['contours', 'heightmap', 'hillshade'];

/** A plate id: a lowercase slug that is not an asset stem (`heightmap-heightmap-512` would be ambiguous). */
export const PlateId = z
  .string()
  .regex(/^[a-z]+(-[a-z]+)*$/, 'plate id: lowercase words joined by single hyphens')
  .refine(
    (id) => !ASSET_STEMS.includes(id),
    'a plate id may not be contours, heightmap or hillshade'
  );

/** `''` (the home plate) or `<slug>-`; the registry pins which one each plate gets. */
const PlatePrefix = z.string().regex(/^([a-z]+(-[a-z]+)*-)?$/, "plate prefix: '' or '<id>-'");

/** A source directory inside the repository: the Matterhorn window or data/terrain/plates/<id>. */
const PlateSource = z
  .string()
  .regex(
    /^data\/terrain\/(source|plates\/[a-z]+(-[a-z]+)*)$/,
    'plate source: data/terrain/source or data/terrain/plates/<id>'
  );

const ContourLodName = z.enum(['hero', 'map', 'strip']);
const HeightmapSize = z.union([z.literal(512), z.literal(256)]);
const PosterSize = z.union([z.literal(1100), z.literal(640)]);
const distinct = (xs: readonly unknown[]) => new Set(xs).size === xs.length;

export const PlateEntry = z.strictObject({
  id: PlateId,
  prefix: PlatePrefix,
  source: PlateSource,
  /** The plate Home draws in 3D; it writes terrain.ts and the precache list (D-14). */
  home: z.boolean(),
  threeD: z.boolean(),
  /** D-12: the outputs this plate builds. */
  outputs: z.strictObject({
    heightmaps: z
      .array(HeightmapSize)
      .refine(distinct, 'heightmap sizes must be distinct')
      .optional(),
    contours: z
      .array(ContourLodName)
      .refine(distinct, 'contour LODs must be distinct')
      .refine(
        (lods) => lods.includes('hero') && lods.includes('strip'),
        'every plate builds the hero and strip contours'
      ),
    hillshade: z.array(PosterSize).min(1).refine(distinct, 'hillshade sizes must be distinct'),
  }),
  /** The northing the strip band is centred on (stripBbox snaps it to 100 m). */
  strip: z.strictObject({ centreN: z.number().int() }),
});
export type PlateEntry = z.infer<typeof PlateEntry>;

const homeOf = (plates: readonly PlateEntry[]) => plates.filter((p) => p.home);

export const Plates = z
  .strictObject({
    schemaVersion: z.literal(1),
    plates: z.array(PlateEntry).min(1, 'the registry needs at least one plate'),
  })
  .refine((r) => distinct(r.plates.map((p) => p.id)), {
    message: 'plate ids must be unique',
    path: ['plates'],
  })
  .refine((r) => homeOf(r.plates).length === 1, {
    message: 'exactly one plate is the home plate',
    path: ['plates'],
  })
  .refine((r) => homeOf(r.plates).every((p) => p.threeD && p.prefix === ''), {
    message: "the home plate is threeD with prefix ''",
    path: ['plates'],
  })
  .refine(
    (r) =>
      homeOf(r.plates).every(
        (p) =>
          p.outputs.heightmaps?.length === 2 &&
          p.outputs.contours.length === 3 &&
          p.outputs.hillshade.length === 2
      ),
    {
      message: 'the home plate builds every output (terrain.ts records them all, D-12)',
      path: ['plates'],
    }
  )
  .refine((r) => r.plates.every((p) => p.home || p.prefix === `${p.id}-`), {
    message: "every plate other than the home plate has the prefix '<id>-'",
    path: ['plates'],
  })
  .refine(
    (r) =>
      r.plates.every(
        (p) =>
          p.threeD ||
          ((p.outputs.heightmaps ?? []).length === 0 && !p.outputs.contours.includes('map'))
      ),
    { message: 'a threeD: false plate builds no heightmap and no map contour', path: ['plates'] }
  );
export type Plates = z.infer<typeof Plates>;

/** A poster URL per size; at least one size. Prefix and size are checked in PlateSheet. */
const PosterUrls = z
  .strictObject({ 1100: TerrainAssetUrl.optional(), 640: TerrainAssetUrl.optional() })
  .refine((s) => s[1100] !== undefined || s[640] !== undefined, 'at least one poster size');

/** One plate's 2D sheet in data/generated/plates.ts: scalars and hashed URLs only (client-safe). */
export const PlateSheet = z
  .strictObject({
    id: PlateId,
    prefix: PlatePrefix,
    home: z.boolean(),
    threeD: z.boolean(),
    crs: z.literal('EPSG:2056'),
    extent: z.strictObject({
      lv95: Lv95Bbox,
      widthM: z.number().int().positive(),
      heightM: z.number().int().positive(),
    }),
    dem: z.strictObject({
      product: z.literal('swissALTIRegio'),
      edition: Edition,
      cellM: z.number().int().positive(),
    }),
    contours: z.strictObject({
      hero: Lod,
      map: Lod.optional(),
      strip: Lod.extend({ lv95: Lv95Bbox }),
    }),
    assets: z.strictObject({
      heightmap: z
        .strictObject({ 512: TerrainAssetUrl.optional(), 256: TerrainAssetUrl.optional() })
        .optional(),
      contours: z.strictObject({
        hero: TerrainAssetUrl,
        map: TerrainAssetUrl.optional(),
        strip: TerrainAssetUrl,
      }),
      hillshade: z.strictObject({
        avif: PosterUrls,
        webp: PosterUrls,
        sourceSha256: Sha256,
      }),
    }),
  })
  .superRefine((s, ctx) => {
    const issue = (message: string, path: (string | number)[]) =>
      ctx.addIssue({ code: 'custom', message, path });
    if (s.home !== (s.prefix === '')) issue("prefix is '' exactly for the home plate", ['prefix']);
    if (!s.home && s.prefix !== `${s.id}-`) issue("prefix is '<id>-'", ['prefix']);
    if (!s.threeD && (s.assets.heightmap !== undefined || s.contours.map !== undefined))
      issue('a 2D plate has no heightmap and no map contour', ['assets']);
    if ((s.contours.map === undefined) !== (s.assets.contours.map === undefined))
      issue('the map LOD has both its parameters and its URL, or neither', ['contours']);
    // Every URL is `/terrain/<prefix><asset>.<10 hex>.<ext>` for this plate's own prefix
    // (PlatePrefix admits only [a-z-], so it is literal inside the pattern).
    const own = (
      url: string | undefined,
      asset: string,
      ext: string,
      path: (string | number)[]
    ) => {
      if (url === undefined) return;
      if (!new RegExp(`^/terrain/${s.prefix}${asset}\\.[0-9a-f]{10}\\.${ext}$`).test(url))
        issue(`${url} is not /terrain/${s.prefix}${asset}.<hash>.${ext}`, path);
    };
    for (const lod of ['hero', 'map', 'strip'] as const)
      own(s.assets.contours[lod], `contours-${lod}`, 'svg', ['assets', 'contours', lod]);
    for (const size of [512, 256] as const)
      own(s.assets.heightmap?.[size], `heightmap-${size}`, 'png', ['assets', 'heightmap', size]);
    for (const format of ['avif', 'webp'] as const) {
      for (const size of [1100, 640] as const)
        own(s.assets.hillshade[format][size], `hillshade-${size}`, format, [
          'assets',
          'hillshade',
          format,
          size,
        ]);
    }
    const sizes = (f: 'avif' | 'webp') =>
      ([1100, 640] as const).filter((n) => s.assets.hillshade[f][n] !== undefined).join();
    if (sizes('avif') !== sizes('webp'))
      issue('AVIF and WebP posters come in the same sizes', ['assets', 'hillshade']);
  });
export type PlateSheet = z.infer<typeof PlateSheet>;

/** data/generated/plates.ts: every plate's sheet, keyed by its id. */
export const PlatesMeta = z
  .record(z.string(), PlateSheet)
  .refine((m) => Object.keys(m).length > 0, 'at least one plate')
  .refine((m) => Object.entries(m).every(([k, s]) => k === s.id), 'each key is its sheet id')
  .refine(
    (m) => Object.values(m).filter((s) => s.home).length === 1,
    'exactly one sheet is the home plate'
  );
export type PlatesMeta = z.infer<typeof PlatesMeta>;

/**
 * Per-plate asset budget (research ARCHITECTURE §2.4, D-12). `served` is the sum
 * of every file a plate's sheet references; `fetch` is one visit's draw (AVIF
 * 1100 poster + hero + strip contours). Matterhorn serves 1,019,131 B and
 * fetches 180,757 B (2026-11-14).
 */
export const PLATE_BUDGET = {
  servedMax3D: 1_048_576,
  servedMax2D: 550_000,
  fetchMax: 250_000,
} as const;
