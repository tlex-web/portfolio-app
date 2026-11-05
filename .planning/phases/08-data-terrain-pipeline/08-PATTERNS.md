# Phase 8: Data & Terrain Pipeline - Pattern Map

**Mapped:** 2026-10-24
**Files analyzed:** 44 (new + modified, grouped where they share one analog)
**Analogs found:** 36 / 44 (all analog paths verified with `git ls-files`)

Note (AGENTS.md): Next is 16.4.2. Any change to `proxy.ts` matcher or `next.config.ts` `headers()` must be checked against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` (§Matcher) and `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md` (§Cache-Control), as RESEARCH did.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/guards/check-served-images.mjs` (new) | guard | batch / file-I/O scan | `scripts/guards/check-identity.mjs` | exact (structure) |
| `scripts/guards/selftest.mjs` (mod: add served-images cases) | test harness | batch | itself (identity cases, lines 414-460) | exact |
| `scripts/guards/__selftest__/served-images/**` (new fixtures) | test fixture | — | `scripts/guards/__selftest__/identity/{good,bad-*}/` | exact |
| `scripts/terrain/fetch-dem.mjs` (new) | build script | network → file-I/O | `scripts/optimize-images.mjs` (CLI shell only) | partial |
| `scripts/terrain/build-terrain.mjs` (new, `--check`) | build script | transform + check | `scripts/optimize-images.mjs` (sharp) + `check-identity.mjs` (violation/exit) | role-match |
| `scripts/photos/extract-exif.mjs` (new, `--check`) | build script | file-I/O transform | `scripts/optimize-images.mjs` (sharp `metadata()`) | role-match |
| `scripts/photos/build-photo-data.mjs` (new, `--check`) | build script | transform + check | `check-identity.mjs` (violations/exit) | partial |
| `scripts/photos/build-derivatives.mjs` (new; replaces optimize-images) | build script | batch image transform | `scripts/optimize-images.mjs` | exact |
| `scripts/optimize-images.mjs` (retire / deprecate) | build script | — | — | n/a |
| `scripts/inject-build-hash.mjs` (mod: precache placeholder) | build script | file-I/O replace | itself | exact |
| `public/service-worker.js` (mod: `/terrain/` cache-first + precache list) | service worker | event-driven | itself | exact |
| `proxy.ts` (mod: matcher excludes `images/`, `terrain/`) | middleware | request-response | itself | exact |
| `next.config.ts` (mod: `/terrain/:path*` immutable) | config | — | itself, lines 20-29 | exact |
| `eslint.config.mjs` (mod: ban generator libs) | config | — | itself, lines 46-74 | exact |
| `package.json` (mod: scripts, prebuild, devDeps) | config | — | itself (`guard:*`, `lint`) | exact |
| `.gitignore` (mod: `assets/photos-original/`) | config | — | itself line 59 | exact |
| `lib/geo.ts` (new, pure) | utility | transform | `lib/animations.ts` (pure constants module) | partial; use RESEARCH Code Ex. 1 |
| `lib/terrain/contour-paths.ts`, `lib/terrain/hillshade.ts` (new, pure) | utility | transform | none in repo | no analog; RESEARCH Code Ex. 2, 4 |
| `lib/photo-format.ts`, footer formatters (new, pure) | utility | transform | `lib/animations.ts` helpers | partial |
| `lib/trail-grade.ts` (new, pure) | utility | transform | `lib/animations.ts` (`as const` tables) | partial; RESEARCH Code Ex. 6 |
| `lib/__tests__/{geo,contour-paths,hillshade,trail-grade,footer-format,photo-format}.test.ts` | test | — | `lib/__tests__/motion-tokens.test.ts` | exact |
| `data/schemas.ts` (new, zod only) | model | validation | `data/types.ts` (types) | partial; RESEARCH Code Ex. 5 |
| `data/photos/editorial.ts` (new) | data | static | `data/landscapes.ts` | exact (content shape) |
| `data/photos/corrections.json`, `exif-sidecar.json` (new) | data | static | none | no analog |
| `data/terrain/source/*` (new, committed raster + source.json) | data | static | none | no analog |
| `data/generated/{terrain,photos,image-manifest}.ts`, `precache.json` (new, GENERATED) | data | static | `data/site.ts` (`as const satisfies`) | role-match |
| `data/landscapes.ts` (mod: legacy bridge) | data | transform | itself | exact |
| `data/projects.ts` (mod: union, riskScore) | data | static | itself | exact |
| `data/types.ts` (mod: `Site.attribution`, DemoCommand) | model | — | itself lines 53-59, 82-91 | exact |
| `data/site.ts` (mod: `attribution.terrain`) | config/data | static | itself | exact |
| `data/__tests__/{photos,projects,terrain,image-manifest}.test.ts` (new) | test | — | `lib/__tests__/motion-tokens.test.ts` (fs + data import) | role-match |
| `components/site/SiteFooter.tsx` (mod: map-sheet margin) | component (Server) | static render | itself | exact |
| `components/terrain/ContourField.tsx` (new, Server, zero JS) | component | static render | `components/site/SiteFooter.tsx` (server, no motion) | role-match |
| `components/site/__tests__/SiteFooter.test.tsx` (new) | test | — | `components/site/__tests__/SiteChrome.test.tsx` | exact |
| `components/ProjectHighlights.tsx` (unchanged; fed by `toLegacyHighlights`) | component | — | itself | n/a (must not change pixels) |
| `components/ImageDetailModal.tsx` (mod: date label, Pitfall 6) | component | — | itself line 188-195 | exact |
| `e2e/shell.spec.ts` (extend: attribution, scale bar, band aspect) | e2e test | — | itself lines 57-100 | exact |
| `e2e/data-privacy.spec.ts` (new, prod only) | e2e test | request-response | `e2e/shell.spec.ts` + `playwright.config.ts:36-39` (`PW_PROD`) | role-match |
| `e2e/visual/routes.spec.ts` (mod: await strip mask) | e2e visual | — | itself | exact |
| `scripts/guards/test-count.baseline.json` | config | — | itself | n/a (ratchet only rises) |
| `.planning/REQUIREMENTS.md` HOME-04, `PROJECT.md` (doc edits) | doc | — | — | n/a |

## Pattern Assignments

### `scripts/guards/check-served-images.mjs` (guard, batch scan)

**Analog:** `scripts/guards/check-identity.mjs`

**Header doc block + imports** (lines 1-36): shebang, JSDoc listing every check as `- name: description`, a `Usage:` line, "Exit code 1 on any violation; prints `<name>: OK` otherwise." Zero-dependency imports (`fs`, `path`); sharp is the only allowed extra (devDep, CI installs it).

**`--root` arg parsing** (lines 53-69) — copy verbatim so selftest can point it at fixtures:
```js
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
```
Note: RESEARCH says scope is `git ls-files` images; with `--root` fixtures (not a git repo) fall back to a `walk()` (lines 73-82) when `--root` is given, or run `git ls-files` with `cwd: root` and treat failure as walk.

**Violation collection + exit** (lines 166-172):
```js
for (const v of violations) console.log(v);
console.log(violations.length === 0 ? 'identity: OK' : `identity: ${violations.length} violations`);
process.exit(violations.length === 0 ? 0 : 1);
```
Use `served-images: OK`. One line per violation as `<rel> <rule>: <detail>` so selftest can match fragments. Rules from RESEARCH Code Ex. 7 (exif/xmp/iptc, >2560 px under public/, orientation, hash-name mismatch, manifest orphan/missing, SVG `<script`/`on*=`/`href=`).

**Wire-up:** `package.json` line 22-26 pattern: `"guard:images": "node scripts/guards/check-served-images.mjs"` and append `&& npm run guard:images` to `lint` (line 10).

---

### `scripts/guards/selftest.mjs` (add cases) + fixtures

**Analog:** itself. Constants block (lines 34-49): add
```js
const SERVED = path.join(here, 'check-served-images.mjs');
const si = (name) => path.join(fixtures, 'served-images', name);
```
Case shape (lines 415-428):
```js
{
  name: 'identity: contact@example.com in a live component fails',
  guard: IDENTITY,
  args: ['--root', idf('bad-placeholder')],
  expectExit: 1,
  expectOutput: ['components/ContactCard.tsx:3 forbidden contact@example.com'],
},
```
One `good` fixture passing with `served-images: OK`, plus `bad-exif-gps`, `bad-xmp-only`, `bad-oversize`, `bad-hash-name`, `bad-svg-script`. Fixture dirs mirror `__selftest__/identity/<case>/` layout (a mini repo root). Fixture images must be tiny (generate with sharp once, commit; the guard itself will scan them unless `__selftest__` is excluded from the tracked scan — exempt `scripts/guards/__selftest__/served-images/**` explicitly, the same way eslint ignores `scripts/guards/__selftest__/**` at `eslint.config.mjs:89`). Also add a `{ name, fn }` pure-helper case (supported, lines 12, 526-535) for the hash-name regex.

---

### `scripts/photos/build-derivatives.mjs` (batch image transform; replaces optimize-images)

**Analog:** `scripts/optimize-images.mjs`

**Imports / dirname** (lines 22-28):
```js
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```
**CONFIG block** (lines 30-46): copy shape, change `inputDir` to `assets/photos-original/`, `outputDir` to `public/images/photos/`, widths 640/1024/1600/2560 (+ JPEG 1200), formats avif/webp.

**Core resize/encode** (lines 148-195):
```js
const image = sharp(inputPath);
const metadata = await image.metadata();
let resized = image.clone().resize({ width: sizeConfig.width, withoutEnlargement: true, fit: 'inside' });
processor = resized.clone().webp({ quality: config.quality.webp, effort: 6 });
processor = resized.clone().avif({ quality: config.quality.avif, effort: 4 });
processor = resized.clone().jpeg({ quality: config.quality.jpeg, progressive: true, mozjpeg: true });
```
Changes required: add `.rotate()` before resize (bake orientation); resize on long edge (`width`+`height` with `fit: 'inside'`); assert `metadata.icc`/space is sRGB else throw; **never** `withMetadata/keepExif/withExif/keepXmp` (Pitfall 3); encode `toBuffer()`, hash sha256 → first 10 hex → `<id>-<w>.<hash>.<ext>`; write `data/generated/image-manifest.ts` instead of `optimization-manifest.json` (lines 240-258). Drop the "same in/out dir" idempotency logic (lines 110-135); it is the reason full-res lived in public/.

---

### `scripts/terrain/build-terrain.mjs`, `scripts/photos/build-photo-data.mjs`, `scripts/photos/extract-exif.mjs` (`--check` generators)

**Analog:** CLI shell from `optimize-images.mjs` lines 51-72 (`parseArgs` with flags, here `--check`), exit/report from `check-identity.mjs` lines 166-172. No in-repo generator writes a `.ts` file yet; follow RESEARCH Pattern 3 (text: regenerate in memory and byte-compare; PNG: decode pixels; lossy: hash-equals-filename).
- Import pure cores with explicit `.ts` extension (`import { wgs84ToLv95 } from '../../lib/geo.ts'`), run with `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON` in npm scripts. Do not add `"type": "module"` (`jest.config.js` is CommonJS, lines 1, 28).
- Generated `.ts` header: `// AUTO-GENERATED by scripts/... Do not edit.` and end with `as const` (shape like `data/site.ts` line 23 `} as const satisfies Site;`).
- `--check` failure message one line per diff, then `<name>: N stale artifacts`, exit 1; success `<name>: OK`.
- sharp grey16 write/decode: RESEARCH Code Ex. 3 (pass the `Uint16Array`, never a Buffer with `depth: 'ushort'`).

Wire: `package.json` scripts `terrain:fetch`, `terrain:build`, `photos:exif`, `photos:build`, `photos:derive`, `data:check` (runs all offline `--check`s); append `&& npm run data:check` to `lint`. Replace `"prebuild": "node scripts/optimize-images.mjs"` (line 20) with nothing or `npm run data:check`.

---

### `scripts/inject-build-hash.mjs` + `public/service-worker.js`

**Analog:** themselves. Placeholder replace (inject lines 42-45):
```js
const updated = sw.replaceAll('__BUILD_HASH__', buildId);
fs.writeFileSync(swPath, updated, 'utf-8');
```
Add a second placeholder (e.g. `'__PRECACHE_URLS__'` → JSON of `data/generated/precache.json`). Keep the soft-fail style (lines 23-31: missing input → message + `exit(0)` for BUILD_ID, `exit(1)` for SW read).

SW precache (lines 79-84):
```js
caches.open(STATIC_CACHE).then((cache) => cache.addAll(['/', '/offline']))
```
→ `['/', '/offline', ...PRECACHE]` where `const PRECACHE = __PRECACHE_URLS__;` near line 4 (must stay valid JS when uninjected, e.g. `/* __PRECACHE_URLS__ */ []` pattern — planner decide; add a test that committed SW still contains both placeholders).

Cache-first prefix list (lines 123-131): add `url.pathname.startsWith('/terrain/') ||` next to `/images/`.

---

### `proxy.ts` (matcher)

**Analog:** itself lines 43-54:
```ts
source: '/((?!api|_next/static|_next/image|favicon.ico|service-worker.js).*)',
```
→ add `|images/|terrain/` (trailing slash, Pitfall 9). Keep the `missing` prefetch array unchanged. Cite proxy.md §Matcher in the plan.

### `next.config.ts` (headers)

**Analog:** lines 20-29 — duplicate the `/images/:path*` object for `source: '/terrain/:path*'` with the same `'public, max-age=31536000, immutable'`. Only valid because every terrain filename is hashed. Note `/images/:path*` already covers legacy unhashed `-large/-thumb` files (pre-existing risk, unchanged).

### `eslint.config.mjs` (import bans)

**Analog:** lines 46-74. **Add entries to the existing global `paths` array** (Pitfall 8 — a second scoped block replaces this one and drops the framer-motion/Canvas/phosphor bans):
```js
{ name: 'd3-contour', message: 'Build-time only: use scripts/terrain/* (DATA-01).' },
// same for 'geotiff', 'simplify-js', 'exif-reader', 'sharp'
```
Then add a config object `{ files: ['scripts/**/*.mjs'], rules: { 'no-restricted-imports': [ 'error', { paths: [framer-motion, Canvas, phosphor entries repeated] } ] } }` so scripts may import them. Add an ESLint selftest case (selftest already spawns `ESLINT`, line 39).

---

### `components/site/SiteFooter.tsx` (Server Component, static)

**Analog:** itself (lines 1-47). Keep verbatim: imports (lines 1-2, phosphor from `dist/ssr`), `LINK` const (4-5), identity grid (23-38), copyright row (39-43). Changes per UI-SPEC Structure:
- `<footer className="@container bg-surface-raised border-t border-line">` (line 21).
- Insert band as first child, before the `max-w-6xl` div (line 22): `<div aria-hidden="true" className="relative w-full aspect-[5/1] sm:aspect-[8/1] lg:aspect-[12/1] border-b border-line pointer-events-none"><ContourField lod="strip" className="absolute inset-0" />{ticks}</div>`.
- Insert sheet-margin `<div className="mt-12 pt-6 border-t border-line">` between line 38 and 39, same class string as the copyright row.
- Imports add `import { terrain } from '@/data/generated/terrain';`, photo positions from `@/data/generated/photos`, formatters from `@/lib/...`. No `'use client'`, no hooks, no `motion/react`, no `Intl`/`toLocale*`. `new Date().getFullYear()` (line 12) is the only allowed Date.
- Must render in `SiteChrome variant="static"` (`components/site/SiteChrome.tsx:26,30`) used by `app/global-error.tsx`.

### `components/terrain/ContourField.tsx` (new, Server)

**Analog:** `SiteFooter.tsx` conventions (default export, JSDoc citing the requirement, `@/data/...` import). Body: `<div aria-hidden="true" className={cn('bg-contour', className)} style={{ maskImage: `url(${terrain.assets.contours[lod]})`, WebkitMaskImage: …, maskSize: 'cover', maskPosition: 'center', maskRepeat: 'no-repeat' }} />`. Inline style allowed by CSP `style-src 'self' 'unsafe-inline'` (`proxy.ts:9`).

### `components/site/__tests__/SiteFooter.test.tsx` (new)

**Analog:** `components/site/__tests__/SiteChrome.test.tsx` lines 1-25:
```tsx
import { render, screen, within } from '@testing-library/react';
import { site } from '@/data/site';
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
...
const footer = screen.getByRole('contentinfo');
expect(within(footer).queryByRole('navigation')).not.toBeInTheDocument();
```
SiteFooter needs no `next/navigation` mock (it uses no router). Assert: focusable count = 3, attribution text = `site.attribution.terrain`, one dashed tick when `position.approximate`, sheet title, dt order. Add a source-grep test (fs read of `SiteFooter.tsx`, pattern from `motion-tokens.test.ts` line 10) for no `motion/react`, `Intl`, `toLocale`. **Do not edit `SiteChrome.test.tsx`.**

---

### `lib/geo.ts`, `lib/trail-grade.ts`, `lib/photo-format.ts`, `lib/terrain/*.ts` (pure)

**Analog (style):** `lib/animations.ts` — exported `as const` tables + small helpers tested by `lib/__tests__/motion-tokens.test.ts`. Rule specific to this phase: **zero imports** (no `@/`, no relative) so Node type-stripping can load them from `.mjs`; erasable TS only (no `enum`/`namespace`). Bodies: RESEARCH Code Examples 1, 2, 4, 6.

### `lib/__tests__/*.test.ts`, `data/__tests__/*.test.ts`

**Analog:** `lib/__tests__/motion-tokens.test.ts` (lines 1-35): JSDoc header naming the requirement, `@/` imports, `node:fs` reads when checking source/generated files, `test.each(Object.entries(...))` for tables (use for RISK_BANDS, REFRAME oracles). Jest picks up `**/__tests__/**` (`jest.config.js:15`); `data/__tests__` needs no config change. Note `collectCoverageFrom` (lines 17-24) omits `data/**` — add if coverage matters.

---

### `data/site.ts` + `data/types.ts`

**Analog:** themselves. Add to `Site` interface (types.ts 82-91) `attribution: { terrain: string };` with a JSDoc in the style of lines 77-81 ("required string, so removing it fails tsc"). In site.ts add `attribution: { terrain: '<verbatim, PENDING Tim>' },` before line 23's `} as const satisfies Site;`. Update the file's JSDoc (lines 3-7) to note the D-15 source URL. `check-identity.mjs` reads `name`/`email`/`github`/`linkedin` literals via regex `\bkey:` (line 100) — the new `attribution` key does not collide.

`DemoCommand` (types.ts 53-59): `riskLevel?` → required, add `riskScore: number`; or derive from `data/schemas.ts` via `z.infer`.

### `data/projects.ts` (union + riskScore)

**Analog:** itself. Real slugs `'clix-cli'` (line 5) and `'clix-website'` (~line 106). `highlights` literal (lines 47-70+) becomes the fixture for `toLegacyHighlights` deep-equal (Pitfall 13); `ProjectHighlights.tsx` keeps its `Record<string, HighlightValue>` prop (lines 28-34) and renders `Object.entries` (57-65, 82-100) — feed it the adapter output so no PNG changes.

### `data/landscapes.ts` (legacy bridge) + `data/photos/editorial.ts`

**Analog:** `data/landscapes.ts` lines 1-60. Keep `export const landscapes: LandscapeImage[]` and the legacy `src`/`fallbackSrc`/`thumbnailSrc` `-large/-thumb` paths (Pitfall 8). `editorial.ts` takes over `alt/title/story/annotations` with the same `ImageAnnotation` shape (types.ts 93-105) keyed by camera id. Consumers that must stay green: `components/__tests__/GalleryGrid.test.tsx`, GalleryGrid, PhotoCarousel3D, ImageDetailModal, Home LCP.

### `components/ImageDetailModal.tsx` (Pitfall 6)

Lines 188-195 today:
```tsx
{image.technicalDetails.captureDate && ( ...
  {new Date(image.technicalDetails.captureDate).toLocaleDateString()}
```
Replace with a preformatted label (`captureLabel` from `lib/photo-format.ts`) passed by the bridge; year-precision renders `2019`, never 1/1/2019.

---

### `e2e/shell.spec.ts` (extend) and `e2e/data-privacy.spec.ts` (new)

**Analog:** `e2e/shell.spec.ts` lines 1-2, 57-100: `import { test, expect, type Page } from '@playwright/test'; import { site } from '@/data/site';`, route loop with `page.getByRole('contentinfo')`. Add: footer contains `site.attribution.terrain`, scale-bar width / band width ratio ±1 px, band aspect. **Existing assertions unchanged.**
`data-privacy.spec.ts`: prod-only (gate on `!!process.env.CI || !!process.env.PW_PROD`, `playwright.config.ts:39`), use `request.get()` for 404 on old full-res URLs and `Cache-Control` on `/terrain/*`.

### `e2e/visual/routes.spec.ts`
Before screenshot: `await page.waitForResponse(/\/terrain\/contours-strip\.[0-9a-f]{10}\.svg/)` or check `performance.getEntriesByType('resource')` (UI-SPEC "Mask image timing").

## Shared Patterns

### Guard script contract
**Source:** `scripts/guards/check-identity.mjs` (lines 1-36 header, 53-69 args, 166-172 report)
**Apply to:** `check-served-images.mjs` and every `--check` generator. `--root`/flag parsing, one line per violation, `<name>: OK`, exit 0/1, selftest case per failure mode.

### Pure core / impure shell split
**Source:** RESEARCH Pattern 1; repo precedent `lib/animations.ts` (pure, Jest-tested)
**Apply to:** all `lib/*.ts` new modules and `data/schemas.ts` (imports only `'zod'`). Generator libs only in `scripts/**/*.mjs`, enforced by `eslint.config.mjs` global `no-restricted-imports` block (lines 46-74).

### Typed constant module
**Source:** `data/site.ts` line 8 + 23 (`export const site = {...} as const satisfies Site;`)
**Apply to:** `data/generated/*.ts`, `data/photos/editorial.ts`. Required fields fail `tsc` rather than render empty (types.ts 77-81 JSDoc precedent).

### Server-only, motion-free shell component
**Source:** `components/site/SiteFooter.tsx` (no `'use client'`, phosphor `dist/ssr`, L2 tokens only: `bg-surface-raised`, `border-line`, `text-ink`, `text-ink-muted`)
**Apply to:** SiteFooter changes, `ContourField`. Palette guard (`scripts/guards/check-palette.mjs`) forbids `dark:`, stock palette and v1 names.

### Immutable caching only for hashed names
**Source:** `next.config.ts` 20-29, `public/service-worker.js` 123-131
**Apply to:** `/terrain/*`, `/images/photos/*` — filename `name.<10 hex>.ext`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `lib/terrain/contour-paths.ts` | utility | transform | No geometry code in repo; use RESEARCH Code Ex. 2 |
| `lib/terrain/hillshade.ts` | utility | transform | Use RESEARCH Code Ex. 4 |
| `lib/geo.ts` | utility | transform | Use RESEARCH Code Ex. 1 + REFRAME oracles |
| `data/schemas.ts` | model | validation | zod installed but no existing schema module; RESEARCH Code Ex. 5 (`z.strictObject`, naive-local regex) |
| `scripts/terrain/fetch-dem.mjs` | script | network | No network scripts; geotiff `readRasters({ window })` per RESEARCH |
| `data/photos/exif-sidecar.json`, `corrections.json` | data | static | New formats; define in schemas |
| `data/terrain/source/*` | data | static | Committed native DEM window + `source.json` |
| `data/generated/precache.json` | data | static | New; consumed by `inject-build-hash.mjs` |

## Metadata

**Analog search scope:** `scripts/`, `scripts/guards/`, `data/`, `lib/`, `components/site/`, `components/`, `e2e/`, root configs
**Files scanned:** ~25
**Pattern extraction date:** 2026-10-24
