/**
 * Photo tags and display formatting (D-08, DATA-03).
 *
 * Pure and import-free on purpose (RESEARCH Pattern 1): Node 24 type-strips it
 * when scripts/photos/build-photo-data.mjs derives the tags, and Jest/tsc test
 * it normally. Keep it to erasable TypeScript and never add an import. The
 * capture shape is declared structurally here instead of imported from
 * data/schemas/photo.ts.
 */

/** A capture as stored in data/generated/photos.ts (see `Capture` in data/schemas/photo.ts). */
export type CaptureLike =
  | { precision: 'second'; local: string }
  | { precision: 'year'; year: number };

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

/**
 * Meteorological season of a month (1-12): December-February winter,
 * March-May spring, June-August summer, September-November autumn. Chosen over
 * astronomical seasons so a month alone decides the tag (D-08).
 *
 * @throws RangeError when `month` is not an integer from 1 to 12.
 */
export function seasonOf(month: number): Season {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`seasonOf: month must be 1-12, got ${month}`);
  }
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

/** The four-digit year tag of a capture, derived and never hand-typed (D-08). */
export function yearTag(capture: CaptureLike): string {
  return capture.precision === 'year' ? String(capture.year) : capture.local.slice(0, 4);
}
