/**
 * Engine focus conventions the specs must respect (12-23, D-18). Both are
 * platform behaviour that Safari users see too, not site defects, so a test
 * keeps everything else it checks and only routes around the one step.
 *
 * Playwright's WebKit follows Safari's conventions on Windows and macOS, and
 * the GTK conventions on Linux, where CI runs (12-23 A8, CI run 41565046890):
 *
 * - Tab and links: on Windows and macOS, WebKit keeps Safari's default
 *   ("Press Tab to highlight each item" off), so Tab never lands on a link
 *   (12-16, 12-21). Buttons, inputs and other controls are still Tab stops.
 *   Linux WebKit Tabs to links like Chromium and Firefox.
 * - Click and buttons: on Windows and macOS, WebKit keeps the macOS
 *   convention that a mouse click does not focus a button; focus goes to the
 *   nearest focusable ancestor (here `<main tabindex="-1">`). Linux WebKit
 *   focuses the clicked button.
 */

import type { Locator } from '@playwright/test';

/** WebKit with Safari's focus conventions: every platform but Linux. */
function safariConventions(browserName: string): boolean {
  return browserName === 'webkit' && process.platform !== 'linux';
}

/** True when a Tab press can land on a link in this engine and platform. */
export function tabReachesLinks(browserName: string): boolean {
  return !safariConventions(browserName);
}

/** True when a mouse click on a button focuses that button in this engine and platform. */
export function clickFocusesButtons(browserName: string): boolean {
  return !safariConventions(browserName);
}

/**
 * Presses a button the way this engine's users can keep focus on it: a click
 * where a click focuses buttons, otherwise focus and Enter (WebKit with
 * Safari's conventions). A test that asserts "focus stays on the button"
 * after the press then holds everywhere, and there it checks the keyboard
 * path Safari users take.
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
