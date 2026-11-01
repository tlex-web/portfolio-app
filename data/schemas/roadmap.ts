/**
 * Route-log data contract (ROUTE-01, ROUTE-03; D-17, D-18, D-20, D-31, D-32).
 *
 * Each row is one milestone on the route log at /roadmap. `area` is the project
 * the row belongs to: this site (`portfolio`), `box` or `coin-flip`, the same
 * three values the `?project=` filter accepts (lib/route-log.ts PROJECTS).
 * `order` places the row on the climb, rising from the oldest work at the base
 * to the furthest plan at the summit; it is unique, so no two rows tie (ROUTE-01).
 * `completedAt` is a YYYY-MM-DD date, given only for completed work and only
 * where Tim confirmed it; a completed row without one renders "Completed".
 * `phases` is the v2.0 phase disclosure (D-18).
 *
 * Every object is a `z.strictObject`, so a misspelt or leftover field (the v1
 * `priority`, for example) fails the parse instead of passing silently
 * (RESEARCH Pitfall 5). The inferred type stays assignable to `RouteLogItem`.
 *
 * Imports only 'zod' on purpose (RESEARCH Pattern 1), like data/schemas/project.ts:
 * keep it to erasable TypeScript.
 */
import { z } from 'zod';

/** A calendar date as YYYY-MM-DD; formatLogDate checks that it exists. */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const RoadmapStatus = z.enum(['planned', 'in-progress', 'completed']);

/** One phase inside the portfolio v2.0 row (D-18). */
export const RoadmapPhaseSchema = z.strictObject({
  n: z.number().int(),
  name: z.string().min(1),
  status: RoadmapStatus,
  completedAt: IsoDate.optional(),
});

/** One route-log row. */
export const RoadmapItemSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  area: z.enum(['portfolio', 'box', 'coin-flip']),
  status: RoadmapStatus,
  order: z.number().int(),
  completedAt: IsoDate.optional(),
  targetRelease: z.string().min(1).optional(),
  phases: z.array(RoadmapPhaseSchema).optional(),
});

export const RoadmapSchema = z.array(RoadmapItemSchema);

export type RoadmapPhase = z.infer<typeof RoadmapPhaseSchema>;
export type RoadmapItem = z.infer<typeof RoadmapItemSchema>;
