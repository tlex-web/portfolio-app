# Portfolio App

## What This Is

A personal portfolio web application built with Next.js and React, showcasing projects and landscape photography through interactive 3D visualizations. Features a distinctive crystalline/geological design system that blends organic nature aesthetics with digital tech elements.

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
- ✓ Clean dependency tree compatible with React 19 (no legacy-peer-deps) — v1.0
- ✓ Image optimization pipeline (AVIF/WebP/JPEG at 640/1024/1920) — v1.0
- ✓ TypeScript types replacing documented `any` types — v1.0
- ✓ Nonce-based CSP removing unsafe-inline from script-src — v1.0
- ✓ CSRF protection for feedback endpoint — v1.0
- ✓ Redis-backed rate limiting persisting across deployments — v1.0
- ✓ Build-hash service worker cache invalidation — v1.0
- ✓ Swiss Alps OKLCH color palette with WCAG AA contrast verification — v1.0
- ✓ Custom typography system (display + body fonts) — v1.0
- ✓ Glassmorphism navigation with scroll-progressive effects — v1.0
- ✓ Crystalline hexagonal project cards with tilt/parallax hover — v1.0
- ✓ Geological button effects (fracture, dust, ripple) — v1.0
- ✓ Scroll-linked glow bridge connecting 2D UI to 3D components — v1.0
- ✓ Progressive texture loading for 3D photo carousel — v1.0
- ✓ Reduced-motion gating across all animated components — v1.0

### Active

- [ ] Environment variable validation at startup (Zod)
- [ ] Graceful email delivery failure handling with retry queue
- [ ] Dark/light mode toggle with system preference detection

### Out of Scope

- Full Tailwind removal — keep as utility layer, build custom on top
- Mobile app — web-first portfolio
- Database/persistent storage for feedback — defer to future milestone
- Error monitoring (Sentry) — separate infrastructure concern
- Performance test suite — defer to future milestone
- Full offline functionality — service worker caching sufficient

## Context

Shipped v1.0 with Next.js 16 App Router, React 19, deployed on Vercel. The codebase features 15+ Three.js 3D components alongside a custom crystalline/geological design system built on top of Tailwind CSS.

Tech stack: Next.js 16, React 19, Tailwind CSS v4 (OKLCH tokens), Three.js/React Three Fiber, Framer Motion, Upstash Redis, Resend.

241 files changed, ~35k lines added across the v1.0 milestone. 183 commits total.

## Constraints

- **Tech stack**: Keep Next.js, React, Tailwind (as utility layer), Three.js ecosystem
- **Deployment**: Must remain deployable on Vercel
- **Compatibility**: Must work with React 19 and existing 3D component ecosystem

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep Tailwind as utility layer | Removing it would be high-effort rewrite with no benefit; extend with OKLCH tokens | ✓ Good |
| Bugs before CSS | Stable foundation before visual changes prevents compounding issues | ✓ Good |
| Blend organic + digital aesthetic | Matches portfolio content (nature photography + 3D tech) | ✓ Good — crystalline/geological system well-received |
| OKLCH color space for tokens | Better perceptual uniformity than hex/HSL, native CSS support | ✓ Good |
| useSyncExternalStore for reduced motion | Eliminates hydration race vs useState+useEffect pattern | ✓ Good |
| Nonce-based CSP via middleware proxy | Secure without breaking React inline styles | ✓ Good |

---
*Last updated: 2026-04-02 after v1.0 milestone*
