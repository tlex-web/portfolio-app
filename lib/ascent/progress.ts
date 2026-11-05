/**
 * The ascent mapping (HOME-03, HOME-04; D-01, D-05, D-06, D-09; 09-UI-SPEC
 * "Ascent Mapping" and "Altimeter Rail"). Pure and import-free on purpose: the
 * client controller (components/home/AscentController.tsx), the rail, the pins
 * and the 3D camera (09-08, 09-10) all read the same functions, so they can
 * never disagree. Keep it to erasable TypeScript and never add an import.
 *
 * Progress p in [0, 1] is the page scroll inside the sticky phase divided by
 * the sticky distance. Arrival points are measured: p_k is the progress at
 * which block k's centre meets the stage centre. `arrivals` holds the n
 * waypoint arrivals followed by the summit's (length n + 1).
 *
 * Every boundary is compared with a 1e-9 tolerance (EPS), so floating-point
 * sums such as 0.4 - 0.03 still land on the side the UI-SPEC states.
 */

/** Half-width of the hold around each arrival: a centred card shows its own height. */
export const PLATEAU = 0.03;

const EPS = 1e-9;

/**
 * The measured ascent layout. `start` is the scrollY at which the sticky phase
 * begins (track top minus the stage's sticky top), `distance` the sticky
 * distance (track height minus stage height), `arrivals` the n + 1 arrival
 * points (waypoints, then the summit).
 */
export type AscentLayout = { start: number; distance: number; arrivals: readonly number[] };

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

function assertDistance(fn: string, distance: number): void {
  if (!Number.isFinite(distance) || distance <= 0) {
    throw new RangeError(`${fn}: distance must be positive, got ${distance}`);
  }
}

function assertArrivals(fn: string, arrivals: readonly number[]): void {
  if (arrivals.length < 2) {
    throw new RangeError(
      `${fn}: need at least one waypoint and the summit, got ${arrivals.length} arrivals`
    );
  }
}

/**
 * Arrival point of each block: clamp((offset + height / 2 - stageHeight / 2) /
 * distance, 0, 1), with `offset` measured from the track top. Pass the waypoint
 * blocks and then the summit block.
 */
export function arrivalsFromBlocks(
  blocks: readonly { offset: number; height: number }[],
  stageHeight: number,
  distance: number
): number[] {
  assertDistance('arrivalsFromBlocks', distance);
  return blocks.map(({ offset, height }) =>
    clamp01((offset + height / 2 - stageHeight / 2) / distance)
  );
}

/** Page scroll to progress: clamp((scrollY - start) / distance, 0, 1). */
export function mapProgress(scrollY: number, layout: AscentLayout): number {
  assertDistance('mapProgress', layout.distance);
  return clamp01((scrollY - layout.start) / layout.distance);
}

/**
 * Where p sits on the route: the arrival index `i` and the fraction `t` of the
 * way to arrival i + 1. Inside a plateau (|p - p_i| <= PLATEAU) t is 0. Before
 * the first plateau ends p holds arrival 0 (the tilt-in); from the last plateau
 * on it holds the last. Between plateaus t runs linearly from one plateau edge
 * to the next, so the altitude and the marker are continuous.
 */
function locate(p: number, arrivals: readonly number[]): { i: number; t: number } {
  const last = arrivals.length - 1;
  if (p <= arrivals[0] + PLATEAU + EPS) return { i: 0, t: 0 };
  if (p >= arrivals[last] - PLATEAU - EPS) return { i: last, t: 0 };
  for (let i = 0; i < last; i += 1) {
    const from = arrivals[i] + PLATEAU;
    const to = arrivals[i + 1] - PLATEAU;
    if (p <= from + EPS) return { i, t: 0 };
    if (p < to - EPS) return { i, t: to > from ? (p - from) / (to - from) : 0 };
  }
  return { i: last, t: 0 };
}

/**
 * The rail readout altitude at p (D-01): the first waypoint's height through
 * the tilt-in, each waypoint's exact height inside its plateau, the summit's at
 * the top, linear between plateaus. Unrounded; the readout rounds.
 */
export function altitudeAt(
  p: number,
  arrivals: readonly number[],
  heights: readonly number[]
): number {
  assertArrivals('altitudeAt', arrivals);
  if (heights.length !== arrivals.length) {
    throw new RangeError(
      `altitudeAt: ${arrivals.length} arrivals but ${heights.length} heights; they must match`
    );
  }
  const { i, t } = locate(p, arrivals);
  return t === 0 ? heights[i] : heights[i] + (heights[i + 1] - heights[i]) * t;
}

/**
 * The rail marker position at p as a fraction of the rail (0 bottom, 1 top).
 * Ticks are evenly spaced, a route profile rather than a linear altimeter, so
 * arrival k sits at k / n; between plateaus the marker moves linearly.
 */
export function railFraction(p: number, arrivals: readonly number[]): number {
  assertArrivals('railFraction', arrivals);
  const n = arrivals.length - 1;
  const { i, t } = locate(p, arrivals);
  return (i + t) / n;
}

/** The lit-pin half-window for n waypoints: 1 / (2(n + 1)), 0.1 for four photos. */
export function pinWindow(n: number): number {
  return 1 / (2 * (n + 1));
}

/**
 * The lit pin at p (D-09), k in 1..n, or null. Pin k is lit while |p - p_k| <
 * pinWindow(n); the nearer arrival wins, the lower k on a tie. From the summit
 * view, p >= (p_n + p_summit) / 2 (0.9 for four photos), no pin is lit.
 */
export function activePin(p: number, arrivals: readonly number[]): number | null {
  assertArrivals('activePin', arrivals);
  const n = arrivals.length - 1;
  if (p >= (arrivals[n - 1] + arrivals[n]) / 2 - EPS) return null;
  const window = pinWindow(n);
  let best: number | null = null;
  let bestDistance = Infinity;
  for (let i = 0; i < n; i += 1) {
    const d = Math.abs(p - arrivals[i]);
    if (d < window - EPS && d < bestDistance - EPS) {
      best = i + 1;
      bestDistance = d;
    }
  }
  return best;
}

/** One leg of the route, 1 / (n + 1): the largest jump the spring animates. */
export function snapThreshold(n: number): number {
  return 1 / (n + 1);
}

/**
 * True when moving from `current` to `target` is more than one leg (D-06), so
 * the spring jumps instead of flying through the route. Exactly one leg animates.
 */
export function shouldSnap(current: number, target: number, n: number): boolean {
  return Math.abs(target - current) > snapThreshold(n) + EPS;
}
