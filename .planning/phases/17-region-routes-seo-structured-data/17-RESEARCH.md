# Phase 17: Region Routes, SEO & Structured Data - Research

**Researched:** 2026-11-23
**Domain:** Next 16.4.5 App Router routing (static sibling next to an intercepted dynamic segment), proxy 404 logic, metadata/OG image routes, JSON-LD, offline catalog, a photo build-script fix
**Confidence:** HIGH. The routing questions were measured in a live spike under both bundlers; the JSON-LD rules come from the bundled Next guide and Google's docs.

## Spike Verdict

**PASS: `/photos/regions/<id>` meets every D-01 check under both `next dev --webpack` and `next build` + `next start` (Turbopack), Next 16.4.5.** Under D-02, planning goes ahead with `/photos/regions/<id>` and does not ask Tim again.

The path works only with two additions. The spike proved both are required:
1. **`app/(site)/photos/@modal/regions/[region]/page.tsx` returning `null`.** Without it, a soft navigation from an open lightbox to a region page leaves the modal stuck. This was measured; see "Evidence without the null slot page" below.
2. **A three-segment region branch in `proxy.ts`.** Without it, an unknown `/photos/regions/<x>` gets a plain root 404 that echoes `<x>` in the flight data (`"c":["","photos","regions","<x>"]`, measured on the unmodified build) and offers no "All photographs" link.

Two red cells in the raw logs are **not** D-01 failures. Both reproduce on the current `/photos/<slug>` and `/projects/<slug>` routes, so they are existing behaviour, not something the region path brings:
- **Paths with 4+ segments under a known region** (`/photos/regions/zermatt/<x>`) echo `<x>`. This is the same as today's `/photos/matterhorn-from-zermatt/<x>`, `/projects/box/<x>` and `/roadmap/<x>`, all measured: a generic 404 whose flight data names the path. `DETAIL_PATH` passes deeper paths through on purpose so the OG card routes keep working.
- **Dev only:** the hydrated 404 carries the token in Speed Insights' debug script `data-route` under `next dev`. The same happens for `/photos/<token>` in dev, and it does not happen in the production build, where the hydrated check passed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Region path
- **D-01: The spike tests `/photos/regions/<id>` first.** This is a static `regions` segment beside `photos/[slug]`, inside the `photos` layout and its `@modal` slot.
  - **Why it is preferred:**
    - Photo links clicked on a region page open the existing lightbox, because the intercept covers every page under `/photos` (research F7).
    - The nav marks "Photographs" current with no change (`isCurrentPath` prefix match, `components/site/SiteNav.tsx:90-93`).
    - One modal slot serves both.
  - **Run under both bundlers:** `next dev` (webpack) and `next build` + `next start` (Turbopack), Next 16.4.5.
  - **Spike checks:**
    - a hard load and a refresh of a region page;
    - a soft navigation from `/photos` to a region page, which must not be intercepted as a photo;
    - a soft navigation from a region page to a photo, which must open the lightbox; then Back;
    - a soft navigation from an open lightbox to a region page, which must leave no stuck modal;
    - an unknown region and the bare parent path, which must give the designed 404 (D-04, D-05);
    - how the proxy's two-segment `DETAIL_PATH` and `dynamicParams` treat the new path.
  - **Reversibility:** one-way. It becomes a public, indexed URL with a sitemap entry and OG cards, so undoing it needs redirects and a canonical plan.
- **D-02: The spike stops for Tim only if `/photos/regions/<id>` fails.**
  - If every D-01 check passes under both bundlers, planning proceeds with it and does not ask again.
  - On any failure, stop with the evidence and the fallbacks:
    - `/photos/series/<id>`: the same mechanics with a different word, so it likely fails the same way;
    - top-level `/regions/<id>`: never near the photo intercept, but photo links need a second intercept or become full page loads, and "Photographs" needs explicit current-state mapping.
  - This satisfies the roadmap's input "the region path, chosen after the spike".
- **D-03: The URL segment is the registry id as it stands (`zermatt`, `ortler`, `saalfelden`).** No separate slug field.
  - A test fails if a region id equals any photo slug or a reserved word: `regions`, the proxy's neutral slug `_`, `opengraph-image`, and any other static segment under `/photos`.
  - **Reversibility:** one-way once indexed. Renaming an id changes a public URL (16-CONTEXT D-13 reversibility note).
- **D-04: The bare parent path (`/photos/regions`) answers the designed 404,** the same neutral 404 as an unknown photo slug. There is no redirect and no index page; `/photos` becomes the overview in Phase 18.
- **D-05: An unknown region answers the designed 404 the way an unknown photo slug does** (success criterion 2).
  - The typed id is never echoed into the page or flight data (the T-12-03 pattern behind `proxy.ts` `KNOWN` / `NEUTRAL_SLUG`).
  - A `notFound()` inside the page alone gives the empty `__next_error__` shell (12-RESEARCH Pitfall 1), so the region miss needs the proxy path or an equivalent the spike proves.
- **D-06: `regionHref(id)` joins `photoHref` in `lib/photos/routes.ts`** (15 D-19). Every region URL comes from it, including links, the sitemap, the canonical, saved pages and JSON-LD `url`/`@id`.
  - The `photo-routes` source scan extends to hand-built region paths.
  - Any top-level list in that module keeps the `/* @__PURE__ */` annotation, as `photoRouteSlugs` does (15-10).

#### New photo pages
- **D-07: All 11 photos get `/photos/<slug>` pages (PHOTO-05).**
  - The published-photo set drives:
    - `generateStaticParams`;
    - `photoRouteSlugs`, the proxy's known slugs;
    - the sitemap;
    - the saved-pages catalog;
    - the audit sweep;
    - the per-slug OG card.
  - `lightTableIds` in `data/light-table.ts` stays the four and drives only the `/photos` light table until Phase 18 (16 D-15).
  - The v2.0 four's pages and OG cards answer byte-for-byte as before (success criterion 1).
- **D-08: New photo pages have no Previous/Next yet.**
  - **New pages:** a new photo's page, and its lightbox when opened from a region page, hides the stepping controls and the counter.
  - **v2.0 pages:** the four keep stepping among themselves (`n / 4`), unchanged.
  - Phase 18 brings per-region stepping to every photo at once, so the stepping logic changes only once.
- **D-09: A new photo page's back link goes to its region page,** labelled with the region name and built with `regionHref`. The v2.0 four keep "All photographs" → `/photos`.
- **D-10: Phase 17 adds no screenshot baselines and changes none.**
  - Visual Regression must pass with no update, and `check-snapshot-commit --none` must hold on every phase commit.
  - New pages are covered by e2e, the production audit gate and metadata/JSON-LD tests. Phase 18 baselines the designed pages once.

#### Region page and OG card
- **D-11: The region page is a plain server-rendered stand-in in the existing shell:**
  - an h1 with the region name and country;
  - the region's facts from `data/regions/regions.json` (Tim-approved copy from 16-08 and 16-17);
  - its photos as text links (title, altitude, date) in ascending altitude order, each built with `photoHref`.

  It has no thumbnails, plate, map or rail (Phase 18 designs it), and no UI-SPEC is needed. It must pass the production audit gate (success criterion 2).
- **D-12: The region OG card uses the shared OG template's photo-style layout.**
  - **Subject slot:** the region's cover photo, from the image manifest's 1200 px JPEG derivative, as photo cards already do; never an original.
  - **Plate text:** region name, country, photo count and altitude range.
  - **Contour field:** the region's own plate hero contours. That is `matterhorn` for Zermatt, and `ortler` and `saalfelden` for the others.
  - The route must avoid the 12-14 `generateStaticParams` / `generateImageMetadata` collision documented in `app/(site)/photos/[slug]/opengraph-image.tsx`.
- **D-13: Tim picks each region's cover photo.**
  - `regions.json` gains a `cover` photo id per region, and the schema requires it to be one of that region's photos.
  - Asked at a decision checkpoint before the OG route is built. Phase 18 may reuse it for the region header.
- **D-14: Region titles, descriptions and OG alt text are drafted from the existing patterns and brought to Tim at one copy checkpoint during execution,** as in 16-08. The patterns are `{title} · Tim Lui` and Tim's `og.alt` template from 12-01. Approved text goes in verbatim.
- **D-15: Each region page has its own title, description, absolute canonical on `site.url`, OG card and sitemap entry,** and the sitemap lists exactly the canonical URLs (REGION-07, success criterion 3).

#### JSON-LD (SEO-04)
- **D-16: Scope per SEO-04:**
  - **Site-wide:** `Person` and `WebSite`.
  - **Photo pages:** `ImageObject`.
  - **Region pages:** an `ImageGallery` / `CollectionPage` whose `hasPart` refers to the photos.
  - **Case studies:** the projects.

  Every block has creator, `copyrightNotice` and `creditText`, and **no `license` property** (2026-11-12 decision).
  - **Rendering:** a native `<script type="application/ld+json">` in the page or layout, with `<` escaped, per `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`.
  - **Not in the intercepted `@modal` page:** crawlers do hard loads, and a second copy is noise.
  - **No CSP nonce workaround:** the audit gate checks the real CSP behaviour (research ARCHITECTURE anti-pattern 9).
- **D-17: `copyrightNotice` equals the page's own rights line exactly.**
  - **Photos:** `view.rights` in `lib/photos/view-model.ts`: "© {capture year} Tim Lui, all rights reserved".
  - **Region galleries and case studies:** the same pattern with their own year or year span. Use the existing `formatYearRange` (`lib/home-format.ts`) for a span.
  - The markup never disagrees with what the page prints.
- **D-18: `creditText` is "Tim Lui",** the same as `creator.name`.
- **D-19: `contentLocation` is a `Place` with its name plus `GeoCoordinates` at exactly the precision the page prints.**
  - That is 4dp, 3dp or 2dp, with the same rounding as the displayed coordinates (16 D-01). It is never finer.
  - A test fails if any JSON-LD coordinate has more decimals than its page shows.
  - Aerial photos use the position as shown, never a GPS altitude (16 D-03/D-04).
- **D-20: The site-wide `Person` has `name`, `jobTitle` (`site.role`) and `url` (`site.url`),** plus `sameAs` with GitHub and LinkedIn from `site.links`. No email and no home location appear in the markup.
- **D-21: The JSON-LD objects are typed with `schema-dts`, imported with `import type` only (0 runtime bytes).**
  - **Packages:** `schema-dts` 2.1.0, a devDependency (Apache-2.0, published by Google 2026-10-02, 1.0 MB unpacked, no install scripts). It pulls in `schema-dts-lib` 1.1.0 (15 KB, no deps); the research said "no deps", which is no longer true.
  - **Install:** exact pins, through the bundled npm (memory: global npm 11.6.1 rewrites lockfile metadata), only after Tim's package-verification checkpoint (the 16-09 pattern).
  - **Test:** a Jest test parses every emitted block and checks the `<` escaping, the D-19 precision rule and the absence of `license`.

#### Offline saved pages (EDGE-03)
- **D-22: The `lib/saved-pages.ts` catalog includes the region pages and all photo pages,** so the `/offline` `SavedPages` list shows any of them a visitor has opened. Region entries get a section label beside 'Photograph' and 'Project' (wording at Claude's discretion, see below).

#### Housekeeping carried into this phase
- **D-23: Fix the Phase 16 review info findings IN-01..IN-09.** Tim deferred them on 2026-11-23 ("Defer to Phase 17 (Recommended)"). Write each back into `16-REVIEW-DISPOSITION.md` with its fixing SHA, the 15-16 / 16-18 write-back pattern.
- **D-24: Unify photo-path parsing (13 IN-03) as the region routes change it.**
  - `components/photos/LightboxDialog.tsx` keeps `PHOTO_PATH = /^\/photos\/([^/]+)$/` and `slugOf` beside `slugFromPath` in `lib/photos/stepping.ts`.
  - `isEditable` lives in both `PhotoViewer.tsx:171` and `ZoomStage.tsx`.
  - One parser must never read `/photos/regions` or `/photos/regions/<id>` as a photo slug.
- **D-25: Watch the E2E duration.** Measure the E2E Tests job on this phase's CI (28-39 min across Phase 13; region pages join the audit gate here). If it would cross about 45 minutes, plan a shard or matrix before it does (13-CONTEXT discretion). Phase 18 adds more routes.
- **D-26: Use the right time-zone label for the Ortler and Saalfelden photos.**
  - `photos:build` stamps every capture `Europe/Zurich` (16 deferred-items, 16-14 and 16-17). Phase 17 publishes their pages, so the zone becomes per country: CH `Europe/Zurich`, IT `Europe/Rome`, AT `Europe/Vienna`.
  - The offsets are already right.
  - The four CH photos must stay byte-identical in every generated output.
- **D-27: Standing CI approval for `ci/17-*` (Tim, 2026-11-23: "Standing approval, ci/17-* (Recommended)").**
  - **Covered:** plain pushes of new `ci/17-*` branches, fast-forward fix pushes, and reading their CI runs.
  - **Excluded:** force pushes, the phase branch, `main`, and PNG commits.
  - **No visual-baselines dispatch:** Phase 17 expects zero diffs, so on any diff, stop and ask.

### Claude's Discretion
- **Saved-pages label:** the section label for region entries in the saved-pages list (e.g. 'Region' or 'Series') and their ordering within the catalog.
- **Facts block:** the exact markup of the region facts block in the D-11 stand-in, within the existing shell and tokens.
- **Gallery year:** whether the region gallery's `copyrightNotice` uses the span of capture years or the latest, within D-17's "the page's own pattern".
- **D-26 mechanism:** a country-to-zone map in `photos:build` or a field on the region.
- **Breadcrumbs:** whether `BreadcrumbList` JSON-LD ships now (research FEATURES §5) or waits for Phase 18's visible breadcrumb. If it ships now, it must match visible links on the page.

### Deferred Ideas (OUT OF SCOPE)
- **To Phase 18:** per-region Previous/Next stepping for every photo (D-08), the designed region page, screenshot baselines for the new pages (D-10), linking region pages from the nav and `/photos`, and a visible breadcrumb.
- **Optional for Phase 18:** reuse the D-13 `cover` for the region header.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (REQUIREMENTS.md) | Research Support |
|----|-------------|------------------|
| PHOTO-05 | Existing `/photos/<slug>` URLs and their Open Graph cards keep working unchanged, and every new photo gets the same deep-linkable page | Spike: the four v2.0 pages kept status, title, head tags, `<main>` markup, `og:image` URL (including the `?1bf973d7cc2e42c4` hash) and OG PNG SHA-256 identical when the static params grew to 11. New photo pages answered 200 with OG cards 200 in both bundlers (§Spike). §Pattern 3 (view-model split) and §Pattern 4 (PhotoViewer D-08/D-09). |
| REGION-07 | Each region page has its own title, description, canonical URL, Open Graph card and sitemap entry | Spike: the region page gave its canonical, an OG card (1200x630 PNG, 200) and metadata in both bundlers. The OG route uses `generateImageMetadata` only, with no collision. §Pattern 5 (region OG variant), §Pattern 8 (sitemap). |
| SEO-04 | JSON-LD: Person + WebSite site-wide, ImageObject on photo pages, image gallery on region pages, projects on case studies; creator, copyrightNotice, creditText; no `license`; no coordinates finer than shown | Next guide quoted (§Pattern 6). Spike: a `<`-escaped block parsed in the browser with zero CSP violations in Chromium (Edge) and Firefox, prod and dev. schema-dts 2.1.0 exports verified. D-19 rounding source: `fixedDecimals` / `formatCoordinates` / `DECIMALS` (§Pattern 7). |
| EDGE-03 | Offline saved-pages list includes region pages and the new photo pages | `lib/saved-pages.ts` `savedPageCatalog` + `/offline` page call site (§Pattern 9). |
</phase_requirements>

## Project Constraints (from AGENTS.md, memory and STATE)

There is no `CLAUDE.md` in the repo. These directives carry the same weight as locked decisions:
- **AGENTS.md:** "This is NOT the Next.js you know." Read the relevant guide in `node_modules/next/dist/docs/` before writing Next code, and heed deprecation notices. The guides this phase needs: `01-app/02-guides/json-ld.md`, `01-app/03-api-reference/03-file-conventions/{intercepting-routes,parallel-routes,default}.md`, `01-metadata/opengraph-image.md`, `02-route-segment-config/dynamicParams.md`.
- **UI work:** any executor touching region-page markup (the D-11 stand-in, the D-08/D-09 viewer chrome) loads the `ui-ux-pro-max` skill first. Tim requires it for all UI work. No visual design is needed here; Phase 18 designs the page.
- **npm:** installs go through the bundled npm, `node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" ...`. The global npm 11.6.1 rewrites lockfile metadata.
- **Repo search:** use `git grep` or the Grep tool, never a plain recursive `grep -r` from the root. It reaches `.env.local`.
- **Before `npm ci`:** stop any `next start` (memory). Kill orphan `next start` children by port.
- **Visual baselines:** Phase 17 dispatches no baseline update (D-27). Any visual diff stops for Tim.
- **CI pushes:** plain pushes of new `ci/17-*` branches are pre-approved. Force pushes, the phase branch, `main` and PNG commits are not.
- **Commits from `gsd query commit`:** they omit attribution. Amend while unpushed (memory).
- **Test-count guard:** `scripts/guards/test-count.mjs` rejects `.skip(`. Tests are rewritten, never skipped.
- **Data guard:** `npm run lint` runs `data:check`, so every generated file must match a fresh build.

## Summary

The static-sibling route `app/(site)/photos/regions/[region]/page.tsx` sits beside `photos/[slug]` with no route conflict in either bundler. The existing `(.)[slug]` intercept matches exactly one segment: the source regex comes from `getNamedRouteRegex('/photos/[slug]')`, and the descendant match `(?:/.*)?` applies only to the **Next-Url header**, the page you navigate from. So `/photos/regions/zermatt` is never intercepted. A photo link clicked on a region page **is** intercepted and opens the lightbox over the still-mounted region page, because the header regex `/photos(?:/.*)?` matches the region URL. All three behaviours were measured with real soft navigations (a `window` marker survived each navigation) in Edge, under `next dev --webpack` and under a Turbopack production build.

The routing needs two small additions: a null `@modal/regions/[region]/page.tsx`, which the parallel-routes docs predict and the spike proved, and a region branch in `proxy.ts` that reuses the existing neutral `/photos/_` render. The bare `/photos/regions` needs nothing: it is already a two-segment `DETAIL_PATH` miss, and the spike measured the designed 404 with no echo.

The spike also found one trap the planner must design around. **Importing `data/regions/regions.json` into `lib/photos/routes.ts` leaks the whole registry, facts included, into two client chunks (+2,200 B), even with `/* @__PURE__ */`.** JSON modules are not dropped the way the editorial object is. With the region-id list moved to a proxy-only module, client JS returned exactly to the phase base, **1,851,685 B in 24 files** (measured at `57d87a5`). The Phase 17 cap is base + 4,096 = **1,855,781 B**.

The v2.0 four stay byte-identical if three things hold. Their stepping set stays the light table (`photoViews`); `photoBySlug` prefers the light-table view; and `app/(site)/photos/[slug]/opengraph-image.tsx` is not edited. Its bytes feed the `og:image` `?hash` query; editing `lib/og/template.tsx` did not change it. JSON-LD adds a `<script>` to the HTML but no pixels.

**Primary recommendation:** Build `/photos/regions/[region]` exactly as the spike did: a null `@modal` region page, a proxy region branch fed from a proxy-only id list, `regionHref` (function only) in `lib/photos/routes.ts`, a published-view set beside the unchanged light table, a `region` OG variant through `generateImageMetadata` only, and one pure `lib/json-ld.ts` builder module whose output is escaped by a single `jsonLdScript()` helper.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Region URL contract (`regionHref`) | Shared pure module (`lib/photos/routes.ts`) | — | Imported by server pages and client components; must carry no data |
| Unknown region / bare `/photos/regions` 404 | Edge proxy (`proxy.ts`) | Root not-found (server) | Must be decided before render to avoid the `__next_error__` shell and flight-data echo (D-05) |
| Region page stand-in | Frontend server (RSC page) | — | Static data, server-rendered; no client island needed |
| Lightbox over a region page | Browser (intercepted `@modal` route + client `LightboxDialog`) | Frontend server (RSC payload) | Existing intercept; only a null slot page is added |
| Region OG card | Frontend server (ImageResponse route) | Static assets (`public/terrain`, `public/images/photos`) | Reads SVG/JPEG from disk at request time, cached after the first request |
| JSON-LD | Frontend server (layout/page markup) | — | Data block in HTML; never in the modal; no client code |
| Sitemap / canonical | Frontend server (metadata routes) | — | `app/sitemap.ts`, `generateMetadata` |
| Offline saved pages | Browser (Cache Storage read in `SavedPages`) | Frontend server (catalog built in `/offline` page) | Catalog passed as props; only titles and paths reach the client |
| Capture time-zone label | Build script (`photos:build`) | Data schema (zod) | Generated data; the runtime never needs zone data |

## Spike Record (D-01)

### Where and how

- **Worktree:** a disposable detached worktree `scratchpad/spike17` at `57d87a5`, with its own `npm ci` through the bundled npm. It was removed afterwards (`git worktree remove --force` and `prune`; `git worktree list` shows only the main tree). Nothing in the main tree changed except this file.
- **Baseline first:** `npm run build` of the unmodified HEAD, then `next start -p 3017`. That run captured the v2.0 four's HTML, `og:image` URLs, OG PNGs, head tags and the sitemap (`scratchpad/capture.mjs`). It also measured client JS: **1,851,685 B in 24 files**, using the 16-01 byte-sum one-liner.
- **Production run:** `rm -rf .next && npm run build` (Turbopack), then `node node_modules/next/dist/bin/next start -p 3017`.
- **Dev run:** `node node_modules/next/dist/bin/next dev --webpack -p 3017` (webpack, as the `dev` script does).
- **Driver:** `scratchpad/spike-drive.mjs`. It loads `@playwright/test` through `createRequire(<worktree>/package.json)` and uses `chromium.launch({ channel: 'msedge' })` at 1440x900 with service workers blocked. A navigation counts as "soft" when `window.__spikeMark` survives it. CSP violations were collected with a `securitypolicyviolation` listener added by `addInitScript`.

### Spike files (everything the planner needs to turn into production code)

| File | What it did |
|------|-------------|
| `app/(site)/photos/regions/[region]/page.tsx` (new) | `export const dynamicParams = false`; `generateStaticParams()` → `registry.regions.map((r) => ({ region: r.id }))`; `generateMetadata` → `pageMetadata({ title, description, path: regionHref(id) })`; h1 `{name}, {country}`, facts `<ul>`, photo `<Link href={photoHref(slug)} data-photo-link>` list; one `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />` whose `name` deliberately contained `<script>alert(1)</script>` |
| `app/(site)/photos/regions/[region]/opengraph-image.tsx` (new) | `size`, `contentType`, `generateImageMetadata({ params })` returning `[{ id: 'card', alt, size, contentType }]` or `[]`; **no** `generateStaticParams`/`dynamicParams`; default export reads `plates[region.plate].assets.contours.hero` and passes it to `contourDataUrl(hero)`; cover = first published view in the region (spike only; production uses D-13 `cover`) |
| `app/(site)/photos/@modal/regions/[region]/page.tsx` (new) | `export default function ModalAtRegion() { return null; }` |
| `lib/photos/routes.ts` | `regionHref = (id: string): \`/photos/regions/${string}\` => \`/photos/regions/${id}\``; `photoRouteSlugs = /* @__PURE__ */ Object.values(editorial).map((e) => e.slug)` (all 11) |
| `lib/photos/region-routes.ts` (new) | `import registry from '@/data/regions/regions.json'; export const regionRouteIds = registry.regions.map((r) => r.id);`. Imported **only** by `proxy.ts` |
| `lib/photos/view-model.ts` | added `publishedViews = buildPhotoViews({ photos, editorial, imageManifest })`, `publishedSlugs`, `regionOfSlug`, `viewerPhotos(view)` (light table for the four, `[view]` otherwise); `photoBySlug` = light-table view first, then published |
| `app/(site)/photos/[slug]/page.tsx` | `generateStaticParams` over `publishedSlugs`; `PhotoViewer photos={viewerPhotos(view)}` |
| `app/(site)/photos/@modal/(.)[slug]/page.tsx` | `viewerPhotos(view)`, plus a **spike-only** `<Link data-spike="modal-region-link" href={regionHref(region)}>` inside `LightboxDialog`, the only way to make a soft navigation from an open dialog in the test |
| `app/(site)/photos/page.tsx` | a **spike-only** `<Link data-spike="photos-region-link" href={regionHref('zermatt')}>` (/photos has no region link until Phase 18) |
| `lib/og/template.tsx` | `contourDataUrl(src: string = terrain.assets.contours.hero)` and `readFile(join(process.cwd(), 'public', src))` |
| `proxy.ts` | `REGION_PATH` + `missedSection()` (code in §Pattern 2) |

`app/(site)/photos/[slug]/opengraph-image.tsx` was **not** edited.

### Results per check

| D-01 check | `next dev --webpack` | `next build` + `next start` (Turbopack) | Evidence |
|---|---|---|---|
| Hard load + reload, all three regions | PASS | PASS | 200; h1 `Zermatt, CH` / `Ortler, IT` / `Saalfelden, AT`; no `dialog[open]`; reload identical; nav `aria-current` = "Photographs" |
| Soft nav `/photos` → region page, not intercepted | PASS | PASS | marker survived; URL `/photos/regions/zermatt`; region h1; no dialog |
| Soft nav region → photo opens lightbox, then Back | PASS (3 cases) | PASS (3 cases) | v2.0 `matterhorn-from-zermatt`, new `mirrored-snow-peaks`, Ortler `meadow-stream-below-the-peaks`: dialog open over the region h1, title `{title} · Tim Lui`; Back: dialog gone, region h1, `html.style.overflow` restored, still soft |
| Soft nav from open lightbox → region page, no stuck modal | PASS (3 starts) | PASS (3 starts) | from region page, from `/photos`, from Saalfelden: after the click `dialog` count 0, overflow `''`, region h1. Back afterwards reopens the lightbox (`dialog[open]` true at the photo URL), the standard Forward/Back modal behaviour |
| Unknown region `/photos/regions/<token>` | PASS | PASS | 404, designed h1 "You've left the marked trail", `All photographs` context link, no `__next_error__`, token absent from the HTML and from the `"c":[…]` flight segment |
| Bare `/photos/regions` | PASS | PASS | same as above (already a `DETAIL_PATH` miss on slug `regions`) |
| Wrong case `/photos/regions/Zermatt` | PASS | PASS | neutral 404 (exact, case-sensitive match) |
| Hydrated unknown region, no token anywhere | PASS in prod; dev shows the token only in Speed Insights' debug `data-route` (also true for `/photos/<token>` in dev: existing behaviour, dev only) | PASS | `page.content()` scan |
| Proxy `DETAIL_PATH` / `dynamicParams` | see §Pattern 2 | same | the three-segment path is outside `DETAIL_PATH`; `dynamicParams = false` alone would echo the id (measured on base) |
| Region OG card + canonical | PASS | PASS | 1200x630 `image/png` 200 for all three; canonical `https://www.tlui.de/photos/regions/<id>`; card URL `/photos/regions/<id>/opengraph-image-1cmaag/card?<hash>` |
| New photo pages + cards | PASS | PASS | `/photos/mirrored-snow-peaks`, `castle-below-limestone-peaks`, `meadow-stream-below-the-peaks`: 200, cards 200 |
| JSON-LD `<` escaping + CSP | PASS | PASS | `\u003cscript` in source, `JSON.parse` OK, name round-trips; 0 `securitypolicyviolation` events across the run (Edge); separate probe: 0 in Firefox as well (dev); WebKit not installed locally for Playwright 1.65 (see Environment) |
| v2.0 four byte-for-byte | n/a | PASS | status, `<title>`, every og:/twitter:/canonical/description tag, `og:image` URL with `?1bf973d7cc2e42c4`, OG PNG SHA-256 (`97b39bbd…`, `487ad9f9…`, `c3aef530…`, `5c920bd1…`) and `<main>` markup all identical to base; whole HTML identical once `<script>` elements and `/_next/static` paths are stripped (nonces and flight data differ per request) |
| Client JS | n/a | 1,851,685 B (= base) after moving the id list; 1,853,885 B (+2,200 B) with `regions.json` imported in `routes.ts` | `grep -rl Steinernen .next/static/chunks` → 2 files before, 0 after |

### Evidence without the null slot page (dev, webpack)

With `@modal/regions/[region]/page.tsx` deleted (dev server restarted clean):
- **From `/photos`:** opening the lightbox and clicking the in-dialog region link moved the URL to `/photos/regions/zermatt`, and the region h1 rendered behind. **But `dialog[open]` stayed true and `html.style.overflow` stayed `hidden`.** That is the stuck modal.
- **From a region page:** the click fetched the RSC payload (`GET /photos/regions/zermatt?_rsc=…` with `next-url: /photos/matterhorn-from-zermatt`). **But the URL stayed at the photo and the dialog stayed open.**

So the null slot page is required. The docs predicted this: "Since client-side navigations to a route that no longer match the slot will remain visible, we need to match the slot to a route that returns `null` to close the modal." [CITED: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/parallel-routes.md:485]

Use the explicit `@modal/regions/[region]/page.tsx`, not a `@modal/[...catchAll]`. The spike measured the explicit page; a catch-all beside `(.)[slug]` was not tested.

### Why the intercept behaves this way (source read)

`generateInterceptionRoutesRewrites` builds `source` from `getNamedRouteRegex(basePath + interceptedRoute)`, so the source matches one segment. Only the **header** regex gets `.replace(/\(\?:\/\)\?$/, '(?:/.*)?')` "to match any descendants". [VERIFIED: node_modules/next/dist/lib/generate-interception-routes-rewrites.js:18-34] So `/photos/regions/<id>` (three segments) is never rewritten into the modal. A link clicked *from* `/photos/regions/<id>` is, because the Next-Url header `/photos/regions/<id>` matches `/photos(?:/.*)?`.

One caveat follows. A soft navigation to the bare `/photos/regions` **would** be intercepted as photo slug `regions`, and the modal page would then call `notFound()`. Nothing links there (D-04), but the D-03 reserved-word test should forbid any photo slug or region id named `regions`.

## Standard Stack

### Core (already installed; versions from package.json)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.4.5 (resolved) | App Router, metadata routes, `ImageResponse` | Project framework [VERIFIED: `node -p require('next/package.json').version` → 16.4.5] |
| react / react-dom | ^19.3.1 | Server components, inline data-block `<script>` | Project runtime |
| zod | ^4.6.7 | Region `cover` schema rule, Capture `timeZone` enum | Existing schema layer (`data/schemas/*.ts`) |
| @playwright/test | ^1.65.0 | e2e, audit gate, spike driver | Existing |
| jest | ^30.5.2 | unit tests | Existing |

### New (D-21; install only after Tim's package-verification checkpoint)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| schema-dts | **2.1.0** (exact pin, devDependency) | Types for `WithContext<Person>`, `WebSite`, `ImageObject`, `ImageGallery`, `CollectionPage`, `Place`, `GeoCoordinates`, `SoftwareSourceCode`, `SoftwareApplication`, `BreadcrumbList`, `Graph` | `import type` only, in `lib/json-ld.ts`. The Next guide names it [CITED: node_modules/next/dist/docs/01-app/02-guides/json-ld.md:73-85] |
| schema-dts-lib | 1.1.0 (transitive) | `JsonLdObject`, `IdReference` base types | pulled in by schema-dts (`dependencies: { 'schema-dts-lib': '^1.1.0' }`) |

**Version verification** (bundled npm, this session): `schema-dts@2.1.0`, license Apache-2.0, `dist-tags.latest` 2.1.0, published 2026-10-02T19:03:00Z, unpacked 1,016,322 B, repository `github.com/google/schema-dts`, no install/postinstall script (its `prepare` runs only in a git checkout, not from the registry tarball). `schema-dts-lib@1.1.0`: Apache-2.0, 15,075 B, no dependencies. [VERIFIED: npm registry]

**Typings verified in the 2.1.0 tarball** (`dist/schema.d.ts`, read this session):
- **Type exports:** each of `Person`, `WebSite`, `ImageObject`, `ImageGallery`, `CollectionPage`, `Place`, `GeoCoordinates`, `SoftwareSourceCode`, `SoftwareApplication`, `Photograph`, `BreadcrumbList` and `WithContext` is exported once.
- **Graph:** `export interface Graph { "@context": "https://schema.org"; "@graph": readonly Thing[]; }`
- **WithContext:** `export type WithContext<T extends JsonLdObject | string> = T & { "@context": "https://schema.org"; };`
- **Property types:**
  - `"latitude"?: SchemaValue<Number | Text, "latitude">`
  - `"copyrightNotice"?: SchemaValue<Text, "copyrightNotice">`
  - `"creditText"?: SchemaValue<Text, "creditText">`
  - `"hasPart"?: SchemaValue<CreativeWork | IdReference, "hasPart">`

[VERIFIED: schema-dts-2.1.0.tgz dist/schema.d.ts lines 4-10, 2251, 2269, 2335, 4430]

**Installation (after the checkpoint):**
```bash
node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" install --save-dev --save-exact schema-dts@2.1.0
```
Then run `npm run guard:parity`: `check-install-parity.mjs` compares the lockfile and `node_modules`.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| schema-dts types | Hand-written TS interfaces | Typos in property names slip through (e.g. `copyrightNotice`); no cost saving, since schema-dts is 0 runtime bytes |
| `JSON.stringify(...).replace(/</g,'\\u003c')` | `serialize-javascript` | The guide offers it, but it is a runtime dependency for a one-line escape whose output is a data block, not JS |

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| schema-dts@2.1.0 | npm | 2.1.0 published 2026-10-02 (package exists since 2019, [ASSUMED] for the start year) | 4,617,895/wk | github.com/google/schema-dts | OK | Approved, behind Tim's D-21 checkpoint |
| schema-dts-lib@1.1.0 | npm | published 2026-10-02 | 1,763,126/wk | github.com/google/schema-dts | OK | Approved (transitive) |

`gsd-tools query package-legitimacy check --ecosystem npm schema-dts schema-dts-lib` returned `OK` for both, with `postinstall: null`. The Next json-ld guide names `schema-dts` [CITED: json-ld.md:73].

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none. The D-21 human checkpoint still applies (locked decision).

## Architecture Patterns

### System Architecture Diagram

```
Browser request /photos/regions/<id>
        │
        ▼
proxy.ts ──► REGION_PATH match? ──yes──► id ∈ regionIds? ──no──► fetch /photos/_ (neutral 404) ─► 404 HTML, section "photos"
        │                                      │yes
        │                                      ▼
        │                               NextResponse.next (CSP nonce)
        │
        └─► DETAIL_PATH match (/photos/<x>, /projects/<x>)? ─► x ∈ KNOWN? ─no─► neutral 404
                                                                 (/photos/regions lands here: 'regions' ∉ slugs)
        ▼
App Router: (site)/layout ─► photos/layout { children, @modal }
        │
        ├─ hard load ─► children = regions/[region]/page (RSC stand-in + JSON-LD)
        │               @modal   = @modal/regions/[region]/page → null
        │
        ├─ soft nav from /photos/** to /photos/<slug> (Next-Url ~ /photos(?:/.*)?)
        │      ─► interception rewrite ─► @modal = (.)[slug] → LightboxDialog(PhotoViewer)
        │         children keeps the region page mounted behind
        │
        └─ soft nav from open lightbox to /photos/regions/<id>
               ─► @modal = regions/[region]/page (null) → dialog unmounts, focus restored

Metadata routes:
  /photos/regions/<id>/opengraph-image-<hash>/card ─► generateImageMetadata → ImageResponse(OgFrame 'region')
        reads public/images/photos/<cover>-1200.jpg + public/terrain/<plate>-contours-hero.<hash>.svg
  /sitemap.xml ─► nav + regionHref(ids) + photoHref(published slugs) + projects
```

### Recommended file changes (delta)

```
app/(site)/photos/
├── regions/[region]/page.tsx            # NEW: stand-in (D-11), metadata, JSON-LD ImageGallery
├── regions/[region]/opengraph-image.tsx # NEW: generateImageMetadata only (no static params)
├── @modal/regions/[region]/page.tsx     # NEW: returns null (required, spike)
├── [slug]/page.tsx                      # static params → published slugs; viewer set per D-08; ImageObject JSON-LD
├── [slug]/opengraph-image.tsx           # DO NOT EDIT (its bytes are the og:image ?hash)
└── @modal/(.)[slug]/page.tsx            # viewer set per D-08; no JSON-LD (D-16)
app/layout.tsx or app/(site)/layout.tsx  # site-wide Person + WebSite JSON-LD
app/(site)/projects/[slug]/page.tsx      # project JSON-LD
app/sitemap.ts                           # + regions, published photos
app/(site)/offline/page.tsx              # catalog: published photos + regions
lib/photos/routes.ts                     # + regionHref (function only), photoRouteSlugs → published
lib/photos/region-ids.ts (name free)     # NEW: region id list for proxy.ts only (imports regions.json)
lib/regions.ts (name free)               # NEW, server-only: parsed registry, regionById, regionPhotos, cover
lib/json-ld.ts                           # NEW: pure builders + jsonLdScript escape helper
lib/photos/view-model.ts                 # + publishedViews/publishedSlugs; photoBySlug light-table-first
lib/photos/stepping.ts                   # single parser (D-24), reserved 'regions'
lib/og/template.tsx                      # contourDataUrl(src?) + OgFrame 'region' variant
lib/saved-pages.ts                       # + regions, label 'Region'
proxy.ts                                 # + region branch
data/regions/regions.json + data/schemas/region.ts   # + cover (D-13)
data/schemas/photo.ts + scripts/photos/build-photo-data.mjs  # D-26 zone per country
```

### Pattern 1: The region route set (copy the spike)

**What:** A static `regions` segment with `[region]` below it, `dynamicParams = false` and `generateStaticParams` over the registry ids. Add a null page in the `@modal` slot at the same path.
**Do not** put `generateStaticParams` or `dynamicParams` in `regions/[region]/opengraph-image.tsx`. The 12-14 collision rule applies unchanged. The spike built and served the card in both bundlers with `generateImageMetadata` alone.

### Pattern 2: Proxy region branch (proven code)

Current shape [VERIFIED: proxy.ts:13-34, 188-193]:
- `const KNOWN: Record<EdgeSection, ReadonlySet<string>> = {`
- `const DETAIL_PATH = /^\/(photos|projects)\/([^/]+)$/;`
- `export const NEUTRAL_SLUG = '_';`
- `const miss = section !== undefined && match !== null && !KNOWN[section].has(match[2]);`

The spike replacement, which passed every 404 check in both bundlers:
```ts
// Source: spike17 proxy.ts (measured 2026-11-23)
import { regionRouteIds } from '@/lib/photos/region-ids'; // proxy-only module, NOT lib/photos/routes.ts

/** A region page, exactly three segments; deeper paths (its OG card) pass through. */
const REGION_PATH = /^\/photos\/regions\/([^/]+)$/;
const KNOWN_REGIONS: ReadonlySet<string> = new Set(regionRouteIds);

/** The section a path misses (and whether to fetch the neutral 404), or undefined. */
function missedSection(pathname: string): { section: EdgeSection; neutral: boolean } | undefined {
  const region = REGION_PATH.exec(pathname);
  if (region) return KNOWN_REGIONS.has(region[1]) ? undefined : { section: 'photos', neutral: true };
  const match = DETAIL_PATH.exec(pathname);
  if (!match) return undefined;
  const section = match[1] as EdgeSection;
  return KNOWN[section].has(match[2]) ? undefined : { section, neutral: match[2] !== NEUTRAL_SLUG };
}

export async function proxy(request: NextRequest): Promise<Response> {
  const missed = missedSection(request.nextUrl.pathname);
  if (missed?.neutral && canFetchNeutral(new URL(request.url).hostname)) {
    const neutral = await neutral404(request, missed.section);
    if (neutral) return neutral;
  }
  // … nonce/CSP unchanged …
  if (missed) {
    requestHeaders.set(EDGE_SECTION_HEADER, missed.section);
    response = NextResponse.rewrite(new URL(MISSING_PATH, request.url), { request: { headers: requestHeaders } });
  } else { /* NextResponse.next as before */ }
}
```
- **No recursion:** a region miss always fetches `/photos/_`, which is a two-segment miss on `NEUTRAL_SLUG` and is rewritten without another fetch.
- **No new section value:** `EdgeSection` stays `'photos' | 'projects'`, and the 404 offers "All photographs".
- **`/photos/regions` (bare)** is caught by `DETAIL_PATH` as slug `regions`. This holds only while no photo slug is `regions`; the D-03 test pins it.
- **Unit tests:** add to `lib/__tests__/proxy.test.ts` (it already mocks fetch and reads `x-middleware-rewrite`). Cover an unknown region, a known region passing through, the bare parent, `/photos/regions/<known>/opengraph-image-…` passing through, and the wrong case.

### Pattern 3: View-model split (keeps the four byte-identical)

- **Keep** `photoViews` / `photoSlugs` as the light table (four), with their docs. The `/photos` page, `PhotosHeader`, `GalleryGrid` tests, `region-series.test.ts` `REAL_SLUGS` and `photos-view-model.test.ts` all pin four.
- **Add** `publishedViews` (all generated photos, built once) and `publishedSlugs`.
- **Route-set consumers move to published:**
  - production: `[slug]/page.tsx` `generateStaticParams`, `app/sitemap.ts`, the `/offline` catalog, and `proxy.ts` (via `photoRouteSlugs`);
  - tests: `e2e/seo.spec.ts` `expectedSitemap`, `e2e/og.spec.ts`, `lib/og/__tests__/routes.test.ts`, `lib/__tests__/audit-routes.test.ts` "covers every photo slug", and `lib/__tests__/photo-routes.test.ts`.
- **`photoBySlug`** returns the light-table view for the four (its `prevSlug`/`nextSlug`/`k`/`n` are among the four) and the published view otherwise. This is what kept the OG PNGs identical. Fields from a published view of a v2.0 photo would differ in `k`, `n`, `prevSlug` and `nextSlug`.
- **`photoRouteSlugs`:** `/* @__PURE__ */ Object.values(editorial).map((e) => e.slug)`. It measured 0 client bytes and no slug in any chunk. `Record<PhotoId, Editorial>` forces an entry per generated photo, so this is the published set. Rewrite the `photo-routes` pin "is the light-table list … four of them" as "equals `publishedSlugs` as a set, 11 of them, no duplicates, none equal to a reserved word".
- **Per-photo region:** generated photos carry `region` (e.g. `"region": "saalfelden"`) [VERIFIED: data/generated/photos.ts lines 5-6]. `Waypoint`/`PhotoView` do not, so look it up by `id` in the server-only region module, never in a client component.

### Pattern 4: PhotoViewer for D-08 / D-09 (client JS)

**Current:**
- The counter renders `{index + 1} / {photos.length}`. The two step buttons always render. The back link is a hard-coded `<Link href="/photos">` "All photographs", in two places (scroll tier and chrome) [VERIFIED: components/photos/PhotoViewer.tsx:495-546].
- Escape on the page calls `router.push('/photos')` [VERIFIED: PhotoViewer.tsx:281].

**Recommended shape:**
- **Server pages pass the stepping set:** `photos={viewerPhotos(view)}`, the four for v2.0 and `[view]` for new photos.
- **Stepping:** the viewer hides the step buttons and the counter when `photos.length < 2`. With n=1, arrow keys and swipes are already no-ops (`stepIndex` returns null).
- **Back link:** an optional prop `back?: { href: string; label: string }`, serialisable, computed on the server with `regionHref(region.id)` and the region name. The default keeps "All photographs" → `/photos`. Use the same `back.href` for the page-surface Escape, or Escape on a new photo page sends the visitor to a `/photos` that does not list it. That last choice is discretionary; see Open Questions.
- **Modal:** shows no back link, as today. D-09 is page-only.

**Cost:** est. +100-250 B gzip-free bytes in the PhotoViewer chunk (a conditional around the stepping group and a prop read) [ASSUMED]. There are ~3,900 B of headroom. **Measure after each plan**, using `rm -rf .next/static && npm run build` and the 16-01 byte-sum one-liner. Region names reach the client only as props (flight data), never as chunk bytes.

**Pixel safety:** the v2.0 four render exactly as before (`photos.length === 4`, no `back` prop). Visual baselines exist only for the light-table pages, so D-10 holds.

### Pattern 5: Region OG card (D-12)

- `contourDataUrl(src = terrain.assets.contours.hero)` is the only template change the spike needed. Production adds an `OgFrame` variant `{ variant: 'region'; contour; region; cover: PhotoView; photo: OgPhoto; facts: {count: string; range: string; years: string} }`. It reuses `photoSlot(photo)` + `plate(contour, top, bottom)`. Text: name (display/title), country (body/label, mist300), count + `formatMetreRange(lo, hi)` (mono/label), and a bottom line.
- **Plate contours exist for all three plates** [VERIFIED: data/generated/plates.ts read; files present in public/terrain]:
  - `matterhorn`: `"hero": "/terrain/contours-hero.2f3a04accc.svg"`
  - `ortler`: `"hero": "/terrain/ortler-contours-hero.126ad63294.svg"`
  - `saalfelden`: `/terrain/saalfelden-contours-hero.f64fae21cc.svg`

  Each starts with `<g fill="none" stroke="#000"`, which the existing stroked-`<g>` regex requires.
- **Server-only boundary:** `data/generated/plates.ts` is in `FORBIDDEN_IN_CLIENT_GRAPH` [VERIFIED: lib/__tests__/client-graph.test.ts:41-46]. The OG route is a server metadata route, and `lib/og/template.tsx` is imported by no client file, so reading `plates` there is safe. Keep the plate lookup in the route or template, never in `lib/photos/routes.ts`.
- **Cover:** read it from `regions.json` `cover` (D-13), validated by zod (`cover` must be a photo id whose `photo-map` region is this region). Never use the first photo as the spike did.
- **Output tracing:** the existing photo card relies on output file tracing to ship fonts, SVGs and JPEGs ("output file tracing ships the fonts, the contour SVG and the JPEG derivatives with the route"). The new card reads two more SVG files through a **variable** path. Verify on a Vercel preview, or at least `next build` + `next start` (passed locally), that `/photos/regions/<id>/opengraph-image-…/card` answers 200 on the deployed build. See Pitfall 6.

### Pattern 6: JSON-LD rendering

The bundled guide says: "render structured data as a `<script>` tag in your `layout.js` or `page.js` components … replacing the character, `<`, with its unicode equivalent, `\u003c`", using `JSON.stringify(jsonLd).replace(/</g, '\\u003c')`. It adds: "Since JSON-LD is structured data, not executable code, a native `<script>` tag is the right choice here." [CITED: node_modules/next/dist/docs/01-app/02-guides/json-ld.md:9-11, 31-36, 87]

```tsx
// lib/json-ld.ts: pure, no 'use client', imported only by server pages/layouts
import type { Graph, ImageObject, WithContext } from 'schema-dts';

/** The one serialiser: JSON with every '<' escaped (Next json-ld guide). */
export function jsonLdHtml(data: WithContext<ImageObject> | Graph /* | … */): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

// In a server page/layout:
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(ld) }} />
```

**CSP:** the spike measured zero `securitypolicyviolation` events for an un-nonced `application/ld+json` block under the production CSP (`script-src 'self' 'nonce-…' 'strict-dynamic'`) in Edge, and zero in Firefox under dev. This matches the HTML spec: a non-JavaScript `type` is a data block, which is never executed and never checked against `script-src` [CITED: research STACK §4.3 / PITFALLS 17, HTML "prepare the script element"]. The audit gate's CSP listener verifies it in all three engines on every audited route, WebKit included.

**Placement:**
- **Site-wide `Person` + `WebSite`:** root `app/layout.tsx` (every page, 404 included) or `app/(site)/layout.tsx` (content pages only). Recommend `(site)/layout.tsx`. The root `not-found` renders `SiteChrome` itself, outside `(site)`, so a 404 carries no identity markup. Either choice is valid per the guide.
- **`ImageObject`:** in `[slug]/page.tsx` only, never in `@modal/(.)[slug]`.
- **`ImageGallery`:** in the region page.
- **Project:** in `projects/[slug]/page.tsx`.

**Google image metadata rules** [CITED: developers.google.com/search/docs/appearance/structured-data/image-license-metadata]:
- `contentUrl` is required, plus at least one of `creator`, `creditText`, `copyrightNotice` or `license`.
- `license` is needed only for the "Licensable" badge.
- "You need to add structured data for every instance an image is used." So the ImageObject goes on the photo page. The region page lists text links only (no image instance), so its `hasPart` can be `IdReference`s (`{ '@id': '…' }`), which `hasPart` accepts.

**Recommended block contents** (each text equals what the page prints):

| Page | `@type` | Properties |
|---|---|---|
| (site) layout | `Graph` with `Person` (`@id` `${site.url}/#person`, `name`, `jobTitle: site.role`, `url: site.url`, `sameAs: [site.links.github, site.links.linkedin]`) and `WebSite` (`@id` `${site.url}/#website`, `name`, `url`, `author` → `{ '@id': …#person }`) | no email, no `site.location` (D-20) |
| Photo page | `ImageObject` (`@id` `${site.url}${photoHref(slug)}#image`, `url`/`mainEntityOfPage` → page URL, `contentUrl` absolute URL of a manifest derivative, `width`/`height`, `name` title, `caption`/`description` alt, `creator: { '@type': 'Person', name: site.name, url: site.url }`, `creditText: site.name`, `copyrightNotice: view.rights`, `dateCreated`, `contentLocation: { '@type': 'Place', name: view.place, geo: GeoCoordinates }`) | inline the creator Person (Google reads `creator.name`); no `license`, no `acquireLicensePage`; no `elevation` |
| Region page | `ImageGallery` (`@id`/`url` `${site.url}${regionHref(id)}`, `name`, `description`, `about`/`contentLocation: Place { name: region.name, address/addressCountry: region.country }`, `hasPart: [{ '@id': photo #image }]`, `creator`, `creditText`, `copyrightNotice` = the page's printed region rights line) | no geo (the stand-in prints no coordinates) |
| Case study | `box`: `SoftwareSourceCode` (`codeRepository: links.github`); `coin-flip`: `SoftwareApplication` (no repository, D-23 private) | `creator`, `creditText`, `copyrightNotice`; see Open Question 2 for the year |

### Pattern 7: D-19 precision: reuse the display rounding

- **Source of truth today:**
  - `const DECIMALS = { '4dp': 4, '3dp': 3, '2dp': 2 }` [VERIFIED: lib/photos/view-model.ts:140]
  - `formatCoordinates({ lat, lon }, decimals: 2 | 3 | 4 = 4)` calls `fixedDecimals(v, d)`, which rounds half-up on the decimal string and returns the **unsigned** `toFixed(d)` text. The hemisphere letter is added separately [VERIFIED: lib/home-format.ts:44-48, 75-80].
  - The strip calls `formatCoordinates(position, DECIMALS[position.precision])` [VERIFIED: view-model.ts:269].
- **Recommendation (merges D-23 IN-01 with D-19):**
  - Export a precision-aware helper from `lib/home-format.ts`, e.g. `roundedCoordinate(v: number, precision: '4dp'|'3dp'|'2dp'): string`. It returns the signed `fixedDecimals` text, e.g. `"46.0150"`.
  - Make `formatCoordinates` take `{ lat, lon, precision }` and derive the decimals itself. That fixes IN-01: no default of 4 remains.
  - JSON-LD `GeoCoordinates.latitude/longitude` then use the same helper. Emit them as **strings** (`"46.0150"`), which schema-dts allows (`Number | Text`). That keeps the printed digits **exactly**, trailing zero included. A JSON number would drop it (`46.015`) and print fewer decimals than the page.
- **Test:** for every published view with a position, parse its JSON-LD. The number of decimals in `latitude`/`longitude` must equal `DECIMALS[precision]`, and the value must equal the strip's Position text without hemisphere letters and `≈ `. Also walk every block for any `license` or `acquireLicensePage` key.
- **Aerial:** the 3dp position as shown. No elevation in `GeoCoordinates` (the strip's "ground 880 m" is a DEM height under the drone, not the camera height).
- **`dateCreated`:** the page prints `formatCaptureLabel` ('6 September 2021, 10:48' or '2019'). To stay no more precise than the page, use `YYYY-MM-DDTHH:MM±hh:mm` (minute precision, with the generated `offset`) or the year for the film scan [ASSUMED: interpretation of "nothing more precise than the page"; see Open Question 3].

### Pattern 8: Sitemap and "exactly the canonical URLs"

- **Today:** `app/sitemap.ts` emits nav, then `photoSlugs` via `photoHref`, then projects, with no `lastModified` [VERIFIED: app/sitemap.ts:16-22].
- **Today's tests:**
  - `e2e/seo.spec.ts` asserts `locs` `toEqual(expectedSitemap)` over nav + `/photos/${slug}` + projects [VERIFIED: e2e/seo.spec.ts:25-30, 161-176].
  - `lib/__tests__/photo-routes.test.ts` checks that every `photoSlugs` URL is in the sitemap.
  - `e2e/routes.ts` derives `SITEMAP_PATHS`/`AUDIT_SWEEP` from `sitemap()`.
- **Change:**
  - Order: nav → regions (registry order) → published photos → projects.
  - The photo order is discretionary. Recommend grouping by region in registry order, ascending altitude within (the D-11 page order).
  - Build every region URL with `regionHref` and every photo URL with `photoHref`.
  - Extend `seo.spec` `expectedSitemap` (keep its own literal `/photos/regions/` string so the URL contract is checked independently of the helper, as `photo-routes.test.ts` does).
- **New canonical ↔ sitemap test:** add a Jest or e2e assertion that every sitemap URL equals its page's `<link rel="canonical">`. Pitfall 8 recommends it. The seo spec already reads canonicals for `ROUTES`; extend it to `AUDIT_SWEEP` paths.

### Pattern 9: Offline saved pages (EDGE-03)

- **Today:**
  - `savedPageCatalog({ nav, photos, projects })` gives nav, then photos labelled `'Photograph'`, then projects labelled `'Project'`, built with `photoHref` [VERIFIED: lib/saved-pages.ts:26-48].
  - `label?: 'Photograph' | 'Project'` [VERIFIED: lib/saved-pages.ts:32].
  - `/offline` passes `photos: photoViews` (the four) [VERIFIED: app/(site)/offline/page.tsx:28].
  - `SavedPages` (client) receives the catalog as props and matches exact cached paths.
- **Change:**
  - Add `regions: readonly { id: string; name: string }[]` to `SavedPageSource` and `'Region'` to the label union.
  - Insert region rows after nav, before photos, mirroring the sitemap.
  - `/offline` passes `publishedViews` and the registry `{id, name}` pairs (recommended label `'Region'`, the word the URL uses).
- **Client cost:** `SavedPages` imports only `savedPageRows`. `regionHref` used inside `savedPageCatalog` should tree-shake out of the island as `photoHref` does today; measure it. The catalog grows from 4+... to 3 regions + 11 photos, about 1 KB more flight data on `/offline` only.
- **Tests:** extend `lib/__tests__/saved-pages.test.ts`: order, the `'Region'` label, a `regionHref` path, an unknown `/photos/regions/x` dropping. Optionally extend `e2e/offline.spec.ts` "seeded Cache Storage" with a region URL.

### Pattern 10: D-26 time zone per country

- **Today:** `const TIME_ZONE = 'Europe/Zurich';` drives `wallFormat` and `zurichOffset`, and `buildCapture` returns `{ precision: 'second', local, timeZone: TIME_ZONE, offset, source: 'exif' }` [VERIFIED: scripts/photos/build-photo-data.mjs:145, 163-231]. The schema pins `timeZone: z.literal('Europe/Zurich')` [VERIFIED: data/schemas/photo.ts:242].
- **Affected photos** (generated `capture.timeZone` read this session):
  - `dji-20260919-162232` and `dji-20260919-163558` (AT)
  - `sam-20160717-120906` and `sam-20160717-124904` (IT)

  All four have `"timeZone": "Europe/Zurich"` and `+02:00`.
- **Recommended mechanism (discretion): a country-to-zone map in `photos:build`**, keyed by the photo-map record's `country`, which `membership.get(entry.id).record` already carries.
  - Cover the whole closed `Country` enum so a new country cannot fall through: `{ AT: 'Europe/Vienna', CH: 'Europe/Zurich', DE: 'Europe/Berlin', FR: 'Europe/Paris', IT: 'Europe/Rome', LI: 'Europe/Vaduz', MC: 'Europe/Monaco', SI: 'Europe/Ljubljana' }` [ASSUMED: IANA names from training; verify each with `new Intl.DateTimeFormat('en', { timeZone })` in a test].
  - Build one `Intl.DateTimeFormat` per zone and pass the zone into the offset finder (rename `zurichOffset` → `zoneOffset`).
  - Widen the schema literal to `z.enum([...])` and add a refine that `timeZone` matches the photo's `country`.
  - A field on the region is the alternative. It is worse, because a region spans one country already and the photo carries `country`.
- **Byte-identity guard:**
  - The CH branch must keep the exact strings, including the error texts the selftest expects: `img-0605: EXIF OffsetTimeOriginal +01:00 is not the Europe/Zurich offset +02:00` [VERIFIED: scripts/guards/selftest.mjs:3463]. Interpolate the photo's zone, which is still `Europe/Zurich` for CH.
  - Running `npm run photos:build` must change only the four non-CH capture blocks in `data/generated/photos.ts`. `data/generated/home-photos.ts` (CH only) must stay byte-identical, then `npm run data:check` must come back clean.
  - Prove it with `git diff --stat data/generated/` showing only `photos.ts`, and `git diff` showing only `timeZone` lines.
- **Tests:** `data/__tests__/photos.test.ts` already pins the three CH captures to `Europe/Zurich`. Add rows pinning AT → `Europe/Vienna` and IT → `Europe/Rome`.
- **Where it shows:** no UI prints the zone today (`git grep timeZone` in lib/components/app finds nothing). It matters for data correctness and any future `dateCreated` that names a zone.

### Pattern 11: D-24 single photo-path parser

| Duplicate | Location | Difference |
|---|---|---|
| `PHOTO_PATH = /^\/photos\/([^/]+)$/` + `slugOf` | `components/photos/LightboxDialog.tsx:82, 93-96`, used at `:220, :229, :317` | no `?#` exclusion; `decodeURIComponent` unguarded (throws on `%E0`) |
| `PHOTO_PATH = /^\/photos\/([^/?#]+)$/` + `slugFromPath` | `lib/photos/stepping.ts:22, 31-40`; used by `PhotoViewer.tsx:211,450`, `CarouselView.tsx:73`, `TileTransition.tsx:25`, `SiteNav.tsx:119` | guarded decode |
| `isEditable` | `PhotoViewer.tsx:171-176` and `ZoomStage.tsx:98-103` | identical bodies |

[VERIFIED: git grep this session; file reads above]

**Fix shape:**
- `LightboxDialog` imports `slugFromPath` (and the regex, for the `onClose` test) from `lib/photos/stepping.ts`.
- `slugFromPath` returns `null` for a reserved segment. The cleanest form is `const RESERVED = new Set(['regions'])` checked after the decode. `/photos/regions/<id>` already fails the one-segment regex.
- Move `isEditable` to one small pure module, e.g. `lib/photos/keys.ts` or `lib/dom/editable.ts`, and import it in both components.
- **Tests:** `lib/__tests__/photos-stepping.test.ts` gets `slugFromPath('/photos/regions')` → null, `('/photos/regions/zermatt')` → null and `('/photos/%E0')` → null. A source-scan assertion checks that no second `PHOTO_PATH` or `function isEditable` remains.
- **Client cost:** net about 0 to slightly negative (one regex and one function fewer) [ASSUMED].
- **Behaviour note:** `SiteNav.tsx:119` closes the mobile menu based on `slugFromPath`. Returning null for `/photos/regions` changes nothing visible, since that path is a 404.

### Pattern 12: D-23 Phase 16 info findings (IN-01..IN-09)

| ID | Where (current lines) | One-line fix shape | Generated-output risk |
|---|---|---|---|
| IN-01 | `lib/home-format.ts:75-80` (`decimals: 2 \| 3 \| 4 = 4`); callers `view-model.ts:269` | `formatCoordinates({lat, lon, precision})` derives decimals; remove the default (do with D-19) | none (same strings; `home-format.test.ts` + view-model strip tests pin output) |
| IN-02 | `scripts/terrain/fetch-bev.mjs:106-107` (`NODATA_AT_OR_BELOW = -9000`, `MIN_M = -100`), check at `:409`, 16-bit check at `:434` | one rule `!Number.isFinite(m) \|\| m < 0 \|\| m > MAX_M` with a nodata/out-of-range message; drop both constants (or set MIN_M 0 with a reason) | fetcher only; selftest cases for BEV refusals may name the message, so update them |
| IN-03 | `lib/ascent/home-photos.ts:32` | message names `data/generated/home-photos.ts` and suggests `npm run photos:build` | none |
| IN-04 | `scripts/photos/build-photo-data.mjs:337-345` (`loadHomeWaypointIds` bare catch) | `catch (e) { throw new Error(\`cannot read ${HOME_WAYPOINTS_REL} (${e?.message ?? e}); …\`) }` | none; a selftest may match the old text |
| IN-05 | `scripts/terrain/build-terrain.mjs:526-540` (`overviewSummits`) | copy `source` (and `borders` if the schema has it) into each record | **regenerates `data/generated/overview.ts`**; check `data/schemas/overview.ts` (strict) and `OVERVIEW_BUDGET`; `data:check` must be re-run and the regenerated file committed |
| IN-06 | `scripts/terrain/build-terrain.mjs:851-857`; `lib/geo.ts:81-92` (`stripBbox` clamps) | require `centreN ± height/2` (snapped) inside the extent, or make `stripBbox` throw instead of clamping | none for committed plates (the review says each centre is at least half a band from its edges); `geo.test.ts` may pin clamping |
| IN-07 | `.gitattributes` (only `data/terrain/source/*.png binary`) | add `data/terrain/plates/**/*.png binary`, `data/terrain/overview/*.png binary`, and `eol=lf` for the plate/overview `source.json` files | run `git add --renormalize` and confirm no content change (`git status` clean) |
| IN-08 | `fetch-bev.mjs:120-156, 227, 248-262`; `fetch-dem.mjs:89-188`; `fetch-overview.mjs:105-158` | extract `scripts/terrain/plate-args.mjs` (parseArgs, extentProblem, parseExtent, sameExtent, extentText, shown, MAX_SIDE_M, CELL_M) and a retry module (withRetry, finalError, reasonOf) | refactor only; selftest must stay green |
| IN-09 | `scripts/terrain/fetch-overview.mjs:209-211` (upper bound only), `:250` (`m > 0 ? m : 0`) | fail below a floor (e.g. -500 m); clamp only small negatives near the coast | fetcher only |

**Write-back:** set each to `fixed` in `16-REVIEW-DISPOSITION.md`, both in the YAML front matter (`disposition: fixed`) and in the table, with the fixing SHA in the Source cell. Follow the 15-16 / 16-18 pattern.

### Anti-Patterns to Avoid

- **Importing `regions.json` (or anything holding region facts) into `lib/photos/routes.ts`.** Measured: +2,200 B in two client chunks, and `/* @__PURE__ */` does not remove it. Add `'data/regions/regions.json'` to `SERVER_ONLY_MODULES` in `lib/__tests__/client-graph.test.ts` so this fails a test. The walker resolves exact `.json` paths as leaves.
- **A `@modal/[...catchAll]` instead of the explicit null region page.** It is untested beside `(.)[slug]`, and the explicit page is what was proven.
- **`generateStaticParams` in the region `opengraph-image.tsx`.** That is the 12-14 collision: under webpack a duplicate export, under Turbopack all cards 404.
- **Editing `app/(site)/photos/[slug]/opengraph-image.tsx`.** Its file bytes produce the `og:image` `?hash` (webpack `next-metadata-image-loader` uses `[contenthash]` of the file) [CITED: node_modules/next/dist/build/webpack/loaders/next-metadata-image-loader.js:60-64]. Changing it changes the v2.0 `og:image` URL. Put new logic in `view-model`/`template` instead; the spike changed `template.tsx` and the hash held.
- **JSON-LD in `@modal/(.)[slug]` or with a nonce.** D-16 and anti-pattern 9.
- **Building `publishedViews` and then feeding it to the four's viewer.** `prevSlug`/`nextSlug` would cross regions and break `n / 4`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unknown-region 404 without echo | A `notFound()` in the region page, or a new not-found file | The existing `neutral404` + `/photos/_` render in `proxy.ts` | `notFound()` in a page gives the empty `__next_error__` shell; flight data echoes the URL (measured) |
| Closing the modal on navigation | Client-side `router` listeners or manual `dialog.close()` | A null page in the `@modal` slot at the region path | The documented parallel-routes mechanism; the spike proved it |
| Coordinate rounding for JSON-LD | `toFixed` / `Math.round(v*1e4)/1e4` | `fixedDecimals` via a shared helper (Pattern 7) | Binary-double half-rounding bug (09 IN-04) and drift from the printed text |
| JSON-LD typing | Hand interfaces | `schema-dts` `import type` | 0 bytes, catches property typos |
| Year span text | String concatenation | `formatYearRange` (`lib/home-format.ts:104-109`) | En dash, single-year collapse, empty-list RangeError |
| Altitude range text | Custom | `formatMetreRange(lo, hi)` (`lib/home-format.ts:124`) | Grouping and the en dash are already decided |
| Region URL strings | Template literals anywhere | `regionHref` + source scan | D-06; the scan catches regressions |

## Runtime State Inventory

Phase 17 adds routes; it renames nothing. One time-zone label changes in generated data.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `data/generated/photos.ts`: four non-CH captures carry `"timeZone": "Europe/Zurich"` | Code edit in `photos:build` + schema, then regenerate; the CH entries and `home-photos.ts` stay byte-identical (`data:check`) |
| Live service config | None. No CMS or external config names routes; Vercel redirects only host-level (`tlui.de` → `www.tlui.de`) [ASSUMED from STATE/memory] | none |
| OS-registered state | None. Verified: no scheduled tasks or services involved in routing | none |
| Secrets/env vars | `VERCEL_URL`, `VERCEL_BRANCH_URL`, `VERCEL_PROJECT_PRODUCTION_URL` are read by `canFetchNeutral`, unchanged | none |
| Build artifacts / caches | The service worker caches `dynamic-${BUILD_HASH}`; a new build purges old caches, so stale region or photo pages cannot linger. Social platforms' cached OG images for the v2.0 four stay valid (URL unchanged) | none |

## Common Pitfalls

### Pitfall 1: The stuck modal
**What goes wrong:** the lightbox stays open over the region page (dialog open, `html{overflow:hidden}`), or the click does nothing.
**Why:** the `@modal` slot keeps its last active state on a soft navigation to a URL it does not match.
**How to avoid:** add `@modal/regions/[region]/page.tsx` → `null`. Add an e2e: open the lightbox, navigate to the region page, assert no `dialog`, overflow `''`, and that Back reopens the lightbox. **Production has no in-dialog link to a region page.** The real paths are Back/Forward and Phase 18's links, so the e2e needs a route that clicks a region link while the dialog is open. Without one, test it via history: region → photo (lightbox) → Back → Forward → Back. Or add a real in-dialog region link if Tim wants one (Open Question 4).

### Pitfall 2: Registry data leaking into client chunks
**What goes wrong:** +2.2 KB client JS and region facts in every chunk that imports `photoHref`.
**Why:** JSON modules are not tree-shaken like the `@__PURE__` call over `editorial`.
**How to avoid:** keep `routes.ts` free of data imports beyond `editorial`, put the id list in a proxy-only module, and add `regions.json` to `SERVER_ONLY_MODULES`.
**Warning signs:** `grep -rl Steinernen .next/static/chunks` is non-empty; the byte sum is above the base.

### Pitfall 3: The audit sweep test times out
**What goes wrong:** `Audit: every sitemap page … @chromium-only` has `test.setTimeout(180000)` [VERIFIED: e2e/audit.spec.ts:184] and walks `AUDIT_SWEEP` serially. The sweep grows from 4 paths (coin-flip + 3 photos) to about 13 (coin-flip + 10 photos + 2 regions; one region sits in `ROUTES`).
**How to avoid:** scale the timeout with the list (e.g. `test.setTimeout(60_000 + AUDIT_SWEEP.length * 20_000)`), or split into a few chunked tests. Keep the test count low for the ratchet. [ASSUMED: ~10-15 s per page in CI Chromium; measure from the first ci/17 run's report.]

### Pitfall 4: The E2E job crosses 45 minutes (D-25)
**Measured E2E Tests durations** (gh run view, job start to finish):

| Run | Branch | Minutes |
|---|---|---|
| 45243101391 | ci/16-review-fixes | 32.5 |
| 45188005124 | ci/16-18 | 40.3 |
| 44077889343 | main | 27.1 |
| 43651737781 | ci/15-16 | 30.6 |
| 43520855709 | phase-13 close | 30.5 |

CI runs Playwright with `workers: 1` and `retries: 2` [VERIFIED: playwright.config.ts], all three engines in one job with `timeout-minutes: 60` [VERIFIED: .github/workflows/ci.yml:160-191].

**Current audit route count:**
- `ROUTES`: 8 entries plus `NOT_FOUND`, so 9 template tests × 3 engines, each at 3 widths.
- Sweep: 4 paths in one Chromium test.

**Phase 17 adds:**
- one region `ROUTES` entry: +3 tests × 3 widths;
- 9 more sweep paths;
- new region/lightbox/404/SEO/OG e2e tests × 3 engines.

**Estimate:** +6 to +10 min [ASSUMED]. That puts the 40-minute worst case at about 46-50 min, over the 45-minute line.

**Recommendation:** plan the shard in this phase as a separate CI plan, before the route growth lands. The natural cut is a `strategy.matrix.project: [chromium, firefox, webkit]` on `e2e-tests`. GitHub names the jobs "E2E Tests (chromium)" etc., so the name stays literal (`check-ci-gate.mjs` rule 18 forbids `${{` in names). The job id `e2e-tests` stays in `ci-ok.needs` (rule 3). Run `npm run guard:ci` and `guard:selftest`, and check `scripts/ci/check-visual-run.mjs` / `ci-ok.jq` for job-name lookups. Also check whether any ruleset or relay names "E2E Tests" exactly; memory says `main` has no required checks. Then measure on the first ci/17 run as D-25 asks.

### Pitfall 5: Changing `photoSlugs` semantics breaks the four-pinned suites
**What goes wrong:** `region-series.test.ts` (`REAL_SLUGS`), `photos-view-model.test.ts` (the `photoSlugs` four), `GalleryGrid`/header tests and `e2e/visual/routes.spec.ts` assume the light table.
**How to avoid:** add `publishedSlugs`; do not redefine `photoSlugs` (Pattern 3).

### Pitfall 6: The region OG card 404s on Vercel but not locally
**What goes wrong:** output file tracing may not include SVG files read through a computed path.
**Why:** a local `next start` reads straight from `public/`; a deployed function bundle may not include files it cannot trace. The existing cards read `terrain.assets.contours.hero` the same way and work, so the risk is low [ASSUMED].
**How to avoid:** the region card e2e (`og.spec` extension) runs against `next start` in CI. Also fetch one region card on the Vercel preview of the phase PR (live-DOM UAT).

### Pitfall 7: JSON-LD text that disagrees with the page
**What goes wrong:** `copyrightNotice` for case studies and regions has no printed counterpart today. The footer prints `© {new Date().getFullYear()} {site.name}. All rights reserved.` [VERIFIED: components/site/SiteFooter.tsx:28, 66], a different pattern from `view.rights`, and case studies print no project rights line. Adding one to case studies would change pixels (D-10).
**How to avoid:**
- **Region:** the stand-in prints its own rights line (`© {formatYearRange(years)} Tim Lui, all rights reserved`). It has no baseline yet, so it is pixel-safe, and JSON-LD copies it exactly.
- **Case studies:** a decision is needed (Open Question 2).

### Pitfall 8: New photo descriptions read oddly for aerial photos
`photoMetadata` renders "… from {short place} at {altitudeLabel}, {month}." For the drone stills `altitudeLabel` is `ground 880 m`, so the description reads "… at ground 880 m, Sep 2026." [VERIFIED: view-model.ts:471-479 template; altitudeLabel doc at :94]. The OG alt template has the same issue. Bring these to the D-14 copy checkpoint alongside the region copy.

## Code Examples

### The region stand-in page (production shape)
```tsx
// app/(site)/photos/regions/[region]/page.tsx (server component; ui-ux-pro-max loaded by the executor)
import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/lib/metadata';
import { photoHref, regionHref } from '@/lib/photos/routes';
import { regionById, regionIds, regionPhotoViews } from '@/lib/regions'; // server-only module
import { regionGalleryLd, jsonLdHtml } from '@/lib/json-ld';

type PageProps = { params: Promise<{ region: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return regionIds.map((region) => ({ region }));
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const region = regionById((await params).region);
  if (!region) return {};
  return pageMetadata({ title: region.name /* D-14 copy */, description: '…', path: regionHref(region.id) });
}
export default async function RegionPage({ params }: PageProps) {
  const region = regionById((await params).region);
  if (!region) return null; // unreachable: dynamicParams=false + the proxy answers misses first
  const views = regionPhotoViews(region.id); // ascending altitude (buildWaypoints order)
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(regionGalleryLd(region, views)) }} />
      <h1>{region.name}, {region.country}</h1>
      {/* facts with their sources; photo links with data-photo-id for focus return */}
      <ul>{views.map((v) => (
        <li key={v.slug}><Link href={photoHref(v.slug)} data-photo-id={v.slug}>{v.title}</Link> …</li>
      ))}</ul>
      {/* the printed rights line JSON-LD copies (Pitfall 7) */}
    </>
  );
}
```
Notes:
- `data-photo-id` matters because `restoreFocus` looks for `[data-photo-id="{slug}"]` after the lightbox closes [VERIFIED: LightboxDialog.tsx:183-187]. That returns focus to the link the visitor opened.
- Use the existing `country` code, or a display name if D-14 copy prefers one (the spike printed `Zermatt, CH`).

### The client-graph guard addition
```ts
// lib/__tests__/client-graph.test.ts
export const SERVER_ONLY_MODULES = ['data/generated/overview.ts', 'data/regions/regions.json'] as const;
```

### Region hand-built path scan (extend D-18 patterns)
```ts
// lib/__tests__/photo-routes.test.ts: add beside HAND_BUILT
const REGION_HAND_BUILT = [
  /(?<![\w-])\/photos\/regions\/\$\{/,
  /['"`]\/photos\/regions\/['"`]\s*\+/,
  /href=["']\/photos\/regions\/[^"'?#]/,
];
// GOOD list must still allow: const REGION_PATH = /^\/photos\/regions\/([^/]+)$/;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` (`export async function proxy`) | Next 16 | Already adopted; region branch goes there |
| `next/script` for JSON-LD | Native `<script type="application/ld+json">` | Next guide (bundled 16.4.5) | Data block, no nonce |
| `default.js` optional (404 fallback) | Named slots error without `default.js` | Next 15/16 | `@modal/default.tsx` already exists; the new `@modal/regions/[region]` page does not replace it |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | D-08/D-09 PhotoViewer changes cost about +100-250 B client JS | Pattern 4 | Budget overrun is unlikely (~3.9 KB headroom); measured per plan anyway |
| A2 | Phase 17 adds about 6-10 min to the E2E job | Pitfall 4 | If lower, the shard is early but harmless; if higher, the job nears its 60-minute timeout |
| A3 | About 10-15 s per sweep page in CI Chromium | Pitfall 3 | The sweep test hits its 180 s timeout |
| A4 | The IANA zone names for AT/DE/FR/IT/LI/MC/SI | Pattern 10 | A wrong zone throws at build; verify with `Intl` in a test |
| A5 | Turbopack's `og:image` hash depends on the `opengraph-image.tsx` file bytes alone (webpack is cited; Turbopack was inferred from the template edit leaving it unchanged) | Anti-patterns | Editing that file would change the v2.0 og:image URL; just don't edit it |
| A6 | Output tracing ships the region SVGs on Vercel | Pitfall 6 | Region cards 404 in production; caught by a preview check |
| A7 | `dateCreated` at minute precision satisfies "nothing more precise than the page" | Pattern 7 | A planner may emit seconds; low SEO impact, but it contradicts the CONTEXT specifics |
| A8 | Success criterion 1's "byte-for-byte" covers status, URL, head tags, OG card and pixels; the JSON-LD `<script>` SEO-04 requires is an allowed HTML addition | Summary/Pattern 3 | If Tim reads it as literal HTML bytes, SEO-04 and PHOTO-05 conflict; confirm at plan review |
| A9 | `schema-dts` has existed since about 2019 | Package audit | Cosmetic |

## Open Questions

1. **D-13 cover photos.** This is Tim's decision at the checkpoint before the OG route. Candidates per region: Zermatt (6 photos, including the v2.0 four), Ortler (2), Saalfelden (2 aerial).
2. **`copyrightNotice` for case studies (D-17).** The pages print no project rights line; only the footer prints `© {current year} Tim Lui. All rights reserved.` Options: (a) copy the footer line exactly; (b) use the D-17 pattern with a project year that is not printed anywhere (contradicts "never disagrees"); (c) add a printed line (changes baselined pixels, against D-10). **Recommendation: (a).** Confirm with Tim at the D-14 copy checkpoint.
3. **`dateCreated` precision** (minute vs date vs seconds). Recommendation: minute with offset, the year for the film scan.
4. **An in-lightbox link to the region (D-09 is page-only).** Not required. Without it, the only lightbox → region-page navigation today is history. Keep it out (Phase 18 designs the chrome) and test the null slot through history and a test-only route. **Recommendation:** no production link; the e2e uses region → photo → Back → Forward → Back plus a soft navigation from an open lightbox via the nav. Note: the nav is inert while the modal dialog is open, so use `page.evaluate(() => history.back())` patterns.
5. **Escape on a new photo page.** Recommendation: go to `back.href` (the region page), consistent with D-09.
6. **`BreadcrumbList` (discretion).** Recommendation: defer to Phase 18. The stand-in has no visible breadcrumb, and the markup must match visible links.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build, tests | ✓ | 26.13.1 (engines say 24.x; warning harmless) | — |
| Bundled npm (`C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js`) | installs | ✓ | used for `npm ci` this session | — |
| Next | build/dev | ✓ | 16.4.5 | — |
| Playwright browsers | e2e locally | Chromium builds ✓, Firefox ✓ (firefox-1572 etc.), Edge channel ✓; **WebKit for PW 1.65 (webkit-2388) ✗** locally | 1.65 | CI container `mcr.microsoft.com/playwright:v1.65.0-noble` has all three; locally `npx playwright install webkit` if needed |
| gh CLI | D-25 measurement, ci/17 runs | ✓ | authenticated (runs listed) | — |
| Port 3000 | Playwright `baseURL` | free at research end | — | stop orphan `next start` first (memory) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** local WebKit for Playwright 1.65 (CI covers it).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 (`jest.config.js`, next/jest, jsdom default; `@jest-environment node` per file) + Playwright 1.65 (`playwright.config.ts`) |
| Config files | `jest.config.js`, `playwright.config.ts`, `tsconfig.jest.json`, `tsconfig.e2e.json` |
| Quick run command | `npx jest lib/__tests__/photo-routes.test.ts lib/__tests__/proxy.test.ts lib/__tests__/saved-pages.test.ts lib/__tests__/client-graph.test.ts` (plus the new `json-ld` test) |
| Full suite command | `npm run type-check && npm test && npm run lint` (lint includes `data:check` and the guards), then `PW_PROD=1 npx playwright test --project=chromium --project=firefox` locally (CI runs all three engines) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PHOTO-05 | Proxy admits exactly the published slugs; static params = published; v2.0 four keep their view (k/n/prev/next) | unit | `npx jest lib/__tests__/photo-routes.test.ts lib/__tests__/photos-view-model.test.ts` | ✅ (rewrite pins) |
| PHOTO-05 | v2.0 four: same og:image URL and 200 PNG; new photo pages 200 with cards | e2e | `npx playwright test e2e/og.spec.ts e2e/seo.spec.ts` | ✅ (extend to published) |
| PHOTO-05 | New photo page hides stepping/counter; back link → region; v2.0 unchanged | unit (RTL) + e2e | `npx jest components/photos` + new `e2e/photos-region.spec.ts` | ❌ Wave 0 |
| PHOTO-05 / D-10 | No pixel change | visual | CI "Visual Regression" + `node scripts/ci/check-snapshot-commit.mjs --none` per commit | ✅ |
| REGION-07 | Region pages: title, description, canonical, OG card, sitemap entry; sitemap = canonicals exactly | e2e + unit | `npx playwright test e2e/seo.spec.ts e2e/og.spec.ts`; `npx jest lib/og/__tests__/routes.test.ts` | ✅ (extend) |
| REGION-07 / SC2 | Spike checks as tests: hard load/reload, soft nav not intercepted, region→photo lightbox + Back, lightbox→region no stuck modal | e2e | new `e2e/photos-region.spec.ts` (3 engines; tag `@prod-only` where needed) | ❌ Wave 0 |
| SC2 / D-04 / D-05 | Unknown region, bare `/photos/regions`: designed 404, no token echo | e2e + unit | `npx playwright test e2e/not-found.spec.ts`; `npx jest lib/__tests__/proxy.test.ts` | ✅ (extend `MISSES`) |
| SC2 | Region page passes the audit gate | e2e | `npx playwright test e2e/audit.spec.ts` (ROUTES gains `/photos/regions/zermatt`; `audit-routes.test.ts` enforces it) | ✅ (extend) |
| D-03 | Region ids ∩ photo slugs ∩ reserved words = ∅ | unit | new case in `photo-routes.test.ts` or `region-series.test.ts` | ❌ Wave 0 |
| D-06 | No hand-built region path | unit (source scan) | `npx jest lib/__tests__/photo-routes.test.ts` | ✅ (extend patterns) |
| SEO-04 | Every block parses; `<` escaped; no `license`/`acquireLicensePage`; coordinate decimals = page; copyrightNotice = printed line; creditText = creator.name | unit | new `lib/__tests__/json-ld.test.ts` | ❌ Wave 0 |
| SEO-04 | Rendered pages carry exactly the expected `@type`s (none in the modal) and no CSP violations | e2e | extend `e2e/seo.spec.ts`; the audit gate's CSP listener | ✅ (extend) |
| EDGE-03 | Catalog lists regions + all photos; label 'Region'; rows only for cached exact paths | unit + e2e | `npx jest lib/__tests__/saved-pages.test.ts components/site/__tests__/SavedPages.test.tsx`; `npx playwright test e2e/offline.spec.ts` | ✅ (extend) |
| D-26 | AT/IT zones; CH byte-identical | unit + data check | `npx jest data/__tests__/photos.test.ts`; `npm run data:check` | ✅ (extend) |
| D-24 | One parser; reserved `regions`; no duplicate `isEditable` | unit | `npx jest lib/__tests__/photos-stepping.test.ts` | ✅ (extend) |
| Budget | Client JS ≤ 1,855,781 B; no `Steinernen`/new slugs in chunks | manual-scripted | `rm -rf .next/static && npm run build` + 16-01 byte-sum one-liner + `grep -rl` | n/a |

### Sampling Rate
- **Per task commit:** the quick Jest set for the touched area, plus `npm run type-check`, plus `node scripts/ci/check-snapshot-commit.mjs --none`.
- **Per wave merge:** `npm test && npm run lint`, plus a local production Playwright run of the touched specs (`PW_PROD=1 PW_REUSE=1`).
- **Phase gate:** a full CI run on a `ci/17-*` branch (D-27), green, with the E2E Tests duration recorded (D-25), before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `lib/__tests__/json-ld.test.ts`: covers SEO-04 (parse, escape, precision, no license, text equality).
- [ ] `e2e/photos-region.spec.ts`: the D-01 navigation checks as permanent tests, plus D-08/D-09 behaviour.
- [ ] D-03 reserved-word/collision test.
- [ ] `client-graph.test.ts`: add `data/regions/regions.json` to `SERVER_ONLY_MODULES`.
- [ ] `e2e/audit.spec.ts`: a sweep timeout that scales with `AUDIT_SWEEP.length` (Pitfall 3).

## Security Domain

`security_enforcement` is absent from `.planning/config.json`, so it is treated as enabled.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | static public pages |
| V5 Input Validation / Output Encoding | yes | URL segment matched against closed id sets in `proxy.ts` (exact, case-sensitive); JSON-LD `<` → `\u003c`; region data validated by zod `Regions` |
| V6 Cryptography | no | (nonce generation unchanged) |
| V14 Config / Headers | yes | the CSP is unchanged; the data block needs no nonce (measured) |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Reflected path echo in the 404 flight payload (T-12-03) | Information disclosure | Region misses go through `neutral404` (`/photos/_`); measured: no token in the HTML or flight data |
| `</script>` breakout from editorial/registry text in JSON-LD | Tampering (XSS) | `jsonLdHtml` escape; the spike's `<script>alert(1)</script>` name came out as `\u003cscript` and parsed back |
| Location over-disclosure via JSON-LD | Information disclosure | D-19 precision equality test; no GPS altitude; no `site.location` (D-20) |
| Spoofed `x-edge-section` | Tampering | Unchanged: the proxy deletes the visitor's copy (T-12-02) |
| Deeper-path echo (`/photos/regions/<id>/<x>`) | Information disclosure (low) | Existing accepted residual, same as `/photos/<slug>/<x>` today; not widened by this phase |

## Sources

### Primary (HIGH confidence)
- **Live spike** in a disposable worktree at `57d87a5`, Next 16.4.5, webpack dev and Turbopack prod, Edge/Firefox via Playwright 1.65 (all results above).
- **Bundled docs:** `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`; `03-file-conventions/intercepting-routes.md`, `parallel-routes.md` (:76-105, :469-485), `default.md`.
- **Next source:** `node_modules/next/dist/lib/generate-interception-routes-rewrites.js`; `node_modules/next/dist/build/webpack/loaders/next-metadata-image-loader.js`.
- **npm registry and tarball** for schema-dts 2.1.0 / schema-dts-lib 1.1.0; the `gsd-tools package-legitimacy` verdicts.
- **Repo files read this session:**
  - `proxy.ts`, `lib/photos/{routes,view-model,stepping}.ts`, `components/photos/{PhotoViewer,LightboxDialog}.tsx`, `lib/og/template.tsx`;
  - `app/(site)/photos/**`, `app/sitemap.ts`, `app/layout.tsx`, `lib/saved-pages.ts`, `app/(site)/offline/page.tsx`;
  - `e2e/{routes,seo.spec,audit.spec,not-found.spec}.ts`, `lib/__tests__/{photo-routes,client-graph,audit-routes,proxy}.test.ts`;
  - `scripts/photos/build-photo-data.mjs`, `data/schemas/{region,photo}.ts`, `data/regions/regions.json`, `data/generated/{photos,plates}.ts`, `lib/home-format.ts`;
  - `.github/workflows/ci.yml`, `playwright.config.ts`, the Phase 16 review and disposition files, 13-LEDGER #32.
- **gh run view:** E2E durations for 5 recent CI runs.

### Secondary (MEDIUM confidence)
- Google Search Central, image metadata: https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata (required and recommended properties; markup per image instance).
- Milestone research: ARCHITECTURE §3/§7/anti-pattern 9, PITFALLS 7/8/17/18, FEATURES PLAT-F1/D-D, STACK §4.3.

### Tertiary (LOW confidence)
- E2E time estimates per added test (Assumptions A2, A3).

## Metadata

**Confidence breakdown:**
- Routing / proxy: HIGH. Measured under both bundlers, with negative evidence for the null slot page.
- v2.0 byte stability: HIGH. Hashes and markup compared against a baseline build.
- JSON-LD / CSP: HIGH for Chromium and Firefox (measured) and the guide (cited); MEDIUM for WebKit until the CI audit gate runs.
- Client JS budget: HIGH for the routing changes (measured, 0 B); MEDIUM for the PhotoViewer estimate.
- CI duration: MEDIUM. Measured history, estimated growth.

**Research date:** 2026-11-23
**Valid until:** 2026-12-23 (stable; re-verify if Next moves past 16.4.x)
