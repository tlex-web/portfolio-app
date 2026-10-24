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

/** A content-hashed terrain asset URL: `/terrain/<name>.<10 hex>.<svg|png>`. */
export const TerrainAssetUrl = z
  .string()
  .regex(/^\/terrain\/[a-z0-9-]+\.[0-9a-f]{10}\.(svg|png)$/, 'hashed /terrain/ asset URL');

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
  }),
});
export type TerrainMeta = z.infer<typeof TerrainMeta>;
