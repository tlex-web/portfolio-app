import Link from 'next/link';
import type { EdgeSection } from '@/lib/edge-section';

/**
 * 404 body (SHELL-05; UI-SPEC "Edge Pages Inside the Shell", "Copywriting Contract").
 * Rendered inside SiteChrome by app/not-found.tsx (unmatched URLs) and by
 * app/(site)/not-found.tsx (notFound() inside the group). Left-aligned in
 * max-w-prose; no focus move (the route announcer reads the title), no motion,
 * no contour art (Phase 12 EDGE-01 adds it).
 *
 * `context` (D-11) names the section of a missed photo or project URL (set by
 * proxy.ts, read by app/not-found.tsx): that section's link then reads "All
 * photographs" or "All routes". Without it every link keeps its generic label.
 * The requested slug is never passed in and never shown.
 */
export default function NotFoundBody({ context }: { context?: EdgeSection } = {}) {
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
            {context === 'photos' ? 'All photographs' : 'Photographs'}
          </Link>
          <Link
            href="/projects"
            className="text-accent underline underline-offset-[0.2em] min-h-11 inline-flex items-center"
          >
            {context === 'projects' ? 'All routes' : 'Engineering'}
          </Link>
        </div>
      </div>
    </div>
  );
}
