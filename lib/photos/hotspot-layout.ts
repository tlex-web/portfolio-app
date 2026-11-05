/**
 * The lightbox hotspot gutter stack (LBOX-05; D-09; 10-UI-SPEC "Hotspots",
 * Gutter tier "Stacking" and "Expanded panel" rows; 10-RESEARCH Pattern 6).
 * Pure: it imports only stack1D, the map plates' 1-D stacker.
 *
 * On the gutter tier each hotspot has a 192 x 48 px label in its side gutter
 * (x < 50 left, else right). Per gutter, in the order given (reading order,
 * so sorted by marker y), every label is centred on its marker's y, kept
 * 8 px inside the stage, pushed down to clear the previous one by 8 px, and
 * pushed up from the bottom when the stack runs past the stage. An expanded
 * panel counts in the stack: its label's `height` is the label plus the
 * panel (48 + 8 + panel), while the centring stays on the 48 px label, so
 * opening a callout never moves its own label, only the ones after it.
 *
 * A gutter whose whole stack is taller than the stage cannot fit, so it is
 * laid out from the top (8 px down, 8 px apart) and the gutter scrolls: the
 * UI-SPEC's last resort. Today a photo has one or two hotspots.
 */
import { stack1D } from '@/lib/photos/label-layout';

/** The gutter label plate's height (h-12), px; labels centre on their marker by this box. */
export const GUTTER_LABEL_HEIGHT = 48;

/** The gap between stacked labels and the inset from the stage edges, px. */
export const GUTTER_GAP = 8;

export type GutterItem = {
  id: string;
  side: 'left' | 'right';
  /** The marker's y in the stage, px. */
  anchorY: number;
  /** The label's height, plus its expanded panel (and the 8 px between) when open, px. */
  height: number;
};

/** The top of every label in the stage, px, keyed by hotspot id. */
export function gutterStack(
  items: readonly GutterItem[],
  stageHeight: number
): Record<string, { top: number }> {
  const tops: Record<string, { top: number }> = {};
  const min = GUTTER_GAP;
  const max = stageHeight - GUTTER_GAP;
  for (const side of ['left', 'right'] as const) {
    const stack = items.filter((item) => item.side === side);
    if (stack.length === 0) continue;
    // stack1D centres a box on its anchor; shift the anchor so the 48 px label,
    // not the label plus its panel, sits centred on the marker.
    const boxes = stack.map((item) => ({
      anchor: item.anchorY - GUTTER_LABEL_HEIGHT / 2 + item.height / 2,
      size: item.height,
    }));
    const total = boxes.reduce((sum, box) => sum + box.size, 0) + GUTTER_GAP * (boxes.length - 1);
    const starts = stack1D(boxes, min, total > max - min ? Infinity : max, GUTTER_GAP);
    stack.forEach((item, i) => {
      tops[item.id] = { top: starts[i] };
    });
  }
  return tops;
}
