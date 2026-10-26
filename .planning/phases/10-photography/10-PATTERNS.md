# Phase 10: Photography - Pattern Map

**Mapped:** 2026-10-26
**Files analyzed:** 38 (new + modified + deleted-with-replacement)
**Analogs found:** 33 / 38

All analog paths below were checked with `git ls-files` (tracked). New files keep their intended path and are marked **new**.
Next docs to read before routing code (AGENTS.md): `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/{intercepting-routes,parallel-routes,default}.md`, `01-app/02-guides/view-transitions.md`, `01-app/01-getting-started/04-linking-and-navigating.md` §"Native History API" (verified present).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/(site)/photos/layout.tsx` (new) | route layout (RSC) | request-response | `app/(site)/layout.tsx` | role-match (slot pattern from Next docs) |
| `app/(site)/photos/page.tsx` (modify) | route page (RSC) | request-response (`searchParams`) | itself + `app/(site)/projects/page.tsx` | exact |
| `app/(site)/photos/[slug]/page.tsx` (new) | route page (RSC) | request-response | `app/(site)/projects/[slug]/page.tsx` | exact |
| `app/(site)/photos/@modal/default.tsx`, `@modal/page.tsx` (new) | slot fallback | — | none (Next `default.md`) | no analog |
| `app/(site)/photos/@modal/(.)[slug]/page.tsx` (new) | intercepted route (RSC) | request-response | `app/(site)/projects/[slug]/page.tsx` | role-match |
| `lib/photos/view-model.ts` (new) | utility (pure, build-time data) | transform | `lib/ascent/waypoints.ts` | exact |
| `lib/photos/view-param.ts` (new) | utility (pure) | transform | `lib/ascent/summit-layout.ts` (pure, import-free) | role-match |
| `lib/photos/justify.ts` (new) | utility (pure layout) | transform | `lib/ascent/summit-layout.ts` | exact |
| `lib/photos/label-layout.ts` (new) | utility (pure layout) | transform | `lib/ascent/summit-layout.ts` + `lib/ascent/framing.ts` (`placePinLabel`) | exact |
| `lib/photos/hotspot-pref.ts` (new) | utility (browser store) | event-driven (localStorage) | `lib/useReducedMotion.ts` / `lib/useAscentMode.ts` (useSyncExternalStore) | partial (no localStorage in repo) |
| `lib/photos/lightbox-tiers.ts` (TS mirror of `lb-*` variants) (new) | config constant | — | `lib/ascent/summit-layout.ts` `SUMMIT_FULL_MEDIA` | exact |
| `lib/photo-format.ts` (modify, WR-04) | utility | transform | itself + `lib/__tests__/photo-format.test.ts` | exact |
| `components/photos/PhotosHeader.tsx` (new) | component (RSC) | request-response | `components/home/WaypointCard.tsx` (kicker markup) | role-match |
| `components/photos/ViewSwitcher.tsx` (new) | component (client) | event-driven (router) | none with `router.replace` in repo | partial |
| `components/photos/MapSheet.tsx` (new) | component (RSC) | transform | `components/home/PosterSheet.tsx` | exact |
| `components/photos/MapWaypoint.tsx` / summit plate (new) | component (RSC) | — | `components/home/PinMark.tsx` (+ `SummitMark`) | exact |
| `components/photos/JustifiedGrid.tsx` (new; replaces `components/GalleryGrid.tsx`) | component (client island) | transform | `components/home/WaypointCard.tsx` (`<picture>`) | role-match |
| `components/photos/CarouselView.tsx` (new) | component (client gate) | event-driven | `components/home/TerrainStage.tsx` | exact |
| `components/photos/PhotoCarousel3D.tsx` (moved from `components/PhotoCarousel3D.tsx`, restyled) | component (R3F) | event-driven | `components/PhotoCarousel3D.tsx` + `components/home/terrain/terrain-shader.ts` (tokens) | exact |
| `components/photos/CarouselStepper.tsx` (new) | component (client) | event-driven | `components/home/WaypointCard.tsx` (`<picture>`) | role-match |
| `components/photos/LightboxDialog.tsx` (new; replaces `components/ImageDetailModal.tsx`) | component (client shell) | event-driven | `components/ImageDetailModal.tsx` (to retire) | partial — use RESEARCH Pattern 4 |
| `components/photos/PhotoViewer.tsx` (new) | component (client) | event-driven (history) | none | no analog — RESEARCH Pattern 3 |
| `components/photos/ExifStrip.tsx` (new) | component (RSC-safe) | transform | `components/home/WaypointCard.tsx` (nowrap parts) | role-match |
| `components/photos/Hotspots.tsx` (new; replaces `components/InteractiveHotspot.tsx`) | component (client) | event-driven | `components/home/PinMark.tsx` (data-attr states) | partial |
| `components/photos/ZoomStage.tsx` (new) | component (client) | event-driven (pointer) | none | no analog |
| `components/home/WaypointCard.tsx` (modify L109) | component | — | itself | exact |
| `components/site/SiteFooter.tsx` + `data/site.ts` (move `Zermatt – Matterhorn` literal) | config/data | — | `data/site.ts` | exact |
| `app/globals.css` (modify: `lb-*` variants, VT rules) | config (CSS) | — | itself L284-300, L586-593 | exact |
| `scripts/guards/check-contrast.mjs` (modify: 4 pairs) | config/guard | batch | itself | exact |
| `jest.setup.js` (modify: dialog stub) | test config | — | itself (matchMedia/IO mocks) | exact |
| `data/landscapes.ts`, `lib/useProgressiveTextures.ts` (retire / move to manifest) | data bridge | transform | `lib/ascent/waypoints.ts` | exact |
| `lib/__tests__/photos-{view-model,justify,label-layout,view-param}.test.ts` (new) | test (unit) | — | `lib/__tests__/summit-layout.test.ts`, `ascent-waypoints.test.ts` | exact |
| `components/__tests__/GalleryGrid.test.tsx` (rewrite) | test (RTL) | — | `components/home/__tests__/waypoints.test.tsx` | exact |
| `components/home/__tests__/waypoints.test.tsx` (modify L72-77) | test | — | itself | exact |
| `e2e/photos.spec.ts` (rewrite), `e2e/photos-lightbox.spec.ts`, `e2e/photos-carousel.spec.ts` (new) | test (e2e) | — | `e2e/home-ascent.spec.ts`, `e2e/photos.spec.ts` | role-match |
| `e2e/helpers/view-transitions.ts` (new) | test helper | — | `e2e/helpers/webgl.ts`, `e2e/helpers/ascent.ts` | role-match |
| `e2e/design-system.spec.ts` (modify G3 opener L142+), `e2e/no-webgl.spec.ts` (rewrite L45 test) | test | — | themselves | exact |
| `e2e/visual/routes.spec.ts` (photos baselines) | test (visual) | — | itself | exact |

## Pattern Assignments

### `app/(site)/photos/[slug]/page.tsx` and `@modal/(.)[slug]/page.tsx` (RSC, request-response)

**Analog:** `app/(site)/projects/[slug]/page.tsx` lines 1-20 (async params + notFound):
```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
interface PageProps { params: Promise<{ slug: string }>; }
export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) { notFound(); }
```
Copy the async-`params` shape only. Do NOT copy its visual (v1 `text-5xl`, inline SVG, gradient). Add `generateStaticParams` + `export const dynamicParams = false` and a shared `photoMetadata(slug)` from `lib/photos/view-model.ts` exported by both routes (RESEARCH Pattern 1). The "All photographs" link should use `ArrowLeftIcon` from `@phosphor-icons/react/dist/ssr`, as `WaypointCard.tsx` L2 imports `ArrowRightIcon`.
Note: the analog's `notFound()` in `/projects/[slug]` returns an empty shell (EDGE-01), so add an e2e 404 check.

### `app/(site)/photos/page.tsx` (RSC, modify)

**Analog (current, to be replaced):** lines 1-25 import `PhotosPageClient` + `landscapes` and render the "Landscape Gallery" hero. Replace with: read `searchParams` (a Promise), `parseView()`, render `<PhotosHeader>` and exactly one view keyed by `view`. Keep it a Server Component (no `'use client'`; ARCH Anti-Pattern 9).

### `lib/photos/view-model.ts` (pure, transform)

**Analog:** `lib/ascent/waypoints.ts`.
- Imports (L1-5): `imageManifest` from `@/data/generated/image-manifest`, `photos` from `@/data/generated/photos`, `editorial` from `@/data/photos/editorial`, formatters from `@/lib/home-format` and `@/lib/photo-format`.
- Injectable input with committed defaults (L92-94): `export function buildWaypoints(input: WaypointInput = { photos, editorial, imageManifest })` — copy for `buildPhotoViews(input = …)` so unit tests pass fixtures.
- Fail loudly (L71-77):
```ts
function fail(id: string, problem: string): never {
  throw new RangeError(`buildWaypoints: photo ${id} ${problem}`);
}
function variant(id: string, variants: readonly Variant[], longEdge: number): Variant {
  return variants.find((v) => v.longEdge === longEdge) ?? fail(id, `has no ${longEdge} px variant`);
}
```
- Capture year (L79-81) → reuse for `rights: \`© ${year} Tim Lui, all rights reserved\``.
- Srcset building (L138-144): extend `CARD_EDGES = [640, 1024]` to 1024/1600/2560 for the stage.
- Build ON TOP of `buildWaypoints()` (the one order, DEM asc ties by id, L113-116) — never re-sort.
- Nowrap parts helper (L155-160 `waypointKickerParts`) is the model for EXIF/position line parts.

### `lib/photos/justify.ts`, `lib/photos/label-layout.ts`, `lib/photos/view-param.ts`, lightbox-tier constant (pure)

**Analog:** `lib/ascent/summit-layout.ts`.
- Header doc pattern (L1-20): cite D-ids / UI-SPEC section; "Pure and import-free … keep it to erasable TypeScript and never add an import."
- Exported box type (L25): `export type ColumnBox = { x: number; y: number; width: number; height: number };` — reuse shape for label rects.
- Named size constants with comments (L36-43) — e.g. `PLATE_H_WIDE = 48`, `PLATE_H_COMPACT = 68`, `GUTTER = 216`.
- CSS/TS parity constant (L27-34):
```ts
export const SUMMIT_FULL_MIN_REM = 68.75;
export const SUMMIT_FULL_MAX_REM = 121.5;
export const SUMMIT_FULL_MEDIA = `(orientation: landscape) and (${SUMMIT_FULL_MIN_REM}rem <= width < ${SUMMIT_FULL_MAX_REM}rem)`;
```
Mirror this for `LB_SCROLL_MEDIA` / `LB_KEY_MEDIA` / `LB_GUTTER_MEDIA`.
- Existing label placement precedent: `placePinLabel` in `lib/ascent/framing.ts` (referenced by `PinMark.tsx` L13-14).

### `app/globals.css` (modify)

**Analog:** L284-300 custom variants:
```css
@custom-variant summit-full {
  @media (orientation: landscape) and (68.75rem <= width < 121.5rem) {
    @slot;
  }
}
```
Add `lb-scroll`, `lb-key`, `lb-gutter` the same way, with a preceding comment naming the TS constant and the Jest guard. Reduced-motion VT block exists at L589-593 (`::view-transition-group(*), -old(*), -new(*) { animation: none !important; }`) — keep it; add `::view-transition { pointer-events: none; }` outside the media query, the morph group timing, and `html:has(dialog[open], [data-photo-viewer])::view-transition-group(root) { animation: none; }` (UI-SPEC "Open and close motion").

### `components/photos/MapSheet.tsx` (RSC, transform)

**Analog:** `components/home/PosterSheet.tsx`.
- Imports (L1-6): `PinMark, { SummitMark }`, `ContourField`, `terrain`, `buildWaypoints`, `formatMetres`.
- Relief `<picture>` (L52-77): hillshade AVIF/WebP 640/1100, raw `<img>` with the no-img-element comment, `alt=""`, `loading="eager"`, `decoding="async"`, `className="block h-full w-full opacity-(--relief-opacity)"`. On `/photos` drop `fetchPriority="high"` only if the plan decides the map isn't LCP.
- Contours (L78): `<ContourField lod="hero" className="absolute inset-0" />` (UI-SPEC OQ3: hero, not map).
- UV placement (L39): `const at = (uv) => ({ left: \`${uv.u * 100}%\`, top: \`${uv.v * 100}%\` });`
- Differences: sheet is `aspect-square` with `container-type: inline-size` (not PosterSheet's `max(100cqw,100cqh)` stage box); marks are `<Link>`s in an `<ol>`, not an `aria-hidden` pointer-events-none layer (PosterSheet L79-81).

### Map waypoint link + summit plate (RSC)

**Analog:** `components/home/PinMark.tsx`.
- Server-safe (L5-7: "no directive, no hooks, ref as a prop").
- Approximate = shape, not colour (L20-21, L54, L62): `approximate ? 'border-2 border-dashed border-ink-muted' : 'border border-ink-muted'`. UI-SPEC wants `border-2 border-dashed border-ink` on a hollow `bg-surface` 12 px dot.
- State via data attributes / group variants (L49, `group/pin`, `group-data-[label=left]/pin:`) — use `group-focus-visible:` for the dot ring.
- `SummitMark` (L76-85) triangle: `size-3 -translate-x-1/2 -translate-y-full bg-ink-muted [clip-path:polygon(50%_0,100%_100%,0_100%)]` — reuse directly, plus the 93×48 plate.
- Explicit `aria-label` on flex links (WaypointCard L52-57 rationale, L109).

### `components/photos/JustifiedGrid.tsx`, `CarouselStepper.tsx`, stage `<picture>` (images)

**Analog:** `components/home/WaypointCard.tsx` L81-95:
```tsx
<picture className="...">
  <source type="image/avif" srcSet={image.srcSetAvif} sizes="(min-width: 768px) 400px, 128px" />
  <source type="image/webp" srcSet={image.srcSetWebp} sizes="(min-width: 768px) 400px, 128px" />
  {/* A raw img inside picture (exempt from @next/next/no-img-element): content-hashed manifest derivative; picture type switching. */}
  <img src={image.src} width={image.width} height={image.height} alt={alt}
    loading="lazy" decoding="async"
    style={{ aspectRatio: `${image.width} / ${image.height}` }}
    className="block h-auto w-full rounded-sm bg-surface-overlay" />
</picture>
```
Caption nowrap parts: WaypointCard L67-74 and L96-106 (`whitespace-nowrap` spans joined at ` · `, `data-*` hooks for tests). Grid adds `<ViewTransition name share="morph" default="none">` only when `usePathname()` is not a photo path (RESEARCH "Grid tile naming"). Never `next/image`.

### `components/photos/CarouselView.tsx` (client gate)

**Analog:** `components/home/TerrainStage.tsx` L1-31, L63-64:
```tsx
'use client';
import dynamic from 'next/dynamic';
const TerrainCanvas = dynamic(() => import('./terrain/TerrainCanvas'), { ssr: false });
...
if (!eligible || gridSize === null) return null;
```
Read the gate with `useAscentMode()` from `lib/useAscentMode.ts` (server snapshot `'pending'`, L11-12 → render stepper so hydration matches). Use `downgradeAscent('context-lost' | 'load-error')` on canvas failure. TerrainStage reads mode via `useAscent()` (Home context) — `/photos` must call `useAscentMode()` directly (D-13 "planner's call" on extraction; the hook is already standalone).

### `components/photos/PhotoCarousel3D.tsx` (move + restyle)

**Source:** `components/PhotoCarousel3D.tsx` — remove `color="#1f2937"` (L75), `<Html>` (L100, L182), `window.addEventListener('keydown', …)` (L175; scope to region `onKeyDown`, ignore while `dialog[open]`), `color="#0a0a0a"` (L215), point lights `#06b6d4`/`#8b5cf6` (L264-265), fog `#0a0a0a` (L268). Keep `SafeCanvas` (L5, L243-278).
**Token colours analog:** `components/home/terrain/terrain-shader.ts` L107-114 (`tokens.srgb.night950`, `tokens.srgb.firn50`, `tokens.reliefOpacity` from `data/generated/tokens.ts`).
**Textures:** `lib/useProgressiveTextures.ts` L82, L189 read legacy `thumbnailSrc`/`src` → switch to manifest 640/1024 WebP.

### `components/photos/LightboxDialog.tsx`, `PhotoViewer.tsx`, `ZoomStage.tsx`, `Hotspots.tsx`

No in-repo analog for `<dialog>`, `history.replaceState`, or pan/zoom. Use RESEARCH Pattern 3 (`useCurrentSlug` via `usePathname`, `stepTo` via `replaceState`) and Pattern 4 (`showModal()` in `useLayoutEffect` guarded by `if (!d.open)`, Escape on `keydown` + `preventDefault`, Tab wrap, `onClose` desync guard, `queueMicrotask` focus restore to `[data-photo-id]`). `components/ImageDetailModal.tsx` / `InteractiveHotspot.tsx` are the behaviours to preserve (zoom toggle, hotspots hidden while zoomed) but not code to copy (v3 `bg-opacity-*`). Hotspot state styling: copy PinMark's data-attribute/group-variant approach.

### `lib/photos/hotspot-pref.ts`

**Analog:** `lib/useAscentMode.ts` L1-46 / `lib/useReducedMotion.ts`: module-level store + `listeners` Set + `useSyncExternalStore` with a server snapshot (default `true`). Wrap every `localStorage` get/set in try/catch (D-10); none exist in repo yet.

### `components/home/WaypointCard.tsx` (modify)
L109: `href={\`/photos#${slug}\`}` → `/photos/${slug}`; update the doc comment L52-53. Test: `components/home/__tests__/waypoints.test.tsx` L72-77 (`'links View photo to the gallery fragment of its slug'`) — rename and assert `/photos/${second.slug}`.

## Shared Patterns

### Testing — pure layout sweeps + CSS parity
**Source:** `lib/__tests__/summit-layout.test.ts` L14-40
```ts
import fs from 'node:fs';
import path from 'node:path';
const css = fs.readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf8');
function range(from: number, to: number, step: number, extra: readonly number[] = []): number[] { ... }
```
**Apply to:** `photos-label-layout.test.ts` (sweep S 312–1100, no rect overlaps, reading order), `photos-justify.test.ts`, lightbox-tier parity test, a guard that the photo count is 4.

### Component tests
**Source:** `components/home/__tests__/waypoints.test.tsx` L60-77 — `render`, `getByRole('img', { name: alt })`, attribute assertions on `src/width/height/loading`, `style.aspectRatio`. **Apply to:** rewritten `GalleryGrid.test.tsx` (replace `'1 hotspots'` L80-91 with caption assertions; replace the modal open/close tests L93-115 with link-href tests). Keep test counts ≥ ratchet (966 total).

### jsdom stubs
**Source:** `jest.setup.js` (matchMedia, IntersectionObserver mocks under `if (typeof window !== 'undefined')`). Add `HTMLDialogElement.prototype.showModal/close` stubs there (RESEARCH Pitfall 11).

### Scroll lock G3
**Source:** `e2e/design-system.spec.ts` L142-175 (`scroll lock keeps the header box @chromium-only`, own Chromium without `--hide-scrollbars`, settled-box loop). Rewrite the opener to click a grid tile link instead of "View details for".

### Icons / images / colour guards
- Icons only `@phosphor-icons/react/dist/ssr`, `*Icon` names, `aria-hidden="true"`, `size={20}` (WaypointCard L2, L111).
- Images: raw `<picture>` + manifest derivatives only (served-image guard).
- No hex/`dark:`/stock palette (`scripts/guards/check-palette.mjs`); new contrast pairs in `scripts/guards/check-contrast.mjs`.

### Doc comments
Every Phase 9 file opens with a block naming requirement IDs, D-ids and the UI-SPEC section (e.g. `PosterSheet.tsx` L10-35, `WaypointCard.tsx` L31-57). Follow it.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `app/(site)/photos/@modal/default.tsx`, `@modal/page.tsx` | slot fallback | — | No parallel routes in repo; follow `default.md` (return `null`) |
| `components/photos/LightboxDialog.tsx` | client shell | event-driven | No `<dialog>` in repo; RESEARCH Pattern 4 |
| `components/photos/PhotoViewer.tsx` | client | event-driven (history) | No `replaceState`/`usePathname` slug sync; RESEARCH Pattern 3 |
| `components/photos/ZoomStage.tsx` | client | pointer | No pan/zoom stage; UI-SPEC "Stage and photo" |
| `components/photos/ViewSwitcher.tsx` | client | router | No `router.replace` usage in repo; RESEARCH "?view= parsing" |

## Metadata

**Analog search scope:** `app/`, `components/`, `components/home/`, `components/terrain/`, `lib/`, `lib/ascent/`, `lib/__tests__/`, `e2e/`, `jest.setup.js`, `app/globals.css`
**Files scanned:** ~140 tracked paths; 12 read
**Pattern extraction date:** 2026-10-26
