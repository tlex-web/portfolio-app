import { test, expect } from '@playwright/test';
import { terrain } from '@/data/generated/terrain';
import { imageManifest } from '@/data/generated/image-manifest';

/**
 * Data privacy (DATA-05; ROADMAP Phase 8 success criterion 4, D-11, D-12).
 *
 * The full-resolution copies of the four originals (12480 or 4712 px, carrying
 * nothing a derivative does not) were removed in 08-07, so a fresh deploy must
 * answer 404 for each of them and for the old optimization manifest. Copies
 * already cached in a CDN or browser are accepted under D-12.
 *
 * The hashed assets under /terrain/ and /images/photos/ never change in place:
 * they are served without a per-request CSP (the proxy matcher skips them,
 * 08-06) and, on the production server, with an immutable Cache-Control.
 * Pages keep their nonce CSP.
 *
 * The Cache-Control assertion is an in-test condition on the production flag
 * (playwright.config.ts `prod`), never a skip: the dev server sets its own
 * caching headers, and test-count.mjs rejects skipped tests.
 */

const prod = !!process.env.CI || !!process.env.PW_PROD;
const IMMUTABLE = 'public, max-age=31536000, immutable';

/** The eight full-res files deleted in 08-07 (e5422b5), by original stem. */
const FULL_RES_STEMS = [
  'IMG_0605-Enhanced (2022_02_01 09_47_03 UTC)',
  'IMG_0629-Enhanced (2022_07_29 07_19_54 UTC)',
  'IMG_0662-Enhanced (2022_07_29 07_19_54 UTC)',
  'R004-011-Edit-Enhanced (2021_11_13 16_58_47 UTC)',
] as const;
const REMOVED_URLS = [
  ...FULL_RES_STEMS.flatMap((stem) => ['jpg', 'webp'].map((ext) => encodeURI(`/images/optimized/${stem}.${ext}`))),
  '/images/optimized/optimization-manifest.json',
];

const firstPhoto = Object.values(imageManifest)[0];
const HASHED_ASSETS = [
  { label: 'footer strip contour SVG', url: terrain.assets.contours.strip },
  { label: '640 px photo WebP', url: firstPhoto.variants.find((v) => v.longEdge === 640)!.webp },
];

test.describe('Data privacy (DATA-05)', () => {
  for (const url of REMOVED_URLS) {
    test(`removed ${decodeURI(url)} returns 404`, async ({ request }) => {
      const response = await request.get(url);
      expect(response.status()).toBe(404);
    });
  }

  for (const { label, url } of HASHED_ASSETS) {
    test(`${label} is served without CSP (immutable on the production server)`, async ({ request }) => {
      expect(url).toMatch(/\.[0-9a-f]{10}\.(svg|webp)$/);
      const response = await request.get(url);
      expect(response.status()).toBe(200);
      const headers = response.headers();
      expect(headers['content-security-policy']).toBeUndefined();
      if (prod) expect(headers['cache-control']).toBe(IMMUTABLE);
    });
  }

  test('a page still carries the nonce CSP', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-security-policy']).toMatch(/nonce-/);
  });
});
