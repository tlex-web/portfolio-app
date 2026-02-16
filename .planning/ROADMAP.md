# Roadmap: Portfolio App — Stabilization & Visual Identity

## Overview

This milestone stabilizes the portfolio codebase (dependency conflicts, security gaps, reliability issues, type safety) and then builds a distinctive visual identity on top of the stable foundation. The work flows from cleaning up the base (dependencies, types) through hardening infrastructure (security, reliability) to defining design tokens, implementing custom components, and finishing with performance polish. Each phase delivers a coherent, verifiable capability that unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Dependency Resolution & Code Quality** - Clean dependency tree and proper TypeScript types across the codebase
- [ ] **Phase 2: Security & Reliability Hardening** - CSP, CSRF, persistent rate limiting, and service worker cache invalidation
- [ ] **Phase 3: Design Foundation** - Custom color palette, typography system, and accessibility-verified design tokens
- [ ] **Phase 4: Design Components** - Distinctive navigation, project cards, micro-interactions, and glowing accent system
- [ ] **Phase 5: Performance & Accessibility Polish** - Progressive 3D texture loading and consistent reduced-motion support

## Phase Details

### Phase 1: Dependency Resolution & Code Quality
**Goal**: The codebase has a clean dependency tree compatible with React 19 and proper TypeScript types everywhere, with optimized images generated as part of the build
**Depends on**: Nothing (first phase)
**Requirements**: DEPS-01, DEPS-02, QUAL-01, QUAL-02
**Success Criteria** (what must be TRUE):
  1. Running `npm install` succeeds without `--legacy-peer-deps` flag and produces zero peer dependency warnings
  2. The `.npmrc` file no longer contains `legacy-peer-deps=true` and CI builds pass without it
  3. All previously documented `any` types (ParticleButton, MountainTerrain3D, ProjectHighlights, feedback test) are replaced with specific TypeScript types and `npm run typecheck` passes
  4. Running the build generates optimized images automatically -- `optimize-images.mjs` executes as a pre-build step and optimized image files exist in the output
**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Remove legacy-peer-deps and replace all any types
- [ ] 01-02-PLAN.md — Image optimization pipeline with AVIF, responsive sizes, and prebuild hook

### Phase 2: Security & Reliability Hardening
**Goal**: The application has proper security boundaries and infrastructure that persists across serverless deployments
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02, REL-01, REL-02
**Success Criteria** (what must be TRUE):
  1. Page responses include a Content-Security-Policy header with nonce-based script allowlisting -- `unsafe-inline` and `unsafe-eval` are removed (or reduced to the minimum required by Three.js)
  2. Submitting the feedback form from a different origin (cross-site) is rejected with a CSRF validation error
  3. Rate limiting persists after a new deployment -- hitting the rate limit, redeploying, and retrying still shows the user as rate-limited (not reset)
  4. After a new deployment, the service worker cache version changes automatically -- stale cached assets are invalidated without manual intervention
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Design Foundation
**Goal**: The site has a defined visual language -- custom colors and typography that express the organic-meets-digital aesthetic -- verified for accessibility
**Depends on**: Phase 1 (clean dependency tree for any new packages)
**Requirements**: DSGN-01, DSGN-02, DSGN-03
**Success Criteria** (what must be TRUE):
  1. Tailwind `@theme` defines a custom color palette with organic earthy tones and digital accent colors -- these colors appear in the rendered site replacing default Tailwind palette usage
  2. A custom typography system is applied site-wide -- a nature-inspired display font for headings and a readable body font, with a visible hierarchy across heading levels, body text, and captions
  3. Every custom color combination used for text-on-background passes WCAG AA contrast ratios (4.5:1 body, 3:1 large text) -- verified by automated contrast checking
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Design Components
**Goal**: The portfolio has a distinctive, memorable visual identity -- custom navigation, project cards, organic micro-interactions, and glowing accents that connect the 2D UI to the existing 3D components
**Depends on**: Phase 3 (design tokens must exist before components reference them)
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. The site navigation uses a distinctive interaction pattern (not a standard horizontal nav bar) that works on both desktop and mobile viewports
  2. Project cards and tiles have a custom visual style reflecting the organic-meets-digital aesthetic -- visually distinct from default Tailwind rounded rectangles
  3. Interactive elements (buttons, cards, nav items) have biophilic micro-interactions -- organic easing curves and nature-inspired hover/click effects that are visible during normal browsing
  4. Glowing accents and depth effects are present on UI elements, creating a visible visual connection between the 2D interface and the existing 3D components (terrain, carousel)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Performance & Accessibility Polish
**Goal**: 3D content loads efficiently with progressive enhancement, and all animations respect user motion preferences
**Depends on**: Phase 4 (all animated components and 3D integration must be complete)
**Requirements**: PERF-01, PERF-02
**Success Criteria** (what must be TRUE):
  1. The PhotoCarousel3D loads visible and adjacent image textures first, with remaining textures lazy-loaded -- navigating to the carousel shows content quickly rather than waiting for all textures
  2. Low-resolution placeholders are visible while full textures load in the PhotoCarousel3D, preventing layout shifts and blank spaces
  3. Enabling "Prefer reduced motion" in OS settings disables all micro-interactions, 3D animations, and particle effects across the entire site -- the site remains fully functional but static
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Dependency Resolution & Code Quality | 0/2 | Planned | - |
| 2. Security & Reliability Hardening | 0/? | Not started | - |
| 3. Design Foundation | 0/? | Not started | - |
| 4. Design Components | 0/? | Not started | - |
| 5. Performance & Accessibility Polish | 0/? | Not started | - |
