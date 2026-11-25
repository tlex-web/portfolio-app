/**
 * The strip's LV95 line (PHOTO-08; 18 D-14, D-15; 18-RESEARCH Pitfall 4):
 * Swiss photos only, computed from the WGS84 the page already shows (the
 * position rounded to its own precision), then snapped to that precision's
 * grid (4dp 10 m, 3dp 100 m, 2dp 1,000 m), so it can never print more than
 * the shown coordinates imply.
 *
 * Privacy (16 D-25): every position here is synthetic, the WGS84 of a made-up
 * LV95 point on a sweep across Switzerland. No photo's position appears in
 * this file, in any form.
 */
import { Country } from '@/data/schemas/photo';
import { lv95ToWgs84, wgs84ToLv95 } from '@/lib/geo';
import { roundedCoordinate, type CoordinatePrecision } from '@/lib/home-format';
import { LV95_GRID_M, lv95Line, snapLv95 } from '@/lib/photos/lv95-line';

const PRECISIONS: readonly CoordinatePrecision[] = ['4dp', '3dp', '2dp'];

/** Synthetic LV95 points on a grid across the Swiss extent, as WGS84 with odd fractions. */
const SWEEP = (() => {
  const points: { lat: number; lon: number }[] = [];
  for (let e = 2_490_000; e <= 2_830_000; e += 37_913) {
    for (let n = 1_080_000; n <= 1_290_000; n += 23_417) {
      points.push(lv95ToWgs84({ e: e + 0.37, n: n + 0.61 }));
    }
  }
  return points;
})();

/** The synthetic LV95 origin (Bern's old observatory), as WGS84. */
const ORIGIN = lv95ToWgs84({ e: 2_600_000, n: 1_200_000 });

const at = (
  p: { lat: number; lon: number },
  precision: CoordinatePrecision,
  approximate = false
) => ({ lat: p.lat, lon: p.lon, precision, approximate });

const LINE = /^LV95 (≈ )?E (\d’\d{3}’\d{3}) N (\d’\d{3}’\d{3})$/;

/** The easting and northing a line prints, in metres. */
function parse(line: string): { e: number; n: number; approximate: boolean } {
  const m = LINE.exec(line);
  if (!m) throw new Error(`not an LV95 line: ${line}`);
  const metres = (s: string) => Number(s.replaceAll('’', ''));
  return { e: metres(m[2]), n: metres(m[3]), approximate: m[1] !== undefined };
}

describe('LV95_GRID_M (D-15)', () => {
  it('is 10 m at 4dp, 100 m at 3dp and 1,000 m at 2dp', () => {
    expect(LV95_GRID_M).toEqual({ '4dp': 10, '3dp': 100, '2dp': 1000 });
  });
});

describe('lv95Line: Swiss photos only (D-14)', () => {
  it.each(Country.options.filter((c) => c !== 'CH'))(
    '%s: no line, at every precision',
    (country) => {
      for (const precision of PRECISIONS) {
        expect(lv95Line(at(ORIGIN, precision), country)).toBeNull();
        expect(lv95Line(at(ORIGIN, precision, true), country)).toBeNull();
      }
    }
  );

  it('LI gets no line: the rule is the country code, not the extent of the grid (D-14)', () => {
    expect(lv95Line(at(ORIGIN, '4dp'), 'LI')).toBeNull();
  });

  it('CH without a position: no line', () => {
    expect(lv95Line(null, 'CH')).toBeNull();
  });

  it('CH 4dp: "LV95 E … N …", easting first, U+2019 grouping', () => {
    const line = lv95Line(at(ORIGIN, '4dp'), 'CH');
    expect(line).toMatch(LINE);
    expect(line).not.toContain('≈');
  });
});

describe('lv95Line: the grid of each precision (D-15)', () => {
  it.each(PRECISIONS)('%s: both values are multiples of the grid, over the sweep', (precision) => {
    const grid = LV95_GRID_M[precision];
    for (const p of SWEEP) {
      const { e, n } = parse(lv95Line(at(p, precision), 'CH')!);
      expect(e % grid).toBe(0);
      expect(n % grid).toBe(0);
    }
  });

  it.each(PRECISIONS)(
    '%s: the line is the shown WGS84 converted and snapped to the grid',
    (precision) => {
      const grid = LV95_GRID_M[precision];
      for (const p of SWEEP) {
        const shown = {
          lat: Number(roundedCoordinate(p.lat, precision)),
          lon: Number(roundedCoordinate(p.lon, precision)),
        };
        const exact = wgs84ToLv95(shown);
        const { e, n } = parse(lv95Line(at(p, precision), 'CH')!);
        expect(e).toBe(Math.round(exact.e / grid) * grid);
        expect(n).toBe(Math.round(exact.n / grid) * grid);
      }
    }
  );

  it('approximate inserts "≈ " after "LV95 ", at every precision', () => {
    for (const precision of PRECISIONS) {
      const exact = lv95Line(at(ORIGIN, precision), 'CH')!;
      const approx = lv95Line(at(ORIGIN, precision, true), 'CH')!;
      expect(approx).toBe(exact.replace(/^LV95 /, 'LV95 ≈ '));
      expect(parse(approx).approximate).toBe(true);
    }
  });
});

/**
 * Edge PHOTO-08/precision (T-18-38): the printed digits are a function of the
 * shown WGS84 alone. A raw position and its shown rounding give the same line,
 * so the line can never reveal a digit the page does not already show.
 */
describe('lv95Line depends on the shown value only (Pitfall 4)', () => {
  it.each(PRECISIONS)('%s: raw and shown positions give the same line', (precision) => {
    for (const p of SWEEP) {
      const shown = {
        lat: Number(roundedCoordinate(p.lat, precision)),
        lon: Number(roundedCoordinate(p.lon, precision)),
      };
      for (const approximate of [false, true]) {
        expect(lv95Line(at(p, precision, approximate), 'CH')).toBe(
          lv95Line(at(shown, precision, approximate), 'CH')
        );
      }
    }
  });

  it.each(PRECISIONS)(
    '%s: two raw positions inside one shown cell print the same line',
    (precision) => {
      const step = { '4dp': 1e-4, '3dp': 1e-3, '2dp': 1e-2 }[precision];
      for (const p of SWEEP) {
        const shown = {
          lat: Number(roundedCoordinate(p.lat, precision)),
          lon: Number(roundedCoordinate(p.lon, precision)),
        };
        // A quarter step either side still rounds to the same shown digits.
        const a = { lat: shown.lat - step / 4, lon: shown.lon + step / 4 };
        const b = { lat: shown.lat + step / 4, lon: shown.lon - step / 4 };
        expect(lv95Line(at(a, precision), 'CH')).toBe(lv95Line(at(b, precision), 'CH'));
      }
    }
  );
});

describe('snapLv95: Math.round to the grid, halves up', () => {
  it('a value exactly halfway between two grid steps rounds up, at every grid', () => {
    expect(snapLv95(2_600_005, 10)).toBe(2_600_010);
    expect(snapLv95(1_200_050, 100)).toBe(1_200_100);
    expect(snapLv95(2_600_500, 1000)).toBe(2_601_000);
  });

  it('just under halfway rounds down; on a grid line stays', () => {
    expect(snapLv95(2_600_004.99, 10)).toBe(2_600_000);
    expect(snapLv95(1_200_049.99, 100)).toBe(1_200_000);
    expect(snapLv95(2_600_499.99, 1000)).toBe(2_600_000);
    expect(snapLv95(2_600_010, 10)).toBe(2_600_010);
  });
});
