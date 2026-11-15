# Phase 16: New Regions & Alps Overview Data - Context

**Gathered:** 2026-11-15
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase turns Tim's new photographs, two new regions and an Alps-wide overview map into committed, privacy-safe build-time data. It covers three requirements:
- **DATA-14:** a photo can carry a coarser location than the 4-decimal default, and a coarse position is flagged wherever it is shown. This lands before the first new original.
- **DATA-13:** more Zermatt photos and two new regions, **Ortler** (IT) and **Saalfelden** (AT), with EXIF facts, DEM heights and metadata-free hashed derivatives through the existing pipeline.
- **DATA-12:** a build-time Alps overview from Copernicus GLO-90 contours, with each region's plate extent as a rectangle and labelled reference summits, within a size budget a spike measures first.

**Scope change from this discussion:** Saalfelden (about 12.85° E) lies outside swissALTIRegio (rectangle to 11.99° E). Its plate comes from **BEV ALS DTM**. That pulls the Austrian half of DATA-F1 into v2.1 and amends DATA-11, DATA-13, the 2026-11-12 footprint decision and this phase's success criteria 2 and 3 (D-09).

The phase changes **no pixels.** The new photos stay off the v2.0 light table (D-15), Home and the footer never change (DATA-09), and the Matterhorn plate stays byte-identical. Region routes, pages, the overview UI and every visible change belong to Phases 17 to 19.

</domain>

<decisions>
## Implementation Decisions

### Location privacy (DATA-14)

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

### Launch regions and intake (DATA-13)

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

### Zermatt growth and the light table

- **D-14: The Zermatt region gets a wider plate only if needed.** Research checks every chosen Zermatt original against the Matterhorn plate (LV95 E 2,616,000–2,627,000, N 1,088,000–1,099,000).
  - **If all fit,** the region keeps the `matterhorn` plate.
  - **If any don't,** add a compact `zermatt` region plate (at most about 20 km) that covers them, and point the region at it. That covers the Monte Rosa side, Unterrothorn, Klein Matterhorn and Täsch, which by approximate coordinates lie outside. Home keeps `matterhorn` byte for byte, as Phase 15 D-03 anticipated (region ≠ plate).
  - The D-15 hash gate of Phase 15 holds either way.
- **D-15: New Zermatt photos stay off the v2.0 light table until Phase 18.** Today the light table, the `/photos/<slug>` pages (`generateStaticParams`), the sitemap and the proxy route set all derive from the Zermatt series (`lib/photos/view-model.ts:390-394`, `lib/photos/routes.ts:31`).
  - Phase 16 pins them to an explicit list of the current four ids, the same pattern as `homeWaypointIds`. New photos of any region are data only.
  - That keeps Phase 16 pixel-neutral, with no PNG commit and no re-baseline, and spares the Carousel and map built for four photos.
  - New photos get their pages with PHOTO-05 in Phase 17. The roadmap's "don't churn the baselines twice" rule is met by churning them once, in Phase 18.
  - The slug sets in `generateStaticParams`, the sitemap, `photoRouteSlugs` (proxy), the saved-pages catalog and the audit gate (VERIFY-05) stay at the four. If `photoRouteSlugs` keeps deriving from every editorial entry, the photo-routes test fails on the first new entry. Pin it to the same list.

### Alps overview (DATA-12)

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

### Carried findings, branch and gates

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` § "Phase 16: New Regions & Alps Overview Data": goal, success criteria (2 and 3 amended for BEV), research list, the Baselines and Inputs-from-Tim notes.
- `.planning/REQUIREMENTS.md`: DATA-12, DATA-13 and DATA-14; DATA-11 and DATA-13 (amended); DATA-F1 (narrowed). Out of Scope: no blending of sources in one plate, no Copernicus for local plates, no Home changes, no URL move.
- `.planning/PROJECT.md` Key Decisions rows dated 2026-11-12 (footprint row revised), 2026-11-14 (photo-map identity and country, Home list) and the A-15-12 row.

### Research (v2.1)
- `.planning/research/STACK.md`:
  - §1.1 footprint (rectangle 4.5157–11.9898° E / 44.8368–48.7855° N, line 533);
  - BEV ALS DTM (lines 16, 34, 92; access pitfalls lines 167–172; sketch line 147; the "outside" path line 505; credit gap line 564);
  - `proj4` (line 43);
  - §1.4 overview prototype (lines 107–120);
  - the GLO-90 notice gap (line 566).
- `.planning/research/PITFALLS.md`: Pitfall 2 "New originals and drone footage" (lines 46–68: aerial altitude, pins near homes, the id rule, the closed sidecar schema) and the "Originals" checklist line (580).
- `.planning/research/SUMMARY.md`: D6 (overview construction), D9 (privacy rules for new material), Phase 4 deliverables (line 133).
- `.planning/research/ARCHITECTURE.md` §1.2 (plate ≠ region), §1.3 (heights), §2.4 (per-plate asset budget).
- `.planning/research/FEATURES.md` lines 87–89: overview as a sheet index, reference landmarks, label collision at 375 px (Phase 18 consumes it).

### Earlier decisions this phase builds on
- `.planning/phases/15-region-plate-data-model/15-CONTEXT.md`:
  - D-01 and D-02 (`photo-map.json`, explicit country);
  - D-03 (region ≠ plate), D-04 (photo outside plate fails);
  - D-10 to D-12 (plate registry, prefixed names, 2D output set), D-15 (Matterhorn hash gate);
  - D-20 to D-23 (telemetry guard).
- `.planning/phases/15-region-plate-data-model/15-REVIEW.md` IN-01 to IN-08, and `15-REVIEW-DISPOSITION.md`, where the rows are written back.

### Code the phase changes
- **Photo data:** `data/photos/photo-map.json`, `data/photos/exif-sidecar.json`, `data/photos/corrections.json` (the Riffelsee `approximate` + `radiusM` pattern), `data/photos/editorial.ts`, `data/schemas/photo.ts` (`Gps`, `Position` and its refinements, `PhotoMapEntry`).
- **Photo scripts:** `scripts/photos/extract-exif.mjs` (`round4` at line 154, GPS at lines 200–202), `scripts/photos/build-photo-data.mjs` (DEM sampling at lines 342–347, `lib/geo.ts` import at line 67), `scripts/photos/build-derivatives.mjs`.
- **Regions and terrain:** `data/regions/regions.json`, `data/terrain/plates.json`, `data/terrain/source/source.json` (the Matterhorn extent), `data/schemas/terrain.ts`, `scripts/terrain/fetch-dem.mjs`, `scripts/terrain/build-terrain.mjs`, `data/generated/terrain.ts` (Matterhorn, byte-identical) and `data/generated/plates.ts` (the per-plate map).
- **Light-table and route sets (D-15):** `lib/photos/view-model.ts` (lines 323–394), `lib/photos/routes.ts` (line 31), `app/(site)/photos/[slug]/page.tsx` (`generateStaticParams`), `app/sitemap.ts`, `lib/saved-pages.ts`, `proxy.ts`.
- **Approximate display (D-01):** `components/home/PinMark.tsx`, `components/photos/ExifStrip.tsx`, `components/photos/MapSheet.tsx`, `components/photos/JustifiedGrid.tsx`. The coarse flag must reach each of them, but no current photo changes.
- `lib/geo.ts` (LV95 approximations; the `proj4` comparison).
- `data/site.ts` `attribution.terrain`: the footer credit is unchanged in Phase 16, and per-source credits are stored with each plate for Phase 18.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`round4` at extraction** (`extract-exif.mjs:154`) is the model for D-01. The same place rounds to the record's level, so the fine value never leaves memory.
- **The Riffelsee position** (`corrections.json`: `approximate: true`, `radiusM: 100`, a reason) and the dashed `PinMark` / "approx." label are the coarse display, already tested in `rail.test.tsx` and `pin-layer-3d.test.tsx`.
- **The plate registry and per-plate build** (Phase 15) take new plates as registry entries. The synthetic fixture plate (Phase 15 D-13) is the pattern for a BEV fixture test with no network access.
- **`homeWaypointIds` → `homePhotos()`** is the pattern for D-15's explicit light-table list.
- **`geotiff` 3.0.5** is already installed for COG range reads (BEV, GLO-90). `d3-contour` and the contour pipeline serve the overview.

### Established Patterns
- Every generator's `--check` mode is the CI staleness gate (`data:check` in `lint`). New fetches commit a 16-bit source per plate, so `--check` re-derives offline.
- Strict Zod schemas in `data/schemas/*.ts` import only `zod`, so the `.mjs` generators can type-strip them.
- Guards prove themselves with selftest fixtures, and synthetic fixtures only: never a real drone or camera file (Phase 15 D-23).
- Tests are rewritten in place, never deleted or skipped (GUARD-03), and test counts only go up.
- A failing rule names the file and the fix ("add a precision to the record for IMG_1234.jpg in data/photos/photo-map.json").

### Integration Points
- **The sidecar is committed.** Whatever extraction writes is public and permanent: lat/lon, `altM`, and `utc` to the tenth of a second. D-01, D-03 and D-04 act at extraction for that reason.
- **Stage 2 samples heights** at the sidecar position (`build-photo-data.mjs:342-347`). For coarse photos it must use the rounded true-spot height from stage 1 instead (D-03).
- **The light table, the photo pages, the sitemap and the proxy** read one Zermatt series today, and `photoRouteSlugs` derives from every editorial entry. D-15 pins all of them to the current four.
- **`proxy.ts`** imports `photoRouteSlugs`. The photo-routes test pins it to `generateStaticParams`' slugs.
- **The D-15 hash test** (Phase 15) pins the whole `public/terrain/` listing. IN-01 scopes it before the first real plate lands.

</code_context>

<specifics>
## Specific Ideas

- Tim's photos come from more areas than launch: Val Gardena / Seceda, Aosta / Cervinia / Gran Paradiso, Lake Como, Lake Garda and Innsbruck / Ötztal (all inside swissALTIRegio). His drone footage also covers Zürich, Airolo and Vättis. The region model should make adding them later a data change.
- The overview reads like swisstopo's sheet index (Blattübersicht): each rectangle is literally the sheet the region opens on (FEATURES line 87).
- Labels stay short ("Grossglockner", not "Großglockner / Glockner"), because at 375 px one pixel is about 2.7 km of the arc.

</specifics>

<deferred>
## Deferred Ideas

- **More regions inside swissALTIRegio:** Val Gardena / Seceda, Aosta / Cervinia / Gran Paradiso, Lake Como, Lake Garda, Innsbruck / Ötztal (Tim has photos), and Zürich, Airolo and Vättis (drone footage). Later milestone, through the same pipeline.
- **Saalfelden drone footage beyond the compact plate** (about 50 km radius): a later wider or neighbouring region.
- **Phase 19 inputs:** Saalfelden drone loops can sit on the Saalfelden region page, and take-off points use D-01's precision levels. Phase 19 picks the clip.
- **Country borders on the overview** stay deferred (REGION-F5).
- **Regions outside every source Phase 16 uses** (Dolomites core, Hohe Tauern) remain DATA-F1, now TINITALY-only for Italy, since BEV and `proj4` arrive here.

</deferred>

---

*Phase: 16-new-regions-alps-overview-data*
*Context gathered: 2026-11-15*
