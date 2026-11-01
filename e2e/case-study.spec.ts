import { test, expect, type Page } from '@playwright/test';
import { projects } from '@/data/projects';

/**
 * The project with the demo terminal, its region name and its last command,
 * all read from the data: the region is named '{project name} demo', so
 * 11-07's swap to box changes only the route paths here, never these names.
 */
const demoProject = projects.find((p) => 'demoCommands' in p && p.demoCommands?.length);
if (!demoProject || !demoProject.demoCommands) throw new Error('no project with demo commands');
const regionName = `${demoProject.name} demo`;
const LAST_N = demoProject.demoCommands.length;
const LAST = demoProject.demoCommands[LAST_N - 1];

/**
 * The case-study route and its demo terminal (ENG-02 route contract, ENG-05;
 * 11 D-01 flat terminal, D-02 amended pause sources and release, D-03 dots,
 * D-26 note line).
 *
 * /projects/[slug] is a Server Component with generateStaticParams,
 * dynamicParams = false and generateMetadata: the title comes from the
 * project name, and any other slug, including a wrong-case one, is the
 * designed 404. three.js and R3F never load on project pages (D-01).
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
  test('/projects/clix-cli is titled from the project name', async ({ page }) => {
    await page.goto('/projects/clix-cli');
    await expect(page).toHaveTitle('CLI_X - AI Command Line Tool · Tim Lui');
  });

  // Slugs match exactly and case-sensitively (dynamicParams = false + notFound()).
  for (const path of ['/projects/no-such-slug', '/projects/CLIX-CLI']) {
    test(`${path}: HTTP 404 with the designed 404 body`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(404);
      await expect(page.getByRole('main').getByText('Error 404', { exact: true })).toHaveCount(1);
    });
  }

  test('loads no THREE.WebGLRenderer script and no canvas (D-01)', async ({ page }) => {
    await page.goto('/projects/clix-cli');
    await expect(page.getByRole('region', { name: regionName })).toBeVisible();
    await page.waitForTimeout(3000);

    const scripts = await loadedScriptBodies(page);
    expect(scripts.length).toBeGreaterThan(0);
    const three = scripts.filter((s) => s.body.includes('THREE.WebGLRenderer')).map((s) => s.url);
    expect(three).toEqual([]);
    await expect(page.locator('canvas')).toHaveCount(0);
  });

  test('a project without demo commands has no Demo section', async ({ page }) => {
    await page.goto('/projects/clix-website');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Demo', exact: true })).toHaveCount(0);
  });
});

test.describe('Demo (ENG-05)', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('Pause is sticky: nothing advances until it is pressed again (D-02)', async ({ page }) => {
    await page.goto('/projects/clix-cli');
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
    await page.goto('/projects/clix-cli');
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
    await page.goto('/projects/clix-cli');
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
    await page.goto('/projects/clix-cli');
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
    await page.goto('/projects/clix-cli');
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
    await page.goto('/projects/clix-cli');
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

  test('a dot shows its command complete without touching the toggle, and a command without a note has no note line (D-03, D-26)', async ({
    page,
  }) => {
    await page.goto('/projects/clix-cli');
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
    // The CLI_X data has no notes, so no command draws a note line.
    await expect(region.locator('[data-note]')).toHaveCount(0);

    // A dot press keeps the hover and focus pauses: only leaving resumes.
    await expect(region).toHaveAttribute('data-playback', 'paused');
    await leaveTerminal(page);
    await expect(region).toHaveAttribute('data-playback', 'playing');
  });

  test('no horizontal scroll at 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/projects/clix-cli');
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
    await page.goto('/projects/clix-cli');
    const region = page.getByRole('region', { name: regionName });

    // The server renders it unpressed; the client flips it after hydration (Pitfall 3).
    await expect(region.getByRole('button', { name: 'Pause demo', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(region).toHaveAttribute('data-playback', 'paused');
  });
});
