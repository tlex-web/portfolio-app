---
phase: 10-photography
plan: 11
subsystem: ui
tags: [nextjs-16, react-19, tailwind-4, hotspots, localStorage, useSyncExternalStore, resize-observer, escape-layers, playwright, jest]

requires:
  - phase: 10-photography
    provides: "10-01 elevationMetres and PhotoView.altitudeLabel; 10-03 the lb-* tiers, [data-viewer-stage] with px-54 gutters and [data-photo-box]; 10-05 useLightbox().registerEscape (newest layer first); 10-06 step() reading the last-written slug from a ref, key listeners in layout effects; 10-08 stack1D in lib/photos/label-layout.ts; 10-10 ZoomStage, the zoomed state and its capture-phase Escape and pan listener"
provides:
  - "PhotoView.hotspots (HotspotView: id, n, title, description, x, y, glyph, side, heightLabel, facts with link/text sources) and hotspotViews() in lib/photos/view-model.ts"
  - "lib/photos/hotspot-layout.ts: gutterStack (per-side stack1D, 8 px gap and inset, expanded panel in the stack, top-down when a gutter cannot fit), GUTTER_LABEL_HEIGHT, GUTTER_GAP"
  - "lib/photos/hotspot-pref.ts: HOTSPOT_PREF_KEY 'photos.labels', readLabelsOn, writeLabelsOn, useLabelsOn"
  - "components/photos/Hotspots.tsx: HotspotMarks (glyphs and numbered dots in the photo box), HotspotOverlay (gutter labels, panels and leaders over the stage), HotspotKey (the strip's 'Labels' key)"
  - "PhotoViewer: 'Hide labels' toggle before Zoom (aria-pressed, aria-keyshortcuts 'h'), the H key, expandedId collapsed on every step, the callout Escape layer ahead of zoom and close"
  - "ExifStrip: the hotspotKey slot (row 4) and the shortcut legend (row 8)"
affects: [10-12, 10-13, visual baselines, phase-12-verify]

actuals:
  tokens: 30945
  tasks: 2
  commits: 4
plan_head_before: b9fa70f0ff3050dbf02ad926765e857f78e069d4
plan_head_after: 38c81951d4b99b6e2bd34ee075775b3fbfb79302

tech-stack:
  added: []
  patterns:
    - "A preference store as a module with useSyncExternalStore (server snapshot true): try/catch on every storage access, a visit-only in-memory value when the write is refused, the window 'storage' event for other tabs"
    - "A layer that must beat ZoomStage's document capture listener on the page listens on window in the capture phase; in the lightbox it registers through registerEscape from the parent, whose layout effect runs after the child's, so it is the newest layer"
    - "Gutter labels sit in a stage-level layer measured with ResizeObserver (stage, photo box, each label with its panel) and laid out by the pure gutterStack; the markers and dots sit inside the photo box at percentage positions, so they follow the photo and its swipe"

key-files:
  created:
    - lib/photos/hotspot-layout.ts
    - lib/photos/hotspot-pref.ts
    - lib/__tests__/photos-hotspots.test.ts
    - lib/__tests__/photos-hotspot-pref.test.ts
    - components/photos/Hotspots.tsx
    - components/photos/__tests__/hotspots.test.tsx
    - .planning/phases/10-photography/.red/10-11-t2.json
  modified:
    - lib/photos/view-model.ts
    - components/photos/PhotoViewer.tsx
    - components/photos/ExifStrip.tsx
    - components/photos/ZoomStage.tsx
    - components/photos/__tests__/strip.test.tsx
    - e2e/photos-lightbox.spec.ts

key-decisions:
  - "10-11: Hotspots.tsx exports three components, not two: HotspotMarks draws inside the photo box (so glyphs and dots follow the photo and its swipe), HotspotOverlay draws the gutter labels and leaders in a layer over the stage (so labels do not morph with the photo or follow a swipe), and HotspotKey is the strip key. One component cannot render in both boxes without a portal"
  - "10-11: a photo-reference height reuses PhotoView.altitudeLabel, so the lake reads '2,760 m approx.' in the label, the key row and the map with one source (IN-02)"
  - "10-11: a non-Wikipedia https source would print its host name as the link text; today every URL source is Wikipedia. 'exif' prints 'Source: camera EXIF' (flagged assumption in the plan)"
  - "10-11: with storage refusing the write, the choice is kept in memory for the visit; a later successful write or another tab's storage event clears that value"
  - "10-11: gutterStack centres on the 48 px label even when its panel is open (the panel height is added to the label's height), so opening a callout never moves its own label, only the ones after it. A gutter whose whole stack is taller than the stage is laid out from the top and that gutter scrolls"
  - "10-11: the plan's 'ten labels in a 400 px stage stay within [8, 392]' is tested with five a side: ten 48 px labels in one gutter need 552 px and cannot fit 384 px, which is the scroll case, tested separately"
  - "10-11: while zoomed, the first Escape still collapses an open callout (the key row stays visible in the strip); focus stays where it is, because no gutter label is drawn while zoomed"

patterns-established:
  - "Dots that must not start a swipe or a zoom stop pointerdown propagation and prevent mousedown focus"
  - "The legend uses an arbitrary media variant, [@media(min-width:48rem)_and_(hover:hover)_and_(pointer:fine)]:block, rather than a new custom variant"

requirements-completed: [LBOX-05, LBOX-04]

coverage:
  - id: D1
    description: "Every PhotoView carries hotspots in reading order, numbered, with glyph, side, honest height (summit 4,478 m; photo ref = altitudeLabel, lake '2,760 m approx.'; none = null) and fact sources ('Wikipedia' link, 'Source: Tim', 'Source: swissALTIRegio terrain model', 'Source: camera EXIF')"
    requirement: LBOX-05
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-hotspots.test.ts#hotspot view-model (D-09, IN-02)"
        status: pass
    human_judgment: false
  - id: D2
    description: "gutterStack: centred on the marker, 8 px apart and 8 px inside the stage, an expanded panel pushing later labels down, per-side stacks, the overflow case laid out from the top"
    requirement: LBOX-05
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-hotspots.test.ts#gutterStack (D-09, UI-SPEC \"Stacking\")"
        status: pass
    human_judgment: false
  - id: D3
    description: "Label preference: one 'photos.labels' on/off value, idempotent writes, try/catch fallback to labels on with the toggle still working for the visit, another tab's change through the storage event, nothing else stored (no other key, no session storage, no cookie)"
    requirement: LBOX-05
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-hotspot-pref.test.ts"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Hotspots (LBOX-05) with localStorage throwing, labels show and H still toggles for the visit"
        status: pass
    human_judgment: false
  - id: D4
    description: "Gutter tier at 1440 x 900: two aria-expanded labels; Enter expands the first and shows the Wikipedia link (target _blank, rel noopener noreferrer) in a panel beside the photo; Escape from inside the panel collapses it with focus on the label; the next Escape closes the lightbox"
    requirement: LBOX-05
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Hotspots (LBOX-05) gutter tier: Enter expands a label, Escape collapses it to the label, then closes"
        status: pass
      - kind: unit
        ref: "components/photos/__tests__/hotspots.test.tsx#HotspotKey (D-11)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Escape layer chain from zoomed with a callout open: callout, then zoom, then close; hotspots hidden while zoomed; a step collapses the open callout"
    requirement: LBOX-05
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Hotspots (LBOX-05) from zoomed with a callout open, Escape unwinds callout, then zoom, then close"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Hotspots (LBOX-05) a step collapses the open callout"
        status: pass
    human_judgment: false
  - id: D6
    description: "Hide labels: H sets aria-pressed 'true', every label, marker and leader goes, 'off' is stored, a reload keeps it hidden, toggling back restores the labels; the key stays"
    requirement: LBOX-05
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Hotspots (LBOX-05) H hides every label and marker, and the choice survives a reload"
        status: pass
      - kind: unit
        ref: "components/photos/__tests__/hotspots.test.tsx#with labels hidden nothing is drawn on or around the photo, and the key stays"
        status: pass
    human_judgment: false
  - id: D7
    description: "Key tier at 1024 x 768: two numbered dots and the 'Labels' key; clicking dot 2 expands key row 2 and fills dot 2 with the accent; no zoom"
    requirement: LBOX-05
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Hotspots (LBOX-05) key tier: numbered dots and the Labels key; a dot expands its key row in accent"
        status: pass
    human_judgment: false
  - id: D8
    description: "Strip rows 4 and 8: the key slot after the story; the legend '← → photos · Z zoom · H labels · Esc close' (page: 'Esc all photographs') with five kbd, visible on a fine pointer from 768 px, hidden at 375; the 375 chrome fits 343 px with no sideways overflow"
    requirement: LBOX-04
    verification:
      - kind: unit
        ref: "components/photos/__tests__/strip.test.tsx#row 8: the shortcut legend with every key in a kbd, Esc closing or going to all photographs"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Hotspots (LBOX-05) the strip legend shows its keys on a fine pointer from 768 px, not at 375"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Hotspots (LBOX-05) at 375 the chrome groups fit 343 px and nothing overflows sideways"
        status: pass
    human_judgment: false
  - id: D9
    description: "How the gutter callouts, leaders and the key read on real devices: leader legibility over bright sky and dark rock, the photo shrinking on the key tier when a key row expands, touch taps on the dots"
    verification: []
    human_judgment: true
    rationale: "e2e proves structure, state and placement, not visual quality; on the fixed key tier (1024 x 768) the strip grows with the key and an open row, so the photo gets smaller, which is the UI-SPEC composition but needs Tim's eye"

duration: 29min
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 11: Hotspot callouts, numbered key and Hide labels Summary

**The viewer's hotspots now read like peak labels on a panorama. From 1280 px, 192 px labels sit in the side gutters with leaders to 12 px glyphs on the photo. Below that, numbered dots sit on the photo with a 'Labels' key in the strip. Every label and key row opens its description and sourced facts (Wikipedia links in a new tab). One callout is open at a time, and Escape collapses it before zoom and close. 'Hide labels' (H) is stored as one localStorage value and works with storage blocked. The strip gains its shortcut legend.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-10-26T14:57:54Z
- **Completed:** 2026-10-26T15:26:31Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 13 (7 created, 6 modified)

## Accomplishments

- **View-model (`hotspotViews`)** sorts a copy of each photo's annotations by y, then x, and numbers them from 1. A peak gets the 'peak' glyph and every other icon a 'dot'. The side is left for x < 50. The height is `formatMetres(4478)` for a summit reference and the photo's own `altitudeLabel` for a photo reference, so the lake says '2,760 m approx.' (IN-02). Each fact source becomes a 'Wikipedia' link or 'Source: …' text. The photo order is untouched.
- **`gutterStack`** stacks each side with `stack1D`. Labels centre on the 48 px label, sit 8 px apart and 8 px inside the stage, and are pushed up from the bottom. An open panel counts in the stack. A side that cannot fit is laid out from the top and scrolls.
- **`hotspot-pref`** is a module store read through `useSyncExternalStore`, with a server snapshot of true. It stores one 'on'/'off' value under 'photos.labels', and every read and write is in try/catch. When storage refuses a write, the choice is kept for the visit. Other tabs reach it through the storage event. It sends nothing and sets no cookie.
- **`HotspotMarks`** draws inside the photo box:
  - **Gutter tier:** 12 px SVG glyphs (a triangle or a circle) in ink with a 2 px gallery casing (paint-order stroke), accent when open, and pointer-events none.
  - **Key and scroll tiers:** 24 px numbered dots in a 44 px hit area. They are tabIndex -1 and aria-hidden. They do not start a swipe or a zoom, and they take no focus.
- **`HotspotOverlay`** is a layer over the stage on the gutter tier only. ResizeObserver measures the stage, the photo box and each label with its panel, and `gutterStack` places the labels 16 px from the outer edge. The label is a `min-h-12 w-48` button with an inset `ring-line-strong` and `aria-expanded`/`aria-controls`. The panel sits under its label, so it never covers the photo. Each leader is 1 px ink over a 3 px gallery casing, accent when open, and stops 8 px short of the glyph.
- **`HotspotKey`** is a `<ul aria-label="Labels">` of `min-h-11` rows reading '1 Matterhorn summit · 4,478 m'. Each row expands in place in the same panel style. The key shows on the key and scroll tiers and stays when labels are hidden.
- **PhotoViewer:**
  - **Toggle:** 'Hide labels' comes first in the right group (`EyeSlashIcon`, 24 px icon-only, 20 px with its text from 768 px), pressed as `bg-ink text-gallery`. The H key toggles it under the Z rules.
  - **State:** the viewer owns `expandedId`, collapsed in `step()`.
  - **Escape:** the callout layer registers after ZoomStage's in the lightbox and uses a window capture listener on the page. It returns focus to the label or key row that is shown.
- **ExifStrip:** row 4 is the `hotspotKey` slot. Row 8 is the legend, with the keys in `<kbd>` and each key and its word in one nowrap unit. It shows only with `(hover: hover) and (pointer: fine)` from 768 px.

## Task Commits

1. **Task 1: hotspot view-model, gutter stacking and the label preference:** `5140e6f` (test, RED), `d5b10f2` (feat, GREEN)
2. **Task 2: callouts, numbered key, Hide labels, the Escape layer and the legend:** `dcd75e9` (test, RED), `38c8195` (feat, GREEN)

**Plan metadata:** the docs(10-11) commit that follows this SUMMARY.

## TDD Gate Compliance

- **RED, Task 1 (`5140e6f`):** Jest ran 24 cases against neutral stubs (`hotspots: []`, a `gutterStack` that returns `{}`, and inert pref functions), committed so the suites load. 21 failed and 3 passed. The passes were 'is on when nothing is stored' (the stub returns true), 'never re-sorts the photos' and 'returns nothing for no labels', which are guard cases.
  - 15 of the failures were assertion failures.
  - 6 were TypeErrors reading `.facts`, `.heightLabel` or `.top` from the stubs' empty results, so they also come from the missing behaviour, not from a load fault.
  - Jest has no `tdd-red-evidence` adapter, so this was judged from the raw output, as in 10-01 to 10-10. **Semantic assessment:** valid.
- **RED, Task 2 (`dcd75e9`):**
  - **Playwright:** run with `--reporter=line,junit`. All 18 'Hotspots (LBOX-05)' cases (9 Chromium, 9 Firefox) failed on a missing `[data-hotspot-label]`, Hide labels button, `[data-hotspot-dot]` or `[data-strip-legend]`. `check tdd-red-evidence` returned `RED_EVIDENCE_OK` (record: `.planning/phases/10-photography/.red/10-11-t2.json`). **Semantic assessment:** valid.
  - **Jest:** the component suite failed 7 of 9; the zoomed and empty cases pass vacuously against stubs that render nothing.
- **GREEN:**
  - `d5b10f2`: the three Task 1 suites, 44 of 44.
  - `38c8195`: hotspots and strip, 27 of 27. Full Jest: 63 suites, 942 tests. `e2e/photos-lightbox.spec.ts` in Chromium and Firefox: 89 of 89 on a fresh dev server. No REFACTOR commits.

## Files Created/Modified

- `lib/photos/view-model.ts`: `HotspotView`, `PhotoView.hotspots`, `hotspotViews`, and an editorial input type with annotations
- `lib/photos/hotspot-layout.ts`: `gutterStack` (new)
- `lib/photos/hotspot-pref.ts`: the label preference store (new)
- `components/photos/Hotspots.tsx`: `HotspotMarks`, `HotspotOverlay`, `HotspotKey` (new)
- `components/photos/PhotoViewer.tsx`: the toggle, the H key, `expandedId`, the Escape layer and the wiring; the photo box is `relative`
- `components/photos/ZoomStage.tsx`: the fitted stage is `relative` (one class)
- `components/photos/ExifStrip.tsx`: rows 4 and 8
- `components/photos/__tests__/strip.test.tsx`: the rights-last case rewritten for row 8, plus legend and key-slot cases
- `e2e/photos-lightbox.spec.ts`: describe 'Hotspots (LBOX-05)', 9 cases
- Tests: `lib/__tests__/photos-hotspots.test.ts`, `lib/__tests__/photos-hotspot-pref.test.ts`, `components/photos/__tests__/hotspots.test.tsx`

## Decisions Made

See key-decisions in the frontmatter. ui-ux-pro-max was loaded before the UI work.
- A focused search for "keyboard shortcuts" (ux) returned Keyboard Navigation (High): focus order follows reading order (chrome, gutter labels, strip key) and every action has a key path.
- Searches for "disclosure expand collapse button", "external link new tab" and "toggle button pressed state" returned off-topic results. There was no verified match, so the Quick Reference rules were applied within the locked UI-SPEC:
  - `aria-labels` and `icon-context`: a constant 'Hide labels' name with `aria-pressed`, and aria-hidden icons beside their text.
  - `touch-target-size`: 44 px dots and rows.
  - `color-not-only`: an open hotspot also has `aria-expanded` and its panel.
  - `truncation-strategy`: labels use `min-h-12` so a long title wraps.
  - `escape-routes`.
  - `content-jumping`: the gutters are reserved, so the photo never resizes on toggle.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Interface] Three components instead of `HotspotOverlay` drawing in both places**
- **Found during:** Task 2
- **Issue:** The plan's `HotspotOverlay` draws the markers inside the photo box and the labels in the stage gutters. One React subtree cannot render into both boxes without a portal. A portal would also bubble React pointer events into the photo box's swipe handler.
- **Fix:** `HotspotMarks` (inside the box), `HotspotOverlay` (stage layer: labels and leaders) and `HotspotKey`, all in `components/photos/Hotspots.tsx`. Their props match the plan's interface.
- **Files modified:** components/photos/Hotspots.tsx, components/photos/PhotoViewer.tsx
- **Committed in:** 38c8195

**2. [Rule 3 - Blocking] ZoomStage's fitted stage needed `relative`**
- **Found during:** Task 2
- **Issue:** The gutter layer is `absolute inset-0` over the stage, and the stage was not positioned. ZoomStage is not in the plan's file list.
- **Fix:** one `relative` class on `FITTED_STAGE`, with a comment. All 10-03 layout-tier and 10-10 zoom cases still pass.
- **Committed in:** 38c8195

**3. [Rule 1 - Test contract] The strip's 'rights line last' case**
- **Found during:** Task 2 GREEN
- **Issue:** `strip.test.tsx` asserted that nothing follows the rights line, which encoded the strip before row 8.
- **Fix:** the case was rewritten, not skipped. The rights line is now followed only by the legend, which is last. Legend and key-slot cases were added.
- **Committed in:** 38c8195

**4. [Rule 1 - Test interpretation] 'Ten labels in a 400 px stage'**
- **Issue:** ten 48 px labels in one gutter need 552 px, which is more than the 384 px inside the stage.
- **Fix:** the case puts five labels on each side, which fits. The one-gutter overflow is tested as the scroll case: from 8 px down, 8 px apart, in order.
- **Committed in:** 5140e6f

---

**Total deviations:** 4 auto-fixed (2 interface or blocking, 2 test contract). **Impact:** no scope change. Every must-have, acceptance grep and key link holds.

## Issues Encountered

- **Shell escaping:** two Bash and node edits went wrong. A `$\`` in a `String.replace` replacement pasted the whole prefix of the spec file, and a heredoc failed to parse. Both were reverted (`git checkout` of the spec) or redone with the Edit tool before any test run counted.
- **Dev server restarted** before the GREEN e2e runs, as the recorded hot-reload flake (deferred-items.md) advises. Both e2e runs passed on the fresh server.
- **Pre-existing, not touched:** prettier warnings in CarouselControls, CarouselStepper and CarouselView, and 17 ESLint warnings in files this plan does not touch.
- **Key tier observation (D9):** at 1024 x 768 the fixed layout gives the stage whatever the strip leaves. The two key rows, and an open row's panel even more, make the photo smaller. That follows the UI-SPEC composition, but it is worth Tim's look at UAT.

## Verification

- Jest: hotspots, hotspot-pref, view-model, hotspots component and strip all pass. Full run: 63 suites, 942 tests.
- `npm run lint`: exit 0, with palette OK and contrast OK (36 pairs). `npm run type-check`: 0 errors.
- `npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox`: 89 passed, including 18 'Hotspots' runs.
- Regression sweep: `photos.spec`, `photos-carousel.spec`, `design-system.spec`, `data-privacy.spec` and `shell.spec` in Chromium and Firefox: 167 passed.
- Acceptance:
  - Task 1: `photos.labels` 1, `try` 3, `fetch(|document.cookie|sessionStorage` 0, `stack1D` 4.
  - Task 2: `aria-keyshortcuts="h"` 1, `noopener noreferrer` 2, `aria-expanded` 3, `<kbd` 4.
  - Key links: `elevationMetres(` and `useLabelsOn` present. `.skip(` and `.only(` 0.
- Screenshots of the photo page at 1440 (gutter, with a callout open), 1024 (key, with a row open) and 375 (scroll) match the UI-SPEC layout.

## Visual Re-baseline Note (for 10-13)

- Every lightbox and `/photos/{slug}` baseline changes:
  - **Chrome:** 'Hide labels' is now first in the right group.
  - **Photo:** glyphs, leaders and gutter labels from 1280 px; numbered dots below that.
  - **Strip:** the 'Labels' key on the key and scroll tiers, and the legend on desktop.

## Known Stubs

None. WINDOWS stub #2 (the viewer chrome groups) is marked fixed: the right group holds Hide labels, Zoom and, in the lightbox, Close.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- 10-12 and 10-13 can build on the complete viewer. The strip carries every field D-05 lists.
- LBOX-05 and LBOX-04 are also declared by other plans. The `requirements.ready-ids` gate decides whether REQUIREMENTS.md changes now.

## Self-Check: PASSED

- FOUND: all 7 created files (hotspot-layout.ts, hotspot-pref.ts, Hotspots.tsx, the three test files, .red/10-11-t2.json).
- FOUND on this branch: 5140e6f, d5b10f2, dcd75e9, 38c8195.
- The acceptance greps for Tasks 1 and 2 were re-run after the final task commit, and all pass.

---
*Phase: 10-photography*
*Completed: 2026-10-26*
