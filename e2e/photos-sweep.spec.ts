import { test, expect, type Locator, type Page } from '@playwright/test';
import { buildPhotoViews } from '@/lib/photos/view-model';
import { regionPhotoViews, regions } from '@/lib/regions';
import { SLUGS, viewBySlug } from './helpers/photo-fixtures';

/**
 * Cross-view sweep of the photography surface (PHOTO-02, LBOX-01, LBOX-02,
 * LBOX-03, LBOX-07; 10-UI-SPEC "Guardrails and Regression Risks" rows
 * "375 overflow", "Served images" and "removeChild", and UI Considerations
 * E5 populated as one composite backstop).
 *
 * - No surface scrolls sideways at 375 px: the map, the three region pages,
 *   every published /photos/{slug} page and the lightbox over the Zermatt
 *   region page (the dialog too). 18-21 (PHOTO-06) moved the grid, carousel
 *   stepper and grid-lightbox surfaces onto the region pages; a region surface
 *   settles on the altimeter rail's data-rail-current from 768 px and on its
 *   sequence images complete below (positive signals, 13 #38).
 * - Every loaded image is a content-hashed terrain asset or photo derivative,
 *   and no element offers a download (LBOX-07; privacy prohibition).
 * - STATE carry-overs: switching Map -> Grid -> Carousel -> Grid -> Map and
 *   opening and closing a photo logs no React `removeChild` / "not a child"
 *   error (07-19, and the 09 deferred 3D carousel flake that logged it) and no
 *   duplicate view-transition-name (10-RESEARCH Pitfalls 6 and 8).
 * - "Return on close" on the region page after two steps in the lightbox.
 * - The whole lightbox path from a direct load to the three Escape layers,
 *   opened from the Zermatt region page.
 *
 * Every expected value comes from the data, never hand-typed: positions in a
 * series from regionPhotoViews (18 Pitfall 8); the view-switch console row,
 * which 18-22 retires with the views, still reads buildPhotoViews().
 */

// Index lookups into views here are positions in the series order (DEM ascending, ties
// by id), not photo identities; a specific photo is named through viewBySlug.

const views = buildPhotoViews();
const GRID_LIST = 'Photographs, lowest first';
const GRID_URL = /\/photos\?view=grid$/;

/** The Zermatt series: the lightbox surfaces open from its region page (18-21; PHOTO-06). */
const ZERMATT = regionPhotoViews('zermatt');
const ZERMATT_URL = /\/photos\/regions\/zermatt$/;
/** Every published photo, region by region (the photo-page surfaces). */
const PUBLISHED = regions.flatMap((r) => regionPhotoViews(r.id));
/** The region altimeter rail's root: data-rail-current is its settle signal (18-12). */
const RAIL = 'section[data-region-sequence] [data-region-rail]';

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

/** Click a region page's figure link (on the region page already) and wait for the dialog. */
async function openFigure(page: Page, slug: string) {
  const link = page.locator(`li[data-sequence-item="${slug}"] [data-photo-id="${slug}"]`);
  await expect(link).toHaveCount(1);
  await waitForHydration(link);
  await link.click();
  const dialog = page.getByRole('dialog');
  // The dev server compiles the intercepted route on its first request.
  await expect(dialog).toBeVisible({ timeout: 20000 });
  await expect(page).toHaveURL(new RegExp(`/photos/${slug}$`));
  return dialog;
}

/** Click a grid tile (on the grid already) and wait for the dialog (the console row, 18-22's). */
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
  /** A region page: settled on the rail's data-rail-current from 768 px, on its images below. */
  region?: boolean;
  /** Open the first Zermatt figure in the lightbox after loading the region page. */
  lightbox?: boolean;
};

const SURFACES: Surface[] = [
  { name: 'the map (/photos)', url: '/photos' },
  ...regions.map((r) => ({
    name: `the region page /photos/regions/${r.id}`,
    url: `/photos/regions/${r.id}`,
    region: true,
  })),
  ...PUBLISHED.map((view) => ({
    name: `the photo page /photos/${view.slug}`,
    url: `/photos/${view.slug}`,
  })),
  {
    name: 'the lightbox over the Zermatt region page',
    url: '/photos/regions/zermatt',
    region: true,
    lightbox: true,
  },
];

/**
 * A region page settled after scrollThrough left it at the top: from 768 px the
 * rail marks photo 1 again (data-rail-current, 18-12); below 768 the rail has no
 * box, so the sequence's images complete is the signal.
 */
async function regionSettled(page: Page) {
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    await expect(page.locator(RAIL)).toHaveAttribute('data-rail-current', '1');
  } else {
    await renderedImagesDone(page.locator('section[data-region-sequence]'));
  }
}

/**
 * Load a surface with its images done. Returns the dialog for the lightbox
 * (whose images are awaited inside it; the inert region page behind keeps
 * whatever it had loaded), else null.
 */
async function visit(page: Page, surface: Surface): Promise<Locator | null> {
  await page.goto(surface.url);
  await scrollThrough(page);
  if (surface.region) await regionSettled(page);
  if (!surface.lightbox) {
    await renderedImagesDone(page.locator('body'));
    return null;
  }
  const dialog = await openFigure(page, ZERMATT[0].slug);
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

test.describe('Focus return on the region page (10-UI-SPEC Focus "Return on close"; LBOX-08)', () => {
  // Rewritten in 18-21 (PHOTO-06) from 'the carousel takes focus back on the photo shown at
  // close': the region page is where a photo opens from, so its figure link takes focus back.
  // @no-win-webkit: on Windows WebKit (WinCairo) a soft navigation out of the lightbox after a
  // step closes the page (18-16 deferred-items.md; probed again here: 'Target page, context or
  // browser has been closed' at the Escape); Chromium, Firefox and CI's Linux WebKit run the row.
  test('the region page takes focus back on the photo shown at close @no-win-webkit', async ({
    page,
  }) => {
    expect(ZERMATT.length, 'two steps need three photos').toBeGreaterThanOrEqual(3);
    await page.goto('/photos/regions/zermatt');
    const dialog = await openFigure(page, ZERMATT[0].slug);
    await expect(dialog).toHaveAccessibleName(ZERMATT[0].title);

    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    await next.click();
    await expect(page).toHaveURL(new RegExp(`/photos/${ZERMATT[1].slug}$`));
    await next.click();
    await expect(page).toHaveURL(new RegExp(`/photos/${ZERMATT[2].slug}$`));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(ZERMATT_URL);
    const third = page.locator(`li[data-sequence-item="${ZERMATT[2].slug}"] [data-photo-id]`);
    await expect(third).toBeFocused();
    await expect(third).toHaveAttribute('data-photo-id', ZERMATT[2].slug);
    await expect(third).toBeInViewport();
  });
});

test.describe('The lightbox path end to end (10-UI-SPEC E5 populated)', () => {
  /**
   * The photo with the most hotspots among the first four of the Zermatt series (the gutter
   * callouts need at least one, and step 5 steps back to it from the fourth).
   */
  const steps = ZERMATT.slice(0, 4);
  const calloutIndex = steps.reduce(
    (best, view, i) => (view.hotspots.length > steps[best].hotspots.length ? i : best),
    0
  );
  const callout = steps[calloutIndex];

  const labels = (scope: Locator) => scope.locator('[data-hotspot-label]');
  const zoomButton = (scope: Locator) =>
    scope.getByRole('button', { name: 'Zoom photo', exact: true });
  const focusInDialog = (page: Page) =>
    page.evaluate(() => document.activeElement?.closest('dialog[open]') != null);

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('the lightbox path end to end (UI-SPEC E5) @no-win-webkit', async ({ page }) => {
    test.slow();
    expect(callout.hotspots.length, 'a photo with hotspots').toBeGreaterThan(0);
    expect(ZERMATT.length, 'three steps need four photos').toBeGreaterThanOrEqual(4);
    // 1440 x 900 is the gutter tier, where the callouts are labels beside the photo.
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. A direct load is the page surface: shell landmarks and no dialog (LBOX-01).
    const direct = viewBySlug(SLUGS.matterhornFromZermatt);
    await page.goto(`/photos/${direct.slug}`);
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(
      direct.title
    );
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // 2. A figure click on the region page opens the dialog at /photos/<slug>; Back closes it
    // (18-21: the region page replaced the grid as the opener, PHOTO-06).
    await page.goto('/photos/regions/zermatt');
    let dialog = await openFigure(page, ZERMATT[0].slug);
    await expect(dialog).toHaveAccessibleName(ZERMATT[0].title);
    await page.goBack();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(ZERMATT_URL);

    // 3. Three steps keep history.length constant and focus on Next (LBOX-02).
    dialog = await openFigure(page, ZERMATT[0].slug);
    const length = await page.evaluate(() => window.history.length);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    for (let i = 1; i <= 3; i++) {
      await next.click();
      await expect(page).toHaveURL(new RegExp(`/photos/${ZERMATT[i].slug}$`));
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
      await expect(page).toHaveURL(new RegExp(`/photos/${ZERMATT[i - 1].slug}$`));
    }
    const label = labels(dialog).first();
    await expect(labels(dialog)).toHaveCount(callout.hotspots.length);
    await label.focus();
    await page.keyboard.press('Enter');
    await expect(label).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('z');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');

    // 6. Escape unwinds zoom -> close (D-06). Rewritten in place for 14-04's D-22: the callout
    // is hidden while zoomed, so it no longer takes the first Escape; zoom does, and the
    // hidden callout is dropped with it.
    await page.keyboard.press('Escape');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'false');
    await expect(labels(dialog).first()).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(ZERMATT_URL);

    // 7. Focus returns to the figure link of the photo shown at close (UI-SPEC OQ2).
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(callout.slug);
  });
});
