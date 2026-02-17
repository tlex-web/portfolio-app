'use client';

/**
 * Geological easing curves and animation constants for the crystalline design system.
 *
 * Easing curves are inspired by geological processes — weighty, deliberate motions
 * that feel like stone shifting into place. All curves are cubic-bezier arrays
 * compatible with Framer Motion's `transition.ease` property.
 */

/** Geological cubic-bezier easing curves for Framer Motion transitions. */
export const EASING = {
  /** Stone shifting into place — slow start, decisive arrival */
  geological: [0.22, 0.61, 0.36, 1.0] as readonly [number, number, number, number],
  /** Builds slowly, snaps into crystal structure */
  crystallize: [0.16, 0.85, 0.45, 1.0] as readonly [number, number, number, number],
  /** Very slow start, powerful tectonic finish */
  tectonic: [0.33, 0.0, 0.2, 1.0] as readonly [number, number, number, number],
  /** Gradual, patient, revealing — like erosion */
  erosion: [0.4, 0.0, 0.2, 1.0] as readonly [number, number, number, number],
} as const;

/** Animation durations in seconds (Framer Motion convention). */
export const DURATION = {
  /** Hover state changes (300-400ms range) */
  hover: 0.35,
  /** Page enter animations */
  enter: 0.45,
  /** Tilt settle back to rest */
  settle: 0.5,
  /** Crystal fracture on click */
  fracture: 0.3,
} as const;

/** Perspective tilt configuration for crystalline card interactions. */
export const TILT_CONFIG = {
  /** Maximum degrees of tilt */
  maxRotation: 12,
  /** CSS perspective value in px */
  perspective: 600,
} as const;
