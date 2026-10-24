/**
 * Project data contract (DATA-07).
 *
 * Projects form a discriminated union on `slug`, one schema per project, and
 * each project's `highlights` is a fixed tuple of typed blocks: the tuple order
 * is the render order. Phase 11's case studies read the blocks directly; until
 * then `lib/legacy-highlights.ts` turns them back into the v1 record that
 * `ProjectHighlights` renders (RESEARCH Pitfall 13).
 *
 * Every object is a `z.strictObject`: zod's default `z.object` silently accepts
 * extra keys (RESEARCH Pitfall 5), which would let a misspelt field or a demo
 * command on the wrong project through.
 *
 * Imports only 'zod' on purpose (RESEARCH Pattern 1), like data/schemas/photo.ts:
 * keep it to erasable TypeScript so Node can type-strip it from scripts.
 */
import { z } from 'zod';

/** CLI_X risk levels, matching the v1 `DemoCommand.riskLevel` union. */
export const RiskLevel = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevel>;

const Scalar = z.union([z.string(), z.number(), z.boolean()]);

/** Named scalar metrics, e.g. Performance or Testing. */
export const MetricsBlock = z.strictObject({
  kind: z.literal('metrics'),
  key: z.string(),
  title: z.string(),
  metrics: z.array(z.strictObject({ key: z.string(), label: z.string(), value: Scalar })).min(1),
});

/** The CLI_X safety scale: rule count, the four risk bands and boolean capabilities. */
export const RiskScaleBlock = z.strictObject({
  kind: z.literal('risk-scale'),
  key: z.string(),
  title: z.string(),
  rules: z.number().int(),
  bands: z.array(z.strictObject({ level: RiskLevel, min: z.number(), max: z.number() })).length(4),
  flags: z.array(z.strictObject({ key: z.string(), label: z.string(), value: z.boolean() })),
});

/** Pricing tiers, in display order. */
export const PricingBlock = z.strictObject({
  kind: z.literal('pricing'),
  key: z.string(),
  title: z.string(),
  tiers: z
    .array(
      z.strictObject({
        key: z.string(),
        price: z.string(),
        commands: z.string(),
        models: z.string(),
        features: z.array(z.string()),
      }),
    )
    .min(1),
});

/** A plain bullet list, e.g. Security. */
export const ListBlock = z.strictObject({
  kind: z.literal('list'),
  key: z.string(),
  title: z.string(),
  items: z.array(z.string()).min(1),
});

/** Grouped technology lists, e.g. frontend / backend / deployment. */
export const StackBlock = z.strictObject({
  kind: z.literal('stack'),
  key: z.string(),
  title: z.string(),
  groups: z.array(z.strictObject({ key: z.string(), items: z.array(z.string()).min(1) })).min(1),
});

export const HighlightBlock = z.discriminatedUnion('kind', [
  MetricsBlock,
  RiskScaleBlock,
  PricingBlock,
  ListBlock,
  StackBlock,
]);
export type HighlightBlock = z.infer<typeof HighlightBlock>;

/**
 * One CLI_X terminal example. `riskLevel` and `riskScore` are required (D-22):
 * every score is the one CLI_X printed for that command, and the level is the
 * band of `lib/trail-grade.ts` the score falls in.
 */
export const DemoCommandSchema = z.strictObject({
  input: z.string(),
  output: z.string(),
  riskLevel: RiskLevel,
  riskScore: z.number().min(0).max(1),
  warning: z.string().optional(),
  explanation: z.string().optional(),
});

/** Fields every project shares (today's v1 `Project` interface minus slug, highlights and demos). */
const ProjectBase = z.strictObject({
  name: z.string(),
  tagline: z.string(),
  shortDescription: z.string(),
  longDescription: z.string(),
  techStack: z.array(z.string()),
  links: z.strictObject({
    github: z.string().optional(),
    demo: z.string().optional(),
    docs: z.string().optional(),
  }),
  status: z.enum(['active', 'beta', 'complete', 'archived']),
  featured: z.boolean(),
  thumbnailImage: z.string().optional(),
  roadmapItems: z.array(z.string()).optional(),
  version: z.string().optional(),
  features: z.array(z.string()).optional(),
});

const ClixCli = ProjectBase.extend({
  slug: z.literal('clix-cli'),
  highlights: z.tuple([MetricsBlock, MetricsBlock, RiskScaleBlock, MetricsBlock]),
  demoCommands: z.array(DemoCommandSchema).min(1),
});

const ClixWebsite = ProjectBase.extend({
  slug: z.literal('clix-website'),
  highlights: z.tuple([PricingBlock, ListBlock, StackBlock]),
  // The website has no terminal demo. `never` keeps the key off the data (a
  // demoCommands array fails to parse) while `project.demoCommands` still
  // type-checks on the union for the shared ProjectDetailClient.
  demoCommands: z.never().optional(),
});

export const ProjectSchema = z.discriminatedUnion('slug', [ClixCli, ClixWebsite]);
export type ProjectSchema = z.infer<typeof ProjectSchema>;
