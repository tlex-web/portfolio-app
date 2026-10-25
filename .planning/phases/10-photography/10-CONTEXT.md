# Phase 10: Photography - Context

**Gathered:** 2026-10-25
**Status:** Ready for planning

<domain>
## Phase Boundary

`/photos` becomes a dark light table with three views of Tim's four photographs: Map (the default), Grid and Carousel. Every photo gets its own URL, `/photos/[slug]`. Opened in-site, it shows as a gallery-black lightbox over the gallery; loaded directly, it is a full page. The viewer shows the real EXIF, the story, the hotspot callouts and the rights line.

Requirements: PHOTO-01 … PHOTO-04, LBOX-01 … LBOX-07. Already fixed by the roadmap and earlier phases (not reopened here):
- Routes: `photos/layout.tsx` with `@modal/(.)[slug]`, a mandatory `@modal/default.tsx`, a null `@modal/page.tsx`, and a full `photos/[slug]` page. The URL is the only source of view and lightbox state (`?view=` via `router.replace`). Moving between photos and switching views add no history entries.
- Map is the default view. Rights line: "© {capture year} Tim Lui, all rights reserved". No download button.
- One canonical order, ascending altitude, in every view.
- Justified rows and the lightbox are built in-house, with no layout or lightbox library.
- View Transition names stay unique (the grid thumbnail drops its name while its photo is open), with explicit `::view-transition-*` reduced-motion CSS.
- Photo routes stay Server Components that export metadata (Phase 12 attaches OG images, SEO-02).
- Every remaining image consumer moves to the Phase 8 manifest derivatives, which unblocks deleting the legacy variants in Phase 12.
- `e2e/photos.spec.ts` and `components/__tests__/GalleryGrid.test.tsx` are rewritten, not deleted.
- Home waypoint links (`/photos#<slug>` today) are repointed to `/photos/[slug]`.
- Slugs are locked (08 D-07, approved at 08-10): `matterhorn-from-zermatt`, `gornerschlucht-waterfall`, `matterhorn-glacier-trail`, `riffelsee-reflection`.
- Research spike during planning: `<dialog>` + `showModal()` versus an overlay + `inert` with `<ViewTransition>` (Chromium, Safari 26, Firefox 157); closing on popstate (nothing may depend on the close animation); interception when a photo is opened from Home.

Out of this phase: Share, "Ask about this photo", tag filters and LV95 display (PHOTO-F1 … F4, v2.x); OG images (Phase 12); deleting legacy variants (Phase 12).

</domain>

<decisions>
## Implementation Decisions

### Map view
- **D-01: The map is the full sheet.** It is the same 11 km extent as Home's poster and the footer (08 D-14): the night-tinted hillshade with contours (as in Home's static mode, 09 D-17), with the summit as a landmark near the west edge. The summit marker ("Matterhorn 4,478 m", the official height) is not a link. No pan, no zoom, no tiles. It reuses the Phase 8 terrain assets (`data/generated/terrain.ts`: hillshade AVIF/WebP, `contours-hero` SVG). The photos sit in the east half, so the Zermatt and Gornerschlucht pins are about 800 m apart.
- **D-02: Waypoint labels are always shown**, like names on a survey map (ui-ux-pro-max `direct-labeling`). Each label is the title plus the DEM altitude in mono. The Riffelsee pin is dashed and labelled "approx.", matching the footer tick (08 D-02, DATA-04). Where labels would collide (Zermatt and the gorge), they are offset with thin leader lines. Label positions are deterministic per breakpoint (computed at build time or by a pure layout function), so tests can assert that no two labels overlap.
- **D-03: A pin and its label form one link to `/photos/[slug]`, which opens the lightbox straight away** (an intercepted soft navigation). Hover or focus may also show a small thumbnail preview, but nothing depends on it (`hover-vs-tap`). The links are in ascending-altitude DOM order, the map has an accessible name, and focus returns to the pin that opened the lightbox (LBOX-03). Map pins have no image, so opening from the map plays a plain enter, not a morph (research ARCHITECTURE §2).
- **D-04: On narrow screens the labels are the touch targets.** Each label row is at least 44 px tall and sits in its own clear slot around the cluster, with a leader line to a small dot. The label and its dot form one link. There is no separate waypoint list. The map stays one full-width sheet at every breakpoint.

### Lightbox layout
- **D-05: Photo stage plus a bottom strip.** The photo gets the largest box that fits above the strip (`object-fit: contain`, never cropped) on a neutral gallery-black surface (the map palette never tints the photo). The strip holds, in order:
  - the title (the dialog's label)
  - place · capture date and local time (Europe/Zurich; the film scan shows "2019")
  - the one-line story from `data/photos/editorial.ts`
  - the EXIF row in mono with tabular figures (camera, lens, focal length, aperture, shutter, ISO)
  - the DEM altitude and the 4-dp WGS84 coordinates
  - the © line
  
  The chrome has a close ×, ‹ › buttons and an "n / 4" counter. On wide screens, the side gutters left beside the 3:2 photo hold the hotspot callouts (D-09). It reads like a map-sheet margin.
- **D-06: Zoom toggles between fit and 1:1** of the 2560 px derivative (08 D-13), about 1.8× on a 1440 px screen. It keeps the existing modal's zoom feature, without regressing it. Click on the photo, Z or a visible button toggles it. While zoomed, drag pans and the arrow keys pan; otherwise the arrows and swipe move to the previous or next photo. Esc unwinds in layers: an open callout, then zoom, then the viewer. Hotspots hide while zoomed, as they do today. Native pinch-zoom on touch is never blocked. The zoom change is instant under reduced motion.
- **D-07: Missing fields are left out, never shown as filler.** The film scan (`exif: null`, year-only capture) shows "Film scan · 2019" in place of camera, lens and exposure, then the DEM altitude and "≈ 45.9837 N 7.7623 E · ±100 m (approx.)" from `position.radiusM`. No "—", "unknown" or "undefined" anywhere. The same rule covers the 08 review cases (for example a missing GPS altitude, WR-02). No new data is needed from Tim.
- **D-08: A directly loaded `/photos/[slug]` page is the same viewer inside the site shell.** It renders under `SiteNav`, with `SiteFooter` below, the same strip, a "← All photographs" link, and previous/next through `router.replace`. Close or Esc goes to `/photos`; it never calls a blind `history.back()`. Clicks from Home waypoints land on this full page: a waypoint is a destination, not an overlay (research ARCHITECTURE §2). The interception spike confirms that Home → `/photos/[slug]` does not open the modal, or the plan makes sure it doesn't.

### Hotspot callouts
- **D-09: Map-style labels, with details on demand.** Where the side gutters have room, each hotspot shows a short label in the gutter: its title plus the height in mono. The height comes from the annotation's elevation reference: the photo's DEM height, or the official 4,478 m summit. A leader line joins the label to a small marker on the photo, like peak labels on a panorama. The label is a button (`aria-expanded`). Enter or tap expands its description and sourced facts (with links); Esc collapses it and returns focus to the label. Panels never cover the photo. Markers and labels follow reading order (top-left → bottom-right). Today each photo has one or two annotations (six in total); the layout must still handle more without overlaps.
- **D-10: Hotspots are on by default.** A visible "Hide labels" toggle (`aria-pressed`, shortcut H) shows the clean photo. The choice is remembered per visitor in `localStorage` (every read and write wrapped in try/catch; without storage it falls back to on) and applies to every photo and visit.
- **D-11: On narrow screens, numbered dots plus an inline key.** Where there is no gutter (below about 768 px, exact breakpoint in the UI-SPEC), the photo shows small numbered dots with 44 px hit areas. The strip holds a numbered key ("① Matterhorn summit · 4,478 m"). Tapping a dot or a key row expands that row in place (description plus sources) and highlights its dot. No sheet or overlay is drawn over the photo.

### Carousel, switcher & grid
- **D-12: The carousel never advances on its own.** That meets PHOTO-04 outright: no timer, so no pause control. Controls: visible, labelled ‹ › buttons, an "n / 4" counter, the existing arrow keys, and an "Open photo" button for the front frame (clicking the front frame opens it too). The idle float stops under reduced motion and when the canvas is offscreen or the tab is hidden. Opening from the carousel plays a plain enter: a canvas frame can't share a View Transition. The restyle uses tokens: it removes the inline Three.js hex (`components/PhotoCarousel3D.tsx` L75, L215, L264-268 fog) and the v1 alias `text-snow-200` (L183), and the loading state becomes a token skeleton.
- **D-13: The flat-stepper fallback uses the same capability gate as Home** (`lib/useAscentMode.ts`: reduced motion, Save-Data, no WebGL2, `deviceMemory < 4`, a lost or failed context). The stepper shows one photo at its true aspect ratio with the same ‹ ›, counter and "Open photo". When the gate says static, three.js is never loaded on `/photos`. If the gate needs extracting from Home-specific code, that is the planner's call.
- **D-14: The top of `/photos` is a compact header band.** It holds a mono kicker derived from data (e.g. "4 waypoints · 1,617–2,760 m · Zermatt", with the count and range from `data/generated/photos.ts`), the h1 "Photographs" (matching Home's "Photographs" trail sign), and, on the same row, a segmented Map · Grid · Carousel control (text plus icon, `aria-pressed` or radiogroup semantics, `router.replace(..., { scroll: false })`). It is not sticky and has no prose, so there is no copy checkpoint. The "Landscape Gallery" hero and its "stunning" copy are removed.
- **D-15: Grid tiles have always-visible slide-mount captions.** Each caption is the title, then a mono line: place · DEM altitude · month and year (the film scan shows "2019" and "approx."). There is no hover overlay and no hotspot-count badge, because annotations belong to the lightbox. This removes the "1 hotspots" plural bug (`components/GalleryGrid.tsx:60`). The `GalleryGrid.test.tsx` assertion on '1 hotspots' is rewritten into a caption assertion, not deleted. The tiles are links to `/photos/[slug]`, built from manifest derivatives with reserved `aspect-ratio`.

### Claude's Discretion
- Whether previous and next wrap at the ends; if they wrap, the counter must make it obvious.
- Swipe-down to close, the keyboard-shortcut hint (e.g. a visible "?"), and a polite live region ("Photo 2 of 4: <title>").
- The crossfade when switching views (e.g. `<ViewTransition key={view}>` per research ARCHITECTURE §2; no page-level `AnimatePresence` alongside route VTs).
- The design of the thumbnail preview on map pins, and the summit marker style.
- The label-layout method for map labels and hotspot gutter labels (a build-time table or a pure function), as long as the result is deterministic and testable.
- Whether "Hide labels" on narrow screens hides only the dots or the key too. The default: it hides everything drawn on or around the photo (dots, markers, leader lines, gutter labels), and the text key in the strip stays.
- Hotspot glyphs: reuse the footer legend's glyph set where one fits.
- `<dialog>` versus overlay + `inert`: decided by the roadmap spike, not here.
- Preloading the neighbouring photos, the blur-up placeholder, and the "Couldn't load this photo · Retry" state (the strip still renders).
- Where the Phase 8 review warnings (WR-01 … WR-08, IN-02) and the other carry-overs below land in the plan.

### For the UI-SPEC (not decided here)
- Typography and spacing of the strip and the EXIF row, and the breakpoints where the strip stacks and where the gutter callouts switch to the numbered key.
- The exact kicker wording and segmented-control styling (07-UI-SPEC's single-primary-action rule applies).
- The style of map labels, leader lines and pins (lit and approx. states), consistent with 08-UI-SPEC's dashed approx. tick and the `contour` token.
- The zoom button, toggle and counter icons (Phosphor from `dist/ssr`), and the stepper layout.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 10: Photography": goal, success criteria, scope notes (the locked list in `<domain>`), research spike, "Inputs from Tim: None"
- `.planning/REQUIREMENTS.md`: PHOTO-01 … PHOTO-04, LBOX-01 … LBOX-07; VERIFY-02 (the keyboard-only pass through map and lightbox, Phase 12) and PHOTO-F1 … F4 (deferred)
- `.planning/PROJECT.md` §Constraints (dark-only, same-origin assets, nonce CSP, photo rights, location privacy, ui-ux-pro-max for all UI work) and §Key Decisions (gallery-black viewer, Map default, coordinates shown at 4 dp, all rights reserved, photo deep links + full lightbox)

### Prior phase decisions
- `.planning/phases/08-data-terrain-pipeline/08-CONTEXT.md`: D-02 (approx. Riffelsee pin), D-03 (film scan year only), D-07 (slugs, one-way once shipped), D-13 (2560 px largest served image), D-14 (11 km extent), D-17 (DEM heights, official 4,478 m summit)
- `.planning/phases/09-home-ascent/09-CONTEXT.md`: D-07 (manifest derivatives, never legacy variants), D-10 (place + date line format), D-17 (night tint of the hillshade), D-18 / D-21 (capability gate and static mode), Claude's Discretion on the `/photos#<slug>` interim link
- `.planning/phases/08-data-terrain-pipeline/08-REVIEW-DISPOSITION.md`: 8 open warnings to fold into the first Phase 10 plan that touches photo data or surfaces
- `.planning/phases/09-home-ascent/deferred-items.md`: includes the parallel-run photos 3D carousel e2e flake
- `.planning/phases/07-foundation-guardrails/07-UI-SPEC.md`: tokens v2, type roles (mono for data, tabular figures), motion rules, single primary action (the "scrollbar doesn't shift the page when a modal opens" rule is Phase 7 success criterion 3, checked by the G3 test below)
- `.planning/phases/08-data-terrain-pipeline/08-UI-SPEC.md`: dashed approx. tick, contour token, footer legend glyphs
- `.planning/phases/09-home-ascent/09-UI-SPEC.md`: night-tinted poster treatment, pin and label styling, trail-sign "Photographs" wording

### Research (milestone)
- `.planning/research/ARCHITECTURE.md` §2 (lightbox routing: intercept + parallel routes, `default.tsx`/null `page.tsx`, overlay + `inert` vs `<dialog>`, focus restore via `[data-photo-id]`, `router.replace` for prev/next, View Transition name uniqueness, popstate caveat), §7 (motion tokens for CSS and Motion), "Request flow (photo lightbox, soft navigation)"
- `.planning/research/FEATURES.md` §"PHOTO" (map, justified rows, carousel) and §"LIGHTBOX" (keyboard, focus, touch, zoom, EXIF strip, hotspots, View Transition, anti-features). D-14 overrides its "Grid default"; D-15 drops its hotspot-count idea; Share and "Ask about this photo" stay deferred
- `.planning/research/PITFALLS.md`: EXIF traps, geodesy and placement, reduced motion
- `.planning/research/STACK.md`: React 19.3 `<ViewTransition>`, Next 16.4 `Link transitionTypes`, Motion 14.1

### Next.js 16 docs (AGENTS.md: read before writing code)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/intercepting-routes.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/parallel-routes.md`
- `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`

### Guardrails & tests
- `e2e/photos.spec.ts`, `components/__tests__/GalleryGrid.test.tsx`: rewrite, never delete (`scripts/guards/test-count.mjs` ratchet)
- `e2e/visual/routes.spec.ts`, `e2e/visual/README.md`, `e2e/visual/hide-canvas.css`: the photos baselines change; Claude dispatches the CI baseline run, Tim commits the PNGs
- `e2e/design-system.spec.ts` (G3 scrollbar-gutter check, 07-12): extend it to the lightbox scroll lock
- `components/home/WaypointCard.tsx` + `components/home/__tests__/waypoints.test.tsx`: the `/photos#<slug>` link and its assertion are repointed to `/photos/<slug>`
- `scripts/guards/check-palette.mjs`, `scripts/guards/check-contrast.mjs`, the served-image guard (08-09): no stock palette or `dark:` classes; every new text/background pair passes AA, measured on the composed result for text over the poster; only manifest derivatives are served

### Design reference
- Approved plan with the direction A mockup: https://claude.ai/artifact/GXsHFNbtf7Qp6hPSYxuY8U

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `data/generated/photos.ts`: per-photo `uv`, `elevation.m` (DEM), `position` (with `approximate`, `radiusM`), `capture` (second- or year-precision), `exif` (`null` for the film scan) and tags. UVs: Zermatt (0.68, 0.27), gorge (0.66, 0.34), Glacier Trail (0.46, 0.52), Riffelsee approx. (0.83, 0.59); summit (0.10, 0.67) is in `terrain.ts`.
- `data/photos/editorial.ts`: slug, title, alt, location, story, subject tags and annotations (position in % plus an elevation reference and sourced facts).
- `data/generated/image-manifest.ts`: hashed AVIF/WebP at 640/1024/1600/2560 plus a 1200 JPEG for each photo.
- `data/generated/terrain.ts`: extent, hillshade and contour asset URLs, summit constants.
- `components/home/PosterSheet.tsx`, `components/terrain/ContourField.tsx`: the night-tinted poster and the server-rendered contour mask, candidates for the map base.
- `components/home/PinMark.tsx`: the Home pin glyph (lit and approx. states), a candidate for map pins.
- `lib/photo-format.ts`: `formatCaptureLabel`, `formatExposureTime`, `formatAperture`, `formatFocalLength`, `formatMetres`; `lib/geo.ts` (WGS84 ↔ LV95 ↔ UV).
- `lib/useAscentMode.ts`: the capability gate (D-13); `lib/useReducedMotion.ts`; `lib/animations.ts` motion tokens.
- `components/SafeCanvas.tsx`: the only allowed R3F `Canvas` entry (the carousel already uses it).

### Established Patterns
- Server Components by default, with client islands. three.js and R3F must never be reachable from a Server Component import graph; the carousel stays a `dynamic(..., { ssr: false })` import from a Client Component.
- Generated data is committed, typed and `--check`ed in lint. Phase 10 consumes it; it only regenerates if a WR fix changes the pipeline.
- Tests are rewritten, never deleted. Visual baselines come only from the CI container at threshold 0.01; canvases are hidden, never masked.
- Every UI task runs through the `ui-ux-pro-max` skill (project rule); tell spawned agents to use it.
- Icons import only from `@phosphor-icons/react/dist/ssr` (ESLint rule).

### Integration Points
- `app/(site)/photos/page.tsx` (Server Component today) plus `components/PhotosPageClient.tsx` (`useState` view mode, grid and 3D only) are replaced by `photos/layout.tsx`, the `@modal` slot and URL-driven views.
- `components/ImageDetailModal.tsx` and `components/InteractiveHotspot.tsx` are replaced by the new viewer and callouts. `ImageDetailModal` uses Tailwind v3 `bg-opacity-*` classes that Tailwind 4.3 doesn't generate (the backdrop renders fully opaque today).
- `components/GalleryGrid.tsx` is rebuilt as justified rows (D-15); `data/landscapes.ts` (the legacy bridge) loses its last consumers once the grid, carousel and viewer read `photos.ts`, `editorial.ts` and the manifest.
- `components/home/WaypointCard.tsx:109` changes from `/photos#${slug}` to `/photos/${slug}`.
- Lightbox scroll lock: `overflow: hidden` on `<html>` with the visible scrollbar gutter (07-12 finding A3), plus `inert` on the gallery, `#site-nav` and `#site-footer` if the overlay route is chosen.

### Carry-overs owned by Phase 10 (from STATE.md)
- The 08 review warnings WR-01 … WR-08, plus IN-02 (the legacy bridge drops `position.approximate`; Phase 10 must carry it).
- The React "removeChild … not a child" console error on the `/photos` grid/3D toggle (07-19, unverified): reproduce it, and make sure the rework removes it.
- The "1 hotspots" plural (fixed by D-15) and the photos 3D carousel parallel-run e2e flake (`09-home-ascent/deferred-items.md`).

</code_context>

<specifics>
## Specific Ideas

- The map reads like a survey sheet: names printed next to the points, leader lines where they crowd, the summit as the sheet's landmark.
- Hotspot labels work like peak labels on a panorama photo, sitting in the margin with a line to the point.
- The viewer's strip reads like the margin of a map sheet: title, place and date, story, then the data in mono, with the © line.
- Grid captions are "slide mounts": always visible, title over a mono data line.

</specifics>

<deferred>
## Deferred Ideas

None new. The discussion stayed within the phase scope. The v2.x items PHOTO-F1 … F4 (Ask about this photo, Share, tag filters, LV95 display) are already recorded in REQUIREMENTS.md.

</deferred>

---

*Phase: 10-photography*
*Context gathered: 2026-10-25*
