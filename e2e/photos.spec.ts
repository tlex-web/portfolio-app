import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  readViewTransitions,
  recordViewTransitions,
  waitForViewTransitionsSettled,
} from './helpers/view-transitions';
import { regionHref } from '@/lib/photos/routes';
import { LEGACY_VIEW_REGION } from '@/lib/photos/region-ids';
import {
  regionCardFacts,
  regionCover,
  regionHeading,
  regionNumber,
  regionPhotoViews,
  regionsWestToEast,
} from '@/lib/regions';

// /photos is the Alps overview (18-22): region rows west to east, no view switch. Photos are
// selected explicitly per region (regionPhotoViews(id)), never through a no-argument series
// build (18-RESEARCH Pitfall 8); index lookups are positions in a region's series.

/** The overview's region list (REGION-01, D-01, D-02; 18-UI-SPEC Contract 1 "Region list"). */
const REGION_LIST = 'Regions, west to east';
const regionRows = (page: Page) =>
  page.getByRole('list', { name: REGION_LIST }).locator('a[data-region-row]');
/** The registry regions west to east, with the text each row prints; never hand-typed. */
const overviewRegions = regionsWestToEast().map((r) => ({
  id: r.id,
  number: regionNumber(r.id),
  heading: regionHeading(r),
  ...regionCardFacts(r.id),
}));
const LEGACY_TARGET = regionHref(LEGACY_VIEW_REGION);

/**
 * The retired view URLs (18 D-03, PHOTO-06; T-18-44, T-18-45). proxy.ts answers
 * /photos?view=grid and ?view=carousel with a 308 to the Zermatt region page,
 * built from a constant, with no query; any other value renders the overview.
 * The request rows read the raw answer (maxRedirects 0); the browser row follows it.
 */
test.describe('Legacy ?view= redirect (D-03, PHOTO-06)', () => {
  test('?view=carousel answers 308 with Location /photos/regions/zermatt and no query', async ({
    request,
  }) => {
    expect(LEGACY_TARGET).toBe('/photos/regions/zermatt');
    const response = await request.get('/photos?view=carousel', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    const location = response.headers()['location'] ?? '';
    expect(location.endsWith(LEGACY_TARGET), location).toBe(true);
    expect(location).not.toContain('?');
  });

  test('?view=grid answers 308 to /photos/regions/zermatt, and ?view=xyz renders the overview with 200', async ({
    request,
  }) => {
    const grid = await request.get('/photos?view=grid', { maxRedirects: 0 });
    expect(grid.status()).toBe(308);
    const location = grid.headers()['location'] ?? '';
    expect(location.endsWith(LEGACY_TARGET), location).toBe(true);
    expect(location).not.toContain('?');

    const unknown = await request.get('/photos?view=xyz', { maxRedirects: 0 });
    expect(unknown.status()).toBe(200);
    expect(unknown.headers()['location']).toBeUndefined();
    const html = await unknown.text();
    expect(html).toContain(`aria-label="${REGION_LIST}"`);
    for (const r of overviewRegions) expect(html).toContain(`data-region-row="${r.id}"`);
  });

  test('a browser on /photos?view=grid ends on the Zermatt region page', async ({ page }) => {
    await page.goto('/photos?view=grid');
    await expect(page).toHaveURL(new RegExp(`${LEGACY_TARGET}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Zermatt, Switzerland');
    await expect(page.getByRole('list', { name: REGION_LIST })).toHaveCount(0);
  });
});

/** Wait until React has hydrated an element (a click before that is a document navigation). */
async function waitForHydration(el: Locator) {
  await expect
    .poll(
      () => el.evaluate((node) => Object.keys(node).some((k) => k.startsWith('__reactProps'))),
      { timeout: 15000 }
    )
    .toBe(true);
}

/** Every region row's thumbnail has loaded (img complete with a decoded width). */
async function thumbnailsLoaded(page: Page) {
  await expect
    .poll(() =>
      regionRows(page).evaluateAll((rows) =>
        rows.every((row) => {
          const img = row.querySelector('img');
          return !!img && img.complete && img.naturalWidth > 0;
        })
      )
    )
    .toBe(true);
}

/** A region page's figure link (18-08: li[data-sequence-item] holds [data-photo-id]). */
const figureLink = (page: Page, slug: string) =>
  page.locator(`li[data-sequence-item="${slug}"] [data-photo-id="${slug}"]`);

/** Hydrate and click a region row, then wait for its region page's h1. */
async function openRegion(page: Page, index: number) {
  const r = overviewRegions[index];
  const row = regionRows(page).nth(index);
  await waitForHydration(row);
  await row.click();
  await expect(page).toHaveURL(new RegExp(`${regionHref(r.id)}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(r.heading);
  return r;
}

const SIX_WIDTHS = [360, 375, 412, 768, 1024, 1440];

/**
 * /photos is the Alps overview (REGION-01, D-01, D-02, D-04; 18-UI-SPEC
 * Contract 1): the header band, then the h2 'Regions' over one link row per
 * region, west to east, each to its region page. The rows are the keyboard and
 * screen-reader path (the overview sheet's markers, 18-23, are pointer-only).
 *
 * These are the successors of the Map view rows (PHOTO-01, PHOTO-03, 10-08),
 * which tested the survey sheet's waypoint plates on /photos (PHOTO-06, 18-22
 * retirement map). A photo now opens from its region page, so the open and
 * close rows run overview → region row → figure. The Map view's Escape row
 * retired onto 18-21's keyboard row ('Enter on a figure link opens the
 * lightbox on Close photo; …; Escape returns focus'), the one declared
 * allowance; its two ?view= rows became the redirect rows above. Expected
 * values come from the registry (regionsWestToEast, regionCardFacts,
 * regionCover, regionPhotoViews), never hand-typed.
 */
test.describe('Regions list (REGION-01, D-02)', () => {
  test('opens on the overview with the three region rows west to east: names, counts and hrefs', async ({
    page,
  }) => {
    await page.goto('/photos');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Photographs');
    await expect(page.getByRole('heading', { level: 2, name: 'Regions' })).toBeVisible();
    const rows = regionRows(page);
    await expect(rows).toHaveCount(overviewRegions.length);
    expect(overviewRegions.map((r) => r.id)).toEqual(['zermatt', 'ortler', 'saalfelden']);
    for (const [i, r] of overviewRegions.entries()) {
      const row = rows.nth(i);
      await expect(row).toHaveAttribute('data-region-row', r.id);
      await expect(row).toHaveAttribute('href', regionHref(r.id));
      await expect(row.locator('[data-region-badge]')).toHaveText(String(r.number));
      await expect(row.locator('[data-region-name]')).toHaveText(r.heading);
      await expect(row.locator('[data-region-count]')).toHaveText(r.count);
      await expect(row.locator('[data-region-facts]')).toHaveText(`${r.range} · ${r.years}`);
      await expect(row).toHaveAccessibleName(new RegExp(`^${r.heading}`));
    }
  });

  // @needs-tab-to-links: the rows are links, and WebKit on Windows and macOS never Tabs to a
  // link (Safari's default, helpers/engine.ts); Linux WebKit (CI) runs it.
  test('Tab reaches the three region rows in west-to-east order @needs-tab-to-links', async ({
    page,
  }) => {
    await page.goto('/photos');
    const rows = regionRows(page);
    await expect(rows).toHaveCount(overviewRegions.length);
    const first = rows.first();
    for (let i = 0; i < 40 && !(await first.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(first).toBeFocused();
    for (let i = 1; i < overviewRegions.length; i++) {
      await page.keyboard.press('Tab');
      await expect(rows.nth(i)).toBeFocused();
      await expect(rows.nth(i)).toHaveAttribute('data-region-row', overviewRegions[i].id);
    }
  });

  test('a region row opens its region page', async ({ page }) => {
    await page.goto('/photos');
    await openRegion(page, 1);
    await expect(page.getByRole('list', { name: REGION_LIST })).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('from the overview, a region row and then its first figure open the lightbox, and Close photo closes it on the region page', async ({
    page,
  }) => {
    await page.goto('/photos');
    const r = await openRegion(page, 0);
    const first = regionPhotoViews(r.id)[0];
    const link = figureLink(page, first.slug);
    await waitForHydration(link);
    await link.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(first.title);
    await dialog.getByRole('button', { name: 'Close photo', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`${regionHref(r.id)}$`));
  });

  test('opening a region from the overview is a plain navigation: no photo-* pseudo-element @chromium-only', async ({
    page,
  }) => {
    await recordViewTransitions(page);
    await page.goto('/photos');
    const before = (await readViewTransitions(page)).transitions.length;
    await openRegion(page, 0);
    // Settled first (10-REVIEW IN-09): every transition the navigation started has finished.
    const after = (await waitForViewTransitionsSettled(page)).transitions.slice(before).flat();
    expect(after.filter((pseudo) => pseudo.includes('photo-'))).toEqual([]);
  });

  test("the approximate photo's badge on the Zermatt plate is dashed", async ({ page }) => {
    await page.goto('/photos');
    const r = await openRegion(page, 0);
    expect(r.id).toBe('zermatt');
    const pinned = regionPhotoViews(r.id).filter((v) => v.uv);
    expect(
      pinned.some((v) => v.approximate),
      'Zermatt has an approximate photo'
    ).toBe(true);
    for (const view of pinned) {
      const border = await page.locator(`[data-plate-badge="${view.slug}"]`).evaluate((el) => {
        const cs = getComputedStyle(el);
        return `${cs.borderTopWidth} ${cs.borderTopStyle}`;
      });
      // Preflight gives every element a solid 0 px border; only an approximate badge draws one.
      expect([view.slug, border]).toEqual([
        view.slug,
        view.approximate ? '2px dashed' : '0px solid',
      ]);
    }
  });

  for (const width of SIX_WIDTHS) {
    test(`at ${width} x 900 each region row's thumbnail keeps its true ratio and the list has no horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/photos');
      await expect(regionRows(page)).toHaveCount(overviewRegions.length);
      await thumbnailsLoaded(page);
      const boxes = await regionRows(page).evaluateAll((rows) =>
        rows.map((row) => {
          const thumb = row.querySelector('[data-region-thumb]')!.getBoundingClientRect();
          const img = row.querySelector('img')!;
          return {
            id: (row as HTMLElement).dataset.regionRow!,
            width: thumb.width,
            height: thumb.height,
            natural: img.naturalWidth / img.naturalHeight,
            rowHeight: row.getBoundingClientRect().height,
          };
        })
      );
      for (const b of boxes) {
        const cover = regionCover(b.id).tile;
        const ratio = cover.width / cover.height;
        expect([b.id, Math.round(b.width)]).toEqual([b.id, 96]);
        expect([b.id, Math.abs(b.width / b.height / ratio - 1) <= 0.01]).toEqual([b.id, true]);
        expect([b.id, Math.abs(b.natural / ratio - 1) <= 0.01]).toEqual([b.id, true]);
        // 44 px target: the 96 px thumbnail and p-2 keep every row far above it.
        expect([b.id, b.rowHeight >= 44]).toEqual([b.id, true]);
      }
      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth - root.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  // UI E2/overflow: the row text wraps (line 3 at most once, at ' · ') and never truncates,
  // at every width from the 360 phone to the 320 px lg column.
  for (const width of SIX_WIDTHS) {
    test(`at ${width} x 900 no region row's text truncates`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/photos');
      await expect(regionRows(page)).toHaveCount(overviewRegions.length);
      await page.evaluate(() => document.fonts.ready);
      const rows = await regionRows(page).evaluateAll((els) =>
        els.map((row) => {
          const box = row.getBoundingClientRect();
          const part = (sel: string) => {
            const el = row.querySelector(sel)!;
            const range = document.createRange();
            range.selectNodeContents(el);
            const rects = [...range.getClientRects()];
            return {
              text: el.textContent ?? '',
              overflowX: el.scrollWidth - el.clientWidth,
              ellipsis: getComputedStyle(el).textOverflow === 'ellipsis',
              lines: new Set(rects.map((r) => Math.round(r.top))).size,
              rects: rects.map((r) => ({ left: r.left, right: r.right })),
            };
          };
          return {
            id: (row as HTMLElement).dataset.regionRow!,
            box: { left: box.left, right: box.right },
            name: part('[data-region-name]'),
            count: part('[data-region-count]'),
            facts: part('[data-region-facts]'),
          };
        })
      );
      for (const [i, r] of overviewRegions.entries()) {
        const row = rows[i];
        expect(row.id).toBe(r.id);
        expect(row.name.text).toBe(r.heading);
        expect(row.count.text).toBe(r.count);
        expect(row.facts.text).toBe(`${r.range} · ${r.years}`);
        expect([r.id, row.count.lines, row.facts.lines <= 2]).toEqual([r.id, 1, true]);
        for (const [label, p] of [
          ['name', row.name],
          ['count', row.count],
          ['facts', row.facts],
        ] as const) {
          expect([r.id, label, p.overflowX <= 0, p.ellipsis]).toEqual([r.id, label, true, false]);
          for (const rect of p.rects) {
            const inside = rect.left >= row.box.left - 0.5 && rect.right <= row.box.right + 0.5;
            expect([r.id, label, inside]).toEqual([r.id, label, true]);
          }
        }
      }
    });
  }
});

/*
 * The Grid view describe (PHOTO-02, PHOTO-03, D-15) moved to e2e/photos-region.spec.ts in
 * 18-21 (PHOTO-06), before 18-22 retires the views: 'Grid view rewritten: the Zermatt
 * sequence (PHOTO-06)' holds one successor row each for the order-and-hrefs, the 375
 * one-column, the hashed-derivative and the first-tile-opens-the-lightbox rows. The two
 * per-size true-ratio rows (768 x 900, 1440 x 900) retire onto 18-08's ratio row,
 * '/photos/regions/zermatt at 768|1440: no overflow; every figure uncropped, ticks off the
 * image, sized right' (18-21-SUMMARY.md mapping table).
 */

/**
 * /photos without the view switch (PHOTO-06, D-03, D-27): the successors of
 * the View switcher rows (PHOTO-02, D-14, 10-09). The page has no toggle group
 * and reads no ?view=; navigation history belongs to the region rows (a push,
 * so Back returns to the list); ?view=map is the overview itself, and the
 * retired ?view=grid keeps landing on the Zermatt region page.
 */
test.describe('No view switcher (PHOTO-06, D-27)', () => {
  test('opens on the overview with no view switcher: no radiogroup, no View group, no segment links', async ({
    page,
  }) => {
    await page.goto('/photos');
    await expect(regionRows(page)).toHaveCount(overviewRegions.length);
    await expect(page.getByRole('radiogroup')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'View' })).toHaveCount(0);
    const segmentName = /^(Map|Grid|Carousel)$/;
    await expect(page.getByRole('main').getByRole('link', { name: segmentName })).toHaveCount(0);
    await expect(page.getByRole('button', { name: segmentName })).toHaveCount(0);
    await expect(page.locator('a[href*="?view="]')).toHaveCount(0);
    await expect(page.locator('section[aria-labelledby="view-title"]')).toHaveCount(0);
  });

  test('at 375 x 600 a region row adds one history entry, and Back returns to /photos with the region list in view', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 600 });
    await page.goto('/photos');
    await waitForHydration(regionRows(page).first());
    const historyLength = await page.evaluate(() => window.history.length);
    await openRegion(page, 0);
    expect(await page.evaluate(() => window.history.length)).toBe(historyLength + 1);

    await page.goBack();
    await expect(page).toHaveURL(/\/photos$/);
    await expect(regionRows(page)).toHaveCount(overviewRegions.length);
    await expect(regionRows(page).first()).toBeInViewport();
  });

  test('/photos?view=map is the overview unchanged: 200, no Location, the same region rows as /photos', async ({
    page,
    request,
  }) => {
    const response = await request.get('/photos?view=map', { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(response.headers()['location']).toBeUndefined();

    const ids = () =>
      regionRows(page).evaluateAll((rows) =>
        rows.map((row) => (row as HTMLElement).dataset.regionRow)
      );
    await page.goto('/photos');
    await expect(regionRows(page)).toHaveCount(overviewRegions.length);
    const plain = await ids();
    await page.goto('/photos?view=map');
    await expect(page).toHaveURL(/\/photos\?view=map$/);
    await expect(regionRows(page)).toHaveCount(overviewRegions.length);
    expect(await ids()).toEqual(plain);
    expect(plain).toEqual(overviewRegions.map((r) => r.id));
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this
  // kind of row in CI (12-23 triage, run 41565046890), so only the Windows webkit project
  // drops it.
  test('a reload of /photos?view=grid lands on the Zermatt region page again, and Back from a photo returns to it @no-win-webkit', async ({
    page,
  }) => {
    const zermatt = new RegExp(`${LEGACY_TARGET}$`);
    await page.goto('/photos?view=grid');
    await expect(page).toHaveURL(zermatt);
    // A second visit to the old URL (a reload of the bookmark) lands there again.
    await page.goto('/photos?view=grid');
    await expect(page).toHaveURL(zermatt);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Zermatt, Switzerland');

    const first = regionPhotoViews(LEGACY_VIEW_REGION)[0];
    const link = figureLink(page, first.slug);
    await waitForHydration(link);
    await link.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));

    await page.goBack();
    await expect(page).toHaveURL(zermatt);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Zermatt, Switzerland');
  });

  // @needs-tab-to-links: as the Tab row above (WebKit off Linux never Tabs to a link).
  test('Enter on a focused region row opens its region page @needs-tab-to-links', async ({
    page,
  }) => {
    await page.goto('/photos');
    const rows = regionRows(page);
    await waitForHydration(rows.first());
    const first = rows.first();
    for (let i = 0; i < 40 && !(await first.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await page.keyboard.press('Tab');
    await expect(rows.nth(1)).toBeFocused();
    await page.keyboard.press('Enter');
    const r = overviewRegions[1];
    await expect(page).toHaveURL(new RegExp(`${regionHref(r.id)}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(r.heading);
  });

  test('a region row navigation shows no photos-view pseudo-element @chromium-only', async ({
    page,
  }) => {
    await recordViewTransitions(page);
    await page.goto('/photos');
    const before = (await readViewTransitions(page)).transitions.length;
    await openRegion(page, 1);
    const after = (await waitForViewTransitionsSettled(page)).transitions.slice(before).flat();
    expect(after.filter((pseudo) => pseudo.includes('photos-view'))).toEqual([]);
  });
});
