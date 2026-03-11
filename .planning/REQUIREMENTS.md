# Requirements: Portfolio App — Stabilization & Visual Identity

**Defined:** 2026-02-16
**Core Value:** A portfolio that is visually memorable and distinctive while being stable and well-maintained under the hood.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Dependencies

- [ ] **DEPS-01**: Peer dependency conflicts resolved — all packages compatible with React 19.2.4 without `--legacy-peer-deps`
- [ ] **DEPS-02**: `legacy-peer-deps=true` removed from `.npmrc` and all CI/deployment configs

### Security

- [x] **SEC-01**: Content Security Policy uses nonce-based approach, removing `unsafe-inline` and `unsafe-eval` where possible
- [ ] **SEC-02**: Feedback API endpoint has CSRF token validation preventing cross-origin form submissions

### Reliability

- [x] **REL-01**: Rate limiting persists across deployments using Redis/Vercel KV with sliding window algorithm
- [x] **REL-02**: Service worker cache version is generated from build hash, automatically invalidating stale caches on deployment

### Code Quality

- [ ] **QUAL-01**: All documented `any` types replaced with proper TypeScript types (ParticleButton, MountainTerrain3D, ProjectHighlights, feedback test)
- [ ] **QUAL-02**: Image optimization pipeline integrated into build process — `optimize-images.mjs` runs pre-build, optimized images generated and served

### Design Foundation

- [x] **DSGN-01**: Custom color palette defined in Tailwind `@theme` — organic earthy tones (greens, browns, warm neutrals) meeting digital accents (electric blue, glowing highlights)
- [x] **DSGN-02**: Custom typography system defined — nature-inspired display font paired with readable body font, full heading/body/caption hierarchy
- [x] **DSGN-03**: All custom color combinations meet WCAG AA contrast ratios (4.5:1 for body text, 3:1 for large text)

### Design Components

- [ ] **COMP-01**: Navigation/header redesigned with distinctive interaction pattern — not a standard horizontal nav bar
- [ ] **COMP-02**: Project card/tile components redesigned with custom styling that reflects organic-meets-digital aesthetic
- [ ] **COMP-03**: Biophilic micro-interactions applied to interactive elements — organic easing, nature-inspired hover/click effects on buttons, cards, and nav
- [ ] **COMP-04**: Glowing accents and depth effects applied to UI elements, visually connecting the 2D interface to the existing 3D components

### Performance

- [ ] **PERF-01**: PhotoCarousel3D loads textures progressively — visible images plus adjacent loaded first, remaining lazy loaded with low-res placeholders
- [ ] **PERF-02**: `useReducedMotion` applied consistently across all animated components, disabling micro-interactions and 3D animations for users who prefer reduced motion

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Security

- **SEC-03**: Environment variables validated at startup using Zod — app fails fast if required vars missing

### Reliability

- **REL-03**: Email delivery handles failures gracefully — no silent success, retry queue, user informed of delivery status

### Design Foundation

- **DSGN-04**: Dark/light mode toggle with system preference detection and manual override

### Visual Polish

- **COMP-05**: Custom organic shapes using SVG clip-paths for non-rectangular UI boundaries
- **COMP-06**: Nature-inspired textures (subtle wood grain, stone, leaf patterns) as optional background overlays

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full Tailwind removal | High-effort rewrite with no benefit; keep as utility layer |
| Database for feedback storage | Infrastructure complexity not justified for current volume |
| Error monitoring (Sentry) | Separate infrastructure concern, defer to future milestone |
| Storybook/automated design docs | Overkill for personal portfolio |
| Full offline functionality | Service worker caching sufficient, full offline mode fragile |
| 3D-to-UI design language extraction | Research project, may inform future visual iteration |
| Performance test suite | Nice-to-have, not blocking visual identity goals |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPS-01 | Phase 1 | Pending |
| DEPS-02 | Phase 1 | Pending |
| SEC-01 | Phase 6 | Complete |
| SEC-02 | Phase 2 | Pending |
| REL-01 | Phase 6 | Complete |
| REL-02 | Phase 6 | Complete |
| QUAL-01 | Phase 1 | Pending |
| QUAL-02 | Phase 1 | Pending |
| DSGN-01 | Phase 3 | Complete |
| DSGN-02 | Phase 3 | Complete |
| DSGN-03 | Phase 3 | Complete |
| COMP-01 | Phase 4 | Pending |
| COMP-02 | Phase 4 | Pending |
| COMP-03 | Phase 4 | Pending |
| COMP-04 | Phase 4 | Pending |
| PERF-01 | Phase 5 | Pending |
| PERF-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-02-16*
*Last updated: 2026-02-16 after roadmap creation*
