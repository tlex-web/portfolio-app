---
phase: 10-photography
plan: 05
subsystem: ui
tags: [nextjs-16, parallel-routes, intercepting-routes, dialog, showModal, focus-trap, a11y, playwright, jest]

requires:
  - phase: 10-photography
    provides: "10-01 photoViews, photoBySlug, photoMetadata, PhotoViewer, ExifStrip h2#photo-title; 10-03 chrome groups, lb-* tiers, StagePhoto opener-first paint; 10-04 grid tiles a[data-photo-id][scroll=false] at /photos?view=grid"
provides:
  - "app/(site)/photos/layout.tsx (children + modal), @modal/default.tsx and @modal/page.tsx (null), @modal/(.)[slug]/page.tsx (intercepted photo route, generateMetadata = photoMetadata, notFound guard)"
  - "components/photos/LightboxDialog.tsx: default LightboxDialog({ children, labelledBy }), useLightbox(): { close, registerEscape } | null, restoreFocus(slug, opener)"
  - "Escape layering contract: registerEscape handlers run newest first, the first returning true consumes the press, the dialog closes last; on the page a document keydown listener skips defaultPrevented presses and pushes /photos"
  - "PhotoViewer modal variant: 'Close photo' button last in data-chrome-right; the modal viewer fills the dialog on the key and gutter tiers"
  - "jest.setup.js: HTMLDialogElement showModal/close stubs for jsdom"
  - "Home WaypointCard 'View photo' links to /photos/{slug}"
affects: [10-06, 10-07, 10-08, 10-10, 10-11, 10-12, 10-13, visual baselines]

actuals:
  tokens: 7203
  tasks: 3
  commits: 5
plan_head_before: 334bcb656121a1ab2d68201b7dc185c4ef8d6161
plan_head_after: b38b6c4853cda7afe13c6bf02a9104b1c1dfa3c2

tech-stack:
  added: []
  patterns:
    - "Parallel @modal slot + (.)[slug] interception: same URL is the dialog on a soft navigation and the full page on a hard load or reload"
    - "Native <dialog> + showModal() in a layout effect, guarded for StrictMode; Escape and Tab on a document keydown listener with preventDefault; cancel always prevented; close re-syncs the URL"
    - "Focus restore in a microtask after unmount, skipped when the dialog node is still connected (StrictMode's simulated unmount)"
    - "e2e: wait for React to hydrate a next/link (an __reactProps key on the element) before clicking, because a pre-hydration click is a document navigation and is never intercepted"

key-files:
  created:
    - app/(site)/photos/layout.tsx
    - app/(site)/photos/@modal/default.tsx
    - app/(site)/photos/@modal/page.tsx
    - app/(site)/photos/@modal/(.)[slug]/page.tsx
    - components/photos/LightboxDialog.tsx
    - components/photos/__tests__/lightbox-dialog.test.tsx
  modified:
    - components/photos/PhotoViewer.tsx
    - jest.setup.js
    - e2e/photos-lightbox.spec.ts
    - e2e/photos.spec.ts
    - e2e/design-system.spec.ts
    - components/home/WaypointCard.tsx
    - components/home/__tests__/waypoints.test.tsx
    - e2e/home-ascent.spec.ts
    - .planning/phases/10-photography/deferred-items.md

key-decisions:
  - "10-05: the lightbox handles Escape and Tab on a document keydown listener, not the dialog's onKeyDown, so a press is caught wherever focus sits (including body after a click on non-focusable dialog content)"
  - "10-05: close() calls router.back() at most once per lightbox instance, so a second Escape while the history step is in flight cannot go back past the gallery"
  - "10-05: the modal viewer gets lb-key:h-full lb-gutter:h-full; without a height the size-container stage collapses to 0 and the photo box has no width"
  - "10-05: restoreFocus falls back to main h1 and gives it tabindex -1 when it has none, because a heading is not focusable otherwise"

patterns-established:
  - "Later Escape layers (10-10 zoom, 10-11 callouts): in the modal call useLightbox().registerEscape(handler) and return true when consumed; on the page call event.preventDefault() in a keydown listener so PhotoViewer's /photos fallback skips the press"
  - "Later chrome controls go before Close in data-chrome-right (Hide labels, Zoom) and in data-chrome-left (stepping, counter); the Tab wrap picks them up automatically"

requirements-completed: [LBOX-01, LBOX-03]

coverage:
  - id: D1
    description: "From /photos?view=grid a tile click opens a dialog labelled by the h2 title over the grid: URL /photos/{slug}, the grid list still in the DOM, one banner, title '{title} · Tim Lui'"
    requirement: LBOX-01
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Lightbox over the gallery (LBOX-01) a tile click opens the photo in a dialog over the grid"
        status: pass
      - kind: e2e
        ref: "e2e/photos.spec.ts#Grid view (PHOTO-02, PHOTO-03, D-15) clicking the first tile opens its photo in the lightbox (LBOX-01)"
        status: pass
      - kind: unit
        ref: "components/photos/__tests__/lightbox-dialog.test.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: "Back closes the lightbox (URL /photos?view=grid, no dialog), Forward reopens it, reload while it shows /photos/{slug} renders the full page h1 with no dialog; Close photo closes through router.back()"
    requirement: LBOX-01
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Lightbox over the gallery (LBOX-01) Back closes it, Forward reopens it, reload lands on the full page"
        status: pass
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Lightbox over the gallery (LBOX-01) the Close photo button closes it and the URL returns to the grid"
        status: pass
    human_judgment: false
  - id: D3
    description: "Focus moves to Close photo on open; Tab and Shift+Tab x12 stay inside the dialog (Chromium, Firefox); Escape closes and focus lands on the tile's [data-photo-id]; three open-and-Escape cycles stay in sync; opening from a scrolled grid keeps window.scrollY"
    requirement: LBOX-03
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Focus and Escape (LBOX-03) (6 cases, chromium + firefox)"
        status: pass
    human_judgment: false
  - id: D4
    description: "G3: with the lightbox open from a grid tile, html overflow is hidden and the header box is unchanged with a real 10 px gutter"
    verification:
      - kind: e2e
        ref: "e2e/design-system.spec.ts#scroll lock keeps the header box @chromium-only"
        status: pass
    human_judgment: false
  - id: D5
    description: "On the photo page Escape navigates to /photos, never a browser Back (D-08)"
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Focus and Escape (LBOX-03) on the photo page, Escape goes to /photos (D-08)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Home's View photo links point to /photos/{slug}; a hydrated click from / lands on the full page h1 with no dialog (D-08)"
    verification:
      - kind: unit
        ref: "components/home/__tests__/waypoints.test.tsx#links View photo to the photo page of its slug"
        status: pass
      - kind: e2e
        ref: "e2e/home-ascent.spec.ts#Waypoint cards (HOME-05) every View photo link opens its photo page (D-08)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Tab wrap and dialog behaviour in Safari (flagged assumption A1)"
    verification: []
    human_judgment: true
    rationale: "Local Playwright WebKit cannot load the site's scripts (CSP upgrade-insecure-requests on localhost, logged in deferred-items.md) and CI has no WebKit project; Tim's real-Safari check is the UAT item"
  - id: D8
    description: "Look of the lightbox at 375, 1024 and 1440 (opaque gallery backdrop, Close placement, the empty left chrome group until 10-06)"
    verification: []
    human_judgment: true
    rationale: "Visual quality needs a human eye; the lightbox has no visual baseline until 10-12/10-13"

duration: 34min
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 05: In-site lightbox (intercepted route in a native dialog) Summary

**Clicking a grid tile now opens the photo in a native `<dialog>` over the still-mounted gallery, served by the parallel `@modal` slot's intercepted `(.)[slug]` route. The URL is `/photos/{slug}`. Back and Close photo close it through `router.back()`, Forward reopens it, and a reload of the same URL renders the full photo page. Focus goes to Close on open. Tab and Shift+Tab wrap inside the dialog. Escape is handled on keydown with layers newest first. When the dialog closes, focus returns to the shown photo's `[data-photo-id]` tile. `<html>` is scroll-locked without moving the header. Home's waypoint links now go to the photo pages, which are not intercepted.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-10-26T11:25:26Z
- **Completed:** 2026-10-26T11:59:21Z
- **Tasks:** 3 (two TDD, one auto)
- **Files modified:** 15 (6 created, 9 modified)

## Accomplishments

- **Routes:** `photos/layout.tsx` renders `children` and then `modal`. `@modal/default.tsx` and `@modal/page.tsx` return null, so a hard load has no dialog and a soft return to `/photos` unmounts it. `@modal/(.)[slug]/page.tsx` exports `generateMetadata` from `photoMetadata(slug)`, which gives the same '{title} · Tim Lui' title as the page. It calls `notFound()` for unknown slugs and renders `LightboxDialog` around `PhotoViewer variant="modal"`. There is no `loading.tsx` in the slot.
- **LightboxDialog:** `showModal()` runs in a layout effect, guarded for StrictMode. The first opener (the clicked tile) is recorded, focus moves to Close photo, and `<html>` gets `overflow: hidden` until cleanup. A document keydown listener handles Escape (`preventDefault`, layers newest first, then `close()`) and the Tab wrap over the visible tabbables. `onCancel` is always prevented. `onClose` calls `close()` only while the URL still names a photo. `close()` calls `router.back()` once per instance.
- **Focus return:** `restoreFocus(slug, opener)` runs in a microtask after unmount. It focuses `[data-photo-id="CSS.escape(slug)"]` with `preventScroll` and then `scrollIntoView({ block: 'nearest' })`. If that is missing it uses the opener, and then `main h1`. The slug is the last photo pathname seen through `usePathname()`, so 10-06's `replaceState` stepping returns focus to the photo shown at close.
- **PhotoViewer:** in the modal, the Close photo button is last in `data-chrome-right`. It uses the UI-SPEC chrome-button classes, `XIcon` at 24 px, and visible text "Close" from 768 px. The modal viewer is `h-full` on the key and gutter tiers. On the page, an Escape that no layer consumed does `router.push('/photos')` (D-08).
- **Home:** WaypointCard's View photo href is now `/photos/{slug}`. The text, aria-label and classes are unchanged, so this is not a visual change.

## Task Commits

1. **Task 1: @modal slot, intercepted route, dialog shell** - `c235cc9` (test, RED), `a4a33e6` (feat, GREEN)
2. **Task 2: focus trap, keydown Escape, close guards, focus return, scroll lock** - `691a9dc` (test, RED), `7dea8eb` (feat, GREEN)
3. **Task 3: Home waypoints link to the photo pages** - `b38b6c4` (feat)

**Plan metadata:** the docs(10-05) commit that follows this SUMMARY.

## TDD Gate Compliance

- **RED, Task 1 (`c235cc9`):** Jest ran 4 tests and 3 failed on their target assertions. The dialog role was not found, `useLightbox()` returned null inside, and overflow was `""` instead of `hidden`. The "null outside" case passed, as it should against the stub. In Playwright (chromium), all 4 new or rewritten cases failed on `getByRole('dialog')` toBeVisible, "element(s) not found". A pass-through `LightboxDialog` stub was committed with the tests so the suite loads. Semantic assessment: valid. Every target ran and failed on the planned behaviour, with no load, syntax or fixture fault.
- **RED, Task 2 (`691a9dc`):** 5 of the 7 targeted cases failed on their planned assertions (chromium). These were: "after Tab 1" false; the dialog count was still 1 after Escape, alone and in cycle 1; the focus-return slug was null; and the page URL did not change on Escape. Two passed in RED. "Focus moves to Close photo on open" passed because the native `showModal()` focusing steps already pick the first focusable control, which is Close. The G3 rewrite passed because Task 1 already applied the lock. Both are kept: the explicit focus call stays correct once 10-06 puts ‹ › before Close, and G3 guards a regression.
- `gsd_run check tdd-red-evidence` has no Jest or Playwright line-reporter adapter, so I judged RED from the raw console output, as in 10-02 to 10-04. No machine verdict was used.
- **GREEN:** `a4a33e6`: Jest 4/4 and e2e 52/52 (photos-lightbox and photos, chromium and firefox, 2 workers). `7dea8eb`: e2e 52/52 (photos-lightbox and design-system, chromium and firefox). No REFACTOR commits.

## Files Created/Modified

- `app/(site)/photos/layout.tsx` - children + modal slot
- `app/(site)/photos/@modal/default.tsx`, `app/(site)/photos/@modal/page.tsx` - null slot states
- `app/(site)/photos/@modal/(.)[slug]/page.tsx` - intercepted photo route
- `components/photos/LightboxDialog.tsx` - dialog shell, context, focus restore
- `components/photos/__tests__/lightbox-dialog.test.tsx` - jsdom contract of the shell
- `components/photos/PhotoViewer.tsx` - Close button, modal sizing, page Escape
- `jest.setup.js` - HTMLDialogElement stubs
- `e2e/photos-lightbox.spec.ts` - 'Lightbox over the gallery (LBOX-01)' (3) and 'Focus and Escape (LBOX-03)' (6)
- `e2e/photos.spec.ts` - grid click expects the dialog
- `e2e/design-system.spec.ts` - G3 opens the lightbox from a grid tile and asserts the overflow lock
- `components/home/WaypointCard.tsx`, `components/home/__tests__/waypoints.test.tsx`, `e2e/home-ascent.spec.ts` - Home links to the photo pages
- `.planning/phases/10-photography/deferred-items.md` - local WebKit CSP issue

## Decisions Made

- **Document keydown listener, not `onKeyDown`.** The listener sees Escape and Tab wherever focus sits, including `body` after a click on non-focusable dialog content, where a React handler on the dialog would never fire.
- **One `router.back()` per lightbox.** A second Escape or Close while the popstate is pending would otherwise step back past the gallery.
- **Modal viewer `h-full` on key and gutter.** The stage is a size container, so without a definite height the photo box would be 0 px wide.
- **`main h1` fallback gets `tabindex="-1"`** if it has none, so the last fallback can actually take focus.
- ui-ux-pro-max was loaded. One focused search ("keyboard focus modal", ux domain) confirmed the visible focus ring and focus-not-obscured rules, which the global focus style and the 80 px scroll margin already cover. I followed the locked UI-SPEC as written.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The modal viewer had no height on the key and gutter tiers**
- **Found during:** Task 1
- **Issue:** The page viewer gets `calc(100svh - nav)` and the modal viewer got nothing. A `container-type: size` stage inside a height-less flex column collapses to 0, which leaves the photo box with no width.
- **Fix:** `lb-key:h-full lb-gutter:h-full` on the modal viewer. The dialog is `h-dvh`.
- **Verification:** screenshots at 1440 x 900 (box 998 x 665 at x 216, so the gutters hold), 1024 x 768 and 375 x 800.
- **Committed in:** a4a33e6

**2. [Rule 3 - Blocking test design] e2e waits for hydration before clicking a tile**
- **Found during:** Task 1 GREEN
- **Issue:** Under parallel dev-server load, a click on the server-rendered tile link before hydration is a document navigation. It is never intercepted, so the test lands on the full page and sees no dialog. The first request also compiles the intercepted route, which can take more than 5 s.
- **Fix:** A `waitForHydration` helper polls for React's `__reactProps` key on the link before the click, and the first dialog expectation waits 20 s. The same wait is in `photos.spec.ts`, G3 and the Home test.
- **Committed in:** a4a33e6, 691a9dc, b38b6c4

**3. [Rule 3 - Blocking test design] Page-Escape e2e retries the press**
- **Found during:** Task 2 GREEN (Firefox, under load)
- **Issue:** PhotoViewer attaches its listener in an effect after hydration, and an early press could land before it.
- **Fix:** The test presses Escape inside `expect(...).toPass()` until the URL is `/photos`. It still fails if the listener never works.
- **Committed in:** 7dea8eb

**4. [Rule 2 - Robustness] Escape and Tab on a document listener, plus a single-close guard**
- **Found during:** Task 2
- **Issue / Fix:** See Decisions. The plan's `onKeyDown` would miss presses while focus is on `body`, and a double Escape would call `router.back()` twice.
- **Committed in:** 7dea8eb

**5. [Rule 3 - Blocking] Lint rule `react-hooks/globals` on the jsdom probe**
- **Issue:** The first probe assigned the hook result to a module variable during render.
- **Fix:** The probe renders the API's shape as text, and the test reads it.
- **Committed in:** a4a33e6

---

**Total deviations:** 5 auto-fixed (1 bug, 1 robustness, 3 blocking test or lint issues)
**Impact on plan:** No scope change. Every artifact, export and acceptance grep in the plan is present.

## Issues Encountered

- **The local WebKit run could not be done.** `proxy.ts` sends a CSP with `upgrade-insecure-requests`, and Playwright WebKit 27.2 on Windows applies it to `http://localhost`. Every `/_next/static` request becomes `https://` and fails with "SSL connect error", so the page never hydrates. This happened on the dev server and on `PW_PROD=1` alike, and it also breaks the 10-01 and 10-03 WebKit cases. It is logged in `deferred-items.md`. The fix would be a security-header change, so I did not make it. A1 (Safari Tab wrap) stays a UAT item.
- **Dev-server load:** with the default worker count (16 on this machine), unrelated cases such as "the strip shows every field" time out. Every run in this SUMMARY used 2 workers on the dev server, or 4 on the production build, as 10-03 did.
- The legacy `/photos` 3D toggle still logs the React `removeChild` console error. This is pre-existing (07-19) and outside this plan.
- `e2e/design-system.spec.ts`, `components/home/WaypointCard.tsx` and `components/home/__tests__/waypoints.test.tsx` already failed `prettier --check` before this plan. I left them unformatted. The files this plan created or that were clean before are formatted.
- LBOX-01 and LBOX-03 are also declared by later Phase 10 plans. `requirements.ready-ids` reports both as blocked, so REQUIREMENTS.md is not changed by this plan.

## Verification

- `npx jest components/photos/__tests__/lightbox-dialog.test.tsx`: 4 passed. `npx jest components/home/__tests__/waypoints.test.tsx`: 9 passed. Full Jest: 55 suites, 828 tests passed.
- `npm run lint`: 0 errors, 18 pre-existing warnings in legacy files, none in this plan's files, and all guards OK (contrast 36 pairs). `npm run type-check`: 0 errors.
- `npx playwright test e2e/photos-lightbox.spec.ts e2e/photos.spec.ts --project=chromium --project=firefox --workers=2`: 52 passed.
- `npx playwright test e2e/photos-lightbox.spec.ts e2e/design-system.spec.ts --project=chromium --project=firefox --workers=2`: 52 passed. G3 gutter 10 px, header box 1430 x 64 before and after.
- `npx playwright test e2e/home-ascent.spec.ts --project=chromium --workers=2`: 49 passed.
- Plan-level: `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts e2e/photos.spec.ts e2e/design-system.spec.ts e2e/home-ascent.spec.ts --project=chromium --project=firefox --workers=4`: 173 passed against the production build, so the routes also build. `public/service-worker.js` was restored afterwards.
- Acceptance: the three slot files exist, with 0 `loading.tsx`. `showModal` appears 4 times in LightboxDialog and 3 in jest.setup.js. `photoMetadata` appears 3 times in the intercepted page. `View details for` appears 0 times in design-system.spec. `queueMicrotask` appears once and `preventDefault` 6 times in LightboxDialog. `history.back(` appears 0 times in PhotoViewer. In WaypointCard, `photos#` appears 0 times and `photos/${slug}` once. `photos#` appears 0 times in home-ascent.spec.

## Visual Re-baseline Note (for 10-13)

- Home: the waypoint links changed only their href, so there is no pixel change.
- `/photos` (map and carousel): unchanged. `/photos?view=grid` and `/photos/{slug}`: unchanged at rest. The lightbox is new and has no baseline yet (10-12/10-13).

## Known Stubs

- WINDOWS stub #2 (`components/photos/PhotoViewer.tsx` chrome groups) stays open. This plan adds Close to the modal's right group. `data-chrome-left` is still empty in the modal until 10-06 (stepping, counter), and Zoom and Hide labels arrive with 10-10/10-11.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **10-06:** step with `history.replaceState`. `usePathname()` drives the focus-return slug and the document title effect. ‹ › and the counter go in `data-chrome-left` and get the Tab wrap automatically. The open morph and the `@starting-style` fade go on the `<dialog>`, which already paints the opener derivative first.
- **10-10 / 10-11:** register Escape layers through `useLightbox().registerEscape` in the modal, and call `preventDefault` in a keydown listener on the page.
- **10-07 / 10-08:** map pins and the carousel's "Open photo" need `data-photo-id` and links to `/photos/{slug}` to get the same interception and focus return.

## Self-Check: PASSED

- All 6 created files exist on disk.
- All 5 task commits (c235cc9, a4a33e6, 691a9dc, 7dea8eb, b38b6c4) are ancestors of HEAD.
- The acceptance greps for all three tasks pass.

---
*Phase: 10-photography*
*Completed: 2026-10-26*
