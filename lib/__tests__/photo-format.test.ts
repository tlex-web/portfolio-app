/**
 * DATA-02, DATA-03, DATA-04, DATA-06 (D-03, D-08, D-17): pure photo tags and
 * display formatters.
 *
 * lib/photo-format.ts derives the year and season tags at build time and
 * formats photo facts for display. It never uses `Intl` or `toLocale*`
 * (08-UI-SPEC Typography: Node and browser ICU data differ, and the footer also
 * renders in the client-only global-error page), so every case below is exact.
 * Units are separated by U+00A0 so a value never wraps away from its unit.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  formatAperture,
  formatCaptureLabel,
  formatExposureTime,
  formatFocalLength,
  formatMetres,
  seasonOf,
  yearTag,
} from '@/lib/photo-format';

const NBSP = ' ';
const SECOND = { precision: 'second', local: '2021-09-06T10:48:46' } as const;
const YEAR = { precision: 'year', year: 2019 } as const;

describe('seasonOf (meteorological seasons, D-08)', () => {
  test.each([
    [12, 'winter'],
    [1, 'winter'],
    [2, 'winter'],
    [3, 'spring'],
    [4, 'spring'],
    [5, 'spring'],
    [6, 'summer'],
    [7, 'summer'],
    [8, 'summer'],
    [9, 'autumn'],
    [10, 'autumn'],
    [11, 'autumn'],
  ])('month %i is %s', (month, season) => {
    expect(seasonOf(month)).toBe(season);
  });

  test('rejects a month outside 1-12', () => {
    expect(() => seasonOf(0)).toThrow(RangeError);
    expect(() => seasonOf(13)).toThrow(RangeError);
    expect(() => seasonOf(9.5)).toThrow(RangeError);
  });
});

describe('yearTag (D-08)', () => {
  test('a second-precision capture is tagged with its EXIF year', () => {
    expect(yearTag(SECOND)).toBe('2021');
  });

  test('a year-only capture is tagged with that year', () => {
    expect(yearTag(YEAR)).toBe('2019');
  });
});

describe('formatCaptureLabel (D-03, D-04)', () => {
  test('a second-precision capture reads day, English month, year and local hh:mm', () => {
    expect(formatCaptureLabel(SECOND)).toBe('6 September 2021, 10:48');
  });

  test('keeps a two-digit day and a midnight hour as written', () => {
    expect(formatCaptureLabel({ precision: 'second', local: '2021-12-24T00:05:59' })).toBe(
      '24 December 2021, 00:05'
    );
  });

  test('a year-only capture reads the year alone, never an invented 1 January', () => {
    expect(formatCaptureLabel(YEAR)).toBe('2019');
  });
});

describe('exposure formatters', () => {
  test('formatExposureTime writes sub-second times as a 1/N fraction', () => {
    expect(formatExposureTime(0.002)).toBe(`1/500${NBSP}s`);
    expect(formatExposureTime(0.00625)).toBe(`1/160${NBSP}s`);
    expect(formatExposureTime(0.0025)).toBe(`1/400${NBSP}s`);
  });

  test('formatExposureTime writes one second and longer as whole or decimal seconds', () => {
    expect(formatExposureTime(2)).toBe(`2${NBSP}s`);
    expect(formatExposureTime(1)).toBe(`1${NBSP}s`);
    expect(formatExposureTime(1.5)).toBe(`1.5${NBSP}s`);
  });

  test('formatExposureTime keeps 1/4 s as a fraction and prints 0.3 s and longer in seconds (WR-04)', () => {
    expect(formatExposureTime(0.25)).toBe(`1/4${NBSP}s`);
    expect(formatExposureTime(0.3)).toBe(`0.3${NBSP}s`);
    expect(formatExposureTime(0.4)).toBe(`0.4${NBSP}s`);
    expect(formatExposureTime(0.6)).toBe(`0.6${NBSP}s`);
    expect(formatExposureTime(0.8)).toBe(`0.8${NBSP}s`);
  });

  test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'formatExposureTime rejects %p with a RangeError instead of printing 1/Infinity s (WR-04)',
    (s) => {
      expect(() => formatExposureTime(s)).toThrow(RangeError);
    },
  );

  test('formatAperture drops a trailing .0 and keeps one decimal', () => {
    expect(formatAperture(8)).toBe('f/8');
    expect(formatAperture(5.6)).toBe('f/5.6');
    expect(formatAperture(4)).toBe('f/4');
  });

  test('formatFocalLength writes whole millimetres', () => {
    expect(formatFocalLength(24)).toBe(`24${NBSP}mm`);
    expect(formatFocalLength(105)).toBe(`105${NBSP}mm`);
  });
});

describe('formatMetres (D-17)', () => {
  test('groups thousands with a comma and separates the unit with U+00A0', () => {
    expect(formatMetres(1617)).toBe(`1,617${NBSP}m`);
    expect(formatMetres(4478)).toBe(`4,478${NBSP}m`);
  });

  test('leaves values below 1,000 ungrouped and rounds to whole metres', () => {
    expect(formatMetres(100)).toBe(`100${NBSP}m`);
    expect(formatMetres(2584.6)).toBe(`2,585${NBSP}m`);
    expect(formatMetres(12345)).toBe(`12,345${NBSP}m`);
  });
});

describe('no locale APIs (08-UI-SPEC Typography)', () => {
  test('lib/photo-format.ts source contains no Intl and no toLocale', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'lib/photo-format.ts'), 'utf8');
    expect(src).not.toMatch(/Intl|toLocale/);
  });
});
