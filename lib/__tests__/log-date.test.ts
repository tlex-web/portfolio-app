/**
 * The route log's date (ROUTE-03; D-20): a fixed 'D Mon YYYY' with English
 * month names and no locale API, so the server and every browser print the
 * same string. Impossible or malformed dates throw instead of rolling over.
 */
import { formatLogDate } from '@/lib/log-date';

describe('formatLogDate', () => {
  it.each([
    ['2026-10-24', '24 Oct 2026'],
    ['2026-01-01', '1 Jan 2026'],
    ['2026-12-31', '31 Dec 2026'],
    ['2026-04-30', '30 Apr 2026'],
    ['2024-02-29', '29 Feb 2024'],
    ['2000-02-29', '29 Feb 2000'],
  ])('formats %s as %s', (iso, expected) => {
    expect(formatLogDate(iso)).toBe(expected);
  });

  it.each([
    ['a 29 February outside a leap year', '2026-02-29'],
    ['a 29 February in a century year', '1900-02-29'],
    ['month 13', '2026-13-01'],
    ['month 0', '2026-00-10'],
    ['day 0', '2026-05-00'],
    ['31 April', '2026-04-31'],
    ['an unpadded date', '2026-1-1'],
    ['an empty string', ''],
    ['a timestamp', '2026-10-24T10:00:00Z'],
  ])('throws RangeError for %s', (_, iso) => {
    expect(() => formatLogDate(iso)).toThrow(RangeError);
  });
});
