# Architecture Research

**Domain:** v2.1 "Survey Expansion": region photo series, an Alps overview map, a multi-plate terrain pipeline, drone video and five deferred features, added to the shipped Next 16.4.5 / React 19.3 portfolio
**Researched:** 2026-11-12
**Confidence:** HIGH for the repo integration points (read from the code) and for the Next 16.4 behaviour (checked against `node_modules/next/dist/docs` and the Next source in `node_modules/next/dist`). MEDIUM for the terrain-source and CRS recommendations: the swissALTIRegio coverage comes from swisstopo's STAC item and matches the attribution already in `data/site.ts`, but the research seam rates web providers LOW. LOW for anything marked **[SPIKE]**.

> Scope: only what the new v2.1 features need. Everything in `.planning/milestones/v2.0-research/ARCHITECTURE.md` (route group, lightbox interception, generated data, tokens, VT patterns) is taken as built. The `.planning/codebase/*.md` maps are from February 2026 and out of date; this document cites the current code.

---

## 0. Repo facts that shape v2.1 (read from the code)

| # | Fact | Where | Consequence |
|---|------|-------|-------------|
| F1 | **swissALTIRegio already covers most of the Italian and Austrian Alps.** STAC bbox 4.516°E–11.990°E, 44.837°N–48.749°N. swisstopo builds it from swissALTI3D, TINITALY (IT), DGM10 (AT), RGE ALTI (FR) and DGM1/EU-DEM (DE). `site.attribution.terrain` already credits TINITALY and DGM Österreich for that reason | STAC item `ch.swisstopo.swissaltiregio`; `data/site.ts` | A region west of about 11.7°E (Aosta/Cervinia, Gran Paradiso, Ortler/Stelvio, Ötztal, Stubai, Innsbruck) needs **no second DEM source and no new projection code**. The second source is only needed for the Alps-wide overview and for regions east of about 11.7°E (Dolomites core, Hohe Tauern, Salzburg). **This is a scoping decision for Tim before the roadmap is fixed** |
| F2 | One terrain extent everywhere. `terrain.ts` has one `extent.lv95`. `build-photo-data.mjs` **fails** when a photo lies outside it (WR-01) | `data/generated/terrain.ts`, `scripts/photos/build-photo-data.mjs` | Every photo needs a plate. Membership must be explicit, and each plate needs its own UV space |
| F3 | Home, the footer, the photo views and the OG card all read **all** photos | `lib/ascent/waypoints.ts` (`buildWaypoints` over every photo), `SiteFooter.tsx` (one tick per photo), `TrailSigns.tsx` (`photos.length` "waypoints"), `lowestDemM` over all photos, `lib/photos/view-model.ts` built on `buildWaypoints` | Adding one photo today adds a Home waypoint, a footer tick and moves the altimeter rail start. "Home keeps its four waypoints" needs an **explicit home list** and a split between Home waypoints and album views |
| F4 | 13 places build `/photos/${slug}` by hand, including `history.replaceState` in `PhotoViewer` and its title-keeper effect | `JustifiedGrid`, `MapSheet`, `CarouselView/Controls/Stepper`, `WaypointCard`, `PhotoViewer` (×2), `sitemap.ts`, `saved-pages.ts`, plus about 15 e2e specs | Centralise URL building (`photoHref`) **before** the URL changes. Then the URL change is a one-line flip |
| F5 | `proxy.ts` decides misses with `/^\/(photos\|projects)\/([^/]+)$/` against `photoSlugs`, and imports the whole view-model (editorial copy, manifests) into the proxy bundle | `proxy.ts` | Under nested URLs `/photos/zermatt` would count as an **unknown photo**. Both the regex and the known-set change. Use a slim route list, not the view-model |
| F6 | The per-photo OG card URL carries a hash of the **parent route path**: `djb2(parentPathname)`, which includes `(site)`, so `/photos/<slug>/opengraph-image-<h>/card` | `node_modules/next/dist/lib/metadata/get-metadata-route.js` `getMetadataRouteSuffix` | Moving the route to `[region]/[slug]` changes `<h>`. A pattern redirect of old card URLs would land on a 404. See §3.4 |
| F7 | Interception rewrites match the intercepting route **and every descendant**: the `Next-Url` regex ends in `(?:/.*)?` | `node_modules/next/dist/esm/lib/generate-interception-routes-rewrites.js` | One `photos/@modal` slot intercepts photo links from `/photos` **and** from `/photos/<region>` (HIGH; read from source) |
| F8 | Sibling dynamic segments with different names are a hard error: "You cannot use different slug names for the same dynamic path" | `next/dist/shared/lib/router/utils/sorted-routes.js` | `/photos/[region]` and `/photos/[slug]` cannot coexist. Nested URLs need a redirect for the old flat slugs |
| F9 | **PLAT-F2 is already shipped.** `/offline` lists cached pages through `SavedPages` + `lib/saved-pages.ts` (12-15, EDGE-02, UI-SPEC E11) | `components/site/SavedPages.tsx`, `lib/saved-pages.ts` | v2.1 PLAT-F2 is **only** a catalog extension (region pages, nested photo URLs, a "Series" label). Re-scope the requirement |
| F10 | A same-origin video pipeline exists: `build-clip.mjs` (ffmpeg locally, committed hashed MP4 + WebP poster), `media-manifest.ts`, an MP4 box-walker guard (rejects `©xyz`, `loci`, `XMP_`, `uuid`, more than one track, any MP4 over 1.5 MiB under `public/`), and a service worker that leaves `video`/Range requests to the network | `scripts/media/build-clip.mjs`, `scripts/guards/check-served-images.mjs`, `public/service-worker.js` | Drone video should extend this, with a separate size budget class. The walker already blocks DJI GPS boxes and extra data tracks |
| F11 | The `contours-map` LOD (50 m, 93 KB) has **no consumer**. MapSheet, PosterSheet, EdgeArt and OG use `hero`; the footer uses `strip` | `git grep` over `components lib app` | New plates can skip the `map` LOD (about 90 KB each). Leave Zermatt's set alone so its outputs stay byte-identical |
| F12 | Heightmaps (94 + 352 KB) are used only by the Home R3F canvas | `TerrainMesh.tsx` | Region plates are 2D (MapSheet: hillshade + hero contours), so they need **no heightmaps**. Make `heightmap` optional per plate |
| F13 | `TerrainSource` is `product: z.literal('swissALTIRegio')`, `crs: 'EPSG:2056'`, `heightSystem: 'LN02'`; `Capture.timeZone` is `z.literal('Europe/Zurich')`; `PhotoId` is `/^(img-\d{4}\|r\d{3}-\d{3})$/` | `data/schemas/terrain.ts`, `data/schemas/photo.ts` | A second product, a new camera or drone file naming, and IT/AT photos all hit schema literals. CET/CEST offsets are the same in Rome and Vienna, so only the label changes |
| F14 | Every hashed asset name is flat (`/terrain/<name>.<10hex>.<ext>`): schema regex, guard `HASH_NAME` (no `/`), `next.config` cache headers, SW prefix rules, proxy matcher exclusion | `data/schemas/terrain.ts`, `check-served-images.mjs`, `next.config.ts`, `public/service-worker.js`, `proxy.ts` | **Name plates by prefix, not by subdirectory**: `/terrain/aosta-contours-hero.<hash>.svg`. Then five consumers need no change |
| F15 | `build-terrain.mjs` deletes "stale managed files" with one global `MANAGED` regex | `scripts/terrain/build-terrain.mjs` | A per-plate run would delete the other plates' files. One builder must own all plates per run |

---

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ MANUAL, NETWORKED (Tim's machine; outputs committed, never run in CI/Vercel)         │
│  terrain:fetch --plate <id>   adapters: swissaltiregio | <second product> | overview │
│     └─► data/terrain/source/<plate>/{source.json, dem.png}   (square metric grid,    │
│         grey16, sha256 recorded; reprojection happens HERE, once)                    │
│  photos:exif / photos:derive  (originals stay in gitignored assets/)                 │
│  clip:derive                  (drone + demo clips, ffmpeg, metadata stripped)        │
├────────────────────────────────────────────────────────────────────────────────────┤
│ OFFLINE, DETERMINISTIC (write mode locally; --check in lint via data:check)          │
│  data/terrain/plates.json ─┐                                                         │
│  data/regions/regions.json ┼► terrain:build ─► public/terrain/<plate>-*.<hash>.*     │
│  source/<plate>/*          ┘                 └► data/generated/terrain.ts            │
│                                                 { plates: {…}, overview: {…},        │
│                                                   terrain: plates.matterhorn }       │
│  sidecar + corrections + regions + plate DEMs ─► photos:build ─► generated/photos.ts │
│                                                 (region, plate, uv-in-plate, DEM m)  │
├────────────────────────────────────────────────────────────────────────────────────┤
│ DATA LAYER (typed, server-imported)                                                  │
│  data/schemas/{region,terrain,photo}.ts   data/regions/regions.json                  │
│  data/home.ts (+ waypointIds)   data/photos/editorial.ts   lib/photos/routes.ts      │
│  lib/photos/view-model.ts → seriesViews(region), photoViews, photoHref, regionHref   │
├────────────────────────────────────────────────────────────────────────────────────┤
│ ROUTES  app/(site)/photos/                                                           │
│   layout.tsx {children}{modal}                                                       │
│   page.tsx            /photos            ?view=map → AlpsOverview | grid | carousel  │
│   [region]/page.tsx   /photos/<region>   ?view=map → RegionPlate  | grid | carousel  │
│   [region]/[slug]/page.tsx  + opengraph-image.tsx   full photo page + JSON-LD        │
│   [region]/opengraph-image.tsx                                                       │
│   @modal/{default,page}.tsx → null · @modal/[region]/page.tsx → null                 │
│   @modal/(.)[region]/[slug]/page.tsx → LightboxDialog + PhotoViewer                  │
│  next.config.ts redirects(): 4 frozen legacy slugs → /photos/zermatt/<slug> (308)    │
│  proxy.ts: 404 decision for /photos/<region> and /photos/<region>/<slug>             │
├────────────────────────────────────────────────────────────────────────────────────┤
│ SHARED PRIMITIVES (server, zero JS)                                                  │
│  ContourField(plate, lod) · SheetMargin(plate) · PlateSheet(plate, photos)           │
│  SiteFooter = SheetMargin(home plate) + home-waypoint ticks (unchanged pixels)       │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities (NEW / MODIFIED)

| Component / file | Responsibility | Status |
|---|---|---|
| `data/schemas/region.ts` | `Region` (id, name, sheetTitle, country, intro, plate, landmark, photo membership, optional flyover clip) and `RegionId` | **NEW** |
| `data/regions/regions.json` | The series registry: hand-written, read by the generators (JSON so `.mjs` scripts and Node type-stripping need no TS import of copy) | **NEW** |
| `data/terrain/plates.json` | Plate registry: id, product, CRS, extent, cell size, LOD set, poster sizes, `threeD` flag. Separate from regions on purpose (§1.2) | **NEW** |
| `data/schemas/terrain.ts` | `TerrainSource` becomes a discriminated union on `product`. `TerrainMeta` becomes per-plate with an optional heightmap and optional summit; an `OverviewMeta` is added; flat prefixed asset URL regex | **MODIFIED** |
| `data/schemas/photo.ts` | `PhotoFacts` gains `region`, `plate`, `elevation.product`. `PhotoId` regex widened (drone / second camera). `timeZone` enum widened, or keep Zurich and document that CET/CEST is shared | **MODIFIED** |
| `scripts/terrain/fetch-dem.mjs` → `fetch-dem.mjs --plate <id>` + `scripts/terrain/sources/*.mjs` | One adapter per product; the reprojection to a square metric grid lives here only | **MODIFIED** + **NEW** adapters |
| `scripts/terrain/build-terrain.mjs` | Loops over all plates plus the overview in one run; per-plate prefixes; one global stale-file sweep; Zermatt (`matterhorn`) outputs byte-identical | **MODIFIED** |
| `scripts/photos/build-photo-data.mjs` | Reads regions + plates; samples each photo's height on **its plate's** DEM; checks membership (every sidecar id in exactly one region) and that the position is inside the plate | **MODIFIED** |
| `lib/geo.ts` (+ `lib/geo/laea.ts`, and `lib/geo/utm.ts` only if a non-LV95 plate ships) | Generic `toPlateXY(wgs84, crs)`; LAEA forward for the overview; UTM only when needed | **MODIFIED** / **NEW** |
| `data/home.ts` | Adds `waypointIds` (the four v2.0 ids, frozen) | **MODIFIED** |
| `lib/ascent/waypoints.ts`, `lib/ascent/summit.ts` | Filter to `home.waypointIds`; `lowestDemM` computed over the home waypoints (no longer generated over all photos) | **MODIFIED** |
| `lib/photos/view-model.ts` | Split per-photo derivation from Home ordering; `seriesViews(region)` (DEM-height order inside a region), `photoHref`, `regionHref`; `factSource('dem')` names the plate's product; strip gains an LV95 row for CH regions (PHOTO-F4) | **MODIFIED** |
| `lib/photos/routes.ts` | Slim, data-only route list (region ids, `{region, slug}` pairs, the frozen legacy map) for proxy, sitemap, saved-pages, e2e | **NEW** |
| `app/(site)/photos/page.tsx` | Becomes the album index: Map view = Alps overview with one pin per region; Grid/Carousel = all photos grouped by series | **MODIFIED** |
| `app/(site)/photos/[region]/page.tsx` | Series page: intro, local plate (Map), Grid, Carousel, optional flyover video, SheetMargin | **NEW** |
| `app/(site)/photos/[region]/[slug]/page.tsx` | Full photo page (moved from `[slug]`), JSON-LD | **MOVED + MODIFIED** |
| `app/(site)/photos/@modal/(.)[region]/[slug]/page.tsx` | Intercepted lightbox (moved from `(.)[slug]`) | **MOVED** |
| `app/(site)/photos/@modal/[region]/page.tsx` | Returns `null`, so a soft navigation back to a series page closes the modal | **NEW** |
| `app/(site)/photos/[region]/opengraph-image.tsx` | Series card (region contour + sheet title) | **NEW** |
| `app/(site)/photos/[region]/[slug]/opengraph-image.tsx` | Photo card, moved; region-aware contour and sheet title | **MOVED + MODIFIED** |
| `lib/og/template.tsx` | `contourDataUrl(plate)`, card sheet title from the region, not `data/sheet.ts` | **MODIFIED** |
| `next.config.ts` | `redirects()` with the 4 frozen legacy slugs (pages **and** their old card URLs) | **MODIFIED** |
| `proxy.ts` | Region- and pair-aware miss detection; import `lib/photos/routes.ts`, not the view-model | **MODIFIED** |
| `app/sitemap.ts` | Region pages + nested photo URLs; legacy URLs dropped | **MODIFIED** |
| `components/terrain/ContourField.tsx` | Takes a plate (default: home plate) | **MODIFIED** |
| `components/site/SheetMargin.tsx` | The scale / equidistance / extent / last surveyed / source block, extracted from SiteFooter and parameterised by plate | **NEW** (extraction, zero visual diff in the footer) |
| `components/site/SiteFooter.tsx` | Renders `SheetMargin(home plate)`; ticks from the home waypoints only | **MODIFIED** (pixels unchanged) |
| `components/photos/MapSheet.tsx` → `PlateSheet` | Plate-parameterised local map (hillshade, hero contours, pins, landmark) | **MODIFIED** (generalised) |
| `components/photos/AlpsOverview.tsx` | Overview contour map, one pin and plate outline per region, links to `/photos/<region>` | **NEW** |
| `components/photos/PhotoViewer.tsx` | Gets the **series** list; uses `photoHref` in `replaceState` and the title-keeper; Share button (PHOTO-F2) | **MODIFIED** |
| `components/photos/ShareButton.tsx` | Web Share with a copy-link fallback (client island) | **NEW** |
| `components/photos/FlyoverClip.tsx` | Drone clip figure (server `<video>`, like `DemoClip`) | **NEW** |
| `data/schemas/media-manifest.ts`, `scripts/media/build-clip.mjs`, `check-served-images.mjs` | Clip kinds with per-kind byte budgets; drone clips keyed by region | **MODIFIED** |
| `lib/jsonld.ts` + `components/seo/JsonLd.tsx` | Typed builders + escaped serialiser; server component emitting `<script type="application/ld+json">` | **NEW** |
| `lib/demo-terminal.ts`, `components/projects/DemoTerminal.tsx`, `components/projects/sections/Demo.tsx` | `stepTo`/`step(dir)` pure transitions + Prev/Next controls; a server-rendered transcript | **MODIFIED** |
| `components/projects/TerminalTranscript.tsx` | Static `<details>` transcript (no JS) | **NEW** |
| `lib/saved-pages.ts` | Catalog gains series rows (`label: 'Series'`) and nested photo hrefs | **MODIFIED** |
| `e2e/routes.ts` | Adds `/photos/<region>` and a nested photo path, so the audit gate and visual baselines cover them | **MODIFIED** |

---

## Recommended Project Structure (delta only)

```
app/(site)/photos/
├── layout.tsx                       # unchanged: {children}{modal}
├── page.tsx                         # MOD: album index; ?view=map is the Alps overview
├── [region]/
│   ├── page.tsx                     # NEW: series page (plate / grid / carousel)
│   ├── opengraph-image.tsx          # NEW: series card
│   └── [slug]/
│       ├── page.tsx                 # MOVED from [slug]/page.tsx (+ JSON-LD)
│       └── opengraph-image.tsx      # MOVED from [slug]/opengraph-image.tsx
└── @modal/
    ├── default.tsx                  # unchanged (null)
    ├── page.tsx                     # unchanged (null at /photos)
    ├── [region]/page.tsx            # NEW (null at /photos/<region>)
    └── (.)[region]/[slug]/page.tsx  # MOVED from (.)[slug]
data/
├── regions/regions.json             # NEW: series registry (hand-written)
├── terrain/plates.json              # NEW: plate registry (hand-written)
├── terrain/source/<plate>/          # MOVED: matterhorn/{source.json, dem-10m.png} + new plates
├── terrain/source/overview/         # NEW: coarse Alps raster
├── schemas/region.ts                # NEW
└── generated/terrain.ts             # MOD: { plates, overview } + `terrain` = plates.matterhorn
lib/
├── photos/routes.ts                 # NEW: slim route list (proxy, sitemap, saved-pages)
├── geo/laea.ts                      # NEW: EPSG:3035 forward for the overview
└── jsonld.ts                        # NEW
public/terrain/
├── matterhorn-contours-hero.<h>.svg … # prefixed, flat
├── aosta-contours-hero.<h>.svg …
└── overview-contours.<h>.svg, overview-hillshade-<w>.<h>.{avif,webp}
```

### Structure Rationale

- **Flat prefixed asset names** keep the guard's `HASH_NAME`, the `TerrainAssetUrl` regex, the `/terrain/:path*` cache header, the SW `startsWith('/terrain/')` rule and the proxy matcher exclusion unchanged (F14).
- **Registries as JSON, copy in TS:** the generators (`.mjs`, Node type-stripping) must read region membership and plate extents. Editorial copy stays in `editorial.ts`, which the generators never import.
- **Keep the `terrain` export** (alias of the home plate) so the 11 Home and footer consumers compile unchanged. New code reads `plates[id]`.

---

## 1. Data model

### 1.1 Entities

```ts
// data/schemas/region.ts  (imports only 'zod'; erasable TS)
export const RegionId = z.string().regex(/^[a-z]+(-[a-z]+)*$/);       // URL segment, one-way once shipped
export const Region = z.strictObject({
  id: RegionId,                          // 'zermatt'
  name: z.string().min(1),               // 'Zermatt'
  sheetTitle: z.string().min(1),         // 'Zermatt – Matterhorn' (replaces data/sheet.ts per region)
  country: z.enum(['CH', 'IT', 'AT', 'FR', 'DE']), // drives PHOTO-F4 (LV95 only for 'CH')
  intro: z.string().min(1),              // ≤ 3 sentences, Tim's copy (D-05 style)
  plate: z.string(),                     // PlateId in data/terrain/plates.json
  landmark: z.strictObject({ name: z.string(), officialM: z.number().int(), officialRef: z.url(), lat: Coord4, lon: Coord4 }),
  photos: z.array(PhotoId).min(1),       // membership; display order is derived (DEM height, ties by id)
  flyover: ClipId.optional(),            // drone clip, §6
});
export const Regions = z.strictObject({ schemaVersion: z.literal(1), regions: z.array(Region).min(1) })
  .refine(/* ids unique; every photo id in exactly one region; ids ∩ LEGACY_PHOTO_SLUGS = ∅ */);
```

`data/home.ts` gains `waypointIds: ['img-0605', 'img-0629', 'img-0662', 'r004-011']`, frozen.

### 1.2 Plate ≠ region (recommended separation)

A **plate** is a terrain sheet: source raster, extent, assets. A **region** is an editorial series that points at one plate. Home points at the `matterhorn` plate directly.

Why separate: new Zermatt photos may fall outside today's 11 × 11 km extent (Monte Rosa, Dufourspitze at about E 2'633'000, is east of E 2'627'000). Growing that extent changes Home: heightmap, camera route, posters, every Home baseline and the HOME-08 budget (D-14: "costly to change"). With plates separate, the `zermatt` region can move to a larger `zermatt-wide` plate while Home keeps `matterhorn` byte for byte. While all Zermatt photos fit, both point at `matterhorn`.

### 1.3 Photo → region and where heights come from

- Membership is **explicit** (`regions[].photos`), not inferred from GPS. Explicit is reviewable, and plates can overlap.
- `photos:build` checks: every sidecar id is in exactly one region; its position projects inside **its** plate (WR-01 stays, per plate); its height is the bilinear sample of **its plate's** native source raster (D-17 unchanged, sampler unchanged). `Elevation` becomes `{ source: 'dem', product, m }`, so the strip and hotspots can say "Source: swissALTIRegio terrain model" or the second product's name. Today that label is hard-coded in `factSource('dem')`.
- **Photos outside swisstopo coverage:** the height comes from the plate's own source (the second product), with the same sampler, because the committed plate raster is already a square metric grid (§2.1). Height systems differ (LN02, EGM2008, national datums) by well under 1 m. That does not matter at whole-metre display; record `heightSystem` per source anyway.
- `uv` stays `[0,1]` in the photo's plate. Every consumer that places a pin must use the photo's plate, never the global `terrain`.
- `lowestDemM` stops being generated over all photos. Compute it in `lib/ascent` over the home waypoints (still 1,617 m). If it stays generated over all photos, the first lower photo anywhere in the Alps silently moves Home's altimeter rail.

### 1.4 CI staleness checks at N plates and 2 sources

`data:check` keeps its shape. Each step simply covers more inputs:

| Check | Change |
|---|---|
| `terrain:build --check` | Iterates plates + overview; per-plate sha256 of the committed source; the existing artifact rules per type (SVG/PNG/terrain.ts byte-exact or pixel-exact; lossy posters by hash/size/metadata/sourceSha256) |
| `photos:build --check` | Also reads `regions.json` and `plates.json`; byte-exact `photos.ts` |
| `photos:exif`, `photos:derive --check` | Unchanged mechanics; more ids (widened `PhotoId`) |
| `clip:derive --check` | Clip kinds with per-kind budgets |
| New Jest data tests | Regions parse; membership complete; legacy slugs ∩ region ids = ∅; photo slugs globally unique (VT names and the legacy map rely on it); per-plate asset budget (§2.4) |

---

## 2. Terrain pipeline

### 2.1 Per-plate build

**Rule: reproject once, at fetch time, into a square metric grid.** Then `build-terrain` stays source-agnostic and deterministic.

| Plate source | Committed grid CRS | New code |
|---|---|---|
| swissALTIRegio (any region inside 4.5–12.0°E, 44.8–48.7°N) | EPSG:2056 (LV95), 10 m, native COG window, no resampling (as today) | None. `fetch-dem.mjs` gains `--plate` and reads the extent from `plates.json` |
| Second product (only for plates east of about 11.7°E) | ETRS89 / UTM of the plate (EPSG:25832 or 25833), square cells, bilinear resampling **in the fetch adapter**, nodata = fail | Adapter in `scripts/terrain/sources/`, a projection library as a **devDependency used only in fetch scripts**, and a pure `lib/geo/utm.ts` so `photos:build` can project positions without that library |
| Overview | EPSG:3035 (ETRS89-LAEA: central meridian 10°E, so the Alps sit near its centre), about 500–1000 m cells, about 5°E–17°E × 43.5°N–48.5°N | Adapter + pure `lib/geo/laea.ts` (forward formula, about 30 lines, unit-tested against known points) for pins and plate outlines |

`build-terrain.mjs` per plate: load source (sha256 check) → `resampleBilinear` grids only if `threeD` → `hero` (+ `strip` for the SheetMargin band) contours via d3-contour/simplify-js (our code, deterministic) → hillshade posters (lossy, check-by-inspection as today) → landmark sample → `TerrainMeta`. **Skip `map` LOD and heightmaps for 2D plates** (F11, F12).

Overview: contours at a coarse interval (500 m, index every 1000 m), one small hillshade poster, plate outlines (each plate's four corners → LAEA) and region pins in overview UV. All of it goes into `overview` in `terrain.ts`.

`lib/geo.ts` caution: `wgs84ToLv95` uses swisstopo's approximate formulas, rated about 1 m inside Switzerland. For a Regio plate 200+ km from Bern, add a unit test against a rigorous reference point before trusting pins. 4-dp positions are only about 10 m anyway. **[SPIKE: measure the error at the chosen IT/AT plate]**

### 2.2 `--check` determinism across sources

Determinism never depended on the source. It depends on (a) a committed, sha256-pinned source raster and (b) derivation in our own code. Both hold per plate if reprojection stays in the networked fetch step. What changes:

- `TerrainSource` becomes `z.discriminatedUnion('product', [SwissAltiRegioSource, SecondProductSource, OverviewSource])`. Each variant has its own provenance (STAC fields versus tile list with per-tile checksums, release, resampling method). Each shares the grid contract `width × cellM = extent width`.
- **One builder run owns every plate** (F15). The stale-file sweep compares against the union of all plates' expected names. `--plate <id>` is allowed in write mode only, and then it may delete only files with that plate's prefix.
- Zermatt regression gate: after the refactor, the `matterhorn` hashes in the asset names must equal today's (`2f3a04accc`, `f78bc9a25c`, `e1af353f82`, `548be40405`, `f792a8921f`, poster hashes). Only the prefix changes. Put this in the plan as an explicit acceptance check.
- Lint time: each plate adds two contour passes. Check timings stay within a few seconds per plate; the overview grid is coarse.

### 2.3 Precache

`precache.json` stays home-only (footer strip + hero, for `/offline`). Do not precache region plates. They are cached cache-first under `/terrain/` on first visit, as today.

### 2.4 Asset size budget per plate (measured from Zermatt today)

| Asset | Zermatt today | New 2D plate (target) | Notes |
|---|---|---|---|
| Committed source PNG (grey16, 11 × 11 km @ 10 m) | 1,423,018 B | ≤ 2 MB | Scales with extent². Above about 15 km, use 20 m cells |
| `hero` contours SVG | 45,632 B | ≤ 60 KB | Brotli shrinks SVG about 3–4× |
| `strip` contours SVG | 22,783 B | ≤ 30 KB | Only for the SheetMargin band |
| `map` contours SVG | 93,156 B (unused) | — | Skip |
| Hillshade AVIF 1100 + 640 | 150,562 B | ≤ 160 KB | The 1100 px poster serves MapSheet on large screens |
| Hillshade WebP 1100 + 640 | 261,316 B | ≤ 270 KB | Fallback only |
| Heightmaps 512 + 256 | 445,682 B | — | Only for `threeD` plates |
| **Served files per plate** | ~1.02 MB | **≤ 0.55 MB** | |
| **Bytes a visitor fetches for one plate** | — | **≤ ~250 KB** | AVIF + hero + strip |
| Overview (contours + 1 poster) | — | ≤ 250 KB served | Coarse grid |

Enforce with a Jest budget test, like `MAX_CLIP_BYTES`. Photo derivatives are the bigger growth: 9 files and about 1.75 MB per photo, so 20+ photos is about 35–40 MB in `public/images/photos/` and in git history.

---

## 3. Routing

### 3.1 Options

| Criterion | **A. Nested** `/photos/[region]/[slug]` (recommended) | B. Flat photos `/photos/[slug]` + `/photos/regions/[region]` |
|---|---|---|
| URL tells the series | Yes; breadcrumb is the path | No |
| Old links | 308 per legacy slug (4, frozen) | Unchanged |
| Old OG card URLs | Need an explicit redirect to the new hashed path (F6) | Unchanged |
| Interception | `@modal/(.)[region]/[slug]`, plus a `@modal/[region]/page.tsx` null | Unchanged `(.)[slug]`; series page is a descendant of `/photos`, so it is still intercepted (F7) |
| Proxy | Regex + known-set rework | Still needs a region miss path (`notFound()` inside a page gives the empty `__next_error__` shell, 12-RESEARCH Pitfall 1) |
| Files touched | About 20 source + about 15 e2e specs + baselines | About 8 source |
| Matches PROJECT wording ("through the series URL change") | Yes | No |

**Recommendation: A.** It matches the stated intent and gives a clean series hierarchy. The risk is containable because the legacy set is **closed**: only the four v2.0 slugs ever lived at `/photos/<slug>`. If Tim prefers zero URL churn, B is the safe fallback. Present both to Tim.

### 3.2 Interception and View Transitions after the move

- Slot stays in `photos/layout.tsx`. `@modal/(.)[region]/[slug]`: `(.)` counts route segments from `photos` (slots are not segments, per the intercepting-routes doc). The interception header regex matches `/photos` and every descendant (F7), so grid/plate links on both `/photos` and `/photos/<region>` open the lightbox. Home links (`/`) are not intercepted, so they land on the full page. That is unchanged behaviour (D-08).
- Add `@modal/[region]/page.tsx → null`. Soft navigation to a URL the slot no longer matches keeps the modal visible (parallel-routes doc, "Modals"). Without this, Back from the lightbox to `/photos/zermatt` would leave it open. Keep `default.tsx` (hard loads) and `@modal/page.tsx` (`/photos`). **[SPIKE]** Confirm that `@modal/[region]/page.tsx` and `@modal/(.)[region]/[slug]` coexist without a route conflict in 16.4.5, in dev (webpack) and build (Turbopack). The 12-14 OG export collision shows the two bundlers can differ.
- `generateStaticParams` in `[region]/[slug]/page.tsx` returns `{ region, slug }` pairs (bottom-up, per docs); `dynamicParams = false` on both new pages, as today.
- **Stepping is per series.** The intercepted route cannot know whether it was opened from `/photos` or `/photos/zermatt`, so the viewer always gets `seriesViews(photo.region)`. Prev/next stays `history.replaceState(photoHref(view))` (no history entries; Back closes; OQ1 decision kept).
- **VT names stay `photo-${slug}`.** That requires slugs to be globally unique (Jest invariant). `photos-view` (the view crossfade) lives on both `/photos` and `/photos/[region]`. They are never mounted together, so there is no duplicate name. Overview pin → series page is a page navigation: use the default crossfade, no shared-element morph (pins carry no image, as Map → lightbox today).

### 3.3 `/photos` keeps its three views

`/photos?view=map` (default) = Alps overview with region pins; `?view=grid|carousel` = all photos grouped by series. Old shared links like `/photos?view=grid` keep working without a redirect. The series page repeats the same switcher with Map = its local plate. One interaction model at both levels.

### 3.4 Redirects: `next.config.ts`, not `proxy.ts`

| | `next.config` `redirects()` | `proxy.ts` |
|---|---|---|
| Order | Runs **before** proxy (proxy doc "Execution order": headers → redirects → Proxy) and before the filesystem | After config redirects |
| Cost | Static route rule (on Vercel, no function) | Code on every matched request |
| Fit | 4 frozen entries; well under the 1,024 Vercel limit (redirecting guide) | For thousands of dynamic entries |

```ts
// next.config.ts — the legacy set is closed: only these four ever lived at /photos/<slug>.
const LEGACY_PHOTO_SLUGS = ['matterhorn-from-zermatt', /* …the other three v2.0 slugs… */] as const;
async redirects() {
  return LEGACY_PHOTO_SLUGS.flatMap((slug) => [
    { source: `/photos/${slug}`, destination: `/photos/zermatt/${slug}`, permanent: true },          // 308
    // F6: the old card path carries the old route hash; send it to the new card, not a 404.
    { source: `/photos/${slug}/:card(opengraph-image-[^/]+)/:id`, destination: `/photos/zermatt/${slug}/${NEW_CARD_SEGMENT}/:id`, permanent: true },
  ]);
}
```

- Exact slugs, never `/photos/:slug`. A pattern would swallow `/photos/<region>`.
- Inline the four slugs (or a relative import of a tiny frozen module). A Jest test asserts each destination is in `lib/photos/routes.ts`. An e2e test asserts the old page answers 308 and the old card URL ends at a `200 image/png`.
- `NEW_CARD_SEGMENT` is `opengraph-image-<djb2('/(site)/photos/[region]/[slug]').toString(36).slice(0,6)>`. Do not hard-code it. Read it from the built page's `og:image` in the e2e test and keep the redirect target in one constant the test checks. **[SPIKE]** Alternatively accept that cached card URLs fail and rely on crawlers re-fetching the page (they follow the 308 and read the new `og:image`). Decide with Tim, because "OG cards keep working" is in PROJECT.md.
- Service worker: a redirected navigation is never stored (`!response.redirected`), and old caches die with the build hash. No SW change needed.

### 3.5 Canonical, OG, sitemap

- `photoMetadata` canonical becomes `photoHref(view)`; series pages use `pageMetadata({ path: '/photos/<region>' })`. The root `metadataBase` is unchanged (D-13).
- Photo OG card: moved route, region contour (`contourDataUrl(plate)`) and region `sheetTitle`. It still renders at runtime with per-slug alt (12-19). New series card at `[region]/opengraph-image.tsx`.
- Sitemap: nav → series pages → nested photo URLs (series order) → projects. No legacy URLs.

### 3.6 Unknown-slug 404 in `proxy.ts`

```ts
const PHOTOS = /^\/photos\/([^/]+)(?:\/([^/]+))?$/;   // /photos/<region> | /photos/<region>/<slug>
const PROJECTS = /^\/projects\/([^/]+)$/;
// miss = (seg2 === undefined ? !routes.regions.has(seg1) : !routes.pairs.has(`${seg1}/${seg2}`))
```

- Legacy slugs never reach this check (config redirects run first).
- The neutral render stays section-level, `/photos/_` (`NEUTRAL_SLUG`). Three-segment misses fetch the same neutral page, so neither the region nor the slug is echoed in flight data (T-12-03 kept).
- Deeper paths (`/photos/a/b/opengraph-image-…`) pass through, as today.
- Import `lib/photos/routes.ts` (ids and slugs only), so the proxy bundle stops carrying editorial copy and manifests (F5).
- Extend `e2e/not-found.spec.ts`: unknown region, known region + unknown slug, cross-region slug (`/photos/aosta/<zermatt-slug>` → 404, not a redirect).

---

## 4. Footer legend, "Last surveyed" and attribution with several plates and sources

The footer is a **layout** component (`(site)/layout` → `SiteChrome`). Layouts do not re-render on soft navigation, so a footer that reads the route (headers or params) goes stale after client navigation.

| Option | How | Verdict |
|---|---|---|
| **A. Footer = the home sheet (colophon) + in-page SheetMargin per plate** | Extract `SheetMargin` from SiteFooter (zero visual diff). The footer renders the `matterhorn` margin; ticks come from the 4 home waypoints (pixels unchanged even as Zermatt grows). Series pages and the overview render their own `SheetMargin` (scale, equidistance, extent in the plate's CRS, last surveyed = that source's edition, source line = that product's attribution) | **Recommended.** Zero footer re-baseline; correct under soft navigation; attribution sits next to the data it credits |
| B. Footer = series index | Overview strip, one tick per region, every source listed, "Last surveyed" per sheet | Every route's baselines change; the scale bar loses meaning on a 900 km strip |
| C. Route-aware footer | `@sheet` parallel slot at `(site)` with a `[...catchAll]` reset, or a client `usePathname` switch | Slot state persists across soft navigation (parallel-routes doc), so it needs a catch-all; also adds client JS. Too fragile for a footer |

- **"Last surveyed"** becomes per plate: `formatMonthYear(plate.dem.edition)`. Keep `edition: YYYY-MM` for every product, with `editionSource` saying where the month came from (STAC datetime, release notes).
- **Attribution:** for Regio-only plates, `site.attribution.terrain` already covers the IT/AT/FR/DE inputs (F1), so it is reused as is. A second product gets `site.attribution.<product>`, a required string, verbatim from its licence. Copernicus DEM requires a source notice and a liability sentence for public distribution. Copy the exact wording from the licence PDF, not from third-party sites. It is shown in that plate's and the overview's SheetMargin.
- Extent label: the SheetMargin shows the plate's own grid ("Extent (LV95)" or "Extent (ETRS89 / UTM 32N)"). PHOTO-F4's LV95-in-the-strip rule is separate and keys on `region.country === 'CH'`, not on the plate CRS.

---

## 5. Immersive layout: where it plugs in

- Stay inside `(site)`. A separate route group or root layout would remount SiteNav on every photo navigation and break the `@modal` scoping. "Less chrome" means a full-bleed gallery-black stage of `100svh − var(--nav-h)` under the fixed nav, with the footer below the fold.
- `PhotoViewer` stays the single viewer for the page and modal variants. Fold the open v2.0 lightbox debt (focus after Escape, clipped focus ring) into this rewrite, because it touches the same files.
- The series page composes: intro → `PlateSheet` (Map) / Grid / Carousel → optional `FlyoverClip` → `SheetMargin`. All server components except the existing islands.

---

## 6. Drone video: integration per candidate format

| Format | Data | Routes / UI | CSP (`proxy.ts buildCsp`) | Service worker | Guard / repo | Verdict |
|---|---|---|---|---|---|---|
| **1. Progressive MP4 (H.264; optional AV1 `<source>` first), silent, ≤ about 20 s, committed in `public/media/`** | `media-manifest` entry with `kind: 'drone'`, `region`, optional takeoff position (4 dp); `regions[].flyover` | `FlyoverClip` on the series page: native `<video controls muted playsInline preload="none" poster>`, click to play, like `DemoClip` | **No change**: `default-src 'self'` covers media | **No change**: `destination === 'video'` and Range requests already bypass the SW; the poster is cached as an image | Per-kind budget (e.g. drone ≤ 6 MiB) replaces the single 1.5 MiB rule; the box walker already rejects GPS boxes (`©xyz`, `loci`), `uuid`, XMP and extra data tracks, which is exactly what DJI files carry. Git history grows by the clip size: cap the count, or decide on Git LFS (Vercel can fetch LFS when enabled) | **Recommended** |
| 2. Self-hosted HLS (fMP4 segments + m3u8) | Same, plus a segment list | Needs hls.js (client JS) for non-Safari | Add `media-src 'self' blob:`, and `worker-src 'self' blob:` unless the hls.js worker is off | Segments are `fetch()` with an empty destination, so today they fall into "network-first everything else" and **get stored**. Needs a `/media/` bypass | The walker whitelist rejects `moof`; many hashed files | Overkill for short clips |
| 3. Hosted stream (Mux, Cloudflare Stream, Bunny) | Playback id instead of a file | Player package (bundled, fine under `strict-dynamic`) | `media-src`/`connect-src`/`img-src` for the vendor hosts + `blob:` | Must skip cross-origin requests | No repo growth | Breaks "same-origin, `connect-src 'self'`" and sends visitor IPs to a third party |
| 4. YouTube / Vimeo embed | Video id | `<iframe>` | `frame-src` is `'none'` today; cookies and tracking | n/a | n/a | Do not use |
| 5. Animated AVIF/WebP loop | Image manifest | `<img>` | No change | Cached cache-first as an image (heavy) | Image guard | Needs its own pause control for loops over 5 s (WCAG 2.2.2); poor compression for aerial motion |

Recommended shape for v2.1: **at most one flyover per region on the series page**, reusing the clip pipeline. Video items inside the series and lightbox (a `SeriesItem` union, `og:video`, stepping over mixed media) are a later step. FEATURES/STACK research decides codec, resolution and bitrate. This table fixes only where each option integrates.

---

## 7. Deferred features

### PLAT-F1 JSON-LD under the nonce CSP

- Placement per the Next 16.4 JSON-LD guide: a native `<script type="application/ld+json">` rendered in `page.tsx`/`layout.tsx`, serialised with `<` escaped as `<`.
- **No nonce needed.** In the HTML "prepare the script element" algorithm, a non-JavaScript type is a data block and returns at step 15, before the CSP inline check at step 23. The existing audit gate fails on any CSP violation event, so it verifies this on every route automatically.
- Where: root layout → `Person` + `WebSite` (from `data/site.ts`). Full photo page `[region]/[slug]/page.tsx` → `ImageObject`/`Photograph` (creator, copyright notice from `rights`, `contentLocation` Place; `geo` only for exact positions at 4 dp, omitted for the hand-placed film scan). Series page → `CollectionPage`/`ImageGallery` with `about` Place. Project page → `SoftwareSourceCode` (box) or `SoftwareApplication` without `codeRepository` (coin-flip is private, D-23).
- **Not** in the intercepted `@modal` page. Crawlers do hard loads, so they see the full page, and a second copy in the modal DOM is noise.
- Build after the routing phase, so `url`/`@id` use the final paths.

### PLAT-F2 offline list (already shipped, F9)

Only `savedPageCatalog` changes: rows for series pages (`label: 'Series'`) and nested photo hrefs, fed from `lib/photos/routes.ts` + titles. Matching stays exact-path on cached URLs (T-12-30). Old flat photo URLs vanish with the build-hash cache purge, so no legacy rows are needed.

### PHOTO-F2 Web Share

`ShareButton` client island in the viewer strip: `navigator.share({ title, url })` with `url = site.url + photoHref(current)`, the **currently shown** photo after stepping, not the initial one. Feature-detect after mount (`useSyncExternalStore` with a `'pending'` server snapshot, the capability-hook pattern) to avoid a hydration mismatch. Fallback: copy link, reusing `CopyEmailButton`'s clipboard pattern. `Permissions-Policy` does not list `web-share`, so the top-level default (`self`) applies. No header change.

### PHOTO-F4 LV95

`wgs84ToLv95` already exists. Add an `LV95` row in `stripFields` only when `region.country === 'CH'`, computed from the 4-dp position and shown rounded to 10 m with `formatLv95` (it reveals nothing beyond the WGS84 row). Use `≈` for approximate positions. The `StripFields.positionRows.term` union widens.

### ENG-F1 terminal step controls + transcript

- `lib/demo-terminal.ts` (pure, import-free): add `stepTo(index)` and `step(state, dir, count)`, returning `{ index, phase: 'shown', chars: 0 }`, unit-tested like `tick`.
- `DemoTerminal.tsx`: Prev/Next buttons beside Pause. A press sets the sticky pause (existing D-02 rule), and the existing polite live region announces the step.
- Transcript: `TerminalTranscript` server component in `sections/Demo.tsx`, a `<details>` listing every command's input and output as text. Zero JS, and a full text alternative.

---

## Data Flow

### Request flow: series lightbox (soft navigation)

```
/photos/zermatt?view=grid ─ click tile <Link href={photoHref(v)} scroll={false}>
  → Next-Url=/photos/zermatt matches "/photos(?:/.*)?"  (F7)
  → @modal/(.)[region]/[slug] renders LightboxDialog+PhotoViewer(seriesViews('zermatt'))
  → tile's VT boundary removed, viewer's photo-<slug> inserted ⇒ morph
  → prev/next: history.replaceState(photoHref(next)) — no history entry
Back/Escape → router.back() → /photos/zermatt; @modal/[region]/page.tsx → null
hard load /photos/zermatt/<slug> → [region]/[slug]/page.tsx (+ JSON-LD); @modal/default → null
legacy /photos/<v2.0-slug> → next.config 308 → /photos/zermatt/<slug> (before proxy)
unknown /photos/<x>[/<y>] → proxy miss → neutral /photos/_ render → 404, nothing echoed
```

### Key data flows

1. **Terrain:** `plates.json` + `source/<plate>/` → `terrain:build` → `public/terrain/<plate>-*` + `terrain.ts { plates, overview, terrain }` → `ContourField(plate)`, `PlateSheet`, `AlpsOverview`, `SheetMargin`, OG template; Home still reads `terrain` (= `plates.matterhorn`).
2. **Photos:** sidecar + corrections + `regions.json` + plate DEMs → `photos.ts` (region, plate, uv-in-plate, DEM m + product) + `editorial.ts` + image manifest → view-model → `seriesViews(region)` (series pages, viewer stepping), `photoViews` (album grid), `homeWaypoints` (Home, footer ticks, rail start).
3. **URLs:** `regions.json` + editorial slugs → `lib/photos/routes.ts` → proxy known-sets, sitemap, saved-pages catalog, `generateStaticParams`, e2e `ROUTES`; the 4-slug legacy map → `next.config` redirects.
4. **Video:** gitignored drone original → `clip:derive` (ffmpeg, strip, budget per kind) → `public/media/<id>.<hash>.mp4` + poster + `media-manifest.ts` → `FlyoverClip` on the series page.

---

## Suggested Build Order (dependency-respecting)

```
P1  Repo safety debt first ─────────────────────────────── (cheap; protects every later PR)
    branch protection + required checks on main, [ci skip] gap, Playwright 1.65 re-baseline
P2  Data model + plate refactor, ZERO visible change ───────────── (blocks P3–P6)
    a. photoHref/regionHref + lib/photos/routes.ts; replace the 13 hand-built URLs (still /photos/<slug>)
    b. home.waypointIds; buildWaypoints/lowestDemM/TrailSigns/footer ticks read the home list
    c. Region + plate schemas, regions.json (Zermatt only), plates.json (matterhorn only)
    d. build-terrain over N plates, prefixed names; matterhorn content hashes unchanged
    e. SheetMargin extracted from SiteFooter; ContourField(plate); MapSheet → PlateSheet(plate)
    Gate: visual baselines unchanged, data:check green, hashes equal
P3  New plates + overview + new photos ────────────────────────── (needs P2; human inputs)
    plate extents (Tim), fetch (Regio for ≤ ~11.7°E; second-source adapter only if needed),
    overview raster + LAEA, new originals → exif/derive/build, editorial copy review (Tim)
P4  Routing migration ─────────────────────────────────────────── (needs P2a; P3 for content)
    nested routes + @modal moves, @modal/[region] null, generateStaticParams pairs,
    next.config redirects (pages + old cards), proxy rework, sitemap, OG cards per region,
    saved-pages catalog (PLAT-F2), e2e ROUTES/audit gate, not-found matrix
P5  Immersive layout (UI-SPEC via ui-ux-pro-max) ──────────────── (needs P4)
    /photos overview map view, series page, immersive viewer, + PHOTO-F2 Share, PHOTO-F4 LV95,
    lightbox focus/ring debt folded in; one deliberate re-baseline round
P6  Drone video ───────────────────────────────────────────────── (format decision any time; slot needs P5)
    clip kinds + budgets, guard, FlyoverClip in the series page slot
P7  JSON-LD (PLAT-F1) ─────────────────────────────────────────── (needs P4 final URLs)
P*  ENG-F1 terminal controls + transcript, other UI/test debt ─── (independent; parallel filler)
```

Ordering rationale:
- **Data before maps:** every map surface (overview, series plate, footer, OG) reads `plates`/`regions`, and the photo build needs plate DEMs for heights.
- **URL helper before URL change:** P2a makes P4's flip mechanical and keeps P2 at zero diff.
- **Routing before layout:** the immersive layout's pages are the new routes; designing them on old routes means doing it twice.
- **Repo safety first:** P2–P4 are large refactors. Required checks must block a red main before they land.
- **Research flags:** P3 (second-source licence and adapter, and whether it is needed at all, F1), P4 (interception + `@modal/[region]` spike, old OG card hash), P6 (format decision). P2, P7 and ENG-F1 use known patterns.

---

## Scaling Considerations (portfolio scale)

| Concern | Now (4 photos, 1 plate) | v2.1 (20+ photos, 3 plates + overview) | Mitigation |
|---|---|---|---|
| Repo/deploy size | 7 MB photo derivatives, 1 MB terrain, 1.4 MB source | about 40 MB derivatives, +0.5 MB/plate served, +1.4–2 MB/plate source, drone clips | Per-plate and per-clip budget tests; decide on LFS before the first drone clip |
| Proxy bundle | Whole view-model | Would grow with every photo | `lib/photos/routes.ts` |
| `data:check` time in lint | 1 plate | About 4 contour sets | Coarse overview; skip unused LODs |
| Map pins | 4 | 20+ per series possible | Label layout per plate (existing `label-layout.ts`); clustering only if one series exceeds about 12 |
| Footer ticks | 4 | Would be 20+ | Home waypoints only |

## Anti-Patterns

1. **Inferring a photo's region from GPS.** Plates can overlap and a pin can be hand-placed. Keep membership explicit and check containment.
2. **Per-plate builder runs with a global stale sweep.** They delete each other's assets. One run owns all plates.
3. **Subdirectories under `public/terrain/`.** Five regexes and prefix rules assume flat names.
4. **A pattern redirect `/photos/:slug` → `/photos/zermatt/:slug`.** It swallows `/photos/<region>`. Use the closed list of four.
5. **A route-aware footer.** Layouts don't re-render on soft navigation. Put the sheet margin in the page.
6. **Generating `lowestDemM` or Home waypoints over all photos.** A new photo silently changes Home. Use the explicit home list.
7. **Reprojecting in `terrain:build`.** It adds a projection dependency to the deterministic path. Reproject once in the fetch adapter and commit the grid.
8. **HLS or a third-party player for 10–20 s clips.** It adds JS, CSP holes and SW cache bloat for nothing.
9. **JSON-LD in the intercepted modal, or with a nonce "to be safe".** It duplicates the data and hides the real CSP behaviour. The audit gate checks it.

## Integration Points

### External services and data

| Service | Integration | Notes |
|---|---|---|
| swisstopo STAC + COG (swissALTIRegio) | Manual `terrain:fetch --plate`; window read, no resampling | Covers 4.5–12.0°E / 44.8–48.7°N incl. IT/AT/FR/DE from national models (F1) |
| Second DEM product (STACK research picks it) | Manual adapter; reprojected to a square metric grid; sha256-pinned | Only for the overview and for plates east of about 11.7°E; exact licence notice in `site.attribution` |
| Vercel | Static `/terrain`, `/media`, `/images` (immutable cache); config redirects as route rules | Hobby bandwidth quota matters for video: `preload="none"`, click to play |

### Internal boundaries

| Boundary | Communication | Notes |
|---|---|---|
| `scripts/*` ↔ `regions.json`/`plates.json`/schemas | JSON + zod-only schema imports (Node type-stripping) | No `@/` aliases in schemas |
| proxy ↔ data | `lib/photos/routes.ts` only | Keeps the proxy small and copy-free |
| `next.config` ↔ routes | Frozen 4-slug list + Jest cross-check | Closed set |
| Series page ↔ `@modal` ↔ viewer | URL only (`usePathname`, `?view=`) | Stepping list = `seriesViews(photo.region)` |
| Footer ↔ plates | `SheetMargin(plates.matterhorn)` | Region pages own their legend |

## Sources

- Next 16.4.5 bundled docs (`node_modules/next/dist/docs/01-app`): `intercepting-routes.md` ((.) counts segments, slots excluded), `parallel-routes.md` (soft-nav slot persistence, `default.js`, catch-all close), `redirects.md` + `02-guides/redirecting.md` (checked before the filesystem, run before Proxy, 1,024 Vercel limit, 308), `proxy.md` ("Execution order"), `generate-static-params.md` (multiple dynamic segments, `dynamicParams`), `02-guides/json-ld.md`, `02-guides/view-transitions.md`. HIGH
- Next source: `dist/esm/lib/generate-interception-routes-rewrites.js` (descendant match), `dist/lib/metadata/get-metadata-route.js` (`getMetadataRouteSuffix` djb2 of the parent path for group/slot routes), `dist/shared/lib/router/utils/sorted-routes.js` (different slug names error). HIGH
- swisstopo STAC item `https://data.geo.admin.ch/api/stac/v1/collections/ch.swisstopo.swissaltiregio/items/swissaltiregio` (bbox, single EPSG:2056 COG, `fullcoverage`); [swisstopo swissALTIRegio](https://www.swisstopo.admin.ch/en/height-model-swissaltiregio-20240405); [opendata.swiss swissALTIRegio](https://opendata.swiss/en/dataset/swissaltiregio). Seam tier LOW; cross-checked against the TINITALY/DGM credits already in `data/site.ts`, so treated as MEDIUM
- [HTML Standard, "prepare the script element"](https://html.spec.whatwg.org/multipage/scripting.html) (data block returns at step 15, CSP check at step 23). Primary spec, fetched; seam tier LOW, MEDIUM in practice; the audit gate verifies it
- Copernicus DEM licence pointers: [Copernicus Data Space DEM](https://dataspace.copernicus.eu/node/1306), [AWS registry](https://registry.opendata.aws/copernicus-dem/), [License COPDEM-30 PDF](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf). LOW; exact wording still to be copied from the PDF
- Repo inspection (2026-11-12): `proxy.ts`, `next.config.ts`, `app/(site)/photos/**`, `app/sitemap.ts`, `lib/photos/view-model.ts`, `lib/ascent/waypoints.ts`, `lib/geo.ts`, `lib/saved-pages.ts`, `lib/demo-terminal.ts`, `lib/og/template.tsx`, `components/site/SiteFooter.tsx`, `components/photos/{MapSheet,PhotoViewer}.tsx`, `components/projects/DemoClip.tsx`, `data/schemas/{terrain,photo,editorial,media-manifest}.ts`, `data/site.ts`, `data/generated/terrain.ts`, `scripts/terrain/{build-terrain,fetch-dem}.mjs`, `scripts/photos/build-photo-data.mjs`, `scripts/media/build-clip.mjs`, `scripts/guards/check-served-images.mjs`, `public/service-worker.js`, file sizes under `public/terrain` and `data/terrain/source`

---
*Architecture research for: v2.1 Survey Expansion integration into the shipped Next 16.4 portfolio*
*Researched: 2026-11-12*
