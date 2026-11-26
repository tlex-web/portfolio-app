/**
 * One sequence figure and the sequence band (18-08; REGION-03, REGION-04,
 * D-07; 18-UI-SPEC Contract 2 "Sequence", "Figure = map collar", UI E5).
 * Rendered from real data; the collar is compared with the view's own strip
 * values, so this file holds no coordinate (16 D-25). collarParts' unit rows
 * use placeholder values.
 */
import { render, within } from '@testing-library/react';
import RegionSequence, { sequenceCountLabel } from '../RegionSequence';
import SequenceFigure, { collarParts } from '../SequenceFigure';
import { figureSizes } from '@/lib/photos/image-sizes';
import type { PhotoView } from '@/lib/photos/view-model';
import { regionIds, regionPhotoViews, regionRights } from '@/lib/regions';

const NBSP = String.fromCharCode(0xa0);

/** A strip with placeholder values only. */
function strip(over: Partial<PhotoView['strip']>): PhotoView['strip'] {
  return {
    placeDate: { place: 'Place', date: '2020' },
    exifRows: [],
    filmLine: null,
    positionRows: [],
    approxNote: null,
    lv95: null,
    ...over,
  };
}

describe('collarParts (Contract 2 "Top collar", Contract 5)', () => {
  it('prints the Position value as the strip holds it', () => {
    const rows = [
      { term: 'Altitude', value: '1,000 m' },
      { term: 'Position', value: 'POS-EXACT' },
    ] as const;
    expect(collarParts(strip({ positionRows: rows }))).toEqual(['POS-EXACT']);
  });

  it('never prints the LV95 line: collars show WGS84 for every photo (18 D-14)', () => {
    const s = strip({
      positionRows: [{ term: 'Position', value: 'POS-EXACT' }],
      lv95: 'LV95-PLACEHOLDER',
    });
    expect(collarParts(s)).toEqual(['POS-EXACT']);
  });

  it('adds the radius for an approximate position with one', () => {
    const s = strip({
      positionRows: [{ term: 'Position', value: '≈ POS-APPROX' }],
      approxNote: `±100${NBSP}m (approx.)`,
    });
    expect(collarParts(s)).toEqual(['≈ POS-APPROX', `±100${NBSP}m`]);
  });

  it('prints the position alone for an approximate one without a radius', () => {
    const s = strip({
      positionRows: [{ term: 'Position', value: '≈ POS-APPROX' }],
      approxNote: '(approx.)',
    });
    expect(collarParts(s)).toEqual(['≈ POS-APPROX']);
  });

  it('is null without a position (no collar line, nothing reserved)', () => {
    expect(collarParts(strip({ positionRows: [{ term: 'Altitude', value: '1,000 m' }] }))).toBe(
      null
    );
  });
});

describe('sequenceCountLabel (UI E5/zero-one-many)', () => {
  it.each([
    [1, '1 photograph, lowest first'],
    [2, '2 photographs, lowest first'],
    [7, '7 photographs, lowest first'],
  ])('%i -> %s', (n, label) => {
    expect(sequenceCountLabel(n)).toBe(label);
  });
});

const ALL = regionIds.flatMap((id) => regionPhotoViews(id).map((view) => [id, view] as const));

describe('SequenceFigure', () => {
  it.each(ALL.map(([id, view]) => [`${id}/${view.slug}`, view] as const))(
    '%s: collar, neatline, lazy uncropped image, caption',
    (_name, view) => {
      const { container } = render(
        <ol>
          <SequenceFigure view={view} n={2} N={5} />
        </ol>
      );
      const li = container.querySelector('li')!;
      expect(li).toHaveAttribute('id', `photo-${view.slug}`);
      expect(li).toHaveAttribute('tabindex', '-1');
      expect(li).toHaveAttribute('data-sequence-item', view.slug);

      // Collar: the strip's own Position value (its precision), or no element at all.
      const collar = li.querySelector('[data-figure-collar]');
      const parts = collarParts(view.strip);
      if (parts) {
        expect(collar?.textContent).toBe(parts.join(' · '));
        // Latitude before longitude, the strip's order (U+00A0 inside each value).
        expect(collar?.textContent).toMatch(/\d\sN\s+\d.*\d\sE/);
      } else {
        expect(collar).toBeNull();
      }

      // Eight aria-hidden ticks, outside the image box's subtree.
      const ticks = li.querySelectorAll('[data-figure-tick]');
      expect(ticks).toHaveLength(8);
      expect(li.querySelector('[data-figure-ticks]')).toHaveAttribute('aria-hidden', 'true');
      expect(li.querySelector('[data-figure-box] [data-figure-tick]')).toBeNull();

      // The link: data-photo-id, the photo page, the alt plus the viewer hint.
      const link = within(li).getByRole('link');
      expect(link).toHaveAttribute('href', `/photos/${view.slug}`);
      expect(link).toHaveAttribute('data-photo-id', view.slug);
      expect(link).toHaveAccessibleName(`${view.alt}, open in the photo viewer`);

      const img = li.querySelector('img')!;
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveAttribute('decoding', 'async');
      expect(img).toHaveAttribute('alt', view.alt);
      expect(img).toHaveAttribute('width', String(view.stage.width));
      expect(img).toHaveAttribute('height', String(view.stage.height));
      expect(img.className).toContain('object-contain');
      expect(img.className).not.toContain('object-cover');
      const sizes = figureSizes(view.aspect.w / view.aspect.h);
      expect(img).toHaveAttribute('sizes', sizes);
      for (const source of li.querySelectorAll('source')) {
        expect(source).toHaveAttribute('sizes', sizes);
      }

      // Caption: title, then 'n / N' (phone only, aria-hidden) and the data parts.
      const caption = li.querySelector('figcaption')!;
      expect(caption.querySelector('p')?.textContent).toBe(view.title);
      const counter = caption.querySelector('[data-figure-counter]')!;
      expect(counter).toHaveAttribute('aria-hidden', 'true');
      expect(counter.className).toContain('md:hidden');
      expect(caption.querySelector('[data-figure-data]')?.textContent).toBe(
        `2 / 5 · ${view.shortPlace} · ${view.altitudeLabel} · ${view.captureMonth}`
      );

      // EXIF lines as the strip has them, or the film line; never a dash.
      if (view.strip.filmLine) {
        expect(caption.querySelector('[data-figure-film]')?.textContent).toBe(view.strip.filmLine);
      }
      const exif = caption.querySelector('[data-figure-exif]');
      if (view.strip.exifRows.length > 0) {
        for (const row of view.strip.exifRows) expect(exif?.textContent).toContain(row.value);
      } else {
        expect(exif).toBeNull();
      }
      expect(caption.textContent).not.toMatch(/—|undefined|null|NaN/);
    }
  );
});

describe('RegionSequence', () => {
  it.each(regionIds.map((id) => [id] as const))(
    '%s: the band, the ordered list, the rail column and the rights line',
    (id) => {
      const views = regionPhotoViews(id);
      const { container } = render(<RegionSequence id={id} />);
      const band = container.querySelector('section[data-region-sequence]') as HTMLElement;
      expect(band.className).toContain('bg-gallery');
      expect(within(band).getByRole('heading', { level: 2, name: 'Photographs' })).toBeVisible();
      expect(band.querySelector('[data-sequence-count]')?.textContent).toBe(
        sequenceCountLabel(views.length)
      );
      expect(within(band).getByRole('link', { name: 'Skip to next region' })).toHaveAttribute(
        'href',
        '#next-region'
      );
      const items = [...band.querySelectorAll('ol[aria-label] > li')].map((li) =>
        li.getAttribute('data-sequence-item')
      );
      expect(items).toEqual(views.map((v) => v.slug));
      expect(band.querySelector('[data-region-rail-column]')).not.toBeNull();
      // Pitfall 10: nothing in the band clips overflow (the rail column's sticky box).
      expect(band.innerHTML).not.toMatch(/overflow-(hidden|auto|scroll)/);
      expect(band.textContent).toContain(regionRights(id));
    }
  );
});
