# Stack Research — v2.0 "Topographic Identity"

**Domain:** Next.js portfolio UI/UX rework: real-terrain WebGL hero, build-time DEM/EXIF pipeline, photo light table, platform-native motion
**Researched:** 2026-10-10
**Confidence:** HIGH for versions, the motion upgrade, View Transitions, the EXIF API and the DEM tooling (verified against the npm registry, official docs and **scripts run against the real photos and real swisstopo data**). MEDIUM for shader, font and icon judgment calls.

> Scope: only additions or changes needed for v2.0. The validated v1.0 stack (Next/React/Tailwind v4/R3F/zod/Resend/Upstash/CSP/SW/Jest/Playwright) is not re-evaluated.

---

## 0. Headline findings (read first)

1. **The upgrade path is a chain, not just "framer-motion 14".** Stable `<ViewTransition>` ships in **React 19.3.0** (2026-09-09) and **Next.js 16.4.0** (2026-10-06, which ships React 19.3). The installed **@react-three/fiber 9.6.1 declares `react: ">=19 <19.3"`**, so moving to React 19.3 **requires R3F ≥ 9.8.0** (9.8.1 is current). Plan it as one isolated "platform bump" phase: Next 16.4 + React 19.3 + R3F 9.8.1 + motion 14.1.
2. **Moving framer-motion from 12 to 14 has no breaking changes for this repo.** The only breaking change in 13.0 is the removal of `@emotion/is-prop-valid` (styled-components/emotion users only, and this repo uses neither). 14.0 only removed internal APIs. The official path is to **swap the package to `motion` and import from `motion/react`**: a mechanical find-and-replace across 24 files. There is no codemod.
3. **Do not ship the heightmap as a 16-bit PNG decoded by the browser.** Browsers don't reliably keep 16 bits through `<img>`/`TextureLoader` into WebGL. Keep the 16-bit PNG as the build artifact (verified lossless with sharp), but **decode it on the client with `fast-png` (11 KB gz)** into a `Uint16Array`, then build the terrain geometry on the CPU.
4. **swissALTI3D does not fully cover the Matterhorn's Italian side.** In a 12×12 km box around Zermatt and the summit, **10 tiles are missing** (south of N 1'090'000). The same-agency **swissALTIRegio** (10 m, one Cloud-Optimized GeoTIFF, cross-border coverage) gives a hole-free 1024² window in **under 1 s** via HTTP range requests. This is a decision for the user (§4).
5. **Firefox stable (157) still lacks CSS scroll-driven animations** (Nightly/"preview" only). Chrome 115+ and Safari 26+ have them. The altimeter/ascent must run on Motion's `useScroll` (works everywhere, and the R3F camera needs JS progress anyway). Use CSS `animation-timeline` only for decorative effects behind `@supports`.
6. **Your local `node_modules` is out of sync with the lockfile.** Installed: next 16.1.6, react 19.2.4, framer-motion 12.35.1, three 0.183.2, R3F 9.5.0, Playwright 1.58.2, tailwindcss 4.2.1. The lockfile says next 16.2.6, framer-motion 12.39.0, Playwright 1.60.0 and so on. **Run `npm ci` before taking the Phase-1 screenshot baselines**, or the baselines won't match what CI and Vercel build.

---

## Recommended Stack

### Core technologies (upgrades)

| Technology | Version | Purpose | Why recommended | Confidence |
|---|---|---|---|---|
| `next` | **16.4.x** (pick up the out-of-band security release announced for **2026-10-14**) | Framework | Ships React 19.3, so `<ViewTransition>` is stable with **no config flag** (the inert `experimental.viewTransition` flag was removed in 16.3.0-canary.95). `<Link transitionTypes={[...]}>` and `router.push(..., { transitionTypes })` are documented in 16.4. No breaking changes are listed for 16.3/16.4. | HIGH |
| `react` / `react-dom` | **19.3.0** | UI runtime | Stable `ViewTransition`, `addTransitionType`, Fragment refs, `browser()`. No breaking changes. Needed in `package.json` as well as Next's vendored copy, because Jest/Testing Library use the installed copy. | HIGH |
| `@types/react` / `@types/react-dom` | **19.3.0** | Types | Exposes `ViewTransition` typings. | HIGH |
| `motion` (replaces `framer-motion`) | **14.1.0** | Component motion, scroll progress | The official package. `framer-motion@14.1.0` is now an internal pinned dependency of `motion`. Same API through `motion/react`. Peer range `react ^18 \|\| ^19`. | HIGH |
| `@react-three/fiber` | **9.8.1** | R3F renderer | **Required** for React 19.3: 9.6.1/9.7.0 peer is `<19.3`, 9.8.x is `<19.4`. | HIGH |
| `@react-three/drei` | **10.7.9** | R3F helpers | Patch bump. Peer `react ^19`, `fiber ^9`. | HIGH |
| `three` | keep **^0.184** (0.186.1 available) | WebGL | No v2.0 feature needs 0.186. Bump only together with R3F if you want; there is no blocker either way. | MEDIUM |
| `@playwright/test` | **1.64.0** | E2E + visual regression | 1.64 ships Chromium 156 / Firefox 157 / WebKit 27.2. Check one 1.64 behaviour change: device `screen` values now feed media queries. | HIGH |

### Supporting libraries (new)

| Library | Version | Where | Purpose | When to use | Confidence |
|---|---|---|---|---|---|
| `geotiff` | **3.0.5** (devDep) | build script | Read the swisstopo COG via HTTP range requests, window by LV95 bbox, resample (`readRasters({ bbox, width, height, resampleMethod: 'bilinear' })`). **Verified**: Matterhorn window read from swissALTIRegio in 821 ms. | Always (DEM step) | HIGH |
| `d3-contour` | **4.0.2** (devDep) | build script | Marching-squares isolines → GeoJSON MultiPolygons in pixel space. ESM-only (`"type":"module"`), works in a `.mjs` script (verified). Its last release was 2023-01, but it is finished software. | Always (contour SVG) | HIGH |
| `simplify-js` | **1.2.4** (devDep) | build script | Douglas–Peucker / radial simplification of contour rings. **Verified on real data:** 29 levels at 100 m go from ~870 KB to **50 KB raw / 13.5 KB brotli** at 1 px tolerance; 15 levels at 200 m give **25.6 KB / 7 KB br**. | Always (keeps SVG small) | HIGH |
| `exif-reader` | **2.0.3** (devDep) | build script | Parse `sharp().metadata().exif` buffer. **Verified** on all 4 originals (API in §6). | Always (EXIF step) | HIGH |
| `sharp` | keep **0.34.5** (0.35.5 available) | build script | Already present. Also encodes the 16-bit grey PNG (**verified lossless on 0.34.5**: pass a `Uint16Array` + `.toColourspace('grey16')`). No reason to bump in this milestone. | Always | HIGH |
| `fast-png` | **8.0.0** (runtime dep, client) | terrain loader | Decodes the 16-bit grey PNG into a `Uint16Array` in the browser (verified: 512² in ~22 ms in Node; deps `fflate` + `iobuffer`, ~11 KB gz). Load it in the lazily imported hero chunk only. | Terrain hero | HIGH (lib) / MEDIUM (that browsers can't keep 16 bits reliably — sources conflict, so don't depend on it) |
| `@phosphor-icons/react` | **2.1.10** | UI | UI glyphs (close, arrows, grid/rows/map toggles, camera, pin, GitHub/LinkedIn logos). Import from `@phosphor-icons/react/dist/ssr` in Server Components. See §9. | UI icons only. Keep bespoke cartographic marks as inline SVG. | MEDIUM |
| `eslint-plugin-better-tailwindcss` | **4.9.0** (devDep) | lint guard | Rule `no-restricted-classes` takes **regex** patterns, which is exactly the "no `dark:`, no stock palette" guard. Peer `tailwindcss ^4.1.17`, `eslint ^9`. | Foundation phase | HIGH |
| `@axe-core/playwright` | **4.13.0** (devDep) | a11y checks | "axe clean" requirement in the edge-pages/cleanup phase. | Verification phase | HIGH |

### Development tools / techniques (no new packages)

| Tool | Purpose | Notes |
|---|---|---|
| Tailwind v4 `@theme { --color-*: initial; }` | **Compile-time** palette guard | Removes the stock palette so `bg-blue-500` emits no CSS. Pair it with the lint rule for a hard error. Define only night-map OKLCH tokens after the reset. |
| swisstopo approximate WGS84 → LV95 formulas (~15 lines) | Place EXIF GPS on the DEM grid | **Verified** on the real photos (§6). About 1 m accuracy, which is enough. Do not add `proj4`. |
| Native `<dialog>` + `showModal()` | Lightbox shell | Built-in focus trap, Esc and inert background, so no lightbox library. |
| CSS justified rows (`flex-grow: aspect-ratio`) | Grid view | Zero dependencies for 4 to ~30 photos. |
| CSS scroll-snap | Carousel view (2D) | Platform-native. Keep `@react-spring/three` only if the 3D carousel survives the redesign. |

---

## Installation

```bash
# 0. Re-sync local install with the lockfile FIRST (node_modules is stale)
npm ci

# 1. Platform bump (one isolated phase, after screenshot baselines exist)
npm install next@16.4 react@19.3.0 react-dom@19.3.0 @react-three/fiber@9.8.1 @react-three/drei@10.7.9
npm install -D @types/react@19.3.0 @types/react-dom@19.3.0 eslint-config-next@16.4 @playwright/test@1.64.0
npx playwright install --with-deps chromium firefox webkit

# 2. Motion package swap (same phase or the next, still isolated)
npm uninstall framer-motion && npm install motion@14.1.0

# 3. Build-time data pipeline (devDeps: they never reach the client)
npm install -D geotiff@3.0.5 d3-contour@4.0.2 simplify-js@1.2.4 exif-reader@2.0.3

# 4. Runtime additions
npm install fast-png@8.0.0 @phosphor-icons/react@2.1.10

# 5. Guards / verification
npm install -D eslint-plugin-better-tailwindcss@4.9.0 @axe-core/playwright@4.13.0
```

---

## 1. framer-motion 12.35 → motion 14.1 (verified)

**What the repo actually uses** (grep across `app/ components/ lib/`, 24 files): `motion.*` (147 uses, mostly `motion.div`), `AnimatePresence` (6 files; `mode=` ×2; `exit=` ×10), `useScroll` (3), `useTransform` (3), `useMotionValue` (2), `useMotionValueEvent` (`GlassmorphismNav`, 3 calls; `useGlowIntensity`), `animate()` (`ProjectCard`), `type MotionValue`, `layoutId` (3: `FeatureShowcase`, `GlassmorphismNav`, `Header`), `whileInView` (12), `whileHover` (12), `whileTap` (5), `transition=` (70). Not used: `variants`, `drag`, `LayoutGroup`, `MotionConfig`, `useAnimate`, `useInView`, `motion()` factory, `.onChange`. `useReducedMotion` is the repo's own `lib/useReducedMotion.ts`, not Motion's.

**Breaking changes between 12.35 and 14.1** (from the official CHANGELOG and upgrade guide):

| Version | Change | Impact on this repo |
|---|---|---|
| 13.0.0 (2026-08-05) | Optional `@emotion/is-prop-valid` dependency removed. Pass `<MotionConfig isValidProp={isPropValid}>` explicitly if needed. | **None.** No styled-components/emotion. |
| 13.2.0 | `MotionValue.set()` drops its `useDefaultValueType` argument. `MotionValueState` no longer caches `latest`. | None (internal or unused). |
| 13.4.4 / 13.4.7 / 13.5.0 | `useScroll`: ScrollTimeline removed for JS callbacks; more `offset`s hardware-accelerated via `ViewTimeline`; then "main thread for all `offset` animations". | **Behavioural.** `Hero3DMountain`, `MountainTerrain3D` and `useGlowIntensity` use `useScroll` + `useTransform`/`useMotionValueEvent`, so cover them with screenshot and e2e checks. API unchanged. |
| 14.0.0 (2026-10-02) | "No breaking changes": internal APIs removed, internal packages pinned. | None. |

**New in this window, relevant to v2.0:** `AnimateView` (13.4, React-19.3 `ViewTransition` wrapper), `animateView` (12.41, vanilla), `motion/three` `threeEffect` (13.2, drive three.js uniforms/materials), `animateLayout` (14.1). None are needed. Plain React `<ViewTransition>` covers the lightbox (§2).

**Migration (no codemod exists, so do it mechanically):**

```bash
# Replace imports in all 24 files, then type-check
grep -rl "from 'framer-motion'" app components lib | xargs sed -i "s/from 'framer-motion'/from 'motion\/react'/"
npm run type-check && npm test && npx playwright test
```

Use `motion/react-client` only if you want `motion.*` inside a Server Component (the package exports `./react-client`). Jest works unchanged: `motion` ships a CJS `require` export.

**Confidence:** HIGH. **Regression risk:** low, concentrated in the three `useScroll` consumers. Take Playwright baselines before the swap.

---

## 2. View Transitions (thumbnail → lightbox)

**Status, verified:**
- `<ViewTransition>` and `addTransitionType` are **stable in React 19.3.0** (react.dev blog, 2026-09-09).
- **Next.js 16.4 ships React 19.3. View transitions "work in the App Router with no configuration."** Next 16.2 needed `experimental.viewTransition` plus the experimental React channel. That flag was removed as inert in 16.3.0-canary.95. The current `next.config.ts` doesn't set it, so nothing to remove.
- In Next, **route navigations are transitions**, so named `<ViewTransition>`s animate automatically. In-page state changes must be wrapped in `startTransition` (plain `setState` does not animate).

**Browser support (MDN BCD, 2026-10):**

| Feature | Chrome | Safari | Firefox (stable = 157) |
|---|---|---|---|
| Same-document `startViewTransition`, `view-transition-name` | 111 | 18.0 | 144 |
| `view-transition-class` (used by React's `share`/`enter` classes) | 125 | 18.2 | 144 |
| Transition types / `:active-view-transition-type()` | 125 | 18.2 | 147 |

All three current engines support everything React needs. Unsupported browsers just don't animate, so nothing breaks.

**Recommended pattern.** Shared-element morph with React `<ViewTransition name>`, lightbox as a native `<dialog>`, opened inside `startTransition`:

```tsx
// Thumbnail (grid / map / carousel)
import { ViewTransition, startTransition } from 'react';
<button onClick={() => startTransition(() => setOpenId(photo.id))}>
  <ViewTransition name={`photo-${photo.id}`} share="morph" default="none">
    <Image src={photo.src} alt={photo.alt} />
  </ViewTransition>
</button>

// Lightbox: render the same name only while open (names must be unique on the page at any time)
{openId && (
  <dialog ref={dialogRef} /* dialogRef.current.showModal() in an effect */>
    <ViewTransition name={`photo-${openId}`} share="morph" default="none">
      <Image src={...} alt={...} />
    </ViewTransition>
  </dialog>
)}
```

```css
::view-transition-group(.morph) { animation-duration: 400ms; }
::view-transition { pointer-events: none; }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation-duration: 0s !important; }
}
```

Gotchas from the Next guide: with `default="none"` you **must** keep an explicit `share`, or the pair silently stops morphing. A shared pair only forms if the destination renders in the **same commit**, so a Suspense fallback breaks the morph. Don't animate the same element with both Motion (`AnimatePresence`/`layoutId`) and a ViewTransition. If the lightbox becomes a route (intercepting `@modal/(.)photos/[slug]` for deep links), the same `name` pattern works with `<Link transitionTypes={['nav-forward']}>`.

**Confidence:** HIGH (official docs plus BCD). Interaction of the top-layer `<dialog>` with VT snapshots: MEDIUM. Verify in a spike.

---

## 3. CSS scroll-driven animations

| Engine | `animation-timeline: scroll()/view()` |
|---|---|
| Chrome/Edge | 115+ |
| Safari | 26+ |
| Firefox | **Not in stable 157.** BCD says `"preview"` (Nightly 160 only). |

caniuse puts global support at ≈ 88%. **Implication:** never put essential UI (altimeter value, waypoint reveal, nav state) on CSS scroll timelines alone.
- **Ascent / altimeter rail / R3F camera:** `useScroll({ target, offset })` from `motion/react`. Read `scrollYProgress.get()` inside `useFrame` (no React re-render per frame). Since 13.4.7 Motion hardware-accelerates eligible offsets via `ViewTimeline` where available and falls back elsewhere, so you get the platform benefit with cross-browser coverage.
- **Decorative only** (contour parallax, section fades): pure CSS behind `@supports`.

**Tailwind v4 interaction:** v4.3 has **no** `animation-timeline`/`animation-range` utilities (grep of the installed dist confirms). Use `@utility` in `app/globals.css`, or arbitrary properties, plus the `supports-[…]:` variant:

```css
@utility reveal-on-view {
  @supports (animation-timeline: view()) {
    animation: reveal linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 30%;
  }
}
@media (prefers-reduced-motion: reduce) { .reveal-on-view { animation: none; } }
```

**Confidence:** HIGH (BCD plus the Mozilla product-details feed for Firefox stable = 157.0.1).

---

## 4. DEM pipeline (verified end-to-end)

**Source facts (from the swisstopo STAC API, `data.geo.admin.ch/api/stac/v1`):**
- Collection `ch.swisstopo.swissalti3d`: 1 km × 1 km tiles in LV95 (EPSG:2056), named `swissalti3d_{year}_{E_km}-{N_km}`. Editions 2019 and **2024** exist for the area. Each tile has a Cloud-Optimized GeoTIFF (Float32, nodata −9999, 128² internal tiles, 1 overview) and XYZ zip, at **0.5 m** (~18 MB/tile) and **2 m** (~1.2 MB/tile, 500×500 px).
  - Matterhorn summit: tile **`2617-1091`** (2024 edition; max 4477.2 m). LV95 summit ≈ E 2'617'027 / N 1'091'670.
  - Zermatt: tile **`2624-1096`** (min ~1591 m).
  - URL pattern: `https://data.geo.admin.ch/ch.swisstopo.swissalti3d/swissalti3d_2024_2617-1091/swissalti3d_2024_2617-1091_2_2056_5728.tif`
  - **Coverage gap:** in the box E 2614–2626 / N 1088–1100, these tiles are **missing**: 2614–2617 × 1088–1089, 2618-1088/1089, 2619-1088 (Italian side, south of the summit).
- Collection `ch.swisstopo.swissaltiregio`: **10 m** DTM, **one COG** for CH plus ≥100 km of neighbouring countries (Italian national DTM outside CH, smoothed at seams), 6 overviews. **Verified:** window `[2613000,1088000,2627000,1099000]` → 1024×805 Float32, 0 nodata, 1518–4472 m, **821 ms** including network.

**Recommendation (decision for the user, since it deviates from the locked "swissALTI3D" wording):**

| Option | Pros | Cons |
|---|---|---|
| **A. swissALTIRegio 10 m (recommended)** | One range-read COG. No holes on the Italian side. 10 m is finer than the output grid anyway (12 km / 512 px ≈ 23 m/px). Build step under 1 s. Same agency. | 10 m smooths the summit (window max 4472–4476 m vs official 4,478 m). Attribution wording for the cross-border portion is not stated explicitly (gap below). |
| B. swissALTI3D 2 m tile mosaic | Literally "swissALTI3D", the most precise, and the standard "© swisstopo" attribution applies. | ~130 tiles, so 130 range reads or ~160 MB download. **The south face/Cervinia side has holes**: crop to N ≥ 1'090'000 or fill nodata. |

Either way, **label the altimeter with the official 4,478 m and 1,620 m-class values**, not the DEM min/max (bilinear resampling clips peaks).

**Build-script shape (verified in a scratch prototype, Node 24):**

```js
// scripts/build-terrain.mjs  (run in prebuild, or once with outputs committed; keep a cache dir gitignored)
import { fromUrl } from 'geotiff';
import sharp from 'sharp';
const tiff = await fromUrl('https://data.geo.admin.ch/ch.swisstopo.swissaltiregio/swissaltiregio/swissaltiregio_2056_5728.tif');
const bbox = [2614000, 1088000, 2626000, 1100000];           // LV95 metres, 12×12 km
const [h] = await tiff.readRasters({ bbox, width: 512, height: 512, resampleMethod: 'bilinear' }); // Float32Array, row 0 = north
const u16 = Uint16Array.from(h, (v) => Math.round(v));        // metres; use v*10 for decimetres
await sharp(u16, { raw: { width: 512, height: 512, channels: 1 } }) // pass the Uint16Array itself
  .toColourspace('grey16').png({ compressionLevel: 9 }).toFile('public/terrain/matterhorn-512.png');
```

**Gotchas found while verifying:**
- `sharp(Buffer, { raw: { depth: 'ushort' } })` silently produced **garbage** (824k diffs). Passing the `Uint16Array` directly works losslessly on sharp 0.34.5 and 0.35.5.
- **Don't resample float rasters with sharp**: a float `resize` came back normalized to 5–17. Resample in geotiff.js (`width/height` + `resampleMethod`) and use sharp only to encode.
- Reading a 16-bit PNG back with sharp needs `.toColourspace('grey16').raw({ depth: 'ushort' })`, otherwise you get 3-channel sRGB.

**Measured asset sizes (12×12 km window, metre precision):** 256² → **92 KB**, 384² → **198 KB**, 512² → **336 KB**, 1024² → ~1.4–1.8 MB. **Recommend 512² for desktop and 256² for mobile/low-tier** (picked at runtime). **Do not ship 1024².** A Terrarium-style 8-bit RGB PNG came out larger (690 KB at 512²) and raw u16 + brotli was no better (388 KB).

**Alternative rejected:** AWS Terrain Tiles (Terrarium). Coarser in the Alps (SRTM/ASTER-derived mix), a long multi-source attribution list, and it would mean either runtime tile fetches (blocked by the CSP and the same-origin constraint) or the same build step with worse data.

**License (verified, swisstopo OGD terms):** free use including commercial, modification and redistribution. A **source reference is mandatory**: "© swisstopo" or "Federal Office of Topography swisstopo". swisstopo says swissALTIRegio's reference is given in its own documentation; I couldn't find a distinct string, so check the product docs before shipping (gap).

**Confidence:** HIGH (tile IDs, formats, tooling, sizes all executed). MEDIUM (swissALTIRegio attribution string).

---

## 5. d3-contour → SVG paths (verified)

```js
import { contours } from 'd3-contour';
import simplify from 'simplify-js';
const thresholds = []; for (let z = 1600; z <= 4400; z += 100) thresholds.push(z);
const levels = contours().size([W, H]).thresholds(thresholds)(Float64Array.from(heights));
const paths = levels.map((mp) => ({
  z: mp.value,
  d: mp.coordinates.flatMap((poly) => poly.map((ring) => {
      const s = simplify(ring.map(([x, y]) => ({ x, y })), 1 /* px tolerance */, true);
      return s.length < 3 ? '' : 'M' + s.map((p) => `${Math.round(p.x * 2) / 2} ${Math.round(p.y * 2) / 2}`).join('L') + 'Z';
    })).join(''),
}));
// emit typed data/contours.ts (or an inline <svg> component) with viewBox="0 0 W H"; mark every 5th level as an index contour
```

Coordinates come out in grid pixels, row 0 = north (GeoTIFF order), so no y-flip is needed for SVG. **Measured** (512² grid): unsimplified `geoPath` output is ~870 KB. Simplify at 1 px with ½-px rounding gives **50 KB raw / 17 KB gzip / 13.5 KB br (100 m interval)** and **25.6 KB / 7 KB br (200 m)**. Use 100 m with every 5th line as an index contour for the static fallback/print look; 200 m for small or thumbnail uses. Don't add `d3-geo` just for `geoPath`: the manual path builder above is smaller and allows rounding. `@types/d3-contour` (3.0.6) is only needed if the script is written in TypeScript.

**Confidence:** HIGH.

---

## 6. EXIF via sharp + exif-reader (verified on the 4 originals)

```js
import sharp from 'sharp';
import exifReader from 'exif-reader';           // CJS default export; fine from .mjs
const { exif, width, height } = await sharp(file).metadata(); // exif: Buffer starting "Exif\0\0" (exif-reader accepts that)
const e = exif ? exifReader(exif) : null;
const dms = ([d, m, s]) => d + m / 60 + s / 3600;
const photo = {
  camera: e?.Image?.Model,                      // 'Canon EOS 6D Mark II'
  lens: e?.Photo?.LensModel,                    // 'EF24-105mm f/4L IS II USM'
  takenLocal: e?.Photo?.DateTimeOriginal,       // Date — see timezone note
  exposure: e?.Photo?.ExposureTime,             // 0.002  -> format as 1/500 s
  aperture: e?.Photo?.FNumber,                  // 5.6
  iso: e?.Photo?.ISOSpeedRatings,               // 100
  focalLength: e?.Photo?.FocalLength,           // 105
  lat: e?.GPSInfo?.GPSLatitude && dms(e.GPSInfo.GPSLatitude) * (e.GPSInfo.GPSLatitudeRef === 'S' ? -1 : 1),
  lon: e?.GPSInfo?.GPSLongitude && dms(e.GPSInfo.GPSLongitude) * (e.GPSInfo.GPSLongitudeRef === 'W' ? -1 : 1),
  altGps: e?.GPSInfo?.GPSAltitude,              // GPSAltitudeRef absent => above sea level
};
```

**Real values extracted:**

| File | DateTimeOriginal | Exposure | Lens / FL | GPS (dec.) | GPS alt | DEM alt at point |
|---|---|---|---|---|---|---|
| IMG_0605 | 2021-09-06 10:48:46 | 1/500 f/5.6 ISO100 | 105 mm | 46.01502 N 7.74144 E (LV95 2'623'452/1'095'986) | 1626.1 | 1616.9 |
| IMG_0629 (waterfall) | 2021-09-06 11:22:57 | 1/160 f/4 ISO1600 | 70 mm | 46.00811 N 7.73854 E | 1714.9 | 1689.4 |
| IMG_0662 | 2021-09-07 10:58:25 | 1/400 f/5.6 ISO100 | 70 mm | 45.99075 N 7.71035 E | 2597.3 | 2584.6 |
| R004-011 (film scan) | 2020-02-12 15:38:16 | — | — | none | — | — |

**Gotchas:**
- **Timezone.** The camera writes **no `OffsetTimeOriginal`**. exif-reader parses the naive local time **as UTC** (`Date.UTC`). Format dates with `timeZone: 'UTC'`, or store the string, or the date shifts by viewer timezone. `GPSTimeStamp` is true UTC: 08:48:44Z against 10:48:46 local confirms CEST (+02:00).
- GPS arrives as **degrees + decimal minutes** (`[46, 0.90102, 0]`). The `dms()` formula handles it.
- **GPS altitude is 9–25 m off the DEM.** Place 3D waypoints at the **DEM-sampled height** (pins sit on the surface). If shown, display the EXIF altitude as "GPS". The "1,626 m Zermatt" rail start comes from IMG_0605's GPS; the DEM says ~1,617 m there.
- Originals are **12480×8320** (Lightroom "Enhanced"). Sharp handles them, but cache the extraction result (keyed by mtime) so prebuild stays fast.
- **Don't use `exifr`**: last release 2022 and redundant.

**Confidence:** HIGH (executed).

---

## 7. R3F 9 terrain + contour shader

**Recommendation: CPU-built geometry from the decoded heights, not vertex-shader displacement.**

| | CPU geometry (recommended) | Vertex-shader displacement |
|---|---|---|
| Precision | Exact (Uint16 → Float32 positions) | Needs a float/u16 texture path. Browser PNG decode risks 8-bit (§ headline 3). |
| Normals | `computeVertexNormals()` once | Must sample neighbours in the shader |
| Waypoint placement / raycast / hover | Works (`raycaster` hits real triangles) | Raycast hits a flat plane |
| Cost | 512² = 262k verts built once (~ms) | Same vertex count, plus texture fetches every frame |

Pipeline: `fetch('/terrain/matterhorn-512.png')` (same-origin, so CSP `connect-src 'self'` is fine) → `fast-png` decode → `PlaneGeometry(size, size, N-1, N-1)` with heights written into `position.y` → `computeVertexNormals()`.

**Contour lines in the fragment shader** (screen-space anti-aliased, constant pixel width at any zoom). WebGL2 is the three.js default, so `fwidth` is built in:

```glsl
varying float vHeight;               // world-space elevation in metres, passed from the vertex shader
uniform float uInterval;             // 20.0 or 50.0
uniform vec3  uLine, uIndexLine, uGround;
void main() {
  float f = vHeight / uInterval;
  float d = abs(fract(f - 0.5) - 0.5) / fwidth(f);         // distance to nearest isoline in px
  float minor = 1.0 - smoothstep(0.0, 1.0, d);
  float fi = vHeight / (uInterval * 5.0);
  float major = 1.0 - smoothstep(0.0, 1.5, abs(fract(fi - 0.5) - 0.5) / fwidth(fi));
  vec3 col = mix(uGround, uLine, minor * 0.6);
  gl_FragColor = vec4(mix(col, uIndexLine, major), 1.0);
}
```

Drive scroll ascent via a `uProgress` uniform and camera path in `useFrame`, reading `scrollYProgress.get()`. Use `frameloop="demand"` + `invalidate()` on scroll to stop rendering when idle.

**drei helpers worth using:** `shaderMaterial` (typed uniforms + `extend`), `PerformanceMonitor` (drop DPR or switch 512→256 mesh / static fallback on low FPS), `AdaptiveDpr`. **Avoid `useDetectGPU`**: it fetches benchmark data from `https://unpkg.com/detect-gpu@…/dist/benchmarks` (verified in `node_modules/detect-gpu`), which the CSP `connect-src 'self'` blocks and which violates the same-origin constraint. Skip `ScrollControls` (it hijacks scroll and fights native scroll and Motion `useScroll`), `OrbitControls` (scroll-driven camera only) and `Html` for many waypoints (each is a DOM overlay; project positions once into a single DOM layer instead).

**`three-custom-shader-material` (6.4.0, ~4 KB gz): not warranted.** It's only useful to keep PBR lighting from `MeshStandardMaterial` *and* add contours. A night-map look is unlit or flat-shaded by design, so a ~40-line `shaderMaterial` with a simple Lambert term from the computed normals is smaller and fully controlled. Revisit only if a later phase wants physically lit terrain plus shadows.

**Confidence:** MEDIUM-HIGH (standard techniques; the 16-bit browser-decode concern is MEDIUM per the conflicting sources).

---

## 8. Fonts (next/font/google, self-hosted, so `font-src 'self'` holds)

Verified in Next's bundled `font-data.json`, plus latin variable WOFF2 sizes fetched from Google Fonts:

| Family | Axes (variable) | Italic | Latin WOFF2 | Character for "Swiss survey" | ui-ux-pro-max hit |
|---|---|---|---|---|---|
| **Schibsted Grotesk** (proposed) | wght 400–900 | yes | **46.8 KB** | Robust grotesk, newspaper heritage (Bakken & Bæck); strong heavy weights for big numerals/headlines. Popularity rank 60. | yes (#4) |
| Host Grotesk | wght 300–800 | yes | **20.3 KB** | Neutral, contemporary, a bit softer; lightest file. Rank 241. | yes (#3) |
| Familjen Grotesk | wght 400–700 | yes | **18.9 KB** | Scandinavian grotesk with distinctive quirks (ear/terminals), max 700, so less punch at display sizes. Rank 299. | yes (#1) |
| Archivo | **wdth 62–125** + wght 100–900 | yes | 90.1 KB | Most "technical/condensed signage". The width axis allows condensed trail-sign labels from one file, but it's the heaviest. | (not top-5) |

**Recommendation:** keep **Schibsted Grotesk** (display only, `weight: 'variable'` → `wght 400–900`, `subsets: ['latin']`, `display: 'swap'`, `adjustFontFallback`) + **Inter** (body, already loaded, opsz 14–32) + **JetBrains Mono** (data/altimeter, already loaded). That totals three families; Schibsted adds ~47 KB on first visit. Pick **Host Grotesk** instead if the extra ~26 KB matters more than display weight (it tops out at 800). Choose **Archivo** only if trail-sign labels truly need a condensed cut. Don't add a 4th family. Load the display face only on routes and blocks that use it (next/font preloads per-usage). ui-ux-pro-max's generic "Minimal Swiss" pairing is Inter/Inter; the locked display+body split wins.

**Confidence:** HIGH for availability and axes; MEDIUM for the aesthetic call (needs ui-ux-pro-max/UI-SPEC review against mockups).

---

## 9. Icons: Phosphor vs. inline SVG

- Current state: **70 inline `<svg>`** occurrences across `components/` and `app/`, mixing UI glyphs and bespoke graphics.
- ui-ux-pro-max default: **Phosphor primary, Heroicons fallback**, one family per surface, `aria-hidden` when decorative.
- `@phosphor-icons/react@2.1.10`: last publish **2025-05-22** (stale ~17 months, but icons are static SVG and the peer is `react >= 16.8`). It is **not** in Next's default `optimizePackageImports` list (`lucide-react` and `@heroicons/react/*` are).

**Recommendation (MEDIUM):** adopt Phosphor for **generic UI glyphs** and import from `@phosphor-icons/react/dist/ssr` (no React context, so it renders in Server Components with zero client JS). If you import from the package root in client components, add `experimental.optimizePackageImports: ['@phosphor-icons/react']`. Expected cost: ≈0.3–0.8 KB per icon actually used, only from Server Components. **Keep inline SVG** for domain marks: trail-sign grade bars (T1–T5), summit cross, waypoint pins, contour glyphs, altimeter ticks. Those are design assets, not icons. Use **one Phosphor weight** (`light` or `regular`) site-wide so it matches the thin contour linework.

---

## 10. Playwright visual regression with WebGL

WebGL output varies by GPU, driver and OS, so pixel baselines of a live canvas are flaky by nature. Layered approach:

1. **Baseline the static fallback, not the live canvas.** Most page baselines should use `test.use({ reducedMotion: 'reduce' })`, which renders the deterministic contour image fallback, a design requirement anyway. That gives stable screenshots of the whole page.
2. **Mask the canvas** wherever it does render: `await expect(page).toHaveScreenshot({ mask: [page.locator('canvas')], maskColor: '#0b0f14', animations: 'disabled', caret: 'hide' })`. Or use `stylePath: 'e2e/screenshot.css'` to hide volatile layers (`canvas { visibility: hidden }`).
3. **Readiness gates before capture:** `await page.evaluate(() => document.fonts.ready)`, and have the R3F scene set `data-ready="true"` on its wrapper after the heightmap decodes and the first frame renders (`onCreated` + one `useFrame` tick). Then `await expect(page.locator('[data-terrain][data-ready="true"]')).toBeVisible()`.
4. **One dedicated canvas test** (optional, Chromium only) with software GL for determinism: launch args `--use-angle=swiftshader --use-gl=angle` (fallback `--enable-unsafe-swiftshader`) and a looser `maxDiffPixelRatio: 0.02`. Freeze scroll progress via a query param (`?ascent=0.5`) so the camera pose is fixed.
5. **Generate baselines on Linux in the official image** (`mcr.microsoft.com/playwright:v1.64.0-noble`). Snapshots are per-platform (`-chromium-linux.png`) and the local machine is Windows, so don't commit Windows baselines for CI. Use `toHaveScreenshot` `type: 'webp'` (1.62+) to cut repo size if baselines grow.
6. Keep the visual project **Chromium-only** at first. Firefox/WebKit run functional e2e. The existing config already skips WebKit in CI.

**Confidence:** HIGH for the Playwright APIs; MEDIUM for the SwiftShader flags (they change across Chromium versions, so verify in a spike).

---

## Alternatives Considered

| Recommended | Alternative | When to use the alternative |
|---|---|---|
| `motion` (`motion/react`) | Keep `framer-motion@14.1.0` | Never: it's the same code, now an internal dependency of `motion`. Staying on the old name only defers a sed. |
| React `<ViewTransition>` | Motion `AnimateView` (13.4) / `layoutId` | `layoutId` if a morph must also work inside an R3F/DOM hybrid that VT snapshots can't capture. `AnimateView` only if you want Motion-controlled easing for VT. |
| swissALTIRegio 10 m | swissALTI3D 2 m mosaic | If a close-up summit inset (< 2 km wide) is added, or if literal "swissALTI3D" provenance matters more than Italian-side coverage. |
| CPU geometry + `fast-png` | Vertex displacement from an RG-packed 8-bit texture | If the terrain must stream several LODs on the GPU (not needed for one static hero). |
| `simplify-js` | Hand-written Douglas–Peucker (~30 lines) | If you want zero devDeps. It's equivalent. |
| Schibsted Grotesk | Host Grotesk / Archivo | See §8 (bytes vs. weight range vs. width axis). |
| Native `<dialog>` lightbox | `yet-another-react-lightbox` | Only if you need pinch-zoom/gestures beyond the existing `ZoomableImage`. |

## What NOT to Add

| Avoid | Why | Use instead |
|---|---|---|
| `gsap` (3.15, ~27 KB gz) | Locked decision. Duplicates Motion (scroll, timelines). | Motion `useScroll`/`animate` + CSS |
| `lenis` (1.3.26) | Smooth-scroll hijacking: fights native scroll, Motion `useScroll`, CSS scroll timelines, `prefers-reduced-motion` and keyboard/AT scrolling. ui-ux-pro-max flags scroll-jacking as a High-severity motion-sensitivity issue. | Native scroll |
| `exifr` (7.1.3) | Unmaintained since 2022. `exif-reader` + sharp already verified on the real files. | `exif-reader@2.0.3` |
| `proj4` | A ~30 KB+ dependency for one WGS84→LV95 conversion. | swisstopo approximate formulas (verified, ~1 m) |
| `@react-three/postprocessing` (3.2.0, published today) + `postprocessing` | Bloom/glow adds GPU cost and bundle weight, and its peer needs `fiber >= 9.7`. The night-map look comes from the contour shader. Also a brand-new release. | Shader-side glow (emissive index lines) |
| `three-custom-shader-material` | Unlit/stylized terrain doesn't need PBR extension. | drei `shaderMaterial` |
| drei `useDetectGPU` / `detect-gpu` | Fetches benchmarks from unpkg at runtime, which the CSP and same-origin constraint block. | drei `PerformanceMonitor` |
| drei `ScrollControls` | Takes over the scroll container. Conflicts with page-level ascent + altimeter rail. | Motion `useScroll` → uniforms/camera |
| Map libraries (Leaflet, MapLibre, Mapbox) | Runtime tile fetches violate same-origin/CSP and pull a basemap's palette onto the photos. | Contour SVG + EXIF pins in LV95 pixel space |
| AWS Terrain Tiles / any runtime DEM fetch | Same-origin constraint; worse alpine data. | Build-time swisstopo pipeline |
| 1024² heightmap | ~1.4–1.8 MB for no visible gain at hero size. | 512² desktop / 256² mobile |
| `cmdk` (14.6 KB gz) | No command palette in v2.0 scope. | — |
| `react-photo-album` | 4–30 photos don't need a layout engine. | CSS justified rows |
| `experimental.viewTransition` in next.config | Removed (inert) since 16.3. | Nothing: works by default in 16.4 |
| A 4th font family | Bytes plus visual noise. | Schibsted/Inter/JetBrains Mono only |

## Stack Patterns by Variant

**If the visitor has `prefers-reduced-motion: reduce` OR no WebGL2 OR `PerformanceMonitor` declines:**
- Render the build-time **contour SVG** (same data, ~13 KB br) plus a static altimeter. Don't mount the `<Canvas>` and don't download `fast-png`/heightmap. Gate it in a `next/dynamic` client island.

**If on a mobile or low-tier GPU:**
- Load `matterhorn-256.png` (92 KB). DPR cap 1.5. `frameloop="demand"`.

**If the lightbox becomes a route (shareable URLs):**
- Intercepting route `@modal/(.)photos/[slug]` + `<Link transitionTypes={['nav-forward']}>`. The same `ViewTransition name` pairing applies. Prefetch the target so the pair forms in one commit.

## Version Compatibility

| Package | Compatible with | Notes |
|---|---|---|
| `react@19.3.0` | `@react-three/fiber@>=9.8.0` | **9.6.1/9.7.0 peer `<19.3` would fail or warn.** Upgrade together. |
| `next@16.4.x` | `react@19.3.0` | 16.4 ships React 19.3. `<ViewTransition>` needs no flag. |
| `motion@14.1.0` | `react ^18 \|\| ^19` | Pins `framer-motion`, `motion-dom` and `motion-utils` at 14.1.0. Don't install `framer-motion` separately. |
| `@react-three/drei@10.7.9` | `fiber ^9`, `three >=0.159`, `react ^19` | OK with three 0.184/0.186. |
| `@react-spring/three@10.1.2` | `fiber >=6`, `react ^19` | Fine. Remove only if the 3D carousel is retired. |
| `eslint-plugin-better-tailwindcss@4.9.0` | `tailwindcss ^4.1.17`, `eslint ^9` | Repo has tailwind 4.3 / eslint 9. |
| `d3-contour@4.0.2` | ESM only | Use from `.mjs` scripts (the existing scripts already are). |
| `exif-reader@2.0.3` | CJS (`export =`) | Default-import from ESM works (verified). |
| `geotiff@3.0.5` | Node 24 (verified) | `fromUrl` uses range requests. Works with swisstopo COGs (no auth, no CORS needed at build). |

## Sources

- npm registry (`npm view`, 2026-10-10): versions, publish dates and peers for next, react, framer-motion, motion, @react-three/fiber/drei/postprocessing, three, sharp, geotiff, d3-contour, exif-reader, exifr, fast-png, simplify-js, @phosphor-icons/react, lucide-react, lenis, eslint-plugin-better-tailwindcss, @axe-core/playwright. HIGH
- Motion CHANGELOG, https://raw.githubusercontent.com/motiondivision/motion/main/CHANGELOG.md (12.39–14.1 entries). HIGH
- Motion upgrade guide, https://motion.dev/docs/react-upgrade-guide (13.0 / 14.0 / `motion/react`, no codemod). HIGH
- React 19.3 announcement, https://react.dev/blog/2026/09/09/react-19-3. HIGH
- Next.js 16.4 post, https://nextjs.org/blog/next-16-4. Next.js View Transitions guide (v16.4.0), https://nextjs.org/docs/app/guides/view-transitions. HIGH
- `experimental.viewTransition` removal (16.3.0-canary.95), https://releases.sh/release/rel_eHrDQECWkdHXLAOj-k6Wq-viewtransition-flag-removed-generatestaticparams-validation-hardened. MEDIUM (secondary, consistent with the official guide)
- Next.js security pre-announcement (2026-10-14), https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026. HIGH
- MDN browser-compat-data (`animation-timeline`, `view-transition-class`, `:active-view-transition-type`, `startViewTransition`), raw GitHub JSON. HIGH. Firefox stable version from https://product-details.mozilla.org/1.0/firefox_versions.json (157.0.1). HIGH. caniuse scroll-driven / view-transitions pages. MEDIUM
- swisstopo STAC API, https://data.geo.admin.ch/api/stac/v1/collections/ch.swisstopo.swissalti3d and `ch.swisstopo.swissaltiregio`: tile IDs, assets, coverage queried live. HIGH
- swisstopo OGD terms, https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices. HIGH. swissALTIRegio product page, https://www.swisstopo.admin.ch/en/height-model-swissaltiregio-20240405. MEDIUM (no explicit credit string)
- Playwright release notes, https://playwright.dev/docs/release-notes (1.58–1.64). HIGH
- 16-bit PNG → WebGL precision: PlayCanvas/Babylon forum reports vs. Chromium smoke-test commit (conflicting). MEDIUM, hence "decode yourself"
- **Executed verification (scratchpad prototypes):** sharp 0.34.5/0.35.5 grey16 round-trip; exif-reader on all 4 originals; geotiff range-read of swissALTIRegio and swissALTI3D tiles; d3-contour + simplify-js size measurements; fast-png 16-bit decode; WGS84→LV95 vs DEM altitude; Next `font-data.json` axes; Google Fonts WOFF2 sizes; Next default `optimizePackageImports` list; `detect-gpu` unpkg URL. HIGH
- ui-ux-pro-max searches: `--domain google-fonts "swiss grotesk technical editorial"`, `--domain icons "icon library"` (Phosphor primary), `--domain ux "reduced motion scroll parallax"` (scroll-jacking = High severity), `--domain typography "swiss minimal technical"`. No threejs/nextjs stack matches for terrain or view-transition queries (stated explicitly).

## Gaps / Open Questions

- **swissALTIRegio attribution string** for cross-border data: confirm in the product documentation before shipping (fallback: "© swisstopo" + "Height model: swissALTIRegio").
- **swissALTI3D vs swissALTIRegio**: user decision (locked wording vs. Italian-side holes).
- **Top-layer `<dialog>` + ViewTransition morph** and **canvas snapshotting during VT**: spike in Chromium, Safari 26 and Firefox 157.
- **SwiftShader launch flags** for the optional deterministic canvas screenshot: verify on Playwright 1.64's Chromium 156.
- **Waterfall location fix:** EXIF puts IMG_0629 at 46.00811 N 7.73854 E (LV95 2'623'230/1'095'218), which is the gorge south of Zermatt as the audit says. The corrected place name is a content task, not a stack task.

---
*Stack research for: v2.0 Topographic Identity (Next.js portfolio, real-terrain WebGL + build-time geodata)*
*Researched: 2026-10-10*
