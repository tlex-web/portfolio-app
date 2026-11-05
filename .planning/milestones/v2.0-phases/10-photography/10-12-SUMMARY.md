---
phase: 10-photography
plan: 12
subsystem: testing
tags: [playwright, e2e, visual-regression, guard-02, lightbox, view-transitions, overflow, lbox-07]

requires:
  - phase: 10-photography (10-09)
    provides: "The 'View' switcher group (Map, Grid, Carousel), the keyed photos-view crossfade, the legacy grid/3D toggle deleted"
  - phase: 10-photography (10-11)
    provides: "The complete viewer: [data-hotspot-label] callouts, 'Hide labels', the callout -> zoom -> close Escape chain"
  - phase: 10-photography (10-05..10-08)
    provides: "The lightbox dialog over the grid, focus return to [data-photo-id], the carousel stepper and 'Open photo', the map sheet ([data-map-mark])"
provides:
  - "e2e/visual/routes.spec.ts: routes photos-grid, photos-carousel and photo (the film scan's page) at 375/768/1440, the lightbox viewport shots at 375/768/1440, a map-aware contours-hero wait, and a settle() that awaits only rendered images"
  - "e2e/visual/README.md: the route slug list, the 48-test count and the --allow set for the 10-13 re-baseline"
  - "e2e/photos-sweep.spec.ts: 375 overflow, hashed image sources and no download control on 8 surfaces; the removeChild console assertion across view switches; the carousel focus return; the E5 lightbox composite"
affects: [10-13, visual baselines, phase-12-verify]

actuals:
  tokens: 6400
  tasks: 2
  commits: 2
plan_head_before: 97721a433d1f4cd773eddb30a7b94ebdce22a8c3
plan_head_after: ebe05690ad1eade06497341b1588266324787c31

tech-stack:
  added: []
  patterns:
    - "A settle wait over document.images skips images with no layout box (getClientRects().length === 0): a lazy image in a display: none wrapper is never fetched, so its `complete` never turns true"
    - "Surface sweeps as one Surface[] table (url, reduced motion, open the lightbox), one parametrized test per surface and per check, so a failure names the surface"

key-files:
  created:
    - e2e/photos-sweep.spec.ts
  modified:
    - e2e/visual/routes.spec.ts
    - e2e/visual/README.md
    - .planning/phases/09-home-ascent/deferred-items.md

key-decisions:
  - "10-12: settle() waits only for rendered images. The map's hover previews (data-map-preview) are lazy images in a `hidden` wrapper, never fetched, so the existing wait hung every /photos shot (all three timed out at 30 s on the dev server). This was already true at HEAD since 10-08 and would have failed the 10-13 photos re-baseline"
  - "10-12: the sweep is parametrized, one test per surface and check (8 overflow, 8 served-image, 1 console, 1 focus, 1 composite: 19 chromium, 18 firefox), not one looping test per check, so a failure names its surface"
  - "10-12: the console fault pattern also matches React's dev warning 'ViewTransition name=' (as photos-lightbox.spec.ts does), on top of the plan's removeChild | not a child | view-transition-name; page errors are collected too"
  - "10-12: the E5 composite derives its callout photo as the view with the most hotspots and steps back to it with Previous after the three Next presses, so the photo shown at close (and the focus target) comes from buildPhotoViews()"

patterns-established:
  - "Visual smoke without baselines: `--update-snapshots=none` runs every shot to its screenshot step and fails only on the missing PNG, so nothing is written locally"

requirements-completed: [PHOTO-02, LBOX-01, LBOX-02, LBOX-03, LBOX-07]

coverage:
  - id: D1
    description: "Visual spec names every new photo surface with explicit snapshot arrays: photos-grid, photos-carousel (stepper under reduced motion), photo (the film scan's page) at 375/768/1440 and lightbox at 375/768/1440; 'photos' keeps its names; canvases stay hidden via stylePath"
    requirement: PHOTO-02
    verification:
      - kind: other
        ref: "npx playwright test e2e/visual/routes.spec.ts --list --project=visual-dark (36 -> 48 tests)"
        status: pass
      - kind: automated_ui
        ref: "PW_PROD=1 npx playwright test e2e/visual/routes.spec.ts --project=visual-dark --update-snapshots=none (48/48 reach toHaveScreenshot; each fails only with 'A snapshot doesn't exist')"
        status: pass
    human_judgment: false
  - id: D2
    description: "settle() waits for the hashed contours-hero SVG wherever [data-map-mark] or [data-ascent-stage] renders, and awaits only rendered images, so the map shots settle"
    requirement: PHOTO-02
    verification:
      - kind: automated_ui
        ref: "visual-dark 'photos @375/@768/@1440 reduced' on the dev server and the production build: reach the screenshot step (before the fix: 30 s timeout in settle)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No horizontal overflow at 375 on /photos, ?view=grid, ?view=carousel, every /photos/{slug} and the lightbox (document and dialog scrollWidth <= clientWidth)"
    requirement: PHOTO-02
    verification:
      - kind: e2e
        ref: "e2e/photos-sweep.spec.ts#375 overflow › no horizontal overflow at 375 on every photo surface: * (8 surfaces, chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every loaded image on the same 8 surfaces is a hashed /terrain/ asset or /images/photos/ derivative, and [download] has count 0"
    requirement: LBOX-07
    verification:
      - kind: e2e
        ref: "e2e/photos-sweep.spec.ts#Served images › every image is a hashed derivative and nothing offers a download: * (8 surfaces, chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Map -> Grid -> Carousel -> Grid -> Map and a grid open/close log no removeChild, 'not a child' or duplicate view-transition-name (STATE 07-19 carry-over, the 09 deferred carousel flake)"
    requirement: PHOTO-02
    verification:
      - kind: e2e
        ref: "e2e/photos-sweep.spec.ts#Console › view switches and photo open/close log no removeChild or duplicate-name errors @chromium-only"
        status: pass
    human_judgment: false
  - id: D6
    description: "From the carousel: Open photo, Next twice in the lightbox, Escape; focus is 'Open photo' with data-photo-id of the third photo and the counter reads '3 / 4'"
    requirement: LBOX-03
    verification:
      - kind: e2e
        ref: "e2e/photos-sweep.spec.ts#Focus return from the carousel › the carousel takes focus back on the photo shown at close"
        status: pass
    human_judgment: false
  - id: D7
    description: "E5 populated composite at 1440 x 900: direct load is the page surface with no dialog; grid click opens the dialog at /photos/<slug>; Back closes it; three steps keep history.length and focus on Next; Tab and Shift+Tab stay inside; Escape unwinds callout -> zoom -> close; focus returns to the tile of the photo shown at close"
    requirement: LBOX-01
    verification:
      - kind: e2e
        ref: "e2e/photos-sweep.spec.ts#The lightbox path end to end › the lightbox path end to end (UI-SPEC E5) (chromium + firefox)"
        status: pass
    human_judgment: true
    rationale: "The E5 statement includes 'Tab stays inside the dialog in ... local WebKit'. Local Playwright WebKit cannot hydrate localhost because of the CSP upgrade-insecure-requests header (10 deferred item, header left unchanged as instructed), and CI has no WebKit project. The Safari leg stays with Tim's real-Safari UAT check"

duration: 18min
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 12: Cross-view photos sweep and visual coverage Summary

**The visual suite now names every new photo surface for one 10-13 re-baseline: grid, carousel stepper, the film-scan photo page and the lightbox, 36 to 48 tests. A settle() fix lets the map shots settle at all. A new 37-run cross-view e2e sweep proves no 375 overflow, only hashed image derivatives, no removeChild or duplicate-name console errors across view switches, the carousel focus return and the full E5 lightbox path.**

## Performance

- **Duration:** about 18 min
- **Started:** 2026-10-26T15:30:22Z
- **Completed:** 2026-10-26T15:48:42Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified, counting the 09 deferred-items entry)

## Accomplishments

- **Visual routes (Task 1):**
  - `ROUTES` gains `['photos-grid', '/photos?view=grid']`, `['photos-carousel', '/photos?view=carousel']` and `['photo', '/photos/' + filmScan.slug]`. `filmScan` is `buildPhotoViews().find((v) => v.approximate)`, which is `riffelsee-reflection` today. The spec throws if no approximate view exists.
  - A `lightbox @{w}` loop (375, 768, 1440) runs under reduced motion at `w x 900`. It opens the first tile of 'Photographs, lowest first' (after hydration), waits for the dialog and for every image in it to decode, then shoots `['lightbox', '{w}.png']` (viewport, with `stylePath`).
  - The `visual-dark` list went from **36 to 48** tests (+12).
- **settle() changes:**
  - The contours-hero wait now runs whenever `[data-map-mark], [data-ascent-stage]` exists, not only on `/`. The footer strip wait is unchanged.
  - The image wait skips images with no layout box (see Deviations).
- **README:** the test count is now 48. The full route slug list is added. The unzip step names the new folders, and the `--allow` example gives the Phase 10 set: `--allow photos --allow photos-grid --allow photos-carousel --allow photo --allow lightbox`.
- **Sweep (Task 2), `e2e/photos-sweep.spec.ts`:**
  - **Surfaces:** one `Surface[]` table of the map, grid, carousel stepper (reduced motion), the four `/photos/{slug}` pages and the lightbox over the grid.
  - **Overflow:** at 375 x 800 the document has no sideways overflow on any surface, and the dialog has none on the lightbox.
  - **Images:** after a scroll pass and the rendered-image wait, every loaded image's `currentSrc` matches the plan's hashed-derivative regex. At least one image is loaded per surface (and inside the dialog), and `[download]` has count 0.
  - **Console (@chromium-only):** the page goes Map -> Grid -> Carousel -> Grid -> Map, then Grid, opens and Escape-closes the first tile, then Map. Motion is on, so the 3D carousel mounts and unmounts under SwiftShader. No console or page error may match `removeChild|not a child|view-transition-name|ViewTransition name=`.
  - **Carousel focus:** under reduced motion: Open photo, Next twice in the dialog, Escape. 'Open photo' then has focus, carries `data-photo-id` = `views[2].slug`, and the counter reads `3 / 4`.
  - **E5 composite at 1440 x 900:**
    1. A direct load shows the shell landmarks and the h1, with no dialog.
    2. A grid click opens the dialog at `/photos/<slug>`, and Back closes it.
    3. Three Next presses keep `history.length` the same and leave focus on Next.
    4. 12 Tab and 12 Shift+Tab presses stay inside the dialog.
    5. Previous steps back to the photo with the most hotspots. Enter expands its first label and Z zooms.
    6. Escape collapses the callout, then leaves zoom, then closes.
    7. Focus lands on that photo's tile.

## Task Commits

1. **Task 1: visual coverage for the map, grid, carousel, photo page and lightbox:** `249b484` (test)
2. **Task 2: cross-view photos sweep (overflow, sources, console, focus, lightbox path):** `ebe0569` (test)

**Plan metadata:** the docs(10-12) commit that follows this SUMMARY.

## Files Created/Modified

- `e2e/photos-sweep.spec.ts`: the cross-view sweep, 19 Chromium and 18 Firefox tests (new)
- `e2e/visual/routes.spec.ts`: three routes, the lightbox loop, the map-aware contours wait, the rendered-image settle
- `e2e/visual/README.md`: the 48-test count, the slug list, the new folders and the `--allow` set
- `.planning/phases/09-home-ascent/deferred-items.md`: the "should switch to 3D carousel view" removeChild flake is marked resolved (10-09 deleted the toggle, and 10-12 asserts the error away)

## Verification

- `npx playwright test e2e/visual/routes.spec.ts --list --project=visual-dark`: 48 tests (36 before). The list includes `photos-grid @*`, `photos-carousel @*`, `photo @*` and `lightbox @*`.
- Acceptance greps: `'photos-grid'` 1, `'lightbox'` 1, and `.skip(|.only(|.fixme(` in the sweep 0. The Chromium list of the sweep has 19 tests (at least 5 were required).
- `npm run lint` exits 0, with the 17 pre-existing warnings and none in these files. `npm run type-check` (`tsc --noEmit`) exits 0. The sweep passes `prettier --check`.
- **Sweep on the dev server:** first run 37/37 (16 workers). `--repeat-each=2` then failed 2 of 74, which led to the dev-timing fix below. After the fix, `--repeat-each=3` passed **111/111**.
- **Sweep on the production build (`PW_PROD=1`):** **37/37**, twice. The second run also had all 48 visual shots reach `toHaveScreenshot` with `--update-snapshots=none`, each failing only with "A snapshot doesn't exist".
  - No PNG was written or committed.
  - `public/service-worker.js` was restored after each build.
- `npx jest --json ... && node scripts/guards/test-count.mjs --jest jest-results.json`: jest 942 + e2e 352 = **1294** (baseline 966), OK.

## Decisions Made

See key-decisions in the frontmatter. No UI was built, so ui-ux-pro-max was not loaded, as the plan's context budget says.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] settle() hung on every /photos (map) shot**
- **Found during:** Task 1 (local smoke run of the photo shots)
- **Issue:** the existing `photos @375/@768/@1440 reduced` shots timed out at 30 s in `waitForFunction(every img.complete)`. A probe found that the map's four hover-preview images are `loading="lazy"` inside a `hidden` (display: none) wrapper (`data-map-preview`, MapSheet.tsx). Chromium never fetches them, so `complete` stays false. This dates from 10-08 (map as the default view) and would have failed the 10-13 photos re-baseline.
- **Fix:** settle() awaits `img.complete || img.getClientRects().length === 0`. An image with no layout box cannot appear in a screenshot. The sweep's image wait uses the same rule.
- **Files modified:** e2e/visual/routes.spec.ts
- **Verification:** the map shots reach the screenshot step on the dev server and the production build, and the existing `home` shot still reaches it as well.
- **Committed in:** `249b484`

**2. [Rule 1 - Test harness] View-switch wait too short for a loaded dev server**
- **Found during:** Task 2 (`--repeat-each=2` dev run with 16 workers)
- **Issue:** in the console test, Grid's `aria-pressed` was still "false" after 5 s. The dev overlay showed "Rendering...", because the pressed state comes with the server render of the replaced URL. The test passed alone and on the production build. This is the same dev cross-talk family as the 10-01, 10-06, 10-07 and 10-09 deferred items.
- **Fix:** the switch wait uses `{ timeout: 15000 }`, the budget the other photo specs use for dev compiles. No assertion changed.
- **Files modified:** e2e/photos-sweep.spec.ts
- **Verification:** dev `--repeat-each=3` 111/111; production 37/37
- **Committed in:** `ebe0569`

**3. [Rule 2 - Strengthened check] The console pattern also catches React's ViewTransition dev warning**
- **Found during:** Task 2
- **Issue:** React's dev warning for two mounted `<ViewTransition>` boundaries with one name reads 'ViewTransition name=', which the plan's `view-transition-name` regex does not match.
- **Fix:** the pattern is `/removeChild|not a child|view-transition-name|ViewTransition name=/i`, as in photos-lightbox.spec.ts. Page errors are collected too.
- **Committed in:** `ebe0569`

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 test harness, 1 strengthened check). **Impact:** test code only, with no product change. Fix 1 is required for 10-13 to baseline the map at all.

## Issues Encountered

- **Shell escaping:** a node heredoc edit could not match the settle() regex block, because the backslashes were halved on the Windows command-line round-trip. Nothing was written, and that edit was redone with the Edit tool.
- **npx fetch:** one `npx tsx -e …` call, used only to print the four slugs, downloaded `tsx@4.23.15` into the npx cache. It changed no project file (`package.json` and the lockfile are untouched), and the slugs were then read from the spec list. Noted so the download is on record.
- **WebKit not run:** local Playwright WebKit cannot hydrate localhost because of the CSP `upgrade-insecure-requests` header (10 deferred item). That header is left unchanged, as instructed. The E5 statement's "local WebKit" Tab leg is unverified here, and an `unrun-verify` entry was appended to `.planning/WINDOWS.md`.
- **Pre-existing, not touched:** `e2e/visual/routes.spec.ts` was already off the repo's Prettier style (trailing commas) before this plan. The new lines follow the file's style, and the file was not reformatted.

## STATE carry-overs closed

- **removeChild (07-19) and the 09 deferred carousel flake:** now asserted by the sweep's console test on the dev server and the production build. The 09 deferred-items entry is marked resolved.

## Visual Re-baseline Note (for 10-13)

- **New folders** (12 PNGs): `photos-grid/{375,768,1440}-reduced`, `photos-carousel/{375,768,1440}-reduced`, `photo/{375,768,1440}-reduced` and `lightbox/{375,768,1440}`, each `-visual-dark-linux.png`.
- **Changed:** `photos/{375,768,1440}-reduced` (the map, the switcher in the header band, see 10-08 and 10-09).
- **Check command:** `node scripts/ci/check-snapshot-commit.mjs --sha HEAD --some --allow photos --allow photos-grid --allow photos-carousel --allow photo --allow lightbox`. `--allow photo` matches only `photo/`, because the prefix check includes the trailing slash.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 10-13 can run the CI visual-baselines workflow once for all photo surfaces. The matrix is 48 per scheme, and every shot is proven to reach its screenshot on the production build.

## Self-Check: PASSED

- FOUND: e2e/photos-sweep.spec.ts, e2e/visual/routes.spec.ts, e2e/visual/README.md
- FOUND on this branch: 249b484, ebe0569
- The acceptance greps and list counts were re-run after the final task commit: `'photos-grid'` 1, `'lightbox'` 1, skip/only/fixme 0, Chromium sweep list 19, visual-dark list 48.

---
*Phase: 10-photography*
*Completed: 2026-10-26*
