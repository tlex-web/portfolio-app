import type { Graph, ImageObject, Person, Place, Thing, WebSite, WithContext } from 'schema-dts';
import { imageManifest } from '@/data/generated/image-manifest';
import { photos } from '@/data/generated/photos';
import { site } from '@/data/site';
import { roundedCoordinate, type CoordinatePrecision } from '@/lib/home-format';
import { photoHref } from '@/lib/photos/routes';
import type { PhotoView } from '@/lib/photos/view-model';

/**
 * JSON-LD for the site (SEO-04). Pure, no 'use client': only server pages and
 * layouts import it, so no client chunk carries it.
 *
 * - D-21: schema-dts is a devDependency imported through `import type` only, so it
 *   types the blocks at 0 runtime bytes.
 * - D-16: jsonLdHtml is the one serializer for every block (the site graph here,
 *   the photo, region and case-study blocks of 17-13 and 17-14). It escapes every
 *   '<' as < (the Next json-ld guide's escape), so no text can close the
 *   script element, and it changes no other character. The block is a native
 *   `<script type="application/ld+json">`: a data block, never executed, so it
 *   needs no nonce and never goes through next/script.
 * - D-16 per-node rule: every block carries creator, copyrightNotice and
 *   creditText on each node that is a CreativeWork. A Person node is exempt:
 *   schema.org defines the three properties on CreativeWork only, a Person is not
 *   a CreativeWork, and schema-dts's Person type does not accept them. In the
 *   site graph the WebSite node carries all three; the Person carries none.
 * - D-17, D-18: the WebSite's copyrightNotice is siteRights(), the rights line the
 *   footer prints on every page under (site); its creditText is site.name.
 * - D-20 (and the 2026-11-12 decision): no block holds site.email, an address,
 *   any part of site.location, or a license or acquireLicensePage property.
 * - 17-13 photo pages (SEO-04, D-16..D-19): photoImageLd states each photo's
 *   image, creator, rights, place and date with text equal to what the page
 *   prints. Coordinates go through roundedCoordinate, the strip's own rounding,
 *   at the position's own precision and as strings (a JSON number would drop a
 *   trailing zero), so the block is never finer than the page. No elevation, no
 *   capture seconds. It reads the server-only generated photo facts and image
 *   manifest; no client file imports this module.
 */

export const PERSON_ID = `${site.url}/#person`;
export const WEBSITE_ID = `${site.url}/#website`;

/** The photo's ImageObject id: its page URL plus '#image' (17 D-16; 17-14's gallery hasPart refers to it). */
export function photoImageId(slug: string): string {
  return `${site.url}${photoHref(slug)}#image`;
}

/**
 * The creator as an inline Person with its @id: Google reads creator.name, so
 * the name rides along with the reference to the site graph's Person (D-18).
 */
export function personRef(): Person {
  return { '@type': 'Person', '@id': PERSON_ID, name: site.name, url: site.url };
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

/** The one serializer: JSON with every '<' escaped as < (D-16). */
export function jsonLdHtml(data: Graph | WithContext<Thing>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * The footer's printed rights line (D-17): the same wording and the same
 * new Date().getFullYear() expression as SiteFooter. Both run in the same static
 * render, so the markup and the printed line agree.
 */
export function siteRights(): string {
  return `© ${new Date().getFullYear()} ${site.name}. All rights reserved.`;
}

/** The site-wide graph in the (site) layout: one Person and one WebSite (D-16, D-20). */
export function siteGraph(): Graph {
  // Person exemption (D-16): no creator, copyrightNotice or creditText on a Person.
  const person: Person = {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: site.name,
    jobTitle: site.role,
    url: site.url,
    sameAs: [site.links.github, site.links.linkedin],
  };
  const website: WebSite = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: site.name,
    url: site.url,
    author: { '@id': PERSON_ID },
    creator: { '@id': PERSON_ID },
    creditText: site.name,
    copyrightNotice: siteRights(),
  };
  return { '@context': 'https://schema.org', '@graph': [person, website] };
}
