import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { HONEYPOT_FIELD } from '../../lib/contact/api-contract';

/**
 * The contact form on the deployed production site. Run it with
 * `npm run test:prod-form`. It is not part of `npx playwright test` or CI.
 *
 * What each level costs (the limiter allows 5 requests per IP per hour, counted
 * before the body is read, so an invalid body uses a slot too):
 *
 * | Level                 | Sends email | Slots | Proves                               |
 * |-----------------------|-------------|-------|--------------------------------------|
 * | default               | no          | 2     | page, client validation, origin      |
 * |                       |             |       | check, limiter reachable, honeypot   |
 * | PROD_FORM_SEND=1      | YES, one    | +1    | Resend and the recipient are set up: |
 * |                       |             |       | the whole path through the real form |
 * | PROD_FORM_LIMIT=1     | no          | rest  | the Upstash limiter is really on.    |
 * |                       |             |       | Locks this IP out for up to an hour  |
 *
 * The limiter silently allows everything when the Upstash variables are missing,
 * and the default level cannot see that: only PROD_FORM_LIMIT=1 can. Set both
 * flags to run the send first and the lockout last. The opt-in tests exist only
 * when their flag is set. A failure that says "rate limited" is no finding about
 * the route: run it again once the window has passed.
 */
const SEND = process.env.PROD_FORM_SEND === '1';
const LIMIT = process.env.PROD_FORM_LIMIT === '1';

/** More requests than the limiter's window allows, so a working limiter must answer 429. */
const LIMIT_PROBES = 6;

const FEEDBACK_PATH = '/api/feedback';

/** Not a real inbox: the route only uses this as the email's reply-to. */
const PROBE_EMAIL = 'prod-form-probe@example.com';

const probeMessage = () =>
  `Automated production form test, ${new Date().toISOString()}. No reply needed.`;

const INVALID_BODY = { name: '', email: 'not-an-email', message: 'short' };

const originOf = (baseURL: string | undefined) => new URL(baseURL ?? '').origin;

const nameField = (page: Page) => page.getByLabel(/Name/i);
const emailField = (page: Page) => page.getByRole('textbox', { name: /Email/i });
const messageField = (page: Page) => page.getByLabel(/Message/i);
const sendButton = (page: Page) => page.getByRole('button', { name: /Send Message/i });

/** Opens /contact and waits for hydration: a click before it is a native form post. */
async function openContact(page: Page) {
  const response = await page.goto('/contact');
  expect(response?.status()).toBe(200);
  await expect
    .poll(() =>
      sendButton(page).evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps')))
    )
    .toBe(true);
}

/** Posts JSON the way the form does, with the Origin header a browser would send. */
function postFeedback(request: APIRequestContext, origin: string, data: unknown) {
  return request.post(FEEDBACK_PATH, { headers: { origin }, data });
}

/** A used-up window says nothing about the route, so the failure says that and not more. */
function expectNotRateLimited(status: number, retryAfter: string | undefined) {
  expect(
    status,
    `Rate limited from this IP, so no result. Run again in ${retryAfter ?? '?'} s.`
  ).not.toBe(429);
}

test.describe.configure({ mode: 'serial' });

test.describe('Contact form on production, no email sent', () => {
  test('the register renders and an empty submit never leaves the browser', async ({ page }) => {
    const posts: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === FEEDBACK_PATH) {
        posts.push(request.url());
      }
    });

    await openContact(page);
    await expect(page.getByRole('heading', { level: 2, name: 'Sign the register' })).toBeVisible();

    await sendButton(page).click();

    await expect(nameField(page)).toHaveAttribute('aria-invalid', 'true');
    expect(posts).toEqual([]);
  });

  test('a foreign origin is refused before the limiter', async ({ request }) => {
    const response = await postFeedback(request, 'https://evil.example', INVALID_BODY);

    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ code: 'origin-rejected' });
  });

  test('a same-origin invalid body reaches validation', async ({ request, baseURL }) => {
    const response = await postFeedback(request, originOf(baseURL), INVALID_BODY);
    expectNotRateLimited(response.status(), response.headers()['retry-after']);

    expect(
      response.status(),
      '500 here means the route crashed, most likely on bad Upstash credentials'
    ).toBe(400);
    expect(await response.json()).toEqual({
      code: 'validation',
      fields: { name: 'required', email: 'invalid_email', message: 'too_short' },
    });
  });

  test('the honeypot answers like a success without sending', async ({ request, baseURL }) => {
    const response = await postFeedback(request, originOf(baseURL), {
      name: 'Production form probe',
      email: PROBE_EMAIL,
      message: probeMessage(),
      [HONEYPOT_FIELD]: 'filled by a bot',
    });
    expectNotRateLimited(response.status(), response.headers()['retry-after']);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ code: 'ok' });
  });
});

test.describe('Contact form on production, opt-in', () => {
  if (SEND) {
    test('a real send goes through the form and signs the register', async ({ page }) => {
      await openContact(page);
      await nameField(page).fill('Production form test');
      await emailField(page).fill(PROBE_EMAIL);
      await messageField(page).fill(probeMessage());

      const answer = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === FEEDBACK_PATH &&
          response.request().method() === 'POST'
      );
      await sendButton(page).click();
      const response = await answer;
      expectNotRateLimited(response.status(), response.headers()['retry-after']);

      expect(
        response.status(),
        '502 send-failed: check RESEND_API_KEY, FEEDBACK_RECIPIENT_EMAIL and the Vercel logs for [feedback]'
      ).toBe(200);
      expect(await response.json()).toEqual({ code: 'ok' });
      await expect(page.getByRole('status').getByText('Register signed')).toBeVisible();
    });
  }

  if (LIMIT) {
    test('the limiter refuses requests past its window', async ({ request, baseURL }) => {
      let retryAfter: string | undefined;
      for (let probe = 0; probe < LIMIT_PROBES && retryAfter === undefined; probe += 1) {
        const response = await postFeedback(request, originOf(baseURL), INVALID_BODY);
        if (response.status() === 429) {
          retryAfter = response.headers()['retry-after'];
        } else {
          expect(response.status()).toBe(400);
        }
      }

      expect(
        retryAfter,
        `No 429 after ${LIMIT_PROBES} requests: the Upstash variables are missing, so every request is allowed`
      ).toBeDefined();
      expect(Number(retryAfter)).toBeGreaterThan(0);
    });
  }
});
