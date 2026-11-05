---
phase: 12-contact-edge-pages-cleanup-verification
plan: 21
subsystem: testing
tags: [playwright, keyboard, focus-order, a11y, verify-02, d-22]

requires:
  - phase: 12-20
    provides: "Audit gate and its helper patterns (hydration waits, console allow-list context)"
  - phase: 12-16
    provides: "Contact panel order and the WebKit links-are-not-Tab-stops precedent"
  - phase: 12-26
    provides: "The focused error summary and the register entry focus contract"
provides:
  - "e2e/keyboard.spec.ts: 11 keyboard-only flows per engine with exact focus order (nav, 375 menu, map, lightbox, contact, 404, error page)"
  - "Zero keyboard findings in the app: no focus-order, trap or focus-return defect in chromium, firefox or webkit"
affects: [12-23, 12-24, ci-e2e, test-count-ratchet]

actuals:
  tokens: 5400
  tasks: 2
  commits: 1
plan_head_before: beb800638e9fc9007147dd27ab72cd3533af1070
plan_head_after: e085c0111b456324362efac91cf6719ec2b2a665

tech-stack:
  added: []
  patterns:
    - "walk(page, browserName, stops): one key press per stop, toBeFocused on each; WebKit drops link stops and keeps the exact order of the rest"
    - "expectEndOfPage: the walk ends past the footer; the next Tab goes to the body (Chromium, WebKit) or stays on the last stop (headless Firefox)"
    - "Error page forced with an init script that makes window.matchMedia throw (the disableWebGL pattern), so /projects/box's demo terminal throws inside the page segment"
    - "Honeypot watch: a focus listener on #trail-note sets a window flag that every contact flow asserts false"

key-files:
  created:
    - e2e/keyboard.spec.ts
  modified: []

key-decisions:
  - "No app fix was needed: all 6 first-run failures were defects in the new spec, fixed in the spec, never by changing an app file or weakening a Chromium or Firefox assertion"
  - "WebKit keeps every flow: link stops are dropped (Playwright's WebKit never Tabs to links, 12-16), the remaining controls and the end of the page are still asserted in exact order; the lightbox dialog steps run in Chromium and Firefox only, with a 'webkit' test annotation, because no keyboard path reaches a map target in WebKit"
  - "Register text is entered with keyboard.type (keystrokes into the focused field), not fill(), so the focus path stays keyboard-only"
  - "The end of the page accepts focus staying on the last stop, because headless Firefox has no browser chrome to Tab into; a further focusable element would still take focus and fail"

patterns-established:
  - "Keyboard flows walk the whole page (skip link to footer to end), so a stray tabindex anywhere fails"

requirements-completed: [VERIFY-02]

coverage:
  - id: D1
    description: "Desktop navigation: the first Tab reaches the skip link, Enter focuses main and the next Tab reaches Name; Tab walks the wordmark and site.nav in order to Name, Shift+Tab walks back to the skip link"
    requirement: VERIFY-02
    verification:
      - kind: e2e
        ref: "e2e/keyboard.spec.ts#Navigation by keyboard (desktop 1440) (2 tests, chromium, firefox, webkit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "375 menu: Tab to Menu, Enter opens, Tab walks the five items, Escape closes to the Menu button; Tab past the last item moves into main and closes the menu (no trap outside a modal)"
    requirement: VERIFY-02
    verification:
      - kind: e2e
        ref: "e2e/keyboard.spec.ts#Navigation by keyboard (mobile menu, 375) (2 tests, three engines)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Photo map and lightbox: Tab reaches Map, Grid, Carousel, the four targets in altitude order, then the footer; Enter on the first target opens the dialog on Close photo; 12 Tab and 12 Shift+Tab presses stay inside and move; ArrowRight/ArrowLeft step; Escape closes with focus on the opener"
    requirement: VERIFY-02
    verification:
      - kind: e2e
        ref: "e2e/keyboard.spec.ts#Photo map and lightbox by keyboard (1440) (2 tests; dialog steps chromium and firefox, WebKit walks the controls)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Contact at 1440: skip link, nav, Name, Email, Message, checkbox, Send Message, Copy, Write an email, GitHub, LinkedIn, footer, end; honeypot never focused; empty submit focuses 'Check 3 fields', its first link (#name) and Enter focus Name; mocked 200 focuses the entry, Tab reaches Sign again, Enter focuses an empty Name (Space ticks the checkbox)"
    requirement: VERIFY-02
    verification:
      - kind: e2e
        ref: "e2e/keyboard.spec.ts#Contact by keyboard (1440) (3 tests, three engines)"
        status: pass
    human_judgment: false
  - id: D5
    description: "404: nav, Go to the homepage, Photographs, Engineering, footer, end. Error page: h1 'Something went wrong' focused on load inside the shell, then Try again, Go to the homepage, Report this error"
    requirement: VERIFY-02
    verification:
      - kind: e2e
        ref: "e2e/keyboard.spec.ts#Edge pages by keyboard (1440) (2 tests, three engines)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Tim's hands-on keyboard pass at UAT (including links in Safari with Option+Tab, which Playwright's WebKit cannot press)"
    verification: []
    human_judgment: true
    rationale: "D-22 records Tim's own keyboard run at UAT through 12-24's checklist; the automated WebKit run cannot reach links"

duration: 15min
completed: 2026-11-03
status: complete
---

# Phase 12 Plan 21: Keyboard-only Flows Summary

**`e2e/keyboard.spec.ts` drives the site with keys only: the skip link and nav, the 375 menu, the photo map and lightbox, the contact register (both submit paths) and the 404 and error pages. Each flow asserts the exact focus order from the skip link through the footer to the end of the page. All 11 flows pass in chromium, firefox and webkit (33/33, 99/99 with `--repeat-each=3`). The app needed no fix.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-11-03T00:53:55Z
- **Completed:** 2026-11-03T01:08:30Z
- **Tasks:** 2 of 2
- **Files modified:** 1 new spec (plus the deferred-items note)

## Accomplishments

- **One walk helper for exact order.** `walk` presses one key per stop and asserts `toBeFocused()` on each, with the stop's name in the message. Flows run to the footer and `expectEndOfPage`, so an extra focusable element anywhere on the page fails.
- **Navigation (1440).** On /contact: Tab reaches the skip link, Enter focuses `main#main-content`, and the next Tab reaches Name, not the nav. A second flow walks the wordmark and the five `site.nav` links to Name, then Shift+Tab walks back to the skip link.
- **Menu (375).** On /roadmap: skip link, wordmark, Menu. Enter opens the menu, Tab walks Home to Contact, and Escape closes it with focus on Menu. A second flow presses Tab once more after Contact: focus moves into main and the menu closes. The disclosure is not a trap, which covers the plan's prohibition.
- **Map and lightbox (1440).** On /photos the order is the nav, then Map, Grid, Carousel, then the four targets in altitude order (accessible names checked), then the footer. Enter on the first target opens the dialog at `/photos/<first slug>` (the path from `e2e/routes.ts`), with focus on Close photo. 12 Tab and 12 Shift+Tab presses keep focus inside the open dialog and move it between controls. ArrowRight and ArrowLeft change the URL and the h2. Escape closes the dialog and focus returns to the opener.
- **Contact (1440).** The UI-SPEC order is skip link, nav, Name, Email, Message, checkbox, Send Message, Copy, Write an email, GitHub, LinkedIn, then the three footer links and the end of the page. A focus listener on the honeypot proves it never takes focus in any contact flow.
  - Empty submit: Enter on Send Message focuses the summary (`Check 3 fields`, 3 links, the first to `#name`). Tab reaches that link and Enter focuses Name.
  - Mocked 200: the visitor types each field, ticks the checkbox with Space and presses Enter on Send. The payload is checked, the entry takes focus, Tab reaches Sign again, and Enter focuses an empty Name. No real email is sent.
- **404 and error page.** On `/__no-such-page__` (status 404) the order after the nav is Go to the homepage, Photographs, Engineering, then the footer. The error page is forced the way `disableWebGL` works: an init script makes `matchMedia` throw, so `/projects/box`'s demo terminal throws inside the page segment and `app/(site)/error.tsx` renders inside the shell. The h1 has focus on load, and Tab then reaches Try again, Go to the homepage and Report this error.

## First run (Task 1): failures per engine

`PW_PROD=1 PW_REUSE=1 npx playwright test e2e/keyboard.spec.ts --project=chromium --project=firefox --project=webkit`: 27 passed, 6 failed. All 6 were defects in the new spec:

| Engine | Failing flow | Cause | Fix (spec only) |
|--------|--------------|-------|-----------------|
| chromium, firefox, webkit | empty submit to summary | The spec compared the first summary link with Name's inline error text, which carries the sr-only `Error: ` prefix (`Expected "Error: Enter your name."`, received `"Enter your name."`) | Assert 3 summary links and that the first goes to `#name` |
| firefox | map walk, contact walk, 404 walk | `expectEndOfPage` expected the body after the last footer link. Headless Firefox keeps focus on the last stop (probe: Tab on the footer's Email link stays there) | The end of the page now accepts the body or focus staying on the last stop |

Second run: 33 passed (11 per engine). `--repeat-each=3`: 99 passed, 0 flaky.

## Fixes (Task 2)

None needed. No flow found a focus-order, trap or focus-return defect in `components/` or `app/`, so there are no `fix(12-21)` commits.

| File | Flow | Change |
|------|------|--------|
| (none) | | |

## Round 3 expected diffs

none (no file that renders pixels changed)

## Three-engine run (Task 2 action and plan-level verification, fresh build)

`PW_PROD=1 npx playwright test e2e/keyboard.spec.ts e2e/photos-lightbox.spec.ts e2e/shell.spec.ts --project=chromium --project=firefox --project=webkit` (built fresh, no reuse): 258 passed, 20 failed.

| Engine | Passed | Failed | keyboard.spec |
|--------|--------|--------|---------------|
| chromium | 96 | 0 | 11/11 |
| firefox | 89 | 2 | 11/11 |
| webkit | 73 | 18 | 11/11 |

- **WebKit (18):** all are in 12-19's "Local round-level gate" list of known WebKit failures, owned by 12-23:
  - shell: Shell landmarks x8 and the Shell mobile menu (Tab does not focus links).
  - photos-lightbox: `:353` (`page.goBack: Page crashed`); `:401`, `:411`, `:424` (close via the router); `:457`, `:539`, `:565`, `:670` (focus checks); `:883` (zoom centring).
  - `:651`, also on that list, passed in this run.
- **Firefox (2):** `photos-lightbox.spec.ts:246` (the slow-photo "Loading photo" waited 10 s under the parallel three-engine load) and `shell.spec.ts:56` /roadmap (a teardown `browserContext.close: Protocol error ... _maybeDontRestoreTabs`, a harness error, not an assertion). Rerun alone on the same build with `--repeat-each=3`: 27 of 27 passed. Neither touches this plan's code. Both are logged in `deferred-items.md` for 12-23.
- The keyboard spec passes in all three engines. The plan's "green" verification does not hold for the whole three-file command because of the 18 known WebKit failures and the 2 Firefox transients above.

Other gates: `npm run lint` exit 0 (all guards OK). `npm run type-check` exit 0. `npx eslint e2e/keyboard.spec.ts` clean. `git status --porcelain public/service-worker.js` is empty: it was restored after each server stopped. Port 3000 was free at the end.

## Task Commits

1. **Task 1: keyboard-only flows (VERIFY-02, D-22)** - `e085c01` (test)
2. **Task 2: fix every keyboard finding** - no commit (zero app findings; the three-engine run is recorded above)

**Plan metadata:** the docs(12-21) commit that adds this SUMMARY.

## Files Created/Modified

- `e2e/keyboard.spec.ts` - 11 keyboard-only flows with exact focus order (481 lines)
- `.planning/phases/12-contact-edge-pages-cleanup-verification/deferred-items.md` - the two Firefox transients, owner 12-23

## Decisions Made

- **WebKit scope.** Each flow runs in WebKit, and `walk` drops the link stops there (the 12-16 pattern). Probes for this plan confirmed the behaviour: on /contact WebKit Tabs Name, Email, Message, checkbox, Send, Copy, then the body. On /photos it Tabs Map, Grid, Carousel, then the body. On the 404 the first Tab goes to the body.
  - WebKit still asserts the exact order of the remaining controls and the end of the page. On the 404 that means the page has no non-link stop at all.
  - The lightbox dialog steps need Enter on a map target, which is a link, so they run in Chromium and Firefox only. In WebKit the test walks the controls up to Carousel, records a `webkit` annotation and returns.
  - No new tag was added: changing `playwright.config.ts` is outside this plan's files.
- **Error-page trigger.** First tried: an `IntersectionObserver` that throws. It threw in the layout's Next link prefetch, outside any React boundary, and no error page appeared. A throwing `matchMedia` reaches only the case study's `useReducedMotion` during render, so the section boundary renders and the nav stays. The `Application error:` log comes from `app/(site)/error.tsx`.
- **Typing.** The register's text goes in with `keyboard.type`, which sends keystrokes to the focused field. `fill()` would focus the field itself and bypass the walk.

## Deviations from Plan

None in scope. The plan expected Task 2 to fix app code. Every first-run failure was a defect in the new spec, fixed in `e2e/keyboard.spec.ts` (Task 1's file) before its commit. Task 2 therefore has no fix commits, and its three-engine run is recorded above.

**Total deviations:** 0. **Impact:** none.

## Issues Encountered

- The plan-level three-engine command is not fully green, but none of its failures comes from this plan. The 18 WebKit failures are the known 12-23 set, and the 2 Firefox failures were transient (details above).
- The background `npm run start` processes show as "failed" in their task notifications only because they were stopped with `taskkill`.
- The scratch probe scripts live in the session scratchpad. They were never staged.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- CI already runs the new spec on chromium and firefox (production build). WebKit joins with 12-23, and the spec already passes there.
- 12-24's UAT checklist can point Tim to this spec's order lists for his hands-on pass. In Safari, links need Option+Tab, or "Press Tab to highlight each item" turned on.
- 12-23 gets nothing from this plan for round 3 (the list is empty), and two Firefox transients to look at.

---
*Phase: 12-contact-edge-pages-cleanup-verification*
*Completed: 2026-11-03*

## Self-Check: PASSED

- FOUND: e2e/keyboard.spec.ts (481 lines, at least 120), 12-21-SUMMARY.md
- FOUND: e085c01 is an ancestor of HEAD; `commits: 1` measured with `git rev-list --count beb8006..HEAD` before the metadata commit
- `--list` (chromium) = 11 tests (at least 8); `grep -c "\.click("` = 0; `grep -c "\.focus()"` = 0; no `.only(`, `.skip(` or `.fixme(`; `from './routes'` present
- Keyboard spec: chromium 11, firefox 11, webkit 11 passed on the fresh build; lint and type-check exit 0; service worker clean; port 3000 free
