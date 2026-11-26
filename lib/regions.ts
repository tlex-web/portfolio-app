import type { Metadata } from 'next';
import { overview } from '@/data/generated/overview';
import { photos } from '@/data/generated/photos';
import { plates } from '@/data/generated/plates';
import registry from '@/data/regions/regions.json';
import { Regions, type Region } from '@/data/schemas/region';
import { site } from '@/data/site';
import { countLabel, formatMetreRange, formatYearRange } from '@/lib/home-format';
import { pageMetadata } from '@/lib/metadata';
import { formatMetres } from '@/lib/photo-format';
import type { OverviewInput } from '@/lib/photos/overview-layout';
import { platePins, type PlatePin } from '@/lib/photos/plate-layout';
import { photoHref, regionHref } from '@/lib/photos/routes';
import {
  buildPhotoViews,
  publishedViews,
  seriesInput,
  type PhotoView,
} from '@/lib/photos/view-model';
import type { EndCardProps } from '@/components/photos/EndCard';

export type { EndCardProps };

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

/**
 * The entry after `id` in an already ordered list, wrapping from the last to
 * the first (D-11), pure so a test can pass a fixture list. A one-entry list
 * has no next entry: undefined, never the entry itself.
 *
 * @throws RangeError when `id` is not in the list (exact, case-sensitive).
 */
export function nextRegionIn<T extends { id: string }>(
  list: readonly T[],
  id: string
): T | undefined {
  const i = list.findIndex((entry) => entry.id === id);
  if (i === -1) throw new RangeError(`nextRegion: ${id} is not a registry region`);
  if (list.length < 2) return undefined;
  return list[(i + 1) % list.length];
}

/**
 * The region the next-region block leads to (REGION-02; D-01, D-11): the next
 * in regionsWestToEast(), wrapping from the last to the first (Zermatt →
 * Ortler → Saalfelden → Zermatt), or undefined while the registry holds one
 * region.
 *
 * @throws RangeError for an id that is not in the registry (exact, case-sensitive).
 */
export function nextRegion(id: string): Region | undefined {
  return nextRegionIn(regionsWestToEast(), id);
}

/**
 * The region's 1-based place west to east (D-01): Zermatt 1, Ortler 2,
 * Saalfelden 3.
 *
 * @throws RangeError for an id that is not in the registry (exact, case-sensitive).
 */
export function regionNumber(id: string): number {
  const i = regionsWestToEast().findIndex((r) => r.id === id);
  if (i === -1) throw new RangeError(`regionNumber: ${id} is not a registry region`);
  return i + 1;
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

/**
 * A photo page's breadcrumb trail (18 D-10; 18-UI-SPEC Contract 6):
 * 'Photographs' (/photos), the bare region name at regionHref (as the region
 * page's own trail), then the photo's title at photoHref(slug), the current
 * page. The photo page renders the visible Breadcrumb from this list (the last
 * crumb without a link) and its BreadcrumbList JSON-LD with breadcrumbLd, so
 * the structured data always equals the visible crumbs at load. The lightbox
 * shows no trail (the region page behind it has its own).
 *
 * @throws RangeError for a slug that is not a published photo (exact, case-sensitive) or has no region.
 */
export function photoBreadcrumb(slug: string): readonly Crumb[] {
  const view = publishedViews.find((v) => v.slug === slug);
  if (!view) throw new RangeError(`photoBreadcrumb: ${slug} is not a published photo`);
  const regionId = photos.find((p) => p.id === view.id)?.region;
  const region = regionId === undefined ? undefined : regionById(regionId);
  if (!region) throw new RangeError(`photoBreadcrumb: ${slug} has no registry region`);
  return [...regionBreadcrumb(region.id), { name: view.title, path: photoHref(slug) }];
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

/** A plate's hillshade derivatives: content-hashed AVIF and WebP at 640 and 1100 px. */
type Hillshade = {
  avif: { readonly '640': string; readonly '1100': string };
  webp: { readonly '640': string; readonly '1100': string };
};

/** The generated plate registry, read by plate id (the registry names plates as zod strings). */
const PLATES: Readonly<
  Record<string, { assets: { contours: { hero: string }; hillshade?: Hillshade } } | undefined>
> = plates;

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

/**
 * Each region's hillshade (18-09: the region plate's relief), resolved once at
 * module load like CONTOURS: a plate without one throws here, naming the
 * region and the registry file, so a bad plate fails the build.
 */
const HILLSHADES: ReadonlyMap<string, Hillshade> = new Map(
  regions.map((r) => {
    const hillshade = PLATES[r.plate]?.assets.hillshade;
    if (!hillshade) {
      throw new Error(
        `lib/regions: region ${r.id} names plate ${r.plate} in data/regions/regions.json, ` +
          'which has no hillshade in data/generated/plates.ts (npm run terrain:build)'
      );
    }
    return [r.id, hillshade];
  })
);

/** The region plate's plain props (18-09; REGION-02): built on the server, passed to PlateSheet. */
export type RegionPlateSheet = {
  /** The region id (the sheet's container name is derived from it). */
  id: string;
  /** The plate's hillshade derivatives (the relief, at --relief-opacity). */
  hillshade: Hillshade;
  /** The sheet ContourField reads: only the plate's hero contour URL. */
  contours: { assets: { contours: { hero: string } } };
  /** One pin per photo with a position, numbered by its place in the sequence (1 = lowest). */
  pins: readonly PlatePin[];
};

/**
 * The region page's local plate (REGION-02; 18-UI-SPEC Contract 2 "Facts and
 * plate"): the region's own plate hillshade and hero contours, and a pin per
 * photo from regionPhotoViews (its stored uv, so no pin is placed more
 * precisely than the published position, T-18-24). Plain strings and numbers
 * only: the plate registry stays on the server.
 *
 * @throws RangeError for an id that is not in the registry.
 */
export function regionPlateSheet(id: string): RegionPlateSheet {
  const hillshade = HILLSHADES.get(id);
  if (!hillshade) throw new RangeError(`regionPlateSheet: ${id} is not a registry region`);
  return {
    id,
    hillshade,
    contours: { assets: { contours: { hero: regionContourSrc(id) } } },
    pins: platePins(regionPhotoViews(id)),
  };
}

/** The region of a generated photo, by photo id, or undefined for an unknown id. */
export function regionOfPhoto(photoId: string): string | undefined {
  return photos.find((p) => p.id === photoId)?.region;
}

/**
 * A photo page's way back (18 D-09; 18-UI-SPEC Contract 3): its region page,
 * by the bare region name, for every published photo, the v2.0 four included
 * (they leave their 'All photographs' link and their byte-identical page on
 * purpose). The photo page builds it here on the server from the registry by
 * photo id, never from the URL (T-17-14, T-18-37), and passes it to the viewer
 * as the serialisable `back` prop: both back links ('Back to {name}'), the page
 * Escape and the legend ('Esc back to {name}') read it.
 *
 * @throws RangeError naming the id for an unknown photo id or a photo with no registry region.
 */
export function photoBack(photoId: string): { href: string; name: string } {
  const regionId = regionOfPhoto(photoId);
  const region = regionId === undefined ? undefined : regionById(regionId);
  if (!region) throw new RangeError(`photoBack: photo ${photoId} has no registry region`);
  return { href: regionHref(region.id), name: region.name };
}

/**
 * The photos a viewer steps through for a photo (LBOX-09, 18 D-12): its
 * region's series, regionPhotoViews(regionOfPhoto(photoId)), in sequence order
 * (DEM height ascending, ties broken by id), each view's prevSlug and nextSlug
 * among that series. Both photo routes, the full page and the intercepted
 * lightbox, build it here on the server and hand it to PhotoViewer as props, so
 * the registry never reaches the client viewer (T-18-62). It supersedes 17
 * D-08's per-photo set (the light-table four, or the photo alone).
 *
 * @throws RangeError naming the id for an unknown photo id or a photo with no region.
 */
export function regionViewerSet(photoId: string): readonly PhotoView[] {
  const regionId = regionOfPhoto(photoId);
  if (regionId === undefined || !VIEWS.has(regionId)) {
    throw new RangeError(`regionViewerSet: photo ${photoId} has no registry region`);
  }
  return regionPhotoViews(regionId);
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

/**
 * The viewer's end-of-series card for a region (LBOX-09, 18 D-12; 18-UI-SPEC
 * Contract 3 "End-of-series card", UI E7), built on the server and handed to
 * PhotoViewer as props, so no registry string reaches the client viewer by
 * import (T-18-35): the heading 'End of the {name} series', this region's
 * regionCardFacts parts, the next region in `list` (wrapping, D-11) as the
 * trail sign's heading, href and facts, '/photos' for 'All regions', and the
 * live-region sentence. With no next region (a one-region list) `next` is null
 * and the sentence ends after the series.
 *
 * Pure over `list` so a test can pass a one-region fixture; regionEndCard
 * passes regionsWestToEast().
 *
 * @throws RangeError when `id` is not in the list or not a registry region.
 */
export function regionEndCardIn(list: readonly Region[], id: string): EndCardProps {
  const region = regionById(id);
  if (!region) throw new RangeError(`regionEndCard: ${id} is not a registry region`);
  const next = nextRegionIn(list, id);
  const heading = `End of the ${region.name} series`;
  const nextHeading = next ? regionHeading(next) : null;
  return {
    regionName: region.name,
    heading,
    facts: factsParts(id),
    next:
      next && nextHeading
        ? { heading: nextHeading, href: regionHref(next.id), facts: factsParts(next.id) }
        : null,
    allHref: '/photos',
    announcement: nextHeading ? `${heading}. Next region: ${nextHeading}.` : `${heading}.`,
  };
}

/**
 * The end-of-series card for a registry region, leading on to the next region
 * west to east (D-01, D-11): Zermatt → Ortler → Saalfelden → Zermatt.
 *
 * @throws RangeError for an id that is not a registry region.
 */
export function regionEndCard(id: string): EndCardProps {
  return regionEndCardIn(regionsWestToEast(), id);
}

/** regionCardFacts as the FactsLine parts, in order: count, range, years. */
function factsParts(id: string): readonly string[] {
  const { count, range, years } = regionCardFacts(id);
  return [count, range, years];
}

/**
 * The Alps overview sheet's layout input (REGION-01; 18-UI-SPEC Contract 1
 * "Sheet"): the plain OverviewInput that overviewCss and overviewLayout
 * (lib/photos/overview-layout.ts, 18-13) take, built on the server from the
 * registry and the server-only overview (data/generated/overview.ts), so the
 * OverviewSheet server component passes on plain numbers and strings only.
 *
 * Regions west to east (regionsWestToEast, D-01), numbered 1..N in that order
 * (regionNumber: the list badges show the same numbers), each with its short
 * name for the plate's first line, its photo count ('7 photographs') for the
 * second, and its overview outline's four corners. Summits in the overview's
 * order with their stored height printed plainly, Triglav's included (18-01
 * P6, the default Tim confirmed).
 *
 * @throws RangeError naming a region with no overview outline or an outline
 *   that does not have exactly four corners (UI E1/partial: no region renders
 *   without its rectangle and marker), or for zero regions (UI E1/empty: the
 *   overview never renders an empty sheet, so the build fails).
 */
export function overviewSheetInput(): OverviewInput {
  const ordered = regionsWestToEast();
  if (ordered.length === 0) throw new RangeError('overviewSheetInput: there are no regions');
  return {
    regions: ordered.map((region, i) => {
      const outline = overview.outlines.find((o) => o.region === region.id);
      if (!outline || outline.corners.length !== 4) {
        throw new RangeError(
          `overviewSheetInput: ${region.id} has no four-corner overview outline (npm run terrain:build)`
        );
      }
      return {
        id: region.id,
        number: i + 1,
        name: region.name,
        count: countLabel(regionPhotoViews(region.id).length, 'photograph', 'photographs'),
        corners: outline.corners.map(({ u, v }) => ({ u, v })),
      };
    }),
    summits: overview.summits.map((s) => ({
      name: s.name,
      u: s.uv.u,
      v: s.uv.v,
      height: formatMetres(s.officialM),
    })),
  };
}
