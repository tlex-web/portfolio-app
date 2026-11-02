import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { roadmapItems, surveyedAt } from '@/data/roadmap';
import { formatLogDate } from '@/lib/log-date';
import {
  BAND_LABELS,
  PROJECTS,
  PROJECT_LABELS,
  STATUSES,
  STATUS_LABELS,
  countsFor,
  routeLogHref,
  routeLogView,
  type LogFilter,
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
 *
 * The filters (ROUTE-02, 10 D-14; 11-UI-SPEC "RouteLogFilters") are the
 * RouteLogFilters island: Project and Status toggle groups whose presses flip
 * aria-pressed at once and replace the URL, so they add no history entry.
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

  test('the v2.0 phase disclosure starts closed and shows the in-progress phase from the data (D-18)', async ({
    page,
  }) => {
    await page.goto('/roadmap');
    const v2 = roadmapItems.find((i) => i.status === 'in-progress' && i.phases);
    expect(v2).toBeDefined();
    // Read from the data, so a phase completing (12-01 log.phase11) moves the check with it.
    const current = v2!.phases!.find((p) => p.status === 'in-progress');
    expect(current).toBeDefined();
    const details = page.locator(`li[id="${v2!.id}"] details`);
    await expect(details).not.toHaveAttribute('open', /.*/);
    const row = details.locator('li').filter({ hasText: `Phase ${current!.n}` });
    await expect(row).toBeHidden();
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
    await expect(row).toBeVisible();
    await expect(row).toContainText(STATUS_LABELS['in-progress']);
    // A completed phase shows its date instead of a status word.
    const done = v2!.phases!.filter((p) => p.status === 'completed' && p.completedAt);
    const last = done[done.length - 1];
    await expect(details.locator('li').filter({ hasText: `Phase ${last.n}` })).toContainText(
      formatLogDate(last.completedAt!)
    );
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

/** A segment of the 'Project' or 'Status' group, by its label ('box 2 entries'). */
function segment(page: Page, group: 'Project' | 'Status', label: string): Locator {
  return page
    .getByRole('group', { name: group })
    .getByRole('button', { name: new RegExp(`^${label} \\d+ entries$`) });
}

function projectLabel(p: LogFilter['project']): string {
  return p === 'all' ? 'All' : PROJECT_LABELS[p];
}

function statusLabel(s: LogFilter['status']): string {
  return s === 'all' ? 'All' : STATUS_LABELS[s];
}

/** Wait until React has hydrated the island, so a press is handled client-side. */
async function hydrated(page: Page) {
  const first = segment(page, 'Project', 'All');
  await expect
    .poll(() => first.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))), {
      timeout: 15000,
    })
    .toBe(true);
}

/** The URL path plus query, for comparing against routeLogHref. */
function pathAndQuery(page: Page): string {
  const url = new URL(page.url());
  return `${url.pathname}${url.search}`;
}

/** The project the round-trip tests press (the plan's 'box'); it must hold some entries. */
const FILTER_PROJECT: LogProject = 'box';

/** Under {project, all}: the first status with entries (Planned if it has any) and the first without. */
function statusesUnder(project: LogProject): { enabled: LogStatus; zero: LogStatus | undefined } {
  const counts = countsFor(roadmapItems, { project, status: 'all' });
  const enabled =
    counts.status.planned > 0 ? 'planned' : STATUSES.find((s) => counts.status[s] > 0)!;
  return { enabled, zero: STATUSES.find((s) => counts.status[s] === 0) };
}

test.describe('/roadmap filters (ROUTE-02)', () => {
  test('two toggle groups carry every segment with its count, and All is pressed', async ({
    page,
  }) => {
    await page.goto('/roadmap');
    const counts = countsFor(roadmapItems, { project: 'all', status: 'all' });
    const projects = page.getByRole('group', { name: 'Project' }).getByRole('button');
    const statuses = page.getByRole('group', { name: 'Status' }).getByRole('button');
    await expect(projects).toHaveCount(PROJECTS.length + 1);
    await expect(statuses).toHaveCount(STATUSES.length + 1);
    for (const [i, p] of (['all', ...PROJECTS] as const).entries()) {
      await expect(projects.nth(i)).toHaveAccessibleName(
        `${projectLabel(p)} ${counts.project[p]} entries`
      );
      await expect(projects.nth(i)).toHaveAttribute('aria-pressed', p === 'all' ? 'true' : 'false');
    }
    for (const [i, s] of (['all', ...STATUSES] as const).entries()) {
      await expect(statuses.nth(i)).toHaveAccessibleName(
        `${statusLabel(s)} ${counts.status[s]} entries`
      );
      await expect(statuses.nth(i)).toHaveAttribute('aria-pressed', s === 'all' ? 'true' : 'false');
    }
  });

  test('pressing a project then a status replaces the URL, presses at once and recounts', async ({
    page,
  }) => {
    expect(
      routeLogView(roadmapItems, { project: FILTER_PROJECT, status: 'all' }).shown
    ).toBeGreaterThan(0);
    await page.goto('/roadmap');
    await hydrated(page);
    const status = statusLine(page);
    await status.evaluate((el) => {
      (el as HTMLElement & { __mounted?: boolean }).__mounted = true;
    });

    const project = segment(page, 'Project', PROJECT_LABELS[FILTER_PROJECT]);
    await project.click();
    await expect(project).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(new RegExp(`\\?project=${FILTER_PROJECT}$`));
    const byProject = routeLogView(roadmapItems, { project: FILTER_PROJECT, status: 'all' });
    await expect(status).toHaveText(`Showing ${byProject.shown} of ${total} entries`);

    const { enabled } = statusesUnder(FILTER_PROJECT);
    const next: LogFilter = { project: FILTER_PROJECT, status: enabled };
    const statusSegment = segment(page, 'Status', STATUS_LABELS[enabled]);
    await expect(statusSegment).not.toHaveAttribute('aria-disabled', 'true');
    await statusSegment.click();
    await expect(statusSegment).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => pathAndQuery(page)).toBe(routeLogHref(next));
    const both = routeLogView(roadmapItems, next);
    await expect(status).toHaveText(`Showing ${both.shown} of ${total} entries`);

    // The status line stayed mounted, so the new count is announced as one phrase.
    expect(
      await status.evaluate((el) => (el as HTMLElement & { __mounted?: boolean }).__mounted)
    ).toBe(true);
  });

  test('Back leaves /roadmap instead of undoing a filter (no history entries)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.goto('/roadmap');
    await hydrated(page);
    await segment(page, 'Project', PROJECT_LABELS[FILTER_PROJECT]).click();
    await expect(page).toHaveURL(new RegExp(`\\?project=${FILTER_PROJECT}$`));
    const { enabled } = statusesUnder(FILTER_PROJECT);
    await segment(page, 'Status', STATUS_LABELS[enabled]).click();
    await expect
      .poll(() => pathAndQuery(page))
      .toBe(routeLogHref({ project: FILTER_PROJECT, status: enabled }));
    await page.goBack();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/');
  });

  test('a zero-count segment is aria-disabled, focusable and does nothing', async ({ page }) => {
    const { zero } = statusesUnder(FILTER_PROJECT);
    expect(zero).toBeDefined();
    await page.goto(`/roadmap?project=${FILTER_PROJECT}`);
    await hydrated(page);
    const dead = segment(page, 'Status', STATUS_LABELS[zero!]);
    await expect(dead).toHaveAttribute('aria-disabled', 'true');
    await expect(dead).toHaveAccessibleName(`${STATUS_LABELS[zero!]} 0 entries`);
    await dead.focus();
    await expect(dead).toBeFocused();
    await page.keyboard.press('Enter');
    await dead.click({ force: true });
    // An accepted press would flip aria-pressed at once; a disabled one never does.
    await expect(dead).toHaveAttribute('aria-pressed', 'false');
    expect(pathAndQuery(page)).toBe(`/roadmap?project=${FILTER_PROJECT}`);
    const byProject = routeLogView(roadmapItems, { project: FILTER_PROJECT, status: 'all' });
    await expect(statusLine(page)).toHaveText(`Showing ${byProject.shown} of ${total} entries`);
  });

  test('a typed zero combination keeps both pressed segments enabled and shows the plate', async ({
    page,
  }) => {
    const zero = zeroCombination();
    expect(zero).not.toBeNull();
    const { project, status } = zero!;
    await page.goto(`/roadmap?project=${project}&status=${status}`);
    for (const pressed of [
      segment(page, 'Project', PROJECT_LABELS[project]),
      segment(page, 'Status', STATUS_LABELS[status]),
    ]) {
      await expect(pressed).toHaveAttribute('aria-pressed', 'true');
      await expect(pressed).not.toHaveAttribute('aria-disabled', 'true');
    }
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'No entries on this route yet' })
    ).toBeVisible();
  });

  for (const query of ['project=cli', 'project=webshop&status=other']) {
    test(`retired values (?${query}) press All in both groups`, async ({ page }) => {
      await page.goto(`/roadmap?${query}`);
      await expect(segment(page, 'Project', 'All')).toHaveAttribute('aria-pressed', 'true');
      await expect(segment(page, 'Status', 'All')).toHaveAttribute('aria-pressed', 'true');
      await expect(statusLine(page)).toHaveText(`Showing ${total} entries`);
    });
  }

  test('a row anchor still resolves with a filter set', async ({ page }) => {
    const row = roadmapItems.find((i) => i.area === 'coin-flip' && i.status === 'planned');
    expect(row).toBeDefined();
    await page.goto(`/roadmap?project=${row!.area}#${row!.id}`);
    const li = page.locator(`li[id="${row!.id}"]`);
    await expect(li).toContainText(row!.title);
    expect(await li.evaluate((el) => el.matches(':target'))).toBe(true);
  });

  test('@375: each track is two columns and nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/roadmap');
    for (const name of ['Project', 'Status'] as const) {
      const xs = await page
        .getByRole('group', { name })
        .getByRole('button')
        .evaluateAll((buttons) => buttons.map((b) => Math.round(b.getBoundingClientRect().left)));
      expect(new Set(xs).size).toBe(2);
    }
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('@1280: each track is one row and the groups sit side by side', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/roadmap');
    const tops: number[] = [];
    for (const name of ['Project', 'Status'] as const) {
      const group = page.getByRole('group', { name });
      const ys = await group
        .getByRole('button')
        .evaluateAll((buttons) => buttons.map((b) => Math.round(b.getBoundingClientRect().top)));
      expect(new Set(ys).size).toBe(1);
      tops.push(Math.round((await group.boundingBox())!.y));
    }
    expect(tops[0]).toBe(tops[1]);
  });

  for (const url of ['/roadmap', '/roadmap?project=coin-flip&status=planned']) {
    test(`axe finds no WCAG A or AA violations on ${url}`, async ({ page }) => {
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
});
