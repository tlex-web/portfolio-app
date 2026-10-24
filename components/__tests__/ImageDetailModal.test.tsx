/**
 * D-03, RESEARCH Pitfall 6: the v1 modal shows the capture as the bridge
 * preformatted it (lib/photo-format via data/landscapes.ts). It must never
 * turn a year-only capture into a locale date such as 1/1/2019.
 */
import { render, screen } from '@testing-library/react';
import ImageDetailModal from '../ImageDetailModal';
import { LandscapeImage } from '@/data/types';

// Mock Next.js Image component (as GalleryGrid.test.tsx does); only its alt matters here
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt?: string }) => <span role="img" aria-label={alt} />,
}));

const LOCALE_DATE = /\d{1,2}\/\d{1,2}\/\d{4}/;

function photo(technicalDetails: LandscapeImage['technicalDetails']): LandscapeImage {
  return {
    id: 'test-photo',
    src: '/test/photo.webp',
    alt: 'Test photo',
    title: 'Test Photo',
    location: 'Test Location',
    story: 'A test story.',
    technicalDetails,
    tags: ['landscape'],
  };
}

describe('ImageDetailModal capture label (D-03)', () => {
  it('shows a year-only capture as the year, never as a locale date', () => {
    // A legacy captureDate of '2019' is what used to render as 1/1/2019.
    render(
      <ImageDetailModal
        image={photo({ captureLabel: '2019', captureDate: '2019' })}
        onClose={() => {}}
      />
    );

    expect(screen.queryByText('2019')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(LOCALE_DATE);
  });

  it('shows an EXIF capture label exactly as preformatted', () => {
    render(
      <ImageDetailModal
        image={photo({ camera: 'Canon EOS 6D Mark II', captureLabel: '6 September 2021, 10:48' })}
        onClose={() => {}}
      />
    );

    expect(screen.queryByText('6 September 2021, 10:48')).toBeInTheDocument();
  });

  it('renders no capture row without a capture label', () => {
    render(
      <ImageDetailModal image={photo({ camera: 'Canon EOS 6D Mark II' })} onClose={() => {}} />
    );

    expect(screen.getByText('Canon EOS 6D Mark II')).toBeInTheDocument();
    expect(screen.queryByText('Date')).not.toBeInTheDocument();
  });
});
