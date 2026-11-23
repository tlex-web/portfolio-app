/**
 * The plate fetchers' shared argument and extent rules (16-REVIEW IN-08):
 * fetch-dem (swisstopo, LV95) and fetch-bev (BEV, EPSG:3035) refuse a plate
 * extent by the same rules, and all three fetchers parse their options the
 * same way. A rule change, such as the square or the 20 km limit, is made here
 * once.
 *
 * Side-effect free: importing it reads nothing and writes nothing. Every
 * refusal throws an Error whose message the caller prints after its own name,
 * as each script's `fail` does.
 */

import path from 'node:path';

/** The largest plate side, in metres (16 plate budgets). */
export const MAX_SIDE_M = 20000;
/** The plate source cell, in metres: every extent edge lies on this grid. */
export const CELL_M = 10;

function fail(msg) {
  throw new Error(msg);
}

/** `force-home` -> `forceHome`: an option name as its key in the parsed result. */
const keyOf = (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/**
 * `argv` parsed against `spec`: `values` are options that take a value
 * (`--plate <id>`), `flags` are booleans (`--force-home`), both named without
 * the leading dashes. Each value starts as null and each flag as false. A value
 * option without a value, or followed by another option, fails with `usage`; a
 * value option given twice fails; any other argument fails with `usage`. A flag
 * given twice is still true.
 */
export function parseArgs(argv, { values = [], flags = [], usage }) {
  const opts = {};
  for (const name of values) opts[keyOf(name)] = null;
  for (const name of flags) opts[keyOf(name)] = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const name = arg.startsWith('--') ? arg.slice(2) : null;
    if (name !== null && flags.includes(name)) {
      opts[keyOf(name)] = true;
    } else if (name !== null && values.includes(name)) {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) fail(`${arg} needs a value (${usage})`);
      const key = keyOf(name);
      if (opts[key] !== null) fail(`${arg} given twice`);
      opts[key] = value;
      i++;
    } else {
      fail(`unknown argument ${arg} (${usage})`);
    }
  }
  return opts;
}

/** Null when `e` is a square plate extent on the 10 m grid, at most MAX_SIDE_M a side; else the rule it breaks. */
export function extentProblem(e) {
  if (!(e.west < e.east && e.south < e.north)) return 'needs west < east and south < north';
  const w = e.east - e.west;
  const h = e.north - e.south;
  if (w !== h) return `must be square (got ${w} x ${h} m; RESEARCH Pitfall 10)`;
  if (w > MAX_SIDE_M) return `side ${w} m is over the ${MAX_SIDE_M} m limit`;
  if ([e.west, e.south, e.east, e.north].some((v) => v % CELL_M !== 0))
    return `edges must lie on the ${CELL_M} m grid (whole ${CELL_M} m cells)`;
  return null;
}

/** `W,S,E,N` as four integers, checked by extentProblem. */
export function parseExtent(text) {
  const parts = text.split(',');
  if (parts.length !== 4 || !parts.every((p) => /^-?\d+$/.test(p)))
    fail(`--extent must be four integers W,S,E,N (got ${text})`);
  const [west, south, east, north] = parts.map(Number);
  const extent = { west, south, east, north };
  const problem = extentProblem(extent);
  if (problem) fail(`--extent ${problem}`);
  return extent;
}

/** True when two extents have the same four edges. */
export const sameExtent = (a, b) =>
  a.west === b.west && a.south === b.south && a.east === b.east && a.north === b.north;

/** An extent as `W,S,E,N`, the form --extent takes. */
export const extentText = (e) => `${e.west},${e.south},${e.east},${e.north}`;

/** `dir` relative to `root` (the repository) when inside it, else absolute; forward slashes. */
export function shown(root, dir) {
  const rel = path.relative(root, dir);
  const inside = rel && !rel.startsWith('..') && !path.isAbsolute(rel);
  return (inside ? rel : dir).split(path.sep).join('/');
}
