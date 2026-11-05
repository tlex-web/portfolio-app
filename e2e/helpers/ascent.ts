import type { Page } from '@playwright/test';
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
