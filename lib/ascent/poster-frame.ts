/**
 * The one poster-frame rule (D-16; 09-UI-SPEC "Stage: Poster, Sheet Box and
 * Canvas"). Pure and import-free on purpose: the poster CSS in
 * components/home/PosterSheet.tsx and the 3D camera at scroll 0 (09-08) both
 * follow it, so the canvas fades in over the poster with no jump. Keep it to
 * erasable TypeScript and never add an import.
 *
 * The plan-view map sheet is a square of side max(W, H) placed over a W x H
 * stage. Landscape stages crop it vertically (centred); portrait stages crop it
 * horizontally with the horizontal bias below.
 */

/**
 * Horizontal placement of the sheet on portrait stages (UI-SPEC "Why 0.64").
 * With 0.64 the visible window at 375 x 603 is u = 0.242-0.864, which contains
 * every photo (u 0.46-0.83). On landscape stages the sheet crops vertically
 * only, so this value has no effect there.
 */
export const POSTER_X_BIAS = 0.64;

export type PosterFrame = {
  /** Side of the square sheet box in px: max(stageW, stageH). */
  side: number;
  /** Left offset of the sheet box in px (zero or negative). */
  left: number;
  /** Top offset of the sheet box in px (zero or negative). */
  top: number;
  /** Visible UV window of the sheet, each value in 0..1. */
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
};

/**
 * Sheet box geometry and visible UV window for a stage of `stageW` x `stageH`
 * px: side = max(W, H), left = (W - side) x POSTER_X_BIAS, top = (H - side) x
 * 0.5. Throws a RangeError for a non-positive or non-finite size.
 */
export function posterFrame(stageW: number, stageH: number): PosterFrame {
  if (!Number.isFinite(stageW) || !Number.isFinite(stageH) || stageW <= 0 || stageH <= 0) {
    throw new RangeError(`posterFrame: stage size must be positive, got ${stageW} x ${stageH}`);
  }
  const side = Math.max(stageW, stageH);
  const left = (stageW - side) * POSTER_X_BIAS;
  const top = (stageH - side) * 0.5;

  return {
    side,
    left,
    top,
    uMin: -left / side,
    uMax: (stageW - left) / side,
    vMin: -top / side,
    vMax: (stageH - top) / side,
  };
}
