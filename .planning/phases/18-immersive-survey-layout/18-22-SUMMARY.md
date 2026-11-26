---
phase: 18-immersive-survey-layout
plan: 22
subsystem: photos-overview
tags: [overview, region-list, proxy, redirect, photo-06, region-01, e2e, guard-03]
status: complete

requires:
  - phase: 18-03
    provides: "Tim's approved kicker wording and /photos meta description (D-20 rows 1 and 2)"
  - phase: 18-21
    provides: "region-page successors for every grid, carousel and grid-lightbox row; the keyboard row that the Map view Escape row retires onto"
provides:
  - "proxy.ts legacyViewRedirect: /photos?view=grid|carousel answer 308 to /photos/regions/zermatt (LEGACY_VIEW_REGION), no query"
  - "OverviewHeader (kicker '3 regions · 11 photographs · 2016–2026', h1 'Photographs') and RegionList (h2 'Regions', ol 'Regions, west to east', Link rows) as server components"
  - "/photos as the overview: no searchParams, no switcher, the approved description; the lg grid column the 18-23 sheet drops into"
  - "every Map, switcher and ?view= e2e row rewritten for the overview and the redirect (27 retired -> 27 successors incl. one extra redirect row; one declared allowance)"
affects: [18-23, 18-24, 18-25, 18-28, 18-29]

actuals:
  tokens: 22900    # chars/4 over git diff e1a6e39..e1907cf (91,674 chars incl. context)
  tasks: 2
  commits: 2       # git rev-list --count e1a6e39..e1907cf; the metadata commit follows
plan_head_before: e1a6e3936d89fa19e0e41f33846e8d03020f2d27
plan_head_after: e1907cfda955d92b65d551075a4f17a2fc59fb0c

tech-stack:
  added: []
  patterns:
    - "A legacy URL decision is a pure function of the URL (legacyViewRedirect(url): URL | null), called first in proxy(), with the target built from a constant"
    - "A list row's thumbnail reserves its true-ratio box on a wrapper (style aspect-ratio from the tile's width/height, bg-surface-overlay), so a failed image keeps the box"

key-files:
  created:
    - components/photos/overview/OverviewHeader.tsx
    - components/photos/overview/RegionList.tsx
    - components/photos/overview/__tests__/overview.test.tsx
  modified:
    - proxy.ts
    - lib/photos/region-ids.ts
    - lib/__tests__/proxy.test.ts
    - app/(site)/photos/page.tsx
    - e2e/photos.spec.ts
    - e2e/keyboard.spec.ts
    - e2e/photos-sweep.spec.ts
    - e2e/audit.spec.ts
    - e2e/seo.spec.ts
    - e2e/shell.spec.ts
    - components/site/SiteNav.tsx

key-decisions:
  - "Region rows are next/link Links, not plain anchors: a soft navigation with no morph (D-04), like the region page's 'All regions' and breadcrumb; the history and view-transition rows need it"
  - "Thumbnails load eager with fetchPriority low at every width (UI-SPEC deviation: an attribute cannot vary by breakpoint)"
  - "The list already sits in the lg grid's right 20rem column; the left column stays empty until 18-23 adds the sheet"
  - "FIREFOX_43967_VIEWS removed: the 'Alps overview' audit state runs on Firefox (passed), so no photo state carries @firefox-43967"
  - "REGION-01 and PHOTO-06 stay Pending: the overview map (18-23) and the module retirement (18-24, 18-25) complete them"

requirements-completed: []  # REGION-01 needs the overview sheet and pins (18-23); PHOTO-06 needs the retired modules deleted (18-24, 18-25)

metrics:
  duration: "about 25 min"
  completed: 2026-11-26
---

# Phase 18 Plan 22: Overview list and legacy ?view= redirect Summary

/photos is now the Alps overview's header band and its west-to-east region list. The proxy answers the retired `?view=grid` and `?view=carousel` URLs with a 308 to the Zermatt region page, built from a constant. Every Map view, view switcher and `?view=` e2e test has been rewritten for the overview and the redirect, and all twelve affected specs pass in Chromium and Firefox (852 of 852).

## What was built

- **Proxy branch (D-03, T-18-44, T-18-45).** `LEGACY_VIEW_REGION = 'zermatt'` lives in the proxy-only `lib/photos/region-ids.ts`. In `proxy.ts`, `LEGACY_VIEWS = {'grid','carousel'}` and `legacyViewRedirect(url)` match only when the path is `/photos` and `getAll('view')` holds exactly one value from that set, compared case-sensitively. The target is `new URL(regionHref(LEGACY_VIEW_REGION), url)`, so it carries no query and no hash. `proxy()` calls it first and returns `NextResponse.redirect(target, 308)` with no CSP (a redirect renders no document). The view model is not imported. These all render the overview with 200: `?view=map`, `xyz`, `GRID`, `Carousel`, a repeated parameter, an empty value, a padded value, and no parameter.
- **OverviewHeader** (server). The 10 band is `border-b border-line pt-8 pb-6`. The mono kicker is computed from the data: `countLabel` for regions and photographs, and `formatYearRange` over every published photo's year. It renders `3 regions · 11 photographs · 2016–2026` (Tim's approved wording, 18-03 row 1), as nowrap parts, above the h1 `Photographs`. There is no right-hand slot. Zero regions or zero photos throws a RangeError, so the build fails.
- **RegionList** (server, plain props). The h2 is `Regions`, over `<ol aria-label="Regions, west to east" class="mt-4 flex flex-col gap-2">`. Each row is a `Link` to `regionHref(id)` with `data-region-row`, `-mx-2 p-2`, `hover:bg-surface-overlay`, cursor-pointer and touch-manipulation. In the active state (hover or focus-visible) it gets the 2 px accent bar (`before:`) and an accent badge. The global focus ring marks focus.
  - Thumbnail: a 96 px `<picture>` of the cover's tile derivatives, `sizes="96px"`, `alt=""`. It sits in a wrapper that reserves its true-ratio box (`aspect-ratio` from the tile's width and height, `bg-surface-overlay`, rounded-sm).
  - Text: line 1 is the aria-hidden 24 px badge plus `regionHeading`, line 2 the mono count, line 3 the mono `{range} · {years}` as nowrap parts.
  - Zero rows throws.
- **/photos page.** It reads no `searchParams` and imports no switcher, view or view-model view. Rows come from `regionsWestToEast()` through `regionNumber`, `regionHeading`, `regionCardFacts` and `regionCover(id).tile`. The meta description is Tim's approved text: "Landscape photographs from across the Alps, each placed on the terrain where Tim took it." The content container is `pt-6 pb-12 md:pb-16` and, from lg, the grid `[minmax(0,1fr)_20rem] gap-8` with the list in column 2.
- **Jest.** Proxy: 19 new rows. They cover the 308 and the Location (exact, no `?`), dropping other parameters and the hash, keeping the request origin, the nine pass-through cases, other paths, and `LEGACY_VIEW_REGION` being in `regionRouteIds`. Overview components: 8 new rows covering the approved kicker, the singulars, the empty throws, order, hrefs, badges, the row text, the true-ratio boxes and the eager/low attributes, the ground range, and one-row and zero-row lists.

## ui-ux-pro-max (invoked before the markup)

Searches run, from the skill's `scripts/search.py`:
- `"list row hover focus state" --domain ux`. Applied: hover feedback plus cursor-pointer, and the action never depends on hover alone (the row is a link).
- `"image dimension layout shift lazy" --domain ux`. Applied: the reserved true-ratio box (Content Jumping, CLS 0). Lazy-below-the-fold is outweighed here by the recorded eager/low deviation.
- `"decorative image empty alt link name" --domain ux`. The generic result ("descriptive alt for content images") does not fit: the thumbnail duplicates the row text inside a named link, so `alt=""` follows the UI-SPEC and the accessible name stays the row text.
- `"image lazy loading fetchpriority" --stack nextjs`. It recommended next/image, but the project's convention is a raw `img` inside `picture` with content-hashed manifest derivatives (the lint exemption, as in SequenceFigure and PlateSheet), so I kept that.
- Quick Reference §1–§3 checked: focus ring, 44 px targets (rows are at least 112 px tall), touch-action manipulation, contrast with the existing ink and accent tokens, and no horizontal scroll (asserted at six widths).

## UI-SPEC deviation (recorded)

The UI-SPEC says to load thumbnails `eager` on lg, where the list is above the fold, and `lazy` below lg. They now ship with **`loading="eager"` and `fetchPriority="low"` at every width**, because an attribute cannot vary by breakpoint. Three small 96 px tiles keep the lg list complete, and the low priority keeps them behind the overview sheet (18-23) and the fonts.

## Retirement mapping (PHOTO-06; old title → final successor title)

All successors are in this plan (18-22) unless stated. "Map view" is `photos.spec › Map view (PHOTO-01, PHOTO-03, D-01..D-04)` and "View switcher" is `photos.spec › View switcher (PHOTO-02, D-14)`.

| Retired test | Successor (spec › describe › title) | Plan |
|---|---|---|
| Map view › opens on the map with four waypoint links in altitude order (PHOTO-01) | photos.spec › Regions list (REGION-01, D-02) › opens on the overview with the three region rows west to east: names, counts and hrefs | 18-22 T1 |
| Map view › ?view=carousel shows the carousel region | photos.spec › Legacy ?view= redirect (D-03, PHOTO-06) › ?view=carousel answers 308 with Location /photos/regions/zermatt and no query | 18-22 T1 |
| Map view › ?view=grid and ?view=xyz render the grid and the map | photos.spec › Legacy ?view= redirect (D-03, PHOTO-06) › ?view=grid answers 308 to /photos/regions/zermatt, and ?view=xyz renders the overview with 200 | 18-22 T1 |
| Map view › Tab reaches the four waypoint links in altitude order @needs-tab-to-links | photos.spec › Regions list › Tab reaches the three region rows in west-to-east order @needs-tab-to-links | 18-22 T2 |
| Map view › a map plate opens the lightbox | photos.spec › Regions list › a region row opens its region page | 18-22 T2 |
| Map view › Close photo closes the lightbox opened from the map | photos.spec › Regions list › from the overview, a region row and then its first figure open the lightbox, and Close photo closes it on the region page | 18-22 T2 |
| Map view › Escape closes it and focus returns to the plate | **Declared allowance (R_e2e 1):** keyboard.spec › Region page and lightbox by keyboard (1440) › Enter on a figure link opens the lightbox on Close photo; Tab stays inside; arrows step; Escape returns focus | **18-21** |
| Map view › opening from the map is a plain enter: no photo-* pseudo-element @chromium-only | photos.spec › Regions list › opening a region from the overview is a plain navigation: no photo-* pseudo-element @chromium-only | 18-22 T2 |
| Map view › the Riffelsee dot is dashed and the summit is not a link | photos.spec › Regions list › the approximate photo's badge on the Zermatt plate is dashed | 18-22 T2 |
| Map view › at {360,375,412,768,1024,1440} x 900 the plates keep their boxes, gaps and dots (6) | photos.spec › Regions list › at {360,375,412,768,1024,1440} x 900 each region row's thumbnail keeps its true ratio and the list has no horizontal overflow (6) | 18-22 T2 |
| Map view › at {360,375,412,768,1024,1440} x 900 every plate's title and altitude fit inside the plate (6) | photos.spec › Regions list › at {360,375,412,768,1024,1440} x 900 no region row's text truncates (6) | 18-22 T2 |
| View switcher › opens on Map with the three segments in order | photos.spec › No view switcher (PHOTO-06, D-27) › opens on the overview with no view switcher: no radiogroup, no View group, no segment links | 18-22 T2 |
| View switcher › at 375 x 600 switching replaces the URL with no history entry, no scroll jump and focus kept | photos.spec › No view switcher › at 375 x 600 a region row adds one history entry, and Back returns to /photos with the region list in view | 18-22 T2 |
| View switcher › pressing the pressed segment changes nothing | photos.spec › No view switcher › /photos?view=map is the overview unchanged: 200, no Location, the same region rows as /photos | 18-22 T2 |
| View switcher › a reload keeps Grid, and Back from a photo returns to the grid with Grid pressed @no-win-webkit | photos.spec › No view switcher › a reload of /photos?view=grid lands on the Zermatt region page again, and Back from a photo returns to it @no-win-webkit | 18-22 T2 |
| View switcher › Tab reaches the three segments in order and Space presses one | photos.spec › No view switcher › Enter on a focused region row opens its region page @needs-tab-to-links | 18-22 T2 |
| View switcher › a switch crossfades the view region as photos-view @chromium-only | photos.spec › No view switcher › a region row navigation shows no photos-view pseudo-element @chromium-only | 18-22 T2 |
| keyboard.spec › Photo map and lightbox by keyboard (1440) › Tab reaches the view switcher, then the map targets in altitude order, then the footer | keyboard.spec › Overview by keyboard (1440) › Tab from the top of /photos reaches the region rows in order, then the footer; Enter on the Zermatt row opens its region page | 18-22 T2 |
| photos-sweep › 375 overflow › no horizontal overflow at 375 on every photo surface: the map (/photos) | photos-sweep › 375 overflow › …: the overview (/photos) (in place) | 18-22 T2 |
| photos-sweep › Served images › every image is a hashed derivative and nothing offers a download: the map (/photos) | photos-sweep › Served images › …: the overview (/photos) (in place) | 18-22 T2 |
| photos-sweep › Console › view switches and photo open/close log no removeChild or duplicate-name errors @chromium-only | photos-sweep › Console › overview, region and photo navigation log no removeChild or duplicate-name errors @chromium-only (in place) | 18-22 T2 |
| audit.spec › Audit: interactive states › state "photos Map view" /photos @375/768/1440 @firefox-43967 | audit.spec › Audit: interactive states › state "Alps overview" /photos @375/768/1440 (in place; now runs on Firefox) | 18-22 T2 |
| seo.spec › /photos?view=grid canonicalises to /photos | seo.spec › /photos?view=map canonicalises to /photos, and /photos?view=grid lands on the Zermatt region page with its own canonical (in place) | 18-22 T2 |
| shell.spec › on a view URL, Photographs still navigates to the plain page (D-23) | shell.spec › on a view URL, Photographs still navigates to the plain page (D-23), on `/photos?view=map` (in place) | 18-22 T2 |

Added with no retired predecessor: photos.spec › Legacy ?view= redirect › 'a browser on /photos?view=grid ends on the Zermatt region page' (Task 1).

**End gate (GUARD-03 per plan):**

```
jest 2782 -> 2809 (allowance 0, floor 2782)
e2e 843 -> 843 (allowance 1, floor 842)
```

`npm run guard:tests` reported `jest 2809 + e2e 843 = 3652 (baseline 3024)`, OK. At plan start the allowance check listed the declared Map view Escape row once (1 of 1) and 18-21's keyboard successor once.

**`view=grid` / `view=carousel` lines left in e2e (outside e2e/visual), all redirect rows:**
- photos.spec lines 37, 42, 46, 53, 56, 70, 71: the 'Legacy ?view= redirect' describe's doc and its three rows.
- photos.spec lines 345, 404, 408, 411: the 'No view switcher' doc and its reload-lands-on-Zermatt row.
- seo.spec lines 151, 152, 160: the canonical row's comment, title and its `?view=grid` leg.

`git grep -n -e "view=grid" -e "view=carousel" -- e2e ':!e2e/visual' ':!e2e/photos.spec.ts' ':!e2e/seo.spec.ts'` prints nothing (exit 1). `waitForTimeout(600)` is gone from photos-sweep (0). The three specs contain no `buildPhotoViews()` (0).

## Verification

- `npx jest lib/__tests__/proxy.test.ts lib/__tests__/photo-routes.test.ts`: 154 passed. The full Jest suite: 2809 of 2809.
- Task 1 production e2e (`-g "redirect|Regions"`, Chromium and Firefox): 8 passed.
- Task 2 production e2e, all twelve specs (photos, photos-region, photos-lightbox, photos-stepping, photos-sweep, keyboard, audit, no-webgl, seo, shell, design-system, not-found), Chromium and Firefox: **852 passed, 0 failed, 0 flaky** (3.6 min). After the audit, keyboard and shell edits that followed, those three specs ran again: 143 passed.
- `npm run type-check` and `npm run lint` (with `guard:tests:scan`) pass. `node scripts/ci/check-snapshot-commit.mjs --none`: OK (0 changed) after each commit.
- **Client JS:** **1,827,848 B** in 21 files. That is −23,897 B against the base of 1,851,745 and −40,302 B against 18-21's 1,868,150, so it is now **27,993 B under the cap** of 1,855,841. The new overview components are server components and add no client JS. The drop comes from /photos no longer importing ViewSwitcher, MapSheet, JustifiedGrid and CarouselView (with the 3D carousel), so their client chunks are no longer emitted. This is recorded in the scratchpad running record as `| 18-22 1,827,848`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Region rows switched from a plain `<a>` to `next/link`**
- **Found during:** Task 2, writing the history and view-transition rows.
- **Issue:** The plan's markup names `<a href={regionHref(id)}>`. A plain anchor is a full document load. That loses the soft navigation the rest of the site uses ('All regions', the breadcrumb), and it gives the "plain navigation, no morph" and Back rows nothing to measure.
- **Fix:** `Link` with the same href, `data-region-row` and classes. It renders the same server HTML `<a>`, and nothing on the overview carries a `photo-*` name, so there is no morph (asserted).
- **Files modified:** components/photos/overview/RegionList.tsx.
- **Commit:** e1907cf

**2. [Rule 2 - Missing tests] Jest rows for the overview components**
- **Found during:** Task 1.
- **Issue:** The truths UI E2/empty (zero regions fails the build), one region renders one row, the approved kicker literal, and the true-ratio boxes had no unit test.
- **Fix:** Added `components/photos/overview/__tests__/overview.test.tsx` (8 rows). The file is not in files_modified. Jest goes up, so the R_jest 0 gate is unaffected.
- **Commit:** f000008

**3. [Plan detail] audit.spec `FIREFOX_43967_VIEWS` and the `key` field removed**
- **Outcome the plan asked for:** The 'Alps overview' state ran on Firefox without the tag and passed in both browsers. No photo state still crashes with the #43967 signature, so the set and its doc block are gone. PhotoState's `key` field was only that set's lookup key, so it went too (lint flagged it as unused). The contact rows keep their own `@firefox-43967` tags.
- **Commit:** e1907cf

**4. [Formatting scope] Prettier was not run on keyboard.spec, shell.spec or SiteNav**
- Those three files are not Prettier-formatted at HEAD. Running Prettier reflowed unrelated lines, so they were restored and only the planned lines were edited (SiteNav: one comment line, no code change).

## Tags and flakes

- New `@no-win-webkit` row: 'a reload of /photos?view=grid lands on the Zermatt region page again, and Back from a photo returns to it'. It carries the same reason as its predecessor (history Back while the open's View Transition settles crashes WinCairo). It has not been probed on Windows WebKit in this plan: local runs are Chromium and Firefox only.
- `@needs-tab-to-links` stays on the two keyboard rows that Tab to links.
- No known local flake (the Firefox /offline axe crash or the WinCairo crashes) was hit. Nothing was weakened.

## Known Stubs

None. Until 18-23 adds the overview sheet, the lg left column is intentionally empty. This is the planned two-plan split (UI-SPEC Contract 1 layout), not a stub with a data gap.

## Threat Flags

None beyond the plan's register. T-18-44 and T-18-45 are mitigated: the target comes from a constant and is built fresh, with an exact single-value match, and Jest plus e2e assert no `?` in Location.

## Baselines for 18-28

- `photos/*`: /photos is now the header and region list instead of the map sheet. 18-23 adds the sheet, so re-baseline after it.
- `photos-grid/*` and `photos-carousel/*`: routes.spec still shoots `/photos?view=grid` and `?view=carousel`, which now follow the 308 to the Zermatt region page. These entries are for removal, as the visual README says.

## Self-Check: PASSED

- FOUND: components/photos/overview/OverviewHeader.tsx, components/photos/overview/RegionList.tsx, components/photos/overview/__tests__/overview.test.tsx, proxy.ts, lib/photos/region-ids.ts
- FOUND: f000008, e1907cf (ancestors of HEAD)
