import { test, expect } from '@playwright/test';
import { buildPhotoViews } from '@/lib/photos/view-model';

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
    test(`/photos/${view.slug}: the viewer inside the shell, no dialog (D-08)`, async ({ page }) => {
      const response = await page.goto(`/photos/${view.slug}`);
      expect(response?.status()).toBe(200);

      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      await expect(page.getByRole('dialog')).toHaveCount(0);

      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(view.title);
      await expect(main.getByText(view.rights, { exact: true })).toBeVisible();
      await expect(main.getByRole('link', { name: 'All photographs', exact: true })).toHaveAttribute(
        'href',
        '/photos',
      );
      await expect(page).toHaveTitle(`${view.title} · Tim Lui`);

      // LBOX-07: no download control anywhere, and only hashed derivatives on the stage.
      await expect(page.locator('[download]')).toHaveCount(0);
      const img = page.locator('[data-photo-viewer] [data-photo-stage] img');
      await expect(img).toHaveAttribute('alt', view.alt);
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(
        true,
      );
      const currentSrc = await img.evaluate((el: HTMLImageElement) => new URL(el.currentSrc).pathname);
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
