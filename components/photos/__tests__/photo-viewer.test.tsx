import { fireEvent, render, screen } from '@testing-library/react';
import LightboxDialog from '../LightboxDialog';
import PhotoViewer from '../PhotoViewer';
import {
  photoSlugs,
  photoViews,
  publishedViews,
  viewerPhotos,
  type PhotoView,
} from '@/lib/photos/view-model';

/**
 * The viewer for a one-photo set and the server-built back link (17 D-08, D-09;
 * PHOTO-05). A photo off the light table steps through itself only until Phase
 * 18, so its viewer shows no Previous, Next or counter; its page leads back to
 * its region page (the link and the page Escape), built on the server and passed
 * as the serialisable `back` prop. The v2.0 four render with no `back` and the
 * four-photo set, exactly as before. The lightbox never shows a back link.
 *
 * Views come from the view-model: the light table (photoViews) and the first
 * published photo off it, as viewerPhotos gives it to both routes. The back
 * fixture is the one hand-typed value: the page builds it with regionHref and
 * the region's name.
 */

const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn() };
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/photos/test',
}));

const BACK = { href: '/photos/regions/ortler', label: 'Ortler' };

/** The first published photo that is not on the light table. */
const newPhoto: PhotoView = (() => {
  const view = publishedViews.find((v) => !photoSlugs.includes(v.slug));
  if (!view) throw new Error('photo-viewer.test: every published photo is on the light table');
  return view;
})();
const onePhotoSet = viewerPhotos(newPhoto);

let replaceState: jest.Spied<typeof window.history.replaceState>;

beforeEach(() => {
  mockRouter.back.mockClear();
  mockRouter.push.mockClear();
  replaceState = jest.spyOn(window.history, 'replaceState');
});

afterEach(() => {
  replaceState.mockRestore();
});

function renderPage(photos: readonly PhotoView[], initialSlug: string, back?: typeof BACK) {
  return render(
    <PhotoViewer variant="page" photos={photos} initialSlug={initialSlug} back={back} />
  );
}

function renderModal(photos: readonly PhotoView[], initialSlug: string) {
  return render(
    <LightboxDialog labelledBy="photo-title">
      <PhotoViewer variant="modal" photos={photos} initialSlug={initialSlug} />
    </LightboxDialog>
  );
}

const counter = () => document.querySelector('[data-photo-counter]');
const status = () => screen.getByRole('status', { hidden: true });

describe('the fixtures', () => {
  it('a one-photo set off the light table and the four on it', () => {
    expect(onePhotoSet).toHaveLength(1);
    expect(photoSlugs).not.toContain(newPhoto.slug);
    expect(photoViews).toHaveLength(4);
  });
});

describe('D-08: no stepping controls for a one-photo set', () => {
  it('the page variant with one photo has no Previous, no Next and no counter', () => {
    renderPage(onePhotoSet, newPhoto.slug, BACK);
    expect(screen.queryByRole('button', { name: 'Previous photo' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next photo' })).toBeNull();
    expect(counter()).toBeNull();
  });

  it('the modal variant with one photo has no Previous, no Next and no counter', () => {
    renderModal(onePhotoSet, newPhoto.slug);
    expect(screen.queryByRole('button', { name: 'Previous photo', hidden: true })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next photo', hidden: true })).toBeNull();
    expect(counter()).toBeNull();
  });

  it('the page variant with the four keeps both step buttons and the counter 1 / 4', () => {
    renderPage(photoViews, photoViews[0].slug);
    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next photo' })).toBeInTheDocument();
    expect(counter()).toHaveTextContent('1 / 4');
  });
});

describe('D-09: the page back link', () => {
  it('a new photo page: every back link is named after its region and leads to the region page', () => {
    renderPage(onePhotoSet, newPhoto.slug, BACK);
    const links = screen.getAllByRole('link', { name: 'Ortler' });
    // The scroll-tier row and the chrome link (CSS shows one per tier).
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute('href', '/photos/regions/ortler');
    expect(screen.queryByRole('link', { name: 'All photographs' })).toBeNull();
  });

  it('the four: both back links read All photographs and lead to /photos', () => {
    renderPage(photoViews, photoViews[0].slug);
    const links = screen.getAllByRole('link', { name: 'All photographs' });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute('href', '/photos');
  });

  it('the lightbox shows no back link', () => {
    renderModal(onePhotoSet, newPhoto.slug);
    expect(screen.queryByRole('link', { name: 'All photographs', hidden: true })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Ortler', hidden: true })).toBeNull();
    const hrefs = screen
      .queryAllByRole('link', { hidden: true })
      .map((a) => a.getAttribute('href') ?? '');
    expect(hrefs.filter((h) => h === '/photos' || h.startsWith('/photos/regions/'))).toEqual([]);
  });
});

describe('Escape on the page (RESEARCH Open Question 5)', () => {
  it('with back set, Escape goes to the region page', () => {
    renderPage(onePhotoSet, newPhoto.slug, BACK);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/photos/regions/ortler');
  });

  it('without back, Escape goes to /photos', () => {
    renderPage(photoViews, photoViews[0].slug);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/photos');
  });
});

describe('Edge PHOTO-05/empty: the arrows do nothing on a one-photo set', () => {
  it.each([
    ['page', () => renderPage(onePhotoSet, newPhoto.slug, BACK)],
    ['modal', () => renderModal(onePhotoSet, newPhoto.slug)],
  ] as const)(
    'the %s variant: ArrowLeft then ArrowRight write no URL and announce nothing',
    (_v, renderIt) => {
      renderIt();
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(replaceState).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(status()).not.toHaveTextContent(/Photo \d+ of \d+/);
    }
  );

  it('the control: the same presses on the four (second photo shown) step twice', () => {
    renderPage(photoViews, photoViews[1].slug);
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(replaceState).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(replaceState).toHaveBeenCalledTimes(2);
    expect(status()).toHaveTextContent(`Photo 2 of 4: ${photoViews[1].title}`);
  });
});
