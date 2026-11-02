import { site } from '@/data/site';
import { buildPhotoViews } from '@/lib/photos/view-model';

/**
 * The shared route list (D-20): every content route once, with the nav
 * destination that must carry aria-current="page". Moved from
 * e2e/shell.spec.ts so later specs (axe, cross-browser) read one list.
 */

export type Label = (typeof site.nav)[number]['label'];

/** Each content route and the nav destination that must carry aria-current="page". */
export const ROUTES: ReadonlyArray<readonly [path: string, current: Label | null]> = [
  ['/', 'Home'],
  ['/photos', 'Photographs'],
  // The full photo page (LBOX-01, D-08): under /photos, Photographs stays current.
  ['/photos/' + buildPhotoViews()[0].slug, 'Photographs'],
  ['/projects', 'Engineering'],
  ['/projects/box', 'Engineering'],
  ['/roadmap', 'Roadmap'],
  ['/contact', 'Contact'],
  // Not a nav destination: no link is current.
  ['/offline', null],
];
