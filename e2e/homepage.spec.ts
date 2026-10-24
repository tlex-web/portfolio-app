import { test, expect } from '@playwright/test';
import { site } from '@/data/site';
import { terrain } from '@/data/generated/terrain';
import { photos } from '@/data/generated/photos';
import { projects } from '@/data/projects';
import { lv95ToWgs84 } from '@/lib/geo';
import { countLabel, formatLatLon } from '@/lib/home-format';

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Root metadata title from SHELL-03 (07-25): 'Tim Lui · Developer & photographer'.
    await expect(page).toHaveTitle(/Tim Lui/);
    // The shell's main landmark (SiteChrome), exactly one per route.
    await expect(page.locator('#main-content')).toHaveCount(1);
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');

    // The one Primary nav from SiteNav; destinations come from data/site.ts.
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav).toHaveCount(1);
    await expect(nav.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Photographs', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Engineering', exact: true })).toBeVisible();
  });

  test('should navigate to photos page', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Primary' });
    await nav.getByRole('link', { name: 'Photographs', exact: true }).click();
    await expect(page).toHaveURL(/\/photos/, { timeout: 15000 });
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Primary' });
    await nav.getByRole('link', { name: 'Engineering', exact: true }).click();
    await expect(page).toHaveURL(/\/projects/, { timeout: 15000 });
  });

  test('server HTML shows the name, role and relief poster (HOME-01)', async ({ page }) => {
    // The raw server response, before any script runs: the first viewport is
    // complete HTML (09-UI-SPEC "Hero Block", "Stage: Poster, Sheet Box and Canvas").
    const response = await page.request.get('/');
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain('<h1');
    expect(html).toContain(site.name);
    // React escapes '&' in text children; compare against the escaped form.
    expect(html).toContain(site.role.replace('&', '&amp;'));
    expect(html).toContain(terrain.assets.hillshade.webp['1100']);

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: site.name })).toBeVisible();
  });
});

/** The accessible name TrailSigns builds for a sign: the site.nav label, then the count. */
function signName(href: string, count: string): string {
  const entry = site.nav.find((item) => item.href === href);
  if (!entry) throw new Error(`no site.nav entry for ${href}`);
  return `${entry.label}, ${count}`;
}

test.describe('Home without JavaScript (HOME-01)', () => {
  // HOME-01: the first viewport is complete server HTML. With scripts off, the
  // name, role, derived kicker and both trail signs are readable above the fold
  // and nothing scrolls sideways (closes the Phase 8 375 px overflow item, D-14).
  test.use({ javaScriptEnabled: false });

  const kicker = formatLatLon(lv95ToWgs84(terrain.summit.lv95));
  const signs = [
    signName('/photos', countLabel(photos.length, 'waypoint', 'waypoints')),
    signName('/projects', countLabel(projects.length, 'route', 'routes')),
  ];

  for (const viewport of [
    { width: 375, height: 667 },
    { width: 1440, height: 900 },
  ]) {
    test(`first viewport at ${viewport.width} x ${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const main = page.locator('#main-content');
      const targets = [
        main.getByRole('heading', { level: 1, name: site.name, exact: true }),
        main.getByText(site.role, { exact: true }),
        main.getByText(kicker, { exact: true }),
        ...signs.map((name) => main.getByRole('link', { name, exact: true })),
      ];

      for (const target of targets) {
        await expect(target).toHaveCount(1);
        await expect(target).toBeVisible();
        const box = await target.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
      }

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});
