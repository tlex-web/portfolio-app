import { site } from '@/data/site';

/**
 * The site rights line (D-17), defined once (17-REVIEW IN-04): SiteFooter prints
 * it on every page and the JSON-LD WebSite and case-study blocks carry it as
 * their copyrightNotice (lib/json-ld/site.ts), so the two cannot drift.
 *
 * Kept tiny and pure on purpose: SiteFooter also renders inside the
 * client-rendered global-error, so everything this module imports ships in a
 * client chunk. It imports data/site only, which the footer already reads.
 *
 * The footer renders the parts, not the joined string: React prints adjacent
 * text children with a `<!-- -->` separator between them, so passing the same
 * five children keeps the footer's server HTML byte for byte what the inline
 * `© {year} {site.name}. All rights reserved.` printed (17 D-07 identity). The
 * printed text is the same either way.
 */
export function siteRightsParts(): readonly [string, number, string, string, string] {
  return ['© ', new Date().getFullYear(), ' ', site.name, '. All rights reserved.'];
}

/** The rights line as one string: '© {year} {site.name}. All rights reserved.' */
export function siteRights(): string {
  return siteRightsParts().join('');
}
