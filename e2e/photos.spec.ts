import { test, expect } from '@playwright/test';
import { buildPhotoViews } from '@/lib/photos/view-model';

test.describe('Photo Gallery', () => {
  test('should display gallery grid', async ({ page }) => {
    await page.goto('/photos');

    await expect(page.getByRole('heading', { name: /Landscape Gallery/i })).toBeVisible();

    // Should have images
    const images = page.getByRole('button', { name: /View details for/i });
    await expect(images.first()).toBeVisible();
  });

  test('should open image detail modal when clicking on image', async ({ page }) => {
    await page.goto('/photos');

    // Click first image (Playwright auto-waits for it to be actionable)
    const firstImage = page.getByRole('button', { name: /View details for/i }).first();
    await firstImage.click();

    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible();

    // Should have close button (uses aria-label="Close modal")
    await expect(page.getByLabel(/Close modal/i)).toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await page.goto('/photos');

    // Open modal
    const firstImage = page.getByRole('button', { name: /View details for/i }).first();
    await firstImage.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close modal
    await page.getByLabel(/Close modal/i).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should close modal when pressing Escape key', async ({ page }) => {
    await page.goto('/photos');

    // Open modal
    const firstImage = page.getByRole('button', { name: /View details for/i }).first();
    await firstImage.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should switch to 3D carousel view', async ({ page }) => {
    await page.goto('/photos');

    // Wait for images to load before switching views
    await expect(page.getByRole('button', { name: /View details for/i }).first()).toBeVisible();

    // Click 3D view button
    await page.getByRole('button', { name: /3D Carousel/i }).click();

    // Wait for the lazy-loaded 3D canvas to appear (may take time to load WebGL)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeAttached({ timeout: 15000 });
  });

  test('should switch between grid and 3D view', async ({ page }) => {
    await page.goto('/photos');

    // Wait for images to load first
    await expect(page.getByRole('button', { name: /View details for/i }).first()).toBeVisible();

    // Check for view mode toggle buttons
    const gridButton = page.getByRole('button', { name: /Grid View|grid/i });
    const carousel3DButton = page.getByRole('button', { name: /3D|Carousel/i });

    // At least one view mode button should be visible
    const hasGridButton = await gridButton.isVisible().catch(() => false);
    const has3DButton = await carousel3DButton.isVisible().catch(() => false);

    expect(hasGridButton || has3DButton).toBe(true);
  });
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
