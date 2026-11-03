import { test, expect, type Page } from '@playwright/test';
import { trailProfiles } from '@/data/generated/trail-profiles';
import { projects } from '@/data/projects';
import { countLabel } from '@/lib/home-format';
import { formatMetres } from '@/lib/photo-format';

/**
 * /projects in a browser (ENG-01; D-12; 11-UI-SPEC "/projects (ENG-01)").
 * The page is a server-rendered list of full-width route panels titled
 * Engineering: one article per project in data order, each with an h2 block
 * link to its case study, and no hexagon card or hex class anywhere on the
 * site. The seven v1 card tests (heading, card link, navigation, tech badges,
 * status filter and two detail-page checks) were rewritten in 11-06 to route
 * panel cases, none dropped. Names, slugs and the count come from
 * data/projects.ts, never hand-typed, so the spec survives the 11-07 swap.
 * 11-12 adds the metric strip with its release line (D-28) and the trail
 * figure with its signpost caption (D-05, D-07), read from the data and the
 * generated trail profiles.
 */

/** The caption as it reads on screen: '{start} {h} m → {end} {h} m · T4'. */
function signpost(route: string): string {
  const p = trailProfiles.find((t) => t.id === route);
  if (!p) throw new Error(`no generated profile ${route}`);
  return `${p.start.name} ${formatMetres(p.start.heightM)} → ${p.end.name} ${formatMetres(p.end.heightM)} · ${p.sacGrade}`;
}
test.describe('Engineering route panels (ENG-01)', () => {
  const routes = (page: Page) => page.getByRole('list', { name: 'Routes' });

  test('has the Engineering h1 and document title', async ({ page }) => {
    await page.goto('/projects');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Engineering', exact: true })
    ).toBeVisible();
    await expect(page).toHaveTitle('Engineering · Tim Lui');
  });

  test('the kicker counts the routes', async ({ page }) => {
    await page.goto('/projects');

    await expect(
      page.getByText(countLabel(projects.length, 'route', 'routes'), { exact: true })
    ).toBeVisible();
  });

  test('the Routes list holds one panel per project, each titled with a link to its case study, in data order', async ({
    page,
  }) => {
    await page.goto('/projects');

    const articles = routes(page).getByRole('article');
    await expect(articles).toHaveCount(projects.length);
    for (const [i, project] of projects.entries()) {
      const link = articles.nth(i).getByRole('heading', { level: 2 }).getByRole('link');
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAccessibleName(project.name);
      await expect(link).toHaveAttribute('href', `/projects/${project.slug}`);
    }
  });

  test('clicking the panel outside the title opens the case study', async ({ page }) => {
    test.slow();
    const caseStudy = new RegExp(`/projects/${projects[0].slug}$`);

    // The pitch sits under the title link's stretched hit area, so the
    // element under a pointer at the pitch's centre is the title link itself.
    // The click is retried as a whole: under the dev server, another worker's
    // first compile can trigger a Fast Refresh reload that lands the page back
    // on /projects after the navigation (a dev-only artifact, diagnosed in 11-06).
    await expect(async () => {
      await page.goto('/projects');
      const article = routes(page).getByRole('article').first();
      const pitch = article.locator('p').nth(1);
      await expect(pitch).toBeVisible();
      const box = await pitch.boundingBox();
      if (!box) throw new Error('pitch has no layout box');
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;

      const hit = await page.evaluate(
        ([px, py]) => document.elementFromPoint(px, py)?.closest('a')?.getAttribute('href') ?? null,
        [x, y]
      );
      expect(hit).toBe(`/projects/${projects[0].slug}`);

      await page.mouse.click(x, y);
      await expect(page).toHaveURL(caseStudy, { timeout: 10000 });
    }).toPass({ timeout: 60000 });
  });

  test('no element on any route carries a hex class', async ({ page }) => {
    // Five page loads, each a cold compile under the dev server; a load
    // interrupted by a dev reload (net::ERR_ABORTED) is retried.
    test.slow();
    for (const path of ['/', '/photos', '/projects', '/roadmap', `/projects/${projects[0].slug}`]) {
      await expect(async () => {
        await page.goto(path);
        await expect(page.locator('[class*="hex-"]'), path).toHaveCount(0);
      }).toPass({ timeout: 45000 });
    }
  });

  test('no horizontal scroll at 375 px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/projects');
    await expect(routes(page)).toBeVisible();

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('each panel shows its metric strip and release line (ENG-01, D-28)', async ({ page }) => {
    await page.goto('/projects');

    const articles = routes(page).getByRole('article');
    await expect(articles).toHaveCount(projects.length);
    for (const [i, project] of projects.entries()) {
      const article = articles.nth(i);
      const tiles = project.metrics?.tiles ?? [];
      const strip = article.locator('dl');
      if (tiles.length === 0) {
        await expect(strip).toHaveCount(0);
        continue;
      }
      await expect(strip.locator('dt')).toHaveText(tiles.map((t) => t.label));
      await expect(strip.locator('dd')).toHaveText(tiles.map((t) => t.value));
      // Values are data: Mono with tabular figures, final on first paint (no count-up)
      const value = await strip
        .locator('dd')
        .first()
        .evaluate((el) => {
          const cs = getComputedStyle(el);
          return { family: cs.fontFamily, numeric: cs.fontVariantNumeric };
        });
      expect(value.family).toContain('JetBrains');
      expect(value.numeric).toContain('tabular-nums');
      const release = project.metrics?.releaseLine;
      if (release) {
        const line = article.getByText(release, { exact: true });
        await expect(line).toBeVisible();
        expect(await line.evaluate((el) => el.previousElementSibling?.tagName ?? null)).toBe('DL');
      }
    }
  });

  test('each panel shows its trail figure with the signpost caption (D-05, D-07)', async ({
    page,
  }) => {
    await page.goto('/projects');

    const articles = routes(page).getByRole('article');
    for (const [i, project] of projects.entries()) {
      if (!project.route) continue;
      const figure = articles.nth(i).getByRole('figure');
      await expect(figure).toHaveCount(1);
      await expect(figure.locator('svg path')).toHaveCount(3);
      const caption = figure.locator('figcaption');
      // The caption as seen: without the sr-only words (' to ', ', ' and the waymark name)
      const text = await caption.evaluate((el) => {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.sr-only').forEach((n) => n.remove());
        return clone.textContent ?? '';
      });
      expect(text).toBe(signpost(project.route));
      expect(text).toContain(project.slug === 'box' ? 'T4' : 'T1');
      await expect(caption.locator('[data-marker]')).toHaveAttribute(
        'data-marker',
        project.slug === 'box' ? 'white-blue-white' : 'yellow'
      );
    }
  });

  test('at 1440 px the figure sits to the right of the title', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/projects');

    const articles = routes(page).getByRole('article');
    for (const [i, project] of projects.entries()) {
      if (!project.route) continue;
      const article = articles.nth(i);
      const title = await article.getByRole('heading', { level: 2 }).boundingBox();
      const figure = await article.getByRole('figure').boundingBox();
      if (!title || !figure) throw new Error(`${project.slug}: title or figure has no layout box`);
      expect(figure.x).toBeGreaterThan(title.x + title.width);
    }
  });

  test('at 375 px the figure follows the links row in one column', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/projects');

    const article = routes(page).getByRole('article').first();
    const title = await article.getByRole('heading', { level: 2 }).boundingBox();
    const figure = await article.getByRole('figure').boundingBox();
    if (!title || !figure) throw new Error('title or figure has no layout box');
    expect(figure.y).toBeGreaterThan(title.y + title.height);
    expect(figure.x + figure.width).toBeLessThanOrEqual(375);
  });

  test('the v1 heading is gone', async ({ page }) => {
    await page.goto('/projects');
    await expect(routes(page)).toBeVisible();

    await expect(page.getByText('Programming Projects')).toHaveCount(0);
  });

  // @no-webkit: the panel titles are links, and Playwright's WebKit never Tabs to a link
  // (Safari's default, helpers/engine.ts); this test has no step left without Tab.
  test('Tab reaches each panel title link @no-webkit', async ({ page }) => {
    await page.goto('/projects');
    await expect(routes(page)).toBeVisible();

    for (const project of projects) {
      const link = routes(page).getByRole('link', { name: project.name, exact: true });
      let focused = false;
      for (let presses = 0; presses < 40 && !focused; presses++) {
        await page.keyboard.press('Tab');
        focused = await link.evaluate((el) => el === document.activeElement);
      }
      expect(focused, `Tab reaches ${project.name}`).toBe(true);
      await expect(link).toBeFocused();
    }
  });
});
