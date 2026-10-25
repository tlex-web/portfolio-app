import { test, expect, type Page } from '@playwright/test';
import { decode } from 'fast-png';
import { arrivalsFromBlocks } from '@/lib/ascent/progress';
import { scrollBlockToCentre } from './helpers/ascent';
import { nextFrames } from './helpers/webgl';

/**
 * The live terrain canvas in a browser (HOME-02; D-16, D-17, D-18, D-22;
 * 09-UI-SPEC "Stage: Poster, Sheet Box and Canvas", "Night-tinted relief" and
 * the E2 "Terrain canvas" rows; 09-RESEARCH "SwiftShader smoke check by pixel
 * sampling").
 *
 * Chromium renders WebGL through SwiftShader here, so these checks run on real
 * pixels: the canvas must fade in over the poster at p = 0 without a visible
 * change (the plan view of the poster, drawn with the same relief formula and
 * contour colours), draw contour lines, load the mesh size that fits the
 * stage, stay inside the CSP (no Worker, no violation), keep the layout still
 * while it loads and reveals, reveal nothing when a load is abandoned, and
 * reveal a late load at the current progress. Headless Firefox on the CI
 * runner has no WebGL, so every title carries '@chromium-only' (the Firefox
 * project drops them).
 */

const stage = (page: Page) => page.locator('[data-ascent-stage]');
/** R3F's wrapper div: it carries the class (and so the fade) and data-grid-size. */
const canvasBox = (page: Page) => page.locator('[data-ascent-stage] [data-grid-size]');
const HEIGHTMAP = /\/terrain\/heightmap-/;

/** Waits until the stage reads '3d' and the canvas has finished fading in. */
async function waitForRevealed(page: Page) {
  await expect(stage(page)).toHaveAttribute('data-ascent-mode', '3d', { timeout: 20000 });
  await expect
    .poll(() => canvasBox(page).evaluate((el) => getComputedStyle(el).opacity), { timeout: 5000 })
    .toBe('1');
}

/** Holds every heightmap response for `ms` (a slow network), then lets it through. */
async function delayHeightmap(page: Page, ms: number) {
  await page.route(HEIGHTMAP, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.continue().catch(() => {}); // the page may have abandoned the request
  });
}

/** Scrolls once with the wheel (a real first scroll for the arming listener). */
async function scrollOnce(page: Page) {
  await page.mouse.move(200, 200);
  await page.mouse.wheel(0, 400);
  await nextFrames(page);
}

/** Collects uncaught page errors. */
function pageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

/** Mean absolute difference over the R, G and B channels of two same-size PNG screenshots. */
function meanAbsDiff(a: Buffer, b: Buffer): number {
  const pa = decode(a);
  const pb = decode(b);
  expect([pb.width, pb.height]).toEqual([pa.width, pa.height]);
  let sum = 0;
  let count = 0;
  for (let i = 0, j = 0; i < pa.data.length; i += pa.channels, j += pb.channels) {
    for (let c = 0; c < 3; c++) sum += Math.abs(pa.data[i + c] - pb.data[j + c]);
    count += 3;
  }
  return sum / count;
}

/** Luminance spread and the share of contour-coloured pixels of a PNG (09-RESEARCH D-22 smoke check). */
function canvasStats(png: Buffer) {
  const { data, channels } = decode(png);
  let n = 0;
  let contour = 0;
  let sum = 0;
  let sum2 = 0;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const l = (r + g + b) / 3;
    n++;
    sum += l;
    sum2 += l * l;
    // Ground is 0.68 surface + 0.32 grey, so b - r is about 12 for any grey;
    // a contour line mixes toward firn-50 (b - r = -9) and pulls it to 10 or below.
    if (b - r <= 10) contour++;
  }
  const mean = sum / n;
  return { contourFrac: contour / n, lumStd: Math.sqrt(sum2 / n - mean * mean) };
}

/** Waypoint `k`'s arrival point, measured the way AscentController measures it. */
async function arrivalOf(page: Page, k: number): Promise<number> {
  const layout = await page.evaluate(() => {
    const track = document.querySelector('[data-ascent-track]') as HTMLElement;
    const stageEl = document.querySelector('[data-ascent-stage]') as HTMLElement;
    const trackRect = track.getBoundingClientRect();
    const stageHeight = stageEl.getBoundingClientRect().height;
    const blocks = Array.from(
      track.querySelectorAll<HTMLElement>(
        '[data-ascent-block="waypoint"], [data-ascent-block="summit"]'
      ),
      (block) => {
        const rect = block.getBoundingClientRect();
        return { offset: rect.top - trackRect.top, height: rect.height };
      }
    );
    return { blocks, stageHeight, distance: trackRect.height - stageHeight };
  });
  return arrivalsFromBlocks(layout.blocks, layout.stageHeight, layout.distance)[k];
}

test.describe('Home terrain canvas (HOME-02)', () => {
  test('canvas fades in over the poster at p = 0 @chromium-only', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForRevealed(page);

    const withCanvas = await stage(page).screenshot();
    await page.addStyleTag({ content: 'canvas { visibility: hidden !important; }' });
    const posterOnly = await stage(page).screenshot();

    const diff = meanAbsDiff(withCanvas, posterOnly);
    test.info().annotations.push({ type: 'mean-abs-diff', description: diff.toFixed(3) });
    expect(diff).toBeLessThanOrEqual(3);
  });

  test('contour lines are drawn @chromium-only', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 412, height: 839 });
    await page.goto('/');
    await waitForRevealed(page);

    // Only the canvas pixels: the hero copy and the rail sit over the stage.
    await page.addStyleTag({
      content:
        'body * { visibility: hidden !important; } [data-ascent-stage] canvas { visibility: visible !important; }',
    });
    const { contourFrac, lumStd } = canvasStats(await stage(page).locator('canvas').screenshot());
    test.info().annotations.push({
      type: 'canvas-stats',
      description: `lumStd ${lumStd.toFixed(2)}, contourFrac ${contourFrac.toFixed(4)}`,
    });
    expect(lumStd, 'luminance standard deviation (not blank)').toBeGreaterThan(4);
    expect(contourFrac, 'share of contour-coloured pixels').toBeGreaterThan(0.003);
  });

  test.describe('mesh size follows the stage width (D-18)', () => {
    for (const { width, height, grid, other } of [
      { width: 412, height: 839, grid: 256, other: 512 },
      { width: 1440, height: 900, grid: 512, other: 256 },
    ]) {
      test(`${width} px loads the ${grid} heightmap @chromium-only`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        const wrong: string[] = [];
        page.on('request', (request) => {
          if (request.url().includes(`/terrain/heightmap-${other}.`)) wrong.push(request.url());
        });
        const requested = page.waitForRequest(
          (request) => request.url().includes(`/terrain/heightmap-${grid}.`),
          { timeout: 20000 }
        );
        await page.goto('/');
        await scrollOnce(page);
        await requested;
        await expect(canvasBox(page)).toHaveAttribute('data-grid-size', String(grid));
        expect(wrong).toEqual([]);
      });
    }
  });

  test('no worker and no CSP violation @chromium-only', async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript(() => {
      const w = window as unknown as { __workers: number; Worker: typeof Worker };
      w.__workers = 0;
      const Native = w.Worker;
      w.Worker = class extends Native {
        constructor(...args: ConstructorParameters<typeof Worker>) {
          super(...args);
          w.__workers++;
        }
      };
    });
    const messages: string[] = [];
    page.on('console', (msg) => messages.push(msg.text()));
    const errors = pageErrors(page);

    await page.goto('/');
    await scrollOnce(page);
    await waitForRevealed(page);

    const workers = await page.evaluate(
      () => (window as unknown as { __workers: number }).__workers
    );
    expect(workers, 'Worker constructions').toBe(0);
    expect(messages.filter((m) => /Content Security Policy|Refused to/.test(m))).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('reveal keeps the layout @chromium-only', async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number };
      w.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!shift.hadRecentInput) w.__cls += shift.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      // Arm on the first scroll only, so the page can be measured before arming.
      window.requestIdleCallback = () => 0;
    });
    await delayHeightmap(page, 2000);
    const trackHeight = () =>
      page.locator('[data-ascent-track]').evaluate((el) => el.getBoundingClientRect().height);
    const saysLoading = () =>
      stage(page).evaluate((el) => /loading/i.test(el.textContent ?? ''));

    await page.goto('/');
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'eligible');
    await expect(page.locator('canvas')).toHaveCount(0);
    const before = await trackHeight();

    await scrollOnce(page);
    await expect(stage(page).locator('canvas')).toHaveCount(1, { timeout: 10000 });
    // Loading: the canvas exists, the stage still reads 'eligible' and the canvas is invisible.
    await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'eligible');
    expect(await canvasBox(page).evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    expect(await saysLoading()).toBe(false);

    await waitForRevealed(page);
    await page.waitForTimeout(1000);
    expect(await trackHeight()).toBe(before);
    expect(await saysLoading()).toBe(false);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    test.info().annotations.push({ type: 'layout-shift', description: cls.toFixed(4) });
    expect(cls).toBeLessThan(0.1);
  });

  test('a load abandoned for reduced motion reveals nothing @chromium-only', async ({ page }) => {
    test.setTimeout(60000);
    const errors = pageErrors(page);
    await delayHeightmap(page, 3000);

    await page.goto('/');
    const requested = page.waitForRequest(HEIGHTMAP, { timeout: 15000 });
    await scrollOnce(page);
    await requested;
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'static-reduced');
    await page.waitForTimeout(4000); // past the held response
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'static-reduced');
    const marks = await page.evaluate(
      () => performance.getEntriesByName('ascent-canvas-ready').length
    );
    expect(marks, 'ascent-canvas-ready marks').toBe(0);
    expect(errors).toEqual([]);
  });

  test('a late canvas reveals at the current progress @chromium-only', async ({ page }) => {
    test.setTimeout(60000);
    await delayHeightmap(page, 3000);
    await page.goto('/');
    const requested = page.waitForRequest(HEIGHTMAP, { timeout: 15000 });
    // Centring the second waypoint is the first scroll: it arms the stage.
    await scrollBlockToCentre(page, 'li[data-ascent-block="waypoint"] >> nth=1');
    await requested;

    await waitForRevealed(page);
    const p = await page.evaluate(() => {
      const mark = performance.getEntriesByName('ascent-canvas-ready')[0] as
        | PerformanceMark
        | undefined;
      return (mark?.detail as { p: number } | undefined)?.p ?? null;
    });
    const arrival = await arrivalOf(page, 1);
    test.info().annotations.push({
      type: 'reveal-progress',
      description: `p ${p?.toFixed(4)}, waypoint 2 arrival ${arrival.toFixed(4)}`,
    });
    expect(p).not.toBeNull();
    expect(Math.abs((p as number) - arrival)).toBeLessThanOrEqual(0.03);
  });
});
