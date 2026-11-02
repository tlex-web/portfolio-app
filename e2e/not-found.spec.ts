import { test, expect, type APIResponse } from '@playwright/test';
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
 * flight payload (`"c":[...]`), so proxy.ts serves a missed document with the
 * 404 rendered under a neutral slug, and Speed Insights reports every root 404
 * as /404 instead of writing the raw path into its script's data-route
 * (components/SpeedInsightsRoute.tsx). The spoofed-header case proves a
 * visitor cannot pick the context link (T-12-02).
 */

const token = `nf-${crypto.randomUUID().slice(0, 8)}`;

/**
 * Markup without script elements (and their attributes). Only for text that
 * every page's flight payload carries (the root not-found boundary), never
 * for the token.
 */
const withoutScripts = (html: string) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');

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

      expect(main).toContain('Page not found');
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
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Page not found');
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
    expect(withoutScripts(await response.text())).not.toContain('Page not found');
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
});
