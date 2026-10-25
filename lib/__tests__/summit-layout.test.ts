/**
 * G-09-2 (static half), 09-18 (D-03; Tim: "Compact plaque + measured 3D";
 * .planning/debug/summit-pins-under-plaque.md "Derived clear conditions"): the
 * summit layout thresholds and the poster geometry agree by construction.
 *
 * - summitLayoutAt picks 'full' only on landscape viewports from 1100 px to
 *   below 1944 px, and app/globals.css spells the same condition.
 * - The modelled plaque column (summitColumnBox) clears every poster pin
 *   (posterFrame + the waypoint UV, a 24 x 40 px box above the anchor) by at
 *   least 4 px across portrait phones, tablets and desktops, with and without
 *   the 10 px scrollbar gutter. The model is checked against the browser by the
 *   e2e rows in e2e/home-ascent.spec.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { posterFrame } from '@/lib/ascent/poster-frame';
import {
  SUMMIT_FULL_MAX_REM,
  SUMMIT_FULL_MEDIA,
  SUMMIT_FULL_MIN_REM,
  summitColumnBox,
  summitLayoutAt,
  type ColumnBox,
} from '@/lib/ascent/summit-layout';
import { buildWaypoints } from '@/lib/ascent/waypoints';

const css = fs.readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf8');
const NAV_H = 64;
const MIN_CLEARANCE = 4;
const PIN_W = 24;
const PIN_H = 40;
const MIN_STAGE_H = 480;

/** Integers from `from` to `to` in `step`s, always including `to`, plus any extra values. */
function range(from: number, to: number, step: number, extra: readonly number[] = []): number[] {
  const out = new Set<number>(extra.filter((x) => x >= from && x <= to));
  for (let x = from; x < to; x += step) out.add(x);
  out.add(to);
  return [...out].sort((a, b) => a - b);
}

/** The layout boundaries, so the sweep always hits both sides of each. */
const EDGES = [1099, 1100, 1101, 1943, 1944, 1945];

const DOMAINS = [
  { name: 'portrait phones', widths: range(360, 430, 5), heights: range(553, 932, 10) },
  { name: 'tablets', widths: range(744, 1366, 16, EDGES), heights: range(600, 1366, 16) },
  { name: 'desktops', widths: range(1100, 2560, 20, EDGES), heights: range(600, 1440, 20) },
] as const;

type Size = { domain: string; w: number; h: number; gutter: number };

const SIZES: Size[] = DOMAINS.flatMap(({ name, widths, heights }) =>
  widths.flatMap((w) =>
    heights.flatMap((h) => [0, 10].map((gutter) => ({ domain: name, w, h, gutter })))
  )
).filter(({ h }) => h - NAV_H >= MIN_STAGE_H);

const pins = buildWaypoints().map((w) => ({ k: w.k, ...w.uv }));

/** The poster pin box of anchor (u, v) on a stage, in stage px: 24 x 40 above the anchor. */
function pinBox(stageW: number, stageH: number, u: number, v: number): ColumnBox {
  const f = posterFrame(stageW, stageH);
  const x = f.left + u * f.side;
  const y = f.top + v * f.side;
  return { x: x - PIN_W / 2, y: y - PIN_H, width: PIN_W, height: PIN_H };
}

/** Separation of two boxes: positive when apart (the larger axis gap), negative when they overlap. */
function gap(a: ColumnBox, b: ColumnBox): number {
  return Math.max(
    b.x - (a.x + a.width),
    a.x - (b.x + b.width),
    b.y - (a.y + a.height),
    a.y - (b.y + b.height)
  );
}

describe('summit layout thresholds (G-09-2, 09-18)', () => {
  it('names 1100 px and 1944 px (exclusive) in rem', () => {
    expect(SUMMIT_FULL_MIN_REM * 16).toBe(1100);
    expect(SUMMIT_FULL_MAX_REM * 16).toBe(1944);
    expect(SUMMIT_FULL_MEDIA).toBe(
      `(orientation: landscape) and (${SUMMIT_FULL_MIN_REM}rem <= width < ${SUMMIT_FULL_MAX_REM}rem)`
    );
  });

  it.each([
    [1280, 720],
    [1440, 900],
    [1920, 1080],
  ])('is full at %i x %i', (w, h) => {
    expect(summitLayoutAt(w, h)).toBe('full');
  });

  it.each([
    [375, 667],
    [768, 1024],
    [820, 1180],
    [1024, 768],
    [1099, 700],
    [1944, 1080],
    [2560, 1440],
    [1200, 1300],
  ])('is compact at %i x %i', (w, h) => {
    expect(summitLayoutAt(w, h)).toBe('compact');
  });

  it('is compact on a square viewport (CSS orientation is portrait when width = height)', () => {
    expect(summitLayoutAt(1200, 1200)).toBe('compact');
  });

  it('app/globals.css defines summit-full and summit-compact with exactly SUMMIT_FULL_MEDIA', () => {
    const media = (variant: string) =>
      new RegExp(`@custom-variant ${variant}\\s*\\{\\s*@media ([^{]+)\\{\\s*@slot;`)
        .exec(css)?.[1]
        .trim();
    expect(media('summit-full')).toBe(SUMMIT_FULL_MEDIA);
    expect(media('summit-compact')).toBe(`not all and ${SUMMIT_FULL_MEDIA}`);
  });
});

describe('summitColumnBox (the modelled plaque column, stage px)', () => {
  it('docks the compact column at the bottom at 375 x 667 (stage 365 x 603)', () => {
    expect(summitColumnBox(375, 667, 10)).toEqual({
      x: 16,
      y: 603 - 16 - 170,
      width: 320,
      height: 170,
    });
  });

  it('fits the compact column inside a 360 px phone (318 px content width)', () => {
    expect(summitColumnBox(360, 640, 10).width).toBe(318);
  });

  it('matches the debug measurement of the full column right edge: 539 at 1280 x 720, 619 at 1440 x 900', () => {
    const right = (b: ColumnBox) => b.x + b.width;
    expect(right(summitColumnBox(1280, 720, 10))).toBe(539);
    expect(right(summitColumnBox(1440, 900, 10))).toBe(619);
    expect(summitColumnBox(1440, 900, 10).height).toBe(478);
  });
});

describe(`poster pins clear the modelled summit column (${SIZES.length} sizes)`, () => {
  it(`keeps every poster pin at least ${MIN_CLEARANCE} px from the column at ${SIZES.length} sizes, gutters 0 and 10 px`, () => {
    expect(SIZES.length).toBeGreaterThanOrEqual(2000);
    const failures: string[] = [];
    for (const { domain, w, h, gutter } of SIZES) {
      const stageW = w - gutter;
      const stageH = h - NAV_H;
      const column = summitColumnBox(w, h, gutter);
      for (const { k, u, v } of pins) {
        const g = gap(column, pinBox(stageW, stageH, u, v));
        if (!(g >= MIN_CLEARANCE)) {
          failures.push(
            `${domain} ${w} x ${h} gutter ${gutter} (${summitLayoutAt(w, h)}): pin ${k} gap ${g.toFixed(1)}`
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
