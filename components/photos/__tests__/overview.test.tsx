/**
 * /photos after the view switch (PHOTO-06, D-27; 18-24). The successors of the
 * retired view-switcher.test.tsx and header.test.tsx: one row per former test,
 * each asserting what the overview does in that test's place (the Map · Grid ·
 * Carousel switcher and the single-sheet kicker are gone; the overview header
 * band and the region list stand there). The overview's own contract rows
 * (the approved kicker literal, singular wording, zero-region throws, row
 * text, thumbnails) live in components/photos/overview/__tests__/overview.test.tsx
 * and are not repeated here; the retired `?view=` parameter's rows moved to
 * lib/__tests__/proxy.test.ts's legacy-redirect rows (18-22).
 *
 * Server components rendered from the real registry and photo data with
 * nothing mocked: the /photos page itself (which builds the RegionList rows
 * from regionsWestToEast), RegionList and OverviewHeader.
 */
import fs from 'node:fs';
import path from 'node:path';
import { render, screen, within } from '@testing-library/react';
import PhotosPage from '@/app/(site)/photos/page';
import OverviewHeader from '@/components/photos/overview/OverviewHeader';
import RegionList, { type RegionListRow } from '@/components/photos/overview/RegionList';
import { sheet } from '@/data/sheet';
import { site } from '@/data/site';
import { regionHref } from '@/lib/photos/routes';
import { publishedViews } from '@/lib/photos/view-model';
import {
  regionCardFacts,
  regionCover,
  regionHeading,
  regionNumber,
  regionsWestToEast,
} from '@/lib/regions';

const EN_DASH = String.fromCharCode(0x2013);

/** The rows exactly as the page builds them, west to east. */
const rows: RegionListRow[] = regionsWestToEast().map((region) => {
  const facts = regionCardFacts(region.id);
  return {
    id: region.id,
    number: regionNumber(region.id),
    heading: regionHeading(region),
    count: facts.count,
    range: facts.range,
    years: facts.years,
    cover: regionCover(region.id).tile,
  };
});

function renderPage() {
  return render(<PhotosPage />);
}

function rowLinks(): HTMLElement[] {
  const list = screen.getByRole('list', { name: 'Regions, west to east' });
  return within(list).getAllByRole('link');
}

describe('/photos in place of the view switcher (successors of view-switcher.test.tsx)', () => {
  it("renders no 'View' group, radiogroup or Map, Grid or Carousel segment: the regions are one ordered list", () => {
    renderPage();
    expect(screen.queryByRole('group', { name: 'View' })).toBeNull();
    expect(screen.queryAllByRole('radiogroup')).toHaveLength(0);
    for (const name of ['Map', 'Grid', 'Carousel']) {
      expect(screen.queryByRole('button', { name })).toBeNull();
      expect(screen.queryByRole('radio', { name })).toBeNull();
    }
    expect(screen.queryByText('Grid', { exact: true })).toBeNull();
    expect(screen.queryByText('Carousel', { exact: true })).toBeNull();
    expect(screen.getByRole('list', { name: 'Regions, west to east' }).tagName).toBe('OL');
  });

  it('carries no pressed or current state: nothing on the page has aria-pressed or aria-current', () => {
    const { container } = renderPage();
    expect(container.querySelectorAll('[aria-pressed], [aria-current]')).toHaveLength(0);
  });

  it("marks a hovered or focused row with the overlay and the 2 px accent bar, the pressed segment's look", () => {
    renderPage();
    for (const link of rowLinks()) {
      expect(link).toHaveClass(
        'hover:bg-surface-overlay',
        'focus-visible:bg-surface-overlay',
        'before:w-0.5',
        'before:bg-accent',
        'before:opacity-0',
        'hover:before:opacity-100',
        'focus-visible:before:opacity-100'
      );
      expect(link.querySelector('[data-region-badge]')).toHaveClass(
        'group-hover:bg-accent',
        'group-focus-visible:bg-accent'
      );
    }
  });

  it("puts an aria-hidden 24 px badge, the region's number, before every region name (the segment icon's slot)", () => {
    renderPage();
    for (const link of rowLinks()) {
      const id = link.getAttribute('data-region-row') as string;
      const name = link.querySelector('[data-region-name]') as HTMLElement;
      const badge = name.parentElement?.firstElementChild as HTMLElement;
      expect(badge).toHaveAttribute('data-region-badge');
      expect(badge).toHaveAttribute('aria-hidden', 'true');
      expect(badge).toHaveClass('size-6', 'shrink-0', 'rounded-full');
      expect(badge.textContent).toBe(String(regionNumber(id)));
      expect(badge.nextElementSibling).toBe(name);
    }
  });

  it('holds no view state in client code: the page, OverviewHeader and RegionList are server modules that never import next/navigation', () => {
    for (const file of [
      'app/(site)/photos/page.tsx',
      'components/photos/overview/OverviewHeader.tsx',
      'components/photos/overview/RegionList.tsx',
    ]) {
      const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
      expect(source).not.toMatch(/^\s*['"]use client['"]/m);
      expect(source).not.toContain('next/navigation');
      expect(source).not.toMatch(/searchParams\s*[:}]/);
    }
  });

  it('links each row to regionHref(id) with no query or hash, and no link on the page carries a view parameter', () => {
    const { container } = renderPage();
    const links = rowLinks();
    expect(links).toHaveLength(rows.length);
    links.forEach((link, i) => {
      const href = link.getAttribute('href') as string;
      expect(href).toBe(regionHref(rows[i].id));
      expect(href).not.toMatch(/[?#]/);
    });
    for (const a of container.querySelectorAll('a[href]')) {
      expect(a.getAttribute('href')).not.toMatch(/[?&]view=/);
    }
  });

  it('renders no button at all, so nothing on /photos switches state in place', () => {
    const { container } = renderPage();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelectorAll('button, [role="button"]')).toHaveLength(0);
  });
});

describe('/photos header band in place of the Phase 10 header (successors of header.test.tsx)', () => {
  it("keeps 'Zermatt – Matterhorn' as the sheet title (footer, map margin) while the overview kicker names no single place", () => {
    const { container } = renderPage();
    expect(sheet.title).toBe(`Zermatt ${EN_DASH} Matterhorn`);
    const kicker = container.querySelector('[data-overview-kicker]') as HTMLElement;
    expect(kicker.textContent).not.toContain('Zermatt');
    expect(kicker.textContent).not.toMatch(/waypoint/);
  });

  it('derives the kicker on /photos from the registry and the published photos', () => {
    const { container } = renderPage();
    const years = publishedViews.map((v) => v.years);
    const span = `${Math.min(...years)}${EN_DASH}${Math.max(...years)}`;
    const regions = regionsWestToEast().length;
    expect(container.querySelector('[data-overview-kicker]')?.textContent).toBe(
      `${regions} regions · ${publishedViews.length} photographs · ${span}`
    );
  });

  it('takes the count and the year range from the years it is given, in any order', () => {
    const { container } = render(
      <OverviewHeader regionCount={2} photoYears={[2024, 2019, 2021, 2019]} />
    );
    expect(container.querySelector('[data-overview-kicker]')?.textContent).toBe(
      `2 regions · 4 photographs · 2019${EN_DASH}2024`
    );
  });

  it("renders one h1, the site nav label for /photos, before h2 'Map' and h2 'Regions'", () => {
    renderPage();
    const navLabel = site.nav.find((item) => item.href === '/photos')?.label;
    expect(navLabel).toBe('Photographs');
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe(navLabel);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Map',
      'Regions',
    ]);
  });

  it('is a non-sticky band whose only paragraph is the kicker, with no prose', () => {
    const { container } = renderPage();
    const band = container.querySelector('[data-overview-header]') as HTMLElement;
    expect(band.className).not.toMatch(/sticky|fixed/);
    expect(band.querySelectorAll('p')).toHaveLength(1);
    expect(band.querySelector('p')).toHaveAttribute('data-overview-kicker');
    expect(band.textContent).not.toMatch(/stunning|explore/i);
  });

  it('has no slot after the title block: the band holds the kicker and the h1, nothing else', () => {
    const { container } = render(<OverviewHeader regionCount={3} photoYears={[2016, 2026]} />);
    const band = container.querySelector('[data-overview-header]') as HTMLElement;
    expect([...band.children].map((el) => el.tagName)).toEqual(['P', 'H1']);
  });

  it("renders no empty region: every row counts at least one photograph and the rows sum to the kicker's count", () => {
    render(<RegionList rows={rows} />);
    const counts = [...document.querySelectorAll('[data-region-count]')].map((el) => {
      const m = /^(\d+) photographs?$/.exec(el.textContent ?? '');
      expect(m).not.toBeNull();
      return Number(m?.[1]);
    });
    expect(counts).toHaveLength(rows.length);
    for (const n of counts) expect(n).toBeGreaterThanOrEqual(1);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(publishedViews.length);
  });
});
