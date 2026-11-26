import { plates } from '@/data/generated/plates';
import { GLO90_LIABILITY, GLO90_NOTICE } from '@/data/schemas/overview';
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
 * Credits are never retyped (16 D-21): each is its data source's own string,
 * so the page cannot drift from the data. swissALTIRegio's is
 * SWISSALTIREGIO_CREDIT below (moved here byte for byte from data/site.ts in
 * 18-03, D-16, and pinned to its v2.0 sha256), BEV's is read from the
 * Saalfelden plate's source.json (its licence and licence URL too), and
 * GLO-90's notice and liability
 * sentence from data/schemas/overview.ts, which the overview source.json schema
 * pins to the licence text. A credit is worded by its licensor; no sentence
 * here may imply endorsement by swisstopo, BEV, the Copernicus programme, ESA
 * or the EU (GLO-90 licence Article 6(d)).
 *
 * SOURCES_INTRO, the licence names and targets, the changes and the "Used on"
 * labels are Tim's approved D-20 copy (18-03 Task 2, "approve-G1",
 * 2026-11-25), pinned literally by data/__tests__/sources.test.ts. The credits
 * are data, not copy.
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

/**
 * The swissALTIRegio source reference (08 D-15; 18 D-16): the "For the 2025
 * and all subsequent versions:" string, copied character for character from
 * https://www.swisstopo.admin.ch/en/height-model-swissaltiregio (fetched
 * 2026-10-24). Tim chose the full string (Option A) with no copyright sign at
 * the 08-04 sheet checkpoint; the source’s own typo and stray closing quote are
 * kept verbatim. Moved here from site.attribution.terrain in 18-03 (D-16) so it
 * never reaches a client chunk: the footer links to /sources#swissaltiregio
 * instead. data/__tests__/sources.test.ts pins it to its v2.0 sha256 and length.
 */
export const SWISSALTIREGIO_CREDIT =
  'Bundesamt für Landestopografie swisstopo; Tarquini S., I. Isola, M. Favalli, A. Battistini, G. Dotta (2023). TINITALY, a digital elevation model of Italy with a 10 meters cell size (Version 1.1). Istituto Nazionale di Geofisica e Vulcanologia (INGV). https://doi.org/10.13127/tinitaly/1.1; DGM Österreich, geoland.at; DGM1, Bayerische Vermessungsverwaltung – www.geodaten.bayern.de; DGM1, Baden-Württemberg: LGL, www.lgl-bw.de, dl-de/by-2-0”; RGEAlti, Institut National de l’information géographique et forestière, données originales tétéchargées sur https://geoservices.ign.fr/rgealti#telechargement5m, mise à jour du juillet 2023';

/** The intro under the h1 (D-20, approved 2026-11-25). */
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
    credit: [SWISSALTIREGIO_CREDIT],
    licence: {
      // swisstopo's own heading on the target page: "Terms of use for free geodata and geoservices (OGD)".
      name: 'swisstopo terms of use for free geodata and geoservices (OGD)',
      href: 'https://www.swisstopo.admin.ch/en/conditions-geodata',
    },
    // swissALTIRegio is natively 10 m and the pipeline reads it at cellM 10: nothing is resampled.
    changes: [
      "Cut to each map's extent at its native 10 m grid; contours every 100 m and a hillshade derived; modified.",
    ],
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
      // Approved copy (D-20), so typed literally; source.json's edition ('2025-09') has
      // no day. data/__tests__/sources.test.ts checks this date against source.json's
      // edition and its editionSource Stichtag, so a rebuilt edition fails until the
      // sentence is updated with it.
      'Edition 15 September 2025, the date BEV created the dataset, not a survey date.',
    ],
    usedOn: regionPagesOn(bev.product),
  },
  {
    id: 'copernicus-glo-90',
    name: 'Copernicus DEM GLO-90',
    credit: [GLO90_NOTICE, GLO90_LIABILITY],
    licence: {
      // The licence PDF 16-RESEARCH cites (Article 6, p. 20), approved as the target (D-20).
      name: 'Licence for COP-DEM-GLO-90-F Global 90m Full, Free & Open',
      href: 'https://dataspace.copernicus.eu/sites/default/files/media/files/2025-06/copernicus_contributing_mission_data_access_v2_cop_dem_licenses.pdf',
    },
    changes: [
      'Resampled to a coarser grid covering the Alps; contours every 1,000 m derived; modified.',
    ],
    usedOn: [{ label: 'Alps overview', href: '/photos' }],
  },
];
