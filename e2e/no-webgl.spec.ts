import { test, expect } from '@playwright/test';
import { projects } from '@/data/projects';
import { regionPhotoViews } from '@/lib/regions';
import { disableWebGL, expectNoErrorPage, nextFrames } from './helpers/webgl';

/** The demo terminal's region is named after its project (11-03), read from the data. */
const demoProject = projects.find((p) => p.slug === 'box' && p.demo?.commands.length);
if (!demoProject) throw new Error('no project with demo commands');
const demoRegionName = `${demoProject.name} demo`;

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

  // Home mounts no canvas without WebGL2 at all: the capability gate (09-07)
  // keeps it on the poster, so there is no WebGL failure to wait for
  // (09-RESEARCH Pitfall 1). It must still be the complete page.
  test('home keeps its content', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-ascent-stage]')).toHaveAttribute('data-ascent-mode', 'static');
    await expect(page.locator('[data-sheet-box] img')).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('li[data-ascent-block="waypoint"] section')).toHaveCount(4);
    await expect(page.locator('#summit')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 2, name: 'About', exact: true })).toBeVisible();
    await expectNoErrorPage(page);
  });

  // Contact mounts no canvas since 12-13 (D-05: the gradient mesh is gone), so
  // there is no WebGL failure to wait for. It must still be the complete page.
  test('contact keeps the form', async ({ page }) => {
    await page.goto('/contact');
    await nextFrames(page);

    await expectNoErrorPage(page);
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Contact', exact: true })).toBeVisible();
    await expect(page.getByLabel(/Name/i)).toBeVisible();
  });

  // Rewritten in 18-21 (PHOTO-06) from 'photos carousel falls back to the stepper', before
  // 18-22 retires the carousel: a photo is seen on its region page and in the photo viewer,
  // neither of which mounts a canvas, so without WebGL both must still be the complete page,
  // never the error page.
  test('the region page and the photo viewer need no WebGL', async ({ page }) => {
    const series = regionPhotoViews('zermatt');
    expect(series.length, 'Next needs two photos').toBeGreaterThanOrEqual(2);
    await page.goto('/photos/regions/zermatt');

    await expect(
      page.getByRole('list', { name: 'Zermatt photographs, lowest first', exact: true })
    ).toBeVisible();
    await expect(page.locator('[data-plate-sheet="zermatt"]')).toBeVisible();

    const link = page.locator(`li[data-sequence-item="${series[0].slug}"] [data-photo-id]`);
    await expect
      .poll(
        () => link.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))),
        { timeout: 15000 }
      )
      .toBe(true);
    await link.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog.locator('[data-photo-counter]')).toHaveText(`1 / ${series.length}`);
    await dialog.getByRole('button', { name: 'Next photo', exact: true }).click();
    await expect(dialog.locator('[data-photo-counter]')).toHaveText(`2 / ${series.length}`);
    await expect(page).toHaveURL(new RegExp(`/photos/${series[1].slug}$`));
    await nextFrames(page);

    await expect(page.locator('canvas')).toHaveCount(0);
    await expectNoErrorPage(page);
  });

  // The case study mounts no canvas at all since 11-01 (D-01: the flat
  // DemoTerminal replaced the R3F laptop), so there is no WebGL failure to
  // wait for (11-RESEARCH Pitfall 4). It must still be the complete page.
  test('project detail keeps its content', async ({ page }) => {
    await page.goto(`/projects/${demoProject.slug}`);

    await expectNoErrorPage(page);
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'Demo', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: demoRegionName })).toBeVisible();
  });
});
