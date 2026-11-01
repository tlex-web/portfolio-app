/**
 * The Metrics instrument panel (ENG-04, D-09, D-23, D-28; 11-UI-SPEC
 * "Metrics — instrument panel", edge ENG-04 adjacency, empty and ordering).
 * The column count is the G1 contract (never more columns than tiles, an
 * orphan last tile spans the rest of its row), so these tests may assert the
 * grid and span classes; everything else asserts roles, text, links and order.
 */
import { createElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import Metrics from '../sections/Metrics';
import { caseStudySections } from '../CaseStudy';
import type { Project } from '@/data/types';

type MetricsBlock = NonNullable<Project['metrics']>;
type Tile = MetricsBlock['tiles'][number];

/** `n` fixture tiles, numbered so their order is visible in the text. */
function tiles(n: number): Tile[] {
  return Array.from({ length: n }, (_, i) => ({
    key: `t${i + 1}`,
    label: `Label ${i + 1}`,
    value: String((i + 1) * 10),
    context: `Context line ${i + 1}`,
  }));
}

function renderPanel(list: Tile[]) {
  return render(<Metrics id="metrics" label="Metrics" tiles={list} />);
}

/** The panel's dl and its tile wrappers, in document order. */
function panel(): { dl: HTMLElement; cells: HTMLElement[] } {
  const region = screen.getByRole('region', { name: 'Metrics' });
  const dl = region.querySelector('dl') as HTMLElement;
  expect(dl).not.toBeNull();
  return { dl, cells: Array.from(dl.children) as HTMLElement[] };
}

/** The class tokens of an element. */
function classes(el: Element): string[] {
  return (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

describe('Metrics panel structure', () => {
  it('renders an h2 Metrics labelling a section with the metrics id, and no h3', () => {
    renderPanel(tiles(3));

    const heading = screen.getByRole('heading', { level: 2, name: 'Metrics' });
    expect(heading).toHaveAttribute('id', 'metrics-title');
    expect(screen.getByRole('region', { name: 'Metrics' })).toHaveAttribute('id', 'metrics');
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull();
  });

  it('renders each tile as a dt label, a value dd and a context dd, in data order', () => {
    renderPanel(tiles(3));
    const { cells } = panel();

    expect(cells).toHaveLength(3);
    cells.forEach((cell, i) => {
      const dt = cell.querySelector('dt');
      const dds = cell.querySelectorAll('dd');
      expect(dt).toHaveTextContent(`Label ${i + 1}`);
      expect(dds).toHaveLength(2);
      expect(dds[0]).toHaveTextContent(String((i + 1) * 10));
      expect(dds[1]).toHaveTextContent(`Context line ${i + 1}`);
    });
  });

  it('renders nothing for an empty tile list (ENG-04 empty)', () => {
    const { container } = renderPanel([]);
    expect(container).toBeEmptyDOMElement();
  });

  it('puts a Source link after the context of a tile with a sourceUrl, and none elsewhere (D-23)', () => {
    const list = tiles(2);
    list[0] = { ...list[0], sourceUrl: 'https://github.com/tlex-web/box#readme' };
    renderPanel(list);
    const { cells } = panel();

    const contextDd = cells[0].querySelectorAll('dd')[1] as HTMLElement;
    const link = within(contextDd).getByRole('link', { name: 'Source' });
    expect(link).toHaveAttribute('href', 'https://github.com/tlex-web/box#readme');
    expect(contextDd.textContent).toMatch(/^Context line 1 Source$/);
    expect(within(cells[1]).queryByRole('link')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('shows every value on the first render, with no state or effect (no count-up)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { renderToStaticMarkup } = require('react-dom/server');
    const html: string = renderToStaticMarkup(
      createElement(Metrics, { id: 'metrics', label: 'Metrics', tiles: tiles(3) })
    );

    for (const value of ['10', '20', '30']) {
      expect(html).toContain(`>${value}</dd>`);
    }
  });
});

describe('Metrics columns follow the tile count (G1)', () => {
  it('lays one tile out full width: grid-cols-1 and no sm or lg columns', () => {
    renderPanel(tiles(1));
    const { dl, cells } = panel();

    expect(classes(dl)).toContain('grid-cols-1');
    expect(classes(dl).filter((c) => /^(sm|lg):grid-cols-/.test(c))).toEqual([]);
    expect(classes(cells[0]).filter((c) => /col-span/.test(c))).toEqual([]);
  });

  it('never puts two tiles in a three-column track: sm:grid-cols-2 only', () => {
    renderPanel(tiles(2));
    const { dl, cells } = panel();

    expect(classes(dl)).toContain('sm:grid-cols-2');
    expect(classes(dl)).not.toContain('lg:grid-cols-3');
    cells.forEach((cell) => expect(classes(cell).filter((c) => /col-span/.test(c))).toEqual([]));
  });

  it('gives three tiles sm:grid-cols-2 lg:grid-cols-3 and spans the third across the sm row', () => {
    renderPanel(tiles(3));
    const { dl, cells } = panel();

    expect(classes(dl)).toEqual(expect.arrayContaining(['sm:grid-cols-2', 'lg:grid-cols-3']));
    expect(classes(cells[2])).toEqual(expect.arrayContaining(['sm:col-span-2', 'lg:col-span-1']));
    expect(classes(cells[0]).filter((c) => /col-span/.test(c))).toEqual([]);
    expect(classes(cells[1]).filter((c) => /col-span/.test(c))).toEqual([]);
  });

  it('spans the fourth of four tiles across its lg row (lg:col-span-3)', () => {
    renderPanel(tiles(4));
    const { cells } = panel();

    expect(classes(cells[3])).toContain('lg:col-span-3');
    expect(classes(cells[3]).filter((c) => /^sm:col-span/.test(c))).toEqual([]);
    cells
      .slice(0, 3)
      .forEach((cell) => expect(classes(cell).filter((c) => /col-span/.test(c))).toEqual([]));
  });

  it('spans the fifth of five tiles across the rest of both rows (sm and lg col-span-2)', () => {
    renderPanel(tiles(5));
    const { cells } = panel();

    expect(classes(cells[4])).toEqual(expect.arrayContaining(['sm:col-span-2', 'lg:col-span-2']));
    cells
      .slice(0, 4)
      .forEach((cell) => expect(classes(cell).filter((c) => /col-span/.test(c))).toEqual([]));
  });
});

describe('Metrics in the case-study slot order (ENG-02)', () => {
  const coinFlip: Project = {
    slug: 'coin-flip',
    name: 'coin-flip',
    kicker: { version: 'v1', status: 'on device' },
    repository: 'private',
    problem: ['A problem paragraph.'],
    privacy: { facts: ['No permissions.'] },
    metrics: { tiles: tiles(2) },
  };

  it('places Metrics after the third slot and before Demo', () => {
    const box: Project = {
      slug: 'box',
      name: 'box',
      kicker: { version: 'v2.0', status: 'shipped' },
      problem: ['A box problem paragraph.'],
      safety: { intro: 'Destructive commands preview first.' },
      metrics: { tiles: tiles(3) },
      demo: { commands: [{ input: 'box uuid', output: '0f8f-...' }] },
    };

    expect(caseStudySections(box).map((s) => s.id)).toEqual([
      'problem',
      'safety',
      'metrics',
      'demo',
    ]);
    expect(caseStudySections(coinFlip).map((s) => s.id)).toEqual(['problem', 'privacy', 'metrics']);
  });

  it('leaves the Metrics slot out when the project has no metrics block', () => {
    const ids = caseStudySections({ ...coinFlip, metrics: undefined }).map((s) => s.id);
    expect(ids).not.toContain('metrics');
  });
});
