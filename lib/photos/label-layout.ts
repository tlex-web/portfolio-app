/**
 * The map label layout (PHOTO-01, PHOTO-03; D-02, D-04; 10-UI-SPEC "Label
 * layout (deterministic, server-rendered, D-02 / D-04)" and "Waypoint marks";
 * 10-RESEARCH Pattern 6). Pure and import-free, like summit-layout.ts: keep it
 * to erasable TypeScript and never add an import.
 *
 * Every waypoint on the /photos map has an always-visible label plate, and the
 * plates must never overlap at any sheet size. layoutMapMarks places them for
 * one sheet side S (in sheet px: origin at the sheet's top-left, x right, y
 * down) with fixed plate boxes, so no text is measured:
 *
 * - Wide tier (S >= 560 px): each plate beside its dot (right when it fits
 *   with the 8 px inset, else left); per side, sorted by v, centred on the dot
 *   and pushed down to clear the previous plate by 8 px (stack1D); a plate that
 *   still meets an earlier one moves below it by 8 px (the higher k moves); a
 *   plate over a dot or the summit moves below that obstacle by 8 px.
 * - Compact tier (S < 560 px): the four UI-SPEC slots (top, west of its dot,
 *   bottom-left, bottom-right), two-line 144 x 68 px plates that are their own
 *   44 px+ touch targets (D-04). The template is written for four waypoints, so
 *   any other count throws instead of overlapping silently.
 *
 * The UI-SPEC measured sweep (every integer S from 312 to 1100 px: 8 px between
 * plates, no plate over a dot or the summit, no leader across a plate, every
 * plate 8 px inside the sheet, visual order equal to altitude order) is
 * repeated by lib/__tests__/photos-label-layout.test.ts.
 *
 * The positions are piecewise linear in S: every branch (side, which term of
 * each max or clamp wins, each move, the leader edge and direction, the
 * preview side) is recorded while laying out, consecutive sides with the same
 * branches form one segment, and inside a segment every coordinate is
 * frac x S + px exactly. mapMarkCss writes the segments as container queries
 * on the sheet with calc(<frac> * 100cqw + <px>px) lengths, so the server HTML
 * is exact at every sheet size with no client relayout. stack1D is shared with
 * the lightbox hotspot gutters (10-11).
 */

/** One waypoint on the sheet, in altitude order (buildPhotoViews order), at its sheet uv. */
export type MapMark = { slug: string; u: number; v: number };

/** A box in sheet px. */
export type Rect = { x: number; y: number; width: number; height: number };

/** A point in sheet px. */
export type Point = { x: number; y: number };

/** A leader line from the plate edge (x1, y1) to the dot centre (x2, y2). */
export type Leader = { x1: number; y1: number; x2: number; y2: number };

/** A length that is linear in the sheet side: frac x S + px. */
export type Linear = { frac: number; px: number };

export type MapTier = 'wide' | 'compact';

/** Where the hover preview opens: above the plate, or below it near the sheet top. */
export type PreviewSide = 'above' | 'below';

export type MarkLayout = {
  slug: string;
  plate: Rect;
  dot: Point;
  leader: Leader;
  preview: PreviewSide;
};

/** The layout at one sheet side; `summit.mark` is the triangle's base centre (its anchor). */
export type MapLayout = {
  tier: MapTier;
  marks: MarkLayout[];
  summit: { mark: Point; plate: Rect };
};

type Lin<T> = T extends number ? Linear : { [K in keyof T]: Lin<T[K]> };

/** A segment's layout with every coordinate as a Linear in S and every discrete choice fixed. */
export type MapPlacements = {
  tier: MapTier;
  marks: {
    slug: string;
    plate: Lin<Rect>;
    dot: Lin<Point>;
    leader: Lin<Leader>;
    preview: PreviewSide;
  }[];
  summit: { mark: Lin<Point>; plate: Lin<Rect> };
};

/** Consecutive integer sheet sides with the same branches; null ends are open. */
export type MapMarkSegment = {
  minS: number | null;
  maxS: number | null;
  placements: MapPlacements;
};

/** Wide plate: w-60, two 20 px lines plus py-1 (an inset ring takes no layout space). */
export const PLATE_WIDE = { w: 240, h: 48 } as const;
/** Compact plate: w-36, the title on two lines plus the altitude, plus py-1. */
export const PLATE_COMPACT = { w: 144, h: 68 } as const;
/** Summit plate: content width, two lines plus py-1. */
export const SUMMIT_PLATE = { w: 93, h: 48 } as const;
/** Every plate stays this far inside the sheet. */
export const INSET = 8;
/** Space between plates, and between a moved plate and what it moved below. */
export const GAP = 8;
/** The waypoint dot. */
export const DOT = 12;
/** The dot's 2 px casing on each side: plates clear a DOT + DOT_CLEAR = 16 px square. */
export const DOT_CLEAR = 4;
/** The compact tier ends here (`@max-[35rem]`: S < 560 px). */
export const COMPACT_MAX_S = 559;
/** The measured sweep; the first and last segments extend past it unchanged. */
export const SWEEP_MIN_S = 312;
export const SWEEP_MAX_S = 1100;

/** The summit triangle's side (SummitMark: size-3, its base centre on the anchor). */
const SUMMIT_MARK = 12;
/** Slot 2's right edge sits 16 px of leader plus the 4 px under the dot left of the dot centre. */
const SLOT2_DX = 16 + 4;
/** A leader attaches at least this far from its plate's corners. */
const LEADER_INSET = 8;
/** A plate whose top is closer than this to the sheet top opens its preview below. */
const PREVIEW_ZONE = 120;
/** The compact template's waypoint count. */
const COMPACT_COUNT = 4;

/** The branch record of one layout; equal records mean the same linear pieces. */
type Trace = (string | number)[];

function pickMax(t: Trace, ...values: number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) if (values[i] > values[best]) best = i;
  t.push(best);
  return values[best];
}

function pickMin(t: Trace, ...values: number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) if (values[i] < values[best]) best = i;
  t.push(best);
  return values[best];
}

function clamp(t: Trace, v: number, lo: number, hi: number): number {
  return pickMin(t, pickMax(t, v, lo), hi);
}

/** Whether two boxes come closer than `gap` on both axes. */
function meets(a: Rect, b: Rect, gap: number): boolean {
  return (
    a.x < b.x + b.width + gap &&
    b.x < a.x + a.width + gap &&
    a.y < b.y + b.height + gap &&
    b.y < a.y + a.height + gap
  );
}

function stack(
  items: readonly { anchor: number; size: number }[],
  min: number,
  max: number,
  gap: number,
  t: Trace
): number[] {
  const starts: number[] = [];
  items.forEach((item, i) => {
    const centred = item.anchor - item.size / 2;
    starts.push(
      i === 0
        ? pickMax(t, centred, min)
        : pickMax(t, centred, min, starts[i - 1] + items[i - 1].size + gap)
    );
  });
  for (let i = items.length - 1; i >= 0; i--) {
    const limit = (i === items.length - 1 ? max : starts[i + 1] - gap) - items[i].size;
    starts[i] = pickMin(t, starts[i], limit);
  }
  return starts;
}

/**
 * 1-D stacking (10-RESEARCH Pattern 6): start positions for boxes in the given
 * order, each centred on its anchor, kept at or after `min`, pushed down to
 * clear the previous box by `gap`; a stack that overflows `max` is pushed up
 * from the bottom.
 */
export function stack1D(
  items: readonly { anchor: number; size: number }[],
  min: number,
  max: number,
  gap: number
): number[] {
  return stack(items, min, max, gap, []);
}

function summitParts(S: number, summitUv: { u: number; v: number }) {
  const mark = { x: summitUv.u * S, y: summitUv.v * S };
  const plate: Rect = {
    x: mark.x + SUMMIT_MARK / 2 + GAP,
    y: mark.y - SUMMIT_MARK / 2 - SUMMIT_PLATE.h / 2,
    width: SUMMIT_PLATE.w,
    height: SUMMIT_PLATE.h,
  };
  const triangle: Rect = {
    x: mark.x - SUMMIT_MARK / 2,
    y: mark.y - SUMMIT_MARK,
    width: SUMMIT_MARK,
    height: SUMMIT_MARK,
  };
  return { mark, plate, triangle };
}

function dotBox(d: Point): Rect {
  const side = DOT + DOT_CLEAR;
  return { x: d.x - side / 2, y: d.y - side / 2, width: side, height: side };
}

/**
 * The leader from the plate edge facing the dot (the axis on which the dot
 * lies further outside the plate; horizontal on a tie), attached at the dot's
 * coordinate clamped 8 px inside that edge, to the dot centre.
 */
function leaderFor(plate: Rect, dot: Point, t: Trace): Leader {
  const r = plate.x + plate.width;
  const b = plate.y + plate.height;
  const outX = Math.max(plate.x - dot.x, dot.x - r, 0);
  const outY = Math.max(plate.y - dot.y, dot.y - b, 0);
  let x1: number;
  let y1: number;
  if (outX >= outY) {
    const toRight = dot.x > r;
    t.push(toRight ? 'R' : 'L');
    x1 = toRight ? r : plate.x;
    y1 = clamp(t, dot.y, plate.y + LEADER_INSET, b - LEADER_INSET);
  } else {
    const below = dot.y > b;
    t.push(below ? 'B' : 'T');
    y1 = below ? b : plate.y;
    x1 = clamp(t, dot.x, plate.x + LEADER_INSET, r - LEADER_INSET);
  }
  t.push(Math.sign(dot.x - x1), Math.sign(dot.y - y1));
  return { x1, y1, x2: dot.x, y2: dot.y };
}

function widePlates(
  S: number,
  dots: Point[],
  marks: readonly MapMark[],
  obstacles: Rect[],
  t: Trace
): Rect[] {
  const { w, h } = PLATE_WIDE;
  const right = dots.map((d) => {
    const fits = d.x + DOT + w <= S - INSET;
    t.push(fits ? 'r' : 'l');
    return fits;
  });
  const plates: Rect[] = dots.map((d, i) => ({
    x: right[i] ? d.x + DOT : d.x - DOT - w,
    y: 0,
    width: w,
    height: h,
  }));
  for (const side of [true, false]) {
    const idx = marks
      .map((_, i) => i)
      .filter((i) => right[i] === side)
      .sort((a, b) => marks[a].v - marks[b].v || a - b);
    const starts = stack(
      idx.map((i) => ({ anchor: dots[i].y, size: h })),
      INSET,
      S - INSET,
      GAP,
      t
    );
    idx.forEach((i, n) => {
      plates[i].y = starts[n];
    });
  }

  // Rules 3 and 4: a plate that still meets an earlier plate, a dot or the
  // summit moves below it; repeat until nothing moves.
  for (let pass = 0; pass < 4 * plates.length + 4; pass++) {
    let moved = false;
    for (let j = 0; j < plates.length; j++) {
      for (let i = 0; i < j; i++) {
        if (meets(plates[i], plates[j], GAP)) {
          t.push(`m${i}.${j}`);
          plates[j].y = plates[i].y + plates[i].height + GAP;
          moved = true;
        }
      }
      obstacles.forEach((o, n) => {
        if (meets(o, plates[j], 0)) {
          t.push(`o${n}.${j}`);
          plates[j].y = o.y + o.height + GAP;
          moved = true;
        }
      });
    }
    if (!moved) break;
  }
  return plates;
}

function compactPlates(S: number, dots: Point[], marks: readonly MapMark[], t: Trace): Rect[] {
  if (marks.length !== COMPACT_COUNT) {
    throw new RangeError(
      `layoutMapMarks: the compact tier (sheet side < 560 px) is a four-waypoint template ` +
        `(top, west, bottom-left, bottom-right slots) and cannot place ${marks.length} marks; ` +
        `revise the layout before changing the photo count`
    );
  }
  const { w, h } = PLATE_COMPACT;
  const bottomRow = S - INSET - h;
  const slot1: Rect = {
    x: clamp(t, dots[0].x - w / 2, INSET, S - INSET - w),
    y: INSET,
    width: w,
    height: h,
  };
  const slot2: Rect = {
    x: dots[1].x - SLOT2_DX - w,
    y: pickMax(t, dots[1].y - h / 2, slot1.y + h + GAP),
    width: w,
    height: h,
  };
  const slot4: Rect = {
    x: clamp(t, dots[3].x - w / 2, INSET, S - INSET - w),
    y: bottomRow,
    width: w,
    height: h,
  };
  const slot3: Rect = {
    x: clamp(t, dots[2].x - w / 2, INSET, slot4.x - GAP - w),
    y: bottomRow,
    width: w,
    height: h,
  };
  return [slot1, slot2, slot3, slot4];
}

function compute(
  S: number,
  marks: readonly MapMark[],
  summitUv: { u: number; v: number },
  t: Trace
): MapLayout {
  const tier: MapTier = S <= COMPACT_MAX_S ? 'compact' : 'wide';
  t.push(tier);
  const dots = marks.map((m) => ({ x: m.u * S, y: m.v * S }));
  const summit = summitParts(S, summitUv);
  const obstacles = [...dots.map(dotBox), summit.triangle, summit.plate];
  const plates =
    tier === 'compact'
      ? compactPlates(S, dots, marks, t)
      : widePlates(S, dots, marks, obstacles, t);

  return {
    tier,
    marks: marks.map((m, i) => {
      const leader = leaderFor(plates[i], dots[i], t);
      const preview: PreviewSide = plates[i].y < PREVIEW_ZONE ? 'below' : 'above';
      t.push(preview);
      return { slug: m.slug, plate: plates[i], dot: dots[i], leader, preview };
    }),
    summit: { mark: summit.mark, plate: summit.plate },
  };
}

/**
 * The plates, dots, leaders and summit at sheet side S (sheet px), in the
 * input order.
 *
 * @throws RangeError on the compact tier (S < 560) for any count but four.
 */
export function layoutMapMarks(
  S: number,
  marks: readonly MapMark[],
  summitUv: { u: number; v: number }
): MapLayout {
  return compute(S, marks, summitUv, []);
}

function fitLayout(a: MapLayout, b: MapLayout, from: number, to: number): MapPlacements {
  const lin = (va: number, vb: number): Linear => {
    if (to === from) return { frac: 0, px: va };
    const frac = (vb - va) / (to - from);
    return { frac, px: va - frac * from };
  };
  const point = (pa: Point, pb: Point) => ({ x: lin(pa.x, pb.x), y: lin(pa.y, pb.y) });
  const rect = (ra: Rect, rb: Rect) => ({
    x: lin(ra.x, rb.x),
    y: lin(ra.y, rb.y),
    width: lin(ra.width, rb.width),
    height: lin(ra.height, rb.height),
  });
  return {
    tier: a.tier,
    marks: a.marks.map((m, i) => {
      const n = b.marks[i];
      return {
        slug: m.slug,
        plate: rect(m.plate, n.plate),
        dot: point(m.dot, n.dot),
        leader: {
          x1: lin(m.leader.x1, n.leader.x1),
          y1: lin(m.leader.y1, n.leader.y1),
          x2: lin(m.leader.x2, n.leader.x2),
          y2: lin(m.leader.y2, n.leader.y2),
        },
        preview: m.preview,
      };
    }),
    summit: {
      mark: point(a.summit.mark, b.summit.mark),
      plate: rect(a.summit.plate, b.summit.plate),
    },
  };
}

/**
 * The layout as linear segments over the sweep: consecutive integer sides with
 * the same branches, each coordinate fitted from the segment's ends (a one-side
 * segment uses frac 0). The first segment's minS and the last one's maxS are
 * null: they extend past the sweep unchanged.
 */
export function mapMarkSegments(
  marks: readonly MapMark[],
  summitUv: { u: number; v: number }
): MapMarkSegment[] {
  const runs: { from: number; to: number; sig: string }[] = [];
  for (let S = SWEEP_MIN_S; S <= SWEEP_MAX_S; S++) {
    const t: Trace = [];
    compute(S, marks, summitUv, t);
    const sig = t.join(',');
    const last = runs[runs.length - 1];
    if (last && last.sig === sig) last.to = S;
    else runs.push({ from: S, to: S, sig });
  }
  return runs.map((r, i) => ({
    minS: i === 0 ? null : r.from,
    maxS: i === runs.length - 1 ? null : r.to,
    placements: fitLayout(
      layoutMapMarks(r.from, marks, summitUv),
      layoutMapMarks(r.to, marks, summitUv),
      r.from,
      r.to
    ),
  }));
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function num(v: number, digits: number): string {
  if (!Number.isFinite(v)) throw new RangeError(`mapMarkCss: non-finite length ${v}`);
  const s = v.toFixed(digits).replace(/\.?0+$/, '');
  return s === '-0' || s === '' ? '0' : s;
}

/** calc(<frac> * 100cqw + <px>px), frac to 6 decimals and px to 2; a constant is plain px. */
function len(l: Linear): string {
  const frac = num(l.frac, 6);
  const px = Number(num(l.px, 2));
  if (frac === '0') return `${num(px, 2)}px`;
  return `calc(${frac} * 100cqw ${px < 0 ? '-' : '+'} ${num(Math.abs(px), 2)}px)`;
}

const minus = (a: Linear, b: Linear): Linear => ({ frac: a.frac - b.frac, px: a.px - b.px });
const neg = (a: Linear): Linear => ({ frac: -a.frac, px: -a.px });

function segmentRules(p: MapPlacements, sample: number): string[] {
  const out: string[] = [];
  for (const m of p.marks) {
    const sel = `[data-map-mark="${m.slug}"]`;
    out.push(`${sel}{left:${len(m.plate.x)};top:${len(m.plate.y)}}`);
    out.push(
      `${sel} [data-map-dot]{left:${len(minus(m.dot.x, m.plate.x))};top:${len(minus(m.dot.y, m.plate.y))}}`
    );
    // The leader box spans the segment; its direction is fixed inside a segment,
    // so the box corner, size and flip are linear too.
    const dx = minus(m.leader.x2, m.leader.x1);
    const dy = minus(m.leader.y2, m.leader.y1);
    const sx = Math.sign(Math.round((dx.frac * sample + dx.px) * 1000));
    const sy = Math.sign(Math.round((dy.frac * sample + dy.px) * 1000));
    const left = minus(sx < 0 ? m.leader.x2 : m.leader.x1, m.plate.x);
    const top = minus(sy < 0 ? m.leader.y2 : m.leader.y1, m.plate.y);
    const flip = sx * sy < 0 ? 'scale(-1, 1)' : 'none';
    out.push(
      `${sel} [data-map-leader]{left:${len(left)};top:${len(top)};width:${len(sx < 0 ? neg(dx) : dx)};height:${len(sy < 0 ? neg(dy) : dy)};transform:${flip}}`
    );
    out.push(
      m.preview === 'above'
        ? `${sel} [data-map-preview]{top:auto;bottom:calc(100% + 8px)}`
        : `${sel} [data-map-preview]{top:calc(100% + 8px);bottom:auto}`
    );
  }
  out.push(`[data-summit-plate]{left:${len(p.summit.plate.x)};top:${len(p.summit.plate.y)}}`);
  return out;
}

/**
 * The server-rendered CSS for the map marks (T-10-18: built only from numbers,
 * the slugs, which must be lowercase letters, digits and hyphens, and fixed
 * selectors). The first segment is unconditional; every later one is an
 * `@container map-sheet (min-width: …)` rule that overrides the rules that
 * change, so the CSS covers every sheet side, fractional ones included.
 */
export function mapMarkCss(marks: readonly MapMark[], summitUv: { u: number; v: number }): string {
  for (const m of marks) {
    if (!SLUG.test(m.slug))
      throw new RangeError(`mapMarkCss: unsafe slug ${JSON.stringify(m.slug)}`);
  }
  // A later segment repeats only the rules that change: an earlier segment's
  // rule still matches (its min-width is lower), so an identical rule would be
  // redundant. A rule is keyed by its selector (the text before its '{').
  const current = new Map<string, string>();
  return mapMarkSegments(marks, summitUv)
    .map((seg) => {
      const rules = segmentRules(seg.placements, seg.minS ?? SWEEP_MIN_S).filter((rule) => {
        const selector = rule.slice(0, rule.indexOf('{'));
        if (current.get(selector) === rule) return false;
        current.set(selector, rule);
        return true;
      });
      const body = rules.join('\n');
      return seg.minS === null
        ? body
        : `@container map-sheet (min-width: ${seg.minS}px){\n${body}\n}`;
    })
    .join('\n');
}
