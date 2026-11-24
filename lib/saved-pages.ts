/**
 * The offline saved-pages list (EDGE-02, D-12; 12-UI-SPEC E11 "/offline
 * saved-pages list").
 *
 * Two pure steps, no data imports, so the client island that reads Cache
 * Storage carries only the small catalog the server page hands it:
 *
 * 1. `savedPageCatalog` builds every page the list may ever show, titled from
 *    data: the `site.nav` labels for the top routes, then the region names
 *    (17 D-22, labelled 'Region', the word the URL uses), then the photo
 *    titles, then the project names, with a 'Region', 'Photograph' or
 *    'Project' label on detail pages, then the site pages outside the nav
 *    (/sources, 18 D-20) with no label. This mirrors the sitemap's order. The
 *    server page hands in the region ids and names, every published photo and
 *    SOURCES_PAGE; `/offline` is not a destination, so it never appears.
 * 2. `savedPageRows` keeps the catalog rows whose exact path is among the
 *    cached request URLs. Matching is by path, so assets, API and unknown paths
 *    drop and nothing outside the catalog can reach the screen: a cached URL is
 *    never shown as text (T-12-30). A URL with a query string never makes a
 *    row on its own. The service worker answers an offline navigation with an
 *    exact-URL cache match, so `/photos?view=grid` cached alone would not open
 *    `/photos`; when the bare path is cached too, the variant simply collapses
 *    into that one row. RSC (`_rsc`) entries drop the same way. A region page
 *    behaves like any other: `/photos/regions/<id>/` collapses into its row,
 *    while `/photos/regions` and an unknown id are not in the catalog.
 *
 * The one import is photoHref and regionHref (15 D-16, 17 D-06). Their module
 * reads the editorial copy only for a pure slug list, which the bundler drops
 * from the client island, and holds no region data. Never import
 * lib/regions.ts or the registry here: the SavedPages island imports this
 * module, so the registry would ship to the client (17-16's client-graph
 * guard). Region names reach the island only through the catalog prop.
 */
import { photoHref, regionHref } from '@/lib/photos/routes';

export type SavedPageRow = {
  /** Same-origin path of the page, no query string. */
  href: string;
  /** Title from data, never from the cached URL. */
  title: string;
  /** Section label for detail pages; nav pages have none. */
  label?: 'Region' | 'Photograph' | 'Project';
};

export type SavedPageSource = {
  nav: readonly { label: string; href: string }[];
  /** Region ids and names only, in registry order (D-22); never the registry's facts. */
  regions: readonly { id: string; name: string }[];
  photos: readonly { slug: string; title: string }[];
  projects: readonly { slug: string; name: string }[];
  /** Site pages outside the nav, listed after the projects in sitemap order (/sources). */
  pages: readonly { href: string; title: string }[];
};

/** Every listable page in display order: nav, then regions, then photos, each in data order, then projects, then the other site pages. */
export function savedPageCatalog({
  nav,
  regions,
  photos,
  projects,
  pages,
}: SavedPageSource): readonly SavedPageRow[] {
  return [
    ...nav.map(({ label, href }) => ({ href, title: label })),
    ...regions.map(({ id, name }) => ({
      href: regionHref(id),
      title: name,
      label: 'Region' as const,
    })),
    ...photos.map(({ slug, title }) => ({
      href: photoHref(slug),
      title,
      label: 'Photograph' as const,
    })),
    ...projects.map(({ slug, name }) => ({
      href: `/projects/${slug}`,
      title: name,
      label: 'Project' as const,
    })),
    ...pages.map(({ href, title }) => ({ href, title })),
  ];
}

/** The path of a cached request URL, or null when it is not a bare page URL. */
function cachedPath(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.search !== '') return null;
  const path = parsed.pathname;
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * The catalog rows this device has cached, in catalog order, each once.
 * `urls` are the absolute request URLs from every cache's `keys()`.
 */
export function savedPageRows(
  urls: readonly string[],
  catalog: readonly SavedPageRow[]
): SavedPageRow[] {
  const cached = new Set<string>();
  for (const raw of urls) {
    const path = cachedPath(raw);
    if (path !== null) cached.add(path);
  }
  return catalog.filter((row) => cached.has(row.href));
}
