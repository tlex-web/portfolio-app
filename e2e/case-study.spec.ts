import { test, expect, type Page } from '@playwright/test';
import { projects } from '@/data/projects';

/**
 * The two case studies and box's terminal, all read from the data: the region
 * is named '{project name} demo', and its last command (with its note) comes
 * from box's approved commands.
 */
const box = projects.find((p) => p.slug === 'box');
const coinFlip = projects.find((p) => p.slug === 'coin-flip');
if (!box || box.slug !== 'box' || !box.demo) throw new Error('no box project with a demo');
if (!coinFlip || coinFlip.slug !== 'coin-flip') throw new Error('no coin-flip project');
const BOX = `/projects/${box.slug}`;
const COIN_FLIP = `/projects/${coinFlip.slug}`;
const regionName = `${box.name} demo`;
const LAST_N = box.demo.commands.length;
const LAST = box.demo.commands[LAST_N - 1];

/**
 * The case-study route, its trailhead and box's demo terminal (ENG-02 route
 * contract, ENG-05; 11 D-01 flat terminal, D-02 amended pause sources and
 * release, D-03 dots, D-12 links, D-22 slugs, D-26 note line).
 *
 * /projects/[slug] is a Server Component with generateStaticParams,
 * dynamicParams = false and generateMetadata: the title comes from the
 * project name and the description is the approved pitch. Any other slug,
 * including the retired CLI_X slugs and a wrong-case one, is the designed
 * 404 with no redirect. three.js and R3F never load on project pages (D-01).
 *
 * The terminal's state is asserted through `aria-pressed` on the Pause toggle,
 * `data-playback` / `data-command` on the region, `data-cell` / `data-note` in
 * the body and `aria-current` on the dots, never through classes.
 * Reduced motion is pinned per describe, because the terminal starts paused
 * under it.
 */

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

/**
 * Moves the pointer off the terminal and focus out of it, clearing both
 * temporary pauses. Needed after a dot or a Pause press, which leave the
 * pointer over the region and focus inside it; never after a release, which
 * clears both pauses itself (D-02 amended).
 */
async function leaveTerminal(page: Page) {
  await page.mouse.move(0, 0);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

test.describe('Case-study route', () => {
  for (const project of [box, coinFlip]) {
    test(`/projects/${project.slug} is titled from the project name, with the pitch as description`, async ({
      page,
    }) => {
      const response = await page.goto(`/projects/${project.slug}`);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(`${project.name} · Tim Lui`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        project.pitch ?? ''
      );
      await expect(
        page.getByRole('heading', { level: 1, name: project.name, exact: true })
      ).toBeVisible();
    });
  }

  // The retired CLI_X slugs and a wrong-case slug match nothing
  // (dynamicParams = false + notFound()), and nothing redirects them.
  for (const path of [
    '/projects/clix-cli',
    '/projects/clix-website',
    '/projects/BOX',
    '/projects/no-such-slug',
  ]) {
    test(`${path}: HTTP 404 with the designed 404 body and no redirect`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(404);
      expect(new URL(page.url()).pathname).toBe(path);
      await expect(page.getByRole('main').getByText('Error 404', { exact: true })).toHaveCount(1);
    });
  }

  for (const path of [BOX, COIN_FLIP]) {
    test(`${path} loads no THREE.WebGLRenderer script and no canvas (D-01)`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.waitForTimeout(3000);

      const scripts = await loadedScriptBodies(page);
      expect(scripts.length).toBeGreaterThan(0);
      const three = scripts.filter((s) => s.body.includes('THREE.WebGLRenderer')).map((s) => s.url);
      expect(three).toEqual([]);
      await expect(page.locator('canvas')).toHaveCount(0);
    });
  }

  test('coin-flip has no Demo section and no terminal (UI-SPEC E10)', async ({ page }) => {
    await page.goto(COIN_FLIP);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Demo', exact: true })).toHaveCount(0);
    await expect(page.getByRole('region', { name: `${coinFlip.name} demo` })).toHaveCount(0);
  });

  test('the box trailhead: back link, kicker, outcome and the GitHub button (D-12, D-29)', async ({
    page,
  }) => {
    await page.goto(BOX);
    const article = page.getByRole('article', { name: box.name, exact: true });
    await expect(article.getByRole('link', { name: 'All routes', exact: true })).toHaveAttribute(
      'href',
      '/projects'
    );
    const kicker = [box.kicker.version, box.kicker.status].filter(Boolean).join(' · ');
    await expect(article.getByText(kicker, { exact: true })).toBeVisible();
    if (box.outcome) await expect(article.getByText(box.outcome, { exact: true })).toBeVisible();
    const github = article.getByRole('link', { name: 'GitHub', exact: true });
    await expect(github).toHaveAttribute('href', box.links.github);
    // Same tab (§I #7 default).
    await expect(github).not.toHaveAttribute('target', /.*/);
  });

  test('the coin-flip trailhead: private source note and a walkthrough link, never a repository link (D-12)', async ({
    page,
  }) => {
    await page.goto(COIN_FLIP);
    const article = page.getByRole('article', { name: coinFlip.name, exact: true });
    await expect(article.getByRole('link', { name: 'All routes', exact: true })).toHaveAttribute(
      'href',
      '/projects'
    );
    const kicker = [coinFlip.kicker.version, coinFlip.kicker.status].filter(Boolean).join(' · ');
    await expect(article.getByText(kicker, { exact: true })).toBeVisible();
    if (coinFlip.outcome) {
      await expect(article.getByText(coinFlip.outcome, { exact: true })).toBeVisible();
    }
    await expect(article.getByText('Source: private repository', { exact: true })).toBeVisible();
    await expect(
      article.getByRole('link', { name: 'Ask for a walkthrough', exact: true })
    ).toHaveAttribute('href', '/contact');
    await expect(article.getByRole('link', { name: 'GitHub', exact: true })).toHaveCount(0);
    await expect(page.locator('a[href*="github.com/tlex-web/coin-flip"]')).toHaveCount(0);
  });

  for (const path of [BOX, COIN_FLIP]) {
    test(`${path} has no horizontal scroll at 375 px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});

test.describe('Demo (ENG-05)', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('Pause is sticky: nothing advances until it is pressed again (D-02)', async ({ page }) => {
    await page.goto(BOX);
    const region = page.getByRole('region', { name: regionName });
    const toggle = region.getByRole('button', { name: 'Pause demo', exact: true });

    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveText('Pause');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(region).toHaveAttribute('data-playback', 'paused');

    // Pointer and focus leave: only the sticky toggle holds the pause now.
    await leaveTerminal(page);
    const shown = await region.getAttribute('data-command');
    await page.waitForTimeout(6000);
    await expect(region).toHaveAttribute('data-command', shown ?? '');
    await expect(region).toHaveAttribute('data-playback', 'paused');
    await expect(toggle).toHaveText('Pause');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(region).toHaveAttribute('data-playback', 'playing');
    await expect(region).not.toHaveAttribute('data-command', shown ?? '', { timeout: 8000 });
  });

  test('releasing Pause resumes at once with the pointer still over the terminal (D-02 amended)', async ({
    page,
  }) => {
    await page.goto(BOX);
    const region = page.getByRole('region', { name: regionName });
    const toggle = region.getByRole('button', { name: 'Pause demo', exact: true });
    // Offscreen is a pause source too: bring the terminal into view first.
    await region.scrollIntoViewIfNeeded();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(region).toHaveAttribute('data-playback', 'paused');
    const shown = await region.getAttribute('data-command');

    // The pointer stays on the toggle and focus stays on it: no move, no blur.
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toBeFocused();
    await expect(region).toHaveAttribute('data-playback', 'playing');
    await expect(region).not.toHaveAttribute('data-command', shown ?? '', { timeout: 8000 });
  });

  test('after a release, leaving and re-entering pauses again (D-02 amended)', async ({ page }) => {
    await page.goto(BOX);
    const region = page.getByRole('region', { name: regionName });
    const toggle = region.getByRole('button', { name: 'Pause demo', exact: true });
    await region.scrollIntoViewIfNeeded();

    await toggle.click();
    await toggle.click();
    await expect(region).toHaveAttribute('data-playback', 'playing');

    await page.mouse.move(0, 0);
    await expect(region).toHaveAttribute('data-playback', 'playing');
    await region.hover({ position: { x: 24, y: 80 } });
    await expect(region).toHaveAttribute('data-playback', 'paused');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('Tab from the toggle to a dot after a release keeps playing (D-02 amended)', async ({ page }) => {
    await page.goto(BOX);
    const region = page.getByRole('region', { name: regionName });
    const toggle = region.getByRole('button', { name: 'Pause demo', exact: true });
    await region.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);

    // Focus enters from outside, which pauses; Space presses, Space releases.
    await toggle.focus();
    await expect(region).toHaveAttribute('data-playback', 'paused');
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(region).toHaveAttribute('data-playback', 'playing');

    // Moving between the region's own controls is not an entry.
    await page.keyboard.press('Tab');
    await expect(region.getByRole('button', { name: 'Go to command 1', exact: true })).toBeFocused();
    await expect(region).toHaveAttribute('data-playback', 'playing');
  });

  test('hovering pauses for as long as the pointer stays (D-02)', async ({ page }) => {
    await page.goto(BOX);
    const region = page.getByRole('region', { name: regionName });
    const toggle = region.getByRole('button', { name: 'Pause demo', exact: true });
    // Offscreen is a pause source too: bring the terminal into view first.
    await region.scrollIntoViewIfNeeded();
    await expect(region).toHaveAttribute('data-playback', 'playing');

    await region.hover({ position: { x: 24, y: 80 } });
    await expect(region).toHaveAttribute('data-playback', 'paused');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await page.mouse.move(0, 0);
    await expect(region).toHaveAttribute('data-playback', 'playing');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('Tab to the toggle pauses while focus is inside (D-02)', async ({ page }) => {
    await page.goto(BOX);
    const region = page.getByRole('region', { name: regionName });
    const toggle = region.getByRole('button', { name: 'Pause demo', exact: true });
    // Offscreen is a pause source too: bring the terminal into view first.
    await region.scrollIntoViewIfNeeded();
    await expect(region).toHaveAttribute('data-playback', 'playing');

    let reached = false;
    for (let i = 0; i < 60 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await toggle.evaluate((el) => el === document.activeElement);
    }
    expect(reached).toBe(true);
    await expect(region).toHaveAttribute('data-playback', 'paused');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('a dot shows its command complete with its note line, without touching the toggle (D-03, D-26)', async ({
    page,
  }) => {
    await page.goto(BOX);
    const region = page.getByRole('region', { name: regionName });
    const toggle = region.getByRole('button', { name: 'Pause demo', exact: true });
    const dot = region.getByRole('button', { name: `Go to command ${LAST_N}`, exact: true });

    await dot.click();
    await expect(region).toHaveAttribute('data-command', String(LAST_N));
    await expect(dot).toHaveAttribute('aria-current', 'true');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    const cell = region.locator(`[data-cell="${LAST_N}"]`);
    await expect(cell).toBeVisible();
    await expect(cell).toContainText(LAST.output);
    // Only the shown, complete command draws its note where it can be seen:
    // the height-reservation cells hold theirs invisibly.
    await expect(cell.locator('[data-note]')).toHaveText(LAST.note ?? '');
    await expect(region.locator('[data-note]:visible')).toHaveCount(1);

    // A dot press keeps the hover and focus pauses: only leaving resumes.
    await expect(region).toHaveAttribute('data-playback', 'paused');
    await leaveTerminal(page);
    await expect(region).toHaveAttribute('data-playback', 'playing');
  });

  test('no horizontal scroll at 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(BOX);
    await expect(page.getByRole('region', { name: regionName })).toBeVisible();

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

test.describe('Demo under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('starts paused with the toggle pressed (D-02)', async ({ page }) => {
    await page.goto(BOX);
    const region = page.getByRole('region', { name: regionName });

    // The server renders it unpressed; the client flips it after hydration (Pitfall 3).
    await expect(region.getByRole('button', { name: 'Pause demo', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(region).toHaveAttribute('data-playback', 'paused');
  });
});
