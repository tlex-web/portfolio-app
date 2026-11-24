/**
 * Region registry contract (DATA-10, D-03).
 *
 * `Regions` is the shape of data/regions/regions.json. A region is an editorial
 * series (the photos it holds are named in data/photos/photo-map.json, D-01); a
 * plate is a terrain sheet (data/terrain/plates.json). They are separate on
 * purpose, so a later plate can serve a region while Home keeps its own plate.
 * The schema is strict, so it grows deliberately: Phase 15 gave it id, name and
 * plate; 16-14 adds the country and the sourced facts Tim approved in 16-08;
 * 17-07 adds the cover photo Tim picked (17 D-13).
 *
 * Imports only 'zod' on purpose (RESEARCH Pattern 1): Node 24 type-strips this
 * file when a scripts/*.mjs generator imports it, and Node cannot resolve `@/`
 * or extension-less relative imports. Keep it to erasable TypeScript.
 */
import { z } from 'zod';

/** A region id: a lowercase slug (it becomes a public URL segment in Phase 17). */
export const RegionId = z
  .string()
  .regex(/^[a-z]+(-[a-z]+)*$/, 'region id: lowercase words joined by single hyphens');
export type RegionId = z.infer<typeof RegionId>;

/**
 * The plate-id slug shape, duplicated from terrain.ts's PlateId rather than
 * imported across schema files (photo.ts duplicates its id regex the same way).
 * Whether the plate exists is checked against data/terrain/plates.json by
 * photos:build and data/__tests__/photo-map.test.ts.
 */
const PlateSlug = z
  .string()
  .regex(/^[a-z]+(-[a-z]+)*$/, 'plate id: lowercase words joined by single hyphens');

/**
 * The photo-id slug shape, duplicated from photo.ts's PHOTO_ID_SLUG (schema files
 * import only zod, like PlateSlug): lowercase letters and digits joined by single
 * hyphens, at most 40 characters. Whether the id is one of the region's photos is
 * checked against data/photos/photo-map.json by data/__tests__/photo-map.test.ts
 * and at module load by lib/regions.ts.
 */
const PHOTO_ID_RULE =
  'photo id: lowercase letters and digits joined by single hyphens, at most 40 characters';
const CoverPhotoId = z
  .string()
  .max(40, PHOTO_ID_RULE)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, PHOTO_ID_RULE);

/**
 * The region's country: the same closed list as photo.ts's Country, duplicated
 * like PlateSlug (schema files import only zod). A region spans one country (16
 * D-08 / D-13).
 */
const RegionCountry = z.enum(['AT', 'CH', 'DE', 'FR', 'IT', 'LI', 'MC', 'SI']);

/**
 * One sourced region fact: the editorial Fact shape (data/schemas/editorial.ts),
 * duplicated for the same reason. The source is an https URL that was read when
 * the text was written, or 'Tim' (16-08: Tim approved each fact's text).
 */
export const RegionFact = z.strictObject({
  text: z.string().min(1),
  source: z.union([z.url({ protocol: /^https$/ }), z.literal('Tim')]),
});
export type RegionFact = z.infer<typeof RegionFact>;

/**
 * One region: its id, display name, country, the plate its photos are sampled on
 * (D-03, D-04), its cover photo and one to three short sourced facts (16
 * CONTEXT: a country and a short facts block, as data on the strict record).
 * The cover (17 D-13) is the id of the photo Tim picked as the region's face:
 * the subject of its Open Graph card. It is required, with no default.
 */
export const Region = z.strictObject({
  id: RegionId,
  name: z.string().min(1),
  country: RegionCountry,
  plate: PlateSlug,
  cover: CoverPhotoId,
  facts: z
    .array(RegionFact)
    .min(1, 'a region needs at least one fact')
    .max(3, 'a region holds at most three facts'),
});
export type Region = z.infer<typeof Region>;

/** data/regions/regions.json: at least one region, ids unique and sorted ascending. */
export const Regions = z
  .strictObject({
    schemaVersion: z.literal(1),
    regions: z.array(Region).min(1, 'the registry needs at least one region'),
  })
  .refine((r) => r.regions.every((x, i) => i === 0 || r.regions[i - 1].id < x.id), {
    message: 'region ids must be unique and sorted ascending',
    path: ['regions'],
  });
export type Regions = z.infer<typeof Regions>;
