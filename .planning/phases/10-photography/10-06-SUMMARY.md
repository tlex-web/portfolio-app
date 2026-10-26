---
phase: 10-photography
plan: 06
subsystem: ui
tags: [nextjs-16, react-19, view-transitions, history-replacestate, lightbox, swipe, a11y, playwright, jest]

requires:
  - phase: 10-photography
    provides: "10-01 photoViews with prevSlug/nextSlug, PhotoViewer, ExifStrip; 10-03 chrome groups and StagePhoto; 10-04 JustifiedGrid tiles with data-photo-id; 10-05 intercepted @modal route, LightboxDialog (document keydown Escape/Tab, focus return to the slug shown at close)"
provides:
  - "lib/photos/stepping.ts: PHOTO_PATH, slugFromPath, stepIndex (no wrap), SWIPE_MIN_PX 48, SWIPE_RATIO 1.5, swipeStep"
  - "PhotoViewer: 'Previous photo' / 'Next photo' (aria-disabled at the ends), the aria-hidden 'n / 4' counter [data-photo-counter], ← → keys, touch/pen swipe with follow and spring-back, history.replaceState on both surfaces, polite role=status line, document.title sync, neighbour preload"
  - "StagePhoto prop onLargeLoad; both layers keyed by slug"
  - "components/photos/TileTransition.tsx: grid half of the photo-{slug} morph pair, named only while no photo is open"
  - "app/globals.css: ::view-transition pointer-events none, .morph group timing, root group/snapshots off while a viewer is shown, 150 ms @starting-style dialog fade"
  - "e2e/helpers/view-transitions.ts: recordViewTransitions, readViewTransitions, removeViewTransitions"
affects: [10-07, 10-10, 10-11, 10-12, 10-13, visual baselines]

actuals:
  tokens: 11776
  tasks: 3
  commits: 5
plan_head_before: 171d4eeaf1551bdadb1c529a1ed9667f14069ea1
plan_head_after: f270ec4360a75d5a287e06c6eade506d1993f8ce

tech-stack:
  added: []
  patterns:
    - "Steps write the URL with window.history.replaceState and own the shown slug in state; the step target is read from a ref of the last slug written, because React holds commits while a view transition runs and a click in that window would see stale props"
    - "Keyboard listeners that must work during the open morph register in useLayoutEffect: React runs passive effects only after the view transition"
    - "A named ViewTransition whose name can change is keyed by that name; React registers names per boundary at mount"
    - "Complementary naming from one pathname: grid tiles named only when no photo is open, the viewer named only when one is; Next's hidden bfcache Activity copy then carries no name"

key-files:
  created:
    - lib/photos/stepping.ts
    - lib/__tests__/photos-stepping.test.ts
    - components/photos/TileTransition.tsx
    - e2e/helpers/view-transitions.ts
  modified:
    - components/photos/PhotoViewer.tsx
    - components/photos/StagePhoto.tsx
    - components/photos/JustifiedGrid.tsx
    - components/photos/LightboxDialog.tsx
    - app/globals.css
    - e2e/photos-lightbox.spec.ts
    - .planning/phases/10-photography/deferred-items.md

key-decisions:
  - "10-06 Task 1: Tim's OQ1 answer recorded from the plan's gate row, no new question: \"A: replaceState both (Recommended)\" (2026-10-26); previous/next uses history.replaceState on the photo page and in the lightbox (D-08 as amended)"
  - "10-06: the viewer owns the shown slug (seeded from slugFromPath(usePathname())) instead of re-deriving it from every pathname render; a late pathname sync from an earlier step could otherwise roll the photo back, and every real navigation to another photo remounts the viewer anyway"
  - "10-06: LightboxDialog.close() reads the slug from window.location before router.back(), so focus returns to the photo shown even when usePathname lags a step"
  - "10-06: the root crossfade is turned off on the root group and on its old/new snapshots (html:has(dialog[open], [data-photo-viewer])); the group rule alone would leave the snapshots' default crossfade running"
  - "10-06: ‹ › are icon-only at every width (UI-SPEC gives text labels only to Hide labels, Zoom and Close); every chrome button gains cursor-pointer and touch-manipulation per the UI-SPEC Interaction States rule"

patterns-established:
  - "Later arrow-key layers (10-10 zoomed pan) call event.preventDefault() before PhotoViewer's document listener; it skips defaultPrevented and modified presses"
  - "VT e2e: recordViewTransitions before goto, then read per-transition pseudo lists; only running animations count (React adds finished duration-0 fills on ::view-transition-group(root) and ::view-transition)"

requirements-completed: [LBOX-02, LBOX-06]

coverage:
  - id: D1
    description: "In the lightbox, three Next presses: URL /photos/{fourth}, h2 = fourth title, counter '4 / 4' (aria-hidden), Next aria-disabled and still focused, status 'Photo 4 of 4: {title}' (aria-atomic), document title '{title} · Tim Lui', history.length unchanged, one dialog throughout"
    requirement: LBOX-02
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Moving between photos (LBOX-02) three Next presses in the lightbox: URL, title, counter, focus and no history entry"
        status: pass
    human_judgment: false
  - id: D2
    description: "ArrowRight/ArrowLeft step; at 1 / 4 ArrowLeft and a press on the aria-disabled Previous change nothing and focus stays on it"
    requirement: LBOX-02
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Moving between photos (LBOX-02) the arrow keys step, and nothing moves past either end"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photos-stepping.test.ts#stepIndex (no wrap, UI-SPEC OQ4)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A touch swipe (dx -120, dy 10) on the photo steps to the next photo; swipeStep thresholds 48 px and 1.5 x vertical"
    requirement: LBOX-02
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Moving between photos (LBOX-02) a touch swipe on the photo steps to the next photo @chromium-only"
        status: pass
      - kind: unit
        ref: "lib/__tests__/photos-stepping.test.ts#swipeStep (48 px, 1.5 x the vertical travel)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Closing after two steps returns focus to [data-photo-id={third slug}] in the grid"
    requirement: LBOX-02
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Moving between photos (LBOX-02) closing after two steps returns focus to the tile of the photo shown"
        status: pass
    human_judgment: false
  - id: D5
    description: "Direct /photos/{first}: Next shows the second photo's h1, URL /photos/{second}, no dialog, focus kept, history.length unchanged; reload shows the second photo's page (Pitfall 1)"
    requirement: LBOX-02
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Moving between photos (LBOX-02) on the photo page Next shows the next photo with no dialog, and reload keeps it (Pitfall 1)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Opening from the grid starts a view transition with ::view-transition-group/old/new(photo-{slug}); browser Back starts none; a step records no photo-* pseudo"
    requirement: LBOX-06
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Morph and motion (LBOX-06) (open morph, Back, step cases, @chromium-only)"
        status: pass
    human_judgment: false
  - id: D7
    description: "No duplicate view-transition name (browser error or React's dev warning) across open, three steps and close"
    requirement: LBOX-06
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Morph and motion (LBOX-06) no duplicate view-transition-name across open, three steps and close"
        status: pass
    human_judgment: false
  - id: D8
    description: "Under reduced motion the open runs no view-transition animation; without document.startViewTransition the tile still opens the dialog with focus on Close"
    requirement: LBOX-06
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Morph and motion (LBOX-06) under reduced motion the open runs no view-transition animation @chromium-only"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Morph and motion (LBOX-06) without the View Transitions API the tile still opens with focus on Close"
        status: pass
    human_judgment: false
  - id: D9
    description: "How the morph, the 150 ms dialog fade and the swipe follow/spring-back feel at 375, 1024 and 1440, and on a real touch device"
    verification: []
    human_judgment: true
    rationale: "Motion quality and touch feel need a human eye and finger; e2e proves the pseudo-elements and the step, not how it feels. Flagged assumption A4 (root crossfade off via html:has) is visual only and surfaces at the 10-13 baseline review"
  - id: D10
    description: "Stepping, the morph and replaceState in Safari (flagged assumption A1)"
    verification: []
    human_judgment: true
    rationale: "Local Playwright WebKit cannot hydrate localhost (CSP upgrade-insecure-requests, deferred-items.md) and CI has no WebKit project; Tim's real-Safari check is the UAT item"

duration: 45min
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 06: Moving between photos and the grid morph Summary

**Previous/next now works in the lightbox and on the photo page through the ‹ › buttons, the arrow keys and a touch swipe. Each step rewrites the URL with `history.replaceState`, so it adds no history entry, never opens a dialog over the page and never remounts the viewer. A polite status line announces the new photo and the document title follows it. Opening a grid tile morphs the thumbnail into the lightbox photo over 500 ms `ease-geological`. With reduced motion, or without View Transitions, the open is instant.**

## Task 1: Tim's previous/next decision (OQ1)

The plan's Pre-execution gate row OQ1 already held Tim's literal answer, so no question was asked. His answer is quoted verbatim from that cell: **"A: replaceState both (Recommended)"** (Tim, 2026-10-26, direct question from the orchestrator). 10-CONTEXT.md carries the dated amendment under D-08. The gate row was committed in the plan file before any Task 2 commit (the first is `41bc661`). Task 2 implements option A on both surfaces.

## Performance

- **Duration:** 45 min
- **Started:** 2026-10-26T12:03:41Z
- **Completed:** 2026-10-26T12:48:41Z
- **Tasks:** 3 (one decision recorded, two TDD)
- **Files modified:** 11 (4 created, 7 modified)

## Accomplishments

- **Stepping (LBOX-02):** the chrome's left group, after the page's "All photographs" link, holds "Previous photo" (`CaretLeftIcon` 24), the counter `n / 4` (mono, `tabular-nums`, `aria-hidden`) and "Next photo". All are 44 px icon buttons. At the ends they are `aria-disabled="true"` with `opacity-50 cursor-not-allowed`, stay focusable and do nothing. ← and → step on both surfaces. Alt, Ctrl, Meta and Shift presses, text fields and presses a later layer has already handled are left alone.
- **URL and state:** `step(dir)` takes the neighbour from the view-model's canonical order, never from input (T-10-14). It calls `history.replaceState(null, '', '/photos/{slug}')` and updates the shown slug and the `role="status" aria-atomic` line ("Photo 2 of 4: {title}"). An effect sets `document.title` to '{title} · Tim Lui'. The viewer stays mounted, so focus stays on the pressed button.
- **Swipe:** touch and pen only, on the fitted photo box (`touch-action: pan-y pinch-zoom`). The box follows the finger with `translate` (not under reduced motion). On release, `swipeStep` decides: a step if the swipe is long and horizontal enough, otherwise a spring-back over `--duration-fast` with `ease-erosion`. A browser scroll cancels the pointer and springs back.
- **Neighbour preload:** once the large layer has loaded (`StagePhoto` `onLargeLoad`, including loads that finished before hydration), the previous and next stage derivatives are fetched with `new Image()` at `fetchPriority = 'low'`, with the stage srcset and sizes, once per slug.
- **Morph (LBOX-06):** `TileTransition` names each grid image box `photo-{slug}` (`share="morph"`, `default="none"`) only while no photo is open. The viewer's photo box is the other half of the pair. It is keyed by slug and named only while the pathname names a photo. So an open pairs, a step forms no pair, and no name is ever mounted twice. `JustifiedGrid` stays a Server Component.
- **CSS:** `::view-transition { pointer-events: none }`. `.morph` groups run `--duration-settle` with `--ease-geological`. While a dialog or viewer is shown, the root group and its old and new snapshots do not animate. Under `prefers-reduced-motion: no-preference`, the lightbox dialog fades in over 150 ms through `@starting-style`. The existing reduced-motion `::view-transition-*` block is unchanged.

## Task Commits

1. **Task 1: record Tim's OQ1 answer** - no code commit (recorded here, from the plan's gate row)
2. **Task 2: previous/next by buttons, keys and swipe (LBOX-02)** - `41bc661` (test, RED), `14fbd1a` (feat, GREEN)
3. **Task 3: grid morph, VT CSS and recorder helper (LBOX-06)** - `249e3f1` (test, RED), `6f70eec` (feat, GREEN), `f270ec4` (fix, duplicate view-transition names)

**Plan metadata:** the docs(10-06) commit that follows this SUMMARY.

## TDD Gate Compliance

- **RED, Task 2 (`41bc661`):** Jest ran 10 tests and 5 failed on their target assertions: the slug read, the in-range steps, the thresholds, and the leftward and rightward swipes. The other 5 (the null and 0 cases) passed against the neutral stub committed so the suite loads. In Playwright (chromium), all 5 new cases failed on the missing controls or behaviour: counter or Previous not found, the swipe left the URL unchanged, the page Next button never hydrated. Semantic assessment: valid. Every target ran and failed on the planned behaviour, with no load, syntax or fixture fault.
- **RED, Task 3 (`249e3f1`):** the open-morph and Back cases failed on `count > 0` (no view transition ran, because nothing was named yet). The step, duplicate, reduced-motion and no-API cases passed before GREEN, as guards should when nothing animates. They are kept for that reason, and the duplicate case was later strengthened and proven to fail on the pre-fix viewer (see Deviation 5).
- `gsd_run check tdd-red-evidence` has no Jest or Playwright line-reporter adapter, so I judged RED from the raw console output, as in 10-02 to 10-05. No machine verdict was used.
- **GREEN:** `14fbd1a`: Jest 10/10, e2e 49/49 (photos-lightbox, chromium and firefox). `6f70eec` + `f270ec4`: e2e 57/57 on a fresh dev server (chromium and firefox), 0 React duplicate-name warnings in the server log. No REFACTOR commits.

## Files Created/Modified

- `lib/photos/stepping.ts` - pure slug, step and swipe helpers (no imports)
- `lib/__tests__/photos-stepping.test.ts` - unit cases from the plan's must_haves
- `components/photos/PhotoViewer.tsx` - stepping controls, keys, swipe, status line, title, preload, the viewer half of the morph
- `components/photos/StagePhoto.tsx` - `onLargeLoad`, layers keyed by slug
- `components/photos/TileTransition.tsx` - grid half of the morph
- `components/photos/JustifiedGrid.tsx` - wraps each image box in TileTransition
- `components/photos/LightboxDialog.tsx` - `close()` takes the focus-return slug from the URL
- `app/globals.css` - the View Transition block
- `e2e/helpers/view-transitions.ts` - recorder, reader and API remover
- `e2e/photos-lightbox.spec.ts` - 'Moving between photos (LBOX-02)' (5) and 'Morph and motion (LBOX-06)' (6)
- `.planning/phases/10-photography/deferred-items.md` - dev-server G3 cross-talk (pre-existing)

## Decisions Made

- The OQ1 decision is Tim's (see Task 1). Everything below came up during execution.
- **The viewer owns the shown slug.** It is seeded from `slugFromPath(usePathname())` (the acceptance grep and the plan's key link hold), but the viewer does not adopt every later pathname. Next syncs `usePathname` with `replaceState` inside a transition, and a sync can arrive after a later step, which would roll the photo back. Any real navigation to another photo remounts the viewer, so it misses nothing.
- **Root crossfade off on the snapshots too.** The UI-SPEC rule names `::view-transition-group(root)`. That stops the group, but the old/new root snapshots keep their default 250 ms crossfade. I added `-old(root)` and `-new(root)` to the same `html:has(...)` selector so "the page does not crossfade" actually holds.
- **‹ › icon-only at every width.** The UI-SPEC gives a visible text label from 768 px only to Hide labels, Zoom and Close. `cursor-pointer` and `touch-manipulation` now apply to every chrome button (UI-SPEC Interaction States: "cursor-pointer on every button; touch-action: manipulation on buttons"), which touches Close too. Neither changes pixels at rest.
- **Preload uses the AVIF srcset.** `new Image()` cannot switch types, and every browser that runs this site's View Transitions and `@starting-style` also decodes AVIF. A `<link rel=preload type=image/avif>` would skip unsupported types, but Chromium warns when a preload goes unused, so I rejected it.
- ui-ux-pro-max was loaded. One focused search ("swipe gesture feedback", ux domain) returned the gesture-conflicts rule. The swipe is backed by buttons and keys, and vertical scroll stays with the browser (`pan-y`), as the locked UI-SPEC requires. The Quick Reference rules for touch targets (44 px, 8 px apart, measured), aria-disabled ends, reduced motion and the live region were applied as the UI-SPEC already specifies.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A fast second click during the open morph replayed the first step**
- **Found during:** Task 3 GREEN (the stepping cases regressed once the morph existed)
- **Issue:** While a view transition animates, React holds commits back. The second and third Next clicks ran with the props of the last committed render, so each one stepped to the same photo b again (URL stuck at /photos/b after three clicks).
- **Fix:** `step(dir)` reads the last slug it wrote from a ref and computes the neighbour with `stepIndex`. The buttons, keys and swipe all call it.
- **Files modified:** components/photos/PhotoViewer.tsx
- **Verification:** the three-Next and focus-return cases pass in chromium and firefox. A probe with 1 s pauses had shown the race only appears inside the transition window.
- **Committed in:** 6f70eec

**2. [Rule 1 - Bug] Arrow keys pressed during the morph were lost (Firefox)**
- **Found during:** Task 3 GREEN
- **Issue:** React runs passive effects only after the view transition, so the `useEffect` key listener was not attached yet when a key was pressed in the first 500 ms.
- **Fix:** the arrow listener registers in `useLayoutEffect`, as LightboxDialog's Escape and Tab listener does.
- **Committed in:** 6f70eec

**3. [Rule 1 - Bug] Focus returned to the first tile after fast steps**
- **Found during:** Task 3 GREEN
- **Issue:** LightboxDialog learned the shown slug from a `usePathname()` effect, which can lag a `replaceState` made while commits are held.
- **Fix:** `close()` reads `window.location.pathname` before `router.back()`. The effect stays as the source for browser Back.
- **Files modified:** components/photos/LightboxDialog.tsx
- **Committed in:** 6f70eec

**4. [Rule 1 - Test bug] The recorder counted React's own finished animations**
- **Issue:** React adds `duration: 0, fill: forwards` animations on `::view-transition-group(root)` and `::view-transition` when the root does not take part, so the reduced-motion case saw pseudo-elements that animate nothing.
- **Fix:** the recorder keeps only animations whose `playState` is `running`, which is what the plan's truth says ("no running view-transition animation").
- **Committed in:** 6f70eec

**5. [Rule 1 - Bug] The same photo-{slug} name was mounted twice (RESEARCH Pitfall 6)**
- **Found during:** final verification (React's dev warning "There are two <ViewTransition name=…>" in the server log; the plan's duplicate e2e only matched the browser's "view-transition-name" wording, so it missed it)
- **Issue:** React registers a named boundary under its name when it mounts. When a step renamed the viewer's boundary from photo-a to photo-b, photo-a stayed registered, so the grid tile photo-a collided on close. On close the tiles also took their names in the same commit in which the viewer (moved by Next into a hidden bfcache `<Activity>`) still had its own.
- **Fix:** the viewer's ViewTransition is keyed by slug and rendered only while the pathname names a photo, which is the complement of TileTransition's condition. The duplicate e2e now also matches React's warning. Run against the pre-fix viewer it fails with the photo-a and photo-b warnings; with the fix it passes.
- **Files modified:** components/photos/PhotoViewer.tsx, e2e/photos-lightbox.spec.ts
- **Committed in:** f270ec4

**6. [Rule 1 - Test bug] Status line expectation after ignored presses**
- **Issue:** my Task 2 case expected an empty status after stepping back to 1 / 4, but that step announces "Photo 1 of 4". The ignored end presses must leave the line unchanged, and the assertion now says so.
- **Committed in:** 14fbd1a

---

**Total deviations:** 6 auto-fixed (4 bugs, 2 test bugs)
**Impact on plan:** No scope change. All three bugs were exposed by the morph itself (React's commit hold during a view transition), and the fixes make the plan's truths hold under it. Every artifact, export and acceptance grep in the plan is present.

## Issues Encountered

- **Dev-server cross-talk on G3 (pre-existing).** In a fresh dev-server run of photos-lightbox, photos and design-system together (2 workers), `design-system.spec.ts` "scroll lock keeps the header box" sometimes gets a document navigation instead of the dialog. It passes alone (3/3) and against the production build. The pre-plan commit 171d4ee, run the same way in a temporary worktree, fails identically (75 passed, 1 failed), so 10-06 did not cause it. It is logged in deferred-items.md. The temporary worktree and its node_modules junction were removed.
- **Local WebKit** still cannot hydrate localhost (CSP `upgrade-insecure-requests`, deferred from 10-05), so the plan's optional local `--project=webkit` run was not possible. A1 (Safari) stays a UAT item.
- `app/globals.css` already failed `prettier --check` before this plan. I appended the new block in the file's style and did not reformat the rest. Every other file this plan touched is Prettier-clean.
- LBOX-02 and LBOX-06 are also declared by 10-10, 10-12 and 10-13. `requirements.ready-ids` reports both as blocked, so REQUIREMENTS.md is not changed by this plan.

## Verification

- `npx jest lib/__tests__/photos-stepping.test.ts --silent`: 10 passed. Full Jest: 56 suites, 838 tests passed.
- `npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox --workers=2`: 57 passed on a fresh dev server, with 17 runs of "Moving between photos" / "Morph and motion" titles, after the final commit.
- Plan-level, production build: `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts e2e/photos.spec.ts e2e/design-system.spec.ts e2e/home-ascent.spec.ts --project=chromium --project=firefox --workers=4`: 190 passed (before `f270ec4`, which changes only the viewer's naming; the dev runs after it pass). `public/service-worker.js` was restored afterwards.
- `npm run lint`: exit 0, warnings only in legacy files outside this plan, all guards OK. `npm run type-check`: 0 errors.
- Acceptance, Task 2: `slugFromPath` appears 2 times in PhotoViewer, `useParams` 0, `role="status"` 1, `history.replaceState` 2. `^import` appears 0 times in stepping.ts.
- Acceptance, Task 3: `::view-transition {` appears once in globals.css. `share="morph"` appears once in TileTransition and once in PhotoViewer. `use client` appears 0 times in JustifiedGrid. `.skip(`, `.only(` and `.fixme(` appear 0 times in the spec and the helper.
- Screenshots at 375 x 800, 1024 x 768 and 1440 x 900 (lightbox) and 1440 (page, 4 / 4). Previous starts at x 16, the counter at x 68 and Next at x 118, all 44 x 44 with 8 px gaps. Close is 44 px at 375 and 109 px with its label from 768. The disabled end is dimmed.

## Visual Re-baseline Note (for 10-13)

- `/photos/{slug}` and the lightbox: the chrome's left group now shows ‹ n / 4 › (after "All photographs" from 768 px on the page). Any baseline of the photo page changes in the chrome bar. The lightbox has no baseline yet.
- `/photos?view=grid`: no change at rest (TileTransition adds no DOM).
- Close gained `cursor-pointer touch-manipulation`, with no pixel change.

## Known Stubs

- WINDOWS stub #2 (`components/photos/PhotoViewer.tsx` chrome groups) stays open, but only for the right group. The left group is now filled (stepping and counter). Zoom and Hide labels arrive with 10-10/10-11.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **10-07 (carousel stepper):** reuse `stepIndex` and the same `aria-disabled` end pattern. Its "Open photo" link needs `data-photo-id` for focus return.
- **10-10 (zoom):** while zoomed, handle ← → → in a keydown listener that calls `preventDefault` before PhotoViewer's (it skips defaultPrevented presses), and gate the swipe on "fitted". A step should reset zoom.
- **10-11 (callouts):** a step should collapse any expanded hotspot. The viewer stays mounted across steps, so that needs explicit state reset keyed on the shown slug.
- **10-13:** re-baseline the photo page's chrome bar.

## Self-Check: PASSED

- All 4 created files exist on disk.
- All 5 task commits (41bc661, 14fbd1a, 249e3f1, 6f70eec, f270ec4) are ancestors of HEAD.
- The acceptance greps for Tasks 2 and 3 pass, and the OQ1 answer is quoted above.

---
*Phase: 10-photography*
*Completed: 2026-10-26*
