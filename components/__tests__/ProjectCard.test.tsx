import { render, screen } from '@testing-library/react';
import ProjectCard from '../ProjectCard';
import { Project } from '@/data/types';

const mockProject: Project = {
  slug: 'test-project',
  name: 'Test Project',
  tagline: 'A test project tagline',
  shortDescription: 'This is a short description of the test project.',
  longDescription: 'Full description',
  techStack: ['TypeScript', 'React', 'Next.js'],
  links: {
    github: 'https://github.com/test/project',
    demo: 'https://demo.example.com',
  },
  status: 'active',
  featured: true,
};

describe('ProjectCard', () => {
  it('renders project information correctly', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project tagline')).toBeInTheDocument();
    expect(screen.getByText('This is a short description of the test project.')).toBeInTheDocument();
  });

  it('displays tech stack badges', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
  });

  it('displays status badge with correct text', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders beta status correctly', () => {
    const betaProject = { ...mockProject, status: 'beta' as const };
    render(<ProjectCard project={betaProject} />);

    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders link indicators when links are present', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('View Project')).toBeInTheDocument();
  });

  it('does not render link indicators when links are absent', () => {
    const projectWithoutLinks = { ...mockProject, links: {} };
    render(<ProjectCard project={projectWithoutLinks} />);

    expect(screen.queryByText('View Project')).not.toBeInTheDocument();
  });

  it('has correct href for project detail page', () => {
    render(<ProjectCard project={mockProject} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/projects/test-project');
  });

  it('has accessible label', () => {
    render(<ProjectCard project={mockProject} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', 'View details for Test Project');
  });
});

