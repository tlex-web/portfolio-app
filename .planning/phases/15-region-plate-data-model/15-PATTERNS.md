# Phase 15: Region & Plate Data Model - Pattern Map

**Mapped:** 2026-11-14
**Files analyzed:** 38 (new + modified, grouped below)
**Analogs found:** 36 / 38 (all analog paths verified with `git ls-files`)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `data/schemas/region.ts` (NEW) | model (zod schema) | transform/validate | `data/schemas/terrain.ts` | exact |
| `data/schemas/photo.ts` (+`PhotoMap`, `PhotoFacts.region/country`) | model | validate | itself (`ExifSidecar` :57-90) | exact |
| `data/schemas/terrain.ts` (+`Plates` registry, prefix-aware poster regexes, `PlateSheet` meta) | model | validate | itself (`Lv95Bbox`, `TerrainSource`) | exact |
| `data/photos/photo-map.json` (NEW) | config/data | committed input | `data/photos/exif-sidecar.json` / `corrections.json` | exact |
| `data/regions/regions.json` (NEW) | config/data | committed input | `data/photos/corrections.json` | role-match |
| `data/terrain/plates.json` (NEW) | config/data | committed input | `data/terrain/source/source.json` | role-match |
| `data/generated/plates.ts` (NEW, generated) | generated module | batch output | `data/generated/terrain.ts` | exact |
| `data/generated/photos.ts` (regenerated) | generated module | batch output | itself | exact |
| `scripts/terrain/build-terrain.mjs` (+`--root`, plate loop, union sweep) | generator | batch / file-I/O | `scripts/photos/build-photo-data.mjs` (`parseArgs` :64-100) | exact |
| `scripts/photos/extract-exif.mjs` (+`--root`, id from map) | generator | file-I/O | `scripts/photos/build-photo-data.mjs` | exact |
| `scripts/photos/build-photo-data.mjs` (region→plate→raster, bijection) | generator | batch | itself (`loadDem` :113-132, off-extent error :266-270) | exact |
| `scripts/guards/check-served-images.mjs` (+telemetry rule, `-co --exclude-standard`, `public/` walk, `plates.ts` in MANIFESTS) | guard | file-I/O scan | itself (:80-175) | exact |
| `scripts/guards/__selftest__/served-images/bad-telemetry-*/`, `bad-mp4-{djmd,dbgi,gpmd,sbtl,text}/` (NEW fixtures) | test fixture | — | `scripts/guards/__selftest__/served-images/bad-mp4-uuid/` (README + clip + manifest) | exact |
| `scripts/guards/selftest.mjs` (+G5 cases, fixture plate, extract-exif cases, repo-mode telemetry, scan-only, ci-gate IN-02/03) | test harness | batch | itself (`tempPhotoDataRoot` :793-818, `gitIn` :834-838, `tempDeriveRoot` :958) | exact |
| `scripts/guards/test-count.mjs` (+`--scan-only`) | guard | file-I/O scan | itself (`parseArgs` :48-66) | exact |
| `scripts/guards/check-ci-gate.mjs` (IN-02/03) | guard | transform | itself (`checkRelay` :560+, `isNeedsNameExpression` :480-500) | exact |
| `lib/photos/routes.ts` (NEW: `photoHref`, `photoRouteSlugs`) | utility | request-response | none direct; RESEARCH "photoHref" example | partial |
| `lib/__tests__/photo-routes.test.ts` (NEW: D-18 source scan + pin) | test | file-I/O scan | `components/home/__tests__/boundary.test.ts` | exact |
| `lib/ascent/home.ts` (NEW, or in `waypoints.ts`: `homeInput`, `homeLowestDemM`) | utility | transform | `lib/ascent/waypoints.ts` (`buildWaypoints` :92+) | exact |
| `data/home.ts` (+`homeWaypointIds`) | config | — | itself (`navHref` throw pattern :3-7) | exact |
| `lib/ascent/summit.ts`, `lib/photos/view-model.ts` | utility | transform | `lib/ascent/waypoints.ts` | exact |
| `components/site/SiteFooter.tsx`, `components/home/TrailSigns.tsx` | component (RSC) | render | themselves | exact |
| `components/terrain/SheetBand.tsx` / `SheetLegend.tsx` (NEW, from SiteFooter) | component (RSC) | render | `components/terrain/ContourField.tsx` | role-match |
| `components/terrain/ContourField.tsx` (+`plate`) | component | render | itself | exact |
| `proxy.ts`, `app/sitemap.ts`, `lib/saved-pages.ts`, 7 component call sites | consumers | request-response | — (one-line `photoHref` swaps; RESEARCH table rows 1-11) | n/a |
| `data/__tests__/photo-map.test.ts`, `plates.test.ts`, `home.test.ts` (NEW) | test | validate | `data/__tests__/exif-sidecar.test.ts` | exact |
| `data/__tests__/terrain.test.ts` (+D-15 literal pin) | test | validate | itself (:20-40) | exact |
| `lib/__tests__/home-waypoints.test.tsx` (NEW, SC-1 jest.mock) | test | — | `lib/__tests__/ascent-waypoints.test.ts` | role-match |
| `__tests__/jest-globals.d.ts` (NEW) | config (types) | — | none in repo | no analog |
| `tsconfig.jest.json`, `tsconfig.e2e.json` (NEW) | config | — | `tsconfig.json` (extends) | role-match |
| `jest.config.js`, `package.json`, `.gitignore`, `scripts/README.md` | config/docs | — | themselves | exact |

## Pattern Assignments

### New zod schemas: `data/schemas/region.ts`, additions to `photo.ts` / `terrain.ts`

**Analog:** `data/schemas/terrain.ts` lines 1-28 (header + `Lv95Bbox`)

Header rule to copy verbatim in spirit (lines 13-17):
```ts
 * Imports only 'zod' on purpose (RESEARCH Pattern 1): Node 24 type-strips this
 * file when a scripts/*.mjs generator imports it, and Node cannot resolve `@/`
 * or extension-less relative imports. Keep it to erasable TypeScript.
 */
import { z } from 'zod';
```
Strict object + refine + same-name type export (lines 19-28):
```ts
export const Lv95Bbox = z
  .strictObject({ west: z.number().int(), south: z.number().int(), east: z.number().int(), north: z.number().int() })
  .refine((b) => b.west < b.east && b.south < b.north, 'west < east and south < north');
export type Lv95Bbox = z.infer<typeof Lv95Bbox>;
```
Registry-with-sorted/unique-refine (copy for `photo-map` uniqueness of `file`, `regions`, `plates` id uniqueness) — `data/schemas/photo.ts` lines 82-90:
```ts
export const ExifSidecar = z
  .strictObject({ schemaVersion: z.literal(1), photos: z.array(ExifSidecarEntry).min(1) })
  .refine((s) => s.photos.every((p, i) => i === 0 || s.photos[i - 1].id < p.id), {
    message: 'photo ids must be unique and sorted ascending', path: ['photos'],
  });
```
- `PhotoId` regex is private at `photo.ts:96` (`const PhotoId = z.string().regex(/^(img-\d{4}|r\d{3}-\d{3})$/)`); the photo-map key must reuse it (export it or move it up). Do not widen it in Phase 15.
- `PhotoFacts` (`photo.ts:216-229`) is `z.strictObject`; add `region` and `country` (closed `z.enum([...])`, not a regex) there.
- Relative imports between schema files are NOT allowed to use `@/`; if `region.ts` needs `PhotoId`, import `./photo.ts` with the extension or duplicate the regex (follow existing practice: duplicate, as photo.ts does at :58 and :96).

---

### `scripts/terrain/build-terrain.mjs` and `scripts/photos/extract-exif.mjs` (`--root`)

**Analog:** `scripts/photos/build-photo-data.mjs` lines 62-105

```js
const NAME = 'photos:build';
/**
 * `--check` and `--root <dir>`. The root defaults to the repository above this
 * script; the guard selftest points it at a temp copy of the inputs (VERIFY-06).
 * Parsed before any ROOT-derived path, so every read and write follows --root.
 */
function parseArgs(argv) {
  const args = { check: false, root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..') };
  const unknown = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--check') { args.check = true; }
    else if (argv[i] === '--root') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) { console.log(`${NAME}: --root needs a directory`); process.exit(1); }
      args.root = path.resolve(value); i++;
    } else { unknown.push(argv[i]); }
  }
  if (unknown.length > 0) {
    console.log(`${NAME}: unknown argument(s) ${unknown.join(' ')}; the flags are --check and --root <dir>`);
    process.exit(1);
  }
  return args;
}
const ARGS = parseArgs(process.argv.slice(2));
const ROOT = ARGS.root;
const SIDECAR_REL = 'data/photos/exif-sidecar.json';
```
- Replace build-terrain's fixed `ROOT` (:77) and arg check (:598-603); derive `SOURCE_DIR`, `PUBLIC_DIR`, `META_PATH`, `PRECACHE_PATH` after `ROOT`. Same for extract-exif (`ROOT` :48, args :286-291).
- Builder-specific constraints (RESEARCH DATA-11): widen `MANAGED` (:89-90) with an optional `<plate>-` prefix; anchor per plate `^${prefix}heightmap-${size}\.([0-9a-f]{10})\.png$`; sweep against union; leave `committedMeta()` regex (:326-337) and terrain.ts bytes untouched; precache stays `[strip, hero]` of the home plate (:466-470).
- Error-message style: `${NAME}: <what>; <fix>` e.g. `add a record for IMG_1234.jpg to data/photos/photo-map.json` (CONTEXT specifics). Keep `` `${entry.id}: position lies outside the DEM extent` `` text (G5 expects it, selftest.mjs:2257).

---

### `data/generated/plates.ts` (NEW)

**Analog:** `data/generated/terrain.ts` (emitted by `build-terrain.mjs` :460 header + `JSON.stringify` + `as const`). Emit `export const plates = {...} as const;` with the same header/indent style; add to guard `MANIFESTS` (below). Give it its own size budget test (terrain.ts is capped at 4096 B in `data/__tests__/terrain.test.ts:59-63`).

---

### `scripts/guards/check-served-images.mjs` (telemetry rule, repo scope)

**Analog:** itself, lines 80-175

Extension-set + pathspec pattern to copy for `TELEMETRY_EXT` (lines 81, 86):
```js
const VIDEO_EXT = new Set(['.mp4', '.m4v', '.mov', '.webm', '.mkv', '.3gp']);
const PATHSPECS = [...IMAGE_EXT, ...VIDEO_EXT].map((ext) => `:(icase)*${ext}`);
const SELFTEST_PREFIX = 'scripts/guards/__selftest__/';
```
Manifest list to extend with plates.ts (lines 91-95):
```js
const MANIFESTS = [
  { file: 'data/generated/image-manifest.ts', regex: /(?<=['"])\/images\/photos\/[^'"]+(?=['"])/g },
  { file: 'data/generated/terrain.ts', regex: /(?<=['"])\/terrain\/[^'"]+(?=['"])/g },
  { file: 'data/generated/media-manifest.ts', regex: /(?<=['"])\/media\/[^'"]+(?=['"])/g },
];
```
git listing (lines 139-143) — add `-co --exclude-standard` variant for the telemetry scan; keep the throw-on-failure behaviour:
```js
function gitLsFiles(root, pathspecs) {
  const out = execFileSync('git', ['ls-files', '-z', '--', ...pathspecs], { cwd: root, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
  return out.split('\0').filter(Boolean);
}
```
`collect(root, fixture)` (lines 149-166): fixture mode walks `--root`; repo mode filters `inScope` (excludes `SELFTEST_PREFIX`). Add `telemetry: all.filter(isTelemetry)` in fixture mode and, in repo mode, the union of `gitLsFiles(-co --exclude-standard, TELEMETRY_PATHSPECS)` and `walk(path.join(root,'public'))`, minus `assets/photos-original/` and `assets/clips-original/` only while untracked. `walk()` (lines 123-133) is reusable as-is.

---

### Served-images selftest fixtures (NEW dirs)

**Analog:** `scripts/guards/__selftest__/served-images/bad-mp4-uuid/` (`README.md`, `data/generated/media-manifest.ts`, `public/media/coin-flip-toss.fe7f168ef1.mp4`)

Case shape to copy (selftest.mjs:1704-1710):
```js
{
  name: 'served-images: an MP4 with a top-level uuid box fails the video rule',
  guard: SERVED,
  args: ['--root', si('bad-mp4-uuid')],
  expectExit: 1,
  expectOutput: ['public/media/coin-flip-toss.fe7f168ef1.mp4 video: forbidden box uuid'],
},
```
Pure-helper case (selftest.mjs:1737-1738): `{ name, fn: () => expectEqual('violations', checkMp4(fs.readFileSync(...)).join('; '), '...') }`.
- Per RESEARCH: put telemetry MP4s outside hashed dirs (e.g. `bad-mp4-djmd/clips/DJI_0001.MP4`) so only the `video` rule fires; build bytes by `Buffer.concat` splice of `good-mp4/public/media/coin-flip-toss.d423c62633.mp4` (helper code in RESEARCH "Synthetic telemetry MP4"); one README per fixture stating "synthetic, no camera data". Sidecar fixtures: tiny text files (`bad-telemetry-srt/x.SRT` etc., mixed case).

---

### `scripts/guards/selftest.mjs` additions

**Analog:** itself.

G5 inputs list (lines 783-789) — extend with `data/photos/photo-map.json`, `data/regions/regions.json`, `data/terrain/plates.json` in the same commit as the generator change:
```js
const PHOTO_DATA_INPUTS = [
  'data/photos/exif-sidecar.json',
  'data/photos/corrections.json',
  'data/terrain/source/source.json',
  'data/terrain/source/dem-10m.png',
  'data/generated/photos.ts',
];
```
Temp-root-with-edit helper (lines 796-818): copies inputs into `mkdtemp/root`, edits `{ sidecar, corrections }`, throws if the edit changed nothing. Extend `files` with `photoMap`, `regions`, `plates`. G5 case shape with setup (lines 2245-2257):
```js
setup: () => {
  photoDataOffPlateRoot = tempPhotoDataRoot(({ corrections }) => { /* mutate */ });
  return ['--root', photoDataOffPlateRoot];
},
expectExit: 1,
expectOutput: ['r004-011: position lies outside the DEM extent', 'photos:build: stale'],
```
Every new temp root must be added to the cleanup array at line 2324.
Temp git repo (lines 834-838) for repo-mode telemetry cases (`cwd: <tmp>`, no `--root`):
```js
const GIT_FIXTURE_CONFIG = ['-c', 'user.name=selftest', '-c', 'user.email=selftest@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false'];
function gitIn(root, ...args) { /* spawnSync git, throw on non-zero */ }
```
Fixture plate (D-13): follow `tempDeriveRoot` (line 958, async, sharp-generated inputs) + `snapshotTree`/`treeUnchanged` (used at :2264) to assert Matterhorn byte-identity; sharp only allowed here (ESLint ban outside `scripts/`). Photo scripts spawn with `nodeArgs: PHOTO_NODE_ARGS` (line 31) for the `.ts` schema imports — build-terrain needs the same once it imports `plates` schema.

---

### `scripts/guards/test-count.mjs` (`--scan-only`)

**Analog:** itself, lines 35-66

```js
const FOCUS_OR_SKIP = /\.(only|skip|fixme)\(/;
const UNIT_TEST_ROOTS = ['app', 'components', 'lib', 'data'];
function parseArgs(argv) {
  const args = { jest: null, list: null, baseline: DEFAULT_BASELINE, root: process.cwd(), update: false };
  const valued = { '--jest': 'jest', '--list': 'list', '--baseline': 'baseline', '--root': 'root' };
  for (...) { if (flag === '--update') { args.update = true; } else if (valued[flag]) {...} else { usage(`unknown argument ${flag}`); } }
  if (!args.jest) usage('--jest <file> is required');   // skip when args.scanOnly
  return args;
}
```
Add a `--scan-only` boolean beside `--update`; reject with `--jest/--list/--update`; call `findFocusedOrSkipped(args.root)` only (shape in RESEARCH "Code Examples"). Update `usage()` text. Selftest: reuse `tc('focused')` / `tc('clean')`.

---

### `lib/__tests__/photo-routes.test.ts` (D-18 source scan)

**Analog:** `components/home/__tests__/boundary.test.ts` lines 1-60 (recursive walk, comment stripping, `@jest-environment node`)

```ts
/**
 * @jest-environment node
 * ... The files are discovered with a recursive readdirSync walk, so every file a
 * later plan adds is held to the same rules without editing this test.
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const toPosix = (p: string) => p.split(path.sep).join('/');
function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
}
```
- Walk `app/`, `components/`, `lib/` + `proxy.ts`; exempt `lib/photos/routes.ts`; apply `HAND_BUILT` regexes from RESEARCH; include good/bad snippet self-test arrays. Note `stripComments` would also be safe here (comments use `{slug}`), but scanning raw text matches RESEARCH's false-positive check.
- Secondary analog for a narrower static-source test: `components/site/__tests__/SiteFooter.test.tsx:164-185` (`read()` + `test.each(Object.entries(sources))`). When `SheetBand/SheetLegend` are extracted, **add their paths to that `sources` object** (RESEARCH trap 5).

---

### `lib/photos/routes.ts` (NEW)

No direct analog. Use RESEARCH "photoHref" example verbatim:
```ts
import { editorial } from '@/data/photos/editorial';
export const photoHref = (slug: string): `/photos/${string}` => `/photos/${slug}`;
export const photoRouteSlugs: readonly string[] = Object.values(editorial).map((e) => e.slug);
```
`proxy.ts` currently builds `KNOWN` from `photoSlugs` (proxy.ts ~:15-17 `new Set(...)`); swap the import only. `DETAIL_PATH` (:25) is a parser, not a builder — leave it.

---

### `lib/ascent/home.ts` / `data/home.ts` (Home list)

**Analog:** `lib/ascent/waypoints.ts` lines 85-100 (default-input parameter + `RangeError`)
```ts
export function buildWaypoints(
  input: WaypointInput = { photos, editorial, imageManifest },
): readonly Waypoint[] {
  if (input.photos.length === 0) {
    throw new RangeError('buildWaypoints: the photo set is empty; Home needs at least one waypoint');
  }
```
Change only the default to `homeInput()` (filter `photos` by `homeWaypointIds`, throw `RangeError` on a missing id). Never filter inside the function (synthetic-id tests at `lib/__tests__/ascent-waypoints.test.ts:140-187`).
Lookup-or-throw style for `data/home.ts` (lines 3-7):
```ts
function navHref(label: ...): string {
  const entry = site.nav.find((item) => item.label === label);
  if (!entry) throw new Error(`data/home: no site.nav entry labelled ${label}`);
  return entry.href;
}
```

---

### `components/terrain/ContourField.tsx` (+`plate`) and new `SheetBand`/`SheetLegend`

**Analog:** `components/terrain/ContourField.tsx` (whole file, 36 lines)
```tsx
import { terrain } from '@/data/generated/terrain';
export type ContourLod = keyof typeof terrain.assets.contours;
/** ... Server component, zero JS, no motion (D-21). ... */
export default function ContourField({ lod, className }: { lod: ContourLod; className?: string }) {
  const mask = `url(${terrain.assets.contours[lod]})`;
  return <div aria-hidden="true" className={['bg-contour', className].filter(Boolean).join(' ')} style={{ maskImage: mask, ... }} />;
}
```
Keep the URL string identical for `plate="matterhorn"`; type `lod` per plate. New sheet components: server components, no `'use client'`, no wrapper element, no `@container` (SiteFooter.tsx:68, :109), band stays footer's first child.

---

### Data tests: `data/__tests__/photo-map.test.ts`, `plates.test.ts`, `home.test.ts`, terrain D-15 pin

**Analog:** `data/__tests__/exif-sidecar.test.ts` lines 1-30
```ts
import fs from 'node:fs';
import path from 'node:path';
import { Coord4, ExifSidecar, ExifSidecarEntry, NaiveLocal } from '@/data/schemas/photo';
const raw = fs.readFileSync(path.join(process.cwd(), 'data/photos/exif-sidecar.json'), 'utf8');
const sidecar = JSON.parse(raw) as ExifSidecar;
const byId = new Map(sidecar.photos.map((p) => [p.id, p]));
const photo = (id: string) => { const p = byId.get(id); if (!p) throw new Error(`sidecar has no entry ${id}`); return p; };
describe('exif sidecar: schema and shape', () => {
  test('the committed sidecar parses with ExifSidecar', () => { expect(() => ExifSidecar.parse(sidecar)).not.toThrow(); });
```
Named-lookup helper (`photo(id)`) is the pattern for "named fixtures instead of index lookups". For D-15, extend `data/__tests__/terrain.test.ts` (lines 20-35 build `urls` from `terrain.assets`) with a literal `toEqual` of the nine names. Closed-sidecar test: `ExifSidecarEntry.safeParse({ ...valid, serial: 'x' }).success === false`.

---

## Shared Patterns

### Zod-only schema imports
**Source:** `data/schemas/terrain.ts:13-17` — **Apply to:** every new/changed schema imported by an `.mjs` generator. No `@/`, no extension-less relative imports, erasable TS only.

### `--root` + `--check` CLI
**Source:** `scripts/photos/build-photo-data.mjs:64-105` — **Apply to:** build-terrain, extract-exif. Parse args before any ROOT-derived path; `${NAME}:`-prefixed messages; exit 1.

### Guard prove-it-can-fail
**Source:** `scripts/guards/selftest.mjs:1-24` case shape — **Apply to:** every new guard rule (telemetry, scan-only, ci-gate IN-02/03, G5 registry cases, fixture plate). Every temp root joins the cleanup array (:2324).

### Error messages name file and fix
**Source:** CONTEXT specifics; `data/home.ts:5`, build-photo-data off-extent text — **Apply to:** all new failures.

### Never a silent pass
**Source:** `check-served-images.mjs` `collect()` comment (:148) and `gitIn` throw (:836) — **Apply to:** new git listing and fixture setup code.

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `__tests__/jest-globals.d.ts` | type declarations | No global d.ts exists; use RESEARCH GUARD-10 block verbatim plus `testPathIgnorePatterns: [..., '\\.d\\.ts$']` in `jest.config.js` and a `@ts-expect-error` canary |
| `tsconfig.jest.json` / `tsconfig.e2e.json` | config | First child tsconfigs; use RESEARCH JSON (must override `exclude`; verify with `--listFilesOnly`) |

## Metadata

**Analog search scope:** `data/schemas/`, `data/__tests__/`, `scripts/photos/`, `scripts/guards/` (+`__selftest__/served-images/`), `lib/ascent/`, `components/terrain/`, `components/home/__tests__/`, `components/site/__tests__/`, `proxy.ts`
**Files scanned:** ~20
**Pattern extraction date:** 2026-11-14
