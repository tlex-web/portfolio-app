import { test, expect, type Page } from '@playwright/test';

/**
 * The case-study route and its demo terminal (ENG-02 route contract, ENG-05;
 * 11 D-01 flat terminal, D-02 pause sources).
 *
 * /projects/[slug] is a Server Component with generateStaticParams,
 * dynamicParams = false and generateMetadata: the title comes from the
 * project name, and any other slug, including a wrong-case one, is the
 * designed 404. three.js and R3F never load on project pages (D-01).
 *
 * The terminal's state is asserted through `aria-pressed` on the Pause toggle
 * and `data-playback` / `data-command` on the region, never through classes.
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

/** Moves the pointer off the terminal and focus out of it, clearing both temporary pauses. */
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
    await expect(page.getByRole('region', { name: 'CLI_X demo' })).toBeVisible();
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
    const region = page.getByRole('region', { name: 'CLI_X demo' });
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
    await leaveTerminal(page);
    await expect(region).toHaveAttribute('data-playback', 'playing');
    await expect(region).not.toHaveAttribute('data-command', shown ?? '', { timeout: 8000 });
  });
});

test.describe('Demo under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('starts paused with the toggle pressed (D-02)', async ({ page }) => {
    await page.goto('/projects/clix-cli');
    const region = page.getByRole('region', { name: 'CLI_X demo' });

    // The server renders it unpressed; the client flips it after hydration (Pitfall 3).
    await expect(region.getByRole('button', { name: 'Pause demo', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(region).toHaveAttribute('data-playback', 'paused');
  });
});
