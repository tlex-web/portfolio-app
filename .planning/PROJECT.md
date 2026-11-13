# Portfolio App

## What This Is

A personal portfolio web application built with Next.js and React that presents Tim Lui's landscape photography and engineering work as one Swiss "topographic survey" of the real Matterhorn terrain. Every page renders inside one dark, token-driven site shell behind CI guardrails for visual regressions, deleted tests and off-system styling. Home is a native-scroll ascent up real swissALTIRegio terrain, with a static contour poster wherever 3D is off or too slow. `/photos` is a light table with Map, Grid and Carousel views and deep-linkable `/photos/[slug]` pages that open in-site as a gallery-black lightbox. `/projects` shows box and coin-flip as route panels and case studies, `/roadmap` is a route log, and `/contact` is a summit-register form. Unknown URLs, errors and offline visits get designed pages. Everything supports reduced motion.

## Core Value

A portfolio that is visually memorable and distinctive — not another generic Tailwind site — while being stable and well-maintained under the hood.

## Current State

**Shipped:** v2.0 Topographic Identity on 2026-11-05 (PR #109, merge commit `559bd72`, live on Vercel): 6 phases and 128 plans. The audit status is `tech_debt`: 67 of 67 active requirements satisfied and ENG-03 dropped by D-24 (`.planning/milestones/v2.0-MILESTONE-AUDIT.md`).

**Confirmed on production:** a real send from the contact form. `PROD_FORM_SEND=1 npm run test:prod-form` passed on `e19890d` on 2026-11-06, and the email arrived.

## Current Milestone: v2.1 Survey Expansion

**Goal:** Grow the topographic survey from one mountain to photo series from regions across the Alps, shown immersively without losing the survey identity, and close the v2.0 debt.

**Target features:**
- Region series: photos grouped by region. Zermatt becomes the first region and gets new photos, and 1–2 new regions launch with it, at least one in Italy or Austria
- Map model: an Alps-wide contour overview with one pin per region; each region opens on its own local terrain plate, as the Matterhorn map works today
- Terrain pipeline for more than one region. Launch regions sit inside the swissALTIRegio footprint (about 4.5–12.0° E, including its Italian and Austrian fill), so local plates need no second elevation source; Copernicus GLO-90 feeds only the Alps overview
- A fresh, more immersive photo layout (large full-bleed images, less chrome) that stays topographic: contours, coordinates and altitudes frame everything
- Drone video: one silent, same-origin loop per region page (decided after research; films with sound deferred)
- Deferred ideas: PHOTO-F2 Share (Web Share API), PHOTO-F4 LV95 next to WGS84 (Swiss photos only), ENG-F1 terminal step controls and transcript, PLAT-F1 JSON-LD, and the PLAT-F2 saved-pages list (shipped in v2.0) extended to the new pages
- v2.0 debt: repo safety (branch protection and required checks on `main`, including the `[ci skip]` gap; Upstash confirmed in production; the Playwright 1.65 re-baseline), test gaps (audit gate over coin-flip and every photo slug, Nyquist G5 and G6, triage of the open review-ledger rows), UI fixes (mobile menu on the current page, 375 px Home overflow, focus after lightbox Escape, clipped menu focus ring, the 4.81:1 rail label) and small leftovers

**Unchanged:** Home stays the Matterhorn ascent with its four waypoints and links to the wider album. Existing `/photos/[slug]` links and their OG cards keep working through the series URL change.

**Not in v2.1:** PHOTO-F1 "Ask about this photo", PHOTO-F3 tag filters, PLAT-F3 blog, PLAT-F4 print licensing.

<details>
<summary>v2.0 goal and target features, as planned on 2026-10-10</summary>

**Goal:** Rebuild the whole UI around the real Matterhorn terrain so Tim Lui's photography and engineering read as one Swiss "topographic survey" — on a single enforced design system, without visual regressions.

**Target features:**
- Foundation & guardrails: Playwright screenshot baselines, tokens v2, zero `dark:` variants / stock Tailwind palette classes (lint-enforced), one `SiteNav` in a shared `(site)` layout, "Tim Lui" identity with real links, visible scrollbar, contact contrast fix, framer-motion 12 → 14 upgrade in isolation, React 19.2 → 19.3 / Next 16.2 → 16.4 upgrade in isolation (prerequisite for `<ViewTransition>`)
- Data & terrain pipeline: swisstopo swissALTIRegio (10 m, cross-border) DEM → 16-bit heightmap + contour SVG (d3-contour) at build time, originals moved out of `/public`, EXIF → typed photo data (exif-reader + sharp), corrected capture dates and waterfall location, typed project highlight schemas
- Home "ascent": real Matterhorn terrain with contour-line shader (R3F), altimeter rail 1,617 m → 4,478 m, photo waypoints placed by EXIF GPS with DEM-sampled heights (D-17), Swiss trail-sign routes, static fallback for reduced motion / no WebGL
- Photography: dark light table with Map / Grid / Carousel views, gallery-black lightbox with EXIF strip and hotspot callouts, View Transitions thumbnail → lightbox
- Engineering & roadmap: route panels and case studies for box and coin-flip (hex cards retired), a per-project safety slot, trail grades only as the real SAC badges of the profile trails, terminal restyled to tokens, route-log roadmap (CLI_X risk bands dropped with ENG-03, D-24)
- Contact, edge pages & cleanup: summit-register contact page, "off the marked trail" 404/offline/error, delete `/gradient-mesh` `/particle-buttons` `/transitions`, remove dead code, axe + cross-browser verification

**Reference:** Approved plan with audit, mockups and tooling metrics — https://claude.ai/artifact/GXsHFNbtf7Qp6hPSYxuY8U

</details>

## Requirements

### Validated

- ✓ Portfolio site with project showcase and detail pages — existing
- ✓ 3D landscape/mountain terrain visualizations — existing
- ✓ Interactive photo carousel with 3D effects — existing
- ✓ Hologram terminal component — existing (replaced by DemoTerminal in v2.0)
- ✓ Particle button effects and animations — existing (removed in v2.0)
- ✓ Feedback/contact form with email delivery via Resend — existing
- ✓ Service worker for offline caching — existing
- ✓ Responsive layout with Tailwind CSS — existing
- ✓ Vercel Analytics and Speed Insights integration — existing
- ✓ CI/CD pipeline with lint, typecheck, unit, and E2E tests — existing
- ✓ Peer dependency conflicts resolved (React 19 compatible) — v1.0
- ✓ legacy-peer-deps removed from all configs — v1.0
- ✓ All `any` types replaced with proper TypeScript types — v1.0
- ✓ Image optimization pipeline integrated into build — v1.0 (replaced by the hashed derivative pipeline in v2.0)
- ✓ Nonce-based CSP removing unsafe-inline — v1.0
- ✓ CSRF token validation on feedback endpoint — v1.0
- ✓ Persistent rate limiting via Upstash Redis — v1.0
- ✓ Service worker cache version from build hash — v1.0
- ✓ Custom OKLCH color palette (Swiss Alps theme) — v1.0 (replaced by tokens v2)
- ✓ Custom typography system (JetBrains Mono + Inter) — v1.0 (v2.0 adds Schibsted Grotesk for display; JetBrains Mono is for data only)
- ✓ WCAG AA contrast verified for all color combinations — v1.0
- ✓ Distinctive glassmorphism navigation — v1.0 (replaced by SiteNav in v2.0)
- ✓ Hexagonal crystalline project cards — v1.0 (retired in v2.0)
- ✓ Biophilic micro-interactions with geological easing — v1.0
- ✓ Glowing accents connecting 2D UI to 3D components — v1.0
- ✓ Progressive texture loading for PhotoCarousel3D — v1.0
- ✓ Reduced-motion support across all animated components — v1.0
- ✓ One enforced design system across every page (tokens v2, no `dark:` variants, no stock palette classes, lint-enforced) — v2.0 Phase 7
- ✓ Real identity (Tim Lui) and real contact/social links everywhere — v2.0 Phase 7
- ✓ CI regression nets: Linux visual baselines for every route in dark and light, test-count ratchet, palette/contrast/jsx-a11y guards — v2.0 Phase 7
- ✓ Build-time terrain data: swissALTIRegio source raster (May 2026 edition) → hashed 16-bit heightmaps, three contour LODs and a hillshade poster, re-derived offline by `terrain:build --check` in lint — v2.0 Phase 8
- ✓ Typed, committed photo facts from real EXIF + Tim's corrections + DEM heights (4-dp GPS, year/season tags, approximate film-scan pin), checked for staleness in CI — v2.0 Phase 8
- ✓ Privacy-safe images: originals out of the repo and site, metadata-free hashed derivatives ≤ 2560 px, served-image guard over every tracked image — v2.0 Phase 8
- ✓ Typed project highlights with real CLI_X riskScores and the trail-grade band scale — v2.0 Phase 8 (CLI_X data removed in Phase 11, D-22)
- ✓ Footer map legend (contour band, waypoint ticks, true scale bar, LV95 extent, "Last surveyed", swisstopo attribution) on every route — v2.0 Phase 8
- ✓ Home "ascent" on the real Matterhorn: contour-shader terrain in a lazy R3F chunk, native scroll with no scroll-jacking and a skip link, altimeter rail 1,617 m → 4,478 m, four photo waypoints at their EXIF/DEM positions, trail signs and a summit-plaque readout, and a static contour poster for reduced motion, Save-Data, no WebGL2, low memory, a lost context or a failed frame budget (HOME-01 to HOME-08) — v2.0 Phase 9
- ✓ Photography from real EXIF data: Map / Grid / Carousel views in ascending-altitude order with the view in the URL (no history entries, no auto-advance), deep-linkable `/photos/[slug]` pages that open in-site as a focus-trapped gallery-black lightbox (arrow keys, buttons and swipe without history entries, counter, zoom, EXIF strip with rounded coordinates, hotspot callouts with a hide toggle, "© {year} Tim Lui, all rights reserved", no download button) and a thumbnail morph where View Transitions exist (PHOTO-01 to PHOTO-04, LBOX-01 to LBOX-07) — v2.0 Phase 10
- ✓ Engineering as surveyed routes for box and coin-flip: full-width `/projects` route panels (hex cards and hex-grid code removed), case-study pages that omit any section without data, a per-project safety slot ("Safety" for box, "Privacy" for coin-flip), an instrument-panel metric strip with tabular numerals where every claim is sourced or softened and each source link is named after its tile, and a token-styled terminal demo that stops on focus, hover and reduced motion and has a pause button (ENG-01, ENG-02, ENG-04, ENG-05) — v2.0 Phase 11
- ✓ Route-log roadmap: items on a vertical elevation axis (completed below, in progress at the current camp, planned above), segmented project and status filters kept in the URL with empty combinations disabled, and ordered data with completion dates and a "last surveyed" date (ROUTE-01 to ROUTE-03) — v2.0 Phase 11
- ✓ Summit-register contact page: dark form with visible labels and field borders, Tim's email as selectable text and Zürich as coordinates; errors below each field after the visitor leaves it, one focused error summary on an invalid submit or a server `validation` answer, input never cleared, progress then "register signed" or a recoverable error; a `trail_note` honeypot dropped with a quiet 200 after the unchanged origin check and Upstash limit (CONTACT-01, CONTACT-02, CONTACT-03) — v2.0 Phase 12, 2026-11-03
- ✓ Designed edge pages: the "You've left the marked trail" 404 with contour art and a route home, error and global-error in the same shell, an offline page on the design system, and a network-first service worker that stores only ok, basic, non-redirected navigations, precaches `/offline` with its assets and reloads a tab once on update, never while a field holds typed text (EDGE-01, EDGE-02) — v2.0 Phase 12, 2026-11-03
- ✓ Search and link previews: every route has its own title, description and absolute canonical on one `site.url`; every photo and project page has its own Open Graph card from one shared template; `/sitemap.xml` and `/robots.txt` are generated from the site data (SEO-01, SEO-02, SEO-03) — v2.0 Phase 12, 2026-11-03
- ✓ Cleanup and verification: dead v1 components, aliases, the 60 legacy image variants and the unused CSP origins removed (VERIFY-01); a production audit spec over all 8 routes plus the 404 at 375, 768 and 1440 px fails on any axe violation, CLS above 0.1, CSP violation, console or page error, failed image or broken same-origin link, and passed 54/54 in three engines (VERIFY-02, VERIFY-04); Chromium, Firefox and WebKit run the full suite in CI with `--fail-on-flaky-tests`, green on 147bc82 (VERIFY-03) — v2.0 Phase 12, 2026-11-03; the hand checks (real Safari, Tim's keyboard focus judgement, the production CSP header) are the UAT checklist in 12-24-SUMMARY
- ✓ No visual or functional regressions: screenshot baselines, tests rewritten and never deleted, axe clean on the pinned version, and the hand checks passed at 12-UAT on 2026-11-05 — v2.0

### Active

v2.1 Survey Expansion. The REQ-IDs are in `.planning/REQUIREMENTS.md`.

- [ ] Photos are organised as region series (Zermatt plus 1–2 new regions, at least one in Italy or Austria)
- [ ] An Alps-wide overview map leads to a local terrain plate per region
- [ ] The terrain pipeline builds a plate per region from swissALTIRegio, plus an Alps overview from Copernicus GLO-90
- [ ] The photo pages get an immersive layout inside the topographic identity
- [ ] Each region page can carry one silent drone loop
- [ ] Deferred ideas PHOTO-F2, PHOTO-F4, ENG-F1 and PLAT-F1 ship, and the PLAT-F2 saved-pages list covers the new pages
- [ ] The v2.0 debt is closed: repo safety, test gaps, UI fixes and small leftovers

### Out of Scope

- Full Tailwind removal — keep Tailwind as utility layer, build custom on top
- Mobile app — web-first portfolio
- Database/persistent storage for feedback — defer to future milestone
- Error monitoring (Sentry) — defer to future milestone
- Performance test suite — defer to future milestone
- 3D component refactoring (shader extraction) — defer unless needed for CSS work
- Offline mode — service worker caching sufficient, full offline mode fragile
- CLI_X risk bands shown as trail grades (ENG-03) — dropped 2026-11-01 (D-24): CLI_X is discontinued and neither box nor coin-flip has risk bands; trail grades appear only as the real SAC badges of the profile trails

## Context

Shipped v1.0 with 12,484 LOC TypeScript/CSS across 165 files.
Shipped v2.0 with about 56,100 lines of TypeScript, CSS and scripts (generated data excluded) and 2,243 tests (Jest 1,694, Playwright 549). CI E2E runs Chromium, Firefox and WebKit with `--fail-on-flaky-tests`.
Tech stack: Next 16.4, React 19.3, Tailwind v4 (CSS-first `@theme`), `motion` 14.1, Three.js with R3F 9.8 and drei 10.7, zod 4, Playwright 1.64, Node 24 with `npm ci` locally, in CI and on Vercel.
Deployed on Vercel, with Upstash Redis for rate limiting and Resend for email. The canonical host is `https://www.tlui.de`; tlui.de and the vercel.app host redirect to it at Vercel.
Home performance at close (HOME-08, on-demand gate, local run): mobile LCP 3,216 ms against 4,692 ms, 439,840 B of JS against 468,770 B.

Design system: the "topographic survey": tokens v2 (night-map OKLCH primitives and semantic tokens, a neutral gallery-black photo surface), Schibsted Grotesk for display, Inter for body text, JetBrains Mono for data, one Phosphor SVG icon family and shared motion tokens. `dark:` variants and stock palette classes fail lint, and `--color-*: initial` removes the stock palette at compile time.

Known tech debt, from the v2.0 audit (full list in `.planning/milestones/v2.0-MILESTONE-AUDIT.md`):
- `main` has no branch protection or required checks, so red CI blocks nothing and Vercel deploys every push
- The audit gate skips `/projects/coin-flip` and photo slugs 2-4 (`e2e/routes.ts`); they measured clean once on production at the audit
- axe-core 4.14 reports `label-content-name-mismatch` on 13 elements, which fails the gate on upgrade. Four grid tiles really do hide their visible caption from the accessible name; the other nine look like a rule quirk
- No favicon: `/favicon.ico` answers 404
- Phase 10 Nyquist tests G5 and G6 were deferred to Phase 12 and never picked up
- Review ledgers: rows open and untriaged in Phase 7 (23), Phase 9 (6), Phase 10 (10) and Phase 12 (5)
- Dependabot: 14 open PRs, with #110 and #111 red. Grouped `@playwright/test` bumps fail the parity guard (07 review WR-05). 40 of the 60 alerts are selftest fixture lockfiles, and the other 20 are dev-only
- 7 code-scanning alerts in tests and one offline build script are untriaged, and CodeQL failed on PR #109
- `npx playwright install --with-deps` has no step timeout; it hung E2E on `559bd72` until the 60-minute job limit
- Mobile menu: tapping the current page leaves the panel open (07 review WR-06)
- Small leftovers: `TILT_CONFIG` and the test-only `cssDuration` and `cssEase`, the unused `next.config` images block and service-worker `/_next/image` branch, commented CI steps, a `dns-prefetch` to vercel.com
- Deferred with an owner: R3F `THREE.Clock` warning (upstream), `caniuse-lite` refresh (needs Tim), 08 review CR-01 (D-12)

<details>
<summary>Pre-v2.0 UI audit</summary>

UI audit (2026-10-10, the starting point for v2.0):
- v1.0 tokens reach only Home, nav and Projects index; Photos, Project detail, Roadmap, Contact use stock Tailwind blue/cyan/purple/pink/gray — 29 files with stock palette classes
- 23 files use `dark:` variants keyed to `prefers-color-scheme`, so light-OS visitors see white pages despite the dark-only decision; the v1.0 "WCAG AA verified" claim does not hold for that path (Contact h1 is `text-gray-900` on a dark mesh — `app/contact/page.tsx:26`)
- Placeholder identity: "Welcome to My Portfolio", "P + ortfolio" wordmark, "My Portfolio" footer, links to github.com / linkedin.com / your.email@example.com
- Two nav components (`GlassmorphismNav` on Home, `Header` elsewhere) with duplicated link arrays
- Hero mountain is a procedural sine mesh, not the Matterhorn; `DualParticleSystem` hexagons compete with the headline
- Photo EXIF unused (Canon EOS 6D Mark II, EF 24–105 mm f/4L, exposure, GPS on 3 of 4 originals); `captureDate` in `data/landscapes.ts` comes from export filenames (EXIF says 6–7 Sep 2021); waterfall GPS 46.0081 N 7.7385 E 1,715 m points to the gorge south of Zermatt, not the Teufelsschlucht
- Scrollbars hidden globally (`app/globals.css:109–118`); every h1 is JetBrains Mono with a glow text-shadow
- Installed framer-motion 12.35.1; latest is 14.1.0 (24 files import it)

</details>

## Constraints

- **Tech stack**: Keep Next.js, React, Tailwind (as utility layer), Three.js ecosystem
- **Deployment**: Must remain deployable on Vercel
- **Compatibility**: Must work with React 19 and existing 3D component ecosystem
- **Design**: Dark-only site (no light mode toggle needed) — enforced: no `dark:` variants, no OS-theme-dependent styling
- **Design process**: All UI/UX work (specs, components, styling, layout, interaction, a11y) uses the `ui-ux-pro-max` skill — user requirement for v2.0
- **Assets**: Elevation data, fonts and contour assets must be same-origin (committed to `/public` or generated at build) — nonce CSP in `proxy.ts`, no runtime tile fetches
- **Attribution**: swisstopo data requires source attribution in the footer. Shipped in 08-12 as `site.attribution.terrain` (required `string` in the `Site` type): the full verbatim swissALTIRegio "2025 and all subsequent versions" reference (Option A, Tim at 08-04), copied from the live product page on 2026-10-24, shown as "Contours derived from swissALTIRegio. " + the constant, with no "©" prefix
- **Photo rights**: All rights reserved ("© {capture year} Tim Lui"); no download button; full-resolution originals never served publicly
- **Location privacy**: Shipped photo coordinates rounded to 4 decimals (~10 m)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep Tailwind as utility layer | Removing it would be high-effort rewrite; extend with @theme instead | ✓ Good |
| Bugs before CSS | Stable foundation before visual changes prevents compounding issues | ✓ Good |
| Blend organic + digital aesthetic | Matches portfolio content (nature photography + 3D tech) | ✓ Good |
| OKLCH color space | Perceptual uniformity across custom palette | ✓ Good |
| Dark-only site | Simplifies design, matches geological/crystalline aesthetic | ✓ Good |
| Tailwind v4 CSS-first @theme | Deleted v3 config, cleaner CSS custom properties | ✓ Good |
| Nonce-based CSP with strict-dynamic | Strong security without breaking Vercel Analytics | ✓ Good |
| Upstash Redis rate limiting | Persists across serverless deploys (was in-memory before) | ✓ Good |
| THREE.TextureLoader over drei useTexture | Avoids Suspense blocking, enables progressive loading | ✓ Good |
| 0.01ms duration for reduced-motion CSS | Preserves transitionend event compatibility | ✓ Good |
| GeologicalButton replaces ParticleButton | Consistent with crystalline design system | ✓ Good |
| v2.0 direction A "Topographic Survey" over Console / Field Journal | Only direction where photography and engineering share one content source (real terrain, EXIF GPS, trail-grade risk); continues v1.0 contours/easing/OKLCH | ✓ Good — shipped as v2.0; the trail-grade-risk link fell away with CLI_X (D-24) |
| Gallery-black surface inside the photo viewer | Map palette must never color-cast the photographs | ✓ Good — shipped in Phase 10 on the photo page and the lightbox, with gallery contrast pairs in `guard:contrast` |
| Identity: Tim Lui | Replace all placeholder branding and links | ✓ Good — shipped in Phase 7, held by `guard:identity` |
| Delete `/gradient-mesh`, `/particle-buttons`, `/transitions` | Playground pages dilute the portfolio and are linked from Photos | ✓ Good — removed in Phase 7 |
| Retire hex project cards (`hex-clip`, `useHexGrid`) | Two projects don't need a grid; clip-path complicates focus and content | ✓ Good — retired in Phase 11; full-width route panels replace them (ENG-01) |
| Upgrade framer-motion 12 → 14 first, in isolation | Avoid building new motion on an API about to change; isolate regression risk | ✓ Good — `motion` 14.1 in 73880a2; 6 home scroll-50 re-baselines ratified by Tim at Phase 7 UAT |
| Upgrade React 19.3 / Next 16.4 in Phase 7, in isolation | `<ViewTransition>` and `addTransitionType` ship only in React 19.3; R3F 9.8 supports React <19.4; installed node_modules (19.2.4 / 16.1.6) also lag the lockfile — user approved 2026-10-10 | ✓ Good — Next 16.4.2 + React 19.3.1 in fdeb9fe (security release); 6 offline re-baselines ratified at Phase 7 UAT |
| Build-time DEM + EXIF pipeline (d3-contour, exif-reader + sharp) | Zero client cost, same-origin assets, typed data | ✓ Good — shipped in Phase 8; generators ESLint-fenced into `scripts/`, every output byte-checked offline in lint |
| Platform APIs over libraries (View Transitions, CSS scroll-driven animations); skip GSAP | 0 KB client cost; GSAP would duplicate Motion | ✓ Good — Phase 10: React `<ViewTransition>` drives the thumbnail morph and the view crossfade, justified rows are built in-house, and no layout or lightbox library was added |
| swissALTIRegio (10 m) instead of swissALTI3D | swissALTI3D lacks the Italian side south of the summit (10 tiles); Regio is hole-free across the border and ample for a 512² heightmap — user decision 2026-10-10 | ✓ Good — 11 × 11 km extent (Tim: "defaults", 08-04) aligned to the COG grid, no resampling, no holes |
| Film-scan photo without GPS gets a hand-placed "approx." pin | Keeps all 4 photos on the map and ascent without inventing precision | ✓ Good — Riffelsee north-shore pin (±100 m) approved by Tim at 08-10; dashed footer tick |
| Move GPS-bearing originals (194 MB) out of `/public` | They were publicly downloadable at full resolution with GPS EXIF | ✓ Good — 08-02 (gitignored `assets/photos-original/`), enforced by the 08-09 served-image guard |
| `/photos` opens on the Map view | User preference: lead with the most distinctive view; Grid and Carousel one click away | ✓ Good — Phase 10; `?view=` set via `router.replace`, so switching adds no history entries |
| Deleted playground routes resolve to the designed 404 (no redirects) | No known inbound links | ✓ Good — Phase 7 shell 404 |
| Coordinates rounded to ~10 m and shown in the lightbox | Useful context without exposing more precision than needed | ✓ Good — rounding in Phase 8 (4 dp at extraction, `Coord4` schema, CI-checked); shown in the Phase 10 EXIF strip |
| Photos "all rights reserved" | Supports licensing enquiries via Contact | ✓ Good — Phase 10 rights line on every photo, no download button; right-click and Save image left alone |
| Add photo deep links + full lightbox, and SEO/link previews to scope | Research gaps G1–G3, G2; users expect shareable photo URLs and per-page previews | ✓ Good — deep links and lightbox in Phase 10; per-route metadata, per-slug OG cards, sitemap and robots in Phase 12 (SEO-01 to SEO-03) |
| Previous/next in the lightbox and on the photo page use `history.replaceState` | Stepping must add no history entries, so Back always closes the lightbox (Tim's OQ1 answer, "A: replaceState both", 2026-10-26) | ✓ Good — Phase 10 |
| Zoomed-photo drag prevention kept as an exception to "no right-click or drag blocking" (LBOX-07 / UI-SPEC) | On the 1:1 zoomed photo a mouse drag pans the stage; right-click, Save image and fitted drag stay native (Tim: "Keep, record exception") | Accepted (Phase 10) |
| Wide map plate 240 → 256 px with nowrap title and altitude; plate clearance a 16 px dot square | The Linux CI render wrapped the longest title inside 224 px; the 16 px square reproduces the UI-SPEC 312 px compact floor (Tim, 10-13) | Accepted (Phase 10) — approved UI-SPEC deviations |
| Defer "Ask about this photo" and terminal step controls/transcript | Not needed for v2.0; the demo still gets a WCAG 2.2.2 pause control | Deferred — still open as PHOTO-F1 and ENG-F1 |
| Zero-diff exception policy for upgrades | A screenshot diff that is a verified upstream bug fix matching the code's intent may be re-baselined, with Tim's explicit approval, a documented reason and per-slug checks (Phase 7) | ✓ Good — 3 exceptions (motion 14, Next 16.4 SWC, Chromium 156) ratified at Phase 7 UAT |
| Visual baselines come only from the CI `workflow_dispatch` container; only Tim commits PNGs | Linux-rendered, reproducible baselines; a human reviews every pixel change (Phase 7) | ✓ Good |
| R3F canvases render only through `SafeCanvas` | R3F ≥ 9.8 rethrows WebGL-creation errors through React; the error boundary keeps pages up (Phase 7) | ✓ Good |
| Phase work lives on `gsd/phase-NN-*` branches; Tim merges to `main` | `main` is protected for executors (Phase 7) | ⚠️ Revisit — the merge convention held, but the v2.0 audit found `main` has no branch protection or required checks |
| Leave public git history as is (D-12): GPS-bearing originals at 287c2e9 (deleted in 347d8e1) and full-res copies at 8fa0991 stay reachable in history | Tim accepted the exposure; no history rewrite or force-push; a git filter-repo purge stays possible later as a separate step Tim runs | Accepted (Phase 8) — re-raised as code-review CR-01, recorded as deferred under D-12 |
| Phase 8 branch stacked on the unmerged Phase 7 tip | `origin/main` lacked Phase 7 and the Phase 8 plans; Tim chose "Stack on HEAD" and sequential execution (2026-10-24) | ✓ Good — all stacked phases merged together in PR #109 |
| Photo heights from the DEM, not EXIF altitude (D-17) | One consistent surface for footer, altimeter and terrain; EXIF altitude is noisy (gorge photo DEM 1,668 m vs GPS 1,715 m) | ✓ Good — `lowestDemM` 1,617 m starts the altimeter rail |
| Meteorological seasons for photo tags; capture year only for the film scan | September photos read "autumn"; the 2020 scan date never surfaces (Tim approved at 08-10) | ✓ Good |
| Hillshade poster: NW light 315°/45° + 270°/55°, linear gamma | Tim approved the poster as rendered (08-06) after seeing the light/mid-grey trade-off; tuning stays in the `HILLSHADE` block | ✓ Good |
| Frame-budget decline under automation: tests opt in to a measure-only flag (`window.__ascentBudgetMeasureOnly`); one real-decline e2e keeps the real budget | CI runners cannot hold the 50 ms median, but the poster fallback must stay tested; real visitors are unaffected (Tim, 09-11 and 09-13) | ✓ Good — Phase 9 |
| HOME-08 measured as total JS after the canvas is ready plus mobile LCP ("total-keep") | The canvas chunk arms before the load event on the HOME-08 profile, so an initial/late split measures nothing (Tim, 09-13) | ✓ Good — 444,761 ≤ 468,770 B; LCP 3,112 ≤ 4,692 ms |
| A frame-budget downgrade lasts the session (module-level, until a full reload) | Simpler than re-probing on every mount; documented in the JSDoc (IN-05, Tim: "Keep sticky, document") | Accepted (Phase 9) |
| Altimeter rail in its own sticky aria-hidden layer after the track | The hero scrim painted over the rail at 768–1023 px (1.3–2.5:1), and no z-index inside the sticky stage could escape it (G-09-4, Tim's option B) | ✓ Good — Phase 9 gap closure |
| Compact summit plaque except on landscape 1100–1943 px stages, and only with motion-safe; 3D summit framing fits the pins into the clear rectangles around the plaque | The fixed-pixel plaque covered pins on short, portrait-tablet and 768–1069 px stages (G-09-2, Tim: "Compact plaque + measured 3D") | ✓ Good — Phase 9 gap closure |
| box and coin-flip replace both CLI_X projects (D-22) | CLI_X is discontinued; Tim at the 11-02 checkpoint: "Both CLI_X projects out" (2026-11-01) | ✓ Good — Phase 11 re-planned (11-02 to 11-18) and shipped; ENG-03 dropped with it (D-24) |
| coin-flip is private: no repository link, summarised in general terms, no defect ids or internals in the public `.planning` (D-12, D-23, D-30) | The portfolio repo and its planning docs are public | ✓ Good — Phase 11 shows "Source: private repository · Ask for a walkthrough" |
| Every metric claim audited: sourced or softened (D-09, D-28) | Honest metrics; Tim approves every figure and wording | ✓ Good — Phase 11; coin-flip's "0 network calls" was softened out of the strip, and box source links are named after their tile (G-11-4, 11-19) |
| Phase 11 branch stacked on the unmerged Phase 10 tip | `origin/main` still lacked Phases 7 to 10; Tim chose "Stack on Phase 10 tip" and sequential execution (2026-11-01) | ✓ Good — all stacked phases merged together in PR #109 |
| Static-poster pin cases accepted as decorative: waypoint 3's label hidden at about 768–1090 px (D-09 amended), the portrait-phone summit (pin 4 and the triangle past the edges), landscape phones (pin 3 under the compact plaque) and reduced motion (full plaque over the pins at 375 × 667) | Poster pins keep fixed plan-view positions (D-16); live 3D is unaffected | Accepted at Phase 9 UAT (round 2) |
| One canonical host, `site.url` (D-13), a required `Site` field that feeds `metadataBase`, every canonical, the sitemap and robots (12-09) | One constant instead of host strings per route; the `data/site.ts` comment cites D-13's costly reversibility, since a host change moves every canonical and OG URL | ✓ Good — `https://www.tlui.de` since quick 261105-wty; Tim chose "www.tlui.de" on 2026-11-02; the live miss-path retest passed on 2026-11-05 (Phase 12 deferred-items.md row) |
| Unknown photo and project slugs: a server-rendered 404 through a `proxy.ts` rewrite, then a proxy self-fetch of the neutral `/<section>/_` 404 so the typed slug stays out of the response, script data included (12-02 and its follow-up: b32eb35, 67970b3, d9df0bf) | HTTP 404 with the D-11 section link; Next writes the request URL into the flight payload, which no rewrite can change. Tim on the no-echo check: "cover script data too"; on pinning the self-fetch to loopback and Vercel hosts: "A"; on scrubbing other 404s: "Leave as is (Recommended)" | ✓ Good — a fetch failure or any other host falls back to the plain rewrite (still a 404, slug back in flight data); the self-fetch on a deployed preview is a 12-24 UAT item |
| CSP built by a tested `buildCsp`: `upgrade-insecure-requests` dropped only for http on loopback (D-17 condition), `connect-src 'self'`, `'unsafe-eval'` only under `next dev`, GitHub raw-content origin dropped (12-02) | Local WebKit can load the production build; a fresh build has no `eval(` or `new Function(` in any chunk; Tim acknowledged info.csp without veto (12-01) | ✓ Good — the live production header is a 12-24 UAT item |
| Network-first service worker: navigations stored only when ok, basic and not redirected; `/offline` precached with its assets; one reload per tab on update, never with a dirty field (12-08) | No visitor sees stale v1 pages after a deploy (EDGE-02); sw.reload-once = yes and vercel.plan = Hobby (no Skew Protection) from 12-01 | ✓ Good — the hero contour joined the install precache in 12-30 |
| One shared static OG template (Satori/next-og) with committed full OFL font instances and token hexes; per-slug photo and project cards keep rendering on first request with per-slug alt (12-10, 12-14) | Fonts read from disk at build, never served; the latin subset lacks the U+2192 arrow. Prerendering per-slug cards broke under Next 16.4, and Tim chose "Keep runtime render (Recommended)" over a generic alt (12-19) | ✓ Good — default card prerendered at `/opengraph-image`; per-slug cards route-cached after the first request |
| WebKit in CI next to Chromium and Firefox, with `--fail-on-flaky-tests` and retries unchanged; per-platform WebKit tags with reason comments, never `test.skip` (12-23) | Playwright's Linux and Windows WebKit fail different tests; one engine-wide tag would hide passing coverage. Tim on the re-baseline: "No round 3" | ✓ Good — green on 147bc82 (run 41571031827, 501 + 432 + 430, 0 flaky); real Safari stays a hand check |
| Permanent production audit gate: axe, CLS, CSP events, console and page errors, images and same-origin links on every route at three widths and in 9 states (12-20) | VERIFY-02 and VERIFY-04 as one spec that fails CI on any finding, not a one-off audit | ✓ Good — 54/54 in three engines with zero findings; no app change needed |
| Package and D-25 hygiene (12-06) | Tim: zod "Approve (Recommended)"; fflate "Approve scoped (Recommended)"; THREE.Clock warning "Defer (Recommended)"; Home canvas arm after the load event "Canvas fix" | ✓ Good — zod 4.6.7, fflate 0.8.3 and 0.6.11 overrides, npm audit 46 → 44 |
| Phase 12 reached production before the merge: Tim promoted the `53171db` preview so 12-UAT test 6 could check the real site (2026-11-05) | `/gsd-ship` only accepts a passed verification, and test 6 needed production | Production passed test 6. PR #109 merged as `559bd72` the same day, so production deploys from `main` again |
| Two keyboard findings accepted unfixed at 12-UAT test 3 (Tim: "pass", 2026-11-05) | Focus can land off-screen after stepping in the lightbox then pressing Escape in short windows; the 375 px mobile menu clips the sides of the focus ring | Accepted; root cause of the Escape case not diagnosed |
| Ship Phases 7-12 as one milestone PR, not six stacked PRs (2026-11-05) | Tim: "One milestone PR (Recommended)"; planning docs cite SHAs, so it merged with a merge commit | ✓ Good — PR #109, merge commit `559bd72` |
| Close v2.0 carrying its tech debt instead of adding a cleanup phase (2026-11-05) | All active requirements met and the site is live; Tim chose option A after the audit | Override closeout: Phases 7-11 read `stale` and 18 open artifacts were acknowledged. The debt is listed under Context |
| v2.1 photo series are grouped by region, not by trip or theme (2026-11-12) | Tim's choice at milestone start; Zermatt becomes the first region and grows | — Pending |
| Alps-wide contour overview plus one local terrain plate per region (2026-11-12) | Keeps the Matterhorn map model per region while the album spans the Alps (Tim: "Overview + local") | — Pending |
| Home ascent stays the Matterhorn with its four waypoints (2026-11-12) | The Matterhorn remains the site's signature; Home links to the wider album | — Pending |
| Drone video: one silent, same-origin loop per region page, in a slot near the header; films with sound deferred (2026-11-12, after research) | Loops reuse the clip pipeline and need no CSP change; films can't be self-hosted on Vercel Hobby (100 GB/month shared transfer, 30-day pause on overrun) | — Pending |
| v2.1 launch regions stay inside the swissALTIRegio footprint (2026-11-12) | Its Italian and Austrian fill (TINITALY, DGM Österreich) is already credited, so local plates need no second source, library or credit; regions further east are deferred (DATA-F1) | — Pending |
| Photo URLs stay `/photos/<slug>`; regions get their own pages on a non-colliding path (2026-11-12) | No redirects, every existing link and OG card keeps working, and the lightbox intercept and proxy 404 handling stay as they are (Tim chose this over nesting photos under regions) | — Pending |
| The Map/Grid/Carousel view switch is retired; the overview and region pages replace it (2026-11-12) | The Carousel was built for 4 photos; old `?view=` URLs land on the matching new page and their tests are rewritten, not deleted; a Grid toggle is deferred (REGION-F2) | — Pending |
| Data credits: a short credit in each map's sheet margin plus a `/sources` page linked from the footer (2026-11-12) | The footer can't change per page on client navigation, and Copernicus needs its full notice | — Pending |
| JSON-LD without `license`; per-photo coarser location override (2026-11-12) | No image-rights page in v2.1; new photos and drone take-off points near homes can be shown coarser than 4 decimals | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-12 after starting milestone v2.1 Survey Expansion*
