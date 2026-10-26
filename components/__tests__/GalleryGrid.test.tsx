/**
 * The Grid view (PHOTO-02, PHOTO-03; D-15; 10-UI-SPEC "Grid View"): the four
 * committed photos as justified slide mounts in the canonical order, each a
 * link to /photos/{slug} with an always-visible caption and no hover overlay
 * or hotspot badge. Rewritten in 10-04 from the legacy GalleryGrid tests
 * (D-15): every former case maps to a JustifiedGrid case, none is dropped,
 * and the former '1 hotspots' badge assertion is now the film scan caption.
 * Server component rendered from real data; nothing is mocked.
 */
import { render, screen, within } from '@testing-library/react';
import JustifiedGrid from '@/components/photos/JustifiedGrid';
import { FILLER_GROW, ROW_H_MD_PX, ROW_H_PX, justifyTile } from '@/lib/photos/justify';
import { photoViews } from '@/lib/photos/view-model';

/** The formatters keep a unit on its number with U+00A0. */
const NBSP = String.fromCharCode(0xa0);
const LIST_NAME = 'Photographs, lowest first';

function renderGrid() {
  const utils = render(<JustifiedGrid photos={photoViews} />);
  const list = screen.getByRole('list', { name: LIST_NAME });
  const links = within(list).getAllByRole('link');
  return { ...utils, list, links };
}

/** The mono data line of a tile: the p holding the three caption parts. */
function dataLine(link: HTMLElement): HTMLElement {
  const part = link.querySelector('[data-caption-part]');
  if (!part?.parentElement) throw new Error('tile has no caption data line');
  return part.parentElement;
}

describe('JustifiedGrid (PHOTO-02, PHOTO-03, D-15)', () => {
  it('renders every photo as a tile with its image and title', () => {
    const { links } = renderGrid();
    expect(links).toHaveLength(photoViews.length);
    photoViews.forEach((view, i) => {
      expect(within(links[i]).getByRole('img', { name: view.alt })).toBeInTheDocument();
      expect(within(links[i]).getByText(view.title)).toBeInTheDocument();
    });
  });

  it("captions the film scan 'Riffelsee · 2,760 m approx. · 2019' (was the hotspot badge test)", () => {
    const { links } = renderGrid();
    const captions = links.map((link) => dataLine(link).textContent);
    expect(captions).toContain(`Riffelsee · 2,760${NBSP}m approx. · 2019`);
    expect(captions).toContain(`Gornerschlucht · 1,668${NBSP}m · Sep 2021`);
  });

  it('shows no hotspot count or hover overlay', () => {
    const { container } = renderGrid();
    expect(container.textContent).not.toMatch(/hotspot/i);
    expect(container.textContent).not.toMatch(/View details/);
    expect(container.textContent).not.toMatch(/Click to explore/);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('links each tile to /photos/{slug} (was the open-modal test)', () => {
    const { links } = renderGrid();
    photoViews.forEach((view, i) => {
      expect(links[i]).toHaveAttribute('href', `/photos/${view.slug}`);
    });
  });

  it('carries data-photo-id on every opener for focus restore (was the close-modal test)', () => {
    const { links } = renderGrid();
    for (const link of links) {
      expect(link).toHaveAttribute('data-photo-id');
    }
  });

  it('renders exactly the four committed photos in altitude order (was the empty-grid test)', () => {
    const { list } = renderGrid();
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    const ids = items.map((li) => li.querySelector('a')?.getAttribute('data-photo-id'));
    expect(ids).toEqual(photoViews.map((v) => v.slug));
    const heights = photoViews.map((v) => v.altitudeM);
    expect(heights).toEqual([...heights].sort((a, b) => a - b));
  });

  it('names the list and gives each link its photo title as an explicit aria-label', () => {
    const { links } = renderGrid();
    photoViews.forEach((view, i) => {
      expect(links[i]).toHaveAttribute('aria-label', view.title);
      expect(links[i]).toHaveAccessibleName(view.title);
    });
  });

  it('opens each caption data line with the short place (was the location test)', () => {
    const { links } = renderGrid();
    photoViews.forEach((view, i) => {
      const parts = links[i].querySelectorAll('[data-caption-part]');
      expect(parts[0]).toHaveTextContent(view.shortPlace);
      expect(parts[0]).toHaveAttribute('data-caption-part', 'place');
    });
  });

  it('gives each tile a data-photo-id equal to its slug (was the fragment-id test)', () => {
    const { links } = renderGrid();
    photoViews.forEach((view, i) => {
      expect(links[i]).toHaveAttribute('data-photo-id', view.slug);
    });
  });

  it('makes every caption part nowrap, so the line breaks only at " · " (was the hover-hint test)', () => {
    const { links } = renderGrid();
    photoViews.forEach((view, i) => {
      const line = dataLine(links[i]);
      const parts = [...line.querySelectorAll('[data-caption-part]')];
      expect(parts.map((p) => p.getAttribute('data-caption-part'))).toEqual([
        'place',
        'altitude',
        'date',
      ]);
      for (const part of parts) expect(part).toHaveClass('whitespace-nowrap');
      expect(line.textContent).toBe(
        `${view.shortPlace} · ${view.altitudeLabel} · ${view.captureMonth}`
      );
      expect(line).toHaveClass('font-mono', 'text-sm', 'text-ink-muted');
    });
  });

  it('lists AVIF before WebP, each 640w/1024w/1600w, sized for half the row from 640 px', () => {
    const { links } = renderGrid();
    photoViews.forEach((view, i) => {
      const sources = links[i].querySelectorAll('picture > source');
      expect(sources).toHaveLength(2);
      expect(sources[0]).toHaveAttribute('type', 'image/avif');
      expect(sources[0]).toHaveAttribute('srcset', view.tile.srcSetAvif);
      expect(sources[1]).toHaveAttribute('type', 'image/webp');
      expect(sources[1]).toHaveAttribute('srcset', view.tile.srcSetWebp);
      for (const source of sources) {
        expect(source.getAttribute('srcset')).toMatch(/ 640w, .* 1024w, .* 1600w$/);
        expect(source).toHaveAttribute('sizes', '(min-width: 640px) 50vw, 100vw');
      }
      const img = within(links[i]).getByRole('img', { name: view.alt });
      expect(img).toHaveAttribute('src', view.tile.src);
      expect(img).toHaveAttribute('width', String(view.tile.width));
      expect(img).toHaveAttribute('height', String(view.tile.height));
      expect(img).toHaveAttribute('decoding', 'async');
    });
  });

  it('loads the first two images eagerly and the others lazily', () => {
    const { links } = renderGrid();
    const loading = links.map((link) => link.querySelector('img')?.getAttribute('loading'));
    expect(loading).toEqual(['eager', 'eager', 'lazy', 'lazy']);
  });

  it('reserves each image box at the manifest ratio over surface-overlay, its li flexing from justifyTile', () => {
    const { list } = renderGrid();
    const items = within(list).getAllByRole('listitem');
    photoViews.forEach((view, i) => {
      const tile = justifyTile(view.aspect.w, view.aspect.h);
      expect(items[i].style.getPropertyValue('--tile-flex')).toBe(tile.flex);
      const box = items[i].querySelector('[data-tile-box]') as HTMLElement;
      expect(box.style.aspectRatio).toBe(tile.aspectRatio);
      expect(box).toHaveClass('bg-surface-overlay', 'overflow-hidden');
    });
  });

  it('sets --row-h from the justify constants and a trailing filler that is not a list item', () => {
    const { list } = renderGrid();
    expect(list.className).toContain(`--row-h:${ROW_H_MD_PX}px`);
    expect(list.className).toContain(`--row-h:${ROW_H_PX}px`);
    expect(list.className).toContain(`${FILLER_GROW}_1_0px`);
    expect(list.className).toMatch(/sm:flex-row/);
    expect(list.className).toMatch(/sm:flex-wrap/);
    expect(within(list).getAllByRole('listitem')).toHaveLength(photoViews.length);
  });
});
