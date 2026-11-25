import { headerSlotSizes } from '@/lib/photos/image-sizes';
import { regionCover } from '@/lib/regions';

/**
 * The region page's header slot, Phase 19's reserve (D-05; 18-UI-SPEC
 * Contract 2 "Header slot (Phase 19 reserve)"; P3 default). A Server
 * Component.
 *
 * The box is 16:9 on gallery-black: the drone-loop poster ratio Phase 19
 * ships, so Phase 19 swaps the media inside the same box with no layout shift.
 * It is full-bleed below 640 px (negative margins over the container's 16 px
 * gutters; a block box with auto width takes them) and the container's width
 * above. Phase 18 shows the region's cover (regionCover, so the slot is never
 * empty) as the stage derivatives, object-contain: never cropped, a 3:2 cover
 * pillarboxes slightly, a portrait one pillarboxes on gallery-black, a 16:9 one
 * fills. The image is the region page's LCP: eager, fetchpriority high, and
 * `sizes` from headerSlotSizes (the box times the contain factor). Its alt is
 * empty: the same photo appears in the sequence with its full alt and caption,
 * so a screen reader is not told twice, and a failed load shows no
 * broken-image text. It carries no view-transition name: only the sequence
 * figure morphs into the lightbox (two mounted photo-{slug} names would abort
 * the transition).
 *
 * Under the box, the fixed h-11 caption row prints '{cover title} · {altitude
 * label}' (the title wraps at word boundaries, the altitude is one nowrap
 * unit) and keeps an empty 44 px slot at its right (data-header-control), where
 * Phase 19 puts the pause control. Nothing is drawn over the photo.
 *
 * @throws RangeError for an id that is not a registry region.
 */
export default function HeaderSlot({ id }: { id: string }) {
  const cover = regionCover(id);
  const { stage, aspect, title, altitudeLabel } = cover;
  const ar = aspect.w / aspect.h;

  return (
    <div className="mt-6">
      <div data-region-header-slot="" className="relative -mx-4 aspect-video bg-gallery sm:mx-0">
        <picture className="absolute inset-0 block">
          <source type="image/avif" srcSet={stage.srcSetAvif} sizes={headerSlotSizes(ar)} />
          <source type="image/webp" srcSet={stage.srcSetWebp} sizes={headerSlotSizes(ar)} />
          {/* A raw img inside picture (exempt from @next/next/no-img-element): content-hashed manifest derivative; picture type switching. */}
          <img
            src={stage.src}
            width={stage.width}
            height={stage.height}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            sizes={headerSlotSizes(ar)}
            className="block h-full w-full object-contain"
          />
        </picture>
      </div>
      <div data-header-caption="" className="mt-2 flex h-11 items-center justify-between gap-4">
        <p className="min-w-0 font-mono text-sm text-ink-muted">
          {title}
          {' · '}
          <span className="whitespace-nowrap">{altitudeLabel}</span>
        </p>
        <span data-header-control="" aria-hidden="true" className="size-11 shrink-0" />
      </div>
    </div>
  );
}
