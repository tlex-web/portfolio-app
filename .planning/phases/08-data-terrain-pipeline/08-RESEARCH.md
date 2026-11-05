# Phase 8: Data & Terrain Pipeline - Research

**Researched:** 2026-10-24
**Domain:** Build-time geodata (swisstopo DEM → heightmap, contours, hillshade), EXIF → typed photo data, privacy-safe image derivatives, zod schemas, a static Server Component footer (SHELL-04)
**Confidence:** HIGH for the pipeline mechanics (each one was run this session against the live swissALTIRegio COG, the four real originals and the repo's sharp 0.35.5 and Chromium 156). MEDIUM for cross-platform byte determinism and the trail-grade mapping. LOW for the items listed in the Assumptions Log.

## Summary

Each core technique of this phase was **prototyped end to end in the scratchpad this session**. Results:

- **DEM read.** The current swissALTIRegio COG (STAC `datetime` 2026-05-28) was range-read for an 11 × 11 km LV95 window in about 1.3 s. The 512² window has no nodata cells.
- **Heightmaps.** Lossless 16-bit grey PNGs written with sharp from a `Uint16Array` round-trip with 0 pixel differences, read back by both fast-png and sharp. **`adaptiveFiltering: true` cuts the files by 22–40%:** 512² is 195 KB in metres and 352 KB in decimetres.
- **Contours.** d3-contour plus simplify-js produce small SVGs: the hero LOD (512 grid, 100 m) is 12 KB brotli and the footer strip (native 10 m grid, 100 m) is 6 KB brotli. The rendered SVG showed a **real defect**: d3-contour closes every ring along the raster border, so stroked contours draw a frame round the asset. The fix is to emit open polylines and drop border segments. It was verified visually.
- **Poster.** A Horn-method hillshade (NW light) computed in plain JS and encoded with sharp comes to 112 KB AVIF at 1100². No headless WebGL is needed, and the output is deterministic on one machine.
- **Footer mask.** The strip SVG used as a CSS `mask-image` with `mask-size: cover` renders as UI-SPEC intends in Chromium 156.
- **EXIF.** The originals' EXIF matches CONTEXT D-04. None of the files has `OffsetTimeOriginal`, and exif-reader returns the naive local time as a UTC `Date`. GPS UTC timestamps confirm +02:00. All four originals are sRGB. **`withMetadata()` re-embeds GPS EXIF and XMP; the default sharp pipeline strips EXIF, XMP, IPTC and ICC.**

The dominant planning risks are not technical. They are (1) **visual-baseline churn**: copy changes on `/photos` and the footer on every route must be re-baselined in separate commits, with Tim committing the PNGs; (2) **three human checkpoints**: Tim approves the copy and slugs (D-05/D-07), supplies the riskScores (D-22), and confirms the attribution option and the extent; and (3) **keeping v1 consumers working**. `data/landscapes.ts` feeds the Home LCP, GalleryGrid, PhotoCarousel3D and ImageDetailModal until Phases 9 and 10, so the new typed data must be bridged into the legacy `LandscapeImage` shape rather than replace it.

**Primary recommendation:** Split every generator into a **pure core in import-free `lib/*.ts`**, Jest-tested and importable by Node 24 type-stripping, and an **impure shell in `scripts/**/*.mjs`** for network, fs, sharp, d3-contour and geotiff. Commit a compact native-resolution DEM source raster so CI can re-derive every text artifact offline. Make CI `--check` compare text byte for byte, PNG heightmaps by decoded pixels, and lossy rasters only by hash-equals-filename.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Photo facts & editorial copy
- **D-01:** The waterfall (`img-0629`, EXIF GPS 46.0081 N 7.7385 E, 1,715 m) is the **Gornerschlucht** (Gorner Gorge), as Tim confirmed. Record it as a `locationOverride` with the reason "EXIF GPS + confirmed by Tim". The "Teufelsschlucht" title, alt text, story and the `teufelsschlucht-trail-1` annotation (with its facts) are all wrong and get replaced. The Teufelsschlucht is near Hägendorf SO, not Zermatt.
- **D-02:** The film scan (`r004-011`, no GPS) shows the **Riffelsee (~2,757 m)**. Hand-place its pin on the lake's north shore (the classic Matterhorn reflection viewpoint), taking the coordinates from the swisstopo map during research. The data flags it approximate (e.g. `position.approximate: true` plus a reason), and every consumer must be able to show that flag (DATA-04).
- **D-03:** The film scan was shot in **2019 (year only)**. Its EXIF `DateTimeOriginal` (2020-02-12 15:38) is the **scan date** and must never be used as the capture date. The current `2021-07-21` is wrong too. The schema must support a year-precision capture (e.g. `capture: { year: 2019, precision: 'year', source: 'Tim' }`), so no day or month is invented. "© 2019 Tim Lui" follows from it.
- **D-04:** Capture dates for the three digital photos come only from EXIF (naive local time, stored with `Europe/Zurich`): img-0605 is 2021-09-06 10:48:46, img-0629 is 2021-09-06 11:22:57 and img-0662 is 2021-09-07 10:58:25. The filename-derived `captureDate` values (2022-02-01, 2022-07-29) are deleted.
- **D-05:** **Claude drafts all corrected copy and Tim approves it** before it ships, so the plan needs a review checkpoint. In scope: new stories for all four photos (img-0662 and r004-011 currently share the same "Glacier Trail" story), titles and alt text where facts change, and annotations. Rules: first person, short, factual. Every annotation fact must be checkable (DEM height, place names, sourced facts). Generic trivia that can't be sourced (Toblerone, "over 500 deaths", "visible from 100 km", the Glacier Paradise / Klein Matterhorn note on a Riffelsee photo) is cut or replaced with a sourced fact.
- **D-06:** The Glacier Trail copy is fixed against the data: img-0662 sits at ~2,597 m (EXIF) near the **Schwarzsee end** of the Matterhorn Glacier Trail (45.9908 N 7.7104 E), not at 2,900–3,100 m. Annotation altitudes must agree with the DEM-sampled height (DATA-03).
- **D-07:** **Descriptive slugs** for `/photos/[slug]` (e.g. `matterhorn-from-zermatt`, `gornerschlucht-waterfall`, `riffelsee-reflection`). The slug field lives in the photo data now. The old camera ids (`img-0605`, …) stay as internal keys tying editorial data to EXIF and derivatives. — **Reversibility:** one-way — once Phase 10 ships `/photos/[slug]`, the URLs get shared and linked, so renaming one needs redirects. Tim approves the final slug strings.
- **D-08:** **Year and season tags are derived from the capture date**, never hand-typed (img-0605 is tagged "2024" today, but it was shot in Sep 2021). Subject tags (e.g. `reflection`) stay hand-written in the editorial file. A year-only capture (the film scan) gets a year tag and no season tag.

#### Originals, privacy & served images
- **D-09:** The 194 MB originals move to a **local, gitignored folder at the repo root, outside `/public`** (e.g. `assets/photos-original/`). Only Tim's machine runs the full extraction, and Tim keeps his own backup. Nothing photo-original is committed, Git LFS included, because the repo is **public** (`tlex-web/portfolio-app`).
- **D-10:** The **CI stale check is two-stage with fingerprints** (DATA-02):
  1. Locally, originals → a **committed EXIF sidecar**: the extracted fields with GPS already rounded to 4 decimals, so full precision is never committed, plus a sha256 per original.
  2. In CI, sidecar → typed photo data is re-derived and the build fails on any diff. CI also checks that the committed derivatives match the hashes in the image manifest. Run locally, `--check` additionally re-hashes the originals against the sidecar.
- **D-11:** **The full-resolution copies leave the site and HEAD.** `public/images/optimized/*UTC).jpg` and `*UTC).webp` (12480×8320 and 4712×3212, EXIF already stripped, ~85 MB) are committed and served on the live site today, and they are also the input of `prebuild` → `optimize-images.mjs` on Vercel. Once they are gone, Vercel cannot regenerate derivatives at build time, so **derivatives are generated locally and committed** (content-hashed), and the prebuild step must no longer depend on full-res inputs.
- **D-12:** **Git history is left as is (site only).** The GPS-bearing originals sit in public history at `287c2e9` (initial commit, deleted in `347d8e1`), and the full-res copies at `8fa0991`. Tim accepts that exposure; record it in the phase SUMMARY and PROJECT.md. No history rewrite and no force-push. — **Reversibility:** reversible — a later filter-repo purge stays possible as a separate step run by Tim.
- **D-13:** The **largest served image is 2560 px on the long edge** (the lightbox at 2× DPR, still far below print resolution, consistent with all rights reserved). The legacy `-large` (2400 px) files stay on disk until Phase 12, per the existing decision.

#### Terrain framing, attribution & heights
- **D-14:** **Extent: an ~11 km square around all four photo spots and the summit**, ~21 m/px at 512². Zermatt sits near the NE edge, the summit near the W edge, and the Italian side below the summit is included (the reason swissALTIRegio was chosen). The same extent feeds both heightmaps, the contour SVGs, the hillshade, the footer band and the Phase 10 map. Reference points: Matterhorn 45.9763 N 7.6586 E, img-0605 46.0150 N 7.7414 E, img-0629 46.0081 N 7.7385 E, img-0662 45.9908 N 7.7104 E, Riffelsee ≈ 45.987 N 7.77 E (verify). — **Reversibility:** costly — changing it later moves every terrain UV, the Phase 9 camera route and the waypoint placement, and re-baselines every footer screenshot.
- **D-15:** **Attribution string:** the researcher pulls the exact source reference from the swissALTIRegio product documentation, because swisstopo's general terms say swissALTI and Regio products use product-specific wording rather than the plain "© swisstopo". The researcher quotes the source URL, and Tim confirms the string at plan review. It lives in one constant (e.g. in `data/site.ts`).
- **D-16:** **The static poster is hillshade + contours:** Swiss-style relief shading (Imhof tradition, NW light) rendered from the same DEM at build time as AVIF/WebP, with the contour SVG overlaid. Phase 9 uses it as the LCP and as the fallback without WebGL or motion. The poster asset is produced here.
- **D-17:** **Heights:** photo waypoints use **DEM-sampled heights** (EXIF altitude is 9–25 m off). The summit shows the **official 4,478 m** as a named constant, because a 10 m DEM rounds the peak off. The altimeter rail starts at the **lowest photo's DEM height**, so its start is data-driven, and the **HOME-04 / Phase 9 wording "1,626 m" is updated to match** (1,626.1 m is img-0605's EXIF altitude). Store both values where they differ (e.g. `elevationDem` vs the official constant) so the summit plaque and the rail stay consistent.

#### Footer map legend (SHELL-04)
- **D-18:** The footer becomes a **map-sheet margin** in the style of a swisstopo sheet. Contents: a sheet title ("Zermatt – Matterhorn"), the contour interval ("Equidistance N m", read from the terrain metadata), a **true scale bar**, the corner coordinates, a "last surveyed" date and the attribution, next to the existing identity block and links. The scale bar must stay true at every breakpoint (computed from the rendered band's metres per pixel, or drawn in the same SVG coordinate space).
- **D-19:** **The contour art is a full-bleed band along the footer's top edge**, a horizontal crop of the real contours through the summit ("strip" LOD). The sheet-margin text sits in a grid below it, never on the lines.
- **D-20:** **The footer art carries decorative waypoint ticks** at the real photo positions (the Riffelsee one styled approximate). They are `aria-hidden`, not links, and add no tab stops.
- **D-21:** **The footer is static: no draw-in, no drift, no scroll-driven parallax.** This overrides research ARCHITECTURE §5's idea of footer contour parallax. It also keeps the Phase 7 rule that SiteFooter imports nothing from `motion/react` and that the screenshot baselines stay deterministic.

#### Project highlights & riskScore (DATA-07)
- **D-22:** **`riskScore` values come from real CLI_X output.** Tim runs the four existing demo commands through CLI_X and supplies the scores, plus a Medium and a Critical example if he has them (Phase 11 needs those). The highlights plan stops at a **human-action checkpoint** to collect them. `riskScore` is required in the schema, so nothing ships with invented scores.

### Claude's Discretion
- **Season rule** for derived tags (meteorological, where Sep = autumn, vs astronomical): pick one, state it in the schema, and show Tim the resulting tags in the copy review (D-05). Under meteorological seasons the three Sep 2021 photos become "autumn", not today's "summer".
- **Heightmap encoding:** DATA-01, the ROADMAP research note (sharp `grey16` from a `Uint16Array`) and research STACK.md (16-bit grey PNG decoded with `fast-png`) agree. Research ARCHITECTURE.md §3 proposes terrain-RGB instead. The researcher resolves the conflict. The requirement wording (16-bit) wins unless research shows a concrete failure.
- Contour interval(s) and LODs, file naming and hashing scheme, the sidecar format, the manifest shape, the derivative widths and formats below 2560 px, the CRS math in `lib/geo.ts`, and how d3-contour (ESM-only, y-down) is kept out of Jest-imported components.
- The corner-coordinate format on the footer (WGS84 vs LV95) and the "last surveyed" source (DEM product edition vs terrain build date) go to the footer UI-SPEC.
- The exact Riffelsee pin coordinates, within D-02.

### Deferred Ideas (OUT OF SCOPE)
- **Git history purge** of the GPS-bearing originals (`287c2e9`) and the full-res copies (`8fa0991`): declined for now (D-12). It could still run later as a separate step by Tim (git filter-repo, force-push every branch, GitHub Support cache purge), at the cost of changing every commit SHA cited in `.planning/`.
- **Medium and Critical CLI_X demo commands:** Phase 11 needs them. Tim may supply them at the Phase 8 riskScore checkpoint (D-22), which would save Phase 11 a trip.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | swissALTIRegio → 16-bit heightmap (512², 256²) + contour SVG, content-hashed | §Terrain pipeline (verified COG URL, window read, grey16 + adaptive filtering, d3-contour border fix, LODs, hashing, offline `--check` from a committed source raster) |
| DATA-02 | EXIF → typed committed photo data; CI fails when stale | §Photo pipeline (verified EXIF values, sidecar format, two-stage check, zod 4 gotchas) |
| DATA-03 | Content accurate: EXIF dates (Europe/Zurich), waterfall location, annotation altitudes vs GPS, year tags, no near-duplicate stories | DEM heights measured this session; structured `elevation` with source; derived tags; copy-review checkpoint; `ImageDetailModal` date trap |
| DATA-04 | Film scan hand-placed, flagged approximate everywhere | Riffelsee lake surface measured in swissALTI3D 0.5 m → pin 45.9837 N 7.7623 E; schema shape; consumer obligations |
| DATA-05 | No full-res/GPS image fetchable; served images resized, rotated, metadata-free; CI scan | Verified sharp strip/`withMetadata` behaviour; served-image guard spec; prebuild change; proxy and cache-header changes |
| DATA-06 | Shipped coordinates rounded to 4 decimals | Rounding happens in the sidecar (stage 1); a test asserts at most 4 decimals in generated data |
| DATA-07 | Typed per-project highlights; numeric `riskScore` on every risk example | Discriminated union on the real slugs `clix-cli` / `clix-website`; zero-diff legacy adapter; riskScore band check; `lib/trail-grade.ts` |
| DATA-08 | Image manifest used for image paths | Manifest shape, hashed names under `/images/photos/`, srcset helpers, legacy bridge until Phase 10 |
| SHELL-04 | Footer map legend: contour art, scale bar, swisstopo attribution | UI-SPEC is approved; this research supplies the strip asset geometry, metadata fields, the verified mask render, the attribution text and the precache wiring |
</phase_requirements>

## Project Constraints (from AGENTS.md, user CLAUDE.md and memory)

There is no `./CLAUDE.md`. The binding sources are listed below.

- **AGENTS.md:** "This is NOT the Next.js you know … Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices." Next is **16.4.2** [VERIFIED: `node -p require('next/package.json').version`]. The guides were read this session for the proxy matcher, `headers()` Cache-Control, the `public` folder, and the `next/image` loader and SVG handling (see Sources).
- **User CLAUDE.md:** compare alternatives with concrete metrics (done below), flag regression risks explicitly, and treat UX as a first-class concern.
- **Memory "Use ui-ux-pro-max for UI work":** the footer (SHELL-04) and `ContourField` are UI work. Plans must have the executor consult the `ui-ux-pro-max` skill while implementing the footer. The approved 08-UI-SPEC already records its searches, so the executor re-checks against it rather than redesigning.
- **Memory "Visual re-baseline via gh":** Claude dispatches `visual-baselines.yml`, downloads and compares the result. **Tim commits and pushes the PNGs.** Threshold 0.01. Settings files are never touched.
- **Memory "Verify approval before briefing":** subagents must never be told "Tim approved X" without Tim's literal reply. This applies to the attribution option, the slugs, the copy, the extent and the riskScores.
- **Phase 7 conventions:** guards are zero-new-dependency `.mjs` files under `scripts/guards/` with selftest fixtures. Tests are rewritten and never deleted or skipped (`test.skip` is rejected by `test-count.mjs`). The ratchet starts at **206** (`"jest": 107, "e2e": 99, "total": 206`) [VERIFIED: scripts/guards/test-count.baseline.json:2-4]. Use the palette and contrast guards. CI runs Node from `.node-version` = `24` [VERIFIED: .node-version].

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| DEM fetch (network) | Build script (local, manual) | — | Never in `prebuild`, so Vercel does not depend on swisstopo [PITFALLS 9] |
| Heightmap, contours, hillshade generation | Build script (offline, from the committed source raster) | CI (`--check`) | Deterministic, re-derivable in CI |
| WGS84 ↔ LV95 ↔ UV math | Shared pure module `lib/geo.ts` | Scripts (type-stripped import), Phase 9/10 runtime | One coordinate contract |
| EXIF extraction | Build script (local only, needs originals) | — | Originals never reach CI |
| Sidecar → typed photo data | Build script (CI-runnable) | Jest invariants | Two-stage check (D-10) |
| Image derivatives + manifest | Build script (local), committed static files | CI scan | Vercel can no longer regenerate them (D-11) |
| Served-image privacy enforcement | CI guard (`npm run lint`) | e2e header and 404 checks | Fails before deploy |
| Typed photo/project/terrain data | Static data modules (`data/**`, Server-safe constants) | Client components (`import type` only) | zod stays out of the client bundle |
| Footer map legend | Frontend Server (Server Component), also client-rendered in `global-error` | CDN (hashed SVG, immutable) | Static, no JS |
| Cache policy for hashed assets | `next.config.ts` `headers()` + service worker | Proxy matcher exclusion | Immutable is safe only with hashes |

## Standard Stack

### Core (all build-time devDependencies, so none reaches the client bundle)

| Library | Version | Purpose | Why standard |
|---------|---------|---------|--------------|
| `geotiff` | 3.0.5 | Range-read the swissALTIRegio COG by window | Read the live COG in ~1.3 s this session; ESM, MIT, 800k downloads/wk [VERIFIED: npm registry + package-legitimacy OK] |
| `d3-contour` | 4.0.2 | Marching-squares isolines | Reference implementation; ESM-only (`type: module`); 14.6M downloads/wk; last release 2023-01 (finished software) [VERIFIED: npm registry + legitimacy OK] |
| `simplify-js` | 1.2.4 | Douglas–Peucker path simplification | 7 KB, 0 deps; strip goes 23 KB → 6 KB brotli [VERIFIED: npm registry + legitimacy OK] |
| `exif-reader` | 2.0.3 | Parse `sharp().metadata().exif` | 33 KB, 0 deps, released 2025-12; ran on all 4 originals [VERIFIED: npm registry + legitimacy OK] |
| `sharp` | 0.35.5 (already installed, devDep) | grey16 PNG, hillshade and derivative encoding, metadata audit | Already in repo with a version floor [VERIFIED: package.json] |
| `zod` | 4.4.3 (already installed) | Schemas, generator validation | Already a dependency [VERIFIED: node_modules/zod/package.json] |

**Not added in Phase 8:** `fast-png`. Phase 9 needs it as a *runtime* dependency for client-side 16-bit decode. In Phase 8 the `--check` decode uses sharp (`.toColourspace('grey16').raw({ depth: 'ushort' })`, verified lossless). Adding it now as a devDependency would only have to be moved later.

**Installation (exact pins: contour, hillshade and EXIF output depend on library versions, and the ratchet and parity guards prefer pins):**
```bash
npm install -D --save-exact geotiff@3.0.5 d3-contour@4.0.2 simplify-js@1.2.4 exif-reader@2.0.3
```
After installing, run `npm run guard:parity`, because `check-install-parity.mjs` compares the lockfile with the installed versions.

### Alternatives Considered (with metrics)

**EXIF parser**

| Option | Unpacked size | Deps | Last release | Verdict |
|---|---|---|---|---|
| **exif-reader 2.0.3** | 33 KB | 0 | 2025-12-12 | **Use.** Parses the buffer sharp already returns; verified on 4 files |
| exifr 7.1.3 | 1.29 MB | 0 | 2022-05 | Unmaintained for 4 years and redundant [VERIFIED: npm view] |
| exiftool-vendored 39.0.1 | 1.9 MB + a bundled Perl exiftool binary | 5 | 2026-10 | Most complete, but spawns an external process, is heavy, and handles timezones through luxon; overkill for 4 files |
| sharp only | 0 | — | — | sharp exposes the raw EXIF buffer but no parsed tags |

**Contour generation**

| Option | Size | Verdict |
|---|---|---|
| **d3-contour 4.0.2 + simplify-js** | 49 KB + 7 KB | **Use.** Verified. Needs the border-segment fix (Pitfall 1) |
| Hand-rolled marching squares | ~150 lines | Saddle disambiguation and ring assembly are easy to get wrong; no gain |
| GDAL `gdal_contour` | Native install | Not available on the machine or in CI; non-JS toolchain |

**Heightmap encoding (measured this session on the real 11 × 11 km window)**

| Encoding | 512² | 256² | Notes |
|---|---|---|---|
| **16-bit grey PNG, sharp, `adaptiveFiltering: true`, decimetres** | **352 KB** | **93 KB** | **Recommended.** 0.1 m steps give smooth Phase 9 shader isolines |
| 16-bit grey PNG, sharp adaptive, metres | 195 KB | 60 KB | Fallback if HOME-08 bytes get tight; 1 m terraces on flat valley floors |
| 16-bit grey PNG, sharp default filtering | 327 / 452 KB (m / dm) | 91 / 118 KB | What STACK.md measured: 40% larger |
| 16-bit grey PNG, fast-png `encode` | 327 / 451 KB | 91 / 118 KB | Byte-deterministic pure JS, but has no filter control |
| Terrain-RGB 8-bit | 690 KB (STACK) | — | ARCHITECTURE §3's concern (browsers decode to 8 bits) does not apply when fast-png decodes in JS. **Resolution: the requirement wording (16-bit) wins; no concrete failure was found** |

**Content hashing**

| Option | Verdict |
|---|---|
| **sha256 of the encoded bytes, first 10 hex chars, in the filename (`name.<hash>.ext`)** | **Use.** Matches DATA-01 ("committed with content-hashed filenames"). URLs are known before build, so the SW precache and PhotoMap `<image href>` can use them |
| Next static imports (`import x from '…png'` → `/_next/static/media/x.<hash>.png`, immutable, cannot be overridden [CITED: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md "Cache-Control"]) | Rejected. Hashes exist only after build (SW precache cannot list them), the committed filenames would not be hashed, and it adds image-loader moduleNameMapper concerns in Jest |

## Package Legitimacy Audit

| Package | Registry | Age (latest publish) | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| geotiff | npm | 2026-03-11 | 800,868 | github.com/geotiffjs/geotiff.js | OK | Approved |
| d3-contour | npm | 2023-01-11 | 14,576,289 | github.com/d3/d3-contour | OK | Approved |
| simplify-js | npm | 2020-02-03 | 178,754 | github.com/mourner/simplify-js | OK | Approved |
| exif-reader | npm | 2025-12-12 | 107,984 | github.com/devongovett/exif-reader | OK | Approved |
| fast-png (Phase 9, not installed now) | npm | 2025-12-18 | 8,802,268 | github.com/image-js/fast-png | OK | Approved for Phase 9 |

The verdicts come from `gsd-tools query package-legitimacy check` this session; no package has a `postinstall` script. **Packages removed due to [SLOP]:** none. **Packages flagged [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
                         (local, Tim's machine only)                     (CI + Vercel, offline)
 swisstopo STAC ──► terrain:fetch ──► data/terrain/source/*.png + source.json ─┐
 (COG, range req)    (network)        (native 10 m window, dm, committed)       │
                                                                                 ▼
                                                                    terrain:build [--check]
                                                                    ├─► public/terrain/heightmap-{512,256}.<h>.png
                                                                    ├─► public/terrain/contours-{hero,map,strip}.<h>.svg
                                                                    ├─► public/terrain/hillshade-{1100,640}.<h>.{avif,webp}
                                                                    └─► data/generated/terrain.ts (+ precache.json)
                                                                                 │ extent, UV, DEM sampler
 assets/photos-original/*.jpg ──► photos:exif ──► data/photos/exif-sidecar.json ─┤ (GPS 4 dp, sha256)
 (gitignored, 194 MB)             (local)          (committed)                    ▼
        │                                         data/photos/editorial.ts ──► photos:build [--check]
        │                                         data/photos/corrections.json   └─► data/generated/photos.ts
        └──► photos:derive (local) ──► public/images/photos/<id>-<w>.<h>.{avif,webp,jpg}
                                       data/generated/image-manifest.ts ──► guard: check-served-images (CI)
                                                                                 │
 consumers: SiteFooter ◄── terrain.ts + photos.ts (positions)                   ▼
            data/landscapes.ts (legacy bridge for v1 UI until Phase 10)   npm run lint (CI): all --check + guards
            Phase 9 hero / Phase 10 map / 404 ◄── ContourField(lod)
```

### Recommended Project Structure
```
assets/photos-original/            # gitignored originals (D-09); was public/images/landscapes/
data/
├── schemas.ts                     # zod 4 schemas; imports only 'zod' (Node type-strip safe)
├── photos/editorial.ts            # titles, slugs, stories, alt, subject tags, annotations (hand-written)
├── photos/corrections.json        # locationOverride / captureOverride / position {…, reason, source}
├── photos/exif-sidecar.json       # GENERATED locally (stage 1), committed
├── terrain/source/                # committed native DEM window (dm PNG) + source.json (STAC datetime, checksum)
├── generated/terrain.ts           # GENERATED: extent, grid, contour intervals, hashed URLs, DEM edition
├── generated/photos.ts            # GENERATED: typed photo facts (stage 2)
├── generated/image-manifest.ts    # GENERATED: id → variants
├── generated/precache.json        # GENERATED: URLs the SW precaches (strip SVG)
├── landscapes.ts                  # becomes a bridge: builds the legacy LandscapeImage[] from the above
├── projects.ts                    # discriminated union (clix-cli | clix-website), riskScore
└── site.ts                        # + attribution.terrain constant (D-15)
lib/
├── geo.ts                         # pure: wgs84↔lv95, lv95↔uv, extent helpers (no imports)
├── terrain/contour-paths.ts       # pure: open runs, path serialisation, rounding (no imports)
├── terrain/hillshade.ts           # pure: Horn shading (no imports)
├── photo-format.ts                # pure formatters: capture label, exposure "1/500 s", coords, LV95 ’ grouping
├── trail-grade.ts                 # pure: riskLevel/riskScore → grade
└── __tests__/…                    # Jest for all of the above
scripts/
├── terrain/fetch-dem.mjs          # network (manual)
├── terrain/build-terrain.mjs      # offline, --check
├── photos/extract-exif.mjs        # originals → sidecar; --check re-hashes originals when present
├── photos/build-photo-data.mjs    # sidecar + editorial + corrections + terrain → generated/photos.ts; --check
├── photos/build-derivatives.mjs   # originals → hashed derivatives + manifest (replaces optimize-images.mjs)
└── guards/check-served-images.mjs # metadata/size/hash scan (+ selftest fixtures)
components/terrain/ContourField.tsx # Server, zero JS; reads terrain.assets.contours[lod]
```

### Pattern 1: Pure core in import-free `.ts`, impure shell in `.mjs`
**What:** Node 24 type-strips `.ts` imported from `.mjs`. That was verified this session: `import { wgs84ToLv95 } from './geo.ts'` ran under Node v24.21.0. In a package with no `"type"` field (this repo) it emits the warning `MODULE_TYPELESS_PACKAGE_JSON` once. **Do not add `"type": "module"` to package.json**, because `jest.config.js` is CommonJS. Silence the warning with `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON` in the npm scripts.
**Rules for shared `.ts`:** erasable syntax only (no `enum`, `namespace` or parameter properties). **No relative or `@/` imports** (Node cannot resolve `@/`, and `./x.ts` needs `allowImportingTsExtensions`). Bare `'zod'` is fine.
**Why:** Jest (next/jest SWC) and tsc test the pure logic normally. d3-contour, geotiff and sharp never reach a Jest-imported module.

### Pattern 2: Two-stage photo data (D-10)
```
stage 1 (local): originals ──sha256, exif-reader──► exif-sidecar.json (GPS rounded 4 dp, alt 1 dp, naive local time)
stage 2 (CI):    sidecar + editorial + corrections + terrain source ──► generated/photos.ts   (--check: regenerate, diff)
```
Stage 2 samples the DEM at the **rounded** coordinates, so CI and local agree byte for byte.

### Pattern 3: `--check` strategy by artifact type

| Artifact | Check | Why |
|---|---|---|
| `.ts` / `.json` / `.svg` text | Regenerate in memory, compare bytes exactly | Pure JS arithmetic is deterministic |
| Heightmap PNG | sha256(committed bytes) starts with the hash in the filename **and** decoded pixels equal the regenerated `Uint16Array` | libvips/zlib-ng deflate bytes may differ across CPUs/OS [ASSUMED]; pixels may not |
| Hillshade AVIF/WebP, photo derivatives | sha256 matches the filename; dimensions match the manifest; no metadata | Lossy encoders are not cross-platform byte-stable [ASSUMED]; only the file Tim generated is authoritative |
| Originals (local only, when `assets/photos-original/` exists) | sha256 equals the sidecar | Detects an edited original that was not re-extracted |

### Pattern 4: Terrain metadata module (client-safe; consumed by footer, hero, map, 404)
```ts
// data/generated/terrain.ts — AUTO-GENERATED by scripts/terrain/build-terrain.mjs. Do not edit.
// Only scalars and URLs: no path data, no fs, no d3 (UI-SPEC "Static variant and determinism").
export const terrain = {
  crs: 'EPSG:2056',
  extent: { lv95: { west: 2616000, south: 1088000, east: 2627000, north: 1099000 }, widthM: 11000, heightM: 11000 },
  dem: { product: 'swissALTIRegio', stacDatetime: '2026-05-28', edition: '2026-05', heightScale: 0.1 },
  grids: { desktop: 512, mobile: 256 },
  contours: {
    hero:  { intervalM: 100, indexEvery: 5 },
    map:   { intervalM: 50,  indexEvery: 5 },
    strip: { intervalM: 100, indexEvery: 5, lv95: { west: 2616000, south: 1090600, east: 2627000, north: 1092800 } },
  },
  summit: { name: 'Matterhorn', officialM: 4478, lv95: { e: 2617049, n: 1091673 } },
  assets: {
    heightmap: { 512: '/terrain/heightmap-512.<h>.png', 256: '/terrain/heightmap-256.<h>.png' },
    contours: { hero: '/terrain/contours-hero.<h>.svg', map: '…', strip: '/terrain/contours-strip.<h>.svg' },
    hillshade: { avif: { 1100: '…', 640: '…' }, webp: { 1100: '…', 640: '…' } },
  },
} as const;
```
The values above are the ones prototyped this session (extent, strip bbox, summit LV95). `<h>` stands for the real hash. `edition` is discussed in Open Question 4.

### Pattern 5: Legacy bridge keeps v1 consumers stable
`data/landscapes.ts` keeps exporting `landscapes: LandscapeImage[]` but **derives** it from `generated/photos.ts` + `editorial.ts`. It keeps the legacy `src`/`fallbackSrc`/`thumbnailSrc` (`-large`/`-thumb`) until Phase 10 [PITFALLS 8]. It formats `elevation` strings and supplies a preformatted capture label. GalleryGrid, PhotoCarousel3D, ImageDetailModal, the Home LCP image and `GalleryGrid.test.tsx` keep working with no edits, except for the date trap (Pitfall 6).

### Anti-Patterns to Avoid
- **Importing a generator library into `app/`, `components/`, `lib/` or `data/`.** Add an ESLint `no-restricted-imports` entry for `d3-contour`, `geotiff`, `simplify-js`, `exif-reader` and `sharp` (see Pitfall 8 for the flat-config merge trap).
- **Hand-typed derived facts** (year tags, seasons, elevations, coordinate strings). Derive them, and test the derivation.
- **`toLocaleDateString` / `Intl` in shipped formatting.** Use pure formatters (UI-SPEC rule; PITFALLS 11 hydration).
- **Stable filenames under immutable cache headers.** Every new asset is hashed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| COG window reads | HTTP range + TIFF IFD parsing | `geotiff` `readRasters({ window })` | Tiling, LZW, overviews |
| Isolines | Marching squares + ring assembly | `d3-contour` | Saddles, holes, nesting |
| Polyline simplification | DP implementation | `simplify-js` (`highQuality: true`) | 7 KB, proven |
| EXIF IFD parsing | Byte parsing | `exif-reader` on sharp's buffer | Rational/DMS types, IFD pointers |
| Image encode, resize, rotate, strip | Anything | `sharp` (`.rotate()`, no `withMetadata`) | Verified strip behaviour |
| WGS84↔LV95 | proj4 (30 KB+) | swisstopo approximate formulas in `lib/geo.ts` (~20 lines) | Verified to ≤ 0.14 m against swisstopo REFRAME |
| Schema validation | Ad-hoc checks | zod 4 | Already installed; drives TS types |

**Key insight:** the hard problems here (geodesy, raster I/O, isolines, EXIF) have small, proven libraries. The custom work is the **contract**: one extent, one UV convention, deterministic rounding, hashing and checks.

## Runtime State Inventory

This phase moves originals, deletes served files and renames image URLs, so it counts as a migration.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None in databases. The SW `images-<BUILD_HASH>` / `static-<BUILD_HASH>` caches in visitors' browsers hold `/images/optimized/*` responses, including full-res files fetched before | None in code: caches rotate per build (`!name.endsWith(BUILD_HASH)` deletes old ones) [VERIFIED: public/service-worker.js:93-96] |
| Live service config | Vercel serves `public/` from the git build. CDN and browser caches keep the full-res URLs under `Cache-Control: public, max-age=31536000, immutable` (`source: '/images/:path*'`) [VERIFIED: next.config.ts:22-27] | Deleting from HEAD makes new deploys return 404; **browsers that already downloaded them keep their copies** (unavoidable, and covered by the D-12 acceptance). Verify a 404 on a preview deploy |
| OS-registered state | None. No scheduled tasks or hooks run the image scripts | None (verified: `optimize-images` is only referenced from `package.json` scripts) |
| Secrets/env vars | None. The STAC/COG endpoints need no auth | None |
| Build artifacts | `public/images/optimized/optimization-manifest.json` (written by the old script, lists the full-res filenames, publicly served; no consumer found by grep); `prebuild` runs `optimize-images.mjs`; `.gitignore` entry `public/images/landscapes/` | Delete the old manifest with the full-res files; change `prebuild`; move the `.gitignore` entry to `assets/photos-original/` |
| Git history | GPS originals at `287c2e9`, full-res at `8fa0991` | Record in SUMMARY/PROJECT.md only (D-12) |

## Common Pitfalls

### Pitfall 1: d3-contour draws a frame round the asset
**What goes wrong:** d3-contour returns closed polygons. Rings for regions touching the raster edge include segments **along the border** (coordinates exactly `x ∈ {0, W}` or `y ∈ {0, H}`). Stroking them draws a rectangle round every contour SVG. Reproduced this session (scratchpad render `full100.png` shows the frame).
**How to avoid:** Split each ring into open runs, dropping segments whose two endpoints lie on the same border. Emit `M…L…` with no `Z` for those runs, and keep `Z` only for rings that never touch the border (Code Example 2). The fix was verified visually.
**Warning signs:** A 1 px line along the top or bottom of the footer band.

### Pitfall 2: DEM height depends on the sampling grid (gorge photos)
**What goes wrong:** img-0629 sits in the Gornerschlucht. Bilinear sampling of the native 10 m grid gives **1,674.9 m**; STACK.md's earlier grid gave 1,689.4 m; EXIF says 1,714.9 m. Steep terrain makes heights grid-dependent.
**How to avoid:** Define one sampler: bilinear at pixel centres on the **native 10 m source raster**, at the 4-decimal coordinates. Store `elevationDem` rounded to whole metres. Phase 9 places 3D pins from its own mesh, not from this number. Document it in the schema.
**Measured this session (native 10 m, bilinear, GPS 4 dp):**

| Point | LV95 E/N | DEM m | EXIF GPS alt | UV (u, v) |
|---|---|---|---|---|
| Summit | 2'617'049 / 1'091'673 | 4,473.3 (grid max 4,477.0) | — | 0.0953, 0.6661 |
| img-0605 | 2'623'452 / 1'095'986 | **1,616.8** | 1,626.1 | 0.6775, 0.2740 |
| img-0629 | 2'623'230 / 1'095'217 | **1,674.9** | 1,714.9 | 0.6573, 0.3439 |
| img-0662 | 2'621'053 / 1'093'279 | **2,584.6** | 2,597.3 | 0.4594, 0.5201 |
| Riffelsee (gazetteer) | 2'625'066 / 1'092'475 | 2,756.6 | — | 0.8241, 0.5932 |

Consequence (D-17): the altimeter rail starts at **1,617 m** (img-0605 DEM), not 1,626 m. HOME-04's wording in REQUIREMENTS.md changes in this phase.

### Pitfall 3: `withMetadata()` re-leaks GPS; the default is clean
**Verified this session on IMG_0605 (sharp 0.35.5):** `.rotate().resize(2560)` → AVIF, WebP and JPEG carry exif 0, xmp 0, icc 0. Adding `.keepIccProfile()` keeps only the 3,144 B ICC. Adding `.withMetadata()` gives **exif 10,999 B with GPSInfo, xmp 12,661 B**.
**How to avoid:** Never call `withMetadata`, `keepExif`, `withExif` or `keepXmp` (the guard could also grep the script source). All four originals carry an sRGB ICC (`sRGB`, space `srgb`), so dropping ICC is colour-neutral. Make the derivative script **assert each input ICC is sRGB** and fail otherwise.
**Also scan XMP and IPTC.** The originals have XMP of 11–54 KB and IPTC of 10–17 KB. Their XMP carries no GPS today [VERIFIED: regex scan], but Lightroom can write `exif:GPSLatitude` into XMP. The CI scan must fail on **any** EXIF, XMP or IPTC, not only on an EXIF GPS IFD.

### Pitfall 4: exif-reader returns local wall time as a UTC `Date`
`DateTimeOriginal` comes back as `2021-09-06T10:48:46.000Z` for a 10:48:46 local exposure. `OffsetTimeOriginal` is `undefined` on all files [VERIFIED: run on the 4 originals]. Format with **UTC getters** to get the naive string `2021-09-06T10:48:46`. Compute the offset at build time with Node's ICU (`Europe/Zurich` on that date gives `+02:00`). Cross-check against `GPSTimeStamp`: 08:48:44.8 UTC vs 10:48:46 local means a +2 h offset with 1.2 s camera drift; assert |Δ − offset| < 60 s. Store `{ local, timeZone: 'Europe/Zurich', offset: '+02:00' }` so runtime code never needs timezone data.

### Pitfall 5: zod 4 defaults are looser than they look
Verified against the installed zod 4.4.3:
- `z.iso.datetime({ local: true, offset: false })` **still accepts a trailing `Z`**. Use a regex for naive local time: `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/`.
- `z.object` silently accepts extra keys. A year-precision capture with an invented `month: 5` passed. Use **`z.strictObject`** for the capture and position objects (enforces D-03).

### Pitfall 6: Year-only capture rendered as 1 January
`ImageDetailModal` renders `new Date(image.technicalDetails.captureDate).toLocaleDateString()` [VERIFIED: components/ImageDetailModal.tsx:192]. If the bridge passes `'2019'`, visitors see "1/1/2019", which invents a day and breaks D-03. The bridge must pass no `captureDate` for year precision, or ImageDetailModal must switch to a preformatted label from `lib/photo-format.ts`. Recommend the label: the component edit is tiny, and it also removes the locale-dependent output.

### Pitfall 7: Copy changes and the footer each re-baseline screenshots
`/photos` renders `image.title` in an `<h3>` and the hotspot count [VERIFIED: components/GalleryGrid.tsx:66, 51-60], so new titles and cut annotations change `photos/*` PNGs. The footer changes **every** route. UI-SPEC requires the footer re-baseline commit to contain no other visual change. **Sequence:** (1) data and copy commit plus its `photos` re-baseline (Tim commits); (2) footer commit plus the all-route re-baseline (Tim commits). Per Phase 7, use `check-snapshot-commit.mjs --some --allow <slug>`.

### Pitfall 8: ESLint flat-config `no-restricted-imports` blocks replace each other
A later config object scoped to `app/** components/** lib/** data/**` that sets `no-restricted-imports` **replaces** the global options for those files. That would silently drop the existing `framer-motion`, `@react-three/fiber` `Canvas` and `@phosphor-icons/react` bans [VERIFIED: eslint.config.mjs:49-72]. Either add the generator bans to the existing global block (they are never legitimate in scripts' consumers either, and the scripts are `.mjs` under `scripts/`, which can be excluded), or repeat all entries in the scoped block. Add an ESLint selftest case.

### Pitfall 9: The proxy runs on every public asset
The matcher `'/((?!api|_next/static|_next/image|favicon.ico|service-worker.js).*)'` [VERIFIED: proxy.ts:46-47] also matches `/terrain/*` and `/images/*`. Next 16 docs: "Without a `matcher`, Proxy runs on every request, including … assets in the `public/` folder" [CITED: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md §Matcher]. Each asset request then gets a CSP nonce for nothing. Exclude `images/` and `terrain/` (with the trailing slash, so a future `/images-x` page is not caught). Assets then lose the CSP header. That is acceptable for rasters. For the generated SVGs, the served-image guard asserts no `<script`, `on*=` or `href` (defence if someone opens the SVG directly).

### Pitfall 10: Mask images and service-worker routing
CSS mask fetches are image requests, but `fetch('/terrain/heightmap-512…png')` (Phase 9) has an empty destination. In the current SW it would fall to network-first in the dynamic cache [VERIFIED: public/service-worker.js:126-154]. Add `/terrain/` to the cache-first prefix list and precache the strip SVG so `/offline` keeps its band (UI-SPEC). Visual specs must await the strip response before capture (UI-SPEC "Mask image timing").

### Pitfall 11: Removing full-res files breaks `prebuild` assumptions
`"prebuild": "node scripts/optimize-images.mjs"` [VERIFIED: package.json scripts] reads `public/images/optimized/`, where the full-res inputs live. After deletion it prints "No source images found" and exits 0, so the build does not break. But the script is now meaningless on Vercel. Remove it from `prebuild`, replace it with the local-only `photos:derive`, and optionally run the cheap offline `data:check` in `prebuild`.

### Pitfall 12: Riffelsee coordinates in CONTEXT are about 650 m off
CONTEXT's "≈ 45.987 N 7.77 E (verify)" lies NE of the lake. Measured this session: the swisstopo gazetteer gives the lake label at 45.98338 N 7.76209 E (LV95 2'625'066 / 1'092'475). The swissALTI3D 2024 0.5 m flat water surface is at **2,756.55 m** and spans E 2'624'979–2'625'120, N 1'092'441–1'092'504 (~140 × 63 m, ~0.46 ha). See Open Question 2 for the pin.

### Pitfall 13: Highlights type change must not change pixels
`ProjectHighlights` renders `Object.entries(highlights)` recursively and derives labels from keys [VERIFIED: components/ProjectHighlights.tsx:57-65, 82-100]. Restructuring the data into blocks would change the clix-cli and clix-website pages (6 PNGs). Use a `toLegacyHighlights(blocks)` adapter. Jest asserts it deep-equals a fixture captured from today's `projects.ts` literal, which guarantees zero visual diff. Phase 11 deletes the adapter.

## Code Examples

### 1. `lib/geo.ts` (verified this session against swisstopo REFRAME)
```ts
// Source: swisstopo approximate formulas (WGS84 <-> CH1903+/LV95); accuracy ~1 m.
// Verified: forward ≤ 0.14 m vs geodesy.geo.admin.ch/reframe/wgs84tolv95 at 3 Zermatt points; round trip < 1 m.
export function wgs84ToLv95({ lat, lon }: { lat: number; lon: number }) {
  const p = (lat * 3600 - 169028.66) / 10000, l = (lon * 3600 - 26782.5) / 10000;
  return {
    e: 2600072.37 + 211455.93 * l - 10938.51 * l * p - 0.36 * l * p * p - 44.54 * l ** 3,
    n: 1200147.07 + 308807.95 * p + 3745.25 * l * l + 76.63 * p * p - 194.56 * l * l * p + 119.79 * p ** 3,
  };
}
export function lv95ToWgs84({ e, n }: { e: number; n: number }) {
  const y = (e - 2600000) / 1e6, x = (n - 1200000) / 1e6;
  const l = 2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x * x - 0.0436 * y ** 3;
  const p = 16.9023892 + 3.238272 * x - 0.270978 * y * y - 0.002528 * x * x - 0.0447 * y * y * x - 0.014 * x ** 3;
  return { lat: (p * 100) / 36, lon: (l * 100) / 36 };
}
/** u east, v south: row 0 = north, same as GeoTIFF rows and SVG y-down (no flip anywhere). */
export const lv95ToUv = ({ e, n }: { e: number; n: number }, x: { west: number; south: number; east: number; north: number }) =>
  ({ u: (e - x.west) / (x.east - x.west), v: (x.north - n) / (x.north - x.south) });
```
Test oracles recorded from REFRAME this session: (45.9763, 7.6586) → E 2617047.955, N 1091660.413; (45.983375549316406, 7.762086868286133) → E 2625065.748, N 1092474.685; (46.01502, 7.74144) → E 2623452.121, N 1095986.121. Assert within 1 m.

### 2. Open contour runs (Pitfall 1 fix; prototype verified)
```js
// scripts/terrain/build-terrain.mjs (the pure part belongs in lib/terrain/contour-paths.ts)
import { contours } from 'd3-contour';
import simplify from 'simplify-js';
const onEdge = (p, q, W, H) => (p[0] === 0 && q[0] === 0) || (p[0] === W && q[0] === W) || (p[1] === 0 && q[1] === 0) || (p[1] === H && q[1] === H);
function openRuns(ring, W, H) {
  const runs = []; let cur = [ring[0]];
  for (let i = 1; i < ring.length; i++) {
    if (onEdge(ring[i - 1], ring[i], W, H)) { if (cur.length > 1) runs.push(cur); cur = [ring[i]]; } else cur.push(ring[i]);
  }
  if (cur.length > 1) runs.push(cur);
  return { runs, closed: runs.length === 1 && runs[0].length === ring.length };
}
const r2 = (v) => Math.round(v * 2) / 2;                       // half-pixel rounding → deterministic, small
for (const mp of contours().size([W, H]).thresholds(levels)(Float64Array.from(grid))) {
  let d = '';
  for (const poly of mp.coordinates) for (const ring of poly) {
    const { runs, closed } = openRuns(ring, W, H);
    for (const run of runs) {
      const s = simplify(run.map(([x, y]) => ({ x, y })), 1, true);
      if (s.length >= 2) d += 'M' + s.map((p) => `${r2(p.x)} ${r2(p.y)}`).join('L') + (closed ? 'Z' : '');
    }
  }
  const index = Math.round(mp.value) % (intervalM * 5) === 0;  // UI-SPEC: every 5th = index contour
  if (d) paths.push(`<path d="${d}"${index ? '' : ' stroke-opacity="0.6"'}/>`);
}
// <svg xmlns viewBox="0 0 W H"><g fill="none" stroke="#000" stroke-width="1" vector-effect="non-scaling-stroke">…</g></svg>
```
**Strip LOD (UI-SPEC geometry):** read a **row sub-window** of the native grid that is 5:1 and centred on the summit northing, snapped to 100 m: LV95 `[2616000, 1090600, 2627000, 1092800]`, 1100 × 220 px. Contour only that window rather than cropping the full SVG with a viewBox. Measured: 22.9 KB raw / 6.2 KB br, versus 44.6 KB when cropped from the full set.

**Measured LOD sizes (raw / brotli):** hero 512-grid 100 m: 45 KB / 12 KB · map 512-grid 50 m: 92 KB / 24 KB · strip native 100 m: 23 KB / 6 KB. Native-grid 20 m (map) is 482 KB / 120 KB, which is too big; do not ship it.

### 3. Heightmap write (verified lossless and deterministic on one machine)
```js
// Resample the committed native source to 512/256 in OUR code (bilinear at pixel centres) — deterministic JS,
// not geotiff's resampler, so CI can regenerate from the committed source offline.
const u16 = Uint16Array.from(grid512, (m) => Math.round(m * 10));          // decimetres; heightScale 0.1 in metadata
const png = await sharp(u16, { raw: { width: 512, height: 512, channels: 1 } }) // pass the Uint16Array itself
  .toColourspace('grey16').png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
// --check: decode with sharp(png).toColourspace('grey16').raw({ depth: 'ushort' }) and compare pixels
```
Never pass a `Buffer` with `raw.depth: 'ushort'` (STACK.md: silently corrupts). Never resize float rasters with sharp (normalises them).

### 4. Hillshade poster (Horn method; prototype 138 ms for 1100², AVIF 112 KB, WebP 184 KB, deterministic per machine)
```ts
// lib/terrain/hillshade.ts — pure. Imhof/swisstopo convention: light from NW (azimuth 315°), altitude ~45°.
export function hillshade(h: Float32Array, W: number, H: number, cellM: number, azDeg = 315, altDeg = 45, z = 1) {
  const out = new Float32Array(W * H), az = ((360 - azDeg + 90) % 360) * Math.PI / 180, zen = (90 - altDeg) * Math.PI / 180;
  const g = (x: number, y: number) => h[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = g(x-1,y-1), b = g(x,y-1), c = g(x+1,y-1), d = g(x-1,y), f = g(x+1,y), gg = g(x-1,y+1), hh = g(x,y+1), i = g(x+1,y+1);
    const dzdx = ((c + 2*f + i) - (a + 2*d + gg)) / (8 * cellM) * z, dzdy = ((gg + 2*hh + i) - (a + 2*b + c)) / (8 * cellM) * z;
    const slope = Math.atan(Math.hypot(dzdx, dzdy)), aspect = Math.atan2(dzdy, -dzdx);
    out[y * W + x] = Math.max(0, Math.cos(zen) * Math.cos(slope) + Math.sin(zen) * Math.sin(slope) * Math.cos(az - aspect));
  }
  return out;
}
// Prototype blend: 0.75 × (315°, 45°) + 0.25 × (270°, 55°) → single-channel 8-bit → sharp().avif({quality:50}) / .webp({quality:75})
```
**"How to render the poster" (ROADMAP research item), resolved:** compute the shading numerically in the build script and encode with sharp. Rejected alternatives: a headless-WebGL 3D render (GPU-dependent and non-deterministic, heavy CI) and GDAL `gdaldem hillshade` (not installed, native toolchain). Emit **greyscale** shading; Phase 9 tints it with tokens (for example as a luminance mask over `surface` colours). Note for Phase 9: a CSS mask is **not an LCP candidate**, whereas `<img>`/`next/image` is. That is a Phase 9 decision, so Phase 8 only ships both formats at 1100² (native, ~10 m/px) and 640². The Imhof look (aerial perspective: more contrast at altitude, grey midtone for flat ground) is a tunable blend. Plan a visual review checkpoint with Tim on the rendered poster.

### 5. Schemas (zod 4.4.3 behaviour verified)
```ts
// data/schemas.ts — imports only 'zod' so Node type-stripping can load it from scripts.
import { z } from 'zod';
const NaiveLocal = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);   // z.iso.datetime({local:true}) accepts 'Z'
export const Capture = z.discriminatedUnion('precision', [
  z.strictObject({ precision: z.literal('second'), local: NaiveLocal, timeZone: z.literal('Europe/Zurich'),
                   offset: z.enum(['+01:00', '+02:00']), source: z.literal('exif') }),
  z.strictObject({ precision: z.literal('year'), year: z.number().int().min(1950).max(2100), source: z.literal('Tim') }),
]);
const Coord4 = z.number().refine((v) => Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-6, 'max 4 decimals (DATA-06)');
export const Position = z.strictObject({
  lat: Coord4, lon: Coord4, source: z.enum(['exif', 'hand-placed']),
  approximate: z.boolean(), reason: z.string().min(1).optional(), radiusM: z.number().positive().optional(),
}).refine((p) => !p.approximate || (p.reason && p.radiusM), 'approximate positions need reason + radiusM (DATA-04)');
export const Elevation = z.discriminatedUnion('source', [
  z.strictObject({ source: z.literal('dem'), m: z.number().int() }),               // derived, never hand-typed
  z.strictObject({ source: z.literal('official'), m: z.number().int(), ref: z.string().url() }), // e.g. 4478
]);
export const DemoCommand = z.strictObject({
  input: z.string(), output: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']), riskScore: z.number().min(0).max(1), // required (D-22)
  warning: z.string().optional(), explanation: z.string().optional(),
});
```
The riskLevel enum matches the existing union `riskLevel?: 'low' | 'medium' | 'high' | 'critical';` [VERIFIED: data/types.ts:56]. The project discriminator uses the real slugs `slug: 'clix-cli'` and `slug: 'clix-website'` [VERIFIED: data/projects.ts:5, 106]. ARCHITECTURE §6's `'cli-x'`/`'webshop'` are wrong for this repo.

### 6. Trail grade (pure; bands from today's data)
```ts
// lib/trail-grade.ts. Bands quoted from data/projects.ts:63:
// riskLevels: ['Low (0.0-0.3)', 'Medium (0.3-0.6)', 'High (0.6-0.8)', 'Critical (0.8-1.0)']
export const RISK_BANDS = [
  { level: 'low', min: 0.0, max: 0.3, grade: 'T1', marker: 'yellow' },
  { level: 'medium', min: 0.3, max: 0.6, grade: 'T2–T3', marker: 'white-red-white' },
  { level: 'high', min: 0.6, max: 0.8, grade: 'T4–T5', marker: 'white-blue-white' },
  { level: 'critical', min: 0.8, max: 1.0, grade: 'T6', marker: 'unmarked' },
] as const;
// Boundary rule is [min, max) except critical [0.8, 1.0] — ASSUMED, confirm with Tim at the riskScore checkpoint.
```
The test asserts that every demo command's `riskScore` falls in its `riskLevel` band, and that the bands are contiguous from 0 to 1. Phase 11 adds the colour tokens (07-UI-SPEC: trail colours live outside `--color-*`). This module carries no token names.

### 7. Served-image guard (scope and rules)
```js
// scripts/guards/check-served-images.mjs — runs in `npm run lint`; sharp is a devDep that CI installs.
// Scope: every git-tracked image (git ls-files '*.jpg' '*.jpeg' '*.png' '*.webp' '*.avif' '*.tif*' '*.heic'),
//        which also catches originals committed anywhere, not only under public/.
// Fail if: md.exif || md.xmp || md.iptc            (any metadata, not only GPS IFD 0x8825)
//          public/ raster with max(width,height) > 2560        (D-13; legacy -large is 2400 → passes)
//          md.orientation set                       (served files must be pre-rotated)
//          public/terrain|images/photos file not matching name.<10 hex>.ext, or hash ≠ sha256(bytes)
//          manifest entry missing on disk, or a file on disk missing from the manifest (orphan)
//          generated SVG contains <script, on\w+=, or href=
// Exemptions: e2e/**/*-snapshots/*.png (Playwright screenshots; still metadata-scanned, size-exempt).
```
Measured this session: all 68 tracked files in `public/images/optimized/` have no EXIF, XMP or IPTC. The 8 full-res files (12480 or 4712 px wide) fail the size rule until they are deleted, so the guard proves D-11.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `prebuild` regenerates variants from committed full-res | Local derivation, committed hashed outputs, `--check` in CI | This phase (D-11) | Vercel builds stop depending on 85 MB of inputs |
| Filename-derived `captureDate` | EXIF naive local + tz + offset; year-precision union | This phase | Fixes 2022-02-01 / 2022-07-29 errors |
| `Record<string, HighlightValue>` | zod discriminated union on `slug` | This phase | Typed per project |
| swissALTIRegio 2024 attribution (EU-DEM) | "2025 and all subsequent versions" string (DGM1 Baden-Württemberg) | swisstopo page | Use the 2025+ string |

**Deprecated/outdated:** `scripts/optimize-images.mjs` (replaced by `build-derivatives.mjs`); `optimization-manifest.json` (replaced by `data/generated/image-manifest.ts`); `components/ContourBackground.tsx` (fake contours; dead, Phase 12).

## Attribution String (D-15): verbatim, pending Tim

The text was fetched raw with `curl` from https://www.swisstopo.admin.ch/en/height-model-swissaltiregio on 2026-10-24, with HTML tags stripped by script. Section "Terms of use": "A reference to the source is mandatory. In the case of digital or analogue representations and publications, as well as in the case of dissemination, the following source references must be attached in any case:"

> For the 2025 and all subsequent versions:
> Bundesamt für Landestopografie swisstopo; Tarquini S., I. Isola, M. Favalli, A. Battistini, G. Dotta (2023). TINITALY, a digital elevation model of Italy with a 10 meters cell size (Version 1.1). Istituto Nazionale di Geofisica e Vulcanologia (INGV). https://doi.org/10.13127/tinitaly/1.1; DGM Österreich, geoland.at; DGM1, Bayerische Vermessungsverwaltung – www.geodaten.bayern.de; DGM1, Baden-Württemberg: LGL, www.lgl-bw.de, dl-de/by-2-0”; RGEAlti, Institut National de l’information géographique et forestière, données originales tétéchargées sur https://geoservices.ign.fr/rgealti#telechargement5m, mise à jour du juillet 2023

[CITED: swisstopo.admin.ch/en/height-model-swissaltiregio] This matches the 08-UI-SPEC transcription, including the source's own typo "tétéchargées" and the stray "”". The page's Sources list names, for the D-14 extent, "Switzerland and Principality of Liechtenstein: swissALTI3D, most current version" and "Italy: TINITALY". That supports UI-SPEC Option B as an interpretation, which remains **Tim's call**. The executor copies the string from the live page into `site.attribution.terrain` (typed as a required `string`).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | sharp/libvips PNG and lossy AVIF/WebP bytes are not guaranteed identical across OS/CPU, so `--check` compares decoded pixels or the hash-vs-filename only | Pattern 3 | If they are in fact stable, the design is merely conservative; if checks compared bytes, CI would flake |
| A2 | `vector-effect: non-scaling-stroke` keeps 1 CSS px strokes inside an SVG used as a CSS mask in Firefox and WebKit (Chromium 156 render looked right this session, not measured rigorously) | UI-SPEC band | Lines too thin or thick in one engine; catch in visual review |
| A3 | The trail-grade mapping low→T1 yellow, medium→T2–T3 white-red-white, high→T4–T5 white-blue-white, critical→T6 unmarked (web sources: SAC marking-to-grade mapping is "fuzzy") | Code Example 6 | Phase 11 labels wrong; low cost to change (one module) |
| A4 | Risk band boundaries are half-open `[min, max)` | Code Example 6 | A score of exactly 0.3/0.6/0.8 validates into the wrong band |
| A5 | Meteorological seasons (Sep = autumn) are the season rule | Discretion | Tim may prefer astronomical; shown in copy review |
| A6 | Vercel applies `next.config.ts` `headers()` to `public/` files (the existing `/images` rule implies it; not probed against a live URL) | Caching | `/terrain` not immutable; verify on a preview with `curl -I` |
| A7 | sharp converts away from non-sRGB input ICC by default; mitigated by asserting sRGB input | Pitfall 3 | Colour shift on a future non-sRGB original |
| A8 | Committing a 2 MB crop of swissALTIRegio is covered by "may be used, distributed and made accessible" with attribution | Terrain source | Licence wording read this session supports it; low risk |

## Open Questions

1. **Extent (D-14, costly to reverse).** Prototyped with LV95 `[2616000, 1088000, 2627000, 1099000]`, whole-km snapped, 11 × 11 km, 21.48 m/px at 512². The summit is 1.05 km from the W edge, the Riffelsee 1.9 km from the E edge, the Zermatt photos about 3 km from the N edge, and there are 3.7 km of Italian slope south of the summit. Recommendation: use it, and have Tim confirm at plan review (alternative: shift 500 m east to put Zermatt nearer the NE corner).
2. **Riffelsee pin (D-02, discretion).** On the north shore, the east half gives the longest line of sight over the water towards the Matterhorn (azimuth from lake to summit ≈ 264°). Recommendation: **45.9837 N, 7.7623 E** (LV95 2'625'080 / 1'092'506), `radiusM: 100`, `approximate: true`, with the reason "Film scan without GPS; Riffelsee identified by Tim; pin hand-placed on the north shore". Alternatives: shore midpoint 45.9836 N 7.7619 E, or north-east corner 45.9837 N 7.7627 E. Tim confirms in the copy review.
3. **Attribution: Option A (full string) or B (CH + IT sources only), and whether to add "©".** This is a Tim checkpoint (UI-SPEC defaults 1 and 2).
4. **"Last surveyed" source.** The STAC COG item has `datetime: 2026-05-28` and `updated: 2026-06-01`. The swisstopo news "swissALTIRegio Update June 2026" was published on 2026-06-25 and integrated new data only for BL, BS, BE and SO (not Valais). The UI-SPEC example "June 2026" is illustrative. Recommendation: derive `dem.edition` from the STAC `datetime` (machine-readable, giving "May 2026") and record the COG multihash checksum `1220E1CA…6527E5` in `source.json`. Tim may prefer the published edition month.
5. **Heightmap units.** Decimetres (352 KB / 93 KB) vs metres (195 KB / 60 KB). Recommend decimetres with `heightScale` in the metadata; Phase 9 can switch by regenerating, with no code change.
6. **v1 alias codemod gap.** Every alias has an L2 semantic token on the same primitive (zero-diff map below) **except `frost-600` → `--glacier-500`**: 9 uses in `app/(site)/page.tsx`, `ProjectCard.tsx`, `Hero3DMountain.tsx` and dead files. Options: (a) add L2 `--color-accent-strong: var(--glacier-500)` (no text pair, so the contrast guard is unaffected unless used as text); (b) map to `accent` (visible gradient change, re-baseline). Recommend (a). Mapping: alpine-950/900 → `surface` (bg) / `ink-inverse` (text); alpine-800 → `surface-raised`; alpine-700 → `surface-overlay`; alpine-600 → `line`; granite-* and snow-200 → `ink-muted`; snow-50/100 → `ink`; frost-500/400 → `accent`; frost-300 → `accent-hover`; ember-* → `caution`; pine-* → `success`; rust-* → `danger`; `font-heading` → `font-display` [VERIFIED: app/globals.css:49, 62-79, 93-127]. With `@theme inline` the compiled declarations are identical (same `var(--primitive)`), and CI visual must show 0 changed PNGs. Afterwards, widen the palette guard's `v1names` rule from shell files to all files except `LEGACY_DEAD_FILES` and the alias definitions.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | all scripts (type-stripping) | ✓ | v24.21.0 local; CI `.node-version` 24 | — |
| npm | installs | ✓ | 11.6.1 | — |
| sharp | encode, scan | ✓ | 0.35.5 | — |
| Network to data.geo.admin.ch (STAC + COG range) | `terrain:fetch` (local only) | ✓ (verified this session) | — | Committed source raster means CI never needs it |
| Originals | `photos:exif`, `photos:derive` | ✓ at `public/images/landscapes/` (4 files, read-only attribute) | — | None. Tim's machine only (D-09); move them in this phase |
| gh CLI | visual re-baseline dispatch | ✓ | 2.102.0 | Browser dispatch (defaults to main; avoid) |
| Playwright + Chromium | e2e, visual | ✓ | 1.64.0 / Chromium 156 | — |
| GDAL | — | ✗ | — | Not needed (geotiff + JS) |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 (next/jest, jsdom) + Playwright 1.64 + node guard scripts with `selftest.mjs` |
| Config file | `jest.config.js`, `playwright.config.ts`, `scripts/guards/selftest.mjs` |
| Quick run command | `npx jest lib data components/site --silent` |
| Full suite command | `npm run lint && npm run type-check && npm test && npx playwright test --project=chromium` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | geo conversions within 1 m of the REFRAME oracles; UV of the summit ≈ (0.0953, 0.6661) | unit | `npx jest lib/__tests__/geo.test.ts` | ❌ Wave 0 |
| DATA-01 | open contour runs never contain a border segment; path rounding to 0.5 | unit | `npx jest lib/__tests__/contour-paths.test.ts` | ❌ Wave 0 |
| DATA-01 | terrain outputs re-derive from the committed source; hashes match filenames; heightmap 16-bit grey, 512/256 | guard | `node scripts/terrain/build-terrain.mjs --check` | ❌ Wave 0 |
| DATA-01 | terrain metadata module is client-safe (no fs/d3 import, only scalars and strings) | unit | `npx jest data/__tests__/terrain.test.ts` | ❌ Wave 0 |
| DATA-02 | sidecar → photos.ts regenerates identically; local run re-hashes originals | guard | `node scripts/photos/build-photo-data.mjs --check` (+ `extract-exif.mjs --check` locally) | ❌ Wave 0 |
| DATA-02 | photos.ts parses with zod; captures match D-04; offsets `+02:00` | unit | `npx jest data/__tests__/photos.test.ts` | ❌ Wave 0 |
| DATA-03 | year and season tags derived; no hand-typed year; elevations sourced (`dem`/`official`); no two stories with similarity > threshold (e.g. Jaccard of word trigrams < 0.3) | unit | same file | ❌ Wave 0 |
| DATA-03 | waterfall carries `locationOverride` "Gornerschlucht" with a reason | unit | same file | ❌ Wave 0 |
| DATA-04 | r004-011 `position.approximate === true` with reason and radius; footer renders a dashed tick for it | unit + component | `npx jest components/site/__tests__/SiteFooter.test.tsx` | ❌ Wave 0 |
| DATA-05 | no tracked image has EXIF/XMP/IPTC; served ≤ 2560 px; no orientation tag; hash names | guard + selftest | `node scripts/guards/check-served-images.mjs` / `npm run guard:selftest` | ❌ Wave 0 |
| DATA-05 | full-res URLs return 404; `/terrain/*` returns immutable Cache-Control | e2e (prod) | `PW_PROD=1 npx playwright test e2e/data-privacy.spec.ts --project=chromium` | ❌ Wave 0 |
| DATA-06 | every lat/lon in generated data has at most 4 decimals; sidecar has no > 4 dp numbers in GPS fields | unit | `npx jest data/__tests__/photos.test.ts` | ❌ Wave 0 |
| DATA-07 | projects parse against the union; legacy adapter deep-equals the fixture; riskScore in band | unit | `npx jest data/__tests__/projects.test.ts lib/__tests__/trail-grade.test.ts` | ❌ Wave 0 |
| DATA-08 | every manifest file exists; no component hard-codes `-sm/-md/-lg` (grep test, excluding the legacy bridge) | unit | `npx jest data/__tests__/image-manifest.test.ts` | ❌ Wave 0 |
| SHELL-04 | formatters (LV95 ’ grouping, month names, equidistance), scale-tier fit for extents 10–12 km | unit | `npx jest lib/__tests__/footer-format.test.ts` | ❌ Wave 0 |
| SHELL-04 | footer renders on every route with the attribution constant; 3 focusable elements; band aspect; scale bar true ±1 px | e2e | `npx playwright test e2e/shell.spec.ts --project=chromium` (extended) | ✅ extend |
| SHELL-04 | visual baselines | visual (CI container) | `gh workflow run visual-baselines.yml --ref ci/08-NN -f suite=visual -f update_mode=changed` | ✅ |

### Sampling Rate
- **Per task commit:** the quick Jest run plus the relevant `--check`
- **Per wave merge:** `npm run lint && npm run type-check && npm test`
- **Phase gate:** full suite plus a CI run green on the phase branch (Visual Regression, Lint and Type Check, Unit Tests, E2E). Test-count ratchet ≥ 206 and rising.

### Wave 0 Gaps
- [ ] `lib/__tests__/geo.test.ts`, `contour-paths.test.ts`, `hillshade.test.ts` (flat grid → uniform; NW-facing slope brighter than SE), `trail-grade.test.ts`, `footer-format.test.ts`, `photo-format.test.ts`
- [ ] `data/__tests__/photos.test.ts`, `projects.test.ts`, `terrain.test.ts`, `image-manifest.test.ts`
- [ ] `components/site/__tests__/SiteFooter.test.tsx` (new; `SiteChrome.test.tsx` stays unchanged)
- [ ] `scripts/guards/__selftest__/served-images/` fixtures: a JPEG with EXIF GPS, one with XMP only, an oversize file, a bad hash name
- [ ] `e2e/data-privacy.spec.ts` (404 for old full-res URLs, Cache-Control on `/terrain`)
- [ ] npm scripts: `terrain:fetch`, `terrain:build`, `photos:exif`, `photos:build`, `photos:derive`, `data:check` (wired into `lint`)

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | Public static site |
| V5 Input Validation | yes | zod 4 validation of every generated artifact before write; schema test in Jest |
| V6 Cryptography | yes (integrity only) | Node `crypto` sha256 for content hashes and original fingerprints; never hand-rolled |
| V8 Data Protection | **yes (core)** | GPS rounded to 4 dp at extraction; metadata stripped (sharp default; no `withMetadata`); originals gitignored outside `public/`; CI scan |
| V12 Files & Resources | yes | Hashed, generated SVGs scanned for script, event handlers and href; no user uploads |
| V14 Configuration | yes | Immutable cache only for hashed paths; proxy matcher excludes static assets; CSP unchanged for pages |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| EXIF/XMP GPS re-leak via `withMetadata()` or a new export | Information disclosure | Guard fails on any EXIF/XMP/IPTC in any tracked image |
| Original committed by mistake (`git add -f`) | Information disclosure | Guard scans all tracked images, not only `public/`; size limit 2560 px under `public/` |
| Full-res still reachable after deletion (CDN/browser cache) | Information disclosure | Accepted (D-12); new deploys 404; verify on preview |
| Stale or poisoned cached asset | Tampering | Content-hash filenames + immutable; SW cache names rotate per build |
| Malicious SVG served from a same-origin path | Tampering / XSS | Generated only by our script; guard rejects `<script`, `on*=`, `href` |
| Supply chain (new devDeps) | Tampering | Legitimacy OK for all; exact pins; devDeps only; `npm ci` |
| Build-time network dependency | Denial of service | `terrain:fetch` manual; CI and Vercel offline from committed source |

## Plan Decomposition Hints (for the planner)

1. **Wave A, pure foundations (TDD):** `data/schemas.ts`, `lib/geo.ts`, `lib/terrain/*`, `lib/trail-grade.ts`, `lib/photo-format.ts` + footer formatters; ESLint import bans (Pitfall 8).
2. **Wave B, terrain:** install devDeps → `fetch-dem` (commits the source raster + `source.json`) → `build-terrain` + `--check` → `data/generated/terrain.ts`, assets; `next.config` `/terrain` headers, proxy exclusion, SW `/terrain/` cache-first + precache placeholder injected by `inject-build-hash.mjs`. Guard: committed `service-worker.js` still contains its placeholders.
3. **Wave B (parallel), originals and images:** move originals to `assets/photos-original/` + `.gitignore`; `extract-exif` → sidecar; `build-derivatives` (widths 640/1024/1600/2560 × AVIF/WebP + JPEG 1200 for future OG) + manifest; delete the 8 full-res files and the old manifest; `prebuild` change; served-image guard + selftest.
4. **Wave C, data and content:** `build-photo-data` + corrections (Gornerschlucht, Riffelsee pin, 2019 capture) → legacy bridge → **checkpoint: Tim approves copy, slugs, tags, Riffelsee pin** → `photos` re-baseline (Tim commits PNGs). In parallel: projects union + adapter → **checkpoint: Tim supplies riskScores (+ Medium/Critical if available)**. v1 alias codemod (zero-diff; CI visual 0 changed). REQUIREMENTS.md HOME-04 wording "1,617 m". PROJECT.md: record the D-12 history exposure.
5. **Wave D, footer (SHELL-04):** `ContourField` + `SiteFooter` margin per UI-SPEC (consult ui-ux-pro-max) → **checkpoint: Tim confirms the attribution option** (unless resolved at plan review) → all-route re-baseline (Tim commits PNGs).

## Sources

### Primary (HIGH confidence)
- swisstopo STAC API `data.geo.admin.ch/api/stac/v1/collections/ch.swisstopo.swissaltiregio/items/swissaltiregio`: COG URL, `datetime` 2026-05-28, checksum (queried this session)
- swisstopo swissALTIRegio product page (raw HTML via curl): Terms of use, sources, height system LN02, precision 1.5 m, 10 m cells
- swisstopo news "swissALTIRegio Update June 2026" (published 2026-06-25)
- swisstopo REFRAME `geodesy.geo.admin.ch/reframe/wgs84tolv95`: transform oracles; geo.admin.ch SearchServer: Matterhorn, Riffelsee, Schwarzsee gazetteer points
- swissALTI3D 2024 tiles 2624-1092 and 2625-1092 (0.5 m COG): Riffelsee water surface
- Next.js 16.4.2 bundled docs: `proxy.md` (§Matcher, negative matching), `next-config-js/headers.md` (§Cache-Control), `public-folder.md`, `components/image.md` (loader requires Client Components, SVG unoptimized)
- npm registry + `gsd-tools package-legitimacy`: geotiff, d3-contour, simplify-js, exif-reader, fast-png, exifr, exiftool-vendored
- Executed prototypes (scratchpad): `t1-geo.mjs`, `t2-terrain.mjs`, `t3-contours.mjs`, `t4-exif.mjs`, `t5b.mjs`, `t6.mjs`–`t8.mjs`, `t9-mask.cjs` (Chromium 156 mask render)
- Repo files read this session: package.json, proxy.ts, next.config.ts, public/service-worker.js, scripts/optimize-images.mjs, scripts/inject-build-hash.mjs, data/*.ts, components/ProjectHighlights.tsx, components/site/SiteFooter.tsx, app/globals.css, eslint.config.mjs, jest.config.js, tsconfig.json, .github/workflows/ci.yml, scripts/guards/*

### Secondary (MEDIUM confidence)
- SAC hiking scale and trail markings: wikivoyage "Wandern in der Schweiz", OSM wiki `DE:Key:sac_scale` (found via web search)
- .planning/research/STACK.md, ARCHITECTURE.md, PITFALLS.md (milestone research, 2026-10-10)

### Tertiary (LOW confidence)
- Cross-platform byte stability of libvips encoders (A1), not tested on Linux this session

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Registry-verified, legitimacy OK, and every library was executed on real data
- Architecture: HIGH. Repo files were read; the type-stripping import was proven; the Next docs were read
- Pitfalls: HIGH for 1–6 and 9–13 (reproduced or read in code); MEDIUM for 7–8 (reasoned from config and code)

**Research date:** 2026-10-24
**Valid until:** 2026-11-23 (stable domain; recheck the swissALTIRegio edition and the attribution string before shipping)
