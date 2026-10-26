'use client';

import { useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useLightbox } from '@/components/photos/LightboxDialog';
import {
  centreScroll,
  exceedsDragThreshold,
  panBy,
  zoomScrollFor,
  type PanKey,
  type Point,
  type Size,
} from '@/lib/photos/zoom';
import type { PhotoView } from '@/lib/photos/view-model';

/**
 * The viewer stage with its zoom (D-06, LBOX-02, LBOX-03; 10-UI-SPEC "Stage
 * and photo", Zoom and Click / tap rows, "Focus", Escape layers; 10-RESEARCH
 * "Don't Hand-Roll", Pan while zoomed). It renders `[data-viewer-stage]`
 * itself, because zoomed the stage is the scroll box.
 *
 * - Fitted: the children (the photo box with StagePhoto, contain-fit) as
 *   before, `cursor: zoom-in` on the photo and `touch-action: pan-y
 *   pinch-zoom` on the stage. A press on the photo that ends without passing
 *   the drag threshold zooms in at that point (a swipe travels further and
 *   stays a swipe). Buttons inside the photo (Retry) are not zoom targets.
 * - Zoomed: the stage becomes `overflow: auto` over its full area (the
 *   gutters' padding is dropped) and shows the 2560 px derivative at 1:1
 *   (`<picture>` with only the 2560 AVIF and WebP, the img at its own width
 *   and height, editorial alt). The 1024 opener the box already loaded is
 *   drawn under it, stretched, until the 2560 one paints. Entering by a click
 *   keeps the clicked point under the pointer (zoomScrollFor); entering by Z
 *   or the button centres the photo (centreScroll). `cursor: grab`
 *   (`grabbing` while dragging), `touch-action: pan-x pan-y pinch-zoom`. A
 *   mouse drag pans once it passes DRAG_THRESHOLD (pointer capture), a press
 *   that does not pass it unzooms; touch pans natively and a tap unzooms. A
 *   press on the stage's own scrollbars is neither. The children stay
 *   mounted (hidden), so unzooming shows the loaded photo at once.
 * - Keys: while zoomed, ← → ↑ ↓ pan ZOOM_PAN_STEP px (panBy). The listener is
 *   on `document` in the capture phase, so it runs before PhotoViewer's
 *   stepping listener and its preventDefault turns the step off. It registers
 *   in a layout effect, as the stepping listener does, because React runs
 *   passive effects only after a view transition.
 * - Escape layer (LBOX-03): zoomed, Escape leaves zoom and nothing else. In
 *   the lightbox it is a layer registered through useLightbox().registerEscape
 *   (the dialog closes only when no layer consumes the press); on the page the
 *   capture listener calls preventDefault, and PhotoViewer's page handler
 *   skips a prevented Escape instead of going to /photos.
 * - Motion: none. Zoom in and out are instant with and without reduced motion
 *   (no transform; a scale animation would need one on an overflow box).
 *
 * Native pinch-zoom is never blocked: both touch-action values keep
 * pinch-zoom (T-10-22), and every gesture has a key and a button. The one
 * thing turned off is the browser's image drag-and-drop on the zoomed photo,
 * because there a drag is the pan (UI-SPEC); right-click and saving are
 * untouched, fitted and zoomed (LBOX-07).
 */

/** The fitted stage, unchanged from 10-03 apart from the touch-action. */
const FITTED_STAGE =
  '[touch-action:pan-y_pinch-zoom] lb-key:flex lb-key:min-h-0 lb-key:flex-1 lb-key:items-center lb-key:justify-center lb-key:[container-type:size] lb-gutter:flex lb-gutter:min-h-0 lb-gutter:flex-1 lb-gutter:items-center lb-gutter:justify-center lb-gutter:px-54 lb-gutter:[container-type:size]';

/**
 * The zoomed stage: a scroll box over the stage's full area. On the key and
 * gutter tiers it keeps the stage's flex share; on the scroll tier it keeps
 * the fitted photo's height (width / ratio, capped at 70svh), so the page
 * below does not move. The photo is centred with auto margins, which fall
 * back to the start edge when it overflows, so every part stays reachable.
 */
const ZOOMED_STAGE =
  'flex select-none overflow-auto overscroll-contain bg-gallery [touch-action:pan-x_pan-y_pinch-zoom] lb-scroll:aspect-(--ar) lb-scroll:max-h-[70svh] lb-key:min-h-0 lb-key:flex-1 lb-gutter:min-h-0 lb-gutter:flex-1';

const PAN_KEYS: ReadonlySet<string> = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

/** The candidate with the widest descriptor in a `url Nw, …` srcset (the 2560 px derivative). */
function largest(srcSet: string): string {
  let best = '';
  let bestW = -1;
  for (const candidate of srcSet.split(',')) {
    const [url, descriptor = ''] = candidate.trim().split(/\s+/);
    const w = Number.parseInt(descriptor, 10);
    if (url && Number.isFinite(w) && w > bestW) {
      best = url;
      bestW = w;
    }
  }
  return best;
}

/** True when a key press belongs to a text field, where the arrows move the caret. */
function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  );
}

type Press = {
  id: number;
  x: number;
  y: number;
  left: number;
  top: number;
  mouse: boolean;
  dragging: boolean;
};

/** Where a click zoomed in: the point in the fitted photo, its size and the pointer in the stage. */
type Anchor = { point: Point; fitted: Size; pointer: Point };

export default function ZoomStage({
  view,
  zoomed,
  onZoomChange,
  children,
}: {
  view: PhotoView;
  zoomed: boolean;
  onZoomChange(z: boolean, at?: { x: number; y: number }): void;
  children: ReactNode;
}) {
  const { stage, alt, aspect, openerSrc } = view;
  const lightbox = useLightbox();
  const stageRef = useRef<HTMLDivElement>(null);
  const fittedPress = useRef<{ id: number; x: number; y: number } | null>(null);
  const zoomPress = useRef<Press | null>(null);
  const anchor = useRef<Anchor | null>(null);
  const [dragging, setDragging] = useState(false);

  // Zoomed in: place the 1:1 photo, before the first zoomed paint. Its size
  // comes from the img's width and height, so this does not wait for it to load.
  useLayoutEffect(() => {
    const el = stageRef.current;
    const from = anchor.current;
    anchor.current = null;
    if (!zoomed || !el) return;
    const size = { w: stage.width, h: stage.height };
    const viewport = { w: el.clientWidth, h: el.clientHeight };
    const scroll = from
      ? zoomScrollFor(from.point, from.fitted, size, viewport, from.pointer)
      : centreScroll(size, viewport);
    el.scrollTo({ left: scroll.left, top: scroll.top, behavior: 'instant' });
  }, [zoomed, stage.width, stage.height]);

  // The Escape layer and the arrow-key pan (see the header).
  const leaveZoom = useEffectEvent((): boolean => {
    if (!zoomed) return false;
    onZoomChange(false);
    return true;
  });

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!zoomed || event.defaultPrevented) return;
    if (event.key === 'Escape') {
      // In the lightbox the dialog runs its registered layers instead.
      if (lightbox) return;
      event.preventDefault();
      onZoomChange(false);
      return;
    }
    if (!PAN_KEYS.has(event.key)) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (isEditable(event.target)) return;
    const el = stageRef.current;
    if (!el) return;
    event.preventDefault();
    const next = panBy(
      { left: el.scrollLeft, top: el.scrollTop },
      event.key as PanKey,
      { w: el.scrollWidth, h: el.scrollHeight },
      { w: el.clientWidth, h: el.clientHeight }
    );
    el.scrollTo({ left: next.left, top: next.top, behavior: 'instant' });
  });

  useLayoutEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    document.addEventListener('keydown', listener, true);
    return () => document.removeEventListener('keydown', listener, true);
  }, []);

  useLayoutEffect(() => lightbox?.registerEscape(() => leaveZoom()), [lightbox]);

  // Fitted: a press on the photo that stays within the threshold zooms in
  // there. "On the photo" is the photo box's rectangle, not the event target:
  // while the open morph runs, Chromium hit-tests the stage instead of the
  // named photo box.
  function onFittedPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (zoomed || !event.isPrimary) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('button, a')) return;
    const box = stageRef.current?.querySelector<HTMLElement>('[data-photo-box]');
    if (!box) return;
    const r = box.getBoundingClientRect();
    const { clientX: x, clientY: y } = event;
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
    fittedPress.current = { id: event.pointerId, x, y };
  }

  function onFittedPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = fittedPress.current;
    if (!start || start.id !== event.pointerId) return;
    fittedPress.current = null;
    if (exceedsDragThreshold(event.clientX - start.x, event.clientY - start.y)) return;
    const el = stageRef.current;
    const box = el?.querySelector<HTMLElement>('[data-photo-box]');
    if (el && box) {
      const fitted = box.getBoundingClientRect();
      const frame = el.getBoundingClientRect();
      anchor.current = {
        point: { x: event.clientX - fitted.left, y: event.clientY - fitted.top },
        fitted: { w: fitted.width, h: fitted.height },
        pointer: { x: event.clientX - frame.left, y: event.clientY - frame.top },
      };
    }
    onZoomChange(true, { x: event.clientX, y: event.clientY });
  }

  // Zoomed: drag pans past the threshold, a press that does not pass it unzooms.
  function onStagePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const el = stageRef.current;
    if (!zoomed) {
      onFittedPointerDown(event);
      return;
    }
    if (!el || !event.isPrimary) return;
    const mouse = event.pointerType === 'mouse';
    if (mouse && event.button !== 0) return;
    // A press on the stage's own scrollbars scrolls; it is not a zoom target.
    const frame = el.getBoundingClientRect();
    if (event.clientX - frame.left >= el.clientWidth) return;
    if (event.clientY - frame.top >= el.clientHeight) return;
    zoomPress.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: el.scrollLeft,
      top: el.scrollTop,
      mouse,
      dragging: false,
    };
    if (mouse) {
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // An inactive pointer cannot be captured; the pan still follows moves over the stage.
      }
    }
  }

  function onStagePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const press = zoomPress.current;
    const el = stageRef.current;
    if (!press || press.id !== event.pointerId || !press.mouse || !el) return;
    const dx = event.clientX - press.x;
    const dy = event.clientY - press.y;
    if (!press.dragging) {
      if (!exceedsDragThreshold(dx, dy)) return;
      press.dragging = true;
      setDragging(true);
    }
    el.scrollTo({ left: press.left - dx, top: press.top - dy, behavior: 'instant' });
  }

  function onStagePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!zoomed) {
      onFittedPointerUp(event);
      return;
    }
    const press = zoomPress.current;
    if (!press || press.id !== event.pointerId) return;
    zoomPress.current = null;
    setDragging(false);
    if (press.dragging) return;
    if (exceedsDragThreshold(event.clientX - press.x, event.clientY - press.y)) return;
    onZoomChange(false);
  }

  function onStagePointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    if (fittedPress.current?.id === event.pointerId) fittedPress.current = null;
    if (zoomPress.current?.id !== event.pointerId) return;
    zoomPress.current = null;
    setDragging(false);
  }

  const stageStyle = { '--ar': aspect.w / aspect.h } as CSSProperties;

  return (
    <div
      ref={stageRef}
      data-viewer-stage=""
      data-zoomed={zoomed ? '' : undefined}
      className={
        zoomed ? `${ZOOMED_STAGE} ${dragging ? 'cursor-grabbing' : 'cursor-grab'}` : FITTED_STAGE
      }
      style={stageStyle}
      onPointerDown={onStagePointerDown}
      onPointerMove={onStagePointerMove}
      onPointerUp={onStagePointerUp}
      onPointerCancel={onStagePointerCancel}
    >
      <div className={zoomed ? 'hidden' : 'contents cursor-zoom-in'}>{children}</div>
      {zoomed && (
        <picture
          data-zoom-photo=""
          className="m-auto block shrink-0"
          onDragStart={(event) => event.preventDefault()}
        >
          <source type="image/avif" srcSet={largest(stage.srcSetAvif)} />
          <source type="image/webp" srcSet={largest(stage.srcSetWebp)} />
          {/* A raw img inside picture (exempt from @next/next/no-img-element): the content-hashed 2560 px manifest derivative at 1:1. */}
          <img
            src={largest(stage.srcSetWebp)}
            width={stage.width}
            height={stage.height}
            alt={alt}
            decoding="async"
            className="block h-auto max-w-none bg-size-[100%_100%] bg-no-repeat"
            style={{ backgroundImage: `url("${openerSrc}")` }}
          />
        </picture>
      )}
    </div>
  );
}
