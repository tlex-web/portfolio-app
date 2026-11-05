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

## Milestone: v2.0 — Topographic Identity

**Shipped:** 2026-11-05
**Phases:** 6 | **Plans:** 128

### What Was Built
- CI guardrails (Linux visual baselines, test-count ratchet, palette, contrast and identity guards), isolated platform upgrades, tokens v2 and one site shell with real identity
- Build-time swissALTIRegio terrain and EXIF photo data, privacy-safe hashed images and a footer map legend
- A native-scroll Home ascent up the real Matterhorn, with a static poster for every device that can't or shouldn't run 3D
- Map, Grid and Carousel photo views with deep-linkable photo pages and a gallery-black lightbox
- Route panels and case studies for box and coin-flip, and a route-log roadmap
- Summit-register contact, designed edge pages, network-first service worker, per-route SEO and Open Graph cards, dead v1 code removed, and an audit gate across three engines

### What Worked
- **Guardrails before any visual change:** Phase 7's baselines and ratchet caught every later diff, and each re-baseline had a stated reason. A threshold of 0.01 kept `changed` re-baselines exact.
- **Red before green:** the single-skip-link gap in 07-27 was shown failing on the old Home in CI before the fix passed.
- **Isolated upgrade commits:** the motion, Next and Playwright upgrades each landed alone, so three small visual changes could each be traced to one commit and ratified.
- **Live-DOM checks with the service worker on:** the wave 1 check in real Chrome caught the 404 slug leak that the worker-blocked e2e projects could not see.
- **Asking at checkpoints:** copy, metrics, the clip and the Phase 12 content packet went through Tim with his literal replies recorded, so nothing shipped on an assumed approval.
- **Milestone audit:** measuring instead of inferring found that `main` has no required checks, measured the routes the gate skips and re-ran HOME-08 on final code.

### What Was Inefficient
- **Long-lived stacked branches:** Phases 7-12 stayed unmerged for the whole milestone. `main` fell 857 commits behind, the Next security patch stayed out of production until the milestone's last day, production had to be promoted from a preview for one UAT test, and PR #109 was too big to review (1,002 files).
- **Mid-milestone project swap:** CLI_X's discontinuation forced a Phase 11 re-plan (11-02 to 11-18) and left DATA-07 and Phase 8 SC5 describing removed data until the close.
- **Ledgers without an owner:** Phase 7's 27-row review ledger was never triaged, so fixed findings still read `open` a milestone later.
- **Deferrals that crossed phases by prose:** Nyquist tests G5 and G6 were deferred "to Phase 12" and no Phase 12 document ever mentioned them.
- **Records that drift from reality:** 07-UAT says required checks are set on `main`, and they aren't. Verification bodies kept `human_needed` after their frontmatter moved to `passed`.
- **STATE.md growth:** it reached 570 lines and exceeded a single read, so sessions could not load it whole.
- **Gap work:** 18 of 128 plans (14%) were gap closures or follow-ups, well under v1.0's 33%, but they arrived as whole extra waves in Phases 9 and 12.

### Patterns Established
- Visual baselines come only from the CI container, and only Tim commits PNGs
- Tests are rewritten, never skipped; the ratchet rejects `.skip` and scopes browsers with title tags
- Generated data is committed and byte-checked offline in lint
- One shared capability gate decides 3D or static across Home and the Carousel
- Reasons for every accepted exception are recorded with Tim's literal reply

### Key Lessons
1. **Verify repository settings through the API, not a UAT reply.** A setting can change or never apply, and a passed test doesn't keep it true.
2. **Merge earlier.** A phase that's done should reach `main`; stacking saved little and cost review, security patches and deploy safety.
3. **A deferral needs a destination the next phase will read,** such as a plan row or a tracked item, not a sentence in the deferring phase's file.
4. **Route lists in gates should derive from the data.** The audit gate hard-coded one project and one photo, so `coin-flip` was never in it.
5. **Pinned tools hide coming failures.** axe 4.14 flags 13 elements that the pinned 4.13 passes, and one group is a real issue.

### Cost Observations
- Model mix: quality profile; exact percentages weren't recorded
- Plan execution: about 70 hours across 128 plans, by the per-plan durations in STATE
- Sessions: not recorded
- Notable: CI E2E grew to about 37 minutes across three engines, and with `workers: 1` it's now the slowest feedback loop

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 6 | 24 | First milestone — established gap closure pattern |
| v2.0 | 6 | 128 | Guardrails first; every phase judged against CI baselines, with a measuring milestone audit |

### Top Lessons (Verified Across Milestones)

1. Cross-phase integration testing catches wiring breaks that phase-level verification misses
2. Gap closure plans are a normal part of the process, not rework (33% of plans in v1.0, 14% in v2.0)
3. The milestone audit finds what phase verification can't: wiring breaks in v1.0, missing merge enforcement in v2.0
