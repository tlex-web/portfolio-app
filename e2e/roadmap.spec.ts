import { test, expect, type Page } from '@playwright/test';
import { roadmapItems, surveyedAt } from '@/data/roadmap';
import { formatLogDate } from '@/lib/log-date';
import {
  BAND_LABELS,
  PROJECTS,
  PROJECT_LABELS,
  STATUSES,
  STATUS_LABELS,
  countsFor,
  routeLogView,
  type LogProject,
  type LogStatus,
} from '@/lib/route-log';

/**
 * The /roadmap route log in a browser (ROUTE-01, ROUTE-02 server half,
 * ROUTE-03; D-18, D-19, D-20; 11-UI-SPEC "/roadmap Route Log"). The page is a
 * Server Component that reads `?project=` and `?status=` through the 11-05
 * whitelists and renders Tim's confirmed rows as Summit, Current camp and Base
 * bands under a "Route log surveyed" kicker. A filter combination with no
 * entries (reachable only by a typed URL) shows the dashed empty plate.
 * Expected values come from roadmapItems, surveyedAt, routeLogView, countsFor
 * and formatLogDate, never hand-typed.
 */
const all = routeLogView(roadmapItems, { project: 'all', status: 'all' });
const total = all.total;

/** The first project + status pair with no entries, derived from countsFor. */
function zeroCombination(): { project: LogProject; status: LogStatus } | null {
  for (const status of STATUSES) {
    const counts = countsFor(roadmapItems, { project: 'all', status });
    const project = PROJECTS.find((p) => counts.project[p] === 0);
    if (project) return { project, status };
  }
  return null;
}

const statusLine = (page: Page) => page.getByRole('main').getByRole('status');

test.describe('/roadmap route log (ROUTE-01, ROUTE-03)', () => {
  test('has the Roadmap title and h1', async ({ page }) => {
    await page.goto('/roadmap');
    await expect(page).toHaveTitle('Roadmap · Tim Lui');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Roadmap');
  });

  test('the kicker reads "Route log surveyed" with surveyedAt (D-20)', async ({ page }) => {
    await page.goto('/roadmap');
    await expect(
      page.getByRole('main').getByText(`Route log surveyed ${formatLogDate(surveyedAt)}`, {
        exact: true,
      })
    ).toBeVisible();
  });

  test('band headings follow the computed bands top to bottom (D-19)', async ({ page }) => {
    await page.goto('/roadmap');
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText(
      all.bands.map((b) => BAND_LABELS[b.id])
    );
  });

  test('band jump links carry the counts and point at the band ids', async ({ page }) => {
    await page.goto('/roadmap');
    const links = page.getByRole('list', { name: 'Bands' }).getByRole('link');
    await expect(links).toHaveCount(all.bands.length);
    for (const [i, band] of all.bands.entries()) {
      await expect(links.nth(i)).toHaveText(`${BAND_LABELS[band.id]} ${band.items.length}`);
      await expect(links.nth(i)).toHaveAttribute('href', `#${band.id}`);
      await expect(page.locator(`section[id="${band.id}"]`)).toHaveCount(1);
    }
  });

  test('every row id resolves, and a row anchor makes that row the :target', async ({ page }) => {
    await page.goto('/roadmap');
    for (const item of roadmapItems) {
      await expect(page.locator(`li[id="${item.id}"]`)).toHaveCount(1);
    }
    const planned = all.bands.find((b) => b.status === 'planned')?.items[0];
    expect(planned).toBeDefined();
    await page.goto(`/roadmap#${planned!.id}`);
    const row = page.locator(`li[id="${planned!.id}"]`);
    await expect(row).toContainText(planned!.title);
    expect(await row.evaluate((el) => el.matches(':target'))).toBe(true);
  });

  test('the v2.0 phase disclosure starts closed and shows Phase 11 in progress (D-18)', async ({
    page,
  }) => {
    await page.goto('/roadmap');
    const v2 = roadmapItems.find((i) => i.status === 'in-progress' && i.phases);
    expect(v2).toBeDefined();
    const details = page.locator(`li[id="${v2!.id}"] details`);
    await expect(details).not.toHaveAttribute('open', /.*/);
    const phase11 = details.locator('li').filter({ hasText: 'Phase 11' });
    await expect(phase11).toBeHidden();
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
    await expect(phase11).toBeVisible();
    await expect(phase11).toContainText(STATUS_LABELS['in-progress']);
  });

  test('the status line counts every entry with no filter', async ({ page }) => {
    await page.goto('/roadmap');
    await expect(statusLine(page)).toHaveText(`Showing ${total} entries`);
  });

  test('main holds no placeholder text', async ({ page }) => {
    await page.goto('/roadmap');
    const text = await page.getByRole('main').evaluate((main) => {
      const clone = main.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('pre').forEach((pre) => pre.remove());
      return clone.textContent ?? '';
    });
    for (const bad of ['—', 'N/A', 'TBD', 'undefined', 'null', 'NaN', 'coming soon']) {
      expect(text).not.toContain(bad);
    }
  });

  test('@375: no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/roadmap');
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

test.describe('/roadmap filters from the URL (ROUTE-02 server half)', () => {
  test('a filter with entries reads "Showing n of total" and keeps only its bands', async ({
    page,
  }) => {
    const project = PROJECTS.find((p) => {
      const v = routeLogView(roadmapItems, { project: p, status: 'all' });
      return v.shown > 0 && v.shown < total;
    });
    expect(project).toBeDefined();
    const view = routeLogView(roadmapItems, { project: project!, status: 'all' });
    await page.goto(`/roadmap?project=${project}`);
    await expect(statusLine(page)).toHaveText(`Showing ${view.shown} of ${total} entries`);
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText(
      view.bands.map((b) => BAND_LABELS[b.id])
    );
  });

  test('a combination with no entries shows the empty plate and a way back', async ({ page }) => {
    const zero = zeroCombination();
    expect(zero).not.toBeNull();
    const { project, status } = zero!;
    await page.goto(`/roadmap?project=${project}&status=${status}`);
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'No entries on this route yet' })).toBeVisible();
    await expect(statusLine(page)).toHaveText(`Showing 0 of ${total} entries`);
    await expect(
      main.getByText(
        `Nothing matches ${PROJECT_LABELS[project]} and ${STATUS_LABELS[status]}. Show every entry, or pick another filter.`
      )
    ).toBeVisible();
    await expect(page.getByRole('list', { name: 'Bands' })).toHaveCount(0);
    const back = main.getByRole('link', { name: 'Show all entries' });
    await expect(back).toHaveAttribute('href', '/roadmap');
    // Wait until React has hydrated the link, so the click is a client-side replace.
    await expect
      .poll(
        () => back.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))),
        { timeout: 15000 }
      )
      .toBe(true);
    await back.click();
    await expect(page).toHaveURL(/\/roadmap$/);
    await expect(statusLine(page)).toHaveText(`Showing ${total} entries`);
  });

  for (const query of ['project=other', 'project=cli', 'status=Planned']) {
    test(`an unknown value (?${query}) means All and is never echoed`, async ({ page }) => {
      await page.goto(`/roadmap?${query}`);
      await expect(statusLine(page)).toHaveText(`Showing ${total} entries`);
      const value = query.split('=')[1];
      await expect(page.getByRole('main')).not.toContainText(`matches ${value}`);
    });
  }
});
