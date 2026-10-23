import { test, expect, type Page } from '@playwright/test';
import { site } from '@/data/site';

/**
 * Shell contract (SHELL-01, SHELL-02, DSGN-08 shell; UI-SPEC "Guardrail
 * Constraints" Landmarks row and "UI Considerations" E1-E4, E10).
 *
 * Every content route renders inside app/(site)/layout.tsx -> SiteChrome:
 * one banner holding one Primary nav, one main#main-content, one contentinfo.
 * Landmarks are counted with toHaveCount(1), never narrowed with .first(),
 * so a duplicated shell fails here instead of being hidden (PITFALLS 5, 7).
 */

type Label = (typeof site.nav)[number]['label'];

/** Each content route and the nav destination that must carry aria-current="page". */
const ROUTES: ReadonlyArray<readonly [path: string, current: Label | null]> = [
  ['/', 'Home'],
  ['/photos', 'Photographs'],
  ['/projects', 'Engineering'],
  ['/projects/clix-cli', 'Engineering'],
  ['/roadmap', 'Roadmap'],
  ['/contact', 'Contact'],
  // Not a nav destination: no link is current.
  ['/offline', null],
];

const primaryNav = (page: Page) => page.getByRole('navigation', { name: 'Primary' });

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
    test(`${path}: one shell, skip link first, current page ${current ?? 'none'}`, async ({ page }) => {
      await page.goto(path);

      // E2/E3: exactly one of each landmark.
      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(primaryNav(page)).toHaveCount(1);
      await expect(page.locator('#main-content')).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
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
      await page.keyboard.press('Tab');
      const skip = page.getByRole('link', { name: 'Skip to main content' });
      await expect(skip).toBeFocused();
      await expect(skip).toHaveAttribute('href', '#main-content');
      await page.keyboard.press('Enter');
      await expect(page.locator('#main-content')).toBeFocused();
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
 * /projects/no-such-slug exercises notFound() inside the (site) group, which
 * renders app/(site)/not-found.tsx inside the group layout's chrome.
 */
const NOT_FOUND_PATHS: ReadonlyArray<readonly [path: string, current: Label | null]> = [
  ['/__no-such-page__', null],
  ['/gradient-mesh', null],
  ['/particle-buttons', null],
  ['/transitions', null],
  // Under /projects the Engineering destination stays current (prefix match).
  ['/projects/no-such-slug', 'Engineering'],
];

test.describe('Shell 404', () => {
  for (const [path, current] of NOT_FOUND_PATHS) {
    test(`${path}: HTTP 404, no redirect, one shell, designed 404 body`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(404);
      expect(new URL(page.url()).pathname).toBe(path);

      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(primaryNav(page)).toHaveCount(1);
      await expect(page.locator('#main-content')).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);

      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Page not found');
      await expect(main.getByText('Error 404', { exact: true })).toHaveCount(1);
      await expect(main.getByRole('link', { name: 'Go to the homepage', exact: true })).toHaveAttribute(
        'href',
        '/',
      );
      await expect(main.getByRole('link', { name: 'Photographs', exact: true })).toHaveAttribute(
        'href',
        '/photos',
      );
      await expect(main.getByRole('link', { name: 'Engineering', exact: true })).toHaveAttribute(
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
    await page.keyboard.press('Tab');
    await expect(rows.nth(0)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
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
