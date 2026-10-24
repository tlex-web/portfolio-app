/**
 * Legacy bridge for the v1 photo UI (RESEARCH Pattern 5, DATA-08).
 *
 * GalleryGrid, PhotoCarousel3D, ImageDetailModal and the Home LCP image still
 * read `LandscapeImage[]`. This module derives it, in the generated photo
 * order, from three sources and holds no facts or paths of its own:
 * - data/generated/photos.ts: capture, exposure, DEM height, derived tags;
 * - data/photos/editorial.ts: hand-written copy, subject tags, hotspots;
 * - data/generated/image-manifest.ts: the legacy -large/-thumb paths, which v1
 *   components keep until Phases 9 and 10 move them to the hashed variants.
 * Phase 10 retires this bridge.
 */
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { terrain } from '@/data/generated/terrain';
import { editorial } from '@/data/photos/editorial';
import type { ElevationRef, EditorialAnnotation } from '@/data/schemas/editorial';
import {
  formatAperture,
  formatCaptureLabel,
  formatExposureTime,
  formatMetres,
} from '@/lib/photo-format';
import type { ImageAnnotation, LandscapeImage } from './types';

type Photo = (typeof photos)[number];

/** The height an elevation reference points at: the photo's DEM height or the official summit (D-17). */
export function elevationMetres(ref: ElevationRef, photo: Photo): number {
  return ref.kind === 'summit' ? terrain.summit.officialM : photo.elevation.m;
}

function toAnnotation(annotation: EditorialAnnotation, photo: Photo): ImageAnnotation {
  const { details, ...rest } = annotation;
  if (!details) return { ...rest, position: { ...rest.position } };
  return {
    ...rest,
    position: { ...rest.position },
    details: {
      ...(details.elevation && {
        elevation: formatMetres(elevationMetres(details.elevation, photo)),
      }),
      ...(details.distance && { distance: details.distance.text }),
      ...(details.facts && { facts: details.facts.map((fact) => fact.text) }),
    },
  };
}

function technicalDetails(photo: Photo): LandscapeImage['technicalDetails'] {
  const captureLabel = formatCaptureLabel(photo.capture);
  if (!photo.exif) return { captureLabel };
  return {
    camera: photo.exif.camera,
    lens: photo.exif.lens,
    aperture: formatAperture(photo.exif.fNumber),
    shutterSpeed: formatExposureTime(photo.exif.exposureTimeS),
    iso: photo.exif.iso,
    captureLabel,
  };
}

export const landscapes: LandscapeImage[] = photos.map((photo) => {
  const copy = editorial[photo.id];
  const legacy = imageManifest[photo.id].legacy;
  return {
    id: photo.id,
    src: legacy.largeWebp,
    fallbackSrc: legacy.largeJpg,
    thumbnailSrc: legacy.thumbWebp,
    alt: copy.alt,
    title: copy.title,
    location: copy.location,
    story: copy.story,
    technicalDetails: technicalDetails(photo),
    tags: [photo.tags.year, ...(photo.tags.season ? [photo.tags.season] : []), ...copy.subjectTags],
    annotations: copy.annotations.map((annotation) => toAnnotation(annotation, photo)),
  };
});
