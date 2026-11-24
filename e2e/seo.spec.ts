import { test, expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { projects } from '@/data/projects';
import { site } from '@/data/site';
import { SITE_DESCRIPTION } from '@/lib/metadata';
import { regionPhotoViews, regionRights, regions } from '@/lib/regions';
import { ROUTES, SITEMAP_PATHS } from './routes';

/**
 * Search metadata contract (SEO-01, SEO-02, SEO-03; D-13).
 *
 * SEO-01: every content route in e2e/routes.ts names one absolute canonical on
 * site.url (metadataBase in app/layout.tsx plus the relative path from
 * lib/metadata.ts), one meta description and its own title. No two routes
 * share a title or a description, and only Home uses the root description.
 * SEO-02: every route names an og:image whose path answers a 1200 x 630 PNG,
 * and twitter:card summary_large_image. /offline and an unknown URL's 404 are
 * noindex. SEO-03 and D-15 (REGION-07): /sitemap.xml lists exactly the nav
 * destinations, the region pages (registry order), every published photo page
 * (by region, then altitude ascending) and the project pages on site.url
 * (Contact included, /offline never), and /robots.txt points at it.
 * SEO-04 (17-14; D-16, D-17, SC4): every sitemap page and /offline carries
 * JSON-LD that parses and holds exactly its expected @types, every non-Person
 * node carries creator, copyrightNotice and creditText (the Person none), the
 * lightbox adds no block, and each copyrightNotice equals the rights text the
 * page prints, by exact string equality.
 */

const canonical = (page: Page) => page.locator('link[rel="canonical"]');
const description = (page: Page) => page.locator('meta[name="description"]');

/**
 * The URL list the sitemap must give, in order, computed from the same data the
 * route reads (D-15): nav, then each region in registry order, then each
 * published photo grouped by region in registry order and altitude ascending
 * within, then the projects, then /sources (18 D-20). The paths are literal,
 * so the URL contract is checked independently of regionHref and photoHref.
 */
const expectedSitemap = [
  ...site.nav.map((n) => (n.href === '/' ? site.url : `${site.url}${n.href}`)),
  ...regions.map((r) => `${site.url}/photos/regions/${r.id}`),
  ...regions.flatMap((r) => regionPhotoViews(r.id)).map((v) => `${site.url}/photos/${v.slug}`),
  ...projects.map((p) => `${site.url}/projects/${p.slug}`),
  `${site.url}/sources`,
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
  test('the sitemap lists exactly the nav, region, photo and project URLs and /sources, each once, /contact included and no /offline', async ({
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

/**
 * Time budget per sitemap page for the canonical check, scaled like the audit
 * sweep (17-02, AUDIT_SWEEP_PAGE_MS): 60 s of setup plus this much per
 * SITEMAP_PATHS entry. A page here is one load and one head read, far lighter
 * than an audited page, so 10 s keeps a wide margin.
 */
const SITEMAP_CANONICAL_PAGE_MS = 10_000;

test.describe('Sitemap URLs are canonical (D-15, REGION-07)', () => {
  /**
   * Every URL the sitemap lists is the page's own canonical, exactly (D-15):
   * the page answers below 400 and names one canonical link whose href is the
   * sitemap URL. A data check, so one engine (@chromium-only keeps the e2e time
   * down); mismatches are collected so a failure names every path.
   */
  test("every sitemap URL is its page's canonical @chromium-only", async ({ page }) => {
    test.setTimeout(60_000 + SITEMAP_PATHS.length * SITEMAP_CANONICAL_PAGE_MS);
    expect(SITEMAP_PATHS.length).toBeGreaterThan(0);
    const mismatches: string[] = [];

    for (const path of SITEMAP_PATHS) {
      const response = await page.goto(path);
      const status = response?.status() ?? 0;
      const hrefs = await canonical(page).evaluateAll((links) =>
        links.map((link) => link.getAttribute('href'))
      );
      const want = canonicalFor(path);
      if (status >= 400) mismatches.push(`${path}: status ${status}`);
      if (hrefs.length !== 1) mismatches.push(`${path}: ${hrefs.length} canonical links`);
      else if (hrefs[0] !== want) mismatches.push(`${path}: canonical ${hrefs[0]}, want ${want}`);
    }

    expect(mismatches).toEqual([]);
  });
});

/** A JSON-LD node as JSON.parse returns it. */
type LdNode = Record<string, unknown>;

/**
 * Every ld+json block on the page, parsed. A block that does not parse is
 * returned as its error text, so the caller can report it with the path.
 */
async function ldBlocks(page: Page): Promise<Array<{ data: unknown } | { error: string }>> {
  const texts = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) => scripts.map((s) => s.textContent ?? ''));
  return texts.map((text) => {
    try {
      return { data: JSON.parse(text) as unknown };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  });
}

/** The top-level nodes of a block: its '@graph' members, or the block itself. */
function flatten(block: unknown): LdNode[] {
  const node = block as LdNode;
  return Array.isArray(node['@graph']) ? (node['@graph'] as LdNode[]) : [node];
}

/** Every top-level node on the page, with parse failures as errors. */
async function ldNodes(page: Page): Promise<{ nodes: LdNode[]; errors: string[] }> {
  const blocks = await ldBlocks(page);
  return {
    nodes: blocks.flatMap((b) => ('data' in b ? flatten(b.data) : [])),
    errors: blocks.flatMap((b) => ('error' in b ? [b.error] : [])),
  };
}

/** The one node of a type on the page (fails unless there is exactly one). */
async function ldNodeOfType(page: Page, type: string): Promise<LdNode> {
  const { nodes } = await ldNodes(page);
  const found = nodes.filter((n) => n['@type'] === type);
  expect(found, `${type} nodes on ${page.url()}`).toHaveLength(1);
  return found[0];
}

/**
 * The @types a path must carry, sorted (SC4): Person and WebSite on every page
 * under (site), plus the page's own block. The project's type follows its data:
 * a public repository link makes it SoftwareSourceCode, none SoftwareApplication.
 */
function expectedTypes(path: string): string[] {
  const own: string[] = [];
  const project = projects.find((p) => path === `/projects/${p.slug}`);
  if (path.startsWith('/photos/regions/')) own.push('ImageGallery');
  else if (/^\/photos\/[^/]+$/.test(path)) own.push('ImageObject');
  else if (project) own.push('links' in project ? 'SoftwareSourceCode' : 'SoftwareApplication');
  return ['Person', 'WebSite', ...own].sort();
}

const RIGHTS_KEYS = ['creator', 'copyrightNotice', 'creditText'] as const;

/** A rights value counts when it is present and not blank (a string) or empty (an object). */
const filled = (value: unknown) =>
  value !== undefined &&
  value !== null &&
  (typeof value !== 'string' || value.trim() !== '') &&
  (typeof value !== 'object' || Object.keys(value).length > 0);

/** The D-16 per-node rule's mismatches for one node, each prefixed with the path. */
function perNodeMismatches(path: string, node: LdNode): string[] {
  const type = String(node['@type']);
  if (type === 'Person') {
    return RIGHTS_KEYS.filter((k) => k in node).map((k) => `${path}: Person carries ${k}`);
  }
  return RIGHTS_KEYS.filter((k) => !filled(node[k])).map(
    (k) => `${path}: ${type} has no non-empty ${k}`
  );
}

/** Time budget per page for the JSON-LD contract: one load and one read, as the canonical check. */
const JSON_LD_PAGE_MS = 10_000;

/**
 * Wait until React has hydrated a link: a click on a server-rendered next/link
 * before hydration is a document navigation, which is never intercepted.
 */
async function waitForHydration(link: Locator) {
  await expect
    .poll(() => link.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))), {
      timeout: 15000,
    })
    .toBe(true);
}

test.describe('JSON-LD on every page (SEO-04; D-16, SC4)', () => {
  /**
   * Every sitemap page plus /offline: each ld+json block parses, the sorted
   * @types of the flattened nodes equal the path's expected set (nothing else,
   * so no BreadcrumbList), and every node passes the per-node rule. A data
   * contract, so one engine; mismatches are collected so a failure names every
   * path.
   */
  test('every page carries exactly its JSON-LD types @chromium-only', async ({ page }) => {
    const paths = [...SITEMAP_PATHS, '/offline'];
    test.setTimeout(60_000 + paths.length * JSON_LD_PAGE_MS);
    expect(SITEMAP_PATHS.length).toBeGreaterThan(0);
    const mismatches: string[] = [];

    for (const path of paths) {
      await page.goto(path);
      const { nodes, errors } = await ldNodes(page);
      for (const error of errors) mismatches.push(`${path}: a block does not parse (${error})`);
      const types = nodes.map((n) => String(n['@type'])).sort();
      const want = expectedTypes(path);
      if (types.join() !== want.join()) {
        mismatches.push(`${path}: types [${types.join(', ')}], want [${want.join(', ')}]`);
      }
      for (const node of nodes) mismatches.push(...perNodeMismatches(path, node));
    }

    expect(mismatches).toEqual([]);
  });

  /**
   * The lightbox is the intercepted @modal page, which carries no JSON-LD: a
   * tile click over the grid (a soft navigation: the window marker survives)
   * opens the dialog and leaves the block count as it was, with no ImageObject.
   */
  test('the lightbox adds no JSON-LD @chromium-only', async ({ page }) => {
    await page.goto('/photos?view=grid');
    const before = await ldBlocks(page);
    expect(before.length).toBeGreaterThan(0);

    const tile = page
      .getByRole('list', { name: 'Photographs, lowest first' })
      .getByRole('link')
      .first();
    await waitForHydration(tile);
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__seoSoftMark = 'kept';
    });
    await tile.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20000 });
    expect(
      await page.evaluate(() => (window as unknown as Record<string, unknown>).__seoSoftMark),
      'the tile click is a soft navigation'
    ).toBe('kept');

    const after = await ldNodes(page);
    expect(await ldBlocks(page)).toHaveLength(before.length);
    expect(after.errors).toEqual([]);
    expect(after.nodes.map((n) => n['@type'])).not.toContain('ImageObject');
  });

  /**
   * Each copyrightNotice equals the rights text its page prints (D-17,
   * T-17-28): the WebSite's equals the footer line on / and on /projects/box;
   * the box block's equals the footer line too (Tim's 17-01 option a); the
   * zermatt gallery's equals the region page's rights paragraph.
   */
  test('copyright notices equal the printed rights text @chromium-only', async ({ page }) => {
    const footerLine = (p: Page) =>
      p
        .getByRole('contentinfo')
        .locator('p')
        .filter({ hasText: /All rights reserved\.$/ });

    await page.goto('/');
    await expect(footerLine(page)).toHaveCount(1);
    const homeFooter = await footerLine(page).textContent();
    expect((await ldNodeOfType(page, 'WebSite')).copyrightNotice).toBe(homeFooter);

    await page.goto('/projects/box');
    await expect(footerLine(page)).toHaveCount(1);
    const boxFooter = await footerLine(page).textContent();
    expect((await ldNodeOfType(page, 'WebSite')).copyrightNotice).toBe(boxFooter);
    expect((await ldNodeOfType(page, 'SoftwareSourceCode')).copyrightNotice).toBe(boxFooter);

    await page.goto('/photos/regions/zermatt');
    const rights = page
      .getByRole('main')
      .locator('p')
      .filter({ hasText: /all rights reserved$/ });
    await expect(rights).toHaveCount(1);
    const printed = await rights.textContent();
    expect(printed).toBe(regionRights('zermatt'));
    expect((await ldNodeOfType(page, 'ImageGallery')).copyrightNotice).toBe(printed);
  });
});
