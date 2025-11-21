import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Portfolio/i);
    await expect(page.getByRole('heading', { name: /Welcome to My Portfolio/i })).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('link', { name: /Home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Photos/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Projects/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Roadmap/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Contact/i })).toBeVisible();
  });

  test('should navigate to photos page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: /Photos/i }).click();
    await expect(page).toHaveURL('/photos');
    await expect(page.getByRole('heading', { name: /Landscape Photography/i })).toBeVisible();
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: /Projects/i }).click();
    await expect(page).toHaveURL('/projects');
    await expect(page.getByRole('heading', { name: /Programming Projects/i })).toBeVisible();
  });

  test('should scroll down to main content', async ({ page }) => {
    await page.goto('/');
    
    // Click "Explore My Work" button
    await page.getByRole('link', { name: /Explore My Work/i }).click();
    
    // Check that we scrolled to main content section
    await expect(page.locator('#main-content')).toBeInViewport();
  });

  test('should display stats section', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to stats
    await page.locator('#main-content').scrollIntoViewIfNeeded();
    
    // Check for stat cards
    await expect(page.getByText(/Landscape Photos/i)).toBeVisible();
    await expect(page.getByText(/Active Projects/i)).toBeVisible();
    await expect(page.getByText(/Roadmap Complete/i)).toBeVisible();
  });
});
