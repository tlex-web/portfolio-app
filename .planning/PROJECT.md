# Portfolio App

## What This Is

A personal portfolio web application built with Next.js and React, showcasing projects and landscape photography through interactive 3D visualizations. Features a distinctive "Swiss Alps" crystalline design system with geological depth effects, glassmorphism navigation, hexagonal project cards, and progressive 3D texture loading — all with full reduced-motion accessibility support.

## Core Value

A portfolio that is visually memorable and distinctive — not another generic Tailwind site — while being stable and well-maintained under the hood.

## Current Milestone: v2.0 Topographic Identity

**Goal:** Rebuild the whole UI around the real Matterhorn terrain so Tim Lui's photography and engineering read as one Swiss "topographic survey" — on a single enforced design system, without visual regressions.

**Target features:**
- Foundation & guardrails: Playwright screenshot baselines, tokens v2, zero `dark:` variants / stock Tailwind palette classes (lint-enforced), one `SiteNav` in a shared `(site)` layout, "Tim Lui" identity with real links, visible scrollbar, contact contrast fix, framer-motion 12 → 14 upgrade in isolation
- Data & terrain pipeline: swisstopo swissALTI3D DEM → heightmap + contour SVG (d3-contour) at build time, EXIF → typed photo data (exif-reader + sharp), corrected capture dates and waterfall location, typed project highlight schemas
- Home "ascent": real Matterhorn terrain with contour-line shader (R3F), altimeter rail 1,626 m → 4,478 m, photo waypoints placed by EXIF GPS/altitude, Swiss trail-sign routes, static fallback for reduced motion / no WebGL
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

### Active

<!-- Current scope. Building toward these in v2.0. -->

- [ ] One enforced design system across every page (tokens v2, no `dark:` variants, no stock palette classes)
- [ ] Real identity (Tim Lui) and real contact/social links everywhere
- [ ] Real Matterhorn terrain hero with scroll "ascent" and photo waypoints
- [ ] Photography experience driven by real EXIF data (map, grid, carousel, lightbox)
- [ ] Engineering case studies with trail-grade risk visualization
- [ ] Route-log roadmap, summit-register contact, designed edge pages
- [ ] Playground routes and dead code removed
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
Deployed on Vercel with Upstash Redis for rate limiting.

Design system: "Swiss Alps" crystalline aesthetic — 30 OKLCH tokens across 8 color families (alpine, granite, snow, frost, ember, pine, rust, amber), geological depth shadows (stratum-1/2/3), hex grid layouts, scroll-linked glow intensity.

Known tech debt:
- Old image variants (-thumb/-medium/-large) still in repo, unused
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
- **Attribution**: swisstopo data requires source attribution ("© swisstopo") in the footer

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
| Identity: Tim Lui | Replace all placeholder branding and links | — Pending |
| Delete `/gradient-mesh`, `/particle-buttons`, `/transitions` | Playground pages dilute the portfolio and are linked from Photos | — Pending |
| Retire hex project cards (`hex-clip`, `useHexGrid`) | Two projects don't need a grid; clip-path complicates focus and content | — Pending |
| Upgrade framer-motion 12 → 14 first, in isolation | Avoid building new motion on an API about to change; isolate regression risk | — Pending |
| Build-time DEM + EXIF pipeline (d3-contour, exif-reader + sharp) | Zero client cost, same-origin assets, typed data | — Pending |
| Platform APIs over libraries (View Transitions, CSS scroll-driven animations); skip GSAP | 0 KB client cost; GSAP would duplicate Motion | — Pending |

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
*Last updated: 2026-10-10 at start of v2.0 Topographic Identity milestone*
