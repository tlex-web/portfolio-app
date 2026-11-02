import { test, expect, type Page } from '@playwright/test';

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

test.describe('Default Open Graph card (SEO-02, D-16)', () => {
  test("Home's head names og:image and twitter:image, both the root card", async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(1);
    const og = await metaPath(page, 'meta[property="og:image"]');
    const twitter = await metaPath(page, 'meta[name="twitter:image"]');
    expect(new URL(og, 'http://localhost').pathname).toBe('/opengraph-image');
    expect(twitter).toBe(og);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
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
