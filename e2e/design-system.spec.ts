import { test, expect } from '@playwright/test';

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
