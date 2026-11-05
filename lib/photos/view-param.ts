/**
 * The gallery view parameter (PHOTO-02, D-14; 10-UI-SPEC "Page Structure",
 * URLs row; 10-RESEARCH "Code Examples"). Pure and import-free: keep it to
 * erasable TypeScript and never add an import.
 *
 * The URL is the only source of view state (locked): the Map is `/photos`
 * with no parameter and the default, Grid is `/photos?view=grid`, Carousel
 * `/photos?view=carousel`. parseView whitelists the three exact lowercase
 * values and maps everything else (absent, empty, a wrong case, a repeated
 * parameter that Next hands over as an array, any other string) to the Map,
 * so a visitor-controlled value never reaches the page except as one of three
 * fixed views (T-10-10).
 */

/** The three views in switcher order (D-14). */
export const VIEWS = ['map', 'grid', 'carousel'] as const;

export type GalleryView = (typeof VIEWS)[number];

/** The switcher labels and the sr-only h2 that names the mounted view. */
export const VIEW_LABELS: Record<GalleryView, string> = {
  map: 'Map',
  grid: 'Grid',
  carousel: 'Carousel',
};

function isView(v: unknown): v is GalleryView {
  return typeof v === 'string' && (VIEWS as readonly string[]).includes(v);
}

/** The view a `?view=` value selects: an exact match, else the Map (locked default). */
export function parseView(v: unknown): GalleryView {
  if (isView(v)) return v;
  return 'map';
}

/** The URL of a view: the Map is the bare `/photos`, the others carry `?view=`. */
export function viewHref(view: GalleryView): string {
  return view === 'map' ? '/photos' : `/photos?view=${view}`;
}
