/**
 * The Alps overview label layout (REGION-01; 18-UI-SPEC Contract 1 "Sheet",
 * "Label layout", "Compact tier"; 18-RESEARCH Pattern 2, Pattern 3, A6).
 * Pure: it takes plain inputs (uv, ids, labels) and imports no generated data;
 * 18-23's overviewSheetInput() builds the input on the server.
 *
 * The sheet is S px wide and S x 872 / 1200 px tall (sheet px: origin at the
 * top-left, x right, y down). On it sit, per region, its sheet-index rectangle
 * (the bounding box of its outline corners), a 28 px numbered marker (24 px
 * circle plus its 2 px casing) joined to the rectangle by a leader and, on the
 * wide tier (S >= 560), a 144 x 48 label plate beside the marker; per reference
 * summit, a 12 px triangle with its base centre on the summit's uv and, on the
 * wide tier, a label plate (summitPlateSize). The UI-SPEC's single rule
 * (marker above the rectangle, plate right of it) collides at both tiers with
 * the real data (18-RESEARCH Pattern 2), so each box comes from a candidate
 * search:
 *
 * - a marker: 8 directions around its rectangle (N first) at the leader steps
 *   8, 16, 24 and 40 px, shortest first; its leader runs from the marker centre
 *   to the rectangle's edge point in that direction (top-centre for N);
 * - a region plate, chosen with its marker (a marker place is taken only with
 *   a legal plate): right of the marker, then left, vertically centred, 8 px
 *   away (the UI-SPEC rule; Tim, 2026-11-26). Only at a width where no layout
 *   has every plate beside its marker may the fewest plates possible take a
 *   fallback place (the diagonals, then above and below), pinned in
 *   DIAGONAL_REGION_PLATES;
 * - a summit label: right, left, below, above, then the diagonals of its
 *   triangle at 8 px.
 *
 * A candidate is legal when its box stays 8 px inside the sheet, keeps 8 px
 * (inclusive) from every other box and every triangle box, covers no
 * rectangle's drawn outline, crosses no leader and, for a marker, its leader
 * crosses no box (a triangle as the shape it draws: at small widths
 * Dufourspitze's triangle box overlaps the Zermatt rectangle), its own plate
 * included. A plate also keeps the association invariant: every other marker
 * is at least OVERVIEW_ASSOCIATION px farther from it than its own marker. On
 * the compact tier a marker prefers a place whose badge keeps
 * COMPACT_SUMMIT_CLEARANCE px from every triangle as drawn.
 *
 * The search runs in a fixed priority (regions west to east, then summit
 * labels west to east) and is complete: it finds the first legal layout in
 * that order (conflict-directed backjumping), so markers and summit labels
 * give way before a plate leaves its marker's side, and a summit label is
 * left without a legal place only when no layout has one. Then (or if the
 * search budget runs out) a greedy pass with one level of backtracking places
 * what it can; a summit label it cannot place keeps its least-conflicting
 * candidate and is reported as not placed; its widths are pinned in
 * UNPLACED_SUMMIT_LABELS for Tim (18-13 Task 2), and no label is ever dropped.
 *
 * Every coordinate is exactly f x S + px (x) or f x H + px (y) for a fixed set
 * of choices, so the integer widths with the same choices form one segment and
 * overviewCss writes each segment as container-query rules with
 * calc(<u> * 100cqw ± <px>px) and calc(<v> * 100cqh ± <px>px) lengths: the
 * server HTML is exact at every width with no client relayout. The sheet must
 * be a size container (`container-type: size`) so cqh is its height.
 * lib/__tests__/overview-layout.test.ts sweeps every integer S from 312 to 1100.
 *
 * The emitted CSS addresses these hooks (18-23 renders them):
 * - `[data-region-marker=id]` (the marker link box, 28 x 28 at the marker), with
 *   `[data-region-dot]` (the number circle), `[data-region-leader]` (a box from
 *   the marker centre to the rectangle edge: unflipped it is drawn top-left to
 *   bottom-right, flipped with scale(-1, 1)) and `[data-region-plate]`, both
 *   positioned relative to the marker;
 * - `[data-region-rect=id]` (the outline polygon), `[data-summit-mark=key]` and
 *   `[data-summit-plate=key]` (key = summitKey(name)), positioned in the sheet;
 * - `[data-overview]` (the element holding both the sheet and the region list)
 *   with `[data-region-row=id]` and its `[data-region-badge]`, for the list-map
 *   sync (Pattern 3).
 */
import { cssEscape } from './css-escape';

/** The marker box: the 24 px number circle plus its 2 px casing on each side. */
export const MARKER = 28;
/** The region label plate: w-36, two 20 px lines plus py-1. */
export const REGION_PLATE = { w: 144, h: 48 } as const;
/** The summit triangle's side (the Home summit mark, size-3, base centre on the anchor). */
export const SUMMIT_TRIANGLE = 12;
/** The least distance between two boxes; exactly 8 px apart is allowed. */
export const OVERVIEW_GAP = 8;
/** Every box stays this far inside the sheet. */
export const OVERVIEW_INSET = 8;
/** The compact tier ends here (S < 560 px: markers and rectangles only). */
export const OVERVIEW_COMPACT_MAX_S = 559;
/** The measured sweep; the first and last segments extend past it unchanged. */
export const OVERVIEW_SWEEP_MIN_S = 312;
export const OVERVIEW_SWEEP_MAX_S = 1100;
/** The overview grid's height over its width (1200 x 872). */
export const OVERVIEW_RATIO = 872 / 1200;
/** The marker leader lengths the search tries, shortest first. */
export const LEADER_STEPS = [8, 16, 24, 40] as const;
/**
 * A region plate sits right or left of its own marker (8 px), and every other
 * marker is at least this much farther from it, as a box distance (Tim,
 * 2026-11-26: at 1440 Zermatt's diagonal plate read as Ortler's).
 */
export const OVERVIEW_ASSOCIATION = 16;
/** On the compact tier a marker's badge prefers this clearance from every summit triangle, as drawn. */
export const COMPACT_SUMMIT_CLEARANCE = 16;

/**
 * Region plates that cannot sit right or left of their marker, as inclusive S
 * ranges: no legal layout with every summit label placed has them there. Below
 * S = 720 Zermatt's plate, right of marker 1, reaches Ortler's rectangle
 * (left of it leaves the sheet); above it needs a leader over 40 px and below
 * it takes the only free place of Mont Blanc's label. Below S = 588 Ortler's
 * plate has no side either. At these widths the plate takes a fallback place
 * that still keeps the association invariant (listed for Tim, 2026-11-26).
 */
export const DIAGONAL_REGION_PLATES: readonly {
  region: string;
  ranges: readonly [number, number][];
}[] = [
  { region: 'zermatt', ranges: [[560, 719]] },
  { region: 'ortler', ranges: [[560, 587]] },
];

/**
 * Summit labels with no legal place after backtracking, as inclusive S ranges.
 * Empty: the sweep places every summit label at every width from 312 to 1100.
 */
export const UNPLACED_SUMMIT_LABELS: readonly {
  summit: string;
  ranges: readonly [number, number][];
}[] = [];

/** The longest short region name a plate holds (about 75 px at Inter 14/600 in its 128 px text box). */
const REGION_NAME_MAX = 10;
/** The longest count label (15 x 8.4 = 126 px of mono in the 128 px text box). */
const REGION_COUNT_MAX = 15;
/** Declared text widths: Inter 14 about 7.7 px a character, JetBrains Mono 14 exactly 8.4. */
const INTER_14_CHAR = 7.7;
const MONO_14_CHAR = 8.4;
/** A plate's px-2 and two 20 px lines plus py-1. */
const PLATE_PAD_X = 8;
const PLATE_H = 48;
/** Float tolerance for the gap and inset rules, far below a pixel. */
const EPS = 1e-6;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type OverviewUv = { u: number; v: number };

/** One region, west to east (regionsWestToEast), numbered 1..N in that order. */
export type OverviewRegionMark = {
  id: string;
  number: number;
  /** The short region name on the plate's first line (at most 10 characters). */
  name: string;
  /** The plate's second line, '7 photographs' (at most 15 characters). */
  count: string;
  /** The overview outline's corners in grid uv. */
  corners: readonly OverviewUv[];
};

/** One reference summit: its name, uv and printed height ('4,806 m'). */
export type OverviewSummitMark = { name: string; u: number; v: number; height: string };

export type OverviewInput = {
  regions: readonly OverviewRegionMark[];
  summits: readonly OverviewSummitMark[];
};

/** A box in sheet px. */
export type OverviewBox = { x: number; y: number; width: number; height: number };

/** A leader from the marker centre (x1, y1) to its rectangle's edge (x2, y2). */
export type OverviewLeader = { x1: number; y1: number; x2: number; y2: number };

export type OverviewTier = 'compact' | 'wide';

/** The layout at one sheet width S (sheet height H = S x OVERVIEW_RATIO). */
export type OverviewPlacement = {
  S: number;
  H: number;
  tier: OverviewTier;
  regions: {
    id: string;
    number: number;
    /** The outline's bounding box. */
    rect: OverviewBox;
    marker: OverviewBox;
    leader: OverviewLeader;
    /** Null on the compact tier. */
    plate: OverviewBox | null;
    /** The marker's candidate, direction and leader step: 'N8', 'SE24'. */
    markerChoice: string;
    /** The plate's side, 'E' or 'W', or null on the compact tier. */
    plateChoice: string | null;
    /** False when no candidate was legal (never, for the real data: the sweep pins it). */
    placed: boolean;
  }[];
  summits: {
    name: string;
    key: string;
    triangle: OverviewBox;
    /** Null on the compact tier. */
    plate: OverviewBox | null;
    /** The label's direction, or null on the compact tier. */
    choice: string | null;
    /** False when no candidate was legal (the label keeps its least-conflicting one). */
    placed: boolean;
  }[];
};

/** A length linear in the sheet: f x S + px on the x axis, f x H + px on the y axis. */
export type OverviewLength = { axis: 'x' | 'y'; f: number; px: number };

/** A box whose coordinates and sizes are OverviewLengths. */
export type OverviewLinearBox = {
  x: OverviewLength;
  y: OverviewLength;
  width: OverviewLength;
  height: OverviewLength;
};

export type OverviewLinearLeader = {
  x1: OverviewLength;
  y1: OverviewLength;
  x2: OverviewLength;
  y2: OverviewLength;
};

/** A segment's layout, every coordinate linear and every choice fixed. */
export type OverviewSegmentPlacements = {
  tier: OverviewTier;
  regions: {
    id: string;
    rect: OverviewLinearBox;
    marker: OverviewLinearBox;
    leader: OverviewLinearLeader;
    plate: OverviewLinearBox | null;
  }[];
  summits: {
    name: string;
    key: string;
    triangle: OverviewLinearBox;
    plate: OverviewLinearBox | null;
  }[];
};

/** Consecutive integer widths with the same choices; null ends are open. */
export type OverviewSegment = {
  minS: number | null;
  maxS: number | null;
  placements: OverviewSegmentPlacements;
};

// ---------------------------------------------------------------- lengths

const X = (f: number, px = 0): OverviewLength => ({ axis: 'x', f, px });
const Y = (f: number, px = 0): OverviewLength => ({ axis: 'y', f, px });
const plus = (l: OverviewLength, px: number): OverviewLength => ({ ...l, px: l.px + px });
const constBox = (
  x: OverviewLength,
  y: OverviewLength,
  w: number,
  h: number
): OverviewLinearBox => ({ x, y, width: X(0, w), height: Y(0, h) });

function evalLength(l: OverviewLength, S: number): number {
  return l.f * (l.axis === 'x' ? S : S * OVERVIEW_RATIO) + l.px;
}

function evalBox(b: OverviewLinearBox, S: number): OverviewBox {
  return {
    x: evalLength(b.x, S),
    y: evalLength(b.y, S),
    width: evalLength(b.width, S),
    height: evalLength(b.height, S),
  };
}

function evalLeader(l: OverviewLinearLeader, S: number): OverviewLeader {
  return {
    x1: evalLength(l.x1, S),
    y1: evalLength(l.y1, S),
    x2: evalLength(l.x2, S),
    y2: evalLength(l.y2, S),
  };
}

// ---------------------------------------------------------------- boxes

/**
 * Whether two boxes come closer than `gap` on both axes (a float tolerance far
 * below a pixel keeps the rule inclusive: exactly `gap` apart does not meet).
 */
export function boxesMeet(a: OverviewBox, b: OverviewBox, gap: number): boolean {
  return (
    a.x < b.x + b.width + gap - EPS &&
    b.x < a.x + a.width + gap - EPS &&
    a.y < b.y + b.height + gap - EPS &&
    b.y < a.y + a.height + gap - EPS
  );
}

type Pt = { x: number; y: number };

/**
 * Whether a segment passes through a convex polygon's interior (Cyrus-Beck
 * clip, the polygon shrunk by 0.01 px). Leaders are checked against the
 * triangle a summit mark draws (apex top-centre, base at the bottom), not its
 * box: at small widths Dufourspitze's triangle box overlaps the Zermatt
 * rectangle, so every leader end on that rectangle lies inside the box but
 * outside the drawn triangle.
 */
function crossesConvex(s: OverviewLeader, pts: readonly Pt[]): boolean {
  const e = 0.01;
  const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
  const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    let nx = a.y - b.y;
    let ny = b.x - a.x;
    const norm = Math.hypot(nx, ny);
    if (norm === 0) continue;
    nx /= norm;
    ny /= norm;
    if (nx * (cx - a.x) + ny * (cy - a.y) < 0) {
      nx = -nx;
      ny = -ny;
    }
    const num = nx * (s.x1 - a.x) + ny * (s.y1 - a.y) - e;
    const den = nx * dx + ny * dy;
    if (den === 0) {
      if (num < 0) return false;
      continue;
    }
    const t = -num / den;
    if (den > 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 >= t1) return false;
  }
  return t0 < t1;
}

/** The triangle a summit mark draws inside its box. */
function trianglePoints(b: OverviewBox): Pt[] {
  return [
    { x: b.x + b.width / 2, y: b.y },
    { x: b.x + b.width, y: b.y + b.height },
    { x: b.x, y: b.y + b.height },
  ];
}

/**
 * Whether a box and a convex polygon overlap (separating axis test, touching
 * allowed). A label may not cover a sheet-index rectangle: the outline as
 * drawn (four slightly rotated corners), not its bounding box.
 */
function overlapsConvex(box: OverviewBox, pts: readonly Pt[]): boolean {
  const corners: Pt[] = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ];
  const axes: Pt[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const norm = Math.hypot(b.x - a.x, b.y - a.y);
    if (norm > 0) axes.push({ x: (a.y - b.y) / norm, y: (b.x - a.x) / norm });
  }
  for (const axis of axes) {
    const project = (ps: readonly Pt[]) => ps.map((p) => p.x * axis.x + p.y * axis.y);
    const pa = project(corners);
    const pb = project(pts);
    if (Math.max(...pa) <= Math.min(...pb) + EPS || Math.max(...pb) <= Math.min(...pa) + EPS) {
      return false;
    }
  }
  return true;
}

/** The Euclidean distance between two boxes (0 when they meet). */
function boxDistance(a: OverviewBox, b: OverviewBox): number {
  const dx = Math.max(0, b.x - (a.x + a.width), a.x - (b.x + b.width));
  const dy = Math.max(0, b.y - (a.y + a.height), a.y - (b.y + b.height));
  return Math.hypot(dx, dy);
}

/** The distance from a point to a convex polygon (0 inside it). */
function pointToConvexDistance(p: Pt, pts: readonly Pt[]): number {
  let inside = true;
  let best = Infinity;
  const cx = pts.reduce((sum, q) => sum + q.x, 0) / pts.length;
  const cy = pts.reduce((sum, q) => sum + q.y, 0) / pts.length;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const side = (px: number, py: number) => ex * (py - a.y) - ey * (px - a.x);
    if (Math.sign(side(p.x, p.y)) !== Math.sign(side(cx, cy))) inside = false;
    const len2 = ex * ex + ey * ey;
    const t =
      len2 === 0 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * ex + (p.y - a.y) * ey) / len2));
    best = Math.min(best, Math.hypot(p.x - (a.x + t * ex), p.y - (a.y + t * ey)));
  }
  return inside ? 0 : best;
}

/** Whether a segment passes through a box's interior (Liang-Barsky clip, 0.01 px tolerance). */
function crosses(s: OverviewLeader, r: OverviewBox): boolean {
  const e = 0.01;
  const box = { x0: r.x + e, y0: r.y + e, x1: r.x + r.width - e, y1: r.y + r.height - e };
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  let t0 = 0;
  let t1 = 1;
  const clip = (p: number, q: number) => {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
    return true;
  };
  return (
    clip(-dx, s.x1 - box.x0) &&
    clip(dx, box.x1 - s.x1) &&
    clip(-dy, s.y1 - box.y0) &&
    clip(dy, box.y1 - s.y1) &&
    t0 < t1
  );
}

/**
 * The summit label's fixed box from the declared character widths (Inter 14
 * name over JetBrains Mono 14 height) plus px-2 py-1, rounded up, so no text is
 * measured; the e2e in 18-23 checks the rendered plate against it.
 */
export function summitPlateSize(name: string, height: string): { w: number; h: number } {
  const text = Math.max(name.length * INTER_14_CHAR, height.length * MONO_14_CHAR);
  return { w: Math.ceil(text + 2 * PLATE_PAD_X - 1e-9), h: PLATE_H };
}

/** A summit's selector key: its name, accents stripped, lowercased, hyphenated ('mont-blanc'). */
export function summitKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------- input

function meanU(corners: readonly OverviewUv[]): number {
  return corners.reduce((sum, c) => sum + c.u, 0) / corners.length;
}

const inUnit = (n: number) => Number.isFinite(n) && n >= 0 && n <= 1;

/**
 * @throws RangeError for an unsafe id or summit key, numbers that are not 1..N
 *   in input order, regions out of west-to-east order (mean outline u, ties by
 *   id), an outline under three corners, a uv outside 0-1, a name over 10 or a
 *   count over 15 characters (the plate's text box was measured for those).
 */
function checkInput(input: OverviewInput): void {
  input.regions.forEach((r, i) => {
    if (!SLUG.test(r.id)) {
      throw new RangeError(`overview-layout: unsafe region id ${JSON.stringify(r.id)}`);
    }
    if (r.number !== i + 1) {
      throw new RangeError(
        `overview-layout: region ${r.id} is number ${r.number} at position ${i + 1}; ` +
          'markers are numbered 1..N west to east'
      );
    }
    if (r.corners.length < 3 || !r.corners.every((c) => inUnit(c.u) && inUnit(c.v))) {
      throw new RangeError(`overview-layout: region ${r.id} needs an outline of uv corners`);
    }
    if (r.name.length > REGION_NAME_MAX || r.count.length > REGION_COUNT_MAX) {
      throw new RangeError(
        `overview-layout: region ${r.id}'s plate text (${JSON.stringify(r.name)}, ` +
          `${JSON.stringify(r.count)}) is longer than the 144 px plate was measured for`
      );
    }
    if (i > 0) {
      const prev = input.regions[i - 1];
      const a = meanU(prev.corners);
      const b = meanU(r.corners);
      if (a > b || (a === b && prev.id > r.id)) {
        throw new RangeError(
          `overview-layout: regions must run west to east (${prev.id}, ${r.id})`
        );
      }
    }
  });
  const keys = new Set<string>();
  for (const s of input.summits) {
    const key = summitKey(s.name);
    if (!SLUG.test(key) || keys.has(key)) {
      throw new RangeError(`overview-layout: summit ${JSON.stringify(s.name)} has no unique key`);
    }
    if (!inUnit(s.u) || !inUnit(s.v)) {
      throw new RangeError(`overview-layout: summit ${s.name} has a uv outside the sheet`);
    }
    keys.add(key);
  }
}

// ---------------------------------------------------------------- candidates

type Dir = { name: string; dx: -1 | 0 | 1; dy: -1 | 0 | 1 };

const D = {
  N: { name: 'N', dx: 0, dy: -1 },
  NE: { name: 'NE', dx: 1, dy: -1 },
  E: { name: 'E', dx: 1, dy: 0 },
  SE: { name: 'SE', dx: 1, dy: 1 },
  S: { name: 'S', dx: 0, dy: 1 },
  SW: { name: 'SW', dx: -1, dy: 1 },
  W: { name: 'W', dx: -1, dy: 0 },
  NW: { name: 'NW', dx: -1, dy: -1 },
} as const satisfies Record<string, Dir>;

/** Marker directions around its rectangle: above first (the UI-SPEC rule). */
const MARKER_DIRS: readonly Dir[] = [D.N, D.NE, D.NW, D.E, D.W, D.S, D.SE, D.SW];
/**
 * Region plate directions around its marker: right, then flipped left (the
 * UI-SPEC rule; the first PLATE_SIDES), then the fallback places, tried only
 * at a width where no layout has every plate beside its marker
 * (DIAGONAL_REGION_PLATES). A plate above or diagonal to its marker read as
 * its neighbour's label at 1440 (Tim, 2026-11-26).
 */
const PLATE_DIRS: readonly Dir[] = [D.E, D.W, D.NE, D.SE, D.NW, D.SW, D.N, D.S];
const PLATE_SIDES = 2;
/** Summit label directions: right, the other side, below, above (the UI-SPEC rule), diagonals. */
const SUMMIT_DIRS: readonly Dir[] = [D.E, D.W, D.S, D.N, D.NE, D.SE, D.NW, D.SW];

const MARKER_CANDIDATES = LEADER_STEPS.flatMap((step) =>
  MARKER_DIRS.map((dir) => ({ dir, step, name: `${dir.name}${step}` }))
);

/**
 * A region's joint candidates on the wide tier, a marker candidate and its
 * plate's direction: every marker with its plate right then left first (in
 * the marker's order), then every marker with a fallback place. Only the
 * first REGION_SIDE_CANDIDATES are tried unless the fallback pass runs.
 */
const REGION_CANDIDATES = [
  ...MARKER_CANDIDATES.flatMap((_, m) =>
    PLATE_DIRS.slice(0, PLATE_SIDES).map((__, p) => ({ m, p }))
  ),
  ...MARKER_CANDIDATES.flatMap((_, m) =>
    PLATE_DIRS.slice(PLATE_SIDES).map((__, p) => ({ m, p: p + PLATE_SIDES }))
  ),
];
const REGION_SIDE_CANDIDATES = MARKER_CANDIDATES.length * PLATE_SIDES;

/** A box of size w x h placed in `dir` around `around`, `gap` px away. */
function beside(
  around: OverviewLinearBox,
  dir: Dir,
  gap: number,
  w: number,
  h: number
): OverviewLinearBox {
  const aw = around.width.px;
  const ah = around.height.px;
  const x =
    dir.dx === 0
      ? plus(around.x, aw / 2 - w / 2)
      : dir.dx === 1
        ? plus(around.x, aw + gap)
        : plus(around.x, -gap - w);
  const y =
    dir.dy === 0
      ? plus(around.y, ah / 2 - h / 2)
      : dir.dy === 1
        ? plus(around.y, ah + gap)
        : plus(around.y, -gap - h);
  return constBox(x, y, w, h);
}

/** The sheet's fixed geometry for an input. */
type Geometry = {
  rects: { minU: number; maxU: number; minV: number; maxV: number; box: OverviewLinearBox }[];
  triangles: OverviewLinearBox[];
  summitSizes: { w: number; h: number }[];
  /** Summit indices west to east (by u, ties by input order). */
  summitOrder: number[];
};

function geometryOf(input: OverviewInput): Geometry {
  return {
    rects: input.regions.map((r) => {
      const us = r.corners.map((c) => c.u);
      const vs = r.corners.map((c) => c.v);
      const minU = Math.min(...us);
      const maxU = Math.max(...us);
      const minV = Math.min(...vs);
      const maxV = Math.max(...vs);
      return {
        minU,
        maxU,
        minV,
        maxV,
        box: { x: X(minU), y: Y(minV), width: X(maxU - minU), height: Y(maxV - minV) },
      };
    }),
    triangles: input.summits.map((s) =>
      constBox(
        X(s.u, -SUMMIT_TRIANGLE / 2),
        Y(s.v, -SUMMIT_TRIANGLE),
        SUMMIT_TRIANGLE,
        SUMMIT_TRIANGLE
      )
    ),
    summitSizes: input.summits.map((s) => summitPlateSize(s.name, s.height)),
    summitOrder: input.summits
      .map((s, i) => ({ u: s.u, i }))
      .sort((a, b) => a.u - b.u || a.i - b.i)
      .map(({ i }) => i),
  };
}

/** A marker candidate: its box and its leader to the rectangle's edge point. */
function markerAt(
  rect: Geometry['rects'][number],
  c: (typeof MARKER_CANDIDATES)[number]
): { box: OverviewLinearBox; leader: OverviewLinearLeader } {
  const { dir, step } = c;
  const cu = (rect.minU + rect.maxU) / 2;
  const cv = (rect.minV + rect.maxV) / 2;
  const half = MARKER / 2;
  const x =
    dir.dx === 0 ? X(cu, -half) : dir.dx === 1 ? X(rect.maxU, step) : X(rect.minU, -step - MARKER);
  const y =
    dir.dy === 0 ? Y(cv, -half) : dir.dy === 1 ? Y(rect.maxV, step) : Y(rect.minV, -step - MARKER);
  const ax = dir.dx === 0 ? X(cu) : dir.dx === 1 ? X(rect.maxU) : X(rect.minU);
  const ay = dir.dy === 0 ? Y(cv) : dir.dy === 1 ? Y(rect.maxV) : Y(rect.minV);
  return {
    box: constBox(x, y, MARKER, MARKER),
    leader: { x1: plus(x, half), y1: plus(y, half), x2: ax, y2: ay },
  };
}

/**
 * A search item: on the compact tier a region is its marker alone; on the wide
 * tier a region is its marker and plate chosen together (a marker place is
 * only taken when its plate fits right or left of it), then the summit labels.
 */
type Item =
  | { kind: 'marker'; region: number }
  | { kind: 'region'; region: number }
  | { kind: 'summit'; summit: number };

function itemsFor(input: OverviewInput, geo: Geometry, tier: OverviewTier): Item[] {
  if (tier === 'compact') return input.regions.map((_, region) => ({ kind: 'marker', region }));
  const items: Item[] = input.regions.map((_, region) => ({ kind: 'region', region }));
  geo.summitOrder.forEach((summit) => items.push({ kind: 'summit', summit }));
  return items;
}

/** How many candidates item k has in this pass (region plates beside their marker unless the fallback runs). */
function candidateCount(s: Search, k: number): number {
  const item = s.items[k];
  if (item.kind === 'marker') return MARKER_CANDIDATES.length;
  if (item.kind === 'summit') return SUMMIT_DIRS.length;
  return s.fallbacks > 0 ? REGION_CANDIDATES.length : REGION_SIDE_CANDIDATES;
}

/** Item positions in the priority list, by region and summit. */
type Index = { region: number[]; summit: number[] };

function indexOf(items: readonly Item[]): Index {
  const index: Index = { region: [], summit: [] };
  items.forEach((item, k) => {
    if (item.kind === 'summit') index.summit[item.summit] = k;
    else index.region[item.region] = k;
  });
  return index;
}

/** A region item's marker candidate and plate side (null on the compact tier). */
function regionChoice(item: Item, c: number): { marker: number; plate: number | null } {
  return item.kind === 'region'
    ? { marker: REGION_CANDIDATES[c].m, plate: REGION_CANDIDATES[c].p }
    : { marker: c, plate: null };
}

type LinearItem = {
  /** The item's boxes: a marker then its plate, or a summit label. */
  boxes: OverviewLinearBox[];
  leader?: OverviewLinearLeader;
};

/** The linear boxes (and leader, for a region) of an item at candidate c. */
function linearOf(item: Item, c: number, geo: Geometry): LinearItem {
  if (item.kind === 'summit') {
    const size = geo.summitSizes[item.summit];
    return {
      boxes: [beside(geo.triangles[item.summit], SUMMIT_DIRS[c], OVERVIEW_GAP, size.w, size.h)],
    };
  }
  const { marker, plate } = regionChoice(item, c);
  const m = markerAt(geo.rects[item.region], MARKER_CANDIDATES[marker]);
  const boxes = [m.box];
  if (plate !== null) {
    boxes.push(beside(m.box, PLATE_DIRS[plate], OVERVIEW_GAP, REGION_PLATE.w, REGION_PLATE.h));
  }
  return { boxes, leader: m.leader };
}

// ---------------------------------------------------------------- search

type ConcreteItem = {
  /** The item's boxes: a marker then (wide tier) its plate, or a summit label. */
  boxes: OverviewBox[];
  leader?: OverviewLeader;
  /** A region item's marker and (wide tier) plate. */
  marker?: OverviewBox;
  plate?: OverviewBox;
  /** The rules it breaks against the fixed marks alone (inset, triangles, rectangles). */
  fixed: number;
  /** On the compact tier, the triangles its badge crowds (see crowding). */
  crowds: number;
};

type Search = {
  S: number;
  H: number;
  items: Item[];
  index: Index;
  geo: Geometry;
  triangles: OverviewBox[];
  /** Each summit triangle as drawn, in sheet px. */
  trianglePts: Pt[][];
  /** Each region outline's corners in sheet px. */
  outlines: Pt[][];
  /** Each item's candidates, evaluated once at this S. */
  cache: Map<number, ConcreteItem>[];
  /** How many region plates may take a fallback place in this pass (0: all beside their marker). */
  fallbacks: number;
};

/**
 * The association rule (Tim, 2026-11-26): every other marker is at least
 * OVERVIEW_ASSOCIATION px farther from a plate than its own marker is.
 */
function associated(plate: OverviewBox, own: OverviewBox, other: OverviewBox): boolean {
  return boxDistance(plate, other) >= boxDistance(plate, own) + OVERVIEW_ASSOCIATION - EPS;
}

/**
 * On the compact tier, how many summit triangles a marker's badge (its 28 px
 * circle) comes within COMPACT_SUMMIT_CLEARANCE px of, as drawn. A preference,
 * not a rule: the search takes the first legal candidate that keeps clear and
 * falls back to the first legal one.
 */
function crowding(s: Search, marker: OverviewBox): number {
  const centre = { x: marker.x + MARKER / 2, y: marker.y + MARKER / 2 };
  return s.trianglePts.filter(
    (t) => pointToConvexDistance(centre, t) - MARKER / 2 < COMPACT_SUMMIT_CLEARANCE - EPS
  ).length;
}

/** Item k at candidate c, with the rules it breaks against the fixed marks (cached per S). */
function concrete(s: Search, k: number, c: number): ConcreteItem {
  const hit = s.cache[k].get(c);
  if (hit) return hit;
  const item = s.items[k];
  const lin = linearOf(item, c, s.geo);
  const boxes = lin.boxes.map((b) => evalBox(b, s.S));
  const leader = lin.leader ? evalLeader(lin.leader, s.S) : undefined;
  const plate = item.kind === 'region' ? boxes[1] : undefined;
  let fixed = 0;
  for (const box of boxes) {
    if (
      box.x < OVERVIEW_INSET - EPS ||
      box.y < OVERVIEW_INSET - EPS ||
      box.x + box.width > s.S - OVERVIEW_INSET + EPS ||
      box.y + box.height > s.H - OVERVIEW_INSET + EPS
    ) {
      fixed++;
    }
    for (const t of s.triangles) if (boxesMeet(box, t, OVERVIEW_GAP)) fixed++;
    for (const o of s.outlines) if (overlapsConvex(box, o)) fixed++;
  }
  if (leader) {
    for (const t of s.trianglePts) if (crossesConvex(leader, t)) fixed++;
    // A marker's leader never runs under its own plate.
    if (plate && crosses(leader, plate)) fixed++;
  }
  const out: ConcreteItem = {
    boxes,
    leader,
    marker: item.kind === 'summit' ? undefined : boxes[0],
    plate,
    fixed,
    crowds: item.kind === 'marker' ? crowding(s, boxes[0]) : 0,
  };
  s.cache[k].set(c, out);
  return out;
}

/** How many rules two placed items break between them (gaps, leaders, association). */
function between(a: ConcreteItem, b: ConcreteItem): number {
  let n = 0;
  for (const box of a.boxes) {
    for (const ob of b.boxes) if (boxesMeet(box, ob, OVERVIEW_GAP)) n++;
    if (b.leader && crosses(b.leader, box)) n++;
  }
  if (a.leader) for (const ob of b.boxes) if (crosses(a.leader, ob)) n++;
  if (a.plate && a.marker && b.marker && !associated(a.plate, a.marker, b.marker)) n++;
  if (b.plate && b.marker && a.marker && !associated(b.plate, b.marker, a.marker)) n++;
  return n;
}

/**
 * How many rules item k breaks at its current choice against the fixed marks
 * (sheet inset, triangles, rectangles) and the items before it in priority.
 */
function conflicts(s: Search, k: number, choices: readonly number[]): number {
  const self = concrete(s, k, choices[k]);
  let n = self.fixed;
  for (let i = 0; i < k; i++) n += between(self, concrete(s, i, choices[i]));
  return n;
}

/**
 * Item k's first legal candidate, set in choices; a compact marker prefers
 * the first one that keeps its badge clear of the triangles. Null if none.
 */
function firstLegal(s: Search, k: number, choices: number[]): number | null {
  let fallback: number | null = null;
  for (let c = 0; c < candidateCount(s, k); c++) {
    choices[k] = c;
    if (conflicts(s, k, choices) !== 0) continue;
    if (concrete(s, k, c).crowds === 0) return c;
    fallback ??= c;
  }
  if (fallback !== null) choices[k] = fallback;
  return fallback;
}

/** Sets item k to its least-conflicting candidate (when no legal one exists). */
function leastConflicting(s: Search, k: number, choices: number[]): void {
  let best = 0;
  let fewest = Infinity;
  for (let c = 0; c < candidateCount(s, k); c++) {
    choices[k] = c;
    const n = conflicts(s, k, choices);
    if (n < fewest) {
      fewest = n;
      best = c;
    }
  }
  choices[k] = best;
}

/** The candidate checks one width may spend on the complete search before falling back. */
const SEARCH_BUDGET = 200_000;
const OUT_OF_BUDGET = 'budget';

/** Whether item k's candidate c puts a region plate in a fallback place. */
function isFallback(s: Search, k: number, c: number): boolean {
  return s.items[k].kind === 'region' && c >= REGION_SIDE_CANDIDATES;
}

/** Item k's candidates in search order: a compact marker tries its uncrowded ones first. */
function searchOrder(s: Search, k: number): number[] {
  const all = Array.from({ length: candidateCount(s, k) }, (_, c) => c);
  if (s.items[k].kind !== 'marker') return all;
  return [
    ...all.filter((c) => concrete(s, k, c).crowds === 0),
    ...all.filter((c) => concrete(s, k, c).crowds !== 0),
  ];
}

/**
 * The complete search (conflict-directed backjumping, Prosser 1993): the first
 * legal layout in priority order, items k onward, given choices before k. It
 * returns null when every item is placed, or the earlier items to blame when
 * none of k's candidates leads to a layout; it then jumps straight back to the
 * latest of them, skipping only subtrees that hold no layout, so it finds the
 * same layout as plain backtracking, much faster.
 */
function backjump(
  s: Search,
  choices: number[],
  k: number,
  budget: { left: number }
): Set<number> | null | typeof OUT_OF_BUDGET {
  if (k === s.items.length) return null;
  const blame = new Set<number>();
  for (const c of searchOrder(s, k)) {
    if (--budget.left < 0) return OUT_OF_BUDGET;
    const self = concrete(s, k, c);
    if (self.fixed !== 0) continue;
    if (isFallback(s, k, c)) {
      // Over this pass's fallback count: the earlier fallback plates are to blame.
      const earlier = choices.slice(0, k).flatMap((ci, i) => (isFallback(s, i, ci) ? [i] : []));
      if (earlier.length >= s.fallbacks) {
        for (const i of earlier) blame.add(i);
        continue;
      }
    }
    let culprit = -1;
    for (let i = 0; i < k && culprit < 0; i++) {
      if (between(self, concrete(s, i, choices[i])) !== 0) culprit = i;
    }
    if (culprit >= 0) {
      blame.add(culprit);
      continue;
    }
    choices[k] = c;
    const rest = backjump(s, choices, k + 1, budget);
    if (rest === null || rest === OUT_OF_BUDGET) return rest;
    if (!rest.has(k)) return rest;
    for (const i of rest) if (i !== k) blame.add(i);
  }
  choices.length = k;
  return blame;
}

type Solved = {
  tier: OverviewTier;
  items: Item[];
  index: Index;
  geo: Geometry;
  choices: number[];
  pending: Set<number>;
  trace: string;
};

function solve(input: OverviewInput, S: number): Solved {
  const tier: OverviewTier = S <= OVERVIEW_COMPACT_MAX_S ? 'compact' : 'wide';
  const geo = geometryOf(input);
  const items = itemsFor(input, geo, tier);
  const index = indexOf(items);
  const triangles = geo.triangles.map((t) => evalBox(t, S));
  const s: Search = {
    S,
    H: S * OVERVIEW_RATIO,
    items,
    index,
    geo,
    triangles,
    trianglePts: triangles.map(trianglePoints),
    outlines: input.regions.map((r) =>
      r.corners.map((c) => ({ x: c.u * S, y: c.v * S * OVERVIEW_RATIO }))
    ),
    cache: items.map(() => new Map()),
    fallbacks: 0,
  };
  const choices: number[] = [];
  let pending = new Set<number>();

  // Every plate beside its marker first; only if no layout allows that, one
  // plate may take a fallback place, then two, and so on
  // (DIAGONAL_REGION_PLATES pins those widths).
  const regions = items.filter((item) => item.kind === 'region').length;
  for (let fallbacks = 0; fallbacks <= regions; fallbacks++) {
    s.fallbacks = fallbacks;
    choices.length = 0;
    if (backjump(s, choices, 0, { left: SEARCH_BUDGET }) === null) {
      const trace = [tier, ...choices].join(',');
      return { tier, items, index, geo, choices, pending, trace };
    }
  }
  // No complete legal layout (or the budget ran out): place greedily, report
  // the summit labels left without a legal place, drop nothing.
  choices.length = 0;
  for (let k = 0; k < items.length; k++) {
    if (firstLegal(s, k, choices) !== null) continue;
    // Backtracking: move one earlier item (nearest first) to another legal
    // candidate and re-place every item after it in priority order; the first
    // move that places them all, item k included, wins. A summit label that
    // was already pending may stay pending; every other item must be placed.
    const saved = choices.slice(0, k);
    const savedPending = pending;
    let freed = false;
    for (let j = k - 1; j >= 0 && !freed; j--) {
      if (savedPending.has(j)) continue;
      for (let alt = 0; alt < candidateCount(s, j) && !freed; alt++) {
        if (alt === saved[j]) continue;
        choices.length = 0;
        choices.push(...saved);
        choices[j] = alt;
        if (conflicts(s, j, choices) !== 0) continue;
        const trial = new Set([...savedPending].filter((i) => i < j));
        let ok = true;
        for (let i = j + 1; i <= k && ok; i++) {
          if (firstLegal(s, i, choices) !== null) continue;
          if (i < k && savedPending.has(i)) {
            leastConflicting(s, i, choices);
            trial.add(i);
          } else ok = false;
        }
        if (ok) {
          freed = true;
          pending = trial;
        }
      }
    }
    if (freed) continue;
    choices.length = 0;
    choices.push(...saved);
    pending = savedPending;
    // No legal place: keep the least-conflicting candidate, report it, drop nothing.
    leastConflicting(s, k, choices);
    pending.add(k);
  }

  const trace = [tier, ...choices.map((c, k) => `${c}${pending.has(k) ? '!' : ''}`)].join(',');
  return { tier, items, index, geo, choices, pending, trace };
}

function linearPlacements(input: OverviewInput, solved: Solved): OverviewSegmentPlacements {
  const { tier, items, index, geo, choices } = solved;
  return {
    tier,
    regions: input.regions.map((r, i) => {
      const k = index.region[i];
      const lin = linearOf(items[k], choices[k], geo);
      return {
        id: r.id,
        rect: geo.rects[i].box,
        marker: lin.boxes[0],
        leader: lin.leader as OverviewLinearLeader,
        plate: lin.boxes[1] ?? null,
      };
    }),
    summits: input.summits.map((sm, i) => {
      const k = index.summit[i];
      return {
        name: sm.name,
        key: summitKey(sm.name),
        triangle: geo.triangles[i],
        plate: k === undefined ? null : linearOf(items[k], choices[k], geo).boxes[0],
      };
    }),
  };
}

/**
 * The markers, leaders, plates, triangles and summit labels at sheet width S
 * (sheet px), regions and summits in input order.
 *
 * @throws RangeError for a non-positive S or an input checkInput refuses.
 */
export function overviewLayout(input: OverviewInput, S: number): OverviewPlacement {
  if (!Number.isFinite(S) || S <= 0) throw new RangeError(`overviewLayout: bad sheet width ${S}`);
  checkInput(input);
  const solved = solve(input, S);
  const lin = linearPlacements(input, solved);
  const { index, choices, pending } = solved;
  return {
    S,
    H: S * OVERVIEW_RATIO,
    tier: solved.tier,
    regions: lin.regions.map((r, i) => {
      const k = index.region[i];
      const choice = regionChoice(solved.items[k], choices[k]);
      return {
        id: r.id,
        number: input.regions[i].number,
        rect: evalBox(r.rect, S),
        marker: evalBox(r.marker, S),
        leader: evalLeader(r.leader, S),
        plate: r.plate ? evalBox(r.plate, S) : null,
        markerChoice: MARKER_CANDIDATES[choice.marker].name,
        plateChoice: choice.plate === null ? null : PLATE_DIRS[choice.plate].name,
        placed: !pending.has(k),
      };
    }),
    summits: lin.summits.map((sm, i) => {
      const k = index.summit[i];
      return {
        name: sm.name,
        key: sm.key,
        triangle: evalBox(sm.triangle, S),
        plate: sm.plate ? evalBox(sm.plate, S) : null,
        choice: k === undefined ? null : SUMMIT_DIRS[choices[k]].name,
        placed: k === undefined || !pending.has(k),
      };
    }),
  };
}

/**
 * The layout as segments over the sweep: consecutive integer widths with the
 * same choices, every coordinate exact as f x S + px or f x H + px. The first
 * segment's minS and the last one's maxS are null: they extend past the sweep.
 */
export function overviewSegments(input: OverviewInput): OverviewSegment[] {
  checkInput(input);
  const runs: { from: number; to: number; solved: Solved }[] = [];
  for (let S = OVERVIEW_SWEEP_MIN_S; S <= OVERVIEW_SWEEP_MAX_S; S++) {
    const solved = solve(input, S);
    const last = runs[runs.length - 1];
    if (last && last.solved.trace === solved.trace) last.to = S;
    else runs.push({ from: S, to: S, solved });
  }
  return runs.map((r, i) => ({
    minS: i === 0 ? null : r.from,
    maxS: i === runs.length - 1 ? null : r.to,
    placements: linearPlacements(input, r.solved),
  }));
}

// ---------------------------------------------------------------- CSS

function num(v: number, digits: number): string {
  if (!Number.isFinite(v)) throw new RangeError(`overviewCss: non-finite length ${v}`);
  const s = v.toFixed(digits).replace(/\.?0+$/, '');
  return s === '-0' || s === '' ? '0' : s;
}

/** calc(<f> * 100cqw|100cqh ± <px>px), f to 6 decimals and px to 2; a constant is plain px. */
function len(l: OverviewLength): string {
  const f = num(l.f, 6);
  const px = Number(num(l.px, 2));
  if (f === '0') return `${num(px, 2)}px`;
  const unit = l.axis === 'x' ? '100cqw' : '100cqh';
  return `calc(${f} * ${unit} ${px < 0 ? '-' : '+'} ${num(Math.abs(px), 2)}px)`;
}

const minus = (a: OverviewLength, b: OverviewLength): OverviewLength => ({
  axis: a.axis,
  f: a.f - b.f,
  px: a.px - b.px,
});

function segmentRules(p: OverviewSegmentPlacements): string[] {
  const out: string[] = [];
  for (const r of p.regions) {
    const sel = `[data-region-marker="${cssEscape(r.id)}"]`;
    out.push(`${sel}{left:${len(r.marker.x)};top:${len(r.marker.y)}}`);
    // The leader box, relative to the marker: constant inside a segment.
    const x1 = minus(r.leader.x1, r.marker.x);
    const y1 = minus(r.leader.y1, r.marker.y);
    const x2 = minus(r.leader.x2, r.marker.x);
    const y2 = minus(r.leader.y2, r.marker.y);
    const dx = x2.px - x1.px;
    const dy = y2.px - y1.px;
    const flip = Math.sign(dx) * Math.sign(dy) < 0 ? 'scale(-1, 1)' : 'none';
    out.push(
      `${sel} [data-region-leader]{left:${len(X(0, Math.min(x1.px, x2.px)))};top:${len(Y(0, Math.min(y1.px, y2.px)))};` +
        `width:${len(X(0, Math.abs(dx)))};height:${len(Y(0, Math.abs(dy)))};transform:${flip}}`
    );
    if (r.plate) {
      out.push(
        `${sel} [data-region-plate]{left:${len(minus(r.plate.x, r.marker.x))};top:${len(minus(r.plate.y, r.marker.y))}}`
      );
    }
  }
  for (const s of p.summits) {
    const key = cssEscape(s.key);
    out.push(`[data-summit-mark="${key}"]{left:${len(s.triangle.x)};top:${len(s.triangle.y)}}`);
    if (s.plate) {
      out.push(
        `[data-summit-plate="${key}"]{left:${len(s.plate.x)};top:${len(s.plate.y)};` +
          `width:${len(s.plate.width)};height:${len(s.plate.height)}}`
      );
    }
  }
  return out;
}

/**
 * The list-map sync (18-RESEARCH Pattern 3, UI-SPEC "Sync between list and
 * map"): a hovered or focus-visible row marks its marker dot accent, its
 * rectangle's stroke accent and its plate's ring ink-muted; a hovered marker
 * does the same and gives its row the active fill, the 2 px accent bar and an
 * accent badge. The bar sets opacity 1 because the row draws it at rest with
 * `before:opacity-0` (RegionList): without it a marker hover coloured an
 * invisible bar (18-23).
 *
 * Each state gets its own :has() (18-23, the plate sync's 2325d0a fix): WebKit
 * (Safari, and Playwright's WebKit on Linux and Windows) matches
 * `:has(row:is(:hover,:focus-visible))` but does not restyle the elements it
 * selects when the row's hover changes, because its :has() invalidation does
 * not look inside :is(). A plain `:has(row:hover)` and `:has(row:focus-visible)`
 * are invalidated correctly.
 */
function syncRules(id: string): string[] {
  const q = `"${cssEscape(id)}"`;
  const row = `[data-region-row=${q}]`;
  const marker = `[data-region-marker=${q}]`;
  const anchors = [
    `[data-overview]:has(${row}:hover)`,
    `[data-overview]:has(${row}:focus-visible)`,
    `[data-overview]:has(${marker}:hover)`,
  ];
  const markerActive = `[data-overview]:has(${marker}:hover)`;
  const both = (target: string) => anchors.map((a) => `${a} ${target}`).join(',');
  return [
    `${both(`${marker} [data-region-dot]`)}{background-color:var(--color-accent);color:var(--color-ink-inverse)}`,
    `${both(`[data-region-rect=${q}]`)}{stroke:var(--color-accent)}`,
    `${both(`${marker} [data-region-plate]`)}{--tw-ring-color:var(--color-ink-muted)}`,
    `${markerActive} ${row}{background-color:var(--color-surface-overlay)}`,
    `${markerActive} ${row}::before{content:"";position:absolute;top:0.5rem;bottom:0.5rem;left:0;width:0.125rem;background-color:var(--color-accent);opacity:1}`,
    `${markerActive} ${row} [data-region-badge]{background-color:var(--color-accent)}`,
  ];
}

/**
 * The server-rendered CSS for the overview sheet (T-18-30: built only from
 * numbers, the region ids and summit keys, which must be lowercase letters,
 * digits and single hyphens, and fixed selectors; every value is cssEscape'd).
 * The first segment is unconditional; every later one is an
 * `@container <name> (min-width: …)` rule repeating only the rules that change,
 * so the CSS covers every sheet width, fractional ones included. Then the
 * compact tier hides every plate, and the per-region sync selectors follow.
 *
 * @throws RangeError for an unsafe id, summit key or container name, or an
 *   input checkInput refuses.
 */
export function overviewCss(input: OverviewInput, containerName: string): string {
  if (!SLUG.test(containerName)) {
    throw new RangeError(`overviewCss: unsafe container name ${JSON.stringify(containerName)}`);
  }
  checkInput(input);
  const current = new Map<string, string>();
  const blocks = overviewSegments(input).map((seg) => {
    const rules = segmentRules(seg.placements).filter((rule) => {
      const selector = rule.slice(0, rule.indexOf('{'));
      if (current.get(selector) === rule) return false;
      current.set(selector, rule);
      return true;
    });
    const body = rules.join('\n');
    return seg.minS === null
      ? body
      : `@container ${containerName} (min-width: ${seg.minS}px){\n${body}\n}`;
  });
  blocks.push(
    `@container ${containerName} not (min-width: ${OVERVIEW_COMPACT_MAX_S + 1}px){[data-region-plate],[data-summit-plate]{display:none}}`
  );
  for (const r of input.regions) blocks.push(syncRules(r.id).join('\n'));
  return blocks.join('\n');
}
