/**
 * Pin label placement (G-09-3 a, 09-19; D-07, D-09 and its 2026-10-25
 * amendment; 09-UI-SPEC "Pins (D-09)" and UI Considerations E7; the
 * measurements are in .planning/debug/waypoint2-label-and-kicker.md part a).
 * Pure and import-free, like poster-frame.ts: keep it to erasable TypeScript
 * and never add an import.
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
 * k - 1, null when it could not be read), each pin label's size (index k - 1)
 * and the rail.
 */
export type StageGeometry = {
  width: number;
  height: number;
  cards: (Box | null)[];
  labels: (Size | null)[];
  rail: RailGeometry;
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
 *   aligned to its left and aligned to its right, clamped into the bounds.
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
  for (const side of ['above', 'below'] as const) {
    for (const dx of [(PIN_HEAD_PX - w) / 2, 0, PIN_HEAD_PX - w]) {
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
