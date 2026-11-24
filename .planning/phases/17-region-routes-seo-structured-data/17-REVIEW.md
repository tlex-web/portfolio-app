---
phase: 17-region-routes-seo-structured-data
reviewed: 2026-11-24T02:27:30Z
depth: standard
files_reviewed: 67
files_reviewed_list:
  - .gitattributes
  - .github/workflows/ci.yml
  - app/(site)/layout.tsx
  - app/(site)/offline/page.tsx
  - app/(site)/photos/@modal/(.)[slug]/page.tsx
  - app/(site)/photos/@modal/regions/[region]/page.tsx
  - app/(site)/photos/[slug]/page.tsx
  - app/(site)/photos/regions/[region]/opengraph-image.tsx
  - app/(site)/photos/regions/[region]/page.tsx
  - app/(site)/projects/[slug]/page.tsx
  - app/sitemap.ts
  - components/photos/LightboxDialog.tsx
  - components/photos/PhotoViewer.tsx
  - components/photos/ZoomStage.tsx
  - components/photos/__tests__/photo-viewer.test.tsx
  - components/site/__tests__/SavedPages.test.tsx
  - data/__tests__/overview.test.ts
  - data/__tests__/photo-map.test.ts
  - data/__tests__/photos.test.ts
  - data/generated/overview.ts
  - data/generated/photos.ts
  - data/regions/regions.json
  - data/schemas/photo.ts
  - data/schemas/region.ts
  - e2e/audit.spec.ts
  - e2e/not-found.spec.ts
  - e2e/offline.spec.ts
  - e2e/og.spec.ts
  - e2e/photos-region.spec.ts
  - e2e/routes.ts
  - e2e/seo.spec.ts
  - lib/__tests__/audit-routes.test.ts
  - lib/__tests__/client-graph.test.ts
  - lib/__tests__/home-format.test.ts
  - lib/__tests__/home-photos.test.ts
  - lib/__tests__/json-ld.test.ts
  - lib/__tests__/photo-routes.test.ts
  - lib/__tests__/photos-stepping.test.ts
  - lib/__tests__/photos-view-model.test.ts
  - lib/__tests__/proxy.test.ts
  - lib/__tests__/region-series.test.ts
  - lib/__tests__/regions.test.ts
  - lib/__tests__/saved-pages.test.ts
  - lib/ascent/home-photos.ts
  - lib/dom/editable.ts
  - lib/home-format.ts
  - lib/json-ld.ts
  - lib/og/__tests__/routes.test.ts
  - lib/og/template.tsx
  - lib/photos/region-ids.ts
  - lib/photos/routes.ts
  - lib/photos/stepping.ts
  - lib/photos/view-model.ts
  - lib/regions.ts
  - lib/saved-pages.ts
  - package-lock.json
  - package.json
  - proxy.ts
  - scripts/README.md
  - scripts/guards/selftest.mjs
  - scripts/photos/build-photo-data.mjs
  - scripts/terrain/build-terrain.mjs
  - scripts/terrain/fetch-bev.mjs
  - scripts/terrain/fetch-dem.mjs
  - scripts/terrain/fetch-overview.mjs
  - scripts/terrain/fetch-retry.mjs
  - scripts/terrain/plate-args.mjs
findings:
  critical: 0
  warning: 2
  info: 9
  total: 11
  necessity: 2
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-11-24T02:27:30Z
**Depth:** standard
**Files Reviewed:** 67
**Status:** issues_found

## Summary

I reviewed the phase diff (`285b6d5..HEAD`) in context. For the large files (package-lock.json, data/generated/*.ts, scripts/guards/selftest.mjs, the e2e specs) I read the diff hunks only. I checked the route, proxy and metadata code against the bundled Next 16 docs. `generateImageMetadata` takes plain `params`, and the image function takes a Promise, as `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-image-metadata.md:17-273` says. The `@modal/regions/[region]` null page follows the parallel-routes guidance it cites. `pageMetadata` leaves `openGraph` alone, so the file-based region card is not shadowed.

I found no blocker. Several parts of the core logic hold up when traced:

- **Proxy:** `missedSection` cannot recurse. An unknown region fetches `/photos/_`, which takes the DETAIL path with `neutral: false`. The OG card path (four segments) passes through.
- **Registry:** `lib/regions.ts` is validated at module load, including the cover check.
- **Photo routes:** `viewerPhotos`, `photoBySlug` and `backFor` keep the four v2.0 pages and their props unchanged.
- **Capture zones:** the zone-per-country change in `build-photo-data.mjs` keeps `record` in scope, and the `PhotoFacts` refine ties `timeZone` to `country`.
- **Strip band:** the IN-06 check in `build-terrain.mjs` repeats `stripBbox`'s arithmetic exactly (`lib/geo.ts:81-92`).
- **Shared helpers:** `plate-args.mjs` and `fetch-retry.mjs` keep the old error texts.
- **CI matrix:** the matrix passes the engine through `env` only, and nothing in `scripts/ci` looks up the old single "E2E Tests" check name.

There are two warnings:

- **WR-01:** the site layout now loads the whole region and photo model on every content page, through `lib/json-ld.ts`.
- **WR-02:** one e2e negative test can pass without testing anything.

The rest are Info items. Two of them are necessity findings (`necessity-review.md` was read).

Privacy (Phase 16 D-25): this report quotes no coordinate digits. Positions are referred to by file:line only.

## Warnings

### WR-01: The site-wide layout now loads the region and photo model on every content page

**File:** `app/(site)/layout.tsx:2`, `lib/json-ld.ts:20-26`
**Issue:** The `(site)` layout imports `jsonLdHtml` and `siteGraph` from `lib/json-ld.ts`. That module also holds the photo and region blocks, so it imports `lib/regions` (lines 20-26), `data/generated/photos`, `data/generated/image-manifest` and, through `lib/regions`, `lib/photos/view-model`. `lib/regions.ts` does real work at module load:

- `Regions.parse` (`lib/regions.ts:37`);
- `buildPhotoViews(seriesInput(id))` for every region (`lib/regions.ts:51-53`), where `seriesInput` throws for a registry region with no photo (`lib/photos/view-model.ts:363-366`);
- the cover check (`lib/regions.ts:73-84`).

`siteGraph()` needs none of this. So a fault in region or photo data now fails every page under `(site)`, including `/contact`, `/roadmap`, `/projects/*` and `/offline`, not just the photo routes. One example is Phase 18 adding a registry region before its photos. The fault cannot be traced back to the layout from the error. This is an accidental dependency: the module's own doc treats the site graph and the region gallery as separate concerns.
**Fix:** Move the site-wide pieces into a module that does not import regions, and keep the photo, region and project builders in their own module:

```ts
// lib/json-ld/site.ts: no lib/regions, no generated photo data
export const PERSON_ID = `${site.url}/#person`;
export const WEBSITE_ID = `${site.url}/#website`;
export function personRef(): Person { /* … */ }
export function jsonLdHtml(data: Graph | WithContext<Thing>): string { /* … */ }
export function siteRights(): string { /* … */ }
export function siteGraph(): Graph { /* … */ }

// lib/json-ld/content.ts: photoImageLd, regionGalleryLd, projectLd (imports ./site and lib/regions)
```

Then `app/(site)/layout.tsx` imports only `lib/json-ld/site`.

### WR-02: The swipe-and-arrows negative e2e test can pass without testing anything

**File:** `e2e/photos-region.spec.ts:291-307`
**Issue:** The test sends `pointerdown`, `pointermove` and `pointerup`, then ArrowRight and ArrowLeft, and right away asserts `toHaveURL(sameSlug)`, an unchanged `page.title()` and a status line that does not match `/Photo \d+ of/`. Web-first assertions retry only until they pass. A URL, title or status that is still unchanged at the first poll passes at once. A regression that steps after a frame or a View Transition, which is how the viewer steps (`replaceState` inside the step callback, plus a status update after the commit), would happen after the assertions have already passed. The test is reliable only because the step code happens to run synchronously today. The component test (`components/photos/__tests__/photo-viewer.test.tsx`, "Edge PHOTO-05/empty") covers the logic with a positive control. This e2e row has no such control.
**Fix:** Give the e2e row a positive control or a settle point before the negative checks. For example, record `history.length` and the status text, wait two animation frames, then assert:

```ts
const before = await page.evaluate(() => ({ len: history.length, url: location.href }));
await page.keyboard.press('ArrowRight');
await page.keyboard.press('ArrowLeft');
await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
expect(await page.evaluate(() => ({ len: history.length, url: location.href }))).toEqual(before);
```

Better still, run the same presses on a light-table photo page in the same test and assert that the URL does change there. That proves the keys reach the viewer.

## Info

### IN-01: The region card's plate lookup bypasses type checking with a cast

**File:** `app/(site)/photos/regions/[region]/opengraph-image.tsx:72`
**Issue:** `plates[region.plate as keyof typeof plates]` turns the zod `string` into a key by assertion. Today the plate is validated elsewhere (photos:build `resolveMembership` and the generated `plates.ts` freshness check). If a region named a plate missing from the generated module, though, the card would fail on the first request with an opaque `Cannot read properties of undefined (reading 'assets')`. It would not fail at build. The cover gets a load-time check with a clear message (`lib/regions.ts:73-84`). The plate gets none.
**Fix:** Resolve each region's contour source at load in `lib/regions.ts`, the same way as `COVERS`, and throw with the region id and the registry file named. Export `regionContourSrc(id)` and drop the cast from the route.

### IN-02: Approximate positions are emitted as plain GeoCoordinates

**File:** `lib/json-ld.ts:135-145`
**Issue:** The strip qualifies a hand-placed or coarse position with `≈`, a radius and `(approx.)` (`lib/photos/view-model.ts:262-275`). `photoImageLd` emits the same digits as plain `GeoCoordinates` with no qualifier. Five generated photos carry `"approximate": true` with a radius (`data/generated/photos.ts:22`, `:66`, `:322`, `:363`, `:407`). D-19 only covers decimal counts, so this follows the decision, but the markup says more than the page does. The module claims "the block is never finer than the page".
**Fix:** Ask Tim whether approximate positions should drop `geo`, keeping only `Place.name`, or keep it. Then pin the choice in `lib/__tests__/json-ld.test.ts`.

### IN-03: File tracing for the deployed region OG card is still unverified

**File:** `app/(site)/photos/regions/[region]/opengraph-image.tsx:50-53`; `next.config.ts` (no `outputFileTracingIncludes`)
**Issue:** The plate SVG is read through a variable path (17-RESEARCH Pitfall 6). 17-15 could not reach the protected preview and handed the check to /gsd-verify-work. The same read pattern already works for the photo card's JPEGs and the default contour, so the risk is low. Still, no config pins the plate SVGs into the function bundle.
**Fix:** Close the verify-work item with one deployed fetch of `/photos/regions/<id>/opengraph-image-<hash>/card`, for example with `vercel curl`. If it fails, add `outputFileTracingIncludes` for `public/terrain/**/*.svg` on that route.

### IN-04: The site rights line is defined twice

**File:** `lib/json-ld.ts:179-181`; `components/site/SiteFooter.tsx:28`, `:66`
**Issue:** `siteRights()` rebuilds the footer's `© {year} {site.name}. All rights reserved.` independently. Only a Chromium-only e2e test (`e2e/seo.spec.ts`, "copyright notices equal the printed rights text") catches drift between them.
**Fix:** Have `SiteFooter` render `siteRights()` from a small pure module (it is a server component), so both read one definition.

### IN-05: Generality without instantiation: `caseStudyRights` ignores its slug

**File:** `lib/json-ld.ts:248-250`
**Category:** necessity
**Issue:** The function returns `siteRights()` for every project and `_slug` is never read. Its own doc says every project carries the same line under option (a). The per-project signature serves a variation that does not exist.
**Fix:** Call `siteRights()` directly in `projectLd`. Add a per-project function if a project ever gets its own rights text. Removing this is a scope call for Tim.

### IN-06: Impossible-state guard: `withRetry`'s argument validation

**File:** `scripts/terrain/fetch-retry.mjs:33-38`
**Category:** necessity
**Issue:** Both production callers pass module constants (`ATTEMPTS = 5` and `BACKOFF_MS` in `fetch-bev.mjs` and `fetch-overview.mjs`), and the selftest passes literals. A non-integer or negative `attempts` or `backoffMs` cannot reach the helper. Whether the guard is worth keeping as a library boundary is a judgment call.
**Fix:** Keep it if the helper is meant to be general. Otherwise drop the two `TypeError` branches.

### IN-07: The `TimeZone` enum repeats the `ZONE_BY_COUNTRY` values by hand

**File:** `data/schemas/photo.ts:172-193`
**Issue:** The zone list is written twice. `satisfies Record<Country, string>` does not tie the map to the enum, so adding a country to the map with a new zone makes every capture in that zone fail `Capture` parsing until someone also edits the enum. The failure is loud but avoidable.
**Fix:** Derive the enum from the map: `z.enum(Object.values(ZONE_BY_COUNTRY) as [ (typeof ZONE_BY_COUNTRY)[Country], ...(typeof ZONE_BY_COUNTRY)[Country][] ])`, or a `const` tuple that both read.

### IN-08: The `stepping.ts` doc describes a region index that does not exist

**File:** `lib/photos/stepping.ts:24-30`
**Issue:** The comment says "the region index and region pages live at /photos/regions(/<id>)". There is no region index. `/photos/regions` is a photos 404 (`proxy.ts:28-34`, `e2e/not-found.spec.ts`), and Phase 18 has not added one.
**Fix:** Change the comment to say that the bare `/photos/regions` is a 404 and only region pages live under it.

### IN-09: Fact texts are React keys but the schema does not keep them unique

**File:** `app/(site)/photos/regions/[region]/page.tsx:98`; `data/schemas/region.ts:79-82`
**Issue:** `key={fact.text}` assumes a region's fact texts are unique, but the `facts` array has no uniqueness refine. A repeated fact would give a duplicate-key warning and could merge the two rows.
**Fix:** Add a uniqueness refine on `facts[].text` in `Region`, or key by index plus text.

---

_Reviewed: 2026-11-24T02:27:30Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
