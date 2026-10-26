import { test, expect, type Locator, type Page } from '@playwright/test';
import { buildPhotoViews } from '@/lib/photos/view-model';
import { LB_CHROME_PX, LB_GUTTER_PX } from '@/lib/photos/lightbox-tiers';
import {
  readViewTransitions,
  recordViewTransitions,
  removeViewTransitions,
} from './helpers/view-transitions';

/**
 * The photo viewer in a browser (LBOX-01, LBOX-04, LBOX-07; D-05, D-08;
 * 10-UI-SPEC "Photo Viewer"). A directly loaded /photos/{slug} is the viewer
 * inside the shell: one banner, main and contentinfo, the title as the h1, an
 * "All photographs" link, the rights line, no dialog and no download control,
 * and the photo drawn from a content-hashed manifest derivative. Every
 * expected value is derived from buildPhotoViews(), never hand-typed.
 */

const views = buildPhotoViews();

/** A content-hashed manifest derivative: /images/photos/<name>.<10 hex>.<avif|webp>. */
const DERIVATIVE = /^\/images\/photos\/[a-z0-9-]+\.[0-9a-f]{10}\.(avif|webp)$/;

/** The formatters keep a unit on its number with U+00A0. */
const NBSP = String.fromCharCode(0xa0);

test.describe('Photo page (LBOX-01 direct load)', () => {
  for (const view of views) {
    test(`/photos/${view.slug}: the viewer inside the shell, no dialog (D-08)`, async ({
      page,
    }) => {
      const response = await page.goto(`/photos/${view.slug}`);
      expect(response?.status()).toBe(200);

      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      await expect(page.getByRole('dialog')).toHaveCount(0);

      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(view.title);
      await expect(main.getByText(view.rights, { exact: true })).toBeVisible();
      await expect(
        main.getByRole('link', { name: 'All photographs', exact: true })
      ).toHaveAttribute('href', '/photos');
      await expect(page).toHaveTitle(`${view.title} · Tim Lui`);

      // LBOX-07: no download control anywhere, and only hashed derivatives on the stage.
      await expect(page.locator('[download]')).toHaveCount(0);
      const img = page.locator('[data-photo-viewer] [data-stage-layer="large"] img');
      await expect(img).toHaveAttribute('alt', view.alt);
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
        .toBe(true);
      const currentSrc = await img.evaluate(
        (el: HTMLImageElement) => new URL(el.currentSrc).pathname
      );
      expect(currentSrc).toMatch(DERIVATIVE);
    });
  }

  test('the strip shows every field without filler (LBOX-04, D-07)', async ({ page }) => {
    for (const view of views) {
      await page.goto(`/photos/${view.slug}`);
      const main = page.getByRole('main');
      await expect(main).toContainText(view.strip.placeDate.place);
      await expect(main).toContainText(view.rights);
      if (view.strip.filmLine) {
        await expect(main).toContainText(view.strip.filmLine);
        await expect(main).toContainText(view.strip.approxNote ?? '(approx.)');
      }
      expect(await main.innerText()).not.toMatch(/—|\bundefined\b|\bnull\b|\bNaN\b|\bunknown\b/);
    }
    // The film scan is the one photo with a film line and a radius, so it is checked by value too.
    const film = views.find((v) => v.strip.filmLine);
    expect(film?.strip.filmLine).toBe('Film scan · 2019');
    expect(film?.strip.approxNote).toBe(`±100${NBSP}m (approx.)`);
  });
});

test.describe('Viewer layout tiers (D-05)', () => {
  const first = views[0];
  const ratio = first.aspect.w / first.aspect.h;
  const NAV_H = 64;

  /** The bounding box of a selector inside the viewer; fails when it is not rendered. */
  async function box(page: import('@playwright/test').Page, selector: string) {
    const rect = await page.locator(`[data-photo-viewer] ${selector}`).first().boundingBox();
    expect(rect, `${selector} has a box`).not.toBeNull();
    return rect!;
  }

  test('1440 x 900 gutter tier: contain-fit photo with 216 px gutters, 56 px chrome, two-column strip', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/photos/${first.slug}`);

    const viewer = await box(page, '');
    expect(Math.abs(viewer.height - (900 - NAV_H))).toBeLessThanOrEqual(1);
    const chrome = await box(page, '[data-viewer-chrome]');
    expect(chrome.height).toBe(LB_CHROME_PX);

    const stage = await box(page, '[data-viewer-stage]');
    const photo = await box(page, '[data-photo-box]');
    expect(Math.abs(photo.width / photo.height - ratio) / ratio).toBeLessThan(0.01);
    expect(photo.x).toBeGreaterThanOrEqual(stage.x + LB_GUTTER_PX - 0.5);
    expect(photo.x + photo.width).toBeLessThanOrEqual(stage.x + stage.width - LB_GUTTER_PX + 0.5);
    expect(photo.y).toBeGreaterThanOrEqual(stage.y - 0.5);
    expect(photo.y + photo.height).toBeLessThanOrEqual(stage.y + stage.height + 0.5);

    const identity = await box(page, '[data-strip-identity]');
    const data = await box(page, '[data-strip-data]');
    expect(data.x).toBeGreaterThan(identity.x + identity.width);
    expect(Math.abs(data.y - identity.y)).toBeLessThanOrEqual(1);

    // The 'All photographs' link is the first control of the chrome's left group.
    const link = page.getByRole('link', { name: 'All photographs', exact: true });
    await expect(link).toHaveCount(1);
    await expect(page.locator('[data-chrome-left]').getByRole('link')).toHaveText(
      'All photographs'
    );
  });

  test('1024 x 768 key tier: the photo fits the stage and the strip has two columns', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`/photos/${first.slug}`);

    const stage = await box(page, '[data-viewer-stage]');
    const photo = await box(page, '[data-photo-box]');
    expect(Math.abs(photo.width / photo.height - ratio) / ratio).toBeLessThan(0.01);
    expect(photo.x).toBeGreaterThanOrEqual(stage.x - 0.5);
    expect(photo.x + photo.width).toBeLessThanOrEqual(stage.x + stage.width + 0.5);
    expect(photo.y).toBeGreaterThanOrEqual(stage.y - 0.5);
    expect(photo.y + photo.height).toBeLessThanOrEqual(stage.y + stage.height + 0.5);
    // Largest box: it touches the stage on one axis.
    const fillsWidth = Math.abs(photo.width - stage.width) <= 1;
    const fillsHeight = Math.abs(photo.height - stage.height) <= 1;
    expect(fillsWidth || fillsHeight).toBe(true);

    const identity = await box(page, '[data-strip-identity]');
    const data = await box(page, '[data-strip-data]');
    expect(data.x).toBeGreaterThan(identity.x + identity.width);
    expect(Math.abs(data.y - identity.y)).toBeLessThanOrEqual(1);
  });

  test('375 x 800 scroll tier: back link row, sticky chrome, full-width photo, one-column strip', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`/photos/${first.slug}`);

    const link = page.getByRole('link', { name: 'All photographs', exact: true });
    await expect(link).toHaveCount(1);
    await expect(page.locator('[data-viewer-back]').getByRole('link')).toBeVisible();
    const linkBox = (await link.boundingBox())!;
    const chrome = await box(page, '[data-viewer-chrome]');
    expect(linkBox.y + linkBox.height).toBeLessThanOrEqual(chrome.y + 0.5);
    expect(chrome.height).toBe(LB_CHROME_PX);
    expect(
      await page
        .locator('[data-viewer-chrome]')
        .evaluate((el) => [getComputedStyle(el).position, getComputedStyle(el).top])
    ).toEqual(['sticky', `${NAV_H}px`]);

    const photo = await box(page, '[data-photo-box]');
    expect(Math.abs(photo.width / photo.height - ratio) / ratio).toBeLessThan(0.01);
    expect(photo.height).toBeLessThanOrEqual(800 * 0.7 + 0.5);
    // Full width of the viewer (the stable scrollbar gutter is outside it), unless 70svh caps it.
    const stage = await box(page, '[data-viewer-stage]');
    if (800 * 0.7 * ratio >= stage.width) {
      expect(Math.abs(photo.width - stage.width)).toBeLessThanOrEqual(1);
    } else {
      expect(Math.abs(photo.height - 800 * 0.7)).toBeLessThanOrEqual(1);
    }

    const identity = await box(page, '[data-strip-identity]');
    const data = await box(page, '[data-strip-data]');
    expect(data.y).toBeGreaterThanOrEqual(identity.y + identity.height);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });
});

test.describe('Stage states (UI-SPEC E5)', () => {
  // The production service worker answers cached derivatives itself, so
  // page.route would never see them (STATE 09-22); block it for these cases.
  test.use({ serviceWorkers: 'block' });

  const first = views[0];
  /** Every stage and opener derivative (the 1024, 1600 and 2560 AVIF and WebP files). */
  const STAGE_DERIVATIVE = /-(1024|1600|2560)\.[0-9a-f]{10}\.(avif|webp)$/;

  test('a failed photo shows the error and Retry; the chrome and strip stay usable (LBOX-07)', async ({
    page,
  }) => {
    await page.route(STAGE_DERIVATIVE, (route) => route.abort());
    await page.goto(`/photos/${first.slug}`);

    const photoBox = page.locator('[data-photo-viewer] [data-photo-box]');
    await expect(photoBox.getByText("Couldn't load this photo.", { exact: true })).toBeVisible();
    const retry = photoBox.getByRole('button', { name: 'Retry loading photo', exact: true });
    await expect(retry).toBeVisible();
    await expect(retry).toHaveText('Retry');
    await expect(page.locator('[data-stage-photo]')).toHaveAttribute('data-state', 'error');

    // The box keeps the photo's ratio.
    const rect = (await photoBox.boundingBox())!;
    const ratio = first.aspect.w / first.aspect.h;
    expect(Math.abs(rect.width / rect.height - ratio) / ratio).toBeLessThan(0.01);

    // The strip and the chrome stay usable; nothing offers the file.
    const main = page.getByRole('main');
    await expect(main.getByText(first.rights, { exact: true })).toBeVisible();
    await expect(main.getByRole('link', { name: 'All photographs', exact: true })).toBeVisible();
    await expect(page.locator('[download]')).toHaveCount(0);
    await expect(page.locator('a[href*="/images/"]')).toHaveCount(0);
  });

  test('Retry reloads the large derivative once the network is back', async ({ page }) => {
    await page.route(STAGE_DERIVATIVE, (route) => route.abort());
    await page.goto(`/photos/${first.slug}`);
    const photoBox = page.locator('[data-photo-viewer] [data-photo-box]');
    const retry = photoBox.getByRole('button', { name: 'Retry loading photo', exact: true });
    await expect(retry).toBeVisible();

    await page.unroute(STAGE_DERIVATIVE);
    await retry.click();

    const large = photoBox.locator('[data-stage-layer="large"] img');
    await expect
      .poll(() => large.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
    await expect(page.locator('[data-stage-photo]')).toHaveAttribute('data-state', 'large');
    await expect(photoBox.getByText("Couldn't load this photo.", { exact: true })).toHaveCount(0);
    await expect(retry).toHaveCount(0);
  });

  test('a slow photo shows "Loading photo" after 1 s and clears it once the photo loads', async ({
    page,
  }) => {
    // Hold every stage derivative until the message has been seen (at least 1.5 s),
    // so the check does not depend on how fast the dev server hydrates.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route(STAGE_DERIVATIVE, async (route) => {
      await gate;
      await route.continue();
    });

    const start = Date.now();
    await page.goto(`/photos/${first.slug}`, { waitUntil: 'domcontentloaded' });
    const photoBox = page.locator('[data-photo-viewer] [data-photo-box]');
    const loading = photoBox.getByText('Loading photo', { exact: true });
    await expect(page.locator('[data-stage-photo]')).toHaveAttribute('data-state', 'opener');
    await expect(loading).toBeVisible({ timeout: 10000 });
    expect(Date.now() - start).toBeGreaterThanOrEqual(1000);

    await page.waitForTimeout(Math.max(0, 1500 - (Date.now() - start)));
    release();

    await expect(loading).toHaveCount(0);
    const large = photoBox.locator('[data-stage-layer="large"] img');
    await expect
      .poll(() => large.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
  });
});

/** The grid list at /photos?view=grid (10-04); its tile links open the lightbox. */
const GRID_LIST = 'Photographs, lowest first';
const GRID_URL = /\/photos\?view=grid$/;

/**
 * Wait until React has hydrated a link. A click on a server-rendered
 * next/link before hydration is a plain document navigation, which is never
 * intercepted (it would land on the full page and no dialog would open), and
 * the dev server can take seconds to hydrate under parallel load.
 */
async function waitForHydration(link: Locator) {
  await expect
    .poll(() => link.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))), {
      timeout: 15000,
    })
    .toBe(true);
}

/** Click a grid tile (already on the grid, hydrated) and wait for the dialog. */
async function clickTile(page: Page, index = 0) {
  const tile = page.getByRole('list', { name: GRID_LIST }).getByRole('link').nth(index);
  await waitForHydration(tile);
  await tile.click();
  const dialog = page.getByRole('dialog');
  // The dev server compiles the intercepted route on its first request.
  await expect(dialog).toBeVisible({ timeout: 20000 });
  return dialog;
}

/** Open the first grid tile in-site and wait for the dialog. */
async function openFirstTile(page: Page) {
  await page.goto('/photos?view=grid');
  return clickTile(page, 0);
}

test.describe('Lightbox over the gallery (LBOX-01)', () => {
  const first = views[0];

  test('a tile click opens the photo in a dialog over the grid', async ({ page }) => {
    const dialog = await openFirstTile(page);
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(dialog).toHaveAccessibleName(first.title);
    await expect(dialog.getByRole('heading', { level: 2, name: first.title })).toBeVisible();
    // The gallery stays mounted behind the dialog, inside the one shell.
    // The page behind a modal dialog is inert, so these queries include it.
    await expect(page.getByRole('list', { name: GRID_LIST, includeHidden: true })).toHaveCount(1);
    await expect(page.getByRole('banner', { includeHidden: true })).toHaveCount(1);
    await expect(page).toHaveTitle(`${first.title} · Tim Lui`);
  });

  test('Back closes it, Forward reopens it, reload lands on the full page', async ({ page }) => {
    await openFirstTile(page);

    await page.goBack();
    await expect(page).toHaveURL(GRID_URL);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(first.title);
  });

  test('the Close photo button closes it and the URL returns to the grid', async ({ page }) => {
    const dialog = await openFirstTile(page);
    await dialog.getByRole('button', { name: 'Close photo', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(GRID_URL);
  });
});

test.describe('Focus and Escape (LBOX-03)', () => {
  const first = views[0];

  /** True when document.activeElement is inside the open dialog. */
  const focusInDialog = (page: Page) =>
    page.evaluate(() => document.activeElement?.closest('dialog[open]') != null);

  test('focus moves to Close photo on open', async ({ page }) => {
    const dialog = await openFirstTile(page);
    await expect(dialog.getByRole('button', { name: 'Close photo', exact: true })).toBeFocused();
  });

  test('Tab and Shift+Tab, 12 presses each, keep focus inside the dialog', async ({ page }) => {
    await openFirstTile(page);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await focusInDialog(page), `after Tab ${i + 1}`).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await focusInDialog(page), `after Shift+Tab ${i + 1}`).toBe(true);
    }
  });

  test('Escape closes through the router and focus returns to the photo tile', async ({ page }) => {
    await openFirstTile(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(GRID_URL);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(first.slug);
  });

  test('three open-and-Escape cycles in a row each close with the URL in sync', async ({
    page,
  }) => {
    await page.goto('/photos?view=grid');
    for (let cycle = 1; cycle <= 3; cycle++) {
      await clickTile(page, 0);
      await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog'), `cycle ${cycle}`).toHaveCount(0);
      await expect(page, `cycle ${cycle}`).toHaveURL(GRID_URL);
    }
  });

  test('opening from a scrolled grid and closing leaves the scroll position unchanged', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await page.goto('/photos?view=grid');
    const third = page.getByRole('list', { name: GRID_LIST }).getByRole('link').nth(2);
    await third.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    expect(before, 'the grid must be scrolled to its second row').toBeGreaterThan(0);

    await clickTile(page, 2);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(views[2].slug);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('on the photo page, Escape goes to /photos (D-08)', async ({ page }) => {
    await page.goto(`/photos/${first.slug}`);
    const back = page.getByRole('main').getByRole('link', { name: 'All photographs' }).first();
    await waitForHydration(back);
    await page.waitForLoadState('load');
    // The listener attaches in an effect just after hydration; under parallel
    // dev-server load a press can land before it, so press again until it does.
    await expect(async () => {
      await page.keyboard.press('Escape');
      await expect(page).toHaveURL(/\/photos$/, { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('Moving between photos (LBOX-02)', () => {
  const first = views[0];
  const last = views[views.length - 1];

  /** The viewer's counter ('n / 4', aria-hidden) and its polite status line. */
  const counter = (scope: Page | Locator) => scope.locator('[data-photo-counter]');
  const status = (scope: Page | Locator) => scope.locator('[data-photo-viewer] p[role="status"]');

  test('three Next presses in the lightbox: URL, title, counter, focus and no history entry', async ({
    page,
  }) => {
    const dialog = await openFirstTile(page);
    const length = await page.evaluate(() => window.history.length);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    await expect(counter(dialog)).toHaveText(`1 / ${views.length}`);
    await expect(counter(dialog)).toHaveAttribute('aria-hidden', 'true');

    for (let i = 0; i < 3; i++) await next.click();

    await expect(page).toHaveURL(new RegExp(`/photos/${last.slug}$`));
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(last.title);
    await expect(counter(dialog)).toHaveText(`${views.length} / ${views.length}`);
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toBeFocused();
    await expect(status(dialog)).toHaveText(
      `Photo ${views.length} of ${views.length}: ${last.title}`
    );
    await expect(status(dialog)).toHaveAttribute('aria-atomic', 'true');
    await expect(page).toHaveTitle(`${last.title} · Tim Lui`);
    expect(await page.evaluate(() => window.history.length)).toBe(length);
    // The viewer never remounted: the dialog is still the open one.
    await expect(page.getByRole('dialog')).toHaveCount(1);
  });

  test('the arrow keys step, and nothing moves past either end', async ({ page }) => {
    const dialog = await openFirstTile(page);
    const prev = dialog.getByRole('button', { name: 'Previous photo', exact: true });
    await expect(prev).toHaveAttribute('aria-disabled', 'true');

    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`/photos/${views[1].slug}$`));
    await expect(counter(dialog)).toHaveText(`2 / ${views.length}`);

    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(counter(dialog)).toHaveText(`1 / ${views.length}`);

    // At 1 / 4 neither ArrowLeft nor a press on the disabled Previous changes anything.
    await page.keyboard.press('ArrowLeft');
    await prev.click({ force: true });
    await expect(prev).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(counter(dialog)).toHaveText(`1 / ${views.length}`);
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(first.title);
    // The ignored presses announce nothing new: the line still names the last real step.
    await expect(status(dialog)).toHaveText(`Photo 1 of ${views.length}: ${first.title}`);
  });

  test('a touch swipe on the photo steps to the next photo @chromium-only', async ({ page }) => {
    const dialog = await openFirstTile(page);
    const photoBox = dialog.locator('[data-photo-box]');
    const rect = (await photoBox.boundingBox())!;
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    const touch = { pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true };
    await photoBox.dispatchEvent('pointerdown', { ...touch, clientX: x, clientY: y, buttons: 1 });
    await photoBox.dispatchEvent('pointermove', {
      ...touch,
      clientX: x - 60,
      clientY: y + 5,
      buttons: 1,
    });
    await photoBox.dispatchEvent('pointerup', { ...touch, clientX: x - 120, clientY: y + 10 });

    await expect(page).toHaveURL(new RegExp(`/photos/${views[1].slug}$`));
    await expect(counter(dialog)).toHaveText(`2 / ${views.length}`);
  });

  test('closing after two steps returns focus to the tile of the photo shown', async ({ page }) => {
    const dialog = await openFirstTile(page);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    await next.click();
    await next.click();
    await expect(page).toHaveURL(new RegExp(`/photos/${views[2].slug}$`));

    await dialog.getByRole('button', { name: 'Close photo', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(GRID_URL);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(views[2].slug);
  });

  test('on the photo page Next shows the next photo with no dialog, and reload keeps it (Pitfall 1)', async ({
    page,
  }) => {
    await page.goto(`/photos/${first.slug}`);
    const main = page.getByRole('main');
    const next = main.getByRole('button', { name: 'Next photo', exact: true });
    await waitForHydration(next);
    const length = await page.evaluate(() => window.history.length);

    await next.click();
    await expect(page).toHaveURL(new RegExp(`/photos/${views[1].slug}$`));
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(views[1].title);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(next).toBeFocused();
    await expect(page).toHaveTitle(`${views[1].title} · Tim Lui`);
    expect(await page.evaluate(() => window.history.length)).toBe(length);

    await page.reload();
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(
      views[1].title
    );
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('Morph and motion (LBOX-06)', () => {
  const first = views[0];
  /** The morph pair's pseudo-elements for a slug. */
  const morphPseudos = (slug: string) => [
    `::view-transition-group(photo-${slug})`,
    `::view-transition-old(photo-${slug})`,
    `::view-transition-new(photo-${slug})`,
  ];

  test('opening from the grid morphs the tile into the lightbox photo @chromium-only', async ({
    page,
  }) => {
    await recordViewTransitions(page);
    await page.goto('/photos?view=grid');
    const before = await readViewTransitions(page);
    await clickTile(page, 0);

    await expect
      .poll(async () => (await readViewTransitions(page)).count)
      .toBeGreaterThan(before.count);
    await expect
      .poll(async () => (await readViewTransitions(page)).pseudos)
      .toEqual(expect.arrayContaining(morphPseudos(first.slug)));
  });

  test('browser Back closes with no view transition @chromium-only', async ({ page }) => {
    await recordViewTransitions(page);
    await openFirstTile(page);
    await expect.poll(async () => (await readViewTransitions(page)).count).toBeGreaterThan(0);
    // Let the open transition finish before measuring.
    await page.waitForTimeout(800);
    const before = (await readViewTransitions(page)).count;

    await page.goBack();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.waitForTimeout(500);
    expect((await readViewTransitions(page)).count).toBe(before);
  });

  test('a step morphs nothing: no photo-* pseudo-element @chromium-only', async ({ page }) => {
    await recordViewTransitions(page);
    const dialog = await openFirstTile(page);
    await page.waitForTimeout(800);
    const before = (await readViewTransitions(page)).transitions.length;

    await dialog.getByRole('button', { name: 'Next photo', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/photos/${views[1].slug}$`));
    await page.waitForTimeout(800);
    const after = (await readViewTransitions(page)).transitions.slice(before).flat();
    expect(after.filter((pseudo) => pseudo.includes('photo-'))).toEqual([]);
  });

  test('no duplicate view-transition-name across open, three steps and close', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (message) => {
      // The browser's duplicate-name error, and React's dev warning for two
      // mounted <ViewTransition> boundaries with one name.
      if (/view-transition-name|ViewTransition name=/.test(message.text())) {
        messages.push(message.text());
      }
    });
    const dialog = await openFirstTile(page);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    for (let i = 1; i <= 3; i++) {
      await next.click();
      await expect(page).toHaveURL(new RegExp(`/photos/${views[i].slug}$`));
    }
    await dialog.getByRole('button', { name: 'Close photo', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(messages).toEqual([]);
  });

  test('under reduced motion the open runs no view-transition animation @chromium-only', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await recordViewTransitions(page);
    await page.goto('/photos?view=grid');
    const before = await readViewTransitions(page);
    const dialog = await clickTile(page, 0);
    await expect(dialog.getByRole('button', { name: 'Close photo', exact: true })).toBeFocused();
    await page.waitForTimeout(500);

    const after = await readViewTransitions(page);
    const opened = after.transitions.slice(before.transitions.length).flat();
    expect(opened.filter((pseudo) => pseudo.startsWith('::view-transition'))).toEqual([]);
  });

  test('without the View Transitions API the tile still opens with focus on Close', async ({
    page,
  }) => {
    await removeViewTransitions(page);
    await page.goto('/photos?view=grid');
    expect(await page.evaluate(() => 'startViewTransition' in document)).toBe(false);
    const dialog = await clickTile(page, 0);
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(dialog.getByRole('button', { name: 'Close photo', exact: true })).toBeFocused();
  });
});
