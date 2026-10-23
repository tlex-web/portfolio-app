import Link from 'next/link';

/**
 * 404 body (SHELL-05; UI-SPEC "Edge Pages Inside the Shell", "Copywriting Contract").
 * Rendered inside SiteChrome by app/not-found.tsx (unmatched URLs) and by
 * app/(site)/not-found.tsx (notFound() inside the group). Left-aligned in
 * max-w-prose; no focus move (the route announcer reads the title), no motion,
 * no contour art (Phase 12 EDGE-01 adds it).
 */
export default function NotFoundBody() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-16">
      <div className="max-w-prose">
        <p className="font-mono text-sm text-ink-muted tabular-nums mb-4">Error 404</p>
        <h1 className="mb-4 text-balance">Page not found</h1>
        <p className="text-base text-ink-muted mb-8">
          There&apos;s nothing at this address. The link may be mistyped, or the page may have
          moved.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 min-h-11 px-6 rounded-sm bg-accent text-ink-inverse font-semibold text-base hover:bg-accent-hover transition-colors duration-(--duration-fast) ease-erosion"
          >
            Go to the homepage
          </Link>
          <Link
            href="/photos"
            className="text-accent underline underline-offset-[0.2em] min-h-11 inline-flex items-center"
          >
            Photographs
          </Link>
          <Link
            href="/projects"
            className="text-accent underline underline-offset-[0.2em] min-h-11 inline-flex items-center"
          >
            Engineering
          </Link>
        </div>
      </div>
    </div>
  );
}
