import { test, expect, type Page } from '@playwright/test';
import { photos } from '@/data/generated/photos';
import { editorial } from '@/data/photos/editorial';
import { projects } from '@/data/projects';
import { home } from '@/data/home';
import { site } from '@/data/site';
import { summitPlaque } from '@/lib/ascent/summit';
import { buildWaypoints, waypointKicker } from '@/lib/ascent/waypoints';
import { countLabel } from '@/lib/home-format';

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

/** The accessible name TrailSigns builds: the site.nav label, then the count. */
function signName(href: string, count: string): string {
  const entry = site.nav.find((item) => item.href === href);
  if (!entry) throw new Error(`no site.nav entry for ${href}`);
  return count ? `${entry.label}, ${count}` : entry.label;
}

/**
 * The end of the ascent in a browser (HOME-03, HOME-06; D-03, D-13, D-14,
 * D-15; 09-UI-SPEC "Summit Section", "Hero Block" cue row, "About and
 * Contact" and "UI Considerations" E5, E9). The plaque values, sign names,
 * card titles and About copy come from summitPlaque(), the data files and
 * buildWaypoints(), never from literals.
 */
test.describe('Summit, trail signs and About (HOME-03, HOME-06)', () => {
  const plaque = summitPlaque();
  const summit = (page: Page) => page.locator('#summit');

  test('plaque shows the derived summit stats', async ({ page }) => {
    await page.goto('/');
    const section = summit(page);
    await section.scrollIntoViewIfNeeded();

    await expect(section.getByText(plaque.kicker, { exact: true })).toBeVisible();
    await expect(section.getByRole('heading', { level: 2, name: plaque.title, exact: true })).toBeVisible();
    await expect(section.getByText(plaque.height, { exact: true })).toBeVisible();

    const items = section.locator('dl > div');
    await expect(items).toHaveCount(plaque.stats.length);
    for (const [i, stat] of plaque.stats.entries()) {
      const item = items.nth(i);
      await expect(item.locator('dt')).toHaveText(stat.label);
      await expect(item.locator('dd')).toBeVisible();
      await expect(item.locator('dd')).toContainText(stat.value);
      if (stat.note) await expect(item.locator('dd')).toContainText(stat.note);
    }
  });

  test('trail signs appear in the hero and at the summit', async ({ page }) => {
    await page.goto('/');

    const groups = page.locator('ul[aria-label="Trail signs"]');
    await expect(groups).toHaveCount(2);
    const signs = [
      { name: signName('/photos', countLabel(photos.length, 'waypoint', 'waypoints')), href: '/photos' },
      { name: signName('/projects', countLabel(projects.length, 'route', 'routes')), href: '/projects' },
    ];
    for (const group of [groups.nth(0), groups.nth(1)]) {
      await expect(group.getByRole('link')).toHaveCount(signs.length);
      for (const { name, href } of signs) {
        await expect(group.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
      }
    }
    await expect(page.locator('[data-ascent-block="hero"] ul[aria-label="Trail signs"]')).toHaveCount(1);
    await expect(summit(page).locator('ul[aria-label="Trail signs"]')).toHaveCount(1);
  });

  test('Skip to the summit moves focus to the summit', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Skip to the summit', exact: true }).click();
    await expect(page).toHaveURL(/#summit$/);
    await expect(summit(page)).toBeFocused();
    const { top, innerHeight } = await summit(page).evaluate((el) => ({
      top: el.getBoundingClientRect().top,
      innerHeight: window.innerHeight,
    }));
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(innerHeight);
  });

  test('Start the ascent resolves to the first waypoint', async ({ page }) => {
    await page.goto('/');

    const start = page.getByRole('link', { name: 'Start the ascent', exact: true });
    const href = await start.getAttribute('href');
    expect(href).toBe(`#waypoint-${waypoints[0].slug}`);
    await expect(page.locator(`[id="${href!.slice(1)}"]`)).toHaveCount(1);
  });

  test('heading outline has no skipped level', async ({ page }) => {
    await page.goto('/');
    const main = page.getByRole('main');

    await expect(main.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(main.getByRole('heading', { level: 2 })).toHaveText([
      ...waypoints.map((w) => w.title),
      plaque.title,
      'About',
    ]);
    await expect(main.locator('h3, h4, h5, h6')).toHaveCount(0);
  });

  test('About and contact', async ({ page }) => {
    await page.goto('/');
    const about = page.getByRole('region', { name: 'About' });
    const { contactLink, roadmapLink } = home.about.contact;

    await expect(about.getByRole('heading', { level: 2, name: 'About', exact: true })).toBeVisible();
    await expect(about.getByText(home.about.body, { exact: true })).toBeVisible();
    await expect(about.getByRole('link', { name: contactLink.label, exact: true })).toHaveAttribute(
      'href',
      contactLink.href,
    );
    await expect(about.getByRole('link', { name: roadmapLink.label, exact: true })).toHaveAttribute(
      'href',
      roadmapLink.href,
    );
    expect([contactLink.href, roadmapLink.href]).toEqual(['/contact', '/roadmap']);
  });

  test('nothing overflows at 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const overflow = () =>
      page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
    let { scrollWidth, clientWidth } = await overflow();
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    await summit(page).evaluate((el) => el.scrollIntoView({ block: 'end' }));
    ({ scrollWidth, clientWidth } = await overflow());
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Plaque values never wrap; every dd value is one line inside its column.
    const values = await summit(page)
      .locator('dd > span.whitespace-nowrap')
      .evaluateAll((spans) =>
        spans.map((s) => {
          const r = s.getBoundingClientRect();
          const col = s.closest('div')!.getBoundingClientRect();
          return { height: r.height, right: r.right, colRight: col.right };
        }),
      );
    expect(values).toHaveLength(plaque.stats.length);
    for (const v of values) {
      expect(v.height).toBeLessThan(30);
      expect(v.right).toBeLessThanOrEqual(v.colRight + 0.5);
    }
  });
});
