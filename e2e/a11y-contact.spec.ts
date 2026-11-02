import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { site } from '../data/site';

/**
 * SHELL-06: Contact reads at WCAG AA for light-OS and dark-OS visitors alike.
 *
 * The site is forced dark (DSGN-05), so 'light' must render the same pairs as
 * 'dark'. Since 12-13 the summit register sits on the plain surface with every
 * text node on a solid token pair, in each of its states: the field errors,
 * the send-failure box and the signed register entry. Anything axe cannot
 * decide lands in `incomplete`, which is logged for review rather than failed.
 */

/**
 * Fonts loaded, the full height scrolled once (so any shell entrance has
 * fired), back at the top, and every heading, label and text block fully
 * opaque; axe treats a transparent element as hidden and would skip it.
 */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => {
    const main = document.getElementById('main-content');
    if (!main) return false;
    return Array.from(main.querySelectorAll('h1, h2, h3, p, label')).every((el) => {
      for (let node: Element | null = el; node && node !== main; node = node.parentElement) {
        if (getComputedStyle(node).opacity !== '1') return false;
      }
      return true;
    });
  });
}

/**
 * Runs axe color-contrast, logs incomplete nodes, and returns the HTML of the
 * passing nodes (React's SSR text separators `<!-- -->` stripped).
 */
async function expectNoContrastViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

  for (const item of results.incomplete) {
    for (const node of item.nodes) {
      console.log(
        `[a11y-contact ${label}] incomplete ${item.id}: ${node.target.join(' ')} :: ${
          node.any[0]?.message ?? node.failureSummary ?? ''
        }`,
      );
    }
  }

  const violations = results.violations.flatMap((v) =>
    v.nodes.map((n) => `${n.target.join(' ')} :: ${n.failureSummary ?? ''}`),
  );
  expect(violations, `color-contrast violations (${label})`).toEqual([]);

  return results.passes.flatMap((p) => p.nodes.map((n) => n.html.replaceAll('<!-- -->', '')));
}

/** The empty-submit state: labels, inputs and the inline field errors all present. */
async function showFieldErrors(page: Page) {
  await page.getByRole('button', { name: /Send Message/i }).click();
  await expect(page.getByLabel(/Name/i)).toHaveAccessibleDescription(/Enter your name\./);
  await expect(page.getByLabel(/Message/i)).toHaveAccessibleDescription(/Write a message\./);
}

/** Fills valid values and sends them against one mocked /api/feedback answer. */
async function sendWith(page: Page, status: number, code: string) {
  await page.route('**/api/feedback', (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ code }) }),
  );
  await page.getByLabel(/Name/i).fill('Axe Check');
  await page.getByRole('textbox', { name: /Email/i }).fill('axe@example.com');
  await page.getByLabel(/Message/i).fill('A message that is long enough to pass validation.');
  await page.getByRole('button', { name: /Send Message/i }).click();
}

/** The failure box (border-danger + WarningCircle) with the server-error copy and its mailto link. */
async function showFailureBox(page: Page) {
  await sendWith(page, 500, 'server-error');
  await expect(page.getByRole('alert').filter({ hasText: "Couldn't send." })).toBeVisible();
}

/** The failure box's mailto link markup: site.email with a <wbr> after the "@". */
const EMAIL_HTML = site.email.replace('@', '@<wbr>');

async function checkContactInBothStates(page: Page, label: string) {
  await page.goto('/contact');
  await settle(page);
  await showFieldErrors(page);

  const passing = (await expectNoContrastViolations(page, `${label}, field errors`)).join('\n');
  // The rule really measured the header band, the form card and the errors (not skipped as hidden).
  expect(passing).toContain('Summit register');
  expect(passing).toContain('Sign the register');
  expect(passing).toContain('id="name-error"');
  expect(passing).toContain('for="message"');

  await showFailureBox(page);
  const afterFailure = (await expectNoContrastViolations(page, `${label}, failure box`)).join('\n');
  expect(afterFailure).toContain('Your message is still here.');
  expect(afterFailure).toContain(EMAIL_HTML);
}

test.describe('Contact contrast, dark-OS visitor', () => {
  test.use({ colorScheme: 'dark' });

  test('axe color-contrast reports no violations', async ({ page }) => {
    await checkContactInBothStates(page, 'dark');
  });
});

test.describe('Contact contrast, light-OS visitor', () => {
  test.use({ colorScheme: 'light' });

  test('axe color-contrast reports no violations', async ({ page }) => {
    await checkContactInBothStates(page, 'light');
  });

  test('axe color-contrast reports no violations on the register entry', async ({ page }) => {
    await page.goto('/contact');
    await settle(page);
    await sendWith(page, 200, 'ok');
    await expect(page.getByRole('status').filter({ hasText: 'Register signed' })).toBeFocused();

    const passing = (await expectNoContrastViolations(page, 'light, register entry')).join('\n');
    // The h2's markup carries the icon's SVG, which axe shortens; the echo lines are plain text.
    expect(passing).toContain('Signed by Axe Check.');
    expect(passing).toContain("I'll reply to axe@example.com.");
  });
});
