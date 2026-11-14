import { photoBySlug, type PhotoView } from '@/lib/photos/view-model';

/**
 * Named photo fixtures, shared by the Jest tests and the e2e specs (ROADMAP
 * Phase 15 groundwork: "named test fixtures instead of index lookups";
 * 15-RESEARCH Pitfall 6). A test that audits one photo's own facts (its title,
 * alt, slug, coordinates, EXIF, card or map mark) selects it by slug, so adding
 * photos to the data cannot change which photo the test audits. A test whose
 * subject is a position in the series (the first slide, the photo one step on,
 * the last photo) keeps its index lookup instead.
 */

/** The current Zermatt photos' slugs, by name. */
export const SLUGS = {
  matterhornFromZermatt: 'matterhorn-from-zermatt',
  gornerschluchtWaterfall: 'gornerschlucht-waterfall',
  matterhornGlacierTrail: 'matterhorn-glacier-trail',
  riffelseeReflection: 'riffelsee-reflection',
} as const;

/**
 * The view for a slug. Throws for a slug with no view, so a renamed or removed
 * photo fails the test loudly instead of auditing undefined.
 */
export function viewBySlug(slug: string): PhotoView {
  const view = photoBySlug(slug);
  if (!view) throw new Error(`unknown photo slug ${slug}`);
  return view;
}
