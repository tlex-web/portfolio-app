import { test, expect, type Page } from '@playwright/test';
import { lowestDemM, photos } from '@/data/generated/photos';
import { terrain } from '@/data/generated/terrain';
import { editorial } from '@/data/photos/editorial';
import { projects } from '@/data/projects';
import { home } from '@/data/home';
import { site } from '@/data/site';
import { summitPlaque } from '@/lib/ascent/summit';
import { summitLayoutAt } from '@/lib/ascent/summit-layout';
import { buildWaypoints, waypointKicker } from '@/lib/ascent/waypoints';
import { countLabel } from '@/lib/home-format';
import { formatMetres } from '@/lib/photo-format';
import { readout, scrollBlockToCentre } from './helpers/ascent';
import { disableWebGL, nextFrames } from './helpers/webgl';

/**
 * Home's waypoint list in a browser (HOME-05; D-08, D-20, D-21; 09-UI-SPEC
 * "Waypoint Cards", "UI Considerations" E6 and the 375 px overflow guardrail).
 *
 * The cards are the always-rendered list of photo waypoints, in ascending DEM
 * height, and each "View photo" link must land on its photo in the /photos
 * gallery (/photos#{slug} until Phase 10 ships /photos/{slug}). Below 768 px
 * the card docks at the bottom of its stage block without the story; under
 * reduced motion the cards stack at natural height with the story. Every
 * expected value is derived from the committed data, never hand-typed.
 */

const ascending = [...photos].sort(
  (a, b) => a.elevation.m - b.elevation.m || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
);
const slugs = ascending.map((photo) => editorial[photo.id].slug);
const waypoints = buildWaypoints();

/** A content-hashed manifest derivative: /images/photos/<name>.<10 hex>.<avif|webp>. */
const DERIVATIVE = /^\/images\/photos\/[a-z0-9-]+\.[0-9a-f]{10}\.(avif|webp)$/;

const waypointList = (page: Page) => page.getByRole('list', { name: 'Waypoints, lowest first' });
const card = (page: Page, slug: string) => page.locator(`li[id="waypoint-${slug}"] section`);

test.describe('Waypoint cards (HOME-05)', () => {
  test('every View photo link lands on its photo in the gallery', async ({ page }) => {
    await page.goto('/');

    const links = waypointList(page).getByRole('link', { name: /^View photo/ });
    await expect(links).toHaveCount(slugs.length);
    const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(hrefs).toEqual(slugs.map((slug) => `/photos#${slug}`));

    await page.goto('/photos');
    for (const slug of slugs) {
      await expect(page.locator(`[id="${slug}"]`)).toHaveCount(1);
    }
  });

  test('cards read in ascending altitude with their data', async ({ page }) => {
    await page.goto('/');

    await expect(waypointList(page).getByRole('heading', { level: 2 })).toHaveText(
      waypoints.map((w) => w.title)
    );
    expect(waypoints.map((w) => w.slug)).toEqual(slugs);
    for (const w of waypoints) {
      const section = card(page, w.slug);
      await expect(section).toContainText(waypointKicker(w));
      await expect(section).toContainText(w.placeDate);
    }
    const riffelsee = waypoints.find((w) => w.place.startsWith('Riffelsee'));
    expect(riffelsee?.approximate).toBe(true);
    await expect(card(page, riffelsee!.slug)).toContainText('approx.');
    for (const w of waypoints.filter((x) => !x.approximate)) {
      await expect(card(page, w.slug)).not.toContainText('approx.');
    }
  });

  test('card photos come from the manifest derivatives', async ({ page }) => {
    await page.goto('/');

    const list = waypointList(page);
    const urls = await list.evaluate((ol) => [
      ...[...ol.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? ''),
      ...[...ol.querySelectorAll('source')].flatMap((source) =>
        (source.getAttribute('srcset') ?? '')
          .split(',')
          .map((entry) => entry.trim().split(/\s+/)[0])
      ),
    ]);
    // One img and two sources of two widths per card.
    expect(urls).toHaveLength(waypoints.length * 5);
    for (const url of urls) {
      expect(url).toMatch(DERIVATIVE);
      expect(url).not.toMatch(/-large|-thumb/);
    }
  });

  test('the docked panel at 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const second = waypoints[1];
    await page
      .locator(`li[id="waypoint-${second.slug}"]`)
      .evaluate((el) => el.scrollIntoView({ block: 'center' }));

    const section = card(page, second.slug);
    // The global scroll-margin shifts the centred block by a few pixels.
    const { bottom, innerHeight } = await section.evaluate((el) => ({
      bottom: el.getBoundingClientRect().bottom,
      innerHeight: window.innerHeight,
    }));
    expect(Math.abs(innerHeight - bottom)).toBeLessThanOrEqual(16);

    await expect(section.getByText(second.story)).toBeHidden();
    const link = section.getByRole('link', { name: `View photo: ${second.title}` });
    await expect(link).toBeVisible();
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('reduced motion stacks the cards', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    for (const w of waypoints) {
      await expect(card(page, w.slug).getByText(w.story)).toBeVisible();
    }
    const boxes = await waypointList(page)
      .locator('section')
      .evaluateAll((sections) =>
        sections.map((s) => {
          const r = s.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom };
        })
      );
    expect(boxes).toHaveLength(waypoints.length);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].top - boxes[i - 1].bottom).toBeGreaterThanOrEqual(40);
    }

    await page.setViewportSize({ width: 375, height: 812 });
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

/** The line-break facts of one card's kicker and place line, read in the page. */
type CardBreaks = {
  /** Line boxes of the '{altitude} ·' and 'Waypoint k of n' kicker parts. */
  kickerLines: [number, number];
  /** Line boxes of the separator-and-date tail and of the date text. */
  tailLines: number;
  dateLines: number;
  sepDisplay: string;
  placeText: string;
  /** The tail's first non-empty fragment left minus the place paragraph's left. */
  tailLeft: number;
  /** The widest right edge of the parts minus their paragraph's right (content) edge. */
  overflow: number;
};

/**
 * Reads card k's break points (G-09-3 b, G-09-4 N2): how many lines each
 * unbreakable part occupies, counted from client rects. Inline parts give one
 * rect per line fragment; the date is a block in the docked panel, so its
 * lines are counted on a Range over its text, where a block still returns one
 * rect per line. The font is loaded first: the break depends on the mono advance.
 */
async function cardBreaks(page: Page, k: number): Promise<CardBreaks> {
  return page.locator(`li[data-k="${k}"] section`).evaluate(async (section) => {
    const q = (selector: string) => {
      const el = section.querySelector<HTMLElement>(selector);
      if (!el) throw new Error(`card has no ${selector}`);
      return el;
    };
    const altitude = q('[data-kicker-part="altitude"]');
    const waypoint = q('[data-kicker-part="waypoint"]');
    const tail = q('[data-place-tail]');
    const sep = q('[data-place-sep]');
    const date = q('[data-place-date]');
    const place = tail.parentElement!;
    // The computed `font` shorthand can be empty, so build it from the longhands.
    const cs = getComputedStyle(altitude);
    await document.fonts.load(`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`);
    await document.fonts.ready;

    const lines = (rects: DOMRectList | DOMRect[]) =>
      new Set([...rects].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
    const textRects = (el: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(el.firstChild!);
      return range.getClientRects();
    };
    const right = (rects: DOMRectList) =>
      Math.max(...[...rects].filter((r) => r.width > 0).map((r) => r.right));
    const contentRight = (p: HTMLElement) =>
      p.getBoundingClientRect().right - parseFloat(getComputedStyle(p).paddingRight);
    const kicker = altitude.parentElement!;

    return {
      kickerLines: [lines(altitude.getClientRects()), lines(waypoint.getClientRects())],
      tailLines: lines(tail.getClientRects()),
      dateLines: lines(textRects(date)),
      sepDisplay: getComputedStyle(sep).display,
      placeText: place.innerText,
      tailLeft:
        [...tail.getClientRects()].find((r) => r.width > 0)!.left -
        place.getBoundingClientRect().left,
      overflow: Math.max(
        right(altitude.getClientRects()) - contentRight(kicker),
        right(waypoint.getClientRects()) - contentRight(kicker),
        right(textRects(date)) - contentRight(place)
      ),
    } satisfies CardBreaks;
  });
}

/** Docked panel: the kicker wraps only between its parts, the date is its own line, no '·'. */
function expectDocked(b: CardBreaks, label: string) {
  expect(b.kickerLines, `${label}: each kicker part on one line`).toEqual([1, 1]);
  expect(b.dateLines, `${label}: the date on one line`).toBe(1);
  expect(b.sepDisplay, `${label}: separator hidden`).toBe('none');
  expect(b.placeText, `${label}: no '·' in the place line`).not.toContain('·');
  expect(b.overflow, `${label}: nothing past the column edge`).toBeLessThanOrEqual(0.5);
}

/**
 * Full card (md, and every width under reduced motion): ' · date' is one
 * unbreakable tail after the last word of the place, so no line starts with '·'.
 */
function expectFull(b: CardBreaks, label: string) {
  expect(b.kickerLines, `${label}: each kicker part on one line`).toEqual([1, 1]);
  expect(b.sepDisplay, `${label}: separator shown`).toBe('inline');
  expect(b.tailLines, `${label}: separator and date on one line`).toBe(1);
  expect(b.tailLeft, `${label}: the tail never starts a line`).toBeGreaterThan(0);
  expect(b.placeText, `${label}: the place line keeps its ' · '`).toContain(' · ');
  expect(b.overflow, `${label}: nothing past the column edge`).toBeLessThanOrEqual(0.5);
}

/**
 * Desktop rows (stable scrollbar gutter), run in Chromium and Firefox: the
 * phone widths where the plain-space strings broke badly (debug note
 * waypoint2-label-and-kicker, Evidence 15:50 and 15:55), then the full card.
 */
const BREAK_ROWS: ReadonlyArray<{
  width: number;
  height: number;
  reducedMotion: boolean;
  layout: 'docked' | 'full';
}> = [
  { width: 375, height: 900, reducedMotion: false, layout: 'docked' },
  { width: 360, height: 780, reducedMotion: false, layout: 'docked' },
  { width: 412, height: 915, reducedMotion: false, layout: 'docked' },
  { width: 768, height: 900, reducedMotion: false, layout: 'full' },
  { width: 375, height: 900, reducedMotion: true, layout: 'full' },
];

/**
 * Card line breaks (G-09-3 b, G-09-4 N2; D-10, D-20; 09-UI-SPEC "Waypoint
 * Cards" rows 1 and 4). The kicker and place line used to be plain-space
 * strings, so in the 189-199 px docked column the line breaker orphaned '4'
 * and started a line with '·', at a width that moved with the scrollbar gutter
 * and the platform glyph advance. The card now renders explicit break points;
 * these rows read them structurally for every waypoint.
 */
test.describe('Card line breaks (G-09-3 b, G-09-4 N2)', () => {
  test('docked kicker and place line break cleanly at 375 x 667 on a phone @chromium-only', async ({
    browser,
    baseURL,
  }) => {
    // Mobile emulation (overlay scrollbars, no gutter) gives the 199 px column
    // where a real 375 px phone showed the lone '4'. Firefox has no isMobile.
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    try {
      const page = await context.newPage();
      await disableWebGL(page);
      await page.goto('/');
      for (const w of waypoints) expectDocked(await cardBreaks(page, w.k), `waypoint ${w.k}`);
    } finally {
      await context.close();
    }
  });

  // "The last kicker line is not a single token" follows from the waypoint
  // part being one line box: 'Waypoint k of n' can no longer lose its 'n'.
  for (const { width, height, reducedMotion, layout } of BREAK_ROWS) {
    const motion = reducedMotion ? ' under reduced motion' : '';
    test(`${layout} card breaks cleanly at ${width} x ${height}${motion}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      if (reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
      await disableWebGL(page);
      await page.goto('/');
      for (const w of waypoints) {
        const breaks = await cardBreaks(page, w.k);
        if (layout === 'docked') expectDocked(breaks, `waypoint ${w.k}`);
        else expectFull(breaks, `waypoint ${w.k}`);
      }
    });
  }
});

/** The accessible name TrailSigns builds: the site.nav label, then the count. */
function signName(href: string, count: string): string {
  const entry = site.nav.find((item) => item.href === href);
  if (!entry) throw new Error(`no site.nav entry for ${href}`);
  return count ? `${entry.label}, ${count}` : entry.label;
}

/**
 * The end of the ascent in a browser (HOME-03, HOME-06; D-03, D-13, D-14,
 * D-15; 09-UI-SPEC "Summit Section", "Hero Block" cue row, "About and
 * Contact" and "UI Considerations" E5, E9). The plaque values, sign names,
 * card titles and About copy come from summitPlaque(), the data files and
 * buildWaypoints(), never from literals.
 */
test.describe('Summit, trail signs and About (HOME-03, HOME-06)', () => {
  const plaque = summitPlaque();
  const summit = (page: Page) => page.locator('#summit');

  test('plaque shows the derived summit stats', async ({ page }) => {
    await page.goto('/');
    const section = summit(page);
    await section.scrollIntoViewIfNeeded();

    await expect(section.getByText(plaque.kicker, { exact: true })).toBeVisible();
    await expect(
      section.getByRole('heading', { level: 2, name: plaque.title, exact: true })
    ).toBeVisible();
    await expect(section.getByText(plaque.height, { exact: true })).toBeVisible();

    const items = section.locator('dl > div');
    await expect(items).toHaveCount(plaque.stats.length);
    for (const [i, stat] of plaque.stats.entries()) {
      const item = items.nth(i);
      await expect(item.locator('dt')).toHaveText(stat.label);
      await expect(item.locator('dd')).toBeVisible();
      await expect(item.locator('dd')).toContainText(stat.value);
      if (stat.note) await expect(item.locator('dd')).toContainText(stat.note);
    }
  });

  test('trail signs appear in the hero and at the summit', async ({ page }) => {
    await page.goto('/');

    const groups = page.locator('ul[aria-label="Trail signs"]');
    await expect(groups).toHaveCount(2);
    const signs = [
      {
        name: signName('/photos', countLabel(photos.length, 'waypoint', 'waypoints')),
        href: '/photos',
      },
      {
        name: signName('/projects', countLabel(projects.length, 'route', 'routes')),
        href: '/projects',
      },
    ];
    for (const group of [groups.nth(0), groups.nth(1)]) {
      await expect(group.getByRole('link')).toHaveCount(signs.length);
      for (const { name, href } of signs) {
        await expect(group.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
      }
    }
    await expect(
      page.locator('[data-ascent-block="hero"] ul[aria-label="Trail signs"]')
    ).toHaveCount(1);
    await expect(summit(page).locator('ul[aria-label="Trail signs"]')).toHaveCount(1);
  });

  test('Skip to the summit moves focus to the summit', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Skip to the summit', exact: true }).click();
    await expect(page).toHaveURL(/#summit$/);
    await expect(summit(page)).toBeFocused();
    const { top, innerHeight } = await summit(page).evaluate((el) => ({
      top: el.getBoundingClientRect().top,
      innerHeight: window.innerHeight,
    }));
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(innerHeight);
  });

  test('Start the ascent resolves to the first waypoint', async ({ page }) => {
    await page.goto('/');

    const start = page.getByRole('link', { name: 'Start the ascent', exact: true });
    const href = await start.getAttribute('href');
    expect(href).toBe(`#waypoint-${waypoints[0].slug}`);
    await expect(page.locator(`[id="${href!.slice(1)}"]`)).toHaveCount(1);
  });

  test('heading outline has no skipped level', async ({ page }) => {
    await page.goto('/');
    const main = page.getByRole('main');

    await expect(main.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(main.getByRole('heading', { level: 2 })).toHaveText([
      ...waypoints.map((w) => w.title),
      plaque.title,
      'About',
    ]);
    await expect(main.locator('h3, h4, h5, h6')).toHaveCount(0);
  });

  test('About and contact', async ({ page }) => {
    await page.goto('/');
    const about = page.getByRole('region', { name: 'About' });
    const { contactLink, roadmapLink } = home.about.contact;

    await expect(
      about.getByRole('heading', { level: 2, name: 'About', exact: true })
    ).toBeVisible();
    await expect(about.getByText(home.about.body, { exact: true })).toBeVisible();
    await expect(about.getByRole('link', { name: contactLink.label, exact: true })).toHaveAttribute(
      'href',
      contactLink.href
    );
    await expect(about.getByRole('link', { name: roadmapLink.label, exact: true })).toHaveAttribute(
      'href',
      roadmapLink.href
    );
    expect([contactLink.href, roadmapLink.href]).toEqual(['/contact', '/roadmap']);
  });

  test('nothing overflows at 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const overflow = () =>
      page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
    let { scrollWidth, clientWidth } = await overflow();
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    await summit(page).evaluate((el) => el.scrollIntoView({ block: 'end' }));
    ({ scrollWidth, clientWidth } = await overflow());
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Plaque values never wrap; every dd value is one line inside its column.
    // At 375 px the summit is compact, so the visible stats are the copy after
    // the ascent (G-09-2, 09-18).
    const values = await page
      .locator('[data-summit-details] dd > span.whitespace-nowrap')
      .evaluateAll((spans) =>
        spans.map((s) => {
          const r = s.getBoundingClientRect();
          const col = s.closest('div')!.getBoundingClientRect();
          return { height: r.height, right: r.right, colRight: col.right };
        })
      );
    expect(values).toHaveLength(plaque.stats.length);
    for (const v of values) {
      expect(v.height).toBeLessThan(30);
      expect(v.right).toBeLessThanOrEqual(v.colRight + 0.5);
    }
  });
});

type Box = { x: number; y: number; width: number; height: number };

/**
 * With #summit centred (static mode), the plaque column [data-summit-plaque]
 * and every poster pin box. Two more frames after the centring helper's own
 * two, so the active-pin attributes have settled.
 */
async function summitBoxes(page: Page): Promise<{ plaque: Box; pins: Array<Box & { k: number }> }> {
  await scrollBlockToCentre(page, '#summit');
  await nextFrames(page);
  return page.evaluate(() => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const plaque = document.querySelector('[data-summit-plaque]');
    if (!plaque) throw new Error('no [data-summit-plaque]');
    const pins = [
      ...document.querySelectorAll<HTMLElement>('[data-pin-layer="poster"] [data-pin]'),
    ].map((el) => ({ k: Number(el.dataset.pin), ...box(el) }));
    return { plaque: box(plaque), pins };
  });
}

/** Separation of two boxes in px: positive when apart (the larger axis gap), negative when they overlap. */
function boxGap(a: Box, b: Box): number {
  return Math.max(
    b.x - (a.x + a.width),
    a.x - (b.x + b.width),
    b.y - (a.y + a.height),
    a.y - (b.y + b.height)
  );
}

/**
 * The static half of G-09-2 (D-03; Tim: "Compact plaque + measured 3D", 09-18;
 * .planning/debug/summit-pins-under-plaque.md). The poster pins never move
 * (D-16), so the plaque must clear them: no pin box may meet the plaque column
 * inflated by 8 px. Where the full plaque cannot sit beside the pins, the
 * compact layout docks a 320 px column (compact plate and signs) at the bottom
 * and the kicker and stats follow the ascent in [data-summit-details].
 */
test.describe('Summit plaque clears the poster pins (G-09-2, static)', () => {
  const plaque = summitPlaque();
  const CLEARANCE = 8;
  // The UAT and debug sizes (phones incl. a Safari-like 375 x 553 svh, the
  // 768/778 iPad pair either side of the scrollbar gutter, tablets, desktops).
  const SIZES: ReadonlyArray<readonly [number, number]> = [
    [360, 640],
    [375, 667],
    [375, 553],
    [390, 844],
    [412, 839],
    [768, 1024],
    [778, 1024],
    [820, 1180],
    [1024, 768],
    [1280, 720],
    [1440, 900],
  ];

  for (const [width, height] of SIZES) {
    const layout = summitLayoutAt(width, height);
    test(`${layout} summit clears every poster pin at ${width} x ${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await disableWebGL(page);
      await page.goto('/');

      const { plaque: column, pins } = await summitBoxes(page);
      expect(pins).toHaveLength(waypoints.length);
      for (const pin of pins) {
        const gap = boxGap(column, pin);
        test
          .info()
          .annotations.push({ type: 'pin gap', description: `pin ${pin.k}: ${gap.toFixed(1)} px` });
        expect.soft(gap, `pin ${pin.k} gap to the plaque column`).toBeGreaterThanOrEqual(CLEARANCE);
      }

      const section = page.locator('#summit');
      const details = page.locator('[data-summit-details]');
      await expect(
        section.getByRole('heading', { level: 2, name: plaque.title, exact: true })
      ).toBeVisible();
      await expect(section.getByText(plaque.height, { exact: true })).toBeVisible();
      if (layout === 'compact') {
        await expect(section.locator('dl')).toBeHidden();
        await expect(details).toBeVisible();
        await expect(details.locator('dl > div')).toHaveCount(plaque.stats.length);
        for (const item of await details.locator('dl > div').all())
          await expect(item).toBeVisible();
      } else {
        await expect(section.locator('dl > div')).toHaveCount(plaque.stats.length);
        await expect(section.locator('dl')).toBeVisible();
        await expect(details).toBeHidden();
      }
    });
  }

  // Reduced motion is the stacked layout with no fixed summit frame (UI-SPEC
  // "Modes"), so there is no clearance contract to gate: the gaps are recorded,
  // not asserted.
  test('reduced motion keeps the full plaque with its stats at 375 x 667', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await disableWebGL(page);
    await page.goto('/');

    const { plaque: column, pins } = await summitBoxes(page);
    for (const pin of pins) {
      test.info().annotations.push({
        type: 'reduced-motion pin',
        description: `pin ${pin.k}: box ${pin.x.toFixed(1)},${pin.y.toFixed(1)} ${pin.width}x${pin.height}; gap to the plaque column ${boxGap(column, pin).toFixed(1)} px`,
      });
    }

    const section = page.locator('#summit');
    await expect(section.getByText(plaque.kicker, { exact: true })).toBeVisible();
    await expect(section.getByText(plaque.height, { exact: true })).toBeVisible();
    await expect(section.locator('dl > div')).toHaveCount(plaque.stats.length);
    for (const item of await section.locator('dl > div').all()) await expect(item).toBeVisible();
    await expect(page.locator('[data-summit-details]')).toBeHidden();
  });

  test('the compact stats are a group named by the summit h2 at 375 x 667', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const group = page.getByRole('group', { name: plaque.title, exact: true });
    await expect(group).toHaveCount(1);
    await expect(group).toHaveAttribute('data-summit-details');
    await expect(group.getByText(plaque.kicker, { exact: true })).toBeVisible();
  });
});

type LitBoxes = {
  stage: Box;
  card: Box;
  head: Box;
  label: Box;
  labelVisibility: string;
  labelDisplay: string;
  side: string | null;
  /** The rail marks that are drawn (zero-size boxes, e.g. below 768 px, are left out). */
  rail: Array<Box & { name: string }>;
};

/**
 * Centres waypoint k's block (static mode), waits until the readout shows its
 * height, and returns the boxes the lit-label clearance needs, in viewport px.
 */
async function litBoxes(page: Page, k: number): Promise<LitBoxes> {
  await scrollBlockToCentre(page, `li[data-k="${k}"]`);
  await expect(readout(page)).toHaveText(formatMetres(waypoints[k - 1].altitudeM));
  // The readout already shows waypoint 1's height at p = 0, so also wait for the lit pin.
  await expect(page.locator(`[data-pin-layer="poster"] [data-pin="${k}"]`)).toHaveAttribute(
    'data-active',
    ''
  );
  await nextFrames(page);
  return page.evaluate((k) => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const one = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`no ${selector}`);
      return el;
    };
    const pin = one(`[data-pin-layer="poster"] [data-pin="${k}"]`) as HTMLElement;
    const label = one(`[data-pin-layer="poster"] [data-pin="${k}"] [data-pin-label]`);
    const style = getComputedStyle(label);
    const rail = [
      ...[...document.querySelectorAll('[data-rail-tick]')].map((el, i) => ({
        name: `tick row ${i}`,
        ...box(el),
      })),
      { name: 'rail line', ...box(one('[data-ascent-rail] > div')) },
      { name: 'readout', ...box(one('[data-ascent-readout]')) },
      { name: 'marker', ...box(one('[data-ascent-marker]')) },
    ].filter((b) => b.width > 0 && b.height > 0);
    return {
      stage: box(one('[data-ascent-stage]')),
      card: box(one(`li[data-k="${k}"] section`)),
      head: box(one(`[data-pin-layer="poster"] [data-pin="${k}"] [data-pin-head]`)),
      label: box(label),
      labelVisibility: style.visibility,
      labelDisplay: style.display,
      side: pin.dataset.label ?? null,
      rail,
    };
  }, k);
}

const centreInside = (b: Box, c: Box) => {
  const x = b.x + b.width / 2;
  const y = b.y + b.height / 2;
  return x >= c.x && x <= c.x + c.width && y >= c.y && y <= c.y + c.height;
};

/** The lit label is shown, inside the stage (1 px) and meets neither the card nor a rail mark. */
function expectLabelClear(b: LitBoxes, what: string) {
  expect(b.labelDisplay, `${what}: label display`).not.toBe('none');
  expect(b.labelVisibility, `${what}: label visibility`).toBe('visible');
  expect.soft(b.label.x, `${what}: label left in the stage`).toBeGreaterThanOrEqual(b.stage.x - 1);
  expect.soft(b.label.y, `${what}: label top in the stage`).toBeGreaterThanOrEqual(b.stage.y - 1);
  expect
    .soft(b.label.x + b.label.width, `${what}: label right in the stage`)
    .toBeLessThanOrEqual(b.stage.x + b.stage.width + 1);
  expect
    .soft(b.label.y + b.label.height, `${what}: label bottom in the stage`)
    .toBeLessThanOrEqual(b.stage.y + b.stage.height + 1);
  expect.soft(boxGap(b.label, b.card), `${what}: label gap to the card`).toBeGreaterThanOrEqual(0);
  for (const mark of b.rail)
    expect
      .soft(boxGap(b.label, mark), `${what}: label gap to the ${mark.name}`)
      .toBeGreaterThanOrEqual(0);
}

/**
 * The static half of G-09-3 (a) (D-07, D-09; .planning/debug/waypoint2-label-
 * and-kicker.md). The poster pins never move (D-16), so the lit label is placed
 * around its head by placePinLabel (lib/ascent/framing.ts): right, left, above
 * or below, clear of the stage edge, the active card and the rail marks. A
 * head whose centre is under its card shows no label (the D-09 amendment).
 */
test.describe('Lit poster label clears its card and the rail (G-09-3 a)', () => {
  // The md band either side of the scrollbar gutter (768/778) and up to the lg
  // padding step (1023/1024), the 768 x 1024 portrait iPad, desktops and two
  // phones (debug note Evidence 15:40 and 15:55).
  const SIZES: ReadonlyArray<readonly [number, number]> = [
    [768, 900],
    [778, 900],
    [820, 900],
    [900, 900],
    [1023, 900],
    [1024, 900],
    [768, 1024],
    [1280, 900],
    [1440, 900],
    [375, 667],
    [412, 839],
  ];
  /** The UAT truth (test 3): pin 2's own head is clear of its card at 768 px. */
  const HEAD_CLEAR_OF_CARD = new Set(['768x900', '768x1024']);

  test.beforeEach(async ({ page }) => {
    await disableWebGL(page);
  });

  for (const [width, height] of SIZES) {
    test(`every lit label at ${width} x ${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      for (const w of waypoints) {
        const b = await litBoxes(page, w.k);
        const what = `waypoint ${w.k} at ${width} x ${height}`;
        if (w.k === 2 && HEAD_CLEAR_OF_CARD.has(`${width}x${height}`))
          expect(centreInside(b.head, b.card), `${what}: head centre outside the card`).toBe(false);
        if (centreInside(b.head, b.card)) {
          // The static-poster exception (D-09 amendment 2026-10-25): no label.
          test
            .info()
            .annotations.push({ type: 'head under its card', description: `waypoint ${w.k}` });
          expect(b.side, `${what}: placement`).toBe('none');
          expect(b.labelVisibility, `${what}: label hidden under the card`).toBe('hidden');
          continue;
        }
        test.info().annotations.push({ type: 'side', description: `waypoint ${w.k}: ${b.side}` });
        expectLabelClear(b, what);
      }
    });
  }
});

/**
 * The one damped progress value in a browser (HOME-03, HOME-04, HOME-05; D-01,
 * D-05, D-06, D-08, D-09; 09-UI-SPEC "Ascent Mapping", "Pins", "Altimeter
 * Rail" and "Focus contract"). Every test switches WebGL off, so Chromium stays
 * on the poster path (poster pins, live rail) once the canvas lands in 09-07
 * and 09-08. Positions are reached by centring a block, which lands inside
 * its arrival plateau; expected heights and labels come from the data.
 */
test.describe('Ascent progress (HOME-03, HOME-04, HOME-05)', () => {
  const second = waypoints[1];
  const approximate = waypoints.find((w) => w.approximate);
  const rail = (page: Page) => page.locator('[data-ascent-rail]');
  const stage = (page: Page) => page.locator('[data-ascent-stage]');
  const railLayer = (page: Page) => page.locator('[data-ascent-rail-layer]');
  const posterPins = (page: Page) => page.locator('[data-pin-layer="poster"] [data-pin]');

  test.beforeEach(async ({ page }) => {
    await disableWebGL(page);
  });

  test('the rail is decorative and hidden below 768 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(rail(page)).toBeHidden();

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(rail(page)).toBeVisible();
    await expect(stage(page)).toHaveAttribute('aria-hidden', 'true');
    // The rail box lives in its own sticky layer after the track, so it paints
    // above the hero scrim; its scrim stays in the stage, where the camera
    // reads it (G-09-4 N1, Tim's option B, 09-17), under the pin layer (09-19).
    await expect(railLayer(page)).toHaveAttribute('aria-hidden', 'true');
    await expect(railLayer(page).locator('[data-ascent-rail]')).toHaveCount(1);
    await expect(stage(page).locator('[data-ascent-rail-scrim]')).toHaveCount(1);
    await expect(rail(page)).toHaveCSS('pointer-events', 'none');
    await expect(railLayer(page)).toHaveCSS('pointer-events', 'none');
    const trackFirst = await page.evaluate(() => {
      const track = document.querySelector('[data-ascent-track]');
      const layer = document.querySelector('[data-ascent-rail-layer]');
      return Boolean(
        track && layer && track.compareDocumentPosition(layer) & Node.DOCUMENT_POSITION_FOLLOWING
      );
    });
    expect(trackFirst, 'the rail layer follows the track in document order').toBe(true);
    const focusable =
      'a[href], button, input, select, textarea, [contenteditable], [tabindex]:not([tabindex="-1"])';
    for (const layer of [stage(page), railLayer(page)]) {
      await expect(layer.locator('[aria-live]')).toHaveCount(0);
      await expect(layer.locator(focusable)).toHaveCount(0);
    }
  });

  test('the readout climbs from the first waypoint to the summit', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(readout(page)).toHaveText(formatMetres(lowestDemM));

    await scrollBlockToCentre(page, `li[data-k="${second.k}"]`);
    await expect(readout(page)).toHaveText(formatMetres(second.altitudeM));

    await scrollBlockToCentre(page, '#summit');
    await expect(readout(page)).toHaveText(formatMetres(terrain.summit.officialM));
  });

  test('the rail ticks are evenly spaced', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const centres = await rail(page)
      .locator('[data-tick-label]')
      .evaluateAll((labels) =>
        labels.map((l) => {
          const r = l.getBoundingClientRect();
          return r.top + r.height / 2;
        })
      );
    expect(centres).toHaveLength(waypoints.length + 1);
    const step = (centres[centres.length - 1] - centres[0]) / (centres.length - 1);
    expect(step).toBeLessThan(0);
    centres.forEach((c, k) => expect(Math.abs(c - (centres[0] + k * step))).toBeLessThanOrEqual(1));
  });

  test('poster pins sit at their UV and light with the active stage', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(posterPins(page).locator('[data-pin-head]')).toHaveText(
      waypoints.map((w) => String(w.k))
    );
    expect(approximate).toBeDefined();
    await expect(
      page.locator(`[data-pin-layer="poster"] [data-pin="${approximate!.k}"] [data-pin-head]`)
    ).toHaveCSS('border-top-style', 'dashed');

    const sheet = await page.locator('[data-sheet-box]').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, side: r.width };
    });
    const anchors = await posterPins(page).evaluateAll((pins) =>
      pins.map((p) => {
        const r = p.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.bottom };
      })
    );
    anchors.forEach((a, i) => {
      expect(Math.abs(a.x - (sheet.left + waypoints[i].uv.u * sheet.side))).toBeLessThanOrEqual(1);
      expect(Math.abs(a.y - (sheet.top + waypoints[i].uv.v * sheet.side))).toBeLessThanOrEqual(1);
    });

    await scrollBlockToCentre(page, `li[data-k="${second.k}"]`);
    const lit = page.locator(`[data-pin-layer="poster"] [data-pin="${second.k}"]`);
    await expect(lit).toHaveAttribute('data-active', '');
    await expect(page.locator('[data-pin-layer="poster"] [data-pin][data-active]')).toHaveCount(1);
    await expect(lit.locator('[data-pin-label]')).toBeVisible();
    await expect(lit.locator('[data-pin-label]')).toHaveText(
      `${second.shortPlace} · ${formatMetres(second.altitudeM)}`
    );

    await scrollBlockToCentre(page, '#summit');
    await expect(page.locator('[data-pin][data-active]')).toHaveCount(0);
  });

  test('keyboard focus on a card brings its stage to the centre', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const link = page.getByRole('link', { name: `View photo: ${second.title}`, exact: true });
    let focused = false;
    for (let i = 0; i < 30 && !focused; i++) {
      await page.keyboard.press('Tab');
      focused = await link.evaluate((el) => el === document.activeElement);
    }
    expect(focused).toBe(true);
    await expect(readout(page)).toHaveText(formatMetres(second.altitudeM));
  });

  test('native scroll: no wheel or touch interception, no snapping', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __prevented: number };
      w.__prevented = 0;
      const preventDefault = Event.prototype.preventDefault;
      Event.prototype.preventDefault = function (this: Event) {
        if (['wheel', 'touchstart', 'touchmove'].includes(this.type)) w.__prevented += 1;
        return preventDefault.call(this);
      };
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 600);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThanOrEqual(before + 598);
    await nextFrames(page);
    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before - 600)).toBeLessThanOrEqual(2);

    const styles = await page.evaluate(() => {
      const track = document.querySelector('[data-ascent-track]')!;
      return {
        prevented: (window as unknown as { __prevented: number }).__prevented,
        snap: [document.documentElement, document.body, track].map(
          (el) => getComputedStyle(el).scrollSnapType
        ),
        behavior: getComputedStyle(document.documentElement).scrollBehavior,
      };
    });
    expect(styles.prevented).toBe(0);
    expect(styles.snap).toEqual(['none', 'none', 'none']);
    expect(styles.behavior).toBe('auto');
  });

  test('reduced motion shows a static rail and lights no pin', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await scrollBlockToCentre(page, `li[data-k="${second.k}"]`);
    await expect(rail(page)).toBeVisible();
    await expect(rail(page).locator('[data-tick-label]')).toHaveCount(waypoints.length + 1);
    await expect(page.locator('[data-ascent-marker]')).toBeHidden();
    await expect(readout(page)).toBeHidden();
    await expect(page.locator('[data-pin][data-active]')).toHaveCount(0);
  });
});
