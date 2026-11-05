/**
 * Justified rows without JS measurement (PHOTO-02, D-15; 10-RESEARCH
 * Pattern 5; 10-UI-SPEC "Grid View"). Pure and import-free: keep it to
 * erasable TypeScript and never add an import.
 *
 * From 640 px every grid tile is the flex item
 * `flex: <aspect> 1 calc(<aspect> * var(--row-h))` and its image box carries
 * `aspect-ratio: w / h` from the manifest, so the server-rendered layout is
 * final before any image arrives (CLS 0). Grow is proportional to the basis
 * (both are the aspect times one constant), so the free space of a flex line
 * is shared in proportion to each tile's aspect and every tile in the line
 * gets the same height. flex-shrink weighs by the basis, which is again
 * proportional to the aspect, so an overfull line keeps one height as well.
 * A trailing `::after` filler (`flex: FILLER_GROW 1 0px`) takes the free space
 * of the last line, so a single last tile keeps its basis instead of
 * stretching across the row.
 *
 * Row height: 224 px from 640 px and 280 px from 1024 px (correction approved
 * by Tim 2026-10-26, "Accept 224/280 (Recommended)"). 280 px alone puts one
 * tile per row at 768 (720 px container, 710 in CI; two tiles need
 * 2 x 420 + 16 = 856 px); 224 px needs 688, so the four photos render two rows
 * of two at 768 and at 1440 (1088 px container), the outcome the UI-SPEC
 * states. components/photos/JustifiedGrid.tsx spells both values as literal
 * Tailwind classes; components/__tests__/GalleryGrid.test.tsx fails if they
 * drift from these constants.
 */

/** The row height from 1024 px (`lg:[--row-h:280px]`). */
export const ROW_H_PX = 280;

/** The row height from 640 px to below 1024 px (`sm:[--row-h:224px]`). */
export const ROW_H_MD_PX = 224;

/** The grow factor of the trailing filler: it swamps every tile's grow (an aspect near 1.5). */
export const FILLER_GROW = 999999;

export type JustifiedTile = {
  /** The width/height ratio, rounded to 4 decimals. */
  aspect: number;
  /** The tile's CSS `flex` shorthand: '{aspect} 1 calc({aspect} * var(--row-h))'. */
  flex: string;
  /** The image box's CSS `aspect-ratio`: '{width} / {height}'. */
  aspectRatio: string;
};

const valid = (v: number): boolean => Number.isFinite(v) && v > 0;

/**
 * The flex and aspect-ratio values of one tile, from its manifest size.
 *
 * @throws RangeError for a non-positive or non-finite width or height.
 */
export function justifyTile(width: number, height: number): JustifiedTile {
  if (!valid(width) || !valid(height)) {
    throw new RangeError(`justifyTile: size must be positive and finite, got ${width} x ${height}`);
  }
  const aspect = Math.round((width / height) * 10000) / 10000;
  return {
    aspect,
    flex: `${aspect} 1 calc(${aspect} * var(--row-h))`,
    aspectRatio: `${width} / ${height}`,
  };
}

/**
 * The image heights one flex line of these tiles gets (a model for tests).
 * Each tile's width is its basis (aspect x rowH) plus a share of the line's
 * free space proportional to its grow (the aspect), or minus a share of the
 * overflow proportional to its shrink-weighted basis (again the aspect); its
 * height is that width over the aspect. Both shares are proportional to the
 * aspect, so every height is rowH + free / sum(aspects).
 *
 * @throws RangeError for an empty line or a non-positive size.
 */
export function rowHeights(
  containerW: number,
  aspects: readonly number[],
  rowH: number,
  gap: number
): number[] {
  if (aspects.length === 0) throw new RangeError('rowHeights: a line holds at least one tile');
  if (!valid(containerW) || !valid(rowH) || !aspects.every(valid) || !(gap >= 0)) {
    throw new RangeError('rowHeights: sizes must be positive and finite');
  }
  const sum = aspects.reduce((total, a) => total + a, 0);
  const free = containerW - gap * (aspects.length - 1) - sum * rowH;
  return aspects.map((a) => {
    const width = a * rowH + (free * a) / sum;
    return width / a;
  });
}

/**
 * How `flex-wrap: wrap` with a `gap` breaks items of these bases into lines:
 * each line takes the next item while the bases and gaps still fit, and an
 * item wider than the line sits alone. Returns the item indices per line.
 */
export function flexLines(containerW: number, bases: readonly number[], gap: number): number[][] {
  const lines: number[][] = [];
  let used = 0;
  bases.forEach((basis, i) => {
    const line = lines[lines.length - 1];
    if (line && used + gap + basis <= containerW) {
      line.push(i);
      used += gap + basis;
    } else {
      lines.push([i]);
      used = basis;
    }
  });
  return lines;
}
