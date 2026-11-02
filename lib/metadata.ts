import type { Metadata } from 'next';

/**
 * The root description: the default every route inherits from app/layout.tsx
 * and Home's own description, kept in one place so the two cannot drift.
 */
export const SITE_DESCRIPTION =
  'Tim Lui is a developer and photographer. Landscape photographs from the Matterhorn region and software projects.';

/**
 * One route's own head fields (SEO-01; 12-RESEARCH Pattern 2 and finding 2).
 *
 * Returns the title only when one is given (Home keeps the root default),
 * the description, and a relative canonical that Next resolves against the
 * root layout's metadataBase (site.url, D-13) into one absolute
 * <link rel="canonical">.
 *
 * It never sets openGraph or twitter: Next merges metadata shallowly, so a
 * child openGraph object would replace the inherited one whole, file-based OG
 * images included. Next copies title and description into og: and twitter:
 * itself.
 *
 * @param o.title the page title, rendered through the root template as
 *   '{title} · Tim Lui'; omit it to keep the root default.
 * @param o.description the approved description for the route.
 * @param o.path the route path, starting with '/', without query or hash.
 */
export function pageMetadata(o: { title?: string; description: string; path: string }): Metadata {
  return {
    ...(o.title ? { title: o.title } : {}),
    description: o.description,
    alternates: { canonical: o.path },
  };
}
