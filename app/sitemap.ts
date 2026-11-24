import type { MetadataRoute } from 'next';
import { projects } from '@/data/projects';
import { site } from '@/data/site';
import { photoHref, regionHref } from '@/lib/photos/routes';
import { regionPhotoViews, regions } from '@/lib/regions';

/**
 * /sitemap.xml (SEO-03; 12-RESEARCH Pattern 4; 17 D-15, REGION-07).
 *
 * The sitemap lists exactly the canonical URLs of the site's pages (D-15),
 * each once, absolute on site.url (D-13), in the D-11 page order:
 *
 * 1. every nav destination, in nav order;
 * 2. every region page (regionHref), in registry order (the schema keeps the
 *    ids unique and sorted ascending);
 * 3. every published photo page (photoHref), grouped by region in registry
 *    order and, within a region, by altitude ascending with ties broken by id
 *    (regionPhotoViews, buildWaypoints' order);
 * 4. every project page, in data order.
 *
 * Deterministic: the order comes only from the committed data, so two builds
 * emit identical XML, and there is no lastModified (a build-time new Date()
 * would change the output on every build and nothing in the data dates a
 * page). /offline and the 404 are noindex and are not listed. e2e/routes.ts
 * derives SITEMAP_PATHS and AUDIT_SWEEP from this list, so every page listed
 * here joins the production audit gate (VERIFY-05) with no edit there.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...site.nav.map((n) => ({ url: n.href === '/' ? site.url : `${site.url}${n.href}` })),
    ...regions.map((r) => ({ url: `${site.url}${regionHref(r.id)}` })),
    ...regions
      .flatMap((r) => regionPhotoViews(r.id))
      .map((v) => ({ url: `${site.url}${photoHref(v.slug)}` })),
    ...projects.map((p) => ({ url: `${site.url}/projects/${p.slug}` })),
  ];
}
