/**
 * The /photos header band (D-14; 10-UI-SPEC "Header Band (D-14)" and UI
 * Considerations E1): a mono kicker derived from the data, '4 waypoints ·
 * 1,617–2,760 m · Zermatt' (count, DEM height range and the place from the
 * shared sheet title; wording confirmed by Tim 2026-10-26, no 'approx.' on the
 * range), and one h1 'Photographs' from the site nav. No prose, no hero.
 * Server component rendered from real data; nothing is mocked.
 */
import { render, screen } from '@testing-library/react';
import PhotosHeader from '@/components/photos/PhotosHeader';
import { sheet, sheetPlace } from '@/data/sheet';
import { site } from '@/data/site';
import { photoViews } from '@/lib/photos/view-model';

const NBSP = String.fromCharCode(0xa0);
const EN_DASH = String.fromCharCode(0x2013);

describe('data/sheet.ts', () => {
  it("titles the sheet 'Zermatt – Matterhorn' and takes the place from it", () => {
    expect(sheet.title).toBe(`Zermatt ${EN_DASH} Matterhorn`);
    expect(sheetPlace).toBe('Zermatt');
  });
});

describe('PhotosHeader (D-14)', () => {
  it("prints the kicker '4 waypoints · 1,617–2,760 m · Zermatt' from the data", () => {
    const { container } = render(<PhotosHeader photos={photoViews} />);
    const kicker = container.querySelector('[data-photos-kicker]') as HTMLElement;
    expect(kicker.tagName).toBe('P');
    expect(kicker).toHaveClass('mb-2', 'font-mono', 'text-sm', 'text-ink-muted');
    expect(kicker.textContent).toBe(`4 waypoints · 1,617${EN_DASH}2,760${NBSP}m · Zermatt`);
  });

  it('derives the count and range from the photos it is given', () => {
    const lowest = photoViews.slice(0, 1);
    const { container } = render(<PhotosHeader photos={lowest} />);
    expect(container.querySelector('[data-photos-kicker]')?.textContent).toBe(
      `1 waypoint · 1,617${NBSP}m · Zermatt`
    );
  });

  it("renders one h1 'Photographs', the site nav label for /photos", () => {
    render(<PhotosHeader photos={photoViews} />);
    const navLabel = site.nav.find((item) => item.href === '/photos')?.label;
    expect(navLabel).toBe('Photographs');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(navLabel as string);
  });

  it('is a wrapping, non-sticky band with no prose', () => {
    const { container } = render(<PhotosHeader photos={photoViews} />);
    const band = container.querySelector('[data-photos-header]') as HTMLElement;
    expect(band).toHaveClass('flex', 'flex-wrap', 'border-b', 'border-line', 'pt-8', 'pb-6');
    expect(band.className).not.toMatch(/sticky|fixed/);
    expect(band.textContent).not.toMatch(/stunning/i);
    expect(container.querySelectorAll('p')).toHaveLength(1);
  });

  it('renders the switcher slot after the title block', () => {
    render(
      <PhotosHeader photos={photoViews}>
        <button type="button">Map</button>
      </PhotosHeader>
    );
    expect(screen.getByRole('button', { name: 'Map' })).toBeInTheDocument();
  });

  it('fails the build for zero photos', () => {
    expect(() => render(<PhotosHeader photos={[]} />)).toThrow(RangeError);
  });
});
