/**
 * The viewer strip (LBOX-04, LBOX-07; D-05, D-07; 10-UI-SPEC "Strip"): title,
 * place and date, story, the EXIF and position lists with sr-only terms, and
 * the rights line, with every missing fact left out and no filler. Rendered
 * with the real photo views; the one fixture is built through
 * buildPhotoViews, so it passes the same order and validation.
 */
import { render } from '@testing-library/react';
import ExifStrip from '../ExifStrip';
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { editorial } from '@/data/photos/editorial';
import { formatCaptureLabel } from '@/lib/photo-format';
import { buildPhotoViews, photoViews, type PhotoView } from '@/lib/photos/view-model';

const NBSP = ' ';
const FILLER = ['—', 'undefined', 'null', 'NaN', 'unknown'];

const viewOf = (id: string, views: readonly PhotoView[] = photoViews) =>
  views.find((v) => v.id === id)!;

function renderStrip(view: PhotoView, headingLevel: 1 | 2 = 1) {
  const { container } = render(<ExifStrip view={view} headingLevel={headingLevel} />);
  return container;
}

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

  it('row 8: the shortcut legend with every key in a kbd, Esc closing or going to all photographs', () => {
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
    expect(page.textContent).toBe('← → photos · Z zoom · H labels · Esc all photographs');
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
    expect(Array.from(position.querySelectorAll('dt'), (dt) => dt.textContent)).toEqual([
      'Altitude',
      'Position',
    ]);
    expect(visibleText(position)).toBe(`1,617${NBSP}m · 46.0150${NBSP}N 7.7414${NBSP}E`);
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
    expect(visibleText(strip.querySelector('[data-strip-position]')!)).toBe(
      `2,760${NBSP}m · ≈ 45.9837${NBSP}N 7.7623${NBSP}E · ±100${NBSP}m (approx.)`
    );
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

  it('holds no link and no download control (LBOX-07)', () => {
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
