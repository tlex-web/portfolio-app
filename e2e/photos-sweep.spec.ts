import { test, expect, type Locator, type Page } from '@playwright/test';
import { buildPhotoViews } from '@/lib/photos/view-model';

/**
 * Cross-view sweep of the photography surface (PHOTO-02, LBOX-01, LBOX-02,
 * LBOX-03, LBOX-07; 10-UI-SPEC "Guardrails and Regression Risks" rows
 * "375 overflow", "Served images" and "removeChild", and UI Considerations
 * E5 populated as one composite backstop).
 *
 * - No surface scrolls sideways at 375 px: the map, the grid, the carousel
 *   stepper, every /photos/{slug} page and the lightbox (the dialog too).
 * - Every loaded image is a content-hashed terrain asset or photo derivative,
 *   and no element offers a download (LBOX-07; privacy prohibition).
 * - STATE carry-overs: switching Map -> Grid -> Carousel -> Grid -> Map and
 *   opening and closing a photo logs no React `removeChild` / "not a child"
 *   error (07-19, and the 09 deferred 3D carousel flake that logged it) and no
 *   duplicate view-transition-name (10-RESEARCH Pitfalls 6 and 8).
 * - "Return on close" from the carousel after two steps in the lightbox.
 * - The whole lightbox path from a direct load to the three Escape layers.
 *
 * Every expected value comes from buildPhotoViews(), never hand-typed.
 */

const views = buildPhotoViews();
const GRID_LIST = 'Photographs, lowest first';
const GRID_URL = /\/photos\?view=grid$/;

/** A loaded image's URL: a hashed /terrain/ asset or a hashed /images/photos/ derivative. */
const HASHED_IMAGE =
  /^https?:\/\/[^/]+\/(terrain\/[a-z0-9-]+\.[0-9a-f]{10}\.(avif|webp)|images\/photos\/[a-z0-9-]+\.[0-9a-f]{10}\.(avif|webp|jpg))$/;

/** The React removeChild error, the DOM's "not a child" and duplicate view-transition names. */
const CONSOLE_FAULT = /removeChild|not a child|view-transition-name|ViewTransition name=/i;

/**
 * Wait until React has hydrated an element. A click on a server-rendered
 * next/link before hydration is a plain document navigation (never
 * intercepted, so no dialog), and the dev server can be slow to hydrate.
 */
async function waitForHydration(target: Locator) {
  await expect
    .poll(
      () => target.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))),
      { timeout: 15000 }
    )
    .toBe(true);
}

/** Click a grid tile (on the grid already) and wait for the dialog. */
async function openTile(page: Page, index = 0) {
  const tile = page.getByRole('list', { name: GRID_LIST }).getByRole('link').nth(index);
  await waitForHydration(tile);
  await tile.click();
  const dialog = page.getByRole('dialog');
  // The dev server compiles the intercepted route on its first request.
  await expect(dialog).toBeVisible({ timeout: 20000 });
  return dialog;
}

/**
 * Wait until every rendered image in the scope has finished (loaded or
 * failed). Images without a layout box (the map's hidden hover previews) are
 * never fetched while lazy, so they are left out.
 */
async function renderedImagesDone(scope: Locator) {
  await expect
    .poll(
      () =>
        scope
          .locator('img')
          .evaluateAll((imgs: HTMLImageElement[]) =>
            imgs.every((img) => img.complete || img.getClientRects().length === 0)
          ),
      { timeout: 20000 }
    )
    .toBe(true);
}

/** Scroll the whole page once so every lazy image in it starts, then back to the top. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
}

type Surface = {
  name: string;
  url: string;
  /** The carousel shows its stepper under reduced motion (D-13). */
  reducedMotion?: boolean;
  /** Open the first grid tile in the lightbox after loading the url. */
  lightbox?: boolean;
};

const SURFACES: Surface[] = [
  { name: 'the map (/photos)', url: '/photos' },
  { name: 'the grid (?view=grid)', url: '/photos?view=grid' },
  {
    name: 'the carousel stepper (?view=carousel)',
    url: '/photos?view=carousel',
    reducedMotion: true,
  },
  ...views.map((view) => ({
    name: `the photo page /photos/${view.slug}`,
    url: `/photos/${view.slug}`,
  })),
  { name: 'the lightbox over the grid', url: '/photos?view=grid', lightbox: true },
];

/**
 * Load a surface with its images done. Returns the dialog for the lightbox
 * (whose images are awaited inside it; the inert grid behind keeps whatever it
 * had loaded), else null.
 */
async function visit(page: Page, surface: Surface): Promise<Locator | null> {
  if (surface.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(surface.url);
  if (surface.reducedMotion) {
    await expect(page.getByRole('region', { name: 'Photographs', exact: true })).toHaveAttribute(
      'data-carousel-mode',
      'stepper'
    );
  }
  await scrollThrough(page);
  if (!surface.lightbox) {
    await renderedImagesDone(page.locator('body'));
    return null;
  }
  const dialog = await openTile(page, 0);
  await renderedImagesDone(dialog);
  return dialog;
}

test.describe('375 overflow (10-UI-SPEC guardrail "375 overflow")', () => {
  for (const surface of SURFACES) {
    test(`no horizontal overflow at 375 on every photo surface: ${surface.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      const dialog = await visit(page, surface);
      const root = await page.evaluate(() => {
        const el = document.documentElement;
        return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
      });
      expect(root.scrollWidth, 'document scrollWidth').toBeLessThanOrEqual(root.clientWidth);
      if (dialog) {
        const own = await dialog.evaluate((el) => ({
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        }));
        expect(own.scrollWidth, 'dialog scrollWidth').toBeLessThanOrEqual(own.clientWidth);
      }
    });
  }
});

test.describe('Served images (LBOX-07, 10-UI-SPEC guardrail "Served images")', () => {
  for (const surface of SURFACES) {
    test(`every image is a hashed derivative and nothing offers a download: ${surface.name}`, async ({
      page,
    }) => {
      const dialog = await visit(page, surface);
      const loaded = await page
        .locator('img')
        .evaluateAll((imgs: HTMLImageElement[]) =>
          imgs.filter((img) => img.complete && img.naturalWidth > 0).map((img) => img.currentSrc)
        );
      expect(loaded.length, 'loaded images on the surface').toBeGreaterThan(0);
      for (const src of loaded) expect(src).toMatch(HASHED_IMAGE);
      if (dialog) {
        const inDialog = await dialog
          .locator('img')
          .evaluateAll((imgs: HTMLImageElement[]) =>
            imgs.filter((img) => img.complete && img.naturalWidth > 0).map((img) => img.currentSrc)
          );
        expect(inDialog.length, 'loaded images in the dialog').toBeGreaterThan(0);
      }
      await expect(page.locator('[download]')).toHaveCount(0);
    });
  }
});

test.describe('Console (STATE removeChild carry-over; 10-RESEARCH Pitfalls 6, 8)', () => {
  const group = (page: Page) => page.getByRole('group', { name: 'View' });
  const segment = (page: Page, name: 'Map' | 'Grid' | 'Carousel') =>
    group(page).getByRole('button', { name, exact: true });

  /** Press a segment and wait for its view: URL, pressed state and the view's own landmark. */
  async function switchTo(page: Page, name: 'Map' | 'Grid' | 'Carousel') {
    await segment(page, name).click();
    // The pressed state arrives with the server render of the new URL, which a
    // loaded dev server ("Rendering...") can take several seconds to answer.
    await expect(segment(page, name)).toHaveAttribute('aria-pressed', 'true', { timeout: 15000 });
    if (name === 'Map') {
      await expect(page).toHaveURL(/\/photos$/);
      await expect(page.getByRole('region', { name: 'Map of the photo locations' })).toBeVisible();
    } else if (name === 'Grid') {
      await expect(page).toHaveURL(GRID_URL);
      await expect(page.getByRole('list', { name: GRID_LIST })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/photos\?view=carousel$/);
      // Settled on either the 3D carousel (SwiftShader passes the gate) or the stepper.
      await expect(page.getByRole('region', { name: 'Photographs', exact: true })).toHaveAttribute(
        'data-carousel-mode',
        /^(3d|stepper)$/
      );
    }
    // Let the photos-view crossfade (and a 3D mount) finish before the next press.
    await page.waitForTimeout(600);
  }

  test('view switches and photo open/close log no removeChild or duplicate-name errors @chromium-only', async ({
    page,
  }) => {
    test.slow();
    const faults: string[] = [];
    page.on('console', (message) => {
      if (CONSOLE_FAULT.test(message.text())) faults.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => {
      if (CONSOLE_FAULT.test(`${error.name} ${error.message}`))
        faults.push(`pageerror: ${error.message}`);
    });

    await page.goto('/photos');
    await waitForHydration(segment(page, 'Grid'));
    for (const name of ['Grid', 'Carousel', 'Grid', 'Map'] as const) await switchTo(page, name);

    // Open and close a photo from the grid, then go back to the map.
    await switchTo(page, 'Grid');
    await openTile(page, 0);
    await expect(page).toHaveURL(new RegExp(`/photos/${views[0].slug}$`));
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(GRID_URL);
    await switchTo(page, 'Map');

    expect(faults).toEqual([]);
  });
});

test.describe('Focus return from the carousel (10-UI-SPEC Focus "Return on close")', () => {
  test('the carousel takes focus back on the photo shown at close', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/photos?view=carousel');
    const region = page.getByRole('region', { name: 'Photographs', exact: true });
    await expect(region).toHaveAttribute('data-carousel-mode', 'stepper');
    const openPhoto = region.getByRole('link', { name: 'Open photo', exact: true });
    await waitForHydration(openPhoto);
    await openPhoto.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog).toHaveAccessibleName(views[0].title);

    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    await next.click();
    await expect(page).toHaveURL(new RegExp(`/photos/${views[1].slug}$`));
    await next.click();
    await expect(page).toHaveURL(new RegExp(`/photos/${views[2].slug}$`));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/photos\?view=carousel$/);
    await expect(openPhoto).toBeFocused();
    await expect(openPhoto).toHaveAttribute('data-photo-id', views[2].slug);
    await expect(region.locator('[data-carousel-counter]')).toHaveText(`3 / ${views.length}`);
  });
});

test.describe('The lightbox path end to end (10-UI-SPEC E5 populated)', () => {
  /** The photo with the most hotspots (the gutter callouts need at least one). */
  const calloutIndex = views.reduce(
    (best, view, i) => (view.hotspots.length > views[best].hotspots.length ? i : best),
    0
  );
  const callout = views[calloutIndex];

  const labels = (scope: Locator) => scope.locator('[data-hotspot-label]');
  const zoomButton = (scope: Locator) =>
    scope.getByRole('button', { name: 'Zoom photo', exact: true });
  const focusInDialog = (page: Page) =>
    page.evaluate(() => document.activeElement?.closest('dialog[open]') != null);

  test('the lightbox path end to end (UI-SPEC E5)', async ({ page }) => {
    test.slow();
    expect(callout.hotspots.length, 'a photo with hotspots').toBeGreaterThan(0);
    expect(views.length, 'three steps need four photos').toBeGreaterThanOrEqual(4);
    // 1440 x 900 is the gutter tier, where the callouts are labels beside the photo.
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. A direct load is the page surface: shell landmarks and no dialog (LBOX-01).
    await page.goto(`/photos/${views[0].slug}`);
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(
      views[0].title
    );
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // 2. A grid click opens the dialog at /photos/<slug>; Back closes it.
    await page.goto('/photos?view=grid');
    let dialog = await openTile(page, 0);
    await expect(page).toHaveURL(new RegExp(`/photos/${views[0].slug}$`));
    await expect(dialog).toHaveAccessibleName(views[0].title);
    await page.goBack();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(GRID_URL);

    // 3. Three steps keep history.length constant and focus on Next (LBOX-02).
    dialog = await openTile(page, 0);
    const length = await page.evaluate(() => window.history.length);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    for (let i = 1; i <= 3; i++) {
      await next.click();
      await expect(page).toHaveURL(new RegExp(`/photos/${views[i].slug}$`));
    }
    await expect(next).toBeFocused();
    expect(await page.evaluate(() => window.history.length)).toBe(length);

    // 4. Tab and Shift+Tab stay inside the dialog (LBOX-03).
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await focusInDialog(page), `after Tab ${i + 1}`).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await focusInDialog(page), `after Shift+Tab ${i + 1}`).toBe(true);
    }

    // 5. Step back to the photo with callouts, open one, zoom with Z.
    const prev = dialog.getByRole('button', { name: 'Previous photo', exact: true });
    for (let i = 3; i > calloutIndex; i--) {
      await prev.click();
      await expect(page).toHaveURL(new RegExp(`/photos/${views[i - 1].slug}$`));
    }
    const label = labels(dialog).first();
    await expect(labels(dialog)).toHaveCount(callout.hotspots.length);
    await label.focus();
    await page.keyboard.press('Enter');
    await expect(label).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('z');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');

    // 6. Escape unwinds callout -> zoom -> close (D-06).
    await page.keyboard.press('Escape');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'false');
    await expect(labels(dialog).first()).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(GRID_URL);

    // 7. Focus returns to the tile of the photo shown at close (UI-SPEC OQ2).
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(callout.slug);
  });
});
