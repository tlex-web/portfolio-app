/**
 * The viewer strip (LBOX-04, LBOX-07; D-05, D-07; 10-UI-SPEC "Strip"): title,
 * place and date, story, the EXIF and position lists with sr-only terms, and
 * the rights line, with every missing fact left out and no filler. Rendered
 * with the real photo views; the one fixture is built through
 * buildPhotoViews, so it passes the same order and validation.
 */
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import ExifStrip from '../ExifStrip';
import ShareButton from '../ShareButton';
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { editorial } from '@/data/photos/editorial';
import { site } from '@/data/site';
import { lv95ToWgs84 } from '@/lib/geo';
import { formatCaptureLabel } from '@/lib/photo-format';
import { lv95Line } from '@/lib/photos/lv95-line';
import { photoHref } from '@/lib/photos/routes';
import { buildPhotoViews, photoViews, type PhotoView } from '@/lib/photos/view-model';

const NBSP = ' ';
const FILLER = ['—', 'undefined', 'null', 'NaN', 'unknown'];

const viewOf = (id: string, views: readonly PhotoView[] = photoViews) =>
  views.find((v) => v.id === id)!;

/**
 * The page strip's back target by name (18 D-09). The strip is props only; the
 * photo views here are the v2.0 four, all Zermatt photos, and the page passes
 * photoBack(view.id).name, which photo-viewer.test and regions.test pin.
 */
const BACK_NAME = 'Zermatt';

function renderStrip(view: PhotoView, headingLevel: 1 | 2 = 1) {
  const { container } = render(
    <ExifStrip
      view={view}
      headingLevel={headingLevel}
      backName={headingLevel === 1 ? BACK_NAME : undefined}
    />
  );
  return container;
}

/** The strip's LV95 line (18 D-15): read by format, never as literal digits (16 D-25). */
const LV95_EXACT = /^LV95 E \d’\d{3}’\d{3} N \d’\d{3}’\d{3}$/;
const LV95_APPROX = /^LV95 ≈ E \d’\d{3}’\d{3} N \d’\d{3}’\d{3}$/;

/** The position list's first visual line: Altitude · Position (and the approx note). */
const positionLine = (strip: Element) =>
  strip.querySelector('[data-strip-position]')!.firstElementChild!;

/** An element's text without its sr-only terms: what a sighted reader sees on the line. */
function visibleText(el: Element): string {
  const clone = el.cloneNode(true) as Element;
  clone.querySelectorAll('dt').forEach((dt) => dt.remove());
  return clone.textContent ?? '';
}

describe('ExifStrip fields for every photo (D-05, D-07)', () => {
  it.each(photoViews.map((v) => [v.slug, v] as const))(
    '%s: title, place, story and rights, no filler',
    (_slug, view) => {
      const text = renderStrip(view).textContent ?? '';
      for (const part of [view.title, view.place, view.story, view.rights])
        expect(text).toContain(part);
      for (const filler of FILLER) expect(text).not.toContain(filler);
    }
  );

  it('puts the rights line last among the data rows, followed only by the shortcut legend (LBOX-07)', () => {
    for (const view of photoViews) {
      const rights = renderStrip(view).querySelector('[data-strip-rights]')!;
      expect(rights).toHaveTextContent(view.rights);
      const legend = rights.nextElementSibling!;
      expect(legend).toHaveAttribute('data-strip-legend');
      expect(legend.nextElementSibling).toBeNull();
    }
  });

  it('row 8: the shortcut legend with every key in a kbd, Esc closing or going back to the region (18 D-09)', () => {
    const view = viewOf('img-0605');
    const modal = renderStrip(view, 2).querySelector('[data-strip-legend]')!;
    expect(modal.textContent).toBe('← → photos · Z zoom · H labels · Esc close');
    expect([...modal.querySelectorAll('kbd')].map((k) => k.textContent)).toEqual([
      '←',
      '→',
      'Z',
      'H',
      'Esc',
    ]);
    const page = renderStrip(view, 1).querySelector('[data-strip-legend]')!;
    expect(page.textContent).toBe('← → photos · Z zoom · H labels · Esc back to Zermatt');
    expect(page.textContent).not.toContain('all photographs');
    // Hidden by default: only a hover-capable fine pointer from 768 px shows it.
    expect(page).toHaveClass('hidden');
  });

  it('row 4: the hotspot key slot follows the story in the identity column', () => {
    const { container } = render(
      <ExifStrip
        view={viewOf('img-0605')}
        headingLevel={2}
        hotspotKey={<ul aria-label="Labels" data-testid="key" />}
      />
    );
    const key = container.querySelector('[data-testid="key"]')!;
    expect(key.parentElement).toHaveAttribute('data-strip-identity');
    expect(key.previousElementSibling).toHaveTextContent(viewOf('img-0605').story);
  });

  it('prints place and date with the date in one nowrap tail', () => {
    const date = renderStrip(viewOf('img-0605')).querySelector('[data-strip-date]')!;
    expect(date).toHaveClass('whitespace-nowrap');
    expect(date.parentElement!.textContent).toBe('Zermatt, Switzerland · 6 September 2021, 10:48');
  });
});

describe('ExifStrip lists (LBOX-04)', () => {
  it('img-0605: two lists, six sr-only EXIF terms in order, two EXIF lines and the position line', () => {
    const strip = renderStrip(viewOf('img-0605'));
    expect(strip.querySelectorAll('dl')).toHaveLength(2);

    const exif = strip.querySelector('[data-strip-exif]')!;
    const terms = Array.from(exif.querySelectorAll('dt'));
    expect(terms.map((dt) => dt.textContent)).toEqual([
      'Camera',
      'Lens',
      'Focal length',
      'Aperture',
      'Shutter speed',
      'Sensitivity',
    ]);
    for (const dt of terms) expect(dt).toHaveClass('sr-only');

    const lines = Array.from(exif.querySelectorAll('[data-strip-line]'), visibleText);
    expect(lines).toEqual([
      'Canon EOS 6D Mark II · EF24-105mm f/4L IS II USM',
      `105${NBSP}mm · f/5.6 · 1/500${NBSP}s · ISO 100`,
    ]);

    const position = strip.querySelector('[data-strip-position]')!;
    // A Swiss photo: the Altitude · Position line, then its LV95 line (18 D-14).
    expect(Array.from(position.querySelectorAll('dt'), (dt) => dt.textContent)).toEqual([
      'Altitude',
      'Position',
      'Swiss grid',
    ]);
    expect(visibleText(positionLine(strip))).toBe(`1,617${NBSP}m · 46.0150${NBSP}N 7.7414${NBSP}E`);
    expect(strip.querySelector('[data-strip-film]')).toBeNull();
  });

  it('hides every separator from assistive technology', () => {
    const strip = renderStrip(viewOf('img-0605'));
    const separators = Array.from(strip.querySelectorAll('dl span')).filter((s) =>
      s.textContent?.includes('·')
    );
    expect(separators.length).toBeGreaterThan(0);
    for (const s of separators) expect(s).toHaveAttribute('aria-hidden', 'true');
  });

  it('r004-011: the film line instead of EXIF, the approximate position and the 2019 rights line', () => {
    const strip = renderStrip(viewOf('r004-011'));
    expect(strip.querySelector('[data-strip-exif]')).toBeNull();
    expect(strip.querySelector('[data-strip-film]')).toHaveTextContent('Film scan · 2019');
    // The ±100 m note stays on the position line; the LV95 line below it reads 'LV95 ≈ …'.
    expect(visibleText(positionLine(strip))).toBe(
      `2,760${NBSP}m · ≈ 45.9837${NBSP}N 7.7623${NBSP}E · ±100${NBSP}m (approx.)`
    );
    expect(strip.querySelector('[data-strip-lv95] dd')!.textContent).toMatch(LV95_APPROX);
    expect(strip.querySelector('[data-strip-rights]')).toHaveTextContent(
      '© 2019 Tim Lui, all rights reserved'
    );
  });

  it('leaves out a missing lens, with no empty separator (D-07)', () => {
    const fixture = photos.map((p) =>
      p.id === 'img-0605' ? { ...p, exif: { ...p.exif, lens: null } } : p
    );
    const view = viewOf('img-0605', buildPhotoViews({ photos: fixture, editorial, imageManifest }));
    const exif = renderStrip(view).querySelector('[data-strip-exif]')!;
    expect(exif.querySelectorAll('dt')).toHaveLength(5);
    expect(Array.from(exif.querySelectorAll('[data-strip-line]'), visibleText)).toEqual([
      'Canon EOS 6D Mark II',
      `105${NBSP}mm · f/5.6 · 1/500${NBSP}s · ISO 100`,
    ]);
  });
});

/**
 * 16 D-01 / DATA-14 (T-16-12): a coarse position reads through the existing
 * approximate treatment (the '≈' sign and the radius note, no new markup) at
 * its own precision. The photo is synthetic: img-0605's facts with a '3dp'
 * position at the WGS84 of a synthetic LV95 point (the LV95 origin), rounded to
 * three decimals as extraction would store it; no photo's position is used.
 */
describe('ExifStrip for a coarse position (16 D-01)', () => {
  const round3 = (v: number) => Math.round(v * 1e3) / 1e3;
  const origin = lv95ToWgs84({ e: 2_600_000, n: 1_200_000 });
  const synthetic = {
    lat: round3(origin.lat),
    lon: round3(origin.lon),
    precision: '3dp' as const,
    source: 'exif' as const,
    approximate: true,
    reason: 'Synthetic coarse test position',
    radiusM: 100,
  };

  it('prints a 3dp position with the approximate sign, three decimals per half and the 100 m note', () => {
    const fixture = photos.map((p) => (p.id === 'img-0605' ? { ...p, position: synthetic } : p));
    const view = viewOf('img-0605', buildPhotoViews({ photos: fixture, editorial, imageManifest }));
    const strip = renderStrip(view);
    const coordinates = `${synthetic.lat.toFixed(3)}${NBSP}N ${synthetic.lon.toFixed(3)}${NBSP}E`;

    // A coarse height was rounded at extraction (16 D-03), so it reads approx. too.
    expect(visibleText(positionLine(strip))).toBe(
      `1,617${NBSP}m approx. · ≈ ${coordinates} · ±100${NBSP}m (approx.)`
    );
    const value = view.strip.positionRows.find((r) => r.term === 'Position')!.value;
    expect(value.startsWith('≈ ')).toBe(true);
    expect(value).toMatch(new RegExp(`^≈ \\d+\\.\\d{3}${NBSP}N \\d+\\.\\d{3}${NBSP}E$`));
    expect(view.strip.approxNote).toBe(`±100${NBSP}m (approx.)`);
    // Its LV95 line follows at the 3dp grid, 100 m (18 D-15).
    const lv95 = strip.querySelector('[data-strip-lv95] dd')!.textContent!;
    expect(lv95).toMatch(LV95_APPROX);
    for (const m of lv95.matchAll(/\d’\d{3}’\d{3}/g)) {
      expect(Number(m[0].replaceAll('’', '')) % 100).toBe(0);
    }
  });
});

/**
 * The LV95 line (18-18; PHOTO-08, D-14, D-15; UI-SPEC Contract 4): its own
 * visual line in the position list, after the Altitude · Position line, with
 * the sr-only term 'Swiss grid' and the list's mono style. Swiss photos only.
 */
describe('ExifStrip LV95 line (18-18; PHOTO-08)', () => {
  it.each(photoViews.map((v) => [v.slug, v] as const))(
    '%s: the LV95 line renders after the position line with an sr-only Swiss grid term',
    (_slug, view) => {
      const strip = renderStrip(view);
      const list = strip.querySelector('[data-strip-position]')!;
      const row = strip.querySelector('[data-strip-lv95]')!;
      expect(row).not.toBeNull();
      // Inside the position list, directly after the Altitude · Position line, last.
      expect(row.parentElement).toBe(list);
      expect(row.previousElementSibling).toBe(list.firstElementChild);
      expect(row.nextElementSibling).toBeNull();
      expect(list).toHaveClass('font-mono', 'text-sm', 'text-ink', 'tabular-nums');
      const dt = row.querySelector('dt')!;
      expect(dt).toHaveTextContent('Swiss grid');
      expect(dt).toHaveClass('sr-only');
      const dd = row.querySelector('dd')!;
      expect(dd.textContent).toBe(view.strip.lv95);
      expect(dd.textContent).toMatch(view.strip.approxNote ? LV95_APPROX : LV95_EXACT);
      expect(dd.textContent).toBe(lv95Line(photos.find((p) => p.id === view.id)!.position, 'CH'));
    }
  );

  it('a photo outside Switzerland has no LV95 line and no Swiss grid term (D-14)', () => {
    const fixture = photos.map((p) => (p.id === 'img-0605' ? { ...p, country: 'IT' as const } : p));
    const view = viewOf('img-0605', buildPhotoViews({ photos: fixture, editorial, imageManifest }));
    const strip = renderStrip(view);
    expect(strip.querySelector('[data-strip-lv95]')).toBeNull();
    expect(strip.textContent).not.toContain('Swiss grid');
    expect(strip.textContent).not.toContain('LV95');
    // The position line itself is unchanged.
    expect(visibleText(positionLine(strip))).toBe(`1,617${NBSP}m · 46.0150${NBSP}N 7.7414${NBSP}E`);
  });
});

describe('ExifStrip heading and controls', () => {
  it('renders the title as the h1 on the page surface', () => {
    const strip = renderStrip(viewOf('img-0629'), 1);
    const h1 = strip.querySelector('h1')!;
    expect(h1).toHaveTextContent(viewOf('img-0629').title);
    expect(h1).not.toHaveAttribute('id');
    expect(strip.querySelector('h2')).toBeNull();
  });

  it('renders the title as h2#photo-title on the modal surface (the dialog label)', () => {
    const strip = renderStrip(viewOf('img-0629'), 2);
    expect(strip.querySelector('h2#photo-title')).toHaveTextContent(viewOf('img-0629').title);
    expect(strip.querySelector('h1')).toBeNull();
  });

  it('the page strip needs its back name; the lightbox strip does not (18 D-09)', () => {
    const view = viewOf('img-0629');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => render(<ExifStrip view={view} headingLevel={1} />)).toThrow(
        new RangeError(`ExifStrip: the page strip needs backName (18 D-09), none for ${view.slug}`)
      );
    } finally {
      jest.restoreAllMocks();
    }
    expect(() => render(<ExifStrip view={view} headingLevel={2} />)).not.toThrow();
  });

  /** The page's trail for a v2.0 photo, as the page passes it (photoBreadcrumb, last without href). */
  const crumbsFor = (view: PhotoView) => [
    { name: 'Photographs', href: '/photos' },
    { name: BACK_NAME, href: '/photos/regions/zermatt' },
    { name: view.title },
  ];

  it('the page breadcrumb sits above the h1 in the identity column (18-17; D-10, UI E10)', () => {
    const view = viewOf('img-0629');
    const { container } = render(
      <ExifStrip view={view} headingLevel={1} backName={BACK_NAME} breadcrumb={crumbsFor(view)} />
    );
    const identity = container.querySelector('[data-strip-identity]')!;
    const nav = identity.querySelector('nav[aria-label="Breadcrumb"]')!;
    expect(nav).not.toBeNull();
    expect(nav).toHaveClass('mb-2');
    // First child of the identity column, directly before the h1.
    expect(identity.firstElementChild).toBe(nav);
    expect(nav.nextElementSibling?.tagName).toBe('H1');
    // Two links, then the current title as plain text; separators aria-hidden.
    const links = [...nav.querySelectorAll('a')];
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Photographs', '/photos'],
      [BACK_NAME, '/photos/regions/zermatt'],
    ]);
    for (const a of links) expect(a).toHaveClass('min-h-11');
    const current = nav.querySelector('[aria-current="page"]')!;
    expect(current.tagName).toBe('SPAN');
    expect(current).toHaveTextContent(view.title);
    expect([...nav.querySelectorAll('[aria-hidden="true"]')].map((s) => s.textContent)).toEqual([
      '/',
      '/',
    ]);
    // Long titles wrap: the row is flex-wrap and nothing truncates.
    expect(nav.querySelector('ol')).toHaveClass('flex-wrap');
    expect(nav.innerHTML).not.toMatch(/truncate|text-ellipsis|line-clamp/);
  });

  it('the lightbox strip renders no breadcrumb even when one is passed (D-10: page only)', () => {
    const view = viewOf('img-0629');
    const { container } = render(
      <ExifStrip view={view} headingLevel={2} breadcrumb={crumbsFor(view)} />
    );
    expect(container.querySelector('nav')).toBeNull();
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('holds no link and no download control without a breadcrumb (LBOX-07)', () => {
    for (const view of photoViews) {
      const strip = renderStrip(view);
      expect(strip.querySelectorAll('a')).toHaveLength(0);
      expect(strip.querySelectorAll('[download]')).toHaveLength(0);
    }
  });
});

/**
 * The capture label on the strip (D-03, RESEARCH Pitfall 6). Rewritten in
 * 10-09 from the three ImageDetailModal tests (the v1 modal and its file were
 * deleted with the legacy photo UI): a year-only capture stays the year and is
 * never turned into a locale date, an EXIF capture prints exactly as
 * formatCaptureLabel stored it, and the place and date line joins them once.
 */
describe('capture label (rewritten from the ImageDetailModal tests, D-03)', () => {
  const MONTHS =
    /January|February|March|April|May|June|July|August|September|October|November|December/;
  const LOCALE_DATE = /\d{1,2}\/\d{1,2}\/\d{4}/;
  const dateOf = (container: Element) =>
    (container.querySelector('[data-strip-date]')!.textContent ?? '').replace(/^ · /, '');

  it("shows the film scan's year-only capture as '2019', never as a locale date", () => {
    const container = renderStrip(viewOf('r004-011'));
    const date = dateOf(container);
    expect(date).toBe('2019');
    expect(date).not.toMatch(MONTHS);
    expect(container.textContent).not.toContain('1 January');
    expect(container.textContent).not.toMatch(LOCALE_DATE);
  });

  it('shows a digital capture exactly as formatCaptureLabel stored it (wall time, no conversion)', () => {
    for (const view of photoViews.filter((v) => v.id !== 'r004-011')) {
      const capture = photos.find((p) => p.id === view.id)!.capture;
      expect(dateOf(renderStrip(view))).toBe(formatCaptureLabel(capture));
    }
  });

  it("joins place and date with exactly one ' · ' for every photo", () => {
    for (const view of photoViews) {
      const line = renderStrip(view).querySelector('[data-strip-date]')!.parentElement!;
      const text = line.textContent ?? '';
      expect(text.split(' · ')).toHaveLength(2);
      expect(text).toBe(`${view.strip.placeDate.place} · ${view.strip.placeDate.date}`);
    }
  });
});

/**
 * The strip's Share / Copy link slot (18-18; PHOTO-07, D-13; UI-SPEC Contract
 * 4): PhotoViewer fills it with ShareButton for the shown photo (subject
 * photo, gallery surface). The slot is the data column's last row, mt-4 after
 * the rights line and the legend; the server HTML is copy mode.
 */
describe('ExifStrip share slot (18-18; PHOTO-07)', () => {
  const view = viewOf('img-0605');
  const share = (
    <ShareButton
      url={`${site.url}${photoHref(view.slug)}`}
      title={`${view.title} · ${site.name}`}
      subject="photo"
      surface="gallery"
    />
  );

  it.each([1, 2] as const)(
    'heading level %i: the button ends the data column, after the rights line, mt-4',
    (level) => {
      const { container } = render(
        <ExifStrip
          view={view}
          headingLevel={level}
          backName={level === 1 ? BACK_NAME : undefined}
          share={share}
        />
      );
      const data = container.querySelector('[data-strip-data]')!;
      const slot = data.querySelector('[data-strip-share]')!;
      expect(slot).not.toBeNull();
      expect(data.lastElementChild).toBe(slot);
      expect(slot).toHaveClass('mt-4');
      // Rights, then the legend, then the one action.
      expect(slot.previousElementSibling).toHaveAttribute('data-strip-legend');
      expect(slot.previousElementSibling!.previousElementSibling).toHaveAttribute(
        'data-strip-rights'
      );
      const button = slot.querySelector('button')!;
      expect(button).toHaveAccessibleName('Copy link to this photo');
      expect(button).toHaveClass('hover:border-ink-muted');
    }
  );

  it("the server HTML holds the copy-mode button named 'Copy link to this photo'", () => {
    const html = renderToString(
      <ExifStrip view={view} headingLevel={1} backName={BACK_NAME} share={share} />
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const button = doc.querySelector('[data-strip-share] button')!;
    expect(button).not.toBeNull();
    expect(button.getAttribute('aria-label')).toBe('Copy link to this photo');
    expect(button.getAttribute('data-share-mode')).toBe('copy');
    expect(button.textContent).toBe('Copy link');
  });

  it('without the slot the strip renders no share row and no button', () => {
    const strip = renderStrip(view);
    expect(strip.querySelector('[data-strip-share]')).toBeNull();
    expect(strip.querySelectorAll('button')).toHaveLength(0);
  });
});
