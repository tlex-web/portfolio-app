/**
 * @jest-environment node
 */
/**
 * The Alps overview label layout (REGION-01; 18-UI-SPEC Contract 1 "Sheet",
 * "Label layout", "Compact tier"; 18-RESEARCH Pattern 2, Pattern 3, A6).
 *
 * The UI-SPEC gate: a sweep of every integer sheet width S from 312 to 1100 px
 * with the real outlines and summits (sheet height S x 872 / 1200). At every S
 * no two boxes (markers, region plates, summit plates, summit triangles) meet
 * or come closer than 8 px, every box stays 8 px inside the sheet, no leader
 * crosses a box other than its own marker, and no label box covers a
 * sheet-index rectangle. The compact tier (S < 560) has markers only. The
 * count guards fail when a region or a summit is added, forcing a re-sweep.
 *
 * A summit label that has no legal place on some widths is pinned exactly in
 * UNPLACED_SUMMIT_LABELS (Tim decides at 18-13 Task 2): the rows below exclude
 * exactly those (summit, S) pairs and nothing else, and the equality row fails
 * on any drift in the ranges.
 */
import { overview } from '@/data/generated/overview';
import { countLabel } from '@/lib/home-format';
import { formatMetres } from '@/lib/photo-format';
import {
  LEADER_STEPS,
  MARKER,
  OVERVIEW_COMPACT_MAX_S,
  OVERVIEW_GAP,
  OVERVIEW_INSET,
  OVERVIEW_RATIO,
  OVERVIEW_SWEEP_MAX_S,
  OVERVIEW_SWEEP_MIN_S,
  REGION_PLATE,
  SUMMIT_TRIANGLE,
  UNPLACED_SUMMIT_LABELS,
  boxesMeet,
  overviewCss,
  overviewLayout,
  overviewSegments,
  summitKey,
  summitPlateSize,
  type OverviewBox,
  type OverviewInput,
  type OverviewLength,
  type OverviewPlacement,
} from '@/lib/photos/overview-layout';
import { regionPhotoViews, regionsWestToEast } from '@/lib/regions';

const ordered = regionsWestToEast();

/** The plain input 18-23's overviewSheetInput builds, from the real server data. */
const input: OverviewInput = {
  regions: ordered.map((r, i) => {
    const outline = overview.outlines.find((o) => o.region === r.id);
    if (!outline) throw new Error(`overview-layout test: ${r.id} has no overview outline`);
    return {
      id: r.id,
      number: i + 1,
      name: r.name,
      count: countLabel(regionPhotoViews(r.id).length, 'photograph', 'photographs'),
      corners: outline.corners,
    };
  }),
  // P6 (18-01): Triglav's stored height is printed plainly, like the others.
  summits: overview.summits.map((s) => ({
    name: s.name,
    u: s.uv.u,
    v: s.uv.v,
    height: formatMetres(s.officialM),
  })),
};

/** Every integer sheet width from 312 to 1100 px. */
const SIDES = Array.from({ length: 1100 - 312 + 1 }, (_, i) => 312 + i);

const right = (r: OverviewBox) => r.x + r.width;
const bottom = (r: OverviewBox) => r.y + r.height;

/**
 * The clear distance between two boxes: the largest axis gap (negative when
 * they overlap). Independent of the module's own boxesMeet.
 */
function gapOf(a: OverviewBox, b: OverviewBox): number {
  return Math.max(b.x - right(a), a.x - right(b), b.y - bottom(a), a.y - bottom(b));
}

/** The 8 px rule, inclusive at 8 (with a float tolerance far below a pixel). */
const clearOf = (a: OverviewBox, b: OverviewBox, gap: number) => gapOf(a, b) >= gap - 1e-6;

/** Whether a segment passes through a box's interior (Liang-Barsky clip, 0.01 px tolerance). */
function segmentCrosses(
  s: { x1: number; y1: number; x2: number; y2: number },
  r: OverviewBox
): boolean {
  const e = 0.01;
  const box = { x0: r.x + e, y0: r.y + e, x1: right(r) - e, y1: bottom(r) - e };
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

type Pt = { x: number; y: number };

/** The triangle a summit mark draws in its box: apex top-centre, base at the bottom. */
const triangleOf = (b: OverviewBox): Pt[] => [
  { x: b.x + b.width / 2, y: b.y },
  { x: right(b), y: bottom(b) },
  { x: b.x, y: bottom(b) },
];

/**
 * Whether a segment passes through a convex polygon's interior: sampled at
 * 1/2000 steps against the polygon shrunk by 0.01 px (independent of the
 * module's Cyrus-Beck clip).
 */
function segmentCrossesPolygon(
  s: { x1: number; y1: number; x2: number; y2: number },
  pts: readonly Pt[]
): boolean {
  const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
  const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
  const inside = (x: number, y: number) =>
    pts.every((a, i) => {
      const b = pts[(i + 1) % pts.length];
      const nx = a.y - b.y;
      const ny = b.x - a.x;
      const n = Math.hypot(nx, ny);
      const side = Math.sign(nx * (cx - a.x) + ny * (cy - a.y));
      return (side * (nx * (x - a.x) + ny * (y - a.y))) / n > 0.01;
    });
  for (let i = 0; i <= 2000; i++) {
    const t = i / 2000;
    if (inside(s.x1 + t * (s.x2 - s.x1), s.y1 + t * (s.y2 - s.y1))) return true;
  }
  return false;
}

/** Whether a box and a convex polygon overlap with positive area (separating axis test). */
function boxOverlapsPolygon(box: OverviewBox, pts: readonly Pt[]): boolean {
  const corners: Pt[] = [
    { x: box.x, y: box.y },
    { x: right(box), y: box.y },
    { x: right(box), y: bottom(box) },
    { x: box.x, y: bottom(box) },
  ];
  const axes: Pt[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    ...pts.map((a, i) => {
      const b = pts[(i + 1) % pts.length];
      const n = Math.hypot(b.x - a.x, b.y - a.y);
      return { x: (a.y - b.y) / n, y: (b.x - a.x) / n };
    }),
  ];
  return axes.every((axis) => {
    const pa = corners.map((p) => p.x * axis.x + p.y * axis.y);
    const pb = pts.map((p) => p.x * axis.x + p.y * axis.y);
    return Math.max(...pa) > Math.min(...pb) + 1e-6 && Math.max(...pb) > Math.min(...pa) + 1e-6;
  });
}

/** The Euclidean distance between two boxes, 0 when they meet (independent of the module's). */
function distanceOf(a: OverviewBox, b: OverviewBox): number {
  const dx = Math.max(0, b.x - right(a), a.x - right(b));
  const dy = Math.max(0, b.y - bottom(a), a.y - bottom(b));
  return Math.hypot(dx, dy);
}

/** A plate's side of its marker: 'E' or 'W' when vertically centred on it and 8 px away, else null. */
function sideOf(plate: OverviewBox, marker: OverviewBox): 'E' | 'W' | null {
  const centred = Math.abs(plate.y + plate.height / 2 - (marker.y + marker.height / 2)) < 1e-6;
  if (!centred) return null;
  if (Math.abs(plate.x - right(marker) - OVERVIEW_GAP) < 1e-6) return 'E';
  if (Math.abs(marker.x - right(plate) - OVERVIEW_GAP) < 1e-6) return 'W';
  return null;
}

/** The distance from a point to a triangle as drawn, 0 inside it (sampled edges, independent). */
function pointToTriangle(p: Pt, pts: readonly Pt[]): number {
  const sign = (a: Pt, b: Pt) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  const s = pts.map((a, i) => sign(a, pts[(i + 1) % pts.length]));
  if (s.every((v) => v >= 0) || s.every((v) => v <= 0)) return 0;
  let best = Infinity;
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length];
    for (let j = 0; j <= 1000; j++) {
      const t = j / 1000;
      best = Math.min(
        best,
        Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)))
      );
    }
  });
  return best;
}

/** (key, S) pairs collected into inclusive S ranges per key, in first-seen order. */
function rangesOf(
  pairs: readonly [string, number][]
): { key: string; ranges: [number, number][] }[] {
  const found = new Map<string, [number, number][]>();
  for (const [key, S] of pairs) {
    const ranges = found.get(key) ?? [];
    const last = ranges[ranges.length - 1];
    if (last && last[1] === S - 1) last[1] = S;
    else ranges.push([S, S]);
    found.set(key, ranges);
  }
  return [...found].map(([key, ranges]) => ({ key, ranges }));
}

/** Whether a summit's label is pinned as unplaceable at S (excluded from the rule rows). */
function pending(summit: string, S: number): boolean {
  return UNPLACED_SUMMIT_LABELS.some(
    (p) => p.summit === summit && p.ranges.some(([lo, hi]) => S >= lo && S <= hi)
  );
}

type Named = { name: string; box: OverviewBox; summit?: string };

/** Every box on the sheet at one S, with a name for failure messages. */
function boxesOf(p: OverviewPlacement): Named[] {
  const out: Named[] = [];
  for (const r of p.regions) {
    out.push({ name: `marker ${r.id}`, box: r.marker });
    if (r.plate) out.push({ name: `plate ${r.id}`, box: r.plate });
  }
  for (const s of p.summits) {
    out.push({ name: `triangle ${s.name}`, box: s.triangle });
    if (s.plate) out.push({ name: `label ${s.name}`, box: s.plate, summit: s.name });
  }
  return out;
}

const layouts = new Map<number, OverviewPlacement>(SIDES.map((S) => [S, overviewLayout(input, S)]));

/** Fails with a message naming the sweep when a count changes. */
function guardCount(what: string, got: number, want: number) {
  if (got !== want) {
    throw new Error(
      `overview-layout: the S ${OVERVIEW_SWEEP_MIN_S}-${OVERVIEW_SWEEP_MAX_S} sweep was measured ` +
        `for ${want} ${what}, found ${got}; re-run the sweep and revise the layout`
    );
  }
}

describe('constants', () => {
  it('declares the UI-SPEC boxes, gap, inset, tiers, ratio, leader steps and sweep range', () => {
    expect(MARKER).toBe(28);
    expect(REGION_PLATE).toEqual({ w: 144, h: 48 });
    expect(SUMMIT_TRIANGLE).toBe(12);
    expect(OVERVIEW_GAP).toBe(8);
    expect(OVERVIEW_INSET).toBe(8);
    expect(OVERVIEW_COMPACT_MAX_S).toBe(559);
    expect(OVERVIEW_SWEEP_MIN_S).toBe(312);
    expect(OVERVIEW_SWEEP_MAX_S).toBe(1100);
    expect(OVERVIEW_RATIO).toBe(872 / 1200);
    expect(OVERVIEW_RATIO).toBe(overview.grid.height / overview.grid.width);
    expect(LEADER_STEPS).toEqual([8, 16, 24, 40]);
  });

  it('sizes a summit plate from the declared per-character widths plus px-2 py-1', () => {
    // Inter 14 at 7.7 px a character, JetBrains Mono 14 at 8.4 px, 16 px of
    // padding, rounded up; two 20 px lines plus 8 px.
    expect(summitPlateSize('Mont Blanc', '4,806 m')).toEqual({ w: 93, h: 48 });
    expect(summitPlateSize('Dufourspitze', '4,634 m')).toEqual({ w: 109, h: 48 });
    expect(summitPlateSize('Grossglockner', '3,798 m')).toEqual({ w: 117, h: 48 });
    expect(summitPlateSize('Zugspitze', '2,962 m')).toEqual({ w: 86, h: 48 });
    expect(summitPlateSize('Triglav', '2,864 m')).toEqual({ w: 75, h: 48 });
  });
});

describe('count guards (UI E1 zero-one-many)', () => {
  it('was measured for exactly 3 regions and 5 reference summits', () => {
    guardCount('regions', input.regions.length, 3);
    guardCount('summits', input.summits.length, 5);
  });

  it('fails with a message naming the sweep when a count changes', () => {
    expect(() => guardCount('regions', 4, 3)).toThrow(/S 312-1100 sweep/);
    expect(() => guardCount('summits', 6, 5)).toThrow(/S 312-1100 sweep/);
  });
});

describe('the input', () => {
  it('numbers the markers 1..N west to east (regionsWestToEast)', () => {
    expect(input.regions.map((r) => r.id)).toEqual(['zermatt', 'ortler', 'saalfelden']);
    for (const S of [OVERVIEW_SWEEP_MIN_S, 560, OVERVIEW_SWEEP_MAX_S]) {
      const p = layouts.get(S)!;
      expect(p.regions.map((r) => [r.id, r.number])).toEqual([
        ['zermatt', 1],
        ['ortler', 2],
        ['saalfelden', 3],
      ]);
      const centres = p.regions.map((r) => r.rect.x + r.rect.width / 2);
      expect([...centres].sort((a, b) => a - b)).toEqual(centres);
    }
  });

  it('rejects numbers that are not 1..N in input order, or regions out of west-to-east order', () => {
    const swapped = { ...input, regions: [input.regions[1], input.regions[0], input.regions[2]] };
    expect(() => overviewLayout(swapped, 800)).toThrow(RangeError);
    const renumbered = {
      ...input,
      regions: input.regions.map((r, i) => ({ ...r, number: i + 2 })),
    };
    expect(() => overviewLayout(renumbered, 800)).toThrow(RangeError);
  });

  it('keeps the plate text to the short name (10 characters) and the count (15 characters)', () => {
    for (const r of input.regions) {
      expect(r.name.length).toBeLessThanOrEqual(10);
      expect(r.count.length).toBeLessThanOrEqual(15);
    }
    const long = {
      ...input,
      regions: input.regions.map((r, i) => (i === 0 ? { ...r, name: 'Zermatt Valley' } : r)),
    };
    expect(() => overviewLayout(long, 800)).toThrow(RangeError);
  });
});

describe('boxesMeet (the 8 px rule is inclusive)', () => {
  const a: OverviewBox = { x: 0, y: 0, width: 28, height: 28 };
  it('allows two boxes exactly 8 px apart', () => {
    const b: OverviewBox = { x: 36, y: 0, width: 28, height: 28 };
    expect(boxesMeet(a, b, OVERVIEW_GAP)).toBe(false);
    expect(clearOf(a, b, OVERVIEW_GAP)).toBe(true);
  });
  it('fails two boxes 7 px apart', () => {
    const b: OverviewBox = { x: 0, y: 35, width: 28, height: 28 };
    expect(boxesMeet(a, b, OVERVIEW_GAP)).toBe(true);
    expect(clearOf(a, b, OVERVIEW_GAP)).toBe(false);
  });
});

describe('overviewLayout sweep, sheet widths 312-1100 px (UI E1 populated)', () => {
  it('keeps the tiers: compact (markers only) up to 559 px, wide from 560 px', () => {
    for (const S of SIDES) {
      const p = layouts.get(S)!;
      expect(p.S).toBe(S);
      expect(p.H).toBeCloseTo(S * OVERVIEW_RATIO, 9);
      if (S <= OVERVIEW_COMPACT_MAX_S) {
        expect(p.tier).toBe('compact');
        for (const r of p.regions) expect(r.plate).toBeNull();
        for (const s of p.summits) expect(s.plate).toBeNull();
      } else {
        expect(p.tier).toBe('wide');
        for (const r of p.regions) expect(r.plate).not.toBeNull();
        for (const s of p.summits) expect(s.plate).not.toBeNull();
      }
    }
  });

  it('places each triangle with its base centre on the summit uv and each rectangle on its outline', () => {
    for (const S of [312, 736, 1100]) {
      const p = layouts.get(S)!;
      p.summits.forEach((s, i) => {
        const src = input.summits[i];
        expect(s.name).toBe(src.name);
        expect(s.triangle.width).toBe(SUMMIT_TRIANGLE);
        expect(s.triangle.height).toBe(SUMMIT_TRIANGLE);
        expect(s.triangle.x + 6).toBeCloseTo(src.u * S, 6);
        expect(s.triangle.y + 12).toBeCloseTo(src.v * p.H, 6);
      });
      p.regions.forEach((r, i) => {
        const us = input.regions[i].corners.map((c) => c.u);
        const vs = input.regions[i].corners.map((c) => c.v);
        expect(r.rect.x).toBeCloseTo(Math.min(...us) * S, 6);
        expect(right(r.rect)).toBeCloseTo(Math.max(...us) * S, 6);
        expect(r.rect.y).toBeCloseTo(Math.min(...vs) * p.H, 6);
        expect(bottom(r.rect)).toBeCloseTo(Math.max(...vs) * p.H, 6);
      });
    }
  });

  it('keeps at least 8 px between any two boxes', () => {
    const bad: string[] = [];
    for (const S of SIDES) {
      const boxes = boxesOf(layouts.get(S)!);
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const [a, b] = [boxes[i], boxes[j]];
          if ((a.summit && pending(a.summit, S)) || (b.summit && pending(b.summit, S))) continue;
          if (!clearOf(a.box, b.box, OVERVIEW_GAP)) {
            bad.push(`S=${S} ${a.name} / ${b.name}: ${gapOf(a.box, b.box).toFixed(2)} px`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('keeps every box at least 8 px inside the sheet', () => {
    const bad: string[] = [];
    for (const S of SIDES) {
      const p = layouts.get(S)!;
      for (const b of boxesOf(p)) {
        if (b.summit && pending(b.summit, S)) continue;
        const e = 1e-6;
        if (
          b.box.x < OVERVIEW_INSET - e ||
          b.box.y < OVERVIEW_INSET - e ||
          right(b.box) > S - OVERVIEW_INSET + e ||
          bottom(b.box) > p.H - OVERVIEW_INSET + e
        ) {
          bad.push(`S=${S} ${b.name}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('draws no leader across a box other than its own marker (a triangle as drawn)', () => {
    // A triangle is checked as the shape it draws: at small widths
    // Dufourspitze's triangle box overlaps the Zermatt rectangle, so every
    // leader end on that rectangle lies inside the box.
    const bad: string[] = [];
    for (const S of SIDES) {
      const p = layouts.get(S)!;
      const boxes = boxesOf(p);
      for (const r of p.regions) {
        for (const b of boxes) {
          if (b.name === `marker ${r.id}`) continue;
          if (b.summit && pending(b.summit, S)) continue;
          const hit = b.name.startsWith('triangle')
            ? segmentCrossesPolygon(r.leader, triangleOf(b.box))
            : segmentCrosses(r.leader, b.box);
          if (hit) bad.push(`S=${S} leader ${r.id} / ${b.name}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('covers no sheet-index rectangle (its drawn outline) with a marker, a region plate or a summit label', () => {
    const bad: string[] = [];
    for (const S of SIDES) {
      const p = layouts.get(S)!;
      for (const b of boxesOf(p)) {
        if (b.name.startsWith('triangle')) continue;
        if (b.summit && pending(b.summit, S)) continue;
        for (const r of input.regions) {
          const outline = r.corners.map((c) => ({ x: c.u * S, y: c.v * p.H }));
          if (boxOverlapsPolygon(b.box, outline))
            bad.push(`S=${S} ${b.name} over rectangle ${r.id}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('joins each marker to its rectangle: leader from the marker centre to the rectangle edge, 8-40 px of gap', () => {
    const bad: string[] = [];
    for (const S of SIDES) {
      const p = layouts.get(S)!;
      for (const r of p.regions) {
        expect(r.marker.width).toBe(MARKER);
        expect(r.marker.height).toBe(MARKER);
        const { x1, y1, x2, y2 } = r.leader;
        if (Math.abs(x1 - (r.marker.x + MARKER / 2)) > 1e-6) bad.push(`S=${S} ${r.id} x1`);
        if (Math.abs(y1 - (r.marker.y + MARKER / 2)) > 1e-6) bad.push(`S=${S} ${r.id} y1`);
        const onX = [r.rect.x, r.rect.x + r.rect.width / 2, right(r.rect)];
        const onY = [r.rect.y, r.rect.y + r.rect.height / 2, bottom(r.rect)];
        if (
          !onX.some((v) => Math.abs(v - x2) < 1e-6) ||
          !onY.some((v) => Math.abs(v - y2) < 1e-6)
        ) {
          bad.push(`S=${S} ${r.id} leader end off the rectangle's edge points`);
        }
        const g = gapOf(r.marker, r.rect);
        if (!LEADER_STEPS.some((step) => Math.abs(g - step) < 1e-6)) {
          bad.push(`S=${S} ${r.id} marker gap ${g.toFixed(2)}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('puts each region plate 8 px from its marker and each summit label 8 px from its triangle', () => {
    const bad: string[] = [];
    for (const S of SIDES) {
      const p = layouts.get(S)!;
      if (p.tier === 'compact') continue;
      for (const r of p.regions) {
        expect(r.plate!.width).toBe(REGION_PLATE.w);
        expect(r.plate!.height).toBe(REGION_PLATE.h);
        if (Math.abs(gapOf(r.plate!, r.marker) - OVERVIEW_GAP) > 1e-6) bad.push(`S=${S} ${r.id}`);
      }
      p.summits.forEach((s, i) => {
        const size = summitPlateSize(input.summits[i].name, input.summits[i].height);
        expect([s.plate!.width, s.plate!.height]).toEqual([size.w, size.h]);
        if (Math.abs(gapOf(s.plate!, s.triangle) - OVERVIEW_GAP) > 1e-6) {
          bad.push(`S=${S} ${s.name}`);
        }
      });
    }
    expect(bad).toEqual([]);
  });

  /*
   * Association (Tim, 2026-11-26, before 18-28): at 1440 Zermatt's plate sat
   * diagonally above-right of marker 1, about as near marker 2, and read as
   * Ortler's label. The UI-SPEC rule is a plate right of its marker, flipping
   * left; markers and summit labels give way, triangles never move.
   */
  it('puts every region plate right or left of its own marker, vertically centred, 8 px apart', () => {
    const off: [string, number][] = [];
    for (const S of SIDES) {
      const p = layouts.get(S)!;
      if (p.tier === 'compact') continue;
      for (const r of p.regions) if (!sideOf(r.plate!, r.marker)) off.push([r.id, S]);
    }
    expect(rangesOf(off)).toEqual([]);
  });

  it('keeps every other marker at least 16 px farther from a plate than its own marker (the association invariant)', () => {
    const bad: string[] = [];
    for (const S of SIDES) {
      const p = layouts.get(S)!;
      if (p.tier === 'compact') continue;
      for (const r of p.regions) {
        const own = distanceOf(r.plate!, r.marker);
        for (const o of p.regions) {
          if (o.id === r.id) continue;
          const d = distanceOf(r.plate!, o.marker);
          if (d < own + 16 - 1e-6) {
            bad.push(
              `S=${S} plate ${r.id}: own ${own.toFixed(2)} px, marker ${o.id} ${d.toFixed(2)} px`
            );
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('keeps every marker badge 16 px clear of every summit triangle as drawn on the compact tier', () => {
    // The badge is the marker's 28 px circle (24 px dot plus its 2 px casing).
    // At 375 marker 1 and its leader crowded Dufourspitze's triangle (Tim, 2026-11-26).
    const close: [string, number][] = [];
    for (const S of SIDES) {
      const p = layouts.get(S)!;
      if (p.tier !== 'compact') continue;
      for (const r of p.regions) {
        const centre = { x: r.marker.x + MARKER / 2, y: r.marker.y + MARKER / 2 };
        for (const s of p.summits) {
          if (pointToTriangle(centre, triangleOf(s.triangle)) - MARKER / 2 < 16 - 1e-6) {
            close.push([`${r.id} / ${s.name}`, S]);
          }
        }
      }
    }
    expect(rangesOf(close)).toEqual([]);
  });

  it('pins the summit labels with no legal place exactly in UNPLACED_SUMMIT_LABELS (A6)', () => {
    // Every (summit, S) whose label the search could not place legally,
    // collected into inclusive S ranges; an empty list means every label is
    // placed at every S.
    const found = new Map<string, [number, number][]>();
    for (const S of SIDES) {
      for (const s of layouts.get(S)!.summits) {
        if (s.placed) continue;
        const ranges = found.get(s.name) ?? [];
        const last = ranges[ranges.length - 1];
        if (last && last[1] === S - 1) last[1] = S;
        else ranges.push([S, S]);
        found.set(s.name, ranges);
      }
    }
    const measured = [...found].map(([summit, ranges]) => ({ summit, ranges }));
    expect(measured).toEqual(UNPLACED_SUMMIT_LABELS.map((p) => ({ ...p, ranges: [...p.ranges] })));
    // Markers and region plates are never pinned: only summit labels may wait for Tim.
    for (const S of SIDES) {
      for (const s of layouts.get(S)!.summits) {
        if (layouts.get(S)!.tier === 'compact') expect(s.placed).toBe(true);
      }
    }
  });
});

const at = (l: OverviewLength, S: number) => l.f * (l.axis === 'x' ? S : S * OVERVIEW_RATIO) + l.px;

describe('overviewSegments', () => {
  const segments = overviewSegments(input);

  it('covers the sweep with open ends and contiguous integer ranges', () => {
    expect(segments.length).toBeGreaterThan(1);
    expect(segments[0].minS).toBeNull();
    expect(segments[segments.length - 1].maxS).toBeNull();
    for (let i = 1; i < segments.length; i++) {
      expect(segments[i].minS).toBe((segments[i - 1].maxS as number) + 1);
    }
  });

  it('reproduces overviewLayout exactly at every width from 312 to 1100 px', () => {
    const bad: string[] = [];
    const near = (name: string, got: number, want: number) => {
      if (Math.abs(got - want) > 1e-6) bad.push(`${name} ${got} vs ${want}`);
    };
    for (const S of SIDES) {
      const seg = segments.find(
        (g) => (g.minS === null || g.minS <= S) && (g.maxS === null || S <= g.maxS)
      )!;
      const want = layouts.get(S)!;
      expect(seg.placements.tier).toBe(want.tier);
      seg.placements.regions.forEach((r, i) => {
        const w = want.regions[i];
        near(`S=${S} ${r.id} marker x`, at(r.marker.x, S), w.marker.x);
        near(`S=${S} ${r.id} marker y`, at(r.marker.y, S), w.marker.y);
        near(`S=${S} ${r.id} leader x2`, at(r.leader.x2, S), w.leader.x2);
        near(`S=${S} ${r.id} leader y2`, at(r.leader.y2, S), w.leader.y2);
        if (w.plate) {
          near(`S=${S} ${r.id} plate x`, at(r.plate!.x, S), w.plate.x);
          near(`S=${S} ${r.id} plate y`, at(r.plate!.y, S), w.plate.y);
        } else expect(r.plate).toBeNull();
      });
      seg.placements.summits.forEach((s, i) => {
        const w = want.summits[i];
        if (w.plate) {
          near(`S=${S} ${s.name} label x`, at(s.plate!.x, S), w.plate.x);
          near(`S=${S} ${s.name} label y`, at(s.plate!.y, S), w.plate.y);
        } else expect(s.plate).toBeNull();
      });
    }
    expect(bad).toEqual([]);
  });
});

describe('overviewCss', () => {
  const NAME = 'overview-sheet';
  const css = overviewCss(input, NAME);
  const segments = overviewSegments(input);

  it('emits the first segment unconditionally and one @container rule per later segment', () => {
    const lines = css.split('\n');
    expect(lines[0].startsWith('@')).toBe(false);
    const queries = lines.filter((l) =>
      /^@container overview-sheet \(min-width: \d+px\)\{$/.test(l)
    );
    expect(queries.map((q) => Number(q.match(/(\d+)px/)![1]))).toEqual(
      segments.slice(1).map((g) => g.minS)
    );
  });

  it('places with calc(<u> * 100cqw ± <px>px) and calc(<v> * 100cqh ± <px>px)', () => {
    expect(css).toMatch(/left:calc\(\d+(\.\d+)? \* 100cqw [+-] \d+(\.\d+)?px\)/);
    expect(css).toMatch(/top:calc\(\d+(\.\d+)? \* 100cqh [+-] \d+(\.\d+)?px\)/);
    expect(css).not.toMatch(/top:calc\([^)]*cqw/);
    expect(css).not.toMatch(/left:calc\([^)]*cqh/);
  });

  it('hides every plate on the compact tier', () => {
    expect(css).toContain(
      '@container overview-sheet not (min-width: 560px){[data-region-plate],[data-summit-plate]{display:none}}'
    );
  });

  /** The declarations that apply at S, by selector, from the position rules. */
  function cascade(S: number) {
    const rules = new Map<string, Record<string, string>>();
    let minS = 0;
    for (const line of css.split('\n')) {
      const query = line.match(/^@container overview-sheet \(min-width: (\d+)px\)\{$/);
      if (query) {
        minS = Number(query[1]);
        continue;
      }
      if (line === '}' || line.startsWith('@') || line.includes(':has(') || minS > S) continue;
      const open = line.indexOf('{');
      const sel = line.slice(0, open);
      const decls = rules.get(sel) ?? {};
      for (const decl of line.slice(open + 1, -1).split(';')) {
        const colon = decl.indexOf(':');
        decls[decl.slice(0, colon)] = decl.slice(colon + 1);
      }
      rules.set(sel, decls);
    }
    return rules;
  }

  function lengthAt(value: string, S: number): number {
    const plain = value.match(/^(-?\d+(?:\.\d+)?)px$/);
    if (plain) return Number(plain[1]);
    const calc = value.match(/^calc\((-?\d+(?:\.\d+)?) \* 100cq([wh]) ([+-]) (\d+(?:\.\d+)?)px\)$/);
    if (!calc) throw new Error(`unexpected length ${value}`);
    const base = calc[2] === 'w' ? S : S * OVERVIEW_RATIO;
    return Number(calc[1]) * base + (calc[3] === '-' ? -1 : 1) * Number(calc[4]);
  }

  it('cascades to overviewLayout at every width from 312 to 1100 px, within 0.5 px', () => {
    const bad: string[] = [];
    const near = (name: string, got: number, want: number) => {
      if (Math.abs(got - want) > 0.5) bad.push(`${name} ${got.toFixed(2)} vs ${want.toFixed(2)}`);
    };
    for (const S of SIDES) {
      const rules = cascade(S);
      const want = layouts.get(S)!;
      for (const r of want.regions) {
        const sel = `[data-region-marker="${r.id}"]`;
        const m = rules.get(sel)!;
        const mx = lengthAt(m.left, S);
        const my = lengthAt(m.top, S);
        near(`S=${S} ${r.id} marker left`, mx, r.marker.x);
        near(`S=${S} ${r.id} marker top`, my, r.marker.y);
        const lead = rules.get(`${sel} [data-region-leader]`)!;
        const x0 = mx + lengthAt(lead.left, S);
        const y0 = my + lengthAt(lead.top, S);
        const w = lengthAt(lead.width, S);
        const h = lengthAt(lead.height, S);
        expect(w).toBeGreaterThanOrEqual(-0.5);
        expect(h).toBeGreaterThanOrEqual(-0.5);
        const ends =
          lead.transform === 'none' ? [x0, y0, x0 + w, y0 + h] : [x0 + w, y0, x0, y0 + h];
        const { x1, y1, x2, y2 } = r.leader;
        const off = (pts: number[]) => Math.max(...pts.map((v, i) => Math.abs(v - ends[i])));
        if (Math.min(off([x1, y1, x2, y2]), off([x2, y2, x1, y1])) > 0.5) {
          bad.push(`S=${S} ${r.id} leader`);
        }
        if (r.plate) {
          const plate = rules.get(`${sel} [data-region-plate]`)!;
          near(`S=${S} ${r.id} plate left`, mx + lengthAt(plate.left, S), r.plate.x);
          near(`S=${S} ${r.id} plate top`, my + lengthAt(plate.top, S), r.plate.y);
        }
      }
      for (const s of want.summits) {
        const key = summitKey(s.name);
        const mark = rules.get(`[data-summit-mark="${key}"]`)!;
        near(`S=${S} ${s.name} triangle left`, lengthAt(mark.left, S), s.triangle.x);
        near(`S=${S} ${s.name} triangle top`, lengthAt(mark.top, S), s.triangle.y);
        if (s.plate) {
          const label = rules.get(`[data-summit-plate="${key}"]`)!;
          near(`S=${S} ${s.name} label left`, lengthAt(label.left, S), s.plate.x);
          near(`S=${S} ${s.name} label top`, lengthAt(label.top, S), s.plate.y);
          near(`S=${S} ${s.name} label width`, lengthAt(label.width, S), s.plate.width);
          near(`S=${S} ${s.name} label height`, lengthAt(label.height, S), s.plate.height);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('repeats a rule in a later segment only when it changes', () => {
    const current = new Map<string, string>();
    for (const line of css.split('\n')) {
      if (line === '}' || line.startsWith('@') || line.includes(':has(')) continue;
      const sel = line.slice(0, line.indexOf('{'));
      expect(current.get(sel)).not.toBe(line);
      current.set(sel, line);
    }
  });

  it('emits the list-map :has() sync selectors for every region (Pattern 3)', () => {
    const lines = css.split('\n');
    for (const r of input.regions) {
      const row = `[data-region-row="${r.id}"]`;
      const marker = `[data-region-marker="${r.id}"]`;
      // One :has() per state (18-23; the plate sync's 2325d0a fix): WebKit does not
      // restyle on a :hover nested in :is() inside :has().
      const rowHover = `[data-overview]:has(${row}:hover)`;
      const rowFocus = `[data-overview]:has(${row}:focus-visible)`;
      const markerActive = `[data-overview]:has(${marker}:hover)`;
      const rule = (target: string) =>
        lines.find((l) =>
          l.startsWith(`${rowHover} ${target},${rowFocus} ${target},${markerActive} ${target}{`)
        );
      const markerRule = (target: string) =>
        lines.find((l) => l.startsWith(`${markerActive} ${target}{`));
      // Row hover or focus-visible, and marker hover: the marker dot, rectangle and plate.
      expect(rule(`${marker} [data-region-dot]`)).toMatch(
        /\{background-color:var\(--color-accent\);color:var\(--color-ink-inverse\)\}$/
      );
      expect(rule(`[data-region-rect="${r.id}"]`)).toMatch(/\{stroke:var\(--color-accent\)\}$/);
      expect(rule(`${marker} [data-region-plate]`)).toMatch(
        /\{--tw-ring-color:var\(--color-ink-muted\)\}$/
      );
      // Marker hover mirrors onto the row: fill, accent bar and badge.
      expect(css).toContain(`${markerActive} ${row}{`);
      // The row draws its bar at rest with before:opacity-0 (RegionList), so the rule shows it.
      expect(markerRule(`${row}::before`)).toMatch(
        /background-color:var\(--color-accent\);opacity:1\}$/
      );
      expect(css).toContain(`${markerActive} ${row} [data-region-badge]{`);
    }
    expect(css).toContain('var(--color-accent)');
    // WebKit (Safari and Playwright's WebKit) matches :has(x:is(:hover, …)) but never
    // restyles the elements it selects when the hover changes, so no :has() argument
    // may nest a state pseudo-class in :is() or :where() (18-14 deferred item, closed in 18-23).
    expect(css).not.toMatch(/:has\([^)]*:(?:is|where)\(/);
  });

  it('is built only from numbers, the region ids, the summit keys and fixed selectors (T-18-30)', () => {
    let rest = css;
    for (const r of input.regions) rest = rest.split(`"${r.id}"`).join('""');
    for (const s of input.summits) rest = rest.split(`"${summitKey(s.name)}"`).join('""');
    expect(rest).not.toMatch(/[a-z]+"/);
    expect(rest).not.toMatch(/[<>\\]/);
  });

  it('throws a RangeError for an id or a container name outside the slug pattern', () => {
    const bad = (id: string): OverviewInput => ({
      ...input,
      regions: input.regions.map((r, i) => (i === 0 ? { ...r, id } : r)),
    });
    expect(() => overviewCss(bad('x"]{}'), NAME)).toThrow(RangeError);
    expect(() => overviewCss(bad('Zermatt'), NAME)).toThrow(RangeError);
    expect(() => overviewCss(bad('zer--matt'), NAME)).toThrow(RangeError);
    expect(() => overviewCss(input, 'sheet{}')).toThrow(RangeError);
  });

  it('keys summits by a slug of their name', () => {
    expect(summitKey('Mont Blanc')).toBe('mont-blanc');
    expect(summitKey('Grossglockner')).toBe('grossglockner');
    expect(input.summits.map((s) => summitKey(s.name))).toEqual([
      'dufourspitze',
      'mont-blanc',
      'grossglockner',
      'zugspitze',
      'triglav',
    ]);
  });
});
