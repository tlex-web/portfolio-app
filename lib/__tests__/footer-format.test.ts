/**
 * Footer map-sheet margin formatters (SHELL-04, D-18; 08-UI-SPEC "Formatting
 * rules" and "Scale bar (true at every breakpoint)"), including the E4
 * overflow backstop: every scale tier fits its grid cell at every viewport.
 */
import {
  SCALE_TIERS,
  cellWidthPx,
  formatEquidistance,
  formatExtentLines,
  formatLv95,
  formatMonthYear,
  labelLeft,
  scaleFits,
  scaleFraction,
  tickLeft,
} from '@/lib/footer-format';
import { terrain } from '@/data/generated/terrain';

const NBSP = ' ';
const RSQ = '’';

describe('formatLv95', () => {
  it('groups whole metres with U+2019', () => {
    expect(formatLv95(2616000)).toBe(`2${RSQ}616${RSQ}000`);
    expect(formatLv95(999)).toBe('999');
    expect(formatLv95(1000)).toBe(`1${RSQ}000`);
  });

  it('rounds half up to whole metres', () => {
    expect(formatLv95(1088000.5)).toBe(`1${RSQ}088${RSQ}001`);
    expect(formatLv95(1088000.49)).toBe(`1${RSQ}088${RSQ}000`);
  });
});

describe('formatExtentLines', () => {
  it('prints the SW then the NE corner, easting first', () => {
    expect(formatExtentLines({ west: 2616000, south: 1088000, east: 2627000, north: 1099000 })).toEqual([
      `SW 2${RSQ}616${RSQ}000, 1${RSQ}088${RSQ}000`,
      `NE 2${RSQ}627${RSQ}000, 1${RSQ}099${RSQ}000`,
    ]);
  });

  it('keeps each line at 23 characters for the real extent (fits the smallest cell)', () => {
    for (const line of formatExtentLines(terrain.extent.lv95)) expect(line).toHaveLength(23);
  });
});

describe('formatMonthYear', () => {
  it('names the full English month of a YYYY-MM edition', () => {
    expect(formatMonthYear('2026-05')).toBe('May 2026');
    expect(formatMonthYear('2026-06')).toBe('June 2026');
    expect(formatMonthYear('2025-12')).toBe('December 2025');
  });

  it('throws on a month out of range or a malformed edition', () => {
    expect(() => formatMonthYear('2026-13')).toThrow(/edition/);
    expect(() => formatMonthYear('2026-00')).toThrow(/edition/);
    expect(() => formatMonthYear('2026-5')).toThrow(/edition/);
    expect(() => formatMonthYear('May 2026')).toThrow(/edition/);
  });

  it('formats the real DEM edition as May 2026 (08-04 sheet decision)', () => {
    expect(formatMonthYear(terrain.dem.edition)).toBe('May 2026');
  });
});

describe('formatEquidistance', () => {
  it('prints integer metres with a no-break space', () => {
    expect(formatEquidistance(100)).toBe(`100${NBSP}m`);
  });
});

describe('SCALE_TIERS', () => {
  it('uses 2 km below 1024, 1 km from 1024 to 1791 and 500 m from 1792', () => {
    expect(SCALE_TIERS.map((t) => [t.lengthM, t.fromPx, t.toPx])).toEqual([
      [2000, 0, 1023],
      [1000, 1024, 1791],
      [500, 1792, null],
    ]);
  });

  it('labels the ends and the midpoint, with a no-break space before the unit', () => {
    expect(SCALE_TIERS.map((t) => t.labels)).toEqual([
      ['0', '1', `2${NBSP}km`],
      ['0', '500', `1${NBSP}km`],
      ['0', '250', `500${NBSP}m`],
    ]);
  });

  it('announces one length per tier', () => {
    expect(SCALE_TIERS.map((t) => t.srText)).toEqual(['Scale bar, 2 km', 'Scale bar, 1 km', 'Scale bar, 500 m']);
  });
});

describe('scaleFraction', () => {
  it('writes L / extentWidthM with 6 decimals', () => {
    expect(scaleFraction(2000, 11000)).toBe('0.181818');
    expect(scaleFraction(500, 11000)).toBe('0.045455');
  });
});

describe('labelLeft', () => {
  it('centres a label on its tick by its leading digit count', () => {
    expect(labelLeft(0, '0')).toBe('calc(0% - 0.5ch)');
    expect(labelLeft(50, '500')).toBe('calc(50% - 1.5ch)');
    expect(labelLeft(100, `2${NBSP}km`)).toBe('calc(100% - 0.5ch)');
    expect(labelLeft(100, `500${NBSP}m`)).toBe('calc(100% - 1.5ch)');
  });
});

describe('tickLeft', () => {
  it('writes u x 100 with at most 2 decimals of percent', () => {
    expect(tickLeft(0.6775)).toBe('67.75%');
    expect(tickLeft(0.657)).toBe('65.7%');
    expect(tickLeft(0)).toBe('0%');
    expect(tickLeft(1)).toBe('100%');
  });
});

describe('cellWidthPx (UI-SPEC minimum cell widths)', () => {
  it('matches 155 / 344 / 216 / 248 px at 375 / 768 / 1024 / 1440', () => {
    expect(Math.floor(cellWidthPx(375))).toBe(155);
    expect(cellWidthPx(768)).toBe(344);
    expect(cellWidthPx(1024)).toBe(216);
    expect(cellWidthPx(1440)).toBe(248);
  });

  it('stops growing at the 1152 px container', () => {
    expect(cellWidthPx(2560)).toBe(248);
  });
});

describe('scaleFits (E4 overflow backstop)', () => {
  it('fits for the real extent width', () => {
    expect(scaleFits(terrain.extent.widthM)).toBe(true);
  });

  it.each(Array.from({ length: 9 }, (_, i) => 10000 + i * 250))('fits for an extent of %i m', (w) => {
    expect(scaleFits(w)).toBe(true);
  });

  it('fails for an extent too narrow for the 2 km tier', () => {
    expect(scaleFits(4000)).toBe(false);
  });
});
