/**
 * The region page's `sizes` strings (13 #34, figure half; 18-RESEARCH
 * "sizes per breakpoint (13 #34) and LCP"): every number in a figure's
 * `sizes` derives from the layout constants in lib/photos/image-sizes.ts, so a
 * layout change moves the string, and the photo column widths match the
 * UI-SPEC's measured ones (1440: 968 px; 768: 100vw - 168px; 375: 100vw - 32px).
 */
import * as sizes from '@/lib/photos/image-sizes';
import {
  CONTENT_MAX_PX,
  FIGURE_CHROME_PX,
  FIGURE_MIN_PX,
  GUTTER_PX,
  NAV_PX,
  WIDE_FROM_PX,
  RAIL_COLUMN_PX,
  RAIL_GAP_PX,
  figureSizes,
} from '@/lib/photos/image-sizes';

describe('layout constants (18-UI-SPEC Contract 2 "Sequence")', () => {
  it('match the UI-SPEC values', () => {
    expect(CONTENT_MAX_PX).toBe(1088);
    expect(RAIL_COLUMN_PX).toBe(96);
    expect(RAIL_GAP_PX).toBe(24);
    expect(NAV_PX).toBe(64);
    expect(FIGURE_CHROME_PX).toBe(192);
    expect(FIGURE_MIN_PX).toBe(256);
    expect(GUTTER_PX).toEqual({ base: 16, sm: 24, lg: 32 });
    expect(WIDE_FROM_PX).toBe(1216);
  });

  it('give the photo column 968 px at full width (1088 - 96 - 24)', () => {
    expect(sizes.PHOTO_COLUMN_MAX_PX).toBe(968);
  });
});

describe('figureSizes(ar)', () => {
  it('spells the three tiers for a 3:2 landscape', () => {
    const cap = 'max(256px, calc((100vh - 256px) * 1.5000))';
    expect(figureSizes(3 / 2)).toBe(
      `(min-width: 1216px) min(968px, ${cap}), ` +
        `(min-width: 768px) min(calc(100vw - 168px), ${cap}), ` +
        `min(calc(100vw - 32px), ${cap})`
    );
  });

  it('caps a 3:4 portrait by the viewport height', () => {
    const cap = 'max(256px, calc((100vh - 256px) * 0.7500))';
    expect(figureSizes(3 / 4)).toBe(
      `(min-width: 1216px) min(968px, ${cap}), ` +
        `(min-width: 768px) min(calc(100vw - 168px), ${cap}), ` +
        `min(calc(100vw - 32px), ${cap})`
    );
  });

  it('prints a 16:9 ratio to four decimals', () => {
    expect(figureSizes(16 / 9)).toContain('calc((100vh - 256px) * 1.7778)');
  });

  it('uses the three photo column widths of the UI-SPEC', () => {
    const terms = figureSizes(1.5).split(/, (?=\(min-width|min\(calc\(100vw - 32px\))/);
    expect(terms).toHaveLength(3);
    expect(terms[0]).toMatch(/^\(min-width: 1216px\) min\(968px, /);
    expect(terms[1]).toMatch(/^\(min-width: 768px\) min\(calc\(100vw - 168px\), /);
    expect(terms[2]).toMatch(/^min\(calc\(100vw - 32px\), /);
  });

  it('derives every number from the constants (a constant change moves the string)', () => {
    const column = CONTENT_MAX_PX - RAIL_COLUMN_PX - RAIL_GAP_PX;
    const mdInset = 2 * GUTTER_PX.sm + RAIL_COLUMN_PX + RAIL_GAP_PX;
    const s = figureSizes(2);
    expect(s).toContain(`(min-width: ${WIDE_FROM_PX}px) min(${column}px, `);
    expect(s).toContain(`min(calc(100vw - ${2 * GUTTER_PX.base}px), `);
    expect(s).toContain(`min(calc(100vw - ${mdInset}px), `);
    expect(s).toContain(
      `max(${FIGURE_MIN_PX}px, calc((100vh - ${NAV_PX + FIGURE_CHROME_PX}px) * 2.0000))`
    );
  });

  it('rejects a ratio that is not a positive finite number', () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => figureSizes(bad)).toThrow(RangeError);
    }
  });
});
