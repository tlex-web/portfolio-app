# Phase 17: Region Routes, SEO & Structured Data - Context

**Gathered:** 2026-11-23
**Status:** Ready for planning
**Branch:** `gsd/phase-17-region-routes-seo-structured-data`, local, cut from the Phase 16 tip `285b6d5` (Tim chose "New branch from Phase 16 tip (Recommended)"). The merge order is 14 → 15 → 16 → 17.

<domain>
## Phase Boundary

Every region and every photo gets its final, crawlable URL before Phase 18 designs the layout:
- **Region pages:** each region has a page on its own path (fixed by the spike, D-01) that never collides with a photo slug.
- **Photo pages:** all 11 photos have `/photos/<slug>` pages. The v2.0 four answer exactly as before, with no redirects, and the seven new photos get the same deep-linkable page.
- **Per-region metadata:** each region page has its own metadata, Open Graph card and sitemap entry.
- **Structured data:** pages carry JSON-LD that parses.
- **Offline page:** its saved-pages list knows the new pages.

Requirements: PHOTO-05, REGION-07, SEO-04, EDGE-03.

**Not in this phase (Phase 18):**
- the overview UI on `/photos`;
- the designed region page (sequence, plate, collar, rail);
- per-region stepping;
- the retired view switch;
- any change to an existing page's pixels.

The `/photos` light table stays at the four v2.0 photos (16 D-15). Region pages stay unlinked from the nav. A visitor reaches them from the sitemap and from the new photos' back links.

</domain>

<decisions>
## Implementation Decisions

### Region path
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

### New photo pages
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

### Region page and OG card
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

### JSON-LD (SEO-04)
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

### Offline saved pages (EDGE-03)
- **D-22: The `lib/saved-pages.ts` catalog includes the region pages and all photo pages,** so the `/offline` `SavedPages` list shows any of them a visitor has opened. Region entries get a section label beside 'Photograph' and 'Project' (wording at Claude's discretion, see below).

### Housekeeping carried into this phase
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md`: Phase 17 section (goal, 5 success criteria, research flags, UI-SPEC note, scope notes from Phase 13).
- `.planning/REQUIREMENTS.md`: PHOTO-05, REGION-07, SEO-04, EDGE-03 (and REGION-01..06, PHOTO-06..08 as Phase 18 boundaries).
- `.planning/PROJECT.md`: Key Decisions rows of 2026-11-12 (`/photos/<slug>` kept, region pages on a non-colliding path, JSON-LD without `license`, coarse locations) and the 2026-11-23 Phase 16 rows.

### Prior phase decisions
- `.planning/phases/16-new-regions-alps-overview-data/16-CONTEXT.md`:
  - D-01..D-04: precision levels, coarse and aerial rules;
  - D-13: region names, with the note that region ids become public URL segments;
  - D-15: the light-table pin and the "churn baselines once, in Phase 18" rule.
- `.planning/phases/15-region-plate-data-model/15-CONTEXT.md`: D-16..D-19 (one photo URL builder, the source scan, `regionHref` deferred to Phase 17).
- `.planning/phases/16-new-regions-alps-overview-data/16-REVIEW.md` and `16-REVIEW-DISPOSITION.md`: IN-01..IN-09 to fix (D-23).
- `.planning/phases/16-new-regions-alps-overview-data/deferred-items.md`: time-zone label (D-26).
- `.planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md` #32: 13 IN-03 (D-24).

### Research
- `.planning/research/ARCHITECTURE.md`:
  - F7: the intercept matches every descendant;
  - F8: sibling dynamic names are a hard error;
  - §3: the URL options table and interception after the move;
  - anti-pattern 9: JSON-LD in the modal or with a nonce.
- `.planning/research/PITFALLS.md`:
  - Pitfall 7: the URL change vs the intercept, the proxy's two-segment regex and `dynamicParams`, with the static-sibling row rated LOW and needing a spike;
  - Pitfall 8: link previews and redirects.
- `.planning/research/FEATURES.md`: PLAT-F1 JSON-LD (Google image metadata rules, per-page types, `<` escaping), D-D (no `license`).
- `.planning/research/STACK.md`: `schema-dts` row and §4.3 "PLAT-F1: JSON-LD under the nonce CSP".

### Next.js 16.4.5 bundled docs (AGENTS.md: read before writing Next code)
- `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`
- `node_modules/next/dist/docs/01-app/` intercepting-routes and parallel-routes docs: `(.)` counts segments and slots are excluded; `default.js`; soft-navigation slot persistence.
- `node_modules/next/dist/docs/` `image-response.md`: the OG renderer rules used by `lib/og/template.tsx`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`lib/photos/routes.ts`:** `photoHref`, plus `photoRouteSlugs`, which is pinned to `lightTableIds` with a load-bearing `/* @__PURE__ */`. `regionHref` goes here (D-06), and the published-photo set replaces the pin for routes (D-07).
- **`lib/og/template.tsx`:** the shared OG template.
  - `OgFrame` has photo and project variants.
  - `contourDataUrl` draws the contour field; it currently reads the Matterhorn `terrain`. The region card needs the region's own plate (D-12).
  - Fonts come from disk and colours from `tokens`.
- **`app/(site)/photos/[slug]/opengraph-image.tsx`:** the per-photo card. Its `generateImageMetadata` comes with no `generateStaticParams` / `dynamicParams` (12-14 deviation), the pattern a region card route must follow.
- **`lib/photos/view-model.ts`:**
  - `photoBySlug`, `photoSlugs`, `photoViews`, `photoMetadata`;
  - `view.rights`, the D-17 copyright text;
  - the precision-aware coordinate formatting from 16-06, the D-19 rounding source.
- **`lib/home-format.ts`:** `formatYearRange` (used by `lib/ascent/summit.ts`), for a gallery year span.
- **`lib/saved-pages.ts`:** the catalog of nav pages, photos and projects, with a section `label` (D-22).
- **`data/regions/regions.json`:** `id`, `name`, `country`, `plate`, `facts`. `cover` is added (D-13). `data/schemas/region.ts` validates it.
- **`data/site.ts`:** `name`, `role`, `url`, `links.github`, `links.linkedin` (D-20).
- **`data/generated/plates.ts` and `overview.ts`:** server-only. `lib/__tests__/client-graph.test.ts` now walks every `'use client'` file (16 WR-04), so region pages must not pull either into a client chunk.

### Established Patterns
- **One URL builder plus a source scan** (15 D-16..D-18): the `photo-routes` test fails on any hand-built photo path. Extend it to region paths.
- **Neutral 404:** `proxy.ts` matches `DETAIL_PATH = /^\/(photos|projects)\/([^/]+)$/` against `KNOWN` and serves `/<section>/_`, so a typed slug is never echoed. A region path has three segments and is outside that regex today (D-05).
- **Static params with no dynamic params** (`dynamicParams = false` + `generateStaticParams`) on detail pages.
- **Audit gate:** `e2e/audit.spec.ts` reads `ROUTES` (one representative per template, three engines, three widths) and `AUDIT_SWEEP` (every other sitemap path) from `e2e/routes.ts`. Region pages need a `ROUTES` representative; new photo pages join the sweep.
- **Pixel neutrality:** Visual Regression with no baseline update, and `check-snapshot-commit --none` on every commit (D-10).
- **Package checkpoint** (16-09): an exact pin, registry facts, the bundled npm, and Tim's "verified" before the install (D-21).

### Integration Points
- **`app/(site)/photos/`:** `[slug]/page.tsx`, `@modal/(.)[slug]/page.tsx`, `@modal/default.tsx`, `@modal/page.tsx` and `layout.tsx` (the slot). The region route lands beside them (D-01).
- **`components/photos/PhotoViewer.tsx`:** stepping controls, counter and the "All photographs" link (D-08, D-09).
- **`components/photos/LightboxDialog.tsx`:** `PHOTO_PATH` / `slugOf` (D-24).
- **`app/sitemap.ts`, `proxy.ts`, `lib/saved-pages.ts`, `e2e/routes.ts`:** these route sets grow with D-07 and the region pages.
- **`scripts/photos/build-photo-data.mjs`:** `TIME_ZONE = 'Europe/Zurich'` (D-26).

</code_context>

<specifics>
## Specific Ideas

- The OG region card sits beside the photo cards: same frame and type. Only the subject (the cover photo) and the contour field (the region's own plate) change.
- Each JSON-LD text field is the exact string the page already prints: the rights line, the coordinates at the shown precision, and the name. Nothing in the markup is more precise or more permissive than the page.
- "Photographs" stays the current nav item on region pages through the `/photos` prefix, with no new nav entry until Phase 18.

</specifics>

<deferred>
## Deferred Ideas

- **To Phase 18:** per-region Previous/Next stepping for every photo (D-08), the designed region page, screenshot baselines for the new pages (D-10), linking region pages from the nav and `/photos`, and a visible breadcrumb.
- **Optional for Phase 18:** reuse the D-13 `cover` for the region header.

</deferred>

---

*Phase: 17-region-routes-seo-structured-data*
*Context gathered: 2026-11-23*
