---
phase: 14-ui-fixes-terminal-controls
plan: 01
subsystem: ui
tags: [nextjs, next-link, tailwind, focus-visible, mobile-menu, playwright, jest]

requires:
  - phase: 13-repo-safety-test-debt
    provides: ledger row #6 (07 WR-06) handed to Phase 14 as SHELL-07
provides:
  - Current-page tap closes the mobile menu (SHELL-07; D-16 with the D-23 query rule)
  - Inset focus ring on the mobile panel links, never clipped at 375 px (SHELL-08; D-17)
  - Panel focus reveal that keeps a focused row inside the panel's scrollport (Firefox)
  - New visual test "menu @375 current row focused" (PNG produced by 14-08)
affects: [14-07 ledger write-back, 14-08 baseline dispatch, SiteNav]

actuals:
  tokens: 4500
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Link onClick that default-prevents only a plain primary activation of the strict current pathname (Next skips navigation and scroll-to-top on defaultPrevented)"
    - "focus({ preventScroll: true }) for controls inside the sticky header: the global scroll-margin-top makes a plain focus() scroll the page"
    - "e2e scroll assertions use page.mouse.click at the box centre, not locator.click(), whose actionability scroll honours scroll-margin-top"

key-files:
  created:
    - .planning/phases/14-ui-fixes-terminal-controls/deferred-items.md
  modified:
    - components/site/SiteNav.tsx
    - components/site/__tests__/SiteNav.test.tsx
    - e2e/shell.spec.ts
    - e2e/visual/routes.spec.ts

key-decisions:
  - "SHELL-07 fix commit is 49b8fe1 (for 14-07's ledger row #6 write-back); SHELL-08 is 75e9900"
  - "The tap close focuses Menu with preventScroll: the global :where(*) scroll-margin-top (nav + 16 px) made a plain focus() of the sticky button scroll /roadmap from 600 to 530 (Chromium) or 185.5 (Firefox), breaking D-16"
  - "Panel onFocus scrolls only the panel so a focused row sits fully inside it with 8 px (py-2) clearance: Firefox left Contact half below the panel at 375 x 320; a no-op in Chromium"
  - "The Escape handler has the same focus-scroll jump; left unchanged (pre-existing, no requirement) and logged in deferred-items.md"

patterns-established:
  - "Tab until the target is focused (capped) instead of a fixed Tab count: Firefox makes a scrolling panel a Tab stop"

requirements-completed: [SHELL-07, SHELL-08]

coverage:
  - id: D1
    description: "A plain tap on the current page's panel link closes the menu, focuses Menu and keeps scroll, URL and document; Ctrl/Shift clicks keep the panel open"
    requirement: SHELL-07
    verification:
      - kind: unit
        ref: "components/site/__tests__/SiteNav.test.tsx#closes on a plain tap on the current page link, prevents the navigation and focuses Menu (SHELL-07, D-16)"
        status: pass
      - kind: unit
        ref: "components/site/__tests__/SiteNav.test.tsx#keeps the panel open on a Ctrl or Shift click of the current page link (SHELL-07)"
        status: pass
      - kind: e2e
        ref: "e2e/shell.spec.ts#tapping the current page's link closes the panel and keeps the scroll (SHELL-07, D-16) [chromium, firefox]"
        status: pass
    human_judgment: false
  - id: D2
    description: "On /photos?view=grid a tap on Photographs navigates to /photos and the panel ends closed with focus on Menu"
    requirement: SHELL-07
    verification:
      - kind: e2e
        ref: "e2e/shell.spec.ts#on a view URL, Photographs still navigates to the plain page (D-23) [chromium, firefox]"
        status: pass
    human_judgment: false
  - id: D3
    description: "Focused panel links draw the 2 px ring 2-4 px inside the row (offset -4px), inside the panel's client rect at the top and bottom rows and while the panel scrolls"
    requirement: SHELL-08
    verification:
      - kind: e2e
        ref: "e2e/shell.spec.ts#focused panel links draw an inset ring the panel never clips (SHELL-08, D-17) [chromium, firefox]"
        status: pass
      - kind: e2e
        ref: "e2e/shell.spec.ts#the inset ring stays inside the panel while it scrolls at 375 x 320 (SHELL-08, D-17) [chromium, firefox]"
        status: pass
    human_judgment: false
  - id: D4
    description: "New menu baseline: menu open at 375 on /projects with focus on the current row (ring abutting the accent bar)"
    requirement: SHELL-08
    verification:
      - kind: other
        ref: "PW_PROD=1 npx playwright test --list --project=visual-dark -g \"menu @375\" (registered; no PNG yet)"
        status: pass
    human_judgment: true
    rationale: "The PNG menu/375-current-focus-visual-dark-linux.png only comes from the 14-08 CI dispatch; Tim reviews it, including the 1.21:1 focus-versus-accent pair (ring and bar must abut, never overlap), and commits it"

duration: 10min
completed: 2026-11-14
status: complete
plan_head_before: c066758bc431db1ad6970dee69b107934d7607b0
plan_head_after: 75e9900f27ee117f4ffea43f3aa6c0e88a1d8b2a
---

# Phase 14 Plan 01: Mobile menu current-page tap and inset focus ring Summary

**A plain tap on the current page's menu link now closes the panel without a navigation or scroll jump (D-23 view URLs still navigate and close), and the panel links draw their focus ring 2-4 px inside the row so it is never clipped at 375 px.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-11-14T10:56:45Z
- **Completed:** 2026-11-14T11:06:45Z
- **Tasks:** 2
- **Files modified:** 4 (plus deferred-items.md)

## Accomplishments

- SHELL-07: the panel `<Link>` `onClick` handles a plain primary tap on the link whose `href` strictly equals the pathname. With no query string it is default-prevented, so Next skips the navigation and its scroll-to-top. With a query string (`/photos?view=grid`) Next still navigates, and the handler closes the panel at tap, because `usePathname` drops the query and the route-change close never fires. In both cases Menu gets focus first, as Escape does.
- SHELL-08: `focus-visible:-outline-offset-4` on the panel links only. `app/globals.css` is unchanged, and the desktop links, wordmark and Menu button keep the outside ring.
- Browser proof in Chromium and Firefox: the whole `e2e/shell.spec.ts` passes (74/74), and so do the keyboard, lightbox and audit menu rows (26/26).
- New visual test `menu @375 current row focused`, snapshot `['menu', '375-current-focus.png']`. **Declared PNG:** `e2e/visual/routes.spec.ts-snapshots/menu/375-current-focus-visual-dark-linux.png` (new). It comes from the 14-08 dispatch, and Tim commits it.

## Task Commits

1. **Task 1: Current-page tap closes the menu (SHELL-07)** - `49b8fe1` (fix). This is the SHELL-07 fix SHA for 14-07's ledger row #6.
2. **Task 2: Inset focus ring, browser proof and menu baseline test (SHELL-08)** - `75e9900` (fix)

## Files Created/Modified

- `components/site/SiteNav.tsx`: current-page tap close (close trigger 7, documented in the DefaultNav comment), `focus({ preventScroll: true })`, inset ring class, `revealFocusedRow` panel `onFocus`
- `components/site/__tests__/SiteNav.test.tsx`: two SHELL-07 rows (plain tap default-prevented and closing; Ctrl/Shift click stays open). The 10 existing rows are unchanged.
- `e2e/shell.spec.ts`: SHELL-07, D-23 and two SHELL-08 rows in "Shell mobile menu"
- `e2e/visual/routes.spec.ts`: the `menu @375 current row focused` test
- `.planning/phases/14-ui-fixes-terminal-controls/deferred-items.md`: the Escape scroll jump

## Decisions Made

- Strict `item.href === pathname`, not `isCurrentPath`. 'Photographs' on `/photos/[slug]` keeps navigating, and the route-change close handles it.
- No `onNavigate`. Next 16.4.5 calls it only after its own `preventDefault`, and it never runs in Jest.
- The plain-activation test mirrors Next's `isModifiedEvent`: `button === 0` and no meta, ctrl, shift or alt key.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Focusing Menu scrolled the page, which broke D-16's "scroll untouched"**
- **Found during:** Task 1 (the first e2e run failed: scrollY went from 600 to 460 in Chromium and to 185.5 in Firefox)
- **Issue:** the global `:where(*) { scroll-margin-top: calc(var(--nav-h) + 16px) }` gives the sticky Menu button an 80 px scroll margin, so `buttonRef.current.focus()` scrolls the page up to "reveal" a button that is already in view. A debug spec isolated it: a bare `focus()` gave 530 in Chromium and 185.5 in Firefox. Playwright's `locator.click()` actionability scroll added a separate 70 px in Chromium.
- **Fix:** `focus({ preventScroll: true })` in the tap handler. The e2e row taps with `page.mouse.click` at the box centre, so only the app's effect is measured, and it reads `scrollBefore` after the panel opens.
- **Files modified:** components/site/SiteNav.tsx, e2e/shell.spec.ts
- **Verification:** SHELL-07 and D-23 rows 4/4 in Chromium and Firefox
- **Committed in:** 49b8fe1

**2. [Rule 1 - Bug] Firefox left the focused bottom row half outside the scrolling panel**
- **Found during:** Task 2 (the 375 x 320 SHELL-08 row failed in Firefox: ring bottom 342 against panel bottom 319)
- **Issue:** in a short viewport, Firefox does not scroll the panel when focus lands on a partly visible row (scrollTop stayed 0, by Tab and by `.focus()`, with or without scroll-margin). So the row and its ring were cut at the panel edge. Chromium scrolls it in.
- **Fix:** `revealFocusedRow` on the panel's `onFocus` scrolls only the panel, never the page, so the focused row sits inside it with 8 px clearance (the panel's `py-2`).
- **Files modified:** components/site/SiteNav.tsx
- **Verification:** whole shell.spec 74/74 (Chromium and Firefox); keyboard, lightbox and audit menu rows 26/26
- **Committed in:** 75e9900

**3. [Rule 3 - Blocking] Firefox makes the scrolling panel a Tab stop**
- **Found during:** Task 2
- **Issue:** a fixed Tab count from Menu landed one row short in Firefox at 375 x 320, because the panel `div` takes focus first.
- **Fix:** the test Tabs until the target link is focused (capped at index + 3). The visual test uses the same loop.
- **Files modified:** e2e/shell.spec.ts, e2e/visual/routes.spec.ts
- **Committed in:** 75e9900

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** fixes 1 and 2 were needed to meet the plan's own truths (D-16 scroll kept; ring inside the panel while it scrolls). The disclosure stays a disclosure: no focus trap and no scroll lock.

## Issues Encountered

- The `postbuild` script (`inject-build-hash.mjs`) leaves `public/service-worker.js` injected. The next `PW_PROD` build then refuses to start, as the script's own message warns. After each build I restored the file with `git checkout -- public/service-worker.js`, and it is never committed.
- Out of scope, logged in `deferred-items.md`: the menu's Escape handler has the same focus-scroll jump. It is pre-existing and no requirement covers it.

## Next Phase Readiness

- Ready for 14-02. WebKit runs the new rows in CI (14-08), since local WebKit for Playwright 1.65 is not installed.
- The CI visual compare will report the new `menu/375-current-focus` PNG as missing until the 14-08 baseline dispatch produces it and Tim commits it.
- No server is left on :3000.

## Self-Check: PASSED

- Commits 49b8fe1 and 75e9900 are ancestors of HEAD; key files exist; acceptance greps and the plan-level verification (Jest, whole shell.spec in Chromium and Firefox, lint, type-check) re-run green.
