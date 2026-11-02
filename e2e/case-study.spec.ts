import { test, expect, type Page } from '@playwright/test';
import { mediaManifest } from '@/data/generated/media-manifest';
import { projects } from '@/data/projects';
import { roadmapItems } from '@/data/roadmap';
import type { Project } from '@/data/types';
import { plainText } from '@/lib/inline-code';

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
        (entry) =>
          entry.initiatorType === 'script' || /\.m?js(\?|$)/.test(new URL(entry.name).pathname)
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
      await expect(page.getByRole('main').getByText('Error 404 · Page not found', { exact: true })).toHaveCount(1);
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

  test("coin-flip's Demo is its approved clip, never a terminal (UI-SPEC E10, E18)", async ({
    page,
  }) => {
    // Tim approved the clip and its description in 11-16; without both the
    // section is left out (D-27), and either way coin-flip has no terminal.
    const clipShown = Boolean(mediaManifest['coin-flip-toss'] && coinFlip.clip?.description);
    await page.goto(COIN_FLIP);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Demo', exact: true })).toHaveCount(
      clipShown ? 1 : 0
    );
    await expect(page.locator('section#demo video')).toHaveCount(clipShown ? 1 : 0);
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
    // Scoped to the trailhead header: the end block (11-14) repeats the words
    // as the page's primary link, to the same /contact.
    await expect(
      article.locator('header').getByRole('link', { name: 'Ask for a walkthrough', exact: true })
    ).toHaveAttribute('href', '/contact');
    await expect(article.getByRole('link', { name: 'GitHub', exact: true })).toHaveCount(0);
    await expect(page.locator('a[href*="github.com/tlex-web/coin-flip"]')).toHaveCount(0);
  });

  for (const project of [box, coinFlip]) {
    test(`the ${project.slug} trailhead shows its route profile beside the title from 1024 px only (D-05, D-07)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/projects/${project.slug}`);
      const article = page.getByRole('article', { name: project.name, exact: true });
      const figure = article.locator('header').getByRole('figure');
      await expect(figure).toBeVisible();
      const title = await article.getByRole('heading', { level: 1 }).boundingBox();
      const fig = await figure.boundingBox();
      if (!title || !fig) throw new Error('title or figure has no layout box');
      expect(fig.x).toBeGreaterThan(title.x + title.width);

      await page.setViewportSize({ width: 375, height: 800 });
      await expect(figure).toBeHidden();
    });
  }

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

/** A project's next steps that the route log holds as planned or in progress (N4). */
const aheadRows = (project: Project) =>
  (project.nextSteps ?? []).flatMap((id) => {
    const row = roadmapItems.find((r) => r.id === id);
    return row && row.area === project.slug && row.status !== 'completed' ? [row] : [];
  });

/**
 * The case-study sections (ENG-02, ENG-04, D-25; 11-UI-SPEC "Safety — box",
 * "Privacy — coin-flip", "Metrics", "Stack" and "Next steps"). Every expected
 * string comes from data/projects.ts or data/roadmap.ts, so the rendered text
 * is checked against the approved data itself.
 */
test.describe('Case-study sections', () => {
  /** The section id of a label: 'Next steps' is #next-steps. */
  const sectionId = (label: string) => label.toLowerCase().replace(/ /g, '-');

  /** The labels each page should render, in slot order, from what its data holds. */
  const expectedLabels = (project: Project): string[] => {
    const third =
      project.slug === 'box'
        ? project.safety?.intro || project.safety?.capture
          ? 'Safety'
          : null
        : project.privacy
          ? 'Privacy'
          : null;
    return [
      project.problem?.length ? 'Problem' : null,
      project.pipeline ? 'Pipeline' : null,
      third,
      project.metrics?.tiles.length ? 'Metrics' : null,
      (
        project.slug === 'box'
          ? project.demo
          : mediaManifest['coin-flip-toss'] && project.clip?.description
      )
        ? 'Demo'
        : null,
      project.stack ? 'Stack' : null,
      aheadRows(project).length ? 'Next steps' : null,
    ].filter((label): label is string => label !== null);
  };

  for (const project of [box, coinFlip]) {
    test(`sections keep the fixed order on /projects/${project.slug} (ENG-02)`, async ({
      page,
    }) => {
      await page.goto(`/projects/${project.slug}`);
      const article = page.getByRole('article', { name: project.name, exact: true });
      await expect(article.getByRole('heading', { level: 1 })).toBeVisible();

      const labels = expectedLabels(project);
      expect(labels.slice(0, 1)).toEqual(['Problem']);
      // Metrics follows the third slot and precedes Demo; Stack and Next
      // steps come after Demo (box has no next step today, N4).
      const third = project.slug === 'box' ? 'Safety' : 'Privacy';
      const at = (label: string) => labels.indexOf(label);
      expect(at('Metrics')).toBe(at(third) + 1);
      expect(at('Stack')).toBeGreaterThan(Math.max(at('Metrics'), at('Demo')));
      if (at('Next steps') >= 0) expect(at('Next steps')).toBe(labels.length - 1);
      const rendered = (await article.getByRole('heading', { level: 2 }).allTextContents()).filter(
        (text) => labels.includes(text)
      );
      expect(rendered).toEqual(labels);
      // The third slot is Safety on box and Privacy on coin-flip, never both.
      const other = project.slug === 'box' ? 'Privacy' : 'Safety';
      await expect(
        article.getByRole('heading', { level: 2, name: other, exact: true })
      ).toHaveCount(0);
      for (const label of labels) {
        await expect(page.locator(`section#${sectionId(label)}`)).toHaveCount(1);
      }
    });
  }

  for (const project of [box, coinFlip]) {
    test(`Metrics tiles show the audited values with their context lines on /projects/${project.slug} (ENG-04)`, async ({
      page,
    }) => {
      const tiles = project.metrics?.tiles ?? [];
      expect(tiles.length).toBeGreaterThan(0);
      const path = `/projects/${project.slug}`;

      // First paint: the server HTML already holds every final value (no count-up).
      const html = await (await page.request.get(path)).text();
      for (const tile of tiles) expect(html).toContain(`>${tile.value}</dd>`);

      await page.goto(path);
      const cells = page.locator('section#metrics dl > div');
      await expect(cells).toHaveCount(tiles.length);
      for (const [i, tile] of tiles.entries()) {
        const cell = cells.nth(i);
        await expect(cell.locator('dt')).toHaveText(tile.label);
        const dds = cell.locator('dd');
        await expect(dds.nth(0)).toHaveText(tile.value);
        // The tile's name is in the link's aria-label only, so the line reads as on screen (12 D-24).
        await expect(dds.nth(1)).toHaveText(
          tile.sourceUrl ? `${tile.context} Source` : tile.context
        );
        if (tile.sourceUrl) {
          const source = dds.nth(1).getByRole('link', {
            name: `Source for ${tile.label}`,
            exact: true,
          });
          await expect(source).toHaveAttribute('href', tile.sourceUrl);
          await expect(source).not.toHaveAttribute('target', /.*/);
        } else {
          await expect(dds.nth(1).getByRole('link')).toHaveCount(0);
        }
      }
      // Each source link names its tile: none is the bare word 'Source' (11-UAT G-11-4).
      const metrics = page.locator('section#metrics');
      await expect(metrics.getByRole('link', { name: 'Source', exact: true })).toHaveCount(0);
      await expect(metrics.getByRole('link')).toHaveCount(
        tiles.filter((tile) => tile.sourceUrl).length
      );
      // coin-flip's context lines never link anywhere (D-23).
      if (project.slug === 'coin-flip') {
        await expect(page.locator('section#metrics a')).toHaveCount(0);
      }
    });
  }

  /**
   * The G-11-4 tile names add a name, never a pixel (12 D-24): each source
   * link's accessible name is its aria-label 'Source for {label}', which
   * begins with the visible word (label in name), and the link holds no
   * hidden text. At the visual-baseline widths and height
   * (e2e/visual/routes.spec.ts) every link's text is exactly 'Source' and the
   * page does not scroll sideways.
   */
  test('box Metrics source links carry their tile name in the accessible name only, at 375, 768 and 1440 px (G-11-4, 12 D-24)', async ({
    page,
  }) => {
    const tiles = box.metrics?.tiles ?? [];
    const sourced = tiles.filter((tile) => tile.sourceUrl);
    expect(sourced.length).toBeGreaterThan(0);

    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(BOX);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      const metrics = page.locator('section#metrics');
      const links = metrics.getByRole('link', { name: /^Source for / });
      await expect(links, `links at ${width} px`).toHaveCount(sourced.length);
      for (const tile of sourced) {
        const link = metrics.getByRole('link', { name: `Source for ${tile.label}`, exact: true });
        await expect(link).toHaveAttribute('aria-label', `Source for ${tile.label}`);
        await expect(link).toHaveText('Source');
      }
      const m = await metrics.evaluate((section) => ({
        hidden: section.querySelectorAll('.sr-only').length,
        contexts: Array.from(section.querySelectorAll('dl > div')).map((cell) =>
          (cell.querySelectorAll('dd')[1]?.textContent ?? '').replace(/\s+/g, ' ').trim()
        ),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(m.hidden, `sr-only text at ${width} px`).toBe(0);
      expect(m.contexts).toEqual(
        tiles.map((tile) => (tile.sourceUrl ? `${tile.context} Source` : tile.context))
      );
      expect(m.scrollWidth, `scrollWidth at ${width} px`).toBeLessThanOrEqual(m.clientWidth);
    }
  });

  test('Stack lists each approved group and its chips', async ({ page }) => {
    for (const project of [box, coinFlip]) {
      const groups = project.stack?.groups ?? [];
      await page.goto(`/projects/${project.slug}`);
      const section = page.locator('section#stack');
      const h3s = section.getByRole('heading', { level: 3 });
      if (groups.length > 1) {
        await expect(h3s).toHaveText(groups.map((g) => g.label));
      } else {
        await expect(h3s).toHaveCount(0);
      }
      await expect(section.getByRole('listitem')).toHaveText(groups.flatMap((g) => g.items));
      await expect(section.getByRole('link')).toHaveCount(0);
    }
  });

  test('coin-flip Next steps link into the filtered route log (ROUTE-01)', async ({ page }) => {
    const rows = aheadRows(coinFlip);
    expect(rows.length).toBeGreaterThan(0);
    await page.goto(COIN_FLIP);
    const section = page.locator('section#next-steps');

    const rowLinks = section.getByRole('list').getByRole('link');
    await expect(rowLinks).toHaveCount(rows.length);
    for (const [i, row] of rows.entries()) {
      await expect(rowLinks.nth(i)).toHaveAttribute('href', `/roadmap?project=coin-flip#${row.id}`);
      await expect(rowLinks.nth(i)).toContainText(row.title);
    }
    await expect(
      section.getByRole('link', { name: 'Full route log', exact: true })
    ).toHaveAttribute('href', '/roadmap?project=coin-flip');

    await rowLinks.first().click();
    await expect(page).toHaveURL(`/roadmap?project=coin-flip#${rows[0].id}`);
    const target = page.locator(`li[id="${rows[0].id}"]`);
    await expect(target).toContainText(rows[0].title);
    await expect.poll(() => target.evaluate((el) => el.matches(':target'))).toBe(true);
  });

  test('box has no Next steps section (N4)', async ({ page }) => {
    expect(aheadRows(box)).toEqual([]);
    await page.goto(BOX);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Next steps', exact: true })
    ).toHaveCount(0);
    await expect(page.locator('section#next-steps')).toHaveCount(0);
  });

  test('box Safety shows the real preview output (D-25)', async ({ page }) => {
    if (box.slug !== 'box' || !box.safety?.capture) throw new Error('box has no approved capture');
    const { command, input, output } = box.safety.capture;
    await page.goto(BOX);
    const section = page.locator('section#safety');
    const figure = section.getByRole('figure');

    await expect(figure.locator('figcaption')).toHaveText(`Preview run · box ${command}`);
    const pre = figure.locator('pre');
    await expect(pre).toBeVisible();
    expect(await pre.evaluate((el) => el.textContent)).toBe(`❯ ${input}\n${output}`);
    // The intro and the --force line each set the flag as code (11-14); the
    // line reads as approved, its backticks not rendered.
    await expect(section.locator('code', { hasText: '--force' })).toHaveCount(
      box.safety.intro ? 2 : 1
    );
    if (box.safety.forceLine) {
      const line = section.getByText(plainText(box.safety.forceLine), { exact: true });
      await expect(line).toBeVisible();
      await expect(line.locator('code').first()).toHaveText('--force');
    }
    expect(await section.evaluate((el) => el.textContent)).not.toContain('`');
    // Static: nothing in the preview takes focus or acts.
    await expect(figure.getByRole('button')).toHaveCount(0);
    await expect(figure.locator('[tabindex]')).toHaveCount(0);
  });

  test('coin-flip Privacy lists its facts and Pipeline holds the fairness intro (D-25)', async ({
    page,
  }) => {
    if (coinFlip.slug !== 'coin-flip' || !coinFlip.privacy || !coinFlip.pipeline?.intro) {
      throw new Error('coin-flip has no approved privacy block or pipeline intro');
    }
    await page.goto(COIN_FLIP);

    const privacy = page.locator('section#privacy');
    await expect(privacy.getByRole('listitem')).toHaveText(coinFlip.privacy.facts);

    const pipeline = page.locator('section#pipeline');
    await expect(pipeline.getByText(coinFlip.pipeline.intro, { exact: true })).toBeVisible();
    const n = coinFlip.pipeline.stages.length;
    await expect(
      pipeline.getByRole('list', { name: `${coinFlip.name} pipeline, ${n} stages`, exact: true })
    ).toBeVisible();
    // The fairness fact lives in Pipeline, never under Privacy.
    await expect(privacy.getByText(coinFlip.pipeline.intro)).toHaveCount(0);
  });

  test('at 375 px neither case study scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    for (const path of [BOX, COIN_FLIP]) {
      await page.goto(path);
      await expect(page.locator('section#problem')).toBeVisible();

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, path).toBeLessThanOrEqual(clientWidth);
    }
    // The preview block wraps inside its frame instead of overflowing it.
    await page.goto(BOX);
    const pre = page.locator('section#safety pre');
    const overflow = await pre.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
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

  test('Tab from the toggle to a dot after a release keeps playing (D-02 amended)', async ({
    page,
  }) => {
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
    await expect(
      region.getByRole('button', { name: 'Go to command 1', exact: true })
    ).toBeFocused();
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

  /**
   * 12-UI-SPEC D-24 and E13 long-text: the body is as tall as the longest
   * command wrapped at the current width, so typing never moves anything
   * below it. Samples the body height every frame from load until the first
   * typed command (command 2) has been typing for a while; the typing
   * command's invisible reservation copy marks that phase.
   */
  test('the body height does not change while the first command types, at 375 px (E13)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(BOX);
    const region = page.getByRole('region', { name: regionName });
    // Offscreen and hover are pause sources: bring it into view, pointer away.
    await region.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await expect(region).toHaveAttribute('data-playback', 'playing');

    const m = await region.evaluate(
      (el, commandCount) =>
        new Promise<{ heights: number[]; typed: number }>((resolve) => {
          const body = el.querySelector('[data-cell="1"]')?.parentElement as HTMLElement;
          const heights: number[] = [];
          let typed = 0;
          const step = () => {
            heights.push(body.getBoundingClientRect().height);
            const typing =
              el.getAttribute('data-command') === '2' && body.children.length > commandCount;
            if (typing) typed += 1;
            if (typed >= 30) resolve({ heights, typed });
            else requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }),
      box.demo?.commands.length ?? 0
    );

    expect(m.typed).toBeGreaterThanOrEqual(30);
    expect(m.heights[0]).toBeGreaterThan(0);
    expect(Math.max(...m.heights) - Math.min(...m.heights)).toBe(0);
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
