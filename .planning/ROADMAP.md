# Roadmap: Portfolio App

## Milestones

- ✅ **v1.0 Stabilization & Visual Identity** — Phases 1-6 (shipped 2026-03-12)
- ✅ **v2.0 Topographic Identity** — Phases 7-12 (shipped 2026-11-05)
- 🚧 **v2.1 Survey Expansion** — Phases 13-19 (in progress)

## Phases

<details>
<summary>✅ v1.0 Stabilization & Visual Identity (Phases 1-6) — SHIPPED 2026-03-12</summary>

- [x] Phase 1: Dependency Resolution & Code Quality (3/3 plans) — completed 2026-02-16
- [x] Phase 2: Security & Reliability Hardening (6/6 plans) — completed 2026-02-17
- [x] Phase 3: Design Foundation (3/3 plans) — completed 2026-02-17
- [x] Phase 4: Design Components (6/6 plans) — completed 2026-02-17
- [x] Phase 5: Performance & Accessibility Polish (5/5 plans) — completed 2026-03-11
- [x] Phase 6: Integration Wiring Fixes (1/1 plan) — completed 2026-03-12

</details>

<details>
<summary>✅ v2.0 Topographic Identity (Phases 7-12) — SHIPPED 2026-11-05</summary>

- [x] Phase 7: Foundation & Guardrails (27/27 plans) — completed 2026-10-24
- [x] Phase 8: Data & Terrain Pipeline (13/13 plans) — completed 2026-10-24
- [x] Phase 9: Home Ascent (22/22 plans) — completed 2026-10-25
- [x] Phase 10: Photography (13/13 plans) — completed 2026-10-26
- [x] Phase 11: Engineering & Roadmap (19/19 plans) — completed 2026-11-02
- [x] Phase 12: Contact, Edge Pages, Cleanup & Verification (34/34 plans) — completed 2026-11-05

Full details: [milestones/v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)

</details>

### 🚧 v2.1 Survey Expansion (In Progress)

**Milestone Goal:** Grow the topographic survey from one mountain to photo series from regions across the Alps, shown immersively without losing the survey identity, and close the v2.0 debt.

**Rules for every v2.1 phase:**
- **Design process:** All UI/UX work (UI-SPECs, components, styling, layout, interaction, accessibility) uses the `ui-ux-pro-max` skill (PROJECT.md constraint). A phase marked `UI-SPEC: Required` runs `/gsd-ui-phase` (with ui-ux-pro-max) before `/gsd-plan-phase`.
- **Visual baselines:** Each pixel-changing phase declares its PNG set per cause in its plans, and each cause is re-baselined once. Baselines come only from the CI `workflow_dispatch` container, and only Tim commits PNGs. Phase 15 changes no pixels at all.
- **Tests:** Tests are rewritten, never deleted (GUARD-03 ratchet). The palette, contrast, identity and served-image guards apply to all new code.
- **Settings:** Rulesets, Vercel settings and environment variables are applied by Tim, never by an agent. Criteria that depend on them say "verified".
- **Fixed decisions (2026-11-12):** Home stays the Matterhorn ascent with its four waypoints. Photo URLs stay `/photos/<slug>` with no redirects; region pages get their own non-colliding path. Launch regions sit inside the swissALTIRegio footprint (no second elevation source; proj4 only if the measured `lib/geo.ts` error requires it), and Copernicus GLO-90 feeds only the Alps overview. JSON-LD carries no `license`.

**Execution order:** 13 → 14 → 15 → 16 → 17 → 18 → 19, one at a time. Phase 13 goes first because the refactors after it must land behind required checks, and Playwright 1.65 must be re-baselined before any intended pixel change. Phase 14 depends only on Phase 13; it runs before Phase 15 so the pixel-neutral gate is measured against the post-fix baselines, and before Phase 18 so the LBOX-08 regression test exists before the lightbox is rewritten. Phases 15 to 19 are a strict chain: the neutral refactor before new content, content before routes, routes before layout, and the region page before its video.

- [ ] **Phase 13: Repo Safety & Test Debt** - Required checks on `main`, a verified fail-closed rate limiter, Playwright 1.65 re-baselined alone, a wider audit gate, the G5/G6 tests, ledger triage and dead-code removal
- [ ] **Phase 14: UI Fixes & Terminal Controls** - The carried v2.0 bugs in the mobile menu, Home at 375 px, the rail labels and lightbox focus fixed, plus terminal step buttons and a transcript
- [ ] **Phase 15: Region & Plate Data Model** - An explicit Home waypoint list, a region and country on every photo, an N-plate terrain build, a telemetry ban and one photo URL helper, with no visible change
- [ ] **Phase 16: New Regions & Alps Overview Data** - Coarse-location overrides, new Zermatt photos and 1-2 new regions with their plates, and a Copernicus GLO-90 overview map
- [ ] **Phase 17: Region Routes, SEO & Structured Data** - Region pages on their own path, the photo URL contract held, region metadata, JSON-LD and the saved-pages catalog
- [ ] **Phase 18: Immersive Survey Layout** - The Alps overview on `/photos`, immersive region pages with map collar and altimeter rail, a region-scoped lightbox, Share, LV95 and data credits
- [ ] **Phase 19: Drone Loops** - One silent, same-origin drone loop near a region page header, within a measured byte budget

## Phase Details

### Phase 13: Repo Safety & Test Debt

**Goal**: A red pull request can no longer reach `main` or production, the contact form's rate limiter is proven live, and the test nets cover every page and the photo build scripts before the v2.1 refactors land.
**Depends on**: Nothing (first v2.1 phase; builds on the shipped v2.0 codebase)
**Requirements**: GUARD-07, GUARD-08, GUARD-09, DEPS-06, VERIFY-05, VERIFY-06, VERIFY-07, CLEAN-01
**Success Criteria** (what must be TRUE):
  1. A deliberately red test PR cannot merge into `main`: one aggregate required check depends on every CI job, and the `main` ruleset that requires it is verified with `gh api` after Tim applies it. A PR whose head commit says `[ci skip]`, or that touches only path-filtered files, still gets a final result on that check instead of staying pending, and no unchecked commit reaches production.
  2. Tim has confirmed the expected Upstash variables in Vercel production, the sixth rapid honeypot submission to the live form gets a 429, and in production an unconfigured or unreachable limiter refuses submissions instead of allowing every request (unit-tested).
  3. Playwright 1.65 and its container image tag land in one commit that is re-baselined on its own, before any intended visual change, and Dependabot PR #140 is closed by it.
  4. The production audit gate runs `/projects/coin-flip` and every photo slug (each page template in all three engines, each slug at least once in Chromium) and takes its routes from the site's data, so a new photo or region page cannot ship outside it. A wrong capture-time offset fails the photo data build (G5), and an invalid source leaves existing derivatives in place with exit code 1 (G6).
  5. Every open review-ledger row from Phases 7, 9, 10 and 12 is fixed, accepted with a recorded reason, or turned into a requirement, and `TILT_CONFIG`, the test-only `cssDuration` and `cssEase`, the unused `next.config` images block, the service-worker `/_next/image` branch, the commented CI steps and the vercel.com `dns-prefetch` are gone with no visual diff.
**Plans**: 13/22 plans executed in 12 waves

Plans:
**Wave 1**
- [x] 13-01-PLAN.md — `CI OK` aggregate job, `scripts/ci/ci-ok.jq` and the `check-ci-gate` guard (phase tracer, GUARD-07)
- [x] 13-02-PLAN.md — Rate limiter fails closed in production; both Upstash name pairs; route 503 (GUARD-09)
- [x] 13-03-PLAN.md — Audit gate routes from the sitemap; coin-flip and every photo slug; template coverage test (VERIFY-05)
- [x] 13-04-PLAN.md — CLEAN-01 removals in app, config, service worker and motion helpers
- [ ] 13-05-PLAN.md — Tim's production facts (Upstash names, VERCEL_ENV, Deployment Checks) and the daily Upstash keep-alive
- [x] 13-06-PLAN.md — Ledger triage of the 44 open rows and Tim's single approval (VERIFY-07)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 13-07-PLAN.md — Docs-only fast path inside `CI OK`, `workflow_dispatch`, path-filter ban; commented CI steps removed
- [x] 13-08-PLAN.md — Ledger fixes: Phase 7 and 9 docs, naming and test rows
- [x] 13-09-PLAN.md — Ledger fixes: Phase 10 photo-component rows

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 13-10-PLAN.md — `[ci skip]` relay mirror on `pull_request_target` (D-06 option A) with guard rules (GUARD-08)
- [x] 13-11-PLAN.md — Ledger fixes: contact and service-worker rows, Tim's owner calls

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 13-12-PLAN.md — G5/G6 photo-script characterization tests via `--root` (VERIFY-06)

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 13-13-PLAN.md — Ledger fixes: contrast and palette guard rows

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 13-14-PLAN.md — Ledger fixes: same-classnames, snapshot-commit and parity guard rows; catch-all for rows Tim moves into fix-now

**Wave 7** *(blocked on Wave 6 completion)*
- [ ] 13-15-PLAN.md — Mid-phase PR to `main` (D-05) with green `CI OK` and zero-pixel-diff proof

**Wave 8** *(blocked on Wave 7 completion)*
- [ ] 13-16-PLAN.md — Tim merges; Tim applies the `main` ruleset, deletes 10401314, sets Deployment Checks; API verification

**Wave 9** *(blocked on Wave 8 completion)*
- [ ] 13-17-PLAN.md — Limiter live: production deployment, first keep-alive run, the 429 probe (GUARD-09)
- [ ] 13-18-PLAN.md — Playwright 1.65 and container tag in one commit after Tim's package check (DEPS-06)
- [ ] 13-19-PLAN.md — D-10 live proofs (red, docs-only, `[ci skip]`) and the relay decision

**Wave 10** *(blocked on Wave 9 completion)*
- [ ] 13-20-PLAN.md — Playwright 1.65 three-engine CI and the re-baseline alone; Tim commits PNGs; #140

**Wave 11** *(blocked on Wave 10 completion)*
- [ ] 13-21-PLAN.md — D-06 fallback B or C if 13-19 chose it (otherwise a recorded no-op)

**Wave 12** *(blocked on Wave 11 completion)*
- [ ] 13-22-PLAN.md — Ledger write-back (D-19), hand-overs to later phases, PROJECT.md Key Decisions
**Research**: Not needed (known GitHub ruleset and aggregate-check pattern). Before Tim applies anything, confirm each identifier in its UI or CLI: Vercel Deployment Checks on Hobby, the GitHub Actions integration id, the admin role id, and the production Upstash variable names (`vercel env ls production`; the Marketplace may inject `KV_*` instead of `UPSTASH_*`).
**UI hint**: no
**UI-SPEC**: Not needed. No UI change; the only pixel change is the Playwright 1.65 re-baseline.
**Inputs from Tim**: Review and apply the `main` ruleset and any Vercel setting (the agent prepares the JSON, Tim applies it); decide whether the inert `automated-actions` ruleset is removed or replaced; confirm the production Upstash variables; run or approve the live 429 probe (it locks the probing IP out for up to an hour); commit the Playwright 1.65 PNGs; decide the ledger rows that need an owner call.
**Scope notes**:
  - Already done after the v2.0 close and not part of this phase: the axe 4.14 upgrade with the `label-content-name-mismatch` fixes (`0b1a467`, `42f4bb4`), and the hanging browser install (E2E runs in the Playwright image since quick task 261106-mzc).
  - VERIFY-06 must land before Phase 15 refactors the photo scripts.
  - Ledger rows that turn into UI fixes are scheduled into Phase 14. Any other new requirement gets an ID in REQUIREMENTS.md and a phase.

### Phase 14: UI Fixes & Terminal Controls

**Goal**: The UI bugs carried from v2.0 are gone for keyboard, touch and narrow-screen visitors, and the terminal demo can be stepped through and read without motion.
**Depends on**: Phase 13 (the Playwright 1.65 re-baseline lands first, and the fixes merge through the required check)
**Requirements**: SHELL-07, SHELL-08, HOME-09, HOME-10, LBOX-08, ENG-06
**Success Criteria** (what must be TRUE):
  1. On a phone, tapping the current page's link in the mobile menu closes the menu, and every focus ring in the menu is fully visible at 375 px.
  2. Home has no horizontal overflow at 375 px, fixed at the element that overflowed rather than by hiding overflow on `body` or `main`.
  3. Every altimeter rail tick label keeps at least 4.5:1 contrast over the live canvas and over the poster at every breakpoint, and the rail scrim covers the full label run.
  4. After stepping in the lightbox and closing it with Escape, focus returns to the current photo's visible trigger and never lands off-screen, and a regression test holds this before Phase 18 rewrites the lightbox.
  5. The terminal demo has previous and next step buttons and a static transcript in a disclosure that is open by default under reduced motion.
**Plans**: TBD
**UI hint**: yes
**UI-SPEC**: Required, short: the terminal step buttons and transcript disclosure, the rail scrim and the menu focus-ring treatment.
**Research**: Not needed (small, well-understood fixes). Diagnose the Escape-focus root cause before fixing it; it was not diagnosed at 12-UAT.
**Baselines**: One declared PNG set per cause (mobile menu, Home at 375 px, rail scrim, case-study terminal); Tim commits the PNGs.
**Inputs from Tim**: UI-SPEC approval, the keyboard-focus check he made at 12-UAT test 3, and the PNG commits.

### Phase 15: Region & Plate Data Model

**Goal**: The data, the terrain build and the photo links are ready for many regions while the site looks and builds exactly as before: Home reads its own waypoint list, every photo has a region and a country, the terrain build handles many plates, and drone telemetry can be neither committed nor served.
**Depends on**: Phase 13 (the G5/G6 tests guard the photo scripts before they change); runs after Phase 14
**Requirements**: DATA-09, DATA-10, DATA-11, DATA-15, GUARD-10
**Success Criteria** (what must be TRUE):
  1. Home reads an explicit list of its four Matterhorn waypoints: a test that adds a photo outside that list, or in another region, leaves the ascent, the 1,617 m rail start and the footer ticks unchanged.
  2. Every photo record names its region (Zermatt for every current photo) and its country in typed, committed data, and CI fails when that data is missing or stale.
  3. The terrain build reads a plate registry and builds every listed plate in one run. With only the Matterhorn plate it reproduces today's hashed files byte for byte, `terrain:build --check` stays green, and a fixture second plate gets its own prefixed files without touching the Matterhorn ones.
  4. The served-asset guard fails on `.SRT`, `.LRF`, GPX and KML files and on MP4s carrying GPS or telemetry tracks anywhere in the repo or the site, proven by selftest fixtures.
  5. The phase lands with zero visual-baseline changes, and a test shows that every link to a photo comes from one URL helper (still `/photos/<slug>`).
  6. `npm run type-check` also type-checks the Jest tests, e2e specs and Playwright configs, with zero errors (GUARD-10; the 13-06 measurement found 5482 errors in 103 files as-is and 69 in 21 files with the Jest globals declared), using `@types/jest` only after Tim vets it, or `@jest/globals` imports.
**Plans**: TBD
**Research**: Not needed; the work follows in-repo patterns. Plan with explicit acceptance gates: every visual baseline unchanged, `data:check` green, and the Matterhorn terrain hashes equal to today's.
**UI-SPEC**: Not needed. Nothing visible changes; extracting the footer's sheet margin into a shared component must be zero-diff.
**Scope notes**:
  - Groundwork for later phases: `photoHref` and `regionHref` in place of the hand-built photo URLs; a slim route list the proxy can import instead of the view-model; a view-model split into Home waypoints, region series and photo views; region and plate registries as JSON so the `.mjs` generators can read them; `SheetMargin` extracted from `SiteFooter`; `ContourField(plate)`; named test fixtures instead of index lookups; a closed sidecar schema and an explicit photo id map.
  - One builder run owns every plate (a per-plate run would delete the others' files), and asset names stay flat and prefixed, so the existing regexes, cache rules and service-worker precache keep working.
  - From here on the v2.0 light table shows the Zermatt series only, so Phase 16's new regions never land on the Matterhorn map.

### Phase 16: New Regions & Alps Overview Data

**Goal**: Tim's new photographs and regions, and an Alps-wide overview map, become committed, privacy-safe, build-time data, with every region plate and the overview built from their sources.
**Depends on**: Phase 15
**Requirements**: DATA-12, DATA-13, DATA-14
**Success Criteria** (what must be TRUE):
  1. Before any new original is ingested, a photo or clip can carry a coarser location than the 4-decimal default (for example near a home or a drone take-off point), and every place that shows a position marks it as coarse or approximate.
  2. More Zermatt photos and 1-2 new regions inside the swissALTIRegio footprint, at least one in Italy or Austria, are in the committed photo data with EXIF facts, DEM heights and metadata-free hashed derivatives from the existing pipeline. The served-image guard and `data:check` pass, and each region's footprint check is recorded.
  3. Each new region has its own local plate (contours and hillshade) from swissALTIRegio, `terrain:build --check` stays deterministic, and the Matterhorn plate's hashed files and Home stay unchanged.
  4. A build-time Alps overview is generated from Copernicus GLO-90 contours, with each region's plate extent drawn as a rectangle and 3-5 labelled reference summits, within a size budget that a spike measured before it was fixed.
**Plans**: TBD
**Research**: Needed during planning:
  - The footprint check of the chosen regions against swissALTIRegio (about 4.5-12.0° E), and whether the Matterhorn plate must grow for any new Zermatt photo (the Monte Rosa side).
  - The `lib/geo.ts` error at the far pins (measured 2-3 m at Seceda and Innsbruck against 0.15 m at Zermatt). Add proj4 only if the measured error requires it.
  - An overview spike: projection (plate carrée scaled by cos 46.5° or LAEA), contour interval, smoothing and ring filtering, and the size budget (unsmoothed 1,000 m contours measured 43 KB brotli).
  - The Copernicus GLO-90 notice, copied verbatim for Phase 18's sources page.
  - Privacy rules for new material: per-photo precision, aerial photos without altitude or labelled as ground height, and an explicit id map for DJI and second-camera filenames. Location data in git history cannot be recalled (D-12), so these rules land before the first new original.
**UI-SPEC**: Not needed. The coarse flag reuses the existing approximate-pin treatment; any new treatment goes into Phase 18's UI-SPEC.
**Baselines**: New photos must not churn the baselines twice. Either new Zermatt photos join the v2.0 light table now with one declared content re-baseline, or they stay off it until Phase 18 replaces it. Home and the footer never change (DATA-09).
**Inputs from Tim**: The launch regions (inside the footprint, at least one in Italy or Austria), the new originals, the coarse-location choice per photo, editorial copy (titles, stories, region facts) and the 3-5 reference summits.

### Phase 17: Region Routes, SEO & Structured Data

**Goal**: Every region and every photo has its final, crawlable URL before the layout is designed: region pages live on their own path, old photo links and cards keep working, and search engines and the offline page know the new pages.
**Depends on**: Phase 16 (regions and new photos in the data; coarse locations for JSON-LD), with the Phase 15 URL helper
**Requirements**: PHOTO-05, REGION-07, SEO-04, EDGE-03
**Success Criteria** (what must be TRUE):
  1. Every existing `/photos/<slug>` URL and its Open Graph card answer exactly as before, with no redirects, and every new photo gets the same deep-linkable page.
  2. Each region has a page on its own path, fixed after the static-sibling intercept spike, that never collides with a photo slug. An unknown region answers the designed 404 the way an unknown photo slug does, and every region page passes the production audit gate.
  3. Each region page has its own title, description, canonical URL, Open Graph card and sitemap entry, and the sitemap lists exactly the canonical URLs.
  4. Pages carry JSON-LD that parses: Person and WebSite site-wide, ImageObject on photo pages, an image gallery on region pages and the projects on their case studies, each with creator, copyright notice and credit text, no `license` property and no coordinates finer than the page shows.
  5. The offline page's saved-pages list includes the region pages and new photo pages a visitor has opened.
**Plans**: TBD
**Research**: Needed: spike the region path next to the `/photos/<slug>` intercepting route (the static-sibling case, for example `/photos/regions/<region>`) under webpack (dev) and Turbopack (build) in Next 16.4.5; how the proxy's two-segment 404 regex and `dynamicParams` treat the new path; region cards on the shared OG template; JSON-LD typing (schema-dts as a type-only devDependency) with a parse, `<`-escaping and precision test.
**UI-SPEC**: Not needed. The region page here is a plain server-rendered page in the existing shell (heading, facts, links to its photos) whose job is to fix the route, the metadata and the structured data; Phase 18 designs it. If phases merge to `main` one at a time, region pages stay unlinked from navigation until Phase 18.
**Inputs from Tim**: The region path, chosen after the spike.

### Phase 18: Immersive Survey Layout

**Goal**: Visitors browse the Alps survey: `/photos` opens on an overview of the regions, each region page shows its photographs large, uncropped and in sequence inside map collars along an altimeter rail, and every map credits its data.
**Depends on**: Phase 17 (final routes) and Phase 16 (overview data, plates and content), with the Phase 14 LBOX-08 regression test in place
**Requirements**: REGION-01, REGION-02, REGION-03, REGION-04, REGION-05, REGION-06, PHOTO-06, PHOTO-07, PHOTO-08, LBOX-09
**Success Criteria** (what must be TRUE):
  1. `/photos` opens on the Alps overview with one pin per region and a synced region list that is the keyboard, screen-reader and narrow-screen path, with numbered pins on phones. The Map/Grid/Carousel switch is gone, old `?view=` URLs land on the matching new page, and the view tests are rewritten, not deleted.
  2. A region page shows a header, region facts and its local plate with photo pins, then its photos as an uncropped, full-width sequence on gallery-black in ascending-altitude order with always-visible data captions (place, altitude, date, camera facts), and ends with a next-region block.
  3. Each photo in the sequence sits in a map collar whose neatline and coordinate ticks are drawn outside the image, never over it, and an altimeter rail reads the sequence as an ascent and marks the current photo.
  4. The lightbox steps only through the current photo's region and ends on an end-of-series card that links to the next region. A visitor can share a photo or a region with the Web Share API where it exists, or copy its link elsewhere, and the button's label says which. Swiss photos show LV95 rounded to 10 m next to WGS84, and other photos show WGS84 only.
  5. The overview and every local plate show their extent, "last surveyed" date and short source credit in their own sheet margin, and the footer links to a sources page with the full credit and licence text of every data source.
**Plans**: TBD
**UI hint**: yes
**UI-SPEC**: Required. Run `/gsd-ui-phase` with the ui-ux-pro-max skill before planning. It covers the overview (sheet-index rectangles, reference summits, label placement at 375 px, HTML pin overlays), the region page and its sequence (images contained, never cropped, under the 2,560 px cap), the map collar, the altimeter rail, the end-of-series card, the Share button states, the LV95 line, the coarse-location flag if it needs a new treatment, the sheet margins and the sources page, and it reserves the header slot Phase 19 fills (poster aspect ratio, pause control).
**Research**: Needed: overview label collision at 375 px; per-breakpoint `sizes` and the photo-page LCP (no photo-page LCP gate exists yet); the JS-budget margin (HOME-08 has about 6.2%); Web Share support and the copy fallback; region order (west to east or by date) and whether the nav hides on scroll.
**Baselines**: One deliberate re-baseline per cause with declared PNG sets (overview, region pages, photo page and lightbox, the footer's sources link on every route, the sources page), content last; new routes captured with `update_mode=missing`; Tim commits the PNGs. Re-run the HOME-08 budget, since shared chunks may grow.
**Inputs from Tim**: UI-SPEC approval, region order, the sources-page wording (verbatim licence texts) and the PNG commits.

### Phase 19: Drone Loops

**Goal**: A region page can open with a short, silent drone flight that leaks no location, never plays against a visitor's motion or data preferences, and stays well inside the hosting budget.
**Depends on**: Phase 18 (the region page and its header slot), with the Phase 15 telemetry guard and the Phase 16 coarse take-off locations
**Requirements**: VIDEO-01, VIDEO-02, VIDEO-03
**Success Criteria** (what must be TRUE):
  1. At least one region page shows one silent drone loop in a fixed slot near its header: the poster shows first, a visible pause control stops it, and it does not play under reduced motion or Save-Data.
  2. Each loop has a text alternative that describes what the flight shows.
  3. Loops are served same-origin through the clip pipeline with no location or telemetry metadata (the served-asset guard checks the shipped file), each within a per-clip byte budget fixed after encoding one real clip, and a written transfer projection shows the site stays well inside the Vercel Hobby limit.
**Plans**: TBD
**UI hint**: yes
**UI-SPEC**: Short addendum only if Phase 18's UI-SPEC did not settle the header slot, the poster and the pause control.
**Research**: Needed: encode one of Tim's real clips and record its bytes before fixing any budget; H.264 only or an AV1 rendition first (the installed ffmpeg lacks SVT-AV1); DJI metadata in the output (`djmd` track, `uuid` box), verified with ExifTool 13.05 or later, plus a DJI-shaped selftest fixture; per-kind clip budgets instead of a raised global `MAX_CLIP_BYTES`. Same-origin progressive MP4 needs no CSP change.
**Baselines**: The region page with its loop poster as one declared PNG set.
**Inputs from Tim**: A graded SDR Rec.709 master of the clip, the region it belongs to, and approval of the text alternative.

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Dependency Resolution & Code Quality | v1.0 | 3/3 | Complete | 2026-02-16 |
| 2. Security & Reliability Hardening | v1.0 | 6/6 | Complete | 2026-02-17 |
| 3. Design Foundation | v1.0 | 3/3 | Complete | 2026-02-17 |
| 4. Design Components | v1.0 | 6/6 | Complete | 2026-02-17 |
| 5. Performance & Accessibility Polish | v1.0 | 5/5 | Complete | 2026-03-11 |
| 6. Integration Wiring Fixes | v1.0 | 1/1 | Complete | 2026-03-12 |
| 7. Foundation & Guardrails | v2.0 | 27/27 | Complete | 2026-10-24 |
| 8. Data & Terrain Pipeline | v2.0 | 13/13 | Complete | 2026-10-24 |
| 9. Home Ascent | v2.0 | 22/22 | Complete | 2026-10-25 |
| 10. Photography | v2.0 | 13/13 | Complete | 2026-10-26 |
| 11. Engineering & Roadmap | v2.0 | 19/19 | Complete | 2026-11-02 |
| 12. Contact, Edge Pages, Cleanup & Verification | v2.0 | 34/34 | Complete | 2026-11-05 |
| 13. Repo Safety & Test Debt | v2.1 | 13/22 | In Progress | - |
| 14. UI Fixes & Terminal Controls | v2.1 | 0/TBD | Not started | - |
| 15. Region & Plate Data Model | v2.1 | 0/TBD | Not started | - |
| 16. New Regions & Alps Overview Data | v2.1 | 0/TBD | Not started | - |
| 17. Region Routes, SEO & Structured Data | v2.1 | 0/TBD | Not started | - |
| 18. Immersive Survey Layout | v2.1 | 0/TBD | Not started | - |
| 19. Drone Loops | v2.1 | 0/TBD | Not started | - |
