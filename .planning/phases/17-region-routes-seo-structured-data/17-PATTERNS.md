# Phase 17: Region Routes, SEO & Structured Data - Pattern Map

**Mapped:** 2026-11-23
**Files analyzed:** 38 (new + modified, incl. tests)
**Analogs found:** 36 / 38 (2 with no in-repo analog: `lib/json-ld.ts`, `lib/__tests__/json-ld.test.ts`; both use the bundled Next guide + RESEARCH Pattern 6)

All analog paths below are git-tracked source (no gitignored mirrors). Next API citations point to `node_modules/next/dist/docs/` (AGENTS.md).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/(site)/photos/regions/[region]/page.tsx` (NEW) | route page (RSC) | request-response, static params | `app/(site)/photos/[slug]/page.tsx` + `app/(site)/projects/[slug]/page.tsx` | exact |
| `app/(site)/photos/regions/[region]/opengraph-image.tsx` (NEW) | metadata route | file-I/O -> image | `app/(site)/photos/[slug]/opengraph-image.tsx` (READ ONLY, never edit) | exact |
| `app/(site)/photos/@modal/regions/[region]/page.tsx` (NEW) | parallel-slot page | none (returns null) | `app/(site)/photos/@modal/default.tsx` | exact |
| `app/(site)/photos/[slug]/page.tsx` | route page | static params | itself (published slugs, `viewerPhotos`, ImageObject JSON-LD) | self |
| `app/(site)/photos/@modal/(.)[slug]/page.tsx` | intercepted page | request-response | itself (`viewerPhotos(view)` only, NO JSON-LD) | self |
| `app/(site)/layout.tsx` | layout | render | itself (+ Person/WebSite JSON-LD) | self |
| `app/(site)/projects/[slug]/page.tsx` | route page | render | itself (+ project JSON-LD) | self |
| `app/sitemap.ts` | metadata route | transform | itself | self |
| `app/(site)/offline/page.tsx` | route page | transform -> props | itself | self |
| `lib/photos/routes.ts` | utility (URL builder) | pure | itself (`photoHref`) | self |
| `lib/photos/region-ids.ts` (NEW, proxy-only) | utility/data list | pure | `lib/photos/routes.ts` `photoRouteSlugs` | role-match |
| `lib/regions.ts` (NEW, server-only) | service/model | read registry | `lib/photos/view-model.ts` (`photoBySlug`/`photoViews`) | role-match |
| `lib/json-ld.ts` (NEW) | utility (builders + serialiser) | transform | none in repo; Next guide `json-ld.md` | no analog |
| `lib/photos/view-model.ts` | model | transform | itself (`buildPhotoViews`, `photoBySlug`) | self |
| `lib/photos/stepping.ts` | utility | pure | itself (`PHOTO_PATH`, `slugFromPath`) | self |
| `lib/dom/editable.ts` or `lib/photos/keys.ts` (NEW) | utility | pure | `components/photos/PhotoViewer.tsx:171-176` `isEditable` | exact (moved) |
| `components/photos/LightboxDialog.tsx` | component (client) | event-driven | `lib/photos/stepping.ts` parser | self |
| `components/photos/PhotoViewer.tsx` | component (client) | event-driven | itself (back link 495-546) | self |
| `components/photos/ZoomStage.tsx` | component (client) | event-driven | import shared `isEditable` | self |
| `lib/og/template.tsx` | utility (OG render) | file-I/O | itself (`contourDataUrl`, `OgFrame` photo variant) | self |
| `lib/saved-pages.ts` | utility | transform | itself | self |
| `lib/home-format.ts` | utility | pure | itself (`fixedDecimals`, `formatCoordinates`) | self |
| `proxy.ts` | middleware (edge) | request-response | itself (`DETAIL_PATH`, `KNOWN`, `neutral404`) | self |
| `data/regions/regions.json` + `data/schemas/region.ts` | config/schema | validation | `data/schemas/region.ts` `Region` strictObject + `Regions.refine` | self |
| `data/schemas/photo.ts` + `scripts/photos/build-photo-data.mjs` | schema + build script | batch | itself (`TIME_ZONE`, `zurichOffset`) | self |
| D-23 IN-01..IN-09 files (`scripts/terrain/*.mjs`, `lib/ascent/home-photos.ts`, `.gitattributes`, `16-REVIEW-DISPOSITION.md`) | scripts/config | batch | RESEARCH Pattern 12 table | self |
| `.github/workflows/ci.yml` (D-25 shard, conditional) | config | batch | its `e2e-tests` job (lines ~160-191) | self |
| `lib/__tests__/json-ld.test.ts` (NEW, Wave 0) | test (Jest node) | transform | `lib/__tests__/photo-routes.test.ts` structure | role-match |
| `e2e/photos-region.spec.ts` (NEW, Wave 0) | test (Playwright) | e2e | `e2e/photos-lightbox.spec.ts` + `e2e/not-found.spec.ts` | exact |
| `lib/__tests__/photo-routes.test.ts` | test (source scan) | scan | itself (`HAND_BUILT`, BAD/GOOD self-test) | self |
| `lib/__tests__/client-graph.test.ts` | test (graph walk) | scan | itself (`SERVER_ONLY_MODULES`) | self |
| `lib/__tests__/proxy.test.ts` | test (Jest node) | request-response | itself (`run()`, fetch mock) | self |
| `lib/__tests__/saved-pages.test.ts` | test | transform | itself | self |
| `lib/__tests__/photos-stepping.test.ts` | test | pure | itself | self |
| `lib/__tests__/audit-routes.test.ts`, `lib/og/__tests__/routes.test.ts`, `data/__tests__/photos.test.ts` | tests | various | themselves | self |
| `e2e/routes.ts`, `e2e/seo.spec.ts`, `e2e/og.spec.ts`, `e2e/not-found.spec.ts`, `e2e/audit.spec.ts`, `e2e/offline.spec.ts` | e2e | e2e | themselves | self |
| `scripts/guards/selftest.mjs` | guard self-test | batch | its line 3463 expectOutput (CH text must stay) | self |

## Pattern Assignments

### `app/(site)/photos/regions/[region]/page.tsx` (route page, static params)

**Analog:** `app/(site)/photos/[slug]/page.tsx` (lines 21-40) for params/static shape; `app/(site)/projects/[slug]/page.tsx` (lines 29-48) for `generateMetadata` returning `{}` on a miss; `lib/metadata.ts:28-34` `pageMetadata` for title/description/canonical.

```tsx
// app/(site)/photos/[slug]/page.tsx:21-32
type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return photoSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return photoMetadata(slug);
}
```
```ts
// lib/metadata.ts:28-34 (never set openGraph/twitter here: shallow merge would drop file OG images)
export function pageMetadata(o: { title?: string; description: string; path: string }): Metadata {
  return {
    ...(o.title ? { title: o.title } : {}),
    description: o.description,
    alternates: { canonical: o.path },
  };
}
```
- Pass `path: regionHref(region.id)` (D-06/D-15). Title/description text comes from the D-14 copy checkpoint.
- Header comment style: copy the block-doc style of `[slug]/page.tsx:5-19` (requirement ids, decision ids, why the miss never reaches the page: proxy decides first).
- Photo links: `<Link href={photoHref(v.slug)} data-photo-id={v.slug}>` (`data-photo-id` is read by `LightboxDialog` `restoreFocus`, RESEARCH Code Examples). Ascending-altitude order = `buildWaypoints` order.
- Print the rights line `© {formatYearRange(years)} Tim Lui, all rights reserved` (pattern of `view-model.ts:430`) so JSON-LD `copyrightNotice` copies it exactly (Pitfall 7).
- JSON-LD block: see Shared Pattern "JSON-LD script". Executor loads `ui-ux-pro-max` (memory) for the stand-in markup.
- Full production shape: RESEARCH "Code Examples / The region stand-in page".

### `app/(site)/photos/regions/[region]/opengraph-image.tsx` (metadata route, file-I/O)

**Analog:** `app/(site)/photos/[slug]/opengraph-image.tsx` lines 1-69. Copy the header doc's "No generateStaticParams or dynamicParams here (12-14 deviation)" paragraph (lines 29-36) verbatim in spirit.

```tsx
// lines 39-68
type Params = { slug: string };
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateImageMetadata({ params }: { params: Params }) {
  const view = photoBySlug(params.slug);
  if (!view) return [];
  return [{ id: 'card', alt: `${view.title}, a photograph by ${site.name}. ${view.shortPlace}, ${view.altitudeLabel}`, size, contentType }];
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const view = photoBySlug((await params).slug);
  if (!view) notFound();
  const [fonts, contour, photo] = await Promise.all([ogFonts(), contourDataUrl(), ogPhotoImage(view.id)]);
  return new ImageResponse(<OgFrame variant="photo" contour={contour} view={view} photo={photo} />, { ...OG_SIZE, fonts });
}
```
- Region version: `params.region`, cover from `regions.json` `cover` (D-13), `contourDataUrl(plates[region.plate].assets.contours.hero)`, `<OgFrame variant="region" …>`. Note: `generateImageMetadata` gets plain `params`, the default export gets a Promise (Next 16; cite `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md`).
- **DO NOT edit** the photo card file: its bytes form the v2.0 `og:image ?hash` (RESEARCH Anti-patterns).

### `app/(site)/photos/@modal/regions/[region]/page.tsx` (slot page, null)

**Analog:** `app/(site)/photos/@modal/default.tsx` (lines 1-9):
```tsx
/** …doc explaining why… */
export default function ModalDefault() {
  return null;
}
```
- Name it `ModalAtRegion`; doc cites `parallel-routes.md:485` ("match the slot to a route that returns `null` to close the modal") and the spike's stuck-modal evidence. Explicit page, not `[...catchAll]`.

### `app/(site)/photos/[slug]/page.tsx` and `@modal/(.)[slug]/page.tsx` (modified)

- `[slug]/page.tsx:25-27`: `generateStaticParams` over `publishedSlugs`; line 39 `photos={photoViews}` -> `photos={viewerPhotos(view)}` and pass `back` for non-light-table photos (D-09). Add ImageObject JSON-LD here only.
- `@modal/(.)[slug]/page.tsx:36`: `photos={photoViews}` -> `viewerPhotos(view)`. No JSON-LD, no back link. Update the "Only the four known slugs" doc line (17-18).

### `lib/photos/routes.ts` (URL builder)

**Analog:** itself, lines 18-36.
```ts
export const photoHref = (slug: string): `/photos/${string}` => `/photos/${slug}`;
export const photoRouteSlugs: readonly string[] = /* @__PURE__ */ lightTableIds.map(
  (id) => editorial[id].slug
);
```
- Add `export const regionHref = (id: string): \`/photos/regions/${string}\` => \`/photos/regions/${id}\`;` (function only).
- `photoRouteSlugs = /* @__PURE__ */ Object.values(editorial).map((e) => e.slug)` (keep annotation; test at photo-routes.test.ts pins it).
- **Never import `data/regions/regions.json` here** (+2,200 B client JS, measured). Update header doc lines 9-13.

### `lib/photos/region-ids.ts` (NEW, proxy-only)

**Analog:** `photoRouteSlugs` above for shape and doc rationale. Body: `import registry from '@/data/regions/regions.json'; export const regionRouteIds: readonly string[] = registry.regions.map((r) => r.id);` Doc must say "imported only by proxy.ts"; enforced by adding `regions.json` to `SERVER_ONLY_MODULES`.

### `lib/regions.ts` (NEW, server-only model)

**Analog:** `lib/photos/view-model.ts` lines 448-456:
```ts
export const photoViews: readonly PhotoView[] = buildPhotoViews();
export const photoSlugs: readonly string[] = photoViews.map((v) => v.slug);
export function photoBySlug(slug: string): PhotoView | undefined { … }
```
- Export `regionIds`, `regionById(id)`, `regionPhotoViews(id)` (from `publishedViews`, filtered by generated `region`), cover lookup. Parse with `Regions` from `data/schemas/region.ts`. Never imported by a `'use client'` file (client-graph test).

### `lib/photos/view-model.ts` (model)

**Analog:** itself. `buildPhotoViews(input = lightTableInput())` (line 407), `photoViews` (448), `photoSlugs` (451), `photoBySlug` (454), `rights` (430), `DECIMALS` (140), `formatCoordinates(position, DECIMALS[...])` (269).
- Add `publishedViews = buildPhotoViews({ photos, editorial, imageManifest })`, `publishedSlugs`, `viewerPhotos(view)` (four for light table, `[view]` otherwise). `photoBySlug` = light-table first, then published (keeps v2.0 OG PNGs byte-identical). Do NOT redefine `photoSlugs` (Pitfall 5).

### `lib/home-format.ts` (D-19 + IN-01)

**Analog:** lines 44-48 and 75-80:
```ts
function fixedDecimals(v: number, d: 2 | 3 | 4): string {
  const [mantissa, exponent] = Math.abs(v).toExponential().split('e');
  const scaled = Math.round(Number(`${mantissa}e${Number(exponent) + d}`));
  return (scaled / 10 ** d).toFixed(d);
}
export function formatCoordinates({ lat, lon }: { lat: number; lon: number }, decimals: 2 | 3 | 4 = 4): string { … }
```
- Add signed `roundedCoordinate(v, precision)`; change `formatCoordinates` to take `{lat, lon, precision}` with no default. Reuse `formatYearRange` (104-109) and `formatMetreRange` (124) as-is.

### `lib/photos/stepping.ts` + `components/photos/LightboxDialog.tsx` (D-24)

**Canonical:** `lib/photos/stepping.ts:22-40`
```ts
export const PHOTO_PATH = /^\/photos\/([^/?#]+)$/;
export function slugFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = PHOTO_PATH.exec(pathname);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return null; }
}
```
**Duplicate to delete:** `LightboxDialog.tsx:82` `const PHOTO_PATH = /^\/photos\/([^/]+)$/;` and `:93-96` `slugOf` (unguarded decode); callers at `:220, :229, :317` switch to `slugFromPath`. Add a `RESERVED = new Set(['regions'])` check after decode.

### `lib/dom/editable.ts` (NEW) / `PhotoViewer.tsx` / `ZoomStage.tsx`

**Source to move:** `components/photos/PhotoViewer.tsx:171-176` (identical body in `ZoomStage.tsx:98-103`):
```ts
function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}
```

### `components/photos/PhotoViewer.tsx` (D-08 / D-09)

**Analog:** itself, lines 495-546. Two hard-coded back links (`<Link href="/photos" …>All photographs</Link>` at ~502 and ~522) and the stepping group (Previous button, `data-photo-counter` `{index + 1} / {photos.length}`, Next button). Escape at ~281 `router.push('/photos')`.
- Add optional serialisable `back?: { href: string; label: string }` prop, default `/photos` + "All photographs"; wrap the two step buttons + counter in `photos.length > 1`. v2.0 four get no `back` and length 4, so pixels unchanged (D-10).
- Note `router.push('/photos')` and `href="/photos"` are in the photo-routes GOOD list; a `back.href` from `regionHref` is fine.

### `lib/og/template.tsx`

**Analog:** itself. `contourDataUrl()` at line 528-529:
```ts
export async function contourDataUrl(): Promise<string> {
  const svg = await readFile(join(process.cwd(), 'public', terrain.assets.contours.hero), 'utf8');
```
-> `contourDataUrl(src: string = terrain.assets.contours.hero)`. `OgFrame` props union at 404-420, dispatch at 436-457: add `variant: 'region'` beside `'photo'` (437) reusing `photoSlot`/`plate`; existing `ogPhotoImage` (reads `public/` JPEG at 274) for the cover.

### `lib/saved-pages.ts` (EDGE-03)

**Analog:** itself, lines 26-48.
```ts
label?: 'Photograph' | 'Project';
export function savedPageCatalog({ nav, photos, projects }: SavedPageSource): readonly SavedPageRow[] {
  return [
    ...nav.map(({ label, href }) => ({ href, title: label })),
    ...photos.map(({ slug, title }) => ({ href: photoHref(slug), title, label: 'Photograph' as const })),
    ...projects.map(({ slug, name }) => ({ href: `/projects/${slug}`, title: name, label: 'Project' as const })),
  ];
}
```
- Add `regions: readonly { id: string; name: string }[]`, `'Region'` to the label union, insert after nav with `regionHref(id)`. `/offline/page.tsx:28` passes `photos: publishedViews` and region `{id,name}` pairs (computed server-side; island gets props only).

### `app/sitemap.ts`

**Analog:** itself (lines 16-22):
```ts
...photoSlugs.map((slug) => ({ url: `${site.url}${photoHref(slug)}` })),
```
Order: nav -> regions (`regionHref`, registry order) -> published photos (by region, ascending altitude) -> projects. Keep "no lastModified" rule (doc lines 10-13).

### `proxy.ts`

**Analog:** itself, lines 13-34 (`KNOWN`, `DETAIL_PATH`, `NEUTRAL_SLUG`) and 188-221 (`proxy()`):
```ts
const match = DETAIL_PATH.exec(request.nextUrl.pathname);
const section = match?.[1] as EdgeSection | undefined;
const miss = section !== undefined && match !== null && !KNOWN[section].has(match[2]);
if (miss && match[2] !== NEUTRAL_SLUG && canFetchNeutral(new URL(request.url).hostname)) {
  const neutral = await neutral404(request, section);
  if (neutral) return neutral;
}
… if (miss) { requestHeaders.set(EDGE_SECTION_HEADER, section); response = NextResponse.rewrite(new URL(MISSING_PATH, request.url), …) }
```
Replace with `REGION_PATH` + `missedSection()` exactly as RESEARCH Pattern 2 (proven code). Import `regionRouteIds` from `@/lib/photos/region-ids`. `EdgeSection` stays `'photos' | 'projects'`. Doc-comment style: one `/** … */` per constant explaining the T-12-03 reason.

### `data/schemas/region.ts` + `data/regions/regions.json` (D-13)

**Analog:** `Region` strictObject (lines 56-65) and `Regions.refine` (69-77). Add `cover: z.string()` (photo-id regex as photo.ts duplicates it; schema files import only zod, header lines 11-13). The "cover belongs to this region" check needs photo-map, so put it where `photos:build` / `data/__tests__/photo-map.test.ts` already cross-check plates (doc lines 26-27 pattern).

### `scripts/photos/build-photo-data.mjs` + `data/schemas/photo.ts` (D-26)

**Analog:** `build-photo-data.mjs:145` `const TIME_ZONE = 'Europe/Zurich';`, `:163-165` formatter, `:191` `zurichOffset`, `:202` error text, `:231` return. Schema `photo.ts:242` `timeZone: z.literal('Europe/Zurich')`.
- Country->zone map, `zoneOffset(id, local, gpsUtc, zone)`, interpolate zone in messages. CH text must stay byte-identical for `scripts/guards/selftest.mjs:3463` (`'img-0605: EXIF OffsetTimeOriginal +01:00 is not the Europe/Zurich offset +02:00'`). Verify `git diff --stat data/generated/` = `photos.ts` only.

## Test Pattern Assignments

### `lib/__tests__/json-ld.test.ts` (NEW, Wave 0)

**Analog:** `lib/__tests__/photo-routes.test.ts` lines 1-40: `@jest-environment node` docblock, a doc comment listing what each describe proves, `it.each(list.map((x) => [x]))` per item, data-derived expectations (never hand-typed values), explanatory `throw new Error(...)` before `expect` for actionable failures (lines 43-52).
```ts
/**
 * @jest-environment node
 */
import { photoHref, photoRouteSlugs } from '@/lib/photos/routes';
describe('photoHref (D-17)', () => {
  it.each(photoRouteSlugs.map((slug) => [slug]))('builds /photos/%s', (slug) => {
    expect(photoHref(slug)).toBe('/photos/' + slug);
  });
});
```
Cases: each block `JSON.parse`s; no raw `<` in `jsonLdHtml` output (use a `<script>` name fixture like the spike); recursive walk finds no `license`/`acquireLicensePage`; lat/lon decimals == `DECIMALS[precision]` and equal the strip text; `copyrightNotice === view.rights`; `creditText === creator.name === site.name`; Person has no email/location.

### `e2e/photos-region.spec.ts` (NEW, Wave 0)

**Analog:** `e2e/photos-lightbox.spec.ts` lines 1-70: imports from `@/lib/...` and `./helpers/*`, `test.describe.configure({ mode: 'default' })` with the 12-22 rationale comment, data-derived loop over views, role-based assertions:
```ts
const response = await page.goto(`/photos/${view.slug}`);
expect(response?.status()).toBe(200);
await expect(page.getByRole('main')).toHaveCount(1);
await expect(page.getByRole('dialog')).toHaveCount(0);
await expect(main.getByRole('link', { name: 'All photographs', exact: true })).toHaveAttribute('href', '/photos');
await expect(page).toHaveTitle(`${view.title} · Tim Lui`);
```
Plus `e2e/not-found.spec.ts` lines 51-84 for the token-echo check (`MISSES` array, `expectServerRendered404`, `expect(body).not.toContain(token)`) — extend `MISSES` with `/photos/regions/${token}` and `/photos/regions` there rather than duplicating. Soft-nav marker: `window.__spikeMark` survives (RESEARCH spike driver). Lightbox->region uses history (Open Question 4). Use literal `'/photos/regions/'` strings in tests (contract checked independently of `regionHref`, as photo-routes does).

### `lib/__tests__/photo-routes.test.ts` (source scan)

**Analog:** itself lines 80-140: `HAND_BUILT` regexes, `walk()`, `SOURCES` over app/components/lib + proxy.ts, `EXEMPT = 'lib/photos/routes.ts'`, BAD/GOOD self-test arrays. Add `REGION_HAND_BUILT` (RESEARCH Code Examples) with BAD/GOOD entries; GOOD must include `const REGION_PATH = /^\/photos\/regions\/([^/]+)$/;`. Rewrite the "four of them" pin (lines 54-57) to "equals `publishedSlugs` as a set, 11, no reserved word". Add D-03 collision test (region ids ∩ slugs ∩ `{'regions','_','opengraph-image'}` = ∅). Note: `lib/photos/region-ids.ts` must not trip the scan.

### `lib/__tests__/client-graph.test.ts`

Line ~53: `export const SERVER_ONLY_MODULES = ['data/generated/overview.ts'] as const;` -> add `'data/regions/regions.json'` (with a doc line citing the +2,200 B spike measurement).

### `lib/__tests__/proxy.test.ts`

**Analog:** itself lines 25-70: `run(url, headers)` -> `proxy(new NextRequest(url, { headers }))`, `fetchMock` via `jest.spyOn(globalThis, 'fetch')`, rewrites read from `x-middleware-rewrite`. Add: unknown region, known region passes, bare parent, `/photos/regions/<known>/opengraph-image-…` passes, wrong case.

### `lib/__tests__/saved-pages.test.ts`

**Analog:** itself lines 1-40 (catalog order `toEqual` built from data; label loop). Add `regions` input, `/photos/regions/` literal paths, `'Region'` label branch, unknown region URL drops.

### e2e route/SEO/audit edits

- `e2e/routes.ts:27-38`: add `['/photos/regions/zermatt', 'Photographs']` to `ROUTES` (named, like `PHOTO_TEMPLATE_SLUG` lines 18-24 with a throw guard). `SITEMAP_PATHS`/`AUDIT_SWEEP` pick up the rest with no edit (doc lines 43-45, 57-58 already say so).
- `e2e/seo.spec.ts:25-30` `expectedSitemap`: insert regions with literal `` `${site.url}/photos/regions/${id}` `` and switch photos to `publishedSlugs`.
- `e2e/audit.spec.ts:184` `test.setTimeout(180000)` -> scale with `AUDIT_SWEEP.length` (Pitfall 3); keep one test (ratchet comment lines 175-176).
- `scripts/guards/test-count.mjs` rejects `.skip(` — rewrite pins, never skip.

## Shared Patterns

### JSON-LD script (SEO-04)
**Source:** `node_modules/next/dist/docs/01-app/02-guides/json-ld.md` (lines 9-36); no in-repo analog.
**Apply to:** `(site)/layout.tsx`, `photos/[slug]/page.tsx`, `photos/regions/[region]/page.tsx`, `projects/[slug]/page.tsx`. Never `@modal/*`.
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(ld) }} />
// lib/json-ld.ts
import type { Graph, ImageObject, WithContext } from 'schema-dts';
export function jsonLdHtml(data: WithContext<ImageObject> | Graph): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
```
No nonce. `import type` only from `schema-dts` (installed after D-21 checkpoint via bundled npm).

### One URL builder + source scan
**Source:** `lib/photos/routes.ts` + `lib/__tests__/photo-routes.test.ts`. **Apply to:** every region/photo URL (links, sitemap, canonical, saved pages, JSON-LD `@id`/`url`, back link).

### Neutral 404 decided in the proxy
**Source:** `proxy.ts:13-34, 188-221`. **Apply to:** region misses; never `notFound()` alone (empty `__next_error__` shell).

### Static params, no dynamic params
**Source:** `app/(site)/photos/[slug]/page.tsx:23-27`, `projects/[slug]/page.tsx:33-37`. **Apply to:** region page. **Exception:** OG routes use `generateImageMetadata` only.

### Server-only data boundary
**Source:** `lib/__tests__/client-graph.test.ts` `FORBIDDEN_IN_CLIENT_GRAPH` / `SERVER_ONLY_MODULES`; `lib/saved-pages.ts` header (props-only catalog). **Apply to:** `regions.json`, `plates.ts`, `lib/regions.ts` — read on the server, pass serialisable props (e.g. PhotoViewer `back`) to client components.

### Doc-comment convention
Every new module/route opens with a `/** … */` block naming requirement ids and decision ids and the *why* (see any analog above). Keep it.

### Pixel neutrality / budget
Every commit: `node scripts/ci/check-snapshot-commit.mjs --none`; client JS ≤ 1,855,781 B (16-01 byte-sum one-liner after `rm -rf .next/static && npm run build`).

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `lib/json-ld.ts` | utility | transform | No structured data exists yet; use the Next guide + RESEARCH Pattern 6 table |
| `lib/__tests__/json-ld.test.ts` | test | transform | Structure from `photo-routes.test.ts`, content from RESEARCH Pattern 7 |

## Metadata

**Analog search scope:** `app/(site)/**`, `app/sitemap.ts`, `lib/**`, `components/photos/**`, `proxy.ts`, `data/schemas/**`, `scripts/photos/**`, `e2e/**`, `lib/__tests__/**`, `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`
**Files scanned:** ~35
**Pattern extraction date:** 2026-11-23
