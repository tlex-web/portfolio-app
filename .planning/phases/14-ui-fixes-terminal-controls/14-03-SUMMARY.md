---
phase: 14-ui-fixes-terminal-controls
plan: 03
subsystem: ui
tags: [nextjs, app-router, focus-management, scroll-restoration, lightbox, playwright, jest, a11y]

requires:
  - phase: 14-ui-fixes-terminal-controls
    provides: "14-02 (wave 2) tip; the serial depends_on chain on the shared :3000 e2e server"
  - phase: 10
    provides: "LightboxDialog restoreFocus, the unmount microtask every close path ends in, [data-photo-id] triggers in Map, Grid and Carousel"
provides:
  - "revealTrigger(el): window-only, instant, minimal scroll that clears --nav-h and the 4 px focus ring, top-aligning an oversized trigger, target rounded outward to a whole pixel"
  - "restoreFocus reveals the shown photo's trigger now and again in the next animation frame, after the browser's history scroll restoration"
  - "e2e describe 'Focus on close stays in view (LBOX-08)': the 14-row D-11 Chromium matrix plus the cross-engine Map 720x450 row"
affects: [14-08 (WebKit row in CI, second-frame contingency), phase 18 (rewrites only the open-and-step setup of the LBOX-08 describe)]

actuals:
  tokens: 5862
  tasks: 2
  commits: 3
plan_head_before: 3d00c80d43c928b61b4ae03da8fa231fd3250f0e
plan_head_after: c248310f9964bb4df8885df8f1d272dec8dd16cf

tech-stack:
  added: []
  patterns:
    - "Focus return after a history traversal: focus({ preventScroll: true }), reveal, then reveal again in requestAnimationFrame guarded by document.activeElement"
    - "Window-only scrollBy with rect math instead of scrollIntoView, so overflow-hidden ancestors (the map sheet) never scroll"
    - "Scroll targets rounded outward to whole pixels (ceil going down, floor going up or top-aligning), because Chromium snaps window scroll positions"
    - "Contract-level e2e rows: precondition 'trigger off-screen while the dialog is open', outcome 'focused [data-photo-id] box inflated by the ring inside the viewport below --nav-h'"

key-files:
  created: []
  modified:
    - components/photos/LightboxDialog.tsx
    - components/photos/__tests__/lightbox-dialog.test.tsx
    - e2e/photos-lightbox.spec.ts

key-decisions:
  - "LBOX-08 root cause (D-08): every lightbox close is a history traversal and the browser's same-document scroll restoration (scrollRestoration 'auto') runs after restoreFocus's microtask, undoing the reveal; block 'nearest' also clipped the ring's bottom 4 px"
  - "Fix: revealTrigger in restoreFocus, run once immediately and once in the next animation frame; no scroll listeners or timers, history.scrollRestoration untouched; UI-SPEC P4 resolved to the restore code (no scroll-mb-4 class)"
  - "revealTrigger rounds its target outward to a whole pixel: Chromium snapped a 348.375 px scroll to 348 and left the ring 0.375 px under the viewport edge (Grid at 1366x650 and 1280x560)"
  - "The existing scroll-unchanged row (:471) now centres its tile: scrollIntoViewIfNeeded left the tile's bottom at 700.375 in Chromium's 700 px viewport, ring clipped, so the reveal's 4 px move was correct by D-09"

patterns-established:
  - "LBOX-08 describe helpers: triggerState, expectTriggerFullyInView, expectTriggerOffscreen, openFirst(page, setup), stepToLast, closeBy; a ROWS table drives one test per view x size x close path"
  - "reveal-delta annotations record the scroll the reveal applied per row"

requirements-completed: [LBOX-08]

coverage:
  - id: D1
    description: "After stepping and closing by Escape, focus is on the shown photo's trigger and the trigger with its ring is fully in view below the nav, in Map, Grid and Carousel at 1366x650, 1280x560, 720x450 and 375x667 (Chromium)"
    requirement: "LBOX-08"
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Focus on close stays in view (LBOX-08) (PW_PROD=1 --project=chromium -g LBOX-08: 14 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "'Close photo' and browser Back (page.goBack()) meet the same outcome through the one restoreFocus change (D-10)"
    requirement: "LBOX-08"
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Map at 720x450: step to the last photo, Close photo / browser Back, the trigger is fully in view"
        status: pass
    human_judgment: false
  - id: D3
    description: "Cross-engine Map 720x450 Escape row passes in Firefox; WebKit row runs in CI (14-08)"
    requirement: "LBOX-08"
    verification:
      - kind: e2e
        ref: "e2e/photos-lightbox.spec.ts#Map at 720x450: step to the last photo, Escape, the trigger is fully in view @no-win-webkit (firefox)"
        status: pass
      - kind: e2e
        ref: "Linux WebKit in CI (14-08), not run locally"
        status: unknown
    human_judgment: false
  - id: D4
    description: "revealTrigger math (below, under the nav, oversized, already visible, whole-pixel rounding), the next-frame re-reveal and the opener / main h1 fallback chain"
    requirement: "LBOX-08"
    verification:
      - kind: unit
        ref: "components/photos/__tests__/lightbox-dialog.test.tsx#revealTrigger (LBOX-08) (17 passed)"
        status: pass
    human_judgment: false
  - id: D5
    description: "No regression in the rest of the lightbox file, including the focus-return rows and the scroll-unchanged row"
    verification:
      - kind: e2e
        ref: "PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox (116 passed)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-11-14
status: complete
---

# Phase 14 Plan 03: Lightbox focus stays in view after close (LBOX-08) Summary

**restoreFocus now reveals the shown photo's trigger, with its 4 px ring, below the 64 px nav twice: once at once and once in the next animation frame, after the browser's history scroll restoration. The reveal is a window-only, instant, minimal `scrollBy` rounded to whole pixels. A 14-row Chromium matrix plus a Firefox row proves it on every view, size and close path.**

## Root cause (D-08)

Every lightbox close is a history traversal: `router.back()` for Escape and 'Close photo', and the browser itself for Back. The app router leaves `history.scrollRestoration` at `'auto'`. So after `restoreFocus`'s unmount microtask, the browser's same-document scroll restoration put the window back at the position saved when the photo opened, which undid the old `scrollIntoView`. That call's `block: 'nearest'` also left the ring's bottom 4 px under the viewport edge.

**Fix commit:** `9c80851`, plus the whole-pixel rounding fix `5b6a76a`.

## Performance

- **Duration:** 12 min
- **Started:** 2026-11-14T11:25:51Z
- **Completed:** 2026-11-14T11:38:11Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `revealTrigger(el)` (exported) and `RING_PX = 4` in `components/photos/LightboxDialog.tsx`. The function reads `--nav-h` from the root, scrolls the window only, instantly and as little as needed, and top-aligns a trigger taller than the room. It rounds the target outward to a whole pixel.
- In `restoreFocus`, only the mark branch changed. It keeps `focus({ preventScroll: true })`, calls `revealTrigger(mark)`, then calls it again in `requestAnimationFrame` while the mark still has focus. The opener and `main h1` fallbacks are unchanged, and the JSDoc records the diagnosis.
- Jest: 10 new rows, covering the reveal math (four branches plus rounding), the next-frame re-reveal, skipping that re-reveal once focus has moved on, and both fallbacks. The WR-01 row now stubs `window.scrollBy` and lets one frame run while the stub is in place.
- Playwright: describe "Focus on close stays in view (LBOX-08)", 14 Chromium rows and 1 Firefox row. A mutation run without the next-frame re-reveal failed all 15.

## Matrix rows (D-11)

Setup (a), bottom edge: start at `scrollY` 0, open the first photo's trigger by focus without a scroll plus Enter, then step to the last photo. Setup (b), top edge: scroll to `scrollHeight` first, then the same open and step. Deltas are from `reveal-delta` annotations (Chromium unless marked).

| Row | Setup | Close | scrollY before -> after (delta) |
|-----|-------|-------|---------------------------------|
| Map 720x450 (Chromium, Firefox, Linux WebKit) | a | Escape | 0 -> 312 (+312) in Chromium and Firefox |
| Map 1366x650 | a | Escape | 0 -> 42 (+42) |
| Map 1280x560 | a | Escape | 0 -> 132 (+132) |
| Map 375x667 | b | Escape | 1193 -> 507 (-686) |
| Grid 1366x650 | a | Escape | 0 -> 349 (+349) |
| Grid 1280x560 | a | Escape | 0 -> 439 (+439) |
| Grid 720x450 (ends on the 286 px tile) | a | Escape | 0 -> 1685 (+1685) |
| Grid 375x667 | a | Escape | 0 -> 833 (+833) |
| Carousel 1366x650 | b | Escape | 1011 -> 741 (-270) |
| Carousel 1280x560 | b | Escape | 1094 -> 741 (-353) |
| Carousel 720x450 | b | Escape | 1337 -> 683 (-654) |
| Carousel 375x667 | b | Escape | 1384 -> 803 (-581) |
| Map 720x450 | a | Close photo | 0 -> 312 (+312) |
| Map 720x450 | a | browser Back (`page.goBack()`) | 0 -> 312 (+312) |

Each row's precondition held with the planned setup, so no row switched setup. **WebKit row: runs in CI (14-08).**

Final helper names: `triggerState(page, slug, focused)`, `expectTriggerFullyInView(page, slug)`, `expectTriggerOffscreen(page, slug)`, `openFirst(page, setup)` (stands in for the plan's `openFromTop` / `openFromBottom`), `stepToLast(page, dialog, browserName)` and `closeBy(page, dialog, close)`.

## Task Commits

1. **Task 1: revealTrigger, Jest rows and the cross-engine Map 720x450 Escape row** - `9c80851` (fix)
2. **Task 2: the full D-11 matrix** - `5b6a76a` (fix: whole-pixel rounding found by the matrix) and `c248310` (test: 13 rows)

## Files Created/Modified

- `components/photos/LightboxDialog.tsx`: `RING_PX`, `revealTrigger`, the next-frame re-reveal in `restoreFocus`, and the D-08 diagnosis in its JSDoc and the module JSDoc.
- `components/photos/__tests__/lightbox-dialog.test.tsx`: `describe('revealTrigger (LBOX-08)')` with 10 rows; the WR-01 row now stubs `window.scrollBy`.
- `e2e/photos-lightbox.spec.ts`: the LBOX-08 describe. The scroll-unchanged row (:471) now centres its tile (see Deviations).

## Decisions Made

- I followed the plan's mechanism (RESEARCH "Recommended mechanism") with no `history.scrollRestoration` change and no scroll listener or timer. UI-SPEC P4 resolves to the alternative: the ring clearance lives in `revealTrigger`, and `git grep scroll-mb-4 -- components app` finds nothing.
- I opened each trigger by focus with `preventScroll` plus Enter in both setups, not by click. A click's actionability scroll would move the page at open time and blur the setup.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The reveal lost a sub-pixel to Chromium's scroll snapping**
- **Found during:** Task 2 (matrix run)
- **Issue:** Grid at 1366x650 and 1280x560 failed. A trace showed `scrollBy({ top: 348.375 })` landing on `scrollY` 348, which left the tile's bottom at 646.375 and its ring at 650.375 against `innerHeight` 650.
- **Fix:** `revealTrigger` now computes an absolute target and rounds it outward: `ceil` going down, `floor` going up or when top-aligning. It still scrolls with `scrollBy`.
- **Files modified:** components/photos/LightboxDialog.tsx, components/photos/__tests__/lightbox-dialog.test.tsx (rounding row)
- **Verification:** the 14 Chromium rows passed after a fresh build, and Jest passed 17.
- **Committed in:** `5b6a76a`

**2. [Rule 1 - Bug] The scroll-unchanged row's setup produced a trigger with a clipped ring**
- **Found during:** Task 1 (verify run)
- **Issue:** the plan expected `photos-lightbox.spec.ts:471` to pass unchanged. In Chromium, `scrollIntoViewIfNeeded()` left the third tile's bottom at 700.375 in a 700 px viewport, so the ring was 4.375 px out. By D-09 the trigger was not fully visible, and the reveal correctly moved 4 px (248 to 252). Firefox put the tile fully in view and passed.
- **Fix:** the row now centres the tile with `scrollIntoView({ block: 'center', behavior: 'instant' })`. Its assertion is unchanged (focus on the tile, `scrollY` unchanged), so it still guards "an already visible trigger does not move". Rewritten, not deleted (GUARD-03).
- **Files modified:** e2e/photos-lightbox.spec.ts
- **Verification:** the whole lightbox file passed in Chromium and Firefox (116 passed).
- **Committed in:** `9c80851`

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** both were needed to meet D-09 exactly. No scope creep, and the production change stays in `LightboxDialog.tsx` only.

## Issues Encountered

- Each `PW_PROD` build injects a hash into `public/service-worker.js`. I restored it with `git checkout` after every build, and it is never committed.
- The last mutation run left `.next` built from the mutated source, so I ran `npm run build` again to leave a clean build. No server is listening on :3000.

## Verification

- `npx jest components/photos/__tests__/lightbox-dialog.test.tsx`: 17 passed.
- `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox --reporter=line -g "LBOX-08|Focus and Escape|closing after two steps|browser Back right after a step"`: 22 passed.
- `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --reporter=line -g "LBOX-08"`: 14 passed.
- `PW_PROD=1 npx playwright test e2e/photos-lightbox.spec.ts --project=chromium --project=firefox --reporter=line`: 116 passed.
- `--list -g "LBOX-08"`: 14 tests in Chromium, 1 in Firefox.
- Mutation (next-frame re-reveal removed, fresh build): 15 failed in Chromium and Firefox; source restored.
- `npm run lint`: exit 0. `npm run type-check`: clean.
- Acceptance greps: `export function revealTrigger` 1, `requestAnimationFrame` 1, `behavior: 'instant'` 1, `mark.scrollIntoView` 0, `revealTrigger` in the Jest file 11, `LBOX-08` in the e2e file 3, `scroll-mb-4` absent (exit 1), `page.goBack()` 3.

## User Setup Required

None. No external service configuration required.

## Next Phase Readiness

- Ready for 14-04. The test-count ratchet is raised at phase close (project convention), not here.
- 14-08 runs the Linux WebKit Map 720x450 row in CI. If WebKit restores scroll after the first frame (RESEARCH A1), add the idempotent second-frame re-reveal there.

## Self-Check: PASSED

- FOUND: components/photos/LightboxDialog.tsx, components/photos/__tests__/lightbox-dialog.test.tsx, e2e/photos-lightbox.spec.ts
- FOUND: 9c80851, 5b6a76a, c248310 (ancestors of HEAD)

---
*Phase: 14-ui-fixes-terminal-controls*
*Completed: 2026-11-14*
