/**
 * Alps overview data contracts (DATA-12, 16 D-16 to D-21).
 *
 * - `OverviewSource` is the shape of data/terrain/overview/source.json: the
 *   provenance and grid contract of the committed Copernicus DEM GLO-90 grid
 *   that `scripts/terrain/fetch-overview.mjs` writes once, by hand, from the
 *   network (D-16). It carries the verbatim GLO-90 notice and liability
 *   sentence (D-21).
 * - `OverviewConfig` is the shape of data/terrain/overview.json: Tim's fixed
 *   contour parameters and reference summits from the 16-02 spike (D-18, D-20).
 * - `OVERVIEW_BUDGET` is the size budget Tim fixed in 16-02 (D-20).
 *
 * The overview lives in its own schema file (planner decision, 16-13), so the
 * plate schemas and the overview evolve separately and nothing overview-related
 * reaches a client module.
 *
 * Imports only 'zod' on purpose (RESEARCH Pattern 1): Node 24 type-strips this
 * file when a scripts/*.mjs generator imports it, and Node cannot resolve `@/`
 * or extension-less relative imports. Keep it to erasable TypeScript.
 */
import { z } from 'zod';

/**
 * The GLO-90 adapted-data notice (licence for COP-DEM-GLO-90-F, Article 6(c),
 * p. 20), copied verbatim from 16-OVERVIEW-SPIKE.md, which copied it from the
 * licence PDF's text layer (the ™ is U+2122, checked on a 200 dpi render).
 * MUST NOT be altered, shortened or paraphrased (D-21); no credit may imply
 * endorsement by the Provider, the Licensor or the programme (Article 6(d)).
 */
export const GLO90_NOTICE =
  'produced using Copernicus WorldDEM™-90 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved';

/**
 * The GLO-90 liability sentence, which must appear "in a licence or any legal
 * warning or notice" covering distribution to the general public. Verbatim from
 * 16-OVERVIEW-SPIKE.md (D-21).
 */
export const GLO90_LIABILITY =
  'The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM™-90';

/** The overview window: tiles for latitudes 43-48 and longitudes 5-16 (D-16). */
export const OVERVIEW_LAT_TILES = [43, 44, 45, 46, 47, 48] as const;
export const OVERVIEW_LON_TILES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as const;

/** A GLO-90 tile name, `Copernicus_DSM_COG_30_N<lat>_00_E<lon>_00_DEM`. */
export const glo90TileName = (lat: number, lon: number): string =>
  `Copernicus_DSM_COG_30_N${String(lat).padStart(2, '0')}_00_E${String(lon).padStart(3, '0')}_00_DEM`;

/** Every slot in the window (72), as tile names. */
export const OVERVIEW_SLOTS: readonly string[] = OVERVIEW_LAT_TILES.flatMap((lat) =>
  OVERVIEW_LON_TILES.map((lon) => glo90TileName(lat, lon))
);

const TileName = z
  .string()
  .regex(/^Copernicus_DSM_COG_30_N\d{2}_00_E\d{3}_00_DEM$/, 'GLO-90 tile name');

const Sha256 = z.string().regex(/^[0-9a-f]{64}$/, 'lowercase sha256 hex');

const isSorted = (xs: readonly string[]) => xs.every((x, i) => i === 0 || xs[i - 1] < x);

/** The grid's x scale: plate carrée with x scaled by cos 46.5° (16-02 Decisions). */
const STANDARD_PARALLEL_DEG = 46.5;
const OVERVIEW_WIDTH = 1200;
/** round(1200 * 6° / (12° * cos 46.5°)) = 872 (16-02 Decisions). */
const OVERVIEW_HEIGHT = 872;

export const OverviewSource = z
  .strictObject({
    product: z.literal('Copernicus DEM GLO-90'),
    /** The release the bucket serves, as the AWS Open Data registry states it. */
    release: z.string().min(1),
    releaseSource: z.url({ protocol: /^https$/ }),
    /** Tile URL base: `<tileBaseUrl><name>/<name>.tif`. */
    tileBaseUrl: z.url({ protocol: /^https$/ }),
    tileListUrl: z.url({ protocol: /^https$/ }),
    /** sha256 of tileList.txt as fetched: which slots were sea on the day. */
    tileListSha256: Sha256,
    /** Present tiles (listed in tileList.txt), sorted. */
    tiles: z.array(TileName).min(1),
    /** Sea slots (absent from tileList.txt, filled with 0 m), sorted. */
    absent: z.array(TileName),
    /** GTRasterTypeGeoKey 2: a tile's origin is a pixel centre. */
    rasterType: z.literal('PixelIsPoint'),
    /** The COG overview read: level 2 is 300 px per degree. */
    overviewLevel: z.literal(2),
    lon: z.tuple([z.literal(5), z.literal(17)]),
    lat: z.tuple([z.literal(43), z.literal(49)]),
    /**
     * Plate carrée over the window, x scaled by cos 46.5°: u = (lon − 5) / 12,
     * v = (49 − lat) / 6 over the grid; WGS84 degrees in, no other step.
     */
    projection: z.strictObject({
      kind: z.literal('plate-carree'),
      standardParallelDeg: z.literal(STANDARD_PARALLEL_DEG),
    }),
    resampling: z.literal(
      'bilinear at grid pixel centres from the level-2 mosaic, PixelIsPoint offset applied, negatives and sea clamped to 0 m'
    ),
    width: z.literal(OVERVIEW_WIDTH),
    height: z.literal(OVERVIEW_HEIGHT),
    /** Whole metres. */
    heightScale: z.literal(1),
    file: z.literal('dem.png'),
    /** sha256 of the committed PNG bytes. */
    sha256: Sha256,
    notice: z.literal(GLO90_NOTICE),
    liability: z.literal(GLO90_LIABILITY),
  })
  .refine((s) => isSorted(s.tiles) && isSorted(s.absent), 'tiles and absent are sorted')
  .refine((s) => {
    const all = [...s.tiles, ...s.absent];
    return (
      all.length === OVERVIEW_SLOTS.length &&
      new Set(all).size === all.length &&
      OVERVIEW_SLOTS.every((n) => all.includes(n))
    );
  }, 'tiles and absent are disjoint and together cover all 72 slots of 43-48° N by 5-16° E');
export type OverviewSource = z.infer<typeof OverviewSource>;

/**
 * The closed country list, duplicated from photo.ts's `Country` rather than
 * imported across schema files (region.ts duplicates the plate slug the same
 * way). data/__tests__/overview.test.ts pins that the two lists are equal.
 */
const Country = z.enum(['AT', 'CH', 'DE', 'FR', 'IT', 'LI', 'MC', 'SI']);

/**
 * One reference summit (D-18). Heights are metres above the source country's
 * own datum, as that source states them. A `confirmed` summit names the
 * national source it was checked against (`officialRef`); a `secondary` one has
 * none until a national source confirms it (Triglav, Tim's 16-02 choice).
 */
export const OverviewSummit = z
  .strictObject({
    name: z.string().min(1),
    /** The country whose national service the height comes from. */
    country: Country,
    /** Countries the summit's border also touches (Mont Blanc's IT, Zugspitze's AT). */
    borders: z.array(Country),
    lat: z.number().gt(43).lt(49),
    lon: z.number().gt(5).lt(17),
    officialM: z.number().int().positive(),
    status: z.enum(['confirmed', 'secondary']),
    officialRef: z.url({ protocol: /^https$/ }).nullable(),
    /** Where the height and position were read. */
    source: z.string().min(1),
  })
  .refine((s) => (s.status === 'confirmed') === (s.officialRef !== null), {
    message: 'a confirmed summit has an officialRef, a secondary one has none',
    path: ['officialRef'],
  })
  .refine((s) => !s.borders.includes(s.country), {
    message: 'borders lists the other countries only',
    path: ['borders'],
  });
export type OverviewSummit = z.infer<typeof OverviewSummit>;

/** An optional relief poster; Tim chose none in 16-02 (`false`). */
const OverviewHillshade = z.union([
  z.literal(false),
  z.strictObject({
    width: z.number().int().positive(),
    quality: z.strictObject({
      avif: z.number().int().min(1).max(100),
      webp: z.number().int().min(1).max(100),
    }),
  }),
]);

/** data/terrain/overview.json: the 16-02 parameters 16-15 draws from (D-18, D-20). */
export const OverviewConfig = z
  .strictObject({
    schemaVersion: z.literal(1),
    contours: z.strictObject({
      /** Levels every intervalM metres, starting at fromM. */
      intervalM: z.number().int().positive(),
      fromM: z.number().int().positive(),
      /** Index contour every nth interval, as on the plates. */
      indexEvery: z.number().int().positive(),
      /** Box blur applied to the heights before d3-contour, edge-clamped (0 = none). */
      blurPx: z.union([z.literal(0), z.literal(3)]),
      /** simplify-js tolerance in grid px. */
      simplifyPx: z.number().positive(),
      /** Drop a ring whose bounding box is under this many px in both width and height. */
      ringFilterPx: z.number().int().nonnegative(),
    }),
    hillshade: OverviewHillshade,
    summits: z.array(OverviewSummit).min(3).max(5),
  })
  .refine((c) => new Set(c.summits.map((s) => s.name)).size === c.summits.length, {
    message: 'summit names are unique',
    path: ['summits'],
  });
export type OverviewConfig = z.infer<typeof OverviewConfig>;

/**
 * The overview size budget (D-20), fixed by Tim in 16-02 ("Budget stays
 * contours ≤30,000 B brotli / ≤120,000 B raw, served ≤250,000 B"). Variant C
 * measured 14,312 B brotli and 53,906 B raw.
 */
export const OVERVIEW_BUDGET = {
  contoursBrotliMax: 30_000,
  contoursRawMax: 120_000,
  servedMax: 250_000,
} as const;
