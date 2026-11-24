import { plates } from '@/data/generated/plates';
import { GLO90_LIABILITY, GLO90_NOTICE } from '@/data/schemas/overview';
import { site } from '@/data/site';
import type { SourceId } from '@/data/source-credits';
import bev from '@/data/terrain/plates/saalfelden/source.json';
import { regionHref } from '@/lib/photos/routes';
import { regionHeading, regionsWestToEast } from '@/lib/regions';

/**
 * The /sources entries (REGION-06; 18 D-20): one per data source, in
 * SOURCE_IDS order, each with its credit, licence, changes and the maps that
 * use it.
 *
 * SERVER-ONLY: the verbatim credits live here, so no 'use client' module and
 * nothing on the app/global-error.tsx graph may import this file
 * (lib/__tests__/client-graph.test.ts SERVER_ONLY_MODULES, T-18-04). The footer
 * and the map margins link here through data/source-credits.ts.
 *
 * Credits are never typed here (16 D-21): each is read from its data source,
 * the same string, so the page cannot drift from the data: swissALTIRegio's
 * from site.attribution.terrain, BEV's from the Saalfelden plate's source.json
 * (its licence and licence URL too), and GLO-90's notice and liability
 * sentence from data/schemas/overview.ts, which the overview source.json schema
 * pins to the licence text. A credit is worded by its licensor; no sentence
 * here may imply endorsement by swisstopo, BEV, the Copernicus programme, ESA
 * or the EU (GLO-90 licence Article 6(d)).
 *
 * DRAFT: SOURCES_INTRO, the licence names, the changes and the "Used on"
 * labels are draft copy for Tim's D-20 checkpoint (18-03). The credits are
 * data, not copy.
 */

/** A map that uses a source: a page link, or plain text for a place that is not a page. */
export type UsedOn = { label: string; href: string } | { label: string };

export type SourceEntry = {
  /** The anchor on /sources (data/source-credits.ts SOURCE_IDS). */
  id: SourceId;
  /** The h2: the source's name. */
  name: string;
  /** The verbatim credit, one paragraph per string, read from its data source. */
  credit: readonly string[];
  /** The licence, linked to its official text (never copied onto the page). */
  licence: { name: string; href: string };
  /** What was done to the data, one paragraph per string. */
  changes: readonly string[];
  /** The maps that use the source, region pages west to east. */
  usedOn: readonly UsedOn[];
};

/** The intro under the h1 (DRAFT, D-20). */
export const SOURCES_INTRO =
  'The maps on this site are drawn from three elevation models. Each entry gives the credit exactly as its licence asks, the licence itself, what was done to the data and the maps that use it.';

/** The generated plates, read by plate id for their DEM product. */
const PLATE_PRODUCT: Readonly<Record<string, { dem: { product: string } } | undefined>> = plates;

/**
 * The region pages whose plate is drawn from `product`, west to east (D-01),
 * so a region added on that product joins its entry with no edit here.
 */
function regionPagesOn(product: string): UsedOn[] {
  return regionsWestToEast()
    .filter((region) => PLATE_PRODUCT[region.plate]?.dem.product === product)
    .map((region) => ({ label: regionHeading(region), href: regionHref(region.id) }));
}

/** Every data source, in SOURCE_IDS order (data/__tests__/sources.test.ts pins it). */
export const SOURCES: readonly SourceEntry[] = [
  {
    id: 'swissaltiregio',
    name: 'swissALTIRegio',
    credit: [site.attribution.terrain],
    licence: {
      name: 'swisstopo terms of use for free geodata',
      href: 'https://www.swisstopo.admin.ch/en/conditions-geodata',
    },
    changes: ['Resampled to a 10 m grid; contours every 100 m and a hillshade derived; modified.'],
    usedOn: [...regionPagesOn('swissALTIRegio'), { label: 'The footer of every page' }],
  },
  {
    id: 'bev-als-dtm',
    name: 'BEV ALS DTM',
    credit: [bev.credit],
    licence: { name: bev.licence, href: bev.licenceUrl },
    changes: [
      'Resampled to a 10 m grid; contours every 100 m and a hillshade derived; modified.',
      // 16-RESEARCH BEV: the record's Stichtag is a creation date, never a survey date.
      'Edition 15 September 2025, the date BEV created the dataset, not a survey date.',
    ],
    usedOn: regionPagesOn(bev.product),
  },
  {
    id: 'copernicus-glo-90',
    name: 'Copernicus DEM GLO-90',
    credit: [GLO90_NOTICE, GLO90_LIABILITY],
    licence: {
      // The licence PDF 16-RESEARCH cites (Article 6, p. 20): draft target for 18-03.
      name: 'Licence for COP-DEM-GLO-90-F Global 90m Full, Free & Open',
      href: 'https://dataspace.copernicus.eu/sites/default/files/media/files/2025-06/copernicus_contributing_mission_data_access_v2_cop_dem_licenses.pdf',
    },
    changes: [
      'Resampled to a coarser grid covering the Alps; contours every 1,000 m derived; modified.',
    ],
    usedOn: [{ label: 'Alps overview', href: '/photos' }],
  },
];
