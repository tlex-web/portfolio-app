import { test, expect, type Page } from '@playwright/test';
import { photos } from '@/data/generated/photos';
import { editorial } from '@/data/photos/editorial';
import { buildWaypoints, waypointKicker } from '@/lib/ascent/waypoints';

/**
 * Home's waypoint list in a browser (HOME-05; D-08, D-20, D-21; 09-UI-SPEC
 * "Waypoint Cards", "UI Considerations" E6 and the 375 px overflow guardrail).
 *
 * The cards are the always-rendered list of photo waypoints, in ascending DEM
 * height, and each "View photo" link must land on its photo in the /photos
 * gallery (/photos#{slug} until Phase 10 ships /photos/{slug}). Below 768 px
 * the card docks at the bottom of its stage block without the story; under
 * reduced motion the cards stack at natural height with the story. Every
 * expected value is derived from the committed data, never hand-typed.
 */

const ascending = [...photos].sort(
  (a, b) => a.elevation.m - b.elevation.m || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
);
const slugs = ascending.map((photo) => editorial[photo.id].slug);
const waypoints = buildWaypoints();

/** A content-hashed manifest derivative: /images/photos/<name>.<10 hex>.<avif|webp>. */
const DERIVATIVE = /^\/images\/photos\/[a-z0-9-]+\.[0-9a-f]{10}\.(avif|webp)$/;

const waypointList = (page: Page) => page.getByRole('list', { name: 'Waypoints, lowest first' });
const card = (page: Page, slug: string) => page.locator(`li[id="waypoint-${slug}"] section`);

test.describe('Waypoint cards (HOME-05)', () => {
  test('every View photo link lands on its photo in the gallery', async ({ page }) => {
    await page.goto('/');

    const links = waypointList(page).getByRole('link', { name: /^View photo/ });
    await expect(links).toHaveCount(slugs.length);
    const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(hrefs).toEqual(slugs.map((slug) => `/photos#${slug}`));

    await page.goto('/photos');
    for (const slug of slugs) {
      await expect(page.locator(`[id="${slug}"]`)).toHaveCount(1);
    }
  });

  test('cards read in ascending altitude with their data', async ({ page }) => {
    await page.goto('/');

    await expect(waypointList(page).getByRole('heading', { level: 2 })).toHaveText(
      waypoints.map((w) => w.title),
    );
    expect(waypoints.map((w) => w.slug)).toEqual(slugs);
    for (const w of waypoints) {
      const section = card(page, w.slug);
      await expect(section).toContainText(waypointKicker(w));
      await expect(section).toContainText(w.placeDate);
    }
    const riffelsee = waypoints.find((w) => w.place.startsWith('Riffelsee'));
    expect(riffelsee?.approximate).toBe(true);
    await expect(card(page, riffelsee!.slug)).toContainText('approx.');
    for (const w of waypoints.filter((x) => !x.approximate)) {
      await expect(card(page, w.slug)).not.toContainText('approx.');
    }
  });

  test('card photos come from the manifest derivatives', async ({ page }) => {
    await page.goto('/');

    const list = waypointList(page);
    const urls = await list.evaluate((ol) => [
      ...[...ol.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? ''),
      ...[...ol.querySelectorAll('source')].flatMap((source) =>
        (source.getAttribute('srcset') ?? '').split(',').map((entry) => entry.trim().split(/\s+/)[0]),
      ),
    ]);
    // One img and two sources of two widths per card.
    expect(urls).toHaveLength(waypoints.length * 5);
    for (const url of urls) {
      expect(url).toMatch(DERIVATIVE);
      expect(url).not.toMatch(/-large|-thumb/);
    }
  });

  test('the docked panel at 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const second = waypoints[1];
    await page
      .locator(`li[id="waypoint-${second.slug}"]`)
      .evaluate((el) => el.scrollIntoView({ block: 'center' }));

    const section = card(page, second.slug);
    // The global scroll-margin shifts the centred block by a few pixels.
    const { bottom, innerHeight } = await section.evaluate((el) => ({
      bottom: el.getBoundingClientRect().bottom,
      innerHeight: window.innerHeight,
    }));
    expect(Math.abs(innerHeight - bottom)).toBeLessThanOrEqual(16);

    await expect(section.getByText(second.story)).toBeHidden();
    const link = section.getByRole('link', { name: `View photo: ${second.title}` });
    await expect(link).toBeVisible();
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('reduced motion stacks the cards', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    for (const w of waypoints) {
      await expect(card(page, w.slug).getByText(w.story)).toBeVisible();
    }
    const boxes = await waypointList(page)
      .locator('section')
      .evaluateAll((sections) =>
        sections.map((s) => {
          const r = s.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom };
        }),
      );
    expect(boxes).toHaveLength(waypoints.length);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].top - boxes[i - 1].bottom).toBeGreaterThanOrEqual(40);
    }

    await page.setViewportSize({ width: 375, height: 812 });
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
