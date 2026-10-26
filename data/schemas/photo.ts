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
 *   (`DateTimeOriginal`, no offset). The Europe/Zurich offset is derived in
 *   stage 2 (08-08), never stored here.
 * - D-03: the film scan's `dateTimeOriginal` is its scan date; the sidecar keeps
 *   the raw value and stage 2 must never treat it as a capture date.
 * - DATA-06: GPS is rounded to 4 decimals at extraction (`Coord4` rejects more),
 *   so full-precision coordinates are never committed.
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

/** Altitude in metres with at most 1 decimal. */
const Alt1 = z
  .number()
  .refine((v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-6, 'max 1 decimal');

/**
 * GPS as extracted, already rounded (D-10 stage 1, DATA-06). `utc` is GPSDateStamp + GPSTimeStamp.
 * `altM` is null when the camera or geotagger wrote no GPSAltitude: a latitude and
 * longitude are still a position (08-REVIEW WR-02), and no consumer reads altM,
 * because heights come from the DEM (D-17).
 */
const Gps = z.strictObject({
  lat: Coord4,
  lon: Coord4,
  altM: Alt1.nullable(),
  utc: z.string().nullable(),
});

/** One original's EXIF facts plus the sha256 of its raw bytes (D-10). */
export const ExifSidecarEntry = z.strictObject({
  id: z.string().regex(/^(img-\d{4}|r\d{3}-\d{3})$/),
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

/** Internal photo key shared by the sidecar, the corrections and the derivatives. */
const PhotoId = z.string().regex(/^(img-\d{4}|r\d{3}-\d{3})$/);

/**
 * When a photo was taken (D-03, D-04).
 *
 * - `second`: the camera's naive local wall time from EXIF, with the
 *   Europe/Zurich offset computed at build time, so runtime code never needs
 *   time-zone data.
 * - `year`: a year Tim supplied (the film scan). Strict, so no month or day can
 *   ride along (RESEARCH Pitfall 5): a year-only capture never invents a date.
 */
export const Capture = z.discriminatedUnion('precision', [
  z.strictObject({
    precision: z.literal('second'),
    local: NaiveLocal,
    timeZone: z.literal('Europe/Zurich'),
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
 * Where a photo was taken, at most 4 decimals (DATA-06). A position without GPS
 * is hand-placed and must say so: `approximate: true` with a reason and a
 * radius, which every consumer can show (DATA-04).
 */
export const Position = z
  .strictObject({
    lat: Coord4,
    lon: Coord4,
    source: z.enum(['exif', 'hand-placed']),
    approximate: z.boolean(),
    reason: z.string().min(1).optional(),
    radiusM: z.number().positive().optional(),
  })
  .refine(
    (p) => !p.approximate || (p.reason !== undefined && p.radiusM !== undefined),
    'approximate positions need reason + radiusM (DATA-04)'
  )
  .refine(
    (p) => p.source === 'exif' || p.approximate,
    'hand-placed positions are approximate (DATA-04)'
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
 * DATA-04).
 */
const CorrectionPosition = Position.refine(
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
 */
export const PhotoFacts = z.strictObject({
  id: PhotoId,
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
});
export type PhotoFacts = z.infer<typeof PhotoFacts>;
