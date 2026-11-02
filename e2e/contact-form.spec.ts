import { test, expect, type Page } from '@playwright/test';
import { site } from '../data/site';

/**
 * The summit register on /contact (CONTACT-01, CONTACT-02; D-02, D-03;
 * 12-UI-SPEC "Validation and submit states"). The locked contract: labels
 * Name, Email and Message, the button Send Message and one checkbox, posting
 * JSON to /api/feedback.
 *
 * Every send is mocked with page.route: CI's dummy Resend key makes the real
 * route answer send-failed (12-RESEARCH Pitfall 5), and each state needs a
 * known answer. Inline error texts are read through the field's accessible
 * description, so the 12-26 summary (which repeats each message) cannot make
 * them ambiguous.
 */

const nameField = (page: Page) => page.getByLabel(/Name/i);
const emailField = (page: Page) => page.getByRole('textbox', { name: /Email/i });
const messageField = (page: Page) => page.getByLabel(/Message/i);
const sendButton = (page: Page) => page.getByRole('button', { name: /Send Message/i });

const MESSAGE = 'This is a test message that is definitely long enough to pass validation.';

/**
 * Opens /contact and waits until React has hydrated the register: text typed
 * into the server-rendered fields before hydration is reset by it (seen in
 * WebKit), and a click before it is a native form post.
 */
async function openContact(page: Page) {
  await page.goto('/contact');
  await expect
    .poll(() =>
      sendButton(page).evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))),
    )
    .toBe(true);
}

async function fillValid(page: Page) {
  await nameField(page).fill('John Doe');
  await emailField(page).fill('john@example.com');
  await messageField(page).fill(MESSAGE);
}

/** Answers every /api/feedback POST with one status, body and optional headers. */
async function mockFeedback(
  page: Page,
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  await page.route('**/api/feedback', (route) =>
    route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) }),
  );
}

/** Every field still holds what was typed. */
async function expectFieldsKept(page: Page) {
  await expect(nameField(page)).toHaveValue('John Doe');
  await expect(emailField(page)).toHaveValue('john@example.com');
  await expect(messageField(page)).toHaveValue(MESSAGE);
}

test.describe('Contact Form', () => {
  test('should display the register with its locked names', async ({ page }) => {
    await openContact(page);

    await expect(page).toHaveTitle('Contact · Tim Lui');
    await expect(page.getByRole('heading', { level: 1, name: 'Contact', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Sign the register' })).toBeVisible();
    await expect(nameField(page)).toBeVisible();
    await expect(emailField(page)).toBeVisible();
    await expect(messageField(page)).toBeVisible();
    await expect(sendButton(page)).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(1);
  });

  test('should show validation error for empty name', async ({ page }) => {
    await openContact(page);

    await sendButton(page).click();

    await expect(nameField(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(nameField(page)).toHaveAccessibleDescription(/Enter your name\./);
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await openContact(page);

    await nameField(page).fill('John Doe');
    await emailField(page).fill('not-an-email');
    await messageField(page).fill(MESSAGE);
    await sendButton(page).click();

    await expect(emailField(page)).toHaveAccessibleDescription(
      /Enter a full email address, with an @ and a domain\./,
    );
  });

  test('should show validation error for short message', async ({ page }) => {
    await openContact(page);

    await nameField(page).fill('John Doe');
    await emailField(page).fill('john@example.com');
    await messageField(page).fill('Short');
    await sendButton(page).click();

    await expect(messageField(page)).toHaveAccessibleDescription(
      /Write at least 10 characters \(now 5\)\./,
    );
  });

  test('should sign the register and offer an empty form again', async ({ page }) => {
    await mockFeedback(page, 200, { code: 'ok' });
    await openContact(page);

    await fillValid(page);
    const request = page.waitForRequest('**/api/feedback');
    await sendButton(page).click();
    const payload = (await request).postDataJSON();
    expect(payload).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      message: MESSAGE,
      interestedInCollaboration: false,
      trail_note: '',
    });

    const entry = page.getByRole('status').filter({ hasText: 'Register signed' });
    await expect(entry).toBeFocused();
    await expect(entry).toContainText('Signed by John Doe.');
    await expect(entry).toContainText("I'll reply to john@example.com.");

    await page.getByRole('button', { name: 'Sign again' }).click();
    await expect(nameField(page)).toBeFocused();
    await expect(nameField(page)).toHaveValue('');
    await expect(emailField(page)).toHaveValue('');
    await expect(messageField(page)).toHaveValue('');
  });

  test('should keep every word and offer Retry when the send fails', async ({ page }) => {
    await mockFeedback(page, 502, { code: 'send-failed' });
    await openContact(page);

    await fillValid(page);
    await sendButton(page).click();

    const box = page.getByRole('alert').filter({ hasText: "Couldn't send." });
    await expect(box).toBeFocused();
    await expect(box).toContainText('Your message is still here.');
    await expect(box.getByRole('button', { name: 'Retry sending' })).toBeVisible();
    await expect(box.getByRole('link', { name: site.email })).toHaveAttribute(
      'href',
      `mailto:${site.email}`,
    );
    await expect(page.getByText('Register signed')).toHaveCount(0);
    await expectFieldsKept(page);
  });

  test('should read the minutes from Retry-After when rate limited', async ({ page }) => {
    await mockFeedback(page, 429, { code: 'rate-limited', retryAfterS: 120 }, { 'Retry-After': '120' });
    await openContact(page);

    await fillValid(page);
    await sendButton(page).click();

    const box = page.getByRole('alert').filter({ hasText: 'Too many attempts.' });
    await expect(box).toBeFocused();
    await expect(box).toContainText('Try again in 2 minutes, or email me at');
    await expect(box.getByRole('button', { name: 'Retry sending' })).toHaveCount(0);
    await expectFieldsKept(page);
  });

  test('should ask for a reload when the origin is rejected', async ({ page }) => {
    await mockFeedback(page, 403, { code: 'origin-rejected' });
    await openContact(page);

    await fillValid(page);
    await sendButton(page).click();

    const box = page.getByRole('alert').filter({ hasText: "Couldn't verify this page." });
    await expect(box).toBeFocused();
    await expect(box).toContainText('Copy your message, reload the page and send it again');
    await expect(box.getByRole('button', { name: 'Retry sending' })).toHaveCount(0);
    await expectFieldsKept(page);
  });

  // UI-SPEC E1 and E6 overflow: the header band, the form and an entry echoing
  // an unbroken name and address all stay inside a 375 px viewport.
  test('should never scroll sideways at 375 px, even with a long entry', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await mockFeedback(page, 200, { code: 'ok' });
    await openContact(page);

    const noSidewaysScroll = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
    expect(await noSidewaysScroll()).toBe(true);

    const longName = 'N'.repeat(100);
    const longEmail = `${'a'.repeat(60)}@${'b'.repeat(60)}.example`;
    await nameField(page).fill(longName);
    await emailField(page).fill(longEmail);
    await messageField(page).fill(MESSAGE);
    await sendButton(page).click();

    const entry = page.getByRole('status').filter({ hasText: 'Register signed' });
    await expect(entry).toContainText(`Signed by ${longName}.`);
    await expect(entry).toContainText(`I'll reply to ${longEmail}.`);
    expect(await noSidewaysScroll()).toBe(true);
  });

  test('should toggle collaboration checkbox', async ({ page }) => {
    await openContact(page);

    const checkbox = page.getByRole('checkbox');

    // Should be unchecked by default
    await expect(checkbox).not.toBeChecked();

    // Check it
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Uncheck it
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });
});
