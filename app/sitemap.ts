import type { MetadataRoute } from 'next';
import { projects } from '@/data/projects';
import { site } from '@/data/site';
import { photoSlugs } from '@/lib/photos/view-model';

/**
 * /sitemap.xml (SEO-03; 12-RESEARCH Pattern 4).
 *
 * Every nav destination, then every photo page in the canonical photo order,
 * then every project page in data order, each once, absolute on site.url
 * (D-13). Deterministic: no lastModified (a build-time new Date() would change
 * the output on every build and nothing in the data dates a page). /offline
 * and the 404 are not listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...site.nav.map((n) => ({ url: n.href === '/' ? site.url : `${site.url}${n.href}` })),
    ...photoSlugs.map((slug) => ({ url: `${site.url}/photos/${slug}` })),
    ...projects.map((p) => ({ url: `${site.url}/projects/${p.slug}` })),
  ];
}
