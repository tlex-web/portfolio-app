import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { editorial } from '@/data/photos/editorial';
import { formatCaptureMonth, shortPlace, type CaptureLike } from '@/lib/home-format';
import { formatMetres } from '@/lib/photo-format';

/**
 * The waypoints of the ascent (HOME-05; D-01, D-04, D-07, D-08, D-10;
 * 09-UI-SPEC "Page Structure" and "Waypoint Cards").
 *
 * One function orders the photos and derives every field a waypoint shows, so
 * the cards, the poster pins, the 3D pins and the rail ticks can never disagree:
 * photos sorted by DEM height ascending, ties broken by id. Copy comes from
 * data/photos/editorial.ts, numbers from data/generated/photos.ts and image URLs
 * only from the content-hashed manifest variants (640 and 1024 px), which are
 * rotated and metadata-free (T-09-03).
 *
 * A Home with zero or orphan waypoints is a data error, not a state to render:
 * buildWaypoints throws a RangeError naming the photo, so tests and the build
 * fail instead.
 */

/** One waypoint card, pin and rail tick. `years` is the capture year; `image.src` the 640 WebP. */
export type Waypoint = {
  k: number;
  n: number;
  id: string;
  slug: string;
  title: string;
  alt: string;
  story: string;
  place: string;
  shortPlace: string;
  altitudeM: number;
  approximate: boolean;
  uv: { u: number; v: number };
  position: { lat: number; lon: number };
  placeDate: string;
  years: number;
  image: { width: number; height: number; srcSetAvif: string; srcSetWebp: string; src: string };
};

/** The photo fields buildWaypoints reads (a structural view of data/generated/photos.ts). */
type PhotoInput = {
  id: string;
  capture: CaptureLike;
  position: { lat: number; lon: number; approximate: boolean } | null;
  uv: { u: number; v: number } | null;
  elevation: { m: number } | null;
  locationOverride: { name: string } | null;
};

type EditorialInput = Readonly<
  Record<string, { slug: string; title: string; alt: string; location: string; story: string } | undefined>
>;

type Variant = { longEdge: number; width: number; height: number; avif: string; webp: string };
type ManifestInput = Readonly<Record<string, { variants: readonly Variant[] } | undefined>>;

export type WaypointInput = {
  photos: readonly PhotoInput[];
  editorial: EditorialInput;
  imageManifest: ManifestInput;
};

const CARD_EDGES = [640, 1024] as const;

function fail(id: string, problem: string): never {
  throw new RangeError(`buildWaypoints: photo ${id} ${problem}`);
}

function variant(id: string, variants: readonly Variant[], longEdge: number): Variant {
  return variants.find((v) => v.longEdge === longEdge) ?? fail(id, `has no ${longEdge} px variant`);
}

function captureYear(capture: CaptureLike): number {
  return capture.precision === 'year' ? capture.year : Number(capture.local.slice(0, 4));
}

/**
 * Every waypoint in ascent order, k = 1..n.
 *
 * @param input the photo facts, editorial copy and image manifest; defaults to
 *   the committed data (the parameter exists for unit tests).
 * @throws RangeError on an empty photo set, a photo without its editorial or
 *   manifest entry (or its 640/1024 variant), a null position, uv or
 *   elevation, or a uv outside [0, 1].
 */
export function buildWaypoints(
  input: WaypointInput = { photos, editorial, imageManifest },
): readonly Waypoint[] {
  if (input.photos.length === 0) {
    throw new RangeError('buildWaypoints: the photo set is empty; Home needs at least one waypoint');
  }

  const checked = input.photos.map((photo) => {
    const { id, position, uv, elevation } = photo;
    const copy = input.editorial[id] ?? fail(id, 'has no editorial entry');
    const manifest = input.imageManifest[id] ?? fail(id, 'has no image-manifest entry');
    if (!position) fail(id, 'has no position');
    if (!uv) fail(id, 'has no uv');
    if (!elevation) fail(id, 'has no elevation');
    if (!(uv.u >= 0 && uv.u <= 1 && uv.v >= 0 && uv.v <= 1)) {
      fail(id, `has a uv outside [0, 1] (${uv.u}, ${uv.v})`);
    }
    const [small, large] = CARD_EDGES.map((edge) => variant(id, manifest.variants, edge));
    return { photo, copy, position, uv, altitudeM: elevation.m, small, large };
  });

  const ordered = [...checked].sort(
    (a, b) =>
      a.altitudeM - b.altitudeM || (a.photo.id < b.photo.id ? -1 : a.photo.id > b.photo.id ? 1 : 0),
  );
  const n = ordered.length;

  return ordered.map(({ photo, copy, position, uv, altitudeM, small, large }, i) => ({
    k: i + 1,
    n,
    id: photo.id,
    slug: copy.slug,
    title: copy.title,
    alt: copy.alt,
    story: copy.story,
    place: copy.location,
    shortPlace: shortPlace(copy.location, photo.locationOverride?.name),
    altitudeM,
    approximate: position.approximate,
    uv: { u: uv.u, v: uv.v },
    position: { lat: position.lat, lon: position.lon },
    placeDate: `${copy.location} · ${formatCaptureMonth(photo.capture)}`,
    years: captureYear(photo.capture),
    image: {
      width: small.width,
      height: small.height,
      srcSetAvif: `${small.avif} 640w, ${large.avif} 1024w`,
      srcSetWebp: `${small.webp} 640w, ${large.webp} 1024w`,
      src: small.webp,
    },
  }));
}

/** The card kicker: '1,668 m · Waypoint 2 of 4', or '2,760 m approx. · Waypoint 4 of 4'. */
export function waypointKicker(w: Waypoint): string {
  return `${formatMetres(w.altitudeM)}${w.approximate ? ' approx.' : ''} · Waypoint ${w.k} of ${w.n}`;
}
