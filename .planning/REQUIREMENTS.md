# Requirements: Portfolio App

**Defined:** 2026-11-12
**Core Value:** A portfolio that is visually memorable and distinctive (not another generic Tailwind site) while being stable and well-maintained under the hood.

## v2.1 Requirements

Requirements for milestone v2.1 Survey Expansion. Each maps to exactly one roadmap phase. IDs continue the v2.0 numbering (`milestones/v2.0-REQUIREMENTS.md`); new categories start at 01.

### Repo Safety

- [ ] **GUARD-07**: A pull request with a failing CI job cannot merge into `main`: one aggregate required check depends on every CI job, and a ruleset on `main` requires it (Tim applies the setting; verified with `gh api` and a deliberately red test PR)
- [ ] **GUARD-08**: Skipped CI cannot slip past the gate: a `[ci skip]` commit or a path-filtered workflow neither leaves a PR's required check pending forever nor reaches production unchecked
- [ ] **GUARD-09**: The contact form's rate limiter is confirmed active in production (the expected Upstash variables are set, and the sixth rapid honeypot submission gets a 429), and production never silently allows every request when the limiter is unconfigured or unreachable
- [ ] **GUARD-10**: Tests, e2e specs and Playwright configs are type-checked by `npm run type-check` with zero errors (from ledger row 07 IN-08, decided at the 13-06 triage; needs Jest type declarations: `@types/jest`, which Tim vets first, or `@jest/globals` imports)
- [x] **DEPS-06**: Playwright is upgraded to 1.65 together with its container image tag in its own commit, re-baselined alone before any intended visual change (closes Dependabot PR #140)

### Test Coverage

- [x] **VERIFY-05**: The production audit gate covers `/projects/coin-flip` and every photo slug (each page template in all three engines, every slug at least once in Chromium), and every new region page joins it when it ships
- [x] **VERIFY-06**: The photo build scripts have the two deferred Phase 10 regression tests: a wrong capture-time offset fails the photo data build (G5), and an invalid source leaves existing derivatives in place with exit code 1 (G6)
- [ ] **VERIFY-07**: Every open review-ledger row from Phases 7, 9, 10 and 12 is triaged: fixed, accepted with a recorded reason, or turned into a requirement
- [x] **CLEAN-01**: Unused code and config are removed: `TILT_CONFIG`, the test-only `cssDuration` and `cssEase`, the unused `next.config` images block, the service-worker `/_next/image` branch, commented CI steps and the `dns-prefetch` to vercel.com

### Shell & UI Fixes

- [ ] **SHELL-07**: Tapping the current page's link in the mobile menu closes the menu
- [ ] **SHELL-08**: Focus rings in the mobile menu are fully visible at 375 px, never clipped at the sides
- [ ] **HOME-09**: Home has no horizontal overflow at 375 px, fixed at the overflowing element (not by hiding overflow on `body` or `main`)
- [ ] **HOME-10**: Every altimeter rail tick label keeps at least 4.5:1 contrast over the live canvas as well as the poster at every breakpoint; the rail scrim covers the full label run (the 2,760 m label measured 4.81:1 at 768 px)
- [ ] **LBOX-08**: After stepping in the lightbox and closing it with Escape, focus returns to the current photo's visible trigger and never lands off-screen, with a regression test

### Data & Terrain

- [ ] **DATA-09**: Adding photos or regions never changes Home: the ascent keeps its four Matterhorn waypoints, the 1,617 m rail start and its footer ticks, read from an explicit Home waypoint list
- [ ] **DATA-10**: Every photo belongs to an explicit region and records its country, in typed, committed data that CI checks for staleness
- [ ] **DATA-11**: The terrain build produces a local plate (contours and hillshade) for every region from swissALTIRegio, stays deterministic under `terrain:build --check`, and keeps the Matterhorn plate's hashed files byte-identical
- [ ] **DATA-12**: A build-time Alps overview map is generated from Copernicus GLO-90 contours, with each region's plate extent drawn as a rectangle and 3–5 labelled reference summits, within a size budget measured before it is fixed
- [ ] **DATA-13**: New photos are published: more Zermatt photos and 1–2 new regions inside the swissALTIRegio footprint, at least one in Italy or Austria, each with EXIF facts, DEM heights and metadata-free hashed derivatives through the existing pipeline
- [ ] **DATA-14**: A photo or clip can carry a coarser location than the 4-decimal default (for example near a home or a drone take-off point), and a coarse or approximate position is flagged wherever it is shown
- [ ] **DATA-15**: The served-asset guard rejects drone sidecars and telemetry anywhere in the repo or the site (`.SRT`, `.LRF`, GPX, KML, and GPS or telemetry tracks inside MP4 files), proven by selftest fixtures

### Region Series

- [ ] **REGION-01**: `/photos` shows the Alps overview map with one pin per region and a synced region list; the list is the keyboard, screen-reader and narrow-screen path, and pins are numbered on phones
- [ ] **REGION-02**: Each region has its own page, on a path that never collides with `/photos/<slug>`, with a header, region facts, its local terrain plate with photo pins, and a next-region block
- [ ] **REGION-03**: A region page shows its photos as an uncropped, full-width sequence on gallery-black, in ascending-altitude order, with always-visible data captions (place, altitude, date, camera facts)
- [ ] **REGION-04**: Each photo in the sequence sits in a map collar, a neatline with coordinate ticks drawn outside the image and never over it
- [ ] **REGION-05**: The region sequence has an altimeter rail that reads it as an ascent and marks the current photo
- [ ] **REGION-06**: Every map (the overview and each local plate) shows its extent, "last surveyed" date and short source credit in its own sheet margin, and the footer links to a sources page with the full credit and licence text of every data source
- [ ] **REGION-07**: Each region page has its own title, description, canonical URL, Open Graph card and sitemap entry

### Photos & Lightbox

- [ ] **PHOTO-05**: Existing `/photos/<slug>` URLs and their Open Graph cards keep working unchanged, and every new photo gets the same deep-linkable page
- [ ] **PHOTO-06**: The v2.0 view switch (Map, Grid, Carousel) is replaced by the overview and the region pages: old `?view=` URLs land on the matching new page, and the view tests are rewritten, never deleted
- [ ] **PHOTO-07**: Visitors can share a photo or a region with the Web Share API where it exists, or copy its link elsewhere; the button's label says which it does (PHOTO-F2)
- [ ] **PHOTO-08**: Swiss photos show LV95 coordinates, rounded to 10 m, next to WGS84; photos outside Switzerland show WGS84 only (PHOTO-F4)
- [ ] **LBOX-09**: The lightbox steps only through the current photo's region and ends on an end-of-series card that links to the next region

### Drone Video

- [ ] **VIDEO-01**: A region page can show one silent drone loop in a fixed slot near its header, poster first, with a visible pause control and no playback under reduced motion or Save-Data; at least one region ships with a loop
- [ ] **VIDEO-02**: Drone loops are served same-origin through the clip pipeline with no location or telemetry metadata, within a per-clip byte budget fixed after encoding one real clip, and a written transfer projection that stays well inside the Vercel Hobby limit
- [ ] **VIDEO-03**: Each drone loop has a text alternative describing what the flight shows

### Engineering & Platform

- [ ] **ENG-06**: The terminal demo has previous and next step buttons and a static transcript in a disclosure that is open by default under reduced motion (ENG-F1)
- [ ] **SEO-04**: Pages carry JSON-LD structured data (Person and WebSite site-wide, ImageObject on photo pages, an image gallery on region pages, the projects on their case studies) with creator, copyright notice and credit text, no `license` property, and no coordinates finer than the precision shown on the page (PLAT-F1)
- [ ] **EDGE-03**: The offline page's list of saved pages includes region pages and the new photo pages (PLAT-F2 shipped in v2.0 as `SavedPages`; this extends its catalog)

## Future Requirements

Deferred to a later release. Tracked but not in the current roadmap.

### Photos & Regions

- **REGION-F1**: Sticky mini plate that marks where the current photo was taken
- **REGION-F2**: Grid (contact-sheet) toggle on region pages
- **REGION-F3**: Lightbox thumbnail index once a region passes about 12 photos
- **REGION-F4**: Overview pin to local plate morph (View Transition)
- **REGION-F5**: Country borders on the overview map (needs a borders dataset and its licence)
- **DATA-F1**: Regions outside the swissALTIRegio footprint (Dolomites core, Hohe Tauern) with a second elevation source (TINITALY 1.1 or BEV ALS DTM), proj4 and per-source credit
- **PHOTO-F1**: "Ask about this photo" link in the lightbox that pre-fills Contact (carried from v2.0)
- **PHOTO-F3**: Tag filters (carried from v2.0)

### Video

- **VIDEO-F1**: Longer drone films with sound on an external host (one `frame-src` origin), with captions
- **VIDEO-F2**: Drone loops inline in the sequence at their altitude position, and clips inside the lightbox

### Platform

- **SEO-F1**: An "Image rights" page with the JSON-LD `license` and `acquireLicensePage` properties
- **PLAT-F3**: Photography blog (carried from v2.0)
- **PLAT-F4**: Print licensing and ordering (carried from v2.0)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Changes to the Home ascent | The Matterhorn stays the site's signature; Home only links to the wider album |
| Moving photo URLs under regions | Keeps every existing link and OG card working with no redirects (decided 2026-11-12) |
| Self-hosted films with sound | Vercel Hobby has 100 GB/month of shared transfer and pauses the site for 30 days on overrun |
| Slippy or tiled maps, runtime tile fetches | Same-origin assets under the nonce CSP; all maps are generated at build time |
| Blending two elevation sources inside one plate | Datum and seam errors; one source per plate |
| Copernicus data for local plates | GLO-30/90 is a surface model (trees, buildings); overview only |
| Scroll-snap, parallax, Ken Burns, overlays on photos, auto-advancing slideshows | Trap keyboard and zoom users or crop and cover the photographs |
| Social share button rows, YouTube or Vimeo embeds | Third-party scripts and CSP holes; Web Share and same-origin loops cover the need |
| LV95 on photos outside Switzerland | LV95 is a Swiss grid |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| GUARD-07 | Phase 13 | Pending |
| GUARD-08 | Phase 13 | Pending |
| GUARD-09 | Phase 13 | Pending |
| GUARD-10 | Phase 15 | Pending |
| DEPS-06 | Phase 13 | Complete |
| VERIFY-05 | Phase 13 | Complete |
| VERIFY-06 | Phase 13 | Complete |
| VERIFY-07 | Phase 13 | Pending |
| CLEAN-01 | Phase 13 | Complete |
| SHELL-07 | Phase 14 | Pending |
| SHELL-08 | Phase 14 | Pending |
| HOME-09 | Phase 14 | Pending |
| HOME-10 | Phase 14 | Pending |
| LBOX-08 | Phase 14 | Pending |
| DATA-09 | Phase 15 | Pending |
| DATA-10 | Phase 15 | Pending |
| DATA-11 | Phase 15 | Pending |
| DATA-12 | Phase 16 | Pending |
| DATA-13 | Phase 16 | Pending |
| DATA-14 | Phase 16 | Pending |
| DATA-15 | Phase 15 | Pending |
| REGION-01 | Phase 18 | Pending |
| REGION-02 | Phase 18 | Pending |
| REGION-03 | Phase 18 | Pending |
| REGION-04 | Phase 18 | Pending |
| REGION-05 | Phase 18 | Pending |
| REGION-06 | Phase 18 | Pending |
| REGION-07 | Phase 17 | Pending |
| PHOTO-05 | Phase 17 | Pending |
| PHOTO-06 | Phase 18 | Pending |
| PHOTO-07 | Phase 18 | Pending |
| PHOTO-08 | Phase 18 | Pending |
| LBOX-09 | Phase 18 | Pending |
| VIDEO-01 | Phase 19 | Pending |
| VIDEO-02 | Phase 19 | Pending |
| VIDEO-03 | Phase 19 | Pending |
| ENG-06 | Phase 14 | Pending |
| SEO-04 | Phase 17 | Pending |
| EDGE-03 | Phase 17 | Pending |

**Coverage:**
- v2.1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0 ✓

**Per phase:** Phase 13: 8 · Phase 14: 6 · Phase 15: 5 · Phase 16: 3 · Phase 17: 4 · Phase 18: 10 · Phase 19: 3

---
*Requirements defined: 2026-11-12*
*Last updated: 2026-11-13 after the 13-06 ledger triage (GUARD-10 added, Phase 15)*
