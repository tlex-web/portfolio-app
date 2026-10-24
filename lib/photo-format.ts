/**
 * Photo tags and display formatting (D-08, DATA-03).
 *
 * Pure and import-free on purpose (RESEARCH Pattern 1): Node 24 type-strips it
 * when scripts/photos/build-photo-data.mjs derives the tags, and Jest/tsc test
 * it normally. Keep it to erasable TypeScript and never add an import. The
 * capture shape is declared structurally here instead of imported from
 * data/schemas/photo.ts.
 */

/** A capture as stored in data/generated/photos.ts (see `Capture` in data/schemas/photo.ts). */
export type CaptureLike =
  | { precision: 'second'; local: string }
  | { precision: 'year'; year: number };

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

/**
 * Meteorological season of a month (1-12): December-February winter,
 * March-May spring, June-August summer, September-November autumn. Chosen over
 * astronomical seasons so a month alone decides the tag (D-08).
 *
 * @throws RangeError when `month` is not an integer from 1 to 12.
 */
export function seasonOf(month: number): Season {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`seasonOf: month must be 1-12, got ${month}`);
  }
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

/** The four-digit year tag of a capture, derived and never hand-typed (D-08). */
export function yearTag(capture: CaptureLike): string {
  return capture.precision === 'year' ? String(capture.year) : capture.local.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Display formatters. Pure on purpose: no locale APIs (08-UI-SPEC Typography),
// so Node and every browser print the same string and hydration never
// mismatches. Units follow U+00A0 so a value never wraps away from its unit.
// ---------------------------------------------------------------------------

const NBSP = ' ';
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Inserts a comma every three digits of a non-negative integer string: '12345' -> '12,345'. */
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** One decimal at most, without a trailing `.0`: 5.6 -> '5.6', 8 -> '8'. */
function oneDecimal(v: number): string {
  return String(Math.round(v * 10) / 10);
}

/**
 * The capture as a reader sees it (D-03, D-04): '6 September 2021, 10:48' for
 * an EXIF capture (the stored local wall time, no conversion), '2019' for a
 * year-only capture, which never gains an invented day or month.
 */
export function formatCaptureLabel(capture: CaptureLike): string {
  if (capture.precision === 'year') return String(capture.year);
  const [date, time] = capture.local.split('T');
  const [year, month, day] = date.split('-');
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}, ${time.slice(0, 5)}`;
}

/** Shutter time: below one second as '1/500 s', otherwise '2 s' or '1.5 s'. */
export function formatExposureTime(s: number): string {
  if (s >= 1) return `${oneDecimal(s)}${NBSP}s`;
  return `1/${Math.round(1 / s)}${NBSP}s`;
}

/** Aperture: 'f/8', 'f/5.6'. */
export function formatAperture(f: number): string {
  return `f/${oneDecimal(f)}`;
}

/** Focal length in whole millimetres: '24 mm'. */
export function formatFocalLength(mm: number): string {
  return `${Math.round(mm)}${NBSP}mm`;
}

/** Height in whole metres with comma grouping: 1617 -> '1,617 m' (D-17). */
export function formatMetres(m: number): string {
  const whole = Math.round(m);
  const sign = whole < 0 ? '-' : '';
  return `${sign}${groupThousands(String(Math.abs(whole)))}${NBSP}m`;
}
