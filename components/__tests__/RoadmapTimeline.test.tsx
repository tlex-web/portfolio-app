import { render, screen } from '@testing-library/react';
import RoadmapTimeline from '../RoadmapTimeline';
import { RoadmapItem } from '@/data/types';

describe('RoadmapTimeline', () => {
  const mockItems: RoadmapItem[] = [
    {
      id: '1',
      title: 'Add E2E Tests',
      description: 'Implement comprehensive end-to-end testing with Playwright',
      area: 'portfolio',
      status: 'in-progress',
      priority: 'high',
      targetRelease: 'v2.0',
    },
    {
      id: '2',
      title: 'Email Integration',
      description: 'Integrate Resend for feedback form emails',
      area: 'portfolio',
      status: 'planned',
      priority: 'medium',
      targetRelease: 'v2.1',
    },
    {
      id: '3',
      title: 'Template Analytics',
      description: 'Track template usage and effectiveness',
      area: 'cli',
      status: 'completed',
      targetRelease: 'v2.4.0',
    },
  ];

  it('renders all roadmap items', () => {
    render(<RoadmapTimeline items={mockItems} />);

    expect(screen.getByText('Add E2E Tests')).toBeInTheDocument();
    expect(screen.getByText('Email Integration')).toBeInTheDocument();
    expect(screen.getByText('Template Analytics')).toBeInTheDocument();
  });

  it('displays item descriptions', () => {
    render(<RoadmapTimeline items={mockItems} />);

    expect(screen.getByText(/comprehensive end-to-end testing/i)).toBeInTheDocument();
    expect(screen.getByText(/Integrate Resend/i)).toBeInTheDocument();
    expect(screen.getByText(/Track template usage/i)).toBeInTheDocument();
  });

  it('shows status badges correctly', () => {
    render(<RoadmapTimeline items={mockItems} />);

    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Planned/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
  });

  it('displays area labels', () => {
    render(<RoadmapTimeline items={mockItems} />);

    expect(screen.getAllByText(/Portfolio/i)).toHaveLength(2);
    expect(screen.getByText(/CLI_X Tool/i)).toBeInTheDocument();
  });

  it('shows target releases when provided', () => {
    render(<RoadmapTimeline items={mockItems} />);

    expect(screen.getByText(/v2\.0/i)).toBeInTheDocument();
    expect(screen.getByText(/v2\.1/i)).toBeInTheDocument();
    expect(screen.getByText(/v2\.4\.0/i)).toBeInTheDocument();
  });

  it('displays priority indicators', () => {
    render(<RoadmapTimeline items={mockItems} />);

    expect(screen.getByText(/High Priority/i)).toBeInTheDocument();
    expect(screen.getByText(/Medium Priority/i)).toBeInTheDocument();
  });

  it('renders empty timeline when no items provided', () => {
    const { container } = render(<RoadmapTimeline items={[]} />);
    const timeline = container.querySelector('.space-y-8');
    expect(timeline?.children).toHaveLength(0);
  });

  it('renders timeline visual elements', () => {
    const { container } = render(<RoadmapTimeline items={mockItems} />);

    // Check for timeline line
    const timelineLine = container.querySelector('.absolute.left-8');
    expect(timelineLine).toBeInTheDocument();
  });

  // Each badge keeps its visible label plus exactly one aria-hidden Phosphor svg (DSGN-10).
  const expectBadgeIcon = (badge: HTMLElement, label: string) => {
    expect(badge).toHaveTextContent(label);
    expect(badge.querySelectorAll('svg')).toHaveLength(1);
    expect(badge.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(1);
  };

  it('shows status icons', () => {
    render(<RoadmapTimeline items={mockItems} />);

    for (const label of ['In Progress', 'Planned', 'Completed']) {
      expectBadgeIcon(screen.getByText(label), label);
    }
  });

  it('shows area icons', () => {
    render(<RoadmapTimeline items={mockItems} />);

    const portfolioBadges = screen.getAllByText('Portfolio');
    expect(portfolioBadges).toHaveLength(2);
    portfolioBadges.forEach((badge) => expectBadgeIcon(badge, 'Portfolio'));
    expectBadgeIcon(screen.getByText('CLI_X Tool'), 'CLI_X Tool');
  });

  it('shows priority icons', () => {
    render(<RoadmapTimeline items={mockItems} />);

    for (const label of ['High Priority', 'Medium Priority']) {
      expectBadgeIcon(screen.getByText(label), label);
    }
  });
});
