import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test('should display contact form', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page.getByRole('heading', { name: /Get in Touch/i })).toBeVisible();
    await expect(page.getByLabel(/Name/i)).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Message/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Send Message/i })).toBeVisible();
  });

  test('should show validation error for empty name', async ({ page }) => {
    await page.goto('/contact');
    
    await page.getByRole('button', { name: /Send Message/i }).click();
    
    await expect(page.getByText(/Name is required/i)).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/contact');
    
    await page.getByLabel(/Name/i).fill('John Doe');
    await page.getByLabel(/Email/i).fill('not-an-email');
    await page.getByLabel(/Message/i).fill('This is a test message that is long enough.');
    
    await page.getByRole('button', { name: /Send Message/i }).click();
    
    await expect(page.getByText(/Invalid email address/i)).toBeVisible();
  });

  test('should show validation error for short message', async ({ page }) => {
    await page.goto('/contact');
    
    await page.getByLabel(/Name/i).fill('John Doe');
    await page.getByLabel(/Email/i).fill('john@example.com');
    await page.getByLabel(/Message/i).fill('Short');
    
    await page.getByRole('button', { name: /Send Message/i }).click();
    
    await expect(page.getByText(/at least 10 characters/i)).toBeVisible();
  });

  test('should submit form successfully with valid data', async ({ page }) => {
    await page.goto('/contact');
    
    await page.getByLabel(/Name/i).fill('John Doe');
    await page.getByLabel(/Email/i).fill('john@example.com');
    await page.getByLabel(/Message/i).fill('This is a test message that is definitely long enough to pass validation.');
    
    await page.getByRole('button', { name: /Send Message/i }).click();
    
    // Should show success message
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 });
  });

  test('should reset form after successful submission', async ({ page }) => {
    await page.goto('/contact');
    
    await page.getByLabel(/Name/i).fill('Jane Smith');
    await page.getByLabel(/Email/i).fill('jane@example.com');
    await page.getByLabel(/Message/i).fill('Another test message that is long enough.');
    
    await page.getByRole('button', { name: /Send Message/i }).click();
    
    // Wait for success message
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 });
    
    // Form fields should be cleared
    await expect(page.getByLabel(/Name/i)).toHaveValue('');
    await expect(page.getByLabel(/Email/i)).toHaveValue('');
    await expect(page.getByLabel(/Message/i)).toHaveValue('');
  });

  test('should toggle collaboration checkbox', async ({ page }) => {
    await page.goto('/contact');
    
    const checkbox = page.getByRole('checkbox');
    
    // Should be unchecked by default
    await expect(checkbox).not.toBeChecked();
    
    // Check it
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    
    // Uncheck it
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });
});
