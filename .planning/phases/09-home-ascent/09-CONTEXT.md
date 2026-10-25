# Phase 9: Home Ascent - Context

**Gathered:** 2026-10-24
**Status:** Ready for planning
**Amended:** 2026-10-25 at gap planning (D-09 amendment; D-15 note). Source: `09-UAT.md` "Gap Plan Decisions".

<domain>
## Phase Boundary

Home is rebuilt as the ascent. Visitors land on the real Matterhorn terrain (Phase 8 data) and climb it with native scrolling. They pass Tim's four photographs at their DEM heights and end at the summit with the trail-sign routes and a summit plaque. Every visitor gets a complete, readable Home: the server-rendered hillshade poster is the LCP and the fallback, and the R3F canvas is a lazy enhancement on capable devices.

Requirements: HOME-01 … HOME-08. Already fixed by the roadmap scope notes (not reopened here):
- `AscentHero` with a server-rendered poster plus a DOM waypoint list beneath a lazy R3F canvas
- `frameloop="demand"`, a CPU-built mesh from the `fast-png`-decoded heightmap, an `fwidth` contour shader, `dpr={[1, 1.5]}`, `svh` units
- One Motion `useScroll` value drives both the camera and `AltimeterRail`; CSS scroll-driven animations are decoration only (Firefox 157 lacks them)
- HTML overlay labels, no drei `<Text>` (CSP blocks its blob workers), no drei `useDetectGPU` or `ScrollControls`, GPU resources disposed on unmount
- Waypoints at DEM-sampled heights; the rail runs 1,617 m → 4,478 m (08 D-17)
- Waypoint links point at the photo in the gallery until Phase 10 ships `/photos/[slug]`
- The summit-plaque stats are chosen in the UI-SPEC

Out of this phase: the `/photos` Map/Grid/Carousel views and lightbox (Phase 10), case studies and the trail-grade risk scale (Phase 11), and general dead-code removal and the edge pages (Phase 12).

</domain>

<decisions>
## Implementation Decisions

### Ascent pacing & route
- **D-01: Equal stages.** The climb has four legs: Zermatt (1,617 m) → Gornerschlucht (1,668 m) → Glacier Trail (2,585 m) → Riffelsee (2,760 m, approx.) → summit (4,478 m). Each leg gets the same share of the scroll track. Within a leg, the altitude readout interpolates between the two real heights, so every number shown is true. The rail's waypoint ticks are spaced evenly, so it reads like a route profile, not a linear altimeter. Reason: a linear mapping bunches the first two photos within ~2% of the scroll and leaves the top 60% with no photos.
- **D-02: Steady approach camera.** One smooth, rising path runs from above Zermatt (NE of the extent) toward the summit (W). The camera turns gently to face each stage's waypoint while that stage is active, but it never detours to it. Riffelsee (SE of the Glacier Trail spot) is seen across the valley. Rejected: visiting each photo spot (4 km east, then 8 km west, which risks vestibular discomfort) and a rising orbit.
- **D-03: The summit frame looks back down.** At 4,478 m the camera settles just above the summit and turns back NE toward Zermatt, with all four waypoints visible below along the route. The summit plaque and the trail signs sit over this frame.
- **D-04: Length is about one viewport per leg:** roughly 500svh of sticky track (4 legs plus a summit hold), measured inside the stage height from D-12. A trackpad flick should not skip a stage.
- **D-05: The altimeter rail stays decorative** (HOME-04 as written): no click, no focus, `aria-hidden`, hidden below 768 px. Visitors navigate with the skip link (D-15) and the stage cards (D-08).
- **D-06: Light camera damping.** The camera eases toward the scroll target over about 200–300 ms. Under `frameloop="demand"`, keep calling `invalidate()` from `useFrame` until the camera is within ε of the target, then stop (ARCHITECTURE §5 gotcha).

### Waypoint moments
- **D-07: A photo card at each stage.** When a leg reaches its waypoint, an HTML card appears on the side away from the rail. It holds the photo at its true 3:2 ratio (~400 px wide, from the Phase 8 image manifest derivatives, never the legacy `-large/-thumb` variants), the title, the DEM altitude, the approved one-line story from `data/photos/editorial.ts`, and a "View photo" link. That stage's 3D pin lights up. The terrain stays the stage; the photo is the waypoint.
- **D-08: The cards are the HOME-05 list.** The four stage cards are real `<section>`s with headings, in ascending-altitude order, and they are always in the DOM. There is no second list. In 3D mode a card shows during its stage, and moving keyboard focus to its link scrolls the page to that stage. In static mode (D-21) all four render stacked in their final state over the poster. — **Reversibility:** costly. The card sections are also the HOME-05 list, the focus/scroll contract, and what the e2e and axe assertions target. Splitting them into a separate list later means rewriting focus handling and those tests.
- **D-09: All pins visible, the active one lit.** All four pins show on the terrain from the start, so the route ahead reads like a map. The active stage's pin brightens and carries its HTML label. The Riffelsee pin is drawn dashed and labelled "approx.", matching the footer's dashed tick (DATA-04, 08 D-02). Pins are decorative in the canvas; the links live in the cards. — **Amended 2026-10-25 (gap closure G-09-3 a; Tim: "Accept, amend D-09"):** one exception, in the static poster only. At about 768-1090 px stage width, waypoint 3's pin head lies under its own card while waypoint 3 is active: the poster pins keep their fixed plan-view positions (D-16), and the card sits on the side away from the rail (D-07). So that pin's label is not displayed there. The rule, built in 09-19: a poster label is hidden while the lit head's centre lies inside its own card; every other lit poster label is placed clear of its card and the rail. Live 3D keeps every lit pin and its label clear of its card (09-21), so 3D has no exception. A "head under its card" case other than waypoint 3 at about 768-1090 px is not covered by this amendment and goes back to Tim.
- **D-10: Each card has a place + date line.** It is mono, e.g. "Gornerschlucht, Zermatt · Sep 2021"; the film scan shows "2019" only (08 D-03). Build it from the editorial `location` and `lib/photo-format.ts`. Full EXIF stays in the Phase 10 lightbox.

### First viewport & page
- **D-11: Hero copy.** A mono kicker "45.9763 N · 7.6586 E" (the summit, from `terrain.ts` or `lib/geo.ts`, not hand-typed), the h1 "Tim Lui", the role line from `data/site.ts` ("Developer & photographer"), then the thesis "Photographs and software from one mountain." (from the approved plan mockup). All of it is server-rendered and readable with no animation, no WebGL and no JS (HOME-01).
- **D-12: Keep the solid sticky `SiteNav`.** There is no transparent or auto-hiding nav on Home and no Home-only nav state. The sticky stage is `100svh` minus `--nav-h`. This settles the question the Phase 7 UI-SPEC deferred to Phase 9 ("fixed nav that turns transparent over the hero").
- **D-13: The trail signs are the hero CTA, repeated at the summit.** Two trail-sign links, "Photographs · N waypoints" → `/photos` and "Engineering · N routes" → `/projects`, with counts derived from data (4 and 2 today). They sit in the first viewport and again over the summit frame (D-03). A quiet "Start the ascent ↓" cue sits below them.
- **D-14: Below the summit:** a short first-person About (2–3 sentences; **Claude drafts, Tim approves**, so the plan needs a copy-review checkpoint like 08 D-05) and one contact line linking to Contact and Roadmap. The old stat tiles, the two feature cards, the skill chips and the "Let's Work Together" panel are removed. This also fixes the 375 px horizontal overflow logged in `.planning/phases/08-data-terrain-pipeline/deferred-items.md` (the legacy project card).
- **D-15: A visible "Skip to the summit" link** sits next to the "Start the ascent ↓" cue, so mouse and touch users can use it too. It lands on the summit section (plaque and trail signs). The global `SkipLink` ("Skip to content") is unchanged. — **Note 2026-10-25 (gap closure G-09-2, 09-18; follows the planner's "relocate the stats" layout choice, which Tim reviews at 09-22):** in the compact summit layout (tall modes on every stage except landscape viewports about 1100-1943 px wide), the link still lands on the summit section, with the compact plaque (summit name and height) and the trail signs in view. The plaque kicker and the four stats sit just below the landing view, right after the summit frame. The landing target and the focus move are unchanged. The full layout and reduced motion keep the stats on the plaque.
- **D-16: The 3D canvas starts top-down and tilts in.** At scroll 0 the 3D camera matches the plan-view hillshade poster frame exactly, so the canvas fades in over the poster with no visible jump. The opening part of the track tilts the map into perspective over Zermatt (the map comes alive), then the four legs (D-01) follow. Visitors who don't get 3D keep the plan-view poster, which is the same frame. — **Reversibility:** costly. The poster from Phase 8 (08 D-16) is a plan view. Any other opening needs either a visible viewpoint jump or a new build-time perspective render that has to stay in sync with the camera route.
- **D-17: Night-tinted terrain.** The light-grey hillshade asset stays unchanged (Tim approved it at 08-06). On Home it is tinted into the night palette in CSS (e.g. multiplied with the surface token), with contour lines in the `contour` token on top (via `ContourField` or an equivalent mask). The 3D shader uses the same dark ground and contour colour. The hero text gets a soft scrim on its side. AA contrast is measured on the composed result (poster + tint + scrim), not on token pairs alone.

### Mobile & load policy
- **D-18: Capable phones get 3D.** The capability gate decides, not the viewport width. Reduced motion, Save-Data, no WebGL2, `deviceMemory < 4`, a PerformanceMonitor fallback or a lost context → static. Phones use the 256² heightmap. The rail is hidden below 768 px (HOME-04).
- **D-19: The canvas code loads at idle or on first scroll**, whichever comes first. The poster and h1 own LCP and hydration. If 3D isn't ready yet, the poster holds while scrolling (the DOM cards still work), and the canvas fades in at the current camera position. Today's Home imports three.js, R3F and drei statically, so the HOME-08 baseline (LCP 4,692 ms, script transfer 468,770 B; see `07-26-SUMMARY.md`) already includes them, and a lazy canvas should land under it. The researcher confirms with the `perf` project in the same container.
- **D-20: Below 768 px the stage card docks at the bottom of the stage over a scrim** (about the lower 40%): photo, title, altitude/date and link. The camera frames its target in the upper part, so the lit pin stays visible above the card.
- **D-21: The static mode is a full experience, not an error state.** Under reduced motion, Save-Data, no WebGL2, low memory or a lost context, Home shows the night-tinted plan-view poster with contours, all four cards stacked in final state, the plaque and the trail signs. No camera flight and no scrubbing (HOME-02, HOME-07).
- **D-22: Canvas regression coverage is static baselines plus a canvas smoke test.** The route baselines keep hiding canvases (`e2e/visual/hide-canvas.css`) and capture the poster, cards and rail in deterministic states (reduced motion, plus fixed scroll positions). A separate SwiftShader smoke test renders the canvas at 3 scroll positions and checks it by pixel sampling: not blank, contour lines present, camera progressing between positions. It is not an exact-diff baseline, so GPU-path changes don't force re-baselines.

### Claude's Discretion
- The exact camera curve (route control points, FOV, look-at targets, damping constant), how the tilt-in shares the track with leg 1, and whether the rail holds at 1,617 m during the tilt-in.
- How pins and their HTML labels are built (mesh/sprite pins; label positions projected from the 3D point; drei `<Html>` is acceptable if it needs no workers under the CSP).
- The link target format for "View photo" until Phase 10 (e.g. `/photos#<slug>` with matching ids in the gallery). Keep it minimal and do not build any of Phase 10's lightbox or routing.
- Whether `Hero3DMountain`, `MountainTerrain3D`, `DualParticleSystem`, `GeologicalButton` and `lib/useGlowIntensity.ts` are deleted in Phase 9. Nothing else imports them, so once Home is rebuilt they are dead. Deleting them here is the cleaner default; also trim `LEGACY_COMPILER_FILES` and remove the scroll-arrow pin from `e2e/visual/hide-canvas.css` (STATE: 07-03 note).
- Card enter/leave transitions between stages (motion tokens from `lib/animations.ts`, final state under reduced motion).
- Capability thresholds beyond those listed in D-18, and the shader tuning (index lines, line width, fade with distance). These are research items.

### For the UI-SPEC (not decided here)
- The summit-plaque stats, which must be derived from data with no count-up animation (FEATURES). Today's hard-coded "850+ Tests Passing" and "20% Roadmap Complete" must not carry over unless backed by data.
- The trail-sign visual. The approved plan uses a yellow signpost fill. FEATURES flags yellow-everywhere as diluting T1 "Low risk" (Phase 11), and `07-UI-SPEC` reserves the primary fill for one action per view. There is no `trail` token yet (`--color-caution` is the existing yellow). Reconcile these.
- A hero-only display size (07-UI-SPEC allows Phase 9 to add one), the card layout and typography, the rail's tick and readout styling, and the "approx." pin treatment in 3D.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 9: Home Ascent": goal, success criteria, scope notes (the locked architecture list above), research list, inputs from Tim
- `.planning/REQUIREMENTS.md`: HOME-01 … HOME-08
- `.planning/PROJECT.md` §Constraints (dark-only, same-origin assets, nonce CSP, ui-ux-pro-max for all UI work, photo rights) and §Key Decisions (D-17 DEM heights, hillshade poster lighting, `SafeCanvas`, baselines only from CI, platform APIs over libraries)

### Prior phase decisions
- `.planning/phases/08-data-terrain-pipeline/08-CONTEXT.md`: D-02 (approx. Riffelsee pin), D-03 (year-only film scan), D-14 (11 km extent, which drives the camera route), D-16 (poster = hillshade + contours), D-17 (DEM heights, 1,617 m rail start, official 4,478 m summit), D-21 (footer stays static)
- `.planning/phases/08-data-terrain-pipeline/08-UI-SPEC.md`: footer legend, dashed approx. tick, contour token usage
- `.planning/phases/07-foundation-guardrails/07-UI-SPEC.md`: tokens v2, type roles, sticky solid nav (§nav table), single primary action rule, motion rules, "Phase 9 may add a hero-only display size"
- `.planning/phases/07-foundation-guardrails/07-26-SUMMARY.md`: the HOME-08 baseline numbers and how to re-measure (`--project=perf`, same container)
- `.planning/phases/08-data-terrain-pipeline/deferred-items.md`: the 375 px Home overflow, owned by Phase 9

### Research (milestone)
- `.planning/research/ARCHITECTURE.md` §5: terrain component tree (`AscentHero`, `TerrainStage`, `TerrainCanvas`, `CameraRig`, `AltimeterRail`, `WaypointList`), server/client boundary, capability gate, `useScroll` → camera without re-renders, offscreen pause, shader, heightmap decode, `ContourField`. Note: D-12 overrides §1's "fixed nav that turns transparent over the hero"; D-08 makes the cards the waypoint list
- `.planning/research/FEATURES.md` §"HOME: Home ascent": expected behaviours, table stakes, anti-features (no particles, no autoplay camera, no scroll-jacking). Note: D-05 overrides its "rail as clickable navigation"
- `.planning/research/PITFALLS.md`: geodesy/DEM placement, reduced motion with scroll timelines, WebGL context loss
- `.planning/research/STACK.md`: fast-png 8.0.0, R3F 9.8.1 / drei 10.7.9 / three versions, Motion 14.1
- Approved plan with the direction A mockup (hero kicker, thesis, trail signs, rail): https://claude.ai/artifact/GXsHFNbtf7Qp6hPSYxuY8U

### Guardrails & test infrastructure
- `e2e/visual/README.md`, `e2e/visual/routes.spec.ts` (Home has 0/50/100% scroll shots with motion), `e2e/visual/hide-canvas.css`: the Home baselines will change; Tim commits the PNGs
- `e2e/perf/home-baseline.spec.ts` + `e2e/perf/home-baseline.json`: the HOME-08 target
- `e2e/homepage.spec.ts`, `e2e/no-webgl.spec.ts`: rewrite, never delete (test-count ratchet `scripts/guards/test-count.mjs`)
- `scripts/guards/check-palette.mjs`, `scripts/guards/check-contrast.mjs`: no `dark:` or stock palette classes; every new text/background pair passes
- `components/SafeCanvas.tsx`: the only allowed R3F `Canvas` entry (ESLint `no-restricted-imports`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `data/generated/terrain.ts`: extent (LV95, 11 × 11 km), grids (512 desktop / 256 mobile), contour intervals (hero 100 m, index every 5), summit (official 4,478, DEM 4,473, LV95 and UV), and content-hashed asset URLs (heightmaps, `contours-hero` SVG, hillshade AVIF/WebP at 640 and 1100).
- `data/generated/photos.ts`: per-photo `uv`, `elevation.m` (DEM), `position.approximate`, capture and tags; `lowestDemM = 1617`. UV positions: Zermatt (0.68, 0.27), gorge (0.66, 0.34), Glacier Trail (0.46, 0.52), Riffelsee approx. (0.83, 0.59), summit (0.10, 0.67).
- `data/photos/editorial.ts`: slug, title, alt, location and story per photo (approved copy, 08-10).
- `data/generated/image-manifest.ts`: hashed AVIF/WebP derivatives at 640/1024/1600/2560 for the card photos.
- `components/terrain/ContourField.tsx`: server-rendered contour mask over the `bg-contour` token (zero JS).
- `lib/geo.ts` (WGS84 ↔ LV95 ↔ UV), `lib/photo-format.ts` (`formatCaptureLabel`, `formatMetres`), `lib/animations.ts` (`EASING`, `DURATION`, CSS var helpers), `lib/useReducedMotion.ts` (`useSyncExternalStore` pattern to reuse for the capability gate).
- `components/SafeCanvas.tsx`: error-boundary wrapper for R3F (R3F ≥ 9.8 rethrows WebGL-creation errors).
- `data/site.ts`: name, role, links; `data/projects.ts` (2 projects) for the trail-sign count.

### Established Patterns
- Server Components by default with client islands. `ssr:false` dynamic imports only from Client Components; nothing from `three`/R3F may be reachable from a Server Component import graph (ARCHITECTURE §5).
- Generated data is committed and typed, and `--check`ed in lint. Phase 9 should consume it, not regenerate it.
- Visual baselines come only from the CI `workflow_dispatch` container at threshold 0.01, and Tim commits the PNGs. Canvases are hidden with `visibility: hidden`, never masked.
- Tests are rewritten, never deleted. The ratchet only goes up.
- Every UI task runs through the `ui-ux-pro-max` skill (project requirement).

### Integration Points
- `app/(site)/page.tsx` is a `'use client'` page today. It becomes a Server Component that renders `AscentHero` plus the summit/About sections.
- `components/Hero3DMountain.tsx` → `MountainTerrain3D`, `DualParticleSystem`, `GeologicalButton`, `useGlowIntensity`: the whole chain is imported only by Home (verified), so it becomes dead code (see Claude's Discretion).
- `public/service-worker.js` + `data/generated/precache.json`: the terrain assets Home now fetches (heightmap, hillshade) should be precached or cached consistently with Phase 8's hashed-asset plumbing.
- `proxy.ts` CSP: no blob workers, so no worker-based decoders; `img-src 'self'` covers the masks and posters.
- `e2e/visual/hide-canvas.css`: remove the Hero3DMountain scroll-arrow pin.

### Carry-overs
- Phase 8 code review (`08-REVIEW-DISPOSITION.md`) has 8 open warnings, to be folded "into the first Phase 9/10 plan that adds photo data". Phase 9 only consumes photo data. Fold them in only if a Phase 9 plan ends up touching the photo pipeline; otherwise they pass to Phase 10.

</code_context>

<specifics>
## Specific Ideas

- The opening is "the map comes alive": the top-down survey sheet (the poster) tilts into the 3D mountain as you start scrolling.
- The summit frame is the reward view: standing on top, looking back down the valley at the four places you passed.
- The first viewport follows the direction A mockup: coordinate kicker in mono, the name, the thesis, and two trail signs with counts like the walking times on real Swiss signposts.
- Trail-sign counts come from data ("Photographs · 4 waypoints", "Engineering · 2 routes").

</specifics>

<deferred>
## Deferred Ideas

None. The discussion stayed within the phase scope.

</deferred>

---

*Phase: 09-home-ascent*
*Context gathered: 2026-10-24*
