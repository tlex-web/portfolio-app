/**
 * Home display formatters (HOME-01, HOME-06; 09-UI-SPEC "Typography").
 * RED-phase stubs: signatures only, implemented in the GREEN commit.
 */
export type CaptureLike =
  | { precision: 'second'; local: string }
  | { precision: 'year'; year: number };

export function formatLatLon(_p: { lat: number; lon: number }): string {
  return '';
}

export function formatCaptureMonth(_capture: CaptureLike): string {
  return '';
}

export function formatKilometres(_m: number): string {
  return '';
}

export function formatYearRange(_years: readonly number[]): string {
  return '';
}

export function countLabel(_n: number, _one: string, _many: string): string {
  return '';
}

export function shortPlace(_location: string, _overrideName?: string | null): string {
  return '';
}
