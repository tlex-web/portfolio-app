---
phase: 10-photography
plan: 10
subsystem: ui
tags: [nextjs-16, react-19, tailwind-4, zoom, pointer-events, touch-action, escape-layers, playwright, jest]

requires:
  - phase: 10-photography
    provides: "10-03 StagePhoto and the [data-viewer-stage] / [data-photo-box] layout; 10-05 LightboxDialog with useLightbox().registerEscape; 10-06 stepping (step() reads the last-written slug from a ref, arrow listener in a layout effect that skips defaultPrevented), swipe on the fitted photo box, the photo-{slug} morph"
provides:
  - "lib/photos/zoom.ts (import-free): ZOOM_PAN_STEP 80, DRAG_THRESHOLD 4, zoomScrollFor, centreScroll, panBy, exceedsDragThreshold, types Size/Point/Scroll/PanKey"
  - "components/photos/ZoomStage.tsx: renders [data-viewer-stage]; fitted contain box or the 2560 px derivative at 1:1 ([data-zoom-photo]) in an overflow-auto scroll box; drag and key pan; the zoom Escape layer"
  - "PhotoViewer: zoomed state, the 'Zoom photo' toggle (aria-pressed, aria-keyshortcuts=\"z\") before Close, the Z key, swipe off while zoomed, zoom reset on every step"
affects: [10-11, 10-12, 10-13, visual baselines]

actuals:
  tokens: 9183
  tasks: 2
  commits: 4
plan_head_before: 247dd94faa516b77a696954b4c103164c4a7dbfc
plan_head_after: a428690a4ba1c2eff60471992a9490dcad4419ea

tech-stack:
  added: []
  patterns:
    - "Zoom is native scroll: the 1:1 image sits in an overflow-auto stage and every pan is a scrollTo(behavior 'instant'); no transform, no gesture library, so native pinch keeps working"
    - "A layer that must pre-empt the viewer's document keydown listeners registers in the capture phase on document (runs before every bubble listener regardless of registration order) and calls preventDefault"
    - "A press 'on the photo' is decided by the photo box's rectangle, not by event.target: during the open view transition Chromium hit-tests the stage instead of the named box"
    - "Flex scroll box with an m-auto child: centred when smaller, start-aligned when it overflows, so no part of the zoomed photo is unreachable"

key-files:
  created:
    - lib/photos/zoom.ts
    - lib/__tests__/photos-zoom.test.ts
    - components/photos/ZoomStage.tsx
  modified:
    - components/photos/PhotoViewer.tsx
    - e2e/photos-lightbox.spec.ts

key-decisions:
  - "10-10: ZoomStage renders [data-viewer-stage] itself and wraps the whole photo box, not only StagePhoto. Zoomed, the stage is the scroll box, so the component that owns the scroll must own that element. The children stay mounted (hidden) while zoomed, so unzooming shows the loaded photo at once and the morph boundary is never remounted"
  - "10-10: a click on the photo is detected from the photo box's rectangle on the stage's pointer handlers, because during the 500 ms open morph Chromium targets the stage instead of the named photo box and a target-based check missed the click"
  - "10-10: on the scroll tier the zoomed stage keeps the fitted photo's height via aspect-ratio var(--ar) capped at 70svh, which equals the fitted box height, so the strip does not move (measured: stage and strip boxes identical at 375 and 1440)"
  - "10-10: the browser's image drag-and-drop is prevented on the zoomed 1:1 photo only, because there a drag is the pan (UI-SPEC Zoom row). Right-click and saving stay untouched in both states, and the fitted photo has no drag handling (LBOX-07)"
  - "10-10: the zoomed img draws the 1024 opener (already cached) as a stretched background until the 2560 derivative paints, so zooming never shows an empty black box; it is an upscaled image, not a filter or a fade"
  - "10-10: Zoom glyph 24 px icon-only and 20 px beside its text from 768 px (md:size-5), per the UI-SPEC icon table; Close keeps its 10-05 24 px XIcon"

patterns-established:
  - "Later Escape layers (10-11 callouts) register through useLightbox().registerEscape in the lightbox and, on the page, prevent the press in a capture-phase document listener; PhotoViewer's page handler skips a prevented Escape"
  - "10-11 hotspots must hide while zoomed (UI-SPEC); read PhotoViewer's zoomed state. A numbered dot that is a button is already excluded from click-to-zoom (closest('button, a'))"

requirements-completed: [LBOX-02, LBOX-03]

coverage:
  - id: D1
    description: "Z sets 'Zoom photo' aria-pressed 'true' (aria-keyshortcuts 'z'); the zoomed img is 2560 px wide (±1) with naturalWidth 2560; the stage's scrollWidth exceeds its clientWidth; Z centres the photo (±1 px)"
    requirement: LBOX-02
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Zoom (D-06) Z zooms to 1:1 of the 2560 px derivative and the stage scrolls"
        status: pass
    human_judgment: false
  - id: D2
    description: "While zoomed, ArrowRight / ArrowDown scroll the stage by exactly 80 px and the URL does not change; after Escape (zoom off, dialog open) ArrowRight steps to the next photo"
    requirement: LBOX-02
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Zoom (D-06) the arrows pan 80 px while zoomed; after Escape they step again"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photos-zoom.test.ts#panBy (80 px per arrow press, clamped)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Escape unwinds in layers: from zoomed, the first Escape leaves zoom with the dialog open, the second closes it (URL back to the grid); on /photos/{slug} the first Escape unzooms and stays, the second goes to /photos"
    requirement: LBOX-03
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Zoom (D-06) Escape twice from zoomed closes the lightbox (LBOX-03)"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Zoom (D-06) on the photo page, Escape leaves zoom first, then goes to /photos"
        status: pass
    human_judgment: false
  - id: D4
    description: "A click on the fitted photo zooms with the clicked point under the pointer (±2 px); a 100 px mouse drag pans by 100 px (±1) and stays zoomed; a click without movement unzooms"
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Zoom (D-06) a click zooms at the point, a drag pans and a click without movement unzooms"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photos-zoom.test.ts#zoomScrollFor (the clicked point stays under the pointer)"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photos-zoom.test.ts#exceedsDragThreshold (4 px)"
        status: pass
    human_judgment: false
  - id: D5
    description: "'Next photo' while zoomed shows the next photo fitted: aria-pressed 'false', no [data-zoom-photo], the photo box visible"
    requirement: LBOX-02
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Zoom (D-06) Next photo while zoomed shows the next photo fitted"
        status: pass
    human_judgment: false
  - id: D6
    description: "Native pinch is never blocked: the stage's computed touch-action contains pinch-zoom fitted (pan-y pinch-zoom) and is pan-x pan-y pinch-zoom (Chromium: 'manipulation') zoomed; cursors zoom-in fitted on the photo and grab zoomed"
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Zoom (D-06) native pinch-zoom is never blocked: touch-action keeps pinch-zoom in both states"
        status: pass
    human_judgment: false
  - id: D7
    description: "How zoom, drag pan and native pinch on top of zoom feel on a real touch device and in Safari; the opener-under-2560 progressive paint on a slow connection"
    verification: []
    human_judgment: true
    rationale: "e2e proves the scroll positions and touch-action values, not how a real finger pan and pinch over the zoomed photo feel; local Playwright WebKit cannot hydrate localhost (deferred-items.md) and CI has no WebKit project"

duration: 21min
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 10: Fit and 1:1 zoom Summary

**The viewer zooms between fit and 1:1 of the 2560 px derivative. A click on the photo zooms in at that point; Z and the new 'Zoom photo' toggle centre it. Zoomed, the stage is a native `overflow: auto` scroll box: a mouse drag pans after 4 px and the arrow keys pan 80 px per press. A still click or the first Escape leaves zoom, and the next Escape closes the lightbox or goes to /photos. Every step resets to fit. touch-action keeps `pinch-zoom` in both states.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-10-26T14:03:48Z
- **Completed:** 2026-10-26T14:25:19Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- **Zoom maths (`lib/photos/zoom.ts`, import-free):** `zoomScrollFor` maps the click in the fitted photo to the 1:1 photo and subtracts the pointer's place in the stage. `centreScroll`, `panBy` (80 px) and `exceedsDragThreshold` (hypot >= 4). Every result is clamped to 0..(zoomed - viewport), and is 0 on an axis where the photo fits.
- **ZoomStage:** owns `[data-viewer-stage]`.
  - **Fitted:** the 10-03 classes plus `touch-action: pan-y pinch-zoom`, and `cursor: zoom-in` on the photo.
  - **Zoomed:** `flex overflow-auto overscroll-contain`, no gutter padding, `touch-action: pan-x pan-y pinch-zoom`, and `cursor: grab` (`grabbing` while dragging). It shows a `<picture data-zoom-photo>` with only the 2560 AVIF and WebP and an img at its own width and height with the editorial alt, centred by auto margins.
  - **Scroll position:** set in a layout effect before the first zoomed paint, from the click anchor or centred.
  - **Pointer:** a mouse drag past the threshold sets the scroll from the pointer delta, using pointer capture. A press that does not pass the threshold unzooms. Touch pans natively and a tap unzooms. Presses on the stage's own scrollbars are ignored.
- **Keys and Escape:** a capture-phase `document` keydown listener, registered in a layout effect, pans with the arrows while zoomed and prevents the press, so PhotoViewer's stepping skips it. In the lightbox the zoom layer is registered with `registerEscape`. On the page, the same listener prevents Escape and PhotoViewer's page handler skips the prevented press.
- **PhotoViewer:**
  - **State:** `zoomed` state, reset inside `step()`. The swipe is off while zoomed.
  - **Toggle:** the right group gains 'Zoom photo' before Close: `aria-pressed`, `aria-keyshortcuts="z"`, Plus icon fitted and Minus icon zoomed (24 px icon-only, 20 px beside the text from 768 px), visible 'Zoom' from md, and `bg-ink text-gallery` when pressed.
  - **Z key:** toggles zoom only with no modifier held, not on key repeat, and not inside a text field.

## Task Commits

1. **Task 1: pure zoom maths** - `82e13c7` (test, RED), `da0646a` (feat, GREEN)
2. **Task 2: ZoomStage, toggle, Z key, pan, Escape layer** - `fa79904` (test, RED), `a428690` (feat, GREEN)

**Plan metadata:** the docs(10-10) commit that follows this SUMMARY.

## TDD Gate Compliance

- **RED, Task 1 (`82e13c7`):** Jest ran 15 tests and 13 failed on their target assertions against a neutral stub, committed so the suite loads. Two passed against the stub. The first is the `exceedsDragThreshold(3, 2) === false` guard case. The second is "a fitted-centre click equals centreScroll": both stub calls return the same neutral value. Semantic assessment: valid. Every planned behaviour failed on its own assertion, with no load or syntax fault.
- **RED, Task 2 (`fa79904`):** Playwright (chromium) ran the 7 'Zoom (D-06)' cases and all 7 failed on the planned behaviour. Six could not find the 'Zoom photo' toggle; this includes the page case, which waits for the toggle to hydrate. The pinch case got `touch-action: auto` on the stage instead of a value with `pinch-zoom`. Semantic assessment: valid, with no fixture fault.
- `gsd_run check tdd-red-evidence` has no Jest or Playwright line-reporter adapter, so RED was judged from the raw console output, as in 10-02 to 10-08.
- **GREEN:** `da0646a`: Jest 15/15. `a428690`: `e2e/photos-lightbox.spec.ts` 71/71 on a fresh dev server (chromium and firefox, 14 Zoom runs). No REFACTOR commits.

## Files Created/Modified

- `lib/photos/zoom.ts` - pure zoom maths and constants
- `lib/__tests__/photos-zoom.test.ts` - unit cases from the plan's behaviour block, plus an off-centre anchor case
- `components/photos/ZoomStage.tsx` - the stage with fit/1:1, drag and key pan, and the Escape layer
- `components/photos/PhotoViewer.tsx` - zoom state, the toggle, the Z key, swipe gating, reset on step; the stage div moved into ZoomStage
- `e2e/photos-lightbox.spec.ts` - describe 'Zoom (D-06)' (7 cases)

## Decisions Made

See key-decisions in the frontmatter. In short:
- ZoomStage owns the stage element, because zoomed the stage is the scroll box.
- Click-to-zoom uses the photo box's rectangle, so it works during the open morph.
- On the scroll tier, the zoomed stage keeps the fitted height through `aspect-ratio` and a 70svh cap, so nothing below moves.
- Image drag-and-drop is prevented only on the zoomed photo, where a drag pans.
- The 1024 opener is drawn as a stretched placeholder under the 2560 photo while it loads.

ui-ux-pro-max was loaded before the UI work. A focused search ("drag pan zoomed image", ux) returned WCAG 2.2 Dragging Movements (single-pointer alternative). The arrow keys give a keyboard alternative. The stage's native scrollbars stay visible and give the single-pointer one. `drag-threshold`, `standard-gestures` (pinch never blocked), `reduced-motion` (zoom is instant in every mode), `content-jumping` (no shift, measured) and `icon-context` (aria-pressed on a constant name) are applied as the locked UI-SPEC specifies.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Click-to-zoom missed clicks during the open morph**
- **Found during:** Task 2 GREEN
- **Issue:** I first detected the fitted click from DOM events bubbling out of the photo box. While the 500 ms open view transition runs, Chromium targets the stage element instead of the named photo box (an event log showed `pointerdown:DIV` on the stage), so a quick click after opening did nothing.
- **Fix:** the stage's pointer handlers decide "on the photo" from the photo box's `getBoundingClientRect()`. Buttons and links inside it (Retry, the later numbered dots) stay excluded.
- **Files modified:** components/photos/ZoomStage.tsx
- **Verification:** the click case passes in chromium and firefox right after the dialog opens.
- **Committed in:** a428690

**2. [Rule 1 - Test bug] Chromium serialises the zoomed touch-action as `manipulation`**
- **Issue:** `pan-x pan-y pinch-zoom` is by definition `manipulation`, and Chromium computes it to that keyword, so `toContain('pinch-zoom')` failed although pinch is allowed.
- **Fix:** the zoomed assertion accepts exactly `manipulation` or `pan-x pan-y pinch-zoom`. The fitted assertion (`pan-y pinch-zoom`) is unchanged, and the source declares `pinch-zoom` in both class strings (acceptance grep: 6).
- **Committed in:** a428690

**3. [Rule 3 - Blocking] Page Escape case: dev compile time of /photos**
- **Issue:** the second Escape on the photo page navigates to /photos, which the dev server can compile on first visit.
- **Fix:** that assertion gets 15 s, as the 10-03 page-Escape case allows.
- **Committed in:** a428690

**4. [Rule 3 - Interface] ZoomStage wraps the photo box rather than StagePhoto alone**
- **Issue:** the plan's interface describes `children` as "the fitted StagePhoto", but the zoomed scroll box must be the stage element (the UI-SPEC says the stage becomes `overflow: auto` over its full area), which sits outside the aspect-ratio photo box.
- **Fix:** ZoomStage renders `[data-viewer-stage]`, and its children are the photo box (which holds StagePhoto). The props signature is as planned. The 10-03 layout-tier cases pass unchanged.
- **Committed in:** a428690

---

**Total deviations:** 4 auto-fixed (1 bug, 1 test bug, 1 blocking test timing, 1 interface placement)
**Impact on plan:** No scope change. Every artifact, export, key link and acceptance grep in the plan holds.

## Issues Encountered

- **Dev server stopped intercepting after hot reloads (known, deferred-items.md 10-07 and 10-08 items).** After several edits to PhotoViewer and ZoomStage, grid clicks became document navigations and every lightbox case failed with no dialog. The page-surface Escape case also failed on that server. A fresh dev server passed everything; a probe on it showed the second Escape navigating at once. No new deferred item: this is the same recorded issue.
- **The heredoc append of the e2e describe was cut off** by the shell partway through the last case. I finished it with an edit before the RED run; the committed file is complete (prettier and tsc clean).
- **LBOX-02 and LBOX-03** are also declared by later plans. The `requirements.ready-ids` gate decides whether REQUIREMENTS.md changes now.

## Verification

- `npx jest lib/__tests__/photos-zoom.test.ts --silent`: 15 passed. Full Jest: 60 suites, 899 tests passed.
- `npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox --workers=2`: 71 passed on a fresh dev server (14 'Zoom (D-06)' runs).
- Plan-level, production build: `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts e2e/photos.spec.ts e2e/photos-carousel.spec.ts e2e/shell.spec.ts e2e/data-privacy.spec.ts --project=chromium --project=firefox --workers=4`: 215 passed. `public/service-worker.js` was restored afterwards.
- `npm run lint`: exit 0, with all guards OK. `npm run type-check`: 0 errors. Prettier is clean on every file this plan touched.
- Acceptance, Task 1: `^import` appears 0 times in zoom.ts. `ZOOM_PAN_STEP = 80` and `DRAG_THRESHOLD = 4` appear once each.
- Acceptance, Task 2: `pinch-zoom` appears 6 times in ZoomStage (at least 2 required). `aria-keyshortcuts="z"` appears once in PhotoViewer. `scale(` and `transform:` appear 0 times in ZoomStage. The key links hold: `registerEscape` in ZoomStage, `ZoomStage` in PhotoViewer. `.skip(`, `.only(` and `.fixme(` appear 0 times in the spec.
- Screenshots on the photo page, fitted and zoomed, at 375 x 800 and 1440 x 900: the stage boxes (375: 365 x 243.4 at y 172; 1440: 1430 x 635 at y 120) and the strip's y position are identical before and after zoom. The pressed toggle shows ink on gallery.

## Visual Re-baseline Note (for 10-13)

- `/photos/{slug}` and the lightbox: the chrome's right group now holds the Zoom toggle (icon-only below 768 px, 'Zoom' with a 20 px glyph from 768 px) before Close. Any baseline of the photo page changes in the chrome bar's right side.

## Known Stubs

- WINDOWS stub #2 (`components/photos/PhotoViewer.tsx` chrome groups) stays open, now only for 'Hide labels' (10-11). The right group holds Zoom and, in the lightbox, Close.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **10-11 (hotspots and Hide labels):** put Hide labels before Zoom in `data-chrome-right`. Hide every hotspot while `zoomed` (UI-SPEC). The callout Escape layer registers after zoom's, so it runs first, as the UI-SPEC order requires (callout, then zoom, then close). On the page, use a capture-phase listener like ZoomStage's, or extend the same pattern. Collapse any expanded hotspot in `step()`.
- **10-13:** re-baseline the photo page's chrome bar.

## Self-Check: PASSED

- All 3 created files exist on disk (lib/photos/zoom.ts, lib/__tests__/photos-zoom.test.ts, components/photos/ZoomStage.tsx).
- All 4 task commits (82e13c7, da0646a, fa79904, a428690) are ancestors of HEAD.
- The acceptance greps for Tasks 1 and 2 pass (re-run after the final commit).

---
*Phase: 10-photography*
*Completed: 2026-10-26*
