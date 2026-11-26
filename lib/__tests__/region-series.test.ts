/**
 * A region's series is every generated photo in that region (seriesInput,
 * regionPhotoViews; 18 D-27 retired the hand-listed v2.0 light table beside
 * it, 18-26): a new photo in region zermatt joins Zermatt's series, and once it
 * has editorial copy it gets a slug in photoRouteSlugs and publishedSlugs and a
 * published view through photoBySlug (17 D-07, PHOTO-05). The generated photo
 * module is extended with a copy of img-0605 as img-9001 in region `zermatt`,
 * with a copy of img-0605's editorial entry (its own slug) and image-manifest
 * entry, in a fresh module registry (the home-waypoints.test.tsx pattern).
 */
import { photos } from '@/data/generated/photos';
import { regionPhotoViews } from '@/lib/regions';
import { seriesInput } from '@/lib/photos/view-model';
import { SLUGS } from '../../e2e/helpers/photo-fixtures';

type PhotosModule = typeof import('@/data/generated/photos');
type EditorialModule = typeof import('@/data/photos/editorial');
type ManifestModule = typeof import('@/data/generated/image-manifest');

/** The injected photo's slug; no real photo uses it. */
const INJECTED_SLUG = 'injected-zermatt-photo';

/** The four v2.0 Zermatt photos, named (18-26, Pitfall 8). */
const V20_SLUGS: readonly string[] = Object.values(SLUGS);

describe('region series membership (18 D-27; 16 D-15, T-16-07)', () => {
  it("puts a new Zermatt photo in Zermatt's series beside the v2.0 four, and publishes it", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@/data/generated/photos', () => {
        const actual = jest.requireActual<PhotosModule>('@/data/generated/photos');
        const base = actual.photos.find((p) => p.id === 'img-0605');
        if (!base)
          throw new Error('region-series.test: img-0605 is missing from the generated photos');
        return {
          ...actual,
          photos: [...actual.photos, { ...base, id: 'img-9001', region: 'zermatt' }],
        };
      });
      jest.doMock('@/data/photos/editorial', () => {
        const actual = jest.requireActual<EditorialModule>('@/data/photos/editorial');
        return {
          ...actual,
          editorial: {
            ...actual.editorial,
            'img-9001': { ...actual.editorial['img-0605'], slug: INJECTED_SLUG },
          },
        };
      });
      jest.doMock('@/data/generated/image-manifest', () => {
        const actual = jest.requireActual<ManifestModule>('@/data/generated/image-manifest');
        return {
          ...actual,
          imageManifest: {
            ...actual.imageManifest,
            'img-9001': actual.imageManifest['img-0605'],
          },
        };
      });

      const mocked = await import('@/data/generated/photos');
      // The mock took: the global photo set holds the injected photo.
      expect(mocked.photos.map((p) => p.id)).toContain('img-9001');

      const viewModel = await import('@/lib/photos/view-model');
      const routes = await import('@/lib/photos/routes');
      const regionModel = await import('@/lib/regions');
      // Zermatt's series: the injected photo joins it, and the v2.0 four stay in it.
      expect(viewModel.seriesInput('zermatt').photos.map((p) => p.id)).toContain('img-9001');
      const series = regionModel.regionPhotoViews('zermatt').map((v) => v.slug);
      expect(series).toContain(INJECTED_SLUG);
      expect(series).toEqual(expect.arrayContaining([...V20_SLUGS]));
      // The published route set: the injected photo has a page and the proxy admits it.
      expect(routes.photoRouteSlugs).toContain(INJECTED_SLUG);
      expect(viewModel.publishedSlugs).toContain(INJECTED_SLUG);
      expect(viewModel.photoBySlug(INJECTED_SLUG)?.id).toBe('img-9001');
    });
  });

  it('throws a RangeError naming a region with no photos', () => {
    expect(() => seriesInput('nowhere')).toThrow(RangeError);
    expect(() => seriesInput('nowhere')).toThrow(/nowhere/);
  });

  it('throws a RangeError naming a region id with no series (regionPhotoViews)', () => {
    expect(() => regionPhotoViews('nowhere')).toThrow(
      new RangeError('regionPhotoViews: nowhere is not a registry region')
    );
  });

  it("has the four v2.0 slugs in Zermatt's series, each a region zermatt photo", () => {
    const series = regionPhotoViews('zermatt');
    for (const slug of V20_SLUGS) {
      const view = series.find((v) => v.slug === slug);
      expect(view).toBeDefined();
      expect(photos.find((p) => p.id === view?.id)?.region).toBe('zermatt');
    }
  });
});
