'use client';

import Link from 'next/link';
import { ArrowsOutIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react/dist/ssr';
import type { PhotoView } from '@/lib/photos/view-model';

/** ‹ › (UI-SPEC Interaction States "Carousel ‹ ›"): secondary icon buttons, 44 px; at an end aria-disabled, dimmed, hover off. */
const STEP_BUTTON =
  'inline-flex size-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-sm border border-line-strong text-ink transition-colors duration-(--duration-fast) ease-erosion hover:bg-surface-overlay aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent';

/** "Open photo": the one accent fill on /photos (UI-SPEC Copywriting "Primary CTA"). */
const OPEN_PHOTO =
  'inline-flex min-h-11 shrink-0 cursor-pointer touch-manipulation items-center gap-2 rounded-sm bg-accent px-4 font-semibold text-ink-inverse transition-colors duration-(--duration-fast) ease-erosion hover:bg-accent-hover hover:text-ink-inverse';

/**
 * The carousel controls bar, shared by the 3D carousel and the flat stepper
 * (PHOTO-02, PHOTO-04; D-12; 10-UI-SPEC "Carousel View", Controls bar, Ends,
 * Announcement rows).
 *
 * Below the frame, `flex-wrap`: left `‹ n / 4 ›` (the counter is Mono 14 and
 * aria-hidden, the buttons carry the names), centre the caption (the title,
 * then the grid caption line in three nowrap parts, so it wraps only between
 * parts and nothing truncates), right the primary "Open photo" link to
 * /photos/{slug} with `data-photo-id`, the element the lightbox returns focus
 * to on close. The ends never wrap: at 1 / 4 Previous and at n / n Next are
 * aria-disabled (still focusable, so focus is never lost) and a click there
 * does nothing. The buttons call `onStep`; nothing here dispatches keys.
 *
 * `announce` fills the polite status line; the parent sets it on steps only.
 */
export default function CarouselControls({
  photos,
  index,
  onStep,
  announce,
}: {
  photos: readonly PhotoView[];
  index: number;
  onStep: (dir: -1 | 1) => void;
  announce: string;
}) {
  const photo = photos[index];
  const atStart = index <= 0;
  const atEnd = index >= photos.length - 1;

  return (
    <div data-carousel-controls="" className="mt-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="Previous photo"
          aria-disabled={atStart ? 'true' : undefined}
          className={STEP_BUTTON}
          onClick={() => {
            if (!atStart) onStep(-1);
          }}
        >
          <CaretLeftIcon size={24} aria-hidden="true" />
        </button>
        <span
          data-carousel-counter=""
          aria-hidden="true"
          className="min-w-12 text-center font-mono text-sm text-ink-muted tabular-nums"
        >
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          aria-label="Next photo"
          aria-disabled={atEnd ? 'true' : undefined}
          className={STEP_BUTTON}
          onClick={() => {
            if (!atEnd) onStep(1);
          }}
        >
          <CaretRightIcon size={24} aria-hidden="true" />
        </button>
      </div>
      <div data-carousel-caption="" className="min-w-48 flex-1 md:text-center">
        <p className="text-base font-semibold text-ink">{photo.title}</p>
        <p className="font-mono text-sm text-ink-muted tabular-nums">
          <span data-caption-part="place" className="whitespace-nowrap">
            {photo.shortPlace}
          </span>
          {' · '}
          <span data-caption-part="altitude" className="whitespace-nowrap">
            {photo.altitudeLabel}
          </span>
          {' · '}
          <span data-caption-part="date" className="whitespace-nowrap">
            {photo.captureMonth}
          </span>
        </p>
      </div>
      <Link
        href={`/photos/${photo.slug}`}
        scroll={false}
        data-photo-id={photo.slug}
        className={OPEN_PHOTO}
      >
        Open photo
        <ArrowsOutIcon size={20} aria-hidden="true" />
      </Link>
      <p role="status" aria-atomic="true" className="sr-only">
        {announce}
      </p>
    </div>
  );
}
