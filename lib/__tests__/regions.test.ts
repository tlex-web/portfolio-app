/**
 * @jest-environment node
 */
/**
 * The server-only region model (REGION-07; D-11, D-14, D-17).
 *
 * - The copy is Tim's approved text (17-01 Task 2, recorded verbatim in
 *   17-01-SUMMARY.md "D-14 copy (Tim's reply, verbatim)"), typed here
 *   literally, like seo.spec's Roadmap description: a change to the copy
 *   templates fails this test instead of shipping unapproved text. The
 *   strings carry U+00A0 where the page prints it (before 'm' in a height,
 *   after 'ground'), written as   so the bytes are visible.
 * - Everything else is derived from the data: the rights line from the
 *   region's capture years, the one-photo description, the photo order.
 *
 * 17-16 adds the D-03 collision rows to this file.
 */
import { formatYearRange } from '@/lib/home-format';
import { seriesInput } from '@/lib/photos/view-model';
import {
  regionById,
  regionDescription,
  regionIds,
  regionMetadata,
  regionOgAlt,
  regionPhotoViews,
  regionRights,
  regionTitle,
  regionYears,
} from '@/lib/regions';

/** Tim's approved copy per region (D-14), verbatim. */
const APPROVED = {
  ortler: {
    title: 'Ortler, Italy',
    description: '2 photographs by Tim Lui from Ortler, Italy, at 2,190–2,520 m, 2016.',
    ogAlt: 'Ortler, 2 photographs by Tim Lui. Italy, 2,190–2,520 m',
    rights: '© 2016 Tim Lui, all rights reserved',
  },
  saalfelden: {
    title: 'Saalfelden, Austria',
    description:
      '2 aerial photographs by Tim Lui over Saalfelden, Austria, ground 820–880 m, 2026.',
    ogAlt: 'Saalfelden, 2 photographs by Tim Lui. Austria, ground 820–880 m',
    rights: '© 2026 Tim Lui, all rights reserved',
  },
  zermatt: {
    title: 'Zermatt, Switzerland',
    description:
      '7 photographs by Tim Lui from Zermatt, Switzerland, at 1,617–2,928 m, 2019–2024.',
    ogAlt: 'Zermatt, 7 photographs by Tim Lui. Switzerland, 1,617–2,928 m',
    rights: '© 2019–2024 Tim Lui, all rights reserved',
  },
} as const;

describe("Tim's approved region copy (D-14)", () => {
  it('pins every registry region, and only those', () => {
    expect([...regionIds].sort()).toEqual(Object.keys(APPROVED).sort());
  });

  describe.each(Object.entries(APPROVED))('%s', (id, copy) => {
    it('has the approved title, rendered as "{title} · Tim Lui" by the root template', () => {
      expect(regionTitle(id)).toBe(copy.title);
      expect(regionMetadata(id).title).toBe(copy.title);
    });

    it('has the approved meta description', () => {
      expect(regionMetadata(id).description).toBe(copy.description);
    });

    it('has the approved OG alt text (17-07 reads it)', () => {
      expect(regionOgAlt(id)).toBe(copy.ogAlt);
    });

    it('prints the approved rights line, the span of its capture years (D-17)', () => {
      expect(regionRights(id)).toBe(copy.rights);
      expect(regionRights(id)).toBe(
        '© ' + formatYearRange(regionYears(id)) + ' Tim Lui, all rights reserved'
      );
    });

    it('has its absolute-ready canonical path /photos/regions/<id> (D-15)', () => {
      expect(regionMetadata(id).alternates?.canonical).toBe('/photos/regions/' + id);
    });
  });

  it('gives an unknown id no metadata', () => {
    expect(regionMetadata('nowhere')).toEqual({});
  });
});

describe('the description for a one-photo region (REGION-07 edge: empty and single)', () => {
  it("says '1 photograph' and prints its altitude once", () => {
    const text = regionDescription({
      name: 'Ortler',
      country: 'IT',
      views: [{ altitudeM: 2190, aerial: false, years: 2016 }],
    });
    expect(text).toBe('1 photograph by Tim Lui from Ortler, Italy, at 2,190 m, 2016.');
  });

  it("says '1 aerial photograph' for a single aerial photo", () => {
    const text = regionDescription({
      name: 'Saalfelden',
      country: 'AT',
      views: [{ altitudeM: 820, aerial: true, years: 2026 }],
    });
    expect(text).toBe(
      '1 aerial photograph by Tim Lui over Saalfelden, Austria, ground 820 m, 2026.'
    );
  });

  it('throws seriesInput’s RangeError, naming the region, for a region with no photo', () => {
    expect(() => seriesInput('nowhere')).toThrow(RangeError);
    expect(() => seriesInput('nowhere')).toThrow(/nowhere/);
  });
});

describe('region photo order (PHOTO-05 ordering, region half)', () => {
  it.each(regionIds.map((id) => [id]))(
    '%s lists its photos by DEM height ascending, ties broken by photo id',
    (id) => {
      const views = regionPhotoViews(id);
      expect(views.length).toBeGreaterThan(0);
      const sorted = [...views].sort(
        (a, b) => a.altitudeM - b.altitudeM || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      );
      expect(views.map((v) => v.id)).toEqual(sorted.map((v) => v.id));
    }
  );

  it('matches region ids exactly and case-sensitively', () => {
    expect(regionById('zermatt')?.id).toBe('zermatt');
    expect(regionById('Zermatt')).toBeUndefined();
  });
});
