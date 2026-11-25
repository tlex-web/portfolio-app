---
phase: 18-immersive-survey-layout
plan: 19
subsystem: photos
tags: [viewer-stage, sizes, srcset, preload, avif, webp, lcp, perf, photo-06, lbox-09, 13-33, 13-34, e2e, jest, tdd]
status: complete

requires:
  - phase: 18-08
    provides: "lib/photos/image-sizes.ts (figureSizes, headerSlotSizes, NAV_PX, ratio()) and the sequence figure links ([data-photo-id]) on the region page"
  - phase: 18-15
    provides: "The LBOX-08 matrix already on the region page; the Zermatt series (regionPhotoViews) as the lightbox's stepping set"
  - phase: 18-18
    provides: "The viewer strip as it stands (LV95, Share) and the @no-win-webkit D-22 tag"
provides:
  - "lib/photos/image-sizes.ts: stageSizes(ar, variant: 'page' | 'modal') from the lightbox-tiers constants, and STAGE_SCROLL_VH = 70"
  - "PhotoViewer: STAGE_SIZES removed; the stage and the neighbour preload take stageSizes; preloadStage(view, sizes, avif) uses the AVIF set only when the stage loaded AVIF, else WebP (13 #33)"
  - "StagePhoto: onLargeLoad(img) hands the loaded large img to the viewer"
  - "e2e/photos-lightbox.spec.ts: the 'Stage sizes at 375, 768 and 1440' currentSrc gate (6 rows per engine), and every lightbox test opened from the Zermatt figure links (clickFigure / openFigure)"
  - "e2e/perf/photo-baseline.spec.ts: record-only region and photo page LCP in the perf project (PHOTO_LCP_RUNS, PHOTO_LCP_OUT, one 'PHOTO-LCP:' line)"
affects: [18-20, 18-21, 18-22, 18-25, 18-29]

actuals:
  tokens: 15250    # chars/4 over git diff 164e479..5e495fe (61,015 chars incl. context)
  tasks: 3
  commits: 6       # git rev-list --count 164e479..5e495fe; the metadata commit follows
plan_head_before: 164e4799369cdd3da969a32efaeb8b5190393b43
plan_head_after: 5e495febf0428fba616a79bdfb8500cd40f31aa0

tech-stack:
  added: []
  patterns:
    - "A sizes string is an upper bound of the painted box (the variable strip is ignored on purpose); a currentSrc gate judges under-fetch against the painted width and over-fetch against the declared sizes slot, both times the DPR"
    - "A preload follows the format the browser actually chose for the visible image (the loaded img's currentSrc), never a fixed source"
    - "A sizes length is resolved in the page by a fixed-position probe element with width set to the matching entry's length, after a parenthesis-aware split of the sizes list"

key-files:
  created:
    - e2e/perf/photo-baseline.spec.ts
  modified:
    - lib/photos/image-sizes.ts
    - lib/__tests__/image-sizes.test.ts
    - components/photos/PhotoViewer.tsx
    - components/photos/StagePhoto.tsx
    - components/photos/__tests__/photo-viewer.test.tsx
    - e2e/photos-lightbox.spec.ts
    - e2e/design-system.spec.ts

key-decisions:
  - "18-19: stageSizes ignores the variable-height strip on purpose: each term is an upper bound of the photo box, so the browser never under-fetches (the plan's own rule)"
  - "18-19 (Tim, Rule-4 answer 2026-11-25, 'A: keep sizes, relax check'): the currentSrc gate keeps under-fetch strict (descriptor >= painted width x DPR) and judges over-fetch against the declared sizes slot x DPR, not the painted width. Page 1440x900 at WebKit DPR 2 keeps taking 2560w (slot 1008 px, 2016 device px), as before 18-19; no layout or baseline change"
  - "18-19: the neighbour preload reads the stage's loaded large img (StagePhoto's onLargeLoad now passes it) and picks AVIF or WebP from its currentSrc; each neighbour gets its own stageSizes"
  - "18-19: the scroll tier's 70vh cap is a named constant (STAGE_SCROLL_VH) with a parity row that scans PhotoViewer's 70svh photo box, so CSS and sizes cannot drift"
  - "18-19 (P4 default from 18-01): the LBOX-06 open row asserts the sequence figure's photo-{slug} morph into the stage"

requirements-completed: []  # LBOX-09 is also carried by 18-20 and 18-29; PHOTO-06 by 18-21..18-29. Neither is completed here; left Pending for the last carrier and the phase verifier

coverage:
  - id: D1
    description: "The stage's sizes come from stageSizes(ar, variant) built from the lightbox tiers; at 375, 768 and 1440 on the page and in the dialog the stage's currentSrc descriptor covers the painted width x DPR, and the next smaller candidate falls short of the declared slot x DPR"
    requirement: "LBOX-09"
    verification:
      - kind: unit
        ref: "lib/__tests__/image-sizes.test.ts 'stageSizes' rows (6, incl. the STAGE_SCROLL_VH parity row); figureSizes and headerSlotSizes rows unchanged"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts 'Stage sizes at 375, 768 and 1440 (13 #34; 18-19)' 18/18 (chromium, firefox, local webkit-2388)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The neighbour preload requests the format the stage loaded (AVIF or WebP) with the neighbour's stageSizes"
    requirement: "LBOX-09"
    verification:
      - kind: unit
        ref: "components/photos/__tests__/photo-viewer.test.tsx: 3 preload-format rows"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts 'preload: opening a photo fetches the next photo derivative before Next is pressed' (records the viewer's Image preloads)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every lightbox test in photos-lightbox.spec.ts and design-system.spec.ts opens from the Zermatt region page's figure links; no test deleted"
    requirement: "PHOTO-06"
    verification:
      - kind: e2e
        ref: "photos-lightbox, design-system, photos-stepping: 219 passed (chromium, firefox, production build); 'view=grid' count 0 in both specs"
        status: pass
    human_judgment: false
  - id: D4
    description: "Record-only region and film-scan photo page LCP in the perf project (HOME-08 profile)"
    requirement: "PHOTO-06"
    verification:
      - kind: e2e
        ref: "e2e/perf/photo-baseline.spec.ts listed by --project=perf; one-sample local structural run passed (numbers discarded)"
        status: pass
    human_judgment: false

metrics:
  duration: "about 30 min of execution (20:12Z to 20:40Z 2026-11-25), plus the pause for Tim's Rule-4 answer"
  completed: 2026-11-25
---

# Phase 18 Plan 19: Stage sizes from the tiers, preload in the loaded format, lightbox tests off the grid Summary

**The viewer stage now declares `sizes` from the lightbox tiers (`stageSizes(ar, variant)`: gutter from 1280x640, key from 768x640, each capped by the stage height times the ratio; scroll tier capped at 70vh times the ratio), and the neighbour preload fetches the format the stage actually loaded with each neighbour's own sizes. Every lightbox test in the lightbox and design-system specs now opens from the Zermatt region page's figure links instead of `/photos?view=grid`, with the same assertions on the same photos. A record-only LCP spec for the region and photo pages joins the perf project for 18-29's dispatch.**

## Performance

- **Duration:** about 30 min of execution (2026-11-25, 20:12 to 20:40 UTC), plus a pause for one Rule-4 decision
- **Tasks:** 3 (a tdd tracer, a tdd auto task, an auto task)
- **Files:** 1 created, 7 modified

## Accomplishments

- **`stageSizes(ar, variant)`** in `lib/photos/image-sizes.ts`. Every number derives from `lightbox-tiers.ts` and `NAV_PX`:
  - 1280 / 768 / 640 px come from `LB_GUTTER_MIN_REM`, `LB_KEY_MIN_REM` and `LB_MIN_HEIGHT_REM` × 16.
  - The gutter term subtracts `2 * LB_GUTTER_PX` = 432 px.
  - The stage height is the viewport less 120 px on the page (`NAV_PX + LB_CHROME_PX`) or 56 px in the dialog (`LB_CHROME_PX`).
  - The ratio is printed to four decimals, and the scroll tier uses `STAGE_SCROLL_VH` (70).
  - The strip is ignored on purpose (upper bound).
- **PhotoViewer:**
  - `STAGE_SIZES` is gone, and the stage takes `stageSizes(aspect.w / aspect.h, variant)`.
  - `preloadNeighbours(loadedImg)` derives `avif` from the loaded img's `currentSrc` and calls `preloadStage(view, stageSizes(view ratio, variant), avif)`.
  - That sets `img.srcset` to the neighbour's AVIF or WebP set. `fetchPriority` stays low and `decoding` async.
- **StagePhoto:** `onLargeLoad` passes the loaded large `<img>`. This covers the `onLoad` event and the pre-hydration path in the effect.
- **Openers (PHOTO-06):** `clickTile` / `openFirstTile` became `clickFigure(page, slug)` / `openFigure(page, slug = series[0].slug)` on `/photos/regions/zermatt`. Every close now returns to `ZERMATT_URL`. `GRID_LIST` and `GRID_URL` are removed. design-system's scroll-lock row opens from the Matterhorn figure link.
- **`e2e/perf/photo-baseline.spec.ts`:** HOME-08 profile (Pixel 7, 4x CPU, 1.6 Mbps / 150 ms), a fresh context per sample, and the last LCP entry of `/photos/regions/zermatt` and of the film-scan photo page. It writes medians to `PHOTO_LCP_OUT` (default `test-results/photo-baseline.json`), attaches them and logs `PHOTO-LCP: region <ms> ms, photo <ms> ms`. `PHOTO_LCP_RUNS` defaults to 5. It never asserts on the values.

## Task Commits

1. **Task 1 RED:** `ce942d3` test(18-19): stageSizes rows from the lightbox tiers (RED)
2. **Task 1 GREEN:** `4f684b9` feat(18-19): stage sizes from the lightbox tiers (13 #34, stage half)
3. **Task 2 RED:** `59ef4e8` test(18-19): the neighbour preload follows the stage's loaded format (RED)
4. **Task 2 GREEN:** `036a412` fix(18-19): preload neighbours in the stage's loaded format; open every lightbox test from the Zermatt sequence
5. **Task 3:** `38aa57c` test(18-19): record-only region and photo page LCP in the perf project
6. **Gate decision (Tim's A):** `5e495fe` test(18-19): judge stage over-fetch against the declared sizes slot (Tim's choice A)

## TDD Gate Compliance

- **Task 1 RED** `ce942d3`:
  - `stageSizes` was committed as a stub returning `''` (with `STAGE_SCROLL_VH` exported), so the suite loaded and only the new rows failed.
  - The rows: three spelled strings (3:2 page, dialog 56 px, 2:3 portrait), the constants-derivation row, the RangeError row, and the PhotoViewer parity row (`sizes={stageSizes(...)}` was absent).
  - The figureSizes and headerSlotSizes rows stayed green.
  - **Semantic assessment:** valid RED. Every failure was an assertion on the new behaviour; there were no load faults.
- **Task 1 GREEN** `4f684b9`: image-sizes and lightbox-tiers pass (37 rows today). The currentSrc gate passed in Chromium and Firefox.
- **Task 2 RED** `59ef4e8`: three photo-viewer rows.
  - The AVIF-stage row checks the AVIF set and the modal sizes. The WebP-stage row (page) checks the WebP sets and the page sizes; it failed because the preload took the AVIF set unconditionally (13 #33). The third row checks WebP in the lightbox and once-per-slug.
  - **Semantic assessment:** valid RED. The failures were the format and sizes assertions.
- **Task 2 GREEN** `036a412`: photo-viewer and lightbox-dialog pass.
- **REFACTOR:** none.
- Jest's console report is not a format the `tdd-red-evidence` classifier reads, and `workflow.tdd_mode` is off, so the classifier was not run. The exact RED failure counts were in the previous executor's return and are not re-measured here; the commit bodies and this section are the record.

## The gate decision (Rule 4, Tim's answer)

**The blocked row:** "Stage sizes at 375, 768 and 1440", page at 1440x900, WebKit (DPR 2).

- The photo paints at 783.7 px, so it needs 1567 device px.
- The sizes string resolves to 1008 px, the gutter term `calc(100vw - 432px)` (2016 device px).
- So WebKit picks 2560w where 1600w would cover the painting. That failed the original clause "the next smaller candidate would not have been enough".
- The behaviour was the same before 18-19: the old `STAGE_SIZES` gave the same 1008 px at 1440.
- The other 17 rows passed in every engine.

**Tim's answer (AskUserQuestion, 2026-11-25):** "A: keep sizes, relax check (Recommended)": "Keep the plan's sizes strings (an upper bound, so they never under-fetch). The test keeps 'never under-fetch' strict and judges over-fetch against the declared sizes. Page 1440x900 DPR 2 still fetches 2560w as before. No layout or baseline change."

**What changed (`5e495fe`, test only):**

- `stageFit` resolves the declared slot in the page: a parenthesis-aware split of the `sizes` list, then the first entry whose media condition `matchMedia` matches (the last entry has none). Its length is measured by a fixed-position probe element.
- `expectFit` keeps `descriptor >= floor(painted × DPR)`, adds `declared > 0`, and now requires `nextSmaller < declared × DPR`.
- The doc comment cites Tim's answer and the reason: stageSizes ignores the variable-height strip on purpose, as an upper bound.

**Gate rows after the change (production build, all 18 pass):**

| Surface @ viewport | Chromium / Firefox (DPR 1) | WebKit webkit-2388 (DPR 2) |
|---|---|---|
| page 375x800 | painted 365 / 375, slot 375, 1024w | painted 375, need 750, slot 750, 1024w |
| page 768x900 | painted 724.3, slot 768, 1024w | need 1449, slot 1536, 1600w (next 1024w) |
| page 1440x900 | painted 783.7, slot 1008, 1024w | need 1567, slot 2016, **2560w (next 1600w)** |
| dialog 375x800 | painted 365 / 375, slot 375, 1024w | need 750, slot 750, 1024w |
| dialog 768x900 | painted 758 / 768, slot 768, 1024w | need 1536, slot 1536, 1600w (next 1024w) |
| dialog 1440x900 | painted 909.6, slot 1008, 1024w | need 1819, slot 2016, 2560w (next 1600w) |

1024w is the smallest candidate, so "next smaller 0" applies on every DPR 1 row. The gate compares physical pixels because 97091e8 (18-05) made every srcset `w` descriptor the file's pixel width rather than the long edge. Without that fix a portrait's descriptor would overstate its width by 4/3.

## Opener mapping (PHOTO-06: rewritten, never deleted)

Every row below opens the same photo it opened before. The grid showed the v2.0 four, which are Zermatt's `series[0..3]` in the same order: 0 matterhorn-from-zermatt, 1 gornerschlucht-waterfall, 2 matterhorn-glacier-trail, 3 riffelsee-reflection. So grid index *n* and `series[n]` are the same photo. Every close that asserted `GRID_URL` now asserts `ZERMATT_URL`. Focus-return rows assert `data-photo-id` on the figure link, the same attribute the grid tile carried.

| Spec › describe › test (new title; old title if changed) | Old opener | New opener |
|---|---|---|
| lightbox › LBOX-01 › a figure click opens the photo in a dialog over the region page (was: a tile click … over the grid) | `openFirstTile` (grid tile 0) | `openFigure` (series[0], matterhorn-from-zermatt); "behind" check is `section[data-region-sequence]` instead of the grid list |
| lightbox › LBOX-01 › Back closes it, Forward reopens it, reload lands on the full page | `openFirstTile` | `openFigure` (series[0]) |
| lightbox › LBOX-01 › the Close photo button closes it and the URL returns to the region page (was: … to the grid) | `openFirstTile` | `openFigure` (series[0]) |
| lightbox › LBOX-03 › focus moves to Close photo on open | `openFirstTile` | `openFigure` (series[0]) |
| lightbox › LBOX-03 › Tab and Shift+Tab, 12 presses each, keep focus inside the dialog | `openFirstTile` | `openFigure` (series[0]) |
| lightbox › LBOX-03 › Tab stays inside the dialog while the gutter labels are still hidden | `openFirstTile` | `openFigure` (series[0]) |
| lightbox › LBOX-03 › Escape closes through the router and focus returns to the photo figure link (was: … photo tile) | `openFirstTile` | `openFigure` (series[0]) |
| lightbox › LBOX-03 › three open-and-Escape cycles in a row each close with the URL in sync | grid + `clickTile(page, 0)` ×3 | Zermatt + `clickFigure(page, first.slug)` ×3 |
| lightbox › LBOX-03 › opening from a scrolled region page and closing leaves the scroll position unchanged (was: … scrolled grid …) | grid + tile nth(2) centred, `clickTile(page, 2)` | Zermatt + figure series[2] (matterhorn-glacier-trail) centred, `clickFigure` |
| lightbox › LBOX-02 › Next presses to the last photo: URL, title, counter, focus and no history entry | `openFirstTile` | `openFigure` (series[0]) |
| lightbox › LBOX-02 › the arrow keys step, and nothing moves past either end | `openFirstTile` | `openFigure` (series[0]) |
| lightbox › LBOX-02 › preload: opening a photo fetches the next photo derivative before Next is pressed | grid tile nth(0) + `waitForRequest` on the AVIF set | Zermatt + `clickFigure(series[0])`; records the viewer's `new Image()` preloads and checks one loaded series[1]'s derivative in the stage's format, and none asked for the other format (see Deviations 2) |
| lightbox › LBOX-02 › a touch swipe on the photo steps to the next photo | `openFirstTile` | `openFigure` (series[0]) |
| lightbox › LBOX-02 › closing after two steps returns focus to the figure link of the photo shown (was: … tile …) | `openFirstTile` | `openFigure` (series[0]); focus on series[2] |
| lightbox › LBOX-02 › browser Back right after a step returns focus to the figure link of the photo shown (10-REVIEW WR-01) (was: … tile …) | `openFirstTile` | `openFigure` (series[0]); focus on series[1] |
| lightbox › LBOX-06 › opening from the sequence morphs the figure into the lightbox photo (was: opening from the grid morphs the tile …) | grid + `clickTile(page, 0)` | Zermatt + `clickFigure(first.slug)`; P4 default: the figure's photo-{slug} morph |
| lightbox › LBOX-06 › browser Back closes with no view transition | `openFirstTile` | `openFigure` (series[0]) |
| lightbox › LBOX-06 › a step morphs nothing: no photo-* pseudo-element | `openFirstTile` | `openFigure` (series[0]) |
| lightbox › LBOX-06 › no duplicate view-transition-name across open, three steps and close | `openFirstTile` | `openFigure` (series[0]) |
| lightbox › LBOX-06 › under reduced motion the open runs no view-transition animation | grid + `clickTile(page, 0)` | Zermatt + `clickFigure(first.slug)` |
| lightbox › LBOX-06 › without the View Transitions API the figure still opens with focus on Close (was: … the tile still opens …) | grid + `clickTile(page, 0)` | Zermatt + `clickFigure(first.slug)` |
| lightbox › Zoom (D-06) › 6 rows via `openZoomPhoto` (Z zooms to 1:1…; the arrows pan 80 px…; Escape twice from zoomed closes…; a click zooms at the point…; Next photo while zoomed…; native pinch-zoom is never blocked…) | grid + `clickTile(page, zi)`, zi = 0 | Zermatt + `clickFigure(photo.slug)` = series[0]; the Escape-twice row asserts `ZERMATT_URL` |
| lightbox › Hotspots (LBOX-05) › 11 rows via `openTrail` (gutter tier Enter/Escape; H hides labels…; the Hide labels button…; showing labels again…; from zoomed with a callout open… (D-22); a step collapses…; key tier…; scroll tier 375x800…; leader lines…; at 375 the chrome groups fit 343 px…; the strip legend…) | grid + `clickTile(page, trail)`, trail = 2 | Zermatt + `clickFigure(series[trail].slug)` = matterhorn-glacier-trail (img-0662) |
| design-system › Scrollbar › scroll lock keeps the header box @chromium-only @prod-only | `/photos?view=grid`, first tile of "Photographs, lowest first" | `/photos/regions/zermatt`, `[data-photo-id="matterhorn-from-zermatt"]` (`SLUGS.matterhornFromZermatt`), same hydration poll |

That is 38 lightbox tests plus the design-system row. `grep -c "view=grid"` now prints 0 in both specs. Prettier also reflowed three unrelated statements in design-system.spec.ts when the file was touched; those changes are formatting only.

## Count gate (GUARD-03)

```
before (18-18 post-plan fix): jest 2763 + e2e 822 = 3585
after  (18-19, 5e495fe):     jest 2772 + e2e 829 = 3601 (baseline 3024) OK
```

The counts come from `scripts/guards/test-count.mjs` with `jest --json` and a CI-mode `playwright test --list --reporter=json`, re-counted after the gate change. The gate change adds no test.

- Jest +9: 6 stageSizes rows and 3 preload rows.
- e2e +7: 6 stage-fit rows and the perf spec.
- The previous executor reported 818 e2e (3,590) from a different listing. This re-count with the guard's own listing is the authoritative number.

## Client JS (record only; the cap is enforced at 18-25 and 18-29)

The byte sum of `.next/static/chunks/**/*.js` from the last production build (21:33 local, source identical to HEAD apart from the e2e spec) is **1,866,936 B** across 25 files.

- That is +466 B over the 18-18 post-fix 1,866,470 B, and +11,095 B over the cap of 1,855,841 B.
- The growth is in the PhotoViewer chunk: `stageSizes` and its tier constants, `loadedAvif`, and the preload's format branch.

## Baselined shots

**None expected to change.** All visual projects run at DPR 1. At 375, 768 and 1440 both the old `STAGE_SIZES` and the new `stageSizes` pick 1024w on the page and in the dialog (the gate's DPR 1 rows above), so `photo/*` and `lightbox/*` fetch the same file. The figure and header-slot strings are untouched (prohibition resolved; their image-sizes rows pass unchanged), so no region shot moves. The preload is invisible. No PNG was staged and `--update-snapshots` was never run.

## Verification

- **Jest:**
  - Full suite: 131 suites, **2,772 passed**, 0 failed, 0 pending.
  - Plan suites (image-sizes, lightbox-tiers): 37 passed.
  - `npm run type-check` exit 0 (all three configs). eslint and prettier are clean on the changed spec.
- **Production e2e (`PW_PROD=1`), after the gate change:**
  - `-g currentSrc` in chromium, firefox and local webkit (webkit-2388): **18 passed**, 0 unexpected, 0 flaky.
  - photos-lightbox, design-system and photos-stepping in chromium and firefox: **219 passed**, 0 failed.
- **Task 3:**
  - `npx playwright test --project=perf --list` lists photo-baseline.spec.ts.
  - The one-sample local structural run (`PW_PROD=1 PHOTO_LCP_RUNS=1 PHOTO_LCP_OUT=test-results/photo-baseline-local.json`) passed with `runs 1` and both medians > 0.
  - It is a local structural run, not a dispatch, so its numbers are discarded and never a baseline. Later Playwright runs have since cleared `test-results/`.
  - The first real baseline is 18-29's declared perf dispatch. `home-baseline.spec.ts` was not run.
- **check-snapshot-commit --none:** OK (0 changed) on every task commit and on `5e495fe`.
- `public/service-worker.js` was restored after every build, and port 3000 was free after every run.
- **Acceptance greps:**
  - `STAGE_SIZES` code lines in PhotoViewer.tsx: 0.
  - `export function stageSizes`: 1.
  - `view=grid` in photos-lightbox.spec.ts and design-system.spec.ts: 0 and 0.
  - `srcSetAvif` in PhotoViewer.tsx: at least 1.
  - `PHOTO-LCP` in photo-baseline.spec.ts: at least 1.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] StagePhoto.tsx changed (not in the plan's file list)**
- **Found during:** Task 2
- **Issue:** The preload must read the stage's loaded `currentSrc`, but `onLargeLoad` took no argument.
- **Fix:** `onLargeLoad?: (img: HTMLImageElement) => void`. Both the `onLoad` handler and the pre-hydration effect path pass the large img. This is the plan's own action ("Make StagePhoto's onLargeLoad pass the loaded large img"); only the file list missed it.
- **Commit:** 036a412

**2. [Rule 1 - Test validity] The preload row no longer waits on the network**
- **Found during:** Task 2
- **Issue:** On the Zermatt page the sequence figures load the same derivatives the preload asks for, so a `waitForRequest` on series[1]'s URLs could be satisfied by a figure and prove nothing.
- **Fix:** An init script records every `new Image()` the page creates. The row polls until one preload has loaded a series[1] derivative in the stage's format, and checks that no preload's srcset names the other format.
- **Commit:** 036a412

**3. [Rule 2 - Drift guard] STAGE_SCROLL_VH = 70 as a named constant with a parity scan**
- **Found during:** Task 1
- **Issue:** The scroll tier's 70vh cap mirrors PhotoViewer's `70svh` photo box. The plan derives every other number from constants, but this one had none.
- **Fix:** It is exported from image-sizes.ts. An image-sizes.test row scans PhotoViewer.tsx for the 70svh cap and for `sizes={stageSizes(`.
- **Commits:** ce942d3, 4f684b9

**4. [Rule 4 - Tim's decision] The gate's over-fetch clause** (see "The gate decision")
- **Found during:** Task 1's gate in local WebKit
- **Change:** Option A. The sizes strings are unchanged; over-fetch is judged against the declared slot × DPR, and under-fetch stays strict.
- **Commit:** 5e495fe

## Known Stubs

None. The RED stub in `lib/photos/image-sizes.ts` (`ce942d3`, returning `''`) was replaced in `4f684b9`.

## Threat Flags

None. No new endpoint, auth path or schema boundary.

- **T-18-40** is mitigated: stageSizes comes from the tiers, and the currentSrc gate runs at three widths on both surfaces in three engines. Under-fetch is strict; over-fetch is bounded by the declared slot.
- **T-18-41** is mitigated: the preload uses only the view's manifest `srcSetAvif` / `srcSetWebp` and `stage.src`.

## Deferred Issues

None new.

## Requirements

**LBOX-09 and PHOTO-06 stay Pending.** This plan is not the last carrier of either:

- LBOX-09 is also declared by 18-20 and 18-29.
- PHOTO-06 is declared by 18-21 through 18-29. 18-21 moves the audit and SEO openers, and 18-22 redirects `?view=grid`.

The last carrier and the phase verifier mark them.

## Self-Check: PASSED

- FOUND: e2e/perf/photo-baseline.spec.ts, lib/photos/image-sizes.ts, this SUMMARY
- FOUND: ce942d3, 4f684b9, 59ef4e8, 036a412, 38aa57c, 5e495fe (ancestors of HEAD)
- Acceptance greps re-run: STAGE_SIZES code lines 0; srcSetAvif 1; PHOTO-LCP 2; view=grid 0 and 0; photo-viewer + lightbox-dialog 51/51
