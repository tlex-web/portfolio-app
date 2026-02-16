# Portfolio App — Stabilization & Visual Identity

## What This Is

A personal portfolio web application built with Next.js and React, showcasing projects and landscape photography through interactive 3D visualizations. This milestone focuses on fixing documented bugs and tech debt, then creating a distinctive custom visual identity that blends organic/nature aesthetics with digital/tech elements.

## Core Value

A portfolio that is visually memorable and distinctive — not another generic Tailwind site — while being stable and well-maintained under the hood.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from existing codebase. -->

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

### Active

<!-- Current scope. Building toward these. -->

- [ ] Resolve peer dependency conflicts and remove legacy-peer-deps workaround
- [ ] Fix in-memory rate limiting (resets on deploy, doesn't scale)
- [ ] Fix service worker cache versioning (hardcoded 'v1', no invalidation)
- [ ] Fix silent email sending failures in feedback form
- [ ] Replace `any` types with proper TypeScript types
- [ ] Fix missing optimized images pipeline (images referenced but not generated)
- [ ] Improve Content Security Policy (reduce unsafe-inline/eval)
- [ ] Add environment variable validation at startup
- [ ] Add CSRF protection for feedback endpoint
- [ ] Custom typography and color palette — organic-meets-digital aesthetic
- [ ] Redesigned navigation/header — distinctive, not standard horizontal nav
- [ ] Custom card/project tile components — beyond default rounded rectangles
- [ ] Cohesive design system layer that ties 3D elements to surrounding UI

### Out of Scope

- Full Tailwind removal — keep Tailwind as utility layer, build custom on top
- Mobile app — web-first portfolio
- Database/persistent storage for feedback — defer to future milestone
- Error monitoring (Sentry) — defer to future milestone
- Performance test suite — defer to future milestone
- 3D component refactoring (shader extraction) — defer unless needed for CSS work

## Context

The codebase is a Next.js 16 App Router application with React 19, deployed on Vercel. It features heavy use of Three.js for 3D visualizations (15+ 3D components) alongside standard UI components styled with Tailwind CSS.

A comprehensive codebase concerns audit (`.planning/codebase/CONCERNS.md`) documents all known bugs, tech debt, security issues, and performance bottlenecks. This audit is the primary input for the stabilization work.

The visual identity problem: Tailwind's defaults produce a recognizable "Tailwind look" — the 3D components are distinctive, but the navigation, cards, typography, and color palette feel generic and forgettable. The goal is a unified aesthetic where the UI feels as intentional as the 3D work.

Design direction: "Nature rendered through a digital lens" — organic shapes, earthy tones meeting sharp tech edges, glowing accents. The landscape photography and mountain terrain content should inform the visual language of the entire site.

## Constraints

- **Tech stack**: Keep Next.js, React, Tailwind (as utility layer), Three.js ecosystem
- **Deployment**: Must remain deployable on Vercel
- **Compatibility**: Must work with React 19 and existing 3D component ecosystem
- **Approach**: Bugs and stability first, then visual customization

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep Tailwind as utility layer | Removing it would be high-effort rewrite with no benefit; extend instead | — Pending |
| Bugs before CSS | Stable foundation before visual changes prevents compounding issues | — Pending |
| Blend organic + digital aesthetic | Matches portfolio content (nature photography + 3D tech) | — Pending |

---
*Last updated: 2026-02-16 after initialization*
