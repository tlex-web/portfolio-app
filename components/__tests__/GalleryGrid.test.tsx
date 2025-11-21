import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryGrid from '../GalleryGrid';
import { LandscapeImage } from '@/data/types';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />;
  },
}));

// Mock ImageDetailModal
jest.mock('../ImageDetailModal', () => ({
  __esModule: true,
  default: ({ image, onClose }: any) => {
    if (!image) return null;
    return (
      <div data-testid="image-detail-modal">
        <h2>{image.title}</h2>
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

describe('GalleryGrid', () => {
  const mockImages: LandscapeImage[] = [
    {
      id: '1',
      src: '/images/test1.jpg',
      alt: 'Test Image 1',
      title: 'Mountain View',
      location: 'Swiss Alps',
      story: 'A beautiful mountain view',
      technicalDetails: {
        camera: 'Canon EOS R5',
        lens: '24-70mm',
        aperture: 'f/8',
        shutterSpeed: '1/250s',
        iso: 100,
      },
      tags: ['mountain', 'landscape'],
    },
    {
      id: '2',
      src: '/images/test2.jpg',
      alt: 'Test Image 2',
      title: 'Lake Sunset',
      location: 'Lake Geneva',
      story: 'A stunning sunset',
      technicalDetails: {
        camera: 'Sony A7III',
        lens: '16-35mm',
      },
      tags: ['lake', 'sunset'],
      annotations: [
        {
          id: 'a1',
          title: 'Peak',
          description: 'Matterhorn peak',
          position: { x: 50, y: 30 },
          icon: 'mountain',
        },
      ],
    },
  ];

  it('renders all images in grid', () => {
    render(<GalleryGrid images={mockImages} />);

    expect(screen.getByAltText('Test Image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Test Image 2')).toBeInTheDocument();
    expect(screen.getByText('Mountain View')).toBeInTheDocument();
    expect(screen.getByText('Lake Sunset')).toBeInTheDocument();
  });

  it('shows annotation badge for images with hotspots', () => {
    render(<GalleryGrid images={mockImages} />);

    expect(screen.getByText('1 hotspots')).toBeInTheDocument();
  });

  it('does not show annotation badge for images without hotspots', () => {
    render(<GalleryGrid images={mockImages} />);

    const badges = screen.queryAllByText(/hotspots/);
    expect(badges).toHaveLength(1); // Only one image has annotations
  });

  it('opens modal when image is clicked', async () => {
    const user = userEvent.setup();
    render(<GalleryGrid images={mockImages} />);

    const imageButton = screen.getByLabelText('View details for Mountain View');
    await user.click(imageButton);

    const modal = screen.getByTestId('image-detail-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent('Mountain View');
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<GalleryGrid images={mockImages} />);

    // Open modal
    const imageButton = screen.getByLabelText('View details for Lake Sunset');
    await user.click(imageButton);

    expect(screen.getByTestId('image-detail-modal')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    expect(screen.queryByTestId('image-detail-modal')).not.toBeInTheDocument();
  });

  it('renders empty grid when no images provided', () => {
    const { container } = render(<GalleryGrid images={[]} />);
    const grid = container.querySelector('.grid');
    expect(grid?.children).toHaveLength(0);
  });

  it('has proper accessibility attributes', () => {
    render(<GalleryGrid images={mockImages} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('displays location information', () => {
    render(<GalleryGrid images={mockImages} />);

    expect(screen.getByText('Swiss Alps')).toBeInTheDocument();
    expect(screen.getByText('Lake Geneva')).toBeInTheDocument();
  });

  it('shows interactive annotation hint on hover target', () => {
    render(<GalleryGrid images={mockImages} />);

    expect(screen.getByText('Click to explore interactive annotations')).toBeInTheDocument();
  });
});
