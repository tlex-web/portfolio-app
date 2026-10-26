import path from 'path';
import { test, expect, type Page } from '@playwright/test';
import { buildWaypoints } from '@/lib/ascent/waypoints';
import { buildPhotoViews } from '@/lib/photos/view-model';
import { disableWebGL, nextFrames } from '../helpers/webgl';
import { scrollBlockToCentre } from '../helpers/ascent';

/**
 * GUARD-02 visual regression: every route at 375 / 768 / 1440 px, plus Home
 * viewport shots at three fixed ascent positions (top, waypoint 2 centred,
 * summit centred) with motion enabled on the static poster path (D-22), and
 * the lightbox opened from the grid at the same three widths (10-UI-SPEC
 * "Guardrails and Regression Risks", GUARD-02 row).
 *
 * Runs only in the visual-dark and visual-light projects. Baselines are
 * captured in the Playwright Linux container (see e2e/visual/README.md);
 * never update them on Windows.
 *
 * Snapshot names come from explicit name arrays (route slug, width, mode), so
 * retitling or reordering tests cannot orphan a PNG.
 */

/**
 * The film scan (the one approximate position) is the photo-page shot: its
 * strip carries the partial fields (approx. altitude and position, film line).
 * The slug comes from the data, never from a literal.
 */
const filmScan = buildPhotoViews().find((view) => view.approximate);
if (!filmScan) throw new Error('buildPhotoViews() has no approximate (film-scan) view');

const ROUTES = [
  ['home', '/'],
  ['photos', '/photos'],
  ['photos-grid', '/photos?view=grid'],
  // Reduced motion (every shot in the route loop) puts the carousel on its stepper.
  ['photos-carousel', '/photos?view=carousel'],
  ['photo', `/photos/${filmScan.slug}`],
  ['projects', '/projects'],
  ['clix-cli', '/projects/clix-cli'],
  ['clix-website', '/projects/clix-website'],
  ['roadmap', '/roadmap'],
  ['contact', '/contact'],
  ['offline', '/offline'],
  ['not-found', '/__no-such-page__'],
] as const;

const WIDTHS = [375, 768, 1440] as const;
const HEIGHT = 900;

/**
 * Fixed ascent positions for the Home motion shots (D-22, 09-RESEARCH
 * Pitfall 3): p = 0 at the top, waypoint 2's block centred (inside its arrival
 * plateau) and the summit centred. The waypoint selector comes from the data,
 * never from a literal slug.
 */
const ASCENT_SHOTS = [
  ['start', null],
  ['waypoint-2', `#waypoint-${buildWaypoints()[1].slug}`],
  ['summit', '#summit'],
] as const;

// Hides every <canvas> (WebGL / random). Never use `mask:` for these.
// Resolved from this file, so the run does not depend on the cwd.
const stylePath = path.join(__dirname, 'hide-canvas.css');

/**
 * Brings a page to a deterministic state before a screenshot:
 * fonts loaded, every once:true whileInView animation fired and every
 * rendered lazy image loaded (by scrolling the full height), back at the top,
 * and no finite time-based animation still running.
 *
 * Scroll-driven animations (Motion's useScroll runs on a ViewTimeline) are
 * ignored: their play state stays 'running' at any scroll position, so waiting
 * on them would never return.
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
  // An image with no layout box (inside a display: none wrapper, such as the
  // map's hover previews) cannot be in the shot, and a lazy one is never
  // fetched, so its `complete` stays false: only rendered images are awaited.
  await page.waitForFunction(() =>
    Array.from(document.images).every((img) => img.complete || img.getClientRects().length === 0),
  );
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((a) => a.timeline === document.timeline)
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
      .every((a) => a.playState !== 'running'),
  );
  // The footer's contour band is a CSS mask image, which does not hold up the
  // load event: wait for the hashed strip SVG, then two frames for the paint,
  // so a baseline can never capture an empty band (08-UI-SPEC "Mask image timing").
  await page.waitForFunction(() =>
    performance
      .getEntriesByType('resource')
      .some((entry) => /\/terrain\/contours-strip\.[0-9a-f]{10}\.svg$/.test(entry.name)),
  );
  // Home's poster and the /photos map sheet draw their contour lines from the
  // hashed hero SVG, which does not hold up the load event either: wait for it
  // wherever either surface renders, so a baseline can never show an empty
  // contour layer (09-RESEARCH Pitfall 3).
  await page.waitForFunction(
    () =>
      !document.querySelector('[data-map-mark], [data-ascent-stage]') ||
      performance
        .getEntriesByType('resource')
        .some((entry) => /\/terrain\/contours-hero\.[0-9a-f]{10}\.svg$/.test(entry.name)),
  );
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

/**
 * Freezes every time-based animation the way `animations: 'disabled'` does
 * (finite ones finished, infinite ones cancelled to their initial state) but
 * leaves scroll-driven animations alone, so they render the state of the
 * current scroll position. Playwright's own 'disabled' mode would cancel them,
 * because their end time is a percentage rather than a finite number of ms.
 */
async function freezeTimeAnimations(page: Page) {
  await page.evaluate(() => {
    for (const a of document.getAnimations()) {
      if (a.timeline !== document.timeline) continue;
      try {
        if (a.effect?.getComputedTiming().iterations === Infinity) a.cancel();
        else a.finish();
      } catch {
        a.cancel();
      }
    }
  });
}

for (const [name, route] of ROUTES) {
  for (const w of WIDTHS) {
    test(`${name} @${w} reduced`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: w, height: HEIGHT });
      await page.goto(route);
      await settle(page);
      await expect(page).toHaveScreenshot([name, `${w}-reduced.png`], {
        fullPage: true,
        stylePath,
      });
    });
  }
}

// Motion ON: exercises the ascent's scroll-driven paths (progress spring, live
// rail, poster pins) that reduced-motion shots cannot see. Viewport only.
// WebGL is switched off so Home takes the static poster path every time: with
// SwiftShader the canvas would load at idle and swap the poster pins for HTML
// 3D pins on a timing no baseline can pin (09-RESEARCH Pitfall 3). Canvases
// stay hidden through hide-canvas.css either way; the 3D path is covered by
// the SwiftShader checks in e2e/home-canvas.spec.ts, not by baselines.
// `animations: 'allow'` plus freezeTimeAnimations keeps the scroll-driven
// state in the shot while every time-based animation is still frozen.
for (const w of WIDTHS) {
  for (const [shot, selector] of ASCENT_SHOTS) {
    test(`home ascent ${shot} @${w}`, async ({ page }) => {
      await disableWebGL(page);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.setViewportSize({ width: w, height: HEIGHT });
      await page.goto('/');
      await settle(page);
      // A jump of more than one leg snaps the spring, so two frames suffice.
      if (selector === null) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await nextFrames(page);
      } else {
        await scrollBlockToCentre(page, selector);
      }
      await freezeTimeAnimations(page);
      await expect(page).toHaveScreenshot(['home', `${w}-ascent-${shot}.png`], {
        stylePath,
        animations: 'allow',
      });
    });
  }
}

// The lightbox over the grid (LBOX-01): a viewport shot, not full page, since
// the dialog covers the viewport and the grid behind it is inert. Opened by a
// click on the first tile of the grid list, so the intercepted route renders
// exactly as a visitor sees it; reduced motion keeps the open instant.
for (const w of WIDTHS) {
  test(`lightbox @${w}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: w, height: HEIGHT });
    await page.goto('/photos?view=grid');
    await settle(page);
    const tile = page
      .getByRole('list', { name: 'Photographs, lowest first' })
      .getByRole('link')
      .first();
    // A click before hydration is a document navigation (no dialog).
    await expect
      .poll(() => tile.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))), {
        timeout: 15000,
      })
      .toBe(true);
    await tile.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect
      .poll(() =>
        dialog
          .locator('img')
          .evaluateAll((imgs: HTMLImageElement[]) =>
            imgs.every((img) => img.complete && img.naturalWidth > 0),
          ),
      )
      .toBe(true);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await expect(page).toHaveScreenshot(['lightbox', `${w}.png`], { stylePath });
  });
}
