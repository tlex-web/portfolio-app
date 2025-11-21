import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoadmapFilters from '../RoadmapFilters';

describe('RoadmapFilters', () => {
  const mockOnAreaChange = jest.fn();
  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    mockOnAreaChange.mockClear();
    mockOnStatusChange.mockClear();
  });

  it('renders all area filters', () => {
    render(
      <RoadmapFilters
        selectedArea="all"
        selectedStatus="all"
        onAreaChange={mockOnAreaChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('All Projects')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('CLI_X Tool')).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('renders all status filters', () => {
    render(
      <RoadmapFilters
        selectedArea="all"
        selectedStatus="all"
        onAreaChange={mockOnAreaChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('All Statuses')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('calls onAreaChange when area filter is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RoadmapFilters
        selectedArea="all"
        selectedStatus="all"
        onAreaChange={mockOnAreaChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    await user.click(screen.getByText('Portfolio'));
    expect(mockOnAreaChange).toHaveBeenCalledWith('portfolio');

    await user.click(screen.getByText('CLI_X Tool'));
    expect(mockOnAreaChange).toHaveBeenCalledWith('cli');
  });

  it('calls onStatusChange when status filter is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RoadmapFilters
        selectedArea="all"
        selectedStatus="all"
        onAreaChange={mockOnAreaChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    await user.click(screen.getByText('Completed'));
    expect(mockOnStatusChange).toHaveBeenCalledWith('completed');

    await user.click(screen.getByText('In Progress'));
    expect(mockOnStatusChange).toHaveBeenCalledWith('in-progress');
  });

  it('highlights selected area filter', () => {
    render(
      <RoadmapFilters
        selectedArea="portfolio"
        selectedStatus="all"
        onAreaChange={mockOnAreaChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    const portfolioButton = screen.getByText('Portfolio').closest('button');
    expect(portfolioButton).toHaveClass('bg-cyan-600');
  });

  it('highlights selected status filter', () => {
    render(
      <RoadmapFilters
        selectedArea="all"
        selectedStatus="completed"
        onAreaChange={mockOnAreaChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    const completedButton = screen.getByText('Completed').closest('button');
    expect(completedButton).toHaveClass('bg-blue-600');
  });

  it('renders filter section headers', () => {
    render(
      <RoadmapFilters
        selectedArea="all"
        selectedStatus="all"
        onAreaChange={mockOnAreaChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('Filter by Project')).toBeInTheDocument();
    expect(screen.getByText('Filter by Status')).toBeInTheDocument();
  });

  it('displays icons for each filter option', () => {
    const { container } = render(
      <RoadmapFilters
        selectedArea="all"
        selectedStatus="all"
        onAreaChange={mockOnAreaChange}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Check for emojis (icons) in the rendered output
    expect(container.textContent).toContain('🌐');
    expect(container.textContent).toContain('🎨');
    expect(container.textContent).toContain('⌨️');
    expect(container.textContent).toContain('✓');
    expect(container.textContent).toContain('⚡');
  });
});
