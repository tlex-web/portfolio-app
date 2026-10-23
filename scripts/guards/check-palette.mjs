#!/usr/bin/env node

/**
 * Guard (GUARD-04, DSGN-10): palette, dark: variant and white/black ratchet
 *
 * A raw-text scan, so object maps, template literals, data files, tests and
 * CSS @apply lines are all covered. Scans <root>/{app,components,lib,data,e2e}
 * recursively (every __tests__ directory inside them included) for
 * .ts .tsx .mjs .js .css files, skipping node_modules and *-snapshots dirs.
 *
 * Rule families (each violation prints `<file>:<line> <rule> <match>`):
 *   - dark:     any `dark:` variant
 *   - stock:    any stock Tailwind palette class (bg-red-500, hover:text-cyan-400/50, ...)
 *   - variant:  a `@custom-variant dark` line in any CSS file
 *   - wb:       per-file white/black utility count above its palette-ratchet.json
 *               entry (no entry means 0); a count below the entry also fails
 *               until `--update` records it, so the ratchet only tightens
 *   - png:      any .png under <root>/e2e whose name does not end in -linux.png
 *   - v1names:  a v1 alias name (frost-500, alpine-900, ...) in the new shell
 *               files: components/site/**, components/providers/**, data/site.ts
 *   - emoji:    Extended_Pictographic in .ts/.tsx/.js/.mjs files, except the
 *               copyright, registered and trademark signs, plus the check marks
 *               U+2713, U+2714, U+2717 and U+2718 (the prompt glyph U+276F is allowed)
 *
 * Without --update the script only reads, so parallel or interrupted runs can
 * never corrupt the ratchet. --update writes the current per-file white/black
 * counts (sorted keys) and exits 1 without writing if any count is higher than
 * its existing entry. When the ratchet file does not exist, --update creates it.
 *
 * Usage:
 *   node scripts/guards/check-palette.mjs [--root <dir>] [--ratchet <file>]
 *     [--skip <rule,...>] [--update]
 *   (Runs from `npm run lint` via `npm run guard:palette`, with --skip emoji until 07-25)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Regexes verbatim from 07-RESEARCH.md "Pattern 2" (they produced the audited counts)
const FAM = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const PRE = 'bg|text|border|ring|outline|from|via|to|fill|stroke|divide|placeholder|decoration|shadow|accent|caret';
const STOCK = new RegExp(`(?<![\\w-])(?:[\\w-]+:)*(?:${PRE})-(?:${FAM})-\\d{2,3}(?:\\/\\d+)?\\b`, 'g');
const DARK = /(?<![\w-])dark:/g;
const WB = new RegExp(`(?<![\\w-])(?:[\\w-]+:)*(?:${PRE})-(?:white|black)(?:\\/\\d+)?\\b`, 'g');

const VARIANT = /@custom-variant\s+dark\b/g;
const V1NAMES = /(alpine|granite|snow|frost|ember|pine|rust)-[0-9]/g;
// Extended_Pictographic minus (c), (r) and TM, plus the check and cross marks it misses
const EMOJI = /(?![©®™])\p{Extended_Pictographic}|[✓✔✗✘]/gu;

const RULES = ['dark', 'stock', 'wb', 'variant', 'png', 'v1names', 'emoji'];
const SCAN_DIRS = ['app', 'components', 'lib', 'data', 'e2e'];
const TEXT_EXT = new Set(['.ts', '.tsx', '.mjs', '.js', '.css']);
const SCRIPT_EXT = new Set(['.ts', '.tsx', '.mjs', '.js']);
const DEFAULT_RATCHET = fileURLToPath(new URL('./palette-ratchet.json', import.meta.url));
const UPDATE_HINT = 'ratchet can tighten: run npm run guard:palette -- --update';

function usage(message) {
  console.error(`palette: ${message}`);
  console.error('usage: check-palette.mjs [--root <dir>] [--ratchet <file>] [--skip <rule,...>] [--update]');
  process.exit(1);
}

function parseArgs(argv) {
  const args = { root: null, ratchet: null, skip: new Set(), update: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--update') {
      args.update = true;
      continue;
    }
    if (!['--root', '--ratchet', '--skip'].includes(flag)) usage(`unknown argument ${flag}`);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) usage(`${flag} needs a value`);
    i++;
    if (flag === '--skip') {
      for (const rule of value.split(',').map((r) => r.trim()).filter(Boolean)) {
        if (!RULES.includes(rule)) usage(`unknown rule ${rule} (rules: ${RULES.join(', ')})`);
        args.skip.add(rule);
      }
    } else {
      args[flag.slice(2)] = path.resolve(value);
    }
  }
  const cwd = path.resolve(process.cwd());
  args.root = args.root ?? cwd;
  if (!args.ratchet) {
    args.ratchet = args.root === cwd ? DEFAULT_RATCHET : path.join(args.root, 'palette-ratchet.json');
  }
  return args;
}

/** Recursively lists files under dir; skipSnapshots drops *-snapshots dirs. */
function walk(dir, skipSnapshots, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipSnapshots && entry.name.endsWith('-snapshots')) continue;
      walk(full, skipSnapshots, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

const toPosix = (p) => p.split(path.sep).join('/');

/** Returns [{ line, match }] for every regex hit in the text, 1-based lines. */
function hits(lines, regex) {
  const found = [];
  lines.forEach((text, index) => {
    regex.lastIndex = 0;
    for (const m of text.matchAll(regex)) found.push({ line: index + 1, match: m[0] });
  });
  return found;
}

function isShellFile(rel) {
  return rel.startsWith('components/site/') || rel.startsWith('components/providers/') || rel === 'data/site.ts';
}

function readRatchet(file) {
  if (!fs.existsSync(file)) return { exists: false, counts: {} };
  const counts = JSON.parse(fs.readFileSync(file, 'utf-8'));
  return { exists: true, counts };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const on = (rule) => !args.skip.has(rule);
  const violations = [];
  const report = (rel, line, rule, match) => violations.push(`${rel}:${line} ${rule} ${match}`);
  const wbCounts = {};
  const wbHits = {};

  const files = SCAN_DIRS.flatMap((dir) => walk(path.join(args.root, dir), true))
    .map((full) => ({ full, rel: toPosix(path.relative(args.root, full)) }))
    .filter(({ rel }) => TEXT_EXT.has(path.extname(rel)))
    .sort((a, b) => a.rel.localeCompare(b.rel));

  for (const { full, rel } of files) {
    const ext = path.extname(rel);
    const lines = fs.readFileSync(full, 'utf-8').split(/\r?\n/);
    if (on('dark')) for (const h of hits(lines, DARK)) report(rel, h.line, 'dark', h.match);
    if (on('stock')) for (const h of hits(lines, STOCK)) report(rel, h.line, 'stock', h.match);
    if (on('variant') && ext === '.css') for (const h of hits(lines, VARIANT)) report(rel, h.line, 'variant', h.match);
    if (on('v1names') && isShellFile(rel)) for (const h of hits(lines, V1NAMES)) report(rel, h.line, 'v1names', h.match);
    if (on('emoji') && SCRIPT_EXT.has(ext)) for (const h of hits(lines, EMOJI)) report(rel, h.line, 'emoji', h.match);
    const wb = hits(lines, WB);
    if (wb.length > 0) {
      wbCounts[rel] = wb.length;
      wbHits[rel] = wb;
    }
  }

  if (on('png')) {
    const pngs = walk(path.join(args.root, 'e2e'), false)
      .map((full) => toPosix(path.relative(args.root, full)))
      .filter((rel) => rel.endsWith('.png') && !rel.endsWith('-linux.png'))
      .sort();
    for (const rel of pngs) report(rel, 0, 'png', 'only -linux.png snapshots may exist under e2e/');
  }

  const ratchet = readRatchet(args.ratchet);
  if (on('wb')) {
    const raised = [];
    const names = [...new Set([...Object.keys(wbCounts), ...Object.keys(ratchet.counts)])].sort();
    for (const rel of names) {
      const count = wbCounts[rel] ?? 0;
      const allowed = ratchet.counts[rel] ?? 0;
      if (count > allowed) {
        raised.push(rel);
        for (const h of wbHits[rel]) report(rel, h.line, 'wb', h.match);
        violations.push(`${rel} wb ${count} white/black utilities above the ratchet of ${allowed}`);
      } else if (count < allowed && !args.update) {
        violations.push(`${rel} wb ${count} white/black utilities below the ratchet of ${allowed}; ${UPDATE_HINT}`);
      }
    }

    if (args.update) {
      if (ratchet.exists && raised.length > 0) {
        console.error(`palette: --update refused: ${raised.length} file(s) above the ratchet; counts may only go down`);
      } else {
        const sorted = Object.fromEntries(Object.keys(wbCounts).sort().map((rel) => [rel, wbCounts[rel]]));
        fs.writeFileSync(args.ratchet, `${JSON.stringify(sorted, null, 2)}\n`);
        // A fresh ratchet records reality, so nothing is above it any more
        if (!ratchet.exists) violations.splice(0, violations.length, ...violations.filter((v) => !/ wb /.test(v)));
        const total = Object.values(sorted).reduce((sum, n) => sum + n, 0);
        console.log(`palette: ratchet written (${Object.keys(sorted).length} files, ${total} white/black utilities)`);
      }
    }
  }

  for (const v of violations) console.log(v);
  console.log(violations.length === 0 ? 'palette: OK' : `palette: ${violations.length} violations`);
  process.exit(violations.length === 0 ? 0 : 1);
}

main();
