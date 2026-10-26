#!/usr/bin/env node

/**
 * Guard (GUARD-05): WCAG contrast of the semantic colour tokens, read from globals.css
 *
 * Reads every token from the stylesheet itself (never a hand-copied table):
 *   1. extracts the declarations of every `:root { }`, `@theme { }`,
 *      `@theme inline { }` and `@theme static { }` block (these blocks hold no
 *      nested braces), after stripping comments
 *   2. resolves `var(--x)` chains recursively, failing on a cycle
 *   3. parses the colour with colorjs.io (OKLCH and every CSS colour syntax) and
 *      measures `fg.contrast(bg, 'WCAG21')`
 *
 * Every `--color-*` name is classified:
 *   - SEMANTIC:   the L2 tokens from 07-UI-SPEC.md "Color", plus accent-strong
 *                 (08-05: the v2 name for v1 frost-600, gradient stops and badge fills)
 *   - ALIAS:      v1 names (alpine, granite, snow, frost, ember, pine, rust), skipped
 *   - DECORATIVE: line and contour, exempt from measurement (UI-SPEC "Exempt")
 *   Any other `--color-*` name fails as unknown. Adding a semantic token means
 *   adding it here and its pairs to PAIRS in the same commit.
 *
 * PAIRS follow the UI-SPEC table order, so the report is deterministic: text pairs
 * need 4.5:1, non-text pairs 3:1. After the 07 table and the 08-05 accent-strong
 * pairs come the four gallery pairs of the photo viewer (10-03; 10-UI-SPEC
 * "Color"): accent/gallery and gallery/ink as text, focus/gallery and
 * line-strong/gallery as non-text. Ratios are compared as raw floats with >=, so a
 * ratio exactly at the threshold passes and one 0.01 below fails. A pair whose
 * token is missing fails, as does a measured token with alpha below 1.
 *
 * Usage:
 *   node scripts/guards/check-contrast.mjs [--css <file>]   (default app/globals.css)
 *   (Runs from `npm run lint` via `npm run guard:contrast`)
 *
 * Exit code 1 on any failure.
 */

import Color from 'colorjs.io';
import fs from 'fs';
import path from 'path';

const SEMANTIC = [
  'surface',
  'surface-raised',
  'surface-overlay',
  'gallery',
  'ink',
  'ink-muted',
  'ink-inverse',
  'line',
  'line-strong',
  'accent',
  'accent-hover',
  'accent-strong',
  'focus',
  'danger',
  'caution',
  'success',
  'contour',
];
const DECORATIVE = new Set(['line', 'contour']);
const ALIAS = /^--color-(alpine|granite|snow|frost|ember|pine|rust)-/;

const TEXT = 4.5;
const NON_TEXT = 3;
const SURFACES = ['surface', 'surface-raised', 'surface-overlay'];
const pairs = (fgs, bgs, min) => fgs.flatMap((fg) => bgs.map((bg) => ({ fg, bg, min })));

// UI-SPEC "Contrast pairs the CI check must read from globals.css (GUARD-05)", in table order
const PAIRS = [
  ...pairs(['ink', 'ink-muted'], [...SURFACES, 'gallery'], TEXT),
  ...pairs(['accent', 'danger', 'caution', 'success'], SURFACES, TEXT),
  ...pairs(['ink-inverse'], ['accent', 'accent-hover'], TEXT),
  ...pairs(['focus', 'line-strong'], SURFACES, NON_TEXT),
  ...pairs(['ink-inverse'], ['accent-strong'], TEXT),
  ...pairs(['accent-strong'], SURFACES, NON_TEXT),
  // 10-UI-SPEC "Color": the photo viewer on gallery black (source links, pressed
  // toggles and hotspot dots, the focus ring, button and plate borders)
  ...pairs(['accent'], ['gallery'], TEXT),
  ...pairs(['gallery'], ['ink'], TEXT),
  ...pairs(['focus', 'line-strong'], ['gallery'], NON_TEXT),
];

const BLOCK = /(:root|@theme(?:\s+(?:inline|static))*)\s*\{([^{}]*)\}/g;
const VAR = /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/;

function parseArgs(argv) {
  let css = path.resolve('app', 'globals.css');
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--css' && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      css = path.resolve(argv[++i]);
    } else {
      console.error(`contrast: unknown argument ${argv[i]}`);
      console.error('usage: check-contrast.mjs [--css <file>]');
      process.exit(1);
    }
  }
  return css;
}

/** Collects the custom properties of every :root and @theme block (later declarations win). */
function readTokens(source) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = new Map();
  let blocks = 0;
  for (const [, , body] of text.matchAll(BLOCK)) {
    blocks++;
    for (const decl of body.split(';')) {
      const colon = decl.indexOf(':');
      if (colon === -1) continue;
      const name = decl.slice(0, colon).trim();
      if (name.startsWith('--')) tokens.set(name, decl.slice(colon + 1).trim());
    }
  }
  return { tokens, blocks };
}

/** Resolves var() references recursively; throws on a cycle or an undeclared variable. */
function resolve(tokens, name, seen = []) {
  if (seen.includes(name)) throw new Error(`var() cycle: ${[...seen, name].join(' -> ')}`);
  if (!tokens.has(name)) throw new Error(`${name} is not declared in a :root or @theme block`);
  let value = tokens.get(name);
  let m;
  while ((m = value.match(VAR))) {
    const replacement = tokens.has(m[1]) || m[2] === undefined ? resolve(tokens, m[1], [...seen, name]) : m[2].trim();
    value = value.replace(m[0], replacement);
  }
  return value;
}

function main() {
  const cssFile = parseArgs(process.argv.slice(2));
  const rel = path.relative(process.cwd(), cssFile) || cssFile;
  const { tokens, blocks } = readTokens(fs.readFileSync(cssFile, 'utf-8'));
  const failures = [];

  if (blocks === 0) {
    console.log(`${rel}: no :root or @theme block found`);
    console.log('contrast: 1 failures');
    process.exit(1);
  }

  for (const name of tokens.keys()) {
    if (!name.startsWith('--color-') || ALIAS.test(name)) continue;
    if (!SEMANTIC.includes(name.slice('--color-'.length))) failures.push(`unknown token ${name}`);
  }

  const colors = new Map();
  /** Returns the parsed colour of a semantic token, or records why it cannot be measured. */
  const colorOf = (token) => {
    if (colors.has(token)) return colors.get(token);
    let color = null;
    try {
      color = new Color(resolve(tokens, `--color-${token}`));
      if (color.alpha < 1) throw new Error(`--color-${token} has alpha ${color.alpha}; alpha tokens are decorative, never measured`);
    } catch (err) {
      color = { error: err.message };
    }
    colors.set(token, color);
    return color;
  };

  for (const { fg, bg, min } of PAIRS) {
    if (DECORATIVE.has(fg) || DECORATIVE.has(bg)) throw new Error(`decorative token in PAIRS: ${fg}/${bg}`);
    const label = `${fg}/${bg}`;
    if (!tokens.has(`--color-${fg}`) || !tokens.has(`--color-${bg}`)) {
      console.log(`${label} - ${min} FAIL`);
      failures.push(`missing token for pair ${label}`);
      continue;
    }
    const a = colorOf(fg);
    const b = colorOf(bg);
    const broken = [a, b].find((c) => c.error);
    if (broken) {
      console.log(`${label} - ${min} FAIL`);
      failures.push(`${label}: ${broken.error}`);
      continue;
    }
    const ratio = a.contrast(b, 'WCAG21');
    const pass = ratio >= min;
    console.log(`${label} ${ratio.toFixed(2)} ${min} ${pass ? 'PASS' : 'FAIL'}`);
    if (!pass) failures.push(`${label} ${ratio.toFixed(4)} is below ${min}:1`);
  }

  for (const f of failures) console.log(f);
  console.log(failures.length === 0 ? `contrast: OK (${PAIRS.length} pairs)` : `contrast: ${failures.length} failures`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main();
