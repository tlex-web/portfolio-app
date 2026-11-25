import { test, expect, type Locator, type Page } from '@playwright/test';
import { site } from '@/data/site';
import { photoBack, regionPhotoViews } from '@/lib/regions';
import { publishedViews } from '@/lib/photos/view-model';
import { HOTSPOT_PREF_KEY } from '@/lib/photos/hotspot-pref';
import { LB_CHROME_PX, LB_GUTTER_PX } from '@/lib/photos/lightbox-tiers';
import {
  readViewTransitions,
  recordViewTransitions,
  removeViewTransitions,
  waitForViewTransitionsSettled,
} from './helpers/view-transitions';
import { pressButton, tabReachesLinks } from './helpers/engine';
import { SLUGS, viewBySlug } from './helpers/photo-fixtures';

/**
 * The photo viewer in a browser (LBOX-01, LBOX-04, LBOX-07; D-05, D-08;
 * 10-UI-SPEC "Photo Viewer"). A directly loaded /photos/{slug} is the viewer
 * inside the shell: one banner, main and contentinfo, the title as the h1, a
 * 'Back to {region}' link to its region page (18 D-09, photoBack: every
 * published photo, the v2.0 four included), the rights line, no dialog and no
 * download control,
 * and the photo drawn from a content-hashed manifest derivative. Every
 * expected value is derived from the data, never hand-typed: Zermatt's series
 * (regionPhotoViews) for positions, counters and neighbours, since every viewer
 * steps through its photo's region (LBOX-09, 18 D-12), and the SLUGS fixtures
 * for the v2.0 four's identity rows.
 */

/*
 * Tests in this file run in order in one worker, each retried on its own
 * (12-22, D-26). On the dev server with the default worker count (16 here),
 * every worker compiling and soft-navigating the photo routes at once slowed
 * lightbox navigations past their timeouts: 16 of 52 tests failed in one run of
 * this file alone, and 52 of 52 passed with --workers=2. The production server
 * that CI uses (one worker) runs these tests in order already, so CI is
 * unaffected; no timeout or assertion changes.
 */
test.describe.configure({ mode: 'default' });

// Index lookups into series here are positions in Zermatt's series (DEM ascending, ties by
// id), the set a Zermatt photo's viewer steps through (LBOX-09); a specific photo is named
// through viewBySlug. Every lightbox here opens from that photo's figure link on the Zermatt
// region page (18-19; PHOTO-06), never from the retiring grid.
const series = regionPhotoViews('zermatt');

// The v2.0 four by name, for the rows that audit each photo's own page (identity rows).
const V20 = Object.values(SLUGS).map(viewBySlug);

// Zermatt's way back, the target of every Zermatt photo page (18 D-09): 'Back to Zermatt'.
const ZERMATT_BACK = photoBack(series[0].id);
const ZERMATT_URL = new RegExp(`${ZERMATT_BACK.href}$`);

/** A content-hashed manifest derivative: /images/photos/<name>.<10 hex>.<avif|webp>. */
const DERIVATIVE = /^\/images\/photos\/[a-z0-9-]+\.[0-9a-f]{10}\.(avif|webp)$/;

/** The formatters keep a unit on its number with U+00A0. */
const NBSP = String.fromCharCode(0xa0);

test.describe('Photo page (LBOX-01 direct load)', () => {
  // Every published photo since 18-17 (was the v2.0 four): each page's one way back is
  // its region page by name (18 D-09), the four included.
  for (const view of publishedViews) {
    const back = photoBack(view.id);
    test(`/photos/${view.slug}: the viewer inside the shell, no dialog, 'Back to ${back.name}' (D-08, 18 D-09)`, async ({
      page,
    }) => {
      const response = await page.goto(`/photos/${view.slug}`);
      expect(response?.status()).toBe(200);

      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      await expect(page.getByRole('dialog')).toHaveCount(0);

      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(view.title);
      await expect(main.getByText(view.rights, { exact: true })).toBeVisible();
      // One visible back link (the other tier's copy is display: none), to the region page.
      const backLink = main.getByRole('link', { name: `Back to ${back.name}`, exact: true });
      await expect(backLink).toHaveCount(1);
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', back.href);
      await expect(
        main.getByRole('link', { name: 'All photographs', exact: true, includeHidden: true })
      ).toHaveCount(0);
      await expect(page).toHaveTitle(`${view.title} · Tim Lui`);

      // LBOX-07: no download control anywhere, and only hashed derivatives on the stage.
      await expect(page.locator('[download]')).toHaveCount(0);
      const img = page.locator('[data-photo-viewer] [data-stage-layer="large"] img');
      await expect(img).toHaveAttribute('alt', view.alt);
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
        .toBe(true);
      const currentSrc = await img.evaluate(
        (el: HTMLImageElement) => new URL(el.currentSrc).pathname
      );
      expect(currentSrc).toMatch(DERIVATIVE);
    });
  }

  test('the strip shows every field without filler (LBOX-04, D-07)', async ({ page }) => {
    // One full page load per photo (nine) in one test: on a loaded dev server they can
    // outrun the 30 s default, so the budget is tripled (12-22, D-26). Assertions unchanged.
    test.slow();
    for (const view of V20) {
      await page.goto(`/photos/${view.slug}`);
      const main = page.getByRole('main');
      await expect(main).toContainText(view.strip.placeDate.place);
      await expect(main).toContainText(view.rights);
      if (view.strip.filmLine) {
        await expect(main).toContainText(view.strip.filmLine);
        await expect(main).toContainText(view.strip.approxNote ?? '(approx.)');
      }
      expect(await main.innerText()).not.toMatch(/—|\bundefined\b|\bnull\b|\bNaN\b|\bunknown\b/);
    }
    // The film scan is the one photo with a film line and a radius, so it is checked by value too.
    const film = V20.find((v) => v.strip.filmLine);
    expect(film?.strip.filmLine).toBe('Film scan · 2019');
    expect(film?.strip.approxNote).toBe(`±100${NBSP}m (approx.)`);
  });
});

/**
 * The stage's `sizes` (13 #34, stage half; 18-19): stageSizes(ar, variant) from
 * the lightbox tiers, on the page and in the dialog opened from the Zermatt
 * sequence, at 375 (scroll tier), 768 (key) and 1440 (gutter). The large
 * picture's currentSrc is a candidate whose width descriptor covers the
 * painted width times the device pixel ratio, and the next smaller candidate
 * in the same set would not (no gross over-fetch). The project's own DPR
 * applies: 1 for Desktop Chrome and Firefox, 2 for Desktop Safari (WebKit).
 */
test.describe('Stage sizes at 375, 768 and 1440 (13 #34; 18-19)', () => {
  const STAGE_WIDTHS = [
    [375, 800],
    [768, 900],
    [1440, 900],
  ] as const;
  const subject = series[0];

  /** The chosen candidate, the next smaller one in its set, the painted width and the DPR. */
  async function stageFit(img: Locator) {
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), {
        timeout: 15000,
      })
      .toBe(true);
    return img.evaluate((el: HTMLImageElement) => {
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
      // The painted width: under object-fit contain, the image inside its box.
      const r = el.getBoundingClientRect();
      const rendered =
        getComputedStyle(el).objectFit === 'contain'
          ? Math.min(r.width, (r.height * el.naturalWidth) / el.naturalHeight)
          : r.width;
      return {
        current,
        sizes: el.closest('picture')?.querySelector('source')?.sizes ?? '',
        descriptor: chosen?.w ?? 0,
        nextSmaller: smaller.length > 0 ? Math.max(...smaller) : 0,
        rendered,
        dpr: window.devicePixelRatio,
      };
    });
  }

  function expectFit(fit: Awaited<ReturnType<typeof stageFit>>, what: string) {
    const need = fit.rendered * fit.dpr;
    test.info().annotations.push({
      type: 'stage-fit',
      description: `${what}: DPR ${fit.dpr}, painted ${fit.rendered.toFixed(1)} px, need ${need.toFixed(0)}, chose ${fit.descriptor}w, next smaller ${fit.nextSmaller}w`,
    });
    expect(fit.descriptor, `${what}: ${fit.current} is a srcset candidate`).toBeGreaterThan(0);
    expect(fit.descriptor, `${what}: the descriptor covers ${need} px`).toBeGreaterThanOrEqual(
      Math.floor(need)
    );
    expect(fit.nextSmaller, `${what}: the next smaller candidate would not`).toBeLessThan(need);
  }

  for (const [width, height] of STAGE_WIDTHS) {
    test(`page at ${width}x${height}: the stage currentSrc fits the painted width times DPR`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`/photos/${subject.slug}`);
      const img = page.locator('[data-photo-viewer] [data-stage-layer="large"] img');
      const fit = await stageFit(img);
      expect(fit.sizes).toContain('(min-height: 640px)');
      expect(fit.sizes).toContain('(100vh - 120px)');
      expectFit(fit, `page ${width}x${height}`);
    });

    test(`dialog from the Zermatt sequence at ${width}x${height}: the stage currentSrc fits the painted width times DPR`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/photos/regions/zermatt');
      const link = page.locator(`[data-photo-id="${subject.slug}"]`);
      await expect(link).toHaveCount(1);
      await waitForHydration(link);
      await link.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 20000 });
      await expect(page).toHaveURL(new RegExp(`/photos/${subject.slug}$`));
      const fit = await stageFit(dialog.locator('[data-stage-layer="large"] img'));
      expect(fit.sizes).toContain('(100vh - 56px)');
      expectFit(fit, `dialog ${width}x${height}`);
    });
  }
});

/**
 * The LV95 line (18-18; PHOTO-08, D-14, D-15): on every Swiss photo page the
 * strip's position list ends with 'LV95 [≈ ]E … N …', easting first, whose
 * values are multiples of the grid for the precision the page shows (4
 * decimals 10 m, 3 decimals 100 m, 2 decimals 1,000 m); a photo outside
 * Switzerland has no 'Swiss grid' term. Formats and grid multiples are read
 * from the page, never literal values (16 D-25).
 */
test.describe('LV95 line on the photo page (18-18; PHOTO-08)', () => {
  const LV95 = /^LV95 (≈ )?E (\d’\d{3}’\d{3}) N (\d’\d{3}’\d{3})$/;
  const GRID_BY_DECIMALS: Record<number, number> = { 4: 10, 3: 100, 2: 1000 };

  for (const view of publishedViews) {
    const swiss = view.country === 'CH';
    test(`/photos/${view.slug} (${view.country}): ${swiss ? 'an LV95 line at the shown precision' : 'no LV95 line'}`, async ({
      page,
    }) => {
      await page.goto(`/photos/${view.slug}`);
      const list = page.locator('[data-photo-strip] [data-strip-position]');
      await expect(list).toBeVisible();
      if (!swiss) {
        await expect(list.locator('[data-strip-lv95]')).toHaveCount(0);
        await expect(page.locator('[data-photo-strip] dt', { hasText: 'Swiss grid' })).toHaveCount(
          0
        );
        await expect(page.locator('[data-photo-strip]')).not.toContainText('LV95');
        return;
      }
      // The shown Position value: its decimals name the precision, and with it the grid.
      const position = (await list.locator('dt:text-is("Position") + dd').innerText()).trim();
      const decimals = /(\d+)\.(\d+) [NS]/.exec(position)?.[2].length;
      expect(decimals).toBeDefined();
      const grid = GRID_BY_DECIMALS[decimals!];
      expect(grid).toBeDefined();

      const row = list.locator('[data-strip-lv95]');
      await expect(row).toBeVisible();
      await expect(row.locator('dt')).toHaveText('Swiss grid');
      await expect(row.locator('dt')).toHaveClass(/\bsr-only\b/);
      const line = (await row.locator('dd').innerText()).trim();
      const match = LV95.exec(line);
      expect(match, line).not.toBeNull();
      // '≈' exactly when the Position line carries it.
      expect(match![1] !== undefined).toBe(position.startsWith('≈'));
      for (const value of [match![2], match![3]]) {
        expect(Number(value.replaceAll('’', '')) % grid).toBe(0);
      }
      // Its own visual line, under the Altitude · Position line.
      const lineBox = await list.locator(':scope > div').first().boundingBox();
      const rowBox = await row.boundingBox();
      expect(rowBox!.y).toBeGreaterThanOrEqual(lineBox!.y + lineBox!.height - 1);
    });
  }

  test('LV95 stays in the viewer strip: the Zermatt sequence collars show WGS84 only (D-14)', async ({
    page,
  }) => {
    await page.goto('/photos/regions/zermatt');
    const sequence = page.locator('[data-region-sequence]');
    await expect(sequence).toHaveCount(1);
    await expect(sequence).toContainText(/\d+\.\d{2,4} N/);
    await expect(sequence).not.toContainText('LV95');
    await expect(page.locator('[data-strip-lv95]')).toHaveCount(0);
  });
});

/**
 * The strip's Share / Copy link (18-18; PHOTO-07, D-13): it shares the photo on
 * screen, so after a step it hands over the stepped photo's canonical URL,
 * site.url + photoHref, never the window address (T-18-39). Opened from the
 * Zermatt sequence, the stepping set's own surface. The real clipboard is a
 * Chromium row (only Chromium grants clipboard permissions in Playwright);
 * the navigator.share stub runs in every engine (Pitfall 7).
 */
test.describe('Share in the viewer strip (18-18; PHOTO-07)', () => {
  const second = series[1];
  const secondUrl = `${site.url}/photos/${second.slug}`;

  /** Open a Zermatt photo in the lightbox from its figure link on the region page. */
  async function openFromSequence(page: Page, slug: string) {
    await page.goto('/photos/regions/zermatt');
    const link = page.locator(`[data-photo-id="${slug}"]`);
    await expect(link).toHaveCount(1);
    await waitForHydration(link);
    await link.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(new RegExp(`/photos/${slug}$`));
    return dialog;
  }

  /** Press Next once and wait for the second photo (its title is the h2 in the lightbox, the h1 on the page). */
  async function stepOnce(scope: Locator, browserName: string, level: 1 | 2 = 2) {
    const next = scope.getByRole('button', { name: 'Next photo', exact: true });
    await waitForHydration(next);
    await pressButton(next, browserName);
    await expect(scope.locator('[data-photo-counter]')).toHaveText(`2 / ${series.length}`);
    await expect(scope.getByRole('heading', { level })).toHaveText(second.title);
  }

  /** A navigator.share stub that records what it receives. */
  async function stubShare(page: Page) {
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
  }

  const shared = (page: Page) =>
    page.evaluate(() => (window as unknown as { __shared: ShareData[] }).__shared);

  test('lightbox: after Next, Copy link puts the second photo canonical URL on the clipboard @chromium-only', async ({
    page,
    context,
    baseURL,
    browserName,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL });
    // Copy mode whatever the browser build ships (Pitfall 7).
    await page.addInitScript(() => {
      delete (Navigator.prototype as Partial<Navigator>).share;
      delete (Navigator.prototype as Partial<Navigator>).canShare;
    });
    const dialog = await openFromSequence(page, series[0].slug);
    await stepOnce(dialog, browserName);

    const button = dialog.getByRole('button', { name: 'Copy link to this photo' });
    await expect(button).toHaveText('Copy link');
    await button.click();

    await expect(button).toHaveText('Link copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(secondUrl);
  });

  test('lightbox: after Next, Share photo hands navigator.share the second photo canonical URL', async ({
    page,
    browserName,
  }) => {
    await stubShare(page);
    const dialog = await openFromSequence(page, series[0].slug);
    await stepOnce(dialog, browserName);

    const button = dialog.getByRole('button', { name: 'Share photo' });
    await expect(button).toHaveText('Share photo');
    await button.click();

    await expect
      .poll(() => shared(page))
      .toEqual([{ title: `${second.title} · ${site.name}`, url: secondUrl }]);
    await expect(dialog.locator('[data-share-failure]')).toHaveCount(0);
  });

  test('photo page with a query and hash: after Next, Share photo still hands over the bare canonical URL', async ({
    page,
    browserName,
  }) => {
    await stubShare(page);
    await page.goto(`/photos/${series[0].slug}?x=1#y`);
    const viewer = page.locator('[data-photo-viewer]');
    await stepOnce(viewer, browserName, 1);
    await expect(page).toHaveURL(new RegExp(`/photos/${second.slug}$`));

    const button = viewer.getByRole('button', { name: 'Share photo' });
    await button.click();

    await expect
      .poll(() => shared(page))
      .toEqual([{ title: `${second.title} · ${site.name}`, url: secondUrl }]);
  });

  test('the end card has no Share button; the strip and its button return with Previous', async ({
    page,
    browserName,
  }) => {
    const last = series[series.length - 1];
    const dialog = await openFromSequence(page, last.slug);
    const share = dialog.locator('[data-strip-share] button');
    await expect(share).toHaveCount(1);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    await waitForHydration(next);
    await pressButton(next, browserName);
    await expect(dialog.locator('[data-photo-counter]')).toHaveText('End');
    await expect(share).toHaveCount(0);
    await pressButton(
      dialog.getByRole('button', { name: 'Previous photo', exact: true }),
      browserName
    );
    await expect(dialog.locator('[data-photo-counter]')).toHaveText(
      `${series.length} / ${series.length}`
    );
    await expect(share).toHaveCount(1);
  });
});

test.describe('Viewer layout tiers (D-05)', () => {
  const subject = viewBySlug(SLUGS.matterhornFromZermatt);
  const ratio = subject.aspect.w / subject.aspect.h;
  const NAV_H = 64;

  /** The bounding box of a selector inside the viewer; fails when it is not rendered. */
  async function box(page: import('@playwright/test').Page, selector: string) {
    const rect = await page.locator(`[data-photo-viewer] ${selector}`).first().boundingBox();
    expect(rect, `${selector} has a box`).not.toBeNull();
    return rect!;
  }

  test('1440 x 900 gutter tier: contain-fit photo with 216 px gutters, 56 px chrome, two-column strip', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/photos/${subject.slug}`);

    const viewer = await box(page, '');
    expect(Math.abs(viewer.height - (900 - NAV_H))).toBeLessThanOrEqual(1);
    const chrome = await box(page, '[data-viewer-chrome]');
    expect(chrome.height).toBe(LB_CHROME_PX);

    const stage = await box(page, '[data-viewer-stage]');
    const photo = await box(page, '[data-photo-box]');
    expect(Math.abs(photo.width / photo.height - ratio) / ratio).toBeLessThan(0.01);
    expect(photo.x).toBeGreaterThanOrEqual(stage.x + LB_GUTTER_PX - 0.5);
    expect(photo.x + photo.width).toBeLessThanOrEqual(stage.x + stage.width - LB_GUTTER_PX + 0.5);
    expect(photo.y).toBeGreaterThanOrEqual(stage.y - 0.5);
    expect(photo.y + photo.height).toBeLessThanOrEqual(stage.y + stage.height + 0.5);

    const identity = await box(page, '[data-strip-identity]');
    const data = await box(page, '[data-strip-data]');
    expect(data.x).toBeGreaterThan(identity.x + identity.width);
    expect(Math.abs(data.y - identity.y)).toBeLessThanOrEqual(1);

    // The 'Back to Zermatt' link is the first control of the chrome's left group (18 D-09).
    const link = page.getByRole('link', { name: `Back to ${ZERMATT_BACK.name}`, exact: true });
    await expect(link).toHaveCount(1);
    await expect(page.locator('[data-chrome-left]').getByRole('link')).toHaveText(
      `Back to ${ZERMATT_BACK.name}`
    );
  });

  test('1024 x 768 key tier: the photo fits the stage and the strip has two columns', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`/photos/${subject.slug}`);

    const stage = await box(page, '[data-viewer-stage]');
    const photo = await box(page, '[data-photo-box]');
    expect(Math.abs(photo.width / photo.height - ratio) / ratio).toBeLessThan(0.01);
    expect(photo.x).toBeGreaterThanOrEqual(stage.x - 0.5);
    expect(photo.x + photo.width).toBeLessThanOrEqual(stage.x + stage.width + 0.5);
    expect(photo.y).toBeGreaterThanOrEqual(stage.y - 0.5);
    expect(photo.y + photo.height).toBeLessThanOrEqual(stage.y + stage.height + 0.5);
    // Largest box: it touches the stage on one axis.
    const fillsWidth = Math.abs(photo.width - stage.width) <= 1;
    const fillsHeight = Math.abs(photo.height - stage.height) <= 1;
    expect(fillsWidth || fillsHeight).toBe(true);

    const identity = await box(page, '[data-strip-identity]');
    const data = await box(page, '[data-strip-data]');
    expect(data.x).toBeGreaterThan(identity.x + identity.width);
    expect(Math.abs(data.y - identity.y)).toBeLessThanOrEqual(1);
  });

  test('375 x 800 scroll tier: back link row, sticky chrome, full-width photo, one-column strip', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`/photos/${subject.slug}`);

    const link = page.getByRole('link', { name: `Back to ${ZERMATT_BACK.name}`, exact: true });
    await expect(link).toHaveCount(1);
    await expect(page.locator('[data-viewer-back]').getByRole('link')).toBeVisible();
    const linkBox = (await link.boundingBox())!;
    const chrome = await box(page, '[data-viewer-chrome]');
    expect(linkBox.y + linkBox.height).toBeLessThanOrEqual(chrome.y + 0.5);
    expect(chrome.height).toBe(LB_CHROME_PX);
    expect(
      await page
        .locator('[data-viewer-chrome]')
        .evaluate((el) => [getComputedStyle(el).position, getComputedStyle(el).top])
    ).toEqual(['sticky', `${NAV_H}px`]);

    const photo = await box(page, '[data-photo-box]');
    expect(Math.abs(photo.width / photo.height - ratio) / ratio).toBeLessThan(0.01);
    expect(photo.height).toBeLessThanOrEqual(800 * 0.7 + 0.5);
    // Full width of the viewer (the stable scrollbar gutter is outside it), unless 70svh caps it.
    const stage = await box(page, '[data-viewer-stage]');
    if (800 * 0.7 * ratio >= stage.width) {
      expect(Math.abs(photo.width - stage.width)).toBeLessThanOrEqual(1);
    } else {
      expect(Math.abs(photo.height - 800 * 0.7)).toBeLessThanOrEqual(1);
    }

    const identity = await box(page, '[data-strip-identity]');
    const data = await box(page, '[data-strip-data]');
    expect(data.y).toBeGreaterThanOrEqual(identity.y + identity.height);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });
});

test.describe('Stage states (UI-SPEC E5)', () => {
  // The production service worker answers cached derivatives itself, so
  // page.route would never see them (STATE 09-22); block it for these cases.
  test.use({ serviceWorkers: 'block' });

  const subject = viewBySlug(SLUGS.matterhornFromZermatt);
  /** Every stage and opener derivative (the 1024, 1600 and 2560 AVIF and WebP files). */
  const STAGE_DERIVATIVE = /-(1024|1600|2560)\.[0-9a-f]{10}\.(avif|webp)$/;

  test('a failed photo shows the error and Retry; the chrome and strip stay usable (LBOX-07)', async ({
    page,
  }) => {
    await page.route(STAGE_DERIVATIVE, (route) => route.abort());
    await page.goto(`/photos/${subject.slug}`);

    const photoBox = page.locator('[data-photo-viewer] [data-photo-box]');
    await expect(photoBox.getByText("Couldn't load this photo.", { exact: true })).toBeVisible();
    const retry = photoBox.getByRole('button', { name: 'Retry loading photo', exact: true });
    await expect(retry).toBeVisible();
    await expect(retry).toHaveText('Retry');
    await expect(page.locator('[data-stage-photo]')).toHaveAttribute('data-state', 'error');

    // The box keeps the photo's ratio.
    const rect = (await photoBox.boundingBox())!;
    const ratio = subject.aspect.w / subject.aspect.h;
    expect(Math.abs(rect.width / rect.height - ratio) / ratio).toBeLessThan(0.01);

    // The strip and the chrome stay usable; nothing offers the file.
    const main = page.getByRole('main');
    await expect(main.getByText(subject.rights, { exact: true })).toBeVisible();
    await expect(
      main.getByRole('link', { name: `Back to ${ZERMATT_BACK.name}`, exact: true })
    ).toBeVisible();
    await expect(page.locator('[download]')).toHaveCount(0);
    await expect(page.locator('a[href*="/images/"]')).toHaveCount(0);
  });

  test('Retry reloads the large derivative once the network is back', async ({ page }) => {
    await page.route(STAGE_DERIVATIVE, (route) => route.abort());
    await page.goto(`/photos/${subject.slug}`);
    const photoBox = page.locator('[data-photo-viewer] [data-photo-box]');
    const retry = photoBox.getByRole('button', { name: 'Retry loading photo', exact: true });
    await expect(retry).toBeVisible();

    await page.unroute(STAGE_DERIVATIVE);
    await retry.click();

    const large = photoBox.locator('[data-stage-layer="large"] img');
    await expect
      .poll(() => large.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
    await expect(page.locator('[data-stage-photo]')).toHaveAttribute('data-state', 'large');
    await expect(photoBox.getByText("Couldn't load this photo.", { exact: true })).toHaveCount(0);
    await expect(retry).toHaveCount(0);
  });

  test('a slow photo shows "Loading photo" after 1 s and clears it once the photo loads', async ({
    page,
  }) => {
    // Hold every stage derivative until the message has been seen (at least 1.5 s),
    // so the check does not depend on how fast the dev server hydrates.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route(STAGE_DERIVATIVE, async (route) => {
      await gate;
      await route.continue();
    });

    const start = Date.now();
    await page.goto(`/photos/${subject.slug}`, { waitUntil: 'domcontentloaded' });
    const photoBox = page.locator('[data-photo-viewer] [data-photo-box]');
    const loading = photoBox.getByText('Loading photo', { exact: true });
    await expect(page.locator('[data-stage-photo]')).toHaveAttribute('data-state', 'opener');
    await expect(loading).toBeVisible({ timeout: 10000 });
    expect(Date.now() - start).toBeGreaterThanOrEqual(1000);

    await page.waitForTimeout(Math.max(0, 1500 - (Date.now() - start)));
    release();

    await expect(loading).toHaveCount(0);
    const large = photoBox.locator('[data-stage-layer="large"] img');
    await expect
      .poll(() => large.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
  });
});

/**
 * The Zermatt region page (18-08), the stepping set's own surface: its figure links
 * (`[data-photo-id]`) open the lightbox, and every close returns there (ZERMATT_URL).
 * It replaced the grid as the opener of every lightbox test here (18-19; PHOTO-06).
 */
const ZERMATT_PATH = '/photos/regions/zermatt';

/**
 * Wait until React has hydrated a link. A click on a server-rendered
 * next/link before hydration is a plain document navigation, which is never
 * intercepted (it would land on the full page and no dialog would open), and
 * the dev server can take seconds to hydrate under parallel load.
 */
async function waitForHydration(link: Locator) {
  await expect
    .poll(() => link.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))), {
      timeout: 15000,
    })
    .toBe(true);
}

/**
 * Record every client-side navigation request the page starts: an RSC fetch
 * (`rsc: 1`) that is not a prefetch (no `next-router-prefetch`), as a
 * pathname. Next starts that fetch inside router.push(), so a read right after
 * a key press shows whether the press navigated.
 */
async function recordNavigations(page: Page) {
  await page.addInitScript(() => {
    const record: string[] = [];
    (window as unknown as { __navigations: string[] }).__navigations = record;
    const original = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const request = input instanceof Request ? input : null;
      const headers = new Headers(init?.headers ?? request?.headers);
      if (headers.get('rsc') === '1' && !headers.has('next-router-prefetch')) {
        record.push(new URL(request ? request.url : String(input), location.href).pathname);
      }
      return original(input, init);
    };
  });
}

/** The navigation requests recordNavigations() has seen so far. */
const navigations = (page: Page) =>
  page.evaluate(() => [...(window as unknown as { __navigations: string[] }).__navigations]);

/** Click a photo's figure link (already on the Zermatt region page) once hydrated, and wait for the dialog. */
async function clickFigure(page: Page, slug: string) {
  const link = page.locator(`[data-photo-id="${slug}"]`);
  await expect(link).toHaveCount(1);
  await waitForHydration(link);
  await link.click();
  const dialog = page.getByRole('dialog');
  // The dev server compiles the intercepted route on its first request.
  await expect(dialog).toBeVisible({ timeout: 20000 });
  return dialog;
}

/** Open a Zermatt photo (the series' first by default) in-site from its figure link. */
async function openFigure(page: Page, slug: string = series[0].slug) {
  await page.goto(ZERMATT_PATH);
  return clickFigure(page, slug);
}

test.describe('Lightbox over the gallery (LBOX-01)', () => {
  const first = series[0];

  test('a figure click opens the photo in a dialog over the region page', async ({ page }) => {
    const dialog = await openFigure(page);
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(dialog).toHaveAccessibleName(first.title);
    await expect(dialog.getByRole('heading', { level: 2, name: first.title })).toBeVisible();
    // The region page stays mounted behind the dialog, inside the one shell.
    // The page behind a modal dialog is inert, so these queries include it.
    await expect(page.locator('section[data-region-sequence]')).toHaveCount(1);
    await expect(page.getByRole('banner', { includeHidden: true })).toHaveCount(1);
    await expect(page).toHaveTitle(`${first.title} · Tim Lui`);
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('Back closes it, Forward reopens it, reload lands on the full page @no-win-webkit', async ({
    page,
  }) => {
    await openFigure(page);

    await page.goBack();
    await expect(page).toHaveURL(ZERMATT_URL);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(first.title);
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('the Close photo button closes it and the URL returns to the region page @no-win-webkit', async ({
    page,
  }) => {
    const dialog = await openFigure(page);
    await dialog.getByRole('button', { name: 'Close photo', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(ZERMATT_URL);
  });
});

test.describe('Focus and Escape (LBOX-03)', () => {
  const first = series[0];

  /** True when document.activeElement is inside the open dialog. */
  const focusInDialog = (page: Page) =>
    page.evaluate(() => document.activeElement?.closest('dialog[open]') != null);

  test('focus moves to Close photo on open', async ({ page }) => {
    const dialog = await openFigure(page);
    await expect(dialog.getByRole('button', { name: 'Close photo', exact: true })).toBeFocused();
  });

  test('Tab and Shift+Tab, 12 presses each, keep focus inside the dialog', async ({ page }) => {
    await openFigure(page);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await focusInDialog(page), `after Tab ${i + 1}`).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await focusInDialog(page), `after Shift+Tab ${i + 1}`).toBe(true);
    }
  });

  // The gutter labels stay visibility: hidden until their first measure, which React defers
  // while the open's view transition starts, so a Tab can arrive in that moment. They have
  // boxes but take no focus: counted as tabbable, Close would not be the last control and Tab
  // would leave the dialog. Holding them hidden makes that moment deterministic.
  test('Tab stays inside the dialog while the gutter labels are still hidden', async ({ page }) => {
    const dialog = await openFigure(page);
    await page
      .locator('dialog [data-hotspot-gutters]')
      .evaluate((el: HTMLElement) => el.style.setProperty('visibility', 'hidden'));
    await dialog.getByRole('button', { name: 'Close photo', exact: true }).focus();
    await page.keyboard.press('Tab');
    expect(await focusInDialog(page), 'after Tab from Close').toBe(true);
    await page.keyboard.press('Shift+Tab');
    expect(await focusInDialog(page), 'after Shift+Tab back').toBe(true);
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('Escape closes through the router and focus returns to the photo figure link @no-win-webkit', async ({
    page,
  }) => {
    await openFigure(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(ZERMATT_URL);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(first.slug);
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('three open-and-Escape cycles in a row each close with the URL in sync @no-win-webkit', async ({
    page,
  }) => {
    await page.goto(ZERMATT_PATH);
    for (let cycle = 1; cycle <= 3; cycle++) {
      await clickFigure(page, first.slug);
      await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog'), `cycle ${cycle}`).toHaveCount(0);
      await expect(page, `cycle ${cycle}`).toHaveURL(ZERMATT_URL);
    }
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('opening from a scrolled region page and closing leaves the scroll position unchanged @no-win-webkit', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await page.goto(ZERMATT_PATH);
    const third = page.locator(`[data-photo-id="${series[2].slug}"]`);
    // Centred, so the figure link and its 4 px focus ring are fully in view and the reveal on
    // close has nothing to do (LBOX-08, D-09). scrollIntoViewIfNeeded() can leave a trigger's
    // edge on the viewport's, ring clipped, which the reveal rightly fixes.
    await third.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const before = await page.evaluate(() => window.scrollY);
    expect(before, 'the region page must be scrolled to its third figure').toBeGreaterThan(0);

    await clickFigure(page, series[2].slug);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(series[2].slug);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test("on the photo page, Escape goes to the photo's region page (D-08, 18 D-09)", async ({
    page,
  }) => {
    await page.goto(`/photos/${first.slug}`);
    const back = page
      .getByRole('main')
      .getByRole('link', { name: `Back to ${ZERMATT_BACK.name}` })
      .first();
    await waitForHydration(back);
    await page.waitForLoadState('load');
    // The listener attaches in an effect just after hydration; under parallel
    // dev-server load a press can land before it, so press again until it does.
    await expect(async () => {
      await page.keyboard.press('Escape');
      await expect(page).toHaveURL(ZERMATT_URL, { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('on the photo page at 375, the open nav menu keeps its keys: Escape closes it and the photo stays (10-REVIEW CR-01)', async ({
    page,
    browserName,
  }) => {
    await recordNavigations(page);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`/photos/${first.slug}`);
    const main = page.getByRole('main');
    const next = main.getByRole('button', { name: 'Next photo', exact: true });
    const zoom = main.getByRole('button', { name: 'Zoom photo', exact: true });
    const hide = main.getByRole('button', { name: 'Hide labels', exact: true });
    const menuButton = page.getByRole('banner').getByRole('button', { name: 'Menu', exact: true });
    const menu = page.locator('#site-menu');
    await waitForHydration(next);
    await waitForHydration(menuButton);
    await page.waitForLoadState('load');
    const length = await page.evaluate(() => window.history.length);

    // The viewer's keys are live: from the content, → and ← step.
    await next.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`/photos/${series[1].slug}$`));
    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));

    // A keyboard user opens the menu and moves into it.
    await menuButton.focus();
    await page.keyboard.press('Enter');
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();
    // The menu rows are links, which WebKit never Tabs to (helpers/engine.ts).
    if (tabReachesLinks(browserName)) await page.keyboard.press('Tab');
    else await menu.getByRole('link').first().focus();
    await expect(menu.getByRole('link').first()).toBeFocused();

    // The arrows, Z and H belong to the menu now, not to the photo behind it. A
    // step (replaceState) and Hide labels (localStorage) would act inside the
    // key handler, so the reads right after each press are exact.
    for (const key of ['ArrowRight', 'ArrowLeft', 'z', 'h']) {
      await page.keyboard.press(key);
      expect(await page.evaluate(() => window.location.pathname), `after ${key}`).toBe(
        `/photos/${first.slug}`
      );
      expect(
        await page.evaluate((k) => window.localStorage.getItem(k), HOTSPOT_PREF_KEY),
        `after ${key}`
      ).toBeNull();
    }

    // Escape closes the menu to its button, and only the menu: the press
    // starts no navigation (router.push fetches inside the key handler, so the
    // read right after the press is exact).
    const before = await navigations(page);
    await page.keyboard.press('Escape');
    expect(await navigations(page), 'Escape in the menu navigated').toEqual(before);
    await expect(menu).toBeHidden();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toBeFocused();
    await expect(zoom).toHaveAttribute('aria-pressed', 'false');
    await expect(hide).toHaveAttribute('aria-pressed', 'false');

    // Still on the photo page: a step from the content works, and no history
    // entry was added (a stray router.push to the region page adds one).
    await next.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`/photos/${series[1].slug}$`));
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(series[1].title);
    expect(await page.evaluate(() => window.history.length)).toBe(length);

    // From the content, Escape still goes to the region page (D-08, 18 D-09), and
    // the recorder sees that navigation (so its silence above is meaningful).
    // Polled: router.push may issue its RSC fetch after the key handler
    // returns, and a loaded WebKit runner read [] here once (13-15, PR #143).
    await page.keyboard.press('Escape');
    await expect
      .poll(() => navigations(page), { message: 'Escape from the content did not navigate' })
      .toEqual([...before, ZERMATT_BACK.href]);
    await expect(page).toHaveURL(ZERMATT_URL);
  });
});

test.describe('Moving between photos (LBOX-02)', () => {
  const first = series[0];
  const last = series[series.length - 1];

  /** The viewer's counter ('n / 7' in Zermatt, aria-hidden) and its polite status line. */
  const counter = (scope: Page | Locator) => scope.locator('[data-photo-counter]');
  const status = (scope: Page | Locator) => scope.locator('[data-photo-viewer] p[role="status"]');

  test('Next presses to the last photo: URL, title, counter, focus and no history entry', async ({
    page,
    browserName,
  }) => {
    const dialog = await openFigure(page);
    const length = await page.evaluate(() => window.history.length);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    await expect(counter(dialog)).toHaveText(`1 / ${series.length}`);
    await expect(counter(dialog)).toHaveAttribute('aria-hidden', 'true');

    // A click, or focus and Enter in WebKit, where a click does not focus a button (helpers/engine.ts).
    // The presses run through Zermatt's whole series (LBOX-09) and end on its last photo.
    for (let i = 1; i < series.length; i++) {
      await pressButton(next, browserName);
      await expect(counter(dialog)).toHaveText(`${i + 1} / ${series.length}`);
    }

    await expect(page).toHaveURL(new RegExp(`/photos/${last.slug}$`));
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(last.title);
    await expect(counter(dialog)).toHaveText(`${series.length} / ${series.length}`);
    // On the region's last photo Next stays enabled: it leads to the end-of-series card
    // (18-16; LBOX-09, D-12), asserted in e2e/photos-stepping.spec.ts.
    await expect(next).not.toHaveAttribute('aria-disabled', 'true');
    await expect(next).toBeFocused();
    await expect(status(dialog)).toHaveText(
      `Photo ${series.length} of ${series.length}: ${last.title}`
    );
    await expect(status(dialog)).toHaveAttribute('aria-atomic', 'true');
    await expect(page).toHaveTitle(`${last.title} · Tim Lui`);
    expect(await page.evaluate(() => window.history.length)).toBe(length);
    // The viewer never remounted: the dialog is still the open one.
    await expect(page.getByRole('dialog')).toHaveCount(1);
  });

  test('the arrow keys step, and nothing moves past either end', async ({ page, browserName }) => {
    const dialog = await openFigure(page);
    const prev = dialog.getByRole('button', { name: 'Previous photo', exact: true });
    await expect(prev).toHaveAttribute('aria-disabled', 'true');

    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`/photos/${series[1].slug}$`));
    await expect(counter(dialog)).toHaveText(`2 / ${series.length}`);

    await page.keyboard.press('ArrowLeft');
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(counter(dialog)).toHaveText(`1 / ${series.length}`);

    // At 1 / 7 neither ArrowLeft nor a press on the disabled Previous changes anything.
    await page.keyboard.press('ArrowLeft');
    await pressButton(prev, browserName, { force: true });
    await expect(prev).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(counter(dialog)).toHaveText(`1 / ${series.length}`);
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(first.title);
    // The ignored presses announce nothing new: the line still names the last real step.
    await expect(status(dialog)).toHaveText(`Photo 1 of ${series.length}: ${first.title}`);
  });

  // Opened from the Zermatt sequence (18-19), whose figures load the same derivatives, so a
  // network wait cannot tell the preload from a figure: the test records the viewer's
  // `new Image()` preloads instead and reads what each one loaded (13 #33: in the format
  // the stage loaded, AVIF or WebP, never the AVIF set unconditionally).
  test('preload: opening a photo fetches the next photo derivative before Next is pressed', async ({
    page,
  }) => {
    const nextView = series[1];
    const pathsOf = (srcset: string) =>
      new Set(
        srcset.split(',').map((u) => new URL(u.trim().split(' ')[0], 'http://localhost').pathname)
      );
    const sets = {
      avif: pathsOf(nextView.stage.srcSetAvif),
      webp: pathsOf(nextView.stage.srcSetWebp),
    };
    for (const set of Object.values(sets)) {
      expect(set.size).toBeGreaterThan(1);
      for (const u of set) expect(u).toMatch(DERIVATIVE);
    }

    await page.addInitScript(() => {
      const made: HTMLImageElement[] = [];
      (window as unknown as { __preloads: HTMLImageElement[] }).__preloads = made;
      const Original = window.Image;
      window.Image = class extends Original {
        constructor(width?: number, height?: number) {
          super(width, height);
          made.push(this);
        }
      } as typeof Image;
    });
    await page.goto(ZERMATT_PATH);
    const dialog = await clickFigure(page, series[0].slug);
    const stage = dialog.locator('[data-stage-layer="large"] img');
    await expect
      .poll(() => stage.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), {
        timeout: 15000,
      })
      .toBe(true);
    const format = await stage.evaluate((el: HTMLImageElement) =>
      new URL(el.currentSrc).pathname.endsWith('.avif') ? 'avif' : 'webp'
    );

    // The preloads the viewer started, and the file each one has finished loading.
    const preloads = () =>
      page.evaluate(() =>
        (window as unknown as { __preloads: HTMLImageElement[] }).__preloads.map((img) => ({
          srcset: img.srcset,
          loaded: img.complete && img.naturalWidth > 0 ? new URL(img.currentSrc).pathname : null,
        }))
      );
    await expect
      .poll(async () => (await preloads()).some((p) => p.loaded && sets[format].has(p.loaded)), {
        message: `a preload loaded one of ${nextView.slug}'s ${format} derivatives`,
        timeout: 20000,
      })
      .toBe(true);
    // Each preload asked for the stage's format only.
    const other = format === 'avif' ? '.webp' : '.avif';
    for (const p of await preloads()) expect(p.srcset).not.toContain(other);
    // Still on the first photo: the fetch came from the preload, not from a step.
    await expect(page).toHaveURL(new RegExp(`/photos/${series[0].slug}$`));
  });

  test('a touch swipe on the photo steps to the next photo @chromium-only', async ({ page }) => {
    const dialog = await openFigure(page);
    const photoBox = dialog.locator('[data-photo-box]');
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

    await expect(page).toHaveURL(new RegExp(`/photos/${series[1].slug}$`));
    await expect(counter(dialog)).toHaveText(`2 / ${series.length}`);
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('closing after two steps returns focus to the figure link of the photo shown @no-win-webkit', async ({
    page,
  }) => {
    const dialog = await openFigure(page);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    await next.click();
    await next.click();
    await expect(page).toHaveURL(new RegExp(`/photos/${series[2].slug}$`));

    await dialog.getByRole('button', { name: 'Close photo', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(ZERMATT_URL);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(series[2].slug);
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('browser Back right after a step returns focus to the figure link of the photo shown (10-REVIEW WR-01) @no-win-webkit', async ({
    page,
  }) => {
    const dialog = await openFigure(page);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    await waitForHydration(next);
    // The step and the Back in one task: usePathname has not caught up with
    // the step's replaceState when the lightbox closes.
    await next.evaluate((button: HTMLElement) => {
      button.click();
      window.history.back();
    });
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(ZERMATT_URL);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(series[1].slug);
  });

  test('on the photo page Next shows the next photo with no dialog, and reload keeps it (Pitfall 1)', async ({
    page,
    browserName,
  }) => {
    await page.goto(`/photos/${first.slug}`);
    const main = page.getByRole('main');
    const next = main.getByRole('button', { name: 'Next photo', exact: true });
    await waitForHydration(next);
    const length = await page.evaluate(() => window.history.length);

    await pressButton(next, browserName);
    await expect(page).toHaveURL(new RegExp(`/photos/${series[1].slug}$`));
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(series[1].title);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(next).toBeFocused();
    await expect(page).toHaveTitle(`${series[1].title} · Tim Lui`);
    expect(await page.evaluate(() => window.history.length)).toBe(length);

    await page.reload();
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText(
      series[1].title
    );
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

/**
 * Focus on close stays in view (LBOX-08; 14-CONTEXT D-08 to D-11, 14-RESEARCH). Every close is
 * a history traversal, and the browser's scroll restoration used to undo the reveal, so focus
 * landed on a trigger off-screen. The contract asserted here is view-agnostic (D-11): focus is
 * on `[data-photo-id={shown slug}]`, and that box inflated by the 4 px ring lies inside the
 * viewport below `--nav-h`. Phase 18 rewrote only the open-and-step setup, as planned, never
 * the assertion (18-15; PHOTO-06): every viewer now steps through its photo's region series
 * (LBOX-09), and the retiring Map, Grid and Carousel views show only the v2.0 four, so a step
 * to Zermatt's seventh photo had no trigger there. The matrix runs on the region pages, whose
 * figure links carry `data-photo-id`: the Map rows on Zermatt, the Grid rows on Ortler and the
 * Carousel rows on Saalfelden, each with its size, setup, close path and tags. Each row first
 * proves the shown photo's trigger is off-screen while the dialog is still open, so it really
 * exercises the reveal. The two setups (14-RESEARCH Pitfall 4):
 * (a) bottom edge: from scrollY 0, the trigger of the series' last photo sits below the fold;
 * (b) top edge: from the page end, it sits above the viewport, under the nav.
 * Each row records the scroll delta the reveal applied as a `reveal-delta` annotation.
 */
// @no-win-webkit: history Back while the open's View Transition commit settles crashes
// Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
// in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
test.describe('Focus on close stays in view (LBOX-08)', () => {
  /** The global focus ring: a 2 px outline at a 2 px offset (app/globals.css :focus-visible). */
  const RING_PX = 4;

  type Surface = 'Zermatt' | 'Ortler' | 'Saalfelden';
  type Close = 'Escape' | 'Close photo' | 'browser Back';
  type Row = {
    surface: Surface;
    width: number;
    height: number;
    setup: 'a' | 'b';
    close: Close;
    tags: string;
  };

  /** The region page each surface is: its id, its path and the URL a close returns to. */
  const SURFACE_URL: Record<Surface, { id: string; path: string; url: RegExp }> = {
    Zermatt: { id: 'zermatt', path: '/photos/regions/zermatt', url: /\/photos\/regions\/zermatt$/ },
    Ortler: { id: 'ortler', path: '/photos/regions/ortler', url: /\/photos\/regions\/ortler$/ },
    Saalfelden: {
      id: 'saalfelden',
      path: '/photos/regions/saalfelden',
      url: /\/photos\/regions\/saalfelden$/,
    },
  };

  /** The D-11 matrix engine is Chromium; every history close carries @no-win-webkit. */
  const CHROMIUM = '@chromium-only @no-win-webkit';
  const ROWS: Row[] = [
    // The cross-engine row (D-11): Chromium, Firefox and Linux WebKit.
    {
      surface: 'Zermatt',
      width: 720,
      height: 450,
      setup: 'a',
      close: 'Escape',
      tags: '@no-win-webkit',
    },
    // Zermatt (the Map rows' surface): from the top, the seventh figure is below the fold.
    { surface: 'Zermatt', width: 1366, height: 650, setup: 'a', close: 'Escape', tags: CHROMIUM },
    { surface: 'Zermatt', width: 1280, height: 560, setup: 'a', close: 'Escape', tags: CHROMIUM },
    { surface: 'Zermatt', width: 375, height: 667, setup: 'b', close: 'Escape', tags: CHROMIUM },
    // Ortler (the Grid rows' surface): from the top, the second figure is below the fold.
    { surface: 'Ortler', width: 1366, height: 650, setup: 'a', close: 'Escape', tags: CHROMIUM },
    { surface: 'Ortler', width: 1280, height: 560, setup: 'a', close: 'Escape', tags: CHROMIUM },
    { surface: 'Ortler', width: 720, height: 450, setup: 'a', close: 'Escape', tags: CHROMIUM },
    { surface: 'Ortler', width: 375, height: 667, setup: 'a', close: 'Escape', tags: CHROMIUM },
    // Saalfelden (the Carousel rows' surface): every size starts at the page end and the
    // second figure ends above the viewport, under the nav.
    {
      surface: 'Saalfelden',
      width: 1366,
      height: 650,
      setup: 'b',
      close: 'Escape',
      tags: CHROMIUM,
    },
    {
      surface: 'Saalfelden',
      width: 1280,
      height: 560,
      setup: 'b',
      close: 'Escape',
      tags: CHROMIUM,
    },
    { surface: 'Saalfelden', width: 720, height: 450, setup: 'b', close: 'Escape', tags: CHROMIUM },
    { surface: 'Saalfelden', width: 375, height: 667, setup: 'b', close: 'Escape', tags: CHROMIUM },
    // The other two close paths (D-10), through the same restoreFocus.
    {
      surface: 'Zermatt',
      width: 720,
      height: 450,
      setup: 'a',
      close: 'Close photo',
      tags: CHROMIUM,
    },
    {
      surface: 'Zermatt',
      width: 720,
      height: 450,
      setup: 'a',
      close: 'browser Back',
      tags: CHROMIUM,
    },
    // Browser Back beyond Chromium (14 IN-06): Back is the close most tied to the engine's
    // history scroll restoration, which the next-frame re-reveal races. This row guards that
    // timing in Firefox and Linux WebKit. Chromium runs the row above instead (@not-chromium,
    // 15 IN-03).
    {
      surface: 'Zermatt',
      width: 720,
      height: 450,
      setup: 'a',
      close: 'browser Back',
      tags: '@no-win-webkit @not-chromium',
    },
  ];

  /**
   * Where `[data-photo-id={slug}]` is: 'missing', 'in-view' (its box inflated by the ring lies
   * inside the viewport below --nav-h) or 'off-screen' (any part of that box is outside).
   * `focused` reads document.activeElement instead, which must carry the slug.
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
        // Mirrors revealTrigger's navHeightPx and viewport (14-REVIEW IN-01, IN-02): a probe
        // sized var(--nav-h) resolves any unit, so a rem or calc() nav cannot be misread here
        // in agreement with a broken reveal; clientHeight excludes a horizontal scrollbar.
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

  /** The D-11 outcome: focus on the shown photo's trigger, fully in view with its ring. */
  async function expectTriggerFullyInView(page: Page, slug: string) {
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(slug);
    await expect
      .poll(() => triggerState(page, slug, true), {
        message: `the focused [data-photo-id="${slug}"] and its ring are fully in view`,
      })
      .toBe('in-view');
  }

  /** The row's precondition, checked while the dialog is open: the trigger is off-screen. */
  async function expectTriggerOffscreen(page: Page, slug: string) {
    await expect
      .poll(() => triggerState(page, slug, false), {
        message: `[data-photo-id="${slug}"] must start off-screen, or the row proves nothing`,
      })
      .toBe('off-screen');
  }

  /**
   * Open the series' first photo from its figure link on the region page, without moving the
   * page: focus without a scroll, then Enter (a click would scroll the trigger into view
   * first). Setup (a) starts at scrollY 0, setup (b) at the page end.
   */
  async function openFirst(page: Page, setup: 'a' | 'b', first: { slug: string }) {
    const trigger = page.locator(`[data-photo-id="${first.slug}"]`);
    await expect(trigger).toHaveCount(1);
    await waitForHydration(trigger);
    await page.evaluate((toEnd) => {
      const top = toEnd ? document.documentElement.scrollHeight : 0;
      window.scrollTo({ top, behavior: 'instant' });
    }, setup === 'b');
    if (setup === 'b') {
      expect(
        await page.evaluate(() => window.scrollY),
        'setup (b) starts scrolled'
      ).toBeGreaterThan(0);
    }
    await trigger.evaluate((el: HTMLElement) => el.focus({ preventScroll: true }));
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    return dialog;
  }

  /** Press 'Next photo' until the series' last photo is shown, checking 'n / N' at each step. */
  async function stepToLast(
    page: Page,
    dialog: Locator,
    browserName: string,
    steps: readonly { slug: string }[]
  ) {
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    const counter = dialog.locator('[data-photo-counter]');
    await waitForHydration(next);
    for (let n = 2; n <= steps.length; n++) {
      await pressButton(next, browserName);
      await expect(counter).toHaveText(`${n} / ${steps.length}`);
    }
    await expect(page).toHaveURL(new RegExp(`/photos/${steps[steps.length - 1].slug}$`));
  }

  /** Close by the row's path; all three end in restoreFocus through a history traversal. */
  async function closeBy(page: Page, dialog: Locator, close: Close) {
    if (close === 'Escape') await page.keyboard.press('Escape');
    else if (close === 'Close photo') {
      await dialog.getByRole('button', { name: 'Close photo', exact: true }).click();
    } else await page.goBack();
  }

  for (const row of ROWS) {
    const { surface, width, height, setup, close, tags } = row;
    test(`${surface} at ${width}x${height}: step to the last photo, ${close}, the trigger is fully in view ${tags}`, async ({
      page,
      browserName,
    }) => {
      const steps = regionPhotoViews(SURFACE_URL[surface].id);
      expect(steps.length, `${surface} has a series to step through`).toBeGreaterThan(1);
      const last = steps[steps.length - 1];
      await page.setViewportSize({ width, height });
      await page.goto(SURFACE_URL[surface].path);
      const dialog = await openFirst(page, setup, steps[0]);
      await stepToLast(page, dialog, browserName, steps);
      await expectTriggerOffscreen(page, last.slug);
      const before = await page.evaluate(() => window.scrollY);

      await closeBy(page, dialog, close);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page).toHaveURL(SURFACE_URL[surface].url);
      await expectTriggerFullyInView(page, last.slug);

      const after = await page.evaluate(() => window.scrollY);
      test.info().annotations.push({
        type: 'reveal-delta',
        description: `setup (${setup}): scrollY ${before} -> ${after} (${after - before >= 0 ? '+' : ''}${after - before} px)`,
      });
    });
  }
});

test.describe('Morph and motion (LBOX-06)', () => {
  const first = series[0];
  /** The morph pair's pseudo-elements for a slug. */
  const morphPseudos = (slug: string) => [
    `::view-transition-group(photo-${slug})`,
    `::view-transition-old(photo-${slug})`,
    `::view-transition-new(photo-${slug})`,
  ];

  // P4 (18-01, the defaults): the sequence figure carries the photo-{slug} name while no
  // photo is open (FigureTransition, 18-08), so it morphs into the lightbox stage.
  test('opening from the sequence morphs the figure into the lightbox photo @chromium-only', async ({
    page,
  }) => {
    await recordViewTransitions(page);
    await page.goto(ZERMATT_PATH);
    const before = await readViewTransitions(page);
    await clickFigure(page, first.slug);

    await expect
      .poll(async () => (await readViewTransitions(page)).count)
      .toBeGreaterThan(before.count);
    await expect
      .poll(async () => (await readViewTransitions(page)).pseudos)
      .toEqual(expect.arrayContaining(morphPseudos(first.slug)));
  });

  test('browser Back closes with no view transition @chromium-only', async ({ page }) => {
    await recordViewTransitions(page);
    await openFigure(page);
    await expect.poll(async () => (await readViewTransitions(page)).count).toBeGreaterThan(0);
    // The open transition has finished before measuring.
    const before = (await waitForViewTransitionsSettled(page)).count;

    await page.goBack();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // Settled first (10-REVIEW IN-09): focus is back on the figure link, the close's last step, so a
    // transition the popstate commit started is already counted, and every one has finished.
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-photo-id')))
      .toBe(first.slug);
    expect((await waitForViewTransitionsSettled(page)).count).toBe(before);
  });

  test('a step morphs nothing: no photo-* pseudo-element @chromium-only', async ({ page }) => {
    await recordViewTransitions(page);
    const dialog = await openFigure(page);
    // The open transition has finished before measuring.
    const before = (await waitForViewTransitionsSettled(page)).transitions.length;

    await dialog.getByRole('button', { name: 'Next photo', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/photos/${series[1].slug}$`));
    // Settled first (10-REVIEW IN-09): the step has rendered the next photo's title, and every
    // transition started so far has finished, so its pseudo-elements are recorded.
    await expect(dialog.getByRole('heading', { level: 2, name: series[1].title })).toBeVisible();
    const after = (await waitForViewTransitionsSettled(page)).transitions.slice(before).flat();
    expect(after.filter((pseudo) => pseudo.includes('photo-'))).toEqual([]);
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('no duplicate view-transition-name across open, three steps and close @no-win-webkit', async ({
    page,
  }) => {
    const messages: string[] = [];
    page.on('console', (message) => {
      // The browser's duplicate-name error, and React's dev warning for two
      // mounted <ViewTransition> boundaries with one name.
      if (/view-transition-name|ViewTransition name=/.test(message.text())) {
        messages.push(message.text());
      }
    });
    const dialog = await openFigure(page);
    const next = dialog.getByRole('button', { name: 'Next photo', exact: true });
    for (let i = 1; i <= 3; i++) {
      await next.click();
      await expect(page).toHaveURL(new RegExp(`/photos/${series[i].slug}$`));
    }
    await dialog.getByRole('button', { name: 'Close photo', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(messages).toEqual([]);
  });

  test('under reduced motion the open runs no view-transition animation @chromium-only', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await recordViewTransitions(page);
    await page.goto(ZERMATT_PATH);
    const before = await readViewTransitions(page);
    const dialog = await clickFigure(page, first.slug);
    await expect(dialog.getByRole('button', { name: 'Close photo', exact: true })).toBeFocused();

    // Settled first (10-REVIEW IN-09): every transition the open started has finished.
    const after = await waitForViewTransitionsSettled(page);
    const opened = after.transitions.slice(before.transitions.length).flat();
    expect(opened.filter((pseudo) => pseudo.startsWith('::view-transition'))).toEqual([]);
  });

  test('without the View Transitions API the figure still opens with focus on Close', async ({
    page,
  }) => {
    await removeViewTransitions(page);
    await page.goto(ZERMATT_PATH);
    expect(await page.evaluate(() => 'startViewTransition' in document)).toBe(false);
    const dialog = await clickFigure(page, first.slug);
    await expect(page).toHaveURL(new RegExp(`/photos/${first.slug}$`));
    await expect(dialog.getByRole('button', { name: 'Close photo', exact: true })).toBeFocused();
  });
});

test.describe('Zoom (D-06)', () => {
  /** A landscape photo (2560 px wide at 1:1) that has a next photo, and its series position. */
  const zi = series.findIndex((v, i) => v.stage.width === 2560 && i < series.length - 1);
  const photo = series[zi];
  const nextPhoto = series[zi + 1];

  const zoomButton = (scope: Page | Locator) =>
    scope.getByRole('button', { name: 'Zoom photo', exact: true });
  const stage = (scope: Page | Locator) => scope.locator('[data-viewer-stage]');
  const zoomedImg = (scope: Page | Locator) => scope.locator('[data-zoom-photo] img');
  const scrollOf = (scope: Page | Locator) =>
    stage(scope).evaluate((el) => ({ left: el.scrollLeft, top: el.scrollTop }));

  /** Open the landscape photo in the lightbox from its Zermatt figure link at 1440 x 900. */
  async function openZoomPhoto(page: Page) {
    expect(zi, 'a landscape photo with a next photo').toBeGreaterThanOrEqual(0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ZERMATT_PATH);
    return clickFigure(page, photo.slug);
  }

  /** Wait until the zoomed 1:1 photo has decoded. */
  async function zoomedLoaded(scope: Page | Locator) {
    await expect
      .poll(() =>
        zoomedImg(scope).evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)
      )
      .toBe(2560);
  }

  test('Z zooms to 1:1 of the 2560 px derivative and the stage scrolls', async ({ page }) => {
    const dialog = await openZoomPhoto(page);
    const button = zoomButton(dialog);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toHaveAttribute('aria-keyshortcuts', 'z');

    await page.keyboard.press('z');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await zoomedLoaded(dialog);
    const rect = (await zoomedImg(dialog).boundingBox())!;
    expect(Math.abs(rect.width - 2560)).toBeLessThanOrEqual(1);
    const { scrollWidth, clientWidth } = await stage(dialog).evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(scrollWidth).toBeGreaterThan(clientWidth);
    // Z centres the photo.
    const centred = await stage(dialog).evaluate((el) => ({
      left: (el.scrollWidth - el.clientWidth) / 2,
      top: (el.scrollHeight - el.clientHeight) / 2,
    }));
    const scroll = await scrollOf(dialog);
    expect(Math.abs(scroll.left - centred.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(scroll.top - centred.top)).toBeLessThanOrEqual(1);
  });

  test('the arrows pan 80 px while zoomed; after Escape they step again', async ({ page }) => {
    const dialog = await openZoomPhoto(page);
    await page.keyboard.press('z');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    const url = page.url();
    const before = await scrollOf(dialog);

    await page.keyboard.press('ArrowRight');
    await expect.poll(async () => (await scrollOf(dialog)).left).toBe(before.left + 80);
    await page.keyboard.press('ArrowDown');
    await expect.poll(async () => (await scrollOf(dialog)).top).toBe(before.top + 80);
    expect(page.url()).toBe(url);

    await page.keyboard.press('Escape');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('dialog')).toHaveCount(1);

    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(new RegExp(`/photos/${nextPhoto.slug}$`));
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('Escape twice from zoomed closes the lightbox (LBOX-03) @no-win-webkit', async ({
    page,
  }) => {
    const dialog = await openZoomPhoto(page);
    await zoomButton(dialog).click();
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(ZERMATT_URL);
  });

  test('a click zooms at the point, a drag pans and a click without movement unzooms', async ({
    page,
  }) => {
    const dialog = await openZoomPhoto(page);
    const box = (await dialog.locator('[data-photo-box]').boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.click(cx, cy);
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    // The clicked point (the photo's centre) stays under the pointer: the 1:1
    // photo's x under cx is its middle column. Measured at the pointer, not as a
    // centred scroll, because WebKit adds a classic scrollbar only once the stage
    // scrolls, which moves the viewport's centre off the fitted photo's (12-23).
    const underPointer = await stage(dialog).evaluate(
      (el, x) => el.scrollLeft + x - el.getBoundingClientRect().left - el.clientLeft,
      cx
    );
    expect(Math.abs(underPointer - photo.stage.width / 2)).toBeLessThanOrEqual(2);
    const start = await scrollOf(dialog);

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 50, cy, { steps: 5 });
    await page.mouse.move(cx - 100, cy, { steps: 5 });
    await page.mouse.up();
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    const dragged = await scrollOf(dialog);
    expect(Math.abs(dragged.left - (start.left + 100))).toBeLessThanOrEqual(1);

    await page.mouse.click(cx, cy);
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'false');
  });

  test('Next photo while zoomed shows the next photo fitted', async ({ page }) => {
    const dialog = await openZoomPhoto(page);
    await page.keyboard.press('z');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    await dialog.getByRole('button', { name: 'Next photo', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/photos/${nextPhoto.slug}$`));
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'false');
    await expect(zoomedImg(dialog)).toHaveCount(0);
    await expect(dialog.locator('[data-photo-box]')).toBeVisible();
  });

  test("on the photo page, Escape leaves zoom first, then goes to the photo's region page", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/photos/${photo.slug}`);
    const main = page.getByRole('main');
    const button = zoomButton(main);
    await waitForHydration(button);
    await page.waitForLoadState('load');
    // The key listener attaches just after hydration; press until it takes.
    await expect(async () => {
      await page.keyboard.press('z');
      await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });

    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(page).toHaveURL(new RegExp(`/photos/${photo.slug}$`));
    await page.keyboard.press('Escape');
    // The dev server may compile the region page on this first visit.
    await expect(page).toHaveURL(new RegExp(`${photoBack(photo.id).href}$`), { timeout: 15000 });
  });

  test('native pinch-zoom is never blocked: touch-action keeps pinch-zoom in both states', async ({
    page,
  }) => {
    const dialog = await openZoomPhoto(page);
    const touchAction = () => stage(dialog).evaluate((el) => getComputedStyle(el).touchAction);
    const cursor = () => stage(dialog).evaluate((el) => getComputedStyle(el).cursor);
    expect(await touchAction()).toContain('pinch-zoom');
    expect(
      await dialog.locator('[data-photo-box]').evaluate((el) => getComputedStyle(el).cursor)
    ).toBe('zoom-in');

    await page.keyboard.press('z');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    // 'pan-x pan-y pinch-zoom' is exactly what 'manipulation' means, and Chromium
    // computes it to that keyword.
    expect(['manipulation', 'pan-x pan-y pinch-zoom']).toContain(await touchAction());
    expect(await cursor()).toBe('grab');
  });
});

test.describe('Hotspots (LBOX-05)', () => {
  const trail = series.findIndex((v) => v.id === 'img-0662');
  const lake = series.find((v) => v.id === 'r004-011')!;
  const labels = (scope: Page | Locator) => scope.locator('[data-hotspot-label]');
  const markers = (scope: Page | Locator) => scope.locator('[data-hotspot-marker]');
  const hideLabels = (scope: Page | Locator) =>
    scope.getByRole('button', { name: 'Hide labels', exact: true });
  const zoomButton = (scope: Page | Locator) =>
    scope.getByRole('button', { name: 'Zoom photo', exact: true });

  /** Open the Glacier Trail photo (two hotspots) from its Zermatt figure link at the given size. */
  async function openTrail(page: Page, width = 1440, height = 900) {
    expect(trail).toBeGreaterThanOrEqual(0);
    await page.setViewportSize({ width, height });
    await page.goto(ZERMATT_PATH);
    return clickFigure(page, series[trail].slug);
  }

  /** Load a photo page and wait until its key listeners are attached (they follow hydration). */
  async function loadPage(page: Page, slug: string) {
    await page.goto(`/photos/${slug}`);
    const button = hideLabels(page.getByRole('main'));
    await waitForHydration(button);
    await page.waitForLoadState('load');
    return button;
  }

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('gutter tier: Enter expands a label, Escape collapses it to the label, then closes @no-win-webkit', async ({
    page,
  }) => {
    const dialog = await openTrail(page);
    await expect(labels(dialog)).toHaveCount(2);
    const first = labels(dialog).first();
    await expect(first).toBeVisible();
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(labels(dialog).nth(1)).toHaveAttribute('aria-expanded', 'false');

    await first.focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    const link = dialog.getByRole('link', { name: 'Wikipedia (opens in a new tab)' }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    // The panel sits in the gutter, never over the photo.
    const panel = dialog.locator(`[id="${await first.getAttribute('aria-controls')}"]`);
    const box = (await dialog.locator('[data-photo-box]').boundingBox())!;
    const panelBox = (await panel.boundingBox())!;
    expect(panelBox.x).toBeGreaterThanOrEqual(box.x + box.width);

    // From inside the panel, Escape collapses it and focus returns to its label.
    await link.focus();
    await page.keyboard.press('Escape');
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(first).toBeFocused();
    await expect(page.getByRole('dialog')).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('with a callout open, H hides labels and one Escape closes the lightbox (D-12) @no-win-webkit', async ({
    page,
  }) => {
    const dialog = await openTrail(page);
    const first = labels(dialog).first();
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('h');
    await expect(hideLabels(dialog)).toHaveAttribute('aria-pressed', 'true');
    await expect(labels(dialog)).toHaveCount(0);
    // Hiding collapsed the callout, so nothing hidden holds the first Escape.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  // @no-win-webkit: history Back while the open's View Transition commit settles crashes
  // Playwright's Windows WebKit (WinCairo, not a Safari engine); Linux WebKit passes this test
  // in CI (12-23 triage, run 41565046890), so only the Windows webkit project drops it.
  test('with a callout open, the Hide labels button collapses it and one Escape closes the lightbox (D-12) @no-win-webkit', async ({
    page,
  }) => {
    const dialog = await openTrail(page);
    const first = labels(dialog).first();
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await hideLabels(dialog).click();
    await expect(hideLabels(dialog)).toHaveAttribute('aria-pressed', 'true');
    await expect(labels(dialog)).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('showing labels again starts with every callout collapsed (D-12)', async ({ page }) => {
    const dialog = await openTrail(page);
    const first = labels(dialog).first();
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('h');
    await expect(hideLabels(dialog)).toHaveAttribute('aria-pressed', 'true');
    await expect(labels(dialog)).toHaveCount(0);
    await page.keyboard.press('h');
    await expect(hideLabels(dialog)).toHaveAttribute('aria-pressed', 'false');
    await expect(labels(dialog)).toHaveCount(2);
    for (const label of await labels(dialog).all()) {
      await expect(label).toHaveAttribute('aria-expanded', 'false');
    }
  });

  // Rewritten in place for D-22 (it expected the hidden callout to take the first Escape): a
  // callout hidden by zoom no longer takes it, so zoom does, and the callout is dropped with it.
  // @no-win-webkit: the second Escape closes the lightbox through a history traversal, which
  // crashes Playwright's Windows WebKit (WinCairo, not a Safari engine; 'Target page, context or
  // browser has been closed' at the dialog's toHaveCount(0), pre-existing since before Phase 18,
  // 18-15 deferred-items). Linux WebKit still runs it in CI, so only the Windows webkit project
  // drops it (Tim, 2026-11-25).
  test('from zoomed with a callout open, one Escape leaves zoom and drops the hidden callout, the next closes (D-22) @no-win-webkit', async ({
    page,
  }) => {
    const dialog = await openTrail(page);
    const first = labels(dialog).first();
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('z');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'true');
    // Hotspots hide while zoomed (D-06).
    await expect(labels(dialog)).toHaveCount(0);
    await expect(markers(dialog)).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await expect(labels(dialog)).toHaveCount(2);
    for (const label of await labels(dialog).all()) {
      await expect(label).toHaveAttribute('aria-expanded', 'false');
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('a step collapses the open callout', async ({ page }) => {
    const dialog = await openTrail(page);
    await labels(dialog).first().click();
    await expect(labels(dialog).first()).toHaveAttribute('aria-expanded', 'true');
    await dialog.getByRole('button', { name: 'Previous photo', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/photos/${series[trail - 1].slug}$`));
    await dialog.getByRole('button', { name: 'Next photo', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/photos/${series[trail].slug}$`));
    await expect(labels(dialog)).toHaveCount(2);
    for (const label of await labels(dialog).all()) {
      await expect(label).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('H hides every label and marker, and the choice survives a reload', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const slug = series[trail].slug;
    const button = await loadPage(page, slug);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toHaveAttribute('aria-keyshortcuts', 'h');
    await expect(labels(page)).toHaveCount(2);
    await expect(markers(page).first()).toBeVisible();
    await expect(async () => {
      await page.keyboard.press('h');
      await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(labels(page)).toHaveCount(0);
    await expect(markers(page)).toHaveCount(0);
    await expect(page.locator('[data-hotspot-leader]')).toHaveCount(0);
    expect(await page.evaluate(() => window.localStorage.getItem('photos.labels'))).toBe('off');

    await page.reload();
    const again = hideLabels(page.getByRole('main'));
    await waitForHydration(again);
    await expect(again).toHaveAttribute('aria-pressed', 'true');
    await expect(labels(page)).toHaveCount(0);

    // Toggling back returns to the original state.
    await again.click();
    await expect(again).toHaveAttribute('aria-pressed', 'false');
    await expect(labels(page)).toHaveCount(2);
  });

  test('with localStorage throwing, labels show and H still toggles for the visit', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const blocked = () => {
        throw new DOMException('blocked', 'SecurityError');
      };
      Storage.prototype.getItem = blocked;
      Storage.prototype.setItem = blocked;
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    const button = await loadPage(page, series[trail].slug);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(labels(page)).toHaveCount(2);
    await expect(async () => {
      await page.keyboard.press('h');
      await expect(button).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(labels(page)).toHaveCount(0);
    await page.keyboard.press('h');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(labels(page)).toHaveCount(2);
    expect(errors).toEqual([]);
  });

  test('key tier: numbered dots and the Labels key; a dot expands its key row in accent', async ({
    page,
  }) => {
    const dialog = await openTrail(page, 1024, 768);
    const dots = dialog.locator('[data-hotspot-dot]');
    await expect(dots).toHaveCount(2);
    await expect(dots.first()).toBeVisible();
    await expect(labels(dialog).first()).toBeHidden();
    const key = dialog.getByRole('list', { name: 'Labels' });
    await expect(key).toBeVisible();
    const rows = key.getByRole('button');
    await expect(rows).toHaveCount(2);

    await dots.nth(1).click();
    await expect(rows.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await expect(rows.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await expect(zoomButton(dialog)).toHaveAttribute('aria-pressed', 'false');
    const accent = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.className = 'bg-accent';
      document.body.append(probe);
      const colour = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return colour;
    });
    const fill = (i: number) =>
      dots
        .nth(i)
        .locator('span')
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(await fill(1)).toBe(accent);
    expect(await fill(0)).not.toBe(accent);
  });

  test('scroll tier (375 x 800): numbered dots on the photo and the Labels key match the hotspots', async ({
    page,
  }) => {
    const hotspots = series[trail].hotspots;
    expect(hotspots.length).toBeGreaterThan(1);
    const dialog = await openTrail(page, 375, 800);
    const dots = dialog.locator('[data-hotspot-dot]');
    await expect(dots).toHaveCount(hotspots.length);
    await expect(labels(dialog).first()).toBeHidden();
    await expect(markers(dialog).first()).toBeHidden();
    // The gutter layer (labels and leaders) is display: none below the gutter tier.
    await expect(dialog.locator('[data-hotspot-gutters]')).toBeHidden();
    const key = dialog.getByRole('list', { name: 'Labels' });
    await key.scrollIntoViewIfNeeded();
    await expect(key).toBeVisible();
    const rows = key.getByRole('button');
    await expect(rows).toHaveCount(hotspots.length);

    const photo = (await dialog.locator('[data-photo-box]').boundingBox())!;
    for (const [i, h] of hotspots.entries()) {
      await expect(dots.nth(i)).toBeVisible();
      await expect(dots.nth(i)).toHaveText(String(h.n));
      await expect(rows.nth(i)).toContainText(h.title);
      await expect(rows.nth(i)).toContainText(String(h.n));
      // The dot sits at its hotspot's position on the photo.
      const dot = (await dots.nth(i).boundingBox())!;
      expect(dot.x + dot.width / 2).toBeCloseTo(photo.x + (h.x / 100) * photo.width, 0);
      expect(dot.y + dot.height / 2).toBeCloseTo(photo.y + (h.y / 100) * photo.height, 0);
    }
  });

  test('leader lines: one per gutter label, each running from its label to its glyph', async ({
    page,
  }) => {
    const hotspots = series[trail].hotspots;
    const dialog = await openTrail(page, 1440, 900);
    await expect(labels(dialog)).toHaveCount(hotspots.length);
    const leaders = dialog.locator('[data-hotspot-leader]');
    await expect(leaders).toHaveCount(hotspots.length);
    await expect(markers(dialog)).toHaveCount(hotspots.length);
    await expect(async () => {
      const lines = await leaders.evaluateAll((gs) =>
        gs.map((g) => {
          const line = g.querySelector('line')!;
          const origin = line.ownerSVGElement!.getBoundingClientRect();
          const n = (name: string) => Number(line.getAttribute(name));
          return {
            x1: origin.left + n('x1'),
            y1: origin.top + n('y1'),
            x2: origin.left + n('x2'),
            y2: origin.top + n('y2'),
          };
        })
      );
      expect(lines).toHaveLength(hotspots.length);
      for (const [i, h] of hotspots.entries()) {
        const label = (await dialog.locator(`[data-hotspot-label="${h.id}"]`).boundingBox())!;
        const glyph = (await markers(dialog).nth(i).boundingBox())!;
        const gx = glyph.x + glyph.width / 2;
        const gy = glyph.y + glyph.height / 2;
        const { x1, y1, x2, y2 } = lines[i];
        // Starts on the label's photo-facing edge, within its height.
        const edge = h.side === 'left' ? label.x + label.width : label.x;
        expect(Math.abs(x1 - edge), `${h.id} start x`).toBeLessThanOrEqual(2);
        expect(y1, `${h.id} start y`).toBeGreaterThanOrEqual(label.y - 2);
        expect(y1, `${h.id} start y`).toBeLessThanOrEqual(label.y + label.height + 2);
        // Ends at the glyph (8 px short of its centre, the marker clearance).
        expect(Math.hypot(x2 - gx, y2 - gy), `${h.id} end to glyph`).toBeLessThanOrEqual(10);
        expect(Math.hypot(x1 - x2, y1 - y2), `${h.id} has length`).toBeGreaterThan(20);
      }
    }).toPass({ timeout: 10000 });
  });

  test("the lake reads 'Riffelsee' with '2,760 m approx.' (IN-02)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/photos/${lake.slug}`);
    const label = labels(page).filter({ hasText: 'Riffelsee' });
    await expect(label).toBeVisible();
    await expect(label).toContainText(`2,760${NBSP}m approx.`);
  });

  test('at 375 the chrome groups fit 343 px and nothing overflows sideways', async ({ page }) => {
    const dialog = await openTrail(page, 375, 800);
    const left = (await dialog.locator('[data-chrome-left]').boundingBox())!;
    const right = (await dialog.locator('[data-chrome-right]').boundingBox())!;
    expect(left.width + 8 + right.width).toBeLessThanOrEqual(343);
    expect(right.x + right.width).toBeLessThanOrEqual(375 - 16 + 0.5);
    await expect(hideLabels(dialog)).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('the strip legend shows its keys on a fine pointer from 768 px, not at 375', async ({
    page,
  }) => {
    const dialog = await openTrail(page);
    const legend = dialog.locator('[data-strip-legend]');
    await expect(legend).toBeVisible();
    await expect(legend.locator('kbd')).toHaveCount(5);
    await expect(legend).toHaveText('← → photos · Z zoom · H labels · Esc close');

    await page.setViewportSize({ width: 375, height: 800 });
    await expect(legend).toBeHidden();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/photos/${series[trail].slug}`);
    await expect(page.locator('[data-strip-legend]')).toHaveText(
      `← → photos · Z zoom · H labels · Esc back to ${photoBack(series[trail].id).name}`
    );
  });
});
