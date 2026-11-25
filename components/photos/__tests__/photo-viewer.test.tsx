import { fireEvent, render, screen } from '@testing-library/react';
import LightboxDialog from '../LightboxDialog';
import PhotoViewer from '../PhotoViewer';
import { publishedViews, type PhotoView } from '@/lib/photos/view-model';
import { regionEndCard, regionOfPhoto, regionPhotoViews } from '@/lib/regions';
import { SLUGS } from '../../../e2e/helpers/photo-fixtures';

/**
 * The viewer for a region series, a one-photo set and the server-built back
 * link (LBOX-09, 18 D-12; 17 D-09; PHOTO-05). Both routes pass the photo's
 * region series (regionViewerSet, 18-15); a one-photo set (a one-photo region)
 * still shows no Previous, Next or counter. A photo off the v2.0 four leads back
 * to its region page (the link and the page Escape), built on the server and
 * passed as the serialisable `back` prop; the v2.0 four render with no `back`.
 * The lightbox never shows a back link.
 *
 * Views come from the server modules: Zermatt's series (regionPhotoViews) and
 * the first published photo off the v2.0 four, as an explicit one-photo set.
 * The back fixture is the one hand-typed value: the page builds it with
 * regionHref and the region's name.
 */

const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn() };
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/photos/test',
}));

const BACK = { href: '/photos/regions/ortler', label: 'Ortler' };

/** The v2.0 four's slugs (the photos that render with no `back`). */
const V20_SLUGS: readonly string[] = Object.values(SLUGS);

/** The first published photo that is not one of the v2.0 four. */
const newPhoto: PhotoView = (() => {
  const view = publishedViews.find((v) => !V20_SLUGS.includes(v.slug));
  if (!view) throw new Error('photo-viewer.test: every published photo is one of the v2.0 four');
  return view;
})();
/** The component rule for a one-photo region: one view, no neighbours. */
const onePhotoSet: readonly PhotoView[] = [{ ...newPhoto, prevSlug: null, nextSlug: null }];
/** Zermatt's series, the set both routes pass for a v2.0 photo (LBOX-09). */
const zermatt = regionPhotoViews('zermatt');

let replaceState: jest.Spied<typeof window.history.replaceState>;

beforeEach(() => {
  mockRouter.back.mockClear();
  mockRouter.push.mockClear();
  replaceState = jest.spyOn(window.history, 'replaceState');
});

afterEach(() => {
  replaceState.mockRestore();
});

/** The end card both routes pass: the shown photo's region's (regionEndCard, 18 D-12). */
function cardFor(photos: readonly PhotoView[], initialSlug: string) {
  const view = photos.find((p) => p.slug === initialSlug);
  const regionId = view ? regionOfPhoto(view.id) : undefined;
  if (!regionId) throw new Error(`photo-viewer.test: no region for ${initialSlug}`);
  return regionEndCard(regionId);
}

function renderPage(photos: readonly PhotoView[], initialSlug: string, back?: typeof BACK) {
  return render(
    <PhotoViewer
      variant="page"
      photos={photos}
      initialSlug={initialSlug}
      back={back}
      endCard={cardFor(photos, initialSlug)}
    />
  );
}

function renderModal(photos: readonly PhotoView[], initialSlug: string) {
  return render(
    <LightboxDialog labelledBy="photo-title">
      <PhotoViewer
        variant="modal"
        photos={photos}
        initialSlug={initialSlug}
        endCard={cardFor(photos, initialSlug)}
      />
    </LightboxDialog>
  );
}

const counter = () => document.querySelector('[data-photo-counter]');
const status = () => screen.getByRole('status', { hidden: true });

describe('the fixtures', () => {
  it("an explicit one-photo set off the v2.0 four, and Zermatt's seven", () => {
    expect(onePhotoSet).toHaveLength(1);
    expect(V20_SLUGS).not.toContain(newPhoto.slug);
    expect(zermatt).toHaveLength(7);
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

  it("the page variant with Zermatt's seven keeps both step buttons and the counter 1 / 7", () => {
    renderPage(zermatt, zermatt[0].slug);
    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next photo' })).toBeInTheDocument();
    expect(counter()).toHaveTextContent('1 / 7');
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

  it("a v2.0 photo in Zermatt's series: both back links read All photographs and lead to /photos", () => {
    renderPage(zermatt, zermatt[0].slug);
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
    renderPage(zermatt, zermatt[0].slug);
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

  it("the control: the same presses on Zermatt's seven (second photo shown) step twice", () => {
    renderPage(zermatt, zermatt[1].slug);
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(replaceState).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(replaceState).toHaveBeenCalledTimes(2);
    expect(status()).toHaveTextContent(`Photo 2 of 7: ${zermatt[1].title}`);
  });
});
