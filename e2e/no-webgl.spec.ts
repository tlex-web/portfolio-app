import { test, expect } from '@playwright/test';
import { disableWebGL, expectNoErrorPage, nextFrames, webglFailure } from './helpers/webgl';

/**
 * Every route with a react-three-fiber canvas must still render without WebGL (hardware
 * acceleration off, webgl.disabled, headless Firefox on the CI runner).
 *
 * Since @react-three/fiber 9.8 a WebGLRenderer that cannot be created is rethrown through
 * React, so a <Canvas> outside SafeCanvas replaces the whole route with app/(site)/error.tsx.
 * WebGL is switched off with an init script, so the check behaves the same in every browser.
 * The helpers live in e2e/helpers/webgl.ts (shared with the Home ascent specs).
 */

test.describe('Without WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await disableWebGL(page);
  });

  test('home keeps its content', async ({ page }) => {
    const failed = webglFailure(page);
    await page.goto('/');
    await failed;
    await nextFrames(page);

    await expectNoErrorPage(page);
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('contact keeps the form', async ({ page }) => {
    const failed = webglFailure(page);
    await page.goto('/contact');
    await failed;
    await nextFrames(page);

    await expectNoErrorPage(page);
    await expect(page.getByRole('heading', { name: /Get in Touch/i })).toBeVisible();
    await expect(page.getByLabel(/Name/i)).toBeVisible();
  });

  test('photos keeps the gallery page in 3D view', async ({ page }) => {
    await page.goto('/photos');
    await expect(page.getByRole('button', { name: /View details for/i }).first()).toBeVisible();

    const failed = webglFailure(page);
    await page.getByRole('button', { name: /3D Carousel/i }).click();
    await failed;
    await nextFrames(page);

    await expectNoErrorPage(page);
    await expect(page.getByRole('heading', { name: /Landscape Gallery/i })).toBeVisible();
  });

  test('project detail keeps its content', async ({ page }) => {
    const failed = webglFailure(page);
    await page.goto('/projects/clix-cli');
    await failed;
    await nextFrames(page);

    await expectNoErrorPage(page);
    await expect(page.getByRole('heading', { name: /Experience CLI_X in 3D/i })).toBeVisible();
  });
});
