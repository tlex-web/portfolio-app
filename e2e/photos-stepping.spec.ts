import { test, expect, type Locator, type Page, type Request } from '@playwright/test';
import { nextRegion, regionById, regionHeading, regionPhotoViews } from '@/lib/regions';
import { pressButton } from './helpers/engine';

/**
 * Region stepping and the end-of-series card (LBOX-09; 18 D-12, D-11;
 * 18-UI-SPEC Contract 3 "Steps" and "End-of-series card"; PHOTO-06). The
 * viewer, on the photo page and in the lightbox opened from a region page's
 * sequence figure, steps through the photo's region series in sequence order
 * and never by itself; after the last photo comes one extra step, the end card,
 * which replaces the stage and the strip. On the card the counter reads 'End',
 * Next and Zoom are aria-disabled, the URL and the document title stay on the
 * last photo (no history entry, a reload shows the last photo), the live region
 * reads 'End of the {region} series. Next region: {heading}.', and the trail
 * sign leads to the next region west to east (wrapping) by soft navigation,
 * leaving no dialog. Escape, Close photo and browser Back on the card return
 * focus to the last photo's [data-photo-id] figure link, box and 4 px ring
 * fully in view below the nav (14 LBOX-08).
 *
 * The file was e2e/photos-carousel.spec.ts. Its ten carousel tests are
 * rewritten here one to one as stepping tests (18-16-SUMMARY.md maps each old
 * title to its new one); none was deleted.
 *
 * Fixtures are explicit: a series is regionPhotoViews(region) (positions in
 * sequence order: the first photo, the last photo), and the region after it is
 * nextRegion(region). Expected strings are built from the registry's names.
 */

/** A registry region by id, or a thrown error naming it. */
function regionOf(id: string) {
  const r = regionById(id);
  if (!r) throw new Error(`photos-stepping.spec: ${id} is not a registry region`);
  return r;
}

/** Zermatt's series (sequence order) and the region after it west to east (D-01, D-11). */
const ZERMATT = regionOf('zermatt');
const ZERMATT_SERIES = regionPhotoViews(ZERMATT.id);
const FIRST = ZERMATT_SERIES[0];
const LAST = ZERMATT_SERIES[ZERMATT_SERIES.length - 1];
const N = ZERMATT_SERIES.length;
const AFTER_ZERMATT = nextRegion(ZERMATT.id)!;
const CARD_HEADING = `End of the ${ZERMATT.name} series`;
const CARD_SENTENCE = `${CARD_HEADING}. Next region: ${regionHeading(AFTER_ZERMATT)}.`;

/** A content-hashed manifest derivative: /images/photos/<name>.<10 hex>.<avif|webp>. */
const DERIVATIVE = /^\/images\/photos\/[a-z0-9-]+\.[0-9a-f]{10}\.(avif|webp)$/;

/** The global focus ring: a 2 px outline at a 2 px offset (app/globals.css :focus-visible). */
const RING_PX = 4;

const counter = (scope: Page | Locator) => scope.locator('[data-photo-counter]');
const status = (scope: Page | Locator) => scope.locator('[data-photo-viewer] > p[role="status"]');
const nextButton = (scope: Page | Locator) =>
  scope.getByRole('button', { name: 'Next photo', exact: true });
const prevButton = (scope: Page | Locator) =>
  scope.getByRole('button', { name: 'Previous photo', exact: true });

/**
 * Wait until React has hydrated an element. A click on server-rendered markup
 * before hydration does nothing (a button) or is a plain document navigation
 * (a link, never intercepted).
 */
async function waitForHydration(target: Locator) {
  await expect
    .poll(
      () => target.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))),
      { timeout: 15000 }
    )
    .toBe(true);
}

/** Two animation frames: a step that lands after a frame has landed. */
async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())))
  );
}

/**
 * Open a photo in the lightbox from its figure link on its region page and
 * wait for the dialog: the region page is the stepping set's own surface.
 */
async function openFromRegion(page: Page, regionId: string, slug: string) {
  await page.goto(`/photos/regions/${regionId}`);
  const link = page.locator(`[data-photo-id="${slug}"]`);
  await expect(link).toHaveCount(1);
  await waitForHydration(link);
  await link.click();
  const dialog = page.getByRole('dialog');
  // The dev server compiles the intercepted route on its first request.
  await expect(dialog).toBeVisible({ timeout: 20000 });
  await expect(page).toHaveURL(new RegExp(`/photos/${slug}$`));
  return dialog;
}

/**
 * The LBOX-08 opener: the series' first figure from the top of the region page
 * without moving the page (focus without a scroll, then Enter; a click would
 * scroll the trigger into view first).
 */
async function openFirstWithoutScroll(page: Page, slug: string) {
  const trigger = page.locator(`[data-photo-id="${slug}"]`);
  await expect(trigger).toHaveCount(1);
  await waitForHydration(trigger);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await trigger.evaluate((el: HTMLElement) => el.focus({ preventScroll: true }));
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 20000 });
  await expect(page).toHaveURL(new RegExp(`/photos/${slug}$`));
  return dialog;
}

/** Press 'Next photo' `presses` times, checking the counter after each press. */
async function pressNext(dialog: Locator, browserName: string, from: number, presses: number) {
  const next = nextButton(dialog);
  await waitForHydration(next);
  for (let i = 1; i <= presses; i++) {
    await pressButton(next, browserName);
    const at = from + i;
    await expect(counter(dialog)).toHaveText(at > N ? 'End' : `${at} / ${N}`);
  }
}

/**
 * Where `[data-photo-id={slug}]` is: 'missing', 'in-view' (its box inflated by the ring lies
 * inside the viewport below --nav-h) or 'off-screen'. `focused` reads document.activeElement,
 * which must carry the slug (the LBOX-08 matrix's triggerState, e2e/photos-lightbox.spec.ts).
 */
async function triggerState(
  page: Page,
  slug: string,
  focused: boolean
): Promise<'missing' | 'in-view' | 'off-screen'> {
  return page.evaluate(
    ({ slug, focused, ring }) => {
      const el = focused
        ? document.activeElement
        : document.querySelector(`[data-photo-id="${CSS.escape(slug)}"]`);
      if (!(el instanceof HTMLElement) || el.getAttribute('data-photo-id') !== slug) {
        return 'missing';
      }
      const r = el.getBoundingClientRect();
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:absolute;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:var(--nav-h)';
      document.body.appendChild(probe);
      const navH = probe.getBoundingClientRect().height;
      probe.remove();
      const inView =
        r.top - ring >= navH &&
        r.bottom + ring <= document.documentElement.clientHeight &&
        r.left - ring >= 0 &&
        r.right + ring <= document.documentElement.clientWidth;
      return inView ? 'in-view' : 'off-screen';
    },
    { slug, focused, ring: RING_PX }
  );
}

/** LBOX-08: focus on the photo's figure link, its box and ring fully in view below the nav. */
async function expectFigureFocusedInView(page: Page, slug: string) {
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
    .toBe(slug);
  await expect
    .poll(() => triggerState(page, slug, true), {
      message: `the focused [data-photo-id="${slug}"] and its ring are fully in view`,
    })
    .toBe('in-view');
}

/** The row's precondition, checked while the dialog is open: the figure is off-screen. */
async function expectFigureOffscreen(page: Page, slug: string) {
  await expect
    .poll(() => triggerState(page, slug, false), {
      message: `[data-photo-id="${slug}"] must start off-screen, or the row proves nothing`,
    })
    .toBe('off-screen');
}

/** Bodies of every same-origin script the page loaded (from its resource entries, refetched). */
async function loadedScriptBodies(page: Page): Promise<{ url: string; body: string }[]> {
  const urls = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry as PerformanceResourceTiming)
      .filter(
        (entry) =>
          entry.initiatorType === 'script' || /\.m?js(\?|$)/.test(new URL(entry.name).pathname)
      )
      .map((entry) => entry.name)
      .filter((url) => new URL(url).origin === location.origin)
  );
  const unique = [...new Set(urls)];
  return Promise.all(
    unique.map(async (url) => ({ url, body: await (await page.request.get(url)).text() }))
  );
}

/** A horizontal touch swipe over `target` (pointer events, as a finger sends them). */
async function swipe(target: Locator, dx: number) {
  const rect = (await target.boundingBox())!;
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  const touch = { pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true };
  await target.dispatchEvent('pointerdown', { ...touch, clientX: x, clientY: y, buttons: 1 });
  await target.dispatchEvent('pointermove', {
    ...touch,
    clientX: x + dx / 2,
    clientY: y + 5,
    buttons: 1,
  });
  await target.dispatchEvent('pointerup', { ...touch, clientX: x + dx, clientY: y + 10 });
}

test.describe('The end-of-series card (18-16; LBOX-09, D-12)', () => {
  // @no-win-webkit: on Windows WebKit (WinCairo) any soft navigation out of the lightbox after
  // a step crashes the page under view transitions, with or without the card (18-16
  // deferred-items.md); Chromium, Firefox and CI's Linux WebKit run the row.
  test('tracer: Next from the last Zermatt photo shows the end card, and its sign leads to the next region with no dialog @no-win-webkit', async ({
    page,
    browserName,
  }) => {
    const dialog = await openFromRegion(page, ZERMATT.id, LAST.slug);
    await expect(counter(dialog)).toHaveText(`${N} / ${N}`);

    const next = nextButton(dialog);
    await waitForHydration(next);
    await pressButton(next, browserName);
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(CARD_HEADING);
    await expect(dialog).toHaveAccessibleName(CARD_HEADING);
    await expect(counter(dialog)).toHaveText('End');
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    // The card is a viewer state, not a page: the URL stays on the last photo.
    await expect(page).toHaveURL(new RegExp(`/photos/${LAST.slug}$`));

    const heading = regionHeading(AFTER_ZERMATT);
    const sign = dialog.getByRole('link', { name: `${heading}, next region`, exact: true });
    await expect(sign).toHaveAttribute('href', `/photos/regions/${AFTER_ZERMATT.id}`);
    await sign.click();
    await expect(page).toHaveURL(new RegExp(`/photos/regions/${AFTER_ZERMATT.id}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('keys reach the card and Previous returns; on the card the URL and title stay on the last photo, and reload shows the last photo', async ({
    page,
  }) => {
    const dialog = await openFromRegion(page, ZERMATT.id, ZERMATT_SERIES[N - 2].slug);
    await waitForHydration(nextButton(dialog));
    const length = await page.evaluate(() => history.length);

    // → to the last photo, → onto the card, → again does nothing (no wrap).
    await page.keyboard.press('ArrowRight');
    await expect(counter(dialog)).toHaveText(`${N} / ${N}`);
    await page.keyboard.press('ArrowRight');
    await expect(counter(dialog)).toHaveText('End');
    await page.keyboard.press('ArrowRight');
    await settle(page);
    await expect(counter(dialog)).toHaveText('End');
    await expect(page).toHaveURL(new RegExp(`/photos/${LAST.slug}$`));
    await expect(page).toHaveTitle(`${LAST.title} · Tim Lui`);
    expect(await page.evaluate(() => history.length)).toBe(length);
    // Zoom is aria-disabled and Z does nothing; Hide labels stays operable.
    const zoom = dialog.getByRole('button', { name: 'Zoom photo', exact: true });
    await expect(zoom).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('z');
    await expect(zoom).toHaveAttribute('aria-pressed', 'false');
    await expect(
      dialog.getByRole('button', { name: 'Hide labels', exact: true })
    ).not.toHaveAttribute('aria-disabled');

    // ← returns to the last photo, and Previous is enabled on the card.
    await page.keyboard.press('ArrowLeft');
    await expect(counter(dialog)).toHaveText(`${N} / ${N}`);
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(LAST.title);
    await page.keyboard.press('ArrowRight');
    await expect(counter(dialog)).toHaveText('End');
    await expect(prevButton(dialog)).not.toHaveAttribute('aria-disabled');

    // A reload on the card's URL is the last photo's page: no card, no dialog.
    await page.reload();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(LAST.title);
    await expect(counter(page)).toHaveText(`${N} / ${N}`);
  });

  test('the live region announces the card sentence; the last region west to east wraps to the first', async ({
    page,
    browserName,
  }) => {
    // The photo page: same viewer, h1 on the card.
    await page.goto(`/photos/${LAST.slug}`);
    const main = page.getByRole('main');
    await pressNext(main, browserName, N, 1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(CARD_HEADING);
    await expect(status(page)).toHaveText(CARD_SENTENCE);
    await expect(status(page)).toHaveAttribute('aria-atomic', 'true');

    // The last region's card leads back to the first (D-11).
    const order = [ZERMATT, AFTER_ZERMATT];
    while (nextRegion(order[order.length - 1].id)!.id !== ZERMATT.id) {
      order.push(nextRegion(order[order.length - 1].id)!);
    }
    const lastRegion = order[order.length - 1];
    const lastSeries = regionPhotoViews(lastRegion.id);
    await page.goto(`/photos/${lastSeries[lastSeries.length - 1].slug}`);
    const next = nextButton(page.getByRole('main'));
    await waitForHydration(next);
    await pressButton(next, browserName);
    await expect(status(page)).toHaveText(
      `End of the ${lastRegion.name} series. Next region: ${regionHeading(ZERMATT)}.`
    );
    await expect(
      page
        .getByRole('main')
        .getByRole('link', { name: `${regionHeading(ZERMATT)}, next region`, exact: true })
    ).toHaveAttribute('href', `/photos/regions/${ZERMATT.id}`);
    await expect(
      page.getByRole('main').getByRole('link', { name: 'All regions', exact: true })
    ).toHaveAttribute('href', '/photos');
  });

  test('swipe left on the last photo shows the card and swipe right returns @chromium-only', async ({
    page,
  }) => {
    await page.goto(`/photos/${LAST.slug}`);
    const main = page.getByRole('main');
    const photoBox = main.locator('[data-photo-box]');
    await waitForHydration(photoBox);
    const length = await page.evaluate(() => history.length);

    await swipe(photoBox, -120);
    await expect(counter(main)).toHaveText('End');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(CARD_HEADING);
    await expect(page).toHaveURL(new RegExp(`/photos/${LAST.slug}$`));

    await swipe(main.locator('[data-end-card-stage]'), 120);
    await expect(counter(main)).toHaveText(`${N} / ${N}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(LAST.title);
    await settle(page);
    expect(await page.evaluate(() => history.length)).toBe(length);
  });

  for (const close of ['Escape', 'Close photo', 'browser Back'] as const) {
    test(`${close} on the card returns focus to the last figure, fully in view (LBOX-08) @no-win-webkit`, async ({
      page,
      browserName,
    }) => {
      // The LBOX-08 cross-engine size and setup (a): from the top, the last figure is below the fold.
      await page.setViewportSize({ width: 720, height: 450 });
      await page.goto(`/photos/regions/${ZERMATT.id}`);
      const dialog = await openFirstWithoutScroll(page, FIRST.slug);
      await pressNext(dialog, browserName, 1, N);
      await expect(dialog).toHaveAccessibleName(CARD_HEADING);
      await expect(page).toHaveURL(new RegExp(`/photos/${LAST.slug}$`));
      await expectFigureOffscreen(page, LAST.slug);

      if (close === 'Escape') await page.keyboard.press('Escape');
      else if (close === 'Close photo') {
        await dialog.getByRole('button', { name: 'Close photo', exact: true }).click();
      } else await page.goBack();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page).toHaveURL(new RegExp(`/photos/regions/${ZERMATT.id}$`));
      await expectFigureFocusedInView(page, LAST.slug);
    });
  }
});

test.describe('Region stepping (18-16 rewrite of the carousel tests; LBOX-09, PHOTO-06)', () => {
  test('the viewer never advances by itself on a region photo', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/photos/${FIRST.slug}`);
    const main = page.getByRole('main');
    await expect(counter(main)).toHaveText(`1 / ${N}`);
    await expect(counter(main)).toHaveAttribute('aria-hidden', 'true');
    await expect(prevButton(main)).toHaveAttribute('aria-disabled', 'true');
    await expect(nextButton(main)).not.toHaveAttribute('aria-disabled');
    await waitForHydration(nextButton(main));

    // PHOTO-04: no timer. Six idle seconds change nothing.
    await page.waitForTimeout(6000);
    await expect(counter(main)).toHaveText(`1 / ${N}`);
    await expect(page).toHaveURL(new RegExp(`/photos/${FIRST.slug}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(FIRST.title);
  });

  test('← and → step only in the viewer and skip the site chrome', async ({ page }) => {
    await page.goto(`/photos/${FIRST.slug}`);
    const main = page.getByRole('main');
    await waitForHydration(nextButton(main));

    await nextButton(main).focus();
    await page.keyboard.press('ArrowRight');
    await expect(counter(main)).toHaveText(`2 / ${N}`);
    await page.keyboard.press('ArrowLeft');
    await expect(counter(main)).toHaveText(`1 / ${N}`);
    await page.keyboard.press('ArrowRight');
    await expect(counter(main)).toHaveText(`2 / ${N}`);

    // Focus in the site nav: the same keys belong to the chrome and step nothing.
    const navLink = page.getByRole('banner').getByRole('link').first();
    await navLink.focus();
    await expect(navLink).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await settle(page);
    await expect(counter(main)).toHaveText(`2 / ${N}`);
    await expect(page).toHaveURL(new RegExp(`/photos/${ZERMATT_SERIES[1].slug}$`));
  });

  test('a sequence figure opens the lightbox and Escape returns focus to its link @no-win-webkit', async ({
    page,
  }) => {
    const second = ZERMATT_SERIES[1];
    const dialog = await openFromRegion(page, ZERMATT.id, second.slug);
    await expect(dialog).toHaveAccessibleName(second.title);
    await expect(counter(dialog)).toHaveText(`2 / ${N}`);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/photos/regions/${ZERMATT.id}$`));
    await expectFigureFocusedInView(page, second.slug);
  });

  test("after steps inside the lightbox, closing returns focus to the last shown photo's figure (LBOX-08) @no-win-webkit", async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize({ width: 720, height: 450 });
    await page.goto(`/photos/regions/${ZERMATT.id}`);
    const dialog = await openFirstWithoutScroll(page, FIRST.slug);
    await pressNext(dialog, browserName, 1, 2);
    const shown = ZERMATT_SERIES[2];
    await expect(page).toHaveURL(new RegExp(`/photos/${shown.slug}$`));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expectFigureFocusedInView(page, shown.slug);
  });

  test("after a step closed by browser Back at once, focus returns to the shown photo's figure (10-REVIEW WR-01, LBOX-08) @no-win-webkit", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 720, height: 450 });
    await page.goto(`/photos/regions/${ZERMATT.id}`);
    const dialog = await openFirstWithoutScroll(page, FIRST.slug);
    const shown = ZERMATT_SERIES[1];

    // The step and the Back in one task: usePathname has not caught up with
    // the step's replaceState when the lightbox closes.
    const step = nextButton(dialog);
    await waitForHydration(step);
    await step.evaluate((button: HTMLElement) => {
      button.click();
      window.history.back();
    });
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/photos/regions/${ZERMATT.id}$`));
    await expectFigureFocusedInView(page, shown.slug);
  });

  test('a region page loads no three.js chunk', async ({ page, browserName }) => {
    const dialog = await openFromRegion(page, ZERMATT.id, LAST.slug);
    // The viewer and the card are loaded too: step onto the card.
    await pressNext(dialog, browserName, N, 1);
    // A deliberate fixed window, not a settle wait (18-REVIEW IN-06): the claim is
    // that no three.js chunk loads later either, a negative over time with no event
    // to wait for (like the six idle seconds of the PHOTO-04 row above).
    await page.waitForTimeout(2000);

    await expect(page.locator('canvas')).toHaveCount(0);
    const scripts = await loadedScriptBodies(page);
    expect(scripts.length).toBeGreaterThan(0);
    const three = scripts.filter((s) => s.body.includes('THREE.WebGLRenderer')).map((s) => s.url);
    expect(three, 'scripts containing THREE.WebGLRenderer').toEqual([]);
  });

  test('stepping requests only hashed manifest derivatives', async ({ page, browserName }) => {
    const requested = new Set<string>();
    const inFlight = new Set<Request>();
    const isPhoto = (request: Request) =>
      new URL(request.url()).pathname.startsWith('/images/photos/');
    page.on('request', (request) => {
      if (!isPhoto(request)) return;
      requested.add(new URL(request.url()).pathname);
      inFlight.add(request);
    });
    page.on('requestfinished', (request) => inFlight.delete(request));
    page.on('requestfailed', (request) => inFlight.delete(request));
    const dialog = await openFromRegion(page, ZERMATT.id, FIRST.slug);
    await pressNext(dialog, browserName, 1, N);
    // Poll, not a fixed wait (18-REVIEW IN-06): until every series photo's derivative
    // has been requested and no /images/photos/ request is still in flight.
    await expect
      .poll(
        () =>
          inFlight.size === 0 &&
          ZERMATT_SERIES.every((view) =>
            [...requested].some((p) => p.startsWith(`/images/photos/${view.id}-`))
          ),
        { message: 'every series derivative requested and settled' }
      )
      .toBe(true);

    const paths = [...requested];
    expect(paths.length, '/images/photos/ requests').toBeGreaterThan(0);
    for (const path of paths) {
      expect(path).toMatch(DERIVATIVE);
      expect(path).not.toMatch(/-(thumb|medium|large)/);
    }
    // Every photo the steps showed was drawn from its own derivatives.
    for (const view of ZERMATT_SERIES) {
      expect(
        paths.some((p) => p.startsWith(`/images/photos/${view.id}-`)),
        `${view.id} derivative requested`
      ).toBe(true);
    }
  });
});
