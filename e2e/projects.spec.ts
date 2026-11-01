import { test, expect, type Page } from '@playwright/test';
import { projects } from '@/data/projects';
import { countLabel } from '@/lib/home-format';

/**
 * /projects in a browser (ENG-01; D-12; 11-UI-SPEC "/projects (ENG-01)").
 * The page is a server-rendered list of full-width route panels titled
 * Engineering: one article per project in data order, each with an h2 block
 * link to its case study, and no hexagon card or hex class anywhere on the
 * site. The seven v1 card tests (heading, card link, navigation, tech badges,
 * status filter and two detail-page checks) were rewritten in 11-06 to route
 * panel cases, none dropped. Names, slugs and the count come from
 * data/projects.ts, never hand-typed, so the spec survives the 11-07 swap.
 */
test.describe('Engineering route panels (ENG-01)', () => {
  const routes = (page: Page) => page.getByRole('list', { name: 'Routes' });

  test('has the Engineering h1 and document title', async ({ page }) => {
    await page.goto('/projects');

    await expect(page.getByRole('heading', { level: 1, name: 'Engineering', exact: true })).toBeVisible();
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

  test('the v1 heading is gone', async ({ page }) => {
    await page.goto('/projects');
    await expect(routes(page)).toBeVisible();

    await expect(page.getByText('Programming Projects')).toHaveCount(0);
  });

  test('Tab reaches each panel title link', async ({ page }) => {
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
