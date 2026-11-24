/**
 * The data sources' client-safe half (REGION-06; 18 D-16, D-17, D-20).
 *
 * The ids, the /sources anchors, the short credits and the page link, with no
 * data import on purpose: the footer (SiteFooter, reached from the
 * app/global-error.tsx client graph) and every sheet margin link to /sources
 * through this module, so it must stay a few strings. The verbatim credits,
 * the licences and the "Used on" lists live in data/sources.ts, which is
 * server-only (lib/__tests__/client-graph.test.ts SERVER_ONLY_MODULES).
 *
 * The ids double as the anchors on /sources (`/sources#<id>`): stable,
 * lowercase, named after the source, and never renamed after launch, because
 * shared links and every margin point at them (18-UI-SPEC Contract 7).
 *
 * DRAFT: the short credits are draft copy for Tim's D-20 checkpoint (18-03).
 * 18-03 replaces them with his reply; until then nothing here is approved.
 */

/** Every data source, in the order /sources lists them. */
export const SOURCE_IDS = ['swissaltiregio', 'bev-als-dtm', 'copernicus-glo-90'] as const;

/** One data source's id, which is also its anchor on /sources. */
export type SourceId = (typeof SOURCE_IDS)[number];

/** The /sources page itself: its path and its h1 (the sitemap and the offline catalog read it). */
export const SOURCES_PAGE = { href: '/sources', title: 'Data sources' } as const;

/** A source's entry on /sources: `/sources#<id>`. */
export function sourceHref(id: SourceId): string {
  return `${SOURCES_PAGE.href}#${id}`;
}

/** The short credit a map margin or the footer links to the entry with (DRAFT, D-20). */
export const SHORT_CREDIT: Readonly<Record<SourceId, string>> = {
  swissaltiregio: 'swissALTIRegio, swisstopo',
  'bev-als-dtm': 'ALS DTM, BEV, CC BY 4.0',
  'copernicus-glo-90': 'Copernicus DEM GLO-90',
};
