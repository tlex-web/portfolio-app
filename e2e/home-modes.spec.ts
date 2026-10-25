import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { buildWaypoints } from '@/lib/ascent/waypoints';
import { scrollBlockToCentre } from './helpers/ascent';
import {
  disableWebGL,
  expectNoErrorPage,
  nextFrames,
  spoofDeviceMemory,
  spoofSaveData,
} from './helpers/webgl';

/**
 * Home's modes in a browser (HOME-02, HOME-07, HOME-08; D-18, D-19, D-21;
 * 09-UI-SPEC "Modes", "Stage: Poster, Sheet Box and Canvas", "Contrast map"
 * and the "Additional backstops").
 *
 * The capability gate writes the mode on the stage as `data-ascent-mode`.
 * Every static trigger (no WebGL2, Save-Data, deviceMemory below 4) must give
 * the complete Home on its poster without ever requesting a heightmap or a
 * script holding three.js; reduced motion gives the compact final state; a
 * capable Chromium (SwiftShader) gets the lazy canvas only after idle or the
 * first scroll. The page never scrolls sideways or shifts, the cue links work
 * in every mode, and the text over the relief is measured on the rendered
 * pixels (B7, B8), not on token pairs.
 *
 * Headless Firefox on the CI runner has no WebGL, so tests that need the 3D
 * path carry the '@chromium-only' tag (the Firefox project drops them).
 */

const waypoints = buildWaypoints();
const second = waypoints[1];

type Setup = { name: string; setup: (page: Page) => Promise<void> };

/** The three capability triggers that keep the tall layout on the poster. */
const STATIC_TRIGGERS: Setup[] = [
  { name: 'no WebGL2', setup: disableWebGL },
  { name: 'Save-Data', setup: spoofSaveData },
  { name: 'deviceMemory 2', setup: (page) => spoofDeviceMemory(page, 2) },
];

const reduceMotion: Setup['setup'] = (page) => page.emulateMedia({ reducedMotion: 'reduce' });

const stage = (page: Page) => page.locator('[data-ascent-stage]');
const canvas = (page: Page) => page.locator('canvas');
const HEIGHTMAP = /\/terrain\/heightmap-/;

/** Scrolls once with the wheel (a real first scroll for the arming listener). */
async function scrollOnce(page: Page) {
  await page.mouse.move(200, 200);
  await page.mouse.wheel(0, 400);
  await nextFrames(page);
}

/** The full Home: hero, poster, every card, trail signs, plaque and About, no error UI. */
async function expectCompleteHome(page: Page) {
  await expect(page.locator('[data-sheet-box] img')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('li[data-ascent-block="waypoint"] section')).toHaveCount(waypoints.length);
  for (const w of waypoints) {
    await expect(page.locator(`li[id="waypoint-${w.slug}"]`).getByRole('heading', { level: 2 })).toHaveCount(1);
  }
  await expect(page.locator('ul[aria-label="Trail signs"]')).toHaveCount(2);
  await expect(page.locator('#summit')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 2, name: 'About', exact: true })).toBeVisible();
  await expect(page.locator('#main-content').getByRole('alert')).toHaveCount(0);
  await expect(page.getByText(/not supported/i)).toHaveCount(0);
  await expectNoErrorPage(page);
}

/** Bodies of every script the page loaded (from its resource entries, refetched). */
async function loadedScriptBodies(page: Page): Promise<{ url: string; body: string }[]> {
  const urls = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry as PerformanceResourceTiming)
      .filter(
        (entry) => entry.initiatorType === 'script' || /\.m?js(\?|$)/.test(new URL(entry.name).pathname)
      )
      .map((entry) => entry.name)
      .filter((url) => new URL(url).origin === location.origin)
  );
  const unique = [...new Set(urls)];
  return Promise.all(
    unique.map(async (url) => ({ url, body: await (await page.request.get(url)).text() }))
  );
}

/** Layout-shift sum (no recent input), collected from the first paint. */
async function trackLayoutShift(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
        if (!shift.hadRecentInput) w.__cls += shift.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
}

async function expectNoHorizontalScroll(page: Page, where: string) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `horizontal overflow ${where}`).toBeLessThanOrEqual(clientWidth);
}

/**
 * The worst WCAG contrast between an element's text colour and every rendered
 * pixel behind its text (B7, B8). The element's text, underline and icon are
 * made transparent (transitions off), the box of each rendered line of its
 * content (Range client rects: a block <p> is wider than its text, and pixels
 * beside the text are not read against it) is screenshotted, and each PNG is
 * decoded in the page through a 2D canvas from a data URL (img-src allows
 * data:). The text colour is resolved through the same canvas, so OKLCH
 * tokens come back as sRGB bytes.
 */
async function worstContrastBehind(page: Page, target: Locator): Promise<number> {
  await target.scrollIntoViewIfNeeded();
  const color = await target.evaluate((el: HTMLElement) => {
    const value = getComputedStyle(el).color;
    el.dataset.contrastPrevStyle = el.getAttribute('style') ?? '';
    el.style.setProperty('transition', 'none', 'important');
    el.style.setProperty('color', 'transparent', 'important');
    el.style.setProperty('text-decoration-color', 'transparent', 'important');
    return value;
  });
  await nextFrames(page);
  const lines = await target.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return Array.from(range.getClientRects(), (r) => ({ x: r.x, y: r.y, width: r.width, height: r.height }))
      .filter((r) => r.width >= 1 && r.height >= 1);
  });
  if (lines.length === 0) throw new Error('element renders no text');
  const shots = [];
  for (const clip of lines) shots.push(await page.screenshot({ clip, animations: 'disabled' }));
  await target.evaluate((el: HTMLElement) => {
    el.setAttribute('style', el.dataset.contrastPrevStyle ?? '');
    if (!el.getAttribute('style')) el.removeAttribute('style');
    delete el.dataset.contrastPrevStyle;
  });

  let worst = Infinity;
  for (const png of shots) worst = Math.min(worst, await worstContrastIn(page, png, color));
  return worst;
}

/** The worst contrast between `textColor` and every pixel of a PNG, decoded in the page. */
function worstContrastIn(page: Page, png: Buffer, textColor: string): Promise<number> {
  return page.evaluate(
    async ({ base64, textColor }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const surface = document.createElement('canvas');
      surface.width = image.naturalWidth;
      surface.height = image.naturalHeight;
      const ctx = surface.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('no 2D context');
      ctx.fillStyle = textColor;
      ctx.fillRect(0, 0, 1, 1);
      const [tr, tg, tb] = ctx.getImageData(0, 0, 1, 1).data;
      ctx.clearRect(0, 0, 1, 1);
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, surface.width, surface.height).data;

      const channel = (c: number) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      const luminance = (r: number, g: number, b: number) =>
        0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      const text = luminance(tr, tg, tb);
      let worst = Infinity;
      for (let i = 0; i < pixels.length; i += 4) {
        const bg = luminance(pixels[i], pixels[i + 1], pixels[i + 2]);
        const ratio = (Math.max(text, bg) + 0.05) / (Math.min(text, bg) + 0.05);
        if (ratio < worst) worst = ratio;
      }
      return worst;
    },
    { base64: png.toString('base64'), textColor }
  );
}

/**
 * The worst WCAG contrast of an element's text as the visitor sees it: the
 * text colour and its background both composed through every overlay (G-09-4
 * N1, D-17). worstContrastBehind compares the raw computed colour with the
 * composed background, which is right for text painted above a scrim (B7) but
 * blind to an overlay painted above the text: a scrim over the rail tints the
 * glyphs too, so that method read 7.6-8.6:1 where the rail measured 1.3-2.5:1.
 *
 * Two shots of each rendered line of the text (Range client rects, inset by
 * one pixel so no edge pixel blends with the surroundings): first with the
 * text transparent (the background as composed), then with the element's
 * background set to its own text colour (the text colour as composed through
 * anything above it). The lowest per-pixel ratio between the pairs wins.
 * Transitions are off while sampling and the inline style is restored after.
 */
async function composedContrast(page: Page, target: Locator): Promise<number> {
  const color = await target.evaluate((el: HTMLElement) => {
    const value = getComputedStyle(el).color;
    el.dataset.contrastPrevStyle = el.getAttribute('style') ?? '';
    el.style.setProperty('transition', 'none', 'important');
    el.style.setProperty('color', 'transparent', 'important');
    el.style.setProperty('text-decoration-color', 'transparent', 'important');
    return value;
  });
  await nextFrames(page);
  const lines = await target.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return Array.from(range.getClientRects(), (r) => {
      const x = Math.ceil(r.left) + 1;
      const y = Math.ceil(r.top) + 1;
      return { x, y, width: Math.floor(r.right) - 1 - x, height: Math.floor(r.bottom) - 1 - y };
    }).filter((r) => r.width >= 1 && r.height >= 1);
  });
  if (lines.length === 0) throw new Error('element renders no text');
  const backgrounds = [];
  for (const clip of lines) backgrounds.push(await page.screenshot({ clip, animations: 'disabled' }));
  await target.evaluate((el: HTMLElement, fill) => {
    el.style.setProperty('background-color', fill, 'important');
  }, color);
  await nextFrames(page);
  const fills = [];
  for (const clip of lines) fills.push(await page.screenshot({ clip, animations: 'disabled' }));
  await target.evaluate((el: HTMLElement) => {
    el.setAttribute('style', el.dataset.contrastPrevStyle ?? '');
    if (!el.getAttribute('style')) el.removeAttribute('style');
    delete el.dataset.contrastPrevStyle;
  });

  let worst = Infinity;
  for (let i = 0; i < lines.length; i++) {
    worst = Math.min(worst, await worstPairContrast(page, fills[i], backgrounds[i]));
  }
  return worst;
}

/** The lowest per-pixel contrast between two same-size PNGs, decoded in the page. */
function worstPairContrast(page: Page, fill: Buffer, background: Buffer): Promise<number> {
  return page.evaluate(
    async ({ fill, background }) => {
      const decode = async (base64: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const surface = document.createElement('canvas');
        surface.width = image.naturalWidth;
        surface.height = image.naturalHeight;
        const ctx = surface.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('no 2D context');
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, surface.width, surface.height).data;
      };
      const [a, b] = await Promise.all([decode(fill), decode(background)]);
      if (a.length !== b.length) throw new Error('shot sizes differ');

      const channel = (c: number) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      const luminance = (p: Uint8ClampedArray, i: number) =>
        0.2126 * channel(p[i]) + 0.7152 * channel(p[i + 1]) + 0.0722 * channel(p[i + 2]);
      let worst = Infinity;
      for (let i = 0; i < a.length; i += 4) {
        const la = luminance(a, i);
        const lb = luminance(b, i);
        const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
        if (ratio < worst) worst = ratio;
      }
      return worst;
    },
    { fill: fill.toString('base64'), background: background.toString('base64') }
  );
}

test.describe('Home modes (HOME-02, HOME-07, HOME-08)', () => {
  test.describe('static triggers keep the full Home and download nothing heavy', () => {
    for (const { name, setup } of STATIC_TRIGGERS) {
      test(`${name}: static mode, no canvas, no heightmap, no three.js`, async ({ page }) => {
        const heightmaps: string[] = [];
        page.on('request', (request) => {
          if (HEIGHTMAP.test(request.url())) heightmaps.push(request.url());
        });
        await setup(page);
        await page.goto('/');

        await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'static');
        await scrollOnce(page);
        await page.waitForTimeout(5000);

        await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'static');
        await expect(canvas(page)).toHaveCount(0);
        expect(heightmaps, 'heightmap requests').toEqual([]);
        const scripts = await loadedScriptBodies(page);
        expect(scripts.length).toBeGreaterThan(0);
        const three = scripts.filter((s) => s.body.includes('THREE.WebGLRenderer')).map((s) => s.url);
        expect(three, 'scripts containing THREE.WebGLRenderer').toEqual([]);
        await expectCompleteHome(page);
      });
    }
  });

  test('a capable device loads the canvas after the first scroll @chromium-only', async ({ page }) => {
    await page.goto('/');
    await expect(stage(page)).toHaveAttribute('data-ascent-mode', /^(eligible|3d)$/);
    await scrollOnce(page);

    const terrain = stage(page).locator('canvas');
    await expect(terrain).toHaveCount(1, { timeout: 6000 });
    await expect(page.locator('[data-ascent-stage] [data-grid-size]')).toHaveCSS('pointer-events', 'none');
    // Positive control for the static tests: the lazy chunk does carry three.js.
    const scripts = await loadedScriptBodies(page);
    expect(scripts.some((s) => s.body.includes('THREE.WebGLRenderer'))).toBe(true);
    await expectCompleteHome(page);
  });

  test('reduced motion is the compact final state with no canvas', async ({ page }) => {
    await reduceMotion(page);
    await page.goto('/');

    await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'static-reduced');
    await scrollOnce(page);
    await page.waitForTimeout(5000);

    await expect(canvas(page)).toHaveCount(0);
    await expect(page.locator('[data-ascent-marker]')).toBeHidden();
    const boxes = await page
      .locator('li[data-ascent-block="waypoint"] section')
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
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await expectCompleteHome(page);
  });

  test('turning reduced motion on mid-visit removes the canvas @chromium-only', async ({ page }) => {
    await page.goto('/');
    await scrollOnce(page);
    await expect(stage(page).locator('canvas')).toHaveCount(1, { timeout: 6000 });

    await reduceMotion(page);

    await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'static-reduced');
    await expect(canvas(page)).toHaveCount(0);
  });

  test.describe('nothing scrolls sideways at 375 px', () => {
    const modes: (Setup & { tag?: string })[] = [
      { name: 'static', setup: disableWebGL },
      { name: 'static-reduced', setup: reduceMotion },
      { name: 'eligible', setup: async () => {}, tag: ' @chromium-only' },
    ];
    for (const { name, setup, tag = '' } of modes) {
      test(`${name}: top, waypoint 2 and the summit${tag}`, async ({ page }) => {
        await setup(page);
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        await nextFrames(page);
        await expectNoHorizontalScroll(page, 'at the top');

        await scrollBlockToCentre(page, `li[data-k="${second.k}"]`);
        if (name === 'eligible') {
          await expect(stage(page).locator('canvas')).toHaveCount(1, { timeout: 6000 });
          await expect(page.locator('[data-ascent-stage] [data-grid-size]')).toHaveAttribute('data-grid-size', '256');
        }
        await expectNoHorizontalScroll(page, 'with waypoint 2 centred');

        await scrollBlockToCentre(page, '#summit');
        await expectNoHorizontalScroll(page, 'with the summit centred');
      });
    }
  });

  test.describe('no layout shift from load through arming @chromium-only', () => {
    const modes: Setup[] = [
      { name: 'eligible', setup: async () => {} },
      { name: 'static', setup: disableWebGL },
    ];
    for (const { name, setup } of modes) {
      test(`${name}: layout-shift sum below 0.1`, async ({ page }) => {
        await trackLayoutShift(page);
        await setup(page);
        await page.goto('/', { waitUntil: 'load' });
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        if (name === 'eligible') {
          // Armed by requestIdleCallback (timeout 4 s), no scroll.
          await expect(stage(page).locator('canvas')).toHaveCount(1, { timeout: 8000 });
        }
        await page.waitForTimeout(name === 'eligible' ? 1000 : 5000);

        const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
        expect(cls, `layout-shift sum (${name})`).toBeLessThan(0.1);
      });
    }
  });

  test.describe('B5: the cue links work in every mode', () => {
    const modes: Setup[] = [
      { name: 'capable device', setup: async () => {} },
      ...STATIC_TRIGGERS,
      { name: 'reduced motion', setup: reduceMotion },
    ];
    for (const { name, setup } of modes) {
      test(`${name}: both fragments resolve and Skip to the summit focuses #summit`, async ({ page }) => {
        await setup(page);
        await page.goto('/');

        for (const label of ['Start the ascent', 'Skip to the summit']) {
          const href = await page.getByRole('link', { name: label, exact: true }).getAttribute('href');
          expect(href).toMatch(/^#/);
          await expect(page.locator(`[id="${href!.slice(1)}"]`)).toHaveCount(1);
        }
        expect(await page.getByRole('link', { name: 'Start the ascent', exact: true }).getAttribute('href')).toBe(
          `#waypoint-${waypoints[0].slug}`
        );

        await page.getByRole('link', { name: 'Skip to the summit', exact: true }).click();
        await expect(page).toHaveURL(/#summit$/);
        await expect(page.locator('#summit')).toBeFocused();
      });
    }
  });

  test.describe('B7: hero text over the relief keeps 4.5:1 on the rendered pixels', () => {
    for (const [width, height] of [
      [375, 812],
      [768, 1024],
      [1440, 900],
    ]) {
      test(`at ${width} px, top of the page, static capability mode`, async ({ page }) => {
        await disableWebGL(page);
        await page.setViewportSize({ width, height });
        await page.goto('/');
        await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'static');
        await expect(page.locator('[data-sheet-box] img')).toBeVisible();
        await page.locator('[data-sheet-box] img').evaluate((img: HTMLImageElement) => img.decode());
        await nextFrames(page);

        const hero = page.locator('[data-ascent-block="hero"]');
        const targets: [string, Locator][] = [
          ['kicker', hero.locator('p.font-mono').first()],
          ['h1', hero.getByRole('heading', { level: 1 })],
          ['role', hero.locator('h1 + p')],
          ['thesis', hero.locator('h1 + p + p')],
          ['Start the ascent', hero.getByRole('link', { name: 'Start the ascent', exact: true })],
          ['Skip to the summit', hero.getByRole('link', { name: 'Skip to the summit', exact: true })],
        ];
        for (const [name, target] of targets) {
          const worst = await worstContrastBehind(page, target);
          test.info().annotations.push({ type: 'contrast', description: `${name} @ ${width}: ${worst.toFixed(2)}` });
          expect(worst, `${name} at ${width} px: worst composed contrast`).toBeGreaterThanOrEqual(4.5);
        }
      });
    }

    test('axe reports no color-contrast violation on /', async ({ page }) => {
      await disableWebGL(page);
      await page.goto('/');
      await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'static');
      const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      expect(results.violations).toEqual([]);
    });
  });

  test.describe('B8: rail tick labels keep 4.5:1 at the summit', () => {
    for (const [width, height] of [
      [768, 1024],
      [1440, 900],
    ]) {
      test(`at ${width} px with #summit centred`, async ({ page }) => {
        await disableWebGL(page);
        await page.setViewportSize({ width, height });
        await page.goto('/');
        await page.locator('[data-sheet-box] img').evaluate((img: HTMLImageElement) => img.decode());
        await scrollBlockToCentre(page, '#summit');
        // The readout box covers the label of the tick it sits on; it is not
        // what the label is read against, so it is hidden while sampling.
        await page.locator('[data-ascent-cursor]').evaluate((el: HTMLElement) => {
          el.style.visibility = 'hidden';
        });

        const labels = page.locator('[data-ascent-rail] [data-tick-label]');
        await expect(labels).toHaveCount(waypoints.length + 1);
        for (let i = 0; i < waypoints.length + 1; i++) {
          const label = labels.nth(i);
          const worst = await worstContrastBehind(page, label);
          test.info().annotations.push({ type: 'contrast', description: `tick ${i} @ ${width}: ${worst.toFixed(2)}` });
          expect(worst, `tick ${i} (${await label.textContent()}) at ${width} px`).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
  });

  test.describe('N1: rail labels and readout over the hero, composed through every overlay', () => {
    const rows: { width: number; height: number; p: number }[] = [{ width: 768, height: 900, p: 0 }];
    for (const { width, height, p } of rows) {
      test(`at ${width} x ${height}, p = ${p}, static capability mode`, async ({ page }) => {
        await disableWebGL(page);
        await page.setViewportSize({ width, height });
        await page.goto('/');
        await expect(stage(page)).toHaveAttribute('data-ascent-mode', 'static');
        await expect(page.locator('[data-sheet-box] img')).toBeVisible();
        await page.locator('[data-sheet-box] img').evaluate((img: HTMLImageElement) => img.decode());
        await nextFrames(page);

        // The readout box covers the label of the tick it sits on; it is not
        // what the label is read against, so it is hidden while the labels
        // are sampled, then shown again and sampled itself.
        const cursor = page.locator('[data-ascent-cursor]');
        await cursor.evaluate((el: HTMLElement) => {
          el.style.visibility = 'hidden';
        });
        const labels = page.locator('[data-ascent-rail] [data-tick-label]');
        await expect(labels).toHaveCount(waypoints.length + 1);
        const failures: string[] = [];
        for (let i = 0; i < waypoints.length + 1; i++) {
          const label = labels.nth(i);
          const text = (await label.textContent())?.replace(/ /g, ' ');
          const worst = await composedContrast(page, label);
          test.info().annotations.push({ type: 'contrast', description: `tick ${i} (${text}) @ ${width}x${height} p ${p}: ${worst.toFixed(2)}` });
          if (worst < 4.5) failures.push(`tick ${i} (${text}) ${worst.toFixed(2)}`);
        }
        await cursor.evaluate((el: HTMLElement) => {
          el.style.visibility = '';
        });
        await nextFrames(page);
        const readout = page.locator('[data-ascent-readout]');
        const readoutText = (await readout.textContent())?.replace(/ /g, ' ');
        const readoutWorst = await composedContrast(page, readout);
        test.info().annotations.push({ type: 'contrast', description: `readout (${readoutText}) @ ${width}x${height} p ${p}: ${readoutWorst.toFixed(2)}` });
        if (readoutWorst < 4.5) failures.push(`readout (${readoutText}) ${readoutWorst.toFixed(2)}`);

        expect(failures, `composed contrast below 4.5:1 at ${width} x ${height}, p = ${p}`).toEqual([]);
      });
    }
  });
});
