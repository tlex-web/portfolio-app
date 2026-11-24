import { test, expect, type Page } from '@playwright/test';
import bev from '@/data/terrain/plates/saalfelden/source.json';
import { GLO90_LIABILITY, GLO90_NOTICE } from '@/data/schemas/overview';
import { site } from '@/data/site';
import { SOURCE_IDS } from '@/data/source-credits';

/**
 * The data sources page in a browser (REGION-06; 18 D-20; 18-UI-SPEC Contract
 * 7 "/sources page"). A hard load answers 200 inside the site shell with the
 * h1 "Data sources" and no current nav item (the page is not under /photos).
 * Each source's section sits at its stable anchor; its Credit prints the data
 * source's own string, compared by exact textContent so one changed code point
 * fails; its licence link opens a new tab with rel="noopener noreferrer"
 * (T-18-05). The path is literal, so the URL contract is checked independently
 * of SOURCES_PAGE.
 *
 * The sections render in SOURCE_IDS order, one each; the expected credits come
 * from the data files (site.ts, the Saalfelden plate's source.json, the GLO-90
 * constants), never from data/sources.ts, so the page is checked against its
 * sources. /sources#bev-als-dtm lands its h2 below the fixed nav, and at
 * 375 px nothing widens the page (verbatim credits and URLs wrap anywhere).
 */

/*
 * Tests in this file run in order in one worker, each retried on its own, as
 * photos-region.spec.ts does (12-22, D-26): a cold dev server compiles the
 * page on its first visit.
 */
test.describe.configure({ mode: 'default' });

const primaryNav = (page: Page) => page.getByRole('navigation', { name: 'Primary' });

/** The exact text of each Credit paragraph in one section. */
async function creditTexts(page: Page, id: string): Promise<string[]> {
  return page
    .locator(`section#${id} dd[data-field="credit"] p`)
    .evaluateAll((ps) => ps.map((p) => p.textContent ?? ''));
}

test.describe('/sources (REGION-06, D-20)', () => {
  test('a hard load answers 200 with the h1, inside the shell, with no current nav item', async ({
    page,
  }) => {
    const response = await page.goto('/sources');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Data sources');
    await expect(primaryNav(page)).toHaveCount(1);
    await expect(primaryNav(page).locator('[aria-current]')).toHaveCount(0);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
  });

  test('the swissALTIRegio section prints site.attribution.terrain exactly', async ({ page }) => {
    await page.goto('/sources');

    const section = page.locator('section#swissaltiregio');
    await expect(section).toHaveCount(1);
    await expect(section.getByRole('heading', { level: 2 })).toHaveText('swissALTIRegio');
    expect(await creditTexts(page, 'swissaltiregio')).toEqual([site.attribution.terrain]);
  });

  test('lists one section per source in SOURCE_IDS order, each credit exactly its data', async ({
    page,
  }) => {
    await page.goto('/sources');

    const ids = await page
      .locator('main section[id]')
      .evaluateAll((sections) => sections.map((s) => s.id));
    expect(ids).toEqual([...SOURCE_IDS]);

    expect(await creditTexts(page, 'swissaltiregio')).toEqual([site.attribution.terrain]);
    expect(await creditTexts(page, 'bev-als-dtm')).toEqual([bev.credit]);
    expect(await creditTexts(page, 'copernicus-glo-90')).toEqual([GLO90_NOTICE, GLO90_LIABILITY]);

    for (const id of SOURCE_IDS) {
      const labels = await page.locator(`section#${id} dt`).allTextContents();
      expect(labels, id).toEqual(['Credit', 'Licence', 'Changes', 'Used on']);
    }
  });

  test("states that BEV's edition is the date BEV created the dataset, not a survey date", async ({
    page,
  }) => {
    await page.goto('/sources');

    await expect(page.locator('section#bev-als-dtm dd[data-field="changes"]')).toContainText(
      'Edition 15 September 2025, the date BEV created the dataset, not a survey date.'
    );
  });

  test('/sources#bev-als-dtm brings its h2 into view below the fixed nav', async ({ page }) => {
    await page.goto('/sources#bev-als-dtm');

    const heading = page.locator('section#bev-als-dtm h2');
    await expect(heading).toBeInViewport();
    const navBottom = await page
      .getByRole('banner')
      .evaluate((el) => el.getBoundingClientRect().bottom);
    const top = await heading.evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(navBottom);
    const viewport = page.viewportSize();
    expect(top).toBeLessThan((viewport?.height ?? 0) / 2);
  });

  test('at 375 px nothing widens the page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/sources');

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('every licence link opens a new tab with rel noopener noreferrer and says so', async ({
    page,
  }) => {
    await page.goto('/sources');

    const links = page.locator('dd[data-field="licence"] a');
    expect(await links.count()).toBeGreaterThan(0);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(link).toHaveAttribute('href', /^https:\/\//);
      expect(await link.locator('.sr-only').textContent()).toBe(' (opens in a new tab)');
    }
  });
});
