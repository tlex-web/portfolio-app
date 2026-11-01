# Phase 11: Engineering & Roadmap - Pattern Map

**Mapped:** 2026-11-01 (fresh map for the box + coin-flip re-plan; the CLI_X-era map was deleted)
**Files analyzed:** 38 new/modified (plus the removal set in §Removal Targets)
**Analogs found:** 34 / 38

> **Privacy (D-23).** Nothing here quotes `tlex-web/coin-flip`. Every analog is a git-tracked file in this repo (checked with `git ls-files`).
>
> **CLI_X files are removal targets, not analogs.** Copy the *route contract, island mechanics and pipeline shape* from the files below. Do not copy CLI_X wording, slugs, `riskLevel`/`riskScore`, `RiskScaleBlock`, `PricingBlock` or `features`.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/(site)/roadmap/page.tsx` (rewrite to RSC) | route (page) | request-response (searchParams to filtered view) | `app/(site)/photos/page.tsx` | exact |
| `app/(site)/projects/page.tsx` (rewrite to RSC) | route (page) | request-response (static data) | `app/(site)/photos/page.tsx` (metadata + server body) | role-match |
| `app/(site)/projects/[slug]/page.tsx` (body swap to `CaseStudy`) | route (page) | request-response | itself, lines 1-50 (11-01 route contract) | exact (keep top, replace body) |
| `lib/route-log.ts` | utility (pure) | transform | `lib/photos/view-param.ts` | exact |
| `lib/log-date.ts` | utility (pure) | transform | `lib/home-format.ts` `formatCaptureMonth` (lines 67-71) | exact |
| `lib/trail-profile.ts` | utility (pure) | transform | `lib/photos/view-param.ts` (header rule) + `lib/terrain/dem-sample.ts` | role-match |
| `lib/trail-grade.ts` (shrink to marker map) | utility (pure) | transform | itself (drop `RiskLevel`, `RiskBand`, `RISK_BANDS`, `bandFor`, `isScoreInLevel`) | exact |
| `lib/demo-terminal.ts` (+ `releaseSticky`, header reword) | utility (pure state machine) | event-driven | itself | exact |
| `components/projects/DemoTerminal.tsx` (retarget + D-02) | component (client island) | event-driven | itself | exact |
| `components/roadmap/RouteLogFilters.tsx` | component (client island) | request-response (URL replace) | `components/photos/ViewSwitcher.tsx` | exact |
| `components/projects/RouteIndex.tsx` | component (client island) | event-driven (scroll-spy) | `components/projects/DemoTerminal.tsx` IntersectionObserver effect (lines 148-160) | partial |
| `components/projects/RoutePanel.tsx` | component (server) | transform (data to markup) | `components/photos/PhotosHeader.tsx` (server band) | role-match |
| `components/projects/RouteProfile.tsx` | component (server, inline SVG) | transform | none in repo for a profile SVG; generated-data import like `data/generated/terrain.ts` consumers | partial |
| `components/projects/TrailGradeMark.tsx` | component (server) | transform | `lib/trail-grade.ts` marker map + `bg-trail` in `app/globals.css` | partial |
| `components/projects/CaseStudy.tsx` | component (server) | transform (slot switch) | RESEARCH Pattern 2 (no exhaustive-switch renderer exists yet) | no analog |
| `components/projects/sections/*.tsx` (Problem, Pipeline, Safety, Privacy, Metrics, Demo, Stack, NextSteps) | component (server) | transform | `app/(site)/projects/[slug]/page.tsx` lines 159-167 (section + h2 id pattern) | role-match |
| `components/projects/DemoClip.tsx` | component (server) | file-I/O (static media) | RESEARCH §Code Examples "Clip figure" | no analog |
| `components/roadmap/RouteLog.tsx`, `RouteRow.tsx` | component (server) | transform | `app/(site)/photos/page.tsx` section/sr-only h2 pattern | role-match |
| `data/schemas/project.ts` (box/coin-flip union) | model (zod) | CRUD/validation | itself (union + strictObject conventions, lines 1-17, 91-136) | exact |
| `data/schemas/roadmap.ts` | model (zod) | validation | `data/schemas/project.ts` / `data/schemas/image-manifest.ts` header | exact |
| `data/schemas/media-manifest.ts` (optional) | model (zod) | validation | `data/schemas/image-manifest.ts` | exact |
| `data/projects.ts`, `data/roadmap.ts`, `data/types.ts` | model (data) | static data | current files (shape only) | role-match |
| `data/home.ts` (D-33 sentence) | model (data) | static data | itself | exact |
| `scripts/terrain/build-trails.mjs` | utility (build script) | batch / file-I/O, `--check` | `scripts/terrain/build-terrain.mjs` | exact |
| `scripts/terrain/fetch-trails.mjs` | utility (manual networked) | request-response (once) | `scripts/terrain/fetch-dem.mjs` | exact |
| `scripts/media/build-clip.mjs` | utility (build script) | batch / file-I/O, `--check` | `scripts/photos/build-derivatives.mjs` | exact |
| `scripts/guards/lib/mp4-boxes.mjs` | utility (pure) | transform (binary parse) | RESEARCH §Code Examples "MP4 box walker" | no analog |
| `scripts/guards/check-served-images.mjs` (extend for video) | config/guard | batch | itself, lines 55-80 | exact |
| `scripts/guards/selftest.mjs` + `__selftest__/served-images/*.mp4` | test | batch | itself (`{ name, fn }` pure cases) | exact |
| `data/generated/trail-profiles.ts`, `media-manifest.ts` | config (generated) | file-I/O | `data/generated/image-manifest.ts` header | exact |
| `data/terrain/source/trails.json`, `data/media/clips.json` | config (source/sidecar) | file-I/O | `data/terrain/source/source.json`, `data/photos/exif-sidecar.json` | exact |
| `public/service-worker.js` (media bypass) | middleware (SW) | request-response | itself, lines 111-128 (early-return chain) | exact |
| `next.config.ts` (`/media/:path*` header) | config | — | itself, lines 30-41 (`/terrain/:path*`) | exact |
| `proxy.ts` (matcher exclusion `media/`) | config | — | itself, lines 45-50 | exact |
| `package.json` (`trails:build`, `clip:derive`, `data:check`) | config | — | itself, lines 28-33 | exact |
| `.gitignore` (`assets/clips-original/`) | config | — | line 58 `assets/photos-original/` | exact |
| Tests: `lib/__tests__/{route-log,log-date,trail-profile,trail-grade}.test.ts`, `data/__tests__/{projects,roadmap,trail-profiles,media-manifest}.test.ts` | test | — | `data/__tests__/image-manifest.test.ts`, `lib/__tests__/` siblings | exact |
| Tests: `components/roadmap/__tests__/RouteLogFilters.test.tsx` | test | — | `components/photos/__tests__/view-switcher.test.tsx` | exact |
| Tests: `components/projects/__tests__/{RoutePanel,CaseStudy,DemoClip,...}.test.tsx`, `DemoTerminal.test.tsx` | test | — | `components/projects/__tests__/DemoTerminal.test.tsx` | role-match |
| e2e: `e2e/roadmap.spec.ts`, rewrites of `case-study`, `projects`, `shell`, `no-webgl`, `visual/routes.spec.ts` | test | — | `e2e/photos.spec.ts` | role-match |

## Pattern Assignments

### `app/(site)/roadmap/page.tsx` (route, request-response)

**Analog:** `app/(site)/photos/page.tsx`

**Imports + metadata** (lines 1-11):
```tsx
import type { Metadata } from 'next';
import ViewSwitcher from '@/components/photos/ViewSwitcher';
import { VIEW_LABELS, parseView } from '@/lib/photos/view-param';

export const metadata: Metadata = { title: 'Photographs' };   // -> { title: 'Roadmap' }
```

**Core pattern: awaiting `searchParams`, parsing on the server, passing state as props** (lines 30-49):
```tsx
export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const view = parseView((await searchParams).view);
  ...
  <PhotosHeader photos={photoViews}>
    <ViewSwitcher view={view} />
  </PhotosHeader>
```
For roadmap, do `const sp = await searchParams;`, then `parseProject(sp.project)`/`parseStatus(sp.status)`, then `routeLogView(items, filter)`, and pass `filter` and `counts` to `RouteLogFilters`. Keep the doc-comment header style (requirement IDs, decision IDs, UI-SPEC section names). Remove `'use client'` from the current file.

**Section a11y pattern** (lines 52-57): `<section aria-labelledby="…-title"><h2 id="…-title" className="sr-only">`.

---

### `app/(site)/projects/page.tsx` (route, static RSC)

**Analog:** the same file, `app/(site)/photos/page.tsx`. Use the `metadata` export (line 11) with `{ title: 'Engineering' }` and the container `mx-auto w-full max-w-6xl px-4 … sm:px-6 lg:px-8` (line 50). Map `projects` to `<RoutePanel>` with box first. No `searchParams` here.

---

### `app/(site)/projects/[slug]/page.tsx` (route, body swap)

**Analog:** itself (11-01). **Keep lines 1-3 and 27-50 as they are:**
```tsx
interface PageProps { params: Promise<{ slug: string }>; }
export const dynamicParams = false;
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return { title: project.name };           // add description: project.pitch once approved
}
...
  if (!project) { notFound(); }
```
**Replace lines 4-9 and 52-215:** drop the `FeatureShowcase`, `TechStackDisplay`, `ProjectHighlights` and `toLegacyHighlights` imports, the `statusColors` map, the inline SVG buttons and the v1 hero. The body becomes `<CaseStudy project={project} />`. Update the header comment: line 19's `/projects/CLIX-CLI` example becomes `/projects/BOX`. The Demo section pattern at lines 159-167 (`section id="demo" aria-labelledby="demo-title"` with `h2.text-heading text-balance`) moves into `sections/Demo.tsx`.

---

### `lib/route-log.ts` (pure utility, transform)

**Analog:** `lib/photos/view-param.ts` (whole file, 41 lines)

**Header rule** (lines 1-13): "Pure and import-free: keep it to erasable TypeScript and never add an import." Copy that sentence, and explain why the whitelist exists (T-10-10 style threat note).

**Whitelist + parser + href** (lines 15-40):
```ts
export const VIEWS = ['map', 'grid', 'carousel'] as const;
export type GalleryView = (typeof VIEWS)[number];
export const VIEW_LABELS: Record<GalleryView, string> = { map: 'Map', grid: 'Grid', carousel: 'Carousel' };
function isView(v: unknown): v is GalleryView {
  return typeof v === 'string' && (VIEWS as readonly string[]).includes(v);
}
export function parseView(v: unknown): GalleryView {
  if (isView(v)) return v;
  return 'map';
}
export function viewHref(view: GalleryView): string {
  return view === 'map' ? '/photos' : `/photos?view=${view}`;
}
```
Map it to `PROJECTS = ['portfolio','box','coin-flip']` and `STATUSES = ['completed','in-progress','planned']`, with `parseProject`/`parseStatus` returning `'all'` on a miss. `routeLogHref` emits a canonical `?project=…&status=…` and drops `all`. Add `filterItems`, `countsFor`, `bands` and `newestCompletedAt` (including phase dates), as RESEARCH Pattern 6 describes.

---

### `lib/log-date.ts` (pure utility)

**Analog:** `lib/home-format.ts` lines 67-71 (month table + split):
```ts
export function formatCaptureMonth(capture: CaptureLike): string {
  if (capture.precision === 'year') return String(capture.year);
  const [year, month] = capture.local.split('-');
  return `${MONTHS_SHORT[Number(month) - 1]} ${year}`;
}
```
For the full implementation with a `RangeError` on bad input, use RESEARCH §Code Examples "formatLogDate". Consider reusing `MONTHS_SHORT` only if `lib/home-format.ts` stays import-free. Otherwise duplicate the table so the module stays import-free.

---

### `lib/trail-grade.ts` (shrink)

**Analog:** itself. Remove the exports at line 14 (`RiskLevel`), line 16 (`RiskBand`), line 28 (`RISK_BANDS`), line 36 (`bandFor`) and line 46 (`isScoreInLevel`). Keep a grade-to-marker map (`T1→yellow`, `T2/T3→white-red-white`, `T4/T5→white-blue-white`, `T6→unmarked`) and throw on an unknown grade. The importers are `data/schemas/project.ts`, `lib/__tests__/trail-grade.test.ts` and `data/__tests__/projects.test.ts`. Rewrite the 6 band tests as ≥ 6 marker tests in the same commit.

---

### `lib/demo-terminal.ts` (pure state machine, add `releaseSticky`)

**Analog:** itself.
- Lines 1-3: reword "The CLI_X demo terminal's state machine" to box.
- Lines 13-14: the phase docs say 'input' "types the request", which becomes "types the command line"; 'output' "types the command", which becomes "types the captured output".
- Lines 30-34: keep `TerminalCommand { input; output }` unchanged so `DemoCommand` still matches structurally.
- Lines 37-42: `TIMINGS` stay unchanged.
- Add `releaseSticky(p: PauseSources): PauseSources` next to `isPlaying` (`PauseSources` is at ~lines 113-124). Use the code from RESEARCH Pattern 3.

---

### `components/projects/DemoTerminal.tsx` (client island, retarget + D-02)

**Analog:** itself.

**Imports** (lines 1-16): keep `'use client'`, `useEffect, useRef, useState, useSyncExternalStore, type FocusEvent`, `@phosphor-icons/react/dist/ssr` (drop `WarningIcon` once the warning line goes), `import type { DemoCommand } from '@/data/types'` and `useReducedMotion`.

**State wiring to keep** (lines 133-146):
```tsx
const [override, setOverride] = useState<boolean | null>(null);
const [hover, setHover] = useState(false);
const [focusWithin, setFocusWithin] = useState(false);
const [offscreen, setOffscreen] = useState(false);
const hidden = useSyncExternalStore(subscribeVisibility, getHidden, getServerHidden);
const sticky = override ?? reduced;
const playing = isPlaying({ sticky, hover, focusWithin, offscreen, hidden }, count);
```

**Edits:**
- Line 175 `aria-label="CLI_X demo"` becomes `"box demo"`, and lines 187-189 title text `CLI_X` becomes `box`.
- Line 181 `onFocus={() => setFocusWithin(true)}` becomes a named `onFocus` that mirrors `onBlur` (lines 162-166):
  ```tsx
  function onBlur(e: FocusEvent<HTMLDivElement>) {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setFocusWithin(false);
  }
  ```
- Line 197 `onClick={() => setOverride(!sticky)}` becomes this: if `sticky`, then `setOverride(false); setHover(false); setFocusWithin(false);` (the D-02 release, which matches `releaseSticky`); else `setOverride(true)`.
- `CommandLines`: drop the Request label, warning and explanation lines, and add the optional `note` line. `spokenCommand` text follows RESEARCH Pattern 3.
- Tests assert `aria-pressed` and `data-playback` only (lines 176, 194 attributes).

---

### `components/roadmap/RouteLogFilters.tsx` (client island, URL replace)

**Analog:** `components/photos/ViewSwitcher.tsx` (whole file, 73 lines)

**Imports** (lines 1-5):
```tsx
'use client';
import { useRouter } from 'next/navigation';
import { VIEWS, VIEW_LABELS, viewHref, type GalleryView } from '@/lib/photos/view-param';
```
Add `useOptimistic, useTransition` from `react`.

**Literal class constants** (lines 13-22). Copy them verbatim as the segmented-control styling precedent (10-UI-SPEC):
```tsx
const SEGMENT = 'relative inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 rounded-sm px-4 text-base font-semibold transition-colors duration-(--duration-fast) ease-erosion';
const UNSELECTED = 'text-ink-muted hover:bg-surface-overlay hover:text-ink';
const SELECTED = 'bg-surface-overlay text-ink after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:bg-accent';
```
Add a literal `DISABLED` class map for `aria-disabled` segments, with no computed classes.

**Group + toggle-button pattern** (lines 46-69):
```tsx
<div role="group" aria-label="View" className="inline-flex gap-1 rounded-sm border border-line-strong bg-surface-raised p-1">
  {VIEWS.map((v) => {
    const pressed = v === view;
    return (
      <button key={v} type="button" aria-pressed={pressed}
        className={`${SEGMENT} ${pressed ? SELECTED : UNSELECTED}`}
        onClick={() => { if (pressed) return; router.replace(viewHref(v), { scroll: false }); }}>
```
Use two groups ("Project", "Status"). Wrap the replace in `startTransition(() => { setOptimistic(next); router.replace(...) })` (RESEARCH Pattern 1). A zero-count segment gets `aria-disabled="true"` and its press is a no-op. A pressed segment is never disabled. Add a polite `role="status"` count line.

---

### `components/projects/RouteIndex.tsx` (client island, scroll-spy)

**Analog (partial):** the `DemoTerminal.tsx` IntersectionObserver effect (lines 148-160):
```tsx
useEffect(() => {
  const region = regionRef.current;
  if (!region || typeof IntersectionObserver === 'undefined') return;
  const observer = new IntersectionObserver((entries) => { ... }, { threshold: 0 });
  observer.observe(region);
  return () => observer.disconnect();
}, []);
```
Observe each section id and set `aria-current` on the active link. The server renders plain anchor links, so the index works without JS. Hide it when fewer than 2 sections render. It must pass React Compiler rules at error level, so never add it to `LEGACY_COMPILER_FILES`.

---

### Server components: `RoutePanel`, `RouteProfile`, `TrailGradeMark`, `CaseStudy`, `sections/*`, `RouteLog`, `RouteRow`, `DemoClip`

**Shared server-component conventions** (from `app/(site)/photos/page.tsx` and `components/photos/PhotosHeader.tsx`):
- No `'use client'`, and default export for page-level parts.
- Doc-comment header that cites requirement IDs, decision IDs and UI-SPEC sections.
- Tokens only: `text-ink`, `text-ink-muted`, `bg-surface-raised`, `border-line`, `border-line-strong`, `bg-accent`. Trail yellow is painted only via `bg-trail` / `--trail-yellow` (`app/globals.css`). Never use `dark:` variants.
- Headings: `className="text-heading text-balance"`, with the `id` matched by `aria-labelledby` (`[slug]/page.tsx` lines 161-164).
- Icons come only from `@phosphor-icons/react/dist/ssr` (DSGN-10).

**`CaseStudy.tsx`:** no repo analog. Use RESEARCH Pattern 2 verbatim: `SECTION_ORDER` const, exhaustive `switch` with a `never` default, each renderer returning `null` when its data is absent. The third slot's id and label come from the project (`safety`/`Safety` for box, `privacy`/`Privacy` for coin-flip).

**`DemoClip.tsx`:** no repo analog. Use RESEARCH §Code Examples "Clip figure". It renders only when the `media-manifest` entry **and** `clip.description` both exist. Tests assert the `video.muted` property (Pitfall 7) and that `autoPlay` and `loop` are absent.

**`RouteProfile.tsx`:** imports `data/generated/trail-profiles.ts` (server-only; a test asserts that no `'use client'` module imports it). It renders the `profilePath()` output as inline SVG with `aria-hidden`, and the caption carries the meaning.

**`RoutePanel.tsx`:** for box, the GitHub link uses `target`/`rel` as in `[slug]/page.tsx` lines 97-101 (`target="_blank" rel="noopener noreferrer"`), subject to UI-SPEC §I #7. coin-flip shows text only, never a link (D-12).

---

### `data/schemas/project.ts` (zod model, rewrite)

**Analog:** itself. **Keep** the header rules (lines 10-16: strictObject everywhere; "Imports only 'zod' … erasable TypeScript so Node can type-strip it"), `import { z } from 'zod';` (line 17) and the union idiom (line 135):
```ts
export const ProjectSchema = z.discriminatedUnion('slug', [ClixCli, ClixWebsite]);   // -> [Box, CoinFlip]
export type ProjectSchema = z.infer<typeof ProjectSchema>;
```
Keep the `Base.extend({ slug: z.literal(...) })` idiom (lines 120-133). **Remove:** `RiskLevel` (19-21), `RiskScaleBlock` (33-41), `PricingBlock` (43-59), `HighlightBlock` (77-84), `riskLevel`/`riskScore`/`warning`/`explanation` (91-98), and `features`/`status`/`featured`/`tagline`… from `ProjectBase` (101-118). The new shape is RESEARCH Pattern 5. Stop referencing `lib/legacy-highlights.ts` in the header (lines 6-8).

### `data/schemas/roadmap.ts`, `data/schemas/media-manifest.ts` (zod model, new)

**Analog:** `data/schemas/image-manifest.ts` lines 1-20 (the header explains which script writes or reads it, then the "Imports only 'zod' … Node 24 type-strips this file" paragraph, then `import { z } from 'zod';`). Export constants next to the schema (as `MAX_LONG_EDGE` at line 23). For media, export `MAX_CLIP_BYTES = 1_572_864` and the 5-10 s duration bounds.

---

### `scripts/terrain/build-trails.mjs` (build script, offline, `--check`)

**Analog:** `scripts/terrain/build-terrain.mjs`
- **Header** (lines 1-61): shebang, then a doc block naming the decisions, "OFFLINE: it reads only data/terrain/source/ … CI and Vercel never touch the network (T-08-09)", a pipeline ASCII list, the `--check by artifact type` section, and usage `npm run terrain:build -- --check (part of npm run data:check / lint)`.
- **Generated header** (line 460): `'// AUTO-GENERATED by scripts/terrain/build-terrain.mjs from data/terrain/source/. Do not edit.\n'`
- **Arg handling + exit** (lines 593-606):
  ```js
  const unknown = args.filter((a) => a !== '--check');
  if (unknown.length) { console.log(`${NAME}: unknown argument(s) ${unknown.join(' ')}; the only flag is --check`); process.exit(1); }
  (args.includes('--check') ? check() : write()).catch((e) => { ...; process.exit(1); });
  ```
- **Check output:** one line per problem, then `trails: OK` or `trails: N stale` (`process.exit(lines.length === 0 ? 0 : 1)`, line 589).
- DEM decode and sha256 verification are reused from the same file. Sampling uses `sampleAtLv95` from `lib/terrain/dem-sample.ts` (lines 48-58).
- `package.json`: add `"trails:build": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/terrain/build-trails.mjs"` (mirror line 31), and append `&& npm run trails:build -- --check` to `data:check` (line 33).

### `scripts/terrain/fetch-trails.mjs` (manual, networked)

**Analog:** `scripts/terrain/fetch-dem.mjs` (the manual one-off that writes committed source plus provenance). It uses Node's built-in `fetch` and is never run in CI. It writes `data/terrain/source/trails.json` with `polylineSha256` and provenance.

### `scripts/media/build-clip.mjs` (build script, write/`--check`)

**Analog:** `scripts/photos/build-derivatives.mjs`
- **Header** (lines 1-30): it names the gitignored originals folder, "generated here, on Tim's machine … and committed. CI only checks them", the file-name rule `<id>.<first 10 hex of sha256(bytes)>.<ext>`, "the committed bytes are authoritative", and "Write mode builds it from the encoded buffers in memory; --check rebuilds it from the files on disk. Both go through the same assembly".
- **Encode core:** RESEARCH §Code Examples "Encode and poster" (`execFileSync('ffmpeg', args)` with no shell; poster via sharp `.webp({ quality: 82 })`, never a metadata-retaining sharp call).
- `--check` imports `scripts/guards/lib/mp4-boxes.mjs`. With no clip present, it writes an empty manifest object and passes.
- `package.json`: `"clip:derive"` mirrors `photos:derive` (line 28). Append `&& npm run clip:derive -- --check` to `data:check`. In `.gitignore`, add `assets/clips-original/` next to line 58.

### `scripts/guards/check-served-images.mjs` (guard, extend)

**Analog:** itself, lines 55-80:
```js
const IMAGE_EXT = new Set(['.jpg', '.jpeg', … '.svg']);          // + .mp4 .m4v .mov .webm .mkv .3gp (or a VIDEO_EXT set)
const HASHED_DIRS = ['public/terrain/', 'public/images/photos/']; // + 'public/media/'
const HASH_NAME = /^[a-z0-9-]+\.([0-9a-f]{10})\.(png|svg|avif|webp|jpg)$/;  // + mp4
const SCRIPT_DIRS = ['scripts/photos/', 'scripts/terrain/'];      // + 'scripts/media/'
const MANIFESTS = [
  { file: 'data/generated/image-manifest.ts', regex: /(?<=['"])\/images\/photos\/[^'"]+(?=['"])/g },
  { file: 'data/generated/terrain.ts', regex: /(?<=['"])\/terrain\/[^'"]+(?=['"])/g },
  // + { file: 'data/generated/media-manifest.ts', regex: /(?<=['"])\/media\/[^'"]+(?=['"])/g },
];
```
Reuse `METADATA_MARKERS` (XMP entries) for the MP4 byte scan. The video rules come from RESEARCH §C. Selftest fixtures go under `scripts/guards/__selftest__/served-images/`, and the size rule is a pure `{ name, fn }` case in `scripts/guards/selftest.mjs`.

### `public/service-worker.js` (SW, media bypass)

**Analog:** itself, lines 111-128 (early `return` without `respondWith`):
```js
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') { return; }
  if (url.protocol === 'chrome-extension:') { return; }
  if (url.pathname.startsWith('/api/')) { return; }
```
Insert the RESEARCH "Service-worker bypass" check (`range` header or `destination` video/audio leads to `return;`) right after the non-GET check. Do not add the clip to `data/generated/precache.json`.

### `next.config.ts` and `proxy.ts`

- `next.config.ts` lines 30-41: duplicate the `/terrain/:path*` block as `/media/:path*` with `public, max-age=31536000, immutable`, and keep the comment style ("every file … has a content hash in its name").
- `proxy.ts` line 49: `'/((?!api|_next/static|_next/image|favicon.ico|service-worker.js|images/|terrain/).*)'`. Add `media/` before `).*)`, and update the comment on lines 46-47.

---

### Tests

**Data/lib tests.** Analog: `data/__tests__/image-manifest.test.ts` lines 1-30. Copy the doc header (requirement and decision IDs, "File system only: … never runs in Jest"), the imports `node:fs`/`node:path`, `@/data/generated/...` and `@/data/schemas/...`, `const ROOT = process.cwd()` and the recursive `sources(dir)` helper. `sources(dir)` is the tool for the "no `'use client'` module imports trail-profiles" assertion. Put the absolute-path and coin-flip-privacy assertions in `projects.test.ts` (RESEARCH §Code Examples), and the D-20 `surveyedAt` test in `roadmap.test.ts`.

**Island tests.** Analog: `components/photos/__tests__/view-switcher.test.tsx` lines 1-40:
```tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
const replace = jest.fn(); const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace, push, back: jest.fn() }) }));
beforeEach(() => { replace.mockClear(); push.mockClear(); });
function segments() { return within(screen.getByRole('group', { name: 'View' })).getAllByRole('button'); }
```
Assert `aria-pressed`, `aria-disabled`, and `replace` called with `(href, { scroll: false })`. Assert `push` was never called.

**e2e.** Analog: `e2e/photos.spec.ts` lines 1-30. Import expected values from data and libs (never hand-typed), use `test.describe('… (REQ-IDs, D-xx)')`, and use the `waitForHydration` poll on `__reactProps` before clicking islands. The visual list in `e2e/visual/routes.spec.ts` lines 39-40 becomes `['box','/projects/box'], ['coin-flip','/projects/coin-flip']`. Tim deletes the PNG folders.

## Shared Patterns

### Pure, import-free libs
**Source:** `lib/photos/view-param.ts` lines 1-4, `lib/demo-terminal.ts` line 4
**Apply to:** `lib/route-log.ts`, `lib/log-date.ts`, `lib/trail-profile.ts`, `lib/trail-grade.ts`, `scripts/guards/lib/mp4-boxes.mjs`
> "Pure and import-free: keep it to erasable TypeScript and never add an import."

### zod contracts
**Source:** `data/schemas/project.ts` lines 10-17; `data/schemas/image-manifest.ts` lines 16-20
**Apply to:** all `data/schemas/*`. Use `z.strictObject` everywhere, import only `zod`, and keep the code type-strippable by Node.

### URL-as-state segmented control
**Source:** `lib/photos/view-param.ts` with `components/photos/ViewSwitcher.tsx` and `app/(site)/photos/page.tsx`
**Apply to:** `/roadmap` + `RouteLogFilters`. The server parses `searchParams` and the island receives props. `useSearchParams` is never used, so no Suspense boundary is required. Use `router.replace(href, { scroll: false })` with whitelisted hrefs only.

### Generated data with offline `--check`
**Source:** `scripts/terrain/build-terrain.mjs` (lines 1-61, 460, 589-606); `scripts/photos/build-derivatives.mjs` lines 1-30; `package.json` line 33
**Apply to:** `build-trails.mjs` and `build-clip.mjs`. The output file starts with an AUTO-GENERATED header. Hashed names use `<name>.<10hex>.<ext>`. Output is one line per problem and then `<name>: OK`. Each script is wired into `data:check`.

### Static route contract
**Source:** `app/(site)/projects/[slug]/page.tsx` lines 27-50
**Apply to:** the case-study route (slugs `box` and `coin-flip`). The `clix-*` 404s fall out of `dynamicParams = false`.

### Test-contract ratchet
**Source:** RESEARCH §F test-contract table; GUARD-03 (1349 now)
**Apply to:** every deletion. Each successor test lands in the same commit as the deleted component or test (`ProjectCard`→`RoutePanel`, `RoadmapFilters`→`RouteLogFilters`, `RoadmapTimeline`→`RouteLog`, trail-grade bands→markers, `projects.test.ts` rewritten).

## Removal Targets (not analogs)

| File | Action |
|------|--------|
| `components/ProjectCard.tsx` (+test), `lib/useHexGrid.ts`, `.hex-grid`/`.hex-clip` in `app/globals.css` | Delete in the `RoutePanel` commit |
| `components/RoadmapFilters.tsx`, `RoadmapTimeline.tsx`, `RoadmapProgress.tsx` (+tests) | Delete in the `RouteLog`/`RouteLogFilters` commit |
| `components/FeatureShowcase.tsx`, `ProjectHighlights.tsx`, `TechStackDisplay.tsx`, `lib/legacy-highlights.ts`, `data/__tests__/fixtures/legacy-highlights.json` | Delete when `[slug]/page.tsx` switches to `CaseStudy`; shrink `LEGACY_COMPILER_FILES` |
| CLI_X refs in `data/*`, `lib/demo-terminal.ts`, `app/globals.css:50` comment, `e2e/{case-study,projects,shell,no-webgl}.spec.ts`, `components/site/__tests__/SiteChrome.test.tsx:82`, `e2e/visual/routes.spec.ts:39-40`, `e2e/visual/README.md:16` | Rewrite for box/coin-flip |
| `components/Footer.tsx`, `README.md` | Leave (Phase 12) |

## No Analog Found

| File | Role | Data Flow | Reason / Use instead |
|------|------|-----------|----------------------|
| `components/projects/CaseStudy.tsx` | component | transform | No exhaustive-switch slot renderer exists. Use RESEARCH Pattern 2 |
| `components/projects/DemoClip.tsx` | component | static media | First `<video>` on the site. Use RESEARCH "Clip figure" + Next `02-guides/videos.md` |
| `scripts/guards/lib/mp4-boxes.mjs` | utility | binary parse | First binary container parser. Use RESEARCH "MP4 box walker" |
| `components/projects/RouteProfile.tsx` | component | transform | No elevation-profile SVG exists. Use RESEARCH Pattern 4 step 5 (`profilePath`) |

## Metadata

**Analog search scope:** `app/(site)/{photos,projects,roadmap}`, `components/{photos,projects}`, `lib/`, `lib/photos/`, `lib/terrain/`, `data/schemas/`, `data/generated/`, `data/__tests__/`, `scripts/{terrain,photos,guards}/`, `public/service-worker.js`, `next.config.ts`, `proxy.ts`, `package.json`, `e2e/`
**Tracked-source gate:** all analogs confirmed with `git ls-files`. No mirror paths.
**Pattern extraction date:** 2026-11-01
