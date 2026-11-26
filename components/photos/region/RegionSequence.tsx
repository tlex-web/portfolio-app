import RegionRail from '@/components/photos/region/RegionRail';
import SequenceFigure from '@/components/photos/region/SequenceFigure';
import { countLabel } from '@/lib/home-format';
import { railHead, railTicks } from '@/lib/photos/region-rail';
import { regionById, regionPhotoViews, regionRights } from '@/lib/regions';

/**
 * The region's photographs on gallery-black (REGION-03; D-07; 18-UI-SPEC
 * Contract 2 "Sequence"). A Server Component: a full-bleed band with the
 * container inside, so the photo column shares the page's left edge.
 *
 * Head row: h2 'Photographs', the count '{n} photographs, lowest first' and a
 * 'Skip to next region' link to #next-region (the block that closes every
 * region page). Below 768 px one column; from 768 px the photo column and the
 * 6rem rail column (RAIL_COLUMN_PX, lib/photos/image-sizes.ts; image-sizes.test
 * pins the two), which holds the sticky altimeter rail (18-12, REGION-05): its
 * ticks and head label are built here from the views and cross to the RegionRail
 * island as plain props (T-18-29). No ancestor of the rail column clips overflow (18-RESEARCH Pitfall 10: an overflow ancestor
 * would break the rail's sticky box).
 *
 * The list is in regionPhotoViews order (DEM height ascending, ties by id),
 * one SequenceFigure per photo, and the region's rights line follows it (its
 * text is the ImageGallery JSON-LD's copyrightNotice, so it stays unchanged).
 * A region with no photo never reaches this: regionPhotoViews throws at module
 * load (UI E5/empty).
 *
 * @throws RangeError for an id that is not a registry region.
 */

/**
 * '7 photographs, lowest first'; '1 photograph, lowest first' for one. Built on
 * the shared countLabel (lib/home-format.ts), which rejects a negative or
 * non-integer count; a region always has at least one photo here.
 */
export function sequenceCountLabel(n: number): string {
  return `${countLabel(n, 'photograph', 'photographs')}, lowest first`;
}

export default function RegionSequence({ id }: { id: string }) {
  const region = regionById(id);
  if (!region) throw new RangeError(`RegionSequence: ${id} is not a registry region`);
  const views = regionPhotoViews(id);

  return (
    <section
      aria-labelledby="region-photos"
      data-region-sequence=""
      className="mt-16 bg-gallery py-12 md:py-16"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 id="region-photos">Photographs</h2>
            <p data-sequence-count="" className="font-mono text-sm text-ink-muted">
              {sequenceCountLabel(views.length)}
            </p>
          </div>
          <a
            href="#next-region"
            className="inline-flex min-h-11 items-center text-base font-semibold text-ink-muted transition-colors duration-(--duration-fast) ease-erosion hover:text-ink"
          >
            Skip to next region
          </a>
        </div>
        <div className="mt-8 md:grid md:grid-cols-[minmax(0,1fr)_6rem] md:gap-6">
          <ol
            aria-label={`${region.name} photographs, lowest first`}
            className="flex flex-col gap-y-12 md:gap-y-16"
          >
            {views.map((view, i) => (
              <SequenceFigure key={view.slug} view={view} n={i + 1} N={views.length} />
            ))}
          </ol>
          <div data-region-rail-column="" className="hidden md:block">
            <RegionRail ticks={railTicks(views)} head={railHead(views)} />
          </div>
        </div>
        <p className="mt-12 text-sm text-ink-muted">{regionRights(id)}</p>
      </div>
    </section>
  );
}
