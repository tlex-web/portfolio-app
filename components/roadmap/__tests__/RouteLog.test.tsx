/**
 * The route log on the elevation axis (ROUTE-01, ROUTE-03; D-18, D-19;
 * 11-UI-SPEC "RouteLog (Server) — the elevation axis"). Rewrite of the v1
 * RoadmapTimeline tests for the new contract: three bands top to bottom, rows
 * by order descending with stable ids, honest dates, no priority or figures,
 * and the v2.0 phase disclosure as a native details element.
 */
import { render, screen, within } from '@testing-library/react';
import RouteLog from '../RouteLog';
import RouteRow from '../RouteRow';
import { bands, type RouteLogItem } from '@/lib/route-log';

const V2: RouteLogItem = {
  id: 'portfolio-v2-0',
  title: 'v2.0 Topographic Identity',
  description: 'One design system around the real Matterhorn terrain.',
  area: 'portfolio',
  status: 'in-progress',
  order: 5,
  // Deliberately out of order: the disclosure lists phases rising.
  phases: [
    { n: 12, name: 'Contact, edge pages & cleanup', status: 'planned' },
    { n: 7, name: 'Foundation & guardrails', status: 'completed', completedAt: '2026-10-24' },
    { n: 9, name: 'Home ascent', status: 'completed', completedAt: '2026-10-25' },
    { n: 8, name: 'Data & terrain pipeline', status: 'completed' },
    { n: 11, name: 'Engineering & roadmap', status: 'in-progress' },
    { n: 10, name: 'Photography', status: 'completed', completedAt: '2026-10-26' },
  ],
};

/** Two planned, one in progress, four completed, across the three projects. */
const ITEMS: RouteLogItem[] = [
  {
    id: 'portfolio-v1-0',
    title: 'v1.0 Stabilization & Visual Identity',
    description: 'Dependencies, tests and the first visual identity.',
    area: 'portfolio',
    status: 'completed',
    order: 1,
  },
  {
    id: 'box-v1-0',
    title: 'v1.0 Full toolbox',
    description: 'Every tool in one binary.',
    area: 'box',
    status: 'completed',
    order: 2,
    completedAt: '2026-06-24',
  },
  {
    id: 'coin-flip-play-store',
    title: 'Play Store release',
    description: 'The public release on the Play Store.',
    area: 'coin-flip',
    status: 'planned',
    order: 7,
  },
  V2,
  {
    id: 'box-v2-0',
    title: 'v2.0 Toolbox to toolkit',
    description: 'The tools become a library.',
    area: 'box',
    status: 'completed',
    order: 3,
    completedAt: '2026-07-14',
  },
  {
    id: 'coin-flip-v1-1',
    title: 'v1.1 Smoother toss',
    description: 'A smoother toss and a camera that follows the coin.',
    area: 'coin-flip',
    status: 'planned',
    order: 6,
    targetRelease: 'v1.1',
  },
  {
    id: 'coin-flip-v1-0',
    title: 'v1.0 First release on device',
    description: 'The first build on a real phone.',
    area: 'coin-flip',
    status: 'completed',
    order: 4,
    completedAt: '2026-10-24',
  },
];

function renderLog(items: readonly RouteLogItem[] = ITEMS) {
  return render(<RouteLog bands={bands(items)} />);
}

function row(container: HTMLElement, id: string): HTMLElement {
  const li = container.querySelector<HTMLElement>(`li[id="${id}"]`);
  if (!li) throw new Error(`row ${id} not rendered`);
  return li;
}

function meta(container: HTMLElement, id: string): string {
  return row(container, id).querySelector('[data-route-meta]')?.textContent ?? '';
}

describe('RouteLog', () => {
  it('renders the bands top to bottom as Summit, Current camp and Base', () => {
    renderLog();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Summit',
      'Current camp',
      'Base',
    ]);
  });

  it('follows each band heading with its status and entry count', () => {
    const { container } = renderLog();
    const counts = Array.from(container.querySelectorAll('section')).map(
      (s) => s.querySelector('h2 + p')?.textContent
    );
    expect(counts).toEqual([
      'Planned · 2 entries',
      'In progress · 1 entry',
      'Completed · 4 entries',
    ]);
  });

  it('labels each band section by its heading and gives it a stable id', () => {
    const { container } = renderLog();
    const sections = Array.from(container.querySelectorAll('section'));
    expect(sections.map((s) => s.id)).toEqual(['summit', 'current-camp', 'base']);
    for (const s of sections) {
      const heading = s.querySelector('h2');
      expect(s).toHaveAttribute('aria-labelledby', heading?.id);
      expect(heading?.id).toBeTruthy();
    }
  });

  it('lists rows by order descending inside each band, each li carrying the item id', () => {
    const { container } = renderLog();
    const ids = Array.from(container.querySelectorAll('section')).map((s) =>
      Array.from(s.querySelectorAll(':scope > ol > li')).map((li) => li.id)
    );
    expect(ids).toEqual([
      ['coin-flip-play-store', 'coin-flip-v1-1'],
      ['portfolio-v2-0'],
      ['coin-flip-v1-0', 'box-v2-0', 'box-v1-0', 'portfolio-v1-0'],
    ]);
    expect(within(row(container, 'box-v1-0')).getByRole('heading', { level: 3 })).toHaveTextContent(
      'v1.0 Full toolbox'
    );
  });

  it('reads a completed row with a date as Completed and the log date', () => {
    const { container } = renderLog();
    expect(meta(container, 'coin-flip-v1-0')).toBe('coin-flip · Completed 24 Oct 2026');
    expect(meta(container, 'box-v1-0')).toBe('box · Completed 24 Jun 2026');
  });

  it('reads a completed row without a date as Completed with no digits', () => {
    const { container } = renderLog();
    const text = meta(container, 'portfolio-v1-0');
    expect(text).toBe('Portfolio · Completed');
    expect(text).not.toMatch(/\d/);
  });

  it('adds the target release to a planned row only when it has one', () => {
    const { container } = renderLog();
    expect(meta(container, 'coin-flip-v1-1')).toBe('coin-flip · v1.1');
    expect(meta(container, 'coin-flip-play-store')).toBe('coin-flip');
  });

  it('joins the meta units with an aria-hidden separator and keeps each unit unbroken', () => {
    const { container } = renderLog();
    const line = row(container, 'coin-flip-v1-0').querySelector('[data-route-meta]');
    const separators = Array.from(line?.querySelectorAll('[aria-hidden="true"]') ?? []);
    expect(separators.map((s) => s.textContent)).toEqual([' · ']);
    const units = Array.from(line?.querySelectorAll('.whitespace-nowrap') ?? []).map(
      (u) => u.textContent
    );
    expect(units).toEqual(['coin-flip', 'Completed 24 Oct 2026']);
  });

  it('names the projects Portfolio, box and coin-flip and shows every description', () => {
    const { container } = renderLog();
    const projects = Array.from(container.querySelectorAll('[data-route-meta]')).map(
      (m) => m.querySelector('.whitespace-nowrap')?.textContent
    );
    expect(new Set(projects)).toEqual(new Set(['Portfolio', 'box', 'coin-flip']));
    for (const item of ITEMS) expect(screen.getByText(item.description)).toBeInTheDocument();
  });

  it('shows no priority, percentage or completion figure', () => {
    const { container } = renderLog();
    expect(container.textContent).not.toMatch(/priority/i);
    expect(container.textContent).not.toContain('%');
    expect(container.querySelector('[role="progressbar"], progress')).toBeNull();
  });

  it('gives the v2.0 row a native disclosure of its phases in rising order', () => {
    const { container } = renderLog();
    const details = row(container, 'portfolio-v2-0').querySelector('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
    expect(details?.querySelector('summary')).toHaveTextContent(/^Phases 7–12$/);
    const lines = Array.from(details?.querySelectorAll('ol > li') ?? []).map(
      (li) => li.textContent
    );
    expect(lines).toEqual([
      'Phase 7 · Foundation & guardrails · 24 Oct 2026',
      'Phase 8 · Data & terrain pipeline · Completed',
      'Phase 9 · Home ascent · 25 Oct 2026',
      'Phase 10 · Photography · 26 Oct 2026',
      'Phase 11 · Engineering & roadmap · In progress',
      'Phase 12 · Contact, edge pages & cleanup · Planned',
    ]);
  });

  it('builds each phase line from unbroken units and hides the caret', () => {
    const { container } = renderLog();
    const details = row(container, 'portfolio-v2-0').querySelector('details');
    const first = details?.querySelector('ol > li');
    expect(
      Array.from(first?.querySelectorAll('.whitespace-nowrap') ?? []).map((u) => u.textContent)
    ).toEqual(['Phase 7', 'Foundation & guardrails', '24 Oct 2026']);
    expect(details?.querySelector('summary svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('gives a disclosure only to a row with phases', () => {
    const { container } = renderLog();
    expect(container.querySelectorAll('details')).toHaveLength(1);
  });

  it('omits a band with no items and renders nothing for no bands', () => {
    renderLog(ITEMS.filter((i) => i.status !== 'planned'));
    expect(screen.queryByRole('heading', { name: 'Summit' })).toBeNull();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);

    const { container } = render(<RouteLog bands={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('reads one entry in the singular', () => {
    const { container } = renderLog([V2]);
    expect(container.querySelector('#current-camp h2 + p')).toHaveTextContent(
      /^In progress · 1 entry$/
    );
  });

  it('draws the axis, the camp marker and the row ticks out of the accessibility tree', () => {
    const { container } = renderLog();
    expect(container.querySelector('[data-route-axis]')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('#current-camp [data-camp-marker]')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    for (const li of Array.from(container.querySelectorAll('section > ol > li'))) {
      const tick = li.querySelector('[data-row-tick]');
      expect(tick).toHaveAttribute('aria-hidden', 'true');
    }
  });
});

describe('RouteRow compact variant', () => {
  const ITEM = ITEMS.find((i) => i.id === 'coin-flip-v1-1') as RouteLogItem;

  it('renders one link to the filtered route log row holding the title and meta line', () => {
    render(
      <ul>
        <RouteRow item={ITEM} variant="compact" />
      </ul>
    );
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/roadmap?project=coin-flip#coin-flip-v1-1');
    expect(links[0]).toHaveTextContent('v1.1 Smoother toss');
    expect(links[0].querySelector('[data-route-meta]')).toHaveTextContent(/^Planned · v1\.1$/);
  });

  it('shows neither the description nor a disclosure', () => {
    render(
      <ul>
        <RouteRow item={V2} variant="compact" />
      </ul>
    );
    expect(screen.queryByText(V2.description)).toBeNull();
    expect(document.querySelector('details')).toBeNull();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/roadmap?project=portfolio#portfolio-v2-0'
    );
    expect(screen.getByRole('link').querySelector('[data-route-meta]')).toHaveTextContent(
      /^In progress$/
    );
  });
});
