#!/usr/bin/env node

/**
 * Pixel-neutrality check: className literals are unchanged
 *
 * For every .ts/.tsx file under app/ and components/ that differs between a
 * git ref and the working tree, extracts the string contents of every
 * className attribute (className="...", className='...', and every string or
 * template literal inside className={...}) from both versions, sorts both
 * lists and compares them. Plans that must not change rendering (lint fixes
 * before visual baselines exist, upgrade commits with zero visual diff) run
 * this before committing.
 *
 * Added or deleted files are reported and skipped (there is nothing to pair).
 *
 * Usage:
 *   node scripts/guards/same-classnames.mjs <git-ref>
 *   node scripts/guards/same-classnames.mjs --files <before> <after>   (two files on disk; used by the selftest)
 *
 * Exit code 1 if any file's className literals differ (one FAIL line per file).
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/** Reads a quoted string or template literal starting at src[i]; returns { value, end }. */
function readLiteral(src, i) {
  const quote = src[i];
  let j = i + 1;
  let depth = 0; // ${ } nesting inside a template literal
  while (j < src.length) {
    const ch = src[j];
    if (ch === '\\') {
      j += 2;
      continue;
    }
    if (quote === '`') {
      if (ch === '$' && src[j + 1] === '{') {
        depth++;
        j += 2;
        continue;
      }
      if (depth > 0 && ch === '}') {
        depth--;
        j++;
        continue;
      }
      if (depth === 0 && ch === '`') break;
    } else if (ch === quote) {
      break;
    }
    j++;
  }
  return { value: src.slice(i + 1, j), end: j + 1 };
}

/** Collects every string/template literal in the balanced {...} expression starting at src[i]. */
function readExpression(src, i, out) {
  let depth = 0;
  let j = i;
  while (j < src.length) {
    const ch = src[j];
    if (ch === '"' || ch === "'" || ch === '`') {
      const lit = readLiteral(src, j);
      out.push(lit.value);
      j = lit.end;
      continue;
    }
    if (ch === '/' && src[j + 1] === '/') {
      const nl = src.indexOf('\n', j);
      j = nl === -1 ? src.length : nl;
      continue;
    }
    if (ch === '/' && src[j + 1] === '*') {
      const close = src.indexOf('*/', j + 2);
      j = close === -1 ? src.length : close + 2;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return j + 1;
    }
    j++;
  }
  return j;
}

/** Returns the sorted className literal contents of a source text. */
function extractClassNames(source) {
  const src = source.replace(/\r\n/g, '\n');
  const out = [];
  const re = /\bclassName\s*=\s*/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const start = m.index + m[0].length;
    const ch = src[start];
    if (ch === '"' || ch === "'") {
      const lit = readLiteral(src, start);
      out.push(lit.value);
      re.lastIndex = lit.end;
    } else if (ch === '{') {
      re.lastIndex = readExpression(src, start, out);
    }
  }
  return out.sort();
}

/** Multiset difference a - b. */
function minus(a, b) {
  const counts = new Map();
  for (const x of b) counts.set(x, (counts.get(x) ?? 0) + 1);
  const rest = [];
  for (const x of a) {
    const n = counts.get(x) ?? 0;
    if (n > 0) counts.set(x, n - 1);
    else rest.push(x);
  }
  return rest;
}

/** Compares two source texts; prints a FAIL block and returns false when they differ. */
function compare(label, before, after) {
  const a = extractClassNames(before);
  const b = extractClassNames(after);
  if (a.length === b.length && a.every((x, k) => x === b[k])) return true;
  console.log(`FAIL className literals differ: ${label}`);
  for (const x of minus(a, b)) console.log(`  - ${JSON.stringify(x)}`);
  for (const x of minus(b, a)) console.log(`  + ${JSON.stringify(x)}`);
  return false;
}

const args = process.argv.slice(2);
let failures = 0;
let compared = 0;

if (args[0] === '--files') {
  if (args.length !== 3) {
    console.error('usage: same-classnames.mjs --files <before> <after>');
    process.exit(2);
  }
  compared = 1;
  if (!compare(args[2], fs.readFileSync(args[1], 'utf-8'), fs.readFileSync(args[2], 'utf-8'))) failures++;
} else {
  const ref = args[0];
  if (!ref || ref.startsWith('-')) {
    console.error('usage: same-classnames.mjs <git-ref> | --files <before> <after>');
    process.exit(2);
  }
  const run = (cwd, a) => execFileSync('git', a, { cwd, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const root = run(process.cwd(), ['rev-parse', '--show-toplevel']).trim();
  const git = (...a) => run(root, a);
  const status = git('diff', '--name-status', '--no-renames', ref, '--', 'app', 'components')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of status) {
    const [code, file] = line.split(/\t/);
    if (!/\.tsx?$/.test(file)) continue;
    if (code === 'A' || code === 'D') {
      console.log(`skip (${code === 'A' ? 'added' : 'deleted'}): ${file}`);
      continue;
    }
    compared++;
    if (!compare(file, git('show', `${ref}:${file}`), fs.readFileSync(path.join(root, file), 'utf-8'))) failures++;
  }
}

if (failures > 0) {
  console.log(`same-classnames: ${failures} of ${compared} file(s) changed className literals`);
  process.exit(1);
}
console.log(`same-classnames: OK (${compared} file(s) compared, className literals identical)`);
