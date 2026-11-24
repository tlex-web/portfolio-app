import { test, expect, type Page } from '@playwright/test';
import { site } from '@/data/site';

/**
 * The data sources page in a browser (REGION-06; 18 D-20; 18-UI-SPEC Contract
 * 7 "/sources page"). A hard load answers 200 inside the site shell with the
 * h1 "Data sources" and no current nav item (the page is not under /photos).
 * Each source's section sits at its stable anchor; its Credit prints the data
 * source's own string, compared by exact textContent so one changed code point
 * fails; its licence link opens a new tab with rel="noopener noreferrer"
 * (T-18-05). The path is literal, so the URL contract is checked independently
 * of SOURCES_PAGE.
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
