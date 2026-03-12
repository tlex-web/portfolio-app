# Portfolio App — Stabilization & Visual Identity

## What This Is

A personal portfolio web application built with Next.js and React, showcasing projects and landscape photography through interactive 3D visualizations. Features a distinctive "Swiss Alps" crystalline design system with geological depth effects, glassmorphism navigation, hexagonal project cards, and progressive 3D texture loading — all with full reduced-motion accessibility support.

## Core Value

A portfolio that is visually memorable and distinctive — not another generic Tailwind site — while being stable and well-maintained under the hood.

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

<!-- Current scope. Building toward these in next milestone. -->

(None yet — define with `/gsd:new-milestone`)

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

## Constraints

- **Tech stack**: Keep Next.js, React, Tailwind (as utility layer), Three.js ecosystem
- **Deployment**: Must remain deployable on Vercel
- **Compatibility**: Must work with React 19 and existing 3D component ecosystem
- **Design**: Dark-only site (no light mode toggle needed)

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

---
*Last updated: 2026-03-12 after v1.0 milestone*
