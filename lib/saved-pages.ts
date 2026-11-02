/**
 * The offline saved-pages list (EDGE-02, D-12; 12-UI-SPEC E11 "/offline
 * saved-pages list").
 *
 * Two pure steps, no data imports, so the client island that reads Cache
 * Storage carries only the small catalog the server page hands it:
 *
 * 1. `savedPageCatalog` builds every page the list may ever show, titled from
 *    data: the `site.nav` labels for the top routes, photo titles and project
 *    names, in that order, with a 'Photograph' or 'Project' label on detail
 *    pages. `/offline` is not a destination, so it never appears.
 * 2. `savedPageRows` keeps the catalog rows whose exact path is among the
 *    cached request URLs. Matching is by path, so assets, API and unknown paths
 *    drop and nothing outside the catalog can reach the screen: a cached URL is
 *    never shown as text (T-12-30). A URL with a query string never makes a
 *    row on its own. The service worker answers an offline navigation with an
 *    exact-URL cache match, so `/photos?view=grid` cached alone would not open
 *    `/photos`; when the bare path is cached too, the variant simply collapses
 *    into that one row. RSC (`_rsc`) entries drop the same way.
 */

export type SavedPageRow = {
  /** Same-origin path of the page, no query string. */
  href: string;
  /** Title from data, never from the cached URL. */
  title: string;
  /** Section label for detail pages; nav pages have none. */
  label?: 'Photograph' | 'Project';
};

export type SavedPageSource = {
  nav: readonly { label: string; href: string }[];
  photos: readonly { slug: string; title: string }[];
  projects: readonly { slug: string; name: string }[];
};

/** Every listable page in display order: nav, then photos in data order, then projects. */
export function savedPageCatalog({ nav, photos, projects }: SavedPageSource): readonly SavedPageRow[] {
  return [
    ...nav.map(({ label, href }) => ({ href, title: label })),
    ...photos.map(({ slug, title }) => ({ href: `/photos/${slug}`, title, label: 'Photograph' as const })),
    ...projects.map(({ slug, name }) => ({ href: `/projects/${slug}`, title: name, label: 'Project' as const })),
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
export function savedPageRows(urls: readonly string[], catalog: readonly SavedPageRow[]): SavedPageRow[] {
  const cached = new Set<string>();
  for (const raw of urls) {
    const path = cachedPath(raw);
    if (path !== null) cached.add(path);
  }
  return catalog.filter((row) => cached.has(row.href));
}
