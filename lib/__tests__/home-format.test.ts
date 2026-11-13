/**
 * HOME-01, HOME-06 (D-11, D-13; 09-UI-SPEC "Typography" new pure formatters
 * table): the import-free Home formatters.
 *
 * lib/home-format.ts never uses `Intl` or `toLocale*`, so Node and every
 * browser print the same string and hydration never mismatches. Units and the
 * coordinate letters follow U+00A0 so they never wrap away from their number.
 * Expectations are compared code point by code point, never by rendered glyph.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  countLabel,
  formatCaptureMonth,
  formatCoordinates,
  formatCount,
  formatEntryTime,
  formatKilometres,
  formatLatLon,
  formatMetreRange,
  formatYearRange,
  shortPlace,
} from '@/lib/home-format';
import { lv95ToWgs84 } from '@/lib/geo';
import { terrain } from '@/data/generated/terrain';

const NBSP = ' ';
const MIDDOT = '·';
const EN_DASH = '–';

/** The string as a list of code points, so a lookalike space or dash fails loudly. */
const codePoints = (s: string) => Array.from(s, (c) => c.codePointAt(0));

describe('formatLatLon (hero and plaque kicker, D-11)', () => {
  it('prints the derived summit kicker 45.9764 N · 7.6586 E', () => {
    const kicker = formatLatLon(lv95ToWgs84(terrain.summit.lv95));
    expect(codePoints(kicker)).toEqual(codePoints(`45.9764${NBSP}N ${MIDDOT} 7.6586${NBSP}E`));
  });

  it('uses S and W for negative values and pads to four decimals', () => {
    expect(codePoints(formatLatLon({ lat: -1.23456, lon: -7.5 }))).toEqual(
      codePoints(`1.2346${NBSP}S ${MIDDOT} 7.5000${NBSP}W`)
    );
  });

  it('rounds half up at the fourth decimal', () => {
    expect(formatLatLon({ lat: 0.00005, lon: 1.23455 })).toBe(
      `0.0001${NBSP}N ${MIDDOT} 1.2346${NBSP}E`
    );
  });

  it('prints two decimals with { decimals: 2 } for the Contact location (D-01)', () => {
    expect(codePoints(formatLatLon({ lat: 47.37444, lon: 8.54111 }, { decimals: 2 }))).toEqual(
      codePoints(`47.37${NBSP}N ${MIDDOT} 8.54${NBSP}E`)
    );
  });

  it('rounds half away from zero at two decimals as well (09 IN-04)', () => {
    // 0.145 * 100 and 1.005 * 100 land just below the half as doubles.
    expect(formatLatLon({ lat: 0.145, lon: -1.005 }, { decimals: 2 })).toBe(
      `0.15${NBSP}N ${MIDDOT} 1.01${NBSP}W`
    );
  });

  it('defaults to four decimals: no options and { decimals: 4 } print the same string', () => {
    const pos = { lat: 47.37444, lon: -8.54111 };
    expect(formatLatLon(pos)).toBe(`47.3744${NBSP}N ${MIDDOT} 8.5411${NBSP}W`);
    expect(formatLatLon(pos, { decimals: 4 })).toBe(formatLatLon(pos));
  });
});

describe('formatEntryTime (register entry, D-03)', () => {
  it("prints the visitor's local day, short month, year and 24-hour time", () => {
    expect(codePoints(formatEntryTime(new Date(2026, 10, 2, 14, 32)))).toEqual(
      codePoints(`2 Nov 2026 ${MIDDOT} 14:32`)
    );
  });

  it('pads the hour and minute to two digits and drops seconds', () => {
    expect(formatEntryTime(new Date(2027, 0, 9, 7, 5, 59))).toBe(`9 Jan 2027 ${MIDDOT} 07:05`);
  });
});

describe('formatCount (the 12-26 character counter and the too-long error)', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1950, '1,950'],
    [2000, '2,000'],
    [1234567, '1,234,567'],
  ])('%d -> %s', (n, expected) => {
    expect(formatCount(n)).toBe(expected);
  });
});

describe('formatCoordinates (viewer strip position, D-07)', () => {
  it('prints 4 dp with trailing zeros, U+00A0 before each letter and one ASCII space between the halves', () => {
    expect(codePoints(formatCoordinates({ lat: 46.015, lon: 7.7414 }))).toEqual(
      codePoints(`46.0150${NBSP}N 7.7414${NBSP}E`)
    );
  });

  it('uses S and W for negative values', () => {
    expect(codePoints(formatCoordinates({ lat: -1.23456, lon: -7.5 }))).toEqual(
      codePoints(`1.2346${NBSP}S 7.5000${NBSP}W`)
    );
  });

  it('rounds half up at the fourth decimal, like formatLatLon', () => {
    expect(formatCoordinates({ lat: 0.00005, lon: 1.23455 })).toBe(`0.0001${NBSP}N 1.2346${NBSP}E`);
  });

  it('rounds a half at the fifth decimal away from zero for positive and negative values (09 IN-04)', () => {
    // Each value's double sits just below its half (1.00185 * 1e4 is
    // 10018.499999999998), so multiplying first and then rounding printed the lower value.
    expect(formatCoordinates({ lat: 1.00185, lon: -1.00995 })).toBe(`1.0019${NBSP}N 1.0100${NBSP}W`);
    expect(formatCoordinates({ lat: -45.90145, lon: 45.00075 })).toBe(
      `45.9015${NBSP}S 45.0008${NBSP}E`
    );
  });

  it('prints values too small for plain decimal notation as zero', () => {
    expect(formatCoordinates({ lat: 5e-7, lon: -1e-9 })).toBe(`0.0000${NBSP}N 0.0000${NBSP}W`);
  });

  // The four waypoint positions in data/generated/photos.ts (2026-11-13) and the
  // exact strip strings they print today (09 IN-04: the rounding fix moves no pixel).
  it.each([
    [{ lat: 46.015, lon: 7.7414 }, `46.0150${NBSP}N 7.7414${NBSP}E`],
    [{ lat: 46.0081, lon: 7.7385 }, `46.0081${NBSP}N 7.7385${NBSP}E`],
    [{ lat: 45.9908, lon: 7.7103 }, `45.9908${NBSP}N 7.7103${NBSP}E`],
    [{ lat: 45.9837, lon: 7.7623 }, `45.9837${NBSP}N 7.7623${NBSP}E`],
  ])('prints the waypoint position %o unchanged', (position, expected) => {
    expect(codePoints(formatCoordinates(position))).toEqual(codePoints(expected));
  });
});

describe('formatCaptureMonth (card place/date line)', () => {
  it('prints a three-letter English month and the year for an EXIF capture', () => {
    expect(formatCaptureMonth({ precision: 'second', local: '2021-09-06T11:22:57' })).toBe(
      'Sep 2021'
    );
    expect(formatCaptureMonth({ precision: 'second', local: '2020-01-31T08:00:00' })).toBe(
      'Jan 2020'
    );
  });

  it('prints the year only for a year-only capture (08 D-03)', () => {
    expect(formatCaptureMonth({ precision: 'year', year: 2019 })).toBe('2019');
  });
});

describe('formatKilometres (plaque distance)', () => {
  it('prints one decimal with U+00A0 before km', () => {
    expect(formatKilometres(7716)).toBe(`7.7${NBSP}km`);
    expect(formatKilometres(950)).toBe(`1.0${NBSP}km`);
  });
});

describe('formatYearRange (plaque Photographed)', () => {
  it('prints the distinct min and max years joined by an en dash', () => {
    expect(codePoints(formatYearRange([2021, 2019, 2021]))).toEqual(
      codePoints(`2019${EN_DASH}2021`)
    );
  });

  it('prints a single distinct year once', () => {
    expect(formatYearRange([2021])).toBe('2021');
    expect(formatYearRange([2021, 2021])).toBe('2021');
  });

  it('throws a RangeError for an empty list', () => {
    expect(() => formatYearRange([])).toThrow(RangeError);
  });
});

describe('formatMetreRange (/photos kicker, D-14)', () => {
  it("prints '1,617–2,760 m': grouped, an en dash between, U+00A0 before the one unit", () => {
    expect(codePoints(formatMetreRange(1617, 2760))).toEqual(
      codePoints(`1,617${EN_DASH}2,760${NBSP}m`)
    );
  });

  it('rounds to whole metres and prints an equal range once', () => {
    expect(formatMetreRange(999.6, 12345.4)).toBe(`1,000${EN_DASH}12,345${NBSP}m`);
    expect(formatMetreRange(1617, 1617)).toBe(`1,617${NBSP}m`);
  });

  it('throws a RangeError when the range runs downhill', () => {
    expect(() => formatMetreRange(2760, 1617)).toThrow(RangeError);
  });
});

describe('countLabel (trail signs, zero-one-many)', () => {
  it('pluralises by count', () => {
    expect(countLabel(4, 'waypoint', 'waypoints')).toBe('4 waypoints');
    expect(countLabel(1, 'waypoint', 'waypoints')).toBe('1 waypoint');
    expect(countLabel(2, 'route', 'routes')).toBe('2 routes');
    expect(countLabel(1, 'route', 'routes')).toBe('1 route');
  });

  it('returns an empty string for zero so the sign shows its destination only', () => {
    expect(countLabel(0, 'route', 'routes')).toBe('');
  });

  it('throws a RangeError for a negative or non-integer count', () => {
    expect(() => countLabel(-1, 'route', 'routes')).toThrow(RangeError);
    expect(() => countLabel(1.5, 'route', 'routes')).toThrow(RangeError);
  });
});

describe('shortPlace (pin labels and card lines)', () => {
  it('takes the first comma segment of the location', () => {
    expect(shortPlace('Zermatt, Switzerland')).toBe('Zermatt');
    expect(shortPlace('Riffelsee')).toBe('Riffelsee');
  });

  it('prefers the override name when given', () => {
    expect(shortPlace('Gornerschlucht, Zermatt', 'Gornerschlucht')).toBe('Gornerschlucht');
    expect(shortPlace('Zermatt, Switzerland', null)).toBe('Zermatt');
  });
});

describe('lib/home-format.ts source rules', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'lib/home-format.ts'), 'utf8');

  it('has no imports and no locale APIs', () => {
    expect(source).not.toMatch(/^import /m);
    expect(source).not.toMatch(/Intl|toLocale/);
  });
});
