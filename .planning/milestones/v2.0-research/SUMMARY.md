# Project Research Summary

**Project:** Portfolio App — milestone v2.0 Topographic Identity
**Domain:** Photographer-engineer portfolio rebuilt as a data-driven, scroll-told topographic survey (Next.js 16 App Router + R3F + Tailwind v4)
**Researched:** 2026-10-10
**Confidence:** MEDIUM-HIGH

> Synthesized from STACK.md, FEATURES.md, ARCHITECTURE.md and PITFALLS.md. The synthesizer subagent's file write was blocked by the harness (subagents must return reports as text), so the orchestrator persisted this summary from the synthesizer's returned content (GSD self-heal #222).

## Executive Summary

v2.0 rebuilds the whole UI so that Tim Lui's photography and engineering read as two views of one surveyed terrain: the Matterhorn around Zermatt. Research supports a **data-first** approach: two offline, committed pipelines (swisstopo DEM → heightmap + contour SVG; photo EXIF → typed data) feed every surface — the WebGL ascent hero, the photo Map view, the lightbox EXIF strip, the footer legend, the 404/offline art and per-page OG images. Motion relies on platform APIs (View Transitions, native scroll driven by Motion `useScroll`); no scroll-jacking, no GSAP. The site becomes dark-only on a single token system enforced in CI.

Phase 7 builds the regression nets (production-build Linux screenshot baselines in dark *and* light color schemes, test-count ratchet, palette guard) and takes the risky dependency bumps in isolated commits: motion 14 → Next 16.4 + React 19.3 + R3F 9.8.1 → Playwright 1.64. Phase 8 (data & terrain) blocks everything after it; Photography (10) and Engineering (11) are then independent; Contact, edge pages, cleanup and verification come last (12).

The main risk is **regression**, specifically: a stale local `node_modules` (installed next 16.1.6 / framer-motion 12.35.1 vs lockfile 16.2.6 / 12.39.0), baselines captured in the wrong state (Playwright defaults to light scheme, which renders the broken `dark:` fallbacks), stripping `dark:` the wrong way (the un-prefixed class is the *light* value), tests deleted instead of rewritten, and the Motion bump touching three `useScroll` consumers that have no tests. Every one of these has a concrete guard in the roadmap implications below.

### Correction to PROJECT.md

PROJECT.md lists the old image variants (`-thumb/-medium/-large`) as "unused". **That is wrong.** `data/landscapes.ts` has 12 live references; they feed the Home LCP image (`app/page.tsx:84`), `PhotoCarousel3D` progressive textures and `GalleryGrid`. The optimize pipeline actually emits `-sm/-md/-lg`. Delete the legacy variants only in Phase 12, after the Phase 8 manifest exists and Phase 10 consumers are migrated, behind an asset-exists Jest test.

Other verified repo facts: `public/images/landscapes/` serves ~194 MB of full-resolution originals publicly, all four with GPS EXIF blocks (optimized variants are clean); CI runs Node 20 (EOL April 2026); `eslint-config-next` is installed but not wired, so jsx-a11y rules don't run.

## Key Findings

### Recommended Stack

The upgrade is a chain, not a single bump. Stable `<ViewTransition>` needs **React 19.3.0**, which ships with **Next 16.4** (no `experimental.viewTransition` flag since 16.3). `@react-three/fiber` 9.6/9.7 peer `react <19.3`, so **R3F 9.8.1 + drei 10.7.9** must move in the same commit. framer-motion 12.35 → **`motion` 14.1.0** breaks nothing this repo uses (13.0's only break is the `@emotion/is-prop-valid` removal; 14.0 has none); the `motion/react` import swap is mechanical across 24 files, and the only behavior change is internal `useScroll` offset tracking (13.4.4–13.5) — so baselines must exist first and include mid-scroll shots. A Next.js security release is announced for 2026-10-14; take that patch.

**Core technologies:**
- `next` 16.4.x, `react`/`react-dom`/`@types/react*` 19.3.0 — `<ViewTransition>` + `addTransitionType`, no flag
- `@react-three/fiber` 9.8.1, `@react-three/drei` 10.7.9 — required by React 19.3; `three` stays ^0.184
- `motion` 14.1.0 (replaces `framer-motion`) — same API, `motion/react` imports
- `@playwright/test` 1.64.0 — bump *after* baselining on the lockfile version (1.60)
- Build-time devDeps: `geotiff` 3.0.5, `d3-contour` 4.0.2 (ESM-only, scripts only), `simplify-js` 1.2.4, `exif-reader` 2.0.3 with existing `sharp` 0.34.5, `colorjs.io`, `@axe-core/playwright` 4.13.0
- Runtime additions: `fast-png` 8.0.0 (hero chunk only, ~11 KB gz), `@phosphor-icons/react` 2.1.10 (generic glyphs only, via `/dist/ssr`)
- Fonts: Schibsted Grotesk (display, ~47 KB), Inter (body), JetBrains Mono (data) — no fourth family

**Measured asset budgets:** 512² 16-bit heightmap ≈ 336 KB (desktop), 256² ≈ 92 KB (mobile); contour SVG at 100 m interval ≈ 50 KB raw / 13.5 KB brotli.

**Do not add:** GSAP, Lenis, exifr, proj4, `@react-three/postprocessing`, three-custom-shader-material, drei `useDetectGPU` (fetches from unpkg → blocked by CSP), drei `ScrollControls`, any slippy-map library, lightbox or photo-layout libraries, a 1024² heightmap, cmdk, `eslint-plugin-better-tailwindcss` (see resolution e).

**Browser support facts:** same-document View Transitions + types work in Chrome 125+, Safari 18.2+, Firefox 147+. CSS scroll-driven animations are **still absent from Firefox stable (157)** — the altimeter and ascent must run on Motion `useScroll`; CSS `animation-timeline` only for decoration behind `@supports` (Tailwind 4.3 has no utilities; use `@utility`).

### Expected Features

FEATURES.md found 18 gaps (G1–G18) the approved plan didn't cover; the ones that shape the roadmap are folded in below.

**Must have (table stakes):**
- One `SiteNav` with skip link, active state and mobile menu; footer legend with "© swisstopo"
- Home: identity + primary CTA in the first viewport, fully readable without scroll effects; native scroll only; static poster fallback; "skip the ascent" link
- Deep-linkable photos at `/photos/[slug]` — full page on direct load, modal over the gallery on in-site navigation, Back closes it, prev/next don't push history (G1)
- Real lightbox: arrow keys, prev/next buttons, counter, swipe, focus trap and focus return to the thumbnail (G3)
- `scrollbar-gutter: stable` with the visible scrollbar so modal scroll-lock doesn't shift layout (G4)
- Per-route metadata, `metadataBase`, OG images, sitemap, robots (G2)
- Case studies with data-optional sections; risk scale labelled by glyph + text + range with a table equivalent (color-not-only)
- Contact: visible labels, error summary with focus, preserved input on error, honeypot
- Designed 404, `error.tsx`, `global-error.tsx` (G14) and offline pages
- One canonical photo order everywhere (ascending altitude) (G18); `?view=` / `?area=` URL state via `router.replace` (G17)

**Should have (differentiators):**
- Real-terrain hero with contour shader and EXIF-GPS waypoints
- Photo Map view with keyboard-operable pins
- Hotspot callouts with leader lines, a mobile legend and a clean-view toggle
- Thumbnail → lightbox View Transition morph (progressive; lightbox must work without it)
- Instrument-panel metrics with context lines; trail-grade `RiskScale`
- Route-log roadmap on an elevation axis; "register signed" contact confirmation; `?ref=` photo prefill on Contact
- Terminal demo with pause/step controls and a static transcript (G16)

**Defer (post-v2.0):** JSON-LD beyond basics, Share button, LV95 coordinate display, offline page listing cached pages, photo tag filters (worth it at 20+ photos), blog, print licensing.

**Anti-features (hold the line):** scroll-jacking, masonry, infinite scroll, slippy map, right-click blocking / watermarks, full-resolution download, count-up number animations, public guestbook, CAPTCHA, Gantt charts.

**Data gaps blocking locked features:** one photo (R004-011, a film scan) has no GPS (G5); demo commands cover only Low and High and lack a numeric `riskScore` (G9); roadmap items lack dates/order and the "Other" filter has zero items (G11); photo copy contradicts EXIF (Glacier Trail annotation says 2,900–3,100 m vs GPS 2,597 m; `img-0605` tagged 2024 vs EXIF Sep 2021; two near-duplicate stories) (G15); no route-panel imagery (G10).

### Architecture Approach

All routes, Home included, move by `git mv` into `app/(site)/` in one commit, under a shared `SiteChrome` (one fixed `SiteNav` that turns transparent over the hero, plus `SiteFooter`). The root `not-found` and `global-error` render `SiteChrome` themselves (do not use `global-not-found`). `await headers()` stays at the root, the nonce CSP is unchanged, and `cacheComponents`/PPR stays off (incompatible with nonce CSP). Client pages become Server Components with client islands so they can export metadata. Generated data lives in committed, deterministic `data/generated/*.ts` typed with `satisfies` against zod schemas, verified in CI with `--check`; editorial data stays in `data/landscapes.ts` with `locationOverride` corrections. Hashed binaries live under `public/terrain/`.

**Major components:**
1. `SiteChrome` / `SiteNav` / `SiteFooter` (+ `data/site.ts` identity) — single shell for every route
2. `scripts/build-terrain` + `scripts/extract-exif` (+ `--check`) → `data/generated/*`, `public/terrain/*` — offline data pipelines
3. `lib/geo.ts` (WGS84 ↔ LV95 ↔ terrain grid), `lib/trail-grade.ts`, zod schemas with typed project-highlight blocks (discriminated union)
4. `ContourField` — one contour asset serving hero fallback, Map view, footer and 404
5. `AscentHero` — server-rendered hillshade poster (the LCP) + DOM waypoint list beneath a lazy R3F canvas (`frameloop="demand"`, CPU-built mesh, `fwidth` fragment-shader contours, one `useScroll` MotionValue shared by camera and `AltimeterRail`, capability gates: reduced motion, Save-Data, WebGL2, device memory, PerformanceMonitor, context loss)
6. Photo routing: `photos/layout.tsx` with `@modal/(.)[slug]`, mandatory `@modal/default.tsx`, null `@modal/page.tsx`, full `photos/[slug]` page; the URL is the single source of lightbox and view state; view-transition names stay unique (the grid thumbnail drops its boundary while its photo is open)
7. Motion tokens: CSS custom properties and `lib/animations.ts` kept in parity by a test; `MotionConfig reducedMotion="user"` in the layout

### Critical Pitfalls

1. **Stale install and untrustworthy baselines** — `npm ci` first; `vercel.json` to `npm ci`; baselines generated on Linux against a production build, with dark and light color-scheme projects, `serviceWorkers: 'block'`, `retries: 0`, reduced-motion and mid-scroll shots, canvas masked. Dark and light snapshots must be identical after the `dark:` work.
2. **`dark:` stripped the wrong way** — neutralise first (`@custom-variant dark (&:where(.dark, .dark *))`, `<html class="dark">`, `color-scheme: dark`) for zero markup change; then collapse each file to its `dark:` value with zero screenshot diff; then remove the variant and enable the guard.
3. **Palette guard traps** — rename v1 `amber` to `caution` (it collides with Tailwind's stock amber); scan `data/` and `__tests__/` too (`RoadmapFilters.test` asserts `bg-cyan-600` — rewrite to `aria-pressed`); handle 282 `white`/`black` usages with a decreasing per-file ratchet; add `@theme { --color-*: initial; }` only after the guard reports zero; keep trail yellow outside `--color-*` so it can't become text.
4. **Tests deleted, not rewritten** — per-phase test-contract table and a test-count ratchet; assert exactly one `nav[aria-label="Primary"]` and one `#main-content` per route (`.first()` selectors hide a duplicate nav).
5. **Geodata and privacy** — commit generated data (CI runs `tsc`/Jest without a build); one `lib/geo.ts`; place waypoints at the DEM-sampled height (EXIF altitude is 9–25 m off); EXIF dates are naive local time (no `OffsetTimeOriginal`) → store local ISO + `Europe/Zurich`, format with explicit timezone; move GPS-bearing originals out of `/public`; use `.rotate()` and never `withMetadata()`; swissALTI3D is LV95 while photo GPS is WGS84; d3-contour output is y-down grid coordinates and ESM-only (keep it out of Jest-imported components).
6. **Motion, WebGL and caching** — Motion bump in an isolated commit with zero visual diff and a single `motion-dom` in the tree; explicit `::view-transition-*` reduced-motion CSS; WebGL context-loss fallback; `svh` units and `dpr={[1, 1.5]}`; no drei `<Text>` (blob workers blocked by CSP) — use HTML overlays; content-hash generated asset names (`/images` is cached immutable for a year); make SW navigations network-first so v1 HTML can't be served stale.

### Researcher disagreements and resolutions

| # | Tension | Resolution |
|---|---------|------------|
| a | React 19.3 timing and R3F coupling (STACK: one chain; ARCHITECTURE: Phase 7; PITFALLS: Phase 7 or early 10) | **Phase 7** per the user's 2026-10-10 decision. Next 16.4 + React 19.3 + types + R3F 9.8.1 + drei 10.7.9 in one atomic commit; Motion 14 a separate commit before it; Playwright 1.64 a separate commit after. Each with zero visual diff. |
| b | Lightbox element: `<dialog>` (FEATURES, PITFALLS, STACK) vs overlay + `inert` (ARCHITECTURE) | **Phase 10 spike.** Default to `<dialog>` + `showModal()` in `useLayoutEffect`; fall back to overlay + `inert` if the morph doesn't form in Chromium, Safari 26 and Firefox 157. Spike popstate too — Back may skip the close animation; don't depend on it. Intercepting route either way; the lightbox must work without the morph. |
| c | Heightmap format: 16-bit grey PNG (STACK) vs terrain-RGB (ARCHITECTURE) vs raw Uint16 (PITFALLS) | **16-bit grey PNG decoded with `fast-png` into a `Uint16Array`, CPU-built mesh.** Smallest (336 KB at 512²), verified end to end (~22 ms decode), never browser-decoded. Terrain-RGB measured 690 KB; raw + brotli 388 KB with no gain. Write it with sharp from a `Uint16Array` + `.toColourspace('grey16')` (the `Buffer` + `depth:'ushort'` path silently corrupts). Content-hash the filename. |
| d | DEM source: swissALTI3D (Italian side missing — 10 tiles south of the summit) vs swissALTIRegio (10 m, single cross-border COG, hole-free) | **User decision** (Open Question 1). Research recommends swissALTIRegio. |
| e | Palette lint guard: grep script (ARCHITECTURE) vs `eslint-plugin-better-tailwindcss` (STACK) | **Grep script as the hard CI gate** (catches object maps, data files, tests, `@apply`; supports a ratchet), with `--color-*: initial` as compile-time backstop. Skip the ESLint plugin. |
| f | `dark:` neutralisation | **Adopt PITFALLS' staged path** (superset of the mechanical sweep). |
| g | Playground deletion timing | **Delete the 3 routes and the `/transitions` link in Phase 7.** Keep `AnimatedGradientMesh` until Contact is rebuilt in Phase 12; fix the Contact h1 contrast now with a solid surface. |
| h | Playwright version: 1.64 (STACK) vs 1.60 Docker image (PITFALLS) | Baseline on the lockfile version, then bump to 1.64 as its own commit; re-baseline only if Chromium rendering differences require it. |

### Open questions needing a USER decision

| # | Question | Needed by | Options / recommendation |
|---|----------|-----------|--------------------------|
| 1 | DEM source | Phase 8 | Recommend **swissALTIRegio 10 m**. swissALTI3D would need a crop to N ≥ 1'090'000 or a Regio fill. Changes the locked "swissALTI3D" wording. Confirm cross-border attribution string (fallback: "© swisstopo" + "Height model: swissALTIRegio"). |
| 2 | Placement of the photo without GPS (R004-011) | Phase 8 | Manual "approx." position, an "Unplaced" tray, or a user-supplied location. Never drop it, never place at 0,0. |
| 3 | Default photo view | Phase 10 | Recommend **Grid**; Map one click away. |
| 4 | Deleted routes: redirects vs designed 404 | Phase 7 | Recommend designed 404 unless known inbound links exist. |
| 5 | Move GPS-bearing originals out of `/public` | Phase 8 | Recommend yes (e.g., `assets/photos-original/`, gitignored); confirm where the 194 MB lives. |
| 6 | Waterfall location label | Phase 8 | GPS points to the gorge just south of Zermatt (possibly Gornerschlucht, LOW confidence); Tim confirms; record as `locationOverride` with a reason. |
| 7 | GPS precision for shipped data | Phase 8 | Recommend rounding to 4 decimals (~10 m); decide whether the lightbox shows coordinates. |
| 8 | CLI_X per-grade behavior, Medium/Critical demo commands with `riskScore`, sources for "95% accuracy" / "40% faster" | Phase 11 | Content from Tim; otherwise soften the claims. |
| 9 | Route-panel imagery | Phase 11 | Recommend a generated elevation-profile glyph over screenshots. |
| 10 | Display font | Phase 7 UI-SPEC | Schibsted Grotesk vs Host Grotesk (~26 KB lighter, max 800) vs Archivo; decide in UI-SPEC with ui-ux-pro-max. |
| 11 | Roadmap data | Phase 11 | Add `completedAt` and `order`; drop or disable the empty "Other" filter; add v2.0 as in-progress; set a "Last surveyed" date. |
| 12 | Photo copy corrections | Phase 8 | Fix Glacier Trail elevation copy, `img-0605` year tag, near-duplicate stories. |
| 13 | Licensing and sharing posture | Phase 10 | Recommend "© 2021 Tim Lui, all rights reserved", no download, "Ask about this photo" → Contact `?ref=`. |
| 14 | Real identity values | Phase 7 | GitHub, LinkedIn, email, role line, `package.json` author. |

## Implications for Roadmap

Phases continue numbering at 7.

### Phase 7: Foundation & guardrails
**Rationale:** Blocks everything; the regression nets must exist before any visual change, and the risky dependency bumps must land in isolation.
**Delivers (in order):** (1) `npm ci`, `vercel.json` → `npm ci`, CI on Node 24, wire `eslint-config-next`, test-count ratchet; (2) dark + light Playwright projects with Linux production-build baselines; (3) delete playground routes and zero-consumer components (TerminalDemo, Hero3DSection, ZoomableImage); (4) `motion` 14.1.0; (5) Next 16.4 + React 19.3 + R3F 9.8.1 + drei, then Playwright 1.64; (6) tokens v2, motion tokens, visible scrollbar with `scrollbar-gutter`; (7) staged `dark:` removal, grep guard, contrast script reading `globals.css`; (8) `data/site.ts`, `SiteNav`, `SiteFooter`, `SiteChrome`, `(site)` move, root `not-found` + `global-error`; Contact h1 contrast fix.
**Avoids:** stale install, wrong baselines, wrong-half `dark:` removal, palette-guard traps, duplicate navs, Motion `useScroll` drift.
**Research flag:** no research-phase; run `/gsd-ui-phase` (with ui-ux-pro-max) for tokens, type and nav.

### Phase 8: Data & terrain pipeline
**Rationale:** Map view, waypoints, EXIF strip, grid aspect ratios, 404 art and OG images all consume it; Phase 11 needs the typed highlights.
**Delivers:** zod schemas and typed highlights; `lib/geo.ts` with tests; `build-terrain` and `extract-exif` with `--check`; corrections file; image manifest; originals moved out of `/public` plus a CI GPS scan; `ContourField` in the footer; `lib/trail-grade.ts`; v1-alias removal codemod; hashed-name plumbing for the SW precache; proxy matcher and cache headers.
**Uses:** geotiff, d3-contour, simplify-js, exif-reader + sharp.
**Research flag:** needs research-phase (DEM decision, attribution, poster rendering, EXIF policy).

### Phase 9: Home ascent
**Rationale:** Signature experience; depends on Phase 8 assets and Phase 7 shell.
**Delivers:** `AscentHero` with poster + DOM waypoint list; capability gate; R3F terrain with contour shader; `AltimeterRail` (`aria-hidden`, tabular-nums, 1,626 → 4,478 m); summit plaque; trail-sign routes; skip link; reduced-motion final states; GPU disposal.
**Research flag:** needs research-phase (shader tuning, real mobile devices, canvas test strategy).

### Phase 10: Photography (parallel with 11)
**Delivers:** `@modal` interception + full `[slug]` page; Map / Grid (in-house justified rows) / Carousel (flat stepper under reduced motion); `?view=` with `router.replace`; canonical altitude order; lightbox with focus handling, EXIF strip, hotspot callouts, clean view; morph; keyboard-operable map pins; per-photo metadata and OG; manifest migration; `photos.spec` and `GalleryGrid.test` rewritten.
**Research flag:** spike `<dialog>` vs overlay with View Transitions, popstate close, interception from Home.

### Phase 11: Engineering & roadmap (parallel with 10)
**Delivers:** `RoutePanel` (hex code retired); `CaseStudy` template; trail-grade `RiskScale` with table equivalent; `riskScore` examples; `DemoTerminal` with controls and static transcript; `RouteLog` roadmap; project metadata and OG; tests rewritten to assert state, not color classes.
**Research flag:** content-gated (decisions 8, 9, 11 first); no research-phase.

### Phase 12: Contact, edge pages, cleanup & verification
**Delivers:** `SummitRegister` (restyle only; keep `/api/feedback`, CSRF, rate limit, accessible names; add honeypot + error summary); 404 / error / global-error / offline; SW strategy with an update e2e; deletions (`AnimatedGradientMesh`, legacy image variants, dead code, `raw.githubusercontent.com` from `connect-src`); v1 aliases removed and white/black ratchet at 0; sitemap, robots, JSON-LD; axe on every route; cross-browser run; CLS, link-crawl, image-4xx and CSP-console checks; PROJECT.md updated.
**Research flag:** none; run the PITFALLS "Looks Done But Isn't" checklist in the milestone audit.

### Phase Ordering Rationale

- Regression nets and dependency bumps first, because every later visual change is judged against them.
- Data pipelines before any consumer: four surfaces share one contour asset and one typed photo dataset.
- Photography and Engineering share only the shell and data, so they can run in parallel after Phase 8/9.
- Destructive cleanup (legacy image variants, aliases, gradient mesh) last, after consumers are migrated and guarded by tests.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 8:** DEM source/attribution, poster rendering, EXIF and GPS policy
- **Phase 9:** shader tuning, mobile GPU thresholds, deterministic canvas screenshots (SwiftShader flags)
- **Phase 10:** `<dialog>` + `<ViewTransition>` + canvas snapshot, popstate close, interception from Home

Phases with standard patterns (skip research-phase):
- **Phase 7:** well-documented upgrades and token work (use `/gsd-ui-phase` for design decisions)
- **Phase 11, 12:** established patterns; gated on content decisions

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions, EXIF fields, DEM tooling and asset sizes verified by executed scripts against real data; shader, font and icon calls MEDIUM |
| Features | MEDIUM | Codebase facts HIGH (files read, dimensions and EXIF checked); exemplar comparisons partly from memory |
| Architecture | MEDIUM-HIGH | Next 16.4 / React 19.3 behavior checked against official docs and the npm tarball; View Transitions with `<dialog>` and popstate are spikes |
| Pitfalls | HIGH | Repo-inspected; only the waterfall name, R004 EXIF, EXIF altitude reference and scroll-timeline reduced-motion behavior are LOW |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- swissALTIRegio cross-border attribution string: confirm from swisstopo product docs in Phase 8
- `<dialog>` + `<ViewTransition>` + canvas snapshot and popstate close: Phase 10 spike
- SwiftShader flags and poster rendering approach for deterministic screenshots: Phase 9
- Waterfall name and R004-011 EXIF contents: Tim confirms in Phase 8
- R3F 9.8.1 + drei 10.7.9 + three 0.184 on the real hero: verify during the Phase 7 bump
- Next 16.4 security release due 2026-10-14: take the patch in Phase 7
- Firefox stable 157 lacks scroll-driven CSS animations: nothing may depend on them
- Content gaps (Open Questions 8–12): collect before Phases 8 and 11

## Sources

Full source lists with URLs and per-claim confidence are in each dimension file:
- STACK.md §Sources — npm registry (versions, peer ranges), motion changelog, React 19.3 and Next.js 16.3/16.4 release notes, MDN browser-compat data, swisstopo swissALTI3D / swissALTIRegio product pages; scripts executed against the real photos and swisstopo data
- FEATURES.md §Sources — Next.js intercepting/parallel routes docs, lightbox accessibility guides, SAC hiking-scale references, 15+ ui-ux-pro-max searches (ux, chart, landing, nextjs, threejs)
- ARCHITECTURE.md §Sources — Next.js 16.4 docs (route groups, not-found, CSP, parallel routes), Tailwind v4 theme docs, React 19.3 npm tarball exports
- PITFALLS.md §Sources — repo inspection (selectors, `dark:`/palette counts, CSP, service worker), motion changelog, swisstopo docs, ui-ux-pro-max guideline names cited inline

---
*Research completed: 2026-10-10*
*Ready for roadmap: yes*
