#!/usr/bin/env node

/**
 * Shader colour tokens (D-17, 09-UI-SPEC "Night-tinted relief"): app/globals.css
 * -> data/generated/tokens.ts, so the Home terrain shader paints the same ground,
 * contour and relief values as the CSS poster and no hex is typed into a
 * Three.js material (GUARD-04 intent).
 *
 * Input: app/globals.css only. The declarations of every `:root`, `@theme`,
 * `@theme inline` and `@theme static` block are collected after stripping
 * comments (the same BLOCK rule as scripts/guards/check-contrast.mjs; later
 * declarations win), and `var(--x)` chains are resolved recursively, failing on
 * a cycle or an undeclared variable.
 *
 * Output: data/generated/tokens.ts, an import-free module (the lazy terrain chunk
 * can import it without pulling anything else):
 *   hex.{night950, night900, firn50, mist300, glacier400}   lowercase #rrggbb from
 *        the gamut-mapped sRGB coords, each channel Math.round(c * 255)
 *   srgb.{same keys}   [r, g, b] sRGB-encoded floats in 0-1, rounded to 6 decimals
 *        (colorjs.io: new Color(value).to('srgb').toGamut())
 *   contourAlpha        the alpha of --color-contour (index lines)
 *   contourMinorAlpha   contourAlpha x 0.6, rounded to 6 decimals (intermediate
 *                       lines, the stroke-opacity 0.6 of the 08 contour SVGs)
 *   reliefOpacity       Number(--relief-opacity)
 *
 * A missing token, a non-finite number or an alpha/opacity outside 0-1 fails with
 * `tokens: <token>: <problem>` (exit 1).
 *
 * Modes:
 *   (default)  write data/generated/tokens.ts, then `tokens: OK`.
 *   --check    build the same text in memory and compare it byte for byte with the
 *              committed file: `tokens: OK` (exit 0) or
 *              `tokens: stale data/generated/tokens.ts` (exit 1).
 *   Any other argument prints a usage line (exit 1).
 *
 * Usage:
 *   npm run tokens:build               (write)
 *   npm run tokens:build -- --check    (part of npm run data:check / lint)
 *
 * Exit codes: 0 OK, 1 stale output, bad token or bad argument.
 */

import Color from 'colorjs.io';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const NAME = 'tokens';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS_REL = 'app/globals.css';
const OUT_REL = 'data/generated/tokens.ts';
const CSS_PATH = path.join(ROOT, CSS_REL);
const OUT_PATH = path.join(ROOT, OUT_REL);

/** Output key -> L1 primitive in :root (UI-SPEC "Night-tinted relief" colour list). */
const COLORS = {
  night950: '--night-950',
  night900: '--night-900',
  firn50: '--firn-50',
  mist300: '--mist-300',
  glacier400: '--glacier-400',
};
const CONTOUR = '--color-contour';
const RELIEF = '--relief-opacity';
const MINOR_FACTOR = 0.6;

const BLOCK = /(:root|@theme(?:\s+(?:inline|static))*)\s*\{([^{}]*)\}/g;
const VAR = /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/;

class TokenError extends Error {
  constructor(token, problem) {
    super(`${token}: ${problem}`);
  }
}

/** Collects the custom properties of every :root and @theme block (later declarations win). */
function readTokens(source) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = new Map();
  for (const [, , body] of text.matchAll(BLOCK)) {
    for (const decl of body.split(';')) {
      const colon = decl.indexOf(':');
      if (colon === -1) continue;
      const name = decl.slice(0, colon).trim();
      if (name.startsWith('--')) tokens.set(name, decl.slice(colon + 1).trim());
    }
  }
  return tokens;
}

/** Resolves var() references recursively; throws on a cycle or an undeclared variable. */
function resolve(tokens, name, seen = []) {
  if (seen.includes(name))
    throw new TokenError(seen[0], `var() cycle ${[...seen, name].join(' -> ')}`);
  if (!tokens.has(name)) {
    throw new TokenError(
      seen[0] ?? name,
      seen.length ? `references undeclared ${name}` : 'missing'
    );
  }
  let value = tokens.get(name);
  let m;
  while ((m = value.match(VAR))) {
    const replacement =
      tokens.has(m[1]) || m[2] === undefined ? resolve(tokens, m[1], [...seen, name]) : m[2].trim();
    value = value.replace(m[0], replacement);
  }
  return value;
}

const round6 = (x) => {
  const r = Number(x.toFixed(6));
  return Object.is(r, -0) ? 0 : r;
};

function parseColor(token, value) {
  try {
    return new Color(value);
  } catch (err) {
    throw new TokenError(token, `not a colour (${value}): ${err.message}`);
  }
}

function unitInterval(token, what, x) {
  if (typeof x !== 'number' || !Number.isFinite(x))
    throw new TokenError(token, `${what} is not a finite number`);
  if (x < 0 || x > 1) throw new TokenError(token, `${what} ${x} is outside 0-1`);
  return x;
}

/** Builds the token value from the stylesheet text; throws TokenError on any bad input. */
function buildValue(css) {
  const tokens = readTokens(css);
  const hex = {};
  const srgb = {};
  for (const [key, token] of Object.entries(COLORS)) {
    const color = parseColor(token, resolve(tokens, token));
    unitInterval(token, 'alpha', color.alpha);
    if (color.alpha !== 1)
      throw new TokenError(token, `alpha ${color.alpha}; shader ground colours must be opaque`);
    const coords = color.to('srgb').toGamut().coords;
    const channels = coords.map((c, i) => {
      if (typeof c !== 'number' || !Number.isFinite(c))
        throw new TokenError(token, `sRGB channel ${i} is not a finite number`);
      return Math.min(1, Math.max(0, c));
    });
    srgb[key] = channels.map(round6);
    hex[key] = `#${channels
      .map((c) =>
        Math.round(c * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')}`;
  }

  const contour = parseColor(CONTOUR, resolve(tokens, CONTOUR));
  const contourAlpha = round6(unitInterval(CONTOUR, 'alpha', contour.alpha));
  const contourMinorAlpha = round6(contourAlpha * MINOR_FACTOR);

  const reliefText = resolve(tokens, RELIEF);
  // Number('') is 0, so an empty value must not pass as a valid opacity.
  const reliefOpacity = unitInterval(
    RELIEF,
    'value',
    reliefText.trim() === '' ? NaN : Number(reliefText)
  );

  return { hex, srgb, contourAlpha, contourMinorAlpha, reliefOpacity };
}

function render(value) {
  return [
    `// AUTO-GENERATED by scripts/tokens/build-tokens.mjs from ${CSS_REL}. Do not edit.`,
    '// sRGB-encoded constants for the Home terrain shader (09-UI-SPEC "Night-tinted relief"); no imports, client-safe.',
    `export const tokens = ${JSON.stringify(value, null, 2)} as const;`,
    '',
  ].join('\n');
}

function build() {
  return render(buildValue(fs.readFileSync(CSS_PATH, 'utf8')));
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => a !== '--check');
  if (unknown.length > 0) {
    console.log(`${NAME}: unknown argument(s) ${unknown.join(' ')}`);
    console.log('usage: build-tokens.mjs [--check]');
    process.exit(1);
  }

  let text;
  try {
    text = build();
  } catch (err) {
    if (err instanceof TokenError) {
      console.log(`${NAME}: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  if (args.includes('--check')) {
    const fresh = fs.existsSync(OUT_PATH) && fs.readFileSync(OUT_PATH, 'utf8') === text;
    console.log(fresh ? `${NAME}: OK` : `${NAME}: stale ${OUT_REL}`);
    process.exit(fresh ? 0 : 1);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, text, 'utf8');
  console.log(`${NAME}: wrote ${OUT_REL} (${Buffer.byteLength(text)} bytes)`);
  console.log(`${NAME}: OK`);
}

main();
