/**
 * RoutePanel (ENG-01, D-12; 11-UI-SPEC "Route panels"). The successor of
 * the v1 ProjectCard tests: the hexagon card's name, link, status and
 * links checks move to the full-width panel's kicker, block-link title,
 * pitch and links row. Assertions use roles, names, hrefs and text only.
 */
import { render, screen, within } from '@testing-library/react';
import RoutePanel from '../RoutePanel';

const base = {
  slug: 'box',
  name: 'box',
  kicker: { version: 'v2.0', status: 'shipped' },
  pitch: 'A command-line tool that sandboxes what it runs.',
};

describe('RoutePanel', () => {
  it('renders the kicker as two separate units joined by a hidden separator', () => {
    render(<RoutePanel {...base} />);

    expect(screen.getByText('v2.0')).toBeInTheDocument();
    expect(screen.getByText('shipped')).toBeInTheDocument();
    expect(screen.getByText('v2.0')).not.toBe(screen.getByText('shipped'));
    expect(screen.getByText('·')).toHaveAttribute('aria-hidden', 'true');
  });

  it('drops a missing kicker unit together with its separator', () => {
    render(<RoutePanel {...base} kicker={{ version: 'v2.0' }} />);

    expect(screen.getByText('v2.0')).toBeInTheDocument();
    expect(screen.queryByText('·')).not.toBeInTheDocument();
    expect(screen.queryByText('shipped')).not.toBeInTheDocument();
  });

  it('renders no kicker when both units are missing', () => {
    render(<RoutePanel {...base} kicker={{}} />);

    expect(screen.queryByText('·')).not.toBeInTheDocument();
    expect(screen.queryByText('v2.0')).not.toBeInTheDocument();
  });

  it('renders the panel as an article whose h2 holds exactly one link to the case study', () => {
    render(<RoutePanel {...base} />);

    const article = screen.getByRole('article');
    const heading = within(article).getByRole('heading', { level: 2 });
    const links = within(heading).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName('box');
    expect(links[0]).toHaveAttribute('href', '/projects/box');
    expect(links[0]).toHaveAttribute('data-route-link');
  });

  it('hides the title arrow icon from assistive technology', () => {
    render(<RoutePanel {...base} />);

    const link = screen.getByRole('link', { name: 'box' });
    const icon = link.querySelector('svg');
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the pitch as one paragraph', () => {
    render(<RoutePanel {...base} />);

    const pitch = screen.getByText(base.pitch);
    expect(pitch.tagName).toBe('P');
  });

  it('leaves the pitch out when none is given, with no placeholder', () => {
    render(<RoutePanel {...base} pitch={undefined} />);

    expect(screen.queryByText(base.pitch)).not.toBeInTheDocument();
    expect(screen.queryByText(/N\/A|TBD|—/)).not.toBeInTheDocument();
  });

  it('renders a same-tab GitHub link for a public repository', () => {
    render(<RoutePanel {...base} links={{ github: 'https://github.com/tlex-web/box' }} />);

    const github = screen.getByRole('link', { name: 'GitHub' });
    expect(github).toHaveAttribute('href', 'https://github.com/tlex-web/box');
    expect(github).not.toHaveAttribute('target');
    expect(github.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders a private repository as plain text with no link', () => {
    render(<RoutePanel {...base} links={{ privateRepo: true }} />);

    expect(screen.getByText('Source: private repository')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'GitHub' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('renders no links row when neither a repository link nor a private note applies', () => {
    const { rerender } = render(<RoutePanel {...base} />);

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByText(/Source:/)).not.toBeInTheDocument();

    rerender(<RoutePanel {...base} links={{}} />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByText(/Source:/)).not.toBeInTheDocument();
  });
});
