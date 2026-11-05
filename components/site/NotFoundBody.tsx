import Link from 'next/link';
import EdgeLayout from '@/components/site/EdgeLayout';
import type { EdgeSection } from '@/lib/edge-section';

/**
 * 404 body (EDGE-01, SHELL-05; D-09..D-11; 12-UI-SPEC "Edge Pages", "Per-page
 * content"). Rendered inside SiteChrome by app/not-found.tsx (unmatched URLs,
 * the deleted playground routes, and photo or project misses rewritten by
 * proxy.ts) and by app/(site)/not-found.tsx (notFound() inside the group).
 *
 * The text block sits in the shared EdgeLayout next to the contour sheet with
 * the marked trail and the "you are here" dot off it: the h1 names that
 * picture. No focus move (the route announcer reads the title, "Page not found
 * · Tim Lui"), no motion, zero JS of its own.
 *
 * `context` (D-11) is the only input: the section of a missed photo or project
 * URL, a two-value enum set by proxy.ts and read from a request header by
 * app/not-found.tsx. It picks Tim's sentence and puts that section's link
 * first ("All photographs" or "All routes"). Without it the generic sentence
 * and links show. The component accepts no slug, path or URL, and nothing it
 * renders is derived from the request, so the requested address can never be
 * echoed (T-12-03, T-12-24).
 */

type LinkSpec = { readonly href: '/photos' | '/projects'; readonly label: string };

/** Body sentence and text links per context; copy from 12-01 "Resolved values" (copy.404-*). */
const CONTENT: Record<EdgeSection | 'generic', { body: string; links: readonly [LinkSpec, LinkSpec] }> = {
  generic: {
    body: "There's no page at this address; the link may be mistyped or out of date.",
    links: [
      { href: '/photos', label: 'Photographs' },
      { href: '/projects', label: 'Engineering' },
    ],
  },
  photos: {
    body: 'No photograph at this address.',
    links: [
      { href: '/photos', label: 'All photographs' },
      { href: '/projects', label: 'Engineering' },
    ],
  },
  projects: {
    body: 'No project at this address.',
    links: [
      { href: '/projects', label: 'All routes' },
      { href: '/photos', label: 'Photographs' },
    ],
  },
};

const TEXT_LINK = 'text-accent underline underline-offset-[0.2em] min-h-11 inline-flex items-center';

export default function NotFoundBody({ context }: { context?: EdgeSection } = {}) {
  const { body, links } = CONTENT[context ?? 'generic'];

  return (
    <EdgeLayout
      text={
        <>
          <p className="mb-4 font-mono text-sm text-ink-muted tabular-nums">Error 404 · Page not found</p>
          <h1 className="mb-4 text-balance">You&apos;ve left the marked trail</h1>
          <p className="mb-8 text-base text-ink-muted">{body}</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 min-h-11 px-6 rounded-sm bg-accent text-ink-inverse font-semibold text-base hover:bg-accent-hover transition-colors duration-(--duration-fast) ease-erosion"
            >
              Go to the homepage
            </Link>
            {links.map(({ href, label }) => (
              <Link key={href} href={href} className={TEXT_LINK}>
                {label}
              </Link>
            ))}
          </div>
        </>
      }
    />
  );
}
