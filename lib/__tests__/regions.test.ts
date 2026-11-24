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
 * - D-03 (17-16): region ids, photo slugs and the reserved segments under
 *   /photos never collide; see the describe at the end of the file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { NEUTRAL_SLUG } from '../../proxy';
import { editorial } from '@/data/photos/editorial';
import { formatYearRange } from '@/lib/home-format';
import { seriesInput } from '@/lib/photos/view-model';
import {
  regionById,
  regionCover,
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
    description: '7 photographs by Tim Lui from Zermatt, Switzerland, at 1,617–2,928 m, 2019–2024.',
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

/**
 * D-13: each region's cover is Tim's pick (17-07 Task 1, his reply recorded
 * verbatim in 17-07-SUMMARY.md "D-13 covers (Tim's reply, verbatim)"), typed
 * here literally so a changed cover fails instead of shipping unpicked.
 */
const TIM_COVERS = {
  ortler: 'meadow-stream-below-the-peaks',
  saalfelden: 'castle-below-limestone-peaks',
  zermatt: 'matterhorn-from-zermatt',
} as const;

type RegionsModule = typeof import('@/lib/regions');

describe("each region's cover (D-13)", () => {
  it('pins every registry region, and only those', () => {
    expect([...regionIds].sort()).toEqual(Object.keys(TIM_COVERS).sort());
  });

  it.each(Object.entries(TIM_COVERS))(
    "%s: regionCover is the view in regionPhotoViews whose id is the registry's cover (%s)",
    (id, slug) => {
      const cover = regionCover(id);
      expect(cover.slug).toBe(slug);
      expect(cover.id).toBe(regionById(id)?.cover);
      expect(regionPhotoViews(id).find((v) => v.id === regionById(id)?.cover)).toBe(cover);
    }
  );

  it('throws RangeError for an id that is not in the registry', () => {
    expect(() => regionCover('nowhere')).toThrow(RangeError);
    expect(() => regionCover('Zermatt')).toThrow(/Zermatt/);
  });

  it("throws at module load, naming the region and data/regions/regions.json, for a cover from another region", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@/data/regions/regions.json', () => {
        const actual = jest.requireActual<{ schemaVersion: 1; regions: { id: string }[] }>(
          '@/data/regions/regions.json'
        );
        return {
          ...actual,
          regions: actual.regions.map((r) =>
            r.id === 'saalfelden' ? { ...r, cover: 'img-0605' } : r
          ),
        };
      });
      let error: unknown;
      try {
        await import('@/lib/regions');
      } catch (e) {
        error = e;
      } finally {
        // doMock outlives isolateModulesAsync; the next row loads the committed registry.
        jest.dontMock('@/data/regions/regions.json');
      }
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/saalfelden/);
      expect((error as Error).message).toMatch(/img-0605/);
      expect((error as Error).message).toContain('data/regions/regions.json');
    });
  });

  it('loads cleanly with the committed registry (the throw above is the mock, not the data)', async () => {
    await jest.isolateModulesAsync(async () => {
      const mod: RegionsModule = await import('@/lib/regions');
      expect(mod.regionCover('zermatt').slug).toBe(TIM_COVERS.zermatt);
    });
  });
});

/**
 * D-03: a region id never collides with a photo slug or a reserved segment.
 *
 * A region id is a public URL segment (/photos/regions/<id>) beside the photo
 * slugs (/photos/<slug>) and the static segments under /photos. Once indexed,
 * the choice is one-way: renaming an id or a slug changes a public URL, so a
 * collision must fail here before any plan publishes it.
 *
 * The reserved set is 'regions', the proxy's NEUTRAL_SLUG (the slug a 404 is
 * rendered under), 'opengraph-image' (the per-photo OG card segment), and the
 * name of every directory under app/(site)/photos that adds a static URL
 * segment. That last part is read from the file system at test time, never
 * typed: a new static directory joins the set with no edit here. Directories
 * whose names start with '[' (dynamic segments), '@' (parallel-route slots) or
 * '(' (route groups) add no static segment and are skipped.
 *
 * Photo slugs are every editorial slug (one per generated photo), the published
 * set, independent of which photos the light table shows.
 */
describe('D-03: region ids never collide with a photo slug or a reserved segment', () => {
  const PHOTOS_DIR = path.join(process.cwd(), 'app', '(site)', 'photos');

  /** Directory names under app/(site)/photos that are static URL segments. */
  const staticSegments = fs
    .readdirSync(PHOTOS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !/^[[@(]/.test(entry.name))
    .map((entry) => entry.name);

  const reserved = [...new Set(['regions', NEUTRAL_SLUG, 'opengraph-image', ...staticSegments])];
  const photoSlugs = Object.values(editorial).map((e) => e.slug);

  /**
   * Every value that appears in more than one of the named lists, with the
   * names of the lists it appears in (in the order given), sorted by value.
   */
  function collisions(lists: Record<string, readonly string[]>): { value: string; in: string[] }[] {
    const seen = new Map<string, string[]>();
    for (const [name, values] of Object.entries(lists)) {
      for (const value of new Set(values)) {
        seen.set(value, [...(seen.get(value) ?? []), name]);
      }
    }
    return [...seen]
      .filter(([, names]) => names.length > 1)
      .map(([value, names]) => ({ value, in: names }))
      .sort((a, b) => (a.value < b.value ? -1 : a.value > b.value ? 1 : 0));
  }

  it('reads the static segments from the file system (it sees the regions directory)', () => {
    expect(staticSegments).toContain('regions');
    expect(reserved).toEqual(expect.arrayContaining(['regions', NEUTRAL_SLUG, 'opengraph-image']));
  });

  it('has no duplicate region id and no duplicate photo slug', () => {
    expect(new Set(regionIds).size).toBe(regionIds.length);
    expect(new Set(photoSlugs).size).toBe(photoSlugs.length);
  });

  it('keeps region ids, photo slugs and reserved segments pairwise disjoint', () => {
    expect(collisions({ 'region ids': regionIds, 'photo slugs': photoSlugs, reserved })).toEqual(
      []
    );
  });

  it('reports a region id equal to a photo slug (the check can fail)', () => {
    const slug = photoSlugs[0];
    expect(collisions({ 'region ids': [...regionIds, slug], 'photo slugs': photoSlugs })).toEqual([
      { value: slug, in: ['region ids', 'photo slugs'] },
    ]);
  });

  it('reports a photo slug equal to a reserved segment', () => {
    expect(collisions({ 'photo slugs': [...photoSlugs, NEUTRAL_SLUG], reserved })).toEqual([
      { value: NEUTRAL_SLUG, in: ['photo slugs', 'reserved'] },
    ]);
  });
});
