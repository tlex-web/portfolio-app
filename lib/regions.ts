import type { Metadata } from 'next';
import { photos } from '@/data/generated/photos';
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
 * height ascending, ties broken by id); nothing here re-sorts.
 *
 * Server-only: this module holds the registry's names and sourced facts, so no
 * 'use client' file may import it, directly or through another module (the
 * client-graph guard, 17-16). Region URLs come from regionHref in
 * lib/photos/routes.ts (D-06); proxy.ts reads its id list from
 * lib/photos/region-ids.ts, never from here.
 *
 * D-14: the heading, title and description text below is the draft brought to
 * Tim's copy checkpoint (17-01 Task 2). Approved text replaces it verbatim.
 */

/** The parsed registry (a schema violation throws at module load). */
const parsed = Regions.parse(registry);

/** Every region, in registry order (ortler, saalfelden, zermatt). */
export const regions: readonly Region[] = parsed.regions;

/** The region ids in registry order; generateStaticParams reads these. */
export const regionIds: readonly string[] = regions.map((r) => r.id);

/** The region for an exact, case-sensitive id, or undefined. */
export function regionById(id: string): Region | undefined {
  return regions.find((r) => r.id === id);
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

/** The region page's h1: '{name}, {country name}' (D-14 draft). */
export function regionHeading(region: Pick<Region, 'name' | 'country'>): string {
  return `${region.name}, ${COUNTRY_NAME[region.country]}`;
}

/**
 * The page title, rendered through the root template as '{title} · Tim Lui'
 * (D-14 draft: the heading). An unknown id throws: callers check regionById first.
 */
export function regionTitle(id: string): string {
  const region = regionById(id);
  if (!region) throw new RangeError(`regionTitle: ${id} is not a registry region`);
  return regionHeading(region);
}

/** U+00A0, so 'ground' stays on its number, as formatAltitude prints it. */
const NBSP = String.fromCharCode(0xa0);

/**
 * The region's meta description (D-14 draft), pure so a one-photo input is
 * testable: '{n} photographs by Tim Lui from {name}, {country name}, at
 * {lo–hi m}, {years}.', with '1 photograph' for one photo and the height
 * printed once when the ends are equal (formatMetreRange). When every photo
 * is aerial (16 D-04) the heights are the ground under the drone: '{n} aerial
 * photographs by Tim Lui over {name}, {country name}, ground {range}, {years}.'
 *
 * @throws RangeError for an empty view list (formatYearRange).
 */
export function regionDescription(input: {
  name: string;
  country: Region['country'];
  views: readonly Pick<PhotoView, 'altitudeM' | 'aerial' | 'years'>[];
}): string {
  const { name, country, views } = input;
  const n = views.length;
  const noun = n === 1 ? 'photograph' : 'photographs';
  const heights = views.map((v) => v.altitudeM);
  const range = formatMetreRange(Math.min(...heights), Math.max(...heights));
  const years = formatYearRange(views.map((v) => v.years));
  const place = `${name}, ${COUNTRY_NAME[country]}`;
  return views.every((v) => v.aerial)
    ? `${n} aerial ${noun} by ${site.name} over ${place}, ground${NBSP}${range}, ${years}.`
    : `${n} ${noun} by ${site.name} from ${place}, at ${range}, ${years}.`;
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
