---
phase: 10-photography
plan: 09
subsystem: ui
tags: [nextjs, react, view-transitions, router-replace, aria-pressed, phosphor, jest, playwright, legacy-removal]

# Dependency graph
requires:
  - phase: 10-photography (10-04)
    provides: "VIEWS, GalleryView, parseView, viewHref, VIEW_LABELS in lib/photos/view-param.ts; JustifiedGrid"
  - phase: 10-photography (10-06)
    provides: "View Transition CSS in app/globals.css (reduced-motion settle, root crossfade off under a viewer) and e2e/helpers/view-transitions.ts"
  - phase: 10-photography (10-08)
    provides: "PhotosHeader with a children slot; /photos opening on MapSheet; one keyed view section per parseView"
  - phase: 10-photography (10-01)
    provides: "buildPhotoViews and elevationMetres(ref, altitudeM) in lib/photos/view-model.ts"
provides:
  - "components/photos/ViewSwitcher.tsx: the Map · Grid · Carousel toggle group (role=group 'View', aria-pressed, router.replace with scroll false)"
  - "/photos: the switcher in the header band and the one view section in a keyed photos-view ViewTransition (crossfade at --duration-panel ease-erosion)"
  - "The legacy photo UI and bridge removed: PhotosPageClient, GalleryGrid, ImageDetailModal, InteractiveHotspot, the legacy components/PhotoCarousel3D, data/landscapes.ts, LandscapeImage and ImageAnnotation"
  - "A Jest source guard: no app, components or lib file reads an image-manifest legacy path"
affects: [10-11, 10-12, 10-13, phase-12-verify]

# Actuals (#2632)
actuals:
  tokens: 29200
  tasks: 2
  commits: 3
plan_head_before: 8036bfc11b2086e33fccef57ad1f8c4c517191a5
plan_head_after: aa9dff6d868f6cd7311ed770658da5123c494ce6

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Same-route crossfade: ViewTransition key={view} name='photos-view' share/enter auto, default none (Next view-transitions guide, Step 4); no AnimatePresence"
    - "Toggle group with aria-pressed buttons, no roving tabindex; the pressed segment returns early"
    - "Legacy-source guard regex assembled at run time so the guard file does not match itself"

key-files:
  created:
    - components/photos/ViewSwitcher.tsx
    - components/photos/__tests__/view-switcher.test.tsx
    - .planning/phases/10-photography/.red/10-09-t1.json
  modified:
    - app/(site)/photos/page.tsx
    - app/globals.css
    - e2e/photos.spec.ts
    - data/types.ts
    - data/__tests__/editorial.test.ts
    - components/photos/__tests__/strip.test.tsx
    - lib/__tests__/photos-view-model.test.ts
    - scripts/guards/palette-ratchet.json
    - data/schemas/editorial.ts
    - components/photos/PhotoCarousel3D.tsx

key-decisions:
  - "10-09: the switcher e2e scrolls the 375 x 600 page by 100 px, not 200: the switcher's top is 184 px down the page under a 64 px sticky header, so a deeper scroll hides it and the click itself scrolls it back (measured: 200 -> 109 in Chromium, 200 -> 0 in Firefox before any navigation)"
  - "10-09: the legacy-path guard walks app, components and lib in full (tests included) with a pattern assembled at run time; data/ is not walked (data/generated/image-manifest.ts still defines the legacy entries Phase 12 deletes)"
  - "10-09: the 'generated tags' view-model case reads data/generated/photos.ts tags plus the view's years and rights, because PhotoView carries no tags field"

patterns-established:
  - "View switch = router.replace(viewHref(v), { scroll: false }); the header stays outside the keyed region, so React keeps the pressed button and its focus"

requirements-completed: [PHOTO-02, LBOX-04]

coverage:
  - id: D1
    description: "Map · Grid · Carousel segmented control in the header band: group 'View', three aria-pressed buttons with 20 px aria-hidden icons, exactly one pressed, selected = overlay + ink + 2 px accent bar"
    requirement: PHOTO-02
    verification:
      - kind: unit
        ref: "components/photos/__tests__/view-switcher.test.tsx#ViewSwitcher (D-14)"
        status: pass
      - kind: e2e
        ref: "e2e/photos.spec.ts#View switcher (PHOTO-02, D-14) › opens on Map with the three segments in order"
        status: pass
    human_judgment: false
  - id: D2
    description: "Switching replaces the URL (/photos, ?view=grid, ?view=carousel) with no history entry, no scroll jump and focus kept; pressing the pressed segment changes nothing"
    requirement: PHOTO-02
    verification:
      - kind: unit
        ref: "components/photos/__tests__/view-switcher.test.tsx#pressing Carousel replaces the URL with '/photos?view=carousel' and scroll false"
        status: pass
      - kind: e2e
        ref: "e2e/photos.spec.ts#View switcher (PHOTO-02, D-14) › at 375 x 600 switching replaces the URL with no history entry, no scroll jump and focus kept"
        status: pass
      - kind: e2e
        ref: "e2e/photos.spec.ts#View switcher (PHOTO-02, D-14) › pressing the pressed segment changes nothing"
        status: pass
    human_judgment: false
  - id: D3
    description: "The chosen view survives reload, and Back from a photo opened in the grid returns to /photos?view=grid with Grid pressed; Tab reaches the segments in order and Space presses one"
    requirement: PHOTO-02
    verification:
      - kind: e2e
        ref: "e2e/photos.spec.ts#View switcher (PHOTO-02, D-14) › a reload keeps Grid, and Back from a photo returns to the grid with Grid pressed"
        status: pass
      - kind: e2e
        ref: "e2e/photos.spec.ts#View switcher (PHOTO-02, D-14) › Tab reaches the three segments in order and Space presses one"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photos-view-param.test.ts#round-trips through parseView for every view"
        status: pass
    human_judgment: false
  - id: D4
    description: "One view mounted at a time in a keyed photos-view ViewTransition; the switch crossfades at --duration-panel ease-erosion, instant under reduced motion"
    requirement: PHOTO-02
    verification:
      - kind: e2e
        ref: "e2e/photos.spec.ts#View switcher (PHOTO-02, D-14) › a switch crossfades the view region as photos-view @chromium-only"
        status: pass
    human_judgment: true
    rationale: "e2e proves the photos-view old/new pseudo-elements animate in Chromium; whether the 250 ms crossfade reads as 'same place, different content' (and the Firefox/Safari feel) is a visual judgment"
  - id: D5
    description: "Legacy photo UI and bridge deleted; no app, components or lib source reads a manifest legacy path; every deleted test rewritten (3 strip, 8 view-model); palette ratchet lists no deleted file"
    requirement: LBOX-04
    verification:
      - kind: unit
        ref: "lib/__tests__/photos-view-model.test.ts#no app, components or lib source reads a manifest legacy path"
        status: pass
      - kind: unit
        ref: "data/__tests__/editorial.test.ts#photo view-model (replaces the legacy bridge, DATA-08)"
        status: pass
      - kind: unit
        ref: "components/photos/__tests__/strip.test.tsx#capture label (rewritten from the ImageDetailModal tests, D-03)"
        status: pass
      - kind: other
        ref: "node scripts/guards/test-count.mjs --jest jest-results.json (jest 907 + e2e 312 = 1219, baseline 966)"
        status: pass
      - kind: other
        ref: "npm run lint (guard:palette OK) && npm run type-check"
        status: pass
    human_judgment: false

# Metrics
duration: 25min
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 09: View Switcher and Legacy Photo UI Removal Summary

**A Map · Grid · Carousel toggle group in the /photos header band that switches views with `router.replace(viewHref(v), { scroll: false })`. A keyed `photos-view` ViewTransition crossfades the switch. The v1 photo UI, its `data/landscapes.ts` bridge and the `LandscapeImage`/`ImageAnnotation` types are deleted. Their 11 tests were rewritten against the view-model.**

## Performance

- **Duration:** about 25 min
- **Started:** 2026-10-26T14:29:24Z
- **Completed:** 2026-10-26T14:54:00Z
- **Tasks:** 2
- **Files modified:** 20 (7 deleted, 3 created, 10 modified)

## Accomplishments

- `components/photos/ViewSwitcher.tsx` (client) is a `role="group"` named 'View'. It holds three `aria-pressed` buttons, Map, Grid and Carousel. Each has a 20 px `aria-hidden` Phosphor icon (`MapTrifoldIcon`, `SquaresFourIcon`, `CardsThreeIcon`, from `dist/ssr`) and is `min-h-11` with `touch-manipulation` and `cursor-pointer`. Unselected segments are `text-ink-muted` and hover to the overlay. The selected one is `bg-surface-overlay text-ink` with the 2 px `after:` accent bar, so colour is never the only cue. Focus uses the global 2 px ring.
- Pressing a segment calls `router.replace(viewHref(v), { scroll: false })`. Pressing the pressed one returns early. The header sits outside the keyed region, so React keeps the button and focus stays on it.
- `app/(site)/photos/page.tsx` (still a Server Component) passes `<ViewSwitcher view={view} />` into the PhotosHeader slot. It wraps the one view section in `ViewTransition key={view} name="photos-view" share="auto" enter="auto" default="none"`, the guide's Step 4 pattern. `app/globals.css` times the `photos-view` group, old and new at `--duration-panel` `--ease-erosion`. The existing reduced-motion rule (`animation: none !important`) makes the switch instant.
- Deleted with `git rm` after a `git grep` found no importer outside the set: `components/PhotosPageClient.tsx`, `GalleryGrid.tsx`, `ImageDetailModal.tsx`, `InteractiveHotspot.tsx`, the legacy `components/PhotoCarousel3D.tsx`, `data/landscapes.ts` and `components/__tests__/ImageDetailModal.test.tsx`. `data/types.ts` no longer declares `LandscapeImage` or `ImageAnnotation`, and type-check is clean.
- Every deleted test has a new counterpart:
  - The 3 ImageDetailModal cases became 'capture label (rewritten from the ImageDetailModal tests, D-03)' in `strip.test.tsx`.
  - The 8 legacy-bridge cases became 'photo view-model (replaces the legacy bridge, DATA-08)' in `editorial.test.ts`.
  - The FORBIDDEN case now checks `JSON.stringify(buildPhotoViews())` and the view-model source.
- New guard: 'no app, components or lib source reads a manifest legacy path'.
- `npm run guard:palette -- --update` tightened the ratchet to `{ "components/Header.tsx": 1 }`. The five deleted files dropped out and nothing was raised.
- Test counts (not `--update`d; 10-13 raises the ratchet): Jest 907 (60 suites, 0 failed, 0 pending), e2e list 312, total 1219 against the 966 baseline. Net +8 Jest (+7 switcher, +3 strip, +1 legacy guard, -3 deleted modal), +6 e2e.

## Task Commits

1. **Task 1: switcher with router.replace and the keyed view crossfade:** `330ae31` (test, RED), `dffba2c` (feat, GREEN)
2. **Task 2: delete the legacy photo UI and bridge; rewrite their tests; tighten the ratchet:** `aa9dff6` (refactor)

**Plan metadata:** the docs commit that follows this SUMMARY.

## TDD Evidence

- **RED, Task 1 (`330ae31`):**
  - **Jest:** 7 of 7 new view-switcher cases failed against a neutral `return null` stub, committed so the suite loads. Each failed on its own lookup ("Unable to find an accessible element with the role group / button"), with no load or syntax fault. Jest has no adapter in `tdd-red-evidence`, so this was judged from the raw output, as in 10-01 to 10-08.
  - **Playwright:** run with `--reporter=line,junit`. All 11 'View switcher' cases (6 Chromium, 5 Firefox) failed because the header had no View group. `gsd check tdd-red-evidence` returned `RED_EVIDENCE_OK` (target `photos.spec.ts`, 11/11 failing). Record: `.planning/phases/10-photography/.red/10-09-t1.json`. Semantic assessment: valid.
- **GREEN (`dffba2c`):**
  - Jest: switcher, view-param and header suites, 30/30.
  - `e2e/photos.spec.ts` on the dev server (Chromium + Firefox): 52/52.
  - Production build (`photos.spec.ts` + `photos-carousel.spec.ts`, `--repeat-each=2`): 130/130.
- **REFACTOR:** none needed.
- The round-trip invariant (`parseView` of `viewHref(v)`'s parameter equals `v` for every view) was already in `lib/__tests__/photos-view-param.test.ts` from 10-04 ('round-trips through parseView for every view'), so no duplicate was added.

## Files Created/Modified

- `components/photos/ViewSwitcher.tsx`: the toggle group (new)
- `components/photos/__tests__/view-switcher.test.tsx`: 7 unit cases with a mocked `next/navigation` (new)
- `app/(site)/photos/page.tsx`: the switcher in the header slot; the keyed `photos-view` ViewTransition
- `app/globals.css`: `photos-view` crossfade timing
- `e2e/photos.spec.ts`: describe 'View switcher (PHOTO-02, D-14)', 6 cases
- `data/types.ts`: `LandscapeImage` and `ImageAnnotation` removed
- `data/__tests__/editorial.test.ts`: header, FORBIDDEN case and the eight view-model cases
- `components/photos/__tests__/strip.test.tsx`: the three capture-label cases
- `lib/__tests__/photos-view-model.test.ts`: the legacy-path source guard
- `scripts/guards/palette-ratchet.json`: tightened
- `data/schemas/editorial.ts`, `components/photos/PhotoCarousel3D.tsx`: comments no longer point at the deleted bridge and legacy carousel

## Decisions Made

- The switcher e2e scrolls by 100 px instead of 200. A probe measured the switcher's top at 184 px under a 64 px sticky header at 375 px wide. A 200 px scroll hides the switcher, and Playwright's click scrolls it back into view before any navigation: 200 became 109 in Chromium and 0 in Firefox, with the document height unchanged. The case now asserts the switcher sits below the sticky header before it measures `scrollY`.
- The legacy-path guard walks `app`, `components` and `lib` in full. It builds its pattern at run time so it does not match its own source.
- `PhotoView` has no tags field, so the 'generated tags' case reads the generated `photos` tags (`2021`, `autumn`) and checks the view's `years` and `rights` never say 2024.
- ui-ux-pro-max was loaded before the UI work. Its rules applied within the locked UI-SPEC:
  - `icon-context`: icons are aria-hidden beside visible text, and state is `aria-pressed`.
  - `touch-target-size` and `tap-delay`: 44 px tall segments with `touch-action: manipulation`.
  - `color-not-only`: an accent bar as well as the colour change.
  - `fade-crossfade` and `reduced-motion`: the crossfade, instant under reduced motion.
  - `focus-states`: the global 2 px ring.
  - `back-behavior` and `deep-linking`: the URL is the state, with no history entries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Switcher e2e scroll offset hid the switcher under the sticky header**
- **Found during:** Task 1 (GREEN run)
- **Issue:** the planned 200 px scroll at 375 x 600 puts the switcher (top 184 px) under the 64 px sticky site header. Playwright's actionability scroll then moves the page before the click, so `scrollY` changed for a reason that has nothing to do with the app (probe: the scroll event fired about 70 ms before the URL changed).
- **Fix:** scroll by 100 px and assert the switcher is below the header first. The no-scroll-jump assertion is unchanged.
- **Files modified:** e2e/photos.spec.ts
- **Verification:** 52/52 on the dev server, 130/130 and 238/238 on the production build
- **Committed in:** `dffba2c`

**2. [Rule 1 - Docs] Stale comments pointed at deleted files**
- **Found during:** Task 2
- **Issue:** `data/schemas/editorial.ts` said the bridge formats elevations. The new `components/photos/PhotoCarousel3D.tsx` said the legacy carousel "stays for the legacy default view".
- **Fix:** reworded both to name the view-model and the deletion.
- **Committed in:** `aa9dff6`

---

**Total deviations:** 2 auto-fixed (Rule 1). **Impact:** test-harness correctness and comment accuracy only; no scope change.

## Issues Encountered

- **Dev-server carousel stepper reset (new deferred item).** In two dev-server runs, `photos-carousel.spec.ts` "the stepper ... never advances by itself" ended its six idle seconds on 1 / 4 in Chromium, so the stepper had remounted. A 4-run probe on the dev server never reset. The production build passed the case every time (130/130, then 238/238). This matches the recorded dev cross-talk family, so it was logged in `deferred-items.md`.
- **Heredoc-to-node edits dropped backslashes** in two regex literals (the Windows command-line round-trip). Both were fixed with the Edit tool before any run counted.
- **Pre-existing, not touched:** `app/globals.css` and `data/types.ts` already failed `prettier --check` at the pre-plan HEAD. The 17 ESLint warnings are all in files this plan does not touch.

## STATE carry-overs closed or updated

- IN-08 (legacy variants): no Phase 10 consumer is left on the legacy variants, and the Jest guard holds it there. Phase 12 deletes the 60 files.
- "1 hotspots": the badge's source (`GalleryGrid.tsx`) is deleted (10-04 had already rewritten its test). Only Tim's photos/* re-baseline remains.
- 07-19 notes: the `ImageDetailModal` bg-opacity classes and the legacy `PhotoCarousel3D` inline hex and `text-snow-200` are gone with their files. The grid/3D toggle that logged `removeChild` no longer exists.
- IN-02: the legacy bridge that dropped `position.approximate` is deleted. The view-model carries it (`altitudeLabel`, the strip's ≈ and approx note). The 08 disposition row is still 10-13's to record.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- PHOTO-02 is fully wired (map, grid, carousel and switcher). 10-11 (hotspots) and 10-12 and 10-13 build on `/photos` as it stands.
- The visual baselines for photos/* (the header band now carries the switcher) need a re-baseline through the usual gh flow. Tim commits the PNGs.
- `README.md` and `.github/copilot-instructions.md` still describe the deleted v1 files (docs only). They are left for the Phase 12 docs pass.

## Self-Check: PASSED

- FOUND: components/photos/ViewSwitcher.tsx, components/photos/__tests__/view-switcher.test.tsx, .planning/phases/10-photography/.red/10-09-t1.json
- FOUND commits on this branch: 330ae31, dffba2c, aa9dff6
- Acceptance criteria re-run, all PASS:
  - Task 1: `router.replace` 1, `scroll: false` 1, `use client` 0 and 0, `photos-view` in globals.css 4.
  - Task 2: all seven files absent, no `LandscapeImage` match, `landscapes` 0 and `buildPhotoViews` 5 in editorial.test, legacy names in the ratchet 0.
- Plan verification:
  - Full Jest 907/907 and the test-count guard OK (1219 ≥ 966).
  - `npm run lint` and `npm run type-check` exit 0.
  - `e2e/photos.spec.ts` in Chromium and Firefox: 52/52 (dev), and on the production build within 238/238 (photos, lightbox, carousel, shell, data-privacy, design-system). `public/service-worker.js` was restored after each build.

---
*Phase: 10-photography*
*Completed: 2026-10-26*
