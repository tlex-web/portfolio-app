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
  formatKilometres,
  formatLatLon,
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
      codePoints(`1.2346${NBSP}S ${MIDDOT} 7.5000${NBSP}W`),
    );
  });

  it('rounds half up at the fourth decimal', () => {
    expect(formatLatLon({ lat: 0.00005, lon: 1.23455 })).toBe(`0.0001${NBSP}N ${MIDDOT} 1.2346${NBSP}E`);
  });
});

describe('formatCaptureMonth (card place/date line)', () => {
  it('prints a three-letter English month and the year for an EXIF capture', () => {
    expect(formatCaptureMonth({ precision: 'second', local: '2021-09-06T11:22:57' })).toBe('Sep 2021');
    expect(formatCaptureMonth({ precision: 'second', local: '2020-01-31T08:00:00' })).toBe('Jan 2020');
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
    expect(codePoints(formatYearRange([2021, 2019, 2021]))).toEqual(codePoints(`2019${EN_DASH}2021`));
  });

  it('prints a single distinct year once', () => {
    expect(formatYearRange([2021])).toBe('2021');
    expect(formatYearRange([2021, 2021])).toBe('2021');
  });

  it('throws a RangeError for an empty list', () => {
    expect(() => formatYearRange([])).toThrow(RangeError);
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
