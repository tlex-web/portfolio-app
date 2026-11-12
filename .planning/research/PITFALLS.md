# Pitfalls Research

**Domain:** v2.1 "Survey Expansion": adding region photo series, a multi-region terrain pipeline, an Alps-wide overview map, an immersive photo layout, drone video, five deferred features and the v2.0 debt to a shipped, heavily guarded Next.js 16.4 / React 19.3 portfolio on Vercel Hobby
**Researched:** 2026-11-12
**Confidence:** HIGH for repo-specific findings (checked in the code, generated data, CI config and guards). MEDIUM for platform behaviour from official docs. LOW where marked.

> This file builds on `.planning/milestones/v2.0-research/PITFALLS.md` (28 pitfalls: baselines, `dark:` removal, palette guard, Motion 14, route group, EXIF time zones, GPS in originals, CSP vs 3D, reduced motion, mobile WebGL, View Transitions basics, SW staleness and more) and does not repeat it. Everything below is about **adding the v2.1 capabilities to this system without breaking what v2.0 guards**.
>
> **Confidence legend:** `[REPO]` = checked directly in this repo (HIGH). `[DOCS]` = official docs, specs or vendor pages (MEDIUM; the research seam rates every web source LOW, so re-check in the phase). `[LOW]` = community sources or my own inference; confirm before relying on it.
>
> **Phase types used below:** `data` (photo data model, originals, sidecars), `terrain` (DEM sources, pipeline, overview and local plates), `routing` (URLs, redirects, intercepts, SEO, JSON-LD), `layout` (immersive photo UI, baselines, budgets), `video` (drone footage), `debt` (repo safety, test gaps, UI fixes).

---

## Critical Pitfalls

### Pitfall 1: Home, the album, the footer and the tests all read one photo list, so the first new photo changes Home

**What goes wrong:**
In v2.0 there is exactly one photo set, and several things treat "all photos" as "the Matterhorn waypoints" `[REPO]`:
- `buildPhotoViews()` (`lib/photos/view-model.ts:320`) is documented as "every photo view in the canonical order (buildWaypoints' order, unchanged)". `buildWaypoints()` sorts **all** photos by DEM height, and Home renders every waypoint as a card, a poster pin, a 3D pin and a rail tick.
- `lowestDemM` (`data/generated/photos.ts:160`) is `min()` over **all** photos. It starts the altimeter rail (1,617 m) and feeds the summit plaque's "Height gained". A lakeside photo at 600 m in a new region moves the rail start and the plaque, which breaks "Home stays the Matterhorn ascent".
- `scripts/photos/build-photo-data.mjs:228` **throws** when a photo lies outside the one DEM extent. Any photo outside the 11 × 11 km Zermatt square fails the build.
- The footer legend reads the single `terrain.extent.lv95` and draws a tick per photo on **every** route.
- Tests pick photos by index: `e2e/routes.ts` audits `buildPhotoViews()[0]`, and the visual spec shoots `#waypoint-${buildWaypoints()[1].slug}`. A new low Zermatt photo shifts the index, so the gate silently audits a different photo and the "waypoint-2" baseline captures a different card.
- `data/__tests__/photos.test.ts:165` asserts `lowestDemM === 1617`. That is a good tripwire, but it fires only after the coupling has already been built on.

New Zermatt photos are a trap too: the milestone keeps Home at **four** waypoints, so "all Zermatt photos" is not the right Home set either.

**Why it happens:**
With four photos, "every photo" and "every waypoint" were the same list, so one function served both. The coupling is invisible until the set grows.

**How to avoid:**
- Before adding any photo, split the model in a `data` phase: `Region { id, name, country, plate }`, `Photo { regionId, ... }`, and an **explicit** `homeWaypointIds` allow-list of the four current IDs. `buildWaypoints()` reads only the allow-list. `lowestDemM` is computed over the allow-list.
- Make the split pixel-neutral: all 48 visual baselines and every Home e2e stay unchanged in the split commit. That proves the refactor before content arrives.
- Give each region its own DEM extent; `build-photo-data` checks each photo against **its region's** plate.
- Replace index lookups in tests with named fixtures (`photoBySlug('riffelsee-reflection')`, the film scan by flag), so adding photos cannot change which page a test audits.

**Warning signs:** "position lies outside the DEM extent" errors; the rail start changing; a fifth Home card; visual diffs on Home after a photos-only commit.

**Phase to address:** `data` (first plan of the milestone's content work, before terrain or layout)

---

### Pitfall 2: New originals and drone footage leak location, flight and device data through paths the guard never scans

**What goes wrong:**
The served-image guard (`scripts/guards/check-served-images.mjs`) is strong for what it scans: every tracked raster and `.mp4/.m4v/.mov/.webm/.mkv/.3gp`, an MP4 box whitelist, exactly one video track, no `©xyz`/`loci`/`uuid`/`XMP_` `[REPO]`. Drone material carries data in places it does not look:
- **Sidecars.** Older DJI models write per-frame GPS, altitude and camera settings to a `.SRT` file next to each clip; DJI also writes `.LRF` low-res proxies (MP4 bytes with a different extension) `[LOW: community + SANS ISC]`. Neither extension is in the guard's list, so a DJI card folder copied into a tracked path passes lint and is pushed to a public repo.
- **Timed metadata inside the MP4.** Newer DJI models record telemetry as a `djmd`/`dbgi` protobuf track inside the MP4; the clip also embeds the aircraft serial number `[LOW: SANS ISC, dji-embed docs]`. The guard catches a second track in the **served** file, but a hand-run `ffmpeg -i in.mp4 out.mp4` keeps subtitle streams by default, so a bypass of `scripts/media/build-clip.mjs` is how this leaks.
- **Drone stills.** DJI JPEG/DNG carry an XMP `drone-dji:` block (absolute and relative altitude, gimbal and flight yaw) and a serial. Derivatives are stripped and guarded, but `extract-exif.mjs` writes a **committed** sidecar (`data/photos/exif-sidecar.json`, already holding `gps.utc` to the decisecond and `altM`). If the extractor is widened to read DJI XMP, those fields become public.
- **Altitude as evidence.** A drone photo's `GPSAltitude` is the aircraft's height. Publishing it, or a relative-altitude field, can show a flight above the 120 m open-category ceiling or inside a no-fly zone (Zermatt has a heliport) `[LOW: regulatory, verify per flight]`.
- **Pins near homes.** 4-dp rounding (~10 m) is fine at public viewpoints and too precise for a chalet, a friend's garden or a drone take-off spot.
- **ID rules.** `extract-exif.mjs` accepts only `IMG_dddd` and `Rddd-ddd` names and only `.jpg/.jpeg` `[REPO]`. `DJI_0001.JPG`, phone `PXL_…`/HEIC or a second Canon whose counter reached `IMG_0605` again either fail or **collide** with an existing id. The manifest, the derivatives and the editorial entries are all keyed by that id.

**Why it happens:**
v2.0's privacy model was built for four Canon JPEGs. Drones add new containers, sidecars and a new meaning for "altitude".

**How to avoid:**
- Keep all new sources (stills, clips, `.SRT`, `.LRF`, flight logs) under the gitignored `assets/` tree. Extend the guard to fail on any tracked `*.srt *.lrf *.ass *.gpx *.kml *.kmz *.dat *.csv` outside an allow-list (selftest fixture per extension).
- Route every clip through `build-clip.mjs` (explicit `-map 0:v:0 -an -sn -dn -map_metadata -1 -map_chapters -1`), never a hand-run ffmpeg. The guard then verifies the bytes.
- Keep the sidecar schema closed (zod `.strict()`): no serial, no XMP fields, no relative altitude. For aerial photos store `kind: 'aerial'` and either omit altitude or show the DEM ground height labelled as ground.
- Add a per-photo `precision` override (`4dp` default, `3dp` or a hand-placed "approx." pin as the film scan already does) and use it for anything near a dwelling or take-off point.
- Replace the filename id rule with an explicit id map in `data/photos/` (source file → id), unique across regions and cameras. Fail on duplicates.

**Warning signs:** `.SRT`/`.LRF` in `git status`; sidecar keys you don't recognise; two originals mapping to one id; aerial photos showing 2,900 m on a 1,600 m valley floor.

**Phase to address:** `data` (guard extension and id map before the first new original), `video` (clip path)

---

### Pitfall 3: Building a second DEM pipeline you may not need, then mixing sources inside a plate

**What goes wrong:**
The milestone plans "a second elevation source for Italy and Austria next to swissALTIRegio". But swissALTIRegio already **is** a cross-border mosaic `[DOCS: swisstopo product page, STAC item]`:
- It covers at least 100 km beyond the border; the STAC bbox is 4.52–11.99° E, 44.84–48.75° N. The east edge slants to about 11.7° E at 45° N.
- Its foreign parts **are** TINITALY 1.1 (Italy), DGM10 Österreich (Austria), RGEALTI (France) and Bavarian/BW DGM1.
- The required credit line the site already shows verbatim (`site.attribution.terrain`, D-15) already names INGV TINITALY and "DGM Österreich, geoland.at".
- Foreign heights are delivered "in LN02" but "no altimetric transformation has been carried out from the original altimetric system". Accuracy (1.5 m, 1σ) is stated for Switzerland only.

Aosta and Valtournenche, the Ossola and Lombard Alps, Bernina's Italian side, Vinschgau and Ortler, Vorarlberg and most of Tyrol (Innsbruck ~11.4° E, Ötztal, Stubai) are therefore **already inside the source the pipeline reads**. A second pipeline for those regions adds risk for no gain. The risks:
- **DSM vs DTM.** Copernicus GLO-30, the usual "free global" choice, is a surface model with EGM2008 heights (EPSG:3855) `[DOCS]`. Forest canopy and buildings read 10–30 m high, so contours wobble over every forest edge and village, and 30 m cells shave summits by tens of metres `[LOW: magnitude]`.
- **Seams.** Two sources inside one plate meet in a line where resolution, acquisition year (glacier surfaces differ by decades) and datum all change at once. On a gentle slope a 1 m vertical step moves a contour line tens of metres sideways, which shows up as a visible kink. The datum offsets themselves (LN02 vs Austrian "Gebrauchshöhen Adria", EPSG:5778, a few cm to dm; EGM2008 up to about a metre) are the **smallest** of these errors `[LOW: magnitudes]`.
- **Grid mismatch.** TINITALY is UTM 32N (WGS84) with nodata −9999 and the Austrian DGM is MGI/Lambert. Reprojecting into LV95 resamples, so cells no longer align with `fetch-dem.mjs`'s "pixel-aligned, no resampling, fail on any nodata" contract.
- **Licences multiply.** Every new source needs its own attribution: TINITALY CC BY 4.0 with DOI, geoland.at CC BY 4.0, Copernicus' mandatory DLR/Airbus notice `[DOCS]`. It must sit next to the map it feeds, not only in a global footer. The D-15 string must stay verbatim, so you cannot just append to it.
- **"Last surveyed" lies.** The footer shows one edition (2026-05). TINITALY is 2023, Copernicus 2024_1.

**Why it happens:**
"Italy and Austria need another source" is true for swissALTI3D (the 2 m Swiss-only model) and was learned in v2.0. It is not true for swissALTIRegio.

**How to avoid (opinionated):**
1. **Pick regions first, then check them against the swissALTIRegio footprint polygon.** Inside it, use swissALTIRegio alone: one CRS (EPSG:2056), one fetch script, one credit line that is already on the page.
2. Only for a region outside it (eastern Dolomites past about 11.8° E, Hohe Tauern, Salzburg), use the **same national DTM swissALTIRegio uses** (TINITALY 1.1 or DGM Österreich 10 m), not Copernicus.
3. **One source per plate, never a blend.** Size plate extents so they sit wholly inside one source.
4. Use Copernicus (GLO-90 or GLO-30 resampled to 250–1,000 m) only for the **Alps-wide overview**, where a 250–500 m contour interval hides DSM bias and datum offsets.
5. Record `source`, `crs`, `heightSystem` and `edition` **per plate** in the schema (the current single `source.json` hard-codes `"heightSystem": "LN02"`, which is false for a foreign plate). Render attribution per map plate plus a sources list in the footer.

**Warning signs:** contours that jump at a straight line; a forest edge outlined by contours; a peak 20–40 m below its official height; a plate with two `source` values; attribution only in the footer.

**Phase to address:** `terrain` (source decision is the first task, before code); the region list is a `data` input

---

### Pitfall 4: Projection and coordinate errors once the survey leaves Switzerland

**What goes wrong:**
- `lib/geo.ts` uses swisstopo's **approximate** WGS84→LV95 polynomials, verified to ≤ 0.14 m at three Zermatt points `[REPO]`. They are documented for Switzerland. Their truncation error grows with distance from Bern, and Tyrol is about 4° east `[LOW: magnitude unmeasured]`. With 4-dp coordinates, a few metres don't matter, but tens of metres put a lakeshore pin in the lake.
- **Grid convergence.** In LV95, grid north and true north differ by roughly Δλ·sin φ: about 3° at 11.5° E and about 6° near Vienna `[LOW: back-of-envelope]`. A plate drawn "north up" in LV95 far east is slightly rotated, and a UTM 32N plate next to a UTM 33N plate disagree in rotation.
- **Overview projection.** An Alps-wide overview in LV95 is skewed at both ends. In a conic projection (ETRS89-LCC EPSG:3034 or LAEA EPSG:3035) it isn't, but then the overview and the local plates use different projections, and pins must be projected per map.
- **`lib/geo.ts` must stay import-free** (its header: "never add an import"), so proj4 cannot go there.
- **PHOTO-F4 "LV95 for Swiss photos only".** It is tempting to decide "Swiss" by region (Zermatt) or by DEM source. Both are wrong: Zermatt-region photos from Testa Grigia or Plateau Rosa are in **Italy**, and swissALTIRegio covers Italy too.
- **Border-peak heights.** Countries publish different official heights for shared summits. The altimeter already uses an official constant rather than `max(DEM)` (v2.0 Pitfall 10); every new plate needs its own official numbers and a source.

**How to avoid:**
- Do all reprojection at **build time** in `scripts/` (proj4 or GDAL there), and ship precomputed `uv` per photo **per map** (overview UV and local-plate UV). The runtime never projects.
- Add unit tests that compare `wgs84ToLv95` with a proj4 EPSG:2056 transform at the farthest planned points. If the error exceeds 1 m, use proj4 in the build for those regions.
- Add `country` to each photo (editorial or corrections file, Tim confirms), and show LV95 only when `country === 'CH'`. Test a Zermatt-region photo taken on the Italian side.
- Draw a north arrow, or state the projection, on any plate whose grid north differs from true north by more than about 1°.

**Warning signs:** pins offset from trails or shorelines in far-east regions; overview pins in the wrong valley; LV95 shown on a photo taken in Italy.

**Phase to address:** `terrain` (projection decision, tests), `data` (country field), `layout` (PHOTO-F4 display)

---

### Pitfall 5: Generalising the single-extent pipeline changes Zermatt's bytes, and every hashed URL with it

**What goes wrong:**
`fetch-dem.mjs` hard-codes one `EXTENT` ("D-14 … Costly to change"), one `source.json`, one `terrain.ts`. The hero, map and strip contour SVGs are content-hashed (`public/terrain/contours-*.<hash>.svg`), and `terrain:build --check` byte-compares them in lint `[REPO]`. A refactor that changes even float formatting or path order for Zermatt:
- renames every Zermatt terrain file,
- changes the SW precache list (`data/generated/precache.json`: the strip and hero contour),
- busts the immutable cache for returning visitors,
- and can produce visual diffs on all 48 baselines, because the footer strip renders on every route.

Two more costs grow per region:
- `terrain:build --check` runs on every lint, so check time grows linearly.
- Each region commits a 16-bit source PNG (1–2 MB) to a repo whose history is permanent.

**How to avoid:**
- First plan in `terrain`: refactor to a `regions[]` config with **zero byte change** for Zermatt. Acceptance: `terrain:build --check` passes against the **existing** committed artifacts, and the hashes are unchanged. Only then add a second region.
- Keep plate rasters small (11 × 11 km at 10 m is 1100², as today). Make the overview a separate coarse raster (≤ 1,000 px across).
- Time `npm run lint` before and after; if `--check` adds more than about 20 s, parallelise per region or split it into its own CI step.

**Warning signs:** renamed `contours-*.svg` in a refactor diff; precache.json changing; footer-strip diffs on every route.

**Phase to address:** `terrain`

---

### Pitfall 6: The Alps-wide overview map: pin collisions, unreachable targets and a heavy SVG

**What goes wrong:**
- **Scale.** The Alps run about 800–1,000 km west to east. At 375 px (about 343 px of content) that is roughly 2.5–3 km per CSS pixel. Zermatt and Breuil-Cervinia (about 10 km apart) land 3–4 px apart. Two 24 px pins need about 60–70 km between them to avoid overlapping. WCAG 2.5.8 (AA) requires 24 × 24 targets or equivalent spacing.
- **Local plates.** A 20-photo Zermatt plate repeats the problem: many photos come from the same viewpoints (Riffelsee, Gornergrat). The current label layout and the 256 px nowrap map plates were tuned for **four** photos (Key Decisions, Phase 10).
- **Guard conflict.** The guard's `svg-content` rule forbids `href`, `<script>`, `on*` and `foreignObject` in served SVGs under `public/` `[REPO]`, so clickable pins **cannot** live inside the contour SVG file.
- **axe 4.14.** It flags `label-content-name-mismatch` where `aria-label` differs from the visible text. The existing map plates are 4 of those 13 elements, and a copy-pasted pin pattern adds more (debt item).
- **Weight.** Contouring a large raster yields multi-MB paths, which hurts LCP on `/photos` if the overview is the landing view (today `/photos` opens on the Map view).
- **Attribution.** The overview's DEM (Pitfall 3) needs its own visible credit on the map.

**How to avoid:**
- Pins are HTML overlays positioned from build-time UVs, as on the Matterhorn map. Keep the SVG decorative. Keep the always-rendered DOM list of regions as the real navigation (the v2.0 decorative-pins pattern).
- Use a deterministic collision pass at build or render time: when two pins are closer than 24 px at the current width, merge them into a numbered cluster or offset the labels with leader lines. Add a unit test at 375, 768 and 1440 px with the real regions.
- Accessible name = visible text first, e.g. `Zermatt, 3 series photos` where `Zermatt` is visible. Run axe with `label-content-name-mismatch` enabled on new components even before the global upgrade.
- Overview raster about 1 km cells, contour interval 250–500 m, simplified paths; budget the hashed SVG at ≤ 150 KB.
- For 20+ pins on a local plate: numbered pins with a key, and only the hovered or focused pin shows a label.

**Warning signs:** overlapping pins at 375 px; tab order jumping across the map; an overview SVG over 200 KB; new axe rule hits.

**Phase to address:** `terrain` (overview raster and size budget), `layout` (pins, collisions, names)

---

### Pitfall 7: A series URL change collides with the intercepting route, the proxy's 404 logic and `dynamicParams`

**What goes wrong:**
The photo routes are `app/(site)/photos/[slug]/page.tsx` (`dynamicParams = false`), `@modal/(.)[slug]` (the lightbox on soft navigation), `@modal/default.tsx` and `@modal/page.tsx`. `proxy.ts` matches **exactly two segments** (`/^\/(photos|projects)\/([^/]+)$/`) against `KNOWN` slugs and serves the neutral `/<section>/_` 404, so a typed slug is never reflected in flight data (T-12-03) `[REPO]`. Each common restructure breaks something:

| Shape | What breaks |
|---|---|
| `/photos/[region]` next to `/photos/[slug]` | Next forbids two different dynamic names at one level. A single `[slug]` that means "region or photo" needs disjoint namespaces. The proxy treats every region slug as a miss and **404s it**. A soft navigation from `/photos` to `/photos/zermatt` is **intercepted by `(.)[slug]`** and opens as a lightbox. |
| `/photos/[region]/[slug]` | The proxy's two-segment regex no longer matches, so unknown nested slugs **lose the neutral-404 protection** (a quiet security regression). The intercept must move to `@modal/(.)[region]/[slug]`. Missing `default.tsx` at new levels gives a **404 on hard refresh** `[DOCS: Next parallel-routes]`. A soft navigation from an open lightbox to a region page keeps the old slot visible (a stuck modal) unless a `@modal/[...catchAll]` returns `null` `[DOCS]`. |
| `/photos/regions/[region]` (static segment) | A static segment beats `[slug]` in routing, but the proxy still sees two segments (`/photos/regions`) as a photo miss, and the intercept's behaviour with a static sibling needs a spike `[LOW]`. |

`/photos/${slug}` is hard-coded in at least 11 places: `WaypointCard`, `MapSheet`, `JustifiedGrid`, `CarouselControls`, `CarouselStepper`, `CarouselView`, two in `PhotoViewer`, `sitemap.ts`, `view-model.ts` canonical and `saved-pages.ts` `[REPO]`. One of them is `history.replaceState` in `PhotoViewer` stepping. If stepping crosses into another region, a `replaceState` to a differently shaped URL desyncs the Next router: Back, refresh and the intercept then behave unpredictably.

**How to avoid (opinionated):** the cheapest correct option is **not to change photo URLs**. Keep `/photos/[slug]` canonical (slugs are already globally unique, chosen by Tim). Put series at a namespace the proxy and intercept never confuse, e.g. a top-level `/series/[region]` (nav current state "Photographs"), or `/photos?series=zermatt` handled like `?view=` with `router.replace`. If nesting is still wanted:
- Add one `photoHref(photo)` helper and replace all 11 literals. Add a lint rule or test that bans the literal `` `/photos/${ `` outside the helper.
- Extend `DETAIL_PATH`/`KNOWN` to the new shape, with tests for unknown region, unknown slug, and a valid slug under the wrong region (redirect or 404, decided explicitly).
- Add `default.tsx` at every new slot level plus `@modal/[...catchAll]/page.tsx`. Add e2e: hard refresh on each route type, soft navigation from an open lightbox to a region page, Back.
- Clamp prev/next stepping to the current series, or do a real `router.push` when crossing regions.

**Warning signs:** a region link opening a dialog; a hard refresh 404; a typed slug visible in `view-source` script data; the lightbox staying open after navigation.

**Phase to address:** `routing` (before layout work starts)

---

### Pitfall 8: Losing search traffic and link previews when photo URLs move

**What goes wrong:**
Shared `/photos/<slug>` links and their OG cards are a stated invariant. The usual failures:
- **Too-broad redirects.** A rule like `/photos/:slug → /photos/:region/:slug` also catches the new region pages and `/photos/:slug/opengraph-image…`.
- **Chains.** Old → intermediate → new.
- **Stale internal links.** Internal links (Home waypoints, footer, saved pages, OG `url`, JSON-LD `url`) still point at the old URL, so every click costs a redirect hop, and the hop also defeats the intercept and the morph (Pitfall 9).
- **OG image URLs.** The per-slug OG route lives under the slug path. Platforms that cached `og:image` from an old share get a 404 unless the image path redirects too.
- **Sitemap and canonical.** Old URLs left in the sitemap, or a canonical that disagrees with the redirect target, send mixed signals.
- **Image URL churn.** Derivative names are content-hashed and the guard's `orphan` rule deletes unreferenced files `[REPO]`. If the immersive layout re-derives every photo (a new width or crop), every image URL changes and the old ones 404. Indexing images is slow `[LOW: Google statements via SEJ]`.

**How to avoid:**
- Prefer no URL change (Pitfall 7). If URLs change: **generate** `redirects()` from data as exact-slug, one-hop, `permanent: true` (308) entries. Redirects run **before** the proxy `[DOCS: Next proxy execution order]`, so they don't need proxy changes.
- Redirect `/photos/<old>/opengraph-image:path*` as well, or keep the old OG route alive.
- Sitemap lists canonicals only; every page's `alternates.canonical` equals its sitemap URL; a test asserts both.
- Add an e2e crawl that fails on any internal `href` answering 3xx (the audit gate already fails broken links; add redirects).
- Add new derivative widths **alongside** existing ones instead of re-deriving existing photos; don't change existing photos' crop or encode settings without a reason.

**Warning signs:** redirect count growing past the photo count; any 3xx in the internal link crawl; old OG URL 404; Search Console "Page with redirect" for sitemap URLs.

**Phase to address:** `routing`

---

### Pitfall 9: View Transitions break under new pages, duplicate photos and redirect hops

**What goes wrong:**
The morph uses `photo-${slug}` names on `TileTransition` and `PhotoViewer`, and `photos-view` for the view crossfade `[REPO]`. v2.1 adds places where the same photo renders twice:
- a region cover on the overview **and** the region grid,
- an immersive strip **and** a thumbnail rail.

Two mounted elements with one `view-transition-name` abort the transition. Chrome logs an error, and the production audit gate fails on **console errors**, but only for the states it drives.

Two more failure paths:
- A soft navigation that hits a redirect doesn't interpret the intercept or the morph as planned.
- **All three CI engines now animate.** Firefox shipped same-document View Transitions in 144 (October 2025) `[DOCS: web.dev]`. Tests written when Firefox skipped the morph may now race it, and `--fail-on-flaky-tests` turns that into a red run.

**How to avoid:**
- Name only the element that is morphing (the v2.0 `useViewTransitionName(id, active)` rule), and prefix names with the surface (`photo-grid-<slug>`, `photo-cover-<slug>`).
- Run a Jest/RTL check that no two rendered nodes share a transition name on each page model.
- Never link internally to a redirecting URL (Pitfall 8).
- In e2e, wait for `document.getAnimations()` to settle via the existing `e2e/helpers/view-transitions.ts` in **every** engine.
- Reduced motion keeps `::view-transition-*` at `animation: none` (v2.0).

**Warning signs:** a morph that silently cuts; "duplicate view-transition-name" in the console; Firefox-only flakes.

**Phase to address:** `routing` (names and links), `layout` (new surfaces)

---

### Pitfall 10: Visual-baseline churn from the redesign, new routes and content drops, with real regressions hidden inside it

**What goes wrong:**
There are 48 Linux baselines: 12 routes × 3 widths, plus 9 Home ascent shots. They are generated only by the `workflow_dispatch` container, only Tim commits PNGs, and the threshold is 0.01 `[REPO + memory]`. v2.1 changes pixels for at least six different reasons:
- the Playwright 1.64 → 1.65 browser update,
- footer and shell changes (attribution per source, legend, any "less chrome" nav change), which touch **all 48**,
- the immersive layout (photo routes),
- new routes (overview, region pages, video),
- every content drop (new photos change `/photos` Map/Grid/Carousel, and footer ticks if they stay global),
- the five UI debt fixes (375 Home, menu, focus ring, rail label).

If two of these land in one re-baseline, an unintended change rides along with an intended one, which is exactly the regression the user is most frustrated by. With threshold 0.01, `--update-snapshots=changed` will faithfully accept **anything**.

**How to avoid (staging order):**
1. **Playwright 1.65 alone, first.** Bump `@playwright/test` **and** the container tag together; the parity guard fails a split bump (07 WR-05, PR #111). Expect zero or near-zero diffs, and ratify any diff with the zero-diff exception policy.
2. **Shell and footer changes in one commit**, re-baselined once, before page work.
3. **UI debt fixes**, one commit each, each with its own expected set of changed PNGs.
4. **New routes with `update_mode=missing` only**, so existing PNGs cannot change in that run.
5. **Layout redesign per route group** (photo page, then `/photos` views), `changed` mode, with the plan declaring the expected PNG list. Extend `scripts/ci/check-visual-run.mjs`, or add a step, to fail when the changed set is not a subset of the declared set.
6. **Content drops last**, batched (one re-baseline per drop, not per photo).

Also make the footer independent of the photo count before content drops (Pitfall 1), so adding a photo cannot touch 48 PNGs.

**Warning signs:** a re-baseline touching more PNGs than the plan lists; diffs on `/contact` in a photo-layout plan; a "trivial" content commit with 40+ changed PNGs.

**Phase to address:** `debt` (1.65 first), `layout` (stages 2, 4, 5), `data` (stage 6)

---

### Pitfall 11: The test-count ratchet and the audit gate collide with data-driven tests and CI time

**What goes wrong:**
- The ratchet counts runner listings (`jest --json` `numTotalTests`; Playwright `--list`, unique file + title) and may only go up `[REPO]`. Tests generated per photo (`for (const p of photos) test(...)`) raise the baseline with every content drop. Later collapsing them (to save CI time) or removing a photo **drops the count and fails the ratchet**, even though no coverage was deleted.
- Deriving the audit gate's route list from data (retro lesson 4, debt item) multiplies the most expensive spec. It covers 3 widths × 9 states × 3 engines per route. E2E already takes about 37 minutes with `workers: 1` against a 60-minute job limit. Adding about 25 photo and region routes can push it past the timeout.
- Sharding E2E (a matrix by engine or by shard) **renames the check** (`E2E Tests (chromium)`), and that interacts with required checks (Pitfall 15).
- The immersive layout replaces components (perhaps the 3D Carousel). If their tests aren't rewritten in the same commit as successor tests, the ratchet blocks the plan late.

**How to avoid:**
- Data-driven checks loop **inside one test** with `expect.soft` per item (one count, full coverage), or use a fixed named sample. Never one `test()` per data row.
- Audit gate: every **template** (photo page, region page, overview, case study, …) in every engine at every width, plus **all** slugs at one width in Chromium. That is cheap, closes the coin-flip and slugs 2–4 gap, and grows by one page load per photo, not 27.
- Add a step `timeout-minutes` to `npx playwright install --with-deps` (the 59-minute hang on `559bd72`).
- Each plan that retires a component has a test contract table (v2.0 Pitfall 5): old test → successor test, in the same commit.

**Warning signs:** a baseline bump after a content drop; E2E duration trending past 45 minutes; a plan ending with "ratchet failed".

**Phase to address:** `debt` (audit gate, install timeout), `layout` (contract tables), `data` (no per-row tests)

---

### Pitfall 12: The immersive layout breaks the gallery-black rule, LCP and the JS budget

**What goes wrong:**
- **Colour cast.** "Contours, coordinates and altitudes frame everything" invites contour lines **over** photos or tinted overlays. That breaks the Key Decision "map palette must never colour-cast the photographs" and puts text over images, where the contrast guard (token pairs) and axe (marks image backgrounds `incomplete`) cannot measure.
- **Full-bleed sizes.** A full-bleed 1440 px viewport at DPR 2 wants about 2,880 px, above the 2,560 px served cap (D-13, guarded). Raising the cap weakens "full-resolution originals never served". A wrong `sizes` attribute makes phones download the 2,560 variant: a mobile LCP hit, and no per-route LCP gate outside Home.
- **Client data.** Generated data modules imported by client components (photos, manifest, editorial, region lists) ship to the browser. With 20+ photos the shared chunk grows on **every** page, Home included. HOME-08 has only 6.2% JS margin (439,840 B of 468,770 B) and is an on-demand gate, not in CI `[REPO]`.
- **3D carousel textures.** The carousel with 20+ photo textures (about 4–6 MB of VRAM each at 1,024 px with mipmaps) invites context loss on iOS `[LOW: magnitude]`.
- **"Less chrome."** Hiding `SiteNav` or the footer touches the one-shell invariant (single `nav[aria-label=Primary]`, footer attribution on every route), the audit's route loop and all 48 baselines.

**How to avoid:**
- Keep contours and data **outside** the image box (frame, margins, captions). Any text on an image sits on a solid gallery-black scrim with a measured composed contrast.
- Keep 2,560 px as the cap; use `object-fit: cover` and write `sizes` per breakpoint. Add an LCP budget for the photo page to the perf suite (same method as HOME-08).
- Keep generated data server-only: pass page-scoped props, and add a `server-only` import to data modules that must never reach the client. Run HOME-08 in the plan's verification, not "later".
- Scope the carousel to one series and window its textures (current ± 2).
- Hide nav visually only on scroll (still in the DOM and reachable); never remove the footer attribution.

**Warning signs:** a contour stroke crossing a photo; the JS total creeping up after a "data only" change; LCP element = the 2,560 variant on a 375 px trace.

**Phase to address:** `layout`

---

### Pitfall 13: Drone video weight versus Vercel Hobby limits, the guard and the same-origin CSP

**What goes wrong:**
- **Budget arithmetic.** H.264 1080p at about 5 Mbit/s is about 37 MB per minute, so a 20-second loop is about 12 MB. The existing clip guard caps a served MP4 at **1.5 MiB** (`MAX_CLIP_BYTES`; the coin-flip clip is 211,784 B) `[REPO]`.
- **Hobby transfer.** Hobby includes 100 GB Fast Data Transfer per month and **pauses the feature until 30 days have passed** when exceeded; there is no overage billing `[DOCS: Vercel limits and Hobby pages]`. About 8,000 plays of a 12 MB clip could take the whole site offline for a month.
- **Moving the file elsewhere.** Vercel Blob on Hobby has 1 GB of storage and 10 GB of transfer, with the same block-until-reset behaviour `[DOCS]`. Any external host:
  - takes the file **out of the guard** (it scans only tracked files),
  - needs `media-src` widened beyond `'self'` (`default-src 'self'` covers media today),
  - and breaks the "same-origin assets" constraint.
  YouTube or Vimeo embeds need `frame-src`, which is `'none'` today, plus third-party cookies.
- **Raising the global cap.** Raising `MAX_CLIP_BYTES` to fit drone footage also loosens the cap for every other clip.
- **Repo growth.** Every re-encode of a 10 MB clip stays in git history forever, and multi-rendition HLS breaks the guard's "only MP4, hashed names" rules and needs a JS player for Chromium.

**How to avoid (opinionated):**
- Same-origin progressive MP4 through `build-clip.mjs`. Use a short muted loop for any ambient use: 720p, 6–10 s, ≤ 3 MB, or a still poster on small screens. Add a "watch" rendition (1080p, ≤ 15 MB) loaded only on an explicit play with `preload="none"`.
- Give each clip a **per-clip** byte budget in `data/media/clips.json` with a reason, checked by the guard, and keep 1.5 MiB as the default.
- Track total bytes of `public/media/` in a guard (e.g. ≤ 40 MB).
- Decide hosting before encoding. If anything leaves the origin, that is a Tim decision with a written CSP change, plus an equivalent metadata check on the uploaded bytes.

**Warning signs:** a plan raising `MAX_CLIP_BYTES`; a `media-src` or `frame-src` diff; a Vercel usage e-mail; `public/media/` over 20 MB.

**Phase to address:** `video` (format and hosting decision is the first task; research flag)

---

### Pitfall 14: Autoplay, accessibility, LCP and CLS traps with video

**What goes wrong:**
- **WCAG 2.2.2 (A).** Moving content that starts automatically, lasts more than 5 s and sits next to other content needs pause, stop or hide `[DOCS: W3C Understanding 2.2.2]`. A muted ambient loop is not exempt.
- **WCAG 1.2.1 (A).** Pre-recorded video-only content needs a text alternative unless it is purely decorative. A drone flyover that conveys the place needs a short description or transcript.
- **Reduced motion and Save-Data.** These must mean no autoplay (v2.0 parity rule); the capability gate for Home's 3D is the model to reuse.
- **iOS Low Power Mode.** It blocks autoplay even when muted, leaving Safari's play overlay over the design. `play()` rejects; handle it `[LOW: community reports]`.
- **LCP.** Chrome ≥ 116 counts an autoplaying video's **first frame or poster, whichever is first**, as the LCP candidate `[DOCS: web.dev / Chromium changelog]`. A hero video without a fast poster becomes the LCP element.
- **CLS.** A video without `width`/`height` or `aspect-ratio` collapses and shifts the page; the audit gate fails above 0.1.
- **CI codecs.** Playwright's bundled Chromium cannot play H.264 (`e2e/demo-clip.spec.ts:13`) `[REPO]`, and Firefox and WebKit builds differ. A test that awaits `playing` is flaky or red, and `--fail-on-flaky-tests` makes that red.

**How to avoid:**
- Native `controls` (or the existing pause-button pattern), a visible pause on any loop over 5 s, a text description next to the video, and `aria-hidden` only for a genuinely decorative loop.
- Poster = hashed same-origin image at the same aspect ratio; `width`/`height` attributes; `preload="none"` except for a deliberate hero.
- Gate autoplay on `prefers-reduced-motion: no-preference`, no Save-Data and a successful `play()` promise; otherwise show the poster and a play button.
- E2E asserts poster, controls, attributes and the pause behaviour, never playback. Use `canPlayType` gates like `demo-clip.spec.ts`.

**Warning signs:** `autoplay` without a pause control; the LCP element being a `<video>` on a slow trace; video specs passing only on retry.

**Phase to address:** `video`

---

### Pitfall 15: Required checks that deadlock merges, or pass vacuously

**What goes wrong:**
`main` has no protection today, and Vercel deploys every push to `main` (`vercel.json` `deploymentEnabled.main: true`) `[REPO, audit]`. Turning protection on naively causes:
- **`[ci skip]` heads.** GitHub skips push and PR workflows for commits whose message contains `[skip ci]`/`[ci skip]`. Required checks then stay **Pending forever** and block the merge. GSD's ship step writes such commits, and PR #109's head was one `[DOCS: GitHub troubleshooting required status checks; audit]`.
- **Path filters.** A workflow skipped by `paths:` or a branch filter also leaves checks Pending. A **job** skipped by `if:` reports **Success** `[DOCS]`. So a wrong `if:` silently passes a required check: `Dependency Review` is `if: pull_request` today, which is fine, but any future conditional job can pass vacuously.
- **Renamed checks.** Required checks are identified by job name. Renaming a job or turning E2E into a matrix (`E2E Tests (chromium)`) leaves the old required name Pending forever.
- **CodeQL.** It is red (7 untriaged alerts, failed on #109); requiring it before triage blocks everything.
- **Merge queue.** It needs a `merge_group` trigger, which `ci.yml` lacks, so enabling a queue deadlocks.
- **"Require branches to be up to date"** with a 37-minute E2E and 14 Dependabot PRs means hours of serial re-runs.
- **Admins.** Classic protection without "Do not allow bypassing" lets the admin merge red PRs, so the habit of clicking past it returns.
- **Direct pushes.** Protection guards PR merges only; a direct push to `main` still deploys. Vercel **Deployment Checks** can hold production promotion until selected GitHub checks pass, but Vercel warns about check-run collisions when used together with branch protection or rulesets `[DOCS: Vercel Deployment Checks; Hobby availability not confirmed]`.

**How to avoid:**
- Add one **aggregate gate job** (`ci-ok`, `needs:` all jobs, `if: always()`, fails unless every need is `success` or an intended `skipped`). Require only that name, so later job renames and matrices never touch settings.
- Stop writing `[ci skip]` on PR branches: amend GSD's commit or use a docs-only path that still runs the gate quickly. Document "push an empty commit to re-trigger" as the escape hatch.
- Use a ruleset on `main`: require a PR, require `ci-ok`, block force pushes and deletions, empty bypass list. Do not require up-to-date until E2E is under about 20 minutes.
- Leave CodeQL out of the required set until its 7 alerts are triaged; then add it, or a code-scanning merge rule.
- Turn on Vercel Deployment Checks on `ci-ok` if Hobby offers it; otherwise accept direct pushes as Tim-only and record it.
- **Verify through the API, not a UAT reply** (retro lesson 1): `gh api repos/{owner}/{repo}/rules/branches/main` in the plan's verification, plus a deliberately red test PR that cannot merge.

**Warning signs:** a PR stuck at "Expected — Waiting for status to be reported"; required checks listing a job name that no longer exists; a merge with a red check.

**Phase to address:** `debt` (first plan of the milestone, so every later phase merges under it)

---

### Pitfall 16: The rate limiter fails open, or fails closed by accident

**What goes wrong:**
`lib/rate-limit.ts` builds the Upstash limiter only when **`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`** are set; otherwise it returns a mock that always allows and warns once `[REPO]`. Ways this fails:
- **Variable names.** `Redis.fromEnv()` itself accepts the `KV_REST_API_URL`/`KV_REST_API_TOKEN` names that some Vercel Marketplace setups inject `[DOCS: Upstash redis-js]`. This code checks the `UPSTASH_*` names **first**, so a correctly provisioned Redis under KV names still fails open.
- **Scope and redeploys.** Variables set for Preview but not Production (or the reverse) only take effect after a **redeploy**.
- **The warning is invisible.** A once-per-instance `console.warn` that nobody reads.
- **Archived database.** Upstash archives free-tier databases after at least **14 days of inactivity**, after warning e-mails `[DOCS: Upstash FAQ]`. A quiet contact form goes 14 days without a request easily. Then `limit()` errors, and `/api/feedback` falls into its outer `catch` and answers 500, so the form breaks rather than failing open.
- **Timeouts.** `@upstash/ratelimit`'s default `timeout` lets a request through after about 5 s when Redis is slow `[LOW: library default, verify]`.
- **Testing by sending.** The real-send test proves e-mail, not the limiter, and repeating it sends e-mail.

**How to avoid:**
- Accept either name pair. In production (`VERCEL_ENV === 'production'`), with neither pair present, **fail closed**: answer 503 with the recoverable error state the form already has. Log one structured error per request, not a warn-once.
- Verify without e-mail: the honeypot path runs **after** the Upstash limit and returns a quiet 200 without sending (PROJECT.md, CONTACT-03). Six honeypot POSTs from one IP should give a 429 on the sixth. Make that an opt-in prod probe (`PROD_RATE_PROBE=1`), like `test:prod-form`.
- Keep the database alive (a paid tier, or a weekly scheduled no-op command) or accept archival with a monitored 503.
- Record the Vercel environment-variable scope in the plan's verification (dashboard screenshot or `vercel env ls production`).

**Warning signs:** the 6th probe answers 200; `[rate-limit] … not set` in production logs; an Upstash "database will be archived" e-mail; 500s from `/api/feedback`.

**Phase to address:** `debt`

---

## Moderate Pitfalls

### Pitfall 17: JSON-LD under the nonce CSP
Under the nonce CSP, an inline `<script type="application/ld+json">` is a **data block**. The HTML spec's prepare-the-script steps return before the CSP inline check for non-JavaScript types, so it needs **no nonce** and raises no violation `[DOCS: HTML Standard; LOW: not verified per engine]`. The real mistakes:
- using `next/script` (the executable path) instead of a plain `<script>` (Next's JSON-LD guide),
- reading `headers()` in a page just to add a nonce, which makes the page dynamic,
- not escaping `<` as `<` (Next guide; editorial strings are free text),
- putting full-precision or sidecar coordinates in `contentLocation` instead of the 4-dp `Coord4`,
- emitting the same JSON-LD from both the intercepted modal and the page,
- claims that don't match visible content (`license`, `acquireLicensePage` → `/contact` matches "all rights reserved, enquiries via Contact"; anything else doesn't).

**Prevention:** one `jsonLd()` builder fed only from the view-model; a Jest test that parses it, checks the escaping and checks every coordinate has ≤ 4 dp. A one-off Rich Results Test is recorded in UAT. The audit gate's CSP-event listener stays at zero.
**Phase:** `routing`

### Pitfall 18: Service-worker caching and the PLAT-F2 offline list
- `/offline` already lists saved pages (`lib/saved-pages.ts`, `components/site/SavedPages.tsx`) `[REPO]`. PLAT-F2 should extend it, not build a second list.
- `activate` deletes **every** cache not ending in the new `BUILD_HASH`, including the dynamic page cache. After each deploy the list empties, which is surprising for a feature called "cached pages".
- A cached photo page whose image cache was wiped renders with broken images offline, so "cached" is not the same as "usable".
- `savedPageCatalog` hard-codes `/photos/${slug}` (Pitfall 7).
- Precache is `cache.addAll` (all-or-nothing). Adding region plates or the overview to it raises the chance of a failed install and makes first visits on mobile data heavier.
- The SW correctly skips Range, video and audio requests; keep that, because `Cache.put` rejects 206 responses.

**Prevention:**
- Keep page caches across deploys (a separate `pages-v1` cache pruned by catalog membership, not by build hash).
- List a page only when its HTML **and** its primary image are cached.
- Keep precache to `/`, `/offline` and their assets.
- Never cache media in the worker.

**Phase:** `debt` (PLAT-F2 sits with the edge-page code)

### Pitfall 19: A new public asset directory needs registering in four places
- `proxy.ts` matcher exclusions (`images/|terrain/|media/`),
- the guard's hash-name and orphan directories plus its manifest list,
- the SW cache-first prefixes,
- `next.config.ts` immutable `Cache-Control` sources `[REPO]`.

Miss one and new terrain or video files run the proxy per request, escape the hash, orphan and metadata rules, are re-fetched on every visit, or are cached for a year under a stable name.

**Prevention:** keep **one** exported list of served asset roots, used by all four (or checked by a test that compares them).
**Phase:** `terrain` / `video` (whichever adds the first new directory)

### Pitfall 20: Web Share (PHOTO-F2) edge cases
- **Availability.** `navigator.share` is missing on Linux Chromium (so in CI) and on most desktop Firefox `[LOW]`.
- **User activation.** It must be called within transient activation; `await fetch(...)` of an image file before `share()` loses activation (`NotAllowedError`, strictest in Safari).
- **Cancel.** A cancelled sheet rejects with `AbortError`, which is not an error to show.
- **Files.** Sharing the image file is a download in disguise, against the "no download button" decision.

**Prevention:** feature-detect and fall back to copy-link with visible confirmation; share `{ title, url: canonical }` only, with the URL taken from the view-model, never `location.href`; mock `navigator.share` in e2e; don't add `web-share=()` to `Permissions-Policy` when hardening headers.
**Phase:** `layout`

### Pitfall 21: Terminal step controls and transcript (ENG-F1)
- **Live-region flood.** Step controls that re-announce through `aria-live` on every character flood screen readers.
- **Duplicate reading.** A transcript beside an un-hidden animated terminal is read twice.
- **Contract.** The WCAG 2.2.2 pause control and its tests are an existing contract.

**Prevention:** the animated terminal is `aria-hidden`, and the transcript is the accessible source (a list of steps, always in the DOM). Step buttons have names and `aria-controls`; one polite announcement per step. Under reduced motion, show the full transcript statically. Rewrite `demo-terminal` tests in the same commit, and expect `/projects/box` baseline changes.
**Phase:** `layout` (or a small engineering plan)

### Pitfall 22: UI debt fixes that regress something else
- **375 px Home overflow.** The quick fix `overflow-x: hidden` on `html`, `body` or `main` turns them into scroll containers and **breaks `position: sticky`**, which the ascent stage and the rail layer depend on. Find the overflowing element first, then use `overflow-x: clip` only if a clamp is still needed `[DOCS: MDN overflow]`.
- **Mobile menu on the current page.** Tapping the current link doesn't change `usePathname()`, so an effect keyed on the pathname never closes the panel. Close it in the link's click handler (07 WR-06).
- **Focus after lightbox Escape.** The cause is undiagnosed. With `replaceState` stepping, the originating tile is often **not** the current photo's tile, and it may be off-screen or re-rendered by the morph. Diagnose first, then return focus to the current photo's tile, scrolled into view under `scroll-padding-top`.
- **Clipped menu focus ring.** `overflow: hidden` on the panel clips outlines; use an inset outline or panel padding.
- **The 4.81:1 rail label.** It sits over terrain, where the contrast guard's token pairs cannot see the backdrop. Measure the composed contrast or put the label on a solid token surface.

**Phase:** `debt` (each its own commit and expected PNG set, Pitfall 10)

### Pitfall 23: Refactoring the photo scripts before writing the missing tests
Nyquist G5 (`OffsetTimeOriginal` guard and build-time throw in `build-photo-data.mjs`) and G6 (validate → write → unlink order in `build-derivatives.mjs`) need small testability changes (`--sidecar`, `--out-dir`) `[REPO: audit]`. Multi-region work rewrites exactly these scripts. Writing G5 and G6 **first**, as characterization tests, protects the refactor. Writing them after tests the new code against itself.
**Phase:** `debt` → before `data`

### Pitfall 24: Upgrading axe after building new components
axe-core 4.14 fails the gate on `label-content-name-mismatch` for 13 existing elements, 4 of them real (grid tiles) `[REPO: audit]`. Every new pin, plate, region card or share button with an `aria-label` different from its visible text adds more. Decide the upgrade early, fix the 4 real ones, and write new components to the rule from day one.
**Phase:** `debt` (early)

---

## Minor Pitfalls

- **Contour interval drift:** each plate auto-picks an interval from its relief and the series stops looking like one survey. Fix intervals per scale (plate vs overview) in config. *(terrain)*
- **Hillshade light per plate:** keep the approved 315°/45° + 270°/55° NW lighting for every plate, or relief reads inconsistently between regions. *(terrain)*
- **Same time zone, different assumption:** Italy and Austria share CET/CEST, but a phone set to UTC or a drone writing UTC into `DateTimeOriginal` shifts the capture date. Keep the per-photo correction path. *(data)*
- **Season tags across hemispheres:** irrelevant for the Alps; just don't generalise the meteorological-season helper beyond them without a hemisphere check. *(data)*
- **Proxy imports photo data:** `proxy.ts` imports `photoSlugs` from the full view-model (manifest, editorial and stories), so every new photo grows the proxy bundle. Generate a slugs-only module. *(routing)*
- **OG cards for region pages:** reuse the shared template with committed fonts. The latin subset lacks some glyphs (the U+2192 arrow, Phase 12), and Italian or German place names with diacritics need a glyph check. *(routing)*
- **Region names in three languages:** "Cervinia"/"Breuil-Cervinia", "Südtirol"/"Alto Adige". Pick one display name plus an optional local name in data; don't let the identity or palette guards flag diacritics. *(data)*

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| Treat "all photos" as Home waypoints a bit longer | No data-model refactor | Home changes with every content drop; build throws outside the extent | Never in v2.1; split before the first new photo |
| Blend two DEMs inside one plate | Covers an awkward region | Seams, mixed datums and licences, no single "Last surveyed" | Never; resize the plate or pick another region |
| Copernicus GLO-30 for local plates | One global source | DSM canopy bias and shaved peaks at the scale where they show | Only for the coarse overview |
| Raise `MAX_CLIP_BYTES` globally | Drone clip fits | Every clip may grow unnoticed | Never; per-clip budgets with a reason |
| Host video on Blob or YouTube | Bypasses repo and deploy size | Leaves the guard, widens CSP, Hobby lockout or third-party tracking | Only with Tim's written CSP decision and an equivalent metadata check |
| Redirect old photo URLs with one broad pattern | One line in `next.config` | Catches region and OG paths; chains | Never; generate exact-slug redirects from data |
| Keep `[ci skip]` commits on PR branches | Saves CI minutes on docs | Required checks deadlock | Never on a PR head once checks are required |
| One `test()` per photo | Clear failure names | Ratchet locks the count to the data size | Never; loop with `expect.soft` inside one test |
| One big re-baseline after the redesign | One Tim checkpoint | Unintended diffs ride along | Never; stage per cause (Pitfall 10) |
| `overflow-x: hidden` on `body` for the 375 px overflow | One line | Kills sticky stage and rail | Never; fix the element, `clip` if needed |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| swisstopo swissALTIRegio | Assuming it stops at the border | It covers to about 12° E and 44.8–48.7° N with TINITALY and DGM Österreich inside; check region footprints first |
| TINITALY 1.1 (INGV) | Ignoring UTM 32N, −9999 nodata and the DOI citation | Reproject at build time, mask nodata, cite "INGV, doi:10.13127/tinitaly/1.1, CC BY 4.0" next to the plate |
| DGM Österreich (geoland.at) | Mixing MGI/Lambert and Adria heights with LN02 silently | One source per plate; record `heightSystem: EPSG:5778`; credit "geoland.at" (CC BY 4.0) `[LOW: confirm current licence text]` |
| Copernicus GLO-30/90 | Using a DSM as a DTM; skipping the mandatory notice | Overview only; copy the notice verbatim from the licence |
| DJI media | Trusting ffmpeg defaults; ignoring `.SRT`/`.LRF`; old ExifTool (Ubuntu's 12.76 can't decode the newer `djmd` GPS) | `build-clip.mjs` with explicit `-map` flags; guard bans sidecars; verify the output bytes, not the tool's flags |
| Vercel Hobby | Assuming overage billing | Usage pauses for 30 days; budget bytes per play |
| Upstash | Checking only `UPSTASH_*`; free-tier archival | Accept either pair; fail closed in production; keep-alive or monitored 503 |
| GitHub rulesets | Requiring jobs by fragile names; `[ci skip]` heads | One aggregate `ci-ok` gate; no skip markers on PR heads |
| Vercel Deployment Checks | Combining with branch protection without testing | Test the combination; Vercel warns about check-run collisions |
| Next redirects / intercepts | Redirects that catch new routes; missing `default.tsx` | Data-generated exact redirects; `default.tsx` and catch-all per slot level |
| schema.org / Google | `next/script` for JSON-LD; unescaped strings; precise coordinates | Plain `<script type="application/ld+json">`, `<` escaping, 4-dp coordinates |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| Generated data imported by client components | JS total rises after "data only" commits | `server-only` data modules, page-scoped props | HOME-08 margin is 6.2%, roughly 29 KB |
| Overview contour SVG from a fine raster | Slow `/photos` LCP, large HTML | About 1 km cells, 250–500 m interval, ≤ 150 KB budget | Over about 200 KB of path data |
| 3D carousel over all photos | iOS context loss, poster fallback everywhere | One series, windowed textures | About 10–15 textures on mid-range phones `[LOW]` |
| Audit gate over every slug in every engine | E2E past the 60-minute job timeout | Templates × engines × widths, all slugs once in Chromium | About +25 routes |
| `terrain:build --check` per region in lint | Slow lint feedback | Parallelise or split the step | 3+ regions `[LOW]` |
| Wrong `sizes` on full-bleed images | Phones download 2,560 px | Per-breakpoint `sizes`, photo-page LCP budget | Any immersive page |
| Precache growth | Install failures, heavy first visit | Precache only `/`, `/offline` and their assets | Each added plate |
| Autoplay ambient video | Data use and Hobby transfer drain | Small loop, `preload="none"` for full renditions | About 8,000 plays of a 12 MB clip per month |

## Security Mistakes

| Mistake | Risk | Prevention |
|---|---|---|
| Tracking DJI `.SRT`/`.LRF`/flight logs | Per-frame GPS and serials public in git history (D-12: history isn't rewritten) | Guard bans the extensions; sources stay in gitignored `assets/` |
| Widening the sidecar schema for drone XMP | Serial, flight altitude and yaw committed | Closed zod schema; aerial photos without altitude or with ground height |
| 4-dp pins at private places | Reveals homes or take-off spots | Per-photo precision override; "approx." pins |
| Nested photo routes outside `DETAIL_PATH` | Typed slug reflected in flight data again (T-12-03 regression) | Extend proxy matching and tests with the route change |
| External video host | CSP widened, metadata unchecked, third-party tracking | Same-origin MP4; any exception needs a CSP decision and a byte check |
| JSON-LD from raw strings | Script-context injection | `<` escaping, view-model input only |
| Rate limiter fail-open | Contact form spam relay | Fail closed in production; honeypot probe |
| Admin bypass on `main` | Red code deploys | Ruleset with empty bypass list; API-verified |
| Sharing image files via Web Share | Full-size download path | Share URL only |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---|---|---|
| Overlapping overview pins on phones | Can't pick a region | Clusters or leader lines; DOM region list as the primary path |
| Stepping prev/next across regions without notice | Lost in the series | Stay within the series; show "3 / 12 · Zermatt" |
| Immersive layout hiding nav and escape routes | Keyboard and screen-reader users stranded | Nav reachable at all times; Escape and Back unchanged |
| Ambient video with no pause | Fails 2.2.2, distracting | Pause control; no autoplay under reduced motion or Save-Data |
| LV95 on non-Swiss photos | Wrong, confusing coordinates | `country === 'CH'` only |
| Contours over photographs | Colour cast on the work itself | Frame the photo, never overlay it |
| One region's map plates reused for 20 photos | Label collisions, unreadable plates | Numbered pins and key; label on hover or focus only |
| "Saved pages" emptying after each deploy | Offline list looks broken | Persist page cache across deploys; list only usable pages |

## "Looks Done But Isn't" Checklist

- [ ] **Data split:** Home still shows exactly 4 waypoints and the rail starts at 1,617 m after adding a lower photo; 48 baselines unchanged in the split commit.
- [ ] **Originals:** No tracked `.srt/.lrf/.gpx/.kml/.dat`; sidecar has no serial or XMP keys; ids unique across cameras and regions.
- [ ] **Terrain source:** Each plate has exactly one `source`, a recorded `heightSystem` and `edition`, and a visible credit next to it; Zermatt hashes unchanged after the refactor.
- [ ] **Projection:** proj4 comparison test at the farthest pin ≤ 1 m (or proj4 used at build); LV95 shown only for `country === 'CH'`, tested with an Italian-side Zermatt photo.
- [ ] **Overview:** No pin overlap at 375 px; SVG ≤ 150 KB; no `href` in served SVGs; axe `label-content-name-mismatch` clean on new components.
- [ ] **Routing:** Hard refresh works on every route type; a soft navigation from an open lightbox to a region page closes it; unknown nested slug gives the neutral 404 with no slug in script data.
- [ ] **SEO:** Every old `/photos/<slug>` and its OG image URL 308s in one hop; sitemap equals canonicals; no internal 3xx links.
- [ ] **JSON-LD:** Parses, `<` escaped, ≤ 4-dp coordinates, zero CSP events.
- [ ] **View Transitions:** No duplicate names on any page model; no Firefox-only flakes.
- [ ] **Baselines:** Each re-baseline's changed set equals the plan's declared set; Playwright 1.65 landed alone.
- [ ] **Ratchet:** No per-row tests; count went up only by real tests.
- [ ] **Video:** Per-clip byte budget; poster with fixed aspect ratio; pause control; text alternative; no autoplay under reduced motion, Save-Data or a rejected `play()`; tests don't assert playback.
- [ ] **Hobby:** Projected monthly bytes for media written down against 100 GB.
- [ ] **Required checks:** `gh api …/rules/branches/main` shows the ruleset; a red test PR cannot merge; a `[ci skip]`-free PR head merges.
- [ ] **Rate limiter:** The 6th honeypot probe on production answers 429; the production env scope is recorded.
- [ ] **Offline:** The saved list survives a deploy; listed pages render their images offline.
- [ ] **Budgets:** HOME-08 re-measured at the end of each layout plan; photo-page LCP budget exists.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| Home changed by new photos | LOW | Revert the content commit; do the data split; re-add photos |
| Sidecar or telemetry pushed to the public repo | HIGH | Delete the file and add the guard rule. Location data cannot be rotated like a key, and the file stays reachable in git history under D-12 unless Tim runs a filter-repo purge |
| Mixed-source seam on a plate | MEDIUM | Re-extent the plate inside one source; re-run `terrain:build`; new hashes, one re-baseline |
| Zermatt hashes changed by a refactor | LOW | Revert the refactor; restore byte identity first |
| Region links opening as a lightbox | LOW | Move series out of `/photos/[x]`, or add the region guard in the intercept and proxy |
| Old URLs 404 after a URL change | MEDIUM | Ship data-generated redirects immediately; resubmit the sitemap |
| Re-baseline accepted an unintended diff | MEDIUM | Bisect by re-running the visual job on earlier commits; revert the PNG commit; re-baseline per cause |
| Ratchet locked to a per-row count | LOW | Convert to one looping test while **adding** an equal number of real tests (the baseline can't be lowered) |
| Hobby transfer exhausted | HIGH | Site features paused up to 30 days; swap the video for a poster immediately; upgrading the plan is Tim's decision |
| Required checks deadlocked | LOW | Push an empty commit to re-trigger; switch the requirement to the aggregate gate |
| Upstash archived | LOW | Restore from the Upstash console backup; add keep-alive or upgrade |

## Pitfall-to-Phase Mapping

Suggested order of phase types: **debt (repo safety and test gaps) → data → terrain → routing → layout → video**, with the UI debt fixes inside `debt` before any layout re-baseline.

| Pitfall | Prevention Phase | Verification |
|---|---|---|
| 15 Required checks | debt (first) | Ruleset via API; red PR blocked; `ci-ok` aggregate required |
| 10 Baseline staging (1.65) | debt (first) | 1.65 bump + container tag in one commit; changed set ⊆ declared |
| 16 Rate limiter | debt | Production honeypot probe → 429; env scope recorded |
| 23 G5/G6 before refactor | debt → data | New tests red on a seeded fault, green on current code |
| 24 axe 4.14 | debt (early) | Gate green on 4.14 with the 4 real fixes |
| 11 Ratchet and audit gate | debt, every phase | E2E under 45 minutes; no per-row tests; all slugs audited once |
| 22 UI debt fixes | debt | Sticky stage intact at 375 px; one PNG set per fix |
| 18 SW / PLAT-F2 | debt | Saved list survives a simulated deploy; images render offline |
| 1 Data split | data | Home unchanged with a lower test photo; 48 baselines unchanged |
| 2 Originals and drone privacy | data, video | Guard selftests for each banned extension; closed sidecar schema |
| 3 DEM source choice | terrain (first task) | One source per plate; credit per plate; footprint check recorded |
| 4 Projection and country | terrain, data, layout | proj4 comparison test; Italian-side Zermatt photo shows no LV95 |
| 5 Byte-identical refactor | terrain | `terrain:build --check` green on old artifacts |
| 6 Overview map | terrain, layout | 375 px collision test; SVG budget; axe rule on |
| 19 Asset directory registration | terrain / video | Test comparing the four lists |
| 7 Route restructure | routing | Hard refresh, soft nav, Back, unknown nested slug e2e |
| 8 SEO / OG | routing | Redirect table test; no internal 3xx; sitemap = canonical |
| 9 View Transitions | routing, layout | No duplicate names test; three-engine e2e stable |
| 17 JSON-LD | routing | Parse and escape test; zero CSP events |
| 12 Immersive layout budgets | layout | HOME-08 re-run; photo-page LCP budget; no overlays on photos |
| 20 Web Share | layout | Mocked share e2e; copy-link fallback |
| 21 ENG-F1 transcript | layout | Screen-reader order check; reduced-motion static transcript |
| 13 Video weight and hosting | video (first task) | Per-clip budget in guard; no CSP widening; byte projection |
| 14 Video a11y / LCP / CLS | video | Pause control, text alternative, poster, CLS ≤ 0.1, no playback asserts |

**Research flags for phases:**
- `terrain` needs a spike: footprint check of the chosen regions, a proj4 vs `lib/geo.ts` error measurement at the far pins, and the overview source and licence text.
- `routing` needs a spike on the intercept with any new sibling segment before planning (the static-sibling case is unverified).
- `video` needs format and hosting research with real footage sizes before any plan (it is also a milestone requirement).
- `debt` repo-safety is standard; verify through the API.

## Sources

**Repository inspection (HIGH):**
- `lib/photos/view-model.ts` (canonical order from `buildWaypoints`, hard-coded canonical), `lib/ascent/waypoints.ts`, `data/generated/photos.ts` (`lowestDemM`), `scripts/photos/build-photo-data.mjs` (extent throw), `scripts/photos/extract-exif.mjs` (id rule, sidecar fields), `data/photos/exif-sidecar.json`
- `scripts/terrain/fetch-dem.mjs` (single EXTENT, no-resampling and no-nodata contract), `data/terrain/source/source.json` (`heightSystem: LN02`, edition 2026-05), `lib/geo.ts` (approximate formulas, import-free rule)
- `scripts/guards/check-served-images.mjs`, `scripts/guards/lib/mp4-boxes.mjs` (1.5 MiB cap, box whitelist, extension list), `data/media/clips.json`, `data/generated/media-manifest.ts`
- `proxy.ts` (`DETAIL_PATH`, `KNOWN`, neutral 404, `buildCsp`, matcher), `next.config.ts` (immutable headers, Permissions-Policy), `public/service-worker.js` (activate wipes caches; media bypass), `lib/saved-pages.ts`
- `app/(site)/photos/**` (intercept, slot defaults, `dynamicParams = false`), grep of `` `/photos/${` `` (11 sites), `components/photos/PhotoViewer.tsx` (`replaceState`, VT names)
- `.github/workflows/ci.yml`, `visual-baselines.yml`, `vercel.json`, `playwright.config.ts`, `scripts/guards/test-count.mjs` and baseline, `e2e/routes.ts`, `e2e/visual/routes.spec.ts`, `e2e/demo-clip.spec.ts`
- `lib/rate-limit.ts`, `app/api/feedback/route.ts`
- `.planning/milestones/v2.0-MILESTONE-AUDIT.md`, `.planning/RETROSPECTIVE.md`, `.planning/PROJECT.md`

**Official docs (MEDIUM; seam tier LOW, re-check in phase):**
- [swisstopo swissALTIRegio product page](https://www.swisstopo.admin.ch/en/height-model-swissaltiregio): coverage ≥ 100 km beyond the border, foreign sources, no altimetric transformation abroad, credit lines
- [swissALTIRegio STAC item](https://data.geo.admin.ch/api/stac/v1/collections/ch.swisstopo.swissaltiregio/items/swissaltiregio): bbox 4.516–11.990 E, 44.837–48.749 N
- [TINITALY (INGV)](https://tinitaly.pi.ingv.it/): CC BY 4.0, UTM 32N, DOI citation
- [Copernicus DEM on Copernicus Data Space](https://dataspace.copernicus.eu/node/1306), [GEE catalogue GLO-30](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_DEM_GLO30): EGM2008, licence notice
- Next.js bundled docs: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` (execution order: redirects before proxy), `intercepting-routes.md`, `parallel-routes.md` (default.js, unmatched slots, catch-all to close modals), `02-guides/json-ld.md` (`<` escaping, plain script tag), `02-guides/videos.md` (dimensions, poster, captions)
- [GitHub: troubleshooting required status checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks): skipped workflows stay Pending; `if:`-skipped jobs report Success
- [Vercel Deployment Checks](https://vercel.com/docs/deployment-checks), [Vercel limits](https://vercel.com/docs/limits), [Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [Vercel Blob usage and pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Upstash Redis FAQ (free-tier archival after 14 days)](https://upstash.com/docs/redis/help/faq), [upstash redis-js on Vercel (`fromEnv` names)](https://www.mintlify.com/upstash/redis-js/platforms/vercel)
- [W3C Understanding SC 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide)
- [web.dev LCP](https://web.dev/lcp), [Chromium LCP changelog 2023-08](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/2023_08_lcp.md): autoplay video first frame counts
- [web.dev: same-document view transitions Baseline (Firefox 144)](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available)
- [MDN script-src](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)

**Community / LOW:**
- [SANS ISC: Video meta data, DJI drones](https://isc.sans.edu/diary/31014) (serial in MP4, GPS in `.SRT`); [dji-embed MP4 timed metadata notes](https://raw.githubusercontent.com/CallMarcus/dji-drone-metadata-embedder/master/docs/MP4_TIMED_METADATA.md) (`djmd`/`dbgi`, ExifTool versions); [ExifTool forum on DJI subtitle tracks](https://exiftool.org/forum/index.php?msg=48568)
- [DORIS (Upper Austria) DGM record](https://doris-metadaten.ooe.gv.at/at.gv.ooe.doris.geonetwork_extern/srv/api/records/C37B02D1-501F-4001-8F67-891094A4CB7B) (EPSG:5778, CC BY 4.0); [Wikipedia: Metres above the Sea (Switzerland)](https://en.wikipedia.org/wiki/Metres_above_the_Sea_(Switzerland)) (CH/AT offsets)
- [Search Engine Journal: changing image URLs](https://www.searchenginejournal.com/google-changing-image-urls-will-affect-rankings-in-image-search/286163/); [Google: site move with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [Mergify: path filters are not a CI gate](https://mergify.com/blog/path-filters-are-not-a-ci-gate)
- iOS Low Power Mode autoplay: [Apple developer forums thread](https://developer.apple.com/forums/thread/709821) and community reports
- Back-of-envelope figures (pixels per km at 375 px, grid convergence, video bytes per minute, texture VRAM) are my own arithmetic; treat as estimates

---
*Pitfalls research for: v2.1 Survey Expansion (adding region series, multi-region terrain, overview map, immersive layout, drone video, deferred features and v2.0 debt to the guarded portfolio)*
*Researched: 2026-11-12*
