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
import { buildPhotoViews, photoViews, type PhotoView } from '@/lib/photos/view-model';

const NBSP = ' ';
const FILLER = ['—', 'undefined', 'null', 'NaN', 'unknown'];

const viewOf = (id: string, views: readonly PhotoView[] = photoViews) => views.find((v) => v.id === id)!;

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
  it.each(photoViews.map((v) => [v.slug, v] as const))('%s: title, place, story and rights, no filler', (_slug, view) => {
    const text = renderStrip(view).textContent ?? '';
    for (const part of [view.title, view.place, view.story, view.rights]) expect(text).toContain(part);
    for (const filler of FILLER) expect(text).not.toContain(filler);
  });

  it('puts the rights line last in the data column (LBOX-07)', () => {
    for (const view of photoViews) {
      const rights = renderStrip(view).querySelector('[data-strip-rights]')!;
      expect(rights).toHaveTextContent(view.rights);
      expect(rights.nextElementSibling).toBeNull();
    }
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
    expect(Array.from(position.querySelectorAll('dt'), (dt) => dt.textContent)).toEqual(['Altitude', 'Position']);
    expect(visibleText(position)).toBe(`1,617${NBSP}m · 46.0150${NBSP}N 7.7414${NBSP}E`);
    expect(strip.querySelector('[data-strip-film]')).toBeNull();
  });

  it('hides every separator from assistive technology', () => {
    const strip = renderStrip(viewOf('img-0605'));
    const separators = Array.from(strip.querySelectorAll('dl span')).filter((s) => s.textContent?.includes('·'));
    expect(separators.length).toBeGreaterThan(0);
    for (const s of separators) expect(s).toHaveAttribute('aria-hidden', 'true');
  });

  it('r004-011: the film line instead of EXIF, the approximate position and the 2019 rights line', () => {
    const strip = renderStrip(viewOf('r004-011'));
    expect(strip.querySelector('[data-strip-exif]')).toBeNull();
    expect(strip.querySelector('[data-strip-film]')).toHaveTextContent('Film scan · 2019');
    expect(visibleText(strip.querySelector('[data-strip-position]')!)).toBe(
      `2,760${NBSP}m · ≈ 45.9837${NBSP}N 7.7623${NBSP}E · ±100${NBSP}m (approx.)`,
    );
    expect(strip.querySelector('[data-strip-rights]')).toHaveTextContent('© 2019 Tim Lui, all rights reserved');
  });

  it('leaves out a missing lens, with no empty separator (D-07)', () => {
    const fixture = photos.map((p) => (p.id === 'img-0605' ? { ...p, exif: { ...p.exif, lens: null } } : p));
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
