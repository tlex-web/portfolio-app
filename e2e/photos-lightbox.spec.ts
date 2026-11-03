import { test, expect, type Locator, type Page } from '@playwright/test';
import { buildPhotoViews } from '@/lib/photos/view-model';
import { HOTSPOT_PREF_KEY } from '@/lib/photos/hotspot-pref';
import { LB_CHROME_PX, LB_GUTTER_PX } from '@/lib/photos/lightbox-tiers';
import {
  readViewTransitions,
  recordViewTransitions,
  removeViewTransitions,
} from './helpers/view-transitions';
import { pressButton, tabReachesLinks } from './helpers/engine';

/**
 * The photo viewer in a browser (LBOX-01, LBOX-04, LBOX-07; D-05, D-08;
 * 10-UI-SPEC "Photo Viewer"). A directly loaded /photos/{slug} is the viewer
 * inside the shell: one banner, main and contentinfo, the title as the h1, an
 * "All photographs" link, the rights line, no dialog and no download control,
 * and the photo drawn from a content-hashed manifest derivative. Every
 * expected value is derived from buildPhotoViews(), never hand-typed.
 */

/*
 * Tests in this file run in order in one worker, each retried on its own
 * (12-22, D-26). On the dev server with the default worker count (16 here),
 * every worker compiling and soft-navigating the photo routes at once slowed
 * lightbox navigations past their timeouts: 16 of 52 tests failed in one run of
 * this file alone, and 52 of 52 passed with --workers=2. The production server
 * that CI uses (one worker) runs these tests in order already, so CI is
 * unaffected; no timeout or assertion changes.
 */
test.describe.configure({ mode: 'default' });

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
    // One full page load per photo (nine) in one test: on a loaded dev server they can
    // outrun the 30 s default, so the budget is tripled (12-22, D-26). Assertions unchanged.
    test.slow();
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

/**
 * Record every client-side navigation request the page starts: an RSC fetch
 * (`rsc: 1`) that is not a prefetch (no `next-router-prefetch`), as a
 * pathname. Next starts that fetch inside router.push(), so a read right after
 * a key press shows whether the press navigated.
 */
async function recordNavigations(page: Page) {
  await page.addInitScript(() => {
    const record: string[] = [];
    (window as unknown as { __navigations: string[] }).__navigations = record;
    const original = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : null;
      const headers = new Headers(init?.headers ?? request?.headers);
      if (headers.get('rsc') === '1' && !headers.has('next-router-prefetch')) {
        record.push(new URL(request ? request.url : String(input), location.href).pathname);
      }
      return original(input, init);
    };
  });
}

/** The navigation requests recordNavigations() has seen so far. */
const navigations = (page: Page) =>
  page.evaluate(() => [...(window as unknown as { __navigations: string[] }).__navigations]);

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

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('Back closes it, Forward reopens it, reload lands on the full page @no-win-webkit', async ({ page }) => {
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

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('the Close photo button closes it and the URL returns to the grid @no-win-webkit', async ({ page }) => {
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

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('Escape closes through the router and focus returns to the photo tile @no-win-webkit', async ({ page }) => {
    await openFirstTile(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(GRID_URL);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(first.slug);
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('three open-and-Escape cycles in a row each close with the URL in sync @no-win-webkit', async ({
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

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('opening from a scrolled grid and closing leaves the scroll position unchanged @no-win-webkit', async ({
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

  test('on the photo page at 375, the open nav menu keeps its keys: Escape closes it and the photo stays (10-REVIEW CR-01)', async ({
    page,
    browserName,
  }) => {
    await recordNavigations(page);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`/photos/${first.slug}`);
    const main = page.getByRole('main');
    const next = main.getByRole('button', { name: 'Next photo', exact: true });
    const zoom = main.getByRole('button', { name: 'Zoom photo', exact: true });
    const hide = main.getByRole('button', { name: 'Hide labels', exact: true });
    const menuButton = page.getByRole('banner').getByRole('button', { name: 'Menu', exact: true });
    const menu = page.locator('#site-menu');
    await waitForHydration(next);
    await waitForHydration(menuButton);
    await page.waitForLoadState('load');
    const length = await page.evaluate(() => window.history.length);

    // The viewer's keys are live: from the content, → and ← step.
    await next.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`/photos/${views[1].slug}$`));
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));

    // A keyboard user opens the menu and moves into it.
    await menuButton.focus();
    await page.keyboard.press('Enter');
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();
    // The menu rows are links, which WebKit never Tabs to (helpers/engine.ts).
    if (tabReachesLinks(browserName)) await page.keyboard.press('Tab');
    else await menu.getByRole('link').first().focus();
    await expect(menu.getByRole('link').first()).toBeFocused();

    // The arrows, Z and H belong to the menu now, not to the photo behind it. A
    // step (replaceState) and Hide labels (localStorage) would act inside the
    // key handler, so the reads right after each press are exact.
    for (const key of ['ArrowRight', 'ArrowLeft', 'z', 'h']) {
      await page.keyboard.press(key);
      expect(await page.evaluate(() => window.location.pathname), `after ${key}`).toBe(
        `/photos/${first.slug}`
      );
      expect(
        await page.evaluate((k) => window.localStorage.getItem(k), HOTSPOT_PREF_KEY),
        `after ${key}`
      ).toBeNull();
    }

    // Escape closes the menu to its button, and only the menu: the press
    // starts no navigation (router.push fetches inside the key handler, so the
    // read right after the press is exact).
    const before = await navigations(page);
    await page.keyboard.press('Escape');
    expect(await navigations(page), 'Escape in the menu navigated').toEqual(before);
    await expect(menu).toBeHidden();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toBeFocused();
    await expect(zoom).toHaveAttribute('aria-pressed', 'false');
    await expect(hide).toHaveAttribute('aria-pressed', 'false');

    // Still on the photo page: a step from the content works, and no history
    // entry was added (a stray router.push('/photos') adds one).
    await next.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`/photos/${views[1].slug}$`));
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(views[1].title);
    expect(await page.evaluate(() => window.history.length)).toBe(length);

    // From the content, Escape still goes to the gallery (D-08), and the
    // recorder sees that navigation (so its silence above is meaningful).
    await page.keyboard.press('Escape');
    expect(await navigations(page)).toEqual([...before, '/photos']);
    await expect(page).toHaveURL(/\/photos$/);
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
    browserName,
  }) => {
    const dialog = await openFirstTile(page);
    const length = await page.evaluate(() => window.history.length);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    await expect(counter(dialog)).toHaveText(`1 / ${views.length}`);
    await expect(counter(dialog)).toHaveAttribute('aria-hidden', 'true');

    // A click, or focus and Enter in WebKit, where a click does not focus a button (helpers/engine.ts).
    for (let i = 0; i < 3; i++) await pressButton(next, browserName);

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

  test('the arrow keys step, and nothing moves past either end', async ({ page, browserName }) => {
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
    await pressButton(prev, browserName, { force: true });
    await expect(prev).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(counter(dialog)).toHaveText(`1 / ${views.length}`);
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(first.title);
    // The ignored presses announce nothing new: the line still names the last real step.
    await expect(status(dialog)).toHaveText(`Photo 1 of ${views.length}: ${first.title}`);
  });

  test('preload: opening a photo fetches the next photo derivative before Next is pressed', async ({
    page,
  }) => {
    const nextView = views[1];
    const urls = new Set(
      [
        nextView.stage.src,
        ...nextView.stage.srcSetAvif.split(',').map((u) => u.trim().split(' ')[0]),
      ].map((u) => new URL(u, 'http://localhost').pathname)
    );
    expect(urls.size).toBeGreaterThan(1);
    for (const u of urls) expect(u).toMatch(DERIVATIVE);

    await page.goto('/photos?view=grid');
    const tile = page.getByRole('list', { name: GRID_LIST }).getByRole('link').nth(0);
    await waitForHydration(tile);
    const preload = page.waitForRequest((request) => urls.has(new URL(request.url()).pathname), {
      timeout: 20000,
    });
    await tile.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await preload;
    // Still on the first photo: the fetch came from the preload, not from a step.
    await expect(page).toHaveURL(new RegExp(`/photos/${views[0].slug}$`));
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

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('closing after two steps returns focus to the tile of the photo shown @no-win-webkit', async ({ page }) => {
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

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('browser Back right after a step returns focus to the tile of the photo shown (10-REVIEW WR-01) @no-win-webkit', async ({
    page,
  }) => {
    const dialog = await openFirstTile(page);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    await waitForHydration(next);
    // The step and the Back in one task: usePathname has not caught up with
    // the step's replaceState when the lightbox closes.
    await next.evaluate((button: HTMLElement) => {
      button.click();
      window.history.back();
    });
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(GRID_URL);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(views[1].slug);
  });

  test('on the photo page Next shows the next photo with no dialog, and reload keeps it (Pitfall 1)', async ({
    page,
    browserName,
  }) => {
    await page.goto(`/photos/${first.slug}`);
    const main = page.getByRole('main');
    const next = main.getByRole('button', { name: 'Next photo', exact: true });
    await waitForHydration(next);
    const length = await page.evaluate(() => window.history.length);

    await pressButton(next, browserName);
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

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('no duplicate view-transition-name across open, three steps and close @no-win-webkit', async ({ page }) => {
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

test.describe('Zoom (D-06)', () => {
  /** A landscape photo (2560 px wide at 1:1) that has a next photo, and its grid position. */
  const zi = views.findIndex((v, i) => v.stage.width === 2560 && i < views.length - 1);
  const photo = views[zi];
  const nextPhoto = views[zi + 1];

  const zoomButton = (scope: Page | Locator) =>
    scope.getByRole('button', { name: 'Zoom photo', exact: true });
  const stage = (scope: Page | Locator) => scope.locator('[data-viewer-stage]');
  const zoomedImg = (scope: Page | Locator) => scope.locator('[data-zoom-photo] img');
  const scrollOf = (scope: Page | Locator) =>
    stage(scope).evaluate((el) => ({ left: el.scrollLeft, top: el.scrollTop }));

  /** Open the landscape photo's tile in the lightbox at 1440 x 900. */
  async function openZoomPhoto(page: Page) {
    expect(zi, 'a landscape photo with a next photo').toBeGreaterThanOrEqual(0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos?view=grid');
    return clickTile(page, zi);
  }

  /** Wait until the zoomed 1:1 photo has decoded. */
  async function zoomedLoaded(scope: Page | Locator) {
    await expect
      .poll(() =>
        zoomedImg(scope).evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)
      )
      .toBe(2560);
  }

  test('Z zooms to 1:1 of the 2560 px derivative and the stage scrolls', async ({ page }) => {
    const dialog = await openZoomPhoto(page);
    const button = zoomButton(dialog);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toHaveAttribute('aria-keyshortcuts', 'z');

    await page.keyboard.press('z');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await zoomedLoaded(dialog);
    const rect = (await zoomedImg(dialog).boundingBox())!;
    expect(Math.abs(rect.width - 2560)).toBeLessThanOrEqual(1);
    const { scrollWidth, clientWidth } = await stage(dialog).evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(scrollWidth).toBeGreaterThan(clientWidth);
    // Z centres the photo.
    const centred = await stage(dialog).evaluate((el) => ({
      left: (el.scrollWidth - el.clientWidth) / 2,
      top: (el.scrollHeight - el.clientHeight) / 2,
    }));
    const scroll = await scrollOf(dialog);
    expect(Math.abs(scroll.left - centred.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(scroll.top - centred.top)).toBeLessThanOrEqual(1);
  });

  test('the arrows pan 80 px while zoomed; after Escape they step again', async ({ page }) => {
    const dialog = await openZoomPhoto(page);
    await page.keyboard.press('z');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    const url = page.url();
    const before = await scrollOf(dialog);

    await page.keyboard.press('ArrowRight');
    await expect.poll(async () => (await scrollOf(dialog)).left).toBe(before.left + 80);
    await page.keyboard.press('ArrowDown');
    await expect.poll(async () => (await scrollOf(dialog)).top).toBe(before.top + 80);
    expect(page.url()).toBe(url);

    await page.keyboard.press('Escape');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('dialog')).toHaveCount(1);

    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`/photos/${nextPhoto.slug}$`));
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('Escape twice from zoomed closes the lightbox (LBOX-03) @no-win-webkit', async ({ page }) => {
    const dialog = await openZoomPhoto(page);
    await zoomButton(dialog).click();
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(GRID_URL);
  });

  test('a click zooms at the point, a drag pans and a click without movement unzooms', async ({
    page,
  }) => {
    const dialog = await openZoomPhoto(page);
    const box = (await dialog.locator('[data-photo-box]').boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.click(cx, cy);
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    // The clicked point (the photo's centre) stays under the pointer: the 1:1
    // photo's x under cx is its middle column. Measured at the pointer, not as a
    // centred scroll, because WebKit adds a classic scrollbar only once the stage
    // scrolls, which moves the viewport's centre off the fitted photo's (12-23).
    const underPointer = await stage(dialog).evaluate(
      (el, x) => el.scrollLeft + x - el.getBoundingClientRect().left - el.clientLeft,
      cx
    );
    expect(Math.abs(underPointer - photo.stage.width / 2)).toBeLessThanOrEqual(2);
    const start = await scrollOf(dialog);

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 50, cy, { steps: 5 });
    await page.mouse.move(cx - 100, cy, { steps: 5 });
    await page.mouse.up();
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    const dragged = await scrollOf(dialog);
    expect(Math.abs(dragged.left - (start.left + 100))).toBeLessThanOrEqual(1);

    await page.mouse.click(cx, cy);
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'false');
  });

  test('Next photo while zoomed shows the next photo fitted', async ({ page }) => {
    const dialog = await openZoomPhoto(page);
    await page.keyboard.press('z');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    await dialog.getByRole('button', { name: 'Next photo', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/photos/${nextPhoto.slug}$`));
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'false');
    await expect(zoomedImg(dialog)).toHaveCount(0);
    await expect(dialog.locator('[data-photo-box]')).toBeVisible();
  });

  test('on the photo page, Escape leaves zoom first, then goes to /photos', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/photos/${photo.slug}`);
    const main = page.getByRole('main');
    const button = zoomButton(main);
    await waitForHydration(button);
    await page.waitForLoadState('load');
    // The key listener attaches just after hydration; press until it takes.
    await expect(async () => {
      await page.keyboard.press('z');
      await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });

    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(page).toHaveURL(new RegExp(`/photos/${photo.slug}$`));
    await page.keyboard.press('Escape');
    // The dev server may compile /photos on this first visit.
    await expect(page).toHaveURL(/\/photos$/, { timeout: 15000 });
  });

  test('native pinch-zoom is never blocked: touch-action keeps pinch-zoom in both states', async ({
    page,
  }) => {
    const dialog = await openZoomPhoto(page);
    const touchAction = () => stage(dialog).evaluate((el) => getComputedStyle(el).touchAction);
    const cursor = () => stage(dialog).evaluate((el) => getComputedStyle(el).cursor);
    expect(await touchAction()).toContain('pinch-zoom');
    expect(
      await dialog.locator('[data-photo-box]').evaluate((el) => getComputedStyle(el).cursor)
    ).toBe('zoom-in');

    await page.keyboard.press('z');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    // 'pan-x pan-y pinch-zoom' is exactly what 'manipulation' means, and Chromium
    // computes it to that keyword.
    expect(['manipulation', 'pan-x pan-y pinch-zoom']).toContain(await touchAction());
    expect(await cursor()).toBe('grab');
  });
});

test.describe('Hotspots (LBOX-05)', () => {
  const trail = views.findIndex((v) => v.id === 'img-0662');
  const lake = views.find((v) => v.id === 'r004-011')!;
  const labels = (scope: Page | Locator) => scope.locator('[data-hotspot-label]');
  const markers = (scope: Page | Locator) => scope.locator('[data-hotspot-marker]');
  const hideLabels = (scope: Page | Locator) =>
    scope.getByRole('button', { name: 'Hide labels', exact: true });
  const zoomButton = (scope: Page | Locator) =>
    scope.getByRole('button', { name: 'Zoom photo', exact: true });

  /** Open the Glacier Trail photo (two hotspots) in the lightbox at the given size. */
  async function openTrail(page: Page, width = 1440, height = 900) {
    expect(trail).toBeGreaterThanOrEqual(0);
    await page.setViewportSize({ width, height });
    await page.goto('/photos?view=grid');
    return clickTile(page, trail);
  }

  /** Load a photo page and wait until its key listeners are attached (they follow hydration). */
  async function loadPage(page: Page, slug: string) {
    await page.goto(`/photos/${slug}`);
    const button = hideLabels(page.getByRole('main'));
    await waitForHydration(button);
    await page.waitForLoadState('load');
    return button;
  }

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('gutter tier: Enter expands a label, Escape collapses it to the label, then closes @no-win-webkit', async ({
    page,
  }) => {
    const dialog = await openTrail(page);
    await expect(labels(dialog)).toHaveCount(2);
    const first = labels(dialog).first();
    await expect(first).toBeVisible();
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(labels(dialog).nth(1)).toHaveAttribute('aria-expanded', 'false');

    await first.focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    const link = dialog.getByRole('link', { name: 'Wikipedia (opens in a new tab)' }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    // The panel sits in the gutter, never over the photo.
    const panel = dialog.locator(`[id="${await first.getAttribute('aria-controls')}"]`);
    const box = (await dialog.locator('[data-photo-box]').boundingBox())!;
    const panelBox = (await panel.boundingBox())!;
    expect(panelBox.x).toBeGreaterThanOrEqual(box.x + box.width);

    // From inside the panel, Escape collapses it and focus returns to its label.
    await link.focus();
    await page.keyboard.press('Escape');
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(first).toBeFocused();
    await expect(page.getByRole('dialog')).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('from zoomed with a callout open, Escape unwinds callout, then zoom, then close', async ({
    page,
  }) => {
    const dialog = await openTrail(page);
    const first = labels(dialog).first();
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('z');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    // Hotspots hide while zoomed (D-06).
    await expect(labels(dialog)).toHaveCount(0);
    await expect(markers(dialog)).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'false');
    await expect(labels(dialog).first()).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('a step collapses the open callout', async ({ page }) => {
    const dialog = await openTrail(page);
    await labels(dialog).first().click();
    await expect(labels(dialog).first()).toHaveAttribute('aria-expanded', 'true');
    await dialog.getByRole('button', { name: 'Previous photo', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/photos/${views[trail - 1].slug}$`));
    await dialog.getByRole('button', { name: 'Next photo', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/photos/${views[trail].slug}$`));
    await expect(labels(dialog)).toHaveCount(2);
    for (const label of await labels(dialog).all()) {
      await expect(label).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('H hides every label and marker, and the choice survives a reload', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const slug = views[trail].slug;
    const button = await loadPage(page, slug);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toHaveAttribute('aria-keyshortcuts', 'h');
    await expect(labels(page)).toHaveCount(2);
    await expect(markers(page).first()).toBeVisible();
    await expect(async () => {
      await page.keyboard.press('h');
      await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(labels(page)).toHaveCount(0);
    await expect(markers(page)).toHaveCount(0);
    await expect(page.locator('[data-hotspot-leader]')).toHaveCount(0);
    expect(await page.evaluate(() => window.localStorage.getItem('photos.labels'))).toBe('off');

    await page.reload();
    const again = hideLabels(page.getByRole('main'));
    await waitForHydration(again);
    await expect(again).toHaveAttribute('aria-pressed', 'true');
    await expect(labels(page)).toHaveCount(0);

    // Toggling back returns to the original state.
    await again.click();
    await expect(again).toHaveAttribute('aria-pressed', 'false');
    await expect(labels(page)).toHaveCount(2);
  });

  test('with localStorage throwing, labels show and H still toggles for the visit', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const blocked = () => {
        throw new DOMException('blocked', 'SecurityError');
      };
      Storage.prototype.getItem = blocked;
      Storage.prototype.setItem = blocked;
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    const button = await loadPage(page, views[trail].slug);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(labels(page)).toHaveCount(2);
    await expect(async () => {
      await page.keyboard.press('h');
      await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(labels(page)).toHaveCount(0);
    await page.keyboard.press('h');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(labels(page)).toHaveCount(2);
    expect(errors).toEqual([]);
  });

  test('key tier: numbered dots and the Labels key; a dot expands its key row in accent', async ({
    page,
  }) => {
    const dialog = await openTrail(page, 1024, 768);
    const dots = dialog.locator('[data-hotspot-dot]');
    await expect(dots).toHaveCount(2);
    await expect(dots.first()).toBeVisible();
    await expect(labels(dialog).first()).toBeHidden();
    const key = dialog.getByRole('list', { name: 'Labels' });
    await expect(key).toBeVisible();
    const rows = key.getByRole('button');
    await expect(rows).toHaveCount(2);

    await dots.nth(1).click();
    await expect(rows.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await expect(rows.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'false');
    const accent = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.className = 'bg-accent';
      document.body.append(probe);
      const colour = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return colour;
    });
    const fill = (i: number) =>
      dots
        .nth(i)
        .locator('span')
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(await fill(1)).toBe(accent);
    expect(await fill(0)).not.toBe(accent);
  });

  test('scroll tier (375 x 800): numbered dots on the photo and the Labels key match the hotspots', async ({
    page,
  }) => {
    const hotspots = views[trail].hotspots;
    expect(hotspots.length).toBeGreaterThan(1);
    const dialog = await openTrail(page, 375, 800);
    const dots = dialog.locator('[data-hotspot-dot]');
    await expect(dots).toHaveCount(hotspots.length);
    await expect(labels(dialog).first()).toBeHidden();
    await expect(markers(dialog).first()).toBeHidden();
    // The gutter layer (labels and leaders) is display: none below the gutter tier.
    await expect(dialog.locator('[data-hotspot-gutters]')).toBeHidden();
    const key = dialog.getByRole('list', { name: 'Labels' });
    await key.scrollIntoViewIfNeeded();
    await expect(key).toBeVisible();
    const rows = key.getByRole('button');
    await expect(rows).toHaveCount(hotspots.length);

    const photo = (await dialog.locator('[data-photo-box]').boundingBox())!;
    for (const [i, h] of hotspots.entries()) {
      await expect(dots.nth(i)).toBeVisible();
      await expect(dots.nth(i)).toHaveText(String(h.n));
      await expect(rows.nth(i)).toContainText(h.title);
      await expect(rows.nth(i)).toContainText(String(h.n));
      // The dot sits at its hotspot's position on the photo.
      const dot = (await dots.nth(i).boundingBox())!;
      expect(dot.x + dot.width / 2).toBeCloseTo(photo.x + (h.x / 100) * photo.width, 0);
      expect(dot.y + dot.height / 2).toBeCloseTo(photo.y + (h.y / 100) * photo.height, 0);
    }
  });

  test('leader lines: one per gutter label, each running from its label to its glyph', async ({
    page,
  }) => {
    const hotspots = views[trail].hotspots;
    const dialog = await openTrail(page, 1440, 900);
    await expect(labels(dialog)).toHaveCount(hotspots.length);
    const leaders = dialog.locator('[data-hotspot-leader]');
    await expect(leaders).toHaveCount(hotspots.length);
    await expect(markers(dialog)).toHaveCount(hotspots.length);
    await expect(async () => {
      const lines = await leaders.evaluateAll((gs) =>
        gs.map((g) => {
          const line = g.querySelector('line')!;
          const origin = line.ownerSVGElement!.getBoundingClientRect();
          const n = (name: string) => Number(line.getAttribute(name));
          return {
            x1: origin.left + n('x1'),
            y1: origin.top + n('y1'),
            x2: origin.left + n('x2'),
            y2: origin.top + n('y2'),
          };
        })
      );
      expect(lines).toHaveLength(hotspots.length);
      for (const [i, h] of hotspots.entries()) {
        const label = (await dialog.locator(`[data-hotspot-label="${h.id}"]`).boundingBox())!;
        const glyph = (await markers(dialog).nth(i).boundingBox())!;
        const gx = glyph.x + glyph.width / 2;
        const gy = glyph.y + glyph.height / 2;
        const { x1, y1, x2, y2 } = lines[i];
        // Starts on the label's photo-facing edge, within its height.
        const edge = h.side === 'left' ? label.x + label.width : label.x;
        expect(Math.abs(x1 - edge), `${h.id} start x`).toBeLessThanOrEqual(2);
        expect(y1, `${h.id} start y`).toBeGreaterThanOrEqual(label.y - 2);
        expect(y1, `${h.id} start y`).toBeLessThanOrEqual(label.y + label.height + 2);
        // Ends at the glyph (8 px short of its centre, the marker clearance).
        expect(Math.hypot(x2 - gx, y2 - gy), `${h.id} end to glyph`).toBeLessThanOrEqual(10);
        expect(Math.hypot(x1 - x2, y1 - y2), `${h.id} has length`).toBeGreaterThan(20);
      }
    }).toPass({ timeout: 10000 });
  });

  test("the lake reads 'Riffelsee' with '2,760 m approx.' (IN-02)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/photos/${lake.slug}`);
    const label = labels(page).filter({ hasText: 'Riffelsee' });
    await expect(label).toBeVisible();
    await expect(label).toContainText(`2,760${NBSP}m approx.`);
  });

  test('at 375 the chrome groups fit 343 px and nothing overflows sideways', async ({ page }) => {
    const dialog = await openTrail(page, 375, 800);
    const left = (await dialog.locator('[data-chrome-left]').boundingBox())!;
    const right = (await dialog.locator('[data-chrome-right]').boundingBox())!;
    expect(left.width + 8 + right.width).toBeLessThanOrEqual(343);
    expect(right.x + right.width).toBeLessThanOrEqual(375 - 16 + 0.5);
    await expect(hideLabels(dialog)).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('the strip legend shows its keys on a fine pointer from 768 px, not at 375', async ({
    page,
  }) => {
    const dialog = await openTrail(page);
    const legend = dialog.locator('[data-strip-legend]');
    await expect(legend).toBeVisible();
    await expect(legend.locator('kbd')).toHaveCount(5);
    await expect(legend).toHaveText('← → photos · Z zoom · H labels · Esc close');

    await page.setViewportSize({ width: 375, height: 800 });
    await expect(legend).toBeHidden();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/photos/${views[trail].slug}`);
    await expect(page.locator('[data-strip-legend]')).toHaveText(
      '← → photos · Z zoom · H labels · Esc all photographs'
    );
  });
});
