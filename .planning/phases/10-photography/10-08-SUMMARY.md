---
phase: 10-photography
plan: 08
subsystem: ui
tags: [nextjs-16, react-19, rsc, tailwind-4, container-queries, label-layout, a11y, playwright, jest]

requires:
  - phase: 10-photography
    provides: "10-01 photoViews (uv, altitudeLabel, tile derivatives, aspect); 10-04 parseView and the ?view= branches; 10-05 the intercepted lightbox with focus return to [data-photo-id]; 10-06 recordViewTransitions / readViewTransitions; 10-07 the carousel branch"
  - phase: 09-home-ascent
    provides: "PosterSheet relief picture, SummitMark, ContourField hero LOD, countLabel and formatMetres"
provides:
  - "lib/photos/label-layout.ts (import-free): layoutMapMarks, mapMarkSegments, mapMarkCss, stack1D and the PLATE_WIDE / PLATE_COMPACT / SUMMIT_PLATE / INSET / GAP / DOT / DOT_CLEAR / COMPACT_MAX_S / SWEEP_MIN_S / SWEEP_MAX_S constants"
  - "components/photos/MapSheet.tsx: server-rendered map sheet (data-map-sheet, container map-sheet) with data-map-mark links, data-map-dot, data-map-leader, data-map-preview and data-summit-plate"
  - "components/photos/PhotosHeader.tsx: the header band (data-photos-header, data-photos-kicker, h1, children slot for the 10-09 switcher)"
  - "data/sheet.ts: sheet.title and sheetPlace; lib/home-format.ts: formatMetreRange"
  - "/photos (no or an unknown ?view=) renders the map; the legacy hero, PhotosPageClient and landscapes leave the page"
affects: [10-09, 10-11, 10-12, 10-13, visual baselines]

actuals:
  tokens: 17969
  tasks: 3
  commits: 6
plan_head_before: 02834bccec5b20fe9113d582fe3123baf864ad79
plan_head_after: 586c54da949bc093aec5d1b124858e32d13d02e3

tech-stack:
  added: []
  patterns:
    - "Piecewise-linear server layout: the layout function records every branch (max/min/clamp winner, side, move, leader edge and sign, preview side) in a trace; equal traces over consecutive integer sides form a segment whose coordinates are exactly frac x S + px, emitted as calc(<frac> * 100cqw + <px>px) in @container (min-width) rules"
    - "Cascade-only CSS segments: the first segment is unconditional, each later @container map-sheet (min-width) rule repeats only the rules that change, so fractional sheet sides are covered and the CSS is about 7 KB"
    - "A link whose box is the label plate, with the dot and leader as absolutely positioned children outside it, so the whole mark is one click and tab target"

key-files:
  created:
    - lib/photos/label-layout.ts
    - lib/__tests__/photos-label-layout.test.ts
    - components/photos/MapSheet.tsx
    - components/photos/__tests__/map.test.tsx
    - components/photos/PhotosHeader.tsx
    - components/photos/__tests__/header.test.tsx
    - data/sheet.ts
  modified:
    - app/(site)/photos/page.tsx
    - e2e/photos.spec.ts
    - components/site/SiteFooter.tsx
    - lib/home-format.ts
    - lib/__tests__/home-format.test.ts
    - .planning/phases/10-photography/deferred-items.md

key-decisions:
  - "10-08: plates clear a 16 px dot square (12 px dot plus its 2 px casing on each side, DOT + DOT_CLEAR); a 20 px square (4 px on each side) fails the compact slot 1 at S = 312 and 313, which contradicts the UI-SPEC measured floor of 312"
  - "10-08: wide-tier rules 3 and 4 generalised as one move-below loop: a plate that meets an earlier plate (8 px) or overlaps a dot or the summit moves below it by 8 px until nothing moves; on the real data only rule 3 fires (Gornerschlucht or Riffelsee in 560-573 and 793-805 px)"
  - "10-08: the leader attaches to the plate edge on the axis where the dot lies further outside the plate (horizontal on a tie); the SVG leader box is min 1 px, so a vertical leader slants by at most 1 px"
  - "10-08: the plate size switches with Tailwind @min-[35rem] (S >= 560) on the nearest container, the same boundary as the generated map-sheet rules"
  - "10-08: /photos renders the header band once and one view section keyed by the view"

patterns-established:
  - "Jest: a CSS cascade check parses the generated rules, applies every rule whose min-width is at or below S, and compares the result with the pure layout at every side"
  - "Map e2e: measure plates and dots relative to the sheet content box (getBoundingClientRect plus clientLeft/clientTop, S = clientWidth)"

requirements-completed: [PHOTO-01, PHOTO-03]

coverage:
  - id: D1
    description: "Deterministic label layout for every sheet side 312-1100 px: 8 px between plates, no plate over a dot (16 px), the summit mark or plate, no leader across another plate, every plate 8 px inside, visual order equal to altitude order, compact iff S <= 559, five marks rejected on the compact tier only"
    requirement: PHOTO-01
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-label-layout.test.ts (26 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Server CSS reproduces the layout: segments evaluated at each side and the emitted CSS cascaded at each side both match layoutMapMarks within 0.5 px; the CSS holds only numbers, the four slugs and fixed selectors (T-10-18)"
    requirement: PHOTO-01
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-label-layout.test.ts#cascades to the layout at every side from 312 to 1100 px, within 0.5 px"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photos-label-layout.test.ts#is built only from numbers, the four slugs and fixed selectors (T-10-18)"
        status: pass
    human_judgment: false
  - id: D3
    description: "/photos and /photos?view=xyz open on the map: four links lowest first named '{title}, {altitude}' ('… approx.' for the film scan), Tab order equals altitude order, dashed approximate dot, unlinked aria-hidden summit plate"
    requirement: PHOTO-01
    verification:
      - kind: unit
        ref: "components/photos/__tests__/map.test.tsx (10 tests)"
        status: pass
      - kind: e2e
        ref: "e2e/photos.spec.ts#opens on the map with four waypoint links in altitude order (PHOTO-01)"
        status: pass
      - kind: e2e
        ref: "e2e/photos.spec.ts#Tab reaches the four waypoint links in altitude order"
        status: pass
      - kind: e2e
        ref: "e2e/photos.spec.ts#the Riffelsee dot is dashed and the summit is not a link"
        status: pass
    human_judgment: false
  - id: D4
    description: "A map plate opens the lightbox with a plain enter (no photo-* pseudo-element); Close photo and Escape close it and focus returns to the plate"
    requirement: PHOTO-01
    verification:
      - kind: e2e
        ref: "e2e/photos.spec.ts#a map plate opens the lightbox"
        status: pass
      - kind: e2e
        ref: "e2e/photos.spec.ts#Escape closes it and focus returns to the plate"
        status: pass
      - kind: e2e
        ref: "e2e/photos.spec.ts#opening from the map is a plain enter: no photo-* pseudo-element @chromium-only"
        status: pass
    human_judgment: false
  - id: D5
    description: "Rendered geometry at 360, 375, 412, 768, 1024 and 1440 x 900: plates 48 or 68 px tall, >= 7.5 px apart and inside the sheet, dots within 1 px of (u x S, v x S), visual order equals altitude order, no horizontal overflow"
    requirement: PHOTO-01
    verification:
      - kind: e2e
        ref: "e2e/photos.spec.ts#at {360,375,412,768,1024,1440} x 900 the plates keep their boxes, gaps and dots"
        status: pass
    human_judgment: false
  - id: D6
    description: "The map reads the one canonical order (buildPhotoViews, DEM height then id) and the layout keeps the input order"
    requirement: PHOTO-03
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-label-layout.test.ts#places each dot at u x S, v x S and keeps the input (altitude, then id) order"
        status: pass
      - kind: unit
        ref: "components/photos/__tests__/map.test.tsx#links each waypoint to its photo in the canonical order"
        status: pass
    human_judgment: false
  - id: D7
    description: "Header band: kicker '4 waypoints · 1,617–2,760 m · Zermatt' derived from the data, h1 'Photographs' from site.nav, no prose; formatMetreRange; the footer and the map margin line read data/sheet.ts with the footer text unchanged"
    verification:
      - kind: unit
        ref: "components/photos/__tests__/header.test.tsx (7 tests)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/home-format.test.ts#formatMetreRange (/photos kicker, D-14)"
        status: pass
      - kind: unit
        ref: "components/site/__tests__/SiteFooter.test.tsx#titles the sheet \"Zermatt – Matterhorn\" in a p, not a heading"
        status: pass
    human_judgment: false
  - id: D8
    description: "Look of the map and band at 375, 768 and 1440 (relief, plates, leaders, the dashed dot, hover/focus preview placement and its overlap of a neighbouring plate) and the photos/* visual baselines"
    verification: []
    human_judgment: true
    rationale: "Design judgment; the photos/* baselines are re-captured in 10-13. The executor reviewed local renders at 375 and 1440 only"

duration: 34min
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 08: Map View Summary

**/photos now opens on the full survey-sheet map. Four always-labelled waypoint links sit in altitude order, placed by a pure, branch-traced layout. That layout is emitted as container-query calc() CSS, so the server HTML is exact at every sheet side. The page also gains the derived header band, and the footer shares the sheet title.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-10-26T13:25:55Z
- **Completed:** 2026-10-26T14:00:26Z
- **Tasks:** 3 (each RED then GREEN)
- **Files modified:** 12 code and test files, plus deferred-items.md

## Accomplishments
- `layoutMapMarks` places the four plates for any sheet side. Wide tier (S >= 560): plates beside their dots, stack1D per side, and plates that meet move below. Compact tier (S < 560): the four UI-SPEC slots, two-line 144 x 68 plates. The UI-SPEC sweep (312-1100 px) is repeated in Jest and passes.
- `mapMarkSegments` splits the sweep into 13 linear segments (5 compact, 8 wide). `mapMarkCss` emits them as one ~7 KB style element of `@container map-sheet (min-width: …)` rules. A Jest cascade check confirms the emitted CSS equals the layout within 0.5 px at every side.
- `MapSheet` (Server Component, no client JS of its own) has these layers:
  - the night relief (fetchPriority high) under the hero contours;
  - the aria-hidden summit triangle and its 'Matterhorn' / '4,478 m' plate;
  - one `next/link` per photo whose box is the plate, with the dot, leader and hover/focus preview as children;
  - the margin line 'Zermatt – Matterhorn · contours every 100 m' · 'Terrain: swissALTIRegio, swisstopo'.
- `PhotosHeader`: the band with the kicker '4 waypoints · 1,617–2,760 m · Zermatt' (from countLabel, formatMetreRange and sheetPlace) and the h1 'Photographs' from site.nav. It is not sticky, has no prose, and keeps a slot for the 10-09 switcher.
- The six legacy `/photos` e2e tests were rewritten into map cases; none was deleted. Map e2e was added for Tab order, the plain enter, the dashed dot and the 360-1440 geometry. The test-count ratchet is 1183 (baseline 966).

## Task Commits

1. **Task 1: Deterministic map label layout** - `1699dbc` (test, RED), `19fc942` (feat, GREEN)
2. **Task 2: MapSheet as the default view, legacy e2e rewritten** - `58e16a4` (test, RED), `9c0dfe5` (feat, GREEN)
3. **Task 3: Header band and the shared sheet title** - `e968f62` (test, RED), `586c54d` (feat, GREEN)

**Plan metadata:** the docs(10-08) commit that follows this SUMMARY.

## TDD Evidence

- **RED, Task 1 (`1699dbc`):** 25 Jest tests ran. 23 failed on the throwing stubs ('layoutMapMarks: not implemented' and the others), and the 2 constant cases passed. The describe bodies that call the stubs were moved into `beforeAll` before RED was recorded, so the suite loads. Semantic assessment: valid. Every behaviour target failed on its planned call, with no load or syntax fault.
- **RED, Task 2 (`58e16a4`):**
  - Jest: all 10 map.test cases failed on `Unable to find an accessible element with the role "region" and name "Map of the photo locations"`, because the stub renders null.
  - Playwright: run with `--reporter=line,junit` and classified by `gsd check tdd-red-evidence` with target `photos.spec.ts`, verdict `RED_EVIDENCE_OK` (record in `.red/10-08-t2.json`). All 26 new map cases failed at their first planned assertion.
  - One unrelated failure: the grid tile-click case in chromium, which is the known dev cold-compile interception flake.
  - The classifier did not match a `file#title` target for a title containing parentheses, so the file was used, as in 10-07.
- **RED, Task 3 (`e968f62`):** 10 cases failed on the stubs: the formatMetreRange 'not implemented' error, the empty sheet title, and the null header. The 33 existing cases in the 3 suites stayed green, SiteFooter included. Semantic assessment: valid.
- **GREEN:**
  - Jest: label layout 26/26, map 10/10, header plus home-format plus SiteFooter 43/43. Full Jest is 884/884 across 59 suites.
  - e2e: `e2e/photos.spec.ts` 41/41 on a fresh dev server (chromium + firefox), and `PW_PROD=1` `e2e/photos.spec.ts e2e/shell.spec.ts` 107/107.
  - `npm run lint` (with the image guards) and `npm run type-check` exit 0, and `npm run build` succeeds.
- Jest has no adapter in `tdd-red-evidence`, so the Jest RED was judged from the raw console output, as in 10-02 to 10-07.
- No REFACTOR commit.

## Files Created/Modified
- `lib/photos/label-layout.ts`: the pure layout, segments, CSS serialiser and stack1D
- `lib/__tests__/photos-label-layout.test.ts`: the sweep, slots, leaders, counts, segment parity, CSS cascade and character set, stack1D
- `components/photos/MapSheet.tsx`: the map sheet
- `components/photos/__tests__/map.test.tsx`: component cases
- `components/photos/PhotosHeader.tsx`, `components/photos/__tests__/header.test.tsx`: the band
- `data/sheet.ts`: sheet title and place
- `lib/home-format.ts`, `lib/__tests__/home-format.test.ts`: formatMetreRange
- `app/(site)/photos/page.tsx`: map default, header band, one keyed view section; legacy hero and imports removed
- `components/site/SiteFooter.tsx`: reads `sheet.title`; the text is unchanged
- `e2e/photos.spec.ts`: legacy tests rewritten as map cases, plus the map geometry sweep

## Decisions Made
- **Dot clearance box:** I read "12 px plus 4 px clearance" as a 16 px square: the dot plus its 2 px `ring-2` casing on each side. That reading reproduces the UI-SPEC measured floor (312 passes, below fails). A 20 px reading fails S = 312-313 at slot 1.
- **Leaders:** one SVG per mark: a (0,0)→(100%,100%) line, flipped with `scale(-1, 1)` when the direction is anti-diagonal. The box is at least 1 px, so a vertical leader slants by at most 1 px.
- **CSS rules:** cascade-only `min-width` rules with unchanged rules deduplicated, instead of min/max-width pairs. This covers fractional container widths. The size dropped from about 29 KB to about 7 KB.
- **Map layers:** the relief img keeps `fetchPriority="high"`, because it is the largest paint of the default view. The preview images are `loading="lazy"` inside a `hidden` box, so they load only on hover or focus.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test matchers versus U+00A0**
- **Found during:** Task 2 (GREEN)
- **Issue:** Testing Library's default normaliser turns U+00A0 into a space. `getByText('1,617 m')` and `toHaveTextContent` with NBSP therefore could never match.
- **Fix:** The map tests compare `textContent` for NBSP strings and normalise the expected text for `getByText`. The accessible-name checks keep the exact U+00A0.
- **Files modified:** components/photos/__tests__/map.test.tsx
- **Committed in:** `9c0dfe5`

**2. [Rule 1 - Bug] e2e dot border check versus preflight**
- **Found during:** Task 2 (GREEN)
- **Issue:** Preflight gives every element `border: 0 solid`, so an exact dot's computed style is 'solid', not 'none'.
- **Fix:** The test compares width and style ('2px dashed' for the film scan, '0px solid' for the others).
- **Files modified:** e2e/photos.spec.ts
- **Committed in:** `9c0dfe5`

**3. [Rule 2 - Missing critical] Slug check in mapMarkCss (T-10-18)**
- **Found during:** Task 1
- **Issue:** The style text puts slugs inside attribute selectors.
- **Fix:** mapMarkCss throws a RangeError for any slug that is not lowercase letters, digits and hyphens, and for any non-finite length. Both are tested.
- **Committed in:** `19fc942`

**4. [Rule 2 - Missing critical] CSS cascade parity test**
- **Found during:** Task 1
- **Issue:** The plan's parity check covers `mapMarkSegments`, but not the emitted CSS (relative dot and leader coordinates, deduplication).
- **Fix:** Added a Jest case that cascades the CSS at every side and compares it with the layout.
- **Committed in:** `19fc942`

---

**Total deviations:** 4 auto-fixed (2 test bugs, 2 missing-critical checks).
**Impact on plan:** The test fixes correct assertions, not behaviour. The two additions harden the trust boundary and the server-exact claim. There is no scope creep.

## Issues Encountered
- **Dev server stopped intercepting:** twice, after hot-reloading the photos routes (once with a concurrent `npm run build`), the dev server stopped intercepting photo links. The grid case, which 10-08 does not touch, failed the same way. A fresh dev server and the production build both passed. Logged in deferred-items.md next to the 10-01 and 10-07 items.
- **Pre-existing Prettier drift in `components/site/SiteFooter.tsx`:** `prettier --check` already failed on the committed file before this plan. Only the one title line and the import changed; the rest was left as is. CI does not run Prettier.
- **No WebKit run:** a local WebKit run cannot hydrate localhost (deferred item, CSP `upgrade-insecure-requests`). The header was not changed.

## Visual Re-baseline Note (for 10-13)
- `/photos` (the default view) now shows the header band and the map in place of the legacy hero and gallery, so every photos/* default-view baseline changes. `?view=grid` and `?view=carousel` gain the header band above the view.
- The footer is unchanged: the same text now comes from `data/sheet.ts`.
- No PNGs were touched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 10-09 can pass the ViewSwitcher as `PhotosHeader` children. The band already wraps it below the title on phones.
- 10-11 can reuse `stack1D` for the hotspot gutters.
- A fifth photo makes the compact tier throw. That is by design (D-04 guard), and the layout must be revised first.

## Self-Check: PASSED
- Files: all 7 created files exist.
- Commits: 1699dbc, 19fc942, 58e16a4, 9c0dfe5, e968f62 and 586c54d are on HEAD.
- Acceptance greps:
  - label-layout imports 0; stack1D 1; mapMarkCss 1; "1100" in the test 10.
  - page PhotosPageClient 0; MapSheet 2; "View details for" 0; `mapMarkCss(` in MapSheet 1; "use client" 0.
  - footer literal 0; `sheet.title` 1; "stunning" 0 and 0; formatMetreRange 1.

---
*Phase: 10-photography*
*Completed: 2026-10-26*
