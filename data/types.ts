// Data types for the portfolio application

import type { z } from 'zod';
import type { DemoCommandSchema, ProjectSchema } from './schemas/project';

/** Primitive value types that can appear in project highlights. */
type HighlightPrimitive = string | number | boolean;

/** Recursive type for nested highlight data structures. */
export type HighlightValue = HighlightPrimitive | HighlightValue[] | { [key: string]: HighlightValue };

/**
 * A portfolio project, inferred from the zod contract (DATA-07): a discriminated
 * union on `slug` whose `highlights` are typed block tuples. Type-only imports
 * keep zod out of client bundles.
 */
export type Project = z.infer<typeof ProjectSchema>;

/** One CLI_X terminal example (natural-language input -> generated command). */
export type DemoCommand = z.infer<typeof DemoCommandSchema>;

export interface RoadmapItem {
  id: string; // Unique identifier
  title: string; // Short title
  description: string; // Detailed explanation
  area: 'portfolio' | 'cli' | 'webshop' | 'other'; // Categorization
  status: 'planned' | 'in-progress' | 'completed';
  targetRelease?: string; // e.g., 'Q2 2025', 'v2.0'
  priority?: 'low' | 'medium' | 'high';
}

/** One primary navigation destination (SHELL-01). */
export interface NavItem {
  label: string;
  href: string;
}

/**
 * Site identity, links and nav (SHELL-03). `email` and `links.linkedin` are
 * required strings, so removing either fails `tsc` instead of rendering an
 * empty link.
 */
export interface Site {
  name: string;
  role: string;
  email: string;
  links: {
    github: string;
    linkedin: string;
  };
  nav: readonly NavItem[];
  /** Required: the swissALTIRegio source reference (D-15); removing it fails tsc. */
  attribution: { terrain: string };
}

