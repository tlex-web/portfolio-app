/**
 * Engine focus conventions the specs must respect (12-23, D-18). Both are
 * platform behaviour that Safari users see too, not site defects, so a test
 * keeps everything else it checks and only routes around the one step.
 *
 * - Tab and links: Playwright's WebKit keeps Safari's default ("Press Tab to
 *   highlight each item" off), so Tab never lands on a link (12-16, 12-21).
 *   Buttons, inputs and other controls are still Tab stops.
 * - Click and buttons: WebKit keeps the macOS convention that a mouse click
 *   does not focus a button; focus goes to the nearest focusable ancestor
 *   (here `<main tabindex="-1">`), so "focus stays on the pressed button" is a
 *   Chromium and Firefox fact only.
 */

import type { Locator } from '@playwright/test';

/** True when a Tab press can land on a link in this engine. */
export function tabReachesLinks(browserName: string): boolean {
  return browserName !== 'webkit';
}

/** True when a mouse click on a button focuses that button in this engine. */
export function clickFocusesButtons(browserName: string): boolean {
  return browserName !== 'webkit';
}

/**
 * Presses a button the way this engine's users can keep focus on it: a click
 * where a click focuses buttons, otherwise focus and Enter (WebKit). A test
 * that asserts "focus stays on the button" after the press then holds in
 * every engine, and in WebKit it checks the keyboard path Safari users take.
 */
export async function pressButton(
  button: Locator,
  browserName: string,
  options: { force?: boolean } = {}
): Promise<void> {
  if (clickFocusesButtons(browserName)) {
    await button.click(options);
    return;
  }
  await button.focus();
  await button.press('Enter');
}
