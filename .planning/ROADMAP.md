# Roadmap: Portfolio App

## Milestones

- ✅ **v1.0 Stabilization & Visual Identity** — Phases 1-6 (shipped 2026-03-12)
- 🚧 **v2.0 Topographic Identity** — Phases 7-12 (in progress)

## Phases

<details>
<summary>✅ v1.0 Stabilization & Visual Identity (Phases 1-6) — SHIPPED 2026-03-12</summary>

- [x] Phase 1: Dependency Resolution & Code Quality (3/3 plans) — completed 2026-02-16
- [x] Phase 2: Security & Reliability Hardening (6/6 plans) — completed 2026-02-17
- [x] Phase 3: Design Foundation (3/3 plans) — completed 2026-02-17
- [x] Phase 4: Design Components (6/6 plans) — completed 2026-02-17
- [x] Phase 5: Performance & Accessibility Polish (5/5 plans) — completed 2026-03-11
- [x] Phase 6: Integration Wiring Fixes (1/1 plan) — completed 2026-03-12

</details>

### 🚧 v2.0 Topographic Identity

**Milestone Goal:** Rebuild the whole UI around the real Matterhorn terrain so Tim Lui's photography and engineering read as one Swiss "topographic survey", on a single enforced design system, without visual regressions.

**Rules for every v2.0 phase:**
- **Design process:** All UI/UX work (UI-SPECs, components, styling, layout, interaction, accessibility) uses the `ui-ux-pro-max` skill (PROJECT.md constraint). Every phase below is marked `UI hint: yes`, so run `/gsd-ui-phase` (with ui-ux-pro-max) before `/gsd-plan-phase`.
- **Visual regressions:** Every visual change is judged against the Phase 7 screenshot baselines. An intentional diff is re-baselined in the same commit, with the reason stated.
- **Tests:** Tests are rewritten, never deleted. The Phase 7 test-count ratchet (GUARD-03) applies to every later phase.
- **Styling:** The Phase 7 palette guard (GUARD-04) applies to all new code: no `dark:` variants and no stock Tailwind palette classes.

**Execution order:** 7 → 8 → 9 → 10 ∥ 11 → 12. Phase 8 blocks everything after it. Phases 10 and 11 each depend only on Phase 8 (plus the Phase 7 shell) and not on each other, so they can run in parallel. Phase 9 also depends only on Phase 8 and keeps its numeric slot before 10. Phase 12 needs 9, 10 and 11.

- [x] **Phase 7: Foundation & Guardrails** - Regression nets, isolated dependency upgrades, tokens v2 and one site shell with Tim Lui's real identity (completed 2026-10-24)
- [x] **Phase 8: Data & Terrain Pipeline** - Build-time swissALTIRegio terrain and EXIF photo data, privacy-safe images, typed highlights, and the footer map legend (completed 2026-10-24)
- [x] **Phase 9: Home Ascent** - Real Matterhorn hero with a native-scroll ascent, altimeter rail and photo waypoints, plus a static fallback (completed 2026-10-25)
- [ ] **Phase 10: Photography** - Map / Grid / Carousel light table and a deep-linkable gallery-black lightbox with EXIF and hotspots
- [ ] **Phase 11: Engineering & Roadmap** - Route-panel projects, case studies, trail-grade risk scale, tokenized terminal, and a route-log roadmap
- [ ] **Phase 12: Contact, Edge Pages, Cleanup & Verification** - Summit-register contact, designed 404/error/offline pages, SEO, dead-code removal, and axe plus cross-browser verification

## Phase Details

### Phase 7: Foundation & Guardrails

**Goal**: Every page renders inside one dark, token-driven site shell with Tim Lui's real identity, on upgraded dependencies, behind CI guardrails that catch visual regressions, deleted tests and off-system styling before they ship.
**Depends on**: Nothing (first v2.0 phase; builds on the shipped v1.0 codebase)
**Requirements**: GUARD-01, GUARD-02, GUARD-03, GUARD-04, GUARD-05, GUARD-06, DEPS-03, DEPS-04, DEPS-05, DSGN-05, DSGN-06, DSGN-07, DSGN-08, DSGN-09, DSGN-10, SHELL-01, SHELL-02, SHELL-03, SHELL-05, SHELL-06
**Success Criteria** (what must be TRUE):
  1. Local, CI (Node 24) and Vercel installs all use `npm ci`. CI holds Playwright baselines for every route in both dark and light color schemes, captured from a Linux production build. CI fails on any screenshot diff, a drop in total test count, a `dark:` variant or stock palette class, a token text/background pair below WCAG AA, or a jsx-a11y violation.
  2. The `motion` 14.1 upgrade, the Next 16.4.x / React 19.3 / R3F 9.8.1 / drei 10.7.9 upgrade and the Playwright 1.64 upgrade land as three separate commits. Each passes the baseline run with zero visual diff, mid-scroll captures included.
  3. A visitor whose OS is set to light mode sees the same dark site as a dark-mode visitor (the dark and light baselines are identical). The site uses tokens v2 colors; a grotesk display face, Inter body text and JetBrains Mono only for data, with tabular figures; one SVG icon family and no emoji icons; a thin visible scrollbar that doesn't shift the page when a modal opens; and motion from shared tokens that settles to its final state under reduced motion.
  4. On every page a keyboard user finds one skip link, exactly one primary navigation with a visible current-page indicator, and exactly one main landmark. On mobile the menu opens with touch targets of at least 44 px and closes on route change and on Escape.
  5. Every page shows Tim Lui's name, role line and real GitHub, LinkedIn and email links, with no placeholder text or links. `/gradient-mesh`, `/particle-buttons` and `/transitions` return a 404 inside the site shell and no page links to them. The Contact heading and form fields pass WCAG AA for light-OS and dark-OS visitors alike.

**Plans**: 27/27 plans complete: 26/26 executed (sequential waves 1-26, one plan per wave; locked build order preserved) + 1 gap-closure plan (07-27, wave 27)

Plans:
**Wave 1**
- [x] 07-01-PLAN.md — Step 1a: Node 24 + npm ci everywhere, install-parity guard, test-count ratchet, Dependabot holds

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 07-02-PLAN.md — Step 1b: eslint-config-next flat config with jsx-a11y at error, pixel-neutral lint fixes

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 07-03-PLAN.md — Step 2a: visual projects, route matrix spec, baseline workflow, initial Linux baselines

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 07-04-PLAN.md — Step 2b + 3: CI Visual Regression gate; delete the playground; re-baseline /photos

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 07-05-PLAN.md — Step 4: framer-motion -> motion 14.1 (zero diff)

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 07-06-PLAN.md — Step 5: Next 16.4 + React 19.3 + R3F 9.8.1 + drei 10.7.9 (zero diff)

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 07-07-PLAN.md — Step 5b: Next 2026-10-14 security patch (gated on the advisory; folds into 5 if already out)

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 07-08-PLAN.md — Step 6: Playwright 1.64 + container tags (re-baseline only if Chromium forces it)

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 07-09-PLAN.md — Step 7a: tokens v2 L1/L2, motion tokens + parity test, MotionConfig, amber -> caution

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 07-10-PLAN.md — Step 7b: v1 tokens retargeted as aliases; palette re-baseline

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 07-11-PLAN.md — Step 7c: Schibsted Grotesk + base type styles; design-system spec

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 07-12-PLAN.md — Step 7d: visible thin scrollbar with stable gutter (G3 check)

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 07-13-PLAN.md — Step 7e: Phosphor icon family replaces emoji icons; Roadmap tests rewritten

**Wave 14** *(blocked on Wave 13 completion)*
- [x] 07-14-PLAN.md — Step 8a: neutralise dark: for everyone; light baselines assert dark

**Wave 15** *(blocked on Wave 14 completion)*
- [x] 07-15-PLAN.md — Step 8b: collapse dark: pairs (zero diff)

**Wave 16** *(blocked on Wave 15 completion)*
- [x] 07-16-PLAN.md — Step 8c: map Contact stock palette to semantic tokens

**Wave 17** *(blocked on Wave 16 completion)*
- [x] 07-17-PLAN.md — Step 8c: map Roadmap stock palette to semantic tokens

**Wave 18** *(blocked on Wave 17 completion)*
- [x] 07-18-PLAN.md — Step 8c: map Projects stock palette to semantic tokens

**Wave 19** *(blocked on Wave 18 completion)*
- [x] 07-19-PLAN.md — Step 8c: map Photos + edge pages stock palette to semantic tokens

**Wave 20** *(blocked on Wave 19 completion)*
- [x] 07-20-PLAN.md — Step 8d: remove dark variant; palette guard + white/black ratchet; contrast check from globals.css

**Wave 21** *(blocked on Wave 20 completion)*
- [x] 07-21-PLAN.md — Step 9a: BLOCKING INPUT (email, LinkedIn); data/site.ts and shell components

**Wave 22** *(blocked on Wave 21 completion)*
- [x] 07-22-PLAN.md — Step 9b: git mv into app/(site), mount SiteChrome, Home identity, shell spec

**Wave 23** *(blocked on Wave 22 completion)*
- [x] 07-23-PLAN.md — Step 9c: 404 inside the shell; (site)/error + global-error with retry()

**Wave 24** *(blocked on Wave 23 completion)*
- [x] 07-24-PLAN.md — Step 9d: Contact interim contrast fix with axe in both schemes (real email replaces the placeholder)

**Wave 25** *(blocked on Wave 24 completion)*
- [x] 07-25-PLAN.md — Step 9e: identity metadata/author/email copy, forbidden-strings guard, emoji rule on

**Wave 26** *(blocked on Wave 25 completion)*
- [x] 07-26-PLAN.md — Step 10: HOME-08 LCP/JS baseline; raise ratchet; restore Dependabot

**Wave 27** *(gap closure, blocked on Wave 26 completion)*
- [x] 07-27-PLAN.md — SC4 / SHELL-01 gap: assert exactly one skip link per page (red in CI first), remove the hero's duplicate skip link, zero visual diff

**Cross-cutting constraints:**
- No v1 alias name, raw OKLCH, hex, rgba() or arbitrary colour value is introduced by the mapping

**UI hint**: yes
**Build order** (commit sequence matters, so keep it):
  1. Install parity and lint wiring: `npm ci` locally, in CI and in `vercel.json`; CI on Node 24; wire `eslint-config-next` (jsx-a11y); add the test-count ratchet (GUARD-01, GUARD-03, GUARD-06).
  2. Baselines: dark and light color-scheme Playwright projects; Linux production build, `serviceWorkers: 'block'`, `retries: 0`, reduced-motion and mid-scroll shots, WebGL canvas masked. Capture them on the lockfile Playwright version (GUARD-02).
  3. Delete the playground: `/gradient-mesh`, `/particle-buttons`, `/transitions`, the `/transitions` link on Photos, and zero-consumer components. `AnimatedGradientMesh` stays until Contact is rebuilt in Phase 12 (SHELL-05).
  4. `framer-motion` → `motion` 14.1 (`motion/react` imports) in its own commit with zero diff and a single `motion-dom` in the tree (DEPS-03).
  5. Next 16.4.x (including the 2026-10-14 security patch), React 19.3, `@types/react*`, R3F 9.8.1 and drei 10.7.9 in one atomic commit with zero diff (DEPS-04).
  6. Playwright 1.64 in its own commit. Re-baseline only if Chromium rendering forces it (DEPS-05).
  7. Tokens v2 (night-map OKLCH, semantic tokens, v1 names kept as aliases, v1 `amber` renamed `caution`); the type stack; motion tokens shared by CSS and `lib/animations.ts` (parity test, `MotionConfig reducedMotion="user"`); a visible scrollbar with `scrollbar-gutter: stable`; one SVG icon family (DSGN-06 to DSGN-10).
  8. Staged `dark:` removal. First neutralise it (`@custom-variant dark`, `<html class="dark">`, `color-scheme: dark`). Then collapse each file to its `dark:` value with zero diff, and remove the variant. Only then enable the palette grep guard (scans `data/` and tests too, with a per-file `white`/`black` ratchet) and the contrast check that reads `globals.css` (DSGN-05, GUARD-04, GUARD-05).
  9. Shell: `data/site.ts` identity, `SiteNav`, `SiteFooter` and `SiteChrome`; `git mv` every route into `app/(site)/`; root `not-found` and `global-error` render inside the shell; fix the Contact heading and field contrast (SHELL-01, SHELL-02, SHELL-03, SHELL-06).
  10. At phase close, record the Home mobile LCP and JavaScript-size baseline that HOME-08 is measured against.

**Research**: No research step needed (well-documented upgrades and token work). Design decisions go through `/gsd-ui-phase`.
**Inputs from Tim**: Real GitHub URL, LinkedIn URL, email address and role line (also used for the `package.json` author). Display-face choice (Schibsted Grotesk, Host Grotesk or Archivo), settled in the Phase 7 UI-SPEC.
**Hand-offs**: Deleted routes resolve to the shell's 404 here; the "off the marked trail" 404 content arrives with EDGE-01 in Phase 12. The footer stays a plain identity footer until Phase 8 turns it into the map legend (SHELL-04).

### Phase 8: Data & Terrain Pipeline

**Goal**: Real swisstopo terrain and real photo EXIF become committed, typed, privacy-safe data that every later surface reads, and the site footer becomes a map legend drawn from that terrain.
**Depends on**: Phase 7
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07, DATA-08, SHELL-04
**Success Criteria** (what must be TRUE):
  1. The terrain build script turns swissALTIRegio data for the Zermatt–Matterhorn area into a content-hashed 16-bit heightmap (512² desktop, 256² mobile) and a contour SVG. Every page footer shows that contour art as a map legend, with a scale bar and swisstopo attribution.
  2. The originals' EXIF is turned into committed, typed photo data: capture date and time in Europe/Zurich, camera, lens, focal length, aperture, shutter, ISO, and GPS rounded to 4 decimals. CI fails when that data is stale.
  3. Photo content matches the evidence: capture dates match EXIF, the waterfall carries the location Tim confirmed, annotation altitudes agree with GPS, year tags are correct, and no two stories read as near-duplicates. The film-scan photo has a hand-placed position flagged as approximate in the data.
  4. No full-resolution original or GPS-bearing image can be fetched from the public site. Every served image is resized, correctly rotated and metadata-free, which a CI scan enforces. Components take image paths from the pipeline manifest, not from hard-coded variant filenames.
  5. Project highlights type-check against a per-project schema, and every CLI_X risk example carries a numeric `riskScore`.

**Plans**: 13/13 plans complete in 9 waves

Plans:
**Wave 1**
- [x] 08-01-PLAN.md — Coordinate contract (lib/geo.ts), pure terrain cores, generator-library import ban
- [x] 08-02-PLAN.md — Originals out of /public, EXIF sidecar with 4-dp GPS (stage 1), data:check in lint
- [x] 08-03-PLAN.md — Typed project highlights + legacy adapter, trail grade, Tim's real riskScores (checkpoint)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 08-04-PLAN.md — Sheet decisions from Tim (checkpoint), swissALTIRegio source raster, heightmaps, contour LODs, terrain.ts
- [x] 08-05-PLAN.md — v1 alias codemod to v2 names (zero diff), accent-strong token, widened v1names guard

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 08-06-PLAN.md — Immutable /terrain delivery, proxy exclusion, SW precache; hillshade poster + Tim's review
- [x] 08-07-PLAN.md — Hashed privacy-safe derivatives + image manifest; full-res copies and prebuild removed

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 08-08-PLAN.md — Typed photo facts (EXIF dates, corrections, DEM heights, derived tags, approximate pin), altimeter wording

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 08-09-PLAN.md — Served-image CI guard, data-privacy e2e, CI and preview verification

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 08-10-PLAN.md — Editorial copy draft, legacy bridge over the manifest, modal capture label, Tim's copy decision

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 08-11-PLAN.md — Apply Tim's copy decision; photos re-baseline (Tim commits PNGs)

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 08-12-PLAN.md — Footer map-sheet margin: contour band, ticks, true scale bar, attribution (SHELL-04)

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 08-13-PLAN.md — All-route footer re-baseline (Tim commits PNGs), phase-close test ratchet

**UI hint**: yes
**Scope notes**:
  - Schemas and libraries: zod schemas (photos; project highlights as a discriminated union); `lib/geo.ts` (WGS84 ↔ LV95 ↔ terrain grid) with tests; `lib/trail-grade.ts`.
  - Pipeline: `scripts/build-terrain` and `scripts/extract-exif`, both with `--check`; a `locationOverride` corrections file; the image manifest.
  - Originals: moved to a gitignored location outside `/public`, plus a CI GPS scan.
  - `ContourField`: one contour asset reused by the hero fallback, Map view, footer and 404.
  - Caching and delivery: hashed asset names wired into the SW precache; proxy matcher and cache headers.
  - v1 alias usages are codemodded to v2 names here; the alias definitions are deleted in Phase 12.
  - The legacy `-thumb/-medium/-large` files stay on disk until Phase 12 (VERIFY-01).
  - The UI-SPEC covers only the footer legend.

**Research**: Needs a research step during planning, covering:
  - The swissALTIRegio cross-border attribution string.
  - How to render the poster.
  - EXIF and GPS policy: naive local time stored with Europe/Zurich; DEM-sampled heights rather than EXIF altitude; `.rotate()` without `withMetadata()`; sharp `grey16` write from a `Uint16Array`.
  - Keeping d3-contour (ESM-only, y-down) out of Jest-imported components.

**Inputs from Tim**:
  - The waterfall's name and location (its GPS points to the gorge just south of Zermatt, not the Teufelsschlucht).
  - Photo copy corrections: the Glacier Trail elevation copy, the `img-0605` year tag, and the near-duplicate stories.
  - The confirmed swissALTIRegio attribution string.
  - An approximate position for the film-scan photo (R004-011).
  - Where the 194 MB of originals should live.

### Phase 9: Home Ascent

**Goal**: Visitors land on the real Matterhorn and climb it by scrolling, passing Tim's photographs where they were taken. Every visitor gets a complete, readable Home, with or without WebGL and motion.
**Depends on**: Phase 8
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06, HOME-07, HOME-08
**Success Criteria** (what must be TRUE):
  1. The first viewport shows Tim Lui's name, role and primary call to action. They are readable before any script runs, with no animation, and without WebGL.
  2. On a capable device the hero shows the real Matterhorn terrain with contour lines. Native scrolling (no scroll-jacking) moves the camera up the mountain while an altimeter rail climbs from 1,617 m to 4,478 m; the rail is decorative, hidden from assistive tech and hidden below 768 px. A skip link jumps past the ascent.
  3. Photo waypoints appear at their real positions and heights during the ascent, with the film-scan photo labelled approximate. An always-rendered list links to every photo. Two trail-sign links lead to Photographs and Engineering, and key stats read as a summit plaque.
  4. With reduced motion, Save-Data, no WebGL2, low device memory or a lost WebGL context, a static contour poster renders and every Home section shows its final readable state. The WebGL canvas renders on demand and pauses when scrolled off-screen.
  5. Mobile LCP and Home JavaScript size are no worse than the baseline recorded at the end of Phase 7.

**Plans**: 22/22 plans complete: 14/14 executed in 11 waves, plus 8 gap-closure plans (09-15 to 09-22, waves 12-19, sequential) for UAT gaps G-09-2 to G-09-5

Plans:
**Wave 1**
- [x] 09-01-PLAN.md — Server Component Home: ascent grid, relief poster (LCP), hero copy, trail signs; carries the pre-execution gate on C1-C8 and Defaults 1-15

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 09-02-PLAN.md — Dead hero chain deleted, guards tightened, RSC boundary test, HOME-01 proven with JavaScript disabled
- [x] 09-03-PLAN.md — Waypoint cards as the always-rendered HOME-05 list; /photos#slug fragment ids
- [x] 09-04-PLAN.md — Generated shader colour tokens from globals.css with --check

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 09-05-PLAN.md — Summit plaque (derived stats), About and contact (DRAFT), Start the ascent / Skip to the summit cues

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 09-06-PLAN.md — One damped progress value: altimeter rail, lit poster pins, focus contract, native-scroll e2e

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 09-07-PLAN.md — Capability gate, lazy TerrainStage chunk, static modes, composed-contrast backstops

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 09-08-PLAN.md — fast-png terrain mesh, CSS-parity contour shader, plan-view reveal over the poster

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 09-09-PLAN.md — Visual shots at fixed ascent positions; HOME-08 perf spec counts the lazy chunk; early local byte check
- [x] 09-10-PLAN.md — Camera route (tilt-in, legs, summit look-back), mobile view offset, 3D pins

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 09-11-PLAN.md — Context loss, demand-aware frame budget, off-screen pause, SwiftShader resilience e2e

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 09-12-PLAN.md — Tim's review: About copy (D-14) and terrain tuning; apply (checkpoints)

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 09-13-PLAN.md — Tim's go-ahead for ci/09-NN; CI and container perf numbers; HOME-08 gate decision (checkpoints)

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 09-14-PLAN.md — Apply the frame-budget choice; Home re-baseline (Tim commits PNGs); ratchet raise

Gap closure (09-UAT.md, sequential on the main working tree):

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 09-15-PLAN.md — G-09-5: hidden-tab reveal burst restarts (WR-01), IN-05 documented, WR-02 measure-only context-loss test

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 09-16-PLAN.md — G-09-3 b / G-09-4 N2: explicit break points for the card kicker and place line

**Wave 14** *(blocked on Wave 13 completion)*
- [x] 09-17-PLAN.md — G-09-4 N1: altimeter rail in its own layer above the hero scrim; composed-contrast test

**Wave 15** *(blocked on Wave 14 completion)*
- [x] 09-18-PLAN.md — G-09-2 static: compact summit plaque, stats after the frame, poster clearance at eleven sizes

**Wave 16** *(blocked on Wave 15 completion)*
- [x] 09-19-PLAN.md — G-09-3 a static: card- and rail-aware poster pin labels; pins above the rail scrim

**Wave 17** *(blocked on Wave 16 completion)*
- [x] 09-20-PLAN.md — G-09-2 3D: summit framing measured from the plaque; md switch on the CSS width source

**Wave 18** *(blocked on Wave 17 completion)*
- [x] 09-21-PLAN.md — G-09-3 a 3D: md stages frame the lit waypoint clear of its card; 3D labels share the poster rule

**Wave 19** *(blocked on Wave 18 completion)*
- [x] 09-22-PLAN.md — One Home re-baseline (Tim commits PNGs), CI green twice, ratchet raise (checkpoints)

**UI hint**: yes
**Scope notes**:
  - `AscentHero` has a server-rendered hillshade poster as the LCP and a DOM waypoint list beneath a lazy R3F canvas.
  - The canvas uses `frameloop="demand"`, a CPU-built mesh from the `fast-png`-decoded heightmap, an `fwidth` contour shader, `dpr={[1, 1.5]}` and `svh` units.
  - One Motion `useScroll` value drives both the camera and `AltimeterRail`. CSS scroll-driven animations are decoration only, since Firefox 157 lacks them.
  - Waypoints sit at DEM-sampled heights.
  - Labels are HTML overlays, not drei `<Text>`, because CSP blocks its blob workers. No drei `useDetectGPU` or `ScrollControls`. GPU resources are disposed on unmount.
  - Until Phase 10 ships `/photos/[slug]`, waypoint links point at the photo in the gallery.

**Research**: Needs a research step during planning, covering contour-shader tuning, mobile GPU capability thresholds, deterministic canvas screenshots (SwiftShader flags) and the poster rendering approach.
**Inputs from Tim**: None beyond the Phase 8 data. The summit-plaque stats are chosen in the UI-SPEC.

### Phase 10: Photography

**Goal**: Visitors explore Tim's photographs as a map, a grid or a carousel, and open any photo in a shareable, keyboard-friendly lightbox that shows its real EXIF, story and rights.
**Depends on**: Phase 8
**Requirements**: PHOTO-01, PHOTO-02, PHOTO-03, PHOTO-04, LBOX-01, LBOX-02, LBOX-03, LBOX-04, LBOX-05, LBOX-06, LBOX-07
**Success Criteria** (what must be TRUE):
  1. `/photos` opens on the Map view, with each photo as a keyboard-operable waypoint on the contour map and the film-scan photo marked approximate. Photos appear in ascending-altitude order in every view.
  2. A visitor can switch to Grid (justified rows at true aspect ratios) or Carousel (the restyled 3D carousel, a flat stepper under reduced motion). The carousel either never auto-advances or offers pause and stops on focus. The chosen view survives reload and sharing through the URL, and switching views adds no history entries.
  3. Opening `/photos/[slug]` directly loads a full photo page. Opening a photo in-site from the map or grid shows it as a lightbox over the gallery: it morphs from the thumbnail where View Transitions are supported, and opens instantly with full functionality elsewhere. Back closes it.
  4. In the lightbox a visitor moves between photos with arrow keys, previous/next buttons or swipe, sees a position counter, and adds no history entries. Focus stays inside, Escape closes it, and focus returns to the thumbnail or pin that opened it.
  5. The lightbox shows the photo on a neutral gallery-black surface with:
     - an EXIF strip (date, camera, lens, focal length, aperture, shutter, ISO, altitude, coordinates)
     - map-style hotspot callouts with leader lines, operable by tap and keyboard, with a legend on mobile and a toggle that hides them
     - "© {capture year} Tim Lui, all rights reserved", with no download button

**Plans**: 4/13 plans executed in 8 waves (10-06 and 10-13 carry blocking checkpoints for Tim)

Plans:
**Wave 1**
- [x] 10-01-PLAN.md — Tracer: /photos/[slug] photo page from one view-model, EXIF strip, rights line, 404 for unknown slugs (WR-04)
- [x] 10-02-PLAN.md — Phase 8 review carry-overs in the photo pipeline and privacy guard (WR-01..03, WR-05..08)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 10-03-PLAN.md — Viewer layout tiers (lb-scroll/key/gutter), contain-fit stage, two-column strip, loading and error states, gallery contrast pairs
- [x] 10-04-PLAN.md — Grid view at ?view=grid: justified rows, slide-mount captions, rewritten GalleryGrid test

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 10-05-PLAN.md — In-site lightbox: @modal slot, intercepted route, native dialog, focus trap and return, scroll lock (G3), Home links to photo pages

**Wave 4** *(blocked on Wave 3 completion)*
- [ ] 10-06-PLAN.md — Previous/next without history entries (history.replaceState on both surfaces, Tim's OQ1 answer 2026-10-26), counter, swipe, grid-to-lightbox morph
- [ ] 10-07-PLAN.md — Carousel view: capability gate, flat stepper, restyled 3D carousel, no auto-advance, manifest textures

**Wave 5** *(blocked on Wave 4 completion)*
- [ ] 10-08-PLAN.md — Map as the default view: deterministic label layout, survey-sheet MapSheet, header band, shared sheet title
- [ ] 10-10-PLAN.md — Zoom fit/1:1 with drag and key pan and the Escape layer

**Wave 6** *(blocked on Wave 5 completion)*
- [ ] 10-09-PLAN.md — Map · Grid · Carousel switcher in the URL; legacy photo UI and bridge deleted, tests rewritten
- [ ] 10-11-PLAN.md — Hotspot callouts: gutter labels, numbered key, Hide labels (localStorage), strip legend

**Wave 7** *(blocked on Wave 6 completion)*
- [ ] 10-12-PLAN.md — Cross-view e2e sweep and visual coverage for the map, grid, carousel, photo page and lightbox

**Wave 8** *(blocked on Wave 7 completion)*
- [ ] 10-13-PLAN.md — One CI re-baseline (Tim commits PNGs), CI green twice, ratchet raise, review and deferred records (checkpoints)

**UI hint**: yes
**Parallelism**: Can run in parallel with Phase 11. They share only the Phase 7 shell and the Phase 8 data.
**Scope notes**:
  - Routes: `photos/layout.tsx` with `@modal/(.)[slug]`, a mandatory `@modal/default.tsx`, a null `@modal/page.tsx`, and a full `photos/[slug]` page. The URL is the single source of view and lightbox state (`?view=` via `router.replace`).
  - View transitions: names stay unique (the grid thumbnail drops its name while its photo is open), with explicit `::view-transition-*` reduced-motion CSS.
  - Justified rows are built in-house, with no layout or lightbox library.
  - Remaining image consumers move to the Phase 8 manifest, which unblocks deleting the legacy variants in Phase 12.
  - `photos.spec` and `GalleryGrid.test` are rewritten, not deleted.
  - Photo routes stay Server Components that export metadata, so Phase 12 can attach OG images (SEO-02).
  - If Phase 9 has shipped, its Home waypoint links are repointed to `/photos/[slug]`.

**Research**: Needs a spike during planning:
  - `<dialog>` + `showModal()` versus an overlay + `inert`, with `<ViewTransition>`, in Chromium, Safari 26 and Firefox 157.
  - Closing on popstate (Back may skip the close animation, so nothing may depend on it).
  - Interception when a photo is opened from Home.

**Inputs from Tim**: None. The Map default view, the rights wording and the no-download posture are already decided.

### Phase 11: Engineering & Roadmap

**Goal**: Visitors read Tim's engineering work as surveyed routes (route-panel projects, case studies with honest metrics, and CLI_X's risk bands as Swiss trail grades) and follow his roadmap as a route log.
**Depends on**: Phase 8
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ROUTE-01, ROUTE-02, ROUTE-03
**Success Criteria** (what must be TRUE):
  1. `/projects` shows each project as a full-width route panel with name, pitch, metric strip, trail-grade badge and elevation-profile glyph. No hexagon cards remain anywhere on the site.
  2. Each project page reads as a case study (problem, pipeline diagram, safety, metrics, demo, stack, next steps) and omits any section without data. Metrics appear as an instrument panel in tabular numerals with a context line, and every claim is either sourced or softened.
  3. CLI_X's four risk bands appear as Swiss trail grades: T1 yellow, T2–T3 white-red-white, T4–T5 white-blue-white, and unmarked. Each has its marker glyph, text label and score range, and an equivalent data table follows, so the scale reads without color.
  4. The terminal demo is styled in tokens v2, stops auto-playing on focus, on hover and under reduced motion, and has a pause button.
  5. `/roadmap` places items in order on a vertical elevation axis: completed items below with their completion dates, in-progress items at the current camp, planned items above. It lists v2.0 as in progress and shows a "last surveyed" date. A segmented control filters by project and status, the filter lives in the URL, and empty filters are removed or disabled.

**Plans**: TBD
**UI hint**: yes
**Parallelism**: Can run in parallel with Phase 10.
**Scope notes**:
  - `RoutePanel` replaces the hex cards.
  - The `CaseStudy` template's data-optional sections are driven by the Phase 8 typed highlights.
  - `RiskScale` is built on `lib/trail-grade.ts`, with trail yellow kept outside `--color-*` so it can never become a text color.
  - `DemoTerminal` is restyled and gains a pause control. Step controls and a transcript are deferred (ENG-F1).
  - `RouteLog` keeps its filter state in the URL via `router.replace`.
  - Project routes stay Server Components that export metadata, so Phase 12 can attach OG images (SEO-02).
  - Tests assert state (for example `aria-pressed`), not color classes.

**Research**: No research step needed (established patterns), but the phase is gated on content: collect the inputs below before planning.
**Inputs from Tim**:
  - CLI_X behavior per trail grade, and Medium and Critical demo commands with a `riskScore`.
  - Sources for the "95% accuracy" and "40% faster" claims; without them the claims are softened.
  - Roadmap item order, `completedAt` dates and the "last surveyed" date.
  - Confirmation that route panels use a generated elevation-profile glyph rather than screenshots.

### Phase 12: Contact, Edge Pages, Cleanup & Verification

**Goal**: The last pages join the design system, every page can be found and previews well when shared, dead code is gone, and the whole site is verified accessible, cross-browser and regression-free.
**Depends on**: Phase 9, Phase 10, Phase 11
**Requirements**: CONTACT-01, CONTACT-02, CONTACT-03, EDGE-01, EDGE-02, SEO-01, SEO-02, SEO-03, VERIFY-01, VERIFY-02, VERIFY-03, VERIFY-04
**Success Criteria** (what must be TRUE):
  1. A visitor signs a dark "summit register" contact form:
     - It has visible labels and field borders, Tim's email as selectable text and the location as coordinates.
     - Errors appear under each field and in an error summary that receives focus, and input is kept.
     - Submitting shows progress, then a "register signed" confirmation or a recoverable error.
     - Honeypot submissions are rejected, while CSRF protection and rate limiting work unchanged.
  2. Any unknown URL, including the deleted playground routes, shows "You've left the marked trail" with contour art and a route home. The error, global-error and offline pages use the same shell. After a deploy, a returning visitor gets fresh pages, never stale v1 HTML from the service worker.
  3. Every route has its own title, description and canonical URL. Every photo and project page has its own Open Graph image. The site serves a generated `sitemap.xml` and `robots.txt`.
  4. `Header`, `GlassmorphismNav`, `ParticleButton`, `AnimatedGradientMesh`, `useHexGrid`/`hex-clip`, the legacy image variants, the v1 token aliases and unused CSP origins are gone from the repo, and the build, tests and baselines stay green.
  5. axe reports zero violations on every route, and a keyboard-only pass through navigation, map, lightbox and contact form succeeds. Chromium, Firefox and WebKit runs pass, including the View Transitions and WebGL fallbacks. No route has CLS above 0.1, broken internal links, missing images or CSP console errors.

**Plans**: TBD
**UI hint**: yes
**Scope notes**:
  - `SummitRegister` is a restyle: `/api/feedback`, CSRF, Upstash rate limiting and accessible names stay. It adds the honeypot and the error summary.
  - Service-worker navigations become network-first, with an update e2e test.
  - Legacy image variants are deleted only behind an asset-exists Jest test, once Phases 8–10 have migrated every consumer.
  - The v1 aliases are removed and the `white`/`black` ratchet is brought to 0; then `@theme { --color-*: initial; }` is added as a compile-time backstop.
  - `raw.githubusercontent.com` is dropped from `connect-src`.
  - One shared contour OG-image template serves photo and project pages.
  - PROJECT.md is updated.
  - The PITFALLS "Looks Done But Isn't" checklist runs in the milestone audit.

**Research**: No research step needed.
**Inputs from Tim**: Which location to show as coordinates on the contact page.
**Why SEO-02 is here**: Research placed photo OG images in Phase 10 and project OG images in Phase 11. SEO-02 is a single requirement covering both, and those phases run in parallel, so neither can satisfy it alone. It sits here, where one shared template covers both route families after they exist.

## Progress

**Execution Order:**
7 → 8 → 9 → 10 ∥ 11 → 12 (Phases 10 and 11 can run in parallel)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Dependency Resolution & Code Quality | v1.0 | 3/3 | Complete | 2026-02-16 |
| 2. Security & Reliability Hardening | v1.0 | 6/6 | Complete | 2026-02-17 |
| 3. Design Foundation | v1.0 | 3/3 | Complete | 2026-02-17 |
| 4. Design Components | v1.0 | 6/6 | Complete | 2026-02-17 |
| 5. Performance & Accessibility Polish | v1.0 | 5/5 | Complete | 2026-03-11 |
| 6. Integration Wiring Fixes | v1.0 | 1/1 | Complete | 2026-03-12 |
| 7. Foundation & Guardrails | v2.0 | 27/27 | Complete    | 2026-10-24 |
| 8. Data & Terrain Pipeline | v2.0 | 13/13 | Complete    | 2026-10-24 |
| 9. Home Ascent | v2.0 | 22/22 | Complete    | 2026-10-25 |
| 10. Photography | v2.0 | 4/13 | In Progress | - |
| 11. Engineering & Roadmap | v2.0 | 0/TBD | Not started | - |
| 12. Contact, Edge Pages, Cleanup & Verification | v2.0 | 0/TBD | Not started | - |
