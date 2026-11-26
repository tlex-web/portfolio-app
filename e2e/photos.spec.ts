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
  overviewSheetInput,
} from '@/lib/regions';
import {
  MARKER,
  OVERVIEW_COMPACT_MAX_S,
  OVERVIEW_GAP,
  OVERVIEW_INSET,
  REGION_PLATE,
  SUMMIT_TRIANGLE,
  summitKey,
  summitPlateSize,
} from '@/lib/photos/overview-layout';

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

/** The overview sheet (18-23) and its pointer-only region markers, in DOM order. */
const SHEET = '[data-overview-sheet]';
const markers = (page: Page) => page.locator(`${SHEET} a[data-region-marker]`);
const NBSP = '\u00a0';

/** One rendered box in the overview sheet, in px from the sheet's top-left corner. */
type SheetBox = { kind: string; id: string; x: number; y: number; w: number; h: number };

/**
 * Every rendered marker, region plate, summit triangle and summit label in the
 * sheet (plates hidden on the compact tier are left out), the sheet's size, and
 * any plate line that wraps or runs past its plate's px-2 text box.
 */
async function sheetBoxes(page: Page) {
  return page.locator(SHEET).evaluate((sheet) => {
    const s = sheet.getBoundingClientRect();
    const boxes: { kind: string; id: string; x: number; y: number; w: number; h: number }[] = [];
    const overflow: string[] = [];
    const add = (el: Element, kind: string, id: string) => {
      if (getComputedStyle(el).display === 'none') return;
      const b = el.getBoundingClientRect();
      boxes.push({ kind, id, x: b.left - s.left, y: b.top - s.top, w: b.width, h: b.height });
      if (kind !== 'plate' && kind !== 'summit') return;
      for (const line of el.querySelectorAll(':scope > span')) {
        const range = document.createRange();
        range.selectNodeContents(line);
        const rects = [...range.getClientRects()];
        const lines = new Set(rects.map((r) => Math.round(r.top))).size;
        const right = Math.max(...rects.map((r) => r.right));
        if (lines !== 1 || right > b.right - 8 + 0.5) {
          overflow.push(`${kind} ${id}: ${line.textContent}`);
        }
      }
    };
    for (const el of sheet.querySelectorAll('a[data-region-marker]')) {
      const id = el.getAttribute('data-region-marker')!;
      add(el, 'marker', id);
      add(el.querySelector('[data-region-plate]')!, 'plate', id);
    }
    for (const el of sheet.querySelectorAll('[data-summit-mark]')) {
      add(el, 'triangle', el.getAttribute('data-summit-mark')!);
    }
    for (const el of sheet.querySelectorAll('[data-summit-plate]')) {
      add(el, 'summit', el.getAttribute('data-summit-plate')!);
    }
    const box = sheet as HTMLElement;
    return { S: box.clientWidth, H: box.clientHeight, boxes, overflow };
  });
}

/** A token colour as this browser serialises a computed colour. */
function probeColor(page: Page, value: string) {
  return page.evaluate((v) => {
    const el = document.createElement('div');
    el.style.color = v;
    document.body.append(el);
    const c = getComputedStyle(el).color;
    el.remove();
    return c;
  }, value);
}

/** A region marker's dot fill, its rectangle's stroke, and whether its plate ring is ink-muted. */
function markState(page: Page, id: string) {
  return page.evaluate(
    ({ sheet, id }) => {
      const probe = document.createElement('div');
      probe.style.color = 'var(--color-ink-muted)';
      document.body.append(probe);
      const inkMuted = getComputedStyle(probe).color;
      probe.remove();
      const marker = document.querySelector(`${sheet} [data-region-marker="${id}"]`)!;
      const rect = document.querySelector(`${sheet} [data-region-rect="${id}"]`)!;
      const plate = marker.querySelector('[data-region-plate]')!;
      return {
        dot: getComputedStyle(marker.querySelector('[data-region-dot]')!).backgroundColor,
        stroke: getComputedStyle(rect).stroke,
        ring: getComputedStyle(plate).boxShadow.includes(inkMuted),
      };
    },
    { sheet: SHEET, id }
  );
}

/** A region row's fill, its 2 px bar's opacity and colour, and its badge fill. */
function rowState(page: Page, id: string) {
  return page.evaluate((id) => {
    const row = document.querySelector(`a[data-region-row="${id}"]`)!;
    const bar = getComputedStyle(row, '::before');
    return {
      fill: getComputedStyle(row).backgroundColor,
      bar: bar.opacity,
      barColor: bar.backgroundColor,
      badge: getComputedStyle(row.querySelector('[data-region-badge]')!).backgroundColor,
    };
  }, id);
}

/**
 * The Alps overview sheet beside the region list (REGION-01, REGION-06; D-01,
 * D-04; 18-UI-SPEC Contract 1 "Sheet", "Markers are pointer-only", "Overview
 * sheet margin"). One numbered marker per region, 1..N west to east like the
 * list badges, each a pointer-only link (tabindex -1, aria-hidden) to its
 * region page; the figure's caption is the overview's own sheet margin with
 * Tim's approved strings (18-03 D-20, G1) and the Summits row west to east.
 */
test.describe('Overview sheet (REGION-01, REGION-06)', () => {
  test('the sheet has one pointer-only marker per region, numbered 1..3 west to east, each linking to its region page', async ({
    page,
  }) => {
    await page.goto('/photos');
    // Heading outline: h1, then the sr-only h2 'Map' before h2 'Regions'.
    const h2s = await page.getByRole('heading', { level: 2 }).allTextContents();
    expect(h2s.slice(0, 2)).toEqual(['Map', 'Regions']);
    await expect(page.locator('section[aria-labelledby="overview-map"] figure')).toHaveCount(1);
    const list = markers(page);
    await expect(list).toHaveCount(overviewRegions.length);
    for (const [i, r] of overviewRegions.entries()) {
      const m = list.nth(i);
      await expect(m).toHaveAttribute('data-region-marker', r.id);
      await expect(m).toHaveAttribute('href', regionHref(r.id));
      await expect(m).toHaveAttribute('tabindex', '-1');
      await expect(m).toHaveAttribute('aria-hidden', 'true');
      await expect(m.locator('[data-region-dot]')).toHaveText(String(r.number));
      await expect(m.locator('[data-region-dot]')).toHaveText(String(i + 1));
    }
    // West to east: each region's sheet-index rectangle lies east of the one before.
    const centres = await page.locator(`${SHEET} polygon[data-region-rect]`).evaluateAll((els) =>
      els.map((el) => {
        const b = el.getBoundingClientRect();
        return { id: el.getAttribute('data-region-rect'), x: b.left + b.width / 2 };
      })
    );
    expect(centres.map((c) => c.id)).toEqual(overviewRegions.map((r) => r.id));
    for (let i = 1; i < centres.length; i++) {
      expect(centres[i].x).toBeGreaterThan(centres[i - 1].x);
    }
    // The sheet holds no focusable element a keyboard could reach.
    const tabbable = await page
      .locator(`${SHEET} a, ${SHEET} button, ${SHEET} [tabindex]`)
      .evaluateAll((els) => els.filter((el) => (el as HTMLElement).tabIndex >= 0).length);
    expect(tabbable).toBe(0);
  });

  test('a marker opens its region page', async ({ page }) => {
    await page.goto('/photos');
    const r = overviewRegions[1];
    const marker = page.locator(`${SHEET} a[data-region-marker="${r.id}"]`);
    await waitForHydration(marker);
    await marker.click();
    await expect(page).toHaveURL(new RegExp(`${regionHref(r.id)}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(r.heading);
  });

  test("the sheet margin prints the overview's title, extent, edition, linked GLO-90 credit and summits west to east", async ({
    page,
  }) => {
    await page.goto('/photos');
    const margin = page.locator(
      `section[aria-labelledby="overview-map"] figure > figcaption[data-sheet-margin]`
    );
    await expect(margin).toHaveCount(1);
    await expect(margin.locator('p').first()).toHaveText(`The Alps · contours every 1,000${NBSP}m`);
    const rows = await margin
      .locator('dl > div')
      .evaluateAll((els) =>
        els.map((el) => [
          el.querySelector('dt')?.textContent ?? '',
          el.querySelector('dd')?.textContent ?? '',
        ])
      );
    expect(rows).toEqual([
      ['Extent', 'SW 43° N 5° E · NE 49° N 17° E'],
      ['Last surveyed', '2021'],
      ['Source', 'Copernicus DEM GLO-90'],
      [
        'Summits',
        [
          `Mont Blanc 4,806${NBSP}m`,
          `Dufourspitze 4,634${NBSP}m`,
          `Zugspitze 2,962${NBSP}m`,
          `Grossglockner 3,798${NBSP}m`,
          `Triglav 2,864${NBSP}m`,
        ].join(' · '),
      ],
    ]);
    const source = margin.getByRole('link', { name: 'Copernicus DEM GLO-90', exact: true });
    await expect(source).toHaveAttribute('href', '/sources#copernicus-glo-90');
    await waitForHydration(source);
    await source.click();
    await expect(page).toHaveURL(/\/sources#copernicus-glo-90$/);
    await expect(page.locator('#copernicus-glo-90')).toHaveCount(1);
  });

  /*
   * Geometry at the four layout widths (18-UI-SPEC "Label layout"; UI E1/populated and
   * overflow): the successors of the retired Map view plate rows 'at {W} x 900 the plates
   * keep their boxes, gaps and dots' and '… every plate's title and altitude fit inside the
   * plate' (18-22 mapping). The Jest sweep (lib/__tests__/overview-layout.test.ts) proves
   * the layout at every S from 312 to 1100; these read the rendered boxes, so a cascade,
   * container or font-metric drift the sweep cannot see fails here. TOL is the browser's
   * sub-pixel layout unit plus the CSS's rounding (f to 6 decimals, px to 2), far under 1 px.
   */
  for (const width of [375, 768, 1024, 1440]) {
    test(`at ${width} x 900 no marker, plate, summit label or triangle overlaps another or comes within 8 px, and every box is 8 px inside the sheet`, async ({
      page,
    }) => {
      const TOL = 0.1;
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/photos');
      await page.evaluate(() => document.fonts.ready);
      const m = await sheetBoxes(page);
      const wide = m.S > OVERVIEW_COMPACT_MAX_S;
      expect([width, wide]).toEqual([width, width >= 768]);
      const input = overviewSheetInput();
      const kinds = (k: string) => m.boxes.filter((b) => b.kind === k);
      // Tiers: markers and triangles always; plates and summit labels only on the wide tier.
      expect(kinds('marker').map((b) => b.id)).toEqual(input.regions.map((r) => r.id));
      expect(kinds('triangle')).toHaveLength(input.summits.length);
      expect(kinds('plate').map((b) => b.id)).toEqual(wide ? input.regions.map((r) => r.id) : []);
      expect(kinds('summit').map((b) => b.id)).toEqual(
        wide ? input.summits.map((s) => summitKey(s.name)) : []
      );
      // Declared sizes, within 1 px.
      const size = (b: SheetBox, w: number, h: number) =>
        expect([b.kind, b.id, Math.abs(b.w - w) <= 1, Math.abs(b.h - h) <= 1]).toEqual([
          b.kind,
          b.id,
          true,
          true,
        ]);
      for (const b of kinds('marker')) size(b, MARKER, MARKER);
      for (const b of kinds('triangle')) size(b, SUMMIT_TRIANGLE, SUMMIT_TRIANGLE);
      for (const b of kinds('plate')) size(b, REGION_PLATE.w, REGION_PLATE.h);
      for (const b of kinds('summit')) {
        const s = input.summits.find((x) => summitKey(x.name) === b.id)!;
        const want = summitPlateSize(s.name, s.height);
        size(b, want.w, want.h);
      }
      // Every box 8 px inside the sheet (nothing clipped by its overflow-hidden).
      for (const b of m.boxes) {
        const inside =
          b.x >= OVERVIEW_INSET - TOL &&
          b.y >= OVERVIEW_INSET - TOL &&
          b.x + b.w <= m.S - OVERVIEW_INSET + TOL &&
          b.y + b.h <= m.H - OVERVIEW_INSET + TOL;
        expect([b.kind, b.id, inside]).toEqual([b.kind, b.id, true]);
      }
      // No pair overlaps or comes within 8 px (the largest axis gap, as the sweep measures).
      const close: string[] = [];
      for (let i = 0; i < m.boxes.length; i++) {
        for (let j = i + 1; j < m.boxes.length; j++) {
          const a = m.boxes[i];
          const b = m.boxes[j];
          const gap = Math.max(
            b.x - (a.x + a.w),
            a.x - (b.x + b.w),
            b.y - (a.y + a.h),
            a.y - (b.y + b.h)
          );
          if (gap < OVERVIEW_GAP - TOL) {
            close.push(`${a.kind} ${a.id} / ${b.kind} ${b.id}: ${gap.toFixed(2)} px`);
          }
        }
      }
      expect(close).toEqual([]);
      // Every plate line fits its plate's text box on one line (font-metric drift).
      expect(m.overflow).toEqual([]);
    });
  }

  test('hovering the Ortler row marks its marker, rectangle and plate; leaving clears them; other regions stay at rest', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos');
    const accent = await probeColor(page, 'var(--color-accent)');
    const inkMuted = await probeColor(page, 'var(--color-ink-muted)');
    expect(inkMuted).not.toBe(accent);
    await page.locator('a[data-region-row="ortler"]').hover();
    await expect
      .poll(() => markState(page, 'ortler'))
      .toEqual({ dot: accent, stroke: accent, ring: true });
    const zermatt = await markState(page, 'zermatt');
    expect([zermatt.dot === accent, zermatt.stroke, zermatt.ring]).toEqual([
      false,
      inkMuted,
      false,
    ]);
    // Leaving the row restores the rest state (WebKit left a :has(:is(:hover)) target lit).
    await page.mouse.move(2, 2);
    await expect
      .poll(async () => {
        const s = await markState(page, 'ortler');
        return [s.dot === accent, s.stroke, s.ring];
      })
      .toEqual([false, inkMuted, false]);
  });

  test('hovering the Ortler marker gives its row the active fill, accent bar and accent badge', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos');
    const accent = await probeColor(page, 'var(--color-accent)');
    const overlay = await probeColor(page, 'var(--color-surface-overlay)');
    await page.locator(`${SHEET} a[data-region-marker="ortler"] [data-region-dot]`).hover();
    await expect
      .poll(() => rowState(page, 'ortler'))
      .toEqual({ fill: overlay, bar: '1', barColor: accent, badge: accent });
    const zermatt = await rowState(page, 'zermatt');
    expect([zermatt.fill === overlay, zermatt.bar, zermatt.badge === accent]).toEqual([
      false,
      '0',
      false,
    ]);
    await page.mouse.move(2, 2);
    await expect
      .poll(async () => {
        const s = await rowState(page, 'ortler');
        return [s.fill === overlay, s.bar, s.badge === accent];
      })
      .toEqual([false, '0', false]);
  });

  // @needs-tab-to-links: the rows are links, and WebKit off Linux never Tabs to a link.
  test('keyboard focus on the Ortler row marks its marker and rectangle, and moving on clears them @needs-tab-to-links', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/photos');
    const accent = await probeColor(page, 'var(--color-accent)');
    const row = page.locator('a[data-region-row="ortler"]');
    for (let i = 0; i < 40 && !(await row.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(row).toBeFocused();
    await expect
      .poll(() => markState(page, 'ortler'))
      .toEqual({ dot: accent, stroke: accent, ring: true });
    await page.keyboard.press('Tab');
    await expect.poll(async () => (await markState(page, 'ortler')).dot === accent).toBe(false);
  });

  // @needs-tab-to-links: the rows must be reached by Tab, which WebKit off Linux never does.
  test('Tab from the top of /photos reaches the region rows and never focuses a marker or anything in the sheet @needs-tab-to-links', async ({
    page,
  }) => {
    await page.goto('/photos');
    await expect(markers(page)).toHaveCount(overviewRegions.length);
    const reached: string[] = [];
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const focus = await page.evaluate((sheet) => {
        const el = document.activeElement as HTMLElement | null;
        return {
          inSheet: !!el?.closest(sheet),
          marker: el?.hasAttribute('data-region-marker') ?? false,
          row: el?.getAttribute('data-region-row') ?? null,
          footer: !!el?.closest('footer'),
        };
      }, SHEET);
      expect([i, focus.inSheet, focus.marker]).toEqual([i, false, false]);
      if (focus.row) reached.push(focus.row);
      if (focus.footer) break;
    }
    expect(reached).toEqual(overviewRegions.map((r) => r.id));
  });
});

/**
 * Without JavaScript (UI E1 no-JS; 18-UI-SPEC "Sync": only the cross-highlight
 * needs :has()): the sheet is server HTML, so every marker, every region row and
 * the margin's Source link are plain links that navigate.
 */
test.describe('Overview sheet without JavaScript (REGION-01)', () => {
  test.use({ javaScriptEnabled: false });

  test('every marker, every region row and the Source link navigate', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const r of overviewRegions) {
      for (const sel of [
        `${SHEET} a[data-region-marker="${r.id}"]`,
        `a[data-region-row="${r.id}"]`,
      ]) {
        await page.goto('/photos');
        await page.locator(sel).click();
        await expect(page).toHaveURL(new RegExp(`${regionHref(r.id)}$`));
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(r.heading);
      }
    }
    await page.goto('/photos');
    await page
      .locator('figcaption[data-sheet-margin] a[href="/sources#copernicus-glo-90"]')
      .click();
    await expect(page).toHaveURL(/\/sources#copernicus-glo-90$/);
  });
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
