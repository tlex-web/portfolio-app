import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Portfolio/i);
    // Check for the main content section
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check for navigation links (these are in the header/nav components)
    await expect(page.getByRole('link', { name: /Home/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Photos/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Projects/i }).first()).toBeVisible();
  });

  test('should navigate to photos page', async ({ page }) => {
    await page.goto('/');

    // Click the Photos nav link and wait for navigation
    await page.getByRole('link', { name: /Photos/i }).first().click();
    await expect(page).toHaveURL(/\/photos/, { timeout: 15000 });
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.goto('/');

    // Click the Projects nav link and wait for navigation
    await page.getByRole('link', { name: /Projects/i }).first().click();
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
