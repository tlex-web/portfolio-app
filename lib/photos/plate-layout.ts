/**
 * The region plate's photo pins (REGION-02; 18-UI-SPEC Contract 2 "Facts and
 * plate"; 18-RESEARCH Pattern 2, Pitfall 9). Skeleton: constants and types
 * only; the layout follows.
 */

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
export type PlateSegment = { minS: number | null; maxS: number | null; groups: PlateSegmentGroup[] };

/** What platePins reads from a photo view. */
export type PlatePinSource = {
  slug: string;
  approximate: boolean;
  uv?: { u: number; v: number } | null;
};

export function platePins(views: readonly PlatePinSource[]): PlatePin[] {
  void views;
  return [];
}

export function plateLayout(pins: readonly PlatePin[], S: number): PlatePlacement {
  void pins;
  return { S, groups: [] };
}

export function plateSegments(pins: readonly PlatePin[]): PlateSegment[] {
  void pins;
  return [];
}

export function plateCss(pins: readonly PlatePin[], containerName: string): string {
  void pins;
  void containerName;
  return '';
}
