import { test, expect, type Page } from '@playwright/test';
import { site } from '@/data/site';
import { photoViews } from '@/lib/photos/view-model';

/**
 * The offline page (EDGE-02, D-12; 12-UI-SPEC "Per-page content" /offline and
 * E11 saved-pages list).
 *
 * The functional projects block service workers, so nothing here depends on
 * the worker: the page is visited online, and Cache Storage (which works
 * without a worker) is seeded by the test itself. What the worker stores and
 * serves offline is covered by the SW Jest harness (12-08) and the SW spec
 * (12-17). Data-driven: the photo and the nav label come from the data
 * modules, never a literal slug.
 */

const firstPhoto = photoViews[0];
const roadmap = site.nav.find((item) => item.href === '/roadmap')!;

const H1 = "You're offline";
const BODY = "This page needs a connection and reloads by itself when you're back online.";
const EMPTY = 'No pages are saved on this device yet.';
const UNSUPPORTED = "This browser can't list saved pages.";

/** Cache keys the seeded test stores: two pages, plus four entries the list must drop. */
const SEEDED = ['/roadmap', '/roadmap?view=1', '/offline', '/_next/static/e2e-seed.js', `/photos/${firstPhoto.slug}`];

function savedRegion(page: Page) {
  return page.getByRole('region', { name: 'Saved on this device' });
}

/** The aria-hidden EdgeArt sheet: the box holding the dashed trail. */
function artSheet(page: Page) {
  return page.locator('main [aria-hidden="true"]:has(svg path[stroke-dasharray="8 6"])').first();
}

async function seedCache(page: Page, paths: readonly string[]) {
  await page.evaluate(async (list) => {
    const cache = await caches.open('e2e-seed');
    await Promise.all(
      list.map((path) =>
        cache.put(
          new Request(path),
          new Response('<!doctype html><title>seed</title>', { headers: { 'content-type': 'text/html' } })
        )
      )
    );
  }, paths);
}

test.describe('Offline page (EDGE-02, D-12)', () => {
  test('head: title "Offline · Tim Lui" and a robots noindex meta', async ({ page }) => {
    await page.goto('/offline');

    await expect(page).toHaveTitle('Offline · Tim Lui');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveCount(1);
    await expect(robots).toHaveAttribute('content', /\bnoindex\b/);
  });

  test('edge layout: kicker, h1, body, Try again and the art sheet; the old card is gone', async ({ page }) => {
    await page.goto('/offline');
    const main = page.locator('main');

    await expect(main.getByText('Offline', { exact: true })).toBeVisible();
    await expect(main.getByRole('heading', { level: 1, name: H1 })).toBeVisible();
    await expect(main.getByText(BODY)).toBeVisible();
    await expect(main.getByRole('button', { name: 'Try again' })).toBeVisible();

    const sheet = artSheet(page);
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('circle')).toHaveCount(1);
    await expect(sheet.locator('a, button, [tabindex]')).toHaveCount(0);

    // No focus move on this page, and the v1 card, icon and links are gone.
    await expect(main.getByRole('heading', { level: 1 })).not.toBeFocused();
    await expect(main.getByText(/Good news/)).toHaveCount(0);
    await expect(main.getByRole('link', { name: 'Go to Homepage' })).toHaveCount(0);
  });

  test('empty state: a fresh context lists nothing and says so', async ({ page }) => {
    await page.goto('/offline');
    const region = savedRegion(page);

    await expect(region.getByRole('heading', { level: 2, name: 'Saved on this device' })).toBeVisible();
    await expect(region.getByText(EMPTY)).toBeVisible();
    await expect(region.getByRole('list')).toHaveCount(0);
  });

  test('seeded Cache Storage: exactly the two cached pages, in nav then photo order, no raw URL', async ({
    page,
  }) => {
    await page.goto('/offline');
    await expect(savedRegion(page).getByText(EMPTY)).toBeVisible();
    const artBefore = await artSheet(page).boundingBox();

    await seedCache(page, SEEDED);
    await page.reload();

    const region = savedRegion(page);
    const links = region.getByRole('list').getByRole('link');
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAttribute('href', '/roadmap');
    await expect(links.nth(0)).toHaveText(roadmap.label);
    await expect(links.nth(1)).toHaveAttribute('href', `/photos/${firstPhoto.slug}`);
    await expect(links.nth(1)).toContainText(firstPhoto.title);
    await expect(links.nth(1)).toContainText('Photograph');

    const text = (await region.textContent()) ?? '';
    expect(text).not.toMatch(/https?:|\/photos\/|\/roadmap|\?view|_next|\/offline/);

    for (const box of [await links.nth(0).boundingBox(), await links.nth(1).boundingBox()]) {
      expect(box!.height).toBeGreaterThanOrEqual(48);
    }

    // The list arrives at the end of the extra slot; the art does not move.
    const artAfter = await artSheet(page).boundingBox();
    expect(artAfter!.y).toBeCloseTo(artBefore!.y, 0);
    expect(artAfter!.x).toBeCloseTo(artBefore!.x, 0);
  });

  test('unsupported: without the caches API the list says it cannot read saved pages', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'caches', { configurable: true, value: undefined });
    });
    await page.goto('/offline');

    await expect(savedRegion(page).getByText(UNSUPPORTED)).toBeVisible();
    await expect(savedRegion(page).getByRole('list')).toHaveCount(0);
  });

  test('375 px: no horizontal scroll, and the sheet stays square inside the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/offline');
    await expect(page.getByRole('heading', { level: 1, name: H1 })).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

    const sheet = await artSheet(page).boundingBox();
    expect(sheet!.width).toBeLessThanOrEqual(375);
    expect(Math.abs(sheet!.width - sheet!.height)).toBeLessThanOrEqual(1);
  });
});
