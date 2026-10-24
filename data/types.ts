// Data types for the portfolio application

import type { z } from 'zod';
import type { DemoCommandSchema, ProjectSchema } from './schemas/project';

/** Primitive value types that can appear in project highlights. */
type HighlightPrimitive = string | number | boolean;

/** Recursive type for nested highlight data structures. */
export type HighlightValue = HighlightPrimitive | HighlightValue[] | { [key: string]: HighlightValue };

export interface LandscapeImage {
  id: string; // Unique identifier
  /** Editorial slug, set by data/landscapes.ts; /photos#{slug} target until Phase 10 ships /photos/[slug]. */
  slug?: string;
  src: string; // Path to image file
  thumbnail?: string; // Optional optimized thumbnail
  fallbackSrc?: string; // JPEG fallback for WebP
  thumbnailSrc?: string; // Thumbnail for blur placeholder
  alt: string; // Accessibility description
  title: string; // Display title
  location: string; // Where the photo was taken
  story: string; // Narrative description
  technicalDetails: {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    captureDate?: string; // ISO 8601 format (YYYY-MM-DD)
    /** Preformatted by lib/photo-format (no locale APIs; year-only captures stay year-only). */
    captureLabel?: string;
  };
  tags: string[]; // e.g., ['mountains', 'sunrise', 'long-exposure']
  annotations?: ImageAnnotation[]; // Optional interactive hotspots
}

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

export interface ImageAnnotation {
  id: string; // Unique identifier
  title: string; // Feature name
  description: string; // Detailed information
  position: { x: number; y: number }; // Percentage-based positioning (0-100)
  icon: 'mountain' | 'water' | 'glacier' | 'trail' | 'lake' | 'peak'; // Icon type
  details?: {
    elevation?: string; // e.g., "4,478m"
    temperature?: string; // e.g., "2-4°C"
    distance?: string; // e.g., "5.2 km"
    facts?: string[]; // Additional interesting facts
  };
}

