#!/usr/bin/env node

/**
 * Guard (SHELL-03, PITFALLS 27): no placeholder identity, one identity record
 *
 * data/site.ts is the single identity record (name, email, links). This guard
 * fails when a v1 placeholder survives anywhere in live source, when the record
 * itself is not real, or when the package.json author (a derived copy, since
 * package.json cannot import TypeScript) drifts from it.
 *
 * Checks (each violation prints one line):
 *   - forbidden: an exact placeholder string in <root>/{app,components,lib,data}
 *                (.ts .tsx .mjs .js, test files and __tests__ dirs excluded; e2e/
 *                is out of scope) or <root>/package.json:
 *                your.email@example.com, contact@example.com, My Portfolio,
 *                Welcome to My Portfolio, Your Name; the split wordmark (a P
 *                rendered apart from "ortfolio"); bare profile roots
 *                "https://github.com" and "https://linkedin.com" as quoted strings
 *   - legacy:    LEGACY_DEAD_FILES (scripts/guards/lib/legacy-dead-files.mjs) are
 *                skipped only while nothing imports them; any importer fails with
 *                "legacy file is imported again" and the file is scanned as well
 *   - site:      data/site.ts name is Tim Lui, links.github is
 *                https://github.com/tlex-web, email is a real address shape (not
 *                example.com), links.linkedin is a full https linkedin.com/in/ URL
 *   - author:    package.json author equals `${name} (${github})` from data/site.ts
 *
 * Usage:
 *   node scripts/guards/check-identity.mjs [--root <dir>]
 *   (Runs from `npm run lint` via `npm run guard:identity`)
 *
 * Exit code 1 on any violation; prints `identity: OK` otherwise.
 */

import fs from 'fs';
import path from 'path';
import { assertNoImporters, isLegacyDeadFile } from './lib/legacy-dead-files.mjs';

const EXPECTED_NAME = 'Tim Lui';
const EXPECTED_GITHUB = 'https://github.com/tlex-web';

const FORBIDDEN_STRINGS = ['your.email@example.com', 'contact@example.com', 'Welcome to My Portfolio', 'My Portfolio', 'Your Name'];
const FORBIDDEN_PATTERNS = [
  { label: 'split wordmark (P + ortfolio)', regex: /(?<![A-Za-z])ortfolio/g },
  { label: 'bare GitHub root href', regex: /["']https:\/\/github\.com\/?["']/g },
  { label: 'bare LinkedIn root href', regex: /["']https:\/\/(www\.)?linkedin\.com\/?["']/g },
];

const SCAN_DIRS = ['app', 'components', 'lib', 'data'];
const SCRIPT_EXT = new Set(['.ts', '.tsx', '.mjs', '.js']);
const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const LINKEDIN_SHAPE = /^https:\/\/(www\.)?linkedin\.com\/in\/[^\s/]+\/?$/;

function usage(message) {
  console.error(`identity: ${message}`);
  console.error('usage: check-identity.mjs [--root <dir>]');
  process.exit(1);
}

function parseArgs(argv) {
  let root = process.cwd();
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== '--root') usage(`unknown argument ${argv[i]}`);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) usage('--root needs a value');
    root = value;
    i++;
  }
  return { root: path.resolve(root) };
}

const toPosix = (p) => p.split(path.sep).join('/');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

const isTestFile = (rel) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(rel);

/** Pushes one `<rel>:<line> forbidden <what>` line per placeholder hit. */
function scanForbidden(rel, text, violations) {
  text.split(/\r?\n/).forEach((line, index) => {
    for (const s of FORBIDDEN_STRINGS) {
      if (line.includes(s)) violations.push(`${rel}:${index + 1} forbidden ${s}`);
    }
    for (const { label, regex } of FORBIDDEN_PATTERNS) {
      regex.lastIndex = 0;
      for (const m of line.matchAll(regex)) violations.push(`${rel}:${index + 1} forbidden ${label}: ${m[0]}`);
    }
  });
}

/** First `key: '<value>'` string literal in the source, or null. */
function literal(source, key) {
  const m = source.match(new RegExp(`\\b${key}:\\s*(['"])(.*?)\\1`));
  return m ? m[2] : null;
}

function main() {
  const { root } = parseArgs(process.argv.slice(2));
  const violations = [];

  // Legacy dead files: exempt only while nothing imports them
  const importers = assertNoImporters(root);
  for (const { importer, target, line } of importers) {
    violations.push(`${importer}:${line} legacy file is imported again: ${target} (exempt only while unimported; deleted in Phase 12)`);
  }
  const revived = new Set(importers.map((o) => o.target));
  const exempt = (rel) => isLegacyDeadFile(rel) && !revived.has(rel);

  // Forbidden placeholder strings in live source
  const files = SCAN_DIRS.flatMap((dir) => walk(path.join(root, dir)))
    .map((full) => ({ full, rel: toPosix(path.relative(root, full)) }))
    .filter(({ rel }) => SCRIPT_EXT.has(path.extname(rel)) && !isTestFile(rel) && !exempt(rel))
    .sort((a, b) => a.rel.localeCompare(b.rel));
  for (const { full, rel } of files) scanForbidden(rel, fs.readFileSync(full, 'utf-8'), violations);

  const pkgPath = path.join(root, 'package.json');
  let pkg = null;
  if (!fs.existsSync(pkgPath)) {
    violations.push('package.json: not found');
  } else {
    const raw = fs.readFileSync(pkgPath, 'utf-8');
    scanForbidden('package.json', raw, violations);
    try {
      pkg = JSON.parse(raw);
    } catch (err) {
      violations.push(`package.json: not valid JSON (${err.message})`);
    }
  }

  // data/site.ts: the identity record must be real
  const sitePath = path.join(root, 'data', 'site.ts');
  if (!fs.existsSync(sitePath)) {
    violations.push('data/site.ts: not found (the identity record)');
  } else {
    const source = fs.readFileSync(sitePath, 'utf-8');
    const name = literal(source, 'name');
    const email = literal(source, 'email');
    const github = literal(source, 'github');
    const linkedin = literal(source, 'linkedin');

    if (name !== EXPECTED_NAME) violations.push(`data/site.ts: name is ${JSON.stringify(name)}, expected "${EXPECTED_NAME}"`);
    if (github !== EXPECTED_GITHUB) violations.push(`data/site.ts: links.github is ${JSON.stringify(github)}, expected "${EXPECTED_GITHUB}"`);
    if (email === null || !EMAIL_SHAPE.test(email) || /example\.com/i.test(email)) {
      violations.push(`data/site.ts: email ${JSON.stringify(email)} is not a real address`);
    }
    if (linkedin === null || !LINKEDIN_SHAPE.test(linkedin)) {
      violations.push(`data/site.ts: links.linkedin ${JSON.stringify(linkedin)} is not a full https://linkedin.com/in/<handle> URL`);
    }

    // package.json author is a derived copy of the record
    if (pkg) {
      const expected = `${name} (${github})`;
      if (pkg.author !== expected) {
        violations.push(`package.json: author ${JSON.stringify(pkg.author)} does not match data/site.ts, expected "${expected}"`);
      }
    }
  }

  for (const v of violations) console.log(v);
  console.log(violations.length === 0 ? 'identity: OK' : `identity: ${violations.length} violations`);
  process.exit(violations.length === 0 ? 0 : 1);
}

main();
