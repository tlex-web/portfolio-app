import type { Metadata } from 'next';
import { overview } from '@/data/generated/overview';
import { photos } from '@/data/generated/photos';
import { plates } from '@/data/generated/plates';
import registry from '@/data/regions/regions.json';
import { Regions, type Region } from '@/data/schemas/region';
import { site } from '@/data/site';
import { formatMetreRange, formatYearRange } from '@/lib/home-format';
import { pageMetadata } from '@/lib/metadata';
import { regionHref } from '@/lib/photos/routes';
import { buildPhotoViews, seriesInput, type PhotoView } from '@/lib/photos/view-model';

/**
 * The server-only region model (REGION-07; D-06, D-11, D-14, D-17).
 *
 * The region page, its metadata, and later the region OG card, the sitemap,
 * JSON-LD and the saved-pages catalog read regions from here. The registry is
 * parsed with the strict `Regions` schema at module load, so a bad registry
 * fails the build instead of rendering. Each region's photos are built once,
 * with buildPhotoViews(seriesInput(id)): a registry region with no photo throws
 * seriesInput's RangeError at load, and the order is buildWaypoints' (DEM
 * height ascending, ties broken by id); nothing here re-sorts. Each region's
 * cover (D-13) must be one of those views, checked at load (regionCover), and
 * its plate must have a generated hero contour, checked at load too
 * (regionContourSrc).
 *
 * Server-only: this module holds the registry's names and sourced facts, so no
 * 'use client' file may import it, directly or through another module (the
 * client-graph guard, 17-16). Region URLs come from regionHref in
 * lib/photos/routes.ts (D-06); proxy.ts reads its id list from
 * lib/photos/region-ids.ts, never from here.
 *
 * D-14: the heading, title, description and OG alt templates below are Tim's
 * approved copy (17-01 Task 2, his reply recorded verbatim in 17-01-SUMMARY.md):
 * the country as its full name, height ranges without 'approx.', and 'ground'
 * before the range in the description and the OG alt when every photo of the
 * region is aerial. lib/__tests__/regions.test.ts pins the rendered strings.
 */

/** The parsed registry (a schema violation throws at module load). */
const parsed = Regions.parse(registry);

/** Every region, in registry order (ortler, saalfelden, zermatt). */
export const regions: readonly Region[] = parsed.regions;

/** The region ids in registry order; generateStaticParams reads these. */
export const regionIds: readonly string[] = regions.map((r) => r.id);

/** What the west-to-east order needs from an entry: its id and its overview outline corners, if any. */
export type WestToEastEntry = {
  id: string;
  /** The overview outline's corners in grid uv (plate carrée), or undefined for no outline. */
  corners: readonly { u: number }[] | undefined;
};

/**
 * Entries sorted west to east (D-01), pure so a test can pass a fixture list:
 * by the mean u of their overview outline corners (the overview grid is plate
 * carrée, so u grows with longitude), ties broken by id ascending so the order
 * is stable. A new array; the input is not touched.
 *
 * @throws RangeError naming the first entry with no outline (undefined or no
 *   corners), so no region renders without a place in the order.
 */
export const regionsWestToEastIn = <T extends WestToEastEntry>(
  list: readonly T[]
): readonly T[] => {
  const keyed = list.map((entry) => {
    const corners = entry.corners;
    if (!corners || corners.length === 0) {
      throw new RangeError(`regionsWestToEast: ${entry.id} has no overview outline`);
    }
    return { entry, u: corners.reduce((sum, c) => sum + c.u, 0) / corners.length };
  });
  return keyed
    .sort((a, b) => a.u - b.u || (a.entry.id < b.entry.id ? -1 : a.entry.id > b.entry.id ? 1 : 0))
    .map(({ entry }) => entry);
};

/**
 * Every registry region, west to east by its overview outline (D-01): the
 * order /sources lists a source's region pages in. The registry export
 * `regions` keeps registry order (the sitemap and the saved-pages catalog pin
 * it); this is a separate, sorted copy.
 *
 * @throws RangeError for a registry region with no outline in
 *   data/generated/overview.ts (npm run terrain:build regenerates it).
 */
export function regionsWestToEast(): readonly Region[] {
  return regionsWestToEastIn(
    regions.map((region) => ({
      id: region.id,
      corners: overview.outlines.find((o) => o.region === region.id)?.corners,
      region,
    }))
  ).map(({ region }) => region);
}

/** The region for an exact, case-sensitive id, or undefined. */
export function regionById(id: string): Region | undefined {
  return regions.find((r) => r.id === id);
}

/** One crumb of a page's trail: its visible text and its site path. */
export type Crumb = { name: string; path: string };

/**
 * The region page's breadcrumb trail (D-10; 18-UI-SPEC Contract 6):
 * 'Photographs' (/photos), then the bare region name (not regionHeading, to
 * keep the trail short) at regionHref(id), the current page. The visible
 * Breadcrumb nav and the BreadcrumbList JSON-LD (breadcrumbLd) both read this
 * one list, so the structured data always equals the visible crumbs.
 *
 * @throws RangeError for an id that is not in the registry (exact, case-sensitive).
 */
export function regionBreadcrumb(id: string): readonly Crumb[] {
  const region = regionById(id);
  if (!region) throw new RangeError(`regionBreadcrumb: ${id} is not a registry region`);
  return [
    { name: 'Photographs', path: '/photos' },
    { name: region.name, path: regionHref(id) },
  ];
}

/** Each region's photo views, built once per module load (throws for a region with no photo). */
const VIEWS: ReadonlyMap<string, readonly PhotoView[]> = new Map(
  regions.map((r) => [r.id, buildPhotoViews(seriesInput(r.id))])
);

/**
 * One region's photos as views, in buildWaypoints' order (DEM height
 * ascending, ties broken by id).
 *
 * @throws RangeError for an id that is not in the registry.
 */
export function regionPhotoViews(id: string): readonly PhotoView[] {
  const views = VIEWS.get(id);
  if (!views) throw new RangeError(`regionPhotoViews: ${id} is not a registry region`);
  return views;
}

/**
 * Each region's cover view (D-13), resolved once at module load. The schema
 * checks only the cover id's shape; a cover that is not one of the region's own
 * photos throws here, naming the region and the registry file, so a bad pick
 * fails the build instead of putting another region's photo on the card.
 */
const COVERS: ReadonlyMap<string, PhotoView> = new Map(
  regions.map((r) => {
    const cover = regionPhotoViews(r.id).find((v) => v.id === r.cover);
    if (!cover) {
      throw new Error(
        `lib/regions: region ${r.id} names cover ${r.cover} in data/regions/regions.json, ` +
          'which is not one of its photos (data/photos/photo-map.json)'
      );
    }
    return [r.id, cover];
  })
);

/**
 * The region's cover photo as a view (D-13: Tim's pick, the subject of the
 * region's Open Graph card): the view in regionPhotoViews(id) whose id is the
 * registry's cover.
 *
 * @throws RangeError for an id that is not in the registry.
 */
export function regionCover(id: string): PhotoView {
  const cover = COVERS.get(id);
  if (!cover) throw new RangeError(`regionCover: ${id} is not a registry region`);
  return cover;
}

/** The generated plate registry, read by plate id (the registry names plates as zod strings). */
const PLATES: Readonly<Record<string, { assets: { contours: { hero: string } } } | undefined>> =
  plates;

/**
 * Each region's contour field source (17 D-12: its plate's hero contour SVG,
 * the region OG card's background), resolved once at module load like COVERS.
 * The schema checks only the plate id's shape; a plate missing from
 * data/generated/plates.ts throws here, naming the region and the registry
 * file, so a bad plate fails the build instead of the card's first request
 * (17-REVIEW IN-01).
 */
const CONTOURS: ReadonlyMap<string, string> = new Map(
  regions.map((r) => {
    const src = PLATES[r.plate]?.assets.contours.hero;
    if (!src) {
      throw new Error(
        `lib/regions: region ${r.id} names plate ${r.plate} in data/regions/regions.json, ` +
          'which has no hero contour in data/generated/plates.ts (npm run terrain:build)'
      );
    }
    return [r.id, src];
  })
);

/**
 * The region's contour field: its plate's hero contour SVG, a content-hashed
 * path under public/ (the region OG card reads it from disk).
 *
 * @throws RangeError for an id that is not in the registry.
 */
export function regionContourSrc(id: string): string {
  const src = CONTOURS.get(id);
  if (!src) throw new RangeError(`regionContourSrc: ${id} is not a registry region`);
  return src;
}

/** The region of a generated photo, by photo id, or undefined for an unknown id. */
export function regionOfPhoto(photoId: string): string | undefined {
  return photos.find((p) => p.id === photoId)?.region;
}

/** The capture years of a region's photos, in view order. */
export function regionYears(id: string): readonly number[] {
  return regionPhotoViews(id).map((v) => v.years);
}

/**
 * The region's printed rights line (D-17): the view-model's rights pattern with
 * the span of the region's capture years, '© 2019–2026 Tim Lui, all rights
 * reserved'. JSON-LD copies this text exactly, so the markup never disagrees
 * with the page.
 */
export function regionRights(id: string): string {
  return `© ${formatYearRange(regionYears(id))} ${site.name}, all rights reserved`;
}

/** Display names for the registry's closed country list (data/schemas/region.ts). */
export const COUNTRY_NAME: Readonly<Record<Region['country'], string>> = {
  AT: 'Austria',
  CH: 'Switzerland',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  LI: 'Liechtenstein',
  MC: 'Monaco',
  SI: 'Slovenia',
};

/** The region page's h1: '{name}, {country name}' (D-14, approved). */
export function regionHeading(region: Pick<Region, 'name' | 'country'>): string {
  return `${region.name}, ${COUNTRY_NAME[region.country]}`;
}

/**
 * The page title, rendered through the root template as '{title} · Tim Lui'
 * (D-14, approved: the heading). An unknown id throws: callers check regionById first.
 */
export function regionTitle(id: string): string {
  const region = regionById(id);
  if (!region) throw new RangeError(`regionTitle: ${id} is not a registry region`);
  return regionHeading(region);
}

/** U+00A0, so 'ground' stays on its number, as formatAltitude prints it. */
const NBSP = String.fromCharCode(0xa0);

/** What the description and the OG alt need from a region's photos. */
type RegionCopyInput = {
  name: string;
  country: Region['country'];
  views: readonly Pick<PhotoView, 'altitudeM' | 'aerial' | 'years'>[];
};

/**
 * The figures both copy strings print: the photo count with its noun, the
 * height range (printed once when the ends are equal, formatMetreRange), the
 * year span, and whether every photo is aerial (16 D-04), so the heights are
 * the ground under the drone. A region with mixed photos reads as a ground
 * region, as in the description.
 *
 * @throws RangeError for an empty view list (formatYearRange).
 */
function copyFigures(views: RegionCopyInput['views']) {
  const n = views.length;
  const heights = views.map((v) => v.altitudeM);
  return {
    n,
    noun: n === 1 ? 'photograph' : 'photographs',
    range: formatMetreRange(Math.min(...heights), Math.max(...heights)),
    years: formatYearRange(views.map((v) => v.years)),
    aerial: views.every((v) => v.aerial),
  };
}

/**
 * The region's meta description (D-14, approved), pure so a one-photo input is
 * testable: '{n} photographs by Tim Lui from {name}, {country name}, at
 * {lo–hi m}, {years}.', with '1 photograph' for one photo. When every photo is
 * aerial: '{n} aerial photographs by Tim Lui over {name}, {country name},
 * ground {range}, {years}.'
 *
 * @throws RangeError for an empty view list (formatYearRange).
 */
export function regionDescription(input: RegionCopyInput): string {
  const { name, country, views } = input;
  const { n, noun, range, years, aerial } = copyFigures(views);
  const place = `${name}, ${COUNTRY_NAME[country]}`;
  return aerial
    ? `${n} aerial ${noun} by ${site.name} over ${place}, ground${NBSP}${range}, ${years}.`
    : `${n} ${noun} by ${site.name} from ${place}, at ${range}, ${years}.`;
}

/**
 * The region OG card's alt text (D-14, approved; 17-07 reads it), mirroring
 * the 12-01 photo template '{title}, a photograph by Tim Lui. {short place},
 * {altitude}': '{name}, {n} photographs by Tim Lui. {country name}, {lo–hi m}'.
 * When every photo is aerial the range reads 'ground {range}', the same rule as
 * the description (Tim's reply: add "ground"), so it follows the data rather
 * than naming a region. An unknown id throws: callers check regionById first.
 */
export function regionOgAlt(id: string): string {
  const region = regionById(id);
  if (!region) throw new RangeError(`regionOgAlt: ${id} is not a registry region`);
  const { n, noun, range, aerial } = copyFigures(regionPhotoViews(id));
  const height = aerial ? `ground${NBSP}${range}` : range;
  return `${region.name}, ${n} ${noun} by ${site.name}. ${COUNTRY_NAME[region.country]}, ${height}`;
}

/**
 * What the region OG card's plate prints (17 D-12), from the same figures as
 * regionOgAlt, so the card and its alt never disagree: the count with its noun
 * ('7 photographs', '1 photograph'), the height range ('ground {range}' when
 * every photo is aerial, Tim's 17-01 rule) and the capture-year span. An
 * unknown id throws: callers check regionById first.
 */
export function regionCardFacts(id: string): { count: string; range: string; years: string } {
  if (!regionById(id)) throw new RangeError(`regionCardFacts: ${id} is not a registry region`);
  const { n, noun, range, years, aerial } = copyFigures(regionPhotoViews(id));
  return { count: `${n} ${noun}`, range: aerial ? `ground${NBSP}${range}` : range, years };
}

/**
 * The region page's own head fields (SEO-01, D-15 canonical half): the title,
 * the description and the canonical regionHref(id), which Next resolves
 * against metadataBase (site.url) into the absolute URL. An unknown id gets {}:
 * the proxy answers that path with the 404 before render.
 */
export function regionMetadata(id: string): Metadata {
  const region = regionById(id);
  if (!region) return {};
  return pageMetadata({
    title: regionTitle(id),
    description: regionDescription({
      name: region.name,
      country: region.country,
      views: regionPhotoViews(id),
    }),
    path: regionHref(id),
  });
}
