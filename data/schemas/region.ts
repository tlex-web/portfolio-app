/**
 * Region registry contract (DATA-10, D-03).
 *
 * `Regions` is the shape of data/regions/regions.json. A region is an editorial
 * series (the photos it holds are named in data/photos/photo-map.json, D-01); a
 * plate is a terrain sheet (data/terrain/plates.json). They are separate on
 * purpose, so a later plate can serve a region while Home keeps its own plate.
 * The schema holds only the fields Phase 15 needs and is strict, so it grows
 * deliberately (Phase 16).
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

/** One region: its id, display name and the plate its photos are sampled on (D-03, D-04). */
export const Region = z.strictObject({
  id: RegionId,
  name: z.string().min(1),
  plate: PlateSlug,
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
