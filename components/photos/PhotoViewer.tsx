'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import type { PhotoView } from '@/lib/photos/view-model';

/**
 * The one photo viewer for both surfaces (D-05, D-08; LBOX-01, LBOX-07;
 * 10-UI-SPEC "Photo Viewer"): `page` is the full photo page inside the shell
 * (title as h1, "All photographs" leading link), `modal` the lightbox inside
 * the dialog (title as h2#photo-title, used from 10-05).
 *
 * The photo sits on gallery black, never tinted by the map palette, drawn
 * `object-fit: contain` in a box reserved at its true ratio, so the server
 * HTML already holds the layout, the title and the rights line before the
 * photo decodes. Only the content-hashed manifest derivatives (AVIF and WebP
 * at 1024, 1600 and 2560 px) are referenced: no original, no download control
 * and no right-click or drag blocking (LBOX-07, T-10-03).
 *
 * Stepping between photos arrives in 10-06; the layout tiers and the stage
 * `sizes` arrive in 10-03.
 */
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
  const { stage, aspect, alt, title, rights } = current;
  const Title = variant === 'page' ? 'h1' : 'h2';

  return (
    <div data-photo-viewer="" className="bg-gallery text-ink">
      {variant === 'page' && (
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/photos"
            className="inline-flex min-h-11 items-center gap-2 text-base font-semibold text-ink-muted hover:text-ink"
          >
            <ArrowLeftIcon size={20} aria-hidden="true" />
            All photographs
          </Link>
        </div>
      )}
      <div
        data-photo-stage=""
        className="mx-auto max-h-[70svh] w-full"
        style={{ aspectRatio: `${aspect.w} / ${aspect.h}` }}
      >
        <picture className="block h-full w-full">
          <source type="image/avif" srcSet={stage.srcSetAvif} sizes="100vw" />
          <source type="image/webp" srcSet={stage.srcSetWebp} sizes="100vw" />
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
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <Title
          id={variant === 'modal' ? 'photo-title' : undefined}
          className="font-display text-heading font-semibold text-ink"
        >
          {title}
        </Title>
        <p className="mt-2 text-sm text-ink-muted">{rights}</p>
      </div>
    </div>
  );
}
