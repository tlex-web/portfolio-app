/**
 * Photo data contract, stage 1 (D-10): the committed EXIF sidecar.
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

/** GPS as extracted, already rounded (D-10 stage 1, DATA-06). `utc` is GPSDateStamp + GPSTimeStamp. */
const Gps = z.strictObject({
  lat: Coord4,
  lon: Coord4,
  altM: Alt1,
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
