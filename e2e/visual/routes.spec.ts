import path from 'path';
import { test, expect, type Page } from '@playwright/test';
import { buildWaypoints } from '@/lib/ascent/waypoints';
import { regionPhotoViews } from '@/lib/regions';
import { regionHref } from '@/lib/photos/routes';
import { disableWebGL, nextFrames } from '../helpers/webgl';
import { scrollBlockToCentre } from '../helpers/ascent';
import { SLUGS } from '../helpers/photo-fixtures';

/**
 * GUARD-02 visual regression: every route at 375 / 768 / 1440 px, plus Home
 * viewport shots at three fixed ascent positions (top, waypoint 2 centred,
 * summit centred) with motion enabled on the static poster path (D-22), the
 * region page viewport shots (18 D-21), and the lightbox opened from the
 * Zermatt sequence at the same three widths (10-UI-SPEC "Guardrails and
 * Regression Risks", GUARD-02 row).
 *
 * Runs only in the visual-dark and visual-light projects. Baselines are
 * captured in the Playwright Linux container (see e2e/visual/README.md);
 * never update them on Windows.
 *
 * Snapshot names come from explicit name arrays (route slug, width, mode), so
 * retitling or reordering tests cannot orphan a PNG.
 */

/**
 * The film scan is the photo-page shot: its strip carries the partial fields
 * (approx. altitude and position, film line). The slug comes from the data,
 * never from a literal.
 *
 * It is picked as the one Zermatt view whose strip has a film line (18-RESEARCH
 * Pitfall 8), not as the first `approximate` view: four non-Zermatt photos in
 * the published set are approximate too (Saalfelden x2, Ortler x2), and they
 * sort first by altitude, so once the light table retires the old key would
 * move this baseline to another photo. Exactly one match, else the spec throws.
 */
const filmScans = regionPhotoViews('zermatt').filter((view) => view.strip.filmLine !== null);
if (filmScans.length !== 1) {
  throw new Error(
    `regionPhotoViews('zermatt') has ${filmScans.length} film-scan views; the photo shot needs exactly one`,
  );
}
const filmScan = filmScans[0];

const ROUTES = [
  ['home', '/'],
  ['photos', '/photos'],
  ['photos-grid', '/photos?view=grid'],
  // Reduced motion (every shot in the route loop) puts the carousel on its stepper.
  ['photos-carousel', '/photos?view=carousel'],
  ['photo', `/photos/${filmScan.slug}`],
  ['projects', '/projects'],
  ['box', '/projects/box'],
  ['coin-flip', '/projects/coin-flip'],
  ['roadmap', '/roadmap'],
  // The data sources page (D-20), first baselined in D-24 round 2 (18-05).
  ['sources', '/sources'],
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

/**
 * Region page viewport shots (18 D-21; 18-UI-SPEC "Visual Baselines"), 900 px
 * high under reduced motion, never full page: a full-page Zermatt shot would be
 * about 9,000 px and re-baseline with every new photo. Zermatt is shot at the
 * top, mid sequence and end; Ortler and Saalfelden at the top only.
 *
 * D-22: these shots are the rewrite of the `photos-grid` and `photos-carousel`
 * route entries. Those two entries stay until their pages retire and are
 * removed there with their PNGs (18-22 / 18-28).
 *
 * Positions come from the data, never from a literal slug: the mid shot
 * centres the figure at index floor((N - 1) / 2) of regionPhotoViews('zermatt'),
 * and the end shot centres #next-region. From 768 px each shot waits for the
 * altimeter rail's positive settle signal, `data-rail-current` (18-12): 1 at
 * the top, index + 1 mid sequence, N at the end (every figure is above the
 * centre line there). Below 768 px the rail is hidden.
 */
type RegionShot = {
  id: string;
  pos: 'top' | 'mid' | 'end';
  /** The element to centre, or null for the top of the page. */
  selector: string | null;
  /** The rail's expected 1-based current figure, read from 768 px. */
  railCurrent: number;
};

const zermattViews = regionPhotoViews('zermatt');
const zermattMid = Math.floor((zermattViews.length - 1) / 2);

const REGION_SHOTS: readonly RegionShot[] = [
  { id: 'zermatt', pos: 'top', selector: null, railCurrent: 1 },
  {
    id: 'zermatt',
    pos: 'mid',
    selector: `#photo-${zermattViews[zermattMid].slug}`,
    railCurrent: zermattMid + 1,
  },
  { id: 'zermatt', pos: 'end', selector: '#next-region', railCurrent: zermattViews.length },
  { id: 'ortler', pos: 'top', selector: null, railCurrent: 1 },
  { id: 'saalfelden', pos: 'top', selector: null, railCurrent: 1 },
];

/** The width from which the region rail renders (md). */
const RAIL_MIN_WIDTH = 768;

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
    Array.from(document.images).every((img) => img.complete || img.getClientRects().length === 0)
  );
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((a) => a.timeline === document.timeline)
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
      .every((a) => a.playState !== 'running')
  );
  // The footer's contour band is a CSS mask image, which does not hold up the
  // load event: wait for the hashed strip SVG, then two frames for the paint,
  // so a baseline can never capture an empty band (08-UI-SPEC "Mask image timing").
  await page.waitForFunction(() =>
    performance
      .getEntriesByType('resource')
      .some((entry) => /\/terrain\/contours-strip\.[0-9a-f]{10}\.svg$/.test(entry.name))
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
        .some((entry) => /\/terrain\/contours-hero\.[0-9a-f]{10}\.svg$/.test(entry.name))
  );
  // A region page's plate masks its own hero contours, which can carry the
  // plate's prefix (ortler-contours-hero.<hash>.svg); the wait above matches only
  // the unprefixed name. Wait for the URL the plate itself names, so the shot can
  // never show an empty contour layer on the plate (18-09, 18-14).
  await page.waitForFunction(() => {
    const sheet = document.querySelector('[data-plate-sheet]');
    if (!sheet) return true;
    const masked = sheet.querySelector<HTMLElement>('[style*="contours-hero"]');
    const mask = masked?.style.maskImage || masked?.style.getPropertyValue('-webkit-mask-image');
    const url = mask?.match(/url\("?([^")]+)"?\)/)?.[1];
    if (!url) return false;
    const pattern = /\/terrain\/(?:[a-z]+-)?contours-hero\.[0-9a-f]{10}\.svg$/;
    return performance
      .getEntriesByType('resource')
      .some((entry) => pattern.test(entry.name) && entry.name.endsWith(url));
  });
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
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

// Copy mode in every shot (18-RESEARCH Pitfall 7): with no Web Share the Share
// button reads "Copy link" in every engine and build, whatever the runner ships.
// The server and hydration render copy mode anyway, so no earlier shot changes.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    delete (Navigator.prototype as Partial<Navigator>).share;
    delete (Navigator.prototype as Partial<Navigator>).canShare;
  });
});

for (const [name, route] of ROUTES) {
  for (const w of WIDTHS) {
    test(`${name} @${w} reduced`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: w, height: HEIGHT });
      await page.goto(route);
      if (name === 'box') {
        // 14 D-06: under reduced motion the client opens the terminal's
        // transcript once after hydration, so the full-page shot waits for it
        // (before settle, whose scroll pass then covers the taller page).
        // Declared re-baseline (14-06): box/{375,768,1440}-reduced, for the
        // step buttons in the command bar (14-05) and the open transcript,
        // produced in 14-08 and committed by Tim.
        await expect(page.locator('details[data-transcript]')).toHaveAttribute('open', '');
      }
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
      // The 1440 waypoint-2 and summit shots alone tolerate differing pixels. The
      // poster's triangle mark sits at the same place in both, and it renders in two
      // stable states: waypoint-2 in runs 42105785881 (PR #103, visual-dark), 42127714611
      // (a50956e, visual-light) and 42149842086 (8270572, visual-light), summit in runs
      // 42252166424 (PR #103, visual-light) and 42252840837 (PR #126, visual-dark). Each
      // reported exactly 2 pixels on the mark's slanted edge, about x 137-141, y 710-717.
      // So the limit of 3 is the observed 2 plus a margin of 1. The 1440 start shot does
      // not show the mark there, and no other shot gets a tolerance. The per-call option
      // merges over SCREENSHOT, so its threshold stays in force.
      await expect(page).toHaveScreenshot(['home', `${w}-ascent-${shot}.png`], {
        stylePath,
        animations: 'allow',
        ...(w === 1440 && (shot === 'waypoint-2' || shot === 'summit') ? { maxDiffPixels: 3 } : {}),
      });
    });
  }
}

// Region page viewport shots (D-21; see REGION_SHOTS). Titled like the route
// loop ('<name> @<width> reduced'), named region/<id>-<pos>-<width>.
for (const { id, pos, selector, railCurrent } of REGION_SHOTS) {
  for (const w of WIDTHS) {
    test(`region ${id}-${pos} @${w} reduced`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: w, height: HEIGHT });
      await page.goto(regionHref(id));
      await settle(page);
      if (selector === null) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await nextFrames(page);
      } else {
        await scrollBlockToCentre(page, selector);
      }
      if (w >= RAIL_MIN_WIDTH) {
        await expect(page.locator('[data-region-rail]')).toHaveAttribute(
          'data-rail-current',
          String(railCurrent)
        );
      }
      await nextFrames(page);
      await expect(page).toHaveScreenshot(['region', `${id}-${pos}-${w}.png`], { stylePath });
    });
  }
}

// The lightbox (LBOX-01): a viewport shot, not full page, since the dialog
// covers the viewport and the page behind it is inert. Opened by a click on the
// Matterhorn-from-Zermatt figure in the Zermatt sequence (18-14; the photo the
// grid's first tile opened until then, so the PNGs stay byte-identical), so the
// intercepted route renders exactly as a visitor sees it; reduced motion keeps
// the open instant.
for (const w of WIDTHS) {
  test(`lightbox @${w}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: w, height: HEIGHT });
    await page.goto(regionHref('zermatt'));
    await settle(page);
    const tile = page.locator(`[data-photo-id="${SLUGS.matterhornFromZermatt}"]`);
    // A click before hydration is a document navigation (no dialog).
    await expect
      .poll(
        () => tile.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))),
        {
          timeout: 15000,
        }
      )
      .toBe(true);
    await tile.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await expect
      .poll(() =>
        dialog
          .locator('img')
          .evaluateAll((imgs: HTMLImageElement[]) =>
            imgs.every((img) => img.complete && img.naturalWidth > 0)
          )
      )
      .toBe(true);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    await expect(page).toHaveScreenshot(['lightbox', `${w}.png`], { stylePath });
  });
}

// The mobile menu open at 375 on /projects with keyboard focus on the current row
// ('Engineering', aria-current="page"): SHELL-08's inset ring meeting the accent bar
// (14-UI-SPEC "Visual Baselines", P5). A new set: no menu set existed before, so the
// PNG comes only from the 14-08 visual-baselines.yml dispatch and Tim commits it.
// Review the 1.21:1 focus-versus-accent pair in that PNG: the ring and the bar must
// abut, never overlap. Never run --update-snapshots locally. A viewport shot: the
// panel is absolutely positioned under the sticky header.
test('menu @375 current row focused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: HEIGHT });
  await page.goto('/projects');
  await settle(page);
  const button = page.getByRole('button', { name: 'Menu' });
  // Enter before hydration does nothing: wait for React's props on the button.
  await expect
    .poll(
      () => button.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))),
      {
        timeout: 15000,
      }
    )
    .toBe(true);
  // A keyboard activation, so :focus-visible draws the ring on the row Tabbed to.
  await button.focus();
  await page.keyboard.press('Enter');
  const panel = page.locator('#site-menu');
  await expect(panel).toBeVisible();
  const current = panel.getByRole('link', { name: 'Engineering', exact: true });
  for (let i = 0; i < 6; i++) {
    if (await current.evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(current).toBeFocused();
  await expect(current).toHaveAttribute('aria-current', 'page');
  await panel.evaluate((el) =>
    Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)))
  );
  await expect(page).toHaveScreenshot(['menu', '375-current-focus.png'], { stylePath });
});
