# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Stabilization & Visual Identity

**Shipped:** 2026-04-02
**Phases:** 5 | **Plans:** 22 | **Tasks:** 40

### What Was Built
- Clean dependency tree (React 19 compatible), image optimization pipeline (AVIF/WebP/JPEG)
- Security hardening: nonce-based CSP, CSRF protection, Redis rate limiting, service worker cache invalidation
- Swiss Alps OKLCH design token system with WCAG AA verified contrast
- Crystalline/geological design system: glassmorphism nav, hexagonal project cards, geological button effects, scroll-linked glow bridge
- Progressive 3D texture loading, reduced-motion gating across all animated components
- Bug fixes: WebGL context loss, reduced-motion hydration race, hero layout issues

### What Worked
- Phased approach (stability first, then design) prevented compounding issues
- Design tokens before components ensured consistency across the system
- OKLCH color space gave perceptual uniformity that hex/HSL couldn't achieve
- Summary-driven execution with clear plan/summary pairs kept phases focused
- Average plan execution of ~3min kept momentum high

### What Was Inefficient
- Requirements traceability table wasn't updated as phases completed (all showed "Pending" at milestone end)
- Debug sessions diagnosed but left unfixed for weeks (reduced-motion, WebGL context loss)
- Phase 5 required gap-closure plans (05-04, 05-05) after initial verification found issues

### Patterns Established
- useSyncExternalStore for browser API hooks (avoids hydration race)
- Spread operator [...EASING.constant] for Framer Motion readonly tuple compatibility
- In-place texture hot-swap pattern (texture.image + needsUpdate) for progressive 3D loading
- GeologicalButton as production CTA component (fracture/dust/ripple effects via AnimatePresence)

### Key Lessons
1. Update requirements traceability as you go, not at milestone end
2. Fix diagnosed bugs promptly — leaving them "awaiting verify" creates a cleanup backlog
3. Gap-closure plans are normal — first verification pass often reveals edge cases
4. CSS reduced-motion blocks must be narrow (keyframes only, not transitions) to avoid breaking Tailwind utilities

### Cost Observations
- Model mix: primarily opus for execution, quality profile
- Execution time: ~1.16 hours total across 22 plans
- Notable: 3-5min average per plan is sustainable pace

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 22 | Established GSD workflow, design token system |

### Top Lessons (Verified Across Milestones)

1. Stability before features prevents cascading issues
2. Design tokens before components ensures consistency
