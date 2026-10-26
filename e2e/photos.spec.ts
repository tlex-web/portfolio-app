import { test, expect, type Locator, type Page } from '@playwright/test';
import { terrain } from '@/data/generated/terrain';
import { buildPhotoViews } from '@/lib/photos/view-model';
import { readViewTransitions, recordViewTransitions } from './helpers/view-transitions';

/**
 * The Map view in a browser (PHOTO-01, PHOTO-03; D-01 to D-04; 10-UI-SPEC
 * "Map View" and UI Considerations E2). /photos opens on the full survey sheet
 * with one link per photo, lowest first; each link's box is its label plate,
 * and it opens the photo in the lightbox with a plain enter. The six legacy
 * gallery tests (hero, hotspot buttons, the old modal and the 3D toggle) were
 * rewritten in 10-08 to map cases, none dropped. Expected values come from
 * buildPhotoViews(), never hand-typed.
 */
test.describe('Map view (PHOTO-01, PHOTO-03, D-01..D-04)', () => {
  const views = buildPhotoViews();
  const MAP = 'Map of the photo locations';
  const LIST = 'Photo locations, lowest first';
  const names = views.map((v) => `${v.title}, ${v.altitudeLabel}`);

  const mapLinks = (page: Page) =>
    page.getByRole('region', { name: MAP }).getByRole('list', { name: LIST }).getByRole('link');

  /** Wait until React has hydrated a link (a click before that is a document navigation). */
  async function waitForHydration(link: Locator) {
    await expect
      .poll(
        () => link.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))),
        { timeout: 15000 }
      )
      .toBe(true);
  }

  /** Click a map plate (hydrated) and wait for the dialog. */
  async function openFromMap(page: Page, index: number) {
    const link = mapLinks(page).nth(index);
    await waitForHydration(link);
    await link.click();
    const dialog = page.getByRole('dialog');
    // The dev server compiles the intercepted route on its first request.
    await expect(dialog).toBeVisible({ timeout: 20000 });
    return { dialog, link };
  }

  test('opens on the map with four waypoint links in altitude order (PHOTO-01)', async ({
    page,
  }) => {
    await page.goto('/photos');
    await expect(page.getByRole('region', { name: MAP })).toBeVisible();
    const links = mapLinks(page);
    await expect(links).toHaveCount(views.length);
    for (const [i, view] of views.entries()) {
      await expect(links.nth(i)).toHaveAccessibleName(names[i]);
      await expect(links.nth(i)).toHaveAttribute('href', `/photos/${view.slug}`);
      await expect(links.nth(i)).toHaveAttribute('data-photo-id', view.slug);
    }
  });

  test('Tab reaches the four waypoint links in altitude order', async ({ page }) => {
    await page.goto('/photos');
    const links = mapLinks(page);
    await expect(links).toHaveCount(views.length);
    const focusedName = () =>
      page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
    // Tab through the shell until the first waypoint has focus.
    for (let i = 0; i < 40 && (await focusedName()) !== names[0]; i++) {
      await page.keyboard.press('Tab');
    }
    await expect(links.nth(0)).toBeFocused();
    for (let i = 1; i < views.length; i++) {
      await page.keyboard.press('Tab');
      await expect(links.nth(i)).toBeFocused();
    }
  });

  test('a map plate opens the lightbox', async ({ page }) => {
    await page.goto('/photos');
    const { dialog } = await openFromMap(page, 1);
    await expect(page).toHaveURL(new RegExp(`/photos/${views[1].slug}$`));
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(views[1].title);
  });

  test('Close photo closes the lightbox opened from the map', async ({ page }) => {
    await page.goto('/photos');
    const { dialog } = await openFromMap(page, 1);
    await dialog.getByRole('button', { name: 'Close photo', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/photos$/);
  });

  test('Escape closes it and focus returns to the plate', async ({ page }) => {
    await page.goto('/photos');
    const { link } = await openFromMap(page, 1);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(link).toBeFocused();
  });

  test('opening from the map is a plain enter: no photo-* pseudo-element @chromium-only', async ({
    page,
  }) => {
    await recordViewTransitions(page);
    await page.goto('/photos');
    const before = (await readViewTransitions(page)).transitions.length;
    await openFromMap(page, 1);
    await page.waitForTimeout(800);
    const after = (await readViewTransitions(page)).transitions.slice(before).flat();
    expect(after.filter((pseudo) => pseudo.includes('photo-'))).toEqual([]);
  });

  test('?view=carousel shows the carousel region', async ({ page }) => {
    await page.goto('/photos?view=carousel');
    await expect(page.getByRole('region', { name: 'Photographs' })).toBeVisible();
    await expect(page.getByRole('region', { name: MAP })).toHaveCount(0);
  });

  test('?view=grid and ?view=xyz render the grid and the map', async ({ page }) => {
    await page.goto('/photos?view=grid');
    await expect(page.getByRole('list', { name: 'Photographs, lowest first' })).toBeVisible();
    await expect(page.getByRole('region', { name: MAP })).toHaveCount(0);

    await page.goto('/photos?view=xyz');
    await expect(page.getByRole('region', { name: MAP })).toBeVisible();
    await expect(mapLinks(page)).toHaveCount(views.length);
  });

  test('the Riffelsee dot is dashed and the summit is not a link', async ({ page }) => {
    await page.goto('/photos');
    const links = mapLinks(page);
    await expect(links).toHaveCount(views.length);
    for (const [i, view] of views.entries()) {
      const border = await links
        .nth(i)
        .locator('[data-map-dot]')
        .evaluate((el) => {
          const cs = getComputedStyle(el);
          return `${cs.borderTopWidth} ${cs.borderTopStyle}`;
        });
      // Preflight gives every element a solid 0 px border; only the film scan draws one.
      expect([view.slug, border]).toEqual([
        view.slug,
        view.approximate ? '2px dashed' : '0px solid',
      ]);
    }
    const summit = page.locator('[data-summit-plate]');
    await expect(summit).toHaveText(/Matterhorn/);
    expect(await summit.evaluate((el) => el.closest('a') === null)).toBe(true);
    expect(await summit.evaluate((el) => el.closest('[aria-hidden="true"]') !== null)).toBe(true);
  });

  for (const width of [360, 375, 412, 768, 1024, 1440]) {
    test(`at ${width} x 900 the plates keep their boxes, gaps and dots`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/photos');
      await expect(mapLinks(page)).toHaveCount(views.length);
      const geometry = await page.locator('[data-map-sheet]').evaluate((sheet) => {
        const box = sheet.getBoundingClientRect();
        const origin = { x: box.x + sheet.clientLeft, y: box.y + sheet.clientTop };
        const rel = (r: DOMRect) => ({
          x: r.x - origin.x,
          y: r.y - origin.y,
          width: r.width,
          height: r.height,
        });
        const marks = [...sheet.querySelectorAll<HTMLElement>('[data-map-mark]')].map((el) => {
          const dot = el.querySelector('[data-map-dot]')!.getBoundingClientRect();
          return {
            plate: rel(el.getBoundingClientRect()),
            dot: { x: dot.x + dot.width / 2 - origin.x, y: dot.y + dot.height / 2 - origin.y },
          };
        });
        const summit = rel(sheet.querySelector('[data-summit-plate]')!.getBoundingClientRect());
        return { S: sheet.clientWidth, H: sheet.clientHeight, marks, summit };
      });
      const { S, marks, summit } = geometry;
      expect(Math.abs(geometry.H - S)).toBeLessThanOrEqual(1);
      const plates = marks.map((m) => m.plate);
      for (const p of plates) {
        expect([48, 68]).toContain(Math.round(p.height));
        expect(p.x).toBeGreaterThanOrEqual(7.5);
        expect(p.y).toBeGreaterThanOrEqual(7.5);
        expect(p.x + p.width).toBeLessThanOrEqual(S - 7.5);
        expect(p.y + p.height).toBeLessThanOrEqual(S - 7.5);
      }
      // 8 px (to 0.5 px) between waypoint plates; no overlap with the summit plate.
      const all = [...plates, summit];
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const a = all[i];
          const b = all[j];
          const gap = Math.max(
            b.x - (a.x + a.width),
            a.x - (b.x + b.width),
            b.y - (a.y + a.height),
            a.y - (b.y + b.height)
          );
          const min = j === all.length - 1 ? 0 : 7.5;
          expect([i, j, gap >= min]).toEqual([i, j, true]);
        }
      }
      marks.forEach((m, i) => {
        expect(Math.abs(m.dot.x - views[i].uv.u * S)).toBeLessThanOrEqual(1);
        expect(Math.abs(m.dot.y - views[i].uv.v * S)).toBeLessThanOrEqual(1);
      });
      expect(Math.abs(summit.x - (terrain.summit.uv.u * S + 14))).toBeLessThanOrEqual(1);
      // Visual order (top to bottom, then left to right) is altitude order.
      const order = [...plates.keys()].sort(
        (a, b) => plates[a].y - plates[b].y || plates[a].x - plates[b].x
      );
      expect(order).toEqual([...views.keys()]);
      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth - root.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

/**
 * The Grid view in a browser (PHOTO-02, PHOTO-03, D-15; 10-UI-SPEC "Grid View"
 * and UI Considerations E3). Expected values come from buildPhotoViews(),
 * never hand-typed. From 640 px the tiles are CSS-only justified rows: in each
 * row the image boxes share one height (±1 px) and keep their true ratio
 * (±1 %); with four photos that is two rows of two at 768 and 1440 (224 px
 * rows from 640 px, 280 px from 1024 px, approved by Tim 2026-10-26). Below
 * 640 px one column, with no horizontal overflow at 375. A tile click opens
 * its photo in the lightbox dialog over the grid (10-05, LBOX-01).
 */
test.describe('Grid view (PHOTO-02, PHOTO-03, D-15)', () => {
  const views = buildPhotoViews();
  const DERIVATIVE = /^\/images\/photos\/[a-z0-9-]+\.[0-9a-f]{10}\.(avif|webp)$/;
  const LIST = 'Photographs, lowest first';

  test('lists the four photos in the canonical order', async ({ page }) => {
    await page.goto('/photos?view=grid');
    const list = page.getByRole('list', { name: LIST });
    const links = list.getByRole('link');
    await expect(links).toHaveCount(views.length);
    for (const [i, view] of views.entries()) {
      await expect(links.nth(i)).toHaveAccessibleName(view.title);
      await expect(links.nth(i)).toHaveAttribute('href', `/photos/${view.slug}`);
      await expect(links.nth(i)).toHaveAttribute('data-photo-id', view.slug);
    }
  });

  for (const size of [
    { width: 768, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    test(`at ${size.width} x ${size.height}: two rows of two, one height per row, true ratios`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto('/photos?view=grid');
      const boxes = page.getByRole('list', { name: LIST }).locator('[data-tile-box]');
      await expect(boxes).toHaveCount(views.length);
      const rects = await boxes.evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        })
      );

      const rows = new Map<number, typeof rects>();
      for (const rect of rects) {
        const key = [...rows.keys()].find((y) => Math.abs(y - rect.y) <= 1) ?? rect.y;
        rows.set(key, [...(rows.get(key) ?? []), rect]);
      }
      expect([...rows.values()].map((row) => row.length)).toEqual([2, 2]);
      for (const row of rows.values()) {
        expect(Math.abs(row[0].height - row[1].height)).toBeLessThanOrEqual(1);
      }
      rects.forEach((rect, i) => {
        const aspect = views[i].aspect.w / views[i].aspect.h;
        expect(Math.abs(rect.width / rect.height / aspect - 1)).toBeLessThanOrEqual(0.01);
      });
    });
  }

  test('at 375 x 800: one column and no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/photos?view=grid');
    const items = page.getByRole('list', { name: LIST }).getByRole('listitem');
    await expect(items).toHaveCount(views.length);
    const xs = await items.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().x));
    for (const x of xs) expect(Math.abs(x - xs[0])).toBeLessThanOrEqual(1);
    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('every tile image is a content-hashed manifest derivative', async ({ page }) => {
    await page.goto('/photos?view=grid');
    const imgs = page.getByRole('list', { name: LIST }).locator('img');
    await expect(imgs).toHaveCount(views.length);
    for (const [i, view] of views.entries()) {
      const img = imgs.nth(i);
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveAttribute('alt', view.alt);
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
        .toBe(true);
      const currentSrc = await img.evaluate(
        (el: HTMLImageElement) => new URL(el.currentSrc).pathname
      );
      expect(currentSrc).toMatch(DERIVATIVE);
    }
  });

  test('clicking the first tile opens its photo in the lightbox (LBOX-01)', async ({ page }) => {
    await page.goto('/photos?view=grid');
    const first = views[0];
    const tile = page.getByRole('list', { name: LIST }).getByRole('link').first();
    // Before hydration a click is a document navigation, which is never intercepted.
    await expect
      .poll(
        () => tile.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))),
        {
          timeout: 15000,
        }
      )
      .toBe(true);
    await tile.click();
    const dialog = page.getByRole('dialog');
    // The dev server compiles the intercepted route on its first request.
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(first.title);
  });
});
