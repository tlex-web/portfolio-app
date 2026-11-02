import { test, expect, type Page } from '@playwright/test';
import { mediaManifest } from '@/data/generated/media-manifest';
import { projects } from '@/data/projects';

/**
 * coin-flip's Demo clip (ENG-02; D-27; 11-UI-SPEC "Demo — coin-flip: muted
 * clip", E18). The section shows only when the media manifest has the encoded
 * clip and the project carries Tim's approved description; both are read from
 * the data here. Tim approved the clip, its 3.5 s poster, the description and
 * the intro in 11-16 ("approve", 2026-11-01), so the populated contract below
 * holds; without a clip coin-flip has no Demo section, never a placeholder.
 *
 * Playwright's bundled Chromium cannot play H.264 (RESEARCH Pitfall 8), so
 * nothing here presses play: the contract is the attributes, the poster and
 * the absence of any MP4 request before the visitor presses play.
 */
const coinFlip = projects.find((p) => p.slug === 'coin-flip');
if (!coinFlip || coinFlip.slug !== 'coin-flip') throw new Error('no coin-flip project');
const COIN_FLIP = `/projects/${coinFlip.slug}`;
const MEDIA = mediaManifest['coin-flip-toss'];
const CLIP = coinFlip.clip;
const APPROVED = Boolean(MEDIA && CLIP?.description);

const WIDE = { width: 1440, height: 900 };
const NARROW = { width: 375, height: 800 };
/** UI-SPEC: the clip frame is at most 256 px wide (max-w-64). */
const MAX_FRAME = 256;
const ACCESSIBLE_NAME = 'coin-flip: one coin toss, screen recording';
const FALLBACK = 'This browser cannot play the clip. The description says what it shows.';

/** The slots that come before Demo when they render (SECTION_ORDER). */
const BEFORE_DEMO = ['Problem', 'Pipeline', 'Privacy', 'Metrics'];

/** The approved clip and its manifest entry; the populated tests need both. */
function approved() {
  if (!MEDIA || !CLIP?.description) {
    throw new Error(
      'coin-flip has no approved clip in data/projects.ts and the media manifest: rewrite this describe to the omitted state (D-27)'
    );
  }
  return { media: MEDIA, clip: CLIP };
}

function demoVideo(page: Page) {
  return page.locator('section#demo video');
}

/** Every URL requested from navigation through two seconds of idle after load. */
async function requestsWhileLoading(page: Page): Promise<string[]> {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await page.goto(COIN_FLIP, { waitUntil: 'load' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Two seconds of idle after load: a preload or a stray fetch would show up here.
  await page.waitForTimeout(2000);
  return requested;
}

const isMp4 = (url: string) => new URL(url).pathname.endsWith('.mp4');

test.describe('coin-flip Demo clip (D-27)', () => {
  test('coin-flip shows a Demo section exactly when its clip and description are approved', async ({
    page,
  }) => {
    await page.goto(COIN_FLIP);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const expected = APPROVED ? 1 : 0;
    await expect(page.getByRole('heading', { level: 2, name: 'Demo', exact: true })).toHaveCount(
      expected
    );
    await expect(page.locator('#demo')).toHaveCount(expected);
    await expect(page.locator('video')).toHaveCount(expected);
    await expect(page.getByText(/coming soon/i)).toHaveCount(0);
  });

  test('loading coin-flip makes no request for the MP4 before play (preload none)', async ({
    page,
  }) => {
    const requested = await requestsWhileLoading(page);
    expect(requested.filter(isMp4)).toEqual([]);
    expect(requested.length).toBeGreaterThan(0);
  });

  test('the Route stages index lists Demo exactly when the clip is approved (E5, E18)', async ({
    page,
  }) => {
    await page.setViewportSize(WIDE);
    await page.goto(COIN_FLIP);
    const index = page.getByRole('navigation', { name: 'Route stages', exact: true });
    await expect(index).toBeVisible();
    const demoLink = index.getByRole('link', { name: 'Demo', exact: true });
    await expect(demoLink).toHaveCount(APPROVED ? 1 : 0);
    if (APPROVED) await expect(demoLink).toHaveAttribute('href', '#demo');
  });
});

test.describe('coin-flip Demo clip, populated (E18)', () => {
  test('the Demo h2 follows the earlier sections, with the approved intro above the clip', async ({
    page,
  }) => {
    const { clip } = approved();
    await page.goto(COIN_FLIP);
    const article = page.getByRole('article', { name: coinFlip.name, exact: true });
    await expect(
      article.getByRole('heading', { level: 2, name: 'Demo', exact: true })
    ).toBeVisible();

    const headings = await page.locator('article section[id] > h2').allTextContents();
    const demoAt = headings.indexOf('Demo');
    expect(demoAt).toBeGreaterThan(0);
    const earlier = headings.filter((h) => BEFORE_DEMO.includes(h));
    expect(earlier.length).toBeGreaterThan(0);
    for (const h of earlier) expect(headings.indexOf(h)).toBeLessThan(demoAt);

    const demo = page.locator('section#demo');
    if (clip.intro) await expect(demo.getByText(clip.intro, { exact: true })).toBeVisible();
    // A clip, never a terminal (UI-SPEC E10).
    await expect(page.getByRole('region', { name: `${coinFlip.name} demo` })).toHaveCount(0);
  });

  test('the video is muted, click-to-play and sized from the manifest', async ({ page }) => {
    const { media } = approved();
    await page.goto(COIN_FLIP);
    const video = demoVideo(page);
    await expect(video).toHaveCount(1);

    await expect(video).toHaveAttribute('controls', '');
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(video).toHaveAttribute('playsinline', '');
    expect(await video.getAttribute('autoplay')).toBeNull();
    expect(await video.getAttribute('loop')).toBeNull();
    await expect(video).toHaveJSProperty('muted', true);
    await expect(video).toHaveJSProperty('autoplay', false);
    await expect(video).toHaveJSProperty('loop', false);
    await expect(video).toHaveJSProperty('paused', true);

    await expect(video).toHaveAttribute('poster', media.poster.src);
    await expect(video).toHaveAttribute('width', String(media.width));
    await expect(video).toHaveAttribute('height', String(media.height));

    const source = video.locator('source');
    await expect(source).toHaveCount(1);
    await expect(source).toHaveAttribute('type', 'video/mp4');
    await expect(source).toHaveAttribute('src', media.src);
    await expect(video.locator('track')).toHaveCount(0);
  });

  test("the video is named, and described by Tim's approved description", async ({ page }) => {
    const { clip } = approved();
    await page.goto(COIN_FLIP);
    const video = demoVideo(page);

    await expect(video).toHaveAccessibleName(ACCESSIBLE_NAME);
    const describedBy = await video.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const description = page.locator(`[id="${describedBy}"]`);
    await expect(description).toHaveCount(1);
    await expect(description).toBeVisible();
    await expect(description).toHaveText(clip.description);
  });

  test('the poster is served and a browser without video support gets the fallback sentence', async ({
    page,
  }) => {
    const { media } = approved();
    const poster = await page.request.get(media.poster.src);
    expect(poster.status()).toBe(200);
    expect(poster.headers()['content-type']).toContain('image/webp');

    await page.goto(COIN_FLIP);
    // The fallback lives inside <video>, so a browser that can render video never shows it.
    await expect(demoVideo(page).locator('p')).toHaveText(FALLBACK);
  });

  test('a clip that fails to load leaves the poster, the description and the Demo section (E18)', async ({
    page,
  }) => {
    const { media, clip } = approved();
    const aborted: string[] = [];
    await page.route('**/*.mp4', (route) => {
      aborted.push(route.request().url());
      return route.abort();
    });
    await page.goto(COIN_FLIP);
    const video = demoVideo(page);
    await video.scrollIntoViewIfNeeded();

    // Press play: the browser requests the MP4, the request is aborted, the element errors.
    const errored = await video.evaluate(
      (el: HTMLVideoElement) =>
        new Promise<boolean>((resolve) => {
          // A failing <source> fires error on the source, which does not bubble: capture it.
          el.addEventListener('error', () => resolve(true), { capture: true, once: true });
          el.play().catch(() => undefined);
          setTimeout(() => resolve(el.error !== null), 5000);
        })
    );
    expect(errored).toBe(true);
    expect(aborted.some(isMp4)).toBe(true);

    // The failure degrades in place: poster, description and section all remain.
    await expect(video).toHaveAttribute('poster', media.poster.src);
    // Nothing loaded: HAVE_NOTHING, and the poster is still what the visitor sees.
    await expect(video).toHaveJSProperty('readyState', 0);
    await expect(page.locator('section#demo')).toHaveCount(1);
    await expect(page.locator('#demo-clip-description')).toHaveText(clip.description);
    await expect(page.locator('#demo-clip-description')).toBeVisible();
    const poster = await page.request.get(media.poster.src);
    expect(poster.status()).toBe(200);
  });

  test.describe('under prefers-reduced-motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('the same attributes hold, the poster is the manifest poster and nothing plays', async ({
      page,
    }) => {
      const { media } = approved();
      const requested = await requestsWhileLoading(page);
      const video = demoVideo(page);

      await expect(video).toHaveAttribute('poster', media.poster.src);
      await expect(video).toHaveAttribute('preload', 'none');
      await expect(video).toHaveAttribute('controls', '');
      expect(await video.getAttribute('autoplay')).toBeNull();
      expect(await video.getAttribute('loop')).toBeNull();
      await expect(video).toHaveJSProperty('muted', true);
      await expect(video).toHaveJSProperty('paused', true);
      await expect(video).toHaveJSProperty('currentTime', 0);
      expect(requested.filter(isMp4)).toEqual([]);
    });
  });

  test('at 375 px nothing scrolls sideways, the frame is at most 256 px and the description sits below it', async ({
    page,
  }) => {
    approved();
    await page.setViewportSize(NARROW);
    await page.goto(COIN_FLIP);
    const video = demoVideo(page);
    await video.scrollIntoViewIfNeeded();

    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

    const frame = await video.boundingBox();
    const caption = await page.locator('#demo-clip-description').boundingBox();
    if (!frame || !caption) throw new Error('the clip frame or its description has no box');
    expect(frame.width).toBeGreaterThan(0);
    expect(frame.width).toBeLessThanOrEqual(MAX_FRAME);
    // Reserved box: the aspect ratio comes from width and height before any byte loads.
    expect(frame.height).toBeGreaterThan(frame.width);
    expect(caption.y).toBeGreaterThanOrEqual(frame.y + frame.height - 1);
  });

  test('at 1440 px the description sits beside the frame and the index lists Demo', async ({
    page,
  }) => {
    approved();
    await page.setViewportSize(WIDE);
    await page.goto(COIN_FLIP);
    const video = demoVideo(page);
    await video.scrollIntoViewIfNeeded();

    const frame = await video.boundingBox();
    const caption = await page.locator('#demo-clip-description').boundingBox();
    if (!frame || !caption) throw new Error('the clip frame or its description has no box');
    expect(frame.width).toBeLessThanOrEqual(MAX_FRAME);
    expect(caption.x).toBeGreaterThanOrEqual(frame.x + frame.width - 1);
    expect(caption.y).toBeLessThan(frame.y + frame.height);

    const index = page.getByRole('navigation', { name: 'Route stages', exact: true });
    const labels = await index.getByRole('link').allTextContents();
    expect(labels.some((text) => text.trim().endsWith('Demo'))).toBe(true);
  });
});
