import type { Metadata } from 'next';
import EdgeLayout from '@/components/site/EdgeLayout';
import OfflineRetry from '@/components/site/OfflineRetry';
import SavedPages from '@/components/site/SavedPages';
import { site } from '@/data/site';
import { projects } from '@/data/projects';
import { photoViews } from '@/lib/photos/view-model';
import { savedPageCatalog } from '@/lib/saved-pages';

/**
 * The offline page (EDGE-02, D-12; 12-UI-SPEC "Per-page content" /offline and
 * E11). The service worker precaches it with its CSS, JS and fonts (12-08) and
 * serves it when a navigation fails without a cached copy.
 *
 * A Server Component in the shared edge layout beside the contour sheet: the
 * text block with Tim's h1 and sentence, a primary Try again (OfflineRetry,
 * which also reloads once when the connection returns), and the saved-pages
 * list in the extra slot. The catalog of listable pages is built here from
 * data, so the client island ships only titles and paths. No focus move.
 * Noindex, and kept out of the sitemap (12-09).
 */
export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false },
};

export default function OfflinePage() {
  const catalog = savedPageCatalog({ nav: site.nav, photos: photoViews, projects });

  return (
    <EdgeLayout
      text={
        <>
          <p className="mb-4 font-mono text-sm text-ink-muted tabular-nums">Offline</p>
          <h1 className="mb-4 text-balance">You&apos;re offline</h1>
          <p className="mb-8 text-base text-ink-muted">
            This page needs a connection and reloads by itself when you&apos;re back online.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <OfflineRetry />
          </div>
        </>
      }
      extra={<SavedPages catalog={catalog} />}
    />
  );
}
