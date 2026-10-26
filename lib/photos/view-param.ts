/**
 * The gallery view parameter (PHOTO-02, D-14). Pure and import-free.
 * RED stub: the cases in lib/__tests__/photos-view-param.test.ts drive it.
 */

export const VIEWS = ['map', 'grid', 'carousel'] as const;

export type GalleryView = (typeof VIEWS)[number];

export const VIEW_LABELS: Record<GalleryView, string> = { map: 'Map', grid: 'Grid', carousel: 'Carousel' };

export function parseView(v: unknown): GalleryView {
  void v;
  throw new Error('parseView: not implemented');
}

export function viewHref(view: GalleryView): string {
  void view;
  throw new Error('viewHref: not implemented');
}
