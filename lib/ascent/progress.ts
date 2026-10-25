// RED stub: signatures only.
export const PLATEAU = 0;
export type AscentLayout = { start: number; distance: number; arrivals: readonly number[] };
export function arrivalsFromBlocks(_b: readonly { offset: number; height: number }[], _s: number, _d: number): number[] { return []; }
export function mapProgress(_y: number, _l: AscentLayout): number { return -1; }
export function altitudeAt(_p: number, _a: readonly number[], _h: readonly number[]): number { return -1; }
export function railFraction(_p: number, _a: readonly number[]): number { return -1; }
export function pinWindow(_n: number): number { return -1; }
export function activePin(_p: number, _a: readonly number[]): number | null { return -1; }
export function snapThreshold(_n: number): number { return -1; }
export function shouldSnap(_a: number, _b: number, _n: number): boolean { return false; }
