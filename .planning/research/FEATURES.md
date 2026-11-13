# Feature Research

**Domain:** Photographer-engineer portfolio in a Swiss "topographic survey" identity. v2.1 extends it from one mountain to region series across the Alps.
**Researched:** 2026-11-12
**Confidence:** MEDIUM overall. Codebase facts are HIGH (read directly). Web-platform rules (WCAG 2.2.2/1.2.x, Web Share, autoplay, Save-Data, Google image metadata, LV95) are MEDIUM: official docs plus cross-checked secondary sources. Portfolio and photo-essay conventions are LOW–MEDIUM: vendor blogs and examples, with no authoritative study.
**Scope:** Only the NEW v2.1 capabilities. The v2.0 light table, lightbox, ascent, OG cards and terminal are already built and are treated as dependencies here, not re-researched (see `milestones/v2.0-research/FEATURES.md`).
**Complexity key:** LOW = under a day, one component. MEDIUM = 1–3 days, or touches data plus UI. HIGH = more than 3 days, a new pipeline, or work across several routes.

---

## 0. Decisions Tim needs to make (read first)

Each of these changes what gets built, so the roadmap needs them settled before the phases that depend on them.

### D-A: URL scheme for region series

PROJECT.md says existing `/photos/[slug]` links and OG cards "keep working through the series URL change". Next.js cannot have `/photos/[region]` and `/photos/[slug]` as sibling dynamic segments.

| Option | Shape | Pros | Cons |
|---|---|---|---|
| **A (recommended)** | `/photos/[region]` and `/photos/[region]/[slug]`, with 308 redirects from the 4 old `/photos/<slug>` URLs | Readable hierarchy. The region in the URL fixes the prev/next scope, the breadcrumb and the canonical. Matches "series by region" | The `@modal/(.)[slug]` interception moves under `[region]`. `proxy.ts` `DETAIL_PATH`/`KNOWN` 404 logic, sitemap, OG routes and Home waypoint links all change. Shared links take one redirect hop |
| B | Flat `/photos/[slug]` stays canonical, with region pages at `/photos/series/[region]` | Zero redirects. Old links and OG cards are untouched | The URL doesn't say which series a photo is in, so prev/next scope from a deep link has to come from data. A photo can only ever belong to one series |
| C | One `/photos/[key]` segment that resolves to a region or a photo | Short URLs | Region and photo slugs share one namespace, which is fragile. Unusual routing |

### D-B: Drone video shape (see §4)

| Option | What visitors get | Cost |
|---|---|---|
| **Loops only (recommended for v2.1)** | 6–15 s muted clips inline in region sequences, poster-first | LOW–MEDIUM. Reuses the Phase 11 `clips.json` → ffmpeg → hashed MP4 + poster pipeline. Same-origin, so no CSP change |
| Films only | 1–4 min edited films with sound, click-to-play, captions | MEDIUM–HIGH. Captions and a text alternative are required (WCAG 1.2.2/1.2.3), the hosting decision is open, and bandwidth matters on Vercel Hobby (100 GB/month) |
| Both | Loops in sequences plus one film per region (or one reel) behind a play button | Sum of the two. Ship loops first, then films after hosting is decided |

### D-C: What happens to the Carousel view at 20+ photos

| Option | Notes |
|---|---|
| Keep Carousel as an "all photos" view | The 3D ring loads 20+ textures, and its usability falls off past about 8 items. Needs per-region or paged loading |
| **Retire Carousel; the immersive region sequence takes over "one at a time, large" (recommended)** | Fewer views to maintain. **Regression flag:** it removes a shipped view (PHOTO-02), so `?view=carousel` must redirect to the Grid view, and its tests are rewritten, not deleted (GUARD-03) |
| Carousel only inside a region | Keeps the feature, but duplicates what the sequence already does |

### D-D: JSON-LD `license` property

Google shows the "Licensable" badge only with `license` (a URL). Without a license page and with print sales out of scope, the recommendation is `creator` + `copyrightNotice` + `creditText` and **no** `license` or `acquireLicensePage`. Tim decides whether a simple "Image rights" page is worth adding.

---

## 1. Series & Regions

**Expected behaviour (testable)**
- **Index:** `/photos` leads with the Alps overview map **and** a region index (cards or rows) below or beside it. They are the same data in the same order, synced on hover and focus. Photographer sites that group by location use either a gallery index or a nested region/location structure (Format, Zenfolio and Squarespace examples). The map is the differentiator, and the list is the accessible and mobile path.
- **Region order:** west → east by region centroid longitude, like reading a map. **Within a region:** ascending altitude, the existing canonical order (PHOTO-03). Unlocated photos come last, or take an "approx." pin as in DATA-04.
- **Region card/row contents:** name, country code (CH/IT/AT), photo count, altitude range ("1,617–2,770 m"), lead thumbnail, and coordinates of the sheet centre in mono. Every figure comes from data, never typed by hand.
- **Region page contents, top to bottom:**
  1. Region header ("sheet title"): h1 region name, country, a 2–4 sentence intro, a facts block (count, altitude range, seasons/years, contour equidistance, DEM source and edition).
  2. Local terrain plate with the region's pins (generalised from today's `MapSheet`).
  3. The immersive photo sequence (§3).
  4. An end block with a "Next region →" route card, "All regions" and the overview link.
- **Captions:** a data line (title · altitude · coordinates · date) is always visible. The story text is short, and longer notes go between images, not in hover overlays.
- **Lightbox with 10–20 photos:** stays scoped to **one region**. The counter reads "7 / 18" and the polite announcement "Photo 7 of 18 in Zermatt: {title}". The no-wrap rule at the ends already exists (aria-disabled ‹ ›, `PhotoViewer.tsx`). At the last photo, add an **end-of-series card** ("End of the Zermatt series · Continue to {next region}") instead of silently crossing into another region. Preload only the neighbours, which already happens. Stepping still uses `replaceState`, so Back still closes.
- **Index inside the lightbox (differentiator):** with 18 photos, "where am I" needs more than a counter. Add a toggleable thumbnail index overlay (a grid of the region's photos, the current one marked) rather than a permanent filmstrip, which keeps the "less chrome" goal. Large lightboxes commonly offer a filmstrip or thumbnail toggle (Mantine uses `T`).
- **Breadcrumb:** "Photographs / Zermatt / {photo}" on the standalone photo page and region page. It feeds BreadcrumbList JSON-LD (§5).
- **Per-region metadata:** a title ("Zermatt · Photographs · Tim Lui"), description, canonical, OG card (lead photo plus region name and altitude range, from the shared OG template) and sitemap entries.
- **Home stays unchanged,** but its 4 waypoint links must point at the new photo URLs (D-A), and it gains a link to the wider album.

| Type | Feature | Why | Cx | Depends on |
|---|---|---|---|---|
| Table stakes | Region data model (id/slug, name, country, centroid, extent, DEM source, intro, order) plus `photo.region` | Everything else keys off it | MEDIUM | Photo schema `data/schemas/photo.ts`, EXIF sidecar, `editorial.ts`, terrain pipeline (DATA-01) |
| Table stakes | Region index (cards/rows) on `/photos`, synced with the overview map | Location-grouped portfolios lead with an index. Keyboard/SR path for the map | LOW | Overview map (§2) |
| Table stakes | Region page: header, facts, local plate, sequence, next-region card | The core of "series by region" | HIGH | Local plate per region, immersive layout (§3) |
| Table stakes | Lightbox scoped to the region; counter and announcement name the region | 18 photos with no scope means lost context | LOW | `PhotoViewer.tsx` order source changes from global to per-region |
| Table stakes | Old `/photos/<slug>` URLs keep working (308) and Home links updated | Stated in PROJECT.md; shared links and OG cards | LOW–MEDIUM | D-A, `proxy.ts` 404 regex and KNOWN sets, `next.config` redirects, sitemap |
| Table stakes | Region titles, descriptions, canonicals, OG cards, sitemap | SEO-01..03 parity for new routes | LOW | Shared OG template (12-10) |
| Table stakes | "All photos" Grid across regions, grouped under region headings | 20+ photos: visitors still want one place to see everything | LOW–MEDIUM | `JustifiedGrid.tsx` (generic aspect already) |
| Differentiator | End-of-series card in the lightbox leading into the next region | Turns the end of a sequence into a route onward | LOW | Lightbox no-wrap ends (exists) |
| Differentiator | Thumbnail index overlay in the lightbox | Wayfinding at 10–20 photos without permanent chrome | MEDIUM | Focus trap inside `LightboxDialog` (exists) |
| Differentiator | Region facts as a map-sheet legend (equidistance, DEM source/edition, extent, highest point) | Same "real data" voice as the footer legend | LOW | Terrain pipeline metadata per region |
| Anti-feature | Tag/season filter chips | Explicitly out (PHOTO-F3); regions are the only grouping | — | — |
| Anti-feature | Lightbox prev/next that crosses region boundaries silently | The visitor loses which series they are in | — | End-of-series card |
| Anti-feature | Trip/date-based sub-albums inside a region | Tim chose region, not trip or theme | — | Seasons appear as facts, not navigation |
| Anti-feature | Infinite scroll / "load more" on the region page | 10–20 photos per region; a finite page is clearer and printable | — | Lazy images in one page |

---

## 2. Overview & Local Maps

**Expected behaviour (testable)**
- **Overview = a sheet index.** The Alps-wide contour map shows each region as its **local-plate extent rectangle** plus a labelled pin, like swisstopo's map-sheet index (Blattübersicht). This is the strongest on-identity reading of "overview + local": the rectangle is literally the sheet the region opens on.
- **Orientation context:** national borders as thin dashed lines with country codes, plus 3–5 reference landmarks (e.g. Mont Blanc, Matterhorn, Grossglockner) as small triangles. Without them an Alps-wide contour field is unreadable. Landmarks are `aria-hidden` decoration, and borders need a source and licence check (STACK).
- **Pin density:** 2–3 pins at launch and maybe 6–10 later. **No clustering** is needed below about 12 pins. The real problem is **label collision.** The Alps arc is about 1,000 km wide, so at 375 px width 1 px ≈ 2.7 km. Zermatt and an Aosta Valley region about 30–40 km apart would sit **11–15 px** apart. Place labels at build time with leader lines (as v2.0 did for the Zermatt/gorge pins), and on narrow screens fall back to **numbered pins plus the numbered region list.** That is the same legend pattern LBOX-05 uses for hotspots on mobile.
- **Pins are links** (`<a href="/photos/{region}">`) in DOM order west → east. Each has an accessible name ("Zermatt, Switzerland: 9 photographs, 1,617–3,100 m"). Glyphs can be small, but the hit area is ≥ 44 px. Focus or hover shows a preview plate (lead thumbnail, count, altitude range); the preview never depends on hover alone. The SVG has `role="img"` plus `aria-label`, or a `<title>`, with interactive pins inside, or a decorative SVG with HTML pins overlaid. Avoid `role="application"`.
- **List–map sync:** focusing or hovering a region row highlights its pin and extent rectangle, and the reverse. The list is the primary text alternative, and accessible-map guidance treats the text list as the main accessible path.
- **Local plate:** the region page's plate works exactly like today's Matterhorn `MapSheet`: build-time contours, pins at EXIF GPS (rounded 4 dp), keyboard-operable plates, approx. pins dashed.
- **Overview → local transition (differentiator):** a View Transition morph from the overview's extent rectangle into the region page's local plate. It is instant under reduced motion or without support, and it must work fully without the morph (same rule as LBOX-06).
- **Static by construction:** both maps are build-time SVG, with no tiles, pan or zoom, no WebGL and no runtime fetch (CSP constraint). That makes the "static fallback" the product itself, and it renders without JS.
- **Footer legend becomes region-aware:** today it shows the Matterhorn's LV95 extent and the swisstopo attribution on every route. On an Italian or Austrian region page it must show **that sheet's** extent (WGS84 or UTM, since LV95 is Swiss-only) and **that DEM's** attribution. This is a licence obligation, not polish (PROJECT.md "Attribution" constraint).

| Type | Feature | Why | Cx | Depends on |
|---|---|---|---|---|
| Table stakes | Overview contour map with one keyboard-operable, labelled pin per region | Locked direction | HIGH | Alps-wide coarse DEM and generalised contours (STACK), build-time SVG pipeline (DATA-01) |
| Table stakes | Synced region list as the text alternative and mobile primary | Map a11y guidance: the list is the accessible path | LOW | Region index (§1) |
| Table stakes | Build-time label placement plus numbered-pin fallback on narrow screens | Pins 11–15 px apart at 375 px | MEDIUM | Leader-line code from v2.0 Map view, hotspot numbered-legend pattern (LBOX-05) |
| Table stakes | Local terrain plate per region | Locked direction ("as the Matterhorn map works today") | HIGH | Multi-region terrain pipeline + second DEM source for IT/AT, `MapSheet.tsx` generalised |
| Table stakes | Per-region attribution and extent in the footer legend | DEM licence terms | MEDIUM | `SiteFooter.tsx`, `site.attribution.terrain` becomes per-source |
| Differentiator | Overview as a sheet index (extent rectangles plus sheet numbers) | Purely topographic wayfinding; nobody else's portfolio does this | LOW (once extents exist) | Region extents in data |
| Differentiator | Borders plus reference summits for orientation | Makes a 1,000 km contour field legible | MEDIUM | Boundary data source and licence |
| Differentiator | Overview → local plate morph | Spatial continuity, the same language as the thumbnail morph | MEDIUM | React `<ViewTransition>` (exists since Phase 7) |
| Anti-feature | Slippy/pan-zoom map (Leaflet, MapLibre, Mapbox) | Out of scope in v2.0; CSP, bundle, and pointless at 3–10 pins | — | Fixed SVG |
| Anti-feature | Pin clustering library | Fewer than 12 pins | — | Label placement |
| Anti-feature | 3D/WebGL Alps overview | Home already owns the 3D moment; more GPU cost, weak a11y | — | SVG with hillshade poster at most |
| Anti-feature | LV95 extent on non-Swiss sheets | LV95 is defined for Switzerland only | — | WGS84/UTM per source CRS |

---

## 3. Immersive Layout (still topographic)

**Expected behaviour (testable)**
- **Uncropped and big:** each photo fills the viewport **width** up to the available height (`100dvh` minus the 64 px sticky nav and the collar), with `object-fit: contain` on gallery-black. Portrait photos centre with black sides. This holds the v2.0 rule "photo never cropped". The only exception is an explicitly art-directed region lead image with a stored focal point.
- **The topographic frame is a map collar.** A printed map sheet has a neatline with coordinate ticks and labels in its margin. Each photo gets a thin neatline in the gallery-black margin with **tick marks and labels at the edges** (lat/lon or LV95 for Swiss photos), the altitude in a corner and the sheet name. The frame sits **outside** the image bounds and never overlays or tints the photo (the gallery-black decision). Contours live in the page background between photos, never on them.
- **Pacing:** full-bleed images alternate with short text interludes (field notes). Long-form photo-essay guidance uses full-bleed as a pacing device, not as wall-to-wall repetition.
- **Captions:** one mono data line in the collar under the image's bottom-left edge (title · altitude · coords · date), always visible. On mobile it sits directly under the image. Never hover-only, never over the photo.
- **Less chrome, kept wayfinding:**
  - The SiteNav stays (SHELL-01). Optionally it hides on scroll down and returns on scroll up, but it **must** reappear when focus enters it and must not obscure focus (WCAG 2.4.11).
  - A slim sticky "sheet bar" shows the region name, the position "07 / 18" and the current altitude, plus an "Index" button.
  - Because the in-region order is ascending altitude, **the sequence is an ascent.** A side altimeter rail (reuse of Home's rail, decorative and `aria-hidden`, hidden below 768 px) shows where you are. This is the strongest identity tie-in.
  - Breadcrumb at the top. A "Skip series" link jumps to the end block.
- **Semantics:** the sequence is an `<ol aria-label="Zermatt series, 18 photographs">` of `<figure>`s with meaningful `alt` and `<figcaption>`. Each photo is also a link that opens the lightbox for zoom, EXIF and hotspots. Tab moves photo to photo. **Arrow keys are not hijacked** on the page; they stay native scroll. Arrows stay in the lightbox.
- **Scroll-driven reveals:** decorative only (fade/rise of the collar labels, not the photo), behind `@supports (animation-timeline: view())`. Firefox stable still gates the feature behind a flag (a June 2026 secondary source), and v2.0 already ruled CSS scroll-driven animation decoration-only. Under reduced motion there is no reveal at all, and everything renders in its final state.
- **No snapping.** `scroll-snap-type: y mandatory` traps users at browser zoom, breaks partial keyboard scrolling and pulls readers back past tall sections (Roselli, W3C low-vision TF). Use native scroll only.
- **Loading:** the first image is the LCP (`priority`/high fetch priority). The rest are lazy with reserved aspect ratio (CLS ≤ 0.1, VERIFY-04). `sizes="100vw"` over the existing ≤ 2560 px derivatives, with blur placeholders (existing). Twenty full-width images = a heavy page: the HOME-08-style budget needs a region-page counterpart.

| Type | Feature | Why | Cx | Depends on |
|---|---|---|---|---|
| Table stakes | Large, uncropped full-width sequence on gallery-black, aspect reserved, lazy below the fold | The stated v2.1 goal, without breaking "never cropped" or CLS | MEDIUM | Image manifest (DATA-08), derivative sizes, `StagePhoto.tsx` |
| Table stakes | Always-visible data captions; semantic `<ol>` of figures | Hover-only captions fail touch/keyboard; SR users need the count | LOW | Photo view-model (`lib/photos/view-model.ts`) |
| Table stakes | Wayfinding: breadcrumb, position "n / N", skip-series, next-region end block | "Less chrome" must not mean "lost" | LOW–MEDIUM | Region model |
| Table stakes | Reduced motion: no reveals, no morphs, final state from first paint | DSGN-08, site-wide rule | LOW | Motion tokens |
| Table stakes | Photo opens the existing lightbox for zoom, EXIF, hotspots | Detail features already exist; don't rebuild them in the sequence | LOW | LBOX-01..07 |
| Differentiator | Map-collar frame with coordinate ticks around each photo | Topographic identity without touching the image | MEDIUM | Coordinates per photo, tokens; contrast pairs in `guard:contrast` |
| Differentiator | Sequence-as-ascent: altimeter rail on the region page | Reuses the Home signature; the order is already by altitude | MEDIUM | Home altimeter rail component, region altitude range |
| Differentiator | Sticky mini local plate with the current photo's pin highlighted as you scroll | Scrollytelling link between the photo and the map | MEDIUM–HIGH | Local plate per region, IntersectionObserver |
| Differentiator | Text interludes (field notes) between photos | Photo-essay pacing | LOW | Editorial data field |
| Anti-feature | `object-fit: cover` full-bleed crops | Destroys composition; contradicts the locked "never cropped" | — | Contain within viewport |
| Anti-feature | Mandatory scroll-snap / scroll-jacking | Zoom and keyboard traps; v2.0 out-of-scope | — | Native scroll |
| Anti-feature | Parallax or Ken Burns motion on photos | Moves and crops the work; vestibular trigger | — | Static photos; motion only in the collar |
| Anti-feature | Contours, grids or text overlaid on the photo | Colour-casts and covers the work (gallery-black decision) | — | Collar outside image bounds |
| Anti-feature | Auto-advancing slideshow mode | Needs pause controls; competes with native scroll | — | Visitor-driven scroll and lightbox |
| Anti-feature | Hiding the nav permanently on region pages | Breaks SHELL-01 consistency and escape routes | — | Hide on scroll down only, reveal on focus and scroll up |

---

## 4. Drone Video

**How portfolios present it (LOW–MEDIUM; vendor and studio sources, no study):** the common shape is a **short 10–15 s loop** used as atmosphere (often on a homepage), with **longer films** behind a play button for people who want them, and **stills first** for a photography audience. Photography is judged differently from film and multimedia work, so for a photographer's portfolio video supports the stills rather than replacing them.

**Platform rules (MEDIUM, cross-checked):**
- **Autoplay** works only with `muted` + `playsinline` (iOS otherwise forces fullscreen). Gate it on `prefers-reduced-motion: no-preference`. Call `play()` and handle the rejected promise by showing the poster plus a Play button. iOS Low Power Mode is reported to block even muted autoplay (LOW, from memory: verify in the phase).
- **WCAG 2.2.2:** an auto-starting loop that runs more than 5 s alongside other content needs a visible **pause** control, even when muted. Pause offscreen (IntersectionObserver) and on a hidden tab. This is the same pause model the DemoTerminal already implements.
- **Save-Data:** `navigator.connection.saveData` exists in Chromium only (not Firefox, not Safari). Treat it as an enhancement: poster only and `preload="none"`. Never rely on it as the only data guard.
- **Video-only (no audio):** WCAG 1.2.1 asks for a text alternative. A figcaption that says what the clip shows is enough. This is how `DemoClip.tsx` already handles coin-flip.
- **Films with sound** (music or ambience counts as audio): WCAG 1.2.2 requires **captions** (WebVTT `<track kind="captions">` noting music and meaningful sound), and 1.2.3 requires an **audio description or a full text alternative.** A speechless drone film is all visual, so a text description or transcript is the practical answer. Click-to-play only, native `controls`, `preload="none"`, poster, fullscreen allowed.
- **Hosting decides the shape.** CSP is `default-src 'self'` with `frame-src 'none'` and `connect-src 'self'` (`proxy.ts`). Same-origin MP4 works today. YouTube/Vimeo embeds need `frame-src` (plus their tracking and branded chrome), and HLS through a streaming host needs `media-src`/`connect-src` changes. A 3-min 1080p film at about 6 Mbps is about 135 MB per full view. Vercel Hobby includes 100 GB/month of Fast Data Transfer, so roughly 700 full views. That is fine for loops and risky for films (STACK/PITFALLS to confirm).

**Expected behaviour (testable), loops**
- Loop clips sit **inline in the region sequence at their altitude position,** with the same collar and caption as stills and a small "Aerial · {altitude}" label. They are never the region's lead (the photos lead).
- Poster first. Autoplay only when motion is allowed and the clip is visible. Pause on leaving the viewport and on hidden tab. A visible Pause/Play toggle (`aria-pressed`) on each clip. Reduced motion shows the poster plus a Play button, and user-started play is fine.
- Weight per clip: ≤ 1080p, 6–15 s, a few MB, H.264 MP4 (optionally AV1/WebM first in `<source>` order). Encoding goes through the existing `clips.json` → ffmpeg → hashed MP4 + poster pipeline from Phase 11.
- Visual tests: poster-first plus reduced-motion emulation keeps Linux baselines deterministic. Playwright's Chromium cannot play H.264 (Phase 11 Pitfall 8), so e2e asserts state, never playback.

**Expected behaviour (testable), films (if chosen)**
- One film per region at most, in the region end block or a "Film" section. Poster with a big Play button, captions track, a text description below, native controls.
- `VideoObject` JSON-LD (name, description, thumbnailUrl, uploadDate, duration, contentUrl), and the same thumbnail as the poster and the OG image.

| Type | Feature | Why | Cx | Depends on |
|---|---|---|---|---|
| Table stakes (any video) | Poster-first, reserved dimensions, `playsinline`, `preload` tuned, handled `play()` rejection | Autoplay policies; CLS; deterministic tests | LOW | `DemoClip.tsx` pattern, media manifest (`data/generated/media-manifest.ts`) |
| Table stakes (loops) | Visible pause/play per clip; pause offscreen and on hidden tab; off under reduced motion | WCAG 2.2.2; DSGN-08 | LOW–MEDIUM | DemoTerminal pause-source model as a reference |
| Table stakes (loops) | Figcaption text alternative | WCAG 1.2.1 | LOW | Editorial data |
| Table stakes (films) | Click-to-play, controls, WebVTT captions, text description | WCAG 1.2.2, 1.2.3, 1.4.2 | MEDIUM | Caption authoring (Tim), hosting decision (D-B) |
| Table stakes (films) | Hosting that fits CSP and bandwidth | 100 GB/month Hobby; `frame-src 'none'` | MEDIUM–HIGH | STACK research; `buildCsp` tests in `lib/__tests__/proxy.test.ts` |
| Differentiator | Clips placed in the sequence by altitude and pinned on the local plate | Video becomes survey data, not decoration | LOW (pin) | Clip GPS from the drone's telemetry or a hand-placed position |
| Differentiator | Flight path drawn on the local plate from the drone telemetry track (DJI `.SRT` carries per-frame GPS/altitude, LOW confidence) | Deeply on-identity: a surveyed flight line | HIGH | Telemetry parsing at build time; 4-dp rounding rule applies to the path too |
| Differentiator | Video items inside the lightbox sequence (play instead of zoom) | One viewer for all media in a region | MEDIUM–HIGH | `PhotoViewer` gains a media-type branch; zoom/hotspots off for video |
| Anti-feature | Autoplay with sound | WCAG 1.4.2; browsers block it anyway | — | Click-to-play films |
| Anti-feature | Background video hero on Home | Home is locked unchanged; it competes with the 3D ascent and LCP | — | Video lives in region pages |
| Anti-feature | YouTube/Vimeo embeds by default | `frame-src 'none'`, third-party cookies and tracking, off-brand player chrome | — | Same-origin loops; a streaming host only if films need it |
| Anti-feature | Long loops (> 15 s) or 4K loops | Weight and battery for atmosphere | — | ≤ 15 s, ≤ 1080p |
| Anti-feature | Download button on video | All rights reserved (LBOX-07 parity) | — | `controlsList="nodownload"` is a hint only; state rights in text |

---

## 5. Small Features (PHOTO-F2, PHOTO-F4, ENG-F1, PLAT-F1, PLAT-F2)

### PHOTO-F2: Share (Web Share API)

- **Support (MEDIUM):** Safari macOS/iOS, Chrome Android, Samsung, Edge, Firefox Android. Chrome desktop on **Windows and ChromeOS only**; MDN/caniuse data omits Linux and macOS, so treat Chrome on macOS as unsupported unless the phase re-checks. **No support in Firefox desktop.** The API is not Baseline.
- **Behaviour:**
  - Feature-detect `navigator.share` (and `canShare({ url })`) **after hydration.** Where share exists, the button reads **"Share"** and opens the OS sheet with `{ title, url }`. Elsewhere the same slot reads **"Copy link"** and calls `navigator.clipboard.writeText`, with a polite live "Link copied" for about 2 s. Never label a copy action "Share".
  - Call it only from the click handler (transient activation). Swallow `AbortError` (the visitor cancelled). Treat `NotAllowedError`/`DataError` as failures and fall back to copy.
  - Share the **canonical absolute URL** from `site.url`, never `location.href` (which may carry `?view=` or a preview host).
  - Reserve the button width so the server/client label swap causes no layout shift. Linux CI baselines will show "Copy link".
- **Where:** the lightbox and photo-page chrome (next to the rights line), and the region header. Not on every figure in the sequence (chrome budget).
- **Don't** add `web-share=()` to `Permissions-Policy` when tightening headers (`next.config.ts` currently restricts only camera, microphone and geolocation).

### PHOTO-F4: LV95 next to WGS84 (Swiss photos only)

- **Format (MEDIUM, swisstopo):** easting first, labelled E, 7 digits starting with 2. Northing labelled N, starting with 1. Use the Swiss apostrophe grouping the footer already uses (`formatLv95` → `2’624’350`). Example strip line: `46.0150 N 7.7414 E` / `LV95 E 2’624’350 N 1’096’780`.
- **Precision:** the shipped WGS84 is rounded to 4 dp (about 11 m north–south and 8 m east–west at 46° N). **Round LV95 to 10 m** so it doesn't claim more precision than the data has (DATA-06 spirit). For approx. pins, carry the "approx." flag onto the LV95 line.
- **"Swiss only"** is decided **per photo location**, not per region: the Zermatt sheet itself crosses into Italy. Store a `country` per photo at data-build time (point-in-boundary or a manual field) and show LV95 only for `CH`.
- **Already built:** `wgs84ToLv95` (swisstopo approximate formulas, ≤ 0.14 m checked at Zermatt) in `lib/geo.ts`, and `formatLv95` in `lib/footer-format.ts`. This is mostly a display task.

### ENG-F1: Terminal step controls and static transcript

- **Already shipped (HIGH, `DemoTerminal.tsx`):** a sticky Pause toggle; pause on hover, focus, offscreen and hidden tab; "n / N"; a dot bar of "Go to command n" buttons; an sr-only current command whose live region is `off` while playing and `polite` while paused. Starts paused under reduced motion.
- **Missing:**
  - Explicit **‹ Previous / Next ›** step buttons (labelled, ≥ 44 px), which pause on use, like the dots.
  - A **static transcript:** a `<details>` "Show transcript" under the terminal listing every command, its output and its note as selectable plain text in order. It is always available, and **open by default under reduced motion** (v2.0 research TERM table stakes).
  - Optionally a per-command copy button with a "Copied" announcement.
- **Keep:** no arrow-key hijacking on the page; one timer at a time (11-RESEARCH Pitfall 1); the shared-grid height trick so nothing below moves.

### PLAT-F1: JSON-LD

- **Site-wide:** `Person` (name, url, jobTitle, `sameAs` GitHub/LinkedIn) and `WebSite`.
- **Per photo page:** `ImageObject` (or `Photograph` + `ImageObject`). Google requires `contentUrl` plus at least one of `creator`, `creditText`, `copyrightNotice`, `license`. Recommended additions: `creator` → `Person`, `copyrightNotice` "© {year} Tim Lui", `creditText`, `dateCreated`, `contentLocation` → `Place` with `GeoCoordinates` (4 dp, plus `elevation`). Google wants the markup **on every page where the image appears.** `license` only per D-D.
- **Per region page:** `CollectionPage`/`ImageGallery` with `hasPart` image refs, plus `BreadcrumbList`.
- **Per project:** box → `SoftwareSourceCode` with `codeRepository`. **coin-flip → `SoftwareApplication` with no repository** (private, D-23/D-30).
- **Films:** `VideoObject` (see §4).
- **Implementation rule:** render `<script type="application/ld+json">` from typed data with `<` escaped (`<`) to prevent injection. Validate in tests (schema shape) and once with Google's Rich Results Test. JSON data blocks don't execute, so the nonce CSP is not involved (MEDIUM: confirm in the phase against the Next 16.4 JSON-LD guide in `node_modules/next/dist/docs/`).

### PLAT-F2: Offline page that lists cached pages

- **The data exists:** the service worker stores ok, basic, non-redirected navigations in `dynamic-${BUILD_HASH}`, plus `/` and `/offline` in `static-*` (`public/service-worker.js`). RSC payloads are deliberately never cached.
- **Behaviour:**
  - `/offline` runs a small client script: `caches.keys()`, then the `dynamic-*` cache's `keys()`, which returns Request objects, so read `.url`. Filter to same-origin page paths (drop `/offline`, `/api/*` and anything with a query). Map path → human title from a **build-time route-title manifest** (injected like `PRECACHE`), with the cached HTML's `<title>` as a fallback. Group by section (Photographs, Regions, Projects…).
  - Heading "Saved on this device". Empty state: "No pages saved yet. Pages you visit online are kept here for offline reading."
  - **Links must be plain `<a href>` full navigations,** not `next/link`. Client navigation fetches RSC payloads, which are never cached, so it fails offline. The SW then serves the cached HTML.
  - Keep "Try again" and the `online` reload. Note in copy that photos load offline only if they were viewed.
- **Expectation to set:** the list resets after each deploy, because activation deletes old-build caches by design (EDGE-02 stale-page protection). That is correct, not a bug.

| Type | Feature | Why | Cx | Depends on |
|---|---|---|---|---|
| Table stakes | Share: native sheet where supported, honest "Copy link" fallback, live confirmation, canonical URL | Expected on mobile; Firefox desktop and Chrome Linux lack the API | LOW | `site.url`, new canonical photo/region URLs (D-A) |
| Table stakes | LV95 line for CH photos, 10 m rounding, Swiss grouping | Swiss-survey authenticity without false precision | LOW | `lib/geo.ts`, `formatLv95`, per-photo `country` |
| Table stakes | Terminal prev/next buttons plus `<details>` transcript (open under reduced motion) | auto-rotation-controls; text alternative to an animation | LOW–MEDIUM | `DemoTerminal.tsx`, `lib/demo-terminal.ts` |
| Table stakes | JSON-LD for Person, photos (ImageObject + geo), regions, breadcrumbs, projects | Rich results; fits the "real data" ethos | LOW–MEDIUM | Typed data, region model, D-D |
| Table stakes | Offline list of cached pages with titles, full-navigation links, empty state | Makes the offline page useful | LOW–MEDIUM | SW cache naming, a postbuild route-title injection like `PRECACHE` |
| Differentiator | Offline list styled as a "survey log" (section, altitude for photo pages) | Identity on an edge page | LOW | Route-title manifest carries altitude |
| Anti-feature | Social network share-button row (X, Facebook…) | Third-party scripts, CSP, tracking, visual noise | — | One Share / Copy link button |
| Anti-feature | "Share" button that silently copies | Mislabels the action | — | Capability-specific label |
| Anti-feature | LV95 for Italian/Austrian photos, or LV95 at 1 m precision | Wrong CRS; implies false precision | — | Country gate; 10 m rounding |
| Anti-feature | Executing real commands in the terminal | Security and CSP; out of scope since v2.0 | — | Scripted demo |
| Anti-feature | Pre-caching all photos for offline | Storage quota; not "offline mode" (out of scope) | — | List what the visitor already saw |

---

## Feature Dependencies

```
[Region data model + photo.region + photo.country]
    ├──requires──> [Multi-region terrain pipeline + 2nd DEM source (IT/AT)]   (STACK)
    ├──enables──> [Region index] ──synced with──> [Overview map]
    │                                   └──requires──> [Alps-wide coarse DEM + borders + build-time label placement]
    ├──enables──> [Region page] ──contains──> [Local plate per region] (generalised MapSheet)
    │                └──contains──> [Immersive sequence] ──opens──> [Lightbox, scoped to region] (LBOX-01..07)
    │                                    └──enhanced by──> [Collar frame] [Altimeter rail reuse] [Sticky mini plate]
    ├──enables──> [LV95 line] ──requires──> [photo.country = CH]
    └──enables──> [Per-region footer legend + attribution] ──requires──> [DEM source + licence per region]

[URL scheme decision D-A]
    ├──blocks──> [Region routes + @modal interception move] [308 redirects] [proxy.ts 404 regex/KNOWN]
    ├──blocks──> [Sitemap + OG + canonicals for regions] [Home waypoint links]
    └──blocks──> [Share URLs] [JSON-LD url/@id + BreadcrumbList]

[Drone video D-B]
    ├──loops──> [Phase 11 media pipeline (clips.json → ffmpeg → hashed MP4 + poster)] (exists, same-origin)
    │              └──requires──> [Pause model + reduced-motion gate] (DemoTerminal as reference)
    └──films──> [Hosting decision] ──may require──> [CSP change: media-src/connect-src/frame-src] + [WebVTT captions]

[Carousel decision D-C] ──affects──> [PHOTO-02 tests, ?view=carousel handling]

[SW dynamic-* cache (EDGE-02)] ──enables──> [Offline cached-pages list] ──requires──> [route-title manifest at postbuild]
[DemoTerminal (ENG-05)] ──extended by──> [prev/next + transcript (ENG-F1)]
[Shared OG template (SEO-02)] ──reused by──> [Region OG cards]

[Immersive full-width images] ──conflicts──> [object-fit: cover]  (locked "never cropped")
[Hide-on-scroll nav] ──conflicts──> [SHELL-01 consistency, WCAG 2.4.11] unless it reveals on focus
[Autoplay loops] ──conflicts──> [deterministic visual baselines] unless poster-first under test
```

### Dependency Notes

- **The region model and the terrain pipeline come first.** The overview, the region pages, the local plates, the LV95 gate, the footer attribution and the JSON-LD geo all read them. Building UI on the single-region data means building it twice, which is the same lesson as v2.0 G7.
- **D-A (URL scheme) blocks every route-touching feature,** including Share and JSON-LD, which both embed canonical URLs. Decide it before planning the series phase.
- **The second DEM source drives the footer.** Its licence decides the attribution text, and its CRS decides how the extent is shown. STACK has to name it before the legend is designed.
- **Lightbox scope change is small but cross-cutting.** `PhotoViewer`'s order source becomes per-region. Keyboard, focus-return and View Transition tests from Phase 10 must keep passing unchanged (regression risk: the Escape focus-loss case accepted at 12-UAT may resurface).
- **Video loops reuse, films don't.** Loops ride the existing media pipeline and CSP. Films may force a CSP change, a separately reviewed security surface (`buildCsp` is unit-tested).
- **ENG-F1, PHOTO-F4 and PLAT-F2 are independent** of the region work and can run in a parallel or early phase. PHOTO-F2 and PLAT-F1 depend on D-A for their URLs.

---

## MVP Definition

### Launch with (v2.1)

- [ ] Region data model; Zermatt (existing 4 + new) plus at least one IT or AT region: everything keys off it
- [ ] D-A URL scheme with 308s from the old slugs; Home links updated: PROJECT.md promise
- [ ] Overview map with labelled pins, numbered fallback on narrow screens, synced region list: the locked map model
- [ ] Region page: header, facts, local plate, uncropped immersive sequence, captions, next-region end block: the core feature
- [ ] Lightbox scoped to region with the end-of-series card: 18 photos need scope
- [ ] Per-region footer extent and DEM attribution: licence obligation
- [ ] Region metadata, OG cards, sitemap: SEO parity
- [ ] Drone loops (if D-B = loops or both): poster-first, pause control, reduced-motion off
- [ ] PHOTO-F2 Share/Copy link, PHOTO-F4 LV95, ENG-F1 controls + transcript, PLAT-F1 JSON-LD, PLAT-F2 offline list

### Add after validation (v2.1.x)

- [ ] Map-collar coordinate frame: once the base sequence is stable and Tim has signed off its visual design
- [ ] Sequence altimeter rail and sticky mini plate: when the sequence layout is settled
- [ ] Overview → local plate morph: after both maps exist
- [ ] Lightbox thumbnail index: when a region passes about 12 photos
- [ ] Films with sound: after the hosting/CSP decision and caption authoring
- [ ] Clips in the lightbox sequence; flight paths from telemetry

### Future consideration (v3+)

- [ ] Tag/season filters (PHOTO-F3): revisit at 40+ photos across 5+ regions
- [ ] "Ask about this photo" (PHOTO-F1), print licensing (PLAT-F4), blog (PLAT-F3): explicitly out of v2.1

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---|---|---|---|
| Region data model + multi-region pipeline | HIGH | HIGH | P1 |
| Region page with immersive uncropped sequence | HIGH | HIGH | P1 |
| Overview map + synced region list | HIGH | HIGH | P1 |
| URL scheme + redirects + Home links | HIGH | MEDIUM | P1 |
| Lightbox scoped per region + end card | MEDIUM | LOW | P1 |
| Per-region footer attribution and extent | MEDIUM (licence) | MEDIUM | P1 |
| Region metadata, OG, sitemap | MEDIUM | LOW | P1 |
| Share / Copy link | MEDIUM | LOW | P1 |
| ENG-F1 prev/next + transcript | MEDIUM | LOW | P1 |
| PLAT-F1 JSON-LD | LOW–MEDIUM | LOW | P1 (committed) |
| PLAT-F2 offline cached list | LOW | LOW | P1 (committed) |
| PHOTO-F4 LV95 | LOW | LOW | P1 (committed) |
| Drone loops in sequences | MEDIUM | LOW–MEDIUM | P1 if D-B includes loops |
| Map-collar frame | HIGH (identity) | MEDIUM | P2 |
| Sequence altimeter rail / sticky mini plate | MEDIUM | MEDIUM | P2 |
| Overview sheet-index rectangles + landmarks | MEDIUM | LOW–MEDIUM | P2 |
| Overview → local morph | LOW–MEDIUM | MEDIUM | P3 |
| Films with sound + captions | MEDIUM | MEDIUM–HIGH | P2 (after hosting) |
| Flight path on plate | LOW–MEDIUM | HIGH | P3 |

**Priority key:** P1 must have for v2.1. P2 should have, add when possible. P3 nice to have.

---

## Competitor Feature Analysis

| Feature | Location-grouped photographer sites (Format/Zenfolio/Squarespace examples) | Long-form photo essays (Shorthand, newsroom scrollytelling) | Map products (swisstopo sheet index, store locators) | Our approach |
|---|---|---|---|---|
| Index | Gallery grid by country/region, sometimes nested (North/South Island) | n/a | Sheet index or pin map plus list | Contour overview with sheet rectangles plus a synced region list |
| Series page | Grid of thumbnails → lightbox | Full-bleed images as pacing, captions as side notes | n/a | Uncropped full-width sequence with collar captions and a lightbox for detail |
| Wayfinding | Gallery menu, back to galleries | Progress, chapter heads | Coordinates, neatline, legend | Breadcrumb, "n / N", altimeter rail, next-region card, collar coords |
| Large set in lightbox | Counter, sometimes filmstrip | n/a | n/a | Counter scoped to region, end-of-series card, optional index overlay |
| Video | Homepage loop plus films page (studios) | Inline muted loops | n/a | Inline loops at altitude; films optional behind click-to-play |
| Accessible map path | Rare | n/a | List/table is the accessible path; list–map sync | Region list is the primary path; numbered pins on mobile |

Exemplar observations are LOW–MEDIUM (secondary roundups, not first-hand audits).

---

## Sources

**Codebase (HIGH, read directly this session):** `components/projects/DemoClip.tsx`, `components/projects/DemoTerminal.tsx`, `data/media/clips.json`, `public/service-worker.js`, `proxy.ts` (`buildCsp`), `next.config.ts` (Permissions-Policy), `lib/geo.ts` (`wgs84ToLv95`), `lib/footer-format.ts` (`formatLv95`), `lib/home-format.ts` (`formatCoordinates`), `components/photos/PhotoViewer.tsx` (no-wrap ends, announcement), `components/site/SiteNav.tsx` (sticky 64 px), `data/photos/editorial.ts` (4 slugs), `data/schemas/photo.ts`, `app/(site)/photos/` route tree (`@modal/(.)[slug]`, `[slug]`).

**ui-ux-pro-max (local skill):** `"video autoplay background"` → Auto-Play Video (prefer click-to-play, pause and captions, stop off-screen, honour reduced motion). `"carousel auto rotation controls"` → Auto-Rotating Content Controls. `"image gallery fullscreen immersive"` → image optimisation and srcset. `"map markers accessibility"`, `"share button"` and `"offline"` returned no on-topic match, so general guidance is used there.

**Web (classify-confidence: websearch unverified = LOW, cross-checked = MEDIUM):**
- MEDIUM. W3C Understanding SC 2.2.2 Pause, Stop, Hide: https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide ; GOV.UK WCAG wiki: https://github.com/alphagov/guide-to-wcag/wiki/2.2.2 ; accessibleweb.com Q&A on silent autoplay: https://accessibleweb.com/?p=60433
- MEDIUM. W3C Understanding SC 1.2.2 Captions (Prerecorded): https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded.html ; MDN `<track>`: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track
- MEDIUM. MDN `Navigator.share()` (transient activation, AbortError/NotAllowedError, not Baseline): https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share ; web.dev Web Share: https://web.dev/articles/web-share ; caniuse: https://caniuse.com/web-share ; MDN BCD issue on Chrome desktop platforms: https://github.com/mdn/browser-compat-data/issues/16823
- MEDIUM. Save-Data support (Chromium only): https://caniuse.com/wf-savedata ; https://web-platform-dx.github.io/web-features-explorer/features/savedata ; https://web.dev/articles/optimizing-content-efficiency-save-data
- LOW–MEDIUM. Background video practice (muted + playsinline, reduced-motion poster, Save-Data, 6–15 s): https://www.viget.com/articles/best-practices-for-background-videos ; https://developer.chrome.com/docs/modern-web-guidance/guides/performance/lazy-load-video-and-audio ; https://specification.website/spec/accessibility/reduced-motion/
- MEDIUM. swisstopo LV95 (E before N, 2/1 prefixes, Bern 2 600 000 / 1 200 000): https://www.swisstopo.admin.ch/en/the-swiss-coordinates-system ; https://en.wikipedia.org/wiki/Swiss_coordinate_system
- MEDIUM. Google image metadata (contentUrl plus one of creator/creditText/copyrightNotice/license; `license` for the Licensable badge; markup per page): https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata
- LOW–MEDIUM. Google VideoObject: https://developers.google.com/search/docs/data-types/video
- MEDIUM. Accessible maps (list as primary path, list–map sync, avoid `role="application"`): https://equalentry.com/?p=4111 ; https://leafletjs.com/examples/accessibility/ ; https://developers.google.com/maps/documentation/javascript/3d/marker-accessible ; https://sitepen.com/blog/navigating-accessibility-in-two-dimensions
- MEDIUM. Scroll-snap accessibility problems: https://adrianroselli.com/2021/07/scroll-snap-challenges.html ; https://github.com/w3c/csswg-drafts/issues/3602
- LOW. Firefox scroll-driven animations still behind a flag (June 2026, secondary): https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026
- LOW. Offline page listing cached pages: https://gomakethings.com/saving-recently-viewed-pages-offline-with-service-workers-and-vanilla-js/ ; https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage
- LOW. Large-lightbox conventions (counter, adjacent preload, filmstrip toggle): https://mantine.dev/x/lightbox/ ; https://www.techinterview.org/post/3233475171/build-image-gallery-lightbox-frontend/
- LOW. Location-grouped photographer portfolios: https://www.format.com/magazine/galleries/photography/landscape-photography-portfolios ; https://kimmalco.zenfolio.com/about.html
- LOW. Drone footage on portfolios (homepage loops, longer films, stills-first for photography): https://infomedia.com/?p=4987 ; https://landing.vsble.me/blog/images-vs-video-portfolios-choosing-the-best-for-creatives-2025-en ; https://reallygooddesigns.com/videographer-portfolio-websites
- LOW. Photo-essay pacing (full-bleed as a pacing device, styled captions): https://designsystem.wvu.edu/components/photos-and-videos/full-bleed-photo ; https://shorthand.com/the-craft/immersive-photo-essays/amp-index.html
- MEDIUM. Vercel Hobby 100 GB/month Fast Data Transfer: https://vercel.com/docs/limits ; https://vercel.com/pricing

**LOW, from memory and not verified this session:** iOS Low Power Mode blocking muted autoplay; DJI `.SRT` telemetry contents; swisstopo sheet-index (Blattübersicht) as a visual model; whether Chrome on macOS now ships `navigator.share`.

---
*Feature research for: topographic photographer-engineer portfolio, v2.1 Survey Expansion*
*Researched: 2026-11-12*
