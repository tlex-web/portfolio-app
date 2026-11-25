/**
 * @jest-environment node
 */
/**
 * The region plate's photo pins (REGION-02; 18-UI-SPEC Contract 2 "Facts and
 * plate"; 18-RESEARCH Pattern 2, Pitfall 9).
 *
 * The UI-SPEC gate: a SWEEP of every integer sheet side S from 320 to 634 px
 * with every region's real pins (platePins over regionPhotoViews; the uv are
 * read at run time, no position is written here, 16 D-25). At every S each
 * pin has one 24 px badge numbered with its place in the ascent; no two badge
 * boxes overlap or come closer than 8 px; every badge stays 8 px inside the
 * sheet; a badge unit that is not centred on its dot is displaced with a
 * leader that ends exactly at its dot; no badge covers another pin's dot, and
 * no leader crosses another badge. plateSegments and plateCss must reproduce
 * the layout at every S.
 *
 * The rules for the data that makes them hard: photos at one spot
 * (Zermatt's img-0680 and img-0682) share one dot with their badges side by
 * side; Saalfelden's two aerial photos (a few px apart at every S) and
 * Zermatt's img-0605/img-0629 pair (closer than 24 + 8 px at 320-375) are
 * displaced; a per-region count guard fails when a region's pin count changes,
 * forcing a re-sweep; plateCss refuses a slug or container name outside the
 * slug pattern (T-18-23).
 */
import { regionPhotoViews, regions } from '@/lib/regions';
import {
  BADGE,
  DOT,
  DOT_CASING,
  GAP,
  INSET,
  LEADER_STEPS,
  PLATE_SWEEP_MAX_S,
  PLATE_SWEEP_MIN_S,
  SAME_SPOT_PX,
  plateCss,
  plateGroups,
  plateLayout,
  platePins,
  plateSegments,
  type PlateBox,
  type PlateLength,
  type PlatePin,
  type PlatePlacement,
} from '@/lib/photos/plate-layout';

/** Every integer sheet side of the sweep. */
const SWEEP = Array.from(
  { length: PLATE_SWEEP_MAX_S - PLATE_SWEEP_MIN_S + 1 },
  (_, i) => PLATE_SWEEP_MIN_S + i
);

const PINS: ReadonlyMap<string, PlatePin[]> = new Map(
  regions.map((r) => [r.id, platePins(regionPhotoViews(r.id))])
);

const LAYOUTS: ReadonlyMap<string, ReadonlyMap<number, PlatePlacement>> = new Map(
  regions.map((r) => [
    r.id,
    new Map(SWEEP.map((S) => [S, plateLayout(PINS.get(r.id)!, S)] as const)),
  ])
);

const right = (r: PlateBox) => r.x + r.width;
const bottom = (r: PlateBox) => r.y + r.height;

/** The clear distance between two boxes: the largest axis gap (negative when they overlap). */
const gapOf = (a: PlateBox, b: PlateBox) =>
  Math.max(b.x - right(a), a.x - right(b), b.y - bottom(a), a.y - bottom(b));

/** Whether a segment passes through a box's interior (Liang-Barsky clip, 0.01 px tolerance). */
function segmentCrosses(
  s: { x1: number; y1: number; x2: number; y2: number },
  r: PlateBox
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

/** The dot with its casing, as a box. */
const dotBox = (d: { x: number; y: number }): PlateBox => {
  const side = DOT + 2 * DOT_CASING;
  return { x: d.x - side / 2, y: d.y - side / 2, width: side, height: side };
};

/** Every (region, S, layout) of the sweep. */
function* sweep() {
  for (const r of regions) {
    for (const S of SWEEP) yield { id: r.id, S, layout: LAYOUTS.get(r.id)!.get(S)! };
  }
}

const at = (l: PlateLength, S: number) => l.f * S + l.px;

describe('constants', () => {
  it('declares the UI-SPEC badge, dot, gap, inset and sweep range', () => {
    expect(BADGE).toBe(24);
    expect(DOT).toBe(8);
    expect(DOT_CASING).toBe(2);
    expect(GAP).toBe(8);
    expect(INSET).toBe(8);
    expect(PLATE_SWEEP_MIN_S).toBe(320);
    expect(PLATE_SWEEP_MAX_S).toBe(634);
    expect([...LEADER_STEPS]).toEqual([12, 20, 28, 40]);
  });
});

describe('platePins', () => {
  it('numbers every region photo 1..N in the sequence order, with its stored uv and precision', () => {
    for (const r of regions) {
      const views = regionPhotoViews(r.id);
      const pins = PINS.get(r.id)!;
      expect(pins.map((p) => p.slug)).toEqual(views.map((v) => v.slug));
      expect(pins.map((p) => p.n)).toEqual(views.map((_, i) => i + 1));
      pins.forEach((p, i) => {
        expect(p.u).toBe(views[i].uv.u);
        expect(p.v).toBe(views[i].uv.v);
        expect(p.approximate).toBe(views[i].approximate);
      });
    }
  });

  it('gives a photo without a position no pin and keeps the others numbered by sequence place (UI E4/partial)', () => {
    const pins = platePins([
      { slug: 'a', approximate: false, uv: { u: 0.25, v: 0.25 } },
      { slug: 'b', approximate: false, uv: null },
      { slug: 'c', approximate: true, uv: { u: 0.75, v: 0.75 } },
    ]);
    expect(pins).toEqual([
      { slug: 'a', n: 1, u: 0.25, v: 0.25, approximate: false },
      { slug: 'c', n: 3, u: 0.75, v: 0.75, approximate: true },
    ]);
  });
});

describe(`plateLayout SWEEP, sheet sides ${PLATE_SWEEP_MIN_S}-${PLATE_SWEEP_MAX_S} px (UI E4/populated)`, () => {
  it('gives every pin one 24 px badge with its number, and places every group', () => {
    const bad: string[] = [];
    for (const { id, S, layout } of sweep()) {
      const pins = PINS.get(id)!;
      const badges = layout.groups.flatMap((g) => g.badges);
      // Every region photo has a stored position today, so every one has a badge.
      const views = regionPhotoViews(id);
      if (badges.length !== views.length) bad.push(`${id} S=${S}: ${badges.length} badges`);
      for (const p of pins) {
        const b = badges.find((x) => x.slug === p.slug);
        if (!b || b.n !== p.n) bad.push(`${id} S=${S} ${p.slug}: badge ${b?.n}`);
        else if (b.box.width !== BADGE || b.box.height !== BADGE) bad.push(`${id} ${p.slug} size`);
      }
      for (const g of layout.groups) if (!g.placed) bad.push(`${id} S=${S} ${g.key} not placed`);
    }
    expect(bad).toEqual([]);
  });

  it('puts every dot exactly at its pin uv x S', () => {
    const bad: string[] = [];
    for (const { id, S, layout } of sweep()) {
      const pins = PINS.get(id)!;
      for (const g of layout.groups) {
        const p = pins.find((x) => x.slug === g.key)!;
        if (Math.abs(g.dot.x - p.u * S) > 1e-9 || Math.abs(g.dot.y - p.v * S) > 1e-9) {
          bad.push(`${id} S=${S} ${g.key}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('keeps at least 8 px between any two badges (none overlap)', () => {
    const bad: string[] = [];
    for (const { id, S, layout } of sweep()) {
      const badges = layout.groups.flatMap((g) => g.badges);
      for (let i = 0; i < badges.length; i++) {
        for (let j = i + 1; j < badges.length; j++) {
          const d = gapOf(badges[i].box, badges[j].box);
          if (d < GAP - 1e-6) bad.push(`${id} S=${S} ${badges[i].slug}/${badges[j].slug} ${d}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('keeps every badge at least 8 px inside the sheet (UI E4/overflow)', () => {
    const bad: string[] = [];
    for (const { id, S, layout } of sweep()) {
      for (const b of layout.groups.flatMap((g) => g.badges)) {
        const { x, y } = b.box;
        if (
          x < INSET - 1e-6 ||
          y < INSET - 1e-6 ||
          right(b.box) > S - INSET + 1e-6 ||
          bottom(b.box) > S - INSET + 1e-6
        ) {
          bad.push(`${id} S=${S} ${b.slug}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('centres an undisplaced unit on its dot; a displaced one has a leader from its centre to the exact dot', () => {
    const bad: string[] = [];
    for (const { id, S, layout } of sweep()) {
      for (const g of layout.groups) {
        const cx = g.unit.x + g.unit.width / 2;
        const cy = g.unit.y + g.unit.height / 2;
        if (g.leader === null) {
          if (Math.abs(cx - g.dot.x) > 1e-9 || Math.abs(cy - g.dot.y) > 1e-9) {
            bad.push(`${id} S=${S} ${g.key}: not centred and no leader`);
          }
        } else {
          const { x1, y1, x2, y2 } = g.leader;
          if (x2 !== g.dot.x || y2 !== g.dot.y) bad.push(`${id} S=${S} ${g.key}: leader end`);
          if (Math.abs(x1 - cx) > 1e-9 || Math.abs(y1 - cy) > 1e-9) {
            bad.push(`${id} S=${S} ${g.key}: leader start`);
          }
          // The dot (with its casing) stays clear of its own displaced badges.
          if (g.badges.some((b) => gapOf(b.box, dotBox(g.dot)) < 0)) {
            bad.push(`${id} S=${S} ${g.key}: displaced badge over its own dot`);
          }
        }
        // Side by side: equal tops, GAP apart, inside the unit box.
        g.badges.forEach((b, i) => {
          if (b.box.x !== g.unit.x + i * (BADGE + GAP) || b.box.y !== g.unit.y) {
            bad.push(`${id} S=${S} ${b.slug}: not in its unit row`);
          }
        });
      }
    }
    expect(bad).toEqual([]);
  });

  it('displaces every badge closer than 24 + 8 px to another pin (Pitfall 9: near, not only identical)', () => {
    const bad: string[] = [];
    for (const { id, S, layout } of sweep()) {
      const groups = layout.groups;
      for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          const a = groups[i];
          const b = groups[j];
          const near =
            Math.abs(a.dot.x - b.dot.x) < (a.unit.width + b.unit.width) / 2 + GAP &&
            Math.abs(a.dot.y - b.dot.y) < BADGE + GAP;
          if (near && a.leader === null && b.leader === null)
            bad.push(`${id} S=${S} ${a.key}/${b.key}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("covers no other pin's dot with a badge", () => {
    const bad: string[] = [];
    for (const { id, S, layout } of sweep()) {
      for (const g of layout.groups) {
        for (const h of layout.groups) {
          if (h === g) continue;
          for (const b of g.badges) {
            if (gapOf(b.box, dotBox(h.dot)) < 0) bad.push(`${id} S=${S} ${b.slug} over ${h.key}`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('draws no leader across another badge', () => {
    const bad: string[] = [];
    for (const { id, S, layout } of sweep()) {
      for (const g of layout.groups) {
        if (!g.leader) continue;
        for (const h of layout.groups) {
          if (h === g) continue;
          for (const b of h.badges) {
            if (segmentCrosses(g.leader, b.box))
              bad.push(`${id} S=${S} ${g.key} leader x ${b.slug}`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('plateSegments', () => {
  for (const r of regions) {
    const pins = PINS.get(r.id)!;
    const segments = plateSegments(pins);

    it(`${r.id}: covers the sweep with open ends and contiguous integer ranges`, () => {
      expect(segments.length).toBeGreaterThanOrEqual(1);
      expect(segments[0].minS).toBeNull();
      expect(segments[segments.length - 1].maxS).toBeNull();
      for (let i = 1; i < segments.length; i++) {
        expect(segments[i].minS).toBe((segments[i - 1].maxS as number) + 1);
      }
    });

    it(`${r.id}: reproduces plateLayout exactly at every side of the sweep`, () => {
      const bad: string[] = [];
      for (const S of SWEEP) {
        const seg = segments.find(
          (g) => (g.minS === null || g.minS <= S) && (g.maxS === null || S <= g.maxS)
        )!;
        const want = LAYOUTS.get(r.id)!.get(S)!;
        expect(seg.groups.map((g) => g.key)).toEqual(want.groups.map((g) => g.key));
        seg.groups.forEach((g, i) => {
          const w = want.groups[i];
          const near = (what: string, got: number, exp: number) => {
            if (Math.abs(got - exp) > 1e-6) bad.push(`S=${S} ${g.key} ${what} ${got} vs ${exp}`);
          };
          near('dot x', at(g.dot.x, S), w.dot.x);
          near('dot y', at(g.dot.y, S), w.dot.y);
          near('unit x', at(g.unit.x, S), w.unit.x);
          near('unit y', at(g.unit.y, S), w.unit.y);
          expect(g.leader === null).toBe(w.leader === null);
          if (g.leader && w.leader) {
            near('leader x1', at(g.leader.x1, S), w.leader.x1);
            near('leader y1', at(g.leader.y1, S), w.leader.y1);
          }
        });
      }
      expect(bad).toEqual([]);
    });
  }
});

describe('plateCss', () => {
  const NAME = 'plate-test';

  /** The rules in force at side S: the unconditional ones, then each matching @container block. */
  function cascade(css: string, S: number): Map<string, Record<string, string>> {
    const rules = new Map<string, Record<string, string>>();
    let active = true;
    for (const line of css.split('\n')) {
      const q = line.match(/^@container (\S+) \(min-width: (\d+)px\)\{$/);
      if (q) {
        expect(q[1]).toBe(NAME);
        active = S >= Number(q[2]);
        continue;
      }
      if (line === '}') {
        active = true;
        continue;
      }
      if (!active) continue;
      const open = line.indexOf('{');
      const sel = line.slice(0, open);
      const decls: Record<string, string> = { ...(rules.get(sel) ?? {}) };
      for (const decl of line.slice(open + 1, -1).split(';')) {
        const c = decl.indexOf(':');
        decls[decl.slice(0, c)] = decl.slice(c + 1);
      }
      rules.set(sel, decls);
    }
    return rules;
  }

  /** A CSS length at side S: plain px or calc(<f> * 100cqw ± <px>px). */
  function lengthAt(value: string, S: number): number {
    const px = value.match(/^(-?\d+(?:\.\d+)?)px$/);
    if (px) return Number(px[1]);
    const calc = value.match(/^calc\((-?\d+(?:\.\d+)?) \* 100cqw ([+-]) (\d+(?:\.\d+)?)px\)$/);
    if (!calc) throw new Error(`unexpected length ${value}`);
    return Number(calc[1]) * S + (calc[2] === '-' ? -1 : 1) * Number(calc[3]);
  }

  for (const r of regions) {
    const pins = PINS.get(r.id)!;
    const css = plateCss(pins, NAME);
    const segments = plateSegments(pins);

    it(`${r.id}: emits the first segment unconditionally and one @container rule per later segment`, () => {
      const lines = css.split('\n');
      expect(lines[0].startsWith('@')).toBe(false);
      const queries = lines.filter((l) => l.startsWith('@container'));
      expect(queries.map((q) => Number(q.match(/(\d+)px/)![1]))).toEqual(
        segments.slice(1).map((g) => g.minS)
      );
    });

    it(`${r.id}: cascades to plateLayout at every side of the sweep, within 0.5 px`, () => {
      const bad: string[] = [];
      for (const S of SWEEP) {
        const rules = cascade(css, S);
        const groups = LAYOUTS.get(r.id)!.get(S)!.groups;
        if (groups.length === 0) bad.push(`S=${S}: no groups`);
        for (const g of groups) {
          const sel = `[data-plate-pin="${g.key}"]`;
          const near = (what: string, got: number, want: number) => {
            if (Math.abs(got - want) > 0.5) bad.push(`S=${S} ${g.key} ${what} ${got} vs ${want}`);
          };
          const pin = rules.get(sel);
          const unit = rules.get(`${sel} [data-plate-unit]`);
          const lead = rules.get(`${sel} [data-plate-leader]`);
          if (!pin || !unit || !lead) {
            bad.push(`S=${S} ${g.key}: missing rules`);
            continue;
          }
          const dx = lengthAt(pin.left, S);
          const dy = lengthAt(pin.top, S);
          near('dot x', dx, g.dot.x);
          near('dot y', dy, g.dot.y);
          near('unit x', dx + lengthAt(unit.left, S), g.unit.x);
          near('unit y', dy + lengthAt(unit.top, S), g.unit.y);
          if (g.leader === null) {
            if (lead.display !== 'none') bad.push(`S=${S} ${g.key}: leader shown`);
          } else {
            if (lead.display !== 'block') bad.push(`S=${S} ${g.key}: leader hidden`);
            const x0 = dx + lengthAt(lead.left, S);
            const y0 = dy + lengthAt(lead.top, S);
            const w = lengthAt(lead.width, S);
            const h = lengthAt(lead.height, S);
            const ends =
              lead.transform === 'none' ? [x0, y0, x0 + w, y0 + h] : [x0 + w, y0, x0, y0 + h];
            const { x1, y1, x2, y2 } = g.leader;
            const off = (pts: number[]) => Math.max(...pts.map((v, i) => Math.abs(v - ends[i])));
            if (Math.min(off([x1, y1, x2, y2]), off([x2, y2, x1, y1])) > 0.5) {
              bad.push(`S=${S} ${g.key}: leader`);
            }
          }
        }
      }
      expect(bad).toEqual([]);
    });

    it(`${r.id}: repeats a rule in a later segment only when it changes`, () => {
      const current = new Map<string, string>();
      for (const line of css.split('\n')) {
        if (line === '}' || line.startsWith('@')) continue;
        const sel = line.slice(0, line.indexOf('{'));
        expect(current.get(sel)).not.toBe(line);
        current.set(sel, line);
      }
    });
  }
});

/** The pin of a region photo, by photo id (ids name the photos; no position is written here). */
function pinOf(region: string, photoId: string): PlatePin {
  const view = regionPhotoViews(region).find((v) => v.id === photoId);
  if (!view) throw new Error(`plate-layout test: ${photoId} is not a ${region} photo`);
  return PINS.get(region)!.find((p) => p.slug === view.slug)!;
}

/** The group holding a pin at one layout. */
const groupOf = (layout: PlatePlacement, slug: string) =>
  layout.groups.find((g) => g.badges.some((b) => b.slug === slug))!;

describe('shared spots (UI E4/zero-one-many)', () => {
  it('declares the same-spot tolerance: dots under 1 px apart at the widest swept side', () => {
    expect(SAME_SPOT_PX).toBe(1);
  });

  it("gives Zermatt's img-0680 and img-0682 one dot and two badges side by side at every side", () => {
    const a = pinOf('zermatt', 'img-0680');
    const b = pinOf('zermatt', 'img-0682');
    const bad: string[] = [];
    for (const S of SWEEP) {
      const layout = LAYOUTS.get('zermatt')!.get(S)!;
      const g = groupOf(layout, a.slug);
      if (g !== groupOf(layout, b.slug)) {
        bad.push(`S=${S}: two dots`);
        continue;
      }
      if (g.badges.length !== 2) bad.push(`S=${S}: ${g.badges.length} badges`);
      const [first, second] = g.badges;
      // Side by side: one row, GAP apart, in ascent order.
      if (
        first.box.y !== second.box.y ||
        Math.abs(second.box.x - (first.box.x + BADGE) - GAP) > 1e-9
      ) {
        bad.push(`S=${S}: not side by side`);
      }
      if (first.n > second.n) bad.push(`S=${S}: not in ascent order`);
    }
    expect(bad).toEqual([]);
  });

  it("puts a shared dot on its first pin's stored uv (never between the two)", () => {
    for (const r of regions) {
      for (const g of plateGroups(PINS.get(r.id)!)) {
        expect(g.key).toBe(g.pins[0].slug);
        expect([g.u, g.v]).toEqual([g.pins[0].u, g.pins[0].v]);
        for (const p of g.pins) {
          expect(Math.hypot(p.u - g.u, p.v - g.v) * PLATE_SWEEP_MAX_S).toBeLessThan(SAME_SPOT_PX);
        }
      }
    }
  });

  it('keeps pins further apart than the tolerance on their own dots', () => {
    const groups = plateGroups([
      { slug: 'a', n: 1, u: 0.5, v: 0.5, approximate: false },
      { slug: 'b', n: 2, u: 0.5, v: 0.5 + 0.5 / PLATE_SWEEP_MAX_S, approximate: false },
      { slug: 'c', n: 3, u: 0.5, v: 0.5 + 2 / PLATE_SWEEP_MAX_S, approximate: false },
    ]);
    expect(groups.map((g) => g.pins.map((p) => p.slug))).toEqual([['a', 'b'], ['c']]);
  });

  it('draws a hollow dot only when every pin at it is approximate (UI E4/partial)', () => {
    const groups = plateGroups([
      { slug: 'a', n: 1, u: 0.2, v: 0.2, approximate: true },
      { slug: 'b', n: 2, u: 0.6, v: 0.6, approximate: true },
      { slug: 'c', n: 3, u: 0.6, v: 0.6, approximate: false },
    ]);
    expect(groups.map((g) => g.approximate)).toEqual([true, false]);
    for (const r of regions) {
      for (const g of plateGroups(PINS.get(r.id)!)) {
        expect(g.approximate).toBe(g.pins.every((p) => p.approximate));
      }
    }
  });
});

describe('near pairs (Pitfall 9)', () => {
  it("displaces both of Saalfelden's aerial pins at every side", () => {
    const aerial = regionPhotoViews('saalfelden').filter((v) => v.aerial);
    expect(aerial).toHaveLength(2);
    const bad: string[] = [];
    for (const S of SWEEP) {
      const layout = LAYOUTS.get('saalfelden')!.get(S)!;
      for (const v of aerial) {
        const g = groupOf(layout, v.slug);
        if (g.leader === null) bad.push(`S=${S} ${v.slug} centred`);
      }
      if (groupOf(layout, aerial[0].slug) === groupOf(layout, aerial[1].slug)) {
        bad.push(`S=${S}: one dot`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("displaces Zermatt's img-0605/img-0629 pair at 320-375", () => {
    const a = pinOf('zermatt', 'img-0605');
    const b = pinOf('zermatt', 'img-0629');
    for (let S = 320; S <= 375; S++) {
      const layout = LAYOUTS.get('zermatt')!.get(S)!;
      const ga = groupOf(layout, a.slug);
      const gb = groupOf(layout, b.slug);
      expect(ga).not.toBe(gb);
      expect(ga.leader !== null || gb.leader !== null).toBe(true);
    }
  });
});

/** The pin counts the S 320-634 sweep was measured for. */
const SWEPT_COUNTS: Readonly<Record<string, number>> = { ortler: 2, saalfelden: 2, zermatt: 7 };

/** Fails with a message naming the sweep when a region's pin count changes. */
function guardCount(region: string, got: number, want: number | undefined) {
  if (got !== want) {
    throw new Error(
      `plate-layout: the S ${PLATE_SWEEP_MIN_S}-${PLATE_SWEEP_MAX_S} sweep was measured for ` +
        `${want ?? 'no'} pins on ${region}, found ${got}; re-run the sweep and check the plate`
    );
  }
}

describe('count guard (UI E4/zero-one-many)', () => {
  it('was measured for exactly these pins per region (a change forces a re-sweep)', () => {
    expect(Object.keys(SWEPT_COUNTS).sort()).toEqual(regions.map((r) => r.id).sort());
    for (const r of regions) guardCount(r.id, PINS.get(r.id)!.length, SWEPT_COUNTS[r.id]);
  });

  it('fails with a message naming the sweep when a count changes', () => {
    expect(() => guardCount('zermatt', 8, 7)).toThrow(/S 320-634 sweep/);
    expect(() => guardCount('newregion', 3, undefined)).toThrow(/re-run the sweep/);
  });

  it('gives every region at least one pin (a region with no photo already fails the build)', () => {
    for (const r of regions) expect(PINS.get(r.id)!.length).toBeGreaterThan(0);
  });
});

describe('plateCss guards (T-18-23)', () => {
  const pins = PINS.get('zermatt')!;

  it('throws a RangeError naming a slug outside the slug pattern', () => {
    for (const slug of ['Bad', 'a"]{}', 'a--b', '-a', 'a b', '']) {
      const bad = [{ ...pins[0], slug }, ...pins.slice(1)];
      expect(() => plateCss(bad, 'plate-zermatt')).toThrow(RangeError);
      expect(() => plateCss(bad, 'plate-zermatt')).toThrow(JSON.stringify(slug));
    }
  });

  it('throws a RangeError for a container name outside the slug pattern', () => {
    expect(() => plateCss(pins, 'plate zermatt')).toThrow(RangeError);
    expect(() => plateCss(pins, 'plate{}')).toThrow(RangeError);
  });

  it('emits the list-plate :has() sync selectors for every pin (Pattern 3, T-18-60)', () => {
    for (const r of regions) {
      const pinsOf = PINS.get(r.id)!;
      const css = plateCss(pinsOf, `plate-${r.id}`);
      const lines = css.split('\n');
      for (const p of pinsOf) {
        const row = `[data-key-row="${p.slug}"]`;
        const badge = `[data-plate-badge="${p.slug}"]`;
        const rowActive = `[data-plate-root]:has(${row}:is(:hover,:focus-visible))`;
        const badgeActive = `[data-plate-root]:has(${badge}:hover)`;
        const rule = (target: string) =>
          lines.find((l) => l.startsWith(`${rowActive} ${target},${badgeActive} ${target}{`));
        // Row hover or focus-visible, and badge hover: the plate badge turns accent ...
        expect(rule(badge), `${p.slug} plate badge`).toMatch(
          /\{background-color:var\(--color-accent\);color:var\(--color-ink-inverse\)\}$/
        );
        // ... and the row gets the overlay fill, the 2 px accent bar and an accent badge.
        expect(rule(row), `${p.slug} row fill`).toMatch(
          /\{background-color:var\(--color-surface-overlay\)\}$/
        );
        expect(rule(`${row}::before`), `${p.slug} row bar`).toMatch(
          /\{content:"";position:absolute;top:0\.5rem;bottom:0\.5rem;left:0;width:0\.125rem;background-color:var\(--color-accent\)\}$/
        );
        expect(rule(`${row} [data-key-badge]`), `${p.slug} row badge`).toMatch(
          /\{background-color:var\(--color-accent\);color:var\(--color-ink-inverse\)\}$/
        );
      }
      // The sync rules are unconditional (outside every @container block) and come last.
      const firstSync = lines.findIndex((l) => l.includes(':has('));
      expect(firstSync).toBeGreaterThan(0);
      expect(lines.slice(firstSync).every((l) => l.includes(':has('))).toBe(true);
      expect(lines.slice(0, firstSync).filter((l) => l.startsWith('@')).length).toBe(
        lines.slice(0, firstSync).filter((l) => l === '}').length
      );
    }
  });

  it('keeps the dashed look of an approximate badge in the accent state (only the fill changes)', () => {
    const css = plateCss(pins, 'plate-zermatt');
    const sync = css.split('\n').filter((x) => x.includes(':has('));
    expect(sync.length).toBe(4 * pins.length);
    for (const l of sync) expect(l).not.toMatch(/border/);
  });

  it('is built only from numbers, the slugs and fixed selectors', () => {
    let rest = plateCss(pins, 'plate-zermatt');
    for (const p of pins) rest = rest.split(`"${p.slug}"`).join('""');
    rest = rest.split('plate-zermatt').join('');
    expect(rest).toMatch(/^[-[\]a-z0-9@(){}:;.,*+="\s]*$/);
  });
});
