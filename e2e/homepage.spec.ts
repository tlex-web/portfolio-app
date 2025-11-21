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
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for navigation links (these are in the header/nav components)
    await expect(page.getByRole('link', { name: /Home/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Photos/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Projects/i }).first()).toBeVisible();
  });

  test('should navigate to photos page', async ({ page }) => {
    await page.goto('/');
    
    await Promise.all([
      page.waitForURL('/photos'),
      page.getByRole('link', { name: /Photos/i }).first().click()
    ]);
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.goto('/');
    
    await Promise.all([
      page.waitForURL('/projects'),
      page.getByRole('link', { name: /Projects/i }).first().click()
    ]);
  });

  test('should display stats section', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for stat cards (using .first() since text may appear multiple times)
    await expect(page.getByText(/Landscape Photos/i).first()).toBeVisible();
    await expect(page.getByText(/Active Projects/i).first()).toBeVisible();
    await expect(page.getByText(/Roadmap Complete/i).first()).toBeVisible();
  });
});
