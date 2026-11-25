import { overview } from '@/data/generated/overview';
import { plates } from '@/data/generated/plates';
import { sheet } from '@/data/sheet';
import { SHORT_CREDIT, type SourceId, sourceHref } from '@/data/source-credits';
import { formatEquidistance, formatExtentLines, formatMonthYear } from '@/lib/footer-format';
import { type Wgs84, lv95ToWgs84 } from '@/lib/geo';
import { formatCoordinates } from '@/lib/home-format';
import { formatMetres } from '@/lib/photo-format';
import { regions } from '@/lib/regions';

/**
 * The sheet margins (REGION-06; 18 D-16..D-19; 18-UI-SPEC Contract 7
 * "SheetMargin"): what each map shows, how current it is and whose data it is,
 * printed under the map as its figcaption, one click from the full credit on
 * /sources.
 *
 * SERVER-ONLY: this module reads the plate registry (data/generated/plates.ts)
 * and the Alps overview (data/generated/overview.ts), which no client
 * component may reach (lib/__tests__/client-graph.test.ts).
 * Pages build the model on the server and pass it to the SheetMargin component
 * as plain props, so no plate data reaches a client chunk.
 *
 * The sheet titles and the short credits are Tim's approved D-20 copy (18-03
 * Task 2, "approve-G1 (Recommended)", 2026-11-25); the credit links to its
 * /sources entry, which his confirmed licence reading allows for every source.
 * Matterhorn's title is the footer's own (data/sheet.ts), so the two never
 * drift. lib/__tests__/sheet-margin.test.ts pins every string literally and
 * guards that no margin can ship an empty field or a dead anchor (UI E9/empty).
 *
 * Extent (D-19): the Swiss sheet keeps the footer's 'Extent (LV95)' corners;
 * any other LV95 sheet (Ortler, in Italy) prints its SW and NE corners in WGS84
 * at 4 decimals through lv95ToWgs84, and an EPSG:3035 sheet (Saalfelden) the
 * WGS84 corners the terrain build projected (extent.wgs84; the projection
 * library stays in scripts/, so app code never projects LAEA). The corners are the sheet's, not a photo's, so the
 * 4 decimals disclose nothing (D-25). The overview prints its projection
 * window in whole degrees.
 *
 * Last surveyed (D-18) is the terrain edition, short month and year for a
 * plate ('Sep 2025'), the release year alone for the overview. The overview's GLO-90 credit is a
 * link too (Tim's G1), and its Summits row lists the reference summits west to
 * east with their stored heights, Triglav's printed plainly (18-01 P6).
 */

/** A sheet's margin: plain strings only, so it crosses to any component as props. */
export type SheetMarginModel = {
  /** The sheet title, e.g. 'Zermatt – Matterhorn'. */
  title: string;
  /** The hero contour interval, e.g. '100 m' (U+00A0 before the unit). */
  interval: string;
  /** The extent row: its term and its corners, each a nowrap unit. */
  extent: { label: 'Extent' | 'Extent (LV95)'; parts: readonly string[] };
  /** The terrain edition (D-18): 'May 2026', or a year alone. */
  lastSurveyed: string;
  /**
   * The Source row (D-17): the short credit linked to its /sources entry, or,
   * where a licence would need its full notice at the map, the verbatim
   * paragraphs then a 'Licence and details' link (never chosen so far: G1).
   */
  source:
    | { kind: 'link'; text: string; href: string }
    | { kind: 'notice'; paragraphs: readonly string[]; href: string };
  /** The overview's reference summits west to east, each 'name height' (overview only). */
  summits?: readonly string[];
};

/** Every sheet's title (D-20, approved 2026-11-25), keyed by plate id and 'overview'. */
export const SHEET_TITLES = {
  overview: 'The Alps',
  matterhorn: sheet.title,
  ortler: 'Ortler',
  saalfelden: 'Saalfelden',
} as const satisfies Readonly<Record<string, string>>;

/** The /sources entry each DEM product is credited by. */
const SOURCE_OF_PRODUCT: Readonly<Record<string, SourceId>> = {
  swissALTIRegio: 'swissaltiregio',
  'BEV ALS DTM': 'bev-als-dtm',
  'Copernicus DEM GLO-90': 'copernicus-glo-90',
};

/** The sheet fields a margin reads, for either crs branch. */
type MarginSheet = {
  id: string;
  crs: string;
  extent: {
    lv95?: { west: number; south: number; east: number; north: number };
    wgs84?: { sw: Wgs84; ne: Wgs84 };
    widthM: number;
  };
  dem: { product: string; edition: string };
  contours: { hero: { intervalM: number } };
};

const PLATES: Readonly<Record<string, MarginSheet | undefined>> = plates;

/** The swissALTIRegio sheet inside Switzerland keeps the footer's LV95 extent (D-19). */
function isSwissSheet(id: string): boolean {
  return regions.some((r) => r.plate === id && r.country === 'CH');
}

/** 'SW 46.4604 N 10.4854 E' (formatCoordinates at 4 decimals). */
function corner(name: 'SW' | 'NE', p: Wgs84): string {
  return `${name} ${formatCoordinates({ ...p, precision: '4dp' })}`;
}

/** An own property of a lookup table, never one inherited from Object.prototype. */
function own<T>(table: Readonly<Record<string, T>>, key: string): T | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

function title(id: string): string {
  const t = own<string>(SHEET_TITLES, id);
  if (!t) throw new RangeError(`sheetMargin: no approved sheet title for ${id}`);
  return t;
}

function source(product: string): SheetMarginModel['source'] {
  const id = own(SOURCE_OF_PRODUCT, product);
  if (!id) throw new RangeError(`sheetMargin: no /sources entry for the DEM product ${product}`);
  return { kind: 'link', text: SHORT_CREDIT[id], href: sourceHref(id) };
}

function extent(s: MarginSheet): SheetMarginModel['extent'] {
  const box = s.extent.lv95;
  if (s.crs === 'EPSG:2056' && box) {
    if (isSwissSheet(s.id)) return { label: 'Extent (LV95)', parts: formatExtentLines(box) };
    return {
      label: 'Extent',
      parts: [
        corner('SW', lv95ToWgs84({ e: box.west, n: box.south })),
        corner('NE', lv95ToWgs84({ e: box.east, n: box.north })),
      ],
    };
  }
  const corners = s.extent.wgs84;
  if (s.crs === 'EPSG:3035' && corners)
    return { label: 'Extent', parts: [corner('SW', corners.sw), corner('NE', corners.ne)] };
  throw new RangeError(
    `sheetMargin: plate ${s.id} (${s.crs}) has no WGS84 corners (npm run terrain:build)`
  );
}

/**
 * A `YYYY-MM` edition as the margin prints it, 'Sep 2025' (D-18; the region
 * captions' short month): formatMonthYear validates it and names the month,
 * whose first three letters are its English abbreviation.
 */
function editionMonth(edition: string): string {
  const [month, year] = formatMonthYear(edition).split(' ');
  return `${month.slice(0, 3)} ${year}`;
}

/** A whole number of degrees, or a RangeError: the overview window is whole degrees. */
function degrees(v: number): string {
  if (!Number.isInteger(v)) throw new RangeError(`sheetMargin: overview edge ${v}° is not whole`);
  return `${v}°`;
}

/** The Alps overview's margin (18-23 renders it under the overview sheet). */
function overviewMargin(): SheetMarginModel {
  const { lon, lat } = overview.projection;
  const year = /\b(\d{4})\b/.exec(overview.source.release)?.[1];
  if (!year) throw new RangeError('sheetMargin: the overview release names no year');
  return {
    title: title('overview'),
    interval: formatMetres(overview.contours.intervalM),
    extent: {
      label: 'Extent',
      parts: [
        `SW ${degrees(lat[0])} N ${degrees(lon[0])} E`,
        `NE ${degrees(lat[1])} N ${degrees(lon[1])} E`,
      ],
    },
    lastSurveyed: year,
    source: source(overview.source.product),
    summits: [...overview.summits]
      .sort((a, b) => a.uv.u - b.uv.u)
      .map((s) => `${s.name} ${formatMetres(s.officialM)}`),
  };
}

/**
 * The margin of a plate's sheet by plate id, or of the Alps overview for
 * 'overview'.
 *
 * @throws RangeError for an id that is neither, or a sheet with no approved
 *   title, no credited source or no printable extent.
 */
export function sheetMargin(id: string): SheetMarginModel {
  if (id === 'overview') return overviewMargin();
  const s = own(PLATES, id);
  if (!s) throw new RangeError(`sheetMargin: ${id} is not a plate`);
  return {
    title: title(id),
    interval: formatEquidistance(s.contours.hero.intervalM),
    extent: extent(s),
    lastSurveyed: editionMonth(s.dem.edition),
    source: source(s.dem.product),
  };
}
