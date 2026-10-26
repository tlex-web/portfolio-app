/**
 * The map label layout (PHOTO-01, PHOTO-03; D-02, D-04; 10-UI-SPEC "Label
 * layout (deterministic, server-rendered, D-02 / D-04)"; 10-RESEARCH
 * Pattern 6).
 *
 * The UI-SPEC measured a sweep of every integer sheet side from 312 to 1100 px
 * with the fixed plate boxes; this file repeats it against the real four
 * waypoints and the summit, then checks that the CSS segments the server
 * emits reproduce the same layout at every side, so the server HTML is exact
 * without a client relayout.
 */
import { terrain } from '@/data/generated/terrain';
import {
  COMPACT_MAX_S,
  DOT,
  DOT_CLEAR,
  GAP,
  INSET,
  PLATE_COMPACT,
  PLATE_WIDE,
  SUMMIT_PLATE,
  SWEEP_MAX_S,
  SWEEP_MIN_S,
  layoutMapMarks,
  mapMarkCss,
  mapMarkSegments,
  stack1D,
  type Linear,
  type MapMark,
  type Rect,
} from '@/lib/photos/label-layout';
import { photoViews } from '@/lib/photos/view-model';

const marks: MapMark[] = photoViews.map((v) => ({ slug: v.slug, u: v.uv.u, v: v.uv.v }));
const summitUv = terrain.summit.uv;

/** Every integer sheet side from 312 to 1100 px. */
const SIDES = Array.from({ length: 1100 - 312 + 1 }, (_, i) => 312 + i);

const right = (r: Rect) => r.x + r.width;
const bottom = (r: Rect) => r.y + r.height;

/** The smallest axis gap between two boxes (negative or zero when they overlap on both axes). */
function gapBetween(a: Rect, b: Rect): number {
  const gx = Math.max(b.x - right(a), a.x - right(b));
  const gy = Math.max(b.y - bottom(a), a.y - bottom(b));
  return Math.max(gx, gy);
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < right(b) && b.x < right(a) && a.y < bottom(b) && b.y < bottom(a);
}

/** The dot as the plates must clear it: 12 px plus its 2 px casing on each side (DOT_CLEAR = 4). */
function dotBox(p: { x: number; y: number }): Rect {
  const side = DOT + DOT_CLEAR;
  return { x: p.x - side / 2, y: p.y - side / 2, width: side, height: side };
}

/** The summit triangle: 12 px, its base centre on the anchor. */
function summitTriangle(p: { x: number; y: number }): Rect {
  return { x: p.x - 6, y: p.y - 12, width: 12, height: 12 };
}

/** Whether a segment passes through a box's interior (Liang-Barsky clip, 0.01 px tolerance). */
function segmentCrosses(s: { x1: number; y1: number; x2: number; y2: number }, r: Rect): boolean {
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

const at = (l: Linear, s: number) => l.frac * s + l.px;

describe('constants', () => {
  it('declares the UI-SPEC boxes, insets and sweep range', () => {
    expect(PLATE_WIDE).toEqual({ w: 240, h: 48 });
    expect(PLATE_COMPACT).toEqual({ w: 144, h: 68 });
    expect(SUMMIT_PLATE).toEqual({ w: 93, h: 48 });
    expect([INSET, GAP, DOT, DOT_CLEAR]).toEqual([8, 8, 12, 4]);
    expect(COMPACT_MAX_S).toBe(559);
    expect([SWEEP_MIN_S, SWEEP_MAX_S]).toEqual([312, 1100]);
  });

  it('is written for exactly four photographs (a fifth forces a layout revision)', () => {
    expect(photoViews).toHaveLength(4);
  });
});

describe('layoutMapMarks sweep, sheet sides 312-1100 px', () => {
  it('keeps the tiers: compact up to 559 px, wide from 560 px', () => {
    for (const S of SIDES) {
      expect([S, layoutMapMarks(S, marks, summitUv).tier]).toEqual([
        S,
        S <= COMPACT_MAX_S ? 'compact' : 'wide',
      ]);
    }
  });

  it('keeps at least 8 px between any two plates', () => {
    const bad: string[] = [];
    for (const S of SIDES) {
      const { marks: placed } = layoutMapMarks(S, marks, summitUv);
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const g = gapBetween(placed[i].plate, placed[j].plate);
          if (g < GAP - 1e-6) bad.push(`S=${S} ${i + 1}/${j + 1} gap ${g.toFixed(2)}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('puts no plate over a dot, the summit mark or the summit plate', () => {
    const bad: string[] = [];
    for (const S of SIDES) {
      const layout = layoutMapMarks(S, marks, summitUv);
      const obstacles: [string, Rect][] = [
        ...layout.marks.map((m, i): [string, Rect] => [`dot ${i + 1}`, dotBox(m.dot)]),
        ['summit mark', summitTriangle(layout.summit.mark)],
        ['summit plate', layout.summit.plate],
      ];
      layout.marks.forEach((m, i) => {
        for (const [name, box] of obstacles) {
          if (intersects(m.plate, box)) bad.push(`S=${S} plate ${i + 1} over ${name}`);
        }
      });
    }
    expect(bad).toEqual([]);
  });

  it('draws no leader across another plate', () => {
    const bad: string[] = [];
    for (const S of SIDES) {
      const { marks: placed } = layoutMapMarks(S, marks, summitUv);
      placed.forEach((m, i) => {
        placed.forEach((other, j) => {
          if (i !== j && segmentCrosses(m.leader, other.plate)) {
            bad.push(`S=${S} leader ${i + 1} across plate ${j + 1}`);
          }
        });
      });
    }
    expect(bad).toEqual([]);
  });

  it('keeps every plate and the summit plate at least 8 px inside the sheet', () => {
    const bad: string[] = [];
    for (const S of SIDES) {
      const layout = layoutMapMarks(S, marks, summitUv);
      const plates = [...layout.marks.map((m) => m.plate), layout.summit.plate];
      plates.forEach((p, i) => {
        const inside =
          p.x >= INSET - 1e-6 &&
          p.y >= INSET - 1e-6 &&
          right(p) <= S - INSET + 1e-6 &&
          bottom(p) <= S - INSET + 1e-6;
        if (!inside) bad.push(`S=${S} plate ${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });

  it('reads top to bottom, then left to right, in altitude order', () => {
    for (const S of SIDES) {
      const { marks: placed } = layoutMapMarks(S, marks, summitUv);
      const visual = [...placed]
        .sort((a, b) => a.plate.y - b.plate.y || a.plate.x - b.plate.x)
        .map((m) => m.slug);
      expect([S, visual]).toEqual([S, marks.map((m) => m.slug)]);
    }
  });

  it('places each dot at u x S, v x S and keeps the input (altitude, then id) order', () => {
    for (const S of [312, 375, 559, 560, 660, 1100]) {
      const { marks: placed } = layoutMapMarks(S, marks, summitUv);
      expect(placed.map((m) => m.slug)).toEqual(marks.map((m) => m.slug));
      placed.forEach((m, i) => {
        expect(m.dot.x).toBeCloseTo(marks[i].u * S, 6);
        expect(m.dot.y).toBeCloseTo(marks[i].v * S, 6);
      });
    }
  });
});

describe('plate boxes and slots', () => {
  it('uses 144 x 68 compact plates in the four UI-SPEC slots', () => {
    for (const S of SIDES.filter((s) => s <= COMPACT_MAX_S)) {
      const [p1, p2, p3, p4] = layoutMapMarks(S, marks, summitUv).marks;
      for (const m of [p1, p2, p3, p4]) {
        expect([m.plate.width, m.plate.height]).toEqual([144, 68]);
      }
      expect(p1.plate.y).toBe(8);
      expect(bottom(p3.plate)).toBe(S - 8);
      expect(bottom(p4.plate)).toBe(S - 8);
      expect(right(p2.plate)).toBeCloseTo(p2.dot.x - 20, 6);
    }
  });

  it('uses 240 x 48 wide plates beside their dots', () => {
    for (const S of SIDES.filter((s) => s > COMPACT_MAX_S)) {
      for (const m of layoutMapMarks(S, marks, summitUv).marks) {
        expect([m.plate.width, m.plate.height]).toEqual([240, 48]);
        const besideRight = Math.abs(m.plate.x - (m.dot.x + 12)) < 1e-6;
        const besideLeft = Math.abs(right(m.plate) - (m.dot.x - 12)) < 1e-6;
        expect(besideRight || besideLeft).toBe(true);
      }
    }
  });

  it('puts the summit plate 8 px right of the triangle, centred on it', () => {
    for (const S of [312, 560, 1100]) {
      const { summit } = layoutMapMarks(S, marks, summitUv);
      expect(summit.mark.x).toBeCloseTo(summitUv.u * S, 6);
      expect(summit.mark.y).toBeCloseTo(summitUv.v * S, 6);
      expect(summit.plate.x).toBeCloseTo(summit.mark.x + 6 + 8, 6);
      expect(summit.plate.y + summit.plate.height / 2).toBeCloseTo(summit.mark.y - 6, 6);
      expect([summit.plate.width, summit.plate.height]).toEqual([93, 48]);
    }
  });

  it('starts every leader on its own plate edge, 8 px or more from the corners, and ends it on the dot centre', () => {
    const bad: string[] = [];
    for (const S of SIDES) {
      layoutMapMarks(S, marks, summitUv).marks.forEach((m, i) => {
        const { plate: p, leader: l, dot } = m;
        if (Math.abs(l.x2 - dot.x) > 1e-6 || Math.abs(l.y2 - dot.y) > 1e-6) {
          bad.push(`S=${S} leader ${i + 1} misses its dot`);
        }
        const onVertical =
          (Math.abs(l.x1 - p.x) < 1e-6 || Math.abs(l.x1 - right(p)) < 1e-6) &&
          l.y1 >= p.y + 8 - 1e-6 &&
          l.y1 <= bottom(p) - 8 + 1e-6;
        const onHorizontal =
          (Math.abs(l.y1 - p.y) < 1e-6 || Math.abs(l.y1 - bottom(p)) < 1e-6) &&
          l.x1 >= p.x + 8 - 1e-6 &&
          l.x1 <= right(p) - 8 + 1e-6;
        if (!onVertical && !onHorizontal) bad.push(`S=${S} leader ${i + 1} start`);
      });
    }
    expect(bad).toEqual([]);
  });

  it('shows the preview below a plate whose top is within 120 px of the sheet top, else above', () => {
    for (const S of [312, 560, 660, 1100]) {
      for (const m of layoutMapMarks(S, marks, summitUv).marks) {
        expect(m.preview).toBe(m.plate.y < 120 ? 'below' : 'above');
      }
    }
  });
});

describe('mark counts', () => {
  const five: MapMark[] = [...marks, { slug: 'fifth-photo', u: 0.3, v: 0.2 }];

  it('rejects any count but four on the compact tier, naming the four-waypoint template', () => {
    expect(() => layoutMapMarks(375, five, summitUv)).toThrow(RangeError);
    expect(() => layoutMapMarks(375, five, summitUv)).toThrow(/four-waypoint template/);
    expect(() => layoutMapMarks(375, marks.slice(0, 3), summitUv)).toThrow(RangeError);
  });

  it('accepts any count on the wide tier', () => {
    expect(layoutMapMarks(800, five, summitUv).marks).toHaveLength(5);
    expect(layoutMapMarks(800, marks.slice(0, 1), summitUv).marks).toHaveLength(1);
  });
});

describe('mapMarkSegments', () => {
  let segments: ReturnType<typeof mapMarkSegments> = [];
  beforeAll(() => {
    segments = mapMarkSegments(marks, summitUv);
  });

  it('covers the sweep with open ends and contiguous integer ranges', () => {
    expect(segments.length).toBeGreaterThan(1);
    expect(segments[0].minS).toBeNull();
    expect(segments[segments.length - 1].maxS).toBeNull();
    for (let i = 1; i < segments.length; i++) {
      const prevMax = segments[i - 1].maxS;
      expect(prevMax).not.toBeNull();
      expect(segments[i].minS).toBe((prevMax as number) + 1);
    }
  });

  it('reproduces layoutMapMarks within 0.5 px at every side from 312 to 1100 px', () => {
    const bad: string[] = [];
    const near = (name: string, S: number, l: Linear, v: number) => {
      if (Math.abs(at(l, S) - v) > 0.5) bad.push(`S=${S} ${name} ${at(l, S)} vs ${v}`);
    };
    for (const S of SIDES) {
      const seg = segments.find(
        (s) => (s.minS === null || S >= s.minS) && (s.maxS === null || S <= s.maxS)
      );
      expect(seg).toBeDefined();
      const want = layoutMapMarks(S, marks, summitUv);
      const got = seg!.placements;
      expect([S, got.tier]).toEqual([S, want.tier]);
      want.marks.forEach((m, i) => {
        const g = got.marks[i];
        expect(g.slug).toBe(m.slug);
        expect([S, g.preview]).toEqual([S, m.preview]);
        near(`plate x ${i}`, S, g.plate.x, m.plate.x);
        near(`plate y ${i}`, S, g.plate.y, m.plate.y);
        near(`plate w ${i}`, S, g.plate.width, m.plate.width);
        near(`plate h ${i}`, S, g.plate.height, m.plate.height);
        near(`dot x ${i}`, S, g.dot.x, m.dot.x);
        near(`dot y ${i}`, S, g.dot.y, m.dot.y);
        near(`leader x1 ${i}`, S, g.leader.x1, m.leader.x1);
        near(`leader y1 ${i}`, S, g.leader.y1, m.leader.y1);
        near(`leader x2 ${i}`, S, g.leader.x2, m.leader.x2);
        near(`leader y2 ${i}`, S, g.leader.y2, m.leader.y2);
      });
      near('summit x', S, got.summit.mark.x, want.summit.mark.x);
      near('summit y', S, got.summit.mark.y, want.summit.mark.y);
      near('summit plate x', S, got.summit.plate.x, want.summit.plate.x);
      near('summit plate y', S, got.summit.plate.y, want.summit.plate.y);
    }
    expect(bad).toEqual([]);
  });
});

describe('mapMarkCss', () => {
  let css = '';
  let segments: ReturnType<typeof mapMarkSegments> = [];
  beforeAll(() => {
    css = mapMarkCss(marks, summitUv);
    segments = mapMarkSegments(marks, summitUv);
  });

  it('has one @container rule per segment boundary on the map-sheet container', () => {
    const rules = css.match(/@container/g) ?? [];
    expect(rules).toHaveLength(segments.length - 1);
    expect(css.match(/@container map-sheet \(min-width: \d+px\)/g)).toHaveLength(
      segments.length - 1
    );
    expect(css).toContain('100cqw');
  });

  it('is built only from numbers, the four slugs and fixed selectors (T-10-18)', () => {
    expect(css).not.toMatch(/NaN|Infinity|undefined/);
    let rest = css;
    for (const m of marks) rest = rest.split(m.slug).join('');
    // What is left: selectors, property names, calc() lengths and the scale flip.
    expect(rest).toMatch(/^[a-z0-9 \n{}[\]="():;.,*+\-%@]*$/);
    for (const word of rest.match(/[a-z][a-z-]*/g) ?? []) {
      expect([
        'data',
        'map',
        'mark',
        'dot',
        'leader',
        'preview',
        'summit',
        'plate',
        'container',
        'sheet',
        'min-width',
        'left',
        'top',
        'bottom',
        'width',
        'height',
        'transform',
        'scale',
        'calc',
        'cqw',
        'px',
        'auto',
        'none',
        'data-map-mark',
        'data-map-dot',
        'data-map-leader',
        'data-map-preview',
        'data-summit-plate',
        'map-sheet',
      ]).toContain(word);
    }
  });

  it('places the plates with calc(<fraction> * 100cqw + <n>px) lengths', () => {
    expect(css).toMatch(/left:calc\(-?\d+(\.\d+)? \* 100cqw [+-] \d+(\.\d+)?px\)/);
    for (const m of marks) expect(css).toContain(`[data-map-mark="${m.slug}"]`);
    expect(css).toContain('[data-summit-plate]');
  });

  it('cascades to the layout at every side from 312 to 1100 px, within 0.5 px', () => {
    const lengthAt = (value: string, S: number): number => {
      const plain = value.match(/^(-?\d+(?:\.\d+)?)px$/);
      if (plain) return Number(plain[1]);
      const calc = value.match(/^calc\((-?\d+(?:\.\d+)?) \* 100cqw ([+-]) (\d+(?:\.\d+)?)px\)$/);
      if (!calc) throw new Error(`unexpected length ${value}`);
      return Number(calc[1]) * S + (calc[2] === '-' ? -1 : 1) * Number(calc[3]);
    };
    const cascade = (S: number) => {
      const rules = new Map<string, Record<string, string>>();
      let minS = 0;
      for (const line of css.split('\n')) {
        const query = line.match(/^@container map-sheet \(min-width: (\d+)px\)\{$/);
        if (query) {
          minS = Number(query[1]);
          continue;
        }
        if (line === '}' || line === '' || minS > S) continue;
        const open = line.indexOf('{');
        const decls = rules.get(line.slice(0, open)) ?? {};
        for (const decl of line.slice(open + 1, -1).split(';')) {
          const colon = decl.indexOf(':');
          decls[decl.slice(0, colon)] = decl.slice(colon + 1);
        }
        rules.set(line.slice(0, open), decls);
      }
      return rules;
    };
    const bad: string[] = [];
    const near = (name: string, got: number, want: number) => {
      if (Math.abs(got - want) > 0.5) bad.push(`${name} ${got.toFixed(2)} vs ${want.toFixed(2)}`);
    };
    for (const S of SIDES) {
      const rules = cascade(S);
      const want = layoutMapMarks(S, marks, summitUv);
      for (const m of want.marks) {
        const sel = `[data-map-mark="${m.slug}"]`;
        const plate = rules.get(sel)!;
        const px = lengthAt(plate.left, S);
        const py = lengthAt(plate.top, S);
        near(`S=${S} ${m.slug} left`, px, m.plate.x);
        near(`S=${S} ${m.slug} top`, py, m.plate.y);
        const dot = rules.get(`${sel} [data-map-dot]`)!;
        near(`S=${S} ${m.slug} dot x`, px + lengthAt(dot.left, S), m.dot.x);
        near(`S=${S} ${m.slug} dot y`, py + lengthAt(dot.top, S), m.dot.y);
        const lead = rules.get(`${sel} [data-map-leader]`)!;
        const x0 = px + lengthAt(lead.left, S);
        const y0 = py + lengthAt(lead.top, S);
        const w = lengthAt(lead.width, S);
        const h = lengthAt(lead.height, S);
        expect(w).toBeGreaterThanOrEqual(-0.5);
        expect(h).toBeGreaterThanOrEqual(-0.5);
        // Unflipped, the line runs top-left to bottom-right; flipped, top-right to bottom-left.
        const ends =
          lead.transform === 'none' ? [x0, y0, x0 + w, y0 + h] : [x0 + w, y0, x0, y0 + h];
        const { x1, y1, x2, y2 } = m.leader;
        const forward = [x1, y1, x2, y2];
        const backward = [x2, y2, x1, y1];
        const off = (pts: number[]) => Math.max(...pts.map((v, i) => Math.abs(v - ends[i])));
        if (Math.min(off(forward), off(backward)) > 0.5) bad.push(`S=${S} ${m.slug} leader`);
        const preview = rules.get(`${sel} [data-map-preview]`)!;
        expect(preview.top === 'auto' ? 'above' : 'below').toBe(m.preview);
      }
      const summit = rules.get('[data-summit-plate]')!;
      near(`S=${S} summit left`, lengthAt(summit.left, S), want.summit.plate.x);
      near(`S=${S} summit top`, lengthAt(summit.top, S), want.summit.plate.y);
    }
    expect(bad).toEqual([]);
  });

  it('refuses a slug that is not lowercase letters, digits and hyphens', () => {
    expect(() =>
      mapMarkCss([...marks.slice(0, 3), { slug: 'x"]{}', u: 0.5, v: 0.5 }], summitUv)
    ).toThrow(RangeError);
  });
});

describe('stack1D', () => {
  it('centres, then pushes down to clear the previous item by the gap', () => {
    expect(
      stack1D(
        [
          { anchor: 100, size: 48 },
          { anchor: 105, size: 48 },
        ],
        8,
        400,
        8
      )
    ).toEqual([76, 132]);
  });

  it('pushes an overflowing stack up from the bottom', () => {
    expect(
      stack1D(
        [
          { anchor: 380, size: 48 },
          { anchor: 390, size: 48 },
        ],
        8,
        400,
        8
      )
    ).toEqual([296, 352]);
  });

  it('centres a single item on its anchor and keeps it inside the bounds', () => {
    expect(stack1D([{ anchor: 200, size: 48 }], 8, 400, 8)).toEqual([176]);
    expect(stack1D([{ anchor: 10, size: 48 }], 8, 400, 8)).toEqual([8]);
  });
});
