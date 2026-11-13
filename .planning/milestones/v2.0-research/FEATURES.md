# Feature Research

**Domain:** Photographer-engineer portfolio. A data-driven "Topographic Survey" rework (v2.0) that tells its story by scrolling, with a photo light table and engineering case studies.
**Researched:** 2026-10-10
**Confidence:** MEDIUM overall. Interaction conventions are cross-checked across several sources. Codebase facts come from reading the repo directly and count as HIGH. Exemplar comparisons are partly from memory and count as LOW–MEDIUM.
**Scope:** Only the NEW v2.0 capabilities. The direction is locked, so this file does not evaluate alternatives to it. It defines the expected behavior for each locked feature and lists what the plan leaves out.
**Complexity key:** S = less than a day, contained in one component. M = 1–3 days, or touches data plus UI. L = more than 3 days, new pipeline or WebGL, or crosses several routes.

---

## 0. What the plan is missing (read first)

Users of high-quality photo and developer portfolios will expect the items below, but the approved plan does not mention them. Each one is backed by something found in the codebase or in the research. They are ordered by impact.

| # | Gap | Evidence | Recommendation | Cx |
|---|-----|----------|----------------|----|
| G1 | **Photo deep links do not exist.** The lightbox is `useState` in `components/PhotosPageClient.tsx`, so a URL cannot open a photo and Back leaves the page instead of closing the lightbox. | Read `PhotosPageClient.tsx`. ui-ux-pro-max `deep-linking`, `back-behavior`, `state-preservation`. | Add a `/photos/[slug]` route. It renders a full page on hard load and an intercepted modal on soft navigation (Next.js parallel `@modal` slot plus `(.)` interception, as in the nextgram reference). | M |
| G2 | **No per-page metadata anywhere.** The only `metadata` export is in `app/layout.tsx` ("Portfolio \| Landscape Photography & Projects"). There is no `generateMetadata`, no Open Graph, no `metadataBase`, no `sitemap.ts`, no `robots.ts`. | Grep of `app/`. ui-ux-pro-max nextjs stack: "Use generateMetadata for dynamic", "Include OpenGraph images". | Unique `title` and `description` per route, OG/Twitter images per photo and per project, `sitemap.ts`, `robots.ts`, JSON-LD. Unique titles also give the Next.js route announcer something useful to say. | M |
| G3 | **The lightbox fails basic gallery conventions.** It supports Escape only. There are no arrow keys, no prev/next, no counter, no focus trap, focus is not returned to the thumbnail, and it has a `bg-white dark:bg-gray-900` panel. | `components/ImageDetailModal.tsx:19-52`. PhotoSwipe conventions. eBay/Mesa/Mada lightbox a11y guides. | Rebuild on native `<dialog>.showModal()`, which gives top layer, inert background and Esc for free. Add arrows, swipe, a counter and focus return (see §5). | M |
| G4 | **The visible scrollbar combined with scroll lock causes layout shift.** The modal sets `body.style.overflow = 'hidden'`. Once scrollbars are visible (a locked decision), opening the lightbox makes the page jump sideways by the scrollbar width. | `ImageDetailModal.tsx:32`. Locked "visible thin scrollbar". | Put `scrollbar-gutter: stable` on `html`. Add a Playwright screenshot check with the lightbox open. | S |
| G5 | **One photo has no GPS** (PROJECT.md: "GPS on 3 of 4 originals"). The Map view and the ascent both place waypoints by GPS. | PROJECT.md UI audit. | Define the "unlocated" behavior explicitly: a manually surveyed position flagged "approx.", or an "Unplaced" tray beside the map. Never silently drop the photo. | S |
| G6 | **`<ViewTransition>` needs React 19.3.** The installed version is React 19.2.4 (`next` 16.1.6). The Next 16.4 guide (2026-09-10) states that React 19.3 ships `<ViewTransition>`/`addTransitionType`. | `node_modules` versions. nextjs.org/docs/app/guides/view-transitions. | Either bump React/Next (and isolate it like the framer-motion upgrade), or call `document.startViewTransition()` directly for the same-document lightbox open. Same-document View Transitions are Baseline since Firefox 144 (Oct 2025). Hand off to STACK. | S–M |
| G7 | **The EXIF pipeline input is not in git.** `public/images/landscapes/` is in `.gitignore:55` (the 14–81 MB originals), so a Vercel build cannot read EXIF from them. The optimized WebPs have EXIF stripped (verified: `exif: false`). | `git check-ignore`. `sharp.metadata()`. | Run EXIF extraction locally and commit the generated typed data (e.g. `data/photos.generated.ts`). CI then only validates it. | S |
| G8 | **Deleted playground routes will 404 for any inbound link.** | Locked: delete `/gradient-mesh`, `/particle-buttons`, `/transitions`. | Add permanent redirects in `next.config` (→ `/` or `/projects`), or let them hit the designed 404 on purpose. Decide and test. | S |
| G9 | **The risk data cannot drive the trail-grade visual.** `demoCommands` only contain `low` and `high`, with no `medium` or `critical` example. There is no numeric score, so commands cannot be placed on the 0.0–1.0 scale. | `data/projects.ts:76-102`. | Add a `riskScore: number` to `DemoCommand`, and at least one Medium (T2–T3) and one Critical (unmarked) example, so all four bands are demonstrated rather than only listed in a legend. | S |
| G10 | **The route panels have no project imagery.** `thumbnailImage` is unset for both projects and `public/` has no project screenshots. | `data/projects.ts`, `ls public/images`. | Each route panel needs a visual. Use a generated elevation-profile or pipeline glyph (on-brand, no screenshots required) or real screenshots. A content task, so it needs to be on the roadmap. | S–M |
| G11 | **The roadmap data does not suit an elevation axis.** It has no dates (`completedAt`/`updatedAt`). `targetRelease` versions are not comparable across areas (`v1.1.0` website vs `v2.4.0` CLI). The `other` area has 0 items, yet its filter button exists. Portfolio items are stale ("3D Image Gallery Enhancement", v1.1.0) while the site itself is going to v2.0. | `data/roadmap.ts`, `RoadmapFilters.tsx`. | Add `completedAt?` and a sortable `order`. Drop the empty `other` filter, or show it disabled with a "(0)" count. Add v2.0 "Topographic Identity" as the in-progress portfolio item. Show a "Last surveyed: <date>" stamp. | S |
| G12 | **There is no image download or licensing policy.** | — | Do not block right-click, since it breaks a11y and does not stop anyone. Serve at most 2400 px (already the case). Show "© 2021 Tim Lui. All rights reserved" in the EXIF strip, and add a "Ask about this photo" link to `/contact?ref=<slug>`. | S |
| G13 | **There is no share affordance** for photos or case studies. | — | A "Share" button: `navigator.share()` where available, otherwise copy-link with a polite live "Link copied" message. | S |
| G14 | **`app/global-error.tsx` is missing.** Errors thrown in the root layout bypass `app/error.tsx`. | `ls app`. | Add a minimal self-contained `global-error.tsx` in the "off the marked trail" style. | S |
| G15 | **Some photo data contradicts itself**, which undercuts a "real data" story. The Glacier Trail annotation says "2,900–3,100 m" but that photo's GPS altitude is 2,597 m. `img-0605` is tagged `2024`/`summer` but EXIF says Sep 2021. Two `story` texts are near-duplicates. | `data/landscapes.ts`. PROJECT.md audit. | Reconcile copy against EXIF in the data-pipeline phase. Treat every displayed number as sourced from data. | S |
| G16 | **The terminal demo autoplays** (`HologramTerminalDemo` uses `autoPlay = true` with interval timers). Under the "auto-rotating content" rule it needs pause/prev/next and must stop on focus and under reduced motion. | `HologramTerminalDemo.tsx:10-21`. ui-ux-pro-max `auto-rotation-controls`. | Add play/pause and step controls. Under reduced motion, render the full transcript statically. | S |
| G17 | **View and filter state is not in the URL.** Photos view mode and roadmap filters are local state, so Back and refresh lose them. | `PhotosPageClient.tsx`, `app/roadmap/page.tsx`. | Use `?view=map\|grid\|carousel` and `?area=cli`, written with `router.replace` (not push) so filter clicks do not flood history. | S |
| G18 | **No canonical photo order is defined.** Map, Grid, Carousel, lightbox prev/next and the ascent can each end up in a different order. | — | One order everywhere: **ascending altitude**, matching the ascent metaphor. Unlocated photos go last. | S |

---

## 1. Feature Landscape by Category

Category IDs are proposed prefixes for REQUIREMENTS.md.

### SHELL: Site shell, nav, footer, identity

**Expected behavior (testable)**
- One `SiteNav` on every route, in the same position. `aria-current="page"` on the active link, plus a visual indicator that does not rely on color alone (marker or underline).
- Skip link ("Skip to main content") as the first focusable element. The `<main id="main">` target has `tabindex="-1"`.
- After client navigation, the new page's `<h1>` or `<main>` receives focus, or the page title is announced. Requires unique per-route titles (G2).
- Sticky nav must not obscure focus (WCAG 2.2 2.4.11). Use `scroll-padding-top: var(--nav-h)` on `html`.
- Five destinations (Home, Photographs, Engineering, Route log, Contact). Below roughly 768 px, five trail signs do not fit at 375 px, so use a disclosure menu button (`aria-expanded`, Esc closes, focus returns to the button). No horizontally clipped strip.
- Footer works as a map legend. It contains "© swisstopo" (linked, required by the data license), "© Tim Lui <year>", real GitHub/LinkedIn/email links, and a legend that explains the symbols used on the site (waypoint glyph, contour interval, the four trail markers). The legend makes color-coded symbols understandable without relying on color.
- Visible thin scrollbar via `scrollbar-width: thin` and `scrollbar-color`, with `scrollbar-gutter: stable` (G4). Safari support for `scrollbar-color` is unverified, so keep a `::-webkit-scrollbar` fallback (LOW confidence).

| Type | Feature | Why | Cx | Depends on |
|------|---------|-----|----|-----------|
| Table stakes | Single `SiteNav` in `(site)` layout, active state, skip link, mobile menu | ui-ux-pro-max `navigation-consistency`, `nav-state-active`, `skip-links`, `persistent-nav` | M | Replaces `GlassmorphismNav.tsx` and `Header.tsx` (two link arrays are merged into one config) |
| Table stakes | Real identity: "Tim Lui", real links, `mailto:` | Placeholder identity is the audit's top credibility issue | S | `Footer.tsx`, `lib/email.ts` copy ("your portfolio website") |
| Table stakes | Focus visible and not obscured, 24×24 minimum targets (44 recommended) | WCAG 2.2 AA | S | Tokens v2 focus ring |
| Table stakes | Footer legend with © swisstopo attribution | License requirement (PROJECT.md constraint) | S | Token system, trail-marker SVGs from RISK |
| Differentiator | Trail-sign links that show a destination "distance", e.g. "Photographs · 4 waypoints", "Engineering · 2 routes" (Swiss signposts show walking time) | Makes the nav informative and fits the metaphor. Counts derive from data | S | `data/*` counts |
| Differentiator | Scale bar in the footer that matches the real contour map scale | Signals that the map is real | S | DEM pipeline (scale known at build time) |
| Anti-feature | Glassmorphism or blur on the nav | Retired v1.0 language. Blur is meant for dismissal context (`blur-purpose`) | — | — |
| Anti-feature | Yellow trail-sign styling on every nav item | Yellow also means T1 "Low risk" on the case study, so a fully yellow nav dilutes that meaning | — | Use a yellow accent tip or arrow only |

### HOME: Home "ascent"

**Expected behavior (testable)**
- **Readable without scrolling effects** (ui-ux-pro-max "Scroll-Triggered Storytelling"). The first viewport contains the `<h1>` "Tim Lui", a role line, and at least one visible route CTA. Users do not have to scroll several screens to learn who this is.
- **Native scroll only**: no scroll hijacking, wheel interception or snap-locking. Reverse and fast scrolling produce correct states.
- **Complete DOM reading order.** Chapters are real `<section>`s with headings, in altitude order (1,626 m → … → 4,478 m). The WebGL canvas is `role="img"` with a descriptive `aria-label` (ui-ux-pro-max threejs "Canvas aria-label") or `aria-hidden` if it is purely decorative.
- **Altimeter rail** is a progress indicator *and* navigation. Each waypoint tick is a link to its chapter anchor (keyboard reachable). The live altitude readout uses `font-variant-numeric: tabular-nums` and is `aria-hidden`; no continuous live-region announcements.
- **Photo waypoints** on the terrain are operable. Each has a DOM-equivalent link (HTML overlay or synced list) that opens `/photos/[slug]`. Hover alone never reveals essential info.
- **Signpost routes** (Photographs · 4 waypoints / Engineering · 2 routes) appear at the end of each chapter and at the summit, per the "CTA at end of each chapter + final" rule.
- **Summit plaque** shows stats derived from data (photo count, highest waypoint, projects, test count). No count-up animation.
- **Reduced motion:** no camera flight, no scrubbing. Each chapter renders in its final readable state with the terrain as a single static frame. The preference is read reactively with `matchMedia(...).addEventListener('change')` (ui-ux-pro-max threejs).
- **No WebGL, context lost, or low power / Save-Data:** a static contour SVG/AVIF poster with the same chapters and links.
- **Loading:** the poster plus `<h1>` render first and form the LCP. The canvas fades in once ready. Never show a blank or black canvas.
- **Performance:** pause the render loop when offscreen or when the tab is hidden (`setAnimationLoop(null)` on `visibilitychange`). Use a lower DEM resolution on mobile. Use `dvh` units so the iOS URL bar does not cause jumps.
- **Progressive enhancement of scroll effects:** use CSS `animation-timeline: scroll()/view()` where supported (Chromium 115+, Safari 26+). Firefox support is unconfirmed, so the rail and chapter states must also work through IntersectionObserver or degrade to static (MEDIUM confidence).

| Type | Feature | Why | Cx | Depends on |
|------|---------|-----|----|-----------|
| Table stakes | Identity + CTA in first viewport; readable without scroll effects | Storytelling pattern; recruiters skim | S | SHELL |
| Table stakes | Static fallback (reduced motion / no WebGL / context loss) | Locked requirement plus a11y | M | DEM pipeline poster render |
| Table stakes | Pause offscreen / hidden tab; reactive reduced-motion | Battery, jank, a11y | S | Replaces `Hero3DMountain.tsx` / `MountainTerrain3D.tsx` loop logic |
| Table stakes | "Skip the ascent" link to the routes/summit | Long scroll narratives need an exit (`escape-routes`) | S | — |
| Differentiator | Real swissALTI3D Matterhorn with contour shader | Core identity of v2.0 | L | DEM pipeline (build-time heightmap + contours), R3F |
| Differentiator | Altimeter rail 1,626 → 4,478 m as clickable progress nav | Doubles as a progress indicator, which the storytelling pattern requires | M | Waypoint data from EXIF pipeline |
| Differentiator | Photo waypoints placed by EXIF GPS/altitude | Joins photography and terrain | M | EXIF pipeline (G7), unlocated rule (G5) |
| Anti-feature | Scroll-jacking / snap-locked chapters | Breaks keyboard, trackpad momentum and screen readers | — | Native scroll + scroll-driven CSS |
| Anti-feature | `DualParticleSystem` hexagons or any particles competing with the headline | Audit finding; `excessive-motion` | — | Delete |
| Anti-feature | Autoplay camera tour on load | Vestibular trigger; delays content | — | Scroll-linked only, off under reduced motion |

### PHOTO: Photographs light table (Map / Grid / Carousel)

**Expected behavior (testable)**
- **View switcher** is a segmented control (`role="radiogroup"` or a set of `aria-pressed` buttons) with text labels and icons. The selected view is written to `?view=` with `router.replace`. Reloading or deep-linking restores it, and Back from a photo restores the view *and* scroll position.
- **Default view must be specified in requirements.** Recommendation: **Grid** ("visuals first, fast loading", ui-ux-pro-max Portfolio Grid). Map is the differentiator, one click away. A map-first default delays the photographs behind an abstraction.
- **Every view uses the same photo order** (ascending altitude, G18) and opens the same lightbox/route.
- **Surface:** dark light table around the views. Photos themselves are never tinted, glowed or overlaid by map color (locked "gallery-black" decision).

#### Map view
- Fixed-extent contour SVG generated at build time. No tiles, no runtime fetch (CSP constraint), no pan/zoom: four points in a few km do not need a slippy map.
- Each waypoint is a `<a>`/`<button>` in DOM order (by altitude) with a visible label (title + altitude). Focus or hover shows a thumbnail preview, and the preview does not depend on hover. Enter opens the photo.
- **Label collision:** the Zermatt village (1,626 m) and gorge (1,715 m) waypoints are about 1–2 km apart and may overlap at full extent. Offset labels with leader lines, computed at build time.
- **Unlocated photo** (G5) appears in an "Unplaced" tray or as an "approx." marker.
- Accessible alternative: a visible list or table of waypoints (title, altitude, coordinates). Grid view also covers this, but the map itself needs `aria-label` / `<title>`.
- Touch: markers have at least a 44 px hit area even when the glyph is smaller (`no-precision-required`).

#### Grid (justified rows)
- **Reality check:** all four photos are landscape at about 3:2 (2400×1600 ×3 and 2400×1636; verified with `sharp`). Justified rows will look like an equal-height grid today. Build a small in-house row-packing function (the Flickr algorithm: target row height, keep or drop the last item by closest aspect ratio, scale the row to container width, **do not stretch the last row**). Make it generic so future portrait shots work. **Do not add a library** for four images.
- Responsive: one column under about 640 px, then rows computed from container width. Each tile reserves its `aspect-ratio` (CLS < 0.1) and uses `next/image` with `sizes` and a blur placeholder (`thumbnailSrc` already exists).
- The caption (title · altitude · date) is always visible as a "slide mount" label below the image, not hover-only.
- Tiles are links to `/photos/[slug]`. The shared-element View Transition morphs the thumbnail into the lightbox image.

#### Carousel (existing 3D)
- `PhotoCarousel3D` is lazy-loaded only when its view is selected (already `dynamic(..., {ssr:false})`). Its loading state is restyled to tokens: a skeleton, not "Loading 3D viewer…" on a black box.
- It must **not auto-rotate**, or it must have pause control and stop on focus/hover/reduced motion. Arrow keys already work (`PhotoCarousel3D.tsx:163`). Visible prev/next buttons with labels and a "2 / 4" counter.
- Reduced motion or no WebGL: replace it with a flat single-image stepper (same controls).

| Type | Feature | Why | Cx | Depends on |
|------|---------|-----|----|-----------|
| Table stakes | View switcher with URL state, restored on Back | `deep-linking`, `state-preservation` | S | `PhotosPageClient.tsx` rewrite |
| Table stakes | Grid with true aspect, reserved space, visible captions | Portfolio Grid pattern; CLS | S | EXIF pipeline (width/height in data) |
| Table stakes | Consistent order across views | Prevents "where did it go" | S | Typed photo data |
| Table stakes | Carousel controls + reduced-motion stepper | `auto-rotation-controls` | S | `PhotoCarousel3D.tsx` restyle |
| Differentiator | Map view: waypoints on real contours | Ties photos to terrain | M | DEM contour SVG, EXIF GPS, label offsets |
| Differentiator | "Slide mount" captions with altitude in mono | Light-table metaphor with zero extra cost | S | Tokens v2 type |
| Anti-feature | Masonry / Pinterest columns | Breaks reading order and the "true aspect" intent; pointless with uniform 3:2 | — | Justified rows |
| Anti-feature | Infinite scroll / pagination | There are 4 photos | — | — |
| Anti-feature | Tag/filter chips on photos | 4 photos; current tags are inaccurate (G15) | — | Revisit at 20+ photos |
| Anti-feature | Interactive pan/zoom slippy map | CSP forbids tiles; no value at this extent | — | Fixed SVG |

### LIGHTBOX: Photo viewer, EXIF strip, hotspot callouts, deep links

**Expected behavior (testable)**
- **URL:** opening a photo sets the URL to `/photos/<slug>`. Use human-readable slugs, e.g. `matterhorn-mirror-reflection`, not `img-0605`; add a `slug` field.
  - Soft navigation from Photos or Home renders an **intercepted modal over the light table**.
  - Hard load, refresh or a shared link renders a **full standalone photo page** with the same viewer UI, plus a "Back to Photographs" link and the nav.
  - **Back closes the modal** and Forward reopens it (Next.js intercepting-routes behavior).
  - **Prev/next inside the viewer uses `router.replace`**, so ten arrow presses do not create ten history entries (PhotoSwipe: one entry on open, URL updated per slide, original URL restored on close).
  - **Close (×, Esc, backdrop):** if the viewer was opened by soft navigation, call `router.back()`. If it was landed on directly, `router.push('/photos')`. Never use `history.back()` blindly, because it can leave the site.
- **Surface:** a gallery-black stage. The photo is fitted with `object-fit: contain` and never cropped. No white panel (current `bg-white dark:bg-gray-900` is removed).
- **Keyboard:** ←/→ prev/next (wrapping at the ends is acceptable, but the counter must make it obvious). Esc closes in layers: first an open callout, then zoom, then the viewer; the existing modal already layers zoom, so extend that. `I` (or a visible button) toggles the info/EXIF strip, `H` toggles annotation markers. Shortcuts are listed in a visible "?" hint. Arrows are ignored while focus is in a text field.
- **Focus:** use native `<dialog>` with `showModal()`. On open, focus moves to the dialog heading or close button. Tab stays inside. On close, focus returns to the originating thumbnail or waypoint.
- **Screen reader:** the dialog is labelled by the photo title. A polite live region announces "Photo 2 of 4: <title>" on prev/next. The image `alt` stays meaningful; current alts are fine but should mention the subject, not "Stunning…".
- **Touch:** horizontal swipe for prev/next, swipe down to close (with a movement threshold, `drag-threshold`), pinch-zoom allowed. Visible buttons exist for every gesture (`gesture-alternative`, WCAG 2.5.7).
- **Zoom:** click or `Z` toggles fit ↔ 1:1, which is meaningful for 2400 px sources on large screens. Panning while zoomed works by drag *and* arrow keys, or zoom is fit/fill only. Disabled under reduced motion is not required; just make it instant.
- **Performance:** preload the next and previous images. Use a blur placeholder while loading. The image shows `alt` text and a "Couldn't load this photo · Retry" state on error, and the EXIF strip still renders.
- **EXIF strip** (from the build-time pipeline): camera, lens, focal length, aperture, shutter, ISO, capture date and local time (Europe/Zurich, from EXIF `DateTimeOriginal`), altitude, coordinates (WGS84 plus optional Swiss LV95), and "© <year> Tim Lui". Values use `tabular-nums`. Coordinates are selectable or copyable. Missing fields are omitted, never shown as "undefined" or "—". The R004 photo will have gaps. "Show on map" links to `/photos?view=map#<slug>`.
- **Hotspot callouts** (9 annotations, `ImageAnnotation.position` 0–100 %):
  - Markers are `<button>`s in reading order (top-left → bottom-right) with an accessible name ("Matterhorn Peak, 4,478 m"). Enter/Space opens a callout, Esc closes it, and focus returns to the marker.
  - On large screens the callout sits outside the photo bounds or on the margin, joined by a **leader line**, so the photo is never covered by panels.
  - **Below about 768 px**, callouts with leader lines do not fit. Show numbered markers on the image and a numbered list under it (like a map legend). Tapping a marker scrolls to and highlights the list item.
  - **"Clean view" toggle** hides all markers. Photographers and viewers want the unannotated photo; remember the choice in `localStorage`.
  - Hotspot data with icons (`peak`, `glacier`…) uses the same glyph set as the footer legend.
- **Share** (G13) and **"Ask about this photo"** (G12) sit in the strip.
- **View Transition:** the thumbnail morphs into the lightbox image (shared name `photo-<slug>`). Under reduced motion `::view-transition-*` animation-duration is 0. Unsupported browsers simply swap. The morph only plays if the destination renders in the same commit (prefetched). Browser Back carries no transition type, so only the morph (not a directional slide) replays (Next 16.4 guide). React version gate: G6.

| Type | Feature | Why | Cx | Depends on |
|------|---------|-----|----|-----------|
| Table stakes | `/photos/[slug]` full page + intercepted modal; Back closes | Universal in photo sites (Unsplash, Flickr, PhotoSwipe history) | M | Route restructure, `generateMetadata`, `slug` field |
| Table stakes | ←/→, Esc layering, swipe, counter, focus trap + return | PhotoSwipe conventions; lightbox a11y guides | M | Replaces `ImageDetailModal.tsx` |
| Table stakes | EXIF strip from real data with graceful gaps | Plan intent; photographers expect it | M | EXIF pipeline (G7) |
| Table stakes | Gallery-black stage, never cropped | Locked decision | S | Tokens v2 |
| Table stakes | Preload neighbors, blur-up, error + retry | `progressive-loading`, `error-recovery` | S | Existing `ProgressiveImage.tsx` / `ZoomableImage.tsx` |
| Table stakes | Per-photo OG image + title/description | Shared photo links must preview the photo | S | SEO category |
| Differentiator | Hotspots as map callouts with leader lines; legend fallback on mobile | Signature "survey" detail | M | `InteractiveHotspot.tsx` rewrite |
| Differentiator | Coordinates in WGS84 + LV95, "Show on map" | Swiss-survey authenticity | S | EXIF pipeline (convert at build) |
| Differentiator | Thumbnail → lightbox View Transition | Spatial continuity (`shared-element-transition`) | S–M | G6 version decision |
| Differentiator | Share button (Web Share / copy link) | Low cost, expected on mobile | S | — |
| Anti-feature | Right-click / drag-save blocking, watermarks over the image | Breaks a11y (context menu, "Copy image" for assistive use), does not stop anyone, degrades the photo | — | Size cap + © line |
| Anti-feature | Full-resolution download button | Originals are 12480 px / 50–80 MB and unlicensed | — | "Ask about this photo" → contact |
| Anti-feature | A new history entry per photo step | Back becomes a slideshow rewind | — | `router.replace` |
| Anti-feature | Annotations permanently overlaid | Covers the work | — | Clean-view toggle |
| Anti-feature | Lightbox library (PhotoSwipe, yet-another-react-lightbox) | Locked bespoke design + hotspots + EXIF strip; native `<dialog>` covers focus/inert | — | Native `<dialog>` + small gesture hook |

### PROJ: Project route panels (projects index)

**Expected behavior (testable)**
- Two full-width panels in `featured`/data order. Each panel is **one link target**, its project name as the link text, using the block-link pattern with secondary links (GitHub/Docs) as separate focusable elements, not nested inside the main link.
- Each panel shows name, tagline, status and version (status as text, not a color-only pill), 2–3 headline metrics (from typed highlights), the stack summary (top 4 + "+n" disclosure, `chip-collection-reflow`), and a visual (G10).
- "Route" metaphor: a small elevation-profile or pipeline glyph with the route "grade", e.g. the CLI's safety-first framing. It is decorative and `aria-hidden`.
- Hover and focus states are equal. No 3D tilt. Press feedback within 100 ms.
- Empty state: if `projects` is empty, render "No routes surveyed yet" (should not happen, but the template should handle it).

| Type | Feature | Why | Cx | Depends on |
|------|---------|-----|----|-----------|
| Table stakes | Full-width panel, single primary link, visible metadata | Hex cards retired; clip-path broke focus | S | Delete `ProjectCard.tsx` hex variant, `useHexGrid.ts`, `hex-clip` |
| Table stakes | Status/version as text | `color-not-only` | S | `Project.status` |
| Differentiator | Route glyph / elevation profile per project | Visual without screenshots; on-metaphor | S–M | G10 decision |
| Anti-feature | Card grid, filter bar, "featured" sorting UI | Two projects | — | — |
| Anti-feature | Animated GIF/video previews | Weight + motion for two items | — | Static visual |

### CASE: Case-study detail page (`/projects/[slug]`)

**Expected behavior (testable)**
- Fixed section order (locked): problem → 4-stage pipeline → safety (risk bands) → instrument-panel metrics → terminal demo → grouped stack → next steps. Each section is an `<h2>` with an `id` anchor (`#safety`), so sections are deep-linkable and shareable.
- **Trailhead block** at the top: name, one-line outcome, role/time frame, status + version, and primary links (GitHub, Docs, live site) as real buttons.
- **On-page route index** (table of contents). On desktop, a sticky side list with scroll-spy (`aria-current="location"`). On mobile, a collapsed "Route stages" disclosure. It must not obscure focus.
- **4-stage pipeline diagram** (intent analysis → context enrichment → prompt optimization → response parsing) as semantic HTML/SVG: an `<ol>` with the diagram visuals, readable without the graphic. No image-of-text.
- **Instrument-panel metrics:** each metric has a value, a unit, a label and a **context line** (e.g. "~90 ms startup · measured v2.4.0"). The data has claims like "95% accuracy" and "40% faster" that need a baseline or source, or should be softened. Values render final immediately, with no count-up.
- **Grouped stack:** groups such as Core / LLM providers / Storage / Tooling. CLI_X `techStack` is a flat list today, so this needs the planned typed highlight schema.
- **Next steps:** the related roadmap items (already linked via `Project.roadmapItems`) are shown as compact route-log rows with a "Full route log →" link to `/roadmap?area=cli`.
- **End of page:** a "Next route" link to the other project and a contact CTA.
- The `clix-website` case study must also work with the template even though it has no risk bands or terminal demo. **Sections are optional by data**: no empty headings, no "N/A".
- Unknown slug renders the designed 404 with "No route named '<slug>'".

| Type | Feature | Why | Cx | Depends on |
|------|---------|-----|----|-----------|
| Table stakes | `generateMetadata` + OG image per project; section anchors | Case studies are the most-shared URL for an engineer; currently untitled | S | SEO category |
| Table stakes | Trailhead links + status; next-route + contact CTAs | Recruiters scan for repo/live links first | S | `Project.links` |
| Table stakes | Data-optional sections | Two different project shapes | M | Typed highlight schemas (data phase) |
| Table stakes | Accessible pipeline diagram (`<ol>` semantics) | `data-table`/`screen-reader-summary` analogue | M | — |
| Differentiator | Instrument-panel metrics with context lines | Credibility; "real data" ethos | M | Typed highlights |
| Differentiator | Route index with scroll-spy | Long-form navigation | S | — |
| Differentiator | Roadmap rows embedded as "Next steps" | Connects case study → route log | S | ROUTE row component |
| Anti-feature | Count-up / odometer metric animations | Screen readers read intermediate values; `excessive-motion` | — | Static values |
| Anti-feature | Dumping all 14 `features` as a bullet wall | Low signal | — | Top 5 + "All features" disclosure |
| Anti-feature | Pricing tiers table on the portfolio | Sales content for another site | — | Link to cli-x.com |

### RISK: Trail-grade risk visualization (CLI_X safety)

Mapping (locked, and consistent with SAC hiking-scale signage): **Low 0.0–0.3 → T1 yellow** · **Medium 0.3–0.6 → T2–T3 white-red-white** · **High 0.6–0.8 → T4–T5 white-blue-white** · **Critical 0.8–1.0 → unmarked**. SAC T6 is "mostly unmarked", so "unmarked = you're off any marked trail" is an honest metaphor for Critical.

**Expected behavior (testable)**
- **Scale view:** a horizontal 0.0–1.0 bar split into four bands at 0.3 / 0.6 / 0.8 (a bullet-chart style, per ui-ux-pro-max chart "Performance vs Target"). Each band carries its **marker glyph + text label + range** ("T2–T3 · Medium · 0.3–0.6"). It reads without color, because the stripes are a pattern and every band has a label (`pattern-texture`, `color-not-only`).
- **Unmarked band:** a dashed outline or empty band with an explicit label. It must not look "missing" or broken.
- **Demo commands** are plotted as ticks at their `riskScore` (G9). Focus or hover on a tick shows the command, score and explanation. Ticks are keyboard-focusable and give the same detail on focus as on hover (`tooltip-keyboard`). A visible data table equivalent is available (command · score · grade · what CLI_X does).
- **What happens at each grade** (needs content): e.g. T1 runs, T2–T3 runs with a warning, T4–T5 requires explicit confirmation, unmarked is blocked or needs override. This turns the visual into an explanation of the 11 safety rules.
- The **same marker glyphs** are reused in the terminal demo badges (replacing `riskColors` in `HologramTerminalDemo.tsx`) and in the footer legend.
- Contrast: marker strokes are ≥ 3:1 against the dark surface, and labels are ≥ 4.5:1. The yellow T1 marker must stay distinguishable from any yellow nav accent (see SHELL anti-feature).
- Reduced motion: no animated fill or sweep; static from first paint.

| Type | Feature | Why | Cx | Depends on |
|------|---------|-----|----|-----------|
| Table stakes | Labeled bands with glyph + range; not color-only | WCAG 1.4.1; chart a11y guidance | S | Marker SVG set (tokens) |
| Table stakes | Table equivalent of plotted commands | ui-ux-pro-max `data-table` | S | G9 data |
| Differentiator | Commands plotted by score; per-grade behavior explained | Turns the metaphor into a real explanation | M | `riskScore`, medium/critical examples |
| Differentiator | Marker glyphs reused across terminal, footer legend, case study | One visual language | S | SHELL footer, terminal restyle |
| Anti-feature | Red/yellow/green traffic-light gauge | Generic; conflicts with locked metaphor; color-only | — | Trail markers |
| Anti-feature | Animated needle gauge | Motion without meaning | — | Static scale |

### TERM: Terminal demo (restyled, inside CASE)

**Expected behavior (testable)**
- Restyled to tokens (mono font, gallery-dark surface). Retires the "hologram" particle field (`HologramTerminal.tsx` `ParticleField`).
- **Controls:** Play/Pause (`aria-pressed`), previous/next command, and an "n / 4" counter. Autoplay pauses on focus-within and hover, when offscreen, and when the tab is hidden.
- **Reduced motion:** no typing animation; the full transcript of all commands is shown statically with grade badges.
- **Screen readers:** the typing region is `aria-hidden` while animating, and a polite live region announces only the completed command ("Input: … Output: … Grade T1, Low").
- Commands are selectable text. A copy button is optional; if present, it announces "Copied".

| Type | Feature | Why | Cx | Depends on |
|------|---------|-----|----|-----------|
| Table stakes | Pause/step controls; static transcript under reduced motion | `auto-rotation-controls` | S | `HologramTerminalDemo.tsx` |
| Table stakes | Risk badges use trail markers | Consistency | S | RISK |
| Anti-feature | Real in-browser command execution / LLM call | Security, cost, CSP; out of scope | — | Scripted demo |

### ROUTE: Route-log roadmap

**Expected behavior (testable)**
- **Vertical elevation axis with three bands:** Summit / planned (top), Current camp / in-progress (middle, emphasized), Base / completed (bottom). Counts today: 10 planned / 2 in-progress / 3 completed.
- **DOM order equals visual order** (planned → in-progress → completed, top to bottom) for WCAG 1.3.2 and 2.4.3. Right below the `<h1>` sits a **camp summary** ("Current camp: 2 in progress · 3 completed · 10 planned") with jump links to each band. The page does *not* auto-scroll to the camp on load (`back-stack-integrity`, surprise motion).
- **Compact rows:** title, area tag (text), target release, and priority (text or glyph, not color-only). The description sits in a disclosure (`<details>` or `aria-expanded`), following progressive disclosure.
- **Segmented area filter:** All / Portfolio / CLI_X / Website. "Other" is removed or shows "(0)" disabled (G11). The status filter is redundant with bands, so drop it or make it band jump links. The filter state is in `?area=` (via `router.replace`). The result count is announced politely ("Showing 7 of 15 entries").
- **Empty state** for a filter with 0 results: "No entries on this route yet" plus a "Show all" button. The existing page has a basic version (`app/roadmap/page.tsx:120-150`); restyle and keep it.
- **Freshness:** a "Last surveyed: <date>" stamp from data (G11).
- Rows linked from a case study (`Project.roadmapItems`) are reachable via `#<item-id>` anchors.
- **Reduced motion:** no stagger-in. With motion allowed, any stagger is 30–50 ms per row, once.

| Type | Feature | Why | Cx | Depends on |
|------|---------|-----|----|-----------|
| Table stakes | Bands by status with visible labels + counts | Locked layout; scannability | M | `RoadmapTimeline.tsx`, `RoadmapProgress.tsx` rewrite |
| Table stakes | Segmented filter in URL, live count, empty state | `deep-linking`, `contextual-live-badge-updates` | S | `RoadmapFilters.tsx` (remove emoji icons, per `no-emoji-icons`) |
| Table stakes | Row anchors for cross-links | CASE "next steps" | S | — |
| Differentiator | Elevation axis with "current camp" marker | Metaphor carries status meaning | M | Ordering fields (G11) |
| Differentiator | "Last surveyed" stamp; v2.0 itself listed in progress | Honesty / dogfooding | S | Data edit |
| Anti-feature | Gantt chart / quarter calendar | No dates; false precision | — | Status bands |
| Anti-feature | Percent-complete bars per item | No real data behind them | — | Status only |
| Anti-feature | Voting/upvotes on roadmap items | Needs DB + moderation (out of scope) | — | Contact link |

### CONTACT: Summit register (Gipfelbuch) contact

**Expected behavior (testable)**
- Dark form with **visible labels** (no placeholder-only), required markers, `autocomplete="name"`/`"email"`, `type="email"`, and inputs at least 44 px high. These are the existing fields (name, email, message, collaboration checkbox). `zod` limits are reflected in the UI (message 10–2000 chars, with a counter announced politely near the limit).
- **Validation on blur**, not per keystroke. The error sits below the field via `aria-describedby` (already done in `FeedbackForm.tsx`) and states the cause and fix ("Message needs at least 10 characters (currently 6)").
- **Submit:** the button is disabled and shows a loading state. On failure with several errors, focus goes to an **error summary** at the top with links to fields, and inline errors stay (ui-ux-pro-max `error-summary`, `focus-management`).
- **Success:** the form is replaced by a "Register signed" confirmation that includes date, time and summit coordinates (45.9763 N, 7.6586 E), in a `role="status"` region with focus moved to it, plus a "Sign again" action.
- **Server errors:** 429 says "Too many entries from this connection. Try again in N minutes" (use `Retry-After`). 403 (CSRF/origin) says "Couldn't verify the request. Reload and try again". 5xx or network says "Couldn't send. Your message is still here" with Retry. **Input is never lost.**
- **Real email as selectable text** (not an image, not obfuscated beyond what is necessary), plus a copy button with "Copied" announced and a `mailto:` link. Social links (GitHub, LinkedIn) are repeated here.
- **Context:** a reply-time expectation ("Usually replies within a few days") and the `?ref=<photo-slug>` prefill from "Ask about this photo" (G12), shown as an editable "Re: <photo title>" line.
- **Spam:** add a honeypot field (visually hidden, `tabindex="-1"`, `autocomplete="off"`) in addition to the existing CSRF + Upstash rate limit. It is cheap and invisible to users.
- Contrast fix (Contact h1 `text-gray-900` on dark) is covered by tokens v2.

| Type | Feature | Why | Cx | Depends on |
|------|---------|-----|----|-----------|
| Table stakes | Visible labels, blur validation, error summary, loading/success/error states, input preserved | ui-ux-pro-max forms rules | M | `FeedbackForm.tsx` restyle; `/api/feedback` responses must carry machine-readable error codes |
| Table stakes | Real selectable email + copy + mailto | Many visitors prefer their own mail client | S | SHELL identity |
| Table stakes | Specific 429/403/5xx messages with retry | `error-recovery`, `timeout-feedback` | S | `app/api/feedback/route.ts` |
| Differentiator | "Register signed" confirmation with timestamp + coordinates | Metaphor rewards completion | S | — |
| Differentiator | Photo-reference prefill (`?ref=`) | Connects photography to inquiries | S | LIGHTBOX |
| Differentiator | Honeypot | Less spam, no friction | S | API schema |
| Anti-feature | Public guestbook showing other visitors' entries | Tempting for the "Gipfelbuch" metaphor, but needs DB, moderation and privacy handling (out of scope) | — | Private form only |
| Anti-feature | CAPTCHA | Friction + third-party script vs strict CSP | — | Honeypot + rate limit |
| Anti-feature | Multi-step form / subject dropdown taxonomy | 3 fields don't need it | — | Single step |

### EDGE: 404 / offline / error

**Expected behavior (testable)**
- **404 "You've left the marked trail":** a static contour SVG (no WebGL, no heavy assets) and a plain-language `<h1>` (e.g. "Page not found. You've left the marked trail"). The `<h1>` names what happened; the metaphor is secondary. It offers a route home plus links to Photographs, Engineering and Contact. It returns HTTP 404 (Next `not-found` does). Slug-specific variants: "No photo called '<slug>'", "No route named '<slug>'".
- **Error (`error.tsx`):** same visual. "Something went wrong on this section" with a **Retry** button (`reset()`), a home link, and a "Report it" link to `/contact?ref=error`. No stack traces. Focus moves to the `<h1>`.
- **`global-error.tsx`** (missing, G14): self-contained, with its own `<html>/<body>` and inline styles, since the root layout failed.
- **Offline (`/offline`, served by the SW):** fully self-contained. Inline SVG and precached same-origin fonts, so it never shows a broken font fallback. "You're offline" with a list of **pages available offline** (from the SW cache), a "Try again" button, and an automatic reload on the `online` event.
- **Redirects** for deleted playground routes (G8).
- Reduced motion: the contour map stays static. With motion allowed, at most a slow contour drift that pauses offscreen.

| Type | Feature | Why | Cx | Depends on |
|------|---------|-----|----|-----------|
| Table stakes | Designed 404 with plain-language h1 + route links | Edge pages currently off-brand | S | Contour SVG asset (DEM pipeline) |
| Table stakes | `error.tsx` with retry + `global-error.tsx` | `error-recovery` | S | — |
| Table stakes | Self-contained offline page with retry/auto-reload | `offline-support` | S | `public/service-worker.js` precache list |
| Table stakes | Redirects for removed routes | Inbound links | S | `next.config` |
| Differentiator | Offline page lists cached pages | Helpful, cheap | S | SW cache API |
| Anti-feature | Mini-game / easter egg on 404 | Distracts; weight | — | Route home |

### SEO: Metadata, social previews, structured data (cross-cutting, new category)

**Expected behavior (testable)**
- `metadataBase` set to the production origin. Title template `"%s · Tim Lui"`. Unique titles and descriptions per route ("Matterhorn Mirror Reflection · Photographs · Tim Lui").
- **OG/Twitter images:**
  - Default: a contour Matterhorn with "Tim Lui".
  - **Per photo:** the photo itself at 1200×630 with a small caption band (title · altitude). The photo stays uncropped in meaning; letterbox if needed.
  - **Per project:** a route-panel style card. Use `opengraph-image.tsx` (ImageResponse) or images generated at build time. Fonts must be same-origin (CSP/asset constraint). `twitter:card = summary_large_image`.
- `sitemap.ts` (home, photos, each `/photos/[slug]`, projects, each `/projects/[slug]`, roadmap, contact) and `robots.ts`.
- **JSON-LD:**
  - `Person` (name, url, sameAs GitHub/LinkedIn, jobTitle).
  - Per photo: `Photograph`/`ImageObject` (creator, dateCreated, contentLocation `Place` with `GeoCoordinates` + elevation, copyrightHolder, license page).
  - Per project: `SoftwareSourceCode`/`SoftwareApplication` (codeRepository, programmingLanguage).
  - `BreadcrumbList` on detail pages.
- **Canonical URLs:** a photo has one canonical URL, `/photos/<slug>`, whether rendered as modal or page.
- One `<h1>` per page, sequential headings (the audit found every h1 is mono with a glow; tokens v2 fixes the styling).

| Type | Feature | Why | Cx | Depends on |
|------|---------|-----|----|-----------|
| Table stakes | Per-route titles/descriptions, metadataBase, canonical | Currently all pages share one title (G2) | S | Routes exist |
| Table stakes | OG images default + per photo + per project | Shared links are the main traffic source for portfolios | M | `/photos/[slug]`, tokens/fonts |
| Table stakes | sitemap + robots | Basic discoverability | S | Route list |
| Differentiator | JSON-LD with geo + EXIF-derived dates | Rich results; fits "real data" | S | EXIF pipeline |

### MOTION/A11Y: Cross-cutting behaviors (applies to every category)

- **Reduced motion** is a reactive preference. Each animated element has a defined *final static state* (storytelling rule). View Transitions get zero duration. WebGL renders a single frame or the poster.
- **Hover is never required.** Every hover reveal has a focus equivalent and a tap equivalent.
- **Targets** are at least 24×24 CSS px (WCAG 2.2 AA), aiming for 44. Small glyphs (waypoints, hotspot markers, ticks) get expanded hit areas.
- **Every drag or swipe** (carousel, lightbox swipe, zoom pan) has a button or keyboard alternative (WCAG 2.5.7).
- **Back/forward** restores scroll position, view (`?view`), filter (`?area`) and open lightbox state. Verify with Playwright tests that navigate away and back.
- **Long-running animations** (terrain, terminal, carousel) pause offscreen and when the tab is hidden.

---

## 2. Feature Dependencies

```
[EXIF pipeline: typed photo data (slug, w/h, GPS, alt, EXIF), committed — G7]
    ├──requires──> [Reconciled photo copy/dates — G15]
    ├──enables──> [Grid true-aspect tiles] ──enables──> [Thumbnail→lightbox View Transition] ──requires──> [React 19.3 or native startViewTransition — G6]
    ├──enables──> [EXIF strip] 
    ├──enables──> [Map view waypoints] ──requires──> [DEM contour SVG] + [label offsets] + [unlocated rule — G5]
    └──enables──> [Home waypoints + altimeter rail] ──requires──> [DEM heightmap + contour shader]

[/photos/[slug] route + @modal interception — G1]
    ├──requires──> [slug field in photo data]
    ├──enables──> [Back closes lightbox] [Share] [Per-photo OG image] [Photograph JSON-LD] [sitemap entries]
    └──enables──> [Contact ?ref= prefill — G12]

[Native <dialog> lightbox] ──requires──> [scrollbar-gutter: stable — G4] (visible scrollbar locked)

[Trail-marker SVG glyph set (tokens)]
    ├──used by──> [RISK scale] ──requires──> [riskScore + medium/critical demo commands — G9]
    ├──used by──> [Terminal demo badges]
    └──used by──> [Footer legend]

[Typed project highlight schemas] ──enables──> [Instrument-panel metrics] [Grouped stack] [Data-optional case-study sections]

[Roadmap data fields (completedAt/order/lastSurveyed) — G11] ──enables──> [Route-log elevation axis] ──enables──> [Case-study "Next steps" rows + anchors]

[Single SiteNav + (site) layout] ──enables──> [focus-on-route-change] ──requires──> [Unique per-route titles — G2]

[DEM pipeline contour SVG] ──reused by──> [404 / error / offline art] [Footer scale bar] [Default OG image]

[Delete playground routes] ──requires──> [Redirects — G8]
[framer-motion 14 upgrade] ──precedes──> [any new Motion-based interaction (lightbox gestures, rail)]
```

### Dependency Notes
- **The EXIF + DEM pipelines come first.** Map view, ascent waypoints, EXIF strip, grid aspect, the 404 art and OG images all consume their output. Building UI on today's `data/landscapes.ts` means building it twice.
- **The photo route restructure (G1) must come before the lightbox redesign.** Deep linking changes where the viewer lives (a modal slot vs a page), and retrofitting it afterwards rewrites the component.
- **The trail-marker glyph set is a shared token asset.** Build it once with the design system and reuse it in RISK, TERM and the footer legend.
- **The React 19.3 decision (G6) blocks only the View Transition polish**, not the lightbox. The lightbox must work fully without the transition.
- **Conflict:** "visible scrollbar" vs `overflow: hidden` scroll lock. It is resolved by `scrollbar-gutter: stable` (G4). Ship both in the same phase.
- **Conflict:** a yellow nav accent vs T1 yellow risk meaning. Keep the yellow accent minimal and let the footer legend disambiguate.

## 3. MVP Definition (for v2.0 launch)

### Launch with (v2.0)
- [ ] SHELL: single nav, identity, skip link, legend footer with © swisstopo, `scrollbar-gutter`
- [ ] Data: EXIF/DEM generated data committed; photo `slug`, `riskScore`, roadmap fields, copy reconciled
- [ ] HOME: ascent with poster fallback, rail-as-nav, routes CTA, reduced-motion final states
- [ ] PHOTO: Grid (default) + Map + Carousel with URL view state and one canonical order
- [ ] LIGHTBOX: `/photos/[slug]` page + intercepted modal, keyboard/swipe/focus/counter, EXIF strip, hotspot callouts with mobile legend fallback, clean-view toggle
- [ ] PROJ + CASE: route panels, case-study template with data-optional sections, anchors, metadata
- [ ] RISK + TERM: labeled trail-marker scale with a table equivalent; terminal with pause/step controls
- [ ] ROUTE: banded route log, URL filter, empty state, last-surveyed stamp
- [ ] CONTACT: summit register with full state model, honeypot, selectable email
- [ ] EDGE: 404 / error / global-error / offline + redirects
- [ ] SEO: titles, OG images (default + photo + project), sitemap, robots

### Add after validation (v2.x)
- [ ] Thumbnail → lightbox View Transition, if the React 19.3 bump is deferred (trigger: React/Next upgrade lands)
- [ ] JSON-LD (Photograph with geo, SoftwareSourceCode)
- [ ] Share button and "Ask about this photo" prefill
- [ ] LV95 coordinates and "Show on map" cross-link
- [ ] Offline page listing cached pages

### Future consideration (v3+)
- [ ] Photo tags/filters (trigger: 20+ photos)
- [ ] Photography blog (roadmap item `portfolio-blog`, MDX)
- [ ] Print/licensing flow (trigger: real demand via `?ref=` inquiries)

## 4. Feature Prioritization Matrix

| Feature | User Value | Cost | Priority |
|---------|-----------|------|----------|
| `/photos/[slug]` deep links + Back closes | HIGH | MEDIUM | P1 |
| Lightbox keyboard/swipe/focus/counter | HIGH | MEDIUM | P1 |
| Per-route metadata + OG images | HIGH | MEDIUM | P1 |
| Single nav + identity + legend footer | HIGH | MEDIUM | P1 |
| Home ascent w/ static fallback | HIGH | HIGH | P1 |
| EXIF strip | MEDIUM | MEDIUM | P1 |
| Grid (justified, in-house) | HIGH | LOW | P1 |
| Map view | MEDIUM | MEDIUM | P1 (locked) |
| Case-study template + anchors | HIGH | MEDIUM | P1 |
| Trail-grade risk scale + table | MEDIUM | LOW | P1 |
| Route log bands + URL filter | MEDIUM | MEDIUM | P1 |
| Summit register states + honeypot | HIGH | LOW | P1 |
| Edge pages + redirects + global-error | MEDIUM | LOW | P1 |
| scrollbar-gutter fix | MEDIUM | LOW | P1 |
| Hotspot callouts w/ leader lines + mobile legend | MEDIUM | MEDIUM | P1 (locked) |
| View Transition morph | MEDIUM | LOW–MEDIUM | P2 (version-gated) |
| Share / Ask-about-photo | MEDIUM | LOW | P2 |
| JSON-LD | LOW | LOW | P2 |
| LV95 coords / Show on map | LOW | LOW | P3 |

## 5. Exemplar / Competitor Feature Analysis

| Feature | Unsplash / Flickr photo pages | PhotoSwipe (lightbox standard) | Next.js nextgram / Frames demo | Scrollytelling (NYT/Pudding-style) | Our approach |
|---------|------------------------------|--------------------------------|-------------------------------|-----------------------------------|--------------|
| Photo URL | Every photo has a URL; modal on soft nav, page on hard load (LOW: from memory) | History entry on open; URL per slide; restored on close | Intercepted `@modal` + full page | n/a | `/photos/[slug]`, modal + page, `replace` on step |
| Keyboard | ←/→, Esc | ←/→, Esc, Space toggles UI | — | Native scroll | ←/→, Esc layering, I/H/Z, "?" hint |
| Touch | Swipe | Horizontal swipe = next, vertical swipe = close | — | Native scroll | Same, plus visible buttons |
| Metadata panel | Camera/EXIF info, location, share | Caption only | — | — | EXIF strip + coords + © + share |
| Grid | Flickr justified rows | — | Uniform grid | — | In-house justified rows, last row not stretched |
| Shared-element transition | No | Zoom-from-thumbnail animation | `<ViewTransition name>` morph | — | View Transition morph, version-gated |
| Story structure | — | — | — | Sticky graphic + steps; each step works as a still; static fallback | Ascent chapters, rail-as-nav, final states under reduced motion |
| Download | Free download (license-specific) | Optional | — | — | None; © line + inquiry link |

## Sources

**ui-ux-pro-max (local skill, `.claude/skills/ui-ux-pro-max`). Queries run for this file:**
- `"image gallery lightbox" --domain ux`: image optimization, scaling, asset weight
- `"modal keyboard focus escape" --domain ux`: focus states; Focus Not Obscured (WCAG 2.2 AA/AAA)
- `"carousel swipe controls" --domain ux`: Auto-Rotating Content Controls (pause/prev/next, stop on focus and reduced motion)
- `"deep linking back state" --domain ux`: Deep Linking, Back Button (pushState), Active State
- `"contact form validation"`, `"error summary validation"`, `"submit loading success" --domain ux`: Submit Feedback, Form Labels, Focusable Error Summary, Error Messages (aria-live), Success Feedback
- `"skip link sticky header" --domain ux`: Skip Links, Sticky Navigation offset
- `"scroll storytelling progress" --domain ux`: Progress Indicators
- `"dragging movements" --domain ux`: WCAG 2.2 single-pointer alternative
- `"filter chips segmented" --domain ux`: Chip Collection Reflow, Compact Label Semantics
- `"timeline milestones"`, `"risk level gauge categorical" --domain chart`: Gauge/Bullet chart (label threshold zones, color insufficient, table fallback, focus = hover)
- `"case study portfolio" --domain landing`: Portfolio Grid (visuals first, neutral background, fast loading)
- `"metadata" --stack nextjs`: metadata API, generateMetadata, OpenGraph images. `"image gallery" --stack nextjs`: next/image, priority for LCP only
- `"webgl fallback reduced motion"`, `"pause render offscreen" --stack threejs`: reactive prefers-reduced-motion, canvas aria-label, pause loop on hidden tab
- Quick Reference rules cited inline (`deep-linking`, `state-preservation`, `focus-on-route-change`, `auto-rotation-controls`, `web-target-size`, `gesture-alternative`, `no-emoji-icons`, `blur-purpose`, etc.)
- Palette/font recommendations from the skill were **not** adopted (locked direction wins)
- `"timeline roadmap" --domain ux` and `"404 error page" --domain ux` returned no on-topic match, so general guidance is used for ROUTE and EDGE

**Official / cross-checked (MEDIUM per classify-confidence seam):**
- Next.js Intercepting Routes (v16.4): https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes
- Next.js "Designing view transitions" guide (v16.4, 2026-09-10; React 19.3 requirement, reduced-motion CSS, Back-button caveat): https://nextjs.org/docs/app/guides/view-transitions
- React Labs, View Transitions: https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more
- Same-document View Transitions Baseline (Firefox 144): https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available
- Chrome, scroll-driven animations: https://developer.chrome.com/docs/css-ui/scroll-driven-animations
- ICS Media, scroll-driven animation support (Safari 26): https://ics.media/en/entry/230718/
- PhotoSwipe docs/repo (keyboard, history, swipe): https://github.com/kertal/PhotoSwipe, https://unpkg.com/photoswipe@4.1.3/website/index.html
- eBay evo lightbox-dialog a11y: https://opensource.ebay.com/evo-web/components/lightbox-dialog/accessibility
- Mesa gallery a11y: https://mesadesignsystem.lanl.gov/components/gallery/accessibility
- Mada accessible carousel guide: https://ictaccess.mada.org.qa/ui-accessible-component/en/carousel.html
- Flickr justified layout: https://code.flickr.net/2015/03/, https://github.com/nk-o/better-justified-layout
- SAC hiking scale / markings: https://wiki.openstreetmap.org/wiki/Key:sac_scale, https://www.bergfreunde.eu/alpine-grades-calculator/, https://www.avegnogordevio.ch/files/Berg-Alpinwanderskala-EN.pdf

**Codebase (HIGH, read directly):** `components/ImageDetailModal.tsx`, `PhotosPageClient.tsx`, `PhotoCarousel3D.tsx`, `InteractiveHotspot.tsx`, `HologramTerminalDemo.tsx`, `RoadmapFilters.tsx`, `FeedbackForm.tsx`, `app/layout.tsx`, `app/projects/[slug]/page.tsx`, `app/api/feedback/route.ts`, `data/*.ts`, `.gitignore`, image dimensions/EXIF via `sharp`, installed `next` 16.1.6 / `react` 19.2.4.

**LOW (from memory, not verified this session):** Unsplash photo-page behavior; NYT/Pudding scrollytelling conventions; Safari `scrollbar-color` support; whether the Next.js App Router moves focus on navigation, as opposed to only announcing the route.

---
*Feature research for: photographer-engineer topographic portfolio (v2.0 Topographic Identity)*
*Researched: 2026-10-10*
