# Phase 18: Immersive Survey Layout - Pattern Map

**Mapped:** 2026-11-24
**Files analyzed:** 34 new or modified (plus the retirement set)
**Analogs found:** 32 / 34

All analog paths below were checked with `git ls-files` (tracked source). Coordinate literals are elided from every excerpt (16 D-25).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `proxy.ts` (MOD: `?view=` 308) | middleware | request-response | `proxy.ts` itself (`missedSection` branch, lines 225-259) | exact |
| `lib/photos/region-ids.ts` (MOD: `LEGACY_VIEW_REGION`) | config | static | itself (lines 1-15) | exact |
| `lib/regions.ts` (MOD: `regionsWestToEast`, next-region, end-card props) | model/service | transform | itself (`regionPhotoViews`, `regionCardFacts`) | exact |
| `lib/photos/overview-layout.ts` (NEW) | utility (pure layout) | transform | `lib/photos/label-layout.ts` | exact |
| `lib/photos/plate-layout.ts` (NEW) | utility (pure layout) | transform | `lib/photos/label-layout.ts` (+ `hotspot-layout.ts`) | exact |
| `lib/photos/image-sizes.ts` (NEW) | utility | transform | `lib/photos/lightbox-tiers.ts` + `PhotoViewer.tsx:167` | role-match |
| `lib/photos/lv95-line.ts` or `view-model.ts` (MOD) | utility | transform | `lib/geo.ts:23` + `lib/footer-format.ts:40` | role-match |
| `lib/photos/share-mode.ts` (NEW) | store/hook | event-driven | `lib/photos/hotspot-pref.ts:58-79` | exact |
| `lib/photos/stepping.ts` (MOD: card-aware step) | utility | transform | itself `stepIndex` (lines 60-63) | exact |
| `lib/photos/view-model.ts` (MOD: `country`/LV95 in StripFields; retire light table) | model | transform | itself | exact |
| `lib/json-ld/content.ts` (MOD: `breadcrumbLd`) | utility | transform | `regionGalleryLd` (lines 183-205) | exact |
| `data/sources.ts` (NEW, server-only) | config/data | static | `lib/photos/region-ids.ts` (thin re-export module) | partial |
| `app/(site)/photos/page.tsx` (REWRITE: overview) | page (RSC) | request-response | current file + `components/photos/MapSheet.tsx` | exact |
| `app/(site)/photos/regions/[region]/page.tsx` (REWRITE body) | page (RSC) | request-response | itself (keep lines 1-56 metadata/params/JSON-LD) | exact |
| `app/(site)/photos/[slug]/page.tsx` + `@modal/(.)[slug]/page.tsx` (MOD) | page | request-response | themselves | exact |
| `app/(site)/sources/page.tsx` (NEW) | page (RSC) | static | `app/(site)/roadmap/page.tsx` (metadata) + region page facts list | role-match |
| `app/sitemap.ts` (MOD: add `/sources`, ordering) | config | static | itself | exact |
| `components/photos/overview/OverviewSheet.tsx` (NEW) | component (server) | transform | `components/photos/MapSheet.tsx` | exact |
| `components/photos/overview/RegionList.tsx` (NEW) | component (server) | static | region page `<ol>` (page.tsx 110-129) | role-match |
| `components/photos/region/RegionHeader.tsx` (NEW) | component (server) | static | region page header band (lines 90-92) | role-match |
| `components/photos/region/HeaderSlot.tsx` (NEW) | component (server) | static | `MapSheet.tsx` `<picture>` block (93-116) | role-match |
| `components/photos/region/PlateSheet.tsx` (NEW) | component (server) | transform | `components/photos/MapSheet.tsx` | exact |
| `components/photos/region/SequenceFigure.tsx` (NEW) | component (server) | static | `JustifiedGrid.tsx` tile + `ExifStrip.tsx` | role-match |
| `components/photos/region/RegionRail.tsx` (NEW, client) | component (island) | event-driven | `components/home/AltimeterRail.tsx` (DO NOT modify) | exact |
| `components/photos/region/NextRegion.tsx` (NEW) | component (server) | static | `components/projects/EndBlock.tsx` | exact |
| `components/photos/ShareButton.tsx` (NEW, client) | component (island) | event-driven | `components/contact/CopyEmailButton.tsx` | exact |
| `components/photos/Breadcrumb.tsx` (NEW) | component (server) | static | none in repo (nav + JSON-LD pair) | no analog |
| `components/photos/PhotoViewer.tsx` (MOD: end card, region set, preload, sizes, Share, LV95, back link) | component (client) | event-driven | itself (`step`, lines 246-262) | exact |
| `components/photos/ExifStrip.tsx` (MOD: LV95 row) | component | static | itself | exact |
| `components/terrain/SheetMargin.tsx` (NEW) | component (server) | static | `components/terrain/SheetLegend.tsx` | exact |
| `components/terrain/SheetLegend.tsx` + `components/site/SiteFooter.tsx` (MOD: short credit) | component | static | themselves (SheetLegend 100-104) | exact |
| `e2e/visual/routes.spec.ts` (MOD) | test (visual) | — | itself (`ASCENT_SHOTS` loop 56-205) | exact |
| `e2e/routes.ts` (MOD) | test config | — | itself (`ROUTES` 40-53) | exact |
| Jest: `lib/__tests__/photos-overview-layout.test.ts`, `photos-plate-layout.test.ts`, `json-ld.test.ts`, `proxy.test.ts`, `client-graph.test.ts`, `regions.test.ts`, `components/photos/__tests__/share-button.test.tsx` | test | — | `photos-label-layout.test.ts`, `proxy.test.ts`, `CopyEmailButton.test.tsx` | exact |
| `e2e/photos*.spec.ts` rewrites (PHOTO-06) | test (e2e) | — | the existing specs | exact |
| `e2e/perf/photo-baseline.spec.ts` (NEW, on demand) | test (perf) | — | existing HOME-08 perf spec in `e2e/perf/` | role-match |

**Retired (PHOTO-06, D-27):** `ViewSwitcher`, `JustifiedGrid`, `CarouselView`, `CarouselControls`, `CarouselStepper`, `PhotoCarousel3D`, `TileTransition`, `lib/photos/view-param.ts` rendering role, `PhotosHeader` kicker, `data/light-table.ts` `lightTableIds`, the `photos-view` CSS block in `app/globals.css`. Copy anything reused (e.g. `JustifiedGrid` view-transition-name rule, `CarouselControls` `STEP_BUTTON` for 14 IN-04) out before deleting.

## Pattern Assignments

### `proxy.ts` (middleware, request-response) — `?view=` redirect

**Analog:** `proxy.ts` lines 225-259. Insert the redirect before the nonce is built (a redirect needs no CSP), after `missedSection`:
```typescript
export async function proxy(request: NextRequest): Promise<Response> {
  const missed = missedSection(request.nextUrl.pathname);
  if (missed?.neutral && canFetchNeutral(new URL(request.url).hostname)) {
    const neutral = await neutral404(request, missed.section);
    if (neutral) return neutral;
  }
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  ...
```
Shape of the new branch (RESEARCH "Redirect mechanism"): `pathname === '/photos'`, `searchParams.getAll('view')` exactly one value in `{grid, carousel}` → `NextResponse.redirect(new URL(regionHref(LEGACY_VIEW_REGION), request.url), 308)`. Import the target from `lib/photos/region-ids.ts` only (line 5 precedent: `import { regionRouteIds } from '@/lib/photos/region-ids';`); never import `view-model.ts` into the proxy.

**Test analog:** `lib/__tests__/proxy.test.ts` line 53: `proxy(new NextRequest(url, { headers }))` — call directly, assert `status === 308` and `Location`. Also note line 39 imports `photoSlugs` from view-model (Pitfall 8: audit when retiring light table).

### `lib/photos/region-ids.ts` (config)

Whole file (lines 1-15) is the pattern: JSON import + one exported constant with a "for proxy.ts only" doc block. Add `export const LEGACY_VIEW_REGION = 'zermatt';` and a unit test that it is in `regionRouteIds`.

### `lib/regions.ts` (model) — west→east order, next region

**Analog:** lines 40-68 and 258-262:
```typescript
/** Every region, in registry order (ortler, saalfelden, zermatt). */
export const regions: readonly Region[] = parsed.regions;
export const regionIds: readonly string[] = regions.map((r) => r.id);
...
export function regionPhotoViews(id: string): readonly PhotoView[] {
  const views = VIEWS.get(id);
  if (!views) throw new RangeError(`regionPhotoViews: ${id} is not a registry region`);
  return views;
}
...
export function regionCardFacts(id: string): { count: string; range: string; years: string } {
  if (!regionById(id)) throw new RangeError(`regionCardFacts: ${id} is not a registry region`);
```
Add `regionsWestToEast()` (sorted by overview outline centre `u`) and `nextRegion(id)` (D-11 wrap) as new exports; **do not reorder `regions`** (sitemap pin, saved-pages). Unknown id throws `RangeError` with the `fnName: id is not a registry region` message, as above.

### `lib/photos/overview-layout.ts`, `lib/photos/plate-layout.ts` (pure layout)

**Analog:** `lib/photos/label-layout.ts`. Copy the structure:
- Box constants exported at top (lines 99-116: `PLATE_WIDE`, `INSET = 8`, `GAP = 8`, `COMPACT_MAX_S = 559`, `SWEEP_MIN_S = 312`, `SWEEP_MAX_S = 1100`).
- `meets(a, b, gap)` overlap test (line 151), `leaderFor` (225).
- Segment builder (lines 430-455):
```typescript
export function mapMarkSegments(marks, summitUv): MapMarkSegment[] {
  const runs: { from: number; to: number; sig: string }[] = [];
  for (let S = SWEEP_MIN_S; S <= SWEEP_MAX_S; S++) {
    const t: Trace = [];
    compute(S, marks, summitUv, t);
    const sig = t.join(',');
    const last = runs[runs.length - 1];
    if (last && last.sig === sig) last.to = S;
    else runs.push({ from: S, to: S, sig });
  }
  return runs.map((r, i) => ({ minS: i === 0 ? null : r.from, maxS: ..., placements: fitLayout(...) }));
}
```
- CSS emitter (lines 511-533): validate ids with `const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/` and throw `RangeError` on unsafe id; first segment unconditional, later ones `@container <name> (min-width: …px){…}`, repeating only changed rules.
- New for overview: 8-direction candidate search with leader lengths 8/16/24/40 and one level of backtracking (RESEARCH Pattern 2). Append the `:has()` list–map sync selectors (RESEARCH Pattern 3) to the same CSS string; use `lib/photos/css-escape.ts`.
- Plate layout: displace any badge pair closer than 24 + 8 px (Saalfelden aerial pair, Zermatt 0605/0629), not only identical uv (Pitfall 9).

**Test analog:** `lib/__tests__/photos-label-layout.test.ts` (imports `SWEEP_MIN_S`/`SWEEP_MAX_S` and real generated data, sweeps every integer S). Write the sweep first (TDD), plus count guards (regions, summits, ≤16 photos/region).

### `lib/photos/share-mode.ts` (hydration-safe store)

**Analog:** `lib/photos/hotspot-pref.ts` lines 58-79:
```typescript
const serverSnapshot = (): boolean => true;
export function useLabelsOn(): readonly [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(subscribe, readLabelsOn, serverSnapshot);
  return [on, writeLabelsOn] as const;
}
```
Server snapshot `'copy'`; client snapshot `navigator.share` + `canShare?.({url}) !== false` → `'share'`; subscribe is a no-op.

### `components/photos/ShareButton.tsx` (client island)

**Analog:** `components/contact/CopyEmailButton.tsx` (91 lines, entire file). Copy:
- Header: `'use client';`, `import { CheckIcon, … } from '@phosphor-icons/react/dist/ssr';`
- `COPIED_MS` (import it from CopyEmailButton rather than redefining), `SECONDARY` class string (lines 10-11) — add `min-w-40 justify-center`; on gallery swap `hover:bg-surface-overlay` for `hover:border-ink-muted`.
- `mounted`/`timer` refs + unmount cleanup (lines 37-44), `setAnnouncement('')` at press start, timer restart (lines 57-75).
- Range selection fallback `selectAddress` (lines 46-54) → select the visible failure URL span.
- `role="status" aria-live="polite" aria-atomic="true" className="sr-only"` (lines 86-88).
New: share branch first, synchronously in the handler, `AbortError` silent, pending guard (RESEARCH Pattern 7, Pitfall 6). URL is a prop built on the server (`site.url + photoHref/regionHref`), never `location.href`.
**Test analog:** `components/contact/__tests__/CopyEmailButton.test.tsx`.

### `components/photos/region/RegionRail.tsx` (client island)

**Analog:** `components/home/AltimeterRail.tsx` lines 66-113 (markup only; Home must not change, DATA-09):
```tsx
<div ref={boxRef} data-ascent-rail className="pointer-events-none absolute ... hidden w-40 md:block">
  <div className="absolute inset-y-0 right-0 w-px bg-ink-muted" />
  <ol>
    {ticks.map((tick, k) => (
      <li key={k} data-rail-tick={k} className="absolute right-0 flex translate-y-1/2 items-center gap-2"
          style={{ bottom: `${(k / last) * 100}%` }}>
        <span data-tick-label className="font-mono text-sm whitespace-nowrap text-ink-muted tabular-nums">{tick.label}</span>
        <span className={tick.approximate ? 'w-4 border-t border-dashed border-ink-muted' : 'h-px w-4 bg-ink-muted'} />
      </li>))}
  </ol>
  ... <span data-ascent-marker className="absolute -right-3 bottom-0 h-0.5 w-6 translate-y-1/2 bg-accent ..." />
```
Differences: no Motion / `useAscent`; `sticky top-[calc(var(--nav-h)+24px)]`, `aria-hidden`; IntersectionObserver `rootMargin: '-50% 0px -50% 0px'` on `li[data-sequence-item]`, state set inside the observer callback (react-hooks `set-state-in-effect`); expose `data-rail-current` as the e2e settle signal. Follow its observer-in-`useEffect` with cleanup (lines 58-64). Ticks/labels passed as props (`formatMetres` from `@/lib/photo-format`).

### `components/photos/region/NextRegion.tsx` and the viewer end card

**Analog:** `components/projects/EndBlock.tsx` lines 11-45:
```tsx
const PLATE = 'flex flex-1 items-center justify-between gap-4 rounded-l-sm border border-line-strong bg-surface-raised px-4 transition-colors duration-(--duration-fast) ease-erosion group-hover:border-ink-muted group-hover:bg-surface-overlay';
const TIP_CLIP = { clipPath: 'polygon(0 0, 100% 50%, 0 100%)' } as const;
<Link href={...} aria-label={`${other.name}, next route`} className="group flex min-h-14 w-full max-w-md items-stretch rounded-sm">
  <span className={PLATE}>
    <span className="text-base font-semibold text-balance text-ink">{other.name}</span>{' '}
    <span className="font-mono text-sm whitespace-nowrap text-ink-muted">Next route</span>
  </span>
  <span aria-hidden="true" className="w-6 shrink-0 bg-trail" style={TIP_CLIP} />
</Link>
```
The region block and the PhotoViewer end card share one sign; since the end card lives in a client component, put the sign in a props-only module with no data imports (strings in, no `lib/regions` import). Consider extracting `PLATE`/`TIP_CLIP` to a shared module so EndBlock and the new sign don't duplicate (14 IN-04 precedent).

### `app/(site)/photos/regions/[region]/page.tsx` (RSC rewrite)

**Analog:** itself. Keep lines 1-56 (imports, `dynamicParams = false`, `generateStaticParams`, `generateMetadata`, `FactSource`) and the JSON-LD script (lines 84-87):
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(regionGalleryLd(region.id)) }} />
```
Add a second script for `breadcrumbLd`. Keep the `notFound()` guard as the unreachable path. Keep `data-photo-id={v.slug}` on each figure's photo `Link` (lightbox focus return) and the rights line `regionRights(region.id)`. Container: `mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8`; header band `border-b border-line pt-8 pb-6` (lines 88-92). Facts list markup (lines 94-107) moves into the new layout unchanged.

### `components/photos/overview/OverviewSheet.tsx`, `components/photos/region/PlateSheet.tsx`

**Analog:** `components/photos/MapSheet.tsx` lines 20, 76-120:
```tsx
const SHEET = 'relative -mx-4 aspect-square overflow-hidden border border-line bg-surface [container-name:map-sheet] [container-type:inline-size] sm:mx-auto ...';
export default function MapSheet({ photos }: { photos: readonly PhotoView[] }) {
  const css = mapMarkCss(photos.map((p) => ({ slug: p.slug, u: p.uv.u, v: p.uv.v })), terrain.summit.uv);
  ...
  <div data-map-sheet className={SHEET}>
    <style>{css}</style>
    <picture> <source type="image/avif" .../> <source type="image/webp" .../> <img ... loading="eager" fetchPriority="high" decoding="async" /> </picture>
    <ContourField sheet={homePlate} lod="hero" className="absolute inset-0" />
```
Overview: `aspect-[1200/872]`, no hillshade, own container name; plate: region plate passed as a prop (server-only). Markers `aria-hidden tabIndex={-1}`.

### `components/photos/region/HeaderSlot.tsx`, `SequenceFigure.tsx`

**Analog for `<picture>`:** MapSheet lines 93-116 (raw `<img>` inside `<picture>` exempt from `no-img-element`; explicit `width`/`height`). Header slot: `loading="eager" fetchPriority="high"`, `alt=""`, no view-transition name. Figure: `loading="lazy" decoding="async"`, `sizes` from `lib/photos/image-sizes.ts`; caption EXIF lines reuse `ExifStrip.tsx` formatting.

### `components/photos/PhotoViewer.tsx` (client, modify)

**Analog:** itself.
- Step logic lines 246-262 (`stepIndex(from, dir, photos.length)`, `replaceState(null, '', photoHref(slug))`, `lightbox?.setShown(slug)`, `setAnnouncement(\`Photo ${to + 1} of ${photos.length}: ${title}\`)`). Add index N = card: no `replaceState`, keep `lastWritten`/`setShown` on last slug; announcement per UI-SPEC.
- `STAGE_SIZES` line 167 → import from `image-sizes.ts` (13 #34).
- `preloadStage` lines 187-193 sets only `srcSetAvif` (13 #33): pick AVIF vs WebP by support.
- Back link lines 207-215 (`back?.label ?? 'All photographs'`) → always region (`Back to {name}`), from server prop.
- Disabled-step classes at line 182 unchanged.
- Region-scoped `photos` prop from `regionPhotoViews(regionOfPhoto(id))` built in the server pages.

### `lib/photos/stepping.ts`

Add a card-aware sibling next to (not replacing) line 60:
```typescript
export function stepIndex(index: number, dir: -1 | 1, n: number): number | null {
  const next = index + dir;
  return next >= 0 && next < n ? next : null;
}
```
Test analog: `lib/__tests__/photos-stepping.test.ts`.

### LV95 line (`view-model.ts` or `lib/photos/lv95-line.ts`)

Use `wgs84ToLv95` (`lib/geo.ts:23`) on the **shown** rounded WGS84 (`roundedCoordinate`), grid-round by precision (4dp→10 m, 3dp→100 m, 2dp→1 km), format with `formatLv95` (`lib/footer-format.ts:40`). Only `country === 'CH'`. Test analogs: `lib/__tests__/geo.test.ts`, `photos-view-model.test.ts`.

### `lib/json-ld/content.ts` — `breadcrumbLd`

**Analog:** `regionGalleryLd` lines 183-205: absolute URLs via `` `${site.url}${regionHref(id)}` ``, `WithContext<…>` typing, `RangeError` on unknown id. Feed the visible `nav` and the JSON-LD from one items array. Rewrite the "no BreadcrumbList" assertions in `lib/__tests__/json-ld.test.ts` (lines 47-48, 813).

### `components/terrain/SheetMargin.tsx` and `SheetLegend.tsx` Source row

**Analog:** `components/terrain/SheetLegend.tsx` (whole, 109 lines). Reuse the `DT`/`DD_VALUE` constants (lines 24-25), the `dl` rows (lines 86-104) and `formatMonthYear(sheet.dem.edition)`. The row to change (lines 100-104):
```tsx
<dt className={DT}>Source</dt>
<dd className="mt-1 text-sm text-ink-muted max-w-prose wrap-anywhere">
  Contours derived from swissALTIRegio. {site.attribution.terrain}
```
→ short credit + `prose-link` to `/sources#<anchor>`. Per-sheet extent: LV95 via `formatExtentLines` for Matterhorn only, WGS84 for others (EPSG:3035 corners computed at build time with proj4 in `scripts/terrain/build-terrain.mjs`). Move `site.attribution.terrain` into server-only `data/sources.ts` and add it to `SERVER_ONLY_MODULES` (`lib/__tests__/client-graph.test.ts:60`). Rewrite `components/site/__tests__/SiteFooter.test.tsx:116-121` and `e2e/shell.spec.ts:629`.

### `app/(site)/sources/page.tsx` (new static page)

**Analog:** `app/(site)/roadmap/page.tsx` lines 1-24 for metadata:
```typescript
export const metadata: Metadata = pageMetadata({ title: 'Roadmap', description: '…', path: '/roadmap' });
```
Body: container + header band from the region page; each entry `section id="<anchor>" aria-labelledby`, external licence links copy `FactSource` (region page lines 60-75: `ArrowSquareOutIcon size={16}`, sr-only "(opens in a new tab)"). Join `app/sitemap.ts` (add after nav entries), `e2e/routes.ts` `ROUTES`, visual `ROUTES`.

### `app/(site)/photos/page.tsx` (overview)

Drop `searchParams`/`parseView` (lines 10, 38-43) and `PhotosHeader` kicker; keep `metadata` (line 14). Compose `OverviewSheet` + `RegionList` from `regionsWestToEast()`.

### `e2e/visual/routes.spec.ts`

- `ROUTES` lines 31-44: replace `photos-grid` / `photos-carousel` with region shots (D-22), add `sources`.
- Photo shot selector line 28 `buildPhotoViews().find((view) => view.approximate)` must become `medium === 'film-scan'` with an exactly-one assertion (Pitfall 8).
- Region viewport shots: copy the `ASCENT_SHOTS` loop (lines 56-205) shape; selectors from data (e.g. `#photo-${regionPhotoViews('zermatt')[k].slug}`), wait on `[data-rail-current="k"]`; force copy mode via `addInitScript` deleting `Navigator.prototype.share`.
- Keep `stylePath` = `hide-canvas.css`, never `mask:`.

### `e2e/routes.ts`

`ROUTES` lines 40-53 + `REGION_TEMPLATE_ID` (line 32); `AUDIT_SWEEP` derives from the sitemap automatically (lines 77-78), so `/sources` only needs a `ROUTES` template row.

## Shared Patterns

### Server-only data, props-only islands
**Source:** `lib/__tests__/client-graph.test.ts` lines 41, 60; `lib/photos/region-ids.ts` doc block. **Apply to:** ShareButton, RegionRail, PhotoViewer end card, SheetMargin callers. Never import `lib/regions.ts`, `data/generated/*`, `data/sources.ts` from a `'use client'` module; pass strings/numbers.

### Server CSS from pure layout
**Source:** `label-layout.ts` 430-533 + `MapSheet.tsx` 78-90 (`<style>{css}</style>`). **Apply to:** overview, plate, list–map sync. CSP already allows inline style (`proxy.ts` `style-src 'self' 'unsafe-inline'`).

### Errors
Pure helpers throw `RangeError('<fn>: <id> is not a registry region')` (`lib/regions.ts:66`, `content.ts:185`); unsafe ids throw in CSS emitters (`label-layout.ts:513-515`). Pages keep `notFound()` only as unreachable guards; misses are handled by the proxy.

### Links
Every photo/region href from `lib/photos/routes.ts` (`photoHref`, `regionHref`); the source scan forbids hand-built paths.

### Icons and classes
`@phosphor-icons/react/dist/ssr`, `size={20}`, `aria-hidden="true"`. Container `mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8`; secondary button string from `CopyEmailButton.tsx:10-11`; prose links `prose-link`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `components/photos/Breadcrumb.tsx` | component | static | No breadcrumb exists; build from UI-SPEC Contract 6 with `breadcrumbLd` sharing one items array |
| `e2e` `sizes`/`currentSrc` gate | test | — | No existing `currentSrc` assertion; use RESEARCH "sizes per breakpoint" gate recommendation |

## Metadata

**Analog search scope:** `components/{photos,terrain,home,contact,projects,site}`, `lib/{photos,json-ld}`, `lib/regions.ts`, `lib/geo.ts`, `lib/footer-format.ts`, `proxy.ts`, `app/(site)`, `app/sitemap.ts`, `e2e/`, `lib/__tests__/`
**Files scanned:** ~30
**Pattern extraction date:** 2026-11-24
