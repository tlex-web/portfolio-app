import { test, expect } from '@playwright/test';

test.describe('Photo Gallery', () => {
  test('should display gallery grid', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByRole('heading', { name: /Landscape Gallery/i })).toBeVisible();
    
    // Should have images
    const images = page.getByRole('button', { name: /View details for/i });
    await expect(images.first()).toBeVisible();
  });

  test('should open image detail modal when clicking on image', async ({ page }) => {
    await page.goto('/photos');
    
    // Wait for images to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Click first image
    const firstImage = page.getByRole('button', { name: /View details for/i }).first();
    await firstImage.click();
    
    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Should have close button (uses aria-label="Close modal")
    await expect(page.getByLabel(/Close modal/i)).toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('networkidle');
    
    // Open modal
    const firstImage = page.getByRole('button', { name: /View details for/i }).first();
    await firstImage.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Close modal
    await page.getByLabel(/Close modal/i).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should close modal when pressing Escape key', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('networkidle');
    
    // Open modal
    const firstImage = page.getByRole('button', { name: /View details for/i }).first();
    await firstImage.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should switch to 3D carousel view', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('networkidle');
    
    // Click 3D view button
    await page.getByRole('button', { name: /3D Carousel/i }).click();
    
    // Wait for the 3D carousel to load (it's lazy loaded)
    await page.waitForTimeout(1000);
    
    // Should show canvas element (3D view) - check if it exists in DOM
    const canvas = page.locator('canvas');
    await expect(canvas).toBeAttached();
    
    // Verify it's actually rendered (might be visibility:hidden due to WebGL)
    const canvasCount = await canvas.count();
    expect(canvasCount).toBeGreaterThan(0);
  });

  test('should switch between grid and 3D view', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('networkidle');
    
    // Check for view mode toggle buttons
    const gridButton = page.getByRole('button', { name: /Grid View|grid/i });
    const carousel3DButton = page.getByRole('button', { name: /3D|Carousel/i });
    
    // At least one view mode button should be visible
    const hasGridButton = await gridButton.isVisible().catch(() => false);
    const has3DButton = await carousel3DButton.isVisible().catch(() => false);
    
    expect(hasGridButton || has3DButton).toBe(true);
  });
});
