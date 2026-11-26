---
phase: 18-immersive-survey-layout
plan: 24
subsystem: photos-retirement
tags: [photo-06, retirement, view-switcher, grid, justify, guard-03, tests]
status: complete

requires:
  - phase: 18-22
    provides: "/photos overview (OverviewHeader, RegionList) with no importer of the switch or grid; proxy legacy ?view= redirect rows (the R_jest 16 successors)"
  - phase: 18-23
    provides: "OverviewSheet on /photos (h2 'Map' before h2 'Regions')"
  - phase: 18-08
    provides: "SequenceFigure, FigureTransition and figureSizes"
provides:
  - "ViewSwitcher, PhotosHeader, lib/photos/view-param.ts, JustifiedGrid, TileTransition and lib/photos/justify.ts deleted with no remaining importer"
  - "The photos-view view-transition block removed from app/globals.css"
  - "components/photos/__tests__/overview.test.tsx: 14 successor rows for the switcher and header tests"
  - "components/photos/__tests__/sequence-figure.test.tsx: 34 successor rows for the grid and justify tests plus a no-Position collar row, with a figureSizes viewport evaluator"
  - "13 #37 (GalleryGrid row-height drift guard) retired with the grid"
affects: [18-25, 18-27, 18-28, 18-29]

actuals:
  tokens: 19750    # chars/4 over git diff 03c4b87..e5884ff (78,994 chars incl. context)
  tasks: 2
  commits: 2       # measured: git rev-list --count 03c4b87..HEAD; the metadata commit follows
plan_head_before: 03c4b8703e7d93d2cf82fa66fbdd460ada3c1a5c
plan_head_after: e5884ffd27b9a7ad9f9715956ab4e8d3d70460a5

tech-stack:
  added: []
  patterns:
    - "Retired-test successors assert the replacement's behaviour in the retired test's place (one row each, none merged), and never repeat an assertion an existing contract file already makes"
    - "sizes rows evaluate the rendered figure's `sizes` at a viewport (top-level comma split, min-width selection, px/vw/vh/calc/min/max) against a width modelled independently from the page layout"

key-files:
  created:
    - components/photos/__tests__/overview.test.tsx
    - components/photos/__tests__/sequence-figure.test.tsx
  modified:
    - app/globals.css
    - data/sheet.ts
    - components/photos/PhotoViewer.tsx
    - components/photos/region/FactsLine.tsx
    - components/photos/region/RegionHeader.tsx
    - proxy.ts
  deleted:
    - components/photos/ViewSwitcher.tsx
    - components/photos/PhotosHeader.tsx
    - lib/photos/view-param.ts
    - components/photos/__tests__/view-switcher.test.tsx
    - components/photos/__tests__/header.test.tsx
    - lib/__tests__/photos-view-param.test.ts
    - components/photos/JustifiedGrid.tsx
    - components/photos/TileTransition.tsx
    - lib/photos/justify.ts
    - components/__tests__/GalleryGrid.test.tsx
    - lib/__tests__/photos-justify.test.ts

key-decisions:
  - "18-24: the switcher/header successors live at the plan's path components/photos/__tests__/overview.test.tsx (14 new rows), beside 18-22's components/photos/overview/__tests__/overview.test.tsx (8 contract rows, untouched); no assertion is repeated between them"
  - "18-24: the grid/justify successors live at components/photos/__tests__/sequence-figure.test.tsx (34 rows + 1), beside 18-08's region/__tests__/SequenceFigure.test.tsx (untouched); the justify row-height rows became figure-width and sizes rows evaluated at real viewports"
  - "18-24: sheetPlace removed from data/sheet.ts with its only consumer (PhotosHeader); sheet.title stays for the footer, sheet margins, OG cards and MapSheet"
  - "18-24: 13 #37 (GalleryGrid row-height drift guard) retired with the grid; the sequence has no breakpoint row heights"

requirements-completed: []  # PHOTO-06 also needs the carousel family retired (18-25) and is claimed by 18-26..18-29; REQUIREMENTS.md keeps it Pending (18-22 convention)

coverage:
  - id: D1
    description: "Switcher, header and view parameter deleted with no importer; photos-view CSS removed; no client chunk carries photos-view or a switcher label"
    requirement: PHOTO-06
    verification:
      - kind: unit
        ref: "components/photos/__tests__/overview.test.tsx#/photos in place of the view switcher (successors of view-switcher.test.tsx)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/proxy.test.ts#proxy(): legacy ?view= redirect (18 D-03, PHOTO-06; T-18-44, T-18-45)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Grid, TileTransition and justify deleted with no importer; each retired grid/justify test has a sequence-figure successor"
    requirement: PHOTO-06
    verification:
      - kind: unit
        ref: "components/photos/__tests__/sequence-figure.test.tsx"
        status: pass
    human_judgment: false

metrics:
  duration: "~15 min"
  completed: 2026-11-26
---

# Phase 18 Plan 24: Retire the view switch and the grid Summary

The v2.0 view switch (ViewSwitcher, PhotosHeader, `lib/photos/view-param.ts`, the `photos-view` crossfade) and the grid (JustifiedGrid, TileTransition, `lib/photos/justify.ts`) are deleted. Every one of their 48 non-allowance Jest tests has its own successor row on the overview or the sequence figure, and the 16 view-parameter tests map onto 18-22's proxy redirect rows.

## Commits

| Task | Commit | Summary |
|---|---|---|
| 1 | 11b0a99 | feat: retire the switcher, PhotosHeader, the view parameter and the photos-view crossfade; 14 overview successor rows |
| 2 | e5884ff | refactor: retire JustifiedGrid, TileTransition and justify.ts; 34 (+1) sequence-figure successor rows; PhotoViewer comments name FigureTransition |

## Deleted files

Modules: `components/photos/ViewSwitcher.tsx`, `components/photos/PhotosHeader.tsx`, `lib/photos/view-param.ts`, `components/photos/JustifiedGrid.tsx`, `components/photos/TileTransition.tsx`, `lib/photos/justify.ts`.
Tests: `components/photos/__tests__/view-switcher.test.tsx` (7), `components/photos/__tests__/header.test.tsx` (7), `lib/__tests__/photos-view-param.test.ts` (16), `components/__tests__/GalleryGrid.test.tsx` (14), `lib/__tests__/photos-justify.test.ts` (20).

Before each deletion, `git grep` over the whole repo (app, components, lib, e2e, scripts, proxy.ts, CSS) found only the modules themselves, their own tests, and comments. 18-22 had already removed every `app/` importer, so `/photos` no longer reached them. The comments were reworded: PhotoViewer x2 (TileTransition → FigureTransition), FactsLine and RegionHeader (PhotosHeader), proxy.ts (parseView), and the globals.css lightbox note ("grid open" → "figure open"). Afterwards both plan greps (`ViewSwitcher|PhotosHeader|parseView|VIEW_LABELS` and `JustifiedGrid|TileTransition|lib/photos/justify|justifyTile` over app, components, lib and e2e) exit 1. A whole-repo grep outside `.planning` also finds none.

## Path drift: how it was resolved

18-22 had already created `components/photos/overview/__tests__/overview.test.tsx`, with 8 contract rows: the literal approved kicker, singular wording, zero-region and zero-photo throws, list order and hrefs, row text, thumbnails, the aerial range, and the one-row list. 18-23 added `overview-sheet.test.tsx`. None of those rows is a successor to a switcher or header test: they pin the overview's own contract. So I created the plan's path, `components/photos/__tests__/overview.test.tsx`, which keeps the must_haves artifact and the key link. It holds 14 new rows that render the real `/photos` page, RegionList and OverviewHeader. Each row asserts something the existing file does not: no View group, radiogroup or segment; no pressed or current state; the row hover/focus look; the badge before the name; server-only modules; regionHref with no query; no button; sheet.title with no place in the kicker; the kicker derived from data; an unsorted year range; the h1 and h2 outline; a non-sticky band with one paragraph; a band with only P and H1; row counts summing to the photo count.

SequenceFigure had the same drift. 18-08's `components/photos/region/__tests__/SequenceFigure.test.tsx` already pins the per-view contract in one it.each over all 11 views: collar, ticks, link name, lazy/decoding/alt/width/height, object-contain, sizes, caption text, film/EXIF. The new `components/photos/__tests__/sequence-figure.test.tsx` repeats none of those assertions. Its 35 rows cover cross-region coverage, literal captions, srcset order and hashing, nowrap parts, list names and order, unique ids, the ratio box, no row heights, the width class, RangeErrors, and `sizes` evaluated at real viewports. The 35th row is a no-Position collar case, which the existing file never exercises because every published view has a Position.

## Retired test → successor mapping (all 64)

### view-switcher.test.tsx (7) → components/photos/__tests__/overview.test.tsx (18-24)

| Retired test | Successor row |
|---|---|
| is a group named 'View' with Map, Grid and Carousel in that order | renders no 'View' group, radiogroup or Map, Grid or Carousel segment: the regions are one ordered list |
| with view 'grid' only Grid is pressed | carries no pressed or current state: nothing on the page has aria-pressed or aria-current |
| marks the pressed segment with the overlay, ink and the accent bar | marks a hovered or focused row with the overlay and the 2 px accent bar, the pressed segment's look |
| puts a 20 px aria-hidden icon before each label | puts an aria-hidden 24 px badge, the region's number, before every region name (the segment icon's slot) |
| pressing Carousel replaces the URL with '/photos?view=carousel' and scroll false | holds no view state in client code: the page, OverviewHeader and RegionList are server modules that never import next/navigation |
| pressing Map replaces the URL with the bare '/photos' | links each row to regionHref(id) with no query or hash, and no link on the page carries a view parameter |
| pressing the pressed segment does nothing | renders no button at all, so nothing on /photos switches state in place |

### header.test.tsx (7) → components/photos/__tests__/overview.test.tsx (18-24)

| Retired test | Successor row |
|---|---|
| data/sheet.ts: titles the sheet 'Zermatt – Matterhorn' and takes the place from it | keeps 'Zermatt – Matterhorn' as the sheet title (footer, map margin) while the overview kicker names no single place |
| prints the kicker '4 waypoints · 1,617–2,760 m · Zermatt' from the data | derives the kicker on /photos from the registry and the published photos |
| derives the count and range from the photos it is given | takes the count and the year range from the years it is given, in any order |
| renders one h1 'Photographs', the site nav label for /photos | renders one h1, the site nav label for /photos, before h2 'Map' and h2 'Regions' |
| is a wrapping, non-sticky band with no prose | is a non-sticky band whose only paragraph is the kicker, with no prose |
| renders the switcher slot after the title block | has no slot after the title block: the band holds the kicker and the h1, nothing else |
| fails the build for zero photos | renders no empty region: every row counts at least one photograph and the rows sum to the kicker's count |

### photos-view-param.test.ts (16) → lib/__tests__/proxy.test.ts legacy-redirect rows (18-22, the declared R_jest 16 allowance)

| Retired test | Successor row(s) in 'proxy(): legacy ?view= redirect' |
|---|---|
| VIEWS lists map, grid and carousel in that order | '/photos?view=%s answers 308 …' (grid, carousel) and '/photos%s passes … (?view=map)' |
| labels each view for the switcher and the sr-only h2 | '/photos%s passes … (?view=GRID, a wrong case)' |
| returns map for undefined | '/photos%s passes … ('' , no parameter)' |
| returns map for an empty string | '/photos%s passes … (?view=, an empty value)' |
| returns map for a wrong case | '/photos%s passes … (?view=GRID)' |
| returns map for a wrong-case grid | '/photos%s passes … (?view=Carousel, a wrong case)' |
| returns map for a repeated parameter | '/photos%s passes … (?view=grid&view=grid)' |
| returns map for an unknown value | '/photos%s passes … (?view=xyz)' |
| returns map for a number | '/photos%s passes … (?view=%20grid, a padded value)' |
| returns map for null | '/photos%s passes … (no parameter)' |
| returns map for itself | '/photos%s passes … (?view=map)' |
| returns grid for itself | '/photos?view=grid answers 308 …' |
| returns carousel for itself | '/photos?view=carousel answers 308 …' |
| gives the Map the bare /photos URL | '/photos%s passes … (?view=map, the Map was /photos itself)' |
| puts grid and carousel in ?view= | the two 308 rows |
| round-trips through parseView for every view | 'drops every other parameter and the hash: /photos?view=grid&x=1#top' |

At plan start, before the first edit, `photos-view-param.test.ts` held exactly 16 tests (the pinned R_jest).

### GalleryGrid.test.tsx (14) → components/photos/__tests__/sequence-figure.test.tsx (18-24)

| Retired test | Successor row |
|---|---|
| renders every photo as a tile with its image and title | shows every published photo as a figure in exactly one region sequence (none dropped with the grid) |
| captions the film scan 'Riffelsee · 2,760 m approx. · 2019' | captions the film scan '4 / 7 · Riffelsee · 2,760 m approx. · 2019' with its film line, and Gornerschlucht's EXIF date |
| shows no hotspot count or hover overlay | shows no hotspot count, no hover overlay and no button on a figure |
| links each tile to /photos/{slug} | links each figure to its own photo page, a sequence's links covering exactly its region's photos |
| carries data-photo-id on every opener for focus restore | holds exactly one data-photo-id opener per item, the link itself (the focus-restore target) |
| renders exactly the four committed photos in altitude order | lists each region lowest first: DEM heights ascend down the sequence |
| names the list and gives each link its title and caption as an explicit aria-label | names each sequence list '{region} photographs, lowest first' and each link by an aria-label attribute |
| opens each caption data line with the short place | opens the data line with the short place from 768 px: the first part after the phone-only counter |
| gives each tile a data-photo-id equal to its slug | gives every figure across all regions a unique data-photo-id and li id |
| makes every caption part nowrap, so the line breaks only at " · " | makes every data part nowrap, with the ' · ' separators outside them |
| lists AVIF before WebP, each 640w/1024w/1600w, sized for half the row from 640 px | lists AVIF before WebP, each the view's stage derivatives with content-hashed names |
| loads the first two images eagerly and the others lazily | keeps every sequence image lazy with no fetch priority: the header slot cover owns the LCP |
| reserves each image box at the manifest ratio over surface-overlay, its li flexing from justifyTile | reserves each image box at the view's true ratio over surface-overlay |
| sets --row-h from the justify constants and a trailing filler that is not a list item | has no breakpoint row heights: the list is one flex column with no --row-h, no wrap and no filler (13 #37 retired) |

### photos-justify.test.ts (20) → components/photos/__tests__/sequence-figure.test.tsx (18-24)

| Retired test | Successor row |
|---|---|
| uses 224 px rows from 640 px and 280 px rows from 1024 px | spells the 16rem floor and the 12rem chrome in the rendered width class (256 px and 192 px) |
| gives the trailing filler a grow factor that swamps every tile | centres each figure in its column with mx-auto, so a line needs no filler |
| turns the 2560 x 1707 variant into its flex and aspect-ratio values | gives the 2560 x 1707 Matterhorn from Zermatt figure --ar 2560/1707 and sizes at 1.4997 |
| rounds the film scan ratio (2560 x 1745) to four decimals | rounds the film scan (2560 x 1745) to four decimals in its sizes |
| throws a RangeError for 0 x 10 | throws a RangeError rendering a figure whose aspect is 0 x 10 |
| throws a RangeError for 10 x 0 | … 10 x 0 |
| throws a RangeError for -1 x 10 | … -1 x 10 |
| throws a RangeError for NaN x 10 | … NaN x 10 |
| throws a RangeError for 10 x Infinity | … 10 x Infinity |
| gives two equal-ratio tiles one height, their widths filling the line | gives figures of one ratio identical sizes (one image height at any viewport) |
| gives a mixed-ratio row one height | gives every figure, whatever its ratio, the same width class: only --ar differs |
| keeps one height when the line is narrower than the bases (flex-shrink) | shrinks a figure to its column when the column is narrower than the height cap (320 x 900) |
| throws a RangeError for an empty line or a non-positive size | renders no sequence for an id that is not a registry region (RangeError) |
| has four photos | numbers each region's figures 1..N in order, N the sequence length |
| breaks a 710 px line at 224 px rows into two rows of two | at 375 x 812 px each figure's sizes covers its rendered width and over-fetches by at most one gutter |
| breaks a 720 px line at 224 px rows … | … at 768 x 1024 px … |
| breaks a 960 px line at 280 px rows … | … at 1024 x 768 px … |
| breaks a 1088 px line at 280 px rows … | … at 1440 x 900 px … |
| puts one tile per line at 720 px with 280 px rows (the reason for ROW_H_MD_PX) | keeps a portrait figure at the 16rem floor on a landscape phone (844 x 390) |
| gives the tiles of each filled row one height at 720 and 1088 | gives a 3:2 and a 3:4 figure one image height at 1440 x 900 (the viewport cap, 644 px) |

The extra row (not a successor) is 'renders no collar line for a view without a Position row (nothing reserved)'.

**13 #37:** the GalleryGrid row-height drift guard is retired with the grid. The new layout has no breakpoint row heights, which the 'has no breakpoint row heights …' row pins. This is recorded for 18-29's ledger write-back.

## Test counts (GUARD-03 per-plan gate)

```
jest 2819 -> 2804 (allowance 16, floor 2803)
e2e 855 -> 855 (allowance 0, floor 855)
```

Arithmetic: 2819 − 64 retired + 14 + 35 new = 2804. `npm run guard:tests`: jest 2804 + e2e 855 = 3659 against the committed phase floor of 3024, OK. `npm run guard:tests:scan` OK. Full Jest: 130 suites, 2804 tests, 0 failed. `npm run lint` 0, `npm run type-check` 0. `node scripts/ci/check-snapshot-commit.mjs --none` OK (0 changed) after both task commits. The `.test-count-18-24-*.tmp` files were deleted after the gate passed.

## Build and client JS

`rm -rf .next/static && npm run build` exited 0, and `public/service-worker.js` was restored after each of the two builds. Port 3000 was free before and after. No chunk in `.next/static/chunks` contains `photos-view`, `"Grid"`, `"Carousel"`, `?view=`, `data-tile-box`, `--row-h` or `tile-flex`.

Client JS is **1,827,784 B in 21 files** (byte sum of `.next/static/chunks/**/*.js`), **−64 B** against 18-23's 1,827,848 and 28,057 B under the 1,855,841 cap. The retired views' chunks had already stopped shipping in 18-22. The scratchpad tracker now ends `| 18-24 1,827,784 (cap 1,855,841)`.

E2E was not run: the plan declares none, and no rendered markup or pixels changed (the removed CSS was dead and comments changed only). `e2e/photos.spec.ts` 'a region row navigation shows no photos-view pseudo-element' remains as the regression guard.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 1's successor file named a retired module in a describe title**
- **Found during:** Task 2's whole-repo grep
- **Issue:** `overview.test.tsx`'s second describe read '… in place of PhotosHeader …'. Task 1's grep check exited 1 only because the file was still untracked when it ran, and `git grep` does not see untracked files. Once committed, the Task 1 check would have failed.
- **Fix:** the title now reads '… in place of the Phase 10 header …'. Both plan greps exit 1 on the final tree.
- **Files modified:** components/photos/__tests__/overview.test.tsx
- **Commit:** e5884ff

**2. [Rule 1 - Style] The two new test files were not prettier-formatted**
- **Issue:** the commit hook does not format new files, and `npm run lint` does not run prettier.
- **Fix:** `prettier --write` on the two new test files only.
- **Commit:** e5884ff

**3. [Rule 2 - Dead code] `sheetPlace` removed from data/sheet.ts**
- **Issue:** PhotosHeader was its only consumer, and the retired header test was its only test.
- **Fix:** removed the export and reworded the file comment. `sheet.title` is unchanged, and the successor row still asserts it.
- **Commit:** 11b0a99

**4. [Scope] Comment-only edits outside files_modified**
- proxy.ts (parseView), FactsLine.tsx and RegionHeader.tsx (PhotosHeader) were reworded per the action's "update any comment that names a retired module". No code changed.

Out of scope and not fixed: app/globals.css was not prettier-clean before this plan (quote style, oklch zeros). Only the one comment line and the deleted block were touched.

## Known Stubs

None.

## Threat Flags

None. The deletions add no surface. The 308 redirect for the retired URLs is 18-22's and is unchanged.

## Self-Check: PASSED

- FOUND: components/photos/__tests__/overview.test.tsx (14 rows; contains 'Regions, west to east'; imports RegionList)
- FOUND: components/photos/__tests__/sequence-figure.test.tsx (35 rows; contains figureSizes; imports SequenceFigure)
- ABSENT (deleted): ViewSwitcher.tsx, PhotosHeader.tsx, view-param.ts, JustifiedGrid.tsx, justify.ts, TileTransition.tsx
- FOUND commits: 11b0a99, e5884ff; no attribution trailers; no PNG staged; nothing pushed
- `grep -c photos-view app/globals.css` = 0
