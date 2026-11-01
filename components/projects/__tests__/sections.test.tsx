/**
 * The case-study section renderers (ENG-02, D-25, D-30; 11-UI-SPEC "Problem",
 * "Pipeline", "Safety — box" and "Privacy — coin-flip", edge cases E6-E8).
 * Fixtures follow the 11-07 schema types, so the omit and partial rules are
 * covered independently of today's data; the real data is read only where
 * the contract is about it (no fairness wording under Privacy).
 * Assertions use roles, names, ids, order and text, never colour classes.
 */
import { render, screen, within } from '@testing-library/react';
import Pipeline from '../sections/Pipeline';
import Problem from '../sections/Problem';
import Privacy from '../sections/Privacy';
import Safety from '../sections/Safety';
import { projects } from '@/data/projects';
import type { Project } from '@/data/types';

type CoinFlip = Extract<Project, { slug: 'coin-flip' }>;
type PrivacyBlock = NonNullable<CoinFlip['privacy']>;
type PipelineBlock = NonNullable<Project['pipeline']>;
type SafetyBlock = NonNullable<Extract<Project, { slug: 'box' }>['safety']>;

/** Whether `b` comes after `a` in document order. */
function follows(a: Node, b: Node): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

const FAIRNESS = /fair|50\/50|draw|choreograph/i;

describe('Problem', () => {
  it('renders an h2 Problem labelling a section with the given id', () => {
    render(<Problem id="problem" label="Problem" paragraphs={['One.']} />);

    const heading = screen.getByRole('heading', { level: 2, name: 'Problem' });
    expect(heading).toHaveAttribute('id', 'problem-title');
    expect(screen.getByRole('region', { name: 'Problem' })).toHaveAttribute('id', 'problem');
  });

  it('renders one paragraph per item, in order', () => {
    const paragraphs = ['First paragraph.', 'Second paragraph.', 'Third paragraph.'];
    render(<Problem id="problem" label="Problem" paragraphs={paragraphs} />);

    const region = screen.getByRole('region', { name: 'Problem' });
    const rendered = within(region)
      .getAllByRole('paragraph')
      .map((p) => p.textContent);
    expect(rendered).toEqual(paragraphs);
  });

  it('renders nothing without paragraphs', () => {
    const { container } = render(<Problem id="problem" label="Problem" paragraphs={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders coin-flip's approved paragraph as written, honest about v1 (D-30)", () => {
    const coinFlip = projects.find((p) => p.slug === 'coin-flip');
    const paragraphs = coinFlip?.problem ?? [];
    render(<Problem id="problem" label="Problem" paragraphs={paragraphs} />);

    expect(paragraphs.length).toBeGreaterThan(0);
    for (const text of paragraphs) expect(screen.getByText(text)).toBeInTheDocument();
    expect(paragraphs.join(' ')).toMatch(/Play Store release/);
  });
});

describe('Privacy', () => {
  const block: PrivacyBlock = {
    intro: 'Everything stays on the device.',
    facts: ['No permissions.', 'Fully offline.', 'No ads, no trackers, no accounts.'],
  };

  it('renders an h2 Privacy labelling a section with the privacy id', () => {
    render(<Privacy id="privacy" label="Privacy" block={block} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Privacy' })).toHaveAttribute(
      'id',
      'privacy-title'
    );
    expect(screen.getByRole('region', { name: 'Privacy' })).toHaveAttribute('id', 'privacy');
  });

  it('renders the intro when present and one list item per fact, in order', () => {
    render(<Privacy id="privacy" label="Privacy" block={block} />);

    expect(screen.getByText(block.intro ?? '')).toBeInTheDocument();
    const items = within(screen.getByRole('list'))
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(items).toEqual(block.facts);
  });

  it('renders the facts alone without an intro', () => {
    render(<Privacy id="privacy" label="Privacy" block={{ facts: ['One fact.'] }} />);

    const region = screen.getByRole('region', { name: 'Privacy' });
    expect(within(region).queryAllByRole('paragraph')).toHaveLength(0);
    expect(within(region).getAllByRole('listitem')).toHaveLength(1);
  });

  it('renders nothing when no fact is left', () => {
    const { container } = render(<Privacy id="privacy" label="Privacy" block={{ facts: [] }} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("lists coin-flip's approved facts with no fairness wording, which belongs in Pipeline (D-25)", () => {
    const coinFlip = projects.find((p): p is CoinFlip => p.slug === 'coin-flip');
    const privacy = coinFlip?.privacy;
    if (!privacy) throw new Error('coin-flip has no approved privacy block');
    render(<Privacy id="privacy" label="Privacy" block={privacy} />);

    const items = screen.getAllByRole('listitem').map((li) => li.textContent ?? '');
    expect(items).toEqual(privacy.facts);
    for (const text of items) expect(text).not.toMatch(FAIRNESS);
  });
});

describe('Pipeline', () => {
  const four: PipelineBlock = {
    intro: 'The result is decided first.',
    in: 'a tap',
    out: 'a fair result',
    stages: [
      { name: 'Fair draw', description: 'A draw picks heads or tails.' },
      { name: 'Choreographed toss' },
      { name: 'Landing and settle', description: 'The coin comes to rest.' },
      { name: 'Haptic pulse and announcement', description: 'A short pulse.' },
    ],
  };
  const three: PipelineBlock = {
    stages: [{ name: 'Settings' }, { name: 'Command' }, { name: 'Output' }],
  };

  it('renders an h2 Pipeline labelling a section with the pipeline id', () => {
    render(<Pipeline id="pipeline" label="Pipeline" name="coin-flip" block={four} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Pipeline' })).toHaveAttribute(
      'id',
      'pipeline-title'
    );
    expect(screen.getByRole('region', { name: 'Pipeline' })).toHaveAttribute('id', 'pipeline');
  });

  it('renders an ordered list named after the project and its stage count', () => {
    render(<Pipeline id="pipeline" label="Pipeline" name="coin-flip" block={four} />);

    const list = screen.getByRole('list', { name: 'coin-flip pipeline, 4 stages' });
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('numbers each stage 01 to 04 with its name, in order', () => {
    render(<Pipeline id="pipeline" label="Pipeline" name="coin-flip" block={four} />);

    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    items.forEach((item, i) => {
      expect(within(item).getByText(String(i + 1).padStart(2, '0'))).toBeInTheDocument();
      expect(within(item).getByText(four.stages[i].name)).toBeInTheDocument();
    });
  });

  it('shows a description only for the stages that have one', () => {
    render(<Pipeline id="pipeline" label="Pipeline" name="coin-flip" block={four} />);

    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(within(items[0]).getByText('A draw picks heads or tails.')).toBeInTheDocument();
    expect(items[1].textContent).toBe('02Choreographed toss');
  });

  it('renders the intro and the In line before the list and the Out line after it', () => {
    render(<Pipeline id="pipeline" label="Pipeline" name="coin-flip" block={four} />);

    const list = screen.getByRole('list');
    expect(follows(screen.getByText(four.intro ?? ''), list)).toBe(true);
    expect(follows(screen.getByText('In: a tap'), list)).toBe(true);
    expect(follows(list, screen.getByText('Out: a fair result'))).toBe(true);
  });

  it('renders no intro, In or Out line when they are not approved', () => {
    render(<Pipeline id="pipeline" label="Pipeline" name="box" block={three} />);

    const region = screen.getByRole('region', { name: 'Pipeline' });
    expect(within(region).queryByText(/^In: /)).not.toBeInTheDocument();
    expect(within(region).queryByText(/^Out: /)).not.toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'box pipeline, 3 stages' });
    const outside = within(region)
      .queryAllByRole('paragraph')
      .filter((p) => !list.contains(p));
    expect(outside).toHaveLength(0);
  });

  // The column count is the contract (G11 literal classes), so the class
  // attribute of the list is read here and nowhere else.
  it('lays three stages out in three columns and four in four from 768 px', () => {
    const { rerender } = render(
      <Pipeline id="pipeline" label="Pipeline" name="box" block={three} />
    );
    expect(screen.getByRole('list').className.split(/\s+/)).toContain('md:grid-cols-3');

    rerender(<Pipeline id="pipeline" label="Pipeline" name="coin-flip" block={four} />);
    expect(screen.getByRole('list').className.split(/\s+/)).toContain('md:grid-cols-4');
  });

  it("holds coin-flip's approved fairness intro before its stages (D-25)", () => {
    const coinFlip = projects.find((p): p is CoinFlip => p.slug === 'coin-flip');
    const pipeline = coinFlip?.pipeline;
    if (!pipeline?.intro) throw new Error('coin-flip has no approved pipeline intro');
    render(<Pipeline id="pipeline" label="Pipeline" name="coin-flip" block={pipeline} />);

    expect(follows(screen.getByText(pipeline.intro), screen.getByRole('list'))).toBe(true);
    expect(pipeline.intro).toMatch(/50\/50 draw/);
  });
});

describe('Safety', () => {
  const full: SafetyBlock = {
    intro: 'Destructive commands preview first.',
    capture: {
      command: 'bulk-rename',
      input: "box bulk-rename ./sample '^(.*)\\.txt$' '$1.md'",
      output: ['  ~ hut.txt -> hut.md', '', 'Dry run: 1 to rename.'].join('\n'),
    },
    forceLine: 'With --force, box would rename hut.txt to hut.md.',
  };
  /** Text with runs of whitespace collapsed, as the caption is read. */
  const collapsed = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

  it('renders an h2 Safety labelling a section with the safety id', () => {
    render(<Safety id="safety" label="Safety" block={full} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Safety' })).toHaveAttribute(
      'id',
      'safety-title'
    );
    expect(screen.getByRole('region', { name: 'Safety' })).toHaveAttribute('id', 'safety');
  });

  it('renders the intro, then a figure captioned Preview run with the command', () => {
    const { container } = render(<Safety id="safety" label="Safety" block={full} />);

    const figure = screen.getByRole('figure');
    expect(collapsed(figure.querySelector('figcaption'))).toBe('Preview run · box bulk-rename');
    expect(figure).toHaveAccessibleName(/^Preview run\s+box bulk-rename$/);
    expect(follows(screen.getByText(full.intro ?? ''), figure)).toBe(true);
    expect(container.querySelectorAll('figure')).toHaveLength(1);
  });

  it('holds the prompt, the exact command line and the unedited output in the pre', () => {
    const { container } = render(<Safety id="safety" label="Safety" block={full} />);

    expect(container.querySelector('pre')?.textContent).toBe(
      `❯ ${full.capture?.input}\n${full.capture?.output}`
    );
  });

  it('renders the --force line after the figure with the flag in a code element', () => {
    render(<Safety id="safety" label="Safety" block={full} />);

    const code = screen.getByText('--force', { selector: 'code' });
    expect(code.closest('p')?.textContent).toBe(full.forceLine);
    expect(follows(screen.getByRole('figure'), code)).toBe(true);
  });

  it('keeps the preview static: no button, no tabindex', () => {
    const { container } = render(<Safety id="safety" label="Safety" block={full} />);

    expect(within(screen.getByRole('figure')).queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('pre')).not.toHaveAttribute('tabindex');
    expect(container.querySelector('[tabindex]')).toBeNull();
  });

  it('renders the intro alone without a capture: no figure, pre or code', () => {
    const { container } = render(
      <Safety id="safety" label="Safety" block={{ intro: full.intro, forceLine: full.forceLine }} />
    );

    expect(screen.getByText(full.intro ?? '')).toBeInTheDocument();
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
    expect(container.querySelector('pre')).toBeNull();
    expect(container.querySelector('code')).toBeNull();
  });

  it('renders the figure without a --force paragraph when the sentence is not approved', () => {
    render(<Safety id="safety" label="Safety" block={{ capture: full.capture }} />);

    expect(screen.getByRole('figure')).toBeInTheDocument();
    expect(screen.queryByText('--force', { selector: 'code' })).not.toBeInTheDocument();
  });

  it('renders nothing with neither an intro nor a capture', () => {
    const { container } = render(
      <Safety id="safety" label="Safety" block={{ forceLine: full.forceLine }} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
