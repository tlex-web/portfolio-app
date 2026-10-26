import type { Metadata } from 'next';
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { terrain } from '@/data/generated/terrain';
import { editorial } from '@/data/photos/editorial';
import type { ElevationRef } from '@/data/schemas/editorial';
import { site } from '@/data/site';
import { buildWaypoints, type Waypoint, type WaypointInput } from '@/lib/ascent/waypoints';
import { formatCaptureLabel, formatMetres, type CaptureLike } from '@/lib/photo-format';

/**
 * The one photo view-model (PHOTO-03, LBOX-01, LBOX-04, LBOX-07; D-05, D-07;
 * 10-RESEARCH Pattern 2 "One view-model, one order").
 *
 * Every photo surface (map, grid, carousel, the viewer on both routes and
 * generateMetadata) reads its photos from here, so order, copy and image URLs
 * cannot drift. It is built on top of buildWaypoints(), which owns the single
 * order (DEM height ascending, ties broken by id); this module never re-sorts.
 * Image URLs come only from the content-hashed manifest derivatives (rotated,
 * metadata-free, at most 2560 px), never from the old -thumb/-large files (T-10-03).
 *
 * Like buildWaypoints, a missing manifest variant is a data error, not a state
 * to render: buildPhotoViews throws a RangeError naming the photo.
 */

/** A responsive image source set: the srcsets, the fallback src and the intrinsic size. */
export type PhotoImage = {
  width: number;
  height: number;
  srcSetAvif: string;
  srcSetWebp: string;
  src: string;
};

/** One photo as every Phase 10 surface shows it. */
export type PhotoView = Waypoint & {
  /** The capture as the strip prints it: '6 September 2021, 10:48', or '2019' for the film scan. */
  captureLabel: string;
  /** '1,617 m', or '2,760 m approx.' for an approximate position. */
  altitudeLabel: string;
  /** The photo's ratio, from the 2560 px variant. */
  aspect: { w: number; h: number };
  /** Grid tile: 640/1024/1600, sized from the 640 variant, src the 640 WebP. */
  tile: PhotoImage;
  /** Viewer stage: 1024/1600/2560, sized from the 2560 variant, src the 1600 WebP. */
  stage: PhotoImage;
  /** The derivative an opener (tile or pin preview) has already loaded: the 1024 WebP. */
  openerSrc: string;
  /** '© {capture year} Tim Lui, all rights reserved' (LBOX-07). */
  rights: string;
  /** The neighbours in the canonical order; null at the ends (no wrap, UI-SPEC OQ4). */
  prevSlug: string | null;
  nextSlug: string | null;
};

type Variant = { longEdge: number; width: number; height: number; avif: string; webp: string };

/** The photo fields buildPhotoViews reads beyond buildWaypoints' own (structural). */
type PhotoViewPhoto = WaypointInput['photos'][number] & { capture: CaptureLike };

/** The input of buildPhotoViews; structurally a WaypointInput, so the same fixture feeds both. */
export type PhotoViewInput = WaypointInput & { photos: readonly PhotoViewPhoto[] };

const TILE_EDGES = [640, 1024, 1600] as const;
const STAGE_EDGES = [1024, 1600, 2560] as const;

function fail(id: string, problem: string): never {
  throw new RangeError(`buildPhotoViews: photo ${id} ${problem}`);
}

function variant(id: string, variants: readonly Variant[], longEdge: number): Variant {
  return variants.find((v) => v.longEdge === longEdge) ?? fail(id, `has no ${longEdge} px variant`);
}

function imageSet(id: string, variants: readonly Variant[], edges: readonly number[], src: number, size: number): PhotoImage {
  const set = edges.map((edge) => variant(id, variants, edge));
  const sized = variant(id, variants, size);
  return {
    width: sized.width,
    height: sized.height,
    srcSetAvif: set.map((v) => `${v.avif} ${v.longEdge}w`).join(', '),
    srcSetWebp: set.map((v) => `${v.webp} ${v.longEdge}w`).join(', '),
    src: variant(id, variants, src).webp,
  };
}

/**
 * Every photo view in the canonical order (buildWaypoints' order, unchanged).
 *
 * @param input the photo facts, editorial copy and image manifest; defaults to
 *   the committed data (the parameter exists for unit tests).
 * @throws RangeError for everything buildWaypoints rejects (an empty photo
 *   set, an orphan photo, a null position, uv or elevation), and for a photo
 *   without its 640, 1024, 1600 or 2560 px variant.
 */
export function buildPhotoViews(
  input: PhotoViewInput = { photos, editorial, imageManifest },
): readonly PhotoView[] {
  const waypoints = buildWaypoints(input);

  return waypoints.map((w, i) => {
    const photo = input.photos.find((p) => p.id === w.id) ?? fail(w.id, 'has no photo facts');
    const variants = input.imageManifest[w.id]?.variants ?? fail(w.id, 'has no image-manifest entry');
    const largest = variant(w.id, variants, 2560);

    return {
      ...w,
      captureLabel: formatCaptureLabel(photo.capture),
      altitudeLabel: `${formatMetres(w.altitudeM)}${w.approximate ? ' approx.' : ''}`,
      aspect: { w: largest.width, h: largest.height },
      tile: imageSet(w.id, variants, TILE_EDGES, 640, 640),
      stage: imageSet(w.id, variants, STAGE_EDGES, 1600, 2560),
      openerSrc: variant(w.id, variants, 1024).webp,
      rights: `© ${w.years} ${site.name}, all rights reserved`,
      prevSlug: i > 0 ? waypoints[i - 1].slug : null,
      nextSlug: i < waypoints.length - 1 ? waypoints[i + 1].slug : null,
    };
  });
}

/** The committed photos as views, built once per module load. */
export const photoViews: readonly PhotoView[] = buildPhotoViews();

/** The four locked slugs in canonical order (08 D-07); generateStaticParams reads these. */
export const photoSlugs: readonly string[] = photoViews.map((v) => v.slug);

/** The view for an exact, case-sensitive slug, or undefined (the routes then call notFound()). */
export function photoBySlug(slug: string): PhotoView | undefined {
  return photoViews.find((v) => v.slug === slug);
}

/**
 * The metadata both photo routes export (10-RESEARCH Pattern 1), so the full
 * page and the intercepted lightbox can never disagree on the title. The root
 * template turns the title into '{title} · Tim Lui'. An unknown slug gets {}:
 * the route renders the 404 anyway. Phase 12 attaches OG images here (SEO-02).
 */
export function photoMetadata(slug: string): Metadata {
  const view = photoBySlug(slug);
  if (!view) return {};
  return {
    title: view.title,
    description: view.story,
    alternates: { canonical: `/photos/${view.slug}` },
  };
}

/** The height an elevation reference points at: the photo's DEM height or the official summit (D-17). */
export function elevationMetres(ref: ElevationRef, altitudeM: number): number {
  return ref.kind === 'summit' ? terrain.summit.officialM : altitudeM;
}
