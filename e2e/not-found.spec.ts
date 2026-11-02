import { test, expect, type APIResponse, type Page } from '@playwright/test';
import { photoSlugs } from '@/lib/photos/view-model';

/**
 * Server-rendered 404 for unknown photo and project slugs (EDGE-01, D-11; the
 * 07-23 STATE blocker).
 *
 * A notFound() thrown inside /photos/[slug] or /projects/[slug] made Next 16.4
 * answer with an empty `<html id="__next_error__">` shell: HTTP 404, but no
 * h1 and no main until JavaScript ran (12-RESEARCH Pitfall 1). proxy.ts now
 * decides unknown slugs before render and rewrites them to an unmatched path,
 * so the root not-found renders on the server with a link back to the
 * section. These checks read the raw server HTML through `request` (no
 * JavaScript), then the hydrated page.
 *
 * A random token stands in for the slug, so any echo of the requested URL in
 * the whole server HTML, the hydrated document or the title is caught
 * (T-12-03), script data included: Next writes the URL it renders into the
 * flight payload (`"c":[...]`), so proxy.ts serves every miss with the 404
 * rendered under a neutral slug, and Speed Insights reports every root 404
 * as /404 instead of writing the raw path into its script's data-route
 * (components/SpeedInsightsRoute.tsx). The spoofed-header case proves a
 * visitor cannot pick the context link (T-12-02).
 *
 * The functional projects block service workers, so the last block allows the
 * production worker: it re-fetches navigations itself, and that request
 * reached the proxy looking like a client-side navigation (the wave 1
 * live-DOM check found the slug there).
 */

/** The production server (playwright.config.ts `prod`); only it registers the service worker. */
const prod = !!process.env.CI || !!process.env.PW_PROD;

const token = `nf-${crypto.randomUUID().slice(0, 8)}`;

/**
 * Markup without script elements (and their attributes). Only for text that
 * every page's flight payload carries (the root not-found boundary), never
 * for the token.
 */
const withoutScripts = (html: string) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');

/** The locked 404 h1 (D-10). */
const H1 = "You've left the marked trail";
/** The h1 in server HTML: React escapes the apostrophe as &#x27;; accept the literal form too. */
const H1_HTML = /You(?:&#x27;|&#39;|')ve left the marked trail/;
/** The 404 title through the root template (app/not-found.tsx metadata). */
const TITLE = 'Page not found · Tim Lui';

/** Each section miss and the context link that replaces its generic label. */
const MISSES = [
  { path: `/photos/${token}`, link: 'All photographs', href: '/photos', generic: 'Photographs' },
  { path: `/projects/${token}`, link: 'All routes', href: '/projects', generic: 'Engineering' },
] as const;

/**
 * Server HTML of a designed 404: one main, an h1, and not the empty error
 * shell. Returns the whole body and the main element's markup (the nav also
 * says "Photographs" and "Engineering", so link labels are read inside main).
 */
async function expectServerRendered404(response: APIResponse) {
  expect(response.status()).toBe(404);
  const body = await response.text();
  expect(body).toContain('<h1');
  expect(body.match(/<main[\s>]/g) ?? []).toHaveLength(1);
  expect(body).not.toContain('__next_error__');
  const main = body.slice(body.search(/<main[\s>]/), body.indexOf('</main>'));
  expect(main).toContain('<h1');
  return { body, main };
}

test.describe('Unknown detail slugs: server-rendered 404 (EDGE-01)', () => {
  for (const miss of MISSES) {
    test(`${miss.path.replace(token, '<token>')}: HTTP 404 with h1 and one main in the server HTML, no slug echo`, async ({
      request,
    }) => {
      const { body, main } = await expectServerRendered404(await request.get(miss.path));

      expect(main).toMatch(H1_HTML);
      expect(main).toContain('Error 404 · Page not found');
      expect(main).toContain(`>${miss.link}<`);
      expect(main).not.toContain(`>${miss.generic}<`);
      expect(body).not.toContain(token);
    });

    test(`${miss.path.replace(token, '<token>')}: context link "${miss.link}" after hydration, slug absent from DOM and title`, async ({
      page,
    }) => {
      const response = await page.goto(miss.path);
      expect(response?.status()).toBe(404);
      // The rewrite keeps the visible URL.
      expect(new URL(page.url()).pathname).toBe(miss.path);

      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(H1);
      await expect(page).toHaveTitle(TITLE);
      await expect(main.getByRole('link', { name: miss.link, exact: true })).toHaveAttribute(
        'href',
        miss.href
      );
      await expect(main.getByRole('link', { name: miss.generic, exact: true })).toHaveCount(0);
      await expect(
        main.getByRole('link', { name: 'Go to the homepage', exact: true })
      ).toHaveAttribute('href', '/');

      // Speed Insights adds its script after hydration; wait for it so its data-route is checked.
      await expect(page.locator('script[src*="speed-insights"]')).toHaveAttribute(
        'data-route',
        '/404'
      );
      const html = await page.evaluate(() => document.documentElement.outerHTML);
      expect(html).not.toContain(token);
      expect(await page.locator('body').innerText()).not.toContain(token);
      expect(await page.title()).not.toContain(token);
    });
  }

  test('a known photo slug passes through the proxy with HTTP 200', async ({ request }) => {
    const response = await request.get(`/photos/${photoSlugs[0]}`);
    expect(response.status()).toBe(200);
    // The not-found boundary is serialized into every page's flight payload, so read the markup.
    const markup = withoutScripts(await response.text());
    expect(markup).not.toContain('Page not found');
    expect(markup).not.toMatch(H1_HTML);
  });

  test('a three-segment photo path is not rewritten: 404 with the generic links', async ({
    request,
  }) => {
    const { main } = await expectServerRendered404(await request.get(`/photos/${token}/extra`));

    expect(main).toContain('>Photographs<');
    expect(main).toContain('>Engineering<');
    expect(main).not.toContain('All photographs');
    expect(main).not.toContain('All routes');
  });

  test('a client-sent x-edge-section header cannot choose the context link', async ({
    request,
  }) => {
    const { main } = await expectServerRendered404(
      await request.get('/__no-such-page__', { headers: { 'x-edge-section': 'photos' } })
    );

    expect(main).toContain('>Photographs<');
    expect(main).not.toContain('All photographs');
  });

  test('an unmatched URL: the marked-trail h1 in the server HTML and the generic sentence', async ({
    request,
  }) => {
    const { main } = await expectServerRendered404(await request.get('/__no-such-page__'));

    expect(main).toMatch(H1_HTML);
    expect(main).toContain('Error 404 · Page not found');
    expect(main).toMatch(/There(?:&#x27;|&#39;|')s no page at this address/);
    expect(main).toContain('>Photographs<');
    expect(main).toContain('>Engineering<');
  });
});

/**
 * The designed edge layout (EDGE-01, D-09, D-10; 12-UI-SPEC "EdgeArt", E8):
 * the marked-trail h1 and the title on every variant, the decorative contour
 * sheet, and no horizontal scroll at 375 px.
 */
test.describe('Marked-trail 404 layout (EDGE-01)', () => {
  for (const path of ['/__no-such-page__', `/photos/${token}`, `/projects/${token}`]) {
    test(`${path.replace(token, '<token>')}: marked-trail h1, title, aria-hidden art sheet, no focus move`, async ({
      page,
    }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);

      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(H1);
      await expect(main.getByText('Error 404 · Page not found', { exact: true })).toHaveCount(1);
      await expect(page).toHaveTitle(TITLE);

      // One art sheet: an aria-hidden square holding the trail and the dot, nothing focusable.
      const sheet = main.locator('div[aria-hidden="true"]:has(> svg[viewBox="0 0 512 512"])');
      await expect(sheet).toHaveCount(1);
      await expect(sheet).toBeVisible();
      await expect(sheet.locator('path[stroke-dasharray="8 6"]')).toHaveCount(1);
      await expect(sheet.locator('circle[r="8"]')).toHaveCount(1);
      await expect(sheet.locator('a, button, [tabindex]')).toHaveCount(0);
      const box = await sheet.boundingBox();
      expect(box).not.toBeNull();
      expect(Math.abs(box!.width - box!.height)).toBeLessThanOrEqual(1);
      expect(box!.width).toBeGreaterThan(0);

      // No focus move on load: the route announcer reads the title.
      expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    });
  }

  test.describe('375 x 800', () => {
    test.use({ viewport: { width: 375, height: 800 } });

    for (const path of ['/__no-such-page__', `/photos/${token}`, `/projects/${token}`]) {
      test(`${path.replace(token, '<token>')}: no horizontal scroll; the sheet fills the column, square`, async ({
        page,
      }) => {
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

        // The sheet spans the content column (main minus the 16 px gutters): 343 px at
        // 375 without a scrollbar gutter, less where the stable gutter takes its share.
        const main = page.getByRole('main');
        const sheet = main.locator('div[aria-hidden="true"]:has(> svg[viewBox="0 0 512 512"])');
        const column = ((await main.boundingBox())?.width ?? 0) - 2 * 16;
        const box = await sheet.boundingBox();
        expect(Math.abs((box?.width ?? 0) - column)).toBeLessThanOrEqual(1);
        expect(box?.width).toBeLessThanOrEqual(448);
        expect(Math.abs((box?.width ?? 0) - (box?.height ?? -1))).toBeLessThanOrEqual(1);
      });
    }
  });
});

/**
 * The home page, then (production only) a reload once the worker is active,
 * so the service worker controls every later navigation in this page. Not a
 * skip on the dev server (test-count.mjs rejects skips): there no worker
 * registers and the same checks run without one.
 */
async function openControlledHome(page: Page) {
  await page.goto('/');
  if (!prod) return;
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

/** The hydrated 404 for `miss`: context link, Speed Insights route, no token anywhere in the document. */
async function expectNeutralDocument(page: Page, miss: (typeof MISSES)[number]) {
  expect(new URL(page.url()).pathname).toBe(miss.path);
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(H1);
  await expect(main.getByRole('link', { name: miss.link, exact: true })).toHaveAttribute(
    'href',
    miss.href
  );
  await expect(page.locator('script[src*="speed-insights"]')).toHaveAttribute('data-route', '/404');
  expect(await page.evaluate(() => document.documentElement.outerHTML)).not.toContain(token);
  expect(await page.title()).not.toContain(token);
  if (prod) {
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  }
}

test.describe('Unknown detail slugs with the service worker in control (T-12-03)', () => {
  test.use({ serviceWorkers: 'allow' });

  for (const miss of MISSES) {
    test(`${miss.path.replace(token, '<token>')}: a navigation through the service worker gets the neutral 404`, async ({
      page,
      browserName,
    }) => {
      await openControlledHome(page);

      const response = await page.goto(miss.path);
      expect(response?.status()).toBe(404);
      // Playwright's Firefox cannot read the body of any page a service worker
      // delivers (getResponseBody fails, /roadmap included); there the
      // outerHTML check below, which keeps the flight scripts, covers it.
      if (browserName !== 'firefox') expect(await response?.text()).not.toContain(token);
      await expectNeutralDocument(page, miss);
    });
  }

  test('a client-side navigation to a miss reloads into the neutral 404', async ({ page }) => {
    type RouterWindow = Window & {
      __beforeNavigation?: boolean;
      next?: { router?: { push(href: string): void } };
    };
    const miss = MISSES[0];
    await openControlledHome(page);
    await page.goto('/photos');
    // Hydrated: Speed Insights injects its script from an effect, and the App
    // Router is on window.next.
    await expect(page.locator('script[src*="speed-insights"]')).toHaveAttribute(
      'data-route',
      '/photos'
    );
    await page.waitForFunction(
      () => typeof (window as RouterWindow).next?.router?.push === 'function'
    );
    await page.evaluate(() => {
      (window as RouterWindow).__beforeNavigation = true;
    });

    // The router's flight request gets a 404, so it loads the URL as a new document.
    await page.evaluate((path) => (window as RouterWindow).next!.router!.push(path), miss.path);
    await page.waitForURL(`**${miss.path}`);
    await page.waitForFunction(() => !(window as RouterWindow).__beforeNavigation);

    await expectNeutralDocument(page, miss);
  });
});
