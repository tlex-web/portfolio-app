import sitemap from '@/app/sitemap';
import { site } from '@/data/site';
import { photoBySlug } from '@/lib/photos/view-model';
import { regionById } from '@/lib/regions';

/**
 * The shared route list (D-20): every content route once, with the nav
 * destination that must carry aria-current="page". Moved from
 * e2e/shell.spec.ts so later specs (axe, cross-browser) read one list.
 */

export type Label = (typeof site.nav)[number]['label'];

/**
 * The photo page template's representative, by name (VERIFY-05, Pitfall 1): an
 * index into the photo views would shift when photos are added. A missing slug
 * throws here, so the audit cannot silently lose the template.
 */
const PHOTO_TEMPLATE_SLUG = 'matterhorn-from-zermatt';
const photoTemplate = photoBySlug(PHOTO_TEMPLATE_SLUG);
if (!photoTemplate) {
  throw new Error(
    `e2e/routes.ts: the photo template slug '${PHOTO_TEMPLATE_SLUG}' is not a committed photo; pick another named slug`
  );
}

/**
 * The region page template's representative, by id (REGION-07, VERIFY-05). A
 * registry without it throws here, so the audit cannot silently lose the
 * template.
 */
export const REGION_TEMPLATE_ID = 'zermatt';
if (!regionById(REGION_TEMPLATE_ID)) {
  throw new Error(
    `e2e/routes.ts: the region template id '${REGION_TEMPLATE_ID}' is not a registry region; pick another named id`
  );
}

/** Each content route and the nav destination that must carry aria-current="page". */
export const ROUTES: ReadonlyArray<readonly [path: string, current: Label | null]> = [
  ['/', 'Home'],
  ['/photos', 'Photographs'],
  // The full photo page (LBOX-01, D-08): under /photos, Photographs stays current.
  ['/photos/' + photoTemplate.slug, 'Photographs'],
  // The region page (REGION-07, D-01): under /photos, Photographs stays current.
  // A literal path, so the URL contract is checked independently of regionHref.
  ['/photos/regions/' + REGION_TEMPLATE_ID, 'Photographs'],
  ['/projects', 'Engineering'],
  ['/projects/box', 'Engineering'],
  ['/roadmap', 'Roadmap'],
  ['/contact', 'Contact'],
  // Not a nav destination: no link is current.
  ['/offline', null],
];

/**
 * Every page the sitemap lists, as an exact path (VERIFY-05): site.url is
 * stripped and the bare origin becomes '/'. Sitemap order is kept (nav, photo
 * slugs, projects). Region pages join here through the sitemap once 17-10
 * lists them, with no edit to this file.
 */
export const SITEMAP_PATHS: readonly string[] = sitemap().map(({ url }) => {
  if (!url.startsWith(site.url)) {
    throw new Error(`e2e/routes.ts: sitemap URL ${url} is not on site.url ${site.url}`);
  }
  const path = url.slice(site.url.length);
  return path === '' ? '/' : path;
});

/**
 * The pages audited once in Chromium at 1440 (VERIFY-05): every sitemap path
 * that is not a ROUTES template entry, in sitemap order. A ROUTES path is
 * audited by its template test in three engines at three widths and never
 * again here. The other region pages join through the sitemap (REGION-07);
 * the ROUTES region entry is filtered out.
 */
export const AUDIT_SWEEP: readonly string[] = SITEMAP_PATHS.filter(
  (p) => !ROUTES.some(([r]) => r === p)
);
