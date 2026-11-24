import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { projects } from '@/data/projects';
import { publishedSlugs } from '@/lib/photos/view-model';
import { regionIds } from '@/lib/regions';

/**
 * Open Graph images (SEO-02; D-16; 12-RESEARCH Pitfall 12).
 *
 * The root opengraph-image is the default card every route without its own
 * inherits. The test reads the URL Next wrote into Home's og:image (absolute on
 * site.url through metadataBase, with a content-hash query), keeps only its
 * pathname and search, and fetches that from the server under test, so it checks
 * the exact image a link preview would load rather than a hand-typed path.
 *
 * A PNG's IHDR chunk follows the 8-byte signature and the chunk's length and type
 * (8 bytes), so bytes 16-19 are the width and 20-23 the height, big-endian.
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** The same-origin path (pathname + search) of a head meta tag's absolute URL. */
async function metaPath(page: Page, selector: string): Promise<string> {
  const content = await page.locator(selector).first().getAttribute('content');
  expect(content, `${selector} content`).toBeTruthy();
  const url = new URL(content!);
  return `${url.pathname}${url.search}`;
}

/** Fetches a same-origin image path and asserts a 200 PNG of 1200 x 630 (IHDR). */
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

test.describe('Default Open Graph card (SEO-02, D-16)', () => {
  test("Home's head names og:image and twitter:image, both the root card", async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(1);
    const og = await metaPath(page, 'meta[property="og:image"]');
    const twitter = await metaPath(page, 'meta[name="twitter:image"]');
    expect(new URL(og, 'http://localhost').pathname).toBe('/opengraph-image');
    expect(twitter).toBe(og);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      'content',
      '1200'
    );
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
      'content',
      '630'
    );
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      'content',
      'Tim Lui, developer and photographer, over a contour map of the Matterhorn'
    );
  });

  test('the og:image URL answers 200 with a 1200 x 630 PNG', async ({ page, request }) => {
    await page.goto('/');
    const path = await metaPath(page, 'meta[property="og:image"]');

    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');

    const body = await response.body();
    expect([...body.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
    expect(body.toString('latin1', 12, 16)).toBe('IHDR');
    expect(body.readUInt32BE(16)).toBe(1200);
    expect(body.readUInt32BE(20)).toBe(630);
  });
});

/**
 * Every page with its own card, from the data, in data order (no literal slugs):
 * every published photo (17 PHOTO-05), every project, and every registry region
 * (17-07, D-12). The '/photos/' and '/photos/regions/' prefixes are typed here
 * on purpose, so a changed URL builder cannot move the list with it.
 */
const detailPages = [
  ...publishedSlugs.map((slug) => `/photos/${slug}`),
  ...projects.map((p) => `/projects/${p.slug}`),
  ...regionIds.map((id) => `/photos/regions/${id}`),
];

test.describe('Per-slug Open Graph cards (SEO-02, D-14, D-15; 17 D-12, PHOTO-05)', () => {
  test('the page list holds every published photo, project and region', () => {
    expect(detailPages.filter((p) => p.startsWith('/photos/regions/'))).toHaveLength(
      regionIds.length
    );
    expect(new Set(detailPages).size).toBe(detailPages.length);
  });

  for (const pagePath of detailPages) {
    test(`${pagePath} names its own card, a 1200 x 630 PNG`, async ({ page, request }) => {
      await page.goto(pagePath);

      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
      const og = await metaPath(page, 'meta[property="og:image"]');
      expect(new URL(og, 'http://localhost').pathname).toMatch(
        new RegExp(`^${pagePath}/opengraph-image[^/]*/card$`)
      );
      expect(await metaPath(page, 'meta[name="twitter:image"]')).toBe(og);
      const alt = await page.locator('meta[property="og:image:alt"]').getAttribute('content');
      expect(alt?.trim(), 'og:image:alt').toBeTruthy();
      expect(alt).not.toMatch(/undefined|NaN/);

      await expectCard(request, og);
    });
  }

  test("no two pages share a card URL or alt, and none is Home's", async ({ page }) => {
    const urls: string[] = [];
    const alts: string[] = [];
    for (const pagePath of detailPages) {
      await page.goto(pagePath);
      urls.push(await metaPath(page, 'meta[property="og:image"]'));
      alts.push(
        (await page.locator('meta[property="og:image:alt"]').getAttribute('content')) ?? ''
      );
    }
    await page.goto('/');
    const home = await metaPath(page, 'meta[property="og:image"]');

    expect(new Set(urls).size).toBe(urls.length);
    expect(new Set(alts).size).toBe(alts.length);
    expect(urls).not.toContain(home);
  });
});

/**
 * PHOTO-05 / T-17-12: the four v2.0 photo pages keep exactly the og:image URL they
 * had at the phase base (285b6d5), query hash included, so links already shared
 * keep resolving to the same cached card. The pins were observed on the v2.0
 * Vercel deploy, on a local Windows build and in the Phase 17 harness, so the hash
 * does not depend on the build machine; it moves only if the card route, its
 * metadata or its path changes, which is the change this test exists to catch.
 */
const v20PinnedCards: Record<string, string> = {
  'matterhorn-from-zermatt':
    '/photos/matterhorn-from-zermatt/opengraph-image-126xvw/card?1bf973d7cc2e42c4',
  'gornerschlucht-waterfall':
    '/photos/gornerschlucht-waterfall/opengraph-image-126xvw/card?1bf973d7cc2e42c4',
  'matterhorn-glacier-trail':
    '/photos/matterhorn-glacier-trail/opengraph-image-126xvw/card?1bf973d7cc2e42c4',
  'riffelsee-reflection':
    '/photos/riffelsee-reflection/opengraph-image-126xvw/card?1bf973d7cc2e42c4',
};

test.describe('v2.0 photo cards keep their base og:image URL (PHOTO-05, T-17-12)', () => {
  for (const [slug, pinned] of Object.entries(v20PinnedCards)) {
    test(`/photos/${slug} og:image is still ${pinned}`, async ({ page }) => {
      await page.goto(`/photos/${slug}`);
      expect(await metaPath(page, 'meta[property="og:image"]')).toBe(pinned);
    });
  }
});
