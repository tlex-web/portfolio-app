---
phase: 18-immersive-survey-layout
plan: 21
subsystem: testing
tags: [e2e, photo-06, region-pages, lightbox, audit, keyboard, guard-03]
status: complete

requires:
  - phase: 18-08
    provides: "region pages with the sequence; the ratio row that the two true-ratio grid rows retire onto"
  - phase: 18-16
    provides: "region stepping with the end card ('End of the Zermatt series', counter 'End')"
  - phase: 18-20
    provides: "the viewer as baselined (Share in the top bar from 768)"
provides:
  - "green successors on the region pages for every grid, carousel and grid-lightbox e2e row outside 18-22's scope, mapped one to one"
  - "audit states 'Zermatt sequence' and 'lightbox end card' at 375/768/1440 (PhotoState with key, label and an optional open step)"
  - "photos-sweep openFigure(page, slug) and regionSettled(page) helpers"
affects: [18-22, 18-25, 18-29]

actuals:
  tokens: 11700    # chars/4 over git diff 2b04135..b6f9c75 (46,863 chars incl. context)
  tasks: 2
  commits: 2       # git rev-list --count 2b04135..b6f9c75; the metadata commit follows
plan_head_before: 2b04135da357d1421c4b64e9dbe862b8aa4d8538
plan_head_after: b6f9c75297121a70223a511ef406c1ff4c076e50

tech-stack:
  added: []
  patterns:
    - "A region surface settles on a positive signal: data-rail-current from 768 px, the sequence images complete below"
    - "An audit state is data: { key, label, path, open?, shown }, so a successor state is one array entry"

key-files:
  created: []
  modified:
    - e2e/keyboard.spec.ts
    - e2e/photos-sweep.spec.ts
    - e2e/photos.spec.ts
    - e2e/photos-region.spec.ts
    - e2e/audit.spec.ts
    - e2e/no-webgl.spec.ts
    - e2e/seo.spec.ts

key-decisions:
  - "18-21: The keyboard row reaches the first figure by Tab alone (a bounded Tab loop to 'Skip to next region', the sequence head, then one Tab), keeping keyboard.spec's no-click, no-focus() contract"
  - "18-21: Sweep surface mapping: the grid maps to the Zermatt region page, the carousel stepper to the Ortler and Saalfelden region pages, the four photo pages keep their titles and seven more join, and the lightbox over the grid becomes the lightbox over the Zermatt region page"
  - "18-21: 'the region page takes focus back on the photo shown at close' carries @no-win-webkit. Local Windows WebKit closed the page at the Escape after two Next steps, the known 18-16 soft-navigation crash. Chromium, Firefox and CI's Linux WebKit run it"
  - "18-21: The 'Zermatt sequence' and 'lightbox end card' audit states start untagged and pass in Firefox. FIREFOX_43967_VIEWS is now {'Map'}"

requirements-completed: []  # PHOTO-06 runs through 18-29 (18-22 retires the views); left for the phase verifier

coverage:
  - id: D1
    description: "Keyboard walk from the Zermatt region page's first figure: Enter opens the lightbox on Close photo, Tab stays inside, the arrows step, Escape returns focus"
    requirement: "PHOTO-06"
    verification:
      - kind: e2e
        ref: "e2e/keyboard.spec.ts 'Region page and lightbox by keyboard (1440)' (chromium, firefox)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The sweep's surfaces, focus return and lightbox path run on the region pages"
    requirement: "PHOTO-06"
    verification:
      - kind: e2e
        ref: "e2e/photos-sweep.spec.ts (chromium, firefox; 91 with keyboard.spec)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Grid view rows rewritten as Zermatt sequence rows; the two true-ratio rows retire onto 18-08's ratio row"
    requirement: "PHOTO-06"
    verification:
      - kind: e2e
        ref: "e2e/photos-region.spec.ts 'Grid view rewritten: the Zermatt sequence (PHOTO-06)' (chromium, firefox, local webkit)"
        status: pass
      - kind: other
        ref: "allowance gate: jest 2782 -> 2782, e2e 829 -> 843 (floor 827); npm run guard:tests OK (3625 >= 3024)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Audit, no-WebGL and SEO rows run from the region page"
    requirement: "PHOTO-06"
    verification:
      - kind: e2e
        ref: "e2e/audit.spec.ts, e2e/no-webgl.spec.ts, e2e/seo.spec.ts (chromium, firefox; each new row twice with --repeat-each=2)"
        status: pass
    human_judgment: false

metrics:
  duration: "about 16 min (14:18Z to 14:34Z 2026-11-26)"
  completed: 2026-11-26
---

# Phase 18 Plan 21: View-test successors on the region pages (PHOTO-06) Summary

**The e2e rows that tested the Grid or Carousel view, or opened the lightbox from the grid, now run on the region pages. 18-22 can retire the views without leaving a test behind. Each old test maps to one successor. The one exception is the two grid true-ratio rows, which retire onto 18-08's ratio row as the plan declared. Jest stays at 2,782 and e2e goes from 829 to 843.**

## Performance

- **Duration:** about 16 min (2026-11-26, 14:18 to 14:34 UTC)
- **Tasks:** 2 (a tracer and an auto task)
- **Files:** 7 modified, all under `e2e/`. No source file changed, no PNG.

## Accomplishments

- **keyboard.spec:** The keyboard row now starts on `/photos/regions/zermatt`. It Tabs to 'Skip to next region', and one more Tab reaches the first figure's link. Enter opens the dialog with focus on Close photo. Twelve Tab and twelve Shift+Tab presses stay inside the dialog. The arrow keys step through `regionPhotoViews('zermatt')`, and Escape returns focus to the figure link.
- **photos-sweep.spec:**
  - The surfaces are now the map, the three region pages, all 11 published photo pages and the lightbox over the Zermatt region page. A region page settles on `data-rail-current="1"` from 768 px and on its sequence images completing below 768.
  - Focus return and the lightbox path end to end both open from the Zermatt figures.
  - The callout photo is the one with the most hotspots among the first four of the series (the Glacier Trail, two hotspots).
- **photos.spec to photos-region.spec:** The new 'Grid view rewritten: the Zermatt sequence (PHOTO-06)' describe has four rows: order and hrefs, one column at 375, hashed derivatives, and the first figure opening the lightbox.
- **audit.spec:**
  - The Glacier Trail lightbox now opens from its figure (`SLUGS.matterhornGlacierTrail`).
  - The new 'Zermatt sequence' state centres the middle figure and waits for the rail to read 4. The new 'lightbox end card' state opens the last figure and presses Next until the counter reads End.
  - `buildPhotoViews` and `views` are gone from the file.
- **no-webgl.spec and seo.spec:** Both open the lightbox from the Zermatt region page.

## Task Commits

1. **Task 1: keyboard walk and the two sweep paths from a figure link (tracer)** - `b4194f3` (test)
2. **Task 2: grid rows, sweep surfaces, audit states, no-WebGL and SEO rows** - `b6f9c75` (test)

The metadata commit follows.

## Mapping table (old test → successor, PHOTO-06)

Titles are given as describe › test. The table has one row per old test. Seven specs are touched.

| # | Spec | Old test | Successor | Plan |
|---|---|---|---|---|
| 1 | keyboard.spec | Photo map and lightbox by keyboard (1440) › Enter on a map target opens the lightbox on Close photo; Tab stays inside; arrows step; Escape returns focus | Region page and lightbox by keyboard (1440) › Enter on a figure link opens the lightbox on Close photo; Tab stays inside; arrows step; Escape returns focus | 18-21 |
| 2 | photos-sweep.spec | 375 overflow (…) › no horizontal overflow at 375 on every photo surface: the grid (?view=grid) | same describe › … : the region page /photos/regions/zermatt | 18-21 |
| 3 | photos-sweep.spec | 375 overflow (…) › … : the carousel stepper (?view=carousel) | same describe › … : the region page /photos/regions/ortler, and … : the region page /photos/regions/saalfelden | 18-21 |
| 4 | photos-sweep.spec | 375 overflow (…) › … : the photo page /photos/{4 v2.0 slugs} (4 rows) | the same 4 titles, plus 7 new photo-page rows (every published photo) | 18-21 |
| 5 | photos-sweep.spec | 375 overflow (…) › … : the lightbox over the grid | same describe › … : the lightbox over the Zermatt region page | 18-21 |
| 6 | photos-sweep.spec | Served images (…) › every image is a hashed derivative and nothing offers a download: the grid (?view=grid) | same describe › … : the region page /photos/regions/zermatt | 18-21 |
| 7 | photos-sweep.spec | Served images (…) › … : the carousel stepper (?view=carousel) | same describe › … : the region page /photos/regions/ortler, and … /photos/regions/saalfelden | 18-21 |
| 8 | photos-sweep.spec | Served images (…) › … : the photo page /photos/{4 v2.0 slugs} (4 rows) | the same 4 titles, plus 7 new photo-page rows | 18-21 |
| 9 | photos-sweep.spec | Served images (…) › … : the lightbox over the grid | same describe › … : the lightbox over the Zermatt region page | 18-21 |
| 10 | photos-sweep.spec | Focus return from the carousel (10-UI-SPEC Focus "Return on close") › the carousel takes focus back on the photo shown at close | Focus return on the region page (10-UI-SPEC Focus "Return on close"; LBOX-08) › the region page takes focus back on the photo shown at close @no-win-webkit | 18-21 |
| 11 | photos-sweep.spec | The lightbox path end to end (10-UI-SPEC E5 populated) › the lightbox path end to end (UI-SPEC E5) @no-win-webkit | same title, rewritten in place (steps 2, 3, 6 and 7 on the Zermatt region page) | 18-21 |
| 12 | photos.spec | Grid view (PHOTO-02, PHOTO-03, D-15) › lists the four photos in the canonical order | photos-region.spec › Grid view rewritten: the Zermatt sequence (PHOTO-06) › the Zermatt sequence lists its photos in regionPhotoViews order with their photo hrefs | 18-21 |
| 13 | photos.spec | Grid view (…) › at 768 x 900: two rows of two, one height per row, true ratios | photos-region.spec › Region sequence at 375, 768 and 1440 (18-08; REGION-03, REGION-04, D-07, 13 #34) › /photos/regions/zermatt at 768: no overflow; every figure uncropped, ticks off the image, sized right (**declared allowance, 1**) | 18-08 |
| 14 | photos.spec | Grid view (…) › at 1440 x 900: two rows of two, one height per row, true ratios | photos-region.spec › Region sequence at 375, 768 and 1440 (18-08; …) › /photos/regions/zermatt at 1440: no overflow; every figure uncropped, ticks off the image, sized right (**declared allowance, 1**) | 18-08 |
| 15 | photos.spec | Grid view (…) › at 375 x 800: one column and no horizontal overflow | photos-region.spec › Grid view rewritten: … › at 375 x 800 the Zermatt sequence is one column with no horizontal overflow | 18-21 |
| 16 | photos.spec | Grid view (…) › every tile image is a content-hashed manifest derivative | photos-region.spec › Grid view rewritten: … › every Zermatt sequence image is a content-hashed manifest derivative | 18-21 |
| 17 | photos.spec | Grid view (…) › clicking the first tile opens its photo in the lightbox (LBOX-01) | photos-region.spec › Grid view rewritten: … › clicking the first Zermatt figure opens its photo in the lightbox (LBOX-01) | 18-21 |
| 18 | audit.spec | Audit: interactive states (D-21) › state "lightbox, hotspots on" /photos?view=grid @1440 | same describe › state "lightbox, hotspots on" /photos/regions/zermatt @1440 | 18-21 |
| 19 | audit.spec | … › state "lightbox, hotspots off" /photos?view=grid @1440 | same describe › state "lightbox, hotspots off" /photos/regions/zermatt @1440 | 18-21 |
| 20 | audit.spec | … › state "photos Grid view" /photos?view=grid @375/768/1440 | same describe › state "Zermatt sequence" /photos/regions/zermatt @375/768/1440 | 18-21 |
| 21 | audit.spec | … › state "photos Carousel view" /photos?view=carousel @375/768/1440 @firefox-43967 | same describe › state "lightbox end card" /photos/regions/zermatt @375/768/1440 (untagged, passes in Firefox) | 18-21 |
| 22 | no-webgl.spec | Without WebGL › photos carousel falls back to the stepper | Without WebGL › the region page and the photo viewer need no WebGL | 18-21 |
| 23 | seo.spec | JSON-LD on every page (SEO-04; D-16, SC4) › the lightbox adds no JSON-LD @chromium-only | same title, rewritten in place (opens from the Zermatt region page's first figure) | 18-21 |

The following rows stay as they are for 18-22:
- keyboard.spec '/photos walk' ('Tab reaches the view switcher, then the map targets …')
- photos-sweep's map surface and its Console row (switchTo)
- audit.spec's 'photos Map view' state
- seo.spec '/photos?view=grid canonicalises to /photos'
- photos.spec's Map view and View switcher describes

**Allowance gate (GUARD-03 per plan), copied from the end gate:**

```
jest 2782 -> 2782 (allowance 0, floor 2782)
e2e 829 -> 843 (allowance 2, floor 827)
```

`npm run guard:tests`: `jest 2782 + e2e 843 = 3625 (baseline 3024)`, OK. At plan start both declared Grid view titles were listed (2 of 2, the pinned R_e2e 2). How the e2e change adds up:
- The sweep's two surface loops grow from 8 rows each to 16, which adds 16.
- photos.spec loses its 6 Grid view rows, and photos-region.spec gains 4, which removes 2.
- The total is +14.

## Test runs

- **Task 1:** keyboard.spec and photos-sweep.spec on the production build, Chromium and Firefox: 91 passed, none flaky.
- **Task 2:** all seven specs on the production build, Chromium and Firefox: 481 passed and 1 failed. The failure was the known local-only Firefox `/offline` audit row (axe `Page crashed`). It is not an 18-21 row.
- **Repeat run:** every new or rewritten row in audit, region, no-webgl and seo ran again with `--repeat-each=2`: 38 passed.
- **Local Windows WebKit probe:** 9 of 9 new Task 2 rows passed. In Task 1, every rewritten row passed except focus return, which is now tagged.
- **Other checks:** `npm run lint` (which includes guard:tests:scan), `npm run type-check` and `node scripts/ci/check-snapshot-commit.mjs --none` passed after each commit.
- **No new fixed sleeps:** no `waitForTimeout` was added. The one left in photos-sweep is in `switchTo`, which belongs to 18-22's Console row.

## Client JS

- **1,868,150 B in 25 files.** Measured on a clean build (`rm -rf .next/static`) with the source at b6f9c75. That is the same as 18-20, as expected for a test-only plan. It is still +12,309 B over the 1,855,841 B cap, which is enforced at 18-25.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking, test] The sweep's SURFACES and `visit` moved in Task 1, not Task 2**
- **Found during:** Task 1
- **Issue:** `visit` and the `openFigure` opener are shared by the surface loops and the two Task 1 paths. Leaving the grid surfaces in place would have kept `openTile` and the reduced-motion carousel wait, which Task 2 removes anyway.
- **Fix:** The surface change landed in the Task 1 commit. Task 2's photos-sweep work was then already done, and Task 2's verify ran it again.
- **Files modified:** e2e/photos-sweep.spec.ts
- **Commit:** b4194f3

**2. [Rule 1 - Test environment] @no-win-webkit on 'the region page takes focus back on the photo shown at close'**
- **Found during:** Task 1 (a local WebKit probe, which the plan did not require)
- **Issue:** Windows WebKit (WinCairo) failed with 'Target page, context or browser has been closed' at the Escape after two Next steps. This is the 18-16 soft-navigation crash.
- **Fix:** Added the existing tag with a comment that names the cause. No assertion was weakened. Chromium and Firefox pass, and CI's Linux WebKit runs the row.
- **Commit:** b4194f3

### Notes on how the plan was run

- The verify commands ran with `PW_PROD=1 PW_REUSE=1` against one production build served by `next start`, not a fresh build for each command. The plan changes tests only, so the build is the same either way. `public/service-worker.js` was restored after both builds, and the server was stopped afterwards (port 3000 is free).
- Some successors add assertions the old tests did not have:
  - focus return also checks that the figure is in the viewport
  - the SEO row checks the photo URL
  - the no-WebGL row checks the counter at 1 / 7 before Next

## Known Stubs

None.

## Next Phase Readiness

- 18-22 can retire the views. The forward notes list what is left on them (`scratchpad/forward-notes-18.md`):
  - the map walk
  - the Console row
  - the map surface
  - the Map audit state
  - the canonical row
  - the Map and View switcher describes

  keyboard.spec and photos-sweep still import `buildPhotoViews` only for those rows.
- **CI watch:** the focus-return row's `@no-win-webkit` tag rests on the WinCairo crash. If Linux WebKit in CI also fails it, that is the 18-16 risk to a real Safari.

## Self-Check: PASSED

- FOUND: b4194f3, b6f9c75 (both ancestors of HEAD)
- FOUND: e2e/keyboard.spec.ts ('Enter on a figure link opens the lightbox' x1), e2e/photos-sweep.spec.ts ('the region page takes focus back on the photo shown at close' x1), e2e/photos-region.spec.ts ('Grid view rewritten'), e2e/audit.spec.ts ('lightbox end card', 'End of the')
- Acceptance greps: audit view=(grid|carousel) 0, no-webgl 0, sweep view=carousel 1, seo view=grid 2, photos.spec 'Grid view (PHOTO-02' 0, audit buildPhotoViews 0
