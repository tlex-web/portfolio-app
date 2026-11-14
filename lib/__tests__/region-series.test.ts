/**
 * The v2.0 light table is the Zermatt series (DATA-10 roadmap carry; T-15-16):
 * a photo in another region never reaches buildPhotoViews, photoSlugs or the
 * static params. The generated photo module is extended with a copy of
 * img-0605 as img-9001 in region `elsewhere`, in a fresh module registry (the
 * home-waypoints.test.tsx pattern). img-9001 has no editorial or manifest
 * entry, so including it anywhere in the light table would throw.
 */
import { seriesInput } from '@/lib/photos/view-model';

type PhotosModule = typeof import('@/data/generated/photos');

const REAL_SLUGS = [
  'matterhorn-from-zermatt',
  'gornerschlucht-waterfall',
  'matterhorn-glacier-trail',
  'riffelsee-reflection',
];

describe('light-table series isolation (DATA-10, T-15-16)', () => {
  it('keeps a photo in another region off the light table', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@/data/generated/photos', () => {
        const actual = jest.requireActual<PhotosModule>('@/data/generated/photos');
        const base = actual.photos.find((p) => p.id === 'img-0605');
        if (!base) throw new Error('region-series.test: img-0605 is missing from the generated photos');
        return { ...actual, photos: [...actual.photos, { ...base, id: 'img-9001', region: 'elsewhere' }] };
      });

      const mocked = await import('@/data/generated/photos');
      // The mock took: the global photo set holds the injected photo.
      expect(mocked.photos.map((p) => p.id)).toContain('img-9001');

      const viewModel = await import('@/lib/photos/view-model');
      expect(viewModel.LIGHT_TABLE_REGION).toBe('zermatt');
      expect(viewModel.buildPhotoViews().map((v) => v.slug)).toEqual(REAL_SLUGS);
      expect(viewModel.photoSlugs).toEqual(REAL_SLUGS);
      expect(viewModel.seriesInput('elsewhere').photos.map((p) => p.id)).toEqual(['img-9001']);
    });
  });

  it('throws a RangeError naming a region with no photos', () => {
    expect(() => seriesInput('nowhere')).toThrow(RangeError);
    expect(() => seriesInput('nowhere')).toThrow(/nowhere/);
  });
});
