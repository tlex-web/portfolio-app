import type { Metadata } from 'next';
import { headers } from 'next/headers';
import SiteChrome from '@/components/site/SiteChrome';
import NotFoundBody from '@/components/site/NotFoundBody';
import { EDGE_SECTION_HEADER, parseEdgeSection } from '@/lib/edge-section';

/**
 * Root not-found (SHELL-05, EDGE-01): handles every unmatched URL, including
 * the three deleted playground routes, with HTTP 404 and no forwarding
 * (e2e/shell.spec.ts "Shell 404" lists them). It is wrapped only by the root
 * layout, which has no shell, so it renders the chrome itself. notFound()
 * inside the (site) group uses app/(site)/not-found.tsx.
 *
 * Unknown /photos/<slug> and /projects/<slug> URLs also land here: proxy.ts
 * rewrites them to an unmatched path and names the section in the
 * x-edge-section request header (D-11), so the 404 renders server-side with a
 * link back to that section. Only the header is read, never params or the
 * pathname, so the requested slug can never be echoed (T-12-03).
 *
 * The title is fixed, "Page not found · Tim Lui" through the root template, so
 * the route announcer reads it on a client navigation and it never names the
 * requested URL (D-10).
 */
export const metadata: Metadata = { title: 'Page not found' };

export default async function NotFound() {
  const context = parseEdgeSection((await headers()).get(EDGE_SECTION_HEADER));

  return (
    <SiteChrome>
      <NotFoundBody context={context} />
    </SiteChrome>
  );
}
