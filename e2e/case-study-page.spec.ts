import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { projects } from '@/data/projects';

/**
 * The case-study page as a whole (ENG-02 structure and navigation, ENG-05;
 * 11-UI-SPEC "Page structure", "Route index", "End block", E5, E13 and the
 * guardrails "No filler", "375 overflow" and "Landmarks").
 *
 * For each project from the data: the 'Route stages' index lists exactly the
 * rendered h2s in order with 01…0n numbers; it follows the reader (hash on
 * load, then scrolling to the end); below 1024 px it is a closed disclosure;
 * the page has one 'Primary' and one 'Route stages' navigation; the end block
 * points to the other project and asks for a walkthrough (§I #6 default);
 * the trailhead figure shows from 1024 px only; main carries no filler text
 * outside pre blocks and the terminal; axe (wcag2a, wcag2aa) finds nothing;
 * and nothing scrolls sideways at 375 px.
 *
 * Reduced motion keeps the terminal static and the anchor jumps instant.
 * Assertions use roles, names, hrefs, aria-current and text, never classes.
 */
test.use({ reducedMotion: 'reduce' });

const WIDE = { width: 1440, height: 900 };
const NARROW = { width: 375, height: 800 };

/** UI-SPEC "No filler": none of these may appear in a case study's own text. */
const FILLER: readonly [string, RegExp][] = [
  ['—', /—/],
  ['N/A', /N\/A/],
  ['TBD', /\bTBD\b/],
  ['undefined', /\bundefined\b/],
  ['null', /\bnull\b/],
  ['NaN', /\bNaN\b/],
  ['coming soon', /coming soon/i],
];

function routeStages(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Route stages', exact: true });
}

/** The visible index links as { href, number, label }, in DOM order. */
async function indexLinks(page: Page) {
  const links = routeStages(page).getByRole('link');
  return links.evaluateAll((els) =>
    els.map((a) => {
      const number = a.querySelector('[aria-hidden="true"]')?.textContent ?? '';
      return {
        href: a.getAttribute('href') ?? '',
        number,
        label: (a.textContent ?? '').slice(number.length).trim(),
      };
    })
  );
}

/** The section headings the page rendered, in order. */
async function sectionHeadings(page: Page): Promise<string[]> {
  return page.locator('article section[id] > h2').allTextContents();
}

for (const project of projects) {
  const path = `/projects/${project.slug}`;
  const other = projects.find((p) => p.slug !== project.slug);

  test.describe(`case-study page ${path}`, () => {
    test('the route index lists the rendered sections in order, numbered 01…0n (E5)', async ({
      page,
    }) => {
      await page.setViewportSize(WIDE);
      await page.goto(path);

      const headings = await sectionHeadings(page);
      expect(headings.length).toBeGreaterThanOrEqual(2);
      const links = await indexLinks(page);
      expect(links.map((l) => l.label)).toEqual(headings);
      expect(links.map((l) => l.number)).toEqual(
        headings.map((_, i) => String(i + 1).padStart(2, '0'))
      );
      for (const { href } of links) {
        await expect(page.locator(`section${href}`)).toHaveCount(1);
      }
    });

    test('the index marks the hash section current on load and follows a scroll to the end', async ({
      page,
    }) => {
      await page.setViewportSize(WIDE);
      await page.goto(path);
      const links = await indexLinks(page);
      const second = links[1];
      const last = links[links.length - 1];

      await page.goto(`${path}${second.href}`);
      const nav = routeStages(page);
      await expect(nav.getByRole('link', { name: second.label, exact: true })).toHaveAttribute(
        'aria-current',
        'location'
      );
      await expect(nav.locator(':scope > ol [aria-current]')).toHaveCount(1);

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect(nav.getByRole('link', { name: last.label, exact: true })).toHaveAttribute(
        'aria-current',
        'location'
      );
      await expect(nav.locator(':scope > ol [aria-current]')).toHaveCount(1);
    });

    test('below 1024 px the index is a closed Route stages disclosure, not a sticky list', async ({
      page,
    }) => {
      await page.setViewportSize(NARROW);
      await page.goto(path);

      const nav = routeStages(page);
      const details = nav.locator('details');
      await expect(details).toHaveCount(1);
      await expect(details).not.toHaveAttribute('open', /.*/);
      await expect(details.locator('summary')).toHaveText('Route stages');
      await expect(nav.locator(':scope > ol')).toBeHidden();
      await expect(nav.getByRole('link')).toHaveCount(0);

      await details.locator('summary').click();
      const links = await indexLinks(page);
      expect(links.map((l) => l.label)).toEqual(await sectionHeadings(page));
    });

    test("the page has exactly one 'Primary' and one 'Route stages' navigation", async ({
      page,
    }) => {
      for (const size of [WIDE, NARROW]) {
        await page.setViewportSize(size);
        await page.goto(path);
        await expect(page.getByRole('navigation', { name: 'Primary', exact: true })).toHaveCount(1);
        await expect(routeStages(page)).toHaveCount(1);
      }
    });

    test('the end block signs the next route and asks for a walkthrough (E13, default.6)', async ({
      page,
    }) => {
      if (!other) throw new Error(`no project after ${project.slug}`);
      await page.setViewportSize(WIDE);
      await page.goto(path);

      const sign = page.getByRole('link', { name: `${other.name}, next route`, exact: true });
      await expect(sign).toHaveCount(1);
      await expect(sign).toHaveAttribute('href', `/projects/${other.slug}`);
      // coin-flip's trailhead also links 'Ask for a walkthrough' in its
      // private-repo note (D-12, §I #5): same words, same destination.
      const asks = page.getByRole('link', { name: 'Ask for a walkthrough', exact: true });
      for (const ask of await asks.all()) await expect(ask).toHaveAttribute('href', '/contact');
      const cta = asks.last();
      // The end block (sign and primary) follows the last section.
      const lastSection = page.locator('article section[id]').last();
      const [sectionBox, signBox, ctaBox] = await Promise.all([
        lastSection.boundingBox(),
        sign.boundingBox(),
        cta.boundingBox(),
      ]);
      if (!sectionBox || !signBox || !ctaBox) throw new Error('no layout box');
      expect(signBox.y).toBeGreaterThan(sectionBox.y + sectionBox.height);
      expect(ctaBox.y).toBeGreaterThan(sectionBox.y + sectionBox.height);
    });

    test('the trailhead figure shows at 1440 px and not at 375 px (11-12)', async ({ page }) => {
      await page.setViewportSize(WIDE);
      await page.goto(path);
      const figure = page
        .getByRole('article', { name: project.name, exact: true })
        .locator('header')
        .getByRole('figure');
      await expect(figure).toBeVisible();

      await page.setViewportSize(NARROW);
      await expect(figure).toBeHidden();
    });

    test('main holds no filler text outside pre blocks and the terminal (Pitfall 10)', async ({
      page,
    }) => {
      await page.setViewportSize(WIDE);
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const terminal = page.getByRole('region', { name: `${project.name} demo`, exact: true });
      if ((await terminal.count()) > 0) {
        await terminal.evaluate((el) => el.setAttribute('data-filler-skip', ''));
      }
      const text = await page.locator('main').evaluate((main) => {
        const copy = main.cloneNode(true) as HTMLElement;
        copy.querySelectorAll('pre, [data-filler-skip]').forEach((el) => el.remove());
        return copy.textContent ?? '';
      });
      expect(text.length).toBeGreaterThan(200);
      for (const [token, pattern] of FILLER) {
        expect(pattern.test(text), `'${token}' in ${path}`).toBe(false);
      }
    });

    test('axe finds no wcag2a or wcag2aa violations', async ({ page }) => {
      await page.setViewportSize(WIDE);
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)
      ).toEqual([]);
    });

    test('nothing scrolls sideways at 375 px', async ({ page }) => {
      await page.setViewportSize(NARROW);
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  });
}
