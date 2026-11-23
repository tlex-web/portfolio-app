# Phase 16: New Regions & Alps Overview Data - Research

**Researched:** 2026-11-22
**Domain:** Build-time geodata (EXIF privacy, swissALTIRegio and BEV ALS DTM plates, Copernicus GLO-90 overview), Zod data contracts, Next.js client-bundle hygiene
**Confidence:** HIGH for the executed measurements (EXIF scan, BEV and GLO-90 range reads, plate budgets, overview sizes, proj4 error). MEDIUM for licence and credit wording. LOW for the summit heights other than Dufourspitze.

> **Privacy (D-12, D-25):** this file holds no photo coordinate, no photo altitude, no grid coordinate of a photo and no "N km from" phrasing. Footprint results are recorded as inside/outside per file. The only coordinates are plate extents on the plate grid, which become public with the plate, and public summit or town anchors. Every scratch script ran outside the repo and printed booleans only.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Location privacy (DATA-14)

- **D-01: Coarse locations use named levels.** A position is `4dp` (today's default, about 10 m), `3dp` (about 100 m) or `2dp` (about 1 km). At 46° N one step of the 3rd decimal is about 111 m north–south and 77 m east–west; the 2nd decimal is about 1.1 km by 0.77 km.
  - Extraction (`scripts/photos/extract-exif.mjs`) rounds each photo to its level **before** the sidecar is written, the way `round4` works today. A finer position is never written to any file.
  - Every display uses the existing approximate treatment: the dashed pin (`PinMark`), the "approx." label and the ExifStrip approx line. The roadmap fixes this: any new treatment goes into Phase 18's UI-SPEC.
  - A coordinate is shown at its own precision. A 3dp photo reads `46.015 N`, never `46.0150 N`, because padding would claim a precision the data doesn't have.
- **D-02: Every `photo-map.json` record states its precision.** There is no default. The four current photos get `4dp`, and extraction fails on a record without a precision, naming the file and the fix.
  - This follows Phase 15 D-02 (explicit country): a forgotten flag would commit a 10 m position permanently.
  - **Reversibility:** one-way per photo. A 4dp position committed for a photo that should have been coarse stays in git history (v2.0 D-12). The planner puts Tim's per-photo precision choice in a `checkpoint:decision` **before** the first commit that writes a new sidecar entry.
- **D-03: A coarse photo's height comes from its true spot, rounded.** Extraction samples the region's plate DEM at the real GPS position, which exists only in memory, and rounds the height: 10 m for `3dp`, 50 m for `2dp` (whole metres for `4dp`, as today, D-17 of v2.0). Only the rounded height and the coarse position are committed.
  - The altitude order (REGION-03) and the altimeter rail (REGION-05) stay honest, and the height reads "approx." with the position.
  - The pin `uv` is computed from the coarse position, so the pin is drawn where the data says.
  - The sidecar's GPS `altM` (the camera's own altitude, to 0.1 m) is not committed for a coarse photo, because it would narrow the coarse cell to one contour line. No consumer reads `altM` today.
- **D-04: An aerial photo shows the ground height, labelled as ground.** The record is marked aerial (for example `kind: 'aerial'` in `photo-map.json`).
  - The aircraft's GPS altitude and DJI's XMP block (relative altitude, gimbal, serial) are never extracted. The aircraft altitude can be evidence of a flight above 120 m or near the Zermatt heliport (PITFALLS Pitfall 2).
  - The photo shows the DEM ground height at its position, labelled as ground (for example "ground 2,410 m"), and sorts by that height like any other photo.
  - An aerial photo still needs its own precision (D-02). A take-off point near a home is the case DATA-14 names.
- **D-05: Telemetry assumption A-15-12 is kept** (Tim, 2026-11-15). The guard has no originals-folder exception: ignored, untracked files under `assets/photos-original/` and `assets/clips-original/` are skipped, and a force-added sidecar there fails. Update the PROJECT.md row from "Pending Tim's review" to accepted.

#### Launch regions and intake (DATA-13)

- **D-06: The two new regions are Ortler (IT) and Saalfelden (AT).** Tim has photos from more areas. Those go to the deferred list and later join through the same photo-map and plate registry.
- **D-07: Ortler is the Italian region,** on the Ortler / Stelvio group (about 10.5° E, 46.5° N), inside swissALTIRegio. Its plate comes from swissALTIRegio like the Matterhorn's: LV95, LN02, the existing fetcher and the credit already shipped.
- **D-08: Saalfelden is the Austrian region,** around Saalfelden am Steinernen Meer (about 12.85° E, 47.43° N). Tim's photos and drone shots were taken there.
- **D-09: Saalfelden's plate comes from BEV ALS DTM 1 m** (Tim chose this over deferring Saalfelden, 2026-11-15). The research path is STACK.md §1.1–1.2 and the BEV sketch:
  - a BEV fetcher with COG range reads through the installed `geotiff` (an 11 km Grossglockner window read in 1.5 s);
  - an EPSG:3035 plate type with its own `crs`, height system (Adriatic, GHA) and edition (the per-tile date) in the plate record;
  - `proj4` as a devDependency for `scripts/` only (STACK pins 2.22.0), so pins transform at build time and plate data stores UV, not CRS coordinates;
  - a BEV credit line under CC BY 4.0. BEV hasn't confirmed its preferred wording (STACK gaps), so research checks data.bev.gv.at and the planner adds a checkpoint before the credit is fixed.
  - **One source per plate** still holds (Out of Scope: no blending). Saalfelden's plate is BEV only, and a window that spans two BEV tiles (same CRS and grid) is a concatenation, not a mosaic.
  - **Amendments, made in this discussion's commit:**
    - REQUIREMENTS DATA-11 and DATA-13 name BEV for Saalfelden;
    - DATA-F1 drops Saalfelden;
    - ROADMAP Phase 16 success criteria 2 and 3 and its research list;
    - the PROJECT.md footprint decision row (2026-11-12) records the revision.
  - **Reversibility:** costly. A second elevation source, a second CRS, `proj4` and a per-source credit spread through the fetch scripts, the plate schema, the photo build and Phase 18's sources page.
- **D-10: Plates stay compact, and photos are curated to fit.** Each new plate is about 10–20 km across, around the main cluster of the region's photos, close to the Matterhorn plate's 11 × 11 km.
  - A photo outside its region's plate is not in that series. This is Phase 15 D-04, which fails the build, so curation happens in `photo-map.json`. Such photos can seed a later region.
  - Every sheet keeps the local-survey scale and the per-plate budget (about 0.55 MB served, research §2.4).
  - Tim's Saalfelden drone footage spans about 50 km. Only what fits the compact plate is in the series.
- **D-11: New plates are 2D, as Phase 15 D-12 set:** `hero` and `strip` contours plus the hillshade posters, no `map` LOD, no heightmaps (`threeD: false`). Files are named `<plate>-<asset>.<hash>.<ext>`, flat in `public/terrain/` (D-11 of Phase 15). The plate ids are `ortler` and `saalfelden`, plus `zermatt` only under D-14.
- **D-12: The originals arrive before planning,** as edited JPEG exports like the current four (Lightroom `-Enhanced` JPEGs with GPS kept). Tim copies them into the gitignored `assets/photos-original/` before `/gsd-plan-phase 16`, so research can size each plate from the real spread.
  - **Privacy rule for every agent:** no photo coordinates go into any committed planning file (RESEARCH, PLAN, SUMMARY, VERIFICATION, logs). Only plate extents may be recorded, rounded to the plate grid; those extents become public with the plate anyway. A footprint check records "inside / outside plate X" per photo id, never a position.
  - No new decoder is needed. Extraction still reads `.jpg/.jpeg` only.
- **D-13: Names are common English, one name each.** The regions are `Zermatt`, `Ortler` and `Saalfelden`, with ids `zermatt`, `ortler` and `saalfelden`. Summits are named as in D-18.
  - **Reversibility:** costly. A region id becomes a public URL segment when Phase 17 ships region pages; until then it is internal (Phase 15 D-03).

#### Zermatt growth and the light table

- **D-14: The Zermatt region gets a wider plate only if needed.** Research checks every chosen Zermatt original against the Matterhorn plate (LV95 E 2,616,000–2,627,000, N 1,088,000–1,099,000).
  - **If all fit,** the region keeps the `matterhorn` plate.
  - **If any don't,** add a compact `zermatt` region plate (at most about 20 km) that covers them, and point the region at it. That covers the Monte Rosa side, Unterrothorn, Klein Matterhorn and Täsch, which by approximate coordinates lie outside. Home keeps `matterhorn` byte for byte, as Phase 15 D-03 anticipated (region ≠ plate).
  - The D-15 hash gate of Phase 15 holds either way.
- **D-15: New Zermatt photos stay off the v2.0 light table until Phase 18.** Today the light table, the `/photos/<slug>` pages (`generateStaticParams`), the sitemap and the proxy route set all derive from the Zermatt series (`lib/photos/view-model.ts:390-394`, `lib/photos/routes.ts:31`).
  - Phase 16 pins them to an explicit list of the current four ids, the same pattern as `homeWaypointIds`. New photos of any region are data only.
  - That keeps Phase 16 pixel-neutral, with no PNG commit and no re-baseline, and spares the Carousel and map built for four photos.
  - New photos get their pages with PHOTO-05 in Phase 17. The roadmap's "don't churn the baselines twice" rule is met by churning them once, in Phase 18.
  - The slug sets in `generateStaticParams`, the sitemap, `photoRouteSlugs` (proxy), the saved-pages catalog and the audit gate (VERIFY-05) stay at the four. If `photoRouteSlugs` keeps deriving from every editorial entry, the photo-routes test fails on the first new entry. Pin it to the same list.

#### Alps overview (DATA-12)

- **D-16: The overview covers the whole Alpine arc,** about 5–17° E by 43–49° N as prototyped (72 GLO-90 tiles, STACK §1.4). The regions sit at about 7.75° E (Zermatt), 10.5° E (Ortler) and 12.85° E (Saalfelden). Later regions never re-crop the sheet, so the overview isn't re-baselined per region.
- **D-17: Each region's plate extent is drawn as a rectangle** in the overview's projection. A plate in LV95 or EPSG:3035 projects to a slight quadrilateral in plate carrée. The spike decides whether to draw the projected outline or its bounding box (Claude's discretion).
- **D-18: Reference summits are the highest per country:** Mont Blanc (FR/IT), Dufourspitze / Monte Rosa (CH), Grossglockner (AT, written `ss`), Zugspitze (DE), with Triglav (SI) as an optional fifth if the spike shows room.
  - Each record carries its name, position, official height with its source, and country.
  - Grossglockner is about 40 km from the Saalfelden pin and Dufourspitze about 10 km from Zermatt. Phase 18 places labels at build time and handles those neighbours; Phase 16 only delivers the data.
  - Country borders stay deferred (REGION-F5), so the summits carry the orientation.
- **D-19: Contours come first, and the spike decides the hillshade.** The overview ships GLO-90 contours, the plate rectangles and the summits. The spike measures an optional hillshade (AVIF and WebP, like the local posters) and adds it only if it fits the budget it fixes and reads clearly at 375 px.
- **D-20: The spike fixes projection, interval, smoothing, ring filtering and the size budget before the build is written** (success criterion 4).
  - **Starting points (STACK):** plate carrée scaled by cos 46.5°; unsmoothed 1,000 m contours measured 43 KB brotli and 500 m contours 102 KB.
  - **Earlier targets disagree:** ≤ 30 KB br (STACK), ≤ 150 KB (PITFALLS), ≤ 250 KB served (ARCHITECTURE).
  - **LAEA:** `proj4` now arrives for BEV anyway (D-09), so LAEA (EPSG:3035) costs no new dependency. Use it only if the overview must be measurable.
- **D-21: The Copernicus GLO-90 notice is copied verbatim** for Phase 18's sources page: the WorldDEM-90 wording plus the liability sentence, confirmed from the licence (STACK confirmed only the WorldDEM-30 text). The overview's source record stores it, like each plate's credit.

#### Carried findings, branch and gates

- **D-22: Fix all eight Phase 15 info findings, each pixel-neutral.** Write them back in `15-REVIEW-DISPOSITION.md` with SHAs, following the 14-07 write-back precedent.
  - **IN-01:** scope the D-15 test to unprefixed names. This must land with the first real second plate.
  - **IN-02:** update the `scripts/README.md` generator table to the post-Phase-15 inputs.
  - **IN-03:** stop the cross-engine browser-Back row duplicating the Chromium-only row.
  - **IN-04:** list the package the Jest globals declaration imports types from.
  - **IN-05:** fail on a plate's `strip.centreN` outside its extent instead of clamping it.
  - **IN-06:** stop non-home poster parameters depending on `terrain.ts`.
  - **IN-07:** make "every photo is in exactly one known region" a real test.
  - **IN-08:** remove the impossible-state `height || 0` in `navHeightPx`.
- **D-23: Phase 16 runs on `gsd/phase-16-new-regions-alps-overview-data`,** cut from the Phase 15 tip `f258fbe`. It is stacked while PR #148 (Phase 14) is open and Phase 15 is unshipped. Merges are merge commits only, so each PR's diff shrinks to its own phase as the earlier ones merge.
- **D-24: Standing push approval for `ci/16-*`** (Tim, 2026-11-15, "Standing approval, ci/16-* (Recommended)").
  - **Covered:** plain pushes of new `ci/16-*` branches, fast-forward fix pushes, and reading back their CI runs.
  - **Not covered:**
    - force pushes;
    - pushing the phase branch or `main`;
    - any visual-baselines dispatch, since none is expected; on a visual diff, stop and ask;
    - PNG commits, which stay Tim's.
- **D-25: Acceptance gates.**
  - Every visual baseline is unchanged: Visual Regression passes with no updates on a `ci/16-*` push, and `check-snapshot-commit --none` passes.
  - `data:check` and the served-image guard are green.
  - `terrain:build --check` stays deterministic, and the Matterhorn hashes equal Phase 15 D-15's.
  - `npm run type-check` passes on all three configs.
  - No photo coordinate appears in a committed planning file (D-12).
  - The phase declares no PNG set.
- **D-26: ROADMAP Phase 16 gets `**UI hint**: no`.** Nothing visible changes, and the wave UI gate token-sniffs roadmap prose otherwise (memory; `d16d15b` precedent). This discussion's commit adds the line.

### Claude's Discretion

- **Schema shapes:** precision, aerial and region facts in `photo-map.json`, `regions.json` and `plates.json`. The region registry's strict schema grows here (Phase 15 D-03). It may add fields Phase 18 needs, such as a country and a short facts block, if they are data, not copy.
- **The aerial safety net:** for example, extraction fails when EXIF `Make` is DJI and the record isn't marked aerial. Lightroom exports keep `Make`.
- **How extraction samples the plate DEM** at the true spot (D-03): stage 1 reads the plate source, or it hands a rounded height to stage 2. The rule is fixed (only the rounded height is committed); the mechanics are not.
- **`radiusM` and reason per precision level**, so the existing `Position` refinement (approximate ⇒ reason + radius) holds for coarse EXIF positions.
- **Whether LV95 plates also move to `proj4`,** or keep `lib/geo.ts`. Research measures the error at the Ortler pins (2–3 m was measured at Seceda and Innsbruck, 0.15 m at Zermatt), and `proj4` replaces `lib/geo.ts` for LV95 only if the error requires it.
- **Editorial copy** (titles, alt text, stories, region facts): Claude may draft from Tim's notes. No visitor sees it in Phase 16, but Tim approves all copy at a checkpoint before it is committed as final (precedent: Phase 11 D-16).
- **A phase client-JS budget,** like Phase 15's 4,096 B. New photos must not reach client chunks of pages that don't use them; 15-10's editorial leak and its `/* @__PURE__ */` fix are the precedent.
- **The per-plate asset budget test** (research §2.4), extended to BEV plates.
- **Whether to widen the `PhotoId` regex** (Phase 15 discretion). Ids come from `photo-map.json`, so file names no longer constrain them.
- **The fetcher layout:** `fetch-dem.mjs --plate` for swissALTIRegio plates, and a separate `fetch-region-bev.mjs` (STACK sketch) or one fetcher with a source adapter.

### Deferred Ideas (OUT OF SCOPE)

- **More regions inside swissALTIRegio:** Val Gardena / Seceda, Aosta / Cervinia / Gran Paradiso, Lake Como, Lake Garda, Innsbruck / Ötztal (Tim has photos), and Zürich, Airolo and Vättis (drone footage). Later milestone, through the same pipeline.
- **Saalfelden drone footage beyond the compact plate** (about 50 km radius): a later wider or neighbouring region.
- **Phase 19 inputs:** Saalfelden drone loops can sit on the Saalfelden region page, and take-off points use D-01's precision levels. Phase 19 picks the clip.
- **Country borders on the overview** stay deferred (REGION-F5).
- **Regions outside every source Phase 16 uses** (Dolomites core, Hohe Tauern) remain DATA-F1, now TINITALY-only for Italy, since BEV and `proj4` arrive here.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-12 | A build-time Alps overview map is generated from Copernicus GLO-90 contours, with each region's plate extent drawn as a rectangle and 3–5 labelled reference summits, within a size budget measured before it is fixed | GLO-90 access verified: 71 of 72 tiles present, N43 E014 absent as sea (§ Overview). A pre-spike calibration with 3×3 blur and ring filtering measured 13–17 KB brotli for 1,000 m contours (§ Overview spike). The verbatim GLO-90 notice and liability sentence were copied from the licence (§ Licences). Summit data: § Reference summits |
| DATA-13 | More Zermatt photos and two new regions, Ortler (inside swissALTIRegio) and Saalfelden (outside it, on BEV ALS DTM), with EXIF facts, DEM heights and metadata-free hashed derivatives through the existing pipeline | Footprint check per file (§ Footprint): the 3 new Zermatt files fit the Matterhorn plate, so no `zermatt` plate is needed. **No new file is in Ortler.** The Saalfelden files are in BEV tile N2700000E4500000, but the German corner is nodata, so either a hole-free 12 km plate with the two drone stills or a 15 km plate with 1.3 % nodata. Plate budgets were measured with the repo's own terrain code (§ Plate budgets) |
| DATA-14 | A photo or clip can carry a coarser location than the 4-decimal default, and a coarse or approximate position is flagged wherever it is shown | `approximate: true` + `reason` + `radiusM` already flows to PinMark, MapSheet, ExifStrip and every "approx." label (§ Pattern 1). New: a required `precision` on photo-map records and positions, extraction-time rounding, an `altM: null` rule for coarse and aerial photos, a stage-1 rounded DEM height, and `formatCoordinates` at the photo's own precision |
</phase_requirements>

## Summary

The originals scan changes the plan in three places. **(1) No new original is in the Ortler region.** Six of the seven new files carry GPS. Three fit the Matterhorn plate (Zermatt) and three fall in Saalfelden. The seventh, `20210912_193833.jpg` (Samsung S20, September 2021), has no GPS and no location hint in its XMP. So Ortler either gets that photo with a hand-placed approximate pin (Tim must say where it was taken), gets new originals, or is deferred. This is a blocking `checkpoint:decision` before any Ortler plan. **(2) No compact square BEV plate holds all three Saalfelden photos without nodata.** BEV covers Austria only, and the north-east of the cluster's square runs into Bavaria (Berchtesgaden), where every BEV edition is nodata. A hole-free 12 km plate holds the two DJI stills (it contains Saalfelden town), or a 15 km plate holds all three with 1.3 % nodata in its German corner. The second option needs nodata support in `build-terrain`, because `fetch-dem` fails on any nodata today and d3-contour rings every nodata hole. **(3) The client-JS budget will break unless the footer's import graph is slimmed.** `SiteFooter` renders inside `app/global-error.tsx`, so `data/generated/photos.ts` (every photo) and `data/generated/plates.ts` (every plate) already ship in two client chunks. Each new photo adds about 1.1 KB and each new 2D plate about 1.7 KB. Phase 16's data would add roughly 9–11 KB, against a 4,096 B phase budget.

The rest of the stack is confirmed by execution. The installed `geotiff` 3.0.5 range-reads BEV's 2025 edition (`Stichtag 15.09.2025`, Float32 COG, LZW + float predictor, 512 px tiles, 8 overviews, nodata −9999). The BEV server drops connections under geotiff's many small requests: 17 retries in one run, all recovered by a bounded retry wrapper, so the fetcher needs one. BEV's tile metadata declares the vertical reference **EPSG:9274 "EVRF2000 Austria height"**, not GHA as D-09 assumed; the plate record should store what BEV declares (checkpoint). `lib/geo.ts` is within 0.56 m of `proj4` across a 12 km Ortler plate, so LV95 plates keep `lib/geo.ts`. `proj4@2.22.0` is the right pin, with its `wkt-parser` dependency held back by an `overrides` entry. GLO-90 contours with a 3×3 blur, simplify 1.5–2 px and an 8–12 px ring filter measured 13–17 KB brotli (50–65 KB raw), well inside STACK's 30 KB target.

The D-15 light-table pin is mechanical but touches every slug consumer, including `photoRouteSlugs`, which needs the same `/* @__PURE__ */` treatment. The privacy work (D-01 to D-04) mostly reuses existing machinery: a coarse EXIF position is simply `approximate: true` with a per-level `reason` and `radiusM`, which every display already renders as approximate. The new parts are a required `precision` field, extraction-time rounding, `altM: null` for coarse and aerial photos, and a rounded true-spot height computed in stage 1.

**Primary recommendation:** Open with a decision checkpoint covering the Ortler photo, the Saalfelden plate option (A: hole-free 12 km with the 2 DJI stills, recommended; B: 15 km with nodata support), the per-photo precision and ids, and the BEV height system and credit. Then land the privacy rules, the D-15 pin, the IN fixes and the footer client-bundle split, all pixel-neutral, before any new sidecar entry, plate or overview is committed.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Coarse rounding, aerial altitude drop, rounded true-spot height | Build scripts (stage 1, `extract-exif.mjs`, local only) | — | The true position exists only in memory here; anything later only sees committed (coarse) data |
| Photo facts, uv and height per plate (incl. EPSG:3035) | Build scripts (stage 2, `build-photo-data.mjs`, CI `--check`) | `lib/geo.ts` (LV95), `proj4` (3035, scripts only) | Pins transform at build time; generated data stores UV, never CRS coordinates (D-09) |
| BEV and swissALTIRegio window fetch | Manual networked scripts (`scripts/terrain/fetch-*.mjs`) | — | Never in CI or prebuild (T-08-09); commits a sha256-pinned 16-bit source |
| Plate contours, posters, budget | `build-terrain.mjs` (one run owns every plate + overview, F15) | `lib/terrain/*` | Deterministic offline derivation; `--check` gate |
| Alps overview (contours, plate outlines, summits) | `build-terrain.mjs` (same run, same stale-file sweep) | new server-only generated module | Must share the sweep or its files get deleted; must stay out of the footer's client graph |
| Light-table and route pin (D-15) | Shared lib (`lib/photos/*`) read by Server Components and `proxy.ts` | — | Server-only data paths; `routes.ts` is imported by client components, so it keeps the pure annotation |
| Coarse display (dashed pin, approx., precision-aware coordinates) | Shared format/view-model libs | Components (unchanged markup) | No pixel change for the four current photos |
| Footer data (Home ticks, home plate) | Client bundle (global-error boundary) | — | Today it imports every photo and every plate; must import only Home data |

## Project Constraints (from CLAUDE.md / AGENTS.md / memory)

- **AGENTS.md (repo):** "This is NOT the Next.js you know." Read `node_modules/next/dist/docs/` before writing any Next.js API code, and heed deprecations. Phase 16 adds no new Next.js API. `generateStaticParams` and `dynamicParams = false` are already in use and only their inputs change.
- **Global CLAUDE.md:** present decisions as comparison tables, flag regression risks explicitly, diagnose before fixing, and lead with working examples.
- **Memory (binding project practice):**
  - Install packages through the bundled npm (`node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" install …`). The global npm 11.6.1 rewrites unrelated lockfile metadata. Bundled npm is 11.20.0 `[VERIFIED: executed]`.
  - Stop any `next start` before `npm ci`. After `npm run build`, run `git restore public/service-worker.js`.
  - Push only `ci/16-*` branches (plain, no force). No baseline dispatch. PNG commits are Tim's.
  - Never tell a subagent "Tim approved X" without his literal reply.
  - Search with `git grep`. A recursive grep reaches `.env.local`.
  - `gsd query commit` omits attribution; amend while unpushed.
- **Test discipline (GUARD-03):** tests are rewritten in place, never deleted or skipped, and counts only go up. Selftests use synthetic fixtures only, never a real drone or camera file (15 D-23).
- **Schemas:** `data/schemas/*.ts` import only `zod` and stay erasable TypeScript (Node type-strips them for `.mjs`).
- **Failing rules name the file and the fix.**

## Footprint Check (executed 2026-11-22, booleans only)

Method: a scratch script read each original's EXIF in memory. It projected the position with `lib/geo.ts` (LV95) and `proj4@2.22.0` (EPSG:3035), assigned a region by distance to a public anchor (Zermatt village, Ortler summit, Saalfelden town), and printed only booleans and camera facts. `[VERIFIED: executed scan]`

| File | Make / Model | GPS | GPS alt | GPS UTC | OffsetTimeOriginal | XMP (`drone-dji`) | Region | Plate fit |
|------|--------------|-----|---------|---------|--------------------|-------------------|--------|-----------|
| `IMG_0682.jpg` | Canon EOS 6D Mark II | yes | yes | yes (G5 ok, +02:00) | — | no | Zermatt | **inside `matterhorn`** (≥ 1 km margin) |
| `_MG_0680.jpg` | Canon EOS 6D Mark II | yes | yes | yes (G5 ok, +02:00) | — | no | Zermatt | **inside `matterhorn`** (≥ 1 km margin) |
| `20240910_143659.jpg` | samsung Galaxy S23 Ultra | yes | yes | no | +02:00 | no | Zermatt | **inside `matterhorn`** (≥ 1 km margin) |
| `20260916_125705.jpg` | samsung Galaxy S25 Ultra | yes | yes | no | +02:00 | no | Saalfelden | BEV tile N2700000E4500000; has BEV data at its position |
| `dji_fly_20260919_162232_0153_…_photo.jpg` | DJI FC9113 | yes | **yes (aircraft)** | no | +02:00 | **no (Lightroom stripped XMP)** | Saalfelden | BEV tile N2700000E4500000; has BEV data |
| `dji_fly_20260919_163558_0163_…_photo.jpg` | DJI FC9113 | yes | **yes (aircraft)** | no | +02:00 | **no** | Saalfelden | BEV tile N2700000E4500000; has BEV data |
| `20210912_193833.jpg` | samsung SM-G980F (S20) | **no** | no | no | +02:00 | Lightroom XMP, no GPS, no place name | **unknown, no GPS** | — |

Other facts: every original, new and old, is sRGB IEC61966-2.1 (the derivative writer refuses non-sRGB, so all pass). No original carries an EXIF orientation. The largest is 199 MP (16320 × 12240), under sharp's default `limitInputPixels` of 268 MP `[ASSUMED: sharp default]`. Canon and DJI EXIF carry a body serial; the closed sidecar schema never extracts it `[VERIFIED: data/schemas/photo.ts:57-76]`.

**Answers to the research questions:**
- **D-14:** all three new Zermatt photos fit `matterhorn` with ≥ 1 km margin. **No `zermatt` plate is needed**; region `zermatt` keeps plate `matterhorn`.
- **Ortler:** **no photo.** `20210912_193833.jpg` is the only candidate, and it has no position. → Open Question 1.
- **Saalfelden:** all three photos sit in **one** BEV tile, `ALS_DTM_CRS3035RES50000mN2700000E4500000`. No square or rectangular plate (8–20 km sides) holds all three without nodata: the German corner is nodata. → Open Question 2.
- **Aerial:** the two `DJI` files (EXIF `Make` = `DJI`, so the D-04 safety net can key on it). Their EXIF `GPSAltitude` is the aircraft altitude and must not be written.
- **Second-camera / non-Canon files:** the three Samsung files and the two DJI files need explicit ids (PhotoId regex widening).
- **`lib/geo.ts` at the far LV95 pins:** max **0.56 m** versus proj4 over a 13 × 13 grid covering the 12 km Ortler plate, and 0.45 m at the Ortler summit `[VERIFIED: executed]`. Zermatt photos are at 0.15–0.17 m. The 2–3 m STACK figures were Seceda and Innsbruck, farther east and north. **LV95 plates keep `lib/geo.ts`.** (At Saalfelden `lib/geo.ts` is off by about 10 m, so LV95 code must never run on a BEV plate.)

### Recommended plate extents (plate grid only)

| Plate | Source / CRS | Extent | Size | Notes |
|-------|--------------|--------|------|-------|
| `ortler` (if Ortler stays) | swissALTIRegio, EPSG:2056 | W 2,832,000 S 1,150,000 E 2,844,000 N 1,162,000 | 12 × 12 km, 1200² @ 10 m | Centred on the Ortler summit (public anchor), not on any photo. Fully inside the COG; pixel-aligned (window 44700,24200 → 45900,25400) `[VERIFIED: executed read]` |
| `saalfelden` **Option A** (recommended) | BEV ALS DTM, EPSG:3035 | W 4,529,000 S 2,701,000 E 4,541,000 N 2,713,000 | 12 × 12 km, 1200² @ 10 m | **Zero nodata**, one tile, ≥ 1 km from the tile edge. Holds both DJI stills at 4dp, 3dp and 2dp with ≥ 1 km margin, and contains Saalfelden town. Leaves out the S25 photo (seeds a later region, D-10) |
| `saalfelden` Option B | BEV ALS DTM, EPSG:3035 | W 4,523,000 S 2,703,000 E 4,538,000 N 2,718,000 | 15 × 15 km, 1500² @ 10 m | Holds all three photos with ≥ 1 km margin at every precision; **1.3 % nodata** (German corner) → needs nodata support in the fetch, schema, contour and hillshade paths |

## Standard Stack

### Core (already installed unless noted)

| Library / source | Version | Purpose | Why standard |
|---------|---------|---------|--------------|
| `geotiff` | 3.0.5 (devDep) | COG range reads: swissALTIRegio, BEV, GLO-90 | Executed against all three this session `[VERIFIED: executed]` |
| `proj4` | **2.22.0 (add, devDep, exact pin)** | WGS84 ↔ EPSG:3035 for BEV plates (pins, plate-corner outlines on the overview) | D-09 locked. Published 2026-08-31 (82 days old); ESM default import works from `.mjs` `[VERIFIED: executed]` |
| `d3-contour` / `simplify-js` | 4.0.3 / 1.2.4 | Plate and overview contours | Existing pipeline; d3-contour treats NaN as below −∞ `[VERIFIED: node_modules/d3-contour/dist/d3-contour.js:249-258]` |
| `sharp` | ^0.35.5 | grey16 PNG sources, posters, derivatives | Existing |
| `exif-reader` | 2.0.3 | EXIF in stage 1 | Existing |
| `zod` | ^4.6.7 | All registries and generated-data schemas | Existing |
| `jest-mock` | **30.5.2 (add, devDep, exact)** | IN-04: the type import in `__tests__/jest-globals.d.ts` | Matches jest / `@jest/globals` 30.5.2 `[VERIFIED: node -p versions]` |

### Data sources

| Source | Edition | Access | CRS / heights |
|--------|---------|--------|---------------|
| swissALTIRegio | STAC datetime 2026-05-28 (edition `2026-05`, same checksum `1220E1CADE…` as Matterhorn) `[VERIFIED: STAC GET]` | `https://data.geo.admin.ch/ch.swisstopo.swissaltiregio/swissaltiregio/swissaltiregio_2056_5728.tif` | EPSG:2056 / LN02 |
| BEV ALS DTM 1 m | **Stichtag 15.09.2025** (published 2026-05-19), DOI `10.48677/1d2d42c2-10dc-4be6-9917-8784d1cfe37c` `[VERIFIED: BEV geonetwork search API + record XML]` | `https://data.bev.gv.at/download/ALS/DTM/20250915/ALS_DTM_CRS3035RES50000mN2700000E4500000.tif` (4,449,243,099 B, `Accept-Ranges: bytes`) `[VERIFIED: curl -I]` | EPSG:3035 + **EPSG:9274 "EVRF2000 Austria height"** (record's 2nd `referenceSystemInfo`) `[VERIFIED: record XML; EPSG API]` |
| Copernicus DEM GLO-90 | "Copernicus DEM 2021 release" `[CITED: github.com/awslabs/open-data-registry datasets/copernicus-dem.yaml]` | `https://copernicus-dem-90m.s3.amazonaws.com/<name>/<name>.tif`, `name = Copernicus_DSM_COG_30_N{lat:02}_00_E{lon:03}_00_DEM`; sea tiles absent from `tileList.txt` `[VERIFIED: curl]` | EPSG:4326, **PixelIsPoint** (GTRasterTypeGeoKey 2), 1200² px + 2 overviews (600, 300) `[VERIFIED: executed]` |

### Alternatives Considered

| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| `proj4` in `build-photo-data.mjs` | A hand-written LAEA forward formula in `lib/geo.ts` (ARCHITECTURE §2.1) | Zero deps and client-safe, but D-09 locks proj4 for scripts. Use proj4 and pin it with a Jest comparison test |
| Option A Saalfelden plate | Option B (15 km, nodata support) | B keeps the S25 photo but adds a nodata path through fetch, schema, contours and hillshade, plus a 2.5 MB source PNG. A needs no new terrain code path |
| BEV overview level 3 (≈ 8 m) → bilinear to 10 m | Full-res 1 m read + 10×10 mean | Exact cells, but about 144 M floats and hundreds of MB of range reads for 12 km. Overview level 3 read the 30 km test window in 3–5 s |
| `proj4@2.23.0` | — | Published 2026-11-12 (10 days ago): the legitimacy seam flags it `too-new` |

**Installation (bundled npm, exact pins):**
```bash
node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" install --save-dev --save-exact proj4@2.22.0 jest-mock@30.5.2
# package.json "overrides" (precedent: fflate): keep proj4's caret dependency off the 10-day-old wkt-parser 1.9.0
#   "wkt-parser@^1.5.5": "1.5.6"
```

## Package Legitimacy Audit

| Package | Registry | Age (pinned version) | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `proj4` | npm | 2.22.0: 82 days (2026-08-31) | ~2.49 M/wk | github.com/proj4js/proj4js | SUS (`too-new`, about latest 2.23.0 only) | Approved **at 2.22.0 exact**. The flag concerns 2.23.0, not the pinned version |
| `wkt-parser` (transitive) | npm | latest 1.9.0: 10 days | — | (proj4js org) | SUS (`too-new`) | Flagged. Pin via `overrides` to **1.5.6** (2026-07-23, the last release before proj4 2.22.0 shipped) `[ASSUMED: compatible; 2.22.0 declares ^1.5.5]`. Planner adds `checkpoint:human-verify` before the install |
| `mgrs` (transitive) | npm | 1.0.0 | — | — | OK | Approved |
| `jest-mock` | npm | 30.5.2: 65 days | ~94.8 M/wk | github.com/jestjs/jest | OK | Approved |

No package has a `postinstall` (proj4's is `null` per the seam). **Removed (SLOP):** none. **Flagged (SUS):** `wkt-parser`. The planner inserts `checkpoint:human-verify` before installing proj4 and its override.

## Architecture Patterns

### System Architecture Diagram

```
 assets/photos-original/*.jpg (gitignored, local)
        │  stage 1: extract-exif.mjs (local; --check w/o originals in CI)
        │   photo-map.json ──► id, region, country, precision(req), kind(req)
        │   EXIF GPS (memory only) ──► round to precision ─────────────┐
        │   kind=aerial or precision≠4dp ──► altM = null               │
        │   precision≠4dp ──► sample plate DEM at TRUE spot (memory) ──► round 10/50 m ─► gps.groundM
        ▼                                                               │
 data/photos/exif-sidecar.json (committed, coarse only) ◄──────────────┘
        │  stage 2: build-photo-data.mjs (CI --check)
        │   region → plate → source.json.crs
        │     EPSG:2056 → lib/geo wgs84ToLv95 ; EPSG:3035 → proj4
        │   uv (fail if outside [0,1]) ; height = 4dp? bilinear DEM : sidecar groundM
        ▼
 data/generated/photos.ts ──► server: view-model (pinned 4 ids, D-15), regions (Ph 17/18)
                         └──► footer (client, global-error): MUST read a Home-only module

 network (manual) ── fetch-dem --plate ortler (swissALTIRegio COG) ─┐
                 └── fetch-bev --plate saalfelden (BEV COG, retry) ─┼─► data/terrain/plates/<id>/{dem-10m.png, source.json}
                 └── fetch-overview (71 GLO-90 COGs, sea via tileList) ─► data/terrain/overview/{dem.png, source.json}
                                                                    │
                     build-terrain.mjs (ONE run: every plate + overview; union stale sweep; --check)
                                                                    ▼
          public/terrain/<plate>-contours-hero.<h>.svg … , overview-*.<h>.svg|avif|webp
          data/generated/plates.ts (server), data/generated/overview.ts (server), terrain.ts (Home, unchanged)
```

### Recommended Project Structure (delta)

```
data/
├── photos/photo-map.json          # + precision, kind per record (required)
├── regions/regions.json           # + ortler?, saalfelden; + country (Phase 18 data)
├── terrain/
│   ├── plates.json                # + ortler, saalfelden entries (threeD:false, hero+strip)
│   ├── plates/ortler/             # dem-10m.png + source.json (swissALTIRegio variant)
│   ├── plates/saalfelden/         # dem-10m.png + source.json (BEV variant)
│   ├── overview/                  # GLO-90 grid PNG + source.json (tile list, notice)
│   └── overview.json              # spike-fixed params + summits (3–5)
├── generated/overview.ts          # server-only; never imported by the footer graph
scripts/terrain/
├── fetch-dem.mjs                  # --plate <id> (swissALTIRegio), refuses matterhorn w/o explicit flag
├── fetch-bev.mjs                  # BEV adapter (or a source adapter inside one fetcher)
├── fetch-overview.mjs             # GLO-90
└── build-terrain.mjs              # + EPSG:3035 sources + overview artifact
```

### Pattern 1: A coarse position is an approximate EXIF position (reuse, no new display)

**What:** The existing `Position` refinements already require `reason` and `radiusM` when `approximate` is true. Every consumer renders that state: dashed `PinMark` (`components/home/PinMark.tsx:20-62`), the dashed MapSheet pin (`MapSheet.tsx:150`), `'≈ '` plus `'±100 m (approx.)'` in the strip (`lib/photos/view-model.ts:241-247`), and `' approx.'` on altitude labels (`view-model.ts:364`, `lib/ascent/waypoints.ts:174`).
**Verified shape** `[VERIFIED: data/schemas/photo.ts:202-218]`:
```ts
export const Position = z
  .strictObject({
    lat: Coord4,
    lon: Coord4,
    source: z.enum(['exif', 'hand-placed']),
    approximate: z.boolean(),
    reason: z.string().min(1).optional(),
    radiusM: z.number().positive().optional(),
  })
  .refine((p) => !p.approximate || (p.reason !== undefined && p.radiusM !== undefined), …)
  .refine((p) => p.source === 'exif' || p.approximate, …);
```
**Recommended extension** (field names `[ASSUMED]`, planner's call):
```ts
export const Precision = z.enum(['4dp', '3dp', '2dp']);           // D-01
// PhotoMapEntry: + precision: Precision (required, D-02), + kind: z.enum(['ground', 'aerial']) (required, recommended)
// Position: + precision: Precision (required in generated output, so formatCoordinates prints 3 or 2 decimals, D-01)
// buildPosition() for precision ≠ '4dp':
//   { lat, lon, precision, source: 'exif', approximate: true,
//     reason: 'Position rounded to about 100 m (3 decimals) for privacy', radiusM: 100 }   // 3dp
//   { …, reason: 'Position rounded to about 1 km (2 decimals) for privacy',  radiusM: 1000 }  // 2dp
```
A 3dp cell at 46° N is 111 × 77 m (half-diagonal about 68 m) and a 2dp cell 1.1 × 0.77 km (half-diagonal about 680 m), so ±100 m and ±1 km are honest upper bounds. These numbers come from D-01's figures. **The four current records get `precision: '4dp'` and `kind: 'ground'`**, and their rendering must not change: `formatCoordinates` still prints 4 decimals for `4dp`.

### Pattern 2: Stage 1 owns everything that needs the true position

The extraction order for each photo with GPS:
1. `lat`/`lon` → round to the record's level (`round4`/`round3`/`round2`).
2. `altM` → `null` when `kind === 'aerial'` or `precision !== '4dp'` (D-03, D-04); otherwise `round1` as today.
3. When `precision !== '4dp'`, sample the photo's **plate** DEM at the unrounded position, round to 10 m (3dp) or 50 m (2dp), and write a new `gps.groundM`. Stage 2 uses `groundM` instead of re-sampling. A 4dp photo keeps today's stage-2 bilinear sample, so the four current photos' heights stay byte-identical.
4. Fail when `Make` is `DJI` (case-insensitive) and `kind !== 'aerial'`. The DJI files' `Make` is exactly `DJI` `[VERIFIED: scan]`.
5. Fail, naming file and fix, when a record has no `precision` (D-02). The schema already enforces this if the field is required.

Consequence: stage 1 now reads `regions.json`, `plates.json` and the plate's committed source, but only for coarse photos. A plate must be fetched before its coarse photos are extracted, and `photos:exif --check` with originals present goes stale when a plate source changes. Document this in `scripts/README.md` with IN-02.

### Pattern 3: One `TerrainSource` union, Matterhorn's variant untouched

`TerrainSource` today is one strict object with `product: z.literal('swissALTIRegio')`, `crs: z.literal('EPSG:2056')`, `heightSystem: z.literal('LN02')`, `file: z.literal('dem-10m.png')` and `edition` as `YYYY-MM` `[VERIFIED: data/schemas/terrain.ts:36,43-71]`. Recommended: `z.discriminatedUnion('product', [SwissAltiRegioSource /* unchanged */, BevAlsDtmSource])`. The new variant (field names `[ASSUMED]`):
```ts
const BevAlsDtmSource = z.strictObject({
  product: z.literal('BEV ALS DTM'),
  tiles: z.array(z.strictObject({ url: z.url({ protocol: /^https$/ }), contentLength: z.number().int().positive(),
                                   lastModified: z.string() })).min(1),   // concatenation of same-grid tiles only
  doi: z.string(), metadataUrl: z.url(),
  edition: Edition,                      // '2025-09' from Stichtag 15.09.2025
  editionSource: z.string().min(1),      // the geonetwork record / DOI
  crs: z.literal('EPSG:3035'),
  heightSystem: z.literal('EVRF2000-AT'),// what the BEV record declares (EPSG:9274); checkpoint vs D-09's "GHA"
  resampling: z.literal('bilinear, overview level 3 (~8 m) to 10 m cell centres'),
  extent: Lv95Bbox /* rename to GridBbox: same integer-box shape */, cellM, width, height, heightScale,
  file: z.literal('dem-10m.png'), sha256: Sha256,
}).refine(/* width*cellM === extent width, as today */);
```
`PlateSheet` needs the same split. `crs: z.literal('EPSG:2056')` and `dem.product: z.literal('swissALTIRegio')` at `terrain.ts:314,321` become unions. The extent key is the decision point: keep `extent.lv95` for EPSG:2056 sheets, so Matterhorn's `plates.ts` and `SheetLegend.tsx:44` (`formatExtentLines(sheet.extent.lv95)`) stay unchanged, and add `extent.laea` for EPSG:3035 sheets. `SheetLegend` then narrows on `crs`, because the plate-id union no longer guarantees `.lv95`. That is a `tsc` fallout to plan.

### Pattern 4: Pin the light table to an explicit id list (D-15)

- New `lightTableIds` (four ids, `as const satisfies readonly PhotoId[]`) in a module importable by both `view-model.ts` and `routes.ts` (for example `data/light-table.ts`, mirroring `data/home.ts`).
- `buildPhotoViews` default input: the generated photos filtered by `lightTableIds`. `LIGHT_TABLE_REGION`, `view-model.ts:326`, is then superseded or kept only as a documented check that all four are `zermatt`.
- `photoRouteSlugs` (`routes.ts:31`): `/* @__PURE__ */ lightTableIds.map((id) => editorial[id].slug)`. Keep the annotation, which is pinned by `photo-routes.test.ts:60`.
- Everything else follows `photoViews`/`photoSlugs` automatically: `generateStaticParams` (`app/(site)/photos/[slug]/page.tsx:25-27`), `app/sitemap.ts:19`, the saved-pages catalog (`app/(site)/offline/page.tsx:28`), the audit gate (from the sitemap), `e2e/og.spec.ts`, `e2e/seo.spec.ts`, `e2e/not-found.spec.ts`, `lib/__tests__/proxy.test.ts`.
- Tests that pin the four and must stay green: `lib/__tests__/photos-view-model.test.ts:38`, `lib/__tests__/region-series.test.ts` (rewrite in place: inject a **zermatt** photo outside the list and prove it stays off), `photo-routes.test.ts` (set equality), `audit-routes.test.ts:83-89`, `saved-pages.test.ts`, `SavedPages.test.tsx`.
- Tests that pin the **total** photo set and will need rewriting in place when new photos land: `data/__tests__/photos.test.ts:55-57` ("holds the four photos sorted by id"), `exif-sidecar.test.ts:38` ("the four are distinct"), `photo-map.test.ts:81-86` (D-02 loop). Count-only-up holds as long as they are reworded, not deleted.

### Pattern 5: Keep new data out of the footer's client chunk (client-JS budget)

**Measured** on the 2026-11-15 `.next` build: the full photo facts (`id:"img-0629",region:"zermatt",…`) and the full `plates` map (`matterhorn:{id:"matterhorn",…}`) appear in two client chunks, `.next/static/chunks/0xwzq7o15iqtl.js` and `2qv_6-dghvxq2.js` (about 43 KB each) `[VERIFIED: grep of build output]`. The cause is in `lib/ascent/home-photos.ts`'s own JSDoc: "The footer renders inside the client-rendered app/global-error.tsx, so whatever it imports ships in a client chunk." That module imports all of `data/generated/photos.ts`. `ContourField`/`SheetLegend` import all of `data/generated/plates.ts`.

| Addition | Size per item (JSON) | × chunks | Phase 16 estimate |
|----------|------------|----------|-------------------|
| Photo record | 531–617 B (measured for the current four) | 2 | 5–6 photos ≈ 5.5–7.4 KB |
| 2D plate sheet | ≈ 845 B (Matterhorn sheet minus heightmap/map) | 2 | 2 plates ≈ 3.4 KB |
| Budget | | | **4,096 B** (Phase 15 method: sum of `.next/static/chunks/**/*.js`) |

Fix direction (planner chooses): generate a Home-only module, for example `data/generated/home-photos.ts` written by `photos:build` from a JSON id list shared with `data/home.ts`. Feed the footer's `ContourField`/`SheetLegend` the home plate sheet from a home-only module, not the whole `plates` map. Measure the phase base first (15-01 method), then after each data-adding plan. Overview data goes in its own server-only module, never `terrain.ts` or `plates.ts`.

### Pattern 6: BEV fetch (executed shape)

```js
// Verified 2026-11-22 against the 20250915 edition with geotiff 3.0.5 (scratch, not repo code)
const origFetch = globalThis.fetch;                       // BEV drops sockets under many small ranges:
globalThis.fetch = async (u, o) => {                      // 17 retries in one run, all recovered
  for (let a = 0; ; a++) { try { return await origFetch(u, o); }
    catch (e) { if (a >= 4) throw e; await new Promise((r) => setTimeout(r, 500 * (a + 1))); } } };
const tiff = await fromUrl(url);
const full = await tiff.getImage(0);          // 50001 x 50001, origin [4499999.5, 2750000.5], res 1 m, PixelIsArea
const ov = await tiff.getImage(3);            // overview: NO geotransform; scale = full width / ov width
const s = full.getWidth() / ov.getWidth();    // 8.0002 m (2025 edition); 7.9989 m (2024): editions differ
const [ox, oy] = full.getOrigin();
const win = [(W - ox) / s, (oy - N) / s, (E - ox) / s, (oy - S) / s].map(Math.round);
const [band] = await ov.readRasters({ window: win, samples: [0] });   // Float32Array, nodata -9999
// fail on ANY value <= -9000 (nodata) unless the plate explicitly supports nodata (Option B)
// then bilinear-sample band at each 10 m cell centre (E + 5, N - 5 …) → Uint16 decimetres → grey16 PNG
```
The full-image metadata is Compression 5 (LZW), Predictor 3 (floating point), SampleFormat 3, 512² tiles and 9 images `[VERIFIED: executed]`. Prefer a fetch wrapper or option passed to geotiff over patching the global `fetch` in repo code, and keep the retry bounded with a failure message that names the tile.

### Pattern 7: Overview built inside `build-terrain.mjs`

The stale-file sweep deletes every `public/terrain/` name matching `MANAGED` that the run did not produce `[VERIFIED: scripts/terrain/build-terrain.mjs:158-159]`:
```js
const MANAGED =
  /^(?:[a-z]+(?:-[a-z]+)*-)?(contours-[a-z0-9-]+\.[^.]+\.svg|heightmap-[0-9]+\.[^.]+\.png|hillshade-[0-9]+\.[^.]+\.(avif|webp))$/;
```
An overview file named like `overview-contours-alps.<hash>.svg` matches. A separate overview script would therefore have its files swept by the next `terrain:build`. Build the overview in the same run, or deliberately exclude its stem. Reserve `overview` so no plate can take that id (the `ASSET_STEMS` pattern at `terrain.ts:201`). The guard's `HASH_NAME` (`/^[a-z0-9-]+\.([0-9a-f]{10})\.(png|svg|avif|webp|jpg|mp4)$/`, `check-served-images.mjs:102`), the `next.config.ts` `/terrain/:path*` headers, the service worker's `/terrain/` cache-first rule and the proxy matcher all accept flat `/terrain/` names already.

### Anti-Patterns to Avoid

- **Running `npm run terrain:fetch` with no flag.** Today it rewrites the Matterhorn source (`fetch-dem.mjs:44-47,176-182`). The edition is unchanged today (same STAC checksum), but any future swisstopo update would break D-15. Require `--plate <id>`.
- **Projecting a BEV photo with `wgs84ToLv95`.** It runs without error and is off by about 10 m at Saalfelden. Dispatch on `source.crs`.
- **Printing photo uv or positions in errors.** `build-photo-data.mjs:341-343` prints uv to 3 decimals, and CI logs on a public repo plus a public plate extent reveal about 11 m. For stage 1 (true position) never print a position or uv. For stage 2, consider dropping the uv from the message.
- **Adding per-source credits or overview data to `plates.ts`/`terrain.ts`.** Both ship to the client via the footer (Pattern 5). Keep credits server-side.
- **Summit `elevation: { kind: 'summit' }` annotations on non-Zermatt photos.** `elevationMetres()` always returns `terrain.summit.officialM` (the Matterhorn's 4,478 m) `[VERIFIED: lib/photos/view-model.ts:424-427]`, so an Ortler or Saalfelden hotspot would claim 4,478 m. Use `kind: 'photo'` or plain facts until region landmarks exist.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| WGS84 ↔ EPSG:3035 | A custom LAEA transform in scripts | `proj4@2.22.0` with the EPSG:3035 def string | D-09 locked; tested library; a Jest test pins agreement |
| LV95 at Ortler | proj4 for LV95 | Keep `lib/geo.ts` | Measured ≤ 0.56 m; positions are rounded to ≥ 10 m anyway |
| COG range reads | Hand-written HTTP range plus TIFF parsing | `geotiff` `fromUrl` + `readRasters({ window })` | Handles LZW + float predictor and overviews (verified) |
| Contours | A custom marching squares | `d3-contour` + existing `lib/terrain/contour-paths.ts` | Determinism and border handling already proven |
| Sea-tile detection | Treating any 404 as sea | GLO-90 `tileList.txt` membership | STACK found network failures masquerading as sea |
| Coarse display | A new "coarse" pin or label | `approximate: true` + `radiusM` + `reason` | Already rendered by every surface; UI changes belong to Phase 18 |

**Key insight:** almost every Phase 16 capability exists. The risky part is the edge cases at the seams: nodata at a national border, an overview stem the sweep deletes, data the footer drags into the client.

## Overview Spike (DATA-12, D-19/D-20)

**Pre-spike calibration (executed 2026-11-22, scratch only):** 71 GLO-90 tiles fetched at overview level 2 (300 px/°) in 12.3 s with 6 in parallel and 0 retries. Mosaic 3600 × 1800, bilinear to **1200 × 872** (plate carrée, x scaled by cos 46.5°), d3-contour, then the repo's `openRuns`/`runToPath`/`contourSvg`, brotli quality 11 `[VERIFIED: executed]`:

| Variant | Raw SVG | Brotli | Gzip |
|---------|---------|--------|------|
| A: no blur, 1,000 m from 1,000 m, simplify 1 px, no ring filter (STACK baseline) | 210,959 B | 48,997 B | 65,966 B |
| B: 3×3 box blur, 1,000 m, simplify 1.5 px, rings ≥ 8 px | 65,158 B | 16,805 B | 22,676 B |
| C: blur, 1,000 m, simplify 2 px, rings ≥ 8 px | 54,121 B | 14,309 B | 19,133 B |
| D: blur, **500 m** from 1,000 m, simplify 1.5 px, rings ≥ 8 px | 108,939 B | 27,705 B | 37,247 B |
| E: blur, 1,000 m, simplify 2 px, rings ≥ 12 px | 50,420 B | 13,280 B | 17,893 B |
| F: blur, 500 m from 1,500 m, simplify 2 px, rings ≥ 12 px | 54,349 B | 13,953 B | 18,861 B |
| Hillshade 1200 × 872 (z = 3): AVIF q50 / WebP q75 | | 71,727 / 118,252 B | |
| Hillshade 750 × 545 (z = 3): AVIF q50 / WebP q75 | | 33,562 / 53,208 B | |

**What the spike task must still decide and record** (in a SPIKE note, then `data/terrain/overview.json`):
1. **Projection:** plate carrée × cos 46.5° (recommended: pins are linear in lat/lon, no proj4 in the photo build) or LAEA. At 1200 px, 1 px ≈ 770 m. Grid convergence makes a 12 km LV95 or EPSG:3035 plate rotate by about 2° (≈ 0.6 px corner offset), so **store each plate's four projected corners in UV** and let Phase 18 draw the polygon. The bounding box differs by under 1 px (D-17).
2. **Grid size** (1200 wide calibrated), **interval** (1,000 m, or 500 m from 1,500 m), **blur**, **simplify tolerance**, **ring filter**, and **`from` level** (contour only from 1,000 or 1,500 m, so the Po plain, Jura and Apennines drop out).
3. **Readability at 375 px** (≈ 3.2 km per px): a visual check by Tim of a rendered sample. Not automatable here.
4. **Hillshade or not** (D-19): the 750 px AVIF is about 34 KB.
5. **Budget:** recommended starting figure from the calibration: **contours ≤ 30,000 B brotli and ≤ 120,000 B raw; overview served total ≤ 250,000 B**. Enforce it in a Jest test like `PLATE_BUDGET`. Brotli at fixed quality is deterministic, so Jest can compute it with `zlib`.
6. **Source commit:** commit the resampled grid as a 16-bit PNG (heights in metres, `heightScale: 1`, sea and negatives clamped to 0) with `source.json` holding the tile list, the release, PixelIsPoint handling and the verbatim notice. `--check` then re-derives offline.

**GLO-90 details:** tile origin is the pixel **centre** (PixelIsPoint; for example tile N43 E009 origin `[9, 44]`). `fetch-dem`'s PixelIsArea check does not apply, so the overview fetcher needs its own half-cell rule. At overview scale the shift is about 0.06 px.

## Plate Budgets (measured with the repo's own terrain code)

The scratch script imported `lib/terrain/contour-paths.ts`, `dem-sample.ts`, `hillshade.ts` and `lib/geo.ts` `stripBbox`. It copied `contourText`/`ringPaths` from `build-terrain.mjs` and the HILLSHADE parameters (lights 315°/45° ×0.75 + 270°/55° ×0.25, AVIF q50, WebP q75) `[VERIFIED: executed]`:

| Plate | Grid | Heights (m) | Source PNG | hero | strip | AVIF 1100 / 640 | WebP 1100 / 640 | Served (≤ 550,000) | Fetched (≤ 250,000) |
|-------|------|-------------|-----------|------|-------|-----------------|-----------------|--------|---------|
| ortler 12 km | 1200² | 1,351.6–3,890.8 | 1,582,704 B | 52,810 B | 22,559 B | 66,069 / 30,474 | 104,160 / 50,702 | **326,774 B** | 141,438 B |
| saalfelden A 12 km | 1200² | 676.1–2,501.1 | 1,477,634 B | 42,692 B | 12,267 B | 84,621 / 33,452 | 133,936 / 54,724 | **361,692 B** | 139,580 B |
| saalfelden B 15 km* | 1500² | 648.6–2,631.7 | 2,500,070 B | 69,668 B | 57,655 B | 103,032 / 39,892 | 177,276 / 69,482 | **517,005 B** | 230,355 B |

\*B was measured with nodata filled by row-nearest values just so the code could run. Real nodata handling changes its contours, and its served total is within 6 % of the cap. All within `PLATE_BUDGET` `[VERIFIED: data/schemas/terrain.ts:404-408 — servedMax3D: 1_048_576, servedMax2D: 550_000, fetchMax: 250_000]`. The existing budget test iterates every sheet (`data/__tests__/plates.test.ts:248-262`), so BEV plates are covered once `PlateSheet` admits them. The ARCHITECTURE target of ≤ 2 MB for the committed source PNG is met by both 12 km plates; B's 2.5 MB is over.

## Licences and Credits

### Copernicus GLO-90 (D-21), verbatim from the licence

Source: "Licence for COP-DEM-GLO-90-F Global 90m Full, Free & Open", Article 6, inside `https://dataspace.copernicus.eu/sites/default/files/media/files/2025-06/copernicus_contributing_mission_data_access_v2_cop_dem_licenses.pdf` (p. 20) `[CITED: downloaded PDF, text-extracted]`. The licence writes "WorldDEM" with a superscript TM, which text extraction renders as "WorldDEMTM". Confirm the glyph by eye when copying.

- **Adapted or modified data (applies: contours are derived):** "produced using Copernicus WorldDEM™-90 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved"
- **Liability sentence (must appear "in a licence or any legal warning or notice"):** "The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM™-90"
- Unmodified notice, for completeness: "© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved."
- Article 6(d) also bars implying endorsement. The Copernicus Data Space COP-DEM page gives the same adapted wording without ™ `[CITED: dataspace.copernicus.eu COP-DEM collection page]`.

### BEV ALS DTM

- The record states only: "Für dieses Produkt gilt die Standardlizenz CC-BY-4.0" (link `https://creativecommons.org/licenses/by/4.0/`) and "Der öffentliche Zugang zu diesem Produkt unterliegt keinen Einschränkungen." `[VERIFIED: BEV geonetwork search API, record fca5f234… and 1d2d42c2…]`. **No preferred credit wording was found** on data.bev.gv.at. The BEV product pages tried returned 404, and a web search found nothing → D-09 checkpoint stands.
- Proposed wording for Tim (`[ASSUMED]`; CC BY 4.0 needs creator, licence and "modified"): "Terrain: ALS DTM, © BEV – Bundesamt für Eich- und Vermessungswesen, CC BY 4.0, modified (doi:10.48677/1d2d42c2-10dc-4be6-9917-8784d1cfe37c)".
- The data is a "Kooperationsprodukt der österreichischen behördlichen Geodatenprovider des Bundes und der Länder". BEV is the publisher.
- "Stichtag = Erstellungsdatum … nicht ident mit dem Aufnahme- bzw. Vermessungsdatum". The edition is a creation date, not a survey date, so label it "edition", never "surveyed" `[VERIFIED: record abstract]`.

## Reference Summits (D-18)

| Summit | Country | Official height | Position (WGS84) | Source status |
|--------|---------|-----------------|------------------|---------------|
| Dufourspitze | CH (IT border) | 4,634 m | 45.9369 N, 7.8668 E; LV95 E 2,633,206 N 1,087,350 | `[VERIFIED: api3.geo.admin.ch SearchServer (gazetteer point) + height service 4634.1 m]`; officialRef in the Matterhorn pattern: `https://map.geo.admin.ch/?lang=en&E=2633206&N=1087350&zoom=10` |
| Mont Blanc | FR / IT | **choose:** 2026 survey 4,807.47 m; 2023 survey 4,805.59 m; IGN map value | ≈ 45.8326 N, 6.8652 E `[ASSUMED]` | Height changes with the snow cap; 2026 value `[CITED: euronews 2026-10-14]`. Pick a national-survey reference (IGN Géoportail) at the checkpoint |
| Grossglockner | AT | 3,798 m | ≈ 47.0745 N, 12.6941 E `[ASSUMED]` | `[ASSUMED]`: confirm with a BEV / Austrian Map reference |
| Zugspitze | DE (AT border) | 2,962 m | ≈ 47.4211 N, 10.9853 E `[ASSUMED]` | `[ASSUMED]`: confirm with LDBV BayernAtlas |
| Triglav (optional 5th) | SI | 2,864 m | ≈ 46.3783 N, 13.8369 E `[ASSUMED]` | `[ASSUMED]`: confirm with GURS / Geopedia |

Only Dufourspitze is verified against an official service. The others are `[ASSUMED]` from secondary sources. Following D-17 of v2.0 ("label summits … with official heights"), Tim confirms each height and `officialRef` URL at the summits checkpoint. Dufourspitze lies about 6 km east of the Matterhorn plate's east edge, consistent with ARCHITECTURE §1.2.

## Carried Findings 15 IN-01..IN-08 (all verified at the current lines)

| ID | File:line | Smallest pixel-neutral fix |
|----|-----------|---------------------------|
| IN-01 | `data/__tests__/terrain.test.ts:254-257` (`toEqual(D15)` on the whole `public/terrain/` listing) | `expect(listing).toEqual(expect.arrayContaining(D15))` and assert the unprefixed managed names equal D15. Keep the exact `terrain.assets` basename check. **Land with or before the first real plate commit.** |
| IN-02 | `scripts/README.md:16-18` | `photos:exif` reads `photo-map.json` (ids, precision, kind) and, for coarse photos, the region's plate source. `photos:build` reads the sidecar, `corrections.json`, `photo-map.json`, `regions.json`, `plates.json` and each plate's source. Add the new fetchers and the overview |
| IN-03 | `e2e/photos-lightbox.spec.ts:826` (`tags: CHROMIUM` = `'@chromium-only @no-win-webkit'`) and `:830` (`'@no-win-webkit'`) | Keep both rows and exclude the cross-engine row from Chromium. Add a tag (for example `@not-chromium`) to `CHROMIUM_INVERT` (`playwright.config.ts:61`, also in prod mode). The unique `file + title` key count is unchanged, so GUARD-03 is safe. Dropping a row instead removes a key |
| IN-04 | `__tests__/jest-globals.d.ts:13` (`import type { ClassLike, FunctionLike, UnknownFunction } from 'jest-mock'`) | `jest-mock@30.5.2` as an exact devDependency (bundled npm) |
| IN-05 | `scripts/terrain/build-terrain.mjs:553` (`stripBbox(extent, plate.strip.centreN, …)` clamps) | In `buildPlate`, throw unless `extent.south < centreN < extent.north`, naming the plate and `data/terrain/plates.json`. Matterhorn's 1,091,673 passes |
| IN-06 | `scripts/terrain/build-terrain.mjs:444-451` (`params: meta?.hillshade` for every plate) | In write mode, throw when `terrain.ts` exists but `committedMeta()` is null ("cannot read data/generated/terrain.ts; refusing to re-encode posters"). This changes no generated shape. Recording params per sheet in `plates.ts` would grow the client chunk (Pattern 5) |
| IN-07 | `data/__tests__/photo-map.test.ts:74-79` | Replace with checks the schema can't make: **every registry region holds ≥ 1 photo** (otherwise `seriesInput` throws), and every photo's generated `uv` lies inside its own region's plate. This becomes meaningful now that there are three regions |
| IN-08 | `components/photos/LightboxDialog.tsx:132` (`return height || 0;`) | `return probe.getBoundingClientRect().height;` (keep the 0 px comment). Measure first, then remove the probe, as today |

Write each fix back to `15-REVIEW-DISPOSITION.md` (rows at lines 18-49 and 62-69) with its SHA.

## Common Pitfalls

### Pitfall 1: Local `data:check` / `npm run lint` is red right now
**What goes wrong:** `npm run photos:exif -- --check` fails with `photos:exif: add a record for 20210912_193833.jpg to data/photos/photo-map.json` `[VERIFIED: executed]`. Extraction lists every `.jpg` in the originals folder (`extract-exif.mjs:127-133`) and the seven new files have no records.
**How to avoid:** the first plan that touches photo data must account for this. Every pre-ingest local gate fails until the records exist. Either move the new originals aside during pre-ingest plans, or add records (with precision chosen) early. Don't "fix" it by committing records before the precision checkpoint (D-02).

### Pitfall 2: BEV nodata at the German border
**What goes wrong:** a square around the Saalfelden cluster runs into Bavaria, where every BEV edition (2024 and 2025 checked) is −9999. The 1 km nodata map shows the diagonal border across the NE of the 30 km test window `[VERIFIED: executed]`.
**How to avoid:** Option A (hole-free extent above) or explicit nodata support. Keep the fetcher's "fail on any nodata" rule for plates that don't opt in.

### Pitfall 3: BEV server drops connections
**What goes wrong:** `TypeError: fetch failed … SocketError: other side closed` mid-read. geotiff lazily issues hundreds of tiny ranges (221–521 requests per window) `[VERIFIED: executed]`.
**How to avoid:** a bounded retry (5 attempts, backoff) around the fetch geotiff uses. On final failure, name the tile and write nothing (fetch-dem's "nothing written" pattern).

### Pitfall 4: Overview files swept by `terrain:build`
See Pattern 7. Build the overview in the same run, or make its stem deliberately unmanaged.

### Pitfall 5: The client-JS budget breaks through the footer
See Pattern 5. Measure the base before the first data-adding plan.

### Pitfall 6: `wkt-parser` drift through proj4's caret range
`proj4@2.22.0` declares `"wkt-parser": "^1.5.5"`, so a fresh install takes 1.9.0, published 2026-11-12 `[VERIFIED: npm view]`. Use the `overrides` pin and a human-verify checkpoint.

### Pitfall 7: Height system mislabelled
D-09 says "Adriatic, GHA". BEV's tile record declares **EPSG:9274 (EVRF2000 Austria height)** `[VERIFIED]`. Record what the source declares, and get Tim's sign-off since it changes a locked detail.

### Pitfall 8: Matterhorn hotspot height on other regions' photos
`elevationMetres()` resolves every `summit` reference to 4,478 m. Draft new editorial annotations without `kind: 'summit'`, or add a region-aware landmark first.

### Pitfall 9: Capture time zone
`Capture.timeZone` is `z.literal('Europe/Zurich')` and the offset check compares against Zurich `[VERIFIED: data/schemas/photo.ts:181-194; build-photo-data.mjs:117,201-207]`. Italy and Austria use the same CET/CEST rules, and all new files carry `+02:00`, which equals the September Zurich offset, so no change is needed. A photo from outside CET would need one.

### Pitfall 10: `posterGrey8` requires square sources
`if (W !== H) throw new Error('the poster needs a square source grid')` (`build-terrain.mjs:366`), and hero contours resample to 512 × 512 (`:531`). Keep plates square.

## Code Examples

### Rounding at the record's level (stage 1)
```js
// Source: extends extract-exif.mjs:154 (round4) and gpsOf() at :190-205
const DECIMALS = { '4dp': 4, '3dp': 3, '2dp': 2 };
const roundTo = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
const HEIGHT_STEP = { '3dp': 10, '2dp': 50 };            // D-03
function gpsOf(g, record, sampleTrueGround /* (lat, lon) => metres, memory only */) {
  const lat = dmsToDecimal(g.GPSLatitude, str(g.GPSLatitudeRef));
  const lon = dmsToDecimal(g.GPSLongitude, str(g.GPSLongitudeRef));
  if (lat === null || lon === null) return null;
  const d = DECIMALS[record.precision];
  const coarse = record.precision !== '4dp';
  const alt = num(g.GPSAltitude);
  return {
    lat: roundTo(lat, d),
    lon: roundTo(lon, d),
    altM: coarse || record.kind === 'aerial' || alt === null ? null : round1(g.GPSAltitudeRef === 1 ? -alt : alt),
    utc: gpsUtc(g.GPSDateStamp, g.GPSTimeStamp),
    ...(coarse ? { groundM: Math.round(sampleTrueGround(lat, lon) / HEIGHT_STEP[record.precision]) * HEIGHT_STEP[record.precision] } : {}),
  };
}
```

### Coordinates at their own precision (D-01)
```ts
// Source: lib/home-format.ts:76-78 today prints fourDecimals(lat)…; precision-aware variant
export function formatCoordinates({ lat, lon }: { lat: number; lon: number }, decimals: 2 | 3 | 4 = 4): string {
  const f = (v: number) => Math.abs(v).toFixed(decimals);
  return `${f(lat)}${NBSP}${lat < 0 ? 'S' : 'N'} ${f(lon)}${NBSP}${lon < 0 ? 'W' : 'E'}`;
}
// The default stays 4, so the four current photos' strings are byte-identical (check fourDecimals' sign handling before swapping).
```

### proj4 for an EPSG:3035 plate (stage 2)
```js
// Source: executed with proj4@2.22.0 (ESM default import works from .mjs)
import proj4 from 'proj4';
proj4.defs('EPSG:3035', '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs');
const toGrid = (crs, { lat, lon }) => {
  if (crs === 'EPSG:2056') return wgs84ToLv95({ lat, lon });                   // lib/geo.ts (≤ 0.56 m at Ortler)
  if (crs === 'EPSG:3035') { const [e, n] = proj4('EPSG:4326', 'EPSG:3035', [lon, lat]); return { e, n }; } // lon, lat order
  throw new Error(`no projection for ${crs}`);
};
// uv = lv95ToUv-style math on the plate's own extent (rename to gridToUv; the formula is CRS-agnostic)
```

## State of the Art

| Old approach | Current approach | When changed | Impact |
|--------------|------------------|--------------|--------|
| Photo id from file-name regex | Explicit `photo-map.json` id (15 D-01) | Phase 15 | DJI/Samsung names need only a record and a widened `PhotoId` regex (4 copies: `photo.ts:58`, `photo.ts:96`, `image-manifest.ts:95`, `image-manifest.test.ts:24`) |
| BEV editions 2019–2024 | **Stichtag 15.09.2025** (published 2026-05-19, 4.45 GB tile vs 6.8 GB before) | 2026-05 | Use the 2025 folder `20250915`; its overview scale is 8.0002 m (2024's is 7.9989 m) |
| One `site.attribution.terrain` string | Per-source credit stored with each plate or overview record (server-side) | Phase 16 | Footer unchanged; Phase 18 renders the credits |

**Deprecated / outdated:** STACK's "BEV origin x.5" holds, and the full image is PixelIsArea with centres on whole metres. STACK's BEV example used `20240915`; the 2025 edition now exists.

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | `wkt-parser@1.5.6` works with `proj4@2.22.0` | Package audit | Install or transform breaks; fallback is no override, accepting 1.9.0 after its two-week age |
| A2 | BEV credit wording proposal | Licences | Wrong credit; D-09 checkpoint covers it |
| A3 | Mont Blanc, Grossglockner, Zugspitze and Triglav heights and positions | Summits | Wrong label on the overview; checkpoint with official refs |
| A4 | sharp's default `limitInputPixels` (268 MP) admits the 199 MP S25 original | Footprint | `photos:derive` fails on that file; set `limitInputPixels` explicitly |
| A5 | Field names (`precision`, `kind`, `groundM`, `BEV ALS DTM`, `EVRF2000-AT`, `extent.laea`) | Patterns | Naming only; planner's choice |
| A6 | Option A is acceptable editorially (S25 photo left out) | Footprint | Tim may prefer B (nodata path) or another extent |
| A7 | The two `.next` chunks carrying photo and plate data are the global-error / error boundaries | Pattern 5 | The fix target could differ; the measurement after the fix is what counts |
| A8 | ±100 m / ±1 km `radiusM` and the reason strings per level | Pattern 1 | Copy only; shown as "±100 m (approx.)" |

## Open Questions (RESOLVED)

Every question below is resolved: Tim answered Q1, Q2 and Q5's height system at plan-phase on 2026-11-22 (16-CONTEXT D-27 to D-29), and the plans carry the rest as blocking checkpoints that run before the work they gate. Each item keeps its original text and ends with its resolution.

1. **Ortler has no photo (blocking).** **RESOLVED by D-27** (Tim: "I'll add Ortler originals"): option (b). Ortler stays in Phase 16 with the summit-centred default plate; 16-16 Task 1 is the `checkpoint:human-action` where Tim copies GPS-tagged Ortler exports, and 16-16 Task 2 runs the booleans-only footprint check. `20210912_193833.jpg` (no GPS) is in no series.
   - Known: none of the six GPS-bearing new files is near Ortler. `20210912_193833.jpg` (Samsung S20, Sept 2021) has no GPS and no place hint.
   - Unclear: whether that photo was taken in Ortler/Stelvio.
   - Recommendation: a `checkpoint:decision` before planning any Ortler work. (a) Tim confirms it is Ortler and supplies a hand-placed approximate position (a `corrections.json` entry, `approximate`, `radiusM`, reason, plus its precision). (b) Tim adds Ortler originals. (c) Ortler is deferred, which amends DATA-13 and success criterion 2. Under (a) the Ortler plate above is a reasonable default.
2. **Saalfelden plate: Option A or B.** A (recommended) is hole-free, adds no new code path, and leaves the S25 photo out. B keeps all three but needs nodata support and is close to the served budget. **RESOLVED by D-28** (Tim: "A: 12 km, no gaps (Recommended)"): Option A, built in 16-12; no nodata path; the S25 photo is in no series.
3. **Precision and kind per photo** (D-02 checkpoint before the first new sidecar write): 5 photos under A, or 6 with the Ortler photo; both DJI stills are `aerial`. **RESOLVED as planned checkpoints:** the 16-08 Task 2 `checkpoint:decision` (the five non-Ortler photos) and the 16-17 Task 2 `checkpoint:decision` (the Ortler photos), each before the first commit that writes a sidecar entry for those photos.
4. **Ids for the new files.** Suggested: `img-0680`, `img-0682`, `sam-20240910-143659`, `sam-20260916-125705`, `sam-20210912-193833`, `dji-20260919-162232`, `dji-20260919-163558`. Date-time ids can't collide across flights the way DJI counters can. The id appears in derivative URLs, but the capture date is shown anyway. **RESOLVED as planned checkpoints:** Tim picks each id at the same 16-08 Task 2 and 16-17 Task 2 stops; 16-08 Task 3 widens the photo id pattern to a general lowercase slug, so any slug he picks is valid.
5. **BEV height system and credit:** store `EVRF2000-AT` (EPSG:9274) as BEV declares, or keep D-09's GHA; plus the credit wording. **RESOLVED:** the height system by D-29 (Tim: "EVRF2000-AT (Recommended)"), stored as `heightSystem` with its EPSG code in the BEV source record (16-10, 16-11); the credit wording at the 16-11 Task 2 `checkpoint:decision` (D-09), before the fetcher and the plate record fix it.
6. **Mont Blanc's official figure** and the summit refs. **RESOLVED as a planned checkpoint:** the 16-02 Task 2 `checkpoint:decision`, where Tim fixes Mont Blanc's figure, Triglav yes or no and every summit height and officialRef before 16-13 writes `data/terrain/overview.json`.

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | all scripts | ✓ | 26.13.1 | — |
| Bundled npm | installs | ✓ | 11.20.0 (`C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js`) | — |
| `geotiff` | fetchers | ✓ | 3.0.5 | — |
| `proj4` | BEV pins and outlines | ✗ (to install) | 2.22.0 target | — (D-09 locked) |
| `jest-mock` (direct) | IN-04 | hoisted only | 30.5.2 | derive types from `@jest/globals` |
| Network: data.bev.gv.at | BEV fetch (manual) | ✓ (flaky sockets) | — | retry wrapper |
| Network: copernicus-dem-90m S3 | overview fetch (manual) | ✓ | — | — |
| Network: data.geo.admin.ch | Ortler fetch (manual) | ✓ | — | — |
| Originals in `assets/photos-original/` | stage 1 | ✓ (11 files) | — | — |

No blocking gaps. CI never needs the network, because every fetch commits a 16-bit source.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.5.2 (jsdom default, `@jest-environment node` per data test), Playwright 1.65, guard selftest |
| Config file | `jest.config.js` (`testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)']`), `playwright.config.ts`, `tsconfig.jest.json`, `tsconfig.e2e.json` |
| Quick run command | `npx jest <touched test paths>` + the touched generator `--check` |
| Full suite command | `npm run lint && npm run type-check && npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-14 | photo-map record without `precision` (or `kind`) fails, naming file and fix | unit (schema) | `npx jest data/__tests__/photo-map.test.ts` | ✅ (extend) |
| DATA-14 | 3dp/2dp extraction rounds before write; `altM` null for coarse or aerial; `groundM` rounded 10/50 m; DJI `Make` without `aerial` fails | guard selftest on synthetic JPEGs (`--root`) | `npm run guard:selftest` | ✅ (new cases; generated JPEGs only, 15 D-23) |
| DATA-14 | coarse position → `approximate` + reason + radius; coordinates printed at own precision; four current strings unchanged | unit | `npx jest lib/__tests__/photos-view-model.test.ts lib/__tests__/home-format.test.ts` | ✅ / ❌ Wave 0 (home-format test if absent) |
| DATA-14 | dashed pin and approx. label for a synthetic coarse photo | unit (render) | `npx jest components/home/__tests__ components/photos/__tests__` (`rail.test.tsx`, `pin-layer-3d.test.tsx` patterns) | ✅ |
| DATA-13 | sidecar, derivatives and photo data fresh | generator checks | `npm run photos:exif -- --check && npm run photos:derive -- --check && npm run photos:build -- --check` | ✅ |
| DATA-13 | no metadata in served images | guard | `npm run guard:images` | ✅ |
| DATA-13 | light table, routes, sitemap and catalog stay at four | unit | `npx jest lib/__tests__/region-series.test.ts lib/__tests__/photo-routes.test.ts lib/__tests__/photos-view-model.test.ts lib/__tests__/audit-routes.test.ts lib/__tests__/saved-pages.test.ts` | ✅ (rewrite region-series in place) |
| DATA-13 | each region ≥ 1 photo; each photo's uv inside its plate (IN-07) | unit | `npx jest data/__tests__/photo-map.test.ts` | ✅ |
| DATA-13 / 11 | new plates deterministic; Matterhorn hashes equal D-15; budgets | generator + unit | `npm run terrain:build -- --check && npx jest data/__tests__/plates.test.ts data/__tests__/terrain.test.ts` | ✅ |
| DATA-13 | EPSG:3035 synthetic fixture plate builds with its prefix; Matterhorn bytes unchanged | guard selftest (`--root`, D-13 pattern) | `npm run guard:selftest` | ❌ Wave 0 (new fixture case) |
| DATA-13 | `lib/geo.ts` vs proj4 ≤ 1 m over the Ortler plate; proj4 3035 round trip | unit | `npx jest lib/__tests__/geo-proj.test.ts` | ❌ Wave 0 |
| DATA-12 | overview contours within the spike budget; 3–5 summits; one outline per plate; verbatim notice stored | unit | `npx jest data/__tests__/overview.test.ts` | ❌ Wave 0 |
| DATA-12 | overview deterministic offline | generator | `npm run terrain:build -- --check` | ✅ (extended) |
| all | client JS ≤ base + 4,096 B | build measurement | `npm run build` then sum `.next/static/chunks/**/*.js` (15-01 method); `git restore public/service-worker.js` | manual-scripted |
| all | type-check three configs | tooling | `npm run type-check` | ✅ |
| all | no focus/skip | guard | `npm run guard:tests:scan` | ✅ |
| D-25 | no visual change | CI | push `ci/16-*`: Visual Regression passes without updates; `check-snapshot-commit --none` | ✅ |
| D-25 | no photo coordinate in planning files | local scratch scan (originals → 2/3/4dp strings → `git grep` over `.planning/`), booleans only | manual-scripted, never committed | — |

### Sampling Rate
- **Per task commit:** `npx jest <touched paths>` + `npm run type-check` + the touched `--check` (`photos:*`, `terrain:build`).
- **Per wave merge:** `npm run lint` (includes `guard:selftest`, `data:check`, `guard:images`, `guard:tests:scan`) + `npm test`.
- **Phase gate:** full suite green; a `ci/16-*` push with every job green including Visual Regression (no update); client-JS measurement recorded.

### Wave 0 Gaps
- [ ] `lib/__tests__/geo-proj.test.ts`: proj4 vs `lib/geo.ts` at the Ortler plate corners and summit (≤ 1 m), EPSG:3035 round trip
- [ ] `data/__tests__/overview.test.ts`: budget, summit count, outlines, notice text
- [ ] Guard selftest: synthetic EPSG:3035 fixture plate; synthetic coarse, aerial and DJI-make JPEG extraction cases
- [ ] Client-JS base measurement script or step (15-01 method) at phase start
- [ ] Install: `proj4@2.22.0`, `jest-mock@30.5.2` (bundled npm, `overrides` for `wkt-parser`)

## Security Domain

`security_enforcement` is absent from `.planning/config.json`, so it is treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Strict Zod schemas (`strictObject`) for photo-map, regions, plates, sources and overview; bare-file-name refine; PlateSource path regex |
| V6 Cryptography | no (sha256 integrity only) | Node `crypto` sha256 pins on committed sources |
| V8 Data Protection (privacy) | **yes** | Extraction-time rounding; `altM` null for coarse and aerial; no XMP or serial extraction (closed schema); no coordinates in logs or planning files |
| V14 Configuration / supply chain | yes | Exact pins, `overrides`, legitimacy checkpoint for proj4 / wkt-parser |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Fine GPS committed for a home or take-off spot (unrecallable from git) | Information disclosure | Required `precision`; checkpoint before the first sidecar write; rounding before write |
| Aircraft altitude reveals flight height or no-fly evidence | Information disclosure | `kind: aerial` → `altM: null`; DJI-`Make` safety net |
| Position leaked through CI logs (uv × public extent) | Information disclosure | No position or uv in stage-1 errors; drop uv from stage-2 messages |
| Rounded height + coarse cell narrows the location | Information disclosure | Accepted by D-03 (10/50 m steps); no `altM` |
| Malicious or too-new transitive package | Tampering | proj4 2.22.0 exact; wkt-parser override; human-verify |
| Network data substituted at fetch | Tampering | Manual fetch only; sha256-pinned committed sources; tile URL, size and Last-Modified recorded |
| Telemetry sidecars committed | Information disclosure | Existing DATA-15 guard (unchanged, A-15-12 accepted) |

## Sources

### Primary (HIGH confidence)
- Executed this session: privacy-safe EXIF scan of all 11 originals; BEV 2024/2025 COG reads + nodata map; swissALTIRegio Ortler window read; 71-tile GLO-90 mosaic + contour/hillshade sizing; plate budget measurement with repo code; proj4 vs `lib/geo.ts`; `photos:exif --check`; `.next` chunk grep; `npm view` / legitimacy seam.
- Repo files read this session: `data/schemas/{photo,terrain,region}.ts`, `scripts/photos/{extract-exif,build-photo-data,build-derivatives}.mjs`, `scripts/terrain/{fetch-dem,build-terrain}.mjs`, `lib/geo.ts`, `lib/photos/{view-model,routes}.ts`, `lib/ascent/home-photos.ts`, `data/home.ts`, `data/photos/{photo-map.json,corrections.json,editorial.ts}`, `data/terrain/{plates.json,source/source.json}`, `data/generated/plates.ts`, the tests named above, `playwright.config.ts`, `scripts/guards/test-count.mjs`.
- BEV geonetwork search API (`https://data.bev.gv.at/geonetwork/srv/api/search/records/_search`) and record XML `1d2d42c2-10dc-4be6-9917-8784d1cfe37c`.
- EPSG registry API: `https://apps.epsg.org/api/v1/VerticalCoordRefSystem/9274/`.
- swisstopo: STAC item `ch.swisstopo.swissaltiregio/items/swissaltiregio`; `api3.geo.admin.ch` SearchServer and height service.

### Secondary (MEDIUM confidence)
- Copernicus CCM licences PDF (GLO-90 licence, p. 20): https://dataspace.copernicus.eu/sites/default/files/media/files/2025-06/copernicus_contributing_mission_data_access_v2_cop_dem_licenses.pdf
- GLO-30 licence: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf
- COP-DEM collection page: https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM
- AWS Open Data registry entry: https://github.com/awslabs/open-data-registry/blob/main/datasets/copernicus-dem.yaml
- Mont Blanc 2026 survey: https://www.euronews.com/2026/10/14/mont-blanc-gains-nearly-two-metres-now-stands-at-480747-m

### Tertiary (LOW confidence)
- Summit heights for Grossglockner, Zugspitze and Triglav (encyclopedic search results: https://EN.wikipedia.com/wiki/Dufourspitze, https://Www.Wikipedia.org/wiki/Zugspitze, https://www.alpineexploratory.com/travel/country-high-points.html), to be confirmed against official refs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Every library and source was executed against.
- Architecture: HIGH for seams verified in code (sweep, footer client graph, view-model pin); MEDIUM for proposed schema shapes.
- Pitfalls: HIGH. Each was reproduced or read in code.
- Licences: MEDIUM. GLO-90 is verbatim from the licence PDF text; BEV wording is unconfirmed.
- Summits: LOW except Dufourspitze.

**Research date:** 2026-11-22
**Valid until:** 2026-12-22 for the stack. Recheck the BEV edition and the proj4/wkt-parser ages at install time.
