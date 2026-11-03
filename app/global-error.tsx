'use client';

import { useEffect } from 'react';
import { Inter, JetBrains_Mono, Schibsted_Grotesk } from 'next/font/google';
import SiteChrome from '@/components/site/SiteChrome';
import ErrorBody from '@/components/site/ErrorBody';
import './globals.css';

// global-error replaces the root layout, so it loads the global styles and the
// three fonts itself (same options as app/layout.tsx).
const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-schibsted',
  display: 'swap',
  adjustFontFallback: true,
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

/** meta.global-error-title (12-27 "Resolved values (follow-up)", supplied by Tim). */
const GLOBAL_ERROR_TITLE = 'Something went wrong · Tim Lui';

/**
 * Root error boundary (SHELL-05, EDGE-01; UI-SPEC "Shell Contract" global-error
 * variant; 12 D-09). Its own html.dark/body with the static chrome: plain links,
 * no router hooks, no motion. ErrorBody `root` renders in the shared EdgeLayout
 * with the contour sheet, and its Report this error link is a plain anchor.
 * Try again calls `retry()` (user-approved deviation from the UI-SPEC's
 * `reset()` wording, 2026-10-10); `reset` stays in the props signature, unused.
 * The error is logged, never rendered (T-12-29). No metadata export: Next does
 * not support it in global-error, so the title is a React title element that React 19
 * hoists into the head (IN-05).
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <html lang="en" className={`dark ${schibsted.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body antialiased">
        <title>{GLOBAL_ERROR_TITLE}</title>
        <SiteChrome variant="static">
          <ErrorBody variant="root" onRetry={retry} />
        </SiteChrome>
      </body>
    </html>
  );
}
