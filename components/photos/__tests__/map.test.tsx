/**
 * The Map view (PHOTO-01, PHOTO-03; D-01 to D-04; 10-UI-SPEC "Map View"):
 * the full sheet with one link per photo in the canonical order, whose box is
 * the label plate and whose children are the dot and the leader; the film
 * scan is marked approximate by shape and in its name; the summit is an
 * aria-hidden landmark, not a link; the label positions arrive as a
 * server-rendered style element. Server component rendered from real data;
 * nothing is mocked.
 */
import { render, screen, within } from '@testing-library/react';
import MapSheet from '@/components/photos/MapSheet';
import { photoViews } from '@/lib/photos/view-model';

const NBSP = String.fromCharCode(0xa0);

function renderMap() {
  const utils = render(<MapSheet photos={photoViews} />);
  const section = screen.getByRole('region', { name: 'Map of the photo locations' });
  const list = within(section).getByRole('list', { name: 'Photo locations, lowest first' });
  const links = within(list).getAllByRole('link');
  return { ...utils, section, list, links };
}

describe('MapSheet (PHOTO-01, PHOTO-03, D-01..D-04)', () => {
  it('renders a section named for the map with an ordered list of four links', () => {
    const { list, links } = renderMap();
    expect(list.tagName).toBe('OL');
    expect(links).toHaveLength(4);
  });

  it('links each waypoint to its photo in the canonical order', () => {
    const { links } = renderMap();
    photoViews.forEach((view, i) => {
      expect(links[i]).toHaveAttribute('href', `/photos/${view.slug}`);
      expect(links[i]).toHaveAttribute('data-photo-id', view.slug);
      expect(links[i]).toHaveAttribute('data-map-mark', view.slug);
    });
  });

  it("names each link '{title}, {altitude}', the film scan with 'approx.'", () => {
    const { links } = renderMap();
    photoViews.forEach((view, i) => {
      expect(links[i]).toHaveAccessibleName(`${view.title}, ${view.altitudeLabel}`);
    });
    const approx = photoViews.findIndex((v) => v.approximate);
    expect(links[approx].getAttribute('aria-label')).toMatch(
      new RegExp(`, 2,760${NBSP}m approx\\.$`)
    );
  });

  it('shows the title and altitude on each plate', () => {
    const { links } = renderMap();
    photoViews.forEach((view, i) => {
      expect(within(links[i]).getByText(view.title)).toBeInTheDocument();
      // Testing Library normalises U+00A0 to a space.
      expect(within(links[i]).getByText(view.altitudeLabel.replace(NBSP, ' '))).toBeInTheDocument();
    });
  });

  it('puts the dot and the leader inside the link, the leader hidden from assistive tech', () => {
    const { links } = renderMap();
    for (const link of links) {
      expect(link.querySelector('[data-map-dot]')).not.toBeNull();
      const leader = link.querySelector('[data-map-leader]');
      expect(leader).not.toBeNull();
      expect(leader?.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('draws the approximate dot hollow with a 2 px dashed ink border, the exact dots solid', () => {
    const { links } = renderMap();
    photoViews.forEach((view, i) => {
      const dot = links[i].querySelector('[data-map-dot]') as HTMLElement;
      if (view.approximate) {
        expect(dot).toHaveClass('bg-surface', 'border-2', 'border-dashed', 'border-ink');
      } else {
        expect(dot).toHaveClass('bg-ink');
        expect(dot).not.toHaveClass('border-dashed');
      }
    });
    expect(photoViews.filter((v) => v.approximate)).toHaveLength(1);
  });

  it('draws the summit as an aria-hidden plate that is not a link', () => {
    const { container } = renderMap();
    const plate = container.querySelector('[data-summit-plate]') as HTMLElement;
    expect(plate).not.toBeNull();
    expect(plate).toHaveTextContent('Matterhorn');
    expect(plate.textContent).toContain(`4,478${NBSP}m`);
    expect(plate.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(plate.closest('a')).toBeNull();
    expect(container.querySelector('[data-summit-mark]')?.closest('a')).toBeNull();
  });

  it('emits the label positions as a style element with container queries', () => {
    const { container } = renderMap();
    const style = container.querySelector('style');
    expect(style?.textContent).toContain('@container map-sheet');
    expect(style?.textContent).toContain(`[data-map-mark="${photoViews[0].slug}"]`);
  });

  it('names the sheet container and lays the relief and contours under the marks', () => {
    const { container } = renderMap();
    const sheet = container.querySelector('[data-map-sheet]') as HTMLElement;
    expect(sheet).toHaveClass('[container-name:map-sheet]', '[container-type:inline-size]');
    const img = sheet.querySelector('picture img') as HTMLImageElement;
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveClass('opacity-(--relief-opacity)');
  });

  it('prints the margin line under the sheet', () => {
    const { section } = renderMap();
    expect(section.textContent).toContain(`Zermatt – Matterhorn · contours every 100${NBSP}m`);
    expect(section).toHaveTextContent('Terrain: swissALTIRegio, swisstopo');
  });
});
