/**
 * The region page's `sizes` strings (13 #34, figure half; 18-RESEARCH
 * "sizes per breakpoint (13 #34) and LCP"): every number in a figure's
 * `sizes` derives from the layout constants in lib/photos/image-sizes.ts, so a
 * layout change moves the string, and the photo column widths match the
 * UI-SPEC's measured ones (1440: 968 px; 768: 100vw - 168px; 375: 100vw - 32px).
 *
 * The header slot (D-05; P3 default: the cover pillarboxed in a 16:9 box)
 * contains the cover, so its `sizes` is the box width times the contain factor
 * min(1, 9/16 * ar). A source scan pins the CSS that spells the same values
 * (the figure's 16rem floor and 12rem chrome, the rail column's 6rem), so CSS
 * and TypeScript cannot drift (the lightbox-tiers precedent).
 *
 * The viewer stage (13 #34, stage half; 18-19) takes stageSizes(ar, variant):
 * the gutter, key and scroll tiers of lib/photos/lightbox-tiers.ts, each capped
 * by the stage height times the ratio (120 px of nav and chrome on the page,
 * 56 px of chrome in the dialog, 70vh on the scroll tier). The strip below the
 * stage is ignored on purpose: an upper bound never under-fetches.
 */
import fs from 'node:fs';
import path from 'node:path';
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
  STAGE_SCROLL_VH,
  figureSizes,
  headerSlotSizes,
  stageSizes,
} from '@/lib/photos/image-sizes';
import {
  LB_CHROME_PX,
  LB_GUTTER_MIN_REM,
  LB_GUTTER_PX,
  LB_KEY_MIN_REM,
  LB_MIN_HEIGHT_REM,
} from '@/lib/photos/lightbox-tiers';

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

describe('headerSlotSizes(ar) (D-05, P3 default: 16:9 box, object-contain)', () => {
  it('applies the contain factor to every box width for a 3:2 cover', () => {
    // min(1, 0.5625 * 1.5) = 0.84375; 1088 * 0.84375 = 918.
    expect(headerSlotSizes(1.5)).toBe(
      '(min-width: 1216px) 918px, ' +
        '(min-width: 1024px) calc((100vw - 64px) * 0.8438), ' +
        '(min-width: 640px) calc((100vw - 48px) * 0.8438), ' +
        'calc(100vw * 0.8438)'
    );
  });

  it('uses factor 1 for a 16:9 cover (it fills the box)', () => {
    expect(headerSlotSizes(1.7778)).toBe(
      '(min-width: 1216px) 1088px, ' +
        '(min-width: 1024px) calc(100vw - 64px), ' +
        '(min-width: 640px) calc(100vw - 48px), ' +
        '100vw'
    );
  });

  it('uses factor 1 for a cover wider than 16:9 (letterboxed, full width)', () => {
    expect(headerSlotSizes(2.4)).toBe(headerSlotSizes(16 / 9));
  });

  it('pillarboxes a 3:4 portrait cover (factor 0.4219, 459 px at full width)', () => {
    expect(headerSlotSizes(0.75)).toBe(
      '(min-width: 1216px) 459px, ' +
        '(min-width: 1024px) calc((100vw - 64px) * 0.4219), ' +
        '(min-width: 640px) calc((100vw - 48px) * 0.4219), ' +
        'calc(100vw * 0.4219)'
    );
  });

  it('derives the box widths from the constants', () => {
    const s = headerSlotSizes(16 / 9);
    expect(s).toContain(`(min-width: ${WIDE_FROM_PX}px) ${CONTENT_MAX_PX}px`);
    expect(s).toContain(`calc(100vw - ${2 * GUTTER_PX.lg}px)`);
    expect(s).toContain(`calc(100vw - ${2 * GUTTER_PX.sm}px)`);
  });

  it('rejects a ratio that is not a positive finite number', () => {
    for (const bad of [0, -2, Number.NaN]) {
      expect(() => headerSlotSizes(bad)).toThrow(RangeError);
    }
  });
});

describe('stageSizes(ar, variant) (13 #34, stage half; 18-19)', () => {
  it('spells the gutter, key and scroll tiers for a 3:2 photo on the page', () => {
    expect(stageSizes(1.5, 'page')).toBe(
      '(min-width: 1280px) and (min-height: 640px) min(calc(100vw - 432px), calc((100vh - 120px) * 1.5000)), ' +
        '(min-width: 768px) and (min-height: 640px) min(100vw, calc((100vh - 120px) * 1.5000)), ' +
        'min(100vw, calc(70vh * 1.5000))'
    );
  });

  it('takes 56 px of chrome (no nav) in the dialog', () => {
    expect(stageSizes(1.5, 'modal')).toBe(
      '(min-width: 1280px) and (min-height: 640px) min(calc(100vw - 432px), calc((100vh - 56px) * 1.5000)), ' +
        '(min-width: 768px) and (min-height: 640px) min(100vw, calc((100vh - 56px) * 1.5000)), ' +
        'min(100vw, calc(70vh * 1.5000))'
    );
  });

  it('caps a 2:3 portrait by the stage height, ratio to four decimals', () => {
    const s = stageSizes(2 / 3, 'page');
    expect(s).toContain('min(calc(100vw - 432px), calc((100vh - 120px) * 0.6667))');
    expect(s).toContain('min(100vw, calc((100vh - 120px) * 0.6667))');
    expect(s.endsWith('min(100vw, calc(70vh * 0.6667))')).toBe(true);
  });

  it('derives every number from the lightbox-tiers constants and NAV_PX', () => {
    const REM = 16;
    for (const variant of ['page', 'modal'] as const) {
      const above = variant === 'page' ? NAV_PX + LB_CHROME_PX : LB_CHROME_PX;
      const terms = stageSizes(2, variant).split(/, (?=\(min-width|min\(100vw, calc\(\d+vh)/);
      expect(terms).toEqual([
        `(min-width: ${LB_GUTTER_MIN_REM * REM}px) and (min-height: ${LB_MIN_HEIGHT_REM * REM}px) ` +
          `min(calc(100vw - ${2 * LB_GUTTER_PX}px), calc((100vh - ${above}px) * 2.0000))`,
        `(min-width: ${LB_KEY_MIN_REM * REM}px) and (min-height: ${LB_MIN_HEIGHT_REM * REM}px) ` +
          `min(100vw, calc((100vh - ${above}px) * 2.0000))`,
        `min(100vw, calc(${STAGE_SCROLL_VH}vh * 2.0000))`,
      ]);
    }
  });

  it('rejects a ratio that is not a positive finite number', () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => stageSizes(bad, 'page')).toThrow(RangeError);
    }
  });
});

describe('CSS parity with the layout constants (source scan)', () => {
  const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  const REM = 16;

  it("SequenceFigure's width class spells the 16rem floor and the 12rem chrome", () => {
    const src = read('components/photos/region/SequenceFigure.tsx');
    const width =
      /w-\[min\(100%,max\((\d+)rem,calc\(\(100svh-var\(--nav-h\)-(\d+)rem\)\*var\(--ar\)\)\)\)\]/.exec(
        src
      );
    expect(width).not.toBeNull();
    expect(Number(width![1])).toBe(FIGURE_MIN_PX / REM);
    expect(Number(width![2])).toBe(FIGURE_CHROME_PX / REM);
    expect(src).toContain('sizes={figureSizes(ar)}');
  });

  it("RegionSequence's rail column equals RAIL_COLUMN_PX and its gap RAIL_GAP_PX", () => {
    const src = read('components/photos/region/RegionSequence.tsx');
    const grid = /md:grid-cols-\[minmax\(0,1fr\)_(\d+)rem\]/.exec(src);
    expect(grid).not.toBeNull();
    expect(Number(grid![1])).toBe(RAIL_COLUMN_PX / REM);
    // gap-6 is 24 px on Tailwind's 4 px base.
    expect(src).toContain(` md:gap-${RAIL_GAP_PX / 4}"`);
  });

  it("HeaderSlot's image takes headerSlotSizes", () => {
    const src = read('components/photos/region/HeaderSlot.tsx');
    expect(src).toContain('sizes={headerSlotSizes(ar)}');
  });

  it("PhotoViewer's scroll-tier photo box spells STAGE_SCROLL_VH, and the stage takes stageSizes", () => {
    const src = read('components/photos/PhotoViewer.tsx');
    const cap = /lb-scroll:w-\[min\(100%,calc\((\d+)svh\*var\(--ar\)\)\)\]/.exec(src);
    expect(cap).not.toBeNull();
    expect(Number(cap![1])).toBe(STAGE_SCROLL_VH);
    expect(src).toContain('sizes={stageSizes(');
  });
});
