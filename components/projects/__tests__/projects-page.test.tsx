/**
 * /projects (ENG-01; 11-UI-SPEC "/projects (ENG-01)"). The page is a Server
 * Component; it renders synchronously here with `@/data/projects` mocked, so
 * the empty state, the data order and the count kicker are checked without
 * the real project data (which changes in 11-07).
 */
import { render, screen, within } from '@testing-library/react';

let mockProjects: Array<Record<string, unknown>> = [];

jest.mock('@/data/projects', () => ({
  get projects() {
    return mockProjects;
  },
}));

import ProjectsPage, { metadata } from '@/app/(site)/projects/page';

const fixtures = [
  { slug: 'route-one', name: 'Route One', version: 'v2.0', tagline: 'The first route.' },
  { slug: 'route-two', name: 'Route Two', version: 'v1', tagline: 'The second route.' },
];

describe('/projects page', () => {
  afterEach(() => {
    mockProjects = [];
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

  it('passes no repository link from the interim data', () => {
    mockProjects = fixtures;
    render(<ProjectsPage />);

    expect(screen.queryByRole('link', { name: 'GitHub' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(fixtures.length);
  });
});
