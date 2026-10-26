/**
 * The map label layout (PHOTO-01; D-02, D-04; 10-UI-SPEC "Label layout").
 * RED stub: the behaviour lands in the GREEN commit.
 */

export type MapMark = { slug: string; u: number; v: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Point = { x: number; y: number };
export type Leader = { x1: number; y1: number; x2: number; y2: number };
export type Linear = { frac: number; px: number };
export type MapTier = 'wide' | 'compact';
export type PreviewSide = 'above' | 'below';
export type MarkLayout = {
  slug: string;
  plate: Rect;
  dot: Point;
  leader: Leader;
  preview: PreviewSide;
};
export type MapLayout = { tier: MapTier; marks: MarkLayout[]; summit: { mark: Point; plate: Rect } };
type Lin<T> = T extends number ? Linear : { [K in keyof T]: Lin<T[K]> };
export type MapPlacements = {
  tier: MapTier;
  marks: { slug: string; plate: Lin<Rect>; dot: Lin<Point>; leader: Lin<Leader>; preview: PreviewSide }[];
  summit: { mark: Lin<Point>; plate: Lin<Rect> };
};
export type MapMarkSegment = { minS: number | null; maxS: number | null; placements: MapPlacements };

export const PLATE_WIDE = { w: 240, h: 48 } as const;
export const PLATE_COMPACT = { w: 144, h: 68 } as const;
export const SUMMIT_PLATE = { w: 93, h: 48 } as const;
export const INSET = 8;
export const GAP = 8;
export const DOT = 12;
export const DOT_CLEAR = 4;
export const COMPACT_MAX_S = 559;
export const SWEEP_MIN_S = 312;
export const SWEEP_MAX_S = 1100;

export function layoutMapMarks(
  _S: number,
  _marks: readonly MapMark[],
  _summitUv: { u: number; v: number }
): MapLayout {
  throw new Error('layoutMapMarks: not implemented');
}

export function mapMarkSegments(
  _marks: readonly MapMark[],
  _summitUv: { u: number; v: number }
): MapMarkSegment[] {
  throw new Error('mapMarkSegments: not implemented');
}

export function mapMarkCss(_marks: readonly MapMark[], _summitUv: { u: number; v: number }): string {
  throw new Error('mapMarkCss: not implemented');
}

export function stack1D(
  _items: readonly { anchor: number; size: number }[],
  _min: number,
  _max: number,
  _gap: number
): number[] {
  throw new Error('stack1D: not implemented');
}
