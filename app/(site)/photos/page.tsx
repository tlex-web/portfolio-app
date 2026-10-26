import type { Metadata } from 'next';
import PhotosPageClient from '@/components/PhotosPageClient';
import JustifiedGrid from '@/components/photos/JustifiedGrid';
import { landscapes } from '@/data/landscapes';
import { photoViews } from '@/lib/photos/view-model';
import { VIEW_LABELS, parseView } from '@/lib/photos/view-param';

export const metadata: Metadata = { title: 'Photographs' };

/**
 * /photos (PHOTO-02, PHOTO-03; D-14, D-15; 10-UI-SPEC "Page Structure").
 * A Server Component: the URL is the only source of view state, so the view
 * comes from `?view=` through parseView (Map default, locked). `?view=grid`
 * mounts the justified grid; the map and carousel values keep the current
 * gallery until 10-07 (carousel) and 10-08 (map) replace them.
 */
export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const view = parseView((await searchParams).view);

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
    <>
      <div className="min-h-screen bg-gradient-to-b from-surface to-surface-raised">
        {/* Hero Section - Static Server Component */}
        <div className="bg-surface-raised border-t border-line py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-6 text-ink">Landscape Gallery</h1>
            <p className="text-xl text-ink-muted max-w-3xl mx-auto mb-8">
              A collection of {landscapes.length} stunning landscape photographs from the Swiss Alps, each with interactive hotspots,
              technical details, and the stories behind the shots.
            </p>
          </div>
        </div>

        {/* Client-side interactive components */}
        <PhotosPageClient images={landscapes} />
      </div>

    </>
  );
}
