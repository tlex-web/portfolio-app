/**
 * The photo image `sizes` (13 #34; 18-RESEARCH "sizes per breakpoint (13 #34)
 * and LCP"; 18-UI-SPEC Contract 2 "Sequence" and "Figure = map collar"): the
 * region page's figures and header slot, and the viewer stage (18-19). Pure,
 * and its one import is lightbox-tiers.ts, itself import-free: every number in
 * a `sizes` string derives from the layout constants below or the lightbox
 * tiers, so a layout change moves the string, and lib/__tests__/image-sizes.test.ts
 * scans the components whose CSS spells the same values (the 16rem floor, the
 * 12rem chrome, the 6rem rail column, the stage's 70svh scroll cap), so CSS and
 * TypeScript cannot drift apart.
 *
 * Each term is an upper bound of the rendered width, so the browser never
 * under-fetches: `vh` is the largest of the viewport units the CSS uses (`svh`),
 * and a breakpoint's gutter is the narrowest one that applies from it.
 */
import {
  LB_CHROME_PX,
  LB_GUTTER_MIN_REM,
  LB_GUTTER_PX,
  LB_KEY_MIN_REM,
  LB_MIN_HEIGHT_REM,
} from '@/lib/photos/lightbox-tiers';

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

/** The header slot's box ratio (aspect-video). */
const SLOT_RATIO = 16 / 9;

/** The sm and lg breakpoints, where the container's gutters widen. */
const SM_PX = 640;
const LG_PX = 1024;

/**
 * The `sizes` of the region header slot's cover (D-05; 18-UI-SPEC Contract 2
 * "Header slot"; P3 default). The slot is a 16:9 box, full-bleed below 640 px
 * (100vw), the container's content width above (100vw - 48px from 640 px,
 * 100vw - 64px from 1024 px, 1088 px from 1216 px). The cover is contained in
 * it, never cropped, so its rendered width is the box width times
 * min(1, 9/16 * ar): a 16:9 or wider cover spans the box, a 3:2 one
 * pillarboxes slightly, a portrait one pillarboxes a lot. The px term is
 * rounded up and the factor printed to four decimals.
 *
 * @throws RangeError for a ratio that is not a positive finite number.
 */
export function headerSlotSizes(ar: number): string {
  ratio(ar);
  const factor = Math.min(1, ar / SLOT_RATIO);
  const full = factor >= 0.99995;
  const f = factor.toFixed(4);
  const box = (inset: number) =>
    full ? `calc(100vw - ${inset}px)` : `calc((100vw - ${inset}px) * ${f})`;
  return [
    `(min-width: ${WIDE_FROM_PX}px) ${full ? CONTENT_MAX_PX : Math.ceil(CONTENT_MAX_PX * factor)}px`,
    `(min-width: ${LG_PX}px) ${box(2 * GUTTER_PX.lg)}`,
    `(min-width: ${SM_PX}px) ${box(2 * GUTTER_PX.sm)}`,
    full ? '100vw' : `calc(100vw * ${f})`,
  ].join(', ');
}

/** The scroll tier's photo cap (70svh: PhotoViewer's lb-scroll photo box width; image-sizes.test pins it). */
export const STAGE_SCROLL_VH = 70;

/** One rem in CSS px, for the lightbox tiers' rem thresholds. */
const REM_PX = 16;

/**
 * The `sizes` of the viewer stage's large picture (13 #34, stage half; 18-19),
 * from the lightbox tiers (lib/photos/lightbox-tiers.ts):
 * - gutter (from 1280 px wide and 640 px tall): the viewport less the two 216 px
 *   hotspot gutters, capped by the stage height times the ratio;
 * - key (from 768 px wide and 640 px tall): the viewport width, capped the same way;
 * - scroll (otherwise): the viewport width, capped at 70vh times the ratio.
 *
 * The stage height is the viewport less what sits above it: the nav and the
 * 56 px chrome bar on the page (120 px), the chrome bar alone in the dialog
 * (56 px). The strip below the stage is ignored on purpose: each term is an
 * upper bound of the photo box, so the browser never under-fetches.
 *
 * @throws RangeError for a ratio that is not a positive finite number.
 */
export function stageSizes(ar: number, variant: 'page' | 'modal'): string {
  const r = ratio(ar);
  const above = variant === 'page' ? NAV_PX + LB_CHROME_PX : LB_CHROME_PX;
  const cap = `calc((100vh - ${above}px) * ${r})`;
  const tall = `(min-height: ${LB_MIN_HEIGHT_REM * REM_PX}px)`;
  return [
    `(min-width: ${LB_GUTTER_MIN_REM * REM_PX}px) and ${tall} min(calc(100vw - ${2 * LB_GUTTER_PX}px), ${cap})`,
    `(min-width: ${LB_KEY_MIN_REM * REM_PX}px) and ${tall} min(100vw, ${cap})`,
    `min(100vw, calc(${STAGE_SCROLL_VH}vh * ${r}))`,
  ].join(', ');
}
