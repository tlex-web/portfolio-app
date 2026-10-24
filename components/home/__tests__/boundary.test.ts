/**
 * @jest-environment node
 *
 * Server/client boundary for Home (ARCH §5; 09-RESEARCH Pattern 1 and
 * "Anti-Patterns to Avoid"; HOME-08's lazy-chunk rule).
 *
 * Anything a Server Component imports ships in the first load of every
 * visitor, Save-Data and low-memory devices included. So, under
 * components/home:
 *   (a) a file without the client directive imports no three, R3F, drei,
 *       fast-png, motion/react, @/lib/animations or @/lib/useAscentMode
 *       (a client module imported into an RSC for values yields client
 *       references, not values);
 *   (b) nothing imports @react-three/drei (its PerformanceMonitor misreads
 *       frameloop="demand"; the phase hand-rolls what it needs);
 *   (c) only components/home/terrain/ imports three, @react-three/fiber or
 *       fast-png;
 *   (d) outside components/home/terrain/, the terrain folder is named only
 *       inside a dynamic import() call, so the WebGL code stays a lazy chunk;
 *   (e) app/(site)/page.tsx has no client directive.
 *
 * The files are discovered with a recursive readdirSync walk, so every file a
 * later plan adds is held to the same rules without editing this test.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const HOME_DIR = path.join(ROOT, 'components', 'home');
const TERRAIN_PREFIX = 'components/home/terrain/';

const CLIENT_ONLY = [
  'three',
  '@react-three/fiber',
  '@react-three/drei',
  'fast-png',
  'motion/react',
  '@/lib/animations',
  '@/lib/useAscentMode',
];
const TERRAIN_ONLY = ['three', '@react-three/fiber', 'fast-png'];

const toPosix = (p: string) => p.split(path.sep).join('/');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

/** Source with block and line comments removed, so prose never counts as an import. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
}

/** True when the first statement is the 'use client' directive. */
function isClient(src: string): boolean {
  return /^\s*['"]use client['"]/.test(stripComments(src));
}

/** Every module specifier: static import/export-from, side-effect import, import() and require(). */
function specifiers(src: string): string[] {
  const code = stripComments(src);
  const found: string[] = [];
  const patterns = [
    /\b(?:import|export)\s[^'"`;]*?\sfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const re of patterns) {
    for (const m of code.matchAll(re)) {
      // `import type` / `export type` are erased at compile time and pull in no code.
      if (/^(?:import|export)\s+type\s/.test(m[0])) continue;
      found.push(m[1]);
    }
  }
  return found;
}

/** `spec` names module `mod` itself or one of its subpaths (three/examples/..., motion/react-client). */
function matches(spec: string, mod: string): boolean {
  if (mod.startsWith('@/lib/')) {
    const tail = mod.slice('@/'.length);
    return spec === mod || new RegExp(`(^|/)${tail}(\\.tsx?)?$`).test(spec);
  }
  if (mod === 'motion/react') return spec.startsWith('motion/react');
  return spec === mod || spec.startsWith(`${mod}/`);
}

const files = walk(HOME_DIR).map((full) => {
  const rel = toPosix(path.relative(ROOT, full));
  const src = fs.readFileSync(full, 'utf8');
  return { rel, src, client: isClient(src), specs: specifiers(src) };
});

describe('Home server/client boundary (ARCH §5)', () => {
  it('discovers the Home sources it guards', () => {
    expect(files.map((f) => f.rel)).toContain('components/home/AscentHero.tsx');
  });

  it('(a) server files import no three, R3F, drei, fast-png, motion or client-only lib module', () => {
    const violations = files
      .filter((f) => !f.client)
      .flatMap((f) =>
        f.specs
          .filter((s) => CLIENT_ONLY.some((mod) => matches(s, mod)))
          .map((s) => `${f.rel} imports '${s}' without the 'use client' directive`)
      );
    expect(violations).toEqual([]);
  });

  it('(b) nothing under components/home imports @react-three/drei', () => {
    const violations = files.flatMap((f) =>
      f.specs.filter((s) => matches(s, '@react-three/drei')).map((s) => `${f.rel} imports '${s}'`)
    );
    expect(violations).toEqual([]);
  });

  it('(c) only components/home/terrain/ imports three, @react-three/fiber or fast-png', () => {
    const violations = files
      .filter((f) => !f.rel.startsWith(TERRAIN_PREFIX))
      .flatMap((f) =>
        f.specs
          .filter((s) => TERRAIN_ONLY.some((mod) => matches(s, mod)))
          .map((s) => `${f.rel} imports '${s}' outside ${TERRAIN_PREFIX}`)
      );
    expect(violations).toEqual([]);
  });

  it('(d) outside the terrain folder, terrain modules are named only inside a dynamic import()', () => {
    const violations = files
      .filter((f) => !f.rel.startsWith(TERRAIN_PREFIX))
      .flatMap((f) => {
        const rest = stripComments(f.src).replace(/\bimport\s*\(\s*['"][^'"]*['"]\s*\)/g, '');
        return ['./terrain/', '@/components/home/terrain/']
          .filter((needle) => rest.includes(needle))
          .map((needle) => `${f.rel} names '${needle}' outside a dynamic import() call`);
      });
    expect(violations).toEqual([]);
  });

  it("(e) app/(site)/page.tsx is a Server Component (no 'use client')", () => {
    const page = fs.readFileSync(path.join(ROOT, 'app', '(site)', 'page.tsx'), 'utf8');
    expect(isClient(page)).toBe(false);
  });
});
