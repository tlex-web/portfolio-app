/**
 * Photo data contract (D-10). Stage 1: the committed EXIF sidecar. Stage 2
 * (bottom of this file): Tim's corrections and the typed photo facts that
 * `scripts/photos/build-photo-data.mjs` writes to data/generated/photos.ts.
 *
 * `scripts/photos/extract-exif.mjs` reads the gitignored originals
 * (assets/photos-original/, D-09) and writes data/photos/exif-sidecar.json.
 * Every write and every `--check` parses the sidecar with `ExifSidecar`, so a
 * malformed or over-precise value never reaches a commit.
 *
 * - D-04: capture times are the camera's naive local wall time
 *   (`DateTimeOriginal`, no offset). The offset of the photo's country zone
 *   (Europe/Zurich for CH, 17 D-26) is derived in stage 2 (08-08), never stored
 *   here.
 * - D-03: the film scan's `dateTimeOriginal` is its scan date; the sidecar keeps
 *   the raw value and stage 2 must never treat it as a capture date.
 * - DATA-06: GPS is rounded at extraction (`Coord4` rejects more than 4
 *   decimals), so full-precision coordinates are never committed.
 * - 16 D-01 to D-04 (DATA-14): each photo-map record states its `precision`
 *   ('4dp', '3dp' or '2dp') and `kind` ('ground' or 'aerial'), with no default.
 *   Extraction rounds to that level; a coarse record gets a rounded true-spot
 *   ground height (`gps.groundM`) and no GPS altitude, and an aerial record
 *   never keeps its GPS altitude.
 *
 * Imports only 'zod' on purpose (RESEARCH Pattern 1): Node 24 type-strips this
 * file when a scripts/*.mjs generator imports it, and Node cannot resolve `@/`
 * or extension-less relative imports. Keep it to erasable TypeScript.
 */
import { z } from 'zod';

/** Naive local date-time `YYYY-MM-DDTHH:MM:SS` (no `Z`, no offset; D-04). */
// z.iso.datetime({ local: true }) still accepts a trailing Z (RESEARCH Pitfall 5).
export const NaiveLocal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'naive local YYYY-MM-DDTHH:MM:SS (D-04)');
export type NaiveLocal = z.infer<typeof NaiveLocal>;

/** A coordinate with at most 4 decimals (~11 m; DATA-06). */
export const Coord4 = z
  .number()
  .refine((v) => Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-6, 'max 4 decimals (DATA-06)');
export type Coord4 = z.infer<typeof Coord4>;

/**
 * A photo's location precision (16 D-01): 4 decimals (about 10 m, the v2.0
 * default), 3 (about 100 m) or 2 (about 1 km). Stated on every photo-map record
 * (D-02): never defaulted, never derived from coordinates, camera or file name.
 */
export const Precision = z.enum(['4dp', '3dp', '2dp']);
export type Precision = z.infer<typeof Precision>;

/** Decimals per precision level (16 D-01). */
const PRECISION_DECIMALS = { '4dp': 4, '3dp': 3, '2dp': 2 } as const;
/** True when `v` has at most `d` decimals (the Coord4 tolerance, at d decimals). */
const atMostDecimals = (v: number, d: number) =>
  Math.abs(v * 10 ** d - Math.round(v * 10 ** d)) < 1e-6;

/**
 * Whether a photo was taken on the ground or from the air (16 D-04). An aerial
 * photo never keeps its GPS altitude; its height is the DEM ground height.
 */
export const PhotoKind = z.enum(['ground', 'aerial']);
export type PhotoKind = z.infer<typeof PhotoKind>;

/** Altitude in metres with at most 1 decimal. */
const Alt1 = z
  .number()
  .refine((v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-6, 'max 1 decimal');

/**
 * GPS as extracted, already rounded to the record's precision (D-10 stage 1,
 * DATA-06, 16 D-01). `utc` is GPSDateStamp + GPSTimeStamp.
 * `altM` is null when the camera or geotagger wrote no GPSAltitude: a latitude and
 * longitude are still a position (08-REVIEW WR-02), and no consumer reads altM,
 * because heights come from the DEM (D-17). It is also null for a coarse or an
 * aerial record (16 D-03, D-04).
 * `groundM` exists only for a coarse ('3dp' or '2dp') record: the plate DEM height
 * at the true position, sampled in memory and rounded to 10 m or 50 m (16 D-03).
 * `groundSourceSha256` is the sha256 of the plate source it was sampled on (the
 * `sha256` of that plate's source.json), present exactly when `groundM` is, so
 * stage 2 can refuse a height sampled on another source (16-REVIEW WR-02). It
 * says nothing about the position.
 */
const Gps = z
  .strictObject({
    lat: Coord4,
    lon: Coord4,
    altM: Alt1.nullable(),
    utc: z.string().nullable(),
    groundM: z.number().int().optional(),
    groundSourceSha256: z
      .string()
      .regex(/^[0-9a-f]{64}$/)
      .optional(),
  })
  .refine(
    (g) => (g.groundM === undefined) === (g.groundSourceSha256 === undefined),
    'gps.groundM and gps.groundSourceSha256 come together (16 D-03)'
  );

/**
 * The general photo id slug (16-08): lowercase letters and digits in groups
 * joined by single hyphens, at most 40 characters. Ids come from photo-map.json,
 * so the pattern no longer encodes a camera; `img-0605`, `r004-011`,
 * `sam-20240910-143659` and `dji-20260919-162232` all fit. The same rule is
 * repeated in data/schemas/image-manifest.ts and the image-manifest test.
 */
const PHOTO_ID_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PHOTO_ID_RULE =
  'photo id: lowercase letters and digits joined by single hyphens, at most 40 characters';

/** One original's EXIF facts plus the sha256 of its raw bytes (D-10). */
export const ExifSidecarEntry = z.strictObject({
  id: z.string().max(40, PHOTO_ID_RULE).regex(PHOTO_ID_SLUG, PHOTO_ID_RULE),
  file: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  orientation: z.number().int().nullable(),
  space: z.literal('srgb'),
  iccDescription: z.string().nullable(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  lens: z.string().nullable(),
  focalLengthMm: z.number().nullable(),
  fNumber: z.number().nullable(),
  exposureTimeS: z.number().nullable(),
  iso: z.number().int().nullable(),
  dateTimeOriginal: NaiveLocal.nullable(),
  offsetTimeOriginal: z.string().nullable(),
  gps: Gps.nullable(),
});
export type ExifSidecarEntry = z.infer<typeof ExifSidecarEntry>;

/** The committed sidecar: at least one entry, ids unique and sorted ascending. */
export const ExifSidecar = z
  .strictObject({
    schemaVersion: z.literal(1),
    photos: z.array(ExifSidecarEntry).min(1),
  })
  .refine((s) => s.photos.every((p, i) => i === 0 || s.photos[i - 1].id < p.id), {
    message: 'photo ids must be unique and sorted ascending',
    path: ['photos'],
  });
export type ExifSidecar = z.infer<typeof ExifSidecar>;

// ---------------------------------------------------------------------------
// Stage 2 (D-10, 08-08): sidecar + corrections + DEM -> data/generated/photos.ts
// ---------------------------------------------------------------------------

/** Internal photo key shared by the sidecar, the corrections, the photo map and the derivatives. */
export const PhotoId = z.string().max(40, PHOTO_ID_RULE).regex(PHOTO_ID_SLUG, PHOTO_ID_RULE);
export type PhotoId = z.infer<typeof PhotoId>;

/**
 * The country a photo was taken in, ISO 3166-1 alpha-2 (D-02). A closed enum of
 * the Alpine Convention states, so `ch`, `CHE` or `XX` fail (a regex would accept
 * `XX`). It is always explicit on the photo's record: never defaulted from the
 * region and never derived from coordinates (there is no borders dataset), because
 * a wrong country would put LV95 on an Italian photo (PHOTO-08). Widening it is
 * one line.
 */
export const Country = z.enum(['AT', 'CH', 'DE', 'FR', 'IT', 'LI', 'MC', 'SI']);
export type Country = z.infer<typeof Country>;

/**
 * The IANA time zone of each country (17 D-26), one closed map over the whole
 * Country list, so a new country cannot fall through to another's zone. An EXIF
 * capture is labelled with its photo's country zone; every zone here is CET/CEST,
 * so the offset is always +01:00 or +02:00. photos:build imports it.
 */
export const ZONE_BY_COUNTRY = {
  AT: 'Europe/Vienna',
  CH: 'Europe/Zurich',
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
  IT: 'Europe/Rome',
  LI: 'Europe/Vaduz',
  MC: 'Europe/Monaco',
  SI: 'Europe/Ljubljana',
} as const satisfies Record<Country, string>;

/** One of the country zones, as a type (ZONE_BY_COUNTRY's values). */
type CountryZone = (typeof ZONE_BY_COUNTRY)[Country];

/**
 * A capture's time zone: one of the country zones (17 D-26), read from
 * ZONE_BY_COUNTRY so a country added to the map with a new zone is a valid
 * capture zone at once (17-REVIEW IN-07). Erasable TypeScript only (the cast).
 */
export const TimeZone = z.enum(Object.values(ZONE_BY_COUNTRY) as [CountryZone, ...CountryZone[]]);
export type TimeZone = z.infer<typeof TimeZone>;

/** A region id slug; whether it is in data/regions/regions.json is checked by photos:build. */
const RegionSlug = z
  .string()
  .regex(/^[a-z]+(-[a-z]+)*$/, 'region id: lowercase words joined by single hyphens');

/**
 * One photo's record in data/photos/photo-map.json (D-01, D-02): the original's
 * file name (equal to the sidecar's `file`; a bare name, no directory), its region,
 * its country, and its location precision and kind (16 D-02, D-04), both required.
 */
export const PhotoMapEntry = z.strictObject({
  file: z
    .string()
    .min(1)
    .refine((f) => !f.includes('/') && !f.includes('\\'), 'file is a bare file name (no / or \\)'),
  region: RegionSlug,
  country: Country,
  precision: Precision,
  kind: PhotoKind,
});
export type PhotoMapEntry = z.infer<typeof PhotoMapEntry>;

/** The first pair of ids whose records name the same file, or null. */
function duplicateFile(photos: Record<string, { file: string }>): [string, string, string] | null {
  const seen = new Map<string, string>();
  for (const [id, entry] of Object.entries(photos)) {
    const first = seen.get(entry.file);
    if (first !== undefined) return [entry.file, first, id];
    seen.set(entry.file, id);
  }
  return null;
}

/**
 * data/photos/photo-map.json (D-01): the source-file -> id map and the membership
 * record, keyed by photo id. At least one record, keys sorted ascending, and one
 * record per original (no two records name one file). That every record has a
 * sidecar entry and every sidecar entry a record is checked by photos:build.
 */
export const PhotoMap = z
  .strictObject({
    schemaVersion: z.literal(1),
    photos: z.record(PhotoId, PhotoMapEntry),
  })
  .refine((m) => Object.keys(m.photos).length > 0, {
    message: 'photo-map: the map needs at least one record',
    path: ['photos'],
  })
  .refine((m) => Object.keys(m.photos).every((id, i, ids) => i === 0 || ids[i - 1] < id), {
    message: 'photo-map: photo ids must be unique and sorted ascending',
    path: ['photos'],
  })
  .superRefine((m, ctx) => {
    const dup = duplicateFile(m.photos);
    if (dup) {
      ctx.addIssue({
        code: 'custom',
        message: `photo-map: ${dup[0]} is named by both ${dup[1]} and ${dup[2]}; one original has one record`,
        path: ['photos'],
      });
    }
  });
export type PhotoMap = z.infer<typeof PhotoMap>;

/**
 * When a photo was taken (D-03, D-04).
 *
 * - `second`: the camera's naive local wall time from EXIF, labelled with the
 *   photo's country zone (17 D-26; PhotoFacts holds the two equal) and that
 *   zone's offset computed at build time, so runtime code never needs
 *   time-zone data.
 * - `year`: a year Tim supplied (the film scan). Strict, so no month or day can
 *   ride along (RESEARCH Pitfall 5): a year-only capture never invents a date.
 */
export const Capture = z.discriminatedUnion('precision', [
  z.strictObject({
    precision: z.literal('second'),
    local: NaiveLocal,
    timeZone: TimeZone,
    offset: z.enum(['+01:00', '+02:00']),
    source: z.literal('exif'),
  }),
  z.strictObject({
    precision: z.literal('year'),
    year: z.number().int().min(1950).max(2100),
    source: z.literal('Tim'),
  }),
]);
export type Capture = z.infer<typeof Capture>;

/**
 * The position fields shared by a generated `Position` and a corrections
 * position, unrefined so both schemas are built from them. (zod 4.6 refuses
 * `.omit()` / `.pick()` on a refined object, so neither derives from the other.)
 */
const positionFields = {
  source: z.enum(['exif', 'hand-placed']),
  approximate: z.boolean(),
  reason: z.string().min(1).optional(),
  radiusM: z.number().positive().optional(),
};
type PositionShape = { source: string; approximate: boolean; reason?: string; radiusM?: number };
/** DATA-04: an approximate position says why and how far. */
const approximateHasReason = (p: PositionShape) =>
  !p.approximate || (p.reason !== undefined && p.radiusM !== undefined);
/** DATA-04: a hand-placed position is approximate. */
const handPlacedIsApproximate = (p: PositionShape) => p.source === 'exif' || p.approximate;

/**
 * Where a photo was taken, at most 4 decimals (DATA-06), tagged with its
 * record's precision (16 D-01). A position without GPS is hand-placed and must
 * say so: `approximate: true` with a reason and a radius, which every consumer
 * can show (DATA-04). A coarse ('3dp' or '2dp') position is approximate too
 * (DATA-14), and no position carries more decimals than its precision (16 D-01).
 * The schema enforces both (16-REVIEW WR-03): the view-model draws the dashed pin
 * and the "≈" from `approximate` alone, and every decimal here ships in the
 * generated module.
 */
export const Position = z
  .strictObject({
    lat: Coord4,
    lon: Coord4,
    precision: Precision,
    ...positionFields,
  })
  .refine(approximateHasReason, 'approximate positions need reason + radiusM (DATA-04)')
  .refine(handPlacedIsApproximate, 'hand-placed positions are approximate (DATA-04)')
  .refine((p) => p.precision === '4dp' || p.approximate, 'a coarse position is approximate (DATA-14)')
  .refine(
    (p) =>
      atMostDecimals(p.lat, PRECISION_DECIMALS[p.precision]) &&
      atMostDecimals(p.lon, PRECISION_DECIMALS[p.precision]),
    "a position has at most its precision's decimals (16 D-01)"
  );
export type Position = z.infer<typeof Position>;

/**
 * Height of a photo position (D-17). `dem`: bilinear at pixel centres of the
 * native 10 m source raster at the 4-decimal coordinates, rounded to whole
 * metres (RESEARCH Pitfall 2). Derived, never hand-typed.
 */
export const Elevation = z.discriminatedUnion('source', [
  z.strictObject({ source: z.literal('dem'), m: z.number().int() }),
]);
export type Elevation = z.infer<typeof Elevation>;

/** Camera exposure facts for a digital photo (null for a film scan). */
export const Exposure = z.strictObject({
  camera: z.string(),
  lens: z.string(),
  focalLengthMm: z.number(),
  fNumber: z.number(),
  exposureTimeS: z.number(),
  iso: z.number().int(),
});
export type Exposure = z.infer<typeof Exposure>;

/** A place name Tim confirmed or supplied, with the reason (D-01, D-02). */
export const LocationOverride = z.strictObject({
  name: z.string().min(1),
  reason: z.string().min(1),
  source: z.literal('Tim'),
});
export type LocationOverride = z.infer<typeof LocationOverride>;

/**
 * A position in corrections.json is typed by hand, so it can only be hand-placed
 * (and therefore approximate, with a reason and a radius). An exact `exif`
 * position comes from the sidecar GPS, never from a correction (08-REVIEW WR-08,
 * DATA-04). It carries no `precision` (strict, so a `precision` key fails): stage
 * 2 gives it its record's precision and refuses one with more decimals (16 D-02).
 */
const CorrectionPosition = z
  .strictObject({
    lat: Coord4,
    lon: Coord4,
    ...positionFields,
  })
  .refine(approximateHasReason, 'approximate positions need reason + radiusM (DATA-04)')
  .refine(handPlacedIsApproximate, 'hand-placed positions are approximate (DATA-04)')
  .refine(
    (p) => p.source === 'hand-placed',
    "a corrections position is source 'hand-placed'; exif positions come from the sidecar (WR-08, DATA-04)"
  );

/** data/photos/corrections.json: Tim's reasoned overrides, keyed by photo id. */
export const Corrections = z.strictObject({
  schemaVersion: z.literal(1),
  photos: z.record(
    PhotoId,
    z.strictObject({
      medium: z.enum(['digital', 'film-scan']).optional(),
      captureOverride: z
        .strictObject({
          precision: z.literal('year'),
          year: z.number().int(),
          source: z.literal('Tim'),
          reason: z.string().min(1),
        })
        .optional(),
      position: CorrectionPosition.optional(),
      locationOverride: LocationOverride.optional(),
    })
  ),
});
export type Corrections = z.infer<typeof Corrections>;

/**
 * One photo's typed facts in data/generated/photos.ts. `tags.year` and
 * `tags.season` are derived from `capture` (D-08); a year-only capture has no
 * season. `uv` is the terrain UV (DATA-01) of `position`, rounded to 4 decimals,
 * and bounded to [0, 1]: a photo off the DEM sheet has no pin or tick to place
 * (08-REVIEW WR-01; the build fails before it samples a clamped edge height).
 * A second-precision capture's `timeZone` is its `country`'s zone (17 D-26).
 */
export const PhotoFacts = z
  .strictObject({
    id: PhotoId,
    /** The photo's region (D-05), from its photo-map record. */
    region: RegionSlug,
    /** The photo's country (D-02, D-05), from its photo-map record; never derived. */
    country: Country,
    /** Ground or aerial (16 D-04), from its photo-map record; never derived. */
    kind: PhotoKind,
    medium: z.enum(['digital', 'film-scan']),
    capture: Capture,
    position: Position.nullable(),
    uv: z.strictObject({ u: z.number().min(0).max(1), v: z.number().min(0).max(1) }).nullable(),
    elevation: Elevation.nullable(),
    exif: Exposure.nullable(),
    tags: z.strictObject({
      year: z.string().regex(/^\d{4}$/),
      season: z.enum(['winter', 'spring', 'summer', 'autumn']).nullable(),
    }),
    locationOverride: LocationOverride.nullable(),
  })
  .refine(
    (p) =>
      p.capture.precision !== 'second' || p.capture.timeZone === ZONE_BY_COUNTRY[p.country],
    {
      message: "a capture's timeZone is its photo's country zone (17 D-26)",
      path: ['capture', 'timeZone'],
    }
  );
export type PhotoFacts = z.infer<typeof PhotoFacts>;
