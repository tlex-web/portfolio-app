import type { Metadata } from 'next';
import CarouselView from '@/components/photos/CarouselView';
import JustifiedGrid from '@/components/photos/JustifiedGrid';
import MapSheet from '@/components/photos/MapSheet';
import { photoViews } from '@/lib/photos/view-model';
import { VIEW_LABELS, parseView } from '@/lib/photos/view-param';

export const metadata: Metadata = { title: 'Photographs' };

/**
 * /photos (PHOTO-02, PHOTO-03; D-14, D-15; 10-UI-SPEC "Page Structure").
 * A Server Component: the URL is the only source of view state, so the view
 * comes from `?view=` through parseView (Map default, locked). `?view=grid`
 * mounts the justified grid and `?view=carousel` the Carousel view (the 3D
 * carousel or the flat stepper behind the capability gate, 10-07); the map,
 * the default for no or an unknown value, mounts the survey-sheet map with
 * the waypoint links (PHOTO-01, D-01 to D-04, 10-08).
 */
export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const view = parseView((await searchParams).view);

  if (view === 'carousel') {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 sm:px-6 md:pb-16 lg:px-8">
        <section aria-labelledby="view-title">
          <h2 id="view-title" className="sr-only">
            {VIEW_LABELS[view]}
          </h2>
          <CarouselView photos={photoViews} />
        </section>
      </div>
    );
  }

  if (view === 'grid') {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 sm:px-6 md:pb-16 lg:px-8">
        <section aria-labelledby="view-title">
          <h2 id="view-title" className="sr-only">
            {VIEW_LABELS[view]}
          </h2>
          <JustifiedGrid photos={photoViews} />
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 sm:px-6 md:pb-16 lg:px-8">
      <section aria-labelledby="view-title">
        <h2 id="view-title" className="sr-only">
          {VIEW_LABELS[view]}
        </h2>
        <MapSheet photos={photoViews} />
      </section>
    </div>
  );
}
