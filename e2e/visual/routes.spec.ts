import path from 'path';
import { test, expect, type Page } from '@playwright/test';

/**
 * GUARD-02 visual regression: every route at 375 / 768 / 1440 px, plus Home
 * viewport shots at 0 / 50 / 100 % scroll with motion enabled.
 *
 * Runs only in the visual-dark and visual-light projects. Baselines are
 * captured in the Playwright Linux container (see e2e/visual/README.md);
 * never update them on Windows.
 *
 * Snapshot names come from explicit name arrays (route slug, width, mode), so
 * retitling or reordering tests cannot orphan a PNG.
 */

const ROUTES = [
  ['home', '/'],
  ['photos', '/photos'],
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
const SCROLL_PCTS = [0, 50, 100] as const;

// Hides every <canvas> (WebGL / random). Never use `mask:` for these.
// Resolved from this file, so the run does not depend on the cwd.
const stylePath = path.join(__dirname, 'hide-canvas.css');

/**
 * Brings a page to a deterministic state before a screenshot:
 * fonts loaded, every once:true whileInView animation fired and every lazy
 * image loaded (by scrolling the full height), back at the top, and no finite
 * time-based animation still running.
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
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
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

// Motion ON: exercises the useScroll / useMotionValueEvent paths that
// reduced-motion shots cannot see (RESEARCH Pitfall 3). Viewport only.
// `animations: 'allow'` plus freezeTimeAnimations keeps the scroll-driven
// state in the shot while every time-based animation is still frozen.
for (const w of WIDTHS) {
  for (const pct of SCROLL_PCTS) {
    test(`home scroll ${pct}% @${w}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.setViewportSize({ width: w, height: HEIGHT });
      await page.goto('/');
      await settle(page);
      await page.evaluate((p) => window.scrollTo(0, (window.innerHeight * p) / 100), pct);
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      await freezeTimeAnimations(page);
      await expect(page).toHaveScreenshot(['home', `${w}-scroll-${pct}.png`], {
        stylePath,
        animations: 'allow',
      });
    });
  }
}
