/**
 * Moving between photos (LBOX-02; D-08 as amended at OQ1, Tim 2026-10-26:
 * previous/next writes the URL with history.replaceState on both surfaces;
 * 10-UI-SPEC "Moving between photos", OQ4: no wrap; "Stage and photo", Swipe).
 * The viewer reads its slug from the pathname, steps by index without wrapping
 * and turns a released swipe into a step only when it is long and horizontal.
 */
import {
  PHOTO_PATH,
  SWIPE_MIN_PX,
  SWIPE_RATIO,
  slugFromPath,
  stepIndex,
  swipeStep,
} from '@/lib/photos/stepping';

describe('slugFromPath', () => {
  it('reads the slug of a photo URL', () => {
    expect(slugFromPath('/photos/riffelsee-reflection')).toBe('riffelsee-reflection');
  });

  it('returns null for the gallery, nested paths and a missing pathname', () => {
    expect(slugFromPath('/photos')).toBeNull();
    expect(slugFromPath('/photos/')).toBeNull();
    expect(slugFromPath('/photos/a/b')).toBeNull();
    expect(slugFromPath('/')).toBeNull();
    expect(slugFromPath(null)).toBeNull();
  });

  it('matches exactly one segment after /photos/', () => {
    expect(PHOTO_PATH.test('/photos/gornerschlucht-waterfall')).toBe(true);
    expect(PHOTO_PATH.test('/photos/a?x=1')).toBe(false);
    expect(PHOTO_PATH.test('/en/photos/a')).toBe(false);
  });
});

describe('stepIndex (no wrap, UI-SPEC OQ4)', () => {
  it('returns null before the first photo and after the last', () => {
    expect(stepIndex(0, -1, 4)).toBeNull();
    expect(stepIndex(3, 1, 4)).toBeNull();
  });

  it('moves one place inside the range', () => {
    expect(stepIndex(1, 1, 4)).toBe(2);
    expect(stepIndex(1, -1, 4)).toBe(0);
    expect(stepIndex(2, 1, 4)).toBe(3);
  });
});

describe('swipeStep (48 px, 1.5 x the vertical travel)', () => {
  it('uses the UI-SPEC thresholds', () => {
    expect(SWIPE_MIN_PX).toBe(48);
    expect(SWIPE_RATIO).toBe(1.5);
  });

  it('a leftward swipe of at least 48 px steps to the next photo', () => {
    expect(swipeStep(-48, 32)).toBe(1);
    expect(swipeStep(-120, 10)).toBe(1);
  });

  it('a rightward swipe steps to the previous photo', () => {
    expect(swipeStep(60, 0)).toBe(-1);
  });

  it('a short swipe does nothing', () => {
    expect(swipeStep(-47, 0)).toBe(0);
    expect(swipeStep(0, 0)).toBe(0);
  });

  it('a swipe that is not 1.5 x more horizontal than vertical does nothing', () => {
    expect(swipeStep(-60, 41)).toBe(0);
    expect(swipeStep(60, 80)).toBe(0);
  });
});
