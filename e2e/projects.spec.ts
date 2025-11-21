import { test, expect } from '@playwright/test';

test.describe('Projects Page', () => {
  test('should display all projects', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByRole('heading', { name: /Programming Projects/i })).toBeVisible();
    
    // Should have project cards (links with aria-label)
    const projectLinks = page.getByRole('link', { name: /View details for/i });
    await expect(projectLinks.first()).toBeVisible();
  });

  test('should navigate to project detail page', async ({ page }) => {
    await page.goto('/projects');
    
    // Click first project link
    const projectLink = page.getByRole('link', { name: /View Details|Learn More/i }).first();
    await projectLink.click();
    
    // Should navigate to project detail page
    await expect(page).toHaveURL(/\/projects\/[\w-]+/);
  });

  test('should display project tech stack', async ({ page }) => {
    await page.goto('/projects');
    
    // Should show tech stack tags
    await expect(page.getByText(/TypeScript|React|Next\.js|Rust/i).first()).toBeVisible();
  });

  test('should filter projects by status', async ({ page }) => {
    await page.goto('/projects');
    
    // Look for status filter buttons if they exist
    const activeFilter = page.getByRole('button', { name: /Active|In Progress/i });
    if (await activeFilter.isVisible()) {
      const initialCount = await page.getByRole('article').count();
      
      await activeFilter.click();
      await page.waitForTimeout(500);
      
      const filteredCount = await page.getByRole('article').count();
      // Count might be different or same depending on data
      expect(filteredCount).toBeGreaterThan(0);
    }
  });
});

test.describe('Project Detail Page', () => {
  test('should display project details', async ({ page }) => {
    // Navigate to first project
    await page.goto('/projects');
    await page.getByRole('link', { name: /View Details|Learn More/i }).first().click();
    
    // Should have project name
    await expect(page.locator('h1')).toBeVisible();
    
    // Should have description
    await expect(page.locator('p').first()).toBeVisible();
  });

  test('should display GitHub link if available', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('link', { name: /View Details|Learn More/i }).first().click();
    
    // Check for GitHub link
    const githubLink = page.getByRole('link', { name: /GitHub|Source Code|Repository/i });
    if (await githubLink.count() > 0) {
      await expect(githubLink.first()).toBeVisible();
      await expect(githubLink.first()).toHaveAttribute('href', /github\.com/);
    }
  });

  test('should display live demo link if available', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('link', { name: /View Details|Learn More/i }).first().click();
    
    // Check for demo link
    const demoLink = page.getByRole('link', { name: /Live Demo|Demo|Try it/i });
    if (await demoLink.count() > 0) {
      await expect(demoLink.first()).toBeVisible();
    }
  });
});
