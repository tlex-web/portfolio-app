import { test, expect, type Page } from '@playwright/test';
import { site } from '@/data/site';
import { SHORT_CREDIT, SOURCES_PAGE, sourceHref } from '@/data/source-credits';
import { terrain } from '@/data/generated/terrain';
import { homePhotos } from '@/lib/ascent/home-photos';
import { ROUTES, type Label } from './routes';
import { tabReachesLinks } from './helpers/engine';

/**
 * Shell contract (SHELL-01, SHELL-02, DSGN-08 shell; UI-SPEC "Guardrail
 * Constraints" Landmarks row and "UI Considerations" E1-E4, E10).
 *
 * Every content route renders inside app/(site)/layout.tsx -> SiteChrome:
 * one skip link, one banner holding one Primary nav, one main#main-content,
 * one contentinfo.
 * Landmarks are counted with toHaveCount(1), never narrowed with .first(),
 * so a duplicated shell fails here instead of being hidden (PITFALLS 5, 7).
 */

const primaryNav = (page: Page) => page.getByRole('navigation', { name: 'Primary' });
/**
 * The global skip link, by its exact name (07-27 intent: one per route). Home
 * also has a visible "Skip to the summit" cue (09-05, D-15), so a /skip to/i
 * count would read 2 there; the exact name keeps every toHaveCount(1) meaning
 * "one global skip link", and anySkipLinks() pins what else may match.
 */
const skipLinks = (page: Page) => page.getByRole('link', { name: 'Skip to main content', exact: true });
const anySkipLinks = (page: Page) => page.getByRole('link', { name: /skip to/i });
const summitSkipLinks = (page: Page) => page.getByRole('link', { name: 'Skip to the summit', exact: true });
/**
 * A region page's sequence head row has a "Skip to next region" link to
 * #next-region (18-08; 18-UI-SPEC Contract 2 "Sequence"), so a region page has
 * two /skip to/i matches: the global link and this one.
 */
const nextRegionSkipLinks = (page: Page) =>
  page.getByRole('link', { name: 'Skip to next region', exact: true });
const isRegionPage = (path: string) => path.startsWith('/photos/regions/');
/** Every /skip to/i match a route may have: the global link plus its one allowed page cue. */
const expectedSkipTo = (path: string) => 1 + (path === '/' ? 1 : 0) + (isRegionPage(path) ? 1 : 0);

/**
 * Waits until React has hydrated the shell (it attaches its props key to every
 * host node it hydrates). The first skip-link count usually runs on the server
 * DOM, so the skip links are counted again after this (07 IN-17): a link that
 * mounts only on the client, after the first count passed, still fails.
 */
async function hydrated(page: Page) {
  await expect
    .poll(
      () =>
        page
          .locator('#main-content')
          .evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))),
      { timeout: 15000 },
    )
    .toBe(true);
}

/**
 * Fires every once:true whileInView animation by scrolling the full height,
 * returns to the top and waits for finite time-based animations to end
 * (mirrors `settle` in e2e/visual/routes.spec.ts). Scroll-driven animations
 * stay 'running' at any scroll position, so they are ignored.
 */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((a) => a.timeline === document.timeline)
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
      .every((a) => a.playState !== 'running'),
  );
}

test.describe('Shell landmarks', () => {
  for (const [path, current] of ROUTES) {
    test(`${path}: one shell, skip link first, current page ${current ?? 'none'}`, async ({ page, browserName }) => {
      await page.goto(path);

      // E2/E3: exactly one of each landmark.
      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(primaryNav(page)).toHaveCount(1);
      await expect(page.locator('#main-content')).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      // SHELL-01 / SC4: exactly one skip link, so a page-level second skip link fails here.
      await expect(skipLinks(page)).toHaveCount(1);
      // The only other 'Skip to …' links are Home's 'Skip to the summit' (09-05, D-15) and a
      // region page's 'Skip to next region' (18-08): every /skip to/i match is an allowed name.
      await expect(summitSkipLinks(page)).toHaveCount(path === '/' ? 1 : 0);
      await expect(nextRegionSkipLinks(page)).toHaveCount(isRegionPage(path) ? 1 : 0);
      await expect(anySkipLinks(page)).toHaveCount(expectedSkipTo(path));
      // The Primary nav lives in the banner; the footer holds no nav.
      await expect(page.getByRole('banner').getByRole('navigation', { name: 'Primary' })).toHaveCount(1);
      await expect(page.getByRole('contentinfo').getByRole('navigation')).toHaveCount(0);

      // E4: aria-current="page" on exactly the expected visible destination.
      const nav = primaryNav(page);
      for (const item of site.nav) {
        const link = nav.getByRole('link', { name: item.label, exact: true });
        if (item.label === current) {
          await expect(link).toHaveAttribute('aria-current', 'page');
        } else {
          await expect(link).not.toHaveAttribute('aria-current');
        }
      }
      await expect(nav.locator('a[aria-current="page"]:visible')).toHaveCount(current ? 1 : 0);

      // Footer identity links come from data/site.ts (SHELL-03).
      const footer = page.getByRole('contentinfo');
      await expect(footer.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute(
        'href',
        site.links.github,
      );
      await expect(footer.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute(
        'href',
        site.links.linkedin,
      );
      await expect(footer.getByRole('link', { name: 'Email', exact: true })).toHaveAttribute(
        'href',
        `mailto:${site.email}`,
      );

      // E1: the skip link is the first Tab stop; Enter moves focus to main.
      // WebKit never Tabs to a link (helpers/engine.ts), so there the skip link
      // is focused directly and only its Enter behaviour is checked.
      const skip = page.getByRole('link', { name: 'Skip to main content' });
      if (tabReachesLinks(browserName)) await page.keyboard.press('Tab');
      else await skip.focus();
      await expect(skip).toBeFocused();
      await expect(skip).toHaveAttribute('href', '#main-content');
      await page.keyboard.press('Enter');
      await expect(page.locator('#main-content')).toBeFocused();

      // 07 IN-17: count again once hydrated and after the Tab/Enter sequence.
      await hydrated(page);
      await expect(skipLinks(page)).toHaveCount(1);
      await expect(anySkipLinks(page)).toHaveCount(expectedSkipTo(path));
    });
  }

  for (const [path] of ROUTES) {
    test(`${path} @768: 64 px header, no horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 900 });
      await page.goto(path);
      await settle(page);

      const header = await page.getByRole('banner').boundingBox();
      expect(header?.height).toBe(64);

      // clientWidth, not innerWidth: the stable scrollbar gutter (07-12) keeps
      // documentElement narrower than the viewport even with no overflow.
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});

/**
 * SHELL-05 / SHELL-01 empty-content case: every unmatched URL, including the
 * deleted playground routes, returns HTTP 404 with no redirect and renders the
 * designed 404 inside one shell (app/not-found.tsx renders SiteChrome itself).
 * Unknown /projects/<slug> and /photos/<slug> are rewritten by proxy.ts to the
 * root not-found (EDGE-01), which swaps that section's link for its D-11
 * context label ("All routes", "All photographs"); e2e/not-found.spec.ts owns
 * the server-HTML and no-echo checks.
 */
const NOT_FOUND_PATHS: ReadonlyArray<
  readonly [path: string, current: Label | null, context: 'photos' | 'projects' | null]
> = [
  ['/__no-such-page__', null, null],
  ['/gradient-mesh', null, null],
  ['/particle-buttons', null, null],
  ['/transitions', null, null],
  // Under /projects the Engineering destination stays current (prefix match).
  ['/projects/no-such-slug', 'Engineering', 'projects'],
  // Photo slugs match exactly and case-sensitively (proxy KNOWN set; dynamicParams = false + notFound(), T-10-01).
  ['/photos/no-such-slug', 'Photographs', 'photos'],
  ['/photos/MATTERHORN-FROM-ZERMATT', 'Photographs', 'photos'],
];

test.describe('Shell 404', () => {
  for (const [path, current, context] of NOT_FOUND_PATHS) {
    test(`${path}: HTTP 404, no redirect, one shell, designed 404 body`, async ({ page }) => {
      const photosLink = context === 'photos' ? 'All photographs' : 'Photographs';
      const projectsLink = context === 'projects' ? 'All routes' : 'Engineering';
      const response = await page.goto(path);

      expect(response?.status()).toBe(404);
      expect(new URL(page.url()).pathname).toBe(path);

      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(primaryNav(page)).toHaveCount(1);
      await expect(page.locator('#main-content')).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      // SHELL-01 / SC4: exactly one skip link, so a page-level second skip link fails here.
      await expect(skipLinks(page)).toHaveCount(1);
      await expect(anySkipLinks(page)).toHaveCount(1);

      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(main.getByRole('heading', { level: 1 })).toHaveText("You've left the marked trail");
      await expect(main.getByText('Error 404 · Page not found', { exact: true })).toHaveCount(1);
      await expect(main.getByRole('link', { name: 'Go to the homepage', exact: true })).toHaveAttribute(
        'href',
        '/',
      );
      await expect(main.getByRole('link', { name: photosLink, exact: true })).toHaveAttribute(
        'href',
        '/photos',
      );
      await expect(main.getByRole('link', { name: projectsLink, exact: true })).toHaveAttribute(
        'href',
        '/projects',
      );

      // Unmatched top-level URLs have no current destination.
      const nav = primaryNav(page);
      await expect(nav.locator('a[aria-current="page"]:visible')).toHaveCount(current ? 1 : 0);
      if (current) {
        await expect(nav.getByRole('link', { name: current, exact: true })).toHaveAttribute(
          'aria-current',
          'page',
        );
      }

      // 07 IN-17: count again once hydrated.
      await hydrated(page);
      await expect(skipLinks(page)).toHaveCount(1);
      await expect(anySkipLinks(page)).toHaveCount(1);
    });
  }

  test.describe('375 px', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('no horizontal scroll; h1 wraps to at most two lines; actions are 44 px targets', async ({
      page,
    }) => {
      await page.goto('/__no-such-page__');
      await page.evaluate(() => document.fonts.ready);

      // clientWidth (<= innerWidth) because of the stable scrollbar gutter (07-12):
      // the stricter bound, so scrollWidth <= innerWidth holds as well.
      const { scrollWidth, clientWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      expect(clientWidth).toBeLessThanOrEqual(innerWidth);

      // Display line height is 44 px (UI-SPEC type scale): two lines at most.
      const main = page.getByRole('main');
      const h1 = await main.getByRole('heading', { level: 1 }).boundingBox();
      expect(h1?.height).toBeLessThanOrEqual(2 * 44);

      // The action row wraps: every action is a 44 px target inside the viewport.
      for (const name of ['Go to the homepage', 'Photographs', 'Engineering']) {
        const box = await main.getByRole('link', { name, exact: true }).boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(clientWidth);
      }
    });
  });
});

test.describe('Shell mobile menu', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('Menu button and panel rows meet the touch-target sizes; Escape closes to the button', async ({
    page,
    browserName,
  }) => {
    await page.goto('/roadmap');

    const button = page.getByRole('button', { name: 'Menu' });
    const panel = page.locator('#site-menu');
    await expect(button).toHaveCount(1);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
    expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(44);

    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();

    // The panel enters with an @starting-style fade and -8px settle. Mid-transition the
    // rows sit at fractional y offsets, so bottom - top can come out a float hair under
    // 48 (47.99998). Measure the settled layout: wait for every panel transition to end.
    await panel.evaluate((el) =>
      Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined))),
    );
    expect(await panel.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);

    const rows = panel.getByRole('link');
    await expect(rows).toHaveCount(site.nav.length);
    for (let i = 0; i < site.nav.length; i++) {
      expect((await rows.nth(i).boundingBox())?.height).toBeGreaterThanOrEqual(48);
    }
    await expect(panel.getByRole('link', { name: 'Roadmap', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );

    // Move focus into the panel so "Escape returns focus to the button" is observable.
    // The rows are links, which WebKit never Tabs to (helpers/engine.ts): focus the first directly.
    if (tabReachesLinks(browserName)) await page.keyboard.press('Tab');
    else await rows.nth(0).focus();
    await expect(rows.nth(0)).toBeFocused();

    // The disclosure has no scroll lock, so the page can sit scrolled down while the menu
    // is open. Pin it part-way down only now, with focus already in the panel: opening
    // (Playwright's actionability scroll) and keyboard focus honour the global
    // scroll-margin-top and can move the page themselves, so this measures Escape alone.
    // Guards Escape's focus of Menu scrolling the page up (600 to 530 in Chromium, 185.5
    // in Firefox).
    await page.evaluate(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, Math.min(600, max));
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect(rows.nth(0)).toBeFocused();
    const scrollAtEscape = await page.evaluate(() => window.scrollY);

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
    expect(await page.evaluate(() => window.scrollY), 'Escape keeps the scroll position').toBe(
      scrollAtEscape,
    );
  });

  test('choosing Photographs navigates and closes the panel', async ({ page }) => {
    await page.goto('/roadmap');

    const button = page.getByRole('button', { name: 'Menu' });
    const panel = page.locator('#site-menu');
    await button.click();
    await expect(panel).toBeVisible();

    await panel.getByRole('link', { name: 'Photographs', exact: true }).click();
    await expect(page).toHaveURL(/\/photos$/, { timeout: 15000 });
    await expect(panel).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test("tapping the current page's link closes the panel and keeps the scroll (SHELL-07, D-16)", async ({
    page,
  }) => {
    await page.goto('/roadmap');

    // Scroll down (600 px, or the page's maximum if shorter) so a jump to the top shows.
    await page.evaluate(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, Math.min(600, max));
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    // A marker on the window: a document reload would drop it.
    await page.evaluate(() => {
      (window as unknown as { __shell07?: number }).__shell07 = 1;
    });

    // Pointer clicks at the element's centre, not locator.click(): Playwright's
    // actionability scroll honours the global scroll-margin-top and moves the page
    // even for the sticky header, which would hide (or fake) a scroll change.
    const tap = async (locator: ReturnType<Page['locator']>) => {
      const box = await locator.boundingBox();
      if (!box) throw new Error('tap target has no box');
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    };
    const button = page.getByRole('button', { name: 'Menu' });
    const panel = page.locator('#site-menu');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect
      .poll(() => button.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))))
      .toBe(true);
    await tap(button);
    await expect(panel).toBeVisible();
    await panel.evaluate((el) =>
      Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined))),
    );
    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(0);

    await tap(panel.getByRole('link', { name: 'Roadmap', exact: true }));

    await expect(panel).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    expect(new URL(page.url()).pathname).toBe('/roadmap');
    expect(new URL(page.url()).search).toBe('');
    expect(
      await page.evaluate(() => (window as unknown as { __shell07?: number }).__shell07),
    ).toBe(1);
  });

  test('on a view URL, Photographs still navigates to the plain page (D-23)', async ({ page }) => {
    await page.goto('/photos?view=grid');

    const button = page.getByRole('button', { name: 'Menu' });
    const panel = page.locator('#site-menu');
    // A press before hydration does nothing, and the grid page hydrates late:
    // wait for React's props on the button, as the D-16 row above does.
    await expect
      .poll(() => button.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))))
      .toBe(true);
    await button.click();
    await expect(panel).toBeVisible();

    // usePathname drops the query, so the pathname stays /photos and the route-change
    // close never fires: the link's click handler has to close the panel at tap.
    await panel.getByRole('link', { name: 'Photographs', exact: true }).click();
    await expect(page).toHaveURL(/\/photos$/, { timeout: 15000 });
    await expect(panel).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
  });

  /**
   * Opens the menu from the keyboard (focus Menu, Enter), so `:focus-visible`
   * applies to the panel links focused next, and waits for the panel to settle.
   */
  async function openMenuByKeyboard(page: Page) {
    const button = page.getByRole('button', { name: 'Menu' });
    const panel = page.locator('#site-menu');
    // Enter before hydration does nothing: wait for React's props on the button.
    await expect
      .poll(() => button.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))))
      .toBe(true);
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await panel.evaluate((el) =>
      Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined))),
    );
    return panel;
  }

  /**
   * Focuses the panel link at `index` (Tab from the Menu button, or `.focus()` in
   * WebKit, which never Tabs to links) and asserts the inset ring: `:focus-visible`,
   * outline offset -4px and width 2px, and the ring's outer rectangle (the link's
   * box inset by -(offset + width) = 2 px) inside the panel's client rectangle.
   * Returns the panel's scrollTop after the focus.
   */
  async function expectInsetRing(
    page: Page,
    panel: ReturnType<Page['locator']>,
    index: number,
    browserName: string,
  ) {
    const link = panel.getByRole('link').nth(index);
    if (tabReachesLinks(browserName)) {
      // Tab until the link has focus rather than a fixed count: when the panel
      // scrolls (375 x 320) Firefox adds the scroll container itself as a Tab stop.
      await page.getByRole('button', { name: 'Menu' }).focus();
      for (let i = 0; i <= index + 2; i++) {
        await page.keyboard.press('Tab');
        if (await link.evaluate((el) => el === document.activeElement)) break;
      }
    } else {
      await link.focus();
    }
    await expect(link).toBeFocused();
    const m = await link.evaluate((el) => {
      const menu = el.closest('#site-menu') as HTMLElement;
      const cs = getComputedStyle(el);
      const grow = parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth);
      const box = el.getBoundingClientRect();
      const outer = menu.getBoundingClientRect();
      const left = outer.left + menu.clientLeft;
      const top = outer.top + menu.clientTop;
      return {
        focusVisible: el.matches(':focus-visible'),
        offset: cs.outlineOffset,
        width: cs.outlineWidth,
        ring: { left: box.left - grow, top: box.top - grow, right: box.right + grow, bottom: box.bottom + grow },
        inner: { left, top, right: left + menu.clientWidth, bottom: top + menu.clientHeight },
        scrollTop: menu.scrollTop,
      };
    });
    expect(m.focusVisible).toBe(true);
    expect(m.offset).toBe('-4px');
    expect(m.width).toBe('2px');
    expect(m.ring.left).toBeGreaterThanOrEqual(m.inner.left);
    expect(m.ring.top).toBeGreaterThanOrEqual(m.inner.top);
    expect(m.ring.right).toBeLessThanOrEqual(m.inner.right);
    expect(m.ring.bottom).toBeLessThanOrEqual(m.inner.bottom);
    return m.scrollTop;
  }

  test('focused panel links draw an inset ring the panel never clips (SHELL-08, D-17)', async ({
    page,
    browserName,
  }) => {
    await page.goto('/roadmap');
    const panel = await openMenuByKeyboard(page);

    // Top row ('Home') and bottom row ('Contact').
    await expectInsetRing(page, panel, 0, browserName);
    await expectInsetRing(page, panel, site.nav.length - 1, browserName);
  });

  test('the inset ring stays inside the panel while it scrolls at 375 x 320 (SHELL-08, D-17)', async ({
    page,
    browserName,
  }) => {
    // max-h-[calc(100svh-var(--nav-h))] leaves the panel shorter than its rows here.
    await page.setViewportSize({ width: 375, height: 320 });
    await page.goto('/roadmap');
    const panel = await openMenuByKeyboard(page);

    const scrollTop = await expectInsetRing(page, panel, site.nav.length - 1, browserName);
    expect(scrollTop).toBeGreaterThan(0);
  });
});

test.describe('Shell reduced motion', () => {
  test.use({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });

  test('opening the menu runs no animation in the header', async ({ page }) => {
    await page.goto('/roadmap');

    const button = page.getByRole('button', { name: 'Menu' });
    await button.click();
    await expect(page.locator('#site-menu')).toBeVisible();

    // Two frames, so a CSS transition started by the open would be registered.
    const running = await page.getByRole('banner').evaluate(
      (header) =>
        new Promise<number>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve(header.getAnimations({ subtree: true }).length)),
          ),
        ),
    );
    expect(running).toBe(0);
  });
});

/**
 * SHELL-04 footer map legend (08-UI-SPEC "Footer Map-Sheet Margin Contract";
 * UI Considerations E1 and E4 backstops): the band keeps its aspect ratio, the
 * one visible scale bar is true to the extent width, the ticks follow the photo
 * data, the footer has exactly five tab stops (GitHub, LinkedIn, Email and the
 * two Source links, 18 D-16), and every route credits the swissALTIRegio source
 * with a short credit linked to its /sources entry plus an All data sources
 * link, never the long reference itself (it lives on /sources).
 */
const LEGEND_VIEWPORTS = [
  // [width, height, band aspect, scale length in metres]
  [375, 812, 5, 2000],
  [768, 900, 8, 2000],
  [1440, 900, 12, 1000],
  // The 500 m tier: guards the lg: / min-[112rem]: variant order (two tiers visible at once).
  [1920, 1080, 12, 500],
] as const;

const FOOTER_FOCUSABLE = 'a[href], button, [tabindex]:not([tabindex="-1"])';
/** The footer ticks are the Home waypoints (DATA-09): photos outside the Home list add none. */
const homeList = homePhotos();
const positionedPhotos = homeList.filter((p) => p.position !== null);

test.describe('Footer map legend (SHELL-04)', () => {
  for (const [width, height, aspect, lengthM] of LEGEND_VIEWPORTS) {
    test(`@${width}: band ${aspect}:1, true ${lengthM} m scale bar, ticks, 5 tab stops`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      const footer = page.getByRole('contentinfo');
      await footer.scrollIntoViewIfNeeded();

      // E1: the band (the footer's first child) is full width at its aspect ratio.
      const band = await footer.locator(':scope > div').first().boundingBox();
      const footerBox = await footer.boundingBox();
      expect(band).not.toBeNull();
      expect(footerBox).not.toBeNull();
      expect(Math.abs(band!.width - footerBox!.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(band!.height - band!.width / aspect)).toBeLessThanOrEqual(1);

      // E4: exactly one tier is rendered, and its bar is L / extentWidthM of the band.
      const bars = footer.locator('dd [class~="h-2"]').filter({ visible: true });
      await expect(bars).toHaveCount(1);
      const bar = await bars.boundingBox();
      expect(Math.abs(bar!.width - (band!.width * lengthM) / terrain.extent.widthM)).toBeLessThanOrEqual(1);
      const names = footer.getByText(/^Scale bar, /).filter({ visible: true });
      await expect(names).toHaveCount(1);
      await expect(names).toHaveText(`Scale bar, ${lengthM >= 1000 ? `${lengthM / 1000} km` : `${lengthM} m`}`);

      // D-20 / DATA-04: one tick per positioned photo, exactly the approximate one dashed.
      await expect(footer.locator('[data-tick]')).toHaveCount(positionedPhotos.length);
      await expect(footer.locator('[data-tick="approximate"]')).toHaveCount(
        positionedPhotos.filter((p) => p.position.approximate).length,
      );
      await expect(footer.locator('[data-tick="approximate"]')).toHaveCount(1);

      // GitHub, LinkedIn and Email, then the Source row's two links (18 D-16); nothing else.
      expect(await footer.evaluate((el, sel) => el.querySelectorAll(sel).length, FOOTER_FOCUSABLE)).toBe(5);

      if (width === 375) {
        // E3/E5: nothing in the footer (Extent lines, attribution, scale labels) runs
        // past the viewport. Scoped to the footer because Home's legacy v1 cards
        // overflow at 375 on their own (pre-existing; Home is rebuilt in Phase 9).
        const overflow = await footer.evaluate((el) => {
          const clientWidth = document.documentElement.clientWidth;
          const right = Math.max(...Array.from(el.querySelectorAll('*'), (n) => n.getBoundingClientRect().right));
          return { right, clientWidth, scrollWidth: el.scrollWidth, footerWidth: el.clientWidth };
        });
        expect(overflow.right).toBeLessThanOrEqual(overflow.clientWidth);
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.footerWidth);
      }
    });
  }

  test('@375: no horizontal scroll on a route with the full footer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/roadmap');
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('every route credits the source with a link to its /sources entry and an All data sources link', async ({
    page,
  }) => {
    // Eight full page loads in one test. A cold dev server compiles each route
    // on its first visit, which overran the 30 s budget (12-22 reproduced five
    // timeouts at /offline); the slow marker triples it. CI's production run
    // is unaffected.
    test.slow();
    for (const [path] of ROUTES) {
      await page.goto(path);
      const footer = page.getByRole('contentinfo');
      await expect(footer).toContainText(`Contours derived from ${SHORT_CREDIT.swissaltiregio}.`);
      await expect(footer.getByRole('link', { name: SHORT_CREDIT.swissaltiregio, exact: true })).toHaveAttribute(
        'href',
        sourceHref('swissaltiregio'),
      );
      await expect(footer.getByRole('link', { name: 'All data sources', exact: true })).toHaveAttribute(
        'href',
        SOURCES_PAGE.href,
      );
      // The 631-character reference moved to /sources (D-16): none of it in the footer.
      await expect(footer).not.toContainText('Tarquini');
    }
  });
});
