# Milestones

## v2.0 Topographic Identity (Shipped: 2026-11-05)

**Delivered:** The whole site rebuilt around the real Matterhorn terrain, so Tim Lui's photography and engineering read as one Swiss topographic survey on a single enforced design system.

**Phases completed:** 6 phases, 128 plans, 314 tasks

**Closeout:** override closeout. All 67 active requirements are satisfied and the audit status is `tech_debt` ([audit report](milestones/v2.0-MILESTONE-AUDIT.md)).

**Key accomplishments:**
- Guardrails first: Linux visual baselines for every route, a test-count ratchet and palette, contrast and identity guards in CI; isolated upgrades to motion 14, Next 16.4, React 19.3 and Playwright 1.64; one dark, token-driven shell with Tim Lui's real identity
- Real data: swissALTIRegio terrain and EXIF photo facts as committed, typed, staleness-checked data; originals out of the public site, metadata-free hashed derivatives enforced by a CI scan; a footer map legend on every route
- Home ascent: native-scroll climb up the real Matterhorn with a contour shader, altimeter rail and four photo waypoints, and a static contour poster for reduced motion, Save-Data, no WebGL2, low memory or a lost context
- Photography: Map, Grid and Carousel views kept in the URL, deep-linkable `/photos/[slug]` pages that open in-site as a gallery-black lightbox with EXIF strip, hotspot callouts, zoom and a View Transitions morph
- Engineering: box and coin-flip as route panels and case studies with audited metrics and a per-project safety slot, a token-styled terminal with Pause, and a route-log roadmap on an elevation axis with URL filters
- Finish: summit-register contact form, designed 404, error and offline pages, a network-first service worker, per-route SEO and per-slug Open Graph cards, dead v1 code removed, and an audit gate (axe, CLS, links, images, CSP) in three-engine CI

**Stats:**
- Timeline: 26 days (2026-10-10 → 2026-11-05)
- Commits: 887 | Files: 1,082 | Lines: +148,863 / -14,463, all files; source alone is 532 files, +58,631 / -11,623
- Codebase: about 56,100 LOC (TypeScript, CSS, scripts; generated data excluded) | Tests: 2,243 (Jest 1,694, Playwright 549)

### Known Gaps

- ENG-03: CLI_X risk bands as Swiss trail grades (Phase 11). Dropped by decision D-24 because CLI_X is discontinued; not a defect. It appears here because its checkbox stays unchecked.

**Known verification overrides:** 18 newly acknowledged, 0 carried forward from a prior close (see STATE.md Deferred Items). Phases 7-11 also closed with `stale` verification digests, because later phases changed their covered files as planned. The newest full CI pass on the shipped source is run 42104591800 on `082cfb8`.

**Open at close:**
- A real send from the contact form is untested on production
- `main` has no branch protection or required checks
- CI run 42105427622 on the merge commit shows `cancelled`: E2E hung during browser install and ran no tests

---

## v1.0 Stabilization & Visual Identity (Shipped: 2026-03-12)

**Phases completed:** 6 phases, 24 plans, 0 tasks

**Key accomplishments:**
- Clean dependency tree — resolved React 19 peer conflicts, removed legacy-peer-deps, replaced 7 `any` types
- Security hardening — nonce-based CSP, CSRF validation, Upstash Redis persistent rate limiting
- Swiss Alps design system — 30 OKLCH color tokens, JetBrains Mono/Inter typography, WCAG AA verified
- Crystalline UI components — glassmorphism nav, hexagonal cards, GeologicalButton, scroll-linked glow
- Progressive 3D loading — thumbnail-first textures, reduced-motion gating across all animated components
- Integration wiring fixes — middleware convention, Upstash packages, build-hash injection pipeline

**Stats:**
- Timeline: 24 days (2026-02-16 → 2026-03-12)
- Commits: 134 | Files: 165 | Lines: +15,103 / -1,374
- Codebase: 12,484 LOC (TypeScript/CSS)

---
