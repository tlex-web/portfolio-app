import { test, expect, chromium } from '@playwright/test';

/**
 * DSGN-07 type stack (UI-SPEC "Typography", build step 7c): Schibsted Grotesk
 * display, Inter body, JetBrains Mono for data with tabular figures, and no
 * layout shift from the font swap (PITFALLS 24).
 */
test.describe('Design system', () => {
  test('live h1 on / renders in Schibsted Grotesk', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1').first();
    await expect(h1).toBeAttached();

    const fontFamily = await h1.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(fontFamily).toContain('Schibsted');
  });

  // The base h1 rule is proven on a bare, class-less h1. Headings that carry
  // Tailwind utilities (font-bold, text-shadow-glow*, colour classes) keep their
  // own weight, glow and colour until their redesign phase (Phases 9-12):
  // the utilities layer beats @layer base, so only family and balance change.
  test('base h1 rule: Schibsted 40/44, weight 600, no text-shadow (bare h1)', async ({ page }) => {
    await page.goto('/');

    const style = await page.evaluate(() => {
      const h1 = document.createElement('h1');
      h1.textContent = 'Base heading';
      (document.querySelector('main') ?? document.body).appendChild(h1);
      const cs = getComputedStyle(h1);
      const result = {
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        textShadow: cs.textShadow,
      };
      h1.remove();
      return result;
    });

    expect(style.fontFamily).toContain('Schibsted');
    expect(style.fontWeight).toBe('600');
    expect(style.fontSize).toBe('40px');
    expect(style.lineHeight).toBe('44px');
    expect(style.textShadow).toBe('none');
  });

  test('body uses Inter', async ({ page }) => {
    await page.goto('/');

    const fontFamily = await page.evaluate(
      () => getComputedStyle(document.body).fontFamily
    );
    expect(fontFamily).toContain('Inter');
  });

  test('mono data is JetBrains Mono with tabular figures', async ({ page }) => {
    await page.goto('/');

    const style = await page.evaluate(() => {
      const code = document.createElement('code');
      code.textContent = '1';
      document.body.appendChild(code);
      const cs = getComputedStyle(code);
      const result = {
        fontFamily: cs.fontFamily,
        fontVariantNumeric: cs.fontVariantNumeric,
      };
      code.remove();
      return result;
    });

    expect(style.fontVariantNumeric).toContain('tabular-nums');
    expect(style.fontFamily).toContain('JetBrains');
  });

  // G1 (PITFALLS 24): the font swap must not shift layout. layout-shift entries
  // are Chromium-only, so the Firefox project drops this test via grepInvert.
  test('layout shift stays below 0.1 @chromium-only', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number };
      w.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
          };
          if (!shift.hadRecentInput) {
            w.__cls += shift.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    for (const route of ['/', '/photos', '/projects']) {
      await page.goto(route, { waitUntil: 'load' });
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      await page.waitForTimeout(1000);

      const cls = await page.evaluate(
        () => (window as unknown as { __cls: number }).__cls
      );
      console.log(`CLS ${route}: ${cls.toFixed(4)}`);
      expect(cls, `layout-shift sum on ${route}`).toBeLessThan(0.1);
    }
  });
});

/**
 * DSGN-09 (UI-SPEC "Scrollbar", build step 7d): a thin visible scrollbar with
 * a stable gutter. Headless Chromium launches with --hide-scrollbars (RESEARCH
 * Pitfall 4), so the root rules are asserted as computed styles, and the G3
 * box check runs with that flag removed so real scrollbars take up space.
 */
test.describe('Scrollbar', () => {
  test('html carries the stable gutter, thin width and dark scheme', async ({ page, browserName }) => {
    await page.goto('/');

    const style = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        scrollbarGutter: cs.scrollbarGutter,
        scrollbarWidth: cs.scrollbarWidth,
        colorScheme: cs.colorScheme,
      };
    });

    expect(style.scrollbarGutter).toBe('stable');
    // Playwright's headless Firefox hides scrollbars by forcing the root's
    // scrollbar-width to none (CI 07-12: gutter "stable", width "none"), so the
    // authored width is only observable in Chromium and WebKit.
    if (browserName !== 'firefox') {
      expect(style.scrollbarWidth).toBe('thin');
    }
    expect(style.colorScheme).toBe('dark');
  });

  // G3 (PITFALLS 18): opening a scroll-locking overlay must not move the
  // header's bounding box. Playwright forbids launchOptions in test.use inside
  // a describe (it forces a new worker), so this test launches its own
  // Chromium without --hide-scrollbars instead of changing the whole file.
  // The @chromium-only tag keeps it out of the Firefox project.
  test('scroll lock keeps the header box @chromium-only', async ({ baseURL }) => {
    const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
    try {
      const context = await browser.newContext({
        baseURL,
        viewport: { width: 1440, height: 900 },
      });
      const page = await context.newPage();
      await page.goto('/photos');

      const header = page.getByRole('banner').first();
      await expect(header).toBeVisible();

      // Guard against a trivial pass: the classic scrollbar must take up layout
      // width here, or the box check below proves nothing.
      const gutter = await page.evaluate(
        () => window.innerWidth - document.documentElement.clientWidth
      );
      console.log(`G3 scrollbar gutter: ${gutter}px`);
      expect(gutter, 'real scrollbar width (gutter)').toBeGreaterThan(0);

      // The v1 Header slides in from y -100 (Motion entrance, DURATION.enter),
      // so read the box only once two consecutive reads agree.
      const settledBox = async () => {
        let prev = await header.boundingBox();
        for (let i = 0; i < 50; i++) {
          await page.waitForTimeout(100);
          const next = await header.boundingBox();
          if (prev && next && JSON.stringify(prev) === JSON.stringify(next)) return next;
          prev = next;
        }
        throw new Error('header box never settled');
      };

      const before = await settledBox();

      await page.getByRole('button', { name: /View details for/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();

      const after = await settledBox();
      console.log(`G3 header box before ${JSON.stringify(before)} after ${JSON.stringify(after)}`);

      expect(after.x).toBe(before.x);
      expect(after.y).toBe(before.y);
      expect(after.width).toBe(before.width);
    } finally {
      await browser.close();
    }
  });
});
