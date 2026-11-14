import { photos } from '@/data/generated/photos';
import { homeWaypointIds } from '@/data/home';

/**
 * The Home membership filter (DATA-09; 15-CONTEXT D-06, D-09).
 *
 * Every Home surface reads its photos through here: buildWaypoints' default
 * input (homeInput in lib/ascent/waypoints.ts) and the footer's waypoint ticks.
 * The module stays light on purpose. The footer renders inside the
 * client-rendered app/global-error.tsx, so whatever it imports ships in a
 * client chunk; this file imports only the generated photo facts and the id
 * list, never the editorial copy or the image manifest.
 */

/** The generated photo record type. */
export type HomePhoto = (typeof photos)[number];

/**
 * The generated photos whose id is in `ids`, in the generated module's order
 * (filtering keeps it, so the footer's tick markup is unchanged).
 *
 * @param ids the Home waypoint ids; defaults to homeWaypointIds (the parameter
 *   exists for tests).
 * @throws RangeError naming the id when a listed id has no generated photo.
 */
export function homePhotos(ids: readonly string[] = homeWaypointIds): readonly HomePhoto[] {
  for (const id of ids) {
    if (!photos.some((photo) => photo.id === id)) {
      throw new RangeError(
        `homePhotos: Home waypoint ${id} has no photo in data/generated/photos.ts; fix homeWaypointIds in data/home.ts`,
      );
    }
  }
  return photos.filter((photo) => ids.includes(photo.id));
}
