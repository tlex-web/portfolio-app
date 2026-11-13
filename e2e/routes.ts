import sitemap from '@/app/sitemap';
import { site } from '@/data/site';
import { photoBySlug } from '@/lib/photos/view-model';

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

/** Each content route and the nav destination that must carry aria-current="page". */
export const ROUTES: ReadonlyArray<readonly [path: string, current: Label | null]> = [
  ['/', 'Home'],
  ['/photos', 'Photographs'],
  // The full photo page (LBOX-01, D-08): under /photos, Photographs stays current.
  ['/photos/' + photoTemplate.slug, 'Photographs'],
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
 * slugs, projects). Region pages join here through the sitemap when REGION-07
 * adds them, with no edit to this file.
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
 * again here. Region pages join through the sitemap (REGION-07).
 */
export const AUDIT_SWEEP: readonly string[] = SITEMAP_PATHS.filter(
  (p) => !ROUTES.some(([r]) => r === p)
);
