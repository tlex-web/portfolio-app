// Data types for the portfolio application

import type { z } from 'zod';
import type { DemoCommandSchema, ProjectSchema } from './schemas/project';

/**
 * A portfolio project, inferred from the zod contract (DATA-07): a discriminated
 * union on `slug`, box | coin-flip, each with its own case-study fields.
 * Type-only imports keep zod out of client bundles.
 */
export type Project = z.infer<typeof ProjectSchema>;

/**
 * One box terminal example: the command line as typed and its captured output,
 * with an optional approved note (D-26).
 */
export type DemoCommand = z.infer<typeof DemoCommandSchema>;

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
  /**
   * Required: the canonical base URL (D-13), https with no trailing slash.
   * metadataBase, every page canonical, sitemap.xml and robots.txt build their
   * absolute URLs from it, so removing it fails tsc.
   */
  url: string;
  email: string;
  links: {
    github: string;
    linkedin: string;
  };
  nav: readonly NavItem[];
  /** Required: the swissALTIRegio source reference (D-15); removing it fails tsc. */
  attribution: { terrain: string };
}

