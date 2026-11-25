import { act, fireEvent, render, screen } from '@testing-library/react';
import LightboxDialog from '../LightboxDialog';
import PhotoViewer from '../PhotoViewer';
import { site } from '@/data/site';
import { stageSizes } from '@/lib/photos/image-sizes';
import { photoHref } from '@/lib/photos/routes';
import { publishedViews, type PhotoView } from '@/lib/photos/view-model';
import {
  photoBack,
  photoBreadcrumb,
  regionEndCard,
  regionOfPhoto,
  regionPhotoViews,
} from '@/lib/regions';
import { SLUGS } from '../../../e2e/helpers/photo-fixtures';

/**
 * The viewer for a region series, a one-photo set and the server-built back
 * link (LBOX-09, 18 D-12; 17 D-09; PHOTO-05). Both routes pass the photo's
 * region series (regionViewerSet, 18-15); a one-photo set (a one-photo region)
 * still shows no Previous, Next or counter. Every photo page, the v2.0 four
 * included (18 D-09), leads back to its region page: both links read 'Back to
 * {region}', the page Escape goes there and the legend reads 'Esc back to
 * {region}'. The target is the serialisable `back` prop, which the page builds
 * on the server with photoBack; a page render without it throws. The lightbox
 * never shows a back link.
 *
 * The end-of-series card (18-16; LBOX-09, D-12): after the series' last photo
 * the viewer shows one extra step, the card built by regionEndCard. It writes
 * no URL (no replaceState), reads 'End' in the counter, disables Next and Zoom
 * (aria-disabled), keeps Hide labels operable and announces the card's
 * sentence; Previous returns to the last photo and writes its URL again.
 *
 * Views come from the server modules: Zermatt's series (regionPhotoViews) and
 * the first published photo off the v2.0 four, as an explicit one-photo set.
 * renderPage passes photoBack(shown photo id), as the page does.
 */

const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn() };
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/photos/test',
}));

/** The v2.0 four's slugs (since 18-17 they too lead back to their region, Zermatt). */
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

/** The page's way back for the shown photo, as the page builds it on the server (photoBack, 18 D-09). */
function backFor(photos: readonly PhotoView[], initialSlug: string) {
  const view = photos.find((p) => p.slug === initialSlug);
  if (!view) throw new Error(`photo-viewer.test: no view for ${initialSlug}`);
  return photoBack(view.id);
}

/** The page's trail as the page passes it: photoBreadcrumb's crumbs, the last without href (18-17, D-10). */
function crumbsFor(slug: string) {
  const crumbs = photoBreadcrumb(slug);
  return crumbs.map((c, i) =>
    i === crumbs.length - 1 ? { name: c.name } : { name: c.name, href: c.path }
  );
}

function renderPage(photos: readonly PhotoView[], initialSlug: string) {
  return render(
    <PhotoViewer
      variant="page"
      photos={photos}
      initialSlug={initialSlug}
      back={backFor(photos, initialSlug)}
      breadcrumb={crumbsFor(initialSlug)}
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
/**
 * The viewer's own polite status line (a p). Since 18-18 the strip's Share button
 * carries a second status (a span), so the role alone no longer names one element.
 */
const status = () => {
  const el = document.querySelector<HTMLElement>('[data-photo-viewer] p[role="status"]');
  if (!el) throw new Error('photo-viewer.test: no viewer status line');
  return el;
};

describe('the fixtures', () => {
  it("an explicit one-photo set off the v2.0 four, and Zermatt's seven", () => {
    expect(onePhotoSet).toHaveLength(1);
    expect(V20_SLUGS).not.toContain(newPhoto.slug);
    expect(zermatt).toHaveLength(7);
  });
});

describe('D-08: no stepping controls for a one-photo set', () => {
  it('the page variant with one photo has no Previous, no Next and no counter', () => {
    renderPage(onePhotoSet, newPhoto.slug);
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

describe('D-09: the page back link (18-17: every photo, by region name)', () => {
  it("a new photo page: both back links read 'Back to {region}' and lead to the region page", () => {
    renderPage(onePhotoSet, newPhoto.slug);
    const back = photoBack(newPhoto.id);
    const links = screen.getAllByRole('link', { name: `Back to ${back.name}` });
    // The scroll-tier row and the chrome link (CSS shows one per tier).
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute('href', back.href);
    expect(screen.queryByRole('link', { name: 'All photographs' })).toBeNull();
    expect(document.querySelector('[data-strip-legend]')).toHaveTextContent(
      `Esc back to ${back.name}`
    );
  });

  it("a v2.0 photo in Zermatt's series: both back links read 'Back to Zermatt' and lead to its region page, not /photos", () => {
    renderPage(zermatt, zermatt[0].slug);
    const links = screen.getAllByRole('link', { name: 'Back to Zermatt' });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute('href', '/photos/regions/zermatt');
    // The ArrowLeftIcon is decorative: the link's name is its text alone.
    for (const link of links) {
      expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    }
    expect(screen.queryByRole('link', { name: 'All photographs' })).toBeNull();
    expect(document.querySelector('[data-strip-legend]')?.textContent).toBe(
      '← → photos · Z zoom · H labels · Esc back to Zermatt'
    );
  });

  it('the page variant without back throws a RangeError (no gallery-wide fallback remains)', () => {
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() =>
        render(
          <PhotoViewer
            variant="page"
            photos={zermatt}
            initialSlug={zermatt[0].slug}
            endCard={regionEndCard('zermatt')}
          />
        )
      ).toThrow(
        new RangeError(
          `PhotoViewer: the page variant needs back (18 D-09), none for ${zermatt[0].slug}`
        )
      );
    } finally {
      quiet.mockRestore();
    }
  });

  it('the lightbox shows no back link', () => {
    renderModal(onePhotoSet, newPhoto.slug);
    expect(screen.queryByRole('link', { name: 'All photographs', hidden: true })).toBeNull();
    expect(screen.queryByRole('link', { name: /^Back to /, hidden: true })).toBeNull();
    expect(document.querySelector('[data-strip-legend]')).toHaveTextContent('Esc close');
    const hrefs = screen
      .queryAllByRole('link', { hidden: true })
      .map((a) => a.getAttribute('href') ?? '');
    expect(hrefs.filter((h) => h === '/photos' || h.startsWith('/photos/regions/'))).toEqual([]);
  });
});

describe('D-10: the page breadcrumb follows the shown photo (18-17)', () => {
  const trail = () => screen.queryByRole('navigation', { name: 'Breadcrumb', hidden: true });
  const currentCrumb = () => trail()?.querySelector('[aria-current="page"]');

  it("reads 'Photographs / Zermatt / {title}' at load, the current crumb the h1's title", () => {
    renderPage(zermatt, zermatt[0].slug);
    expect(trail()).not.toBeNull();
    expect(
      [...trail()!.querySelectorAll('li > a, li > [aria-current="page"]')].map((e) => e.textContent)
    ).toEqual(['Photographs', 'Zermatt', zermatt[0].title]);
    expect(currentCrumb()).toHaveTextContent(zermatt[0].title);
  });

  it('after a step the current crumb names the new photo; the other crumbs stay', () => {
    renderPage(zermatt, zermatt[0].slug);
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(currentCrumb()).toHaveTextContent(zermatt[1].title);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(zermatt[1].title);
    const links = [...trail()!.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/photos',
      '/photos/regions/zermatt',
    ]);
  });

  it('the end card shows no crumb (it replaces the strip)', () => {
    const last = zermatt[zermatt.length - 1];
    renderPage(zermatt, last.slug);
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(trail()).toBeNull();
  });

  it('the lightbox shows no breadcrumb even when one is passed', () => {
    render(
      <LightboxDialog labelledBy="photo-title">
        <PhotoViewer
          variant="modal"
          photos={zermatt}
          initialSlug={zermatt[0].slug}
          breadcrumb={crumbsFor(zermatt[0].slug)}
          endCard={regionEndCard('zermatt')}
        />
      </LightboxDialog>
    );
    expect(trail()).toBeNull();
  });
});

describe('Escape on the page (RESEARCH Open Question 5)', () => {
  it('on a new photo page, Escape goes to its region page', () => {
    renderPage(onePhotoSet, newPhoto.slug);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith(photoBack(newPhoto.id).href);
  });

  it("on a v2.0 photo page, Escape goes to Zermatt's region page, not /photos (18 D-09)", () => {
    renderPage(zermatt, zermatt[0].slug);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/photos/regions/zermatt');
  });
});

describe('Edge PHOTO-05/empty: the arrows do nothing on a one-photo set', () => {
  it.each([
    ['page', () => renderPage(onePhotoSet, newPhoto.slug)],
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

describe('the end-of-series card (18-16; LBOX-09, D-12)', () => {
  const last = zermatt[zermatt.length - 1];
  const card = regionEndCard('zermatt');

  const button = (name: string) => screen.getByRole('button', { name, hidden: true });

  it("a v2.0 photo's counter reads 'n / 7' over Zermatt's photos only", () => {
    const v20 = zermatt.findIndex((v) => V20_SLUGS.includes(v.slug));
    renderPage(zermatt, zermatt[v20].slug);
    expect(counter()).toHaveTextContent(`${v20 + 1} / 7`);
  });

  it.each(['page', 'modal'] as const)(
    'the %s variant: Next on photo 7 shows the card and writes no URL',
    (variant) => {
      if (variant === 'page') renderPage(zermatt, last.slug);
      else renderModal(zermatt, last.slug);
      expect(counter()).toHaveTextContent('7 / 7');
      const next = button('Next photo');
      expect(next).not.toHaveAttribute('aria-disabled');

      fireEvent.click(next);
      const heading = screen.getByRole('heading', { name: card.heading, hidden: true });
      if (variant === 'page') expect(heading.tagName).toBe('H1');
      else {
        expect(heading.tagName).toBe('H2');
        expect(heading).toHaveAttribute('id', 'photo-title');
      }
      expect(counter()).toHaveTextContent(/^End$/);
      expect(button('Next photo')).toHaveAttribute('aria-disabled', 'true');
      expect(button('Zoom photo')).toHaveAttribute('aria-disabled', 'true');
      expect(button('Hide labels')).not.toHaveAttribute('aria-disabled');
      expect(button('Previous photo')).not.toHaveAttribute('aria-disabled');
      expect(replaceState).not.toHaveBeenCalled();
      expect(status()).toHaveTextContent(card.announcement);
      expect(status()).toHaveTextContent('End of the Zermatt series. Next region: Ortler, Italy.');
      // The stage and the strip are gone; the sign and All regions are links.
      expect(document.querySelector('[data-photo-box]')).toBeNull();
      expect(
        screen.getByRole('link', { name: 'Ortler, Italy, next region', hidden: true })
      ).toHaveAttribute('href', '/photos/regions/ortler');
      expect(screen.getByRole('link', { name: 'All regions', hidden: true })).toHaveAttribute(
        'href',
        '/photos'
      );
    }
  );

  it('on the card, Next, Zoom and Z do nothing; Hide labels still toggles', () => {
    renderPage(zermatt, last.slug);
    fireEvent.click(button('Next photo'));
    fireEvent.click(button('Next photo'));
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.click(button('Zoom photo'));
    fireEvent.keyDown(document, { key: 'z' });
    expect(button('Zoom photo')).toHaveAttribute('aria-pressed', 'false');
    expect(counter()).toHaveTextContent(/^End$/);
    expect(replaceState).not.toHaveBeenCalled();
    const hide = button('Hide labels');
    const pressed = hide.getAttribute('aria-pressed');
    fireEvent.click(hide);
    expect(hide).not.toHaveAttribute('aria-pressed', pressed ?? '');
    fireEvent.click(hide);
  });

  it('Previous on the card restores photo 7 and writes its URL', () => {
    renderPage(zermatt, last.slug);
    fireEvent.click(button('Next photo'));
    expect(replaceState).not.toHaveBeenCalled();
    fireEvent.click(button('Previous photo'));
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(replaceState).toHaveBeenCalledWith(null, '', `/photos/${last.slug}`);
    expect(counter()).toHaveTextContent('7 / 7');
    expect(screen.getByRole('heading', { level: 1, name: last.title })).toBeInTheDocument();
    expect(button('Next photo')).not.toHaveAttribute('aria-disabled');
    expect(button('Zoom photo')).not.toHaveAttribute('aria-disabled');
    expect(status()).toHaveTextContent(`Photo 7 of 7: ${last.title}`);
  });

  // The lightbox: on the page the viewer keys skip a press outside <main> (keyBelongsToChrome),
  // and this render has no <main>.
  it('← from a focused card link returns to photo 7 with focus on Previous, not the body', () => {
    renderModal(zermatt, last.slug);
    fireEvent.click(button('Next photo'));
    const sign = screen.getByRole('link', { name: 'Ortler, Italy, next region', hidden: true });
    act(() => sign.focus());
    expect(sign).toHaveFocus();
    fireEvent.keyDown(sign, { key: 'ArrowLeft' });
    expect(counter()).toHaveTextContent('7 / 7');
    expect(button('Previous photo')).toHaveFocus();
  });

  it('a one-photo set never reaches a card', () => {
    renderPage(onePhotoSet, newPhoto.slug);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.queryByRole('heading', { name: /^End of the / })).toBeNull();
    expect(status()).not.toHaveTextContent(/End of the/);
  });
});

/**
 * Share / Copy link for the shown photo (18-18; PHOTO-07, D-13), moved to the
 * viewer's top bar at 18-20 (Tim's compact-strip choice; 18-UI-SPEC Contract 4
 * as amended 2026-11-25). Two instances of ShareButton, one per tier, CSS picks
 * the one shown: in the bar after Zoom and before Close, hidden on the scroll
 * tier (the bar has no room for a fifth button at 375 in the lightbox), and in
 * the strip, shown on the scroll tier only. Both copy site.url + photoHref of
 * the shown photo, so a step changes what they copy; the end card has neither.
 */
describe('the Share button follows the shown photo, in the bar from the key tier (18-18, 18-20; PHOTO-07)', () => {
  const barShare = () =>
    document.querySelector<HTMLButtonElement>('[data-viewer-chrome] [data-chrome-share] button');
  const stripShare = () =>
    document.querySelector<HTMLButtonElement>('[data-photo-strip] [data-strip-share] button');

  afterEach(() => {
    delete (navigator as unknown as Record<string, unknown>).clipboard;
  });

  it.each(['page', 'modal'] as const)(
    'the %s variant: the bar Share sits after Zoom (before Close), hidden on the scroll tier; the strip one only on it',
    (variant) => {
      if (variant === 'page') renderPage(zermatt, zermatt[0].slug);
      else renderModal(zermatt, zermatt[0].slug);
      const right = document.querySelector('[data-chrome-right]')!;
      const slot = right.querySelector('[data-chrome-share]')!;
      expect(slot).not.toBeNull();
      expect(slot.className.split(' ')).toContain('lb-scroll:hidden');
      const order = [...right.children].map(
        (el) => el.getAttribute('aria-label') ?? (el.hasAttribute('data-chrome-share') ? 'share' : '?')
      );
      expect(order).toEqual(
        variant === 'page'
          ? ['Hide labels', 'Zoom photo', 'share']
          : ['Hide labels', 'Zoom photo', 'share', 'Close photo']
      );
      expect(barShare()).toHaveAccessibleName('Copy link to this photo');
      expect(barShare()!.className.split(' ')).toContain('lg:min-w-40');

      const stripSlot = document.querySelector('[data-strip-share]')!;
      expect(stripSlot.className.split(' ')).toEqual(
        expect.arrayContaining(['lb-key:hidden', 'lb-gutter:hidden'])
      );
      expect(stripShare()).toHaveAccessibleName('Copy link to this photo');
    }
  );

  it.each([
    ['page', 'bar'],
    ['page', 'strip'],
    ['modal', 'bar'],
    ['modal', 'strip'],
  ] as const)(
    'the %s variant, the %s Share: Next, then Copy link writes the second photo’s canonical URL',
    async (variant, where) => {
      const writeText = jest.fn<Clipboard['writeText']>().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
        writable: true,
      });
      if (variant === 'page') renderPage(zermatt, zermatt[0].slug);
      else renderModal(zermatt, zermatt[0].slug);
      const share = where === 'bar' ? barShare : stripShare;
      expect(share()).not.toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Next photo', hidden: true }));
      expect(counter()).toHaveTextContent(`2 / ${zermatt.length}`);
      await act(async () => {
        fireEvent.click(share()!);
      });

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith(`${site.url}${photoHref(zermatt[1].slug)}`);
    }
  );

  it('the end card shows no Share button in the bar or the strip; Previous brings both back', () => {
    const last = zermatt[zermatt.length - 1];
    renderPage(zermatt, last.slug);
    expect(barShare()).not.toBeNull();
    expect(stripShare()).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Next photo', hidden: true }));
    expect(counter()).toHaveTextContent('End');
    expect(barShare()).toBeNull();
    expect(stripShare()).toBeNull();
    expect(document.querySelector('[data-chrome-share]')).toBeNull();
    expect(document.querySelector('[data-strip-share]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Previous photo', hidden: true }));
    expect(barShare()).not.toBeNull();
    expect(stripShare()).not.toBeNull();
  });

  it('with focus on the bar Share, → steps and keeps focus on it (the button stays mounted)', () => {
    renderModal(zermatt, zermatt[0].slug);
    act(() => barShare()!.focus());
    expect(barShare()).toHaveFocus();
    fireEvent.keyDown(barShare()!, { key: 'ArrowRight' });
    expect(counter()).toHaveTextContent(`2 / ${zermatt.length}`);
    expect(barShare()).toHaveFocus();
  });

  it.each(['page', 'modal'] as const)(
    'the %s variant: with focus on the bar Share, → onto the end card moves focus to Next photo',
    (variant) => {
      const last = zermatt[zermatt.length - 1];
      if (variant === 'page') {
        // The page's viewer keys skip a press outside <main> (keyBelongsToChrome), so
        // the page renders inside one here, as it does in the shell.
        render(
          <PhotoViewer
            variant="page"
            photos={zermatt}
            initialSlug={last.slug}
            back={backFor(zermatt, last.slug)}
            breadcrumb={crumbsFor(last.slug)}
            endCard={cardFor(zermatt, last.slug)}
          />,
          { container: document.body.appendChild(document.createElement('main')) }
        );
      } else renderModal(zermatt, last.slug);
      act(() => barShare()!.focus());
      fireEvent.keyDown(barShare()!, { key: 'ArrowRight' });
      expect(counter()).toHaveTextContent('End');
      expect(screen.getByRole('button', { name: 'Next photo', hidden: true })).toHaveFocus();
    }
  );
});

/**
 * The neighbour preload (13 #33; 18-19): once the stage's large picture has
 * loaded, each neighbour's stage derivative is fetched at low priority in the
 * format the stage actually loaded (its currentSrc: AVIF, else WebP), never the
 * AVIF set unconditionally, with the neighbour's own stageSizes for the surface.
 */
describe('the neighbour preload asks for the format the stage loaded (13 #33; 18-19)', () => {
  let created: HTMLImageElement[];
  let imageSpy: jest.Spied<typeof window.Image>;

  beforeEach(() => {
    created = [];
    imageSpy = jest.spyOn(window, 'Image').mockImplementation(() => {
      const img = document.createElement('img');
      created.push(img);
      return img;
    });
  });

  afterEach(() => {
    imageSpy.mockRestore();
  });

  /** Load the stage's large img as if its <source> of the given format had been chosen. */
  function loadLarge(format: 'avif' | 'webp') {
    const large = document.querySelector<HTMLImageElement>('[data-stage-layer="large"] img');
    expect(large).not.toBeNull();
    Object.defineProperty(large!, 'currentSrc', {
      configurable: true,
      value: `http://localhost/images/photos/stage-1600.0123456789.${format}`,
    });
    fireEvent.load(large!);
  }

  const ratioOf = (v: PhotoView) => v.aspect.w / v.aspect.h;

  it('an AVIF stage in the lightbox preloads the next photo from its AVIF set, with its modal sizes', () => {
    renderModal(zermatt, zermatt[0].slug);
    loadLarge('avif');
    const next = zermatt[1];
    expect(created).toHaveLength(1);
    expect(created[0].srcset).toBe(next.stage.srcSetAvif);
    expect(created[0].sizes).toBe(stageSizes(ratioOf(next), 'modal'));
    expect(created[0].getAttribute('src')).toBe(next.stage.src);
  });

  it('a WebP stage on the page preloads both neighbours from their WebP sets, with their page sizes', () => {
    renderPage(zermatt, zermatt[2].slug);
    loadLarge('webp');
    const neighbours = [zermatt[1], zermatt[3]];
    expect(created).toHaveLength(2);
    for (const [i, view] of neighbours.entries()) {
      expect(created[i].srcset).toBe(view.stage.srcSetWebp);
      expect(created[i].srcset).not.toContain('.avif');
      expect(created[i].sizes).toBe(stageSizes(ratioOf(view), 'page'));
    }
  });

  it('a WebP stage in the lightbox preloads WebP, and a second load preloads nothing again', () => {
    renderModal(zermatt, zermatt[0].slug);
    loadLarge('webp');
    expect(created).toHaveLength(1);
    expect(created[0].srcset).toBe(zermatt[1].stage.srcSetWebp);
    loadLarge('avif');
    expect(created).toHaveLength(1);
  });
});
