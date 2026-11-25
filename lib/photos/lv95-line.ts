import type { Country } from '@/data/schemas/photo';
import { formatLv95 } from '@/lib/footer-format';
import { wgs84ToLv95 } from '@/lib/geo';
import { roundedCoordinate, type CoordinatePrecision } from '@/lib/home-format';

/**
 * The viewer strip's LV95 line (PHOTO-08; 18 D-14, D-15; 18-UI-SPEC Contract
 * 4; 18-RESEARCH Pitfall 4). Pure, and run on the server only: stripFields in
 * lib/photos/view-model.ts calls it while building the photo views, so the
 * client receives the finished string and never ships the conversion.
 */

/** The LV95 grid each WGS84 precision prints at, in metres (D-15): never finer than the shown degrees. */
export const LV95_GRID_M = { '4dp': 10, '3dp': 100, '2dp': 1000 } as const satisfies Record<
  CoordinatePrecision,
  number
>;

/** `m` on the grid: Math.round(m / grid) * grid, so a value exactly halfway rounds up. */
export function snapLv95(m: number, grid: number): number {
  return Math.round(m / grid) * grid;
}

/** The position fields the line reads (a structural view of a generated photo position). */
export type Lv95LineInput = {
  lat: number;
  lon: number;
  precision: CoordinatePrecision;
  approximate: boolean;
};

/**
 * 'LV95 E 2’…’… N 1’…’…' (easting first, U+2019 grouping), or 'LV95 ≈ E …'
 * for an approximate position; null for any country but CH (LI included: the
 * rule is the country code, D-14) and for a photo without a position.
 *
 * The input is the WGS84 the page already shows, not the stored value: each
 * half is first rounded to its precision exactly as the strip prints it
 * (roundedCoordinate), converted with wgs84ToLv95 and then snapped to that
 * precision's grid. The output is therefore a function of the shown digits
 * alone and can never reveal more than they do (T-18-38).
 */
export function lv95Line(position: Lv95LineInput | null, country: Country): string | null {
  if (country !== 'CH' || position === null) return null;
  const { precision } = position;
  const shown = {
    lat: Number(roundedCoordinate(position.lat, precision)),
    lon: Number(roundedCoordinate(position.lon, precision)),
  };
  const { e, n } = wgs84ToLv95(shown);
  const grid = LV95_GRID_M[precision];
  return `LV95 ${position.approximate ? '≈ ' : ''}E ${formatLv95(snapLv95(e, grid))} N ${formatLv95(snapLv95(n, grid))}`;
}
