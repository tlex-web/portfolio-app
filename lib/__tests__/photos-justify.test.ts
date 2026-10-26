/**
 * Justified rows without JS measurement (PHOTO-02; D-15; 10-RESEARCH
 * Pattern 5; 10-UI-SPEC "Grid View"). Each tile is
 * `flex: <aspect> 1 calc(<aspect> * var(--row-h))` with the manifest ratio on
 * its image box, so every tile in a flex line ends up the same height and the
 * server-rendered layout is final (CLS 0). The row height is 224 px from
 * 640 px and 280 px from 1024 px (approved by Tim 2026-10-26: 280 px alone
 * gives one tile per row at 768), which yields two rows of two for the four
 * committed photos at 768 (720 px container, 710 in CI) and at 1440 (1088 px).
 */
import {
  FILLER_GROW,
  ROW_H_MD_PX,
  ROW_H_PX,
  flexLines,
  justifyTile,
  rowHeights,
} from '@/lib/photos/justify';
import { photoViews } from '@/lib/photos/view-model';

const GAP = 16; // gap-4

describe('constants', () => {
  it('uses 224 px rows from 640 px and 280 px rows from 1024 px', () => {
    expect(ROW_H_MD_PX).toBe(224);
    expect(ROW_H_PX).toBe(280);
  });

  it('gives the trailing filler a grow factor that swamps every tile', () => {
    expect(FILLER_GROW).toBe(999999);
  });
});

describe('justifyTile', () => {
  it('turns the 2560 x 1707 variant into its flex and aspect-ratio values', () => {
    expect(justifyTile(2560, 1707)).toEqual({
      aspect: 1.4997,
      flex: '1.4997 1 calc(1.4997 * var(--row-h))',
      aspectRatio: '2560 / 1707',
    });
  });

  it('rounds the film scan ratio (2560 x 1745) to four decimals', () => {
    const tile = justifyTile(2560, 1745);
    expect(tile.aspect).toBeCloseTo(1.467, 4);
    expect(tile.aspectRatio).toBe('2560 / 1745');
    expect(tile.flex).toBe(`${tile.aspect} 1 calc(${tile.aspect} * var(--row-h))`);
  });

  it.each([
    [0, 10],
    [10, 0],
    [-1, 10],
    [Number.NaN, 10],
    [10, Number.POSITIVE_INFINITY],
  ])('throws a RangeError for %p x %p', (w, h) => {
    expect(() => justifyTile(w, h)).toThrow(RangeError);
  });
});

describe('rowHeights (one flex line)', () => {
  it('gives two equal-ratio tiles one height, their widths filling the line', () => {
    const [a, b] = rowHeights(1088, [1.4997, 1.4997], ROW_H_PX, GAP);
    expect(Math.abs(a - b)).toBeLessThan(0.01);
    expect(a * 1.4997 + b * 1.4997).toBeCloseTo(1088 - GAP, 6);
  });

  it('gives a mixed-ratio row one height', () => {
    const [a, b] = rowHeights(720, [1.4997, 1.467], ROW_H_MD_PX, GAP);
    expect(Math.abs(a - b)).toBeLessThan(0.01);
    expect(a * 1.4997 + b * 1.467).toBeCloseTo(720 - GAP, 6);
  });

  it('keeps one height when the line is narrower than the bases (flex-shrink)', () => {
    const heights = rowHeights(600, [1.4997, 1.467], ROW_H_MD_PX, GAP);
    expect(heights[0]).toBeLessThan(ROW_H_MD_PX);
    expect(Math.abs(heights[0] - heights[1])).toBeLessThan(0.01);
  });

  it('throws a RangeError for an empty line or a non-positive size', () => {
    expect(() => rowHeights(720, [], ROW_H_MD_PX, GAP)).toThrow(RangeError);
    expect(() => rowHeights(0, [1.5], ROW_H_MD_PX, GAP)).toThrow(RangeError);
    expect(() => rowHeights(720, [1.5], 0, GAP)).toThrow(RangeError);
    expect(() => rowHeights(720, [0], ROW_H_MD_PX, GAP)).toThrow(RangeError);
  });
});

describe('the four committed photos (UI-SPEC Grid: two rows of two)', () => {
  /** Computed inside each test, so a failing justifyTile fails the test, not the suite. */
  const aspects = () => photoViews.map((v) => justifyTile(v.aspect.w, v.aspect.h).aspect);
  /** The flex items in DOM order: four tiles, then the zero-basis ::after filler. */
  const items = (rowH: number) => [...aspects().map((a) => a * rowH), 0];

  it('has four photos', () => {
    expect(aspects()).toHaveLength(4);
  });

  it.each([
    [710, ROW_H_MD_PX],
    [720, ROW_H_MD_PX],
    [960, ROW_H_PX],
    [1088, ROW_H_PX],
  ])('breaks a %i px line at %i px rows into two rows of two, the filler on the last', (w, rowH) => {
    expect(flexLines(w, items(rowH), GAP)).toEqual([
      [0, 1],
      [2, 3, 4],
    ]);
  });

  it('puts one tile per line at 720 px with 280 px rows (the reason for ROW_H_MD_PX)', () => {
    expect(flexLines(720, items(ROW_H_PX), GAP)).toEqual([[0], [1], [2], [3, 4]]);
  });

  it('gives the tiles of each filled row one height at 720 and 1088', () => {
    for (const [w, rowH] of [
      [720, ROW_H_MD_PX],
      [1088, ROW_H_PX],
    ] as const) {
      const [a, b] = rowHeights(w, aspects().slice(0, 2), rowH, GAP);
      expect(Math.abs(a - b)).toBeLessThan(0.01);
      expect(a).toBeGreaterThanOrEqual(rowH);
    }
  });
});
