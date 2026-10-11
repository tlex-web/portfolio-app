import { test, expect, type Page } from '@playwright/test';

/**
 * Every route with a react-three-fiber canvas must still render without WebGL (hardware
 * acceleration off, webgl.disabled, headless Firefox on the CI runner).
 *
 * Since @react-three/fiber 9.8 a WebGLRenderer that cannot be created is rethrown through
 * React, so a <Canvas> outside SafeCanvas replaces the whole route with app/error.tsx.
 * WebGL is switched off with an init script, so the check behaves the same in every browser.
 */

async function disableWebGL(page: Page) {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error -- overriding the overloaded DOM signature with one implementation
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type.startsWith('webgl') || type === 'experimental-webgl') return null;
      return (getContext as (...args: unknown[]) => RenderingContext | null).call(
        this,
        type,
        ...rest
      );
    };
  });
}

/** Resolves once three.js has logged that it could not create a WebGL context. */
function webglFailure(page: Page) {
  return page.waitForEvent('console', {
    predicate: (msg) =>
      msg.type() === 'error' && msg.text().includes('Error creating WebGL context'),
    timeout: 15000,
  });
}

/** Lets React commit whatever the failed canvas scheduled (two animation frames). */
async function settle(page: Page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
}

async function expectNoErrorPage(page: Page) {
  await expect(page.getByRole('heading', { name: /Something went wrong/i })).toHaveCount(0);
}

test.describe('Without WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await disableWebGL(page);
  });

  test('home keeps its content', async ({ page }) => {
    const failed = webglFailure(page);
    await page.goto('/');
    await failed;
    await settle(page);

    await expectNoErrorPage(page);
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('contact keeps the form', async ({ page }) => {
    const failed = webglFailure(page);
    await page.goto('/contact');
    await failed;
    await settle(page);

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
    await settle(page);

    await expectNoErrorPage(page);
    await expect(page.getByRole('heading', { name: /Landscape Gallery/i })).toBeVisible();
  });

  test('project detail keeps its content', async ({ page }) => {
    const failed = webglFailure(page);
    await page.goto('/projects/clix-cli');
    await failed;
    await settle(page);

    await expectNoErrorPage(page);
    await expect(page.getByRole('heading', { name: /Experience CLI_X in 3D/i })).toBeVisible();
  });
});
