# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Stabilization & Visual Identity

**Shipped:** 2026-03-12
**Phases:** 6 | **Plans:** 24

### What Was Built
- Clean dependency tree with React 19 peer compatibility, proper TypeScript types, AVIF image pipeline
- Nonce-based CSP, CSRF validation, Upstash Redis persistent rate limiting, build-hash service worker
- Swiss Alps OKLCH color palette (30 tokens), JetBrains Mono/Inter typography, WCAG AA verified
- Crystalline UI: glassmorphism nav, hexagonal cards, GeologicalButton, scroll-linked glow system
- Progressive 3D texture loading with thumbnail-first strategy, reduced-motion gating across all components
- Integration wiring fixes closing 3 audit-discovered gaps

### What Worked
- **Stability-first sequencing:** Fixing deps and security before design work prevented compounding issues
- **Gap closure plans:** Phase-level UAT caught real issues (missing npm scripts, contrast failures, SW race conditions) that phase execution missed
- **Milestone audit:** Caught 3 critical wiring breaks (wrong filename, missing packages, unwired script) that would have shipped broken
- **Fast execution velocity:** 24 plans in ~1.16 hours total, averaging 3min/plan
- **Design token discipline:** OKLCH palette + @theme CSS-first meant components could reference tokens immediately

### What Was Inefficient
- **ROADMAP.md checkbox staleness:** Phase 3, 5, 6 checkboxes weren't updated as plans completed — required manual reconciliation at milestone
- **REQUIREMENTS.md traceability drift:** Only 6/17 requirements checked off despite all being implemented — traceability table not maintained during execution
- **Multiple gap closure rounds:** Phases 2, 3, 5 each needed 1-3 gap closure plans after initial execution — could improve upfront verification

### Patterns Established
- OKLCH color space with @theme inline for design tokens
- Dark-only site — no dark: variants or media query toggles needed
- 0.01ms duration for reduced-motion CSS (preserves transitionend events)
- Geological depth system (stratum-1/2/3) for consistent visual layering
- THREE.TextureLoader over drei useTexture for progressive loading patterns

### Key Lessons
1. **Phase-level verification isn't enough** — the milestone audit found 3 wiring breaks that individual phase verifications missed. Cross-phase integration testing is essential.
2. **Traceability tables need automation** — manual checkbox maintenance fails at scale. Consider auto-updating from SUMMARY.md frontmatter.
3. **Gap closure plans are normal, not failures** — 8 of 24 plans were gap closures. Budget for ~30% gap work in future milestones.

### Cost Observations
- Model mix: primarily quality profile (opus for execution, sonnet for agents)
- Total execution time: ~1.16 hours across 24 plans
- Notable: gap closure plans were fastest (2-4min) since the code context was already loaded

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 6 | 24 | First milestone — established gap closure pattern |

### Top Lessons (Verified Across Milestones)

1. Cross-phase integration testing catches wiring breaks that phase-level verification misses
2. Gap closure plans (~30% of total) are a normal part of the process, not rework
