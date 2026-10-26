/**
 * Zoom maths for the photo viewer (D-06). RED stub: neutral values so the
 * suite loads; the implementation follows.
 */

type Size = { w: number; h: number };
type Point = { x: number; y: number };
type Scroll = { left: number; top: number };
type PanKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown';

export const ZOOM_PAN_STEP = 0;
export const DRAG_THRESHOLD = 0;

export function zoomScrollFor(
  _point: Point,
  _fitted: Size,
  _zoomed: Size,
  _viewport: Size,
  _pointerInViewport: Point
): Scroll {
  return { left: -1, top: -1 };
}

export function centreScroll(_zoomed: Size, _viewport: Size): Scroll {
  return { left: -1, top: -1 };
}

export function panBy(scroll: Scroll, _key: PanKey, _zoomed: Size, _viewport: Size): Scroll {
  return { left: scroll.left - 1, top: scroll.top - 1 };
}

export function exceedsDragThreshold(_dx: number, _dy: number): boolean {
  return false;
}
