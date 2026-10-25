# Phase 10: Photography - Research

**Researched:** 2026-10-26
**Domain:** Next.js 16.4 App Router (parallel + intercepting routes), React 19.3 `<ViewTransition>`, native `<dialog>`, in-house layout (justified rows, label placement), R3F carousel restyle
**Confidence:** HIGH for routing, VT and dialog behaviour (measured in Chromium 156, Firefox 157 and WebKit 27.2 with a local probe on the project's own `node_modules`). MEDIUM for Safari 26 (Playwright WebKit on Windows stands in for it; it is not Safari). MEDIUM for layout and UI patterns.

## Summary

The roadmap's three spike questions are answered by a probe: a minimal Next 16.4.2 / React 19.3.1 app built against this repo's `node_modules` (`next build --webpack` + `next start`) and driven by Playwright in all three engines. The probe source is in the session scratchpad (`…/scratchpad/probe/`). It is not committed.

1. **`<dialog>.showModal()` works with `<ViewTransition>` in all three engines.** It does not matter whether `showModal()` runs in `useLayoutEffect` or in a ref callback. The dialog is already open when the new state is captured (`dialogOpenAtCapture: true`), and the shared pair `::view-transition-group(photo-a)` + `-old(photo-a)` + `-new(photo-a)` forms. That refutes ARCHITECTURE §2's concern, so **use `<dialog>` + `showModal()`**. Two caveats were measured:
   - With `<dialog>` alone, Tab escaped to `BODY` in WebKit. Add a small Tab-wrap handler.
   - From the third Escape in a row, the browser's close-request anti-abuse rule fires a non-cancelable `cancel`, and the dialog closes natively. So handle Escape on **`keydown` with `preventDefault()`**. Then layered Escape (callout → zoom → viewer) works in every engine.
2. **Popstate never animates.** `router.back()`, browser Back and browser Forward start **no** view transition in any engine (the `startViewTransition` call count does not change). Close is always instant, so nothing may depend on a close animation. Back closes the lightbox. Forward reopens it.
3. **Home → `/photos/[slug]` is not intercepted.** It renders the full page in all three engines. The interception rewrite only matches when the `Next-Url` header matches `/photos(?:/.*)?`. **New finding:** that regex also matches the *full photo page*. So `router.replace('/photos/b')` from a directly loaded `/photos/a` gets **intercepted**: the URL says `b`, the full page still shows `a`, and the lightbox opens on top. This was reproduced in all three engines. It breaks D-08 as written ("previous/next through `router.replace`").

**Primary recommendation:** Build one `PhotoViewer`. The full page renders it directly, and the intercepted route renders it inside a `<dialog>` shell. Do **previous/next with `window.history.replaceState`** on both surfaces, and derive the current photo from `usePathname()`. The probe showed this adds no history entries and is never intercepted. The viewer stays mounted, so focus stays on the button the visitor pressed. Back, Forward and reload all land correctly. `?view=` keeps `router.replace` (locked; the probe confirms it adds no history). Because D-08 locks `router.replace` for the full page, the planner must get Tim's confirmation of this deviation (see Open Question 1).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route structure, metadata, unknown-slug 404 | Frontend Server (RSC) | — | `photos/layout.tsx`, `[slug]/page.tsx` and `@modal/(.)[slug]/page.tsx` stay Server Components that export `generateMetadata` (locked; SEO-02 later) |
| Photo view-model (order, formatted EXIF, rights line, URLs) | Frontend Server (build-time data) | — | Pure functions over `data/generated/*.ts` + `editorial.ts`, called on the server and passed as props |
| `?view=` state | Browser (URL) | Frontend Server (reads `searchParams` for SSR) | The URL is the single source; the server renders the right view on a hard load |
| Lightbox open/close | Browser (router + `<dialog>`) | Frontend Server (interception rewrite) | The server decides intercept vs full page from `Next-Url`; the client owns the dialog, focus and scroll lock |
| Prev/next | Browser (`history.replaceState` + `usePathname`) | — | No server round trip, no interception (probe) |
| Map label layout, hotspot gutter layout, justified rows | Shared pure TS (server + client) | CSS (container/flex) | Deterministic and unit-testable (D-02, D-09) |
| Hotspot toggle persistence | Browser (`localStorage`) | — | D-10, try/catch everywhere |
| Carousel 3D | Browser (R3F via `SafeCanvas`, `dynamic(ssr:false)`) | — | three.js never reachable from a Server Component graph |
| Images | CDN/Static (`public/images/photos/*` hashed) | — | Only manifest derivatives, raw `<picture>`, no `next/image` optimiser |

## Spike Results (roadmap research items)

The probe app: root layout with `#site-nav`/`#site-footer`, Home (`/`) with a link to `/photos/a`, `photos/layout.tsx` (`children` + `modal`), a grid with `<ViewTransition name="photo-{id}" share="morph" default="none">` thumbnails (each name dropped when its photo is open), `@modal/default.tsx` and `@modal/page.tsx` returning null, an intercepted `@modal/(.)[slug]/page.tsx`, and a full `[slug]/page.tsx` with `generateMetadata`. Three lightbox shells were tested: `overlay` (div + `inert` on siblings), `dialog-layout` (`showModal()` in `useLayoutEffect`) and `dialog-ref` (`showModal()` in a ref callback). `document.startViewTransition` was wrapped to record each call and the pseudo-elements present at `ready`. [VERIFIED: local probe, Chromium 156.0.8078.4 / Firefox 157.0 / WebKit 27.2 (Playwright 1.64 builds)]

| Question | Chromium 156 | Firefox 157 | WebKit 27.2 | Verdict |
|---|---|---|---|---|
| Home `/` → click `/photos/a` | full page, no lightbox | same | same | Not intercepted. D-08 holds with no extra code |
| `/photos?view=grid` → click thumb (overlay / dialog-layout / dialog-ref) | VT ran; pseudos include `::view-transition-group(photo-a)`, `-old(photo-a)`, `-new(photo-a)`; `dialogOpenAtCapture: true` | same | same | Morph pair forms with `<dialog>` in both timings |
| Focus on open | `lb-close` | `lb-close` | `lb-close` | Focus can go to the close button on mount |
| 6× Tab inside | inside (all shells) | inside (all shells) | overlay: inside; **dialog: `BODY`** | Add an explicit Tab wrap (LBOX-03 "traps focus") |
| Escape / `router.back()` | URL `/photos?view=grid`, lightbox gone, **no new VT** | same | same | Close is instant (popstate skips VT) |
| Browser Forward, then Back | reopens `b`, then closes; **no VT** either way | same | same | Back closes, Forward reopens (LBOX-01) |
| Lightbox next via `router.replace` | history unchanged; **lightbox unmounts and remounts**; focus jumps to close; grid names swap → cross-morph `photo-a` and `photo-b` | same | same | Avoid it: use `history.replaceState` |
| Lightbox next via `history.replaceState` | history unchanged, **no remount**, focus stays on `lb-next`, Escape → `/photos?view=grid`, Forward → reopens at `c` | same | same | **Recommended** |
| Direct `/photos/a` → `router.replace('/photos/b')` | **URL b, full page still a, lightbox b on top** | same | same | **Bug**: the full page is inside the interception scope |
| Direct `/photos/a` → `history.replaceState('/photos/b')` | full page shows b, no lightbox; `document.title` stays "Photo a"; reload → b | same | same | **Recommended**; update the title in an effect |
| `?view=` via `router.replace` (×2) | `history.length` unchanged | same | same | PHOTO-02 holds (locked mechanism works) |
| `<dialog>` Escape handled only in `cancel` | 1st and 2nd `cancel` cancelable; **3rd `cancelable=false` → native close** | same | same | Do not rely on `cancel` for layering |
| Escape handled on `keydown` + `preventDefault()` | dialog stays open through 2 layers; 3rd closes via `router.back()` | same | same | **Recommended** |
| Scroll position, opening from a scrolled grid (`Link scroll` default vs `false`) | unchanged open and closed (1347 px) | unchanged (1406) | unchanged (1351) | No jump with a top-layer dialog. Keep `scroll={false}` anyway |

**Source evidence:**
- Interception regex: `node_modules/next/dist/lib/generate-interception-routes-rewrites.js` builds the `Next-Url` header matcher from the intercepting route and widens it with `.replace(/\(\?:\/\)\?$/, '(?:/.*)?')` ("will match any descendants") [VERIFIED: file read this session].
- `Next-Url` is the current tree path: `computeChangedPath` in `node_modules/next/dist/client/components/router-reducer/compute-changed-path.js` [VERIFIED: file read].
- `(.)` for `/photos/@modal/(.)[slug]` resolves to the intercepting route `/photos` (slots and groups stripped): `extractInterceptionRouteInformation` in `node_modules/next/dist/shared/lib/router/utils/interception-routes.js` [VERIFIED: file read].

### Spike recommendations (for the planner)

| Item | Take this approach | Rejected | Why |
|---|---|---|---|
| Lightbox shell | `<dialog>` + `showModal()` in `useLayoutEffect`, guarded by `if (!d.open)` (StrictMode runs effects twice). Escape on `keydown` with `preventDefault()`. `onCancel` → `preventDefault()` (belt and braces). `onClose` → if the route is still a photo, `router.back()` (desync guard). Plus a Tab-wrap handler | overlay + `inert` | Both morph. The dialog gives native inertness for the nav, footer, skip link and gallery (no `#site-nav`/`#site-footer` ids exist today), top layer (no new z-index token above `--z-skip: 60`) and native modal semantics |
| Closing | Close button, Escape (last layer) and swipe-down → `router.back()` in the modal. The full page uses `<Link href="/photos">` (D-08). Nothing listens for a close animation | close animation via `<ViewTransition exit>` | Popstate never animates (measured) |
| Prev/next | `window.history.replaceState(null, '', '/photos/' + slug)` on both surfaces; the current slug comes from `usePathname()` | `router.replace` | Intercepted on the full page (bug); remounts the modal |
| Opening from Home | Plain `<Link href={`/photos/${slug}`}>`; lands on the full page | an extra guard | Not intercepted (measured). Add an e2e test so a future Next change is caught |

## User Constraints (from CONTEXT.md)

<user_constraints>
### Locked Decisions

(Copied verbatim from `10-CONTEXT.md` `<decisions>`. The roadmap locks listed in its `<domain>` also apply: the routes `photos/layout.tsx` + `@modal/(.)[slug]` + mandatory `@modal/default.tsx` + null `@modal/page.tsx` + full `photos/[slug]`; the URL as the only source of view and lightbox state (`?view=` via `router.replace`); moving between photos and switching views add no history entries; Map default; rights line "© {capture year} Tim Lui, all rights reserved"; no download button; ascending-altitude order everywhere; justified rows and lightbox built in-house; unique VT names with explicit `::view-transition-*` reduced-motion CSS; Server Component photo routes with metadata; all image consumers on manifest derivatives; `e2e/photos.spec.ts` and `components/__tests__/GalleryGrid.test.tsx` rewritten, not deleted; Home links repointed to `/photos/[slug]`; slugs `matterhorn-from-zermatt`, `gornerschlucht-waterfall`, `matterhorn-glacier-trail`, `riffelsee-reflection`.)

**Map view**
- **D-01: The map is the full sheet.** It is the same 11 km extent as Home's poster and the footer (08 D-14): the night-tinted hillshade with contours (as in Home's static mode, 09 D-17), with the summit as a landmark near the west edge. The summit marker ("Matterhorn 4,478 m", the official height) is not a link. No pan, no zoom, no tiles. It reuses the Phase 8 terrain assets (`data/generated/terrain.ts`: hillshade AVIF/WebP, `contours-hero` SVG). The photos sit in the east half, so the Zermatt and Gornerschlucht pins are about 800 m apart.
- **D-02: Waypoint labels are always shown**, like names on a survey map (ui-ux-pro-max `direct-labeling`). Each label is the title plus the DEM altitude in mono. The Riffelsee pin is dashed and labelled "approx.", matching the footer tick (08 D-02, DATA-04). Where labels would collide (Zermatt and the gorge), they are offset with thin leader lines. Label positions are deterministic per breakpoint (computed at build time or by a pure layout function), so tests can assert that no two labels overlap.
- **D-03: A pin and its label form one link to `/photos/[slug]`, which opens the lightbox straight away** (an intercepted soft navigation). Hover or focus may also show a small thumbnail preview, but nothing depends on it (`hover-vs-tap`). The links are in ascending-altitude DOM order, the map has an accessible name, and focus returns to the pin that opened the lightbox (LBOX-03). Map pins have no image, so opening from the map plays a plain enter, not a morph (research ARCHITECTURE §2).
- **D-04: On narrow screens the labels are the touch targets.** Each label row is at least 44 px tall and sits in its own clear slot around the cluster, with a leader line to a small dot. The label and its dot form one link. There is no separate waypoint list. The map stays one full-width sheet at every breakpoint.

**Lightbox layout**
- **D-05: Photo stage plus a bottom strip.** The photo gets the largest box that fits above the strip (`object-fit: contain`, never cropped) on a neutral gallery-black surface (the map palette never tints the photo). The strip holds, in order: the title (the dialog's label); place · capture date and local time (Europe/Zurich; the film scan shows "2019"); the one-line story from `data/photos/editorial.ts`; the EXIF row in mono with tabular figures (camera, lens, focal length, aperture, shutter, ISO); the DEM altitude and the 4-dp WGS84 coordinates; the © line. The chrome has a close ×, ‹ › buttons and an "n / 4" counter. On wide screens, the side gutters left beside the 3:2 photo hold the hotspot callouts (D-09). It reads like a map-sheet margin.
- **D-06: Zoom toggles between fit and 1:1** of the 2560 px derivative (08 D-13), about 1.8× on a 1440 px screen. It keeps the existing modal's zoom feature, without regressing it. Click on the photo, Z or a visible button toggles it. While zoomed, drag pans and the arrow keys pan; otherwise the arrows and swipe move to the previous or next photo. Esc unwinds in layers: an open callout, then zoom, then the viewer. Hotspots hide while zoomed, as they do today. Native pinch-zoom on touch is never blocked. The zoom change is instant under reduced motion.
- **D-07: Missing fields are left out, never shown as filler.** The film scan (`exif: null`, year-only capture) shows "Film scan · 2019" in place of camera, lens and exposure, then the DEM altitude and "≈ 45.9837 N 7.7623 E · ±100 m (approx.)" from `position.radiusM`. No "—", "unknown" or "undefined" anywhere. The same rule covers the 08 review cases (for example a missing GPS altitude, WR-02). No new data is needed from Tim.
- **D-08: A directly loaded `/photos/[slug]` page is the same viewer inside the site shell.** It renders under `SiteNav`, with `SiteFooter` below, the same strip, a "← All photographs" link, and previous/next through `router.replace`. Close or Esc goes to `/photos`; it never calls a blind `history.back()`. Clicks from Home waypoints land on this full page: a waypoint is a destination, not an overlay (research ARCHITECTURE §2). The interception spike confirms that Home → `/photos/[slug]` does not open the modal, or the plan makes sure it doesn't.

**Hotspot callouts**
- **D-09: Map-style labels, with details on demand.** Where the side gutters have room, each hotspot shows a short label in the gutter: its title plus the height in mono. The height comes from the annotation's elevation reference: the photo's DEM height, or the official 4,478 m summit. A leader line joins the label to a small marker on the photo, like peak labels on a panorama. The label is a button (`aria-expanded`). Enter or tap expands its description and sourced facts (with links); Esc collapses it and returns focus to the label. Panels never cover the photo. Markers and labels follow reading order (top-left → bottom-right). Today each photo has one or two annotations (six in total); the layout must still handle more without overlaps.
- **D-10: Hotspots are on by default.** A visible "Hide labels" toggle (`aria-pressed`, shortcut H) shows the clean photo. The choice is remembered per visitor in `localStorage` (every read and write wrapped in try/catch; without storage it falls back to on) and applies to every photo and visit.
- **D-11: On narrow screens, numbered dots plus an inline key.** Where there is no gutter (below about 768 px, exact breakpoint in the UI-SPEC), the photo shows small numbered dots with 44 px hit areas. The strip holds a numbered key ("① Matterhorn summit · 4,478 m"). Tapping a dot or a key row expands that row in place (description plus sources) and highlights its dot. No sheet or overlay is drawn over the photo.

**Carousel, switcher & grid**
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

### Deferred Ideas (OUT OF SCOPE)
None new. The discussion stayed within the phase scope. The v2.x items PHOTO-F1 … F4 (Ask about this photo, Share, tag filters, LV95 display) are already recorded in REQUIREMENTS.md. Also out of this phase: OG images (Phase 12), deleting legacy variants (Phase 12).
</user_constraints>

## Phase Requirements

<phase_requirements>

| ID | Description | Research Support |
|----|-------------|------------------|
| PHOTO-01 | `/photos` opens on the Map view, showing each photo as a keyboard-operable waypoint on the contour map | Pattern 4 (map sheet: Server Component, `<a>` pins in `buildWaypoints()` order, `parseView()` default `'map'`); Pattern 6 (label layout); Pitfall 9 |
| PHOTO-02 | Grid (justified rows at true aspect ratios) and Carousel (restyled 3D, flat stepper under reduced motion); view kept in the URL without history entries | Probe: `router.replace('?view=…')` keeps `history.length`; Pattern 5 (justified rows via CSS flex-grow with data aspect ratios); Pattern 7 (carousel and gate); Pitfalls 6 and 7 |
| PHOTO-03 | One canonical order (ascending altitude) in every view | `buildWaypoints()` in `lib/ascent/waypoints.ts` already sorts "DEM height asc, ties by id"; reuse it (Pattern 2) |
| PHOTO-04 | Carousel never advances without user control | D-12: no timer; remove the window key listener; idle float stops offscreen/hidden/reduced (Pitfall 7) |
| LBOX-01 | `/photos/[slug]` full page on direct load, lightbox in-site, Back closes | Spike table (all three engines); Pattern 1 (routes); Pitfall 1 (the full page is inside the interception scope) |
| LBOX-02 | Arrow keys, buttons and swipe; counter; no history entries | `history.replaceState` (probe: no remount, no new entry); Pattern 3; swipe with `touch-action: pan-y pinch-zoom` |
| LBOX-03 | Focus trap, Escape closes, focus returns to the thumbnail or pin | `<dialog>` + Tab wrap + keydown Escape (probe); focus restore in a microtask after unmount, verified to `[data-photo-id]` in all engines |
| LBOX-04 | Gallery-black surface; EXIF strip (date, camera, lens, focal length, aperture, shutter, ISO, altitude, coordinates) | `bg-gallery` token exists; `buildPhotoView()` formats with `lib/photo-format.ts` and drops missing fields (D-07); WR-04 fix required |
| LBOX-05 | Map-style hotspot callouts with leader lines, keyboard + tap, mobile legend, hide toggle | Pattern 6 (1-D label stacking, pure function); D-10 `localStorage` wrapper |
| LBOX-06 | Thumbnail morph where VT is supported; instant elsewhere | Probe: pair forms with `<dialog>`; the grid drops *all* names while a photo is open (Pitfall 3); no `loading.tsx` in the modal slot (Pitfall 4) |
| LBOX-07 | "© {capture year} Tim Lui, all rights reserved", no download | `buildPhotoView().rights` from the capture year (2019 for the film scan); no download/right-click blocking (anti-feature) |

</phase_requirements>

## Project Constraints (from CLAUDE.md / AGENTS.md / STATE.md)

- **AGENTS.md:** Next.js 16.4 has breaking changes. Read `node_modules/next/dist/docs/` before writing Next code. Docs read this session: `01-app/03-api-reference/03-file-conventions/{intercepting-routes,parallel-routes,default}.md`, `…/02-route-segment-config/dynamicParams.md`, `01-app/02-guides/view-transitions.md`, `01-app/03-api-reference/04-functions/use-router.md`, `01-app/03-api-reference/02-components/link.md` (`transitionTypes`, v16.2), `01-app/01-getting-started/04-linking-and-navigating.md` § "Native History API".
- **User CLAUDE.md:** present options as comparison tables and let Tim decide; flag regression risks before changing working code; lead with working examples.
- **Memory / process:** every UI task goes through `ui-ux-pro-max` (tell spawned agents to load it). Visual baselines come only from the CI container (threshold 0.01). Claude dispatches the run, Tim commits the PNGs. Never `test.skip`/`.only`/`.fixme` (`scripts/guards/test-count.mjs` rejects them; use the `@chromium-only` title tag). Tests are rewritten, never deleted.
- **Ratchet:** `scripts/guards/test-count.baseline.json` = `"jest": 725, "e2e": 241, "total": 966` [VERIFIED: file read]. Deleting `ImageDetailModal.test.tsx` (3 tests) or the bridge tests (`data/__tests__/editorial.test.ts` "legacy bridge", 6 tests) needs replacements with at least as many tests.
- **Icons:** only from `@phosphor-icons/react/dist/ssr` (ESLint). **Motion:** import from `motion/react` only. **R3F:** `Canvas` only through `components/SafeCanvas.tsx`.
- **Guards in `npm run lint`:** palette (no stock palette, no `dark:`, no white/black over the ratchet), contrast (AA, composed result), identity, served-image guard (only manifest derivatives), `data:check`.
- **CSP (`proxy.ts`):** `style-src 'self' 'unsafe-inline'` (inline `view-transition-name` and mask styles are fine), `img-src 'self' blob: data:` (same-origin images only).
- **Dev server:** `npm run dev` = `next dev --webpack`. `reactStrictMode: true` (effects run twice in dev: guard `showModal()`).

## Standard Stack

### Core (all already installed; nothing new)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.4.2 | Parallel + intercepting routes, `generateMetadata`, `Link transitionTypes` | [VERIFIED: node_modules/next/package.json] |
| react / react-dom | 19.3.1 | `ViewTransition`, `addTransitionType` exported from `react` | [VERIFIED: `typeof require('react').ViewTransition` → `symbol`]; `@types/react` 19.3.0 declares `ViewTransitionProps` [VERIFIED] |
| motion | 14.1.0 | In-page motion only (callout expand, zoom); never page-level `AnimatePresence` | [VERIFIED] |
| three / @react-three/fiber / drei | 0.184.0 / 9.8.1 / 10.7.9 | Existing carousel | [VERIFIED] |
| @phosphor-icons/react | 2.1.10 | Icons (`dist/ssr`) | [VERIFIED] |
| Native `<dialog>` | platform | Lightbox shell | Probe (all three engines) |

### Supporting (existing in-repo modules to reuse)

| Module | Use |
|--------|-----|
| `lib/ascent/waypoints.ts` `buildWaypoints()` | The one ordering (DEM asc, ties by id) plus slug, title, uv, approximate, placeDate, 640/1024 srcsets. Build the photo view-model on top of it |
| `lib/photo-format.ts` | `formatCaptureLabel`, `formatExposureTime` (fix WR-04 first), `formatAperture`, `formatFocalLength`, `formatMetres` |
| `lib/home-format.ts` | `formatCaptureMonth`, `shortPlace` (grid captions), `formatLatLon` (Phase 9) |
| `components/home/PinMark.tsx`, `SummitMark`, `components/terrain/ContourField.tsx`, `PosterSheet.tsx` (pattern) | Map base: raw `<picture>` hillshade + `ContourField` mask; `terrain.assets.contours` has `hero` (100 m) **and `map` (50 m)** LODs |
| `lib/useAscentMode.ts` | Capability gate for carousel vs stepper (D-13) |
| `lib/useReducedMotion.ts`, `lib/animations.ts` | Motion tokens and reduced motion |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `<dialog>` + `showModal()` | overlay `div[role=dialog]` + `inert` | Also morphs (probe). Needs ids on the shell (none today), a z-index token above `--z-skip: 60`, and manual inert on the skip link, nav, footer and gallery. Keep it only as the fallback if a future engine regresses |
| `history.replaceState` prev/next | `router.replace` | Locked in D-08 / ARCH §2, but intercepted on the full page and remounts the modal (probe). See Open Question 1 |
| CSS flex-grow justified rows | JS measure + `ResizeObserver` | JS layout renders and then jumps (CLS, PITFALLS 24). CSS is SSR-exact |
| Raw `<picture>` with manifest srcset | `next/image` | `next/image` re-encodes through `/_next/image`, so it serves non-manifest bytes. Phase 9 used `<picture>` (`WaypointCard.tsx`, `PosterSheet.tsx`) |

**Installation:** none. No new runtime or dev dependencies.

## Package Legitimacy Audit

No external packages are installed in this phase, so no audit was run. The only environment change was `npx playwright install webkit` (the official Playwright WebKit 27.2 build v2370, needed for the spike's Safari leg; it went to `%LOCALAPPDATA%\ms-playwright\webkit-2370`).

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────── hard load / share / reload ────────────────┐
 Visitor ──▶ /photos?view=map|grid|carousel                     /photos/<slug>        │
              │ (Server) photos/layout.tsx {children}{modal}     │ (Server) [slug]/page.tsx
              │   children = page.tsx (reads searchParams.view)   │   generateMetadata, notFound()
              │   modal    = @modal/page.tsx → null               │   modal = @modal/default.tsx → null
              ▼                                                   ▼
        PhotosHeader (kicker, h1, ViewSwitcher)            SiteNav ▸ PhotoViewer(variant=page) ▸ SiteFooter
              │ click view ─▶ router.replace('?view=x',{scroll:false}) ─▶ RSC re-render, no history entry
              ▼
   ┌──────── one view mounted (key=view) ────────┐
   │ MapSheet (RSC: <a> pins + labels)            │
   │ JustifiedGrid (client: VT names)             │──── click <Link href=/photos/<slug> scroll={false}>
   │ Carousel3D | Stepper (gate: useAscentMode)   │          │ Next-Url=/photos ⇒ interception rewrite
   └──────────────────────────────────────────────┘          ▼
                                     @modal/(.)[slug]/page.tsx (Server: metadata, notFound)
                                                  ▼
                              LightboxDialog (client: showModal, Tab wrap, Esc keydown, scroll lock)
                                                  ▼
                              PhotoViewer(variant=modal)  ◀── slug = usePathname()
                               │ ←/→, ‹ ›, swipe ─▶ history.replaceState('/photos/<next>')  (no remount, no intercept)
                               │ Esc (last layer) / × / swipe-down ─▶ router.back()  (popstate: no VT)
                               ▼
                    unmount ─▶ microtask: focus [data-photo-id=<current>] in the still-mounted view
```

### Recommended Project Structure

```
app/(site)/photos/
├── layout.tsx                 # Server: <>{children}{modal}</>  (no client code)
├── page.tsx                   # Server: parse ?view, render header + one view
├── [slug]/page.tsx            # Server: full page, generateMetadata, notFound for unknown slug
└── @modal/
    ├── default.tsx            # null (mandatory: a missing default errors on hard nav for named slots)
    ├── page.tsx               # null (closes the slot on soft nav back to /photos)
    └── (.)[slug]/page.tsx     # Server: generateMetadata (same fn), <LightboxDialog><PhotoViewer/></LightboxDialog>
components/photos/
├── PhotosHeader.tsx, ViewSwitcher.tsx (client)
├── MapSheet.tsx (server) + map-labels layout from lib/photos/
├── JustifiedGrid.tsx (client island for VT names) 
├── PhotoCarousel3D.tsx (restyled, moved) + CarouselStepper.tsx + CarouselView.tsx (gate)
├── LightboxDialog.tsx (client shell), PhotoViewer.tsx (client), ExifStrip.tsx, Hotspots.tsx, ZoomStage.tsx
lib/photos/
├── view-model.ts              # buildPhotoView(s): strip fields, rights, srcsets, neighbours
├── view-param.ts              # parseView(): 'map' | 'grid' | 'carousel', default 'map'
├── justify.ts                 # flex-basis/grow per tile (pure)
├── label-layout.ts            # 1-D label stacking for map labels + hotspot gutters (pure)
└── hotspot-pref.ts            # localStorage get/set in try/catch (D-10)
```

### Pattern 1: Routes, with one metadata function shared by both photo routes

```tsx
// app/(site)/photos/[slug]/page.tsx  and  app/(site)/photos/@modal/(.)[slug]/page.tsx (Server Components)
import { notFound } from 'next/navigation';
import { photoBySlug, photoMetadata } from '@/lib/photos/view-model';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;            // params is a Promise in 16.x [CITED: default.md]
  return photoMetadata(slug);               // same function in both routes (probe: the intercepted page otherwise keeps the gallery title)
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const view = photoBySlug(slug) ?? notFound();
  return /* full page: */ <PhotoViewer variant="page" photos={allViews} initialSlug={view.slug} />;
  // modal route: <LightboxDialog><PhotoViewer variant="modal" … /></LightboxDialog>
}
```
`generateStaticParams` with the 4 slugs plus `export const dynamicParams = false` makes unknown slugs return a 404 [CITED: route-segment-config/dynamicParams.md]. Whether that 404 is server-rendered here (EDGE-01 found `notFound()` inside `/projects/[slug]` returns an empty shell) is [ASSUMED]: add an e2e check.

### Pattern 2: One view-model, one order

`buildWaypoints()` is already "the single waypoint ordering (DEM height asc, ties by id)" (STATE 09-03). Add `buildPhotoViews()` on top of it. It joins the larger manifest variants (1600/2560 AVIF/WebP), the EXIF strip fields, the coordinates, the hotspots (with `elevationMetres()` resolved) and `rights: \`© ${year} Tim Lui, all rights reserved\``. It returns `prev`/`next` slugs. Every view, the viewer and `generateMetadata` read it, so order and copy cannot drift. It replaces `data/landscapes.ts` (the IN-02 fix: it carries `position.approximate` and `radiusM`).

### Pattern 3: Viewer with `replaceState` prev/next (proven in the probe)

```tsx
'use client';
import { usePathname } from 'next/navigation';

const SLUG = /^\/photos\/([^/?#]+)$/;
export function useCurrentSlug(initial: string) {
  const m = usePathname().match(SLUG);              // usePathname syncs with replaceState [CITED: linking-and-navigating.md §Native History API]
  return m ? m[1] : initial;                          // NOT useParams(): it keeps the stale segment param after replaceState
}
export function stepTo(slug: string) {
  window.history.replaceState(null, '', `/photos/${slug}`);   // known slug only (never untrusted input)
}
// In PhotoViewer: const slug = useCurrentSlug(initialSlug); const photo = bySlug[slug];
// useEffect(() => { document.title = `${photo.title} · Tim Lui`; }, [photo.title]);  // probe: title is stale otherwise
```

### Pattern 4: The `<dialog>` shell (behaviour proven; the code is a sketch)

```tsx
'use client';
export function LightboxDialog({ children, labelledBy }: { children: React.ReactNode; labelledBy: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  useLayoutEffect(() => {
    const d = ref.current!;
    if (!d.open) d.showModal();                       // guard: StrictMode double effect
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';                   // gutter stays (scrollbar-gutter: stable; 07-12 A3); extend G3
    return () => {
      html.style.overflow = prev;
      queueMicrotask(() => restoreFocus());            // probe: focuses [data-photo-id] once the gallery is no longer inert
    };
  }, []);
  return (
    <dialog ref={ref} aria-labelledby={labelledBy} className="bg-gallery …"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); if (!unwindOneLayer()) router.back(); }
                          else if (e.key === 'Tab') wrapTab(e, ref.current!); }}
      onCancel={(e) => e.preventDefault()}
      onClose={() => { if (SLUG.test(location.pathname)) router.back(); }}   /* native-close desync guard */>
      {children}
    </dialog>
  );
}
```
- `restoreFocus()`: focus `[data-photo-id="<current slug>"]` in the mounted view, falling back to the recorded opener and then to the h1. Whether "current photo" or "the photo that opened it" is preferred after prev/next is a UI-SPEC call (LBOX-03 says "that opened it"). The probe restored to the current photo's tile.
- Do not put `aria-live` outside the dialog: content outside a modal dialog is inert. Put the polite "Photo 2 of 4" region inside.

### Pattern 5: Justified rows without JS measurement

Each tile is `flex: <aspect> 1 <aspect × targetH>px` with `aspect-ratio: w / h` on the image box. A trailing filler (`flex-grow: 999999`) keeps the last row from stretching. Widths come from data (`imageManifest[id].width/height`), so SSR is exact and CLS is 0. `lib/photos/justify.ts` returns the per-tile style values (unit-testable). An e2e check asserts that tiles in a row share one height (±1 px) and keep their true ratio (±1%). Below about 640 px, one column. Captions sit under the image box. Use the 640/1024/1600 AVIF/WebP srcset with `sizes` from the target row height.

### Pattern 6: Deterministic label layout (map labels and hotspot gutters)

A pure function does 1-D stacking per column:
1. Assign each label to a side or column (map: label beside its pin; hotspots: x < 50 → left gutter, else right).
2. Sort by anchor y.
3. Push each label down to `max(anchorY - h/2, prevBottom + gap)`.
4. If the stack overflows the bottom, push up from the bottom.
5. Emit leader-line endpoints from each label edge to its anchor.

The inputs are anchor positions in sheet or photo pixels for each breakpoint (D-02: per breakpoint) and label box sizes from the type scale (fixed line height × rows; width from the UI-SPEC). Unit tests assert that no two rects intersect, that reading order is preserved, and that every label stays inside the container. The narrow-map variant (D-04) uses the same function with fixed 44 px slots. Geometry check: Zermatt (0.6772, 0.2742) vs Gornerschlucht (0.657, 0.344) differ by Δv 0.07, which is about 26 px on a 375 px sheet and about 77 px on 1100 px. That is a guaranteed collision on phones (D-04 slots), but ample room on desktop.

### Pattern 7: Carousel or stepper behind the gate

`CarouselView` (client) reads `useAscentMode()`. `'pending'` and `'static*'` render `CarouselStepper` (plain DOM `<picture>`). `'eligible'` renders `dynamic(() => import('./PhotoCarousel3D'), { ssr: false })`, so three.js is never fetched under static. Controls (‹ › counter "Open photo") are normal DOM siblings of the canvas and call state setters directly. Today's buttons dispatch synthetic `KeyboardEvent`s on `window`; that goes away.

### Anti-Patterns to Avoid
- **Prev/next as `<Link>` or `router.*` to `/photos/<slug>` from inside `/photos/*`**: intercepted (Pitfall 1).
- **Page-level `AnimatePresence`** alongside route VTs (ARCH Anti-Pattern 8).
- **A `'use client'` `page.tsx` or `layout.tsx`** under photos: you lose metadata (ARCH Anti-Pattern 9).
- **`loading.tsx` in the modal slot**: the fallback commits first and the morph pair never forms (Pitfall 4).
- **Keeping both the map and grid mounted** (hidden with CSS): duplicate VT names abort the transition.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Background inertness, top layer, modal semantics | `inert` bookkeeping on nav/footer/skip/gallery, a z-index war | `<dialog>.showModal()` | Native; the probe proves VT compatibility |
| Shared-element animation | FLIP with Motion `layoutId` across routes | React `<ViewTransition name share="morph">` | Route navigations are transitions already [CITED: view-transitions.md] |
| URL sync for prev/next | Custom history stack or `popstate` listener | `history.replaceState` (Next syncs `usePathname`) | Documented integration; probe-verified |
| Pan while zoomed | Transform matrix + inertia | The 1:1 image inside an `overflow: auto` stage; drag sets `scrollLeft/Top`; arrows scroll by a step | Native touch pan and pinch keep working (D-06); no gesture math |
| Pinch-zoom | Custom pinch handler | Browser pinch (`touch-action: pan-y pinch-zoom` on the stage when fitted) | D-06 "never blocked" |
| Image optimisation | `next/image` | Manifest `<picture>` srcset | Served-image guard; derivatives already hashed |
| Lightbox / layout libraries | PhotoSwipe, react-photo-album | In-house (locked) | — |

**Key insight:** Most of the risk is in routing and browser semantics, and the probe settled those. The in-house parts (justify, label stacking) are pure functions small enough to test exhaustively.

## Runtime State Inventory

This is a route and component migration (the legacy bridge goes, the image consumers move).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None today. New: one `localStorage` key for the hotspot preference (D-10) | Code only; name it once in `lib/photos/hotspot-pref.ts` |
| Live service config | None (no CMS or external services for photos) | None, verified by repo scan |
| OS-registered state | None | None |
| Secrets / env vars | None touched | None |
| Build artifacts / caches | `public/service-worker.js`: HTML is stale-while-revalidate, `/images/` cache-first, caches named per `BUILD_HASH`. Returning visitors may see the v1 `/photos` HTML once after deploy (Pitfall 17) | No code change. Note it in the deploy check; verify `/photos` after one reload in the prod build |
| Legacy image paths | `data/landscapes.ts:64-70` reads `imageManifest[id].legacy.*`; `lib/useProgressiveTextures.ts:82,189` reads `thumbnailSrc`/`src` (legacy) | Move the carousel textures to manifest 640/1024 WebP. Keep the `legacy` field in the manifest/schema until Phase 12 deletes the files |

## Common Pitfalls

### Pitfall 1: The full photo page is inside the interception scope
**What goes wrong:** On a directly loaded `/photos/a`, any soft navigation to `/photos/b` (Link, `router.push/replace`) is intercepted. The URL shows b, the page shows a, and the modal opens over it.
**Why:** The rewrite's header matcher is `/photos(?:/.*)?` (descendants included), and `Next-Url` on the full page is `/photos/a`.
**How to avoid:** Prev/next use `history.replaceState`. The full page has no other `/photos/<slug>` links (the "All photographs" link goes to `/photos`, which is fine).
**Warning signs:** e2e: direct `/photos/a` → Next → `expect(page.getByRole('dialog')).toHaveCount(0)` and the h2 or title shows b.

### Pitfall 2: Remount per photo with `router.replace` in the modal
**What goes wrong:** Each step unmounts and remounts the intercepted page. Focus jumps to Close, the zoom/callout state resets, and the scroll lock and inert toggle.
**How to avoid:** `history.replaceState` (probe: the mount log shows one mount across two steps).

### Pitfall 3: Cross-morphs between the grid and the lightbox on prev/next
**What goes wrong:** If the grid drops only the *open* photo's name, a step from a to b gives a its name back in the grid and removes b's. Both `photo-a` and `photo-b` pairs form, and the photos fly to and from the grid behind the dialog (the probe recorded both groups).
**How to avoid:** While any photo is open (`usePathname()` matches `/photos/<slug>`), the grid renders **no** VT names. Only the lightbox carries `photo-${slug}`. Open still pairs (the old state has all names), and steps run no shared morph. The root crossfade still runs per step, because Next's `replaceState` sync is a transition (the probe's VT count rose per step). Add `::view-transition { pointer-events: none }` [CITED: view-transitions.md], which `app/globals.css` lacks today. Let the UI-SPEC decide whether the root crossfade stays.

### Pitfall 4: No morph because the destination suspended or the image is blank
**What goes wrong:** "If the destination suspends into a fallback first, no pair forms" [CITED: view-transitions.md]. A 2560 px image that is still decoding morphs into an empty box.
**How to avoid:** No `loading.tsx` or Suspense fallback around the modal photo. The lightbox first paints the **same derivative the thumbnail used** (already cached: 640/1024), then swaps to 1600/2560 once decoded (blur-up for free). Keep Links prefetched (the default).

### Pitfall 5: Escape layering broken by the dialog close-request anti-abuse rule
**What goes wrong:** Handling Escape in `cancel` works twice. From the third consecutive Escape (with no new user activation) `cancel` is non-cancelable, and the dialog closes natively while the URL still says `/photos/<slug>` (measured in all engines).
**How to avoid:** Handle Escape in `onKeyDown` with `preventDefault()`. Keep `onClose` as a desync guard that calls `router.back()`.

### Pitfall 6: Duplicate VT names across views
**What goes wrong:** Two views mounted at once, or a hidden grid under the map, leave duplicate names, which aborts the transition.
**How to avoid:** Mount exactly one view (`key={view}`). Name only grid tiles (the map and carousel have no images). Names use `id`/slug (valid idents). Detection: a console listener for "duplicate view-transition-name".

### Pitfall 7: Carousel window listeners leak into the lightbox
**What goes wrong:** `PhotoCarousel3D.tsx:162-176` binds ←/→/Enter on `window`. With the lightbox open over the carousel view, the arrows rotate the hidden carousel, and Enter calls `onImageClick` again (a push while the dialog is open). `inert` does not stop `window` listeners.
**How to avoid:** Scope the keys to the carousel's own focusable region (`onKeyDown`), have the buttons call setters, and ignore keys while `document.querySelector('dialog[open]')` exists.

### Pitfall 8: The React "removeChild … not a child" error on the view toggle
**What we know:** It was seen on the grid ↔ 3D toggle (07-19) and alongside the parallel-run carousel e2e flake (09 deferred-items). The likely source is drei `<Html>` (L100, L182: a loading `<Html center>` swapped for the scene) portalling nodes next to the canvas while the conditional tree unmounts [ASSUMED].
**How to avoid:** Remove `<Html>` overlays (render the loading skeleton and labels as DOM siblings outside `SafeCanvas`). Key the views. Add an e2e `page.on('console')` assertion of no `removeChild` across map → grid → carousel → grid on `next dev`.

### Pitfall 9: Map labels collide on phones; hover-only previews
**How to avoid:** Use the D-04 slot layout from the pure function. Previews show on `:hover` **and** `:focus-visible`, carry no information the label lacks, and are `aria-hidden`. Hit areas are at least 44 px (label rows). Add "© swisstopo" attribution on the map sheet (PITFALLS 28).

### Pitfall 10: The EXIF strip shows wrong or filler values
**What goes wrong:** WR-04: `formatExposureTime` prints wrong values for 0.25–1 s and `1/Infinity` for 0. WR-02: missing GPS altitude drops lat/lon upstream.
**How to avoid:** Fix WR-04 in the plan that builds the strip (unit-test 0.3 s → "0.3 s", 1/4 → "1/4 s", and 0 omitted). Treat every field as optional in `buildPhotoView` (D-07). Assert on the strip: no "—", "undefined", "null" or "NaN".

### Pitfall 11: Unit tests can't run `<dialog>`
**What goes wrong:** jsdom 26.1.0 has no `showModal` and no `inert` [VERIFIED: `typeof el.showModal` → `undefined`].
**How to avoid:** A tiny prototype stub in `jest.setup.js` (`showModal(){this.open=true}`, `close(){this.open=false; dispatch close}`). Test behaviour (focus, Escape, layering) in Playwright, not jsdom.

## Code Examples

### `?view=` parsing and switching (locked mechanism)
```ts
// lib/photos/view-param.ts (pure)
export const VIEWS = ['map', 'grid', 'carousel'] as const;
export type PhotoView = (typeof VIEWS)[number];
export const parseView = (v: unknown): PhotoView =>
  (VIEWS as readonly string[]).includes(v as string) ? (v as PhotoView) : 'map';   // Map default (locked)

// ViewSwitcher (client): router.replace(`/photos?view=${v}`, { scroll: false })   // probe: no history entry
```

### Grid tile naming (drop every name while a photo is open)
```tsx
const open = /^\/photos\/[^/]+$/.test(usePathname());
const tile = <picture>{/* manifest srcset */}</picture>;
return open ? tile : (
  <ViewTransition name={`photo-${p.slug}`} share="morph" default="none">{tile}</ViewTransition>
);  // keep share="morph" with default="none", or the pair silently stops morphing [CITED: view-transitions.md]
```

### Reduced motion (already present; keep and test)
`app/globals.css:558-593` inside `@media (prefers-reduced-motion: reduce)` already sets `::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }` [VERIFIED: file read]. Add `::view-transition { pointer-events: none; }` outside the media query.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next/image` `priority` | `loading="eager"` + `fetchPriority="high"` (or `preload`) | Next 16.0 | Use for the lightbox photo (09-RESEARCH) |
| Experimental `viewTransition` flag | No config; React 19.3 `ViewTransition` | Next 16.4 / React 19.3 | Works with no `next.config` change (probe; guide: "no configuration") |
| Missing `default.js` → 404 | Missing `default.js` for a named slot → **error** | Next 16 | `@modal/default.tsx` is mandatory [CITED: default.md] |
| `params` sync | `params: Promise<…>` | Next 15+ | `await params` |

**Deprecated/outdated:** ARCHITECTURE §2's "overlay + inert, not `<dialog>`" and its "prev/next → `router.replace`" are both superseded by the probe. PITFALLS 16's React version split is resolved (19.3.1 installed; Jest sees `ViewTransition`).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Playwright WebKit 27.2 on Windows predicts Safari 26 for VT pairing, dialog and replaceState | Spike | A Safari-only difference ships unnoticed. Mitigation: Tim checks on a real Safari or iPhone at UAT (manual item) |
| A2 | The removeChild error comes from drei `<Html>` during the toggle | Pitfall 8 | The fix misses it; the e2e console assertion catches it either way |
| A3 | `dynamicParams = false` yields a server-rendered 404 for unknown slugs | Pattern 1 | Same empty-shell issue as EDGE-01; the e2e check exposes it |
| A4 | The root crossfade per prev/next step is acceptable or tunable in CSS | Pitfall 3 | Visual noise on rapid stepping; the UI-SPEC can null `::view-transition-*(root)` for steps |
| A5 | `restoreFocus()` to the *current* photo's tile satisfies LBOX-03 | Pattern 4 | Tim may want the original opener; a one-line change |

## Open Questions

1. **D-08 says the full page uses `router.replace` for prev/next. The probe shows that is intercepted.**
   - What we know: all three engines open the modal over the full page, with the URL and content out of sync. `history.replaceState` works on both surfaces.
   - Options for Tim:

     | Option | Pros | Cons |
     |---|---|---|
     | A. `replaceState` on both surfaces (recommended) | No intercept, no remount, focus kept, no server trip | `useParams` is stale (use `usePathname`); set `document.title` in an effect |
     | B. `replaceState` on the full page only, `router.replace` in the modal | Closer to ARCH §2 | Modal remounts per step (focus jumps, zoom resets); cross-morph handling still needed |
     | C. Full page prev/next as hard navigations (`<a href>`) | Trivial | Full reload per photo, nav flash |
   - Recommendation: A. The planner adds a `checkpoint:decision` for Tim, because D-08 is locked.
2. **After prev/next, should focus return to the opener or to the current photo?** Recommendation: the current photo (it matches the visible state). Settle it in the UI-SPEC.
3. **Map contour LOD:** D-01 names `contours-hero` (100 m), but a `map` LOD (50 m, `terrain.assets.contours.map`) exists [VERIFIED: data/generated/terrain.ts]. Settle it in the UI-SPEC (density at 375 px vs 1440 px).
4. **Wrap at the ends?** This is Claude's discretion. Recommend wrapping with the "n / 4" counter (the probe used wrapping without issue). The UI-SPEC decides.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build/test | ✓ | 24.x (engines) | — |
| Chromium (Playwright) | e2e | ✓ | 156.0.8078.4 | — |
| Firefox (Playwright) | e2e (CI project) | ✓ | 157.0 | — |
| WebKit (Playwright) | local Safari approximation | ✓ (installed this session) | 27.2 (v2370) | Real Safari by Tim |
| Python | ui-ux-pro-max search | ✓ | python | Quick Reference only |
| gh CLI | visual baselines dispatch | per memory (used since 07-11) | — | — |

**Missing dependencies with no fallback:** none. Note that the `webkit` Playwright project exists only locally (CI skips it), so WebKit checks stay local or manual.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.4.2 (next/jest, jsdom 26.1.0) + Playwright 1.64.0 (`chromium`, `firefox`, local `webkit`, `visual-dark`, `visual-light`) |
| Config files | `jest.config.js`, `jest.setup.js`, `playwright.config.ts` |
| Quick run command | `npx jest lib/__tests__/photos components/photos --silent` (plus `npm run lint && npm run type-check`) |
| Full suite command | `npm run lint && npm run type-check && npm test && npx playwright test --project=chromium --project=firefox` (`PW_PROD=1` for production parity) |
| Visual (CI only) | `gh workflow run visual-baselines.yml --ref ci/10-NN -f suite=visual -f update_mode=changed`; Tim commits the PNGs |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PHOTO-01 | `/photos` with no `?view` shows the map; 4 pin links in altitude order with names; summit not a link; Riffelsee "approx." dashed; Tab reaches every pin | e2e + unit (`parseView`) | `npx playwright test e2e/photos.spec.ts -g map --project=chromium` | ✅ rewrite `e2e/photos.spec.ts` |
| PHOTO-01 | Label layout: no overlaps at 375/768/1440, reading order, inside the sheet | unit | `npx jest lib/__tests__/photos-label-layout` | ❌ Wave 0 |
| PHOTO-02 | Switch views via the control; URL `?view=`; `history.length` unchanged; reload keeps the view; Back from the lightbox restores the view | e2e | `npx playwright test e2e/photos.spec.ts -g view` | ✅ rewrite |
| PHOTO-02 | Justified rows: equal heights per row ±1 px, true ratio ±1%, no horizontal overflow at 375; CLS < 0.1 | unit (`justify`) + e2e | `npx jest lib/__tests__/photos-justify`; `npx playwright test e2e/design-system.spec.ts -g "layout shift"` | ❌ / ✅ extend |
| PHOTO-02 | Stepper under reduced motion / no WebGL: no `canvas`, no three.js request | e2e | `npx playwright test e2e/no-webgl.spec.ts -g photos` | ✅ rewrite the photos test |
| PHOTO-03 | Same slug order in the map, grid, carousel and viewer counter | unit + e2e | `npx jest lib/__tests__/photos-view-model` | ❌ Wave 0 |
| PHOTO-04 | No timer: front frame unchanged after 6 s idle; keys scoped (←/→ inside the open lightbox don't change the carousel) | e2e `@chromium-only` | `npx playwright test e2e/photos-carousel.spec.ts --project=chromium` | ❌ Wave 0 |
| LBOX-01 | Direct load → full page (nav + footer, no dialog); grid click → dialog with URL `/photos/<slug>`; Back closes; Forward reopens; reload in the lightbox → full page; **Home waypoint → full page (no dialog)**; **full page Next → no dialog** | e2e | `npx playwright test e2e/photos-lightbox.spec.ts` | ❌ Wave 0 |
| LBOX-02 | ←/→, ‹ ›, swipe (touch emulation) step; counter "n / 4"; `history.length` constant over 3 steps; focus stays on Next | e2e | same file `-g step` | ❌ Wave 0 |
| LBOX-03 | Tab ×N stays in the dialog (chromium, firefox, local webkit); Escape layering callout → zoom → close; focus returns to `[data-photo-id]` | e2e | same file `-g focus` | ❌ Wave 0 |
| LBOX-03 | Scroll lock keeps the header box (G3) | e2e `@chromium-only` | `npx playwright test e2e/design-system.spec.ts -g "scroll lock"` | ✅ rewrite opener (no "View details for" button) |
| LBOX-04 | Strip fields per photo; film scan shows "Film scan · 2019" and "±100 m (approx.)"; no filler strings; `formatExposureTime` WR-04 | unit + component | `npx jest lib/__tests__/photo-format components/photos` | ✅ extend / ❌ |
| LBOX-05 | Hotspot buttons `aria-expanded`; Enter expands, Esc collapses and refocuses; H toggles `aria-pressed`; preference survives reload; no storage → on | component + e2e | `npx jest components/photos/__tests__/hotspots`; e2e `-g hotspot` | ❌ Wave 0 |
| LBOX-06 | Chromium: opening from the grid records `::view-transition-group(photo-<slug>)` (`startViewTransition` wrapper); reduced motion: no running VT animations; no duplicate-name console errors | e2e `@chromium-only` | `npx playwright test e2e/photos-lightbox.spec.ts -g morph --project=chromium` | ❌ Wave 0 |
| LBOX-07 | "© 2021 Tim Lui, all rights reserved" (2019 for the scan); no download link/button; no `contextmenu` prevention | component + e2e | `npx jest components/photos` | ❌ Wave 0 |
| cross | Grid test rewritten: captions instead of '1 hotspots'; Home WaypointCard href `/photos/<slug>` | component | `npx jest components/__tests__/GalleryGrid components/home` | ✅ rewrite |
| cross | No `removeChild` console error across view switches (dev server) | e2e | `npx playwright test e2e/photos.spec.ts -g console` | ❌ Wave 0 |
| cross | Visual: photos ×3 widths (map default) + lightbox shots | visual (CI) | dispatch `suite=visual` | ✅ rewrite photos block (keep count ≥) |

**Manual-only (justified):** a real Safari 26 or iOS check of the morph, dialog focus and swipe (Playwright WebKit is not Safari, A1); real-device pinch while zoomed; Tim committing the visual PNGs; Tim's decision on Open Question 1.

### Sampling Rate
- **Per task commit:** the quick Jest run + `npm run lint && npm run type-check`
- **Per wave merge:** full local suite with `PW_PROD=1` (plus `--project=webkit` locally for the lightbox specs), then push `ci/10-NN` and dispatch the visuals
- **Phase gate:** CI green (Lint, Unit + test-count ratchet, E2E chromium + firefox, Visual), Tim's PNG commit, then `/gsd-verify-work`; raise the ratchet at phase close with `node scripts/guards/test-count.mjs --update`

### Wave 0 Gaps
- [ ] `jest.setup.js`: `HTMLDialogElement.prototype.showModal/close` stubs (jsdom 26.1 lacks them)
- [ ] `e2e/helpers/view-transitions.ts`: an init script wrapping `document.startViewTransition` that records the pseudo-elements at `ready` (the probe's recorder)
- [ ] `lib/__tests__/photos-view-model.test.ts`, `photos-justify.test.ts`, `photos-label-layout.test.ts`, `photos-view-param.test.ts`
- [ ] `e2e/photos-lightbox.spec.ts`, `e2e/photos-carousel.spec.ts`
- [ ] Replacement tests for the deleted `ImageDetailModal.test.tsx` (3) and the "legacy bridge" block (6) before deleting them (ratchet total ≥ 966)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | `slug` matched against the 4 known slugs (`notFound()` / `dynamicParams=false`); `?view=` whitelisted by `parseView`; `replaceState` and `router.*` only ever get URLs built from known slugs (the Next docs warn about untrusted URLs) |
| V6 Cryptography | no | — |
| V8 Data Protection (privacy) | yes | Coordinates shown at 4 dp (locked); the film scan shown approximate with its radius; only metadata-free derivatives are served (served-image guard); no originals or download button |
| V14 Config | yes | No CSP change needed: same-origin images, inline styles allowed |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect or `javascript:` via router/history calls | Tampering | Build hrefs from data only; never from query or user input |
| Reverse tabnabbing on editorial fact links | Tampering | `rel="noopener noreferrer"` on external links (Wikipedia, swisstopo) |
| `localStorage` throws (Safari private mode, blocked storage) | DoS (UI) | try/catch on every read and write; default on (D-10) |
| EXIF/GPS leak through a new image path | Information disclosure | Only `imageManifest` derivatives; the served-image guard in lint |

## Sources

### Primary (HIGH confidence)
- Local probe (this session): Next 16.4.2 / React 19.3.1 from the repo `node_modules`, Playwright 1.64 Chromium 156, Firefox 157 and WebKit 27.2. Specs: `probe.spec.ts`, `history.spec.ts`, `esc.spec.ts`, `scroll.spec.ts` (session scratchpad, not committed)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/intercepting-routes.md`, `parallel-routes.md`, `default.md`, `02-route-segment-config/dynamicParams.md`
- `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md`, `02-components/link.md`, `01-getting-started/04-linking-and-navigating.md`
- Next source: `dist/lib/generate-interception-routes-rewrites.js`, `dist/shared/lib/router/utils/interception-routes.js`, `dist/client/components/router-reducer/compute-changed-path.js`, `dist/client/components/app-router-state.js`
- Repo files read: `10-CONTEXT.md`, `REQUIREMENTS.md`, `STATE.md`, `research/ARCHITECTURE.md` §2/§7, `research/FEATURES.md` PHOTO/LIGHTBOX, `research/PITFALLS.md` 16/23/24/28, `data/generated/{photos,terrain,image-manifest}.ts`, `data/photos/editorial.ts`, `data/landscapes.ts`, `lib/ascent/waypoints.ts`, `lib/photo-format.ts`, `lib/useAscentMode.ts`, `components/{PhotosPageClient,ImageDetailModal,PhotoCarousel3D}.tsx`, `components/home/{WaypointCard,PosterSheet}.tsx`, `components/terrain/ContourField.tsx`, `app/globals.css`, `e2e/{photos,design-system,no-webgl}.spec.ts`, `playwright.config.ts`, `scripts/guards/test-count.*`, `public/service-worker.js`, `proxy.ts`

### Secondary (MEDIUM confidence)
- ui-ux-pro-max (this session): ux "Focus States", "Auto-Rotating Content Controls", "Dragging Movements", "Gesture Conflicts", "Focus Not Obscured (Minimum)"; react "Manage focus properly". The nextjs stack DB had no modal or interception entries (two queries, no match)

## Metadata

**Confidence breakdown:**
- Routing / interception / popstate: HIGH. Measured in 3 engines and backed by the Next source.
- Dialog + VT: HIGH for Chromium and Firefox, MEDIUM for Safari 26 (A1).
- Layout patterns (justify, label stacking, zoom-as-scroll): MEDIUM. Standard techniques, not probed.
- Carousel removeChild cause: LOW (A2).

**Research date:** 2026-10-26
**Valid until:** 2026-11-25. Re-probe if Next goes past 16.4.x or React past 19.3.x: the interception and replaceState sync are internal behaviours.
