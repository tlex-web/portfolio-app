'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowClockwiseIcon } from '@phosphor-icons/react/dist/ssr';
import type { PhotoView } from '@/lib/photos/view-model';

/**
 * The photo on the viewer stage (LBOX-04, LBOX-07; D-05; 10-UI-SPEC "Stage
 * and photo": Image, Slow load and Load error rows; RESEARCH Pitfall 4). It
 * fills the photo box, which already holds the photo's ratio, so the layout
 * never moves whatever the network does.
 *
 * Two layers share one grid cell (grid stacking rather than absolute
 * positioning, so nothing here stacks above the sticky chrome on the scroll
 * tier), both object-fit: contain:
 * - underneath, the opener: the 1024 WebP the thumbnail already loaded, so the
 *   box is never empty at first paint and the morph pair always meets a photo
 *   (Pitfall 4);
 * - on top, the large picture: AVIF then WebP 1024/1600/2560 by `sizes`. An
 *   unloaded img paints nothing, so the opener shows through until the large
 *   one paints. No fade and no CSS filter on either layer.
 *
 * data-state: 'opener' until the large img loads, then 'large'; 'error' when
 * the large img fails, which hides both layers and shows "Couldn't load this
 * photo." and a Retry button (its accessible name says what it retries) that
 * remounts the large layer (a retry counter in its key) to request the same
 * hashed derivative again. If neither layer has loaded after 1 s, a centred
 * "Loading photo" shows until one does (no spinner, no animation). Load
 * events that fire before hydration are caught by reading `complete` on
 * mount. The state resets when the photo (view.slug) changes.
 *
 * The error state, like every other, renders no download control and no link
 * to an image file (LBOX-07, T-10-09); the chrome and the strip stay usable.
 */

type StageState = 'opener' | 'large' | 'error';

const SLOW_MS = 1000;

/** True when an img has finished loading a decodable image. */
function loaded(img: HTMLImageElement | null): boolean {
  return !!img && img.complete && img.naturalWidth > 0;
}

/** True when an img has finished and failed (complete, nothing decoded). */
function failed(img: HTMLImageElement | null): boolean {
  return !!img && img.complete && img.naturalWidth === 0;
}

export default function StagePhoto({ view, sizes }: { view: PhotoView; sizes: string }) {
  const { slug, stage, alt, openerSrc } = view;
  const [state, setState] = useState<StageState>('opener');
  const [openerLoaded, setOpenerLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [shownSlug, setShownSlug] = useState(slug);
  const largeRef = useRef<HTMLImageElement>(null);
  const openerRef = useRef<HTMLImageElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // A new photo starts over (React's "adjust state while rendering" pattern).
  if (shownSlug !== slug) {
    setShownSlug(slug);
    setState('opener');
    setOpenerLoaded(false);
    setSlow(false);
  }

  // Events that fired before hydration are lost; read the result instead.
  useEffect(() => {
    if (loaded(openerRef.current)) setOpenerLoaded(true);
    const large = largeRef.current;
    if (loaded(large)) setState('large');
    else if (failed(large)) setState('error');
  }, [slug, attempt]);

  // After 1 s with nothing loaded, say so.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!loaded(largeRef.current) && !loaded(openerRef.current)) setSlow(true);
    }, SLOW_MS);
    return () => window.clearTimeout(timer);
  }, [slug, attempt]);

  function retry() {
    setAttempt((n) => n + 1);
    setState('opener');
    setSlow(false);
    // The Retry button unmounts; keep focus in the stage instead of dropping it to the body.
    rootRef.current?.focus();
  }

  const isError = state === 'error';
  const showLoading = slow && state === 'opener' && !openerLoaded;

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      data-stage-photo=""
      data-state={state}
      className="grid h-full w-full grid-cols-1 grid-rows-1 bg-gallery outline-none"
    >
      <picture
        data-stage-layer="opener"
        className={`col-start-1 row-start-1 block h-full min-h-0 w-full min-w-0 ${isError ? 'hidden' : ''}`}
      >
        {/* A raw img inside picture (exempt from @next/next/no-img-element): the content-hashed 1024 WebP the opener already loaded. */}
        <img
          ref={openerRef}
          src={openerSrc}
          alt=""
          aria-hidden="true"
          decoding="async"
          onLoad={() => setOpenerLoaded(true)}
          className="block h-full w-full object-contain"
        />
      </picture>
      <picture
        key={attempt}
        data-stage-layer="large"
        className={`col-start-1 row-start-1 block h-full min-h-0 w-full min-w-0 ${isError ? 'hidden' : ''}`}
      >
        <source type="image/avif" srcSet={stage.srcSetAvif} sizes={sizes} />
        <source type="image/webp" srcSet={stage.srcSetWebp} sizes={sizes} />
        {/* A raw img inside picture (exempt from @next/next/no-img-element): content-hashed manifest derivative; picture type switching. */}
        <img
          ref={largeRef}
          src={stage.src}
          width={stage.width}
          height={stage.height}
          alt={alt}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setState('large')}
          onError={() => setState('error')}
          className="block h-full w-full object-contain"
        />
      </picture>
      {showLoading && (
        <div className="col-start-1 row-start-1 flex items-center justify-center p-4">
          <p className="text-sm text-ink-muted">Loading photo</p>
        </div>
      )}
      {isError && (
        <div className="col-start-1 row-start-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
          <p className="text-sm text-ink">Couldn&apos;t load this photo.</p>
          <button
            type="button"
            onClick={retry}
            aria-label="Retry loading photo"
            className="inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 rounded-sm border border-line-strong px-4 text-base font-semibold text-ink hover:border-ink-muted"
          >
            <ArrowClockwiseIcon size={20} aria-hidden="true" />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
