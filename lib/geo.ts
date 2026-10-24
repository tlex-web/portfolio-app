/** DATA-01 coordinate contract (RED skeleton: signatures only, bodies land in the GREEN commit). */

export type Wgs84 = { lat: number; lon: number };
export type Lv95 = { e: number; n: number };
export type Bbox = { west: number; south: number; east: number; north: number };

export function wgs84ToLv95(_p: Wgs84): Lv95 {
  return { e: NaN, n: NaN };
}

export function lv95ToWgs84(_p: Lv95): Wgs84 {
  return { lat: NaN, lon: NaN };
}

export function lv95ToUv(_p: Lv95, _x: Bbox): { u: number; v: number } {
  return { u: NaN, v: NaN };
}

export function uvToLv95(_uv: { u: number; v: number }, _x: Bbox): Lv95 {
  return { e: NaN, n: NaN };
}

export function round4(v: number): number {
  return v;
}

export function stripBbox(extent: Bbox, _summitN: number, _ratio = 5, _snapM = 100): Bbox {
  return { ...extent };
}
