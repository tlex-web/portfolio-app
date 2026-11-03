/**
 * Project data contract (DATA-07; Phase 11 D-22, D-24).
 *
 * Projects form a discriminated union on `slug`: box and coin-flip. Each
 * case-study slot is one optional block, and the slot order lives in code
 * (`components/projects/CaseStudy.tsx`), never in data. Unapproved content is
 * simply absent (D-21): there is no "approved" flag that could let a draft
 * through, and a section without data does not render (ENG-02).
 *
 * Every object is a `z.strictObject`: zod's default `z.object` silently accepts
 * extra keys (RESEARCH Pitfall 5), which would let a misspelt field, a retired
 * field or a block on the wrong project through.
 *
 * Imports only 'zod' on purpose (RESEARCH Pattern 1), like data/schemas/photo.ts:
 * keep it to erasable TypeScript so Node can type-strip it from scripts.
 */
import { z } from 'zod';

/**
 * One box terminal command (D-26): the line as typed after the prompt and the
 * output it printed, both captured verbatim (08 D-22), plus an optional
 * one-line note Tim approved. There is no risk field (D-24).
 */
export const DemoCommandSchema = z.strictObject({
  input: z.string(),
  output: z.string(),
  note: z.string().optional(),
});

/**
 * One metric tile (D-28, ENG-04). The context line is required: a figure
 * without it does not ship. `sourceUrl` points at the public evidence, over
 * https only, like the site's other external links (11 IN-03).
 */
const MetricTile = z.strictObject({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  context: z.string().min(1),
  sourceUrl: z.url({ protocol: /^https$/ }).optional(),
});

/** The marked trail each project's route profile follows (D-07). */
const TrailId = z.enum(['hoernliweg-27', 'zmutt-2']);

/** Slot blocks both projects share; every block is optional. */
const ProjectBase = z.strictObject({
  name: z.string(),
  /** The panel pitch, also the case study's meta description. */
  pitch: z.string().optional(),
  /** The trailhead outcome line (D-16). */
  outcome: z.string().optional(),
  /** `{version} · {status}`; a missing status drops with its separator (D-29). */
  kicker: z.strictObject({ version: z.string(), status: z.string().optional() }),
  route: TrailId.optional(),
  /** Problem paragraphs, first person (D-16). */
  problem: z.array(z.string()).optional(),
  pipeline: z
    .strictObject({
      intro: z.string().optional(),
      in: z.string().optional(),
      out: z.string().optional(),
      stages: z
        .array(z.strictObject({ name: z.string(), description: z.string().optional() }))
        .min(1),
    })
    .optional(),
  metrics: z
    .strictObject({
      releaseLine: z.string().optional(),
      tiles: z.array(MetricTile).min(1),
    })
    .optional(),
  stack: z
    .strictObject({
      groups: z
        .array(z.strictObject({ label: z.string(), items: z.array(z.string()).min(1) }))
        .min(1),
    })
    .optional(),
  /** Route-log row ids, planned or in progress only (N4, D-32). */
  nextSteps: z.array(z.string()).optional(),
});

const Box = ProjectBase.extend({
  slug: z.literal('box'),
  /** The only verified link (D-12). */
  links: z.strictObject({ github: z.literal('https://github.com/tlex-web/box') }),
  /**
   * The third slot on box (D-25): the preview gate in a few sentences, one real
   * preview run (`command` is the subcommand, `input` the typed line, `output`
   * what it printed, all verbatim) and the line saying what `--force` would do.
   */
  safety: z
    .strictObject({
      intro: z.string().optional(),
      capture: z
        .strictObject({ command: z.string(), input: z.string(), output: z.string() })
        .optional(),
      forceLine: z.string().optional(),
    })
    .optional(),
  /** The terminal demo (D-26): commands in Tim's order. */
  demo: z
    .strictObject({
      intro: z.string().optional(),
      commands: z.array(DemoCommandSchema).min(1),
    })
    .optional(),
});

const CoinFlip = ProjectBase.extend({
  slug: z.literal('coin-flip'),
  /** D-12: the repository is private, so there is no link field at all. */
  repository: z.literal('private'),
  /** The third slot on coin-flip (D-25). */
  privacy: z
    .strictObject({ intro: z.string().optional(), facts: z.array(z.string()).min(1) })
    .optional(),
  /** D-27: the clip renders only with its text description. */
  clip: z
    .strictObject({
      id: z.literal('coin-flip-toss'),
      intro: z.string().optional(),
      description: z.string(),
    })
    .optional(),
});

export const ProjectSchema = z.discriminatedUnion('slug', [Box, CoinFlip]);
export type ProjectSchema = z.infer<typeof ProjectSchema>;
