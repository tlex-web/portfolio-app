/**
 * The summit layouts (G-09-2, 09-18; D-03; Tim: "Compact plaque + measured
 * 3D"; 09-UI-SPEC "Summit Section"; the measurements and clear conditions are in
 * .planning/debug/summit-pins-under-plaque.md). Pure and import-free, like
 * poster-frame.ts: keep it to erasable TypeScript and never add an import.
 *
 * The poster pins sit at fixed plan-view positions (D-16), so the plaque has to
 * avoid them. On landscape stages pin 3 (u 0.459) sits at x = 0.459 x W: the
 * full 448 px column clears it from a viewport about 1100 px wide, and the
 * max-w-6xl centring brings the column back under it from about 1944 px. There
 * the full plaque (kicker, h2, height and stats, centred on the left) is used;
 * everywhere else the compact one: a 320 px column docked at the bottom with a
 * one-line plate and the signs, inside the lowest 41 % of a portrait stage that
 * the pins (v up to 0.59) leave free.
 *
 * app/globals.css spells SUMMIT_FULL_MEDIA in the summit-full and
 * summit-compact variants; lib/__tests__/summit-layout.test.ts fails if they
 * drift, and sweeps summitColumnBox against posterFrame. The column model is
 * checked against the browser by the e2e rows in e2e/home-ascent.spec.ts.
 */

export type SummitLayout = 'full' | 'compact';

/** A box in stage px (origin at the stage's top-left, under the nav). */
export type ColumnBox = { x: number; y: number; width: number; height: number };

/** The full layout starts at this viewport width (1100 px). */
export const SUMMIT_FULL_MIN_REM = 68.75;

/** The full layout ends below this viewport width (1944 px, exclusive). */
export const SUMMIT_FULL_MAX_REM = 121.5;

/** The media condition of the full layout; summit-compact is `not all and` it. */
export const SUMMIT_FULL_MEDIA = `(orientation: landscape) and (${SUMMIT_FULL_MIN_REM}rem <= width < ${SUMMIT_FULL_MAX_REM}rem)`;

const REM = 16;
const NAV_H = 64;
const CONTAINER_MAX = 1152; // max-w-6xl
const COMPACT_W = 320; // max-w-80
const COMPACT_H = 170; // plate 42 + gap 8 + signs 120
const COMPACT_PAD_BOTTOM = 16; // pb-4
const FULL_W = 448; // max-w-md
const FULL_H = 478; // measured at 1440 x 900 (debug note, 14:25)

/**
 * The summit layout CSS picks for a viewport: 'full' when it is landscape
 * (width greater than height, as CSS orientation) and its width lies in
 * [1100, 1944) px; 'compact' otherwise.
 */
export function summitLayoutAt(viewportW: number, viewportH: number): SummitLayout {
  const landscape = viewportW > viewportH;
  const inBand = viewportW >= SUMMIT_FULL_MIN_REM * REM && viewportW < SUMMIT_FULL_MAX_REM * REM;
  return landscape && inBand ? 'full' : 'compact';
}

/** Horizontal page padding at a viewport width: px-4, sm:px-6, lg:px-8. */
function paddingAt(viewportW: number): number {
  if (viewportW >= 1024) return 32;
  if (viewportW >= 640) return 24;
  return 16;
}

/**
 * The modelled plaque column ([data-summit-plaque]) in stage px for a viewport
 * and a scrollbar gutter: the stage is the viewport minus the gutter wide and
 * minus the 64 px nav tall. The column's left edge is the max-w-6xl container's
 * left edge plus the page padding. Compact: 320 x 170 px (narrower if the
 * content box is), docked 16 px above the stage bottom. Full: 448 x 478 px,
 * centred vertically.
 */
export function summitColumnBox(viewportW: number, viewportH: number, gutterPx: number): ColumnBox {
  const stageW = viewportW - gutterPx;
  const stageH = viewportH - NAV_H;
  const pad = paddingAt(viewportW);
  const container = Math.min(stageW, CONTAINER_MAX);
  const x = (stageW - container) / 2 + pad;
  const content = container - 2 * pad;

  if (summitLayoutAt(viewportW, viewportH) === 'full') {
    return { x, y: (stageH - FULL_H) / 2, width: Math.min(FULL_W, content), height: FULL_H };
  }
  return {
    x,
    y: stageH - COMPACT_PAD_BOTTOM - COMPACT_H,
    width: Math.min(COMPACT_W, content),
    height: COMPACT_H,
  };
}
