import { test, expect } from '@playwright/test';
import { mediaManifest } from '@/data/generated/media-manifest';
import { projects } from '@/data/projects';

/**
 * coin-flip's Demo clip (ENG-02; D-27; 11-UI-SPEC "Demo — coin-flip: muted
 * clip", E18). The section shows only when the media manifest has the encoded
 * clip and the project carries Tim's approved description; both are read from
 * the data here, so this spec flips by itself when 11-16 ships them. Until
 * then coin-flip has no Demo section, never a placeholder.
 *
 * Playwright's bundled Chromium cannot play H.264 (RESEARCH Pitfall 8), so
 * nothing here presses play: with preload="none" no MP4 request may happen
 * from loading the page alone.
 */
const coinFlip = projects.find((p) => p.slug === 'coin-flip');
if (!coinFlip || coinFlip.slug !== 'coin-flip') throw new Error('no coin-flip project');
const COIN_FLIP = `/projects/${coinFlip.slug}`;
const APPROVED = Boolean(mediaManifest['coin-flip-toss'] && coinFlip.clip?.description);

test.describe('coin-flip Demo clip (D-27)', () => {
  test('coin-flip has no Demo section until its clip and description are approved', async ({
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

  test('loading coin-flip requests no MP4', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(request.url()));

    await page.goto(COIN_FLIP, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Two seconds of idle after load: a preload or a stray fetch would show up here.
    await page.waitForTimeout(2000);

    const mp4 = requested.filter((url) => new URL(url).pathname.endsWith('.mp4'));
    expect(mp4).toEqual([]);
    expect(requested.length).toBeGreaterThan(0);
  });
});
