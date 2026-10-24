# Portfolio App

## What This Is

A personal portfolio web application built with Next.js and React, showcasing projects and landscape photography through interactive 3D visualizations. Since v2.0 Phase 7, every page renders inside one dark, token-driven site shell (tokens v2, a single `SiteNav`, Tim Lui's real identity) behind CI guardrails for visual regressions, deleted tests and off-system styling. The v1.0 "Swiss Alps" crystalline pieces (geological depth effects, hexagonal project cards, progressive 3D texture loading) remain on pages v2.0 has not rebuilt yet. Everything supports reduced motion.

## Core Value

A portfolio that is visually memorable and distinctive — not another generic Tailwind site — while being stable and well-maintained under the hood.

## Current Milestone: v2.0 Topographic Identity

**Goal:** Rebuild the whole UI around the real Matterhorn terrain so Tim Lui's photography and engineering read as one Swiss "topographic survey" — on a single enforced design system, without visual regressions.

**Target features:**
- Foundation & guardrails: Playwright screenshot baselines, tokens v2, zero `dark:` variants / stock Tailwind palette classes (lint-enforced), one `SiteNav` in a shared `(site)` layout, "Tim Lui" identity with real links, visible scrollbar, contact contrast fix, framer-motion 12 → 14 upgrade in isolation, React 19.2 → 19.3 / Next 16.2 → 16.4 upgrade in isolation (prerequisite for `<ViewTransition>`)
- Data & terrain pipeline: swisstopo swissALTIRegio (10 m, cross-border) DEM → 16-bit heightmap + contour SVG (d3-contour) at build time, originals moved out of `/public`, EXIF → typed photo data (exif-reader + sharp), corrected capture dates and waterfall location, typed project highlight schemas
- Home "ascent": real Matterhorn terrain with contour-line shader (R3F), altimeter rail 1,617 m → 4,478 m, photo waypoints placed by EXIF GPS with DEM-sampled heights (D-17), Swiss trail-sign routes, static fallback for reduced motion / no WebGL
- Photography: dark light table with Map / Grid / Carousel views, gallery-black lightbox with EXIF strip and hotspot callouts, View Transitions thumbnail → lightbox
- Engineering & roadmap: project route panels (hex cards retired), case-study template, CLI_X risk bands shown as Swiss trail grades (T1 yellow / T2–T3 white-red-white / T4–T5 white-blue-white / unmarked), terminal restyled to tokens, route-log roadmap
- Contact, edge pages & cleanup: summit-register contact page, "off the marked trail" 404/offline/error, delete `/gradient-mesh` `/particle-buttons` `/transitions`, remove dead code, axe + cross-browser verification

**Reference:** Approved plan with audit, mockups and tooling metrics — https://claude.ai/artifact/GXsHFNbtf7Qp6hPSYxuY8U

## Requirements

### Validated

- ✓ Portfolio site with project showcase and detail pages — existing
- ✓ 3D landscape/mountain terrain visualizations — existing
- ✓ Interactive photo carousel with 3D effects — existing
- ✓ Hologram terminal component — existing
- ✓ Particle button effects and animations — existing
- ✓ Feedback/contact form with email delivery via Resend — existing
- ✓ Service worker for offline caching — existing
- ✓ Responsive layout with Tailwind CSS — existing
- ✓ Vercel Analytics and Speed Insights integration — existing
- ✓ CI/CD pipeline with lint, typecheck, unit, and E2E tests — existing
- ✓ Peer dependency conflicts resolved (React 19 compatible) — v1.0
- ✓ legacy-peer-deps removed from all configs — v1.0
- ✓ All `any` types replaced with proper TypeScript types — v1.0
- ✓ Image optimization pipeline integrated into build — v1.0
- ✓ Nonce-based CSP removing unsafe-inline — v1.0
- ✓ CSRF token validation on feedback endpoint — v1.0
- ✓ Persistent rate limiting via Upstash Redis — v1.0
- ✓ Service worker cache version from build hash — v1.0
- ✓ Custom OKLCH color palette (Swiss Alps theme) — v1.0
- ✓ Custom typography system (JetBrains Mono + Inter) — v1.0
- ✓ WCAG AA contrast verified for all color combinations — v1.0
- ✓ Distinctive glassmorphism navigation — v1.0
- ✓ Hexagonal crystalline project cards — v1.0
- ✓ Biophilic micro-interactions with geological easing — v1.0
- ✓ Glowing accents connecting 2D UI to 3D components — v1.0
- ✓ Progressive texture loading for PhotoCarousel3D — v1.0
- ✓ Reduced-motion support across all animated components — v1.0
- ✓ One enforced design system across every page (tokens v2, no `dark:` variants, no stock palette classes, lint-enforced) — Phase 7
- ✓ Real identity (Tim Lui) and real contact/social links everywhere — Phase 7
- ✓ CI regression nets: Linux visual baselines for every route in dark and light, test-count ratchet, palette/contrast/jsx-a11y guards — Phase 7
- ✓ Build-time terrain data: swissALTIRegio source raster (May 2026 edition) → hashed 16-bit heightmaps, three contour LODs and a hillshade poster, re-derived offline by `terrain:build --check` in lint — Phase 8
- ✓ Typed, committed photo facts from real EXIF + Tim's corrections + DEM heights (4-dp GPS, year/season tags, approximate film-scan pin), checked for staleness in CI — Phase 8
- ✓ Privacy-safe images: originals out of the repo and site, metadata-free hashed derivatives ≤ 2560 px, served-image guard over every tracked image — Phase 8
- ✓ Typed project highlights with real CLI_X riskScores and the trail-grade band scale — Phase 8
- ✓ Footer map legend (contour band, waypoint ticks, true scale bar, LV95 extent, "Last surveyed", swisstopo attribution) on every route — Phase 8

### Active

<!-- Current scope. Building toward these in v2.0. -->

- [ ] Real Matterhorn terrain hero with scroll "ascent" and photo waypoints
- [ ] Photography experience driven by real EXIF data (map, grid, carousel, lightbox)
- [ ] Engineering case studies with trail-grade risk visualization
- [ ] Route-log roadmap, summit-register contact, designed edge pages
- [ ] Playground routes and dead code removed (playground routes removed and resolving to the designed 404 in Phase 7; dead code, e.g. the unused `GlassmorphismNav.tsx`, remains for Phase 12)
- [ ] No visual or functional regressions (screenshot baselines, tests rewritten not deleted, axe clean)

### Out of Scope

- Full Tailwind removal — keep Tailwind as utility layer, build custom on top
- Mobile app — web-first portfolio
- Database/persistent storage for feedback — defer to future milestone
- Error monitoring (Sentry) — defer to future milestone
- Performance test suite — defer to future milestone
- 3D component refactoring (shader extraction) — defer unless needed for CSS work
- Offline mode — service worker caching sufficient, full offline mode fragile

## Context

Shipped v1.0 with 12,484 LOC TypeScript/CSS across 165 files.
Tech stack: Next.js 16, React 19, Tailwind v4 (CSS-first @theme), Three.js/R3F/drei, Framer Motion.
After v2.0 Phase 7: Next 16.4.2, React 19.3.1, `motion` 14.1 (`motion/react`), R3F 9.8.1, drei 10.7.9, Playwright 1.64, Node 24 with `npm ci` locally, in CI and on Vercel.
Deployed on Vercel with Upstash Redis for rate limiting.

Design system: "Swiss Alps" crystalline aesthetic — 30 OKLCH tokens across 8 color families (alpine, granite, snow, frost, ember, pine, rust, amber), geological depth shadows (stratum-1/2/3), hex grid layouts, scroll-linked glow intensity.

Known tech debt:
- Old image variants (-thumb/-medium/-large, 60 files) still in repo and served — since Phase 8 `data/landscapes.ts` is a bridge that reaches them only through the image manifest (Home LCP, PhotoCarousel3D, GalleryGrid); delete in Phase 12 once Phase 10 moves the photo UI to the hashed derivatives
- Phase 8 code review (08-REVIEW-DISPOSITION.md): 8 open warnings, latent for the current four photos (out-of-extent photo, missing GPS altitude, non-Zurich offset, 0.25–1 s shutter labels, non-atomic `photos:derive`, guard format gaps, README steps, mislabelled corrections) — fold into the first Phase 9/10 plan that adds photo data
- ParticleButton deprecated but retained for demo pages
- SEC-02 (CSRF) traceability was stale in REQUIREMENTS.md but implemented in Phase 2

UI audit (2026-10-10, before v2.0):
- v1.0 tokens reach only Home, nav and Projects index; Photos, Project detail, Roadmap, Contact use stock Tailwind blue/cyan/purple/pink/gray — 29 files with stock palette classes
- 23 files use `dark:` variants keyed to `prefers-color-scheme`, so light-OS visitors see white pages despite the dark-only decision; the v1.0 "WCAG AA verified" claim does not hold for that path (Contact h1 is `text-gray-900` on a dark mesh — `app/contact/page.tsx:26`)
- Placeholder identity: "Welcome to My Portfolio", "P + ortfolio" wordmark, "My Portfolio" footer, links to github.com / linkedin.com / your.email@example.com
- Two nav components (`GlassmorphismNav` on Home, `Header` elsewhere) with duplicated link arrays
- Hero mountain is a procedural sine mesh, not the Matterhorn; `DualParticleSystem` hexagons compete with the headline
- Photo EXIF unused (Canon EOS 6D Mark II, EF 24–105 mm f/4L, exposure, GPS on 3 of 4 originals); `captureDate` in `data/landscapes.ts` comes from export filenames (EXIF says 6–7 Sep 2021); waterfall GPS 46.0081 N 7.7385 E 1,715 m points to the gorge south of Zermatt, not the Teufelsschlucht
- Scrollbars hidden globally (`app/globals.css:109–118`); every h1 is JetBrains Mono with a glow text-shadow
- Installed framer-motion 12.35.1; latest is 14.1.0 (24 files import it)

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
| v2.0 direction A "Topographic Survey" over Console / Field Journal | Only direction where photography and engineering share one content source (real terrain, EXIF GPS, trail-grade risk); continues v1.0 contours/easing/OKLCH | — Pending |
| Gallery-black surface inside the photo viewer | Map palette must never color-cast the photographs | — Pending |
| Identity: Tim Lui | Replace all placeholder branding and links | ✓ Good — shipped in Phase 7, held by `guard:identity` |
| Delete `/gradient-mesh`, `/particle-buttons`, `/transitions` | Playground pages dilute the portfolio and are linked from Photos | ✓ Good — removed in Phase 7 |
| Retire hex project cards (`hex-clip`, `useHexGrid`) | Two projects don't need a grid; clip-path complicates focus and content | — Pending |
| Upgrade framer-motion 12 → 14 first, in isolation | Avoid building new motion on an API about to change; isolate regression risk | ✓ Good — `motion` 14.1 in 73880a2; 6 home scroll-50 re-baselines ratified by Tim at Phase 7 UAT |
| Upgrade React 19.3 / Next 16.4 in Phase 7, in isolation | `<ViewTransition>` and `addTransitionType` ship only in React 19.3; R3F 9.8 supports React <19.4; installed node_modules (19.2.4 / 16.1.6) also lag the lockfile — user approved 2026-10-10 | ✓ Good — Next 16.4.2 + React 19.3.1 in fdeb9fe (security release); 6 offline re-baselines ratified at Phase 7 UAT |
| Build-time DEM + EXIF pipeline (d3-contour, exif-reader + sharp) | Zero client cost, same-origin assets, typed data | ✓ Good — shipped in Phase 8; generators ESLint-fenced into `scripts/`, every output byte-checked offline in lint |
| Platform APIs over libraries (View Transitions, CSS scroll-driven animations); skip GSAP | 0 KB client cost; GSAP would duplicate Motion | — Pending |
| swissALTIRegio (10 m) instead of swissALTI3D | swissALTI3D lacks the Italian side south of the summit (10 tiles); Regio is hole-free across the border and ample for a 512² heightmap — user decision 2026-10-10 | ✓ Good — 11 × 11 km extent (Tim: "defaults", 08-04) aligned to the COG grid, no resampling, no holes |
| Film-scan photo without GPS gets a hand-placed "approx." pin | Keeps all 4 photos on the map and ascent without inventing precision | ✓ Good — Riffelsee north-shore pin (±100 m) approved by Tim at 08-10; dashed footer tick |
| Move GPS-bearing originals (194 MB) out of `/public` | They were publicly downloadable at full resolution with GPS EXIF | ✓ Good — 08-02 (gitignored `assets/photos-original/`), enforced by the 08-09 served-image guard |
| `/photos` opens on the Map view | User preference: lead with the most distinctive view; Grid and Carousel one click away | — Pending |
| Deleted playground routes resolve to the designed 404 (no redirects) | No known inbound links | ✓ Good — Phase 7 shell 404 |
| Coordinates rounded to ~10 m and shown in the lightbox | Useful context without exposing more precision than needed | ◐ Rounding shipped in Phase 8 (4 dp at extraction, `Coord4` schema, CI-checked); lightbox display pending Phase 10 |
| Photos "all rights reserved" | Supports licensing enquiries via Contact | — Pending |
| Add photo deep links + full lightbox, and SEO/link previews to scope | Research gaps G1–G3, G2; users expect shareable photo URLs and per-page previews | — Pending |
| Defer "Ask about this photo" and terminal step controls/transcript | Not needed for v2.0; the demo still gets a WCAG 2.2.2 pause control | — Pending |
| Zero-diff exception policy for upgrades | A screenshot diff that is a verified upstream bug fix matching the code's intent may be re-baselined, with Tim's explicit approval, a documented reason and per-slug checks (Phase 7) | ✓ Good — 3 exceptions (motion 14, Next 16.4 SWC, Chromium 156) ratified at Phase 7 UAT |
| Visual baselines come only from the CI `workflow_dispatch` container; only Tim commits PNGs | Linux-rendered, reproducible baselines; a human reviews every pixel change (Phase 7) | ✓ Good |
| R3F canvases render only through `SafeCanvas` | R3F ≥ 9.8 rethrows WebGL-creation errors through React; the error boundary keeps pages up (Phase 7) | ✓ Good |
| Phase work lives on `gsd/phase-NN-*` branches; Tim merges to `main` | `main` is protected for executors (Phase 7) | ✓ Good |
| Leave public git history as is (D-12): GPS-bearing originals at 287c2e9 (deleted in 347d8e1) and full-res copies at 8fa0991 stay reachable in history | Tim accepted the exposure; no history rewrite or force-push; a git filter-repo purge stays possible later as a separate step Tim runs | Accepted (Phase 8) — re-raised as code-review CR-01, recorded as deferred under D-12 |
| Phase 8 branch stacked on the unmerged Phase 7 tip | `origin/main` lacked Phase 7 and the Phase 8 plans; Tim chose "Stack on HEAD" and sequential execution (2026-10-24) | ✓ Good — merge Phase 7 before Phase 8 when shipping |
| Photo heights from the DEM, not EXIF altitude (D-17) | One consistent surface for footer, altimeter and terrain; EXIF altitude is noisy (gorge photo DEM 1,668 m vs GPS 1,715 m) | ✓ Good — `lowestDemM` 1,617 m starts the altimeter rail |
| Meteorological seasons for photo tags; capture year only for the film scan | September photos read "autumn"; the 2020 scan date never surfaces (Tim approved at 08-10) | ✓ Good |
| Hillshade poster: NW light 315°/45° + 270°/55°, linear gamma | Tim approved the poster as rendered (08-06) after seeing the light/mid-grey trade-off; tuning stays in the `HILLSHADE` block | ✓ Good |

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
*Last updated: 2026-10-24 after Phase 8*
