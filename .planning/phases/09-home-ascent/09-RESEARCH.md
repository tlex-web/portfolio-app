# Phase 9: Home Ascent - Research

**Researched:** 2026-10-24
**Domain:** Server-rendered terrain poster plus a lazy React Three Fiber terrain canvas, scroll-linked camera (Motion), capability gating, deterministic WebGL testing (SwiftShader), and the Next 16 LCP and bundle budget
**Confidence:** HIGH for the stack, data contracts, CSS/shader parity and the test harness (all verified by reading code and running spikes this session). MEDIUM for CI runner frame timings and real-phone thresholds (not measurable here).

## Summary

Phase 8 left Phase 9 everything it needs on disk: a typed `terrain` record with content-hashed URLs for the 16-bit heightmaps (512² and 256²), the hero contour SVG and the hillshade poster (AVIF and WebP at 640 and 1100), plus typed photo facts with UV and DEM heights. `fast-png@8.0.0` is **not installed yet**. A spike this session decoded both committed heightmaps with it: grey16, one channel, a `Uint16Array` in decimetres, 512² in about 24 ms in Node. The decoded grids reproduce the summit and photo heights within the expected resampling error. One finding changes how pins are placed: grid-sampled heights differ from the 10 m DEM heights in `photos.ts` by up to 15 m at 512² and 27 m at 256² (in the Gornerschlucht). So **3D anchors must use the mesh height and labels the DEM height**.

Spike 2 rendered the real 512² mesh, textured with the committed hillshade and drawn with an `fwidth` contour shader, in Playwright's Chromium 156. Headless Chromium already renders through **SwiftShader by default**: Playwright 1.64 always adds `--enable-unsafe-swiftshader`, so no extra flags are needed. `failIfMajorPerformanceCaveat: true` does **not** reject SwiftShader. Repeated renders produced identical pixel hashes across browser launches. Spike 3 showed that a raw `ShaderMaterial` that computes `mix(surface, hillshadeTexel, 0.32)` in sRGB-encoded space matches the CSS-composited poster (`opacity: 0.32` image over `bg-surface`) within a mean of 0.65 levels (max 7). **So the canvas can fade in over the poster at p = 0 with no visible change (D-16), if the shader samples the same hillshade image and the terrain is flat at p = 0.**

Three framework facts drive the design. First, drei's `PerformanceMonitor` computes FPS as frames per wall-clock window. Under `frameloop="demand"` that reads idle time as low FPS and declines falsely, so the D-18 performance fallback needs a demand-aware frame-budget sampler. Second, R3F's `<Canvas>` re-measures on every scroll by default (`resize: { scroll: true }`), which must be turned off. Third, `next/dynamic({ ssr: false })` fetches its chunk only when the component first renders (no server preload), so gating that render on idle or first scroll gives exactly D-19.

**Primary recommendation:** Build Home as a Server Component poster and cards with three small client islands: an ascent controller (scroll → one damped progress value), the altimeter rail, and a terrain stage that loads the canvas chunk at idle or first scroll. Render the 3D terrain as a CPU-built, pixel-centre-registered mesh whose height is scaled by a `uRelief` uniform (0 at p = 0, so the start is an exact plan view). Texture it with the same hillshade asset, composite it with the CSS formula, and draw `fwidth` contour lines. Do not use drei on Home.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hero copy, trail signs, cards, plaque, About (HOME-01, 05, 06) | Frontend Server (RSC) | — | Must be complete HTML with no JS, no motion and no WebGL |
| Relief poster + contour mask + poster pins (HOME-02 static, LCP) | Frontend Server (RSC) | CDN / Static (`/terrain/*` immutable) | The LCP element is in the initial HTML; the assets are content-hashed static files |
| Capability gate (reduced motion, Save-Data, memory, WebGL2, frame budget, context loss) | Browser / Client | — | Every signal is a browser API; the server snapshot is "pending", which renders as the poster |
| Scroll → progress → spring (one value) (HOME-03, 04) | Browser / Client | — | Native scroll offsets, measured layout, Motion values |
| Altimeter rail (HOME-04) | Browser / Client | Frontend Server (static ticks SSR) | Ticks and labels are SSR; the marker and readout follow the spring |
| Terrain canvas: decode, mesh, shader, camera, 3D pins (HOME-02, 07) | Browser / Client (lazy chunk) | CDN / Static (heightmap PNG, hillshade) | Never reachable from a Server Component import graph [ARCH §5] |
| Waypoint link target `/photos#slug` | Frontend Server | — | Adds `id={slug}` to the existing `/photos` grid items only |
| Shader colour constants (`data/generated/tokens.ts`) | Build (scripts) | — | Generated from `app/globals.css`, `--check`ed in lint like the other generated files |
| Offline / caching of terrain assets | Service worker (Browser) | — | The existing cache-first rule for `/terrain/` already covers runtime fetches |

## Project Constraints (from AGENTS.md, CLAUDE.md, PROJECT.md, STATE.md and memory)

- **Next.js is not the version in training data** (AGENTS.md): read `node_modules/next/dist/docs/` before any Next-specific code. Verified this session: `next/image` `priority` is deprecated since 16 (use `preload`, or `loading="eager"`/`fetchPriority="high"`) [CITED: node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md §preload, §priority]. `ssr: false` only works in Client Components [CITED: .../02-guides/lazy-loading.md].
- **Dark only:** no `dark:` variants, no stock palette classes, L2 semantic utilities only (GUARD-04 `check-palette.mjs`), and every new text/background pair passes GUARD-05.
- **Same-origin assets, nonce CSP** (`proxy.ts`): `script-src 'self' 'nonce-…' 'strict-dynamic' 'unsafe-eval'`, `img-src 'self' blob: data:`, `connect-src 'self' https://raw.githubusercontent.com`, no `worker-src` [VERIFIED: proxy.ts:6-19]. There are no blob workers, so no drei `<Text>` and no worker decoders.
- **ui-ux-pro-max is required for all UI/UX work** (PROJECT.md constraint + user memory). Every plan task that builds or styles the hero, cards, rail, pins, trail signs, plaque or About, and the visual tuning checkpoint, must invoke the `ui-ux-pro-max` skill.
- **`SafeCanvas` is the only R3F `Canvas` entry** (ESLint `no-restricted-imports`). Import Motion only from `motion/react`, and Phosphor only from `@phosphor-icons/react/dist/ssr` (`*Icon` names).
- **Tests are rewritten, never deleted or skipped.** `scripts/guards/test-count.mjs` rejects `.skip(`/`.only(`/`.fixme(`. Browser-scoped tests use the `@chromium-only` title tag (the `firefox` project has `grepInvert: /@chromium-only/`). Ratchet baseline: jest 416 + e2e 117 = 533 [VERIFIED: scripts/guards/test-count.baseline.json].
- **Visual baselines come only from the CI `workflow_dispatch` container** (`mcr.microsoft.com/playwright:v1.64.0-noble`), threshold 0.01. Tim commits the PNGs. Canvases are hidden with `visibility: hidden`, never masked.
- **Generated data is committed and `--check`ed** (`npm run data:check` in `npm run lint`). Phase 9 consumes it and does not regenerate it.
- **User profile (CLAUDE.md):** present options as comparison tables, flag regression risks explicitly, diagnose before fixing, lead with working code examples.
- **Process memory:** the standing push approval covers `ci/07-NN` and `ci/08-NN` only. `ci/09-NN` pushes and baseline dispatches need Tim's explicit go-ahead; never claim an approval without his literal reply. Never touch settings files. Force-pushes to `ci/*` are blocked; a plain push of a new branch works.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Ascent pacing & route
- **D-01: Equal stages.** The climb has four legs: Zermatt (1,617 m) → Gornerschlucht (1,668 m) → Glacier Trail (2,585 m) → Riffelsee (2,760 m, approx.) → summit (4,478 m). Each leg gets the same share of the scroll track. Within a leg, the altitude readout interpolates between the two real heights, so every number shown is true. The rail's waypoint ticks are spaced evenly, so it reads like a route profile, not a linear altimeter. Reason: a linear mapping bunches the first two photos within ~2% of the scroll and leaves the top 60% with no photos.
- **D-02: Steady approach camera.** One smooth, rising path runs from above Zermatt (NE of the extent) toward the summit (W). The camera turns gently to face each stage's waypoint while that stage is active, but it never detours to it. Riffelsee (SE of the Glacier Trail spot) is seen across the valley. Rejected: visiting each photo spot (4 km east, then 8 km west, which risks vestibular discomfort) and a rising orbit.
- **D-03: The summit frame looks back down.** At 4,478 m the camera settles just above the summit and turns back NE toward Zermatt, with all four waypoints visible below along the route. The summit plaque and the trail signs sit over this frame.
- **D-04: Length is about one viewport per leg:** roughly 500svh of sticky track (4 legs plus a summit hold), measured inside the stage height from D-12. A trackpad flick should not skip a stage.
- **D-05: The altimeter rail stays decorative** (HOME-04 as written): no click, no focus, `aria-hidden`, hidden below 768 px. Visitors navigate with the skip link (D-15) and the stage cards (D-08).
- **D-06: Light camera damping.** The camera eases toward the scroll target over about 200–300 ms. Under `frameloop="demand"`, keep calling `invalidate()` from `useFrame` until the camera is within ε of the target, then stop (ARCHITECTURE §5 gotcha).

#### Waypoint moments
- **D-07: A photo card at each stage.** When a leg reaches its waypoint, an HTML card appears on the side away from the rail. It holds the photo at its true 3:2 ratio (~400 px wide, from the Phase 8 image manifest derivatives, never the legacy `-large/-thumb` variants), the title, the DEM altitude, the approved one-line story from `data/photos/editorial.ts`, and a "View photo" link. That stage's 3D pin lights up. The terrain stays the stage; the photo is the waypoint.
- **D-08: The cards are the HOME-05 list.** The four stage cards are real `<section>`s with headings, in ascending-altitude order, and they are always in the DOM. There is no second list. In 3D mode a card shows during its stage, and moving keyboard focus to its link scrolls the page to that stage. In static mode (D-21) all four render stacked in their final state over the poster. — **Reversibility:** costly. The card sections are also the HOME-05 list, the focus/scroll contract, and what the e2e and axe assertions target. Splitting them into a separate list later means rewriting focus handling and those tests.
- **D-09: All pins visible, the active one lit.** All four pins show on the terrain from the start, so the route ahead reads like a map. The active stage's pin brightens and carries its HTML label. The Riffelsee pin is drawn dashed and labelled "approx.", matching the footer's dashed tick (DATA-04, 08 D-02). Pins are decorative in the canvas; the links live in the cards.
- **D-10: Each card has a place + date line.** It is mono, e.g. "Gornerschlucht, Zermatt · Sep 2021"; the film scan shows "2019" only (08 D-03). Build it from the editorial `location` and `lib/photo-format.ts`. Full EXIF stays in the Phase 10 lightbox.

#### First viewport & page
- **D-11: Hero copy.** A mono kicker "45.9763 N · 7.6586 E" (the summit, from `terrain.ts` or `lib/geo.ts`, not hand-typed), the h1 "Tim Lui", the role line from `data/site.ts` ("Developer & photographer"), then the thesis "Photographs and software from one mountain." (from the approved plan mockup). All of it is server-rendered and readable with no animation, no WebGL and no JS (HOME-01).
- **D-12: Keep the solid sticky `SiteNav`.** There is no transparent or auto-hiding nav on Home and no Home-only nav state. The sticky stage is `100svh` minus `--nav-h`. This settles the question the Phase 7 UI-SPEC deferred to Phase 9 ("fixed nav that turns transparent over the hero").
- **D-13: The trail signs are the hero CTA, repeated at the summit.** Two trail-sign links, "Photographs · N waypoints" → `/photos` and "Engineering · N routes" → `/projects`, with counts derived from data (4 and 2 today). They sit in the first viewport and again over the summit frame (D-03). A quiet "Start the ascent ↓" cue sits below them.
- **D-14: Below the summit:** a short first-person About (2–3 sentences; **Claude drafts, Tim approves**, so the plan needs a copy-review checkpoint like 08 D-05) and one contact line linking to Contact and Roadmap. The old stat tiles, the two feature cards, the skill chips and the "Let's Work Together" panel are removed. This also fixes the 375 px horizontal overflow logged in `.planning/phases/08-data-terrain-pipeline/deferred-items.md` (the legacy project card).
- **D-15: A visible "Skip to the summit" link** sits next to the "Start the ascent ↓" cue, so mouse and touch users can use it too. It lands on the summit section (plaque and trail signs). The global `SkipLink` ("Skip to content") is unchanged.
- **D-16: The 3D canvas starts top-down and tilts in.** At scroll 0 the 3D camera matches the plan-view hillshade poster frame exactly, so the canvas fades in over the poster with no visible jump. The opening part of the track tilts the map into perspective over Zermatt (the map comes alive), then the four legs (D-01) follow. Visitors who don't get 3D keep the plan-view poster, which is the same frame. — **Reversibility:** costly. The poster from Phase 8 (08 D-16) is a plan view. Any other opening needs either a visible viewpoint jump or a new build-time perspective render that has to stay in sync with the camera route.
- **D-17: Night-tinted terrain.** The light-grey hillshade asset stays unchanged (Tim approved it at 08-06). On Home it is tinted into the night palette in CSS (e.g. multiplied with the surface token), with contour lines in the `contour` token on top (via `ContourField` or an equivalent mask). The 3D shader uses the same dark ground and contour colour. The hero text gets a soft scrim on its side. AA contrast is measured on the composed result (poster + tint + scrim), not on token pairs alone.

#### Mobile & load policy
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

#### For the UI-SPEC (not decided here)
- The summit-plaque stats, which must be derived from data with no count-up animation (FEATURES). Today's hard-coded "850+ Tests Passing" and "20% Roadmap Complete" must not carry over unless backed by data.
- The trail-sign visual. The approved plan uses a yellow signpost fill. FEATURES flags yellow-everywhere as diluting T1 "Low risk" (Phase 11), and `07-UI-SPEC` reserves the primary fill for one action per view. There is no `trail` token yet (`--color-caution` is the existing yellow). Reconcile these.
- A hero-only display size (07-UI-SPEC allows Phase 9 to add one), the card layout and typography, the rail's tick and readout styling, and the "approx." pin treatment in 3D.

### Deferred Ideas (OUT OF SCOPE)
None. The discussion stayed within the phase scope.

**Also locked:** `09-UI-SPEC.md` (approved 2026-10-24) is the design contract. This research covers the technical HOW behind it. Where research found a UI-SPEC row that is technically wrong, it is flagged in "UI-SPEC corrections" below rather than silently changed.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | Name, role and primary CTA in the first viewport, readable without animation or WebGL | Server Component hero (Pattern 1); e2e with `javaScriptEnabled: false` (Validation); poster `<picture>` LCP (Pattern 1, Pitfall 9) |
| HOME-02 | Real terrain + contours on capable devices; static contour poster otherwise | Capability gate (Pattern 2, thresholds table); terrain mesh + shader (Patterns 6–7); CSS/shader parity (spike 3); context loss (Pattern 9) |
| HOME-03 | Native-scroll camera ascent, no scroll-jacking, skip link | One progress value (Pattern 4); passive R3F events and `pointer-events: none`; snap on large jumps; `#summit` skip target |
| HOME-04 | Decorative altimeter rail 1,617 → 4,478 m, hidden from AT and below 768 px | Pattern 4 (spring → rail transform/readout); `lowestDemM`/`officialM` verbatim values; stage `aria-hidden` |
| HOME-05 | Waypoints at real positions and heights; always-rendered list linking to each photo | Mesh-height anchors vs DEM labels (Pitfall 2); cards as the list (D-08); `/photos#slug` + `id` |
| HOME-06 | Trail signs + summit plaque | Pure formatters and derivations (UI-SPEC); unit and e2e coverage |
| HOME-07 | Final readable state under reduced motion; on-demand canvas that pauses off-screen | `frameloop="demand"` + spring-driven `invalidate`; IntersectionObserver pause; draw-call counting e2e (Validation) |
| HOME-08 | Mobile LCP and JS no worse than Phase 7 | Lazy chunk gated by render (Pattern 3); bundle estimate; perf-spec measurement caveat (Pitfall 8) |
</phase_requirements>

## Standard Stack

### Core (installed versions read from `node_modules/<pkg>/package.json` this session)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.4.2 | App Router, RSC, `next/dynamic` | Project framework [VERIFIED: node_modules] |
| react / react-dom | 19.3.1 | UI runtime | [VERIFIED: node_modules] |
| three | 0.184.0 | WebGL renderer, geometry, `ShaderMaterial` | [VERIFIED: node_modules] |
| @react-three/fiber | 9.8.1 | React renderer for three; `frameloop="demand"`, `invalidate`, `useFrame` | [VERIFIED: node_modules]; via `components/SafeCanvas.tsx` only |
| motion | 14.1.0 | `useScroll`, `useSpring` (`visualDuration`, `.jump()`), `useMotionValueEvent`, `useTransform` | [VERIFIED: node_modules; framer-motion/dist/index.d.ts:1055-1064, 1103-1126; motion-dom/dist/index.d.ts:2610] |
| fast-png | **8.0.0 (to install, exact pin)** | Decode the 16-bit grey heightmap PNG to a `Uint16Array` on the main thread | [VERIFIED: npm registry + legitimacy OK + decode spike]. Named by STACK.md and the ROADMAP scope notes |

### Supporting (already present)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @playwright/test | 1.64.0 (Chromium 156.0.8078.4, Firefox 157.0) | e2e, visual, perf, SwiftShader smoke | [VERIFIED: node_modules/playwright-core/browsers.json] |
| @axe-core/playwright | 4.13.0 | a11y checks on `/` | Existing pattern (`e2e/a11y-contact.spec.ts`) |
| colorjs.io | 0.7.1 (dev) | Build `data/generated/tokens.ts` from `app/globals.css` | Same parser approach as `check-contrast.mjs` |
| jest | 30.4.x (+ next/jest, jsdom) | Unit tests of the pure modules | Use `--testPathPatterns` (Jest 30 flag, verified with `npx jest --help`) |
| @phosphor-icons/react | 2.1.10 | `ArrowDownIcon`, `ArrowLineDownIcon`, `ArrowRightIcon` from `dist/ssr` | Per the UI-SPEC |

### Not used on Home (recommendation)

| Instead of | Use | Why |
|------------|-----|-----|
| drei `PerformanceMonitor` | A demand-aware frame-budget sampler (Pattern 10, ~30 lines, unit-tested) | Verified in `node_modules/@react-three/drei/core/PerformanceMonitor.js:38-47`: `fps = frames.length / msPassed * 1000` over wall-clock windows. With `frameloop="demand"`, idle gaps count as low FPS, so it declines on capable devices |
| drei `<Html>` | A ref-based projection into one DOM pin layer in `useFrame` | One layer, token-styled, the same `PinMark` as the poster pins, no per-pin portal; STACK.md §7 already advised this |
| drei `shaderMaterial` | `new THREE.ShaderMaterial` | No extra API surface; uniforms are typed locally |
| `computeVertexNormals` + lighting | Sample the hillshade texture | Gives exact parity with the poster (spike 3); saves normal memory and build time |

**Result:** Home's lazy chunk imports `three`, `@react-three/fiber` (through `SafeCanvas`) and `fast-png`, and no drei. drei stays installed for `/photos` and `/projects`.

**Installation:**
```bash
npm install fast-png@8.0.0 --save-exact
```
(This pulls in `fflate` and `iobuffer`. `fflate` is already present transitively at 0.8.2 [VERIFIED: npm ls].) Do not add a `version-floors.json` floor unless an advisory requires one (07-07 rule).

**Version verification:** `npm view fast-png version time` → `8.0.0`, published 2025-12-18T07:13:29Z, deps `fflate ^0.8.2`, `iobuffer ^6.0.1`, no postinstall [VERIFIED: npm registry, 2026-10-24].

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| fast-png | npm | 8.0.0 released 2025-12-18 (~10 months) | 8.8 M/wk | github.com/image-js/fast-png | OK | Approved |
| fflate (transitive) | npm | latest 2026-05-16 | 65.5 M/wk | github.com/101arrowz/fflate | OK | Approved |
| iobuffer (transitive) | npm | 6.0.1 2025-08-13 | 8.9 M/wk | github.com/image-js/iobuffer | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
`postinstall`: null for all three [VERIFIED: gsd-tools package-legitimacy check]. Provenance: fast-png is named in the project's own STACK.md research, which was verified against npm on 2026-10-10.

## Architecture Patterns

### System Architecture Diagram

```
Request "/" ──► app/(site)/page.tsx (RSC)
                  │
                  ├─► AscentHero (RSC) ── HTML: grid cell [ Stage | Track ]
                  │     Stage (sticky, aria-hidden)
                  │       ├─ <picture> hillshade (LCP, fetchPriority=high) + CSS tint (opacity .32 over bg-surface)
                  │       ├─ ContourField lod="hero" (CSS mask, zero JS)
                  │       ├─ PosterPins (RSC; data-pin attributes; JS only toggles data-active)
                  │       ├─ [TerrainStage slot] ◄── client island
                  │       └─ [AltimeterRail] ◄────── client island (static ticks SSR)
                  │     Track: Hero block · <ol> 4× WaypointCard <section> · Summit <section id="summit">
                  └─► About section (RSC)

Browser after hydration:
  AscentController (client, wraps Track + Stage islands via context)
    ResizeObserver(blocks) ──► layout {trackTop, D, p_k[]}
    Motion useScroll().scrollY ──► mapProgress(scrollY, layout) = p (raw)
          │  |Δp| > 1/(n+1) ? spring.jump(p) : spring.set(p)   (visualDuration = DURATION.panel)
          ▼
        spring (ONE damped MotionValue)
          ├──► AltimeterRail: marker translateY + readout text (no React re-render)
          ├──► PosterPins / 3D pins: active index (instant swap)
          └──► (if 3D) invalidate() ──► R3F useFrame: camera pose(p), uRelief(p), project pins ──► GL draw

  Capability gate (useSyncExternalStore; server snapshot "pending")
    reduced-motion? ── yes ─► static-reduced (CSS motion-reduce: compact layout; never load canvas)
    Save-Data? deviceMemory<4? no WebGL2? MAX_TEXTURE_SIZE<2048? ── any ─► static-capability (poster)
    else "eligible" ── requestIdleCallback OR first scroll ──► render <LazyTerrainCanvas/> (next/dynamic ssr:false fetches the chunk)
         chunk: fetch heightmap (256 if stage<768 else 512) ─► fast-png decode ─► mesh build ─► hillshade texture from the poster <img>
         first frame at the current p drawn ─► reveal (opacity 0→1, --duration-settle) + swap poster pins → 3D pins
         runtime: frame-budget decline ─► (dpr 1.5→1 once) ─► static
                  webglcontextlost (not self-inflicted) ─► unmount canvas instantly ─► static (no retry)
                  IntersectionObserver(stage) off-screen / tab hidden ─► stop invalidating
```

### Recommended Project Structure

```
app/(site)/page.tsx                 # Server Component: <AscentHero/> + <AboutSection/>
components/home/
├── AscentHero.tsx                  # RSC: grid cell, stage + track, data ordering (photos by elevation.m, tie id)
├── PosterSheet.tsx                 # RSC: sheet box, <picture>, ContourField, PosterPins
├── PinMark.tsx                     # server-safe presentational mark (used by poster + 3D layers)
├── HeroBlock.tsx · TrailSigns.tsx · WaypointCard.tsx · SummitPlaque.tsx · AboutSection.tsx   # RSC
├── AscentController.tsx            # 'use client': layout measure, scroll → p → spring, gate, focus contract, context
├── AltimeterRail.tsx               # 'use client'
├── TerrainStage.tsx                # 'use client': idle/first-scroll trigger + next/dynamic(ssr:false)
└── terrain/                        # lazy chunk only (never imported by a Server Component)
    ├── TerrainCanvas.tsx           # SafeCanvas, frameloop="demand", dpr, resize={{scroll:false}}
    ├── TerrainMesh.tsx             # geometry + ShaderMaterial + texture lifecycle/disposal
    ├── CameraRig.tsx               # useFrame: pose(p), uRelief, pins projection, ε-invalidate
    └── terrain-shader.ts           # GLSL strings + uniform factory
lib/ascent/                         # PURE, import-free where practical, Jest-tested
├── progress.ts                     # mapProgress, altitudeAt, railFraction, activePin, shouldSnap
├── poster-frame.ts                 # posterFrame(stageW, stageH) → visible UV rect
├── capability.ts                   # decideAscentMode(signals) → 'static-reduced'|'static'|'eligible'
├── route.ts                        # key poses (plain numbers) from photos + terrain; no three
└── frame-budget.ts                 # demand-aware sampler
lib/useAscentMode.ts                # 'use client' hook (useSyncExternalStore pattern of lib/useReducedMotion.ts)
lib/terrain/heightmap.ts            # u16 dm → metres, pixel-centre registration helpers, meshHeightAtUv (reuses sampleBilinear)
lib/home-format.ts                  # formatLatLon, formatCaptureMonth, formatKilometres, formatYearRange, countLabel (import-free)
data/home.ts                        # thesis + About/contact copy (DRAFT until Tim approves)
data/generated/tokens.ts            # GENERATED sRGB constants for the shader (scripts/tokens/build-tokens.mjs, --check in data:check)
e2e/helpers/webgl.ts                # shared disableWebGL / spoof helpers (moved from no-webgl.spec.ts)
```

### Pattern 1: Server poster + server cards, client islands only where needed
**What:** `app/(site)/page.tsx` stops being `'use client'`. The poster, contour mask, poster pins, hero copy, cards, plaque and About are RSC. Only `AscentController`, `AltimeterRail` and `TerrainStage` are client.
**When:** always. HOME-01 requires the first viewport to be complete HTML.
**Details:**
- The poster `<picture>` uses `terrain.assets.hillshade.{avif,webp}.{640,1100}` [VERIFIED: data/generated/terrain.ts:89-97, quoted below]. Use `fetchPriority="high"`, `loading="eager"`, `decoding="async"`, `alt=""`, `width`/`height` 1100. **No `<link rel=preload>`**: the image is in the initial HTML, so the preload scanner finds it, and a preload cannot express the AVIF/WebP `type` alternatives of a `<picture>` (Next docs: "In most cases, you should use `loading="eager"` or `fetchPriority="high"` instead of `preload`") [CITED: next docs image.md:290]. A raw `<img>` triggers `@next/next/no-img-element` (warn level in `core-web-vitals`); add a scoped `eslint-disable-next-line` with the reason "content-hashed, pre-sized terrain asset; `<picture>` type switching". `getImageProps({ unoptimized: true })` is the Next-blessed alternative if a disable comment is unwanted [CITED: image.md:1010-1020, 1330-1360].
- `lib/animations.ts` starts with `'use client'` [VERIFIED: lib/animations.ts:1], so a Server Component that imports `DURATION`/`EASING` gets client references, not numbers. RSC markup must use the CSS variables (`duration-(--duration-fast)`, `ease-(--ease-erosion)`).

Verbatim asset values the poster and canvas use [VERIFIED: data/generated/terrain.ts:22-31, 65-97]:
```
"grids": { "desktop": 512, "mobile": 256 },
"hero": { "intervalM": 100, "indexEvery": 5 },
"summit": { "name": "Matterhorn", "officialM": 4478, ... "demM": 4473, "lv95": { "e": 2617049, "n": 1091673 }, "uv": { "u": 0.0954, "v": 0.6661 } },
"heightmap": { "256": "/terrain/heightmap-256.f792a8921f.png", "512": "/terrain/heightmap-512.548be40405.png" },
"contours": { "hero": "/terrain/contours-hero.2f3a04accc.svg", ... },
"hillshade": { "avif": { "640": "/terrain/hillshade-640.b019a3335a.avif", "1100": "/terrain/hillshade-1100.ba22a91f95.avif" },
               "webp": { "640": "/terrain/hillshade-640.80f2045ea4.webp", "1100": "/terrain/hillshade-1100.5b6bae8c54.webp" }, ... }
```
`export const lowestDemM = 1617;` [VERIFIED: data/generated/photos.ts:160]. Code must reference `terrain.assets.*`, `terrain.grids.*` and `lowestDemM`, never these literals.

### Pattern 2: Capability gate (pure decision + client hook)
**What:** `decideAscentMode(signals)` is a pure function and is unit-tested. `useAscentMode()` reads the signals once on the client (cached in module scope) with `useSyncExternalStore`. The server snapshot is `'pending'`, which renders identically to static-capability (the poster), so there is no hydration mismatch. It re-evaluates on the reduced-motion `change` event (the `lib/useReducedMotion.ts` pattern), and a runtime downgrade (frame budget or context loss) is sticky for the page view.

**Thresholds (recommended; D-18 plus discretion):**

| Signal | Rule | Evidence |
|--------|------|----------|
| `prefers-reduced-motion: reduce` | → static-reduced (CSS sees it at first paint, so geometry is compact) | D-18, UI-SPEC Modes |
| `navigator.connection?.saveData === true` | → static | D-18. Chromium only; undefined → pass [CITED: MDN, ASSUMED for non-Chromium] |
| `navigator.deviceMemory < 4` | → static; `undefined` (Firefox, Safari) → pass | D-18. Secure context only, Chromium only [CITED: developer.mozilla.org/docs/Web/API/Navigator/deviceMemory]. Spike: headless Chromium 156 reports `32` on localhost (not capped at 8) and `null` on an insecure origin; Pixel 7 emulation does not change it [VERIFIED: spike] |
| `canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true })` is null | → static | D-18. Spike: returns a context under Playwright's SwiftShader, so CI still gets 3D [VERIFIED: spike]. Release the probe context with `WEBGL_lose_context.loseContext()` |
| `gl.getParameter(gl.MAX_TEXTURE_SIZE) < 2048` | → static | The hillshade texture is 1100 px; WebGL2 guarantees ≥ 2048 [ASSUMED], so this is a cheap sanity check |
| Stage width < 768 px | → 256² mesh (still 3D) | D-18 |
| DPR | `dpr={[1, 1.5]}` | ROADMAP scope notes (supersedes ARCH §5's `[1,2]`) |
| Frame budget (runtime, Pattern 10) | median frame interval > 50 ms over ≥ 20 continuous frames, or < 20 frames in the first 1 s of the reveal burst → drop DPR to 1 once → still over → static | Discretion. 50 ms = 20 fps. Spike: SwiftShader on 32 cores takes 8.5 ms/frame (256², 375×603 at dpr 1.5) and 29–39 ms (512², 1440×836, dpr 1–1.5) [VERIFIED: spike]; CI runners unknown (A3) |
| `webglcontextlost` not caused by our own unmount | → static at once, no retry | D-18, UI-SPEC Modes |

Do **not** sniff the renderer string (SwiftShader, llvmpipe). It is fragile, D-18 does not need it, and it would remove 3D from the CI smoke test. Since Chrome 139, WebGL creation fails instead of falling back to SwiftShader unless `--enable-unsafe-swiftshader` is set, so real software-only Chrome users already land on the WebGL2 rule [CITED: blink-dev "Intent to Remove: SwiftShader Fallback"; developer.samsung.com EnableUnsafeSwiftShader policy].

### Pattern 3: Lazy canvas: render-gated `next/dynamic`
**What:** `next/dynamic(() => import('./terrain/TerrainCanvas'), { ssr: false })` is declared in the Client Component `TerrainStage`. The component is **only rendered once** `armed` is true (`requestIdleCallback` with a `setTimeout` fallback, or the first `scroll` event, whichever comes first) and the gate says `eligible`.
**Why it works:** with `ssr: false`, Next's `Loadable` renders `React.lazy` inside `BailoutToCSRForNextDynamic` and never emits `PreloadChunks` (that only happens on the `ssr: true` server path), so the chunk request starts at first render [VERIFIED: node_modules/next/dist/shared/lib/lazy-dynamic/loadable.js:37-70].
**Rules:** no `loading` component (UI-SPEC: no spinner or skeleton; the poster is complete). The idle callback needs `{ timeout }` so it cannot starve. Remove the first-scroll listener after it fires (`{ once: true, passive: true }`).

### Pattern 4: One progress value (scroll → p → spring → everything)
**What:** read page scroll with `useScroll()` (no `target`). Compute `p` with a pure `mapProgress(scrollY, layout)` from ResizeObserver-measured offsets (`trackTop`, sticky distance `D`, arrival points `p_k` = the progress at which block k's centre meets the stage centre). Feed **one** spring created with `useSpring(0, { visualDuration: DURATION.panel, bounce: 0 })`, set manually: `Math.abs(p - last) > 1 / (n + 1) ? spring.jump(p) : spring.set(p)`. The camera, rail marker, readout and active pin all read that spring.
**Why not `useScroll({ target })`:** Motion's `target` mode runs on a native ViewTimeline whose inset follows `scroll-padding`. That already caused a hero fade bug on this site (STATE 07-21 post-close). Measured offsets also absorb a taller hero block (UI-SPEC "Arrival points are measured").
**Why manual `set`/`jump`:** `useSpring(source)` subscribes to the source itself, so a snap would race the spring's own animation start. Owning the `set`/`jump` call makes the D-06 snap rule deterministic. `MotionValue.jump(v, endAnimation?)` exists in 14.1 [VERIFIED: motion-dom/dist/index.d.ts:2610]. `visualDuration` is a supported spring option [VERIFIED: motion-dom/dist/index.d.ts:2031-2050]. Using `DURATION.panel` (0.25 s) keeps DSGN-08's "motion tokens only" rule.
**Rail without re-renders:** write `translateY` and the readout text from `useMotionValueEvent(spring, 'change', …)` into refs (or `motion.div style={{ y }}` plus a MotionValue child). No React state per frame.

### Pattern 5: Demand frameloop driven by the spring
- `useMotionValueEvent(spring, 'change', () => { if (onScreen) invalidate() })`. Because the spring emits every animation frame until rest, this schedules exactly one R3F frame per spring step.
- D-06 belt-and-braces: in `CameraRig`'s `useFrame`, compare the pose applied this frame with `spring.get()`. If `|Δ| > ε` (1e-4 of progress), call `state.invalidate()`. Otherwise stop.
- The R3F `invalidate` comes from `useThree((s) => s.invalidate)`. Motion values cross the Canvas boundary through React context, because R3F 9 bridges parent contexts.
- **Off-screen:** an `IntersectionObserver` on the stage element plus `document.visibilityState`. When off-screen, skip `invalidate()`; optionally `setFrameloop('never')` from `useThree`. Idle cost is zero.
- `<SafeCanvas frameloop="demand" dpr={[1, 1.5]} resize={{ scroll: false }} flat gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }} style={{ pointerEvents: 'none' }} aria-hidden />`. `resize={{ scroll: false }}` matters: R3F's default is `useMeasure({ scroll: true, debounce: { scroll: 50 } })` [VERIFIED: node_modules/@react-three/fiber/dist/react-three-fiber.esm.js:42-49], which re-measures on every page scroll. R3F registers its wheel listener as passive (`onWheel: ['wheel', true]`) [VERIFIED: events-9ce18a08.esm.js:17604], and with `pointer-events: none` no R3F event ever fires, so native scroll is never intercepted.

### Pattern 6: Terrain mesh: decode, registration, relief uniform
- `fetch(terrain.assets.heightmap[size])` → `decode(new Uint8Array(buf))` (fast-png). **Validate** `width === height === size`, `depth === 16`, `channels === 1`, else throw (caught → static). Metres = `data[i] * terrain.dem.heightScale` (0.1, decimetres) [VERIFIED: terrain.ts:19 `"heightScale": 0.1`; spike decode: 512² `depth=16 channels=1 Uint16Array`, min 1519.2 m, max 4472.7 m].
- **Pixel-centre registration** (to match the hillshade, the hero SVG and `lib/terrain/dem-sample.ts`): vertex `i` of `N` sits at `u = (i + 0.5) / N`. Use `PlaneGeometry(W·(N−1)/N, W·(N−1)/N, N−1, N−1)` with `W = terrain.extent.widthM` (11000), `rotateX(−π/2)`, and **override the `uv` attribute** to `((ix + 0.5)/N, 1 − (iy + 0.5)/N)`. PlaneGeometry's own UVs (`i/(N−1)`) are off by up to half a cell at the edges. Delete the `normal` attribute (lighting comes from the texture).
- World ↔ UV: `x = (u − 0.5)·W`, `z = (v − 0.5)·W` (north = −z, v runs south). This matches `lib/geo.ts` ("u runs east, v runs south (row 0 = north …)") [VERIFIED: lib/geo.ts:5-7]. The spike confirmed that PlaneGeometry after `rotateX(−π/2)` puts heightmap row 0 at −z (contours aligned with the hillshade).
- Store metres in `position.y`. The vertex shader multiplies by `uRelief`, which is 0 at p = 0 and eases to 1 by `p_1`. **At p = 0 the terrain is flat, so any camera looking straight down is an exact plan view**, matching the poster with no orthographic/perspective swap. The tilt-in raises the relief: "the map comes alive" [D-16].
- Mesh sizes: 512² = 262,144 vertices / 522,242 triangles; 256² = 65,536 / 130,050. Decode + build measured at about 35 + 35 ms (512²) and 19 + 15 ms (256²) in Chromium on the dev machine [VERIFIED: spike]. Expect about 4× that on a throttled phone, so yield between fetch, decode and build (`await new Promise(r => setTimeout(r, 0))`) to keep INP clean.

### Pattern 7: Shader: CSS-parity relief plus `fwidth` contours
- **Relief:** `vec3 c = mix(uSurface, vec3(texture(uHill, vUv).r), uReliefOpacity);`. This is the **same formula the browser uses** for an `opacity: .32` image over `bg-surface`. Spike 3: mean abs diff 0.648 levels, max 7, DOM vs GL [VERIFIED: spike]. Requirements: `texture.colorSpace = THREE.NoColorSpace`, a raw `ShaderMaterial` **without** `colorspace_fragment`/`tonemapping_fragment`, `toneMapped: false`, and `flat` on the Canvas. Then the output is written as sRGB-encoded values. `setClearColor('#08101a')` rendered exactly `8,16,26` [VERIFIED: spike].
- **Texture source:** reuse the poster's decoded `<img>` (`new THREE.Texture(img)` after `img.decode()`), so there is no second download and the texels are exactly the poster's. Fall back to `TextureLoader` on `terrain.assets.hillshade.webp[1100]`. Use mipmaps (WebGL2 supports NPOT) and anisotropy `min(8, capabilities.getMaxAnisotropy())` for oblique views.
- **Contours** (heights come from the `aHeight`/`position.y` attribute *before* the relief scale, so lines exist on the flat p = 0 plane too):
  - `f = vH / uInterval`; `d = abs(fract(f − 0.5) − 0.5) / fwidth(f)`; coverage `= clamp(uWidthPx·0.5 + 0.5 − d, 0, 1)` (constant pixel width).
  - Line width = **1 CSS px × DPR**. The SVG uses `stroke-width="1"` with `vector-effect="non-scaling-stroke"`, and intermediate lines use `stroke-opacity="0.6"` [VERIFIED: public/terrain/contours-hero.2f3a04accc.svg header].
  - Alpha: index `0.14`, intermediate `0.084` = `--color-contour` alpha × 0.6. Line colour = firn-50 `#eeebe5` [VERIFIED: app/globals.css:18, 81 `--firn-50: oklch(0.94 0.008 85);` `--color-contour: oklch(0.94 0.008 85 / 0.14);`; colorjs.io conversion this session].
  - `uInterval = terrain.contours.hero.intervalM` (100) and index every `terrain.contours.hero.indexEvery` (5): one source of truth.
- **Tuning (research item):** on steep faces seen obliquely (the Matterhorn faces), `fwidth(f)` grows until the lines merge into a band. Fade lines with `alpha *= 1.0 − smoothstep(0.25, 0.6, fwidth(f))` (fade once an interval spans fewer than ~2–4 px). Optionally fade intermediate lines faster than index lines (`fwidth(f)` vs `fwidth(f/5)`). Declare `precision highp float;`; heights up to 4,478 m need highp for `fract`, and GLSL ES 3.00 requires highp in fragment shaders [ASSUMED].
- **Edge of the world:** fade the terrain colour toward `uSurface` within the last ~4 % of UV at the extent border, scaled by `uRelief` (0 at p = 0, so poster parity holds). Clear colour = surface (opaque canvas, `alpha: false`; with alpha the poster would show through the sky).
- **Colours** come from `data/generated/tokens.ts` (sRGB floats or hex for night-950, firn-50, contour alpha, relief opacity). No hex in components (GUARD-04 intent).

### Pattern 8: Camera route and poster-frame match
- `posterFrame(stageW, stageH)` (pure) returns the visible UV rectangle. The camera at p = 0 looks straight down at its centre. Height `H = (vSpanM / 2) / tan(fov/2)`, where `vSpanM = (vMax − vMin)·W`. Set **`camera.up.set(0, 0, −1)` before `lookAt`**; a straight-down `lookAt` with the default up (0,1,0) is degenerate and rolls the view. Verified windows: 375×603 → u 0.242–0.864, v 0–1; 768×960 → u 0.128–0.928; 1440×836 → u 0–1, v 0.210–0.790; 1280×656 → v 0.244–0.756 [VERIFIED: computed this session with the UI-SPEC rule].
- **Key poses** (`lib/ascent/route.ts`, plain numbers, tuned at the visual checkpoint): world coordinates of the anchors at relief 1: Zermatt (1949, h, −2486), gorge (1727, h, −1716), Glacier Trail (−451, h, 214), Riffelsee (3582, h, 989), summit (−4451, ~4460, 1827). Camera positions run along a centripetal `CatmullRomCurve3`, and look-targets along a second curve. A piecewise-linear remap sends `p_k` to curve parameter `t_k`. Hold exactly at the ±0.03 plateaus. Each stage's target is `mix(waypoint_k, summit, ~0.35)`, so it "turns gently to face" without detouring [D-02].
- **Summit frame [D-03]:** seen from the summit, the four waypoints lie at bearings of about 55° (Zermatt) to 84° (Riffelsee), a ~30° horizontal spread, 7.7 km away (Zermatt) [VERIFIED: wgs84ToLv95 distance 7716 m]. Pull the camera ~300–600 m SW of and above the summit, aim at the waypoint centroid, and choose the vertical FOV from the aspect so the needed **horizontal** FOV fits: `vfov = 2·atan(tan(hfov/2)/aspect)`. Unit test: all 4 anchors project inside NDC ±0.9 at 375×603, 768×960 and 1440×836.
- **Mobile docked card [D-20]:** below 768 px, shift the projection with `camera.setViewOffset(w, h, 0, offsetY, w, h)` so targets sit in the upper ~55 % of the stage. Ramp the offset in from `p_1` (it must be 0 at p = 0 for poster parity).
- Vestibular comfort: limit yaw change to ≤ ~45° per leg, and snap (no fly-through) on jumps > 1 leg (UI-SPEC).

### Pattern 9: Reveal, context loss, disposal
- **Reveal:** on the first `useFrame` call (priority 0), schedule `requestAnimationFrame(reveal)`. By then the frame is drawn. `reveal` sets `data-ascent-mode="3d"` on the stage. CSS fades the canvas in (`opacity` over `--duration-settle`, `ease-geological`) and hides the poster pins in the same frame. **Never use a positive `useFrame` priority**: in R3F that takes over rendering, and the scene stops auto-rendering.
- **Context loss:** attach `webglcontextlost` inside the R3F tree (`useThree(s => s.gl).domElement`), with a `disposingRef` guard set in the cleanup. R3F's own unmount calls `gl.forceContextLoss()` [VERIFIED: events-9ce18a08.esm.js:17293, 17340], which fires the same event. Without the guard, React StrictMode (on: `reactStrictMode: true` in next.config.ts) or a reduced-motion toggle would mark the device static. three calls `event.preventDefault()` in its own handler [VERIFIED: three.module.js:17033-17040]; ignore restoration (no retry by design).
- **Disposal:** on unmount R3F runs `dispose(state.scene)` and then disposes the renderer [VERIFIED: events-9ce18a08.esm.js:17322-17341]. Textures referenced only in `ShaderMaterial` uniforms are not freed by `material.dispose()` [ASSUMED from three behaviour], so dispose geometry, material **and** texture explicitly in a `useEffect` cleanup. Do not dispose the poster `<img>`.

### Pattern 10: Demand-aware frame-budget sampler (replaces drei PerformanceMonitor)
Measure only **consecutive** frames (the previous frame requested another one), so idle gaps never count. The canvas reveal is a natural calibration burst: keep invalidating every frame for the 500 ms fade (≈ 30 frames at 60 Hz). Decision: ≥ 20 samples with median > 50 ms → decline; fewer than 20 frames in the first 1,000 ms of the burst → decline. A decline at dpr 1.5 retries once at dpr 1 (`setDpr(1)`); a second decline → static. Pure and unit-testable (Code Examples).

### Anti-Patterns to Avoid
- **`useScroll({ target })` for the ascent:** ViewTimeline inset and scroll-padding coupling (STATE 07-21). Use page `scrollY` + measured layout.
- **drei `PerformanceMonitor` under `frameloop="demand"`:** false declines (verified source).
- **`frameloop="always"` or invalidating every rAF:** battery drain; PITFALLS §WebGL.
- **Anchoring 3D pins at `elevation.m`:** pins sink up to 27 m into the 256² mesh (Pitfall 2).
- **Lighting the mesh with normals instead of the hillshade texture:** a visible look change at the crossfade (10 m vs 21.5/43 m detail, different light model).
- **Orthographic camera at p = 0, swapped to perspective later:** a visible jump. Use the flat `uRelief = 0` plane.
- **Any `three`/R3F/fast-png import reachable from an RSC** (ARCH §5), and any `'use client'` module imported for *values* into an RSC (Pattern 1).
- **Scroll snapping, smooth-scroll anchors, wheel/touch listeners, parallax** (UI-SPEC "Banned on Home").

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 16-bit PNG decoding (zlib inflate, filters, Adam7) | Custom inflate/unfilter | `fast-png` `decode` | Edge cases in filters and interlacing; 8.8 M weekly downloads |
| Damped scroll value with snap | Custom rAF easing loop | Motion `useSpring` + `.set`/`.jump` | Velocity-aware and tokenised; shares Motion's frame batch with the rail |
| Scroll position source | `addEventListener('scroll')` + `getBoundingClientRect` per frame | Motion `useScroll().scrollY` | Batched, passive, and already in the bundle |
| Bilinear height sampling for anchors | A second sampler | `sampleBilinear` from `lib/terrain/dem-sample.ts` | One sampler contract (Phase 8 D-17); identical pixel-centre rule |
| Coordinate conversions | Hand-written lat/lon math | `lib/geo.ts` (`lv95ToWgs84`, `wgs84ToLv95`, `lv95ToUv`) | The one coordinate contract (DATA-01) |
| Catmull-Rom interpolation of the route | Custom spline | `THREE.CatmullRomCurve3` (centripetal) in the lazy chunk | Standard, stable `getPointAt` |
| WebGL error isolation | Try/catch around `<Canvas>` | `components/SafeCanvas.tsx` | R3F ≥ 9.8 rethrows WebGL-creation errors (07-06) |
| PNG decoding in tests (pixel sampling) | A PNG parser in the spec | `fast-png` (now a runtime dep; Node 24 `require(esm)` works) [VERIFIED: spike] | No new devDependency |
| Colour token conversion OKLCH → sRGB | Hand-written OKLab math | colorjs.io in a generator script | Same library as `check-contrast.mjs`; `--check`able |

**Key insight:** the parts that look custom (frame budget, poster-frame math, progress mapping, key poses) are small pure functions that must be unit-tested. Everything numeric with edge cases (PNG, springs, splines, geodesy) comes from a library or a Phase 8 module.

## Common Pitfalls

### Pitfall 1: `e2e/no-webgl.spec.ts` "home keeps its content" will hang
**What goes wrong:** the test waits for a console error `Error creating WebGL context` (15 s timeout). The new gate probes `getContext('webgl2')`, gets `null` and never constructs a three renderer, so the error never logs.
**How to avoid:** rewrite (never delete) to assert static mode: `[data-ascent-mode="static"]` on the stage, poster visible, `canvas` count 0, every card and the plaque present, no error page. Keep the other three tests unchanged.

### Pitfall 2: DEM heights vs mesh heights
**What goes wrong:** pins anchored at `photos[].elevation.m` sit below the rendered surface, and the summit camera clearance is computed from 4,478 m while the mesh peak is lower.
**Evidence** (spike, bilinear on the decoded grids vs the data):

| Point | DEM (data) | 512² grid | 256² grid |
|------|-----------|-----------|-----------|
| img-0605 Zermatt | 1617 | 1616.4 | 1617.1 |
| img-0629 gorge | 1668 | **1682.9** | **1695.2** |
| img-0662 Glacier Trail | 2585 | 2583.3 | 2582.4 |
| r004-011 Riffelsee | 2760 | 2760.0 | 2760.8 |
| summit (demM) | 4473 | 4459.8 | 4470.1 |

**How to avoid:** the 3D anchor y is `sampleBilinear(grid, N, N, u·N, v·N) × uRelief` on the decoded grid. Labels, the rail and cards show the DEM numbers (true values, D-01). The camera clearance uses mesh heights.

### Pitfall 3: Visual "motion" shots become timing-dependent
**What goes wrong:** Playwright's Chromium has WebGL through SwiftShader [VERIFIED: spike: renderer `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) …))`]. The visual projects would therefore pass the gate and load the canvas at idle. Canvases are hidden, but the **3D pins are HTML** (not hidden by `hide-canvas.css`), and the poster/3D pin swap depends on idle timing. `settle()`'s scroll-through also counts as "first scroll".
**How to avoid:** in the Home motion shots, force **static-capability** with the shared `disableWebGL` init script (moved from `no-webgl.spec.ts` to `e2e/helpers/webgl.ts`). This tests the poster + poster pins + live rail, deterministically. Seek fixed positions by scrolling the target block into the centre (`el.scrollIntoView({ block: 'center' })`), not by `innerHeight × %`. A jump > 1 leg snaps the spring, so two rAFs suffice. Also make `settle()` wait for the `contours-hero` SVG resource (as it already does for the strip).

### Pitfall 4: drei PerformanceMonitor declines on good devices
See the Standard Stack "Not used on Home" row. Verified at `PerformanceMonitor.js:38-47`. Use Pattern 10.

### Pitfall 5: Context-loss listener reacting to R3F's own teardown
R3F's unmount runs `forceContextLoss()`. In dev StrictMode (enabled) the canvas mounts, unmounts and remounts. A naive listener marks the device static forever. Use the `disposingRef` guard and attach the listener inside the R3F tree.

### Pitfall 6: Palette ratchet fails when counts go *down*
`check-palette.mjs` reports `… below the ratchet of N; ratchet can tighten: run npm run guard:palette -- --update` as a **violation** [VERIFIED: scripts/guards/check-palette.mjs:197-203]. Current entries: `"app/(site)/page.tsx": 5` and `"components/MountainTerrain3D.tsx": 1` [VERIFIED: scripts/guards/palette-ratchet.json]. The Home rewrite and the dead-code deletion must run `npm run guard:palette -- --update` in the same commit. Also remove `components/DualParticleSystem.tsx`, `components/MountainTerrain3D.tsx` and `components/GeologicalButton.tsx` from `LEGACY_COMPILER_FILES` in `eslint.config.mjs:9-18`.

### Pitfall 7: The skip-link count, nav exact names and old stat assertions
- `e2e/shell.spec.ts` counts `/skip to/i` links = 1; "Skip to the summit" breaks it on `/` (UI-SPEC already flags this; rewrite to the exact global name).
- `e2e/homepage.spec.ts` "should display stats section" asserts `Landscape Photos`, `Active Projects` and `Roadmap Complete`, which the rebuild deletes. Rewrite it to assert the summit plaque.
- Trail signs have accessible names "Photographs, 4 waypoints", so the nav tests scoped to `getByRole('navigation', { name: 'Primary' })` with `exact: true` are unaffected.

### Pitfall 8: HOME-08 script-bytes measurement depends on idle timing
**What goes wrong:** `e2e/perf/home-baseline.spec.ts` sums `resource` entries with `initiatorType === 'script'` at `load + 3000 ms` [VERIFIED: spec lines 33, 70-90]. If the canvas chunk (estimated ~240–260 KB gz: three core+module min ≈ 183 KB gz, R3F ≈ 50–60 KB gz minified [ASSUMED from unminified 156 KB gz], fast-png+fflate+iobuffer ≈ 10–15 KB gz minified) finishes inside that window in some runs but not others, the median is unstable. Also, in the container the perf context **is** 3D-eligible: Pixel 7 emulation does not change `deviceMemory`, and SwiftShader gives WebGL2. So it is a 256² 3D run.
**How to avoid:** extend the spec (rewrite, not delete) so each sample also records `mode` (from `data-ascent-mode`), `initialJsTransferBytes` (scripts that start before `load`) and `totalJsTransferBytes` measured **after** the canvas reports ready (or after a fixed 10 s if static). Compare the conservative `totalJsTransferBytes` and LCP against `e2e/perf/home-baseline.json` (`"lcpMs": 4692`, `"jsTransferBytes": 468770` [VERIFIED: file]). The baseline loaded three eagerly, so "total including the canvas chunk" is the apples-to-apples worst case.

### Pitfall 9: LCP candidate subtleties
The poster `<img>` at `opacity: .32` is still an LCP candidate (only `opacity: 0` is excluded). The hillshade AVIF is ~0.75 bits/pixel at 640², well above Chromium's low-entropy cut-off (0.05 bpp) [ASSUMED threshold]. Canvas elements are never LCP candidates, so the reveal cannot move LCP. On a portrait phone the sheet box is about `100svh − 64px` square, so `sizes="100vw"` under-describes it; at phone DPRs the 1100 candidate is chosen either way (only two candidates), so keep the UI-SPEC's `sizes="100vw"`.

### Pitfall 10: Jest cannot load fast-png
fast-png 8 and iobuffer are ESM-only (`"type": "module"`, `exports` without a `require` condition) [VERIFIED: package.json read in spike], and next/jest does not transform `node_modules` [ASSUMED standard next/jest config]. Keep `fast-png` imports in the lazy chunk module only. Unit-test the pure parts (`lib/terrain/heightmap.ts`) with synthetic `Uint16Array`s. `three` itself loads in Jest through `three.cjs` (its `require` export).

### Pitfall 11: Service-worker precache claim in the UI-SPEC is not true today
`data/generated/precache.json` is `["/terrain/contours-strip.e1af353f82.svg"]` only [VERIFIED: file], and it is written by `build-terrain.mjs` (`precacheText = JSON.stringify([meta.assets.contours.strip])`, line 464). The SW already serves every `/terrain/` URL **cache-first at runtime** [VERIFIED: public/service-worker.js:129-140]. Precaching 512² heightmaps (352 KB) and hillshades would charge every visitor at SW install, including Save-Data users. **Recommendation:** leave `precache.json` unchanged and correct that UI-SPEC guardrail row at plan review.

### Pitfall 12: `svh` and the sticky stage
`100svh` stays fixed while the mobile URL bar collapses, so R3F does not resize-thrash (good). The trade-off is a strip of track background below the stage when the bar hides. That is accepted and needs no fix. Do not switch to `dvh` (resize on every toolbar move).

### Pitfall 13: Overflow at 375 px
STATE carries two Home overflow items (07-22 unsettled `x: 50` card, 08 deferred legacy card). The rebuild deletes both causes. Keep pin labels inside the stage (`overflow-hidden` on the stage, the 240 px flip rule) and assert `scrollWidth <= clientWidth` in every mode (UI-SPEC).

## Code Examples

### Capability decision (pure)
```ts
// lib/ascent/capability.ts — import-free, unit-tested
export type AscentSignals = {
  reducedMotion: boolean;
  saveData: boolean | undefined;
  deviceMemory: number | undefined;   // Chromium only; undefined elsewhere
  webgl2: boolean;                    // getContext('webgl2', { failIfMajorPerformanceCaveat: true }) !== null
  maxTextureSize: number;             // 0 when no WebGL2
};
export type AscentMode = 'static-reduced' | 'static' | 'eligible';

export function decideAscentMode(s: AscentSignals): AscentMode {
  if (s.reducedMotion) return 'static-reduced';
  if (s.saveData === true) return 'static';
  if (s.deviceMemory !== undefined && s.deviceMemory < 4) return 'static';
  if (!s.webgl2 || s.maxTextureSize < 2048) return 'static';
  return 'eligible';
}
```

### Render-gated lazy canvas (D-19)
```tsx
'use client';
// components/home/TerrainStage.tsx
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const TerrainCanvas = dynamic(() => import('./terrain/TerrainCanvas'), { ssr: false }); // chunk fetched on first render only

export function TerrainStage({ eligible }: { eligible: boolean }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!eligible) return;
    const arm = () => setArmed(true);
    const idle = 'requestIdleCallback' in window
      ? window.requestIdleCallback(arm, { timeout: 4000 })
      : window.setTimeout(arm, 2000);
    window.addEventListener('scroll', arm, { once: true, passive: true });
    return () => {
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle as number); else clearTimeout(idle as number);
      window.removeEventListener('scroll', arm);
    };
  }, [eligible]);
  return eligible && armed ? <TerrainCanvas /> : null;
}
```

### One spring, manual set/jump (D-06 snap rule)
```tsx
'use client';
import { useScroll, useSpring, useMotionValueEvent } from 'motion/react';
import { DURATION } from '@/lib/animations';
import { mapProgress, shouldSnap } from '@/lib/ascent/progress';

export function useAscentProgress(layoutRef: React.RefObject<AscentLayout>, n: number) {
  const { scrollY } = useScroll();                                  // page scroll, no target (STATE 07-21)
  const spring = useSpring(0, { visualDuration: DURATION.panel, bounce: 0 });
  useMotionValueEvent(scrollY, 'change', (y) => {
    const p = mapProgress(y, layoutRef.current);                     // pure, measured layout
    if (shouldSnap(spring.get(), p, n)) spring.jump(p);             // |Δp| > 1/(n+1): no fly-through
    else spring.set(p);
  });
  return spring;
}
```

### Heightmap → registered mesh (lazy chunk)
```ts
import * as THREE from 'three';
import { decode } from 'fast-png';
import { terrain } from '@/data/generated/terrain';

export async function buildTerrainGeometry(size: 256 | 512) {
  const res = await fetch(terrain.assets.heightmap[size]);           // same-origin, connect-src 'self'
  const png = decode(new Uint8Array(await res.arrayBuffer()));
  if (png.width !== size || png.height !== size || png.depth !== 16 || png.channels !== 1) {
    throw new Error('heightmap: unexpected format');                 // caught → static mode
  }
  await new Promise((r) => setTimeout(r, 0));                         // yield (INP)
  const N = size, W = terrain.extent.widthM, s = terrain.dem.heightScale;
  const metres = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) metres[i] = png.data[i] * s;
  const geo = new THREE.PlaneGeometry((W * (N - 1)) / N, (W * (N - 1)) / N, N - 1, N - 1);
  geo.rotateX(-Math.PI / 2);                                          // row 0 (north) → −z
  geo.deleteAttribute('normal');
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let iy = 0, k = 0; iy < N; iy++) for (let ix = 0; ix < N; ix++, k++) {
    pos.setY(k, metres[k]);                                           // scaled by uRelief in the shader
    uv.setXY(k, (ix + 0.5) / N, 1 - (iy + 0.5) / N);                  // pixel-centre registration
  }
  geo.computeBoundingSphere();
  return { geo, metres, N };                                          // metres → pin anchors via sampleBilinear
}
```

### Shader (CSS parity + fwidth contours)
```glsl
// vertex
uniform float uRelief; varying float vH; varying vec2 vUv;
void main() { vH = position.y; vUv = uv; vec3 p = position; p.y *= uRelief;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }

// fragment — raw ShaderMaterial, toneMapped: false, no colorspace chunk
precision highp float;
uniform sampler2D uHill; uniform vec3 uSurface, uLine;
uniform float uReliefOpacity, uInterval, uIndexEvery, uWidthPx, uIndexAlpha, uMinorAlpha;
varying float vH; varying vec2 vUv;
float lineCov(float f) {
  float w = fwidth(f);
  float d = abs(fract(f - 0.5) - 0.5) / max(w, 1e-6);
  float cov = clamp(uWidthPx * 0.5 + 0.5 - d, 0.0, 1.0);
  return cov * (1.0 - smoothstep(0.25, 0.6, w));                       // fade where lines would merge
}
void main() {
  vec3 c = mix(uSurface, vec3(texture2D(uHill, vUv).r), uReliefOpacity); // == CSS opacity composite
  float minor = lineCov(vH / uInterval) * uMinorAlpha;
  float index = lineCov(vH / (uInterval * uIndexEvery)) * uIndexAlpha;
  gl_FragColor = vec4(mix(c, uLine, max(minor, index)), 1.0);
}
```
Uniform values: `uReliefOpacity` 0.32, `uIndexAlpha` 0.14, `uMinorAlpha` 0.084, `uWidthPx` = `gl.getPixelRatio()`, `uSurface`/`uLine` from `data/generated/tokens.ts` (night-950 = 8,16,26; firn-50 = 238,235,229 per colorjs.io this session).

### Demand-aware frame budget (pure)
```ts
// lib/ascent/frame-budget.ts
export function createFrameBudget(opts = { minSamples: 20, maxMedianMs: 50, burstWindowMs: 1000 }) {
  const deltas: number[] = []; let last = -1; let start = -1; let frames = 0;
  return {
    /** Call once per rendered frame. `continuous` = the previous frame requested this one. */
    sample(now: number, continuous: boolean): 'pending' | 'ok' | 'decline' {
      if (start < 0) start = now;
      frames++;
      if (continuous && last >= 0) deltas.push(now - last);
      last = now;
      if (now - start >= opts.burstWindowMs && frames < opts.minSamples) return 'decline';
      if (deltas.length < opts.minSamples) return 'pending';
      const sorted = [...deltas].sort((a, b) => a - b);
      return sorted[sorted.length >> 1] > opts.maxMedianMs ? 'decline' : 'ok';
    },
  };
}
```

### SwiftShader smoke check by pixel sampling (D-22)
```ts
// e2e/home-canvas.spec.ts — title tagged @chromium-only
import { decode } from 'fast-png';
// Ground pixels: c = 0.68·surface + 0.32·grey → (b − r) = 0.68·(26 − 8) ≈ 12 for ANY grey.
// Contour pixels mix toward firn (b − r = −9) → (b − r) ≤ 10. Spike: ground at b−r ∈ {12,13};
// 0.9–1.1 % of terrain pixels at ≤ 10 in plan and oblique views.
function stats(png: Buffer) {
  const { data, channels } = decode(png);
  let n = 0, contour = 0, sum = 0, sum2 = 0;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    n++; const l = (r + g + b) / 3; sum += l; sum2 += l * l;
    if (b - r <= 10) contour++;
  }
  const mean = sum / n;
  return { contourFrac: contour / n, lumStd: Math.sqrt(sum2 / n - mean * mean) };
}
// Per position: expect(lumStd).toBeGreaterThan(4) (not blank) · expect(contourFrac).toBeGreaterThan(0.003)
// Between positions: mean |Δ| of 32×32-downsampled frames > 6 levels, and the rail readout text increases.
```
Capture with `page.locator('canvas').screenshot()` (the composited output, independent of `preserveDrawingBuffer`) after `[data-ascent-mode="3d"]` and the canvas computed `opacity === '1'`. Run at a phone-size viewport (e.g. 412×839, DPR 1 → 256² mesh) so a slow CI SwiftShader stays under the frame budget.

### Counting draws to prove "on demand" and "pauses off-screen" (HOME-07)
```ts
await page.addInitScript(() => {
  const proto = WebGL2RenderingContext.prototype as any;
  const orig = proto.drawElements;
  (window as any).__draws = 0;
  proto.drawElements = function (...a: unknown[]) { (window as any).__draws++; return orig.apply(this, a); };
});
// after the reveal: read __draws, wait 1000 ms idle → unchanged; scroll the stage off-screen, wait → unchanged
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next/image` `priority` | `preload`, or (preferred) `loading="eager"` / `fetchPriority="high"` | Next 16.0 | Poster uses `fetchPriority="high"` [CITED: Next docs] |
| Chrome silently falls back to SwiftShader for WebGL | WebGL creation fails without `--enable-unsafe-swiftshader` | Deprecated from M130, failing by M139 [CITED: blink-dev intent; Samsung policy doc] | Real users without a GPU get `webgl2 === false` → static. Playwright adds the flag, so tests keep WebGL [VERIFIED: playwright-core coreBundle.js:44755] |
| Firefox without CSS scroll-driven animations | `animation-timeline` added in **Firefox 159** (MDN BCD) | Stable is 158.0.1, 159 in beta (2026-10-24) [CITED: raw BCD animation-timeline.json; product-details.mozilla.org] | Keep the `@supports` guard. The card fade starts working in Firefox 159 automatically. Playwright 1.64's Firefox 157 has none |
| `navigator.deviceMemory` capped at 8 | Chromium 156 headless reports 32 on this machine | — | Only the `< 4` comparison matters [VERIFIED: spike] |
| drei `useDetectGPU` (unpkg fetch) | Platform signals + runtime frame budget | — | CSP-safe, same-origin |

**Deprecated/outdated in the existing research:**
- ARCH §5 `dpr={[1,2]}` and rail "1,626 m": superseded by `dpr={[1, 1.5]}` (ROADMAP) and 1,617 m (`lowestDemM`).
- ARCH §5 "`TerrainFallback` with next/image priority": use `<picture>` + `fetchPriority`.
- STACK §7's shader snippet (`mix(uGround, uLine, …)` with Lambert): superseded by the CSS-parity texture formula (spike 3).

## UI-SPEC corrections to resolve at plan review (flag to Tim; do not silently change)

| # | UI-SPEC text | Finding | Recommendation |
|---|--------------|---------|----------------|
| C1 | "ground = mix(night-950, firn-50, shade × 0.32) in sRGB" | The CSS poster composite is `mix(surface, image, 0.32)` (black → 0.68·surface, white → pure white contribution). The UI-SPEC formula differs at both ends, so the crossfade would shift in tone | Use `mix(surface, texel, 0.32)`; verified to 0.65 levels mean |
| C2 | Service-worker row: "heightmap PNGs and hillshade files … are in precache.json" | False today; the runtime cache-first rule already covers them | Leave precache.json unchanged; reword the row |
| C3 | "drei `<Html>` is acceptable … or a ref-based projection" | drei is unnecessary for Home | Ref-based projection (Pattern 8/9); no drei in the chunk |
| C4 | D-18 "a PerformanceMonitor fallback" | drei's monitor misfires under demand frameloop | Demand-aware frame budget (Pattern 10) satisfies the intent |
| C5 | Pins anchored at "DEM height" | Pins sink into the mesh by up to 27 m | DEM numbers on labels, mesh height for the 3D anchor |

Disposition: C1–C5 are rows of the Pre-execution gate in `09-01-PLAN.md`, together with the planner's C6–C8 and the UI-SPEC Defaults 1–15. Execution does not start until Tim's answer is recorded on every row.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | WebGL2 guarantees `MAX_TEXTURE_SIZE ≥ 2048`, and GLSL ES 3.00 requires highp in fragment shaders | Pattern 2, 7 | Low: the gate checks both at runtime anyway |
| A2 | R3F minified ≈ 50–60 KB gz, so the lazy chunk ≈ 240–260 KB gz | Pitfall 8 | Medium: HOME-08 total could exceed 468,770 B; mitigation is the initial/total split and dropping anything non-essential from the chunk |
| A3 | A GitHub `ubuntu-latest` runner's SwiftShader renders 256² at phone size under 50 ms/frame (local 32-core: 8.5 ms; the 4-core affinity test was inconclusive) | Pattern 10, smoke test | Medium: if slower, the smoke test sees static mode. Fallback options in Open Question 1 |
| A4 | `material.dispose()` does not free textures held in uniforms | Pattern 9 | Low: explicit disposal is harmless either way |
| A5 | next/jest does not transform ESM-only node_modules (fast-png) | Pitfall 10 | Low: keeping fast-png out of Jest avoids it regardless |
| A6 | Chromium's LCP low-entropy cut-off is ~0.05 bpp | Pitfall 9 | Low: the AVIF is 15× above it |
| A7 | `navigator.connection.saveData` is Chromium-only | Pattern 2 | Low: undefined → pass |
| A8 | Firefox honours `failIfMajorPerformanceCaveat` for software WebGL | Pattern 2 | Low: the frame budget catches slow devices anyway |

## Open Questions (RESOLVED)

Each question below has a disposition in the plans (revision of 2026-10-25, plan numbers 09-01 … 09-14). "Resolved" means routed to a named decision point or closed, not pre-answered for Tim.

1. **Does CI SwiftShader stay inside the frame budget for the smoke test?**
   - Known: locally 8.5 ms/frame (256², 375×603 @1.5) and 29–39 ms (512², 1440×836).
   - Unclear: `ubuntu-latest` 4-vCPU timing.
   - Recommendation: run the smoke at 412×839 DPR 1, and have it attach the measured median frame interval as a test annotation on the first `ci/09-NN` run. If it declines, choose between (a) relaxing the threshold to 66 ms (15 fps), (b) skipping the frame-budget probe when `navigator.webdriver` is true (only removes a downgrade for automation; perf and smoke then always exercise 3D), or (c) the Playwright clock. Present (a)/(b) to Tim as a table.
   - **RESOLVED:** decided by Tim at the blocking checkpoint 09-13 Task 3 from the CI numbers (options total-keep, total-relax = (a), total-webdriver = (b); (c) is not offered), and applied in 09-14 Task 1. The smoke runs at 412×839 DPR 1 (09-08, 09-10), and 09-11 Task 3 prints the verdict line and attaches it as an annotation; 09-13 Task 2 routes a CI decline to that decision instead of treating it as a defect.
2. **The HOME-08 metric definition.** Keep the old field (`jsTransferBytes` at load+3 s) for continuity and add `totalJsTransferBytes` (after canvas ready) as the gate? Recommendation: gate on the stricter total and record both; Tim confirms at the perf checkpoint.
   - **RESOLVED:** 09-09 records both (the legacy field plus `initialJsTransferBytes` and `totalJsTransferBytes`) and takes the first local byte measurement of the lazy chunk (early signal, with a trim lever); 09-12 Task 3 repeats it on the final chunk; Tim chooses the gate at the blocking checkpoint 09-13 Task 3, and 09-14 Task 1 records the verdict. A failing gate is reported as HOME-08 not met, never relabelled.
3. **Relief vertical exaggeration** (1.0 vs ~1.15) and the summit pull-back distance: visual checkpoint items with Tim (ui-ux-pro-max), not research blockers.
   - **RESOLVED:** decided by Tim at the blocking checkpoint 09-12 Task 2 from prepared renders (with the relief opacity), applied in 09-12 Task 3; only the constants in `lib/ascent/route.ts` and `--relief-opacity` change.
4. **Phase 8 review warnings WR-01…WR-08:** Phase 9 only reads photo data, so per CONTEXT they pass to Phase 10 unless a plan touches the photo pipeline (none should).
   - **RESOLVED:** passed to Phase 10. No Phase 9 plan touches `scripts/photos/` (recorded in the flagged assumptions of 09-01 and 09-03; 09-03 edits only the legacy bridge `data/landscapes.ts` to copy the slug).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build, scripts, Playwright | ✓ | v24.21.0 (`.node-version` 24) | — |
| npm registry access | `npm install fast-png@8.0.0` | ✓ | — | — |
| Playwright Chromium | e2e, smoke, local visual dry-runs | ✓ | chromium-1248 (156.0.8078.4) installed | — |
| Playwright Firefox | local `--project=firefox` runs | ✗ (firefox-1555 not installed locally; CI installs it) | — | `npx playwright install firefox` locally, or rely on CI |
| WebGL2 in headless Chromium | smoke test, context-loss test | ✓ (SwiftShader by default) | ANGLE Vulkan SwiftShader | — |
| Docker | local container baselines | Installed (29.9.2), **daemon not running** | — | Baselines come only from CI anyway (`gh workflow run visual-baselines.yml`) |
| gh CLI | baseline/perf dispatch, artifact download | ✓ | 2.102.0 | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** local Firefox (install or use CI); Docker daemon (CI container).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.4 (next/jest, jsdom) + Playwright 1.64 (`chromium`, `firefox`, `visual-dark`, `visual-light`, `perf`) |
| Config files | `jest.config.js`, `playwright.config.ts` (SCREENSHOT `{ animations: 'disabled', caret: 'hide', threshold: 0.01 }` [VERIFIED: playwright.config.ts]) |
| Quick run command | `npx jest --testPathPatterns="ascent|home-format|heightmap|frame-budget|components/home"` |
| Full suite command | `npm run lint && npm run type-check && npm test && npx playwright test --project=chromium --project=firefox` (set `PW_PROD=1` for production-server parity) |
| Visual (CI only) | `gh workflow run visual-baselines.yml --ref ci/09-NN -f suite=visual -f update_mode=changed` (Tim commits PNGs) |
| Perf (CI only) | `gh workflow run visual-baselines.yml --ref ci/09-NN -f suite=perf` → artifact `home-baseline` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-01 | h1 "Tim Lui", role, both trail signs within the first viewport with JS disabled (375, 1440), reduced motion and no WebGL | e2e (`test.use({ javaScriptEnabled: false })`) | `npx playwright test e2e/homepage.spec.ts --project=chromium` | ✅ rewrite (stats test → plaque) |
| HOME-01 | Composed contrast of hero text ≥ 4.5:1 on sampled pixels; axe no violations on `/` | e2e backstop | `npx playwright test e2e/home-ascent.spec.ts -g contrast` | ❌ Wave 0 |
| HOME-02 | 3D: canvas not blank, contours present (b−r signature), camera progresses across 3 positions | e2e smoke `@chromium-only` | `npx playwright test e2e/home-canvas.spec.ts --project=chromium` | ❌ Wave 0 |
| HOME-02 | Static under no WebGL2 / Save-Data / deviceMemory 2 / reduced motion: poster visible, no canvas, `data-ascent-mode` static, all sections present | e2e (init-script spoofs) | `npx playwright test e2e/no-webgl.spec.ts e2e/home-ascent.spec.ts -g static` | ✅ rewrite no-webgl home test; ❌ new spoof tests |
| HOME-02 | Forced `WEBGL_lose_context.loseContext()` → canvas removed, poster pins back, no error UI | e2e `@chromium-only` | `npx playwright test e2e/home-canvas.spec.ts -g "context loss"` | ❌ Wave 0 |
| HOME-02 | `decideAscentMode` truth table | unit | `npx jest --testPathPatterns=ascent-capability` | ❌ Wave 0 |
| HOME-03 | `mapProgress`, plateaus, `shouldSnap`; native scroll only (wheel moves `scrollY`, no `scroll-snap-type`, no non-passive wheel/touch listeners) | unit + e2e | `npx jest --testPathPatterns=ascent-progress`; `npx playwright test e2e/home-ascent.spec.ts -g "native scroll"` | ❌ Wave 0 |
| HOME-03 | "Skip to the summit" moves focus to `#summit`; "Start the ascent" resolves to the first waypoint; shell skip-link count rewritten to the exact name | e2e | `npx playwright test e2e/home-ascent.spec.ts e2e/shell.spec.ts` | ✅ rewrite shell; ❌ new |
| HOME-04 | Rail hidden at 375, visible at 1440, inside `aria-hidden`; readout `1,617 m` at p = 0 and `4,478 m` at summit; ticks evenly spaced | unit + e2e | `npx jest --testPathPatterns=ascent-progress`; `npx playwright test -g rail` | ❌ Wave 0 |
| HOME-05 | 4 `<section>`s ordered by `elevation.m`, h2 each, "View photo" → `/photos#{slug}`, `/photos` has matching ids; Riffelsee "approx."; pins at UV; all 4 anchors inside the summit frame | unit + component + e2e | `npx jest --testPathPatterns="ascent-route|components/home"`; `npx playwright test -g waypoint` | ❌ Wave 0 |
| HOME-05 | Focus contract: Tab to a card link centres its block | e2e | `npx playwright test -g focus` | ❌ Wave 0 |
| HOME-06 | Trail-sign accessible names and counts (hero + summit), plaque values (2,861 m · 2,760 m · 2019–2021 · 7.7 km), formatters | unit + e2e | `npx jest --testPathPatterns="home-format|summit"`; `npx playwright test -g plaque` | ❌ Wave 0 |
| HOME-07 | Reduced motion: no canvas, no rail marker, cards stacked, `getAnimations()` empty on Home | e2e | `npx playwright test -g "reduced motion"` | ❌ Wave 0 |
| HOME-07 | On demand: draw count unchanged after 1 s idle and while the stage is off-screen | e2e `@chromium-only` (drawElements counter) | `npx playwright test e2e/home-canvas.spec.ts -g demand` | ❌ Wave 0 |
| HOME-07 | Frame budget decisions | unit | `npx jest --testPathPatterns=frame-budget` | ❌ Wave 0 |
| HOME-08 | LCP ≤ 4,692 ms and script bytes ≤ 468,770 B (median of 5, Pixel 7, 4× CPU, container) | perf (on demand) + Tim review | `gh workflow run … -f suite=perf` | ✅ extend `e2e/perf/home-baseline.spec.ts` |
| cross | CLS < 0.1 through the reveal; `scrollWidth <= clientWidth` at 375 in every mode | e2e backstop | `npx playwright test -g "layout shift|overflow"` | ❌ Wave 0 |
| cross | Visual: home reduced ×3 widths (full page) + static-capability at p = 0, p_2, p = 1 ×3 widths | visual (CI container) | dispatch `suite=visual` | ✅ rewrite `e2e/visual/routes.spec.ts` home block (keep test count ≥) |

**Manual-only (justified):** real-device 3D quality and vestibular comfort (iPhone + mid-range Android; GPU paths cannot be emulated); Tim's About/contact copy approval (D-14); relief-opacity/route tuning at a visual checkpoint (aesthetic); Tim committing visual PNGs and approving the perf numbers (process rule).

### Sampling Rate
- **Per task commit:** the quick Jest run + `npm run lint` (eslint + palette/contrast/identity guards + `data:check`) + `npm run type-check`
- **Per wave merge:** full local suite with `PW_PROD=1`, then push `ci/09-NN` (Tim's go-ahead needed) for the E2E + Visual jobs
- **Phase gate:** CI green (Lint, Unit incl. test-count ratchet, E2E chromium+firefox, Visual), visual re-baseline committed by Tim, perf dispatch within baseline, then `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `lib/__tests__/home-format.test.ts`: formatLatLon (`45.9764 N · 7.6586 E` from `lv95ToWgs84(terrain.summit.lv95)`; verified lat 45.976410, lon 7.658605 this session), formatCaptureMonth, formatKilometres (7716 m → `7.7 km`), formatYearRange, countLabel
- [ ] `lib/__tests__/ascent-progress.test.ts`, `poster-frame.test.ts`, `ascent-capability.test.ts`, `ascent-route.test.ts` (uses `three` via cjs for projection), `heightmap.test.ts`, `frame-budget.test.ts`
- [ ] `components/home/__tests__/*.test.tsx`: card order/ids/links, trail signs, plaque, hero (RTL on the RSC function components)
- [ ] `e2e/helpers/webgl.ts`: `disableWebGL`, `spoofDeviceMemory`, `spoofSaveData`, draw counter
- [ ] `e2e/home-ascent.spec.ts` (functional, both browsers) and `e2e/home-canvas.spec.ts` (`@chromium-only` smoke, context loss, demand)
- [ ] `scripts/tokens/build-tokens.mjs` + `data/generated/tokens.ts` + add `--check` to `data:check`
- [ ] Local: `npx playwright install firefox` (optional)
- [ ] At phase close: `node scripts/guards/test-count.mjs --update` (raise only)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (asset decode) | Validate the decoded PNG shape (size, depth 16, 1 channel) before building geometry; a fixed URL set from generated data; no user input reaches the canvas |
| V6 Cryptography | no | — |
| V10 Malicious code / supply chain | yes | `fast-png@8.0.0` exact pin, legitimacy OK, no postinstall; `npm ci` parity guard |
| V14 Configuration | yes | CSP unchanged: no new `connect-src`, no `worker-src`, no blob workers, same-origin assets; `/terrain/*` immutable caching already configured |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Corrupted or tampered heightmap (cache poisoning, bad deploy) | Tampering / DoS | Content-hashed URL; shape validation; any throw → static mode (SafeCanvas + try/catch) |
| GPU exhaustion / tab crash on weak devices | DoS | Capability gate, fixed mesh sizes (≤ 512²), DPR cap 1.5, frame budget, context-loss → static |
| Third-party fetch at runtime (e.g. drei `useDetectGPU` → unpkg) | Information disclosure / CSP violation | Not used; ESLint could ban `useDetectGPU` imports (optional) |
| XSS through content | Tampering | All copy is typed data rendered as text; no `dangerouslySetInnerHTML` |
| Fingerprinting via capability probes | Information disclosure | Probes stay client-side and are never sent anywhere; no analytics on the mode |

## Sources

### Primary (HIGH confidence)
- Codebase, read this session: `data/generated/terrain.ts`, `data/generated/photos.ts`, `data/generated/image-manifest.ts`, `data/generated/precache.json`, `lib/geo.ts`, `lib/terrain/dem-sample.ts`, `components/SafeCanvas.tsx`, `components/terrain/ContourField.tsx`, `lib/useReducedMotion.ts`, `lib/animations.ts`, `app/globals.css:1-90`, `proxy.ts`, `public/service-worker.js`, `next.config.ts`, `eslint.config.mjs`, `playwright.config.ts`, `e2e/perf/home-baseline.spec.ts` + `.json`, `e2e/visual/routes.spec.ts`, `e2e/visual/hide-canvas.css`, `e2e/no-webgl.spec.ts`, `e2e/homepage.spec.ts`, `.github/workflows/ci.yml`, `visual-baselines.yml`, `scripts/guards/*` (test-count, palette ratchet, install parity)
- `node_modules` sources: Next `shared/lib/lazy-dynamic/loadable.js`; Next docs `image.md`, `lazy-loading.md`; R3F `react-three-fiber.esm.js:20-60`, `events-9ce18a08.esm.js` (unmount, forceContextLoss, wheel passive); drei `core/PerformanceMonitor.js`; three `three.module.js:17033-17045`; motion/motion-dom type declarations; playwright-core `coreBundle.js` (Chromium args, `--enable-unsafe-swiftshader`) and `browsers.json`
- Executed spikes (scratchpad, not committed): fast-png decode of both heightmaps + DEM comparison; SwiftShader render of the 512²/256² mesh with the hillshade texture and fwidth contours (frame timing, determinism hash `6d9bea53` identical across launches, capability probes); DOM-vs-GL parity (mean 0.648, max 7); gate signals at localhost (deviceMemory 32, saveData false); contour b−r signature
- npm registry + `gsd-tools package-legitimacy check` (fast-png, fflate, iobuffer)
- MDN browser-compat-data `css/properties/animation-timeline.json` (Firefox 159); product-details.mozilla.org (Firefox 158.0.1 stable, 159.0b5)

### Secondary (MEDIUM confidence)
- [MDN: Navigator.deviceMemory](https://developer.mozilla.org/docs/Web/API/Navigator/deviceMemory): secure context, Chromium-only, coarse values
- [blink-dev: Intent to Remove: SwiftShader Fallback](https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM/m/oLrB5up_BwAJ); [Samsung EnableUnsafeSwiftShader policy](https://developer.samsung.com/browser/policy/enable-unsafe-swift-shader.html); [Chromium SwiftShader doc](https://chromium.googlesource.com/chromium/src/+/da170c2267b2201954efe1c8fa5d2d89ab09f7bf/docs/gpu/swiftshader.md)
- [Chrome: scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) (browser status conflicting; BCD used instead)
- Milestone research: `.planning/research/ARCHITECTURE.md` §5, `STACK.md` §7/§10, `PITFALLS.md`

### Tertiary (LOW confidence)
- [three.js forum: SwiftShader is going away](https://discourse.threejs.org/t/swiftshader-is-going-away-what-to-do/76140) (timeline context only)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Versions read from node_modules; fast-png verified on the registry and by decoding the real assets.
- Architecture: HIGH. Each framework claim was checked in installed source (Next dynamic, R3F measure/unmount/events, drei monitor, Motion spring API), and the parity and determinism spikes were run.
- Pitfalls: HIGH for the repo-specific ones (tests, guards, SW, perf spec); MEDIUM for CI timing and real-phone thresholds.

**Research date:** 2026-10-24
**Valid until:** 2026-11-23 (30 days; re-check Firefox 159 shipping and any Playwright/Chromium bump before re-baselining)
