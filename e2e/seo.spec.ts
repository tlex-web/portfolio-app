import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { projects } from '@/data/projects';
import { site } from '@/data/site';
import { SITE_DESCRIPTION } from '@/lib/metadata';
import { photoSlugs } from '@/lib/photos/view-model';
import { ROUTES } from './routes';

/**
 * Search metadata contract (SEO-01, SEO-02, SEO-03; D-13).
 *
 * SEO-01: every content route in e2e/routes.ts names one absolute canonical on
 * site.url (metadataBase in app/layout.tsx plus the relative path from
 * lib/metadata.ts), one meta description and its own title. No two routes
 * share a title or a description, and only Home uses the root description.
 * SEO-02: every route names an og:image whose path answers a 1200 x 630 PNG,
 * and twitter:card summary_large_image. /offline and an unknown URL's 404 are
 * noindex. SEO-03: /sitemap.xml lists exactly the nav destinations, the photo
 * pages and the project pages on site.url (Contact included, /offline never),
 * and /robots.txt points at it.
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
  test('one absolute canonical, the approved description and the inherited social cards', async ({
    page,
  }) => {
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

/** The absolute canonical of a route: site.url itself for Home (Next writes no trailing slash). */
const canonicalFor = (path: string) => (path === '/' ? site.url : `${site.url}${path}`);

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * The same-origin path (pathname + search) of a head meta tag's absolute URL.
 * og:image is absolute on site.url (metadataBase is the production host,
 * Pitfall 12), so only its path is requested, against the server under test.
 */
async function metaPath(page: Page, selector: string): Promise<string> {
  const content = await page.locator(selector).first().getAttribute('content');
  expect(content, `${selector} content`).toBeTruthy();
  const url = new URL(content!);
  return `${url.pathname}${url.search}`;
}

/** A 200 image/png whose IHDR reads 1200 x 630 (bytes 16-19 width, 20-23 height). */
async function expectCard(request: APIRequestContext, path: string): Promise<void> {
  const response = await request.get(path);
  expect(response.status(), path).toBe(200);
  expect(response.headers()['content-type'], path).toBe('image/png');

  const body = await response.body();
  expect([...body.subarray(0, 8)], path).toEqual(PNG_SIGNATURE);
  expect(body.toString('latin1', 12, 16), path).toBe('IHDR');
  expect(body.readUInt32BE(16), path).toBe(1200);
  expect(body.readUInt32BE(20), path).toBe(630);
}

/**
 * Every content route from the shared list except /offline, which is noindex
 * and names no canonical (tested on its own below).
 */
const SEO_ROUTES = ROUTES.map(([path]) => path).filter((path) => path !== '/offline');

test.describe('Own head per content route (SEO-01, SEO-02)', () => {
  for (const path of SEO_ROUTES) {
    test(`${path}: one canonical, one description, a title, a 1200 x 630 card and summary_large_image`, async ({
      page,
      request,
    }) => {
      await page.goto(path);

      // Exactly one of each after the layout and page metadata merge (no duplicates).
      await expect(canonical(page), path).toHaveCount(1);
      await expect(canonical(page), path).toHaveAttribute('href', canonicalFor(path));
      await expect(description(page), path).toHaveCount(1);
      const content = (await description(page).getAttribute('content')) ?? '';
      expect(content.trim(), `${path} description`).not.toBe('');
      // No content route falls back to the root description; only Home owns it.
      if (path === '/') expect(content).toBe(SITE_DESCRIPTION);
      else expect(content, `${path} description`).not.toBe(SITE_DESCRIPTION);
      expect((await page.title()).trim(), `${path} title`).not.toBe('');

      // SEO-02: a card on every route (its own, or the inherited default).
      await expect(page.locator('meta[property="og:image"]'), path).toHaveCount(1);
      await expectCard(request, await metaPath(page, 'meta[property="og:image"]'));
      await expect(page.locator('meta[name="twitter:card"]'), path).toHaveCount(1);
      await expect(page.locator('meta[name="twitter:card"]'), path).toHaveAttribute(
        'content',
        'summary_large_image'
      );
    });
  }

  test('no two routes share a title or a description', async ({ page }) => {
    const titles: string[] = [];
    const descriptions: string[] = [];

    for (const path of SEO_ROUTES) {
      await page.goto(path);
      titles.push(await page.title());
      descriptions.push((await description(page).getAttribute('content')) ?? '');
    }

    expect(new Set(titles).size, titles.join(' | ')).toBe(SEO_ROUTES.length);
    expect(new Set(descriptions).size, descriptions.join(' | ')).toBe(SEO_ROUTES.length);
  });

  test('/photos?view=grid canonicalises to /photos', async ({ page }) => {
    await page.goto('/photos?view=grid');
    await expect(canonical(page)).toHaveCount(1);
    await expect(canonical(page)).toHaveAttribute('href', `${site.url}/photos`);
  });
});

test.describe('Kept out of the index (SEO-01, SEO-03)', () => {
  test('/offline carries a robots noindex meta and names no canonical', async ({ page }) => {
    await page.goto('/offline');

    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveCount(1);
    await expect(robots).toHaveAttribute('content', /\bnoindex\b/);
    await expect(canonical(page)).toHaveCount(0);
  });

  test("an unknown URL's 404 carries a robots noindex meta", async ({ page }) => {
    const response = await page.goto('/__no-such-page__');
    expect(response?.status()).toBe(404);

    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveCount(1);
    await expect(robots).toHaveAttribute('content', /\bnoindex\b/);
  });
});

test.describe('sitemap.xml and robots.txt (SEO-03)', () => {
  test('the sitemap lists exactly the nav, photo and project URLs, each once, /contact included and no /offline', async ({
    request,
  }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');

    const xml = await response.text();
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(expectedSitemap);
    expect(locs).toContain(`${site.url}/contact`);
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
