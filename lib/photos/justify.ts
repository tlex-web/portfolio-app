/**
 * Justified-row maths (PHOTO-02, D-15, RESEARCH Pattern 5). Pure and import-free.
 * RED stub: the cases in lib/__tests__/photos-justify.test.ts drive it.
 */

export const ROW_H_PX = 280;
export const ROW_H_MD_PX = 224;
export const FILLER_GROW = 999999;

export type JustifiedTile = { flex: string; aspectRatio: string; aspect: number };

export function justifyTile(width: number, height: number): JustifiedTile {
  void width;
  void height;
  throw new Error('justifyTile: not implemented');
}

export function rowHeights(
  containerW: number,
  aspects: readonly number[],
  rowH: number,
  gap: number
): number[] {
  void containerW;
  void aspects;
  void rowH;
  void gap;
  throw new Error('rowHeights: not implemented');
}

export function flexLines(containerW: number, bases: readonly number[], gap: number): number[][] {
  void containerW;
  void bases;
  void gap;
  throw new Error('flexLines: not implemented');
}
