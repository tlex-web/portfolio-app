'use client';

import { ViewTransition, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CaretLeftIcon,
  CaretRightIcon,
  XIcon,
} from '@phosphor-icons/react/dist/ssr';
import ExifStrip from '@/components/photos/ExifStrip';
import { useLightbox } from '@/components/photos/LightboxDialog';
import StagePhoto from '@/components/photos/StagePhoto';
import { site } from '@/data/site';
import { slugFromPath, stepIndex, swipeStep } from '@/lib/photos/stepping';
import type { PhotoView } from '@/lib/photos/view-model';

/**
 * The one photo viewer for both surfaces (D-05, D-08; LBOX-01, LBOX-04,
 * LBOX-07; 10-UI-SPEC "Photo Viewer"): `page` is the full photo page inside
 * the shell (title as h1, "All photographs" leading link), `modal` the
 * lightbox inside the dialog (title as h2#photo-title, used from 10-05).
 *
 * Layout tiers (10-UI-SPEC "Layout tiers"; the lb-* variants in
 * app/globals.css, mirrored in lib/photos/lightbox-tiers.ts):
 * - lb-scroll (below 768 px wide or 640 px tall): the surface scrolls as one
 *   column. On the page the "All photographs" link takes its own row, then the
 *   chrome bar, sticky under the nav; the photo at full width and true ratio,
 *   capped at 70svh; the strip in one column.
 * - lb-key (768 to below 1280 px, at least 640 px tall): the page viewer fills
 *   calc(100svh - nav): the 56 px chrome bar (the link first in its left
 *   group), the stage (flex-1, a size container) and the strip in two columns.
 * - lb-gutter (from 1280 px, at least 640 px tall): as key, and the stage
 *   reserves a 216 px gutter on each side (px-54) for the hotspot callouts,
 *   whether or not labels show, so the photo never resizes on toggle.
 *
 * The photo box is the largest box at the photo's ratio inside the stage
 * (`--ar` = w / h; width min(100cqw, 100cqh * ar)), drawn object-fit: contain,
 * never cropped, on gallery black, never tinted by the map palette. StagePhoto
 * fills it: the opener derivative first, the large one on top once loaded,
 * and the slow-load and load-error states with Retry (10-UI-SPEC E5). The server
 * HTML already holds the layout, the title and the strip before the photo
 * decodes. Below the stage, ExifStrip carries the title, place and date,
 * story, EXIF, position and the rights line (D-05). Only the content-hashed
 * manifest derivatives (AVIF and WebP at 1024, 1600 and 2560 px) are
 * referenced: no original, no download control and no right-click or drag
 * blocking (LBOX-07, T-10-03).
 *
 * The surface comes from the variant and, for the modal, from useLightbox():
 * inside the LightboxDialog the viewer fills the dialog (h-full on key and
 * gutter, so the size-container stage has a height), the chrome is sticky at
 * the dialog's top on the scroll tier, and Close is the last control of the
 * chrome's right group (accessible name 'Close photo', visible text 'Close'
 * from 768 px), closing through router.back() (LBOX-01).
 *
 * Escape (D-08; 10-UI-SPEC "Focus", Escape layers): in the modal the dialog
 * owns the key and runs the layers registered through useLightbox()
 * .registerEscape, closing last. On the page a document keydown listener does
 * the same job: a layer that consumes Escape calls preventDefault, and when
 * none has, Escape navigates to /photos, never a blind browser Back, because
 * a directly loaded page may have no gallery behind it.
 *
 * Moving between photos (LBOX-02; 10-UI-SPEC "Moving between photos"): the
 * chrome's left group holds 'Previous photo', the counter 'n / 4' (mono,
 * aria-hidden; the status line says it in words) and 'Next photo'. The
 * buttons, the ← and → keys and a horizontal swipe on the fitted photo move
 * through the canonical order without wrapping (UI-SPEC OQ4): at either end
 * the control is aria-disabled, stays focusable and does nothing. A step
 * writes '/photos/{slug}' with history.replaceState on both surfaces (D-08 as
 * amended at OQ1, Tim's answer "A: replaceState both (Recommended)",
 * 2026-10-26), so no history entry is added, the page is never intercepted
 * into a dialog (10-RESEARCH Pitfall 1) and the viewer is never remounted
 * (Pitfall 2): focus stays on the pressed control and the dialog stays open.
 * The slug shown starts from slugFromPath(usePathname()) (Next keeps the
 * pathname in sync with replaceState; the segment params keep the stale slug)
 * and is then owned by the viewer: every real navigation to another photo
 * remounts it, and the steps themselves are the only other change. A step
 * reads the last slug it wrote from a ref, not from the rendered props: while
 * a view transition runs (the open morph) React holds commits back, and a
 * second click in that window would otherwise replay the first step. Each step updates
 * a polite status line inside the viewer ('Photo 2 of 4: {title}') and the
 * document title. Once the current photo's large derivative loads, the
 * neighbours' stage derivatives are fetched at low priority, once per slug.
 *
 * Open morph (LBOX-06; UI-SPEC "Open and close motion"): the photo box is
 * the lightbox half of the photo-{slug} pair (the morph share class, default none;
 * TileTransition is the grid half, named only while no photo is open). The
 * name follows the shown photo (the boundary is keyed by slug), so after
 * steps the box carries the current slug; a step forms no pair, because the
 * grid has no names then. The name is dropped as soon as the pathname stops
 * naming a photo, so it is never mounted twice (Pitfall 6).
 * Close is instant (popstate starts no view transition).
 *
 * Hide labels and Zoom go before Close in data-chrome-right (10-10, 10-11).
 */

/** The stage `sizes`: the gutter tier takes 2 x 216 px from the viewport width. */
const STAGE_SIZES = '(min-width: 1280px) calc(100vw - 432px), 100vw';

const BACK_LINK =
  'min-h-11 items-center gap-2 text-base font-semibold text-ink-muted hover:text-ink';

/**
 * The chrome bar buttons (10-UI-SPEC "Chrome bar", Interaction States):
 * icon-only below 768 px, icon + text from 768 px; cursor-pointer and
 * touch-action: manipulation on every button.
 */
const CHROME_BUTTON =
  'inline-flex min-h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-sm border border-line-strong text-ink hover:border-ink-muted md:px-4';

/** The ‹ › buttons: icon-only at every width; at an end aria-disabled, dimmed and inert to hover. */
const STEP_BUTTON =
  'inline-flex min-h-11 min-w-11 cursor-pointer touch-manipulation items-center justify-center rounded-sm border border-line-strong text-ink hover:border-ink-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:border-line-strong';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** True when a key press belongs to a text field, where the arrows move the caret. */
function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  );
}

/** Fetch a photo's stage derivative at low priority, so a step finds it in the cache. */
function preloadStage(view: PhotoView): void {
  const img = new Image();
  img.fetchPriority = 'low';
  img.decoding = 'async';
  img.sizes = STAGE_SIZES;
  img.srcset = view.stage.srcSetAvif;
  img.src = view.stage.src;
}

type Swipe = { id: number; x: number; y: number; follow: boolean };

export default function PhotoViewer({
  variant,
  photos,
  initialSlug,
}: {
  variant: 'page' | 'modal';
  photos: readonly PhotoView[];
  initialSlug: string;
}) {
  if (!photos.some((p) => p.slug === initialSlug)) {
    throw new RangeError(`PhotoViewer: no photo with slug ${initialSlug}`);
  }
  const isPage = variant === 'page';
  const lightbox = useLightbox();
  const router = useRouter();
  const pathname = usePathname();

  // The photo shown, seeded from the pathname (it names this photo on mount).
  // While the route leaves (close, Escape on the page) the pathname no longer
  // names a photo, and the viewer keeps showing the last one until it unmounts.
  const [shownSlug, setShownSlug] = useState(() => {
    const fromPath = slugFromPath(pathname);
    return fromPath && photos.some((p) => p.slug === fromPath) ? fromPath : initialSlug;
  });
  const lastWritten = useRef(shownSlug);
  const index = photos.findIndex((p) => p.slug === shownSlug);
  const current = photos[index];
  const { aspect, prevSlug, nextSlug } = current;
  const [announcement, setAnnouncement] = useState('');

  // One step: the target is the neighbour in the committed view-model's
  // canonical order (T-10-14), never input; past either end nothing happens
  // (no wrap); the URL is replaced, never pushed.
  const step = useCallback(
    (dir: -1 | 1) => {
      const from = photos.findIndex((p) => p.slug === lastWritten.current);
      const to = stepIndex(from, dir, photos.length);
      if (from < 0 || to === null) return;
      const { slug, title } = photos[to];
      lastWritten.current = slug;
      window.history.replaceState(null, '', `/photos/${slug}`);
      setShownSlug(slug);
      setAnnouncement(`Photo ${to + 1} of ${photos.length}: ${title}`);
    },
    [photos]
  );

  // The document title follows the shown photo (the metadata only sets it on load).
  useEffect(() => {
    document.title = `${current.title} · ${site.name}`;
  }, [current.title]);

  // Page surface only: Escape is the last layer and goes to the gallery (D-08).
  useEffect(() => {
    if (!isPage) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      router.push('/photos');
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPage, router]);

  // ← and → step on both surfaces (the page behind a modal dialog is inert, so
  // only the lightbox's viewer is reachable then). A layer that uses the
  // arrows itself (10-10 zoomed pan) calls preventDefault first; modified
  // presses are left alone (Alt+← is the browser's Back). A layout effect, so
  // the keys work during the open morph: React runs passive effects only once
  // the view transition has finished.
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.shiftKey || isEditable(event.target)) return;
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [step]);

  // Neighbour preload, once per slug, after the current photo's large layer loads.
  const preloaded = useRef(new Set<string>());
  const preloadNeighbours = useCallback(() => {
    for (const slug of [prevSlug, nextSlug]) {
      if (!slug || preloaded.current.has(slug)) continue;
      const view = photos.find((p) => p.slug === slug);
      if (!view) continue;
      preloaded.current.add(slug);
      preloadStage(view);
    }
  }, [photos, prevSlug, nextSlug]);

  // Swipe on the fitted photo (touch or pen): the box follows the finger, and
  // on release a long horizontal drag steps; anything else springs back over
  // --duration-fast. Under reduced motion the box does not follow and nothing
  // springs. Vertical drags stay with the browser (touch-action: pan-y
  // pinch-zoom), which cancels the pointer when it scrolls.
  const boxRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<Swipe | null>(null);

  function setOffset(dx: number, animate: boolean) {
    const box = boxRef.current;
    if (!box) return;
    box.style.transition = animate ? 'translate var(--duration-fast) var(--ease-erosion)' : 'none';
    box.style.translate = dx === 0 ? '' : `${dx}px 0`;
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    if (!event.isPrimary) return;
    swipe.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      follow: !window.matchMedia(REDUCED_MOTION).matches,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // An inactive pointer (a synthetic event) cannot be captured; the swipe still works.
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    if (!start || start.id !== event.pointerId || !start.follow) return;
    setOffset(event.clientX - start.x, false);
  }

  function endSwipe(event: ReactPointerEvent<HTMLDivElement>, released: boolean) {
    const start = swipe.current;
    if (!start || start.id !== event.pointerId) return;
    swipe.current = null;
    const dir = released ? swipeStep(event.clientX - start.x, event.clientY - start.y) : 0;
    const target = dir === 1 ? nextSlug : dir === -1 ? prevSlug : null;
    if (dir !== 0 && target) {
      setOffset(0, false);
      step(dir);
    } else {
      setOffset(0, start.follow);
    }
  }

  // The lightbox half of the open morph. Named only while the pathname names a
  // photo (the complement of TileTransition's condition, read from the same
  // pathname in the same commit), so on close the viewer drops its name before
  // the grid tiles take theirs, and the copy Next keeps in a hidden Activity
  // for Forward carries none. Keyed by slug: a step unmounts the old name and
  // mounts the new one, because React tracks names per boundary at mount and
  // a renamed boundary would leave the old name registered.
  const named = slugFromPath(pathname) !== null;
  const boxStyle = {
    aspectRatio: `${aspect.w} / ${aspect.h}`,
    '--ar': aspect.w / aspect.h,
  } as CSSProperties;

  const box = (
    <div
      ref={boxRef}
      data-photo-box=""
      className="mx-auto bg-gallery [touch-action:pan-y_pinch-zoom] lb-scroll:w-[min(100%,calc(70svh*var(--ar)))] lb-key:w-[min(100cqw,calc(100cqh*var(--ar)))] lb-gutter:w-[min(100cqw,calc(100cqh*var(--ar)))]"
      style={boxStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => endSwipe(event, true)}
      onPointerCancel={(event) => endSwipe(event, false)}
    >
      <StagePhoto view={current} sizes={STAGE_SIZES} onLargeLoad={preloadNeighbours} />
    </div>
  );
  const photoBox = named ? (
    <ViewTransition key={current.slug} name={`photo-${current.slug}`} share="morph" default="none">
      {box}
    </ViewTransition>
  ) : (
    box
  );

  return (
    <div
      data-photo-viewer=""
      className={
        isPage
          ? 'flex flex-col bg-gallery text-ink lb-key:h-[calc(100svh-var(--nav-h))] lb-gutter:h-[calc(100svh-var(--nav-h))]'
          : 'flex flex-col bg-gallery text-ink lb-key:h-full lb-gutter:h-full'
      }
    >
      {isPage && (
        <div data-viewer-back="" className="px-4 pt-2 lb-key:hidden lb-gutter:hidden">
          <Link href="/photos" className={`inline-flex ${BACK_LINK}`}>
            <ArrowLeftIcon size={20} aria-hidden="true" />
            All photographs
          </Link>
        </div>
      )}
      <div
        data-viewer-chrome=""
        className={
          isPage
            ? 'flex h-14 shrink-0 items-center justify-between gap-2 bg-gallery px-4 lb-scroll:sticky lb-scroll:top-(--nav-h)'
            : 'flex h-14 shrink-0 items-center justify-between gap-2 bg-gallery px-4 lb-scroll:sticky lb-scroll:top-0'
        }
      >
        <div data-chrome-left="" className="flex items-center gap-2">
          {isPage && (
            <Link
              href="/photos"
              className={`hidden lb-key:inline-flex lb-gutter:inline-flex ${BACK_LINK}`}
            >
              <ArrowLeftIcon size={20} aria-hidden="true" />
              All photographs
            </Link>
          )}
          <button
            type="button"
            aria-label="Previous photo"
            aria-disabled={prevSlug ? undefined : 'true'}
            className={STEP_BUTTON}
            onClick={() => step(-1)}
          >
            <CaretLeftIcon size={24} aria-hidden="true" />
          </button>
          <span
            data-photo-counter=""
            aria-hidden="true"
            className="font-mono text-sm text-ink-muted tabular-nums"
          >
            {index + 1} / {photos.length}
          </span>
          <button
            type="button"
            aria-label="Next photo"
            aria-disabled={nextSlug ? undefined : 'true'}
            className={STEP_BUTTON}
            onClick={() => step(1)}
          >
            <CaretRightIcon size={24} aria-hidden="true" />
          </button>
        </div>
        <div data-chrome-right="" className="flex items-center gap-2">
          {lightbox && (
            <button
              type="button"
              aria-label="Close photo"
              className={CHROME_BUTTON}
              onClick={lightbox.close}
            >
              <XIcon size={24} aria-hidden="true" />
              <span className="hidden md:inline">Close</span>
            </button>
          )}
        </div>
      </div>
      <div
        data-viewer-stage=""
        className="lb-key:flex lb-key:min-h-0 lb-key:flex-1 lb-key:items-center lb-key:justify-center lb-key:[container-type:size] lb-gutter:flex lb-gutter:min-h-0 lb-gutter:flex-1 lb-gutter:items-center lb-gutter:justify-center lb-gutter:px-54 lb-gutter:[container-type:size]"
      >
        {photoBox}
      </div>
      <ExifStrip view={current} headingLevel={isPage ? 1 : 2} />
      <p role="status" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
