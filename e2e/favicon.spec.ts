import { test, expect } from '@playwright/test';

/**
 * The browser icons. Next.js writes the head links from app/favicon.ico,
 * app/icon.svg and app/apple-icon.png, so these tests read the href each page
 * really names and fetch it, instead of assuming a path.
 */
const ICONS = [
  { name: 'the ICO fallback', selector: 'link[rel="icon"][href^="/favicon.ico"]', type: 'image/x-icon' },
  { name: 'the SVG icon', selector: 'link[rel="icon"][type="image/svg+xml"]', type: 'image/svg+xml' },
  { name: 'the apple touch icon', selector: 'link[rel="apple-touch-icon"]', type: 'image/png' },
];

test.describe('Browser icons', () => {
  for (const { name, selector, type } of ICONS) {
    test(`${name} is linked from the head and served`, async ({ page, request }) => {
      await page.goto('/');

      const href = await page.locator(selector).getAttribute('href');
      expect(href).not.toBeNull();

      const response = await request.get(href!);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain(type);
      expect((await response.body()).length).toBeGreaterThan(0);
    });
  }

  test('a browser asking for /favicon.ico directly gets an icon', async ({ request }) => {
    const response = await request.get('/favicon.ico');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/x-icon');
  });

  test('a 404 page carries the icons too', async ({ page }) => {
    await page.goto('/no-such-page');

    await expect(page.locator('link[rel="icon"]')).toHaveCount(2);
  });
});
