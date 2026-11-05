'use client';

import { useEffect } from 'react';

/** The 07 PRIMARY button, as ErrorBody's Try again. */
const PRIMARY =
  'inline-flex items-center gap-2 min-h-11 px-6 rounded-sm bg-accent text-ink-inverse font-semibold text-base hover:bg-accent-hover transition-colors duration-(--duration-fast) ease-erosion cursor-pointer touch-manipulation';

/**
 * The offline page's Try again and its automatic return (EDGE-02, D-12;
 * 12-UI-SPEC "Per-page content" /offline).
 *
 * Try again reloads the page: the service worker tries the network first, so
 * a working connection brings the real page back. One `online` listener,
 * registered with `once: true`, does the same by itself when the connection
 * returns, as the body sentence promises; it is removed on unmount.
 */
export default function OfflineRetry() {
  useEffect(() => {
    const onOnline = () => window.location.reload();
    window.addEventListener('online', onOnline, { once: true });
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return (
    <button type="button" onClick={() => window.location.reload()} className={PRIMARY}>
      Try again
    </button>
  );
}
