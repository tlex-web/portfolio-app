import type {
  ImageGallery,
  ImageObject,
  Place,
  SoftwareApplication,
  SoftwareSourceCode,
  WithContext,
} from 'schema-dts';
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { site } from '@/data/site';
import type { Project } from '@/data/types';
import { roundedCoordinate, type CoordinatePrecision } from '@/lib/home-format';
import { personRef, siteRights } from '@/lib/json-ld/site';
import { photoHref, regionHref } from '@/lib/photos/routes';
import type { PhotoView } from '@/lib/photos/view-model';
import {
  regionById,
  regionDescription,
  regionHeading,
  regionPhotoViews,
  regionRights,
} from '@/lib/regions';

/**
 * The page-specific JSON-LD blocks (SEO-04): the photo, region and case-study
 * blocks. Pure, no 'use client': only server pages import it, so no client
 * chunk carries it. The site-wide graph, the serializer and the Person reference
 * live in lib/json-ld/site.ts (17-REVIEW WR-01), which the (site) layout imports
 * alone; this module reads the region and photo model, so only the pages that
 * render these blocks load it. The D-16 per-node rule, D-20 disclosure rule and
 * D-21 type-only schema-dts import of site.ts hold here too.
 *
 * - 17-13 photo pages (SEO-04, D-16..D-19): photoImageLd states each photo's
 *   image, creator, rights, place and date with text equal to what the page
 *   prints. Coordinates go through roundedCoordinate, the strip's own rounding,
 *   at the position's own precision and as strings (a JSON number would drop a
 *   trailing zero), so the block is never finer than the page. No elevation, no
 *   capture seconds. It reads the server-only generated photo facts and image
 *   manifest; no client file imports this module.
 * - 17-14 region pages: regionGalleryLd states the region page as an
 *   ImageGallery whose texts are the page's own (the heading, the approved
 *   description, the printed region rights line) and whose hasPart names each
 *   listed photo's ImageObject by @id, in the page's link order. Its place is the
 *   region and its country, no geo: the stand-in page prints no coordinates.
 * - 17-14 case studies: projectLd states the project, box as SoftwareSourceCode
 *   with its public repository, coin-flip as SoftwareApplication with no
 *   repository at all (private, 11 D-23). Its copyrightNotice is
 *   caseStudyRights(slug): Tim's 17-01 option (a), the footer line.
 * - No breadcrumb markup of any kind: it waits for Phase 18's visible
 *   breadcrumb, so no block names links the page does not show.
 * - lib/regions is server-only too (17-16 client-graph guard), which holds as
 *   long as no client file imports this module.
 */

/** The photo's ImageObject id: its page URL plus '#image' (17 D-16; 17-14's gallery hasPart refers to it). */
export function photoImageId(slug: string): string {
  return `${site.url}${photoHref(slug)}#image`;
}

/** The generated facts an ImageObject reads beyond the view: the capture and the position. */
export type PhotoLdFacts = {
  capture:
    { precision: 'second'; local: string; offset: string } | { precision: 'year'; year: number };
  position: { lat: number; lon: number; precision: CoordinatePrecision } | null;
};

type ManifestVariant = { longEdge: number; width: number; height: number; webp: string };

const manifest: Readonly<Record<string, { variants: readonly ManifestVariant[] } | undefined>> =
  imageManifest;

/**
 * A published photo's capture and position from data/generated/photos.ts.
 *
 * @throws RangeError for an id with no generated photo (a data error, never filled in).
 */
export function photoLdFacts(id: string): PhotoLdFacts {
  const photo = photos.find((p) => p.id === id);
  if (!photo) throw new RangeError(`photoLdFacts: no generated photo ${id}`);
  return { capture: photo.capture, position: photo.position };
}

/** A pixel length as schema.org writes it: a QuantitativeValue in UN/CEFACT E37 (pixel). */
const pixels = (value: number) =>
  ({ '@type': 'QuantitativeValue', value, unitCode: 'E37' }) as const;

/**
 * The ImageObject on a full photo page (SEO-04; D-16..D-19). Every text is the
 * page's own: name the title, caption the alt text, copyrightNotice the rights
 * line the viewer prints (D-17), creditText site.name (D-18), contentLocation
 * the printed place. The geo, present only when the photo has a position, holds
 * the strip's Position digits as strings at the position's own precision
 * (D-19). dateCreated is the capture to the minute with its offset, or the year
 * alone for a year-only capture: never finer than the capture label. No
 * elevation, license or acquireLicensePage. contentUrl is the 2560 px WebP
 * manifest derivative (rotated, metadata-free).
 *
 * @throws RangeError when the photo has no 2560 px variant or no generated facts.
 */
export function photoImageLd(
  view: PhotoView,
  facts: PhotoLdFacts = photoLdFacts(view.id)
): WithContext<ImageObject> {
  const pageUrl = `${site.url}${photoHref(view.slug)}`;
  const largest = manifest[view.id]?.variants.find((v) => v.longEdge === 2560);
  if (!largest) throw new RangeError(`photoImageLd: photo ${view.id} has no 2560 px variant`);
  const { capture, position } = facts;
  const contentLocation: Place = position
    ? {
        '@type': 'Place',
        name: view.place,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: roundedCoordinate(position.lat, position.precision),
          longitude: roundedCoordinate(position.lon, position.precision),
        },
      }
    : { '@type': 'Place', name: view.place };

  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    '@id': photoImageId(view.slug),
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    contentUrl: `${site.url}${largest.webp}`,
    width: pixels(largest.width),
    height: pixels(largest.height),
    name: view.title,
    caption: view.alt,
    creator: personRef(),
    creditText: site.name,
    copyrightNotice: view.rights,
    dateCreated:
      capture.precision === 'second'
        ? `${capture.local.slice(0, 16)}${capture.offset}`
        : String(capture.year),
    contentLocation,
  };
}

/**
 * The ImageGallery on a region page (SEO-04; D-16, D-17, D-18). @id and url are
 * the page's absolute URL; name is the printed h1 (regionHeading) and
 * description the approved D-14 description the page's metadata carries.
 * hasPart refers to each listed photo's ImageObject by its @id (17-13), in
 * regionPhotoViews order, which is the order the page links them.
 * copyrightNotice is regionRights(id), the rights paragraph the page prints.
 *
 * @throws RangeError for an id that is not a registry region.
 */
export function regionGalleryLd(id: string): WithContext<ImageGallery> {
  const region = regionById(id);
  if (!region) throw new RangeError(`regionGalleryLd: ${id} is not a registry region`);
  const views = regionPhotoViews(id);
  const pageUrl = `${site.url}${regionHref(id)}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    '@id': pageUrl,
    url: pageUrl,
    name: regionHeading(region),
    description: regionDescription({ name: region.name, country: region.country, views }),
    contentLocation: {
      '@type': 'Place',
      name: region.name,
      address: { '@type': 'PostalAddress', addressCountry: region.country },
    },
    hasPart: views.map((v) => ({ '@id': photoImageId(v.slug) })),
    creator: personRef(),
    creditText: site.name,
    copyrightNotice: regionRights(id),
  };
}

/**
 * A case study's copyrightNotice (D-17). Tim's 17-01 choice, option (a) "Footer
 * line (Recommended)" (his reply recorded verbatim in 17-01-SUMMARY.md): the
 * footer line exactly, siteRights(), the only rights text a case study prints.
 * The slug stays in the signature so the contract reads per project; under
 * option (a) every project carries the same line.
 */
export function caseStudyRights(_slug: Project['slug']): string {
  return siteRights();
}

/**
 * The project on its case study (SEO-04; D-16, D-17, D-18). A project with a
 * public repository link (box) is SoftwareSourceCode with codeRepository; one
 * without (coin-flip, private, 11 D-23) is SoftwareApplication and has no
 * repository key at all. description is the approved pitch, the page's meta
 * description, and is left out when a project has none.
 */
export function projectLd(
  project: Project
): WithContext<SoftwareSourceCode> | WithContext<SoftwareApplication> {
  const body = {
    name: project.name,
    ...(project.pitch ? { description: project.pitch } : {}),
    url: `${site.url}/projects/${project.slug}`,
    creator: personRef(),
    creditText: site.name,
    copyrightNotice: caseStudyRights(project.slug),
  };
  return 'links' in project
    ? {
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        ...body,
        codeRepository: project.links.github,
      }
    : { '@context': 'https://schema.org', '@type': 'SoftwareApplication', ...body };
}
