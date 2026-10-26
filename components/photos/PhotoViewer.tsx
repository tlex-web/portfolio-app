'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import ExifStrip from '@/components/photos/ExifStrip';
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
 * never cropped, on gallery black, never tinted by the map palette. The server
 * HTML already holds the layout, the title and the strip before the photo
 * decodes. Below the stage, ExifStrip carries the title, place and date,
 * story, EXIF, position and the rights line (D-05). Only the content-hashed
 * manifest derivatives (AVIF and WebP at 1024, 1600 and 2560 px) are
 * referenced: no original, no download control and no right-click or drag
 * blocking (LBOX-07, T-10-03).
 *
 * The chrome groups (data-chrome-left, data-chrome-right) are filled by later
 * plans: stepping and the counter (10-06), Hide labels and Zoom (10-10,
 * 10-11), Close (10-05).
 */

/** The stage `sizes`: the gutter tier takes 2 x 216 px from the viewport width. */
const STAGE_SIZES = '(min-width: 1280px) calc(100vw - 432px), 100vw';

const BACK_LINK =
  'min-h-11 items-center gap-2 text-base font-semibold text-ink-muted hover:text-ink';

export default function PhotoViewer({
  variant,
  photos,
  initialSlug,
}: {
  variant: 'page' | 'modal';
  photos: readonly PhotoView[];
  initialSlug: string;
}) {
  const current = photos.find((p) => p.slug === initialSlug);
  if (!current) throw new RangeError(`PhotoViewer: no photo with slug ${initialSlug}`);
  const { stage, aspect, alt } = current;
  const isPage = variant === 'page';

  const boxStyle = {
    aspectRatio: `${aspect.w} / ${aspect.h}`,
    '--ar': aspect.w / aspect.h,
  } as CSSProperties;

  return (
    <div
      data-photo-viewer=""
      className={
        isPage
          ? 'flex flex-col bg-gallery text-ink lb-key:h-[calc(100svh-var(--nav-h))] lb-gutter:h-[calc(100svh-var(--nav-h))]'
          : 'flex flex-col bg-gallery text-ink'
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
        </div>
        <div data-chrome-right="" className="flex items-center gap-2" />
      </div>
      <div
        data-viewer-stage=""
        className="lb-key:flex lb-key:min-h-0 lb-key:flex-1 lb-key:items-center lb-key:justify-center lb-key:[container-type:size] lb-gutter:flex lb-gutter:min-h-0 lb-gutter:flex-1 lb-gutter:items-center lb-gutter:justify-center lb-gutter:px-54 lb-gutter:[container-type:size]"
      >
        <div
          data-photo-box=""
          className="mx-auto bg-gallery lb-scroll:w-[min(100%,calc(70svh*var(--ar)))] lb-key:w-[min(100cqw,calc(100cqh*var(--ar)))] lb-gutter:w-[min(100cqw,calc(100cqh*var(--ar)))]"
          style={boxStyle}
        >
          <picture className="block h-full w-full">
            <source type="image/avif" srcSet={stage.srcSetAvif} sizes={STAGE_SIZES} />
            <source type="image/webp" srcSet={stage.srcSetWebp} sizes={STAGE_SIZES} />
            {/* A raw img inside picture (exempt from @next/next/no-img-element): content-hashed manifest derivative; picture type switching. */}
            <img
              src={stage.src}
              width={stage.width}
              height={stage.height}
              alt={alt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="block h-full w-full object-contain"
            />
          </picture>
        </div>
      </div>
      <ExifStrip view={current} headingLevel={isPage ? 1 : 2} />
    </div>
  );
}
