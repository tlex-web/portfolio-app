import { test, expect, type Page } from '@playwright/test';
import { decode } from 'fast-png';

/**
 * The live terrain canvas in a browser (HOME-02; D-16, D-17, D-18, D-22;
 * 09-UI-SPEC "Stage: Poster, Sheet Box and Canvas", "Night-tinted relief" and
 * the E2 "Terrain canvas" rows; 09-RESEARCH "SwiftShader smoke check by pixel
 * sampling").
 *
 * Chromium renders WebGL through SwiftShader here, so these checks run on real
 * pixels: the canvas must fade in over the poster at p = 0 without a visible
 * change (the plan view of the poster, drawn with the same relief formula and
 * contour colours). Headless Firefox on the CI runner has no WebGL, so every
 * title carries '@chromium-only' (the Firefox project drops them).
 */

const stage = (page: Page) => page.locator('[data-ascent-stage]');
/** R3F's wrapper div: it carries the class (and so the fade) and data-grid-size. */
const canvasBox = (page: Page) => page.locator('[data-ascent-stage] [data-grid-size]');

/** Waits until the stage reads '3d' and the canvas has finished fading in. */
async function waitForRevealed(page: Page) {
  await expect(stage(page)).toHaveAttribute('data-ascent-mode', '3d', { timeout: 20000 });
  await expect
    .poll(() => canvasBox(page).evaluate((el) => getComputedStyle(el).opacity), { timeout: 5000 })
    .toBe('1');
}

/** Mean absolute difference over the R, G and B channels of two same-size PNG screenshots. */
function meanAbsDiff(a: Buffer, b: Buffer): number {
  const pa = decode(a);
  const pb = decode(b);
  expect([pb.width, pb.height]).toEqual([pa.width, pa.height]);
  let sum = 0;
  let count = 0;
  for (let i = 0, j = 0; i < pa.data.length; i += pa.channels, j += pb.channels) {
    for (let c = 0; c < 3; c++) sum += Math.abs(pa.data[i + c] - pb.data[j + c]);
    count += 3;
  }
  return sum / count;
}

test.describe('Home terrain canvas (HOME-02)', () => {
  test('canvas fades in over the poster at p = 0 @chromium-only', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForRevealed(page);

    const withCanvas = await stage(page).screenshot();
    await page.addStyleTag({ content: 'canvas { visibility: hidden !important; }' });
    const posterOnly = await stage(page).screenshot();

    const diff = meanAbsDiff(withCanvas, posterOnly);
    test.info().annotations.push({ type: 'mean-abs-diff', description: diff.toFixed(3) });
    expect(diff).toBeLessThanOrEqual(3);
  });
});
