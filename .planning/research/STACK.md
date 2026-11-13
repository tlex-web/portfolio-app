# Stack Research: v2.1 "Survey Expansion"

**Domain:** Adding multi-region Alpine terrain, an Alps overview map, drone video, and small platform features to a shipped Next.js 16.4 portfolio with build-time geodata and a nonce CSP
**Researched:** 2026-11-12
**Confidence:** HIGH where executed (coverage probes, COG range reads, overview contour sizes, npm registry, the repo's own code and GitHub settings). MEDIUM where official docs were fetched and cross-checked (Vercel limits, GitHub required checks, video host pricing). LOW where only one secondary source exists (flagged inline).

> Scope: only additions or changes for the v2.1 features. The v2.0 stack (Next 16.4.5, React 19.3, R3F 9.8, motion 14.10, geotiff 3.0.5, d3-contour 4.0.3, simplify-js, sharp 0.35, exif-reader, fast-png, the nonce CSP, the service worker, Satori OG) is in `.planning/milestones/v2.0-research/STACK.md` and is not repeated.
>
> Confidence tiers follow the GSD `classify-confidence` seam: a single web search is LOW, a cross-checked web source is MEDIUM. Facts I verified by running code against the live data are marked **(executed)** and treated as HIGH.

---

## 0. Headline findings (read first)

1. **swissALTIRegio already covers most likely Italian and Austrian regions, so a second elevation source may not be needed at launch.** The COG is a hole-free rectangle, LV95 E 2'385'000–2'935'000 / N 974'000–1'404'000 (about 4.5–12.0° E, 44.8–48.8° N). Its foreign parts **are** TINITALY (Italy) and DGM Österreich (Austria), and the site already ships their credits in `site.attribution.terrain`. **(executed)** Inside the rectangle: Aosta, Gran Paradiso, Mont Blanc (Italian side), Cervinia, Lake Como, Ortler, Lake Garda, Val Gardena / Seceda, Alpe di Siusi, Innsbruck, Ötztal, Zugspitze. **Outside:** Cortina, Tre Cime, Lago di Braies, Grossglockner and the Hohe Tauern, Salzkammergut / Hallstatt. **The region pick decides whether v2.1 needs a new data source at all.** Make that choice before the terrain phase is planned.
2. **If a region falls outside: for Austria use BEV ALS DTM 1 m.** It is CC BY 4.0, published as 50 km COG tiles in EPSG:3035, and range-readable with the geotiff.js already installed. An 11 km window around the Grossglockner read in **1.5 s** at the 8 m overview, 1,493–3,794 m, no nodata. **(executed)** **For Italy use TINITALY 1.1** (10 m DTM, CC BY 4.0, already credited). Copernicus GLO-30 is the automation-friendly fallback, but it is a DSM (forest canopy included) and its licence notice is long.
3. **For the Alps overview use Copernicus GLO-90.** The 72 one-degree tiles for 5–17° E × 43–49° N read at overview level 2 in about 9 s. **(executed)** Contour cost is real. At 1,200 × 864 px with no smoothing, 1,000 m contours are 187 KB raw / **43 KB brotli** and 500 m contours are 440 KB / 102 KB br. The Home hero contours are 13.5 KB br. Plan smoothing and ring filtering.
4. **Never warp rasters. Window each plate on its source's native grid** (LV95, EPSG:3035 or UTM 32N) and transform only points (photo pins, corner labels). The existing swisstopo formulas in `lib/geo.ts` are within 0.15 m of proj4 at Zermatt and 2–3 m at Seceda and Innsbruck **(executed)**, so regions inside swissALTIRegio need **no new library**. Only a non-LV95 plate needs `proj4` (devDependency, build-only, pin 2.22.0).
5. **Drone video already has a pipeline.** `clip:derive` runs ffmpeg 9.0.1 locally, writes a metadata-free hashed H.264 MP4 with a WebP poster, and an ISO-BMFF box walker in `guard:images` forbids `uuid`/`XMP_`/`©xyz`/`loci` and extra tracks. The CSP has no `media-src`, so `default-src 'self'` already allows same-origin video. **Silent loops fit this pipeline with no CSP change. Full films do not fit Vercel Hobby** (100 GB/month of transfer shared with the whole site, and an overrun pauses things for 30 days), so they need an external host plus a CSP decision.
6. **PLAT-F2 is already shipped.** `components/site/SavedPages.tsx` (12-15, EDGE-02 / D-12) lists every Cache Storage entry against a catalog on `/offline`. v2.1 only has to add the new region URLs to that catalog. Reconcile the requirement.
7. **PHOTO-F4 needs no library.** `lib/geo.ts` already exports `wgs84ToLv95`.
8. **Repo safety.** Rulesets work on this public personal repo. One ruleset, `automated-actions`, already exists and is active, but its `ref_name.include` is `[]`, so as far as I can tell it targets **no branch** and enforces nothing. A `[ci skip]` head commit leaves required checks **Pending**, which fails closed for PRs. The real gap is direct pushes and Vercel deploying any `main` commit. Close it with a "require PR" rule plus **Vercel Deployment Checks**.
9. **The Upstash fallback is silent.** `lib/rate-limit.ts` reads only `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. Without them it **allows everything** and only warns once. If the store was added through the Vercel Marketplace, the injected names may be `KV_REST_API_*` (MEDIUM). Check the names with `vercel env ls production`, then probe for a 429.

---

## Recommended Stack

### Core technologies (data sources, new for v2.1)

| Source | Edition / version | Purpose | Why recommended | Confidence |
|---|---|---|---|---|
| **swissALTIRegio** (existing) | STAC item `swissaltiregio`, edition 2026-05 | Local plates for **every** region inside 4.5–12.0° E / 44.8–48.8° N, Swiss or not | Already fetched by `terrain:fetch` and checked offline by `terrain:build --check`. One CRS (LV95), 10 m, hole-free, the foreign data harmonised by swisstopo, attribution already shipped. Adding a region is a new `EXTENT`, not a new pipeline. | HIGH (executed) |
| **BEV ALS DTM 1 m** (Austria) | Tiles dated 20240915 / 20230915 / ... per 50 km cell | Local plate for Austrian regions east of 12° E | CC BY 4.0, real terrain model (bare earth, from airborne laser scanning), COG with 8 overviews and `Accept-Ranges: bytes`, so `geotiff.fromUrl` reads an 11 km window without downloading the 0.5–6.8 GB tile. | HIGH (executed) for access and format; MEDIUM for the credit wording |
| **TINITALY 1.1** (Italy) | v1.1 (Jan 2023), DOI 10.13127/tinitaly/1.1 | Local plate for Italian regions east of 12° E (Cortina, Tre Cime, Braies) | 10 m terrain model, CC BY 4.0, the same source swissALTIRegio uses for Italy (consistent look), and the citation is already on the site. Downloaded as tiles (not a COG), so the fetch reads a local file. | MEDIUM |
| **Copernicus DEM GLO-90** | 2021 public release on AWS Open Data | Alps-wide overview map | Global and seamless, 1° COGs in EPSG:4326, no auth. At overview scale (≥ 250 m/px) the DSM-vs-DTM difference averages out. | HIGH (executed) for access and sizes; MEDIUM for licence wording |

### Supporting libraries

| Library | Version | Where | Purpose | When to use | Confidence |
|---|---|---|---|---|---|
| `geotiff` (keep) | 3.0.5 (MIT, published 2026-03-30) | `scripts/terrain/*` | COG range reads for BEV and Copernicus, local GeoTIFF reads for TINITALY (`fromFile`) | Always. Already a devDependency. | HIGH (executed) |
| `proj4` (**add, devDependency only**) | **2.22.0** pinned (MIT, 46 KB gz, 2.23.0 published hours before this research, so wait for it to settle) | `scripts/` only (fetch and photo build) | WGS84 → EPSG:3035 (LAEA) and WGS84 → UTM 32N for pins and plate-corner labels on **non-LV95** plates | Only if a region needs BEV or TINITALY. Not needed for regions inside swissALTIRegio. | HIGH (executed: 0.15 m agreement with `lib/geo.ts` at Zermatt) |
| `schema-dts` (**add, devDependency**) | 2.1.0 (Apache-2.0, types only, 0 runtime bytes) | JSON-LD builders | Type-check `Person`, `ImageObject`, `Place`, `CollectionPage` / `ImageGallery` objects | PLAT-F1 | HIGH (registry) |
| ffmpeg (keep, local tool) | 9.0.1. The installed Gyan **essentials** build has `libx264`, `libx265`, `libaom-av1` and `libvpx-vp9` but **no `libsvtav1`** (executed `ffmpeg -encoders`) | `scripts/media/build-clip.mjs` | Encode loops: H.264 (all browsers), optional AV1 (smaller) | AV1 renditions need the Gyan **full** build (`winget install Gyan.FFmpeg`) for SVT-AV1, or accept libaom's much slower encode | HIGH (executed) |

### Development tools (no npm package)

| Tool | Purpose | Notes |
|---|---|---|
| Vercel CLI (`npx vercel@latest`, 65.x on npm) | `vercel env ls production` to see which Upstash variable **names** exist | Names only, values stay encrypted. Don't `vercel env pull` production secrets onto disk. |
| `gh api` | Create the `main` ruleset from JSON and inspect the inert `automated-actions` ruleset | The ruleset JSON goes in a reviewed file. Only Tim applies it, because it is a settings change. |
| ExifTool ≥ 13.05 (optional, local) | Prove a drone master or output carries no DJI `djmd`/`dbgi` telemetry: `exiftool -ee -G3 file.mp4` | Belt and braces next to the MP4 walker. Not a CI dependency. |
| Schema Markup Validator / Rich Results Test | Validate JSON-LD by hand once per page type | Plus a Jest test that parses every emitted block |

---

## 1. Elevation data

### 1.1 What swissALTIRegio already covers (executed 2026-11-12)

COG `swissaltiregio_2056_5728.tif`: 55,000 × 43,000 px at 10 m, origin E 2'385'000 / N 1'404'000, 6 overviews, nodata 3.4e38. At overview level 5 the coverage mask is 100 % filled. Full-resolution samples:

| Place | LV95 E / N (from `wgs84ToLv95`) | Height read | Inside? |
|---|---|---|---|
| Aosta (IT) | 2'590'763 / 1'065'041 | 580.8 m | ✅ |
| Mont Blanc, Italian side | 2'562'004 / 1'072'157 | 2,323.9 m | ✅ |
| Gran Paradiso (IT) | 2'586'819 / 1'040'924 | 3,743.1 m | ✅ |
| Cervinia (IT) | 2'614'843 / 1'086'952 | 1,993.2 m | ✅ |
| Lake Como (IT) | 2'741'095 / 1'095'909 | 198.0 m | ✅ |
| Ortler (IT) | 2'837'971 / 1'155'670 | 3,770.1 m | ✅ |
| Lake Garda (IT) | 2'864'935 / 1'083'358 | 65.0 m | ✅ |
| Seceda / Val Gardena (IT) | 2'927'891 / 1'169'923 | 2,140.1 m | ✅ (7.1 km from the east edge) |
| Alpe di Siusi (IT) | 2'920'595 / 1'162'849 | 1,841.6 m | ✅ |
| Innsbruck (AT) | 2'898'888 / 1'242'985 | 585.5 m | ✅ |
| Sölden / Ötztal (AT) | 2'870'923 / 1'208'254 | 1,546.5 m | ✅ |
| Zugspitze (DE/AT) | 2'867'144 / 1'258'164 | 2,675.5 m | ✅ |
| Cortina d'Ampezzo (IT) | 2'960'420 / … | n/a | ❌ outside |
| Tre Cime / Lago di Braies (IT) | 2'972'119 / 2'954'839 | n/a | ❌ outside |
| Grossglockner (AT) | 2'998'580 / … | n/a | ❌ outside |
| Hallstatt (AT) | 3'066'988 / … | n/a | ❌ outside |

An 11 × 11 km plate must fit wholly inside. Around Seceda, an 11 km plate can be centred at most about 1.6 km east of the summit. Check with the existing `pixelWindow()`, which already fails "extent leaves the raster".

**Implication:** the fastest v2.1 is Zermatt plus one region inside this rectangle (Aosta / Cervinia / Gran Paradiso / Como / Val Gardena for Italy, Ötztal / Innsbruck / Stubai for Austria). That needs **zero new sources, zero new attribution, zero new libraries**. Only `fetch-dem.mjs` changes, from one `EXTENT` to a list of region extents.

### 1.2 Candidate comparison (for regions outside, and for the overview)

| Source | Res. | Model | Licence | Credit required (verbatim where verified) | Coverage / holes | Format & access | CRS / heights | Joins swissALTIRegio? | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| **swissALTIRegio** | 10 m | DTM | swisstopo OGD (free incl. commercial, source reference required) | Already shipped string (swisstopo + TINITALY + DGM Österreich + Bavaria + BW + RGEAlti) | Rectangle 4.5–12.0° E / 44.8–48.8° N, hole-free **(executed)** | One COG, HTTP range reads | EPSG:2056 / LN02 | n/a, it *is* the reference | **Use for every region inside** |
| **BEV ALS DTM 1 m** (AT) | 1 m (overviews 2, 4, 8 … m) | DTM (ALS) | CC BY 4.0 ("Für dieses Produkt gilt die Standardlizenz CC-BY-4.0", BEV metadata) | CC BY needs name + licence + changes. Proposed: "Terrain: BEV – Bundesamt für Eich- und Vermessungswesen, ALS DTM, CC BY 4.0, modified". **Wording not confirmed by BEV, see Gaps** | All of Austria in ~55 tiles; per-tile dates (2019–2024) | COG per 50 km cell, `…/ALS/DTM/<YYYYMMDD>/ALS_DTM_CRS3035RES50000mN<S>E<W>.tif`; the **name is the SW corner**; 0.55–6.8 GB, ranges OK **(executed)** | EPSG:3035 / Adriatic (GHA) | Same national data swissALTIRegio resampled; no shared plate, so no seam | **Use for AT outside the rectangle** |
| BEV DGM Höhenraster (AT) | 5–500 m | DTM (photogrammetry, 2021, no longer updated) | CC BY 4.0 (MEDIUM) | as above | All of Austria | Zip downloads | **EPSG:31287 (MGI Lambert)** + EPSG:5778 | — | Avoid: the MGI datum needs a 7-parameter shift (~100 m+ if ignored), and it's zipped and older |
| **TINITALY 1.1** (IT) | 10 m | DTM | CC BY 4.0 | "Tarquini S., Isola I., Favalli M., Battistini A., Dotta G. (2023). TINITALY, a digital elevation model of Italy with a 10 meters cell size (Version 1.1). INGV. https://doi.org/10.13127/tinitaly/1.1" (**already in `site.ts`**) | All of Italy, 50 × 50 km tiles | Clickable tiles on `tinitaly.pi.ingv.it/Download_Area1_1.html` (manual; no COG; access form status unverified) | **UTM 32N everywhere** (WGS84), even where zone 33 applies | Same source as swissALTIRegio's Italian part | **Use for IT outside the rectangle** |
| South Tyrol DTM (IT) | 2.5 m | DTM | not confirmed (LOW) | not confirmed | South Tyrol only | Geokatalog record; download path not confirmed | ETRS89 / TM32 | — | Skip unless 2.5 m detail is wanted for a Dolomites close-up; licence unverified |
| **Copernicus GLO-30** | 1″ (~30 m) | **DSM** (canopy and buildings) | Copernicus DEM licence, free | Adapted data: "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved" **plus** the liability sentence "The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30" in a legal notice **(verified in licence PDF)** | Global (only a few countries held back, none in the Alps); sea-only tiles absent (404) | 1° COGs on AWS `copernicus-dem-30m`, 3600² px, 3 overviews **(executed)** | EPSG:4326, **PixelIsPoint** / EGM2008 | Different model (DSM), ±several m; forest belts add 20–30 m bumps → contour wiggles | Fallback for a local plate only if TINITALY access fails |
| **Copernicus GLO-90** | 3″ (~90 m) | DSM | as GLO-30 (WorldDEM-90 wording assumed, MEDIUM) | as above with "WorldDEM-90" | Global | `copernicus-dem-90m`, 1200² px, 2 overviews **(executed)** | EPSG:4326 / EGM2008 | Not joined: a separate map | **Use for the overview** |
| EU-DEM v1.1 | 25 m | DSM hybrid | — | — | Europe | **No longer distributed** (EEA: "not maintained anymore and is no longer available") | EPSG:3035 | — | Do not use |
| SRTM GL1 | 1″ | DSM (radar, 2000) | Public domain (NASA) | none required | Voids in steep alpine terrain (void-filled versions patch them with other data) | Earthdata login; 1° HGT/GeoTIFF | EPSG:4326 / EGM96 | — | Do not use: older, has voids, and Copernicus beats it everywhere |

### 1.3 How sources "join" at the border

- **Don't mosaic two sources into one plate.** Each region plate comes from exactly one source, and the overview from one source. With no shared edge, there is no seam to blend. swissALTIRegio already did the cross-border harmonisation for everything in its rectangle.
- **Vertical datums differ** (LN02, Genova 1942 / Italian levelling, Austrian GHA, EGM2008 for Copernicus) by about 2 m at most in the Alps. That is invisible at the 50 and 100 m contour intervals. Keep the D-17 rule: label summits and the altimeter with **official** heights, not DEM extremes.
- **Grid north.** A plate on a projected grid is rotated against true north by the meridian convergence: about 3° for LV95 at Seceda (300 km east of Bern), about 2.4° for UTM 32N in the eastern Dolomites, and close to zero for EPSG:3035 near 10° E. That's acceptable for a survey plate. Draw any north arrow from the CRS, not as "up".

### 1.4 Alps overview map (executed prototype)

Prototype: Copernicus GLO-90, 72 tiles over 5–17° E × 43–49° N, **overview level 2** (300 px/°), mosaic 3600 × 1800, nearest-neighbour downsample, equirectangular with cos 46°, d3-contour + simplify-js, rings under 6 px dropped, ½-px rounding.

| Grid | Interval | SVG raw | brotli | Note |
|---|---|---|---|---|
| 1600 × 1152 | 500 m | 610 KB | 141 KB | too heavy |
| 1600 × 1152 | 1000 m | 255 KB | 59 KB | |
| 1200 × 864 | 500 m | 440 KB | 102 KB | |
| 1200 × 864 | **1000 m** | 187 KB | **43 KB** | best tested; still 3× the hero |

**Recommendation:** 1,000 m interval (index lines every 2,000 m), a 3 × 3 box blur on the heights before contouring (the DSM is noisy), simplify at 1.5–2 px, drop rings smaller than about 8 px, and contour only from 1,000 m up so the Apennines, Jura and Po plain fall away. Target **≤ 30 KB br**. Back it with an AVIF hillshade poster (the existing D-16 code) if the bare contours read too thin. This needs one spike to confirm the size target.

**Projection:** plate carrée scaled by cos(46.5°) on the GLO-90 grid as delivered (EPSG:4326). Pins are then linear in lat/lon, with no library. Across 43–49° N the east–west scale error is ±4 %, invisible on a decorative 1:4 M overview. Use LAEA (EPSG:3035 via proj4) only if the overview must be measurable.

**Robustness (found in the prototype):** two runs reported 4 and then 1 "missing" tiles. Ocean tiles are legitimately absent (404/403), but network failures look the same if both are caught as "sea". The fetch must treat only a 404/403 on a tile known to be ocean as sea level, using the bucket's `tileList.txt`, and fail on anything else.

### 1.5 Attribution impact

`site.attribution.terrain` is one string today. With more than one source it becomes **per source**, and the footer should show the sources used on the current page. Copernicus additionally needs the liability sentence "in a licence or any legal warning or notice". A short `/attributions` (or legal) page linked from the footer is the clean place for it. BEV under CC BY 4.0 needs name, licence link and a "modified" note.

---

## 2. Reading and reprojecting rasters at build time

### 2.1 Options

| Option | Size / install | Licence | Maintenance | Does what we need? | Verdict |
|---|---|---|---|---|---|
| **geotiff.js** (have) | 3.8 MB unpacked, devDependency | MIT | 3.0.5, 2026-03-30 | COG range reads of BEV/Copernicus/swisstopo, local TIFF reads, windowing and overviews **(executed)** | **Keep** |
| **proj4** (add) | 0.8 MB unpacked; 46 KB gz (irrelevant at build) | MIT | Active (2.22.0 2026-08-31; 2.23.0 2026-11-12) | Point transforms WGS84 ↔ 3035 / UTM 32N / LV95; agrees with `lib/geo.ts` to 0.15 m in CH **(executed)** | **Add as devDependency only when a non-LV95 plate exists**; pin 2.22.0 |
| Hand-written LAEA + UTM formulas in `lib/geo.ts` | 0 deps, ~60 lines | — | Ours | Exact enough (EPSG GN 7-2 formulas); keeps `lib/geo.ts` usable in the client | Alternative if Tim wants zero deps; verify against proj4 in a Jest test |
| `geotiff-geokeys-to-proj4` | 1.5 MB | BSD-3 | Active (2026.10.9) | Turns GeoKeys into proj4 strings automatically | Not needed: we know each source's CRS; pin the defs by hand |
| `epsg-index` | 16 MB | ISC | Stale (2023) | EPSG lookup table | No |
| `gdal-async` | **215 MB** unpacked, native binaries | Apache-2.0 | Active (3.12.3) | Everything, including warping | **No**: CI runs `npm ci` with devDependencies on every job, so it adds minutes and native-build risk for one manual fetch step |
| GDAL CLI (conda / miniforge, already on Tim's machine) | external | MIT/X | — | `gdalinfo` and `gdalwarp` for **manual inspection** | Fine for debugging, but don't make it a pipeline dependency: the pipeline is Node-only by design (T-08-09) |

### 2.2 Pattern: window on the native grid, transform only points

```js
// scripts/terrain/fetch-region.mjs (sketch): a BEV plate, no raster reprojection
import { fromUrl } from 'geotiff';
import proj4 from 'proj4';
proj4.defs('EPSG:3035', '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs');

const [cx, cy] = proj4('EPSG:4326', 'EPSG:3035', [12.6941, 47.0745]);        // plate centre, lon/lat order
const cell = (v) => Math.floor(v / 50000) * 50000;                           // tile name = SW corner
const url = `https://data.bev.gv.at/download/ALS/DTM/20240915/ALS_DTM_CRS3035RES50000mN${cell(cy)}E${cell(cx)}.tif`;
const tiff = await fromUrl(url);
const full = await tiff.getImage(0);
const [ox, oy] = full.getOrigin();                                           // e.g. 4499999.5, 2700000.5 (pixel centres on whole metres)
const ov = await tiff.getImage(3);                                           // overviews carry no geo transform: scale from widths
const s = full.getWidth() / ov.getWidth();                                   // ≈ 8 m/px
const win = [(cx - 5500 - ox) / s, (oy - (cy + 5500)) / s, (cx + 5500 - ox) / s, (oy - (cy - 5500)) / s].map(Math.round);
if (win[0] < 0 || win[1] < 0 || win[2] > ov.getWidth() || win[3] > ov.getHeight()) throw new Error('plate leaves the tile: mosaic the neighbour');
const [band] = await ov.readRasters({ window: win, samples: [0] });          // Float32, nodata -9999, check every value
// then: resampleBilinear() to the 1100² source grid -> grey16 PNG, same as fetch-dem.mjs today
```

**geotiff.js gotchas found while executing:**
- **A window outside the image returns zeros silently.** A wrong tile came back as 1,896,129 values, all 0.0, with no error. Always bounds-check the window and fail on a min = max = 0 read. `fetch-dem.mjs` already does the first check.
- **BEV tile names are the south-west corner** of the 50 km cell, not the north-west.
- **BEV overviews have no affine transform** (`getResolution()` throws on them). Derive the scale from the width ratio.
- **The BEV origin is at x.5 m** (PixelIsArea with centres on whole metres). A 10 m output grid needs an explicit half-pixel decision.
- **Copernicus COGs are PixelIsPoint** (`GTRasterTypeGeoKey` 2), a half-cell shift of about 15 m at GLO-30. `fetch-dem.mjs` rejects anything that is not PixelIsArea, so a Copernicus fetcher needs its own rule.
- **A plate can straddle two BEV tiles** (same CRS and grid). Read both windows and concatenate. That is not a cross-source mosaic.

### 2.3 LV95 ↔ WGS84

Keep `lib/geo.ts` (swisstopo approximate formulas). The executed comparison against proj4 with the standard 3-parameter Bessel shift:

| Point | Δ formula vs proj4 |
|---|---|
| Zermatt | 0.15 m |
| Matterhorn | 0.16 m |
| Seceda (IT, 300 km out) | 2.81 m |
| Innsbruck (AT) | 2.24 m |

Both are approximations at the metre level, and the shipped coordinates are rounded to about 10 m (4 dp). So **regions inside swissALTIRegio keep using `wgs84ToLv95` for pins**, and proj4 is not needed for them.

---

## 3. Drone video

### 3.1 What exists (don't rebuild it)

- `scripts/media/build-clip.mjs` (D-27): ffmpeg through `execFileSync` with an argument array, H.264 High yuv420p, `+faststart`, metadata, chapters and SEI stripped, bitexact, WebP poster from the encoded frame, hashed names, zod sidecar `data/media/clips.json`, `--check` in `data:check` without ffmpeg.
- `scripts/guards/lib/mp4-boxes.mjs`: ISO-BMFF walker. It whitelists top-level boxes and `moov` children, forbids `uuid`, `XMP_`, `©xyz`, `loci`, and enforces one video track and no audio.
- Today's limits: `MAX_CLIP_BYTES` 1.5 MiB, 4–10 s, 512 px wide (the coin-flip clip is 512 × 1010, 60 fps, 377 kbps, 212 KB).
- CSP: no `media-src`, so `default-src 'self'` covers `<video>`. `frame-src 'none'`. `connect-src 'self'`.
- Service worker: media requests and anything with a `Range` header go straight to the network (needs real 206 responses).

### 3.2 Shapes Tim can choose between

| Shape | What it is | Fits Hobby + same-origin? | Work |
|---|---|---|---|
| **A. Silent ambient loops** | 6–12 s, no audio, autoplay muted inline loop (off for reduced motion and Save-Data), as a full-bleed region header or inside a series | **Yes**: extend `clip:derive` | Raise the budget per kind (e.g. a "loop" kind ≤ 4 MiB, ≤ 12 s, 1280 or 1920 wide), optional AV1 rendition, `<source>` order, a guard rule for `av01` |
| **B. Edited films** | 1–5 min, with audio, user-started, controls | **No**: 135+ MB each; Hobby transfer, git and history limits | External host plus a CSP change plus a privacy decision (§3.5) |
| **C. Both** | A in the immersive layout, B linked or embedded per region | Partly | A now, B behind a click-to-load facade |

**Recommendation: A for v2.1.** It is the only shape that keeps the constraints as they are: same origin, no third party, zero client JS, existing guards. Treat B as a separate decision row (hosting table below) that Tim can take later in the milestone without blocking A.

### 3.3 Codecs and containers

| Codec / container | Browser support | Size vs H.264 | Encode | Verdict |
|---|---|---|---|---|
| **H.264 High, MP4** | Universal | 1× | Fast (`libx264`, installed) | **Mandatory baseline** |
| **AV1, MP4** | Chrome, Edge, Firefox; Safari only on hardware with an AV1 decoder (iPhone 15 Pro and later, M3 Macs and later) (MEDIUM) | ~0.45–0.6× | SVT-AV1 needs the Gyan full build; libaom is installed but slow | **Optional first `<source>`**: halves the bytes where supported. Keep MP4, not WebM, so the ISO-BMFF walker still guards it and Safari can play it |
| HEVC, MP4 | Safari; Chrome/Edge with hardware decode; Firefox only partly (MEDIUM) | ~0.6× | `libx265` installed | Skip: patchy, and AV1 + H.264 covers everyone |
| VP9, WebM | Chrome, Firefox, Safari (partly) | ~0.65× | `libvpx-vp9` | Skip: WebM is not ISO-BMFF, so the guard would need a second parser |
| HLS / DASH (segmented) | HLS native in Safari and, reportedly, Chrome/Edge 142+ desktop (one secondary source, LOW); Firefox needs `hls.js` | adaptive | Many files | Only for B; never needed for 6–12 s loops |

DJI masters are often 10-bit HEVC in D-Log M or HLG. **Have Tim export a graded SDR Rec.709 master** (ProRes or high-bitrate H.264) into the gitignored `assets/clips-original/` and encode from that. Don't tone-map in the pipeline.

**Encoding recipe (arguments for `execFileSync`, extending `clip:derive`):**

```js
// H.264 loop, 1280 wide (use 1920 for a full-bleed desktop header)
['-i', master, '-map', '0:v:0', '-an', '-sn', '-dn', '-map_metadata', '-1', '-map_chapters', '-1',
 '-vf', 'scale=1280:-2:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '23',
 '-profile:v', 'high', '-g', '60', '-movflags', '+faststart', '-fflags', '+bitexact', '-flags:v', '+bitexact', out]
// AV1 loop (needs libsvtav1 = Gyan full build)
['-i', master, '-map', '0:v:0', '-an', '-sn', '-dn', '-map_metadata', '-1', '-map_chapters', '-1',
 '-vf', 'scale=1280:-2:flags=lanczos,format=yuv420p', '-c:v', 'libsvtav1', '-preset', '5', '-crf', '34',
 '-g', '60', '-movflags', '+faststart', '-fflags', '+bitexact', out]
```

```html
<video muted playsinline loop preload="none" poster="/media/zermatt-loop-poster.<hash>.avif">
  <source src="/media/zermatt-loop.<hash>.av1.mp4" type='video/mp4; codecs="av01.0.08M.08"'>
  <source src="/media/zermatt-loop.<hash>.mp4"     type='video/mp4; codecs="avc1.640028"'>
</video>
```

### 3.4 Expected sizes (MEDIUM: bitrate arithmetic for detailed aerial landscape, not yet measured on Tim's footage)

MB = Mbps × seconds ÷ 8.

| Rendition | Typical bitrate | 8 s loop | 3 min film |
|---|---|---|---|
| 1920 × 1080 H.264 CRF 21–23 | 6–9 Mbps | 6–9 MB | 135–200 MB |
| 1920 × 1080 AV1 CRF 32–36 | 2.5–4 Mbps | 2.5–4 MB | 56–90 MB |
| 1280 × 720 H.264 | 3–4.5 Mbps | 3–4.5 MB | 68–100 MB |
| 1280 × 720 AV1 | 1.2–2 Mbps | 1.2–2 MB | 27–45 MB |
| 960 × 540 H.264 (mobile) | 1.5–2.5 Mbps | 1.5–2.5 MB | 34–56 MB |

Drone footage is near the worst case for encoders (foliage, water, rock texture, constant motion). **First task of the video phase: encode one real 8 s clip at these settings and record the bytes.** That turns this table into the budget constant.

### 3.5 Hosting comparison (for shape B; shape A is row 1)

Scenario: 5 films × 3 min (15 min) plus a few loops, about 500 film plays per month.

| Host | Monthly cost | Hard limits | CSP change | Client JS | Same-origin / privacy | Ops |
|---|---|---|---|---|---|---|
| **`public/media` via git (existing)** | $0 | GitHub hard limit 100 MB per file; every re-encode stays in public history forever; Hobby **100 GB Fast Data Transfer per month shared with the whole site**, over it = paused for 30 days | **None** | 0 | ✅ / ✅ | Existing `clip:derive` + guard. **Loops only.** |
| Git LFS + Vercel LFS toggle | $0 | LFS bandwidth is spent on **every Vercel build clone** | None | 0 | ✅ / ✅ | Not recommended |
| **Vercel Blob (public store)** | $0 on Hobby | **1 GB storage, 10 GB Blob transfer, 10k simple ops per month**; over any = **Blob blocked for 30 days**. 135 MB film ≈ 74 full plays | `media-src 'self' https://<store>.public.blob.vercel-storage.com` | 0 | ❌ cross-origin / ✅ first-party vendor | `@vercel/blob` 2.9.0 CLI upload; no hashed-name guard |
| Self-hosted HLS (public/ or Blob) | as above | as above, plus many segment files | `media-src 'self' blob:`, `worker-src 'self' blob:` (`hls.js` MSE + worker) | `hls.js` light **120 KB gz** (full 189 KB), lazy, Firefox only | ✅ / ✅ | High: ladder, playlists, SW bypass |
| **Cloudflare Stream** | **$5 per started 1,000 min stored (prepaid) + $1 per 1,000 min delivered** ≈ $6–7 | none practical | iframe: `frame-src https://customer-<code>.cloudflarestream.com`; or own `<video>` + HLS: `media-src`/`connect-src` that host | iframe 0 on our page | ❌ / ⚠️ third-party CDN | Upload in dashboard or API; encoding included |
| **Mux** | **Free plan: 10 assets, 100,000 delivery min/month up to 1080p**, "Mux" badge until a card is added | 10 assets | `media-src blob: https://stream.mux.com`, `img-src https://image.mux.com`, `connect-src https://*.mux.com https://*.litix.io` (MEDIUM), `worker-src blob:` | `@mux/mux-player` **328 KB gz** (bundles `hls.js`) | ❌ / ⚠️ Mux Data beacons unless disabled | Easiest DX, heaviest player |
| **Bunny Stream** (EU, Slovenia) | Encoding free; storage from $0.01/GB, delivery $0.005–0.01/GB; **$1 monthly minimum** ≈ $1 | none practical | iframe: `frame-src https://iframe.mediadelivery.net` (MEDIUM); or HLS host | iframe 0 | ❌ / ✅ EU vendor | Dashboard upload |
| **YouTube (`youtube-nocookie.com`) behind a click-to-load facade** | $0 | YouTube may place ads; cookies and tracking after play | `frame-src https://www.youtube-nocookie.com` (+ a self-hosted facade poster, so no `img-src` change) | Facade ~0–3 KB, ours | ❌ / ❌ Google | Upload to a channel; reach and discovery bonus |
| Vimeo | Paid plan needed to remove branding (price not verified, LOW) | plan quotas | `frame-src https://player.vimeo.com` | iframe 0 | ❌ / ⚠️ | — |

**If Tim wants films:** Bunny Stream (cheapest, EU, iframe so no player JS on our page) or YouTube-nocookie behind a facade (free, reach). Both cost one `frame-src` origin and an update to the audit gate's CSP expectations. **Avoid self-hosting films on Hobby:** about 740 full 135 MB plays use up the whole site's monthly transfer, and an overrun pauses the deployment.

### 3.6 CSP diff per option (`buildCsp` in `proxy.ts`)

```ts
// Shape A (loops on our origin): nothing. default-src 'self' already covers media.
// Bunny iframe:           "frame-src https://iframe.mediadelivery.net"        (replaces 'none')
// YouTube facade:         "frame-src https://www.youtube-nocookie.com"
// Vercel Blob progressive: "media-src 'self' https://<store>.public.blob.vercel-storage.com"
// Any hls.js/MSE player:   add "blob:" to media-src and "worker-src 'self' blob:" (or hls.js enableWorker: false)
```

`frame-ancestors 'none'` is unaffected. Each added origin must also be added to the production audit gate (12-20), which fails on any CSP violation.

### 3.7 Stripping DJI metadata

Where a DJI recording hides location and telemetry:

| Carrier | Example | Removed by |
|---|---|---|
| Sidecar files | `.SRT` (per-frame GPS and altitude on older models), `.LRF` (low-res proxy MP4 with the same metadata) | Never copy them in. Add `*.srt`/`*.lrf` to the served-asset guard's banned extensions |
| Timed-metadata tracks in the MP4 | `djmd` (telemetry) and `dbgi` (debug) protobuf tracks on newer models (Air 3S, Mini 5 Pro) | `-map 0:v:0` plus `-dn`. The walker's "one video track" rule fails the output if one survives |
| XMP / udta | `uuid` XMP box (drone-dji GPS, gimbal), `©xyz` | `-map_metadata -1`. The walker forbids `uuid`, `XMP_`, `©xyz`, `loci` |
| Encoder SEI / creation time | x264 SEI, `creation_time` | `-fflags +bitexact -flags:v +bitexact` (already in `clip:derive`) |

The existing pipeline already handles all of these for the coin-flip clip. Extend the walker's selftest with a real DJI-shaped fixture (one with a `djmd` track and a `uuid` box) so the rule is proven for drone input. The selftest builds fixtures from ffmpeg 9.0.1 output today.

---

## 4. Small features

### 4.1 PHOTO-F2: Web Share

MDN BCD (fetched 2026-11-12) for `navigator.share`:

| Browser | Support |
|---|---|
| Chrome | 128+ on all desktop OSes (89–127 Windows/ChromeOS only); Android 61+ |
| Edge | 93+ |
| Safari / iOS | 12.1+ |
| **Firefox desktop** | **Only behind `dom.webshare.enabled`**, so **a fallback is required** |
| Firefox Android | 79+ |

No library. `Permissions-Policy` today is `camera=(), microphone=(), geolocation=()`, and `web-share` keeps its default `self`. **Don't add `web-share=()`.**

```tsx
'use client';
export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  async function onShare() {
    const data = { url, title };
    if (typeof navigator.share === 'function' && navigator.canShare?.(data) !== false) {
      try { await navigator.share(data); return; }
      catch (e) { if ((e as DOMException).name === 'AbortError') return; }   // user closed the sheet
    }
    await navigator.clipboard.writeText(url);                               // Firefox desktop path
    setCopied(true);                                                        // announce via aria-live
  }
  return <button type="button" onClick={onShare}>Share</button>;           // same markup on server and client
}
```

Share the canonical `site.url` + path, not `location.href` (which carries `?view=`). Render the same button on the server and the client, and choose the behaviour on click, to avoid a hydration mismatch.

### 4.2 PHOTO-F4: LV95 next to WGS84

- Use `wgs84ToLv95` from `lib/geo.ts` (no new dependency).
- Convert **from the shipped, rounded 4-dp WGS84** and round the result to 10 m (`E 2'623'450 N 1'095'990`). Metre-level LV95 would publish more precision than the 4-dp privacy rule allows.
- Swiss format: apostrophe thousands separators, E before N.
- "Swiss photos only": the Matterhorn plate itself spans the Italian border, so the plate can't decide this. Add a `country` field per region with a per-photo override in `corrections.json`.

### 4.3 PLAT-F1: JSON-LD under the nonce CSP

- The Next 16.4 guide (`node_modules/next/dist/docs/01-app/02-guides/json-ld.md`) says: render a native `<script type="application/ld+json">` in `page.tsx`/`layout.tsx` and escape `<` as `<`. Don't use `next/script`. It also suggests `schema-dts` for typing.
- **CSP:** a `<script>` whose type is not a JavaScript MIME type is an HTML *data block*. The browser never executes it, so `script-src` does not apply and **no nonce is needed** (HIGH, from the HTML "prepare the script element" algorithm). The root layout already awaits `headers()`, so nothing changes in rendering mode either way.
- Types to emit:

| Page | `@type` | Key properties |
|---|---|---|
| Root layout | `WebSite` + `Person` | `name: "Tim Lui"`, `url: site.url`, `sameAs` (GitHub, LinkedIn) |
| Region series page | `ImageGallery` (a `CollectionPage`) | `about: Place { name, geo: GeoCoordinates }`, `hasPart: ImageObject[]` (refs) |
| Photo page | `ImageObject` | `contentUrl` (largest derivative), `width`/`height`, `creator: Person`, `copyrightNotice: "© 2021 Tim Lui"`, `creditText`, `dateCreated` (the naive EXIF string, not a UTC-shifted Date), `contentLocation: Place { geo }` with the **4-dp** coordinates |
| Video (only if a loop is content, not decoration) | `VideoObject` | `name`, `description`, `thumbnailUrl`, `uploadDate`, `contentUrl`, `duration` |

Google's image-metadata feature needs at least one of `creator`, `creditText`, `copyrightNotice` or `license`. Skip `license` / `acquireLicensePage` while print licensing (PLAT-F4) is out of scope. Add a Jest test that parses every emitted block and checks `@type` and that no raw `<` appears.

### 4.4 PLAT-F2: offline page that lists cached pages

**Already shipped in v2.0** (12-15, EDGE-02, D-12): `components/site/SavedPages.tsx` walks `caches.keys()` → `cache.keys()` and maps URLs through `savedPageRows(urls, catalog)`, so a raw cached URL is never printed (T-12-30). There is an "unsupported" state for browsers without the caches API. For v2.1 only:
- Add the region series URLs (and any redirect targets) to the catalog.
- Keep the service worker's media/Range bypass, so loop videos never enter Cache Storage.

The requirement should be marked done or narrowed in REQUIREMENTS.md. Note: Safari can evict a site's storage, Cache Storage included, after 7 days without interaction (MEDIUM), so "saved" is best-effort, as the copy already implies.

### 4.5 ENG-F1: terminal step controls and transcript

No dependency. Drive the steps from the existing demo data. Previous / next / pause are buttons with `aria-controls`, and the static transcript is a server-rendered `<ol>`/`<pre>` built from the same array, so it can't drift.

---

## 5. Repo safety

### 5.1 Classic branch protection vs rulesets (personal public repo)

| | Classic branch protection | **Repository ruleset (recommended)** |
|---|---|---|
| Available here | Yes (public repos on GitHub Free) | **Yes**: this repo already has an active ruleset (`automated-actions`, id 10401314) |
| Rules per branch | One rule | Several rulesets layer; the most restrictive wins; they also layer **with** classic rules |
| Bypass | "Do not allow bypassing" checkbox; admins bypass by default | Explicit bypass list with mode `always` or `pull_request` |
| Visibility | Admins only | Anyone with read access sees active rulesets |
| As code | No export | JSON export/import; `gh api` |
| Pin a check to its source app | Partly | `integration_id` per required check (GitHub Actions app, MEDIUM: id 15368) prevents spoofed statuses |
| Dry run | No | `evaluate` mode is Enterprise-only, so on this plan only Active/Disabled |

**The existing ruleset `automated-actions` has `conditions.ref_name.include: []`**, so by my reading it matches no branch and enforces nothing. It carries `deletion`, `non_fast_forward` and a `pull_request` rule with code-owner review, plus an Integration bypass (actor 29110). Disable or replace it rather than layering a second ruleset next to something nobody remembers.

### 5.2 How skipped CI interacts with required checks (GitHub docs)

| Situation | Check state | Effect on a PR |
|---|---|---|
| Head commit message has `[skip ci]`, `[ci skip]`, `[no ci]`, `[skip actions]`, `[actions skip]` or a `skip-checks: true` trailer (only `push` and `pull_request` events) | **Pending** forever | **Blocked** until a new commit without the marker is pushed. This fails closed, which is good. |
| Workflow skipped by `paths` / `branches` filters | **Pending** | Blocked ("Waiting for status to be reported") |
| **Job** skipped by `if:` | **Success** | Passes (e.g. `dependency-review` on push) |
| Same job name in two workflows | Collision / race | GitHub and Vercel both warn: keep check names unique |

`ci.yml` has **no path filters** (only branch filters), so requiring its checks is safe today. Keep it that way, or the next path filter silently becomes a merge blocker.

**The gap that `[ci skip]` really opens:** a direct push to `main` with `[ci skip]` runs no checks, and **Vercel deploys it to production anyway**. A "require pull request" rule blocks direct pushes (admins can still bypass in `pull_request` mode, which only lets them merge PRs). **Vercel Deployment Checks** hold every production deployment until the named GitHub checks pass on that commit, so a `[ci skip]` commit stays un-promoted until a Force Promote. Plan availability on Hobby isn't stated on the docs page (MEDIUM). Check the project settings.

### 5.3 Recommended configuration

One aggregate check, so renames, the PR-only `dependency-review` and new jobs don't break the rule:

```yaml
# .github/workflows/ci.yml (new last job)
  ci-ok:
    name: CI OK                  # the only required check; keep the name unique across workflows
    if: always()
    needs: [lint-and-typecheck, unit-tests, e2e-tests, visual-regression, build, security-audit, dependency-review]
    runs-on: ubuntu-latest
    steps:
      - name: Every needed job passed (dependency-review may skip on push)
        env:
          NEEDS: ${{ toJSON(needs) }}
        run: |
          echo "$NEEDS" | jq -e 'to_entries | all(.value.result == "success" or (.key == "dependency-review" and .value.result == "skipped"))'
```

```jsonc
// gh api -X POST repos/{owner}/{repo}/rulesets --input main-ruleset.json   (Tim applies it; it's a settings change)
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "bypass_actors": [{ "actor_type": "RepositoryRole", "actor_id": 5, "bypass_mode": "pull_request" }],  // admin role id: confirm in the UI
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": { "required_approving_review_count": 0, "dismiss_stale_reviews_on_push": false,
      "require_code_owner_review": false, "require_last_push_approval": false, "required_review_thread_resolution": false,
      "allowed_merge_methods": ["merge"] } },
    { "type": "required_status_checks", "parameters": { "strict_required_status_checks_policy": false,
      "do_not_enforce_on_create": false, "required_status_checks": [{ "context": "CI OK", "integration_id": 15368 }] } }
  ]
}
```

`strict: false`, because a solo repo doesn't need "branch up to date" re-runs. `allowed_merge_methods: ["merge"]` matches the milestone-PR convention. The Vercel Deployment Check should require the same `CI OK`. Dependabot PRs then need a green `CI OK` too, which is intended: #110 and #111 are red.

### 5.4 Confirm Upstash in production

1. `npx vercel@latest env ls production`: expect `UPSTASH_REDIS_REST_URL` **and** `UPSTASH_REDIS_REST_TOKEN`. If only `KV_REST_API_URL` / `KV_REST_API_TOKEN` exist (Marketplace naming, MEDIUM), the limiter is silently off. Either rename them or read both name pairs in `lib/rate-limit.ts`.
2. Black-box probe: the honeypot path is limited before it is dropped (Phase 12 CONTACT-03). Six honeypot POSTs from one IP within an hour should give **429 on the sixth**. A 200 means the always-allow fallback is live.
3. Consider making the fallback **fail loudly** when `VERCEL_ENV === 'production'` (log an error, or refuse), so this can't regress silently.

---

## Installation

```bash
# Only if a region falls outside swissALTIRegio and needs BEV or TINITALY (build-time only):
npm install -D proj4@2.22.0

# PLAT-F1 typing (types only, zero runtime bytes):
npm install -D schema-dts@2.1.0

# Nothing else. geotiff 3.0.5, d3-contour 4.0.3, simplify-js 1.2.4, sharp 0.35 and fast-png stay as they are.

# Local tools (not npm):
winget install Gyan.FFmpeg      # full build, only if AV1 loops are wanted (adds libsvtav1)
```

## Alternatives Considered

| Recommended | Alternative | When to use the alternative |
|---|---|---|
| A region **inside** swissALTIRegio | A region needing BEV/TINITALY | When the photos really are from the Hohe Tauern, Salzkammergut or Eastern Dolomites. Costs a new fetcher, proj4, a new credit line and per-source attribution. |
| TINITALY 1.1 for Italian plates | Copernicus GLO-30 | When TINITALY tile access is gated or slow. Accept DSM canopy bumps, a 30 m source under a 21 m/px output grid, and the long Copernicus notice. |
| BEV ALS DTM 1 m for Austria | BEV DGM Höhenraster 10 m (EPSG:31287) | Never: MGI datum shift, zip delivery, frozen in 2021. |
| Copernicus GLO-90 overview | GLO-30 overviews | When the overview needs more detail than about 250 m/px. GLO-30 overview 3 is 450 px/°, similar data, 4× the tiles' bytes. |
| Plate carrée overview (cos φ) | LAEA EPSG:3035 via proj4 | When the overview must be measurable or shown with a scale bar. |
| proj4 at build time | Hand-written LAEA/UTM in `lib/geo.ts` | When Tim wants zero new dependencies, or the client must project. Verify against proj4 in Jest. |
| Loops in `public/media` | Vercel Blob | When loops outgrow the repo (> ~50 MB total). Blob's Hobby 10 GB transfer cap is the binding limit. |
| Bunny Stream / YouTube facade for films | Mux free plan | When DX matters more than a 328 KB player and a badge; 10-asset cap. |
| One aggregate `CI OK` check | Requiring each job | When you want per-job required status. Breaks on renames and on `dependency-review` skipping on push. |
| Ruleset | Classic branch protection | Equivalent for one rule. Rulesets win on visibility, JSON export and app-pinned checks. |

## What NOT to Use

| Avoid | Why | Use instead |
|---|---|---|
| `gdal-async` (215 MB, native) | CI installs devDependencies on every job; native binaries on Windows and Linux; all of it for one manual step | geotiff.js + proj4 |
| Warping rasters (`gdalwarp`-style reprojection) in the pipeline | Resampling twice blurs ridges and complicates `--check` byte-equality | Window on the native grid; transform only points |
| Mixing two DEM sources in one plate | Datum/model seams, DSM-vs-DTM steps | One source per plate |
| EU-DEM | Withdrawn by the EEA | Copernicus GLO-30/90 |
| SRTM | 2000 data, alpine voids | Copernicus / national DTMs |
| AWS Terrain Tiles / any runtime DEM or tile fetch | Breaks `connect-src 'self'` and the same-origin rule (v2.0 decision) | Build-time pipeline |
| Map libraries (MapLibre, Leaflet) for the overview | Runtime tiles plus a basemap palette | Contour SVG + pins in grid UV |
| Self-hosting films on Vercel Hobby (public/ or Blob) | 100 GB/month shared transfer, or 10 GB Blob; overrun = 30-day pause | External host (Bunny/YouTube) or loops only |
| `@mux/mux-player` / `hls.js` for loops | 328 KB / 120 KB gz for 6–12 s clips that a `<video>` plays natively | Progressive MP4 (AV1 + H.264) |
| WebM for AV1 | The MP4 box walker can't check it; Safari prefers MP4 | AV1 in MP4 |
| Git LFS for media | Every Vercel build clone uses LFS bandwidth | Hashed files in `public/media` (small) or an external host |
| A nonce on JSON-LD, or `next/script` for it | Data blocks aren't executed; `next/script` is for JS (Next guide) | Native `<script type="application/ld+json">` with `<` escaped |
| `web-share=()` in Permissions-Policy | Disables PHOTO-F2 | Leave the default (`self`) |
| Requiring checks from a workflow with `paths:` filters | Skipped workflow = Pending = PR blocked | Unfiltered `ci.yml` + aggregate `CI OK` |

## Stack Patterns by Variant

**If every launch region is inside swissALTIRegio (recommended path):**
- `fetch-dem.mjs` takes a region list (`id`, LV95 `extent`, `country`). The output becomes `data/terrain/source/<id>/dem-10m.png` + `source.json`, and `build-terrain.mjs` loops over regions.
- No new dependency, credit line or CRS. Pins keep using `lib/geo.ts`.

**If a launch region is in Austria east of 12° E:**
- Add `fetch-region-bev.mjs` (COG range read, §2.2), `proj4@2.22.0`, the BEV credit, and a `crs: 'EPSG:3035'` field in `TerrainSource`. Pins transform in `photos:build` with proj4, and plate data stores UV, not CRS coordinates.

**If a launch region is in Italy east of 12° E:**
- TINITALY tiles downloaded by hand into a gitignored `assets/dem-original/`; `fromFile` read; `crs: 'EPSG:32632'`; proj4 for pins. Copernicus GLO-30 if TINITALY can't be obtained (then add the Copernicus notice and liability sentence).

**For the overview, always:**
- `fetch-overview.mjs` → GLO-90 overview level 2 mosaic → committed 16-bit source → `build-terrain` adds an `overview` artifact (contours ≤ 30 KB br, optional hillshade AVIF), with pins in plate-carrée UV.

**If drone video is loops only:**
- Extend `ClipsSidecar` with a `kind: 'demo' | 'loop'` and a per-kind budget, an optional AV1 rendition and an AVIF poster. Zero CSP change.

**If drone films are added:**
- One `frame-src` origin, a click-to-load facade with a self-hosted poster, and the audit gate updated to expect that origin. The privacy note on the page names the host.

## Version Compatibility

| Package / tool | Compatible with | Notes |
|---|---|---|
| `geotiff@3.0.5` | Node 24; BEV, Copernicus and swisstopo COGs | Verified range reads against all three on 2026-11-12. Out-of-bounds windows return zeros without an error. |
| `proj4@2.22.0` | ESM import from `.mjs` scripts | 2.23.0 was published on 2026-11-12; pin 2.22.0 until it settles. The default export works with Node's ESM loader (executed with 2.23.0's `dist/proj4-src.js`). |
| `schema-dts@2.1.0` | TypeScript 6.0 | Types only (`import type`), so nothing reaches the bundle. |
| ffmpeg 9.0.1 (Gyan essentials) | H.264 / HEVC / libaom AV1 / VP9 | No SVT-AV1. The full build adds it. The selftest fixtures were made with 9.0.1. |
| `<video>` AV1 + H.264 `<source>` | Chrome, Edge, Firefox, Safari | Safari falls through to H.264 without an AV1 hardware decoder. |
| Vercel Hobby | 100 GB Fast Data Transfer, 10 GB Fast Origin Transfer, 1 M CDN requests; Blob 1 GB / 10 GB / 10k ops | Over the limit = feature paused for 30 days; non-commercial use only. |

## Sources

- **Executed (HIGH):**
  - swissALTIRegio STAC collection (`data.geo.admin.ch/api/stac/v1/collections/ch.swisstopo.swissaltiregio`, bbox 4.5157–11.9898° E / 44.8368–48.7855° N) and COG structure, coverage mask and 20 point samples via geotiff 3.0.5.
  - Copernicus GLO-30/GLO-90 COGs on AWS (`copernicus-dem-30m` / `-90m`, tile N46 E012): size, overviews, PixelIsPoint.
  - The 72-tile overview mosaic and contour sizes (d3-contour 4.0.3, simplify-js 1.2.4).
  - BEV ALS DTM: HEAD (`Accept-Ranges`, 553 MB / 6.8 GB) and an 11 km window read in 1.5 s.
  - proj4 vs `lib/geo.ts` (4 points).
  - npm registry (`npm view`) for geotiff, proj4, gdal-async, epsg-index, geotiff-geokeys-to-proj4, hls.js, schema-dts, `@mux/mux-player`, `@vercel/blob`, media-chrome, shaka-player, dashjs, ffmpeg-static, fluent-ffmpeg, lite-youtube-embed, vercel.
  - gzip sizes of `hls.min.js`, `hls.light.min.js`, `proj4.js`, `mux-player.js` from the packed tarballs.
  - `ffmpeg -encoders` on the installed build.
  - `gh api` for the repo's rulesets and branch protection.
  - Repo code: `proxy.ts` `buildCsp`, `scripts/terrain/*.mjs`, `scripts/media/build-clip.mjs`, `scripts/guards/lib/mp4-boxes.mjs`, `components/site/SavedPages.tsx`, `lib/rate-limit.ts`, `data/site.ts`, `next.config.ts`, `.github/workflows/ci.yml`.
- **Official docs, fetched and cross-checked (MEDIUM):**
  - Next 16.4 JSON-LD guide (`node_modules/next/dist/docs/01-app/02-guides/json-ld.md`).
  - Copernicus WorldDEM-30 licence PDF (notice and liability sentence), https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf
  - BEV metadata records (`data.bev.gv.at/geonetwork`, CC-BY-4.0, EPSG:3035, URL pattern).
  - TINITALY download page and citation, https://tinitaly.pi.ingv.it/Download_Area1_1.html
  - EEA/CLMS notice that EU-DEM is no longer disseminated, https://land.copernicus.eu/api/en/products/products-that-are-no-longer-disseminated-on-the-clms-website
  - Vercel: https://vercel.com/docs/plans/hobby, https://vercel.com/docs/vercel-blob/usage-and-pricing, https://vercel.com/docs/limits, https://vercel.com/docs/limits/fair-use-guidelines, https://vercel.com/docs/deployment-checks
  - GitHub: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs, https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets, and the troubleshooting-required-status-checks pages.
  - MDN browser-compat-data (`api/Navigator.json` share/canShare; `Permissions-Policy` `web-share`).
  - Cloudflare Stream pricing, https://developers.cloudflare.com/stream/pricing
  - Mux free plan, https://www.mux.com/blog/free-plan, and pricing, https://www.mux.com/pricing/video
  - Bunny Stream pricing, https://bunny.net/pricing/stream/
- **Single secondary source (LOW):**
  - Chrome/Edge 142 native HLS on desktop, https://tech-ish.com/2025/12/08/google-chrome-microsoft-edge-chromium-native-hls-playback-desktop
  - DJI `djmd`/`dbgi` track description, https://raw.githubusercontent.com/CallMarcus/dji-drone-metadata-embedder/master/docs/MP4_TIMED_METADATA.md
  - South Tyrol DTM 2.5 m records (licence not confirmed)
  - Vimeo pricing (not checked)

## Gaps / Open Questions

- **Region choice (blocks the terrain phase):** inside or outside the swissALTIRegio rectangle decides whether proj4, a second fetcher and new credits are needed at all.
- **BEV credit line:** CC BY 4.0 is confirmed, but BEV's preferred wording is not. Check on data.bev.gv.at before shipping an Austrian plate.
- **TINITALY access:** whether the 1.1 tiles still sit behind a request form, and the tile file format. Check by downloading one tile.
- **Copernicus GLO-90 notice:** I verified the WorldDEM-30 wording; the GLO-90 licence presumably reads "WorldDEM-90". Confirm before the overview ships.
- **Overview size target (≤ 30 KB br):** needs a spike with smoothing and ring filtering. The 43 KB br figure is unsmoothed.
- **Real drone bitrates:** §3.4 is arithmetic. Encode one of Tim's clips first.
- **Vercel Deployment Checks on Hobby,** the Marketplace Upstash variable names, and the GitHub Actions `integration_id` (15368) and admin `RepositoryRole` id (5): confirm in each UI before applying.
- **Chrome desktop native HLS** (only matters for films): one secondary source.

---
*Stack research for: v2.1 Survey Expansion (multi-region Alpine terrain, overview map, drone video, platform polish, repo safety)*
*Researched: 2026-11-12*
