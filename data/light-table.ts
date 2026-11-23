import type { PhotoId } from './photos/editorial';

/**
 * The v2.0 light table's photos (DATA-13; 16-CONTEXT D-15).
 *
 * The list controls membership: buildPhotoViews' default input
 * (lightTableInput in lib/photos/view-model.ts) keeps only these photos, and
 * photoRouteSlugs (lib/photos/routes.ts) is their slugs. So the /photos light
 * table, the /photos/<slug> pages and their static params, the sitemap, the
 * proxy route set and the saved-pages catalog stay at these four until Phase
 * 18 replaces the light table; a photo Phase 16 adds is data only, and new
 * photos get pages with PHOTO-05 in Phase 17. buildWaypoints still owns the
 * order, so the order here does not matter. tsc rejects an id that is not a
 * generated photo id.
 *
 * Client components import lib/photos/routes.ts, which imports this list, so
 * the module stays import-light: a type import only.
 */
export const lightTableIds = [
  'img-0605', // matterhorn-from-zermatt
  'img-0629', // gornerschlucht-waterfall
  'img-0662', // matterhorn-glacier-trail
  'r004-011', // riffelsee-reflection
] as const satisfies readonly PhotoId[];
