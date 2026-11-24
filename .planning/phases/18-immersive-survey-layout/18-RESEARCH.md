# Phase 18: Immersive Survey Layout - Research

**Researched:** 2026-11-24
**Domain:** Next 16.4.5 App Router (proxy redirects, intercepted lightbox, server-rendered layout), responsive images (`sizes`), deterministic map-label layout, Web Share / Clipboard APIs, data-licence attribution, Playwright visual and e2e budgets
**Confidence:** HIGH for codebase facts and browser probes; MEDIUM for licence interpretation and WebKit behaviour (not installed locally)

## Summary

Phase 18 is mostly a server-rendered rebuild of two pages (`/photos` as the Alps overview, `/photos/regions/<id>` as the ascent sequence), a small number of client islands (Share button, altimeter rail marker, optional list–map sync), and a rework of the existing client `PhotoViewer` (per-region stepping, end card, LV95 line, Share, the 13 #33/#34 fixes). No new dependency is needed: everything is built from code that already exists (the v2.0 piecewise-linear label layout in `lib/photos/label-layout.ts`, `CopyEmailButton`'s clipboard pattern, `useSyncExternalStore` stores, `wgs84ToLv95`/`lv95ToWgs84`, the manifest `<picture>` derivatives, `lightbox-tiers.ts` constants).

Five findings change how the plans should be shaped. (1) **The UI-SPEC overview placement rule, applied literally, collides at both tiers**: a sweep with the real outline and summit data shows the Ortler marker overlapping the Zugspitze triangle for every sheet width 312–483 px, the Zermatt marker sitting 6–8 px from Dufourspitze up to 469 px, and the right-of-marker region plates colliding with markers and triangles across most of 560–978 px. A candidate search (8 directions, leader lengths 8/16/24/40 px) places every marker and plate at every integer width; only the Grossglockner summit label still fails at 589–660 px under greedy order, so the layout function needs ordering/backtracking or a sanctioned "unlabelled where it cannot fit" fallback. Plan the layout as a TDD task with the Jest sweep written first. (2) **HEAD is red in CI**: the last run on the Phase 17 review-fix tip (`ci/17-review-fixes`, run 45445770986) failed the `og.spec.ts` "v2.0 photo cards keep their base og:image URL" pin on all three engines (`?1bf973d7cc2e42c4` became `?f8a1b67515ad261d`; the local build at a857d35 reproduces the new hash), plus a WebKit `home-modes` B8 timeout. Phase 18 inherits this and must resolve it in Wave 0 before any `ci/18-*` push can be green. (3) **The `visual-baselines` dispatch has no `missing` mode** (`options: [changed, all]`); `changed` "also creates missing snapshots", so the D-21/D-24 "capture new routes with `update_mode=missing`" step must be run as `changed` plus the established byte-compare of the artifact. (4) **Recommend the proxy for the `?view=` redirect** (308, query dropped, unit-testable with the existing `proxy.test.ts` harness) over `next.config` `redirects` (which pass the query through to the destination) and over a page-level `permanentRedirect`. (5) **Licences:** CC BY 4.0 §3(a)(2) and Etalab 2.0 affirmatively accept a hyperlink; the GLO-90 licence Article 6 requires the notice to be "provided" but sets no placement rule; swisstopo's OGD terms require a source reference "attached" with no statement on links. No licence was found that requires the full notice at the map, so D-16/D-17's link credits are supportable, but that reading is an interpretation that Tim should confirm at the D-20 copy checkpoint.

**Primary recommendation:** Build every layout decision as a pure, import-free function with a Jest sweep first (overview marks, plate badges, rail ticks, `sizes` strings, LV95 rounding, region order), render all pages on the server, keep client code to three small islands plus the viewer rework, redirect `?view=grid|carousel` in `proxy.ts` with a 308, and start the phase by fixing the inherited red `og.spec` pin.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `?view=` legacy redirect (D-03) | Frontend server (`proxy.ts`) | — | Decided before render; proxy already runs on every document request and is unit-tested |
| Region order west→east (D-01) | Frontend server (`lib/regions.ts`, from `overview.outlines` u) | — | Overview data is server-only (`SERVER_ONLY_MODULES`) |
| Overview marks/labels layout | Frontend server (pure layout fn → `<style>` container queries) | Browser (CSS container queries) | v2.0 pattern: server HTML exact, no client relayout |
| List–map sync highlight | Browser (CSS `:has()` from server-generated selectors) | Optional client island | Zero JS possible; UI-SPEC accepts no-JS degradation |
| Region page (header, facts, plate, sequence, next block) | Frontend server (RSC) | — | Static data; only rail marker and Share need JS |
| Altimeter rail current marker | Browser (client island, IntersectionObserver) | Server (marks photo 1) | Scroll position is client-only |
| Per-region stepping + end card | Browser (`PhotoViewer` client) | Server (builds region set, next-region strings as props) | Region registry must not reach client chunks |
| Share / Copy link | Browser (client island) | Server (canonical absolute URL as prop) | Web Share and Clipboard are browser APIs; URL never from `location.href` |
| LV95 line | Frontend server (computed in view-model into `StripFields`) | — | Keeps `wgs84ToLv95` and precision logic out of the client |
| Sheet margins, `/sources`, footer Source row | Frontend server (RSC) | — | Static text; footer is also in the `global-error` client graph (see Pitfalls) |
| Breadcrumb + `BreadcrumbList` JSON-LD | Frontend server | — | One builder feeds both the `nav` and the JSON-LD |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Overview and old view URLs (session 1)
- **D-01: Regions run west to east:** Zermatt (about 7.75° E), then Ortler (10.5° E), then Saalfelden (12.85° E). That one order drives the region list, the pins' tab order and the next-region chain (D-12, D-14). A new region slots in by longitude.
- **D-02: Each row of the overview's region list shows the region's cover thumbnail plus its data.**
  - The cover is the Phase 17 `cover` in `data/regions/regions.json`.
  - The exact data fields (e.g. country, photo count, altitude range) are a UI-SPEC call.
  - The list stays the keyboard, screen-reader and narrow-screen path, with numbered pins on phones (REGION-01).
- **D-03: `?view=grid` and `?view=carousel` land on the Zermatt region page.**
  - The v2.0 grid and carousel both showed the Zermatt photos, so they land on Zermatt.
  - Tim rejected "every `?view=` goes to /photos". Read literally, `?view=map` (the v2.0 default) and any unknown value stay on `/photos`, which is now the overview that replaces the map view.
  - The redirect status and mechanism (proxy vs page) are for research and the planner. Old links must keep working (PROJECT "Pitfall 8: link previews and redirects").
- **D-04: No overview-rectangle-to-plate morph in this phase.** It stays deferred as REGION-F4.

#### Region page and sequence (session 1)
- **D-05: The top of a region page, the header slot Phase 19 fills with a drone loop, shows the region's cover photo for now.**
  - The slot keeps the poster aspect ratio and the pause-control space Phase 19 needs (ROADMAP UI-SPEC note), so Phase 19 swaps media without a layout shift.
- **D-06: The site nav stays fixed while scrolling.** It doesn't hide on scroll down on region pages. This answers the research flag "whether the nav hides on scroll".
- **D-07: The altimeter rail shows from 768 px up. On phones, each photo's caption carries its place in the ascent as "n / N".** There's no slim rail or sticky sheet bar on phones.
- **D-08: Clicking a photo pin on the region's plate scrolls to that photo's figure in the sequence.** It doesn't open the lightbox. Focus handling and reduced-motion scroll behaviour are UI-SPEC calls.
- **D-09: Every photo page's back link goes to its region page, all 11, including the v2.0 four.**
  - The v2.0 four currently link "All photographs" → `/photos`.
  - Phase 18 changes this deliberately, so these four pages lose the byte-identical guarantee they kept in Phase 17 (17 D-07).
  - Links are built with `regionHref`.
- **D-10: Region and photo pages show a visible breadcrumb with a matching `BreadcrumbList` JSON-LD block** (17 discretion item, research FEATURES §5).
  - The JSON-LD lists exactly the visible links.
  - The `lib/__tests__/json-ld.test.ts` assertion "holds no … BreadcrumbList" (lines 47-48 and 813) is rewritten, not deleted.
- **D-11: The last region's next-region block wraps to the first region (Zermatt).** It doesn't send the visitor back to the overview.

#### Lightbox, Share, LV95 (session 1)
- **D-12: The end-of-series card is one extra step after the region's last photo.**
  - Stepping forward from the last photo shows the card, which links to the next region (D-01 order, D-11 wrap).
  - The card is not a panel overlaid on the last photo.
  - The v2.0 four now step within Zermatt (seven photos) instead of among themselves (17 D-08 hand-over).
  - The counter and how the card counts in it are UI-SPEC calls.
- **D-13: Share / Copy link appears in two places:** the viewer strip (photo page and lightbox, sharing the photo) and the region header (sharing the region). It is not on each sequence figure. The label says which action it performs (PHOTO-07).
- **D-14: Coordinates by place:**
  - **Map collar:** shows WGS84 for every photo.
  - **Viewer strip:** adds the LV95 line for Swiss photos only (PHOTO-08; LV95 on non-Swiss photos is out of scope).
- **D-15: The LV95 line matches its photo's precision.**
  - A 4dp photo shows LV95 rounded to 10 m (PHOTO-08).
  - A future coarse Swiss photo (3dp or 2dp) shows LV95 rounded to the equivalent grid, so LV95 is never finer than the WGS84 the page shows. This mirrors 17 D-19 for JSON-LD.

#### Credits, sources, baselines (session 2)
- **D-16: The footer's "Source" row becomes a short credit plus an "All data sources" link to `/sources`.**
  - Today the Matterhorn sheet legend in every footer prints the full swissALTIRegio string, about 600 characters (`site.attribution.terrain` via `components/terrain/SheetLegend.tsx:103`).
  - The full string moves to `/sources`. The rest of the footer legend (title, scale, equidistance, Extent (LV95), Last surveyed) is unchanged.
  - **Research must confirm** that each licence accepts a credit by link: swisstopo's terms, CC BY 4.0 §3(a)(2) for the fill datasets inside swissALTIRegio and for BEV, and Copernicus GLO-90 Article 6. Where one doesn't, that place carries the required text in full.
  - **Reversibility:** costly. The footer is on every route, so undoing it means another full re-baseline.
- **D-17: Each map's short margin credit links to its own entry on `/sources`** (an anchor such as `/sources#copernicus-glo-90`).
  - **Fallback:** if research finds a licence requires its full notice at the map itself (most likely the GLO-90 notice, which 16 D-21 says must not be shortened), that margin carries the full notice instead of the short credit.
  - **Reversibility:** costly. The anchor ids become link targets from every margin, so they should not be renamed after launch.
- **D-18: "Last surveyed" keeps its v2.0 meaning: the terrain data's edition** (`dem.edition`, `YYYY-MM`, as `SheetLegend` shows it today).
  - Matterhorn May 2026, Ortler May 2026, Saalfelden Sep 2025 (BEV's Stichtag, a creation date), overview "2021" (year only: `source.json` says "Copernicus DEM 2021 release" with no month).
  - Not the photo dates, and not two rows.
- **D-19: The Extent line uses LV95 for the Swiss sheet and WGS84 degrees for the rest.**
  - The Matterhorn sheet keeps "Extent (LV95)", unchanged.
  - Ortler (a swissALTIRegio LV95 plate, but in Italy), Saalfelden (EPSG:3035) and the overview show WGS84. This is the same rule as the photos (D-14).
- **D-20: `/sources` has one anchored entry per data source:** swissALTIRegio, BEV ALS DTM and Copernicus GLO-90. Each entry has:
  - the credit or notice word for word: the `site.attribution.terrain` string; the BEV line with its DOI from `data/terrain/plates/saalfelden/source.json`; and `GLO90_NOTICE` plus `GLO90_LIABILITY` from `data/schemas/overview.ts`;
  - the licence name, linked to its official text (the full legal codes are not copied onto the page);
  - what was done to the data (contours, hillshade, resampling, "modified");
  - links to the maps that use it.

  The page wording goes to Tim at a copy checkpoint before it is fixed (ROADMAP "Inputs from Tim: the sources-page wording"). `/sources` is a new public URL; it was named in the 2026-11-12 Key Decision.
  - **Reversibility:** one-way once indexed. It is linked from every footer and every margin.
- **D-21: Region pages are baselined as fixed viewport shots, not full page.**
  - **Shots:** Zermatt at three positions: the top (header and plate); one photo in its collar with the rail marking it; the end (next-region block). Ortler and Saalfelden get the top shot only.
  - **Settings:** 375 / 768 / 1440 px wide, 900 px high, reduced motion. That is 15 PNGs, captured as new routes with `update_mode=missing`.
  - **Why:** a full-page Zermatt shot would be about 9,000 px tall at 1440 (estimated ~5 MB per PNG; the one-photo page is already 1.06 MB at 1440×1650), and every new photo would force its re-baseline. With fixed positions, adding a photo moves only Zermatt's end shot.
  - Other routes keep their full-page shots.
- **D-22: The `photos-grid` and `photos-carousel` visual entries are rewritten as the new region-page shots, not dropped.**
  - Their `?view=` URLs now redirect (D-03), so an e2e test asserts where each `?view=` value lands.
  - No visual entry disappears without a replacement (PHOTO-06: view tests rewritten, never deleted).

#### CI approval (session 2)
- **D-23: Standing approval for `ci/18-*`, including the dispatches plans declare** (Tim, 2026-11-24: "ci/18-* plus declared dispatches (Recommended)").
  - **Covered:** plain pushes of new `ci/18-*` branches, fast-forward fix pushes, reading their CI runs, and each visual-baselines dispatch a plan declares (download and compare included).
  - **Excluded:**
    - force pushes;
    - pushing the phase branch or `main`;
    - PNG commits, which stay Tim's;
    - any undeclared dispatch: an unexpected visual diff stops and asks.
  - This is wider than the 15–17 approvals, which had no dispatch.

#### Carried into this phase (roadmap scope notes and earlier hand-overs)
- **D-24: Re-baseline discipline (ROADMAP "Baselines"):**
  - one deliberate re-baseline per cause, each with a declared PNG set: overview, region pages, photo page and lightbox, the footer's sources link on every route, and the sources page;
  - content last;
  - new routes captured with `update_mode=missing`;
  - Tim commits the PNGs;
  - re-run the HOME-08 budget afterwards, since shared chunks may grow.
- **D-25: Phase 13 ledger hand-overs (13-LEDGER-TRIAGE.md):**
  - **10 IN-04 (#33):** the neighbour preload asks for the AVIF set only. Fix it during the LBOX-09 stepping rework.
  - **10 IN-05 (#34):** derive `STAGE_SIZES` / `sizes` from the new layout.
  - **10 IN-08 (#37):** tie each row-height value to its breakpoint in the rewritten view tests, or retire the guard with the grid.
  - **10 IN-09 remainder (#38):** the rewritten view test waits on a positive signal, never the 600 ms `waitForTimeout`.
  - **14 IN-04:** the `STEP` class string in `DemoTerminal.tsx` copies `CarouselControls.tsx`'s `STEP_BUTTON`. It resolves when the Carousel retires; if any copy survives, move it into one shared module.
- **D-26: Watch the E2E duration (17 D-25).** Phase 18 adds routes to the audit gate and the visual suite. If the E2E Tests job would cross about 45 minutes, plan a shard or matrix first.
- **D-27: Retire the v2.0 light-table pins:**
  - `lightTableIds` (`data/light-table.ts`) and the `/photos` header kicker ("4 waypoints · 1,617–2,760 m · Zermatt", 15-CONTEXT) retire with the view switch (16 D-15, 17 D-07).
  - Home's waypoint list (`data/home-waypoints.ts`) is untouched (DATA-09).

### Claude's Discretion
- Redirect mechanism and status code for the `?view=` URLs (D-03), within "old links keep working".
- The breadcrumb's exact segments and separator (D-10), as long as the JSON-LD matches it.
- Short-credit wording per margin (D-16/D-17), drafted for Tim's copy checkpoint (D-20).
- The `/sources` anchor ids (D-17): stable, lowercase and source-named.
- Whether `/sources` joins the saved-pages catalog (`lib/saved-pages.ts`). It joins the sitemap, the audit gate and the visual suite.
- Which photo the Zermatt mid-sequence baseline shot centres on (D-21). It should be chosen from the data, never a literal slug, as the Home ascent shots do.

### Deferred Ideas (OUT OF SCOPE)
- **Overview extent-rectangle → region plate View Transition morph:** stays REGION-F4 (D-04).
- **Already deferred by the requirements, not revisited:**
  - REGION-F1: sticky mini plate;
  - REGION-F2: grid toggle on region pages;
  - REGION-F3: lightbox thumbnail index;
  - REGION-F5: country borders;
  - SEO-F1: image-rights page with `license`.

### UI-SPEC (approved 2026-11-24) — binding design contract
`18-UI-SPEC.md` Contracts 1–8, the Visual Baselines table and the UI Considerations backstops are binding. Its "Defaults to Confirm at Plan Review" P1–P7 are **open, not decided** (rail labels, instant anchor jumps, 16:9 pillarboxed slot, morph carried from grid, trail-sign tip, Triglav height, list right of map at `lg`).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REGION-01 | Overview map, one pin per region, synced list (keyboard/SR/narrow path), numbered pins on phones | § Overview layout feasibility (sweep results), § Pattern 2 (`:has()` sync, zero JS), § Region order |
| REGION-02 | Region page: header, facts, local plate with photo pins, next-region block | § Pattern 4 (server page), § Plate badge proximity, § Pitfall "duplicate view-transition names" |
| REGION-03 | Uncropped full-width sequence on gallery-black, ascending altitude, always-visible captions | § `sizes` derivation (probe results), § LCP, existing `regionPhotoViews` order |
| REGION-04 | Map collar: neatline and ticks outside the image | § Pattern 5 (ring + outside ticks), § Pitfall sticky/overflow |
| REGION-05 | Altimeter rail reads ascent, marks current photo | § Pattern 6 (IntersectionObserver island, `data-rail-current` test signal) |
| REGION-06 | Sheet margins (extent, last surveyed, short credit) + footer link to `/sources` with full credits | § Licences finding, § Extent conversion (Ortler LV95→WGS84, Saalfelden EPSG:3035 at build time), § Pitfall footer in client graph |
| PHOTO-06 | View switch replaced; old `?view=` URLs land; view tests rewritten | § Redirect mechanism comparison, § Test rewrite map, § GUARD-03 headroom |
| PHOTO-07 | Web Share where it exists, copy elsewhere, label says which | § Web Share / Clipboard findings (BCD + Playwright probe), § Pattern 7 |
| PHOTO-08 | Swiss photos LV95 rounded to 10 m next to WGS84 | § LV95 rounding from the *shown* WGS84, `country` field on generated photos |
| LBOX-09 | Lightbox steps within region, ends on end-of-series card to next region | § Pattern 8 (stepping state N+1), § 13 #33/#34 fixes |
</phase_requirements>

## Project Constraints (from CLAUDE.md / AGENTS.md / memory)

- **AGENTS.md:** "This is NOT the Next.js you know" — read `node_modules/next/dist/docs/` before writing Next code. This research read `02-guides/redirecting.md`, `03-api-reference/05-config/01-next-config-js/redirects.md`, `03-api-reference/03-file-conventions/proxy.md` (execution order) and the `next-metadata-image-loader.js` source.
- **No `CLAUDE.md`** in the repo root; the user's global CLAUDE.md asks for structured option tables, root-cause-first debugging and explicit regression-risk flags (applied below).
- **ui-ux-pro-max is mandatory for UI work** (memory). Loaded this session; see § ui-ux-pro-max notes.
- **Privacy (16 D-25):** never write photo coordinates finer than the page's shown precision into planning files. This document uses placeholders for coordinates.
- **Never read `.env.local`**; search with `git grep`.
- **Builds:** `npm run build`'s postbuild rewrites tracked `public/service-worker.js`; run `git restore public/service-worker.js` after every build. Stop any `next start` you launch.
- **Global npm shadow (memory):** an old npm 11.6.1 in `%APPDATA%\npm` rewrites lockfile metadata; this phase installs nothing, so it should not matter. If any install becomes necessary, use the bundled `npm-cli.js`.
- **Baselines (memory + PROJECT):** only from the CI `visual-baselines` dispatch; Tim commits PNGs; threshold 0.01; `check-snapshot-commit --allow <slug>` per slug, never `--allow-all`; never `--update-snapshots` locally.
- **Approvals:** `ci/18-*` plain pushes and plan-declared dispatches are pre-approved (D-23); never tell a subagent "Tim approved X" without his literal reply (memory).

## Standard Stack

### Core (all already installed; no new dependency)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.4.5 [VERIFIED: `node -p "require('next/package.json').version"`] | App Router, proxy, intercepted `@modal` | Existing framework |
| react / react-dom | ^19.3.1 [VERIFIED: package.json] | `ViewTransition`, `useSyncExternalStore`, `useEffectEvent` | Existing |
| tailwindcss | 4.3.4 [CITED: 18-UI-SPEC Design System] | CSS-first tokens, container queries (`@container`, `@max-[35rem]`) | Existing |
| @phosphor-icons/react | 2.1.10 (`dist/ssr`) [VERIFIED: package.json] | `ShareNetworkIcon`, `LinkIcon`, `CheckIcon`, `MapTrifoldIcon` | Existing, icons confirmed by UI-SPEC |
| proj4 | 2.22.0 (devDependency, build scripts only) [VERIFIED: `node -p`] | EPSG:3035 → WGS84 for the Saalfelden extent at build time | Already used by `scripts/terrain/build-terrain.mjs:500` |
| @playwright/test | 1.65.0 [VERIFIED: `node -p`] | e2e, visual, perf projects | Existing |
| jest | 30.5.2 [VERIFIED: `node -p`] | unit + RTL | Existing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `<picture>` with manifest derivatives | `next/image` (ui-ux-pro-max nextjs stack row "Use next/image") | Rejected: the repo deliberately serves content-hashed AVIF/WebP derivatives with no `next/image` caller (STATE 13-04); changing would re-derive image URLs (PITFALLS 8 "image URL churn") |
| CSS `:has()` list–map sync | Client island with hover state | Island costs JS against the 4,096 B cap; `:has()` is supported in all three CI engines' current versions [ASSUMED: Chrome 105+/Safari 15.4+/Firefox 121+ from training] and UI-SPEC accepts degradation without it |
| IntersectionObserver rail | scroll listener + `getBoundingClientRect` | IO avoids per-frame layout reads (ui-ux-pro-max `reduce-reflows`, `main-thread-budget`) |
| `next.config` redirects | proxy redirect | See § Redirect mechanism |

**Installation:** none.

## Package Legitimacy Audit

No external packages are installed in this phase. `proj4` is already a devDependency used by the terrain build.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | No new packages |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Measured Baselines (this session)

| Item | Value | Source |
|------|-------|--------|
| Phase-base client JS at HEAD a857d35 | **1,851,745 B in 24 files** | `rm -rf .next/static && npm run build`, byte-sum of `.next/static/chunks/**/*.js`; SW restored after [VERIFIED: build this session, exit 0] |
| Phase 18 client-JS cap (convention 15–17) | **1,855,841 B** (base + 4,096 B) | arithmetic |
| HOME-08 gate | median total script transfer ≤ 468,770 B; median LCP ≤ 4,692 ms [VERIFIED: e2e/perf/home-baseline.json `"jsTransferBytes": 468770`, `"lcpMs": 4692`; spec lines 295-316] | last recorded 439,840 B at v2.0 close (6.2 % margin) [CITED: PROJECT.md:133] |
| 600-char `site.attribution.terrain` in client chunks | present in 3 chunks (`32i4pu2fgzz5p.js`, `3au0_hb537s5z.js`, `3n1v69k34_rrf.js`) | `grep -l "Tarquini"` over `.next/static/chunks` [VERIFIED] |
| E2E legs (ci/17-15, green) | chromium 15.4, webkit 14.4, firefox 12.2 min; Visual Regression 4.0 min | `gh run view 45306356650` [VERIFIED] |
| E2E legs (ci/17-review-fixes, **red**) | chromium 16.3, webkit 20.7, firefox 10.5 min | `gh run view 45445770986` [VERIFIED] |
| Test-count ratchet baseline | `"jest": 1694`, `"e2e": 549`, `"total": 2243` | `scripts/guards/test-count.baseline.json:2-4` [VERIFIED]; 17-15 recorded 2,365 Jest tests, so there is headroom |

## Architecture Patterns

### System Architecture Diagram

```
Browser request
  │
  ├─ next.config headers()  (security headers, Permissions-Policy: camera/mic/geolocation only)
  ├─ next.config redirects() (none today)
  ▼
proxy.ts ──► /photos?view=grid|carousel (single exact value) ──► 308 Location: /photos/regions/zermatt
  │        ├─ unknown /photos/<slug> | /photos/regions/<id> ──► neutral 404 (unchanged)
  │        └─ else: CSP nonce, NextResponse.next()
  ▼
App Router (root layout reads headers() ⇒ every page dynamic)
  ├─ /photos (overview, RSC)
  │    data: overview (server-only) + regions (server-only), ordered by outline centre u (west→east)
  │    layoutOverview(S-segments) ──► <style> container-query positions + :has() sync selectors
  │    region list <ol> (links = keyboard/SR path) ── markers aria-hidden, tabIndex -1
  ├─ /photos/regions/[region] (RSC)
  │    header (breadcrumb, h1, data, <ShareButton url=canonical/>) → header slot (cover, eager, high)
  │    facts | plate (layoutPlateBadges → <style>) + key list (#photo-<slug> anchors)
  │    sequence band: <ol> figures (collar, lazy <picture>, sizes per photo) | <RegionRail/> island
  │    next-region block (D-01 order, D-11 wrap)
  │    click figure ──soft nav──► intercepted @modal/(.)[slug] ──► LightboxDialog(PhotoViewer)
  ├─ /photos/[slug] (RSC) ──► PhotoViewer variant=page (region set, end card, LV95, Share, breadcrumb)
  └─ /sources (RSC, new) — verbatim credits from server-only data modules
Footer (every route, server; also inside global-error client graph) ── short credit + /sources link
```

### Recommended Project Structure (additions)
```
lib/photos/overview-layout.ts      # pure: marker/plate/summit-label placement per S, segments, CSS
lib/photos/plate-layout.ts         # pure: badge displacement + leaders per S
lib/photos/image-sizes.ts          # pure: figure, header-slot and stage `sizes` strings from tier constants + ratio
lib/photos/lv95-line.ts (or in view-model) # pure: shown WGS84 → LV95 grid-rounded string
lib/photos/share-mode.ts           # useSyncExternalStore: 'copy' on server, 'share' after hydration where allowed
lib/json-ld/content.ts             # + breadcrumbLd(items)
data/sources.ts (server-only)      # the three /sources entries; verbatim strings re-exported from their sources
components/photos/overview/*       # OverviewSheet, RegionList
components/photos/region/*         # RegionHeader, HeaderSlot, PlateSheet, SequenceFigure, RegionRail, NextRegion
components/photos/ShareButton.tsx  # 'use client'
components/terrain/SheetMargin.tsx # server; footer keeps SheetLegend
app/(site)/sources/page.tsx        # new
```

### Pattern 1: Region order from the overview outlines (D-01)
**What:** Sort regions by the centre `u` of their overview outline. The overview projection is plate-carrée over lon 5–17°, so `u` is monotonic in longitude.
**Evidence:** `data/generated/overview.ts:12-21` `"standardParallelDeg": 46.5, "lon": [5, 17], "lat": [43, 49]` [VERIFIED: read]; outline u ranges: zermatt 0.2204–0.2323, ortler 0.4571–0.4707, saalfelden 0.6461–0.6599 [VERIFIED: computed from the file]. Registry order is `ortler, saalfelden, zermatt` (`lib/regions.ts:42` comment "in registry order (ortler, saalfelden, zermatt)") [VERIFIED: read], so a new ordered helper is required.
**Caution:** `regions`/`regionIds` registry order feeds `generateStaticParams`, the sitemap and the saved-pages catalog, and `e2e` pins an exact `expectedSitemap` list (17-10). Add a new `regionsWestToEast()` rather than reordering `regions`, unless the plan deliberately re-pins the sitemap.

### Pattern 2: Overview layout = v2.0 label-layout machinery + candidate search
**What:** One pure function per sheet width S places markers (28 px incl. casing), region plates (144×48, wide tier) and summit labels; consecutive S with identical discrete choices form a segment; segments are emitted as container-query CSS with `calc(<frac> * 100cqw + <px>px)` (exactly how `lib/photos/label-layout.ts` `mapMarkSegments` / `mapMarkCss` work, `MapSheet.tsx:78-90` renders `<style>{css}</style>`) [VERIFIED: read].
**Sweep findings (this session, real data, scratchpad models):**

| Placement rule | Result |
|----------------|--------|
| UI-SPEC literal: marker 8 px above rect top-centre | **Fails compact tier:** Ortler marker × Zugspitze triangle overlap for S 312–483 (worst −9.1 px; −3.3 at 375); Zermatt marker × Dufourspitze gap < 8 px for S 312–469 (6.8 at 375) |
| + plate right of marker, flip left near edge; summit label right/left/below/above | **Fails wide tier widely:** Zermatt plate × Ortler marker (S 560–722), Ortler plate × Grossglockner triangle (560–978), Zermatt plate × Dufourspitze triangle (638–1100, ~1 px short at 736), Dufourspitze and Grossglockner labels unplaceable over large ranges |
| Candidate search: marker in 8 directions around its rect with leader 8/16/24/40 px; plate in 8 directions around its marker; summit labels 8 directions; greedy west→east then summits | **All markers and plates placed at every S 312–1100.** Only Grossglockner's label fails at S 589–660 (greedy order) |

**Recommendation:** implement the candidate search with a fixed preference order per box and one level of backtracking (or a summit-first order), and add the backstop that a summit label which cannot be placed is omitted on that segment only if Tim accepts it (the margin's Summits row names every summit). Also check leaders against boxes (the model did not). Write the Jest sweep (S 312–1100, the UI-SPEC E1 backstops) **before** the function.
**Confidence:** MEDIUM — the model approximated Inter text widths at 7.7 px/char; the real sweep must use the declared box constants.

### Pattern 3: List–map sync in CSS (zero JS)
```css
/* Server-generated once per region id; ids are registry ids (validated, [a-z-]) */
[data-overview]:has([data-region-row="zermatt"]:is(:hover, :focus-visible)) [data-region-marker="zermatt"],
[data-overview]:has([data-region-marker="zermatt"]:hover) [data-region-marker="zermatt"] { background: var(--color-accent); color: var(--color-ink-inverse); }
```
Emit it in the same server `<style>` as the layout (CSP allows it: `proxy.ts:191` `"style-src 'self' 'unsafe-inline'"` [VERIFIED: read]). Use `cssEscape` from `lib/photos/css-escape.ts` for ids even though they are validated.

### Pattern 4: Region page assembled on the server, props-only islands
Region registry, overview and plates are server-only (`lib/__tests__/client-graph.test.ts:41-60` `FORBIDDEN_IN_CLIENT_GRAPH` includes `'data/generated/plates.ts'`, `'data/generated/overview.ts'`; `SERVER_ONLY_MODULES = ['data/generated/overview.ts', 'data/regions/regions.json']`) [VERIFIED: read]. Every client island (ShareButton, RegionRail, PhotoViewer's end card) receives plain strings/numbers as props: next-region heading, facts line, href, canonical URL.

### Pattern 5: Map collar outside the image
Neatline as `ring-1` on a wrapper exactly the image's size (ring paints outside the border box, no layout); corner ticks as absolutely positioned 1 px strokes with negative offsets into the gutter. The figure box width `w-[min(100%,max(16rem,calc((100svh-var(--nav-h)-12rem)*var(--ar))))]` comes from the UI-SPEC. `--nav-h: 64px` [VERIFIED: app/globals.css:53]. Backstop test: image box rect contains no tick rect and natural ratio ±1 %.

### Pattern 6: Rail current marker (client island)
- One `IntersectionObserver` with `rootMargin: '-50% 0px -50% 0px'` over the `li[data-sequence-item]` elements; on each callback pick the entry intersecting the centre line; above the first → 1, below the last → N (use `boundingClientRect.top` sign).
- Expose `data-rail-current="{index}"` on the rail root: this is the **positive settle signal** for the rail e2e and the D-21 mid shot (replaces any fixed sleep, 13 #38 spirit).
- State via `useState` set from the observer callback (not from an effect body) to satisfy `eslint-plugin-react-hooks` 7.1.1 [VERIFIED: installed version] `set-state-in-effect`.
- Marker moves with `transform` + `motion-reduce:transition-none`.
- Sticky `top-[calc(var(--nav-h)+24px)]` works only if no ancestor has `overflow: hidden|auto`; for the full-bleed band use `overflow-x: clip` if horizontal clipping is needed.
- Home's `components/home/AltimeterRail.tsx` must not change (DATA-09): build `RegionRail` as its own component; share only pure helpers if their output for Home is unchanged.

### Pattern 7: Share / Copy link
```tsx
'use client';
// Mode store: server snapshot 'copy' (CI baselines and no-JS), client snapshot decides once.
const subscribe = () => () => {};
const clientMode = (url: string) =>
  typeof navigator.share === 'function' && navigator.canShare?.({ url }) !== false ? 'share' : 'copy';
// In the component:
const mode = useSyncExternalStore(subscribe, () => clientMode(url), () => 'copy');

async function onClick() {
  if (mode === 'share') {
    try {
      await navigator.share({ title, url }); // called synchronously in the handler: transient activation
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      // fall through to copy (activation may be consumed: see Pitfall 6)
    }
  }
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(url);
    showCopied(); // COPIED_MS = 2000 (components/contact/CopyEmailButton.tsx:7)
  } catch {
    showFailureAndSelect(url); // UI-SPEC Contract 4 "Copy failed"
  }
}
```
`url` is the canonical absolute URL built on the server (`site.url + photoHref(slug)` / `regionHref(id)`), never `location.href`. In the viewer the URL must follow the **shown** photo after `replaceState` steps, so pass the slug list/URL builder result per step, not the initial URL.

### Pattern 8: Region stepping with an end card (LBOX-09)
- `viewerPhotos(view)` becomes `regionPhotoViews(regionOfPhoto(view.id))` (its views already carry region-scoped `prevSlug`/`nextSlug` because `buildPhotoViews(seriesInput(region))` computes them within the series [VERIFIED: view-model.ts:403-440, regions.ts:52-55]).
- Viewer state: index ∈ 0..N where N is the card. `stepIndex` (`lib/photos/stepping.ts:60`) currently returns null past either end; add a card-aware variant rather than changing its contract silently.
- On the card: no `replaceState`, keep `lastWritten`/`lightbox.setShown` on the last slug so LBOX-08 focus return goes to the last figure; title stays.
- Next-region data (heading, facts line, href) passed as props from the server page (registry stays server-only).
- The v2.0 four change from `n / 4` to `n / 7` — expected, and D-09 already releases their byte-identity.

### Redirect mechanism (D-03, Discretion) — recommendation: proxy, 308

| Option | Status | Query on destination | Runs | Testability | Verdict |
|--------|--------|---------------------|------|-------------|---------|
| `proxy.ts` `NextResponse.redirect(new URL(regionHref(id), request.url), 308)` | any (`redirect(url, init?: number \| ResponseInit)` [VERIFIED: next/dist/server/web/spec-extension/response.d.ts:19]) | dropped (we build the URL) | after `next.config` redirects, before render [CITED: proxy.md "Execution order" 1. headers 2. redirects 3. Proxy] | `proxy()` is called directly in `lib/__tests__/proxy.test.ts` (existing harness) + e2e | **Recommended** |
| `next.config` `redirects()` with `has: [{ type: 'query', key: 'view', value: 'grid' }]` | 307/308 | **passed through**: "any query values provided in the request will be passed through to the redirect destination" [CITED: redirects.md:43] → `/photos/regions/zermatt?view=grid` | before proxy | e2e only | Works, but leaves a non-canonical query in the address bar and in shared links |
| `/photos` page `permanentRedirect()` | 308 [CITED: redirecting.md:135] | full control | during render (root layout already forces dynamic) | e2e only | Keeps `searchParams` reading in the overview page; logic sits in a view instead of the routing layer |

Implementation notes for the proxy branch:
- Mirror `parseView`'s exactness (`lib/photos/view-param.ts:16` `export const VIEWS = ['map', 'grid', 'carousel'] as const;`, `:32` `parseView`): redirect only when `searchParams.getAll('view')` has exactly one value equal to `grid` or `carousel`; `map`, unknown, repeated or differently-cased values render the overview.
- Put the target in the proxy-only module `lib/photos/region-ids.ts` (e.g. `LEGACY_VIEW_REGION = 'zermatt'`), never import `lib/photos/view-model.ts` into the proxy (it pulls manifests). Unit-test that the target is in `regionRouteIds`. `LIGHT_TABLE_REGION = 'zermatt'` (`view-model.ts:353`) retires with the light table.
- 308 is right for a permanent retirement; note browsers cache 308s, so the mapping is effectively permanent.
- The service worker passes redirects through untouched: navigations use `fetch(request)` (redirect mode manual) and only store `response.ok && response.type === 'basic' && !response.redirected` [VERIFIED: public/service-worker.js:63-83].
- RSC prefetches skip the proxy (`missing: next-router-prefetch` in `config.matcher`), harmless because nothing links to `?view=` after this phase. Add the PITFALLS 8 crawl check: no internal `href` answers 3xx.

### `sizes` per breakpoint (13 #34) and LCP

**Probe (this session, Playwright Chromium 158 and Firefox 159):** `min()`, `max()`, `calc()`, `vh`/`svh` and compound media conditions (`(min-width: 1280px) and (min-height: 640px)`) are all honoured in `sizes`; the browser picked the small or large candidate exactly as the computed length predicts in every case. WebKit was not probed (not installed locally) [ASSUMED for WebKit; the e2e `currentSrc` check below covers it in CI].

Current defect [VERIFIED: PhotoViewer.tsx:166-167]: `const STAGE_SIZES = '(min-width: 1280px) calc(100vw - 432px), 100vw';` ignores `LB_MIN_HEIGHT_REM = 40` (gutter needs height ≥ 640 px) and the height-limited photo box. Derive from `lib/photos/lightbox-tiers.ts` [VERIFIED: read] (`LB_KEY_MIN_REM = 48`, `LB_GUTTER_MIN_REM = 80`, `LB_MIN_HEIGHT_REM = 40`, `LB_GUTTER_PX = 216`, `LB_CHROME_PX = 56`) per photo ratio `ar`:

| Tier | Page variant `sizes` term (upper bound; strip height ignored so it never under-fetches) | Modal variant |
|------|------|------|
| gutter | `(min-width: 1280px) and (min-height: 640px) min(calc(100vw - 432px), calc((100vh - 120px) * ar))` | `… calc((100vh - 56px) * ar)` |
| key | `(min-width: 768px) and (min-height: 640px) min(100vw, calc((100vh - 120px) * ar))` | `… (100vh - 56px)` |
| scroll | `min(100vw, calc(70vh * ar))` | same |

(120 px = `--nav-h` 64 + chrome 56.) Sequence figures use the same approach from the figure-box formula (photo column 968 / `100vw − 168px` / `100vw − 32px` per UI-SPEC, capped by `(100vh − 64px − 192px) * ar`, floored at 256 px). Header slot: eager + `fetchPriority="high"`, starting point from the UI-SPEC.

**Gate recommendation:** a deterministic e2e per width (375/768/1440): for each rendered sequence image and the stage, `img.currentSrc`'s `w` descriptor ≥ rendered CSS width × DPR, and the next smaller candidate would be smaller than that (no gross over-fetch). This catches wrong `sizes` in all three engines without timing noise. For LCP, add an **on-demand** `e2e/perf/photo-baseline.spec.ts` in the `perf` project (same profile as HOME-08) that records region-page and photo-page LCP; record a baseline in the declared perf dispatch and gate only from the next phase (there is no prior number to gate against).

### Anti-Patterns to Avoid
- **View-transition name on the header cover:** the cover photo also appears in the sequence; two mounted `photo-{slug}` names abort the transition (PITFALLS 9). Only the sequence figure takes the name, and only while no photo is open (the `TileTransition` rule).
- **Reordering `regions` in place** (breaks sitemap/catalog pins).
- **Computing LV95 from raw coordinates** (see Pitfall 4).
- **`location.href` as the share URL** (query/hash leak, non-canonical).
- **Importing `lib/regions.ts`, `data/generated/*`, or `data/sources.ts` into any `'use client'` module** (client-graph guard).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Label/marker placement CSS per width | Client measuring/relayout | `label-layout.ts` segment machinery (`mapMarkSegments`, `mapMarkCss`) | Exact server HTML, CLS 0, proven sweep pattern |
| Clipboard success/failure UX | New copy logic | `CopyEmailButton` pattern (`COPIED_MS`, polite status, Range selection fallback) | Already tested incl. unmount race |
| Hydration-safe capability flags | `useEffect` + `setState` | `useSyncExternalStore` with server snapshot (as `lib/photos/hotspot-pref.ts:77`) | No hydration mismatch, passes react-hooks 7 lint |
| WGS84 ↔ LV95 | New formulas | `lib/geo.ts` `wgs84ToLv95`, `lv95ToWgs84`; `lib/footer-format.ts` `formatLv95` | swisstopo formulas, verified ≤ 0.14 m |
| EPSG:3035 → WGS84 | Hand-written LAEA inverse | `proj4` in `build-terrain.mjs` (emit WGS84 corners into generated data) | Already a dev dep, ellipsoidal LAEA is error-prone |
| JSON-LD serialisation | `JSON.stringify` in JSX | `jsonLdHtml` (`<`-escaping) in `lib/json-ld/site.ts` | XSS-safe, tested |
| Coordinate strings | toFixed | `formatCoordinates` / `roundedCoordinate` (precision required) | 16 IN-01: never pads coarse positions |
| Tier media queries | New literals | `lib/photos/lightbox-tiers.ts` constants | `lightbox-tiers.test.ts` pins CSS ↔ TS parity |

**Key insight:** every "layout" in this phase is data-driven geometry; the repo's proven path is pure function → Jest sweep → server CSS, with e2e asserting the same invariants at 3–4 widths.

## Runtime State Inventory

Phase 18 retires the view switch and the light table (a refactor/migration of public URLs).

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Visitors' service-worker `DYNAMIC_CACHE` may hold v2.0 `/photos?view=grid` / `?view=carousel` HTML (navigations are stored when ok, basic, not redirected). Served only on a network error. `localStorage` labels preference (`hotspot-pref`) unchanged | None required; offline-only staleness. Optional: bump the SW cache version if the plan touches the worker (it currently does not need to) |
| Live service config | None — no CMS/analytics config holds `?view=`; Vercel Analytics records URLs passively | None |
| OS-registered state | None | None — verified: no schedulers or daemons in this repo |
| Secrets/env vars | None reference views or regions | None |
| Build artifacts | `public/service-worker.js` rewritten by postbuild; visual PNGs `e2e/visual/routes.spec.ts-snapshots/photos-grid/*`, `photos-carousel/*`, and the `lightbox/*` set opened from the grid; browsers' cached **308** for `?view=` once shipped | `git restore` after builds; retire/replace PNGs only through Tim's commits with `check-snapshot-commit --allow <slug>`; treat the 308 as permanent |

## Common Pitfalls

### Pitfall 1: Inherited red CI on the Phase 17 tip
**What goes wrong:** `ci/17-review-fixes` run 45445770986 failed E2E on all three legs: `e2e/og.spec.ts:160` expects `…/opengraph-image-126xvw/card?1bf973d7cc2e42c4`, received `?f8a1b67515ad261d` for all four v2.0 photos; WebKit also timed out `home-modes.spec.ts:610` (B8 rail contrast) on all three attempts [VERIFIED: `gh run view --log-failed`]. The local build at a857d35 contains `f8a1b67515ad261d` in the photo OG metadata chunk [VERIFIED: grep `.next/server`]. STATE.md records the run as "still in progress at transition".
**Why it happens:** the `photos/[slug]/opengraph-image.tsx` file did not change between 038a4cb and 4d79f22, but its query hash did. Webpack's loader hashes the file content (`next-metadata-image-loader.js:60` `interpolateName(this, '[contenthash]', opts)`); Turbopack computes it in Rust (`write_metadata_item`, comment at :40) and evidently over more than the file [ASSUMED mechanism]. The review-fix commits changed modules the OG route imports transitively (e.g. `data/schemas/photo.ts`, `lib/regions.ts`).
**How to avoid:** Wave 0 task: bisect 038a4cb..4d79f22 with local builds (in a separate worktree, not by switching this branch) to find the moving commit; then either restore the hash or bring Tim a re-pin decision (the pin protects shared-link previews, PHOTO-05/T-17-12). Re-run the WebKit B8 test to classify flake vs regression.
**Warning signs:** any `ci/18-*` push red on `og.spec.ts` before Phase 18 touched OG code.

### Pitfall 2: The overview "simple rule" does not fit (see Pattern 2)
**How to avoid:** candidate search + backtracking, sweep first; get Tim's OK if any summit label must be dropped on a width range.

### Pitfall 3: `update_mode=missing` does not exist in the dispatch
**What goes wrong:** `.github/workflows/visual-baselines.yml:15-19` `update_mode` `options: [changed, all]` [VERIFIED: read]. Playwright 1.65: `'changed'` "update snapshots that did not match … Also creates missing snapshots" [VERIFIED: node_modules/playwright/types/test.d.ts:2025-2030].
**How to avoid:** dispatch `changed` and byte-compare the artifact against the committed set (12-11 round procedure); every PNG outside the declared set must be byte-identical. Do not edit the workflow just to add `missing` unless Tim wants it (the guards police workflows).

### Pitfall 4: LV95 leaking precision
**What goes wrong:** computing LV95 from the generated (or any raw) coordinate can print a value that the shown WGS84 does not imply.
**How to avoid:** parse the **shown** strings (`roundedCoordinate(lat, precision)`, same for lon), convert with `wgs84ToLv95`, then round to the grid (4dp → 10 m, 3dp → 100 m, 2dp → 1 000 m) and format with `formatLv95` (`lib/footer-format.ts:40`, U+2019 grouping). A deterministic function of the shown value can never reveal more than it. Only `country === 'CH'` (`data/schemas/photo.ts:163` `Country = z.enum(['AT', 'CH', 'DE', 'FR', 'IT', 'LI', 'MC', 'SI'])` [VERIFIED: read]) gets the line; today all seven Zermatt photos are CH and the film scan is approximate (`LV95 ≈ …`). `PhotoView` has no `country` today: add it (or the finished line) to `StripFields` in `buildPhotoViews`.

### Pitfall 5: Footer string lives in client chunks
**What goes wrong:** `app/global-error.tsx` (client) imports `SiteChrome` → `SiteFooter` → `SheetLegend` → `data/site.ts`; `site` is also imported by `PhotoViewer` for `site.name`. The 600-char credit therefore ships in three client chunks [VERIFIED: grep]. 
**Opportunity:** when the footer drops the full string (D-16), move it out of `site` into a server-only module (e.g. `data/sources.ts`, added to `SERVER_ONLY_MODULES`) and keep it byte-identical (UI-SPEC backstop E9 string-equality test). Expect roughly −1.8 KB of client JS. Rewrite (not delete) `components/site/__tests__/SiteFooter.test.tsx:116-121` and `e2e/shell.spec.ts:629` ("every route credits the source with site.attribution.terrain") to the new short credit + `/sources` link.

### Pitfall 6: Web Share consumes user activation
**What goes wrong:** the Web Share spec: "If |global| does not have transient activation, return a promise rejected with a "NotAllowedError"" then "Consume user activation of |global|" [CITED: w3c.github.io/web-share share() steps 6-7]. A copy fallback after a rejected share may then fail in Firefox/Safari, which require `writeText` "within user gesture event handlers" [VERIFIED: @mdn/browser-compat-data 8.1.10 api.Clipboard.writeText notes].
**How to avoid:** call `navigator.share` synchronously first thing in the click handler (no `await` before it); treat `AbortError` as silent; on other rejections try copy, and let its failure show the selected-URL path (Contract 4). Concurrent shares reject with `InvalidStateError` (spec step 5): ignore repeated presses while a share is pending.

### Pitfall 7: Share mode in tests and baselines
**What goes wrong:** support differs by engine. BCD: share is Chrome desktop 128+ (earlier only ChromeOS/Windows), Edge 93+, Safari 12.1+, iOS 12.2+, Chrome Android 61+; Firefox desktop only behind `dom.webshare.enabled` [VERIFIED: BCD 8.1.10]. Playwright probe on this machine: headless Chromium 158 and Firefox 159 both report `typeof navigator.share === 'undefined'`, `clipboard.writeText` is a function [VERIFIED: probe]. Linux CI and WebKit not probed [ASSUMED copy mode in CI Chromium].
**How to avoid:** in the visual spec force copy mode deterministically (`addInitScript` that deletes `Navigator.prototype.share`/`canShare`) so baselines never depend on the engine build; in functional e2e stub `navigator.share` to test share mode and wrap `navigator.clipboard.writeText` to record/reject (Playwright grants clipboard permissions only in Chromium, `e2e/contact-form.spec.ts:302`).

### Pitfall 8: Retiring `photoViews` changes data-driven test selectors
**What goes wrong:** `e2e/visual/routes.spec.ts:28` picks the photo shot with `buildPhotoViews().find((view) => view.approximate)`. Today the default input is the four-photo light table, so it finds the film scan. Four non-Zermatt photos are also `approximate: true` [VERIFIED: generated photos: Saalfelden ×2 (aerial) and Ortler ×2 at 3dp, `"approximate": true`], and the published set is in ascending altitude, where Saalfelden's aerial ground heights (820–880 m, 17 copy) come first. If the default input becomes the published set, the `photo/*` baseline silently moves to a Saalfelden photo.
**How to avoid:** select by `medium === 'film-scan'` (or from `regionPhotoViews('zermatt')`), assert exactly one match. Same audit for `e2e/helpers/photo-fixtures.ts`, `e2e/not-found.spec.ts`, `e2e/photos-region.spec.ts`, `lib/__tests__/proxy.test.ts` (imports `photoSlugs`) and the other importers listed by `git grep photoViews|photoSlugs|viewerPhotos|lightTableIds`.

### Pitfall 9: Plate badges that are close but not identical
Sweep of generated plate uv (this session): Zermatt `img-0680`/`img-0682` coincide (expected); Zermatt `img-0605`/`img-0629` are 22–26 px apart at 320–375 px (closer than 24 + 8); **Saalfelden's two aerial photos are 3–6 px apart at every width** — the UI-SPEC only names the Zermatt pair. The plate layout must displace any pair closer than one badge plus gap, not only exact duplicates.

### Pitfall 10: Sticky rail broken by an overflow ancestor
A full-bleed band with `overflow-hidden` (to hide `-mx` bleed) disables `position: sticky` for the rail. Use `overflow-x: clip` or no overflow.

### Pitfall 11: GUARD-03 and "rewrite, never delete"
Retiring the grid, carousel and switcher removes many Jest and e2e tests. The ratchet compares totals against `"total": 2243`; there is headroom, but PHOTO-06 still requires a mapped replacement for each retired view test. Keep a retire→replacement table in the plan (see Test rewrite map). `.skip/.only/.fixme` are rejected by the scan.

### Pitfall 12: `json-ld.test.ts` has more than two "no BreadcrumbList" assertions
Lines 47 (doc comment), 813-820, 824-825 ("never builds a BreadcrumbList (it waits for Phase 18)") and 843 [VERIFIED: grep]. All need rewriting to positive assertions (names/order equal the rendered `nav`).

### Pitfall 13: Stale `/photos` description
`app/(site)/photos/page.tsx` metadata description reads "Landscape photographs from around Zermatt, each placed on the terrain where Tim took it." [VERIFIED: read] — wrong for three regions. Route it to Tim's D-20 copy checkpoint.

## Licences and credit by link (D-16 / D-17 research item)

| Source | Requirement text | Link credit OK? | Tag |
|--------|------------------|-----------------|-----|
| CC BY 4.0 (BEV ALS DTM; TINITALY, geoland.at, Bavaria fill data) | §3(a)(2): "You may satisfy the conditions in Section 3(a)(1) in any reasonable manner based on the medium, means, and context in which You Share the Licensed Material", e.g. "a URI or hyperlink" to a resource that includes the required information | **Yes, explicitly** | [CITED: creativecommons.org/licenses/by/4.0/legalcode.en] |
| Copernicus WorldDEM™-90 (overview) | Art. 6(b): "Where the Copernicus WorldDEM™-90 data have been adapted or modified, the User shall provide the following notice: …"; 6(c): the liability sentence "shall be added by such Users in a licence or any legal warning or notice covering their distribution or communication to the General Public"; 6(d): no implied endorsement | **No placement rule stated.** `/sources` is a reasonable "legal … notice" for 6(c); whether a linked notice "provides" 6(b) is interpretation | [CITED: licence PDF text, "Licence for COP-DEM-GLO-90-F Global 90m Full, Free & Open", Art. 6] + [ASSUMED interpretation] |
| swisstopo OGD (swissALTIRegio) | "A reference to the source is mandatory"; one of the listed references "must be attached in any case" to representations and publications; swissALTIRegio uses its own dataset-specific reference | **Not stated either way** (no mention of links or placement) | [CITED: swisstopo.admin.ch terms-of-use-free-geodata-and-geoservices] + [ASSUMED] |
| dl-de/by-2-0 (LGL BW fill data) | Source note must contain the provider name, "dl-de/by-2-0" "mit Verweis auf den Lizenztext", and "einen Verweis auf den Datensatz (URI)"; changes marked | No placement rule; the note itself contains links | [CITED: govdata.de/dl-de/by-2-0] |
| Etalab Licence Ouverte 2.0 (IGN RGEAlti fill data) | "the Reuser may satisfy this condition by pointing, via a hypertext link, to the source of the Information" | **Yes, explicitly** | [CITED: Licence Ouverte 2.0 PDF text] |

**Finding for D-17's fallback:** no licence was found that requires its full notice at the map itself, so the fallback is not triggered by the licence text. The cautious reading for GLO-90 (verbatim notice in the overview margin, ~190 characters, liability sentence on `/sources`) remains available. This is a legal-interpretation call: present both at the D-20 copy checkpoint as a two-row option table and let Tim decide. The GLO-90 text in the licence matches `GLO90_NOTICE` / `GLO90_LIABILITY` in `data/schemas/overview.ts:30-39` word for word [VERIFIED: read both].

## Extent lines (D-19)

| Sheet | Source of corners | Method |
|-------|-------------------|--------|
| Matterhorn | `plates.matterhorn.extent.lv95` `{ west: 2616000, south: 1088000, east: 2627000, north: 1099000 }` [VERIFIED: data/generated/plates.ts] | unchanged `formatExtentLines` |
| Ortler | `plates.ortler.extent.lv95` `{ west: 2834000, south: 1150000, east: 2846000, north: 1162000 }` [VERIFIED] | `lv95ToWgs84` on SW and NE at runtime (pure, server) → `formatCoordinates` 4dp |
| Saalfelden | `plates.saalfelden.extent.laea` `{ west: 4529000, south: 2701000, east: 4541000, north: 2713000 }`, `"crs": "EPSG:3035"` [VERIFIED] | emit WGS84 SW/NE in `build-terrain.mjs` with proj4 into the generated plate data (regenerates `plates.ts`; `data:check` must stay green) |
| Overview | `overview.projection` lon 5–17, lat 43–49 [VERIFIED] | whole degrees |

## Code Examples

### LV95 line from the shown WGS84
```ts
// Pure; lives server-side (view-model). Uses only existing helpers.
import { wgs84ToLv95 } from '@/lib/geo';
import { formatLv95 } from '@/lib/footer-format';
import { roundedCoordinate, type CoordinatePrecision } from '@/lib/home-format';

const GRID_M: Record<CoordinatePrecision, number> = { '4dp': 10, '3dp': 100, '2dp': 1000 };

export function lv95Line(p: { lat: number; lon: number; precision: CoordinatePrecision; approximate: boolean }): string {
  const lat = Number(roundedCoordinate(p.lat, p.precision)); // the digits the page shows
  const lon = Number(roundedCoordinate(p.lon, p.precision));
  const { e, n } = wgs84ToLv95({ lat, lon });
  const g = GRID_M[p.precision];
  const snap = (m: number) => Math.round(m / g) * g;
  return `LV95 ${p.approximate ? '≈ ' : ''}E ${formatLv95(snap(e))} N ${formatLv95(snap(n))}`;
}
```
Test with placeholder coordinates in fixtures only; never commit a real photo's finer value.

### Proxy legacy-view branch
```ts
// proxy.ts, before missedSection(); LEGACY_VIEW_REGION from lib/photos/region-ids.ts
const LEGACY_VIEWS = new Set(['grid', 'carousel']);
function legacyViewRedirect(url: URL): URL | null {
  if (url.pathname !== '/photos') return null;
  const views = url.searchParams.getAll('view');
  if (views.length !== 1 || !LEGACY_VIEWS.has(views[0])) return null;
  return new URL(regionHref(LEGACY_VIEW_REGION), url); // query dropped
}
// in proxy(): const to = legacyViewRedirect(request.nextUrl); if (to) return NextResponse.redirect(to, 308);
```

### Neighbour preload in the format the stage actually used (13 #33)
```ts
// StagePhoto's onLargeLoad hands back the loaded <img>; its currentSrc reveals the chosen <source>.
function preloadStage(view: PhotoView, sizes: string, avif: boolean): void {
  const img = new Image();
  img.fetchPriority = 'low';
  img.decoding = 'async';
  img.sizes = sizes;
  img.srcset = avif ? view.stage.srcSetAvif : view.stage.srcSetWebp;
  img.src = view.stage.src;
}
// avif = loadedImg.currentSrc.endsWith('.avif')
```
Today: `img.srcset = view.stage.srcSetAvif;` unconditionally [VERIFIED: PhotoViewer.tsx:187-194].

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `navigator.share` desktop Chrome only on Windows/ChromeOS | Chrome desktop 128+ (BCD lists no platform note from 128) | Chrome 128 | Tim's Windows Chrome/Edge show share mode; Playwright headless shell does not |
| Next "middleware" | `proxy.ts` | Next 16 | Use `proxy` names and docs |
| Global smooth `scroll-behavior` neutralised by Next on route change | No longer overridden in Next 16 | Next 16 upgrade guide | Supports UI-SPEC P2 "instant jumps" |

**Deprecated/outdated in this repo after the phase:** `ViewSwitcher`, `JustifiedGrid`, `CarouselView`, `CarouselControls`, `CarouselStepper`, `PhotoCarousel3D`, `TileTransition` (its naming rule moves to sequence figures), `parseView`'s render role, `lightTableIds`, `photoViews`/`photoSlugs`, `LIGHT_TABLE_REGION`, the `photos-view` CSS block (`app/globals.css:443-448`), `GalleryGrid.test.tsx` row-height guard (13 #37: retire with the grid; no breakpoint row heights remain in the new layout).

**14 IN-04:** after `CarouselControls.tsx` retires, `DemoTerminal.tsx`'s `STEP` is the only copy of that string (`PhotoViewer`'s `STEP_BUTTON` is a different string: `hover:border-ink-muted`, gallery surface) [VERIFIED: both read]. Resolution = update the `DemoTerminal.tsx:43-46` comment that names `CarouselControls`; no shared module needed.

## Test rewrite map (PHOTO-06, D-22, 13 #37/#38)

| Retiring test | Replacement |
|---------------|-------------|
| `e2e/photos.spec.ts` Map view (waypoints, plates at widths) | Overview: one marker per region, numbered west→east, list order, Tab reaches rows in order, boxes/gaps at 375/768/1024/1440 |
| `photos.spec.ts` `?view=carousel`/`?view=grid and ?view=xyz` | Redirect matrix: `grid`/`carousel` → 308 to `/photos/regions/zermatt` (no query); `map`, `xyz`, repeated, `GRID` → 200 overview |
| `photos.spec.ts` Grid view + `GalleryGrid.test.tsx` | Sequence: ascending order, uncropped ratio ±1 %, captions always visible, `sizes`/`currentSrc` check; row-height guard retired (#37) |
| View switcher tests (`photos.spec.ts`, `view-switcher.test.tsx`, `photos-view-param.test.ts`) | Proxy unit tests for the legacy branch; overview has no switcher (absence + redirect tests) |
| `photos-carousel.spec.ts` (10 tests, fixed 3–6 s sleeps) | Region stepping + end card (counter `End`, Next disabled, focus return), keyboard/swipe |
| `photos-sweep.spec.ts` `switchTo` 600 ms sleep (#38) | Overview → region → lightbox → close sweep waiting on positive signals: URL, dialog count, `data-rail-current`, `waitForViewTransitionsSettled` (`e2e/helpers/view-transitions.ts:98`) |
| `photos-lightbox.spec.ts` entries via `/photos?view=grid` (9 `goto`s) | Open from the region page sequence; LBOX-08 geometry kept |
| Visual `photos-grid`, `photos-carousel`, `lightbox` (from grid) | 15 region viewport shots (D-21), lightbox opened from the Zermatt sequence |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Turbopack hashes the OG route over transitive content, explaining the moved `?hash` | Pitfall 1 | Diagnosis path differs; bisect still finds it |
| A2 | Linux CI Chromium and Playwright WebKit lack `navigator.share` (copy mode) | Pitfall 7 | Baselines show share mode; mitigated by forcing copy mode in the visual spec |
| A3 | WebKit honours `min()`/`calc()`/`svh` in `sizes` like Chromium/Firefox | sizes | Over/under-fetch in Safari; caught by the CI `currentSrc` e2e |
| A4 | A linked `/sources` entry satisfies GLO-90 Art. 6(b) and swisstopo's "attached" source reference | Licences | Footer/margins need full text (D-16/D-17 fallback); Tim decides at D-20 |
| A5 | `:has()` is supported in all CI engines' current versions | Alternatives | Sync highlight missing (accepted degradation) |
| A6 | Candidate-search layout with backtracking resolves Grossglockner at S 589–660 | Pattern 2 | A summit label must be dropped on that range (needs Tim's OK) |
| A7 | E2E legs grow by ≤ ~3 min (retired carousel sleeps offset new region/overview tests) | Environment / D-26 | If a leg nears 45 min, shard before adding more |

## Open Questions (RESOLVED)

Resolved for planning: question 4 is decided in a plan; questions 1, 2, 3 and 5 are routed to the blocking Tim checkpoint that owns each. No answer of Tim's is recorded here; each checkpoint records his literal reply in its own SUMMARY.

1. **Re-pin or restore the v2.0 OG hash?** Known: hash moved in the 17 review-fix range. Unclear: which commit and whether restorable. Recommendation: Wave 0 bisect, then Tim decides. — **RESOLVED (routed):** 18-01 Task 1 bisects and checks the old query URL; 18-01 Task 2 (`checkpoint:decision`, blocking) asks Tim; 18-01 Task 3 applies his option, and the later plans that touch the og pin (18-26, 18-29) follow it.
2. **GLO-90 notice in the overview margin or on `/sources` only?** Licence sets no placement. Recommendation: offer both at the D-20 checkpoint. — **RESOLVED (routed):** 18-03 Task 2 (`checkpoint:decision`, blocking: the one D-20 copy checkpoint) offers both placements; 18-11 and 18-23 apply the placement recorded in 18-03's SUMMARY.
3. **Summit labels that cannot be placed:** omit per width range (margin names them) vs. shrink plates. Recommendation: try backtracking first; ask only if the sweep still fails. — **RESOLVED (routed):** 18-13 Task 1 sweeps with backtracking and pins any remaining gap in `UNPLACED_SUMMIT_LABELS`; 18-13 Task 2 (`checkpoint:decision`, blocking, runs only if a gap remains) asks Tim; 18-13 Task 3 implements his rule.
4. **`/sources` in the saved-pages catalog (discretion):** recommend yes — the catalog "mirrors the sitemap's order" (`lib/saved-pages.ts` header) and `/sources` joins the sitemap; it is one more nav-like row. — **RESOLVED (decided in plan):** yes; 18-02 Task 2 adds `/sources` to the saved-pages catalog after the projects, in the sitemap's place.
5. **Defaults P1–P7** remain open for plan review (UI-SPEC). — **RESOLVED (routed):** 18-01 Task 2 (`checkpoint:decision`, blocking) asks Tim to confirm or change P1–P7; the plans that implement them (18-06, 18-08, 18-10, 18-11, 18-12, 18-13, 18-16, 18-19, 18-23) read his reply from 18-01's SUMMARY.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build, scripts | ✓ | v26.13.1 locally (`engines` 24.x; CI uses 24) | — |
| npm (bundled) | none planned | ✓ | 11.6.1 on PATH (global shadow, see memory) | bundled `npm-cli.js` |
| gh CLI | CI reads, dispatches (D-23) | ✓ | 2.105.0 | — |
| Playwright Chromium / Firefox | local e2e | ✓ | 158.0.8127.18 / 159.0 | — |
| Playwright WebKit | local e2e | ✗ (not installed) | — | CI WebKit leg |
| Python | ui-ux-pro-max searches | ✓ | 3.12.12 | Quick Reference only |
| proj4 | Saalfelden WGS84 extent at build | ✓ | 2.22.0 | — |

**Missing dependencies with no fallback:** none. **With fallback:** WebKit (CI only).

**E2E duration (D-26):** legs are 12–16 min green (20.7 min on the red WebKit leg with retries). Phase 18 removes the slowest photo tests (carousel spec with 3–6 s sleeps, switcher sweeps) and adds overview/region/share/redirect/sources tests plus one audit template (`/sources`, 3 engines × 3 widths). Estimate +0–3 min per leg → ≤ ~20 min, far under 45: no shard needed; record per-leg durations on every `ci/18-*` run. Visual Regression: 49 → ~61 PNGs (−6 grid/carousel, +3 `/sources`, +15 region shots), ×2 projects ≈ 122 comparisons, est. 5–6 min.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.5.2 (`next/jest`, jsdom default, `@jest-environment node` per file) + Playwright 1.65.0 (chromium, firefox, webkit in CI; visual-dark/visual-light; perf on demand) |
| Config file | `jest.config.js`, `playwright.config.ts`, `tsconfig.jest.json`, `tsconfig.e2e.json` |
| Quick run command | `npx jest <touched test paths>` + `npm run type-check` |
| Full suite command | `npm run type-check && npm test && npm run lint`, then `PW_PROD=1 npx playwright test <specs> --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REGION-01 | Overview layout invariants S 312–1100; region/summit count guards; outline per region | unit (sweep) | `npx jest lib/__tests__/overview-layout.test.ts` | ❌ Wave 0 |
| REGION-01 | One marker per region numbered west→east; list = keyboard path; no overlap at 375/768/1024/1440; markers `tabIndex=-1` | e2e | `PW_PROD=1 npx playwright test e2e/photos.spec.ts --project=chromium --project=firefox; s=$?; git restore public/service-worker.js; exit $s` | ✅ rewrite |
| REGION-01 | West→east order from outlines | unit | `npx jest lib/__tests__/regions.test.ts` | ✅ extend |
| REGION-02 | Header, facts, plate, key list, next-region wrap (D-11), breadcrumb = JSON-LD | unit + e2e | `npx jest lib/__tests__/json-ld.test.ts lib/__tests__/plate-layout.test.ts` + `… e2e/photos-region.spec.ts …` | ✅ / ❌ plate-layout |
| REGION-03 | Ascending order, uncropped ±1 %, captions visible, `currentSrc` vs rendered width | e2e + unit | `… e2e/photos-region.spec.ts …`; `npx jest lib/__tests__/image-sizes.test.ts` | ✅ extend / ❌ |
| REGION-04 | Neatline/ticks outside image, no overlap, 375 no horizontal scroll | e2e | `… e2e/photos-region.spec.ts …` | ✅ extend |
| REGION-05 | Rail `data-rail-current` follows centred figure ≥768; hidden <768 with `n / N` captions; >16 photos guard | e2e + unit | `… e2e/photos-region.spec.ts …`; `npx jest lib/__tests__/region-rail.test.ts` | ❌ |
| REGION-06 | Margins non-empty and mapped to anchors; `/sources` verbatim string equality; footer short credit + link on every route | unit + e2e | `npx jest components/site/__tests__/SiteFooter.test.tsx data/__tests__/sources.test.ts`; `… e2e/shell.spec.ts e2e/seo.spec.ts e2e/audit.spec.ts …` | ✅ rewrite / ❌ |
| PHOTO-06 | `?view=` redirect matrix (308, no query) | unit + e2e | `npx jest lib/__tests__/proxy.test.ts`; `… e2e/photos.spec.ts …` | ✅ extend |
| PHOTO-06 | No switcher; view tests rewritten (map table above) | e2e | `… e2e/photos-sweep.spec.ts …` | ✅ rewrite |
| PHOTO-07 | Copy mode default; share mode with stubbed API; AbortError silent; copy failure selects URL; label/aria names | unit (RTL) + e2e | `npx jest components/photos/__tests__/share-button.test.tsx`; `… e2e/photos-lightbox.spec.ts …` | ❌ |
| PHOTO-08 | LV95 only for CH, grid by precision, `≈` when approximate, derived from shown WGS84 | unit | `npx jest lib/__tests__/photos-view-model.test.ts components/photos/__tests__/strip.test.tsx` | ✅ extend |
| LBOX-09 | Region stepping, end card (`End`, Next disabled, URL/title on last photo), focus return (LBOX-08), neighbour preload format, stage sizes | unit + e2e | `npx jest components/photos/__tests__/photo-viewer.test.tsx lib/__tests__/photos-stepping.test.ts lib/__tests__/lightbox-tiers.test.ts`; `… e2e/photos-lightbox.spec.ts …` | ✅ extend |
| all | No unexpected pixel change; declared sets only | visual + guard | CI Visual Regression; `node scripts/ci/check-snapshot-commit.mjs --none` (or `--allow <slug>` on Tim's PNG commits) | ✅ |
| all | Client JS ≤ 1,855,841 B; registry/overview/sources strings absent from chunks | build | `rm -rf .next/static && npm run build`, byte-sum `.next/static/chunks/**/*.js`, `grep -rl` checks; `git restore public/service-worker.js` | scripted |
| all | Client graph keeps server-only modules out | unit | `npx jest lib/__tests__/client-graph.test.ts` | ✅ extend |

### Sampling Rate
- **Per task commit:** touched Jest paths + `npm run type-check` + `node scripts/ci/check-snapshot-commit.mjs --none`
- **Per wave merge:** `npm test && npm run lint` (includes guards and `data:check`) + local production Playwright on touched specs (Chromium, Firefox)
- **Phase gate:** full suite green; `ci/18-*` push green incl. Visual Regression; per-leg E2E durations recorded; client JS within cap; declared baseline rounds closed with Tim's PNG commits; HOME-08 perf dispatch re-run after the last shared-chunk change (D-24)

### Wave 0 Gaps
- [ ] Resolve the inherited `og.spec.ts` pin failure and classify the WebKit B8 timeout (Pitfall 1)
- [ ] `lib/__tests__/overview-layout.test.ts` — sweep S 312–1100 + count guards (REGION-01)
- [ ] `lib/__tests__/plate-layout.test.ts` — sweep S 320–634, near-duplicate pairs incl. Saalfelden (REGION-02)
- [ ] `lib/__tests__/image-sizes.test.ts` — strings derived from tier constants (13 #34)
- [ ] `lib/__tests__/region-rail.test.ts` — tick model + >16 guard (REGION-05)
- [ ] `components/photos/__tests__/share-button.test.tsx` (PHOTO-07)
- [ ] `data/__tests__/sources.test.ts` — verbatim equality + anchors (REGION-06)
- [ ] No framework install needed

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | `?view=` whitelisted by exact single value; region ids by registry set (existing proxy pattern); no query echoed |
| V6 Cryptography | no | — |
| V14 Configuration | yes | CSP unchanged (nonce scripts, `style-src 'unsafe-inline'` already allowed for server `<style>`); Permissions-Policy does not restrict `web-share`/`clipboard-write` (`next.config.ts:90-91` `camera=(), microphone=(), geolocation=()`) |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect via `?view=` | Spoofing | Destination is a constant built with `regionHref`, never from input |
| Reflected token in 404/flight data | Info disclosure | Keep the neutral-404 path; redirect branch runs before it only for exact matches |
| JSON-LD script injection (breadcrumb names = photo titles) | Tampering | `jsonLdHtml` `<`-escaping |
| Location precision leak (LV95, plate pins, collar) | Info disclosure | Derive from shown WGS84; pins at stored (already rounded) uv; privacy guard tests |
| Share/clipboard leaking query/hash | Info disclosure | Canonical absolute URL prop only |
| External licence links | Tampering (tabnabbing) | `target="_blank"` with `rel="noopener noreferrer"` (existing fact-link pattern) |
| Server-only data in client chunks | Info disclosure | `client-graph.test.ts` lists; add `data/sources.ts` if created |

## ui-ux-pro-max notes

Searches this session (`python .claude/skills/ui-ux-pro-max/scripts/search.py`): `"scroll progress indicator sticky" --domain ux` → Progress Indicators (Medium), Smooth Scroll (High, recorded and not applied per UI-SPEC P2), Sticky Navigation (fixed nav must not obscure content → global `scroll-margin-top`); `"image lazy load sizes" --stack nextjs` → "Use next/image" and "priority for LCP" (not applied: the repo's `<picture>` derivatives; the equivalent is `loading="eager"` + `fetchPriority="high"` on the header slot only); `"intersection observer scroll" --domain react` → **no match**, retry `"scroll event listener passive"` → Effect Events guidance (use `useEffectEvent` only for non-reactive logic inside effects; matches the rail island design); `"copy link share button feedback" --domain ux` → **no verified match** (off-topic), so Share relies on FEATURES §5, MDN/BCD and the W3C spec above. Quick Reference rules applied: `image-optimization`, `content-jumping`, `lazy-load-below-fold`, `reduce-reflows`, `transform-performance`, `interruptible`, `success-feedback`, `error-recovery`, `focus-not-obscured`.

## Sources

### Primary (HIGH confidence)
- Repo files read this session: `proxy.ts`, `next.config.ts`, `app/(site)/photos/page.tsx`, `app/(site)/photos/[slug]/page.tsx`, `@modal/*`, `lib/photos/{view-model,view-param,routes,region-ids,stepping,lightbox-tiers,label-layout}.ts`, `lib/{geo,footer-format,home-format,regions,saved-pages}.ts`, `components/photos/PhotoViewer.tsx`, `components/contact/CopyEmailButton.tsx`, `public/service-worker.js`, `data/generated/{overview,plates}.ts`, `data/schemas/{overview,photo}.ts`, `data/site.ts`, `data/terrain/plates/saalfelden/source.json`, `e2e/{routes.ts,visual/routes.spec.ts,perf/home-baseline.spec.ts,photos-sweep.spec.ts,og.spec.ts}`, `playwright.config.ts`, `.github/workflows/{ci,visual-baselines}.yml`, `scripts/guards/test-count.mjs` + baseline
- Next 16.4.5 bundled docs: `02-guides/redirecting.md`, `05-config/01-next-config-js/redirects.md`, `03-file-conventions/proxy.md`; source `next-metadata-image-loader.js`, `spec-extension/response.d.ts`
- @mdn/browser-compat-data 8.1.10 (`api.Navigator.share`, `api.Navigator.canShare`, `api.Clipboard.writeText`)
- Playwright probes (Chromium 158, Firefox 159): `navigator.share` presence; `sizes` math functions and media conditions
- Production build at a857d35 (client JS total); `gh run view` for runs 45306356650 and 45445770986

### Secondary (MEDIUM confidence)
- W3C Web Share spec (share() steps 5–7, canShare steps)
- CC BY 4.0 legal code §3(a); Copernicus COP-DEM licence PDF Art. 6 (text-extracted); swisstopo OGD terms page; govdata dl-de/by-2-0; Etalab Licence Ouverte 2.0 PDF; swisstopo swissALTIRegio page
- MDN `Navigator.share`, `Clipboard.writeText`

### Tertiary (LOW confidence)
- Scratchpad geometry models of the overview layout (approximate text widths)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — nothing new; versions read from `node_modules`
- Architecture: HIGH for routing/redirect/islands (docs + code + Phase 17 spike); MEDIUM for overview layout feasibility (model, not the final function)
- Pitfalls: HIGH — each tied to a file read, a CI log or a probe
- Licences: MEDIUM — texts cited; "link is enough" for GLO-90 and swisstopo is interpretation

**Research date:** 2026-11-24
**Valid until:** 2026-12-24 (stable stack); re-check CI state before the first `ci/18-*` push
