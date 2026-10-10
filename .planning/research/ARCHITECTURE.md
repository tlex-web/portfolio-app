# Architecture Research

**Domain:** Next.js 16 App Router portfolio, v2.0 "Topographic Identity" (UI/UX rework, with build-time terrain and EXIF pipelines added to an existing shipped app)
**Researched:** 2026-10-10
**Confidence:** MEDIUM-HIGH overall. Next.js behaviour was checked against the official docs, version-stamped 16.4.0 (route groups, not-found, parallel/intercepting routes, default.js, CSP, view transitions). React 19.3 exports were checked by unpacking the npm tarball. Repo facts come from reading the code. The research seam rates the `webfetch` provider tier LOW, but every Next/Tailwind claim below cites an official doc page, so those claims are treated as verified. Items marked **[SPIKE]** are inferences that are not yet verified and need a prototype in their phase.

> Scope: only what the NEW v2.0 capabilities need. Locked decisions (tokens v2 + v1 aliases, no `dark:`/stock palette, `(site)` route group, DEM/EXIF build pipeline, R3F terrain, photo views + lightbox + View Transitions, typed highlights, framer-motion 14 first, no GSAP) are taken as given. This document is about how to integrate them.

---

## 0. Repo facts that shape the integration (verified by reading code)

| Fact | Where | Consequence for v2 |
|------|-------|--------------------|
| `node_modules` is stale against the lockfile (installed next 16.1.6 / react 19.2.4; lockfile next 16.2.6 / react 19.2.6) | `package-lock.json` vs `node_modules/*/package.json` | Run `npm ci` before taking baselines, or the baselines are taken against the wrong versions |
| **`<ViewTransition>` needs React 19.3.** The Next 16.4 guide says: "React 19.3 includes the `<ViewTransition>` component and `addTransitionType`". Confirmed: `react@19.3.0` exports `ViewTransition` and `addTransitionType`. The installed React does not | `package.json` `react ^19.2.6` | **A React 19.3 + Next 16.4 bump is a prerequisite for Phase 10.** It needs its own isolated upgrade step, the same treatment as framer-motion. R3F 9.8.1 peer range is `react >=19 <19.4`, so this is compatible |
| `app/page.tsx`, `projects`, `roadmap`, `contact`, `offline` pages are all `'use client'` | `app/*/page.tsx` | They cannot export `metadata`. Only the root layout has metadata today. v2 must turn pages into Server Components with client islands |
| Every page renders its own `<Header/>` (9 files) or `GlassmorphismNav` (inside `Hero3DMountain`) plus `<Footer/>` (10 files) | `app/**/page.tsx` | The `(site)` layout move must remove these per-page imports in the same commit, or the nav renders twice |
| Root `await headers()` forces dynamic rendering for the whole tree | `app/layout.tsx:34` | Keep it at the root. Everything stays dynamic, including `not-found`, `global-error` and the `(site)` group |
| CSP: `style-src 'self' 'unsafe-inline'`, `img-src 'self' blob: data:`, `connect-src 'self' https://raw.githubusercontent.com`. Proxy matcher runs on everything except `api`, `_next/static`, `_next/image`, `favicon.ico`, `service-worker.js` | `proxy.ts` | Same-origin terrain assets are allowed. Inline `style={{maskImage}}` and `viewTransitionName` are allowed. The proxy currently runs on `/images/*` and would run on `/terrain/*` too, so exclude both |
| ESLint flat config extends only `prettier`. `eslint-config-next` is installed but **not used**, so jsx-a11y is not active | `eslint.config.mjs` | Phase 7: add `eslint-config-next` (core-web-vitals) before the a11y-heavy rework |
| CI runs Node **20**, which reached EOL on 2026-04-30. Local is Node 24 | `.github/workflows/ci.yml` | Move CI to Node 24 (matches local and Vercel). This also enables native TS type-stripping for the new generator scripts |
| CI `lint-and-typecheck` runs `tsc` **without** `prebuild` | `ci.yml` | Generated `.ts` data must be **committed**, or `type-check` fails |
| `postbuild` runs `verify-contrast.mjs`, which uses a **hand-maintained hex table** | `scripts/verify-contrast.mjs` | The table drifts from the tokens. Rewrite it to parse `globals.css` (section 4) |
| `inject-build-hash.mjs` rewrites `public/service-worker.js` in place. SW precaches only `['/', '/offline']` | `public/service-worker.js:82` | Designed offline/404 pages need their contour asset precached. Extend the injection to a generated asset list |
| v1 has a custom `--color-amber-*` that **shares the name of Tailwind's stock `amber`** | `app/globals.css:52-54` | The guard regex has to tell v1 `amber-400/500/600` apart from stock amber. Renaming it in v2 (e.g. `caution`) removes the ambiguity |
| Already-dead components (zero importers): `Hero3DSection`, `ProgressiveImage`, `TerminalDemo`, `ZoomableImage` | usage scan | Delete in Phase 7. No risk |
| Playground-only components: `ParticleButton`, `TransitionShowcase`, `ShaderTransition`. `AnimatedGradientMesh` is also used by `contact` | usage scan | Delete the playground routes **early** (Phase 7), so the token sweep doesn't migrate files that are about to be deleted |

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ BUILD-TIME (offline, manual, outputs committed)                                    │
│  swissALTI3D tiles (.cache/dem, gitignored) ─► scripts/terrain/build-terrain.ts    │
│      ├─► public/terrain/heightmap.<hash>.png   (terrain-RGB encoded)               │
│      ├─► public/terrain/hillshade.<hash>.webp  (static fallback / poster)          │
│      ├─► public/terrain/contours-{hero,map,strip}.<hash>.svg  (d3-contour)         │
│      └─► data/generated/terrain.ts  (bbox, size, min/max m, interval, paths, route)│
├──────────────────────────────────────────────────────────────────────────────────┤
│ BUILD-TIME (prebuild / CI, cheap + deterministic, outputs committed, --check)     │
│  assets/photos-original/*.jpg ─► scripts/photos/extract-exif.ts (+ terrain.ts)     │
│      └─► data/generated/photo-meta.ts (EXIF, capturedAt, gps, terrainUV, w/h, blur)│
│  app/globals.css ─► scripts/tokens/tokens.ts ─► contrast gate + data/generated/tokens.ts │
│  app/ components/ data/ ─► scripts/tokens/check-design-tokens.mjs (dark:/stock gate)│
├──────────────────────────────────────────────────────────────────────────────────┤
│ DATA LAYER (typed, server-imported)                                                │
│  data/schemas.ts (zod; types via z.infer) ◄── data/site.ts  data/photos.ts         │
│                                               data/projects.ts  data/roadmap.ts    │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ROUTES  app/layout.tsx (html/body, fonts, headers(), SW, analytics)                │
│   ├─ app/not-found.tsx · app/global-error.tsx   (render <SiteChrome> themselves)   │
│   └─ app/(site)/layout.tsx  ── SiteNav · <main id="main-content"> · SiteFooter     │
│        ├─ page.tsx (Home: AscentHero)      ├─ projects/ · projects/[slug]/         │
│        ├─ photos/layout.tsx {children, @modal}  ├─ roadmap/ · contact/ · offline/  │
│        │    ├─ page.tsx (?view=map|grid|carousel)   ├─ error.tsx · not-found.tsx    │
│        │    ├─ [id]/page.tsx (full gallery-black page, deep link / refresh)        │
│        │    └─ @modal/{default,page}.tsx → null · @modal/(.)[id]/page.tsx (Lightbox)│
├──────────────────────────────────────────────────────────────────────────────────┤
│ CLIENT ISLANDS (only where interaction/WebGL is needed)                            │
│  SiteNav · TerrainStage→(dynamic, ssr:false) TerrainCanvas · AltimeterRail ·       │
│  PhotoViews · Lightbox · DemoTerminal · RoadmapFilters · SummitRegister form       │
├──────────────────────────────────────────────────────────────────────────────────┤
│ SHARED VISUAL PRIMITIVES (server, zero JS)                                         │
│  ContourField (CSS mask of contours SVG) · TerrainFallback (hillshade+contours) ·  │
│  TrailGradeMark · OffTrail (404/offline/error body)                                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation | New/Mod/Del |
|-----------|----------------|----------------|-------------|
| `app/(site)/layout.tsx` | One nav and footer for every content route; `<main id="main-content" tabIndex={-1}>`; MotionProvider | Server Component | **NEW** |
| `components/site/SiteNav.tsx` | Single nav (replaces `Header` and `GlassmorphismNav`). Fixed position; transparent over the Home hero; skip link; `viewTransitionName: 'site-nav'` keeps it anchored | Client (pathname for active link, scroll state) | **NEW** |
| `components/site/SiteFooter.tsx` | Identity, real links, "© swisstopo" attribution, ContourField strip | Server | **MOD** (rename of `Footer.tsx`, drops framer-motion) |
| `components/site/SiteChrome.tsx` | `SiteNav + main + SiteFooter` wrapper, reused by `(site)/layout` **and** root `not-found`/`global-error` | Server | **NEW** |
| `data/site.ts` | Single source for identity ("Tim Lui"), nav links, social links, metadata base | Static TS | **NEW** |
| `components/terrain/AscentHero.tsx` | Scroll track + sticky stage; server-rendered fallback (LCP) + accessible waypoint list | Server | **NEW** (replaces `Hero3DMountain`) |
| `components/terrain/TerrainStage.tsx` | Capability decision, `useScroll` source, offscreen pause, dynamic import of canvas | Client | **NEW** |
| `components/terrain/TerrainCanvas.tsx` (+ `TerrainMesh`, `contourMaterial.ts`, `CameraRig`, `Waypoints3D`) | R3F scene, `frameloop="demand"`, contour shader | Client, `dynamic(..., {ssr:false})` only | **NEW** (replaces `MountainTerrain3D`) |
| `components/terrain/AltimeterRail.tsx` | 1,626 m → 4,478 m readout bound to the same scroll MotionValue | Client | **NEW** |
| `components/terrain/ContourField.tsx` / `TerrainFallback.tsx` | Shared contour surface (hero fallback, photo Map, footer, 404/offline) | Server | **NEW** (replaces `ContourBackground`) |
| `app/(site)/photos/layout.tsx` | Renders `{children}{modal}`; marks gallery `inert` while modal active | Server + tiny client wrapper | **NEW** |
| `components/photos/PhotoViews.tsx` | Map / Grid / Carousel switch driven by `?view=`; same-route crossfade | Client | **NEW** (replaces `PhotosPageClient`) |
| `components/photos/Lightbox.tsx` | Overlay shell: role=dialog, focus, Escape/close → `router.back()`, prev/next → `router.replace` | Client | **NEW** (replaces `ImageDetailModal`) |
| `components/photos/PhotoViewer.tsx` (+ `ExifStrip`, `Hotspot`) | Gallery-black photo + EXIF strip + hotspot callouts; shared by modal and full page | Server-renderable | **NEW** (`Hotspot` from `InteractiveHotspot`) |
| `components/projects/RoutePanel.tsx` | Project index panel | Server | **NEW** (replaces `ProjectCard`) |
| `components/projects/CaseStudy.tsx` + `blocks/*` | Case-study template; block renderer driven by the typed highlight union | Server (terminal is a client island) | **NEW** (replaces `ProjectHighlights`, `FeatureShowcase`) |
| `components/projects/TrailGradeMark.tsx` + `lib/trail-grade.ts` | Risk → trail grade mapping, used everywhere (terminal, case study, legend) | Server + pure fn | **NEW** |
| `components/roadmap/RouteLog.tsx` | Route-log roadmap | Server + filter island | **MOD** (`RoadmapTimeline`/`RoadmapProgress` restyle) |
| `components/contact/SummitRegister.tsx` | Contact page form | Client | **MOD** (`FeedbackForm` restyle; keep API/CSRF wiring) |
| `components/edge/OffTrail.tsx` | Body shared by 404 / offline / error | Server | **NEW** |

---

## Recommended Project Structure

```
app/
├── layout.tsx                 # MOD: metadata {title template, metadataBase}, keep await headers()
├── globals.css                # MOD: tokens v2 + v1 aliases, motion tokens, VT CSS, visible scrollbar
├── not-found.tsx              # MOD: <SiteChrome><OffTrail kind="404"/></SiteChrome>
├── global-error.tsx           # NEW: own <html><body>, static OffTrail, no motion
├── api/feedback/route.ts      # unchanged
└── (site)/
    ├── layout.tsx             # NEW: <SiteChrome>{children}</SiteChrome> + MotionProvider
    ├── page.tsx               # MOVED from app/page.tsx; becomes Server Component
    ├── error.tsx              # MOVED from app/error.tsx (renders inside chrome)
    ├── not-found.tsx          # NEW: for notFound() in [slug]/[id] (inside chrome)
    ├── photos/
    │   ├── layout.tsx         # NEW: {children}{modal}
    │   ├── page.tsx           # MOVED+MOD: server, reads searchParams.view
    │   ├── [id]/page.tsx      # NEW: full gallery-black page + generateMetadata
    │   └── @modal/
    │       ├── default.tsx    # NEW: return null  (REQUIRED, see section 2)
    │       ├── page.tsx       # NEW: return null  (closes modal on Link to /photos)
    │       └── (.)[id]/page.tsx  # NEW: <Lightbox><PhotoViewer/></Lightbox>
    ├── projects/page.tsx      # MOVED+MOD: server, RoutePanels (hex grid retired)
    ├── projects/[slug]/page.tsx  # MOVED+MOD: <CaseStudy/> + generateMetadata
    ├── roadmap/page.tsx       # MOVED+MOD
    ├── contact/page.tsx       # MOVED+MOD
    └── offline/page.tsx       # MOVED+MOD: Server Component, zero client JS
components/
├── site/       SiteNav, SiteFooter, SiteChrome, SkipLink
├── terrain/    AscentHero, TerrainStage, TerrainCanvas, TerrainMesh, contourMaterial.ts,
│               CameraRig, Waypoints3D, AltimeterRail, AscentScrollProvider,
│               ContourField, TerrainFallback, useTerrainCapability.ts, useHeightmap.ts
├── photos/     PhotoViews, PhotoMap, PhotoGrid, PhotoCarousel, Lightbox, PhotoViewer, ExifStrip, Hotspot
├── projects/   RoutePanel, CaseStudy, blocks/{Metrics,RiskScale,Pricing,Stack,List}Block, TrailGradeMark, DemoTerminal
├── roadmap/    RouteLog, RoadmapFilters
├── contact/    SummitRegister
├── edge/       OffTrail
└── providers/  MotionProvider
data/
├── schemas.ts                 # NEW: zod schemas = source of truth; types via z.infer
├── types.ts                   # MOD: re-export inferred types; HighlightValue removed
├── site.ts                    # NEW: identity + links
├── landscapes.ts              # MOD: editorial only (title, story, alt, annotations, overrides)
├── photos.ts                  # NEW: merge landscapes + generated photo-meta → Photo[]
├── projects.ts                # MOD: typed highlight blocks
└── generated/                 # NEW, committed, "AUTO-GENERATED — do not edit" header
    ├── terrain.ts  photo-meta.ts  tokens.ts
lib/
├── animations.ts              # MOD: keep path (24 importers); add CSS-var helpers
├── trail-grade.ts             # NEW
└── (useHexGrid.ts, useGlowIntensity.ts DELETED)
scripts/
├── optimize-images.mjs        # MOD: drop legacy -thumb/-medium/-large handling
├── terrain/build-terrain.ts   # NEW (manual: npm run terrain)
├── photos/extract-exif.ts     # NEW (prebuild with --check)
├── tokens/tokens.ts           # NEW (replaces verify-contrast.mjs logic; emits tokens.ts)
├── tokens/check-design-tokens.mjs  # NEW (guard)
└── inject-build-hash.mjs      # MOD: also inject precache list of hashed terrain assets
assets/photos-original/        # NEW home for EXIF-bearing originals (moved out of /public)
public/terrain/                # NEW, content-hashed filenames
.cache/dem/                    # gitignored raw swissALTI3D tiles
```

### Structure Rationale

- **`components/<domain>/` folders:** the flat 38-file `components/` mixes dead playground code with live code. Domain folders make the Phase 12 cleanup checkable ("nothing outside these folders").
- **`data/generated/` separate from hand-authored data:** generated files are never edited by hand, carry a header comment, and are checked for drift with `--check`. Editorial facts (story, alt, location overrides) stay in `landscapes.ts`.
- **Keep `lib/animations.ts` at its current path:** 24 files import framer-motion and many import `EASING/DURATION`. Changing the path creates churn for no benefit.
- **Originals out of `/public`:** today the EXIF-bearing originals (`public/images/landscapes/*.jpg`) are publicly served, including GPS. They are build inputs, not web assets.

---

## 1. Route-group layout `app/(site)/`

**Decision:** put **every** content route, Home included, under `app/(site)/`. `app/layout.tsx` stays the single root layout. Do **not** keep Home outside the group: the nav would remount on every Home↔page navigation, and a second nav component would come back.

**How Home keeps a full-bleed hero:** SiteNav is `position: fixed` on every page. The layout adds no top padding. Each non-home page starts with a `PageHeader` that reserves `var(--nav-h)`. The Home hero is `h-svh` under the transparent nav. SiteNav switches from transparent to solid with an IntersectionObserver sentinel at the end of the hero (`data-over-hero`), which avoids pathname branching in the server layout. *(ui-ux-pro-max: "skip to main content link" and "visible focus on every control" are High severity. SiteNav owns the skip link to `#main-content`. Keep `#main-content`, which `e2e/homepage.spec.ts:9` asserts.)*

**Verified Next 16.4 behaviour that matters here:**

| Concern | Behaviour (docs) | Action |
|---------|------------------|--------|
| Full reloads | Happen only when navigating between **different root layouts**. A single root plus a group layout means soft navigations, and the nav persists | None |
| Unmatched URLs | Root `app/not-found.tsx` handles **all** unmatched URLs and renders inside the **root** layout only, **not** inside `(site)/layout` | Root `not-found.tsx` must render `<SiteChrome>` itself. `(site)/not-found.tsx` covers `notFound()` from `[slug]`/`[id]` inside the chrome |
| `global-not-found.js` | Experimental; only needed for **multiple root layouts** | **Do not use** |
| `error.tsx` | Wraps the children of its segment's layout | `(site)/error.tsx` renders inside the nav/footer. Add `app/global-error.tsx` (own `<html>/<body>`) for root-layout failures |
| Conflicting paths | `app/page.tsx` and `app/(site)/page.tsx` both resolve to `/` and error | **Move** (git mv), never copy |

**CSP / `await headers()`:** no change. The root layout keeps `await headers()`, so every route, including root `not-found`/`global-error`, is dynamically rendered and gets nonces. The CSP guide confirms nonces need dynamic rendering for all pages and that PPR/`cacheComponents` is **incompatible** with nonce CSP. Do not enable `cacheComponents` in v2. Two proxy changes:
1. Add `images|terrain` to the matcher exclusion, so static assets don't invoke the proxy.
2. Keep `style-src 'unsafe-inline'`: Motion, `maskImage` inline styles and React's `viewTransitionName` styles depend on it. Note in PITFALLS that moving to `style-src 'nonce-…'` would break them.

**Metadata:** root `metadata = { metadataBase, title: { default: 'Tim Lui: Photography & Engineering', template: '%s · Tim Lui' }, description, openGraph }`. Every page exports `metadata` or `generateMetadata` (`projects/[slug]`, `photos/[id]` with OG image = photo). For that, `page.tsx` files must stop being `'use client'`. Next's route announcer reads `document.title` first, so unique titles also fix screen-reader route announcements.

**What breaks, and how to handle it:**

| Area | Breakage | Fix |
|------|----------|-----|
| Imports | None from the move itself (`@/` alias, route-group folders are transparent to TS/Jest) | Remove `Header`/`Footer` imports from the 10 pages in the same commit |
| `app/page.tsx` `'use client'` + `Hero3DMountain` contains `GlassmorphismNav` | Double nav once the layout adds SiteNav | Phase 7: temporarily strip `GlassmorphismNav` from `Hero3DMountain`. Phase 9 replaces the hero |
| Jest | `collectCoverageFrom: 'app/**'` still matches. `ProjectCard.test`, `GalleryGrid.test` are bound to retired components | Rewrite them alongside their replacements in Phases 10/11 (rewrite, don't delete, per the PROJECT mandate) |
| E2E `homepage.spec` | Nav link names (`/Home/`, `/Photos/`, `/Projects/`) match `.first()`. Fine if SiteNav keeps those labels | Keep the labels or update the spec |
| E2E `photos.spec` | Heading "Landscape Gallery", buttons "View details for", "3D Carousel", `getByRole('dialog')` | Phase 10 rewrite: thumbnails become **links** (`/photos/[id]`), so assert `toHaveURL`, back closes, Escape closes, deep link renders the full page |
| E2E `projects.spec` | Heading "Programming Projects", links "View details for" | Keep the accessible name pattern on RoutePanel, or update |
| E2E `contact-form.spec` | Heading "Get in Touch", textbox "Email", button "Send Message", a checkbox | Keep the labels in SummitRegister (copy can change, but the accessible names are a contract) |
| Service worker | Precaches `'/'`, `'/offline'`; offline HTML references contour asset | Extend the precache list with hashed `/terrain/contours-strip.*.svg` via `inject-build-hash.mjs` |

---

## 2. Lightbox routing: intercepting + parallel routes (recommended) vs client state

**Recommendation: intercepting + parallel routes, scoped to `photos/layout.tsx`.**

| Criterion | `@modal` + `(.)[id]` intercept | Client state (`?photo=id` or `useState`) |
|-----------|-------------------------------|-------------------------------------------|
| Shareable URL `/photos/[id]` | Yes; refresh/deep link renders the **full page** (docs) | `?photo=` yes; `useState` no |
| Back closes, forward reopens | Built in (docs list exactly this) | `?photo=` yes, with manual history; `useState` no |
| Per-photo `generateMetadata`/OG | Yes (full page) | No |
| View Transitions | Route navigation **is** a transition, so `<ViewTransition>` fires automatically | Must wrap `setState` in `startTransition` |
| Complexity | 4 extra files, `default.tsx` mandatory, interception rules | Lowest |
| Fit with Map/Grid/Carousel `?view=` | `/photos?view=map` → modal → back restores `?view=map` | Same |

**File layout and rules (Next 16.4 docs):**
- `photos/@modal/default.tsx → null`. **Mandatory.** In 16.x a missing `default.js` for a named slot **errors** on hard navigation instead of returning 404.
- `photos/@modal/page.tsx → null`. Soft navigation to a URL that no longer matches the slot leaves the modal **visible**, so `/photos` must match a null page. Navigations to other sections unmount `photos/layout`, so no `[...catchAll]` is needed. This is an advantage of scoping the slot to photos rather than to `(site)`.
- `(.)[id]`: `(.)` counts **route segments**. `@modal` slots and `(site)` groups are not segments, so `(.)` from inside `photos` targets `/photos/[id]`.
- Interception only applies to soft navigation **from** the photos subtree. From Home (waypoint click) the user lands on the full `/photos/[id]` page. That is the desired behaviour: a waypoint is a destination, not an overlay. **[SPIKE]** confirm in Phase 10 (this depends on Next's `Next-Url`-based interception rewrite).

**Lightbox shell: overlay + `inert`, not `<dialog>.showModal()`.** `<dialog>` puts content in the browser top layer, and `showModal()` has to run in an effect after React's commit. A View Transition captures the new state at commit time, so the modal target would still be closed and the shared-element pair would not form. **[SPIKE]** If a `useLayoutEffect` + `showModal()` prototype morphs correctly, `<dialog>` is fine. Otherwise use:
- `<div role="dialog" aria-modal="true" aria-labelledby>`, fixed, gallery-black.
- `inert` on the gallery wrapper (photos layout reads `usePathname()`) and on `#site-nav`/`#site-footer` while open.
- Focus the close button on mount. On unmount, restore focus to `[data-photo-id="…"]` in the still-mounted grid.
- Escape / close button → `router.back()` (a modal implies in-app history, because deep links render the full page).
- Prev/next → `router.replace('/photos/<id>', { scroll: false })`, so Back exits the lightbox instead of stepping back through every photo.
- Thumbnail `<Link scroll={false}>` to stop the grid jumping when the slot renders. **[SPIKE]**
- Lock scroll with `overflow: hidden` on `<html>`, plus `scrollbar-gutter: stable` (v2 makes scrollbars visible, so hiding them would shift layout).
*(ui-ux-pro-max react/a11y: "Focus trap in modals, return focus on close" is High severity. The nextjs-stack DB had no modal/lightbox entries; this falls back to the Next docs.)*

**View Transitions interplay (verified constraints + design):**
- `name` must be **unique among mounted elements app-wide**. With an intercepted modal the grid **stays mounted**, so the thumbnail and modal image would both carry `photo-<id>`, which is an error. A pair only forms when one boundary is **deleted** and the other **inserted**. Pattern:
  ```tsx
  // PhotoGrid (client): activeId from usePathname() → '/photos/<id>'
  {p.id === activeId
    ? <Thumb photo={p} />                                   // boundary removed → "deleted" side
    : <ViewTransition name={`photo-${p.id}`} share="morph" default="none"><Thumb photo={p} /></ViewTransition>}
  // PhotoViewer (modal + full page)
  <ViewTransition name={`photo-${id}`} share="morph" default="none"><Image … /></ViewTransition>
  ```
- **Requires React 19.3** (`import { ViewTransition } from 'react'`) and Next ≥16.4 for `Link transitionTypes`.
- Pairs don't form if either side is **offscreen**. Map-view markers have no image, so Map → lightbox does a plain enter animation. That is acceptable.
- **Back button:** the Next guide says the shared morph still applies on browser back. React's docs say animations are **skipped for legacy `popstate`** navigations. `router.back()` is a popstate. **[SPIKE]** Plan for "open morphs, close may be instant". Don't build the close interaction around an animation.
- SiteNav carries `viewTransitionName: 'site-nav'` with `animation: none` so it never slides. Add `::view-transition { pointer-events: none }` and the reduced-motion block (section 7).
- Grid/Map/Carousel switching: `router.replace('?view=map', { scroll: false })` is a transition. Wrap the view in `<ViewTransition key={view} name="photo-view" share="auto" enter="auto" default="none">` for the "same place, different content" crossfade. Don't use page-level Motion `AnimatePresence` alongside route VTs.

---

## 3. Generated data: location, typing, ordering, commit policy

| Output | Location | Why | Consumer |
|--------|----------|-----|----------|
| Photo facts (EXIF, `capturedAt`, GPS, altitude, `terrainUV {u,v}`, ground elevation, width/height, `blurDataURL`) | `data/generated/photo-meta.ts` | Small, structured, type-checked by `tsc`, tree-shaken, zero requests | `data/photos.ts` → pages |
| Terrain metadata (LV95 bbox, grid size, min/max m, contour interval, hashed asset paths, camera route points, waypoint UVs) | `data/generated/terrain.ts` | One coordinate contract shared by shader, SVG map and EXIF projection | TerrainCanvas, PhotoMap, ContourField, extract-exif |
| Heightmap | `public/terrain/heightmap.<hash>.png`, **terrain-RGB encoded** (`h = -10000 + (R·65536 + G·256 + B)·0.1`) | Browsers decode PNG to 8-bit/channel. A 16-bit grayscale PNG loses precision (≈11 m steps over 2,852 m), and terrain-RGB keeps 0.1 m | TerrainCanvas only (client) |
| Hillshade poster | `public/terrain/hillshade.<hash>.webp` (computed from the same DEM with sharp) | Static fallback looks like the 3D terrain without needing headless WebGL | TerrainFallback (LCP) |
| Contours | `public/terrain/contours-{hero,map,strip}.<hash>.svg` (d3-contour, coordinates rounded, LODs by interval) | Cacheable, zero JS, colourable via CSS `mask-image` | ContourField, PhotoMap, footer, 404/offline |
| Token mirror (sRGB hex for WebGL/canvas) | `data/generated/tokens.ts` | Shaders can't read OKLCH CSS vars cheaply, and Tailwind prunes unused theme vars | contourMaterial uniforms |

**Typing:** `data/schemas.ts` (zod 4, already a dependency) is the source of truth. Types come from `z.infer`, and data modules use `satisfies`:
```ts
// data/generated/photo-meta.ts   (AUTO-GENERATED by scripts/photos/extract-exif.ts. Do not edit.)
import type { PhotoMeta } from '@/data/schemas';
export const photoMeta = {
  'img-0605': { capturedAt: '2021-09-06T07:12:31+02:00', camera: 'Canon EOS 6D Mark II', /* … */ terrainUV: { u: 0.41, v: 0.62 } },
} as const satisfies Record<string, PhotoMeta>;
```
Client components use `import type` only, so zod never enters the client bundle. A Jest test (`data/__tests__/schemas.test.ts`) runs `.parse()` over everything for invariants TS can't express: unique ids, `terrainUV` in [0,1], roadmap ids exist. The generators validate their own output with the same schemas before writing.

**Editorial overrides:** `landscapes.ts` keeps `title/story/alt/annotations` and gains `locationOverride?: { name; reason }`. That covers the waterfall: EXIF GPS 46.0081 N 7.7385 E is the gorge, not the Teufelsschlucht. `capturedAt` comes **only** from EXIF, which removes the filename-derived `captureDate` bug.

**Script order and commands:**
```jsonc
"terrain":        "node scripts/terrain/build-terrain.ts",          // MANUAL. Network + heavy. Never in prebuild
"photos:meta":    "node scripts/photos/extract-exif.ts",            // writes data/generated/photo-meta.ts
"prebuild":       "node scripts/optimize-images.mjs && node scripts/photos/extract-exif.ts --check",
"lint":           "eslint . && node scripts/tokens/check-design-tokens.mjs && node scripts/tokens/tokens.ts --check",
"postbuild":      "node scripts/inject-build-hash.mjs"
```
- Dependency order: **terrain → exif** (exif projects GPS into `terrain.ts` UV space and samples ground elevation). `optimize-images` is independent.
- `next dev` stays fast: `dev` runs no generators, and committed outputs mean dev, Jest and `tsc` work on a fresh clone.
- `--check` regenerates in memory and fails on a diff. That catches "changed a photo, forgot to regenerate" without writing during Vercel builds.
- **Commit generated assets.** Reasons: CI `tsc` needs them; Vercel builds must not depend on swisstopo availability; outputs are reviewable; determinism is required anyway (sorted keys, fixed decimals, no timestamps, content-hash filenames).
- Scripts in `.ts` run on Node 24 native type-stripping. That means erasable syntax only, relative imports with explicit `.ts` extension, and `allowImportingTsExtensions` (valid with `noEmit`). Fallback: `tsx`. **Bump CI to Node 24.**
- Cache headers: add `/terrain/:path*` → `public, max-age=31536000, immutable` in `next.config.ts`. This is safe only because filenames are content-hashed.

---

## 4. Tokens v2 migration, guard, contrast

**Layering in `app/globals.css`:**
```css
@import "tailwindcss";

:root {                         /* L1 primitives: always emitted, readable by JS, NO utilities generated */
  --terrain-950: oklch(…); --snow-50: oklch(…); --survey-red: oklch(…); --gallery-black: oklch(0.12 0 0);
  --duration-hover: 350ms; --duration-enter: 450ms; --duration-settle: 500ms;   /* motion (section 7) */
}

@theme {
  --color-*: initial;           /* remove ALL stock palette utilities (bg-gray-*, text-blue-* emit nothing) */
  --color-white: #fff; --color-black: #000;   /* re-add only if still wanted (removed by the wildcard) */
  --ease-geological: cubic-bezier(0.22, 0.61, 0.36, 1);   /* --ease-* namespace → ease-geological utility */
}

@theme inline {                 /* L2 semantic: the ONLY colour utilities components may use */
  --color-surface:       var(--terrain-950);
  --color-surface-raised:var(--terrain-900);
  --color-ink:           var(--snow-50);
  --color-ink-muted:     var(--granite-300);
  --color-contour:       var(--snow-50-a20);
  --color-gallery:       var(--gallery-black);
  --color-trail-t1:      var(--trail-yellow); /* … t23-red, t45-blue */
  /* L3 v1 aliases: exactly one phase, deleted by a codemod at the end of Phase 8 */
  --color-alpine-900: var(--terrain-950);  --color-snow-50: var(--snow-50);  --color-frost-500: …;
}
```
- `@theme inline` is required when a theme var references another var (Tailwind docs). The utility then embeds `var(--terrain-950)` directly.
- Tailwind emits theme vars **only when used** (unless `@theme static`). Anything consumed from JS/shaders must live in `:root` (L1) or come from `data/generated/tokens.ts`. Never read an `@theme`-only var from JS.
- `--color-*: initial` makes stock classes silently produce **no CSS**. That is a safety net, not a gate (it fails silently), so the gate is the script below.

**Mechanical sweep rule (Phase 7)** for the 23 `dark:` files / 29 stock-palette files: in `A dark:B`, **keep B** (that is what dark-OS visitors saw, which matches the dark-only decision) and drop A. Then map the stock colour to the nearest v2 semantic token. This fixes the `text-gray-900` Contact h1 bug as a side effect. Delete the playground routes **before** the sweep.

**Guard: grep script in CI, not an ESLint plugin (primary).**

| | `scripts/tokens/check-design-tokens.mjs` | `eslint-plugin-better-tailwindcss` (`no-unknown-classes`, `no-restricted-classes`) |
|---|---|---|
| Catches strings in object maps (`statusColors = {active: 'bg-green-100 …'}`), `data/*.ts`, CSS `@apply`, template literals | Yes (scans raw text) | Only known call sites (`cn`, `clsx`, `cva`…) by default; plain objects/variables need config |
| Dependencies | 0 | 1 plugin (~850★), Tailwind-v4 entry-point setup |
| Error message | Custom ("use `text-ink` not `text-gray-900`"), file:line | Generic |
| Ratchet support | Easy (allowlist that may only shrink) | No |

Regex sketch: `/\bdark:/` and `/\b(?:bg|text|border|from|via|to|ring|fill|stroke|outline|divide|placeholder|decoration|shadow|accent|caret)-(?:slate|gray|zinc|neutral|stone|red|orange|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|amber)-\d{2,3}\b/`. During the alias phase, allow `amber-(400|500|600)` (the v1 custom family), or better, rename v1 amber → `caution` first. After Phase 8 add v1 names (`alpine|granite|snow|frost|ember|pine|rust`-NNN) to the banned list. Wire the script into `npm run lint`, which CI already runs. ESLint plugin: optional later for class sorting/IDE feedback.

**`verify-contrast.mjs` → `scripts/tokens/tokens.ts`:**
1. Parse `globals.css` (L1 primitives + L2 semantic map), resolve `var()` chains, convert OKLCH → sRGB with `colorjs.io` (new devDep; gamut-map with `toGamut`). This deletes the hand-maintained hex table.
2. Contrast pairs are declared on **semantic** names: `ink/surface`, `ink-muted/surface-raised`, EXIF strip text on `gallery`, focus ring vs surface (3:1, WCAG 1.4.11), trail-grade marks (yellow T1 / red-white / blue-white) vs surface (3:1 non-text). Contours are decorative and exempt.
3. Emit `data/generated/tokens.ts` (hex/linear-RGB for the WebGL contour colour) with `--check` drift mode.
4. Move it from `postbuild` to `lint`. It needs no build, and failing after a 3-minute build is wasted CI time.

---

## 5. Terrain component architecture

```
app/(site)/page.tsx (Server)
└─ AscentHero (Server)  section.relative h-[400svh] ── sticky top-0 h-svh stage
   ├─ TerrainFallback (Server)   hillshade.webp (next/image, priority = LCP) + ContourField(hero)
   ├─ AscentScrollProvider (Client)  useScroll({target: track, offset:['start start','end end']}) → context
   │   ├─ TerrainStage (Client)   capability + inView → dynamic(() => import('./TerrainCanvas'), {ssr:false})
   │   │   └─ TerrainCanvas  <Canvas frameloop={inView ? 'demand' : 'never'} dpr={[1,2]} gl={{alpha:true}}>
   │   │        TerrainMesh(heightmap) · contourMaterial · CameraRig(progress) · Waypoints3D(decorative)
   │   └─ AltimeterRail (Client)  same MotionValue → 1,626 m … 4,478 m
   └─ WaypointList (Server)  real <Link>s to /photos/[id] (keyboard / SR / no-JS path)
```

- **Server/client boundary:** `ssr:false` dynamic imports are only allowed in Client Components, so `TerrainStage` owns the import. No `three`/R3F module may be reachable from a Server Component import graph.
- **SSR default = static.** The server renders the fallback. `useTerrainCapability` uses `useSyncExternalStore` with server snapshot `'pending'` (no hydration mismatch; same pattern as the existing `useReducedMotion`). The canvas fades in **over** the fallback once its first frame renders: no CLS, and LCP is the poster image.
- **Capability → `'static' | '3d'`:** `prefers-reduced-motion: reduce` → static. `navigator.connection?.saveData` → static. No `webgl2` context → static. `navigator.deviceMemory < 4` → static. At runtime, drei `<PerformanceMonitor onFallback>` and `webglcontextlost` → static. Playwright emulates `reducedMotion: 'reduce'` so screenshot baselines are deterministic (canvas excluded).
- **Scroll → camera: Motion `useScroll`**, not a CSS scroll timeline. The camera needs a number in JS every frame. Reading a CSS-animated `@property` through `getComputedStyle` per frame is slower, and CSS scroll-driven animations are not cross-browser (Firefox). Bind it without React re-renders: `useMotionValueEvent(progress, 'change', () => invalidate())`, and `CameraRig`'s `useFrame` reads `progress.get()`, samples a `CatmullRomCurve3` built from `terrain.ts` route points, and damps. **Gotcha:** with `frameloop="demand"`, damping stops when scroll stops, so call `invalidate()` from inside `useFrame` while `|current - target| > ε`.
- **CSS scroll-driven animations** are only for decorative, non-3D effects (e.g. contour parallax in the footer), behind `@supports (animation-timeline: scroll())` and disabled under reduced motion with `animation: none`. The global `animation-duration: 0.01ms` hack does not neutralise scroll timelines.
- **Offscreen pause:** IntersectionObserver on the stage → `frameloop='never'`, plus `visibilitychange`. Idle cost is zero.
- **Contour shader:** contours are computed in the fragment shader from world height (`fract(h / interval)` + `fwidth` antialiasing). The uniform `uInterval` and the SVG generation both read `CONTOUR_INTERVAL_M` from `terrain.ts`, so the 3D lines and the SVG lines match.
- **Heightmap decode:** `createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })` → OffscreenCanvas `getImageData` → Float32Array → displace `PlaneGeometry` once on the CPU. A CPU mesh keeps raycasting/waypoint placement simple. If a `DataTexture` is used instead, set `NoColorSpace`. Avoid Web Workers here: with `'strict-dynamic'`, worker loading needs an explicit `worker-src`.
- **One contour asset, four consumers** (all via `ContourField`, Server, zero JS):
  ```tsx
  export function ContourField({ lod = 'hero', className }: { lod?: 'hero'|'map'|'strip'; className?: string }) {
    const url = terrain.assets.contours[lod];
    return <div aria-hidden className={`bg-contour ${className ?? ''}`}
      style={{ maskImage: `url(${url})`, WebkitMaskImage: `url(${url})`, maskSize: 'cover' }} />;
  }
  ```
  The token colour comes through `bg-contour`, which an `<img>` of an external SVG cannot do. PhotoMap instead renders `<svg viewBox={terrain.viewBox}><image href={contours.map}/>{markers}</svg>`, and markers are positioned from `photoMeta[id].terrainUV × viewBox`. That is the same UV space Waypoints3D uses for mesh placement.

---

## 6. Typed project highlights

**Decision:** zod schemas as source of truth. Projects form a **discriminated union on `slug`**, and each project's `highlights` is an ordered tuple of **shared typed block** kinds. You get per-project shape enforcement and a generic renderer.
```ts
// data/schemas.ts
const Metric = z.object({ label: z.string(), value: z.string(), note: z.string().optional() });
const RiskBand = z.object({ level: z.enum(['low','medium','high','critical']), range: z.tuple([z.number(), z.number()]) });
export const Block = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('metrics'),    title: z.string(), metrics: z.array(Metric).min(1) }),
  z.object({ kind: z.literal('risk-scale'), title: z.string(), rules: z.number().int(), bands: z.array(RiskBand).length(4) }),
  z.object({ kind: z.literal('pricing'),    title: z.string(), tiers: z.array(Tier).min(1) }),
  z.object({ kind: z.literal('stack'),      title: z.string(), groups: z.record(z.string(), z.array(z.string())) }),
  z.object({ kind: z.literal('list'),       title: z.string(), items: z.array(z.string()).min(1) }),
]);
const MetricsBlock = Block.options[0]; const RiskScaleBlock = Block.options[1]; // …
const CliX    = ProjectBase.extend({ slug: z.literal('cli-x'),   highlights: z.tuple([MetricsBlock, MetricsBlock, RiskScaleBlock, MetricsBlock]) });
const Webshop = ProjectBase.extend({ slug: z.literal('webshop'), highlights: z.tuple([PricingBlock, ListBlock, StackBlock]) });
export const Project = z.discriminatedUnion('slug', [CliX, Webshop]);
export type Project = z.infer<typeof Project>;
```
- `projects.ts`: `export const projects = [...] satisfies Project[]`. The test parses it and asserts contiguous risk ranges 0→1 and that `roadmapItems` ids exist.
- **Composition:** `CaseStudy` = `CaseStudyHeader` (name, status, links, overall `TrailGradeMark`) → `Narrative` (react-markdown, server-rendered) → `HighlightBlocks` (exhaustive `switch (block.kind)` with a `never` check → `MetricsBlock | RiskScaleBlock | PricingBlock | StackBlock | ListBlock`) → `DemoTerminal` (the **only** client island; restyled HologramTerminal) → `TechStack` → `RelatedRouteLog`.
- **Trail grades:** `lib/trail-grade.ts` is the one mapping `riskLevel → { grade: 'T1'|'T2-T3'|'T4-T5'|'unmarked', token }`. `RiskScaleBlock`, `DemoTerminal` and the legend all use it. Unit-test it.
- `HighlightValue` and `Record<string, HighlightValue>` are deleted from `data/types.ts`.

---

## 7. Motion tokens: one vocabulary for CSS and Motion

**Decision:** maintain the values by hand in two places, with a parity test. No generator, because it's 4 easings and about 4 durations.

```css
@theme { --ease-geological: cubic-bezier(0.22,0.61,0.36,1); --ease-crystallize: cubic-bezier(0.16,0.85,0.45,1);
         --ease-tectonic: cubic-bezier(0.33,0,0.2,1); --ease-erosion: cubic-bezier(0.4,0,0.2,1); }
:root  { --duration-hover: 350ms; --duration-enter: 450ms; --duration-settle: 500ms; --duration-exit: 150ms; }
```
```ts
// lib/animations.ts (existing exports kept; additions)
export const EASING = { geological: [0.22,0.61,0.36,1], /* … */ } as const;      // Motion
export const DURATION = { hover: 0.35, enter: 0.45, settle: 0.5, exit: 0.15 } as const; // seconds
export const cssEase = (k: keyof typeof EASING) => `var(--ease-${k})`;           // inline styles / VT
export const cssDuration = (k: keyof typeof DURATION) => `var(--duration-${k})`;
```
- Tailwind usage: `ease-geological` (theme namespace) and `duration-(--duration-enter)` (v4 var shorthand). Tailwind lists no `--duration-*` theme namespace, so durations live in `:root`, and that also guarantees they're emitted for JS.
- `lib/__tests__/motion-tokens.test.ts` reads `globals.css` and asserts every `EASING`/`DURATION` key matches its CSS var.
- View-transition CSS uses the same vars (`::view-transition-group(.morph) { animation-duration: var(--duration-settle); animation-timing-function: var(--ease-geological) }`).
- **Reduced motion, centralised:** `components/providers/MotionProvider.tsx` → `<MotionConfig reducedMotion="user" transition={{ duration: DURATION.enter, ease: EASING.geological }}>` in `(site)/layout`. This replaces the scattered `prefersReducedMotion ? … : …` ternaries in new code. Add the VT reduced-motion block (`::view-transition-*(*) { animation-duration: 0s !important }`). The universal `*` selector does not reach VT pseudo-elements. *(ui-ux-pro-max: "use shared motion tokens", "1-2 key animated elements per view", "respect prefers-reduced-motion": High.)*

---

## 8. Build order, file inventory, data flow

### Build order (dependency-respecting)

```
Phase 7  Foundation & guardrails ─────────────────────────────┐ (blocks everything)
  7.1 npm ci sync; CI → Node 24; add eslint-config-next (jsx-a11y)
  7.2 Playwright visual baselines on CURRENT UI (Linux/CI-generated, reducedMotion emulated, canvas masked)
  7.3 framer-motion 12 → 14 (isolated commit; 13→14 has no breaking changes; 12→13 only drops
      @emotion/is-prop-valid, unused here) → baselines must be unchanged
  7.4 React 19.3 + Next 16.4 (isolated commit; prerequisite for <ViewTransition>/transitionTypes in Phase 10)
  7.5 Delete playground routes + already-dead components (shrinks the sweep)
  7.6 globals.css tokens v2 (L1/L2/L3 aliases), motion tokens, visible scrollbar + scrollbar-gutter
  7.7 Mechanical sweep: dark:/stock → v2 semantic; guard script + tokens.ts contrast in `lint` (hard fail)
  7.8 data/site.ts identity; SiteNav/SiteFooter/SiteChrome; git mv pages into app/(site)/;
      root not-found/global-error/(site) error; metadata template; pages → Server Components where trivial
Phase 8  Data & terrain pipeline ────────────────────────────┐ (blocks 9, 10, 11-typing)
  8.1 data/schemas.ts; typed highlights migration (temporary plain renderer) + schema test
  8.2 build-terrain.ts → public/terrain/* + data/generated/terrain.ts (manual, committed)
  8.3 extract-exif.ts → photo-meta.ts (uses terrain.ts); data/photos.ts merge + overrides; --check in prebuild
  8.4 ContourField + TerrainFallback (server) → wire into SiteFooter immediately
  8.5 lib/trail-grade.ts; v1-alias removal codemod; ban v1 names in guard
Phase 9  Home ascent (needs 8.2, 8.3, 8.4)
Phase 10 Photography (needs 7.4, 8.3, 8.4)        ┐ independent of each other →
Phase 11 Engineering & roadmap (needs 8.1, 8.5)   ┘ can run in parallel
Phase 12 Contact, edge pages, cleanup & verification (needs all; OffTrail uses ContourField; SW precache)
```

**Two recommendations that differ from the proposed plan (for the roadmapper to decide):**
1. Add the **React 19.3 / Next 16.4 bump** to Phase 7. It is not in the locked list, but View Transitions depend on it.
2. Move **playground-route deletion** from Phase 12 to Phase 7, before the token sweep. The rest of the dead-code cleanup stays in 12.

### New / Modified / Deleted / Moved

**NEW**
- `app/(site)/layout.tsx`, `app/(site)/not-found.tsx`, `app/global-error.tsx`
- `app/(site)/photos/layout.tsx`, `photos/[id]/page.tsx`, `photos/@modal/default.tsx`, `photos/@modal/page.tsx`, `photos/@modal/(.)[id]/page.tsx`
- `components/site/*`, `components/terrain/*`, `components/photos/*`, `components/projects/{RoutePanel,CaseStudy,blocks/*,TrailGradeMark,DemoTerminal}`, `components/edge/OffTrail.tsx`, `components/providers/MotionProvider.tsx`
- `data/schemas.ts`, `data/site.ts`, `data/photos.ts`, `data/generated/{terrain,photo-meta,tokens}.ts`
- `lib/trail-grade.ts`
- `scripts/terrain/build-terrain.ts`, `scripts/photos/extract-exif.ts`, `scripts/tokens/tokens.ts`, `scripts/tokens/check-design-tokens.mjs`
- `public/terrain/*` (hashed), `assets/photos-original/` (moved originals), `.cache/` in `.gitignore`
- Tests: `lib/__tests__/{motion-tokens,trail-grade}.test.ts`, `data/__tests__/schemas.test.ts`, `components/__tests__/{RoutePanel,PhotoGrid,Lightbox,CaseStudy}.test.tsx`, `e2e/{visual,lightbox,edge}.spec.ts`

**MODIFIED**
- `app/layout.tsx`, `app/globals.css`, `proxy.ts` (matcher), `next.config.ts` (`/terrain` cache headers)
- `package.json` (scripts, deps: framer-motion 14, react 19.3, next 16.4, d3-contour, exif-reader, colorjs.io; `engines`), `.github/workflows/ci.yml` (Node 24), `eslint.config.mjs`, `tsconfig.json` (`allowImportingTsExtensions` for scripts)
- `data/types.ts`, `data/landscapes.ts`, `data/projects.ts`, `data/roadmap.ts` (if route-log needs fields)
- `lib/animations.ts`, `public/service-worker.js` (precache list), `scripts/inject-build-hash.mjs`, `scripts/optimize-images.mjs`
- Restyled/renamed: `Footer`→`SiteFooter`, `FeedbackForm`→`SummitRegister`, `RoadmapTimeline`/`RoadmapProgress`→`RouteLog`, `RoadmapFilters`, `HologramTerminal`→`DemoTerminal`, `TechStackDisplay`, `InteractiveHotspot`→`Hotspot`, `PhotoCarousel3D`→`PhotoCarousel` (or retained if Phase 10 keeps 3D), `ServiceWorkerRegistration` (unchanged logic)
- E2E specs: `homepage`, `photos` (rewrite), `projects`, `contact-form`. Unit: `GalleryGrid.test`→`PhotoGrid.test`, `ProjectCard.test`→`RoutePanel.test`, `RoadmapTimeline/Filters.test`, `FeedbackForm.test`

**MOVED (git mv into `app/(site)/`)**
- `page.tsx`, `error.tsx`, `photos/page.tsx`, `projects/page.tsx`, `projects/[slug]/page.tsx`, `roadmap/page.tsx`, `contact/page.tsx`, `offline/page.tsx`

**DELETED**
- Routes: `app/gradient-mesh`, `app/particle-buttons`, `app/transitions`
- Already dead: `Hero3DSection`, `ProgressiveImage`, `TerminalDemo`, `ZoomableImage`
- Playground-only: `ParticleButton`, `TransitionShowcase`, `ShaderTransition`, `AnimatedGradientMesh` (after contact is restyled)
- Replaced: `Header`, `GlassmorphismNav`, `ContourBackground`, `Hero3DMountain`, `MountainTerrain3D`, `DualParticleSystem`, `GeologicalButton` (unless reused as a token button), `PhotosPageClient`, `GalleryGrid`, `ImageDetailModal`, `ProjectCard`, `ProjectHighlights`, `FeatureShowcase` (folded into CaseStudy), `ProjectDetailClient`, `HologramTerminalDemo`
- Lib: `lib/useHexGrid.ts`, `lib/useGlowIntensity.ts`, `lib/useProgressiveTextures.ts` (if the carousel no longer needs it)
- CSS: `.hex-clip`, `.hex-grid`, `.glow-*`, `.ambient-glow`, `.contour-animate`, `.glass*`, `.hologram-content` rgba borders, scrollbar-hiding block, h1 glow text-shadow
- Assets: legacy `public/images/optimized/*-{thumb,medium,large}.*`; `scripts/verify-contrast.mjs` (superseded)

## Data Flow

### Request flow (photo lightbox, soft navigation)

```
click thumbnail <Link href="/photos/img-0605" scroll={false}>  (inside /photos?view=grid)
  → router transition (React transition ⇒ <ViewTransition> active)
  → Next-Url=/photos matches interception ⇒ @modal/(.)[id] renders; children slot (grid) kept
  → PhotoGrid sees usePathname()='/photos/img-0605' ⇒ drops its named VT (deleted side)
  → Lightbox/PhotoViewer mounts named VT (inserted side) ⇒ morph; gallery + nav/footer inert
Escape / close / browser Back → router.back() ⇒ /photos?view=grid; @modal/page.tsx → null; focus → thumbnail
refresh on /photos/img-0605 → no interception ⇒ photos/[id]/page.tsx full gallery-black page; @modal/default → null
```

### Key data flows

1. **Terrain:** DEM tiles → `build-terrain.ts` → hashed PNG/WebP/SVG + `terrain.ts` → (server) `TerrainFallback`/`ContourField` HTML, (client) `TerrainCanvas` fetches heightmap → CPU mesh → shader with `uInterval` from `terrain.ts`.
2. **Photos:** originals → `extract-exif.ts` (+ `terrain.ts` projection) → `photo-meta.ts` + editorial `landscapes.ts` → `data/photos.ts` (validated in test) → Home waypoints (3D + DOM list), PhotoMap markers, Grid, Lightbox ExifStrip, `generateMetadata`.
3. **Scroll ascent:** `window` scroll → Motion `useScroll` (one MotionValue in `AscentScrollProvider`) → `invalidate()` → `CameraRig` `useFrame` (no React renders); the same MotionValue → `AltimeterRail` text.
4. **Tokens:** `globals.css` → Tailwind utilities (L2 only) and → `tokens.ts` script → contrast gate + `data/generated/tokens.ts` → shader uniforms.
5. **Identity:** `data/site.ts` → SiteNav, SiteFooter, root `metadata`, contact page. One source, so placeholder links can't return.

## Scaling Considerations (performance budget at portfolio scale)

| Concern | Now (4 photos, 2 projects) | At 50 photos | Mitigation |
|---------|----------------------------|--------------|------------|
| Home JS | R3F chunk loaded only when capable + visible | same | Keep `three` out of the shared chunk (dynamic import only) |
| Contour SVG weight | 3 LODs, target < 150 KB each | same | Round coordinates to 1 decimal; coarser intervals for `hero`/`strip` |
| `photo-meta.ts` in server bundle | trivial | ~50 KB | Server-only import; client gets props |
| Dynamic rendering everywhere (nonce CSP) | fine | fine | Not CDN-cached; acceptable at this traffic. Experimental SRI is the escape hatch, out of scope |
| Photo map markers | 3 GPS points | clustering needed | Defer |

**First bottleneck:** mobile GPU on the hero, handled by the capability gate plus `PerformanceMonitor`. **Second:** LCP on Home, handled by the server-rendered hillshade poster with `priority`.

## Anti-Patterns

1. **Keeping Home outside `(site)` with its own nav.** Two navs come back and the nav remounts on every Home transition. Use one fixed SiteNav plus a transparent-over-hero state.
2. **Same VT `name` on the grid thumbnail and the open lightbox.** That is a duplicate-name error and no morph. Conditionally unmount the thumbnail's boundary.
3. **Missing `@modal/default.tsx` or `@modal/page.tsx`.** Without `default` you get a hard-nav error (16.x). Without `page` the modal stays open after navigating to `/photos`.
4. **Reading `@theme` vars from JS/shaders.** They are pruned when unused. Use `:root` primitives or `data/generated/tokens.ts`.
5. **Generating terrain on Vercel.** Network-dependent, slow, nondeterministic. Generate offline and commit hashed outputs.
6. **16-bit grayscale heightmap PNG.** Browsers decode to 8-bit, which produces terraced terrain. Use terrain-RGB.
7. **`frameloop="demand"` with damping but no self-invalidation.** The camera freezes mid-ease.
8. **Page-level `AnimatePresence` alongside route View Transitions.** Two systems fight over exit. Use VT for route-level motion and Motion for in-page motion.
9. **A `'use client'` page.tsx.** Loses metadata and ships the whole page as JS. Keep pages server-side and make islands client components.

## Integration Points

### External services

| Service | Integration | Notes |
|---------|-------------|-------|
| swisstopo swissALTI3D | Build-time only, manual `npm run terrain`, raw tiles cached in `.cache/dem` | Attribution "© swisstopo" in SiteFooter. No runtime requests (CSP `connect-src 'self'`) |
| Vercel | Build runs `prebuild` (`optimize-images`, `extract-exif --check`) → `next build` → `postbuild` | Generated files must be committed; Node 24 |
| Resend / Upstash | Unchanged (`app/api/feedback`) | SummitRegister must keep CSRF token + field names |

### Internal boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `scripts/*` ↔ `data/schemas.ts` | Relative `.ts` import (Node type-stripping) | `schemas.ts` must import only `zod` (no `@/` aliases) |
| Server pages ↔ client islands | Serializable props (`Photo`, `Waypoint[]`) | No functions or MotionValues across the boundary |
| `AscentScrollProvider` ↔ `TerrainCanvas`/`AltimeterRail` | React context holding one MotionValue | MotionValue reads in `useFrame`, never state |
| `photos/layout` ↔ `@modal` ↔ `PhotoGrid` | URL (`usePathname`, `?view=`) | URL is the single source of lightbox/view state |
| `globals.css` ↔ `lib/animations.ts` | Parity unit test | Edit both together |

## Sources

- Next.js docs v16.4.0: Route Groups, not-found.js (incl. `global-not-found`), Parallel Routes, Intercepting Routes, default.js, Content Security Policy guide, Designing view transitions guide, Accessibility (route announcer): nextjs.org/docs/... (fetched 2026-10-10)
- React `ViewTransition` reference: react.dev/reference/react/ViewTransition. `react@19.3.0` production build inspected: `exports.ViewTransition`, `exports.addTransitionType` present
- Motion upgrade guide: motion.dev/docs/react-upgrade-guide (12→13 removes `@emotion/is-prop-valid` optional dep; 13→14 no breaking changes); npm: framer-motion 14.1.0, motion 14.1.0, next 16.4.0, react 19.3.0, @react-three/fiber 9.8.1 (peer `react >=19 <19.4`)
- Tailwind CSS v4 theme docs: tailwindcss.com/docs/theme (`--color-*: initial`, `@theme inline`, `@theme static`, `--ease-*` namespace)
- eslint-plugin-better-tailwindcss README (rules `no-unknown-classes`, `no-restricted-classes`; ~850★)
- ui-ux-pro-max searches (nextjs/react/threejs stacks, ux domain): skip links, focus trap/return, shared motion tokens, reduced motion, canvas alpha/sizing. No DB match for modal/lightbox or view-transition queries; fell back to official docs
- Repo inspection: `app/**`, `components/**`, `lib/**`, `data/**`, `scripts/**`, `proxy.ts`, `next.config.ts`, `package.json`, `package-lock.json`, `jest.*`, `playwright.config.ts`, `.github/workflows/ci.yml`, `public/service-worker.js`

---
*Architecture research for: v2.0 Topographic Identity integration into the existing Next.js 16 portfolio*
*Researched: 2026-10-10*
