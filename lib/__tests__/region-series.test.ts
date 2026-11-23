/**
 * The v2.0 light table is the explicit lightTableIds list (D-15; DATA-13,
 * T-16-07; it replaced the Zermatt-series filter of DATA-10, T-15-16): a photo
 * that is not on the list never reaches buildPhotoViews, photoSlugs, the static
 * params or the proxy route set, even in region zermatt. The generated photo
 * module is extended with a copy of img-0605 as img-9001 in region `zermatt`,
 * in a fresh module registry (the home-waypoints.test.tsx pattern). img-9001
 * has no editorial or manifest entry, so including it anywhere in the light
 * table would throw.
 */
import { photos } from '@/data/generated/photos';
import { lightTableIds } from '@/data/light-table';
import { LIGHT_TABLE_REGION, lightTableInput, seriesInput } from '@/lib/photos/view-model';

type PhotosModule = typeof import('@/data/generated/photos');

const REAL_SLUGS = [
  'matterhorn-from-zermatt',
  'gornerschlucht-waterfall',
  'matterhorn-glacier-trail',
  'riffelsee-reflection',
];

describe('light-table membership (D-15, T-16-07)', () => {
  it('keeps a Zermatt photo that is not in lightTableIds off the light table and the route set', async () => {
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

      const mocked = await import('@/data/generated/photos');
      // The mock took: the global photo set holds the injected photo.
      expect(mocked.photos.map((p) => p.id)).toContain('img-9001');

      const viewModel = await import('@/lib/photos/view-model');
      const routes = await import('@/lib/photos/routes');
      expect(viewModel.LIGHT_TABLE_REGION).toBe('zermatt');
      expect(viewModel.buildPhotoViews().map((v) => v.slug)).toEqual(REAL_SLUGS);
      expect(viewModel.photoSlugs).toEqual(REAL_SLUGS);
      expect(routes.photoRouteSlugs).toEqual(REAL_SLUGS);
      // The region series still sees it (Phases 17 and 18 build on seriesInput).
      expect(viewModel.seriesInput('zermatt').photos.map((p) => p.id)).toContain('img-9001');
    });
  });

  it('throws a RangeError naming a region with no photos', () => {
    expect(() => seriesInput('nowhere')).toThrow(RangeError);
    expect(() => seriesInput('nowhere')).toThrow(/nowhere/);
  });

  it('throws a RangeError naming data/light-table.ts for a light-table id with no generated photo', () => {
    expect(() => lightTableInput(['img-0605', 'img-9999'])).toThrow(RangeError);
    expect(() => lightTableInput(['img-0605', 'img-9999'])).toThrow(
      /img-9999.*data\/light-table\.ts/
    );
  });

  it('has every light-table photo in LIGHT_TABLE_REGION', () => {
    const listed = photos.filter((p) => (lightTableIds as readonly string[]).includes(p.id));
    expect(listed).toHaveLength(lightTableIds.length);
    for (const photo of listed) {
      expect(photo.region).toBe(LIGHT_TABLE_REGION);
    }
  });
});
