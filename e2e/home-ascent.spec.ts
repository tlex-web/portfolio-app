import { test, expect } from '@playwright/test';
import { photos } from '@/data/generated/photos';
import { editorial } from '@/data/photos/editorial';

/**
 * Home's waypoint list in a browser (HOME-05; D-08; 09-UI-SPEC "Waypoint
 * Cards").
 *
 * The cards are the always-rendered list of photo waypoints, in ascending DEM
 * height, and each "View photo" link must land on its photo in the /photos
 * gallery (/photos#{slug} until Phase 10 ships /photos/{slug}). Every expected
 * value is derived from the committed data, never hand-typed.
 */

const ascending = [...photos].sort(
  (a, b) => a.elevation.m - b.elevation.m || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
);
const slugs = ascending.map((photo) => editorial[photo.id].slug);

test.describe('Waypoint cards (HOME-05)', () => {
  test('every View photo link lands on its photo in the gallery', async ({ page }) => {
    await page.goto('/');

    const links = page
      .getByRole('list', { name: 'Waypoints, lowest first' })
      .getByRole('link', { name: /^View photo/ });
    await expect(links).toHaveCount(slugs.length);
    const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(hrefs).toEqual(slugs.map((slug) => `/photos#${slug}`));

    await page.goto('/photos');
    for (const slug of slugs) {
      await expect(page.locator(`[id="${slug}"]`)).toHaveCount(1);
    }
  });
});
