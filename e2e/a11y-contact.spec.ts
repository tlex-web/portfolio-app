import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { site } from '../data/site';

/**
 * SHELL-06: Contact reads at WCAG AA for light-OS and dark-OS visitors alike.
 *
 * The site is forced dark (DSGN-05), so 'light' must render the same pairs as
 * 'dark'. Every text node sits on a solid surface-raised panel, never on the
 * AnimatedGradientMesh canvas, so the result must also hold with the canvas
 * hidden (no WebGL). axe cannot read canvas pixels; anything it cannot decide
 * lands in `incomplete`, which is logged for review rather than failed.
 */

/**
 * Fonts loaded, every once:true whileInView entrance fired (scroll the full
 * height), back at the top, and every heading, label and text block fully
 * opaque. Motion drives the entrances with requestAnimationFrame, so waiting
 * on document.getAnimations() alone is not enough; axe treats a transparent
 * element as hidden and would skip it.
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

/** The empty-submit state: labels, inputs, field errors and helper text all present. */
async function showFieldErrors(page: Page) {
  await page.getByRole('button', { name: /Send Message/i }).click();
  await expect(page.getByText(/Name is required/i)).toBeVisible();
  await expect(page.getByText(/Message is required/i)).toBeVisible();
}

/** The failure box (border-danger + WarningCircle), with the server error copy. */
async function showFailureBox(page: Page) {
  await page.route('**/api/feedback', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Something went wrong. Please try again later.' }),
    }),
  );
  await page.getByLabel(/Name/i).fill('Axe Check');
  await page.getByRole('textbox', { name: /Email/i }).fill('axe@example.com');
  await page.getByLabel(/Message/i).fill('A message that is long enough to pass validation.');
  await page.getByRole('button', { name: /Send Message/i }).click();
  await expect(page.getByRole('alert').filter({ hasText: /Something went wrong/ })).toBeVisible();
}

/** The Email card's markup: site.email with a <wbr> after the "@". */
const EMAIL_HTML = site.email.replace('@', '@<wbr>');

async function checkContactInBothStates(page: Page, label: string) {
  await page.goto('/contact');
  await settle(page);
  await showFieldErrors(page);

  const passing = (await expectNoContrastViolations(page, `${label}, field errors`)).join('\n');
  // The rule really measured the hero, the form and the info cards (not skipped as hidden).
  expect(passing).toContain('Get in Touch');
  expect(passing).toContain('Send Me a Message');
  expect(passing).toContain('id="name-error"');
  expect(passing).toContain('for="message"');
  expect(passing).toContain(EMAIL_HTML);

  await showFailureBox(page);
  const afterFailure = (await expectNoContrastViolations(page, `${label}, failure box`)).join('\n');
  expect(afterFailure).toContain('Something went wrong. Please try again later.');
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

  test('axe color-contrast reports no violations without the mesh', async ({ page }) => {
    await page.goto('/contact');
    await page.addStyleTag({ content: 'canvas { visibility: hidden !important; }' });
    await settle(page);
    await showFieldErrors(page);

    const passing = (await expectNoContrastViolations(page, 'light, no mesh')).join('\n');
    expect(passing).toContain('Get in Touch');
    expect(passing).toContain(EMAIL_HTML);
  });
});
