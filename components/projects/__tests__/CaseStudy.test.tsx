/**
 * The case-study composer (ENG-02, D-25; 11-UI-SPEC "Page structure" and
 * "Section ids and labels"). Fixtures are typed as `Project` for both slugs,
 * so the slot order, the per-project third-slot label and the omit rule are
 * covered independently of today's data. Assertions use roles, names, ids,
 * order and text only.
 */
import { render, screen } from '@testing-library/react';
import CaseStudy, { SECTION_ORDER, caseStudySections, slotMeta } from '../CaseStudy';
import { ProjectSchema } from '@/data/schemas/project';
import type { Project } from '@/data/types';

const boxBase: Project = {
  slug: 'box',
  name: 'box',
  kicker: { version: 'v2.0', status: 'shipped' },
  links: { github: 'https://github.com/tlex-web/box' },
};

const coinFlipBase: Project = {
  slug: 'coin-flip',
  name: 'coin-flip',
  kicker: { version: 'v1', status: 'on device' },
  repository: 'private',
};

const coinFlipFull: Project = {
  ...coinFlipBase,
  problem: ['A first paragraph about the problem.'],
  privacy: { intro: 'Everything stays on the device.', facts: ['No permissions.', 'No ads.'] },
};

/** The h2 texts in document order. */
function h2Texts(): string[] {
  return screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent ?? '');
}

describe('slotMeta (D-25)', () => {
  it('names the third slot Safety on box and Privacy on coin-flip, never the other way round', () => {
    expect(slotMeta('safety', boxBase)).toEqual({ id: 'safety', label: 'Safety' });
    expect(slotMeta('safety', coinFlipBase)).toEqual({ id: 'privacy', label: 'Privacy' });
  });

  it('keeps the third slot between Pipeline and Metrics on both projects', () => {
    expect(SECTION_ORDER.indexOf('safety')).toBe(SECTION_ORDER.indexOf('pipeline') + 1);
    expect(SECTION_ORDER.indexOf('metrics')).toBe(SECTION_ORDER.indexOf('safety') + 1);
  });
});

describe('caseStudySections (ENG-02)', () => {
  it('returns Problem then Privacy for coin-flip, with the privacy id and label', () => {
    const sections = caseStudySections(coinFlipFull);

    expect(sections.map((s) => s.id)).toEqual(['problem', 'privacy']);
    expect(sections.map((s) => s.label)).toEqual(['Problem', 'Privacy']);
    expect(sections.map((s) => s.label)).not.toContain('Safety');
  });

  it('leaves out a slot whose block is absent', () => {
    const sections = caseStudySections({ ...coinFlipBase, problem: ['Only a problem.'] });

    expect(sections.map((s) => s.id)).toEqual(['problem']);
  });

  it('returns no sections for a project without slot data', () => {
    expect(caseStudySections(coinFlipBase)).toEqual([]);
    expect(caseStudySections(boxBase)).toEqual([]);
  });
});

describe('CaseStudy omit rule (ENG-02)', () => {
  it('renders no Problem heading for a project without problem paragraphs', () => {
    render(<CaseStudy project={{ ...coinFlipFull, problem: undefined }} />);

    expect(screen.queryByRole('heading', { level: 2, name: 'Problem' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Privacy' })).toBeInTheDocument();
  });

  it('renders no Problem heading for an empty problem array', () => {
    render(<CaseStudy project={{ ...coinFlipFull, problem: [] }} />);

    expect(screen.queryByRole('heading', { level: 2, name: 'Problem' })).not.toBeInTheDocument();
  });

  it('renders no Privacy heading for a coin-flip project without privacy', () => {
    render(<CaseStudy project={{ ...coinFlipFull, privacy: undefined }} />);

    expect(screen.queryByRole('heading', { level: 2, name: 'Privacy' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Problem' })).toBeInTheDocument();
  });

  it('never renders N/A or coming-soon text for a missing block', () => {
    const { container } = render(<CaseStudy project={{ ...coinFlipBase, problem: ['Text.'] }} />);

    expect(container.textContent).not.toMatch(/N\/A|coming soon/i);
  });

  it('rejects a coin-flip privacy block with no facts at the schema', () => {
    const parsed = ProjectSchema.safeParse({ ...coinFlipBase, privacy: { facts: [] } });

    expect(parsed.success).toBe(false);
  });
});

describe('CaseStudy order (ENG-02)', () => {
  it('renders sections in SECTION_ORDER whatever order the fixture keys are written in', () => {
    const shuffled: Project = {
      privacy: { facts: ['No permissions.'] },
      problem: ['A problem paragraph.'],
      ...coinFlipBase,
    };
    render(<CaseStudy project={shuffled} />);

    expect(h2Texts()).toEqual(['Problem', 'Privacy']);
  });

  it('gives each section the id that follows its label', () => {
    const { container } = render(<CaseStudy project={coinFlipFull} />);

    expect(container.querySelector('section#problem')).toBeInTheDocument();
    expect(container.querySelector('section#privacy')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Problem' })).toHaveAttribute('id', 'problem');
    expect(screen.getByRole('region', { name: 'Privacy' })).toHaveAttribute('id', 'privacy');
  });
});
