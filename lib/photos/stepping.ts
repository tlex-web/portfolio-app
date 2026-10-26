/** RED stub (10-06 Task 2): the real stepping helpers land in the GREEN commit. */

export const PHOTO_PATH = /^\/photos\/([^/?#]+)$/;
export const SWIPE_MIN_PX = 0;
export const SWIPE_RATIO = 0;

export function slugFromPath(pathname: string | null): string | null {
  void pathname;
  return null;
}

export function stepIndex(index: number, dir: -1 | 1, n: number): number | null {
  void index;
  void dir;
  void n;
  return null;
}

export function swipeStep(dx: number, dy: number): -1 | 0 | 1 {
  void dx;
  void dy;
  return 0;
}
