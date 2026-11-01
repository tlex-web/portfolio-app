# Phase 11: Engineering & Roadmap - Pattern Map

**Mapped:** 2026-11-01
**Files analyzed:** 33 new/modified (plus the retire list)
**Analogs found:** 31 / 33

> PUBLIC REPO. Every analog below is tracked source in this repo (`git ls-files` checked). Nothing here comes from the private `tlex-web/cli_x` repo.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/(site)/roadmap/page.tsx` (rewrite, RSC) | route | request-response (searchParams) | `app/(site)/photos/page.tsx` | exact |
| `app/(site)/projects/page.tsx` (rewrite, RSC) | route | static render | `app/(site)/photos/page.tsx` (metadata + header band) | role-match |
| `app/(site)/projects/[slug]/page.tsx` (rewrite) | route | static params | `app/(site)/photos/[slug]/page.tsx` | exact |
| `components/roadmap/RouteLogFilters.tsx` | component (client island) | event → URL | `components/photos/ViewSwitcher.tsx` | exact |
| `components/roadmap/RouteLog.tsx`, `RouteRow.tsx` | component (Server) | transform | `components/photos/PhotosHeader.tsx` + `components/home/TrailSigns.tsx` | role-match |
| `components/projects/RoutePanel.tsx` | component (Server) | static | `components/home/TrailSigns.tsx` | role-match |
| `components/projects/RouteProfile.tsx` | component (Server, SVG) | static generated data | TrailSigns (Server, `aria-hidden` decoration) + `data/generated/terrain.ts` consumers | partial |
| `components/projects/TrailGradeMark.tsx` | component (Server) | static | `TrailSigns.tsx` line 50 (`bg-trail` + clipPath) | role-match |
| `components/projects/RiskScale.tsx` | component (Server) | transform | `lib/trail-grade.ts` + `lib/footer-format.ts` `labelLeft`/`tickLeft` | partial |
| `components/projects/CaseStudy.tsx` + `sections/*.tsx` | component (Server) | transform | `app/(site)/photos/page.tsx` body switch | partial |
| `components/projects/DemoTerminal.tsx` | component (client island) | event-driven (timers) | `components/HologramTerminalDemo.tsx` (behaviour only) | role-match, do NOT copy structure |
| `components/projects/RouteIndex.tsx` | component (client island) | event-driven (IO) | none close | no analog |
| `lib/route-log.ts` | utility (pure) | transform | `lib/photos/view-param.ts` | exact |
| `lib/demo-terminal.ts` | utility (pure reducer) | transform | `lib/photos/view-param.ts` (import-free header) | partial |
| `lib/risk-scale.ts` | utility (pure) | transform | `lib/footer-format.ts` (`labelLeft`, `tickLeft`) | role-match |
| `lib/trail-profile.ts` | utility (pure) | transform | `lib/terrain/dem-sample.ts` | role-match |
| `lib/log-date.ts` | utility (pure formatter) | transform | `lib/home-format.ts` `formatCaptureMonth` | exact |
| `lib/trail-grade.ts` (+ `markerForGrade`) | utility | transform | itself | exact |
| `scripts/terrain/build-trails.mjs` | script (offline, `--check`) | batch / file-I/O | `scripts/terrain/build-terrain.mjs` | exact |
| `scripts/terrain/fetch-trails.mjs` | script (manual, networked) | file-I/O | `scripts/terrain/fetch-dem.mjs` | exact |
| `data/terrain/source/trails.json` | config/data | — | `data/terrain/source/source.json` | exact |
| `data/generated/trail-profiles.ts` | generated data | — | `data/generated/terrain.ts` (header) | exact |
| `data/roadmap.ts` (reshape + `surveyedAt`) | model/data | CRUD (static) | itself / `data/projects.ts` | exact |
| `data/schemas/roadmap.ts` | model (zod) | validation | `data/schemas/project.ts` | exact |
| `data/schemas/project.ts` (D-13, D-15 deltas) | model (zod) | validation | itself | exact |
| `data/types.ts` `RoadmapItem` | model | — | itself | exact |
| `data/projects.ts` (data edits) | data | — | itself | exact |
| `app/globals.css` (trail primitives + utilities; delete hex) | config | — | lines 48-51, 328-331 | exact |
| `scripts/guards/check-contrast.mjs` (`TRAIL` list) | config/guard | — | its `SEMANTIC`/`PAIRS` lists (lines 41, 69) | exact |
| `eslint.config.mjs` (remove 2 legacy entries) | config | — | lines 9-15 | exact |
| `package.json` `data:check` | config | — | line 33 | exact |
| Tests: `lib/__tests__/route-log.test.ts`, `demo-terminal.test.ts`, `trail-profile.test.ts`, `risk-scale.test.ts`, `log-date.test.ts`; `components/**/__tests__/*` (RoutePanel, RouteLogFilters, RouteLog, DemoTerminal); `data/__tests__/roadmap.test.ts`, `trail-profiles.test.ts`; `projects.test.ts` rewrite | test | — | `lib/__tests__/photos-view-param.test.ts`, `components/photos/__tests__/view-switcher.test.tsx`, `data/__tests__/terrain.test.ts`, `data/__tests__/projects.test.ts` | exact |
| e2e: `projects.spec.ts`, `no-webgl.spec.ts`, new `roadmap.spec.ts` | test | — | existing specs (Pitfall 4: no-webgl Home case) | role-match |

## Pattern Assignments

### `app/(site)/roadmap/page.tsx` (route, searchParams)

**Analog:** `app/(site)/photos/page.tsx`

Imports/metadata (lines 1-11):
```tsx
import type { Metadata } from 'next';
import PhotosHeader from '@/components/photos/PhotosHeader';
import ViewSwitcher from '@/components/photos/ViewSwitcher';
import { VIEW_LABELS, parseView } from '@/lib/photos/view-param';

export const metadata: Metadata = { title: 'Roadmap' }; // was 'Photographs'
```
Core (lines 30-35, 45-50): await `searchParams`, parse through whitelist, pass parsed value as a prop into the header slot; never `useSearchParams`:
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
  <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 sm:px-6 md:pb-16 lg:px-8">
```
Copy the long JSDoc-with-requirement-IDs header style (lines 13-29). For roadmap: `const sp = await searchParams; parseProject(sp.project); parseStatus(sp.status);` then `routeLogView(...)` from `lib/route-log.ts`.

---

### `app/(site)/projects/[slug]/page.tsx` (route, static params)

**Analog:** `app/(site)/photos/[slug]/page.tsx` (lines 21-40) — copy verbatim shape:
```tsx
type PageProps = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return photoSlugs.map((slug) => ({ slug }));          // → projects.map((p) => ({ slug: p.slug }))
}
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return photoMetadata(slug);                            // → projectMetadata(slug)
}
export default async function PhotoPage({ params }: PageProps) {
  const { slug } = await params;
  const view = photoBySlug(slug);
  if (!view) notFound();
```
Metadata helper shape (`lib/photos/view-model.ts:382-390`), returning `{}` for unknown slug:
```ts
export function photoMetadata(slug: string): Metadata {
  const view = photoBySlug(slug);
  if (!view) return {};
  return { title: view.title, description: view.story, alternates: { canonical: `/photos/${view.slug}` } };
}
```
Current file (lines 1-8) imports `FeatureShowcase`, `TechStackDisplay`, `ProjectHighlights`, `ProjectDetailClient`, `toLegacyHighlights`, and a `statusColors` map (lines 22-27) — all removed. Status becomes a word in the kicker.

---

### `app/(site)/projects/page.tsx` (route, RSC)

**Analog:** photos page metadata line + `PhotosHeader` band. Drop `'use client'`. Header band classes from `PhotosHeader.tsx` lines 44-58:
```tsx
<div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
  <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line pt-8 pb-6">
    <p className="mb-2 font-mono text-sm text-ink-muted tabular-nums">…</p>
    <h1>{TITLE}</h1>
```
Kicker: `countLabel(projects.length, 'route', 'routes')` exactly as `TrailSigns.tsx:34`. Title from `site.nav` like `PhotosHeader.tsx:8`:
```ts
const TITLE = site.nav.find((item) => item.href === '/photos')?.label ?? 'Photographs';
```

---

### `components/roadmap/RouteLogFilters.tsx` (client island)

**Analog:** `components/photos/ViewSwitcher.tsx` — copy the segment class constants (lines 13-22) and group markup (lines 42-71):
```tsx
'use client';
import { useRouter } from 'next/navigation';

const SEGMENT =
  'relative inline-flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 rounded-sm px-4 text-base font-semibold transition-colors duration-(--duration-fast) ease-erosion';
const UNSELECTED = 'text-ink-muted hover:bg-surface-overlay hover:text-ink';
const SELECTED =
  'bg-surface-overlay text-ink after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:bg-accent';

<div role="group" aria-label="View"
  className="inline-flex gap-1 rounded-sm border border-line-strong bg-surface-raised p-1">
  <button type="button" aria-pressed={pressed}
    className={`${SEGMENT} ${pressed ? SELECTED : UNSELECTED}`}
    onClick={() => { if (pressed) return; router.replace(viewHref(v), { scroll: false }); }}>
```
Deltas (RESEARCH Pattern 1): two groups (`Project`, `Status`); wrap replace in `startTransition` + `useOptimistic({ project, status })`; zero-count segment → `aria-disabled="true"` + no-op handler (not `disabled`, stays announced); no icons (emoji/Phosphor area icons retire); Mono count span. Props from server only — no `useSearchParams` (Pitfall 5).

**Test analog:** `components/photos/__tests__/view-switcher.test.tsx` lines 9-27 (router mock):
```tsx
const replace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: jest.fn(), back: jest.fn() }),
}));
function segments() {
  return within(screen.getByRole('group', { name: 'View' })).getAllByRole('button');
}
```
Assert `aria-pressed`, `aria-disabled`, `replace` called with `(href, { scroll: false })`. This rewrites `components/__tests__/RoadmapFilters.test.tsx` (same commit as its component deletion).

---

### `lib/route-log.ts` (pure)

**Analog:** `lib/photos/view-param.ts` (whole file, 40 lines). Copy header rule + whitelist idiom:
```ts
/** ... Pure and import-free: keep it to erasable TypeScript and never add an import. */
export const VIEWS = ['map', 'grid', 'carousel'] as const;
export type GalleryView = (typeof VIEWS)[number];
export const VIEW_LABELS: Record<GalleryView, string> = { ... };
function isView(v: unknown): v is GalleryView {
  return typeof v === 'string' && (VIEWS as readonly string[]).includes(v);
}
export function parseView(v: unknown): GalleryView { if (isView(v)) return v; return 'map'; }
export function viewHref(view: GalleryView): string {
  return view === 'map' ? '/photos' : `/photos?view=${view}`;
}
```
→ `PROJECTS = ['all','portfolio','clix-cli','clix-website']`, `STATUSES = ['all','planned','in-progress','completed']`, `parseProject`/`parseStatus` default `'all'`, `routeLogHref({project,status})` drops `all` params, canonical order `?project=…&status=…`. Plus `filterItems`, `countsFor`, `bands`, `newestCompletedAt`. Since it must stay import-free, re-declare the item shape structurally (as `lib/terrain/dem-sample.ts` lines 12-13 do for `Bbox`/`Lv95`).

**Test analog:** `lib/__tests__/photos-view-param.test.ts` lines 20-36 `it.each` table of bad inputs (`undefined`, `''`, wrong case, `['grid']` array, number, null).

---

### `components/projects/DemoTerminal.tsx` (client island) + `lib/demo-terminal.ts`

**Behaviour source only:** `components/HologramTerminalDemo.tsx`.
- Port: timings (lines 59-84: input 50 ms/char, 500 ms gap, output 10 ms/char, `loopDelay = 3000`); start-paused under reduced motion (lines 21-25):
```tsx
const [playOverride, setPlayOverride] = useState<boolean | null>(null);
const isPlaying = playOverride ?? (autoPlay && !prefersReducedMotion);
```
- Do NOT copy: the nested interval/timeout chain whose cleanup is only `clearInterval(inputInterval)` (lines 86-88, timer leak, Pitfall 1); synchronous `setState` in the effect body (lines 37-53, violates `react-hooks/set-state-in-effect`); `riskColors` map (lines 91-96); traffic-light dots, `text-accent`, `font-bold`, label-swapping `aria-label={isPlaying ? 'Pause' : 'Play'}` (line 127) — the new toggle has constant label + `aria-pressed`.
- Reduced motion hook: `lib/useReducedMotion.ts` (`useSyncExternalStore`, server snapshot `false` → hydration flip, Pitfall 3).
- New structure: pure `initial/reducer/delayFor` in `lib/demo-terminal.ts` (import-free header like `view-param.ts`), one `setTimeout` per state in a single effect with cleanup. Icons from `@phosphor-icons/react/dist/ssr` as in `ViewSwitcher.tsx:3`.
- Risk badge: `bandFor(score)` from `lib/trail-grade.ts` + `TrailGradeMark`.

---

### `components/projects/TrailGradeMark.tsx`, `RoutePanel.tsx`, RouteLog "Next route" sign

**Analog:** `components/home/TrailSigns.tsx` (Server, 56 lines).
Decorative trail paint (lines 9, 50):
```tsx
const TIP_CLIP = { clipPath: 'polygon(0 0, 100% 50%, 0 100%)' } as const;
<span aria-hidden="true" className="w-6 shrink-0 bg-trail" style={TIP_CLIP} />
```
→ T1 diamond: same pattern with `polygon(50% 0, 100% 50%, 50% 100%, 0 50%)`. Literal class map per marker (no computed classes).
Plate class constant (lines 7-8) for the end-block "Next route" sign:
```tsx
const PLATE =
  'flex flex-1 items-center justify-between gap-4 rounded-l-sm border border-line-strong bg-surface-raised px-4 transition-colors duration-(--duration-fast) ease-erosion group-hover:border-ink-muted group-hover:bg-surface-overlay';
```
Nowrap-units kicker joined by ` · ` (`PhotosHeader.tsx` lines 50-57):
```tsx
{parts.map((part, i) => (
  <span key={part}>{i > 0 ? ' · ' : null}<span className="whitespace-nowrap">{part}</span></span>
))}
```
Data-error guard style (`PhotosHeader.tsx:35`): `throw new RangeError(...)` for impossible states. `RoutePanel.test` rewrites `components/__tests__/ProjectCard.test.tsx` in the same commit as deleting `ProjectCard.tsx`, `lib/useHexGrid.ts`, hex CSS.

---

### `lib/trail-grade.ts` (+ `markerForGrade`)

Keep header rule (lines 11-13: "Zero imports on purpose"). Existing data (lines 28-33):
```ts
{ level: 'low', min: 0.0, max: 0.3, grade: 'T1', marker: 'yellow' },
{ level: 'medium', min: 0.3, max: 0.6, grade: 'T2–T3', marker: 'white-red-white' },
{ level: 'high', min: 0.6, max: 0.8, grade: 'T4–T5', marker: 'white-blue-white' },
{ level: 'critical', min: 0.8, max: 1.0, grade: 'T6', marker: 'unmarked' },
```
Add `markerForGrade('T1'..'T6')`; extend `lib/__tests__/trail-grade.test.ts` (describe/test style, lines 10-25). Consider narrowing `marker: string` to a union so `TrailGradeMark`'s class map is exhaustive.

---

### `lib/risk-scale.ts` (pure)

**Analog:** `lib/footer-format.ts` `labelLeft(tickPercent, label)` (line 112) and `tickLeft(u)` (line 122) — the 08 axis-label offset method UI-SPEC cites. Band widths from `RISK_BANDS` (`max - min`), never hard-coded. First-fit lane rule as a pure function, unit-tested.

---

### `lib/log-date.ts` (pure formatter)

**Analog:** `lib/home-format.ts` lines 67-71:
```ts
export function formatCaptureMonth(capture: CaptureLike): string {
  if (capture.precision === 'year') return String(capture.year);
  const [year, month] = capture.local.split('-');
  return `${MONTHS_SHORT[Number(month) - 1]} ${year}`;
}
```
→ `formatLogDate('2026-10-24')` → `24 Oct 2026`; validation/throw style from `countLabel` (lines 121-127): `throw new RangeError('formatLogDate: ...')`. Heights: reuse `formatMetres` (`lib/photo-format.ts:108`); counts: `countLabel` (`lib/home-format.ts:121`).

---

### `lib/trail-profile.ts` (pure)

**Analog:** `lib/terrain/dem-sample.ts` — import-free header (lines 1-10), structural types (lines 12-13), `RangeError` input guard (lines 28-30). Use `sampleAtLv95(grid, W, H, extent, p)` (lines 48-58) for station heights; do not write a new sampler.

---

### `scripts/terrain/build-trails.mjs` (offline, `--check`)

**Analog:** `scripts/terrain/build-terrain.mjs` (607 lines). Copy:
- Header doc block style (lines 1-62) with `Modes:` / `--check` / `Usage:` sections and "OFFLINE ... T-08-09".
- Imports (lines 64-74), note `.ts` imports from scripts: `import { sampleAtLv95 } from '../../lib/terrain/dem-sample.ts';` and schemas `from '../../data/schemas/terrain.ts'`.
- `ROOT`/`NAME` constants (lines 77, 86): `const NAME = 'trails';`
- `sha256` + `decodeGrey16` (lines 128-139) and `loadSource()` sha check (lines 141-157) — reuse exactly:
```js
async function decodeGrey16(png, width, height) {
  const { data, info } = await sharp(png).toColourspace('grey16').raw({ depth: 'ushort' })
    .toBuffer({ resolveWithObject: true });
  if (info.width !== width || info.height !== height || info.channels !== 1) return null;
  return new Uint16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
}
```
- Generated header (lines 459-462):
```js
'// AUTO-GENERATED by scripts/terrain/build-terrain.mjs from data/terrain/source/. Do not edit.\n' +
`export const terrain = ${JSON.stringify(meta, null, 2)} as const;\n`
```
- `check()` byte-compare + one line per problem + `${NAME}: OK` / `${NAME}: N stale` with exit code (lines 528-588), arg parsing + zod-issue reporting tail (lines 590-607).
- Wire: `package.json` add `"trails:build": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/terrain/build-trails.mjs"` (copy line 31) and append `&& npm run trails:build -- --check` to `data:check` (line 33).
- Never write into `data/generated/terrain.ts` (its test, `data/__tests__/terrain.test.ts:59-62`, asserts no path data and < 4096 bytes).

### `scripts/terrain/fetch-trails.mjs` (manual, networked)

**Analog:** `scripts/terrain/fetch-dem.mjs` header (lines 1-29: "MANUAL AND NETWORKED. Never run it in prebuild, lint or CI (T-08-09)", numbered steps, "Task 1 decisions" provenance) and imports (lines 31-38, built-in `fetch`, no geotiff needed). Parse output with the zod schema before writing, as step 5 does with `TerrainSource`.

### `data/generated/trail-profiles.ts` + test

Header copied from build-terrain (above). **Test analog:** `data/__tests__/terrain.test.ts` (lines 13-21 read pattern, 59-62 content assertions) → assert no import, deterministic shape, ≥64 points, 3-dp values in [0,1]; plus a grep test that no `'use client'` file imports it.

---

### `data/schemas/roadmap.ts` (zod) and `data/schemas/project.ts` deltas

**Analog:** `data/schemas/project.ts`. Header rule (lines 10-15): every object `z.strictObject`; "Imports only 'zod' ... erasable TypeScript". Block shape:
```ts
export const ListBlock = z.strictObject({
  kind: z.literal('list'), key: z.string(), title: z.string(), items: z.array(z.string()).min(1),
});
export const HighlightBlock = z.discriminatedUnion('kind', [MetricsBlock, RiskScaleBlock, PricingBlock, ListBlock, StackBlock]);
```
Deltas: delete `PricingBlock` (lines 44-59) from file and union; delete `features` (`ProjectBase` line 117); add `PipelineBlock`; metrics item gains `context?`, `source?`; website tuple (line 128) becomes `[ListBlock, StackBlock]` (or with Pipeline); CLI tuple (line 121) adds Pipeline + Stack. Comment at lines 129-132 mentions `ProjectDetailClient` — update when it retires.
Roadmap schema mirrors this: `RoadmapItemSchema = z.strictObject({ id, title, description, project: z.enum([...]), status: z.enum(['planned','in-progress','completed']), order: z.number().int(), targetRelease: z.string().optional(), completedAt: isoDate.optional(), phases: z.array(...).optional() })`.

**Test analog:** `data/__tests__/projects.test.ts` lines 36-50 (`ProjectSchema.parse` all; `safeParse(...).success === false` for wrong tuple order). Rewrite: drop the `legacy-highlights` fixture tests (lines 11-34) when `lib/legacy-highlights.ts` retires — rewritten, not deleted (ratchet 942). Add D-12 dead-URL test, D-20 `surveyedAt` test, roadmapItems-id-exists test.

---

### `app/globals.css`

Existing (lines 48-51, 328-331):
```css
/* Swiss trail yellow (09-UI-SPEC "Trail yellow"): outside the --color-* namespace ... */
--trail-yellow: var(--caution-400);

@utility bg-trail {
  background-color: var(--trail-yellow);
}
```
Add `--trail-blaze`, `--trail-mountain`, `--trail-alpine` beside line 51 and `@utility bg-trail-blaze|mountain|alpine` beside line 331; update the 328 comment. Delete `.hex-clip` / `.hex-grid` block (lines 505-~548) in the ProjectCard removal commit. Same commit as the `TRAIL` list in `scripts/guards/check-contrast.mjs` (add next to `SEMANTIC` line 41 / `PAIRS` line 69; header line 20 says "adding it here and its pairs to PAIRS in the same commit").

### `eslint.config.mjs`

Remove `'components/HologramTerminal.tsx'` and `'components/HologramTerminalDemo.tsx'` from `LEGACY_COMPILER_FILES` (lines 9-15) in the commit that deletes them; never add `DemoTerminal`/`RouteIndex`/`RouteLogFilters`.

## Shared Patterns

### Import-free pure modules
**Source:** `lib/photos/view-param.ts:1-4`, `lib/trail-grade.ts:11-13`, `lib/terrain/dem-sample.ts:8-10`
**Apply to:** `lib/route-log.ts`, `lib/demo-terminal.ts`, `lib/risk-scale.ts`, `lib/trail-profile.ts`, `lib/log-date.ts`. Header comment states the rule; structural types instead of imports; `RangeError` on invalid input.

### URL state via server-parsed props + `router.replace(..., { scroll: false })`
**Source:** `app/(site)/photos/page.tsx:30-35` + `components/photos/ViewSwitcher.tsx:60-63`
**Apply to:** roadmap page, `RouteLogFilters`, Next-steps links (`/roadmap?project={slug}#{id}` built by `routeLogHref`).

### Server-first with header band
**Source:** `components/photos/PhotosHeader.tsx:44-58`; container `mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8`
**Apply to:** `/projects`, `/projects/[slug]` trailhead, `/roadmap`.

### Nowrap ` · ` meta lines and Mono data
**Source:** `PhotosHeader.tsx:50-57`
**Apply to:** panel kicker, captions, risk badges, route-row meta.

### Generated data with offline `--check`
**Source:** `scripts/terrain/build-terrain.mjs:128-157, 459-462, 528-607`; `package.json:31,33`
**Apply to:** trail profiles.

### Tests assert state, not colour
**Source:** `view-switcher.test.tsx` (aria-pressed arrays). Note line 46 of that test asserts classes — do not copy that case for Phase 11 (ROADMAP scope note); assert `aria-pressed`, `aria-disabled`, `data-playback`, `aria-current`, text.

### Component + test retire in one commit (ratchet)
ProjectCard→RoutePanel, RoadmapFilters/RoadmapTimeline→RouteLog(Filters), HologramTerminal*→DemoTerminal (+ eslint list), legacy-highlights fixture→schema tests, `e2e/no-webgl.spec.ts:60-68`→canvas count 0 + new Demo heading.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `components/projects/RouteIndex.tsx` | client island | IntersectionObserver scroll-spy | No scroll-spy exists; use RESEARCH/UI-SPEC (rootMargin `-80px 0px -60% 0px`, `aria-current="location"`, native `<details>` below 1024) |
| `components/projects/RouteProfile.tsx` SVG drawing | Server SVG | static | No existing inline-profile SVG component; use RESEARCH Pattern 4 (viewBox 320×96, `preserveAspectRatio="none"`, `vector-effect="non-scaling-stroke"`) with paths from `lib/trail-profile.ts` |

## Metadata

**Analog search scope:** `app/(site)/`, `components/{photos,home}/`, `components/*.tsx`, `lib/`, `lib/photos/`, `lib/terrain/`, `scripts/terrain/`, `scripts/guards/`, `data/`, `data/schemas/`, `data/__tests__/`, `lib/__tests__/`, `components/**/__tests__/`, `eslint.config.mjs`, `package.json`, `app/globals.css`
**Files scanned:** ~30
**Pattern extraction date:** 2026-11-01
