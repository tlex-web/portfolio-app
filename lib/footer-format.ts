/**
 * Pure formatters for the footer map-sheet margin (SHELL-04, D-18 to D-20;
 * 08-UI-SPEC "Formatting rules").
 *
 * Import-free and locale-free on purpose: SiteFooter also renders inside the
 * client-rendered global-error, and Node and browser ICU data can group or
 * name things differently, which would cause hydration mismatches and
 * baseline drift. So no locale-aware number or date APIs here, only fixed
 * rounding and fixed name tables.
 */

/**
 * Left offset of a waypoint tick on the band, from the photo's terrain U
 * (D-20): `u x 100` rounded to 2 decimals of percent, written in the shortest
 * form (the form browsers serialise back), so 0.6775 -> "67.75%" and
 * 0.657 -> "65.7%". Number-to-string is fixed by ECMAScript, not by locale.
 */
export function tickLeft(u: number): string {
  return `${Math.round(u * 10000) / 100}%`;
}
