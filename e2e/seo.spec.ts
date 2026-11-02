import { test, expect, type Page } from '@playwright/test';
import { projects } from '@/data/projects';
import { site } from '@/data/site';
import { photoSlugs } from '@/lib/photos/view-model';

/**
 * Search metadata contract (SEO-01, SEO-03; D-13).
 *
 * SEO-01: a route names one absolute canonical on site.url (metadataBase in
 * app/layout.tsx plus the relative path from lib/metadata.ts), one meta
 * description and its own title; the root openGraph and twitter fields reach
 * it unreplaced. SEO-03: /sitemap.xml lists exactly the nav destinations, the
 * photo pages and the project pages on site.url, and /robots.txt points at it.
 */

const canonical = (page: Page) => page.locator('link[rel="canonical"]');
const description = (page: Page) => page.locator('meta[name="description"]');

/** The URL set the sitemap must list, computed from the same data the route reads. */
const expectedSitemap = [
  ...site.nav.map((n) => (n.href === '/' ? site.url : `${site.url}${n.href}`)),
  ...photoSlugs.map((slug) => `${site.url}/photos/${slug}`),
  ...projects.map((p) => `${site.url}/projects/${p.slug}`),
];

test.describe('Roadmap head (SEO-01, D-13)', () => {
  test('one absolute canonical, the approved description and the inherited social cards', async ({ page }) => {
    await page.goto('/roadmap');

    await expect(canonical(page)).toHaveCount(1);
    await expect(canonical(page)).toHaveAttribute('href', `${site.url}/roadmap`);
    await expect(description(page)).toHaveCount(1);
    await expect(description(page)).toHaveAttribute(
      'content',
      'What Tim has finished, is working on and plans next for this site, box and coin-flip.'
    );
    await expect(page).toHaveTitle('Roadmap · Tim Lui');
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
  });
});

test.describe('sitemap.xml and robots.txt (SEO-03)', () => {
  test('the sitemap lists exactly the nav, photo and project URLs, each once, and no /offline', async ({
    request,
  }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');

    const xml = await response.text();
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(expectedSitemap);
    expect(new Set(locs).size).toBe(locs.length);
    expect(xml).not.toContain('/offline');
    expect(xml).not.toContain('<lastmod>');
  });

  test('robots allows the site, disallows /api/ and /offline, and names the sitemap', async ({
    request,
  }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);

    const lines = (await response.text()).split('\n').map((l) => l.trim());
    expect(lines).toContain('Allow: /');
    expect(lines).toContain('Disallow: /api/');
    expect(lines).toContain('Disallow: /offline');
    expect(lines).toContain(`Sitemap: ${site.url}/sitemap.xml`);
  });
});
