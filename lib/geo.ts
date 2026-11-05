/**
 * DATA-01 coordinate contract: WGS84 <-> Swiss LV95 (EPSG:2056) <-> terrain UV.
 *
 * Every terrain consumer (contour SVGs, photo positions, footer ticks, the
 * Phase 9/10 surfaces) reads positions through this one module, so there is
 * exactly one UV convention: u runs east, v runs south (row 0 = north, the same
 * as GeoTIFF rows and SVG y-down), with no flip anywhere.
 *
 * Pure and import-free on purpose (RESEARCH Pattern 1): Node 24 type-strips it
 * when a scripts/*.mjs generator imports `lib/geo.ts`, and Jest/tsc test it
 * normally. Keep it to erasable TypeScript (no enum, namespace or parameter
 * properties) and never add an import.
 */

export type Wgs84 = { lat: number; lon: number };
export type Lv95 = { e: number; n: number };
export type Bbox = { west: number; south: number; east: number; north: number };

/**
 * WGS84 -> LV95 with swisstopo's approximate formulas (~1 m; verified to
 * <= 0.14 m against swisstopo REFRAME at three Zermatt points).
 */
export function wgs84ToLv95({ lat, lon }: Wgs84): Lv95 {
  const p = (lat * 3600 - 169028.66) / 10000;
  const l = (lon * 3600 - 26782.5) / 10000;
  return {
    e: 2600072.37 + 211455.93 * l - 10938.51 * l * p - 0.36 * l * p * p - 44.54 * l ** 3,
    n:
      1200147.07 +
      308807.95 * p +
      3745.25 * l * l +
      76.63 * p * p -
      194.56 * l * l * p +
      119.79 * p ** 3,
  };
}

/** LV95 -> WGS84 with swisstopo's approximate formulas (~1 m). */
export function lv95ToWgs84({ e, n }: Lv95): Wgs84 {
  const y = (e - 2600000) / 1e6;
  const x = (n - 1200000) / 1e6;
  const l = 2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x * x - 0.0436 * y ** 3;
  const p =
    16.9023892 +
    3.238272 * x -
    0.270978 * y * y -
    0.002528 * x * x -
    0.0447 * y * y * x -
    0.014 * x ** 3;
  return { lat: (p * 100) / 36, lon: (l * 100) / 36 };
}

/** LV95 -> terrain UV in extent `x`: u east, v south; (0, 0) is the north-west corner. */
export function lv95ToUv({ e, n }: Lv95, x: Bbox): { u: number; v: number } {
  return { u: (e - x.west) / (x.east - x.west), v: (x.north - n) / (x.north - x.south) };
}

/** Terrain UV -> LV95 in extent `x`; the inverse of {@link lv95ToUv}. */
export function uvToLv95({ u, v }: { u: number; v: number }, x: Bbox): Lv95 {
  return { e: x.west + u * (x.east - x.west), n: x.north - v * (x.north - x.south) };
}

/**
 * Rounds to 4 decimals (~10 m in latitude), the shipped precision for photo
 * coordinates (DATA-06). Half-up, which is exact here: every coordinate in the
 * extent is positive.
 */
export function round4(v: number): number {
  return Math.round(v * 1e4) / 1e4;
}

/**
 * The footer strip bbox (UI-SPEC "Contour band", asset geometry): the full
 * extent width, `width / ratio` tall, centred on the summit northing and
 * snapped to `snapM`. When the summit lies within half a strip height of the
 * south or north edge (one tenth of the extent width at ratio 5), the strip
 * shifts inside the extent and keeps its height.
 *
 * @throws RangeError when the extent is shorter than the strip.
 */
export function stripBbox(extent: Bbox, summitN: number, ratio = 5, snapM = 100): Bbox {
  const height = (extent.east - extent.west) / ratio;
  if (!(height > 0) || height > extent.north - extent.south) {
    throw new RangeError(
      `stripBbox: a ${height} m strip does not fit the extent's ${extent.north - extent.south} m height`
    );
  }
  let south = Math.round((summitN - height / 2) / snapM) * snapM;
  if (south + height > extent.north) south = extent.north - height;
  if (south < extent.south) south = extent.south;
  return { west: extent.west, south, east: extent.east, north: south + height };
}
