/**
 * Trail data contracts (ENG-01, D-05, D-07).
 *
 * `TrailsFile` is the shape of data/terrain/source/trails.json: the official
 * swisstopo hiking-trail geometry of the two profile trails (box: Hörnliweg
 * No. 27, coin-flip: Zmutt path No. 2), which `scripts/terrain/fetch-trails.mjs`
 * writes once, by hand, from the network. `scripts/terrain/build-trails.mjs`
 * derives data/generated/trail-profiles.ts from it offline and verifies every
 * `polylineSha256` on each `--check` (T-11-09).
 *
 * Imports only 'zod' on purpose (data/schemas/terrain.ts, RESEARCH Pattern 1):
 * Node type-strips this file when a scripts/*.mjs generator imports it. Keep it
 * to erasable TypeScript, and keep every object strict.
 */
import { z } from 'zod';

/** A display name that is already NFC, so 'Hörnlihütte' never splits into a base letter and a combining mark. */
const NfcName = z
  .string()
  .min(1)
  .refine((s) => s === s.normalize('NFC'), 'name must be NFC-normalised');

/** An LV95 (EPSG:2056) point in metres, rounded to 0.1 m. */
const Lv95Point = z.strictObject({ e: z.number(), n: z.number() });

/** One polyline vertex `[e, n]` in LV95 metres. */
const Vertex = z.tuple([z.number(), z.number()]);

/** A named trail endpoint. */
const Place = z.strictObject({ name: NfcName, lv95: Lv95Point });

const IsoUtc = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/, 'ISO 8601 UTC timestamp');

const Sha256 = z.string().regex(/^[0-9a-f]{64}$/, 'lowercase sha256 hex');

export const TrailSpec = z.strictObject({
  id: z.enum(['hoernliweg-27', 'zmutt-2']),
  name: NfcName,
  /** The waymarked route number in the official Zermatt listing. */
  number: z.number().int().positive(),
  /** The official zermatt.swiss listing: the source of record for name, grade and length. */
  listingUrl: z.url({ protocol: /^https$/ }),
  sacGrade: z.enum(['T1', 'T2', 'T3', 'T4', 'T5', 'T6']),
  /** The listing's length in metres; the routed polyline stays within 10 % of it. */
  officialLengthM: z.number().int().positive(),
  start: Place,
  end: Place,
  /** Via points the route was forced through, in order (empty when none). */
  via: z.array(Lv95Point),
  polyline: z.array(Vertex).min(2),
  provenance: z.strictObject({
    layer: z.literal('ch.swisstopo.swisstlm3d-wanderwege'),
    /** swissTLM3D Wanderwege feature ids the routed line runs along, in route order. */
    featureIds: z.array(z.string().regex(/^\d+$/, 'numeric feature id')).min(1),
    fetchedAt: IsoUtc,
  }),
  /** sha256 of `JSON.stringify(polyline)`, verified on every `trails:build -- --check`. */
  polylineSha256: Sha256,
});
export type TrailSpec = z.infer<typeof TrailSpec>;

export const TrailsFile = z
  .strictObject({ trails: z.array(TrailSpec).min(1) })
  .refine(
    (f) => new Set(f.trails.map((t) => t.id)).size === f.trails.length,
    'trail ids must be unique'
  );
export type TrailsFile = z.infer<typeof TrailsFile>;
