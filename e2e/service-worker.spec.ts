import { test, expect, type Page } from '@playwright/test';
import { projects } from '@/data/projects';
import { site } from '@/data/site';
import { terrain } from '@/data/generated/terrain';

/**
 * The real production service worker (EDGE-02, D-12; PITFALLS #17).
 *
 * Why this spec opts back in to service workers: every functional project
 * blocks them (playwright.config.ts), so page.route sees every request
 * (12-RESEARCH Pitfall 6). The claims here are about the worker itself, so it
 * must register, install its precache and control the page.
 *
 * - EDGE-02 update e2e: after a "deploy" (the server's HTML changes), a reload
 *   of a page the worker has already stored shows the new HTML. Network-first
 *   navigation; the stale-while-revalidate worker before 12-08 showed the
 *   cached copy here (PITFALLS #17).
 * - D-12: offline, a page visited before comes from the cache; a page never
 *   visited gets the precached /offline, styled (Schibsted Grotesk loaded) and
 *   listing the saved pages.
 * - RSC payloads (`?_rsc=`) are never answered by the worker.
 * - C2 (D-12): install precaches the hero contour (EdgeArt's sheet on /offline),
 *   so the offline art never depends on a page having fetched it online.
 *
 * Tags: @chromium-only, because Playwright routes and reports service-worker
 * traffic only in Chromium; @prod-only, because the worker registers only in a
 * production build (ServiceWorkerRegistration). playwright.config.ts drops
 * @prod-only tests from dev-server runs instead of skipping them.
 *
 * Not covered here: a worker version cut-over. Playwright cannot route a new
 * worker script, so cache deletion on activate is proven in Jest (12-08,
 * lib/__tests__/service-worker-navigation.test.ts).
 *
 * The "deploy" is simulated with context.route on the worker's own fetch; no
 * file on disk changes, so public/service-worker.js is never touched.
 */

test.use({ serviceWorkers: 'allow' });

const OFFLINE_H1 = "You're offline";

/** A page this spec never visits online: the last project's detail page (coin-flip), from the data. */
const neverVisited = `/projects/${projects[projects.length - 1].slug}`;

const roadmap = site.nav.find((item) => item.href === '/roadmap')!;

/** Roadmap's title through the root template ('%s · Tim Lui'). */
const ROADMAP_TITLE = `${roadmap.label} · ${site.name}`;

/**
 * Opens `path`, waits until the worker is active (install, and so the
 * precache, finished) and controls the page, then reloads so the worker
 * handles (and network-first stores) this page's own navigation.
 */
async function openControlled(page: Page, path: string) {
  await page.goto(path);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })
      );
    }
  });
  const response = await page.reload();
  // Control: the worker, not the network, answered the reload.
  expect(response?.fromServiceWorker(), `${path} reload via the worker`).toBe(true);
}

/** The title of the HTML the worker's caches hold for `path`, or null when nothing is stored. */
async function cachedTitle(page: Page, path: string): Promise<string | null> {
  return page.evaluate(async (p) => {
    const cached = await caches.match(p);
    if (!cached) return null;
    return /<title>([^<]*)<\/title>/.exec(await cached.text())?.[1] ?? '';
  }, path);
}

test.describe('Production service worker (EDGE-02, D-12)', () => {
  test('a reload after a deploy shows the new HTML, never the cached copy @chromium-only @prod-only', async ({
    page,
    context,
  }) => {
    await openControlled(page, '/roadmap');
    await expect(page).toHaveTitle(ROADMAP_TITLE);
    // Control: a cached copy exists, so a cache-first or stale-while-revalidate
    // worker would have something old to serve on the next reload.
    expect(await cachedTitle(page, '/roadmap')).toBe(ROADMAP_TITLE);

    // The "deploy": the server now answers /roadmap with a new title.
    // context.route sees the worker's own fetches in Chromium. Every copy of
    // the title changes (the <title> and the flight data), as in a real new
    // build: hydration sets document.title from the flight data, so a <title>
    // edit alone is undone a moment after load.
    await context.route('**/roadmap', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).split(ROADMAP_TITLE).join(`DEPLOY-2 ${ROADMAP_TITLE}`);
      await route.fulfill({ response, body });
    });

    const response = await page.reload();
    expect(response?.fromServiceWorker()).toBe(true);
    // The worker delivered the new HTML (read from the response itself) ...
    const served = (await response?.text()) ?? '';
    expect(/<title>([^<]*)<\/title>/.exec(served)?.[1]).toBe(`DEPLOY-2 ${ROADMAP_TITLE}`);
    // ... and the page shows it.
    await expect(page).toHaveTitle(/^DEPLOY-2 /);
    // Network-first also replaced the stored copy with the new HTML.
    expect(await cachedTitle(page, '/roadmap')).toMatch(/^DEPLOY-2 /);

    await context.unroute('**/roadmap');
  });

  test('offline: a visited page comes from the cache, an unvisited one gets the styled /offline @chromium-only @prod-only', async ({
    page,
    context,
  }) => {
    await openControlled(page, '/roadmap');
    // Controls: the worker stored /roadmap, and nothing is stored for the
    // unvisited page, so the offline answers below can only come from where
    // this test says.
    expect(await cachedTitle(page, '/roadmap')).toBe(ROADMAP_TITLE);
    expect(await cachedTitle(page, neverVisited)).toBeNull();

    await context.setOffline(true);
    // A5 control: offline cuts the worker's fetches too. A fetch the worker
    // forwards (no cached copy for this URL) must fail at the network.
    const control = await page.evaluate(
      (path) =>
        fetch(`${path}?a5-control=1`, { cache: 'no-store' }).then(
          (r) => `status ${r.status}`,
          () => 'network error'
        ),
      neverVisited
    );
    expect(control).toBe('network error');

    // Visited before: the cached page.
    const visited = await page.goto('/roadmap');
    expect(visited?.fromServiceWorker()).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Roadmap');

    // Never visited: the precached /offline, not the page's own h1.
    const unvisited = await page.goto(neverVisited);
    expect(unvisited?.fromServiceWorker()).toBe(true);
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText(OFFLINE_H1);

    // Styled (D-12): the h1 uses Schibsted Grotesk, and that face actually
    // loaded from the precache (not just named in the stack).
    expect(await h1.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Schibsted');
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts]
        .filter((face) => face.status === 'loaded')
        .map((face) => face.family);
    });
    expect(loaded.some((family) => family.includes('Schibsted'))).toBe(true);

    // The saved-pages list reads Cache Storage and lists Roadmap.
    const saved = page.getByRole('region', { name: 'Saved on this device' });
    await expect(
      saved.getByRole('link', { name: new RegExp(`^${roadmap.label}`) })
    ).toHaveAttribute('href', roadmap.href);

    await context.setOffline(false);
  });

  test('install precaches the hero contour, so offline art never waits on a first visit @chromium-only @prod-only', async ({
    page,
    context,
  }) => {
    const hero = terrain.assets.contours.hero;
    // Every request the page makes, attached before the first navigation.
    const requested: string[] = [];
    page.on('request', (request) => requested.push(new URL(request.url()).pathname));

    // /roadmap draws no hero-LOD ContourField (only PosterSheet, MapSheet and
    // EdgeArt do), so its own requests never touch the hero URL.
    await openControlled(page, '/roadmap');

    // Control: the page never asked for the hero contour, so a cache entry for
    // it can only come from the install precache.
    expect(requested, 'the page never requests the hero contour').not.toContain(hero);
    expect(
      await page.evaluate(async (url) => (await caches.match(url))?.url ?? null, hero),
      'caches.match(hero) right after navigator.serviceWorker.ready'
    ).not.toBeNull();

    // Offline, the worker answers the hero URL from that precache.
    await context.setOffline(true);
    expect(
      await page.evaluate(
        (url) =>
          fetch(url).then(
            (r) => r.ok,
            () => false
          ),
        hero
      )
    ).toBe(true);
    await context.setOffline(false);
  });

  test('an RSC request (?_rsc=) is not answered by the worker @chromium-only @prod-only', async ({
    page,
  }) => {
    await openControlled(page, '/roadmap');

    const fetchFromPage = async (query: string) => {
      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().includes(query)),
        page.evaluate(
          (q) => fetch(`/roadmap?${q}`, { cache: 'no-store' }).then((r) => r.status),
          query
        ),
      ]);
      return response;
    };

    // Control: an ordinary same-origin fetch is answered by the worker
    // (network-first), so fromServiceWorker() can tell the two apart.
    expect((await fetchFromPage('sw-control=1')).fromServiceWorker()).toBe(true);
    // The RSC request goes straight to the network.
    expect((await fetchFromPage('_rsc=e2e')).fromServiceWorker()).toBe(false);
  });
});
