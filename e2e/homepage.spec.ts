import { test, expect } from '@playwright/test';
import { site } from '@/data/site';
import { terrain } from '@/data/generated/terrain';

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
