import { test, expect, type Locator, type Page } from '@playwright/test';
import { site } from '@/data/site';
import {
  photoBack,
  photoBreadcrumb,
  regionBreadcrumb,
  regionById,
  regionCardFacts,
  regionCover,
  regionHeading,
  regionOfPhoto,
  regionPhotoViews,
  regions,
  regionTitle,
} from '@/lib/regions';
import { publishedViews } from '@/lib/photos/view-model';
import { railTicks } from '@/lib/photos/region-rail';
import { SLUGS } from './helpers/photo-fixtures';
import {
  readViewTransitions,
  recordViewTransitions,
  waitForViewTransitionsSettled,
} from './helpers/view-transitions';

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
 * The new photo pages (17 D-09; PHOTO-05) and region stepping (18-15; LBOX-09,
 * D-12): every published photo sits in exactly one region series, and the
 * series cover them all. Every published photo off the v2.0 four (publishedViews
 * minus the SLUGS fixtures) has a page that steps within its region as photo
 * k of N (counter 'k / N', Previous aria-disabled exactly at k = 1, Next
 * enabled throughout, since after photo N comes the end card, 18-16) and one visible back
 * link, 'Back to {region}' (18-17, D-09), to /photos/regions/<id>; Escape there lands on
 * that region page; its lightbox, opened from the region page, steps within the
 * region and has no back link (the v2.0 four's pages: photos-lightbox.spec); and a touch swipe and the arrows on its page
 * step within the region (Zermatt's seven as the second series).
 *
 * The photo page trail and its one way back (18-17; REGION-02, D-09, D-10):
 * on every published photo page the breadcrumb ('Photographs' and the region
 * name as links at least 44 px tall, the title current, two aria-hidden '/')
 * equals the page's one BreadcrumbList (names in order, items absolute); after
 * a step the current crumb names the new photo; the lightbox holds no trail;
 * at 375, 768 and 1440 exactly one link named 'Back to …' is visible; and at
 * 768 x 900 the key-tier chrome bar does not overflow (17-UI-REVIEW hand-over).
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
 *
 * Share region (18-07; PHOTO-07, D-13): the header band's button copies the
 * bare canonical site.url + '/photos/regions/<id>' even from a page loaded with
 * a query and a hash (the real clipboard, Chromium only). Stubbed through
 * addInitScript in both engines: share mode hands navigator.share the canonical
 * URL and '{heading} · Tim Lui'; a cancelled sheet changes nothing; a rejected
 * clipboard write shows the URL under the button, selected.
 *
 * The sequence (18-08; REGION-03, REGION-04, D-07, D-05, D-06; 13 #34): on
 * every region page at 375, 768 and 1440 nothing overflows sideways; every
 * figure's image keeps its natural ratio (within 1 %), none of its eight corner
 * ticks intersects the image and all stay on the page; the caption's 'n / N'
 * shows below 768 only; every image's chosen srcset candidate covers its
 * rendered width times the device pixel ratio, the next smaller one would not,
 * and the decoded file is that wide too. The header slot holds the cover
 * eager, fetchpriority high, alt '' and unnamed for view transitions, and its
 * caption row fits two lines at 375. The nav stays at the top after a long
 * scroll (D-06). Opening a figure morphs it into the lightbox (Chromium), and
 * under reduced motion no view-transition pseudo-element runs.
 *
 * Grid view rewritten (18-21; PHOTO-06): photos.spec's Grid view rows live on as
 * Zermatt sequence rows. The list 'Zermatt photographs, lowest first' holds the
 * series in regionPhotoViews order, each figure link with its photo href,
 * data-photo-id and the name '{alt}, open in the photo viewer'; at 375 x 800 it
 * is one column with no sideways scroll; every image, scrolled into view and
 * complete, has its editorial alt and a content-hashed derivative as its
 * currentSrc; and a click on the first figure opens the lightbox at its photo
 * URL with its title. The grid's two per-size true-ratio rows retire onto the
 * ratio check of 'Region sequence at 375, 768 and 1440' above.
 *
 * The plate (18-09; REGION-02, D-08): on every region page the plate has one
 * badge per photo with a position, reading its place in the ascent and
 * linking to #photo-{slug}; an approximate photo's badge and dot are hollow and
 * dashed; every badge is tabindex -1 and aria-hidden and a Tab walk never
 * lands inside the sheet; at 375, 768 and 1440 every badge stays 8 px inside
 * the sheet, no two come closer than 8 px, and every shown leader runs from
 * its dot to its badge unit. Data-driven: no position is written here.
 *
 * The key list and the jumps (18-10; REGION-02, D-08): every region page has
 * a key list with one anchor row per pin, in sequence order, named by the
 * title and altitude label, at least 44 px tall, after the h2 'Map'. At 1440 a
 * key row click sets the hash, opens no dialog, lands the figure's top collar
 * 16 px under the nav and the next Tab reaches its photo link; at 1024 the
 * facts and the key list sit left of the plate in the DOM order Facts, plate,
 * key list; at 1440 the plate is 634 px square.
 *
 * The plate margin (18-11; REGION-06, D-16..D-19): the plate figure's
 * figcaption is its sheet margin. Zermatt's reads 'Zermatt – Matterhorn ·
 * contours every 100 m', keeps the footer's 'Extent (LV95)' corners, gives
 * 'May 2026' and links 'swissALTIRegio, swisstopo' to /sources#swissaltiregio;
 * following it lands with the swissALTIRegio entry in view. Ortler's and
 * Saalfelden's print 'Extent' with WGS84 corners at 4 decimals, their own
 * editions and credits; at 375 every margin sits inside the 16 px gutters with
 * no sideways scroll and no corner wraps inside itself.
 *
 * The altimeter rail (18-12; REGION-05, D-07; UI E6): from 768 px every region
 * page has one rail tick per photo, labelled with the metres only, dashed when
 * the photo's position is approximate, under 'Altitude' ('Ground altitude' for
 * an all-aerial region). Its root's data-rail-current is the settle signal (no
 * fixed waits): '1' in the server HTML and above the first figure, the index of
 * each figure scrolled to the viewport centre, N past the last figure, and the
 * same after a jump straight from the top to #next-region and back. In the gap
 * between Zermatt's figures 3 and 4 it stays on the figure come from (3 coming
 * down, 4 coming up), recorded through a MutationObserver: it never flickers to
 * 1 or N. Only the current label is semibold; the marker moves over
 * --duration-panel, instantly under reduced motion. At 375 the rail has no box
 * and every caption starts with 'n / N'.
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

/** Copy mode on every engine: no Web Share, whatever the browser build ships (Pitfall 7). */
async function forceCopyMode(page: Page) {
  await page.addInitScript(() => {
    delete (Navigator.prototype as Partial<Navigator>).share;
    delete (Navigator.prototype as Partial<Navigator>).canShare;
  });
}

const ZERMATT_URL = `${site.url}/photos/regions/zermatt`;

test.describe('Share region (18-07; PHOTO-07, D-13)', () => {
  // Only Chromium grants clipboard permissions in Playwright (contact-form.spec.ts),
  // so the real copy is a Chromium row. The page is loaded with a query and a hash:
  // the copied URL is still the bare canonical one (T-18-18, Edge PHOTO-07/encoding).
  test('Copy link writes the bare canonical URL and reads Link copied @chromium-only', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL });
    await forceCopyMode(page);
    await page.goto('/photos/regions/zermatt?x=1#y');
    const button = page
      .locator('[data-region-header]')
      .getByRole('button', { name: 'Copy link to this region' });
    await expect(button).toHaveText('Copy link');
    await waitForHydration(button);

    await button.click();

    await expect(button).toHaveText('Link copied');
    await expect(page.getByRole('status').filter({ hasText: 'Link copied' })).toHaveCount(1);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(ZERMATT_URL);
    await expect(button).toHaveText('Copy link', { timeout: 5000 });
  });

  // The rows below stub the browser APIs through addInitScript, so they run in
  // both local engines (neither ships navigator.share headless, Pitfall 7).

  test('share mode: Share region passes the canonical URL and title to navigator.share', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __shared: ShareData[] };
      w.__shared = [];
      Object.defineProperty(Navigator.prototype, 'share', {
        configurable: true,
        value: (data: ShareData) => {
          w.__shared.push(data);
          return Promise.resolve();
        },
      });
    });
    await page.goto('/photos/regions/zermatt?x=1#y');
    const button = page
      .locator('[data-region-header]')
      .getByRole('button', { name: 'Share region' });
    await expect(button).toHaveText('Share region');
    await waitForHydration(button);

    await button.click();

    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __shared: ShareData[] }).__shared))
      .toEqual([{ title: `${regionHeading(region('zermatt'))} · ${site.name}`, url: ZERMATT_URL }]);
    await expect(button).toHaveText('Share region');
    await expect(page.locator('[data-share-failure]')).toHaveCount(0);
  });

  test('share mode: a cancelled sheet (AbortError) leaves Share region and no failure line', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __shareCalls: number };
      w.__shareCalls = 0;
      Object.defineProperty(Navigator.prototype, 'share', {
        configurable: true,
        value: () => {
          w.__shareCalls += 1;
          return Promise.reject(new DOMException('Share canceled', 'AbortError'));
        },
      });
    });
    await page.goto('/photos/regions/zermatt');
    const button = page
      .locator('[data-region-header]')
      .getByRole('button', { name: 'Share region' });
    await waitForHydration(button);

    await button.click();

    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __shareCalls: number }).__shareCalls))
      .toBe(1);
    await expect(button).toHaveText('Share region');
    await expect(page.locator('[data-share-failure]')).toHaveCount(0);
    await expect(page.locator('[data-region-header] [role="status"]')).toHaveText('');
  });

  test('copy failure: the URL shows under the button, selected, with the failure status', async ({
    page,
  }) => {
    await forceCopyMode(page);
    await page.addInitScript(() => {
      Object.defineProperty(Clipboard.prototype, 'writeText', {
        configurable: true,
        value: () => Promise.reject(new DOMException('Write denied', 'NotAllowedError')),
      });
    });
    await page.goto('/photos/regions/zermatt?x=1#y');
    const button = page
      .locator('[data-region-header]')
      .getByRole('button', { name: 'Copy link to this region' });
    await waitForHydration(button);

    await button.click();

    const line = page.locator('[data-region-header] [data-share-failure]');
    await expect(line).toHaveText(`Couldn't copy the link. It's selected here: ${ZERMATT_URL}`);
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString()))
      .toBe(ZERMATT_URL);
    await expect(page.locator('[data-region-header] [role="status"]')).toHaveText(
      "Couldn't copy the link. It's selected below."
    );
    await expect(button).toHaveText('Copy link');
  });

  // Post-plan fix (Tim-approved, 2026-11-25): the failure note takes a full-width
  // row at the bottom of the band, so the band only grows downward. Every box
  // above it keeps its page position to < 1 px, the row spans the band's
  // content width, and the URL is one line wherever the row is wide enough.
  for (const [width, height] of [
    [1440, 900],
    [768, 1024],
    [375, 812],
  ] as const) {
    test(`copy failure at ${width}: the note takes a full-width row under the band and nothing above it moves`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await forceCopyMode(page);
      await page.addInitScript(() => {
        Object.defineProperty(Clipboard.prototype, 'writeText', {
          configurable: true,
          value: () => Promise.reject(new DOMException('Write denied', 'NotAllowedError')),
        });
      });
      await page.goto('/photos/regions/zermatt');
      const band = page.locator('[data-region-header]');
      const button = band.getByRole('button', { name: 'Copy link to this region' });
      await waitForHydration(button);
      await page.evaluate(() => document.fonts.ready);

      const parts = {
        band: '[data-region-header]',
        breadcrumb: '[data-region-header] nav[aria-label="Breadcrumb"]',
        h1: '[data-region-header] h1',
        facts: '[data-region-header] [data-facts-line]',
        button: '[data-region-header] button',
      };
      /** Page-relative boxes, so a scroll can't pass for a shift. */
      const boxes = () =>
        page.evaluate((sel) => {
          const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
          for (const [k, s] of Object.entries(sel)) {
            const r = document.querySelector(s)!.getBoundingClientRect();
            out[k] = { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
          }
          return out;
        }, parts);

      const before = await boxes();
      await button.click();
      const line = band.locator('[data-share-failure]');
      await expect(line).toHaveText(`Couldn't copy the link. It's selected here: ${ZERMATT_URL}`);
      const after = await boxes();

      for (const k of ['breadcrumb', 'h1', 'facts', 'button'] as const) {
        for (const d of ['x', 'y', 'w', 'h'] as const) {
          expect(
            Math.abs(after[k][d] - before[k][d]),
            `${k}.${d} moved: ${before[k][d]} -> ${after[k][d]}`
          ).toBeLessThan(1);
        }
      }
      expect(Math.abs(after.band.y - before.band.y), 'band top moved').toBeLessThan(1);
      expect(after.band.h, 'the band grows downward').toBeGreaterThan(before.band.h);

      // The row spans the band's content box (the band has no inline padding).
      const row = await line.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const host = el.closest('[data-region-header]')!;
        const b = host.getBoundingClientRect();
        const cs = getComputedStyle(host);
        return {
          x: r.left - b.left,
          w: r.width,
          bandW: b.width,
          bottomGap: b.bottom - r.bottom,
          padAndBorder: parseFloat(cs.paddingBottom) + parseFloat(cs.borderBottomWidth),
        };
      });
      expect(Math.abs(row.x), 'row starts at the band edge').toBeLessThan(1);
      expect(Math.abs(row.w - row.bandW), 'row spans the band').toBeLessThan(1);
      // It is the band's last row: only the band's bottom padding and border lie below it.
      expect(Math.abs(row.bottomGap - row.padAndBorder), 'row is the last row').toBeLessThan(1);

      // The URL's line count: distinct line tops of its inline boxes.
      const urlLines = await line.locator('span').evaluate((el) => {
        const tops = new Set([...el.getClientRects()].map((r) => Math.round(r.top)));
        return tops.size;
      });
      test.info().annotations.push({ type: 'url-lines', description: `${width}: ${urlLines}` });
      if (width >= 768) expect(urlLines, 'the URL is one line').toBe(1);
      await expect
        .poll(() => page.evaluate(() => window.getSelection()?.toString()))
        .toBe(ZERMATT_URL);
    });
  }
});

/** A rect as plain numbers. */
type Rect = { left: number; top: number; right: number; bottom: number };

/** True when two rects share an area (touching edges do not count). */
function intersects(a: Rect, b: Rect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** A figure's image rect, its natural ratio and its tick rects, read from the page. */
async function figureGeometry(item: Locator) {
  return item.evaluate((li) => {
    const img = li.querySelector('img')!;
    const r = img.getBoundingClientRect();
    const rect = (e: Element) => {
      const b = e.getBoundingClientRect();
      return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    };
    return {
      image: rect(img),
      rendered: r.width / r.height,
      natural: img.naturalWidth / img.naturalHeight,
      ticks: [...li.querySelectorAll('[data-figure-tick]')].map(rect),
    };
  });
}

/** Scroll a figure into view and wait until its lazy image has loaded. */
async function loadFigure(item: Locator) {
  await item.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      item.evaluate((li) => {
        const img = li.querySelector('img');
        return !!img && img.complete && img.naturalWidth > 0;
      })
    )
    .toBe(true);
}

test.describe('Region sequence (18-08; REGION-03, REGION-04)', () => {
  test('Zermatt at 1440: the first figure is uncropped and its ticks stay off the image', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/zermatt');
    const band = page.locator('section[data-region-sequence]');
    await expect(band).toHaveCount(1);
    const first = band.locator('li[data-sequence-item]').first();
    await loadFigure(first);
    const g = await figureGeometry(first);
    expect(Math.abs(g.rendered / g.natural - 1), 'rendered vs natural ratio').toBeLessThan(0.01);
    expect(g.ticks).toHaveLength(8);
    for (const tick of g.ticks) expect(intersects(tick, g.image), JSON.stringify(tick)).toBe(false);
  });
});

const WIDTHS = [
  [375, 812],
  [768, 1024],
  [1440, 900],
] as const;

/**
 * An image's srcset check (13 #34): the chosen candidate's width descriptor and
 * the next smaller one in the same set, the rendered CSS width, the device
 * pixel ratio, and the decoded file's own pixel width.
 */
async function srcsetFit(img: Locator) {
  return img.evaluate(async (el: HTMLImageElement) => {
    const current = el.currentSrc;
    const sources = [...(el.closest('picture')?.querySelectorAll('source') ?? [])];
    const sets = sources.map((source) =>
      source.srcset.split(',').map((entry) => {
        const [url, w] = entry.trim().split(/\s+/);
        return { href: new URL(url, location.href).href, w: parseInt(w, 10) };
      })
    );
    const set = sets.find((s) => s.some((c) => c.href === current)) ?? [];
    const chosen = set.find((c) => c.href === current);
    const smaller = set.filter((c) => chosen && c.w < chosen.w).map((c) => c.w);
    /** The painted width: under object-fit contain, the image inside its box. */
    function contained(img: HTMLImageElement) {
      const r = img.getBoundingClientRect();
      if (getComputedStyle(img).objectFit !== 'contain') return r.width;
      return Math.min(r.width, (r.height * img.naturalWidth) / img.naturalHeight);
    }
    const probe = new Image();
    probe.src = current;
    await probe.decode();
    return {
      current,
      descriptor: chosen?.w ?? 0,
      nextSmaller: smaller.length > 0 ? Math.max(...smaller) : 0,
      rendered: contained(el),
      dpr: window.devicePixelRatio,
      filePx: probe.naturalWidth,
    };
  });
}

/** The srcset assertions for one image: descriptor, next smaller candidate, decoded width. */
function expectFit(fit: Awaited<ReturnType<typeof srcsetFit>>, what: string) {
  const need = fit.rendered * fit.dpr;
  expect(fit.descriptor, `${what}: ${fit.current} is a srcset candidate`).toBeGreaterThan(0);
  expect(fit.descriptor, `${what}: the descriptor covers ${need} px`).toBeGreaterThanOrEqual(need);
  expect(fit.nextSmaller, `${what}: the next smaller candidate would not`).toBeLessThan(need);
  expect(fit.filePx, `${what}: the file is at least ${need} px wide`).toBeGreaterThanOrEqual(
    Math.floor(need)
  );
}

test.describe('Region sequence at 375, 768 and 1440 (18-08; REGION-03, REGION-04, D-07, 13 #34)', () => {
  for (const r of regions) {
    for (const [width, height] of WIDTHS) {
      test(`/photos/regions/${r.id} at ${width}: no overflow; every figure uncropped, ticks off the image, sized right`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        await page.goto(`/photos/regions/${r.id}`);
        const views = regionPhotoViews(r.id);
        const items = page.locator('section[data-region-sequence] li[data-sequence-item]');
        await expect(items).toHaveCount(views.length);
        expect(
          await items.evaluateAll((els) => els.map((e) => e.getAttribute('data-sequence-item')))
        ).toEqual(views.map((v) => v.slug));
        await expect(page.locator('[data-sequence-count]')).toHaveText(
          `${views.length} ${views.length === 1 ? 'photograph' : 'photographs'}, lowest first`
        );

        for (let i = 0; i < views.length; i++) {
          const item = items.nth(i);
          await loadFigure(item);
          const g = await figureGeometry(item);
          const name = `${views[i].slug} at ${width}`;
          expect(Math.abs(g.rendered / g.natural - 1), `${name}: ratio`).toBeLessThan(0.01);
          expect(g.ticks, name).toHaveLength(8);
          // The page's own width: the full-bleed band (a stable scrollbar gutter is not page).
          const pageRight = await page
            .locator('section[data-region-sequence]')
            .evaluate((el) => el.getBoundingClientRect().right);
          for (const tick of g.ticks) {
            expect(intersects(tick, g.image), `${name}: tick ${JSON.stringify(tick)}`).toBe(false);
            expect(tick.left, `${name}: tick inside the page`).toBeGreaterThanOrEqual(0);
            expect(tick.right, `${name}: tick inside the page`).toBeLessThanOrEqual(pageRight);
          }
          // The caption is visible without hover; 'n / N' shows only below 768 px (D-07).
          const title = item.locator('figcaption p').first();
          await expect(title).toBeVisible();
          await expect(title).toHaveText(views[i].title);
          const counter = item.locator('[data-figure-counter]');
          if (width < 768) await expect(counter).toBeVisible();
          else await expect(counter).toBeHidden();
          expectFit(await srcsetFit(item.locator('img')), name);
        }

        const overflow = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        expect(overflow.scroll, 'no sideways overflow').toBeLessThanOrEqual(overflow.client);
        // The rail column sits beside the photo column from 768 px (18-12 fills it).
        const rail = page.locator('[data-region-rail-column]');
        if (width < 768) await expect(rail).toBeHidden();
        else expect((await rail.boundingBox())?.width).toBe(96);
      });
    }
  }
});

/**
 * photos.spec's Grid view describe, rewritten onto the Zermatt region page (18-21;
 * PHOTO-06), one row per old row. The grid's per-size true-ratio rows (768 x 900 and
 * 1440 x 900) have no row here: their property is the ratio check of 'Region sequence at
 * 375, 768 and 1440' above, at the same widths, on every Zermatt figure.
 */
test.describe('Grid view rewritten: the Zermatt sequence (PHOTO-06)', () => {
  const series = regionPhotoViews('zermatt');
  const LIST = `${region('zermatt').name} photographs, lowest first`;
  const DERIVATIVE = /^\/images\/photos\/[a-z0-9-]+\.[0-9a-f]{10}\.(avif|webp)$/;
  const list = (page: Page) => page.getByRole('list', { name: LIST, exact: true });

  test('the Zermatt sequence lists its photos in regionPhotoViews order with their photo hrefs', async ({
    page,
  }) => {
    await page.goto('/photos/regions/zermatt');
    const links = list(page).getByRole('link');
    await expect(links).toHaveCount(series.length);
    for (const [i, view] of series.entries()) {
      // The link's name is the alt plus the action, so the image's text is in the name.
      await expect(links.nth(i)).toHaveAccessibleName(`${view.alt}, open in the photo viewer`);
      await expect(links.nth(i)).toHaveAttribute('href', `/photos/${view.slug}`);
      await expect(links.nth(i)).toHaveAttribute('data-photo-id', view.slug);
      await expect(list(page).getByRole('listitem').nth(i)).toHaveAttribute(
        'data-sequence-item',
        view.slug
      );
    }
  });

  test('at 375 x 800 the Zermatt sequence is one column with no horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/photos/regions/zermatt');
    const items = list(page).getByRole('listitem');
    await expect(items).toHaveCount(series.length);
    const xs = await items.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().left));
    for (const x of xs) expect(Math.abs(x - xs[0])).toBeLessThanOrEqual(1);
    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('every Zermatt sequence image is a content-hashed manifest derivative', async ({ page }) => {
    await page.goto('/photos/regions/zermatt');
    const imgs = list(page).locator('img');
    await expect(imgs).toHaveCount(series.length);
    for (const [i, view] of series.entries()) {
      const img = imgs.nth(i);
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveAttribute('alt', view.alt);
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
        .toBe(true);
      const currentSrc = await img.evaluate(
        (el: HTMLImageElement) => new URL(el.currentSrc).pathname
      );
      expect(currentSrc, view.slug).toMatch(DERIVATIVE);
    }
  });

  test('clicking the first Zermatt figure opens its photo in the lightbox (LBOX-01)', async ({
    page,
  }) => {
    await page.goto('/photos/regions/zermatt');
    const first = series[0];
    const link = list(page).getByRole('link').first();
    await expect(link).toHaveAttribute('data-photo-id', first.slug);
    // Before hydration a click is a document navigation, which is never intercepted.
    await waitForHydration(link);
    await link.click();
    const dialog = page.getByRole('dialog');
    // The dev server compiles the intercepted route on its first request.
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(first.title);
  });
});

test.describe('Region header slot (18-08; D-05, UI E3)', () => {
  for (const r of regions) {
    for (const [width, height] of WIDTHS) {
      test(`/photos/regions/${r.id} at ${width}: the cover, eager and uncropped, over a fixed caption row`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        await page.goto(`/photos/regions/${r.id}`);
        const cover = regionCover(r.id);
        const slot = page.locator('[data-region-header-slot]');
        await expect(slot).toHaveCount(1);
        const img = slot.locator('img');
        await expect(img).toHaveAttribute('alt', '');
        await expect(img).toHaveAttribute('loading', 'eager');
        await expect(img).toHaveAttribute('fetchpriority', 'high');
        await expect
          .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
          .toBe(true);

        const box = await slot.evaluate((el) => {
          const b = el.getBoundingClientRect();
          const names = [el, ...el.querySelectorAll('*')].map(
            (n) => getComputedStyle(n).getPropertyValue('view-transition-name') || 'none'
          );
          return {
            left: b.left,
            width: b.width,
            ratio: b.width / b.height,
            // The page's own width: the full-bleed sequence band (Chromium's stable
            // scrollbar gutter is in documentElement.clientWidth but not in the page).
            client: document.querySelector('section[data-region-sequence]')!.getBoundingClientRect()
              .width,
            names: [...new Set(names)],
            fit: getComputedStyle(el.querySelector('img')!).objectFit,
          };
        });
        expect(Math.abs(box.ratio / (16 / 9) - 1), '16:9 box').toBeLessThan(0.01);
        expect(box.fit).toBe('contain');
        expect(box.names, 'the cover never carries a view-transition name').toEqual(['none']);
        if (width < 640) {
          expect(Math.abs(box.left), 'full-bleed on phones').toBeLessThan(1);
          expect(Math.abs(box.width - box.client), 'full-bleed on phones').toBeLessThan(1);
        }
        expectFit(await srcsetFit(img), `${r.id} cover at ${width}`);

        // The caption row: '{cover title} · {altitude}', h-11, at most two lines, an empty 44 px slot.
        const row = page.locator('[data-header-caption]');
        await expect(row.locator('p')).toHaveText(`${cover.title} · ${cover.altitudeLabel}`);
        const fit = await row.evaluate((el) => {
          const p = el.querySelector('p')!;
          const lineHeight = parseFloat(getComputedStyle(p).lineHeight);
          return {
            height: el.getBoundingClientRect().height,
            scroll: el.scrollHeight,
            client: el.clientHeight,
            lines: Math.round(p.getBoundingClientRect().height / lineHeight),
          };
        });
        expect(fit.height).toBe(44);
        expect(fit.scroll, 'the caption row does not overflow').toBeLessThanOrEqual(fit.client);
        expect(fit.lines, 'the caption row holds at most two lines').toBeLessThanOrEqual(2);
        const control = row.locator('[data-header-control]');
        await expect(control).toHaveAttribute('aria-hidden', 'true');
        expect(await control.evaluate((el) => el.childElementCount)).toBe(0);
        const size = await control.boundingBox();
        expect([size?.width, size?.height]).toEqual([44, 44]);
      });
    }
  }
});

/** The region's photos that have a position, in sequence order: one plate pin each. */
const pinnedViews = (id: string) => regionPhotoViews(id).filter((v) => v.uv);

test.describe('Region plate pins (18-09; REGION-02)', () => {
  for (const r of regions) {
    test(`/photos/regions/${r.id}: one badge per photo with a position, numbered 1..N in sequence order`, async ({
      page,
    }) => {
      await page.goto(`/photos/regions/${r.id}`);
      const views = regionPhotoViews(r.id);
      const pinned = pinnedViews(r.id);
      const sheet = page.locator(`[data-plate-sheet="${r.id}"]`);
      await expect(sheet).toBeVisible();
      const badges = sheet.locator('[data-plate-badge]');
      await expect(badges).toHaveCount(pinned.length);
      // In sequence order, each badge reads its photo's place in the ascent.
      const texts = await Promise.all(
        pinned.map((v) => sheet.locator(`[data-plate-badge="${v.slug}"]`).textContent())
      );
      expect(texts).toEqual(pinned.map((v) => String(views.indexOf(v) + 1)));
      // Each badge jumps to its figure in the sequence (D-08), which exists.
      for (const v of pinned) {
        await expect(sheet.locator(`[data-plate-badge="${v.slug}"]`)).toHaveAttribute(
          'href',
          `#photo-${v.slug}`
        );
        await expect(page.locator(`li#photo-${v.slug}`)).toHaveCount(1);
      }
      await expect(page.getByRole('heading', { level: 2, name: 'Map', exact: true })).toBeVisible();
    });

    test(`/photos/regions/${r.id}: approximate photos draw hollow dashed badges and dots; badges are pointer-only`, async ({
      page,
    }) => {
      await page.goto(`/photos/regions/${r.id}`);
      const sheet = page.locator(`[data-plate-sheet="${r.id}"]`);
      for (const v of pinnedViews(r.id)) {
        const badge = sheet.locator(`[data-plate-badge="${v.slug}"]`);
        const style = await badge.evaluate((el) => {
          const s = getComputedStyle(el);
          return { border: s.borderTopStyle, width: s.borderTopWidth };
        });
        // Contract 5 / 08 D-02: precision is shown by shape, not colour.
        // (Preflight gives every element a solid 0 px border, so an exact badge reads 0 px.)
        expect(style.border === 'dashed', `${v.slug} badge dashed`).toBe(v.approximate);
        expect(style.width, `${v.slug} badge border width`).toBe(v.approximate ? '2px' : '0px');
        await expect(badge).toHaveAttribute('tabindex', '-1');
        await expect(badge).toHaveAttribute('aria-hidden', 'true');
        // Its dot (shared or not) is hollow only when every photo at it is approximate.
        const dotDashed = await badge.evaluate((el) => {
          const dot = el.closest('[data-plate-pin]')!.querySelector('[data-plate-dot]')!;
          return getComputedStyle(dot).borderTopStyle === 'dashed';
        });
        const pin = await badge.evaluate((el) =>
          [...el.closest('[data-plate-pin]')!.querySelectorAll('[data-plate-badge]')].map((b) =>
            b.getAttribute('data-plate-badge')
          )
        );
        const atDot = pinnedViews(r.id).filter((x) => pin.includes(x.slug));
        expect(dotDashed, `${v.slug} dot`).toBe(atDot.every((x) => x.approximate));
      }
    });

    // @needs-tab-to-links: the walk Tabs through the page's links to pass the
    // plate, which WebKit off Linux never does (Safari's default); Linux WebKit
    // (CI) runs it.
    test(`/photos/regions/${r.id}: nothing inside the plate is reachable by Tab @needs-tab-to-links`, async ({
      page,
    }) => {
      await page.goto(`/photos/regions/${r.id}`);
      const states: string[] = [];
      for (let i = 0; i < 120; i++) {
        await page.keyboard.press('Tab');
        const where = await page.evaluate(() => {
          const sheet = document.querySelector('[data-plate-sheet]')!;
          const a = document.activeElement;
          if (!a || a === document.body) return 'body';
          if (sheet.contains(a)) return 'inside';
          return sheet.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING
            ? 'after'
            : 'before';
        });
        states.push(where);
        if (where === 'after') break;
      }
      expect(states).not.toContain('inside');
      expect(states[states.length - 1], 'Tab walked past the plate').toBe('after');
    });

    for (const [width, height] of WIDTHS) {
      test(`/photos/regions/${r.id} at ${width}: every badge 8 px inside the sheet, no two closer than 8 px, leaders end at their dots`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        await page.goto(`/photos/regions/${r.id}`);
        const sheet = page.locator(`[data-plate-sheet="${r.id}"]`);
        await sheet.scrollIntoViewIfNeeded();
        const g = await sheet.evaluate((el) => {
          const box = (e: Element) => {
            const b = e.getBoundingClientRect();
            return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
          };
          return {
            sheet: box(el),
            badges: [...el.querySelectorAll('[data-plate-badge]')].map((b) => ({
              slug: b.getAttribute('data-plate-badge')!,
              ...box(b),
            })),
            pins: [...el.querySelectorAll('[data-plate-pin]')].map((p) => {
              const leader = p.querySelector('[data-plate-leader]')!;
              const shown = getComputedStyle(leader).display !== 'none';
              return {
                key: p.getAttribute('data-plate-pin')!,
                dot: box(p.querySelector('[data-plate-dot]')!),
                unit: box(p.querySelector('[data-plate-unit]')!),
                leader: shown ? box(leader) : null,
              };
            }),
          };
        });
        const name = `${r.id} at ${width}`;
        expect(g.badges).toHaveLength(pinnedViews(r.id).length);
        for (const b of g.badges) {
          expect(b.right - b.left, `${name} ${b.slug} width`).toBeCloseTo(24, 0);
          expect(b.left - g.sheet.left, `${name} ${b.slug} left`).toBeGreaterThanOrEqual(7.5);
          expect(b.top - g.sheet.top, `${name} ${b.slug} top`).toBeGreaterThanOrEqual(7.5);
          expect(g.sheet.right - b.right, `${name} ${b.slug} right`).toBeGreaterThanOrEqual(7.5);
          expect(g.sheet.bottom - b.bottom, `${name} ${b.slug} bottom`).toBeGreaterThanOrEqual(7.5);
        }
        for (let i = 0; i < g.badges.length; i++) {
          for (let j = i + 1; j < g.badges.length; j++) {
            const a = g.badges[i];
            const b = g.badges[j];
            const gap = Math.max(
              b.left - a.right,
              a.left - b.right,
              b.top - a.bottom,
              a.top - b.bottom
            );
            expect(gap, `${name} ${a.slug}/${b.slug}`).toBeGreaterThanOrEqual(7.5);
          }
        }
        for (const p of g.pins) {
          if (!p.leader) continue;
          // The leader box runs from the dot centre to the badge unit's centre.
          const dot = { x: (p.dot.left + p.dot.right) / 2, y: (p.dot.top + p.dot.bottom) / 2 };
          const unit = { x: (p.unit.left + p.unit.right) / 2, y: (p.unit.top + p.unit.bottom) / 2 };
          const xs = [p.leader.left, p.leader.right];
          const ys = [p.leader.top, p.leader.bottom];
          const near = (v: number, ends: number[]) => Math.min(...ends.map((e) => Math.abs(e - v)));
          expect(near(dot.x, xs), `${name} ${p.key} leader x at the dot`).toBeLessThan(1.5);
          expect(near(dot.y, ys), `${name} ${p.key} leader y at the dot`).toBeLessThan(1.5);
          expect(near(unit.x, xs), `${name} ${p.key} leader x at the unit`).toBeLessThan(1.5);
          expect(near(unit.y, ys), `${name} ${p.key} leader y at the unit`).toBeLessThan(1.5);
        }
      });
    }
  }
});

/** A rect's edges, from the page (viewport coordinates). */
async function rectOf(target: Locator) {
  return target.evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
  });
}

/**
 * After a jump to `slug`: the URL hash names it, no dialog opened, the figure's
 * top collar sits 16 px (within 2) under the nav, and the next Tab focuses
 * that figure's photo link (D-08; UI-SPEC "Jump to a figure").
 */
async function expectLanded(page: Page, slug: string) {
  await expect(page).toHaveURL(new RegExp(`/photos/regions/zermatt#photo-${slug}$`));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const collar = page.locator(`li#photo-${slug} [data-figure-collar]`);
  const navBottom = (await rectOf(page.getByRole('banner'))).bottom;
  await expect
    .poll(async () => Math.round((await rectOf(collar)).top - navBottom), {
      message: `${slug}: the top collar 16 px under the nav`,
    })
    .toBeGreaterThanOrEqual(14);
  expect((await rectOf(collar)).top - navBottom).toBeLessThanOrEqual(18);
  await page.keyboard.press('Tab');
  await expect(page.locator(`li#photo-${slug} [data-photo-id="${slug}"]`)).toBeFocused();
}

const KEY_LIST = 'ol[aria-label="Photographs on the map, lowest first"]';

/** A colour token as the browser computes it (rgb()), through a probe element. */
async function colourOf(page: Page, token: string) {
  return page.evaluate((t) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${t})`;
    document.body.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, token);
}

test.describe('Region plate key and jumps (18-10; REGION-02, D-08)', () => {
  for (const r of regions) {
    test(`/photos/regions/${r.id}: the key list has one anchor row per pin, in sequence order`, async ({
      page,
    }) => {
      await page.goto(`/photos/regions/${r.id}`);
      const views = regionPhotoViews(r.id);
      const pinned = pinnedViews(r.id);
      const rows = page.locator(`${KEY_LIST} [data-key-row]`);
      await expect(rows).toHaveCount(pinned.length);
      expect(
        await rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-key-row')))
      ).toEqual(pinned.map((v) => v.slug));
      for (const [i, v] of pinned.entries()) {
        const row = rows.nth(i);
        await expect(row).toHaveAttribute('href', `#photo-${v.slug}`);
        // The badge is aria-hidden: the row's name is the title and the altitude label.
        await expect(row.locator('[data-key-badge]')).toHaveText(String(views.indexOf(v) + 1));
        await expect(row.locator('[data-key-badge]')).toHaveAttribute('aria-hidden', 'true');
        await expect(row).toHaveAccessibleName(`${v.title} · ${v.altitudeLabel}`);
        // UI E4/overflow: a 44 px row whose title wraps.
        expect((await rectOf(row)).bottom - (await rectOf(row)).top).toBeGreaterThanOrEqual(43.5);
      }
      // The h2 'Map' comes right before the key list.
      const before = await page
        .locator(KEY_LIST)
        .evaluate((el) => el.previousElementSibling?.textContent);
      expect(before).toBe('Map');
    });
  }

  // @needs-tab-to-links: WebKit off Linux skips links on Tab (Safari's default); each
  // row ends at toBeFocused() after a Tab onto a figure link or key row (18-14 deferred item).
  test('at 1440 clicking key row 3 lands its figure under the nav, opens no dialog, and Tab reaches its photo @needs-tab-to-links', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/zermatt');
    const third = pinnedViews('zermatt')[2];
    await page.locator(`${KEY_LIST} [data-key-row]`).nth(2).click();
    await expectLanded(page, third.slug);
  });

  test('at 1024 the key list lies left of the plate; the DOM order is Facts, plate, key list', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/photos/regions/zermatt');
    const sheet = await rectOf(page.locator('[data-plate-sheet="zermatt"]'));
    const key = await rectOf(page.locator(KEY_LIST));
    const facts = await rectOf(page.getByRole('heading', { level: 2, name: 'Facts', exact: true }));
    expect(key.right, 'the key list ends left of the plate').toBeLessThanOrEqual(sheet.left);
    expect(facts.right, 'the facts end left of the plate').toBeLessThanOrEqual(sheet.left);
    expect(key.top, 'the key list follows the facts').toBeGreaterThan(facts.bottom);
    const order = await page.evaluate((list) => {
      const nodes = [
        document.getElementById('region-facts')!,
        document.querySelector('[data-plate-sheet]')!,
        document.querySelector(list)!,
      ];
      return nodes.every(
        (n, i) =>
          i === 0 || !!(nodes[i - 1].compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING)
      );
    }, KEY_LIST);
    expect(order, 'Facts, plate, key list in DOM order').toBe(true);
  });

  test('at 1440 the plate is the 3fr column, 634 px square', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/zermatt');
    const sheet = await rectOf(page.locator('[data-plate-sheet="zermatt"]'));
    expect(sheet.right - sheet.left).toBeCloseTo(633.6, 0);
    expect(sheet.bottom - sheet.top).toBeCloseTo(633.6, 0);
  });

  // @needs-tab-to-links: WebKit off Linux skips links on Tab (Safari's default); each
  // row ends at toBeFocused() after a Tab onto a figure link or key row (18-14 deferred item).
  test('at 1440 a badge click lands like a key row: under the nav, no dialog, an ink neatline @needs-tab-to-links', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/zermatt');
    const third = pinnedViews('zermatt')[2];
    await page.locator(`[data-plate-badge="${third.slug}"]`).click();
    // Off the photo, so its hover ring does not stand in for the arrival cue.
    await page.mouse.move(2, 2);
    await expectLanded(page, third.slug);
    // The arrival cue (:target): the neatline ring reads ink.
    const ink = await colourOf(page, '--color-ink');
    await expect
      .poll(() =>
        page
          .locator(`li#photo-${third.slug} [data-neatline]`)
          .evaluate((el) => getComputedStyle(el).boxShadow)
      )
      .toContain(ink);
  });

  test('hovering key row 2 marks its badge accent; hovering a badge marks its row', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/zermatt');
    const accent = await colourOf(page, '--color-accent');
    const overlay = await colourOf(page, '--color-surface-overlay');
    const [, second, third] = pinnedViews('zermatt');
    const row = page.locator(`${KEY_LIST} [data-key-row="${second.slug}"]`);
    const badge = page.locator(`[data-plate-badge="${second.slug}"]`);
    const bg = (target: Locator) => target.evaluate((el) => getComputedStyle(el).backgroundColor);
    const bar = (target: Locator) =>
      target.evaluate((el) => {
        const s = getComputedStyle(el, '::before');
        return `${s.content} ${s.width} ${s.backgroundColor}`;
      });

    await row.hover();
    await expect.poll(() => bg(badge)).toBe(accent);
    await expect.poll(() => bg(row.locator('[data-key-badge]'))).toBe(accent);
    await expect.poll(() => bar(row)).toBe(`"" 2px ${accent}`);
    // Only the hovered pair: the next photo's badge keeps its own look.
    expect(await bg(page.locator(`[data-plate-badge="${third.slug}"]`))).not.toBe(accent);

    await page.mouse.move(2, 2);
    await expect.poll(() => bg(badge)).not.toBe(accent);
    await badge.hover();
    await expect.poll(() => bg(row)).toBe(overlay);
    await expect.poll(() => bar(row)).toBe(`"" 2px ${accent}`);
    await expect.poll(() => bg(row.locator('[data-key-badge]'))).toBe(accent);
    await expect.poll(() => bg(badge)).toBe(accent);
  });

  // @needs-tab-to-links: WebKit off Linux skips links on Tab (Safari's default); each
  // row ends at toBeFocused() after a Tab onto a figure link or key row (18-14 deferred item).
  test('a focus-visible key row marks its plate badge accent @needs-tab-to-links', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/zermatt');
    const accent = await colourOf(page, '--color-accent');
    const first = pinnedViews('zermatt')[0];
    const row = page.locator(`${KEY_LIST} [data-key-row="${first.slug}"]`);
    await row.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(row).toBeFocused();
    await expect
      .poll(() =>
        page
          .locator(`[data-plate-badge="${first.slug}"]`)
          .evaluate((el) => getComputedStyle(el).backgroundColor)
      )
      .toBe(accent);
  });

  // @needs-tab-to-links: WebKit off Linux skips links on Tab (Safari's default).
  test('the Tab path never stops on a badge and reaches the key rows in order @needs-tab-to-links', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/zermatt');
    const pinned = pinnedViews('zermatt');
    const seen: string[] = [];
    for (let i = 0; i < 200 && seen.length < pinned.length; i++) {
      await page.keyboard.press('Tab');
      const at = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a) return null;
        if (a.hasAttribute('data-plate-badge')) return 'badge';
        return a.getAttribute('data-key-row');
      });
      expect(at, 'Tab stopped on a plate badge').not.toBe('badge');
      if (at) seen.push(at);
    }
    expect(seen).toEqual(pinned.map((v) => v.slug));
  });

  // @needs-tab-to-links: WebKit off Linux skips links on Tab (Safari's default); each
  // row ends at toBeFocused() after a Tab onto a figure link or key row (18-14 deferred item).
  test('under reduced motion a key-row jump is instant (scrollY settled at the first read) @needs-tab-to-links', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/zermatt');
    const last = pinnedViews('zermatt').at(-1)!;
    await page.locator(`${KEY_LIST} [data-key-row="${last.slug}"]`).click();
    const first = await page.evaluate(() => window.scrollY);
    const later = await page.evaluate(
      () =>
        new Promise<number>((done) =>
          setTimeout(() => requestAnimationFrame(() => done(window.scrollY)), 300)
        )
    );
    expect(first).toBeGreaterThan(0);
    expect(later).toBe(first);
    await expectLanded(page, last.slug);
  });
});

/** The plate figure's sheet margin: the figcaption of the figure holding the sheet. */
const plateMargin = (page: Page, id: string) =>
  page.locator(`figure:has(> [data-plate-sheet="${id}"]) > figcaption[data-sheet-margin]`);

test.describe('Region plate margin (18-11; REGION-06, D-16..D-19)', () => {
  test('Zermatt: the plate margin titles the sheet, keeps Extent (LV95) and links its credit', async ({
    page,
  }) => {
    await page.goto('/photos/regions/zermatt');
    const margin = plateMargin(page, 'zermatt');
    await expect(margin).toHaveCount(1);
    await expect(margin.locator('p').first()).toHaveText(
      'Zermatt – Matterhorn · contours every 100 m'
    );
    const terms = await margin.locator('dt').allTextContents();
    expect(terms).toEqual(['Extent (LV95)', 'Last surveyed', 'Source']);
    await expect(margin.locator('dd').nth(0)).toHaveText(
      'SW 2’616’000, 1’088’000 · NE 2’627’000, 1’099’000'
    );
    await expect(margin.locator('dd').nth(1)).toHaveText('May 2026');
    const credit = margin.locator('dd').nth(2).getByRole('link');
    await expect(credit).toHaveText('swissALTIRegio, swisstopo');
    await expect(credit).toHaveAttribute('href', '/sources#swissaltiregio');
  });

  test('following the Zermatt credit lands on /sources with the swissALTIRegio entry in view', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/zermatt');
    const credit = plateMargin(page, 'zermatt').getByRole('link', {
      name: 'swissALTIRegio, swisstopo',
    });
    await waitForHydration(credit);
    await credit.click();
    await expect(page).toHaveURL(/\/sources#swissaltiregio$/);
    await expect(
      page.getByRole('heading', { level: 2, name: 'swissALTIRegio', exact: true })
    ).toBeInViewport();
  });

  // D-19: the sheets outside Switzerland print WGS84 corners at 4 decimals (Ortler via
  // lv95ToWgs84, Saalfelden from the build's corners); D-17, D-18: their own edition
  // and credit.
  const WGS84_MARGINS = [
    {
      id: 'ortler',
      title: 'Ortler',
      edition: 'May 2026',
      credit: 'swissALTIRegio, swisstopo',
      href: '/sources#swissaltiregio',
    },
    {
      id: 'saalfelden',
      title: 'Saalfelden',
      edition: 'Sep 2025',
      credit: 'ALS DTM, BEV, CC BY 4.0',
      href: '/sources#bev-als-dtm',
    },
  ] as const;
  for (const w of WGS84_MARGINS) {
    test(`${w.id}: the plate margin prints Extent in WGS84, ${w.edition} and links ${w.href}`, async ({
      page,
    }) => {
      await page.goto(`/photos/regions/${w.id}`);
      const margin = plateMargin(page, w.id);
      await expect(margin.locator('p').first()).toHaveText(`${w.title} · contours every 100 m`);
      expect(await margin.locator('dt').allTextContents()).toEqual([
        'Extent',
        'Last surveyed',
        'Source',
      ]);
      const corners = margin.locator('dd').nth(0).locator('span');
      await expect(corners).toHaveCount(2);
      const parts = (await corners.allTextContents()).map((t) => t.replace(/\s+/g, ' '));
      expect(parts[0]).toMatch(/^SW \d{2}\.\d{4} N \d{2}\.\d{4} E$/);
      expect(parts[1]).toMatch(/^NE \d{2}\.\d{4} N \d{2}\.\d{4} E$/);
      await expect(margin.locator('dd').nth(1)).toHaveText(w.edition);
      const credit = margin.locator('dd').nth(2).getByRole('link');
      await expect(credit).toHaveText(w.credit);
      await expect(credit).toHaveAttribute('href', w.href);
    });
  }

  // UI E9/overflow, Edge REGION-06/adjacency: at 375 the margin causes no sideways
  // scroll and a line breaks only between the nowrap units.
  for (const r of regions) {
    test(`/photos/regions/${r.id} at 375: the margin fits and every unit stays on one line`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`/photos/regions/${r.id}`);
      const margin = plateMargin(page, r.id);
      await expect(margin).toBeVisible();
      const fit = await margin.evaluate((el) => {
        // The text box: the figcaption itself spans the full-bleed figure, its padding the gutters.
        const box = el.querySelector('dl')!.getBoundingClientRect();
        const units = [...el.querySelectorAll('dd span')].map((u) => {
          const rects = u.getClientRects();
          const b = u.getBoundingClientRect();
          return { lines: rects.length, right: b.right, left: b.left };
        });
        return {
          left: box.left,
          right: box.right,
          scroll: document.documentElement.scrollWidth,
          width: document.documentElement.clientWidth,
          units,
        };
      });
      expect(fit.scroll, 'no horizontal scroll').toBeLessThanOrEqual(fit.width);
      // The container's 16 px gutters under the full-bleed sheet.
      expect(fit.left).toBeGreaterThanOrEqual(16);
      expect(fit.right).toBeLessThanOrEqual(375 - 16);
      expect(fit.units.length).toBe(2);
      for (const u of fit.units) {
        expect(u.lines, 'a corner never wraps inside').toBe(1);
        expect(u.right).toBeLessThanOrEqual(375 - 16);
      }
    });
  }
});

test.describe('Region plate jumps without JavaScript (18-10; UI E4 no-JS)', () => {
  test.use({ javaScriptEnabled: false });

  // @needs-tab-to-links: WebKit off Linux skips links on Tab (Safari's default); each
  // row ends at toBeFocused() after a Tab onto a figure link or key row (18-14 deferred item).
  test('a key row jump works with JavaScript off @needs-tab-to-links', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/zermatt');
    const third = pinnedViews('zermatt')[2];
    await page.locator(`${KEY_LIST} [data-key-row="${third.slug}"]`).click();
    await expectLanded(page, third.slug);
  });
});

test.describe('Region page scroll and morph (18-08; D-06, LBOX-06, P4)', () => {
  for (const [width, height] of [
    [375, 812],
    [1440, 900],
  ] as const) {
    test(`D-06: after scrolling 2,000 px on Zermatt at ${width} the nav is still at the top`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/photos/regions/zermatt');
      const nav = page.getByRole('banner');
      await page.evaluate(() => window.scrollTo(0, 2000));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(2000);
      // A hide-on-scroll nav would react to the scroll event; give it two frames.
      await page.evaluate(
        () =>
          new Promise<void>((done) =>
            requestAnimationFrame(() => requestAnimationFrame(() => done()))
          )
      );
      await expect(nav).toBeVisible();
      expect(Math.abs((await nav.boundingBox())!.y), 'the nav top is at 0').toBeLessThan(1);
    });
  }

  const first = regionPhotoViews('zermatt')[0];
  const morphPseudos = [
    `::view-transition-group(photo-${first.slug})`,
    `::view-transition-old(photo-${first.slug})`,
    `::view-transition-new(photo-${first.slug})`,
  ];

  test('opening the first figure morphs it into the lightbox photo @prod-only @chromium-only', async ({
    page,
  }) => {
    const messages: string[] = [];
    page.on('console', (message) => {
      // The browser's duplicate-name error, and React's warning for two mounted names.
      if (/view-transition-name|ViewTransition name=/.test(message.text())) {
        messages.push(message.text());
      }
    });
    await recordViewTransitions(page);
    await page.goto('/photos/regions/zermatt');
    const link = page.locator(`[data-sequence-item="${first.slug}"] [data-photo-id]`);
    await waitForHydration(link);
    const before = await readViewTransitions(page);
    await link.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20000 });
    await expect
      .poll(async () => (await readViewTransitions(page)).count)
      .toBeGreaterThan(before.count);
    const after = await waitForViewTransitionsSettled(page);
    expect(after.pseudos).toEqual(expect.arrayContaining(morphPseudos));
    expect(messages).toEqual([]);
  });

  test('under reduced motion opening a figure runs no view-transition animation @prod-only', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await recordViewTransitions(page);
    await page.goto('/photos/regions/zermatt');
    const link = page.locator(`[data-sequence-item="${first.slug}"] [data-photo-id]`);
    await waitForHydration(link);
    const before = await readViewTransitions(page);
    await link.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog.getByRole('button', { name: 'Close photo', exact: true })).toBeFocused();
    // Settled first (10-REVIEW IN-09): every transition the open started has finished.
    const after = await waitForViewTransitionsSettled(page);
    const opened = after.transitions.slice(before.transitions.length).flat();
    expect(opened.filter((pseudo) => pseudo.startsWith('::view-transition'))).toEqual([]);
  });
});

/** The region altimeter rail (18-12): its root carries data-rail-current, the settle signal. */
const RAIL = 'section[data-region-sequence] [data-region-rail]';

/** Scroll the n-th (1-based) sequence figure to the viewport centre, instantly. */
async function centreFigure(page: Page, n: number) {
  await page
    .locator('section[data-region-sequence] li[data-sequence-item]')
    .nth(n - 1)
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
}

test.describe('Region altimeter rail (18-12; REGION-05, D-07)', () => {
  test('Zermatt at 1440: the rail marks photo 1 on load and photo 4 once figure 4 is centred', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/zermatt');
    const rail = page.locator(RAIL);
    await expect(rail).toHaveAttribute('data-rail-current', '1');
    await expect(rail).toHaveAttribute('aria-hidden', 'true');
    await centreFigure(page, 4);
    await expect(rail).toHaveAttribute('data-rail-current', '4');
  });
});

/** Wait three animation frames (never a fixed sleep): the observers deliver, React commits. */
async function threeFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => done()))
        )
      )
  );
}

/** Jump instantly to a document y (a Home, End or anchor jump: no smooth scroll). */
async function jumpTo(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
}

/** Record every value data-rail-current takes from now on (a MutationObserver on the rail). */
async function recordRail(page: Page) {
  await page.locator(RAIL).evaluate((rail) => {
    const w = window as unknown as { __railValues: string[]; __railObserver?: MutationObserver };
    w.__railObserver?.disconnect();
    w.__railValues = [];
    w.__railObserver = new MutationObserver(() =>
      w.__railValues.push(rail.getAttribute('data-rail-current') ?? '')
    );
    w.__railObserver.observe(rail, { attributes: true, attributeFilter: ['data-rail-current'] });
  });
}

async function railValues(page: Page) {
  return page.evaluate(() => (window as unknown as { __railValues: string[] }).__railValues);
}

/**
 * Put the viewport's centre line at the midpoint of the gap between the k-th
 * and (k + 1)-th figures, instantly, and return where the line and the gap's
 * edges lie (viewport px) after the scroll.
 */
async function lineIntoGap(page: Page, k: number) {
  return page.evaluate((k) => {
    const items = [
      ...document.querySelectorAll('section[data-region-sequence] li[data-sequence-item]'),
    ];
    const above = items[k - 1].getBoundingClientRect();
    const below = items[k].getBoundingClientRect();
    const mid = window.scrollY + (above.bottom + below.top) / 2;
    window.scrollTo({ top: mid - window.innerHeight / 2, behavior: 'instant' });
    return {
      line: window.innerHeight / 2,
      aboveBottom: items[k - 1].getBoundingClientRect().bottom,
      belowTop: items[k].getBoundingClientRect().top,
    };
  }, k);
}

test.describe('Region altimeter rail at every index (18-12; REGION-05, D-07, UI E6)', () => {
  for (const r of regions) {
    for (const [width, height] of [
      [768, 1024],
      [1440, 900],
    ] as const) {
      test(`/photos/regions/${r.id} at ${width}: every centred figure, both ends and both jumps`, async ({
        page,
      }) => {
        const views = regionPhotoViews(r.id);
        const N = views.length;
        await page.setViewportSize({ width, height });
        await page.goto(`/photos/regions/${r.id}`);
        const rail = page.locator(RAIL);
        // Above the first figure: photo 1.
        await expect(rail).toHaveAttribute('data-rail-current', '1');
        await expect(rail.locator('[data-rail-tick]')).toHaveCount(N);
        for (let n = 1; n <= N; n++) {
          await centreFigure(page, n);
          await expect(rail, `figure ${n} centred`).toHaveAttribute('data-rail-current', String(n));
        }
        // Past the last figure (the next-region block): photo N.
        await page
          .locator('#next-region')
          .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await expect(rail).toHaveAttribute('data-rail-current', String(N));
        // Jumps: the top, then straight to #next-region (no figure contains the
        // line before or after), then straight back to the top.
        await jumpTo(page, 0);
        await expect(rail).toHaveAttribute('data-rail-current', '1');
        await page
          .locator('#next-region')
          .evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
        await expect(rail).toHaveAttribute('data-rail-current', String(N));
        await jumpTo(page, 0);
        await expect(rail).toHaveAttribute('data-rail-current', '1');
      });
    }
  }

  for (const width of [768, 1440] as const) {
    test(`Zermatt at ${width}: in the gap between figures 3 and 4 the mark stays on the side come from`, async ({
      page,
    }) => {
      const N = regionPhotoViews('zermatt').length;
      expect(N).toBeGreaterThan(4);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/photos/regions/zermatt');
      const rail = page.locator(RAIL);

      // Coming down: figure 3, then the gap, then figure 4.
      await centreFigure(page, 3);
      await expect(rail).toHaveAttribute('data-rail-current', '3');
      await recordRail(page);
      const down = await lineIntoGap(page, 3);
      expect(down.aboveBottom, 'figure 3 ends above the line').toBeLessThan(down.line);
      expect(down.belowTop, 'figure 4 starts below the line').toBeGreaterThan(down.line);
      await threeFrames(page);
      await expect(rail).toHaveAttribute('data-rail-current', '3');
      expect(await railValues(page), 'nothing changed in the gap').toEqual([]);
      await centreFigure(page, 4);
      await expect(rail).toHaveAttribute('data-rail-current', '4');
      expect(await railValues(page), 'coming down: 3, then straight to 4').toEqual(['4']);

      // Coming up: figure 4, then the same gap, then figure 3.
      await recordRail(page);
      const up = await lineIntoGap(page, 3);
      expect(up.aboveBottom).toBeLessThan(up.line);
      expect(up.belowTop).toBeGreaterThan(up.line);
      await threeFrames(page);
      await expect(rail).toHaveAttribute('data-rail-current', '4');
      expect(await railValues(page), 'nothing changed in the gap').toEqual([]);
      await centreFigure(page, 3);
      await expect(rail).toHaveAttribute('data-rail-current', '3');
      expect(await railValues(page), 'coming up: 4, then straight to 3').toEqual(['3']);
    });
  }

  for (const r of regions) {
    test(`/photos/regions/${r.id} at 1440: one tick per photo, the current label semibold, dashed approximate ticks, the head label`, async ({
      page,
    }) => {
      const views = regionPhotoViews(r.id);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/photos/regions/${r.id}`);
      const rail = page.locator(RAIL);
      await expect(rail).toHaveAttribute('aria-hidden', 'true');
      expect(await rail.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
      expect(await rail.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
      const ticks = rail.locator('[data-rail-tick]');
      await expect(ticks).toHaveCount(views.length);
      await expect(rail.locator('[data-rail-head]')).toHaveText(
        views.every((v) => v.aerial) ? 'Ground altitude' : 'Altitude'
      );
      for (let i = 0; i < views.length; i++) {
        const tick = ticks.nth(i);
        const style = await tick.evaluate((li) => {
          const label = li.querySelector('[data-tick-label]') as HTMLElement;
          const mark = li.querySelector('[data-tick-mark]') as HTMLElement;
          return {
            label: label.textContent,
            weight: getComputedStyle(label).fontWeight,
            border: getComputedStyle(mark).borderTopStyle,
          };
        });
        const name = `${r.id} tick ${i + 1}`;
        expect(style.label, name).toBe(railTicks(views)[i].label);
        expect(style.weight, `${name}: only the current label is semibold`).toBe(
          i === 0 ? '600' : '400'
        );
        // Preflight gives every element a 0 px solid border, so a solid tick reads 'solid'.
        expect(style.border === 'dashed', `${name}: dashed exactly when approximate`).toBe(
          views[i].approximate
        );
      }
    });
  }

  test('some region has an approximate photo, so the dashed-tick rows are not vacuous', () => {
    expect(regions.some((r) => regionPhotoViews(r.id).some((v) => v.approximate))).toBe(true);
    expect(regions.some((r) => regionPhotoViews(r.id).some((v) => !v.approximate))).toBe(true);
  });

  test('Saalfelden (all aerial) heads its rail Ground altitude', async ({ page }) => {
    expect(regionPhotoViews('saalfelden').every((v) => v.aerial)).toBe(true);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/saalfelden');
    await expect(page.locator(`${RAIL} [data-rail-head]`)).toHaveText('Ground altitude');
  });

  test('the server HTML marks photo 1 before any script runs (UI E6 loading)', async ({ page }) => {
    const html = await (await page.request.get('/photos/regions/zermatt')).text();
    expect(html).toMatch(/data-region-rail=""[^>]*data-rail-current="1"/);
  });

  for (const r of regions) {
    test(`/photos/regions/${r.id} at 375: no rail box, and each caption starts with n / N (D-07)`, async ({
      page,
    }) => {
      const views = regionPhotoViews(r.id);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`/photos/regions/${r.id}`);
      expect(await page.locator(RAIL).boundingBox()).toBeNull();
      const counters = page.locator('section[data-region-sequence] [data-figure-counter]');
      await expect(counters).toHaveCount(views.length);
      for (let i = 0; i < views.length; i++) {
        await expect(counters.nth(i)).toBeVisible();
        await expect(counters.nth(i)).toHaveText(`${i + 1} / ${views.length} · `);
      }
    });
  }

  test('the marker moves over --duration-panel, and instantly under reduced motion', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos/regions/zermatt');
    const marker = page.locator(`${RAIL} [data-rail-marker]`);
    expect(await marker.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0.25s');
    // Tailwind 4's transition-transform lists the individual transform properties too.
    expect(
      (await marker.evaluate((el) => getComputedStyle(el).transitionProperty)).split(', ')
    ).toContain('transform');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await marker.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
    await centreFigure(page, 2);
    await expect(page.locator(RAIL)).toHaveAttribute('data-rail-current', '2');
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
    // The figure link's name is the photo's alt (18-08), so the title comes from the data.
    const title = publishedViews.find((v) => v.slug === PHOTO)?.title ?? '';
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

/** The v2.0 four's slugs (their pages, back link included, are photos-lightbox.spec's identity rows). */
const V20_SLUGS: readonly string[] = Object.values(SLUGS);

/** A published photo's place in its region series: 1-based k of N. */
function seriesPlace(slug: string, id: string) {
  const series = regionPhotoViews(id);
  const k = series.findIndex((v) => v.slug === slug) + 1;
  if (k === 0) throw new Error(`photos-region.spec: ${slug} is not in the ${id} series`);
  return { k, n: series.length };
}

/** The published photos off the v2.0 four, in canonical order, each with its region and place. */
const NEW_PHOTOS = publishedViews
  .filter((v) => !V20_SLUGS.includes(v.slug))
  .map((view) => {
    const id = regionOfPhoto(view.id);
    if (!id) throw new Error(`photos-region.spec: photo ${view.id} has no region`);
    return { view, region: region(id), ...seriesPlace(view.slug, id) };
  });

/** Ortler's series, by data: the Escape, lightbox and swipe rows use its first photo. */
const ORTLER_SERIES = regionPhotoViews('ortler');
const ORTLER_PHOTO = { view: ORTLER_SERIES[0], region: region('ortler') };

test.describe('New photo pages (D-09, PHOTO-05; LBOX-09)', () => {
  test('every published photo is in exactly one region series and the series cover them all', () => {
    const seen = regions.flatMap((r) => regionPhotoViews(r.id).map((v) => v.slug));
    expect(new Set(seen).size).toBe(seen.length);
    expect([...seen].sort()).toEqual(publishedViews.map((v) => v.slug).sort());
    expect(NEW_PHOTOS).toHaveLength(publishedViews.length - V20_SLUGS.length);
  });

  for (const { view, region: r, k, n } of NEW_PHOTOS) {
    test(`/photos/${view.slug}: steps within ${r.name} as photo ${k} of ${n}, one back link 'Back to ${r.name}'`, async ({
      page,
    }) => {
      const response = await page.goto(`/photos/${view.slug}`);
      expect(response?.status()).toBe(200);
      const main = page.getByRole('main');
      await expect(h1(page)).toHaveText(view.title);
      // LBOX-09: the region's series, k of N; no wrap before photo 1, and Next stays
      // enabled on photo N, where it leads to the end-of-series card (18-16, D-12).
      await expect(main.locator('[data-photo-counter]')).toHaveText(`${k} / ${n}`);
      const prev = main.getByRole('button', { name: 'Previous photo', exact: true });
      const next = main.getByRole('button', { name: 'Next photo', exact: true });
      await expect(prev).toHaveCount(1);
      await expect(next).toHaveCount(1);
      if (k === 1) await expect(prev).toHaveAttribute('aria-disabled', 'true');
      else await expect(prev).not.toHaveAttribute('aria-disabled');
      await expect(next).not.toHaveAttribute('aria-disabled');
      // Two links in the markup (the scroll-tier row and the chrome); CSS shows one per tier.
      const name = `Back to ${r.name}`;
      const back = main.getByRole('link', { name, exact: true, includeHidden: true });
      await expect(back).toHaveCount(2);
      for (const link of await back.all()) {
        await expect(link).toHaveAttribute('href', `/photos/regions/${r.id}`);
      }
      await expect(main.getByRole('link', { name, exact: true })).toHaveCount(1);
      await expect(main.getByRole('link', { name, exact: true })).toBeVisible();
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
    const back = page
      .getByRole('main')
      .getByRole('link', { name: `Back to ${r.name}`, exact: true })
      .first();
    await waitForHydration(back);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(new RegExp(`/photos/regions/${r.id}$`));
    await expect(h1(page)).toHaveText(regionHeading(r));
  });

  test('the lightbox from the Ortler region page steps within Ortler (1 / 2, then 2 / 2) and has no back link; Back closes it @prod-only @no-win-webkit', async ({
    page,
  }) => {
    const { view, region: r } = ORTLER_PHOTO;
    const second = ORTLER_SERIES[1];
    await page.goto(`/photos/regions/${r.id}`);
    const link = page.locator(`[data-photo-id="${view.slug}"]`);
    await waitForHydration(link);
    await link.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(new RegExp(`/photos/${view.slug}$`));
    await expect(dialog).toHaveAccessibleName(view.title);
    const counter = dialog.locator('[data-photo-counter]');
    await expect(counter).toHaveText(`1 / ${ORTLER_SERIES.length}`);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    await waitForHydration(next);
    await next.click();
    await expect(page).toHaveURL(new RegExp(`/photos/${second.slug}$`));
    await expect(counter).toHaveText(`2 / ${ORTLER_SERIES.length}`);
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(second.title);
    // Next stays enabled on the last photo: it leads to the end card (18-16, D-12).
    await expect(next).not.toHaveAttribute('aria-disabled');
    await expect(dialog.getByRole('link', { name: `Back to ${r.name}`, exact: true })).toHaveCount(
      0
    );
    await expect(dialog.getByRole('link', { name: /^Back to / })).toHaveCount(0);
    await expect(dialog.getByRole('link', { name: 'All photographs', exact: true })).toHaveCount(0);

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/photos/regions/${r.id}$`));
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(h1(page)).toHaveText(regionHeading(r));
  });

  /** Two animation frames: a step that lands after a frame or a View Transition commit has landed. */
  async function settle(page: Page) {
    await page.evaluate(
      () =>
        new Promise<void>((done) =>
          requestAnimationFrame(() => requestAnimationFrame(() => done()))
        )
    );
  }

  /** A left touch swipe over the page's photo (pointer events, as a finger sends them). */
  async function swipeLeft(page: Page) {
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
  }

  /**
   * A left touch swipe, then → and ←, then the settle point (17-REVIEW WR-02:
   * a web-first assertion passes at its first poll when nothing has changed
   * yet, so the state is read after the frames).
   */
  async function swipeAndArrows(page: Page) {
    await swipeLeft(page);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await settle(page);
  }

  /** The viewer's own polite status line (StagePhoto may hold others). */
  const viewerStatus = (page: Page) => page.locator('[data-photo-viewer] > p[role="status"]');

  /** The history length, which a step (replaceState) never changes. */
  const historyLength = (page: Page) => page.evaluate(() => history.length);

  test('LBOX-09: a touch swipe and the arrows step within the region on a photo page @chromium-only', async ({
    page,
  }) => {
    const [first, second] = ORTLER_SERIES;
    expect(ORTLER_SERIES).toHaveLength(2);
    await page.goto(`/photos/${first.slug}`);
    await waitForHydration(page.getByRole('main').locator('[data-photo-box]'));
    expect(await page.title()).toBe(`${first.title} · Tim Lui`);
    const length = await historyLength(page);

    // The swipe lands on Ortler's second photo, and ← returns to the first.
    await swipeLeft(page);
    await expect(page).toHaveURL(new RegExp(`/photos/${second.slug}$`));
    await expect(viewerStatus(page)).toHaveText(`Photo 2 of 2: ${second.title}`);
    await expect(page).toHaveTitle(`${second.title} · Tim Lui`);
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(viewerStatus(page)).toHaveText(`Photo 1 of 2: ${first.title}`);
    await settle(page);
    expect(await historyLength(page)).toBe(length);

    // The same gestures on Zermatt's seven (swipe to the 2nd, → to the 3rd,
    // ← back to the 2nd): the series is the region's, not the v2.0 four.
    const zermatt = regionPhotoViews('zermatt');
    expect(zermatt).toHaveLength(7);
    await page.goto(`/photos/${zermatt[0].slug}`);
    await swipeAndArrows(page);
    await expect(page).toHaveURL(new RegExp(`/photos/${zermatt[1].slug}$`));
    await expect(viewerStatus(page)).toHaveText(`Photo 2 of 7: ${zermatt[1].title}`);
  });
});

test.describe('Region stepping on the photo page (18-15; LBOX-09, D-12)', () => {
  const ortler = regionPhotoViews('ortler');

  test('LBOX-09: the first Ortler photo page steps to its second photo', async ({ page }) => {
    expect(ortler).toHaveLength(2);
    const [first, second] = ortler;
    await page.goto(`/photos/${first.slug}`);
    const main = page.getByRole('main');
    const counter = main.locator('[data-photo-counter]');
    await expect(h1(page)).toHaveText(first.title);
    await expect(counter).toHaveText('1 / 2');

    const next = main.getByRole('button', { name: 'Next photo', exact: true });
    await waitForHydration(next);
    await next.click();
    await expect(page).toHaveURL(new RegExp(`/photos/${second.slug}$`));
    await expect(h1(page)).toHaveText(second.title);
    await expect(counter).toHaveText('2 / 2');
  });
});

test.describe('Photo page trail and one way back (18-17; REGION-02, D-09, D-10)', () => {
  /** The trail inside <main> (the photo page's strip). */
  const trail = (page: Page) =>
    page.getByRole('main').getByRole('navigation', { name: 'Breadcrumb' });

  /** The trail's visible crumbs in order: the links, then the current page. */
  const crumbTexts = async (nav: Locator) =>
    (await nav.locator('li > a, li > [aria-current="page"]').allTextContents()).map((t) =>
      t.trim()
    );

  for (const view of publishedViews) {
    test(`/photos/${view.slug}: the trail equals its one BreadcrumbList (UI E10/populated)`, async ({
      page,
    }) => {
      await page.goto(`/photos/${view.slug}`);
      const nav = trail(page);
      await expect(nav).toHaveCount(1);
      const crumbs = photoBreadcrumb(view.slug);
      expect(await crumbTexts(nav)).toEqual(crumbs.map((c) => c.name));

      // Two links (44 px targets), the current title a plain span, two hidden '/'.
      const links = nav.getByRole('link');
      await expect(links).toHaveCount(2);
      for (const [i, link] of (await links.all()).entries()) {
        await expect(link).toHaveAttribute('href', crumbs[i].path);
        expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      const current = nav.locator('[aria-current="page"]');
      await expect(current).toHaveText(view.title);
      expect(await current.evaluate((el) => el.tagName)).toBe('SPAN');
      await expect(nav.locator('[aria-hidden="true"]')).toHaveText(['/', '/']);
      // The trail sits above the h1, in the strip's identity column.
      const identity = page.locator('[data-strip-identity]');
      expect(
        await identity.evaluate(
          (el) =>
            el.firstElementChild?.getAttribute('aria-label') === 'Breadcrumb' &&
            el.firstElementChild?.nextElementSibling?.tagName === 'H1'
        )
      ).toBe(true);

      // The one BreadcrumbList names exactly the visible crumbs, in order, items absolute.
      const lists = (await ldBlocks(page)).filter((b) => b['@type'] === 'BreadcrumbList');
      expect(lists).toHaveLength(1);
      const items = lists[0].itemListElement as Array<{
        name: string;
        item: string;
        position: number;
      }>;
      expect(items.map((i) => i.name)).toEqual(await crumbTexts(nav));
      expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
      expect(items.map((i) => i.item)).toEqual(crumbs.map((c) => `${site.url}${c.path}`));
    });
  }

  test('after one step the current crumb names the new photo; the region crumb stays', async ({
    page,
  }) => {
    const [first, second] = regionPhotoViews('ortler');
    await page.goto(`/photos/${first.slug}`);
    const nav = trail(page);
    const next = page.getByRole('main').getByRole('button', { name: 'Next photo', exact: true });
    await waitForHydration(next);
    await next.click();
    await expect(page).toHaveURL(new RegExp(`/photos/${second.slug}$`));
    await expect(nav.locator('[aria-current="page"]')).toHaveText(second.title);
    await expect(h1(page)).toHaveText(second.title);
    expect(await crumbTexts(nav)).toEqual(photoBreadcrumb(second.slug).map((c) => c.name));
  });

  test('the lightbox holds no trail and no back link (D-09, D-10: page only; UI E10/zero-one-many) @prod-only', async ({
    page,
  }) => {
    const view = regionPhotoViews('ortler')[0];
    await page.goto('/photos/regions/ortler');
    const link = page.locator(`[data-photo-id="${view.slug}"]`);
    await waitForHydration(link);
    await link.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(view.title);
    await expect(dialog.locator('nav[aria-label="Breadcrumb"]')).toHaveCount(0);
    await expect(dialog.getByRole('link', { name: /^Back to / })).toHaveCount(0);
  });

  // Saalfelden's first photo carries the longest back label ('Back to Saalfelden').
  const longest = regionPhotoViews('saalfelden')[0];
  const longestBack = photoBack(longest.id);
  for (const [width, height] of [
    [375, 800],
    [768, 900],
    [1440, 900],
  ] as const) {
    test(`/photos/${longest.slug} at ${width}: exactly one visible 'Back to …' link (17-UI-REVIEW hand-over)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`/photos/${longest.slug}`);
      const main = page.getByRole('main');
      const back = main.getByRole('link', { name: /^Back to / });
      await expect(back).toHaveCount(1);
      await expect(back).toBeVisible();
      await expect(back).toHaveText(`Back to ${longestBack.name}`);
      await expect(back).toHaveAttribute('href', longestBack.href);
      if (width === 768) {
        // Key tier: the link sits in the chrome bar, which does not overflow.
        const chrome = page.locator('[data-viewer-chrome]');
        await expect(chrome.getByRole('link', { name: /^Back to / })).toBeVisible();
        const fit = await chrome.evaluate((el) => ({
          scroll: el.scrollWidth,
          client: el.clientWidth,
        }));
        expect(fit.scroll).toBeLessThanOrEqual(fit.client);
        const left = (await page.locator('[data-chrome-left]').boundingBox())!;
        const right = (await page.locator('[data-chrome-right]').boundingBox())!;
        expect(left.x + left.width).toBeLessThanOrEqual(right.x);
      }
    });
  }
});
