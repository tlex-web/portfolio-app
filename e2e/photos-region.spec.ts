import { test, expect, type Locator, type Page } from '@playwright/test';
import { regionById, regionHeading, regions, regionTitle } from '@/lib/regions';

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
