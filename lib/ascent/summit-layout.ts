/**
 * Summit layout (G-09-2, 09-18). Signature-only stub for the RED commit.
 */

export type SummitLayout = 'full' | 'compact';

export type ColumnBox = { x: number; y: number; width: number; height: number };

export const SUMMIT_FULL_MIN_REM = Number.NaN;

export const SUMMIT_FULL_MAX_REM = Number.NaN;

export const SUMMIT_FULL_MEDIA = '';

export function summitLayoutAt(viewportW: number, viewportH: number): SummitLayout {
  void viewportW;
  void viewportH;
  return 'compact';
}

export function summitColumnBox(viewportW: number, viewportH: number, gutterPx: number): ColumnBox {
  void viewportW;
  void viewportH;
  void gutterPx;
  return { x: Number.NaN, y: Number.NaN, width: Number.NaN, height: Number.NaN };
}
