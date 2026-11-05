/**
 * Pure formatters for the footer map-sheet margin (SHELL-04, D-18 to D-20;
 * 08-UI-SPEC "Formatting rules" and "Scale bar (true at every breakpoint)").
 *
 * Import-free and locale-free on purpose: SiteFooter also renders inside the
 * client-rendered global-error, and Node and browser ICU data can group or
 * name things differently, which would cause hydration mismatches and
 * baseline drift. So no locale-aware number or date APIs here, only fixed
 * rounding and fixed name tables.
 */

const NBSP = ' ';
/** Swiss thousands separator (RIGHT SINGLE QUOTATION MARK). */
const GROUP = '’';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** An LV95 (EPSG:2056) bounding box in metres. */
export interface Lv95Box {
  west: number;
  south: number;
  east: number;
  north: number;
}

/** Whole metres (round half up), grouped with U+2019: 2616000 -> "2’616’000". */
export function formatLv95(m: number): string {
  const digits = String(Math.floor(m + 0.5));
  return digits.replace(/\B(?=(\d{3})+$)/g, GROUP);
}

/** The SW and NE corners, easting first: ["SW 2’616’000, 1’088’000", "NE …"]. */
export function formatExtentLines(b: Lv95Box): [string, string] {
  return [
    `SW ${formatLv95(b.west)}, ${formatLv95(b.south)}`,
    `NE ${formatLv95(b.east)}, ${formatLv95(b.north)}`,
  ];
}

/** A `YYYY-MM` DEM edition as "May 2026". Throws on anything else (no fallback UI). */
export function formatMonthYear(edition: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(edition);
  const month = match ? Number(match[2]) : 0;
  if (!match || month < 1 || month > 12) {
    throw new Error(`invalid DEM edition "${edition}" (expected YYYY-MM)`);
  }
  return `${MONTHS[month - 1]} ${match[1]}`;
}

/** Contour interval as integer metres with a no-break space: 100 -> "100 m". */
export function formatEquidistance(intervalM: number): string {
  return `${Math.round(intervalM)}${NBSP}m`;
}

export interface ScaleTier {
  lengthM: 2000 | 1000 | 500;
  /** First viewport width (CSS px) the tier is shown at. */
  fromPx: number;
  /** Last viewport width it is shown at; null = no upper bound. */
  toPx: number | null;
  /** Labels at 0, half and the full length; U+00A0 before the unit keeps "2 km" whole. */
  labels: readonly [string, string, string];
  /** The one announced name of the visible tier (the visual labels are aria-hidden). */
  srText: string;
}

/**
 * Scale-bar length tiers (UI-SPEC): 2 km below 1024 px, 1 km from 1024 to
 * 1791 px, 500 m from 1792 px. SiteFooter's variant classes follow these
 * bounds: `lg:` (64rem = 1024 px) and `min-[112rem]:` (1792 px). The rem form
 * is deliberate: Tailwind orders same-unit min-width variants by value, while a
 * px arbitrary value is emitted before `lg:`, so `lg:flex` would override
 * `min-[1792px]:hidden` and show two tiers at once.
 */
export const SCALE_TIERS: readonly ScaleTier[] = [
  { lengthM: 2000, fromPx: 0, toPx: 1023, labels: ['0', '1', `2${NBSP}km`], srText: 'Scale bar, 2 km' },
  { lengthM: 1000, fromPx: 1024, toPx: 1791, labels: ['0', '500', `1${NBSP}km`], srText: 'Scale bar, 1 km' },
  { lengthM: 500, fromPx: 1792, toPx: null, labels: ['0', '250', `500${NBSP}m`], srText: 'Scale bar, 500 m' },
];

/**
 * The bar's share of the footer width, `L / extentWidthM`, with 6 decimals
 * (fixed-point, not locale-dependent): (2000, 11000) -> "0.181818". The band
 * shows the full extent across the footer, so `calc(100cqw * f)` is true.
 */
export function scaleFraction(lengthM: number, extentWidthM: number): string {
  return (lengthM / extentWidthM).toFixed(6);
}

/** Count of leading digits of a scale label ("2 km" -> 1, "500" -> 3). */
function leadingDigits(label: string): number {
  return /^\d*/.exec(label)![0].length;
}

/**
 * Left offset of a scale label, centred on its tick by its leading digit
 * count (mono digits are exactly 1ch): (50, "500") -> "calc(50% - 1.5ch)".
 */
export function labelLeft(tickPercent: 0 | 50 | 100, label: string): string {
  return `calc(${tickPercent}% - ${leadingDigits(label) * 0.5}ch)`;
}

/**
 * Left offset of a waypoint tick on the band, from the photo's terrain U
 * (D-20): `u x 100` rounded to 2 decimals of percent, written in the shortest
 * form (the form browsers serialise back), so 0.6775 -> "67.75%" and
 * 0.657 -> "65.7%". Number-to-string is fixed by ECMAScript, not by locale.
 */
export function tickLeft(u: number): string {
  return `${Math.round(u * 10000) / 100}%`;
}

/** The footer container: max-w-6xl. */
const CONTAINER_PX = 1152;
/** gap-x-8. */
const COLUMN_GAP_PX = 32;
/**
 * One `ch` of JetBrains Mono at text-sm (14 px): its advance width is
 * 600/1000 em, so 8.4 px. Used only to size the end-label overrun.
 */
const MONO_CH_PX = 8.4;

/** Horizontal padding per side: px-4 below 640, sm:px-6, lg:px-8 from 1024. */
function gutterPx(viewportPx: number): number {
  if (viewportPx >= 1024) return 32;
  if (viewportPx >= 640) return 24;
  return 16;
}

/**
 * Width of one sheet-margin grid cell at a viewport width (UI-SPEC "Minimum
 * cell widths"): the max-w-6xl container minus its gutters, split into 2
 * columns below 1024 px and 4 from 1024 px with a 32 px gap.
 * 375 -> 155.5, 768 -> 344, 1024 -> 216, 1440 -> 248.
 */
export function cellWidthPx(viewportPx: number): number {
  const content = Math.min(viewportPx, CONTAINER_PX) - 2 * gutterPx(viewportPx);
  const columns = viewportPx >= 1024 ? 4 : 2;
  return (content - (columns - 1) * COLUMN_GAP_PX) / columns;
}

/** Bar plus the part of the end label that runs past it, in px, at a viewport width. */
function scaleExtentPx(tier: ScaleTier, viewportPx: number, extentWidthM: number): number {
  const bar = (viewportPx * tier.lengthM) / extentWidthM;
  const endLabel = tier.labels[2];
  const overrun = (endLabel.length - leadingDigits(endLabel) * 0.5) * MONO_CH_PX;
  return bar + overrun;
}

/**
 * True when, at every viewport from 320 to 4096 px, the visible tier's bar
 * plus its end-label overrun fits the Scale cell (E4 overflow backstop). The
 * footer width is taken as the viewport width; a desktop scrollbar gutter
 * narrows the footer, which shrinks the bar and the cell together.
 */
export function scaleFits(extentWidthM: number): boolean {
  for (let v = 320; v <= 4096; v++) {
    const tier = SCALE_TIERS.find((t) => v >= t.fromPx && (t.toPx === null || v <= t.toPx))!;
    if (scaleExtentPx(tier, v, extentWidthM) > cellWidthPx(v)) return false;
  }
  return true;
}
