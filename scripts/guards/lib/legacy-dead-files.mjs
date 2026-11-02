/**
 * Shared dead-file list for the identity (SHELL-03) and emoji (DSGN-10) rules
 *
 * The list is empty since Phase 12 (VERIFY-01): every v1 file it exempted has
 * been deleted, so the identity guard and the palette emoji and v1names rules
 * scan every file the same way. No file is ever added back; a file holding v1
 * placeholders is fixed or deleted, never exempted.
 *
 * isLegacyDeadFile() and assertNoImporters() stay so the guards keep one call
 * shape; on an empty list the first is always false and the second finds no
 * importer.
 */

import fs from 'fs';
import path from 'path';

export const LEGACY_DEAD_FILES = [];

const IMPORTER_DIRS = ['app', 'components', 'lib'];
const SOURCE_EXT = new Set(['.ts', '.tsx', '.mjs', '.js', '.jsx']);
// Static `import ... from '<spec>'`, side-effect `import '<spec>'`, `export ... from '<spec>'`,
// dynamic `import('<spec>')` and `require('<spec>')`
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/g;

const toPosix = (p) => p.split(path.sep).join('/');
const stripExt = (p) => p.replace(/\.(?:tsx?|jsx?|mjs)$/, '');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && SOURCE_EXT.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

/** True when rel (posix, relative to the root) is one of the legacy dead files. */
export function isLegacyDeadFile(rel) {
  return LEGACY_DEAD_FILES.includes(rel);
}

/**
 * Scans <root>/{app,components,lib} for an import of any LEGACY_DEAD_FILES
 * module, by `@/components/<Name>` or a relative `./<Name>` / `../<Name>`
 * specifier resolved against the importing file (so `./SiteFooter` or a
 * `components/site/Footer` never count). The legacy files themselves are not
 * importers: a dead file importing another dead file keeps both dead.
 * Returns [{ importer, target, line }] (posix paths relative to root); empty when none.
 */
export function assertNoImporters(root) {
  const targets = new Map(LEGACY_DEAD_FILES.map((rel) => [stripExt(rel), rel]));
  const offenders = [];
  const files = IMPORTER_DIRS.flatMap((dir) => walk(path.join(root, dir)))
    .map((full) => ({ full, rel: toPosix(path.relative(root, full)) }))
    .filter(({ rel }) => !isLegacyDeadFile(rel))
    .sort((a, b) => a.rel.localeCompare(b.rel));

  for (const { full, rel } of files) {
    const lines = fs.readFileSync(full, 'utf-8').split(/\r?\n/);
    lines.forEach((text, index) => {
      SPECIFIER.lastIndex = 0;
      for (const m of text.matchAll(SPECIFIER)) {
        const spec = m[2];
        let resolved = null;
        if (spec.startsWith('@/')) resolved = spec.slice(2);
        else if (spec.startsWith('./') || spec.startsWith('../')) {
          resolved = toPosix(path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec)));
        }
        if (resolved === null) continue;
        const target = targets.get(stripExt(resolved));
        if (target) offenders.push({ importer: rel, target, line: index + 1 });
      }
    });
  }
  return offenders;
}
