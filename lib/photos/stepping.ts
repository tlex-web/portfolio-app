/**
 * Moving between photos in the viewer (LBOX-02; 10-UI-SPEC "Moving between
 * photos" and "Stage and photo", Swipe row). Pure and import-free.
 *
 * - URL: previous/next writes '/photos/{slug}' with history.replaceState on
 *   both surfaces, the photo page and the lightbox (D-08 as amended at OQ1:
 *   Tim's answer "A: replaceState both (Recommended)", 2026-10-26). A router
 *   navigation would be intercepted on a directly loaded page, so the URL
 *   would name b while the page still shows a with a dialog on top
 *   (10-RESEARCH Pitfall 1), and in the lightbox it would remount the viewer
 *   on every step (Pitfall 2). Next keeps usePathname in sync with
 *   replaceState, so the viewer reads its slug with slugFromPath(usePathname())
 *   and never from the segment params, which keep the stale slug.
 * - Ends: no wrap (UI-SPEC OQ4). stepIndex returns null past either end and
 *   the control at that end is aria-disabled.
 * - Swipe: a released horizontal drag steps when it is at least SWIPE_MIN_PX
 *   long and SWIPE_RATIO times its vertical travel. A drag to the left
 *   (negative dx) shows the next photo.
 */

/** A photo URL: exactly one segment after /photos/, no query or hash. */
export const PHOTO_PATH = /^\/photos\/([^/?#]+)$/;

/** The shortest horizontal travel that counts as a swipe, in CSS px. */
export const SWIPE_MIN_PX = 48;

/** How much longer than its vertical travel a swipe's horizontal travel must be. */
export const SWIPE_RATIO = 1.5;

/** The photo slug a pathname names, or null when it is not a photo URL. */
export function slugFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = PHOTO_PATH.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/** The neighbouring index in a list of n photos, or null past either end (no wrap). */
export function stepIndex(index: number, dir: -1 | 1, n: number): number | null {
  const next = index + dir;
  return next >= 0 && next < n ? next : null;
}

/** The step a released swipe asks for: +1 next, -1 previous, 0 none. */
export function swipeStep(dx: number, dy: number): -1 | 0 | 1 {
  const ax = Math.abs(dx);
  if (ax < SWIPE_MIN_PX || ax < SWIPE_RATIO * Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}
