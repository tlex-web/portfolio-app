/**
 * The Alps overview's header band and region list (REGION-01, PHOTO-06; D-01,
 * D-02; 18-UI-SPEC Contract 1, UI E2). Server components rendered from real
 * registry data; nothing is mocked. The kicker is Tim's approved wording
 * (18-03 D-20 row 1), typed literally so any drift fails.
 */
import { render, screen, within } from '@testing-library/react';
import OverviewHeader from '@/components/photos/overview/OverviewHeader';
import RegionList, { type RegionListRow } from '@/components/photos/overview/RegionList';
import { publishedViews } from '@/lib/photos/view-model';
import {
  regionCardFacts,
  regionCover,
  regionHeading,
  regionNumber,
  regionsWestToEast,
} from '@/lib/regions';

const NBSP = String.fromCharCode(0xa0);
const EN_DASH = String.fromCharCode(0x2013);

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

describe('OverviewHeader (REGION-01, 18-03 D-20 row 1)', () => {
  it("prints the approved kicker '3 regions · 11 photographs · 2016–2026' over the h1", () => {
    const { container } = render(
      <OverviewHeader regionCount={rows.length} photoYears={publishedViews.map((v) => v.years)} />
    );
    const kicker = container.querySelector('[data-overview-kicker]') as HTMLElement;
    expect(kicker.textContent).toBe(`3 regions · 11 photographs · 2016${EN_DASH}2026`);
    expect(kicker).toHaveClass('mb-2', 'font-mono', 'text-sm', 'text-ink-muted');
    expect(kicker.querySelectorAll('.whitespace-nowrap')).toHaveLength(3);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Photographs');
    expect(container.querySelector('[data-overview-header]')).toHaveClass(
      'border-b',
      'border-line',
      'pt-8',
      'pb-6'
    );
  });

  it('uses the singular for one region and one photograph, and one year once', () => {
    const { container } = render(<OverviewHeader regionCount={1} photoYears={[2021]} />);
    expect(container.querySelector('[data-overview-kicker]')?.textContent).toBe(
      '1 region · 1 photograph · 2021'
    );
  });

  it('throws for zero regions or zero photos (UI E2/empty: the build fails)', () => {
    expect(() => render(<OverviewHeader regionCount={0} photoYears={[2021]} />)).toThrow(
      RangeError
    );
    expect(() => render(<OverviewHeader regionCount={3} photoYears={[]} />)).toThrow(RangeError);
  });
});

describe('RegionList (REGION-01, D-01, D-02; UI E2)', () => {
  it("lists the three regions west to east under h2 'Regions', each row a link to its region page", () => {
    render(<RegionList rows={rows} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Regions');
    const list = screen.getByRole('list', { name: 'Regions, west to east' });
    expect(list.tagName).toBe('OL');
    const links = within(list).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('data-region-row'))).toEqual([
      'zermatt',
      'ortler',
      'saalfelden',
    ]);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/photos/regions/zermatt',
      '/photos/regions/ortler',
      '/photos/regions/saalfelden',
    ]);
    expect(links.map((a) => a.querySelector('[data-region-badge]')?.textContent)).toEqual([
      '1',
      '2',
      '3',
    ]);
  });

  it('names each row by its text: heading, count, then range · years (badge and thumbnail hidden)', () => {
    render(<RegionList rows={rows} />);
    const zermatt = document.querySelector('[data-region-row="zermatt"]') as HTMLElement;
    expect(zermatt.querySelector('[data-region-badge]')).toHaveAttribute('aria-hidden', 'true');
    expect(zermatt.querySelector('img')).toHaveAttribute('alt', '');
    expect(zermatt.querySelector('[data-region-name]')?.textContent).toBe('Zermatt, Switzerland');
    expect(zermatt.querySelector('[data-region-count]')?.textContent).toBe('7 photographs');
    expect(zermatt.querySelector('[data-region-facts]')?.textContent).toBe(
      `1,617${EN_DASH}2,928${NBSP}m · 2019${EN_DASH}2024`
    );
  });

  it('gives every thumbnail its true-ratio box, width and height, and eager low-priority loading', () => {
    render(<RegionList rows={rows} />);
    for (const row of rows) {
      const a = document.querySelector(`[data-region-row="${row.id}"]`) as HTMLElement;
      const box = a.querySelector('[data-region-thumb]') as HTMLElement;
      expect(box).toHaveClass('w-24', 'bg-surface-overlay', 'rounded-sm');
      expect(box.style.aspectRatio).toBe(`${row.cover.width} / ${row.cover.height}`);
      const img = a.querySelector('img') as HTMLImageElement;
      expect(img).toHaveAttribute('width', String(row.cover.width));
      expect(img).toHaveAttribute('height', String(row.cover.height));
      expect(img).toHaveAttribute('loading', 'eager');
      expect(img).toHaveAttribute('fetchpriority', 'low');
      expect(img).toHaveAttribute('sizes', '96px');
      expect(a.querySelectorAll('picture source')).toHaveLength(2);
    }
  });

  it('prints the ground range for an all-aerial region (UI E2/partial)', () => {
    const aerial = rows.map((r) => (r.id === 'saalfelden' ? r : null)).find(Boolean)!;
    expect(aerial.range.startsWith(`ground${NBSP}`)).toBe(true);
  });

  it('renders a one-row list for a one-region registry, and throws for none (UI E2/empty)', () => {
    render(<RegionList rows={rows.slice(0, 1)} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(() => render(<RegionList rows={[]} />)).toThrow(RangeError);
  });
});
