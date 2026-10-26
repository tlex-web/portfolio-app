/**
 * Zoom maths for the photo viewer (D-06; 10-UI-SPEC "Stage and photo", Zoom
 * row; 10-RESEARCH "Don't Hand-Roll", Pan while zoomed). Pure and
 * import-free: no DOM access here, ZoomStage measures and applies.
 *
 * Zoom toggles between fit and 1:1 of the 2560 px derivative: zoomed, the
 * photo is drawn at its own pixel size inside the stage, which scrolls
 * natively (`overflow: auto`), so panning is only ever a scroll position.
 * There is no transform matrix and no gesture maths, and native pinch-zoom
 * keeps working.
 *
 * - Entering by a click keeps the clicked point under the pointer
 *   (zoomScrollFor); entering by Z or the button centres the photo
 *   (centreScroll).
 * - The arrow keys pan ZOOM_PAN_STEP px per press (panBy).
 * - A drag only starts after DRAG_THRESHOLD px, so a click still unzooms
 *   (exceedsDragThreshold).
 *
 * Every scroll is clamped to the zoomed photo: 0 up to the zoomed size less
 * the stage's viewport, and 0 on an axis where the photo fits the stage.
 */

/** A width and a height in CSS px. */
export type Size = { w: number; h: number };
/** A point in CSS px. */
export type Point = { x: number; y: number };
/** A scroll position (scrollLeft, scrollTop) in CSS px. */
export type Scroll = { left: number; top: number };
/** The keys that pan while zoomed. */
export type PanKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown';

/** How far one arrow press pans, in CSS px. */
export const ZOOM_PAN_STEP = 80;

/** How far a pointer must travel before a press becomes a drag, in CSS px. */
export const DRAG_THRESHOLD = 4;

function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, 0), Math.max(max, 0));
}

function clampScroll(scroll: Scroll, zoomed: Size, viewport: Size): Scroll {
  return {
    left: clamp(scroll.left, zoomed.w - viewport.w),
    top: clamp(scroll.top, zoomed.h - viewport.h),
  };
}

/**
 * The scroll that keeps a clicked point under the pointer once zoomed.
 * `point` is the click inside the fitted photo (from its top-left corner),
 * `fitted` the fitted photo's size, `zoomed` the 1:1 size, `viewport` the
 * stage's scroll viewport and `pointerInViewport` where the pointer sits in
 * that viewport.
 */
export function zoomScrollFor(
  point: Point,
  fitted: Size,
  zoomed: Size,
  viewport: Size,
  pointerInViewport: Point
): Scroll {
  const x = fitted.w > 0 ? (point.x * zoomed.w) / fitted.w : 0;
  const y = fitted.h > 0 ? (point.y * zoomed.h) / fitted.h : 0;
  return clampScroll(
    { left: x - pointerInViewport.x, top: y - pointerInViewport.y },
    zoomed,
    viewport
  );
}

/** The scroll that centres the zoomed photo in the stage's viewport. */
export function centreScroll(zoomed: Size, viewport: Size): Scroll {
  return clampScroll(
    { left: (zoomed.w - viewport.w) / 2, top: (zoomed.h - viewport.h) / 2 },
    zoomed,
    viewport
  );
}

/** The scroll after one arrow press: ZOOM_PAN_STEP px in the key's direction, clamped. */
export function panBy(scroll: Scroll, key: PanKey, zoomed: Size, viewport: Size): Scroll {
  const dx = key === 'ArrowLeft' ? -ZOOM_PAN_STEP : key === 'ArrowRight' ? ZOOM_PAN_STEP : 0;
  const dy = key === 'ArrowUp' ? -ZOOM_PAN_STEP : key === 'ArrowDown' ? ZOOM_PAN_STEP : 0;
  return clampScroll({ left: scroll.left + dx, top: scroll.top + dy }, zoomed, viewport);
}

/** True once a pointer has travelled DRAG_THRESHOLD px or more from where it went down. */
export function exceedsDragThreshold(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) >= DRAG_THRESHOLD;
}
