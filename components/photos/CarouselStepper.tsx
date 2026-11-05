import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { PhotoView } from '@/lib/photos/view-model';

/** The carousel frame box, shared by the stepper and the 3D carousel (UI-SPEC "Carousel View", Frame box). */
export const CAROUSEL_FRAME = 'rounded-lg border border-line bg-surface-raised h-[28rem] md:h-[36rem]';

/**
 * The flat stepper (PHOTO-02; D-12, D-13; 10-UI-SPEC "Carousel View", Stepper
 * column): what every static gate result shows instead of the 3D carousel
 * (reduced motion, Save-Data, no WebGL2, low memory, a lost or failed
 * context, and 'pending' before hydration). No canvas, no three.js, no motion.
 *
 * One photo inside the frame box, centred at its true aspect ratio: the image
 * box is the largest box of that ratio that fits the frame (container query
 * units, as in the viewer stage), so it never crops (object-contain) and
 * `bg-surface-overlay` shows until the image has decoded. The picture uses
 * the grid tile's manifest srcsets and the editorial alt, and is keyed by
 * slug so a step never shows the previous photo in the new box.
 *
 * The photo is also a pointer target that opens the photo (UI-SPEC Pointer
 * row), but it is `tabIndex={-1}` and aria-hidden: "Open photo" is the
 * keyboard and screen reader path, and the only element with
 * `data-photo-id`, so focus returns there when the lightbox closes. No
 * view-transition name: the carousel opens with a plain enter (D-12).
 */
export default function CarouselStepper({ photo }: { photo: PhotoView }) {
  const { slug, alt, aspect, tile } = photo;
  return (
    <div data-carousel-stepper="" className={`${CAROUSEL_FRAME} p-4`}>
      <div className="flex h-full w-full items-center justify-center [container-type:size]">
        <Link
          key={slug}
          href={`/photos/${slug}`}
          scroll={false}
          tabIndex={-1}
          aria-hidden="true"
          className="block cursor-pointer overflow-hidden rounded-sm bg-surface-overlay w-[min(100cqw,calc(100cqh*var(--ar)))]"
          style={
            { '--ar': aspect.w / aspect.h, aspectRatio: `${aspect.w} / ${aspect.h}` } as CSSProperties
          }
        >
          <picture className="block h-full w-full">
            <source
              type="image/avif"
              srcSet={tile.srcSetAvif}
              sizes="(min-width: 1152px) 1056px, calc(100vw - 64px)"
            />
            <source
              type="image/webp"
              srcSet={tile.srcSetWebp}
              sizes="(min-width: 1152px) 1056px, calc(100vw - 64px)"
            />
            {/* A raw img inside picture (exempt from @next/next/no-img-element): content-hashed manifest derivative; picture type switching. */}
            <img
              src={tile.src}
              width={tile.width}
              height={tile.height}
              alt={alt}
              decoding="async"
              className="block h-full w-full object-contain"
            />
          </picture>
        </Link>
      </div>
    </div>
  );
}
