/**
 * The Alps overview label layout (REGION-01). RED skeleton: the constants and
 * types the sweep in lib/__tests__/overview-layout.test.ts reads; the search
 * and the CSS emitter land in the GREEN commit.
 */

export const MARKER = 28;
export const REGION_PLATE = { w: 144, h: 48 } as const;
export const SUMMIT_TRIANGLE = 12;
export const OVERVIEW_GAP = 8;
export const OVERVIEW_INSET = 8;
export const OVERVIEW_COMPACT_MAX_S = 559;
export const OVERVIEW_SWEEP_MIN_S = 312;
export const OVERVIEW_SWEEP_MAX_S = 1100;
export const OVERVIEW_RATIO = 872 / 1200;
export const LEADER_STEPS = [8, 16, 24, 40] as const;
export const UNPLACED_SUMMIT_LABELS: readonly { summit: string; ranges: readonly [number, number][] }[] =
  [];

export type OverviewUv = { u: number; v: number };
export type OverviewRegionMark = {
  id: string;
  number: number;
  name: string;
  count: string;
  corners: readonly OverviewUv[];
};
export type OverviewSummitMark = { name: string; u: number; v: number; height: string };
export type OverviewInput = {
  regions: readonly OverviewRegionMark[];
  summits: readonly OverviewSummitMark[];
};
export type OverviewBox = { x: number; y: number; width: number; height: number };
export type OverviewLeader = { x1: number; y1: number; x2: number; y2: number };
export type OverviewTier = 'compact' | 'wide';
export type OverviewPlacement = {
  S: number;
  H: number;
  tier: OverviewTier;
  regions: {
    id: string;
    number: number;
    rect: OverviewBox;
    marker: OverviewBox;
    leader: OverviewLeader;
    plate: OverviewBox | null;
  }[];
  summits: { name: string; triangle: OverviewBox; plate: OverviewBox | null; placed: boolean }[];
};
export type OverviewLength = { axis: 'x' | 'y'; f: number; px: number };
type LBox = { x: OverviewLength; y: OverviewLength; width: OverviewLength; height: OverviewLength };
export type OverviewSegment = {
  minS: number | null;
  maxS: number | null;
  placements: {
    tier: OverviewTier;
    regions: {
      id: string;
      marker: LBox;
      leader: { x1: OverviewLength; y1: OverviewLength; x2: OverviewLength; y2: OverviewLength };
      plate: LBox | null;
    }[];
    summits: { name: string; triangle: LBox; plate: LBox | null }[];
  };
};

export function boxesMeet(_a: OverviewBox, _b: OverviewBox, _gap: number): boolean {
  return false;
}

export function summitPlateSize(_name: string, _height: string): { w: number; h: number } {
  return { w: 0, h: 0 };
}

export function summitKey(name: string): string {
  return name;
}

export function overviewLayout(_input: OverviewInput, S: number): OverviewPlacement {
  return { S, H: 0, tier: 'compact', regions: [], summits: [] };
}

export function overviewSegments(_input: OverviewInput): OverviewSegment[] {
  return [];
}

export function overviewCss(_input: OverviewInput, _containerName: string): string {
  return '';
}
