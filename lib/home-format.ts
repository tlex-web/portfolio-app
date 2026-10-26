/**
 * Home display formatters (HOME-01, HOME-06; D-11, D-13; 09-UI-SPEC
 * "Typography" new pure formatters table).
 *
 * Pure and import-free on purpose, like lib/photo-format.ts: no locale APIs, so
 * Node and every browser print the same string and hydration never mismatches.
 * Keep it to erasable TypeScript and never add an import. The capture shape is
 * declared structurally here instead of imported from data/schemas/photo.ts.
 * Units and coordinate letters follow U+00A0 so they never wrap away from
 * their number.
 */

/** A capture as stored in data/generated/photos.ts (see `Capture` in data/schemas/photo.ts). */
export type CaptureLike =
  | { precision: 'second'; local: string }
  | { precision: 'year'; year: number };

const NBSP = ' ';
const MIDDOT = '·';
const EN_DASH = '–';
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Absolute value at four decimals, rounded half up: 1.23455 -> '1.2346'. */
function fourDecimals(v: number): string {
  return (Math.round(Math.abs(v) * 1e4) / 1e4).toFixed(4);
}

/**
 * WGS84 coordinates as the kicker prints them (D-11): four decimals, round half
 * up, the hemisphere letter by sign after U+00A0, joined by ' · ':
 * { lat: 45.97644, lon: 7.65861 } -> '45.9764 N · 7.6586 E'.
 */
export function formatLatLon({ lat, lon }: { lat: number; lon: number }): string {
  const ns = `${fourDecimals(lat)}${NBSP}${lat < 0 ? 'S' : 'N'}`;
  const ew = `${fourDecimals(lon)}${NBSP}${lon < 0 ? 'W' : 'E'}`;
  return `${ns} ${MIDDOT} ${ew}`;
}

/**
 * WGS84 coordinates as the viewer strip prints them (D-07; 10-UI-SPEC Strip
 * field 6): the same four decimals and round-half-up rule as formatLatLon, the
 * hemisphere letter after U+00A0, and one plain space between the halves:
 * { lat: 46.015, lon: 7.7414 } -> '46.0150 N 7.7414 E'.
 */
export function formatCoordinates({ lat, lon }: { lat: number; lon: number }): string {
  return `${fourDecimals(lat)}${NBSP}${lat < 0 ? 'S' : 'N'} ${fourDecimals(lon)}${NBSP}${lon < 0 ? 'W' : 'E'}`;
}

/**
 * A capture's month and year for the card line: 'Sep 2021' for an EXIF capture
 * (fixed English month names), the year alone for a year-only capture, which
 * never gains an invented month (08 D-03).
 */
export function formatCaptureMonth(capture: CaptureLike): string {
  if (capture.precision === 'year') return String(capture.year);
  const [year, month] = capture.local.split('-');
  return `${MONTHS_SHORT[Number(month) - 1]} ${year}`;
}

/** A distance in metres as kilometres at one decimal: 7716 -> '7.7 km'. */
export function formatKilometres(m: number): string {
  return `${(Math.round(m / 100) / 10).toFixed(1)}${NBSP}km`;
}

/**
 * The span of distinct years, joined by an en dash: [2021, 2019] ->
 * '2019–2021'; one distinct year prints once.
 *
 * @throws RangeError for an empty list.
 */
export function formatYearRange(years: readonly number[]): string {
  if (years.length === 0) throw new RangeError('formatYearRange: years must not be empty');
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min}${EN_DASH}${max}`;
}

/** RED stub (10-08 Task 3). */
export function formatMetreRange(_lo: number, _hi: number): string {
  throw new Error('formatMetreRange: not implemented');
}

/**
 * A count with its noun for the trail signs: '4 waypoints', '1 route'. Zero
 * returns '' so the sign shows its destination only.
 *
 * @throws RangeError for a negative or non-integer count.
 */
export function countLabel(n: number, one: string, many: string): string {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`countLabel: n must be a non-negative integer, got ${n}`);
  }
  if (n === 0) return '';
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * The short place name: the override name when given, else the first comma
 * segment of the location ('Zermatt, Switzerland' -> 'Zermatt').
 */
export function shortPlace(location: string, overrideName?: string | null): string {
  if (overrideName) return overrideName;
  return location.split(',')[0].trim();
}
