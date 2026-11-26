import { test, expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { regionPhotoViews } from '@/lib/regions';
import { AUDIT_SWEEP, ROUTES } from './routes';
import { SLUGS } from './helpers/photo-fixtures';
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

/**
 * Time budget per AUDIT_SWEEP page (17 RESEARCH Pitfall 3). The sweep's fixed
 * 180 s for its four pages was 60 s of setup plus 30 s per page, so
 * `60_000 + AUDIT_SWEEP.length * AUDIT_SWEEP_PAGE_MS` keeps that value for
 * those four and grows by 30 s with every page the sitemap adds. Assumption A3
 * puts a page at about 10-15 s in CI Chromium, so the margin stays at least
 * double.
 */
const AUDIT_SWEEP_PAGE_MS = 30_000;

/** The designed 404 (an unmatched URL). */
const NOT_FOUND = '/__no-such-page__';

/** The offline page's empty saved list in a fresh context (12-15, e2e/offline.spec.ts). */
const OFFLINE_EMPTY = 'No pages are saved on this device yet.';

/** The Zermatt series: the photo states open from its region page (18-21; PHOTO-06). */
const ZERMATT = regionPhotoViews('zermatt');

/** The end-of-series card's heading after Zermatt's last photo (18-16; EndCard). */
const END_CARD_HEADING = 'End of the Zermatt series';

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
 * /projects/coin-flip and photo slugs 2-4; the region pages and the new photo
 * pages join through the sitemap (REGION-07), with no edit here. Each is the
 * same template as a ROUTES entry, which runs in three engines at three widths,
 * so these run once, in Chromium at 1440. One test for the whole list, so the
 * test-count ratchet does not grow with every photo; a finding names its path.
 * Its timeout scales with the list (AUDIT_SWEEP_PAGE_MS).
 */
test.describe('Audit: every sitemap page (VERIFY-05)', () => {
  test('every sitemap page once in Chromium @chromium-only', async ({
    page,
    request,
    browserName,
  }) => {
    test.setTimeout(60_000 + AUDIT_SWEEP.length * AUDIT_SWEEP_PAGE_MS);
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

  /**
   * Opens the Glacier Trail photo (two hotspots) in the lightbox from its figure on the
   * Zermatt region page (18-21: the region page replaced the grid as the opener, PHOTO-06).
   */
  async function openTrailLightbox(page: Page) {
    await openSettled(page, '/photos/regions/zermatt', 1440);
    const figure = page.locator(`[data-photo-id="${SLUGS.matterhornGlacierTrail}"]`);
    await expect(figure).toHaveCount(1);
    await waitForHydration(figure);
    await figure.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog.locator('[data-hotspot-label]').first()).toBeVisible();
    await waitForAnimations(page);
    return dialog;
  }

  test('state "lightbox, hotspots on" /photos/regions/zermatt @1440', async ({
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
        'state "lightbox, hotspots on" /photos/regions/zermatt @1440'
      )
    );
  });

  test('state "lightbox, hotspots off" /photos/regions/zermatt @1440', async ({
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
        'state "lightbox, hotspots off" /photos/regions/zermatt @1440'
      )
    );
  });

  /**
   * The photo states, each audited at 375, 768 and 1440 after its optional open step, with the
   * element that proves it rendered. The three view states were rewritten for PHOTO-06 as the
   * states that replace them: the Map view in 18-22 as 'Alps overview' (/photos, shown by its
   * region list), the Grid and Carousel views in 18-21 as 'Zermatt sequence' (the region page
   * with its middle figure centred) and 'lightbox end card' (the card after Zermatt's last
   * photo).
   */
  type PhotoState = {
    /** The state's name in the test title and every finding. */
    label: string;
    path: string;
    open?: (page: Page, width: number) => Promise<void>;
    shown: (page: Page) => Locator;
  };

  /** Centre the middle figure of the series; settled on the rail from 768, its image below. */
  async function centreMiddleFigure(page: Page, width: number) {
    const middle = Math.floor(ZERMATT.length / 2);
    const item = page.locator(`li[data-sequence-item="${ZERMATT[middle].slug}"]`);
    await item.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect
      .poll(() =>
        item.evaluate((li) => {
          const img = li.querySelector('img');
          return !!img && img.complete && img.naturalWidth > 0;
        })
      )
      .toBe(true);
    if (width >= 768) {
      await expect(
        page.locator('section[data-region-sequence] [data-region-rail]')
      ).toHaveAttribute('data-rail-current', String(middle + 1));
    }
    await waitForAnimations(page);
  }

  /** Open Zermatt's last photo in the lightbox and press Next until the counter reads End. */
  async function openEndCard(page: Page) {
    const last = ZERMATT[ZERMATT.length - 1];
    const figure = page.locator(`[data-photo-id="${last.slug}"]`);
    await expect(figure).toHaveCount(1);
    await waitForHydration(figure);
    await figure.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    const counter = dialog.locator('[data-photo-counter]');
    await expect(counter).toHaveText(`${ZERMATT.length} / ${ZERMATT.length}`);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    await waitForHydration(next);
    await next.click();
    await expect(counter).toHaveText('End');
    await waitForAnimations(page);
  }

  const PHOTO_STATES: ReadonlyArray<PhotoState> = [
    {
      label: 'Alps overview',
      path: '/photos',
      shown: (page) => page.getByRole('list', { name: 'Regions, west to east', exact: true }),
    },
    {
      label: 'Zermatt sequence',
      path: '/photos/regions/zermatt',
      open: centreMiddleFigure,
      shown: (page) =>
        page.getByRole('list', { name: 'Zermatt photographs, lowest first', exact: true }),
    },
    {
      label: 'lightbox end card',
      path: '/photos/regions/zermatt',
      open: openEndCard,
      shown: (page) =>
        page.getByRole('dialog').getByRole('heading', { level: 2, name: END_CARD_HEADING }),
    },
  ];

  for (const { label, path, open, shown } of PHOTO_STATES) {
    // No photo state carries @firefox-43967 since 18-22: the Map view was the only one, and its
    // successor 'Alps overview' (no named role lookup on an aria-labelledby region) runs on
    // Firefox too (18-22-SUMMARY.md).
    test(`state "${label}" ${path} @375/768/1440`, async ({ page, request, browserName }) => {
      test.setTimeout(120000);
      await installAuditProbes(page);
      const failures = collectFailures(page);
      const findings: string[] = [];

      for (const width of WIDTHS) {
        await openSettled(page, path, width);
        if (open) await open(page, width);
        await expect(shown(page)).toBeVisible();
        findings.push(
          ...(await audit(
            page,
            request,
            failures,
            browserName,
            `state "${label}" ${path} @${width}`
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

  // @firefox-43967: crashes Firefox 159 (https://github.com/microsoft/playwright/issues/43967).
  test('state "contact error summary" /contact @1440 @firefox-43967', async ({
    page,
    request,
    browserName,
  }) => {
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

  // @firefox-43967: crashes Firefox 159 (https://github.com/microsoft/playwright/issues/43967).
  test('state "contact register signed" /contact @1440 (API mocked) @firefox-43967', async ({
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
