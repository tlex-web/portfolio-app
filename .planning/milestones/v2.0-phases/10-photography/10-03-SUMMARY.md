---
phase: 10-photography
plan: 03
subsystem: ui
tags: [tailwind-v4, custom-variant, container-queries, react, playwright, jest, contrast-guard]

requires:
  - phase: 10-photography
    provides: "10-01 PhotoView (aspect, stage, openerSrc, strip), PhotoViewer, ExifStrip, e2e/photos-lightbox.spec.ts"
  - phase: 09-home-ascent
    provides: "the summit-layout CSS/TS parity pattern; the 09-22 serviceWorkers 'block' rule for routed image requests"
provides:
  - "lib/photos/lightbox-tiers.ts: LB_SCROLL_MEDIA, LB_KEY_MEDIA, LB_GUTTER_MEDIA, LB_KEY_MIN_REM, LB_GUTTER_MIN_REM, LB_MIN_HEIGHT_REM, LB_GUTTER_PX, LB_CHROME_PX"
  - "app/globals.css @custom-variant lb-scroll, lb-key, lb-gutter, guarded by lib/__tests__/lightbox-tiers.test.ts"
  - "PhotoViewer layout: data-viewer-back, data-viewer-chrome (56 px, sticky on the scroll tier), data-chrome-left, data-chrome-right, data-viewer-stage (size container, 216 px gutters from 1280 px), data-photo-box (contain-fit at --ar)"
  - "ExifStrip two-column tiers: data-photo-strip, data-strip-identity, data-strip-data"
  - "components/photos/StagePhoto.tsx: data-stage-photo with data-state opener | large | error, data-stage-layer opener | large, 'Loading photo' after 1 s, 'Couldn't load this photo.' + Retry"
  - "check-contrast: accent/gallery, gallery/ink, focus/gallery, line-strong/gallery (32 -> 36 pairs)"
affects: [10-05, 10-06, 10-10, 10-11, 10-12, visual baselines]

actuals:
  tokens: 8140
  tasks: 2
  commits: 4
plan_head_before: 683d5c4e275f5eddff02630c4dc1faf356693f13
plan_head_after: 357a6681a4650a40aceb49920ceaa0be4538114a

tech-stack:
  added: []
  patterns:
    - "Lightbox tiers defined once as lb-* custom variants, mirrored by TS constants with a Jest parity test (the summit-layout pattern)"
    - "Contain-fit box: the stage is a size container and the box width is min(100cqw, 100cqh * --ar) with aspect-ratio, so the photo is the largest uncropped box"
    - "Stage layers share one grid cell (grid stacking), so nothing in the stage is positioned or needs a z-index under the sticky chrome"
    - "Image load results that fire before hydration are read from img.complete / naturalWidth on mount"

key-files:
  created:
    - lib/photos/lightbox-tiers.ts
    - lib/__tests__/lightbox-tiers.test.ts
    - components/photos/StagePhoto.tsx
  modified:
    - app/globals.css
    - components/photos/PhotoViewer.tsx
    - components/photos/ExifStrip.tsx
    - e2e/photos-lightbox.spec.ts
    - scripts/guards/check-contrast.mjs
    - scripts/guards/selftest.mjs
    - scripts/README.md

key-decisions:
  - "10-03: the two stage layers share one grid cell instead of being absolutely positioned; positioned layers would paint over the sticky chrome on the scroll tier and would need a z-index the UI-SPEC does not allow"
  - "10-03: the page renders 'All photographs' twice, one per tier (own row on lb-scroll, first in the chrome on lb-key/lb-gutter), the other display:none, because the scroll-tier row sits outside the sticky chrome"
  - "10-03: the opener img is wrapped in a source-less <picture>, the repo's no-img-element convention, so lint stays at zero warnings; tests target [data-stage-layer=\"large\"] img"
  - "10-03: Retry moves focus to the stage root (tabIndex -1) because the Retry button unmounts; focus never drops to the body"
  - "10-03: the slow-load e2e holds the derivatives until 'Loading photo' is seen (at least 1.5 s) instead of a fixed 1500 ms delay, so dev-server hydration time cannot hide the message"

patterns-established:
  - "Viewer hooks for later plans: data-chrome-left (stepping, counter: 10-06), data-chrome-right (Hide labels, Zoom: 10-10/10-11; Close: 10-05), data-viewer-stage (zoom scroll area: 10-10), data-photo-box (hotspot layer: 10-11)"

requirements-completed: [LBOX-04, LBOX-07]

coverage:
  - id: D1
    description: "lb-scroll, lb-key and lb-gutter in app/globals.css carry exactly LB_SCROLL_MEDIA '(width < 48rem), (height < 40rem)', LB_KEY_MEDIA '(48rem <= width < 80rem) and (height >= 40rem)' and LB_GUTTER_MEDIA '(width >= 80rem) and (height >= 40rem)'; the boundaries 768x900 key, 1280x640 gutter, 1279x900 key, 1440x639 scroll, 767x900 scroll hold"
    verification:
      - kind: unit
        ref: "lib/__tests__/lightbox-tiers.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "1440 x 900: the page viewer is 836 px tall (100svh - nav), the chrome 56 px, the photo box at the photo's ratio within 1 % with at least 216 px clear on each side of the stage, the strip in two columns"
    requirement: LBOX-04
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Viewer layout tiers (D-05) 1440 x 900 gutter tier: contain-fit photo with 216 px gutters, 56 px chrome, two-column strip"
        status: pass
    human_judgment: false
  - id: D3
    description: "1024 x 768: the photo box is the largest contain-fit box inside the stage (touches it on one axis) and the strip has two columns"
    requirement: LBOX-04
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Viewer layout tiers (D-05) 1024 x 768 key tier: the photo fits the stage and the strip has two columns"
        status: pass
    human_judgment: false
  - id: D4
    description: "375 x 800: 'All photographs' on its own row above the chrome, the chrome sticky at top 64 px, the photo at full width and true ratio (capped at 70svh), the strip in one column, scrollWidth <= clientWidth"
    requirement: LBOX-04
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Viewer layout tiers (D-05) 375 x 800 scroll tier: back link row, sticky chrome, full-width photo, one-column strip"
        status: pass
    human_judgment: false
  - id: D5
    description: "Four gallery contrast pairs guarded: accent/gallery 11.88, gallery/ink 16.87 (text), focus/gallery 14.33, line-strong/gallery 5.10 (non-text); guard:contrast prints 36 pairs (was 32)"
    verification:
      - kind: other
        ref: "npm run guard:contrast -> contrast: OK (36 pairs); npm run guard:selftest (73 PASS)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Load error: with every 1024/1600/2560 derivative aborted the box keeps its ratio and shows 'Couldn't load this photo.' and a Retry button named 'Retry loading photo'; the rights line and 'All photographs' stay visible; no [download] and no link to an image file"
    requirement: LBOX-07
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Stage states (UI-SPEC E5) a failed photo shows the error and Retry; the chrome and strip stay usable (LBOX-07)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Retry after the network returns loads the large derivative (naturalWidth > 0, data-state 'large') and the message and button are gone"
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Stage states (UI-SPEC E5) Retry reloads the large derivative once the network is back"
        status: pass
    human_judgment: false
  - id: D8
    description: "Slow load: 'Loading photo' appears no earlier than 1 s with nothing loaded and clears once the photo loads"
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Stage states (UI-SPEC E5) a slow photo shows \"Loading photo\" after 1 s and clears it once the photo loads"
        status: pass
    human_judgment: false
  - id: D9
    description: "Visual quality of the three tiers and of the error state (spacing, the empty 56 px chrome bar until 10-05/10-06 fill it, the strip columns)"
    verification: []
    human_judgment: true
    rationale: "Layout aesthetics need a human eye; the photo pages are not in the visual suite yet (lightbox shots arrive with 10-12)"

duration: 20min
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 03: Viewer layout tiers and stage states Summary

**The photo viewer now has its three layout tiers. They are defined once as `lb-scroll`, `lb-key` and `lb-gutter` custom variants and mirrored in `lib/photos/lightbox-tiers.ts`, with a Jest parity test between the two. On key and gutter the page viewer fills the viewport below the nav: a 56 px chrome bar, then a contain-fit photo box (216 px gutters from 1280 px), then a 3fr / 2fr strip. The new `StagePhoto` paints the 1024 opener first and the large derivative on top, shows "Loading photo" after 1 s, and recovers from a failed load with Retry. Four gallery contrast pairs are now guarded (32 -> 36).**

## Performance

- **Duration:** 20 min
- **Started:** 2026-10-26T10:48:54Z
- **Completed:** 2026-10-26T11:08:47Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 10 (3 created, 7 modified)

## Accomplishments

- **Tiers:** `lib/photos/lightbox-tiers.ts` builds the three media strings from rem constants (48, 80, 40). `app/globals.css` spells the same strings in `@custom-variant lb-scroll`, `lb-key` and `lb-gutter`, and `lightbox-tiers.test.ts` fails if the two drift. It also checks the tier boundaries.
- **Viewer layout (D-05):** the page viewer is `flex flex-col bg-gallery`, and on key and gutter its height is `calc(100svh - var(--nav-h))`. The 56 px chrome bar has empty `data-chrome-left` and `data-chrome-right` groups for later plans, and is sticky under the nav on the scroll tier. The stage is a size container. The photo box is `min(100cqw, 100cqh * --ar)` wide at the photo's aspect ratio, with `px-54` gutters on the gutter tier. On the scroll tier it is full width, capped at 70svh. The stage `sizes` is `(min-width: 1280px) calc(100vw - 432px), 100vw`.
- **'All photographs' (E8):** on the scroll tier the link has its own row above the chrome. From 768 px it is the first control in the chrome.
- **Strip (E6):** a two-column grid on key and gutter (identity and story on the left, data on the right, `gap-x-8`), one column below 768 px. At 1440 every EXIF and position line is a single 20 px line for all four photos.
- **Stage states (E5):** StagePhoto puts the opener layer and the large layer in one grid cell, with no fade and no filter. `data-state` moves from `opener` to `large`, or to `error`, where both layers hide and the box shows "Couldn't load this photo." with Retry. Retry remounts the large layer and keeps focus in the stage. "Loading photo" appears after 1 s if neither layer has loaded. A load or error that happened before hydration is read from `img.complete` on mount. The error state has no download control and no link to an image file (LBOX-07).
- **Contrast:** check-contrast adds accent/gallery, gallery/ink, focus/gallery and line-strong/gallery. `npm run guard:contrast` prints **32 pairs before, 36 after**. I updated `scripts/README.md` and the selftest expectations to match.

## Task Commits

1. **Task 1: layout tiers, contain-fit stage, two-column strip, gallery pairs** - `96cedc8` (test, RED), `e1d86de` (feat, GREEN)
2. **Task 2: StagePhoto first paint, slow-load and load-error states** - `6542c68` (test, RED), `357a668` (feat, GREEN)

No REFACTOR commits.

## TDD Gate Compliance

- **RED, Task 1 (`96cedc8`):** 3 of 14 Jest tests failed, all three CSS parity cases (`Expected "(width < 48rem), (height < 40rem)" / Received undefined`, and the same for lb-key and lb-gutter). The constants module was committed with the test so the suite loads. That means the constant and boundary cases passed in RED, and the parity cases are the targets. Semantic assessment: each target failed because the variants were missing from `app/globals.css`, not because of a load, syntax or fixture fault.
- **RED, Task 2 (`6542c68`):** 3 of 3 new Playwright cases failed on their first target assertion. The error and Retry cases got `toBeVisible` "element(s) not found" for "Couldn't load this photo." and the Retry button. The slow case got `toHaveAttribute` "element(s) not found" for `[data-stage-photo]`. The 8 existing cases passed.
- `gsd_run check tdd-red-evidence` has no Jest adapter, and the Playwright run used the line reporter, so I judged RED by reading the raw output. No machine verdict was used.
- **GREEN:** `e1d86de` passed Jest 14/14 and e2e 8/8. `357a668` passed e2e 11/11 on Chromium and Firefox. The layout and stage cases also passed 18/18 with `--repeat-each=3`.

## Files Created/Modified

- `lib/photos/lightbox-tiers.ts` - TS mirror of the lb-* variants, plus `LB_GUTTER_PX` and `LB_CHROME_PX`
- `lib/__tests__/lightbox-tiers.test.ts` - CSS/TS parity and tier boundaries
- `components/photos/StagePhoto.tsx` - the two-layer stage photo with loading and error states
- `app/globals.css` - `@custom-variant lb-scroll`, `lb-key`, `lb-gutter` (no new colour token)
- `components/photos/PhotoViewer.tsx` - tiered layout, chrome bar, stage, photo box, StagePhoto
- `components/photos/ExifStrip.tsx` - two-column tiers and the `data-strip-*` block hooks
- `e2e/photos-lightbox.spec.ts` - 'Viewer layout tiers (D-05)' and 'Stage states (UI-SPEC E5)'. The 10-01 stage locator now targets the large layer.
- `scripts/guards/check-contrast.mjs`, `scripts/guards/selftest.mjs`, `scripts/README.md` - the four gallery pairs and the 36-pair count

## Decisions Made

- **Grid stacking, not absolute layers.** Both layers sit in one `grid-cols-1 grid-rows-1` cell. Absolutely positioned layers inside a `relative` box would paint above the sticky chrome on the scroll tier, because both are positioned and the box comes later in the DOM. Fixing that would need a z-index, and the UI-SPEC says nothing else in the viewer stacks. The visual result is the same as the plan's absolute layers.
- **Two 'All photographs' links, one per tier.** The scroll-tier row has to sit outside the sticky chrome, and from 768 px the link has to be inside the chrome. Each link is `display: none` on the other tier, so only one is ever in the accessibility tree.
- **Opener inside a source-less `<picture>`.** This is the repo convention that keeps `@next/next/no-img-element` quiet, and lint stays at zero warnings. Both layers carry `data-stage-layer`, and the e2e cases target `[data-stage-layer="large"] img`.
- **Focus after Retry** moves to the stage root (`tabIndex={-1}`, `outline-none`), because the button unmounts.
- **Slow-load e2e gating:** the derivative requests are held until "Loading photo" has shown (and at least 1.5 s has passed), then released. A fixed 1500 ms delay could let the image finish before a slow dev hydration starts the 1 s timer.
- ui-ux-pro-max was loaded for the UI work. I checked the result against the approved 10-UI-SPEC, which records the skill's searches, and ran no new ones.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stage layers use grid stacking instead of absolute positioning**
- **Found during:** Task 2
- **Issue:** Absolutely positioned layers would scroll over the sticky chrome bar on the scroll tier, and preventing that would need a z-index the UI-SPEC rules out.
- **Fix:** Both layers and the message overlay share one grid cell (`col-start-1 row-start-1`, `min-h-0 min-w-0`). Nothing is positioned.
- **Files modified:** components/photos/StagePhoto.tsx
- **Verification:** the Stage states e2e cases, a screenshot of the error state, and the layout-tier e2e cases still pass.
- **Committed in:** 357a668

**2. [Rule 3 - Blocking] The guard selftest expected 32 contrast pairs**
- **Found during:** Task 1
- **Issue:** `npm run lint` runs `guard:selftest`, whose two contrast cases asserted `contrast: OK (32 pairs)`. That file was not in the plan's list.
- **Fix:** Both cases now expect 36 pairs, and the real-CSS case also checks the `accent/gallery 11.88` and `line-strong/gallery 5.10` lines.
- **Files modified:** scripts/guards/selftest.mjs
- **Verification:** selftest exits 0 (73 PASS).
- **Committed in:** e1d86de

**3. [Rule 3 - Blocking] `@next/next/no-img-element` warning on the opener img**
- **Fix:** I wrapped the opener in a `<picture>` (repo convention) and pointed the e2e locators at `[data-stage-layer="large"] img`, both the new cases and the 10-01 `[data-photo-stage] img` selector. That selector's element was renamed in Task 1, and the test was updated, not removed.
- **Files modified:** components/photos/StagePhoto.tsx, e2e/photos-lightbox.spec.ts
- **Committed in:** 357a668

**4. [Rule 3 - Blocking] Acceptance greps matched JSDoc wording**
- **Issue:** `grep -c "Retry loading photo"` printed 2 and `grep -cE "blur|transition-opacity"` printed 1, because the JSDoc used those words.
- **Fix:** I reworded the comments ("no CSS filter", "its accessible name says what it retries"). No code changed.
- **Committed in:** 357a668

**5. [Test correction] The scroll-tier width check compares with the stage, not the document**
- **Issue:** at 375 px, `<main>` and the viewer are 365 px wide because of the stable 10 px scrollbar gutter, while `documentElement.clientWidth` is 375.
- **Fix:** "full width" is checked against the stage width (or, when the 70svh cap binds, the height). The `scrollWidth <= clientWidth` overflow check is unchanged.
- **Committed in:** e1d86de

**6. [TDD] Task 1 got a separate RED commit**
- The plan named a single `feat` commit for Task 1. I committed RED first (`96cedc8`) to keep the TDD gate, then GREEN (`e1d86de`) with the planned message.

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking), a test correction and an added RED commit.
**Impact on plan:** No change in scope. Every artifact, hook and export name in the plan is present, plus `LB_KEY_MIN_REM`, `LB_GUTTER_MIN_REM`, `LB_MIN_HEIGHT_REM`, `data-viewer-back`, `data-photo-strip`, `data-strip-identity`, `data-strip-data` and `data-stage-layer`.

## Known Stubs

| File | What | Why | Resolved by |
|------|------|-----|-------------|
| components/photos/PhotoViewer.tsx | `data-chrome-left` / `data-chrome-right` are empty, apart from the page's 'All photographs' link from 768 px, so the 56 px bar shows blank on the scroll tier and in the modal | The plan says later plans fill them | 10-05 (Close), 10-06 (stepping, counter), 10-10 / 10-11 (Zoom, Hide labels); logged as stub #2 in `.planning/WINDOWS.md` |

## Issues Encountered

- `scripts/guards/check-contrast.mjs` and `scripts/guards/selftest.mjs` were already not Prettier-formatted before this plan, so I left them as they were (out of scope). The e2e spec was clean, and I formatted it.
- LBOX-04 and LBOX-07 are also declared by other Phase 10 plans that are not done yet. `requirements.ready-ids` reports both as blocked, so REQUIREMENTS.md is not changed by this plan.

## Verification

- `npx jest lib/__tests__/lightbox-tiers.test.ts`: 14 passed. Full `npx jest`: 52 suites, 784 tests passed.
- `npm run lint` (eslint, parity, palette, contrast 36 pairs, identity, selftest, data:check, served images): exit 0. `npm run type-check`: exit 0.
- `npx playwright test e2e/photos-lightbox.spec.ts --project=chromium`: 11 passed (dev server, 2 workers). Firefox: 11 passed. Layout and stage cases with `--repeat-each=3`: 18 passed.
- Regression: `e2e/shell.spec.ts` 33 passed, `e2e/data-privacy.spec.ts` 12 passed (chromium).
- Acceptance: `@custom-variant lb-` 3; `'gallery'` in check-contrast 5; `data-photo-box` in PhotoViewer 1; `Retry loading photo` in StagePhoto 1; `Loading photo` 2; `blur|transition-opacity` 0; `StagePhoto` in PhotoViewer 3.
- Screenshots at 1440 x 900, 1024 x 768, 375 x 800 and of the error state at 1024 x 768, taken for my own review and not committed. They match the UI-SPEC rows.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 10-05 can mount `PhotoViewer variant="modal"`. The chrome is already `lb-scroll:sticky lb-scroll:top-0` for the modal; Close goes into `data-chrome-right`.
- 10-06 fills `data-chrome-left` with ‹ › and the counter. StagePhoto already resets its state when `view.slug` changes.
- 10-10 (zoom) can turn `data-viewer-stage` into the full-area scroller. 10-11 hangs hotspots off `data-photo-box` and the 216 px gutters (`LB_GUTTER_PX`).
- No visual baselines changed: the photo route is not in the visual suite yet.

## Self-Check: PASSED

- All 3 created files exist on disk.
- All 4 commits (96cedc8, e1d86de, 6542c68, 357a668) are ancestors of HEAD.
- The acceptance greps for both tasks pass.

---
*Phase: 10-photography*
*Completed: 2026-10-26*
