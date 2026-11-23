/**
 * @jest-environment node
 */
/**
 * The footer's client graph (16-05, 16-07; 16-RESEARCH Pattern 5, Pitfall 5;
 * T-16-11, T-16-13).
 *
 * app/global-error.tsx is an error boundary, so it is a Client Component, and
 * every module it reaches through static value imports ships to the browser.
 * It renders SiteChrome, whose SiteFooter reads the Home waypoints through
 * lib/ascent/home-photos. That module reads data/generated/home-photos.ts (the
 * four Home photos only); if it, or anything else on the graph, imported the
 * full photo set or the image manifest again, every new photo would grow the
 * client JS of pages that never show it. The same holds for plates: the footer's
 * contour band and legend draw data/generated/home-plate.ts (the home sheet
 * only), so the plate registry data/generated/plates.ts must not be reached
 * either, or every new plate would grow the footer chunk.
 *
 * The overview module is server-only for every client component, not just the
 * footer (16-REVIEW WR-04): a second walk starts at every file under app/,
 * components/ and lib/ whose first statement is 'use client' (a client entry),
 * and SERVER_ONLY_MODULES must be reached from none of them.
 *
 * Each walk follows `import … from`,
 * `export … from` and side-effect `import '…'` statements, resolving `@/` to the
 * repository root and relative paths (trying .ts, .tsx, /index.ts, /index.tsx).
 * It skips `import type` / `export type` statements, imports whose every
 * specifier is `type`, and package imports. An unresolvable local import fails
 * the walk, and a second test asserts it reached the footer and the Home module,
 * so a broken walker cannot pass vacuously.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * Modules that must never reach the global-error client graph (repo-relative).
 * The Alps overview module (16-15, T-16-36) is server-only: Phase 18's /photos
 * reads it on the server, and its contours, outlines and notice stay out of every
 * client chunk.
 */
export const FORBIDDEN_IN_CLIENT_GRAPH = [
  'data/generated/photos.ts',
  'data/generated/image-manifest.ts',
  'data/generated/plates.ts',
  'data/generated/overview.ts',
] as const;

/**
 * Modules that no client entry may reach (repo-relative), whatever its page:
 *
 * - data/generated/overview.ts: the Alps overview's outlines, summits and GLO-90
 *   notice (16-15, T-16-36). Its generated header points here.
 * - data/regions/regions.json: the region registry, names and sourced facts
 *   (17 D-06, T-17-34). The 17-RESEARCH spike measured +2,200 B of client JS, with
 *   the registry facts in two client chunks, when lib/photos/routes.ts imported
 *   it (the pure annotation does not drop a JSON module). Only lib/regions.ts,
 *   lib/photos/region-ids.ts (for proxy.ts), server pages and server routes may
 *   import it. The walk resolves the exact .json path as a leaf.
 */
export const SERVER_ONLY_MODULES = ['data/generated/overview.ts', 'data/regions/regions.json'] as const;

const ROOT = process.cwd();
const ENTRY = 'app/global-error.tsx';
const PARSED = /\.(?:tsx?|mjs|js)$/;
const toPosix = (p: string) => p.split(path.sep).join('/');

/** `a`, `{ a, b as c }`, `* as ns`, `*`, `a, { b }`, `a, * as ns`. */
const CLAUSE = String.raw`(?:[\w$]+\s*,\s*)?(?:\{[^}]*\}|\*(?:\s+as\s+[\w$]+)?|[\w$]+)`;
const FROM = new RegExp(String.raw`^[ \t]*(import|export)\s+(type\s+)?(${CLAUSE})\s*from\s*['"]([^'"]+)['"]`, 'gm');
const SIDE_EFFECT = /^[ \t]*import\s*['"]([^'"]+)['"]/gm;

/**
 * The value-import specifiers of a source text, in order. Comments are removed
 * first, so an import quoted in a JSDoc is never followed.
 */
export function valueImportsOf(source: string): string[] {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  const found: { at: number; spec: string }[] = [];
  for (const m of text.matchAll(FROM)) {
    const [, , typeOnly, clause, spec] = m;
    if (typeOnly) continue;
    const braces = /\{([^}]*)\}/.exec(clause);
    const hasDefaultOrStar = /^\s*(?:[\w$]+\s*(?:,|$)|\*)/.test(clause);
    if (braces && !hasDefaultOrStar) {
      const names = braces[1].split(',').map((s) => s.trim()).filter(Boolean);
      if (names.length > 0 && names.every((n) => /^type\s/.test(n))) continue;
    }
    found.push({ at: m.index, spec });
  }
  for (const m of text.matchAll(SIDE_EFFECT)) found.push({ at: m.index, spec: m[1] });
  return found.sort((a, b) => a.at - b.at).map((f) => f.spec);
}

/** The repo-relative file a local specifier resolves to; null for a package import. */
function resolve(fromFile: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = path.join(ROOT, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(path.join(ROOT, fromFile)), spec);
  else return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return toPosix(path.relative(ROOT, candidate));
  }
  throw new Error(`client-graph: ${fromFile} imports '${spec}', which resolves to no file`);
}

/** True when the first statement (after comments) is the client directive. */
export const isClientModule = (text: string) =>
  /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*['"]use client['"]/.test(text);

/** Every source file under `dir` (recursive, repo-relative, forward slashes). */
function sourceFiles(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') out.push(...sourceFiles(rel));
    } else if (/\.(?:tsx?|jsx?|mjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

/** Every client entry: a file under app/, components/ or lib/ that starts with 'use client'. */
const CLIENT_ENTRIES = ['app', 'components', 'lib']
  .flatMap(sourceFiles)
  .filter((f) => isClientModule(fs.readFileSync(path.join(ROOT, f), 'utf8')))
  .sort();

/** Breadth-first walk from `entries`: every reached file and the file that first imported it. */
function walk(entries: readonly string[]): Map<string, string | null> {
  const parent = new Map<string, string | null>(entries.map((e) => [e, null]));
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.shift() as string;
    if (!PARSED.test(file)) continue;
    for (const spec of valueImportsOf(fs.readFileSync(path.join(ROOT, file), 'utf8'))) {
      const target = resolve(file, spec);
      if (target === null || parent.has(target)) continue;
      parent.set(target, file);
      queue.push(target);
    }
  }
  return parent;
}

function chainTo(parent: Map<string, string | null>, file: string): string {
  const chain: string[] = [];
  for (let at: string | null | undefined = file; at; at = parent.get(at)) chain.unshift(at);
  return chain.join(' -> ');
}

const graph = walk([ENTRY]);
const clientGraph = walk(CLIENT_ENTRIES);

describe('the import parser the walk relies on', () => {
  it.each([
    ["import { a } from '@/x';", ['@/x']],
    ["import a, { b } from './y';", ['./y']],
    ["import * as ns from '../z';", ['../z']],
    ["import './globals.css';", ['./globals.css']],
    ["export { a } from './a';\nexport * from './b';", ['./a', './b']],
    ["import {\n  a,\n  b,\n} from '@/multi';", ['@/multi']],
    ["import { formatCaptureMonth, shortPlace, type CaptureLike } from '@/lib/home-format';", ['@/lib/home-format']],
    ["import type { PhotoId } from './photos/editorial';", []],
    ["export type { Waypoint } from './waypoints';", []],
    ["import { type A, type B } from './types';", []],
    ["/** import { photos } from '@/data/generated/photos'; */\n// import x from './x';", []],
  ])('%j -> %j', (source, expected) => {
    expect(valueImportsOf(source)).toEqual(expected);
  });
});

describe('the global-error client graph (16-05, T-16-11)', () => {
  it('reaches the footer, the Home photo module and the home sheet, so the walk is not vacuous', () => {
    expect(graph.has('components/site/SiteChrome.tsx')).toBe(true);
    expect(graph.has('components/site/SiteFooter.tsx')).toBe(true);
    expect(graph.has('lib/ascent/home-photos.ts')).toBe(true);
    expect(graph.has('data/generated/home-photos.ts')).toBe(true);
    expect(graph.has('components/terrain/ContourField.tsx')).toBe(true);
    expect(graph.has('data/generated/home-plate.ts')).toBe(true);
  });

  it('the global-error client graph imports no forbidden data module', () => {
    const reached = FORBIDDEN_IN_CLIENT_GRAPH.filter((file) => graph.has(file)).map((file) => chainTo(graph, file));
    expect(reached).toEqual([]);
  });
});

describe('the graph of every client entry (16-REVIEW WR-04, T-16-36)', () => {
  it('finds the client entries, global-error among them, so the walk is not vacuous', () => {
    expect(CLIENT_ENTRIES.length).toBeGreaterThan(20);
    expect(CLIENT_ENTRIES).toContain(ENTRY);
    expect(clientGraph.has('components/site/SiteFooter.tsx')).toBe(true);
  });

  it('the client-directive detector recognises a client module', () => {
    expect(isClientModule("'use client';\nimport x from 'y';")).toBe(true);
    expect(isClientModule('/** doc */\n"use client";')).toBe(true);
    expect(isClientModule("import x from 'y';\n'use client';")).toBe(false);
  });

  it('no client entry reaches a server-only module', () => {
    const reached = SERVER_ONLY_MODULES.filter((file) => clientGraph.has(file)).map((file) =>
      chainTo(clientGraph, file)
    );
    expect(reached).toEqual([]);
  });
});
