/**
 * The one photo and region URL builder (15 D-16, 17 D-06). Every photo URL in
 * app/, components/, lib/ and proxy.ts comes from photoHref, and every region
 * URL from regionHref: Link hrefs, router.push, the PhotoViewer history and
 * title paths, the sitemap, the saved-pages catalog, the metadata canonical
 * and JSON-LD url/@id. lib/__tests__/photo-routes.test.ts scans the source and
 * fails on a hand-built photo or region path anywhere else (D-18, D-06).
 *
 * The URL contracts are fixed: /photos/<slug> and /photos/regions/<id>, no
 * redirect (PHOTO-05, REGION-07).
 *
 * This module imports only the editorial copy and the light-table id list, so
 * proxy.ts can read the slug list without bundling the view-model's
 * manifests, generated facts or terrain (F5). It must never import the region
 * registry (data/regions/regions.json): client components import photoHref
 * from here, and a JSON module is not dropped like the pure call below.
 * 17-RESEARCH measured +2,200 B of client JS, with the registry facts in two
 * client chunks, when regions.json was imported here, pure annotation or not.
 * The region id list proxy.ts needs lives in lib/photos/region-ids.ts.
 */
import { lightTableIds } from '@/data/light-table';
import { editorial } from '@/data/photos/editorial';

/** The path of a photo page: /photos/<slug>. */
export const photoHref = (slug: string): `/photos/${string}` => `/photos/${slug}`;

/** The path of a region page: /photos/regions/<id> (REGION-07, D-01, D-03: the registry id as it stands). */
export const regionHref = (id: string): `/photos/regions/${string}` => `/photos/regions/${id}`;

/**
 * The light-table photos' slugs (lightTableIds in data/light-table.ts, D-15),
 * for proxy.ts's unknown-slug 404 (F5). A photo with editorial copy that is
 * not on the light table gets no slug here until Phase 17 (PHOTO-05). The
 * photo-routes test pins this set to generateStaticParams' slugs, so the proxy
 * never admits a slug that has no static photo page.
 *
 * The pure annotation is load-bearing: client components import photoHref
 * from this module, and without it the bundler keeps this top-level call and
 * the editorial copy it reads in their chunks (measured in 15-10: the copy
 * appeared in a client chunk). With it, an unused list is dropped along with
 * the copy. The photo-routes test fails if the annotation goes.
 */
export const photoRouteSlugs: readonly string[] = /* @__PURE__ */ lightTableIds.map(
  (id) => editorial[id].slug
);
