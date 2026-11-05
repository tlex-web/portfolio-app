'use client';

import { useEffect, useState } from 'react';
import { savedPageRows, type SavedPageRow } from '@/lib/saved-pages';

/** Copy from 12-01 "Resolved values" (copy.offline-h2, -empty, -unsupported). */
const HEADING = 'Saved on this device';
const CHECKING = 'Checking saved pages…';
const EMPTY = 'No pages are saved on this device yet.';
const UNSUPPORTED = "This browser can't list saved pages.";

const NOTE = 'mt-4 text-base text-ink-muted';
const ROW =
  'flex min-h-12 items-center justify-between gap-4 py-2 text-base text-ink hover:bg-surface-overlay transition-colors duration-(--duration-fast) ease-erosion';

type State =
  | { status: 'checking' }
  | { status: 'ready'; rows: SavedPageRow[] }
  | { status: 'unsupported' };

/** Every request URL in every cache this origin holds. Throws without the caches API. */
async function cachedUrls(): Promise<string[]> {
  if (typeof window === 'undefined' || !('caches' in window) || !window.caches) {
    throw new Error('Cache Storage is not available');
  }
  const urls: string[] = [];
  for (const name of await window.caches.keys()) {
    const cache = await window.caches.open(name);
    for (const request of await cache.keys()) urls.push(request.url);
  }
  return urls;
}

/**
 * The offline page's saved-pages list (EDGE-02, D-12; 12-UI-SPEC E11), in the
 * EdgeLayout `extra` slot.
 *
 * The section and its h2 render on the server, so the heading never moves;
 * "Checking saved pages…" holds the first paint until Cache Storage is read.
 * The swap happens at the end of the slot, so the text and the art above it
 * stay put (EdgeLayout `items-start`). Rows come only from `catalog` via
 * savedPageRows: a cached URL is never printed (T-12-30). Without the caches
 * API, or when reading it rejects, the unsupported sentence shows.
 *
 * Rows are plain anchors on purpose: offline, a router navigation would try
 * to fetch an RSC payload first, while a document navigation goes straight to
 * the service worker's cached copy of the page.
 */
export default function SavedPages({ catalog }: { catalog: readonly SavedPageRow[] }) {
  const [state, setState] = useState<State>({ status: 'checking' });

  useEffect(() => {
    let cancelled = false;
    cachedUrls()
      .then((urls) => {
        if (!cancelled) setState({ status: 'ready', rows: savedPageRows(urls, catalog) });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unsupported' });
      });
    return () => {
      cancelled = true;
    };
  }, [catalog]);

  return (
    <section aria-labelledby="saved-title">
      <h2 id="saved-title" className="text-heading">
        {HEADING}
      </h2>
      {state.status === 'checking' ? <p className={NOTE}>{CHECKING}</p> : null}
      {state.status === 'unsupported' ? <p className={NOTE}>{UNSUPPORTED}</p> : null}
      {state.status === 'ready' && state.rows.length === 0 ? <p className={NOTE}>{EMPTY}</p> : null}
      {state.status === 'ready' && state.rows.length > 0 ? (
        <ul className="mt-4 border-b border-line">
          {state.rows.map((row) => (
            <li key={row.href} className="border-t border-line">
              <a href={row.href} className={ROW}>
                <span className="min-w-0">{row.title}</span>
                {row.label ? <span className="shrink-0 text-sm text-ink-muted">{row.label}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
