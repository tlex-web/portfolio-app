# Pitfalls Research

**Domain:** v2.0 "Topographic Identity": a full UI/UX rework of a shipped Next.js 16 / React 19 / Tailwind v4 / R3F portfolio (photographer-engineer Tim Lui)
**Researched:** 2026-10-10
**Confidence:** HIGH for repo-specific findings (checked by inspecting the code, lockfile, `node_modules`, images and CI config). MEDIUM for library and platform behaviour taken from official docs or changelogs. LOW only where marked.

> This file builds on `.planning/milestones/v1.0-research/PITFALLS.md` and does not repeat it. v1.0 covered peer deps, CSP nonces, SW cache versioning, Three.js SSR/hydration, the Tailwind v4 upgrade and dynamic class names. Everything below is about **adding the v2.0 capabilities to this codebase without regressions**, which is the user's main frustration.
>
> **Confidence legend:** `[REPO]` = checked directly in this repo (HIGH). `[DOCS]` = official docs, changelog or registry metadata (MEDIUM; the research seam gives web sources a LOW tier, so verify these in the phase). `[LOW]` = hypothesis that needs confirmation.

---

## Critical Pitfalls

### Pitfall 1: Local `node_modules` doesn't match the lockfile, so baselines and the Motion upgrade get validated against the wrong code

**What goes wrong:**
The installed packages are not the ones CI and Vercel build. `npm ls` reports `framer-motion@12.35.1 invalid: "^12.39.0"`; the lockfile pins 12.39.0. Installed `next` is 16.1.6 while `package.json` asks for ^16.2.6. Dependabot merges (#77/#78) updated `package.json` and the lockfile, but local `node_modules` was never reinstalled. `[REPO]`

**Why it happens:**
Dependabot PRs get merged on GitHub and `npm ci` is never run locally. `vercel.json` uses `installCommand: "npm install"` while CI uses `npm ci`, so three environments can resolve differently.

**How to avoid:**
- Run `npm ci` as the first step of Phase 7, before capturing any screenshot baseline.
- Change `vercel.json` `installCommand` to `npm ci`.
- Add a `preflight` script that fails on `npm ls --depth=0` errors (exit code ≠ 0 on "invalid"/"missing"). Run it before `test:e2e` and before any `--update-snapshots`.

**Warning signs:** `npm ls` prints `invalid`; behaviour differs between local and the Vercel preview; the Motion "upgrade" diff contains unexpected 12.35→12.39 changes.

**Detection:** `npm ls --depth=0` exit code in a CI preflight step. Record the `node -p "require('framer-motion/package.json').version"` output in the baseline commit message.

**Phase to address:** 7 (first task)

---

### Pitfall 2: Screenshot baselines that capture the wrong state, or can't be compared in CI

**What goes wrong:**
Phase 7's whole regression net is Playwright `toHaveScreenshot`. In this repo it fails in six specific ways `[REPO]`:
1. **Wrong colour scheme.** Playwright's default `colorScheme` is `light`. The 23 `dark:` files render their **light** (broken) branch, so the baseline records the bug instead of the intended look.
2. **Wrong platform.** Snapshot files are suffixed by platform (`-chromium-win32.png` vs `-chromium-linux.png`) `[DOCS]`. Tim works on Windows, but CI e2e runs on `ubuntu-latest`. Baselines made locally are never compared in CI and fail there as "missing".
3. **Wrong server.** Locally, `webServer` runs `npm run dev` (`next dev --webpack`) with `reuseExistingServer: true`. That means dev overlays and indicator, strict-mode double effects, or a stale server from another branch on :3000.
4. **Non-deterministic content.** WebGL canvases render via SwiftShader in headless Linux. Motion `whileInView` sections start at `opacity: 0`, so full-page shots capture blank sections. `animations: 'disabled'` stops CSS animations, transitions and Web Animations, but not rAF-driven JS or WebGL `[DOCS]`.
5. **Service worker.** CI builds production, so `ServiceWorkerRegistration` registers. Second navigations may be served stale-while-revalidate HTML.
6. **Retries.** `retries: 2` in CI hides flaky visual diffs.

**How to avoid:**
Add a dedicated visual project and keep functional e2e separate:
```ts
// playwright.config.ts (sketch)
{ name: 'visual-dark',  testMatch: /visual\/.*\.spec\.ts/, retries: 0,
  use: { ...devices['Desktop Chrome'], colorScheme: 'dark',  reducedMotion: 'reduce', serviceWorkers: 'block' } },
{ name: 'visual-light', testMatch: /visual\/.*\.spec\.ts/, retries: 0,
  use: { ...devices['Desktop Chrome'], colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block' } },
// in specs:
await page.evaluate(() => document.fonts.ready);
await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled',
  mask: [page.locator('canvas')], maxDiffPixelRatio: 0.002 });
```
- Generate and update baselines **only on Linux against a production build**. Use the `mcr.microsoft.com/playwright:v1.60.0-*` Docker image locally, or a `workflow_dispatch` CI job that runs `--update-snapshots` and uploads the PNGs as an artifact.
- Add `serviceWorkers: 'block'` to the shared `use` block, except for one dedicated SW test.
- Before Phase 7 the dark and light baselines differ (that is the bug). After the `dark:` work (Pitfall 3) they **must be identical**, which proves the dark-only rule.
- Capture scroll-state shots too (home at 0 / 50 / 100 % of the hero scroll, nav after scrolling). Static top-of-page shots don't catch scroll-linked regressions.
- Viewports: 375, 768 and 1440 wide (ui-ux-pro-max `breakpoint-consistency`).

**Warning signs:** Committed `*-win32.png` files; baselines that show white pages; diffs on every run at canvas pixels; "passes on retry".

**Detection:** A CI check that fails if any `*-win32.png` or `*-darwin.png` file is committed under `e2e/`. `retries: 0` on the visual projects. Never raise `maxDiffPixelRatio` to make a diff pass.

**Phase to address:** 7 (before any other change). Every later phase re-baselines **intentionally**, in its own commit.

---

### Pitfall 3: Removing `dark:` variants keeps the wrong half

**What goes wrong:**
Tailwind v4's default `dark:` variant is `@media (prefers-color-scheme: dark)` `[DOCS]`. In these 23 files the **unprefixed** class is the light value and the `dark:` class is the intended look. Examples `[REPO]`:
- `components/FeedbackForm.tsx:106` `text-gray-900 dark:text-white` (labels)
- `components/ImageDetailModal.tsx:52` `bg-white dark:bg-gray-900`
- `components/GalleryGrid.tsx:90` `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 ...`

A regex that strips `dark:\S+` leaves gray-900 labels on dark surfaces (invisible) and white modals. That is the opposite of the goal, and it is the same failure as the Contact h1 (`app/contact/page.tsx:26`).

**How to avoid (staged, regression-safe):**
1. **Neutralise first, with no markup change.** Make every `dark:` variant unconditional and declare the colour scheme:
   ```css
   /* globals.css */
   @custom-variant dark (&:where(.dark, .dark *));
   :root { color-scheme: dark; }
   ```
   ```tsx
   <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
   ```
   Light-OS visitors immediately get the dark rendering. The `visual-light` baselines now match `visual-dark`.
2. **Collapse per file:** `A dark:B` becomes `token(B)`. The rule is "keep the `dark:` value, map it to a v2 token, drop the base". Both visual projects must show zero diff for that file's pages.
3. Remove the `@custom-variant` and the `dark` class, then turn on the lint guard (Pitfall 4).

**Warning signs:** Any visual diff during step 2 (a collapse should be pixel-neutral). White flashes. Labels disappearing on the Contact form.

**Detection:** Identical `visual-dark` and `visual-light` snapshots. `rg -c "dark:" app components` equals 0. axe `color-contrast` passes under both `colorScheme` values.

**Phase to address:** 7

---

### Pitfall 4: The palette lint guard is either too naive or silently destructive

**What goes wrong** `[REPO]`:
- **Name collision.** `globals.css` defines custom `--color-amber-400/500/600`, which **override** Tailwind's stock amber in the same namespace. Stock `--color-amber-500` is in `node_modules/tailwindcss/theme.css:39`. A guard that bans `amber-*` flags legitimate tokens. One that allows `amber-*` lets stock `amber-700` through.
- **Unscanned places.** Stock classes also live in `cn()`/template literals (`GalleryGrid.tsx:104`, `FeedbackForm.tsx:203`), in data maps, and in **tests** (`RoadmapFilters.test.tsx:94,108` assert `toHaveClass('bg-cyan-600')` / `bg-blue-600`).
- **White/black.** There are 282 `bg|text|border-(white|black)` usages. `white` and `black` are theme variables (`--color-white`, `--color-black`). Using `--color-*: initial` to make stock classes "impossible" also deletes white/black, and every leftover stock class then compiles to **nothing**: transparent, unstyled, and no build error.
- **Inline colours.** There are 74 hard-coded hex colours in TSX (Three materials and shaders: `AnimatedGradientMesh`, `HologramTerminal`, `MountainTerrain3D`, ...) that a className guard can't see.

**How to avoid:**
- Name v2 tokens **outside** Tailwind's family names (e.g. `signal`/`caution` instead of `amber`, `glacier` instead of `cyan`). Alias v1 names to them, so the guard can ban every stock family name unambiguously.
- Write the guard as a script (`scripts/check-tokens.mjs`, run by `npm run lint:tokens` in the CI lint job). It should scan `app/ components/ lib/ data/ **/__tests__/ *.css`. Use a variant-aware regex:
  ```js
  /(?<![\w-])(?:[\w-]+:)*(?:bg|text|border|ring|outline|from|via|to|fill|stroke|divide|placeholder|decoration|shadow|accent|caret)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d+)?\b/
  /(?<![\w-])dark:/
  ```
- Treat white/black with a **ratchet**: a committed JSON of per-file counts that may only go down. This avoids a 282-edit big-bang inside Phase 7.
- Only add `--color-*: initial` after the guard reports zero, and re-declare `--color-white`/`--color-black` or their token replacements. Screenshots catch any silent unstyling.
- **Yellow trail colour as fill only:** keep it out of the `--color-*` namespace (e.g. `--trail-t1: oklch(...)` in `:root`, used only by a `.grade-t1` component class). Then `text-trail-yellow` can't exist (enforced by construction).
- WebGL colours come from one TS token module that is also the source of the CSS tokens (see Pitfall 15). Never hand-copy hex.

**Warning signs:** Guard allow-lists that keep growing; elements turning transparent after a theme change; tests rewritten to assert new colour classes.

**Detection:** The `lint:tokens` script in CI. Rewrite `RoadmapFilters` assertions to **state** (`aria-pressed="true"`), not colour classes.

**Phase to address:** 7 (guard and ratchet). 12 (ratchet reaches 0 and v1 aliases are removed).

---

### Pitfall 5: Tests that assert current markup and copy get deleted instead of rewritten

**What goes wrong:**
The rework changes the exact strings and roles these tests depend on `[REPO]`:

| Test | Contract it asserts | Breaks in phase |
|---|---|---|
| `e2e/homepage` | `toHaveTitle(/Portfolio/i)`; `#main-content`; links named `Home`/`Photos`/`Projects`; text "Landscape Photos", "Active Projects", "Roadmap Complete" | 7 (identity/title, SiteNav), 9 (home rebuilt) |
| `e2e/photos` | heading "Landscape Gallery"; buttons "View details for …"; `role=dialog`; label "Close modal"; Escape closes; button "3D Carousel"; `locator('canvas')` | 10 |
| `e2e/projects` | heading "Programming Projects"; links "View details for …"; `role=article`; GitHub link `href /github\.com/` | 11 (hex cards retired) |
| `e2e/contact-form` | heading "Get in Touch"; labels Name/Email/Message; "Send Message"; "Name is required", "Invalid email address", "at least 10 characters", "thank you"; checkbox | 12 |
| `GalleryGrid.test` | "1 hotspots", "Click to explore interactive annotations", `getByTestId('image-detail-modal')` | 10 |
| `ProjectCard.test` | "View Project", `aria-label "View details for …"` | 11 (component deleted) |
| `RoadmapFilters.test` | `toHaveClass('bg-cyan-600'/'bg-blue-600')` | 7 (palette removal) |
| `RoadmapTimeline.test` | priority/status copy, version strings | 11 (route-log) |

Two silent cases:
- `getByRole('link', { name: /Photos/i }).first()` keeps passing even when the page renders **two navs** (old `Header` plus the new `SiteNav`). It hides the duplication.
- `expect(page.locator('canvas')).toBeAttached()` throws a strict-mode error once a page has more than one canvas.

**How to avoid:**
- Keep a **test contract table** (like the one above) in each phase plan. Rewriting a component and its tests happens in the **same commit**. A deleted component's test is replaced by the successor's test (ProjectCard → RoutePanel) before the component is deleted.
- Prefer accessible names that survive restyling, and keep v1 names where they still fit ("View details for …", "Close modal", "Send Message").
- Add a test-count ratchet: `scripts/count-tests.mjs` counts `test(`/`it(` and must be ≥ the committed baseline.

**Warning signs:** PRs with `-` lines in `e2e/` and no matching `+` lines; `.skip`/`.fixme` appearing; `forbidOnly` warnings.

**Detection:** The test-count ratchet in the CI lint job. Grep the diff for `.skip(` / `.fixme(`.

**Phase to address:** 7 (ratchet + contract table). Every phase owns its rows.

---

### Pitfall 6: The Motion 12 → 14 upgrade breaks scroll-linked behaviour that no test covers

**What goes wrong:**
24 files import `framer-motion` and only 5 components have unit tests `[REPO]`. Changes between 12.x and 14.1 per the official CHANGELOG `[DOCS]`:
- **13.0.** The optional `@emotion/is-prop-valid` dependency is removed. Low risk here: it is not installed, only listed as an optional peer in the lockfile.
- **13.2.** `MotionValueState` no longer caches `latest`, and `set()` drops its second argument.
- **13.4.4–13.5.0.** `useScroll`/`scroll` offset tracking changed: ScrollTimeline removed for JS callbacks, more offsets moved to ViewTimeline, and then "use main thread for all `offset` animations". This repo uses `useScroll({ target, offset: ['start start','end start'] })` in `Hero3DMountain`, `Hero3DSection` and `MountainTerrain3D`, plus `scrollY` in `GlassmorphismNav` and `lib/useGlowIntensity`. Exactly the area that changed.
- **14.0.** Removes internal APIs that had been restored for 13.0–13.4 compatibility.
- **14.1.0** is one day old (published 2026-10-09); 14.0.0 was published 2026-10-02.
- `AnimateView` (13.4) targets React **19.3** `<ViewTransition>`. This repo has React 19.2.6.

A second risk: adding the `motion` package (`motion/react`) next to `framer-motion` installs two `motion-dom` copies. `layoutId` groups (`activeNavIndicator`, `activeTab`, `feature-hover`) and `MotionConfig` context then stop being shared.

**How to avoid (order inside Phase 7):**
1. Run `npm ci` and capture baselines (Pitfalls 1 and 2).
2. Delete the **zero-consumer** motion files first; this is pixel-neutral. `TerminalDemo`, `Hero3DSection` and `ZoomableImage` have no importers `[REPO]`. That shrinks the upgrade surface from 24 to 21 files.
3. Bump `framer-motion` to an exact `14.1.0` in **one commit** with no API renames and no new features.
4. Acceptance: **zero** visual diffs, including the scroll-state shots. Unit tests stay green. Manually check reduced motion and the hero scroll in Chromium and Firefox.
5. Only later, and separately if wanted, switch imports to `motion/react`. Never ship both packages.

**Warning signs:** Hero parallax or terrain progress jumping at section edges; nav glass opacity no longer tracking scroll; console warnings about unknown DOM props.

**Detection:** `npm ls motion-dom` shows one version. Scroll-state screenshots. A Jest smoke test that renders each remaining motion component (cheap and catches import/API breaks).

**Phase to address:** 7

---

### Pitfall 7: The `(site)` route-group move leaves duplicate shells, path collisions or nav-less edge pages

**What goes wrong:**
- `app/page.tsx` and `app/(site)/page.tsx` both resolve to `/`, which is a build error. Half-moved trees break `next build`.
- Pages still import `Header`/`Footer` themselves (`app/photos/page.tsx:2-3`, `app/page.tsx:4`), so they render **two** navs inside the new layout, and the e2e `.first()` hides it (Pitfall 5).
- `id="main-content"` lives in `app/page.tsx:29`. A layout-level `<main id="main-content">` creates duplicate ids.
- `app/not-found.tsx`, `app/error.tsx` and `app/offline` sit **outside** `(site)` unless moved, so they render without `SiteNav`, the footer and the swisstopo attribution.
- A fixed/sticky `SiteNav` covers keyboard-focused elements after in-page jumps.

**How to avoid:**
- Do the move with `git mv` of all routes into `app/(site)/` in one commit. Remove the per-page Header/Footer in the same commit.
- The layout owns the skip link and `<main id="main-content" tabIndex={-1}>`.
- Add `html { scroll-padding-top: var(--sitenav-h) }` (ui-ux-pro-max **Focus Not Obscured (Minimum)**, WCAG 2.2 AA: "Offset sticky UI with scroll-padding"; also `fixed-element-offset`).
- Give `SiteNav` `aria-label="Primary"` and a visible active state (`nav-state-active`, `navigation-consistency`).
- Use a metadata title template, and update `homepage.spec` `toHaveTitle` in the same commit.

**Warning signs:** Two `<nav>`s in the DOM; 404 pages with no way back; focused links hidden under the nav.

**Detection:** An e2e loop over every route (`/`, `/photos`, `/projects`, `/projects/[slug]`, `/roadmap`, `/contact`, `/offline`, a 404 URL) asserting:
- `getByRole('navigation', { name: 'Primary' })` `toHaveCount(1)`
- `locator('#main-content')` `toHaveCount(1)`
- the footer contains `© swisstopo`

**Phase to address:** 7 (layout). 12 (edge pages re-verified).

---

### Pitfall 8: Deleting "unused" old image variants breaks live pages

**What goes wrong:**
PROJECT.md lists "Old image variants (-thumb/-medium/-large) … unused". That is **false** `[REPO]`. `data/landscapes.ts` has 12 references to `-large.webp`, `-large.jpg` and `-thumb.webp`. They feed:
- the home hero `<Image src={landscapes[0].src}>` (`app/page.tsx:84`, the LCP image)
- `PhotoCarousel3D` progressive textures (`useProgressiveTextures`)
- `GalleryGrid`

The pipeline actually emits `-sm/-md/-lg` (`scripts/optimize-images.mjs:40-43`). Deleting the legacy files 404s every photo, and `next/image` doesn't fail the build for missing local files.

**How to avoid:**
1. In Phase 8, have the pipeline produce a typed manifest (`id → {sm, md, lg, width, height, blurDataURL}`).
2. In Phase 10, migrate `landscapes.ts` consumers to the manifest.
3. Only in Phase 12, delete the `-thumb/-medium/-large` files and the `.jpg` duplicates.

**Warning signs:** Broken image icons; the carousel stuck on its loading state; LCP regressions.

**Detection:**
- A Jest test: every asset path referenced from `data/**` exists under `public/` (`fs.existsSync`).
- A Playwright listener `page.on('response', r => r.request().resourceType()==='image' && r.status()>=400 && fail())` on every route.

**Phase to address:** 8 (manifest), 10 (migration), 12 (deletion)

---

### Pitfall 9: Build-time data that CI can't see, or that isn't reproducible

**What goes wrong:**
CI's `lint-and-typecheck` and `unit-tests` jobs run `npm ci` followed by `tsc`/`jest`, **without a build** `[REPO]`. If `data/photos.generated.ts` or the terrain JSON is produced in `prebuild` and gitignored, typecheck and Jest fail in CI. "Fixing" that by adding the generator to `prebuild` makes the Vercel build fetch swisstopo tiles over the network, which is slow and flaky.

Other traps:
- `d3-contour@4` is **ESM-only** (`"type": "module"`) `[DOCS: npm registry]`. Importing it from a component makes Jest (`next/jest` CJS transform) fail with "Cannot use import statement outside a module".
- `sharp`/libvips output differs between Windows and Linux, so binary diffs never settle.
- Floating-point path strings differ across platforms.

**How to avoid:**
- Keep generators in `scripts/*.mjs` only (d3-contour, geotiff, exif-reader never imported by `app/` or `components/`).
- **Commit** the generated typed data (TS/JSON) and SVG.
- Raw DEM GeoTIFFs live in a gitignored `.cache/dem/`, fetched by `npm run terrain:fetch` with a SHA-256 manifest. `npm run terrain:build` is explicit and is **not** part of `prebuild`.
- Round all coordinates (e.g. 2 decimals in SVG, 1 m in elevations) so outputs are deterministic.
- CI step: `npm run data:check` regenerates the text artifacts from committed inputs, then `git diff --exit-code` on `data/generated/**` (not the binary images).

**Warning signs:** "Module not found: data/…generated" in CI only; Vercel build time jumping; generated-file churn in every commit.

**Detection:** The `data:check` CI step. Jest import of the generated module.

**Phase to address:** 8

---

### Pitfall 10: Geodesy and DEM errors put the Matterhorn, or the photos, in the wrong place

**What goes wrong:**
- **Coverage gap.** swissALTI3D covers **Switzerland and Liechtenstein only**. swissALTIRegio (10 m) extends at least 100 km beyond the border `[DOCS: swisstopo]`. The Matterhorn summit sits on the Swiss–Italian border, so the south (Italian) face is missing from swissALTI3D: a void or cliff in the hero mesh exactly where the eye looks.
- **CRS mix.** DEM tiles are LV95 (EPSG:2056) and EXIF GPS is WGS84 degrees. Linear lat/lon → grid mapping drifts by tens of metres.
- **Altitude reference.** EXIF `GPSAltitude` may be ellipsoidal or MSL depending on the device, and consumer GPS error is roughly 10–30 m. Placing waypoints by EXIF altitude makes photos float or sink into the terrain `[LOW: device-specific]`.
- **Heightmap precision.** An 8-bit PNG across 1,626–4,478 m gives about 11 m per step (terraces, stair-stepped contours). Browsers also decode `<img>`/`TextureLoader` PNGs to 8 bits per channel and apply colour management (gAMA/iCCP). A `SRGBColorSpace` mistake gamma-warps heights.
- **d3-contour conventions.** It returns MultiPolygons in **grid pixel space, y-down** `[DOCS]`. Without a consistent transform the SVG map is mirrored or south-up. NoData (`-9999`) cells produce concentric contour artifacts at tile edges.
- **Size.** Contouring a full 2 m grid yields multi-MB paths.

**How to avoid:**
- Blend swissALTI3D (CH side) with swissALTIRegio (border area). Crop the AOI to include the Italian face.
- Use one `lib/geo.ts` (WGS84 ↔ LV95 via swisstopo's published approximation formulas or proj4) shared by the build scripts and runtime. Mesh, contour SVG and photo pins must all go through it.
- Waypoint height = DEM sample at the photo's lat/lon plus a small offset; EXIF altitude is only for display.
- Ship elevation as **raw Uint16 binary** (metres × 1 or decimetres) fetched with `fetch` into a `THREE.DataTexture` (`NoColorSpace`, no mipmaps). Or Terrain-RGB encoding if it must be an image.
- Downsample to about 10–25 m before contouring; mask NoData; simplify paths.
- Altimeter labels use official values (1,626 m, 4,478 m), not `max(DEM)`, which will read about 4,47x.

**Warning signs:** A flat or missing south face; pins offset from the valley floor; contour map mirrored compared with a swisstopo map; visible terraces.

**Detection:** Unit tests for `lib/geo.ts` with known points: Matterhorn summit lat/lon → LV95 within 5 m, DEM sample within ±10 m of 4,478. A Zermatt reference point. The generated SVG's bounding box orientation (north up) matches a reference.

**Phase to address:** 8 (pipeline), 9 (mesh/shader consumption)

---

### Pitfall 11: EXIF data traps (time zones, missing fields, mislabels, orientation)

**What goes wrong:**
- **Time zones.** EXIF `DateTimeOriginal` is local wall-clock time without a zone. `exif-reader` returns a `Date` interpreted as UTC. Formatting it with `toLocaleDateString()` gives off-by-one days for evening shots, **and** a hydration mismatch, because the server renders in UTC on Vercel while the client renders in the visitor's time zone.
- **Missing fields.** GPS exists on only 3 of 4 originals (per the UI audit). `R004-011-…` looks like a film-scan naming scheme and may lack camera EXIF `[LOW]`. Strict schemas fail the build. Lax ones place a photo at 0°N 0°E ("Null Island") on the map.
- **Mislabelled location.** The "Teufelsschlucht" waterfall's GPS (46.0081 N 7.7385 E, 1,715 m) is south of Zermatt. That is plausibly the **Gornerschlucht**, so the label rather than the GPS may be wrong `[LOW: confirm with Tim]`. An automated "EXIF wins" merge would either silently keep the wrong label or overwrite a human fix.
- **Orientation.** `optimize-images.mjs` never calls `.rotate()` `[REPO]`, and sharp strips metadata including Orientation by default `[DOCS]`. Any future portrait photo comes out sideways.
- **Stale tags.** Data like `tags: ['summer','landscape','2024']` contradicts the EXIF dates.

**How to avoid:**
- Store `captureDate` as an ISO **local** string plus `timeZone: 'Europe/Zurich'`. Format at build time or with an explicit `timeZone`. Never use bare `toLocale*` in client components.
- Use a Zod schema with optional `gps`/`camera` fields. `data/photo-corrections.json` overrides EXIF with `{field, value, reason, source}`. The build fails only on conflicts without a correction entry.
- Add `.rotate()` before resizing.
- Get human confirmation of the waterfall label in the Phase 8 plan.

**Warning signs:** Dates shifting by one day between server HTML and the hydrated client; React hydration warnings on the photo pages; pins at the map origin.

**Detection:**
- A unit test on the generated data: every `captureDate` is within 2021-09-06/07 for the Matterhorn set (per the audit), `gps` is either absent or inside the AOI bounding box, and the corrections are applied.
- Snapshot the generated JSON.

**Phase to address:** 8

---

### Pitfall 12: Original photos with GPS are publicly downloadable, and could be re-leaked

**What goes wrong:**
`public/images/landscapes/` holds **194 MB** of 12480×8320 originals with intact EXIF, including a GPS IFD `[REPO, checked with sharp metadata]`. They are deployed and served at `/images/landscapes/*.jpg` with `immutable` caching, and the SW caches them cache-first. The `-sm/-md/-lg` outputs are clean because sharp strips metadata by default. But the common "fix the colour shift" change, `.withMetadata()`, re-embeds EXIF and GPS.

**How to avoid:**
- Move originals out of `public/` (e.g. `assets/photos/originals/`). The pipeline reads from there.
- Use `keepIccProfile()`/`withIccProfile('srgb')` rather than `withMetadata()`.
- Decide the GPS policy for *shipped JSON* explicitly. Landscapes at public viewpoints are probably fine; rounding to 4 decimals (about 10 m) is a cheap option.

**Detection:**
- A CI script scans `public/**/*.{jpg,webp,avif}` with `sharp(...).metadata()` and fails if `exif` contains a GPS IFD (tag `0x8825`).
- `curl -I https://<preview>/images/landscapes/...` returns 404.

**Phase to address:** 8

---

### Pitfall 13: The CSP silently blocks pieces of the new 3D stack

**What goes wrong:**
`proxy.ts` has no `worker-src`, so workers fall back to `script-src 'self' 'nonce-…' 'strict-dynamic' 'unsafe-eval'`, which has no `blob:` `[REPO]`. Common R3F/drei additions spawn **blob: workers**: drei `<Text>` (troika), DRACO/KTX2/Meshopt decoders. They are blocked, and the result is blank labels or a geometry load that never resolves, and only in production, because dev may differ.

`connect-src` allows `https://raw.githubusercontent.com`, a leftover for drei remote assets. That contradicts the "same-origin assets" constraint. No CSP reporting is configured, so violations in the field are invisible.

Also, the proxy matcher only excludes `api|_next/static|_next/image|favicon.ico|service-worker.js`. Every `/images/*`, terrain binary and contour SVG request runs the proxy (an edge invocation per asset).

**How to avoid:**
- Pre-process everything at build time so no decoder workers are needed.
- Render altimeter, labels and waypoint names as **HTML overlays**, not drei `<Text>`. That is also better for accessibility.
- If a worker is truly needed, add `worker-src 'self' blob:` deliberately and document it.
- In Phase 12, remove `raw.githubusercontent.com` once v1 scenes are gone.
- Extend the matcher to skip file extensions (`.*\\..*`).
- Optionally add `report-to` in Report-Only for new directives during Phase 9.

**Detection:**
- An e2e fixture that fails on any console message containing `Content Security Policy` or `Refused to`.
- `page.on('request')` asserts every request URL is same-origin (Vercel Analytics/Speed Insights endpoints excepted).

**Phase to address:** 9 (hero). 12 (cleanup of the connect-src leftover).

---

### Pitfall 14: Reduced-motion and fallback parity gaps in the new motion surfaces

**What goes wrong:**
The v1 safety net is one rule: `*, *::before, *::after { animation-duration: 0.01ms !important }` (`globals.css` reduced-motion block) `[REPO]`. It doesn't reach:
- `::view-transition-*` pseudo-elements: `*` doesn't match them, so the thumbnail → lightbox morph still animates under reduced motion.
- Motion's WAAPI/JS animations (the CSS comment admits this).
- The R3F frame loop and the scroll-linked camera ("ascent").
- CSS scroll-driven animations, where a 0.01 ms duration on a scroll timeline behaves in ways that are hard to predict `[LOW: verify per browser]`.

`useReducedMotion`'s server snapshot is `false`, so SSR always renders the motion path. If the hero picks canvas vs static fallback from that hook, reduced-motion users get a flash of the canvas placeholder. If waypoints, altitudes or route links exist only inside the WebGL scene, reduced-motion, no-WebGL and screen-reader users lose content.

**How to avoid:**
- Add explicit CSS:
  ```css
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
  }
  ```
- Add `<MotionConfig reducedMotion="user">` in the `(site)` layout as a safety net alongside the existing hook.
- The hero SSR-renders a **static poster** (build-time terrain render or contour SVG) plus a DOM list of waypoints (heading, photo link, altitude) **always**. The canvas mounts on top only when WebGL is available and motion is allowed. Use the R3F `fallback` prop and `webglcontextlost` → fallback.
- Scroll-driven CSS goes inside `@supports (animation-timeline: scroll())` and `@media (prefers-reduced-motion: no-preference)`. `animation-timeline` is **not Baseline** per MDN `[DOCS]`, and Firefox runs in CI.

ui-ux-pro-max: **Motion Sensitivity** ("Parallax/Scroll-jacking causes nausea … present the final readable state without parallax or scroll-jacking", severity High), `reduced-motion`, `parallax-subtle`, `no-blocking-animation`. Never hijack wheel or touch. The ascent is native scroll over a tall section with a sticky canvas.

**Detection:**
- A Playwright `reducedMotion: 'reduce'` project on `/`: no `canvas` attached, waypoint list visible, all waypoint links reachable by Tab.
- On `/photos`, after opening the lightbox: `await page.evaluate(() => document.getAnimations().length)` returns `0`.
- A `javaScriptEnabled` / WebGL-disabled run (`--disable-webgl` Chromium arg) shows the static poster.

**Phase to address:** 9 (hero), 10 (view transitions), 7 (MotionConfig safety net)

---

### Pitfall 15: The WebGL terrain hero is fine on desktop and broken on phones

**What goes wrong:**
- `frameloop="always"` (as in `PhotoCarousel3D`) keeps the GPU busy while the hero is off-screen.
- `dpr={[1,2]}` on 3× phones, plus a 1024² vertex mesh, means thermal throttling.
- Contours computed as `fract(height / interval)` on **metres** at `mediump` precision band and shimmer on some mobile GPUs `[DOCS: GLSL precision]`.
- No code handles `webglcontextlost` (grep finds none) `[REPO]`. iOS Safari drops contexts on backgrounding or memory pressure, which leaves a black hero.
- A sticky `100vh`/`dvh` canvas resizes on every mobile URL-bar show/hide, so R3F re-allocates buffers mid-scroll.
- Navigating Home → Photos → Home without `dispose()` leaks VRAM.
- Contour line colour uniforms come from CSS tokens. `THREE.Color` can't parse `oklch()`, and a `ShaderMaterial` that omits `#include <colorspace_fragment>` renders linear colours, so lines look darker or duller than the CSS tokens.

**How to avoid:**
- `frameloop="demand"` and `invalidate()` on scroll-progress change. Pause via IntersectionObserver.
- `dpr={[1, 1.5]}`, plus drei `<PerformanceMonitor>` to step down. Mesh ≤ 512² vertices.
- Normalise elevation to 0–1 before `fract`, and declare `precision highp float`. Use `fwidth`-based anti-aliased lines.
- Handle `onCreated(({gl}) => gl.domElement.addEventListener('webglcontextlost', …))` by showing the static poster.
- Use `svh`/`lvh` (not `dvh`) for the sticky stage, plus a debounced R3F `resize`.
- Generate token colours to a TS module (`lib/tokens.ts`) from one source, pass them as linear `THREE.Color`, and include `colorspace_fragment`.

ui-ux-pro-max (threejs stack): **dispose on Scene Removal** (Critical), **Dispose Textures Explicitly** (High), **antialias Set at Construction Only** (High; decide AA up front, don't toggle). UX: `main-thread-budget` (~16 ms/frame).

**Detection:**
- Manual check on a real mid-range Android and an iPhone (stated phase exit criterion).
- Chrome DevTools performance trace with 4× CPU throttle: no long tasks > 50 ms during scroll.
- `renderer.info.memory` before and after 5 Home↔Photos round trips stays flat (dev-only assertion).
- An e2e that dispatches `webglcontextlost` and expects the poster.

**Phase to address:** 9

---

### Pitfall 16: View Transitions plus a deep-linkable lightbox: duplicate names, React version split, stuck modals

**What goes wrong:**
- **Duplicate names abort the transition.** Each `view-transition-name` must be unique in the document. Map, Grid and Carousel views mounted at once (hidden with CSS), or thumbnail and lightbox both named while both are rendered, abort the transition. Names derived from filenames (`IMG_0605-Enhanced (2022_02_01 09_47_03 UTC)`) are invalid CSS identifiers. Use the `id` (`img-0605`).
- **React version split.** React `<ViewTransition>` is stable in **React 19.3** (released 2026-09-09) `[DOCS]`. This repo pins `react@19.2.6`. The App Router runs its **vendored canary** React, so `import { ViewTransition } from 'react'` works at runtime but is `undefined` in Jest (which uses `node_modules/react` 19.2) and is missing from `@types/react` 19.2.
- **Experimental flag.** Next's `experimental.viewTransition` is "experimental … not recommended for production" `[DOCS: nextjs.org]`.
- **When it animates.** React only animates updates inside `startTransition`, Suspense reveals or `useDeferredValue`. A plain `setState` open does nothing.
- **Intercepting routes** (`@modal/(.)[id]`):
  - a missing `default.tsx` means a 404 on hard refresh
  - the modal stays open after a `SiteNav` navigation unless the slot resets
  - Escape and close must be `router.back()`
- **Focus.** `ImageDetailModal` today has `role="dialog"` + `aria-modal` + Escape, but **no focus trap and no focus return** `[REPO]`.
- **Double animation.** Motion `layoutId` animations (nav indicator) running during a view transition animate twice.

**How to avoid:**
- Upgrade `react`, `react-dom` and `@types/react*` to 19.3 as its own small step, with the full test suite and zero visual diffs, before Phase 10.
- Use one `useViewTransitionName(id, active)` helper that assigns the name only to the element currently morphing.
- Use native `<dialog>.showModal()` (inert background and Escape for free). Return focus to the originating thumbnail on close.
- Prefer `?photo=<id>` search-param state, or intercepting routes **with** `default.tsx` plus a catch-all slot reset.
- Keep the e2e contract: `role=dialog`, "Close modal", Escape closes. Feature-detect `document.startViewTransition`: Firefox runs in CI and behaviour must be identical without animation.

ui-ux-pro-max: `shared-element-transition`, `modal-motion` (animate from trigger), `escape-routes`/`modal-escape`, `focus-states` ("Keyboard focus, including controls inside a modal, needs a visible indicator"), `deep-linking`, `back-behavior`, `state-preservation` (back restores grid scroll position).

**Detection:**
- e2e: open the lightbox via URL `/photos?photo=img-0605` (or `/photos/img-0605`) directly and the dialog is visible; reload keeps it open; Escape returns focus to the thumbnail (`expect(thumbnail).toBeFocused()`); browser back closes it; navigating to `/projects` leaves no dialog.
- A console listener for "duplicate view-transition-name" / "Unexpected duplicate".

**Phase to address:** 10 (React 19.3 bump can be in 7 or the start of 10)

---

### Pitfall 17: The service worker and immutable caching serve stale v1 UI or stale generated assets

**What goes wrong** `[REPO]`:
- **Stale HTML.** HTML uses **stale-while-revalidate**, so the first visit after the v2 deploy renders the cached v1 HTML (old nav, deleted playground routes).
- **Missing chunks.** With `skipWaiting()` + `clients.claim()` the new SW deletes old caches while an old page is open. That page's lazy chunks (R3F hero, carousel) then 404 as a `ChunkLoadError`.
- **Immutable assets.** `next.config.ts` sets `/images/:path*` to `max-age=31536000, immutable`. Regenerated assets with **stable filenames** (corrected photo variants, a re-cut contour SVG, a terrain binary under `/images/`) stay stale in browsers for a year, even after the SW cache is cleared.
- **Unstyled offline page.** The precached `/offline` HTML's CSS is not precached, so "off the marked trail" renders unstyled when actually offline.

**How to avoid:**
- Content-hash generated asset filenames (`matterhorn.<hash>.bin`, `contours.<hash>.svg`) via the manifest.
- Switch navigations to network-first with offline fallback.
- Precache the offline page's CSS, or make it self-contained.
- Consider Vercel Skew Protection / `deploymentId` for the cut-over deploy.
- Keep Playwright on `serviceWorkers: 'block'` except for a dedicated SW test.

**Detection:** A dedicated SW e2e: install, deploy-simulate by changing `BUILD_HASH`, reload, and expect the new HTML. Offline mode (`context.setOffline(true)`) on `/offline` gets a screenshot.

**Phase to address:** 8 (hashed asset names), 12 (SW strategy and offline page)

---

## Moderate Pitfalls

### Pitfall 18: The visible scrollbar reintroduces layout shift and light-theme chrome
Removing the global `*{scrollbar-width:none}` / `::-webkit-scrollbar{display:none}` (`globals.css:109–118`) exposes scrollbars in every inner scroller (`TerminalDemo`, `HologramTerminalDemo`, the modal `overflow-y-auto`). More importantly:
- `document.body.style.overflow='hidden'` in `ImageDetailModal.tsx:32` and `GlassmorphismNav.tsx:73` now shifts the page about 15 px on Windows when the lightbox opens (it was invisible before).
- Without `color-scheme: dark`, Windows Chrome draws **light** scrollbars on the dark site.

**Prevention:** `:root { color-scheme: dark; scrollbar-gutter: stable; scrollbar-color: <thumb token> <track token>; }`. Hide inner scrollbars only where a custom affordance exists. Use the `<dialog>` modal (Pitfall 16) instead of manual body locking. ui-ux-pro-max: **Content Jumping** ("Reserve appropriate space…", severity High), `layout-shift-avoid`.
**Detection:** A screenshot of `/photos` with the lightbox open versus closed: the page beneath doesn't shift (compare header bounding boxes).
**Phase:** 7

### Pitfall 19: `verify-contrast.mjs` drifts from tokens v2 and misses real pairs
The script holds a **hard-coded hex table** ("converted via colorjs.io", but `colorjs.io` is not a dependency) and a hand-written combination list `[REPO]`. Tokens v2 edits in `globals.css` won't change it, so it keeps passing. It also never checked the actual usage that broke (Contact h1 `text-gray-900` over `AnimatedGradientMesh`). axe can't compute contrast over canvas, gradients or images and reports those as **incomplete**, not violations.

**Prevention:** Parse `@theme` from `globals.css`, convert OKLCH → sRGB in-script (add `colorjs.io` as a devDependency), and fail on unknown token names. Express pairs as semantic roles (`on-surface/surface`, `on-trail-t1/trail-t1`, `focus-ring/surface` at 3:1). Add `@axe-core/playwright` per route and **fail on unreviewed `incomplete` color-contrast items**. Text over imagery or terrain needs a solid or scrim token surface.

ui-ux-pro-max: `color-accessible-pairs`, `contrast-readability`, "Scrim and modal legibility: measure the composed result".
**Phase:** 7 (script rewrite + Contact fix), every phase (axe)

### Pitfall 20: Token v2 aliases become permanent, or break opacity modifiers
- **Aliasing.** v1 names aliased via `var()` inside `@theme` should use `@theme inline` so utilities resolve to the final value `[DOCS]`. Check `/opacity` modifiers (`bg-frost-500/10`, used widely) render identically after aliasing.
- **Removal.** Aliases left "temporarily" outlive the milestone.

**Prevention:** Use zero-diff screenshots as the alias acceptance test. Add an `@deprecated` comment block, and a Phase 12 task that removes the aliases with the guard extended to ban v1 names.
**Phase:** 7 (introduce), 12 (remove)

### Pitfall 21: The altimeter rail and live readouts become screen-reader noise or jitter
A metre readout updating on every scroll frame inside `aria-live` floods screen readers. Proportional digits make the rail jitter.

**Prevention:**
- Mark the rail `aria-hidden="true"` as a decorative mirror of real content.
- Each waypoint section has a real heading with its altitude in text.
- Use `font-variant-numeric: tabular-nums`.
- Update via a Motion value → `textContent` (no React re-render per frame).

ui-ux-pro-max: `number-tabular`, `contextual-live-badge-updates` (one atomic polite region only when meaningful), `heading-hierarchy`.
**Phase:** 9

### Pitfall 22: Trail-grade risk markers rely on colour, or yellow ends up used as text
T2–T3 white-red-white versus T4–T5 white-blue-white is a colour-only distinction for some users, and "unmarked" is defined by absence.

**Prevention:**
- Always render the grade label ("T3") and an accessible name ("Risk grade T3: demanding mountain route").
- Stripe geometry differs per grade family.
- Meet 3:1 non-text contrast of stripes against the surface.
- Show "unmarked" as explicit text plus a dashed outline.
- Include a legend.
- Yellow (T1) only as a fill behind dark text that meets ≥ 4.5:1, enforced by the namespace trick in Pitfall 4.

ui-ux-pro-max: **Color Only** ("Use icons/text in addition to color", High), `color-not-decorative-only`, `pattern-texture`, `legend-visible`, `contrast-data`.
**Phase:** 11

### Pitfall 23: Map view and hotspots are mouse-only
SVG pins as `<circle onClick>` are not focusable. Drag-to-pan has no alternative. `InteractiveHotspot` callouts open on hover.

**Prevention:**
- Pins are `<button>`s (or `<a href="?photo=id">`) with names ("Matterhorn from Riffelsee, 2,770 m"), at least 24×24 px.
- No drag-only interaction (static framed map, or buttons for pan/zoom).
- Grid view is the list equivalent, with parity tested.
- Callouts open on click/Enter with Escape to close.

ui-ux-pro-max: **Dragging Movements** (WCAG 2.2 AA: "Add buttons menus or tap-to-move controls"), `web-target-size`, `hover-vs-tap`, `tooltip-keyboard`, `keyboard-nav`, `data-table`/`screen-reader-summary`.
**Phase:** 10

### Pitfall 24: Justified grid and fonts cause layout shift
- **Grid.** A justified grid computed in `useEffect` after measuring renders unstyled first and then jumps.
- **Typography.** A new display face (identity) and the global `h1` base-style change (`globals.css` `@layer base h1` = JetBrains Mono + glow) restyle **every** page at once.

**Prevention:**
- Compute row layout from the manifest's known aspect ratios: server-side, or CSS-only (`flex-grow: aspect; aspect-ratio`).
- Use `next/font` with `adjustFontFallback` and only the needed weights.
- Make the global h1 change its own commit with an intentional re-baseline that is reviewed page by page.

ui-ux-pro-max: `image-dimension`, **Content Jumping**, **Font Loading** ("Reserve space with fallback font"), `font-preload`.
**Detection:** A Playwright `PerformanceObserver('layout-shift')` sum < 0.1 on `/`, `/photos`, `/projects`.
**Phase:** 7 (typography), 10 (grid)

### Pitfall 25: Deleting playground and hex code cascades into live pages
Consumer map `[REPO]`:
- `AnimatedGradientMesh` is still used by **`app/contact/page.tsx`**, not only the playgrounds.
- `/transitions` is linked from `app/photos/page.tsx:24`.
- `useHexGrid` is used by `app/projects/page.tsx`.
- `GeologicalButton`'s only consumer is `Hero3DMountain`.
- `ContourBackground` is used only by `GlassmorphismNav`.
- `ShaderTransition` is used only by `TransitionShowcase`.

**Prevention:**
- Delete routes first, then re-run a consumer check (`rg -lw <Component>` or `knip`) and delete only zero-consumer modules.
- Remove the `/transitions` link with the route.
- Delete `AnimatedGradientMesh` only after the summit-register Contact page replaces it.
- Remove `.hex-clip`/`.hex-grid` CSS together with `useHexGrid`.

**Detection:** `next build` + `tsc` + a 404 check that `/gradient-mesh`, `/particle-buttons` and `/transitions` return 404 with the designed page. No internal link points to a 404 (crawl links from every route in e2e).
**Phase:** 11 (hex), 12 (playgrounds, dead code)

### Pitfall 26: The Contact "summit register" redesign quietly drops security or form UX
It's tempting to convert the form to a Server Action during the redesign. That bypasses the existing `/api/feedback` Origin check (`validateOrigin`) and the Upstash rate limit. Themed metaphors also tend to hide labels or move errors.

**Prevention:** Keep `FeedbackForm`'s data path and accessible names. Restyle only. Fix the h1 contrast with a solid token surface.

ui-ux-pro-max: `input-labels`, `error-placement` (aria-describedby), `aria-live-errors`, `submit-feedback`, `focus-management`.
**Detection:** The existing `contact-form.spec` stays green, unchanged except for the heading copy. The API unit tests in `app/api/__tests__` stay green.
**Phase:** 12

### Pitfall 27: Placeholder identity survives in the corners
Placeholders sit in `package.json` `author: "Your Name <your.email@example.com>"`, metadata title "Portfolio | …", Footer "My Portfolio", and bare `https://github.com` / `https://linkedin.com` links.

**Prevention:** A forbidden-strings check in `lint:tokens`: `your.email@example.com`, `My Portfolio`, `Welcome to My Portfolio`, `href="https://github.com"` (exact), `href="https://linkedin.com"`, `"P" + "ortfolio"`. An e2e asserts that every external link's `href` matches the real profiles.
**Phase:** 7

### Pitfall 28: swisstopo attribution missing where data is shown
**Prevention:** Put "© swisstopo" in the `(site)` footer **and** on the map view and the static hero poster (an image that might be shared alone). Edge pages outside the layout need it too.
**Detection:** The Pitfall 7 route loop.
**Phase:** 7 (footer), 9/10 (in-situ)

---

## Minor Pitfalls

- **Wrong summit number:** The altimeter shows `max(DEM)` (about 4,47x m) instead of the official 4,478 m. Use canonical constants. *(Phase 9)*
- **CI Node version:** CI pins Node 20. Next 16 needs ≥ 20.9 and `sharp`/geotiff scripts are fine, but keep local Node aligned (`.nvmrc`) so pipeline output is reproducible. *(Phase 8)*
- **Unanchored copy assertions:** `getByText(/Completed/i)` in `RoadmapTimeline.test` will match multiple nodes once route-log copy adds "completed" elsewhere. Anchor to roles. *(Phase 11)*
- **Terminal scrollbar CSS:** `HologramTerminal` injects `::-webkit-scrollbar` styles via an inline `<style>`. Restyling to tokens must keep the CSP `style-src 'unsafe-inline'` assumption or move the styles into `globals.css`. *(Phase 11)*
- **Dev indicator in screenshots:** The Next 16 dev indicator appears in any dev-server screenshot. One more reason for prod-only baselines. *(Phase 7)*
- **Strict-mode double mounts:** `reactStrictMode: true` double-mounts in dev. R3F scenes that skip cleanup leak two contexts in dev only, which looks like a prod bug that isn't one. Still implement disposal. *(Phase 9)*

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| Re-baselining all screenshots in one commit | Fast green CI | Real regressions hide among intended diffs | Never. One intentional change per re-baseline commit, with diffs reviewed |
| Regex-stripping `dark:` classes | Minutes of work | Keeps the light half and recreates the Contact bug in 23 files | Never. Use the staged collapse (Pitfall 3) |
| `.skip`/deleting tests that assert old markup | Unblocks a phase | Coverage silently shrinks, which is the user's top frustration | Never. Rewrite in the same commit; ratchet the count |
| Allow-listing white/black in the guard forever | Avoids 282 edits | Two colour systems persist | Only as a decreasing ratchet that reaches 0 by Phase 12 |
| Generating data in `prebuild` with network fetches | No committed artifacts | Flaky Vercel/CI builds; tsc fails in CI jobs without a build | Never. Commit generated text artifacts |
| Hand-copying token hex into shaders | Quick colour match | Drift between WebGL and CSS; wrong colour space | Never. Use a generated `lib/tokens.ts` |
| Keeping v1 token aliases | Zero-diff migration | Permanent dual naming | Through Phase 11; removed in 12 |
| `experimental.viewTransition` in prod | Free shared-element morph | API churn | Acceptable only with feature detection and identical non-animated behaviour |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| swisstopo swissALTI3D | Assuming coverage across the border | Blend swissALTIRegio for the Italian face; crop the AOI; keep attribution |
| LV95 ↔ WGS84 | Linear lat/lon scaling | One shared `lib/geo.ts` using swisstopo formulas; unit-test known points |
| d3-contour | Importing in components (ESM breaks Jest); y-down grid used as north-up | Scripts only; explicit transform; downsample and simplify |
| exif-reader + sharp | Treating the `Date` as UTC; `withMetadata()` for colour; no `.rotate()` | Local ISO string + TZ; `keepIccProfile()`; `.rotate()` first |
| Motion 14 | Upgrading together with API renames or a `motion` package swap | Exact version bump alone; one motion package; zero-diff gate |
| React ViewTransition | Using it on React 19.2 (works only via the App Router canary; undefined in Jest) | Bump react/react-dom/@types to 19.3 first |
| Playwright screenshots | Windows-made baselines, light scheme, dev server, SW active | Linux Docker, dark + light projects, prod build, `serviceWorkers: 'block'` |
| CSP (`proxy.ts`) | drei `<Text>`/DRACO blob workers without `worker-src` | HTML overlays; build-time preprocessing; deliberate `worker-src` only if needed |
| Vercel install | `npm install` (vercel.json) vs `npm ci` (CI) | `npm ci` everywhere |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| Continuous R3F frameloop | Battery drain, warm phone, scroll jank | `frameloop="demand"` + `invalidate`; pause off-screen | Any mobile visit longer than about 30 s |
| Oversized terrain mesh / DPR 2–3 | < 30 fps on mid-range Android | ≤ 512² vertices, `dpr [1,1.5]`, PerformanceMonitor | Mid-range Android, older iPhones |
| Contour SVG inlined in a React tree | HTML plus RSC payload duplicate multi-MB paths | Static hashed `.svg` file via `<img>`/`<use>`; downsample before contouring | More than about 200 KB of path data |
| Sticky canvas sized with `dvh` | Canvas re-allocation on every URL-bar toggle | `svh`/`lvh` + debounced resize | iOS Safari / Android Chrome scroll |
| Originals (194 MB) in `public/` | Large deploys; SW caches huge files cache-first | Move out of `public/` | Every deploy |
| Proxy on every static asset | Extra edge invocations and latency per terrain/image request | Matcher excludes file extensions | Grows with asset count |

## Security Mistakes

| Mistake | Risk | Prevention |
|---|---|---|
| Serving originals with a GPS IFD from `/public` | Location metadata disclosure; full-resolution theft | Move originals out of `public/`; CI EXIF scan of `public/**` |
| `withMetadata()` to fix colour | Re-embeds EXIF/GPS in every variant | `keepIccProfile()` / `withIccProfile('srgb')` |
| Widening CSP (`blob:`, `unsafe-*`) to make a 3D lib work | Weakens the v1 nonce CSP | Avoid worker-based libs; add narrowly scoped `worker-src` only with justification |
| Contact redesign via Server Action | Bypasses `validateOrigin` + Upstash rate limit | Keep the `/api/feedback` path |
| Leaving `connect-src https://raw.githubusercontent.com` | Unneeded third-party egress | Remove in Phase 12; same-origin request assertion in e2e |

## UX Pitfalls

| Pitfall | User Impact | Better Approach (ui-ux-pro-max guideline) |
|---|---|---|
| Scroll-jacked "ascent" | Nausea, lost control | Native scroll + sticky stage; static final state under reduced motion (**Motion Sensitivity**, `parallax-subtle`) |
| Content only inside the canvas | Screen-reader, no-WebGL and reduced-motion users miss waypoints | DOM waypoint list always rendered (`alt-text`, `heading-hierarchy`) |
| Fixed SiteNav covering focused elements | Keyboard users lose focus position | `scroll-padding-top` (**Focus Not Obscured (Minimum)**, `fixed-element-offset`) |
| Lightbox without focus trap/return | Focus lost behind the modal or reset to top | `<dialog>`, return focus to the thumbnail (`focus-states`, `escape-routes`) |
| Trail grades by colour only | CVD users can't tell T3 from T5 | Text label + pattern + legend (**Color Only**, `pattern-texture`) |
| Auto-advancing carousel view | Motion with no control | Pause/prev/next; stop on focus and reduced motion (**Auto-Rotating Content Controls**) |
| Hover-only hotspot callouts | Touch and keyboard users can't read them | Click/Enter to open, Escape to close (`hover-vs-tap`, `tooltip-keyboard`) |
| Altimeter in `aria-live` | Screen-reader flood | `aria-hidden` rail + headings (`contextual-live-badge-updates`) |
| Body scroll-lock with visible scrollbars | 15 px page jump on open | `scrollbar-gutter: stable`, `<dialog>` (**Content Jumping**) |

## "Looks Done But Isn't" Checklist

- [ ] **Baselines:** Only `*-linux.png`; dark and light projects identical; scroll-state shots present; `retries: 0` on visual projects.
- [ ] **Install:** `npm ls --depth=0` clean; `vercel.json` uses `npm ci`.
- [ ] **`dark:` removal:** `rg -c "dark:"` = 0 **and** light-OS screenshot = dark-OS screenshot.
- [ ] **Palette guard:** Runs over `data/` and `__tests__/`; no stock family name reused by a v2 token; white/black ratchet file committed.
- [ ] **Motion 14:** Exact `14.1.0`; `npm ls motion-dom` single; zero visual diff in the upgrade commit.
- [ ] **(site) layout:** One `nav[aria-label=Primary]` and one `#main-content` on every route, including 404 and offline.
- [ ] **Images:** No data path references a missing file; no image request ≥ 400; originals not reachable under `/images/landscapes/`.
- [ ] **EXIF:** No GPS IFD in `public/**`; `captureDate` correct (Sept 2021 set); waterfall label confirmed by Tim.
- [ ] **Terrain:** Italian face present; summit sample ≈ 4,478 m; pins sit on the terrain; contour map north-up.
- [ ] **Hero:** Static poster + DOM waypoints without JS/WebGL; context-loss fallback works; no CSP console errors.
- [ ] **Reduced motion:** `document.getAnimations().length === 0` after opening the lightbox; no canvas on Home under reduce.
- [ ] **Lightbox:** Deep link works on hard refresh; Escape returns focus to the thumbnail; back closes it; no stuck modal after nav.
- [ ] **Trail grades:** Text label on every marker; yellow never used as text colour.
- [ ] **Generated data:** Committed; `data:check` diff-clean in CI; no ESM generator imported by components.
- [ ] **Caching:** Generated asset filenames hashed; SW update e2e passes; offline page styled offline.
- [ ] **Attribution:** "© swisstopo" on the footer, map view and poster.
- [ ] **Tests:** Test count ≥ baseline; no `.skip`/`.fixme` added.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| Baselines captured wrong (light/Windows/dev) | LOW | Delete the snapshots; regenerate in Linux Docker against the prod build with the dark+light projects; re-verify no code changed in between |
| `dark:` stripped the wrong half | MEDIUM | Revert the file; apply the `@custom-variant` neutraliser; redo the collapse file by file under zero-diff |
| Motion 14 regression found later | LOW–MEDIUM | Revert to the exact 12.39.0 lock entry (isolated commit makes this trivial); bisect with the scroll-state shots |
| Old image variants deleted early | LOW | `git checkout` the files; add the existence test before retrying |
| GPS leaked in served images | MEDIUM | Remove the files, redeploy, purge the Vercel cache; files under immutable caching may persist in clients, so rename paths |
| Stale assets under immutable cache | MEDIUM | Rename to hashed filenames (the only fix); update the manifest |
| Duplicate nav after route-group move | LOW | Remove per-page Header/Footer imports; add the count assertion |
| CSP-blocked worker in prod | LOW | Swap to an HTML overlay or build-time preprocessing; or add scoped `worker-src` |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---|---|---|
| 1 Lockfile drift | 7 | `npm ls` clean in the preflight; vercel `npm ci` |
| 2 Untrustworthy baselines | 7 | Linux-only snapshots; dark+light projects; prod server; SW blocked |
| 3 `dark:` wrong half | 7 | Dark = light snapshots; `dark:` count 0 |
| 4 Palette guard | 7 → 12 | `lint:tokens` in CI; ratchet reaches 0 in 12 |
| 5 Test contracts | 7 (ratchet), all phases | Test count ≥ baseline; contract table per plan |
| 6 Motion 14 | 7 | Isolated commit, zero diff, single `motion-dom` |
| 7 Route group / SiteNav | 7, 12 | Per-route nav/main/attribution assertions |
| 8 Image variant deletion | 8 → 10 → 12 | Asset-exists unit test; no 4xx images |
| 9 Generated data in CI | 8 | `data:check` diff-clean; tsc/jest green without build |
| 10 Geodesy/DEM | 8, 9 | `lib/geo` unit tests; summit sample; north-up SVG |
| 11 EXIF traps | 8 | Generated-data unit tests; corrections file; Tim confirms the waterfall |
| 12 GPS privacy | 8 | CI EXIF scan of `public/**`; originals return 404 |
| 13 CSP vs 3D | 9, 12 | Console CSP listener; same-origin request assertion |
| 14 Reduced-motion parity | 7, 9, 10 | Reduce project: no canvas, `getAnimations()==0`, DOM waypoints |
| 15 Mobile WebGL | 9 | Real-device check; throttled trace; context-loss e2e; memory flat |
| 16 View Transitions/lightbox | 10 (React 19.3 bump in 7 or early 10) | Deep-link/reload/Escape-focus/back e2e; no duplicate-name errors |
| 17 SW/immutable caching | 8, 12 | Hashed filenames; SW update e2e; styled offline |
| 18 Scrollbar shift | 7 | Lightbox open/closed bounding-box compare |
| 19 Contrast script drift | 7 | Script parses globals.css; axe incl. `incomplete` |
| 20 Token aliases | 7, 12 | Zero-diff aliasing; aliases removed + banned in 12 |
| 21 Altimeter a11y | 9 | Screen-reader pass; `aria-hidden` rail; tabular nums |
| 22 Trail grades | 11 | Text labels; 3:1 non-text contrast; yellow fill-only |
| 23 Map/hotspot keyboard | 10 | Keyboard-only e2e opens each pin; 24 px targets |
| 24 CLS (grid/fonts) | 7, 10 | Layout-shift sum < 0.1 per route |
| 25 Deletion cascade | 11, 12 | Consumer check; designed 404 on deleted routes; link crawl |
| 26 Contact security/UX | 12 | contact-form.spec + API tests unchanged and green |
| 27 Placeholder identity | 7 | Forbidden-strings check; real hrefs e2e |
| 28 swisstopo attribution | 7, 9, 10 | Route loop asserts "© swisstopo" |

## Sources

**Repository inspection (HIGH):**
- `proxy.ts`, `public/service-worker.js`, `next.config.ts`, `vercel.json`, `playwright.config.ts`, `.github/workflows/ci.yml`, `jest.config.js`, `jest.setup.js`, `app/globals.css`, `app/layout.tsx`, `lib/useReducedMotion.ts`, `scripts/optimize-images.mjs`, `scripts/verify-contrast.mjs`, `data/landscapes.ts`
- `e2e/*.spec.ts` and `components/__tests__/*.test.tsx` (selector and copy contracts)
- `npm ls framer-motion motion-dom` → `framer-motion@12.35.1 invalid: "^12.39.0"`; installed `next` 16.1.6
- `sharp().metadata()` over `public/images/**` → GPS IFD present in all four originals; none in variants
- `node_modules/tailwindcss/theme.css` → `--color-amber-500`, `--color-white`, `--color-black` are theme vars
- Consumer map via `rg -lw` for every deletion candidate

**Official / registry (MEDIUM; research seam tier LOW for web fetches, so verify in phase):**
- Motion CHANGELOG, https://raw.githubusercontent.com/motiondivision/motion/main/CHANGELOG.md (13.0 is-prop-valid removal, 13.2 MotionValueState/`set()`, 13.4.x–13.5 `useScroll` offset/ViewTimeline changes, 14.0 internal API removal, 13.4 `AnimateView` for React 19.3)
- npm registry: `framer-motion` / `motion` latest 14.1.0 (published 2026-10-09; 14.0.0 on 2026-10-02); `react` latest 19.3.0; `d3-contour@4.0.2` `"type": "module"`; `exif-reader@2.0.3` CJS
- [React 19.3 release: ViewTransition stable](https://react.dev/blog/2026/09/09/react-19-3)
- [Next.js viewTransition config (experimental, "not recommended for production")](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition), [Next.js view transitions guide](https://nextjs.org/docs/app/guides/view-transitions)
- [MDN animation-timeline: "Limited availability … not Baseline"](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline)
- [swissALTI3D on opendata.swiss (coverage CH + LI)](https://opendata.swiss/en/dataset/swissalti3d), [swisstopo swissALTIRegio (extends ≥100 km beyond the border)](https://www.swisstopo.admin.ch/en/height-model-swissaltiregio-20240405)
- Playwright docs: `toHaveScreenshot`, `snapshotPathTemplate` (platform suffix), `animations: 'disabled'`, `colorScheme`, `reducedMotion`, `serviceWorkers` (https://playwright.dev/docs/test-snapshots, https://playwright.dev/docs/api/class-testoptions)
- Tailwind v4 docs: dark mode `@custom-variant`, theme namespaces / `--color-*: initial`, `@theme inline` (https://tailwindcss.com/docs/dark-mode, https://tailwindcss.com/docs/theme)

**ui-ux-pro-max (local skill dataset, queried 2026-10-10):**
- `--domain ux`: Focus Not Obscured (Minimum/Enhanced), Motion Sensitivity, Reduced Motion, Content Jumping, Font Loading, Color Only, Focus States, Focus Appearance, Auto-Rotating Content Controls, Dragging Movements
- `--stack threejs`: dispose on Scene Removal, Dispose Textures Explicitly, antialias Set at Construction Only, Particle Count Ceiling
- `--stack nextjs`: Push Client Components down, Mark Client Components explicitly
- Quick Reference rules cited: `reduced-motion`, `parallax-subtle`, `number-tabular`, `contextual-live-badge-updates`, `web-target-size`, `hover-vs-tap`, `tooltip-keyboard`, `pattern-texture`, `legend-visible`, `contrast-data`, `shared-element-transition`, `modal-motion`, `escape-routes`, `deep-linking`, `back-behavior`, `state-preservation`, `fixed-element-offset`, `nav-state-active`, `navigation-consistency`, `breakpoint-consistency`, `image-dimension`, `main-thread-budget`, `color-accessible-pairs`, `input-labels`, `error-placement`, `aria-live-errors`
- One off-topic result was discarded: the chart-domain query returned a word-cloud entry.

**LOW, needs confirmation:**
- The waterfall is the Gornerschlucht rather than the Teufelsschlucht (GPS-based hypothesis; confirm with Tim)
- `R004-011` is a film scan with no camera EXIF
- EXIF altitude reference varies by device
- How a 0.01 ms duration behaves on scroll-driven timelines under the global reduced-motion rule

---
*Pitfalls research for: v2.0 Topographic Identity (UI/UX rework of the existing Next.js portfolio)*
*Researched: 2026-10-10*
