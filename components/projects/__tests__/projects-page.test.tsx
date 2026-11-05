/**
 * /projects (ENG-01; 11-UI-SPEC "/projects (ENG-01)"). The page is a Server
 * Component; it renders synchronously here with `@/data/projects` mocked, so
 * the empty state, the data order, the count kicker, the intro and the
 * per-project links are checked without the real project data.
 */
import { render, screen, within } from '@testing-library/react';

let mockProjects: Array<Record<string, unknown>> = [];
let mockIntro: string | undefined;

jest.mock('@/data/projects', () => ({
  get projects() {
    return mockProjects;
  },
  get projectsIntro() {
    return mockIntro;
  },
}));

import ProjectsPage, { metadata } from '@/app/(site)/projects/page';

const fixtures = [
  {
    slug: 'box',
    name: 'Route One',
    kicker: { version: 'v2.0', status: 'shipped' },
    pitch: 'The first route.',
    links: { github: 'https://github.com/tlex-web/box' },
  },
  {
    slug: 'coin-flip',
    name: 'Route Two',
    kicker: { version: 'v1', status: 'on device' },
    pitch: 'The second route.',
    repository: 'private',
  },
];

describe('/projects page', () => {
  afterEach(() => {
    mockProjects = [];
    mockIntro = undefined;
  });

  it('exports the Engineering document title', () => {
    expect(metadata.title).toBe('Engineering');
  });

  it('renders the empty state with a link to the roadmap when there are no projects', () => {
    mockProjects = [];
    render(<ProjectsPage />);

    expect(
      screen.getByText((_, el) =>
        el?.tagName === 'P' &&
        el.textContent === 'No routes surveyed yet. The roadmap shows what is being built.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'roadmap' })).toHaveAttribute('href', '/roadmap');
    expect(screen.queryByRole('list', { name: 'Routes' })).not.toBeInTheDocument();
  });

  it('renders the h1, the route count kicker and one article per project in data order', () => {
    mockProjects = fixtures;
    render(<ProjectsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Engineering' })).toBeInTheDocument();
    expect(screen.getByText('2 routes')).toBeInTheDocument();

    const list = screen.getByRole('list', { name: 'Routes' });
    const articles = within(list).getAllByRole('article');
    expect(articles).toHaveLength(2);
    fixtures.forEach((project, i) => {
      const link = within(articles[i]).getByRole('link', { name: project.name });
      expect(link).toHaveAttribute('href', `/projects/${project.slug}`);
    });
  });

  it("passes box's GitHub link and coin-flip's private note, never a coin-flip link (D-12)", () => {
    mockProjects = fixtures;
    render(<ProjectsPage />);

    const articles = within(screen.getByRole('list', { name: 'Routes' })).getAllByRole('article');
    expect(within(articles[0]).getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/tlex-web/box'
    );
    expect(within(articles[1]).getByText('Source: private repository')).toBeInTheDocument();
    expect(within(articles[1]).queryByRole('link', { name: 'GitHub' })).not.toBeInTheDocument();
    expect(within(articles[0]).getByText('v2.0')).toBeInTheDocument();
    expect(within(articles[0]).getByText('shipped')).toBeInTheDocument();
    expect(within(articles[1]).getByText('on device')).toBeInTheDocument();
    expect(within(articles[1]).getByText('The second route.')).toBeInTheDocument();
  });

  it('shows the approved intro under the h1, and no paragraph without one (D-16)', () => {
    mockProjects = fixtures;
    mockIntro = 'Two routes to walk.';
    const { unmount } = render(<ProjectsPage />);
    const h1 = screen.getByRole('heading', { level: 1, name: 'Engineering' });
    expect(h1.nextElementSibling).toHaveTextContent('Two routes to walk.');
    unmount();

    mockIntro = undefined;
    render(<ProjectsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Engineering' }).nextElementSibling).toBeNull();
  });
});
