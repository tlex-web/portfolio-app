import { test, expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { buildPhotoViews } from '@/lib/photos/view-model';
import { AUDIT_SWEEP, ROUTES } from './routes';
import {
  checkLinks,
  clearFailures,
  collectFailures,
  installAuditProbes,
  readProbes,
  runAxe,
  settle,
  waitForAnimations,
  type Failures,
} from './helpers/audit';

/**
 * The audit gate (D-20, D-21, VERIFY-02, VERIFY-04), on the production build.
 *
 * A page fails on any axe violation (default rule set, best-practice rules
 * included and proven by the 'region' rule), CSP violation (the
 * securitypolicyviolation event), console error outside ALLOWED_CONSOLE, page
 * error, image response >= 400, same-origin link or image URL answering >= 400,
 * or, in Chromium, cumulative layout shift above 0.1 over the load and a full
 * scroll. Every route in e2e/routes.ts plus the 404 runs at 375, 768 and 1440
 * px; each D-21 interactive state is its own test, so a finding names its route,
 * width and state.
 */

/** Links already requested in this worker; each URL is fetched once per run. */
const seen = new Set<string>();

/** The CLS budget (D-20). Never raise it to pass. */
const CLS_BUDGET = 0.1;

const WIDTHS = [375, 768, 1440] as const;
const HEIGHT = 900;

/** The designed 404 (an unmatched URL). */
const NOT_FOUND = '/__no-such-page__';

/** The offline page's empty saved list in a fresh context (12-15, e2e/offline.spec.ts). */
const OFFLINE_EMPTY = 'No pages are saved on this device yet.';

const views = buildPhotoViews();

/**
 * Runs every check on the page as it stands and returns one line per finding,
 * each prefixed with `label` (route, width and state).
 */
async function audit(
  page: Page,
  request: APIRequestContext,
  failures: Failures,
  browserName: string,
  label: string
): Promise<string[]> {
  const findings: string[] = [];

  const axe = await runAxe(page);
  findings.push(...axe.violations.map((line) => `${label} axe: ${line}`));
  if (!axe.regionRan) findings.push(`${label} axe: the best-practice 'region' rule did not run`);

  const probes = await readProbes(page);
  findings.push(...probes.csp.map((line) => `${label} CSP: ${line}`));
  if (browserName === 'chromium') {
    // Recorded on the test, so a run's report shows the margin to the budget.
    test.info().annotations.push({ type: 'cls', description: `${label}: ${probes.cls}` });
    if (probes.cls === null) findings.push(`${label} CLS: layout-shift API missing in Chromium`);
    else if (probes.cls > CLS_BUDGET)
      findings.push(`${label} CLS: ${probes.cls.toFixed(4)} > ${CLS_BUDGET}`);
  }

  findings.push(...failures.console.map((line) => `${label} console: ${line}`));
  findings.push(...failures.pageErrors.map((line) => `${label} pageerror: ${line}`));
  findings.push(...failures.images.map((line) => `${label} image: ${line}`));

  const broken = await checkLinks(page, request, seen);
  findings.push(...broken.map((line) => `${label} link: ${line}`));

  clearFailures(failures);
  return findings;
}

/** Waits until React has attached its props to `el` (hydrated); a click before that is lost. */
async function waitForHydration(el: Locator) {
  await expect
    .poll(
      () => el.evaluate((node) => Object.keys(node).some((k) => k.startsWith('__reactProps'))),
      {
        timeout: 15000,
      }
    )
    .toBe(true);
}

/** Viewport set, `path` loaded and settled (probes and listeners are installed by the caller). */
async function openSettled(page: Page, path: string, width: number) {
  // Resize on a blank document: resizing the previous route first would reveal
  // its desktop nav, start Next's viewport prefetches, and the goto right after
  // would cancel them, which WebKit reports as page errors of the test's own
  // making. Nothing is in flight on about:blank.
  await page.goto('about:blank');
  await page.setViewportSize({ width, height: HEIGHT });
  const response = await page.goto(path, { waitUntil: 'load' });
  await settle(page);
  return { response };
}

function expectClean(findings: string[]) {
  expect(findings, `\n${findings.join('\n')}\n`).toEqual([]);
}

test.describe('Audit: every route at 375, 768 and 1440 (D-20)', () => {
  const paths = [...ROUTES.map(([path]) => path), NOT_FOUND];

  for (const path of paths) {
    test(`${path}: axe, CLS, links, images, CSP, console`, async ({
      page,
      request,
      browserName,
    }) => {
      test.setTimeout(180000);
      await installAuditProbes(page);
      const failures = collectFailures(page);
      const findings: string[] = [];

      for (const width of WIDTHS) {
        const label = `${path} @${width}`;
        const { response } = await openSettled(page, path, width);

        if (path === NOT_FOUND) {
          // The designed 404 answers 404 (EDGE-01); that status is the expected outcome.
          expect(response?.status(), label).toBe(404);
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
          // Chromium and WebKit report the document's own 404 status on the console.
          // That is the status asserted just above, not an error of the page, so this
          // one exact line (this document's URL only) is taken out here; it is not
          // an ALLOWED_CONSOLE entry and applies to no other test.
          const ownStatus = `Failed to load resource: the server responded with a status of 404 (Not Found) @ ${page.url()}`;
          failures.console.splice(
            0,
            failures.console.length,
            ...failures.console.filter((line) => line !== ownStatus)
          );
        } else {
          expect(response?.status(), label).toBeLessThan(400);
        }
        if (path === '/offline') {
          // A fresh context with service workers blocked has an empty saved list.
          await expect(page.getByText(OFFLINE_EMPTY), label).toBeVisible();
        }

        findings.push(...(await audit(page, request, failures, browserName, label)));
      }

      expectClean(findings);
    });
  }
});

/**
 * Every sitemap page that is not a ROUTES template entry (VERIFY-05): today
 * /projects/coin-flip and photo slugs 2-4, later every region page. Each is the
 * same template as a ROUTES entry, which runs in three engines at three widths,
 * so these run once, in Chromium at 1440. One test for the whole list, so the
 * test-count ratchet does not grow with every photo; a finding names its path.
 */
test.describe('Audit: every sitemap page (VERIFY-05)', () => {
  test('every sitemap page once in Chromium @chromium-only', async ({
    page,
    request,
    browserName,
  }) => {
    test.setTimeout(180000);
    await installAuditProbes(page);
    const failures = collectFailures(page);
    const findings: string[] = [];

    for (const path of AUDIT_SWEEP) {
      const label = `${path} @1440`;
      const { response } = await openSettled(page, path, 1440);
      expect(response?.status(), label).toBeLessThan(400);
      findings.push(...(await audit(page, request, failures, browserName, label)));
    }

    expectClean(findings);
  });
});

test.describe('Audit: interactive states (D-21)', () => {
  test('state "mobile menu open" /roadmap @375', async ({ page, request, browserName }) => {
    await installAuditProbes(page);
    const failures = collectFailures(page);
    await openSettled(page, '/roadmap', 375);

    const button = page.getByRole('button', { name: 'Menu' });
    await waitForHydration(button);
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#site-menu')).toBeVisible();
    await waitForAnimations(page);

    expectClean(
      await audit(page, request, failures, browserName, 'state "mobile menu open" /roadmap @375')
    );
  });

  /** Opens the Glacier Trail photo (two hotspots) from the grid in the lightbox. */
  async function openTrailLightbox(page: Page) {
    const trail = views.findIndex((view) => view.id === 'img-0662');
    expect(trail).toBeGreaterThanOrEqual(0);
    await openSettled(page, '/photos?view=grid', 1440);
    const tile = page
      .getByRole('list', { name: 'Photographs, lowest first' })
      .getByRole('link')
      .nth(trail);
    await waitForHydration(tile);
    await tile.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog.locator('[data-hotspot-label]').first()).toBeVisible();
    await waitForAnimations(page);
    return dialog;
  }

  test('state "lightbox, hotspots on" /photos?view=grid @1440', async ({
    page,
    request,
    browserName,
  }) => {
    await installAuditProbes(page);
    const failures = collectFailures(page);
    await openTrailLightbox(page);

    expectClean(
      await audit(
        page,
        request,
        failures,
        browserName,
        'state "lightbox, hotspots on" /photos?view=grid @1440'
      )
    );
  });

  test('state "lightbox, hotspots off" /photos?view=grid @1440', async ({
    page,
    request,
    browserName,
  }) => {
    await installAuditProbes(page);
    const failures = collectFailures(page);
    const dialog = await openTrailLightbox(page);

    // A toggle with a constant name (PhotoViewer): pressed means the labels are hidden.
    const hide = dialog.getByRole('button', { name: 'Hide labels', exact: true });
    await hide.click();
    await expect(hide).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.locator('[data-hotspot-label]')).toHaveCount(0);
    await waitForAnimations(page);

    expectClean(
      await audit(
        page,
        request,
        failures,
        browserName,
        'state "lightbox, hotspots off" /photos?view=grid @1440'
      )
    );
  });

  /** Each /photos view, its URL and the landmark that proves it rendered (e2e/photos.spec.ts). */
  const PHOTO_VIEWS: ReadonlyArray<[name: string, path: string, shown: (page: Page) => Locator]> = [
    ['Map', '/photos', (page) => page.getByRole('region', { name: 'Map of the photo locations' })],
    [
      'Grid',
      '/photos?view=grid',
      (page) => page.getByRole('list', { name: 'Photographs, lowest first' }),
    ],
    [
      'Carousel',
      '/photos?view=carousel',
      (page) => page.getByRole('region', { name: 'Photographs' }),
    ],
  ];

  for (const [name, path, shown] of PHOTO_VIEWS) {
    test(`state "photos ${name} view" ${path} @375/768/1440`, async ({
      page,
      request,
      browserName,
    }) => {
      test.setTimeout(120000);
      await installAuditProbes(page);
      const failures = collectFailures(page);
      const findings: string[] = [];

      for (const width of WIDTHS) {
        await openSettled(page, path, width);
        await expect(shown(page)).toBeVisible();
        findings.push(
          ...(await audit(
            page,
            request,
            failures,
            browserName,
            `state "photos ${name} view" ${path} @${width}`
          ))
        );
      }

      expectClean(findings);
    });
  }

  /** /contact loaded, settled and hydrated (a click before hydration is a native post). */
  async function openContact(page: Page) {
    await openSettled(page, '/contact', 1440);
    await waitForHydration(page.getByRole('button', { name: /Send Message/i }));
  }

  test('state "contact error summary" /contact @1440', async ({ page, request, browserName }) => {
    await installAuditProbes(page);
    const failures = collectFailures(page);
    await openContact(page);

    await page.getByRole('button', { name: /Send Message/i }).click();
    const summary = page.getByRole('form', { name: 'Sign the register' }).getByRole('alert');
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await waitForAnimations(page);

    expectClean(
      await audit(
        page,
        request,
        failures,
        browserName,
        'state "contact error summary" /contact @1440'
      )
    );
  });

  test('state "contact register signed" /contact @1440 (API mocked)', async ({
    page,
    request,
    browserName,
  }) => {
    await installAuditProbes(page);
    const failures = collectFailures(page);
    // Never a real send: the API is answered here (12-RESEARCH Pitfall 5).
    await page.route('**/api/feedback', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'ok' }),
      })
    );
    await openContact(page);

    await page.getByLabel(/Name/i).fill('Audit Check');
    await page.getByRole('textbox', { name: /Email/i }).fill('audit@example.com');
    await page.getByLabel(/Message/i).fill('A message that is long enough to pass validation.');
    await page.getByRole('button', { name: /Send Message/i }).click();
    const entry = page.getByRole('status').filter({ hasText: 'Register signed' });
    await expect(entry).toBeVisible();
    await waitForAnimations(page);

    expectClean(
      await audit(
        page,
        request,
        failures,
        browserName,
        'state "contact register signed" /contact @1440'
      )
    );
  });

  test('state "reduced-motion Home" / @1440', async ({ page, request, browserName }) => {
    await installAuditProbes(page);
    const failures = collectFailures(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSettled(page, '/', 1440);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    expectClean(
      await audit(page, request, failures, browserName, 'state "reduced-motion Home" / @1440')
    );
  });
});
