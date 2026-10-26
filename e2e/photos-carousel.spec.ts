import { test, expect, type Locator, type Page } from '@playwright/test';
import { buildPhotoViews } from '@/lib/photos/view-model';

/**
 * The Carousel view at /photos?view=carousel (PHOTO-02, PHOTO-03, PHOTO-04;
 * D-12, D-13; 10-UI-SPEC "Carousel View"; 10-RESEARCH Pattern 7, Pitfall 7).
 *
 * - D-13: the Home capability gate decides. Under reduced motion (and every
 *   other static result) the flat stepper renders: no canvas, and no script
 *   the page loads contains three.js.
 * - D-12 / PHOTO-04: visible controls, a counter, a primary "Open photo", and
 *   nothing ever advances by itself (the counter is unchanged after 6 s idle).
 * - Pitfall 7: ← and → step only while focus is inside the region; there is
 *   no window listener, so a press elsewhere changes nothing.
 * - "Return on close": the front photo follows the lightbox, so Escape puts
 *   focus on "Open photo" for the photo shown at close.
 *
 * Every expected value is derived from buildPhotoViews() (the one order).
 */

const views = buildPhotoViews();
const CAROUSEL_URL = '/photos?view=carousel';

const region = (page: Page) => page.getByRole('region', { name: 'Photographs', exact: true });
const counter = (page: Page) => region(page).locator('[data-carousel-counter]');
const prev = (page: Page) => region(page).getByRole('button', { name: 'Previous photo', exact: true });
const next = (page: Page) => region(page).getByRole('button', { name: 'Next photo', exact: true });
const openPhoto = (page: Page) => region(page).getByRole('link', { name: 'Open photo', exact: true });

/**
 * Wait until React has hydrated an element. A click on server-rendered markup
 * before hydration does nothing (a button) or is a plain document navigation
 * (a link, never intercepted), and the dev server can be slow to hydrate.
 */
async function waitForHydration(target: Locator) {
  await expect
    .poll(() => target.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))), {
      timeout: 15000,
    })
    .toBe(true);
}

/** Bodies of every same-origin script the page loaded (from its resource entries, refetched). */
async function loadedScriptBodies(page: Page): Promise<{ url: string; body: string }[]> {
  const urls = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry as PerformanceResourceTiming)
      .filter(
        (entry) => entry.initiatorType === 'script' || /\.m?js(\?|$)/.test(new URL(entry.name).pathname)
      )
      .map((entry) => entry.name)
      .filter((url) => new URL(url).origin === location.origin)
  );
  const unique = [...new Set(urls)];
  return Promise.all(
    unique.map(async (url) => ({ url, body: await (await page.request.get(url)).text() }))
  );
}

/** The data-photo-id of the focused element. */
const focusedPhotoId = (page: Page) =>
  page.evaluate(() => document.activeElement?.getAttribute('data-photo-id') ?? null);

test.describe('Carousel stepper (reduced motion; PHOTO-02, PHOTO-04, D-12, D-13)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('the stepper shows one photo with the controls and never advances by itself', async ({
    page,
  }) => {
    await page.goto(CAROUSEL_URL);

    const carousel = region(page);
    await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    await expect(carousel).toHaveAttribute('data-carousel-mode', 'stepper');
    await expect(carousel).toHaveAttribute('data-active-slug', views[0].slug);
    await expect(page.locator('canvas')).toHaveCount(0);

    await expect(counter(page)).toHaveText(`1 / ${views.length}`);
    await expect(counter(page)).toHaveAttribute('aria-hidden', 'true');
    await expect(prev(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(next(page)).not.toHaveAttribute('aria-disabled', 'true');
    await expect(carousel.getByText(views[0].title, { exact: true })).toBeVisible();
    await expect(openPhoto(page)).toHaveAttribute('href', `/photos/${views[0].slug}`);
    await expect(openPhoto(page)).toHaveAttribute('data-photo-id', views[0].slug);
    await expect(carousel.locator('[data-carousel-stepper] img')).toHaveAttribute('alt', views[0].alt);

    // Previous at 1 / 4 is ignored; Next steps and announces.
    await waitForHydration(next(page));
    await prev(page).click();
    await expect(counter(page)).toHaveText(`1 / ${views.length}`);
    await next(page).click();
    await expect(counter(page)).toHaveText(`2 / ${views.length}`);
    await expect(carousel).toHaveAttribute('data-active-slug', views[1].slug);
    await expect(carousel.getByRole('status')).toHaveText(
      `Photo 2 of ${views.length}: ${views[1].title}`
    );
    await expect(openPhoto(page)).toHaveAttribute('href', `/photos/${views[1].slug}`);
    await expect(openPhoto(page)).toHaveAttribute('data-photo-id', views[1].slug);
    await expect(carousel.locator('[data-carousel-stepper] img')).toHaveAttribute('alt', views[1].alt);

    // PHOTO-04: no timer. Six idle seconds change nothing.
    await page.waitForTimeout(6000);
    await expect(counter(page)).toHaveText(`2 / ${views.length}`);
    await expect(carousel).toHaveAttribute('data-active-slug', views[1].slug);

    // The last photo disables Next (no wrap, UI-SPEC OQ4), which stays focusable.
    for (let n = 3; n <= views.length; n++) await next(page).click();
    await expect(counter(page)).toHaveText(`${views.length} / ${views.length}`);
    await expect(next(page)).toHaveAttribute('aria-disabled', 'true');
    await next(page).click();
    await expect(counter(page)).toHaveText(`${views.length} / ${views.length}`);
    await expect(next(page)).toBeFocused();
  });

  test('the stepper keys act only with focus inside the region (Pitfall 7)', async ({ page }) => {
    await page.goto(CAROUSEL_URL);
    await expect(region(page)).toHaveAttribute('data-carousel-mode', 'stepper');
    await waitForHydration(next(page));

    await next(page).focus();
    await page.keyboard.press('ArrowRight');
    await expect(counter(page)).toHaveText(`2 / ${views.length}`);
    await page.keyboard.press('ArrowLeft');
    await expect(counter(page)).toHaveText(`1 / ${views.length}`);
    await page.keyboard.press('ArrowRight');
    await expect(counter(page)).toHaveText(`2 / ${views.length}`);

    // Focus outside the region: the same key does nothing.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect
      .poll(() => page.evaluate(() => document.activeElement === document.body))
      .toBe(true);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(counter(page)).toHaveText(`2 / ${views.length}`);
    await expect(region(page)).toHaveAttribute('data-active-slug', views[1].slug);
  });

  test('the stepper opens the lightbox and Escape returns focus to Open photo', async ({ page }) => {
    await page.goto(CAROUSEL_URL);
    await expect(region(page)).toHaveAttribute('data-carousel-mode', 'stepper');
    await waitForHydration(next(page));
    await next(page).click();
    await expect(counter(page)).toHaveText(`2 / ${views.length}`);

    await waitForHydration(openPhoto(page));
    await openPhoto(page).click();
    const dialog = page.getByRole('dialog');
    // The dev server compiles the intercepted route on its first request.
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog).toHaveAccessibleName(views[1].title);
    await expect(page).toHaveURL(new RegExp(`/photos/${views[1].slug}$`));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/photos\?view=carousel$/);
    await expect.poll(() => focusedPhotoId(page)).toBe(views[1].slug);
    await expect(openPhoto(page)).toBeFocused();
  });

  test('the stepper front photo follows a step inside the lightbox', async ({ page }) => {
    await page.goto(CAROUSEL_URL);
    await expect(region(page)).toHaveAttribute('data-carousel-mode', 'stepper');
    await waitForHydration(openPhoto(page));
    await openPhoto(page).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog).toHaveAccessibleName(views[0].title);

    // A step inside the dialog: the region's own key handler must not also step.
    await dialog.getByRole('button', { name: 'Next photo', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/photos/${views[1].slug}$`));
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expect(region(page)).toHaveAttribute('data-active-slug', views[1].slug);
    await expect(counter(page)).toHaveText(`2 / ${views.length}`);
    await expect.poll(() => focusedPhotoId(page)).toBe(views[1].slug);
    await expect(openPhoto(page)).toBeFocused();
  });

  test('the stepper page loads no three.js (D-13)', async ({ page }) => {
    await page.goto(CAROUSEL_URL);
    await expect(region(page)).toHaveAttribute('data-carousel-mode', 'stepper');
    await page.waitForTimeout(3000);

    await expect(page.locator('canvas')).toHaveCount(0);
    const scripts = await loadedScriptBodies(page);
    expect(scripts.length).toBeGreaterThan(0);
    const three = scripts.filter((s) => s.body.includes('THREE.WebGLRenderer')).map((s) => s.url);
    expect(three, 'scripts containing THREE.WebGLRenderer').toEqual([]);
  });
});
