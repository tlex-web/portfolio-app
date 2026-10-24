/**
 * Editorial photo copy contract (D-05, D-07, DATA-03).
 *
 * data/photos/editorial.ts holds the hand-written part of each photo: the
 * descriptive slug, title, alt text, location, story, subject tags and
 * hotspot annotations, keyed by the camera id that ties it to the generated
 * facts (data/generated/photos.ts) and the image manifest.
 *
 * - Every annotation fact names its source (T-08-30): an https URL that was
 *   read when the copy was written, or one of `dem` (the terrain model),
 *   `exif` (the camera) or `Tim` (the photographer).
 * - An annotation elevation is a reference, never a hand-typed number:
 *   `photo` is the photo's DEM height, `summit` the official summit constant.
 *   The bridge (data/landscapes.ts) formats it with formatMetres.
 * - Year and season tags are derived from the capture (D-08), so subject tags
 *   here are lowercase words only and can never be a year.
 *
 * Imports only 'zod' (RESEARCH Pattern 1). Client code imports types from this
 * file with `import type`, so zod never reaches a client bundle.
 */
import { z } from 'zod';

/** One checkable claim and where it comes from. */
export const Fact = z.strictObject({
  text: z.string().min(1),
  source: z.union([z.url({ protocol: /^https$/ }), z.enum(['dem', 'exif', 'Tim'])]),
});
export type Fact = z.infer<typeof Fact>;

/** Which height an annotation shows: the photo's DEM height or the official summit height (D-17). */
export const ElevationRef = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('photo') }),
  z.strictObject({ kind: z.literal('summit') }),
]);
export type ElevationRef = z.infer<typeof ElevationRef>;

const EditorialAnnotation = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  /** Percent of the image width and height (0-100). */
  position: z.strictObject({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }),
  icon: z.enum(['mountain', 'water', 'glacier', 'trail', 'lake', 'peak']),
  details: z
    .strictObject({
      elevation: ElevationRef.optional(),
      distance: Fact.optional(),
      facts: z.array(Fact).optional(),
    })
    .optional(),
});
export type EditorialAnnotation = z.infer<typeof EditorialAnnotation>;

/** The hand-written copy of one photo. */
export const Editorial = z.strictObject({
  /** Public URL segment for /photos/[slug] (D-07, one-way once Phase 10 ships). */
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().min(1),
  alt: z.string().min(1),
  location: z.string().min(1),
  /** First person, short and factual: at most three sentences (D-05). */
  story: z.string().min(1),
  /** Hand-written subject tags; year and season are derived elsewhere (D-08). */
  subjectTags: z.array(z.string().regex(/^[a-z]+(-[a-z]+)*$/)),
  annotations: z.array(EditorialAnnotation),
});
export type Editorial = z.infer<typeof Editorial>;

/** Editorial copy keyed by camera id (the keys of data/generated/photos.ts). */
export const EditorialMap = z.record(z.string(), Editorial);
export type EditorialMap = z.infer<typeof EditorialMap>;
