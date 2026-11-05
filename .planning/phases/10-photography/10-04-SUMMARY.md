---
phase: 10-photography
plan: 04
subsystem: ui
tags: [nextjs, app-router, searchParams, react, tailwind, flexbox, playwright, jest, picture]

requires:
  - phase: 10-photography
    provides: "10-01 photoViews / buildPhotoViews (slug, title, alt, shortPlace, altitudeLabel, captureMonth, aspect, tile)"
provides:
  - lib/photos/view-param.ts (VIEWS, GalleryView, VIEW_LABELS, parseView, viewHref)
  - lib/photos/justify.ts (ROW_H_PX 280, ROW_H_MD_PX 224, FILLER_GROW, justifyTile, rowHeights, flexLines)
  - components/photos/JustifiedGrid.tsx (server-rendered justified grid of slide-mount tiles; data-photo-id, data-caption-part, data-tile-box hooks; --tile-flex and --row-h CSS variables)
  - "/photos?view=grid branch in app/(site)/photos/page.tsx, plus metadata title 'Photographs'"
  - rewritten components/__tests__/GalleryGrid.test.tsx (14 tests) and the 'Grid view' describe in e2e/photos.spec.ts
affects: [10-05, 10-07, 10-08, 10-09, 10-13]

actuals:
  tokens: 9800
  tasks: 2
  commits: 4
plan_head_before: f89ef16b5ebea79dc38cb4ac001c1abd1b9501fe
plan_head_after: 7dd87608916e3cc887e52cf82646393d78652369

tech-stack:
  added: []
  patterns:
    - "CSS-only justified rows: li flex '{aspect} 1 calc({aspect} * var(--row-h))', image box aspect-ratio from the manifest, ::after filler 'flex: 999999 1 0px'; equal heights follow because grow and shrink weights are both proportional to the aspect"
    - "Tailwind literal classes mirrored by TS constants, guarded by a Jest class-string assertion (sm:[--row-h:224px] lg:[--row-h:280px] vs ROW_H_MD_PX / ROW_H_PX)"
    - "View state from the URL only: parseView((await searchParams).view) in a Server Component, Map default"

key-files:
  created:
    - lib/photos/view-param.ts
    - lib/photos/justify.ts
    - lib/__tests__/photos-view-param.test.ts
    - lib/__tests__/photos-justify.test.ts
    - components/photos/JustifiedGrid.tsx
  modified:
    - app/(site)/photos/page.tsx
    - components/__tests__/GalleryGrid.test.tsx
    - e2e/photos.spec.ts

key-decisions:
  - "Grid row height is 224 px from 640 px and 280 px from 1024 px, as Tim approved on 2026-10-26 (his selected answer: \"Accept 224/280 (Recommended)\"); e2e confirms two rows of two at 768 and 1440"
  - "justify.ts also exports flexLines (a flex-wrap line-break model) so the rows-of-two outcome, including the zero-basis ::after filler fitting on the last line, is a unit test rather than only an e2e check"
  - "The grid view container carries pt-6 (UI-SPEC spacing 'header -> view pt-6') so the grid does not sit flush under the nav before the 10-09 header band lands"
  - "Tile titles are a <p>, not headings: each link already carries the title as its explicit aria-label, so headings would add four duplicate stops to the heading outline"

patterns-established:
  - "Grid tile hooks: a[data-photo-id={slug}] (focus restore), [data-tile-box] (image box), [data-caption-part=place|altitude|date] (nowrap caption parts)"

requirements-completed: []

coverage:
  - id: D1
    description: "parseView whitelists map/grid/carousel exactly and falls back to 'map' for undefined, '', wrong case, arrays, numbers, null and unknown strings; viewHref gives '/photos', '/photos?view=grid', '/photos?view=carousel'"
    requirement: PHOTO-02
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-view-param.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "justifyTile(2560, 1707) gives aspect 1.4997, flex '1.4997 1 calc(1.4997 * var(--row-h))' and aspectRatio '2560 / 1707'; rowHeights gives one height per filled line; the four photos break into two rows of two at 710/720 (224 px) and 960/1088 (280 px), and into one per line at 720 with 280 px"
    requirement: PHOTO-02
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-justify.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "JustifiedGrid renders 'Photographs, lowest first' with four slide-mount links in photoViews order to /photos/{slug} with data-photo-id, AVIF before WebP 640/1024/1600, sizes '(min-width: 640px) 50vw, 100vw', first two eager, manifest aspect-ratio boxes over surface-overlay, nowrap caption parts, the film scan caption 'Riffelsee · 2,760 m approx. · 2019', and no hotspot or hover-overlay text"
    requirement: PHOTO-03
    verification:
      - kind: unit
        ref: "components/__tests__/GalleryGrid.test.tsx#JustifiedGrid (PHOTO-02, PHOTO-03, D-15)"
        status: pass
    human_judgment: false
  - id: D4
    description: "At /photos?view=grid: canonical order; two rows of two with equal heights (±1 px) and true ratios (±1 %) at 768 x 900 and 1440 x 900; one column without horizontal overflow at 375; every currentSrc a hashed derivative; the first tile opens /photos/{first slug} with its h1"
    requirement: PHOTO-02
    verification:
      - kind: e2e
        ref: "e2e/photos.spec.ts#Grid view (PHOTO-02, PHOTO-03, D-15)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Visual quality of the grid (mount spacing, caption hierarchy, hover state) at 375, 768 and 1440"
    verification: []
    human_judgment: true
    rationale: "Aesthetics need a human eye; the photos/* visual baselines are re-captured in 10-13, and ?view=grid has no baseline yet"

duration: 10min
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 04: Justified Grid View Summary

**`/photos?view=grid` now server-renders the four photographs as CSS-only justified rows of slide mounts. Rows are 224 px tall from 640 px and 280 px from 1024 px, and an `::after` filler keeps the last row from stretching. Each mount has a manifest-ratio image box and an always-visible caption made of three nowrap mono parts. The view comes from `?view=`, read by a whitelisted `parseView` that falls back to the Map.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-10-26T11:12:35Z
- **Completed:** 2026-10-26T11:22:06Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 8

## Accomplishments
- `parseView` / `viewHref` / `VIEWS` / `VIEW_LABELS`: the URL is the only source of view state, and the Map is the locked default (T-10-10).
- `justifyTile`, `rowHeights` and `flexLines` are pure and import-free. The justified-row behaviour (equal heights, rows of two for the real photos, the filler on the last line) is proven in Jest.
- `JustifiedGrid` is a Server Component with no hooks, so CLS is 0 and the layout is exact at SSR. It has no hover overlay and no hotspot badge, which also removes the "1 hotspots" plural bug from the STATE pending todo for the grid. The legacy GalleryGrid still shows it at `/photos` until 10-08.
- `/photos` sets the document title to "Photographs · Tim Lui" and mounts the grid for `?view=grid`. Map and Carousel keep the legacy gallery, unchanged, until 10-07 and 10-08.
- GalleryGrid tests: all 10 legacy cases are rewritten against JustifiedGrid and none are dropped, with 4 more added (14 total). The plan's count of 11 was one too high; the file had 10 cases.

## Task Commits

1. **Task 1: parseView and justifyTile as tested pure functions**: `7b264b1` (test, RED), `4fa61c1` (feat, GREEN)
2. **Task 2: JustifiedGrid at /photos?view=grid, rewritten GalleryGrid test, grid e2e**: `ea2f231` (test, RED), `7dd8760` (feat, GREEN)

**Plan metadata:** see the docs(10-04) commit that follows this SUMMARY.

## TDD Evidence

- **RED, Task 1 (`7b264b1`):** 36 Jest tests were discovered and ran. 32 failed on throwing stubs ('parseView: not implemented', 'justifyTile: not implemented', and RangeError expectations that received a plain Error), and the 4 constant cases passed. The stubs were committed with the tests so the suites load. A first run failed to load the justify suite because a describe body called the stub, which would have been an INVALID_RED. I moved that call into the tests before recording RED. Semantic assessment: every target failed on the planned behaviour, with no load, syntax or fixture fault.
- **RED, Task 2 (`ea2f231`):** all 14 GalleryGrid tests ran and failed on `Unable to find an accessible element with the role "list" and name "Photographs, lowest first"`, because the stub renders null. Semantic assessment: valid. The suite loaded and each target failed at its first planned query.
- **GREEN:** 36/36 (Task 1) and 50/50 (three suites, Task 2). Full Jest is 824/824 across 54 suites.
- `gsd_run check tdd-red-evidence` has no Jest adapter, so RED was judged from the raw console output, as in 10-02 and 10-03. No machine verdict was used.
- No REFACTOR commit was needed.

## Files Created/Modified
- `lib/photos/view-param.ts`: view whitelist, labels, href builder
- `lib/photos/justify.ts`: row-height constants, tile flex values, flex-line models
- `lib/__tests__/photos-view-param.test.ts`, `lib/__tests__/photos-justify.test.ts`: the behaviour cases
- `components/photos/JustifiedGrid.tsx`: the grid view
- `app/(site)/photos/page.tsx`: async page, `parseView`, grid branch, `metadata`
- `components/__tests__/GalleryGrid.test.tsx`: rewritten against JustifiedGrid
- `e2e/photos.spec.ts`: the six legacy tests unchanged, plus the 'Grid view' describe (6 tests)

## Decisions Made
- Row height 224/280 as Tim approved (quoted in the frontmatter); the e2e geometry confirms it.
- `flexLines` added to justify.ts to make the rows-of-two claim a unit test.
- `pt-6` on the grid container, following the UI-SPEC spacing table.
- Tile titles are paragraphs. The explicit aria-label names each link, as on WaypointCard.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - UX/spec] Grid container gets the header-to-view `pt-6` offset**
- **Found during:** Task 2 (screenshot check at 375/768/1440)
- **Issue:** The plan's container classes (`px-4 pb-12 ... md:pb-16`) have no top padding, so the first row sat flush against the nav border.
- **Fix:** Added `pt-6`, the UI-SPEC "header -> view" step. 10-09's header band keeps it.
- **Files modified:** app/(site)/photos/page.tsx
- **Verification:** Grid view e2e 6/6 passed after the change.
- **Committed in:** 7dd8760

**2. [Rule 3 - Blocking test design] Extra `flexLines` export in justify.ts**
- **Found during:** Task 1
- **Issue:** The behaviour "two bases plus one gap fit the line, three do not" needs a line-break model, and the interfaces block named only `justifyTile` and `rowHeights`.
- **Fix:** Added a pure `flexLines(containerW, bases, gap)`. The tests feed it the four tiles plus the zero-basis filler.
- **Committed in:** 7b264b1 / 4fa61c1

---

**Total deviations:** 2 auto-fixed (1 spec-driven spacing, 1 test-model export)
**Impact on plan:** Both are small and stay within the UI-SPEC. No scope creep.

## Issues Encountered
- The plan says the legacy GalleryGrid test file has 11 tests; it has 10. All 10 are mapped and the file now has 14, so the ratchet rises by 4.
- `app/(site)/photos/page.tsx` already failed `prettier --check` before this plan, because of the legacy hero JSX. I left that block byte-identical rather than reformat code that 10-08 replaces. The new code is formatted, and CI does not run Prettier.
- The legacy `/photos` 3D toggle still logs the React `removeChild ... not a child` console error during `e2e/photos.spec.ts`. This is pre-existing (STATE concern from 07-19) and outside this plan's surface.

## Visual Re-baseline Note (for 10-13)
- No pixel changes to `/photos` (map/carousel) in this plan: the legacy branch markup is unchanged. Only the document title changed, to "Photographs · Tim Lui".
- `/photos?view=grid` is new and has no visual baseline yet. 10-13 should add it or confirm it with the photos/* re-baseline.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 10-05 can add the intercepted route; the tile links already carry `scroll={false}` and `data-photo-id`. 10-05 changes the "clicking the first tile opens its photo page" e2e expectation to the dialog.
- 10-09's ViewSwitcher can use `viewHref` and `VIEW_LABELS`.
- PHOTO-02 and PHOTO-03 are not marked complete yet. `requirements.ready-ids` reports both as blocked by sibling plans that also declare them.

---
*Phase: 10-photography*
*Completed: 2026-10-26*

## Self-Check: PASSED
