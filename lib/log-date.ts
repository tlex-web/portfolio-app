/**
 * The route log's date (ROUTE-01, ROUTE-02, ROUTE-03; D-19, D-20): '24 Oct
 * 2026' from '2026-10-24'. Pure and import-free: keep it to erasable
 * TypeScript and never add an import. No Intl or locale API, so the server and
 * every browser print the same string and hydration never mismatches; the
 * month table is this module's own (the month-table pattern of
 * lib/home-format.ts formatCaptureMonth).
 *
 * Dates come from the typed roadmap data, never from a visitor string
 * (T-11-10 keeps visitor input to the whitelisted filter enums); an impossible
 * date throws rather than rolling over to the next month.
 */

const MONTHS = [
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

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/**
 * A log date as 'D Mon YYYY': '2026-10-24' -> '24 Oct 2026', '2024-02-29' ->
 * '29 Feb 2024'.
 *
 * @throws RangeError for anything but a zero-padded YYYY-MM-DD calendar date
 *   (month 1-12, the day within that month's Gregorian length).
 */
export function formatLogDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new RangeError(`formatLogDate: expected YYYY-MM-DD, got '${iso}'`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`formatLogDate: invalid date '${iso}'`);
  }
  return `${day} ${MONTHS[month - 1]} ${year}`;
}
