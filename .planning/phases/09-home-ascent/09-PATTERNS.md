# Phase 9: Home Ascent - Pattern Map

**Mapped:** 2026-10-24
**Files analyzed:** 38 (new + modified)
**Analogs found:** 31 / 38 (all analog paths verified with `git ls-files`)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/(site)/page.tsx` (rewrite, RSC) | route | request-response (static RSC) | `components/site/SiteFooter.tsx` (RSC reading generated data) | role-match |
| `components/home/AscentHero.tsx` | component (RSC) | transform (data -> HTML) | `components/site/SiteFooter.tsx` | exact |
| `components/home/PosterSheet.tsx` | component (RSC) | static asset | `components/terrain/ContourField.tsx` + SiteFooter band | exact |
| `components/home/PinMark.tsx` | component (server-safe) | presentational | `SiteFooter.tsx` `TICK` exact/approximate classes | role-match |
| `components/home/HeroBlock.tsx`, `TrailSigns.tsx`, `WaypointCard.tsx`, `SummitPlaque.tsx`, `AboutSection.tsx` | component (RSC) | transform | `components/site/SiteFooter.tsx` (`DT`/`DD_VALUE`, `LINK` constants) | exact |
| `components/home/AscentController.tsx` | provider ('use client') | event-driven (scroll) | `lib/useReducedMotion.ts` | partial |
| `components/home/AltimeterRail.tsx` | component ('use client') | event-driven | SiteFooter ticks (static part) | partial |
| `components/home/TerrainStage.tsx` | component ('use client') | lazy load | none (no render-gated `next/dynamic` yet) | no analog |
| `components/home/terrain/TerrainCanvas.tsx` | component (lazy chunk) | streaming (frames) | `components/SafeCanvas.tsx` (entry contract) | role-match |
| `components/home/terrain/TerrainMesh.tsx`, `CameraRig.tsx`, `terrain-shader.ts` | component / utility | GPU | none (legacy `MountainTerrain3D.tsx` is to be deleted; do NOT copy) | no analog |
| `lib/ascent/progress.ts`, `poster-frame.ts`, `capability.ts`, `route.ts`, `frame-budget.ts` | utility (pure) | transform | `lib/footer-format.ts`, `lib/photo-format.ts` | exact |
| `lib/useAscentMode.ts` | hook | event-driven | `lib/useReducedMotion.ts` | exact |
| `lib/terrain/heightmap.ts` | utility (pure) | transform | `lib/terrain/dem-sample.ts` (`sampleBilinear`) | exact |
| `lib/home-format.ts` | utility (pure) | transform | `lib/photo-format.ts` / `lib/footer-format.ts` | exact |
| `data/home.ts` | config (copy) | static | `data/site.ts`, `data/photos/editorial.ts` | exact |
| `data/generated/tokens.ts` + `scripts/tokens/build-tokens.mjs` | generated config + build script | batch, `--check` | `scripts/terrain/build-terrain.mjs` (write/check, lines 484-595) | exact |
| `app/globals.css` (add `--text-hero`, `--trail-yellow`, `--relief-opacity`, `@utility bg-trail`) | config | static | existing `@theme` block in same file | exact |
| `app/(site)/photos` grid items: add `id={slug}` | component (modify) | — | `components/GalleryGrid.tsx:35` (`key={image.id}`) | exact |
| `lib/__tests__/home-format.test.ts`, `ascent-*.test.ts`, `heightmap.test.ts` | test (jest) | — | `lib/__tests__/photo-format.test.ts`, `lib/__tests__/dem-sample.test.ts` | exact |
| `components/home/__tests__/*.test.tsx` | test (jest RTL) | — | `components/site/__tests__/SiteFooter.test.tsx` | exact |
| `lib/__tests__/useAscentMode.test.tsx` | test | — | `lib/__tests__/useReducedMotion.test.tsx` | exact |
| `e2e/helpers/webgl.ts` (new, extracted) | test helper | — | `e2e/no-webgl.spec.ts:12-45` | exact (move) |
| `e2e/homepage.spec.ts`, `e2e/no-webgl.spec.ts`, `e2e/shell.spec.ts` (rewrite) | test (e2e) | — | themselves; `e2e/a11y-contact.spec.ts` for axe | exact |
| `e2e/home-canvas.spec.ts` (SwiftShader smoke, `@chromium-only`) | test (e2e) | — | `e2e/no-webgl.spec.ts` (init script, `settle`) | role-match |
| `e2e/visual/routes.spec.ts`, `e2e/visual/hide-canvas.css` (modify) | test (visual) | — | themselves (lines 46-70, 115-130) | exact |
| `e2e/perf/home-baseline.spec.ts` (extend) | test (perf) | — | itself (lines 1-40, Sample interface) | exact |
| `eslint.config.mjs` (trim `LEGACY_COMPILER_FILES` 9-18), `scripts/guards/palette-ratchet.json`, `scripts/guards/test-count.baseline.json` | config | — | themselves | exact |
| Deletions: `components/Hero3DMountain.tsx`, `MountainTerrain3D.tsx`, `DualParticleSystem.tsx`, `GeologicalButton.tsx`, `lib/useGlowIntensity.ts` | — | — | — | n/a |

## Pattern Assignments

### Server components (`AscentHero`, `PosterSheet`, `HeroBlock`, `TrailSigns`, `WaypointCard`, `SummitPlaque`, `AboutSection`, page.tsx)

**Analog:** `components/site/SiteFooter.tsx`

**Imports** (lines 1-14) — `@/` aliases, generated data imported directly, Phosphor from `dist/ssr`, formatters from a pure lib:
```tsx
import { EnvelopeSimple, GithubLogo, LinkedinLogo } from '@phosphor-icons/react/dist/ssr';
import ContourField from '@/components/terrain/ContourField';
import { photos } from '@/data/generated/photos';
import { terrain } from '@/data/generated/terrain';
import { site } from '@/data/site';
import { formatEquidistance, formatExtentLines, ... } from '@/lib/footer-format';
```
(New code uses `*Icon` names: `ArrowDownIcon`, `ArrowLineDownIcon`, `ArrowRightIcon`.)

**Class-constant pattern** (lines 16-37) — reuse for card link, sign plate, plaque `dt`/`dd`, and the exact/approximate pin stem:
```tsx
const LINK =
  'min-h-11 inline-flex items-center gap-2 text-ink-muted hover:text-ink transition-colors duration-(--duration-fast) ease-erosion';
const TICK = {
  exact: 'absolute bottom-0 h-4 w-px bg-ink-muted',
  approximate: 'absolute bottom-0 h-4 w-0 border-l border-dashed border-ink-muted',
} as const;
const DT = 'text-sm text-ink-muted';
const DD_VALUE = 'mt-1 font-mono text-sm text-ink tabular-nums';
```
**Doc-comment convention** (lines 39-55): header JSDoc citing requirement IDs + UI-SPEC section + D-NN. Body (56-70): `@container` root, `aria-hidden="true"` decorative band with `pointer-events-none`. Missing data = build failure, never a dash.

Rules: no `'use client'`; do NOT import `lib/animations.ts` from RSC (it is `'use client'`, RESEARCH Pattern 1) — use `duration-(--duration-*)`/`ease-*` CSS utilities.

### `components/home/PosterSheet.tsx`

**Analog:** `components/terrain/ContourField.tsx` (whole file, 35 lines) — reuse as-is with `lod="hero"`:
```tsx
export default function ContourField({ lod, className }: { lod: ContourLod; className?: string }) {
  const mask = `url(${terrain.assets.contours[lod]})`;
  return <div aria-hidden="true" className={['bg-contour', className].filter(Boolean).join(' ')}
    style={{ maskImage: mask, WebkitMaskImage: mask, maskSize: 'cover', ... }} />;
}
```
The `<picture>` reads `terrain.assets.hillshade.{avif,webp}.{640,1100}`; no literals. `eslint-disable-next-line @next/next/no-img-element -- content-hashed, pre-sized terrain asset; <picture> type switching` (RESEARCH Pattern 1).

### `components/home/terrain/TerrainCanvas.tsx`

**Analog:** `components/SafeCanvas.tsx` lines 63-73 — the only allowed Canvas entry:
```tsx
export default function SafeCanvas(props: CanvasProps) {
  return (<CanvasErrorBoundary fallback={<InertCanvas .../>}><Canvas {...props} /></CanvasErrorBoundary>);
}
```
Use: `<SafeCanvas frameloop="demand" dpr={[1, 1.5]} resize={{ scroll: false }} flat gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }} style={{ pointerEvents: 'none' }} aria-hidden />`. Pass a `fallback`/onError path that flips the gate to static. Test analog: `components/__tests__/SafeCanvas.test.tsx`.

### `lib/useAscentMode.ts`

**Analog:** `lib/useReducedMotion.ts` (whole file, 31 lines):
```ts
'use client';
import { useSyncExternalStore } from 'react';
const QUERY = '(prefers-reduced-motion: reduce)';
function subscribe(callback: () => void) { const mq = window.matchMedia(QUERY); mq.addEventListener('change', callback); return () => mq.removeEventListener('change', callback); }
function getSnapshot() { return window.matchMedia(QUERY).matches; }
function getServerSnapshot() { return false; }
export function useReducedMotion() { return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot); }
```
Change: server snapshot `'pending'`; snapshot = `decideAscentMode(signals)` with signals cached in module scope; sticky runtime downgrade stored in module state + notify subscribers. Test: `lib/__tests__/useReducedMotion.test.tsx`.

### `lib/ascent/*.ts`, `lib/home-format.ts`, `lib/terrain/heightmap.ts`

**Analogs:** `lib/photo-format.ts` (lines 1-82), `lib/footer-format.ts` (lines 1-12), `lib/terrain/dem-sample.ts` (`sampleBilinear` line 21).

**Header + import-free rule** (photo-format.ts 1-9):
```ts
/**
 * ... Pure and import-free on purpose ... Keep it to erasable TypeScript and never add an import.
 * The capture shape is declared structurally here instead of imported ...
 */
export type CaptureLike = | { precision: 'second'; local: string } | { precision: 'year'; year: number };
```
**Formatter helpers to mirror** (46-70): `const NBSP = ' '`, fixed `MONTHS` table (add 3-letter variant for `formatCaptureMonth`), `groupThousands`, `oneDecimal`. **Validation** (25-28): `throw new RangeError(\`fn: ...\`)`. `heightmap.ts` must reuse `sampleBilinear` (dem-sample.ts:21, throws on grid size mismatch, line 29) rather than a second sampler; coordinates via `lib/geo.ts` (`lv95ToWgs84` :39, `wgs84ToLv95` :23, `lv95ToUv` :54, `round4` :68). Keep `fast-png` out of these modules (ESM-only; lazy chunk only).

**Test analog:** `lib/__tests__/photo-format.test.ts` lines 1-25 (header JSDoc with requirement IDs, `@/lib/...` imports, `NBSP` constant, fixture consts `SECOND`/`YEAR`).

### `scripts/tokens/build-tokens.mjs` -> `data/generated/tokens.ts`

**Analog:** `scripts/terrain/build-terrain.mjs` — shebang + header doc (1-61), `write()` (484), `check()` (528-589: one line per problem, `${NAME}: OK` / `N stale`, `process.exit(1)`), arg guard (593-595: only `--check` accepted). Wire into `package.json` `data:check` (line 32) like `terrain:build -- --check`. Parse `app/globals.css` with colorjs.io the way `scripts/guards/check-contrast.mjs` does.

### Component tests (`components/home/__tests__/*.test.tsx`)

**Analog:** `components/site/__tests__/SiteFooter.test.tsx` lines 1-30: header JSDoc, `render`/`screen`/`within` + `renderToStaticMarkup` for RSC, imports real `terrain`/`photos`/`site`, `FOCUSABLE` selector constant for the focus contract, a `renderX()` helper returning key nodes. Assert derived strings (e.g. `45.9764 N · 7.6586 E`, `4 waypoints`) from data, not literals where avoidable.

### E2E: `e2e/helpers/webgl.ts`, rewrites, canvas smoke

**Analog:** `e2e/no-webgl.spec.ts` lines 12-49 — move `disableWebGL` (init script overriding `HTMLCanvasElement.prototype.getContext`), `settle` (two rAFs) and `expectNoErrorPage` into the helper and export them. Pitfall 1: "home keeps its content" waits on `webglFailure` which will never fire once the canvas is lazy/gated — rewrite it to assert static mode (`data-ascent-mode`) instead. Smoke spec tag `@chromium-only`; no `.skip/.only/.fixme` (test-count guard).

**Visual:** `e2e/visual/routes.spec.ts` `settle()` (46-70: full-height scroll then wait for `contours-strip` resource) — extend to wait for `contours-hero`; home motion shots (115-130) switch from `innerHeight × pct` to `scrollIntoView({block:'center'})` on target blocks with `disableWebGL`. Remove the Hero3DMountain scroll-arrow rule from `hide-canvas.css`.

**Perf:** `e2e/perf/home-baseline.spec.ts` — extend `Sample` (lines 32-36) with `mode`, `initialJsTransferBytes`, `totalJsTransferBytes`; keep PROFILE/RUNS.

## Shared Patterns

- **Generated data, never literals:** `terrain.assets.*`, `terrain.grids.*`, `terrain.summit.*`, `lowestDemM` (`data/generated/photos.ts:160`). Source: SiteFooter.tsx imports.
- **Decorative = `aria-hidden="true"` + `pointer-events-none`:** ContourField.tsx:21, SiteFooter.tsx:69-70. Apply to stage, pins, rail, canvas.
- **Exact vs approximate dashed treatment:** SiteFooter `TICK` (19-22), driven by `position.approximate`. Apply to pins, rail ticks, card kicker.
- **No locale APIs, NBSP units:** photo-format.ts 40-70. Apply to all formatters and readout.
- **Guard ratchets in the same commit:** `npm run guard:palette -- --update` (palette-ratchet.json has `app/(site)/page.tsx: 5`, `MountainTerrain3D.tsx: 1`); trim `eslint.config.mjs` `LEGACY_COMPILER_FILES`; test-count only rises.

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `components/home/TerrainStage.tsx` | lazy loader | No render-gated `next/dynamic({ssr:false})` in repo; use RESEARCH Pattern 3 |
| `components/home/AscentController.tsx` (scroll -> spring core) | provider | No `useScroll`/`useSpring` manual set/jump pattern; RESEARCH Pattern 4 |
| `components/home/terrain/TerrainMesh.tsx` | GPU component | Legacy `MountainTerrain3D.tsx` is dead code slated for deletion; RESEARCH Patterns 6-7 |
| `components/home/terrain/CameraRig.tsx` | GPU component | RESEARCH Pattern 5 + route section |
| `components/home/terrain/terrain-shader.ts` | GLSL | RESEARCH Pattern 7 |
| `lib/ascent/frame-budget.ts` | utility | Replaces drei PerformanceMonitor; RESEARCH Pattern 10 (style still follows photo-format.ts) |
| `e2e/home-canvas.spec.ts` pixel sampling | test | No pixel-sampling spec exists; RESEARCH Validation section |

## Metadata

**Analog search scope:** `components/`, `components/site/`, `components/terrain/`, `lib/`, `lib/terrain/`, `lib/__tests__/`, `scripts/terrain/`, `scripts/guards/`, `e2e/`, `data/`
**Files scanned:** ~25 read/grepped
**Pattern extraction date:** 2026-10-24
