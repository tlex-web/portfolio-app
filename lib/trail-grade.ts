/**
 * SAC hiking-scale trail grades and the waymark painted on each (D-06, D-24).
 *
 * A grade means only "the trail grade" here: the real SAC grade of the trail
 * a project's profile glyph draws. T1 trails carry a yellow waymark, T2 and
 * T3 white-red-white, T4 and T5 white-blue-white, and T6 routes are unmarked.
 * MARKER_NAMES gives each waymark the name the badge's accessible text reads.
 *
 * The paint itself is drawn by TrailGradeMark (11-12), never here.
 *
 * Zero imports on purpose: a leaf module both the data tests and client
 * components can use without pulling in zod.
 */
export type TrailMarker = 'yellow' | 'white-red-white' | 'white-blue-white' | 'unmarked';

export const TRAIL_GRADES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'] as const;

export type TrailGrade = (typeof TRAIL_GRADES)[number];

const MARKER_BY_GRADE: Readonly<Record<TrailGrade, TrailMarker>> = {
  T1: 'yellow',
  T2: 'white-red-white',
  T3: 'white-red-white',
  T4: 'white-blue-white',
  T5: 'white-blue-white',
  T6: 'unmarked',
};

/** The waymark for a grade. Throws a RangeError for anything but T1 to T6. */
export function markerForGrade(grade: string): TrailMarker {
  if (!(TRAIL_GRADES as readonly string[]).includes(grade)) {
    throw new RangeError(`"${grade}" is not a trail grade (T1 to T6)`);
  }
  return MARKER_BY_GRADE[grade as TrailGrade];
}

/** The accessible name of each waymark ("T4, white-blue-white waymark"). */
export const MARKER_NAMES: Readonly<Record<TrailMarker, string>> = {
  yellow: 'yellow waymark',
  'white-red-white': 'white-red-white waymark',
  'white-blue-white': 'white-blue-white waymark',
  unmarked: 'unmarked',
};
