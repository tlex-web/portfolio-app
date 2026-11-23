import type { Graph, Person, Thing, WebSite, WithContext } from 'schema-dts';
import { site } from '@/data/site';

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
 */

export const PERSON_ID = `${site.url}/#person`;
export const WEBSITE_ID = `${site.url}/#website`;

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
