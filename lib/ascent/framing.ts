/**
 * Pin label placement (G-09-3 a, 09-19; D-07, D-09 and its 2026-10-25
 * amendment; 09-UI-SPEC "Pins (D-09)" and UI Considerations E7; the
 * measurements are in .planning/debug/waypoint2-label-and-kicker.md part a)
 * and the measured summit framing (G-09-2, 09-20; see the section below
 * placePinLabel). Pure and import-free, like poster-frame.ts: keep it to
 * erasable TypeScript and never add an import.
 *
 * The lit pin's label has to stay legible beside the waypoint card (left, from
 * 768 px) and the altimeter rail (right). At 768 px the band between the two is
 * 62 px, too narrow for any side placement, so the label may also sit above or
 * below the mark. AscentController measures the stage (StageGeometry) on each
 * layout measurement and places the poster labels with placePinLabel; the 3D
 * rig reuses the same function (09-21).
 *
 * Every box is in stage px: origin at the stage's top-left corner, x to the
 * right, y down.
 */

/** An axis-aligned box: left x0, top y0, right x1, bottom y1. */
export type Box = { x0: number; y0: number; x1: number; y1: number };

/** A width and height in px. */
export type Size = { w: number; h: number };

/**
 * The altimeter rail as it is laid out (empty below 768 px, where it is hidden):
 * every tick row, the rail line (the box's right 1 px column), the readout's
 * size, the rail box's right edge and the vertical centre of each tick row.
 */
export type RailGeometry = {
  ticks: Box[];
  line: Box | null;
  readout: Size | null;
  railRight: number | null;
  tickCentres: number[];
};

/**
 * The measured stage: its size, each waypoint card's box at its arrival (index
 * k - 1, null when it could not be read), each pin label's size (index k - 1),
 * the rail, and the summit plaque column's box at the summit arrival (null
 * when it could not be read; G-09-2, 09-20).
 */
export type StageGeometry = {
  width: number;
  height: number;
  cards: (Box | null)[];
  labels: (Size | null)[];
  rail: RailGeometry;
  plaque: Box | null;
};

/** Half the pin mark's width (the 24 px head). */
export const PIN_HALF_WIDTH_PX = 12;
/** The pin head's size. */
export const PIN_HEAD_PX = 24;
/** The whole mark: 24 px head and 16 px stem. */
export const PIN_HEIGHT_PX = 40;
/** Gap between the head and a label beside it (ml-2 / mr-2). */
export const LABEL_SIDE_GAP_PX = 8;
/** Gap between the mark and a label above or below it (mb-1 / mt-1). */
export const LABEL_STACK_GAP_PX = 4;
/** Clearance a label keeps from the stage edge and from every obstacle. */
export const LABEL_MARGIN_PX = 4;

/** Readout's right edge sits this far left of the rail's right edge (right-6). */
const READOUT_INSET_PX = 24;
/** The marker: 24 x 2 px, centred on the rail line (-right-3 w-6 h-0.5). */
const MARKER_W_PX = 24;
const MARKER_H_PX = 2;

export type LabelSide = 'right' | 'left' | 'above' | 'below' | 'none';

export type LabelPlacement = {
  side: LabelSide;
  /** The label's left edge relative to the mark's left edge, in px. */
  dx: number;
  /** True only when the label is inside the bounds and clear of every obstacle. */
  clear: boolean;
};

/**
 * The mark box and the head box of a pin whose anchor (the stem's foot) is at
 * (x, y): the mark is 24 x 40 px above the anchor, the head its top 24 px.
 */
export function pinBoxes(x: number, y: number): { mark: Box; head: Box } {
  const x0 = x - PIN_HALF_WIDTH_PX;
  const x1 = x + PIN_HALF_WIDTH_PX;
  const y0 = y - PIN_HEIGHT_PX;
  return { mark: { x0, y0, x1, y1: y }, head: { x0, y0, x1, y1: y0 + PIN_HEAD_PX } };
}

/**
 * The rail marks a label must avoid at waypoint k's plateau: every tick row,
 * the line, and the readout and marker as they sit on tick k - 1 (the readout's
 * right edge 24 px left of the rail's right edge, the 24 x 2 px marker centred
 * on it, both centred on that tick). No readout or marker when the readout size
 * is unknown (reduced motion hides them) or tick k - 1 does not exist.
 */
export function railObstaclesAt(rail: RailGeometry, k: number): Box[] {
  const out: Box[] = [...rail.ticks];
  if (rail.line) out.push(rail.line);
  const cy = rail.tickCentres[k - 1];
  if (rail.readout && rail.railRight !== null && cy !== undefined) {
    const right = rail.railRight - READOUT_INSET_PX;
    const { w, h } = rail.readout;
    out.push({ x0: right - w, y0: cy - h / 2, x1: right, y1: cy + h / 2 });
    out.push({
      x0: rail.railRight - MARKER_W_PX / 2,
      y0: cy - MARKER_H_PX / 2,
      x1: rail.railRight + MARKER_W_PX / 2,
      y1: cy + MARKER_H_PX / 2,
    });
  }
  return out;
}

const area = (b: Box) => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);

const overlap = (a: Box, b: Box) =>
  area({
    x0: Math.max(a.x0, b.x0),
    y0: Math.max(a.y0, b.y0),
    x1: Math.min(a.x1, b.x1),
    y1: Math.min(a.y1, b.y1),
  });

const inflate = (b: Box, d: number): Box => ({
  x0: b.x0 - d,
  y0: b.y0 - d,
  x1: b.x1 + d,
  y1: b.y1 + d,
});

const contains = (b: Box, x: number, y: number) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;

/**
 * Where the lit label goes. `anchor` is the pin's stem foot, `label` the
 * label's size, `obstacles` the boxes it must keep 4 px from (the active card
 * and the rail marks), `covers` the boxes that paint over the pin (the active
 * card), `bounds` the stage.
 *
 * - A head whose centre lies inside a cover gets 'none' (the static-poster
 *   exception of the D-09 amendment). A head that only overlaps a cover at its
 *   edge still gets a label.
 * - Otherwise the candidates, in order: right (8 px right of the head,
 *   centred on it), left (8 px left of it), above (4 px above the mark), below
 *   (4 px below it). Above and below each try the label centred on the head,
 *   aligned to its left and aligned to its right, then slid along the head
 *   (still spanning it) until one of its edges meets an inflated obstacle's
 *   edge or the inner bounds, nearest to centred first; each is clamped into
 *   the bounds. The slides are what fit pin 4 at 768 px, whose head sits in
 *   the rail box column, between the card and the rail line.
 * - The first candidate inside the bounds (4 px margin) that intersects no
 *   obstacle inflated by 4 px wins, with clear true.
 * - If none is clear, the candidate with the smallest total intersection with
 *   the inflated obstacles plus its area outside the bounds wins (candidate
 *   order breaks ties), with clear false. 'none' also has clear false.
 */
export function placePinLabel({
  anchor,
  label,
  obstacles,
  covers,
  bounds,
}: {
  anchor: { x: number; y: number };
  label: Size;
  obstacles: readonly Box[];
  covers: readonly Box[];
  bounds: Box;
}): LabelPlacement {
  const { mark, head } = pinBoxes(anchor.x, anchor.y);
  const hx = (head.x0 + head.x1) / 2;
  const hy = (head.y0 + head.y1) / 2;
  if (covers.some((c) => contains(c, hx, hy))) return { side: 'none', dx: 0, clear: false };

  const { w, h } = label;
  const inner = inflate(bounds, -LABEL_MARGIN_PX);
  const blocked = obstacles.map((o) => inflate(o, LABEL_MARGIN_PX));
  // Above and below: dx clamped so the label stays inside the inner bounds where it can.
  const clampDx = (dx: number) => {
    const min = inner.x0 - mark.x0;
    const max = inner.x1 - w - mark.x0;
    return min > max ? dx : Math.min(Math.max(dx, min), max);
  };

  const candidates: { side: LabelSide; dx: number }[] = [
    { side: 'right', dx: PIN_HEAD_PX + LABEL_SIDE_GAP_PX },
    { side: 'left', dx: -LABEL_SIDE_GAP_PX - w },
  ];
  const centred = (PIN_HEAD_PX - w) / 2;
  // Slides: a label above or below may also shift along the head (dx from 24 - w
  // to 0, so it still spans the head) until an edge meets an inflated obstacle's
  // edge or the inner bounds, nearest to centred first.
  const lo = Math.min(0, PIN_HEAD_PX - w);
  const hi = Math.max(0, PIN_HEAD_PX - w);
  const slides = [
    ...blocked.flatMap((o) => [o.x1 - mark.x0, o.x0 - w - mark.x0]),
    inner.x0 - mark.x0,
    inner.x1 - w - mark.x0,
  ]
    .filter((dx) => dx >= lo && dx <= hi)
    .sort((a, b) => Math.abs(a - centred) - Math.abs(b - centred));
  for (const side of ['above', 'below'] as const) {
    for (const dx of [centred, 0, PIN_HEAD_PX - w, ...slides]) {
      const clamped = clampDx(dx);
      if (!candidates.some((c) => c.side === side && Math.abs(c.dx - clamped) < 1e-9))
        candidates.push({ side, dx: clamped });
    }
  }

  const boxOf = ({ side, dx }: { side: LabelSide; dx: number }): Box => {
    const x0 = mark.x0 + dx;
    let y0: number;
    if (side === 'above') y0 = mark.y0 - LABEL_STACK_GAP_PX - h;
    else if (side === 'below') y0 = mark.y1 + LABEL_STACK_GAP_PX;
    else y0 = hy - h / 2;
    return { x0, y0, x1: x0 + w, y1: y0 + h };
  };

  let best: { side: LabelSide; dx: number; cost: number } | null = null;
  for (const candidate of candidates) {
    const box = boxOf(candidate);
    const hits = blocked.reduce((sum, o) => sum + overlap(box, o), 0);
    const outside = area(box) - overlap(box, inner);
    const cost = hits + outside;
    if (cost === 0) return { side: candidate.side, dx: candidate.dx, clear: true };
    if (!best || cost < best.cost) best = { ...candidate, cost };
  }
  // candidates is never empty, so best is set.
  return { side: best!.side, dx: best!.dx, clear: false };
}

/*
 * Measured summit framing (G-09-2, 3D half, 09-20; Tim: "Compact plaque +
 * measured 3D"; D-03, D-16, D-20; .planning/debug/summit-pins-under-plaque.md).
 *
 * The summit frame must show all four waypoint pins beside or above the summit
 * plaque column and clear of the rail zone. Instead of fixed shares of the
 * stage, the rig measures the plaque (StageGeometry.plaque), takes the clear
 * rectangles above and right of it (summitClearRects), and fits the pin cluster
 * into the one that holds it largest (fitCluster), never zooming in past the
 * summit's 60 / 75 degree horizontal FOV. The view offset and FOV then follow
 * one key track over the plan view, the stages and the summit (stageViewKeys,
 * viewTrackAt).
 *
 * Pinhole model (consistent with three's setViewOffset(w, h, x, y, w, h), where
 * a full-image pixel shows at its position minus the offset): a camera-space
 * point (X, Y, Z) with Z < 0 has tangents tx = X / -Z, ty = Y / -Z; with focal
 * length F = h / (2 tan(vfov / 2)) its full-image pixel is (w / 2 + F tx,
 * h / 2 - F ty). A pin box spans PIN_HALF_WIDTH_PX either side of the anchor
 * and PIN_HEIGHT_PX above it.
 */

/** The cluster's tangent extent in camera space: tx from a0 to a1, ty from b0 to b1. */
export type TangentBounds = { a0: number; a1: number; b0: number; b1: number };

/** A view offset in px (setViewOffset x, y) and a vertical FOV in degrees. */
export type ViewKey = { x: number; y: number; fov: number };

/** The summit frame keeps the pin boxes this far from the plaque, the rail zone and the stage edges. */
export const SUMMIT_FRAME_MARGIN_PX = 16;

/**
 * The plan view's and every stage's vertical FOV. A copy of route.ts
 * CAMERA_FOV_DEG (this module stays import-free; ascent-route.test asserts
 * they match).
 */
export const STAGE_FOV_DEG = 40;

/**
 * Narrow stages (below the md breakpoint) move the optical centre up by this
 * share of the stage height (D-20). A copy of route.ts VIEW_OFFSET_SHARE.
 */
export const NARROW_VIEW_OFFSET_Y_SHARE = 0.2;

/**
 * Narrow stages move the optical centre right by this share of the stage
 * width. A copy of route.ts VIEW_OFFSET_X_SHARE.
 */
export const NARROW_VIEW_OFFSET_X_SHARE = 0.2;

/**
 * fitCluster never goes wider than this share of maxFocalPx (a quarter of the
 * summit zoom), so a degenerate rectangle cannot ask for a FOV near 180°.
 */
const MIN_FOCAL_SHARE = 0.25;

const DEG = Math.PI / 180;

const nonEmpty = (b: Box) => b.x1 > b.x0 && b.y1 > b.y0;

/**
 * The clear rectangles of a stage at the summit, each `margin` inside the
 * stage edges and clear of the rail zone (the right `railZone` px, 0 below
 * 768 px) and of the plaque:
 * - above the plaque: the full width (less the rail zone) from the top down to
 *   `margin` above the plaque's top;
 * - right of it: from `margin` right of the plaque's right edge to the rail
 *   zone, the full height.
 * With no plaque, the whole stage less the rail zone. Empty rectangles are
 * dropped, so the result may be empty.
 */
export function summitClearRects(
  stage: Size,
  plaque: Box | null,
  railZone: number,
  margin: number = SUMMIT_FRAME_MARGIN_PX
): Box[] {
  const x0 = margin;
  const y0 = margin;
  const x1 = stage.w - Math.max(0, railZone) - margin;
  const y1 = stage.h - margin;
  if (!plaque) return [{ x0, y0, x1, y1 }].filter(nonEmpty);
  return [
    { x0, y0, x1, y1: Math.min(y1, plaque.y0 - margin) },
    { x0: Math.max(x0, plaque.x1 + margin), y0, x1, y1 },
  ].filter(nonEmpty);
}

/**
 * The summit frame that fits the pin cluster into one of `rects`. For each
 * rectangle the focal length F is the smallest of (rect width - 24) / (a1 - a0),
 * (rect height - 40) / (b1 - b0) and maxFocalPx (a zero extent does not
 * constrain); the largest F wins, a larger area breaks ties. The view offset
 * centres the pin boxes in that rectangle:
 *   offsetX = w / 2 + F (a0 + a1) / 2 - rect centre x
 *   offsetY = h / 2 - F (b0 + b1) / 2 - 20 - rect centre y
 * and fovDeg = 2 atan(h / (2 F)) in degrees. F never drops below
 * MIN_FOCAL_SHARE x maxFocalPx. With no rectangle the whole stage is used.
 */
export function fitCluster({
  bounds,
  stage,
  rects,
  maxFocalPx,
}: {
  bounds: TangentBounds;
  stage: Size;
  rects: readonly Box[];
  maxFocalPx: number;
}): { fovDeg: number; offsetX: number; offsetY: number; rect: Box } {
  const spanA = bounds.a1 - bounds.a0;
  const spanB = bounds.b1 - bounds.b0;
  const options = rects.length > 0 ? rects : [{ x0: 0, y0: 0, x1: stage.w, y1: stage.h }];
  const focalFor = (r: Box) => {
    let f = maxFocalPx;
    if (spanA > 0) f = Math.min(f, (r.x1 - r.x0 - 2 * PIN_HALF_WIDTH_PX) / spanA);
    if (spanB > 0) f = Math.min(f, (r.y1 - r.y0 - PIN_HEIGHT_PX) / spanB);
    return f;
  };
  let best = options[0];
  let bestF = focalFor(best);
  for (const r of options.slice(1)) {
    const f = focalFor(r);
    if (f > bestF || (f === bestF && area(r) > area(best))) {
      best = r;
      bestF = f;
    }
  }
  const F = Math.max(bestF, MIN_FOCAL_SHARE * maxFocalPx);
  const cx = (best.x0 + best.x1) / 2;
  const cy = (best.y0 + best.y1) / 2;
  return {
    fovDeg: (2 * Math.atan(stage.h / (2 * F))) / DEG,
    offsetX: stage.w / 2 + (F * (bounds.a0 + bounds.a1)) / 2 - cx,
    offsetY: stage.h / 2 - (F * (bounds.b0 + bounds.b1)) / 2 - PIN_HEIGHT_PX / 2 - cy,
    rect: best,
  };
}

/**
 * The n + 2 view keys of the route: the plan view (no offset, STAGE_FOV_DEG:
 * the canvas equals the poster at p = 0, D-16), one per stage, then `summit`.
 * A narrow stage moves the optical centre right by NARROW_VIEW_OFFSET_X_SHARE
 * of the width and up by NARROW_VIEW_OFFSET_Y_SHARE of the height (D-20); a
 * wide stage takes wideStageOffsets[k - 1] (default no offset). Every stage key
 * has STAGE_FOV_DEG.
 */
export function stageViewKeys({
  n,
  narrow,
  stage,
  summit,
  wideStageOffsets = [],
}: {
  n: number;
  narrow: boolean;
  stage: Size;
  summit: ViewKey;
  wideStageOffsets?: readonly { x: number; y: number }[];
}): ViewKey[] {
  const keys: ViewKey[] = [{ x: 0, y: 0, fov: STAGE_FOV_DEG }];
  for (let i = 0; i < n; i++) {
    const o = narrow
      ? { x: NARROW_VIEW_OFFSET_X_SHARE * stage.w, y: NARROW_VIEW_OFFSET_Y_SHARE * stage.h }
      : (wideStageOffsets[i] ?? { x: 0, y: 0 });
    keys.push({ x: o.x, y: o.y, fov: STAGE_FOV_DEG });
  }
  keys.push(summit);
  return keys;
}

/**
 * The view key at curve parameter t (0 to 1, clamped): key i sits at t = i /
 * (keys.length - 1), and between neighbours it is linear in s = t x
 * (keys.length - 1). Over the first segment s is reliefAt (curveParamAt's
 * first segment), so the narrow offsets ramp in with the tilt-in; on every
 * plateau t holds, so the key does too.
 */
export function viewTrackAt(keys: readonly ViewKey[], t: number): ViewKey {
  const last = keys.length - 1;
  if (last <= 0) return keys[0] ?? { x: 0, y: 0, fov: STAGE_FOV_DEG };
  const s = Math.min(Math.max(t, 0), 1) * last;
  const i = Math.min(Math.floor(s), last - 1);
  const f = s - i;
  const a = keys[i];
  const b = keys[i + 1];
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    fov: a.fov + (b.fov - a.fov) * f,
  };
}
