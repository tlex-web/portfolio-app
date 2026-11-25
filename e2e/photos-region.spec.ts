import { test, expect, type Locator, type Page } from '@playwright/test';
import { site } from '@/data/site';
import {
  regionBreadcrumb,
  regionById,
  regionCardFacts,
  regionHeading,
  regionOfPhoto,
  regions,
  regionTitle,
} from '@/lib/regions';
import { photoSlugs, publishedViews } from '@/lib/photos/view-model';

/**
 * The region pages in a browser (REGION-07; D-01, D-02, D-11): the 17-01
 * spike's navigation checks as permanent tests. /photos/regions/<id> is a
 * server-rendered page inside the photos layout: a hard load and a reload
 * answer 200 with "Photographs" current and no dialog; a soft navigation from
 * /photos lands on the region page, never in the lightbox; a photo link on a
 * region page opens the lightbox over it, and Back closes it cleanly; a push
 * from an open lightbox to a region page leaves no stuck modal (the null
 * @modal/regions/[region] page). Expected text comes from lib/regions.ts; the
 * paths are literal, so the URL contract is checked independently of
 * regionHref.
 *
 * A navigation counts as soft when a window marker set before it survives it.
 * The soft pushes go through window.next.router, which Next exposes in
 * production builds too (app-router-instance.js); each test asserts it is a
 * function first, so a Next upgrade that drops it fails loudly instead of
 * passing vacuously. Production has no in-dialog region link (Phase 18).
 *
 * Rows that open the intercepted modal are @prod-only (the design-system G3
 * precedent): on `next dev` the (.)[slug] route compiles mid-click and the
 * click can navigate the document instead. Rows that go Back while the
 * lightbox's View Transition settles are @no-win-webkit, as in
 * photos-lightbox.spec.ts.
 *
 * The new photo pages (17 D-08, D-09; PHOTO-05): every published photo off the
 * light table (publishedViews minus photoSlugs) has a page with no stepping
 * controls and one visible back link, named after its region, to
 * /photos/regions/<id>; Escape there lands on that region page; its lightbox,
 * opened from the region page, has no stepping controls and no back link; and
 * a touch swipe or the arrows on its page do nothing (Edge PHOTO-05/empty).
 *
 * The header band (18-06; REGION-02, D-10): on every region page the visible
 * breadcrumb ('Photographs' link, the region name current, '/' aria-hidden)
 * equals the page's one BreadcrumbList block, names in order and items absolute,
 * and the data line equals regionCardFacts' parts joined at ' · '. /photos and
 * /sources carry no breadcrumb (UI E10/empty).
 *
 * The next-region chain (18-06; D-01, D-11): starting on Zermatt, following
 * the next-region sign three times lands on Ortler, Saalfelden, then Zermatt
 * again; each sign is named '{heading}, next region' and 'All regions' leads
 * to /photos.
 */

/*
 * Tests in this file run in order in one worker, each retried on its own
 * (12-22, D-26). On the dev server with the default worker count, every
 * worker compiling and soft-navigating the photo routes at once slowed
 * lightbox navigations past their timeouts (photos-lightbox.spec.ts measured
 * 16 of 52 failing). The production server that CI uses (one worker) runs
 * these tests in order already, so CI is unaffected.
 */
test.describe.configure({ mode: 'default' });

const MARK = '__regionSpecMark';

/** The region by id, or a thrown error naming it. */
function region(id: string) {
  const r = regionById(id);
  if (!r) throw new Error(`photos-region.spec: ${id} is not a registry region`);
  return r;
}

/** Set the window marker that only a soft navigation keeps. */
async function setMark(page: Page) {
  await page.evaluate((key) => {
    (window as unknown as Record<string, unknown>)[key] = 'kept';
  }, MARK);
}

async function readMark(page: Page) {
  return page.evaluate((key) => (window as unknown as Record<string, unknown>)[key], MARK);
}

/** Wait for Next's router handle, then push `path` through it (a soft navigation). */
async function routerPush(page: Page, path: string) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            typeof (window as unknown as { next?: { router?: { push?: unknown } } }).next?.router
              ?.push === 'function'
        ),
      { timeout: 15000, message: 'window.next.router.push is a function' }
    )
    .toBe(true);
  await page.evaluate((to) => {
    (window as unknown as { next: { router: { push: (p: string) => void } } }).next.router.push(to);
  }, path);
}

/**
 * Wait until React has hydrated a link: a click on a server-rendered next/link
 * before hydration is a document navigation, which is never intercepted.
 */
async function waitForHydration(link: Locator) {
  await expect
    .poll(() => link.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))), {
      timeout: 15000,
    })
    .toBe(true);
}

const h1 = (page: Page) => page.getByRole('main').getByRole('heading', { level: 1 });

test.describe('Region page (REGION-07, D-01 hard load)', () => {
  for (const r of regions) {
    test(`/photos/regions/${r.id}: 200 on a hard load and a reload, Photographs current, no dialog`, async ({
      page,
    }) => {
      for (const load of ['goto', 'reload'] as const) {
        const response =
          load === 'goto' ? await page.goto(`/photos/regions/${r.id}`) : await page.reload();
        expect(response?.status(), load).toBe(200);
        await expect(page.getByRole('main')).toHaveCount(1);
        await expect(h1(page)).toHaveText(regionHeading(r));
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(
          page
            .getByRole('banner')
            .getByRole('navigation', { name: 'Primary' })
            .getByRole('link', { name: 'Photographs', exact: true })
        ).toHaveAttribute('aria-current', 'page');
        await expect(page).toHaveTitle(`${regionTitle(r.id)} · Tim Lui`);
      }
    });
  }
});

/** Every ld+json block on the page, parsed. */
async function ldBlocks(page: Page): Promise<Record<string, unknown>[]> {
  return page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) =>
      scripts.map((s) => JSON.parse(s.textContent ?? '') as Record<string, unknown>)
    );
}

test.describe('Region header band (18-06; REGION-02, D-10)', () => {
  for (const r of regions) {
    test(`/photos/regions/${r.id}: the breadcrumb equals its BreadcrumbList; the data line is regionCardFacts`, async ({
      page,
    }) => {
      await page.goto(`/photos/regions/${r.id}`);
      const nav = page.getByRole('main').getByRole('navigation', { name: 'Breadcrumb' });
      await expect(nav).toHaveCount(1);

      // Visible crumbs: one link, then the current page as plain text, never a link.
      const link = nav.getByRole('link');
      await expect(link).toHaveCount(1);
      await expect(link).toHaveText('Photographs');
      await expect(link).toHaveAttribute('href', '/photos');
      const current = nav.locator('[aria-current="page"]');
      await expect(current).toHaveText(r.name);
      expect(await current.evaluate((el) => el.tagName)).toBe('SPAN');
      await expect(nav.locator('[aria-hidden="true"]')).toHaveText(['/']);
      const crumbs = (
        await nav.locator('li > a, li > [aria-current="page"]').allTextContents()
      ).map((t) => t.trim());
      expect(crumbs).toEqual(['Photographs', r.name]);

      // The one BreadcrumbList lists exactly the visible crumbs, in order.
      const lists = (await ldBlocks(page)).filter((b) => b['@type'] === 'BreadcrumbList');
      expect(lists).toHaveLength(1);
      const items = lists[0].itemListElement as Array<{
        name: string;
        item: string;
        position: number;
      }>;
      expect(items.map((i) => i.name)).toEqual(crumbs);
      expect(items.map((i) => i.position)).toEqual([1, 2]);
      expect(items.map((i) => i.item)).toEqual(
        regionBreadcrumb(r.id).map((c) => `${site.url}${c.path}`)
      );

      // The data line: regionCardFacts' parts, joined at ' · ' (U+00A0 kept).
      const facts = regionCardFacts(r.id);
      const line = page.locator('[data-region-header] [data-facts-line]');
      await expect(line).toHaveCount(1);
      expect(await line.textContent()).toBe([facts.count, facts.range, facts.years].join(' · '));
      await expect(h1(page)).toHaveText(regionHeading(r));
    });
  }

  test('/photos and /sources carry no breadcrumb (UI E10/empty)', async ({ page }) => {
    for (const path of ['/photos', '/sources']) {
      await page.goto(path);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0);
    }
  });
});

test.describe('Next-region chain (18-06; REGION-02, D-01, D-11)', () => {
  test('following the sign from Zermatt visits Ortler, Saalfelden, then Zermatt again', async ({
    page,
  }) => {
    await page.goto('/photos/regions/zermatt');
    await expect(h1(page)).toHaveText(regionHeading(region('zermatt')));
    const visited: string[] = [];
    for (const id of ['ortler', 'saalfelden', 'zermatt']) {
      const section = page.locator('section#next-region');
      await expect(
        section.getByRole('heading', { level: 2, name: 'Next region', exact: true })
      ).toHaveCount(1);
      const heading = regionHeading(region(id));
      const sign = section.getByRole('link', { name: `${heading}, next region`, exact: true });
      await expect(sign).toHaveCount(1);
      await expect(sign).toHaveAttribute('href', `/photos/regions/${id}`);
      await sign.click();
      await expect(page).toHaveURL(new RegExp(`/photos/regions/${id}$`));
      await expect(h1(page)).toHaveText(heading);
      visited.push((await h1(page).textContent()) ?? '');
    }
    expect(visited).toEqual(['Ortler, Italy', 'Saalfelden, Austria', 'Zermatt, Switzerland']);
  });

  test('All regions leads to /photos', async ({ page }) => {
    await page.goto('/photos/regions/ortler');
    const all = page
      .locator('section#next-region')
      .getByRole('link', { name: 'All regions', exact: true });
    await expect(all).toHaveAttribute('href', '/photos');
    await all.click();
    await expect(page).toHaveURL(/\/photos$/);
    await expect(h1(page)).toHaveText('Photographs');
  });
});

test.describe('Region page navigation (D-01 soft navigation)', () => {
  const zermatt = region('zermatt');
  const ortler = region('ortler');
  const PHOTO = 'matterhorn-from-zermatt';

  test('a soft navigation from /photos renders the region page, never the lightbox', async ({
    page,
  }) => {
    await page.goto('/photos');
    await setMark(page);
    await routerPush(page, '/photos/regions/zermatt');

    await expect(page).toHaveURL(/\/photos\/regions\/zermatt$/);
    await expect(h1(page)).toHaveText(regionHeading(zermatt));
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await readMark(page)).toBe('kept');
  });

  test('a photo link opens the lightbox over the region page; Back closes it @prod-only @no-win-webkit', async ({
    page,
  }) => {
    await page.goto('/photos/regions/zermatt');
    const link = page.locator(`[data-photo-id="${PHOTO}"]`);
    await waitForHydration(link);
    const title = (await link.textContent())?.trim() ?? '';
    expect(title).not.toBe('');
    await setMark(page);
    await link.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(new RegExp(`/photos/${PHOTO}$`));
    await expect(dialog).toHaveAccessibleName(title);
    // The region page stays mounted behind the modal (inert, so includeHidden).
    await expect(
      page.getByRole('heading', { level: 1, name: regionHeading(zermatt), includeHidden: true })
    ).toHaveCount(1);

    await page.goBack();
    await expect(page).toHaveURL(/\/photos\/regions\/zermatt$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(h1(page)).toBeVisible();
    await expect(h1(page)).toHaveText(regionHeading(zermatt));
    await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe('');
    expect(await readMark(page)).toBe('kept');
  });

  test('a push from an open lightbox to a region page leaves no stuck modal @prod-only', async ({
    page,
  }) => {
    await page.goto('/photos/regions/zermatt');
    const link = page.locator(`[data-photo-id="${PHOTO}"]`);
    await waitForHydration(link);
    await setMark(page);
    await link.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20000 });

    await routerPush(page, '/photos/regions/ortler');
    await expect(page).toHaveURL(/\/photos\/regions\/ortler$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(h1(page)).toHaveText(regionHeading(ortler));
    await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe('');
    expect(await readMark(page)).toBe('kept');
  });
});

/** The published photos off the light table, in canonical order, each with its region. */
const NEW_PHOTOS = publishedViews
  .filter((v) => !photoSlugs.includes(v.slug))
  .map((view) => {
    const id = regionOfPhoto(view.id);
    if (!id) throw new Error(`photos-region.spec: photo ${view.id} has no region`);
    return { view, region: region(id) };
  });

/** Ortler's first new photo, by data: the Escape, lightbox and swipe rows use it. */
const ORTLER_PHOTO = (() => {
  const found = NEW_PHOTOS.find((p) => p.region.id === 'ortler');
  if (!found) throw new Error('photos-region.spec: no new photo in Ortler');
  return found;
})();

/** The viewer's stepping group: both buttons and the counter. */
async function expectNoStepping(scope: Page | Locator) {
  await expect(
    scope.getByRole('button', { name: 'Previous photo', exact: true, includeHidden: true })
  ).toHaveCount(0);
  await expect(
    scope.getByRole('button', { name: 'Next photo', exact: true, includeHidden: true })
  ).toHaveCount(0);
  await expect(scope.locator('[data-photo-counter]')).toHaveCount(0);
}

test.describe('New photo pages (D-08, D-09, PHOTO-05)', () => {
  test('there are seven photos off the light table', () => {
    expect(NEW_PHOTOS).toHaveLength(7);
  });

  for (const { view, region: r } of NEW_PHOTOS) {
    test(`/photos/${view.slug}: no stepping, one back link to ${r.name}`, async ({ page }) => {
      const response = await page.goto(`/photos/${view.slug}`);
      expect(response?.status()).toBe(200);
      const main = page.getByRole('main');
      await expect(h1(page)).toHaveText(view.title);
      await expectNoStepping(main);
      // Two links in the markup (the scroll-tier row and the chrome); CSS shows one per tier.
      const back = main.getByRole('link', { name: r.name, exact: true, includeHidden: true });
      await expect(back).toHaveCount(2);
      for (const link of await back.all()) {
        await expect(link).toHaveAttribute('href', `/photos/regions/${r.id}`);
      }
      await expect(main.getByRole('link', { name: r.name, exact: true })).toHaveCount(1);
      await expect(main.getByRole('link', { name: r.name, exact: true })).toBeVisible();
      await expect(
        main.getByRole('link', { name: 'All photographs', exact: true, includeHidden: true })
      ).toHaveCount(0);
    });
  }

  test(`Escape on /photos/${ORTLER_PHOTO.view.slug} lands on the Ortler region page`, async ({
    page,
  }) => {
    const { view, region: r } = ORTLER_PHOTO;
    await page.goto(`/photos/${view.slug}`);
    const back = page.getByRole('main').getByRole('link', { name: r.name, exact: true }).first();
    await waitForHydration(back);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(new RegExp(`/photos/regions/${r.id}$`));
    await expect(h1(page)).toHaveText(regionHeading(r));
  });

  test('the lightbox from the Ortler region page has no stepping and no back link; Back closes it @prod-only @no-win-webkit', async ({
    page,
  }) => {
    const { view, region: r } = ORTLER_PHOTO;
    await page.goto(`/photos/regions/${r.id}`);
    const link = page.locator(`[data-photo-id="${view.slug}"]`);
    await waitForHydration(link);
    await link.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(new RegExp(`/photos/${view.slug}$`));
    await expect(dialog).toHaveAccessibleName(view.title);
    await expectNoStepping(dialog);
    await expect(dialog.getByRole('link', { name: r.name, exact: true })).toHaveCount(0);
    await expect(dialog.getByRole('link', { name: 'All photographs', exact: true })).toHaveCount(0);

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/photos/regions/${r.id}$`));
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(h1(page)).toHaveText(regionHeading(r));
  });

  /**
   * A left touch swipe over the page's photo, then → and ←, then two animation
   * frames. A web-first assertion passes at its first poll when nothing has
   * changed yet, so the negative row below reads its state only after this
   * settle point: a step that lands after a frame or a View Transition commit
   * has landed by then (17-REVIEW WR-02).
   */
  async function swipeAndArrows(page: Page) {
    const photoBox = page.getByRole('main').locator('[data-photo-box]');
    await waitForHydration(photoBox);
    const rect = (await photoBox.boundingBox())!;
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    const touch = { pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true };
    await photoBox.dispatchEvent('pointerdown', { ...touch, clientX: x, clientY: y, buttons: 1 });
    await photoBox.dispatchEvent('pointermove', {
      ...touch,
      clientX: x - 60,
      clientY: y + 5,
      buttons: 1,
    });
    await photoBox.dispatchEvent('pointerup', { ...touch, clientX: x - 120, clientY: y + 10 });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.evaluate(
      () =>
        new Promise<void>((done) =>
          requestAnimationFrame(() => requestAnimationFrame(() => done()))
        )
    );
  }

  /** The viewer's own polite status line (StagePhoto may hold others). */
  const viewerStatus = (page: Page) => page.locator('[data-photo-viewer] > p[role="status"]');

  /** What a step would change: the history length, the URL, the title and the status line. */
  const pageState = (page: Page) =>
    page.evaluate(() => ({
      length: history.length,
      url: location.href,
      title: document.title,
      status: document.querySelector('[data-photo-viewer] > p[role="status"]')?.textContent ?? '',
    }));

  test('Edge PHOTO-05/empty: a touch swipe and the arrows do nothing on a new photo page @chromium-only', async ({
    page,
  }) => {
    const { view } = ORTLER_PHOTO;
    await page.goto(`/photos/${view.slug}`);
    await waitForHydration(page.getByRole('main').locator('[data-photo-box]'));
    const title = await page.title();
    expect(title).toBe(`${view.title} · Tim Lui`);
    const before = await pageState(page);

    await swipeAndArrows(page);

    expect(await pageState(page)).toEqual(before);
    await expect(page).toHaveURL(new RegExp(`/photos/${view.slug}$`));
    expect(await page.title()).toBe(title);
    await expect(viewerStatus(page)).not.toHaveText(/Photo \d+ of/);

    // Positive control: the same gestures on a light-table photo page step
    // (swipe to the 2nd, → to the 3rd, ← back to the 2nd), so they reach a viewer.
    expect(photoSlugs.length).toBeGreaterThanOrEqual(3);
    await page.goto(`/photos/${photoSlugs[0]}`);
    await swipeAndArrows(page);
    await expect(page).toHaveURL(new RegExp(`/photos/${photoSlugs[1]}$`));
    await expect(viewerStatus(page)).toHaveText(new RegExp(`^Photo 2 of ${photoSlugs.length}:`));
  });
});
