# Phase 18: Immersive Survey Layout - Context

**Gathered:** 2026-11-24 (two sessions: areas 1–3 in the first, interrupted; area 4 and the CI approval after resuming from `18-DISCUSS-CHECKPOINT.json`)
**Status:** Ready for UI-SPEC, then planning
**Branch:** `gsd/phase-18-immersive-survey-layout`, local, cut from the Phase 17 tip `f90b4d1` (Tim: "New branch from Phase 17 tip (Recommended)"). Merge order: 14 → 15 → 16 → 17 → 18.

<domain>
## Phase Boundary

Visitors browse the Alps survey:
- **Overview:** `/photos` opens on the Alps overview with one pin per region and a synced region list. The Map/Grid/Carousel switch is retired, and old `?view=` URLs land on the matching new page.
- **Region pages:** each region page at `/photos/regions/<id>` (route fixed in Phase 17) replaces the Phase 17 text stand-in. It has a header, region facts, the local plate with photo pins, then the photos as an uncropped, full-width sequence on gallery-black in ascending-altitude order. Each photo has an always-visible data caption, a map collar and a place on the altimeter rail. The page ends with a next-region block.
- **Lightbox:** steps only through the current photo's region and ends on an end-of-series card that links to the next region.
- **Share:** Web Share where it exists, copy link elsewhere, and the button label says which.
- **Coordinates:** LV95 beside WGS84 for Swiss photos.
- **Credits:** every map's sheet margin shows its extent, "last surveyed" date and a short source credit. The footer links to a new `/sources` page with the full credit and licence text of every data source.
- **Baselines:** screenshots for all of the above, taken once (the "churn baselines once, in Phase 18" rule, 16 D-15 / 17 D-10).

Requirements: REGION-01, REGION-02, REGION-03, REGION-04, REGION-05, REGION-06, PHOTO-06, PHOTO-07, PHOTO-08, LBOX-09.

**Not in this phase:**
- **Phase 19:** the drone loop in the region header slot. Phase 18 only reserves the slot.
- **Deferred (REGION-F1..F5):** the overview-to-plate morph, a sticky mini plate, a grid toggle, a lightbox thumbnail index, and country borders.
- **Never changes:** the Home ascent (DATA-09).

**A UI-SPEC is required before planning** (ROADMAP Phase 18 "UI-SPEC" note): `/gsd-ui-phase 18`, using the ui-ux-pro-max skill. The decisions below are inputs to it, not a substitute.

</domain>

<decisions>
## Implementation Decisions

### Overview and old view URLs (session 1)
- **D-01: Regions run west to east:** Zermatt (about 7.75° E), then Ortler (10.5° E), then Saalfelden (12.85° E). That one order drives the region list, the pins' tab order and the next-region chain (D-12, D-14). A new region slots in by longitude.
- **D-02: Each row of the overview's region list shows the region's cover thumbnail plus its data.**
  - The cover is the Phase 17 `cover` in `data/regions/regions.json`.
  - The exact data fields (e.g. country, photo count, altitude range) are a UI-SPEC call.
  - The list stays the keyboard, screen-reader and narrow-screen path, with numbered pins on phones (REGION-01).
- **D-03: `?view=grid` and `?view=carousel` land on the Zermatt region page.**
  - The v2.0 grid and carousel both showed the Zermatt photos, so they land on Zermatt.
  - Tim rejected "every `?view=` goes to /photos". Read literally, `?view=map` (the v2.0 default) and any unknown value stay on `/photos`, which is now the overview that replaces the map view.
  - The redirect status and mechanism (proxy vs page) are for research and the planner. Old links must keep working (PROJECT "Pitfall 8: link previews and redirects").
- **D-04: No overview-rectangle-to-plate morph in this phase.** It stays deferred as REGION-F4.

### Region page and sequence (session 1)
- **D-05: The top of a region page, the header slot Phase 19 fills with a drone loop, shows the region's cover photo for now.**
  - The slot keeps the poster aspect ratio and the pause-control space Phase 19 needs (ROADMAP UI-SPEC note), so Phase 19 swaps media without a layout shift.
- **D-06: The site nav stays fixed while scrolling.** It doesn't hide on scroll down on region pages. This answers the research flag "whether the nav hides on scroll".
- **D-07: The altimeter rail shows from 768 px up. On phones, each photo's caption carries its place in the ascent as "n / N".** There's no slim rail or sticky sheet bar on phones.
- **D-08: Clicking a photo pin on the region's plate scrolls to that photo's figure in the sequence.** It doesn't open the lightbox. Focus handling and reduced-motion scroll behaviour are UI-SPEC calls.
- **D-09: Every photo page's back link goes to its region page, all 11, including the v2.0 four.**
  - The v2.0 four currently link "All photographs" → `/photos`.
  - Phase 18 changes this deliberately, so these four pages lose the byte-identical guarantee they kept in Phase 17 (17 D-07).
  - Links are built with `regionHref`.
- **D-10: Region and photo pages show a visible breadcrumb with a matching `BreadcrumbList` JSON-LD block** (17 discretion item, research FEATURES §5).
  - The JSON-LD lists exactly the visible links.
  - The `lib/__tests__/json-ld.test.ts` assertion "holds no … BreadcrumbList" (lines 47-48 and 813) is rewritten, not deleted.
- **D-11: The last region's next-region block wraps to the first region (Zermatt).** It doesn't send the visitor back to the overview.

### Lightbox, Share, LV95 (session 1)
- **D-12: The end-of-series card is one extra step after the region's last photo.**
  - Stepping forward from the last photo shows the card, which links to the next region (D-01 order, D-11 wrap).
  - The card is not a panel overlaid on the last photo.
  - The v2.0 four now step within Zermatt (seven photos) instead of among themselves (17 D-08 hand-over).
  - The counter and how the card counts in it are UI-SPEC calls.
- **D-13: Share / Copy link appears in two places:** the viewer strip (photo page and lightbox, sharing the photo) and the region header (sharing the region). It is not on each sequence figure. The label says which action it performs (PHOTO-07).
- **D-14: Coordinates by place:**
  - **Map collar:** shows WGS84 for every photo.
  - **Viewer strip:** adds the LV95 line for Swiss photos only (PHOTO-08; LV95 on non-Swiss photos is out of scope).
- **D-15: The LV95 line matches its photo's precision.**
  - A 4dp photo shows LV95 rounded to 10 m (PHOTO-08).
  - A future coarse Swiss photo (3dp or 2dp) shows LV95 rounded to the equivalent grid, so LV95 is never finer than the WGS84 the page shows. This mirrors 17 D-19 for JSON-LD.

### Credits, sources, baselines (session 2)
- **D-16: The footer's "Source" row becomes a short credit plus an "All data sources" link to `/sources`.**
  - Today the Matterhorn sheet legend in every footer prints the full swissALTIRegio string, about 600 characters (`site.attribution.terrain` via `components/terrain/SheetLegend.tsx:103`).
  - The full string moves to `/sources`. The rest of the footer legend (title, scale, equidistance, Extent (LV95), Last surveyed) is unchanged.
  - **Research must confirm** that each licence accepts a credit by link: swisstopo's terms, CC BY 4.0 §3(a)(2) for the fill datasets inside swissALTIRegio and for BEV, and Copernicus GLO-90 Article 6. Where one doesn't, that place carries the required text in full.
  - **Reversibility:** costly. The footer is on every route, so undoing it means another full re-baseline.
- **D-17: Each map's short margin credit links to its own entry on `/sources`** (an anchor such as `/sources#copernicus-glo-90`).
  - **Fallback:** if research finds a licence requires its full notice at the map itself (most likely the GLO-90 notice, which 16 D-21 says must not be shortened), that margin carries the full notice instead of the short credit.
  - **Reversibility:** costly. The anchor ids become link targets from every margin, so they should not be renamed after launch.
- **D-18: "Last surveyed" keeps its v2.0 meaning: the terrain data's edition** (`dem.edition`, `YYYY-MM`, as `SheetLegend` shows it today).
  - Matterhorn May 2026, Ortler May 2026, Saalfelden Sep 2025 (BEV's Stichtag, a creation date), overview "2021" (year only: `source.json` says "Copernicus DEM 2021 release" with no month).
  - Not the photo dates, and not two rows.
- **D-19: The Extent line uses LV95 for the Swiss sheet and WGS84 degrees for the rest.**
  - The Matterhorn sheet keeps "Extent (LV95)", unchanged.
  - Ortler (a swissALTIRegio LV95 plate, but in Italy), Saalfelden (EPSG:3035) and the overview show WGS84. This is the same rule as the photos (D-14).
- **D-20: `/sources` has one anchored entry per data source:** swissALTIRegio, BEV ALS DTM and Copernicus GLO-90. Each entry has:
  - the credit or notice word for word: the `site.attribution.terrain` string; the BEV line with its DOI from `data/terrain/plates/saalfelden/source.json`; and `GLO90_NOTICE` plus `GLO90_LIABILITY` from `data/schemas/overview.ts`;
  - the licence name, linked to its official text (the full legal codes are not copied onto the page);
  - what was done to the data (contours, hillshade, resampling, "modified");
  - links to the maps that use it.

  The page wording goes to Tim at a copy checkpoint before it is fixed (ROADMAP "Inputs from Tim: the sources-page wording"). `/sources` is a new public URL; it was named in the 2026-11-12 Key Decision.
  - **Reversibility:** one-way once indexed. It is linked from every footer and every margin.
- **D-21: Region pages are baselined as fixed viewport shots, not full page.**
  - **Shots:** Zermatt at three positions: the top (header and plate); one photo in its collar with the rail marking it; the end (next-region block). Ortler and Saalfelden get the top shot only.
  - **Settings:** 375 / 768 / 1440 px wide, 900 px high, reduced motion. That is 15 PNGs, captured as new routes with `update_mode=missing`.
  - **Why:** a full-page Zermatt shot would be about 9,000 px tall at 1440 (estimated ~5 MB per PNG; the one-photo page is already 1.06 MB at 1440×1650), and every new photo would force its re-baseline. With fixed positions, adding a photo moves only Zermatt's end shot.
  - Other routes keep their full-page shots.
- **D-22: The `photos-grid` and `photos-carousel` visual entries are rewritten as the new region-page shots, not dropped.**
  - Their `?view=` URLs now redirect (D-03), so an e2e test asserts where each `?view=` value lands.
  - No visual entry disappears without a replacement (PHOTO-06: view tests rewritten, never deleted).

### CI approval (session 2)
- **D-23: Standing approval for `ci/18-*`, including the dispatches plans declare** (Tim, 2026-11-24: "ci/18-* plus declared dispatches (Recommended)").
  - **Covered:** plain pushes of new `ci/18-*` branches, fast-forward fix pushes, reading their CI runs, and each visual-baselines dispatch a plan declares (download and compare included).
  - **Excluded:**
    - force pushes;
    - pushing the phase branch or `main`;
    - PNG commits, which stay Tim's;
    - any undeclared dispatch: an unexpected visual diff stops and asks.
  - This is wider than the 15–17 approvals, which had no dispatch.

### Carried into this phase (roadmap scope notes and earlier hand-overs)
- **D-24: Re-baseline discipline (ROADMAP "Baselines"):**
  - one deliberate re-baseline per cause, each with a declared PNG set: overview, region pages, photo page and lightbox, the footer's sources link on every route, and the sources page;
  - content last;
  - new routes captured with `update_mode=missing`;
  - Tim commits the PNGs;
  - re-run the HOME-08 budget afterwards, since shared chunks may grow.
- **D-25: Phase 13 ledger hand-overs (13-LEDGER-TRIAGE.md):**
  - **10 IN-04 (#33):** the neighbour preload asks for the AVIF set only. Fix it during the LBOX-09 stepping rework.
  - **10 IN-05 (#34):** derive `STAGE_SIZES` / `sizes` from the new layout.
  - **10 IN-08 (#37):** tie each row-height value to its breakpoint in the rewritten view tests, or retire the guard with the grid.
  - **10 IN-09 remainder (#38):** the rewritten view test waits on a positive signal, never the 600 ms `waitForTimeout`.
  - **14 IN-04:** the `STEP` class string in `DemoTerminal.tsx` copies `CarouselControls.tsx`'s `STEP_BUTTON`. It resolves when the Carousel retires; if any copy survives, move it into one shared module.
- **D-26: Watch the E2E duration (17 D-25).** Phase 18 adds routes to the audit gate and the visual suite. If the E2E Tests job would cross about 45 minutes, plan a shard or matrix first.
- **D-27: Retire the v2.0 light-table pins:**
  - `lightTableIds` (`data/light-table.ts`) and the `/photos` header kicker ("4 waypoints · 1,617–2,760 m · Zermatt", 15-CONTEXT) retire with the view switch (16 D-15, 17 D-07).
  - Home's waypoint list (`data/home-waypoints.ts`) is untouched (DATA-09).

### Claude's Discretion
- Redirect mechanism and status code for the `?view=` URLs (D-03), within "old links keep working".
- The breadcrumb's exact segments and separator (D-10), as long as the JSON-LD matches it.
- Short-credit wording per margin (D-16/D-17), drafted for Tim's copy checkpoint (D-20).
- The `/sources` anchor ids (D-17): stable, lowercase and source-named.
- Whether `/sources` joins the saved-pages catalog (`lib/saved-pages.ts`). It joins the sitemap, the audit gate and the visual suite.
- Which photo the Zermatt mid-sequence baseline shot centres on (D-21). It should be chosen from the data, never a literal slug, as the Home ascent shots do.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` § "Phase 18: Immersive Survey Layout": goal, 5 success criteria, the UI-SPEC note (what it must cover), the Research list, Baselines, Inputs from Tim and the Phase 13 scope notes.
- `.planning/REQUIREMENTS.md`: REGION-01..06, PHOTO-06..08, LBOX-09. Also Future Requirements REGION-F1..F5 and the Out of Scope table (no scroll-snap, parallax, Ken Burns or overlays on photos; no social share rows; LV95 only in Switzerland; no runtime tile fetches).
- `.planning/PROJECT.md`: Key Decisions rows of 2026-11-12 (data credits as a margin credit plus `/sources`; JSON-LD without `license`; coarse locations), the visual-baseline rows (baselines only from the CI dispatch, only Tim commits PNGs, the zero-diff exception policy), and the Phase 16/17 rows.

### Prior phase decisions
- `.planning/phases/17-region-routes-seo-structured-data/17-CONTEXT.md`:
  - D-01..D-06: the region path, ids as URL segments, `regionHref`, the neutral 404;
  - D-07..D-10: the v2.0 four identity, no stepping on new pages, back links, no baselines;
  - D-13: `cover`;
  - D-16..D-19: JSON-LD rules and shown-precision coordinates;
  - D-25: E2E duration;
  - the Deferred list, which is Phase 18's hand-over.
- `.planning/phases/16-new-regions-alps-overview-data/16-CONTEXT.md`:
  - D-01..D-04: precision levels, coarse and aerial rules;
  - D-15: the light-table pin and the baseline-once rule;
  - D-16: the overview covers the whole Alpine arc;
  - D-21: the GLO-90 notice is verbatim and never shortened;
  - the BEV credit (D-09; wording fixed at 16-11).
- `.planning/phases/15-region-plate-data-model/15-CONTEXT.md`: plate LODs (hero, strip, hillshade; the strip is each plate's own sheet-margin band, REGION-06), one photo URL builder plus a source scan, the `/photos` header kicker note.
- `.planning/phases/13-repo-safety-test-debt/13-LEDGER-TRIAGE.md` #33, #34, #37, #38: the D-25 hand-overs.
- `.planning/phases/14-ui-fixes-terminal-controls/14-REVIEW-DISPOSITION.md`: 14 IN-04 (D-25).
- `.planning/phases/16-new-regions-alps-overview-data/16-OVERVIEW-SPIKE.md`: the overview variant C (contours, no hillshade), its byte budget, the summits, and the GLO-90 licence text.
- `.planning/phases/16-new-regions-alps-overview-data/16-RESEARCH.md` § Licences and Credits: the BEV and GLO-90 licence findings behind D-16, D-17 and D-20.

### v2.0 design contracts these pages extend
- `.planning/milestones/v2.0-phases/08-data-terrain-pipeline/08-UI-SPEC.md`: the "Footer Map-Sheet Margin Contract" that `SheetLegend` implements (scale, equidistance, extent, last surveyed, source).
- `.planning/milestones/v2.0-phases/10-photography/10-UI-SPEC.md`: the light table, map sheet, lightbox, viewer strip, ExifStrip and stepping that this phase replaces or extends.
- `.planning/milestones/v2.0-phases/09-home-ascent/09-UI-SPEC.md`: the Home altimeter rail and its contrast rules (HOME-10), the pattern for REGION-05's rail.

### Research
- `.planning/research/FEATURES.md`: region-series layout, the collar, the rail, Web Share and copy fallback, BreadcrumbList (§5).
- `.planning/research/PITFALLS.md`: Pitfall 7 (the intercept and the proxy) and Pitfall 8 (link previews and redirects, for D-03).
- `.planning/research/ARCHITECTURE.md`: F7 (the intercept covers every page under `/photos`), anti-pattern 9 (JSON-LD placement).
- `.planning/research/STACK.md`: GLO-90 and swissALTIRegio licence notes.

### Data sources and licence text (D-16, D-17, D-20)
- `data/site.ts` `attribution.terrain`: the verbatim swissALTIRegio string (08 D-15).
- `data/terrain/plates/saalfelden/source.json` `credit`, `licence`, `licenceUrl`, `doi`: the BEV line (Tim's wording, 16-11).
- `data/schemas/overview.ts` `GLO90_NOTICE`, `GLO90_LIABILITY`: verbatim, never altered (16 D-21).
- `data/terrain/source/source.json`, `data/terrain/plates/ortler/source.json`, `data/terrain/overview/source.json`: the editions and releases behind D-18.

### Next.js 16.4.5 bundled docs (AGENTS.md: read before writing Next code)
- `node_modules/next/dist/docs/01-app/02-guides/json-ld.md` (BreadcrumbList, D-10).
- The redirect / proxy and intercepting-route docs under `node_modules/next/dist/docs/01-app/` (D-03, D-12).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`components/terrain/SheetLegend.tsx`:** the sheet-margin legend (scale bar true to the extent with no JS, equidistance, extent, last surveyed, source). It is the base for every map margin (REGION-06). It needs a per-sheet extent grid (D-19), a per-source short credit with a `/sources` link (D-16/D-17), and the year-only edition for the overview (D-18). It reads `site.attribution.terrain` today.
- **`components/terrain/SheetBand.tsx` and `ContourField.tsx`:** the contour strip band and the LOD renderer, which take a plate's sheet as a prop.
- **`components/home/AltimeterRail.tsx`** (`'use client'`): the Home rail. It is the reference for REGION-05's rail (ticks, current marker, HOME-10 contrast). Home must not change (DATA-09), so share or copy without touching Home's output.
- **`components/photos/PhotoViewer.tsx`, `LightboxDialog.tsx`, `ZoomStage.tsx`, `StagePhoto.tsx`, `ExifStrip.tsx`:** the viewer and strip. They get LBOX-09 stepping, the end card (D-12), Share (D-13) and the LV95 line (D-14/D-15).
- **`lib/photos/stepping.ts`:** `slugFromPath`, `RESERVED_PHOTO_SEGMENTS`, `stepIndex`, `swipeStep`. Stepping becomes per region.
- **`lib/photos/view-model.ts`:** photo views, `view.rights`, and precision-aware coordinate formatting (16-06). The source for the LV95 rounding.
- **`lib/photos/label-layout.ts`, `hotspot-layout.ts`, `components/photos/MapSheet.tsx`, `Hotspots.tsx`:** the v2.0 map-label and pin layout (wide and compact tiers, leaders). A starting point for the overview pins and labels at 375 px (a research flag).
- **`lib/photos/routes.ts`:** `photoHref`, `regionHref`. Every link comes from these, and the source scan forbids hand-built paths.
- **`data/regions/regions.json`:** `id`, `name`, `country`, `plate`, `facts`, `cover` (D-02, D-05).
- **`data/generated/plates.ts` and `overview.ts`:** server-only (`SERVER_ONLY_MODULES`, `lib/__tests__/client-graph.test.ts`). Client components get the sheet they need as props, as the footer does with `homePlate`.
- **`components/contact/CopyEmailButton.tsx`:** the site's existing clipboard pattern, for the copy-link fallback (D-13).
- **`lib/json-ld/site.ts`, `lib/json-ld/content.ts`:** JSON-LD builders and `jsonLdHtml`. `BreadcrumbList` goes here (D-10).

### Established Patterns
- **Baselines:** only from the CI `visual-baselines` dispatch; only Tim commits PNGs; threshold 0.01, so `update_mode=changed` is exact; `check-snapshot-commit --allow <slug>` per slug, never `--allow-all`.
- **Visual routes:** `e2e/visual/routes.spec.ts` has the `ROUTES` full-page loop (375/768/1440, 900 px high, reduced motion), viewport-shot blocks (Home ascent positions, lightbox, menu), and canvases hidden via `hide-canvas.css`, never `mask:`. Today there are 49 PNGs.
- **Audit gate:** `e2e/routes.ts` `ROUTES` holds one representative per template (three engines, three widths); `AUDIT_SWEEP` holds every other sitemap path. `/sources` and the redesigned region template need representatives.
- **Neutral 404 and static params:** `proxy.ts` `KNOWN` / `NEUTRAL_SLUG`, `dynamicParams = false` plus `generateStaticParams`. Region pages already follow this (17).
- **Client JS budget:** Phases 15–17 held client JS to the phase base plus 4,096 B (17 ended at 1,853,097 B). The HOME-08 total-keep gate is separate and has about 6.2% headroom (ROADMAP research flag).
- **Copy checkpoints:** Tim approves page wording verbatim at one checkpoint (16-08, 17 D-14). `/sources` follows this (D-20).

### Integration Points
- **`app/(site)/photos/page.tsx`:** reads `?view=` through `parseView` (`lib/photos/view-param.ts`: `VIEWS = map | grid | carousel`, default `map`). It becomes the overview, and `parseView`, `ViewSwitcher`, `JustifiedGrid`, `CarouselView`, `CarouselControls`, `CarouselStepper`, `PhotoCarousel3D` and `TileTransition` retire or are rewritten (PHOTO-06, D-03, D-22).
- **`app/(site)/photos/regions/[region]/page.tsx`:** the Phase 17 text stand-in (D-11 of Phase 17). The designed region page replaces its body and keeps its metadata, JSON-LD, static params and OG card.
- **`app/(site)/photos/[slug]/page.tsx` and `@modal/(.)[slug]/page.tsx`:** back link (D-09), breadcrumb (D-10), stepping (D-12).
- **`components/site/SiteFooter.tsx`:** the Source row and the `/sources` link (D-16). It is on every route, so this is one re-baseline cause by itself.
- **New route `app/(site)/sources/page.tsx`:** must also join `app/sitemap.ts`, `e2e/routes.ts` and the visual `ROUTES`.
- **`e2e/photos.spec.ts`, `photos-sweep.spec.ts`, `photos-carousel.spec.ts`, `photos-lightbox.spec.ts`, `photos-region.spec.ts`:** the view tests PHOTO-06 rewrites, never deletes.
- **`lib/__tests__/json-ld.test.ts`:** the "no BreadcrumbList" assertion (D-10).

</code_context>

<specifics>
## Specific Ideas

- The region page should read as an ascent: header, then the plate, then the photos climbing in altitude, each framed like a map sheet (collar, neatline and ticks outside the image), with the rail marking where you are.
- Credits behave like a printed map: a short credit in each sheet's own margin, the full notices one click away on `/sources`, and the word-for-word texts never paraphrased.
- Tim picked the recommended option on all 23 questions across both sessions.

**Tim-gated inputs still to come (ROADMAP "Inputs from Tim"):**
- UI-SPEC approval (`/gsd-ui-phase 18`, with ui-ux-pro-max);
- the `/sources` wording at a copy checkpoint (D-20);
- the PNG commits for each declared re-baseline (D-24).

The `ci/18-*` push and dispatch approval is already given (D-23).

</specifics>

<deferred>
## Deferred Ideas

- **Overview extent-rectangle → region plate View Transition morph:** stays REGION-F4 (D-04).
- **Already deferred by the requirements, not revisited:**
  - REGION-F1: sticky mini plate;
  - REGION-F2: grid toggle on region pages;
  - REGION-F3: lightbox thumbnail index;
  - REGION-F5: country borders;
  - SEO-F1: image-rights page with `license`.

</deferred>

---

*Phase: 18-immersive-survey-layout*
*Context gathered: 2026-11-24*
