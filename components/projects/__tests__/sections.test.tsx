/**
 * The case-study section renderers (ENG-02, D-25, D-30; 11-UI-SPEC "Problem",
 * "Pipeline", "Safety — box" and "Privacy — coin-flip", edge cases E6-E8).
 * Fixtures follow the 11-07 schema types, so the omit and partial rules are
 * covered independently of today's data; the real data is read only where
 * the contract is about it (no fairness wording under Privacy).
 * Assertions use roles, names, ids, order and text, never colour classes.
 */
import { render, screen, within } from '@testing-library/react';
import Problem from '../sections/Problem';
import Privacy from '../sections/Privacy';
import { projects } from '@/data/projects';
import type { Project } from '@/data/types';

type CoinFlip = Extract<Project, { slug: 'coin-flip' }>;
type PrivacyBlock = NonNullable<CoinFlip['privacy']>;

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
