import type { MetadataRoute } from 'next';
import { site } from '@/data/site';

/**
 * /robots.txt (SEO-03; 12-RESEARCH Pattern 4).
 *
 * Every crawler may fetch the site except the API routes and /offline (the
 * service worker's fallback page, which is also noindex), and is pointed at
 * the generated sitemap on the canonical host (D-13).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/offline'] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
