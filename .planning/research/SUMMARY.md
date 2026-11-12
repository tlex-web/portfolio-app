# Project Research Summary

**Project:** Tim Lui portfolio, milestone v2.1 "Survey Expansion" (subsequent milestone; v2.0 shipped and tagged)
**Domain:** Photographer-engineer portfolio in a Swiss "topographic survey" identity (Next.js 16.4.5 / React 19.3 / Vercel Hobby, build-time geodata, nonce CSP, heavy guard and baseline suite)
**Researched:** 2026-11-12
**Confidence:** MEDIUM-HIGH (repo facts and executed data probes are HIGH; platform rules MEDIUM; video bitrates, DJI metadata and a few licence wordings LOW)

Detail lives in `STACK.md`, `FEATURES.md`, `ARCHITECTURE.md` and `PITFALLS.md` in this folder. This file does not repeat them. It resolves what they agree on, flags where they disagree, and turns that into phases.

> **Orchestrator note (2026-11-12):** two Phase 1 items below already landed after the v2.0 close and are not v2.1 work: the axe 4.14 upgrade with the `label-content-name-mismatch` fixes (`0b1a467`, `42f4bb4`, 14 links), and the hanging browser install (E2E runs in the Playwright image since quick task 261106-mzc). Treat them as done when scoping requirements.

## Executive Summary

v2.1 grows a one-mountain site into a multi-region survey: region photo series, an Alps-wide contour overview with one pin per region, a local terrain plate per region, an immersive photo layout, drone video, five deferred features and the v2.0 debt. The four files agree on the central point: **this is a data-model and pipeline refactor first, and a UI project second.** Today "all photos" and "the Matterhorn waypoints" are the same list (Home, footer ticks, `lowestDemM`, test indexing, the single DEM extent). The first new photo would change Home and break the build. The safe path is a zero-visible-change refactor (explicit `homeWaypointIds`, a Region + Plate model, an N-plate terrain builder that keeps Zermatt's hashed files byte-identical, a `photoHref` helper) before any content or new UI lands.

The most useful finding is in the stack research. **swissALTIRegio already covers most plausible Italian and Austrian launch regions** (executed probes: Aosta, Cervinia, Gran Paradiso, Como, Ortler, Garda, Val Gardena/Seceda, Innsbruck, Ötztal, Zugspitze are inside; Cortina, Tre Cime, Braies, Grossglockner, Hallstatt are outside). Its foreign parts are TINITALY and DGM Österreich, and the site already credits them. If launch regions sit inside that rectangle, v2.1 needs **no second elevation source, no new library and no new attribution** for local plates. This contradicts the PROJECT.md assumption of a second source, and the owner should decide it before the terrain phase is planned. The only source that is always new is Copernicus GLO-90 for the overview map.

The main risks are all regressions in guarded territory: Home drifting, Zermatt terrain hashes changing, URL/redirect/intercept/proxy-404 breakage if photo URLs move, visual baselines hiding real diffs inside intended ones, drone footage leaking location or blowing the Hobby transfer cap, and required-check deadlocks from `[ci skip]` heads. Mitigation is ordering plus explicit gates: repo safety first, a pixel-neutral data split with unchanged hashes and baselines, one re-baseline per cause, same-origin loops only for video, and data-generated exact redirects.

## Key Findings

### Recommended Stack (STACK.md)

The v2.0 stack stays. Additions are small and mostly build-time.

**Core additions:**
- **swissALTIRegio (existing)**: local plates for every region inside 4.5-12.0 E / 44.8-48.8 N. One CRS (LV95), 10 m, hole-free, attribution already shipped. Adding a region is a new extent, not a new pipeline.
- **Copernicus GLO-90**: Alps overview only. 72 one-degree COGs, no auth. Unsmoothed 1,000 m contours measured 43 KB brotli, so plan smoothing and ring filtering. It is a DSM, so never use it for local plates.
- **BEV ALS DTM 1 m (Austria) / TINITALY 1.1 (Italy)**: only for regions outside the swissALTIRegio rectangle. BEV range-reads fine with the installed geotiff 3.0.5. TINITALY needs a manual tile download (access unverified).
- **proj4 2.22.0 (devDependency, only if a non-LV95 plate exists)** and **schema-dts 2.1.0 (types only)** for JSON-LD.
- **Existing ffmpeg/`clip:derive` pipeline for drone loops**: same-origin MP4 (optionally AV1 first) needs no CSP change. The installed ffmpeg lacks SVT-AV1 (the Gyan full build adds it).
- **No new library** for Web Share (feature-detect plus copy-link), LV95 display (`wgs84ToLv95` exists), JSON-LD (native script tag, no nonce needed, escape `<`), or the terminal controls.

**Critical constraints:** never warp rasters (window on the native grid, transform points only); one DEM source per plate, never a blend; geotiff.js returns zeros silently for out-of-bounds windows (bounds-check and fail on min = max = 0); Hobby has 100 GB/month shared transfer and a 30-day pause on overrun, so films cannot be self-hosted.

### Expected Features (FEATURES.md)

**Must have (table stakes):**
- Region data model; Zermatt (existing 4 plus new photos) plus 1-2 new regions, at least one IT or AT
- Region index synced with the overview map (the text list is the accessible and mobile path); numbered pins on narrow screens
- Region page: header and facts, local plate, uncropped immersive sequence with always-visible data captions, next-region block
- Lightbox scoped to one region, with an end-of-series card instead of silent cross-region stepping
- Old `/photos/<slug>` links and OG cards keep working; Home waypoint links updated
- Per-region extent and DEM attribution (a licence obligation, not polish); region metadata, OG cards, sitemap
- PHOTO-F2 Share with honest "Copy link" fallback, PHOTO-F4 LV95 (CH photos only, rounded to 10 m), ENG-F1 prev/next plus `<details>` transcript, PLAT-F1 JSON-LD
- PLAT-F2 is **already shipped** (`components/site/SavedPages.tsx` plus `lib/saved-pages.ts`, 12-15 EDGE-02). Treat it as "extend the catalog to region pages and the new photo URLs", and narrow or mark the requirement in REQUIREMENTS.md.
- Drone loops (if the video shape includes loops): poster-first, visible pause (WCAG 2.2.2), off under reduced motion and Save-Data

**Should have (differentiators, v2.1.x):**
- Map-collar frame with coordinate ticks (outside the photo, never over it); sequence-as-ascent altimeter rail; sticky mini plate
- Overview as a sheet index (extent rectangles, borders, 3-5 reference summits); overview-to-plate morph
- Lightbox thumbnail index (once a region passes about 12 photos)

**Defer:** films with sound and captions (after a hosting/CSP decision), clips inside the lightbox, flight paths from telemetry, PHOTO-F1/F3, PLAT-F3/F4 (explicitly out of v2.1).

**Anti-features to hold the line on:** slippy maps, pin-clustering libraries, scroll-snap, parallax/Ken Burns, overlays on photos, auto-advancing slideshows, social share rows, LV95 on non-Swiss photos, YouTube/Vimeo embeds by default.

### Architecture Approach (ARCHITECTURE.md)

Separate the **plate** (terrain sheet: source raster, extent, assets) from the **region** (editorial series pointing at one plate). Home keeps pointing at the `matterhorn` plate directly, so Zermatt can later get a larger plate without moving Home. Photo-to-region membership is explicit, not inferred from GPS. All reprojection happens once in the networked fetch step (committed, sha256-pinned square metric grid), so `terrain:build --check` stays deterministic. Asset names stay flat and prefixed (`/terrain/aosta-contours-hero.<hash>.svg`), which keeps five regexes and cache rules unchanged. One builder run owns all plates (a per-plate run would delete the others' files). The footer stays the home sheet; each region page renders its own `SheetMargin`.

**Major components:**
1. `data/regions/regions.json` + `data/terrain/plates.json` + `lib/photos/routes.ts`: the registries (JSON so `.mjs` generators read them; a slim route list so the proxy stops importing the view-model)
2. N-plate `terrain:build` plus fetch adapters per product, and a pure `lib/geo/laea.ts` (and `utm.ts` only if needed)
3. `photoHref`/`regionHref` plus a split view-model (`homeWaypoints` vs `seriesViews(region)` vs `photoViews`)
4. `SheetMargin` (extracted from `SiteFooter`, zero visual diff), `ContourField(plate)`, `PlateSheet` (generalised `MapSheet`), new `AlpsOverview`
5. Routes under `app/(site)/photos/` with the `@modal` slot moved or extended; `next.config` redirects for the four frozen legacy slugs; `ShareButton`, `JsonLd`, `FlyoverClip`, `TerminalTranscript`

### Critical Pitfalls (PITFALLS.md, top picks)

1. **One photo list drives Home, footer ticks, `lowestDemM`, tests and the DEM extent.** The first new photo changes Home or throws. Fix: explicit `homeWaypointIds`, per-region plates, named test fixtures, all in a pixel-neutral commit (48 baselines unchanged).
2. **Generalising the pipeline changes Zermatt's bytes**, renaming every hashed terrain file, changing the SW precache and diffing all 48 baselines. Fix: refactor to N plates with `terrain:build --check` green against the existing artifacts and identical hashes before adding a second plate.
3. **Building a second DEM pipeline you may not need, or blending sources in a plate.** Fix: check the region footprint first; one source per plate; Copernicus (a DSM) for the overview only; record source, CRS, height system and edition per plate.
4. **Drone material leaks through paths the guard never scans** (`.SRT`/`.LRF` sidecars, `djmd` tracks, XMP, aircraft altitude, filename-id collisions). Fix: sources stay in gitignored `assets/`; ban the extensions in the guard; route every clip through `build-clip.mjs`; keep the sidecar schema closed; use an explicit id map.
5. **URL restructuring collides with the intercepting route, the proxy's two-segment 404 regex and `dynamicParams`**, and the redirects must be exact, one-hop, and also cover OG card URLs (the card path embeds a hash of the parent route). Fix: centralise `photoHref` first, generate exact redirects, extend the proxy and tests, add `@modal` defaults and a null `@modal/[region]`.
6. **Baseline churn hides real regressions** (Playwright 1.65, footer, layout, new routes, content). Fix: stage one re-baseline per cause, with Playwright 1.65 alone first and new routes with `update_mode=missing`.
7. **Required checks deadlock or pass vacuously** (`[ci skip]` heads stay Pending; direct pushes still deploy). Fix: one aggregate `CI OK` check, a ruleset on `main`, verify through `gh api`; Tim applies the settings change. The existing `automated-actions` ruleset targets no branch and enforces nothing.
8. **The Upstash limiter fails open silently** (it reads only `UPSTASH_*`; Marketplace may inject `KV_*`). Fix: check names with `vercel env ls production`, probe for a 429 on the sixth honeypot POST, fail closed in production.

## Where the research files disagree (needs an owner decision, do not pick silently)

| # | Topic | Position A | Position B | Synthesizer lean |
|---|---|---|---|---|
| 1 | **Photo URL scheme** | ARCHITECTURE (and FEATURES option A): nested `/photos/[region]` + `/photos/[region]/[slug]`, 308 for the 4 frozen legacy slugs, plus a redirect for the old OG card URLs, `@modal/(.)[region]/[slug]` plus null `@modal/[region]`, proxy regex rework. About 20 source files, about 15 e2e specs and baselines touched. Readable hierarchy, matches the PROJECT.md wording. | PITFALLS: keep `/photos/[slug]` canonical (slugs are globally unique) and give series their own namespace (`/series/[region]` or `?series=`). Zero redirects, old OG cards untouched, no proxy 404 regression. FEATURES option B (`/photos/series/[region]`) is the same idea, but PITFALLS notes the static-sibling intercept case is unverified. Photo URL no longer says which series, and a photo belongs to exactly one series. | The decision is the owner's. Technical lean: B is cheaper and safer for the "links and OG cards keep working" promise. A is the better long-term hierarchy and its risk is bounded because the legacy set is closed (4 slugs). Whichever is chosen, do the `photoHref` centralisation first so the flip is one line. |
| 2 | **Footer attribution** | ARCHITECTURE: footer stays the home sheet; each region/overview renders its own `SheetMargin` (layouts do not re-render on soft navigation, so a route-aware footer goes stale). | FEATURES/STACK/PITFALLS: the footer legend or a sources list must show the sources used on the current page, or a linked `/attributions` page (Copernicus needs the liability sentence). | Lean ARCHITECTURE for extent and "last surveyed", plus a footer link to one sources/attributions page listing every credit. Confirm the licence is satisfied by credit next to the data it feeds. |
| 3 | **Immersive image fit** | FEATURES: `object-fit: contain` on gallery-black, never cropped (a locked v2.0 rule). | PITFALLS: "use `object-fit: cover`" to handle full-bleed sizing. | Follow FEATURES (contain). Cover would crop compositions and contradicts the locked decision. Keep the 2,560 px cap and write per-breakpoint `sizes`. |
| 4 | **Carousel at 20+ photos** | FEATURES: retire it (regression flag: remove PHOTO-02, redirect `?view=carousel` to Grid, rewrite its tests, do not delete them). | ARCHITECTURE/PITFALLS: keep it, scoped to one series with windowed textures (current +/- 2). | Owner's call (see decisions). Retiring is less work, but removes a shipped view, so it needs an explicit decision and a test contract table. |
| 5 | **Drone video placement and shape** | STACK/FEATURES: silent autoplaying loops, with a pause control, inline in the sequence at their altitude position. | ARCHITECTURE: at most one flyover per region in a series-page slot, click-to-play, `preload="none"`; inline and lightbox video later. PITFALLS: a short loop plus a click-to-load "watch" rendition. | All agree: same-origin progressive MP4, no CSP change, no films on Hobby. Lean to ARCHITECTURE's slot first (smallest surface), then inline loops if budget allows. The byte budgets differ (STACK loop <= 4 MiB, ARCHITECTURE drone <= 6 MiB, PITFALLS <= 3 MB loop and <= 15 MB watch). Settle one budget after encoding a real clip. |
| 6 | **Overview map construction** | STACK: Copernicus GLO-90, plate carree scaled by cos(46.5 deg), 1,000 m interval, <= 30 KB brotli target (needs a spike). | ARCHITECTURE: EPSG:3035 LAEA with a pure `lib/geo/laea.ts`, 500 m interval, <= 250 KB served. PITFALLS: 250-500 m interval, <= 150 KB. | Take STACK's measured numbers as the starting point (they are executed). Use LAEA only if the overview must be measurable. Fix interval, size budget and projection in one spike. |
| 7 | **Where reprojection happens** | STACK: window each plate on the source's native grid, transform only points, proj4 devDependency. | ARCHITECTURE: resample into a square metric grid in the fetch adapter (bilinear), plus hand-written pure projection code. | Compatible if resampling is limited to the fetch step and `build-terrain` stays source-agnostic. Irrelevant if all regions are inside swissALTIRegio. |
| 8 | **PLAT-F2 persistence** | PITFALLS: keep the page cache across deploys so the saved list does not empty. | FEATURES/ARCHITECTURE: the reset on deploy is correct (EDGE-02 stale-page protection). | Keep v2.0 behaviour and only extend the catalog. Changing cache retention risks the stale-page protection, and a deploy-surviving list is optional polish. |
| 9 | **Where the lightbox Escape-focus fix lands** | PITFALLS: in the debt phase. | ARCHITECTURE: fold it into the `PhotoViewer` rewrite. | Diagnose and add the regression test early; fix wherever `PhotoViewer` is actually rewritten, with one declared PNG set. |

## Decisions the owner must make

Before or during roadmapping. Each changes what gets built.

| # | Decision | Options | Why it matters / recommendation |
|---|---|---|---|
| D1 | **Launch regions vs the swissALTIRegio footprint** (blocks the terrain phase) | Inside the rectangle (Aosta/Cervinia/Gran Paradiso, Como, Ortler, Garda, Val Gardena, Innsbruck, Ötztal) vs outside (Cortina, Tre Cime, Braies, Hohe Tauern, Salzkammergut) | Inside means no new source, library or credit. Outside means a new fetcher, proj4, a CRS field, a new credit line and per-source attribution. Recommend an inside-the-footprint region for launch. Also decide which real photos exist, since regions follow Tim's originals. Note the Zermatt-region Monte Rosa area may need a larger plate. |
| D2 | **Photo URL scheme** | Nested (A) vs flat plus series namespace (B), see the disagreement table | Blocks routing, Share, JSON-LD, sitemap and Home links. Also decide: do cached old OG card URLs need an explicit redirect (the card hash changes under nesting), or is "crawlers re-fetch the page" acceptable? |
| D3 | **Drone video shape, hosting and format** | Loops only (recommended), films only, both. Films need an external host (Bunny or YouTube-nocookie facade, one `frame-src` origin) | Loops fit the repo, CSP and Hobby. Films cannot be self-hosted (about 740 full 135 MB plays exhaust the site's monthly transfer). Also: AV1 rendition (needs the Gyan full ffmpeg) or H.264 only; a graded SDR Rec.709 master from Tim; where the per-clip byte budget lands. |
| D4 | **Carousel at 20+ photos** | Retire (immersive sequence takes over) / keep scoped to a series / keep only inside a region | Retiring removes a shipped view (PHOTO-02): needs a `?view=carousel` redirect and a test contract table (GUARD-03). |
| D5 | **JSON-LD `license`** | Omit (recommended: creator + copyrightNotice + creditText only) vs add an "Image rights" page and `license` | `license` gives a "Licensable" badge but implies a licensing page, and print licensing is out of scope. |
| D6 | **Overview-map source and construction** | GLO-90 plate carree (STACK) vs LAEA; contour interval; whether to include borders and reference summits; whether a hillshade poster backs the contours | Borders need their own source and licence. Size budget (30 vs 150 KB) is unresolved. Needs a short spike. |
| D7 | **Footer and attribution model** | Footer stays home sheet plus in-page `SheetMargin` plus a sources page, vs a route-aware footer | See disagreement 2. Per-source credit text must be verbatim from the licence (BEV and Copernicus GLO-90 wording unconfirmed). |
| D8 | **Series layout choices** | Region order (west to east vs by date), whether the map collar, altimeter rail and sticky mini plate are in v2.1 or v2.1.x, nav hide-on-scroll or not | Scope control for the largest UI phase. FEATURES puts the collar, rail and mini plate at P2, and recommends the base sequence first. |
| D9 | **Privacy rules for new material** | Per-photo precision override (4 dp default, coarser or approx. for dwellings and take-off points); aerial photos without altitude or labelled as ground height; explicit id map for DJI and second-camera filenames | Location data in git history is not recoverable (D-12). Decide before the first new original is ingested. |
| D10 | **Repo settings (Tim applies them)** | The `main` ruleset JSON, Vercel Deployment Checks (Hobby availability unconfirmed), disable or replace the inert `automated-actions` ruleset, and the Upstash fail-closed behaviour | Settings changes are Tim's, never applied by an agent. |

## Implications for Roadmap

Suggested phase structure (7 phases). The order follows PITFALLS' phase types (debt, data, terrain, routing, layout, video) and ARCHITECTURE's dependency order, with ENG-F1 as an independent filler.

### Phase 1: Repo safety and test-debt foundation
**Rationale:** The refactors in phases 3-5 are large. Required checks must block a red `main` before they land, and the Playwright 1.65 bump must land alone before any intended pixel change.
**Delivers:** Aggregate `CI OK` job plus a `main` ruleset (JSON reviewed, applied by Tim, verified via `gh api`; a red test PR cannot merge); `[ci skip]` handling; Playwright 1.65 and container tag in one commit; Upstash name check plus a production 429 probe plus fail-closed in production; axe 4.14 upgrade with the 4 real `label-content-name-mismatch` fixes (already done, see the orchestrator note); Nyquist G5/G6 characterization tests (before the photo-script refactor); audit gate over templates x engines plus all slugs once in Chromium; Playwright install timeout (already resolved by the Playwright image, see the orchestrator note); open review-ledger triage.
**Addresses:** the v2.0 debt (repo safety, test gaps).
**Avoids:** Pitfalls 10, 11, 15, 16, 23, 24.

### Phase 2: UI debt fixes and ENG-F1
**Rationale:** Each fix is small and independent, and each needs its own declared PNG set before any layout re-baseline. ENG-F1 is independent of the region work.
**Delivers:** 375 px Home overflow (find the element, never `overflow-x: hidden` on `body`/`main`), mobile menu on the current page (close in the click handler), clipped focus ring, the 4.81:1 rail label (composed contrast), lightbox Escape focus diagnosed with a regression test; ENG-F1 prev/next buttons plus a server-rendered `<details>` transcript (open under reduced motion).
**Addresses:** UI debt list, ENG-F1.
**Avoids:** Pitfalls 10, 21, 22.

### Phase 3: Data model split and N-plate refactor (zero visible change)
**Rationale:** Everything downstream (overview, region pages, footer, OG, JSON-LD, LV95 gate) reads regions and plates. Building UI on single-region data means building it twice.
**Delivers:** `photoHref`/`regionHref` replacing the 13 hand-built URLs (still `/photos/<slug>`); `lib/photos/routes.ts`; `homeWaypointIds` (the four ids, frozen) with `buildWaypoints`/`lowestDemM`/footer ticks reading it; Region and Plate schemas with `regions.json` (Zermatt only) and `plates.json` (matterhorn only); `terrain:build` over N plates with prefixed names and one global stale sweep; `SheetMargin` extracted from `SiteFooter`; `ContourField(plate)` and `PlateSheet`; guard extension (ban `.srt/.lrf/.gpx/.kml/...`), closed sidecar schema, explicit photo id map, `country` field per photo; the four asset-root lists reconciled by a test; named test fixtures instead of index lookups.
**Gate:** all 48 visual baselines unchanged, `data:check` green, Zermatt terrain hashes equal to today's.
**Avoids:** Pitfalls 1, 2, 5, 19, 23.

### Phase 4: Terrain content, new regions and the overview
**Rationale:** Needs the phase-3 model and human inputs (D1, new originals, editorial copy).
**Delivers:** Region extents; plate fetch from swissALTIRegio (second-source adapter only if D1 requires it); the overview raster, contours and region pins; new photos through exif, derive and build (plus any new Zermatt photos); per-plate source, CRS, height system and edition recorded; per-plate size-budget Jest test; the footprint check recorded; proj4-vs-`lib/geo.ts` error measurement at the far pins (add proj4 only if it exceeds about 1 m or a non-LV95 plate exists).
**Uses:** swissALTIRegio, GLO-90, geotiff 3.0.5, optional proj4 2.22.0.
**Avoids:** Pitfalls 3, 4, 6 (overview weight).

### Phase 5: Routing, SEO and structured data
**Rationale:** Layout work should happen on the final routes, and JSON-LD `url`/`@id` need the final paths.
**Delivers:** the D2 route shape; data-generated exact one-hop redirects (and old OG card handling if nested); proxy and `KNOWN` rework with an unknown-region, cross-region and unknown-slug 404 matrix; `@modal` defaults and a catch-all or null slot; sitemap equal to canonicals; region OG cards; saved-pages catalog extended (PLAT-F2 narrowed); PLAT-F1 JSON-LD (Person/WebSite, ImageObject, region ImageGallery, project types) with a parse, escape and 4-dp test; no duplicate view-transition names; no internal 3xx links.
**Avoids:** Pitfalls 7, 8, 9, 17, 18.

### Phase 6: Immersive layout, overview map UI and photo features
**Rationale:** The largest UI surface. It needs the UI-SPEC step (the project requires the ui-ux-pro-max skill for UI work), the final routes, and data for 20+ photos.
**Delivers:** `/photos` overview map with a synced region list and numbered pins on narrow screens (label placement at build time, HTML pin overlays, no `href` inside served SVGs); region page with uncropped sequence on gallery-black, data captions, breadcrumb, "n / N", skip-series, next-region block; lightbox scoped per region with the end-of-series card; per-region `SheetMargin`; PHOTO-F2 Share with a Copy-link fallback; PHOTO-F4 LV95 gated on `country === 'CH'`, rounded to 10 m; the D4 Carousel outcome; photo-page LCP budget; HOME-08 re-run; one deliberate re-baseline per route group with declared PNG sets, content drops last.
**Addresses:** the region series, map model and immersive layout goals. Collar, altimeter rail and mini plate follow D8.
**Avoids:** Pitfalls 6, 9, 10, 12, 20.

### Phase 7: Drone video
**Rationale:** The format decision can be taken early, but the slot needs the phase-6 series page.
**Delivers:** the D3 shape; per-kind clip budgets (never a raised global `MAX_CLIP_BYTES`); optional AV1 rendition; a guard rule for `av01`; a DJI-shaped selftest fixture (with `djmd` track and `uuid` box); poster with a fixed aspect ratio; pause control and text alternative; reduced-motion and Save-Data gating; a `public/media` total-bytes guard and a Hobby transfer projection written down.
**Avoids:** Pitfalls 2, 13, 14.

### Phase Ordering Rationale
- Repo safety first, because phases 3-5 are big refactors and required checks must exist before they land. Playwright 1.65 lands alone, ahead of any intended pixel change.
- Data before maps, URL helper before URL change, routing before layout: each avoids doing work twice.
- Phases 3 and 4 are separate on purpose. Phase 3 proves the refactor is pixel- and hash-neutral before content arrives.
- Content drops are batched last and re-baselined once. The footer is made independent of the photo count in phase 3, so adding a photo never touches 48 PNGs.
- ENG-F1, PHOTO-F4 and the PLAT-F2 catalog extension are independent of the region work and can fill gaps.

### Research Flags

Needs deeper research during planning (`/gsd-plan-phase --research-phase <N>`):
- **Phase 4 (terrain):** spike the footprint check of the chosen regions, proj4 vs `lib/geo.ts` error at the far pins, the overview size target (smoothing, ring filtering), and the overview licence wording. If any region is outside the rectangle, also BEV credit wording and TINITALY tile access.
- **Phase 5 (routing):** spike that `@modal/[region]` and `@modal/(.)[region]/[slug]` coexist in 16.4.5 under both webpack (dev) and Turbopack (build); check how the old OG card URL redirects under nesting; if option B is chosen, verify the static-sibling intercept case.
- **Phase 6 (layout):** needs a UI-SPEC (`/gsd-ui-phase`) first. Open items: overview label collision at 375 px, immersive `sizes` and LCP, JS-budget margin (HOME-08 has 6.2%).
- **Phase 7 (video):** encode one real 8 s clip and record bytes before fixing any budget; confirm hosting only if films are in scope.

Standard patterns (skip research-phase):
- **Phase 1:** known GitHub ruleset and `CI OK` pattern. Verify through `gh api`; confirm Vercel Deployment Checks availability on Hobby in the UI.
- **Phase 2:** small, well-understood fixes.
- **Phase 3:** large, but it follows documented in-repo patterns. Plan with explicit acceptance gates (hashes, baselines).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH (executed) / MEDIUM | swissALTIRegio coverage, GLO-90 sizes, BEV range reads, proj4 deltas and the repo ruleset were run against live data. Vercel limits, rulesets and host pricing are from fetched docs. Video bitrates are arithmetic. TINITALY access, BEV credit wording and the GLO-90 licence text are unconfirmed. |
| Features | MEDIUM | Codebase facts HIGH. WCAG and platform rules MEDIUM. Portfolio and photo-essay conventions are LOW-MEDIUM vendor sources. |
| Architecture | HIGH for repo and Next integration / MEDIUM for terrain | Read from the code and the Next 16.4 source and docs. Items marked SPIKE are LOW (`@modal/[region]` coexistence, the OG card hash redirect, UTM and overview details). |
| Pitfalls | HIGH for repo findings / MEDIUM-LOW elsewhere | Repo-specific pitfalls checked in code. DJI telemetry, iOS Low Power Mode, grid-convergence figures and several magnitudes are LOW or the researcher's own estimates. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address
- **Region list and footprint (D1):** blocks the terrain phase. Decide with Tim, then record the footprint check.
- **Licence wording:** BEV credit, GLO-90 notice (WorldDEM-90) and any borders dataset are unverified. Copy verbatim from the licence at the time of shipping.
- **TINITALY tile access and format:** check by downloading one tile, only if a region needs it.
- **Overview size target (<= 30 KB brotli):** unsmoothed measure is 43 KB. Resolve in a spike and reconcile with the 150 KB budget in PITFALLS.
- **Real drone bitrates and DJI metadata specifics:** encode Tim's own clip first, and use ExifTool at version 13.05 or later to verify the output.
- **Repo-setting identifiers:** Vercel Deployment Checks on Hobby, the GitHub Actions `integration_id` (15368), the admin role id (5), and the Marketplace Upstash variable names. Confirm each in its UI or CLI before applying.
- **OG card continuity under nested URLs:** "OG cards keep working" is a PROJECT.md promise, so decide how strict it is.
- **Approximate-formula error far from Bern:** `wgs84ToLv95` measured 2-3 m at Seceda and Innsbruck, against 0.15 m at Zermatt. Acceptable for 4-dp pins, but confirm at the chosen plates.
- **PLAT-F2 requirement wording:** reconcile REQUIREMENTS.md with the code, since the page already ships.
- **JS and LCP budgets for 20+ photos:** no photo-page LCP gate exists. Create one in phase 6.

## Sources

### Primary (HIGH confidence)
- Executed probes (STACK.md): swissALTIRegio STAC item and COG coverage samples; Copernicus GLO-30/90 COGs and the 72-tile overview contour sizes; BEV ALS DTM range reads; proj4 vs `lib/geo.ts`; npm registry; `ffmpeg -encoders`; `gh api` for the repo's rulesets.
- Repo code and generated data (all four files): `proxy.ts`, `next.config.ts`, `app/(site)/photos/**`, `lib/photos/view-model.ts`, `lib/ascent/waypoints.ts`, `lib/geo.ts`, `scripts/terrain/*`, `scripts/photos/*`, `scripts/media/build-clip.mjs`, `scripts/guards/*`, `components/site/SavedPages.tsx`, `lib/rate-limit.ts`, `.github/workflows/ci.yml`, `public/service-worker.js`, `data/site.ts`.
- Next 16.4.5 bundled docs and source (`node_modules/next/dist/docs`, `dist/lib/metadata/get-metadata-route.js`, `generate-interception-routes-rewrites.js`, `sorted-routes.js`): intercepting and parallel routes, redirects, proxy order, JSON-LD guide.

### Secondary (MEDIUM confidence)
- Vercel docs (Hobby limits, Blob pricing, Deployment Checks); GitHub docs (rulesets, skipped required checks); Copernicus WorldDEM-30 licence PDF; BEV and TINITALY metadata; EEA notice that EU-DEM is withdrawn; MDN browser-compat data for Web Share; W3C WCAG 2.2.2, 1.2.x; Google image-license metadata; Upstash FAQ (14-day archival); web.dev LCP and View Transitions Baseline; Cloudflare, Mux and Bunny pricing pages.

### Tertiary (LOW confidence, validate in phase)
- DJI `djmd`/`dbgi` and `.SRT` descriptions (SANS ISC, dji-embed docs); Chrome and Edge 142 native HLS (one source); iOS Low Power Mode autoplay; portfolio and photo-essay convention sources; South Tyrol DTM licence; Vimeo pricing; back-of-envelope figures (pixels per km, grid convergence, video bytes, texture VRAM).

---
*Research completed: 2026-11-12*
*Ready for roadmap: yes (after the owner settles D1 and D2; D3-D10 can be settled in their phases)*
