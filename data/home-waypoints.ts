// The Home list in its own module (16-05): photos:build reads it under --root to
// write data/generated/home-photos.ts. Its only import is type-only, which Node's
// type stripping erases, so the .mjs script can load it; data/home.ts re-exports it.
import type { PhotoId } from './photos/editorial';

/**
 * Home's ascent waypoints (DATA-09; 15-CONTEXT D-06, D-07).
 *
 * The list controls membership only: buildWaypoints still orders the
 * waypoints by DEM height ascending, ties broken by id, so the order here does
 * not matter. D-07 locks it to exactly four waypoints in region zermatt on the
 * matterhorn plate (data/__tests__/home.test.ts), because Home's layout is
 * tuned for four; a photo added anywhere else never reaches Home. tsc rejects
 * an id that is not a generated photo id.
 */
export const homeWaypointIds = [
  'img-0605', // matterhorn-from-zermatt
  'img-0629', // gornerschlucht-waterfall
  'img-0662', // matterhorn-glacier-trail
  'r004-011', // riffelsee-reflection
] as const satisfies readonly PhotoId[];
