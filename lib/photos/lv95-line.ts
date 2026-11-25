import type { CoordinatePrecision } from '@/lib/home-format';

/** RED stub (18-18 Task 1): the tests define the behaviour; the GREEN commit replaces this. */
export const LV95_GRID_M = { '4dp': 10, '3dp': 100, '2dp': 1000 } as const satisfies Record<
  CoordinatePrecision,
  number
>;

export function snapLv95(m: number, _grid: number): number {
  return m;
}

export function lv95Line(
  _position: {
    lat: number;
    lon: number;
    precision: CoordinatePrecision;
    approximate: boolean;
  } | null,
  _country: string
): string | null {
  return null;
}
