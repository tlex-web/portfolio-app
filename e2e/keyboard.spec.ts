import { test, expect, type Locator, type Page } from '@playwright/test';
import { site } from '@/data/site';
import { buildPhotoViews } from '@/lib/photos/view-model';
import { ROUTES } from './routes';
import { tabReachesLinks } from './helpers/engine';

/**
 * Keyboard-only flows (VERIFY-02, D-22; 12-UI-SPEC "Keyboard paths the D-22
 * e2e flows assert"). Tim repeats this pass by hand at UAT (12-24's
 * checklist); this spec is the automated half.
 *
 * After the first page.goto every step is a key: Tab, Shift+Tab, Enter,
 * Space, Escape or an arrow, plus keyboard.type for the text a visitor types
 * into the register. No mouse click and no direct focus() call. Each flow
 * asserts the exact order of its stops, from the skip link through the footer
 * to the end of the page, so a reordered DOM or a stray tabindex fails here.
 *
 * WebKit: Playwright's WebKit keeps Safari's default, where Tab never lands on
 * a link (12-16; probed again for this spec: Tab goes from the last control
 * on the page to the body, skipping every link). `walk` therefore drops link
 * stops in WebKit and still asserts the exact order of the remaining controls
 * and the end of the page, so WebKit checks that no non-link control sits
 * between them. A step that needs a link to have focus (Enter on the skip
 * link, on a map plate, on a summary link) runs in Chromium and Firefox; the
 * WebKit branch of that flow says what it checks instead. 12-23 owns the
 * WebKit triage. Chromium and Firefox assertions are never relaxed for it.
 */

type Stop = { target: Locator; link: boolean; name: string };

const link = (target: Locator, name: string): Stop => ({ target, link: true, name });
const control = (target: Locator, name: string): Stop => ({ target, link: false, name });

/** A path from the shared route list (fails if the list no longer has it). */
function route(path: string): string {
  const entry = ROUTES.find(([p]) => p === path);
  if (!entry) throw new Error(`${path} is not in e2e/routes.ts`);
  return entry[0];
}

const views = buildPhotoViews();
/** The full photo page in the shared list: the first photo, the lightbox's opener. */
const PHOTO_PATH = ROUTES.find(([p]) => p.startsWith('/photos/'))?.[0];

/** Presses `key` once per reachable stop and asserts each stop has focus, in order. */
async function walk(page: Page, browserName: string, stops: Stop[], key = 'Tab') {
  // Link stops drop out where Tab never lands on a link (helpers/engine.ts).
  const reachable = tabReachesLinks(browserName) ? stops : stops.filter((s) => !s.link);
  for (const [i, stop] of reachable.entries()) {
    await page.keyboard.press(key);
    await expect(stop.target, `${key} ${i + 1} should reach ${stop.name}`).toBeFocused();
  }
}

/**
 * The page has no stop after the last one: the next Tab either leaves the
 * document (Chromium and WebKit move focus to the body) or keeps focus where
 * it is (headless Firefox has no browser chrome to move to, so focus stays on
 * the last stop). Any further focusable element would take focus instead.
 */
async function expectEndOfPage(page: Page) {
  const before = await page.evaluateHandle(() => document.activeElement);
  await page.keyboard.press('Tab');
  await expect
    .poll(() =>
      page.evaluate(
        (last) =>
          document.activeElement === null ||
          document.activeElement === document.body ||
          document.activeElement === last,
        before
      )
    )
    .toBe(true);
  await before.dispose();
}

/** The skip link, the wordmark and the desktop nav links, in DOM order. */
function chromeStops(page: Page): Stop[] {
  const nav = page.getByRole('navigation', { name: 'Primary' });
  return [
    link(page.getByRole('link', { name: 'Skip to main content', exact: true }), 'the skip link'),
    link(nav.getByRole('link', { name: `${site.name}, home`, exact: true }), 'the wordmark'),
    ...site.nav.map((item) =>
      link(nav.getByRole('link', { name: item.label, exact: true }), `nav ${item.label}`)
    ),
  ];
}

/** Every footer link, in DOM order. */
async function footerStops(page: Page): Promise<Stop[]> {
  const links = page.getByRole('contentinfo').getByRole('link');
  const names = await links.allInnerTexts();
  expect(names.length, 'the footer has links').toBeGreaterThan(0);
  return names.map((n, i) => link(links.nth(i), `footer ${n.trim()}`));
}

/** Waits until React has hydrated an element: a key press before that hits server HTML only. */
async function waitForHydration(target: Locator) {
  await expect
    .poll(
      () => target.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))),
      { timeout: 15000 }
    )
    .toBe(true);
}

test.describe('Navigation by keyboard (desktop 1440)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const nameField = (page: Page) => page.getByRole('textbox', { name: 'Name', exact: true });

  test('the first Tab reaches the skip link and Enter moves focus to main', async ({
    page,
    browserName,
  }) => {
    await page.goto(route('/contact'));
    const skip = page.getByRole('link', { name: 'Skip to main content', exact: true });
    await waitForHydration(page.getByRole('button', { name: 'Send Message' }));

    if (tabReachesLinks(browserName)) {
      await page.keyboard.press('Tab');
      await expect(skip).toBeFocused();
      await expect(skip).toHaveAttribute('href', '#main-content');
      await page.keyboard.press('Enter');
      await expect(page.locator('main#main-content')).toBeFocused();
    }
    // From main (or, in WebKit, from the page start past every link) the next
    // Tab reaches the first control of the page content, never the nav.
    await page.keyboard.press('Tab');
    await expect(nameField(page)).toBeFocused();
  });

  test('Tab walks the wordmark and the nav links in site.nav order, Shift+Tab walks back', async ({
    page,
    browserName,
  }) => {
    await page.goto(route('/contact'));
    await waitForHydration(page.getByRole('button', { name: 'Send Message' }));

    const stops = [...chromeStops(page), control(nameField(page), 'Name')];
    await walk(page, browserName, stops);
    // Back from Name through the nav to the skip link.
    await walk(page, browserName, stops.slice(0, -1).reverse(), 'Shift+Tab');
  });
});

test.describe('Navigation by keyboard (mobile menu, 375)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const menuButton = (page: Page) =>
    page.getByRole('banner').getByRole('button', { name: 'Menu', exact: true });
  const panel = (page: Page) => page.locator('#site-menu');
  const menuStops = (page: Page) =>
    site.nav.map((item) =>
      link(panel(page).getByRole('link', { name: item.label, exact: true }), `menu ${item.label}`)
    );

  /** Tab from the page start to the Menu button (skip link, wordmark, Menu) and open it with Enter. */
  async function openMenu(page: Page, browserName: string) {
    await page.goto(route('/roadmap'));
    await waitForHydration(menuButton(page));
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await walk(page, browserName, [
      link(page.getByRole('link', { name: 'Skip to main content', exact: true }), 'the skip link'),
      link(nav.getByRole('link', { name: `${site.name}, home`, exact: true }), 'the wordmark'),
      control(menuButton(page), 'Menu'),
    ]);
    await page.keyboard.press('Enter');
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(panel(page)).toBeVisible();
  }

  test('Enter opens the menu, Tab walks its items in order, Escape closes it to the Menu button', async ({
    page,
    browserName,
  }) => {
    await openMenu(page, browserName);
    // WebKit: the items are links, so no Tab lands on them; Escape from the Menu button.
    await walk(page, browserName, menuStops(page));
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton(page)).toBeFocused();
  });

  test('Tab past the last item leaves the menu and closes it: the menu is no focus trap', async ({
    page,
    browserName,
  }) => {
    await openMenu(page, browserName);
    await walk(page, browserName, menuStops(page));
    // The disclosure panel is not a dialog: the next Tab moves on into the page
    // and the menu closes behind it (focus left the header).
    await page.keyboard.press('Tab');
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.closest('main') != null))
      .toBe(true);
    await expect(panel(page)).toBeHidden();
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Photo map and lightbox by keyboard (1440)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const MAP = 'Map of the photo locations';
  const LIST = 'Photo locations, lowest first';
  const mapLinks = (page: Page) =>
    page.getByRole('region', { name: MAP }).getByRole('list', { name: LIST }).getByRole('link');
  const segment = (page: Page, name: 'Map' | 'Grid' | 'Carousel') =>
    page.getByRole('group', { name: 'View' }).getByRole('button', { name, exact: true });

  /** Chrome, the view switcher, then the map's photo targets in altitude order. */
  function mapStops(page: Page): Stop[] {
    return [
      ...chromeStops(page),
      control(segment(page, 'Map'), 'the Map segment'),
      control(segment(page, 'Grid'), 'the Grid segment'),
      control(segment(page, 'Carousel'), 'the Carousel segment'),
      ...views.map((v, i) =>
        link(mapLinks(page).nth(i), `the map target ${v.title}, ${v.altitudeLabel}`)
      ),
    ];
  }

  test('Tab reaches the view switcher, then the map targets in altitude order, then the footer', async ({
    page,
    browserName,
  }) => {
    await page.goto(route('/photos'));
    await expect(mapLinks(page)).toHaveCount(views.length);
    for (const [i, v] of views.entries()) {
      await expect(mapLinks(page).nth(i)).toHaveAccessibleName(`${v.title}, ${v.altitudeLabel}`);
    }
    // WebKit: the targets are links, so the walk stops at the Carousel segment
    // and the next Tab ends the page (no non-link control hides among them).
    await walk(page, browserName, [...mapStops(page), ...(await footerStops(page))]);
    await expectEndOfPage(page);
  });

  test('Enter on a map target opens the lightbox on Close photo; Tab stays inside; arrows step; Escape returns focus', async ({
    page,
    browserName,
  }) => {
    expect(PHOTO_PATH, 'the shared list has the photo page').toBe(`/photos/${views[0].slug}`);
    await page.goto(route('/photos'));
    const opener = mapLinks(page).nth(0);
    await waitForHydration(opener);
    await expect(opener).toHaveAttribute('href', PHOTO_PATH!);

    await walk(page, browserName, mapStops(page).slice(0, -(views.length - 1)));
    if (!tabReachesLinks(browserName)) {
      // No Tab reaches the map target (a link) in WebKit with Safari's
      // conventions (Windows, macOS; helpers/engine.ts), so the lightbox cannot
      // be opened from the keyboard there; the walk above checked the controls
      // up to the Carousel segment. Linux WebKit (CI) runs every step (12-23).
      test.info().annotations.push({
        type: 'webkit',
        description: 'Tab never focuses a link in WebKit off Linux; dialog steps run in Chromium, Firefox and Linux WebKit',
      });
      return;
    }

    await expect(opener).toBeFocused();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(new RegExp(`${PHOTO_PATH}$`));
    await expect(dialog).toHaveAccessibleName(views[0].title);
    await expect(dialog.getByRole('button', { name: 'Close photo', exact: true })).toBeFocused();

    // Modal: 12 Tab and 12 Shift+Tab presses keep focus inside, and it moves.
    const focusInDialog = () =>
      page.evaluate(() => document.activeElement?.closest('dialog[open]') != null);
    const focusedName = () =>
      page.evaluate(
        () =>
          document.activeElement?.getAttribute('aria-label') ??
          document.activeElement?.textContent ??
          ''
      );
    for (const key of ['Tab', 'Shift+Tab']) {
      const seen = new Set<string>();
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press(key);
        expect(await focusInDialog(), `after ${key} ${i + 1}`).toBe(true);
        seen.add(await focusedName());
      }
      expect(seen.size, `${key} moves focus between the dialog's controls`).toBeGreaterThan(1);
    }

    // The arrow keys step between photos, inside the same dialog.
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`/photos/${views[1].slug}$`));
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(views[1].title);
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(new RegExp(`/photos/${views[0].slug}$`));
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(views[0].title);
    expect(await focusInDialog()).toBe(true);

    // Escape closes it, and focus is back on the target that opened it.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/photos$/);
    await expect(opener).toBeFocused();
  });
});

test.describe('Contact by keyboard (1440)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const MESSAGE = 'This is a test message that is definitely long enough to pass validation.';
  const form = (page: Page) => page.getByRole('form', { name: 'Sign the register' });
  const nameField = (page: Page) => page.getByRole('textbox', { name: 'Name', exact: true });
  const emailField = (page: Page) => page.getByRole('textbox', { name: 'Email', exact: true });
  const messageField = (page: Page) => page.getByRole('textbox', { name: 'Message', exact: true });
  const checkbox = (page: Page) => form(page).getByRole('checkbox');
  const sendButton = (page: Page) => page.getByRole('button', { name: 'Send Message' });
  const panel = (page: Page) => page.getByRole('region', { name: 'Direct contact' });

  /** Opens /contact, waits for hydration and records any focus on the honeypot. */
  async function openContact(page: Page) {
    await page.goto(route('/contact'));
    await waitForHydration(sendButton(page));
    await page.locator('#trail-note').evaluate((el) => {
      (window as unknown as { __honeypotFocused: boolean }).__honeypotFocused = false;
      el.addEventListener('focus', () => {
        (window as unknown as { __honeypotFocused: boolean }).__honeypotFocused = true;
      });
    });
  }

  const honeypotFocused = (page: Page) =>
    page.evaluate(() => (window as unknown as { __honeypotFocused: boolean }).__honeypotFocused);

  /** The register's controls from Name to Send Message (UI-SPEC: the honeypot is never one). */
  const registerStops = (page: Page): Stop[] => [
    control(nameField(page), 'Name'),
    control(emailField(page), 'Email'),
    control(messageField(page), 'Message'),
    control(checkbox(page), 'the collaboration checkbox'),
    control(sendButton(page), 'Send Message'),
  ];

  test('Tab runs skip link, nav, the register, Copy, Write an email, GitHub, LinkedIn, the footer; never the honeypot', async ({
    page,
    browserName,
  }) => {
    await openContact(page);
    await walk(page, browserName, [
      ...chromeStops(page),
      ...registerStops(page),
      control(panel(page).getByRole('button', { name: 'Copy email address' }), 'Copy'),
      link(panel(page).getByRole('link', { name: 'Write an email' }), 'Write an email'),
      link(panel(page).getByRole('link', { name: 'GitHub' }), 'panel GitHub'),
      link(panel(page).getByRole('link', { name: 'LinkedIn' }), 'panel LinkedIn'),
      ...(await footerStops(page)),
    ]);
    await expectEndOfPage(page);
    expect(await honeypotFocused(page), 'the honeypot took focus').toBe(false);
  });

  test('an empty submit focuses the summary; Tab reaches its first link and Enter on it focuses Name', async ({
    page,
    browserName,
  }) => {
    await openContact(page);
    await walk(page, browserName, [...chromeStops(page), ...registerStops(page)]);
    await page.keyboard.press('Enter');

    const summary = form(page).getByRole('alert');
    await expect(summary).toBeFocused();
    await expect(summary).toHaveAccessibleName('Check 3 fields');
    // One link per invalid field in form order: the first goes to Name.
    const first = summary.getByRole('link').first();
    await expect(summary.getByRole('link')).toHaveCount(3);
    await expect(first).toHaveAttribute('href', '#name');

    if (!tabReachesLinks(browserName)) {
      // The summary's links are links: WebKit's next Tab passes them and lands on Name.
      await page.keyboard.press('Tab');
    } else {
      await page.keyboard.press('Tab');
      await expect(first).toBeFocused();
      await page.keyboard.press('Enter');
    }
    await expect(nameField(page)).toBeFocused();
    expect(await honeypotFocused(page), 'the honeypot took focus').toBe(false);
  });

  test('a mocked 200 focuses the entry; Tab reaches Sign again and Enter focuses an empty Name', async ({
    page,
    browserName,
  }) => {
    // Never a real send: the API answers from the test.
    await page.route('**/api/feedback', (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'ok' }) })
    );
    await openContact(page);

    await walk(page, browserName, [...chromeStops(page), control(nameField(page), 'Name')]);
    await page.keyboard.type('John Doe');
    await page.keyboard.press('Tab');
    await expect(emailField(page)).toBeFocused();
    await page.keyboard.type('john@example.com');
    await page.keyboard.press('Tab');
    await expect(messageField(page)).toBeFocused();
    await page.keyboard.type(MESSAGE);
    await page.keyboard.press('Tab');
    await expect(checkbox(page)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(checkbox(page)).toBeChecked();
    await page.keyboard.press('Tab');
    await expect(sendButton(page)).toBeFocused();

    const request = page.waitForRequest('**/api/feedback');
    await page.keyboard.press('Enter');
    expect((await request).postDataJSON()).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      message: MESSAGE,
      interestedInCollaboration: true,
      trail_note: '',
    });

    const entry = page.getByRole('status').filter({ hasText: 'Register signed' });
    await expect(entry).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Sign again' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(nameField(page)).toBeFocused();
    await expect(nameField(page)).toHaveValue('');
    expect(await honeypotFocused(page), 'the honeypot took focus').toBe(false);
  });
});

test.describe('Edge pages by keyboard (1440)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('404: after the nav, Tab reaches Go to the homepage, then the two text links', async ({
    page,
    browserName,
  }) => {
    const response = await page.goto('/__no-such-page__');
    expect(response?.status()).toBe(404);
    const main = page.getByRole('main');
    // WebKit: every stop on this page is a link, so the first Tab ends the page.
    await walk(page, browserName, [
      ...chromeStops(page),
      link(main.getByRole('link', { name: 'Go to the homepage', exact: true }), 'Go to the homepage'),
      link(main.getByRole('link', { name: 'Photographs', exact: true }), 'the Photographs text link'),
      link(main.getByRole('link', { name: 'Engineering', exact: true }), 'the Engineering text link'),
      ...(await footerStops(page)),
    ]);
    await expectEndOfPage(page);
  });

  test('error page: the h1 holds focus on load and the next Tab reaches Try again', async ({
    page,
    browserName,
  }) => {
    // Forced the way e2e/helpers/webgl.ts disables WebGL: an init script
    // replaces a browser API. matchMedia throws, so the case study's demo
    // terminal (useReducedMotion reads it while rendering) throws inside the
    // page segment and app/(site)/error.tsx renders in the shell.
    await page.addInitScript(() => {
      window.matchMedia = () => {
        throw new Error('keyboard.spec: forced error page');
      };
    });
    await page.goto(route('/projects/box'));

    const main = page.getByRole('main');
    const h1 = main.getByRole('heading', { level: 1, name: 'Something went wrong' });
    await expect(h1).toBeFocused();
    await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(1);
    await walk(page, browserName, [
      control(main.getByRole('button', { name: 'Try again', exact: true }), 'Try again'),
      link(main.getByRole('link', { name: 'Go to the homepage', exact: true }), 'Go to the homepage'),
      link(main.getByRole('link', { name: 'Report this error', exact: true }), 'Report this error'),
    ]);
  });
});
