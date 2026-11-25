/**
 * The region page's image `sizes` (13 #34, figure half; 18-RESEARCH "sizes per
 * breakpoint (13 #34) and LCP"; 18-UI-SPEC Contract 2 "Sequence" and "Figure =
 * map collar"). Pure and import-free, like lightbox-tiers.ts: every number in a
 * `sizes` string derives from the layout constants below, so a layout change
 * moves the string, and lib/__tests__/image-sizes.test.ts scans the components
 * whose CSS spells the same values (the 16rem floor, the 12rem chrome, the 6rem
 * rail column), so CSS and TypeScript cannot drift apart.
 *
 * Each term is an upper bound of the rendered width, so the browser never
 * under-fetches: `vh` is the largest of the viewport units the CSS uses (`svh`),
 * and a breakpoint's gutter is the narrowest one that applies from it.
 */

/** The container's content width at its max: max-w-6xl (1152) minus the lg gutters (2 x 32). */
export const CONTENT_MAX_PX = 1088;

/** The container's inline padding per side: px-4, sm:px-6, lg:px-8. */
export const GUTTER_PX = { base: 16, sm: 24, lg: 32 } as const;

/**
 * The viewport width from which the photo column is surely at its max: the
 * 1152 px container plus 64 px of slack, so a classic scrollbar (which 100vw
 * includes) can never put the container under its max while a term says so.
 */
export const WIDE_FROM_PX = 1216;

/** The rail column beside the photos from 768 px (w-24; 18-12 fills it). */
export const RAIL_COLUMN_PX = 96;

/** The gap between the photo column and the rail column (gap-6). */
export const RAIL_GAP_PX = 24;

/** The site nav's height (--nav-h, h-16). */
export const NAV_PX = 64;

/**
 * A figure's chrome above and below the photo (12rem): the top collar 28 px,
 * the caption about 108 px and 56 px of air, so a whole figure fits one viewport.
 */
export const FIGURE_CHROME_PX = 192;

/** The figure width floor (16rem), so a portrait stays readable on a landscape phone. */
export const FIGURE_MIN_PX = 256;

/** The photo column at full width: 1088 - 96 - 24 = 968 px. */
export const PHOTO_COLUMN_MAX_PX = CONTENT_MAX_PX - RAIL_COLUMN_PX - RAIL_GAP_PX;

/** The rail appears from this viewport width (md). */
const MD_PX = 768;

function ratio(ar: number): string {
  if (!Number.isFinite(ar) || ar <= 0) {
    throw new RangeError(`image-sizes: ratio ${ar} is not a positive finite number`);
  }
  return ar.toFixed(4);
}

/**
 * The `sizes` of a sequence figure's image, from the figure box
 * `min(100%, max(16rem, calc((100svh - var(--nav-h) - 12rem) * var(--ar))))`
 * inside the photo column: 968 px from 1216 px, `100vw - 168px` from 768 px
 * (two 24 px gutters, the 96 px rail and its 24 px gap), else `100vw - 32px`.
 *
 * @throws RangeError for a ratio that is not a positive finite number.
 */
export function figureSizes(ar: number): string {
  const cap = `max(${FIGURE_MIN_PX}px, calc((100vh - ${NAV_PX + FIGURE_CHROME_PX}px) * ${ratio(ar)}))`;
  const mdInset = 2 * GUTTER_PX.sm + RAIL_COLUMN_PX + RAIL_GAP_PX;
  return [
    `(min-width: ${WIDE_FROM_PX}px) min(${PHOTO_COLUMN_MAX_PX}px, ${cap})`,
    `(min-width: ${MD_PX}px) min(calc(100vw - ${mdInset}px), ${cap})`,
    `min(calc(100vw - ${2 * GUTTER_PX.base}px), ${cap})`,
  ].join(', ');
}

/**
 * The `sizes` of the region header slot's cover (D-05). Stub: the UI-SPEC's
 * starting point, before the contain factor (18-08 Task 2 RED).
 */
export function headerSlotSizes(ar: number): string {
  void ar;
  return '(min-width: 1216px) 1088px, (min-width: 640px) calc(100vw - 48px), 100vw';
}
