import { render, screen, within } from '@testing-library/react';
import SavedPages from '../SavedPages';
import { savedPageCatalog } from '@/lib/saved-pages';
import { site } from '@/data/site';
import { photoViews } from '@/lib/photos/view-model';
import { projects } from '@/data/projects';

/**
 * The offline saved-pages island (D-12; 12-UI-SPEC E11): checking, populated,
 * empty and unsupported, with Cache Storage stubbed. Data-driven: no literal
 * slugs or titles beyond the approved copy.
 */

const catalog = savedPageCatalog({ nav: site.nav, photos: photoViews, projects });
const firstPhoto = photoViews[0];
const roadmap = site.nav.find((item) => item.href === '/roadmap')!;
const ORIGIN = window.location.origin;

const CHECKING = 'Checking saved pages…';
const EMPTY = 'No pages are saved on this device yet.';
const UNSUPPORTED = "This browser can't list saved pages.";

type CacheEntries = Record<string, string[]>;

function stubCaches(entries: CacheEntries) {
  Object.defineProperty(window, 'caches', {
    configurable: true,
    writable: true,
    value: {
      keys: jest.fn(async () => Object.keys(entries)),
      open: jest.fn(async (name: string) => ({
        keys: jest.fn(async () => (entries[name] ?? []).map((u) => ({ url: u }))),
      })),
    },
  });
}

function stubRejectingCaches() {
  Object.defineProperty(window, 'caches', {
    configurable: true,
    writable: true,
    value: { keys: jest.fn(() => Promise.reject(new Error('SecurityError'))), open: jest.fn() },
  });
}

afterEach(() => {
  // jsdom has no Cache Storage; remove the stub so each test starts without it.
  delete (window as unknown as { caches?: unknown }).caches;
});

describe('SavedPages', () => {
  it('server-stable section: the h2 names the region and Checking shows on first paint', () => {
    stubCaches({});
    render(<SavedPages catalog={catalog} />);

    const region = screen.getByRole('region', { name: 'Saved on this device' });
    const heading = within(region).getByRole('heading', { level: 2, name: 'Saved on this device' });
    expect(heading).toHaveAttribute('id', 'saved-title');
    expect(region).toHaveAttribute('aria-labelledby', 'saved-title');
    expect(within(region).getByText(CHECKING)).toBeInTheDocument();
  });

  it('lists only the cached pages, titled from data, in nav then photo order', async () => {
    stubCaches({
      'static-x': [`${ORIGIN}/offline`, `${ORIGIN}/_next/static/chunk.js`],
      'dynamic-x': [
        `${ORIGIN}/photos/${firstPhoto.slug}`,
        `${ORIGIN}/roadmap`,
        `${ORIGIN}/roadmap?view=1`,
        `${ORIGIN}/nope`,
      ],
    });
    render(<SavedPages catalog={catalog} />);

    const list = await screen.findByRole('list');
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/roadmap');
    expect(links[0]).toHaveTextContent(roadmap.label);
    expect(links[1]).toHaveAttribute('href', `/photos/${firstPhoto.slug}`);
    expect(links[1]).toHaveTextContent(firstPhoto.title);
    expect(within(links[1]).getByText('Photograph')).toBeInTheDocument();
    expect(screen.queryByText(CHECKING)).not.toBeInTheDocument();

    const region = screen.getByRole('region', { name: 'Saved on this device' });
    expect(region.textContent).not.toMatch(/https?:|\/photos\/|\/roadmap|\/offline|_next/);
  });

  it('rows are at least 48 px link rows with line rules, and no count is shown', async () => {
    stubCaches({ 'dynamic-x': [`${ORIGIN}/`, `${ORIGIN}/roadmap`] });
    render(<SavedPages catalog={catalog} />);

    const list = await screen.findByRole('list');
    expect(list).toHaveClass('mt-4', 'border-b', 'border-line');
    for (const item of within(list).getAllByRole('listitem')) {
      expect(item).toHaveClass('border-t', 'border-line');
      expect(within(item).getByRole('link')).toHaveClass('flex', 'min-h-12', 'items-center');
    }
    const region = screen.getByRole('region', { name: 'Saved on this device' });
    expect(region.textContent).not.toMatch(/\d/);
  });

  it('shows the empty sentence when no cached page has a data title', async () => {
    stubCaches({ 'static-x': [`${ORIGIN}/offline`, `${ORIGIN}/_next/static/a.css`] });
    render(<SavedPages catalog={catalog} />);

    expect(await screen.findByText(EMPTY)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText(CHECKING)).not.toBeInTheDocument();
  });

  it('shows the unsupported sentence without the caches API', async () => {
    render(<SavedPages catalog={catalog} />);

    expect(await screen.findByText(UNSUPPORTED)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows the unsupported sentence when reading Cache Storage rejects', async () => {
    stubRejectingCaches();
    render(<SavedPages catalog={catalog} />);

    expect(await screen.findByText(UNSUPPORTED)).toBeInTheDocument();
    expect(screen.queryByText(CHECKING)).not.toBeInTheDocument();
  });
});
