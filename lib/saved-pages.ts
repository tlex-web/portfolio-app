// RED skeleton (12-15): exports the planned names with wrong values; GREEN replaces it.
export type SavedPageRow = { href: string; title: string; label?: 'Photograph' | 'Project' };

export type SavedPageSource = {
  nav: readonly { label: string; href: string }[];
  photos: readonly { slug: string; title: string }[];
  projects: readonly { slug: string; name: string }[];
};

export function savedPageCatalog(source: SavedPageSource): readonly SavedPageRow[] {
  void source;
  return [];
}

export function savedPageRows(urls: readonly string[], catalog: readonly SavedPageRow[]): SavedPageRow[] {
  void urls;
  void catalog;
  return [];
}
