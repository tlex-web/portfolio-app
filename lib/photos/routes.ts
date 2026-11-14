/**
 * The one photo URL builder (15 D-16). Every photo URL in app/, components/,
 * lib/ and proxy.ts comes from photoHref: Link hrefs, router.push, the
 * PhotoViewer history and title paths, the sitemap, the saved-pages catalog
 * and the metadata canonical. lib/__tests__/photo-routes.test.ts scans the
 * source and fails on a hand-built photo path anywhere else (D-18).
 *
 * The URL contract is fixed: /photos/<slug>, no redirect (PHOTO-05).
 * Phase 17 adds regionHref here (D-19).
 *
 * This module imports only the editorial copy, so proxy.ts can read the slug
 * list without bundling the view-model's manifests, generated facts or terrain
 * (F5).
 */
import { editorial } from '@/data/photos/editorial';

/** The path of a photo page: /photos/<slug>. */
export const photoHref = (slug: string): `/photos/${string}` => `/photos/${slug}`;

/**
 * Every photo slug with editorial copy, for proxy.ts's unknown-slug 404 (F5).
 * The photo-routes test pins this set to generateStaticParams' slugs, so the
 * proxy never admits a slug that has no static photo page.
 *
 * The pure annotation is load-bearing: client components import photoHref
 * from this module, and without it the bundler keeps this top-level call and
 * the editorial copy it reads in their chunks (measured in 15-10: the copy
 * appeared in a client chunk). With it, an unused list is dropped along with
 * the copy. The photo-routes test fails if the annotation goes.
 */
export const photoRouteSlugs: readonly string[] = /* @__PURE__ */ Object.values(editorial).map(
  (e) => e.slug
);
