import { expect, type Page } from '@playwright/test';
import { nextFrames } from './webgl';

/**
 * Ascent navigation helpers for the Home e2e and visual specs (09-06;
 * 09-RESEARCH Pitfall 3). Seek fixed ascent positions by centring a block, not
 * by innerHeight x percent: a centred block sits inside its arrival plateau,
 * and a jump of more than one leg snaps the spring, so two frames suffice.
 */

/** Scrolls the first element matching `selector` to the viewport centre, then waits two frames. */
export async function scrollBlockToCentre(page: Page, selector: string) {
  await page
    .locator(selector)
    .first()
    .evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await nextFrames(page);
}

/** The altimeter rail readout. */
export function readout(page: Page) {
  return page.locator('[data-ascent-readout]');
}

/**
 * Waits until the stage reads '3d' and the canvas has finished fading in
 * (moved from e2e/home-canvas.spec.ts in 14-02 so the B8 live rows share it).
 */
export async function waitForRevealed(page: Page) {
  const stage = page.locator('[data-ascent-stage]');
  /** R3F's wrapper div: it carries the class (and so the fade) and data-grid-size. */
  const canvasBox = page.locator('[data-ascent-stage] [data-grid-size]');
  await expect(stage).toHaveAttribute('data-ascent-mode', '3d', { timeout: 20000 });
  await expect
    .poll(() => canvasBox.evaluate((el) => getComputedStyle(el).opacity), { timeout: 5000 })
    .toBe('1');
}

/**
 * Waits until the camera has settled (14-02, the settledPinBoxes loop in
 * e2e/home-canvas.spec.ts generalised): reads every 3D pin box, then every 10
 * frames until two reads agree within 0.5 px, so the damped spring has
 * finished flying to the scrolled position. Throws if there are no 3D pins or
 * they never settle within 60 rounds.
 */
export async function waitForCameraSettled(page: Page) {
  const read = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-pin-layer="3d"] [data-pin]'), (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y };
      })
    );
  let last = await read();
  if (last.length === 0) throw new Error('waitForCameraSettled: no 3D pins on the page');
  for (let i = 0; i < 60; i++) {
    await nextFrames(page, 10);
    const next = await read();
    const still =
      next.length === last.length &&
      next.every((b, j) => Math.abs(b.x - last[j].x) < 0.5 && Math.abs(b.y - last[j].y) < 0.5);
    last = next;
    if (still) return;
  }
  throw new Error('waitForCameraSettled: the 3D pins did not settle in 60 rounds of 10 frames');
}
