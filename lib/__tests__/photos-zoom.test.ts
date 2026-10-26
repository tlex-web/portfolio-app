/**
 * Zoom maths for the photo viewer (D-06; 10-UI-SPEC "Stage and photo", Zoom
 * row): fit and 1:1 of the 2560 px derivative. Entering by a click keeps the
 * clicked point under the pointer, entering by Z or the button centres the
 * photo, the arrow keys pan 80 px per press, and a drag only starts after
 * 4 px, so a click still unzooms. Every scroll is clamped to the zoomed image.
 */
import {
  DRAG_THRESHOLD,
  ZOOM_PAN_STEP,
  centreScroll,
  exceedsDragThreshold,
  panBy,
  zoomScrollFor,
} from '@/lib/photos/zoom';

/** The 1440 x 900 gutter tier: an 848 x 565 contain box, the 2560 x 1707 derivative, a 1440 x 788 stage. */
const fitted = { w: 848, h: 565 };
const zoomed = { w: 2560, h: 1707 };
const viewport = { w: 1440, h: 788 };

describe('constants', () => {
  it('pans 80 px per arrow press', () => {
    expect(ZOOM_PAN_STEP).toBe(80);
  });

  it('starts a drag after 4 px', () => {
    expect(DRAG_THRESHOLD).toBe(4);
  });
});

describe('centreScroll', () => {
  it('centres the zoomed photo in the stage', () => {
    expect(centreScroll(zoomed, viewport)).toEqual({ left: 560, top: 459.5 });
  });

  it('is 0 on an axis where the photo fits the stage', () => {
    expect(centreScroll({ w: 1200, h: 1707 }, viewport)).toEqual({ left: 0, top: 459.5 });
  });
});

describe('zoomScrollFor (the clicked point stays under the pointer)', () => {
  it('a click at the fitted centre with the pointer at the stage centre gives the centred scroll', () => {
    expect(
      zoomScrollFor({ x: 424, y: 282.5 }, fitted, zoomed, viewport, { x: 720, y: 394 })
    ).toEqual(centreScroll(zoomed, viewport));
  });

  it('a click at the fitted top-left corner clamps to the origin', () => {
    expect(zoomScrollFor({ x: 0, y: 0 }, fitted, zoomed, viewport, { x: 296, y: 111.5 })).toEqual({
      left: 0,
      top: 0,
    });
  });

  it('a click near the bottom-right corner clamps to the far edge', () => {
    expect(
      zoomScrollFor({ x: 846, y: 563 }, fitted, zoomed, viewport, { x: 1142, y: 674.5 })
    ).toEqual({ left: zoomed.w - viewport.w, top: zoomed.h - viewport.h });
  });

  it('keeps an off-centre point under the pointer', () => {
    // A quarter of the way in: 212 x (2560 / 848) = 640 px into the zoomed photo,
    // drawn under a pointer 400 px from the stage's left edge.
    const scroll = zoomScrollFor({ x: 212, y: 282.5 }, fitted, zoomed, viewport, {
      x: 400,
      y: 394,
    });
    expect(scroll.left).toBeCloseTo(240, 6);
    expect(scroll.top).toBeCloseTo(459.5, 6);
  });
});

describe('panBy (80 px per arrow press, clamped)', () => {
  it('ArrowRight moves 80 px to the right', () => {
    expect(panBy({ left: 100, top: 0 }, 'ArrowRight', zoomed, viewport)).toEqual({
      left: 180,
      top: 0,
    });
  });

  it('ArrowLeft clamps at 0', () => {
    expect(panBy({ left: 40, top: 10 }, 'ArrowLeft', zoomed, viewport)).toEqual({
      left: 0,
      top: 10,
    });
  });

  it('ArrowUp moves 80 px up', () => {
    expect(panBy({ left: 0, top: 200 }, 'ArrowUp', zoomed, viewport)).toEqual({
      left: 0,
      top: 120,
    });
  });

  it('ArrowDown clamps at the bottom edge', () => {
    expect(panBy({ left: 0, top: 900 }, 'ArrowDown', zoomed, viewport)).toEqual({
      left: 0,
      top: zoomed.h - viewport.h,
    });
  });
});

describe('exceedsDragThreshold (4 px)', () => {
  it('3 x 2 px is still a click', () => {
    expect(exceedsDragThreshold(3, 2)).toBe(false);
  });

  it('4 px along one axis is a drag', () => {
    expect(exceedsDragThreshold(4, 0)).toBe(true);
  });

  it('counts the diagonal in either direction', () => {
    expect(exceedsDragThreshold(-3, -3)).toBe(true);
  });
});
