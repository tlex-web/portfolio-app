import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');

    // The title stays /Portfolio/i until 07-25 rewrites the root metadata.
    await expect(page).toHaveTitle(/Portfolio/i);
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

  test('should display stats section', async ({ page }) => {
    await page.goto('/');

    // Check for stat cards (using .first() since text may appear multiple times)
    await expect(page.getByText(/Landscape Photos/i).first()).toBeVisible();
    await expect(page.getByText(/Active Projects/i).first()).toBeVisible();
    await expect(page.getByText(/Roadmap Complete/i).first()).toBeVisible();
  });
});
