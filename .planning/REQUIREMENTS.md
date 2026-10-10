# Requirements: Portfolio App — v2.0 Topographic Identity

**Defined:** 2026-10-10
**Core Value:** A portfolio that is visually memorable and distinctive — not another generic Tailwind site — while being stable and well-maintained under the hood.

**Process constraint:** All UI/UX work for these requirements uses the `ui-ux-pro-max` skill (see PROJECT.md Constraints).
**Inputs:** Approved plan (https://claude.ai/artifact/GXsHFNbtf7Qp6hPSYxuY8U), `.planning/research/SUMMARY.md` and the four dimension files.

## v2.0 Requirements

Requirements for this milestone. Each maps to exactly one roadmap phase.

### Guardrails

- [ ] **GUARD-01**: Local, CI and Vercel installs match the lockfile exactly (`npm ci` everywhere; CI runs on Node 24)
- [ ] **GUARD-02**: Playwright visual baselines exist for every route in dark and light color schemes, captured from a production build on Linux with service workers blocked and `retries: 0`, before any visual change lands
- [ ] **GUARD-03**: CI fails if the total test count drops below the previous phase's count (tests are rewritten, never silently deleted)
- [ ] **GUARD-04**: CI fails on any `dark:` variant or stock Tailwind palette class in `app/`, `components/`, `lib/`, `data/` and tests, with a decreasing per-file ratchet for `white`/`black`
- [ ] **GUARD-05**: The contrast check reads token values from `app/globals.css`, runs in `npm run lint`, and every text/background token pair passes WCAG AA
- [ ] **GUARD-06**: jsx-a11y rules run in lint via `eslint-config-next`

### Dependencies

- [ ] **DEPS-03**: framer-motion is replaced by `motion` 14.1 (`motion/react` imports) with zero visual diff against the baselines, including mid-scroll captures
- [ ] **DEPS-04**: Next 16.4.x (including the 2026-10-14 security patch), React 19.3, `@react-three/fiber` 9.8.1 and drei 10.7.9 are upgraded in one isolated commit with zero visual diff
- [ ] **DEPS-05**: Playwright is upgraded to 1.64 in its own commit after baselining on the lockfile version

### Design System

- [ ] **DSGN-05**: Every visitor sees the same dark design regardless of their OS light/dark setting (no `dark:` variants; `color-scheme: dark`)
- [ ] **DSGN-06**: Every page uses tokens v2 (night-map OKLCH palette with semantic tokens); v1 token names survive only as temporary aliases
- [ ] **DSGN-07**: Type uses one Swiss-style grotesk display face, Inter for body text and JetBrains Mono only for data, with tabular numerals for figures (display face chosen in the Phase 7 UI-SPEC)
- [ ] **DSGN-08**: Motion durations and easings come from shared tokens used by both CSS and Motion, and all motion respects `prefers-reduced-motion`
- [ ] **DSGN-09**: A thin, visible scrollbar is shown with a stable gutter, so opening a modal never shifts the layout
- [ ] **DSGN-10**: Icons come from one SVG family; no emoji are used as icons

### Shell & Identity

- [ ] **SHELL-01**: Every page has exactly one primary navigation and one main landmark, with a skip link and a visible current-page indicator
- [ ] **SHELL-02**: On mobile, the navigation opens a menu with touch targets of at least 44 px that closes on route change and on Escape
- [ ] **SHELL-03**: The site shows Tim Lui's real name, role line and real GitHub, LinkedIn and email links everywhere; no placeholder text or links remain
- [ ] **SHELL-04**: The footer is a map legend with contour art, a scale bar and swisstopo attribution
- [ ] **SHELL-05**: `/gradient-mesh`, `/particle-buttons` and `/transitions` are removed and resolve to the designed 404, and no page links to them
- [ ] **SHELL-06**: The Contact heading and form fields meet WCAG AA contrast for every visitor (interim fix ahead of the Contact redesign)

### Data & Terrain

- [ ] **DATA-01**: A build script turns swissALTIRegio elevation data for the Zermatt–Matterhorn area into a 16-bit heightmap (512² desktop, 256² mobile) and a contour SVG, committed with content-hashed filenames
- [ ] **DATA-02**: A build script extracts EXIF (capture date and time, camera, lens, focal length, aperture, shutter, ISO, GPS) from the originals into typed, committed photo data, and CI fails when that data is stale
- [ ] **DATA-03**: Photo content is accurate: capture dates come from EXIF (Europe/Zurich), the waterfall location is confirmed by Tim, annotation altitudes agree with GPS, year tags are fixed and near-duplicate stories are rewritten
- [ ] **DATA-04**: The film-scan photo without GPS has a hand-placed position that is flagged as approximate wherever it is shown
- [ ] **DATA-05**: Full-resolution originals are no longer served publicly; served images are resized, correctly rotated and carry no GPS metadata, enforced by a CI scan
- [ ] **DATA-06**: Photo coordinates shipped to the browser are rounded to 4 decimals (~10 m)
- [ ] **DATA-07**: Project highlights use a typed schema per project instead of a generic record, and every risk example carries a numeric `riskScore`
- [ ] **DATA-08**: The image pipeline emits a manifest that components use for image paths instead of hard-coded variant filenames

### Home

- [ ] **HOME-01**: A visitor sees Tim Lui's name, role and primary call to action in the first viewport, readable without any animation or WebGL
- [ ] **HOME-02**: On capable devices the hero renders the real Matterhorn terrain with contour lines; otherwise (reduced motion, no WebGL2, Save-Data, low memory, lost context) a static contour poster renders
- [ ] **HOME-03**: Scrolling moves the camera up the terrain using native scroll with no scroll-jacking, and a skip link jumps past the ascent
- [ ] **HOME-04**: An altimeter rail shows ascent progress from 1,626 m to 4,478 m (decorative, hidden from assistive tech, hidden below 768 px)
- [ ] **HOME-05**: Photo waypoints appear at their real positions and heights during the ascent, and an always-rendered list links to each photo
- [ ] **HOME-06**: Two trail-sign links lead to Photographs and Engineering, and key stats appear as a summit-plaque readout
- [ ] **HOME-07**: Under reduced motion every Home section renders in its final readable state; the WebGL canvas renders on demand and pauses when off-screen
- [ ] **HOME-08**: Mobile LCP and JavaScript size on Home are no worse than the Phase 7 baseline

### Photos

- [ ] **PHOTO-01**: `/photos` opens on the Map view, showing each photo as a keyboard-operable waypoint on the contour map
- [ ] **PHOTO-02**: A visitor can switch to Grid (justified rows at true aspect ratios) and Carousel (the 3D carousel restyled, a flat stepper under reduced motion), and the chosen view is kept in the URL without adding history entries
- [ ] **PHOTO-03**: Photos appear in one canonical order (ascending altitude) in every view
- [ ] **PHOTO-04**: The carousel never advances without user control, or offers pause and stops on focus and under reduced motion

### Lightbox

- [ ] **LBOX-01**: Each photo has its own URL (`/photos/[slug]`) that loads a full page when opened directly and opens as a lightbox over the gallery when navigated in-site; Back closes the lightbox
- [ ] **LBOX-02**: In the lightbox a visitor can move between photos with arrow keys, previous/next buttons and swipe, sees a position counter, and moving between photos adds no history entries
- [ ] **LBOX-03**: The lightbox traps focus, closes on Escape and returns focus to the thumbnail or pin that opened it
- [ ] **LBOX-04**: The lightbox uses a neutral gallery-black surface and shows an EXIF strip (date, camera, lens, focal length, aperture, shutter, ISO, altitude, coordinates)
- [ ] **LBOX-05**: Annotation hotspots appear as map-style callouts with leader lines, operable by tap and keyboard, with a legend on mobile and a toggle that hides them
- [ ] **LBOX-06**: Opening a photo from the grid or map morphs the thumbnail into the lightbox where View Transitions are supported; elsewhere it opens instantly with full functionality
- [ ] **LBOX-07**: Each photo states "© {capture year} Tim Lui, all rights reserved" and offers no download button

### Engineering

- [ ] **ENG-01**: `/projects` shows each project as a full-width route panel (name, pitch, metric strip, trail-grade badge, elevation-profile glyph); the hexagon cards and hex-grid code are removed
- [ ] **ENG-02**: Project pages follow a case-study structure (problem, pipeline diagram, safety, metrics, demo, stack, next steps) and omit any section that has no data
- [ ] **ENG-03**: CLI_X's four risk bands are shown as Swiss trail grades, each with its marker glyph, text label and score range, plus an equivalent data table
- [ ] **ENG-04**: Metrics display as an instrument panel with tabular numerals and a context line, and every claim is either sourced or softened
- [ ] **ENG-05**: The terminal demo uses tokens v2, stops auto-playing on focus, hover and under reduced motion, and has a pause button

### Roadmap

- [ ] **ROUTE-01**: The roadmap shows items on a vertical elevation axis: completed below, in-progress at the current camp, planned above
- [ ] **ROUTE-02**: A visitor can filter by project and status with a segmented control; the filter lives in the URL, and filters with no items are removed or disabled
- [ ] **ROUTE-03**: Roadmap data includes an order and completion dates, lists v2.0 as in progress, and shows a "last surveyed" date

### Contact

- [ ] **CONTACT-01**: The contact page is a dark "summit register" form with visible labels and field borders, Tim's email as selectable text, and the location as coordinates
- [ ] **CONTACT-02**: Validation errors appear below each field and in an error summary that receives focus; input is kept on error; submitting shows progress, then a "register signed" confirmation or a recoverable error
- [ ] **CONTACT-03**: A honeypot field blocks simple spam bots, and the existing CSRF protection and rate limiting keep working unchanged

### Edge Pages

- [ ] **EDGE-01**: The 404 page shows "You've left the marked trail" with contour art and a route home, and the error and global-error pages use the same shell
- [ ] **EDGE-02**: The offline page matches the design system, and the service worker fetches pages network-first so no visitor sees stale v1 pages after deploy

### SEO

- [ ] **SEO-01**: Every route has its own title, description and canonical URL
- [ ] **SEO-02**: Every photo and project page has its own Open Graph image
- [ ] **SEO-03**: The site serves a generated `sitemap.xml` and `robots.txt`

### Verification & Cleanup

- [ ] **VERIFY-01**: Dead code is removed: `Header`, `GlassmorphismNav`, `ParticleButton`, `AnimatedGradientMesh`, `useHexGrid`/`hex-clip`, legacy image variants (after migration), v1 token aliases and unused CSP origins
- [ ] **VERIFY-02**: axe reports zero violations on every route, and a keyboard-only pass through navigation, map, lightbox and contact form succeeds
- [ ] **VERIFY-03**: Chromium, Firefox and WebKit runs pass, including the View Transitions and WebGL fallbacks
- [ ] **VERIFY-04**: No route has CLS above 0.1, broken internal links, missing images or CSP console errors

## Future Requirements

Deferred. Tracked but not in this roadmap.

### Photos

- **PHOTO-F1**: "Ask about this photo" link in the lightbox that pre-fills Contact (`?ref=`)
- **PHOTO-F2**: Share button using the Web Share API
- **PHOTO-F3**: Tag filters (worth it at 20+ photos)
- **PHOTO-F4**: LV95 coordinate display alongside WGS84

### Engineering

- **ENG-F1**: Terminal demo step controls and a static transcript

### Platform

- **PLAT-F1**: Structured data (JSON-LD) beyond basic page metadata
- **PLAT-F2**: Offline page listing cached pages
- **PLAT-F3**: Photography blog
- **PLAT-F4**: Print licensing / ordering

## Out of Scope

| Feature | Reason |
|---------|--------|
| Light mode or theme toggle | Dark-only is a locked decision |
| Scroll-jacking or smooth-scroll libraries (Lenis) | Motion-sensitivity risk; native scroll with Motion `useScroll` is enough |
| GSAP | Duplicates Motion; adds a second animation runtime |
| Slippy map or map libraries | A contour SVG of one valley needs no tiles; avoids CSP and bundle cost |
| Masonry and infinite scroll | Justified rows at true aspect ratio suit 4 landscape photos |
| Right-click blocking and watermarks | Hostile UX; rights are stated instead |
| Full-resolution download | Photos are all rights reserved |
| Count-up number animations | Decorative motion with no meaning |
| Public guestbook | The "summit register" is a private contact form, not a public wall |
| CAPTCHA | Honeypot + rate limiting is sufficient for this traffic |
| Gantt-style roadmap | The route-log elevation axis replaces it |
| CSS scroll-driven animations for essential motion | Not in Firefox stable (157); decoration only, behind `@supports` |
| Creative Commons licensing | User chose all rights reserved |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|

**Coverage:**
- v2.0 requirements: 68 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 68 ⚠️

---
*Requirements defined: 2026-10-10*
*Last updated: 2026-10-10 after initial definition*
