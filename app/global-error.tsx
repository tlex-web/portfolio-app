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

/**
 * Root error boundary (SHELL-05; UI-SPEC "Shell Contract" global-error variant).
 * Its own html/body with the static chrome: plain links, no router hooks, no
 * motion. Try again calls `retry()` (user-approved deviation from the UI-SPEC's
 * `reset()` wording, 2026-10-10); `reset` stays in the props signature, unused.
 * The error is logged, never rendered.
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
        <SiteChrome variant="static">
          <ErrorBody variant="root" onRetry={retry} />
        </SiteChrome>
      </body>
    </html>
  );
}
