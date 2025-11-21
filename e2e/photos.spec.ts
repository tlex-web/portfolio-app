import { test, expect } from '@playwright/test';

test.describe('Photo Gallery', () => {
  test('should display gallery grid', async ({ page }) => {
    await page.goto('/photos');
    
    await expect(page.getByRole('heading', { name: /Landscape Photography/i })).toBeVisible();
    
    // Check that images are loaded
    const images = page.getByRole('button', { name: /View details for/i });
    await expect(images.first()).toBeVisible();
  });

  test('should open image detail modal when clicking on image', async ({ page }) => {
    await page.goto('/photos');
    
    // Click first image
    const firstImage = page.getByRole('button', { name: /View details for/i }).first();
    await firstImage.click();
    
    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Should have close button
    await expect(page.getByRole('button', { name: /Close/i })).toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await page.goto('/photos');
    
    // Open modal
    await page.getByRole('button', { name: /View details for/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: /Close/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should close modal when pressing Escape key', async ({ page }) => {
    await page.goto('/photos');
    
    // Open modal
    await page.getByRole('button', { name: /View details for/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should switch to 3D carousel view', async ({ page }) => {
    await page.goto('/photos');
    
    // Click 3D view button
    await page.getByRole('button', { name: /3D Carousel/i }).click();
    
    // Should show canvas element (3D view)
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should filter images by tag', async ({ page }) => {
    await page.goto('/photos');
    
    // Wait for images to load
    await page.waitForSelector('[role="button"][aria-label*="View details for"]');
    
    const initialCount = await page.getByRole('button', { name: /View details for/i }).count();
    
    // Click a tag filter (assuming tags exist)
    const tagButton = page.getByRole('button').filter({ hasText: /mountain|lake|sunset/i }).first();
    if (await tagButton.isVisible()) {
      await tagButton.click();
      
      // Count should change after filtering
      await page.waitForTimeout(500); // Wait for filter animation
      const filteredCount = await page.getByRole('button', { name: /View details for/i }).count();
      
      // Filtered count should be different from initial
      expect(filteredCount).not.toBe(initialCount);
    }
  });
});
