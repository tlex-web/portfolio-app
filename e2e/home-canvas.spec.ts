import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { decode } from 'fast-png';
import { Vector3 } from 'three';
import { routeCurvesFor } from '@/components/home/terrain/route-curve';
import { lowestDemM } from '@/data/generated/photos';
import { terrain } from '@/data/generated/terrain';
import { arrivalsFromBlocks } from '@/lib/ascent/progress';
import { RELIEF_EXAGGERATION, curveParamAt } from '@/lib/ascent/route';
import { buildWaypoints } from '@/lib/ascent/waypoints';
import { formatMetres } from '@/lib/photo-format';
import { meshHeightAtUv, toMetres } from '@/lib/terrain/heightmap';
import { readout, scrollBlockToCentre } from './helpers/ascent';
import { expectNoErrorPage, nextFrames } from './helpers/webgl';

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
 *
 * The route (09-10; D-02, D-03, D-09, D-22): the D-22 smoke test renders the
 * canvas at three ascent positions and checks it is not blank, has contour
 * lines and changes between positions; the 3D pins take over from the poster
 * pins at the reveal, light with the active stage (also when the canvas
 * reveals while the visitor is stationary) and all show in the summit frame;
 * and, in Node, the camera route stays at least 120 m above the decoded 512²
 * mesh from the first waypoint to the summit.
 *
 * Resilience (09-11; D-18, D-21; HOME-07): a lost WebGL context turns Home into
 * the full static poster for the rest of the page view, with no error and no
 * retry.
 */

const stage = (page: Page) => page.locator('[data-ascent-stage]');
const waypoint = (k: number) => `li[data-ascent-block="waypoint"] >> nth=${k - 1}`;
const pin3d = (page: Page, k: number) => page.locator(`[data-pin-layer="3d"] [data-pin="${k}"]`);
const waypoints = buildWaypoints();
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
    const saysLoading = () => stage(page).evaluate((el) => /loading/i.test(el.textContent ?? ''));

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

/** 32 x 32 block means of the RGB channels of a PNG screenshot (the D-22 progression check). */
function downsample(png: Buffer, size = 32): Float64Array {
  const { data, channels, width, height } = decode(png);
  const out = new Float64Array(size * size * 3);
  const count = new Float64Array(size * size);
  for (let y = 0; y < height; y++) {
    const by = Math.min(size - 1, Math.floor((y * size) / height));
    for (let x = 0; x < width; x++) {
      const bx = Math.min(size - 1, Math.floor((x * size) / width));
      const b = by * size + bx;
      const i = (y * width + x) * channels;
      for (let c = 0; c < 3; c++) out[b * 3 + c] += data[i + c];
      count[b]++;
    }
  }
  for (let b = 0; b < size * size; b++) for (let c = 0; c < 3; c++) out[b * 3 + c] /= count[b];
  return out;
}

const meanDiff = (a: Float64Array, b: Float64Array) =>
  a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / a.length;

type Box = { x: number; y: number; width: number; height: number };

/** True when `inner` lies inside `outer` (1 px tolerance for subpixel rounding). */
function inside(inner: Box, outer: Box) {
  return (
    inner.x >= outer.x - 1 &&
    inner.y >= outer.y - 1 &&
    inner.x + inner.width <= outer.x + outer.width + 1 &&
    inner.y + inner.height <= outer.y + outer.height + 1
  );
}

/** Asserts 3D pin `k` is lit with its label visible inside the stage, and no other 3D pin is lit. */
async function expectLit3dPin(page: Page, k: number) {
  await expect(pin3d(page, k)).toHaveAttribute('data-active', '');
  await expect(page.locator('[data-pin-layer="3d"] [data-pin][data-active]')).toHaveCount(1);
  const label = pin3d(page, k).locator('[data-pin-label]');
  await expect(label).toBeVisible();
  const box = await label.boundingBox();
  const stageBox = await stage(page).boundingBox();
  test.info().annotations.push({
    type: `pin ${k} label`,
    description: JSON.stringify({ label: box, stage: stageBox }),
  });
  expect(box && stageBox && inside(box, stageBox), 'label inside the stage').toBe(true);
}

test.describe('Home terrain route and 3D pins (HOME-02, HOME-03, HOME-05)', () => {
  test('smoke at three ascent positions @chromium-only', async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 412, height: 839 });
    await page.goto('/');
    await scrollOnce(page);
    await waitForRevealed(page);
    // Only the canvas pixels: the cards, rail and pins sit over the stage.
    await page.addStyleTag({
      content:
        'body * { visibility: hidden !important; } [data-ascent-stage] canvas { visibility: visible !important; }',
    });

    const positions = [
      { name: 'top', seek: () => page.evaluate(() => window.scrollTo(0, 0)), m: lowestDemM },
      {
        name: 'waypoint 2',
        seek: () => scrollBlockToCentre(page, waypoint(2)),
        m: waypoints[1].altitudeM,
      },
      {
        name: 'summit',
        seek: () => scrollBlockToCentre(page, '#summit'),
        m: terrain.summit.officialM,
      },
    ];
    const frames: Float64Array[] = [];
    for (const { name, seek, m } of positions) {
      await seek();
      await expect
        .poll(() => readout(page).evaluate((el) => el.textContent), { timeout: 5000 })
        .toBe(formatMetres(m));
      await nextFrames(page, 6); // the spring has settled and the demand frame is drawn
      const shot = await stage(page).locator('canvas').screenshot();
      const { contourFrac, lumStd } = canvasStats(shot);
      test.info().annotations.push({
        type: `canvas-stats ${name}`,
        description: `lumStd ${lumStd.toFixed(2)}, contourFrac ${contourFrac.toFixed(4)}`,
      });
      expect(lumStd, `${name}: luminance standard deviation (not blank)`).toBeGreaterThan(4);
      expect(contourFrac, `${name}: share of contour-coloured pixels`).toBeGreaterThan(0.003);
      frames.push(downsample(shot));
    }
    for (let i = 1; i < frames.length; i++) {
      const diff = meanDiff(frames[i - 1], frames[i]);
      test.info().annotations.push({ type: `progression ${i}`, description: diff.toFixed(2) });
      expect(
        diff,
        `${positions[i - 1].name} -> ${positions[i].name}: the view changes`
      ).toBeGreaterThan(6);
    }
  });

  test('pins hand over at the reveal @chromium-only', async ({ page }) => {
    test.setTimeout(60000);
    await delayHeightmap(page, 2000);
    await page.goto('/');
    // No scroll: the idle callback arms the stage, so the reveal happens at p = 0 (the plan view).
    await expect(page.locator('[data-pin-layer="3d"]')).toHaveCount(1, { timeout: 15000 });

    // While the canvas loads: the poster pins show, the 3D pins do not.
    await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'eligible');
    const visibility = (selector: string) =>
      page.locator(selector).evaluate((el) => getComputedStyle(el).visibility);
    expect(await visibility('[data-pin-layer="poster"]')).toBe('visible');
    expect(await visibility('[data-pin-layer="3d"]')).toBe('hidden');

    // At the switch to '3d', both layers flip in the same style recalculation, and
    // every 3D pin is shown where its poster pin was (the plan view equals the poster).
    await page.evaluate(() => {
      const el = document.querySelector('[data-ascent-stage]') as HTMLElement;
      const w = window as unknown as { __handover: unknown };
      new MutationObserver(() => {
        if (el.dataset.ascentMode !== '3d' || w.__handover) return;
        const vis = (s: string) =>
          getComputedStyle(document.querySelector(s) as Element).visibility;
        const shown = Array.from(
          document.querySelectorAll('[data-pin-layer="3d"] [data-pin]'),
          (pin) => getComputedStyle(pin).visibility
        ).filter((v) => v === 'visible').length;
        const offsets = Array.from(
          document.querySelectorAll('[data-pin-layer="3d"] [data-pin]'),
          (pin) => {
            const k = pin.getAttribute('data-pin');
            const poster = document.querySelector(`[data-pin-layer="poster"] [data-pin="${k}"]`);
            const a = pin.getBoundingClientRect();
            const b = (poster as Element).getBoundingClientRect();
            return Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top));
          }
        );
        w.__handover = {
          poster: vis('[data-pin-layer="poster"]'),
          layer3d: vis('[data-pin-layer="3d"]'),
          shown,
          onPosterPins: Math.max(...offsets) <= 2,
        };
      }).observe(el, { attributes: true, attributeFilter: ['data-ascent-mode'] });
    });
    await waitForRevealed(page);
    const handover = await page.evaluate(
      () => (window as unknown as { __handover: unknown }).__handover
    );
    expect(handover).toEqual({
      poster: 'hidden',
      layer3d: 'visible',
      shown: waypoints.length,
      onPosterPins: true,
    });
  });

  test('waypoint 2 lights its 3D pin @chromium-only', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 412, height: 839 });
    await page.goto('/');
    await scrollOnce(page);
    await waitForRevealed(page);
    await scrollBlockToCentre(page, waypoint(2));
    await nextFrames(page, 4);
    await expectLit3dPin(page, 2);
  });

  test.describe('summit frame shows every waypoint', () => {
    for (const { width, height } of [
      { width: 1440, height: 900 },
      { width: 412, height: 839 },
    ]) {
      test(`at ${width} x ${height} @chromium-only`, async ({ page }) => {
        test.setTimeout(60000);
        await page.setViewportSize({ width, height });
        await page.goto('/');
        await scrollOnce(page);
        await waitForRevealed(page);
        await scrollBlockToCentre(page, '#summit');
        await nextFrames(page, 6);

        const stageBox = await stage(page).boundingBox();
        for (const w of waypoints) {
          const pin = pin3d(page, w.k);
          await expect(pin, `3D pin ${w.k} shown`).toBeVisible();
          const box = await pin.boundingBox();
          expect(box && stageBox && inside(box, stageBox), `3D pin ${w.k} inside the stage`).toBe(
            true
          );
        }
        await expect(page.locator('[data-pin-layer="3d"] [data-pin][data-active]')).toHaveCount(0);
      });
    }
  });

  test('route clears the terrain @chromium-only', async () => {
    const file = path.join(process.cwd(), 'public', terrain.assets.heightmap['512']);
    const png = decode(fs.readFileSync(file));
    const n = 512;
    const metres = toMetres(png.data, terrain.dem.heightScale);
    const W = terrain.extent.widthM;
    const anchors = waypoints.map((w) => w.uv);
    const arrivals = [...waypoints.map((_, i) => (i + 1) / (waypoints.length + 1)), 1];
    const t0 = curveParamAt(arrivals[0], arrivals);
    const point = new Vector3();

    for (const [width, height] of [
      [1440, 836],
      [375, 603],
    ]) {
      const curves = routeCurvesFor({ width, height, anchors, metres, gridSize: n });
      let lowest = Infinity;
      for (let i = 0; i <= 200; i++) {
        const t = t0 + ((1 - t0) * i) / 200;
        curves.position.getPoint(t, point);
        const ground = meshHeightAtUv(metres, n, point.x / W + 0.5, point.z / W + 0.5);
        lowest = Math.min(lowest, point.y - ground * RELIEF_EXAGGERATION);
      }
      test.info().annotations.push({
        type: `clearance ${width} x ${height}`,
        description: `${lowest.toFixed(0)} m`,
      });
      expect(
        lowest,
        `${width} x ${height}: lowest clearance above the mesh`
      ).toBeGreaterThanOrEqual(120);
    }
  });

  test('a canvas revealed while stationary lights its 3D pin @chromium-only', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 412, height: 839 });
    await delayHeightmap(page, 3000);
    await page.goto('/');
    const requested = page.waitForRequest(HEIGHTMAP, { timeout: 15000 });
    // Centring waypoint 2 is the first scroll: it arms the stage. No scroll or mouse move after it.
    await scrollBlockToCentre(page, waypoint(2));
    await requested;

    await waitForRevealed(page);
    await expectLit3dPin(page, 2);
  });
});

test.describe('Home canvas resilience (HOME-02, HOME-07)', () => {
  test('context loss falls back to the poster @chromium-only', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 412, height: 839 });
    const errors = pageErrors(page);
    await page.goto('/');
    await scrollOnce(page);
    await waitForRevealed(page);

    const lost = await page.evaluate(() => {
      const gl = document.querySelector('[data-ascent-stage] canvas')?.getContext('webgl2');
      const ext = gl?.getExtension('WEBGL_lose_context');
      ext?.loseContext();
      return !!ext;
    });
    expect(lost, 'WEBGL_lose_context available').toBe(true);

    // At once and with no fade: the canvas is gone, the poster and its pins are the terrain.
    await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'static');
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator('[data-pin-layer="3d"]')).toHaveCount(0);
    await expect(page.locator('[data-pin-layer="poster"]')).toBeVisible();
    expect(
      await page
        .locator('[data-pin-layer="poster"]')
        .evaluate((el) => getComputedStyle(el).visibility)
    ).toBe('visible');
    // A full Home, never an error (D-21).
    await expectNoErrorPage(page);
    await expect(page.locator('li[data-ascent-block="waypoint"] section')).toHaveCount(
      waypoints.length
    );
    await expect(page.locator('#summit')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 2, name: 'About', exact: true })).toHaveCount(1);
    const downgrade = await page.evaluate(() =>
      performance
        .getEntriesByName('ascent-downgrade')
        .map((mark) => ((mark as PerformanceMark).detail as { reason: string }).reason)
    );
    expect(downgrade).toEqual(['context-lost']);

    // Sticky for the page view: scrolling on never brings the canvas back (no retry).
    await scrollBlockToCentre(page, waypoint(3));
    await page.waitForTimeout(5000);
    await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'static');
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
