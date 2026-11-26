/**
 * The region plate's photo pins (REGION-02; 18-UI-SPEC Contract 2 "Facts and
 * plate"; 18-RESEARCH Pattern 2, Pitfall 9). Pure: it takes plain pins (slug,
 * place in the ascent, sheet uv, precision) and imports no generated data;
 * lib/regions.ts regionPlateSheet builds them on the server.
 *
 * The sheet is a square, S px a side (sheet px: origin at the top-left, x
 * right, y down). Every pin has an exact-position dot (8 px plus its 2 px
 * casing) at uv x S and a 24 px numbered badge. Pins at one spot (under
 * SAME_SPOT_PX apart at the widest swept side) share one dot (plateGroups); a
 * group's badges sit side by side, GAP apart, in one row (the unit). A unit sits centred on its dot
 * unless that breaks a rule; then it is displaced, and a 1 px leader runs from
 * the unit's centre (under the badges, so it shows from the badge edge) to the
 * exact dot. Candidates, in order: centred, then for each leader step (12, 20,
 * 28, 40 px from the dot centre to the unit's facing edge, shortest first) the
 * eight directions, sorted outward: by alignment with the direction from the
 * nearest other dot (by uv, so the order is the same at every S) to this one.
 *
 * A candidate is legal when its unit stays INSET inside the sheet, keeps GAP
 * (inclusive) from every unit already placed, covers no other group's dot
 * (with its casing), its leader crosses no placed unit and no placed leader
 * crosses it. Units are placed in ascent order with a depth-first search that
 * returns the first legal combination, so a close pair (Saalfelden's two
 * aerial photos, a few px apart at every S, where a centred badge would hide
 * the other dot) is displaced outward on both sides; a group with no legal
 * candidate keeps its least-conflicting one and is reported as not placed
 * (the sweep in lib/__tests__/plate-layout.test.ts fails on it).
 *
 * Every coordinate is exactly f x S + px for a fixed set of choices (no clamp:
 * a candidate outside the inset is simply illegal), and a unit's offset from
 * its dot is a constant per choice. Consecutive integer sides with the same
 * choices form one segment, and plateCss writes each segment as
 * container-query rules (dot at calc(<u> * 100cqw ± <px>px) and
 * calc(<v> * 100cqw ± <px>px), the sheet being square; unit and leader as px
 * offsets from the dot), so the server HTML is exact at every side with no
 * client relayout. The hooks (components/photos/region/PlateSheet.tsx):
 * `[data-plate-pin=key]` (a zero-size box at the dot) holding
 * `[data-plate-leader]` (a box from the dot to the unit centre: unflipped it is
 * drawn top-left to bottom-right, flipped with scale(-1, 1)) and
 * `[data-plate-unit]` (the badge row's top-left).
 */
import { cssEscape } from './css-escape';
import { boxesMeet } from './overview-layout';

/** A numbered badge's side (size-6). */
export const BADGE = 24;
/** The exact-position dot's side (size-2). */
export const DOT = 8;
/** The dot's surface casing on each side (ring-2). */
export const DOT_CASING = 2;
/** The space between two badges, and between side-by-side badges. */
export const GAP = 8;
/** Every badge stays this far inside the sheet. */
export const INSET = 8;
/** The measured sweep; the first and last segments extend past it unchanged. */
export const PLATE_SWEEP_MIN_S = 320;
export const PLATE_SWEEP_MAX_S = 634;
/** How far a displaced badge unit's facing edge sits from its dot centre, shortest first. */
export const LEADER_STEPS = [12, 20, 28, 40] as const;
/** Pins whose dots are under this far apart at the widest swept side share one dot. */
export const SAME_SPOT_PX = 1;

/** The depth-first search gives up after this many candidate checks (the real data needs a few hundred). */
const SEARCH_BUDGET = 200_000;

const EPS = 1e-6;

/** A photo slug or container name: lowercase letters and digits, single hyphens between. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** One photo's pin: its slug, its place in the ascent (1 = lowest), its sheet uv and its precision. */
export type PlatePin = { slug: string; n: number; u: number; v: number; approximate: boolean };

/** A box in sheet px (origin top-left, x right, y down). */
export type PlateBox = { x: number; y: number; width: number; height: number };

/** A point in sheet px. */
export type PlatePoint = { x: number; y: number };

/** A leader from the badge unit's centre (x1, y1) to the exact dot (x2, y2). */
export type PlateLeader = { x1: number; y1: number; x2: number; y2: number };

/** One dot and its badges at one sheet side S. */
export type PlateGroupPlacement = {
  /** The first pin's slug: the group's CSS hook. */
  key: string;
  dot: PlatePoint;
  /** The row of badges, side by side with GAP between them. */
  unit: PlateBox;
  badges: { slug: string; n: number; box: PlateBox }[];
  /** null when the unit sits centred on its dot. */
  leader: PlateLeader | null;
  /** 'centre', or the direction and leader step ('E12', 'SW28'). */
  choice: string;
  /** false when no candidate met every rule (the sweep fails on it). */
  placed: boolean;
};

export type PlatePlacement = { S: number; groups: PlateGroupPlacement[] };

/** A length linear in the sheet side: f x S + px. */
export type PlateLength = { f: number; px: number };

export type PlateSegmentGroup = {
  key: string;
  dot: { x: PlateLength; y: PlateLength };
  unit: { x: PlateLength; y: PlateLength; width: number; height: number };
  leader: { x1: PlateLength; y1: PlateLength; x2: PlateLength; y2: PlateLength } | null;
};

/** Consecutive integer sides with the same choices; null ends are open. */
export type PlateSegment = {
  minS: number | null;
  maxS: number | null;
  groups: PlateSegmentGroup[];
};

/** What platePins reads from a photo view (a Waypoint: buildWaypoints guarantees its uv). */
export type PlatePinSource = {
  slug: string;
  approximate: boolean;
  uv: { u: number; v: number };
};

/** One dot and the pins that share it, in ascent order; the dot is the first pin's stored uv. */
export type PlateGroup = {
  key: string;
  u: number;
  v: number;
  /** A hollow dashed dot: every pin at it is approximate. */
  approximate: boolean;
  pins: readonly PlatePin[];
};

/**
 * The pins of a region's photos in sequence order, one per photo: n is the
 * photo's 1-based place in the list (1 = lowest). Every view has a uv
 * (buildWaypoints throws on a photo without one), so pin k is always number k
 * and PlateKey's list position matches each badge's number.
 */
export function platePins(views: readonly PlatePinSource[]): PlatePin[] {
  return views.map((view, i) => ({
    slug: view.slug,
    n: i + 1,
    u: view.uv.u,
    v: view.uv.v,
    approximate: view.approximate,
  }));
}

/**
 * The dots, in ascent order of their first pin: a pin whose stored uv is under
 * SAME_SPOT_PX from an earlier dot at the widest swept side (PLATE_SWEEP_MAX_S)
 * joins that dot, so the grouping is the same at every side (Zermatt's
 * img-0680 and img-0682, under 1 px apart); otherwise it starts its own. The
 * dot is its first pin's stored uv, never a mean, so no dot is placed more
 * precisely than a published position (T-18-24). A dot is hollow when every
 * pin at it is approximate.
 */
export function plateGroups(pins: readonly PlatePin[]): PlateGroup[] {
  const groups: { key: string; u: number; v: number; pins: PlatePin[] }[] = [];
  for (const p of pins) {
    const same = groups.find(
      (g) => Math.hypot(p.u - g.u, p.v - g.v) * PLATE_SWEEP_MAX_S < SAME_SPOT_PX
    );
    if (same) same.pins.push(p);
    else groups.push({ key: p.slug, u: p.u, v: p.v, pins: [p] });
  }
  return groups.map((g) => ({ ...g, approximate: g.pins.every((x) => x.approximate) }));
}

// ---------------------------------------------------------------- geometry

type Dir = { name: string; ex: -1 | 0 | 1; ey: -1 | 0 | 1 };

/** The base order (ties in the outward sort keep it). */
const DIRS: readonly Dir[] = [
  { name: 'N', ex: 0, ey: -1 },
  { name: 'S', ex: 0, ey: 1 },
  { name: 'E', ex: 1, ey: 0 },
  { name: 'W', ex: -1, ey: 0 },
  { name: 'NE', ex: 1, ey: -1 },
  { name: 'SE', ex: 1, ey: 1 },
  { name: 'NW', ex: -1, ey: -1 },
  { name: 'SW', ex: -1, ey: 1 },
];

/** A candidate: the unit's top-left as a constant offset from its dot. */
type Candidate = { name: string; ox: number; oy: number; displaced: boolean };

const unitWidth = (k: number) => k * BADGE + (k - 1) * GAP;

/** One axis of a candidate's offset: beyond the dot by `step` on that side, or centred. */
function offset(e: -1 | 0 | 1, step: number, size: number): number {
  if (e > 0) return step;
  if (e < 0) return -step - size;
  return -size / 2;
}

/** The outward direction order for each group: away from its nearest other dot (by uv). */
function candidatesFor(groups: readonly PlateGroup[]): Candidate[][] {
  return groups.map((g, i) => {
    const w = unitWidth(g.pins.length);
    let away = { x: 0, y: 0 };
    let best = Infinity;
    groups.forEach((h, j) => {
      if (j === i) return;
      const d = Math.hypot(g.u - h.u, g.v - h.v);
      if (d < best) {
        best = d;
        away = { x: g.u - h.u, y: g.v - h.v };
      }
    });
    const len = Math.hypot(away.x, away.y);
    const score = (d: Dir) =>
      len === 0 ? 0 : (d.ex * away.x + d.ey * away.y) / (len * Math.hypot(d.ex, d.ey));
    const dirs = DIRS.map((d, k) => ({ d, k, s: score(d) }))
      .sort((a, b) => b.s - a.s || a.k - b.k)
      .map((x) => x.d);
    const out: Candidate[] = [{ name: 'centre', ox: -w / 2, oy: -BADGE / 2, displaced: false }];
    for (const step of LEADER_STEPS) {
      for (const d of dirs) {
        out.push({
          name: `${d.name}${step}`,
          ox: offset(d.ex, step, w),
          oy: offset(d.ey, step, BADGE),
          displaced: true,
        });
      }
    }
    return out;
  });
}

/** Whether a segment passes through a box's interior (Liang-Barsky clip, 0.01 px tolerance). */
function crosses(s: PlateLeader, r: PlateBox): boolean {
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

function dotBox(d: PlatePoint): PlateBox {
  const side = DOT + 2 * DOT_CASING;
  return { x: d.x - side / 2, y: d.y - side / 2, width: side, height: side };
}

type Concrete = { unit: PlateBox; leader: PlateLeader | null };

type Search = {
  S: number;
  groups: readonly PlateGroup[];
  dots: PlatePoint[];
  candidates: Candidate[][];
};

function concrete(s: Search, i: number, c: Candidate): Concrete {
  const dot = s.dots[i];
  const unit: PlateBox = {
    x: dot.x + c.ox,
    y: dot.y + c.oy,
    width: unitWidth(s.groups[i].pins.length),
    height: BADGE,
  };
  const leader = c.displaced
    ? { x1: unit.x + unit.width / 2, y1: unit.y + unit.height / 2, x2: dot.x, y2: dot.y }
    : null;
  return { unit, leader };
}

/** How many rules a candidate for group i breaks against the units placed before it. */
function conflicts(s: Search, i: number, c: Concrete, placed: readonly Concrete[]): number {
  const { unit, leader } = c;
  let n = 0;
  if (
    unit.x < INSET - EPS ||
    unit.y < INSET - EPS ||
    unit.x + unit.width > s.S - INSET + EPS ||
    unit.y + unit.height > s.S - INSET + EPS
  ) {
    n++;
  }
  s.dots.forEach((d, j) => {
    if (j !== i && boxesMeet(unit, dotBox(d), 0)) n++;
  });
  for (const p of placed) {
    if (boxesMeet(unit, p.unit, GAP)) n++;
    if (leader && crosses(leader, p.unit)) n++;
    if (p.leader && crosses(p.leader, unit)) n++;
  }
  return n;
}

type Solved = { choices: number[]; placed: boolean[]; trace: string };

function solve(groups: readonly PlateGroup[], S: number, candidates: Candidate[][]): Solved {
  const s: Search = {
    S,
    groups,
    dots: groups.map((g) => ({ x: g.u * S, y: g.v * S })),
    candidates,
  };
  const choices: number[] = [];
  const chosen: Concrete[] = [];
  let budget = SEARCH_BUDGET;

  const dfs = (i: number): boolean => {
    if (i === groups.length) return true;
    for (let k = 0; k < candidates[i].length; k++) {
      if (--budget < 0) return false;
      const c = concrete(s, i, candidates[i][k]);
      if (conflicts(s, i, c, chosen) > 0) continue;
      choices.push(k);
      chosen.push(c);
      if (dfs(i + 1)) return true;
      choices.pop();
      chosen.pop();
    }
    return false;
  };

  if (dfs(0)) {
    return { choices, placed: groups.map(() => true), trace: choices.join(',') };
  }

  // No full solution: greedy, each group at its least-conflicting candidate.
  const greedy: number[] = [];
  const placedOk: boolean[] = [];
  const done: Concrete[] = [];
  groups.forEach((_, i) => {
    let bestK = 0;
    let bestN = Infinity;
    candidates[i].forEach((cand, k) => {
      const n = conflicts(s, i, concrete(s, i, cand), done);
      if (n < bestN) {
        bestN = n;
        bestK = k;
      }
    });
    greedy.push(bestK);
    placedOk.push(bestN === 0);
    done.push(concrete(s, i, candidates[i][bestK]));
  });
  return { choices: greedy, placed: placedOk, trace: `greedy:${greedy.join(',')}` };
}

function checkPins(pins: readonly PlatePin[], fn: string): void {
  const seen = new Set<string>();
  for (const p of pins) {
    if (seen.has(p.slug)) throw new RangeError(`${fn}: duplicate pin ${JSON.stringify(p.slug)}`);
    seen.add(p.slug);
    const inUnit = (x: number) => Number.isFinite(x) && x >= 0 && x <= 1;
    if (!inUnit(p.u) || !inUnit(p.v)) {
      throw new RangeError(`${fn}: pin ${JSON.stringify(p.slug)} has a uv outside [0, 1]`);
    }
  }
}

function segmentGroups(
  groups: readonly PlateGroup[],
  candidates: Candidate[][],
  choices: readonly number[]
): PlateSegmentGroup[] {
  return groups.map((g, i) => {
    const c = candidates[i][choices[i]];
    const w = unitWidth(g.pins.length);
    const dot = { x: { f: g.u, px: 0 }, y: { f: g.v, px: 0 } };
    return {
      key: g.key,
      dot,
      unit: { x: { f: g.u, px: c.ox }, y: { f: g.v, px: c.oy }, width: w, height: BADGE },
      leader: c.displaced
        ? {
            x1: { f: g.u, px: c.ox + w / 2 },
            y1: { f: g.v, px: c.oy + BADGE / 2 },
            x2: dot.x,
            y2: dot.y,
          }
        : null,
    };
  });
}

/**
 * The dots, badge units, badges and leaders at sheet side S (sheet px), groups
 * in ascent order (by their first pin).
 *
 * @throws RangeError for a non-positive S, a duplicate slug or a uv outside [0, 1].
 */
export function plateLayout(pins: readonly PlatePin[], S: number): PlatePlacement {
  if (!Number.isFinite(S) || S <= 0) throw new RangeError(`plateLayout: bad sheet side ${S}`);
  checkPins(pins, 'plateLayout');
  const groups = plateGroups(pins);
  const candidates = candidatesFor(groups);
  const solved = solve(groups, S, candidates);
  const s: Search = {
    S,
    groups,
    dots: groups.map((g) => ({ x: g.u * S, y: g.v * S })),
    candidates,
  };
  return {
    S,
    groups: groups.map((g, i) => {
      const cand = candidates[i][solved.choices[i]];
      const { unit, leader } = concrete(s, i, cand);
      return {
        key: g.key,
        dot: s.dots[i],
        unit,
        badges: g.pins.map((p, k) => ({
          slug: p.slug,
          n: p.n,
          box: { x: unit.x + k * (BADGE + GAP), y: unit.y, width: BADGE, height: BADGE },
        })),
        leader,
        choice: cand.name,
        placed: solved.placed[i],
      };
    }),
  };
}

/**
 * The layout as segments over the sweep: consecutive integer sides with the
 * same choices, every coordinate exact as f x S + px. The first segment's minS
 * and the last one's maxS are null: they extend past the sweep.
 */
export function plateSegments(pins: readonly PlatePin[]): PlateSegment[] {
  checkPins(pins, 'plateSegments');
  const groups = plateGroups(pins);
  const candidates = candidatesFor(groups);
  const runs: { from: number; to: number; solved: Solved }[] = [];
  for (let S = PLATE_SWEEP_MIN_S; S <= PLATE_SWEEP_MAX_S; S++) {
    const solved = solve(groups, S, candidates);
    const last = runs[runs.length - 1];
    if (last && last.solved.trace === solved.trace) last.to = S;
    else runs.push({ from: S, to: S, solved });
  }
  return runs.map((r, i) => ({
    minS: i === 0 ? null : r.from,
    maxS: i === runs.length - 1 ? null : r.to,
    groups: segmentGroups(groups, candidates, r.solved.choices),
  }));
}

// ---------------------------------------------------------------- CSS

function num(v: number, digits: number): string {
  if (!Number.isFinite(v)) throw new RangeError(`plateCss: non-finite length ${v}`);
  const s = v.toFixed(digits).replace(/\.?0+$/, '');
  return s === '-0' || s === '' ? '0' : s;
}

/** calc(<f> * 100cqw ± <px>px), f to 6 decimals and px to 2; a constant is plain px. */
function len(l: PlateLength): string {
  const f = num(l.f, 6);
  const px = Number(num(l.px, 2));
  if (f === '0') return `${num(px, 2)}px`;
  return `calc(${f} * 100cqw ${px < 0 ? '-' : '+'} ${num(Math.abs(px), 2)}px)`;
}

const px = (v: number): PlateLength => ({ f: 0, px: v });

function segmentRules(groups: readonly PlateSegmentGroup[]): string[] {
  const out: string[] = [];
  for (const g of groups) {
    const sel = `[data-plate-pin="${cssEscape(g.key)}"]`;
    out.push(`${sel}{left:${len(g.dot.x)};top:${len(g.dot.y)}}`);
    // Offsets from the dot are constant inside a segment.
    out.push(
      `${sel} [data-plate-unit]{left:${len(px(g.unit.x.px - g.dot.x.px))};top:${len(px(g.unit.y.px - g.dot.y.px))}}`
    );
    if (!g.leader) {
      out.push(`${sel} [data-plate-leader]{display:none}`);
    } else {
      const dx = g.leader.x1.px - g.dot.x.px;
      const dy = g.leader.y1.px - g.dot.y.px;
      const flip = Math.sign(dx) * Math.sign(dy) < 0 ? 'scale(-1, 1)' : 'none';
      out.push(
        `${sel} [data-plate-leader]{display:block;left:${len(px(Math.min(0, dx)))};top:${len(px(Math.min(0, dy)))};` +
          `width:${len(px(Math.abs(dx)))};height:${len(px(Math.abs(dy)))};transform:${flip}}`
      );
    }
  }
  return out;
}

/**
 * The list-plate sync (18-RESEARCH Pattern 3; UI-SPEC "Sync between list and
 * map", Interaction States "Plate badge" and "Plate key row"), in CSS with no
 * client JS: under the region page's [data-plate-root], a hovered or
 * focus-visible key row ([data-key-row=slug], PlateKey) or a hovered plate
 * badge ([data-plate-badge=slug]) marks the plate badge accent and gives the
 * row the overlay fill, the 2 px accent bar and an accent badge. Only fills
 * change, so an approximate badge keeps its dashed border. Without :has() the
 * rows and badges keep their own hover states and every anchor still works.
 *
 * Each state gets its own :has(): WebKit (Safari, and Playwright's WebKit on
 * Linux and Windows) matches `:has(row:is(:hover,:focus-visible))` but does not
 * restyle the badges it selects when the row's hover changes, so they stayed ink
 * on hover and accent after the pointer left. A plain `:has(row:hover)` is
 * invalidated correctly.
 */
function syncRules(slug: string): string[] {
  const q = `"${cssEscape(slug)}"`;
  const row = `[data-key-row=${q}]`;
  const badge = `[data-plate-badge=${q}]`;
  const anchors = [
    `[data-plate-root]:has(${row}:hover)`,
    `[data-plate-root]:has(${row}:focus-visible)`,
    `[data-plate-root]:has(${badge}:hover)`,
  ];
  const both = (target: string) => anchors.map((a) => `${a} ${target}`).join(',');
  const accent = '{background-color:var(--color-accent);color:var(--color-ink-inverse)}';
  return [
    `${both(badge)}${accent}`,
    `${both(row)}{background-color:var(--color-surface-overlay)}`,
    `${both(`${row}::before`)}{content:"";position:absolute;top:0.5rem;bottom:0.5rem;left:0;width:0.125rem;background-color:var(--color-accent)}`,
    `${both(`${row} [data-key-badge]`)}${accent}`,
  ];
}

/**
 * The server-rendered CSS for a region plate's pins (T-18-23: built only from
 * numbers, the slugs and fixed selectors; every selector value goes through
 * cssEscape). The first segment is unconditional; every later one is an
 * `@container <name> (min-width: …)` rule repeating only the rules that
 * change, so the CSS covers every sheet side, fractional ones included. The
 * per-pin list-plate sync rules (syncRules; T-18-60: the same slug guard and
 * cssEscape) follow, unconditional.
 *
 * @throws RangeError for a slug or container name outside the slug pattern
 *   (the mapMarkCss precedent), a duplicate slug or a uv outside [0, 1].
 */
export function plateCss(pins: readonly PlatePin[], containerName: string): string {
  if (!SLUG.test(containerName)) {
    throw new RangeError(`plateCss: unsafe container name ${JSON.stringify(containerName)}`);
  }
  for (const p of pins) {
    if (!SLUG.test(p.slug)) throw new RangeError(`plateCss: unsafe slug ${JSON.stringify(p.slug)}`);
  }
  const current = new Map<string, string>();
  const blocks = plateSegments(pins).map((seg) => {
    const rules = segmentRules(seg.groups).filter((rule) => {
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
  for (const p of pins) blocks.push(syncRules(p.slug).join('\n'));
  return blocks.join('\n');
}
