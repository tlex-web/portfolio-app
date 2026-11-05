/**
 * The lightbox layout tiers (D-05, D-11; 10-UI-SPEC "Layout widths,
 * breakpoints, layers" and "Layout tiers"; Tim confirmed gutters from 1280 px
 * wide and 640 px tall). Pure and import-free, like summit-layout.ts: keep it
 * to erasable TypeScript and never add an import.
 *
 * - scroll: narrower than 768 px or lower than 640 px. The surface scrolls as
 *   one column: sticky chrome, the photo at full width (capped at 70svh), then
 *   the strip in one column.
 * - key: 768 px to below 1280 px wide and at least 640 px tall. Fixed: chrome,
 *   the stage (flex-1) and the strip in two columns.
 * - gutter: from 1280 px wide and at least 640 px tall. As key, but the stage
 *   reserves a 216 px gutter on each side of the photo for the callouts (a
 *   192 px plate, a 16 px outer inset and 8 px to the photo), shown or not.
 *
 * app/globals.css spells these three strings in the lb-scroll, lb-key and
 * lb-gutter custom variants; lib/__tests__/lightbox-tiers.test.ts fails if
 * they drift apart.
 */

/** The key tier starts at this viewport width (768 px). */
export const LB_KEY_MIN_REM = 48;

/** The gutter tier starts at this viewport width (1280 px). */
export const LB_GUTTER_MIN_REM = 80;

/** Below this viewport height (640 px) every width is the scroll tier. */
export const LB_MIN_HEIGHT_REM = 40;

/** The scroll tier: narrower than 768 px, or lower than 640 px. */
export const LB_SCROLL_MEDIA = `(width < ${LB_KEY_MIN_REM}rem), (height < ${LB_MIN_HEIGHT_REM}rem)`;

/** The key tier: 768 px to below 1280 px wide, at least 640 px tall. */
export const LB_KEY_MEDIA = `(${LB_KEY_MIN_REM}rem <= width < ${LB_GUTTER_MIN_REM}rem) and (height >= ${LB_MIN_HEIGHT_REM}rem)`;

/** The gutter tier: from 1280 px wide, at least 640 px tall. */
export const LB_GUTTER_MEDIA = `(width >= ${LB_GUTTER_MIN_REM}rem) and (height >= ${LB_MIN_HEIGHT_REM}rem)`;

/** The reserved hotspot gutter on each side of the photo box (gutter tier), px. */
export const LB_GUTTER_PX = 216;

/** The chrome bar height (h-14), px. */
export const LB_CHROME_PX = 56;
